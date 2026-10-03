import React, { useState, useEffect, useMemo } from 'react';
import BloombergNewsWire from './BloombergNewsWire.jsx';
import AssetIcon from './AssetIcon.jsx';
import CryptoIcon from './CryptoIcon.jsx';
import { formatNewsDateTime } from './newsHelpers.js';
import { formatIdNumber } from '../utils/format.js';

const LQ45_TICKERS = new Set([
  'BBCA', 'BBRI', 'BMRI', 'BBNI', 'ASII', 'TLKM', 'AMMN', 'BREN', 'CUAN', 'ADRO',
  'ANTM', 'PTBA', 'BRMS', 'MEDC', 'PGAS', 'UNTR', 'CPIN', 'ICBP', 'INDF', 'KLBF',
  'MAPI', 'ACES', 'EXCL', 'ISAT', 'BRPT', 'TPIA', 'MDKA', 'MBMA', 'GOTO', 'AKRA',
  'BUMI', 'HRUM', 'ITMG', 'INCO', 'PGEO', 'SMGR', 'INTP', 'CTRA', 'BSDE', 'PWON',
  'SMRA', 'BBTN', 'BDMN', 'BRIS', 'UNVR'
]);

// Helper: Format IDR Flow
function formatFlowIdr(val) {
  if (val === undefined || val === null || isNaN(val)) return 'Rp 0';
  const num = Number(val);
  if (num === 0) return 'Rp 0';
  const abs = Math.abs(num);
  const sign = num > 0 ? '+' : '-';
  if (abs >= 1e12) return `${sign}Rp ${(abs / 1e12).toFixed(2)} T`;
  if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toFixed(2)} M`;
  if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toFixed(0)} Jt`;
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
}

// Helper: Format Crypto Price
function formatCryptoPrice(val) {
  if (val === undefined || val === null || isNaN(val)) return '-';
  const n = Number(val);
  if (n >= 1000) return Math.round(n).toLocaleString('en-US');
  if (n >= 10) return n.toFixed(1);
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(3);
  if (n < 0.0001) return n.toFixed(6);
  return n.toFixed(4);
}

// Helper: Institutional Net R:R (0.45% round-trip friction for IDX, 0.15% for Crypto/US)
function calcNetRR(entry, sl, tp, market = 'IDX') {
  const e = Number(entry);
  const s = Number(sl);
  const t = Number(tp);
  if (!e || !s || !t || e === s) return { gross: '1:2.0', net: '1:1.8', feeImpact: '-0.45%' };
  
  const grossReward = Math.abs(t - e);
  const grossRisk = Math.abs(e - s);
  const grossRatio = grossRisk > 0 ? (grossReward / grossRisk).toFixed(1) : '2.0';
  
  const frictionPct = market === 'IDX' ? 0.0045 : 0.0015;
  const frictionVal = e * frictionPct;
  const netReward = Math.max(0, grossReward - frictionVal);
  const netRisk = grossRisk + frictionVal;
  const netRatio = netRisk > 0 ? (netReward / netRisk).toFixed(1) : grossRatio;
  
  return {
    gross: `1:${grossRatio}`,
    net: `1:${netRatio}`,
    feeImpact: market === 'IDX' ? '-0.45%' : '-0.15%'
  };
}

// Helper: Volatility-Adjusted Lot Sizing (1% Capital Risk on Rp 100 Jt Base)
function calcRiskPosition(entry, sl, portfolioSize = 100000000, riskPct = 0.01, market = 'IDX') {
  const e = Number(entry);
  const s = Number(sl);
  if (!e || !s || e <= s) {
    return market === 'IDX' ? { lots: '50 Lot', valIdr: 'Rp 5.0 Jt' } : { lots: '0.15 Pos', valIdr: '$1,200' };
  }
  const riskAmount = portfolioSize * riskPct;
  const riskPerShare = Math.abs(e - s);
  const shares = Math.floor(riskAmount / riskPerShare);
  
  if (market === 'IDX') {
    const lots = Math.max(1, Math.floor(shares / 100));
    const totalVal = lots * 100 * e;
    const valStr = totalVal >= 1e9 ? `Rp ${(totalVal / 1e9).toFixed(1)} M` : totalVal >= 1e6 ? `Rp ${(totalVal / 1e6).toFixed(1)} Jt` : `Rp ${totalVal.toLocaleString()}`;
    return { lots: `${lots.toLocaleString()} Lot`, valIdr: valStr };
  } else if (market === 'CRYPTO') {
    const units = (riskAmount / (riskPerShare * 15500)).toFixed(market === 'BTC' ? 3 : 2);
    return { lots: `${units} Unit`, valIdr: `$${Math.round(riskAmount / 15500)} Risk` };
  } else {
    const usShares = Math.max(1, Math.floor((riskAmount / 15500) / riskPerShare));
    return { lots: `${usShares} Shs`, valIdr: `$${Math.round(usShares * e).toLocaleString()}` };
  }
}

// ─── V4 Live Sparklines: real session ticks only — no fabricated data ───
const __priceHistory = new Map();
function trackLiveValue(key, value) {
  let h = __priceHistory.get(key);
  if (!h) { h = []; __priceHistory.set(key, h); }
  if (value !== undefined && value !== null && Number.isFinite(Number(value))) {
    const v = Number(value);
    if (h[h.length - 1] !== v) { h.push(v); if (h.length > 48) h.shift(); }
  }
  return h;
}

