const Activity = require('../models/Activity');
const { asyncHandler, paginate } = require('../middleware/validate');

// @desc    Get activity log
// @route   GET /api/activity
// @access  Private
exports.getActivity = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const { userId, entity, action, startDate, endDate } = req.query;

  const filter = {};

  // Regular users only see their own activity
  if (req.user.role === 'user') {
    filter.user = req.user._id;
  } else if (userId) {
    filter.user = userId;
  }

  if (entity) filter.entity = entity;
  if (action) filter.action = action;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .populate('user', 'name email avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Activity.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: activities,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

// @desc    Get activity summary stats
// @route   GET /api/activity/stats
// @access  Admin, Manager
exports.getActivityStats = asyncHandler(async (req, res) => {
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [actionStats, userStats, dailyStats] = await Promise.all([
    Activity.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Activity.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { count: 1, 'user.name': 1, 'user.avatar': 1 } }
    ]),
    Activity.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
  ]);

  res.json({
    success: true,
    data: { actionStats, userStats, dailyStats }
  });
});
