import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { 
  ShieldCheck, Lock, Bell, Moon, Sun, Volume2, 
  VolumeX, Save, CheckCircle, AlertCircle, RefreshCw, 
  KeyRound, ShieldAlert, Cpu, Eye, EyeOff, LogOut 
} from 'lucide-react';

const API_BASE = 'http://localhost:8001/api';

export function SettingsView({ role = 'BUYER' }) {
  const { token, user, logout } = useAuth();
  const { showSuccess, showError } = useModal();

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Preferences State
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    bidding_sounds: true,
    auto_rank_alerts: true,
    compact_tables: false,
    theme: 'light'
  });

  const fetchPreferences = async () => {
    setPrefsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/user/preferences`, { headers });
      if (res.data?.preferences) {
        setPreferences(res.data.preferences);
      }
    } catch (err) {
      console.error('Failed fetching preferences:', err);
    } finally {
      setPrefsLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [token]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_BASE}/user/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      }, { headers });

      showSuccess('Password Changed', res.data.message || 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Failed updating password. Verify current password.');
      showError('Update Failed', err.response?.data?.detail || 'Could not change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleTogglePref = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API_BASE}/user/preferences`, preferences, { headers });
      showSuccess('Preferences Saved', 'Your system preferences have been updated.');
    } catch (err) {
      showError('Save Failed', 'Could not save preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="settings-container" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="top-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1>System & Security Settings</h1>
          <p className="text-muted">Manage your authentication credentials, notification triggers, and platform preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Card 1: Password & Security */}
        <div className="card">
          <div className="card-header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="#059669" />
              <h3>Change Password</h3>
            </div>
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={() => setShowPass(!showPass)}
              style={{ fontSize: '12px' }}
            >
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />} {showPass ? 'Hide' : 'Show'} Passwords
            </button>
          </div>

          {passwordError && (
            <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertCircle size={16} />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input 
                type={showPass ? 'text' : 'password'} 
                className="form-control" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                placeholder="Enter current password"
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password (Min. 6 Characters)</label>
              <input 
                type={showPass ? 'text' : 'password'} 
                className="form-control" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Enter new password"
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input 
                type={showPass ? 'text' : 'password'} 
                className="form-control" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Re-enter new password"
                required 
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '8px', backgroundColor: '#0F172A' }}
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Updating Security Hash...
                </>
              ) : (
                <>
                  <KeyRound size={16} /> Update Password
                </>
              )}
            </button>
          </form>
        </div>

        {/* Card 2: Notifications & Platform Preferences */}
        <div className="card">
          <div className="card-header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} color="#059669" />
              <h3>Notification & Audio Preferences</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>Email Event Notifications</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Receive contract award letters, OTP codes, and approval notices</div>
              </div>
              <input 
                type="checkbox" 
                checked={preferences.email_notifications} 
                onChange={() => handleTogglePref('email_notifications')} 
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#059669' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>Live Bidding Sound Effects</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Play audio notifications upon incoming counter-bids</div>
              </div>
              <input 
                type="checkbox" 
                checked={preferences.bidding_sounds} 
                onChange={() => handleTogglePref('bidding_sounds')} 
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#059669' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>Real-Time Rank Shift Alerts</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Display popover alerts when vendor rank changes dynamically</div>
              </div>
              <input 
                type="checkbox" 
                checked={preferences.auto_rank_alerts} 
                onChange={() => handleTogglePref('auto_rank_alerts')} 
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#059669' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>High-Density Table View</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Compact table layout for high-volume auctions</div>
              </div>
              <input 
                type="checkbox" 
                checked={preferences.compact_tables} 
                onChange={() => handleTogglePref('compact_tables')} 
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#059669' }}
              />
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSavePreferences}
              disabled={savingPrefs}
              style={{ width: '100%', marginTop: '8px', backgroundColor: '#059669' }}
            >
              {savingPrefs ? <RefreshCw size={16} className="spin" /> : <Save size={16} />} Save Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Card 3: Session & Compliance Governance */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#059669" />
            <h3>Session & Governance Audit Status</h3>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Authenticated Role</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>{user?.role || role}</div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Account Status</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
              {user?.status === 'approved' ? '✓ Approved & Verified' : user?.status || 'Active'}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Cryptographic Hash</div>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#334155', marginTop: '6px' }}>
              SHA256 Chained
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '13px', color: '#64748B' }}>
            Need to switch accounts or end your active session?
          </span>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={logout}
            style={{ height: '36px', fontSize: '12px' }}
          >
            <LogOut size={14} /> End Active Session
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
