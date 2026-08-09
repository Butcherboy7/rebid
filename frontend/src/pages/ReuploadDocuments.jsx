import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Upload, CheckCircle, ArrowRight, Loader } from 'lucide-react';

const API_BASE = 'http://localhost:8001/api';

export function ReuploadDocuments() {
  const { user, updateUserStatus } = useAuth();
  const [rejectedDocs, setRejectedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
      fetchRejectedDocs();
    }
  }, [user]);

  const fetchRejectedDocs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/auth/status/${user.user_id}`);
      const docs = res.data.documents.filter(d => d.status === 'rejected');
      setRejectedDocs(docs);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReupload = async (docId, docType, file) => {
    if (!file) return;

    setUploading({ ...uploading, [docId]: true });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await axios.post('http://localhost:8001/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await axios.post(`${API_BASE}/auth/upload-document?user_id=${user.user_id}&doc_type=${docType}&file_url=${encodeURIComponent(uploadRes.data.url)}`);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

      fetchRejectedDocs();
    } catch (err) {
      console.error('Re-upload failed:', err);
    } finally {
      setUploading({ ...uploading, [docId]: false });
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size={40} className="spin" />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F9FAFB',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ 
          backgroundColor: '#FFFFFF', 
          borderRadius: '12px', 
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              backgroundColor: '#FEF2F2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <AlertTriangle size={36} color="#DC2626" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
              Documents Require Re-upload
            </h1>
            <p style={{ color: '#64748B', fontSize: '15px' }}>
              Some of your documents were rejected. Please review the feedback below and re-upload corrected versions.
            </p>
          </div>

          {rejectedDocs.length === 0 ? (
            <div style={{ 
              padding: '32px', 
              textAlign: 'center', 
              backgroundColor: '#F0FDF4',
              borderRadius: '8px',
              color: '#059669'
            }}>
              <CheckCircle size={32} style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '16px', fontWeight: '600' }}>All documents approved!</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>Your account is pending final approval.</p>
              <button
                onClick={() => updateUserStatus()}
                style={{
                  marginTop: '16px',
                  padding: '12px 24px',
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Refresh Status
              </button>
            </div>
          ) : (
            <div>
              {rejectedDocs.map((doc) => (
                <div key={doc.id} style={{ 
                  marginBottom: '24px', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #FCA5A5',
                  backgroundColor: '#FEF2F2'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
                      {doc.doc_type.replace('_', ' ').toUpperCase()}
                    </h3>
                    <div style={{ 
                      padding: '12px', 
                      backgroundColor: '#FFFFFF', 
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#991B1B'
                    }}>
                      <strong>Rejection Reason:</strong><br />
                      {doc.rejection_reason}
                    </div>
                  </div>

                  <div style={{ 
                    padding: '20px',
                    border: '2px dashed #E2E8F0',
                    borderRadius: '8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#FFFFFF'
                  }}>
                    <input
                      type="file"
                      onChange={(e) => handleReupload(doc.id, doc.doc_type, e.target.files[0])}
                      style={{ display: 'none' }}
                      id={`reupload-${doc.id}`}
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={uploading[doc.id]}
                    />
                    <label htmlFor={`reupload-${doc.id}`} style={{ cursor: 'pointer' }}>
                      {uploading[doc.id] ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748B' }}>
                          <Loader size={20} className="spin" />
                          Uploading...
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#0F172A' }}>
                          <Upload size={20} />
                          <span style={{ fontWeight: '600' }}>Click to Re-upload</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: '32px', textAlign: 'center' }}>
                <button
                  onClick={fetchRejectedDocs}
                  style={{
                    padding: '12px 28px',
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Check Status <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {success && (
            <div style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '16px 24px',
              backgroundColor: '#059669',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={20} />
              Document uploaded successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
