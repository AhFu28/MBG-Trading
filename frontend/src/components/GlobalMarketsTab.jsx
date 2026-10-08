import React, { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Instrument universe. These are NAMES, not prices.
//
// The previous version of this file paired each instrument with a hardcoded
// price that rendered whenever the live feed was missing — which was always,
// because it read a bundle key that does not exist. A name is safe to hardcode;
// a price never is.
// ---------------------------------------------------------------------------
const IDX_TICKERS = [
  { ticker: 'BBCA', name: 'Bank Central Asia' },
  { ticker: 'BBRI', name: 'Bank Rakyat Indonesia' },
  { ticker: 'BMRI', name: 'Bank Mandiri' },
  { ticker: 'ASII', name: 'Astra International' },
];

const US_TICKERS = [
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.' },
  { ticker: 'MSFT', name: 'Microsoft Corp.' },
  { ticker: 'TSLA', name: 'Tesla Inc.' },
];

const FX_TICKERS = [
  { ticker: 'EUR/USD', key: 'EURUSD', name: 'Euro / US Dollar', flag: '🇪🇺', decimals: 4 },
  { ticker: 'USD/JPY', key: 'USDJPY', name: 'US Dollar / Japanese Yen', flag: '🇺🇸', decimals: 2 },
  { ticker: 'GBP/USD', key: 'GBPUSD', name: 'British Pound / US Dollar', flag: '🇬🇧', decimals: 4 },
  { ticker: 'AUD/USD', key: 'AUDUSD', name: 'Australian Dollar / US Dollar', flag: '🇦🇺', decimals: 4 },
];

// Real rows produced by ForexScanner (TVC:GOLD, TVC:SILVER, FX:USOIL, ...).
const MACRO_TICKERS = [
  { ticker: 'XAU/USD', name: 'Spot Gold Bullion', flag: '🥇', region: 'COMMODITIES' },
  { ticker: 'XAG/USD', name: 'Spot Silver', flag: '🥈', region: 'COMMODITIES' },
  { ticker: 'USOIL', name: 'WTI Light Sweet Crude', flag: '⛽', region: 'COMMODITIES' },
  { ticker: 'UKOIL', name: 'Brent Crude Oil (ICE)', flag: '🛢️', region: 'COMMODITIES' },
  { ticker: 'DXY', name: 'US Dollar Index', flag: '💵', region: 'FOREX & CURRENCIES' },
];

/**
 * Return a display-ready quote, or explicit blanks when there is no live price.
 *
 * `price: null` is the signal the table uses to render "—". Returning a
 * plausible number here is exactly the bug this whole file had.
 */
function liveQuote(livePrices, key) {
  const q = livePrices?.[key];
  const price = q && Number.isFinite(Number(q.price)) && Number(q.price) > 0 ? Number(q.price) : null;
  const change = q && Number.isFinite(Number(q.changePct)) ? Number(q.changePct) : null;
  return { price, change, isLive: price !== null };
}

// Currencies the converter may offer. A currency with no live rate is omitted
// rather than converted at an invented one.
const CURRENCIES_WITH_FEED = ['IDR', 'EUR', 'JPY', 'GBP', 'AUD', 'SGD'];

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

  // Live macro quotes.
  //
  // The previous version ended every chain with a hardcoded literal —
  // `|| 4262.00` for gold, `'$103.03'` for Brent, `99.39` for WTI, `'100.22'`
  // for DXY, `'4.84%'` for the 10Y, `'6,455.66'` for the IHSG. A plausible
  // number is worse than a blank: a trader cannot tell it from a real quote.
  // These now return null and the UI renders "—".
  const pick = (...keys) => {
    for (const k of keys) {
      const q = livePrices?.[k];
      if (q && Number.isFinite(Number(q.price)) && Number(q.price) > 0) return q;
    }
    return null;
  };

  const fmtMoney = (v, decimals = 2) =>
    v === null ? '—' : `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

  // --- Gold ---
  const liveGold = pick('GOLD', 'XAUUSD', 'XAU/USD', 'TVC:GOLD');
  const goldRaw = liveGold ? Number(liveGold.price) : (Number.isFinite(Number(macro?.gold_price)) ? Number(macro.gold_price) : null);
  // Sanity bounds ($1,000-$10,000) reject bad ticks. Outside the band we report
  // nothing rather than a fallback that looks like a real bullion price.
  const liveGoldVal = goldRaw !== null && goldRaw >= 1000 && goldRaw <= 10000 ? goldRaw : null;
  const liveGoldPrice = liveGoldVal === null
    ? '—'
    : `$${liveGoldVal >= 1000 ? Math.round(liveGoldVal).toLocaleString('en-US') : liveGoldVal.toFixed(2)}`;
  const liveGoldChange = liveGold && Number.isFinite(Number(liveGold.changePct))
    ? Number(liveGold.changePct)
    : (Number.isFinite(Number(macro?.gold_change_pct)) ? Number(macro.gold_change_pct) : null);

  // --- Brent ---
  const liveBrent = pick('BRENT', 'UKOIL', 'FX:UKOIL');
  const brentVal = liveBrent ? Number(liveBrent.price)
    : (Number.isFinite(Number(macro?.brent_oil_price)) ? Number(macro.brent_oil_price)
      : (Number.isFinite(Number(macro?.brent_oil)) ? Number(macro.brent_oil) : null));
  const liveBrentPrice = fmtMoney(brentVal);
  const liveBrentChange = liveBrent && Number.isFinite(Number(liveBrent.changePct))
    ? Number(liveBrent.changePct)
    : (Number.isFinite(Number(macro?.brent_oil_change_pct)) ? Number(macro.brent_oil_change_pct) : null);

  // --- WTI ---
  const liveWti = pick('WTI', 'USOIL', 'FX:USOIL');
  const wtiVal = liveWti ? Number(liveWti.price) : null;
  const liveWtiPrice = fmtMoney(wtiVal);
  const liveWtiChange = liveWti && Number.isFinite(Number(liveWti.changePct)) ? Number(liveWti.changePct) : null;

  // --- Dollar index ---
  const liveDxy = pick('DXY', 'TVC:DXY');
  const dxyVal = liveDxy ? Number(liveDxy.price)
    : (Number.isFinite(Number(macro?.dxy_index)) ? Number(macro.dxy_index) : null);
  const liveDxyVal = dxyVal === null ? '—' : dxyVal.toFixed(2);
  const liveDxyChange = liveDxy && Number.isFinite(Number(liveDxy.changePct))
    ? Number(liveDxy.changePct)
    : (Number.isFinite(Number(macro?.dxy_change_pct)) ? Number(macro.dxy_change_pct) : null);

  // --- US 10Y yield: no live source is wired yet, so report nothing ---
  const liveUs10yYield = Number.isFinite(Number(macro?.us10y_yield))
    ? `${Number(macro.us10y_yield).toFixed(2)}%`
    : '—';

  // --- IHSG ---
  const liveIhsg = pick('IHSG', '.JKSE', 'IDX:COMPOSITE');
  const ihsgRaw = liveIhsg ? Number(liveIhsg.price)
    : (Number.isFinite(Number(macro?.ihsg_price)) ? Number(macro.ihsg_price)
      : (Number.isFinite(Number(macro?.jkse_price)) ? Number(macro.jkse_price) : null));
  const liveIhsgPrice = ihsgRaw === null
    ? '—'
    : ihsgRaw.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const liveIhsgChange = liveIhsg && Number.isFinite(Number(liveIhsg.changePct))
    ? Number(liveIhsg.changePct)
    : (Number.isFinite(Number(macro?.ihsg_change_pct)) ? Number(macro.ihsg_change_pct) : null);

  // Cross-market universe.
  //
  // WHY THE HARDCODED PRICES ARE GONE (2026-10-06)
  // ----------------------------------------------
  // This table read `bundle?.global_markets?.assets`, and `global_markets` is
  // NOT a key in the cockpit bundle. So the `||` always won and 30 hardcoded
  // prices rendered as live quotes — S&P 5,548.20, Nasdaq 17,420.50, Nikkei
  // 38,720.40, Toyota ¥2,950, Samsung ₩74,200, all of them. Nothing on screen
  // said these were stale.
  //
  // A quote with no live price now shows "—" instead of a plausible number.
  // That is the whole point: a blank is honest, a wrong price is a trade.
  //
  // ponytail: only instruments we actually have a live feed for are listed.
  // Add indices/commodities here once a fetcher supplies them.
  const assets = [
    // --- Indonesia: live from the IDX feed ---
    ...IDX_TICKERS.map(t => ({
      ticker: t.ticker, name: t.name, flag: '🇮🇩', region: 'INDONESIA', market: 'IDX',
      ...liveQuote(livePrices, t.ticker),
    })),

    // --- Wall Street: live from the US feed ---
    ...US_TICKERS.map(t => ({
      ticker: t.ticker, name: t.name, flag: '🇺🇸', region: 'WALL STREET', market: 'US',
      ...liveQuote(livePrices, t.ticker),
    })),

    // --- Forex: live from the TradingView scanner ---
    ...FX_TICKERS.map(t => ({
      ticker: t.ticker, name: t.name, flag: t.flag, region: 'FOREX & CURRENCIES', market: 'FX',
      ...liveQuote(livePrices, t.key),
      decimalHint: t.decimals,
    })),

    // --- Commodities & index: live from the ForexScanner metals feed ---
    ...MACRO_TICKERS.map(t => ({
      ticker: t.ticker, name: t.name, flag: t.flag, region: t.region, market: 'GLOBAL',
      ...liveQuote(livePrices, t.ticker),
      percent: true,
    })),
  ];

  const filtered = activeRegion === 'ALL' ? assets : assets.filter(a => a.region === activeRegion);

  // Currency Converter State
  //
  // Rates come from the live FX feed where available. The previous hardcoded
  // table (IDR 15680, EUR 0.922, JPY 154.2, SGD 1.326) was read from a bundle
  // key that does not exist, so every conversion was computed from invented
  // rates with no indication. Currencies with no live quote are now simply not
  // offered.
  const [fromCurr, setFromCurr] = useState('USD');
  const [toCurr, setToCurr] = useState('IDR');
  const [amount, setAmount] = useState(100);

  // USD-based rates derived from the live FX quotes. USD is the unit (1.0).
  // Only pairs we actually receive are exposed — no invented fallbacks.
  const liveRates = (() => {
    const out = { USD: 1 };
    const usdIdr = livePrices?.['USDIDR']?.price;
    if (Number.isFinite(Number(usdIdr)) && Number(usdIdr) > 0) out.IDR = Number(usdIdr);

    // EUR/USD, GBP/USD, AUD/USD are quoted as USD per unit; invert for value in USD.
    for (const [code, key] of [['EUR', 'EURUSD'], ['GBP', 'GBPUSD'], ['AUD', 'AUDUSD']]) {
      const p = Number(livePrices?.[key]?.price);
      if (Number.isFinite(p) && p > 0) out[code] = 1 / p;
    }
    // USD/JPY and USD/SGD are USD per unit already.
    for (const [code, key] of [['JPY', 'USDJPY'], ['SGD', 'USDSGD']]) {
      const p = Number(livePrices?.[key]?.price);
      if (Number.isFinite(p) && p > 0) out[code] = p;
    }
    return out;
  })();

  const converterCurrencies = ['USD', ...CURRENCIES_WITH_FEED.filter(c => liveRates[c])];
  const convertedValue = (liveRates[fromCurr] && liveRates[toCurr])
    ? ((amount / liveRates[fromCurr]) * liveRates[toCurr]).toLocaleString('id-ID', { maximumFractionDigits: 2 })
    : null;

  return (
    <div style={{ background: 'var(--bg-panel)', border: 'var(--border-hairline)', padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>
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
            <span style={{ fontSize: '8px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-sky-soft)', fontWeight: '700' }}>
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
              <span style={{ fontSize: '7px', padding: '1px 3px', borderRadius: '2px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', fontWeight: '700' }}>
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
              <span style={{ fontSize: '7px', padding: '1px 3px', borderRadius: '2px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-sky-soft)', fontWeight: '700' }}>
                +0.82 SECTORIAL
              </span>
            </div>
            <div style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: liveBrentChange >= 0 ? 'var(--accent-gold)' : 'var(--accent-green)' }}>
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
              <span style={{ fontSize: '7px', padding: '1px 3px', borderRadius: '2px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', fontWeight: '700' }}>
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
              // A missing quote is rendered as an em dash, never as a number.
              // The colour is deliberately neutral for no-data rows so a blank
              // cannot be misread as a flat (unchanged) price.
              const hasPrice = item.price !== null && item.price !== undefined;
              const hasChange = item.change !== null && item.change !== undefined;
              const isUp = hasChange && item.change >= 0;
              const priceText = hasPrice
                ? (item.percent
                  ? `${Number(item.price).toFixed(2)}%`
                  : item.market === 'IDX'
                    ? `Rp ${Number(item.price).toLocaleString('id-ID')}`
                    : Number(item.price).toLocaleString('en-US', {
                      minimumFractionDigits: item.decimalHint ?? (Number(item.price) < 10 ? 4 : 2),
                      maximumFractionDigits: item.decimalHint ?? (Number(item.price) < 10 ? 4 : 2),
                    }))
                : '—';
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
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '700', fontSize: '11px', color: hasPrice ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {priceText}
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '700', fontSize: '11px', color: !hasChange ? 'var(--text-muted)' : (isUp ? 'var(--accent-green)' : 'var(--accent-rust)') }}>
                    {hasChange ? `${isUp ? '+' : ''}${Number(item.change).toFixed(2)}%` : '—'}
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '9px' }}>
                    {hasPrice ? 'live' : 'tidak ada feed'}
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
              {converterCurrencies.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <span style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '10px' }}>➔</span>
            <select
              value={toCurr}
              onChange={e => setToCurr(e.target.value)}
              style={{ padding: '3px 6px', background: 'var(--bg-panel)', border: 'var(--border-hairline)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}
            >
              {converterCurrencies.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>

        <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
          = {convertedValue ?? '—'} {convertedValue ? toCurr : ''}
        </div>
      </div>

    </div>
  );
}
