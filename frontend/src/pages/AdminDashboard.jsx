import React from 'react';
import axios from 'axios';
import { ShieldCheck, AlertTriangle, Lock } from 'lucide-react';

const API_BASE = 'http://localhost:8001/api';

export function AdminDashboard({ state, refreshState }) {
  const handleVerify = async (vendorId, approve) => {
    try {
      await axios.post(`${API_BASE}/admin/verify_vendor/${vendorId}?approve=${approve}`);
      refreshState();
    } catch (err) {
      alert("Action failed: " + err.message);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Admin Cards */}
      <div className="stats-grid">
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>VERIFIED SUPPLIERS</span>
          <h2 style={{ fontSize: '1.8rem', marginTop: '4px' }}>{state.verified_vendors.length}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>PENDING VERIFICATIONS</span>
          <h2 style={{ fontSize: '1.8rem', marginTop: '4px', color: 'var(--accent-amber)' }}>{state.pending_vendors.length}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>FLAGGED FRAUD ALERTS</span>
          <h2 style={{ fontSize: '1.8rem', marginTop: '4px', color: 'var(--accent-rose)' }}>{state.fraud_alerts.length}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>AUDIT CHAIN ENTRIES</span>
          <h2 style={{ fontSize: '1.8rem', marginTop: '4px', color: 'var(--accent-cyan)' }}>{state.audit_logs.length}</h2>
        </div>
      </div>

      <div className="two-col-grid">
        {/* Vendor Verification Hub */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <ShieldCheck size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem' }}>Vendor Verification Management</h3>
          </div>

          {state.pending_vendors.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No pending vendor verifications.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {state.pending_vendors.map(v => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(15,23,42,0.5)', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem' }}>{v.company}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Domain: {v.domain} | {v.email}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleVerify(v.id, true)} style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.4)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>
                      Approve Badge
                    </button>
                    <button onClick={() => handleVerify(v.id, false)} style={{ background: 'rgba(244,63,94,0.2)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.4)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Fraud & Anomaly Hub */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={20} color="var(--accent-rose)" />
            <h3 style={{ fontSize: '1.1rem' }}>Rule-Based Fraud & Anomaly Hub</h3>
          </div>

          {state.fraud_alerts.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              No fraud anomalies detected. Real-time monitoring rules active: (1) Bot activity &lt;2s (2) Price dump &gt;45% (3) Collusion rings.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {state.fraud_alerts.map((al, idx) => (
                <div key={idx} style={{ padding: '12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-high">{al.severity} RISK</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Risk Score: <b>{al.risk_score}%</b></span>
                  </div>
                  <h4 style={{ fontSize: '0.9rem', color: '#fca5a5', marginTop: '6px' }}>{al.type}</h4>
                  <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>{al.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cryptographic SHA-256 Audit Trail */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Lock size={20} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.1rem' }}>Cryptographic Hash-Chained Audit Log (SHA-256)</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#94a3b8' }}>
                <th style={{ padding: '10px' }}>LOG ID</th>
                <th style={{ padding: '10px' }}>ACTION</th>
                <th style={{ padding: '10px' }}>USER</th>
                <th style={{ padding: '10px' }}>PREVIOUS HASH</th>
                <th style={{ padding: '10px' }}>CURRENT SHA-256 HASH</th>
              </tr>
            </thead>
            <tbody>
              {state.audit_logs.map((log) => (
                <tr key={log.log_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>{log.log_id}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{log.action}</td>
                  <td style={{ padding: '10px', color: '#cbd5e1' }}>{log.user}</td>
                  <td style={{ padding: '10px', fontFamily: 'monospace', color: '#64748b' }}>{log.previous_hash.substring(0, 16)}...</td>
                  <td style={{ padding: '10px', fontFamily: 'monospace', color: 'var(--accent-emerald)' }}>{log.hash.substring(0, 24)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
