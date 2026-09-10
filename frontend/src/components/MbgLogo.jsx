import React from 'react';

/**
 * Official MBG (Market Brain Grid) Vector Logo
 * Exact Monogram Tri-Loop with Quantum Emerald & Neon Mint Gradient
 */
export default function MbgLogo({ size = 36, showText = false }) {
  const gradientId = "mbg-triloop-gradient";

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: showText ? '10px' : '0' }}>
      {/* Exact Vector SVG of the Monogram Tri-Loop */}
      <svg
        width={size}
        height={size * 0.62}
        viewBox="0 0 200 124"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 0 8px rgba(0, 208, 132, 0.45))' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D084" />
            <stop offset="50%" stopColor="#00E599" />
            <stop offset="100%" stopColor="#00FF9D" />
          </linearGradient>
        </defs>

        {/* Outer Left Ring (forming M / B base) */}
        <circle
          cx="62"
          cy="62"
          r="48"
          stroke={`url(#${gradientId})`}
          strokeWidth="15"
          strokeLinecap="round"
        />

        {/* Inner Left Concentric Ring */}
        <circle
          cx="62"
          cy="62"
          r="24"
          stroke={`url(#${gradientId})`}
          strokeWidth="11"
          strokeLinecap="round"
        />

        {/* Center S-Curve Interlocking Spine */}
        <path
          d="M 62 14 C 100 14, 100 110, 138 110"
          stroke={`url(#${gradientId})`}
          strokeWidth="15"
          strokeLinecap="round"
        />

        {/* Outer Right Ring (forming G) */}
        <path
          d="M 138 14 C 172 14, 196 38, 196 62 C 196 86, 172 110, 138 110"
          stroke={`url(#${gradientId})`}
          strokeWidth="15"
          strokeLinecap="round"
        />

        {/* Inner Right Ring */}
        <path
          d="M 138 38 C 151 38, 162 49, 162 62 C 162 75, 151 86, 138 86"
          stroke={`url(#${gradientId})`}
          strokeWidth="11"
          strokeLinecap="round"
        />

        {/* G Horizontal Crossbar / Spur */}
        <line
          x1="138"
          y1="62"
          x2="190"
          y2="62"
          stroke={`url(#${gradientId})`}
          strokeWidth="14"
          strokeLinecap="round"
        />
      </svg>

      {/* Accompanying Typography */}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '900',
            letterSpacing: '0.08em',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.1
          }}>
            MBG
          </div>
          <div style={{
            fontSize: '9px',
            fontWeight: '700',
            letterSpacing: '0.06em',
            color: 'var(--accent-green)',
            textTransform: 'uppercase',
            marginTop: '2px',
            lineHeight: 1.1
          }}>
            Market Brain Grid
          </div>
        </div>
      )}
    </div>
  );
}
