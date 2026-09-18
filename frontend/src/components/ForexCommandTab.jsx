import React, { useState, useEffect } from 'react';
import AssetIcon from './AssetIcon.jsx';
import { CURRENCY_FLAGS } from '../data/forex-flags.js';

function getZoneInfo(date, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      hourCycle: 'h23',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const getVal = (type) => parts.find(p => p.type === type)?.value || '';
    const hour = parseInt(getVal('hour'), 10);
    const minute = parseInt(getVal('minute'), 10);
    const second = parseInt(getVal('second'), 10);
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
    return { hour, minute, second, timeStr };
  } catch (e) {
    return { hour: 0, minute: 0, second: 0, timeStr: '--:--:--' };
  }
}

export default function ForexCommandTab({ data, onOpenChart }) {
  const [activeTab, setActiveTab] = useState('screener');
  const [search, setSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Pip calculator state
  const [calcPair, setCalcPair] = useState('EURUSD');
  const [calcLot, setCalcLot] = useState(0.1);
  const [calcEntry, setCalcEntry] = useState(0);
  const [calcSL, setCalcSL] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const forexData = data?.forex_intelligence;
  if (!forexData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💱</div>
        <div>Data belum tersedia</div>
      </div>
    );
  }

  const { pairs = [], cot_report = [] } = forexData;

  const syd = getZoneInfo(currentTime, 'Australia/Sydney');
  const tyo = getZoneInfo(currentTime, 'Asia/Tokyo');
  const lon = getZoneInfo(currentTime, 'Europe/London');
  const ny = getZoneInfo(currentTime, 'America/New_York');

  const clocks = [
    { name: 'Sydney', flag: '🇦🇺', time: syd.timeStr, open: (syd.hour >= 8 && syd.hour < 17) },
    { name: 'Tokyo', flag: '🇯🇵', time: tyo.timeStr, open: (tyo.hour >= 9 && tyo.hour < 18) },
    { name: 'London', flag: '🇬🇧', time: lon.timeStr, open: (lon.hour >= 8 && lon.hour < 17) },
    { name: 'New York', flag: '🇺🇸', time: ny.timeStr, open: (ny.hour >= 8 && ny.hour < 17) },
  ];

  // Calculator Logic
  const calcPipDistance = Math.abs(calcEntry - calcSL) * (calcPair.includes('JPY') ? 100 : 10000);
  const selectedPairData = pairs.find(p => p.pair === calcPair) || pairs[0];
  const pipValueUsd = selectedPairData ? selectedPairData.pip_value_usd * calcLot : 10 * calcLot;
  const riskUsd = calcPipDistance * pipValueUsd;
  const riskIdr = riskUsd * 16000;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header Bar */}
      <div className="quant-card" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>💱</span>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              FOREX COMMAND CENTER
            </h2>
            <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
              28 MAJOR & MINOR PAIRS
            </span>
          </div>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '0.01em' }}>
            TradingView Scanner &middot; Pip & Lot Risk Calculator &middot; Laporan CFTC COT Institutional
          </p>
        </div>

        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '6px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)' }}>
          WAKTU SISTEM: <strong style={{ color: 'var(--text-primary)' }}>{currentTime.toLocaleTimeString('id-ID')} WIB</strong>
        </div>
      </div>

      {/* 2. Global Forex Session Clocks (Agile Cards with Live Dots) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        {clocks.map(c => (
          <div key={c.name} className="quant-card quant-card-interactive" style={{ padding: '14px 16px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '700' }}>{c.flag} {c.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className={c.open ? 'pulse-dot-green' : ''} style={!c.open ? { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)' } : {}} />
                <span style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: c.open ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                  {c.open ? 'SESSION OPEN' : 'CLOSED'}
                </span>
              </div>
            </div>
            <div style={{ fontSize: '22px', fontFamily: 'var(--font-mono)', fontWeight: '800', margin: '8px 0 2px', letterSpacing: '0.02em', color: c.open ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {c.time}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              {c.open ? 'Volatilitas & Likuiditas Aktif' : 'Pasar Sesi Tutup'}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Agile Segmented Pill Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="quant-pill-nav">
          <button onClick={() => setActiveTab('screener')} className={`quant-pill-btn ${activeTab === 'screener' ? 'active' : ''}`}>
            <span>📊</span>
            <span>28-PAIR SCREENER</span>
          </button>
          <button onClick={() => setActiveTab('pip')} className={`quant-pill-btn ${activeTab === 'pip' ? 'active' : ''}`}>
            <span>🧮</span>
            <span>PIP & RISK CALCULATOR</span>
          </button>
          <button onClick={() => setActiveTab('cot')} className={`quant-pill-btn ${activeTab === 'cot' ? 'active' : ''}`}>
            <span>📋</span>
            <span>COT POSITIONING</span>
          </button>
        </div>

        {activeTab === 'screener' && (
          <input 
            type="text" 
            placeholder="Cari pair valas (cth: EURUSD)..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="quant-input"
            style={{ minWidth: '220px' }} 
          />
        )}
      </div>

      {/* 4. Main Content Panel */}
      <div className="quant-card" style={{ padding: '0', overflow: 'hidden' }}>
        {activeTab === 'screener' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="quant-table">
              <thead>
                <tr>
                  <th>Pair Valas</th>
                  <th style={{ textAlign: 'right' }}>Harga Terakhir</th>
                  <th style={{ textAlign: 'right' }}>Perubahan 24h</th>
                  <th style={{ textAlign: 'right' }}>RSI (14)</th>
                  <th style={{ textAlign: 'center' }}>Setup Tipe</th>
                  <th style={{ textAlign: 'center' }}>Zona Entry</th>
                  <th style={{ textAlign: 'center' }}>Risk : Reward</th>
                </tr>
              </thead>
              <tbody>
                {pairs.filter(p => p.pair.toLowerCase().includes(search.toLowerCase())).map((p) => {
                  const isJpy = (p.pair || '').includes('JPY');
                  const decimals = isJpy ? 3 : 5;
                  const chg = Number(p.change_24h_pct || 0);
                  const isPos = chg > 0;
                  const rsi = Number(p.rsi_14 || 0);

                  return (
                    <tr key={p.pair}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AssetIcon symbol={p.pair} market="FOREX" size={16} />
                          <button onClick={() => onOpenChart(`FX:${p.pair}`)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: 0 }}>
                            {p.pair} ↗
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                        {Number(p.price || 0).toFixed(decimals)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: isPos ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                        {isPos ? '+' : ''}{chg.toFixed(2)}%
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: rsi < 30 ? 'var(--accent-green)' : rsi > 70 ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
                        {rsi.toFixed(1)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', fontWeight: '700' }}>{p.setup_type}</span>
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {Number(p.entry_zone_low || 0).toFixed(decimals)} &ndash; {Number(p.entry_zone_high || 0).toFixed(decimals)}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                        1:{Number(p.risk_reward_ratio || 2).toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'pip' && (
          <div style={{ padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }}>
            <div style={{ marginBottom: '18px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>🧮 KALKULATOR RISIKO POSISI & PIP</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Hitung modal toleransi risiko sebelum open order</p>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Pair Mata Uang</label>
                <select value={calcPair} onChange={e => setCalcPair(e.target.value)} className="quant-input" style={{ width: '100%' }}>
                  {pairs.map(p => <option key={p.pair} value={p.pair}>{p.pair}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Ukuran Lot</label>
                  <input type="number" step="0.01" value={calcLot} onChange={e => setCalcLot(Number(e.target.value))} className="quant-input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Pip Distance</label>
                  <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                    {calcPipDistance.toFixed(1)} Pips
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Harga Entry</label>
                  <input type="number" step="0.0001" value={calcEntry} onChange={e => setCalcEntry(Number(e.target.value))} className="quant-input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Stop Loss</label>
                  <input type="number" step="0.0001" value={calcSL} onChange={e => setCalcSL(Number(e.target.value))} className="quant-input" style={{ width: '100%' }} />
                </div>
              </div>
              
              {/* Computed Summary Box */}
              <div style={{
                marginTop: '12px',
                padding: '16px 20px',
                background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(18, 23, 34, 0.7) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                display: 'grid',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Maksimum Risiko (USD):</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-rust)', fontSize: '18px' }}>
                    ${riskUsd.toFixed(2)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Estimasi Kerugian (IDR @16K):</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-rust)', fontSize: '14px' }}>
                    Rp {Math.round(riskIdr).toLocaleString('id-ID')}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cot' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="quant-table">
              <thead>
                <tr>
                  <th>Mata Uang</th>
                  <th style={{ textAlign: 'center' }}>Net Spekulatif (Institusi)</th>
                  <th style={{ textAlign: 'right' }}>Perubahan Mingguan</th>
                  <th style={{ textAlign: 'center' }}>Sentimen Posisi</th>
                  <th style={{ textAlign: 'center' }}>Sinyal Contrarian</th>
                </tr>
              </thead>
              <tbody>
                {cot_report.map((c, idx) => {
                  let badgeClass = '';
                  if (c.sentiment === 'EXTREMELY_LONG') badgeClass = 'badge-bear';
                  else if (c.sentiment === 'EXTREMELY_SHORT') badgeClass = 'badge-bull';
                  
                  const isPos = c.net_speculative > 0;
                  
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 'bold' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '15px' }}>{CURRENCY_FLAGS[c.currency]?.flag || '🌐'}</span>
                          <span>{c.currency}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingRight: '4px' }}>
                            {!isPos && <div style={{ height: '6px', borderRadius: '3px', background: 'var(--accent-rust)', width: `${Math.min(100, Math.abs(c.net_speculative)/1000)}%` }} />}
                          </div>
                          <div style={{ width: '2px', height: '14px', background: 'var(--text-muted)' }} />
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '4px' }}>
                            {isPos && <div style={{ height: '6px', borderRadius: '3px', background: 'var(--accent-green)', width: `${Math.min(100, c.net_speculative/1000)}%` }} />}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '10px', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          {c.net_speculative.toLocaleString()}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: c.net_change_week > 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                        {c.net_change_week > 0 ? '+' : ''}{c.net_change_week.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${badgeClass}`} style={{ fontWeight: 'bold' }}>{c.sentiment}</span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        {c.contrarian_signal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
