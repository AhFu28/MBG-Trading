import React, { useState } from 'react';

export default function WhaleIntelligenceTab({ data, onOpenChart }) {
  const [activeTab, setActiveTab] = useState('crypto');
  const [search, setSearch] = useState('');

  const whaleData = data?.whale_intelligence;
  if (!whaleData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐋</div>
        <div>Data belum tersedia</div>
      </div>
    );
  }

  const { crypto_whales = [], idx_foreign_whales = [], us_institutional = [] } = whaleData;

  // Crypto Summaries
  const cryptoBullish = crypto_whales.filter(w => w.sentiment === 'BULLISH').length;
  const cryptoBearish = crypto_whales.filter(w => w.sentiment === 'BEARISH').length;
  const cryptoNetSentiment = cryptoBullish > cryptoBearish ? 'BULLISH' : cryptoBearish > cryptoBullish ? 'BEARISH' : 'NEUTRAL';

  // IDX Summaries
  const idxNetFlow = idx_foreign_whales.reduce((acc, curr) => acc + (curr.net_value_idr || 0), 0);
  const idxTopBroker = [...idx_foreign_whales].sort((a, b) => b.net_value_idr - a.net_value_idr)[0];
  const formatIdr = (val) => {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    return `${sign}Rp ${(abs / 1e9).toFixed(2)} Miliar`;
  };

  // US Summaries
  const usIncreased = us_institutional.filter(u => u.action === 'INCREASED' || u.action === 'NEW').length;
  const usDecreased = us_institutional.filter(u => u.action === 'DECREASED' || u.action === 'SOLD_OUT').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
      <div className="telemetry-panel" style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🐋 WHALE INTELLIGENCE HUB
        </h2>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
          Pelacakan Paus Kripto On-Chain · Radar Asing BEI · Institusi Wall Street
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div className="telemetry-panel" style={{ padding: '12px', borderLeft: '3px solid var(--accent-blue)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Crypto Whale Sentiment</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', margin: '8px 0', color: cryptoNetSentiment === 'BULLISH' ? 'var(--accent-green)' : cryptoNetSentiment === 'BEARISH' ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
            {cryptoNetSentiment}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--accent-green)' }}>{cryptoBullish} Bullish</span> vs <span style={{ color: 'var(--accent-rust)' }}>{cryptoBearish} Bearish</span>
          </div>
        </div>

        <div className="telemetry-panel" style={{ padding: '12px', borderLeft: '3px solid var(--accent-gold)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>IDX Foreign Flow</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', margin: '8px 0', color: idxNetFlow >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
            {formatIdr(idxNetFlow)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Top Accumulating: <strong>{idxTopBroker?.broker_code}</strong>
          </div>
        </div>

        <div className="telemetry-panel" style={{ padding: '12px', borderLeft: '3px solid var(--accent-orange)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>US Institutional</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', margin: '8px 0' }}>
            {usIncreased} <span style={{fontSize:'14px',color:'var(--text-muted)'}}>In</span> / {usDecreased} <span style={{fontSize:'14px',color:'var(--text-muted)'}}>Out</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Position updates across major funds
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', borderBottom: 'var(--border-hairline)', paddingBottom: '8px' }}>
        <button onClick={() => setActiveTab('crypto')} style={{ background: activeTab === 'crypto' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'crypto' ? 'bold' : 'normal' }}>🔗 CRYPTO ON-CHAIN</button>
        <button onClick={() => setActiveTab('idx')} style={{ background: activeTab === 'idx' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'idx' ? 'bold' : 'normal' }}>🏦 IDX FOREIGN WHALE</button>
        <button onClick={() => setActiveTab('us')} style={{ background: activeTab === 'us' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'us' ? 'bold' : 'normal' }}>🇺🇸 US INSTITUTIONAL</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <input 
          type="text" 
          placeholder="Search..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          style={{ padding: '6px 12px', border: 'var(--border-hairline)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-panel)' }} 
        />
      </div>

      <div className="telemetry-panel">
        {activeTab === 'crypto' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {crypto_whales.filter(w => w.symbol.toLowerCase().includes(search.toLowerCase())).map((whale, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: 'var(--border-hairline)' }}>
                <span className="badge" style={{ background: 'var(--bg-panel-subtle)' }}>{whale.timestamp}</span>
                <span style={{ fontSize: '16px' }}>
                  {whale.sentiment === 'BULLISH' ? '🟢' : whale.sentiment === 'BEARISH' ? '🔴' : '⚪'}
                </span>
                <div style={{ flex: 1, fontSize: '13px' }}>
                  <strong>{whale.amount.toLocaleString()} {whale.symbol}</strong> (${whale.amount_usd.toLocaleString()}) transferred from <em>{whale.from_name}</em> to <em>{whale.to_name}</em>
                </div>
                <span className={`badge ${whale.sentiment === 'BULLISH' ? 'badge-bull' : whale.sentiment === 'BEARISH' ? 'badge-bear' : ''}`}>
                  {whale.signal}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'idx' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Ticker</th>
                <th style={{ padding: '10px' }}>Broker</th>
                <th style={{ padding: '10px' }}>Type</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Net Value (IDR)</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Volume</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {idx_foreign_whales.filter(w => w.ticker.toLowerCase().includes(search.toLowerCase()) || w.broker_code.toLowerCase().includes(search.toLowerCase())).map((whale, idx) => (
                <tr key={idx} style={{ borderBottom: 'var(--border-hairline)' }}>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => onOpenChart(whale.ticker)} style={{ background:'transparent', border:'none', color:'var(--accent-blue)', cursor:'pointer', fontWeight:'bold' }}>
                      {whale.ticker}
                    </button>
                  </td>
                  <td style={{ padding: '10px' }}>{whale.broker_code} - {whale.broker_name}</td>
                  <td style={{ padding: '10px' }}><span className="badge" style={{background:'var(--bg-panel-subtle)'}}>{whale.broker_type}</span></td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatIdr(whale.net_value_idr)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{whale.volume_lot.toLocaleString()}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <span style={{ color: whale.action === 'BUY' ? 'var(--accent-green)' : 'var(--accent-rust)', fontWeight: 'bold' }}>{whale.action}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'us' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Fund Name</th>
                <th style={{ padding: '10px' }}>Ticker</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Shares Change</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Market Value (USD)</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Filing Date</th>
              </tr>
            </thead>
            <tbody>
              {us_institutional.filter(u => u.ticker.toLowerCase().includes(search.toLowerCase()) || u.fund_name.toLowerCase().includes(search.toLowerCase())).map((us, idx) => {
                let badgeClass = '';
                if(us.action === 'INCREASED') badgeClass = 'badge-bull';
                else if(us.action === 'NEW') badgeClass = 'badge-bull';
                else if(us.action === 'DECREASED') badgeClass = 'badge-alert';
                else if(us.action === 'SOLD_OUT') badgeClass = 'badge-bear';

                return (
                  <tr key={idx} style={{ borderBottom: 'var(--border-hairline)' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{us.fund_name}</td>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => onOpenChart(us.ticker)} style={{ background:'transparent', border:'none', color:'var(--accent-blue)', cursor:'pointer', fontWeight:'bold' }}>
                        {us.ticker}
                      </button>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span className={`badge ${badgeClass}`}>{us.action}</span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {us.shares_change.toLocaleString()} ({us.shares_change_pct}%)
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${us.market_value_usd.toLocaleString()}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: 'var(--text-muted)' }}>{us.filing_date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
