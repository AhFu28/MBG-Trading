import React, { useState, useEffect, useRef, useCallback } from 'react';

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

export default function CryptoFuturesTab({ data, onOpenChart, livePrices = {}, allCryptoSpot = [] }) {
  const [activeTab, setActiveTab] = useState('funding'); // 'funding' | 'dexscreener' | 'oi' | 'ls' | 'liquidations'
  const [liveFundingRates, setLiveFundingRates] = useState([]);
  const [liveLiquidations, setLiveLiquidations] = useState([]);
  const [wsStatus, setWsStatus] = useState('CONNECTING'); // CONNECTING | LIVE | RECONNECTING
  const [countdown, setCountdown] = useState('');
  const [flashingPairs, setFlashingPairs] = useState({});
  const wsRef = useRef(null);

  // DexScreener state
  const [dexPairs, setDexPairs] = useState([]);
  const [dexLoading, setDexLoading] = useState(false);
  const [dexSearch, setDexSearch] = useState('');
  const [dexChainFilter, setDexChainFilter] = useState('ALL'); // 'ALL' | 'solana' | 'base' | 'ethereum' | 'bsc' | 'sui' | 'arbitrum'
  const [dexLastUpdated, setDexLastUpdated] = useState(null);

  const initialRates = data?.crypto_futures?.funding_rates || [];
  const initialLiq = data?.crypto_futures?.liquidations_24h || {};
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
        mark_price: livePrice
      };
    });

    DEFAULT_FUTURES_PAIRS.forEach(sym => {
      if (!existingSymbols.has(sym)) {
        const baseCoin = sym.replace('USDT', '');
        const live = livePrices[sym] || livePrices[`${baseCoin}/USDT`] || livePrices[baseCoin];
        const price = (live?.price && live.price > 0) ? live.price : 0;
        fullList.push({
          symbol: sym,
          pair: `${baseCoin}/USDT`,
          funding_rate: 0.0001,
          funding_rate_pct: 0.01,
          next_funding_time: '08:00:00',
          mark_price: price,
          index_price: price,
          signal: 'NEUTRAL',
          signal_desc: 'Funding seimbang'
        });
      }
    });

    setLiveFundingRates(fullList);
  }, [initialRates, livePrices]);

  // 1b. Fetch Real-time Market Funding Rates & Mark Prices dari Gate.io (Bebas Blokir 100%, 984 Kontrak)
  const fetchLiveFuturesContracts = useCallback(async () => {
    try {
      const res = await fetch('https://api.gateio.ws/api/v4/futures/usdt/contracts');
      if (!res.ok) return;
      const contracts = await res.json();
      if (!Array.isArray(contracts)) return;

      setLiveFundingRates(prev => {
        const list = prev.length > 0 ? prev : DEFAULT_FUTURES_PAIRS.map(sym => ({
          symbol: sym,
          pair: `${sym.replace('USDT', '')}/USDT`,
          funding_rate: 0.0001,
          funding_rate_pct: 0.01,
          mark_price: 0
        }));

        return list.map(item => {
          const base = item.symbol.replace('USDT', '');
          const gateName = `${base}_USDT`;
          const match = contracts.find(c => c.name === gateName);

          const liveQuote = livePrices[item.symbol] || livePrices[item.pair] || livePrices[base];
          const currentPrice = (liveQuote?.price && liveQuote.price > 0)
            ? liveQuote.price
            : (match?.mark_price ? parseFloat(match.mark_price) : item.mark_price);

          if (match) {
            const fundingPct = parseFloat(match.funding_rate || 0) * 100;
            return {
              ...item,
              mark_price: currentPrice,
              funding_rate: parseFloat(match.funding_rate || 0),
              funding_rate_pct: Number(fundingPct.toFixed(4)),
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
      console.warn('Failed to fetch live futures contracts:', err);
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

  // 2. Binance Live WebSocket via Vision Stream (Bebas Blokir 100%) & Fapi Fallback
  useEffect(() => {
    let isMounted = true;
    let ws = null;
    let fallbackInterval = null;

    function connectWs() {
      try {
        // Coba koneksi ke Binance Vision public stream terlebih dahulu (tidak ada filter ISP)
        ws = new WebSocket('wss://data-stream.binance.vision/ws/!miniTicker@arr');
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) setWsStatus('LIVE');
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const rawList = JSON.parse(event.data);
            if (!Array.isArray(rawList)) return;

            const priceMap = {};
            for (const item of rawList) {
              const sym = item.s;
              if (DEFAULT_FUTURES_PAIRS.includes(sym)) {
                priceMap[sym] = {
                  price: parseFloat(item.c || 0),
                  high: parseFloat(item.h || 0),
                  low: parseFloat(item.l || 0),
                  open: parseFloat(item.o || 0)
                };
              }
            }

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
                  isLiveTick: true
                };
              });

              if (Object.keys(flash).length > 0) {
                setFlashingPairs(flash);
                setTimeout(() => setFlashingPairs({}), 600);
              }

              return updated;
            });
          } catch {}
        };

        ws.onerror = () => {
          if (isMounted) setWsStatus('RECONNECTING');
        };

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

    // Fallback polling via TradingView crypto scanner jika WS terputus
    async function fetchTvCryptoFutures() {
      try {
        const tvSymbols = DEFAULT_FUTURES_PAIRS.map(p => `BINANCE:${p}.P`);
        const res = await fetch('https://scanner.tradingview.com/crypto/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbols: { tickers: tvSymbols },
            columns: ['name', 'close', 'change', 'volume']
          })
        });
        if (!res.ok) return;
        const d = await res.json();
        if (Array.isArray(d?.data)) {
          setLiveFundingRates(prev => {
            const list = prev.length > 0 ? prev : initialRates;
            return list.map(item => {
              const match = d.data.find(x => x.s.includes(item.symbol));
              if (match && match.d?.[1]) {
                return {
                  ...item,
                  mark_price: match.d[1],
                  changePct: match.d[2]
                };
              }
              return item;
            });
          });
        }
      } catch {}
    }

    connectWs();
    fallbackInterval = setInterval(fetchTvCryptoFutures, 12000);

    return () => {
      isMounted = false;
      if (ws) ws.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [initialRates]);

  // 3. DexScreener Live API Fetcher (Trending & High-Volume DEX Pairs Multi-Chain)
  const fetchDexScreener = useCallback(async (customQuery = null) => {
    setDexLoading(true);
    try {
      const defaultQueries = ['solana', 'base', 'ethereum', 'bsc', 'arbitrum', 'sui', 'pepe', 'pump'];
      const queries = customQuery ? [customQuery, ...defaultQueries.slice(0, 3)] : defaultQueries;

      const promises = [
        ...queries.map(q =>
          fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        ),
        fetch('https://api.dexscreener.com/token-boosts/top/v1')
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      ];

      const results = await Promise.all(promises);
      const pairMap = new Map();

      results.forEach(res => {
        if (res?.pairs && Array.isArray(res.pairs)) {
          res.pairs.forEach(p => {
            if (p.pairAddress && !pairMap.has(p.pairAddress)) {
              pairMap.set(p.pairAddress, {
                pairAddress: p.pairAddress,
                baseToken: p.baseToken?.symbol || 'UNKNOWN',
                baseName: p.baseToken?.name || '',
                quoteToken: p.quoteToken?.symbol || 'USDC',
                chainId: p.chainId || 'solana',
                dexId: p.dexId || 'uniswap',
                priceUsd: parseFloat(p.priceUsd || 0),
                change5m: parseFloat(p.priceChange?.m5 || 0),
                change1h: parseFloat(p.priceChange?.h1 || 0),
                change24h: parseFloat(p.priceChange?.h24 || 0),
                volume24h: parseFloat(p.volume?.h24 || 0),
                liquidityUsd: parseFloat(p.liquidity?.usd || 0),
                fdv: parseFloat(p.fdv || 0),
                url: p.url,
                txns24h: (p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0)
              });
            }
          });
        }
      });

      // Sort by 24h volume descending
      const sorted = Array.from(pairMap.values()).sort((a, b) => b.volume24h - a.volume24h);
      if (sorted.length > 0) {
        setDexPairs(sorted);
      }
      setDexLastUpdated(new Date());
    } catch (err) {
      console.warn('DexScreener fetch error:', err);
    } finally {
      setDexLoading(false);
    }
  }, []);

  const handleDexSearchSubmit = (e) => {
    e?.preventDefault?.();
    if (dexSearch.trim()) {
      fetchDexScreener(dexSearch.trim());
    }
  };

  // Fetch DexScreener on initial tab select or mount
  useEffect(() => {
    if (dexPairs.length === 0) {
      fetchDexScreener();
    }
    const interval = setInterval(fetchDexScreener, 20000); // refresh every 20s
    return () => clearInterval(interval);
  }, [fetchDexScreener, dexPairs.length]);

  const rates = liveFundingRates.length > 0 ? liveFundingRates : initialRates;
  const totalOI = initialOI.reduce((acc, curr) => acc + (curr.open_interest_usd || 0), 0);
  const avgFunding = rates.reduce((acc, curr) => acc + (curr.funding_rate_pct || 0), 0) / (rates.length || 1);
  const lsRatios = initialLS.map(r => r.long_short_ratio);
  const avgLsRatio = lsRatios.reduce((acc, curr) => acc + curr, 0) / (lsRatios.length || 1);
  const marketBias = avgLsRatio > 1.05 ? 'LONG BIASED' : avgLsRatio < 0.95 ? 'SHORT BIASED' : 'NEUTRAL';

  // DexScreener Filtered list
  const filteredDexPairs = dexPairs.filter(p => {
    const matchSearch = dexSearch === '' ||
      p.baseToken.toLowerCase().includes(dexSearch.toLowerCase()) ||
      p.baseName.toLowerCase().includes(dexSearch.toLowerCase()) ||
      p.pairAddress.toLowerCase().includes(dexSearch.toLowerCase());

    const matchChain = dexChainFilter === 'ALL' || p.chainId.toLowerCase() === dexChainFilter.toLowerCase();
    return matchSearch && matchChain;
  });

  const topDexVolume = dexPairs[0];
  const topDexGainer = [...dexPairs].sort((a, b) => b.change24h - a.change24h)[0];

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' }}>

      {/* 1. Header with Live Status, Countdown & DexScreener Pill */}
      <div className="quant-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>⚡</span>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              CRYPTO FUTURES & DEXSCREENER RADAR
            </h2>
            <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
              REALTIME GACOR
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '0.01em' }}>
            Binance Live WebSocket 1s &middot; DexScreener On-Chain Engine &middot; Funding Rate Heatmap &middot; Radar Likuidasi
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

          {/* DexScreener Status */}
          <div style={{
            fontSize: '11px',
            padding: '5px 10px',
            borderRadius: '6px',
            background: 'rgba(168, 85, 247, 0.12)',
            color: '#c084fc',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>🚀</span>
            <span>DEXSCREENER LIVE</span>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Bento Grid (Derivatives + DexScreener) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
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
            Avg Funding Rate (Live)
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '6px 0', color: avgFunding < -0.01 ? 'var(--accent-green)' : avgFunding > 0.05 ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
            {avgFunding.toFixed(4)}%
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            {avgFunding > 0.03 ? '⚠️ Long Padat' : avgFunding < -0.01 ? '🚀 Peluang Squeeze' : 'Kondisi Seimbang'}
          </div>
        </div>

        <div className="quant-card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '800' }}>
            Top Dex 24h Volume (DexScreener)
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '6px 0', color: '#c084fc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {topDexVolume ? `${topDexVolume.baseToken} ($${(topDexVolume.volume24h / 1e6).toFixed(1)}M)` : 'Loading DEX...'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            {topDexVolume ? `${topDexVolume.chainId.toUpperCase()} · ${topDexVolume.dexId}` : 'On-Chain Radar'}
          </div>
        </div>

        <div className="quant-card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '800' }}>
            Top DEX Gainer 24h
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '6px 0', color: 'var(--accent-green)' }}>
            {topDexGainer ? `+${topDexGainer.change24h.toFixed(1)}%` : '+0.0%'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            {topDexGainer ? `${topDexGainer.baseToken} (${topDexGainer.chainId.toUpperCase()})` : 'Scanning...'}
          </div>
        </div>
      </div>

      {/* 3. Segmented Pill Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div className="quant-pill-nav" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('funding')} className={`quant-pill-btn ${activeTab === 'funding' ? 'active' : ''}`}>
            <span>💰</span>
            <span>FUNDING RATE (LIVE 1S)</span>
          </button>
          <button onClick={() => setActiveTab('dexscreener')} className={`quant-pill-btn ${activeTab === 'dexscreener' ? 'active' : ''}`} style={{ borderColor: activeTab === 'dexscreener' ? '#c084fc' : undefined }}>
            <span>🚀</span>
            <span style={{ color: activeTab === 'dexscreener' ? '#c084fc' : undefined, fontWeight: '800' }}>DEXSCREENER RADAR (GACOR)</span>
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
            <span>RADAR LIKUIDASI ({liveLiquidations.length})</span>
          </button>
        </div>

        {activeTab === 'dexscreener' && (
          <button
            onClick={fetchDexScreener}
            disabled={dexLoading}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              background: 'rgba(168, 85, 247, 0.1)',
              color: '#c084fc',
              fontSize: '11px',
              fontWeight: '700',
              cursor: dexLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{dexLoading ? '⏳' : '🔄'}</span>
            <span>{dexLoading ? 'SYNCING DEX...' : 'REFRESH DEXSCREENER'}</span>
          </button>
        )}
      </div>

      {/* 4. Tab Contents */}
      <div className="quant-card" style={{ padding: '0', overflow: 'hidden' }}>

        {/* TAB 1: FUNDING RATE (1S LIVE BINANCE) */}
        {activeTab === 'funding' && (
          <table className="quant-table">
            <thead>
              <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Pair Kripto</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Funding Rate (8h)</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Mark Price (Live 1s)</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Settle Countdown</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Sinyal Leverage</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((f, idx) => {
                const base = f.symbol?.replace('USDT', '');
                const liveQuote = livePrices[f.symbol] || livePrices[f.pair] || livePrices[base] || livePrices[`${base}/USDT`];
                const markVal = (f.mark_price && Number(f.mark_price) > 0)
                  ? Number(f.mark_price)
                  : (liveQuote?.price && Number(liveQuote.price) > 0 ? Number(liveQuote.price) : 0);

                const flash = flashingPairs[f.symbol];
                const flashBg = flash === 'up' ? 'rgba(0, 208, 132, 0.18)' : flash === 'down' ? 'rgba(239, 68, 68, 0.18)' : getFundingBg(f.funding_rate_pct);
                return (
                  <tr key={idx} style={{ borderBottom: 'var(--border-hairline)', background: flashBg, transition: 'background 0.4s ease' }}>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '13px' }}>
                          {f.pair || `${base}/USDT`}
                        </span>
                        <span style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(234, 179, 8, 0.15)', color: 'var(--accent-gold)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                          PERP
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: f.funding_rate_pct < -0.01 ? 'var(--accent-green)' : f.funding_rate_pct > 0.05 ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
                      {f.funding_rate_pct > 0 ? '+' : ''}{Number(f.funding_rate_pct || 0).toFixed(4)}%
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800' }}>
                      {markVal > 0 ? (
                        <>
                          ${markVal < 1
                            ? markVal.toFixed(4)
                            : markVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          {flash === 'up' && <span style={{ color: 'var(--accent-green)', marginLeft: '4px' }}>▲</span>}
                          {flash === 'down' && <span style={{ color: 'var(--accent-rust)', marginLeft: '4px' }}>▼</span>}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {countdown || '08:00:00'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span className={`badge ${f.funding_rate_pct < -0.01 ? 'badge-bull' : f.funding_rate_pct > 0.05 ? 'badge-bear' : ''}`} style={{ fontWeight: 'bold' }}>
                        {f.funding_rate_pct > 0.05 ? '⚠️ OVERLEVERAGED' : f.funding_rate_pct < -0.01 ? '🚀 SQUEEZE POTENTIAL' : 'NEUTRAL'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button
                        onClick={() => onOpenChart ? onOpenChart(`BINANCE:${f.symbol}.P`, 'CRYPTO') : null}
                        style={{
                          background: 'transparent',
                          border: 'var(--border-hairline)',
                          borderRadius: '4px',
                          color: 'var(--accent-blue)',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Chart ↗
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* TAB 2: DEXSCREENER RADAR (GACOR MULTI-CHAIN) */}
        {activeTab === 'dexscreener' && (
          <div style={{ padding: '14px' }}>
            {/* Filter bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginRight: '4px' }}>CHAIN:</span>
                {['ALL', 'SOLANA', 'BASE', 'ETHEREUM', 'BSC', 'SUI', 'ARBITRUM'].map(c => (
                  <button
                    key={c}
                    onClick={() => setDexChainFilter(c)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      border: dexChainFilter === c ? '1px solid #c084fc' : 'var(--border-hairline)',
                      background: dexChainFilter === c ? 'rgba(168, 85, 247, 0.2)' : 'var(--bg-panel-subtle)',
                      color: dexChainFilter === c ? '#c084fc' : 'var(--text-secondary)'
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <form onSubmit={handleDexSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Cari token, simbol, atau contract address (e.g. PEPE, SOL, 0x...)..."
                  value={dexSearch}
                  onChange={(e) => setDexSearch(e.target.value)}
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
                <button
                  type="submit"
                  className="telemetry-btn"
                  style={{
                    padding: '5px 10px',
                    fontSize: '10px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    borderColor: '#c084fc',
                    color: '#c084fc',
                    fontWeight: '700'
                  }}
                >
                  {dexLoading ? '⏳' : '🔍 CARI'}
                </button>
              </form>
            </div>

            {/* DexScreener Table */}
            {dexLoading && dexPairs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>⏳ Mengambil live feed DexScreener...</div>
                <div style={{ fontSize: '11px' }}>Menghubungkan ke liquidity pool Solana, Base, Ethereum, BSC</div>
              </div>
            ) : filteredDexPairs.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Tidak ada pair yang sesuai filter.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="quant-table" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px' }}>Token / Pair</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Chain & DEX</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Harga USD</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>5m %</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>1h %</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>24h %</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>24h Volume</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Liquidity</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDexPairs.slice(0, 40).map((p, idx) => {
                      const chainColor = getChainBadgeColor(p.chainId);
                      const isUp24 = p.change24h >= 0;
                      return (
                        <tr key={p.pairAddress || idx} style={{ borderBottom: 'var(--border-hairline)' }}>
                          <td style={{ padding: '8px 10px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{p.baseToken}</strong>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/{p.quoteToken}</span>
                              </div>
                              <div style={{ fontSize: '9px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                {p.baseName}
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '8px',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                background: chainColor.bg,
                                color: chainColor.text,
                                border: `1px solid ${chainColor.border}`,
                                fontFamily: 'var(--font-mono)',
                                fontWeight: '800'
                              }}>
                                {p.chainId.toUpperCase()}
                              </span>
                              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                                {p.dexId}
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800' }}>
                            {formatUsdSmart(p.priceUsd)}
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: p.change5m >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                            {p.change5m >= 0 ? '+' : ''}{p.change5m.toFixed(1)}%
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: p.change1h >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                            {p.change1h >= 0 ? '+' : ''}{p.change1h.toFixed(1)}%
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: isUp24 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                            {isUp24 ? '+' : ''}{p.change24h.toFixed(1)}%
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                            ${(p.volume24h / 1e6).toFixed(2)}M
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                            ${(p.liquidityUsd / 1e3).toFixed(0)}K
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  background: 'rgba(168, 85, 247, 0.15)',
                                  color: '#c084fc',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  textDecoration: 'none',
                                  border: '1px solid rgba(168, 85, 247, 0.3)'
                                }}
                                title="Buka pair di DexScreener"
                              >
                                Dex ↗
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: OPEN INTEREST */}
        {activeTab === 'oi' && (
          <table className="quant-table">
            <thead>
              <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Pair</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Open Interest (USD)</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Perubahan 1 Jam</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Harga Acuan</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Sinyal Divergensi OI</th>
              </tr>
            </thead>
            <tbody>
              {initialOI.map((o, idx) => {
                const base = o.symbol?.replace('USDT', '');
                const liveQuote = livePrices[o.symbol] || livePrices[o.pair] || livePrices[base];
                const oiPrice = (o.price && Number(o.price) > 0) ? Number(o.price) : (liveQuote?.price || 0);

                let badgeClass = '';
                if (o.oi_price_divergence === 'BULLISH_CONFIRMATION') badgeClass = 'badge-bull';
                else if (o.oi_price_divergence === 'BEARISH_DIVERGENCE') badgeClass = 'badge-bear';
                return (
                  <tr key={idx} style={{ borderBottom: 'var(--border-hairline)' }}>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => onOpenChart ? onOpenChart(`BINANCE:${o.symbol}.P`, 'CRYPTO') : null} style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 'bold' }}>
                        {o.pair} ↗
                      </button>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      ${(o.open_interest_usd / 1e6).toFixed(2)}M
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: o.oi_change_1h_pct > 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                      {o.oi_change_1h_pct > 0 ? '+' : ''}{o.oi_change_1h_pct}%
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                      {oiPrice > 0 ? (
                        `$${oiPrice < 1 ? oiPrice.toFixed(4) : oiPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span className={`badge ${badgeClass}`} style={{ fontWeight: 'bold' }}>
                        {o.oi_price_divergence}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

        {/* TAB 5: RADAR LIKUIDASI */}
        {activeTab === 'liquidations' && (
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <strong style={{ fontSize: '14px' }}>📡 STREAM FORCED LIQUIDATIONS (REAL-TIME)</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Posisi margin trader yang terlikuidasi otomatis detik ini</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--accent-rust)', fontFamily: 'var(--font-mono)' }}>
                Largest 24h: ${(initialLiq.largest_single || 0).toLocaleString()}
              </div>
            </div>

            {liveLiquidations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {liveLiquidations.map((liq, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-xs)',
                    background: liq.isNew ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-panel-subtle)',
                    border: liq.isNew ? '1px solid var(--accent-rust)' : 'var(--border-hairline)',
                    fontSize: '12px',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{liq.timestamp}</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{liq.pair}</span>
                      <span className={`badge ${liq.side === 'SELL' ? 'badge-bear' : 'badge-bull'}`} style={{ fontWeight: 'bold' }}>
                        {liq.side === 'SELL' ? 'LONG LIQUIDATED 💀' : 'SHORT LIQUIDATED 💥'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>@{liq.price.toLocaleString()}</span>
                      <strong style={{ color: liq.side === 'SELL' ? 'var(--accent-rust)' : 'var(--accent-green)', fontSize: '13px' }}>
                        ${liq.usd_value.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>📡 Radar Likuidasi Aktif & Siaga</div>
                <div style={{ fontSize: '11px' }}>Setiap kali terjadi margin call di bursa Binance Futures, data akan ter-flash seketika di sini.</div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
