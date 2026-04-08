import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiBriefcase } from 'react-icons/fi';

const Register = () => {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authRegister({
        name: data.name,
        email: data.email,
        password: data.password,
        department: data.department,
        designation: data.designation
      });
      toast.success('Account created successfully! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg" />

      <div className="auth-left">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '60px' }}>
            <div className="sidebar-logo-icon">⚡</div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>SmartOps</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Operations Platform</div>
            </div>
          </div>

          <h1 style={{ fontSize: '38px', fontWeight: '900', lineHeight: '1.2', marginBottom: '16px' }}>
            Join your team on{' '}
            <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SmartOps</span>
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '380px', lineHeight: '1.7' }}>
            Create your account and start working smarter with your team.
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">⚡</div>
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">New accounts are created as team members</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <FiUser style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '15px' }} />
                  <input
                    {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
                    className="form-control"
                    placeholder="John Doe"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
                {errors.name && <div className="form-error">{errors.name.message}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <div style={{ position: 'relative' }}>
                  <FiBriefcase style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '15px' }} />
                  <input
                    {...register('department')}
                    className="form-control"
                    placeholder="Engineering"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>
            </div>

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
              <label className="form-label">Designation</label>
              <input
                {...register('designation')}
                className="form-control"
                placeholder="Frontend Developer"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '15px' }} />
                  <input
                    {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })}
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="••••••••"
                    style={{ paddingLeft: '40px', paddingRight: '40px' }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && <div className="form-error">{errors.password.message}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm password',
                    validate: val => val === password || 'Passwords do not match'
                  })}
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <div className="form-error">{errors.confirmPassword.message}</div>}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ marginBottom: '20px' }}>
              {loading ? <div className="spinner spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : 'Create Account'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: '600' }}>Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
