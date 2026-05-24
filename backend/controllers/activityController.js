import ActivityLog from '../models/ActivityLog.js';

// @desc    Get all activity logs
// @route   GET /api/activity-logs
// @access  Private
export const getActivityLogs = async (req, res) => {
  try {
    let query = {};

    // BDAs should only see their own activities, Admin/Manager see all
    if (req.user.role === 'BDA') {
      query.userId = req.user.id;
    }

    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
