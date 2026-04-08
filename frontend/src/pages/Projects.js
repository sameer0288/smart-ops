import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiUsers, FiX, FiSave } from 'react-icons/fi';

const STATUS_COLORS = { planning: '#64748b', active: '#10b981', on_hold: '#f59e0b', completed: '#6366f1', cancelled: '#ef4444' };

const ProjectModal = ({ project, onClose, onSave, users }) => {
  const { user } = useAuth();
  const isEdit = !!project;
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: project ? {
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      color: project.color || '#6366f1',
      icon: project.icon || '📁',
      manager: project.manager?._id || '',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      budget: project.budget || '',
      tags: project.tags?.join(', ') || ''
    } : {
      status: 'planning', priority: 'medium', color: '#6366f1', icon: '📁',
      manager: user?._id
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/projects/${project._id}`, data) : api.post('/projects', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Project updated' : 'Project created');
      onSave?.();
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save project')
  });

  const onSubmit = (data) => {
    mutation.mutate({
      ...data,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      budget: data.budget ? +data.budget : undefined
    });
  };

  const PRESET_ICONS = ['📁', '🚀', '📱', '🎨', '⚡', '🔧', '📊', '🛡️', '🌐', '💡'];
  const PRESET_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? '✏️ Edit Project' : '📁 Create New Project'}</div>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Icon & Color */}
          <div className="form-group">
            <label className="form-label">Project Icon</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PRESET_ICONS.map(icon => (
                <label key={icon} style={{ cursor: 'pointer' }}>
                  <input type="radio" {...register('icon')} value={icon} style={{ display: 'none' }} />
                  <span style={{ fontSize: '24px', padding: '4px', borderRadius: 'var(--radius)', display: 'block' }}>{icon}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Project Color</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(color => (
                <label key={color} style={{ cursor: 'pointer' }}>
                  <input type="radio" {...register('color')} value={color} style={{ display: 'none' }} />
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: color, display: 'block', border: '2px solid transparent' }} />
                </label>
              ))}
              <input type="color" {...register('color')} style={{ width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', border: 'none', background: 'none' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input {...register('name', { required: 'Name is required' })} className="form-control" placeholder="Enter project name..." />
            {errors.name && <div className="form-error">{errors.name.message}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea {...register('description')} className="form-control" placeholder="Project description..." rows={3} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select {...register('status')} className="form-control">
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select {...register('priority')} className="form-control">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Project Manager</label>
            <select {...register('manager')} className="form-control">
              {users?.filter(u => ['admin', 'manager'].includes(u.role)).map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input {...register('startDate')} type="date" className="form-control" />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input {...register('endDate')} type="date" className="form-control" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Budget ($)</label>
              <input {...register('budget')} type="number" min="0" className="form-control" placeholder="50000" />
            </div>
            <div className="form-group">
              <label className="form-label">Tags</label>
              <input {...register('tags')} className="form-control" placeholder="mobile, backend, v2" />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : <><FiSave size={14} /> {isEdit ? 'Update' : 'Create Project'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Projects = () => {
  const { isManagerOrAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', search, statusFilter],
    queryFn: () => api.get('/projects', { params: { search, status: statusFilter } }).then(r => r.data)
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.get('/users?limit=100').then(r => r.data.data),
    enabled: isManagerOrAdmin
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => { toast.success('Project archived'); queryClient.invalidateQueries(['projects']); }
  });

  const projects = data?.data || [];

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Projects</h1>
          <p>{projects.length} active projects</p>
        </div>
        {isManagerOrAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditProject(null); setShowModal(true); }}>
            <FiPlus /> New Project
          </button>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <FiSearch size={13} style={{ color: 'var(--text-muted)' }} />
          <input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : projects.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <div className="empty-title">No projects yet</div>
            <div className="empty-text">Create your first project</div>
            {isManagerOrAdmin && (
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowModal(true)}>
                <FiPlus /> Create Project
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(project => {
            const completionRate = project.taskStats?.total > 0
              ? Math.round((project.taskStats.completed / project.taskStats.total) * 100)
              : 0;

            return (
              <div key={project._id} className="card" style={{ cursor: 'pointer', transition: 'var(--transition-slow)' }}
                onClick={() => navigate(`/projects/${project._id}`)}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'none'}
              >
                {/* Project Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius)', background: project.color + '20', border: `2px solid ${project.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                      {project.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>{project.name}</div>
                      <span className={`badge badge-${project.status}`}>{project.status?.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {isManagerOrAdmin && (
                    <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                      <button className="icon-btn" onClick={() => { setEditProject(project); setShowModal(true); }}><FiEdit2 size={13} /></button>
                      <button className="icon-btn" style={{ color: 'var(--danger-light)' }} onClick={() => window.confirm('Archive project?') && deleteMutation.mutate(project._id)}><FiTrash2 size={13} /></button>
                    </div>
                  )}
                </div>

                {project.description && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {project.description}
                  </p>
                )}

                {/* Progress */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                    <span style={{ fontWeight: '700', color: completionRate === 100 ? 'var(--success)' : 'var(--text-primary)' }}>{completionRate}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${completionRate}%`, background: project.color || 'var(--gradient-primary)' }} />
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  <span>📋 {project.taskStats?.total || 0} tasks</span>
                  <span>✅ {project.taskStats?.completed || 0} done</span>
                  <span><FiUsers size={11} /> {project.members?.length || 0}</span>
                </div>

                {/* Manager */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="avatar avatar-sm">{project.manager?.name?.[0]}</div>
                    <span style={{ color: 'var(--text-secondary)' }}>{project.manager?.name}</span>
                  </div>
                  {project.endDate && (
                    <span style={{ color: 'var(--text-muted)' }}>Due {format(new Date(project.endDate), 'MMM d')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <ProjectModal
          project={editProject}
          users={usersData}
          onClose={() => { setShowModal(false); setEditProject(null); }}
          onSave={() => queryClient.invalidateQueries(['projects'])}
        />
      )}
    </div>
  );
};

export default Projects;
