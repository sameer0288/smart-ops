const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { asyncHandler } = require('../middleware/validate');

// @desc    Get dashboard overview
// @route   GET /api/dashboard
// @access  Private
exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const taskFilter = role === 'user'
    ? { isArchived: false, $or: [{ assignee: userId }, { createdBy: userId }] }
    : { isArchived: false };

  const [
    taskStatusStats,
    priorityStats,
    totalUsers,
    totalProjects,
    recentActivity,
    upcomingTasks,
    completionTrend,
    topPerformers
  ] = await Promise.all([
    // Task status breakdown
    Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    // Priority breakdown
    Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]),
    // Total users (admin/manager only)
    role !== 'user' ? User.countDocuments({ isActive: true }) : Promise.resolve(null),
    // Total projects
    Project.countDocuments({ isArchived: false }),
    // Recent activity
    Activity.find(role === 'user' ? { user: userId } : {})
      .populate('user', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(15)
      .select('action entity entityTitle details createdAt user'),
    // Upcoming tasks (due in next 7 days)
    Task.find({
      ...taskFilter,
      dueDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      status: { $nin: ['completed', 'cancelled'] }
    })
      .populate('assignee', 'name avatar')
      .select('title status priority dueDate assignee project')
      .sort({ dueDate: 1 })
      .limit(8),
    // Completion trend (last 7 days)
    Task.aggregate([
      {
        $match: {
          ...taskFilter,
          completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    // Top performers (admin/manager)
    role !== 'user' ? Task.aggregate([
      { $match: { status: 'completed', isArchived: false, completedAt: { $gte: startOfMonth } } },
      { $group: { _id: '$assignee', completed: { $sum: 1 } } },
      { $sort: { completed: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { completed: 1, 'user.name': 1, 'user.avatar': 1, 'user.role': 1 } }
    ]) : Promise.resolve([])
  ]);

  // Overdue tasks
  const overdueCount = await Task.countDocuments({
    ...taskFilter,
    dueDate: { $lt: now },
    status: { $nin: ['completed', 'cancelled'] }
  });

  // Total tasks
  const totalTasks = await Task.countDocuments(taskFilter);

  // Completed this month
  const completedThisMonth = await Task.countDocuments({
    ...taskFilter,
    status: 'completed',
    completedAt: { $gte: startOfMonth }
  });

  // Tasks created this week
  const createdThisWeek = await Task.countDocuments({
    ...taskFilter,
    createdAt: { $gte: startOfWeek }
  });

  const statusMap = taskStatusStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
  const priorityMap = priorityStats.reduce((acc, p) => ({ ...acc, [p._id]: p.count }), {});

  res.json({
    success: true,
    data: {
      summary: {
        totalTasks,
        overdueCount,
        completedThisMonth,
        createdThisWeek,
        totalUsers: totalUsers || 0,
        totalProjects,
        completionRate: totalTasks > 0 ? Math.round((statusMap.completed || 0) / totalTasks * 100) : 0
      },
      tasksByStatus: statusMap,
      tasksByPriority: priorityMap,
      recentActivity,
      upcomingTasks,
      completionTrend,
      topPerformers
    }
  });
});

// @desc    Get team workload distribution
// @route   GET /api/dashboard/workload
// @access  Admin, Manager
exports.getWorkloadDistribution = asyncHandler(async (req, res) => {
  const workload = await Task.aggregate([
    { $match: { isArchived: false, status: { $nin: ['completed', 'cancelled'] } } },
    { $group: { _id: '$assignee', count: { $sum: 1 }, critical: { $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] } } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmpty: true } },
    { $project: { count: 1, critical: 1, 'user.name': 1, 'user.avatar': 1, 'user.role': 1, 'user.department': 1 } }
  ]);

  res.json({ success: true, data: workload });
});
