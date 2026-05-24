import Lead from '../models/Lead.js';
import User from '../models/User.js';

// @desc    Get aggregate stats for Dashboard
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const isBDA = req.user.role === 'BDA';
    const matchQuery = isBDA ? { assignedTo: req.user.id } : {};

    // 1. Total Leads
    const totalLeads = await Lead.countDocuments(matchQuery);

    // 2. Leads by status
    const newCount = await Lead.countDocuments({ ...matchQuery, status: 'New' });
    const contactedCount = await Lead.countDocuments({ ...matchQuery, status: 'Contacted' });
    const followupCount = await Lead.countDocuments({ ...matchQuery, status: 'Follow-up' });
    const negotiationCount = await Lead.countDocuments({ ...matchQuery, status: 'Negotiation' });
    const wonCount = await Lead.countDocuments({ ...matchQuery, status: 'Won' });
    const lostCount = await Lead.countDocuments({ ...matchQuery, status: 'Lost' });

    // 3. Revenue calculations
    const revenueStats = await Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$dealAmount' },
          wonValue: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, '$dealAmount', 0] } },
          pipelineValue: {
            $sum: {
              $cond: [
                { $in: ['$status', ['New', 'Contacted', 'Follow-up', 'Negotiation']] },
                '$dealAmount',
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = revenueStats[0] || { totalValue: 0, wonValue: 0, pipelineValue: 0 };

    // 4. Conversion Rate (Won / (Won + Lost)) or (Won / Total)
    const closedCount = wonCount + lostCount;
    const conversionRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

    // 5. Monthly Sales Aggregation (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySales = await Lead.aggregate([
      {
        $match: {
          ...matchQuery,
          status: 'Won',
          updatedAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' }
          },
          revenue: { $sum: '$dealAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format monthly sales (fill in zeroes for empty months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlySales = [];
    
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // 1-indexed

      const match = monthlySales.find(
        s => s._id.year === year && s._id.month === month
      );

      formattedMonthlySales.push({
        month: `${monthNames[month - 1]} ${year.toString().slice(-2)}`,
        revenue: match ? match.revenue : 0,
        dealsCount: match ? match.count : 0
      });
    }

    // 6. Lead Source distribution
    const sourceWebsite = await Lead.countDocuments({ ...matchQuery, leadSource: 'Website' });
    const sourceReferral = await Lead.countDocuments({ ...matchQuery, leadSource: 'Referral' });
    const sourceExhibition = await Lead.countDocuments({ ...matchQuery, leadSource: 'Exhibition' });
    const sourceColdCall = await Lead.countDocuments({ ...matchQuery, leadSource: 'Cold Call' });
    const sourceOthers = await Lead.countDocuments({ ...matchQuery, leadSource: 'Others' });

    res.json({
      success: true,
      data: {
        totalLeads,
        statusCounts: {
          New: newCount,
          Contacted: contactedCount,
          FollowUp: followupCount,
          Negotiation: negotiationCount,
          Won: wonCount,
          Lost: lostCount
        },
        revenue: {
          total: stats.totalValue,
          won: stats.wonValue,
          pipeline: stats.pipelineValue
        },
        conversionRate,
        monthlySales: formattedMonthlySales,
        sourceCounts: {
          Website: sourceWebsite,
          Referral: sourceReferral,
          Exhibition: sourceExhibition,
          ColdCall: sourceColdCall,
          Others: sourceOthers
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
