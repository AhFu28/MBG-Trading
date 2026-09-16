import React, { useState } from 'react';

export default function CryptoFuturesTab({ data, onOpenChart }) {
  const [activeTab, setActiveTab] = useState('funding');

  const futuresData = data?.crypto_futures;
  if (!futuresData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
        <div>Data belum tersedia</div>
      </div>
    );
  }

  const { funding_rates = [], open_interest = [], long_short_ratio = [], liquidations_24h = {} } = futuresData;

  const totalOI = open_interest.reduce((acc, curr) => acc + (curr.open_interest_usd || 0), 0);
  const avgFunding = funding_rates.reduce((acc, curr) => acc + (curr.funding_rate_pct || 0), 0) / (funding_rates.length || 1);
  const lsRatios = long_short_ratio.map(r => r.long_short_ratio);
  const avgLsRatio = lsRatios.reduce((acc, curr) => acc + curr, 0) / (lsRatios.length || 1);
  const marketBias = avgLsRatio > 1.05 ? 'LONG BIASED' : avgLsRatio < 0.95 ? 'SHORT BIASED' : 'NEUTRAL';

  const getFundingBg = (val) => {
    if (val > 0.05) return 'rgba(184, 50, 50, 0.2)'; // High positive -> red warning
    if (val < -0.01) return 'rgba(27, 138, 75, 0.2)'; // Negative -> green opportunity
    return 'transparent';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
      <div className="telemetry-panel" style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚡ CRYPTO FUTURES INTELLIGENCE
        </h2>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
          Funding Rate · Open Interest · Long/Short Ratio · Liquidation Radar
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <div className="telemetry-panel" style={{ padding: '12px', borderLeft: '3px solid var(--accent-blue)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Open Interest</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', margin: '8px 0' }}>
            ${(totalOI / 1e9).toFixed(2)}B
          </div>
        </div>

        <div className="telemetry-panel" style={{ padding: '12px', borderLeft: '3px solid var(--accent-gold)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Funding Rate</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', margin: '8px 0', color: avgFunding < -0.01 ? 'var(--accent-green)' : avgFunding > 0.05 ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
            {avgFunding.toFixed(4)}%
          </div>
        </div>

        <div className="telemetry-panel" style={{ padding: '12px', borderLeft: '3px solid var(--accent-orange)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Market Bias (L/S)</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', margin: '8px 0', color: marketBias === 'LONG BIASED' ? 'var(--accent-green)' : marketBias === 'SHORT BIASED' ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
            {marketBias}
          </div>
        </div>
        
        <div className="telemetry-panel" style={{ padding: '12px', borderLeft: '3px solid var(--accent-rust)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>24h Liquidations</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', margin: '8px 0' }}>
            ${(liquidations_24h.total_liquidated_usd / 1e6 || 0).toFixed(2)}M
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
            <span style={{ color: 'var(--accent-green)' }}>L: ${(liquidations_24h.long_liquidated_usd / 1e6 || 0).toFixed(1)}M</span>
            <span style={{ color: 'var(--accent-rust)' }}>S: ${(liquidations_24h.short_liquidated_usd / 1e6 || 0).toFixed(1)}M</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', borderBottom: 'var(--border-hairline)', paddingBottom: '8px' }}>
        <button onClick={() => setActiveTab('funding')} style={{ background: activeTab === 'funding' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'funding' ? 'bold' : 'normal' }}>💰 FUNDING RATE</button>
        <button onClick={() => setActiveTab('oi')} style={{ background: activeTab === 'oi' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'oi' ? 'bold' : 'normal' }}>📊 OPEN INTEREST</button>
        <button onClick={() => setActiveTab('ls')} style={{ background: activeTab === 'ls' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'ls' ? 'bold' : 'normal' }}>⚖️ LONG/SHORT</button>
        <button onClick={() => setActiveTab('liquidations')} style={{ background: activeTab === 'liquidations' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'liquidations' ? 'bold' : 'normal' }}>💀 LIQUIDATIONS</button>
      </div>

      <div className="telemetry-panel">
        {activeTab === 'funding' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Pair</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Funding Rate (%)</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Mark Price</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Next Funding</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Signal</th>
              </tr>
            </thead>
            <tbody>
              {funding_rates.map((f, idx) => (
                <tr key={idx} style={{ borderBottom: 'var(--border-hairline)', background: getFundingBg(f.funding_rate_pct) }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{f.pair}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{f.funding_rate_pct.toFixed(4)}%</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${f.mark_price.toLocaleString()}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{f.next_funding_time}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <span className={`badge ${f.funding_rate_pct < -0.01 ? 'badge-bull' : f.funding_rate_pct > 0.05 ? 'badge-bear' : ''}`}>{f.signal}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'oi' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Pair</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Open Interest (USD)</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>OI Chg 1h</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Price</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Divergence Signal</th>
              </tr>
            </thead>
            <tbody>
              {open_interest.map((o, idx) => {
                let badgeClass = '';
                if(o.oi_price_divergence === 'BULLISH_CONFIRMATION') badgeClass = 'badge-bull';
                else if(o.oi_price_divergence === 'BEARISH_DIVERGENCE') badgeClass = 'badge-bear';
                return (
                  <tr key={idx} style={{ borderBottom: 'var(--border-hairline)' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{o.pair}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${(o.open_interest_usd / 1e6).toFixed(2)}M</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: o.oi_change_1h_pct > 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>{o.oi_change_1h_pct}%</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${o.price.toLocaleString()}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span className={`badge ${badgeClass}`}>{o.oi_price_divergence}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === 'ls' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {long_short_ratio.map((ls, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 120px', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontWeight: 'bold' }}>{ls.pair}</div>
                <div style={{ height: '24px', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', overflow: 'hidden' }}>
                  <div style={{ width: `${ls.long_pct}%`, background: 'var(--accent-green)', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ls.long_pct}% Long
                  </div>
                  <div style={{ width: `${ls.short_pct}%`, background: 'var(--accent-rust)', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ls.short_pct}% Short
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${ls.bias === 'BULLISH' ? 'badge-bull' : ls.bias === 'BEARISH' ? 'badge-bear' : ''}`}>{ls.bias}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'liquidations' && (
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '14px', marginBottom: '12px' }}>Largest Single Liquidation: <strong>${(liquidations_24h.largest_single || 0).toLocaleString()}</strong></div>
            <div style={{ padding: '16px', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-muted)' }}>
              Detailed liquidation feed view available on Pro version.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
