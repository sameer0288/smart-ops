import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiBell, FiMenu, FiSearch, FiX, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Tasks',
  '/projects': 'Projects',
  '/users': 'Team Members',
  '/activity': 'Activity Log',
  '/profile': 'Profile'
};

const Topbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState('');
  const notifRef = useRef(null);

  const title = PAGE_TITLES[location.pathname] || 'SmartOps';

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications?limit=8'),
        api.get('/notifications/count')
      ]);
      setNotifications(notifRes.data.data);
      setUnreadCount(countRes.data.count);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/tasks?search=${encodeURIComponent(search)}`);
      setSearch('');
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  return (
    <header className="topbar">
      <button className="icon-btn menu-toggle" onClick={onMenuClick}>
        <FiMenu />
      </button>

      <div className="topbar-title">{title}</div>

      {/* Search */}
      <div className="topbar-search">
        <FiSearch style={{ color: 'var(--text-muted)', fontSize: '14px', flexShrink: 0 }} />
        <input
          placeholder="Search tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearch}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            <FiX />
          </button>
        )}
      </div>

      <div className="topbar-actions">
        {/* Notifications */}
        <div className="dropdown" ref={notifRef}>
          <button className="icon-btn" onClick={() => setShowNotifs(!showNotifs)}>
            <FiBell />
            {unreadCount > 0 && <span className="notif-badge" />}
          </button>

          {showNotifs && (
            <div className="dropdown-menu" style={{ width: '360px', right: '-60px', padding: 0 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: '700' }}>
                  Notifications {unreadCount > 0 && <span style={{ fontSize: '11px', background: 'var(--danger)', color: 'white', padding: '1px 6px', borderRadius: '10px', marginLeft: '4px' }}>{unreadCount}</span>}
                </span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: '12px', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiCheck size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px' }}>
                    <div className="empty-icon">🔔</div>
                    <div className="empty-text">No notifications</div>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n._id} className={`notification-item ${!n.isRead ? 'unread' : ''}`}>
                      <div className="notification-content">
                        <div className="notification-title">{n.title}</div>
                        <div className="notification-msg">{n.message}</div>
                        <div className="notification-time">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <button
          className="avatar"
          onClick={() => navigate('/profile')}
          style={{ cursor: 'pointer' }}
          data-tooltip={user?.name}
        >
          {getInitials(user?.name)}
        </button>
      </div>
    </header>
  );
};

export default Topbar;
