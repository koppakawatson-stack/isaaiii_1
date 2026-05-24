import Lead from '../models/Lead.js';
import User from '../models/User.js';
import CommunicationLog from '../models/CommunicationLog.js';

// @desc    Get team performance leaderboard stats
// @route   GET /api/performance/leaderboard
// @access  Private (Admin & Manager can view detail; BDAs can view generic leaderboard)
export const getLeaderboard = async (req, res) => {
  try {
    // Find all BDA and Manager users
    const employees = await User.find({ role: { $in: ['BDA', 'Manager'] } }).select('name email role');

    const stats = await Promise.all(
      employees.map(async (emp) => {
        // 1. Total leads assigned
        const totalLeads = await Lead.countDocuments({ assignedTo: emp._id });

        // 2. Won leads
        const wonLeads = await Lead.countDocuments({ assignedTo: emp._id, status: 'Won' });

        // 3. Lost leads
        const lostLeads = await Lead.countDocuments({ assignedTo: emp._id, status: 'Lost' });

        // 4. Total revenue generated
        const wonPipeline = await Lead.aggregate([
          { $match: { assignedTo: emp._id, status: 'Won' } },
          { $group: { _id: null, totalRevenue: { $sum: '$dealAmount' } } }
        ]);
        const revenue = wonPipeline[0]?.totalRevenue || 0;

        // 5. Activity count (logs logged by this user)
        const activityCount = await CommunicationLog.countDocuments({ performedBy: emp._id });

        // 6. Conversion rate
        const closedCount = wonLeads + lostLeads;
        const conversionRate = closedCount > 0 ? Math.round((wonLeads / closedCount) * 100) : 0;

        return {
          employee: {
            _id: emp._id,
            name: emp.name,
            email: emp.email,
            role: emp.role
          },
          totalLeads,
          wonLeads,
          revenue,
          activityCount,
          conversionRate
        };
      })
    );

    // Sort by revenue generated (highest first), then by won leads
    stats.sort((a, b) => b.revenue - a.revenue || b.wonLeads - a.wonLeads);

    res.json({
      success: true,
      count: stats.length,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
