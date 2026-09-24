import { useState, useEffect, useRef, useCallback } from 'react';
import {
  isIdxMarketOpen,
  isUsMarketOpen,
  isForexCommodityOpen,
  isCryptoOpen,
  getAllMarketStatuses
} from '../utils/marketHours.js';

// Re-export market hours utilities
export {
  isIdxMarketOpen,
  isUsMarketOpen,
  isForexCommodityOpen,
  isCryptoOpen,
  getAllMarketStatuses
};

// Default list emiten penting BEI
const DEFAULT_IDX_TICKERS = [
  'IDX:BBCA', 'IDX:BBRI', 'IDX:BMRI', 'IDX:BBNI', 'IDX:ASII', 'IDX:TLKM',
  'IDX:AMMN', 'IDX:BREN', 'IDX:CUAN', 'IDX:ADRO', 'IDX:LSIP', 'IDX:ANTM',
  'IDX:PTBA', 'IDX:BRMS', 'IDX:MEDC', 'IDX:PGAS', 'IDX:UNTR', 'IDX:CPIN',
  'IDX:ICBP', 'IDX:INDF', 'IDX:KLBF', 'IDX:MAPI', 'IDX:ACES', 'IDX:EXCL',
  'IDX:ISAT', 'IDX:BRPT', 'IDX:TPIA', 'IDX:MDKA', 'IDX:MBMA', 'IDX:GOTO'
];

// Default list US stocks (full 31 institutional universe matching bundle)
const DEFAULT_US_TICKERS = [
  'NASDAQ:AAPL', 'NASDAQ:NVDA', 'NASDAQ:MSFT', 'NASDAQ:META', 'NASDAQ:GOOGL', 'NASDAQ:AMD',
  'NASDAQ:AVGO', 'NYSE:CRM', 'NASDAQ:PLTR', 'NASDAQ:SMCI', 'NASDAQ:AMZN', 'NASDAQ:TSLA',
  'NASDAQ:NFLX', 'NASDAQ:COIN', 'NASDAQ:SOFI', 'NYSE:JPM', 'NYSE:GS', 'NYSE:V',
  'NYSE:MA', 'NYSE:UNH', 'NYSE:JNJ', 'NYSE:PFE', 'NYSE:LLY', 'NYSE:XOM',
  'NYSE:CVX', 'NYSE:BA', 'NYSE:GE', 'NYSE:CAT', 'NASDAQ:MU', 'NASDAQ:INTC', 'NASDAQ:ARM'
];

// Default list Forex (Full 28 Major & Minor Institutional Universe)
const DEFAULT_FOREX_TICKERS = [
  'FX_IDC:EURUSD', 'FX_IDC:GBPUSD', 'FX_IDC:USDJPY', 'FX_IDC:AUDUSD',
  'FX_IDC:USDCHF', 'FX_IDC:NZDUSD', 'FX_IDC:USDCAD', 'FX_IDC:EURGBP',
  'FX_IDC:EURJPY', 'FX_IDC:GBPJPY', 'FX_IDC:AUDJPY', 'FX_IDC:EURAUD',
  'FX_IDC:EURCHF', 'FX_IDC:GBPAUD', 'FX_IDC:GBPCHF', 'FX_IDC:AUDNZD',
  'FX_IDC:NZDJPY', 'FX_IDC:CADJPY', 'FX_IDC:AUDCAD', 'FX_IDC:GBPCAD',
  'FX_IDC:EURNZD', 'FX_IDC:AUDCHF', 'FX_IDC:NZDCAD', 'FX_IDC:CHFJPY',
  'FX_IDC:GBPNZD', 'FX_IDC:EURCAD', 'FX_IDC:NZDCHF', 'FX_IDC:CADCHF',
  'FX_IDC:USDIDR'
];

// Default list Commodities & Strategic Macro CFD
const DEFAULT_COMMODITY_TICKERS = [
  'TVC:GOLD', 'TVC:SILVER', 'FX:USOIL', 'FX:UKOIL', 'TVC:DXY'
];

