const Task = require('../models/Task');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { asyncHandler, AppError, paginate } = require('../middleware/validate');

// Helper: Create task notification
const createTaskNotification = async (type, recipientId, senderId, task, message) => {
  if (!recipientId || recipientId.equals(senderId)) return;
  await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type,
    title: task.title,
    message,
    link: `/tasks/${task._id}`,
    entityType: 'task',
    entityId: task._id
  });
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const { status, priority, assignee, project, type, search, sortBy, sortOrder, dueDate, tags } = req.query;

  const filter = { isArchived: false };

  // Role-based filtering
  if (req.user.role === 'user') {
    filter.$or = [{ assignee: req.user._id }, { createdBy: req.user._id }];
  }

  if (status) filter.status = { $in: status.split(',') };
  if (priority) filter.priority = { $in: priority.split(',') };
  if (assignee) filter.assignee = assignee;
  if (project) filter.project = project;
  if (type) filter.type = type;
  if (tags) filter.tags = { $in: tags.split(',') };
  if (search) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ]
    });
  }

  // Date filter
  if (dueDate === 'overdue') {
    filter.dueDate = { $lt: new Date() };
    filter.status = { $nin: ['completed', 'cancelled'] };
  } else if (dueDate === 'today') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    filter.dueDate = { $gte: start, $lte: end };
  } else if (dueDate === 'week') {
    const start = new Date();
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    filter.dueDate = { $gte: start, $lte: end };
  }

  const sort = {};
  if (sortBy) {
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = -1;
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignee', 'name email avatar role')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color icon')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: tasks,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('assignee', 'name email avatar role department')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name color icon')
    .populate('statusHistory.changedBy', 'name avatar')
    .populate('dependencies', 'title status priority');

  if (!task) return next(new AppError('Task not found', 404));

  // Permission check for regular users
  if (req.user.role === 'user') {
    const canView = task.assignee?._id.equals(req.user._id) || task.createdBy._id.equals(req.user._id);
    if (!canView) return next(new AppError('Not authorized to view this task', 403));
  }

  res.json({ success: true, data: task });
});

