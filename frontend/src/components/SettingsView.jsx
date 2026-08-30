import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import {
  Lock, Bell, Save, RefreshCw,
  KeyRound, Eye, EyeOff, AlertCircle, LogOut, User, ChevronRight, ChevronLeft
} from 'lucide-react';

const API_BASE = 'http://localhost:8001/api';

const MENU_ITEMS = [
  { key: 'PASSWORD', icon: Lock, label: 'Password & Security', desc: 'Change your account password' },
  { key: 'NOTIFICATIONS', icon: Bell, label: 'Notifications', desc: 'Emails, sounds, and rank alerts' },
  { key: 'ACCOUNT', icon: User, label: 'Account', desc: 'Role, status, and sign out' }
];

export function SettingsView({ role = 'BUYER' }) {
  const { token, user, logout } = useAuth();
  const { showSuccess, showError } = useModal();

  const [section, setSection] = useState(null); // null = menu list, else one of MENU_ITEMS keys

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
    compact_tables: false
  });

  const fetchPreferences = async () => {
    if (!token) return;
    setPrefsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/user/preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const res = await axios.post(`${API_BASE}/user/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      }, { headers: { Authorization: `Bearer ${token}` } });

      showSuccess('Password Changed', res.data.message || 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update password. Check your current password.';
      setPasswordError(msg);
      showError('Update Failed', msg);
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
      await axios.put(`${API_BASE}/user/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess('Preferences Saved', 'Your settings have been updated.');
    } catch (err) {
      showError('Save Failed', 'Could not save preferences. Please try again.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const activeMenuItem = MENU_ITEMS.find(m => m.key === section);

  // ---------------- MENU LIST (Instagram-style) ----------------
  if (!section) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div className="top-header" style={{ marginBottom: '24px' }}>
          <div>
            <h1>Settings</h1>
            <p className="text-muted">Manage your password, notifications, and account</p>
          </div>
        </div>

        <div className="card" style={{ padding: '8px' }}>
          {MENU_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSection(item.key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: idx < MENU_ITEMS.length - 1 ? '1px solid #E2E8F0' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={19} color="#059669" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{item.desc}</div>
                </div>
                <ChevronRight size={18} color="#94A3B8" style={{ flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------------- SUBSECTION HEADER (shared) ----------------
  const SectionHeader = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
      <button
        type="button"
        onClick={() => setSection(null)}
        aria-label="Back to Settings"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        <ChevronLeft size={18} />
      </button>
      <div>
        <h1 style={{ fontSize: '20px' }}>{activeMenuItem?.label}</h1>
        <p className="text-muted" style={{ fontSize: '13px' }}>{activeMenuItem?.desc}</p>
      </div>
    </div>
  );

  // ---------------- PASSWORD & SECURITY ----------------
  if (section === 'PASSWORD') {
    return (
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <SectionHeader />

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
                <><RefreshCw size={16} className="spin" /> Updating...</>
              ) : (
                <><KeyRound size={16} /> Update Password</>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------- NOTIFICATIONS ----------------
  if (section === 'NOTIFICATIONS') {
    return (
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <SectionHeader />

        <div className="card">
          <div className="card-header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} color="#059669" />
              <h3>Notification Preferences</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>Email Notifications</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Receive emails for awards, OTPs, and approvals</div>
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
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>Bidding Sound Effects</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Play sounds when new bids come in</div>
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
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>Rank Change Alerts</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Show a pop-up when your bid rank changes</div>
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
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>Compact Table View</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Show more rows in smaller table rows</div>
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
    );
  }

  // ---------------- ACCOUNT ----------------
  return (
    <div style={{ maxWidth: '520px', margin: '0 auto' }}>
      <SectionHeader />

      <div className="card">
        <div className="card-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="#059669" />
            <h3>Account Info</h3>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Role</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>{user?.role || role}</div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Account Status</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
              {user?.status === 'approved' ? 'Active' : user?.status || 'Active'}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Email</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A', marginTop: '4px', wordBreak: 'break-all' }}>{user?.email}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '13px', color: '#64748B' }}>
            Want to sign out of this account?
          </span>
          <button
            type="button"
            className="btn btn-danger"
            onClick={logout}
            style={{ height: '36px', fontSize: '12px' }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
