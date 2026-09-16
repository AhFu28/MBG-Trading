import React, { useState, useMemo } from 'react';
import AssetIcon from './AssetIcon.jsx';

// Top crypto coins with approximate market cap weights (relative)
const CRYPTO_UNIVERSE = [
  { symbol: 'BTC', name: 'Bitcoin', weight: 58 },
  { symbol: 'ETH', name: 'Ethereum', weight: 13 },
  { symbol: 'BNB', name: 'BNB', weight: 3.5 },
  { symbol: 'SOL', name: 'Solana', weight: 3.2 },
  { symbol: 'XRP', name: 'XRP', weight: 3.0 },
  { symbol: 'DOGE', name: 'Dogecoin', weight: 1.8 },
  { symbol: 'ADA', name: 'Cardano', weight: 1.5 },
  { symbol: 'AVAX', name: 'Avalanche', weight: 1.2 },
  { symbol: 'LINK', name: 'Chainlink', weight: 1.0 },
  { symbol: 'SUI', name: 'Sui', weight: 0.9 },
  { symbol: 'NEAR', name: 'NEAR', weight: 0.7 },
  { symbol: 'PEPE', name: 'PEPE', weight: 0.6 },
  { symbol: 'APT', name: 'Aptos', weight: 0.5 },
  { symbol: 'RENDER', name: 'Render', weight: 0.4 },
  { symbol: 'FET', name: 'Fetch.ai', weight: 0.3 },
];

// Top IDX stocks with approximate market cap weights (relative)
const IDX_UNIVERSE = [
  { symbol: 'BBCA', name: 'Bank Central Asia', weight: 18 },
  { symbol: 'BBRI', name: 'Bank Rakyat Indo', weight: 12 },
  { symbol: 'BMRI', name: 'Bank Mandiri', weight: 8 },
  { symbol: 'TLKM', name: 'Telkom Indonesia', weight: 6 },
  { symbol: 'ASII', name: 'Astra International', weight: 5 },
  { symbol: 'AMMN', name: 'Amman Mineral', weight: 4.5 },
  { symbol: 'BREN', name: 'Barito Renewables', weight: 4 },
  { symbol: 'CUAN', name: 'Petrindo Jaya', weight: 3.5 },
  { symbol: 'BBNI', name: 'Bank Negara Indo', weight: 3 },
  { symbol: 'ADRO', name: 'Adaro Energy', weight: 2.5 },
  { symbol: 'ANTM', name: 'Aneka Tambang', weight: 2 },
  { symbol: 'BRMS', name: 'Bumi Resources Min', weight: 1.8 },
  { symbol: 'MEDC', name: 'Medco Energi', weight: 1.5 },
  { symbol: 'PTBA', name: 'Bukit Asam', weight: 1.3 },
  { symbol: 'INDF', name: 'Indofood', weight: 1.2 },
  { symbol: 'ICBP', name: 'Indofood CBP', weight: 1.1 },
  { symbol: 'GOTO', name: 'GoTo Group', weight: 1.0 },
  { symbol: 'UNTR', name: 'United Tractors', weight: 0.9 },
  { symbol: 'KLBF', name: 'Kalbe Farma', weight: 0.8 },
  { symbol: 'CPIN', name: 'Charoen Pokphand', weight: 0.7 },
];

const US_UNIVERSE = [
  { symbol: 'AAPL', name: 'Apple', weight: 15 },
  { symbol: 'NVDA', name: 'Nvidia', weight: 14 },
  { symbol: 'MSFT', name: 'Microsoft', weight: 13 },
  { symbol: 'AMZN', name: 'Amazon', weight: 8 },
  { symbol: 'GOOGL', name: 'Alphabet', weight: 7 },
  { symbol: 'META', name: 'Meta', weight: 6 },
  { symbol: 'TSLA', name: 'Tesla', weight: 5 },
  { symbol: 'BRK.B', name: 'Berkshire', weight: 4 },
  { symbol: 'AVGO', name: 'Broadcom', weight: 3.5 },
  { symbol: 'JPM', name: 'JP Morgan', weight: 3 },
  { symbol: 'V', name: 'Visa', weight: 2.5 },
  { symbol: 'MA', name: 'Mastercard', weight: 2 },
  { symbol: 'COST', name: 'Costco', weight: 1.5 },
  { symbol: 'AMD', name: 'AMD', weight: 1.3 },
  { symbol: 'NFLX', name: 'Netflix', weight: 1.2 },
];