// @desc    Create task
// @route   POST /api/tasks
// @access  Private (Admin, Manager create for anyone; User creates for self)
exports.createTask = asyncHandler(async (req, res, next) => {
  const { title, description, status, priority, type, assignee, project, dueDate, startDate, estimatedHours, tags, dependencies } = req.body;

  // Users can only assign tasks to themselves
  let taskAssignee = assignee;
  if (req.user.role === 'user') {
    taskAssignee = req.user._id;
  }

  const task = await Task.create({
    title, description, status, priority, type,
    assignee: taskAssignee,
    project, dueDate, startDate, estimatedHours, tags, dependencies,
    createdBy: req.user._id,
    statusHistory: [{
      from: null,
      to: status || 'todo',
      changedBy: req.user._id,
      note: 'Task created'
    }]
  });

  await task.populate([
    { path: 'assignee', select: 'name email avatar role' },
    { path: 'createdBy', select: 'name email avatar' },
    { path: 'project', select: 'name color icon' }
  ]);

  // Activity log
  await Activity.create({
    user: req.user._id,
    action: 'task_created',
    entity: 'task',
    entityId: task._id,
    entityTitle: task.title,
    details: { priority: task.priority, assignee: task.assignee?.name }
  });

  // Notify assignee
  if (taskAssignee && taskAssignee.toString() !== req.user._id.toString()) {
    await createTaskNotification(
      'task_assigned',
      taskAssignee,
      req.user._id,
      task,
      `${req.user.name} assigned you a task: "${task.title}"`
    );
  }

  res.status(201).json({ success: true, message: 'Task created successfully', data: task });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);
  if (!task) return next(new AppError('Task not found', 404));

  // Permission check
  if (req.user.role === 'user') {
    const canEdit = task.assignee?.equals(req.user._id) || task.createdBy.equals(req.user._id);
    if (!canEdit) return next(new AppError('Not authorized to update this task', 403));
  }

  const { title, description, status, priority, type, assignee, project, dueDate, startDate, estimatedHours, actualHours, tags, dependencies } = req.body;

  const oldStatus = task.status;
  const oldPriority = task.priority;
  const oldAssignee = task.assignee;

  // Build update object
  const updateData = { title, description, status, priority, type, project, dueDate, startDate, estimatedHours, actualHours, tags, dependencies };

  // Only admin/manager can reassign
  if (req.user.role !== 'user' && assignee !== undefined) {
    updateData.assignee = assignee;
  }

  // Track status history
  if (status && status !== oldStatus) {
    updateData.$push = {
      statusHistory: {
        from: oldStatus,
        to: status,
        changedBy: req.user._id,
        changedAt: new Date(),
        note: req.body.statusNote || ''
      }
    };
  }

  task = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
    .populate('assignee', 'name email avatar role')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name color icon');

  // Activity logs
  const activities = [];
  if (status && status !== oldStatus) {
    activities.push(Activity.create({
      user: req.user._id,
      action: 'task_status_changed',
      entity: 'task',
      entityId: task._id,
      entityTitle: task.title,
      details: { from: oldStatus, to: status }
    }));
    // Notify assignee if status changed
    if (task.assignee && !task.assignee._id.equals(req.user._id)) {
      activities.push(createTaskNotification('task_status_changed', task.assignee._id, req.user._id, task,
        `Task "${task.title}" status changed from ${oldStatus} to ${status}`));
    }
  }
  if (priority && priority !== oldPriority) {
    activities.push(Activity.create({
      user: req.user._id,
      action: 'task_priority_changed',
      entity: 'task',
      entityId: task._id,
      entityTitle: task.title,
      details: { from: oldPriority, to: priority }
    }));
  }
  // Reassigned
  if (assignee && oldAssignee?.toString() !== assignee) {
    activities.push(Activity.create({
      user: req.user._id,
      action: 'task_assigned',
      entity: 'task',
      entityId: task._id,
      entityTitle: task.title,
      details: { assignedTo: assignee }
    }));
    activities.push(createTaskNotification('task_assigned', assignee, req.user._id, task,
      `${req.user.name} assigned you task: "${task.title}"`));
  }
  activities.push(Activity.create({
    user: req.user._id,
    action: 'task_updated',
    entity: 'task',
    entityId: task._id,
    entityTitle: task.title
  }));

  await Promise.all(activities);

  res.json({ success: true, message: 'Task updated successfully', data: task });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Admin, Manager
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new AppError('Task not found', 404));

  // Soft delete - archive
  task.isArchived = true;
  await task.save();

  await Activity.create({
    user: req.user._id,
    action: 'task_deleted',
    entity: 'task',
    entityId: task._id,
    entityTitle: task.title
  });

  res.json({ success: true, message: 'Task archived successfully' });
});

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
exports.getTaskStats = asyncHandler(async (req, res) => {
  const matchFilter = { isArchived: false };
  if (req.user.role === 'user') {
    matchFilter.$or = [{ assignee: req.user._id }, { createdBy: req.user._id }];
  }

  const [statusStats, priorityStats, overdueCount, recentTasks] = await Promise.all([
    Task.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Task.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]),
    Task.countDocuments({
      ...matchFilter,
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] }
    }),
    Task.find(matchFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('assignee', 'name avatar')
      .select('title status priority dueDate assignee')
  ]);

  res.json({
    success: true,
    data: {
      byStatus: statusStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      byPriority: priorityStats.reduce((acc, p) => ({ ...acc, [p._id]: p.count }), {}),
      overdueCount,
      recentTasks
    }
  });
});

// @desc    Bulk update tasks
// @route   PUT /api/tasks/bulk
// @access  Admin, Manager
exports.bulkUpdateTasks = asyncHandler(async (req, res, next) => {
  const { taskIds, update } = req.body;
  if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
    return next(new AppError('Task IDs are required', 400));
  }

  const allowedUpdates = ['status', 'priority', 'assignee'];
  const updateData = {};
  allowedUpdates.forEach(key => {
    if (update[key] !== undefined) updateData[key] = update[key];
  });

  await Task.updateMany({ _id: { $in: taskIds } }, updateData);

  await Activity.create({
    user: req.user._id,
    action: 'task_updated',
    entity: 'task',
    entityTitle: 'Bulk Update',
    details: { taskCount: taskIds.length, update: updateData }
  });

  res.json({ success: true, message: `${taskIds.length} tasks updated successfully` });
});
