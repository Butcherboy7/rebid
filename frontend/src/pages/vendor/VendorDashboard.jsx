import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Navigation } from '../../components/Navigation';
import { VendorProfileModal } from '../../components/VendorProfileModal';
import { formatINR } from '../../utils/formatters';
import { Truck, ArrowLeft, ArrowDownRight, Lightbulb, RefreshCw, CheckCircle, Star, Users, ChevronDown, Zap, ShieldCheck, Lock, AlertCircle, Clock, TrendingUp, TrendingDown, Info, Award, Download, Sparkles, PartyPopper } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export function VendorDashboard() {
  const { user, token, login } = useAuth();

  const [activeTab, setActiveTab] = useState('BIDROOM'); // 'BIDROOM' or 'MY_AWARDS'
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' or 'ROOM'
  const [auctions, setAuctions] = useState([]);
  const [awardedContracts, setAwardedContracts] = useState([]);
  const [selectedAuctionId, setSelectedAuctionId] = useState(null);
  const [auctionDetail, setAuctionDetail] = useState(null);
  const [bidPrice, setBidPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingAuctions, setLoadingAuctions] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Vendor Profile Modal State
  const [selectedVendorForProfile, setSelectedVendorForProfile] = useState(null);

  // Floating Toast Notification Stack State
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };
  
  // Rank movement tracking
  const prevRankRef = useRef(null);
  const [rankShiftMessage, setRankShiftMessage] = useState('');

  // Demo Switcher Accounts
  const demoVendors = [
    { name: "HP Enterprise Solutions", email: "vendor1@rebid.ai", category: "IT Hardware", rating: 4.9, sla: "96%" },
    { name: "Dell Technologies", email: "vendor2@rebid.ai", category: "IT Hardware", rating: 4.7, sla: "92%" },
    { name: "Lenovo Business", email: "lenovo@rebid.ai", category: "IT Hardware", rating: 4.6, sla: "89%" },
    { name: "Acer Commercial", email: "acer@rebid.ai", category: "IT Hardware", rating: 4.4, sla: "86%" },
    { name: "Tata Steel Ltd", email: "tatasteel@rebid.ai", category: "Raw Materials & Metals", rating: 4.9, sla: "95%" },
    { name: "JSW Steel Infra", email: "jswsteel@rebid.ai", category: "Raw Materials & Metals", rating: 4.7, sla: "91%" },
    { name: "L&T Construction", email: "ltconst@rebid.ai", category: "Construction & Infrastructure", rating: 4.8, sla: "94%" },
    { name: "Blue Dart Logistics", email: "bluedart@rebid.ai", category: "Logistics & Freight", rating: 4.8, sla: "96%" },
    { name: "DHL Supply Chain", email: "dhl@rebid.ai", category: "Logistics & Freight", rating: 4.6, sla: "90%" },
    { name: "Amazon Business Services", email: "amazon@rebid.ai", category: "Software & Cloud Services", rating: 4.9, sla: "97%" }
  ];

  const currentVendorProfile = demoVendors.find(v => v.email === user?.email) || demoVendors[0];

  const handleSwitchDemoVendor = async (vendor) => {
    try {
      const res = await axios.post(`${API_BASE}/vendor/login`, { email: vendor.email, password: "password123" });
      login(res.data.access_token, res.data);
      addToast(`Switched company account to: ${vendor.name}`, 'info');
      setShowAccountDropdown(false);
      fetchAuctions();
      fetchAwardedContracts();
    } catch (err) {
      alert("Failed switching demo account");
    }
  };

  const fetchAuctions = async () => {
    setLoadingAuctions(true);
    try {
      const res = await axios.get(`${API_BASE}/auctions`);
      setAuctions(res.data || []);
    } catch (err) {
      console.error("Error fetching auctions:", err);
    } finally {
      setLoadingAuctions(false);
    }
  };

  const fetchAwardedContracts = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/vendor/awarded_contracts`, { headers });
      setAwardedContracts(res.data || []);
    } catch (err) {
      console.error("Error fetching awarded contracts:", err);
    }
  };

  const fetchAuctionDetail = async () => {
    if (!selectedAuctionId) return;
    try {
      const res = await axios.get(`${API_BASE}/auctions/${selectedAuctionId}`);
      const data = res.data;
      setAuctionDetail(data);

      // Compute Dynamic Rank Shift
      const vendorName = user?.name || currentVendorProfile.name;
      const myCurrentBid = data.leaderboard?.find(b => b.vendor_name === vendorName || b.vendor_id === user?.vendor_id);
      if (myCurrentBid) {
        const currRank = myCurrentBid.rank;
        const prevRank = prevRankRef.current;
        if (prevRank !== null && prevRank !== currRank) {
          if (currRank < prevRank) {
            setRankShiftMessage(`(↑ Moved up from #${prevRank})`);
            addToast(`Rank position improved to #${currRank}!`, 'success');
          } else {
            setRankShiftMessage(`(🔻 Dropped from #${prevRank})`);
          }
        } else if (prevRank === null) {
          setRankShiftMessage(currRank === 1 ? '🥇 Winner Rank' : `🥈 Rank #${currRank}`);
        }
        prevRankRef.current = currRank;
      }
    } catch (err) {
      console.error("Error fetching auction detail:", err);
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

  // Open Live Room
  const handleOpenAuctionRoom = (aucId) => {
    setSelectedAuctionId(aucId);
    prevRankRef.current = null;
    setRankShiftMessage('');
    setViewMode('ROOM');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Vendor current bid & rank
  const vendorName = user?.name || currentVendorProfile.name;
  const currentLeaderboard = auctionDetail?.leaderboard || [];
  const myBid = currentLeaderboard.find(b => b.vendor_name === vendorName || b.vendor_id === user?.vendor_id);
  const lowestBidPrice = auctionDetail?.lowest_bid || auctionDetail?.max_budget || 0;

  const isAuctionClosed = auctionDetail && auctionDetail.status !== 'live';

  // AI Bidding Assistant Calculations
  const suggestedCounterBid = Math.max(1000, lowestBidPrice - 25000);
  const projectedRank = "#1";
  const projectedAIScore = "95%";

  // Quick One-Click Bids (INR)
  const quickBids = [
    { label: '-₹25,000 Drop', val: 25000 },
    { label: '-₹50,000 Drop', val: 50000 },
    { label: '-₹1,00,000 Drop', val: 100000 }
  ];

  const handleSubmitBid = async (priceToSubmit) => {
    if (!selectedAuctionId) return;
    if (isAuctionClosed) {
      alert("This auction has ended and is closed for bidding.");
      return;
    }

    const finalPrice = parseFloat(priceToSubmit || bidPrice);
    if (!finalPrice || isNaN(finalPrice)) {
      alert("Please enter a valid bid price");
      return;
    }

    setSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_BASE}/bids`, {
        auction_id: selectedAuctionId,
        price: finalPrice
      }, { headers });

      addToast(`Bid of ${formatINR(finalPrice)} submitted!`, 'success');
      setBidPrice('');
      fetchAuctionDetail();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed submitting bid");
    } finally {
      setSubmitting(false);
    }
  };

  const latestAward = awardedContracts.length > 0 ? awardedContracts[0] : null;

  return (
    <div className="app-container">
      {/* Global Vendor Profile Modal */}
      <VendorProfileModal
        vendorIdentifier={selectedVendorForProfile}
        onClose={() => setSelectedVendorForProfile(null)}
      />

      {/* Floating Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast-item" style={{ background: t.type === 'info' ? '#0F172A' : '#059669' }}>
            <CheckCircle size={16} />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Navigation (Sidebar Desktop + Mobile Drawer) */}
      <Navigation activePortal="VENDOR" activeItem={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="content-area">

        {/* TOP TAB NAV CONTROLS: Active Bidding vs My Contract Awards */}
        <div className="filter-tabs" style={{ marginBottom: '20px' }}>
          <button className={`filter-tab-btn ${activeTab === 'BIDROOM' ? 'active' : ''}`} onClick={() => { setActiveTab('BIDROOM'); setViewMode('GRID'); }}>
            Active Procurement Bidding
          </button>
          <button className={`filter-tab-btn ${activeTab === 'MY_AWARDS' ? 'active' : ''}`} onClick={() => { setActiveTab('MY_AWARDS'); setViewMode('GRID'); }}>
            My Awarded Contracts ({awardedContracts.length})
          </button>
        </div>


        {/* ---------------------------------------------------- */}
        {/* VIEW MODE 1: GRID VIEW (Auctions Browser)           */}
        {/* ---------------------------------------------------- */}
        {viewMode === 'GRID' && activeTab === 'BIDROOM' && (
          <>
            <div className="top-header">
              <div>
                <h1>Vendor Bidding Workstation</h1>
                <p className="text-muted">Select an active procurement auction to enter the Hero Live Bidding Room</p>
              </div>
              <button className="btn btn-secondary" onClick={fetchAuctions} disabled={loadingAuctions}>
                <RefreshCw size={15} className={loadingAuctions ? 'spin' : ''} />
                {loadingAuctions ? 'Refreshing...' : 'Refresh Auctions'}
              </button>
            </div>

            {/* PROMINENT CONGRATULATIONS AWARD CARD IF AWARDED CONTRACT EXISTS */}
            {latestAward && (
              <div style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: 'var(--shadow-hover)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <PartyPopper size={24} color="#FDE047" />
                      <h2 style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: '800' }}>
                        🎉 Congratulations! {vendorName} Has Been Awarded The Contract
                      </h2>
                    </div>
                    <p style={{ color: '#A7F3D0', fontSize: '14px', marginBottom: '14px' }}>
                      Buyer Organization <b>{latestAward.buyer_name}</b> selected your company as the winning vendor!
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', fontSize: '13px', background: 'rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '10px' }}>
                      <div>Procurement: <b style={{ color: '#FFF' }}>{latestAward.title}</b></div>
                      <div>Contract Value: <b style={{ color: '#FFF' }}>{formatINR(latestAward.amount)}</b></div>
                      <div>Delivery Deadline: <b style={{ color: '#FFF' }}>{latestAward.delivery_deadline}</b></div>
                      <div>Status: <b style={{ color: '#FDE047' }}>AWARDED (PO Issued)</b></div>
                    </div>
                  </div>

                  <a
                    href={`http://localhost:8000${latestAward.pdf_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ backgroundColor: '#FFFFFF', color: '#047857', fontWeight: '800', height: '44px', textDecoration: 'none', padding: '0 20px' }}
                  >
                    <Download size={16} /> Download Official Purchase Order PDF
                  </a>
                </div>
              </div>
            )}

            {/* Vendor Company Profile Banner Card */}
            <div className="card" style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '20px 24px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '52px', height: '52px', backgroundColor: '#0F172A', borderRadius: '12px', color: '#FFF', fontWeight: '800', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {vendorName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2
                        onClick={() => setSelectedVendorForProfile(vendorName)}
                        style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', cursor: 'pointer', textDecoration: 'underline' }}
                        title="Click to view Vendor Profile Dossier"
                      >
                        {vendorName}
                      </h2>
                      <span className="badge badge-completed" style={{ fontSize: '11px' }}>
                        <ShieldCheck size={12} /> VERIFIED VENDOR
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                      <span>Category: <b>{currentVendorProfile.category}</b></span>
                      <span>Rating: <b style={{ color: '#D97706' }}>★ {currentVendorProfile.rating}</b></span>
                      <span>Reliability SLA: <b style={{ color: '#059669' }}>{currentVendorProfile.sla}</b></span>
                    </div>
                  </div>
                </div>

                {/* Account Switcher Dropdown */}
                <div style={{ position: 'relative' }}>
                  <button className="btn btn-secondary" onClick={() => setShowAccountDropdown(!showAccountDropdown)}>
                    <Users size={15} color="#059669" /> Switch Company Account <ChevronDown size={14} />
                  </button>

                  {showAccountDropdown && (
                    <div className="user-menu-dropdown" style={{ width: '320px', right: 0, top: '46px' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Select Demo Vendor Account</span>
                      </div>
                      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {demoVendors.map((v) => (
                          <div
                            key={v.email}
                            onClick={() => handleSwitchDemoVendor(v)}
                            style={{
                              padding: '10px 16px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #F1F5F9',
                              background: user?.email === v.email ? '#ECFDF5' : 'transparent',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>{v.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                              <span>{v.category}</span>
                              <span style={{ color: '#059669', fontWeight: '600' }}>SLA {v.sla}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category Auctions Bento Cards Grid */}
            <div>
              <h2 style={{ marginBottom: '16px' }}>Active Procurement Auctions</h2>
              <div className="auction-grid">
                {auctions.map((a) => (
                  <div
                    key={a.id}
                    className="auction-card"
                    onClick={() => handleOpenAuctionRoom(a.id)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="badge badge-live" style={{ fontSize: '11px' }}>{a.category}</span>
                        <span className={`badge ${a.status === 'live' ? 'badge-completed' : 'badge-live'}`}>
                          {a.status.toUpperCase()}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: '#0F172A' }}>{a.title}</h3>
                      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>ID: {a.id}</div>
                    </div>

                    <div style={{ paddingTop: '12px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase' }}>Lowest Bid</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>
                          {formatINR(a.lowest_bid)}
                        </div>
                      </div>
                      <button className="btn btn-primary" style={{ height: '34px', fontSize: '12px' }}>
                        {a.status === 'live' ? 'Enter Auction →' : 'View Closed Auction'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}


        {/* ---------------------------------------------------- */}
        {/* VIEW MODE 1-B: VENDOR AWARDED CONTRACTS TAB          */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'MY_AWARDS' && (
          <div className="table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Awarded Contracts & Issued Purchase Orders</h2>
                <p className="text-muted">Permanent historical records of contracts won by your company</p>
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
                  <th>Buyer Organization</th>
                  <th>Final Contract Value (₹)</th>
                  <th>Delivery Deadline</th>
                  <th>Official PO PDF</th>
                </tr>
              </thead>
              <tbody>
                {awardedContracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#64748B', padding: '32px' }}>
                      No awarded contracts found for this vendor account. Win live auctions to receive official Purchase Orders.
                    </td>
                  </tr>
                ) : (
                  awardedContracts.map((po) => (
                    <tr key={po.po_id}>
                      <td><code style={{ fontSize: '12px', fontWeight: '700' }}>{po.po_id}</code></td>
                      <td><code>{po.auction_id}</code></td>
                      <td><b>{po.title}</b></td>
                      <td><b>{po.buyer_name}</b></td>
                      <td><b style={{ color: '#059669', fontSize: '15px' }}>{formatINR(po.amount)}</b></td>
                      <td><b style={{ color: '#0F172A' }}>{po.delivery_deadline}</b></td>
                      <td>
                        <a
                          href={`http://localhost:8000${po.pdf_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary"
                          style={{ fontSize: '12px', padding: '4px 10px', height: 'auto', textDecoration: 'none', backgroundColor: '#059669' }}
                        >
                          <Download size={14} /> Download Official PO PDF
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
        {/* VIEW MODE 2: HERO LIVE AUCTION ROOM (Focused Screen) */}
        {/* ---------------------------------------------------- */}
        {viewMode === 'ROOM' && auctionDetail && (
          <div>
            {/* Top Back Navigation Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setViewMode('GRID')}>
                <ArrowLeft size={16} /> Back to Auctions
              </button>
              <div className={`badge ${isAuctionClosed ? 'badge-high-risk' : 'badge-completed'}`} style={{ padding: '6px 14px' }}>
                {isAuctionClosed ? (
                  <>
                    <Lock size={14} /> AUCTION CLOSED / READ-ONLY
                  </>
                ) : (
                  <>
                    <div className="pulse-dot" style={{ width: '8px', height: '8px' }}></div> LIVE AUCTION IN PROGRESS
                  </>
                )}
              </div>
            </div>

            {/* Read-Only Banner for Closed Auctions */}
            {isAuctionClosed && (
              <div style={{ padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '12px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <Lock size={18} />
                <span>This auction has ended ({auctionDetail.status.toUpperCase()}). All bidding controls are disabled.</span>
              </div>
            )}

            {/* 1. TOP HERO STATUS SUMMARY CARD */}
            <div className="card" style={{ background: '#FFFFFF', border: '2px solid #0F172A', boxShadow: 'var(--shadow-hover)', marginBottom: '24px' }}>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span className="badge badge-live" style={{ fontSize: '11px', marginBottom: '4px' }}>{auctionDetail.category}</span>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A' }}>{auctionDetail.title}</h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Time Remaining</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '26px', fontWeight: '800', color: isAuctionClosed ? '#94A3B8' : auctionDetail.time_remaining_seconds < 60 ? '#DC2626' : '#0F172A' }}>
                    <Clock size={20} style={{ display: 'inline', marginRight: '6px' }} />
                    {isAuctionClosed ? '00m 00s (Ended)' : `${Math.floor(auctionDetail.time_remaining_seconds / 60)}m ${auctionDetail.time_remaining_seconds % 60}s`}
                  </div>
                </div>
              </div>

              {/* 4 Metrics Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Target Budget</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>{formatINR(auctionDetail.max_budget)}</div>
                </div>

                <div style={{ background: '#ECFDF5', padding: '14px', borderRadius: '12px', border: '1px solid #86EFAC' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#065F46', textTransform: 'uppercase' }}>Current Lowest Bid</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669' }}>{formatINR(lowestBidPrice)}</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Your Current Bid</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: myBid ? '#0F172A' : '#94A3B8' }}>
                    {myBid ? formatINR(myBid.price) : 'No Bid Yet'}
                  </div>
                </div>

                <div style={{ background: myBid?.rank === 1 ? '#ECFDF5' : '#FEF3C7', padding: '14px', borderRadius: '12px', border: myBid?.rank === 1 ? '1px solid #86EFAC' : '1px solid #FDE68A' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: myBid?.rank === 1 ? '#065F46' : '#92400E', textTransform: 'uppercase' }}>Your Rank</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: myBid?.rank === 1 ? '#059669' : '#D97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {myBid?.rank === 1 ? '🥇 #1 Winner' : myBid ? `🥈 #${myBid.rank}` : 'Not Ranked'}
                    <span style={{ fontSize: '11px', fontWeight: '700' }}>{rankShiftMessage}</span>
                  </div>
                </div>
              </div>
            </div>


            {/* 2. LIVE LEADERBOARD CARD */}
            <div className="table-container" style={{ marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2>Live Bidding Leaderboard</h2>
                  <p className="text-muted">Click any vendor name to view verified performance profile dossier</p>
                </div>
                <span className="badge badge-live">Total Bids: {auctionDetail.total_bids}</span>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Vendor Company</th>
                    <th>Bid Price (₹)</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auctionDetail.leaderboard.map((b) => (
                    <tr key={b.bid_id} style={{ background: b.vendor_name === vendorName ? '#ECFDF5' : 'transparent' }}>
                      <td>
                        <b style={{ color: b.rank === 1 ? '#059669' : '#0F172A', fontSize: '16px' }}>
                          {b.rank === 1 ? '🥇 #1' : b.rank === 2 ? '🥈 #2' : b.rank === 3 ? '🥉 #3' : `#${b.rank}`}
                        </b>
                      </td>
                      <td>
                        <b
                          onClick={() => setSelectedVendorForProfile(b.vendor_name)}
                          style={{ color: '#0F172A', cursor: 'pointer', textDecoration: 'underline' }}
                          title="Click to view Vendor Profile Dossier"
                        >
                          {b.vendor_name}
                        </b> {b.vendor_name === vendorName && <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>(YOU)</span>}
                      </td>
                      <td><b style={{ fontSize: '16px' }}>{formatINR(b.price)}</b></td>
                      <td className="text-muted">{new Date(b.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


            {/* 3. FULL-WIDTH RESPONSIVE BIDDING CONTROLS */}
            <div className="card" style={{ marginBottom: '24px', opacity: isAuctionClosed ? 0.6 : 1, pointerEvents: isAuctionClosed ? 'none' : 'auto' }}>
              <h2 style={{ marginBottom: '6px' }}>Your Bidding Controls</h2>
              <p className="text-muted" style={{ marginBottom: '16px' }}>
                {isAuctionClosed ? "Bidding is closed for this auction." : "Select a quick drop or enter a custom counter-bid"}
              </p>

              {/* Quick Bid Buttons Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                {quickBids.map((qb, i) => {
                  const targetPrice = Math.max(1000, lowestBidPrice - qb.val);
                  return (
                    <button
                      key={i}
                      type="button"
                      className="btn btn-secondary"
                      disabled={isAuctionClosed || submitting}
                      style={{ width: '100%', height: '44px', fontSize: '14px', fontWeight: '700', backgroundColor: '#F8FAFC' }}
                      onClick={() => handleSubmitBid(targetPrice)}
                    >
                      {qb.label} ({formatINR(targetPrice)})
                    </button>
                  );
                })}
              </div>

              {/* Custom Bid Input Row */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  className="form-control"
                  disabled={isAuctionClosed || submitting}
                  style={{ flex: 1, minWidth: '200px', height: '44px', fontSize: '15px' }}
                  placeholder={isAuctionClosed ? "Auction Closed" : `Enter Custom Bid (e.g. ${suggestedCounterBid})`}
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  disabled={isAuctionClosed || submitting}
                  style={{ height: '44px', padding: '0 24px', backgroundColor: isAuctionClosed ? '#94A3B8' : '#059669', fontSize: '14px' }}
                  onClick={() => handleSubmitBid()}
                >
                  <ArrowDownRight size={18} /> Submit Counter-Bid
                </button>
              </div>
            </div>


            {/* 4. AI BIDDING ASSISTANT CARD (PROJECTIONS) */}
            <div className="card" style={{ background: '#FFFFFF', border: '2px solid #059669', boxShadow: 'var(--shadow-md)', marginBottom: '24px' }}>
              <div className="card-header-bar" style={{ background: '#ECFDF5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
                  <Zap size={20} />
                  <h3 style={{ color: '#065F46' }}>AI Bidding Assistant Projections</h3>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Suggested Counter Bid</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                    {formatINR(suggestedCounterBid)}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Projected Rank</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>
                    🥇 {projectedRank} Position
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Estimated AI Score</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                    {projectedAIScore} Match
                  </div>
                </div>
              </div>

              {!isAuctionClosed && (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', backgroundColor: '#059669', height: '40px', fontSize: '13px' }}
                  onClick={() => handleSubmitBid(suggestedCounterBid)}
                >
                  Apply AI Suggested Bid ({formatINR(suggestedCounterBid)}) →
                </button>
              )}
            </div>


            {/* 5. LIVE ACTIVITY FEED LOG */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>Live Activity Feed</h2>
                <span className="badge badge-completed">
                  <div className="pulse-dot" style={{ width: '8px', height: '8px' }}></div> LIVE TICKER
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {auctionDetail.live_feed?.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      background: idx === 0 ? '#ECFDF5' : '#F8FAFC',
                      border: idx === 0 ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                      borderRadius: '10px',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={15} color="#059669" />
                      <span style={{ fontWeight: idx === 0 ? '700' : '500', color: '#0F172A' }}>{item.text}</span>
                    </div>
                    <span className="text-muted" style={{ fontSize: '11px' }}>{item.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
