import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiFilter } from 'react-icons/fi';

const ACTION_ICONS = {
  task_created: '✅', task_updated: '✏️', task_deleted: '🗑️', task_completed: '🎉',
  task_assigned: '👤', task_status_changed: '🔄', task_priority_changed: '⚡',
  project_created: '📁', project_updated: '📝', project_deleted: '🗑️',
  project_member_added: '➕', project_member_removed: '➖',
  comment_added: '💬', comment_deleted: '🗑️',
  user_created: '👥', user_updated: '✏️', user_role_changed: '🛡️',
  user_login: '🔑', user_logout: '🚪'
};

const ACTION_LABELS = {
  task_created: 'created a task', task_updated: 'updated a task', task_deleted: 'deleted a task',
  task_completed: 'completed a task', task_assigned: 'assigned a task', task_status_changed: 'changed task status',
  task_priority_changed: 'changed task priority', project_created: 'created a project',
  project_updated: 'updated a project', project_member_added: 'added a member', project_member_removed: 'removed a member',
  comment_added: 'commented on', comment_deleted: 'deleted a comment',
  user_created: 'created a user', user_updated: 'updated a user', user_role_changed: 'changed user role',
  user_login: 'logged in', user_logout: 'logged out'
};

const ActivityLog = () => {
  const { isManagerOrAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['activity', page, action, entity],
    queryFn: () => api.get('/activity', { params: { page, limit: 20, action, entity } }).then(r => r.data)
  });

  const activities = data?.data || [];
  const pagination = data?.pagination || {};

  const getActionColor = (action) => {
    if (action?.includes('delete') || action?.includes('removed')) return 'var(--danger-light)';
    if (action?.includes('created') || action?.includes('added')) return 'var(--success)';
    if (action?.includes('completed')) return 'var(--success)';
    if (action?.includes('login') || action?.includes('logout')) return 'var(--info)';
    return 'var(--text-muted)';
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Activity Log</h1>
          <p>Complete audit trail of all operations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select className="filter-select" value={action} onChange={e => { setAction(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          <option value="task_created">Task Created</option>
          <option value="task_updated">Task Updated</option>
          <option value="task_status_changed">Status Changed</option>
          <option value="task_assigned">Task Assigned</option>
          <option value="project_created">Project Created</option>
          <option value="comment_added">Comment Added</option>
          <option value="user_login">User Login</option>
          <option value="user_role_changed">Role Changed</option>
        </select>

        <select className="filter-select" value={entity} onChange={e => { setEntity(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="task">Tasks</option>
          <option value="project">Projects</option>
          <option value="user">Users</option>
          <option value="comment">Comments</option>
        </select>
      </div>

      {isLoading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : activities.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No activity found</div>
            <div className="empty-text">Actions will appear here as they happen</div>
          </div>
        </div>
      ) : (
        <div>
          <div className="card" style={{ padding: 0 }}>
            {activities.map((activity, i) => (
              <div key={activity._id}
                style={{
                  display: 'flex', gap: '16px', padding: '16px 20px',
                  borderBottom: i < activities.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'flex-start', transition: 'var(--transition)'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Icon */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', flexShrink: 0
                }}>
                  {ACTION_ICONS[activity.action] || '📌'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{activity.user?.name}</span>
                        {' '}
                        <span style={{ color: getActionColor(activity.action) }}>{ACTION_LABELS[activity.action] || activity.action?.replace(/_/g, ' ')}</span>
                        {activity.entityTitle && (
                          <> <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>"{activity.entityTitle}"</span></>
                        )}
                      </div>

                      {/* Details */}
                      {activity.details && Object.keys(activity.details).length > 0 && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {activity.details.from && activity.details.to && (
                            <span>{activity.details.from} → {activity.details.to}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {format(new Date(activity.createdAt), 'MMM d, HH:mm')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <div className="avatar avatar-sm">{activity.user?.name?.[0]}</div>
                    <span className={`badge badge-${activity.user?.role}`} style={{ fontSize: '10px' }}>
                      {activity.user?.role}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 'var(--radius-full)', textTransform: 'capitalize' }}>
                      {activity.entity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                ← Prev
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '6px 12px' }}>
                Page {page} of {pagination.pages}
              </span>
              <button className="btn btn-secondary btn-sm" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
