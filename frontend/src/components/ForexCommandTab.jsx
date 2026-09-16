import React, { useState, useEffect } from 'react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
      <div className="telemetry-panel" style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          💱 FOREX COMMAND CENTER
        </h2>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
          28-Pair Scanner · Pip Calculator · COT Positioning · Session Clock
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {clocks.map(c => (
          <div key={c.name} className="telemetry-panel" style={{ padding: '12px', textAlign: 'center', borderTop: c.open ? '3px solid var(--accent-green)' : '3px solid var(--text-muted)' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{c.flag} {c.name}</div>
            <div style={{ fontSize: '20px', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>{c.time}</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: c.open ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              {c.open ? 'OPEN' : 'CLOSED'}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', borderBottom: 'var(--border-hairline)', paddingBottom: '8px' }}>
        <button onClick={() => setActiveTab('screener')} style={{ background: activeTab === 'screener' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'screener' ? 'bold' : 'normal' }}>📊 PAIR SCREENER</button>
        <button onClick={() => setActiveTab('pip')} style={{ background: activeTab === 'pip' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'pip' ? 'bold' : 'normal' }}>🧮 PIP CALCULATOR</button>
        <button onClick={() => setActiveTab('cot')} style={{ background: activeTab === 'cot' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'cot' ? 'bold' : 'normal' }}>📋 COT REPORT</button>
      </div>

      <div className="telemetry-panel">
        {activeTab === 'screener' && (
          <>
            <div style={{ padding: '12px', borderBottom: 'var(--border-hairline)', display: 'flex', justifyContent: 'flex-end' }}>
              <input type="text" placeholder="Search pairs..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '6px 12px', border: 'var(--border-hairline)', borderRadius: 'var(--radius-sm)' }} />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Pair</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Chg %</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>RSI(14)</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Setup</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Entry Zone</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>R:R</th>
                </tr>
              </thead>
              <tbody>
                {pairs.filter(p => p.pair.toLowerCase().includes(search.toLowerCase())).map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: 'var(--border-hairline)' }}>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => onOpenChart(`FX:${p.pair}`)} style={{ background:'transparent', border:'none', color:'var(--accent-blue)', cursor:'pointer', fontWeight:'bold' }}>
                        {p.pair}
                      </button>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{p.price}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: p.change_24h_pct > 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>{p.change_24h_pct}%</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: p.rsi_14 < 30 ? 'var(--accent-green)' : p.rsi_14 > 70 ? 'var(--accent-rust)' : 'var(--text-primary)' }}>{p.rsi_14}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span className="badge" style={{background:'var(--bg-panel-subtle)'}}>{p.setup_type}</span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{p.entry_zone_low} - {p.entry_zone_high}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>1:{p.risk_reward_ratio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === 'pip' && (
          <div style={{ padding: '24px', maxWidth: '500px', margin: '0 auto' }}>
            <h3 style={{ marginBottom: '16px' }}>Position Risk Calculator</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Pair</label>
                <select value={calcPair} onChange={e => setCalcPair(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: 'var(--border-hairline)' }}>
                  {pairs.map(p => <option key={p.pair} value={p.pair}>{p.pair}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Lot Size</label>
                <input type="number" step="0.01" value={calcLot} onChange={e => setCalcLot(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: 'var(--border-hairline)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Entry Price</label>
                <input type="number" step="0.0001" value={calcEntry} onChange={e => setCalcEntry(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: 'var(--border-hairline)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Stop Loss Price</label>
                <input type="number" step="0.0001" value={calcSL} onChange={e => setCalcSL(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: 'var(--border-hairline)' }} />
              </div>
              
              <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Pip Distance:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{calcPipDistance.toFixed(1)} Pips</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Risk (USD):</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-rust)' }}>${riskUsd.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Risk (IDR):</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-rust)' }}>Rp {riskIdr.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cot' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Currency</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Net Speculative</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Weekly Chg</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Sentiment</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Signal</th>
              </tr>
            </thead>
            <tbody>
              {cot_report.map((c, idx) => {
                let badgeClass = '';
                if(c.sentiment === 'EXTREMELY_LONG') badgeClass = 'badge-bear'; // contrarian bearish
                else if(c.sentiment === 'EXTREMELY_SHORT') badgeClass = 'badge-bull'; // contrarian bullish
                
                const isPos = c.net_speculative > 0;
                
                return (
                  <tr key={idx} style={{ borderBottom: 'var(--border-hairline)' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{c.currency}</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingRight: '4px' }}>
                          {!isPos && <div style={{ height: '8px', background: 'var(--accent-rust)', width: `${Math.min(100, Math.abs(c.net_speculative)/1000)}%` }} />}
                        </div>
                        <div style={{ width: '2px', height: '12px', background: 'var(--text-muted)' }} />
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '4px' }}>
                          {isPos && <div style={{ height: '8px', background: 'var(--accent-green)', width: `${Math.min(100, c.net_speculative/1000)}%` }} />}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{c.net_speculative.toLocaleString()}</div>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{c.net_change_week > 0 ? '+' : ''}{c.net_change_week.toLocaleString()}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span className={`badge ${badgeClass}`}>{c.sentiment}</span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 'bold' }}>{c.contrarian_signal}</span>
                    </td>
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
