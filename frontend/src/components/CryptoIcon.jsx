import React, { useState } from 'react';
import { getCryptoBrand, getCryptoIcon, cleanCryptoSymbol } from '../data/crypto-icons.js';

/**
 * Universal Authentic Cryptocurrency Icon Badge
 * - Primary: High-res multi-color SVG/PNG from spothq cryptocurrency icons CDN (Flaticon/Coingecko standard)
 * - Fallback: Inline vector SVG with authentic brand background colors and glyph
 * - Guarantees accurate brand colors (Bitcoin Orange, Ethereum Purple, Solana Teal, etc.)
 */
export default function CryptoIcon({ symbol, size = 18, style = {} }) {
  const [srcIndex, setSrcIndex] = useState(0);
  const clean = cleanCryptoSymbol(symbol);
  if (!clean) return null;

  const brand = getCryptoBrand(clean);
  const iconPath = getCryptoIcon(clean);
  const lower = clean.toLowerCase();
  const upper = clean.toUpperCase();

  // Multi-tier high-res CDN waterfall: CoinCap -> TradingView -> Spothq
  const sources = [
    `https://assets.coincap.io/assets/icons/${lower}@2x.png`,
    `https://s3-symbol-logo.tradingview.com/crypto/XTVC${upper}.svg`,
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${lower}.png`
  ];
  const currentSrc = srcIndex < sources.length ? sources[srcIndex] : null;

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: brand.gradient || brand.bg || '#1e293b',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    flexShrink: 0,
    verticalAlign: 'middle',
    border: brand.border ? `1px solid ${brand.border}` : 'none',
    ...style
  };

  // If CDN image succeeds, display the authentic multi-color icon
  if (currentSrc) {
    return (
      <span style={containerStyle} title={`${brand.name || clean} (${clean})`}>
        <img
          key={currentSrc}
          src={currentSrc}
          alt={clean}
          width={size}
          height={size}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setSrcIndex(i => i + 1)}
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
