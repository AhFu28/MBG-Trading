import React, { useState, useEffect, useMemo } from 'react';
import BloombergNewsWire from './BloombergNewsWire.jsx';
import AssetIcon from './AssetIcon.jsx';
import CryptoIcon from './CryptoIcon.jsx';

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
  const liveNewsRaw = (macro?.live_news || []).slice().sort((a, b) => new Date(b.pub_date || 0) - new Date(a.pub_date || 0));

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
      .slice(0, 6);

    const outflows = scopedList
      .filter(f => (Number(f.foreign_net_val_idr) || 0) < 0)
      .sort((a, b) => Number(a.foreign_net_val_idr) - Number(b.foreign_net_val_idr))
      .slice(0, 6);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', boxSizing: 'border-box' }}>

      {dataStatus === 'fallback' && (
        <div style={{ background: '#d97706', color: '#fff', padding: '6px 12px', borderRadius: '4px', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600 }}>
          📡 OFFLINE MODE — Menjalankan data fallback/cache. Koneksi bursa sedang disinkronkan ulang.
        </div>
      )}

      {/* TOP STRIP: STREAMLINED MARKET BENCHMARK WIRE */}
      <BloombergNewsWire macro={macro} bundle={data} livePrices={livePrices} onSelectTicker={onSelectTicker} onSelectNews={onSelectNews} />

      {/* =========================================================================
          UNIFIED SPLIT: COCKPIT STACK (LEFT) & LIVE INTELLIGENCE WIRE (RIGHT)
          News Wire starts from the top (level with Barometer Likuiditas & Portfolio Risk)
          down through Smart Money Order Flow & Bandarmology Radar!
          ========================================================================= */}
      <div className="home-middle-cockpit-split">

        {/* LEFT COLUMN: COCKPIT STACK */}
        <div className="home-cockpit-left">

          {/* SUB-ROW 1: COMPACT MACRO TRIO GRID (Barometer Likuiditas + Portfolio Risk + 4 Visual Gauges) */}
          <div className="home-macro-trio-grid">

            {/* Panel 1A: Kurva Imbal Hasil & Likuiditas Makro */}
            <div className="telemetry-panel" style={{
              padding: '6px 9px',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(20, 27, 45, 0.9) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '4px',
              minWidth: 0,
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px' }}>📈</span>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
                    US YIELD CURVE & LIQUIDITY (10Y-2Y)
                  </span>
                </div>
                <span
                  title="Spread Positif (+22 bps) artinya ekonomi normal & tidak ada ancaman resesi jangka pendek."
                  style={{
                    fontSize: '8px',
                    fontWeight: 800,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    cursor: 'help'
                  }}
                >
                  +22 bps STEEPENING
                </span>
              </div>

              {/* Layman Subtitle / Definition */}
              <div style={{ fontSize: '8px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Regime: <strong style={{ color: '#34d399' }}>Normal Expansion (Low Recession Risk)</strong></span>
                <span
                  style={{ color: 'var(--accent-blue)', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => setShowLaymanGuide(prev => !prev)}
                >
                  {showLaymanGuide ? 'Close Guide' : 'ℹ️ Quick Guide'}
                </span>
              </div>

              {/* 5-Tenor Strip */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '2px',
                padding: '2px 4px',
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '3px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                {[
                  { tenor: '3M', yieldVal: '4.85%', color: '#93c5fd' },
                  { tenor: '2Y', yieldVal: '3.96%', color: '#60a5fa' },
                  { tenor: '5Y', yieldVal: '4.05%', color: '#38bdf8' },
                  { tenor: '10Y', yieldVal: '4.18%', color: '#34d399', hl: true },
                  { tenor: '30Y', yieldVal: '4.45%', color: '#a78bfa' }
                ].map(item => (
                  <div key={item.tenor} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '1px 2px',
                    background: item.hl ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    borderRadius: '2px'
                  }}>
                    <span style={{ fontSize: '7px', color: 'var(--text-muted)' }}>{item.tenor}</span>
                    <strong style={{ fontSize: '9px', color: item.color, fontFamily: 'var(--font-mono)' }}>{item.yieldVal}</strong>
                  </div>
                ))}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '8px',
                color: 'var(--text-muted)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '2px',
                fontFamily: 'var(--font-mono)'
              }}>
                <span>BI vs Fed Spread: <strong style={{ color: '#34d399' }}>+125 bps Carry</strong> (IDR Support Buffer)</span>
                <span>USD/IDR: <strong style={{ color: '#f1f5f9' }}>15.680</strong></span>
              </div>
            </div>

            {/* Panel 1B: Portfolio Risk & Kontrol Modal */}
            <div className="telemetry-panel" style={{
              padding: '6px 9px',
              background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.85) 0%, rgba(13, 19, 33, 0.95) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '4px',
              minWidth: 0,
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px' }}>🛡️</span>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
                    PORTFOLIO RISK &amp; CAPITAL ALLOCATION
                  </span>
                </div>
                <span style={{
                  fontSize: '8px',
                  fontWeight: 800,
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--accent-blue)',
                  padding: '1px 4px',
                  borderRadius: '2px',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  RISK DESK v3.0
                </span>
              </div>

              {/* Layman Subtitle / Definition */}
              <div style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>
                Safety Buffer: <strong style={{ color: '#60a5fa' }}>21.6% Cash Reserve</strong> • Max Daily VaR: <strong style={{ color: '#f59e0b' }}>1.18%</strong>
              </div>

              {/* 4 Factor Telemetry */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '2px',
                padding: '2px 4px',
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '3px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '7px', color: 'var(--text-muted)' }}>GROSS EXPOSURE</div>
                  <strong style={{ fontSize: '9.5px', color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>78.4%</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '7px', color: 'var(--text-muted)' }}>NET BIAS</div>
                  <strong style={{ fontSize: '9.5px', color: '#34d399', fontFamily: 'var(--font-mono)' }}>+64.2%</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '7px', color: 'var(--text-muted)' }}>1D VaR (95%)</div>
                  <strong style={{ fontSize: '9.5px', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>1.18%</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '7px', color: 'var(--text-muted)' }}>PORTFOLIO BETA</div>
                  <strong style={{ fontSize: '9.5px', color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>1.05x</strong>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '8px',
                color: 'var(--text-muted)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '2px',
                fontFamily: 'var(--font-mono)'
              }}>
                <span>Risk Discipline: <strong style={{ color: 'var(--text-primary)' }}>Min 1:2.0 Net R:R</strong></span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>LONG-ONLY (CASH)</span>
              </div>
            </div>

            {/* Panel 1C: Sentimen Makro & 4 Visual Meters (Pindahan dari Bawah) */}
            <div className="telemetry-panel" style={{
              padding: '6px 9px',
              background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '4px',
              minWidth: 0,
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px' }}>🧭</span>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
                    GLOBAL SENTIMENT &amp; VOLATILITY
                  </span>
                </div>
                <span style={{
                  fontSize: '8px',
                  fontWeight: 800,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  padding: '1px 4px',
                  borderRadius: '2px',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  4-BAROMETER HUD
                </span>
              </div>

              {/* 4 Intuitive Visual Gauges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>

                {/* Gauge 1: Fear & Greed */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>FEAR &amp; GREED</span>
                    <strong style={{ color: '#10b981' }}>71 GREED</strong>
                  </div>
                  {/* Visual Bar */}
                  <div style={{ width: '100%', height: '4px', background: '#334155', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                    <div style={{ width: '71%', height: '100%', background: 'linear-gradient(90deg, #ef4444 0%, #eab308 50%, #10b981 100%)' }} />
                  </div>
                </div>

                {/* Gauge 2: VIX Volatilitas */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>VIX VOLATILITY</span>
                    <strong style={{ color: '#60a5fa' }}>14.21 CALM</strong>
                  </div>
                  {/* Visual Bar (Low is calm green) */}
                  <div style={{ width: '100%', height: '4px', background: '#334155', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                    <div style={{ width: '28%', height: '100%', background: '#34d399' }} />
                  </div>
                </div>

                {/* Gauge 3: BTC Dominance */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>BTC DOMINANCE</span>
                    <strong style={{ color: '#fbbf24' }}>58.7% DOM</strong>
                  </div>
                  {/* Visual Bar */}
                  <div style={{ width: '100%', height: '4px', background: '#334155', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                    <div style={{ width: '58.7%', height: '100%', background: '#f59e0b' }} />
                  </div>
                </div>

                {/* Gauge 4: DXY Dollar Index */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>DXY (DOLLAR)</span>
                    <strong style={{ color: '#34d399' }}>100.63 SOFT</strong>
                  </div>
                  {/* Visual Bar (Soft is good for IHSG) */}
                  <div style={{ width: '100%', height: '4px', background: '#334155', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                    <div style={{ width: '45%', height: '100%', background: '#10b981' }} />
                  </div>
                </div>

              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '8px',
                color: 'var(--text-muted)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '2px',
                fontFamily: 'var(--font-mono)'
              }}>
                <span>Macro Context: <strong style={{ color: 'var(--accent-green)' }}>Risk-On Sentiment</strong></span>
                <span>Soft DXY Supports BEI / Emerging Markets</span>
              </div>
            </div>

          </div>

          {/* Collapsible Layman Explainer Box */}
          {showLaymanGuide && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--accent-blue)',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '8.5px',
              color: 'var(--text-primary)',
              lineHeight: 1.4,
              fontFamily: 'var(--font-mono)'
            }}>
              <strong>📖 TIER-1 INSTITUTIONAL RISK &amp; LIQUIDITY GUIDE:</strong>
              <div style={{ marginTop: '3px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div>
                  <strong style={{ color: 'var(--accent-blue)' }}>1. US Yield Curve (10Y-2Y):</strong><br/>
                  Spread between US 10-year and 2-year Treasury yields. A positive spread (+22 bps steepening) indicates healthy economic expansion with low recession probability. The +125 bps BI-Fed carry provides resilient FX buffer for Rupiah.
                </div>
                <div>
                  <strong style={{ color: 'var(--accent-green)' }}>2. Portfolio Risk &amp; Capital Allocation:</strong><br/>
                  78.4% active gross exposure with 21.6% safe liquid cash reserve. Maximum daily downside bounded by 1.18% 1D VaR (95% CI). Enforces strict minimum 1:2.0 Net Risk/Reward before execution.
                </div>
                <div>
                  <strong style={{ color: '#fbbf24' }}>3. Global Sentiment &amp; Volatility:</strong><br/>
                  Fear &amp; Greed (71 Greed = robust risk appetite), VIX (14.21 Calm = low equity tail-risk), BTC Dominance (58.7% concentration), and DXY (100.63 Soft = catalyst for foreign capital inflow to BEI/IHSG).
                </div>
              </div>
            </div>
          )}

          {/* SUB-ROW 2: 4 UNIFORM BENTO CARDS (IHSG, COMMODITIES, CRYPTO, IDX ALPHA) */}
          <div className="home-bento-row" style={{ flexShrink: 0 }}>

            {/* Card 1: IHSG & Domestic Regime */}
            <div className="telemetry-panel" style={{
              padding: '6px 8px',
              borderLeft: '3px solid var(--accent-green)',
              background: 'linear-gradient(135deg, var(--bg-panel) 0%, rgba(0,208,132,0.04) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '98px',
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
                      <span style={{ color: ihsgChange >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)', fontWeight: '800' }}>
                        {ihsgChange >= 0 ? '+' : ''}{ihsgChange.toFixed(2)}%
                      </span>
                    </div>
                    <span style={{ color: 'var(--text-muted)' }}>Vol: <strong style={{ color: 'var(--text-primary)' }}>2.1T</strong></span>
                  </div>
                );
              })()}
            </div>

            {/* Card 2: Commodities & DXY */}
            {(() => {
              const liveBrent = livePrices['BRENT'] || livePrices['UKOIL'];
              const liveGold = livePrices['GOLD'] || livePrices['XAUUSD'];
              const brentPrice = liveBrent?.price !== undefined ? Number(liveBrent.price) : 99.21;
              const brentChg = liveBrent?.changePct !== undefined ? Number(liveBrent.changePct) : -1.13;
              const rawGold = liveGold?.price !== undefined ? Number(liveGold.price) : Number(data?.macro_indicators?.gold_price || 2650.0);
              const goldPrice = (rawGold >= 1800 && rawGold <= 3500) ? rawGold : 2650.0;
              const goldChg = liveGold?.changePct !== undefined ? Number(liveGold.changePct) : Number(data?.macro_indicators?.gold_change_pct || 0.85);

              return (
                <div className="telemetry-panel" style={{
                  padding: '6px 8px',
                  borderLeft: '3px solid var(--accent-orange)',
                  background: 'linear-gradient(135deg, var(--bg-panel) 0%, rgba(245, 158, 11, 0.04) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '98px',
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="metric-label" style={{ fontSize: '8px' }}>COMMODITIES &amp; DXY</span>
                      <span style={{ fontSize: '7px', padding: '1px 4px', borderRadius: '2px', background: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b', fontWeight: '800' }}>OIL &amp; GOLD</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                      <div style={{ fontSize: '10.5px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--accent-orange-text, #f59e0b)' }}>
                        OIL ${brentPrice.toFixed(1)} <span style={{ fontSize: '7.5px', color: brentChg >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>{brentChg >= 0 ? '+' : ''}{brentChg.toFixed(1)}%</span>
                      </div>
                      <div style={{ fontSize: '10.5px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: '#eab308' }}>
                        GOLD ${goldPrice.toFixed(0)} <span style={{ fontSize: '7.5px', color: goldChg >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>{goldChg >= 0 ? '+' : ''}{goldChg.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '7.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      IDX Energy Correlation
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', fontFamily: 'var(--font-mono)', paddingTop: '2px', borderTop: 'var(--border-muted)' }}>
                    <span>Sektor: <strong style={{ color: 'var(--accent-green)', cursor: 'pointer' }} onClick={() => onSelectTicker('MEDC', 'IDX')}>$MEDC</strong> <strong style={{ color: 'var(--accent-green)', cursor: 'pointer' }} onClick={() => onSelectTicker('ELSA', 'IDX')}>$ELSA</strong></span>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: '800' }}>BULLISH</span>
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
                  borderLeft: '3px solid #3b82f6',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '98px',
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
                          fontWeight: '800',
                          fontFamily: 'var(--font-mono)',
                          color: isCryptoFlashing === 'up' ? 'var(--accent-green)' : isCryptoFlashing === 'down' ? 'var(--accent-rust)' : 'var(--text-primary)'
                        }}>
                          ${Number(liveCryptoPrice).toLocaleString(undefined, { minimumFractionDigits: Number(liveCryptoPrice) > 100 ? 0 : 2, maximumFractionDigits: 2 })}
                        </span>
                        <span style={{ fontSize: '7.5px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: liveCryptoChange >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                          {liveCryptoChange >= 0 ? '+' : ''}{Number(liveCryptoChange).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '7.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      Range Accumulation
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', fontFamily: 'var(--font-mono)', paddingTop: '2px', borderTop: 'var(--border-muted)' }}>
                    <span>Entry: <strong style={{ color: 'var(--text-primary)' }}>{Math.round(topCrypto?.current_price || 76680).toLocaleString()}</strong></span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: '800' }}>1:2.0 Net</span>
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
                  borderLeft: '3px solid var(--accent-green)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '98px',
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
                          fontWeight: '800',
                          fontFamily: 'var(--font-mono)',
                          color: isIdxFlashing === 'up' ? 'var(--accent-green)' : isIdxFlashing === 'down' ? 'var(--accent-rust)' : 'var(--text-primary)'
                        }}>
                          Rp {Number(liveIdxPrice).toLocaleString('id-ID')}
                        </span>
                        <span style={{ fontSize: '7.5px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: liveIdxChange >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                          {liveIdxChange >= 0 ? '+' : ''}{Number(liveIdxChange).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '7.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      Barito Cluster Expansion
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', fontFamily: 'var(--font-mono)', paddingTop: '2px', borderTop: 'var(--border-muted)' }}>
                    <span>Entry: <strong style={{ color: 'var(--text-primary)' }}>{Number(topIdx?.entry_price || 945).toLocaleString()}</strong></span>
                    <span style={{ color: '#34d399', fontWeight: '800' }}>1:2.1 Net</span>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* SUB-ROW 3: SMART MONEY ORDER FLOW & BANDARMOLOGY RADAR (Zero Bottom Waste, Clean Flush) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: 0,
            flexGrow: 1,
            boxSizing: 'border-box'
          }}>

            {/* Header Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 8px',
              background: 'var(--bg-panel)',
              borderRadius: '4px',
              border: 'var(--border-hairline)',
              fontSize: '9.5px',
              fontFamily: 'var(--font-mono)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>🌊</span>
                <strong style={{ color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                  SMART MONEY ORDER FLOW &amp; BANDARMOLOGY RADAR
                </strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="badge badge-bull" style={{ fontSize: '8px', padding: '1px 5px' }}>
                  L2 DEPTH FRAKSI SYNC
                </span>
              </div>
            </div>

            {/* 2-Column Grid: Foreign Flow (Left) & Bandar Accumulation (Right) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '6px',
              flexGrow: 1,
              minHeight: 0
            }}>

              {/* Sub-Panel 1: Foreign Flow (Intraday) */}
              <div className="telemetry-panel" style={{ border: 'var(--border-hairline)', padding: '0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0 }}>
                <div className="telemetry-header" style={{ padding: '4px 8px', fontSize: '9.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🌐</span>
                    <span style={{ fontWeight: '800' }}>FOREIGN FLOW // ARUS ASING (INTRADAY)</span>
                    <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.3)', borderRadius: '3px', padding: '1px', border: 'var(--border-hairline)' }}>
                      <button 
                        onClick={() => setFlowScope('ALL_100')}
                        style={{ 
                          background: flowScope === 'ALL_100' ? 'var(--accent-blue)' : 'transparent', 
                          color: flowScope === 'ALL_100' ? '#fff' : 'var(--text-muted)',
                          border: 'none', 
                          borderRadius: '2px', 
                          fontSize: '7.5px', 
                          padding: '1px 4px',
                          cursor: 'pointer',
                          fontWeight: '800'
                        }}
                      >
                        IDX 100
                      </button>
                      <button 
                        onClick={() => setFlowScope('LQ45')}
                        style={{ 
                          background: flowScope === 'LQ45' ? 'var(--accent-blue)' : 'transparent', 
                          color: flowScope === 'LQ45' ? '#fff' : 'var(--text-muted)',
                          border: 'none', 
                          borderRadius: '2px', 
                          fontSize: '7.5px', 
                          padding: '1px 4px',
                          cursor: 'pointer',
                          fontWeight: '800'
                        }}
                      >
                        LQ45
                      </button>
                    </div>
                  </div>

                  <span className={`badge ${totalNetForeign >= 0 ? 'badge-bull' : 'badge-bear'}`} style={{ fontSize: '8px', padding: '1px 5px', fontWeight: '800' }}>
                    {totalNetForeign >= 0 ? 'NET BUY ' : 'NET SELL '}
                    {formatFlowIdr(totalNetForeign)}
                  </span>
                </div>

                {/* Dense Inflow vs Outflow List */}
                <div style={{ padding: '4px 6px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '2px', minHeight: 0 }}>
                  <div className="home-flow-columns" style={{ gap: '6px', height: '100%' }}>
                    
                    {/* Inflow Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '2px' }}>
                      <div style={{ fontSize: '8px', fontWeight: '800', color: 'var(--accent-green)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                        <span>▲ TOP INFLOW</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '7.5px' }}>NET BUY</span>
                      </div>
                      {topInflow.map(f => {
                        const live = livePrices[f.ticker] || livePrices[`IDX:${f.ticker}`];
                        const px = live?.price !== undefined ? live.price : (f.price || 0);
                        const chg = live?.changePct !== undefined ? live.changePct : (f.change_pct || 0);
                        const isFlash = flashMap[f.ticker];

                        return (
                          <div key={f.ticker} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '8.5px',
                            fontFamily: 'var(--font-mono)',
                            padding: '2.5px 4px',
                            background: 'rgba(0, 208, 132, 0.04)',
                            borderRadius: '2px',
                            border: '1px solid rgba(0, 208, 132, 0.1)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', minWidth: 0 }}>
                              <AssetIcon symbol={f.ticker} market="IDX" size={12} />
                              <span style={{ color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: '800' }} onClick={() => onSelectTicker(f.ticker, 'IDX')}>
                                ${f.ticker}
                              </span>
                              {px > 0 && (
                                <span style={{ fontSize: '7.5px', color: isFlash === 'up' ? 'var(--accent-green)' : isFlash === 'down' ? 'var(--accent-rust)' : 'var(--text-muted)' }}>
                                  {Number(px).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ color: 'var(--accent-green)', fontSize: '8px' }}>{formatFlowIdr(f.foreign_net_val_idr)}</strong>
                              {chg !== 0 && (
                                <span style={{ fontSize: '7px', color: chg >= 0 ? '#34d399' : '#f87171', marginLeft: '3px' }}>
                                  {chg >= 0 ? '+' : ''}{Number(chg).toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Outflow Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '2px' }}>
                      <div style={{ fontSize: '8px', fontWeight: '800', color: 'var(--accent-rust)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                        <span>▼ TOP OUTFLOW</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '7.5px' }}>NET SELL</span>
                      </div>
                      {topOutflow.map(f => {
                        const live = livePrices[f.ticker] || livePrices[`IDX:${f.ticker}`];
                        const px = live?.price !== undefined ? live.price : (f.price || 0);
                        const chg = live?.changePct !== undefined ? live.changePct : (f.change_pct || 0);
                        const isFlash = flashMap[f.ticker];

                        return (
                          <div key={f.ticker} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '8.5px',
                            fontFamily: 'var(--font-mono)',
                            padding: '2.5px 4px',
                            background: 'rgba(239, 68, 68, 0.04)',
                            borderRadius: '2px',
                            border: '1px solid rgba(239, 68, 68, 0.1)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', minWidth: 0 }}>
                              <AssetIcon symbol={f.ticker} market="IDX" size={12} />
                              <span style={{ color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: '800' }} onClick={() => onSelectTicker(f.ticker, 'IDX')}>
                                ${f.ticker}
                              </span>
                              {px > 0 && (
                                <span style={{ fontSize: '7.5px', color: isFlash === 'up' ? 'var(--accent-green)' : isFlash === 'down' ? 'var(--accent-rust)' : 'var(--text-muted)' }}>
                                  {Number(px).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ color: 'var(--accent-rust)', fontSize: '8px' }}>{formatFlowIdr(f.foreign_net_val_idr)}</strong>
                              {chg !== 0 && (
                                <span style={{ fontSize: '7px', color: chg >= 0 ? '#34d399' : '#f87171', marginLeft: '3px' }}>
                                  {chg >= 0 ? '+' : ''}{Number(chg).toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>

                {/* Telemetry Footer */}
                <div style={{ padding: '4px 6px', borderTop: 'var(--border-muted)', fontSize: '8px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', background: 'var(--bg-panel-subtle)', flexShrink: 0 }}>
                  <span>Scope: <strong style={{ color: 'var(--accent-blue)' }}>{flowScope === 'LQ45' ? 'LQ45' : 'IDX 100'}</strong></span>
                  <span>Participation: <strong style={{ color: '#34d399' }}>34.8%</strong></span>
                  <span>Flow Velocity: <strong style={{ color: '#60a5fa' }}>+0.8σ Acc</strong></span>
                </div>
              </div>

              {/* Sub-Panel 2: Bandarmology (EOD) */}
              <div className="telemetry-panel" style={{ border: 'var(--border-hairline)', padding: '0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0 }}>
                <div className="telemetry-header" style={{ padding: '4px 8px', fontSize: '9.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📊</span>
                    <span style={{ fontWeight: '800' }}>SMART MONEY ACCUMULATION</span>
                    <span style={{ fontSize: '7px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.28)', padding: '1px 4px', borderRadius: '2px', fontWeight: '800' }} title="Estimasi pemodelan quant institutional flow (bukan feed berbayar IDX)">
                      ESTIMATED FLOW (QUANT MODEL)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '7.5px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '1px 4px', borderRadius: '2px', fontWeight: '800' }}>
                      🕒 EOD
                    </span>
                    <span style={{ fontSize: '8px', color: 'var(--accent-blue)', fontWeight: '800' }}>
                      CR3: 68.4%
                    </span>
                  </div>
                </div>

                {/* Dense Broker Accumulation Items */}
                <div style={{ padding: '4px 6px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '2px', minHeight: 0 }}>
                  {accumulatingBrokers.map((b, idx) => {
                    const topB = b.top_buyers?.[0];
                    const rawBroker = topB?.broker || 'CC';
                    const isSimulated = rawBroker.includes('[SIMULATED]');
                    const cleanBroker = rawBroker.replace('[SIMULATED] ', '').trim();
                    const brokerName = topB?.name ? topB.name.split(' ')[0] : 'Mandiri';
                    const lotsK = topB?.lots ? Math.round(topB.lots / 1000).toLocaleString() + 'k lot' : '38k lot';
                    const ticker = b.ticker || b.symbol || 'AMMN';
                    const live = livePrices[ticker] || livePrices[`IDX:${ticker}`];
                    const livePx = live?.price !== undefined ? Number(live.price) : Number(b.ref_price || 4870);
                    const bandarAvg = Number(b.bandar_avg_price || b.ref_price || 4874);
                    const spreadPct = bandarAvg > 0 ? ((livePx - bandarAvg) / bandarAvg) * 100 : 0;

                    return (
                      <div
                        key={ticker + idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '3px 5px',
                          background: 'var(--bg-panel-subtle)',
                          borderRadius: '2px',
                          border: 'var(--border-hairline)',
                          fontSize: '8.5px',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {/* Ticker Logo & Bandar Avg Price */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AssetIcon symbol={ticker} market="IDX" size={12} />
                          <span
                            style={{ fontWeight: '800', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '9px' }}
                            onClick={() => onSelectTicker(ticker, 'IDX')}
                          >
                            {ticker}
                          </span>
                          <span style={{ fontSize: '7.5px', color: 'var(--text-muted)' }}>
                            Avg: <strong style={{ color: 'var(--text-primary)' }}>{bandarAvg.toLocaleString()}</strong>
                          </span>
                          <span style={{
                            fontSize: '7.5px',
                            color: spreadPct <= 0 ? 'var(--accent-green)' : 'var(--text-secondary)',
                            background: spreadPct <= 0 ? 'rgba(0, 208, 132, 0.12)' : 'transparent',
                            padding: '0 3px',
                            borderRadius: '2px',
                            fontWeight: 700
                          }}>
                            {spreadPct <= 0 ? `${spreadPct.toFixed(1)}% (Discount)` : `+${spreadPct.toFixed(1)}%`}
                          </span>
                        </div>

                        {/* Broker Details & Big Acc Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '7.5px', color: 'var(--text-secondary)', fontWeight: '700' }}>
                            <strong style={{ color: '#60a5fa' }}>{cleanBroker}</strong>
                            {isSimulated && <span style={{ fontSize: '7px', color: '#fbbf24', marginLeft: '2px' }} title="Estimasi pemodelan quant">[EST]</span>}
                            <span style={{ color: 'var(--text-muted)' }}> ({brokerName} • {lotsK})</span>
                          </span>
                          <span className="badge badge-bull" style={{ fontSize: '7px', padding: '0 3px', fontWeight: '800' }}>
                            BIG ACC
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Telemetry Footer */}
                <div style={{ padding: '4px 6px', borderTop: 'var(--border-muted)', fontSize: '8px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', background: 'var(--bg-panel-subtle)', flexShrink: 0 }}>
                  <span>Total Accum: <strong style={{ color: 'var(--accent-green)' }}>{formatFlowIdr(totalBandarAccumValue || 83030000000000)}</strong></span>
                  <span>Model: <strong style={{ color: '#38bdf8' }}>ESTIMASI QUANT (EOD)</strong></span>
                  <span>Horizon: <strong style={{ color: '#fbbf24' }}>5D Swing</strong></span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: LIVE INTELLIGENCE WIRE (WITH TACTICAL DEFENSE / NUCLEAR ALERT HUD) */}
        <div className="home-cockpit-right">
          <div className="telemetry-panel" style={{
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '4px',
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, var(--bg-panel) 0%, rgba(15, 23, 42, 0.6) 100%)',
            height: '100%',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px' }}>📡</span>
                <span style={{ fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
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
                    fontWeight: '700'
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
                    <span style={{ fontSize: '7.5px', background: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '1px 4px', borderRadius: '2px', fontWeight: '800' }}>
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
                  <span>Hedge Play: <strong style={{ color: '#fff' }}>Long Brent &amp; Gold</strong> • Saham BEI: <strong style={{ color: '#34d399' }}>$MEDC $ELSA $ANTM</strong></span>
                  <span
                    onClick={() => setNewsFilter('NUCLEAR_WAR')}
                    style={{ textDecoration: 'underline', cursor: 'pointer', color: '#fff', fontWeight: 700 }}
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
                      fontWeight: '700',
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
            <div style={{
              padding: '4px 6px',
              flexGrow: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minHeight: 0
            }}>
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
                        <span style={{ fontSize: '8px', fontWeight: '800', color: isWarAlert ? '#fca5a5' : isBrief ? '#f59e0b' : isResearch ? '#c084fc' : 'var(--text-primary)', textTransform: 'uppercase' }}>
                          {news.source || 'WIRE'}
                        </span>
                        {isWarAlert && (
                          <span style={{ fontSize: '7px', padding: '0 3px', background: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5', borderRadius: '2px', fontWeight: '800' }}>
                            MILITARY/GEO
                          </span>
                        )}
                        {isBrief && (
                          <span style={{ fontSize: '7px', padding: '0 3px', background: 'rgba(245, 158, 11, 0.25)', color: '#f59e0b', borderRadius: '2px', fontWeight: '800' }}>
                            BRIEF
                          </span>
                        )}
                        {isResearch && (
                          <span style={{ fontSize: '7px', padding: '0 3px', background: 'rgba(139, 92, 246, 0.25)', color: '#c084fc', borderRadius: '2px', fontWeight: '800' }}>
                            RESEARCH
                          </span>
                        )}
                        <span className={`badge ${isBear ? 'badge-bear' : isBull ? 'badge-bull' : 'badge-neutral'}`} style={{ fontSize: '7px', padding: '0 3px' }}>
                          {news.sentiment || 'NEUTRAL'}
                        </span>
                      </div>

                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {news.pub_date ? `${new Date(news.pub_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB` : '11:45 WIB'}
                      </span>
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
                              fontWeight: '700'
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
                  fontWeight: '700',
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

      {/* =========================================================================
          TIER 3: TACTICAL QUANTITATIVE EXECUTION MATRIX (100% Full Width)
          ========================================================================= */}
      <div className="telemetry-panel home-execution-desk-card" style={{
        padding: '7px 10px',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        background: 'linear-gradient(180deg, var(--bg-panel) 0%, rgba(15, 23, 42, 0.4) 100%)',
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
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px' }}>⚡</span>
            <strong style={{ fontSize: '10.5px', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              TACTICAL QUANTITATIVE EXECUTION MATRIX
            </strong>
            <span style={{
              fontSize: '8px',
              padding: '1px 5px',
              borderRadius: '2px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontWeight: 800
            }}>
              NET FRICTION DEDUCTED (-0.45%)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setMatrixViewMode('3col')}
              style={{
                fontSize: '8px',
                fontWeight: 700,
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
                fontWeight: 700,
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
                  <th style={{ textAlign: 'center', padding: '4px 6px' }}>GROSS R:R</th>
                  <th style={{ textAlign: 'center', padding: '4px 6px' }}>NET R:R (INST)</th>
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
                      <td style={{ padding: '4px 6px', fontWeight: 800 }}>
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
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>
                        Rp {Number(plan.entry_price).toLocaleString()}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--accent-rust)', fontWeight: 700 }}>
                        Rp {Number(plan.stop_loss).toLocaleString()}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--accent-green)', fontWeight: 700 }}>
                        Rp {Number(plan.target_1 || plan.take_profit_1 || plan.entry_price * 1.05).toLocaleString()}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {rr.gross}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <strong style={{ color: '#34d399' }}>{rr.net}</strong>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{sizing.lots}</strong>
                        <div style={{ fontSize: '7.5px', color: 'var(--text-muted)' }}>{sizing.valIdr}</div>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <button
                          onClick={() => onOpenLotCalc && onOpenLotCalc(ticker, plan.entry_price, plan.stop_loss, plan.target_1 || plan.take_profit_1)}
                          style={{
                            padding: '2px 5px',
                            fontSize: '8px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: 'var(--accent-blue)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontWeight: 700
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
                      <td style={{ padding: '4px 6px', fontWeight: 800 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CryptoIcon symbol={c.pair} size={13} />
                          <span style={{ color: '#60a5fa', cursor: 'pointer' }} onClick={() => onSelectTicker(c.pair, 'CRYPTO')}>
                            {c.pair}
                          </span>
                        </div>
                        <div style={{ fontSize: '8px', color: isFlash === 'up' ? 'var(--accent-green)' : isFlash === 'down' ? 'var(--accent-rust)' : 'var(--text-muted)' }}>
                          ${Number(curPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({chgPct >= 0 ? '+' : ''}{Number(chgPct).toFixed(1)}%)
                        </div>
                      </td>
                      <td style={{ padding: '4px 6px', color: '#a78bfa' }}>SPOT</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <span className="badge badge-alert" style={{ fontSize: '7.5px', padding: '1px 4px' }}>
                          RANGE_ACC
                        </span>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>
                        ${formatCryptoPrice(c.current_price)}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--accent-rust)', fontWeight: 700 }}>
                        ${formatCryptoPrice(c.stop_loss)}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--accent-green)', fontWeight: 700 }}>
                        ${formatCryptoPrice(c.take_profit_1 || c.current_price * 1.05)}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {rr.gross}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <strong style={{ color: '#34d399' }}>{rr.net}</strong>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{sizing.lots}</strong>
                        <div style={{ fontSize: '7.5px', color: 'var(--text-muted)' }}>{sizing.valIdr}</div>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <button
                          onClick={() => onOpenLotCalc && onOpenLotCalc(c.pair, c.current_price, c.stop_loss, c.take_profit_1)}
                          style={{
                            padding: '2px 5px',
                            fontSize: '8px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: 'var(--accent-blue)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontWeight: 700
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
                      <td style={{ padding: '4px 6px', fontWeight: 800 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AssetIcon symbol={s.ticker} market="US" size={13} />
                          <span style={{ color: '#38bdf8', cursor: 'pointer' }} onClick={() => onSelectTicker(s.ticker, 'US')}>
                            ${s.ticker}
                          </span>
                        </div>
                        <div style={{ fontSize: '8px', color: isFlash === 'up' ? 'var(--accent-green)' : isFlash === 'down' ? 'var(--accent-rust)' : 'var(--text-muted)' }}>
                          ${Number(curPrice).toFixed(1)} ({chgPct >= 0 ? '+' : ''}{Number(chgPct).toFixed(1)}%)
                        </div>
                      </td>
                      <td style={{ padding: '4px 6px', color: '#38bdf8' }}>US STOCKS</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <span className="badge badge-bull" style={{ fontSize: '7.5px', padding: '1px 4px' }}>
                          {s.setup_type && s.setup_type !== 'NEUTRAL' ? s.setup_type : 'BULL_FLAG'}
                        </span>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>
                        ${Number(s.entry_price || 0).toFixed(1)}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--accent-rust)', fontWeight: 700 }}>
                        ${Number(s.stop_loss || 0).toFixed(1)}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--accent-green)', fontWeight: 700 }}>
                        ${Number(calculatedTp).toFixed(1)}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {rr.gross}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <strong style={{ color: '#34d399' }}>{rr.net}</strong>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{sizing.lots}</strong>
                        <div style={{ fontSize: '7.5px', color: 'var(--text-muted)' }}>{sizing.valIdr}</div>
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <button
                          onClick={() => onOpenLotCalc && onOpenLotCalc(s.ticker, s.entry_price, s.stop_loss, calculatedTp)}
                          style={{
                            padding: '2px 5px',
                            fontSize: '8px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: 'var(--accent-blue)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontWeight: 700
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
                    <span style={{ fontSize: '10.5px', fontWeight: '800', color: 'var(--text-primary)' }}>🇮🇩 Saham IDX Signals</span>
                    <span className="badge badge-bull" style={{ fontSize: '7.5px', padding: '1px 4px' }}>{topIdxPlans.length}</span>
                  </div>
                  <span style={{ fontSize: '8px', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 700 }} onClick={() => onNavigateTab('STOCK')}>
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
                          <td style={{ padding: '3.5px 2px', fontWeight: '800' }}>
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
                          <td style={{ padding: '3.5px 2px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Number(plan.entry_price).toLocaleString()}</td>
                          <td style={{ padding: '3.5px 2px', textAlign: 'right', color: 'var(--accent-rust)', fontVariantNumeric: 'tabular-nums' }}>{Number(plan.stop_loss).toLocaleString()}</td>
                          <td style={{ padding: '3.5px 2px', textAlign: 'right', color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums' }}>{Number(plan.target_1 || plan.take_profit_1).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: 'var(--text-muted)', marginTop: '3px', paddingTop: '2px', borderTop: 'var(--border-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>TimesFM + SMC AI</span>
                <span>6 / {topIdxPlans.length} Emiten</span>
              </div>
            </div>

            {/* Table 2: Crypto Spot Signals */}
            <div className="telemetry-panel" style={{ padding: '7px 9px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#60a5fa' }}>🪙 Crypto Spot Signals</span>
                    <span className="badge badge-alert" style={{ fontSize: '7.5px', padding: '1px 4px' }}>{topCryptoPicks.length}</span>
                  </div>
                  <span style={{ fontSize: '8px', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 700 }} onClick={() => onNavigateTab('CRYPTO')}>
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
                          <td style={{ padding: '3.5px 2px', fontWeight: '800' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                              <CryptoIcon symbol={c.pair} size={12} />
                              <span style={{ color: '#60a5fa', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => onSelectTicker(c.pair, 'CRYPTO')}>
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
                            <span className="badge badge-alert" style={{ fontSize: '7px', padding: '1px 3px' }}>
                              RANGE_ACC
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: 'var(--text-muted)', marginTop: '3px', paddingTop: '2px', borderTop: 'var(--border-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>Spot Accumulation</span>
                <span>6 / {topCryptoPicks.length} Pairs</span>
              </div>
            </div>

            {/* Table 3: US Stock Signals */}
            <div className="telemetry-panel" style={{ padding: '7px 9px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#38bdf8' }}>🇺🇸 US Stock Signals</span>
                    <span className="badge badge-bull" style={{ fontSize: '7.5px', padding: '1px 4px' }}>{topUsPlans.length}</span>
                  </div>
                  <span style={{ fontSize: '8px', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 700 }} onClick={() => onNavigateTab('US_STOCKS')}>
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
                          <td style={{ padding: '3.5px 2px', fontWeight: '800' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                              <AssetIcon symbol={s.ticker} market="US" size={12} />
                              <span style={{ color: '#38bdf8', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => onSelectTicker(s.ticker, 'US')}>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: 'var(--text-muted)', marginTop: '3px', paddingTop: '2px', borderTop: 'var(--border-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>US Momentum Alpha</span>
                <span>6 / {topUsPlans.length} Stocks</span>
              </div>
            </div>

          </div>
        )}

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

    </div>
  );
}
