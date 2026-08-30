import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { Navigation } from '../../components/Navigation';
import { VendorProfileModal } from '../../components/VendorProfileModal';
import { BuyerProfileModal } from '../../components/BuyerProfileModal';
import { ProfileView } from '../../components/ProfileView';
import { SettingsView } from '../../components/SettingsView';
import { formatINR } from '../../utils/formatters';
import { Truck, ArrowLeft, ArrowDownRight, Lightbulb, RefreshCw, CheckCircle, Star, Users, ChevronDown, Zap, ShieldCheck, Lock, AlertCircle, Clock, TrendingUp, TrendingDown, Info, Award, Download, Sparkles, PartyPopper } from 'lucide-react';

const API_BASE = 'http://localhost:8001/api';

export function VendorDashboard() {
  const { user, token } = useAuth();
  const { showSuccess, showError } = useModal();

  const [activeTab, setActiveTab] = useState('BIDROOM');
  const [viewMode, setViewMode] = useState('GRID');
  const [auctions, setAuctions] = useState([]);
  const [awardedContracts, setAwardedContracts] = useState([]);
  const [selectedAuctionId, setSelectedAuctionId] = useState(null);
  const [auctionDetail, setAuctionDetail] = useState(null);
  const [bidPrice, setBidPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingAuctions, setLoadingAuctions] = useState(false);

  const [selectedVendorForProfile, setSelectedVendorForProfile] = useState(null);
  const [selectedBuyerForProfile, setSelectedBuyerForProfile] = useState(null);

  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };
  
  const prevRankRef = useRef(null);
  const [rankShiftMessage, setRankShiftMessage] = useState('');

  const vendorName = user?.name || 'Vendor';

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
    const interval = setInterval(() => {
      fetchAuctions();
      fetchAwardedContracts();
    }, 6000);
    return () => clearInterval(interval);
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
    prevRankRef.current = null;
    setRankShiftMessage('');
    setViewMode('ROOM');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentLeaderboard = auctionDetail?.leaderboard || [];
  const myBid = currentLeaderboard.find(b => b.vendor_name === vendorName || b.vendor_id === user?.vendor_id);
  const lowestBidPrice = auctionDetail?.lowest_bid || auctionDetail?.max_budget || 0;

  const isAuctionClosed = auctionDetail && auctionDetail.status !== 'live';

  const suggestedCounterBid = Math.max(1000, lowestBidPrice - 25000);
  const projectedRank = "#1";
  const projectedAIScore = "95%";

  const quickBids = [
    { label: '-₹25,000 Drop', val: 25000 },
    { label: '-₹50,000 Drop', val: 50000 },
    { label: '-₹1,00,000 Drop', val: 100000 }
  ];

  const handleSubmitBid = async (priceToSubmit) => {
    if (!selectedAuctionId) return;
    if (isAuctionClosed) {
      showError('Auction Closed', "This auction has ended and is closed for bidding.");
      return;
    }

    const finalPrice = parseFloat(priceToSubmit || bidPrice);
    if (!finalPrice || isNaN(finalPrice)) {
      showError('Invalid Bid', "Please enter a valid bid price");
      return;
    }

    setSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_BASE}/bids`, {
        auction_id: selectedAuctionId,
        price: finalPrice
      }, { headers });

      showSuccess('Bid Submitted!', `Bid of ${formatINR(finalPrice)} submitted successfully!`);
      setBidPrice('');
      fetchAuctionDetail();
    } catch (err) {
      showError('Bid Failed', err.response?.data?.detail || "Failed submitting bid");
    } finally {
      setSubmitting(false);
    }
  };

  const latestAward = awardedContracts.length > 0 ? awardedContracts[0] : null;

  return (
    <div className="app-container">
      <VendorProfileModal
        vendorIdentifier={selectedVendorForProfile}
        onClose={() => setSelectedVendorForProfile(null)}
      />
      <BuyerProfileModal
        buyerIdentifier={selectedBuyerForProfile}
        onClose={() => setSelectedBuyerForProfile(null)}
      />

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast-item" style={{ background: t.type === 'info' ? '#0F172A' : '#059669' }}>
            <CheckCircle size={16} />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      <Navigation activePortal="VENDOR" activeItem={activeTab} onSelectTab={(tab) => { setActiveTab(tab); setViewMode('GRID'); }} />

      <main className="content-area">

        {/* Profile View */}
        {activeTab === 'PROFILE' && <ProfileView role="VENDOR" />}

        {/* Settings View */}
        {activeTab === 'SETTINGS' && <SettingsView role="VENDOR" />}

        {viewMode === 'GRID' && activeTab === 'BIDROOM' && (
          <>
            <div className="top-header">
              <div>
                <h1>Active Auctions</h1>
                <p className="text-muted">Select an auction below to enter the live bidding room</p>
              </div>
              <button className="btn btn-secondary" onClick={fetchAuctions} disabled={loadingAuctions}>
                <RefreshCw size={15} className={loadingAuctions ? 'spin' : ''} />
                {loadingAuctions ? 'Refreshing...' : 'Refresh Auctions'}
              </button>
            </div>

            <div style={{
              background: '#F0FDF4',
              border: '1px solid #86EFAC',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={24} color="#059669" />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#166534' }}>
                    🎉 Vendor Account Approved & Verified!
                  </div>
                  <div style={{ fontSize: '13px', color: '#15803D' }}>
                    Your business documents have been verified by Admin. You are authorized to participate in live procurement auctions.
                  </div>
                </div>
              </div>
              <span className="badge badge-completed" style={{ padding: '6px 12px', fontSize: '12px' }}>
                <ShieldCheck size={14} /> ACTIVE VENDOR
              </span>
            </div>

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
                    href={`http://localhost:8001${latestAward.pdf_url}`}
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
                      <span>Logged in as: <b>{user?.email}</b></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                      No awarded contracts found for your vendor account. Win live auctions to receive official Purchase Orders.
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
                          onClick={() => setSelectedBuyerForProfile(po.buyer_name)}
                          style={{ color: '#0F172A', cursor: 'pointer', textDecoration: 'underline' }}
                          title="Click to view Buyer Profile"
                        >
                          {po.buyer_name}
                        </b>
                      </td>
                      <td><b style={{ color: '#059669', fontSize: '15px' }}>{formatINR(po.amount)}</b></td>
                      <td><b style={{ color: '#0F172A' }}>{po.delivery_deadline}</b></td>
                      <td>
                        <a
                          href={`http://localhost:8001${po.pdf_url}`}
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


        {viewMode === 'ROOM' && auctionDetail && (
          <div>
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

            {isAuctionClosed && (
              <div style={{ padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '12px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <Lock size={18} />
                <span>This auction has ended ({auctionDetail.status.toUpperCase()}). All bidding controls are disabled.</span>
              </div>
            )}

            <div className="card" style={{ background: '#FFFFFF', border: '2px solid #0F172A', boxShadow: 'var(--shadow-hover)', marginBottom: '24px' }}>
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span className="badge badge-live" style={{ fontSize: '11px', marginBottom: '4px' }}>{auctionDetail.category}</span>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A' }}>{auctionDetail.title}</h1>
                  {auctionDetail.buyer_name && (
                    <p className="text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                      Posted by{' '}
                      <b
                        onClick={() => setSelectedBuyerForProfile(auctionDetail.buyer_name)}
                        style={{ color: '#0F172A', cursor: 'pointer', textDecoration: 'underline' }}
                        title="Click to view Buyer Profile"
                      >
                        {auctionDetail.buyer_name}
                      </b>
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', fontWeight: '700' }}>Time Remaining</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '26px', fontWeight: '800', color: isAuctionClosed ? '#94A3B8' : auctionDetail.time_remaining_seconds < 60 ? '#DC2626' : '#0F172A' }}>
                    <Clock size={20} style={{ display: 'inline', marginRight: '6px' }} />
                    {isAuctionClosed ? '00m 00s (Ended)' : `${Math.floor(auctionDetail.time_remaining_seconds / 60)}m ${auctionDetail.time_remaining_seconds % 60}s`}
                  </div>
                </div>
              </div>

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


            <div className="card" style={{ marginBottom: '24px', opacity: isAuctionClosed ? 0.6 : 1, pointerEvents: isAuctionClosed ? 'none' : 'auto' }}>
              <h2 style={{ marginBottom: '6px' }}>Your Bidding Controls</h2>
              <p className="text-muted" style={{ marginBottom: '16px' }}>
                {isAuctionClosed ? "Bidding is closed for this auction." : "Select a quick drop or enter a custom counter-bid"}
              </p>

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


            <div className="card" style={{ background: '#FFFFFF', border: '2px solid #059669', boxShadow: 'var(--shadow-md)', marginBottom: '24px' }}>
              <div className="card-header-bar" style={{ background: '#ECFDF5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669' }}>
                  <Zap size={20} />
                  <h3 style={{ color: '#065F46' }}>AI Bidding Assistant Projections</h3>
                </div>
              </div>

              <div className="rb-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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
