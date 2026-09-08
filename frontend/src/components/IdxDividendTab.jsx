import React from 'react';

export default function IdxDividendTab({ dividendHunters = [] }) {
  return (
    <div className="telemetry-panel">
      <div className="telemetry-header">
        <span>DIVIDEND HUNTERS &amp; ARISTOCRATS (IDX HIGH YIELD)</span>
        <span>YIELD MONITORING</span>
      </div>

      {/* Advisory Note */}
      <div style={{ padding: '8px 12px', background: '#fdfbf0', borderBottom: 'var(--border-muted)', fontSize: '11px', color: '#7a5a00' }}>
        ⚠️ <strong>DIVIDEND TRAP RADAR</strong>: Saham dengan yield &gt;10% memiliki risiko koreksi tajam saat Ex-Date (penurunan harga seringkali lebih besar dari nominal dividen). Prioritaskan emiten dengan Trap Risk: LOW dan sinyal teknikal di atas MA20.
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="telemetry-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Company Name</th>
              <th>Est. Dividend Yield</th>
              <th>Dividend Trap Risk</th>
              <th>Current Price</th>
              <th>Change %</th>
              <th>MA20</th>
              <th>Technical Signal</th>
            </tr>
          </thead>
          <tbody>
            {dividendHunters.map((stock) => (
              <tr key={stock.ticker}>
                <td style={{ fontWeight: '700' }}>{stock.ticker}</td>
                <td style={{ color: 'var(--text-muted)' }}>{stock.company_name}</td>
                <td style={{ fontWeight: '700', color: 'var(--accent-blue)', fontSize: '13px' }}>
                  {stock.dividend_yield_pct}%
                </td>
                <td>
                  <span className={`badge ${
                    stock.dividend_trap_risk === 'LOW' ? 'badge-bull' :
                    stock.dividend_trap_risk === 'MEDIUM' ? 'badge-alert' :
                    'badge-bear'
                  }`}>
                    {stock.dividend_trap_risk}
                  </span>
                </td>
                <td style={{ fontWeight: '700' }}>Rp {Number(stock.price).toLocaleString()}</td>
                <td style={{ 
                  fontWeight: '700',
                  color: stock.change_pct > 0 ? 'var(--accent-green)' : stock.change_pct < 0 ? 'var(--accent-rust)' : 'inherit'
                }}>
                  {stock.change_pct > 0 ? `+${stock.change_pct}%` : `${stock.change_pct}%`}
                </td>
                <td>Rp {Number(stock.ma20).toLocaleString()}</td>
                <td>
                  <span className={`badge ${
                    stock.technical_signal === 'BREAKOUT' ? 'badge-bull' :
                    stock.technical_signal === 'ACCUMULATION' ? 'badge-blue' :
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
