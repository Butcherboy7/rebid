import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { Navigation } from '../../components/Navigation';
import { VendorProfileModal } from '../../components/VendorProfileModal';
import { BuyerProfileModal } from '../../components/BuyerProfileModal';
import { ProfileView } from '../../components/ProfileView';
import { SettingsView } from '../../components/SettingsView';
import { formatINR } from '../../utils/formatters';
import { ShieldCheck, Users, AlertTriangle, FileText, CheckCircle, XCircle, Search, RefreshCw, ChevronLeft, ChevronRight, Clock, ShoppingBag, ArrowUpDown } from 'lucide-react';

const API_BASE = 'http://localhost:8001/api';

export function AdminDashboard() {
  const { token } = useAuth();
  const { showConfirm, showSuccess, showError } = useModal();

  const [activeTab, setActiveTab] = useState('PENDING_AUCTIONS');
  const [pendingAuctions, setPendingAuctions] = useState([]);
  const [users, setUsers] = useState([]);
  const [vendorsData, setVendorsData] = useState({ vendors: [], page: 1, total_pages: 1, total_count: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedVendorForProfile, setSelectedVendorForProfile] = useState(null);
  const [selectedBuyerForProfile, setSelectedBuyerForProfile] = useState(null);
  const [pendingVendorSort, setPendingVendorSort] = useState('newest');
  const [pendingBuyers, setPendingBuyers] = useState([]);
  const [buyerActionLoading, setBuyerActionLoading] = useState(null);

  const fetchPendingAuctions = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/admin/pending_auctions`, { headers });
      setPendingAuctions(res.data);
    } catch (err) {
      console.error("Error fetching pending auctions:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/admin/users`, { headers });
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVendors = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/admin/vendors?page=${page}&limit=15&search=${encodeURIComponent(search)}`, { headers });
      setVendorsData(res.data || { vendors: [], page: 1, total_pages: 1, total_count: 0 });
      if (res.data?.page) setCurrentPage(res.data.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingVendors = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/admin/pending_vendors`, { headers });
      const vendors = res.data || [];
      setPendingVendors(vendors);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingBuyers = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/admin/documents/pending`, { headers });
      setPendingBuyers((res.data || []).filter(u => u.role === 'BUYER'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/admin/audit_logs`, { headers });
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFraudAlerts = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/admin/fraud_alerts`, { headers });
      setFraudAlerts(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPendingAuctions();
    fetchVendors(currentPage, searchQuery);
    fetchAuditLogs();
    fetchFraudAlerts();
    fetchUsers();
    fetchPendingVendors();
    fetchPendingBuyers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVendors(1, searchQuery);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (vendorsData.total_pages || 1)) {
      fetchVendors(newPage, searchQuery);
    }
  };

  const handleApproveAuction = async (auctionId, approve) => {
    const action = approve ? 'approve and launch' : 'reject';
    const confirmed = await showConfirm({
      title: `${approve ? 'Approve' : 'Reject'} Procurement Auction`,
      message: `Are you sure you want to ${action} this procurement auction?`,
      type: approve ? 'success' : 'error',
      confirmText: approve ? 'Approve & Launch' : 'Reject',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_BASE}/admin/approve_auction/${auctionId}?approve=${approve}`, {}, { headers });
      showSuccess('Action Complete', approve ? "Procurement Auction approved & launched LIVE!" : "Procurement Auction rejected.");
      fetchPendingAuctions();
      fetchAuditLogs();
    } catch (err) {
      showError('Action Failed', "Failed processing auction approval");
    }
  };

  const handleVerifyVendor = async (vendorId, approve) => {
    const confirmed = await showConfirm({
      title: `${approve ? 'Approve' : 'Reject'} Vendor`,
      message: `Are you sure you want to ${approve ? 'approve' : 'reject'} this vendor?`,
      type: approve ? 'success' : 'error',
      confirmText: approve ? 'Approve' : 'Reject',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_BASE}/admin/verify_vendor/${vendorId}?approve=${approve}`, {}, { headers });
      showSuccess('Action Complete', approve ? "Vendor verified successfully!" : "Vendor application rejected.");
      fetchPendingVendors();
      fetchVendors(currentPage, searchQuery);
    } catch (err) {
      showError('Action Failed', "Failed processing verification");
    }
  };

  const handleApproveBuyer = async (userId, buyerName) => {
    const confirmed = await showConfirm({
      title: 'Approve Buyer',
      message: `Are you sure you want to approve "${buyerName}"? This will grant them full platform access.`,
      type: 'success',
      confirmText: 'Approve Buyer',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    setBuyerActionLoading(userId);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_BASE}/admin/documents/${userId}/approve`, {}, { headers });
      showSuccess('Buyer Approved', `"${buyerName}" has been approved successfully!`);
      fetchPendingBuyers();
      fetchUsers();
    } catch (err) {
      showError('Action Failed', err.response?.data?.detail || 'Failed to approve buyer');
    } finally {
      setBuyerActionLoading(null);
    }
  };

  const handleRejectBuyer = async (userId, buyerName) => {
    const reason = prompt(`Reason for rejecting "${buyerName}"'s application:`);
    if (!reason) return;

    setBuyerActionLoading(userId);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_BASE}/admin/documents/${userId}/reject?reason=${encodeURIComponent(reason)}`, {}, { headers });
      showSuccess('Buyer Rejected', `Application for "${buyerName}" has been rejected.`);
      fetchPendingBuyers();
      fetchUsers();
    } catch (err) {
      showError('Action Failed', err.response?.data?.detail || 'Failed to reject buyer');
    } finally {
      setBuyerActionLoading(null);
    }
  };

  const sortedPendingVendors = [...pendingVendors].sort((a, b) => {
    if (pendingVendorSort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (pendingVendorSort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (pendingVendorSort === 'name_asc') return (a.name || '').localeCompare(b.name || '');
    if (pendingVendorSort === 'name_desc') return (b.name || '').localeCompare(a.name || '');
    if (pendingVendorSort === 'status') return (a.status || '').localeCompare(b.status || '');
    return 0;
  });

  return (
    <div className="app-container">
      <VendorProfileModal
        vendorIdentifier={selectedVendorForProfile}
        onClose={() => setSelectedVendorForProfile(null)}
        onRefreshData={fetchPendingVendors}
      />
      <BuyerProfileModal
        buyerIdentifier={selectedBuyerForProfile}
        onClose={() => setSelectedBuyerForProfile(null)}
      />

      <Navigation 
        activePortal="ADMIN" 
        activeItem={activeTab} 
        onSelectTab={setActiveTab} 
        vendorCount={vendorsData.total_count || 0}
      />

      <main className="content-area">
        <div className="top-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="text-muted">Approve auctions, manage vendors, review alerts, and monitor platform activity</p>
          </div>
          <button className="btn btn-secondary" onClick={() => {
            fetchPendingAuctions();
            fetchVendors(currentPage, searchQuery);
            fetchAuditLogs();
            fetchFraudAlerts();
            fetchPendingVendors();
            fetchPendingBuyers();
            fetchUsers();
          }}>
            <RefreshCw size={15} /> Refresh Console
          </button>
        </div>

        {/* Profile View */}
        {activeTab === 'PROFILE' && <ProfileView role="ADMIN" />}

        {/* Settings View */}
        {activeTab === 'SETTINGS' && <SettingsView role="ADMIN" />}


        {activeTab === 'PENDING_AUCTIONS' && (
          <div className="table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <h2>Buyer Procurement Auction Approval Queue</h2>
              <p className="text-muted">Buyer requests must be approved by Compliance Admin before launching live reverse auction</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Auction ID</th>
                  <th>Procurement Title</th>
                  <th>Category</th>
                  <th>Target Budget (₹)</th>
                  <th>Submitted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingAuctions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>
                      <CheckCircle size={24} color="#059669" style={{ marginBottom: '8px', display: 'block', margin: '0 auto' }} />
                      No pending procurement requests. All buyer auctions have been reviewed.
                    </td>
                  </tr>
                ) : (
                  pendingAuctions.map((a) => (
                    <tr key={a.id}>
                      <td><code style={{ fontSize: '12px' }}>{a.id}</code></td>
                      <td><b>{a.title}</b></td>
                      <td><span className="badge badge-live">{a.category}</span></td>
                      <td><b style={{ color: '#059669', fontSize: '15px' }}>{formatINR(a.max_budget)}</b></td>
                      <td className="text-muted">{new Date(a.created_at).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-primary" style={{ backgroundColor: '#059669', padding: '4px 12px', fontSize: '12px' }} onClick={() => handleApproveAuction(a.id, true)}>
                            <CheckCircle size={14} /> Approve & Launch Live
                          </button>
                          <button className="btn btn-secondary" style={{ color: '#DC2626', padding: '4px 12px', fontSize: '12px' }} onClick={() => handleApproveAuction(a.id, false)}>
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}


        {activeTab === 'DATASET' && (
          <div className="table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2>Vendor Directory</h2>
                <p className="text-muted">Click any vendor name to view their full profile</p>
              </div>

              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="form-control"
                  style={{ width: '240px', height: '38px', fontSize: '13px' }}
                  placeholder="Search vendor or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-secondary" style={{ height: '38px', padding: '0 14px' }}>
                  <Search size={15} /> Search
                </button>
              </form>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Vendor ID</th>
                  <th>Company Name</th>
                  <th>Domain / Category</th>
                  <th>SLA Score</th>
                  <th>Delivery Score</th>
                  <th>Historical Rating</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(vendorsData.vendors || []).map((v) => (
                  <tr key={v.id}>
                    <td><code style={{ fontSize: '12px' }}>{v.id}</code></td>
                    <td>
                      <b
                        onClick={() => setSelectedVendorForProfile(v.name)}
                        style={{ color: '#0F172A', cursor: 'pointer', textDecoration: 'underline' }}
                        title="Click to view Vendor Profile Dossier"
                      >
                        {v.name}
                      </b>
                    </td>
                    <td><span className="badge badge-live">{v.category}</span></td>
                    <td><b style={{ color: '#059669' }}>{v.reliability_score ? (v.reliability_score * 100).toFixed(0) : '90'}% SLA</b></td>
                    <td><b>{v.delivery_score ? v.delivery_score.toFixed(0) : '90'}%</b></td>
                    <td><span style={{ color: '#D97706', fontWeight: '700' }}>★ {v.rating ? v.rating.toFixed(1) : '4.5'}</span></td>
                    <td>
                      <span className={`badge ${v.verified ? 'badge-completed' : 'badge-med-risk'}`}>
                        {v.verified ? 'VERIFIED' : 'UNVERIFIED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <span className="text-muted" style={{ fontSize: '13px' }}>
                Showing Page <b>{vendorsData.page || 1}</b> of <b>{vendorsData.total_pages || 1}</b> ({vendorsData.total_count || 0} Total Vendors)
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
                  disabled={currentPage <= 1 || loading}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
                  disabled={currentPage >= (vendorsData.total_pages || 1) || loading}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'FRAUD' && (
          <div className="table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <h2>Automated Fraud & Anomaly Detection Log</h2>
              <p className="text-muted">Real-time alerts triggered by rule engine during reverse auctions</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Alert ID</th>
                  <th>Auction ID</th>
                  <th>Vendor Company</th>
                  <th>Risk Level</th>
                  <th>Triggered Rule</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {fraudAlerts.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748B', padding: '24px' }}>No fraud alerts triggered.</td></tr>
                ) : (
                  fraudAlerts.map((a) => (
                    <tr key={a.id}>
                      <td><code style={{ fontSize: '12px' }}>{a.id}</code></td>
                      <td><b>{a.auction_id}</b></td>
                      <td>
                        <b
                          onClick={() => setSelectedVendorForProfile(a.vendor_name)}
                          style={{ color: '#0F172A', cursor: 'pointer', textDecoration: 'underline' }}
                          title="Click to view Vendor Profile Dossier"
                        >
                          {a.vendor_name}
                        </b>
                      </td>
                      <td>
                        <span className={`badge ${a.risk_level === 'HIGH' ? 'badge-high-risk' : 'badge-med-risk'}`}>
                          {a.risk_level} RISK
                        </span>
                      </td>
                      <td style={{ color: '#0F172A', fontWeight: '600' }}>{a.rule_triggered}</td>
                      <td className="text-muted">{new Date(a.timestamp).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}


        {activeTab === 'AUDIT' && (
          <div className="table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <h2>Governance & Compliance Audit Trail</h2>
              <p className="text-muted">Immutable log of system actions, auction creations, bid submissions & awards</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Action Event</th>
                  <th>Actor / User</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((l) => (
                  <tr key={l.id}>
                    <td><code style={{ fontSize: '11px' }}>{l.id}</code></td>
                    <td><span className="badge badge-completed">{l.action}</span></td>
                    <td><b>{l.actor}</b></td>
                    <td style={{ fontSize: '12px', fontFamily: 'monospace', maxWidth: '300px', wordBreak: 'break-all' }}>{l.details}</td>
                    <td className="text-muted" style={{ fontSize: '12px' }}>{new Date(l.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}


        {activeTab === 'PENDING' && (
          <div className="table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Pending Vendor Applications Queue</h2>
                <p className="text-muted">Review business documents and approve vendor platform access.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select
                  value={pendingVendorSort}
                  onChange={(e) => setPendingVendorSort(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name_asc">Company A-Z</option>
                  <option value="name_desc">Company Z-A</option>
                  <option value="status">Status</option>
                </select>
                <button className="btn btn-secondary" style={{ fontSize: '13px', padding: '6px 12px' }} onClick={fetchPendingVendors}>
                  <RefreshCw size={14} /> Refresh Queue
                </button>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Submitted Date</th>
                  <th>Vendor ID</th>
                  <th>Company & Email</th>
                  <th>Category</th>
                  <th>Uploaded Business Documents</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPendingVendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>
                      <CheckCircle size={24} color="#059669" style={{ marginBottom: '8px', display: 'block', margin: '0 auto' }} />
                      No pending vendor applications. All applicant dossiers have been reviewed.
                    </td>
                  </tr>
                ) : (
                  sortedPendingVendors.map((v) => (
                    <tr key={v.id}>
                      <td className="text-muted" style={{ fontSize: '12px' }}>
                        {v.created_at ? new Date(v.created_at).toLocaleString() : 'Recent'}
                      </td>
                      <td><code>{v.id}</code></td>
                      <td>
                        <div>
                          <b
                            onClick={() => setSelectedVendorForProfile(v.name)}
                            style={{ color: '#0F172A', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}
                            title="Click to view Dossier & Review Documents"
                          >
                            {v.name}
                          </b>
                          {v.email && <div style={{ fontSize: '12px', color: '#64748B' }}>{v.email}</div>}
                        </div>
                      </td>
                      <td><span className="badge badge-live">{v.category}</span></td>
                      <td>
                        {v.documents && v.documents.length > 0 ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {v.documents.map((doc, idx) => (
                              <span key={idx} style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: doc.status === 'approved' ? '#DCFCE7' : doc.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                                color: doc.status === 'approved' ? '#166534' : doc.status === 'rejected' ? '#DC2626' : '#D97706',
                                fontWeight: '600'
                              }}>
                                {doc.doc_type?.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94A3B8' }}>No docs uploaded</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setSelectedVendorForProfile(v.name)}>
                            <FileText size={14} /> Review Docs
                          </button>
                          <button className="btn btn-primary" style={{ backgroundColor: '#059669', padding: '4px 10px', fontSize: '12px' }} onClick={() => handleVerifyVendor(v.id, true)}>
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button className="btn btn-secondary" style={{ color: '#DC2626', padding: '4px 10px', fontSize: '12px' }} onClick={() => handleVerifyVendor(v.id, false)}>
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}


        {activeTab === 'BUYER_VERIFICATION' && (
          <div className="table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Pending Buyer Applications Queue</h2>
                <p className="text-muted">Review buyer legal documents and approve platform access.</p>
              </div>
              <button className="btn btn-secondary" style={{ fontSize: '13px', padding: '6px 12px' }} onClick={fetchPendingBuyers}>
                <RefreshCw size={14} /> Refresh Queue
              </button>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Submitted Date</th>
                  <th>User ID</th>
                  <th>Name & Email</th>
                  <th>Uploaded Documents</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingBuyers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>
                      <CheckCircle size={24} color="#059669" style={{ marginBottom: '8px', display: 'block', margin: '0 auto' }} />
                      No pending buyer applications. All applicant dossiers have been reviewed.
                    </td>
                  </tr>
                ) : (
                  pendingBuyers.map((b) => (
                    <tr key={b.user_id}>
                      <td className="text-muted" style={{ fontSize: '12px' }}>
                        {b.submitted_at ? new Date(b.submitted_at).toLocaleString() : 'Recent'}
                      </td>
                      <td><code>{b.user_id}</code></td>
                      <td>
                        <div>
                          <b
                            onClick={() => setSelectedBuyerForProfile(b.name)}
                            style={{ color: '#0F172A', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}
                            title="Click to view Buyer Profile"
                          >
                            {b.name}
                          </b>
                          <div style={{ fontSize: '12px', color: '#64748B' }}>{b.email}</div>
                        </div>
                      </td>
                      <td>
                        {b.documents && b.documents.length > 0 ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {b.documents.map((doc, idx) => (
                              <span key={idx} style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: doc.status === 'approved' ? '#DCFCE7' : doc.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                                color: doc.status === 'approved' ? '#166534' : doc.status === 'rejected' ? '#DC2626' : '#D97706',
                                fontWeight: '600'
                              }}>
                                {doc.doc_type?.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94A3B8' }}>No docs uploaded</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-primary"
                            style={{ backgroundColor: '#059669', padding: '4px 10px', fontSize: '12px' }}
                            disabled={buyerActionLoading === b.user_id}
                            onClick={() => handleApproveBuyer(b.user_id, b.name)}
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ color: '#DC2626', padding: '4px 10px', fontSize: '12px' }}
                            disabled={buyerActionLoading === b.user_id}
                            onClick={() => handleRejectBuyer(b.user_id, b.name)}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'BUYER_DIRECTORY' && (
          <div className="table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <h2>Buyer Organization Directory</h2>
              <p className="text-muted">All registered buyer accounts on the platform</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name / Organization</th>
                  <th>Email Address</th>
                  <th>Status</th>
                  <th>Registered On</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.role === 'BUYER').length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>
                      No buyer accounts registered yet.
                    </td>
                  </tr>
                ) : (
                  users.filter(u => u.role === 'BUYER').map((u) => (
                    <tr key={u.id}>
                      <td><code>{u.id}</code></td>
                      <td>
                        <b
                          onClick={() => setSelectedBuyerForProfile(u.company_name || u.name)}
                          style={{ color: '#0F172A', cursor: 'pointer', textDecoration: 'underline' }}
                          title="Click to view Buyer Profile"
                        >
                          {u.company_name || u.name}
                        </b>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.status === 'approved' ? 'badge-completed' : 'badge-med-risk'}`}>
                          {(u.status || 'unknown').toUpperCase()}
                        </span>
                      </td>
                      <td className="text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
