import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { ReBidLogo } from './components/ReBidLogo';
import { UnifiedLogin } from './pages/UnifiedLogin';
import { RegistrationWizard } from './pages/RegistrationWizard';
import { UnderReview } from './pages/UnderReview';
import { ReuploadDocuments } from './pages/ReuploadDocuments';
import { BuyerDashboard } from './pages/buyer/BuyerDashboard';
import { VendorDashboard } from './pages/vendor/VendorDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DocumentReviewQueue } from './pages/admin/DocumentReviewQueue';
import { ShoppingBag, Truck, ShieldCheck, ArrowRight, LogIn, UserCheck } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, logout } = useAuth();
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newPath) => {
    window.history.pushState({}, '', newPath);
    setPath(window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---------------- AUTH REDIRECT & LOGIN ROUTES ----------------
  if (path === '/auth/login' || path === '/login') {
    // If user is already authenticated and approved, and not explicitly switching accounts with a different role query
    const queryParams = new URLSearchParams(window.location.search);
    const queryRole = queryParams.get('role')?.toUpperCase();
    
    if (isAuthenticated && user?.status === 'approved' && (!queryRole || queryRole === user.role)) {
      if (user.role === 'ADMIN') return <AdminDashboard />;
      if (user.role === 'BUYER') return <BuyerDashboard />;
      if (user.role === 'VENDOR') return <VendorDashboard />;
    }
    return <UnifiedLogin onNavigate={navigate} />;
  }

  if (path === '/auth/register' || path === '/register') {
    return <RegistrationWizard onNavigate={navigate} />;
  }

  if (path === '/auth/under-review') {
    return <UnderReview />;
  }

  if (path === '/auth/re-upload') {
    return <ReuploadDocuments />;
  }

  if (path === '/auth/verify-email' || path === '/auth/upload-documents') {
    return <RegistrationWizard onNavigate={navigate} />;
  }

  if (path === '/auth/rejected') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '440px', backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '16px', border: '1px solid #CBD5E1', boxShadow: 'var(--shadow-lg)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#991B1B', marginBottom: '12px' }}>
            Application Rejected
          </h1>
          <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5' }}>
            Your application did not satisfy compliance verification criteria. Please contact administrative support for feedback or clarification.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => { logout(); navigate('/auth/login'); }}
            style={{ width: '100%' }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ---------------- BUYER PORTAL ROUTES ----------------
  if (path.startsWith('/buyer')) {
    if (user && user.role === 'BUYER') {
      if (user.status === 'pending_approval' || user.status === 'under_review' || user.status === 'pending_documents') {
        return <UnderReview />;
      }
      return <BuyerDashboard />;
    }
    return <UnifiedLogin onNavigate={navigate} />;
  }

  // ---------------- VENDOR PORTAL ROUTES ----------------
  if (path.startsWith('/vendor')) {
    if (user && user.role === 'VENDOR') {
      if (user.status === 'pending_approval' || user.status === 'under_review' || user.status === 'pending_documents') {
        return <UnderReview />;
      }
      return <VendorDashboard />;
    }
    return <UnifiedLogin onNavigate={navigate} />;
  }

  // ---------------- ADMIN PORTAL ROUTES ----------------
  if (path.startsWith('/admin/documents')) {
    if (user && user.role === 'ADMIN') {
      return (
        <div className="app-container">
          <div className="rb-admin-doc-shell" style={{ display: 'flex', width: '100%' }}>
            <div className="rb-admin-doc-sidebar" style={{ width: '240px', backgroundColor: '#0F172A', minHeight: '100vh', padding: '24px 16px', color: '#FFF' }}>
              <ReBidLogo size="md" variant="light" subtitle="Admin Review" style={{ marginBottom: '24px' }} />
              <button
                onClick={() => navigate('/admin')}
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFF', borderColor: 'rgba(255,255,255,0.2)' }}
              >
                ← Back to Dashboard
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '24px', minWidth: 0 }}>
              <DocumentReviewQueue />
            </div>
          </div>
        </div>
      );
    }
    return <UnifiedLogin onNavigate={navigate} />;
  }

  if (path.startsWith('/admin')) {
    if (user && user.role === 'ADMIN') {
      return <AdminDashboard />;
    }
    return <UnifiedLogin onNavigate={navigate} />;
  }

  // ---------------- HOMEPAGE / LANDING PORTAL SELECTOR ----------------
  const handlePortalClick = (targetRole, targetPath) => {
    if (isAuthenticated && user?.status === 'approved' && user.role === targetRole) {
      navigate(targetPath);
    } else {
      navigate(`/auth/login?role=${targetRole}`);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#F8FAFC', 
      padding: '36px 20px' 
    }}>
      {/* Top Brand Hero */}
      <div style={{ textAlign: 'center', maxWidth: '680px', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ReBidLogo size="xl" variant="dark" style={{ marginBottom: '16px' }} />
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A', marginBottom: '0', letterSpacing: '-0.03em' }}>
          Reverse Auction Procurement Platform
        </h1>
      </div>

      {/* 3 Role Portals Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', width: '100%', maxWidth: '920px' }}>
        {/* Buyer Card */}
        <div 
          className="card" 
          style={{ textAlign: 'center', padding: '32px 24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          onClick={() => handlePortalClick('BUYER', '/buyer')}
        >
          <div>
            <div style={{ width: '56px', height: '56px', backgroundColor: '#0F172A', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#FFF' }}>
              <ShoppingBag size={28} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: '#0F172A' }}>Buyer Portal</h2>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', backgroundColor: '#0F172A' }}>
            {isAuthenticated && user?.role === 'BUYER' ? 'Open Buyer Dashboard' : 'Enter Buyer Portal'} <ArrowRight size={16} />
          </button>
        </div>

        {/* Vendor Card */}
        <div 
          className="card" 
          style={{ textAlign: 'center', padding: '32px 24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          onClick={() => handlePortalClick('VENDOR', '/vendor')}
        >
          <div>
            <div style={{ width: '56px', height: '56px', backgroundColor: '#059669', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#FFF' }}>
              <Truck size={28} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: '#0F172A' }}>Vendor Portal</h2>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', backgroundColor: '#059669' }}>
            {isAuthenticated && user?.role === 'VENDOR' ? 'Open Vendor Dashboard' : 'Enter Vendor Portal'} <ArrowRight size={16} />
          </button>
        </div>

        {/* Admin Card */}
        <div 
          className="card" 
          style={{ textAlign: 'center', padding: '32px 24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          onClick={() => handlePortalClick('ADMIN', '/admin')}
        >
          <div>
            <div style={{ width: '56px', height: '56px', backgroundColor: '#0F172A', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#FFF' }}>
              <ShieldCheck size={28} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: '#0F172A' }}>Admin Governance</h2>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', backgroundColor: '#0F172A' }}>
            {isAuthenticated && user?.role === 'ADMIN' ? 'Open Admin Console' : 'Enter Admin Portal'} <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Account Registration Link */}
      <div style={{ marginTop: '36px', textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => navigate('/auth/register')}
          className="btn btn-secondary"
          style={{
            padding: '12px 32px',
            fontSize: '14px',
            fontWeight: '700',
            borderColor: '#CBD5E1',
            color: '#0F172A'
          }}
        >
          Register New Account
        </button>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <AppContent />
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
