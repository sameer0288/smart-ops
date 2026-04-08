import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  FiArrowLeft, FiEdit2, FiTrash2, FiSend,
  FiClock, FiUser, FiFolder, FiTag, FiActivity, FiMessageSquare, FiCalendar
} from 'react-icons/fi';
import TaskModal from '../components/tasks/TaskModal';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', blocked: 'Blocked', completed: 'Completed', cancelled: 'Cancelled' };
const STATUS_COLORS = { todo: '#64748b', in_progress: '#3b82f6', in_review: '#8b5cf6', blocked: '#ef4444', completed: '#10b981', cancelled: '#475569' };
const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isManagerOrAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('comments');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => api.get(`/tasks/${id}`).then(r => r.data.data)
  });

  const { data: commentsData } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => api.get(`/comments/task/${id}`).then(r => r.data.data)
  });

  const commentMutation = useMutation({
    mutationFn: (content) => api.post('/comments', { content, taskId: id }),
    onSuccess: () => {
      toast.success('Comment added');
      setComment('');
      queryClient.invalidateQueries(['comments', id]);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      toast.success('Task archived');
      navigate('/tasks');
    }
  });

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    commentMutation.mutate(comment.trim());
  };

  if (isLoading) return <div className="loader"><div className="spinner" /></div>;
  if (!task) return <div className="card"><div className="empty-state"><div className="empty-title">Task not found</div></div></div>;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !['completed', 'cancelled'].includes(task.status);
  const canEdit = isManagerOrAdmin || task.assignee?._id === user?._id || task.createdBy?._id === user?._id;

  return (
    <div className="animate-fade">
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')} style={{ marginBottom: '20px' }}>
        <FiArrowLeft /> Back to Tasks
      </button>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Main Content */}
        <div style={{ gridColumn: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Task Header */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  {task.type && <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-light)' }}>{task.type}</span>}
                  {isOverdue && <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>⚠️ Overdue</span>}
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.3' }}>{task.title}</h1>
              </div>
              {canEdit && (
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>
                    <FiEdit2 size={13} /> Edit
                  </button>
                  {isManagerOrAdmin && (
                    <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger-light)' }}
                      onClick={() => window.confirm('Archive task?') && deleteMutation.mutate()}>
                      <FiTrash2 size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {task.description && (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
                {task.description}
              </p>
            )}

            {task.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {task.tags.map(tag => <span key={tag} className="tag"><FiTag size={10} /> {tag}</span>)}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button className={`tab ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>
              <FiMessageSquare size={13} /> Comments ({commentsData?.length || 0})
            </button>
            <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              <FiActivity size={13} /> Status History
            </button>
          </div>

          {activeTab === 'comments' && (
            <div className="card">
              {/* Comment Form */}
              <form onSubmit={handleCommentSubmit} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div className="avatar avatar-sm" style={{ flexShrink: 0, marginTop: '2px' }}>
                    {user?.name?.[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      className="form-control"
                      placeholder="Add a comment..."
                      rows={3}
                      style={{ marginBottom: '8px' }}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={!comment.trim() || commentMutation.isPending}>
                      <FiSend size={13} /> {commentMutation.isPending ? 'Posting...' : 'Comment'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              {commentsData?.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px' }}>
                  <div className="empty-icon">💬</div>
                  <div className="empty-text">No comments yet. Start the conversation!</div>
                </div>
              ) : (
                commentsData?.map(c => (
                  <div key={c._id} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>{c.author?.name?.[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{c.author?.name}</span>
                        <span className={`badge badge-${c.author?.role}`} style={{ fontSize: '10px' }}>{c.author?.role}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                          {c.isEdited && ' (edited)'}
                        </span>
                      </div>
                      <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '12px', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        {c.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="card">
              {task.statusHistory?.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px' }}>
                  <div className="empty-text">No status history</div>
                </div>
              ) : (
                <div>
                  {task.statusHistory?.slice().reverse().map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: STATUS_COLORS[h.to] + '20', border: `2px solid ${STATUS_COLORS[h.to]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLORS[h.to] }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>
                          {h.from ? (
                            <>{STATUS_LABELS[h.from]} → <span style={{ color: STATUS_COLORS[h.to] }}>{STATUS_LABELS[h.to]}</span></>
                          ) : (
                            <span style={{ color: STATUS_COLORS[h.to] }}>Task created as {STATUS_LABELS[h.to]}</span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {h.changedBy?.name && `by ${h.changedBy.name} · `}
                          {format(new Date(h.changedAt), 'MMM d, yyyy HH:mm')}
                        </div>
                        {h.note && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>"{h.note}"</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card card-sm">
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Details</div>

            {[
              { label: 'Assignee', value: task.assignee ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="avatar avatar-sm">{task.assignee.name?.[0]}</div>
                  <span style={{ fontSize: '13px' }}>{task.assignee.name}</span>
                </div>
              ) : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Unassigned</span>, icon: FiUser },
              { label: 'Project', value: task.project ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>{task.project.icon}</span>
                  <span style={{ fontSize: '13px' }}>{task.project.name}</span>
                </div>
              ) : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>, icon: FiFolder },
              { label: 'Due Date', value: task.dueDate ? (
                <span style={{ fontSize: '13px', color: isOverdue ? 'var(--danger-light)' : 'var(--text-primary)' }}>
                  {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  {isOverdue && ' ⚠️'}
                </span>
              ) : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Not set</span>, icon: FiCalendar },
              { label: 'Created By', value: <span style={{ fontSize: '13px' }}>{task.createdBy?.name}</span>, icon: FiUser },
              { label: 'Created', value: <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{format(new Date(task.createdAt), 'MMM d, yyyy')}</span>, icon: FiClock },
            ].filter(Boolean).map(({ label, value, icon: Icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px', flexShrink: 0 }}>
                  <Icon size={12} />
                  {label}
                </div>
                <div style={{ textAlign: 'right' }}>{value}</div>
              </div>
            ))}

            {/* Time tracking */}
            {(task.estimatedHours || task.actualHours) && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>Time Tracking</div>
                {task.estimatedHours && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Estimated</span>
                    <span>{task.estimatedHours}h</span>
                  </div>
                )}
                {task.actualHours && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Actual</span>
                    <span style={{ color: task.actualHours > task.estimatedHours ? 'var(--danger-light)' : 'var(--success)' }}>{task.actualHours}h</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dependencies */}
          {task.dependencies?.length > 0 && (
            <div className="card card-sm">
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Dependencies</div>
              {task.dependencies.map(dep => (
                <div key={dep._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)' }}>
                  <span className={`priority-dot ${dep.priority}`} />
                  <span style={{ fontSize: '13px', flex: 1 }}>{dep.title}</span>
                  <span className={`badge badge-${dep.status}`} style={{ fontSize: '10px' }}>{STATUS_LABELS[dep.status]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <TaskModal
          task={task}
          onClose={() => setShowEdit(false)}
          onSave={() => {
            queryClient.invalidateQueries(['task', id]);
            setShowEdit(false);
          }}
        />
      )}
    </div>
  );
};

export default TaskDetail;
