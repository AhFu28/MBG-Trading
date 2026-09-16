import React, { useState } from 'react';

export default function USStockTab({ data, onOpenChart }) {
  const [activeTab, setActiveTab] = useState('screener');
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');

  const usData = data?.us_stocks;
  if (!usData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🇺🇸</div>
        <div>Data belum tersedia</div>
      </div>
    );
  }

  const { stocks = [], earnings_calendar = [], sector_performance = {} } = usData;
  const sectors = ['ALL', ...new Set(stocks.map(s => s.sector))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
      <div className="telemetry-panel" style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🇺🇸 US STOCK INTELLIGENCE
        </h2>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
          30 Top US Equities · Trade Plans · Earnings Calendar · Sector Heatmap
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
        {Object.entries(sector_performance).map(([sec, perf]) => (
          <div key={sec} className="telemetry-panel" style={{ padding: '8px', background: perf >= 0 ? 'rgba(27, 138, 75, 0.1)' : 'rgba(184, 50, 50, 0.1)', border: `1px solid ${perf >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)'}` }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>{sec}</div>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: perf >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
              {perf > 0 ? '+' : ''}{perf}%
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', borderBottom: 'var(--border-hairline)', paddingBottom: '8px' }}>
        <button onClick={() => setActiveTab('screener')} style={{ background: activeTab === 'screener' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'screener' ? 'bold' : 'normal' }}>📊 SCREENER</button>
        <button onClick={() => setActiveTab('earnings')} style={{ background: activeTab === 'earnings' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'earnings' ? 'bold' : 'normal' }}>📅 EARNINGS CALENDAR</button>
        <button onClick={() => setActiveTab('plans')} style={{ background: activeTab === 'plans' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'plans' ? 'bold' : 'normal' }}>🎯 TOP 5 TRADE PLANS</button>
      </div>

      <div className="telemetry-panel">
        {activeTab === 'screener' && (
          <>
            <div style={{ padding: '12px', borderBottom: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between' }}>
              <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '6px', borderRadius: 'var(--radius-sm)', border: 'var(--border-hairline)' }}>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="text" placeholder="Search ticker..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '6px 12px', border: 'var(--border-hairline)', borderRadius: 'var(--radius-sm)' }} />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Ticker</th>
                  <th style={{ padding: '10px' }}>Name</th>
                  <th style={{ padding: '10px' }}>Sector</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Chg %</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Mkt Cap</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>P/E</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>RSI</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Setup</th>
                </tr>
              </thead>
              <tbody>
                {stocks.filter(s => (sectorFilter === 'ALL' || s.sector === sectorFilter) && (s.ticker.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()))).map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: 'var(--border-hairline)' }}>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => onOpenChart(`NASDAQ:${s.ticker}`)} style={{ background:'transparent', border:'none', color:'var(--accent-blue)', cursor:'pointer', fontWeight:'bold' }}>
                        {s.ticker}
                      </button>
                    </td>
                    <td style={{ padding: '10px' }}>{s.name}</td>
                    <td style={{ padding: '10px' }}>{s.sector}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${s.price}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: s.change_pct > 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>{s.change_pct}%</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{(s.market_cap / 1e9).toFixed(1)}B</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{s.pe_ratio}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: s.rsi_14 < 30 ? 'var(--accent-green)' : s.rsi_14 > 70 ? 'var(--accent-rust)' : 'var(--text-primary)' }}>{s.rsi_14}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span className="badge" style={{background:'var(--bg-panel-subtle)'}}>{s.setup_type}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === 'earnings' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Ticker</th>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Earnings Date</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {earnings_calendar.map((e, idx) => (
                <tr key={idx} style={{ borderBottom: 'var(--border-hairline)' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{e.ticker}</td>
                  <td style={{ padding: '10px' }}>{e.name}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{e.earnings_date}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {e.days_until <= 3 ? (
                      <span className="badge badge-bear">🔴 AVOID TRADING</span>
                    ) : e.days_until <= 7 ? (
                      <span className="badge badge-alert">🟡 CAUTION</span>
                    ) : (
                      <span className="badge badge-bull">🟢 SAFE</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'plans' && (
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {stocks.slice(0, 5).map((s, idx) => (
              <div key={idx} style={{ padding: '16px', border: 'var(--border-hairline)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-panel-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{s.ticker}</div>
                  <span className="badge" style={{background:'var(--bg-panel)', color:'var(--accent-blue)'}}>{s.setup_type}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{s.name}</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  <div>Entry: <strong style={{color:'var(--accent-blue)'}}>${s.entry_price}</strong></div>
                  <div>R:R: <strong>1:{s.risk_reward_ratio}</strong></div>
                  <div>Stop: <strong style={{color:'var(--accent-rust)'}}>${s.stop_loss}</strong></div>
                  <div>TP1: <strong style={{color:'var(--accent-green)'}}>${s.take_profit_1}</strong></div>
                </div>
                
                <button onClick={() => onOpenChart(`NASDAQ:${s.ticker}`)} style={{ width: '100%', padding: '8px', marginTop: '16px', background: 'var(--bg-panel)', border: 'var(--border-hairline)', borderRadius: 'var(--radius-xs)', cursor: 'pointer', fontWeight: 'bold' }}>
                  Open Chart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
