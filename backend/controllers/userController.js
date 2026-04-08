const User = require('../models/User');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { asyncHandler, AppError, paginate } = require('../middleware/validate');

// @desc    Get all users
// @route   GET /api/users
// @access  Admin, Manager
exports.getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const { role, isActive, search } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin, Manager
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return next(new AppError('User not found', 404));

  // Get user's task stats
  const [taskStats] = await Task.aggregate([
    { $match: { assignee: user._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              { $and: [{ $lt: ['$dueDate', new Date()] }, { $ne: ['$status', 'completed'] }, { $ne: ['$status', 'cancelled'] }] },
              1, 0
            ]
          }
        }
      }
    }
  ]);

  res.json({ success: true, data: { ...user.toObject(), taskStats: taskStats || { total: 0, completed: 0, inProgress: 0, overdue: 0 } } });
});

// @desc    Create user (Admin only)
// @route   POST /api/users
// @access  Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, department, designation } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return next(new AppError('Email already registered', 400));

  const user = await User.create({ name, email, password, role, department, designation });

  await Activity.create({
    user: req.user._id,
    action: 'user_created',
    entity: 'user',
    entityId: user._id,
    entityTitle: user.name,
    details: { createdBy: req.user.name, role: user.role }
  });

  res.status(201).json({ success: true, message: 'User created successfully', data: user });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const { name, email, role, department, designation, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));

  const oldRole = user.role;
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, role, department, designation, isActive },
    { new: true, runValidators: true }
  ).select('-password');

  const actions = [];
  if (oldRole !== role) {
    actions.push(Activity.create({
      user: req.user._id,
      action: 'user_role_changed',
      entity: 'user',
      entityId: user._id,
      entityTitle: user.name,
      details: { from: oldRole, to: role }
    }));
  }
  actions.push(Activity.create({
    user: req.user._id,
    action: 'user_updated',
    entity: 'user',
    entityId: user._id,
    entityTitle: user.name
  }));
  await Promise.all(actions);

  res.json({ success: true, message: 'User updated successfully', data: updatedUser });
});

// @desc    Delete/Deactivate user
// @route   DELETE /api/users/:id
// @access  Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  if (user._id.equals(req.user._id)) return next(new AppError('You cannot delete your own account', 400));

  // Soft delete - deactivate
  user.isActive = false;
  await user.save();

  await Activity.create({
    user: req.user._id,
    action: 'user_updated',
    entity: 'user',
    entityId: user._id,
    entityTitle: user.name,
    details: { action: 'deactivated' }
  });

  res.json({ success: true, message: 'User deactivated successfully' });
});

// @desc    Get user workload summary
// @route   GET /api/users/:id/workload
// @access  Admin, Manager
exports.getUserWorkload = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));

  const tasks = await Task.find({ assignee: req.params.id, isArchived: false })
    .select('title status priority dueDate project')
    .populate('project', 'name color');

  const summary = {
    total: tasks.length,
    byStatus: {},
    byPriority: {},
    overdue: 0,
    dueSoon: 0
  };

  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  tasks.forEach(task => {
    summary.byStatus[task.status] = (summary.byStatus[task.status] || 0) + 1;
    summary.byPriority[task.priority] = (summary.byPriority[task.priority] || 0) + 1;
    if (task.dueDate && task.status !== 'completed' && task.status !== 'cancelled') {
      if (task.dueDate < now) summary.overdue++;
      else if (task.dueDate <= threeDaysLater) summary.dueSoon++;
    }
  });

  res.json({ success: true, data: { user: { id: user._id, name: user.name, role: user.role }, tasks, summary } });
});
