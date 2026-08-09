import React, { useState } from 'react';
import axios from 'axios';
import { UserCheck, ShieldCheck, Zap, Send, MessageSquare } from 'lucide-react';

const API_BASE = 'http://localhost:8001/api';

export function VendorDashboard({ state, refreshState }) {
  const [selectedVendor, setSelectedVendor] = useState(state.verified_vendors[0] || {});
  const [bidAmount, setBidAmount] = useState('');
  const [activeAuctionId, setActiveAuctionId] = useState(state.auctions[0]?.id || '');

  // Filter live auctions matching vendor domain
  const domainAuctions = state.auctions.filter(a => a.domain === selectedVendor.domain);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (!bidAmount || !activeAuctionId) return;
    try {
      await axios.post(`${API_BASE}/bids`, {
        auction_id: activeAuctionId,
        vendor_id: selectedVendor.id,
        vendor_name: selectedVendor.name,
        price: parseFloat(bidAmount)
      });
      setBidAmount('');
      refreshState();
    } catch (err) {
      alert("Bid submission failed: " + err.message);
    }
  };

  const currentAuction = state.auctions.find(a => a.id === activeAuctionId);
  const auctionBids = state.bids.filter(b => b.auction_id === activeAuctionId).sort((a,b) => a.price - b.price);
  
  // Find current vendor's rank
  const vendorBidIndex = auctionBids.findIndex(b => b.vendor_id === selectedVendor.id || b.name === selectedVendor.name);
  const currentRank = vendorBidIndex >= 0 ? vendorBidIndex + 1 : 'N/A';
  const lowestPrice = auctionBids[0]?.price || currentAuction?.max_budget || 0;

  return (
    <div className="dashboard-container">
      {/* Vendor Profile Header */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={28} color="white" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.4rem' }}>{selectedVendor.name}</h2>
              <span className="badge badge-live" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} /> VERIFIED SUPPLIER
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>
              Domain: <b style={{ color: 'white' }}>{selectedVendor.domain}</b> | Reliability Score: <b style={{ color: 'var(--accent-emerald)' }}>{selectedVendor.reliability ? (selectedVendor.reliability * 100).toFixed(0) : 95}%</b>
            </p>
          </div>
        </div>

        {/* Vendor Selector for Switch Demo */}
        <div>
          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>SWITCH VENDOR PROFILE (DEMO)</label>
          <select value={selectedVendor.name} onChange={(e) => {
            const found = state.verified_vendors.find(v => v.name === e.target.value);
            if (found) setSelectedVendor(found);
          }}>
            {state.verified_vendors.map(v => (
              <option key={v.id} value={v.name}>{v.name} ({v.domain})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="vendor-main-grid">
        {/* Main Bidding Console */}
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Domain Auctions ({selectedVendor.domain})</h3>
          
          {domainAuctions.map(auc => (
            <div key={auc.id} className="glass-panel" style={{ padding: '20px', marginBottom: '16px', border: activeAuctionId === auc.id ? '1px solid var(--accent-indigo)' : '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span className="badge badge-live">{auc.status}</span>
                  <h3 style={{ marginTop: '8px', fontSize: '1.1rem' }}>{auc.title}</h3>
                </div>
                <button
                  onClick={() => setActiveAuctionId(auc.id)}
                  style={{
                    background: activeAuctionId === auc.id ? 'var(--accent-indigo)' : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {activeAuctionId === auc.id ? 'Active Console' : 'Select Auction'}
                </button>
              </div>

              {/* Submit Bid Box */}
              {activeAuctionId === auc.id && (
                <div style={{ marginTop: '20px', background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '10px' }}>
                  <form onSubmit={handleBidSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Your Decremented Bid Amount (₹)</label>
                      <input
                        type="number"
                        placeholder={`Less than ₹${lowestPrice}`}
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="gradient-btn" style={{ marginTop: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Send size={16} /> Submit Bid
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI Bidding Assistant Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Live Position Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>YOUR CURRENT LIVE POSITION</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>RANK</span>
                <h2 style={{ fontSize: '2.2rem', color: currentRank === 1 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>#{currentRank}</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>AI SCORE</span>
                <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-cyan)' }}>91.4</h2>
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Zap size={18} color="var(--accent-amber)" />
              <h4 style={{ fontSize: '0.95rem' }}>AI Bidding Assistant</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '10px', borderRadius: '8px', color: '#fef08a' }}>
                <b>Price Suggestion:</b> Reduce bid by <b>₹120</b> to overtake Rank #1.
              </div>
              <div style={{ background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.2)', padding: '10px', borderRadius: '8px', color: '#bae6fd' }}>
                <b>SLA Tip:</b> Your delivery performance score is slightly lower than competitor HP Enterprise.
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '8px', color: '#a7f3d0' }}>
                <b>Reputation Score:</b> 4.8 ★ rating boosts your baseline AI recommendation weight.
              </div>
            </div>
          </div>

          {/* Reviews Profile */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={16} /> Verified Buyer Reviews
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              {selectedVendor.reviews ? selectedVendor.reviews.map((r, idx) => (
                <div key={idx} style={{ background: 'rgba(15,23,42,0.4)', padding: '8px 12px', borderRadius: '6px' }}>
                  <b style={{ color: 'var(--accent-cyan)' }}>{r.author}:</b> "{r.text}"
                </div>
              )) : <p style={{ color: '#94a3b8' }}>No reviews yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
