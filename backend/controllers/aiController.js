import Lead from '../models/Lead.js';
import CommunicationLog from '../models/CommunicationLog.js';

// @desc    Calculate and update AI conversion probability score for a lead
// @route   POST /api/ai/score/:leadId
// @access  Private
export const scoreLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const lead = await Lead.findById(leadId);
    
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // 1. Base Score
    let score = 35;

    // 2. Add points for status
    if (lead.status === 'Contacted') score += 15;
    else if (lead.status === 'Negotiation') score += 30;
    else if (lead.status === 'Won') score += 65;
    else if (lead.status === 'Lost') score -= 25;

    // 3. Add points for communications activity
    const activityCount = await CommunicationLog.countDocuments({ leadId });
    score += Math.min(activityCount * 6, 25); // cap communication score at 25 points

    // 4. Add points for expected closing date proximity
    if (lead.expectedClosingDate) {
      const daysToClose = Math.ceil((new Date(lead.expectedClosingDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysToClose > 0 && daysToClose <= 14) {
        score += 10; // High urgency
      } else if (daysToClose > 14 && daysToClose <= 30) {
        score += 5; // Moderate urgency
      }
    }

    // 5. Constrain score between 5 and 99
    score = Math.max(5, Math.min(99, score));

    // Save back to db
    lead.aiScore = score;
    await lead.save();

    res.json({
      success: true,
      data: {
        leadId: lead._id,
        companyName: lead.companyName,
        aiScore: score,
        factors: {
          activityCount,
          status: lead.status,
          hasClosingDate: !!lead.expectedClosingDate
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate structured sales outreach email templates
// @route   POST /api/ai/email
// @access  Private
export const generateEmail = async (req, res) => {
  try {
    const { companyName, contactPerson, stage, keyHighlight } = req.body;

    if (!companyName || !contactPerson) {
      return res.status(400).json({ success: false, message: 'Please provide company name and contact person.' });
    }

    let subject = '';
    let body = '';

    if (stage === 'Introductory') {
      subject = `Partnership Discussion: Optimizing Manufacturing Workflow at ${companyName}`;
      body = `Hi ${contactPerson},

I hope this email finds you well.

I am reaching out from the Business Development team. We specialize in assisting manufacturing enterprises like ${companyName} optimize operations, reduce machine downtime, and boost production efficiency by up to 18%.

${keyHighlight ? `I noted that your current operations focus on "${keyHighlight}". ` : ''}I would love to schedule a brief 10-minute introduction call next Tuesday at 2:00 PM to explore how we can support your production pipeline.

Would you be open to a quick chat?

Best regards,
[Your Name]
BDA Representative`;
    } else if (stage === 'FollowUp') {
      subject = `Following up on our discussions - ${companyName}`;
      body = `Hi ${contactPerson},

It was great speaking with you recently regarding the supply chain needs at ${companyName}. 

I am following up to see if you've had a chance to review the industrial manufacturing pricing catalog we shared. ${keyHighlight ? `Specifically regarding your interest in "${keyHighlight}", we can expedite dispatch times if ordered this month. ` : ''}

I would be happy to jump on a short call to address any compliance or procurement questions your team might have.

Looking forward to hearing from you.

Best regards,
[Your Name]
BDA Representative`;
    } else { // Proposal/Negotiation
      subject = `Commercial Proposal & Terms: Collaboration with ${companyName}`;
      body = `Hi ${contactPerson},

Thank you for the detailed feedback during our negotiation session yesterday.

Pursuant to your requirements, we have tailored our bulk industrial manufacturing supply terms. ${keyHighlight ? `As discussed, we have incorporated your request for "${keyHighlight}" at a discounted rate. ` : 'We have structured a volume discount of 12% for the first three quarters. '}

I have attached the revised commercial agreement document. Please review it at your convenience. I will give you a call on Thursday morning to finalize the terms and discuss execution dates.

Warm regards,
[Your Name]
BDA Representative`;
    }

    res.json({
      success: true,
      data: {
        subject,
        body
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
