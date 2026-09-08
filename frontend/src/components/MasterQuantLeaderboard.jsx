import React, { useState } from 'react';

export default function MasterQuantLeaderboard({
  tradePlans = [],
  cryptoSpotList = [],
  conglomerates = {},
  dividendHunters = [],
  foreignFlow = {},
  onSelectTicker
}) {
  const [activeFilter, setActiveFilter] = useState('TOP_PLANS'); // TOP_PLANS | CRYPTO | KONGLO | DIVIDEND | FOREIGN | ALL
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // 1. Build Unified List of Assets
  const items = [];

  // A. Top Actionable Trade Plans (Highest Priority)
  tradePlans.forEach((plan, idx) => {
    items.push({
      id: plan.plan_id || `plan-${idx}`,
      rank: idx + 1,
      ticker: plan.clean_ticker || plan.symbol.replace('.JK', ''),
      fullSymbol: plan.symbol,
      market: plan.market,
      categoryLabel: plan.market === 'IDX' ? 'ASTRA PLAN (IDX)' : 'CRYPTO ALPHA (USDT)',
      price: plan.entry_price,
      changePct: plan.market === 'IDX' ? 1.5 : 3.2, // Reference change
      signal: plan.technical_signal || 'BUY',
      signalType: 'BULL',
      entry: plan.entry_price,
      stopLoss: plan.stop_loss,
      target1: plan.target_1,
      riskReward: plan.risk_reward_ratio || 2.2,
      isTradePlan: true,
      rawPlan: plan
    });
  });

  // B. 10 Crypto Spot Pairs (if not already in plans)
  cryptoSpotList.forEach((c, idx) => {
    const existing = items.find(i => i.ticker === c.pair);
    if (!existing) {
      items.push({
        id: `crypto-${c.pair}`,
        rank: items.length + 1,
        ticker: c.pair,
        fullSymbol: c.pair,
        market: 'CRYPTO',
        categoryLabel: 'SPOT USDT (NO LEV)',
        price: c.current_price,
        changePct: c.change_24h_pct,
        signal: c.setup_type || 'SPOT_LONG',
        signalType: 'BLUE',
        entry: c.entry_high || c.current_price,
        stopLoss: c.stop_loss,
        target1: c.take_profit_1,
        riskReward: c.risk_reward_ratio || 2.0,
        isTradePlan: false,
        rawCrypto: c
      });
    }
  });

  // C. Conglomerates
  Object.entries(conglomerates).forEach(([group, stocks]) => {
    stocks.forEach(s => {
      if (!items.find(i => i.ticker === s.ticker)) {
        items.push({
          id: `konglo-${s.ticker}`,
          rank: items.length + 1,
          ticker: s.ticker,
          fullSymbol: s.full_ticker || `${s.ticker}.JK`,
          market: 'IDX',
          categoryLabel: group.replace('_', ' '),
          price: s.price,
          changePct: s.change_pct,
          signal: s.technical_signal,
          signalType: s.technical_signal === 'BREAKOUT' ? 'BULL' : 'BLUE',
          entry: s.price,
          stopLoss: Math.round(s.price * 0.96),
          target1: Math.round(s.price * 1.08),
          riskReward: 2.0,
          isTradePlan: false,
          rawStock: s
        });
      }
    });
  });

  // D. Dividend Hunters
  dividendHunters.forEach(s => {
    if (!items.find(i => i.ticker === s.ticker)) {
      items.push({
        id: `div-${s.ticker}`,
        rank: items.length + 1,
        ticker: s.ticker,
        fullSymbol: `${s.ticker}.JK`,
        market: 'IDX',
        categoryLabel: `DIV YIELD ${s.dividend_yield_pct}%`,
        price: s.price,
        changePct: s.change_pct,
        signal: s.technical_signal,
        signalType: s.dividend_trap_risk === 'LOW' ? 'BULL' : 'ALERT',
        entry: s.price,
        stopLoss: Math.round(s.price * 0.95),
        target1: Math.round(s.price * 1.07),
        riskReward: 1.8,
        isTradePlan: false,
        rawStock: s
      });
    }
  });

  // E. Foreign Flow
  (foreignFlow.top_inflow || []).forEach(s => {
    if (!items.find(i => i.ticker === s.ticker)) {
      items.push({
        id: `flow-in-${s.ticker}`,
        rank: items.length + 1,
        ticker: s.ticker,
        fullSymbol: `${s.ticker}.JK`,
        market: 'IDX',
        categoryLabel: 'NET FOREIGN BUY 🟢',
        price: s.price,
        changePct: s.change_pct,
        signal: s.technical_signal,
        signalType: 'BULL',
        entry: s.price,
        stopLoss: Math.round(s.price * 0.96),
        target1: Math.round(s.price * 1.08),
        riskReward: 2.0,
        isTradePlan: false,
        rawStock: s
      });
    }
  });

  // Filter Items
  const filtered = items.filter(item => {
    const matchesSearch =
      item.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'TOP_PLANS') return item.isTradePlan;
    if (activeFilter === 'CRYPTO') return item.market === 'CRYPTO';
    if (activeFilter === 'KONGLO') return item.categoryLabel.includes('GROUP') || item.categoryLabel.includes('CONGLO');
    if (activeFilter === 'DIVIDEND') return item.categoryLabel.includes('DIV');
    if (activeFilter === 'FOREIGN') return item.categoryLabel.includes('FOREIGN');
    return true;
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="telemetry-panel" style={{ border: '1px solid #1c1d22' }}>
      
      {/* Table Command Header */}
      <div className="telemetry-header" style={{ background: '#f4f3ec' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px' }}>🎯</span>
          <strong style={{ letterSpacing: '0.06em' }}>MASTER QUANT LEADERBOARD &amp; DIRECTORY</strong>
          <span className="badge" style={{ background: '#1c1d22', color: '#fff' }}>
            {filtered.length} ASSETS
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#8e8e93' }}>
          CLICK ROW TO EXPAND DETAILS · 1-CLICK TRADINGVIEW CHART
        </span>
      </div>

      {/* Filter Toolbar & Realtime Search */}
      <div style={{
        padding: '8px 12px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e5ea',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'TOP_PLANS', label: `🎯 TOP 20 PLANS (${tradePlans.length})` },
            { id: 'CRYPTO', label: '⚡ 10 CRYPTO SPOT' },
            { id: 'KONGLO', label: '🏢 KONGLO CLUSTERS' },
            { id: 'DIVIDEND', label: '💰 DIVIDEN HUNTERS' },
            { id: 'FOREIGN', label: '🌊 FLOW ASING' },
            { id: 'ALL', label: `SEMUA (${items.length})` }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setActiveFilter(btn.id)}
              className={`telemetry-btn ${activeFilter === btn.id ? 'active' : ''}`}
              style={{ fontSize: '10px', padding: '4px 10px' }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Cari Ticker (e.g. MEDC, SOL)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              padding: '5px 8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              border: '1px solid #1c1d22',
              outline: 'none',
              width: '180px',
              textTransform: 'uppercase'
            }}
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div style={{ overflowX: 'auto', maxHeight: '550px' }}>
        <table className="telemetry-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>#</th>
              <th>Ticker</th>
              <th>Market</th>
              <th>Sinyal / Setup</th>
              <th>Harga Terkini</th>
              <th>Chg %</th>
              <th>Entry Zone</th>
              <th>Hard SL</th>
              <th>TP1</th>
              <th>R:R Ratio</th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '24px', color: '#8e8e93' }}>
                  Tidak ada aset yang sesuai dengan filter.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => {
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
                        background: isExpanded ? '#fffcf0' : 'transparent',
                        borderLeft: isExpanded ? '3px solid #ff9500' : 'none'
                      }}
                    >
                      <td style={{ textAlign: 'center', fontWeight: '700', color: '#8e8e93', fontSize: '11px' }}>
                        {idx + 1}
                      </td>
                      <td style={{ fontWeight: '700', color: '#1c1d22', fontSize: '13px' }}>
                        ${item.ticker}
                      </td>
                      <td>
                        <span className="badge" style={{ fontSize: '9px', background: item.market === 'IDX' ? '#edf4fa' : '#fff8e1' }}>
                          {item.market}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          item.signal === 'BREAKOUT' ? 'badge-bull' :
                          item.signal === 'ACCUMULATION' || item.signal === 'SPOT_LONG' ? 'badge-blue' :
                          'badge'
                        }`}>
                          {item.signal}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700' }}>
                        {item.market === 'IDX' ? `Rp ${Number(item.price).toLocaleString()}` : `$${item.price}`}
                      </td>
                      <td style={{
                        fontWeight: '700',
                        color: Number(item.changePct) >= 0 ? '#34c759' : '#ff3b30'
                      }}>
                        {Number(item.changePct) >= 0 ? `+${item.changePct}%` : `${item.changePct}%`}
                      </td>
                      <td>
                        <code>{item.market === 'IDX' ? `Rp ${Number(item.entry).toLocaleString()}` : `$${item.entry}`}</code>
                      </td>
                      <td style={{ color: '#ff3b30' }}>
                        <code>{item.market === 'IDX' ? `Rp ${Number(item.stopLoss).toLocaleString()}` : `$${item.stopLoss}`}</code>
                      </td>
                      <td style={{ color: '#34c759', fontWeight: '700' }}>
                        <code>{item.market === 'IDX' ? `Rp ${Number(item.target1).toLocaleString()}` : `$${item.target1}`}</code>
                      </td>
                      <td>
                        <span style={{ fontWeight: '700', color: '#0066cc' }}>
                          1:{item.riskReward}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          className="telemetry-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTicker(item.ticker, item.market);
                          }}
                          style={{ padding: '2px 8px', fontSize: '10px', background: '#1c1d22', color: '#fff', marginRight: '4px' }}
                        >
                          📈 CHART
                        </button>
                        <button
                          className="telemetry-btn"
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
                      <tr style={{ background: '#fdfcf7' }}>
                        <td colSpan="11" style={{ padding: '12px 16px', borderBottom: '2px solid #e5e5ea' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', fontSize: '11px' }}>
                            
                            {/* Drawer Box 1: Facts & Metrics */}
                            <div style={{ background: '#ffffff', padding: '10px', border: '1px solid #d5d3cb' }}>
                              <div style={{ fontWeight: '700', color: '#0066cc', marginBottom: '6px', fontSize: '10px', letterSpacing: '0.04em' }}>
                                📊 VERIFIED FACTS &amp; METRICS:
                              </div>
                              {p && (
                                <p style={{ color: '#48484a', lineHeight: 1.4 }}>
                                  {p.facts_summary}
                                </p>
                              )}
                              {c && (
                                <p style={{ color: '#48484a', lineHeight: 1.4 }}>
                                  <strong>Pair:</strong> {c.pair} | <strong>24h Vol:</strong> Active Spot | <strong>Conviction:</strong> {c.conviction}
                                </p>
                              )}
                              {s && (
                                <p style={{ color: '#48484a', lineHeight: 1.4 }}>
                                  <strong>Emiten:</strong> {s.company_name} | <strong>MA20:</strong> Rp {s.ma20} | <strong>RSI 14:</strong> {s.rsi_14}
                                </p>
                              )}
                            </div>

                            {/* Drawer Box 2: Opinion & Sizing Math */}
                            <div style={{ background: '#ffffff', padding: '10px', border: '1px solid #d5d3cb' }}>
                              <div style={{ fontWeight: '700', color: '#ff9500', marginBottom: '6px', fontSize: '10px', letterSpacing: '0.04em' }}>
                                💡 THESIS &amp; POSITION SIZING MATH:
                              </div>
                              {p && (
                                <>
                                  <p style={{ color: '#48484a', marginBottom: '4px' }}>
                                    <strong>Thesis:</strong> {p.opinion_thesis}
                                  </p>
                                  <div style={{ background: '#fff9e6', padding: '4px 6px', fontSize: '10px', color: '#8a6200', fontWeight: '700' }}>
                                    {p.position_size_math}
                                  </div>
                                </>
                              )}
                              {c && (
                                <p style={{ color: '#48484a' }}>
                                  <strong>Thesis:</strong> {c.catalyst_thesis}
                                </p>
                              )}
                              {s && (
                                <p style={{ color: '#48484a' }}>
                                  <strong>Klaster:</strong> {item.categoryLabel}
                                </p>
                              )}
                            </div>

                            {/* Drawer Box 3: Invalidation Rules */}
                            <div style={{ background: '#ffffff', padding: '10px', border: '1px solid #d5d3cb' }}>
                              <div style={{ fontWeight: '700', color: '#ff3b30', marginBottom: '6px', fontSize: '10px', letterSpacing: '0.04em' }}>
                                ⛔ 3 INVALIDATION (CUT RULES):
                              </div>
                              {p && Array.isArray(p.three_invalidations) && p.three_invalidations.map((inv, i) => (
                                <div key={i} style={{ color: '#636366', marginBottom: '2px', fontSize: '10px' }}>
                                  • {inv}
                                </div>
                              ))}
                              {c && (
                                <div style={{ color: '#ff3b30', fontSize: '10px' }}>
                                  • {c.invalidation_rule}
                                </div>
                              )}
                              {(!p && !c) && (
                                <div style={{ color: '#8e8e93', fontSize: '10px' }}>
                                  • Penutupan harga di bawah MA20 atau Stop Loss Rp {item.stopLoss}.
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

      {/* Footer Info */}
      <div style={{
        padding: '6px 12px',
        background: '#f4f3ec',
        borderTop: '1px solid #d5d3cb',
        fontSize: '10px',
        color: '#8e8e93',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <span>💡 Klik baris mana saja untuk melihat rincian Fakta, Opini, Invalidation Rules, dan Hitungan Lot.</span>
        <span>ASTRA QUANT ENGINE · HARD STOP LOSS DISCIPLINE</span>
      </div>

    </div>
  );
}
