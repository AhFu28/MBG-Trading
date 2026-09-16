import React, { useState } from 'react';
import CryptoIcon from './CryptoIcon.jsx';
import { getStockConfig } from '../data/stock-icons.js';
import { parseForexPair } from '../data/forex-flags.js';

/**
 * Universal Multi-Market Asset Icon Component
 * Handles:
 * - CRYPTO: Multi-color vector badge + CDN logo
 * - SAHAM INDO (IDX): Google Favicon from official domain + corporate color badge fallback
 * - SAHAM US: Official corporate domain logo + brand color fallback
 * - FOREX: Dual overlapping national flag badge (Base / Quote)
 */
export default function AssetIcon({ symbol, ticker, market = 'STOCK', size = 18, style = {} }) {
  const [imgError, setImgError] = useState(false);
  const rawSymbol = symbol || ticker || '';
  if (!rawSymbol) return null;

  const normalizedMarket = String(market).toUpperCase();

  // 1. CRYPTO ASSET
  if (normalizedMarket === 'CRYPTO' || normalizedMarket === 'FUTURES' || rawSymbol.includes('USDT') || rawSymbol.includes('/USDT')) {
    return <CryptoIcon symbol={rawSymbol} size={size} style={style} />;
  }

  // 2. FOREX CURRENCY PAIR
  if (normalizedMarket === 'FOREX' || normalizedMarket === 'FX') {
    const fx = parseForexPair(rawSymbol);
    if (!fx) return null;

    const flagSize = Math.max(12, Math.round(size * 0.75));
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          position: 'relative',
          width: `${size + 6}px`,
          height: `${size}px`,
          flexShrink: 0,
          verticalAlign: 'middle',
          ...style
        }}
        title={`${fx.pair} (${fx.baseData.name} / ${fx.quoteData.name})`}
      >
        {/* Base Currency Flag */}
        <span style={{
          fontSize: `${flagSize}px`,
          lineHeight: 1,
          zIndex: 1,
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))'
        }}>
          {fx.baseFlag}
        </span>
        {/* Quote Currency Flag (overlapping) */}
        <span style={{
          fontSize: `${flagSize}px`,
          lineHeight: 1,
          marginLeft: '-4px',
          zIndex: 2,
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))'
        }}>
          {fx.quoteFlag}
        </span>
      </span>
    );
  }

  // 3. EQUITIES (IDX OR US STOCK)
  const isUS = normalizedMarket === 'US' || normalizedMarket === 'US_STOCKS' || normalizedMarket === 'WALL_STREET';
  const cfg = getStockConfig(rawSymbol, isUS ? 'US' : 'IDX');
  const cleanTicker = rawSymbol.replace(/^(IDX:|NASDAQ:|NYSE:)/, '').replace(/\.JK$/, '').trim();

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: cfg?.color || (isUS ? '#0f172a' : '#1e3a8a'),
    boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
    overflow: 'hidden',
    flexShrink: 0,
    verticalAlign: 'middle',
    ...style
  };

  // Google Favicon URL with high-res 64px size
  const faviconUrl = cfg?.domain ? `https://www.google.com/s2/favicons?domain=${cfg.domain}&sz=64` : null;

  if (faviconUrl && !imgError) {
    return (
      <span style={containerStyle} title={`${cfg?.name || cleanTicker} (${cleanTicker})`}>
        <img
          src={faviconUrl}
          alt={cleanTicker}
          width={size}
          height={size}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: '1px' }}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </span>
    );
  }

  // Fallback: Crisp corporate monogram badge with official brand background
  const label = cleanTicker.length <= 4 ? cleanTicker : cleanTicker.slice(0, 3);
  return (
    <span style={containerStyle} title={`${cfg?.name || cleanTicker} (${cleanTicker})`}>
      <span style={{
        fontSize: `${Math.max(7, Math.round(size * 0.42))}px`,
        fontWeight: '900',
        color: cfg?.fg || '#FFFFFF',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '-0.03em',
        lineHeight: 1
      }}>
        {label}
      </span>
    </span>
  );
}
