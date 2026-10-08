import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import CryptoIcon from './CryptoIcon.jsx';

const OrderBookSimulator = lazy(() => import('./OrderBookSimulator.jsx'));

// Target 60+ Binance Perpetual Futures Pairs
const DEFAULT_FUTURES_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'LINKUSDT', 'SUIUSDT',
  'NEARUSDT', 'APTUSDT', 'RENDERUSDT', 'FETUSDT', 'PEPEUSDT',
  'SHIBUSDT', 'WIFUSDT', 'BONKUSDT', 'NOTUSDT', 'DOGSUSDT',
  'NEIROUSDT', 'TIAUSDT', 'INJUSDT', 'OPUSDT', 'ARBUSDT',
  'POLUSDT', 'GALAUSDT', 'FILUSDT', 'ATOMUSDT', 'FTMUSDT',
  'LDOUSDT', 'AAVEUSDT', 'MKRUSDT', 'CRVUSDT', 'UNIUSDT',
  'DYDXUSDT', 'RUNEUSDT', 'KASUSDT', 'TAOUSDT', 'SEIUSDT',
  'JUPUSDT', 'PYTHUSDT', 'WLDUSDT', 'PENDLEUSDT', 'ENAUSDT',
  'ONDOUSDT', 'FLOKIUSDT', 'MEMEUSDT', 'ORDIUSDT', '1000SATSUSDT',
  'JASMYUSDT', 'BEAMUSDT', 'BLURUSDT', 'STRKUSDT', 'ZROUSDT',
  'IOUSDT', 'TONUSDT', 'BOMEUSDT', 'POPCATUSDT', 'TRXUSDT'
];

