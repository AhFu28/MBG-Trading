import React, { useState } from 'react';

export default function GlobalMarketsTab({ onSelectTicker }) {
  const [activeRegion, setActiveRegion] = useState('ALL');
  const regions = ['ALL', 'WALL STREET', 'ASIA PACIFIC', 'INDONESIA', 'BONDS & YIELD', 'FOREX & CURRENCIES'];

  const marketSessions = [
    { name: 'Tokyo (TSE)', flag: '🇯🇵', hours: '07:00 - 13:30 WIB', isOpen: false },
    { name: 'Jakarta (IDX)', flag: '🇮🇩', hours: '09:00 - 16:00 WIB', isOpen: true },
    { name: 'London (LSE)', flag: '🇬🇧', hours: '15:00 - 23:30 WIB', isOpen: false },
    { name: 'New York (NYSE)', flag: '🇺🇸', hours: '20:30 - 03:00 WIB', isOpen: false },
  ];

  const assets = [
    // Wall Street
    { ticker: 'AAPL', name: 'Apple Inc.', flag: '🇺🇸', price: '$178.25', change: 1.45, high: '$179.10', low: '$176.80', region: 'WALL STREET', market: 'US' },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', flag: '🇺🇸', price: '$118.80', change: 3.12, high: '$120.40', low: '$116.50', region: 'WALL STREET', market: 'US' },
    { ticker: 'MSFT', name: 'Microsoft Corp.', flag: '🇺🇸', price: '$424.50', change: 0.85, high: '$426.00', low: '$421.20', region: 'WALL STREET', market: 'US' },
    { ticker: 'TSLA', name: 'Tesla Inc.', flag: '🇺🇸', price: '$210.40', change: -1.82, high: '$215.00', low: '$208.10', region: 'WALL STREET', market: 'US' },
    // Asia Pacific
    { ticker: '7203.T', name: 'Toyota Motor Corp.', flag: '🇯🇵', price: '¥2,950', change: 0.72, high: '¥2,980', low: '¥2,930', region: 'ASIA PACIFIC', market: 'JP' },
    { ticker: '005930.KS', name: 'Samsung Electronics', flag: '🇰🇷', price: '₩74,200', change: -0.45, high: '₩75,000', low: '₩73,800', region: 'ASIA PACIFIC', market: 'KR' },
    { ticker: '0700.HK', name: 'Tencent Holdings', flag: '🇭🇰', price: 'HK$378.00', change: 1.88, high: 'HK$382.00', low: 'HK$374.00', region: 'ASIA PACIFIC', market: 'HK' },
    { ticker: 'D05.SI', name: 'DBS Group Holdings', flag: '🇸🇬', price: 'S$35.80', change: 0.35, high: 'S$36.00', low: 'S$35.60', region: 'ASIA PACIFIC', market: 'SG' },
    // Indonesia Bluechips
    { ticker: 'BBCA', name: 'Bank Central Asia', flag: '🇮🇩', price: 'Rp 9.250', change: 0.54, high: 'Rp 9.300', low: 'Rp 9.175', region: 'INDONESIA', market: 'IDX' },
    { ticker: 'BBRI', name: 'Bank Rakyat Indonesia', flag: '🇮🇩', price: 'Rp 4.920', change: -1.20, high: 'Rp 4.980', low: 'Rp 4.900', region: 'INDONESIA', market: 'IDX' },
    { ticker: 'BMRI', name: 'Bank Mandiri', flag: '🇮🇩', price: 'Rp 6.450', change: 0.78, high: 'Rp 6.500', low: 'Rp 6.400', region: 'INDONESIA', market: 'IDX' },
    { ticker: 'ASII', name: 'Astra International', flag: '🇮🇩', price: 'Rp 5.150', change: 1.18, high: 'Rp 5.200', low: 'Rp 5.075', region: 'INDONESIA', market: 'IDX' },
    // Bonds & Yield
    { ticker: '^TNX', name: 'US Treasury 10Y Yield', flag: '🇺🇸', price: '4.81%', change: -0.82, high: '4.85%', low: '4.78%', region: 'BONDS & YIELD', market: 'US' },
    { ticker: '^TYX', name: 'US Treasury 30Y Yield', flag: '🇺🇸', price: '4.95%', change: -0.45, high: '4.98%', low: '4.92%', region: 'BONDS & YIELD', market: 'US' },
    { ticker: 'ID10YT=RR', name: 'Indonesia 10Y Bond Yield', flag: '🇮🇩', price: '6.78%', change: 0.15, high: '6.82%', low: '6.75%', region: 'BONDS & YIELD', market: 'ID' },
    { ticker: 'TLT', name: 'iShares 20+ Year Treasury', flag: '🇺🇸', price: '$89.40', change: 0.65, high: '$89.90', low: '$88.90', region: 'BONDS & YIELD', market: 'US' },
    // Forex
    { ticker: 'USD/IDR', name: 'US Dollar / Indonesian Rupiah', flag: '🇺🇸/🇮🇩', price: '15.680', change: -0.12, high: '15.720', low: '15.650', region: 'FOREX & CURRENCIES', market: 'FX' },
    { ticker: 'EUR/USD', name: 'Euro / US Dollar', flag: '🇪🇺/🇺🇸', price: '1.0845', change: 0.28, high: '1.0870', low: '1.0820', region: 'FOREX & CURRENCIES', market: 'FX' },
    { ticker: 'USD/JPY', name: 'US Dollar / Japanese Yen', flag: '🇺🇸/🇯🇵', price: '154.20', change: -0.35, high: '154.80', low: '153.90', region: 'FOREX & CURRENCIES', market: 'FX' },
    { ticker: 'SGD/IDR', name: 'Singapore Dollar / Rupiah', flag: '🇸🇬/🇮🇩', price: '11.820', change: 0.08, high: '11.850', low: '11.800', region: 'FOREX & CURRENCIES', market: 'FX' },
  ];

  const filtered = activeRegion === 'ALL' ? assets : assets.filter(a => a.region === activeRegion);

  // Currency Converter State
  const rates = { USD: 1, IDR: 15680, EUR: 0.922, JPY: 154.2, SGD: 1.326, BTC: 0.000015, ETH: 0.00038 };
  const [fromCurr, setFromCurr] = useState('USD');
  const [toCurr, setToCurr] = useState('IDR');
  const [amount, setAmount] = useState(100);

  const convertedValue = ((amount / (rates[fromCurr] || 1)) * (rates[toCurr] || 1)).toLocaleString('id-ID', { maximumFractionDigits: 2 });

  return (
    <div style={{ background: 'var(--bg-panel)', border: 'var(--border-hairline)', padding: '16px', fontFamily: 'var(--font-mono)' }}>
      
      {/* 1. Global Session Clocks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px', marginBottom: '14px' }}>
        {marketSessions.map(s => (
          <div key={s.name} style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{s.flag}</span>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>{s.name}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{s.hours}</div>
              </div>
            </div>
            <span className={'badge ' + (s.isOpen ? 'badge-bull' : 'badge-bear')} style={{ fontSize: '9px' }}>
              {s.isOpen ? 'BUKA 🟢' : 'TUTUP 🔴'}
            </span>
          </div>
        ))}
      </div>

      {/* 2. Region Pills */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {regions.map(r => (
          <button
            key={r}
            onClick={() => setActiveRegion(r)}
            className={'telemetry-btn ' + (activeRegion === r ? 'active' : '')}
            style={{ fontSize: '10px', padding: '4px 10px', fontWeight: '700' }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* 3. Assets Table */}
      <div style={{ overflowX: 'auto', marginBottom: '18px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '8px 10px' }}>INSTRUMEN</th>
              <th style={{ padding: '8px 10px' }}>REGIONAL</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>HARGA TERKINI</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>24H PERUBAHAN</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>RENTANG HARGA (H/L)</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const isUp = item.change >= 0;
              return (
                <tr key={item.ticker} style={{ borderBottom: 'var(--border-hairline)', transition: 'background 0.15s' }}>
                  <td style={{ padding: '8px 10px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{item.flag}</span>
                      <div>
                        <div>{item.ticker}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '400' }}>{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span className="badge" style={{ fontSize: '9px' }}>{item.region}</span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {item.price}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', color: isUp ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                    {isUp ? '+' : ''}{item.change}%
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '10px' }}>
                    {item.low} - {item.high}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <button
                      onClick={() => onSelectTicker && onSelectTicker(item.ticker, item.market === 'IDX' ? 'IDX' : 'GLOBAL')}
                      className="telemetry-btn"
                      style={{ padding: '2px 8px', fontSize: '10px' }}
                    >
                      📈 Chart
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Multi-Currency Quick Converter */}
      <div style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '14px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-orange)', marginBottom: '8px', letterSpacing: '0.04em' }}>
          💱 MULTI-CURRENCY GLOBAL CONVERTER (ZERO-FEE REFERENCE)
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            style={{ width: '120px', padding: '6px 8px', background: 'var(--bg-panel)', border: 'var(--border-hairline)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          />
          <select
            value={fromCurr}
            onChange={e => setFromCurr(e.target.value)}
            style={{ padding: '6px 8px', background: 'var(--bg-panel)', border: 'var(--border-hairline)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          >
            {Object.keys(rates).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>➔</span>
          <select
            value={toCurr}
            onChange={e => setToCurr(e.target.value)}
            style={{ padding: '6px 8px', background: 'var(--bg-panel)', border: 'var(--border-hairline)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          >
            {Object.keys(rates).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-green)', marginLeft: '10px' }}>
            = {convertedValue} {toCurr}
          </div>
        </div>
      </div>

    </div>
  );
}
