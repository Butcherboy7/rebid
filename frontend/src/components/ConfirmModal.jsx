import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Loader } from 'lucide-react';

export function ConfirmModal({ isOpen, title, message, type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const typeStyles = {
    success: {
      bg: '#ECFDF5',
      border: '#059669',
      icon: <CheckCircle size={32} color="#059669" />,
      buttonBg: '#059669',
      buttonHover: '#047857'
    },
    warning: {
      bg: '#FEF3C7',
      border: '#D97706',
      icon: <AlertTriangle size={32} color="#D97706" />,
      buttonBg: '#D97706',
      buttonHover: '#B45309'
    },
    error: {
      bg: '#FEE2E2',
      border: '#DC2626',
      icon: <XCircle size={32} color="#DC2626" />,
      buttonBg: '#DC2626',
      buttonHover: '#B91C1C'
    }
  };

  const style = typeStyles[type] || typeStyles.warning;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.2s ease'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '480px',
        width: '90%',
        overflow: 'hidden',
        transform: visible ? 'scale(1)' : 'scale(0.95)',
        transition: 'transform 0.2s ease'
      }}>
        <div style={{
          padding: '32px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: style.bg,
            border: `2px solid ${style.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            {style.icon}
          </div>

          <h3 style={{
            fontSize: '20px',
            fontWeight: '800',
            color: '#0F172A',
            marginBottom: '12px'
          }}>
            {title}
          </h3>

          <p style={{
            fontSize: '14px',
            color: '#64748B',
            lineHeight: '1.6',
            marginBottom: '28px'
          }}>
            {message}
          </p>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            {cancelText && (
              <button
                onClick={onCancel}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#F8FAFC',
                  color: '#64748B',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: style.buttonBg,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <>
                  <Loader size={16} className="spin" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
