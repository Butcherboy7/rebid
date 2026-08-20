import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { 
  User, Building, Mail, Phone, MapPin, ShieldCheck, 
  CreditCard, Edit3, Save, CheckCircle, RefreshCw, 
  Briefcase, FileText, Lock, AlertCircle 
} from 'lucide-react';

const API_BASE = 'http://localhost:8001/api';

export function ProfileView({ role = 'BUYER' }) {
  const { token, user } = useAuth();
  const { showSuccess, showError } = useModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [profile, setProfile] = useState({
    user_id: '',
    email: '',
    name: '',
    role: '',
    status: '',
    email_verified: false,
    created_at: '',
    company_name: '',
    category: 'IT Hardware',
    verified: false,
    rating: 4.5,
    rep_name: '',
    rep_designation: '',
    rep_phone: '',
    rep_email: '',
    gst_number: '',
    pan_number: '',
    cin: '',
    org_type: '',
    years_in_business: '',
    registered_address: '',
    bank_account_name: '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_upi: ''
  });

  const [formData, setFormData] = useState({ ...profile });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/user/profile`, { headers });
      if (res.data) {
        setProfile(res.data);
        setFormData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      showError('Error', 'Failed loading profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.put(`${API_BASE}/user/profile`, formData, { headers });
      setProfile(res.data);
      setFormData(res.data);
      setEditMode(false);
      showSuccess('Profile Updated', 'Your profile details have been saved successfully.');
    } catch (err) {
      console.error('Failed to update profile:', err);
      showError('Update Failed', err.response?.data?.detail || 'Could not save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...profile });
    setEditMode(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748B' }}>
        <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px auto', display: 'block', color: '#059669' }} />
        <p style={{ fontWeight: '600' }}>Loading Profile Data...</p>
      </div>
    );
  }

  const isVendor = profile.role === 'VENDOR' || role === 'VENDOR';

  return (
    <div className="profile-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div 
        className="card" 
        style={{ 
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
          color: '#FFFFFF',
          padding: '32px',
          marginBottom: '24px',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div 
              style={{ 
                width: '72px', 
                height: '72px', 
                borderRadius: '16px', 
                backgroundColor: isVendor ? '#059669' : '#2563EB', 
                color: '#FFF', 
                fontWeight: '900', 
                fontSize: '28px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
              }}
            >
              {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'U'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: '800', margin: 0 }}>
                  {profile.company_name || profile.name}
                </h1>
                {profile.verified ? (
                  <span className="badge badge-completed" style={{ background: '#059669', color: '#FFF', fontSize: '11px', padding: '4px 10px' }}>
                    <ShieldCheck size={14} /> VERIFIED {profile.role}
                  </span>
                ) : (
                  <span className="badge" style={{ background: '#F59E0B', color: '#000', fontSize: '11px', padding: '4px 10px' }}>
                    {profile.status?.toUpperCase() || 'PENDING'}
                  </span>
                )}
              </div>
              <p style={{ color: '#94A3B8', fontSize: '14px', marginTop: '6px' }}>
                {profile.role} Account • ID: <code style={{ color: '#38BDF8' }}>{profile.user_id}</code>
              </p>
            </div>
          </div>

          <div>
            {!editMode ? (
              <button 
                className="btn btn-secondary" 
                onClick={() => setEditMode(true)}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }}
              >
                <Edit3 size={16} /> Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCancel}
                  disabled={saving}
                  style={{ backgroundColor: 'transparent', color: '#E2E8F0', borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={saving}
                  style={{ backgroundColor: '#059669' }}
                >
                  {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />} Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Section 1: Personal & Contact Information */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="#059669" />
              <h3>Personal & Contact Details</h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Full Name / Primary Contact</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.name || ''} 
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={!editMode}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Registered Email</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" 
                  className="form-control" 
                  value={profile.email || ''} 
                  disabled 
                  style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}
                />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#059669', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={14} /> Verified
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Representative Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.rep_name || ''} 
                onChange={(e) => handleChange('rep_name', e.target.value)}
                disabled={!editMode}
                placeholder="Authorized contact person"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Representative Designation</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.rep_designation || ''} 
                onChange={(e) => handleChange('rep_designation', e.target.value)}
                disabled={!editMode}
                placeholder="e.g. Director, Procurement Lead"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                type="tel" 
                className="form-control" 
                value={formData.rep_phone || ''} 
                onChange={(e) => handleChange('rep_phone', e.target.value)}
                disabled={!editMode}
                placeholder="+91 9876543210"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Representative Email</label>
              <input 
                type="email" 
                className="form-control" 
                value={formData.rep_email || ''} 
                onChange={(e) => handleChange('rep_email', e.target.value)}
                disabled={!editMode}
                placeholder="rep@company.com"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Organization & Business Details */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={18} color="#059669" />
              <h3>Organization & Legal Details</h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Official Legal Entity Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.company_name || ''} 
                onChange={(e) => handleChange('company_name', e.target.value)}
                disabled={!editMode}
                placeholder="Company legal title"
              />
            </div>

            {isVendor && (
              <>
                <div className="form-group">
                  <label className="form-label">Primary Business Category</label>
                  <select 
                    className="form-control" 
                    value={formData.category || 'IT Hardware'} 
                    onChange={(e) => handleChange('category', e.target.value)}
                    disabled={!editMode}
                  >
                    <option value="IT Hardware">IT Hardware</option>
                    <option value="Raw Materials & Metals">Raw Materials & Metals</option>
                    <option value="Construction & Infrastructure">Construction & Infrastructure</option>
                    <option value="Logistics & Freight">Logistics & Freight</option>
                    <option value="Software & Cloud Services">Software & Cloud Services</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">GSTIN (15 Digits)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.gst_number || ''} 
                    onChange={(e) => handleChange('gst_number', e.target.value)}
                    disabled={!editMode}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">PAN Number (10 Digits)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.pan_number || ''} 
                    onChange={(e) => handleChange('pan_number', e.target.value)}
                    disabled={!editMode}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Corporate Identification (CIN)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.cin || ''} 
                    onChange={(e) => handleChange('cin', e.target.value)}
                    disabled={!editMode}
                    placeholder="U12345MH2020PTC123456"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Organization Structure</label>
                  <select 
                    className="form-control" 
                    value={formData.org_type || 'Private Limited'} 
                    onChange={(e) => handleChange('org_type', e.target.value)}
                    disabled={!editMode}
                  >
                    <option value="Private Limited">Private Limited</option>
                    <option value="Public Limited">Public Limited</option>
                    <option value="LLP">LLP</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Sole Proprietor">Sole Proprietor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Years in Business</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={formData.years_in_business || ''} 
                    onChange={(e) => handleChange('years_in_business', e.target.value)}
                    disabled={!editMode}
                    placeholder="5"
                  />
                </div>
              </>
            )}

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Registered Business Address</label>
              <textarea 
                className="form-control" 
                rows={3}
                value={formData.registered_address || ''} 
                onChange={(e) => handleChange('registered_address', e.target.value)}
                disabled={!editMode}
                placeholder="Full official office/facility address"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Banking & Financial Settlement Details (for Vendor / Settlements) */}
        {isVendor && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} color="#059669" />
                <h3>Banking & Direct Settlement Information</h3>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Beneficiary Account Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.bank_account_name || ''} 
                  onChange={(e) => handleChange('bank_account_name', e.target.value)}
                  disabled={!editMode}
                  placeholder="Exact account holder name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bank Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.bank_name || ''} 
                  onChange={(e) => handleChange('bank_name', e.target.value)}
                  disabled={!editMode}
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.bank_account_number || ''} 
                  onChange={(e) => handleChange('bank_account_number', e.target.value)}
                  disabled={!editMode}
                  placeholder="Account number"
                />
              </div>

              <div className="form-group">
                <label className="form-label">IFSC Code (11 Characters)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.bank_ifsc || ''} 
                  onChange={(e) => handleChange('bank_ifsc', e.target.value)}
                  disabled={!editMode}
                  placeholder="HDFC0001234"
                  maxLength={11}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Corporate UPI ID (Optional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.bank_upi || ''} 
                  onChange={(e) => handleChange('bank_upi', e.target.value)}
                  disabled={!editMode}
                  placeholder="company@hdfcbank"
                />
              </div>
            </div>
          </div>
        )}

        {editMode && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '32px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
              style={{ backgroundColor: '#059669' }}
            >
              {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />} Save All Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default ProfileView;
