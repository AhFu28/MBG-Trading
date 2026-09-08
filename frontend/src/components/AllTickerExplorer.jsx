import React, { useState } from 'react';

export default function AllTickerExplorer({ allStocks = [], onSelectTicker }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const filtered = allStocks.filter(stock => {
    const matchesSearch = stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          stock.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filterCategory === 'ALL' || stock.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="telemetry-panel">
      <div className="telemetry-header">
        <span>ALL-TICKER EXPLORER &amp; MANUAL CHART DIRECTORY</span>
        <span>INDEXED: {allStocks.length} EQUITIES</span>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ padding: '12px 14px', background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: '1 1 300px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700' }}>SEARCH TICKER:</span>
          <input
            type="text"
            placeholder="Type any stock: BBCA, BREN, MEDC, RAJA, ERAA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              fontFamily: 'var(--font-mono)',
              padding: '6px 10px',
              fontSize: '12px',
              border: 'var(--border-hairline)',
              outline: 'none',
              flex: '1 1 auto',
              textTransform: 'uppercase'
            }}
          />
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'CONGLOMERATE', 'DIVIDEND_HUNTER', 'FOREIGN_FLOW'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`telemetry-btn ${filterCategory === cat ? 'active' : ''}`}
              style={{ fontSize: '10px' }}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', maxHeight: '550px' }}>
        <table className="telemetry-table">
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th>Ticker</th>
              <th>Company Name</th>
              <th>Category</th>
              <th>Sub-Group</th>
              <th>Last Price</th>
              <th>Change %</th>
              <th>Volume</th>
              <th>Signal</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  Tidak ada saham dalam daftar cache yang cocok. Klik tombol di bawah untuk membuka chart TradingView manual.
                </td>
              </tr>
            ) : (
              filtered.map((stock) => (
                <tr key={stock.ticker} style={{ cursor: 'pointer' }} onClick={() => onSelectTicker(stock.ticker, 'IDX')}>
                  <td style={{ fontWeight: '700', color: 'var(--accent-blue)' }}>
                    ${stock.ticker}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{stock.company_name}</td>
                  <td><span className="badge">{stock.category}</span></td>
                  <td style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{stock.sub_category}</td>
                  <td style={{ fontWeight: '700' }}>Rp {Number(stock.price).toLocaleString()}</td>
                  <td style={{ 
                    fontWeight: '700',
                    color: stock.change_pct > 0 ? 'var(--accent-green)' : stock.change_pct < 0 ? 'var(--accent-rust)' : 'inherit'
                  }}>
                    {stock.change_pct > 0 ? `+${stock.change_pct}%` : `${stock.change_pct}%`}
                  </td>
                  <td>{Number(stock.volume).toLocaleString()}</td>
                  <td>
                    <span className="badge badge-bull">{stock.technical_signal}</span>
                  </td>
                  <td>
                    <button 
                      className="telemetry-btn" 
                      style={{ padding: '2px 8px', fontSize: '10px', background: 'var(--text-primary)', color: '#fff' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicker(stock.ticker, 'IDX');
                      }}
                    >
                      📈 OPEN CHART
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Input Fallback */}
      <div style={{ padding: '10px 14px', background: '#fdfbf0', borderTop: 'var(--border-muted)', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          💡 Ingin cek saham BEI di luar daftar di atas? Ketik kode emiten di kolom pencarian lalu klik <strong>OPEN CHART</strong>.
        </span>
        {searchTerm.trim() && (
          <button 
            className="telemetry-btn"
            style={{ background: 'var(--accent-orange)', color: '#fff' }}
            onClick={() => onSelectTicker(searchTerm.trim().toUpperCase(), 'IDX')}
          >
            📈 OPEN TRADINGVIEW FOR "{searchTerm.toUpperCase()}"
          </button>
        )}
      </div>

    </div>
  );
}
