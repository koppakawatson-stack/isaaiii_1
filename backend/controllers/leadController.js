import Lead from '../models/Lead.js';
import ActivityLog from '../models/ActivityLog.js';

// Helper to log activities
const logActivity = async (userId, userName, action, details) => {
  try {
    await ActivityLog.create({ userId, userName, action, details });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

// Helper to emit socket event
const emitSocketEvent = (req, event, data) => {
  if (req.io) {
    req.io.emit(event, data);
  }
};

// @desc    Get all leads (Filtered by BDA assignment if role is BDA)
// @route   GET /api/leads
// @access  Private
export const getLeads = async (req, res) => {
  try {
    let query = {};

    // If role is BDA, only show leads assigned to this user
    if (req.user.role === 'BDA') {
      query.assignedTo = req.user.id;
    }

    const leads = await Lead.find(query).populate('assignedTo', 'name email role');
    res.json({ success: true, count: leads.length, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single lead details
// @route   GET /api/leads/:id
// @access  Private
export const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email role');

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Access control: BDA can only view their own leads
    if (req.user.role === 'BDA' && lead.assignedTo?._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied: lead assigned to another representative' });
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Private
export const createLead = async (req, res) => {
  try {
    const { companyName, contactPerson, email, phone, dealAmount, status, assignedTo, expectedClosingDate, priority, notes, leadSource } = req.body;

    // Build lead object
    const leadData = {
      companyName,
      contactPerson,
      email,
      phone,
      dealAmount: dealAmount || 0,
      status: status || 'New',
      expectedClosingDate,
      priority: priority || 'Medium',
      notes: notes || '',
      leadSource: leadSource || 'Website'
    };

    // If user is BDA, automatically assign to themselves
    if (req.user.role === 'BDA') {
      leadData.assignedTo = req.user.id;
    } else {
      // Admin/Manager can assign to anyone (or leave null)
      leadData.assignedTo = assignedTo || null;
    }

    // Default AI score simulation for new leads
    leadData.aiScore = Math.floor(Math.random() * 41) + 40; // Random score between 40 and 80

    const lead = await Lead.create(leadData);
    const populatedLead = await Lead.findById(lead._id).populate('assignedTo', 'name email role');

    // Logs & Socket Events
    await logActivity(req.user.id, req.user.name, 'CREATE_LEAD', `Created lead for ${companyName} ($${leadData.dealAmount})`);
    emitSocketEvent(req, 'notification', {
      title: 'New Lead Created',
      message: `${req.user.name} created a new lead: ${companyName}`,
      type: 'success',
      timestamp: new Date()
    });

    res.status(201).json({ success: true, data: populatedLead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update lead information
// @route   PUT /api/leads/:id
// @access  Private
export const updateLead = async (req, res) => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Access control: BDA can only edit their own leads
    if (req.user.role === 'BDA' && lead.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied: lead assigned to another representative' });
    }

    // BDAs cannot re-assign leads
    const updates = { ...req.body };
    if (req.user.role === 'BDA') {
      delete updates.assignedTo;
    }

    const previousStatus = lead.status;
    const previousAssignee = lead.assignedTo;

    lead = await Lead.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).populate('assignedTo', 'name email role');

    // Logs & Socket Events
    const statusChangedText = previousStatus !== lead.status ? ` status from ${previousStatus} to ${lead.status}` : '';
    await logActivity(req.user.id, req.user.name, 'UPDATE_LEAD', `Updated lead details for ${lead.companyName}${statusChangedText}`);

    if (previousStatus !== lead.status) {
      emitSocketEvent(req, 'notification', {
        title: 'Lead Stage Updated',
        message: `${lead.companyName} stage updated to ${lead.status}`,
        type: 'info',
        timestamp: new Date()
      });
    }

    if (updates.assignedTo && String(previousAssignee) !== String(updates.assignedTo)) {
      emitSocketEvent(req, 'notification', {
        title: 'Lead Reassigned',
        message: `Lead ${lead.companyName} was reassigned to ${lead.assignedTo?.name}`,
        type: 'warning',
        timestamp: new Date()
      });
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a lead
// @route   DELETE /api/leads/:id
// @access  Private (Admin & Manager only)
export const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Restrict deletion to Admin and Manager roles
    if (req.user.role === 'BDA') {
      return res.status(403).json({ success: false, message: 'Access denied: only Administrators and Managers can delete leads' });
    }

    await Lead.findByIdAndDelete(req.params.id);

    // Logs & Socket Events
    await logActivity(req.user.id, req.user.name, 'DELETE_LEAD', `Deleted lead of company ${lead.companyName}`);
    emitSocketEvent(req, 'notification', {
      title: 'Lead Deleted',
      message: `Lead for ${lead.companyName} has been deleted.`,
      type: 'danger',
      timestamp: new Date()
    });

    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
