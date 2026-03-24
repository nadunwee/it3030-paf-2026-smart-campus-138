import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const quickLogins = [
    { label: 'Login as Admin', email: 'admin@smartcampus.lk', name: 'System Admin', role: 'ADMIN' },
    { label: 'Login as Technician', email: 'tech@smartcampus.lk', name: 'John Technician', role: 'TECHNICIAN' },
    { label: 'Login as Student', email: 'student@smartcampus.lk', name: 'Alice Student', role: 'USER' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, name || email.split('@')[0], role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (q) => {
    setLoading(true);
    setError('');
    try {
      await login(q.email, q.name, q.role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎓</div>
          <h1>Smart Campus Hub</h1>
          <p>SLIIT – IT3030 PAF Assignment 2026</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@smartcampus.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Name (optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="USER">User (Student / Staff)</option>
              <option value="ADMIN">Admin</option>
              <option value="TECHNICIAN">Technician</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '1.25rem 0', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
          — Quick Login —
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {quickLogins.map((q) => (
            <button
              key={q.role}
              className="btn btn-secondary w-full"
              onClick={() => handleQuickLogin(q)}
              disabled={loading}
            >
              {q.label}
            </button>
          ))}
        </div>

        <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--gray-400)' }}>
          Demo mode – OAuth 2.0 (Google) integration available in production
        </p>
      </div>
    </div>
  );
}
