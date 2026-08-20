import React from 'react';

/**
 * ReBid Logo Component
 * Circular arrows with handshake & bar chart icon, matching the brand logo.
 * Sizes: sm (24px), md (32px), lg (44px), xl (64px)
 * Variants: dark (dark text), light (white text), icon-only
 */
export function ReBidLogo({ size = 'md', variant = 'dark', subtitle = null, style = {} }) {
  const sizes = {
    sm:  { icon: 28, fontSize: '15px', subFontSize: '9px',  gap: '8px'  },
    md:  { icon: 36, fontSize: '18px', subFontSize: '10px', gap: '10px' },
    lg:  { icon: 48, fontSize: '24px', subFontSize: '11px', gap: '12px' },
    xl:  { icon: 64, fontSize: '32px', subFontSize: '12px', gap: '16px' }
  };

  const s = sizes[size] || sizes.md;
  const textColor = variant === 'light' ? '#FFFFFF' : '#0F172A';
  const subColor  = variant === 'light' ? 'rgba(255,255,255,0.65)' : '#64748B';

  const iconSize = s.icon;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s.gap, ...style }}>
      {/* Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="rbArrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="rbHandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
          <linearGradient id="rbBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>

        {/* Outer circular arrow - top arc (blue, clockwise) */}
        <path
          d="M 50 8 A 42 42 0 0 1 88 38"
          stroke="url(#rbArrowGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        {/* Arrow tip - top right */}
        <polygon
          points="88,28 96,42 80,40"
          fill="#2563EB"
        />

        {/* Outer circular arrow - bottom arc (purple, clockwise) */}
        <path
          d="M 50 92 A 42 42 0 0 1 12 62"
          stroke="url(#rbArrowGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        {/* Arrow tip - bottom left */}
        <polygon
          points="12,72 4,58 20,60"
          fill="#7C3AED"
        />

        {/* Handshake */}
        {/* Left hand */}
        <path
          d="M 20 56 C 20 56 28 48 36 48 L 44 48 L 48 52 L 40 52 C 40 52 38 54 42 56 L 52 56 L 60 50"
          stroke="url(#rbHandGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Right hand */}
        <path
          d="M 80 56 C 80 56 72 48 64 48 L 56 48 L 52 52 L 60 52 C 60 52 62 54 58 56 L 48 56 L 40 50"
          stroke="url(#rbHandGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Grip/clasp center */}
        <ellipse cx="50" cy="54" rx="8" ry="5" fill="url(#rbHandGrad)" opacity="0.85" />

        {/* Bar chart - above handshake */}
        <rect x="36" y="34" width="6" height="12" rx="2" fill="url(#rbBarGrad)" />
        <rect x="45" y="28" width="6" height="18" rx="2" fill="url(#rbBarGrad)" />
        <rect x="54" y="32" width="6" height="14" rx="2" fill="url(#rbBarGrad)" />
      </svg>

      {/* Text (hidden in icon-only mode) */}
      {variant !== 'icon-only' && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{
            fontSize: s.fontSize,
            fontWeight: '900',
            color: textColor,
            letterSpacing: '-0.03em',
            fontFamily: "'Inter', 'Segoe UI', sans-serif"
          }}>
            ReBid
          </span>
          {subtitle && (
            <span style={{
              fontSize: s.subFontSize,
              fontWeight: '700',
              color: subColor,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: '2px'
            }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ReBidLogo;