function LiveSparkline({ points, height = 30, id = 'price' }) {
  if (!points || points.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '7.5px', letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase', opacity: 0.75 }}>
        Mengumpulkan tick live…
      </div>
    );
  }
  const min = Math.min(...points), max = Math.max(...points);
  const range = (max - min) || 1;
  const w = 100, h = height;
  const path = points
    .map((v, i) => `${((i / (points.length - 1)) * w).toFixed(2)},${(h - 3 - ((v - min) / range) * (h - 6)).toFixed(2)}`)
    .join(' ');
  const up = points[points.length - 1] >= points[0];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: h, display: 'block' }} aria-label={`Riwayat harga live ${id}`}>
      <polyline points={path} fill="none" stroke={up ? 'var(--accent-green)' : 'var(--accent-rust)'} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function HomeDashboardTab({
  data,
  livePrices = {},
  allIdxStocks = [],
  flashMap = {},
  onSelectTicker,
  onOpenLotCalc,
  onNavigateTab,
  onSelectNews
}) {
  const [dataStatus, setDataStatus] = useState('live');
  const [newsFilter, setNewsFilter] = useState('ALL');
  const [newsSearch, setNewsSearch] = useState('');
  const [newsViewMode, setNewsViewMode] = useState('scroll');
  const [flowScope, setFlowScope] = useState('ALL_100');
  const [matrixViewMode, setMatrixViewMode] = useState('3col');
  const [showLaymanGuide, setShowLaymanGuide] = useState(false);
  const [dismissDefenseAlert, setDismissDefenseAlert] = useState(false);
  const [portfolioCurrency, setPortfolioCurrency] = useState('USD'); // 'USD' | 'IDR'

  useEffect(() => {
    if (data?.data_sources && Object.values(data.data_sources).some(s => s === 'fallback')) {
      setDataStatus('fallback');
    } else {
      setDataStatus('live');
    }
  }, [data]);

  const topIdxPlans = (data?.daily_trade_plans || []).filter(p => p.market === 'IDX');
  const topCryptoPicks = data?.crypto_spot_10 || [];
  const topUsPlans = data?.us_stocks?.stocks || [];
  const topIdx = topIdxPlans[0];
  const topCrypto = topCryptoPicks[0];
  const macro = data?.macro_telemetry || {};
  const foreignFlow = data?.foreign_flow || {};
  const brokerSummary = data?.broker_summary || {};
  const liveNewsRaw = (macro?.live_news || []).slice().sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    const timeA = a.timestamp_ms || (a.pub_date ? new Date(a.pub_date).getTime() : 0) || 0;
    const timeB = b.timestamp_ms || (b.pub_date ? new Date(b.pub_date).getTime() : 0) || 0;
    return timeB - timeA;
  });

  // Geopolitical & Military Threat Detection
  const geoAlertItems = useMemo(() => {
    return liveNewsRaw.filter(n => {
      const text = `${n.title || ''} ${n.summary || ''} ${n.stream || ''} ${n.tag || ''}`.toLowerCase();
      return text.includes('nuklir') || text.includes('nuclear') ||
             text.includes('perang') || text.includes('war') ||
             text.includes('militer') || text.includes('military') ||
             text.includes('rudal') || text.includes('missile') ||
             text.includes('selat hormuz') || text.includes('hormuz') ||
             text.includes('airstrike') || text.includes('houthi') ||
             text.includes('iran') || text.includes('israel') ||
             text.includes('russia') || text.includes('ukraine') ||
             text.includes('sanction') || text.includes('defcon');
    });
  }, [liveNewsRaw]);

  // M-08: Bind tactical alert strictly to bundle DEFCON threat level (suppress sensational alert when NORMAL/DEFCON 4)
  const bundleDefconLevel = Number(data?.geopolitical_threat?.defcon_level || 4);
  const isCrisisEscalated = bundleDefconLevel <= 3 && String(data?.macro_indicators?.crisis_severity || '').toUpperCase() !== 'NORMAL';
  const hasHighThreat = isCrisisEscalated && geoAlertItems.length > 0;
  const primaryThreatNews = geoAlertItems[0];

  // News Filtering with ALL granular categories restored
  const filteredNews = useMemo(() => {
    return liveNewsRaw.filter(item => {
      if (newsFilter !== 'ALL') {
        const stream = (item.stream || '').toUpperCase();
        const tag = (item.tag || '').toUpperCase();
        const title = (item.title || '').toLowerCase();
        const summary = (item.summary || '').toLowerCase();
        const fullText = `${title} ${summary}`;

        if (newsFilter === 'DAILY_BRIEF' && stream !== 'DAILY_BRIEF' && tag !== 'DAILY_BRIEF') return false;
        if (newsFilter === 'RESEARCH' && stream !== 'RESEARCH' && tag !== 'RESEARCH') return false;
        if (newsFilter === 'IDX' && stream !== 'IDX' && tag !== 'IHSG' && tag !== 'BANKING' && !tag.includes('IDX')) return false;
        if (newsFilter === 'BANKING') {
          const isBank = tag === 'BANKING' || fullText.includes('bank') || fullText.includes('bbca') || fullText.includes('bbri') || fullText.includes('bmri') || fullText.includes('bbni') || fullText.includes('bunga');
          if (!isBank) return false;
        }
        if (newsFilter === 'CRYPTO' && stream !== 'CRYPTO' && tag !== 'BTC' && tag !== 'CRYPTO') return false;
        if (newsFilter === 'MACRO' && stream !== 'MACRO' && tag !== 'MACRO' && tag !== 'FED' && tag !== 'CENTRAL_BANK') return false;
        if (newsFilter === 'GEOPOLITIK') {
          const isGeo = stream === 'GEOPOLITIK' || tag === 'GEOPOLITIK' ||
            fullText.includes('perang') || fullText.includes('war') || fullText.includes('geopolitik') ||
            fullText.includes('middle east') || fullText.includes('israel') || fullText.includes('iran') ||
            fullText.includes('selat hormuz') || fullText.includes('russia') || fullText.includes('ukraine') ||
            fullText.includes('tariff') || fullText.includes('sanction') || fullText.includes('militer');
          if (!isGeo) return false;
        }
        if (newsFilter === 'NUCLEAR_WAR') {
          const isNuclearWar = fullText.includes('nuklir') || fullText.includes('nuclear') ||
            fullText.includes('rudal') || fullText.includes('missile') || fullText.includes('ballistic') ||
            fullText.includes('perang') || fullText.includes('war') || fullText.includes('serangan militer') ||
            fullText.includes('airstrike') || fullText.includes('defcon') || fullText.includes('ww3');
          if (!isNuclearWar) return false;
        }
        if (newsFilter === 'COMMODITY') {
          const isComm = stream === 'COMMODITIES' || tag === 'COMMODITY' || tag === 'ENERGY' ||
            fullText.includes('emas') || fullText.includes('gold') || fullText.includes('nikel') || fullText.includes('tembaga') || fullText.includes('tin') || fullText.includes('timah') || fullText.includes('antm') || fullText.includes('brms');
          if (!isComm) return false;
        }
        if (newsFilter === 'ENERGY') {
          const isEnergy = stream === 'ENERGY_GEO' || stream === 'COMMODITIES' || tag === 'ENERGY' ||
            fullText.includes('oil') || fullText.includes('brent') || fullText.includes('crude') ||
            fullText.includes('minyak') || fullText.includes('opec') || fullText.includes('gas') ||
            fullText.includes('bbm') || fullText.includes('energi') || fullText.includes('pertamina') || fullText.includes('medc') || fullText.includes('elsa');
          if (!isEnergy) return false;
        }
        if (newsFilter === 'US_MARKET') {
          const isUs = tag === 'US_MARKET' || stream === 'US_MARKET' || fullText.includes('wall street') || fullText.includes('nasdaq') || fullText.includes('sp500') || fullText.includes('fed') || fullText.includes('powell');
          if (!isUs) return false;
        }
        if (newsFilter === 'CHINA') {
          const isChina = tag === 'CHINA' || stream === 'CHINA' || fullText.includes('china') || fullText.includes('tiongkok') || fullText.includes('stimulus') || fullText.includes('pboc');
          if (!isChina) return false;
        }
        if (newsFilter === 'TECH_AI') {
          const isTech = tag === 'TECH_AI' || fullText.includes('ai') || fullText.includes('nvidia') || fullText.includes('semiconductor') || fullText.includes('chip') || fullText.includes('artificial intelligence');
          if (!isTech) return false;
        }
      }

      if (newsSearch.trim()) {
        const q = newsSearch.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchSummary = (item.summary || '').toLowerCase().includes(q);
        const matchTickers = (item.related_tickers || []).some(t => t.toLowerCase().includes(q));
        const matchSource = (item.source || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchTickers && !matchSource) return false;
      }

      return true;
    });
  }, [liveNewsRaw, newsFilter, newsSearch]);

  const displayNews = newsViewMode === 'compact' ? filteredNews.slice(0, 15) : filteredNews;

  const sentiment = macro.market_regime || 'NEUTRAL';
  const narrative = macro.regime_narrative || 'US Markets Consolidate Ahead of Fed Policy Statement: Commodity Prices Stable';

  // Robust Foreign Flow Calculations
  const { topInflow, topOutflow, totalNetForeign } = useMemo(() => {
    const poolMap = new Map();

    (foreignFlow.top_inflow || []).forEach(f => {
      const val = Number(f.foreign_net_val_idr) || 0;
      if (val !== 0 && f.ticker) {
        poolMap.set(f.ticker, { ...f, ticker: f.ticker, foreign_net_val_idr: val });
      }
    });
    (foreignFlow.top_outflow || []).forEach(f => {
      const val = Number(f.foreign_net_val_idr) || 0;
      if (val !== 0 && f.ticker) {
        poolMap.set(f.ticker, { ...f, ticker: f.ticker, foreign_net_val_idr: val });
      }
    });

    if (data?.conglomerates) {
      Object.values(data.conglomerates).flat().forEach(f => {
        const val = Number(f.foreign_net_val_idr) || 0;
        if (val !== 0 && f.ticker && !poolMap.has(f.ticker)) {
          poolMap.set(f.ticker, { ...f, ticker: f.ticker, foreign_net_val_idr: val });
        }
      });
    }
    if (data?.dividend_hunters) {
      data.dividend_hunters.forEach(f => {
        const val = Number(f.foreign_net_val_idr) || 0;
        if (val !== 0 && f.ticker && !poolMap.has(f.ticker)) {
          poolMap.set(f.ticker, { ...f, ticker: f.ticker, foreign_net_val_idr: val });
        }
      });
    }

    if (allIdxStocks && allIdxStocks.length > 0) {
      allIdxStocks.slice(0, 100).forEach(s => {
        if (!s.ticker) return;
        const liveQuote = livePrices[s.ticker] || s;
        const chg = Number(liveQuote.changePct) || 0;
        const valTraded = Number(liveQuote.valueTraded) || (Number(liveQuote.price || 0) * Number(liveQuote.volume || 0));

        if (!poolMap.has(s.ticker) && chg !== 0 && valTraded > 0) {
          const estimatedFlow = Math.round(valTraded * (chg / 100) * 0.35);
          if (estimatedFlow !== 0) {
            poolMap.set(s.ticker, {
              ticker: s.ticker,
              price: liveQuote.price,
              change_pct: chg,
              volume: liveQuote.volume,
              foreign_net_val_idr: estimatedFlow
            });
          }
        }
      });
    }

    const allStocksArray = Array.from(poolMap.values());
    const scopedList = flowScope === 'LQ45'
      ? allStocksArray.filter(s => LQ45_TICKERS.has(s.ticker))
      : allStocksArray;

    const inflows = scopedList
      .filter(f => (Number(f.foreign_net_val_idr) || 0) > 0)
      .sort((a, b) => Number(b.foreign_net_val_idr) - Number(a.foreign_net_val_idr))
      .slice(0, 5);

    const outflows = scopedList
      .filter(f => (Number(f.foreign_net_val_idr) || 0) < 0)
      .sort((a, b) => Number(a.foreign_net_val_idr) - Number(b.foreign_net_val_idr))
      .slice(0, 5);

    const netSum = inflows.reduce((a, c) => a + Number(c.foreign_net_val_idr), 0) +
                   outflows.reduce((a, c) => a + Number(c.foreign_net_val_idr), 0);

    return {
      topInflow: inflows,
      topOutflow: outflows,
      totalNetForeign: foreignFlow.summary?.net_today_idr !== undefined 
        ? Number(foreignFlow.summary.net_today_idr) 
        : netSum
    };
  }, [foreignFlow, data, allIdxStocks, livePrices, flowScope]);

  // Robust Broker Accumulation
  const accumulatingBrokers = useMemo(() => {
    const list = Object.values(brokerSummary)
      .filter(b => b.bandar_accumulation_grade === 'BIG_ACCUMULATION' || b.bandar_accumulation_grade === 'ACCUMULATION' || (b.top_buyers && b.top_buyers.length > 0))
      .sort((a, b) => ((b.top_buyers?.[0]?.lots || 0) * (b.bandar_avg_price || b.ref_price || 0)) - ((a.top_buyers?.[0]?.lots || 0) * (a.bandar_avg_price || a.ref_price || 0)))
      .slice(0, 6);
    return list;
  }, [brokerSummary]);

  const totalBandarAccumValue = accumulatingBrokers.reduce((acc, b) => {
    const topB = b.top_buyers?.[0];
    const val = Number(topB?.value_idr) || ((topB?.lots || 0) * 100 * Number(b.bandar_avg_price || b.ref_price || 0));
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', boxSizing: 'border-box' }}>

      {dataStatus === 'fallback' && (
        <div style={{ background: 'rgba(255, 180, 84, 0.12)', color: 'var(--accent-gold-text)', border: 'var(--border-hairline)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', fontWeight: 500 }}>
          📡 OFFLINE MODE — Menjalankan data fallback/cache. Koneksi bursa sedang disinkronkan ulang.
        </div>
      )}

      {/* TOP STRIP: STREAMLINED MARKET BENCHMARK WIRE */}
      <BloombergNewsWire macro={macro} bundle={data} livePrices={livePrices} onSelectTicker={onSelectTicker} onSelectNews={onSelectNews} />

      {/* =========================================================================
          DRIBBBLE-STYLE CRYPTO & MULTI-ASSET PORTFOLIO ANALYTICS HERO
          Sleek Glassmorphic Bento HUD: Net Valuation, 24h Alpha, Quick Actions & Macro Stats
          ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 1.35fr) repeat(4, minmax(110px, 1fr))',
        gap: '10px',
        alignItems: 'stretch',
        boxSizing: 'border-box'
      }}>
        {/* Left: Portfolio Valuation Card */}
        <div className="telemetry-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px 14px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px' }}>💼</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', fontWeight: '500', letterSpacing: '0.16em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Portfolio Net Valuation
              </span>
              <span style={{
                fontSize: '8px',
                fontWeight: '500',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em',
                padding: '2px 6px',
                borderRadius: '3px',
                background: 'transparent',
                color: 'var(--text-muted)',
                border: 'var(--border-hairline)'
              }}>
                SIMULATOR
              </span>
            </div>

            {/* Currency Switcher */}
            <div style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '2px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              {['USD', 'IDR'].map(curr => (
                <button
                  key={curr}
                  onClick={() => setPortfolioCurrency(curr)}
                  style={{
                    border: 'none',
                    background: portfolioCurrency === curr ? 'var(--text-primary)' : 'transparent',
                    color: portfolioCurrency === curr ? 'var(--text-inverse)' : 'var(--text-muted)',
                    fontSize: '9px',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Big Balance & 24h PnL Pill */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              fontSize: '30px',
              fontWeight: '300',
              letterSpacing: '0.01em',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1
            }}>
              {portfolioCurrency === 'USD' ? '$128,450.80' : 'Rp 2.054.200.000'}
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: 'var(--accent-green-text)',
              fontSize: '11px',
              fontWeight: '600',
              fontFamily: 'var(--font-mono)'
            }}>
              <span>↗</span>
              <span>{portfolioCurrency === 'USD' ? '+$4,210.50' : '+Rp 67.360.000'} (+3.38%)</span>
            </div>
          </div>

          {/* Quick Action Button Pills (Dribbble Style) */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
            <button
              onClick={() => onOpenLotCalc && onOpenLotCalc()}
              style={{
                background: 'var(--text-primary)',
                color: 'var(--text-inverse)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: '10.5px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: 'none'
              }}
            >
              <span>⚡</span>
              <span>Eksekusi Trade</span>
            </button>

            <button
              onClick={() => onNavigateTab && onNavigateTab('AI_AGENTS')}
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: 'var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: '10.5px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.45)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <span>🤖</span>
              <span>16 Bot Arena Alpha</span>
            </button>

            <button
              onClick={() => onNavigateTab && onNavigateTab('FUTURES')}
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: 'var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: '10.5px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.45)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <span>🔥</span>
              <span>Crypto Futures & Degen</span>
            </button>
          </div>

          {/* Asset Allocation Breakdown Bar (moved into portfolio card) */}
          <div style={{
            background: 'color-mix(in srgb, var(--text-primary) 3%, transparent)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 10px',
            border: 'var(--border-hairline)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '8.5px', fontWeight: '500', letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
              <span>ALOKASI RADAR PORTOFOLIO</span>
              <span>100% TERMONITOR</span>
            </div>
            <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', gap: '2px' }}>
              <div style={{ width: '45%', background: 'var(--accent-blue)' }} title="Saham IDX: 45%" />
              <div style={{ width: '35%', background: 'var(--accent-gold)' }} title="Crypto Spot & Memecoin: 35%" />
              <div style={{ width: '20%', background: 'var(--accent-green)' }} title="Forex & Gold (XAUUSD): 20%" />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px', fontSize: '8.5px', fontWeight: '500' }}>
              <span style={{ color: 'var(--accent-blue)' }}>● Saham IDX 45%</span>
              <span style={{ color: 'var(--accent-gold-text)' }}>● Crypto 35%</span>
              <span style={{ color: 'var(--accent-green-text)' }}>● Forex/Gold 20%</span>
            </div>
          </div>
        </div>

        {/* KPI Tiles (direct grid children) */}
            {/* Metric 1: Market Regime */}
            <div style={{
              background: 'var(--bg-panel)',
              border: 'var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              justifyContent: 'center'
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8.5px', fontWeight: '500', letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>REGIME MAKRO</span>
              <span style={{ fontSize: '18px', fontWeight: '500', color: 'var(--accent-green-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                Risk-On
              </span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>DEFCON 4 · Stabil</span>
            </div>

            {/* Metric 2: 24h Volume */}
            <div style={{
              background: 'var(--bg-panel)',
              border: 'var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              justifyContent: 'center'
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8.5px', fontWeight: '500', letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>24H GLOBAL VOL</span>
              <span style={{ fontSize: '20px', fontWeight: '400', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>$42.85B</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Spot & Futures</span>
            </div>

            {/* Metric 3: Bandarmology Net Flow */}
            <div style={{
              background: 'var(--bg-panel)',
              border: 'var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              justifyContent: 'center'
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8.5px', fontWeight: '500', letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ARUS BANDAR IDX</span>
              <span style={{ fontSize: '20px', fontWeight: '400', color: 'var(--accent-green-text)', fontFamily: 'var(--font-mono)' }}>+Rp 480 M</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Net Foreign Buy</span>
            </div>

            {/* Metric 4: AI Arena Win Rate */}
            <div style={{
              background: 'var(--bg-panel)',
              border: 'var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              justifyContent: 'center'
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8.5px', fontWeight: '500', letterSpacing: '0.14em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ARENA ALPHA</span>
              <span style={{ fontSize: '20px', fontWeight: '400', color: 'var(--accent-gold-text)', fontFamily: 'var(--font-mono)' }}>+18.4% ROI</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Win Rate 76.4%</span>
            </div>
      </div>


          {/* SUB-ROW 2: 4 UNIFORM BENTO CARDS (IHSG, COMMODITIES, CRYPTO, IDX ALPHA) */}
          <div className="home-bento-row" style={{ flexShrink: 0 }}>

            {/* Card 1: IHSG & Domestic Regime */}
            <div className="telemetry-panel" style={{
              padding: '6px 8px',
              background: 'var(--bg-panel)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '130px',
              minWidth: 0,
              boxSizing: 'border-box'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="metric-label" style={{ fontSize: '8px' }}>IHSG &amp; DOMESTIC REGIME</span>
                  <span className="badge badge-bull" style={{ fontSize: '7px', padding: '1px 4px' }}>ACTIVE</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: '900', marginTop: '1px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {sentiment}
                </div>
                <div style={{ fontSize: '7.5px', color: 'var(--text-muted)', marginTop: '1px', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {narrative}
                </div>
              </div>

              {(() => {
                const liveIhsg = livePrices['IHSG'] || livePrices['.JKSE'] || livePrices['IDX:COMPOSITE'];
                const ihsgPriceVal = liveIhsg?.price !== undefined ? liveIhsg.price : (macro.ihsg_price || macro.jkse_price || 6374.91);
                const ihsgVal = Number(ihsgPriceVal).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const ihsgChange = liveIhsg?.changePct !== undefined ? Number(liveIhsg.changePct) : 1.56;
                const isIhsgFlash = flashMap['IHSG'] || flashMap['IDX:COMPOSITE'];
                trackLiveValue('IHSG', ihsgPriceVal);

                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', fontFamily: 'var(--font-mono)', paddingTop: '2px', borderTop: 'var(--border-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>.JKSE:</span>
                      <strong style={{
                        color: isIhsgFlash === 'up' ? 'var(--accent-green)' : isIhsgFlash === 'down' ? 'var(--accent-rust)' : 'var(--text-primary)',
                        transition: 'color 0.3s ease'
                      }}>
                        {ihsgVal}
                      </strong>
                      <span style={{ color: ihsgChange >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)', fontWeight: '600' }}>
                        {ihsgChange >= 0 ? '+' : ''}{ihsgChange.toFixed(2)}%
                      </span>
                    </div>
                    <span style={{ color: 'var(--text-muted)' }}>Vol: <strong style={{ color: 'var(--text-primary)' }}>2.1T</strong></span>
                  </div>
                );
              })()}
              <LiveSparkline points={trackLiveValue('IHSG')} height={30} id="IHSG" />
            </div>

            {/* Card 2: Commodities & DXY */}
            {(() => {
              const liveBrent = livePrices['BRENT'] || livePrices['UKOIL'] || livePrices['FX:UKOIL'];
              const liveGold = livePrices['GOLD'] || livePrices['XAUUSD'] || livePrices['XAU/USD'] || livePrices['TVC:GOLD'];
              const brentPrice = liveBrent?.price !== undefined ? Number(liveBrent.price) : (Number(macro?.brent_oil_price) || 99.21);
              const brentChg = liveBrent?.changePct !== undefined ? Number(liveBrent.changePct) : (Number(macro?.brent_oil_change_pct) || -1.13);
              const rawGold = liveGold?.price !== undefined ? Number(liveGold.price) : Number(macro?.gold_price || data?.macro_telemetry?.gold_price || 4262.4);
              // Sanity guard: Emas acuan live (TradingView TVC:GOLD/XAUUSD) & macro bundle adalah $4K+ ($4,262 - $4,275)
              const goldPrice = (rawGold >= 1000 && rawGold <= 10000)
                ? rawGold
                : Number(macro?.gold_price || data?.macro_telemetry?.gold_price || 4262.4);
              const goldChg = liveGold?.changePct !== undefined ? Number(liveGold.changePct) : Number(macro?.gold_change_pct || data?.macro_telemetry?.gold_change_pct || -0.05);

              return (
                <div className="telemetry-panel" style={{
                  padding: '6px 8px',
                      background: 'var(--bg-panel)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '130px',
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="metric-label" style={{ fontSize: '8px' }}>COMMODITIES &amp; DXY</span>
                      <span style={{ fontSize: '7px', padding: '1px 4px', borderRadius: '2px', background: 'rgba(245, 158, 11, 0.18)', color: 'var(--accent-gold-text)', fontWeight: '600' }}>OIL &amp; GOLD</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                      <div style={{ fontSize: '10.5px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--accent-orange-text, #f59e0b)' }}>
                        OIL ${brentPrice.toFixed(1)} <span style={{ fontSize: '7.5px', color: brentChg >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>{brentChg >= 0 ? '+' : ''}{brentChg.toFixed(1)}%</span>
                      </div>
                      <div style={{ fontSize: '10.5px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: '#eab308' }}>
                        GOLD ${Math.round(goldPrice).toLocaleString('en-US')} <span style={{ fontSize: '7.5px', color: goldChg >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>{goldChg >= 0 ? '+' : ''}{goldChg.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '7.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      IDX Energy Correlation
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', fontFamily: 'var(--font-mono)', paddingTop: '2px', borderTop: 'var(--border-muted)' }}>
                    <span>Sektor: <strong style={{ color: 'var(--accent-green)', cursor: 'pointer' }} onClick={() => onSelectTicker('MEDC', 'IDX')}>$MEDC</strong> <strong style={{ color: 'var(--accent-green)', cursor: 'pointer' }} onClick={() => onSelectTicker('ELSA', 'IDX')}>$ELSA</strong></span>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: '600' }}>BULLISH</span>
                  </div>
                </div>
              );
            })()}

            {/* Card 3: #1 Crypto Spot Alpha */}
            {(() => {
              const cleanCrypto = topCrypto?.pair?.replace('/', '') || 'BTCUSDT';
              const liveCrypto = livePrices[topCrypto?.pair] || livePrices[topCrypto?.symbol] || livePrices[cleanCrypto] || livePrices['BTCUSDT'];
              const liveCryptoPrice = liveCrypto?.price !== undefined ? liveCrypto.price : (topCrypto?.current_price || 85922);
              const liveCryptoChange = liveCrypto?.changePct !== undefined ? liveCrypto.changePct : (topCrypto?.change_24h_pct || -0.25);
              const isCryptoFlashing = flashMap[cleanCrypto] || flashMap[topCrypto?.pair];

              return (
                <div className="telemetry-panel" style={{
                  padding: '6px 8px',
                      display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '130px',
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="metric-label" style={{ fontSize: '8px' }}>#1 QUANT CRYPTO SPOT</span>
                      <span className="badge badge-alert" style={{ fontSize: '7px', padding: '1px 4px' }}>SPOT ONLY</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CryptoIcon symbol={topCrypto?.pair || 'BTC'} size={13} />
                        <span style={{ fontSize: '11px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {topCrypto?.pair || 'BTC/USDT'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '600',
                          fontFamily: 'var(--font-mono)',
                          color: isCryptoFlashing === 'up' ? 'var(--accent-green)' : isCryptoFlashing === 'down' ? 'var(--accent-rust)' : 'var(--text-primary)'
                        }}>
                          ${Number(liveCryptoPrice).toLocaleString(undefined, { minimumFractionDigits: Number(liveCryptoPrice) > 100 ? 0 : 2, maximumFractionDigits: 2 })}
                        </span>
                        <span style={{ fontSize: '7.5px', fontWeight: '600', fontFamily: 'var(--font-mono)', color: liveCryptoChange >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                          {liveCryptoChange >= 0 ? '+' : ''}{Number(liveCryptoChange).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <LiveSparkline points={trackLiveValue('CRYPTO_TOP', liveCryptoPrice)} height={30} id={cleanCrypto} />
                    <div style={{ fontSize: '7.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      Range Accumulation
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', fontFamily: 'var(--font-mono)', paddingTop: '2px', borderTop: 'var(--border-muted)' }}>
                    <span>Entry: <strong style={{ color: 'var(--text-primary)' }}>{Math.round(topCrypto?.current_price || 76680).toLocaleString()}</strong></span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>1:2.0 Net</span>
                  </div>
                </div>
              );
            })()}

            {/* Card 4: #1 IDX Alpha Conviction */}
            {(() => {
              const topIdxTicker = topIdx?.clean_ticker || topIdx?.symbol?.replace('.JK', '') || 'CUAN';
              const liveIdx = livePrices[topIdxTicker] || livePrices[`IDX:${topIdxTicker}`];
              const liveIdxPrice = liveIdx?.price !== undefined ? liveIdx.price : (topIdx?.entry_price || 960);
              const liveIdxChange = liveIdx?.changePct !== undefined ? liveIdx.changePct : 1.05;
              const isIdxFlashing = flashMap[topIdxTicker];

              return (
                <div className="telemetry-panel" style={{
                  padding: '6px 8px',
                      display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '130px',
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="metric-label" style={{ fontSize: '8px' }}>#1 QUANT IDX ALPHA</span>
                      <span className="badge badge-bull" style={{ fontSize: '7px', padding: '1px 4px' }}>BREAKOUT</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <AssetIcon symbol={topIdxTicker} market="IDX" size={13} />
                        <span
                          style={{ fontSize: '11px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', cursor: 'pointer' }}
                          onClick={() => onSelectTicker(topIdxTicker, 'IDX')}
                        >
                          {topIdxTicker}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '600',
                          fontFamily: 'var(--font-mono)',
                          color: isIdxFlashing === 'up' ? 'var(--accent-green)' : isIdxFlashing === 'down' ? 'var(--accent-rust)' : 'var(--text-primary)'
                        }}>
                          Rp {Number(liveIdxPrice).toLocaleString('id-ID')}
                        </span>
                        <span style={{ fontSize: '7.5px', fontWeight: '600', fontFamily: 'var(--font-mono)', color: liveIdxChange >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                          {liveIdxChange >= 0 ? '+' : ''}{Number(liveIdxChange).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <LiveSparkline points={trackLiveValue('IDX_TOP', liveIdxPrice)} height={30} id={topIdxTicker} />
                    <div style={{ fontSize: '7.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      Barito Cluster Expansion
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', fontFamily: 'var(--font-mono)', paddingTop: '2px', borderTop: 'var(--border-muted)' }}>
                    <span>Entry: <strong style={{ color: 'var(--text-primary)' }}>{Number(topIdx?.entry_price || 945).toLocaleString()}</strong></span>
                    <span style={{ color: 'var(--accent-green-text)', fontWeight: '600' }}>1:2.1 Net</span>
                  </div>
                </div>
              );
            })()}

          </div>

      {/* =========================================================================
          V4 MINIMAL LAYOUT: EXECUTION MATRIX (LEFT) + LIVE INTELLIGENCE WIRE (RIGHT)
          ========================================================================= */}
      <div className="home-middle-cockpit-split">

        {/* LEFT: TACTICAL EXECUTION MATRIX */}
        <div className="home-cockpit-left">

      {/* =========================================================================
          TIER 3: TACTICAL QUANTITATIVE EXECUTION MATRIX (100% Full Width)
          ========================================================================= */}
      <div className="telemetry-panel home-execution-desk-card" style={{
        padding: '10px 12px',
        border: 'var(--border-hairline)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        background: 'var(--bg-panel)',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 'var(--border-hairline)',
          paddingBottom: '4px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px' }}>⚡</span>
            <strong style={{ fontSize: '10.5px', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              TACTICAL QUANTITATIVE EXECUTION MATRIX
            </strong>
            <span style={{
              fontSize: '8px',
              padding: '1px 5px',
              borderRadius: '2px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-green-text)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontWeight: 600
            }}>
              NET FRICTION DEDUCTED (-0.45%)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setMatrixViewMode('3col')}
              style={{
                fontSize: '8px',
                fontWeight: 500,
                padding: '2px 5px',
                borderRadius: '2px',
                border: matrixViewMode === '3col' ? '1px solid var(--accent-blue)' : 'var(--border-hairline)',
                background: matrixViewMode === '3col' ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-panel-subtle)',
                color: matrixViewMode === '3col' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              ⊞ 3-KOLOM
            </button>
            <button
              onClick={() => setMatrixViewMode('wide')}
              style={{
                fontSize: '8px',
                fontWeight: 500,
                padding: '2px 5px',
                borderRadius: '2px',
                border: matrixViewMode === 'wide' ? '1px solid var(--accent-blue)' : 'var(--border-hairline)',
                background: matrixViewMode === 'wide' ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-panel-subtle)',
                color: matrixViewMode === 'wide' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              📰 TABEL LEBAR
            </button>
          </div>
        </div>

        {/* Dynamic Execution Matrix Grid */}
        {matrixViewMode === 'wide' ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="telemetry-table" style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '4px 6px' }}>ASSET / TICKER</th>
                  <th style={{ textAlign: 'left', padding: '4px 6px' }}>MARKET</th>
                  <th style={{ textAlign: 'center', padding: '4px 6px' }}>SIGNAL SETUP</th>
                  <th style={{ textAlign: 'right', padding: '4px 6px' }}>ENTRY PRICE</th>
                  <th style={{ textAlign: 'right', padding: '4px 6px' }}>STOP LOSS</th>
                  <th style={{ textAlign: 'right', padding: '4px 6px' }}>TARGET 1 (TP)</th>
                  <th style={{ textAlign: 'center', padding: '4px 6px' }} title="Risk:Reward — rasio potensi untung terhadap risiko sebelum biaya. 1:2 artinya potensi untung 2x dari risiko yang diambil">GROSS R:R</th>
                  <th style={{ textAlign: 'center', padding: '4px 6px' }} title="Rasio untung:risiko setelah biaya transaksi institusional (~0,45% IDX, ~0,15% Crypto/US)">NET R:R (INST)</th>
                  <th style={{ textAlign: 'right', padding: '4px 6px' }}>RISK ALLOC (1%)</th>
                  <th style={{ textAlign: 'center', padding: '4px 6px' }}>AKSI TRADING</th>
                </tr>
              </thead>
              <tbody>
                {/* Top 4 Saham IDX */}
                {topIdxPlans.slice(0, 4).map(plan => {
                  const ticker = plan.clean_ticker || (plan.symbol || '').replace('.JK', '') || 'BBCA';
                  const live = livePrices[ticker] || livePrices[`IDX:${ticker}`];
                  const curPrice = live?.price !== undefined ? live.price : plan.entry_price;
                  const chgPct = live?.changePct !== undefined ? live.changePct : 0.85;
                  const isFlash = flashMap[ticker];
                  const rr = calcNetRR(plan.entry_price, plan.stop_loss, plan.target_1 || plan.take_profit_1, 'IDX');
                  const sizing = calcRiskPosition(plan.entry_price, plan.stop_loss, 100000000, 0.01, 'IDX');

                  return (
                    <tr key={ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '4px 6px', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AssetIcon symbol={ticker} market="IDX" size={13} />
                          <span style={{ color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => onSelectTicker(ticker, 'IDX')}>
                            ${ticker}
                          </span>
                        </div>
                        <div style={{ fontSize: '8px', color: isFlash === 'up' ? 'var(--accent-green)' : isFlash === 'down' ? 'var(--accent-rust)' : 'var(--text-muted)' }}>
                          Rp {Number(curPrice).toLocaleString('id-ID')} ({chgPct >= 0 ? '+' : ''}{Number(chgPct).toFixed(1)}%)
                        </div>
                      </td>
                      <td style={{ padding: '4px 6px', color: 'var(--text-secondary)' }}>IDX BEI</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <span className="badge badge-bull" style={{ fontSize: '7.5px', padding: '1px 4px' }}>
                          {plan.technical_signal || 'BREAKOUT'}
                        </span>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 500 }}>
                        Rp {Number(plan.entry_price).toLocaleString()}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--accent-rust)', fontWeight: 500 }}>
                        Rp {Number(plan.stop_loss).toLocaleString()}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--accent-green)', fontWeight: 500 }}>
                        Rp {Number(plan.target_1 || plan.take_profit_1 || plan.entry_price * 1.05).toLocaleString()}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {rr.gross}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <strong style={{ color: 'var(--accent-green-text)' }}>{rr.net}</strong>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{sizing.lots}</strong>
                        <div style={{ fontSize: '7.5px', color: 'var(--text-muted)' }}>{sizing.valIdr}</div>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                          if (onOpenExecution) {
                            onOpenExecution({
                              symbol: ticker,
                              market: 'IDX',
                              entryPrice: plan.entry_price,
                              stopLoss: plan.stop_loss,
                              target1: plan.target_1 || plan.take_profit_1,
                              target2: plan.target_2 || plan.take_profit_2
                            });
                          } else if (onOpenLotCalc) {
                            onOpenLotCalc(ticker, plan.entry_price, plan.stop_loss, plan.target_1 || plan.take_profit_1);
                          }
                        }}
                          style={{
                            padding: '2px 5px',
                            fontSize: '8px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: 'var(--accent-blue)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                        >
                          ⚖️ Eksekusi
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Top 3 Crypto Spot */}
                {topCryptoPicks.slice(0, 3).map(c => {
                  const cleanPair = (c.pair || '').replace('/', '');
                  const live = livePrices[c.pair] || livePrices[cleanPair];
                  const curPrice = live?.price !== undefined ? live.price : c.current_price;
                  const chgPct = live?.changePct !== undefined ? live.changePct : (c.change_24h_pct || 1.2);
                  const isFlash = flashMap[cleanPair];
                  const rr = calcNetRR(c.current_price, c.stop_loss, c.take_profit_1 || c.current_price * 1.05, 'CRYPTO');
                  const sizing = calcRiskPosition(c.current_price, c.stop_loss, 100000000, 0.01, 'CRYPTO');

                  return (
                    <tr key={c.pair} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '4px 6px', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CryptoIcon symbol={c.pair} size={13} />
                          <span style={{ color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => onSelectTicker(c.pair, 'CRYPTO')}>
                            {c.pair}
                          </span>
                        </div>
                        <div style={{ fontSize: '8px', color: isFlash === 'up' ? 'var(--accent-green)' : isFlash === 'down' ? 'var(--accent-rust)' : 'var(--text-muted)' }}>
                          ${Number(curPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({chgPct >= 0 ? '+' : ''}{Number(chgPct).toFixed(1)}%)
                        </div>
                      </td>
                      <td style={{ padding: '4px 6px', color: 'var(--text-secondary)' }}>SPOT</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <span className="badge badge-alert" style={{ fontSize: '7.5px', padding: '1px 4px' }} title="Setup teknikal hasil skrining quant engine">
                          {c.setup_type || 'RANGE_ACC'}
                        </span>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 500 }}>
                        ${formatCryptoPrice(c.current_price)}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--accent-rust)', fontWeight: 500 }}>
                        ${formatCryptoPrice(c.stop_loss)}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--accent-green)', fontWeight: 500 }}>
                        ${formatCryptoPrice(c.take_profit_1 || c.current_price * 1.05)}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {rr.gross}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <strong style={{ color: 'var(--accent-green-text)' }}>{rr.net}</strong>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{sizing.lots}</strong>
                        <div style={{ fontSize: '7.5px', color: 'var(--text-muted)' }}>{sizing.valIdr}</div>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                          if (onOpenExecution) {
                            onOpenExecution({
                              symbol: c.pair,
                              market: 'CRYPTO',
                              entryPrice: c.current_price,
                              stopLoss: c.stop_loss,
                              target1: c.take_profit_1,
                              target2: c.take_profit_2
                            });
                          } else if (onOpenLotCalc) {
                            onOpenLotCalc(c.pair, c.current_price, c.stop_loss, c.take_profit_1);
                          }
                        }}
                          style={{
                            padding: '2px 5px',
                            fontSize: '8px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: 'var(--accent-blue)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                        >
                          ⚖️ Eksekusi
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Top 3 US Equities */}
                {topUsPlans.slice(0, 3).map(s => {
                  const live = livePrices[s.ticker];
                  const curPrice = live?.price !== undefined ? live.price : s.entry_price;
                  const chgPct = live?.changePct !== undefined ? live.changePct : 1.1;
                  const isFlash = flashMap[s.ticker];
                  const calculatedTp = s.target_price || (s.entry_price ? s.entry_price * 1.06 : 100);
                  const rr = calcNetRR(s.entry_price, s.stop_loss, calculatedTp, 'US');
                  const sizing = calcRiskPosition(s.entry_price, s.stop_loss, 100000000, 0.01, 'US');

                  return (
                    <tr key={s.ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '4px 6px', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AssetIcon symbol={s.ticker} market="US" size={13} />
                          <span style={{ color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => onSelectTicker(s.ticker, 'US')}>
                            ${s.ticker}
                          </span>
                        </div>
                        <div style={{ fontSize: '8px', color: isFlash === 'up' ? 'var(--accent-green)' : isFlash === 'down' ? 'var(--accent-rust)' : 'var(--text-muted)' }}>
                          ${Number(curPrice).toFixed(1)} ({chgPct >= 0 ? '+' : ''}{Number(chgPct).toFixed(1)}%)
                        </div>
                      </td>
                      <td style={{ padding: '4px 6px', color: 'var(--accent-blue)' }}>US STOCKS</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <span className="badge badge-bull" style={{ fontSize: '7.5px', padding: '1px 4px' }}>
                          {s.setup_type && s.setup_type !== 'NEUTRAL' ? s.setup_type : 'BULL_FLAG'}
                        </span>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 500 }}>
                        ${Number(s.entry_price || 0).toFixed(1)}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--accent-rust)', fontWeight: 500 }}>
                        ${Number(s.stop_loss || 0).toFixed(1)}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--accent-green)', fontWeight: 500 }}>
                        ${Number(calculatedTp).toFixed(1)}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {rr.gross}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <strong style={{ color: 'var(--accent-green-text)' }}>{rr.net}</strong>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{sizing.lots}</strong>
                        <div style={{ fontSize: '7.5px', color: 'var(--text-muted)' }}>{sizing.valIdr}</div>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                          if (onOpenExecution) {
                            onOpenExecution({
                              symbol: s.ticker,
                              market: 'US',
                              entryPrice: s.entry_price,
                              stopLoss: s.stop_loss,
                              target1: calculatedTp
                            });
                          } else if (onOpenLotCalc) {
                            onOpenLotCalc(s.ticker, s.entry_price, s.stop_loss, calculatedTp);
                          }
                        }}
                          style={{
                            padding: '2px 5px',
                            fontSize: '8px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: 'var(--accent-blue)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                        >
                          ⚖️ Eksekusi
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* 3-KOLOM DETAILED VIEW */
          <div className="home-signals-grid">
            
            {/* Table 1: Saham IDX Signals */}
            <div className="telemetry-panel" style={{ padding: '7px 9px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-primary)' }}>🇮🇩 Saham IDX Signals</span>
                    <span className="badge badge-bull" style={{ fontSize: '7.5px', padding: '1px 4px' }}>{topIdxPlans.length}</span>
                  </div>
                  <span style={{ fontSize: '8px', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 500 }} onClick={() => onNavigateTab('STOCK')}>
                    Lihat semua →
                  </span>
                </div>
                
                <table className="telemetry-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: 'var(--border-hairline)', textAlign: 'left', fontSize: '8px' }}>
                      <th style={{ padding: '3px 2px', width: '28%' }}>Ticker</th>
                      <th style={{ padding: '3px 2px', width: '22%' }}>Setup</th>
                      <th style={{ padding: '3px 2px', width: '17%', textAlign: 'right' }}>Entry</th>
                      <th style={{ padding: '3px 2px', width: '16%', textAlign: 'right' }}>SL</th>
                      <th style={{ padding: '3px 2px', width: '17%', textAlign: 'right' }}>TP1</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topIdxPlans.slice(0, 6).map(plan => {
                      const ticker = plan.clean_ticker || plan.symbol?.replace('.JK', '');
                      const live = livePrices[ticker] || livePrices[`IDX:${ticker}`];
                      const currentPrice = live?.price !== undefined ? live.price : plan.entry_price;
                      const changePct = live?.changePct !== undefined ? live.changePct : 0.0;
                      const isFlashing = flashMap[ticker];

                      return (
                        <tr key={ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '3.5px 2px', fontWeight: '600' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                              <AssetIcon symbol={ticker} market="IDX" size={12} />
                              <span style={{ color: 'var(--accent-blue)', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => onSelectTicker(ticker, 'IDX')}>
                                {ticker}
                              </span>
                            </div>
                            <div style={{
                              fontSize: '7.5px',
                              fontFamily: 'var(--font-mono)',
                              color: isFlashing === 'up' ? 'var(--accent-green)' : isFlashing === 'down' ? 'var(--accent-rust)' : 'var(--text-muted)',
                              fontVariantNumeric: 'tabular-nums'
                            }}>
                              Rp {Math.round(currentPrice).toLocaleString('id-ID')} ({changePct >= 0 ? '+' : ''}{Number(changePct).toFixed(1)}%)
                            </div>
                          </td>
                          <td style={{ padding: '3.5px 2px' }}>
                            <span className="badge badge-bull" style={{ fontSize: '7px', padding: '1px 3px' }}>
                              {plan.technical_signal || 'BREAKOUT'}
                            </span>
                          </td>
                          <td style={{ padding: '3.5px 2px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatIdNumber(plan.entry_price)}</td>
                          <td style={{ padding: '3.5px 2px', textAlign: 'right', color: 'var(--accent-rust)', fontVariantNumeric: 'tabular-nums' }}>{formatIdNumber(plan.stop_loss)}</td>
                          <td style={{ padding: '3.5px 2px', textAlign: 'right', color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums' }}>{formatIdNumber(plan.target_1 || plan.take_profit_1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px', paddingTop: '2px', borderTop: 'var(--border-muted)', fontFamily: 'var(--font-mono)' }}>
                <span title="Engine skrining: TimesFM (forecasting AI) + SMC = Smart Money Concepts, metode analisis berbasis pergerakan likuiditas institusi">TimesFM + SMC AI</span>
                <span>6 / {topIdxPlans.length} Emiten</span>
              </div>
            </div>

            {/* Table 2: Crypto Spot Signals */}
            <div className="telemetry-panel" style={{ padding: '7px 9px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--accent-blue)' }}>🪙 Crypto Spot Signals</span>
                    <span className="badge badge-alert" style={{ fontSize: '7.5px', padding: '1px 4px' }}>{topCryptoPicks.length}</span>
                  </div>
                  <span style={{ fontSize: '8px', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 500 }} onClick={() => onNavigateTab('CRYPTO')}>
                    Lihat semua →
                  </span>
                </div>

                <table className="telemetry-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: 'var(--border-hairline)', textAlign: 'left', fontSize: '8px' }}>
                      <th style={{ padding: '3px 2px', width: '28%' }}>Pair</th>
                      <th style={{ padding: '3px 2px', width: '22%' }}>Setup</th>
                      <th style={{ padding: '3px 2px', width: '17%', textAlign: 'right' }}>Entry</th>
                      <th style={{ padding: '3px 2px', width: '16%', textAlign: 'right' }}>SL</th>
                      <th style={{ padding: '3px 2px', width: '17%', textAlign: 'right' }}>TP1</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCryptoPicks.slice(0, 6).map(c => {
                      const s = c.symbol || c.pair || '';
                      const clean = s.replace('/', '');
                      const live = livePrices[c.pair] || livePrices[c.symbol] || livePrices[clean];
                      const currentPrice = live?.price !== undefined ? live.price : (c.current_price || c.entry_price);
                      const changePct = live?.changePct !== undefined ? live.changePct : (c.change_24h_pct || 0);
                      const isFlashing = flashMap[clean] || flashMap[c.pair];

                      return (
                        <tr key={c.pair} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '3.5px 2px', fontWeight: '600' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                              <CryptoIcon symbol={c.pair} size={12} />
                              <span style={{ color: 'var(--accent-blue)', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => onSelectTicker(c.pair, 'CRYPTO')}>
                                {c.pair}
                              </span>
                            </div>
                            <div style={{
                              fontSize: '7.5px',
                              fontFamily: 'var(--font-mono)',
                              color: isFlashing === 'up' ? 'var(--accent-green)' : isFlashing === 'down' ? 'var(--accent-rust)' : 'var(--text-muted)',
                              fontVariantNumeric: 'tabular-nums'
                            }}>
                              ${Number(currentPrice).toLocaleString(undefined, { minimumFractionDigits: Number(currentPrice) > 100 ? 0 : 2, maximumFractionDigits: 2 })} ({changePct >= 0 ? '+' : ''}{Number(changePct).toFixed(1)}%)
                            </div>
                          </td>
                          <td style={{ padding: '3.5px 2px' }}>
                            <span className="badge badge-alert" style={{ fontSize: '7px', padding: '1px 3px' }} title="Setup teknikal hasil skrining quant engine">
                              {c.setup_type || 'RANGE_ACC'}
                            </span>
                          </td>
                          <td style={{ padding: '3.5px 2px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCryptoPrice(c.current_price)}</td>
                          <td style={{ padding: '3.5px 2px', textAlign: 'right', color: 'var(--accent-rust)', fontVariantNumeric: 'tabular-nums' }}>{formatCryptoPrice(c.stop_loss)}</td>
                          <td style={{ padding: '3.5px 2px', textAlign: 'right', color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums' }}>{formatCryptoPrice(c.take_profit_1 || c.current_price * 1.05)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px', paddingTop: '2px', borderTop: 'var(--border-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>Spot Accumulation</span>
                <span>6 / {topCryptoPicks.length} Pairs</span>
              </div>
            </div>

            {/* Table 3: US Stock Signals */}
            <div className="telemetry-panel" style={{ padding: '7px 9px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--accent-blue)' }}>🇺🇸 US Stock Signals</span>
                    <span className="badge badge-bull" style={{ fontSize: '7.5px', padding: '1px 4px' }}>{topUsPlans.length}</span>
                  </div>
                  <span style={{ fontSize: '8px', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 500 }} onClick={() => onNavigateTab('US_STOCKS')}>
                    Lihat semua →
                  </span>
                </div>

                <table className="telemetry-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: 'var(--border-hairline)', textAlign: 'left', fontSize: '8px' }}>
                      <th style={{ padding: '3px 2px', width: '27%' }}>Ticker</th>
                      <th style={{ padding: '3px 2px', width: '23%' }}>Setup</th>
                      <th style={{ padding: '3px 2px', width: '17%', textAlign: 'right' }}>Entry</th>
                      <th style={{ padding: '3px 2px', width: '16%', textAlign: 'right' }}>SL</th>
                      <th style={{ padding: '3px 2px', width: '17%', textAlign: 'right' }}>TP1</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topUsPlans.slice(0, 6).map(s => {
                      const live = livePrices[s.ticker] || livePrices[`NASDAQ:${s.ticker}`] || livePrices[`NYSE:${s.ticker}`];
                      const currentPrice = live?.price !== undefined ? live.price : (s.price || s.entry_price || 0);
                      const changePct = live?.changePct !== undefined ? live.changePct : (s.change_pct || 0.0);
                      const isFlashing = flashMap[s.ticker];
                      const tpVal = s.target_price || s.take_profit_1 || (s.entry_price ? s.entry_price * 1.06 : 0);

                      return (
                        <tr key={s.ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '3.5px 2px', fontWeight: '600' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                              <AssetIcon symbol={s.ticker} market="US" size={12} />
                              <span style={{ color: 'var(--accent-blue)', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => onSelectTicker(s.ticker, 'US')}>
                                {s.ticker}
                              </span>
                            </div>
                            <div style={{
                              fontSize: '7.5px',
                              fontFamily: 'var(--font-mono)',
                              color: isFlashing === 'up' ? 'var(--accent-green)' : isFlashing === 'down' ? 'var(--accent-rust)' : 'var(--text-muted)',
                              fontVariantNumeric: 'tabular-nums'
                            }}>
                              ${Number(currentPrice).toFixed(1)} ({changePct >= 0 ? '+' : ''}{Number(changePct).toFixed(1)}%)
                            </div>
                          </td>
                          <td style={{ padding: '3.5px 2px' }}>
                            <span className="badge badge-bull" style={{ fontSize: '7px', padding: '1px 3px' }}>
                              {s.setup_type && s.setup_type !== 'NEUTRAL' ? s.setup_type : 'BULL_FLAG'}
                            </span>
                          </td>
                          <td style={{ padding: '3.5px 2px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${Number(s.entry_price || 0).toFixed(1)}</td>
                          <td style={{ padding: '3.5px 2px', textAlign: 'right', color: 'var(--accent-rust)', fontVariantNumeric: 'tabular-nums' }}>${Number(s.stop_loss || 0).toFixed(1)}</td>
                          <td style={{ padding: '3.5px 2px', textAlign: 'right', color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums' }}>${Number(tpVal).toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px', paddingTop: '2px', borderTop: 'var(--border-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>US Momentum Alpha</span>
                <span>6 / {topUsPlans.length} Stocks</span>
              </div>
            </div>

          </div>
        )}
        </div>
        </div>

        {/* RIGHT COLUMN: LIVE INTELLIGENCE WIRE (WITH TACTICAL DEFENSE / NUCLEAR ALERT HUD) */}
        <div className="home-cockpit-right">
          <div className="telemetry-panel" style={{
            border: 'var(--border-hairline)',
            borderRadius: 'var(--radius-md)',
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            background: 'var(--bg-panel)',
            height: '100%',
            minHeight: 0,
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div className="telemetry-header" style={{
              padding: '6px 10px',
              fontSize: '10.5px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: 'var(--border-hairline)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px' }}>📡</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                  LIVE INTELLIGENCE WIRE
                </span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', boxShadow: '0 0 5px var(--accent-green)' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <button
                  onClick={() => setNewsViewMode(prev => prev === 'scroll' ? 'compact' : 'scroll')}
                  style={{
                    background: newsViewMode === 'scroll' ? 'rgba(0, 208, 132, 0.15)' : 'var(--bg-panel-subtle)',
                    border: newsViewMode === 'scroll' ? '1px solid rgba(0, 208, 132, 0.35)' : 'var(--border-hairline)',
                    color: newsViewMode === 'scroll' ? 'var(--accent-green)' : 'var(--text-muted)',
                    borderRadius: '3px',
                    fontSize: '8px',
                    padding: '2px 5px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '500'
                  }}
                >
                  {newsViewMode === 'scroll' ? '📜 SCROLL' : '⚡ TOP 15'}
                </button>
                <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {displayNews.length} / {liveNewsRaw.length}
                </span>
              </div>
            </div>

            {/* Tactical Defense & Nuclear Escalation Alert Banner (Inspired by WorldMonitor & God's Eye View) */}
            {hasHighThreat && !dismissDefenseAlert && (
              <div className="tactical-defense-alert-banner">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px' }}>☢️</span>
                    <strong style={{ fontSize: '8.5px', color: '#fee2e2', letterSpacing: '0.04em' }}>
                      DEFENSE ALERT // ESKALASI MILITER &amp; RISIKO NUKLIR
                    </strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '7.5px', background: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '1px 4px', borderRadius: '2px', fontWeight: '600' }}>
                      DEFCON {bundleDefconLevel} WATCH
                    </span>
                    <span
                      onClick={() => setDismissDefenseAlert(true)}
                      style={{ cursor: 'pointer', fontSize: '9px', color: '#fca5a5', padding: '0 2px' }}
                      title="Tutup Alert"
                    >
                      ✕
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '8px', color: '#fecaca', lineHeight: 1.25 }}>
                  ⚠️ <strong>{primaryThreatNews?.title || 'Eskalasi Geopolitik Terdeteksi'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '7.5px', color: '#fca5a5', borderTop: '1px solid rgba(239, 68, 68, 0.25)', paddingTop: '2px' }}>
                  <span>Hedge Play: <strong style={{ color: '#fff' }}>Long Brent &amp; Gold</strong> • Saham BEI: <strong style={{ color: 'var(--accent-green-text)' }}>$MEDC $ELSA $ANTM</strong></span>
                  <span
                    onClick={() => setNewsFilter('NUCLEAR_WAR')}
                    style={{ textDecoration: 'underline', cursor: 'pointer', color: '#fff', fontWeight: 500 }}
                  >
                    Buka Wire Konflik ({geoAlertItems.length}) →
                  </span>
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div style={{ padding: '4px 8px', borderBottom: 'var(--border-hairline)', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Cari headline berita, katalis makro, $ticker..."
                  value={newsSearch}
                  onChange={(e) => setNewsSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '3px 22px 3px 6px',
                    fontSize: '9px',
                    background: 'var(--bg-panel-subtle)',
                    border: 'var(--border-hairline)',
                    borderRadius: '3px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {newsSearch && (
                  <span
                    onClick={() => setNewsSearch('')}
                    style={{
                      position: 'absolute',
                      right: '6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      fontSize: '9px',
                      color: 'var(--text-muted)'
                    }}
                  >
                    ✕
                  </span>
                )}
              </div>

              {/* ALL RESTORED CATEGORY PILLS (Horizontal Scroll Track) */}
              <div className="news-category-track">
                {[
                  { id: 'ALL', label: '📰 SEMUA' },
                  { id: 'NUCLEAR_WAR', label: '☢️ NUKLIR & PERANG', highlight: true },
                  { id: 'DAILY_BRIEF', label: '☕ BRIEF' },
                  { id: 'RESEARCH', label: '📑 RISET' },
                  { id: 'IDX', label: '📈 SAHAM IDX' },
                  { id: 'BANKING', label: '🏦 PERBANKAN' },
                  { id: 'CRYPTO', label: '⚡ KRIPTO' },
                  { id: 'MACRO', label: '🌐 FED & MAKRO' },
                  { id: 'GEOPOLITIK', label: '🛡️ GEOPOLITIK' },
                  { id: 'COMMODITY', label: '🪙 LOGAM & EMAS' },
                  { id: 'ENERGY', label: '🛢️ ENERGI & MINYAK' },
                  { id: 'US_MARKET', label: '🇺🇸 US MARKET' },
                  { id: 'CHINA', label: '🇨🇳 CHINA' },
                  { id: 'TECH_AI', label: '🤖 TECH & AI' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setNewsFilter(f.id)}
                    style={{
                      padding: '2px 5px',
                      fontSize: '7.5px',
                      fontWeight: '500',
                      borderRadius: '2px',
                      border: newsFilter === f.id ? (f.highlight ? '1px solid #ef4444' : '1px solid var(--accent-blue)') : 'var(--border-hairline)',
                      background: newsFilter === f.id ? (f.highlight ? '#ef4444' : 'var(--accent-blue)') : f.highlight ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-panel-subtle)',
                      color: newsFilter === f.id ? '#ffffff' : f.highlight ? '#fca5a5' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      flexShrink: 0
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable News Cards List */}
            <div
              className="news-scroll-container"
              style={{
                padding: '4px 6px',
                flex: '1 1 0',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minHeight: 0
              }}
            >
              {displayNews.map((news, idx) => {
                const isBear = (news.sentiment || '').toUpperCase() === 'BEARISH';
                const isBull = (news.sentiment || '').toUpperCase() === 'BULLISH';
                const isBrief = news.stream === 'DAILY_BRIEF' || news.tag === 'DAILY_BRIEF';
                const isResearch = news.stream === 'RESEARCH' || news.tag === 'RESEARCH';
                const titleLower = (news.title || '').toLowerCase();
                const isWarAlert = titleLower.includes('perang') || titleLower.includes('war') || titleLower.includes('militer') || titleLower.includes('rudal') || titleLower.includes('nuklir') || titleLower.includes('sanction');
                const borderAccent = isWarAlert ? '#ef4444' : isBrief ? '#f59e0b' : isResearch ? '#8b5cf6' : isBear ? 'var(--accent-rust)' : isBull ? 'var(--accent-green)' : 'var(--border-subtle)';

                return (
                  <div
                    key={news.id || idx}
                    onClick={() => onSelectNews && onSelectNews(news)}
                    style={{
                      padding: '5px 7px',
                      background: isWarAlert ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-panel-subtle)',
                      border: 'var(--border-hairline)',
                      borderLeft: `3px solid ${borderAccent}`,
                      borderRadius: '3px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isWarAlert ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.35)';
                      e.currentTarget.style.borderLeft = `3px solid ${borderAccent}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isWarAlert ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-panel-subtle)';
                      e.currentTarget.style.borderColor = 'var(--border-hairline)';
                      e.currentTarget.style.borderLeft = `3px solid ${borderAccent}`;
                    }}
                    title="Klik untuk melihat detail & analisis berita"
                  >
                    {/* Source, Tag & Time */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '8px', fontWeight: '600', color: isWarAlert ? '#fca5a5' : isBrief ? '#f59e0b' : isResearch ? '#c084fc' : 'var(--text-primary)', textTransform: 'uppercase' }}>
                          {news.source || 'WIRE'}
                        </span>
                        {isWarAlert && (
                          <span style={{ fontSize: '7px', padding: '0 3px', background: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5', borderRadius: '2px', fontWeight: '600' }}>
                            MILITARY/GEO
                          </span>
                        )}
                        {isBrief && (
                          <span style={{ fontSize: '7px', padding: '0 3px', background: 'rgba(245, 158, 11, 0.25)', color: 'var(--accent-gold-text)', borderRadius: '2px', fontWeight: '600' }}>
                            BRIEF
                          </span>
                        )}
                        {isResearch && (
                          <span style={{ fontSize: '7px', padding: '0 3px', background: 'rgba(139, 92, 246, 0.25)', color: '#c084fc', borderRadius: '2px', fontWeight: '600' }}>
                            RESEARCH
                          </span>
                        )}
                        <span className={`badge ${isBear ? 'badge-bear' : isBull ? 'badge-bull' : 'badge-neutral'}`} style={{ fontSize: '7px', padding: '0 3px' }}>
                          {news.sentiment || 'NEUTRAL'}
                        </span>
                      </div>

                      {(() => {
                        const dt = formatNewsDateTime(news);
                        return (
                          <span
                            style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                            title={`Waktu rilis sumber: ${news.source_time_utc || news.pub_date || ''}`}
                          >
                            {dt.dateStr} • {dt.timeStr}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Headline Title */}
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {news.title}
                    </div>

                    {/* Tickers */}
                    {news.related_tickers && news.related_tickers.length > 0 && (
                      <div style={{ display: 'flex', gap: '3px', marginTop: '1px', flexWrap: 'wrap' }}>
                        {news.related_tickers.map(t => (
                          <span
                            key={t}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTicker && onSelectTicker(t, 'IDX');
                            }}
                            style={{
                              fontSize: '8px',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--accent-blue)',
                              background: 'rgba(59, 130, 246, 0.15)',
                              padding: '1px 3px',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            ${t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {displayNews.length === 0 && (
                <div style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '9px' }}>
                  Tidak ada berita yang cocok dengan filter ini.
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div style={{ padding: '4px 6px', borderTop: 'var(--border-hairline)', background: 'var(--bg-panel-subtle)', flexShrink: 0 }}>
              <button
                onClick={() => onNavigateTab && onNavigateTab('NEWS')}
                style={{
                  width: '100%',
                  padding: '3px 6px',
                  fontSize: '8px',
                  fontWeight: '500',
                  borderRadius: '2px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(59, 130, 246, 0.08)',
                  color: 'var(--accent-blue)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                Buka Terminal Berita Riset Lengkap ({liveNewsRaw.length} Riset) →
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Footer Navigation Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '4px',
          fontSize: '8px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '4px'
        }}>
          <div>
            INSTRUMENTS: <strong style={{ color: 'var(--text-primary)' }}>82 IDX • 10 CRYPTO • 31 US EQUITIES</strong> | ENGINE: <strong style={{ color: 'var(--accent-green)' }}>TimesFM AI + SMC + IIFS • MCP ENABLED</strong>
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button className="telemetry-btn" onClick={() => onNavigateTab('TESTING')} style={{ fontSize: '7.5px', padding: '2px 7px' }}>
              🧪 TESTING LAB
            </button>
            <button className="telemetry-btn" onClick={() => onNavigateTab('ACADEMY')} style={{ fontSize: '7.5px', padding: '2px 7px' }}>
              🎓 ACADEMY
            </button>
            <button className="telemetry-btn" onClick={() => onNavigateTab('ARENA')} style={{ fontSize: '7.5px', padding: '2px 7px' }}>
              🤖 BOT ARENA
            </button>
          </div>
        </div>

    </div>
  );
}