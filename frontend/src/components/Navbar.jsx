import React from 'react';
import { ShieldCheck, UserCheck, Gavel, Cpu } from 'lucide-react';

export function Navbar({ activePortal, setActivePortal, state }) {
  return (
    <nav className="glass-panel nav-header" style={{ margin: '16px', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActivePortal('BUYER')}>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Cpu size={20} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }} className="gradient-text">ReBid AI</h1>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>Enterprise Reverse Procurement</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActivePortal('BUYER')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activePortal === 'BUYER' ? 'var(--accent-cyan)' : 'transparent',
            color: activePortal === 'BUYER' ? 'white' : '#94a3b8',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <Gavel size={16} /> Buyer Portal
        </button>

        <button
          onClick={() => setActivePortal('VENDOR')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activePortal === 'VENDOR' ? 'var(--accent-indigo)' : 'transparent',
            color: activePortal === 'VENDOR' ? 'white' : '#94a3b8',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <UserCheck size={16} /> Vendor Portal
        </button>

        <button
          onClick={() => setActivePortal('ADMIN')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activePortal === 'ADMIN' ? 'var(--accent-amber)' : 'transparent',
            color: activePortal === 'ADMIN' ? '#0f172a' : '#94a3b8',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <ShieldCheck size={16} /> Admin Portal
        </button>
      </div>
    </nav>
  );
}
