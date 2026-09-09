import React, { useState, useMemo, useEffect } from 'react';
import NewsTab from './NewsTab.jsx';
import PersonalWatchlistTab from './PersonalWatchlistTab.jsx';
import VirtualForwardPortfolio from './VirtualForwardPortfolio.jsx';
import BacktestPerformanceLab from './BacktestPerformanceLab.jsx';
import EconomicCalendarTab from './EconomicCalendarTab.jsx';
import PearsonCorrelationWidget from './PearsonCorrelationWidget.jsx';
import GlobalMarketsTab from './GlobalMarketsTab.jsx';
import OrderBookSimulator from './OrderBookSimulator.jsx';
import QuantAcademyTab from './QuantAcademyTab.jsx';
import TestingHubTab from './TestingHubTab.jsx';

export default function MasterQuantLeaderboard({
  activeTab = 'STOCK',          // controlled from App.jsx (via Sidebar)
  onTabChange,                  // callback so inner navigation still works
  tradePlans = [],
  cryptoSpotList = [],
  conglomerates = {},
  dividendHunters = [],
  foreignFlow = {},
  liveNews = [],
  macro = {},
  paperPortfolio = {},
  backtestLab = {},
  strategyRankings = [],
  onSelectTicker,
  onOpenLotCalc
}) {
  // Alias for internal use — reads from controlled prop
  const activeMainTab = activeTab;
  const setActiveMainTab = (tab) => onTabChange?.(tab);

  const [stockSubFilter, setStockSubFilter] = useState('ALL_STOCKS');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [orderBookModal, setOrderBookModal] = useState({ isOpen: false, ticker: 'BBRI', price: 4900 });

  const [sortField, setSortField] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');

  // Reset expanded drawer and search term when tab changes from sidebar
  useEffect(() => { 
    setExpandedId(null); 
    setSearchTerm('');
  }, [activeTab]);


  // Conglomerate lookup map
  const kongloLookup = useMemo(() => {
    const map = {};
    Object.entries(conglomerates || {}).forEach(([groupName, stocks]) => {
      if (Array.isArray(stocks)) {
        stocks.forEach(s => {
          const cleanGroup = groupName.replace('_GROUP', '').replace('_', ' ');
          map[s.ticker] = cleanGroup;
        });
      }
    });
    return map;
  }, [conglomerates]);

  // Sets of tickers for accurate sub-filter categorization (prevents data dropout)
  const dividendTickerSet = useMemo(() => new Set((dividendHunters || []).map(d => d.ticker)), [dividendHunters]);
  const foreignTickerSet = useMemo(() => {
    const s = new Set();
    (foreignFlow?.top_inflow || []).forEach(f => s.add(f.ticker));
    (foreignFlow?.top_outflow || []).forEach(f => s.add(f.ticker));
    return s;
  }, [foreignFlow]);

  // Dynamic R:R calculator
  const calcRR = (entry, sl, tp) => {
    const risk = Math.abs(Number(entry) - Number(sl));
    const reward = Math.abs(Number(tp) - Number(entry));
    if (risk <= 0) return 2.0;
    return Number((reward / risk).toFixed(2));
  };

  // Build unified items list
  const { allItems, allStockItems, allCryptoItems } = useMemo(() => {
    const items = [];

    // 1. Trade Plans
    tradePlans.forEach((plan, idx) => {
      const ticker = plan.clean_ticker || (plan.symbol ? plan.symbol.replace('.JK', '') : ('PLAN-' + idx));
      const entry = plan.entry_price || 0;
      const sl = plan.stop_loss || 0;
      const tp = plan.target_1 || 0;
      const realRR = plan.risk_reward_ratio || calcRR(entry, sl, tp);

      // Resolve real change % if present, fallback to neutral
      const changePct = plan.change_pct !== undefined ? plan.change_pct : (plan.raw_change_pct !== undefined ? plan.raw_change_pct : 0.0);

      items.push({
        id: plan.plan_id || ('plan-' + idx),
        rank: idx + 1,
        ticker: ticker,
        fullSymbol: plan.symbol,
        market: plan.market,
        cluster: kongloLookup[ticker] || (plan.market === 'IDX' ? 'BLUECHIP' : 'CRYPTO ALPHA'),
        categoryLabel: plan.market === 'IDX' ? 'TRADE PLAN (IDX)' : 'CRYPTO ALPHA (USDT)',
        price: entry,
        changePct: changePct,
        signal: plan.technical_signal || 'BUY',
        signalType: 'BULL',
        entry: entry,
        stopLoss: sl,
        target1: tp,
        riskReward: realRR,
        isTradePlan: true,
        rawPlan: plan
      });
    });

    // 2. Crypto Spot Pairs
    cryptoSpotList.forEach((c) => {
      const existing = items.find(i => i.ticker === c.pair);
      if (!existing) {
        const entry = c.current_price || c.entry_high || 0;
        const sl = c.stop_loss || 0;
        const tp = c.take_profit_1 || 0;
        const realRR = c.risk_reward_ratio || calcRR(entry, sl, tp);

        items.push({
          id: 'crypto-' + c.pair,
          rank: items.length + 1,
          ticker: c.pair,
          fullSymbol: c.pair,
          market: 'CRYPTO',
          cluster: 'LAYER 1 / DEFI',
          categoryLabel: 'SPOT USDT (NO LEV)',
          price: c.current_price || 0,
          changePct: c.change_24h_pct || 0,
          signal: c.setup_type || 'SPOT_LONG',
          signalType: 'BLUE',
          entry: entry,
          entryRange: c.entry_low && c.entry_high ? (c.entry_low + ' - ' + c.entry_high) : null,
          stopLoss: sl,
          target1: tp,
          riskReward: realRR,
          isTradePlan: false,
          rawCrypto: c
        });
      }
    });

    // 3. Conglomerates
    Object.entries(conglomerates || {}).forEach(([group, stocks]) => {
      if (Array.isArray(stocks)) {
        stocks.forEach(s => {
          if (!items.find(i => i.ticker === s.ticker)) {
            const cleanGroup = group.replace('_GROUP', '').replace('_', ' ');
            const price = s.price || 0;
            const sl = Math.round(Number(price) * 0.95);
            const tp = Math.round(Number(price) * 1.10);
            const realRR = calcRR(price, sl, tp);

            items.push({
              id: 'konglo-' + s.ticker,
              rank: items.length + 1,
              ticker: s.ticker,
              fullSymbol: s.full_ticker || (s.ticker + '.JK'),
              market: 'IDX',
              cluster: cleanGroup,
              categoryLabel: cleanGroup,
              price: price,
              changePct: s.change_pct || 0,
              signal: s.technical_signal || 'MONITOR',
              signalType: s.technical_signal === 'BREAKOUT' ? 'BULL' : 'BLUE',
              entry: price,
              stopLoss: sl,
              target1: tp,
              riskReward: realRR,
              isTradePlan: false,
              rawStock: s
            });
          }
        });
      }
    });

    // 4. Dividend Hunters
    (dividendHunters || []).forEach(d => {
      if (!items.find(i => i.ticker === d.ticker)) {
        const price = d.price || 0;
        const sl = Math.round(Number(price) * 0.95);
        const tp = Math.round(Number(price) * 1.10);
        const realRR = calcRR(price, sl, tp);

        items.push({
          id: 'div-' + d.ticker,
          rank: items.length + 1,
          ticker: d.ticker,
          fullSymbol: d.full_ticker || (d.ticker + '.JK'),
          market: 'IDX',
          cluster: kongloLookup[d.ticker] || 'DIVIDEND QUALITY',
          categoryLabel: 'YIELD ' + d.dividend_yield_pct + '%',
          price: price,
          changePct: d.change_pct || 0,
          signal: d.dividend_trap_risk === 'LOW' ? 'HIGH YIELD SAFE' : 'TRAP RISK',
          signalType: d.dividend_trap_risk === 'LOW' ? 'BULL' : 'WARN',
          entry: price,
          stopLoss: sl,
          target1: tp,
          riskReward: realRR,
          isTradePlan: false,
          rawStock: d
        });
      }
    });

    // 5. Foreign Flow
    const foreignList = [...(foreignFlow?.top_inflow || []), ...(foreignFlow?.top_outflow || [])];
    foreignList.forEach(f => {
      if (!items.find(i => i.ticker === f.ticker)) {
        const price = f.price || 0;
        const sl = Math.round(Number(price) * 0.95);
        const tp = Math.round(Number(price) * 1.10);
        const realRR = calcRR(price, sl, tp);

        items.push({
          id: 'foreign-' + f.ticker,
          rank: items.length + 1,
          ticker: f.ticker,
          fullSymbol: f.ticker + '.JK',
          market: 'IDX',
          cluster: kongloLookup[f.ticker] || 'FOREIGN TARGET',
          categoryLabel: f.flow_type || 'FOREIGN FLOW',
          price: price,
          changePct: f.change_pct || 0,
          signal: f.flow_type === 'ACCUMULATION' ? 'FOREIGN BUY' : 'FOREIGN SELL',
          signalType: f.flow_type === 'ACCUMULATION' ? 'BULL' : 'WARN',
          entry: price,
          stopLoss: sl,
          target1: tp,
          riskReward: realRR,
          isTradePlan: false,
          rawStock: f
        });
      }
    });

    const stockOnly = items.filter(i => i.market === 'IDX');
    const cryptoOnly = items.filter(i => i.market === 'CRYPTO');

    return { allItems: items, allStockItems: stockOnly, allCryptoItems: cryptoOnly };
  }, [tradePlans, cryptoSpotList, conglomerates, dividendHunters, foreignFlow, kongloLookup]);

  // Robust filtering using Membership Sets (No deduplication data loss)
  const currentDataset = useMemo(() => {
    let list = [];
    if (activeMainTab === 'STOCK') {
      if (stockSubFilter === 'PLANS') {
        list = allStockItems.filter(i => i.isTradePlan);
      } else if (stockSubFilter === 'KONGLO') {
        list = allStockItems.filter(i => Boolean(kongloLookup[i.ticker]));
      } else if (stockSubFilter === 'DIVIDEND') {
        list = allStockItems.filter(i => dividendTickerSet.has(i.ticker) || i.id.startsWith('div-'));
      } else if (stockSubFilter === 'FOREIGN') {
        list = allStockItems.filter(i => foreignTickerSet.has(i.ticker) || i.id.startsWith('foreign-'));
      } else {
        list = allStockItems;
      }
    } else if (activeMainTab === 'CRYPTO') {
      list = allCryptoItems;
    } else {
      list = allItems;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(i => 
        (i.ticker && i.ticker.toLowerCase().includes(q)) ||
        (i.cluster && i.cluster.toLowerCase().includes(q)) ||
        (i.signal && i.signal.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'price' || sortField === 'changePct' || sortField === 'riskReward' || sortField === 'rank') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [activeMainTab, stockSubFilter, searchTerm, allStockItems, allCryptoItems, allItems, sortField, sortDirection, kongloLookup, dividendTickerSet, foreignTickerSet]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return ' ⇅';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className='telemetry-panel' style={{ border: 'var(--border-hairline)' }}>
      {/* Sub-filter context bar for STOCK/CRYPTO tabs */}
      {(activeMainTab === 'STOCK' || activeMainTab === 'CRYPTO') && (
        <div className='telemetry-header' style={{ background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span>
            {activeMainTab === 'STOCK'
              ? `📈 Saham IDX · ${allStockItems.length} stocks · KLIK BARIS UNTUK DETAIL · TRADINGVIEW & ORDER BOOK`
              : `⚡ Crypto Spot · ${allCryptoItems.length} pairs · KLIK BARIS UNTUK DETAIL`}
          </span>
        </div>
      )}

      {/* VIEW ACCORDING TO ACTIVE MAIN TAB */}
      {activeMainTab === 'TESTING' && (
        <div style={{ padding: '0' }}>
          <TestingHubTab
            paperPortfolio={paperPortfolio}
            currentPrices={Object.fromEntries(allItems.map(i => [i.ticker, i.price]))}
            backtestLab={backtestLab}
            strategyRankings={strategyRankings}
            onSelectTicker={onSelectTicker}
          />
        </div>
      )}

      {activeMainTab === 'CURRENT_TEST' && (
        <div style={{ padding: '12px' }}>
          <VirtualForwardPortfolio
            paperPortfolio={paperPortfolio}
            currentPrices={Object.fromEntries(allItems.map(i => [i.ticker, i.price]))}
            onSelectTicker={onSelectTicker}
          />
        </div>
      )}

      {activeMainTab === 'BACKTEST_LAB' && (
        <div style={{ padding: '12px' }}>
          <BacktestPerformanceLab
            backtestLab={backtestLab}
            strategyRankings={strategyRankings}
          />
        </div>
      )}

      {activeMainTab === 'GLOBAL_MARKETS' && (
        <div style={{ padding: '12px' }}>
          <GlobalMarketsTab onSelectTicker={onSelectTicker} />
        </div>
      )}

      {activeMainTab === 'ECONOMIC_CALENDAR' && (
        <div style={{ padding: '12px' }}>
          <EconomicCalendarTab />
        </div>
      )}

      {activeMainTab === 'PEARSON_CORRELATION' && (
        <div style={{ padding: '12px' }}>
          <PearsonCorrelationWidget />
        </div>
      )}

      {activeMainTab === 'ACADEMY' && (
        <div style={{ padding: '12px' }}>
          <QuantAcademyTab />
        </div>
      )}

      {activeMainTab === 'NEWS' && (
        <div style={{ padding: '12px' }}>
          <NewsTab liveNews={liveNews} macro={macro} />
        </div>
      )}

      {activeMainTab === 'WATCHLIST' && (
        <div style={{ padding: '12px' }}>
          <PersonalWatchlistTab allStocks={allItems} onSelectTicker={onSelectTicker} />
        </div>
      )}

      {(activeMainTab === 'STOCK' || activeMainTab === 'CRYPTO') && (
        <>
          {/* Sub-toolbar */}
          <div style={{
            padding: '8px 12px',
            background: 'var(--bg-panel)',
            borderBottom: 'var(--border-muted)',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Sub-pills for Stock tab */}
            {activeMainTab === 'STOCK' ? (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL_STOCKS', label: 'SEMUA SAHAM (' + allStockItems.length + ')' },
                  { id: 'PLANS', label: '🎯 TOP TRADE PLANS' },
                  { id: 'KONGLO', label: '🏢 KLASTER KONGLO' },
                  { id: 'DIVIDEND', label: '💰 DIVIDEN HUNTER' },
                  { id: 'FOREIGN', label: '🌊 FLOW ASING' }
                ].map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => setStockSubFilter(btn.id)}
                    className={'telemetry-btn ' + (stockSubFilter === btn.id ? 'active' : '')}
                    style={{ fontSize: '10px', padding: '3px 8px' }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                ⚡ SPOT TRADING USDT MURNI (BEBAS RISIKO LIKUIDASI LEVERAGE)
              </div>
            )}

            {/* Real-time search */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type='text'
                placeholder='Cari Ticker / Klaster...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '5px 8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  border: 'var(--border-muted)',
                  background: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  width: '180px',
                  textTransform: 'uppercase'
                }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                ({currentDataset.length} Hasil)
              </span>
            </div>
          </div>

          {/* Table View */}
          <div style={{ overflowX: 'auto', maxHeight: '580px', background: 'var(--bg-panel)' }}>
            <table className='telemetry-table' style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('rank')}>
                    #{getSortIcon('rank')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ticker')}>
                    Ticker{getSortIcon('ticker')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('cluster')}>
                    Konglo / Klaster{getSortIcon('cluster')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('signal')}>
                    Sinyal / Setup{getSortIcon('signal')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('price')}>
                    Harga Terkini{getSortIcon('price')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('changePct')}>
                    Chg %{getSortIcon('changePct')}
                  </th>
                  <th>Entry Zone</th>
                  <th>Hard SL</th>
                  <th>TP1</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('riskReward')}>
                    R:R{getSortIcon('riskReward')}
                  </th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentDataset.length === 0 ? (
                  <tr>
                    <td colSpan='11' style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      Tidak ada instrumen yang sesuai dengan filter atau pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  currentDataset.map((item, idx) => {
                    const isExpanded = expandedId === item.id;
                    const p = item.rawPlan;
                    const c = item.rawCrypto;
                    const s = item.rawStock;

                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          onClick={() => toggleExpand(item.id)}
                          style={{
                            cursor: 'pointer',
                            background: isExpanded ? 'var(--bg-panel-subtle)' : 'transparent',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)', fontSize: '11px' }}>
                            {idx + 1}
                          </td>
                          <td style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>
                            ${item.ticker}
                          </td>
                          <td>
                            <span className='badge' style={{
                              fontSize: '9px',
                              background: 'var(--bg-panel-subtle)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-muted)'
                            }}>
                              {item.cluster || item.categoryLabel || '-'}
                            </span>
                          </td>
                          <td>
                            <span className={'badge ' + (
                              item.signal === 'BREAKOUT' || item.signal === 'HIGH YIELD SAFE' || item.signal === 'FOREIGN BUY' ? 'badge-bull' :
                              item.signal === 'ACCUMULATION' || item.signal === 'SPOT_LONG' ? 'badge-blue' :
                              item.signal === 'TRAP RISK' || item.signal === 'FOREIGN SELL' ? 'badge-bear' : 'badge'
                            )}>
                              {item.signal}
                            </span>
                          </td>
                          <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                            {item.market === 'IDX' ? ('Rp ' + Number(item.price).toLocaleString()) : ('$' + item.price)}
                          </td>
                          <td style={{
                            fontWeight: '700',
                            color: Number(item.changePct) >= 0 ? '#34c759' : '#ff3b30'
                          }}>
                            {Number(item.changePct) >= 0 ? '+' + item.changePct + '%' : item.changePct + '%'}
                          </td>
                          <td>
                            <code>{item.entryRange ? item.entryRange : (item.market === 'IDX' ? ('Rp ' + Number(item.entry).toLocaleString()) : ('$' + item.entry))}</code>
                          </td>
                          <td style={{ color: '#ff3b30' }}>
                            <code>{item.market === 'IDX' ? ('Rp ' + Number(item.stopLoss).toLocaleString()) : ('$' + item.stopLoss)}</code>
                          </td>
                          <td style={{ color: '#34c759', fontWeight: '700' }}>
                            <code>{item.market === 'IDX' ? ('Rp ' + Number(item.target1).toLocaleString()) : ('$' + item.target1)}</code>
                          </td>
                          <td>
                            <span style={{ fontWeight: '700', color: 'var(--accent-blue)' }}>
                              1:{item.riskReward}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <button
                              className='telemetry-btn'
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTicker(item.ticker, item.market);
                              }}
                              style={{ padding: '2px 8px', fontSize: '10px', background: 'var(--text-primary)', color: 'var(--bg-canvas)', marginRight: '4px' }}
                            >
                              📈 CHART
                            </button>
                            <button
                              className='telemetry-btn'
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(item.id);
                              }}
                              style={{ padding: '2px 6px', fontSize: '10px' }}
                            >
                              {isExpanded ? '▲' : '▼'}
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDED PROGRESSIVE DISCLOSURE DRAWER */}
                        {isExpanded && (
                          <tr className='drawer-content' style={{ background: 'var(--bg-panel-subtle)' }}>
                            <td colSpan='11' style={{ padding: '12px 16px', borderBottom: 'var(--border-hairline)', whiteSpace: 'normal' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', fontSize: '11px' }}>
                                
                                {/* Drawer Box 1: Facts & Metrics */}
                                <div className='drawer-box' style={{ background: 'var(--bg-panel)', padding: '10px', border: 'var(--border-muted)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                  <div style={{ fontWeight: '700', color: 'var(--accent-blue)', marginBottom: '6px', fontSize: '10px', letterSpacing: '0.04em' }}>
                                    📊 VERIFIED FACTS &amp; METRICS:
                                  </div>
                                  {p && (
                                    <p style={{ color: 'var(--text-primary)', lineHeight: 1.45, margin: 0 }}>
                                      {p.facts_summary}
                                    </p>
                                  )}
                                  {c && (
                                    <p style={{ color: 'var(--text-primary)', lineHeight: 1.45, margin: 0 }}>
                                      <strong>Pair:</strong> {c.pair} | <strong>24h Vol:</strong> Active Spot | <strong>Conviction:</strong> {c.conviction}
                                    </p>
                                  )}
                                  {s && (
                                    <p style={{ color: 'var(--text-primary)', lineHeight: 1.45, margin: 0 }}>
                                      <strong>Emiten:</strong> {s.company_name} | <strong>MA20:</strong> Rp {s.ma20} | <strong>RSI 14:</strong> {s.rsi_14}
                                    </p>
                                  )}
                                </div>

                                {/* Drawer Box 2: Opinion & Sizing Math */}
                                <div className='drawer-box' style={{ background: 'var(--bg-panel)', padding: '10px', border: 'var(--border-muted)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <div style={{ fontWeight: '700', color: 'var(--accent-orange)', fontSize: '10px', letterSpacing: '0.04em' }}>
                                      💡 THESIS &amp; POSITION SIZING MATH:
                                    </div>
                                    <div>
                                      <button 
                                        className="telemetry-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onOpenLotCalc) onOpenLotCalc(item.entry, item.stopLoss);
                                        }}
                                        style={{ padding: '2px 8px', fontSize: '10px', background: 'var(--accent-green)', color: '#fff' }}
                                      >
                                        💰 Hitung Lot
                                      </button>
                                      <button 
                                        className="telemetry-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOrderBookModal({ isOpen: true, ticker: item.ticker, price: item.price });
                                        }}
                                        style={{ padding: '2px 8px', fontSize: '10px', background: '#0066cc', color: '#fff', marginLeft: '6px' }}
                                      >
                                        📊 Order Book
                                      </button>
                                    </div>
                                  </div>
                                  {p && (
                                    <>
                                      <p style={{ color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.45 }}>
                                        <strong>Thesis:</strong> {p.opinion_thesis}
                                      </p>
                                      <div style={{ background: 'var(--bg-panel-subtle)', border: '1px solid var(--border-muted)', padding: '6px 8px', fontSize: '10px', color: 'var(--accent-orange)', fontWeight: '700' }}>
                                        {p.position_size_math}
                                      </div>
                                    </>
                                  )}
                                  {c && (
                                    <p style={{ color: 'var(--text-primary)', lineHeight: 1.45, margin: 0 }}>
                                      <strong>Thesis:</strong> {c.catalyst_thesis}
                                    </p>
                                  )}
                                  {s && (
                                    <p style={{ color: 'var(--text-primary)', lineHeight: 1.45, margin: 0 }}>
                                      <strong>Klaster:</strong> {item.cluster} | <strong>Vol:</strong> {Number(s.volume || 0).toLocaleString()}
                                    </p>
                                  )}
                                </div>

                                {/* Drawer Box 3: Invalidation Rules (Cleaned Bullets) */}
                                <div className='drawer-box' style={{ background: 'var(--bg-panel)', padding: '10px', border: 'var(--border-muted)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                  <div style={{ fontWeight: '700', color: '#ff3b30', marginBottom: '6px', fontSize: '10px', letterSpacing: '0.04em' }}>
                                    ⛔ {p?.three_invalidations?.length ? '3 INVALIDATION (CUT RULES):' : 'INVALIDATION (CUT RULES):'}
                                  </div>
                                  {p && Array.isArray(p.three_invalidations) && p.three_invalidations.map((inv, i) => {
                                    const cleanText = inv.replace(/^\d+[\.\)]\s*/, '');
                                    return (
                                      <div key={i} style={{ color: 'var(--text-primary)', marginBottom: '4px', fontSize: '10px', lineHeight: 1.4 }}>
                                        • {cleanText}
                                      </div>
                                    );
                                  })}
                                  {c && (
                                    <div style={{ color: '#ff3b30', fontSize: '10px', lineHeight: 1.4 }}>
                                      • {c.invalidation_rule}
                                    </div>
                                  )}
                                  {(!p && !c) && (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', lineHeight: 1.4 }}>
                                      • Penutupan candle harian di bawah level Hard SL Rp {item.stopLoss} atau MA20.
                                    </div>
                                  )}
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div style={{
            padding: '6px 12px',
            background: 'var(--bg-panel-subtle)',
            borderTop: 'var(--border-hairline)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>
              MENAMPILKAN {currentDataset.length} DARI {activeMainTab === 'STOCK' ? allStockItems.length : allCryptoItems.length} INSTRUMEN
            </div>
            <div>
              ASTRA DISCIPLINE ENGINE · STRICT 1:2 R:R RATIO · ZERO EMOTIONAL HOPE
            </div>
          </div>
        </>
      )}

      {/* Level 2 Order Book Modal */}
      {orderBookModal.isOpen && (
        <OrderBookSimulator
          ticker={orderBookModal.ticker}
          currentPrice={orderBookModal.price}
          isOpen={orderBookModal.isOpen}
          onClose={() => setOrderBookModal({ isOpen: false, ticker: 'BBRI', price: 4900 })}
        />
      )}
    </div>
  );
}