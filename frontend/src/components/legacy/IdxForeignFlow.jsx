import React from 'react';

export default function IdxForeignFlow({ foreignFlow = {} }) {
  const topInflow = foreignFlow.top_inflow || [];
  const topOutflow = foreignFlow.top_outflow || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '16px' }}>
      
      {/* 1. Inflow Column */}
      <div className="telemetry-panel" style={{ borderTop: '3px solid var(--accent-green)' }}>
        <div className="telemetry-header" style={{ background: '#f2faf4' }}>
          <span style={{ color: 'var(--accent-green)' }}>🟢 TOP NET FOREIGN INFLOW (AKUMULASI ASING)</span>
          <span className="badge badge-bull">ACCUMULATION</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="telemetry-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Price</th>
                <th>Change %</th>
                <th>Est. Flow Proxy</th>
                <th>Technical Signal</th>
              </tr>
            </thead>
            <tbody>
              {topInflow.map((stock) => (
                <tr key={stock.ticker}>
                  <td style={{ fontWeight: '700' }}>{stock.ticker}</td>
                  <td>Rp {Number(stock.price).toLocaleString()}</td>
                  <td style={{ color: 'var(--accent-green)', fontWeight: '700' }}>
                    +{stock.change_pct}%
                  </td>
                  <td style={{ color: 'var(--accent-green)', fontWeight: '700' }}>
                    +Rp {Math.abs(Number(stock.foreign_net_val_idr) / 1e6).toFixed(1)}M
                  </td>
                  <td>
                    <span className="badge badge-bull">{stock.technical_signal}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Outflow Column */}
      <div className="telemetry-panel" style={{ borderTop: '3px solid var(--accent-rust)' }}>
        <div className="telemetry-header" style={{ background: '#faf2f2' }}>
          <span style={{ color: 'var(--accent-rust)' }}>🔴 TOP NET FOREIGN OUTFLOW (DISTRIBUSI ASING)</span>
          <span className="badge badge-bear">DISTRIBUTION</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="telemetry-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Price</th>
                <th>Change %</th>
                <th>Est. Flow Proxy</th>
                <th>Technical Signal</th>
              </tr>
            </thead>
            <tbody>
              {topOutflow.map((stock) => (
                <tr key={stock.ticker}>
                  <td style={{ fontWeight: '700' }}>{stock.ticker}</td>
                  <td>Rp {Number(stock.price).toLocaleString()}</td>
                  <td style={{ color: 'var(--accent-rust)', fontWeight: '700' }}>
                    {stock.change_pct}%
                  </td>
                  <td style={{ color: 'var(--accent-rust)', fontWeight: '700' }}>
                    -Rp {Math.abs(Number(stock.foreign_net_val_idr) / 1e6).toFixed(1)}M
                  </td>
                  <td>
                    <span className="badge badge-bear">{stock.technical_signal}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
