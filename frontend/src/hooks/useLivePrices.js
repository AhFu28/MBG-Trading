import { useState, useEffect, useRef, useCallback } from 'react';

// Default list emiten penting BEI
const DEFAULT_IDX_TICKERS = [
  'IDX:BBCA', 'IDX:BBRI', 'IDX:BMRI', 'IDX:BBNI', 'IDX:ASII', 'IDX:TLKM',
  'IDX:AMMN', 'IDX:BREN', 'IDX:CUAN', 'IDX:ADRO', 'IDX:LSIP', 'IDX:ANTM',
  'IDX:PTBA', 'IDX:BRMS', 'IDX:MEDC', 'IDX:PGAS', 'IDX:UNTR', 'IDX:CPIN',
  'IDX:ICBP', 'IDX:INDF', 'IDX:KLBF', 'IDX:MAPI', 'IDX:ACES', 'IDX:EXCL',
  'IDX:ISAT', 'IDX:BRPT', 'IDX:TPIA', 'IDX:MDKA', 'IDX:MBMA', 'IDX:GOTO'
];

// Default list US stocks
const DEFAULT_US_TICKERS = [
  'NASDAQ:AAPL', 'NASDAQ:NVDA', 'NASDAQ:MSFT', 'NASDAQ:TSLA', 'NASDAQ:AMZN',
  'NASDAQ:GOOGL', 'NASDAQ:META', 'NASDAQ:AMD', 'NASDAQ:AVGO', 'NASDAQ:PLTR',
  'NYSE:JPM', 'NYSE:XOM', 'NYSE:BA', 'NASDAQ:COIN', 'NASDAQ:SMCI'
];

// Default list Forex
const DEFAULT_FOREX_TICKERS = [
  'FX_IDC:EURUSD', 'FX_IDC:GBPUSD', 'FX_IDC:USDJPY', 'FX_IDC:AUDUSD',
  'FX_IDC:USDCAD', 'FX_IDC:USDCHF', 'FX_IDC:NZDUSD', 'FX_IDC:EURJPY',
  'FX_IDC:GBPJPY'
];

