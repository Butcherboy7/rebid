import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ReBidLogo } from './ReBidLogo';
import { 
  ShoppingBag, Truck, ShieldCheck, Menu, X, LogOut, 
  ChevronDown, User, CheckCircle, Database, AlertTriangle, 
  FileText, Users, FileCheck, Award, Settings, Building, 
  Layers, Zap 
} from 'lucide-react';

export function Navigation({ activePortal, activeItem, onSelectTab, vendorCount = null }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <ReBidLogo size="sm" variant="dark" />
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
      <aside className={`sidebar ${mobileOpen ? 'mobile-sidebar-open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header Brand */}
          <div className="sidebar-header">
            <ReBidLogo size="md" variant="light" subtitle={portalInfo.roleLabel} />
          </div>

          {/* Sidebar Menu Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            <ul className="sidebar-menu">
              {/* ---------------- BUYER MENU ---------------- */}
              {activePortal === 'BUYER' && (
                <>
                  <li 
                    className={`sidebar-item ${activeItem === 'AUCTIONS' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('AUCTIONS')}
                  >
                    <ShoppingBag size={18} />
                    <span>Active Procurements</span>
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'AWARDED' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('AWARDED')}
                  >
                    <FileCheck size={18} />
                    <span>Awarded Contracts & POs</span>
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'PROFILE' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('PROFILE')}
                  >
                    <User size={18} />
                    <span>Organization Profile</span>
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'SETTINGS' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('SETTINGS')}
                  >
                    <Settings size={18} />
                    <span>Settings & Security</span>
                  </li>
                </>
              )}

              {/* ---------------- VENDOR MENU ---------------- */}
              {activePortal === 'VENDOR' && (
                <>
                  <li 
                    className={`sidebar-item ${activeItem === 'BIDROOM' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('BIDROOM')}
                  >
                    <Zap size={18} />
                    <span>Live Bidding Room</span>
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'MY_AWARDS' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('MY_AWARDS')}
                  >
                    <Award size={18} />
                    <span>My Awarded Contracts</span>
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'PROFILE' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('PROFILE')}
                  >
                    <Building size={18} />
                    <span>Company Profile</span>
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'SETTINGS' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('SETTINGS')}
                  >
                    <Settings size={18} />
                    <span>Settings & Security</span>
                  </li>
                </>
              )}

              {/* ---------------- ADMIN MENU ---------------- */}
              {activePortal === 'ADMIN' && (
                <>
                  <li 
                    className={`sidebar-item ${activeItem === 'PENDING_AUCTIONS' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('PENDING_AUCTIONS')}
                  >
                    <CheckCircle size={18} />
                    <span>Procurement Approvals</span>
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'DATASET' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('DATASET')}
                  >
                    <Database size={18} />
                    <span>Vendor Directory{vendorCount !== null ? ` (${vendorCount})` : ''}</span>
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'FRAUD' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('FRAUD')}
                  >
                    <AlertTriangle size={18} />
                    <span>Fraud Alerts</span>
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'AUDIT' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('AUDIT')}
                  >
                    <FileText size={18} />
                    <span>Audit Trail</span>
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'PENDING' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('PENDING')}
                  >
                    <ShieldCheck size={18} />
                    <span>Vendor Verifications</span>
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'USERS' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('USERS')}
                  >
                    <Users size={18} />
                    <span>User Directory</span>
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'PROFILE' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('PROFILE')}
                  >
                    <User size={18} />
                    <span>Admin Profile</span>
                  </li>
                  <li 
                    className={`sidebar-item ${activeItem === 'SETTINGS' ? 'active' : ''}`} 
                    onClick={() => handleItemClick('SETTINGS')}
                  >
                    <Settings size={18} />
                    <span>Settings & Security</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Sidebar Desktop Profile Footer */}
          <div className="sidebar-footer">
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              onClick={() => handleItemClick('PROFILE')}
              title="View Profile"
            >
              <div className="avatar-badge" style={{ background: '#374151', color: '#FFF' }}>
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#FFF', fontWeight: '600', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email}
                </div>
              </div>
            </div>
            <button 
              onClick={logout} 
              className="btn btn-ghost" 
              title="Logout" 
              style={{ color: '#9CA3AF', padding: '6px' }}
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
