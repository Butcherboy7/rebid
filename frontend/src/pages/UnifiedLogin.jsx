import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, AlertCircle, Loader } from 'lucide-react';

const API_BASE = 'http://localhost:8001/api';

export function UnifiedLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password
      });

      login(res.data.access_token, res.data);
      
      const userStatus = res.data.status;
      const userRole = res.data.role;

      if (userStatus === 'approved') {
        if (userRole === 'ADMIN') {
          window.location.href = '/admin';
        } else if (userRole === 'BUYER') {
          window.location.href = '/buyer';
        } else if (userRole === 'VENDOR') {
          window.location.href = '/vendor';
        }
      } else if (userStatus === 'pending_approval') {
        window.location.href = '/auth/under-review';
      } else if (userStatus === 'amendment_required') {
        window.location.href = '/auth/re-upload';
      } else if (userStatus === 'pending_documents') {
        window.location.href = '/auth/upload-documents';
      } else if (userStatus === 'pending_verification') {
        window.location.href = '/auth/verify-email';
      } else if (userStatus === 'rejected') {
        window.location.href = '/auth/rejected';
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#F9FAFB',
      padding: '20px'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '420px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #CBD5E1',
        boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.15), 0 8px 16px -4px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        padding: '40px'
      }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '800', 
            color: '#0F172A', 
            marginBottom: '8px' 
          }}>
            ReBid AI Login
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>
            Enterprise Procurement Platform
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '12px 16px', 
            backgroundColor: '#FEF2F2', 
            border: '1px solid #FCA5A5', 
            borderRadius: '8px',
            color: '#991B1B',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#0F172A', 
              marginBottom: '8px' 
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#94A3B8' 
              }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 42px',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(15, 23, 42, 0.04)',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#0F172A'; e.target.style.boxShadow = '0 0 0 3px rgba(15, 23, 42, 0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(15, 23, 42, 0.04)'; }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#0F172A', 
              marginBottom: '8px' 
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#94A3B8' 
              }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 42px',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(15, 23, 42, 0.04)',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#0F172A'; e.target.style.boxShadow = '0 0 0 3px rgba(15, 23, 42, 0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(15, 23, 42, 0.04)'; }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#94A3B8' : '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? (
              <>
                <Loader size={18} className="spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ color: '#64748B', fontSize: '14px' }}>
            Don't have an account?{' '}
            <a 
              href="/auth/register" 
              style={{ 
                color: '#0F172A', 
                fontWeight: '600', 
                textDecoration: 'none' 
              }}
            >
              Register here
            </a>
          </p>
        </div>

        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
          <p style={{ color: '#94A3B8', fontSize: '12px', textAlign: 'center' }}>
            Demo accounts: buyer@rebid.ai / vendor1@rebid.ai / admin@rebid.ai<br />
            Password: password123
          </p>
        </div>
      </div>
    </div>
  );
}