export function useLivePrices(bundleData) {
  const [livePrices, setLivePrices] = useState({});
  const [flashMap, setFlashMap] = useState({});
  const [allIdxStocks, setAllIdxStocks] = useState([]);
  const [allCryptoSpot, setAllCryptoSpot] = useState([]);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  const wsRef = useRef(null);
  const flashTimeoutRef = useRef(null);

  // Helper untuk trigger flash animasi hijau/merah
  const triggerFlash = useCallback((symbol, direction) => {
    setFlashMap(prev => ({ ...prev, [symbol]: direction }));
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => {
      setFlashMap({});
    }, 700);
  }, []);

  // 1. Fetch Seluruh Alam Semesta Saham BEI (849+ Emiten Aktif) via TradingView Scanner
  const fetchIdxQuotes = useCallback(async () => {
    try {
      const res = await fetch('https://scanner.tradingview.com/indonesia/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filter: [{ left: 'active_symbol', operation: 'equal', right: true }],
          options: { lang: 'en' },
          symbols: { query: { types: [] }, tickers: [] },
          columns: ['name', 'close', 'change', 'volume', 'Value.Traded', 'description', 'high', 'low', 'RSI', 'SMA20'],
          sort: { sortBy: 'Value.Traded', sortOrder: 'desc' },
          range: [0, 850]
        })
      });

      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data?.data)) return;

      const stocksList = [];
      setLivePrices(prev => {
        const next = { ...prev };
        data.data.forEach(item => {
          const rawSym = item.s || ''; // e.g. "IDX:BBCA"
          const clean = rawSym.replace('IDX:', '');
          const [name, close, changePct, volume, valueTraded, description, high, low, rsi, sma20] = item.d || [];
          if (close !== undefined && close !== null) {
            const oldPrice = next[clean]?.price;
            if (oldPrice && Math.abs(oldPrice - close) > 0.001) {
              triggerFlash(clean, close > oldPrice ? 'up' : 'down');
            }

            const quote = {
              symbol: clean,
              fullSymbol: rawSym,
              price: Number(close),
              changePct: Number((changePct || 0).toFixed(2)),
              volume: Number(volume || 0),
              valueTraded: Number(valueTraded || 0),
              description: description || name,
              high: Number(high || close),
              low: Number(low || close),
              rsi: rsi ? Number(rsi.toFixed(1)) : null,
              sma20: sma20 ? Number(sma20.toFixed(0)) : null,
              market: 'IDX',
              updatedAt: Date.now()
            };

            next[clean] = quote;
            next[`${clean}.JK`] = quote;
            next[rawSym] = quote;

            stocksList.push({
              ticker: clean,
              fullSymbol: rawSym,
              name: clean,
              price: Number(close),
              changePct: Number((changePct || 0).toFixed(2)),
              volume: Number(volume || 0),
              valueTraded: Number(valueTraded || 0),
              description: description || name,
              high: Number(high || close),
              low: Number(low || close),
              rsi: rsi ? Number(rsi.toFixed(1)) : null,
              sma20: sma20 ? Number(sma20.toFixed(0)) : null
            });
          }
        });
        return next;
      });

      if (stocksList.length > 0) {
        setAllIdxStocks(stocksList);
      }
      setLastUpdateTime(new Date());
    } catch (err) {
      console.warn('Live IDX fetch error (will retry):', err);
    }
  }, [triggerFlash]);

  // 1b. Fetch Seluruh Pasangan Spot USDT Binance (744+ Pasangan)
  const fetchBinance24hr = useCallback(async () => {
    try {
      const res = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr');
      if (!res.ok) return;
      const list = await res.json();
      if (!Array.isArray(list)) return;

      const usdtPairs = list
        .filter(x => x.symbol && x.symbol.endsWith('USDT'))
        .map(item => {
          const s = item.symbol;
          const baseCoin = s.replace('USDT', '');
          const pairFormatted = `${baseCoin}/USDT`;
          const price = parseFloat(item.lastPrice || 0);
          const changePct = parseFloat(item.priceChangePercent || 0);
          const high = parseFloat(item.highPrice || 0);
          const low = parseFloat(item.lowPrice || 0);
          const volume = parseFloat(item.volume || 0);
          const quoteVolume = parseFloat(item.quoteVolume || 0);
          return {
            symbol: s,
            pair: pairFormatted,
            baseCoin,
            price,
            changePct,
            high,
            low,
            volume,
            quoteVolume
          };
        })
        .sort((a, b) => b.quoteVolume - a.quoteVolume);

      if (usdtPairs.length > 0) {
        setAllCryptoSpot(usdtPairs);
      }

      setLivePrices(prev => {
        const next = { ...prev };
        usdtPairs.forEach(c => {
          if (!next[c.symbol]) {
            const quote = {
              symbol: c.symbol,
              pair: c.pair,
              baseCoin: c.baseCoin,
              price: c.price,
              changePct: Number(c.changePct.toFixed(2)),
              high: c.high,
              low: c.low,
              volume: c.quoteVolume,
              market: 'CRYPTO',
              updatedAt: Date.now()
            };
            next[c.symbol] = quote;
            next[c.pair] = quote;
            next[c.baseCoin] = quote;
          }
        });
        return next;
      });
    } catch (err) {
      console.warn('Binance 24hr fetch error (will retry):', err);
    }
  }, []);

  // 2. Fetch Real-time Quotes dari TradingView America Scanner
  const fetchUsQuotes = useCallback(async () => {
    try {
      const res = await fetch('https://scanner.tradingview.com/america/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: { tickers: DEFAULT_US_TICKERS },
          columns: ['name', 'close', 'change', 'volume', 'high', 'low']
        })
      });

      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data?.data)) return;

      setLivePrices(prev => {
        const next = { ...prev };
        data.data.forEach(item => {
          const rawSym = item.s || '';
          const clean = rawSym.split(':')[1] || rawSym;
          const [name, close, changePct, volume, high, low] = item.d || [];
          if (close !== undefined && close !== null) {
            const quote = {
              symbol: clean,
              fullSymbol: rawSym,
              price: Number(close),
              changePct: Number((changePct || 0).toFixed(2)),
              volume: Number(volume || 0),
              high: Number(high || close),
              low: Number(low || close),
              market: 'US',
              updatedAt: Date.now()
            };
            next[clean] = quote;
            next[rawSym] = quote;
          }
        });
        return next;
      });
    } catch (err) {
      console.warn('Live US fetch error (will retry):', err);
    }
  }, []);

  // 3. Fetch Real-time Quotes dari TradingView Forex Scanner
  const fetchForexQuotes = useCallback(async () => {
    try {
      const res = await fetch('https://scanner.tradingview.com/forex/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: { tickers: DEFAULT_FOREX_TICKERS },
          columns: ['name', 'close', 'change', 'high', 'low']
        })
      });

      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data?.data)) return;

      setLivePrices(prev => {
        const next = { ...prev };
        data.data.forEach(item => {
          const rawSym = item.s || '';
          const clean = rawSym.replace('FX_IDC:', '').replace('FX:', '');
          const [name, close, changePct, high, low] = item.d || [];
          if (close !== undefined && close !== null) {
            const quote = {
              symbol: clean,
              fullSymbol: rawSym,
              price: Number(close),
              changePct: Number((changePct || 0).toFixed(2)),
              high: Number(high || close),
              low: Number(low || close),
              market: 'FOREX',
              updatedAt: Date.now()
            };
            next[clean] = quote;
            next[rawSym] = quote;
          }
        });
        return next;
      });
    } catch (err) {
      console.warn('Live Forex fetch error (will retry):', err);
    }
  }, []);

  // 4. WebSocket Live Stream Crypto via Binance Vision (1 Detik Realtime, Bebas Blokir)
  useEffect(() => {
    let ws = null;
    let isMounted = true;
    let reconnectTimer = null;

    const connectCryptoWs = () => {
      try {
        ws = new WebSocket('wss://data-stream.binance.vision/ws/!miniTicker@arr');
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) setIsWsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const rawList = JSON.parse(event.data);
            if (!Array.isArray(rawList)) return;

            setLivePrices(prev => {
              const next = { ...prev };
              let hasChange = false;

              for (const item of rawList) {
                const s = item.s;
                if (!s || !s.endsWith('USDT')) continue;

                const close = parseFloat(item.c || 0);
                const open = parseFloat(item.o || 0);
                if (!close) continue;

                const changePct = open > 0 ? ((close - open) / open) * 100 : 0;
                const high = parseFloat(item.h || close);
                const low = parseFloat(item.l || close);
                const volume = parseFloat(item.q || 0);

                const baseCoin = s.replace('USDT', '');
                const pairFormatted = `${baseCoin}/USDT`;

                const oldPrice = next[s]?.price;
                if (oldPrice && Math.abs(oldPrice - close) > 0.0001) {
                  triggerFlash(s, close > oldPrice ? 'up' : 'down');
                  triggerFlash(pairFormatted, close > oldPrice ? 'up' : 'down');
                  triggerFlash(baseCoin, close > oldPrice ? 'up' : 'down');
                }

                const quote = {
                  symbol: s,
                  pair: pairFormatted,
                  baseCoin: baseCoin,
                  price: close,
                  changePct: Number(changePct.toFixed(2)),
                  high,
                  low,
                  volume,
                  market: 'CRYPTO',
                  updatedAt: Date.now()
                };

                next[s] = quote;
                next[pairFormatted] = quote;
                next[baseCoin] = quote;
                hasChange = true;
              }

              if (hasChange) setLastUpdateTime(new Date());
              return next;
            });
          } catch {
            // Ignore parse errors
          }
        };

        ws.onerror = () => {
          if (isMounted) setIsWsConnected(false);
        };

        ws.onclose = () => {
          if (isMounted) {
            setIsWsConnected(false);
            reconnectTimer = setTimeout(connectCryptoWs, 4000);
          }
        };
      } catch (err) {
        if (isMounted) {
          setIsWsConnected(false);
          reconnectTimer = setTimeout(connectCryptoWs, 5000);
        }
      }
    };

    connectCryptoWs();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [triggerFlash]);

  // 5. Polling Scanners untuk IDX (849 emiten), Crypto Spot (744 pairs), US, Forex
  useEffect(() => {
    fetchIdxQuotes();
    fetchBinance24hr();
    fetchUsQuotes();
    fetchForexQuotes();

    const idxInterval = setInterval(fetchIdxQuotes, 20000);
    const cryptoInterval = setInterval(fetchBinance24hr, 45000);
    const usInterval = setInterval(fetchUsQuotes, 30000);
    const fxInterval = setInterval(fetchForexQuotes, 30000);

    return () => {
      clearInterval(idxInterval);
      clearInterval(cryptoInterval);
      clearInterval(usInterval);
      clearInterval(fxInterval);
    };
  }, [fetchIdxQuotes, fetchBinance24hr, fetchUsQuotes, fetchForexQuotes]);

  // Manual Trigger Refresh All
  const refetchAll = useCallback(() => {
    fetchIdxQuotes();
    fetchBinance24hr();
    fetchUsQuotes();
    fetchForexQuotes();
  }, [fetchIdxQuotes, fetchBinance24hr, fetchUsQuotes, fetchForexQuotes]);

  return {
    livePrices,
    flashMap,
    allIdxStocks,
    allCryptoSpot,
    isWsConnected,
    lastUpdateTime,
    refetchAll
  };
}
