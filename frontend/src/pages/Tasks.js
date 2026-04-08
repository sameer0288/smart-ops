import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  FiPlus, FiSearch, FiGrid, FiList, FiEdit2, FiTrash2,
  FiUser, FiCalendar, FiMoreVertical
} from 'react-icons/fi';
import TaskModal from '../components/tasks/TaskModal';

const STATUSES = ['todo', 'in_progress', 'in_review', 'blocked', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', blocked: 'Blocked', completed: 'Completed', cancelled: 'Cancelled' };
const STATUS_EMOJIS = { todo: '⬜', in_progress: '🔵', in_review: '🟣', blocked: '🔴', completed: '✅', cancelled: '⬛' };

const PriorityDot = ({ priority }) => <span className={`priority-dot ${priority}`} />;
const StatusBadge = ({ status }) => <span className={`badge badge-${status}`}>{STATUS_LABELS[status] || status}</span>;
const PriorityBadge = ({ priority }) => <span className={`badge badge-${priority}`}>{priority}</span>;

const TaskCard = ({ task, onEdit, onDelete, canEdit }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !['completed', 'cancelled'].includes(task.status);

  return (
    <div className="task-card" onClick={() => navigate(`/tasks/${task._id}`)}>
      <div className={`task-card-priority-bar ${task.priority}`} />
      <div style={{ paddingLeft: '8px' }}>
        <div className="task-card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
            <div className="task-card-title">{task.title}</div>
          </div>
          {canEdit && (
            <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              <button className="icon-btn" onClick={() => setMenuOpen(!menuOpen)}>
                <FiMoreVertical />
              </button>
              {menuOpen && (
                <div className="dropdown-menu" style={{ right: 0, minWidth: '140px' }}>
                  <div className="dropdown-item" onClick={() => { onEdit(task); setMenuOpen(false); }}>
                    <FiEdit2 size={14} /> Edit
                  </div>
                  <div className="dropdown-item danger" onClick={() => { onDelete(task._id); setMenuOpen(false); }}>
                    <FiTrash2 size={14} /> Delete
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {task.description && (
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {task.description}
          </p>
        )}

        <div className="task-card-meta">
          {task.assignee && (
            <div className="task-card-meta-item" style={{ color: 'var(--text-secondary)' }}>
              <FiUser size={11} />
              <span>{task.assignee.name?.split(' ')[0]}</span>
            </div>
          )}
          {task.dueDate && (
            <div className={`task-card-meta-item ${isOverdue ? 'task-overdue' : ''}`}>
              <FiCalendar size={11} />
              <span>{format(new Date(task.dueDate), 'MMM d')}</span>
              {isOverdue && ' ⚠️'}
            </div>
          )}
          {task.project && (
            <div className="task-card-meta-item" style={{ marginLeft: 'auto' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: task.project.color || 'var(--primary)', display: 'inline-block' }} />
              <span>{task.project.name}</span>
            </div>
          )}
        </div>

        {task.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
            {task.tags.slice(0, 3).map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const KanbanColumn = ({ status, tasks, onEdit, onDelete, canEdit }) => (
  <div className="kanban-column">
    <div className="kanban-column-header">
      <div className="kanban-column-title">
        <span>{STATUS_EMOJIS[status]}</span>
        <span style={{ color: 'var(--text-primary)' }}>{STATUS_LABELS[status]}</span>
      </div>
      <span className="kanban-column-count">{tasks.length}</span>
    </div>
    {tasks.length === 0 ? (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
        No tasks
      </div>
    ) : (
      tasks.map(task => (
        <TaskCard key={task._id} task={task} onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} />
      ))
    )}
  </div>
);

const Tasks = () => {
  const { isManagerOrAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState('list');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const queryClient = useQueryClient();

  const filters = {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    dueDate: searchParams.get('dueDate') || '',
    page: searchParams.get('page') || 1,
    limit: 20
  };

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => api.get('/tasks', { params: filters }).then(r => r.data)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      toast.success('Task deleted');
      queryClient.invalidateQueries(['tasks']);
    },
    onError: () => toast.error('Failed to delete task')
  });

  const updateFilter = useCallback((key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete('page');
      return next;
    });
  }, [setSearchParams]);

  const handleEdit = (task) => {
    setEditTask(task);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Archive this task?')) {
      deleteMutation.mutate(id);
    }
  };

  const tasks = data?.data || [];
  const pagination = data?.pagination || {};

  const kanbanTasks = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  return (
    <div className="animate-fade">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Tasks</h1>
          <p>{pagination.total || 0} total tasks</p>
        </div>
        <div className="page-header-actions">
          {/* View Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '3px' }}>
            <button className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('list')} style={{ padding: '6px 10px' }}>
              <FiList size={14} />
            </button>
            <button className={`btn btn-sm ${view === 'kanban' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('kanban')} style={{ padding: '6px 10px' }}>
              <FiGrid size={14} />
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }}>
            <FiPlus /> New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <FiSearch size={13} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Search tasks..."
            value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
          />
        </div>

        <select className="filter-select" value={filters.status} onChange={e => updateFilter('status', e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>

        <select className="filter-select" value={filters.priority} onChange={e => updateFilter('priority', e.target.value)}>
          <option value="">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
        </select>

        <select className="filter-select" value={filters.dueDate} onChange={e => updateFilter('dueDate', e.target.value)}>
          <option value="">Any Due Date</option>
          <option value="overdue">⚠️ Overdue</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
        </select>

        {(filters.search || filters.status || filters.priority || filters.dueDate) && (
          <button className="btn btn-secondary btn-sm" onClick={() => setSearchParams({})}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-title">No tasks found</div>
            <div className="empty-text">Create your first task to get started</div>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowModal(true)}>
              <FiPlus /> Create Task
            </button>
          </div>
        </div>
      ) : view === 'kanban' ? (
        <div className="kanban-board">
          {STATUSES.map(status => (
            <KanbanColumn key={status} status={status} tasks={kanbanTasks[status]} onEdit={handleEdit} onDelete={handleDelete} canEdit={isManagerOrAdmin} />
          ))}
        </div>
      ) : (
        <div>
          {/* List View */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Project</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !['completed', 'cancelled'].includes(task.status);
                  return (
                    <tr key={task._id} style={{ cursor: 'pointer' }}>
                      <td onClick={() => window.location.href = `/tasks/${task._id}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <PriorityDot priority={task.priority} />
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '13.5px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                            {task.tags?.length > 0 && (
                              <div style={{ display: 'flex', gap: '3px', marginTop: '3px' }}>
                                {task.tags.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td><StatusBadge status={task.status} /></td>
                      <td><PriorityBadge priority={task.priority} /></td>
                      <td>
                        {task.assignee ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="avatar avatar-sm">{task.assignee.name?.[0]}</div>
                            <span style={{ fontSize: '13px' }}>{task.assignee.name}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Unassigned</span>}
                      </td>
                      <td>
                        {task.project ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: task.project.color, flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{task.project.name}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>}
                      </td>
                      <td>
                        {task.dueDate ? (
                          <span style={{ fontSize: '13px', color: isOverdue ? 'var(--danger-light)' : 'var(--text-secondary)' }}>
                            {isOverdue && '⚠️ '}{format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="icon-btn" onClick={() => handleEdit(task)} style={{ fontSize: '13px' }}>
                            <FiEdit2 />
                          </button>
                          {isManagerOrAdmin && (
                            <button className="icon-btn" onClick={() => handleDelete(task._id)} style={{ fontSize: '13px', color: 'var(--danger-light)' }}>
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`btn btn-sm ${+filters.page === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => updateFilter('page', p)}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={editTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={() => queryClient.invalidateQueries(['tasks'])}
        />
      )}
    </div>
  );
};

export default Tasks;
