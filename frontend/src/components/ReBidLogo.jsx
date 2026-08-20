import React from 'react';

/**
 * ReBid Logo Component
 * High-fidelity brand logo: Circular dual-orbit arrows enclosing a partnership handshake & ascending bar chart.
 * Sizes: sm (28px), md (36px), lg (48px), xl (64px)
 * Variants: dark (dark text), light (white text), icon-only (glyph only)
 */
export function ReBidLogo({ size = 'md', variant = 'dark', subtitle = null, style = {} }) {
  const sizes = {
    sm:  { icon: 28, fontSize: '15px', subFontSize: '9px',  gap: '8px'  },
    md:  { icon: 38, fontSize: '19px', subFontSize: '10px', gap: '10px' },
    lg:  { icon: 50, fontSize: '24px', subFontSize: '11px', gap: '12px' },
    xl:  { icon: 68, fontSize: '32px', subFontSize: '12px', gap: '14px' }
  };

  const s = sizes[size] || sizes.md;
  const textColor = variant === 'light' ? '#FFFFFF' : '#0F172A';
  const subColor  = variant === 'light' ? 'rgba(255,255,255,0.7)' : '#64748B';

  const iconSize = s.icon;
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: s.gap, ...style }}>
      {/* Brand Icon SVG */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 4px rgba(37,99,235,0.15))' }}
      >
        <defs>
          <linearGradient id={`arrowTop-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id={`arrowBottom-${uniqueId}`} x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id={`handGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          <linearGradient id={`barGrad-${uniqueId}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>
        </defs>

        {/* Top-Right Circular Arrow (Clockwise sweep) */}
        <path
          d="M 28 42 C 34 22, 54 12, 75 14 C 92 16, 106 28, 108 45"
          stroke={`url(#arrowTop-${uniqueId})`}
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        {/* Top-Right Arrowhead */}
        <polygon
          points="98,34 116,50 114,28"
          fill="#7C3AED"
        />

        {/* Bottom-Left Circular Arrow (Clockwise sweep) */}
        <path
          d="M 92 78 C 86 98, 66 108, 45 106 C 28 104, 14 92, 12 75"
          stroke={`url(#arrowBottom-${uniqueId})`}
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        {/* Bottom-Left Arrowhead */}
        <polygon
          points="22,86 4,70 6,92"
          fill="#2563EB"
        />

        {/* 3 Ascending Bar Chart Columns (Vibrant Purple) */}
        {/* Left Bar (Small) */}
        <rect x="44" y="44" width="7" height="12" rx="1.5" fill={`url(#barGrad-${uniqueId})`} />
        {/* Middle Bar (Medium) */}
        <rect x="54" y="36" width="7" height="20" rx="1.5" fill={`url(#barGrad-${uniqueId})`} />
        {/* Right Bar (Tall) */}
        <rect x="64" y="28" width="7" height="28" rx="1.5" fill={`url(#barGrad-${uniqueId})`} />

        {/* Center Handshake Graphic */}
        {/* Left Arm & Sleeve */}
        <path
          d="M 28 68 L 44 54 C 47 51, 52 52, 55 55 L 61 61"
          stroke="#1E40AF"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Right Arm & Sleeve */}
        <path
          d="M 92 68 L 76 54 C 73 51, 68 52, 65 55 L 59 61"
          stroke="#1D4ED8"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Hand Clasp & Fingers */}
        <path
          d="M 46 64 C 46 64, 52 70, 60 70 C 68 70, 74 64, 74 64 L 68 76 C 64 80, 56 80, 52 76 Z"
          fill="#1E3A8A"
        />
        <path
          d="M 44 68 C 47 72, 53 75, 60 75 C 67 75, 73 72, 76 68"
          stroke="#2563EB"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="53" cy="74" r="2" fill="#1D4ED8" />
        <circle cx="60" cy="75" r="2" fill="#1D4ED8" />
        <circle cx="67" cy="74" r="2" fill="#1D4ED8" />
      </svg>

      {/* Brand Text */}
      {variant !== 'icon-only' && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{
              fontSize: s.fontSize,
              fontWeight: '900',
              color: textColor,
              letterSpacing: '-0.03em',
              fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif"
            }}>
              ReBid
            </span>
            <span style={{
              fontSize: `calc(${s.fontSize} * 0.75)`,
              fontWeight: '800',
              background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.01em'
            }}>
              AI
            </span>
          </div>
          {subtitle && (
            <span style={{
              fontSize: s.subFontSize,
              fontWeight: '700',
              color: subColor,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginTop: '3px'
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
