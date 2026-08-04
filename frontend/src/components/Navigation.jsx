import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Truck, ShieldCheck, Menu, X, LogOut, ChevronDown, User, CheckCircle, Database, AlertTriangle, FileText, Users } from 'lucide-react';

export function Navigation({ activePortal, activeItem, onSelectTab }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getPortalInfo = () => {
    switch (activePortal) {
      case 'BUYER':
        return { title: 'Buyer Procurement', icon: <ShoppingBag color="#059669" size={20} />, roleLabel: 'BUYER PORTAL' };
      case 'VENDOR':
        return { title: 'Vendor Bidding', icon: <Truck color="#059669" size={20} />, roleLabel: 'VENDOR PORTAL' };
      case 'ADMIN':
        return { title: 'Admin Governance', icon: <ShieldCheck color="#059669" size={20} />, roleLabel: 'ADMIN GOVERNANCE' };
      default:
        return { title: 'ReBid AI', icon: <ShoppingBag color="#059669" size={20} />, roleLabel: 'ENTERPRISE' };
    }
  };

  const portalInfo = getPortalInfo();

  return (
    <>
      {/* Top Mobile Bar (Visible below 1024px) */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '16px', color: '#111827' }}>
            {portalInfo.icon}
            <span>ReBid AI</span>
          </div>
        </div>

        {/* User Profile Badge */}
        <div style={{ position: 'relative' }}>
          <button className="user-profile-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <div className="avatar-badge">{user?.name ? user.name[0].toUpperCase() : 'U'}</div>
            <ChevronDown size={14} color="#6B7280" />
          </button>

          {userMenuOpen && (
            <div className="user-menu-dropdown">
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>{user?.name}</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>{user?.email}</div>
              </div>
              <button className="dropdown-logout-btn" onClick={logout}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar (Desktop Fixed + Mobile Drawer Overlay) */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-sidebar-open' : ''}`}>
        <div>
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <div style={{ width: '32px', height: '32px', backgroundColor: '#059669', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                <ShoppingBag size={18} />
              </div>
              <span>ReBid AI</span>
            </div>
            <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {portalInfo.roleLabel}
            </span>
          </div>

          {/* Sidebar Menu Items */}
          <ul className="sidebar-menu">
            {activePortal === 'BUYER' && (
              <>
                <li className={`sidebar-item ${activeItem === 'AUCTIONS' ? 'active' : ''}`} onClick={() => { onSelectTab('AUCTIONS'); setMobileOpen(false); }}>
                  <ShoppingBag size={18} />
                  <span>Procurement Auctions</span>
                </li>
              </>
            )}

            {activePortal === 'VENDOR' && (
              <>
                <li className={`sidebar-item ${activeItem === 'BIDROOM' ? 'active' : ''}`} onClick={() => { onSelectTab('BIDROOM'); setMobileOpen(false); }}>
                  <Truck size={18} />
                  <span>Live Bidding Room</span>
                </li>
              </>
            )}

            {activePortal === 'ADMIN' && (
              <>
                <li className={`sidebar-item ${activeItem === 'PENDING_AUCTIONS' ? 'active' : ''}`} onClick={() => { onSelectTab('PENDING_AUCTIONS'); setMobileOpen(false); }}>
                  <CheckCircle size={18} />
                  <span>Procurement Approvals</span>
                </li>
                <li className={`sidebar-item ${activeItem === 'DATASET' ? 'active' : ''}`} onClick={() => { onSelectTab('DATASET'); setMobileOpen(false); }}>
                  <Database size={18} />
                  <span>500+ Vendor Directory</span>
                </li>
                <li className={`sidebar-item ${activeItem === 'FRAUD' ? 'active' : ''}`} onClick={() => { onSelectTab('FRAUD'); setMobileOpen(false); }}>
                  <AlertTriangle size={18} />
                  <span>Fraud Detection Alerts</span>
                </li>
                <li className={`sidebar-item ${activeItem === 'AUDIT' ? 'active' : ''}`} onClick={() => { onSelectTab('AUDIT'); setMobileOpen(false); }}>
                  <FileText size={18} />
                  <span>System Audit Trail</span>
                </li>
                <li className={`sidebar-item ${activeItem === 'PENDING' ? 'active' : ''}`} onClick={() => { onSelectTab('PENDING'); setMobileOpen(false); }}>
                  <User size={18} />
                  <span>Vendor Verifications</span>
                </li>
                <li className={`sidebar-item ${activeItem === 'USERS' ? 'active' : ''}`} onClick={() => { onSelectTab('USERS'); setMobileOpen(false); }}>
                  <Users size={18} />
                  <span>User Directory</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Sidebar Desktop Profile Footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="avatar-badge" style={{ background: '#374151', color: '#FFF' }}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#FFF', fontWeight: '600', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-ghost" title="Logout" style={{ color: '#9CA3AF', padding: '6px' }}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}
    </>
  );
}
