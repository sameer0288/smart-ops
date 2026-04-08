const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { asyncHandler, AppError, paginate } = require('../middleware/validate');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const { status, search, sortBy } = req.query;

  const filter = { isArchived: false };

  // Users only see projects they're members of
  if (req.user.role === 'user') {
    filter.$or = [
      { 'members.user': req.user._id },
      { manager: req.user._id },
      { createdBy: req.user._id }
    ];
  }

  if (status) filter.status = status;
  if (search) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    });
  }

  const sort = sortBy ? { [sortBy]: -1 } : { createdAt: -1 };

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('manager', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('members.user', 'name email avatar role')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Project.countDocuments(filter)
  ]);

  // Attach task counts
  const projectIds = projects.map(p => p._id);
  const taskCounts = await Task.aggregate([
    { $match: { project: { $in: projectIds }, isArchived: false } },
    { $group: { _id: '$project', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
  ]);
  const taskCountMap = taskCounts.reduce((acc, t) => { acc[t._id] = t; return acc; }, {});

  const projectsWithStats = projects.map(p => ({
    ...p.toObject(),
    taskStats: taskCountMap[p._id] || { total: 0, completed: 0 }
  }));

  res.json({
    success: true,
    data: projectsWithStats,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('manager', 'name email avatar role')
    .populate('createdBy', 'name email avatar')
    .populate('members.user', 'name email avatar role department');

  if (!project) return next(new AppError('Project not found', 404));

  // Permission check
  if (req.user.role === 'user') {
    const isMember = project.members.some(m => m.user._id.equals(req.user._id)) ||
      project.manager._id.equals(req.user._id) ||
      project.createdBy._id.equals(req.user._id);
    if (!isMember) return next(new AppError('Not authorized to view this project', 403));
  }

  // Get task breakdown
  const taskStats = await Task.aggregate([
    { $match: { project: project._id, isArchived: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const tasks = await Task.find({ project: project._id, isArchived: false })
    .populate('assignee', 'name avatar')
    .select('title status priority dueDate assignee type')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    success: true,
    data: {
      ...project.toObject(),
      taskStats: taskStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      recentTasks: tasks
    }
  });
});

// @desc    Create project
// @route   POST /api/projects
// @access  Admin, Manager
exports.createProject = asyncHandler(async (req, res, next) => {
  const { name, description, status, priority, color, icon, manager, members, startDate, endDate, budget, tags } = req.body;

  const project = await Project.create({
    name, description, status, priority, color, icon,
    manager: manager || req.user._id,
    createdBy: req.user._id,
    members: members || [],
    startDate, endDate, budget, tags
  });

  await project.populate([
    { path: 'manager', select: 'name email avatar' },
    { path: 'members.user', select: 'name email avatar' }
  ]);

  await Activity.create({
    user: req.user._id,
    action: 'project_created',
    entity: 'project',
    entityId: project._id,
    entityTitle: project.name
  });

  // Notify members
  if (members && members.length > 0) {
    const notifications = members
      .filter(m => m.user !== req.user._id.toString())
      .map(m => ({
        recipient: m.user,
        sender: req.user._id,
        type: 'project_invitation',
        title: project.name,
        message: `${req.user.name} added you to project "${project.name}"`,
        link: `/projects/${project._id}`,
        entityType: 'project',
        entityId: project._id
      }));
    if (notifications.length > 0) await Notification.insertMany(notifications);
  }

  res.status(201).json({ success: true, message: 'Project created successfully', data: project });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Admin, Manager (own projects)
exports.updateProject = asyncHandler(async (req, res, next) => {
  let project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));

  // Manager can only update their own projects
  if (req.user.role === 'manager' && !project.manager.equals(req.user._id) && !project.createdBy.equals(req.user._id)) {
    return next(new AppError('Not authorized to update this project', 403));
  }

  project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('manager', 'name email avatar')
    .populate('members.user', 'name email avatar');

  await Activity.create({
    user: req.user._id,
    action: 'project_updated',
    entity: 'project',
    entityId: project._id,
    entityTitle: project.name
  });

  res.json({ success: true, message: 'Project updated successfully', data: project });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Admin
exports.deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));

  project.isArchived = true;
  await project.save();

  await Activity.create({
    user: req.user._id,
    action: 'project_deleted',
    entity: 'project',
    entityId: project._id,
    entityTitle: project.name
  });

  res.json({ success: true, message: 'Project archived successfully' });
});

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Admin, Manager
exports.addMember = asyncHandler(async (req, res, next) => {
  const { userId, role } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));

  const alreadyMember = project.members.some(m => m.user.equals(userId));
  if (alreadyMember) return next(new AppError('User is already a member', 400));

  project.members.push({ user: userId, role: role || 'member' });
  await project.save();

  await project.populate('members.user', 'name email avatar');

  await Promise.all([
    Activity.create({
      user: req.user._id,
      action: 'project_member_added',
      entity: 'project',
      entityId: project._id,
      entityTitle: project.name,
      details: { userId }
    }),
    Notification.create({
      recipient: userId,
      sender: req.user._id,
      type: 'project_invitation',
      title: project.name,
      message: `${req.user.name} added you to project "${project.name}"`,
      link: `/projects/${project._id}`,
      entityType: 'project',
      entityId: project._id
    })
  ]);

  res.json({ success: true, message: 'Member added successfully', data: project });
});

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Admin, Manager
exports.removeMember = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));

  project.members = project.members.filter(m => !m.user.equals(req.params.userId));
  await project.save();

  await Activity.create({
    user: req.user._id,
    action: 'project_member_removed',
    entity: 'project',
    entityId: project._id,
    entityTitle: project.name,
    details: { userId: req.params.userId }
  });

  res.json({ success: true, message: 'Member removed successfully' });
});
