import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ReBidLogo } from './ReBidLogo';
import { 
  ShoppingBag, Truck, ShieldCheck, Menu, X, LogOut, 
  ChevronDown, User, CheckCircle, Database, AlertTriangle, 
  FileText, Users, FileCheck, Award, Settings, Building, 
  Layers, Zap, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

export function Navigation({ activePortal, activeItem, onSelectTab, vendorCount = null }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('rebid_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('rebid_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  const getPortalInfo = () => {
    switch (activePortal) {
      case 'BUYER':
        return { title: 'Buyer Procurement', roleLabel: 'BUYER PORTAL' };
      case 'VENDOR':
        return { title: 'Vendor Bidding', roleLabel: 'VENDOR PORTAL' };
      case 'ADMIN':
        return { title: 'Admin Dashboard', roleLabel: 'ADMIN PORTAL' };
      default:
        return { title: 'ReBid', roleLabel: 'ENTERPRISE' };
    }
  };

  const portalInfo = getPortalInfo();

  const handleItemClick = (itemKey) => {
    onSelectTab(itemKey);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Top Mobile Bar (Visible below 1024px) */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle mobile menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <ReBidLogo size="sm" variant="dark" />
        </div>

        {/* User Profile Badge */}
        <div style={{ position: 'relative' }}>
          <button className="user-profile-btn" onClick={() => setUserMenuOpen(!userMenuOpen)} aria-label="User menu">
            <div className="avatar-badge">{user?.name ? user.name[0].toUpperCase() : 'U'}</div>
            <ChevronDown size={14} color="#6B7280" />
          </button>

          {userMenuOpen && (
            <div className="user-menu-dropdown">
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>{user?.name}</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>{user?.email}</div>
                <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', marginTop: '2px' }}>{portalInfo.roleLabel}</div>
              </div>
              <button className="dropdown-logout-btn" onClick={() => handleItemClick('PROFILE')}>
                <User size={15} /> My Profile
              </button>
              <button className="dropdown-logout-btn" onClick={() => handleItemClick('SETTINGS')}>
                <Settings size={15} /> System Settings
              </button>
              <button className="dropdown-logout-btn" onClick={logout} style={{ color: '#DC2626' }}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar (Desktop Fixed + Mobile Drawer Overlay) */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-sidebar-open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header Brand & Collapse Toggle */}
          <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: collapsed ? '18px 12px' : '20px 16px' }}>
            <div style={{ overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
              {collapsed ? (
                <ReBidLogo size="sm" variant="icon-only" />
              ) : (
                <ReBidLogo size="md" variant="light" subtitle={portalInfo.roleLabel} />
              )}
            </div>
            
            <button 
              type="button"
              onClick={toggleCollapsed} 
              className="sidebar-collapse-toggle desktop-only"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>

          {/* Sidebar Menu Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '12px 6px' : '12px 0' }}>
            <ul className="sidebar-menu" style={{ padding: collapsed ? '0 4px' : '16px 12px' }}>
              {/* ---------------- BUYER MENU ---------------- */}
              {activePortal === 'BUYER' && (
                <>
                  <li 
                    className={`sidebar-item ${activeItem === 'AUCTIONS' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('AUCTIONS')}
                    title="Active Procurements"
                  >
                    <ShoppingBag size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Active Procurements</span>}
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'AWARDED' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('AWARDED')}
                    title="Awarded Contracts & POs"
                  >
                    <FileCheck size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Awarded Contracts & POs</span>}
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'PROFILE' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('PROFILE')}
                    title="Organization Profile"
                  >
                    <User size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Organization Profile</span>}
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'SETTINGS' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('SETTINGS')}
                    title="Settings & Security"
                  >
                    <Settings size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Settings & Security</span>}
                  </li>
                </>
              )}

              {/* ---------------- VENDOR MENU ---------------- */}
              {activePortal === 'VENDOR' && (
                <>
                  <li 
                    className={`sidebar-item ${activeItem === 'BIDROOM' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('BIDROOM')}
                    title="Live Bidding Room"
                  >
                    <Zap size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Live Bidding Room</span>}
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'MY_AWARDS' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('MY_AWARDS')}
                    title="My Awarded Contracts"
                  >
                    <Award size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>My Awarded Contracts</span>}
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'PROFILE' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('PROFILE')}
                    title="Company Profile"
                  >
                    <Building size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Company Profile</span>}
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'SETTINGS' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('SETTINGS')}
                    title="Settings & Security"
                  >
                    <Settings size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Settings & Security</span>}
                  </li>
                </>
              )}

              {/* ---------------- ADMIN MENU ---------------- */}
              {activePortal === 'ADMIN' && (
                <>
                  <li 
                    className={`sidebar-item ${activeItem === 'PENDING_AUCTIONS' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('PENDING_AUCTIONS')}
                    title="Procurement Approvals"
                  >
                    <CheckCircle size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Procurement Approvals</span>}
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'DATASET' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('DATASET')}
                    title={`Vendor Directory${vendorCount !== null ? ` (${vendorCount})` : ''}`}
                  >
                    <Database size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Vendor Directory{vendorCount !== null ? ` (${vendorCount})` : ''}</span>}
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'FRAUD' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('FRAUD')}
                    title="Fraud Alerts"
                  >
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Fraud Alerts</span>}
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'AUDIT' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('AUDIT')}
                    title="Audit Trail"
                  >
                    <FileText size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Audit Trail</span>}
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'PENDING' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('PENDING')}
                    title="Vendor Verifications"
                  >
                    <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Vendor Verifications</span>}
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'USERS' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('USERS')}
                    title="User Directory"
                  >
                    <Users size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>User Directory</span>}
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'PROFILE' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('PROFILE')}
                    title="Admin Profile"
                  >
                    <User size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Admin Profile</span>}
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'SETTINGS' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('SETTINGS')}
                    title="Settings & Security"
                  >
                    <Settings size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>Settings & Security</span>}
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Sidebar Desktop Profile Footer */}
          <div className="sidebar-footer" style={{ padding: collapsed ? '14px 10px' : '16px 16px', flexDirection: collapsed ? 'column' : 'row', gap: collapsed ? '10px' : '6px' }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', overflow: 'hidden' }}
              onClick={() => handleItemClick('PROFILE')}
              title={`View Profile: ${user?.name || 'User'}`}
            >
              <div className="avatar-badge" style={{ background: '#374151', color: '#FFF', flexShrink: 0 }}>
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              {!collapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', color: '#FFF', fontWeight: '600', maxWidth: '115px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name || 'User'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', maxWidth: '115px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={logout} 
              className="btn btn-ghost" 
              title="Logout" 
              style={{ color: '#9CA3AF', padding: '6px', minWidth: 'auto' }}
              aria-label="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}
    </>
  );
}

export default Navigation;