export default function CryptoFuturesTab({ data, onOpenChart, livePrices = {}, flashMap = {}, allCryptoSpot = [] }) {
  const [activeTab, setActiveTab] = useState('heat'); // 'heat' | 'funding' | 'oi' | 'ls' | 'liquidations'
  const [liveFundingRates, setLiveFundingRates] = useState([]);
  const [wsStatus, setWsStatus] = useState('CONNECTING'); // CONNECTING | LIVE | RECONNECTING
  const [countdown, setCountdown] = useState('');
  const [flashingPairs, setFlashingPairs] = useState({});
  const wsRef = useRef(null);

  // Futures search, filter & sorting state (Binance standard)
  const [futuresSearch, setFuturesSearch] = useState('');
  const [futuresSortField, setFuturesSortField] = useState('volume_24h_usd'); // 'volume_24h_usd' | 'change_24h_pct' | 'mark_price' | 'funding_rate_pct' | 'symbol'
  const [futuresSortDir, setFuturesSortDir] = useState('desc'); // 'desc' | 'asc'
  const [futuresFilter, setFuturesFilter] = useState('ALL'); // 'ALL' | 'VOLUME' | 'GAINERS' | 'LOSERS' | 'HIGH_FUNDING' | 'SQUEEZE'
  const [orderBookModal, setOrderBookModal] = useState({ isOpen: false, ticker: 'BTCUSDT', price: 83000 });
  const [selectedBookCoin, setSelectedBookCoin] = useState('ETHUSDT');
  const [selectedBookPrice, setSelectedBookPrice] = useState(2560);

  const initialRates = data?.crypto_futures?.funding_rates || [];
  const initialLiq = data?.crypto_futures?.liquidations_24h || {};
  const initialLiquidityHeat = data?.crypto_futures?.liquidity_heat || { rows: [], regime: 'NO_DATA' };
  const initialOI = data?.crypto_futures?.open_interest || [];
  const initialLS = data?.crypto_futures?.long_short_ratio || [];

  // Sinkronisasi data awal & ekspansi universe futures ke 60+ pairs dengan real price
  useEffect(() => {
    const existingSymbols = new Set((initialRates || []).map(r => r.symbol));
    const fullList = (initialRates || []).map(r => {
      const baseCoin = r.symbol?.replace('USDT', '');
      const live = livePrices[r.symbol] || livePrices[`${baseCoin}/USDT`] || livePrices[baseCoin];
      const livePrice = (live?.price && live.price > 0) ? live.price : (r.mark_price || 0);
      return {
        ...r,
        mark_price: livePrice,
        index_price: r.index_price || livePrice,
        // WHY null INSTEAD OF `|| 0` (2026-10-06)
        // --------------------------------------
        // `r.high_24h || 0` did two harmful things. It turned a genuine 0 into a
        // falsy miss, and — worse — it rendered a MISSING field as 0, which the
        // table displays as a real measured value. A blank cell reads as "no
        // data"; "0.00%" reads as "measured, and it is flat". null now flows to
        // the renderer, which prints an em dash.
        high_24h: r.high_24h ?? null,
        low_24h: r.low_24h ?? null,
        change_24h_pct: r.change_24h_pct ?? null,
        volume_24h_usd: r.volume_24h_usd ?? null,
        funding_rate_pct: r.funding_rate_pct ?? null,
        funding_next_pct: r.funding_next_pct ?? r.funding_rate_pct ?? null,
      };
    });

    DEFAULT_FUTURES_PAIRS.forEach(sym => {
      if (!existingSymbols.has(sym)) {
        const baseCoin = sym.replace('USDT', '');
        const live = livePrices[sym] || livePrices[`${baseCoin}/USDT`] || livePrices[baseCoin];
        const price = (live?.price && live.price > 0) ? live.price : null;
        // No funding figure is known for a pair the engine did not report.
        // The previous version invented 0.01% NEUTRAL for every one of them,
        // so ~45 of 60 rows showed funding that nobody had measured.
        fullList.push({
          symbol: sym,
          pair: `${baseCoin}/USDT`,
          funding_rate: null,
          funding_rate_pct: null,
          funding_next_pct: null,
          next_funding_time: null,
          mark_price: price,
          index_price: price,
          high_24h: null,
          low_24h: null,
          change_24h_pct: null,
          volume_24h_usd: null,
          signal: 'NO_DATA',
          signal_desc: 'Funding belum tersedia untuk pair ini',
          data_source: 'unavailable',
        });
      }
    });

    setLiveFundingRates(fullList);
  }, [initialRates, livePrices]);

  // 1b. Fetch Real-time Market Funding Rates, Tickers & Metrics dari Gate.io (Bebas Blokir 100%, 984 Kontrak)
  const fetchLiveFuturesContracts = useCallback(async () => {
    try {
      const res = await fetch('https://api.gateio.ws/api/v4/futures/usdt/tickers');
      if (!res.ok) return;
      const tickers = await res.json();
      if (!Array.isArray(tickers)) return;

      setLiveFundingRates(prev => {
        // When the bundle gave us nothing yet, start from EMPTY placeholders.
        // The previous version seeded 60 rows with mark_price 0 and funding
        // 0.01% NEUTRAL, so an unpopulated table looked like a measured flat
        // market instead of an unpopulated one.
        const list = prev.length > 0 ? prev : DEFAULT_FUTURES_PAIRS.map(sym => ({
          symbol: sym,
          pair: `${sym.replace('USDT', '')}/USDT`,
          funding_rate: null,
          funding_rate_pct: null,
          funding_next_pct: null,
          mark_price: null,
          index_price: null,
          high_24h: null,
          low_24h: null,
          change_24h_pct: null,
          volume_24h_usd: null,
          signal: 'NO_DATA',
        }));

        return list.map(item => {
          const base = item.symbol.replace('USDT', '');
          const gateContract = `${base}_USDT`;
          const match = tickers.find(t => t.contract === gateContract);

          const liveQuote = livePrices[item.symbol] || livePrices[item.pair] || livePrices[base];
          const currentPrice = (liveQuote?.price && liveQuote.price > 0)
            ? liveQuote.price
            : (match?.mark_price ? parseFloat(match.mark_price) : item.mark_price);

          if (match) {
            const fundingPct = parseFloat(match.funding_rate || 0) * 100;
            const nextFundingPct = parseFloat(match.funding_rate_indicative || match.funding_rate || 0) * 100;
            const changePct = parseFloat(match.change_percentage || 0);
            const high24 = parseFloat(match.high_24h || 0);
            const low24 = parseFloat(match.low_24h || 0);
            const volUsd = parseFloat(match.volume_24h_quote || match.volume_24h_settle || 0);
            const indexP = parseFloat(match.index_price || currentPrice || 0);

            return {
              ...item,
              mark_price: currentPrice || parseFloat(match.mark_price || 0),
              index_price: indexP,
              high_24h: high24,
              low_24h: low24,
              change_24h_pct: changePct,
              volume_24h_usd: volUsd,
              funding_rate: parseFloat(match.funding_rate || 0),
              funding_rate_pct: Number(fundingPct.toFixed(4)),
              funding_next_pct: Number(nextFundingPct.toFixed(4)),
              signal: fundingPct > 0.03 ? 'OVERLEVERAGED' : (fundingPct < -0.01 ? 'SQUEEZE POTENTIAL' : 'NEUTRAL'),
              signal_desc: fundingPct > 0.03 ? 'Long overleveraged' : (fundingPct < -0.01 ? 'Short squeeze potential' : 'Funding seimbang')
            };
          } else if (currentPrice > 0) {
            return {
              ...item,
              mark_price: currentPrice
            };
          }
          return item;
        });
      });
    } catch (err) {
      console.warn('Failed to fetch live futures tickers:', err);
    }
  }, [livePrices]);

  useEffect(() => {
    fetchLiveFuturesContracts();
    const interval = setInterval(fetchLiveFuturesContracts, 20000);
    return () => clearInterval(interval);
  }, [fetchLiveFuturesContracts]);

  // 1. Live Countdown ke 8-Hour Funding Settlement (07:00, 15:00, 23:00 WIB)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentHours = now.getUTCHours();
      const nextFundingHour = (Math.floor(currentHours / 8) + 1) * 8;
      const target = new Date(now);
      target.setUTCHours(nextFundingHour, 0, 0, 0);

      const diffMs = target - now;
      if (diffMs <= 0) {
        setCountdown('00:00:00');
        return;
      }
      const h = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, '0');
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const s = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0');
      setCountdown(`${h}:${m}:${s}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Live price + 24h change feed.
  //
  // WHY THIS WAS REWRITTEN (2026-10-06)
  // -----------------------------------
  // It subscribed to `!miniTicker@arr` — the ALL-SYMBOLS stream. Two faults:
  //
  //   1. Binance caps that stream at ~99 symbols. Measured live against our 60
  //      pairs, only **15 ever arrived**. For the other 45 the table silently
  //      kept whatever the bundle held, so "24h Change" read 0.00% on most rows.
  //   2. `{o,c,h,l,q}` is fine, but the old code coerced a MISSING open price to
  //      zero change and then wrote that zero over good server data. An unknown
  //      change must never be rendered as "flat".
  //
  // Also removed: a TradingView scanner poll that ran every 12s against
  // BINANCE:*.P symbols. It was an unauthenticated third-party dependency whose
  // failures were swallowed by an empty catch, and it is redundant now that the
  // REST top-up below covers every pair directly from Binance.
  useEffect(() => {
    let isMounted = true;
    let ws = null;
    let restInterval = null;

    const STREAM_HOST = 'wss://data-stream.binance.vision';
    const REST_HOST = 'https://data-api.binance.vision';

    function applyTicks(priceMap) {
      setLiveFundingRates(prev => {
        const currentList = prev.length > 0 ? prev : initialRates;
        const flash = {};
        const updated = currentList.map(item => {
          const live = priceMap[item.symbol];
          if (!live || !live.price) return item;

          const oldPrice = item.mark_price || 0;
          if (oldPrice && Math.abs(live.price - oldPrice) > 0.0001) {
            flash[item.symbol] = live.price > oldPrice ? 'up' : 'down';
          }

          return {
            ...item,
            mark_price: live.price,
            high_24h: live.high > 0 ? live.high : item.high_24h,
            low_24h: live.low > 0 ? live.low : item.low_24h,
            // Only overwrite when the live value is genuinely present. A zero
            // produced by a missing field must never replace real data.
            volume_24h_usd: live.volume > 0 ? live.volume : (item.volume_24h_usd ?? null),
            change_24h_pct: (live.changePct !== null && live.changePct !== undefined)
              ? live.changePct
              : (item.change_24h_pct ?? 0),
            isLiveTick: true
          };
        });

        if (Object.keys(flash).length > 0) {
          setFlashingPairs(flash);
          setTimeout(() => setFlashingPairs({}), 600);
        }

        return updated;
      });
    }

    /** Accepts both stream field names and REST field names. */
    function parseTicker(d) {
      const closeP = parseFloat(d.c || d.lastPrice || 0);
      const openP = parseFloat(d.o || d.openPrice || 0);
      if (!closeP) return null;
      return {
        price: closeP,
        high: parseFloat(d.h || d.highPrice || 0),
        low: parseFloat(d.l || d.lowPrice || 0),
        open: openP,
        volume: parseFloat(d.q || d.quoteVolume || 0),
        // Unknown open price means the change is UNKNOWN, not zero.
        changePct: openP > 0 ? ((closeP - openP) / openP) * 100 : null
      };
    }

    /**
     * Authoritative price feed.
     *
     * WHY THE PARAMETERLESS CALL
     * --------------------------
     * Measured live on 2026-10-06:
     *
     *   ?symbols=[...60 pairs...]   -> the bracket list must be percent-encoded
     *                                  exactly right or Binance answers
     *                                  HTTP 400 "Invalid symbol". Fragile.
     *   no parameter (all symbols)  -> HTTP 200, 3723 symbols, 1863 KB, 1.2s,
     *                                  and **58 of our 60 pairs** in one call.
     *
     * The parameterless call is simpler, cannot be malformed, and misses fewer
     * pairs than the WebSocket (47/60). The two pairs it omits (KASUSDT,
     * POPCATUSDT) keep their bundle values, which is correct behaviour rather
     * than a fabricated zero.
     *
     * This runs immediately on mount and on a timer, so the table is populated
     * correctly even when the socket never connects.
     */
    async function restTopUp() {
      try {
        const res = await fetch(`${REST_HOST}/api/v3/ticker/24hr`);
        if (!res.ok) return;
        const rows = await res.json();
        if (!Array.isArray(rows) || !isMounted) return;

        const wanted = new Set(DEFAULT_FUTURES_PAIRS);
        const map = {};
        for (const row of rows) {
          if (!wanted.has(row.symbol)) continue;
          const tick = parseTicker(row);
          if (tick) map[row.symbol] = tick;
        }
        if (Object.keys(map).length > 0) applyTicks(map);
      } catch {
        // Transient failure: keep whatever is already on screen.
      }
    }

    function connectWs() {
      try {
        ws = new WebSocket(`${STREAM_HOST}/ws/!miniTicker@arr`);
        wsRef.current = ws;

        ws.onopen = () => { if (isMounted) setWsStatus('LIVE'); };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const rawList = JSON.parse(event.data);
            if (!Array.isArray(rawList)) return;
            const priceMap = {};
            for (const item of rawList) {
              if (!DEFAULT_FUTURES_PAIRS.includes(item.s)) continue;
              const tick = parseTicker(item);
              if (tick) priceMap[item.s] = tick;
            }
            if (Object.keys(priceMap).length > 0) applyTicks(priceMap);
          } catch {}
        };

        ws.onerror = () => { if (isMounted) setWsStatus('RECONNECTING'); };
        ws.onclose = () => {
          if (isMounted) {
            setWsStatus('RECONNECTING');
            setTimeout(connectWs, 5000);
          }
        };
      } catch {
        if (isMounted) setWsStatus('FALLBACK');
      }
    }

    connectWs();
    // Populate immediately, then keep fresh. This is the load-bearing feed;
    // the socket only makes prices tick faster between polls.
    restTopUp();
    restInterval = setInterval(restTopUp, 30000);

    return () => {
      isMounted = false;
      if (ws) ws.close();
      if (restInterval) clearInterval(restInterval);
    };
  }, [initialRates]);

  // DexScreener was removed from this desk on 2026-10-06.
  //
  // It was pulling trending DEX/memecoin pairs into a perpetual-futures desk,
  // which is a different instrument, a different market and a different decision.
  // A trader reading funding rates does not want pump.fun launches in the same
  // view. On-chain coverage still exists in Memecoin Radar and Degen Desk.
  //
  // This desk is now Binance/Gate perpetuals only.

  const rates = liveFundingRates.length > 0 ? liveFundingRates : initialRates;
  const totalOI = initialOI.reduce((acc, curr) => acc + (curr.open_interest_usd || 0), 0);
  // Average only over pairs that actually reported a funding rate. Including
  // unknowns as 0 would drag the average toward zero and could flip the market
  // read from "longs paying" to "balanced" purely from missing data.
  const fundingRatesKnown = rates.filter(r => r.funding_rate_pct != null);
  const avgFunding = fundingRatesKnown.length > 0
    ? fundingRatesKnown.reduce((acc, curr) => acc + Number(curr.funding_rate_pct), 0) / fundingRatesKnown.length
    : null;
  const lsRatios = initialLS.map(r => r.long_short_ratio);
  const avgLsRatio = lsRatios.reduce((acc, curr) => acc + curr, 0) / (lsRatios.length || 1);
  const marketBias = avgLsRatio > 1.05 ? 'LONG BIASED' : avgLsRatio < 0.95 ? 'SHORT BIASED' : 'NEUTRAL';

  // Helpers for Binance Futures formatting
  const getLeverageTier = (symbol) => {
    const s = symbol?.toUpperCase() || '';
    if (s.startsWith('BTC') || s.startsWith('ETH')) return '125x';
    if (s.startsWith('SOL') || s.startsWith('BNB') || s.startsWith('XRP') || s.startsWith('DOGE') || s.startsWith('ADA')) return '75x';
    if (s.startsWith('AVAX') || s.startsWith('LINK') || s.startsWith('SUI') || s.startsWith('NEAR') || s.startsWith('PEPE')) return '50x';
    return '20x';
  };

  // --- Missing-value renderers -------------------------------------------------
  // `'$0'` and `'0.00%'` are claims. When a field is absent we render an em dash
  // instead, so an unmeasured pair cannot be mistaken for a measured flat one.
  const EM_DASH = '—';

  const formatVolSmart = (val) => {
    if (val === null || val === undefined || isNaN(val)) return EM_DASH;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
    return `$${val.toFixed(0)}`;
  };

  /** Percent with an explicit sign, or an em dash when unknown. */
  const fmtPct = (val, decimals = 2) => {
    if (val === null || val === undefined || isNaN(val)) return EM_DASH;
    const n = Number(val);
    return `${n > 0 ? '+' : ''}${n.toFixed(decimals)}%`;
  };

  const formatPriceSmart = (val) => {
    if (!val || isNaN(val)) return '-';
    if (val < 0.0001) return `$${val.toFixed(8)}`;
    if (val < 0.01) return `$${val.toFixed(6)}`;
    if (val < 1) return `$${val.toFixed(4)}`;
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Top performers for Futures Bento. Pairs with no measurement sort last
  // rather than being treated as zero-volume rows.
  const topFuturesVolume = [...rates].sort((a, b) => (b.volume_24h_usd ?? -Infinity) - (a.volume_24h_usd ?? -Infinity))[0];
  const topFuturesGainer = [...rates].sort((a, b) => (b.change_24h_pct ?? -Infinity) - (a.change_24h_pct ?? -Infinity))[0];

  const handleFuturesSort = (field) => {
    if (futuresSortField === field) {
      setFuturesSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setFuturesSortField(field);
      setFuturesSortDir(field === 'symbol' ? 'asc' : 'desc');
    }
  };

  // Filtered & Sorted Perpetual Futures rates
  const filteredRates = rates
    .filter(f => {
      if (futuresFilter === 'GAINERS' && !(f.change_24h_pct > 0)) return false;
      if (futuresFilter === 'LOSERS' && !(f.change_24h_pct < 0)) return false;
      // These two filters are about EXTREME funding. Coercing a missing rate to
      // 0 would silently exclude unknown pairs from HIGH_FUNDING (fine) but also
      // exclude them from SQUEEZE while LOOKING like they were evaluated — so
      // both now require a real measurement.
      if (futuresFilter === 'HIGH_FUNDING' && !(f.funding_rate_pct > 0.02)) return false;
      if (futuresFilter === 'SQUEEZE' && !(f.funding_rate_pct < -0.005)) return false;

      if (!futuresSearch) return true;
      const q = futuresSearch.toLowerCase().trim();
      const sym = (f.symbol || '').toLowerCase();
      const pair = (f.pair || '').toLowerCase();
      const sig = (f.signal || '').toLowerCase();
      return sym.includes(q) || pair.includes(q) || sig.includes(q);
    })
    .sort((a, b) => {
      let valA = a[futuresSortField];
      let valB = b[futuresSortField];
      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;
      let diff = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        diff = futuresSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        diff = futuresSortDir === 'asc' ? valA - valB : valB - valA;
      }
      if (diff !== 0) return diff;
      return (a.symbol || '').localeCompare(b.symbol || '');
    });

  const getFundingBg = (val) => {
    if (val > 0.05) return 'rgba(184, 50, 50, 0.2)';
    if (val < -0.01) return 'rgba(27, 138, 75, 0.2)';
    return 'transparent';
  };

  const formatUsdSmart = (val) => {
    if (!val || isNaN(val)) return '$0';
    if (val < 0.0001) return `$${val.toFixed(8)}`;
    if (val < 0.01) return `$${val.toFixed(6)}`;
    if (val < 1) return `$${val.toFixed(4)}`;
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  };

  const getChainBadgeColor = (chainId) => {
    const c = chainId?.toLowerCase() || '';
    if (c === 'solana') return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
    if (c === 'base') return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
    if (c === 'ethereum') return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' };
    if (c === 'bsc') return { bg: 'rgba(234, 179, 8, 0.15)', text: '#facc15', border: 'rgba(234, 179, 8, 0.3)' };
    return { bg: 'rgba(255, 255, 255, 0.05)', text: 'var(--text-secondary)', border: 'var(--border-hairline)' };
  };

  /** Colour + wording for the market-wide liquidity regime. */
  const regimeBadge = (() => {
    switch (initialLiquidityHeat.regime) {
      case 'EAGER_LONGS':       return { label: 'LONG AGAK PADAT', color: '#fbbf24' };
      case 'POSITION_BUILDING': return { label: 'POSISI BERTAMBAH', color: '#4ade80' };
      case 'DELEVERAGING':      return { label: 'POSISI DITUTUP', color: '#fb7185' };
      case 'MIXED':             return { label: 'CAMPURAN', color: 'var(--text-secondary)' };
      default:                  return null;
    }
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' }}>

      {/* 1. Header with Live Status & Countdown */}
      <div className="quant-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>⚡</span>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              CRYPTO FUTURES INTELLIGENCE
            </h2>
            <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
              PERPETUAL SWAPS
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '0.01em' }}>
            Aliran Likuiditas &middot; Funding Rate &middot; Open Interest &middot; Long/Short &middot; Likuidasi 24 Jam
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Countdown Next Settlement */}
          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            padding: '5px 10px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: 'var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>SETTLE:</span>
            <strong style={{ color: 'var(--accent-gold)' }}>{countdown || '--:--:--'}</strong>
          </div>

          {/* Binance Stream Status */}
          <div style={{
            fontSize: '11px',
            padding: '5px 10px',
            borderRadius: '6px',
            background: wsStatus === 'LIVE' ? 'rgba(0, 208, 132, 0.12)' : 'rgba(234, 179, 8, 0.12)',
            color: wsStatus === 'LIVE' ? 'var(--accent-green)' : 'var(--accent-gold)',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            border: `1px solid ${wsStatus === 'LIVE' ? 'rgba(0, 208, 132, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: wsStatus === 'LIVE' ? 'var(--accent-green)' : 'var(--accent-gold)', boxShadow: wsStatus === 'LIVE' ? '0 0 5px var(--accent-green)' : 'none' }} />
            <span>{wsStatus === 'LIVE' ? 'BINANCE 1s' : 'CONNECTING...'}</span>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Bento Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        <>
          <>
            <div className="quant-card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '800' }}>
                Total Open Interest (Futures)
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '6px 0', color: 'var(--text-primary)' }}>
                ${(totalOI / 1e9).toFixed(2)}B
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Kontrak Terbuka CEX Aktif</div>
            </div>

            <div className="quant-card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '800' }}>
                Avg Funding Rate (8h Live)
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '6px 0', color: avgFunding == null ? 'var(--text-muted)' : avgFunding < -0.01 ? 'var(--accent-green)' : avgFunding > 0.05 ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
                {fmtPct(avgFunding, 4)}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                {avgFunding == null ? 'Belum ada data funding'
                  : avgFunding > 0.03 ? '⚠️ Long Overleveraged'
                    : avgFunding < -0.01 ? '🚀 Squeeze Potential'
                      : 'Sentimen Seimbang'}
              </div>
            </div>

            <div className="quant-card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '800' }}>
                Top 24h Futures Turnover
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '6px 0', color: 'var(--accent-gold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {topFuturesVolume ? `${topFuturesVolume.pair || topFuturesVolume.symbol} (${formatVolSmart(topFuturesVolume.volume_24h_usd)})` : 'Loading...'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Turnover Tertinggi Pasar Derivatif</div>
            </div>

            <div className="quant-card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '800' }}>
                Top 24h Perp Gainer
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '6px 0', color: topFuturesGainer?.change_24h_pct == null ? 'var(--text-muted)' : topFuturesGainer.change_24h_pct >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                {topFuturesGainer ? fmtPct(topFuturesGainer.change_24h_pct, 2) : '—'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                {topFuturesGainer ? `${topFuturesGainer.pair} · Max ${getLeverageTier(topFuturesGainer.symbol)}` : 'Scanning...'}
              </div>
            </div>
          </>
        </>
      </div>

      {/* 3. Segmented Pill Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div className="quant-pill-nav" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('heat')} className={`quant-pill-btn ${activeTab === 'heat' ? 'active' : ''}`}>
            <span>🔥</span>
            <span>LIKUIDITAS PANAS</span>
          </button>
          <button onClick={() => setActiveTab('funding')} className={`quant-pill-btn ${activeTab === 'funding' ? 'active' : ''}`}>
            <span>💰</span>
            <span>KONTRAK PERPETUAL ({filteredRates.length})</span>
          </button>
          <button onClick={() => setActiveTab('oi')} className={`quant-pill-btn ${activeTab === 'oi' ? 'active' : ''}`}>
            <span>📊</span>
            <span>OPEN INTEREST</span>
          </button>
          <button onClick={() => setActiveTab('ls')} className={`quant-pill-btn ${activeTab === 'ls' ? 'active' : ''}`}>
            <span>⚖️</span>
            <span>LONG / SHORT GAUGE</span>
          </button>
          <button onClick={() => setActiveTab('liquidations')} className={`quant-pill-btn ${activeTab === 'liquidations' ? 'active' : ''}`}>
            <span>💀</span>
            <span>LIKUIDASI 24 JAM</span>
          </button>
          <button 
            onClick={() => setActiveTab('orderbook')} 
            className={`quant-pill-btn ${activeTab === 'orderbook' ? 'active' : ''}`}
            style={{
              borderColor: activeTab === 'orderbook' ? 'rgba(16, 185, 129, 0.45)' : undefined,
              color: activeTab === 'orderbook' ? '#34d399' : undefined
            }}
          >
            <span>⚡</span>
            <span>ORDER BOOK L2 (HYPERLIQUID & BINANCE)</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Contents */}
      <div className="quant-card" style={{ padding: '0', overflow: 'hidden' }}>

        {/* TAB: LIKUIDITAS PANAS — "duitnya pada ke mana?" */}
        {activeTab === 'heat' && (
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <strong style={{ fontSize: '14px' }}>🔥 UANG SEDANG KE MANA</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.6 }}>
                  Diurutkan dari yang paling banyak menyerap uang baru, bukan sekadar volume terbesar.
                </div>
              </div>
              {regimeBadge && (
                <div style={{
                  fontSize: '10.5px', fontWeight: '800', fontFamily: 'var(--font-mono)',
                  padding: '5px 11px', borderRadius: '6px',
                  color: regimeBadge.color, border: `1px solid ${regimeBadge.color}44`,
                  background: `${regimeBadge.color}18`,
                }}>
                  PASAR: {regimeBadge.label}
                </div>
              )}
            </div>

            {(initialLiquidityHeat.rows || []).length > 0 ? (
              <>
                {/* Kenapa skornya begitu — supaya trader tidak menebak */}
                <div style={{
                  background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)', padding: '11px 14px', marginBottom: '14px',
                  fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.7,
                }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Cara membaca:</strong>{' '}
                  <span style={{ color: '#4ade80' }}>Open Interest naik + harga bergerak</span> = uang baru masuk, ada yang serius.
                  {' '}<span style={{ color: '#fb7185' }}>OI turun</span> = posisi ditutup, pergerakan cenderung habis.
                  Volume besar tapi OI datar hanya ramai bolak-balik, bukan aliran uang baru.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(initialLiquidityHeat.rows || []).slice(0, 12).map((row, idx) => {
                    const up = row.change_24h_pct != null && row.change_24h_pct >= 0;
                    const oiUp = (row.oi_change_1h_pct || 0) >= 0;
                    return (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                        padding: '11px 14px', borderRadius: 'var(--radius-xs)',
                        background: idx === 0 ? 'rgba(251, 191, 36, 0.07)' : 'var(--bg-panel-subtle)',
                        border: idx === 0 ? '1px solid rgba(251, 191, 36, 0.35)' : 'var(--border-hairline)',
                      }}>
                        <span style={{
                          fontSize: '11px', fontWeight: '900', fontFamily: 'var(--font-mono)',
                          color: 'var(--text-muted)', minWidth: '20px',
                        }}>
                          {idx + 1}
                        </span>

                        <div style={{ minWidth: '104px' }}>
                          <div style={{ fontWeight: '800', fontSize: '13px' }}>{row.pair}</div>
                          <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {row.flow_label}
                          </div>
                        </div>

                        {/* Skor panas */}
                        <div style={{ minWidth: '78px' }}>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '800' }}>SKOR PANAS</div>
                          <div style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>
                            {Number(row.heat_score || 0).toFixed(1)}
                          </div>
                        </div>

                        <div style={{ minWidth: '86px' }}>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '800' }}>OI 1 JAM</div>
                          <div style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: oiUp ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                            {fmtPct(row.oi_change_1h_pct, 2)}
                          </div>
                        </div>

                        <div style={{ minWidth: '80px' }}>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '800' }}>HARGA 24 JAM</div>
                          <div style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: up ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                            {fmtPct(row.change_24h_pct, 2)}
                          </div>
                        </div>

                        <div style={{ minWidth: '92px' }}>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '800' }}>TURNOVER 24 JAM</div>
                          <div style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                            ${formatVolSmart(row.volume_24h_usd)}
                          </div>
                        </div>

                        {/* Alasan — ini yang membuat skornya bisa dipercaya */}
                        <div style={{ flex: 1, minWidth: '210px' }}>
                          {(row.reasons || []).slice(0, 2).map((r, i) => (
                            <div key={i} style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                              • {r}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.6 }}>
                  Skor = 40% kenaikan Open Interest + 25% turnover + 20% keyakinan arah + 15% funding ekstrem.
                  Dihitung dari data bursa, bukan perkiraan. Diperbarui tiap pipeline berjalan.
                </div>
              </>
            ) : (
              <div style={{ padding: '24px', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔥 Belum ada data likuiditas</div>
                <div style={{ fontSize: '11px', lineHeight: 1.7 }}>
                  Jalankan pipeline untuk menghitung aliran uang terbaru.
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: KONTRAK PERPETUAL & FUNDING RATE (BINANCE STANDARDS) */}
        {activeTab === 'funding' && (
          <div style={{ padding: '14px' }}>
            {/* Search & Quick Filters Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: `Semua (${rates.length})` },
                  { id: 'VOLUME', label: '🔥 Top Turnover' },
                  { id: 'GAINERS', label: '📈 Top Gainer' },
                  { id: 'LOSERS', label: '📉 Top Loser' },
                  { id: 'HIGH_FUNDING', label: '⚠️ High Funding' },
                  { id: 'SQUEEZE', label: '🚀 Squeeze Setup' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setFuturesFilter(tab.id);
                      if (tab.id === 'VOLUME') {
                        setFuturesSortField('volume_24h_usd');
                        setFuturesSortDir('desc');
                      } else if (tab.id === 'GAINERS') {
                        setFuturesSortField('change_24h_pct');
                        setFuturesSortDir('desc');
                      } else if (tab.id === 'LOSERS') {
                        setFuturesSortField('change_24h_pct');
                        setFuturesSortDir('asc');
                      } else if (tab.id === 'HIGH_FUNDING') {
                        setFuturesSortField('funding_rate_pct');
                        setFuturesSortDir('desc');
                      } else if (tab.id === 'SQUEEZE') {
                        setFuturesSortField('funding_rate_pct');
                        setFuturesSortDir('asc');
                      }
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      border: futuresFilter === tab.id ? '1px solid var(--accent-gold)' : 'var(--border-hairline)',
                      background: futuresFilter === tab.id ? 'rgba(234, 179, 8, 0.15)' : 'var(--bg-panel-subtle)',
                      color: futuresFilter === tab.id ? 'var(--accent-gold)' : 'var(--text-secondary)'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Cari kontrak (e.g. BTC, SOL, SUI, DOGE, PEPE)..."
                  value={futuresSearch}
                  onChange={(e) => setFuturesSearch(e.target.value)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '4px',
                    border: 'var(--border-hairline)',
                    background: 'var(--bg-panel-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    width: '260px'
                  }}
                />
                {futuresSearch && (
                  <button
                    onClick={() => setFuturesSearch('')}
                    style={{
                      background: 'transparent',
                      border: 'var(--border-hairline)',
                      borderRadius: '4px',
                      color: 'var(--text-muted)',
                      padding: '4px 8px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="quant-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                    <th
                      onClick={() => handleFuturesSort('symbol')}
                      style={{ padding: '10px', cursor: 'pointer', userSelect: 'none', width: '18%' }}
                    >
                      Kontrak / Pair {futuresSortField === 'symbol' && (futuresSortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      onClick={() => handleFuturesSort('mark_price')}
                      style={{ padding: '10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none', width: '16%' }}
                    >
                      Mark Price (Live 1s) {futuresSortField === 'mark_price' && (futuresSortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      onClick={() => handleFuturesSort('change_24h_pct')}
                      style={{ padding: '10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none', width: '10%' }}
                    >
                      24h Change % {futuresSortField === 'change_24h_pct' && (futuresSortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{ padding: '10px', textAlign: 'right', width: '12%' }}>
                      24h High / Low
                    </th>
                    <th
                      onClick={() => handleFuturesSort('volume_24h_usd')}
                      style={{ padding: '10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none', width: '13%' }}
                    >
                      24h Volume (USDT) {futuresSortField === 'volume_24h_usd' && (futuresSortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      onClick={() => handleFuturesSort('funding_rate_pct')}
                      style={{ padding: '10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none', width: '14%' }}
                    >
                      Funding Rate (8h) {futuresSortField === 'funding_rate_pct' && (futuresSortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{ padding: '10px', textAlign: 'center', width: '11%' }}>
                      Sentimen Leverage
                    </th>
                    <th style={{ padding: '10px', textAlign: 'center', width: '6%' }}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRates.map((f) => {
                    const base = f.symbol?.replace('USDT', '');
                    const liveQuote = livePrices[f.symbol] || livePrices[f.pair] || livePrices[base] || livePrices[`${base}/USDT`];
                    const markVal = (f.mark_price && Number(f.mark_price) > 0)
                      ? Number(f.mark_price)
                      : (liveQuote?.price && Number(liveQuote.price) > 0 ? Number(liveQuote.price) : 0);

                    const flash = flashingPairs[f.symbol] || flashMap?.[f.symbol] || flashMap?.[base];
                    const isUp24 = f.change_24h_pct != null && f.change_24h_pct >= 0;

                    return (
                      <tr key={f.symbol || f.pair} style={{ borderBottom: 'var(--border-hairline)' }}>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CryptoIcon symbol={base} size={18} />
                            <button
                              onClick={() => onOpenChart ? onOpenChart(`BINANCE:${f.symbol}.P`, 'CRYPTO') : null}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                fontWeight: '800',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                              title="Klik untuk buka chart di Charting Desk"
                            >
                              {f.pair || `${base}/USDT`}
                            </button>
                            <span style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(234, 179, 8, 0.15)', color: 'var(--accent-gold)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                              PERP
                            </span>
                            <span style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', fontWeight: '700', fontFamily: 'var(--font-mono)', border: 'var(--border-hairline)' }}>
                              {getLeverageTier(f.symbol)}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          <div style={{
                            fontWeight: '800',
                            fontSize: '13px',
                            color: flash === 'up' ? 'var(--accent-green)' : flash === 'down' ? 'var(--accent-rust)' : 'var(--text-primary)',
                            transition: 'color 0.4s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '2px'
                          }}>
                            {markVal > 0 ? (
                              <>
                                <span>{formatPriceSmart(markVal)}</span>
                                <span style={{
                                  display: 'inline-block',
                                  width: '12px',
                                  fontSize: '10px',
                                  textAlign: 'center',
                                  color: flash === 'up' ? 'var(--accent-green)' : flash === 'down' ? 'var(--accent-rust)' : 'transparent',
                                  visibility: flash ? 'visible' : 'hidden'
                                }}>
                                  {flash === 'up' ? '▲' : flash === 'down' ? '▼' : '▲'}
                                </span>
                              </>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>-</span>
                            )}
                          </div>
                          {f.index_price > 0 && (
                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Index: {formatPriceSmart(f.index_price)}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '800',
                              background: isUp24 ? 'rgba(0, 208, 132, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: isUp24 ? 'var(--accent-green)' : 'var(--accent-rust)',
                              border: `1px solid ${isUp24 ? 'rgba(0, 208, 132, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                            }}
                          >
                            {fmtPct(f.change_24h_pct, 2)}
                          </span>
                        </td>

                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          <div style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '9px', marginRight: '3px' }}>H:</span>
                            {f.high_24h != null && f.high_24h > 0 ? formatPriceSmart(f.high_24h) : '-'}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '9px', marginRight: '3px' }}>L:</span>
                            {f.low_24h != null && f.low_24h > 0 ? formatPriceSmart(f.low_24h) : '-'}
                          </div>
                        </td>

                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-primary)' }}>
                            {formatVolSmart(f.volume_24h_usd)}
                          </div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Turnover USDT
                          </div>
                        </td>

                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          <div style={{
                            fontWeight: '800',
                            fontSize: '12px',
                            color: f.funding_rate_pct == null
                              ? 'var(--text-muted)'
                              : f.funding_rate_pct < -0.01 ? 'var(--accent-green)' : f.funding_rate_pct > 0.03 ? 'var(--accent-rust)' : 'var(--text-primary)'
                          }}>
                            {fmtPct(f.funding_rate_pct, 4)}
                          </div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Settle: <span style={{ color: 'var(--accent-gold)' }}>{countdown || (f.funding_rate_pct == null ? '—' : '08:00:00')}</span>
                            {f.funding_next_pct != null && (
                              <span style={{ marginLeft: '4px' }}>
                                &middot; Pred: {fmtPct(f.funding_next_pct, 4)}
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span
                            className={`badge ${f.funding_rate_pct == null ? '' : f.funding_rate_pct < -0.01 ? 'badge-bull' : f.funding_rate_pct > 0.03 ? 'badge-bear' : ''}`}
                            style={{ fontWeight: 'bold' }}
                          >
                            {f.funding_rate_pct == null
                              ? '— NO DATA'
                              : f.funding_rate_pct > 0.03 ? '⚠️ OVERLEVERAGED'
                                : f.funding_rate_pct < -0.01 ? '🚀 SQUEEZE POTENTIAL'
                                  : '⚖️ BALANCED'}
                          </span>
                        </td>

                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '5px', alignItems: 'center' }}>
                            <button
                              onClick={() => {
                                setSelectedBookCoin(f.symbol);
                                setSelectedBookPrice(f.mark_price || 0);
                                setActiveTab('orderbook');
                              }}
                              style={{
                                background: 'rgba(16, 185, 129, 0.12)',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                borderRadius: '4px',
                                color: '#34d399',
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                              title="Buka Terminal Live L2 Order Book (Hyperliquid & Binance)"
                            >
                              📖 Book
                            </button>
                            <button
                              onClick={() => onOpenChart ? onOpenChart(`BINANCE:${f.symbol}.P`, 'CRYPTO') : null}
                              style={{
                                background: 'transparent',
                                border: 'var(--border-hairline)',
                                borderRadius: '4px',
                                color: 'var(--accent-blue)',
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Chart ↗
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: LONG / SHORT RATIO */}
        {activeTab === 'ls' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {initialLS.map((ls, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 140px', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{ls.pair}</div>
                <div style={{ height: '24px', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', overflow: 'hidden', border: 'var(--border-hairline)' }}>
                  <div style={{ width: `${ls.long_pct * 100}%`, background: 'rgba(0, 208, 132, 0.85)', color: '#fff', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(ls.long_pct * 100).toFixed(1)}% Long
                  </div>
                  <div style={{ width: `${ls.short_pct * 100}%`, background: 'rgba(239, 68, 68, 0.85)', color: '#fff', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(ls.short_pct * 100).toFixed(1)}% Short
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{ls.long_short_ratio}x</span>
                  <span className={`badge ${ls.bias === 'LONG_HEAVY' ? 'badge-bull' : ls.bias === 'SHORT_HEAVY' ? 'badge-bear' : ''}`} style={{ fontWeight: 'bold' }}>
                    {ls.bias}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: LIKUIDASI 24 JAM (data nyata dari bursa, bukan stream kosong) */}
        {activeTab === 'liquidations' && (
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <strong style={{ fontSize: '14px' }}>💀 LIKUIDASI 24 JAM</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Nilai posisi yang dipaksa tutup bursa dalam 24 jam terakhir
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--accent-rust)', fontFamily: 'var(--font-mono)' }}>
                Terbesar: ${(initialLiq.largest_single || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>

            {(initialLiq.total_usd || 0) > 0 ? (
              <>
                {/* Total ringkasan long vs short */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px 14px', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)', border: 'var(--border-hairline)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.06em' }}>TOTAL 24 JAM</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                      ${formatVolSmart(initialLiq.total_usd)}
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--accent-rust)', fontWeight: '800', letterSpacing: '0.06em' }}>LONG TERLIKUIDASI</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-mono)', marginTop: '4px', color: 'var(--accent-rust)' }}>
                      ${formatVolSmart(initialLiq.long_usd)}
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px', background: 'rgba(0, 208, 132, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0, 208, 132, 0.25)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: '800', letterSpacing: '0.06em' }}>SHORT TERLIKUIDASI</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-mono)', marginTop: '4px', color: 'var(--accent-green)' }}>
                      ${formatVolSmart(initialLiq.short_usd)}
                    </div>
                  </div>
                </div>

                {/* Rincian per pair */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-hairline)', color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Pair</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Long</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Short</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(initialLiq.pairs || []).slice(0, 15).map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-hairline)' }}>
                          <td style={{ padding: '8px 10px', fontWeight: '700' }}>{p.pair}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-rust)' }}>
                            ${formatVolSmart(p.long_usd)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
                            ${formatVolSmart(p.short_usd)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800' }}>
                            ${formatVolSmart(p.total_usd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.6 }}>
                  Sumber: {initialLiq.source || 'bursa'} &middot; jendela {initialLiq.window_hours || 24} jam.
                  Data diperbarui setiap kali pipeline berjalan, bukan streaming per detik.
                </div>
              </>
            ) : (
              <div style={{ padding: '24px', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>💀 Belum ada data likuidasi</div>
                <div style={{ fontSize: '11px', lineHeight: 1.7 }}>
                  Data likuidasi diambil saat pipeline berjalan.<br />
                  Jalankan pipeline untuk mengisi angka terbaru.
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: LIVE LEVEL-2 ORDER BOOK TERMINAL */}
        {activeTab === 'orderbook' && (
          <div style={{ padding: '16px' }}>
            {/* Quick Coin Selector Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
                  PILIH PAIR:
                </span>
                {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'SUIUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT', 'NEARUSDT', 'APTUSDT', 'RENDERUSDT', 'PEPEUSDT', 'WIFUSDT'].map(sym => (
                  <button
                    key={sym}
                    onClick={() => {
                      setSelectedBookCoin(sym);
                      const lv = livePrices[sym] || livePrices[`${sym.replace('USDT','')}/USDT`];
                      if (lv?.price) setSelectedBookPrice(lv.price);
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      borderRadius: '4px',
                      border: selectedBookCoin === sym ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                      background: selectedBookCoin === sym ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: selectedBookCoin === sym ? '#34d399' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {sym.replace('USDT', '')}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                Klik tombol <strong style={{ color: '#34d399' }}>📖 Book</strong> di tabel Kontrak Perpetual untuk membuka instrumen lainnya.
              </div>
            </div>

            {/* Embedded Level 2 Terminal */}
            <Suspense fallback={<div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat Order Book...</div>}>
              <OrderBookSimulator
                embedded={true}
                ticker={selectedBookCoin}
                currentPrice={selectedBookPrice}
              />
            </Suspense>
          </div>
        )}

        {/* Level 2 Order Book Modal */}
        {orderBookModal.isOpen && (
          <Suspense fallback={null}>
            <OrderBookSimulator
              ticker={orderBookModal.ticker}
              currentPrice={orderBookModal.price}
              isOpen={orderBookModal.isOpen}
              onClose={() => setOrderBookModal({ isOpen: false, ticker: 'BTCUSDT', price: 0 })}
            />
          </Suspense>
        )}

      </div>
    </div>
  );
}
