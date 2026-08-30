import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ReBidLogo } from '../components/ReBidLogo';
import { Mail, Lock, ArrowRight, AlertCircle, Loader, ShoppingBag, Truck, ShieldCheck, CheckCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8001/api';

export function UnifiedLogin({ onNavigate = null }) {
  const { login } = useAuth();
  
  // Read role from query param if provided
  const queryParams = new URLSearchParams(window.location.search);
  const initialRole = (queryParams.get('role') || 'BUYER').toUpperCase();
  
  const [selectedRole, setSelectedRole] = useState(
    ['BUYER', 'VENDOR', 'ADMIN'].includes(initialRole) ? initialRole : 'BUYER'
  );

  const roleCredentials = {
    BUYER: { email: 'buyer@rebid.ai', password: 'password123', label: 'Buyer Portal', color: '#0F172A', icon: <ShoppingBag size={18} /> },
    VENDOR: { email: 'vendor1@rebid.ai', password: 'password123', label: 'Vendor Portal', color: '#059669', icon: <Truck size={18} /> },
    ADMIN: { email: 'admin@rebid.ai', password: 'password123', label: 'Admin Governance', color: '#0F172A', icon: <ShieldCheck size={18} /> }
  };

  const [email, setEmail] = useState(roleCredentials[selectedRole]?.email || '');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigateTo = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setError('');
    setEmail(roleCredentials[roleKey]?.email || '');
    setPassword(roleCredentials[roleKey]?.password || 'password123');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both email and password');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: email.trim(),
        password
      });

      login(res.data.access_token, res.data);
      
      const userStatus = res.data.status;
      const userRole = res.data.role;

      if (userStatus === 'approved') {
        if (userRole === 'ADMIN') {
          navigateTo('/admin');
        } else if (userRole === 'BUYER') {
          navigateTo('/buyer');
        } else if (userRole === 'VENDOR') {
          navigateTo('/vendor');
        } else {
          navigateTo('/');
        }
      } else if (userStatus === 'pending_approval' || userStatus === 'under_review') {
        navigateTo('/auth/under-review');
      } else if (userStatus === 'amendment_required') {
        navigateTo('/auth/re-upload');
      } else if (userStatus === 'pending_documents') {
        navigateTo('/auth/upload-documents');
      } else if (userStatus === 'pending_verification') {
        navigateTo('/auth/verify-email');
      } else if (userStatus === 'rejected') {
        navigateTo('/auth/rejected');
      } else {
        navigateTo('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Invalid email or password. Please verify credentials.');
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
      backgroundColor: '#F8FAFC',
      padding: '24px 16px'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '460px',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #CBD5E1',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15), 0 10px 20px -5px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        padding: '36px 32px'
      }}>
        {/* Brand Header */}
        <div style={{ marginBottom: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ReBidLogo size="lg" variant="dark" style={{ marginBottom: '10px' }} />
          <p style={{ color: '#64748B', fontSize: '13px', fontWeight: '500' }}>
            Reverse Auction Platform
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '6px', 
          backgroundColor: '#F1F5F9', 
          padding: '4px', 
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          {['BUYER', 'VENDOR', 'ADMIN'].map((roleKey) => {
            const isSelected = selectedRole === roleKey;
            const isVendor = roleKey === 'VENDOR';
            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => handleRoleSelect(roleKey)}
                style={{
                  padding: '10px 6px',
                  borderRadius: '9px',
                  border: isSelected ? '1px solid #CBD5E1' : '1px solid transparent',
                  backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                  color: isSelected ? (isVendor ? '#059669' : '#0F172A') : '#64748B',
                  fontWeight: isSelected ? '800' : '600',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: isSelected ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {roleCredentials[roleKey].icon}
                <span>{roleKey === 'BUYER' ? 'Buyer' : roleKey === 'VENDOR' ? 'Vendor' : 'Admin'}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{ 
            padding: '12px 14px', 
            backgroundColor: '#FEF2F2', 
            border: '1px solid #FCA5A5', 
            borderRadius: '10px',
            color: '#991B1B',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '700', 
              color: '#0F172A', 
              marginBottom: '6px' 
            }}>
              {selectedRole === 'BUYER' ? 'Buyer Organization Email' : selectedRole === 'VENDOR' ? 'Vendor Account Email' : 'Admin Email'}
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
                placeholder="you@company.com"
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
                onFocus={(e) => { e.target.style.borderColor = selectedRole === 'VENDOR' ? '#059669' : '#0F172A'; }}
                onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ 
                fontSize: '13px', 
                fontWeight: '700', 
                color: '#0F172A' 
              }}>
                Password
              </label>
            </div>
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
                placeholder="Enter password"
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
                onFocus={(e) => { e.target.style.borderColor = selectedRole === 'VENDOR' ? '#059669' : '#0F172A'; }}
                onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#94A3B8' : selectedRole === 'VENDOR' ? '#059669' : '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '700',
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
                Authenticating {roleCredentials[selectedRole]?.label}...
              </>
            ) : (
              <>
                Sign In as {selectedRole === 'BUYER' ? 'Buyer' : selectedRole === 'VENDOR' ? 'Vendor' : 'Admin'} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>
            Quick Demo Logins (Password: password123)
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {selectedRole === 'BUYER' && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
                onClick={() => { setEmail('buyer@rebid.ai'); setPassword('password123'); }}
              >
                buyer@rebid.ai
              </button>
            )}

            {selectedRole === 'VENDOR' && (
              <>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ fontSize: '11px', height: '28px', padding: '0 8px' }}
                  onClick={() => { setEmail('vendor1@rebid.ai'); setPassword('password123'); }}
                >
                  HP (vendor1@rebid.ai)
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ fontSize: '11px', height: '28px', padding: '0 8px' }}
                  onClick={() => { setEmail('tatasteel@rebid.ai'); setPassword('password123'); }}
                >
                  Tata Steel
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ fontSize: '11px', height: '28px', padding: '0 8px' }}
                  onClick={() => { setEmail('bluedart@rebid.ai'); setPassword('password123'); }}
                >
                  Blue Dart
                </button>
              </>
            )}

            {selectedRole === 'ADMIN' && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
                onClick={() => { setEmail('admin@rebid.ai'); setPassword('password123'); }}
              >
                admin@rebid.ai
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <a
            href="/auth/register"
            onClick={(e) => { e.preventDefault(); navigateTo('/auth/register'); }}
            style={{
              color: '#059669',
              fontWeight: '700',
              fontSize: '13px',
              textDecoration: 'none'
            }}
          >
            Register New Account
          </a>
        </div>
      </div>
    </div>
  );
}

export default UnifiedLogin;
