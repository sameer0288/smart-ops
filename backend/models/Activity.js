const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'task_created', 'task_updated', 'task_deleted', 'task_status_changed',
      'task_assigned', 'task_completed', 'task_priority_changed',
      'project_created', 'project_updated', 'project_deleted', 'project_member_added', 'project_member_removed',
      'comment_added', 'comment_deleted',
      'user_created', 'user_updated', 'user_role_changed', 'user_login', 'user_logout',
      'notification_sent'
    ]
  },
  entity: {
    type: String,
    enum: ['task', 'project', 'user', 'comment', 'system'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  entityTitle: {
    type: String,
    default: ''
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ entity: 1, entityId: 1 });
activitySchema.index({ action: 1 });
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
