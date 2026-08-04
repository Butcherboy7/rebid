import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Lock, AlertCircle, CheckCircle, Key } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export function BuyerLogin({ onLoginSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('buyer@rebid.ai');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('buyer@rebid.ai');
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/buyer/login`, { email, password });
      login(res.data.access_token, res.data);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetMessage('');
    setResetError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/reset-password`, { email: resetEmail, new_password: newPassword });
      setResetMessage(res.data.message);
      setTimeout(() => {
        setShowResetModal(false);
        setPassword(newPassword);
      }, 2000);
    } catch (err) {
      setResetError(err.response?.data?.detail || 'Failed resetting password');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#111827', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#FFF' }}>
            <ShoppingBag size={24} />
          </div>
          <h1>Buyer Portal</h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>Enterprise Procurement & Auction Management</p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Buyer Email</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <button 
                type="button" 
                className="btn-ghost" 
                style={{ fontSize: '12px', color: '#059669', cursor: 'pointer', padding: 0 }}
                onClick={() => setShowResetModal(true)}
              >
                Forgot Password?
              </button>
            </div>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            <Lock size={16} />
            {loading ? 'Authenticating...' : 'Sign In as Buyer'}
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '12px', marginBottom: '8px' }}>Demo Credentials:</p>
          <code style={{ background: '#F3F4F6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#111827' }}>
            buyer@rebid.ai / password123
          </code>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Key size={20} color="#059669" />
              <h2>Reset Password</h2>
            </div>

            {resetMessage && (
              <div style={{ padding: '10px', background: '#DCFCE7', color: '#15803D', borderRadius: '8px', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={15} />
                <span>{resetMessage}</span>
              </div>
            )}

            {resetError && (
              <div style={{ padding: '10px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit}>
              <div className="form-group">
                <label className="form-label">Account Email</label>
                <input type="email" className="form-control" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" required />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowResetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
