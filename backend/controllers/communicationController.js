import CommunicationLog from '../models/CommunicationLog.js';
import Lead from '../models/Lead.js';

// @desc    Add a communication log
// @route   POST /api/communications
// @access  Private
export const addLog = async (req, res) => {
  try {
    const { leadId, type, summary, followUpDate } = req.body;

    // Check if the lead exists
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Access control: BDA can only log communications for leads assigned to them
    if (req.user.role === 'BDA' && lead.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied: this lead is assigned to another representative' });
    }

    // Create the log
    const log = await CommunicationLog.create({
      leadId,
      type,
      summary,
      performedBy: req.user.id,
      followUpDate: followUpDate || null
    });

    // Update lead's updatedAt field
    await Lead.findByIdAndUpdate(leadId, { updatedAt: Date.now() });

    const populatedLog = await CommunicationLog.findById(log._id)
      .populate('performedBy', 'name email role')
      .populate('leadId', 'companyName contactPerson');

    res.status(201).json({ success: true, data: populatedLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get communication logs for a specific lead
// @route   GET /api/communications/lead/:leadId
// @access  Private
export const getLogsByLead = async (req, res) => {
  try {
    const { leadId } = req.params;

    // Verify lead access
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (req.user.role === 'BDA' && lead.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied: this lead is assigned to another representative' });
    }

    const logs = await CommunicationLog.find({ leadId })
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get upcoming/all follow-ups
// @route   GET /api/communications/followups
// @access  Private
export const getUpcomingFollowUps = async (req, res) => {
  try {
    let query = {
      followUpDate: { $ne: null }
    };

    // Filter by completed status if query parameter exists
    if (req.query.completed !== undefined) {
      query.followUpCompleted = req.query.completed === 'true';
    }

    // If BDA, find leads assigned to them first, then filter logs by those leads
    if (req.user.role === 'BDA') {
      const myLeads = await Lead.find({ assignedTo: req.user.id }).select('_id');
      const leadIds = myLeads.map(l => l._id);
      query.leadId = { $in: leadIds };
    }

    const followups = await CommunicationLog.find(query)
      .populate('leadId', 'companyName contactPerson email phone priority status')
      .populate('performedBy', 'name')
      .sort({ followUpDate: 1 });

    res.json({ success: true, count: followups.length, data: followups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle follow-up completion status
// @route   PUT /api/communications/followup/:id/toggle
// @access  Private
export const toggleFollowUpComplete = async (req, res) => {
  try {
    const log = await CommunicationLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Follow-up log not found' });
    }

    // Verify lead access
    const lead = await Lead.findById(log.leadId);
    if (req.user.role === 'BDA' && lead?.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    log.followUpCompleted = !log.followUpCompleted;
    log.followUpCompletedAt = log.followUpCompleted ? new Date() : null;
    await log.save();

    const populatedLog = await CommunicationLog.findById(log._id)
      .populate('leadId', 'companyName contactPerson email phone priority status')
      .populate('performedBy', 'name');

    res.json({ success: true, data: populatedLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
