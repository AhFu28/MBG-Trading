import React, { useState, useMemo } from 'react';
import NewsTab from './NewsTab.jsx';
import PersonalWatchlistTab from './PersonalWatchlistTab.jsx';
import KnowledgeWikiTab from './KnowledgeWikiTab.jsx';

export default function MasterQuantLeaderboard({
  tradePlans = [],
  cryptoSpotList = [],
  conglomerates = {},
  dividendHunters = [],
  foreignFlow = {},
  liveNews = [],
  macro = {},
  onSelectTicker
}) {
  // 5 Main Tabs requested by user:
  // 1: STOCK (IDX)
  // 2: CRYPTO
  // 3: NEWS (Live News wire)
  // 4: WATCHLIST (Custom manual picker stored in browser localStorage)
  // 5: WIKI (Institutional definitions & glossary)
  const [activeMainTab, setActiveMainTab] = useState('STOCK');
  
  // Sub-filter inside STOCK tab
  const [stockSubFilter, setStockSubFilter] = useState('ALL_STOCKS'); // ALL_STOCKS | PLANS | KONGLO | DIVIDEND | FOREIGN
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Sorting state: field and direction ('asc' | 'desc')
  const [sortField, setSortField] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');

  // Conglomerate ticker lookup map
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

  // Build unified items list
  const { allItems, allStockItems, allCryptoItems } = useMemo(() => {
    const items = [];

    // 1. Trade Plans
    tradePlans.forEach((plan, idx) => {
      const ticker = plan.clean_ticker || (plan.symbol ? plan.symbol.replace('.JK', '') : ('PLAN-' + idx));
      items.push({
        id: plan.plan_id || ('plan-' + idx),
        rank: idx + 1,
        ticker: ticker,
        fullSymbol: plan.symbol,
        market: plan.market,
        cluster: kongloLookup[ticker] || (plan.market === 'IDX' ? 'ASTRA / BLUECHIP' : 'CRYPTO ALPHA'),
        categoryLabel: plan.market === 'IDX' ? 'ASTRA PLAN (IDX)' : 'CRYPTO ALPHA (USDT)',
        price: plan.entry_price || 0,
        changePct: plan.market === 'IDX' ? 1.5 : 3.2,
        signal: plan.technical_signal || 'BUY',
        signalType: 'BULL',
        entry: plan.entry_price || 0,
        stopLoss: plan.stop_loss || 0,
        target1: plan.target_1 || 0,
        riskReward: plan.risk_reward_ratio || 2.2,
        isTradePlan: true,
        rawPlan: plan
      });
    });

    // 2. Crypto Spot Pairs
    cryptoSpotList.forEach((c) => {
      const existing = items.find(i => i.ticker === c.pair);
      if (!existing) {
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
          entry: c.entry_high || c.current_price || 0,
          stopLoss: c.stop_loss || 0,
          target1: c.take_profit_1 || 0,
          riskReward: c.risk_reward_ratio || 2.0,
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
            items.push({
              id: 'konglo-' + s.ticker,
              rank: items.length + 1,
              ticker: s.ticker,
              fullSymbol: s.full_ticker || (s.ticker + '.JK'),
              market: 'IDX',
              cluster: cleanGroup,
              categoryLabel: cleanGroup,
              price: s.price || 0,
              changePct: s.change_pct || 0,
              signal: s.technical_signal || 'MONITOR',
              signalType: s.technical_signal === 'BREAKOUT' ? 'BULL' : 'BLUE',
              entry: s.price || 0,
              stopLoss: Math.round(Number(s.price || 0) * 0.95),
              target1: Math.round(Number(s.price || 0) * 1.08),
              riskReward: 2.1,
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
        items.push({
          id: 'div-' + d.ticker,
          rank: items.length + 1,
          ticker: d.ticker,
          fullSymbol: d.full_ticker || (d.ticker + '.JK'),
          market: 'IDX',
          cluster: kongloLookup[d.ticker] || 'DIVIDEND QUALITY',
          categoryLabel: 'YIELD ' + d.dividend_yield_pct + '%',
          price: d.price || 0,
          changePct: d.change_pct || 0,
          signal: d.dividend_trap_risk === 'LOW' ? 'HIGH YIELD SAFE' : 'TRAP RISK',
          signalType: d.dividend_trap_risk === 'LOW' ? 'BULL' : 'WARN',
          entry: d.price || 0,
          stopLoss: Math.round(Number(d.price || 0) * 0.94),
          target1: Math.round(Number(d.price || 0) * 1.10),
          riskReward: 2.4,
          isTradePlan: false,
          rawStock: d
        });
      }
    });

    // 5. Foreign Flow
    const foreignList = [...(foreignFlow?.top_net_buys || []), ...(foreignFlow?.top_net_sells || [])];
    foreignList.forEach(f => {
      if (!items.find(i => i.ticker === f.ticker)) {
        items.push({
          id: 'foreign-' + f.ticker,
          rank: items.length + 1,
          ticker: f.ticker,
          fullSymbol: f.ticker + '.JK',
          market: 'IDX',
          cluster: kongloLookup[f.ticker] || 'FOREIGN TARGET',
          categoryLabel: f.flow_type || 'FOREIGN FLOW',
          price: f.price || 0,
          changePct: f.change_pct || 0,
          signal: f.flow_type === 'ACCUMULATION' ? 'FOREIGN BUY' : 'FOREIGN SELL',
          signalType: f.flow_type === 'ACCUMULATION' ? 'BULL' : 'WARN',
          entry: f.price || 0,
          stopLoss: Math.round(Number(f.price || 0) * 0.95),
          target1: Math.round(Number(f.price || 0) * 1.07),
          riskReward: 2.0,
          isTradePlan: false,
          rawStock: f
        });
      }
    });

    const stockOnly = items.filter(i => i.market === 'IDX');
    const cryptoOnly = items.filter(i => i.market === 'CRYPTO');

    return { allItems: items, allStockItems: stockOnly, allCryptoItems: cryptoOnly };
  }, [tradePlans, cryptoSpotList, conglomerates, dividendHunters, foreignFlow, kongloLookup]);

  // Filtering based on current view
  const currentDataset = useMemo(() => {
    let list = [];
    if (activeMainTab === 'STOCK') {
      if (stockSubFilter === 'PLANS') {
        list = allStockItems.filter(i => i.isTradePlan);
      } else if (stockSubFilter === 'KONGLO') {
        list = allStockItems.filter(i => kongloLookup[i.ticker]);
      } else if (stockSubFilter === 'DIVIDEND') {
        list = allStockItems.filter(i => i.id.startsWith('div-') || (i.categoryLabel && i.categoryLabel.includes('YIELD')));
      } else if (stockSubFilter === 'FOREIGN') {
        list = allStockItems.filter(i => i.id.startsWith('foreign-') || (i.categoryLabel && i.categoryLabel.includes('FOREIGN')));
      } else {
        list = allStockItems;
      }
    } else if (activeMainTab === 'CRYPTO') {
      list = allCryptoItems;
    } else {
      list = allItems;
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(i => 
        (i.ticker && i.ticker.toLowerCase().includes(q)) ||
        (i.cluster && i.cluster.toLowerCase().includes(q)) ||
        (i.signal && i.signal.toLowerCase().includes(q))
      );
    }

    // Sorting
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
  }, [activeMainTab, stockSubFilter, searchTerm, allStockItems, allCryptoItems, allItems, sortField, sortDirection, kongloLookup]);

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
      {/* 1. Header Bar with the 5 PRIMARY TABS */}
      <div className='telemetry-header' style={{ background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--accent-orange)', fontWeight: '900', marginRight: '6px' }}>
            TERMINAL NAVIGATION:
          </span>

          {/* TAB 1: STOCK */}
          <button
            onClick={() => { setActiveMainTab('STOCK'); setExpandedId(null); }}
            className={'telemetry-btn ' + (activeMainTab === 'STOCK' ? 'active' : '')}
            style={{ fontSize: '11px', fontWeight: '700', padding: '5px 12px' }}
          >
            📈 SAHAM IDX ({allStockItems.length})
          </button>

          {/* TAB 2: CRYPTO */}
          <button
            onClick={() => { setActiveMainTab('CRYPTO'); setExpandedId(null); }}
            className={'telemetry-btn ' + (activeMainTab === 'CRYPTO' ? 'active' : '')}
            style={{ fontSize: '11px', fontWeight: '700', padding: '5px 12px' }}
          >
            ⚡ CRYPTO SPOT ({allCryptoItems.length})
          </button>

          {/* TAB 3: NEWS */}
          <button
            onClick={() => { setActiveMainTab('NEWS'); setExpandedId(null); }}
            className={'telemetry-btn ' + (activeMainTab === 'NEWS' ? 'active' : '')}
            style={{ fontSize: '11px', fontWeight: '700', padding: '5px 12px' }}
          >
            📰 LIVE NEWS ({Array.isArray(liveNews) ? liveNews.length : 0})
          </button>

          {/* TAB 4: WATCHLIST */}
          <button
            onClick={() => { setActiveMainTab('WATCHLIST'); setExpandedId(null); }}
            className={'telemetry-btn ' + (activeMainTab === 'WATCHLIST' ? 'active' : '')}
            style={{ fontSize: '11px', fontWeight: '700', padding: '5px 12px' }}
          >
            ⭐ WATCHLIST SAYA
          </button>

          {/* TAB 5: WIKI */}
          <button
            onClick={() => { setActiveMainTab('WIKI'); setExpandedId(null); }}
            className={'telemetry-btn ' + (activeMainTab === 'WIKI' ? 'active' : '')}
            style={{ fontSize: '11px', fontWeight: '700', padding: '5px 12px' }}
          >
            📚 WIKI &amp; KAMUS
          </button>
        </div>

        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          {activeMainTab === 'STOCK' || activeMainTab === 'CRYPTO' ? 'KLIK BARIS UNTUK DETAIL · TRADINGVIEW MODAL ON DEMAND' : 'INSTITUTIONAL QUANT SUITE'}
        </span>
      </div>

      {/* RENDER VIEW ACCORDING TO ACTIVE MAIN TAB */}
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

      {activeMainTab === 'WIKI' && (
        <div style={{ padding: '12px' }}>
          <KnowledgeWikiTab />
        </div>
      )}

      {(activeMainTab === 'STOCK' || activeMainTab === 'CRYPTO') && (
        <>
          {/* Sub-toolbar for STOCK / CRYPTO view */}
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
                            <code>{item.market === 'IDX' ? ('Rp ' + Number(item.entry).toLocaleString()) : ('$' + item.entry)}</code>
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

                        {/* EXPANDED PROGRESSIVE DISCLOSURE DRAWER (WITH WRAP FIX) */}
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
                                  <div style={{ fontWeight: '700', color: 'var(--accent-orange)', marginBottom: '6px', fontSize: '10px', letterSpacing: '0.04em' }}>
                                    💡 THESIS &amp; POSITION SIZING MATH:
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

                                {/* Drawer Box 3: Invalidation Rules */}
                                <div className='drawer-box' style={{ background: 'var(--bg-panel)', padding: '10px', border: 'var(--border-muted)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                  <div style={{ fontWeight: '700', color: '#ff3b30', marginBottom: '6px', fontSize: '10px', letterSpacing: '0.04em' }}>
                                    ⛔ 3 INVALIDATION (CUT RULES):
                                  </div>
                                  {p && Array.isArray(p.three_invalidations) && p.three_invalidations.map((inv, i) => (
                                    <div key={i} style={{ color: 'var(--text-primary)', marginBottom: '4px', fontSize: '10px', lineHeight: 1.4 }}>
                                      • {inv}
                                    </div>
                                  ))}
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
    </div>
  );
}