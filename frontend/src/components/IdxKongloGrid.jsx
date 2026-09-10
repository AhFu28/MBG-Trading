import React, { useState, useMemo } from 'react';

export default function IdxKongloGrid({ conglomerates = {}, onSelectTicker }) {
  const groupKeys = Object.keys(conglomerates || {});
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'CORE_HOLDING' | 'MA_RADAR'
  const [searchQuery, setSearchQuery] = useState('');

  // Human-friendly group display names
  const GROUP_LABELS = {
    'BARITO_GROUP': 'Prajogo Pangestu (Barito)',
    'SALIM_GROUP': 'Anthony Salim',
    'ASTRA_GROUP': 'Astra Group (ASII)',
    'DJARUM_GROUP': 'Djarum (Hartono Bros)',
    'HAPPY_HAPSORO': 'Happy Hapsoro',
    'HAJI_ISAM': 'Haji Isam (Jhonlin)',
    'BAKRIE_GROUP': 'Bakrie Group',
    'SINARMAS_GROUP': 'Sinar Mas (Widjaja)',
    'LIPPO_GROUP': 'Lippo Group (Riady)',
    'SARATOGA_GROUP': 'Saratoga (Sandiaga & Edwin)',
    'ADARO_GROUP': 'Adaro (Boy Thohir)',
    'CT_CORP': 'CT Corp (Chairul Tanjung)'
  };

  // Flatten all stocks with group tag
  const allKongloStocks = useMemo(() => {
    const list = [];
    Object.entries(conglomerates || {}).forEach(([groupName, stocks]) => {
      if (Array.isArray(stocks)) {
        stocks.forEach(s => {
          list.push({
            ...s,
            groupKey: groupName,
            groupLabel: GROUP_LABELS[groupName] || groupName.replace('_GROUP', '').replace('_', ' ')
          });
        });
      }
    });
    return list;
  }, [conglomerates]);

  // Filter stocks based on group, ownership type, and search
  const filteredStocks = useMemo(() => {
    return allKongloStocks.filter(stock => {
      // Group filter
      if (selectedGroup !== 'ALL' && stock.groupKey !== selectedGroup) {
        return false;
      }

      // Ownership Type filter
      const type = stock.ownership_type || 'CORE_HOLDING';
      if (typeFilter === 'CORE_HOLDING' && type !== 'CORE_HOLDING') {
        return false;
      }
      if (typeFilter === 'MA_RADAR' && type === 'CORE_HOLDING') {
        return false; // Show only STRATEGIC_STAKE or MA_TARGET
      }

      // Search filter
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        stock.ticker.toLowerCase().includes(q) ||
        (stock.company_name && stock.company_name.toLowerCase().includes(q)) ||
        (stock.catalyst_thesis && stock.catalyst_thesis.toLowerCase().includes(q)) ||
        stock.groupLabel.toLowerCase().includes(q)
      );
    });
  }, [allKongloStocks, selectedGroup, typeFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = allKongloStocks.length;
    const coreCount = allKongloStocks.filter(s => (s.ownership_type || 'CORE_HOLDING') === 'CORE_HOLDING').length;
    const maCount = total - coreCount;
    const bullishCount = allKongloStocks.filter(s => s.technical_signal === 'BREAKOUT' || s.technical_signal === 'ACCUMULATION').length;
    return { total, coreCount, maCount, bullishCount };
  }, [allKongloStocks]);

  if (groupKeys.length === 0) {
    return (
      <div className="telemetry-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Memuat data Klaster Konglomerasi & Radar M&A...
      </div>
    );
  }

  return (
    <div className="telemetry-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      
      {/* 1. Header Banner & Key Metrics */}
      <div className="telemetry-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>🏢</span>
          <span>IDX CONGLOMERATE CLUSTERS & M&A STRATEGIC RADAR</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span>TOTAL: <strong style={{ color: 'var(--text-primary)' }}>{stats.total} Emiten</strong></span>
          <span>•</span>
          <span>CORE HOLDINGS: <strong style={{ color: 'var(--text-primary)' }}>{stats.coreCount}</strong></span>
          <span>•</span>
          <span>M&A / STRATEGIC: <strong style={{ color: 'var(--accent-orange)' }}>{stats.maCount} Target</strong></span>
          <span>•</span>
          <span>BULLISH: <strong style={{ color: 'var(--accent-green)' }}>{stats.bullishCount}</strong></span>
        </div>
      </div>

      {/* 2. Type Filter Pills (Core vs M&A / Strategic) */}
      <div style={{
        padding: '8px 14px',
        background: 'var(--bg-panel-subtle)',
        borderBottom: 'var(--border-muted)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`telemetry-btn ${typeFilter === 'ALL' ? 'active' : ''}`}
            style={{ fontSize: '10px', padding: '4px 10px' }}
          >
            SEMUA TIPE ({allKongloStocks.length})
          </button>
          <button
            onClick={() => setTypeFilter('CORE_HOLDING')}
            className={`telemetry-btn ${typeFilter === 'CORE_HOLDING' ? 'active' : ''}`}
            style={{ fontSize: '10px', padding: '4px 10px' }}
          >
            👑 CORE HOLDINGS ({stats.coreCount})
          </button>
          <button
            onClick={() => setTypeFilter('MA_RADAR')}
            className={`telemetry-btn ${typeFilter === 'MA_RADAR' ? 'active' : ''}`}
            style={{
              fontSize: '10px',
              padding: '4px 10px',
              borderColor: typeFilter === 'MA_RADAR' ? 'var(--accent-orange)' : undefined,
              color: typeFilter === 'MA_RADAR' ? '#ffffff' : 'var(--accent-orange)'
            }}
          >
            🎯 RADAR KEPEMILIKAN KONGLO & POTENSI M&A ({stats.maCount})
          </button>
        </div>

        {/* Real-time Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="text"
            placeholder="Cari emiten / tesis ($DCII, $BYAN)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: '4px 8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              border: 'var(--border-muted)',
              background: 'var(--bg-canvas)',
              color: 'var(--text-primary)',
              outline: 'none',
              width: '210px',
              borderRadius: 'var(--radius-xs)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Conglomerate Family Selector Pills */}
      <div style={{
        padding: '8px 14px',
        borderBottom: 'var(--border-hairline)',
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        background: 'var(--bg-panel)'
      }}>
        <button
          onClick={() => setSelectedGroup('ALL')}
          className={`telemetry-btn ${selectedGroup === 'ALL' ? 'active' : ''}`}
          style={{ fontSize: '10px', padding: '3px 8px' }}
        >
          ✦ SEMUA KLASTER
        </button>
        {groupKeys.map(key => (
          <button
            key={key}
            onClick={() => setSelectedGroup(key)}
            className={`telemetry-btn ${selectedGroup === key ? 'active' : ''}`}
            style={{ fontSize: '10px', padding: '3px 8px' }}
          >
            {GROUP_LABELS[key] || key.replace('_GROUP', '').replace('_', ' ')}
            <span style={{ fontSize: '9px', marginLeft: '4px', opacity: 0.7 }}>
              ({(conglomerates[key] || []).length})
            </span>
          </button>
        ))}
      </div>

      {/* 4. Table of Conglomerates & M&A Stocks */}
      <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
        <table className="telemetry-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '90px' }}>Ticker</th>
              <th style={{ width: '160px' }}>Perusahaan & Klaster</th>
              <th style={{ width: '120px' }}>Tipe Relasi</th>
              <th>Tesis Kepemilikan & Potensi Akuisisi / Sinergi</th>
              <th style={{ textAlign: 'right', width: '95px' }}>Harga (IDR)</th>
              <th style={{ textAlign: 'right', width: '75px' }}>Chg %</th>
              <th style={{ textAlign: 'right', width: '85px' }}>MA20</th>
              <th style={{ textAlign: 'center', width: '65px' }}>RSI 14</th>
              <th style={{ textAlign: 'center', width: '110px' }}>Sinyal</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Tidak ada emiten yang sesuai dengan filter atau kata kunci pencarian.
                </td>
              </tr>
            ) : (
              filteredStocks.map((stock) => {
                const isCore = (stock.ownership_type || 'CORE_HOLDING') === 'CORE_HOLDING';
                const isMATarget = stock.ownership_type === 'MA_TARGET';
                const chg = Number(stock.change_pct || 0);

                return (
                  <tr key={`${stock.groupKey}-${stock.ticker}`}>
                    {/* Ticker Clickable Chip */}
                    <td>
                      <button
                        onClick={() => onSelectTicker && onSelectTicker(stock.ticker, 'IDX')}
                        className="telemetry-btn ticker-chip-interactive"
                        style={{
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--accent-blue)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title={`Buka chart TradingView untuk $${stock.ticker}`}
                      >
                        ${stock.ticker} ↗
                      </button>
                    </td>

                    {/* Company Name & Klaster */}
                    <td>
                      <div style={{ fontWeight: '700', fontSize: '11px', color: 'var(--text-primary)' }}>
                        {stock.company_name}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {stock.groupLabel}
                      </div>
                    </td>

                    {/* Ownership / Relation Badge */}
                    <td>
                      {isCore ? (
                        <span className="badge" style={{ fontSize: '8px', background: 'var(--bg-panel-subtle)', color: 'var(--text-primary)' }}>
                          👑 CORE HOLDING
                        </span>
                      ) : isMATarget ? (
                        <span className="badge" style={{ fontSize: '8px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-rust)', border: '1px solid rgba(239, 68, 68, 0.35)', fontWeight: '700' }}>
                          🎯 TARGET AKUISISI
                        </span>
                      ) : (
                        <span className="badge" style={{ fontSize: '8px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-gold)', border: '1px solid rgba(245, 158, 11, 0.35)', fontWeight: '700' }}>
                          🤝 KEPEMILIKAN STRATEGIS
                        </span>
                      )}
                    </td>

                    {/* Catalyst Thesis */}
                    <td>
                      <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {stock.catalyst_thesis || 'Afiliasi ekosistem konglomerasi dan pergerakan likuiditas grup.'}
                      </div>
                    </td>

                    {/* Price */}
                    <td style={{ textAlign: 'right', fontWeight: '700', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      Rp {Number(stock.price || 0).toLocaleString('id-ID')}
                    </td>

                    {/* Change % */}
                    <td style={{
                      textAlign: 'right',
                      fontWeight: '700',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: chg > 0 ? 'var(--accent-green)' : chg < 0 ? 'var(--accent-rust)' : 'inherit'
                    }}>
                      {chg > 0 ? `+${chg}%` : `${chg}%`}
                    </td>

                    {/* MA20 */}
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                      Rp {Number(stock.ma20 || stock.price || 0).toLocaleString('id-ID')}
                    </td>

                    {/* RSI 14 */}
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      <span style={{
                        color: stock.rsi_14 > 70 ? 'var(--accent-rust)' : stock.rsi_14 < 35 ? 'var(--accent-green)' : 'inherit',
                        fontWeight: '700'
                      }}>
                        {stock.rsi_14 || 50}
                      </span>
                    </td>

                    {/* Technical Signal Status */}
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${
                        stock.technical_signal === 'BREAKOUT' ? 'badge-bull' :
                        stock.technical_signal === 'ACCUMULATION' ? 'badge-blue' :
                        stock.technical_signal === 'OVERSOLD_REBOUND' ? 'badge-alert' :
                        'badge'
                      }`} style={{ fontSize: '8px', padding: '1px 5px' }}>
                        {stock.technical_signal || 'MONITOR'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
