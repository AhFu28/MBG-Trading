import React, { useState, useEffect } from 'react';

// Helper to calculate exact timezone time & market status
function getZoneInfo(date, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
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
    const weekday = getVal('weekday'); // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
    return { hour, minute, second, weekday, timeStr };
  } catch (e) {
    return { hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds(), weekday: 'Mon', timeStr: '--:--:--' };
  }
}

export default function GlobalMarketsTab({ onSelectTicker }) {
  const [activeRegion, setActiveRegion] = useState('ALL');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time 1-second clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const regions = ['ALL', 'WALL STREET', 'ASIA PACIFIC', 'INDONESIA', 'BONDS & YIELD', 'FOREX & CURRENCIES'];

  // Calculate dynamic real-time status for each global exchange
  const getExchangeStatus = () => {
    // 1. Jakarta (IDX) - Asia/Jakarta
    const jkt = getZoneInfo(currentTime, 'Asia/Jakarta');
    const jktMin = jkt.hour * 60 + jkt.minute;
    const isJktWeekend = jkt.weekday === 'Sat' || jkt.weekday === 'Sun';
    let jktOpen = false;
    let jktNote = 'TUTUP 🔴';
    let jktBadge = 'badge-bear';

    if (isJktWeekend) {
      jktNote = 'LIBUR AKHIR PEKAN 🔴';
      jktBadge = 'badge-bear';
    } else if (jkt.weekday === 'Fri') {
      if (jktMin < 540) { // Sebelum 09:00
        const rem = 540 - jktMin;
        jktNote = `PRA-BUKA (Sesi 1 dalam ${Math.floor(rem/60)}j ${rem%60}m) 🟡`;
        jktBadge = 'badge-hold';
      } else if (jktMin >= 540 && jktMin < 690) { // 09:00 - 11:30
        jktOpen = true; jktNote = 'BUKA (SESI 1) 🟢'; jktBadge = 'badge-bull';
      } else if (jktMin >= 690 && jktMin < 840) { // 11:30 - 14:00
        const rem = 840 - jktMin;
        jktNote = `ISTIRAHAT JUMAT (Sesi 2 dlm ${Math.floor(rem/60)}j ${rem%60}m) 🟡`; 
        jktBadge = 'badge-hold';
      } else if (jktMin >= 840 && jktMin < 960) { // 14:00 - 16:00
        jktOpen = true; jktNote = 'BUKA (SESI 2) 🟢'; jktBadge = 'badge-bull';
      } else {
        jktNote = 'TUTUP (PASCA BURSA) 🔴';
        jktBadge = 'badge-bear';
      }
    } else { // Mon - Thu
      if (jktMin < 540) { // Sebelum 09:00
        const rem = 540 - jktMin;
        jktNote = `PRA-BUKA (Sesi 1 dalam ${Math.floor(rem/60)}j ${rem%60}m) 🟡`;
        jktBadge = 'badge-hold';
      } else if (jktMin >= 540 && jktMin < 720) { // 09:00 - 12:00
        jktOpen = true; jktNote = 'BUKA (SESI 1) 🟢'; jktBadge = 'badge-bull';
      } else if (jktMin >= 720 && jktMin < 810) { // 12:00 - 13:30
        const rem = 810 - jktMin;
        jktNote = `ISTIRAHAT SIANG (Sesi 2 dlm ${Math.floor(rem/60)}j ${rem%60}m) 🟡`; 
        jktBadge = 'badge-hold';
      } else if (jktMin >= 810 && jktMin < 960) { // 13:30 - 16:00
        jktOpen = true; jktNote = 'BUKA (SESI 2) 🟢'; jktBadge = 'badge-bull';
      } else {
        jktNote = 'TUTUP (PASCA BURSA) 🔴';
        jktBadge = 'badge-bear';
      }
    }

    // 2. Tokyo (TSE) - Asia/Tokyo
    const tyo = getZoneInfo(currentTime, 'Asia/Tokyo');
    const tyoMin = tyo.hour * 60 + tyo.minute;
    const isTyoWeekend = tyo.weekday === 'Sat' || tyo.weekday === 'Sun';
    let tyoOpen = false;
    let tyoNote = 'TUTUP 🔴';
    let tyoBadge = 'badge-bear';

    if (isTyoWeekend) {
      tyoNote = 'LIBUR AKHIR PEKAN 🔴';
    } else if (tyoMin >= 540 && tyoMin < 690) { // 09:00 - 11:30 JST
      tyoOpen = true; tyoNote = 'BUKA (SESI PAGI) 🟢'; tyoBadge = 'badge-bull';
    } else if (tyoMin >= 690 && tyoMin < 750) { // 11:30 - 12:30 JST
      tyoNote = 'ISTIRAHAT SIANG 🟡'; tyoBadge = 'badge-hold';
    } else if (tyoMin >= 750 && tyoMin < 930) { // 12:30 - 15:30 JST
      tyoOpen = true; tyoNote = 'BUKA (SESI SIANG) 🟢'; tyoBadge = 'badge-bull';
    } else {
      tyoNote = 'TUTUP (SESI BERAKHIR) 🔴';
    }

    // 3. London (LSE) - Europe/London
    const lon = getZoneInfo(currentTime, 'Europe/London');
    const lonMin = lon.hour * 60 + lon.minute;
    const isLonWeekend = lon.weekday === 'Sat' || lon.weekday === 'Sun';
    let lonOpen = false;
    let lonNote = 'TUTUP 🔴';
    let lonBadge = 'badge-bear';

    if (isLonWeekend) {
      lonNote = 'LIBUR AKHIR PEKAN 🔴';
    } else if (lonMin >= 480 && lonMin < 990) { // 08:00 - 16:30 local
      lonOpen = true; lonNote = 'BUKA (SESI AKTIF) 🟢'; lonBadge = 'badge-bull';
    } else {
      lonNote = 'TUTUP (SESI BERAKHIR) 🔴';
    }

    // 4. New York (NYSE) - America/New_York
    const ny = getZoneInfo(currentTime, 'America/New_York');
    const nyMin = ny.hour * 60 + ny.minute;
    const isNyWeekend = ny.weekday === 'Sat' || ny.weekday === 'Sun';
    let nyOpen = false;
    let nyNote = 'TUTUP 🔴';
    let nyBadge = 'badge-bear';

    if (isNyWeekend) {
      nyNote = 'LIBUR AKHIR PEKAN 🔴';
    } else if (nyMin >= 570 && nyMin < 960) { // 09:30 - 16:00 local (20:30 - 03:00 WIB)
      nyOpen = true; nyNote = 'BUKA (SESI AKTIF) 🟢'; nyBadge = 'badge-bull';
    } else if (nyMin >= 240 && nyMin < 570) {
      nyNote = 'PRE-MARKET 🟡'; nyBadge = 'badge-hold';
    } else if (nyMin >= 960 && nyMin < 1200) {
      nyNote = 'AFTER-HOURS 🟡'; nyBadge = 'badge-hold';
    } else {
      nyNote = 'TUTUP (SESI BERAKHIR) 🔴';
    }

    return [
      { name: 'Tokyo (TSE)', flag: '🇯🇵', hours: '07:00 - 13:30 WIB', localTime: `${tyo.timeStr} JST`, isOpen: tyoOpen, note: tyoNote, badge: tyoBadge },
      { name: 'Jakarta (IDX)', flag: '🇮🇩', hours: '09:00 - 16:00 WIB', localTime: `${jkt.timeStr} WIB`, isOpen: jktOpen, note: jktNote, badge: jktBadge },
      { name: 'London (LSE)', flag: '🇬🇧', hours: '14:00 - 22:30 WIB', localTime: `${lon.timeStr} BST`, isOpen: lonOpen, note: lonNote, badge: lonBadge },
      { name: 'New York (NYSE)', flag: '🇺🇸', hours: '20:30 - 03:00 WIB', localTime: `${ny.timeStr} EDT`, isOpen: nyOpen, note: nyNote, badge: nyBadge },
    ];
  };

  const marketSessions = getExchangeStatus();

  const jktCurrent = getZoneInfo(currentTime, 'Asia/Jakarta');

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
      
      {/* 1. Global Session Clocks & Live Master Clock */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '6px 10px', background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }}></span>
          <strong style={{ color: 'var(--text-primary)' }}>SINKRONISASI BURSA GLOBAL REAL-TIME</strong>
          <span>(STATUS BERUBAH OTOMATIS PER DETIK)</span>
        </div>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-orange)' }}>
          WIB CLOCK: {jktCurrent.timeStr} WIB
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '8px', marginBottom: '14px' }}>
        {marketSessions.map(s => (
          <div key={s.name} style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>{s.flag}</span>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>{s.name}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{s.hours}</div>
                <div style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: '700', marginTop: '2px' }}>
                  🕒 {s.localTime}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={'badge ' + s.badge} style={{ fontSize: '9px', display: 'inline-block', padding: '3px 6px' }}>
                {s.note}
              </span>
            </div>
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
