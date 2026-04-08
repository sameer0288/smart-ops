import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiLock, FiSave, FiUser, FiBriefcase, FiMail, FiCheckSquare } from 'react-icons/fi';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const { register: profileReg, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm({
    defaultValues: { name: user?.name, department: user?.department, designation: user?.designation }
  });

  const { register: passReg, handleSubmit: handlePassSubmit, formState: { errors: passErrors }, reset: resetPass, watch } = useForm();
  const newPassword = watch('newPassword');

  const { data: myTasks } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => api.get('/tasks?assignee=' + user?._id + '&limit=8').then(r => r.data.data)
  });

  const { data: taskStats } = useQuery({
    queryKey: ['task-stats'],
    queryFn: () => api.get('/tasks/stats').then(r => r.data.data)
  });

  const profileMutation = useMutation({
    mutationFn: (data) => api.put('/auth/profile', data),
    onSuccess: (res) => {
      toast.success('Profile updated');
      updateUser(res.data.user);
      queryClient.invalidateQueries(['dashboard']);
    },
    onError: () => toast.error('Failed to update profile')
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => api.put('/auth/password', data),
    onSuccess: () => { toast.success('Password changed successfully'); resetPass(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password')
  });

  const getRoleIcon = (role) => ({ admin: '👑', manager: '🔷', user: '👤' }[role] || '👤');
  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>My Profile</h1>
          <p>Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '30px', fontWeight: '800', color: 'white',
            flexShrink: 0, boxShadow: '0 0 30px var(--primary-glow)'
          }}>
            {getInitials(user?.name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800' }}>{user?.name}</h2>
              <span className={`badge badge-${user?.role}`}>{getRoleIcon(user?.role)} {user?.role}</span>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{user?.email}</div>
            {user?.designation && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user?.designation}{user?.department ? ` · ${user.department}` : ''}</div>}
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Tasks', value: Object.values(taskStats?.byStatus || {}).reduce((a, b) => a + b, 0) || 0, color: 'var(--primary-light)' },
              { label: 'Completed', value: taskStats?.byStatus?.completed || 0, color: 'var(--success)' },
              { label: 'In Progress', value: taskStats?.byStatus?.in_progress || 0, color: 'var(--info)' },
              { label: 'Overdue', value: taskStats?.overdueCount || 0, color: 'var(--danger-light)' }
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color }}>{value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Left: Forms */}
        <div>
          <div className="tabs">
            <button className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
              <FiUser size={13} /> Profile Info
            </button>
            <button className={`tab ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
              <FiLock size={13} /> Change Password
            </button>
          </div>

          {activeTab === 'profile' && (
            <div className="card">
              <form onSubmit={handleProfileSubmit(d => profileMutation.mutate(d))}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <FiUser style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input {...profileReg('name', { required: 'Name required' })} className="form-control" style={{ paddingLeft: '40px' }} />
                  </div>
                  {profileErrors.name && <div className="form-error">{profileErrors.name.message}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div style={{ position: 'relative' }}>
                    <FiMail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input value={user?.email} disabled className="form-control" style={{ paddingLeft: '40px', opacity: 0.6 }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Email cannot be changed</div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <div style={{ position: 'relative' }}>
                      <FiBriefcase style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input {...profileReg('department')} className="form-control" style={{ paddingLeft: '40px' }} placeholder="Engineering" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input {...profileReg('designation')} className="form-control" placeholder="Full Stack Developer" />
                  </div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Account Role</div>
                  <div style={{ fontWeight: '700', textTransform: 'capitalize' }}>{getRoleIcon(user?.role)} {user?.role}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Role can only be changed by admin</div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={profileMutation.isPending}>
                  {profileMutation.isPending ? 'Saving...' : <><FiSave size={14} /> Save Changes</>}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="card">
              <form onSubmit={handlePassSubmit(d => passwordMutation.mutate(d))}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input {...passReg('currentPassword', { required: 'Required' })} type="password" className="form-control" placeholder="••••••••" />
                  {passErrors.currentPassword && <div className="form-error">{passErrors.currentPassword.message}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input {...passReg('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} type="password" className="form-control" placeholder="••••••••" />
                  {passErrors.newPassword && <div className="form-error">{passErrors.newPassword.message}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input {...passReg('confirmPassword', { required: 'Required', validate: v => v === newPassword || 'Passwords do not match' })} type="password" className="form-control" placeholder="••••••••" />
                  {passErrors.confirmPassword && <div className="form-error">{passErrors.confirmPassword.message}</div>}
                </div>

                <button type="submit" className="btn btn-primary" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending ? 'Updating...' : <><FiLock size={14} /> Change Password</>}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right: My Tasks */}
        <div className="card">
          <div className="section-header">
            <div className="section-title"><FiCheckSquare size={14} /> My Recent Tasks</div>
          </div>
          {!myTasks?.length ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-icon">✅</div>
              <div className="empty-text">No tasks assigned to you</div>
            </div>
          ) : (
            myTasks.map(task => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !['completed', 'cancelled'].includes(task.status);
              return (
                <div key={task._id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px', borderRadius: 'var(--radius)', marginBottom: '6px', background: 'var(--bg-elevated)', cursor: 'pointer' }}
                  onClick={() => window.location.href = `/tasks/${task._id}`}>
                  <span className={`priority-dot ${task.priority}`} style={{ marginTop: '6px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '3px' }}>{task.title}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={`badge badge-${task.status}`} style={{ fontSize: '10px' }}>{task.status?.replace('_', ' ')}</span>
                      {task.dueDate && (
                        <span style={{ fontSize: '11px', color: isOverdue ? 'var(--danger-light)' : 'var(--text-muted)' }}>
                          {isOverdue && '⚠️ '}Due {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
