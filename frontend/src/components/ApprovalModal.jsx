import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

export function ApprovalModal({ isOpen, onClose, onConfirm, vendorName, action, loading }) {
  if (!isOpen) return null;

  const isApprove = action === 'approve';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '480px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'slideIn 0.3s ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            backgroundColor: isApprove ? '#D1FAE5' : '#FEE2E2',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isApprove ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            ) : (
              <AlertCircle size={28} color="#DC2626" />
            )}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} color="#94A3B8" />
          </button>
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', marginBottom: '12px' }}>
          {isApprove ? 'Approve Vendor?' : 'Reject Vendor Application?'}
        </h2>

        <p style={{ fontSize: '15px', color: '#64748B', lineHeight: '1.6', marginBottom: '24px' }}>
          {isApprove ? (
            <>
              You are about to approve <strong style={{ color: '#0F172A' }}>{vendorName}</strong> as a verified vendor.
              They will be able to participate in procurement auctions.
            </>
          ) : (
            <>
              This vendor will not be allowed to proceed with procurement activities.
              <strong style={{ color: '#0F172A' }}> {vendorName}</strong> will receive a rejection notification.
            </>
          )}
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              color: '#0F172A',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: loading 
                ? '#94A3B8' 
                : isApprove ? '#059669' : '#DC2626',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              color: '#FFFFFF',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <>
                <Loader size={18} className="spin" />
                Processing...
              </>
            ) : (
              <>
                {isApprove ? 'Approve Vendor' : 'Reject Application'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Loader({ size, className }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      className={className}
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
  );
}
