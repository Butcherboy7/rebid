import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Download, CheckCircle, XCircle, FileText, User, Mail, Calendar, AlertCircle, Loader, Eye, ExternalLink } from 'lucide-react';
import { ApprovalModal } from '../../components/ApprovalModal';

const API_BASE = 'http://localhost:8001/api';

export function DocumentReviewQueue() {
  const { user, token } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [approvalModal, setApprovalModal] = useState({ isOpen: false, type: null, vendorName: '', userId: '', docId: '' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  useEffect(() => {
    fetchPendingDocuments();
  }, [token]);

  const fetchPendingDocuments = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/admin/documents/pending`, { headers });
      const sorted = res.data.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
      setPendingUsers(sorted);
    } catch (err) {
      console.error('Failed to fetch pending documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessToast = (message) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleApproveDocument = async () => {
    setProcessing(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_BASE}/admin/documents/${approvalModal.docId}/review`, {
        approve: true
      }, { headers });
      showSuccessToast('Document approved successfully');
      setApprovalModal({ isOpen: false, type: null, vendorName: '', userId: '', docId: '' });
      fetchPendingDocuments();
    } catch (err) {
      console.error('Failed to approve document:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectDocument = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_BASE}/admin/documents/${rejectModal.id}/review`, {
        approve: false,
        rejection_reason: rejectionReason
      }, { headers });
      
      showSuccessToast('Document rejected');
      setRejectModal(null);
      setRejectionReason('');
      fetchPendingDocuments();
    } catch (err) {
      console.error('Failed to reject document:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveAll = async () => {
    setProcessing(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_BASE}/admin/documents/${approvalModal.userId}/approve`, {}, { headers });
      showSuccessToast('Account approved successfully');
      setApprovalModal({ isOpen: false, type: null, vendorName: '', userId: '', docId: '' });
      fetchPendingDocuments();
    } catch (err) {
      console.error('Failed to approve user:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Loader size={40} className="spin" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
          Document Review Queue
        </h1>
        <p style={{ color: '#64748B', fontSize: '15px' }}>
          Review and approve applicant documents before granting platform access
        </p>
      </div>

      {pendingUsers.length === 0 ? (
        <div style={{ 
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#F0FDF4',
          borderRadius: '12px',
          border: '1px solid #86EFAC'
        }}>
          <CheckCircle size={48} color="#059669" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
            All Caught Up!
          </h2>
          <p style={{ color: '#64748B' }}>No documents pending review at this time.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '300px 1fr', 
          gap: '24px',
          minHeight: '600px'
        }}>
          <div style={{ 
            backgroundColor: '#F8FAFC', 
            borderRadius: '12px',
            padding: '16px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px' }}>
              Pending Applications ({pendingUsers.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pendingUsers.map((u, index) => (
                <button
                  key={u.user_id}
                  onClick={() => setSelectedUser(u)}
                  style={{
                    padding: '12px',
                    backgroundColor: selectedUser?.user_id === u.user_id ? '#FFFFFF' : 'transparent',
                    border: selectedUser?.user_id === u.user_id ? '2px solid #0F172A' : 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative'
                  }}
                >
                  {index === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: '#0F172A',
                      color: '#FFFFFF',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      NEW
                    </div>
                  )}
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#0F172A' }}>{u.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{u.email}</div>
                  <div style={{ 
                    display: 'inline-block', 
                    marginTop: '6px', 
                    padding: '4px 8px', 
                    backgroundColor: u.role === 'BUYER' ? '#DBEAFE' : '#D1FAE5',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: u.role === 'BUYER' ? '#1E40AF' : '#065F46'
                  }}>
                    {u.role}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
                    {new Date(u.submitted_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px' }}>
            {!selectedUser ? (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#94A3B8'
              }}>
                <p>Select an applicant from the left to review their documents</p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', marginBottom: '12px' }}>
                    {selectedUser.name}
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '14px' }}>
                      <Mail size={16} />
                      <span>{selectedUser.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '14px' }}>
                      <User size={16} />
                      <span>Role: <strong>{selectedUser.role}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '14px' }}>
                      <Calendar size={16} />
                      <span>Submitted: {new Date(selectedUser.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', marginBottom: '16px' }}>
                  Submitted Documents ({selectedUser.documents.length})
                </h3>

                <div style={{ display: 'grid', gap: '12px' }}>
                  {selectedUser.documents.length === 0 ? (
                    <div style={{ padding: '24px', backgroundColor: '#FEF2F2', borderRadius: '8px', color: '#991B1B', textAlign: 'center' }}>
                      <AlertCircle size={24} style={{ marginBottom: '8px' }} />
                      <p style={{ fontWeight: '600' }}>No documents uploaded</p>
                      <p style={{ fontSize: '13px', marginTop: '4px' }}>This applicant has not submitted any verification documents</p>
                    </div>
                  ) : (
                    selectedUser.documents.map((doc) => (
                      <div 
                        key={doc.id} 
                        style={{ 
                          padding: '16px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          backgroundColor: '#F9FAFB'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #E2E8F0'
                          }}>
                            <FileText size={24} color={doc.status === 'rejected' ? '#DC2626' : doc.status === 'approved' ? '#059669' : '#64748B'} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '15px', color: '#0F172A', marginBottom: '4px' }}>
                              {doc.doc_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>
                              Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
                            </div>
                            <div style={{ 
                              display: 'inline-block',
                              marginTop: '6px',
                              padding: '4px 10px',
                              backgroundColor: doc.status === 'rejected' ? '#FEE2E2' : doc.status === 'approved' ? '#D1FAE5' : '#FEF3C7',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: doc.status === 'rejected' ? '#991B1B' : doc.status === 'approved' ? '#065F46' : '#92400E'
                            }}>
                              {doc.status.toUpperCase()}
                            </div>
                            {doc.status === 'rejected' && doc.rejection_reason && (
                              <div style={{ fontSize: '13px', color: '#991B1B', marginTop: '8px', padding: '8px', backgroundColor: '#FEF2F2', borderRadius: '4px' }}>
                                <strong>Reason:</strong> {doc.rejection_reason}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {doc.file_url && (
                            <>
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: '8px 12px',
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '6px',
                                  color: '#0F172A',
                                  textDecoration: 'none',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Eye size={16} /> Preview
                              </a>
                              <a
                                href={doc.file_url}
                                download
                                style={{
                                  padding: '8px 12px',
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '6px',
                                  color: '#0F172A',
                                  textDecoration: 'none',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Download size={16} /> Download
                              </a>
                            </>
                          )}

                          {doc.status !== 'approved' && (
                            <>
                              <button
                                onClick={() => setApprovalModal({
                                  isOpen: true,
                                  type: 'document',
                                  vendorName: selectedUser.name,
                                  userId: selectedUser.user_id,
                                  docId: doc.id
                                })}
                                disabled={processing}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#059669',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: '#FFFFFF',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button
                                onClick={() => setRejectModal(doc)}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#DC2626',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: '#FFFFFF',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selectedUser.documents.length > 0 && selectedUser.documents.every(d => d.status === 'approved') && (
                  <button
                    onClick={() => setApprovalModal({
                      isOpen: true,
                      type: 'account',
                      vendorName: selectedUser.name,
                      userId: selectedUser.user_id,
                      docId: ''
                    })}
                    disabled={processing}
                    style={{
                      width: '100%',
                      marginTop: '24px',
                      padding: '16px',
                      backgroundColor: '#059669',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <CheckCircle size={20} /> Approve Account & Grant Access
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {successToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '16px 24px',
          backgroundColor: '#059669',
          color: '#FFFFFF',
          borderRadius: '8px',
          fontWeight: '600',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideInUp 0.3s ease-out',
          zIndex: 1001
        }}>
          <CheckCircle size={20} />
          {successToast}
        </div>
      )}

      <ApprovalModal
        isOpen={approvalModal.isOpen}
        onClose={() => setApprovalModal({ isOpen: false, type: null, vendorName: '', userId: '', docId: '' })}
        onConfirm={approvalModal.type === 'account' ? handleApproveAll : handleApproveDocument}
        vendorName={approvalModal.vendorName}
        action="approve"
        loading={processing}
      />

      {rejectModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '480px',
            width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                backgroundColor: '#FEE2E2',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle size={28} color="#DC2626" />
              </div>
              <button
                onClick={() => { setRejectModal(null); setRejectionReason(''); }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <X size={20} color="#94A3B8" />
              </button>
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Reject Document</h3>
            <p style={{ color: '#64748B', marginBottom: '20px' }}>
              Please provide a reason for rejecting this {rejectModal.doc_type.replace(/_/g, ' ')} document.
            </p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical'
              }}
              placeholder="e.g., Document is blurry and unreadable. Please upload a higher resolution scan."
            />

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => { setRejectModal(null); setRejectionReason(''); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectDocument}
                disabled={processing || !rejectionReason.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: processing ? '#94A3B8' : '#DC2626',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: processing || !rejectionReason.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {processing ? (
                  <>
                    <Loader size={18} className="spin" /> Processing...
                  </>
                ) : (
                  <>
                    <XCircle size={18} /> Reject Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

function X({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
