import React, { useState } from 'react';

export default function UnifiedMarketScanner({
  conglomerates = {},
  dividendHunters = [],
  foreignFlow = {},
  onSelectTicker
}) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Flatten all stocks with normalized tags
  const rawList = [];

  // Conglomerates
  Object.entries(conglomerates).forEach(([groupName, stocks]) => {
    stocks.forEach(s => {
      rawList.push({
        ...s,
        sourceCategory: 'CONGLOMERATE',
        groupBadge: groupName.replace('_', ' ')
      });
    });
  });

  // Dividend Hunters
  dividendHunters.forEach(s => {
    rawList.push({
      ...s,
      sourceCategory: 'DIVIDEND',
      groupBadge: `YIELD ${s.dividend_yield_pct}% (TRAP: ${s.dividend_trap_risk})`
    });
  });

  // Foreign Flow
  (foreignFlow.top_inflow || []).forEach(s => {
    rawList.push({
      ...s,
      sourceCategory: 'FOREIGN_INFLOW',
      groupBadge: 'NET INFLOW 🟢'
    });
  });
  (foreignFlow.top_outflow || []).forEach(s => {
    rawList.push({
      ...s,
      sourceCategory: 'FOREIGN_OUTFLOW',
      groupBadge: 'NET OUTFLOW 🔴'
    });
  });

  // Deduplicate by ticker
  const uniqueStocks = Array.from(new Map(rawList.map(s => [s.ticker, s])).values());

  // Filter logic
  const filtered = uniqueStocks.filter(stock => {
    const matchesSearch =
      stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stock.company_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CONGLO') return stock.sourceCategory === 'CONGLOMERATE';
    if (activeFilter === 'DIVIDEND') return stock.sourceCategory === 'DIVIDEND';
    if (activeFilter === 'FOREIGN') return stock.sourceCategory.startsWith('FOREIGN');
    if (activeFilter === 'BREAKOUT') return stock.technical_signal === 'BREAKOUT';
    if (activeFilter === 'ACCUMULATION') return stock.technical_signal === 'ACCUMULATION';
    return true;
  });

  return (
    <div className="telemetry-panel">
      {/* Header */}
      <div className="telemetry-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-primary)' }}>🔍 UNIFIED MARKET SCANNER & DIRECTORY</span>
          <span className="badge badge-blue">{filtered.length} ASSETS MATCHED</span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
          1-CLICK TRADINGVIEW LAUNCHER
        </span>
      </div>

      {/* Interactive Filter Pills & Search Bar */}
      <div style={{
        padding: '10px 14px',
        background: 'var(--bg-panel-subtle)',
        borderBottom: 'var(--border-hairline)',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Quick Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'SEMUA EMITEN' },
            { id: 'BREAKOUT', label: '🔥 BREAKOUT' },
            { id: 'ACCUMULATION', label: '📈 AKUMULASI' },
            { id: 'CONGLO', label: '🏢 KONGSI / KONGLO' },
            { id: 'DIVIDEND', label: '💰 DIVIDEN HUNTERS' },
            { id: 'FOREIGN', label: '🌊 FLOW ASING' }
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

        {/* Search Input */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Cari Ticker (e.g. MEDC, BREN)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              padding: '6px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              border: 'var(--border-hairline)',
              outline: 'none',
              width: '200px',
              textTransform: 'uppercase'
            }}
          />
          {searchTerm && (
            <button
              className="telemetry-btn"
              onClick={() => onSelectTicker(searchTerm.trim().toUpperCase(), 'IDX')}
              style={{ background: 'var(--accent-orange)', color: '#fff', fontSize: '10px', padding: '6px 10px' }}
            >
              CHART
            </button>
          )}
        </div>
      </div>

      {/* Unified Table */}
      <div style={{ overflowX: 'auto', maxHeight: '480px' }}>
        <table className="telemetry-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Nama Emiten</th>
              <th>Harga (Rp)</th>
              <th>Change %</th>
              <th>Klaster / Kategori</th>
              <th>MA20</th>
              <th>RSI 14</th>
              <th>Sinyal Teknikal</th>
              <th>Aksi Chart</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  Tidak ada emiten yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              filtered.map(stock => (
                <tr
                  key={stock.ticker}
                  onClick={() => onSelectTicker(stock.ticker, 'IDX')}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                    ${stock.ticker}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{stock.company_name}</td>
                  <td style={{ fontWeight: '700' }}>
                    Rp {Number(stock.price || 0).toLocaleString()}
                  </td>
                  <td style={{
                    fontWeight: '700',
                    color: stock.change_pct > 0 ? 'var(--accent-green)' : stock.change_pct < 0 ? 'var(--accent-rust)' : 'inherit'
                  }}>
                    {stock.change_pct > 0 ? `+${stock.change_pct}%` : `${stock.change_pct}%`}
                  </td>
                  <td>
                    <span className="badge" style={{ fontSize: '9px', background: '#f0f0eb' }}>
                      {stock.groupBadge || stock.sub_category || stock.sourceCategory}
                    </span>
                  </td>
                  <td>Rp {Number(stock.ma20 || stock.price || 0).toLocaleString()}</td>
                  <td>
                    <span style={{
                      fontWeight: '700',
                      color: stock.rsi_14 > 70 ? 'var(--accent-rust)' : stock.rsi_14 < 35 ? 'var(--accent-blue)' : 'inherit'
                    }}>
                      {stock.rsi_14 || 50}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      stock.technical_signal === 'BREAKOUT' ? 'badge-bull' :
                      stock.technical_signal === 'ACCUMULATION' ? 'badge-blue' :
                      stock.technical_signal === 'OVERSOLD_REBOUND' ? 'badge-alert' :
                      'badge'
                    }`}>
                      {stock.technical_signal || 'CONSOLIDATION'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="telemetry-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicker(stock.ticker, 'IDX');
                      }}
                      style={{ padding: '2px 8px', fontSize: '10px', background: 'var(--text-primary)', color: '#fff' }}
                    >
                      📈 CHART
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Advisory Note */}
      <div style={{
        padding: '8px 14px',
        background: '#fdfbf0',
        borderTop: 'var(--border-muted)',
        fontSize: '10px',
        color: '#7a5a00',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        <span>
          💡 <strong>QUICK TIP</strong>: Klik baris emiten mana saja untuk langsung memunculkan grafik interaktif TradingView lengkap dengan MA20, RSI, &amp; Volume.
        </span>
        <span>RESEARCH WATCHLIST ONLY · ZERO AUTOMATION EXECUTION</span>
      </div>
    </div>
  );
}
