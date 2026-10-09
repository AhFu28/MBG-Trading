import React, { useState, useEffect, useRef, useMemo } from 'react';
import AssetIcon from './AssetIcon.jsx';

const MARKET_TABS = [
  { id: 'CRYPTO', label: '⚡ Kripto (TradingView Global)', icon: '₿', hint: '100+ Koin Terbesar Dunia' },
  { id: 'US', label: '🇺🇸 US Stocks (S&P 500)', icon: '🗽', hint: 'Wall Street Multi-Sektor' },
  { id: 'IDX', label: '🏛️ Saham BEI (Bursa Efek)', icon: '🇮🇩', hint: '30+ Bluechip Sektoral' },
];

const IDX_SECTORS = [
  {
    name: 'Perbankan & Finansial',
    stocks: [
      { symbol: 'BBCA', name: 'Bank Central Asia', weight: 22 },
      { symbol: 'BBRI', name: 'Bank Rakyat Indonesia', weight: 15 },
      { symbol: 'BMRI', name: 'Bank Mandiri', weight: 11 },
      { symbol: 'BBNI', name: 'Bank Negara Indonesia', weight: 4.5 },
      { symbol: 'BRIS', name: 'Bank Syariah Indonesia', weight: 2.5 }
    ]
  },
  {
    name: 'Energi & Petrokimia',
    stocks: [
      { symbol: 'BREN', name: 'Barito Renewables', weight: 6.5 },
      { symbol: 'CUAN', name: 'Petrindo Jaya', weight: 4.2 },
      { symbol: 'ADRO', name: 'Adaro Energy', weight: 3.5 },
      { symbol: 'MEDC', name: 'Medco Energi', weight: 2.2 },
      { symbol: 'PTBA', name: 'Bukit Asam', weight: 2.0 },
      { symbol: 'PGAS', name: 'Perusahaan Gas Negara', weight: 1.8 },
      { symbol: 'BRPT', name: 'Barito Pacific', weight: 2.4 }
    ]
  },
  {
    name: 'Mineral & Pertambangan',
    stocks: [
      { symbol: 'AMMN', name: 'Amman Mineral', weight: 7.0 },
      { symbol: 'ANTM', name: 'Aneka Tambang', weight: 2.8 },
      { symbol: 'MDKA', name: 'Merdeka Copper Gold', weight: 2.2 },
      { symbol: 'BRMS', name: 'Bumi Resources Min', weight: 2.0 },
      { symbol: 'MBMA', name: 'Merdeka Battery Mat', weight: 1.6 }
    ]
  },
  {
    name: 'Konsumer, Otomotif & Telko',
    stocks: [
      { symbol: 'ASII', name: 'Astra International', weight: 6.8 },
      { symbol: 'TLKM', name: 'Telkom Indonesia', weight: 6.5 },
      { symbol: 'ICBP', name: 'Indofood CBP', weight: 2.2 },
      { symbol: 'INDF', name: 'Indofood Makmur', weight: 1.9 },
      { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia', weight: 2.2 },
      { symbol: 'KLBF', name: 'Kalbe Farma', weight: 1.6 },
      { symbol: 'ISAT', name: 'Indosat Ooredoo', weight: 1.7 }
    ]
  }
];

function getChangeColor(pct) {
  if (pct >= 4) return '#059669';
  if (pct >= 1.5) return '#10b981';
  if (pct >= 0) return '#047857';
  if (pct > -1.5) return '#b91c1c';
  if (pct > -4) return '#dc2626';
  return '#ef4444';
}

function TradingViewCryptoHeatmap() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container__widget';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    containerRef.current.appendChild(wrapper);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      dataSource: 'Crypto',
      blockSize: 'market_cap_calc',
      blockColor: 'change',
      locale: 'id',
      symbolUrl: '',
      colorTheme: 'dark',
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      width: '100%',
      height: '100%'
    });
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 'calc(100vh - 195px)',
        minHeight: '580px',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#07090e',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}
      className="tradingview-widget-container"
    />
  );
}