// Reverse proxy helper with graceful direct fallback (H-06)
async function callTvScanner(market, payload) {
  try {
    const proxyRes = await fetch(`/api/scanner?market=${encodeURIComponent(market)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    if (proxyRes.ok) return await proxyRes.json();
  } catch (e) {}

  try {
    const directRes = await fetch(`https://scanner.tradingview.com/${market}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    if (directRes.ok) return await directRes.json();
  } catch (e) {}

  return null;
}

export function useLivePrices(bundleData) {
  const [livePrices, setLivePrices] = useState({});
  const [flashMap, setFlashMap] = useState({});
  const [allIdxStocks, setAllIdxStocks] = useState([]);
  const [allCryptoSpot, setAllCryptoSpot] = useState([]);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  const wsRef = useRef(null);

  // Helper untuk trigger flash animasi hijau/merah HANYA jika harga benar-benar berubah
  const triggerFlash = useCallback((symbol, direction) => {
    setFlashMap(prev => ({ ...prev, [symbol]: direction }));
    setTimeout(() => {
      setFlashMap(prev => {
        if (!prev[symbol]) return prev;
        const next = { ...prev };
        delete next[symbol];
        return next;
      });
    }, 800);
  }, []);

  // 1. Fetch Seluruh Alam Semesta Saham BEI & Indeks IDX via TradingView Scanner
  const fetchIdxQuotes = useCallback(async () => {
    // 1a. Priority targeted fetch: Indeks & Active Trade Plans & Bluechips (Guaranteed fresh & zero CORS delay)
    try {
      const planTickers = (bundleData?.daily_trade_plans || []).map(p => p.clean_ticker || p.symbol?.replace('.JK', '')).filter(Boolean);
      const priorityTickers = Array.from(new Set([
        'IDX:COMPOSITE', 'IDX:LQ45',
        ...DEFAULT_IDX_TICKERS,
        ...planTickers.map(t => `IDX:${t}`)
      ]));

      const priorityData = await callTvScanner('indonesia', {
        symbols: { tickers: priorityTickers },
        columns: ['name', 'close', 'change', 'volume', 'Value.Traded', 'description', 'high', 'low']
      });

      if (Array.isArray(priorityData?.data)) {
          setLivePrices(prev => {
            const next = { ...prev };
            priorityData.data.forEach(item => {
              const rawSym = item.s || '';
              const clean = rawSym.replace('IDX:', '');
              const [name, close, changePct, volume, valueTraded, description, high, low] = item.d || [];
              if (close !== undefined && close !== null) {
                const isIhsg = rawSym === 'IDX:COMPOSITE';
                const lookupKey = isIhsg ? 'IHSG' : clean;
                const oldPrice = next[lookupKey]?.price;
                if (oldPrice && Math.abs(oldPrice - close) > (isIhsg ? 0.05 : 0.001)) {
                  triggerFlash(lookupKey, close > oldPrice ? 'up' : 'down');
                }

                const quote = {
                  symbol: isIhsg ? 'IHSG' : clean,
                  fullSymbol: rawSym,
                  price: Number(close),
                  changePct: Number((changePct || 0).toFixed(2)),
                  volume: Number(volume || 0),
                  valueTraded: Number(valueTraded || 0),
                  description: description || name,
                  high: Number(high || close),
                  low: Number(low || close),
                  market: 'IDX',
                  updatedAt: Date.now()
                };

                if (isIhsg) {
                  next['IHSG'] = quote;
                  next['.JKSE'] = quote;
                  next['IDX:COMPOSITE'] = quote;
                  next['COMPOSITE'] = quote;
                } else {
                  next[clean] = quote;
                  next[`${clean}.JK`] = quote;
                  next[rawSym] = quote;
                }
              }
            });
            return next;
          });
        }
    } catch (err) {
      console.warn('Live IDX priority fetch error (will retry):', err);
    }

    // 1b. Broad universe scanner (850 emiten) for Watchlist, Heatmap, and Search
    try {
      const data = await callTvScanner('indonesia', {
        filter: [{ left: 'active_symbol', operation: 'equal', right: true }],
        options: { lang: 'en' },
        symbols: { query: { types: [] }, tickers: [] },
        columns: ['name', 'close', 'change', 'volume', 'Value.Traded', 'description', 'high', 'low', 'RSI', 'SMA20'],
        sort: { sortBy: 'Value.Traded', sortOrder: 'desc' },
        range: [0, 850]
      });

      if (Array.isArray(data?.data)) {
          const mappedList = data.data.map(item => {
            const rawSym = item.s || '';
            const clean = rawSym.replace('IDX:', '');
            const [name, close, changePct, volume, valueTraded, description, high, low, rsi, sma20] = item.d || [];
            return {
              ticker: clean,
              symbol: clean,
              fullSymbol: rawSym,
              name: description || name,
              price: Number(close || 0),
              change_pct: Number((changePct || 0).toFixed(2)),
              volume: Number(volume || 0),
              value_traded: Number(valueTraded || 0),
              high: Number(high || 0),
              low: Number(low || 0),
              rsi: Number(rsi || 50),
              sma20: Number(sma20 || close || 0),
              market: 'IDX'
            };
          });

          setAllIdxStocks(mappedList);

          setLivePrices(prev => {
            const next = { ...prev };
            mappedList.forEach(s => {
              if (s.price > 0) {
                const quote = {
                  symbol: s.ticker,
                  fullSymbol: s.fullSymbol,
                  price: s.price,
                  changePct: s.change_pct,
                  volume: s.volume,
                  valueTraded: s.value_traded,
                  description: s.name,
                  high: s.high,
                  low: s.low,
                  rsi: s.rsi,
                  sma20: s.sma20,
                  market: 'IDX',
                  updatedAt: Date.now()
                };

                const oldPrice = next[s.ticker]?.price;
                if (oldPrice && Math.abs(oldPrice - s.price) > 0.001) {
                  triggerFlash(s.ticker, s.price > oldPrice ? 'up' : 'down');
                }

                next[s.ticker] = quote;
                next[`${s.ticker}.JK`] = quote;
                next[s.fullSymbol] = quote;
              }
            });
            return next;
          });
        }
      setLastUpdateTime(new Date());
    } catch (err) {
      console.warn('Live IDX broad fetch error (will retry):', err);
    }
  }, [bundleData, triggerFlash]);

  // 1b-seed. Seed initial base prices immediately from bundleData if available (Instant Live Ready)
  useEffect(() => {
    if (!bundleData) return;
    const initialQuotes = {};

    // Seed IHSG
    const m = bundleData.macro_telemetry;
    if (m && (m.ihsg_price || m.jkse_price)) {
      const p = Number(m.ihsg_price || m.jkse_price);
      const chg = Number(m.ihsg_change_pct ?? 0.36);
      const q = { symbol: 'IHSG', fullSymbol: 'IDX:COMPOSITE', price: p, changePct: chg, market: 'IDX', updatedAt: Date.now() };
      initialQuotes['IHSG'] = q;
      initialQuotes['.JKSE'] = q;
      initialQuotes['IDX:COMPOSITE'] = q;
    }

    // Seed trade plans
    (bundleData.daily_trade_plans || []).forEach(plan => {
      const sym = plan.clean_ticker || plan.symbol?.replace('.JK', '');
      if (sym && (plan.current_price || plan.entry_price)) {
        const p = Number(plan.current_price || plan.entry_price);
        const chg = Number(plan.change_pct || 0);
        const q = { symbol: sym, fullSymbol: `IDX:${sym}`, price: p, changePct: chg, market: 'IDX', updatedAt: Date.now() };
        initialQuotes[sym] = q;
        initialQuotes[`${sym}.JK`] = q;
        initialQuotes[`IDX:${sym}`] = q;
      }
    });

    // Seed US stocks
    (bundleData.us_stocks?.stocks || []).forEach(s => {
      const sym = s.ticker;
      if (sym && (s.price || s.entry_price)) {
        const p = Number(s.price || s.entry_price);
        const chg = Number(s.change_pct || 0);
        const q = { symbol: sym, fullSymbol: `NASDAQ:${sym}`, price: p, changePct: chg, market: 'US', updatedAt: Date.now() };
        initialQuotes[sym] = q;
      }
    });

    // Seed conglomerates
    Object.values(bundleData.conglomerates || {}).forEach(arr => {
      if (Array.isArray(arr)) {
        arr.forEach(s => {
          if (s.ticker && (s.price || s.current_price)) {
            const p = Number(s.price || s.current_price);
            const chg = Number(s.change_pct || 0);
            const q = { symbol: s.ticker, fullSymbol: `IDX:${s.ticker}`, price: p, changePct: chg, market: 'IDX', updatedAt: Date.now() };
            initialQuotes[s.ticker] = q;
            initialQuotes[`${s.ticker}.JK`] = q;
            initialQuotes[`IDX:${s.ticker}`] = q;
          }
        });
      }
    });

    if (Object.keys(initialQuotes).length > 0) {
      setLivePrices(prev => ({ ...initialQuotes, ...prev }));
    }
  }, [bundleData]);

  // 2. Fetch Seluruh Pasangan Spot USDT Binance (744+ Pasangan)
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

      // H-08: Check for live USDTIDR pair in Binance full ticker list
      const usdtIdrItem = list.find(x => x.symbol === 'USDTIDR');
      if (usdtIdrItem && parseFloat(usdtIdrItem.lastPrice) > 0) {
        const idrRate = parseFloat(usdtIdrItem.lastPrice);
        try {
          localStorage.setItem('mbg_usd_idr_rate', String(idrRate));
          localStorage.setItem('mbg_usd_idr_ts', String(Date.now()));
        } catch (_) {}
      }

      const now = Date.now();
      setLivePrices(prev => {
        const next = { ...prev };

        // H-08: Inject live USD/IDR quote into livePrices store
        if (usdtIdrItem && parseFloat(usdtIdrItem.lastPrice) > 0) {
          const idrQuote = {
            symbol: 'USDIDR',
            pair: 'USD/IDR',
            baseCoin: 'USD',
            price: parseFloat(usdtIdrItem.lastPrice),
            changePct: Number(parseFloat(usdtIdrItem.priceChangePercent || 0).toFixed(2)),
            high: parseFloat(usdtIdrItem.highPrice || 0),
            low: parseFloat(usdtIdrItem.lowPrice || 0),
            volume: parseFloat(usdtIdrItem.quoteVolume || 0),
            market: 'FOREX',
            updatedAt: now
          };
          next['USDIDR'] = idrQuote;
          next['USDTIDR'] = idrQuote;
        }

        // H-09: Update quotes if key is absent OR existing quote is stale (> 3000ms old)
        usdtPairs.forEach(c => {
          const existing = next[c.symbol];
          if (!existing || (now - (existing.updatedAt || 0) > 3000)) {
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
              updatedAt: now
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

  // 3. Fetch Real-time Quotes dari TradingView America Scanner
  const fetchUsQuotes = useCallback(async () => {
    try {
      const data = await callTvScanner('america', {
        symbols: { tickers: DEFAULT_US_TICKERS },
        columns: ['name', 'close', 'change', 'volume', 'high', 'low']
      });

      if (!Array.isArray(data?.data)) return;

      setLivePrices(prev => {
        const next = { ...prev };
        data.data.forEach(item => {
          const rawSym = item.s || '';
          const clean = rawSym.split(':')[1] || rawSym;
          const [name, close, changePct, volume, high, low] = item.d || [];
          if (close !== undefined && close !== null) {
            const oldPrice = next[clean]?.price;
            if (oldPrice && Math.abs(oldPrice - close) > 0.01) {
              triggerFlash(clean, close > oldPrice ? 'up' : 'down');
            }

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
            next[`FX:${clean}`] = quote;
          }
        });
        return next;
      });
    } catch (err) {
      console.warn('Live US fetch error (will retry):', err);
    }
  }, [triggerFlash]);

  // 4. Fetch Real-time Quotes dari TradingView Forex Scanner
  const fetchForexQuotes = useCallback(async () => {
    try {
      const data = await callTvScanner('forex', {
        symbols: { tickers: DEFAULT_FOREX_TICKERS },
        columns: ['name', 'close', 'change', 'high', 'low']
      });

      if (!Array.isArray(data?.data)) return;

      setLivePrices(prev => {
        const next = { ...prev };
        data.data.forEach(item => {
          const rawSym = item.s || '';
          const clean = rawSym.replace('FX_IDC:', '').replace('FX:', '');
          const [name, close, changePct, high, low] = item.d || [];
          if (close !== undefined && close !== null) {
            const numClose = Number(close);
            const oldPrice = next[clean]?.price;
            if (oldPrice && Math.abs(oldPrice - numClose) > 0.00005) {
              triggerFlash(clean, numClose > oldPrice ? 'up' : 'down');
            }

            const quote = {
              symbol: clean,
              fullSymbol: rawSym,
              price: numClose,
              changePct: Number((changePct || 0).toFixed(2)),
              high: Number(high || close),
              low: Number(low || close),
              market: 'FOREX',
              updatedAt: Date.now()
            };
            next[clean] = quote;
            next[rawSym] = quote;

            // H-08: If USDIDR is received from forex scanner, persist rate
            if (clean === 'USDIDR' && numClose > 0) {
              try {
                localStorage.setItem('mbg_usd_idr_rate', String(numClose));
                localStorage.setItem('mbg_usd_idr_ts', String(Date.now()));
              } catch (_) {}
            }
          }
        });
        return next;
      });
    } catch (err) {
      console.warn('Live Forex fetch error (will retry):', err);
    }
  }, [triggerFlash]);

  // 5. Fetch Real-time Quotes Komoditas & Strategic Macro (Gold, Silver, WTI, Brent, DXY)
  const fetchCommodityQuotes = useCallback(async () => {
    try {
      const data = await callTvScanner('cfd', {
        symbols: { tickers: DEFAULT_COMMODITY_TICKERS },
        columns: ['name', 'close', 'change', 'high', 'low', 'description']
      });

      if (!Array.isArray(data?.data)) return;

      setLivePrices(prev => {
        const next = { ...prev };
        data.data.forEach(item => {
          const rawSym = item.s || '';
          const [name, close, changePct, high, low, description] = item.d || [];
          if (close !== undefined && close !== null) {
            const numClose = Number(close);
            const numChange = Number((changePct || 0).toFixed(2));
            const numHigh = Number(high || close);
            const numLow = Number(low || close);

            const quote = {
              symbol: name,
              fullSymbol: rawSym,
              price: numClose,
              changePct: numChange,
              high: numHigh,
              low: numLow,
              description: description || name,
              market: 'COMMODITY',
              updatedAt: Date.now()
            };

            const aliases = [name, rawSym];
            if (rawSym === 'TVC:GOLD') {
              aliases.push('GOLD', 'XAUUSD', 'XAU/USD');
            } else if (rawSym === 'TVC:SILVER') {
              aliases.push('SILVER', 'XAGUSD', 'XAG/USD');
            } else if (rawSym === 'FX:USOIL') {
              aliases.push('USOIL', 'WTI', 'OIL_CRUDE');
            } else if (rawSym === 'FX:UKOIL') {
              aliases.push('UKOIL', 'BRENT', 'OIL_BRENT');
            } else if (rawSym === 'TVC:DXY') {
              aliases.push('DXY', 'USDX');
            }

            aliases.forEach(key => {
              const oldPrice = next[key]?.price;
              if (oldPrice && Math.abs(oldPrice - numClose) > 0.005) {
                triggerFlash(key, numClose > oldPrice ? 'up' : 'down');
              }
              next[key] = quote;
            });
          }
        });
        return next;
      });
    } catch (err) {
      console.warn('Live Commodity fetch error (will retry):', err);
    }
  }, [triggerFlash]);

  // 6. WebSocket Live Stream Crypto via Binance Vision (1 Detik Realtime, Bebas Blokir, 24/7)
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
      } catch {
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

  // 7. Adaptive Polling Scheduler:
  //    - Initial snapshot untuk SEMUA pasar saat app pertama kali dibuka.
  //    - Recurring polling HANYA berjalan pada pasar yang statusnya sedang BUKA.
  //    - Saat bursa TUTUP (weekend/malam), interval otomatis diam (0 polling).
  useEffect(() => {
    // Initial snapshot fetch
    fetchIdxQuotes();
    fetchBinance24hr();
    fetchUsQuotes();
    fetchForexQuotes();
    fetchCommodityQuotes();

    // Crypto 24hr summary ticker runs 24/7/365
    const cryptoInterval = setInterval(fetchBinance24hr, 45000);

    // Adaptive intervals for conventional exchanges
    const adaptiveScheduler = setInterval(() => {
      const now = new Date();
      if (isIdxMarketOpen(now)) {
        fetchIdxQuotes();
      }
      if (isUsMarketOpen(now)) {
        fetchUsQuotes();
      }
      if (isForexCommodityOpen(now)) {
        fetchForexQuotes();
        fetchCommodityQuotes();
      }
    }, 12000);

    return () => {
      clearInterval(cryptoInterval);
      clearInterval(adaptiveScheduler);
    };
  }, [fetchIdxQuotes, fetchBinance24hr, fetchUsQuotes, fetchForexQuotes, fetchCommodityQuotes]);

  // Manual Trigger Refresh All (Force snapshot for all asset classes)
  const refetchAll = useCallback(() => {
    fetchIdxQuotes();
    fetchBinance24hr();
    fetchUsQuotes();
    fetchForexQuotes();
    fetchCommodityQuotes();
  }, [fetchIdxQuotes, fetchBinance24hr, fetchUsQuotes, fetchForexQuotes, fetchCommodityQuotes]);

  return {
    livePrices,
    flashMap,
    allIdxStocks,
    allCryptoSpot,
    isWsConnected,
    lastUpdateTime,
    marketStatuses: getAllMarketStatuses(),
    refetchAll
  };
}
