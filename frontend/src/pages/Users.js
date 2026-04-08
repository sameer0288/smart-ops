import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { FiPlus, FiSearch, FiEdit2, FiUserX, FiX, FiSave } from 'react-icons/fi';

const UserModal = ({ user: editUser, onClose, onSave }) => {
  const isEdit = !!editUser;
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: editUser ? {
      name: editUser.name, email: editUser.email, role: editUser.role,
      department: editUser.department, designation: editUser.designation, isActive: editUser.isActive
    } : { role: 'user', isActive: true }
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/users/${editUser._id}`, data) : api.post('/users', data),
    onSuccess: () => { toast.success(isEdit ? 'User updated' : 'User created'); onSave?.(); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save')
  });

  const onSubmit = (data) => mutation.mutate(data);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? '✏️ Edit User' : '👤 Create User'}</div>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input {...register('name', { required: 'Name required' })} className="form-control" placeholder="John Doe" />
              {errors.name && <div className="form-error">{errors.name.message}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select {...register('role')} className="form-control">
                <option value="user">👤 User</option>
                <option value="manager">🔷 Manager</option>
                <option value="admin">👑 Admin</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input {...register('email', { required: 'Email required' })} type="email" className="form-control" placeholder="user@company.com" />
            {errors.email && <div className="form-error">{errors.email.message}</div>}
          </div>
          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 chars' } })} type="password" className="form-control" placeholder="••••••••" />
              {errors.password && <div className="form-error">{errors.password.message}</div>}
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input {...register('department')} className="form-control" placeholder="Engineering" />
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input {...register('designation')} className="form-control" placeholder="Developer" />
            </div>
          </div>
          {isEdit && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input {...register('isActive')} type="checkbox" defaultChecked={editUser?.isActive} />
                <span className="form-label" style={{ margin: 0 }}>Active Account</span>
              </label>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : <><FiSave size={14} /> {isEdit ? 'Update' : 'Create'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Users = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter, page],
    queryFn: () => api.get('/users', { params: { search, role: roleFilter, page, limit: 15 } }).then(r => r.data)
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => { toast.success('User deactivated'); queryClient.invalidateQueries(['users']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed')
  });

  const users = data?.data || [];
  const pagination = data?.pagination || {};

  const getRoleIcon = (role) => ({ admin: '👑', manager: '🔷', user: '👤' }[role] || '👤');
  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Team Members</h1>
          <p>{pagination.total || 0} total users</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditUser(null); setShowModal(true); }}>
          <FiPlus /> Add User
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <FiSearch size={13} style={{ color: 'var(--text-muted)' }} />
          <input placeholder="Search by name, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="admin">👑 Admin</option>
          <option value="manager">🔷 Manager</option>
          <option value="user">👤 User</option>
        </select>
      </div>

      {isLoading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : users.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No users found</div>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowModal(true)}>
              <FiPlus /> Add User
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar" style={{ background: u.role === 'admin' ? 'var(--gradient-primary)' : u.role === 'manager' ? 'var(--gradient-success)' : 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '13.5px' }}>{u.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${u.role}`}>
                        {getRoleIcon(u.role)} {u.role}
                      </span>
                    </td>
                    <td><span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{u.department || '—'}</span></td>
                    <td><span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{u.designation || '—'}</span></td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '11.5px', fontWeight: '600',
                        background: u.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: u.isActive ? 'var(--success-light)' : 'var(--danger-light)'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td><span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="icon-btn" onClick={() => { setEditUser(u); setShowModal(true); }}><FiEdit2 size={13} /></button>
                        {u.isActive && (
                          <button className="icon-btn" style={{ color: 'var(--danger-light)' }}
                            onClick={() => window.confirm(`Deactivate ${u.name}?`) && deactivateMutation.mutate(u._id)}>
                            <FiUserX size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <UserModal
          user={editUser}
          onClose={() => { setShowModal(false); setEditUser(null); }}
          onSave={() => queryClient.invalidateQueries(['users'])}
        />
      )}
    </div>
  );
};

export default Users;
