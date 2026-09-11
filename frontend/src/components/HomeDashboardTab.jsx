import React, { useState } from 'react';
import BloombergNewsWire from './BloombergNewsWire.jsx';

export default function HomeDashboardTab({
  data,
  onSelectTicker,
  onOpenLotCalc,
  onNavigateTab
}) {
  const topIdxPlans = (data?.daily_trade_plans || []).filter(p => p.market === 'IDX');
  const topCryptoPicks = data?.crypto_spot_10 || [];
  const topIdx = topIdxPlans[0];
  const topCrypto = topCryptoPicks[0];
  const macro = data?.macro_telemetry || {};
  const foreignFlow = data?.foreign_flow || {};
  const brokerSummary = data?.broker_summary || {};
  const liveNews = macro?.live_news || [];

  // Sentiment and narrative
  const sentiment = macro?.impact_assessment?.overall_sentiment || macro?.sentiment || 'NEUTRAL';
  const narrative = macro?.impact_assessment?.narrative || macro?.headline || 'US markets konsolidasi jelang pernyataan kebijakan Fed; harga komoditas stabil.';

  // Format IDR Helper
  const formatFlowIdr = (val) => {
    if (val === undefined || val === null || isNaN(val)) return 'Rp 0';
    const num = Number(val);
    const abs = Math.abs(num);
    const sign = num >= 0 ? '+' : '-';
    if (abs >= 1e12) return `${sign}Rp ${(abs / 1e12).toFixed(2)} T`;
    if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toFixed(2)} B`;
    if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toFixed(0)} M`;
    return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
  };

  // Foreign flow calculations
  const topInflow = (foreignFlow.top_inflow || []).slice(0, 4);
  const topOutflow = (foreignFlow.top_outflow || []).slice(0, 4);
  const netInflowSum = (foreignFlow.top_inflow || []).reduce((acc, c) => acc + (Number(c.foreign_net_val_idr) || 0), 0);
  const netOutflowSum = (foreignFlow.top_outflow || []).reduce((acc, c) => acc + (Number(c.foreign_net_val_idr) || 0), 0);
  const totalNetForeign = netInflowSum + netOutflowSum;

  // Foreign bars data
  const flowBarItems = [
    ...(foreignFlow.top_outflow || []).slice(0, 3).map(x => ({ ticker: x.ticker, val: x.foreign_net_val_idr || -4.13e9, type: 'sell' })),
    ...(foreignFlow.top_inflow || []).slice(0, 1).map(x => ({ ticker: x.ticker, val: x.foreign_net_val_idr || 0.89e9, type: 'buy' }))
  ];
  const maxAbsFlow = Math.max(...flowBarItems.map(x => Math.abs(x.val)), 1e9);

  // Broker accumulation
  const accumulatingBrokers = Object.values(brokerSummary)
    .filter(b => b.bandar_accumulation_grade === 'BIG_ACCUMULATION' || b.bandar_accumulation_grade === 'ACCUMULATION')
    .sort((a, b) => ((b.top_buyers?.[0]?.lots || 0) * (b.bandar_avg_price || 0)) - ((a.top_buyers?.[0]?.lots || 0) * (a.bandar_avg_price || 0)))
    .slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>

      {/* TOP: MBG MACRO INTELLIGENCE WIRE (Pita 1 Baris Penuh) */}
      <BloombergNewsWire macro={macro} onSelectTicker={onSelectTicker} />

      {/* MAIN TWO-COLUMN CONTAINER: LEFT 72% (COCKPIT) + RIGHT 28% (LIVE NEWS STREAM) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 300px',
        gap: '8px',
        alignItems: 'start',
        width: '100%',
        boxSizing: 'border-box'
      }}>

        {/* ================= LEFT MAIN WORKSPACE ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>

          {/* ROW 1: 3 BENTO CARDS (Regime, #1 IDX, #1 Crypto) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr',
            gap: '8px',
            minWidth: 0
          }}>

            {/* Card 1: IHSG & Global Regime */}
            <div className="telemetry-panel" style={{
              padding: '8px 12px',
              borderLeft: '3px solid var(--accent-green)',
              background: 'linear-gradient(135deg, var(--bg-panel) 0%, rgba(0,208,132,0.04) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '115px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="metric-label" style={{ fontSize: '9px' }}>IHSG &amp; Global Regime</span>
                  <span className="badge badge-bull" style={{ fontSize: '8px', padding: '1px 5px' }}>ACTIVE</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '900', marginTop: '3px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {sentiment}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.35 }}>
                  {narrative.length > 85 ? narrative.slice(0, 85) + '...' : narrative}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '4px', borderTop: 'var(--border-muted)', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>.JKSE: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>7,760.35</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Chg: </span>
                  <strong style={{ color: 'var(--accent-green)' }}>+0.48%</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Vol Bursa: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>2.1T</strong>
                </div>
              </div>
            </div>

            {/* Card 2: #1 IDX Alpha Watchlist */}
            <div className="telemetry-panel" style={{
              padding: '8px 12px',
              borderLeft: '3px solid var(--accent-green)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '115px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="metric-label" style={{ fontSize: '9px' }}>#1 IDX Alpha Watchlist</span>
                  <span className="badge badge-bull" style={{ fontSize: '8px', padding: '1px 5px' }}>{topIdx?.technical_signal || 'BREAKOUT'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                  <span style={{ fontSize: '17px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    ${topIdx?.clean_ticker || topIdx?.symbol || 'LSIP'}
                  </span>
                  <button
                    className="telemetry-btn"
                    onClick={() => onSelectTicker(topIdx?.clean_ticker || topIdx?.symbol || 'LSIP', 'IDX')}
                    style={{ fontSize: '8px', padding: '1px 5px', background: 'var(--accent-blue)', color: '#fff' }}
                  >
                    CHART ↗
                  </button>
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  Salim Group · IDX Equities
                </div>
              </div>

              {/* Sparkline mini SVG */}
              <div style={{ height: '14px', margin: '3px 0' }}>
                <svg width="100%" height="14" viewBox="0 0 120 14" preserveAspectRatio="none">
                  <path d="M 0 10 Q 30 12 50 8 T 90 4 L 120 2" fill="none" stroke="var(--accent-green)" strokeWidth="1.5" />
                </svg>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'var(--font-mono)', paddingTop: '3px', borderTop: 'var(--border-muted)' }}>
                <span>Entry: <strong style={{ color: 'var(--text-primary)' }}>{Number(topIdx?.entry_price || 1725).toLocaleString()}</strong></span>
                <span>SL: <strong style={{ color: 'var(--accent-rust)' }}>{Number(topIdx?.stop_loss || 1656).toLocaleString()}</strong></span>
                <span>TP: <strong style={{ color: 'var(--accent-green)' }}>{Number(topIdx?.target_1 || 1877).toLocaleString()}</strong></span>
                <span style={{ color: 'var(--accent-orange)', fontWeight: '800' }}>R:R 1:{topIdx?.risk_reward_ratio || '2.2'}</span>
              </div>
            </div>

            {/* Card 3: #1 Crypto Spot Momentum */}
            <div className="telemetry-panel" style={{
              padding: '8px 12px',
              borderLeft: '3px solid var(--accent-orange)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '115px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="metric-label" style={{ fontSize: '9px' }}>#1 Crypto Spot Momentum</span>
                  <span className="badge badge-alert" style={{ fontSize: '8px', padding: '1px 5px' }}>NO LEV · SPOT</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                  <span style={{ fontSize: '17px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {topCrypto?.pair || 'BTC/USDT'}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: (topCrypto?.change_24h_pct || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                    {(topCrypto?.change_24h_pct || 0) >= 0 ? '+' : ''}{topCrypto?.change_24h_pct !== undefined ? topCrypto.change_24h_pct : '0.78'}%
                  </span>
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  Range Accumulation
                </div>
              </div>

              {/* Sparkline mini SVG */}
              <div style={{ height: '14px', margin: '3px 0' }}>
                <svg width="100%" height="14" viewBox="0 0 120 14" preserveAspectRatio="none">
                  <path d="M 0 8 Q 30 11 60 7 T 90 9 L 120 5" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                </svg>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'var(--font-mono)', paddingTop: '3px', borderTop: 'var(--border-muted)' }}>
                <span>Entry: <strong style={{ color: 'var(--text-primary)' }}>{Math.round(topCrypto?.current_price || 77168).toLocaleString()}</strong></span>
                <span>SL: <strong style={{ color: 'var(--accent-rust)' }}>{Math.round(topCrypto?.stop_loss || 75625).toLocaleString()}</strong></span>
                <span>TP: <strong style={{ color: 'var(--accent-green)' }}>{Math.round(topCrypto?.take_profit_1 || 80255).toLocaleString()}</strong></span>
                <span style={{ color: 'var(--accent-orange)', fontWeight: '800' }}>R:R 1:{topCrypto?.risk_reward_ratio || '2'}</span>
              </div>
            </div>

          </div>

          {/* ROW 2: DUAL FLOW RADAR (Foreign Bars vs Broker Accumulation) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            minWidth: 0
          }}>

            {/* Left Box: IDX Foreign Capital Flow */}
            <div className="telemetry-panel" style={{ padding: '8px 10px', minHeight: '125px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)' }}>IDX Foreign Capital Flow</span>
                  <span className="badge badge-bear" style={{ fontSize: '8px', padding: '1px 5px' }}>NET SELL</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' }}>
                  <span style={{ fontSize: '17px', fontWeight: '900', color: totalNetForeign >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)', fontFamily: 'var(--font-mono)' }}>
                    {formatFlowIdr(totalNetForeign)}
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>net asing hari ini</span>
                </div>
              </div>

              {/* Progress bars visualizer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                {flowBarItems.map(item => {
                  const pct = Math.min(Math.round((Math.abs(item.val) / maxAbsFlow) * 100), 100);
                  const isBuy = item.type === 'buy' || item.val >= 0;
                  return (
                    <div key={item.ticker} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ width: '45px', fontWeight: '700', color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => onSelectTicker(item.ticker, 'IDX')}>
                        ${item.ticker}
                      </span>
                      <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: isBuy ? 'var(--accent-green)' : 'var(--accent-rust)',
                          borderRadius: '3px'
                        }} />
                      </div>
                      <span style={{ width: '50px', textAlign: 'right', fontWeight: '700', color: isBuy ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                        {formatFlowIdr(item.val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Box: Bandarmology Broker Accumulation */}
            <div className="telemetry-panel" style={{ padding: '8px 10px', minHeight: '125px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)' }}>Bandarmology (Broker Accumulation)</span>
                  <span className="badge badge-bull" style={{ fontSize: '8px', padding: '1px 5px' }}>TOP BUYERS</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {accumulatingBrokers.map(b => {
                  const topB = b.top_buyers?.[0];
                  const lotsK = topB?.lots ? Math.round(topB.lots / 1000).toLocaleString() + 'k lot' : '-';
                  return (
                    <div key={b.ticker} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '800', color: 'var(--accent-blue)', cursor: 'pointer', minWidth: '42px' }} onClick={() => onSelectTicker(b.ticker, 'IDX')}>
                          ${b.ticker}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          avg Rp {Number(b.bandar_avg_price || b.ref_price).toLocaleString()} · {lotsK}
                        </span>
                      </div>
                      <span className="badge badge-bull" style={{ fontSize: '8px', padding: '0 4px' }}>
                        BIG ACC
                      </span>
                    </div>
                  );
                })}
                {accumulatingBrokers.length === 0 && (
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                    Menghitung akumulasi broker...
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ROW 3: TWO SIDE-BY-SIDE TABLES (Saham IDX Signals vs Crypto Spot Signals) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            minWidth: 0
          }}>

            {/* Table 1: Saham IDX Signals */}
            <div className="telemetry-panel" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>Saham IDX Signals</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{topIdxPlans.length}</span>
                  </div>
                  <button
                    onClick={() => onNavigateTab('STOCK')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '9px', cursor: 'pointer' }}
                  >
                    Lihat semua →
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', borderBottom: 'var(--border-hairline)', textAlign: 'left' }}>
                        <th style={{ padding: '3px 4px' }}>Ticker</th>
                        <th style={{ padding: '3px 4px' }}>Setup</th>
                        <th style={{ padding: '3px 4px' }}>Entry</th>
                        <th style={{ padding: '3px 4px' }}>SL</th>
                        <th style={{ padding: '3px 4px' }}>TP1</th>
                        <th style={{ padding: '3px 4px' }}>R:R</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topIdxPlans.slice(0, 4).map(plan => {
                        const ticker = plan.clean_ticker || plan.symbol?.replace('.JK', '');
                        return (
                          <tr key={ticker} style={{ borderBottom: 'rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '4px 4px', fontWeight: '800' }}>
                              <span style={{ color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => onSelectTicker(ticker, 'IDX')}>
                                {ticker}
                              </span>
                            </td>
                            <td style={{ padding: '4px 4px' }}>
                              <span className="badge badge-bull" style={{ fontSize: '7px', padding: '1px 3px' }}>
                                {plan.technical_signal || 'BREAKOUT'}
                              </span>
                            </td>
                            <td style={{ padding: '4px 4px' }}>{Number(plan.entry_price).toLocaleString()}</td>
                            <td style={{ padding: '4px 4px', color: 'var(--accent-rust)' }}>{Number(plan.stop_loss).toLocaleString()}</td>
                            <td style={{ padding: '4px 4px', color: 'var(--accent-green)' }}>{Number(plan.target_1).toLocaleString()}</td>
                            <td style={{ padding: '4px 4px', fontWeight: '700', color: 'var(--accent-orange)' }}>1:{plan.risk_reward_ratio || '2.2'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: 'var(--text-muted)', marginTop: '6px', paddingTop: '4px', borderTop: 'var(--border-muted)' }}>
                <span>Engine TimesFM + SMC</span>
                <span>4 / {topIdxPlans.length}</span>
              </div>
            </div>

            {/* Table 2: Crypto Spot Signals */}
            <div className="telemetry-panel" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>Crypto Spot Signals</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{topCryptoPicks.length}</span>
                  </div>
                  <button
                    onClick={() => onNavigateTab('CRYPTO')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '9px', cursor: 'pointer' }}
                  >
                    Lihat semua →
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', borderBottom: 'var(--border-hairline)', textAlign: 'left' }}>
                        <th style={{ padding: '3px 4px' }}>Pair</th>
                        <th style={{ padding: '3px 4px' }}>Setup</th>
                        <th style={{ padding: '3px 4px' }}>Entry</th>
                        <th style={{ padding: '3px 4px' }}>SL</th>
                        <th style={{ padding: '3px 4px' }}>TP1</th>
                        <th style={{ padding: '3px 4px' }}>R:R</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCryptoPicks.slice(0, 4).map(c => (
                        <tr key={c.pair} style={{ borderBottom: 'rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '4px 4px', fontWeight: '800' }}>
                            <span style={{ color: '#60a5fa', cursor: 'pointer' }} onClick={() => onSelectTicker(c.pair, 'CRYPTO')}>
                              {c.pair}
                            </span>
                          </td>
                          <td style={{ padding: '4px 4px' }}>
                            <span className="badge badge-alert" style={{ fontSize: '7px', padding: '1px 3px' }}>
                              RANGE_ACC
                            </span>
                          </td>
                          <td style={{ padding: '4px 4px' }}>{c.current_price > 10 ? Math.round(c.current_price).toLocaleString() : c.current_price}</td>
                          <td style={{ padding: '4px 4px', color: 'var(--accent-rust)' }}>{c.stop_loss > 10 ? Math.round(c.stop_loss).toLocaleString() : c.stop_loss}</td>
                          <td style={{ padding: '4px 4px', color: 'var(--accent-green)' }}>{c.take_profit_1 > 10 ? Math.round(c.take_profit_1).toLocaleString() : c.take_profit_1}</td>
                          <td style={{ padding: '4px 4px', fontWeight: '700', color: 'var(--accent-orange)' }}>1:{c.risk_reward_ratio || '2'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: 'var(--text-muted)', marginTop: '6px', paddingTop: '4px', borderTop: 'var(--border-muted)' }}>
                <span>Spot USDT · no leverage</span>
                <span>4 / {topCryptoPicks.length}</span>
              </div>
            </div>

          </div>

        </div>

        {/* ================= RIGHT SIDEBAR: LIVE NEWS STREAM ================= */}
        <div className="telemetry-panel" style={{
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxSizing: 'border-box',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '4px', borderBottom: 'var(--border-hairline)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '11px' }}>📰</span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>Live News</span>
            </div>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{liveNews.length}</span>
          </div>

          {/* Vertical scrollable list of news cards */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
            maxHeight: '435px',
            paddingRight: '2px'
          }}>
            {liveNews.slice(0, 7).map((news, idx) => {
              const isBear = news.sentiment === 'BEARISH';
              const isBull = news.sentiment === 'BULLISH';
              return (
                <div key={news.id || idx} style={{
                  padding: '6px 8px',
                  background: 'var(--bg-panel-subtle)',
                  borderRadius: '3px',
                  border: 'var(--border-hairline)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                        {news.source || 'MARKET WIRE'}
                      </span>
                      <span className={`badge ${isBear ? 'badge-bear' : isBull ? 'badge-bull' : 'badge-neutral'}`} style={{ fontSize: '7px', padding: '0 3px' }}>
                        {news.sentiment || 'NEUTRAL'}
                      </span>
                    </div>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {news.pub_date ? new Date(news.pub_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '08:45'}
                    </span>
                  </div>

                  <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {news.title}
                  </div>

                  {news.related_tickers && news.related_tickers.length > 0 && (
                    <div style={{ display: 'flex', gap: '3px', marginTop: '2px', flexWrap: 'wrap' }}>
                      {news.related_tickers.map(t => (
                        <span
                          key={t}
                          onClick={() => onSelectTicker(t, 'IDX')}
                          style={{
                            fontSize: '8px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--accent-blue)',
                            background: 'rgba(59, 130, 246, 0.12)',
                            padding: '0 3px',
                            borderRadius: '2px',
                            cursor: 'pointer'
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
          </div>
        </div>

      </div>

    </div>
  );
}
