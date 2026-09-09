import React, { useState } from 'react';

export default function IdxKongloGrid({ conglomerates = {} }) {
  const groupKeys = Object.keys(conglomerates);
  const [selectedGroup, setSelectedGroup] = useState(groupKeys[0] || 'BARITO_GROUP');

  if (groupKeys.length === 0) {
    return <div className="telemetry-panel" style={{ padding: '20px' }}>Loading Conglomerate data...</div>;
  }

  const activeGroup = conglomerates[selectedGroup] || [];

  return (
    <div className="telemetry-panel">
      <div className="telemetry-header">
        <span>IDX CONGLOMERATE CLUSTERS (GRUPO KONGSI)</span>
        <span>COUNT: {activeGroup.length} ASSETS</span>
      </div>

      {/* Group Selector Navigation */}
      <div style={{ padding: '10px 12px', borderBottom: 'var(--border-hairline)', display: 'flex', gap: '6px', flexWrap: 'wrap', background: 'var(--bg-panel-subtle)' }}>
        {groupKeys.map(key => (
          <button
            key={key}
            onClick={() => setSelectedGroup(key)}
            className={`telemetry-btn ${selectedGroup === key ? 'active' : ''}`}
          >
            {key.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table Data */}
      <div style={{ overflowX: 'auto' }}>
        <table className="telemetry-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Company Name</th>
              <th>Last Price (IDR)</th>
              <th>Change %</th>
              <th>Volume</th>
              <th>MA20</th>
              <th>RSI (14)</th>
              <th>Signal Status</th>
            </tr>
          </thead>
          <tbody>
            {activeGroup.map((stock) => (
              <tr key={stock.ticker}>
                <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                  {stock.ticker}
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{stock.company_name}</td>
                <td style={{ fontWeight: '700' }}>Rp {Number(stock.price).toLocaleString()}</td>
                <td style={{ 
                  fontWeight: '700',
                  color: stock.change_pct > 0 ? 'var(--accent-green)' : stock.change_pct < 0 ? 'var(--accent-rust)' : 'inherit'
                }}>
                  {stock.change_pct > 0 ? `+${stock.change_pct}%` : `${stock.change_pct}%`}
                </td>
                <td>{Number(stock.volume).toLocaleString()}</td>
                <td>Rp {Number(stock.ma20).toLocaleString()}</td>
                <td>
                  <span style={{ 
                    color: stock.rsi_14 > 70 ? 'var(--accent-rust)' : stock.rsi_14 < 35 ? 'var(--accent-blue)' : 'inherit',
                    fontWeight: '700'
                  }}>
                    {stock.rsi_14}
                  </span>
                </td>
                <td>
                  <span className={`badge ${
                    stock.technical_signal === 'BREAKOUT' ? 'badge-bull' :
                    stock.technical_signal === 'ACCUMULATION' ? 'badge-blue' :
                    stock.technical_signal === 'OVERSOLD_REBOUND' ? 'badge-alert' :
                    'badge'
                  }`}>
                    {stock.technical_signal}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
