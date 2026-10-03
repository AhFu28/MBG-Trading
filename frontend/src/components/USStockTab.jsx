import React, { useState } from 'react';
import AssetIcon from './AssetIcon.jsx';

// H-05: Institutional Metadata Registry for Wall Street 31 Coverage (Solves 0.0B & Missing Names)
const US_EQUITIES_METADATA = {
  'AAPL': { name: 'Apple Inc.', mktCap: '3.42T', pe: '34.2' },
  'NVDA': { name: 'NVIDIA Corp.', mktCap: '3.15T', pe: '52.8' },
  'MSFT': { name: 'Microsoft Corp.', mktCap: '3.28T', pe: '36.5' },
  'META': { name: 'Meta Platforms Inc.', mktCap: '1.48T', pe: '28.1' },
  'GOOGL': { name: 'Alphabet Inc.', mktCap: '2.10T', pe: '24.6' },
  'AMD': { name: 'Advanced Micro Devices', mktCap: '252.4B', pe: '115.0' },
  'AVGO': { name: 'Broadcom Inc.', mktCap: '780.5B', pe: '38.2' },
  'CRM': { name: 'Salesforce Inc.', mktCap: '265.8B', pe: '46.7' },
  'PLTR': { name: 'Palantir Technologies', mktCap: '82.5B', pe: '88.4' },
  'SMCI': { name: 'Super Micro Computer', mktCap: '26.8B', pe: '21.5' },
  'AMZN': { name: 'Amazon.com Inc.', mktCap: '1.98T', pe: '44.3' },
  'TSLA': { name: 'Tesla Inc.', mktCap: '768.4B', pe: '62.0' },
  'NFLX': { name: 'Netflix Inc.', mktCap: '298.5B', pe: '41.2' },
  'COIN': { name: 'Coinbase Global', mktCap: '54.2B', pe: '35.6' },
  'SOFI': { name: 'SoFi Technologies', mktCap: '9.8B', pe: '42.0' },
  'JPM': { name: 'JPMorgan Chase & Co.', mktCap: '612.4B', pe: '12.4' },
  'GS': { name: 'Goldman Sachs Group', mktCap: '168.2B', pe: '15.8' },
  'V': { name: 'Visa Inc.', mktCap: '574.6B', pe: '30.1' },
  'MA': { name: 'Mastercard Inc.', mktCap: '448.2B', pe: '33.4' },
  'UNH': { name: 'UnitedHealth Group', mktCap: '542.8B', pe: '22.3' },
  'JNJ': { name: 'Johnson & Johnson', mktCap: '394.5B', pe: '16.5' },
  'PFE': { name: 'Pfizer Inc.', mktCap: '162.1B', pe: '14.2' },
  'LLY': { name: 'Eli Lilly & Co.', mktCap: '882.4B', pe: '68.5' },
  'XOM': { name: 'Exxon Mobil Corp.', mktCap: '486.2B', pe: '13.9' },
  'CVX': { name: 'Chevron Corp.', mktCap: '286.4B', pe: '14.2' },
  'BA': { name: 'Boeing Co.', mktCap: '98.4B', pe: 'N/A' },
  'GE': { name: 'General Electric Co.', mktCap: '198.6B', pe: '32.1' },
  'CAT': { name: 'Caterpillar Inc.', mktCap: '184.2B', pe: '17.4' },
  'MU': { name: 'Micron Technology', mktCap: '118.5B', pe: '24.2' },
  'INTC': { name: 'Intel Corp.', mktCap: '88.6B', pe: '18.5' },
  'ARM': { name: 'Arm Holdings plc', mktCap: '142.8B', pe: '95.2' }
};

