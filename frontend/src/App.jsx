import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UnifiedLogin } from './pages/UnifiedLogin';
import { RegistrationWizard } from './pages/RegistrationWizard';
import { UnderReview } from './pages/UnderReview';
import { ReuploadDocuments } from './pages/ReuploadDocuments';
import { BuyerDashboard } from './pages/buyer/BuyerDashboard';
import { VendorDashboard } from './pages/vendor/VendorDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DocumentReviewQueue } from './pages/admin/DocumentReviewQueue';
import { ShoppingBag, Truck, ShieldCheck, ArrowRight } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newPath) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
  };

  if (path === '/auth/login' || path === '/login') {
    return <UnifiedLogin />;
  }

  if (path === '/auth/register' || path === '/register') {
    return <RegistrationWizard />;
  }

  if (path === '/auth/under-review') {
    return <UnderReview />;
  }

  if (path === '/auth/re-upload') {
    return <ReuploadDocuments />;
  }

  if (path === '/auth/verify-email') {
    return <RegistrationWizard />;
  }

  if (path === '/auth/upload-documents') {
    return <RegistrationWizard />;
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
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#991B1B', marginBottom: '16px' }}>
            Application Rejected
          </h1>
          <p style={{ color: '#64748B', marginBottom: '24px' }}>
            Unfortunately, your application has been rejected. Please contact support for more information.
          </p>
          <a href="/auth/login" style={{ color: '#0F172A', fontWeight: '600' }}>Back to Login</a>
        </div>
      </div>
    );
  }

  if (path.startsWith('/buyer')) {
    if (user && user.role === 'BUYER') {
      if (user.status === 'pending_approval' || user.status === 'under_review' || user.status === 'pending_documents') {
        return <UnderReview />;
      }
      return <BuyerDashboard />;
    }
    return <UnifiedLogin />;
  }

  if (path.startsWith('/vendor')) {
    if (user && user.role === 'VENDOR') {
      if (user.status === 'pending_approval' || user.status === 'under_review' || user.status === 'pending_documents') {
        return <UnderReview />;
      }
      return <VendorDashboard />;
    }
    return <UnifiedLogin />;
  }

  if (path.startsWith('/admin/documents')) {
    if (user && user.role === 'ADMIN') {
      return (
        <div className="app-container">
          <div style={{ display: 'flex' }}>
            <div style={{ width: '250px', backgroundColor: '#F8FAFC', minHeight: '100vh', borderRight: '1px solid #E2E8F0', padding: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Admin Panel</h2>
              <button onClick={() => navigate('/admin')} style={{ marginBottom: '12px', padding: '12px', width: '100%', textAlign: 'left', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '600' }}>← Back to Dashboard</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <DocumentReviewQueue />
            </div>
          </div>
        </div>
      );
    }
    return <UnifiedLogin />;
  }

  if (path.startsWith('/admin')) {
    if (user && user.role === 'ADMIN') {
      return <AdminDashboard />;
    }
    return <UnifiedLogin />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '12px' }}>
          ReBid AI Enterprise Procurement
        </h1>
        <p style={{ fontSize: '16px', color: '#4B5563' }}>
          Live reverse auction bidding platform powered by offline-trained XGBoost recommendation engine & automated governance audit logging.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', width: '100%', maxWidth: '840px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '32px 24px', cursor: 'pointer', transition: 'transform 0.15s ease' }} onClick={() => navigate('/auth/login')}>
          <div style={{ width: '56px', height: '56px', backgroundColor: '#111827', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#FFF' }}>
            <ShoppingBag size={28} />
          </div>
          <h2>Buyer Portal</h2>
          <p className="text-muted" style={{ margin: '8px 0 16px 0' }}>Create auctions, set priority weights, view live leaderboard & AI recommendations</p>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            Enter Buyer Portal <ArrowRight size={16} />
          </button>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '32px 24px', cursor: 'pointer', transition: 'transform 0.15s ease' }} onClick={() => navigate('/auth/login')}>
          <div style={{ width: '56px', height: '56px', backgroundColor: '#059669', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#FFF' }}>
            <Truck size={28} />
          </div>
          <h2>Vendor Portal</h2>
          <p className="text-muted" style={{ margin: '8px 0 16px 0' }}>Participate in category reverse auctions, view live rank & suggested bids</p>
          <button className="btn btn-primary" style={{ width: '100%', backgroundColor: '#059669' }}>
            Enter Vendor Portal <ArrowRight size={16} />
          </button>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '32px 24px', cursor: 'pointer', transition: 'transform 0.15s ease' }} onClick={() => navigate('/auth/login')}>
          <div style={{ width: '56px', height: '56px', backgroundColor: '#111827', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#FFF' }}>
            <ShieldCheck size={28} />
          </div>
          <h2>Admin Portal</h2>
          <p className="text-muted" style={{ margin: '8px 0 16px 0' }}>Verify pending vendor profiles, monitor audit trail logs & fraud detection alerts</p>
          <button className="btn btn-primary" style={{ width: '100%', backgroundColor: '#111827' }}>
            Enter Admin Portal <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '12px' }}>
          New to ReBid AI?
        </p>
        <button
          onClick={() => navigate('/auth/register')}
          style={{
            padding: '12px 32px',
            backgroundColor: '#FFFFFF',
            border: '2px solid #0F172A',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#0F172A',
            cursor: 'pointer'
          }}
        >
          Create an Account
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
