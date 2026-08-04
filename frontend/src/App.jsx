import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Navbar } from './components/Navbar';
import { BuyerDashboard } from './pages/BuyerDashboard';
import { VendorDashboard } from './pages/VendorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

const API_BASE = 'http://localhost:8000/api';

export function App() {
  const [activePortal, setActivePortal] = useState('BUYER');
  const [state, setState] = useState({
    auctions: [],
    bids: [],
    verified_vendors: [],
    pending_vendors: [],
    fraud_alerts: [],
    audit_logs: []
  });

  const fetchState = async () => {
    try {
      const res = await axios.get(`${API_BASE}/state`);
      setState(res.data);
    } catch (err) {
      console.error("Error fetching state:", err);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000); // 2s live polling auto refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f17' }}>
      <Navbar activePortal={activePortal} setActivePortal={setActivePortal} state={state} />

      {activePortal === 'BUYER' && <BuyerDashboard state={state} refreshState={fetchState} />}
      {activePortal === 'VENDOR' && <VendorDashboard state={state} refreshState={fetchState} />}
      {activePortal === 'ADMIN' && <AdminDashboard state={state} refreshState={fetchState} />}
    </div>
  );
}

export default App;
