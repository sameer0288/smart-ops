import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../utils/api';
import { FiArrowLeft, FiUsers, FiCheckSquare, FiCalendar, FiDollarSign } from 'react-icons/fi';

const STATUS_COLORS = { todo: '#64748b', in_progress: '#3b82f6', in_review: '#8b5cf6', blocked: '#ef4444', completed: '#10b981', cancelled: '#475569' };
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', blocked: 'Blocked', completed: 'Completed', cancelled: 'Cancelled' };

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data.data)
  });

  if (isLoading) return <div className="loader"><div className="spinner" /></div>;
  if (!project) return <div className="card"><div className="empty-state"><div className="empty-title">Project not found</div></div></div>;

  const taskStatusEntries = Object.entries(project.taskStats || {});
  const totalTasks = taskStatusEntries.reduce((acc, [, v]) => acc + v, 0);
  const completionRate = totalTasks > 0 ? Math.round((project.taskStats.completed || 0) / totalTasks * 100) : 0;

  return (
    <div className="animate-fade">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: '20px' }}>
        <FiArrowLeft /> Back to Projects
      </button>

      {/* Header */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-lg)', background: (project.color || '#6366f1') + '20', border: `2px solid ${project.color || '#6366f1'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', flexShrink: 0 }}>
            {project.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800' }}>{project.name}</h1>
              <span className={`badge badge-${project.status}`}>{project.status?.replace('_', ' ')}</span>
              <span className={`badge badge-${project.priority}`}>{project.priority}</span>
            </div>
            {project.description && <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7' }}>{project.description}</p>}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <FiCheckSquare size={14} style={{ color: 'var(--success)' }} />
            <span>{totalTasks} tasks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <FiUsers size={14} style={{ color: 'var(--primary-light)' }} />
            <span>{project.members?.length || 0} members</span>
          </div>
          {project.endDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <FiCalendar size={14} style={{ color: 'var(--warning)' }} />
              <span>Due {format(new Date(project.endDate), 'MMM d, yyyy')}</span>
            </div>
          )}
          {project.budget && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <FiDollarSign size={14} style={{ color: 'var(--success)' }} />
              <span>${project.budget?.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Overall Progress</span>
            <span style={{ fontWeight: '700' }}>{completionRate}%</span>
          </div>
          <div className="progress-bar" style={{ height: '8px' }}>
            <div className="progress-fill" style={{ width: `${completionRate}%`, background: project.color || 'var(--gradient-primary)' }} />
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Team Members */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">👥 Team Members</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)' }}>
            <div className="avatar">{project.manager?.name?.[0]}</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{project.manager?.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--primary-light)', fontWeight: '600' }}>Project Manager</div>
            </div>
          </div>
          {project.members?.map(member => (
            <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div className="avatar">{member.user?.name?.[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{member.user?.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{member.user?.department} · {member.role}</div>
              </div>
              <span className={`badge badge-${member.user?.role}`}>{member.user?.role}</span>
            </div>
          ))}
        </div>

        {/* Task Status Breakdown */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">📊 Task Breakdown</div>
          </div>
          {taskStatusEntries.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-text">No tasks in this project</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => navigate(`/tasks?project=${id}`)}>
                Add Tasks
              </button>
            </div>
          ) : (
            taskStatusEntries.map(([status, count]) => (
              <div key={status} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLORS[status] }} />
                    <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{STATUS_LABELS[status]}</span>
                  </div>
                  <span style={{ fontWeight: '700' }}>{count}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${totalTasks > 0 ? (count / totalTasks * 100) : 0}%`, background: STATUS_COLORS[status] }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      {project.recentTasks?.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="section-header">
            <div className="section-title">🔥 Recent Tasks</div>
            <span className="section-link" onClick={() => navigate(`/tasks?project=${id}`)}>View all →</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {project.recentTasks.map(task => (
              <div key={task._id}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', cursor: 'pointer' }}
                onClick={() => navigate(`/tasks/${task._id}`)}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLORS[task.status], flexShrink: 0 }} />
                <span style={{ fontSize: '13.5px', fontWeight: '600', flex: 1 }}>{task.title}</span>
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                {task.assignee && <div className="avatar avatar-sm">{task.assignee.name?.[0]}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
