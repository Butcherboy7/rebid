import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Navigation } from '../../components/Navigation';
import { VendorProfileModal } from '../../components/VendorProfileModal';
import { formatINR } from '../../utils/formatters';
import { ShoppingBag, Plus, Sparkles, Award, FileText, Clock, TrendingDown, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, Layers, DollarSign, ShieldCheck, RefreshCw, Download, FileCheck } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export function BuyerDashboard() {
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState('AUCTIONS'); // 'AUCTIONS' or 'AWARDED'
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' or 'ROOM'
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PENDING, LIVE, COMPLETED
  const [auctions, setAuctions] = useState([]);
  const [awardedContracts, setAwardedContracts] = useState([]);
  const [selectedAuctionId, setSelectedAuctionId] = useState(null);
  const [auctionDetail, setAuctionDetail] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingRec, setLoadingRec] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Vendor Profile Modal State
  const [selectedVendorForProfile, setSelectedVendorForProfile] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('IT Hardware');
  const [maxBudget, setMaxBudget] = useState(5000000);
  const [quantity, setQuantity] = useState(100);
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [weightCost, setWeightCost] = useState(40);
  const [weightRel, setWeightRel] = useState(30);
  const [weightDel, setWeightDel] = useState(20);
  const [weightRev, setWeightRev] = useState(10);

  // Fetch list of auctions
  const fetchAuctions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/auctions?status=all`);
      setAuctions(res.data || []);
    } catch (err) {
      console.error("Failed fetching auctions:", err);
    }
  };

  // Fetch awarded contracts / purchase orders
  const fetchAwardedContracts = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/buyer/awarded_contracts`, { headers });
      setAwardedContracts(res.data || []);
    } catch (err) {
      console.error("Failed fetching awarded contracts:", err);
    }
  };

  // Poll live auction detail every 2 seconds
  const fetchAuctionDetail = async () => {
    if (!selectedAuctionId) return;
    setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE}/auctions/${selectedAuctionId}`);
      setAuctionDetail(res.data);
    } catch (err) {
      console.error("Failed fetching auction detail:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
    fetchAwardedContracts();
  }, []);

  useEffect(() => {
    if (viewMode === 'ROOM' && selectedAuctionId) {
      fetchAuctionDetail();
      const interval = setInterval(fetchAuctionDetail, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedAuctionId, viewMode]);

  const handleOpenAuctionRoom = (aucId) => {
    setSelectedAuctionId(aucId);
    setRecommendation(null);
    setViewMode('ROOM');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateAuction = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_BASE}/auctions`, {
        title,
        category,
        max_budget: parseFloat(maxBudget),
        duration_minutes: parseInt(durationMinutes),
        weight_cost: parseInt(weightCost),
        weight_reliability: parseInt(weightRel),
        weight_delivery: parseInt(weightDel),
        weight_reviews: parseInt(weightRev)
      }, { headers });

      alert(res.data.message || "Procurement Auction created and submitted to Admin for approval!");
      setShowCreateModal(false);
      setTitle('');
      await fetchAuctions();
    } catch (err) {
      alert("Failed to create auction: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedAuctionId) return;
    setLoadingRec(true);
    try {
      const res = await axios.post(`${API_BASE}/recommend/${selectedAuctionId}`);
      setRecommendation(res.data);
    } catch (err) {
      alert("Failed generating AI recommendation");
    } finally {
      setLoadingRec(false);
    }
  };

  const handleAwardContract = async (vendorName, amount) => {
    if (!selectedAuctionId) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_BASE}/award`, {
        auction_id: selectedAuctionId,
        vendor_id: "VND-AWARD",
        vendor_name: vendorName,
        amount: parseFloat(amount)
      }, { headers });

      alert(`Contract Awarded to ${vendorName}! Official Purchase Order ${res.data.po_id} generated.`);
      if (res.data.pdf_url) {
        window.open(`http://localhost:8000${res.data.pdf_url}`, '_blank');
      }
      fetchAuctionDetail();
      fetchAuctions();
      fetchAwardedContracts();
    } catch (err) {
      alert("Failed awarding contract");
    }
  };

  // Filtered Auctions
  const filteredAuctions = auctions.filter(a => {
    if (filterStatus === 'PENDING') return a.status === 'pending_approval';
    if (filterStatus === 'LIVE') return a.status === 'live';
    if (filterStatus === 'COMPLETED') return a.status === 'completed' || a.status === 'awarded';
    return true;
  });

  return (
    <div className="app-container">
      {/* Global Vendor Dossier Profile Modal */}
      <VendorProfileModal
        vendorIdentifier={selectedVendorForProfile}
        onClose={() => setSelectedVendorForProfile(null)}
      />

      {/* Navigation (Sidebar Desktop + Mobile Drawer) */}
      <Navigation activePortal="BUYER" activeItem={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="content-area">

        {/* TOP TAB NAV CONTROLS: Procurements vs Awarded Contracts */}
        <div className="filter-tabs" style={{ marginBottom: '20px' }}>
          <button className={`filter-tab-btn ${activeTab === 'AUCTIONS' ? 'active' : ''}`} onClick={() => { setActiveTab('AUCTIONS'); setViewMode('GRID'); }}>
            Active Procurements ({auctions.length})
          </button>
          <button className={`filter-tab-btn ${activeTab === 'AWARDED' ? 'active' : ''}`} onClick={() => { setActiveTab('AWARDED'); setViewMode('GRID'); }}>
            Awarded Contracts & Purchase Orders ({awardedContracts.length})
          </button>
        </div>


        {/* ---------------------------------------------------- */}
        {/* VIEW MODE 1: GRID VIEW (Procurements List)         */}
        {/* ---------------------------------------------------- */}
        {viewMode === 'GRID' && activeTab === 'AUCTIONS' && (
          <>
            <div className="top-header">
              <div>
                <h1>Procurement Command Center</h1>
                <p className="text-muted">Manage enterprise reverse procurements, monitor live bids & trigger XGBoost recommendations</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} /> Create New Procurement
              </button>
            </div>

            {/* Create Auction Modal */}
            {showCreateModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                <div className="card" style={{ width: '540px', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
                  <h2>Create Reverse Auction Procurement</h2>
                  <p className="text-muted" style={{ fontSize: '12px', marginBottom: '14px' }}>
                    Procurement request will be submitted to Compliance Admin for approval before launching live.
                  </p>

                  <form onSubmit={handleCreateAuction}>
                    <div className="form-group">
                      <label className="form-label">Procurement Title</label>
                      <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Server Fleet Infrastructure 2026" required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                          <option value="IT Hardware">IT Hardware</option>
                          <option value="Software & Cloud Services">Software & Cloud Services</option>
                          <option value="Logistics & Freight">Logistics & Freight</option>
                          <option value="Raw Materials & Metals">Raw Materials & Metals</option>
                          <option value="Construction & Infrastructure">Construction & Infrastructure</option>
                          <option value="Healthcare & Medical Supplies">Healthcare & Medical Supplies</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Max Budget (₹)</label>
                        <input type="number" className="form-control" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} required />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Quantity / Units</label>
                        <input type="number" className="form-control" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Auction Duration (Minutes)</label>
                        <input type="number" className="form-control" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} required />
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #CBD5E1' }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>AI Decision Weight Sliders (Total 100%)</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '2px' }}>Cost Weight ({weightCost}%)</label>
                          <input type="range" min="0" max="100" value={weightCost} onChange={(e) => setWeightCost(e.target.value)} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '2px' }}>Reliability Weight ({weightRel}%)</label>
                          <input type="range" min="0" max="100" value={weightRel} onChange={(e) => setWeightRel(e.target.value)} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '2px' }}>Delivery SLA Weight ({weightDel}%)</label>
                          <input type="range" min="0" max="100" value={weightDel} onChange={(e) => setWeightDel(e.target.value)} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '2px' }}>Reviews Weight ({weightRev}%)</label>
                          <input type="range" min="0" max="100" value={weightRev} onChange={(e) => setWeightRev(e.target.value)} style={{ width: '100%' }} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Submit for Admin Approval</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Procurement Auctions Grid */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>Procurement Auctions</h2>

                {/* Filter Tabs */}
                <div className="filter-tabs" style={{ marginBottom: 0 }}>
                  <button className={`filter-tab-btn ${filterStatus === 'ALL' ? 'active' : ''}`} onClick={() => setFilterStatus('ALL')}>
                    All ({auctions.length})
                  </button>
                  <button className={`filter-tab-btn ${filterStatus === 'PENDING' ? 'active' : ''}`} onClick={() => setFilterStatus('PENDING')}>
                    Pending Approval ({auctions.filter(a => a.status === 'pending_approval').length})
                  </button>
                  <button className={`filter-tab-btn ${filterStatus === 'LIVE' ? 'active' : ''}`} onClick={() => setFilterStatus('LIVE')}>
                    Live ({auctions.filter(a => a.status === 'live').length})
                  </button>
                  <button className={`filter-tab-btn ${filterStatus === 'COMPLETED' ? 'active' : ''}`} onClick={() => setFilterStatus('COMPLETED')}>
                    Completed / Awarded ({auctions.filter(a => a.status !== 'live' && a.status !== 'pending_approval').length})
                  </button>
                </div>
              </div>

              <div className="auction-grid">
                {filteredAuctions.map((a) => (
                  <div
                    key={a.id}
                    className="auction-card"
                    onClick={() => handleOpenAuctionRoom(a.id)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="badge badge-live" style={{ fontSize: '11px' }}>{a.category}</span>
                        <span className={`badge ${a.status === 'live' ? 'badge-completed' : a.status === 'pending_approval' ? 'badge-med-risk' : 'badge-live'}`}>
                          {a.status === 'pending_approval' ? '⏳ PENDING APPROVAL' : a.status.toUpperCase()}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: '#0F172A' }}>{a.title}</h3>
                      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>ID: {a.id}</div>
                    </div>

                    <div style={{ paddingTop: '12px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase' }}>Target Budget</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>
                          {formatINR(a.max_budget)}
                        </div>
                      </div>
                      <button className="btn btn-primary" style={{ height: '34px', fontSize: '12px' }}>
                        {a.status === 'pending_approval' ? 'View Details' : 'Manage Bids →'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}


        {/* ---------------------------------------------------- */}
        {/* VIEW MODE 1-B: AWARDED CONTRACTS & PURCHASE ORDERS  */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'AWARDED' && (
          <div className="table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Awarded Procurement Contracts & Official Purchase Orders</h2>
                <p className="text-muted">Permanent historical records of executed procurements and official SAP/GeM Purchase Order PDFs</p>
              </div>
              <button className="btn btn-secondary" onClick={fetchAwardedContracts}>
                <RefreshCw size={15} /> Refresh Records
              </button>
            </div>

            <table>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Auction ID</th>
                  <th>Procurement Title</th>
                  <th>Awarded Vendor</th>
                  <th>Final Value (₹)</th>
                  <th>Issue Date</th>
                  <th>Official PO Document</th>
                </tr>
              </thead>
              <tbody>
                {awardedContracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>
                      No awarded contracts found. Award an auction to issue an official Purchase Order PDF.
                    </td>
                  </tr>
                ) : (
                  awardedContracts.map((po) => (
                    <tr key={po.po_id}>
                      <td><code style={{ fontSize: '12px', fontWeight: '700' }}>{po.po_id}</code></td>
                      <td><code>{po.auction_id}</code></td>
                      <td><b>{po.title}</b></td>
                      <td>
                        <b
                          onClick={() => setSelectedVendorForProfile(po.vendor_name)}
                          style={{ color: '#0F172A', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          {po.vendor_name}
                        </b>
                      </td>
                      <td><b style={{ color: '#059669', fontSize: '15px' }}>{formatINR(po.amount)}</b></td>
                      <td className="text-muted">{new Date(po.created_at).toLocaleDateString()}</td>
                      <td>
                        <a
                          href={`http://localhost:8000${po.pdf_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ fontSize: '12px', padding: '4px 10px', height: 'auto', textDecoration: 'none' }}
                        >
                          <Download size={14} /> Download Purchase Order PDF
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}


        {/* ---------------------------------------------------- */}
        {/* VIEW MODE 2: HERO LIVE ROOM & AI REPORT (Focused)    */}
        {/* ---------------------------------------------------- */}
        {viewMode === 'ROOM' && auctionDetail && (
          <div>
            {/* Top Back Navigation & In-Place Refresh Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setViewMode('GRID')}>
                <ArrowLeft size={16} /> Back to Procurements
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={fetchAuctionDetail} disabled={refreshing}>
                  <RefreshCw size={15} className={refreshing ? 'spin' : ''} /> Refresh Live Bids
                </button>
                <button className="btn btn-primary" onClick={handleGenerateAI} disabled={loadingRec || auctionDetail.status === 'pending_approval'}>
                  <Sparkles size={16} /> {loadingRec ? 'Running XGBoost Engine...' : 'Generate AI Recommendation'}
                </button>
              </div>
            </div>

            {/* Auction Header Summary Card */}
            <div className="card" style={{ border: '2px solid #0F172A', boxShadow: 'var(--shadow-hover)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <span className="badge badge-live" style={{ marginBottom: '4px' }}>{auctionDetail.category}</span>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A' }}>{auctionDetail.title} ({auctionDetail.id})</h1>
                </div>
                <span className={`badge ${auctionDetail.status === 'live' ? 'badge-completed' : auctionDetail.status === 'pending_approval' ? 'badge-med-risk' : 'badge-live'}`} style={{ padding: '6px 14px' }}>
                  {auctionDetail.status === 'live' && <div className="pulse-dot" style={{ width: '8px', height: '8px' }}></div>}
                  STATUS: {auctionDetail.status === 'pending_approval' ? '⏳ PENDING ADMIN APPROVAL' : auctionDetail.status.toUpperCase()}
                </span>
              </div>

              {auctionDetail.status === 'pending_approval' && (
                <div style={{ padding: '12px 16px', background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                  ⏳ This procurement auction is currently waiting for Compliance Admin approval before going live to vendors.
                </div>
              )}

              {/* Stat Cards Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Target Budget Benchmark</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>{formatINR(auctionDetail.max_budget)}</div>
                </div>

                <div style={{ background: '#ECFDF5', padding: '16px', borderRadius: '12px', border: '1px solid #86EFAC' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#065F46', textTransform: 'uppercase' }}>Current Lowest Bid</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669' }}>
                    {formatINR(auctionDetail.lowest_bid)}
                  </div>
                  <span className="text-muted" style={{ fontSize: '12px' }}>Total Bids: {auctionDetail.total_bids}</span>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Auction Countdown</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: '800', color: auctionDetail.status !== 'live' ? '#94A3B8' : auctionDetail.time_remaining_seconds < 60 ? '#DC2626' : '#0F172A' }}>
                    {auctionDetail.status !== 'live' ? (auctionDetail.status === 'pending_approval' ? 'Pending Approval' : 'Ended') : `${Math.floor(auctionDetail.time_remaining_seconds / 60)}m ${auctionDetail.time_remaining_seconds % 60}s`}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Leaderboard Table */}
            <div className="table-container" style={{ marginBottom: '28px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2>Live Bidding Leaderboard & Feed</h2>
                  <p className="text-muted">Click any vendor name to view verified performance profile dossier</p>
                </div>
                {auctionDetail.status === 'live' && (
                  <div className="badge badge-completed">
                    <div className="pulse-dot" style={{ width: '8px', height: '8px' }}></div> LIVE FEED ACTIVE
                  </div>
                )}
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Vendor Name</th>
                    <th>Bid Price (₹)</th>
                    <th>Savings vs Budget</th>
                    <th>Submitted Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {auctionDetail.leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>
                        No bids submitted yet for this auction.
                      </td>
                    </tr>
                  ) : (
                    auctionDetail.leaderboard.map((b) => {
                      const savings = auctionDetail.max_budget - b.price;
                      return (
                        <tr key={b.bid_id} style={{ background: b.rank === 1 ? '#ECFDF5' : 'transparent' }}>
                          <td>
                            <b style={{ fontSize: '16px', color: b.rank === 1 ? '#059669' : '#0F172A' }}>
                              {b.rank === 1 ? '🥇 #1' : b.rank === 2 ? '🥈 #2' : `#${b.rank}`}
                            </b>
                          </td>
                          <td>
                            <b
                              onClick={() => setSelectedVendorForProfile(b.vendor_name)}
                              style={{ color: '#0F172A', cursor: 'pointer', textDecoration: 'underline' }}
                              title="Click to view Vendor Profile Dossier"
                            >
                              {b.vendor_name}
                            </b>
                            {b.fraud_warning && (
                              <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertTriangle size={12} /> {b.fraud_warning}
                              </div>
                            )}
                          </td>
                          <td><b style={{ fontSize: '16px' }}>{formatINR(b.price)}</b></td>
                          <td style={{ color: '#059669', fontWeight: '700' }}>
                            +{formatINR(savings)} ({((savings / auctionDetail.max_budget) * 100).toFixed(1)}%)
                          </td>
                          <td className="text-muted">{new Date(b.timestamp).toLocaleTimeString()}</td>
                          <td>
                            {auctionDetail.status === 'live' && (
                              <button
                                className="btn btn-secondary"
                                style={{ fontSize: '12px', padding: '4px 10px', height: 'auto' }}
                                onClick={() => handleAwardContract(b.vendor_name, b.price)}
                              >
                                <Award size={14} /> Award Contract
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* XGBoost AI Recommendation Card */}
            {recommendation && recommendation.decision_report && (
              <div className="ai-recommendation-card" style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ⚡ XGBoost AI Recommendation Engine Report
                    </span>
                    <h2 style={{ fontSize: '24px', marginTop: '2px' }}>
                      Recommended Winner: {' '}
                      <span
                        onClick={() => setSelectedVendorForProfile(recommendation.recommended_vendor)}
                        style={{ color: '#059669', cursor: 'pointer', textDecoration: 'underline' }}
                        title="Click to view Vendor Profile Dossier"
                      >
                        {recommendation.recommended_vendor}
                      </span>
                    </h2>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '36px', fontWeight: '800', color: '#0F172A', lineHeight: 1 }}>
                      {recommendation.confidence_percentage}%
                    </div>
                    <span className="text-muted">AI Match Confidence</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                  {/* Sub-Score Progress Bars */}
                  <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ marginBottom: '14px' }}>Decision Factor Sub-Scores</h3>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Price Score</span>
                        <b>{recommendation.decision_report.price_score} / 100</b>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${recommendation.decision_report.price_score}%` }}></div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Reliability Score</span>
                        <b>{recommendation.decision_report.reliability_score} / 100</b>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${recommendation.decision_report.reliability_score}%`, backgroundColor: '#059669' }}></div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Delivery SLA Score</span>
                        <b>{recommendation.decision_report.delivery_score} / 100</b>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${recommendation.decision_report.delivery_score}%`, backgroundColor: '#475569' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Historical Performance Score</span>
                        <b>{recommendation.decision_report.history_score} / 100</b>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${recommendation.decision_report.history_score}%`, backgroundColor: '#D97706' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Risk Badge & Rationale */}
                  <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3>Compliance Rationale</h3>
                        <span className={`badge ${recommendation.decision_report.overall_risk === 'LOW' ? 'badge-low-risk' : 'badge-med-risk'}`}>
                          RISK LEVEL: {recommendation.decision_report.overall_risk}
                        </span>
                      </div>

                      <ul style={{ listStyle: 'none' }}>
                        {recommendation.ranking_list[0]?.explanations?.map((exp, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '8px', color: '#0F172A' }}>
                            <CheckCircle size={15} color="#059669" />
                            <span>{exp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: '16px', height: '42px', fontSize: '14px' }}
                      onClick={() => handleAwardContract(recommendation.recommended_vendor, recommendation.ranking_list[0].price)}
                    >
                      <Award size={16} /> Award Contract & Issue PO to {recommendation.recommended_vendor} ({formatINR(recommendation.ranking_list[0]?.price)})
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
