import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { FiX, FiSave } from 'react-icons/fi';

const TaskModal = ({ task, onClose, onSave }) => {
  const { isManagerOrAdmin } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = !!task;

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: task ? {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      type: task.type,
      assignee: task.assignee?._id || '',
      project: task.project?._id || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      startDate: task.startDate ? task.startDate.split('T')[0] : '',
      estimatedHours: task.estimatedHours || '',
      actualHours: task.actualHours || '',
      tags: task.tags?.join(', ') || '',
      statusNote: ''
    } : {
      priority: 'medium',
      status: 'todo',
      type: 'feature'
    }
  });

  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.get('/users?limit=100').then(r => r.data.data),
    enabled: isManagerOrAdmin
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => api.get('/projects?limit=100').then(r => r.data.data)
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/tasks/${task._id}`, data) : api.post('/tasks', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Task updated' : 'Task created');
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['dashboard']);
      onSave?.();
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save task')
  });

  const onSubmit = (data) => {
    const payload = {
      ...data,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      assignee: data.assignee || undefined,
      project: data.project || undefined,
      dueDate: data.dueDate || undefined,
      startDate: data.startDate || undefined,
      estimatedHours: data.estimatedHours ? +data.estimatedHours : undefined,
      actualHours: data.actualHours ? +data.actualHours : undefined
    };
    mutation.mutate(payload);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? '✏️ Edit Task' : '✅ Create New Task'}</div>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              {...register('title', { required: 'Title is required', minLength: { value: 3, message: 'Min 3 characters' } })}
              className="form-control"
              placeholder="Enter task title..."
            />
            {errors.title && <div className="form-error">{errors.title.message}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              {...register('description')}
              className="form-control"
              placeholder="Describe the task in detail..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select {...register('status')} className="form-control">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority *</label>
              <select {...register('priority')} className="form-control">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select {...register('type')} className="form-control">
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
                <option value="improvement">Improvement</option>
                <option value="research">Research</option>
                <option value="documentation">Documentation</option>
                <option value="other">Other</option>
              </select>
            </div>
            {isManagerOrAdmin && (
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select {...register('assignee')} className="form-control">
                  <option value="">Unassigned</option>
                  {users?.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Project</label>
              <select {...register('project')} className="form-control">
                <option value="">No Project</option>
                {projects?.map(p => (
                  <option key={p._id} value={p._id}>{p.icon} {p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input {...register('dueDate')} type="date" className="form-control" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Estimated Hours</label>
              <input {...register('estimatedHours')} type="number" min="0" step="0.5" className="form-control" placeholder="8" />
            </div>
            {isEdit && (
              <div className="form-group">
                <label className="form-label">Actual Hours</label>
                <input {...register('actualHours')} type="number" min="0" step="0.5" className="form-control" placeholder="0" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input {...register('tags')} className="form-control" placeholder="frontend, api, urgent" />
          </div>

          {isEdit && (
            <div className="form-group">
              <label className="form-label">Status Change Note</label>
              <input {...register('statusNote')} className="form-control" placeholder="Optional note about this update..." />
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : <><FiSave size={14} /> {isEdit ? 'Update Task' : 'Create Task'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
