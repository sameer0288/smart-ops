import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back! 👋');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin: { email: 'admin@smartops.com', password: 'Admin@123' },
      manager: { email: 'manager@smartops.com', password: 'Manager@123' },
      user: { email: 'sarah@smartops.com', password: 'User@123' }
    };
    setValue('email', creds[role].email);
    setValue('password', creds[role].password);
    toast.success(`${role} credentials filled!`);
  };

  return (
    <div className="auth-container">
      <div className="auth-bg" />

      {/* Left Panel */}
      <div className="auth-left">
        <div style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '60px' }}>
            <div className="sidebar-logo-icon">⚡</div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>SmartOps</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Operations Platform</div>
            </div>
          </div>

          <h1 style={{ fontSize: '42px', fontWeight: '900', lineHeight: '1.15', marginBottom: '16px', color: 'var(--text-primary)' }}>
            Operate Smarter,<br />
            <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Scale Faster
            </span>
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: '1.7' }}>
            The all-in-one platform for managing tasks, projects, and team operations with clarity and speed.
          </p>
        </div>

        {/* Feature highlights */}
        {['Role-based access control', 'Real-time activity tracking', 'Smart task automation', 'Team collaboration'].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '28px', height: '28px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>✓</div>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">⚡</div>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your SmartOps account</p>
          </div>

          {/* Demo Credentials */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>
              Quick Login (Demo)
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['admin', 'manager', 'user'].map(role => (
                <button key={role} onClick={() => fillDemo(role)} className="btn btn-secondary btn-sm" style={{ flex: 1, textTransform: 'capitalize' }}>
                  {role === 'admin' ? '👑' : role === 'manager' ? '🔷' : '👤'} {role}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <FiMail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '15px' }} />
                <input
                  {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                  type="email"
                  className="form-control"
                  placeholder="you@company.com"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
              {errors.email && <div className="form-error">{errors.email.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '15px' }} />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '15px' }}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <div className="form-error">{errors.password.message}</div>}
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ marginBottom: '20px' }}>
              {loading ? <div className="spinner spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : (
                <><span>Sign In</span> <FiArrowRight /></>
              )}
            </button>

            <p style={{ textAlign: 'center', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: '600' }}>Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
