import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BuyerLogin } from './pages/buyer/BuyerLogin';
import { BuyerDashboard } from './pages/buyer/BuyerDashboard';
import { VendorLogin } from './pages/vendor/VendorLogin';
import { VendorDashboard } from './pages/vendor/VendorDashboard';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ShoppingBag, Truck, ShieldCheck, ArrowRight } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
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

  // Router logic
  if (path.startsWith('/buyer/login')) {
    return <BuyerLogin onLoginSuccess={() => navigate('/buyer')} />;
  }

  if (path.startsWith('/buyer')) {
    if (!user || user.role !== 'BUYER') {
      return <BuyerLogin onLoginSuccess={() => navigate('/buyer')} />;
    }
    return <BuyerDashboard />;
  }

  if (path.startsWith('/vendor/login')) {
    return <VendorLogin onLoginSuccess={() => navigate('/vendor')} />;
  }

  if (path.startsWith('/vendor')) {
    if (!user || user.role !== 'VENDOR') {
      return <VendorLogin onLoginSuccess={() => navigate('/vendor')} />;
    }
    return <VendorDashboard />;
  }

  if (path.startsWith('/admin/login')) {
    return <AdminLogin onLoginSuccess={() => navigate('/admin')} />;
  }

  if (path.startsWith('/admin')) {
    if (!user || user.role !== 'ADMIN') {
      return <AdminLogin onLoginSuccess={() => navigate('/admin')} />;
    }
    return <AdminDashboard />;
  }

  // Default Landing / Portal Dispatcher Page
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
        {/* Buyer Portal Card */}
        <div className="card" style={{ textAlign: 'center', padding: '32px 24px', cursor: 'pointer', transition: 'transform 0.15s ease' }} onClick={() => navigate('/buyer/login')}>
          <div style={{ width: '56px', height: '56px', backgroundColor: '#111827', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#FFF' }}>
            <ShoppingBag size={28} />
          </div>
          <h2>Buyer Portal</h2>
          <p className="text-muted" style={{ margin: '8px 0 16px 0' }}>Create auctions, set priority weights, view live leaderboard & AI recommendations</p>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            Enter Buyer Portal <ArrowRight size={16} />
          </button>
        </div>

        {/* Vendor Portal Card */}
        <div className="card" style={{ textAlign: 'center', padding: '32px 24px', cursor: 'pointer', transition: 'transform 0.15s ease' }} onClick={() => navigate('/vendor/login')}>
          <div style={{ width: '56px', height: '56px', backgroundColor: '#059669', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#FFF' }}>
            <Truck size={28} />
          </div>
          <h2>Vendor Portal</h2>
          <p className="text-muted" style={{ margin: '8px 0 16px 0' }}>Participate in category reverse auctions, view live rank & suggested bids</p>
          <button className="btn btn-primary" style={{ width: '100%', backgroundColor: '#059669' }}>
            Enter Vendor Portal <ArrowRight size={16} />
          </button>
        </div>

        {/* Admin Portal Card */}
        <div className="card" style={{ textAlign: 'center', padding: '32px 24px', cursor: 'pointer', transition: 'transform 0.15s ease' }} onClick={() => navigate('/admin/login')}>
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
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
