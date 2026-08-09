import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';

export function UnderReview() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F9FAFB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        padding: '48px 40px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#FEF3C7',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Clock size={40} color="#D97706" />
        </div>

        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '800', 
          color: '#0F172A', 
          marginBottom: '12px' 
        }}>
          Application Under Review
        </h1>

        <p style={{ 
          fontSize: '16px', 
          color: '#64748B', 
          lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          Your account application has been submitted and is currently being reviewed by our compliance team. 
          You will receive an email notification once your account has been approved.
        </p>

        <div style={{
          padding: '20px',
          backgroundColor: '#F8FAFC',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '12px' }}>
            What happens next?
          </h3>
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '12px' }}>
            <CheckCircle size={16} color="#059669" style={{ marginTop: '2px' }} />
            <p style={{ fontSize: '14px', color: '#64748B', textAlign: 'left' }}>
              Our team will review your submitted documents within 1-2 business days
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '12px' }}>
            <CheckCircle size={16} color="#059669" style={{ marginTop: '2px' }} />
            <p style={{ fontSize: '14px', color: '#64748B', textAlign: 'left' }}>
              You'll receive an email once your account is approved
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
            <CheckCircle size={16} color="#059669" style={{ marginTop: '2px' }} />
            <p style={{ fontSize: '14px', color: '#64748B', textAlign: 'left' }}>
              If any documents need clarification, we'll reach out via email
            </p>
          </div>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>
            Have questions? Contact support@rebid.ai
          </p>
          <a 
            href="/auth/login" 
            style={{
              display: 'inline-block',
              marginTop: '16px',
              padding: '12px 24px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Try Logging In Again
          </a>
        </div>
      </div>
    </div>
  );
}
