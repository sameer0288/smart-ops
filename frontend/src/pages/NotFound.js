import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔍</div>
        <h1 style={{ fontSize: '48px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '12px' }}>404</h1>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px' }}>Page not found</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;
