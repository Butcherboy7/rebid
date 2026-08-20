import React from 'react';

export function ReBidLogo({ 
  size = 'md', 
  variant = 'dark', 
  subtitle = null, 
  className = '', 
  style = {} 
}) {
  const sizeMap = {
    sm: { icon: 26, text: '16px', subtext: '9px', gap: '8px' },
    md: { icon: 34, text: '20px', subtext: '11px', gap: '10px' },
    lg: { icon: 44, text: '24px', subtext: '12px', gap: '12px' },
    xl: { icon: 58, text: '32px', subtext: '14px', gap: '16px' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isLight = variant === 'light';

  return (
    <div 
      className={`rebid-logo-brand ${className}`}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: currentSize.gap, 
        userSelect: 'none',
        ...style 
      }}
    >
      {/* Precision Vector Emblem */}
      <div 
        style={{ 
          width: `${currentSize.icon}px`, 
          height: `${currentSize.icon}px`, 
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 2px 8px rgba(5, 150, 105, 0.35))'
        }}
      >
        <svg 
          viewBox="0 0 48 48" 
          width={currentSize.icon} 
          height={currentSize.icon} 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="rebid_grad_primary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="rebid_grad_accent" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="rebid_grad_glow" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>

          {/* Background Rounded Diamond Shield */}
          <rect 
            x="4" 
            y="4" 
            width="40" 
            height="40" 
            rx="12" 
            fill="url(#rebid_grad_accent)" 
            stroke="rgba(255,255,255,0.15)" 
            strokeWidth="1.5"
          />

          {/* Reverse Auction Chevron & Dynamic Nodes */}
          <path 
            d="M13 18L24 10L35 18V28L24 38L13 28V18Z" 
            fill="url(#rebid_grad_primary)" 
            fillOpacity="0.85"
          />

          {/* Central Precision Bidding Core */}
          <path 
            d="M24 16L31 22L24 31L17 22L24 16Z" 
            fill="#FFFFFF" 
            fillOpacity="0.95"
          />

          {/* Quantum Arrow Down-Trend (Competitive Price Reduction) */}
          <path 
            d="M24 20V28M24 28L20.5 24.5M24 28L27.5 24.5" 
            stroke="#059669" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />

          {/* Spark Core */}
          <circle cx="24" cy="13" r="2" fill="#34D399" />
          <circle cx="34" cy="23" r="1.5" fill="#38BDF8" />
          <circle cx="14" cy="23" r="1.5" fill="#38BDF8" />
        </svg>
      </div>

      {/* Typography Section (unless icon-only) */}
      {variant !== 'icon-only' && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span 
              style={{ 
                fontSize: currentSize.text, 
                fontWeight: '900', 
                letterSpacing: '-0.03em', 
                color: isLight ? '#FFFFFF' : '#0F172A',
                fontFamily: 'inherit'
              }}
            >
              ReBid
            </span>
            <span 
              style={{ 
                fontSize: currentSize.text, 
                fontWeight: '900', 
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #059669 0%, #0284C7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              AI
            </span>
          </div>

          {subtitle && (
            <span 
              style={{ 
                fontSize: currentSize.subtext, 
                color: isLight ? '#94A3B8' : '#64748B', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em',
                marginTop: '2px'
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ReBidLogo;