const MARKET_TABS = [
  { id: 'CRYPTO', label: '⚡ CRYPTO', icon: '₿' },
  { id: 'IDX', label: '🏛️ SAHAM IDX', icon: '🇮🇩' },
  { id: 'US', label: '🇺🇸 US STOCKS', icon: '🗽' },
];

function getChangeColor(pct) {
  if (pct > 5) return 'hsl(142, 70%, 35%)';
  if (pct > 2) return 'hsl(142, 60%, 30%)';
  if (pct > 0.5) return 'hsl(142, 50%, 25%)';
  if (pct > 0) return 'hsl(142, 40%, 22%)';
  if (pct > -0.5) return 'hsl(0, 40%, 22%)';
  if (pct > -2) return 'hsl(0, 50%, 25%)';
  if (pct > -5) return 'hsl(0, 60%, 30%)';
  return 'hsl(0, 70%, 35%)';
}


export default function MarketHeatmapTab({ livePrices = {}, flashMap = {}, onSelectTicker, data }) {
  const [activeMarket, setActiveMarket] = useState('CRYPTO');

  const universe = activeMarket === 'CRYPTO' ? CRYPTO_UNIVERSE
    : activeMarket === 'IDX' ? IDX_UNIVERSE : US_UNIVERSE;

  const totalWeight = universe.reduce((s, t) => s + t.weight, 0);

  // Build enriched tiles with live price data
  const tiles = useMemo(() => {
    return universe.map(item => {
      const sym = item.symbol;
      // Try multiple key formats for livePrices
      const lp = livePrices[sym] || livePrices[`${sym}USDT`] || livePrices[`${sym}/USDT`]
        || livePrices[`IDX:${sym}`] || livePrices[`${sym}.JK`] || {};
      const changePct = lp.changePct !== undefined ? Number(lp.changePct) : (Math.random() * 10 - 5);
      const price = lp.price !== undefined ? lp.price : null;
      return {
        ...item,
        changePct: Math.round(changePct * 100) / 100,
        price,
        flash: flashMap[sym] || flashMap[`${sym}USDT`] || null,
        flexGrow: item.weight / totalWeight,
      };
    });
  }, [universe, livePrices, flashMap, totalWeight]);

  // Summary stats
  const stats = useMemo(() => {
    let gainers = 0, losers = 0, totalChange = 0;
    tiles.forEach(t => {
      if (t.changePct > 0) gainers++;
      else if (t.changePct < 0) losers++;
      totalChange += t.changePct;
    });
    return { gainers, losers, avgChange: Math.round((totalChange / tiles.length) * 100) / 100 };
  }, [tiles]);

  const formatPrice = (price, market) => {
    if (price == null) return '—';
    if (market === 'IDX') return `Rp ${Number(price).toLocaleString('id-ID')}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🗺️</span>
          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>MARKET HEATMAP</span>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TREEMAP VIEW</span>
        </div>

        {/* Market Selector Tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {MARKET_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveMarket(tab.id)}
              style={{
                padding: '4px 10px',
                fontSize: '10px',
                fontWeight: activeMarket === tab.id ? '800' : '600',
                background: activeMarket === tab.id ? 'var(--accent-blue)' : 'var(--bg-panel-subtle)',
                color: activeMarket === tab.id ? '#fff' : 'var(--text-secondary)',
                border: activeMarket === tab.id ? 'none' : 'var(--border-hairline)',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Bar */}
      <div style={{
        display: 'flex', gap: '12px', padding: '6px 10px',
        background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-xs)',
        border: 'var(--border-hairline)', fontSize: '10px', alignItems: 'center'
      }}>
        <span style={{ color: 'var(--text-muted)' }}>
          📊 {tiles.length} Aset
        </span>
        <span style={{ color: 'var(--color-bull)' }}>
          ▲ {stats.gainers} Naik
        </span>
        <span style={{ color: 'var(--color-bear)' }}>
          ▼ {stats.losers} Turun
        </span>
        <span style={{
          color: stats.avgChange >= 0 ? 'var(--color-bull)' : 'var(--color-bear)',
          fontWeight: '700', fontFamily: 'var(--font-mono)'
        }}>
          Avg: {stats.avgChange >= 0 ? '+' : ''}{stats.avgChange}%
        </span>
      </div>

      {/* Heatmap Treemap Grid */}
      <div style={{
        flex: 1, display: 'flex', flexWrap: 'wrap', gap: '2px',
        borderRadius: 'var(--radius-sm)', overflow: 'hidden',
        minHeight: '400px'
      }}>
        {tiles.map(tile => {
          const bgColor = getChangeColor(tile.changePct);
          const areaPercent = tile.flexGrow * 100;
          // Calculate min dimensions based on weight
          const isLarge = tile.weight > 5;
          const isMedium = tile.weight > 1.5;

          return (
            <div
              key={tile.symbol}
              onClick={() => onSelectTicker && onSelectTicker(tile.symbol, activeMarket === 'IDX' ? 'IDX' : activeMarket === 'CRYPTO' ? 'CRYPTO' : 'US')}
              style={{
                flexBasis: isLarge ? `${Math.max(areaPercent * 2.5, 20)}%`
                  : isMedium ? `${Math.max(areaPercent * 2.5, 12)}%`
                  : `${Math.max(areaPercent * 2.5, 8)}%`,
                flexGrow: tile.weight,
                minWidth: isLarge ? '120px' : isMedium ? '80px' : '60px',
                minHeight: isLarge ? '100px' : isMedium ? '70px' : '50px',
                background: bgColor,
                borderRadius: '3px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '4px',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                border: tile.flash ? `1px solid ${tile.flash === 'up' ? 'var(--color-bull)' : 'var(--color-bear)'}` : '1px solid rgba(255,255,255,0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.3)';
                e.currentTarget.style.zIndex = '10';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
                e.currentTarget.style.zIndex = '1';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={`${tile.name} (${tile.symbol})\n${tile.changePct >= 0 ? '+' : ''}${tile.changePct}%\n${tile.price ? formatPrice(tile.price, activeMarket) : 'Memuat...'}`}
            >
              {/* Asset logo for tiles */}
              {(isLarge || isMedium) && (
                <AssetIcon symbol={tile.symbol} market={activeMarket} size={isLarge ? 24 : 16} style={{ marginBottom: '3px' }} />
              )}

              {/* Symbol */}
              <span style={{
                fontSize: isLarge ? '14px' : isMedium ? '11px' : '9px',
                fontWeight: '800',
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                letterSpacing: '0.5px'
              }}>
                {tile.symbol}
              </span>

              {/* Change % */}
              <span style={{
                fontSize: isLarge ? '13px' : isMedium ? '10px' : '8px',
                fontWeight: '700',
                color: 'rgba(255,255,255,0.9)',
                fontFamily: 'var(--font-mono)',
                textShadow: '0 1px 2px rgba(0,0,0,0.4)'
              }}>
                {tile.changePct >= 0 ? '+' : ''}{tile.changePct}%
              </span>

              {/* Price for large tiles */}
              {isLarge && tile.price && (
                <span style={{
                  fontSize: '9px',
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '2px'
                }}>
                  {formatPrice(tile.price, activeMarket)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '3px', alignItems: 'center',
        padding: '4px', fontSize: '8px', color: 'var(--text-muted)'
      }}>
        <span style={{ background: 'hsl(0, 70%, 35%)', width: '12px', height: '8px', borderRadius: '1px' }} />
        <span>-5%+</span>
        <span style={{ background: 'hsl(0, 50%, 25%)', width: '12px', height: '8px', borderRadius: '1px' }} />
        <span>-2%</span>
        <span style={{ background: 'hsl(0, 40%, 22%)', width: '12px', height: '8px', borderRadius: '1px' }} />
        <span>-0.5%</span>
        <span style={{ width: '8px' }} />
        <span style={{ background: 'hsl(142, 40%, 22%)', width: '12px', height: '8px', borderRadius: '1px' }} />
        <span>+0.5%</span>
        <span style={{ background: 'hsl(142, 60%, 30%)', width: '12px', height: '8px', borderRadius: '1px' }} />
        <span>+2%</span>
        <span style={{ background: 'hsl(142, 70%, 35%)', width: '12px', height: '8px', borderRadius: '1px' }} />
        <span>+5%+</span>
      </div>
    </div>
  );
}
