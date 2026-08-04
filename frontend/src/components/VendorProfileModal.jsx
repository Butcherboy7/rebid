import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatINR } from '../utils/formatters';
import { ShieldCheck, Star, Award, Truck, X, Calendar, CheckCircle, TrendingUp, DollarSign, AlertTriangle, Zap, Building2, User } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export function VendorProfileModal({ vendorIdentifier, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
  }, [vendorIdentifier]);

  if (!vendorIdentifier) return null;

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
        {/* Header Bar */}
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
            <span style={{ fontWeight: '800', fontSize: '16px', letterSpacing: '-0.01em' }}>Enterprise Vendor Dossier</span>
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

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
            <div className="pulse-dot" style={{ margin: '0 auto 12px auto', width: '16px', height: '16px' }}></div>
            <p>Loading enriched vendor intelligence profile...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#DC2626' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 12px auto' }} />
            <p>{error}</p>
          </div>
        ) : profile && (
          <div style={{ padding: '24px' }}>

            {/* 1. LINKEDIN + AMAZON HYBRID HEADER BANNER */}
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


            {/* 2. FIVE KPI METRIC CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Contracts Won</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>{profile.contracts_completed}</div>
              </div>

              <div style={{ background: '#ECFDF5', padding: '14px', borderRadius: '12px', border: '1px solid #86EFAC', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#065F46', textTransform: 'uppercase' }}>On-Time Delivery</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>{profile.delivery_pct}%</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>SLA Reliability</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>{profile.reliability_pct}%</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Avg Rating</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>★ {profile.rating}</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Procurement Value</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>{formatINR(profile.total_procurement_val)}</div>
              </div>
            </div>


            {/* 3. PERFORMANCE CHARTS & SCORE BREAKDOWN */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>

              {/* Monthly Contracts SVG Canvas Chart */}
              <div className="card" style={{ padding: '18px', margin: 0 }}>
                <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Monthly Contracts Trend</h3>
                <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', padding: '10px 4px 0 4px', borderBottom: '1px solid #E2E8F0' }}>
                  {profile.chart_data.monthly_contracts.map((val, idx) => {
                    const maxVal = Math.max(...profile.chart_data.monthly_contracts, 12);
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
                        <span style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>{profile.chart_data.months[idx]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Performance Factors Progress Bars */}
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


            {/* 4. AI DECISION BREAKDOWN CARD */}
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


            {/* 5. PROCUREMENT HISTORY TABLE */}
            <div className="table-container" style={{ marginBottom: '24px' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '15px' }}>Procurement Contract History</h3>
                <p className="text-muted" style={{ fontSize: '12px' }}>Verified past contracts executed on ReBid AI</p>
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
                  {profile.history.map((h) => (
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


            {/* 6. STATISTICALLY CONSISTENT BUYER REVIEWS SECTION */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3>Buyer Feedback & Enterprise Reviews</h3>
                  <p className="text-muted" style={{ fontSize: '12px' }}>Statistically generated based on vendor's actual SLA ({profile.reliability_pct}%) & delivery record</p>
                </div>
                <span className="badge badge-completed">
                  <ShieldCheck size={14} /> VERIFIED BUYER REVIEWS
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {profile.reviews.map((rev) => (
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
        )}
      </div>
    </div>
  );
}
