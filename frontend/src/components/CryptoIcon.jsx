import React, { useState } from 'react';
import { getCryptoBrand, getCryptoIcon, cleanCryptoSymbol } from '../data/crypto-icons.js';

/**
 * Universal Authentic Cryptocurrency Icon Badge
 * - Primary: High-res multi-color SVG/PNG from spothq cryptocurrency icons CDN (Flaticon/Coingecko standard)
 * - Fallback: Inline vector SVG with authentic brand background colors and glyph
 * - Guarantees accurate brand colors (Bitcoin Orange, Ethereum Purple, Solana Teal, etc.)
 */
export default function CryptoIcon({ symbol, size = 18, style = {} }) {
  const [imgError, setImgError] = useState(false);
  const clean = cleanCryptoSymbol(symbol);
  if (!clean) return null;

  const brand = getCryptoBrand(clean);
  const iconPath = getCryptoIcon(clean);
  const cdnUrl = `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${clean.toLowerCase()}.png`;

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: brand.gradient || brand.bg || '#3b82f6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    flexShrink: 0,
    verticalAlign: 'middle',
    border: brand.border ? `1px solid ${brand.border}` : 'none',
    ...style
  };

  // If CDN image succeeds, display the authentic multi-color PNG
  if (!imgError) {
    return (
      <span style={containerStyle} title={`${brand.name || clean} (${clean})`}>
        <img
          src={cdnUrl}
          alt={clean}
          width={size}
          height={size}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </span>
    );
  }

  // Fallback: Inline vector glyph with official brand background
  return (
    <span style={containerStyle} title={`${brand.name || clean} (${clean})`}>
      {iconPath ? (
        <svg
          viewBox="0 0 32 32"
          width={Math.round(size * 0.72)}
          height={Math.round(size * 0.72)}
          style={{ display: 'block' }}
        >
          <path d={iconPath} fill={brand.fg || '#FFFFFF'} />
        </svg>
      ) : (
        <span style={{
          fontSize: `${Math.max(7, Math.round(size * 0.45))}px`,
          fontWeight: '900',
          color: brand.fg || '#FFFFFF',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1
        }}>
          {clean.slice(0, 3)}
        </span>
      )}
    </span>
  );
}
