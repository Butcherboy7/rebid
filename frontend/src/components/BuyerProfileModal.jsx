import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatINR } from '../utils/formatters';
import { ShieldCheck, X, Building2, User, MapPin, Loader, AlertTriangle, FileCheck, ShoppingBag, DollarSign } from 'lucide-react';

const API_BASE = 'http://localhost:8001/api';

export function BuyerProfileModal({ buyerIdentifier, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!buyerIdentifier) return;
    setLoading(true);
    setError(null);

    axios.get(`${API_BASE}/buyers/${encodeURIComponent(buyerIdentifier)}/profile`)
      .then(res => setProfile(res.data))
      .catch(err => {
        console.error('Error loading buyer profile:', err);
        setError('Buyer profile details could not be loaded.');
      })
      .finally(() => setLoading(false));
  }, [buyerIdentifier]);

  if (!buyerIdentifier) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
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
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} color="#2563EB" />
            <span style={{ fontWeight: '800', fontSize: '16px', letterSpacing: '-0.01em' }}>Buyer Profile</span>
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
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
            <Loader size={40} className="spin" />
            <p style={{ marginTop: '16px' }}>Loading buyer profile...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#DC2626' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 12px auto' }} />
            <p>{error}</p>
          </div>
        ) : profile ? (
          <div style={{ padding: '24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#2563EB',
                  borderRadius: '16px',
                  color: '#FFF',
                  fontWeight: '800',
                  fontSize: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}>
                  {(profile.company_name || profile.name || 'B').slice(0, 2).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h1 style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: '800' }}>{profile.company_name || profile.name}</h1>
                    {profile.verified && (
                      <span className="badge badge-completed" style={{ fontSize: '11px', padding: '4px 10px' }}>
                        <ShieldCheck size={13} /> VERIFIED BUYER
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#94A3B8', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span>ID: <code style={{ color: '#CBD5E1' }}>{profile.id}</code></span>
                    {profile.member_since && <span>Member Since: <b style={{ color: '#F8FAFC' }}>{profile.member_since}</b></span>}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)', textAlign: 'center' }}>
                <ShoppingBag size={16} color="#2563EB" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Procurements Posted</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>{profile.auctions_posted}</div>
              </div>

              <div style={{ background: '#ECFDF5', padding: '14px', borderRadius: '12px', border: '1px solid #86EFAC', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.1)', textAlign: 'center' }}>
                <FileCheck size={16} color="#059669" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#065F46', textTransform: 'uppercase' }}>Contracts Awarded</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>{profile.contracts_awarded}</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)', textAlign: 'center' }}>
                <DollarSign size={16} color="#D97706" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Total Procurement Value</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>{formatINR(profile.total_procurement_value)}</div>
              </div>
            </div>

            {(profile.rep_name || profile.registered_address) && (
              <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <User size={18} color="#0F172A" />
                  <h4 style={{ fontWeight: '700', color: '#0F172A' }}>Organization Contact</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  {profile.rep_name && <div><span style={{ color: '#64748B' }}>Representative:</span> <br /><b>{profile.rep_name}</b></div>}
                  {profile.rep_designation && <div><span style={{ color: '#64748B' }}>Designation:</span> <br /><b>{profile.rep_designation}</b></div>}
                  {profile.registered_address && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> Registered Address:</span>
                      <b>{profile.registered_address}</b>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
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

export default BuyerProfileModal;
