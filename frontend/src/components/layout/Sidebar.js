import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid, FiCheckSquare, FiFolder, FiUsers, FiActivity,
  FiUser, FiLogOut
} from 'react-icons/fi';

const navItems = [
  { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/tasks', icon: FiCheckSquare, label: 'Tasks' },
  { to: '/projects', icon: FiFolder, label: 'Projects' },
];

const adminItems = [
  { to: '/users', icon: FiUsers, label: 'Team Members' },
];

const bottomItems = [
  { to: '/activity', icon: FiActivity, label: 'Activity Log' },
  { to: '/profile', icon: FiUser, label: 'Profile' },
];

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getRoleColor = (role) => {
  if (role === 'admin') return 'var(--primary-light)';
  if (role === 'manager') return 'var(--success)';
  return 'var(--text-muted)';
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isManagerOrAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚡</div>
        <div className="sidebar-logo-text">
          <span className="logo-title">SmartOps</span>
          <span className="logo-subtitle">Operations Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-label">Main</div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={onClose}>
              <Icon className="sidebar-item-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        {isManagerOrAdmin && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">Management</div>
            {adminItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <Icon className="sidebar-item-icon" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        )}

        <div className="sidebar-section">
          <div className="sidebar-section-label">Account</div>
          {bottomItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} onClick={onClose}>
              <Icon className="sidebar-item-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Role badge */}
        <div style={{
          padding: '8px 10px',
          marginBottom: '8px',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Role</div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: getRoleColor(user?.role), textTransform: 'capitalize' }}>
            {user?.role === 'admin' ? '👑' : user?.role === 'manager' ? '🔷' : '👤'} {user?.role}
          </div>
        </div>

        <div className="sidebar-user">
          <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)' }}>
            {getInitials(user?.name)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.department || user?.role}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="sidebar-item"
          style={{ width: '100%', color: 'var(--danger-light)', marginTop: '4px' }}
        >
          <FiLogOut className="sidebar-item-icon" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
