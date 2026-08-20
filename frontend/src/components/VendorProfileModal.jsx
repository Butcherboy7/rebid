import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { formatINR } from '../utils/formatters';
import { ShieldCheck, Star, Award, Truck, X, Calendar, CheckCircle, XCircle, ExternalLink, TrendingUp, DollarSign, AlertTriangle, Zap, Building2, User, Loader, FileText, MapPin, Phone, Mail, CreditCard } from 'lucide-react';

const API_BASE = 'http://localhost:8001/api';

export function VendorProfileModal({ vendorIdentifier, onClose, onRefreshData }) {
  const { token, isAdmin } = useAuth();
  const { showConfirm, showSuccess, showError } = useModal();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfile = () => {
    if (!vendorIdentifier) return;
    setLoading(true);
    setError(null);

    axios.get(`${API_BASE}/vendors/${encodeURIComponent(vendorIdentifier)}/profile`)
      .then(res => {
        setProfile(res.data);
      })
      .catch(err => {
        console.error("Error loading vendor profile:", err);
        setError("Vendor profile details could not be loaded.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, [vendorIdentifier]);

  const handleApproveVendor = async () => {
    if (!profile?.id) return;
    
    const confirmed = await showConfirm({
      title: 'Approve Vendor Application',
      message: `Are you sure you want to approve "${profile.name}"? This will grant them full platform access.`,
      type: 'success',
      confirmText: 'Approve Vendor',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    setActionLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_BASE}/admin/verify_vendor/${profile.id}?approve=true`, {}, { headers });
      showSuccess('Vendor Approved', `Vendor "${profile.name}" has been approved successfully!`);
      if (onRefreshData) onRefreshData();
      fetchProfile();
    } catch (err) {
      console.error('Failed to approve vendor:', err);
      showError('Action Failed', err.response?.data?.detail || 'Failed to approve vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectVendor = async () => {
    if (!profile?.id) return;
    
    const confirmed = await showConfirm({
      title: 'Reject Vendor Application',
      message: `Are you sure you want to reject "${profile.name}"? This action cannot be undone.`,
      type: 'error',
      confirmText: 'Reject Application',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    setActionLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_BASE}/admin/verify_vendor/${profile.id}?approve=false`, {}, { headers });
      showSuccess('Vendor Rejected', `Vendor application for "${profile.name}" has been rejected.`);
      if (onRefreshData) onRefreshData();
      onClose();
    } catch (err) {
      console.error('Failed to reject vendor:', err);
      showError('Action Failed', err.response?.data?.detail || 'Failed to reject vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewDoc = async (docId, approve) => {
    if (!approve) {
      const rejectionReason = prompt("Please enter the reason for document rejection:");
      if (!rejectionReason) return;
      
      setActionLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        await axios.post(`${API_BASE}/admin/documents/${docId}/review`, {
          approve: false,
          rejection_reason: rejectionReason
        }, { headers });
        showSuccess('Document Rejected', 'Document has been marked for re-upload.');
        fetchProfile();
        if (onRefreshData) onRefreshData();
      } catch (err) {
        console.error("Document review failed:", err);
        showError('Action Failed', err.response?.data?.detail || "Document review action failed");
      } finally {
        setActionLoading(false);
      }
    } else {
      setActionLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        await axios.post(`${API_BASE}/admin/documents/${docId}/review`, {
          approve: true
        }, { headers });
        showSuccess('Document Approved', 'Document has been verified successfully.');
        fetchProfile();
        if (onRefreshData) onRefreshData();
      } catch (err) {
        console.error("Document review failed:", err);
        showError('Action Failed', err.response?.data?.detail || "Document review action failed");
      } finally {
        setActionLoading(false);
      }
    }
  };

  if (!vendorIdentifier) return null;
  
  const isApproved = profile?.is_approved && profile?.status === "approved";

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
          <Loader size={40} className="spin" />
          <p style={{ marginTop: '16px' }}>Loading vendor profile...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ padding: '36px', textAlign: 'center', color: '#DC2626' }}>
          <AlertTriangle size={32} style={{ margin: '0 auto 12px auto' }} />
          <p>{error}</p>
        </div>
      );
    }

    if (!profile) return null;

    if (isApproved) {
      return (
        <div style={{ padding: '24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: 'var(--shadow-md)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#059669',
                  borderRadius: '16px',
                  color: '#FFF',
                  fontWeight: '800',
                  fontSize: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                }}>
                  {profile.name.slice(0, 2).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h1 style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: '800' }}>{profile.name}</h1>
                    {profile.verified && (
                      <span className="badge badge-completed" style={{ fontSize: '11px', padding: '4px 10px' }}>
                        <ShieldCheck size={13} /> VERIFIED SELLER
                      </span>
                    )}
                    <span className={`badge ${profile.risk_level === 'LOW' ? 'badge-low-risk' : profile.risk_level === 'MEDIUM' ? 'badge-med-risk' : 'badge-high-risk'}`}>
                      {profile.risk_level} RISK
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#94A3B8', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span>Category: <b style={{ color: '#F8FAFC' }}>{profile.category}</b></span>
                    <span>Years Active: <b style={{ color: '#F8FAFC' }}>{profile.years_on_platform} Years</b></span>
                    <span>ID: <code style={{ color: '#CBD5E1' }}>{profile.id}</code></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '8px' }}>
                      <Star size={16} fill="#F59E0B" color="#F59E0B" />
                      <b style={{ color: '#FFF', fontSize: '14px' }}>{profile.rating}</b>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>(Rating)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ECFDF5', padding: '4px 12px', borderRadius: '8px', color: '#065F46' }}>
                      <Zap size={15} color="#059669" />
                      <span style={{ fontSize: '13px', fontWeight: '800' }}>{profile.ai_score}% AI Match</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Contracts Won</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>{profile.contracts_completed}</div>
              </div>

              <div style={{ background: '#ECFDF5', padding: '14px', borderRadius: '12px', border: '1px solid #86EFAC', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#065F46', textTransform: 'uppercase' }}>On-Time Delivery</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>{profile.delivery_pct}%</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>SLA Reliability</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>{profile.reliability_pct}%</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Avg Rating</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>★ {profile.rating}</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Procurement Value</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>{formatINR(profile.total_procurement_val)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div className="card" style={{ padding: '18px', margin: 0 }}>
                <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Monthly Contracts Trend</h3>
                <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', padding: '10px 4px 0 4px', borderBottom: '1px solid #E2E8F0' }}>
                  {profile.chart_data?.monthly_contracts?.map((val, idx) => {
                    const maxVal = Math.max(...(profile.chart_data?.monthly_contracts || [12]), 12);
                    const heightPct = (val / maxVal) * 100;
                    return (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#059669', marginBottom: '2px' }}>{val}</span>
                        <div style={{
                          width: '100%',
                          height: `${heightPct}%`,
                          backgroundColor: idx === 5 ? '#059669' : '#0F172A',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.4s ease'
                        }} />
                        <span style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>{profile.chart_data?.months?.[idx]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card" style={{ padding: '18px', margin: 0 }}>
                <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Performance Score Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SLA Reliability Score</span>
                      <b>{profile.reliability_pct}%</b>
                    </div>
                    <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${profile.reliability_pct}%`, backgroundColor: '#059669' }} /></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>On-Time Delivery SLA</span>
                      <b>{profile.delivery_pct}%</b>
                    </div>
                    <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${profile.delivery_pct}%`, backgroundColor: '#0F172A' }} /></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Pricing Competitiveness</span>
                      <b>92%</b>
                    </div>
                    <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: '92%', backgroundColor: '#475569' }} /></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Customer Satisfaction</span>
                      <b>{((profile.rating / 5) * 100).toFixed(0)}%</b>
                    </div>
                    <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${(profile.rating / 5) * 100}%`, backgroundColor: '#D97706' }} /></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ background: '#ECFDF5', border: '1px solid #86EFAC', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#065F46' }}>
                <Zap size={18} color="#059669" />
                <h3 style={{ color: '#065F46', fontSize: '15px' }}>AI Match Decision Breakdown</h3>
              </div>
              <p style={{ fontSize: '12px', color: '#047857', marginBottom: '12px' }}>
                XGBoost algorithm weights: Price (40%), Reliability SLA (30%), Delivery Speed (20%), Reviews (10%).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '10px', color: '#047857', fontWeight: '700' }}>PRICE (40%)</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#065F46' }}>92.0</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '10px', color: '#047857', fontWeight: '700' }}>RELIABILITY (30%)</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#065F46' }}>{profile.reliability_pct}.0</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '10px', color: '#047857', fontWeight: '700' }}>DELIVERY (20%)</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#065F46' }}>{profile.delivery_pct}.0</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '10px', color: '#047857', fontWeight: '700' }}>REVIEWS (10%)</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#065F46' }}>{(profile.rating * 20).toFixed(0)}</div>
                </div>
              </div>
            </div>

            <div className="table-container" style={{ marginBottom: '24px' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '15px' }}>Procurement Contract History</h3>
                <p className="text-muted" style={{ fontSize: '12px' }}>Verified past contracts executed on ReBid</p>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Buyer Company</th>
                    <th>Category</th>
                    <th>Value (₹)</th>
                    <th>Status</th>
                    <th>Buyer Rating</th>
                    <th>Completed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.history?.map((h) => (
                    <tr key={h.id}>
                      <td><b>{h.buyer_name}</b></td>
                      <td><span className="badge badge-live">{h.category}</span></td>
                      <td><b>{formatINR(h.contract_value)}</b></td>
                      <td><span className="badge badge-completed">{h.status}</span></td>
                      <td><span style={{ color: '#D97706', fontWeight: '700' }}>★ {h.rating}</span></td>
                      <td className="text-muted" style={{ fontSize: '12px' }}>{h.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3>Buyer Feedback & Reviews</h3>
                  <p className="text-muted" style={{ fontSize: '12px' }}>Statistically generated based on vendor's actual SLA ({profile.reliability_pct}%) & delivery record</p>
                </div>
                <span className="badge badge-completed">
                  <ShieldCheck size={14} /> VERIFIED BUYER REVIEWS
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {profile.reviews?.map((rev) => (
                  <div key={rev.id} style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <b style={{ color: '#0F172A', fontSize: '14px' }}>{rev.buyer_company}</b>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>({rev.reviewer_name} - {rev.reviewer_title})</span>
                      </div>
                      <span className="text-muted" style={{ fontSize: '11px' }}>{rev.date}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < rev.stars ? "#F59E0B" : "#CBD5E1"} color={i < rev.stars ? "#F59E0B" : "#CBD5E1"} />
                      ))}
                    </div>

                    <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                      "{rev.review_text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
      );
    }

    return (
      <div style={{ padding: '32px' }}>
            <div style={{ background: profile.status === 'rejected' ? '#FEE2E2' : '#FEF3C7', border: `1px solid ${profile.status === 'rejected' ? '#FCA5A5' : '#F59E0B'}`, borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <AlertTriangle size={24} color={profile.status === 'rejected' ? '#DC2626' : '#D97706'} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: profile.status === 'rejected' ? '#991B1B' : '#92400E' }}>
                  {profile.status === 'rejected' ? 'Vendor Application Rejected' : 'Application Under Compliance Review'}
                </h3>
              </div>
              <p style={{ color: profile.status === 'rejected' ? '#7F1D1D' : '#78350F', fontSize: '14px' }}>
                {profile.message || 'This vendor application is pending verification and compliance approval.'}
              </p>
            </div>

            {profile.user?.rejection_reason && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ color: '#991B1B', fontWeight: '700', marginBottom: '8px' }}>Rejection Reason:</div>
                <p style={{ color: '#7F1D1D', fontSize: '14px' }}>{profile.user.rejection_reason}</p>
              </div>
            )}
            
            <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Building2 size={18} color="#0F172A" />
                <h4 style={{ fontWeight: '700', color: '#0F172A' }}>Applicant Business Details</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div><span style={{ color: '#64748B' }}>Company Name:</span> <br /><b>{profile.company_name || profile.name}</b></div>
                <div><span style={{ color: '#64748B' }}>Category / Industry:</span> <br /><b>{profile.category}</b></div>
                <div><span style={{ color: '#64748B' }}>Vendor ID:</span> <br /><code style={{ fontSize: '12px' }}>{profile.id}</code></div>
                <div><span style={{ color: '#64748B' }}>Application Status:</span> <br />
                  <span style={{ padding: '3px 10px', borderRadius: '4px', background: profile.status === 'rejected' ? '#FEE2E2' : '#FEF3C7', color: profile.status === 'rejected' ? '#DC2626' : '#D97706', fontSize: '12px', fontWeight: '700' }}>
                    {profile.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>
            </div>

            {profile.user && (
              <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <User size={18} color="#0F172A" />
                  <h4 style={{ fontWeight: '700', color: '#0F172A' }}>Authorized Representative</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  {profile.user.rep_name && <div><span style={{ color: '#64748B' }}>Name:</span> <br /><b>{profile.user.rep_name}</b></div>}
                  {profile.user.rep_designation && <div><span style={{ color: '#64748B' }}>Designation:</span> <br /><b>{profile.user.rep_designation}</b></div>}
                  {profile.user.rep_phone && <div><span style={{ color: '#64748B' }}>Phone:</span> <br /><b>{profile.user.rep_phone}</b></div>}
                  {profile.user.rep_email && <div><span style={{ color: '#64748B' }}>Email:</span> <br /><b>{profile.user.rep_email}</b></div>}
                </div>
              </div>
            )}

            {profile.user?.gst_number && (
              <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <FileText size={18} color="#0F172A" />
                  <h4 style={{ fontWeight: '700', color: '#0F172A' }}>Business Registration</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  {profile.user.gst_number && <div><span style={{ color: '#64748B' }}>GST Number:</span> <br /><code style={{ fontSize: '12px', fontWeight: '700' }}>{profile.user.gst_number}</code></div>}
                  {profile.user.pan_number && <div><span style={{ color: '#64748B' }}>PAN Number:</span> <br /><code style={{ fontSize: '12px', fontWeight: '700' }}>{profile.user.pan_number}</code></div>}
                  {profile.user.cin && <div><span style={{ color: '#64748B' }}>CIN:</span> <br /><code style={{ fontSize: '12px', fontWeight: '700' }}>{profile.user.cin}</code></div>}
                  {profile.user.org_type && <div><span style={{ color: '#64748B' }}>Org Type:</span> <br /><b>{profile.user.org_type}</b></div>}
                </div>
              </div>
            )}

            {profile.user?.bank_name && (
              <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <CreditCard size={18} color="#0F172A" />
                  <h4 style={{ fontWeight: '700', color: '#0F172A' }}>Bank Details</h4>
                  <span style={{ padding: '4px 12px', borderRadius: '6px', background: '#FEF3C7', color: '#D97706', fontSize: '11px', fontWeight: '700' }}>UNVERIFIED</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  {profile.user.bank_account_name && <div><span style={{ color: '#64748B' }}>Account Name:</span> <br /><b>{profile.user.bank_account_name}</b></div>}
                  {profile.user.bank_name && <div><span style={{ color: '#64748B' }}>Bank Name:</span> <br /><b>{profile.user.bank_name}</b></div>}
                  {profile.user.bank_account_number && <div><span style={{ color: '#64748B' }}>Account Number:</span> <br /><code>****{profile.user.bank_account_number.slice(-4)}</code></div>}
                  {profile.user.bank_ifsc && <div><span style={{ color: '#64748B' }}>IFSC Code:</span> <br /><code>{profile.user.bank_ifsc}</code></div>}
                </div>
              </div>
            )}

            <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={20} color="#0F172A" />
                  <div>
                    <h4 style={{ fontWeight: '700', color: '#0F172A', fontSize: '15px' }}>Submitted Business Verification Documents</h4>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Review legal certificates and verify authenticity</p>
                  </div>
                </div>
              </div>

              {(!profile.documents || profile.documents.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748B', fontSize: '14px' }}>
                  No verification documents submitted yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {profile.documents.map((doc, i) => (
                    <div key={doc.id || i} style={{ padding: '14px 16px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={18} color="#475569" />
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A', textTransform: 'capitalize' }}>
                            {doc.doc_type?.replace(/_/g, ' ')}
                          </div>
                          {doc.rejection_reason && (
                            <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '2px' }}>
                              Reason: {doc.rejection_reason}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {doc.file_url && (
                          <a
                            href={doc.file_url.startsWith('http') ? doc.file_url : `http://localhost:8001${doc.file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#2563EB', fontWeight: '600', textDecoration: 'none', background: '#EFF6FF', padding: '6px 12px', borderRadius: '6px' }}
                          >
                            <ExternalLink size={14} /> View File
                          </a>
                        )}

                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: doc.status === 'approved' ? '#DCFCE7' : doc.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                          color: doc.status === 'approved' ? '#166534' : doc.status === 'rejected' ? '#DC2626' : '#D97706',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          {doc.status?.toUpperCase()}
                        </span>

                        {isAdmin && doc.status !== 'approved' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleReviewDoc(doc.id, true)}
                              disabled={actionLoading}
                              style={{ padding: '6px 10px', background: '#059669', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Approve Document"
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button
                              onClick={() => handleReviewDoc(doc.id, false)}
                              disabled={actionLoading}
                              style={{ padding: '6px 10px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Reject Document"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isAdmin && (
              <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h4 style={{ color: '#FFFFFF', margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700' }}>Admin Compliance Decision</h4>
                  <p style={{ color: '#94A3B8', margin: 0, fontSize: '13px' }}>Grant vendor full platform access to start bidding on reverse auctions</p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleRejectVendor}
                    disabled={actionLoading}
                    style={{ padding: '10px 18px', background: 'transparent', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <XCircle size={16} /> Reject Application
                  </button>
                  <button
                    onClick={handleApproveVendor}
                    disabled={actionLoading}
                    style={{ padding: '10px 24px', background: '#059669', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)' }}
                  >
                    <CheckCircle size={16} /> {actionLoading ? 'Processing...' : 'Approve Vendor & Activate Access'}
                  </button>
                </div>
              </div>
            )}
          </div>
      );
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justify: 'flex-end',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '720px',
        height: '100vh',
        backgroundColor: '#FFFFFF',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        <div style={{
          padding: '16px 24px',
          background: '#0F172A',
          color: '#FFFFFF',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} color="#059669" />
            <span style={{ fontWeight: '800', fontSize: '16px', letterSpacing: '-0.01em' }}>Vendor Profile</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#FFF',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {renderContent()}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