export default function USStockTab({ data, onOpenChart, livePrices = {}, flashMap = {} }) {
  const [activeTab, setActiveTab] = useState('screener');
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');

  const usData = data?.us_stocks;
  if (!usData) {
    return (
      <div className="quant-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🇺🇸</div>
        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>US Equities Data Hub</div>
        <div style={{ fontSize: '13px', marginTop: '6px' }}>Menghubungkan ke pipeline analitik Wall Street...</div>
      </div>
    );
  }

  const { stocks = [], earnings_calendar = [], sector_performance = {} } = usData;
  const sectors = ['ALL', ...new Set(stocks.map(s => s.sector))];

  const filteredStocks = stocks.filter(s => 
    (sectorFilter === 'ALL' || s.sector === sectorFilter) && 
    (s.ticker.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()))
  );

  const bestSector = Object.entries(sector_performance).sort((a, b) => b[1] - a[1])[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
      {/* Header Cockpit Panel */}
      <div className="quant-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🇺🇸</span>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, letterSpacing: '0.04em' }}>
                US STOCK INTELLIGENCE
              </h2>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>
                <span className="pulse-dot-green" />
                <span>WALL STREET 30 RADAR</span>
              </div>
            </div>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '0.01em' }}>
              Institutional Screener · Earnings Volatility Alert · S&P/Nasdaq Top Setups
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {bestSector && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: '8px', border: 'var(--border-hairline)', textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Leading Sector</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: bestSector[1] >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                  {bestSector[0]}: {bestSector[1] > 0 ? '+' : ''}{Number(bestSector[1] || 0).toFixed(2)}%
                </div>
              </div>
            )}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: '8px', border: 'var(--border-hairline)', textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Coverage</div>
              <div style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                {stocks.length} EQUITIES
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Performance Grid */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.06em' }}>
          S&P Sector Breadth
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          {Object.entries(sector_performance).map(([sec, perf]) => {
            const numPerf = Number(perf || 0);
            const isBull = numPerf >= 0;
            const isSelected = sectorFilter === sec;
            return (
              <div 
                key={sec} 
                onClick={() => setSectorFilter(isSelected ? 'ALL' : sec)}
                className="quant-card-interactive" 
                style={{ 
                  padding: '10px 12px', 
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--accent-blue)' : undefined,
                  background: isSelected 
                    ? 'rgba(56, 189, 248, 0.08)' 
                    : isBull ? 'rgba(34, 197, 94, 0.03)' : 'rgba(239, 68, 68, 0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>
                    {sec}
                  </span>
                  <span style={{ fontSize: '8px', opacity: 0.7 }}>{isBull ? '▲' : '▼'}</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: isBull ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                  {isBull ? '+' : ''}{numPerf.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Segmented Pill Navigation */}
      <div className="quant-pill-nav">
        <button 
          onClick={() => setActiveTab('screener')} 
          className={`quant-pill-btn ${activeTab === 'screener' ? 'active' : ''}`}
        >
          📊 SCREENER ({filteredStocks.length})
        </button>
        <button 
          onClick={() => setActiveTab('earnings')} 
          className={`quant-pill-btn ${activeTab === 'earnings' ? 'active' : ''}`}
        >
          📅 EARNINGS CALENDAR ({earnings_calendar.length})
        </button>
        <button 
          onClick={() => setActiveTab('plans')} 
          className={`quant-pill-btn ${activeTab === 'plans' ? 'active' : ''}`}
        >
          🎯 TOP 5 INSTITUTIONAL PLANS
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'screener' && (
        <div className="quant-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SECTOR:</span>
              <select 
                value={sectorFilter} 
                onChange={e => setSectorFilter(e.target.value)} 
                className="quant-input"
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Search US ticker or company..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="quant-input"
                style={{ width: '220px', padding: '6px 12px', fontSize: '12px' }} 
              />
              {search && (
                <button 
                  onClick={() => setSearch('')} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="table-scroll-container">
            <table className="quant-table">
              <thead>
                <tr>
                  <th className="sticky-col-num">TICKER</th>
                  <th>COMPANY NAME</th>
                  <th>SECTOR</th>
                  <th style={{ textAlign: 'right' }}>PRICE</th>
                  <th style={{ textAlign: 'right' }} title="Perubahan harga 24 jam terakhir dalam persen">CHG %</th>
                  <th style={{ textAlign: 'right' }} title="Kapitalisasi pasar: total nilai semua saham beredar (T = Triliun, B = Miliar USD)">MKT CAP</th>
                  <th style={{ textAlign: 'right' }} title="Price-to-Earnings: harga saham dibagi laba per saham. Makin rendah = makin murah relatif terhadap laba">P/E</th>
                  <th style={{ textAlign: 'right' }} title="RSI 14 hari: indikator momentum 0-100. < 30 oversold, > 70 overbought">RSI (14)</th>
                  <th style={{ textAlign: 'center' }} title="Setup teknikal hasil skrining quant engine (mis. BULL_FLAG, BREAKOUT, NEUTRAL)">QUANT SETUP</th>
                  <th style={{ textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', whiteSpace: 'normal' }}>
                      Tidak ada emiten yang cocok dengan filter sector atau pencarian "{search}".
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>Coba reset pencarian atau pilih sector: ALL.</div>
                    </td>
                  </tr>
                )}
                {filteredStocks.map((s) => {
                  const liveQuote = livePrices[s.ticker] || livePrices[`NASDAQ:${s.ticker}`] || livePrices[`NYSE:${s.ticker}`];
                  const currentPrice = liveQuote?.price !== undefined ? Number(liveQuote.price) : Number(s.price || 0);
                  const chg = liveQuote?.changePct !== undefined ? Number(liveQuote.changePct) : Number(s.change_pct || 0);
                  const isFlashing = flashMap[s.ticker] || flashMap[`NASDAQ:${s.ticker}`] || flashMap[`NYSE:${s.ticker}`];
                  const isPositive = chg >= 0;
                  // Pipeline writes a flat default of 50 when RSI is unavailable.
                  // Treat exactly 50 as "no data" — render an honest em-dash instead of a fake reading.
                  const rsiRaw = s.rsi_14;
                  const hasRsi = rsiRaw !== null && rsiRaw !== undefined && Number(rsiRaw) > 0 && Number(rsiRaw) !== 50;
                  const rsiVal = Number(rsiRaw || 0);
                  const rsiColor = !hasRsi ? 'var(--text-muted)' : rsiVal < 30 ? 'var(--accent-green)' : rsiVal > 70 ? 'var(--accent-rust)' : 'var(--text-primary)';
                  const rsiBg = !hasRsi ? 'transparent' : rsiVal < 30 ? 'rgba(34, 197, 94, 0.1)' : rsiVal > 70 ? 'rgba(239, 68, 68, 0.1)' : 'transparent';
                  
                  return (
                    <tr key={s.ticker}>
                      <td className="sticky-col-num">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AssetIcon symbol={s.ticker} market="US" size={18} />
                          <span style={{ fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
                            {s.ticker}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {US_EQUITIES_METADATA[s.ticker]?.name || s.name}
                      </td>
                      <td>
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                          {s.sector}
                        </span>
                      </td>
                      <td style={{
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '700',
                        color: isFlashing === 'up' ? 'var(--accent-green)' : isFlashing === 'down' ? 'var(--accent-rust)' : 'var(--text-primary)',
                        transition: 'color 0.3s ease'
                      }}>
                        ${currentPrice.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: isPositive ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                        {isPositive ? '+' : ''}{chg.toFixed(2)}%
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {s.market_cap && s.market_cap > 0 ? `${((s.market_cap) / 1e9).toFixed(1)}B` : (US_EQUITIES_METADATA[s.ticker]?.mktCap || '—')}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {s.pe_ratio && s.pe_ratio > 0 ? String(s.pe_ratio) : (US_EQUITIES_METADATA[s.ticker]?.pe || '—')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span 
                          title={hasRsi
                            ? 'RSI (14): ' + rsiVal.toFixed(1) + ' — ' + (rsiVal < 30 ? 'oversold (area beli potensial)' : rsiVal > 70 ? 'overbought (area jual potensial)' : 'netral')
                            : 'Data RSI (14) belum tersedia dari pipeline'}
                          style={{ 
                            fontFamily: 'var(--font-mono)', 
                            fontWeight: '700', 
                            color: rsiColor,
                            background: rsiBg,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px'
                          }}>
                          {hasRsi ? rsiVal.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          padding: '3px 8px', 
                          borderRadius: '4px', 
                          background: s.setup_type.includes('BULL') || s.setup_type.includes('BREAKOUT') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                          color: s.setup_type.includes('BULL') || s.setup_type.includes('BREAKOUT') ? 'var(--accent-green)' : 'var(--accent-blue)',
                          border: `1px solid ${s.setup_type.includes('BULL') || s.setup_type.includes('BREAKOUT') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)'}`
                        }}>
                          {s.setup_type}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => onOpenChart(`NASDAQ:${s.ticker}`)}
                          title="Buka grafik TradingView untuk ${s.ticker}"
                          aria-label={"Buka grafik " + s.ticker}
                          style={{
                            padding: '4px 10px',
                            minHeight: '26px',
                            background: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            borderRadius: '4px',
                            color: 'var(--accent-blue)',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          CHART ↗
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="quant-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: 'var(--border-hairline)', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              ⚡ <strong>Earnings Volatility Protocol:</strong> Hindari posisi baru &lt; 3 hari sebelum rilis earning untuk mitigasi gap risk.
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="quant-table">
              <thead>
                <tr>
                  <th>TICKER</th>
                  <th>COMPANY NAME</th>
                  <th style={{ textAlign: 'center' }}>REPORT DATE</th>
                  <th style={{ textAlign: 'center' }}>COUNTDOWN</th>
                  <th style={{ textAlign: 'center' }}>VOLATILITY STATUS</th>
                  <th style={{ textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {earnings_calendar.map((e, idx) => {
                  let badge = (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--accent-green)', fontSize: '11px', fontWeight: '700' }}>
                      <span className="pulse-dot-green" /> SAFE TO TRADE
                    </span>
                  );
                  if (e.days_until <= 3) {
                    badge = (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-rust)', fontSize: '11px', fontWeight: '700', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <span className="pulse-dot-red" /> 🔴 AVOID TRADING (HIGH RISK)
                      </span>
                    );
                  } else if (e.days_until <= 7) {
                    badge = (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.15)', color: 'var(--accent-gold)', fontSize: '11px', fontWeight: '700' }}>
                        <span className="pulse-dot-amber" /> 🟡 CAUTION (APPROACHING)
                      </span>
                    );
                  }

                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AssetIcon symbol={e.ticker} market="US" size={16} />
                          <span>{e.ticker}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{e.name}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                        {e.earnings_date}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: '700', color: e.days_until <= 3 ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
                        {e.days_until} DAYS
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {badge}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => onOpenChart(`NASDAQ:${e.ticker}`)}
                          style={{
                            padding: '4px 10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-hairline)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          CHART ↗
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'plans' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {stocks.slice(0, 5).map((s, idx) => {
            const liveQuote = livePrices[s.ticker] || livePrices[`NASDAQ:${s.ticker}`] || livePrices[`NYSE:${s.ticker}`];
            const currentPrice = liveQuote?.price !== undefined ? Number(liveQuote.price) : Number(s.entry_price || s.price || 0);
            return (
            <div key={idx} className="quant-card-interactive" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AssetIcon symbol={s.ticker} market="US" size={22} />
                      <span style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
                        {s.ticker}
                      </span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                        {s.sector}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {s.name}
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '800', 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    background: 'rgba(56, 189, 248, 0.1)', 
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.25)' 
                  }}>
                    {s.setup_type}
                  </span>
                </div>

                <div style={{ 
                  margin: '16px 0', 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '10px',
                  background: 'rgba(0,0,0,0.25)', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '1px solid rgba(255,255,255,0.04)' 
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>LIVE / ENTRY ZONE</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
                      ${currentPrice.toFixed(2)} <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '400' }}>(Entry: ${Number(s.entry_price || 0).toFixed(2)})</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RISK / REWARD</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>
                      1 : {Number(s.risk_reward_ratio || 2).toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>STOP LOSS</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-rust)' }}>
                      ${Number(s.stop_loss || 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TARGET (TP1)</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
                      ${Number(s.take_profit_1 || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => onOpenChart(`NASDAQ:${s.ticker}`)} 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(56, 189, 248, 0.05))', 
                  border: '1px solid rgba(56, 189, 248, 0.3)', 
                  borderRadius: '6px', 
                  color: '#38bdf8', 
                  fontWeight: '700', 
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>OPEN TRADINGVIEW DESK</span>
                <span>↗</span>
              </button>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
