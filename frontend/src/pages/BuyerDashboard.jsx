import React, { useState } from 'react';
import axios from 'axios';
import { PlusCircle, Cpu, Award, Clock } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export function BuyerDashboard({ state, refreshState }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('IT Hardware');
  const [budget, setBudget] = useState(50000);
  const [duration, setDuration] = useState(10);
  const [wCost, setWCost] = useState(40);
  const [wRel, setWRel] = useState(30);
  const [wDel, setWDel] = useState(20);
  const [wRev, setWRev] = useState(10);

  const domains = [
    'IT Hardware',
    'Software & Cloud Services',
    'Logistics & Freight',
    'Raw Materials & Metals',
    'Construction & Infrastructure',
    'Healthcare & Medical Supplies',
    'Manufacturing & Heavy Machinery'
  ];

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/auctions`, {
        title,
        domain,
        max_budget: parseFloat(budget),
        duration_minutes: parseInt(duration),
        weight_cost: parseInt(wCost),
        weight_reliability: parseInt(wRel),
        weight_delivery: parseInt(wDel),
        weight_reviews: parseInt(wRev)
      });
      setShowCreateModal(false);
      setTitle('');
      refreshState();
    } catch (err) {
      alert("Failed to create auction: " + err.message);
    }
  };

  const runAiRecommendation = async (auc) => {
    setSelectedAuction(auc);
    setLoadingAi(true);
    setAiResult(null);
    try {
      const res = await axios.get(`${API_BASE}/ai/recommendation/${auc.id}`);
      setAiResult(res.data);
      setLoadingAi(false);
    } catch (err) {
      setLoadingAi(false);
      alert("AI Scoring error: " + err.message);
    }
  };

  const handleAward = async (rec) => {
    try {
      const res = await axios.post(`${API_BASE}/award`, {
        auction_id: selectedAuction.id,
        vendor_id: rec.vendor_id,
        vendor_name: rec.name,
        amount: rec.price
      });
      alert(`🎉 Contract Awarded to ${rec.name}! PDF Invoice generated.`);
      if (res.data.pdf_url) {
        window.open(`http://localhost:8000${res.data.pdf_url}`, '_blank');
      }
      setSelectedAuction(null);
      setAiResult(null);
      refreshState();
    } catch (err) {
      alert("Award failed: " + err.message);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Bar Stats */}
      <div className="stats-grid">
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ACTIVE REVERSE AUCTIONS</span>
          <h2 style={{ fontSize: '1.8rem', marginTop: '4px' }}>{state.auctions.filter(a => a.status === 'LIVE').length}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>COMPLETED CONTRACTS</span>
          <h2 style={{ fontSize: '1.8rem', marginTop: '4px', color: 'var(--accent-emerald)' }}>{state.auctions.filter(a => a.status === 'COMPLETED').length}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>TOTAL PROCURED SPEND</span>
          <h2 style={{ fontSize: '1.8rem', marginTop: '4px' }}>₹1,420,000</h2>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ESTIMATED AI SAVINGS</span>
          <h2 style={{ fontSize: '1.8rem', marginTop: '4px', color: 'var(--accent-cyan)' }}>14.2%</h2>
        </div>
      </div>

      {/* Main Procurement Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Live Procurement Auctions</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Configure priority weights, view real-time reversed bids, and run XGBoost recommendation models.</p>
        </div>
        <button className="gradient-btn" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlusCircle size={18} /> Create Procurement Auction
        </button>
      </div>

      {/* Auction Cards List */}
      <div className="auction-grid">
        {state.auctions.map((auc) => {
          const aucBids = state.bids.filter(b => b.auction_id === auc.id).sort((a,b) => a.price - b.price);

          return (
            <div key={auc.id} className="glass-panel glass-panel-hover" style={{ padding: '20px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-live">{auc.status}</span>
                  <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{auc.domain}</span>
                  <h3 style={{ marginTop: '8px', fontSize: '1.1rem' }}>{auc.title}</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Max Budget</span>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>₹{auc.max_budget.toLocaleString()}</p>
                </div>
              </div>

              {/* Priority Weights Overview */}
              <div style={{ margin: '16px 0', background: 'rgba(15, 23, 42, 0.4)', padding: '10px', borderRadius: '8px', display: 'flex', gap: '12px', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                <span>Cost: <b>{auc.weight_cost}%</b></span>
                <span>Reliability: <b>{auc.weight_reliability}%</b></span>
                <span>Delivery: <b>{auc.weight_delivery}%</b></span>
                <span>Reviews: <b>{auc.weight_reviews}%</b></span>
              </div>

              {/* Bids Leaderboard */}
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>LIVE BID LEADERBOARD ({aucBids.length} BIDS)</span>
                {aucBids.slice(0, 3).map((b, idx) => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                    <span>#{idx + 1} <b>{b.name}</b></span>
                    <span style={{ color: idx === 0 ? 'var(--accent-emerald)' : 'white', fontWeight: idx === 0 ? 'bold' : 'normal' }}>
                      ₹{b.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <Clock size={14} /> Auto-refreshing every 2s
                </div>
                <button
                  onClick={() => runAiRecommendation(auc)}
                  style={{
                    background: 'rgba(14, 165, 233, 0.15)',
                    color: 'var(--accent-cyan)',
                    border: '1px solid var(--accent-cyan)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Cpu size={16} /> Run XGBoost AI Scorer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE AUCTION MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '16px' }}>Create New Procurement Auction</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Procurement Title</label>
                <input required placeholder="e.g. Enterprise Workstation Procurement Lot" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Domain Category</label>
                  <select value={domain} onChange={e => setDomain(e.target.value)}>
                    {domains.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Max Budget (₹)</label>
                  <input type="number" required value={budget} onChange={e => setBudget(e.target.value)} />
                </div>
              </div>

              {/* Priority Sliders */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.85rem', marginBottom: '10px', color: 'var(--accent-cyan)' }}>⭐ AI Priority Weights Slider (USP)</h4>
                
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}><span>Cost Weight</span><b>{wCost}%</b></div>
                  <input type="range" min="10" max="70" value={wCost} onChange={e => setWCost(e.target.value)} />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}><span>Reliability Weight</span><b>{wRel}%</b></div>
                  <input type="range" min="10" max="50" value={wRel} onChange={e => setWRel(e.target.value)} />
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}><span>Delivery SLA Weight</span><b>{wDel}%</b></div>
                  <input type="range" min="10" max="40" value={wDel} onChange={e => setWDel(e.target.value)} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}><span>Reviews Weight</span><b>{wRev}%</b></div>
                  <input type="range" min="5" max="30" value={wRev} onChange={e => setWRev(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="gradient-btn" style={{ flex: 1 }}>Publish Live Auction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI RECOMMENDATION MODAL */}
      {selectedAuction && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>XGBoost AI Scoring & Explainer</h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{selectedAuction.title}</span>
              </div>
              <button onClick={() => setSelectedAuction(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {loadingAi ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Cpu size={40} color="var(--accent-cyan)" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '16px', color: '#94a3b8' }}>Loading vendor features... Running XGBoost model... Applying dynamic priority weights...</p>
              </div>
            ) : aiResult && aiResult.winner ? (
              <div>
                {/* Winner Card */}
                <div style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.15))', border: '1px solid var(--accent-cyan)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>AI RECOMMENDED WINNER</span>
                      <h2 style={{ fontSize: '1.5rem', marginTop: '2px' }}>{aiResult.winner.name}</h2>
                      <p style={{ fontSize: '1.1rem', color: 'var(--accent-emerald)', marginTop: '4px', fontWeight: 'bold' }}>Bid: ₹{aiResult.winner.price.toLocaleString()}</p>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(15, 23, 42, 0.8)', padding: '12px 18px', borderRadius: '10px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>XGB CONFIDENCE</span>
                      <h2 style={{ fontSize: '1.6rem', color: 'var(--accent-cyan)' }}>{aiResult.winner.ai_confidence}%</h2>
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Raw ML Prob: {aiResult.winner.xgb_raw_probability}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>WHY AI RECOMMENDS THIS SUPPLIER:</span>
                    <ul style={{ marginTop: '8px', paddingLeft: '18px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px', color: '#e2e8f0' }}>
                      {aiResult.winner.explanations.map((exp, idx) => (
                        <li key={idx}>{exp}</li>
                      ))}
                    </ul>
                  </div>

                  <button className="gradient-btn" onClick={() => handleAward(aiResult.winner)} style={{ width: '100%', marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <Award size={18} /> Award Vendor & Generate PDF Invoice
                  </button>
                </div>

                {/* Other Ranked Candidates */}
                <h4>Other Vendor Rankings</h4>
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {aiResult.recommendations.slice(1).map((rec, idx) => (
                    <div key={rec.vendor_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(15,23,42,0.4)', borderRadius: '8px', fontSize: '0.85rem' }}>
                      <span>#{idx + 2} <b>{rec.name}</b> (₹{rec.price.toLocaleString()})</span>
                      <span style={{ color: '#94a3b8' }}>Score: {rec.ai_confidence}% (XGB: {rec.xgb_raw_probability})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p>No bids available for AI scoring yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
