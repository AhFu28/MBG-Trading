import React, { useState, useEffect } from 'react';

// Helper to calculate exact timezone time & market status
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
    const weekday = getVal('weekday');
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
    return { hour, minute, second, weekday, timeStr };
  } catch (e) {
    return { hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds(), weekday: 'Mon', timeStr: '--:--:--' };
  }
}

export default function GlobalMarketsTab({ onSelectTicker, macro, bundle, livePrices = {} }) {
  const [activeRegion, setActiveRegion] = useState('ALL');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time 1-second clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const regions = ['ALL', 'MAJOR INDICES', 'COMMODITIES', 'WALL STREET', 'ASIA PACIFIC', 'INDONESIA', 'BONDS & YIELD', 'FOREX & CURRENCIES'];

  // Dynamic real-time status for global exchanges
  const getExchangeStatus = () => {
    // 1. Jakarta (IDX)
    const jkt = getZoneInfo(currentTime, 'Asia/Jakarta');
    const jktMin = jkt.hour * 60 + jkt.minute;
    const isJktWeekend = jkt.weekday === 'Sat' || jkt.weekday === 'Sun';
    let jktOpen = false;
    let jktNote = 'TUTUP 🔴';
    let jktBadge = 'badge-bear';

    if (isJktWeekend) {
      jktNote = 'LIBUR AKHIR PEKAN 🔴';
    } else if (jkt.weekday === 'Fri') {
      if (jktMin < 525) {
        const rem = 525 - jktMin;
        jktNote = `TUTUP (Pra-Buka ${Math.floor(rem / 60)}j ${rem % 60}m) 🔴`;
      } else if (jktMin >= 525 && jktMin < 540) {
        const rem = 540 - jktMin;
        jktNote = `PRA-BUKA (${rem}m) 🟡`;
        jktBadge = 'badge-hold';
      } else if (jktMin >= 540 && jktMin < 690) {
        jktOpen = true; jktNote = 'BUKA (SESI 1) 🟢'; jktBadge = 'badge-bull';
      } else if (jktMin >= 690 && jktMin < 840) {
        const rem = 840 - jktMin;
        jktNote = `ISTIRAHAT JUMAT (${Math.floor(rem / 60)}j ${rem % 60}m) 🟡`;
        jktBadge = 'badge-hold';
      } else if (jktMin >= 840 && jktMin < 950) {
        jktOpen = true; jktNote = 'BUKA (SESI 2) 🟢'; jktBadge = 'badge-bull';
      } else {
        jktNote = 'TUTUP (PASCA BURSA) 🔴';
      }
    } else {
      if (jktMin < 525) {
        const rem = 525 - jktMin;
        jktNote = `TUTUP (Pra-Buka ${Math.floor(rem / 60)}j ${rem % 60}m) 🔴`;
      } else if (jktMin >= 525 && jktMin < 540) {
        const rem = 540 - jktMin;
        jktNote = `PRA-BUKA (${rem}m) 🟡`;
        jktBadge = 'badge-hold';
      } else if (jktMin >= 540 && jktMin < 720) {
        jktOpen = true; jktNote = 'BUKA (SESI 1) 🟢'; jktBadge = 'badge-bull';
      } else if (jktMin >= 720 && jktMin < 810) {
        const rem = 810 - jktMin;
        jktNote = `ISTIRAHAT SIANG (${Math.floor(rem / 60)}j ${rem % 60}m) 🟡`;
        jktBadge = 'badge-hold';
      } else if (jktMin >= 810 && jktMin < 950) {
        jktOpen = true; jktNote = 'BUKA (SESI 2) 🟢'; jktBadge = 'badge-bull';
      } else {
        jktNote = 'TUTUP (PASCA BURSA) 🔴';
      }
    }

    // 2. Tokyo (TSE)
    const tyo = getZoneInfo(currentTime, 'Asia/Tokyo');
    const tyoMin = tyo.hour * 60 + tyo.minute;
    const isTyoWeekend = tyo.weekday === 'Sat' || tyo.weekday === 'Sun';
    let tyoOpen = false;
    let tyoNote = 'TUTUP 🔴';
    let tyoBadge = 'badge-bear';

    if (isTyoWeekend) {
      tyoNote = 'LIBUR AKHIR PEKAN 🔴';
    } else if (tyoMin >= 540 && tyoMin < 690) {
      tyoOpen = true; tyoNote = 'BUKA (SESI 1) 🟢'; tyoBadge = 'badge-bull';
    } else if (tyoMin >= 690 && tyoMin < 750) {
      tyoNote = 'ISTIRAHAT SIANG 🟡'; tyoBadge = 'badge-hold';
    } else if (tyoMin >= 750 && tyoMin < 930) {
      tyoOpen = true; tyoNote = 'BUKA (SESI 2) 🟢'; tyoBadge = 'badge-bull';
    } else {
      tyoNote = 'TUTUP (SESI BERAKHIR) 🔴';
    }

    // 3. London (LSE)
    const lon = getZoneInfo(currentTime, 'Europe/London');
    const lonMin = lon.hour * 60 + lon.minute;
    const isLonWeekend = lon.weekday === 'Sat' || lon.weekday === 'Sun';
    let lonOpen = false;
    let lonNote = 'TUTUP 🔴';
    let lonBadge = 'badge-bear';

    if (isLonWeekend) {
      lonNote = 'LIBUR AKHIR PEKAN 🔴';
    } else if (lonMin >= 480 && lonMin < 990) {
      lonOpen = true; lonNote = 'BUKA (SESI AKTIF) 🟢'; lonBadge = 'badge-bull';
    } else {
      lonNote = 'TUTUP (SESI BERAKHIR) 🔴';
    }

    // 4. New York (NYSE)
    const ny = getZoneInfo(currentTime, 'America/New_York');
    const nyMin = ny.hour * 60 + ny.minute;
    const isNyWeekend = ny.weekday === 'Sat' || ny.weekday === 'Sun';
    let nyOpen = false;
    let nyNote = 'TUTUP 🔴';
    let nyBadge = 'badge-bear';

    if (isNyWeekend) {
      nyNote = 'LIBUR AKHIR PEKAN 🔴';
    } else if (nyMin >= 570 && nyMin < 960) {
      nyOpen = true; nyNote = 'BUKA (SESI AKTIF) 🟢'; nyBadge = 'badge-bull';
    } else if (nyMin >= 240 && nyMin < 570) {
      nyNote = 'PRE-MARKET 🟡'; nyBadge = 'badge-hold';
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

  // Live real data references from bundle macro telemetry
  const liveGoldPrice = macro?.gold_price ? `$${Number(macro.gold_price).toLocaleString()}` : '$2,340.50';
  const liveGoldChange = Number(macro?.gold_change_pct || 0.91);
  const liveBrentPrice = macro?.brent_oil_price || macro?.brent_oil ? `$${Number(macro.brent_oil_price || macro.brent_oil).toFixed(2)}` : '$82.50';
  const liveBrentChange = Number(macro?.brent_oil_change_pct || -0.16);
  const liveDxyVal = macro?.dxy_index ? Number(macro.dxy_index).toFixed(2) : '98.73';
  const liveDxyChange = Number(macro?.dxy_change_pct || -0.04);
  const liveUs10yYield = macro?.us10y_yield ? `${Number(macro.us10y_yield).toFixed(2)}%` : '4.84%';
  const liveIhsg = livePrices['IHSG'] || livePrices['.JKSE'] || livePrices['IDX:COMPOSITE'];
  const liveIhsgPrice = liveIhsg?.price !== undefined 
    ? Number(liveIhsg.price).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : (macro?.ihsg_price || macro?.jkse_price ? Number(macro.ihsg_price || macro.jkse_price).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '6,455.66');
  const liveIhsgChange = liveIhsg?.changePct !== undefined ? Number(liveIhsg.changePct) : (macro?.ihsg_change_pct !== undefined ? Number(macro.ihsg_change_pct) : -0.10);

  // Comprehensive Cross-Market Asset Universe
  const fallbackAssets = [
    // Major World Indices
    { ticker: '^GSPC', name: 'S&P 500 Index', flag: '🇺🇸', price: '5,548.20', change: 0.64, high: '5,562.10', low: '5,520.40', region: 'MAJOR INDICES', market: 'GLOBAL' },
    { ticker: '^IXIC', name: 'Nasdaq Composite', flag: '🇺🇸', price: '17,420.50', change: 1.12, high: '17,490.00', low: '17,310.20', region: 'MAJOR INDICES', market: 'GLOBAL' },
    { ticker: '^N225', name: 'Nikkei 225 (Tokyo)', flag: '🇯🇵', price: '38,720.40', change: 0.85, high: '38,910.00', low: '38,550.00', region: 'MAJOR INDICES', market: 'GLOBAL' },
    { ticker: '^HSI', name: 'Hang Seng Index (HK)', flag: '🇭🇰', price: '17,640.10', change: -0.42, high: '17,790.00', low: '17,580.30', region: 'MAJOR INDICES', market: 'GLOBAL' },
    { ticker: '^FTSE', name: 'FTSE 100 (London)', flag: '🇬🇧', price: '8,280.60', change: 0.28, high: '8,310.00', low: '8,255.40', region: 'MAJOR INDICES', market: 'GLOBAL' },
    { ticker: '^JKSE', name: 'IHSG (Jakarta Composite)', flag: '🇮🇩', price: liveIhsgPrice, change: liveIhsgChange, high: '6,560.80', low: '6,495.10', region: 'MAJOR INDICES', market: 'IDX' },

    // Commodities & Strategic Energy
    { ticker: 'XAU/USD', name: 'Spot Gold Bullion', flag: '🥇', price: liveGoldPrice, change: liveGoldChange, high: '$4,465.00', low: '$4,410.00', region: 'COMMODITIES', market: 'GLOBAL' },
    { ticker: 'BRENT', name: 'Brent Crude Oil (ICE)', flag: '🛢️', price: liveBrentPrice, change: liveBrentChange, high: '$102.50', low: '$99.80', region: 'COMMODITIES', market: 'GLOBAL' },
    { ticker: 'WTI', name: 'WTI Light Sweet Crude', flag: '⛽', price: '$74.15', change: 0.45, high: '$74.90', low: '$73.60', region: 'COMMODITIES', market: 'GLOBAL' },
    { ticker: 'COPPER', name: 'High Grade Copper (COMEX)', flag: '🥉', price: '$4.48', change: 1.25, high: '$4.52', low: '$4.41', region: 'COMMODITIES', market: 'GLOBAL' },
    { ticker: 'CPO', name: 'Malaysian Palm Oil (FCPO)', flag: '🌴', price: 'MYR 3,920', change: 0.62, high: 'MYR 3,950', low: 'MYR 3,890', region: 'COMMODITIES', market: 'GLOBAL' },
    { ticker: 'NICKEL', name: 'LME Nickel Cash', flag: '🪙', price: '$16,240', change: -0.75, high: '$16,450', low: '$16,100', region: 'COMMODITIES', market: 'GLOBAL' },

    // Wall Street Mega-Cap
    { ticker: 'AAPL', name: 'Apple Inc.', flag: '🇺🇸', price: '$178.25', change: 1.45, high: '$179.10', low: '$176.80', region: 'WALL STREET', market: 'US' },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', flag: '🇺🇸', price: '$118.80', change: 3.12, high: '$120.40', low: '$116.50', region: 'WALL STREET', market: 'US' },
    { ticker: 'MSFT', name: 'Microsoft Corp.', flag: '🇺🇸', price: '$424.50', change: 0.85, high: '$426.00', low: '$421.20', region: 'WALL STREET', market: 'US' },
    { ticker: 'TSLA', name: 'Tesla Inc.', flag: '🇺🇸', price: '$210.40', change: -1.82, high: '$215.00', low: '$208.10', region: 'WALL STREET', market: 'US' },

    // Asia Pacific Leaders
    { ticker: '7203.T', name: 'Toyota Motor Corp.', flag: '🇯🇵', price: '¥2,950', change: 0.72, high: '¥2,980', low: '¥2,930', region: 'ASIA PACIFIC', market: 'JP' },
    { ticker: '005930.KS', name: 'Samsung Electronics', flag: '🇰🇷', price: '₩74,200', change: -0.45, high: '₩75,000', low: '₩73,800', region: 'ASIA PACIFIC', market: 'KR' },
    { ticker: '0700.HK', name: 'Tencent Holdings', flag: '🇭🇰', price: 'HK$378.00', change: 1.88, high: 'HK$382.00', low: 'HK$374.00', region: 'ASIA PACIFIC', market: 'HK' },
    { ticker: 'D05.SI', name: 'DBS Group Holdings', flag: '🇸🇬', price: 'S$35.80', change: 0.35, high: 'S$36.00', low: 'S$35.60', region: 'ASIA PACIFIC', market: 'SG' },

    // Indonesia Bluechips
    { ticker: 'BBCA', name: 'Bank Central Asia', flag: '🇮🇩', price: 'Rp 9.250', change: 0.54, high: 'Rp 9.300', low: 'Rp 9.175', region: 'INDONESIA', market: 'IDX' },
    { ticker: 'BBRI', name: 'Bank Rakyat Indonesia', flag: '🇮🇩', price: 'Rp 4.920', change: -1.20, high: 'Rp 4.980', low: 'Rp 4.900', region: 'INDONESIA', market: 'IDX' },
    { ticker: 'BMRI', name: 'Bank Mandiri', flag: '🇮🇩', price: 'Rp 6.450', change: 0.78, high: 'Rp 6.500', low: 'Rp 6.400', region: 'INDONESIA', market: 'IDX' },
    { ticker: 'ASII', name: 'Astra International', flag: '🇮🇩', price: 'Rp 5.150', change: 1.18, high: 'Rp 5.200', low: 'Rp 5.075', region: 'INDONESIA', market: 'IDX' },

    // Bonds & Sovereign Yields
    { ticker: '^TNX', name: 'US Treasury 10Y Yield', flag: '🇺🇸', price: liveUs10yYield, change: -0.82, high: '4.85%', low: '4.78%', region: 'BONDS & YIELD', market: 'US' },
    { ticker: '^TYX', name: 'US Treasury 30Y Yield', flag: '🇺🇸', price: '4.95%', change: -0.45, high: '4.98%', low: '4.92%', region: 'BONDS & YIELD', market: 'US' },
    { ticker: 'ID10YT=RR', name: 'Indonesia 10Y Bond Yield', flag: '🇮🇩', price: '6.78%', change: 0.15, high: '6.82%', low: '6.75%', region: 'BONDS & YIELD', market: 'ID' },
    { ticker: 'TLT', name: 'iShares 20+ Year Treasury', flag: '🇺🇸', price: '$89.40', change: 0.65, high: '$89.90', low: '$88.90', region: 'BONDS & YIELD', market: 'US' },

    // Forex & Major Pairs
    { ticker: 'USD/IDR', name: 'US Dollar / Indonesian Rupiah', flag: '🇺🇸/🇮🇩', price: '15.680', change: -0.12, high: '15.720', low: '15.650', region: 'FOREX & CURRENCIES', market: 'FX' },
    { ticker: 'DXY', name: 'US Dollar Index', flag: '💵', price: liveDxyVal, change: liveDxyChange, high: '99.35', low: '98.45', region: 'FOREX & CURRENCIES', market: 'GLOBAL' },
    { ticker: 'EUR/USD', name: 'Euro / US Dollar', flag: '🇪🇺/🇺🇸', price: '1.0845', change: 0.28, high: '1.0870', low: '1.0820', region: 'FOREX & CURRENCIES', market: 'FX' },
    { ticker: 'USD/JPY', name: 'US Dollar / Japanese Yen', flag: '🇺🇸/🇯🇵', price: '154.20', change: -0.35, high: '154.80', low: '153.90', region: 'FOREX & CURRENCIES', market: 'FX' },
    { ticker: 'SGD/IDR', name: 'Singapore Dollar / Rupiah', flag: '🇸🇬/🇮🇩', price: '11.820', change: 0.08, high: '11.850', low: '11.800', region: 'FOREX & CURRENCIES', market: 'FX' },
  ];

  const assets = bundle?.global_markets?.assets || fallbackAssets;

  const filtered = activeRegion === 'ALL' ? assets : assets.filter(a => a.region === activeRegion);

  // Currency Converter State
  const rates = bundle?.global_markets?.rates || { USD: 1, IDR: 15680, EUR: 0.922, JPY: 154.2, SGD: 1.326, BTC: 0.000015, ETH: 0.00038 };
  const [fromCurr, setFromCurr] = useState('USD');
  const [toCurr, setToCurr] = useState('IDR');
  const [amount, setAmount] = useState(100);

  const convertedValue = ((amount / (rates[fromCurr] || 1)) * (rates[toCurr] || 1)).toLocaleString('id-ID', { maximumFractionDigits: 2 });

  return (
    <div style={{ background: 'var(--bg-panel)', border: 'var(--border-hairline)', padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>
      {!bundle?.global_markets && !macro?.gold_price && <div style={{fontSize:11,color:'#f59e0b',marginBottom:8}}>📊 Showing cached market data — live feed not available</div>}
      {/* 1. Global Session Clocks & Live Master Clock */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '5px 8px', background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }}></span>
          <strong style={{ color: 'var(--text-primary)' }}>SINKRONISASI BURSA GLOBAL REAL-TIME</strong>
          <span style={{ fontSize: '9px' }}>(STATUS PER DETIK)</span>
        </div>
        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent-orange)' }}>
          WIB CLOCK: {jktCurrent.timeStr} WIB
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '6px', marginBottom: '10px' }}>
        {marketSessions.map(s => (
          <div key={s.name} style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>{s.flag}</span>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-primary)' }}>{s.name}</div>
                <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{s.hours}</div>
                <div style={{ fontSize: '9px', color: 'var(--accent-green)', fontWeight: '700', marginTop: '1px' }}>
                  🕒 {s.localTime}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={'badge ' + s.badge} style={{ fontSize: '8px', display: 'inline-block', padding: '2px 5px' }}>
                {s.note}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Macro Barometer HUD & Regional Correlation Snapshot */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '6px',
        marginBottom: '10px'
      }}>
        <div style={{ padding: '6px 10px', background: 'var(--bg-panel-subtle)', borderLeft: '3px solid var(--accent-green)', border: 'var(--border-hairline)' }}>
          <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '800' }}>GOLD SPOT BULLION</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{liveGoldPrice}</span>
            <span style={{ fontSize: '9px', fontWeight: '700', color: liveGoldChange >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
              {liveGoldChange >= 0 ? '+' : ''}{liveGoldChange}%
            </span>
          </div>
          <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>Safe haven / inflation hedge</div>
        </div>

        <div style={{ padding: '6px 10px', background: 'var(--bg-panel-subtle)', borderLeft: '3px solid var(--accent-orange)', border: 'var(--border-hairline)' }}>
          <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '800' }}>BRENT CRUDE OIL</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{liveBrentPrice}</span>
            <span style={{ fontSize: '9px', fontWeight: '700', color: liveBrentChange >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
              {liveBrentChange >= 0 ? '+' : ''}{liveBrentChange}%
            </span>
          </div>
          <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>Middle east supply tension risk</div>
        </div>

        <div style={{ padding: '6px 10px', background: 'var(--bg-panel-subtle)', borderLeft: '3px solid var(--accent-blue)', border: 'var(--border-hairline)' }}>
          <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '800' }}>US DOLLAR INDEX (DXY)</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{liveDxyVal}</span>
            <span style={{ fontSize: '9px', fontWeight: '700', color: liveDxyChange >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
              {liveDxyChange >= 0 ? '+' : ''}{liveDxyChange}%
            </span>
          </div>
          <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>USD global liquidity measure</div>
        </div>

        <div style={{ padding: '6px 10px', background: 'var(--bg-panel-subtle)', borderLeft: '3px solid #ff9500', border: 'var(--border-hairline)' }}>
          <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '800' }}>US 10Y BENCHMARK YIELD</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{liveUs10yYield}</span>
            <span className="badge badge-bull" style={{ fontSize: '7px', padding: '1px 4px' }}>STABLE</span>
          </div>
          <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>Risk-free cost of capital</div>
        </div>
      </div>

      {/* 2b. Bloomberg Intermarket Correlation & Rotation Matrix */}
      <div style={{
        background: 'var(--bg-panel-subtle)',
        border: 'var(--border-hairline)',
        borderRadius: '4px',
        padding: '8px 10px',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px' }}>🔄</span>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
              BLOOMBERG INTERMARKET CORRELATION & ROTATION MATRIX
            </span>
            <span style={{ fontSize: '8px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: '700' }}>
              CROSS-ASSET FLOWS
            </span>
          </div>
          <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
            INSTITUTIONAL RELATIVE PRICING
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '6px'
        }}>
          {/* Matrix Card 1: DXY vs IHSG */}
          <div style={{
            padding: '6px 8px',
            background: 'var(--bg-panel)',
            borderRadius: '3px',
            border: 'var(--border-hairline)',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '8px', fontWeight: '800', color: 'var(--text-primary)' }}>DXY ⇄ IHSG / EM</span>
              <span style={{ fontSize: '7px', padding: '1px 3px', borderRadius: '2px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: '700' }}>
                -0.74 INVERSE
              </span>
            </div>
            <div style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: liveDxyChange >= 0 ? '#ef4444' : 'var(--accent-green)' }}>
              {liveDxyChange >= 0 ? 'DXY ↑ ➔ Tekanan Valas BEI' : 'DXY ↓ ➔ Inflow Asing Terakselerasi'}
            </div>
            <div style={{ fontSize: '8px', color: 'var(--text-muted)', lineHeight: 1.25 }}>
              Dollar menguat memicu repatriasi modal; sebaliknya pelemahan DXY membuka pintu akumulasi BBCA & BBRI.
            </div>
          </div>

          {/* Matrix Card 2: Gold vs Mining */}
          <div style={{
            padding: '6px 8px',
            background: 'var(--bg-panel)',
            borderRadius: '3px',
            border: 'var(--border-hairline)',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '8px', fontWeight: '800', color: 'var(--text-primary)' }}>GOLD ⇄ EMITEN LOGAM</span>
              <span style={{ fontSize: '7px', padding: '1px 3px', borderRadius: '2px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '700' }}>
                +0.85 POSITIVE
              </span>
            </div>
            <div style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: liveGoldChange >= 0 ? 'var(--accent-green)' : '#ef4444' }}>
              {liveGoldChange >= 0 ? 'Gold Rally ➔ Margin ANTM/BRMS' : 'Gold Koreksi ➔ Konsolidasi Mining'}
            </div>
            <div style={{ fontSize: '8px', color: 'var(--text-muted)', lineHeight: 1.25 }}>
              Kenaikan harga spot bullion mengangkat average selling price (ASP) emiten tambang emas & tembaga BEI.
            </div>
          </div>

          {/* Matrix Card 3: Crude Oil vs Energy */}
          <div style={{
            padding: '6px 8px',
            background: 'var(--bg-panel)',
            borderRadius: '3px',
            border: 'var(--border-hairline)',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '8px', fontWeight: '800', color: 'var(--text-primary)' }}>BRENT ⇄ ENERGI & LOGISTIK</span>
              <span style={{ fontSize: '7px', padding: '1px 3px', borderRadius: '2px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: '700' }}>
                +0.82 SECTORIAL
              </span>
            </div>
            <div style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: liveBrentChange >= 0 ? '#f59e0b' : 'var(--accent-green)' }}>
              {liveBrentChange >= 0 ? 'Oil ↑ ➔ MEDC Cuan, Aviasi Tertekan' : 'Oil ↓ ➔ Tekanan Beban BBM Berkurang'}
            </div>
            <div style={{ fontSize: '8px', color: 'var(--text-muted)', lineHeight: 1.25 }}>
              Reli minyak mentah menguntungkan emiten hulu migas (MEDC, ENRG), namun menekan biaya aviasi (GIAA) & logistik.
            </div>
          </div>

          {/* Matrix Card 4: US 10Y Yield vs Tech Multiples */}
          <div style={{
            padding: '6px 8px',
            background: 'var(--bg-panel)',
            borderRadius: '3px',
            border: 'var(--border-hairline)',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '8px', fontWeight: '800', color: 'var(--text-primary)' }}>US 10Y ⇄ TECH / GROWTH</span>
              <span style={{ fontSize: '7px', padding: '1px 3px', borderRadius: '2px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: '700' }}>
                -0.68 DISCOUNT RATE
              </span>
            </div>
            <div style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              Yield {liveUs10yYield} ➔ Cost of Capital
            </div>
            <div style={{ fontSize: '8px', color: 'var(--text-muted)', lineHeight: 1.25 }}>
              Kenaikan risk-free rate menaikkan hurdle rate valuasi saham teknologi dengan ekspektasi cash flow jangka panjang.
            </div>
          </div>

          {/* Matrix Card 5: BTC vs Global M2 Liquidity */}
          <div style={{
            padding: '6px 8px',
            background: 'var(--bg-panel)',
            borderRadius: '3px',
            border: 'var(--border-hairline)',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '8px', fontWeight: '800', color: 'var(--text-primary)' }}>BITCOIN ⇄ GLOBAL LIQUIDITY</span>
              <span style={{ fontSize: '7px', padding: '1px 3px', borderRadius: '2px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '700' }}>
                +0.76 LIQUIDITY SPONGE
              </span>
            </div>
            <div style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)' }}>
              High-Beta Central Bank Proxy
            </div>
            <div style={{ fontSize: '8px', color: 'var(--text-muted)', lineHeight: 1.25 }}>
              Aset paling sensitif terhadap ekspansi neraca bank sentral (M2 global), bergerak sebelum indeks saham merespons.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Region Filter Switcher */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {regions.map(r => (
          <button
            key={r}
            onClick={() => setActiveRegion(r)}
            className={'telemetry-btn ' + (activeRegion === r ? 'active' : '')}
            style={{
              fontSize: '9px',
              padding: '2px 7px',
              fontWeight: activeRegion === r ? '800' : '600',
              background: activeRegion === r ? 'var(--accent-blue)' : 'var(--bg-panel-subtle)',
              color: activeRegion === r ? '#ffffff' : 'var(--text-primary)'
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* 4. Assets & Global Instruments Table */}
      <div style={{ overflowX: 'auto', marginBottom: '10px', maxHeight: '380px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1 }}>
            <tr style={{ background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '5px 8px' }}>INSTRUMEN</th>
              <th style={{ padding: '5px 8px' }}>REGIONAL / SEKTOR</th>
              <th style={{ padding: '5px 8px', textAlign: 'right' }}>HARGA TERKINI</th>
              <th style={{ padding: '5px 8px', textAlign: 'right' }}>24H PERUBAHAN</th>
              <th style={{ padding: '5px 8px', textAlign: 'right' }}>RENTANG (H/L)</th>
              <th style={{ padding: '5px 8px', textAlign: 'center' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const isUp = item.change >= 0;
              return (
                <tr key={item.ticker} style={{ borderBottom: 'var(--border-hairline)', transition: 'background 0.15s' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px' }}>{item.flag}</span>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => onSelectTicker && onSelectTicker(item.ticker, item.market)}>
                          {item.ticker}
                        </div>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '400' }}>{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '5px 8px' }}>
                    <span className="badge" style={{ fontSize: '8px', padding: '1px 4px' }}>{item.region}</span>
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)', fontSize: '11px' }}>
                    {item.price}
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '700', color: isUp ? 'var(--accent-green)' : 'var(--accent-rust)', fontSize: '11px' }}>
                    {isUp ? '+' : ''}{item.change}%
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '9px' }}>
                    {item.low} - {item.high}
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                    <button
                      onClick={() => onSelectTicker && onSelectTicker(item.ticker, item.market === 'IDX' ? 'IDX' : 'GLOBAL')}
                      className="telemetry-btn"
                      style={{ padding: '2px 6px', fontSize: '8px' }}
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

      {/* 5. Cross-Currency & Arbitrage Quick Reference */}
      <div style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent-orange)' }}>
            💱 FX &amp; ARBITRAGE CONVERTER:
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              style={{ width: '80px', padding: '3px 6px', background: 'var(--bg-panel)', border: 'var(--border-hairline)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}
            />
            <select
              value={fromCurr}
              onChange={e => setFromCurr(e.target.value)}
              style={{ padding: '3px 6px', background: 'var(--bg-panel)', border: 'var(--border-hairline)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}
            >
              {Object.keys(rates).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <span style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '10px' }}>➔</span>
            <select
              value={toCurr}
              onChange={e => setToCurr(e.target.value)}
              style={{ padding: '3px 6px', background: 'var(--bg-panel)', border: 'var(--border-hairline)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}
            >
              {Object.keys(rates).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>

        <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
          = {convertedValue} {toCurr}
        </div>
      </div>

    </div>
  );
}
