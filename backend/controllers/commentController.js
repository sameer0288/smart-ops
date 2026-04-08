const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/validate');

// @desc    Get comments for a task
// @route   GET /api/comments/task/:taskId
// @access  Private
exports.getTaskComments = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) return next(new AppError('Task not found', 404));

  const comments = await Comment.find({ task: req.params.taskId, parentComment: null })
    .populate('author', 'name avatar role')
    .populate('mentions', 'name')
    .populate({
      path: 'replies',
      populate: { path: 'author', select: 'name avatar role' }
    })
    .sort({ createdAt: 1 });

  res.json({ success: true, data: comments });
});

// @desc    Add comment
// @route   POST /api/comments
// @access  Private
exports.addComment = asyncHandler(async (req, res, next) => {
  const { content, taskId, mentions, parentComment } = req.body;

  const task = await Task.findById(taskId);
  if (!task) return next(new AppError('Task not found', 404));

  const comment = await Comment.create({
    content,
    author: req.user._id,
    task: taskId,
    mentions,
    parentComment
  });

  await comment.populate('author', 'name avatar role');

  // Activity log
  await Activity.create({
    user: req.user._id,
    action: 'comment_added',
    entity: 'task',
    entityId: taskId,
    entityTitle: task.title,
    details: { commentId: comment._id }
  });

  // Notify task assignee
  const notifs = [];
  if (task.assignee && !task.assignee.equals(req.user._id)) {
    notifs.push({
      recipient: task.assignee,
      sender: req.user._id,
      type: 'task_comment',
      title: `Comment on: ${task.title}`,
      message: `${req.user.name}: ${content.substring(0, 80)}`,
      link: `/tasks/${taskId}`,
      entityType: 'task',
      entityId: taskId
    });
  }
  // Notify mentions
  if (mentions && mentions.length > 0) {
    mentions.forEach(userId => {
      if (userId !== req.user._id.toString()) {
        notifs.push({
          recipient: userId,
          sender: req.user._id,
          type: 'mention',
          title: `Mentioned in: ${task.title}`,
          message: `${req.user.name} mentioned you: ${content.substring(0, 80)}`,
          link: `/tasks/${taskId}`,
          entityType: 'task',
          entityId: taskId
        });
      }
    });
  }
  if (notifs.length > 0) await Notification.insertMany(notifs);

  res.status(201).json({ success: true, message: 'Comment added', data: comment });
});

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private (own comments only)
exports.updateComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new AppError('Comment not found', 404));
  if (!comment.author.equals(req.user._id)) return next(new AppError('Not authorized to edit this comment', 403));

  comment.content = req.body.content;
  comment.isEdited = true;
  comment.editedAt = new Date();
  await comment.save();

  await comment.populate('author', 'name avatar role');

  res.json({ success: true, message: 'Comment updated', data: comment });
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private (own comments or admin)
exports.deleteComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new AppError('Comment not found', 404));

  const canDelete = comment.author.equals(req.user._id) || req.user.role === 'admin';
  if (!canDelete) return next(new AppError('Not authorized to delete this comment', 403));

  await Comment.deleteMany({ parentComment: comment._id }); // Delete replies
  await comment.deleteOne();

  await Activity.create({
    user: req.user._id,
    action: 'comment_deleted',
    entity: 'task',
    entityId: comment.task,
    entityTitle: 'Comment',
    details: { commentId: comment._id }
  });

  res.json({ success: true, message: 'Comment deleted' });
});