function TradingViewStockHeatmap() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container__widget';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    containerRef.current.appendChild(wrapper);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      dataSource: 'SPX500',
      blockSize: 'market_cap_basic',
      blockColor: 'change',
      locale: 'id',
      symbolUrl: '',
      colorTheme: 'dark',
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: '100%',
      height: '100%'
    });
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 'calc(100vh - 195px)',
        minHeight: '580px',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#07090e',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}
      className="tradingview-widget-container"
    />
  );
}

export default function MarketHeatmapTab({ livePrices = {}, flashMap = {}, onSelectTicker, data }) {
  const [activeMarket, setActiveMarket] = useState('CRYPTO');

  // Flat list for IDX stats
  const idxFlatList = useMemo(() => {
    const list = [];
    IDX_SECTORS.forEach(sec => {
      sec.stocks.forEach(st => {
        const lp = livePrices[st.symbol] || livePrices[`IDX:${st.symbol}`] || livePrices[`${st.symbol}.JK`];
        const changePct = lp && lp.changePct !== undefined ? Number(lp.changePct) : 0;
        const price = lp?.price;
        list.push({
          ...st,
          sector: sec.name,
          changePct,
          price
        });
      });
    });
    return list;
  }, [livePrices]);

  const idxStats = useMemo(() => {
    let gainers = 0;
    let losers = 0;
    let sum = 0;
    idxFlatList.forEach(item => {
      if (item.changePct > 0) gainers++;
      else if (item.changePct < 0) losers++;
      sum += item.changePct;
    });
    const avg = idxFlatList.length > 0 ? (sum / idxFlatList.length).toFixed(2) : '0.00';
    return { gainers, losers, avg };
  }, [idxFlatList]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 16px',
        background: 'var(--bg-panel, #0a0d12)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🗺️</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              MARKET HEATMAP INTERAKTIF
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              Pemetaan visual bobot kapitalisasi pasar & perubahan harga real-time
            </div>
          </div>
        </div>

        {/* Market Switcher Segment */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '8px',
          padding: '2px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {MARKET_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveMarket(tab.id)}
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: activeMarket === tab.id ? 800 : 600,
                background: activeMarket === tab.id ? 'var(--accent-sky)' : 'transparent',
                color: activeMarket === tab.id ? '#000000' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={tab.hint}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {activeMarket === 'CRYPTO' && (
        <TradingViewCryptoHeatmap />
      )}

      {activeMarket === 'US' && (
        <TradingViewStockHeatmap />
      )}

      {activeMarket === 'IDX' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* IDX Quick Summary HUD */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '8px 14px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)'
          }}>
            <span style={{ color: '#94a3b8' }}>📊 24 Emiten Unggulan</span>
            <span style={{ color: 'var(--accent-mint)' }}>▲ {idxStats.gainers} Naik</span>
            <span style={{ color: '#f87171' }}>▼ {idxStats.losers} Turun</span>
            <span style={{ color: Number(idxStats.avg) >= 0 ? 'var(--accent-emerald)' : '#ef4444', fontWeight: 800 }}>
              Rata-rata: {Number(idxStats.avg) >= 0 ? '+' : ''}{idxStats.avg}%
            </span>
          </div>

          {/* Hierarchical Sector Treemap */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '12px'
          }}>
            {IDX_SECTORS.map(sector => (
              <div
                key={sector.name}
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: 'var(--accent-sky)',
                  fontFamily: 'var(--font-mono)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingBottom: '4px'
                }}>
                  {sector.name}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
                  {sector.stocks.map(st => {
                    const lp = livePrices[st.symbol] || livePrices[`IDX:${st.symbol}`] || livePrices[`${st.symbol}.JK`];
                    const chg = lp && lp.changePct !== undefined ? Number(lp.changePct) : 0;
                    const px = lp?.price;
                    const bg = getChangeColor(chg);

                    return (
                      <div
                        key={st.symbol}
                        onClick={() => onSelectTicker && onSelectTicker(st.symbol, 'IDX')}
                        style={{
                          background: bg,
                          borderRadius: '8px',
                          padding: '10px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '3px',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                          transition: 'transform 0.12s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AssetIcon symbol={st.symbol} market="IDX" size={14} />
                          <span style={{ fontSize: '12.5px', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                            {st.symbol}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                          {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                        </span>
                        {px && (
                          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-mono)' }}>
                            Rp {Math.round(px).toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
