import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  FiCheckSquare, FiAlertTriangle, FiTrendingUp, FiFolder,
  FiUsers, FiTarget, FiPlus, FiClock
} from 'react-icons/fi';

const STATUS_COLORS = {
  todo: '#64748b', in_progress: '#3b82f6', in_review: '#8b5cf6',
  blocked: '#ef4444', completed: '#10b981', cancelled: '#475569'
};
const PRIORITY_COLORS = {
  low: '#10b981', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444'
};

const ActivityIcon = ({ action }) => {
  const icons = {
    task_created: '✅', task_updated: '✏️', task_completed: '🎉',
    task_assigned: '👤', task_status_changed: '🔄', task_priority_changed: '⚡',
    project_created: '📁', project_updated: '📝', comment_added: '💬',
    user_login: '🔑', user_created: '👥', user_role_changed: '🛡️'
  };
  return <span style={{ fontSize: '14px' }}>{icons[action] || '📌'}</span>;
};

const PriorityDot = ({ priority }) => (
  <span className={`priority-dot ${priority}`} />
);

const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status}`}>
    {status?.replace('_', ' ')}
  </span>
);

const Dashboard = () => {
  const { user, isManagerOrAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data.data),
    refetchInterval: 60000
  });

  const { data: workload } = useQuery({
    queryKey: ['workload'],
    queryFn: () => api.get('/dashboard/workload').then(r => r.data.data),
    enabled: isManagerOrAdmin
  });

  if (isLoading) return (
    <div className="loader">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        <div className="loading-text">Loading dashboard...</div>
      </div>
    </div>
  );

  const { summary = {}, tasksByStatus = {}, tasksByPriority = {}, recentActivity = [], upcomingTasks = [], completionTrend = [], topPerformers = [] } = dashData || {};

  const statusData = Object.entries(tasksByStatus).map(([name, value]) => ({ name: name.replace('_', ' '), value, color: STATUS_COLORS[name] }));
  const trendData = completionTrend.map(d => ({ date: format(new Date(d._id), 'MMM d'), completed: d.count }));

  return (
    <div className="animate-fade">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>
            {new Date().getHours() < 12 ? '☀️ Good morning' : new Date().getHours() < 17 ? '👋 Good afternoon' : '🌙 Good evening'}, {user?.name?.split(' ')[0]}!
          </h1>
          <p>Here's what's happening across your workspace today</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/tasks')}>
            <FiPlus /> New Task
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon indigo"><FiCheckSquare /></div>
          <div className="stat-info">
            <div className="stat-value">{summary.totalTasks || 0}</div>
            <div className="stat-label">Total Tasks</div>
            <div className="stat-change up">
              <FiTrendingUp /> {summary.createdThisWeek || 0} this week
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><FiTarget /></div>
          <div className="stat-info">
            <div className="stat-value">{summary.completedThisMonth || 0}</div>
            <div className="stat-label">Completed This Month</div>
            <div className="stat-change up">
              <FiTrendingUp /> {summary.completionRate || 0}% completion rate
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red"><FiAlertTriangle /></div>
          <div className="stat-info">
            <div className="stat-value">{summary.overdueCount || 0}</div>
            <div className="stat-label">Overdue Tasks</div>
            {summary.overdueCount > 0 && (
              <div className="stat-change down">⚠️ Needs attention</div>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue"><FiFolder /></div>
          <div className="stat-info">
            <div className="stat-value">{summary.totalProjects || 0}</div>
            <div className="stat-label">Active Projects</div>
          </div>
        </div>

        {isManagerOrAdmin && (
          <div className="stat-card">
            <div className="stat-icon purple"><FiUsers /></div>
            <div className="stat-info">
              <div className="stat-value">{summary.totalUsers || 0}</div>
              <div className="stat-label">Team Members</div>
            </div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-icon yellow"><FiTrendingUp /></div>
          <div className="stat-info">
            <div className="stat-value">{summary.completionRate || 0}%</div>
            <div className="stat-label">Completion Rate</div>
            <div style={{ marginTop: '8px' }}>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${summary.completionRate || 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Completion Trend */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">📈 Completion Trend (7 days)</div>
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e2028', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} fill="url(#completedGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <div className="empty-icon">📊</div>
              <div className="empty-text">No completion data yet</div>
            </div>
          )}
        </div>

        {/* Task Distribution */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">📊 Tasks by Status</div>
          </div>
          {statusData.length > 0 ? (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e2028', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {statusData.map(({ name, value, color }) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{name}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <div className="empty-icon">📊</div>
              <div className="empty-text">No tasks yet</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Upcoming Tasks */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">⏰ Upcoming Tasks</div>
            <span className="section-link" onClick={() => navigate('/tasks?dueDate=week')}>View all →</span>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-icon">🎉</div>
              <div className="empty-title">All caught up!</div>
              <div className="empty-text">No tasks due in the next 7 days</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingTasks.map(task => (
                <div key={task._id}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'var(--transition)' }}
                  onClick={() => navigate(`/tasks/${task._id}`)}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseOut={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                >
                  <PriorityDot priority={task.priority} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <FiClock size={10} />
                      {format(new Date(task.dueDate), 'MMM d')}
                    </div>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">📋 Recent Activity</div>
            <span className="section-link" onClick={() => navigate('/activity')}>View all →</span>
          </div>
          {recentActivity.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-icon">📋</div>
              <div className="empty-text">No recent activity</div>
            </div>
          ) : (
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {recentActivity.map(activity => (
                <div key={activity._id} className="activity-item">
                  <div className="activity-icon">
                    <ActivityIcon action={activity.action} />
                  </div>
                  <div className="activity-content">
                    <div className="activity-text">
                      <strong>{activity.user?.name}</strong>{' '}
                      {activity.action?.replace(/_/g, ' ')}{' '}
                      {activity.entityTitle && <strong>"{activity.entityTitle}"</strong>}
                    </div>
                    <div className="activity-time">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Performers & Workload */}
      {isManagerOrAdmin && (topPerformers?.length > 0 || workload?.length > 0) && (
        <div className="grid-2">
          {/* Top Performers */}
          {topPerformers?.length > 0 && (
            <div className="card">
              <div className="section-header">
                <div className="section-title">🏆 Top Performers This Month</div>
              </div>
              {topPerformers.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#f59e0b' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: i < 3 ? '#000' : 'var(--text-muted)', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div className="avatar avatar-sm">{p.user?.name?.[0] || 'U'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.user?.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.user?.role}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '13px', fontWeight: '700' }}>
                    <FiCheckSquare size={13} /> {p.completed}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Workload */}
          {workload?.length > 0 && (
            <div className="card">
              <div className="section-header">
                <div className="section-title">⚖️ Team Workload</div>
                <span className="section-link" onClick={() => navigate('/users')}>View team →</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={workload.filter(w => w.user)} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="user.name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: '#1e2028', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Tasks" />
                  <Bar dataKey="critical" fill="#ef4444" radius={[0, 4, 4, 0]} name="Critical" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
