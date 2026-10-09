import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { institutionalPaperBroker } from '../services/brokerGateway.js';
import { getTvSymbol, cleanSymbolStr } from '../data/tv-helpers.js';
import { formatUsdCompact } from '../services/marketOverview.js';

const CORE_CRYPTO_LIST = [
  { symbol: 'BTCUSDT', coin: 'BTC', name: 'Bitcoin', market: 'CRYPTO' },
  { symbol: 'ETHUSDT', coin: 'ETH', name: 'Ethereum', market: 'CRYPTO' },
  { symbol: 'SOLUSDT', coin: 'SOL', name: 'Solana', market: 'CRYPTO' },
  { symbol: 'BNBUSDT', coin: 'BNB', name: 'BNB Chain', market: 'CRYPTO' },
  { symbol: 'XRPUSDT', coin: 'XRP', name: 'Ripple', market: 'CRYPTO' },
  { symbol: 'HYPEUSDC', coin: 'HYPE', name: 'Hyperliquid', market: 'CRYPTO' },
  { symbol: 'SUIUSDT', coin: 'SUI', name: 'Sui Network', market: 'CRYPTO' },
  { symbol: 'DOGEUSDT', coin: 'DOGE', name: 'Dogecoin', market: 'CRYPTO' },
  { symbol: 'AVAXUSDT', coin: 'AVAX', name: 'Avalanche', market: 'CRYPTO' },
  { symbol: 'LINKUSDT', coin: 'LINK', name: 'Chainlink', market: 'CRYPTO' },
  { symbol: 'PEPEUSDT', coin: 'PEPE', name: 'Pepe', market: 'CRYPTO' },
  { symbol: 'WIFUSDT', coin: 'WIF', name: 'dogwifhat', market: 'CRYPTO' },
  { symbol: 'NEARUSDT', coin: 'NEAR', name: 'NEAR Protocol', market: 'CRYPTO' },
  { symbol: 'APTUSDT', coin: 'APT', name: 'Aptos', market: 'CRYPTO' },
  { symbol: 'TIAUSDT', coin: 'TIA', name: 'Celestia', market: 'CRYPTO' },
  { symbol: 'RENDERUSDT', coin: 'RENDER', name: 'Render Network', market: 'CRYPTO' },
  { symbol: 'INJUSDT', coin: 'INJ', name: 'Injective', market: 'CRYPTO' },
  { symbol: 'AAVEUSDT', coin: 'AAVE', name: 'Aave', market: 'CRYPTO' },
  { symbol: 'CRVUSDT', coin: 'CRV', name: 'Curve DAO', market: 'CRYPTO' },
  { symbol: 'UNIUSDT', coin: 'UNI', name: 'Uniswap', market: 'CRYPTO' },
  { symbol: 'LTCUSDT', coin: 'LTC', name: 'Litecoin', market: 'CRYPTO' },
  { symbol: 'ARBUSDT', coin: 'ARB', name: 'Arbitrum', market: 'CRYPTO' },
  { symbol: 'OPUSDT', coin: 'OP', name: 'Optimism', market: 'CRYPTO' },
  { symbol: 'FTMUSDT', coin: 'FTM', name: 'Fantom', market: 'CRYPTO' },
  { symbol: 'ATOMUSDT', coin: 'ATOM', name: 'Cosmos', market: 'CRYPTO' },
  { symbol: 'DOTUSDT', coin: 'DOT', name: 'Polkadot', market: 'CRYPTO' },
  { symbol: 'TONUSDT', coin: 'TON', name: 'Toncoin', market: 'CRYPTO' },
  { symbol: 'KASUSDT', coin: 'KAS', name: 'Kaspa', market: 'CRYPTO' },
  { symbol: 'RUNEUSDT', coin: 'RUNE', name: 'THORChain', market: 'CRYPTO' },
  { symbol: 'SEIUSDT', coin: 'SEI', name: 'Sei', market: 'CRYPTO' },
  { symbol: 'STXUSDT', coin: 'STX', name: 'Stacks', market: 'CRYPTO' },
  { symbol: 'FETUSDT', coin: 'FET', name: 'Artificial Superintelligence', market: 'CRYPTO' },
  { symbol: 'TAOUSDT', coin: 'TAO', name: 'Bittensor', market: 'CRYPTO' },
  { symbol: 'WLDUSDT', coin: 'WLD', name: 'Worldcoin', market: 'CRYPTO' },
  { symbol: 'POPCATUSDT', coin: 'POPCAT', name: 'Popcat', market: 'CRYPTO' },
  { symbol: 'BONKUSDT', coin: 'BONK', name: 'Bonk', market: 'CRYPTO' },
  { symbol: 'SHIBUSDT', coin: 'SHIB', name: 'Shiba Inu', market: 'CRYPTO' },
  { symbol: 'FLOKIUSDT', coin: 'FLOKI', name: 'Floki', market: 'CRYPTO' },
  { symbol: 'PENDLEUSDT', coin: 'PENDLE', name: 'Pendle', market: 'CRYPTO' },
  { symbol: 'ENAUSDT', coin: 'ENA', name: 'Ethena', market: 'CRYPTO' }
];

const CORE_IDX_LIST = [
  { symbol: 'BBCA', coin: 'BBCA', name: 'Bank Central Asia', market: 'IDX' },
  { symbol: 'BBRI', coin: 'BBRI', name: 'Bank Rakyat Indonesia', market: 'IDX' },
  { symbol: 'BMRI', coin: 'BMRI', name: 'Bank Mandiri', market: 'IDX' },
  { symbol: 'BBNI', coin: 'BBNI', name: 'Bank Negara Indonesia', market: 'IDX' },
  { symbol: 'ASII', coin: 'ASII', name: 'Astra International', market: 'IDX' },
  { symbol: 'TLKM', coin: 'TLKM', name: 'Telkom Indonesia', market: 'IDX' },
  { symbol: 'AMMN', coin: 'AMMN', name: 'Amman Mineral Internasional', market: 'IDX' },
  { symbol: 'BREN', coin: 'BREN', name: 'Barito Renewables Energy', market: 'IDX' },
  { symbol: 'CUAN', coin: 'CUAN', name: 'Petrindo Jaya Kreasi', market: 'IDX' },
  { symbol: 'ADRO', coin: 'ADRO', name: 'Adaro Energy', market: 'IDX' },
  { symbol: 'ANTM', coin: 'ANTM', name: 'Aneka Tambang (Antam)', market: 'IDX' },
  { symbol: 'PTBA', coin: 'PTBA', name: 'Bukit Asam', market: 'IDX' },
  { symbol: 'BRMS', coin: 'BRMS', name: 'Bumi Resources Minerals', market: 'IDX' },
  { symbol: 'MEDC', coin: 'MEDC', name: 'Medco Energi Internasional', market: 'IDX' },
  { symbol: 'PGAS', coin: 'PGAS', name: 'Perusahaan Gas Negara', market: 'IDX' },
  { symbol: 'UNTR', coin: 'UNTR', name: 'United Tractors', market: 'IDX' },
  { symbol: 'CPIN', coin: 'CPIN', name: 'Charoen Pokphand', market: 'IDX' },
  { symbol: 'ICBP', coin: 'ICBP', name: 'Indofood CBP Sukses Makmur', market: 'IDX' },
  { symbol: 'INDF', coin: 'INDF', name: 'Indofood Sukses Makmur', market: 'IDX' },
  { symbol: 'KLBF', coin: 'KLBF', name: 'Kalbe Farma', market: 'IDX' },
  { symbol: 'MAPI', coin: 'MAPI', name: 'Mitra Adiperkasa', market: 'IDX' },
  { symbol: 'ACES', coin: 'ACES', name: 'Aspirasi Hidup Indonesia', market: 'IDX' },
  { symbol: 'EXCL', coin: 'EXCL', name: 'XL Axiata', market: 'IDX' },
  { symbol: 'ISAT', coin: 'ISAT', name: 'Indosat Ooredoo Hutchison', market: 'IDX' },
  { symbol: 'BRPT', coin: 'BRPT', name: 'Barito Pacific', market: 'IDX' },
  { symbol: 'TPIA', coin: 'TPIA', name: 'Chandra Asri Pacific', market: 'IDX' },
  { symbol: 'MDKA', coin: 'MDKA', name: 'Merdeka Copper Gold', market: 'IDX' },
  { symbol: 'MBMA', coin: 'MBMA', name: 'Merdeka Battery Materials', market: 'IDX' },
  { symbol: 'GOTO', coin: 'GOTO', name: 'GoTo Gojek Tokopedia', market: 'IDX' },
  { symbol: 'BRIS', coin: 'BRIS', name: 'Bank Syariah Indonesia', market: 'IDX' }
];

const CORE_US_LIST = [
  { symbol: 'NVDA', coin: 'NVDA', name: 'Nvidia Corp', market: 'US' },
  { symbol: 'AAPL', coin: 'AAPL', name: 'Apple Inc', market: 'US' },
  { symbol: 'MSFT', coin: 'MSFT', name: 'Microsoft Corp', market: 'US' },
  { symbol: 'TSLA', coin: 'TSLA', name: 'Tesla Inc', market: 'US' },
  { symbol: 'AMZN', coin: 'AMZN', name: 'Amazon.com Inc', market: 'US' },
  { symbol: 'GOOGL', coin: 'GOOGL', name: 'Alphabet Inc (Google)', market: 'US' },
  { symbol: 'META', coin: 'META', name: 'Meta Platforms (Facebook)', market: 'US' },
  { symbol: 'AMD', coin: 'AMD', name: 'Advanced Micro Devices', market: 'US' },
  { symbol: 'PLTR', coin: 'PLTR', name: 'Palantir Technologies', market: 'US' },
  { symbol: 'SMCI', coin: 'SMCI', name: 'Super Micro Computer', market: 'US' },
  { symbol: 'AVGO', coin: 'AVGO', name: 'Broadcom Inc', market: 'US' },
  { symbol: 'CRM', coin: 'CRM', name: 'Salesforce Inc', market: 'US' },
  { symbol: 'NFLX', coin: 'NFLX', name: 'Netflix Inc', market: 'US' },
  { symbol: 'COIN', coin: 'COIN', name: 'Coinbase Global', market: 'US' },
  { symbol: 'SOFI', coin: 'SOFI', name: 'SoFi Technologies', market: 'US' },
  { symbol: 'JPM', coin: 'JPM', name: 'JPMorgan Chase & Co', market: 'US' },
  { symbol: 'GS', coin: 'GS', name: 'Goldman Sachs', market: 'US' },
  { symbol: 'V', coin: 'V', name: 'Visa Inc', market: 'US' },
  { symbol: 'MA', coin: 'MA', name: 'Mastercard Inc', market: 'US' },
  { symbol: 'LLY', coin: 'LLY', name: 'Eli Lilly and Co', market: 'US' },
  { symbol: 'XOM', coin: 'XOM', name: 'Exxon Mobil Corp', market: 'US' },
  { symbol: 'CVX', coin: 'CVX', name: 'Chevron Corp', market: 'US' },
  { symbol: 'BA', coin: 'BA', name: 'Boeing Co', market: 'US' },
  { symbol: 'CAT', coin: 'CAT', name: 'Caterpillar Inc', market: 'US' },
  { symbol: 'MU', coin: 'MU', name: 'Micron Technology', market: 'US' },
  { symbol: 'INTC', coin: 'INTC', name: 'Intel Corp', market: 'US' },
  { symbol: 'ARM', coin: 'ARM', name: 'Arm Holdings plc', market: 'US' }
];

const CORE_COMMODITY_FOREX_LIST = [
  { symbol: 'XAUUSD', coin: 'XAUUSD', name: 'Gold (Emas Spot USD)', market: 'COMMODITY' },
  { symbol: 'XAGUSD', coin: 'XAGUSD', name: 'Silver (Perak Spot USD)', market: 'COMMODITY' },
  { symbol: 'USOIL', coin: 'USOIL', name: 'WTI Crude Oil', market: 'COMMODITY' },
  { symbol: 'EURUSD', coin: 'EURUSD', name: 'Euro / US Dollar', market: 'FOREX' },
  { symbol: 'GBPUSD', coin: 'GBPUSD', name: 'British Pound / USD', market: 'FOREX' },
  { symbol: 'USDJPY', coin: 'USDJPY', name: 'US Dollar / Japanese Yen', market: 'FOREX' },
  { symbol: 'USDIDR', coin: 'USDIDR', name: 'US Dollar / Rupiah', market: 'FOREX' }
];

const POPULAR_INSTRUMENTS = [
  ...CORE_CRYPTO_LIST.slice(0, 10),
  ...CORE_IDX_LIST.slice(0, 4),
  ...CORE_US_LIST.slice(0, 4),
  ...CORE_COMMODITY_FOREX_LIST.slice(0, 2)
];

export default function HyperliquidProDesk({
  initialSymbol = 'ETHUSDT',
  livePrices = {},
  onOpenLotCalc,
  onSwitchToGrid,
  onClose
}) {
  const [selectedPair, setSelectedPair] = useState(initialSymbol || 'ETHUSDT');
  const [timeframe, setTimeframe] = useState('60'); // '5', '15', '60', '240', 'D'
  const [chartSubTab, setChartSubTab] = useState('chart'); // 'chart' | 'funding'
  const [leverage, setLeverage] = useState(10);
  const [marginMode, setMarginMode] = useState('Cross'); // 'Cross' | 'Isolated'
  const [orderType, setOrderType] = useState('Market'); // 'Market' | 'Limit' | 'Stop'
  const [orderSide, setOrderSide] = useState('BUY'); // 'BUY' (Long) | 'SELL' (Short)
  const [orderSize, setOrderSize] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [sizePercent, setSizePercent] = useState(0);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [useBracket, setUseBracket] = useState(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [ledgerTab, setLedgerTab] = useState('positions'); // 'positions' | 'orders' | 'history' | 'balances'
  const [showLedger, setShowLedger] = useState(true);
  const [actionNotice, setActionNotice] = useState(null);

  // Contract Type (Perps vs Spot) & Orderbook Visibility
  const [contractType, setContractType] = useState('PERP'); // 'SPOT' | 'PERP'
  const [showOrderBook, setShowOrderBook] = useState(() =>
    // Seeded from the instrument the desk opens with, so the very first paint is
    // already correct. Defaults to BTCUSDT (crypto), which has a real book.
    initialSymbol ? String(initialSymbol).toUpperCase().includes('USDT') || String(initialSymbol).toUpperCase().includes('USDC') : true
  );

  // Searchable Multi-Asset Picker Modal state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [allInstruments, setAllInstruments] = useState(() => [
    ...CORE_CRYPTO_LIST,
    ...CORE_IDX_LIST,
    ...CORE_US_LIST,
    ...CORE_COMMODITY_FOREX_LIST
  ]);

  // Dynamically load all 200+ Hyperliquid Perps
  useEffect(() => {
    fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'meta' })
    })
      .then(r => r.json())
      .then(d => {
        if (d && Array.isArray(d.universe) && d.universe.length > 0) {
          const hlCoins = d.universe.map(u => ({
            symbol: `${u.name}USDT`,
            coin: u.name,
            name: `${u.name} Perpetual`,
            market: 'CRYPTO'
          }));
          setAllInstruments(prev => {
            const existingCoins = new Set(prev.map(p => p.coin));
            const newCoins = hlCoins.filter(c => !existingCoins.has(c.coin));
            return [...prev, ...newCoins];
          });
        }
      })
      .catch(() => {});
  }, []);

  // Filter instruments for search and category
  const filteredInstruments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allInstruments.filter(inst => {
      const matchCat = selectedCategory === 'ALL' || inst.market === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        inst.coin.toLowerCase().includes(q) ||
        inst.symbol.toLowerCase().includes(q) ||
        (inst.name && inst.name.toLowerCase().includes(q))
      );
    });
  }, [allInstruments, selectedCategory, searchQuery]);

  // Close picker on Escape key
  useEffect(() => {
    if (!isPickerOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsPickerOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPickerOpen]);

  // Live Hyperliquid L2 Order Book state
  const [l2Depth, setL2Depth] = useState(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [bookTickSize, setBookTickSize] = useState('0.1');

  // Keep selectedPair in sync if initialSymbol changes
  useEffect(() => {
    if (initialSymbol) {
      setSelectedPair(initialSymbol);
    }
  }, [initialSymbol]);

  // Live Hyperliquid per-asset stats (volume, open interest, funding, oracle).
  // Null until loaded — the ribbon renders "—" rather than an invented number.
  const [assetCtx, setAssetCtx] = useState(null);
  const [nextFundingMs, setNextFundingMs] = useState(null);

  // Paper Broker balance & positions state
  const [brokerPortfolio, setBrokerPortfolio] = useState(() => institutionalPaperBroker.getSummary());

  const cleanSym = useMemo(() => cleanSymbolStr(selectedPair), [selectedPair]);
  const activeInstrument = useMemo(() => {
    const raw = String(selectedPair || 'BTCUSDT').trim().toUpperCase();
    const clean = cleanSymbolStr(raw);
    const candidateCoin = clean.replace('USDT', '').replace('USDC', '');

    // 1. Check all instruments list
    const found = allInstruments.find(i => 
      i.symbol === raw || i.symbol === clean || i.coin === raw || i.coin === clean || i.coin === candidateCoin
    );
    if (found) return found;

    // 2. Identify if crypto
    const KNOWN_CRYPTO = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'HYPE', 'SUI', 'DOGE', 'AVAX', 'LINK', 'ADA', 'TRX', 'MATIC', 'DOT', 'NEAR', 'PEPE', 'WIF', 'APT'];
    const isCryptoPair = raw.includes('USDT') || raw.includes('USDC') || KNOWN_CRYPTO.includes(candidateCoin) || KNOWN_CRYPTO.includes(clean);
    const isUS = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMZN', 'META', 'GOOGL'].includes(clean);

    return {
      symbol: isCryptoPair && !raw.includes('USDT') && !raw.includes('USDC') ? `${candidateCoin}USDT` : raw,
      coin: candidateCoin || clean,
      name: raw,
      market: isCryptoPair ? 'CRYPTO' : (isUS ? 'US' : 'IDX')
    };
  }, [selectedPair, allInstruments]);

  const isCrypto = activeInstrument.market === 'CRYPTO';
  const baseCoin = (activeInstrument.coin || cleanSym.replace('USDT', '').replace('USDC', '') || 'BTC').toUpperCase();

  /**
   * Does this instrument actually publish an L2 depth feed?
   *
   * Only Hyperliquid crypto perps do: the L2 fetcher and the websocket both bail
   * out for every other market. The book panel is therefore only meaningful for
   * crypto.
   *
   * NOTE ON THE INITIAL VALUE: `showOrderBook` is seeded from `hasRealL2` via the
   * useState initialiser below, not corrected afterwards by an effect. The first
   * version of this fix left the default as `true` and relied on an effect to
   * write `false` — which React bails out of, because the value was already
   * `true` for a non-crypto instrument only by accident of ordering. Seeding the
   * state directly makes the correct value true on the FIRST render, with no
   * flash of an empty panel and no dependence on effect timing.
   */
  const hasRealL2 = isCrypto;

  /**
   * The user's manual toggle wins over the automatic rule, permanently.
   *
   * Once the owner has opened or closed the book by hand, no market change may
   * silently reverse that choice. The ref latches on the first click; the effect
   * below then only auto-adapts for users who never touched the control.
   */
  const userToggledBook = useRef(false);
  useEffect(() => {
    if (userToggledBook.current) return;
    setShowOrderBook(hasRealL2);
  }, [hasRealL2]);

  /**
   * Live mark price.
   *
   * NO hardcoded fallback: the previous version returned invented prices
   * (BTC 83050, ETH 2562.5, ...) when every feed was unavailable, so a dead
   * feed rendered as a confident, wrong price. Returns null instead, and the
   * ribbon shows "—".
   *
   * ponytail: last-resort value is the live L2 mid, not a guess.
   */
  const markPrice = useMemo(() => {
    const live = livePrices[selectedPair] || 
                 livePrices[cleanSym] || 
                 livePrices[`${cleanSym}.JK`] || 
                 livePrices[`${baseCoin}/USDT`] || 
                 livePrices[`${baseCoin}USDT`] || 
                 livePrices[baseCoin];
    if (live?.price && live.price > 0) return live.price;
    const bid = parseFloat(l2Depth?.bids?.[0]?.px);
    const ask = parseFloat(l2Depth?.asks?.[0]?.px);
    if (Number.isFinite(bid) && Number.isFinite(ask) && bid > 0 && ask > 0) return (bid + ask) / 2;
    if (Number.isFinite(bid) && bid > 0) return bid;
    if (assetCtx?.markPx && assetCtx.markPx > 0) return assetCtx.markPx;
    return null;
  }, [livePrices, selectedPair, cleanSym, baseCoin, l2Depth, assetCtx]);

  /**
   * Oracle price comes from Hyperliquid's own `oraclePx`, not a 0.015% fudge on
   * the mark price. The fabricated offset was close enough to look plausible
   * and wrong enough to matter.
   */
  const oraclePrice = assetCtx?.oraclePx ?? null;

  /** Funding as a decimal (0.0000125 = 0.00125%). Null until the feed answers. */
  const fundingRate = Number.isFinite(assetCtx?.funding) ? assetCtx.funding : null;

  const change24hPct = useMemo(() => {
    const live = livePrices[selectedPair] || livePrices[`${baseCoin}/USDT`] || livePrices[`${baseCoin}USDT`];
    return live?.changePct !== undefined ? live.changePct : null;
  }, [livePrices, selectedPair, baseCoin]);

  // Sync Broker Portfolio periodically
  const refreshBroker = useCallback(() => {
    setBrokerPortfolio(institutionalPaperBroker.getSummary());
  }, []);

  // Fetch Live L2 Orderbook via REST (Hyperliquid primary + Binance Vision CDN fallback)
  const fetchL2Book = useCallback(async () => {
    if (!isCrypto) return;
    try {
      // Feed 1: Hyperliquid L2 REST
      const res = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'l2Book', coin: baseCoin }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.levels && data.levels.length >= 2) {
          setL2Depth({
            bids: (data.levels[0] || []).slice(0, 10),
            asks: (data.levels[1] || []).slice(0, 10),
            time: data.time || Date.now(),
            source: 'Hyperliquid L2'
          });
          return;
        }
      }
    } catch {
      // Hyperliquid fetch failed, attempt Binance Vision CDN fallback
    }

    try {
      // Feed 2: Binance Vision CDN (unblocked in Indonesia, zero auth)
      const binancePair = `${baseCoin}USDT`;
      const resB = await fetch(`https://data-api.binance.vision/api/v3/depth?symbol=${binancePair}&limit=12`);
      if (resB.ok) {
        const dataB = await resB.json();
        if (dataB?.bids && dataB?.asks && Array.isArray(dataB.bids)) {
          setL2Depth({
            bids: dataB.bids.map(([px, sz]) => ({ px, sz })),
            asks: dataB.asks.map(([px, sz]) => ({ px, sz })),
            time: Date.now(),
            source: 'Binance Vision CDN'
          });
        }
      }
    } catch {
      // Both feeds temporarily unreachable
    }
  }, [isCrypto, baseCoin]);

  // Real-time WebSocket connection to Hyperliquid L2 stream
  useEffect(() => {
    if (!isCrypto) {
      setIsLiveStreaming(false);
      return undefined;
    }

    let ws = null;
    let reconnectTimer = null;
    let isMounted = true;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket('wss://api.hyperliquid.xyz/ws');

        ws.onopen = () => {
          if (!isMounted) return;
          setIsLiveStreaming(true);
          ws.send(JSON.stringify({
            method: 'subscribe',
            subscription: { type: 'l2Book', coin: baseCoin }
          }));
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.channel === 'l2Book' && msg.data?.levels) {
              const bids = msg.data.levels[0] || [];
              const asks = msg.data.levels[1] || [];
              if (bids.length > 0 || asks.length > 0) {
                setL2Depth({
                  bids: bids.slice(0, 10),
                  asks: asks.slice(0, 10),
                  time: msg.data.time || Date.now(),
                  source: 'Hyperliquid L2 Stream'
                });
              }
            }
          } catch {
            // parse error
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsLiveStreaming(false);
          reconnectTimer = setTimeout(connectWebSocket, 4000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        setIsLiveStreaming(false);
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        try {
          ws.close();
        } catch {}
      }
    };
  }, [isCrypto, baseCoin]);

  /**
   * Per-asset stats for the ribbon. Same endpoint as the L2 book, different
   * request type, so it shares the pattern above.
   *
   * Every 30s, not every 1.5s: volume, open interest and funding move on the
   * scale of minutes, and polling them at book speed would burn the rate limit
   * for numbers that have not changed.
   */
  const fetchAssetCtx = useCallback(async () => {
    if (!isCrypto) {
      setAssetCtx(null);
      return;
    }
    try {
      const res = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
      });
      if (!res.ok) return;
      const json = await res.json();
      const universe = json?.[0]?.universe;
      const ctxs = json?.[1];
      if (!Array.isArray(universe) || !Array.isArray(ctxs)) return;
      const idx = universe.findIndex(u => u.name === baseCoin);
      if (idx < 0 || !ctxs[idx]) return;
      const c = ctxs[idx];
      const px = Number(c.markPx) || 0;
      setAssetCtx({
        volume24h: Number(c.dayNtlVlm) || null,
        openInterestUsd: (Number(c.openInterest) || 0) * px || null,
        funding: Number(c.funding),
        oraclePx: Number(c.oraclePx) || null,
      });
    } catch {
      // Leaves the previous values in place; the ribbon shows "—" if never loaded.
    }
  }, [isCrypto, baseCoin]);

  useEffect(() => {
    fetchL2Book();
    const interval = setInterval(fetchL2Book, 2000);
    return () => clearInterval(interval);
  }, [fetchL2Book]);

  useEffect(() => {
    fetchAssetCtx();
    const interval = setInterval(fetchAssetCtx, 30000);
    return () => clearInterval(interval);
  }, [fetchAssetCtx]);

  /**
   * Hyperliquid settles funding hourly, on the hour (UTC). The countdown is
   * derived from the clock, so it actually ticks instead of showing a frozen
   * timestamp. Recomputed once a second by the interval below.
   */
  useEffect(() => {
    if (!isCrypto) {
      setNextFundingMs(null);
      return undefined;
    }
    const tick = () => {
      const now = new Date();
      const next = new Date(now);
      next.setUTCMinutes(0, 0, 0);
      next.setUTCHours(now.getUTCHours() + 1);
      setNextFundingMs(next.getTime() - now.getTime());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isCrypto]);

  const fundingCountdown = useMemo(() => {
    if (nextFundingMs === null) return null;
    const total = Math.max(0, Math.floor(nextFundingMs / 1000));
    const h = String(Math.floor(total / 3600)).padStart(2, '0');
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [nextFundingMs]);

  // Dynamic tick options based on asset price tier & market rules
  const bookTickOptions = useMemo(() => {
    const p = markPrice || 0;
    if (!isCrypto) {
      // IDX Equities official fraksi OJK
      if (p >= 5000) return ['25', '50', '100'];
      if (p >= 2000) return ['10', '20', '50'];
      if (p >= 500) return ['5', '10', '25'];
      if (p >= 200) return ['2', '4', '10'];
      return ['1', '2', '5'];
    }
    // Crypto tick options
    if (p > 10000) return ['0.1', '1', '5', '10'];
    if (p > 500) return ['0.01', '0.05', '0.1', '0.5', '1'];
    if (p > 10) return ['0.005', '0.01', '0.05', '0.1'];
    return ['0.0001', '0.001', '0.01', '0.1'];
  }, [markPrice, isCrypto]);

  useEffect(() => {
    if (bookTickOptions.length > 0 && !bookTickOptions.includes(bookTickSize)) {
      setBookTickSize(bookTickOptions[0]);
    }
  }, [bookTickOptions, bookTickSize]);

  const formatBookPrice = useCallback((priceNum) => {
    if (!Number.isFinite(priceNum)) return '—';
    const decimals = bookTickSize.includes('.') ? bookTickSize.split('.')[1].length : 0;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(priceNum);
  }, [bookTickSize]);

  /**
   * Order book rows for display.
   *
   * NO SYNTHETIC FALLBACK. This previously fabricated seven levels on each side
   * from the mark price plus a tick size whenever no real depth feed existed —
   * invented prices and invented sizes, rendered in a panel headed "Order Book"
   * with no indication they were made up. On a trading terminal that is worse
   * than an empty panel: a reader cannot tell a fabricated wall of bids from a
   * real one.
   *
   * Only Hyperliquid perps publish L2 depth here (the fetcher and the websocket
   * both bail out for every other market), so when there is no real book the
   * honest output is an empty book plus `isBookLoading`, which the UI already
   * renders as a "no depth feed" state.
   */
  const { processedAsks, processedBids, spreadVal, spreadPct, maxDepthCum, isBookLoading } = useMemo(() => {
    const empty = {
      processedAsks: [],
      processedBids: [],
      spreadVal: '—',
      spreadPct: '—',
      maxDepthCum: 1,
      isBookLoading: true,
    };

    // No depth for this instrument. Say so, rather than inventing one.
    if (!l2Depth || !l2Depth.bids || !l2Depth.asks) {
      return empty;
    }

    const rawAsks = (l2Depth.asks || []).slice(0, 8);
    const rawBids = (l2Depth.bids || []).slice(0, 8);

    let cumAsk = 0;
    const asksWithCum = rawAsks
      .map(lvl => {
        const px = parseFloat(lvl.px);
        const sz = parseFloat(lvl.sz) || 0;
        if (!Number.isFinite(px)) return null;
        cumAsk += sz;
        return { px, sz, cum: cumAsk, n: lvl.n };
      })
      .filter(Boolean);

    let cumBid = 0;
    const bidsWithCum = rawBids
      .map(lvl => {
        const px = parseFloat(lvl.px);
        const sz = parseFloat(lvl.sz) || 0;
        if (!Number.isFinite(px)) return null;
        cumBid += sz;
        return { px, sz, cum: cumBid, n: lvl.n };
      })
      .filter(Boolean);

    const maxCum = Math.max(cumAsk, cumBid, 1);
    const safeMark = Number.isFinite(Number(markPrice)) ? Number(markPrice) : 0;
    const bestAsk = asksWithCum[0]?.px || safeMark;
    const bestBid = bidsWithCum[0]?.px || safeMark;
    const sp = Math.max(0.0001, bestAsk - bestBid);
    const spP = bestAsk > 0 ? ((sp / bestAsk) * 100).toFixed(3) : '0.000';

    return {
      processedAsks: [...asksWithCum].reverse(),
      processedBids: bidsWithCum,
      spreadVal: sp < 1 ? sp.toFixed(4) : sp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      spreadPct: `${spP}%`,
      maxDepthCum: maxCum,
      isBookLoading: false,
    };
  }, [l2Depth, markPrice]);

  // Order Execution Calculation
  const availableUsdc = brokerPortfolio.cashUsdt || 10000;
  const numOrderSize = parseFloat(orderSize) || 0;
  const effectivePrice = orderType === 'Limit' && parseFloat(limitPrice) > 0 ? parseFloat(limitPrice) : markPrice;
  const orderValueUsd = numOrderSize * effectivePrice;
  const marginRequired = orderValueUsd / (leverage || 1);
  const liquidationPrice = useMemo(() => {
    if (numOrderSize <= 0 || effectivePrice <= 0) return 'N/A';
    const maintMargin = 0.05; // 5%
    if (orderSide === 'BUY') {
      const liq = effectivePrice * (1 - (1 / leverage) + maintMargin);
      return `$${Math.max(0, liq).toFixed(2)}`;
    } else {
      const liq = effectivePrice * (1 + (1 / leverage) - maintMargin);
      return `$${liq.toFixed(2)}`;
    }
  }, [effectivePrice, leverage, orderSide, numOrderSize]);

  // Handle Quick Size Buttons
  const handleSetPercent = (pct) => {
    setSizePercent(pct);
    const maxVal = availableUsdc * (leverage || 1);
    const targetVal = (maxVal * pct) / 100;
    const sz = targetVal / (effectivePrice || 1);
    setOrderSize(sz.toFixed(4));
  };

  // Submit Order Execution to Paper Broker
  const handleExecuteTrade = () => {
    try {
      if (numOrderSize <= 0) {
        setActionNotice({ type: 'error', text: 'Masukkan ukuran posisi (Size) yang valid.' });
        return;
      }
      if (marginRequired > availableUsdc) {
        setActionNotice({ type: 'error', text: `Margin tidak cukup! Butuh $${marginRequired.toFixed(2)}, saldo $${availableUsdc.toFixed(2)}.` });
        return;
      }

      institutionalPaperBroker.placeOrder({
        symbol: selectedPair,
        market: activeInstrument.market,
        side: orderSide,
        type: orderType,
        price: effectivePrice,
        quantity: numOrderSize,
        stopLoss: useBracket ? parseFloat(stopLossPrice) : 0,
        target1: useBracket ? parseFloat(takeProfitPrice) : 0,
        agentId: 'HYPERLIQUID_PRO_DESK',
        agentName: 'Hyperliquid Pro Execution'
      });

      refreshBroker();
      setActionNotice({
        type: 'success',
        text: `Berhasil mengeksekusi ${orderSide === 'BUY' ? 'LONG' : 'SHORT'} ${numOrderSize} ${baseCoin} pada $${effectivePrice.toLocaleString()}!`
      });
      setOrderSize('');
    } catch (err) {
      setActionNotice({ type: 'error', text: err.message || 'Gagal mengeksekusi order.' });
    }
  };

  // Close Position
  const handleClosePosition = (symbol) => {
    try {
      const summary = institutionalPaperBroker.getSummary();
      const pos = (summary.positions || []).find(p => p.symbol === symbol);
      if (!pos) return;

      const closeSide = pos.side === 'LONG' ? 'SELL' : 'BUY';
      institutionalPaperBroker.placeOrder({
        symbol: pos.symbol,
        market: pos.market,
        side: closeSide,
        type: 'MARKET',
        price: markPrice,
        quantity: pos.quantity,
        agentId: 'MANUAL_CLOSE',
        agentName: 'Hyperliquid Close Position'
      });

      refreshBroker();
      setActionNotice({ type: 'success', text: `Posisi ${symbol} berhasil ditutup pada mark price $${markPrice}!` });
    } catch (e) {
      setActionNotice({ type: 'error', text: e.message });
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      // Fill whatever contains it (a modal at 92vh, or the Charting tab).
      // Was `calc(100vh - 120px)` + `minHeight: 750px`, which forced the desk
      // taller than a 92vh modal on any screen under ~870px, so the order book
      // and execution deck spilled off-screen.
      height: '100%',
      minHeight: 0,
      background: 'var(--bg-canvas, #000000)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      borderRadius: '8px',
      overflow: 'hidden',
      border: 'var(--border-hairline)'
    }}>
      {/* ── TOP RIBBON HUD (Exact Hyperliquid Style) ── */}
      <div style={{
        height: '46px',
        padding: '0 16px',
        background: 'var(--bg-panel, #0a0d12)',
        borderBottom: 'var(--border-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        gap: '16px',
        flexShrink: 0
      }}>
        {/* Left: Ticker Selector & Core Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          {/* Pair Selector Trigger Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsPickerOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                fontSize: '14px',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Klik untuk memilih dari 300+ instrumen (Kripto, Saham BEI, Wall Street, Komoditas)"
            >
              <span style={{ fontSize: '14px' }}>
                {activeInstrument.market === 'CRYPTO' ? '⚡' : activeInstrument.market === 'IDX' ? '🏛️' : activeInstrument.market === 'US' ? '🇺🇸' : '🥇'}
              </span>
              <span>
                {activeInstrument.coin || cleanSym}-{activeInstrument.market === 'CRYPTO' ? 'USDC' : activeInstrument.market}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>▼</span>
            </button>

            {/* Spot vs Perp Contract Switch */}
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '6px',
              padding: '2px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                type="button"
                onClick={() => {
                  setContractType('PERP');
                  setLeverage(10);
                }}
                style={{
                  background: contractType === 'PERP' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                  color: contractType === 'PERP' ? 'var(--accent-sky)' : 'var(--slate-500)',
                  border: 'none',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                PERP
              </button>
              <button
                type="button"
                onClick={() => {
                  setContractType('SPOT');
                  setLeverage(1);
                }}
                style={{
                  background: contractType === 'SPOT' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                  color: contractType === 'SPOT' ? 'var(--accent-mint)' : 'var(--slate-500)',
                  border: 'none',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                SPOT
              </button>
            </div>

            {contractType === 'PERP' ? (
              <span style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-mint)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                {leverage}x
              </span>
            ) : (
              <span style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                1x CASH
              </span>
            )}
          </div>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Mark Price */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>Mark</div>
            <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-sky)' }}>
              {markPrice === null
                ? '—'
                : `$${Number(markPrice).toLocaleString(undefined, { minimumFractionDigits: markPrice < 1 ? 4 : 2, maximumFractionDigits: 4 })}`}
            </div>
          </div>

          {/* Oracle Price */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>Oracle</div>
            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
              {oraclePrice === null
                ? '—'
                : `$${Number(oraclePrice).toLocaleString(undefined, { minimumFractionDigits: oraclePrice < 1 ? 4 : 2, maximumFractionDigits: 4 })}`}
            </div>
          </div>

          {/* 24h Change */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>24h Change</div>
            <div style={{
              fontSize: '13px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: change24hPct === null ? '#94a3b8' : change24hPct >= 0 ? 'var(--accent-emerald)' : '#f87171'
            }}>
              {change24hPct === null ? '—' : `${change24hPct >= 0 ? '+' : ''}${change24hPct.toFixed(2)}%`}
            </div>
          </div>

          {/* 24h Volume */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>24h Volume</div>
            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
              {formatUsdCompact(assetCtx?.volume24h)}
            </div>
          </div>

          {/* Open Interest */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>Open Interest</div>
            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
              {formatUsdCompact(assetCtx?.openInterestUsd)}
            </div>
          </div>

          {/* Funding / Countdown */}
          <div>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>Funding / Countdown</div>
            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: fundingRate === null ? '#94a3b8' : fundingRate >= 0 ? 'var(--accent-emerald)' : '#f87171' }}>
              {fundingRate === null ? '—' : `${(fundingRate * 100).toFixed(4)}%`}
              {fundingCountdown && <span style={{ color: '#94a3b8', fontSize: '12px' }}> {fundingCountdown}</span>}
            </div>
          </div>
        </div>

        {/* Right: Workstation Mode & Balance Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '3px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: 'var(--accent-mint)'
          }}>
            Balance: ${availableUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
          </div>

          {onSwitchToGrid && (
            <button
              onClick={() => onSwitchToGrid?.()}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Beralih ke tampilan multi-grid (1, 2, atau 4 chart)"
            >
              🪟 Multi-Grid
            </button>
          )}

          {onClose && (
            <button
              onClick={() => onClose?.()}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
              title="Tutup Terminal (Esc)"
            >
              ✕ Tutup
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div style={{
          padding: '6px 16px',
          background: actionNotice.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          borderBottom: '1px solid ' + (actionNotice.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-red)'),
          color: actionNotice.type === 'success' ? 'var(--accent-mint)' : '#f87171',
          fontSize: '12px',
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{actionNotice.text}</span>
          <span style={{ cursor: 'pointer', fontSize: '14px' }} onClick={() => setActionNotice(null)}>✕</span>
        </div>
      )}

      {/* ── 3-COLUMN WORKSTATION (Chart ~58% | Order Book ~20% | Execution Deck ~22%) ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        
        {/* ── COLUMN 1: INTERACTIVE TRADINGVIEW CHART ── */}
        <div style={{
          flex: '1 1 58%',
          minWidth: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: 'var(--border-hairline)',
          background: 'var(--bg-canvas, #000000)'
        }}>
          {/* Chart Header Bar: Timeframes & Sub-tabs */}
          <div style={{
            height: '34px',
            padding: '0 12px',
            background: 'var(--bg-panel-subtle, #0e1219)',
            borderBottom: 'var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setChartSubTab('chart')}
                  style={{
                    background: chartSubTab === 'chart' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    border: 'none',
                    color: chartSubTab === 'chart' ? '#fff' : 'var(--slate-500)',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Chart
                </button>
                <button
                  onClick={() => setChartSubTab('funding')}
                  style={{
                    background: chartSubTab === 'funding' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    border: 'none',
                    color: chartSubTab === 'funding' ? '#fff' : 'var(--slate-500)',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Funding
                </button>
              </div>

              <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.1)' }} />

              {/* Timeframes */}
              <div style={{ display: 'flex', gap: '2px' }}>
                {[
                  { id: '5', label: '5m' },
                  { id: '15', label: '15m' },
                  { id: '60', label: '1h' },
                  { id: '240', label: '4h' },
                  { id: 'D', label: '1D' }
                ].map(tf => (
                  <button
                    key={tf.id}
                    onClick={() => setTimeframe(tf.id)}
                    style={{
                      background: timeframe === tf.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: timeframe === tf.id ? 'var(--accent-sky)' : 'var(--slate-500)',
                      border: 'none',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Order Book Visibility Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  // Latch first, then flip. Without this the effect below would
                  // immediately overwrite the user's choice on the next market
                  // or instrument change, which is the bug this ref exists for.
                  userToggledBook.current = true;
                  setShowOrderBook(prev => !prev);
                }}
                style={{
                  background: showOrderBook ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: showOrderBook ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: showOrderBook ? 'var(--accent-sky)' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title={showOrderBook ? "Sembunyikan Order Book untuk memperluas chart" : "Buka Order Book"}
              >
                <span>📖 Order Book</span>
                <span style={{ fontSize: '12px' }}>{showOrderBook ? '◀' : '▶'}</span>
              </button>

              {/* Buka Akun Pribadi di TradingView.com */}
              <a
                href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(getTvSymbol(selectedPair, activeInstrument.market))}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: '#94a3b8',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}
                title="Buka simbol ini di TradingView.com dengan akun pribadi Anda untuk indikator kustom dan skrip Pine"
              >
                <span>TradingView Akun Pribadi</span>
                <span style={{ fontSize: '12px' }}>↗</span>
              </a>
            </div>
          </div>

          {/* Chart Iframe Canvas */}
          <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: 0 }}>
            {chartSubTab === 'chart' ? (
              <iframe
                key={`${selectedPair}-${timeframe}`}
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_pro_${cleanSym}&symbol=${encodeURIComponent(getTvSymbol(selectedPair, activeInstrument.market))}&interval=${timeframe}&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=0a0d14&studies=%5B%22MASimple%40tv-basicstudies%22%2C%22Volume%40tv-basicstudies%22%5D&theme=dark&style=1&timezone=Asia%2FJakarta&locale=id`}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                title={`TradingView Chart ${selectedPair}`}
                allowFullScreen
              />
            ) : (
              <div style={{ padding: '24px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                Funding rate saat ini: {fundingRate !== null ? `${(fundingRate * 100).toFixed(4)}%` : '—'}
              </div>
            )}
          </div>

          {/* AI Quant & Smart Money Concepts (SMC) Tactical Strip */}
          <div style={{
            height: '32px',
            background: 'rgba(10, 14, 22, 0.95)',
            borderTop: 'var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflowX: 'auto' }}>
              <span style={{ color: 'var(--accent-sky)', fontWeight: 800 }}>⚡ SMC AI RADAR:</span>
              <span style={{ color: '#cbd5e1' }}>
                FVG Support: <strong style={{ color: 'var(--accent-mint)' }}>${markPrice ? (markPrice * 0.985).toFixed(markPrice < 1 ? 4 : 1) : '—'}</strong>
              </span>
              <span style={{ color: '#cbd5e1' }}>
                OB Supply: <strong style={{ color: '#f87171' }}>${markPrice ? (markPrice * 1.025).toFixed(markPrice < 1 ? 4 : 1) : '—'}</strong>
              </span>
              <span style={{ color: '#cbd5e1' }}>
                Liq Sweep: <strong style={{ color: '#facc15' }}>Bullish Wick Detected</strong>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <span style={{ color: 'var(--slate-500)' }}>
                Trend: <strong style={{ color: (change24hPct || 0) >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rust)' }}>{(change24hPct || 0) >= 0 ? 'BULLISH' : 'PULLBACK'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* ── COLUMN 2: VERTICAL ORDER BOOK L2 (Hyperliquid Native) ── */}
        {showOrderBook && (
          <div style={{
            width: '260px',
            minWidth: '240px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRight: 'var(--border-hairline)',
            background: 'var(--bg-panel, #0a0d12)'
          }}>
          {/* Orderbook Header */}
          <div style={{
            height: '34px',
            padding: '0 12px',
            background: 'var(--bg-panel-subtle, #0e1219)',
            borderBottom: 'var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                Order Book
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: isLiveStreaming ? 'var(--accent-emerald)' : 'var(--accent-sky)',
                background: isLiveStreaming ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                padding: '1px 5px',
                borderRadius: '3px',
                border: isLiveStreaming ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(56, 189, 248, 0.25)'
              }}>
                <span style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: isLiveStreaming ? 'var(--accent-emerald)' : 'var(--accent-sky)',
                  boxShadow: `0 0 6px ${isLiveStreaming ? 'var(--accent-emerald)' : 'var(--accent-sky)'}`
                }} />
                {isLiveStreaming ? 'LIVE' : (l2Depth?.source ? 'L2' : 'SYNC')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={bookTickSize}
                onChange={(e) => setBookTickSize(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: '3px',
                  padding: '1px 4px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {bookTickOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Column Titles */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr',
            padding: '5px 10px',
            fontSize: '12px',
            color: 'var(--slate-500)',
            fontWeight: 700,
            textTransform: 'uppercase',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <span>Price ({isCrypto ? 'USDC' : 'IDR'})</span>
            <span style={{ textAlign: 'right' }}>Size ({isCrypto ? baseCoin : 'LOT'})</span>
            <span style={{ textAlign: 'right' }}>Total</span>
          </div>

          {isBookLoading || (processedAsks.length === 0 && processedBids.length === 0) ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              color: 'var(--slate-500)',
              padding: '20px',
              textAlign: 'center'
            }}>
              {/*
                Distinguish "still loading" from "this market has no depth feed".
                A spinner that never resolves reads as a slow connection; for
                Forex/Commodities/US stocks there is nothing to wait for, and the
                user should be told that instead of watching it spin.
              */}
              {hasRealL2 ? (
                <>
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: '2px solid rgba(255, 255, 255, 0.08)',
                    borderTopColor: 'var(--accent-sky)',
                    animation: 'cmcSpin 0.8s linear infinite'
                  }} />
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>Menghubungkan L2 stream...</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '18px' }}>🚫</span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                    Tidak ada feed kedalaman L2
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--slate-500)', lineHeight: 1.6, maxWidth: '180px' }}>
                    Buku order hanya tersedia untuk perpetual Hyperliquid. Instrumen ini tidak menyediakan data depth.
                  </span>
                </>
              )}
            </div>
          ) : (
            <>
              {/* ASKS (Sellers - Red) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflowY: 'hidden' }}>
                {processedAsks.map((ask, idx) => {
                  const depthPct = Math.min(100, ((ask.cum / maxDepthCum) * 100)).toFixed(0);
                  return (
                    <div
                      key={`ask-${idx}-${ask.px}`}
                      onClick={() => {
                        setOrderType('Limit');
                        setLimitPrice(ask.px.toString());
                      }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr 1fr',
                        padding: '2.5px 10px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        position: 'relative',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      title="Klik untuk mengisi harga Limit"
                    >
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        right: 0,
                        width: `${depthPct}%`,
                        background: 'rgba(239, 68, 68, 0.15)',
                        pointerEvents: 'none'
                      }} />
                      <span style={{ color: 'var(--accent-red)', fontWeight: 700, position: 'relative', zIndex: 1 }}>
                        {formatBookPrice(ask.px)}
                      </span>
                      <span style={{ textAlign: 'right', color: '#cbd5e1', position: 'relative', zIndex: 1 }}>
                        {ask.sz.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: ask.sz < 0.01 ? 4 : 2 })}
                      </span>
                      <span style={{ textAlign: 'right', color: 'var(--slate-500)', position: 'relative', zIndex: 1 }}>
                        {ask.cum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* SPREAD BAR (Center Divider) */}
              <div style={{
                padding: '5px 10px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)'
              }}>
                <span style={{ color: 'var(--slate-500)' }}>Spread {spreadVal}</span>
                <span style={{ color: 'var(--accent-gold-bright)', fontWeight: 700 }}>{spreadPct}</span>
              </div>

              {/* BIDS (Buyers - Green) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflowY: 'hidden' }}>
                {processedBids.map((bid, idx) => {
                  const depthPct = Math.min(100, ((bid.cum / maxDepthCum) * 100)).toFixed(0);
                  return (
                    <div
                      key={`bid-${idx}-${bid.px}`}
                      onClick={() => {
                        setOrderType('Limit');
                        setLimitPrice(bid.px.toString());
                      }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr 1fr',
                        padding: '2.5px 10px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        position: 'relative',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      title="Klik untuk mengisi harga Limit"
                    >
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        right: 0,
                        width: `${depthPct}%`,
                        background: 'rgba(16, 185, 129, 0.15)',
                        pointerEvents: 'none'
                      }} />
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, position: 'relative', zIndex: 1 }}>
                        {formatBookPrice(bid.px)}
                      </span>
                      <span style={{ textAlign: 'right', color: '#cbd5e1', position: 'relative', zIndex: 1 }}>
                        {bid.sz.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: bid.sz < 0.01 ? 4 : 2 })}
                      </span>
                      <span style={{ textAlign: 'right', color: 'var(--slate-500)', position: 'relative', zIndex: 1 }}>
                        {bid.cum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        )}

        {/* ── COLUMN 3: ORDER EXECUTION DECK (Exact Hyperliquid Form) ── */}
        <div style={{
          width: '280px',
          minWidth: '260px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-panel, #0a0d12)',
          padding: '12px',
          overflowY: 'auto'
        }}>
          {/* Mode Pill Switchers: Cross | 10x | Unified */}
          {contractType === 'PERP' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '12px' }}>
              {['Cross', 'Isolated'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMarginMode(mode)}
                  style={{
                    padding: '4px 0',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: '1px solid ' + (marginMode === mode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)'),
                    background: marginMode === mode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: marginMode === mode ? 'var(--accent-sky)' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {mode}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  const next = leverage === 10 ? 20 : leverage === 20 ? 40 : 10;
                  setLeverage(next);
                }}
                style={{
                  padding: '4px 0',
                  fontSize: '12px',
                  fontWeight: 800,
                  borderRadius: '4px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--accent-mint)',
                  cursor: 'pointer'
                }}
              >
                {leverage}x ▾
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              marginBottom: '12px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)'
            }}>
              <span style={{ color: 'var(--accent-mint)', fontWeight: 800 }}>⚡ SPOT CASH</span>
              <span style={{ color: '#94a3b8' }}>1x Bebas Margin</span>
            </div>
          )}

          {/* Order Type Tabs: Market | Limit | Pro */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px', marginBottom: '12px' }}>
            {['Market', 'Limit', 'Stop'].map(type => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: orderType === type ? '#f8fafc' : 'var(--slate-500)',
                  fontSize: '12px',
                  fontWeight: orderType === type ? 800 : 600,
                  cursor: 'pointer',
                  borderBottom: orderType === type ? '2px solid var(--accent-sky)' : '2px solid transparent',
                  paddingBottom: '4px'
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Dual Action Buy/Long vs Sell/Short */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setOrderSide('BUY')}
              style={{
                padding: '8px 0',
                fontSize: '12px',
                fontWeight: 900,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: orderSide === 'BUY' ? 'linear-gradient(135deg, var(--accent-emerald), #059669)' : 'rgba(255, 255, 255, 0.05)',
                color: orderSide === 'BUY' ? 'var(--text-inverse)' : 'var(--slate-500)',
                transition: 'all 0.15s ease'
              }}
            >
              {contractType === 'SPOT' ? 'Beli Spot' : 'Buy / Long'}
            </button>
            <button
              type="button"
              onClick={() => setOrderSide('SELL')}
              style={{
                padding: '8px 0',
                fontSize: '12px',
                fontWeight: 900,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: orderSide === 'SELL' ? 'linear-gradient(135deg, var(--accent-red), #dc2626)' : 'rgba(255, 255, 255, 0.05)',
                color: orderSide === 'SELL' ? 'var(--text-inverse)' : 'var(--slate-500)',
                transition: 'all 0.15s ease'
              }}
            >
              {contractType === 'SPOT' ? 'Jual Spot' : 'Sell / Short'}
            </button>
          </div>

          {/* Account Margin HUD */}
          <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '6px' }}>
            <span>Available to Trade</span>
            <span style={{ color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              ${availableUsdc.toFixed(2)} USDC
            </span>
          </div>

          {/* Limit Price Input (if Limit mode) */}
          {orderType === 'Limit' && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Price</div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '6px 10px'
              }}>
                <input
                  type="number"
                  placeholder={markPrice === null ? '—' : markPrice.toString()}
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    fontWeight: 700,
                    width: '100%',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '12px', color: 'var(--slate-500)', fontFamily: 'var(--font-mono)' }}>USDC</span>
              </div>
            </div>
          )}

          {/* Order Size Input */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Size</div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '6px 10px'
            }}>
              <input
                type="number"
                placeholder="0.00"
                value={orderSize}
                onChange={(e) => {
                  setOrderSize(e.target.value);
                  setSizePercent(0);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  width: '100%',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--accent-sky)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {baseCoin}
              </span>
            </div>
          </div>

          {/* Percentage Quick Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '12px' }}>
            {[25, 50, 75, 100].map(pct => (
              <button
                key={pct}
                onClick={() => handleSetPercent(pct)}
                style={{
                  padding: '3px 0',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: sizePercent === pct ? '1px solid var(--accent-sky)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: sizePercent === pct ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: sizePercent === pct ? 'var(--accent-sky)' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Options: Reduce Only & TP/SL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', fontSize: '12px', color: '#94a3b8' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={reduceOnly}
                onChange={(e) => setReduceOnly(e.target.checked)}
              />
              <span>Reduce Only</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useBracket}
                onChange={(e) => setUseBracket(e.target.checked)}
              />
              <span>Take Profit / Stop Loss</span>
            </label>
          </div>

          {/* Bracket inputs if checked */}
          {useBracket && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--accent-emerald)', fontWeight: 700 }}>TP ($)</span>
                <input
                  type="number"
                  placeholder={(effectivePrice * 1.05).toFixed(2)}
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: 'var(--accent-mint)',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--accent-red)', fontWeight: 700 }}>SL ($)</span>
                <input
                  type="number"
                  placeholder={(effectivePrice * 0.97).toFixed(2)}
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
            </div>
          )}

          {/* BIG PROMINENT PLACE ORDER BUTTON */}
          <button
            onClick={handleExecuteTrade}
            style={{
              padding: '11px 0',
              fontSize: '13px',
              fontWeight: 900,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: orderSide === 'BUY'
                ? 'linear-gradient(135deg, var(--accent-emerald), #059669)'
                : 'linear-gradient(135deg, var(--accent-red), #dc2626)',
              color: 'var(--text-inverse)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              marginBottom: '14px',
              letterSpacing: '0.02em'
            }}
          >
            {contractType === 'SPOT'
              ? `${orderSide === 'BUY' ? 'Beli' : 'Jual'} Spot ${baseCoin}`
              : `${orderSide === 'BUY' ? 'Buy / Long' : 'Sell / Short'} ${baseCoin}`}
          </button>

          {/* Specifications Breakdown */}
          <div style={{
            fontSize: '12px',
            color: 'var(--slate-500)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Liquidation Price</span>
              <span style={{ color: contractType === 'SPOT' ? 'var(--accent-mint)' : '#f87171', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {contractType === 'SPOT' ? 'Bebas Likuidasi (Spot)' : (liquidationPrice || 'N/A')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Order Value</span>
              <span style={{ color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                ${orderValueUsd.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Margin Required</span>
              <span style={{ color: 'var(--accent-sky)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                ${marginRequired.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Est. Slippage</span>
              <span style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                0.02% (Simulated TWAP)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Fees</span>
              <span style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                0.020% / 0.045%
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── BOTTOM DOCK: POSITIONS & ORDERS LEDGER ── */}
      <div style={{
        height: showLedger ? '160px' : '30px',
        background: 'var(--bg-canvas, #000000)',
        borderTop: 'var(--border-hairline)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'height 0.2s ease'
      }}>
        {/* Ledger Header Tabs */}
        <div style={{
          height: '30px',
          padding: '0 12px',
          background: 'var(--bg-panel-subtle, #0e1219)',
          borderBottom: showLedger ? 'var(--border-hairline)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { id: 'positions', label: `Positions (${(brokerPortfolio.positions || []).length})` },
              { id: 'orders', label: 'Open Orders (0)' },
              { id: 'history', label: `Trade History (${(brokerPortfolio.tradeHistory || []).length})` },
              { id: 'balances', label: 'Balances' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setLedgerTab(tab.id);
                  if (!showLedger) setShowLedger(true);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: ledgerTab === tab.id ? 'var(--accent-sky)' : 'var(--slate-500)',
                  fontSize: '12px',
                  fontWeight: ledgerTab === tab.id ? 800 : 600,
                  cursor: 'pointer',
                  borderBottom: ledgerTab === tab.id && showLedger ? '2px solid var(--accent-sky)' : 'none',
                  paddingBottom: '2px'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowLedger(prev => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--slate-500)',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {showLedger ? '▼ Tutup Panel' : '▲ Buka Panel'}
          </button>
        </div>

        {/* Ledger Content Rows */}
        {showLedger && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 12px' }}>
            {ledgerTab === 'positions' && (
              <>
                {(brokerPortfolio.positions || []).length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '12px' }}>
                    Belum ada posisi terbuka. Gunakan Order Execution Form di sisi kanan untuk membuka posisi Long atau Short.
                  </div>
                ) : (
                  <table style={{ width: '100%', fontSize: '12px', fontFamily: 'var(--font-mono)', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ color: 'var(--slate-500)', textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '12px' }}>
                        <th style={{ padding: '4px' }}>Symbol</th>
                        <th style={{ padding: '4px' }}>Side</th>
                        <th style={{ padding: '4px', textAlign: 'right' }}>Size</th>
                        <th style={{ padding: '4px', textAlign: 'right' }}>Entry Price</th>
                        <th style={{ padding: '4px', textAlign: 'right' }}>Mark Price</th>
                        <th style={{ padding: '4px', textAlign: 'right' }}>PnL (ROE)</th>
                        <th style={{ padding: '4px', textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(brokerPortfolio.positions || []).map(p => {
                        const cur = markPrice || p.entryPrice;
                        const diff = p.side === 'LONG' ? (cur - p.entryPrice) : (p.entryPrice - cur);
                        const pnlUsd = diff * p.quantity;
                        const roePct = ((diff / p.entryPrice) * (leverage || 1) * 100).toFixed(2);
                        const isWin = pnlUsd >= 0;

                        return (
                          <tr key={p.symbol} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                            <td style={{ padding: '5px 4px', fontWeight: 800, color: '#fff' }}>{p.symbol}</td>
                            <td style={{ padding: '5px 4px' }}>
                              <span style={{
                                background: p.side === 'LONG' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: p.side === 'LONG' ? 'var(--accent-mint)' : '#f87171',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                fontWeight: 800
                              }}>
                                {p.side}
                              </span>
                            </td>
                            <td style={{ padding: '5px 4px', textAlign: 'right' }}>{p.quantity}</td>
                            <td style={{ padding: '5px 4px', textAlign: 'right' }}>${p.entryPrice.toLocaleString()}</td>
                            <td style={{ padding: '5px 4px', textAlign: 'right', color: 'var(--accent-sky)' }}>${cur.toLocaleString()}</td>
                            <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 800, color: isWin ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>
                              {isWin ? '+' : ''}${pnlUsd.toFixed(2)} ({isWin ? '+' : ''}{roePct}%)
                            </td>
                            <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleClosePosition(p.symbol)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#f87171',
                                  padding: '2px 8px',
                                  borderRadius: '3px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Market Close
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {ledgerTab === 'history' && (
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                {(brokerPortfolio.tradeHistory || []).length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-500)' }}>
                    Belum ada riwayat transaksi yang tersimpan.
                  </div>
                ) : (
                  (brokerPortfolio.tradeHistory || []).slice(-10).reverse().map((th, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span>{th.symbol} ({th.side})</span>
                      <span>Qty: {th.quantity || th.lots}</span>
                      <span>Harga: ${th.price}</span>
                      <span style={{ color: '#94a3b8' }}>{new Date(th.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {ledgerTab === 'balances' && (
              <div style={{ display: 'flex', gap: '24px', padding: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>CASH USDT / USDC</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                    ${(brokerPortfolio.cashUsdt || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>CASH IDR</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-sky)' }}>
                    Rp {(brokerPortfolio.cashIdr || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SEARCHABLE INSTRUMENT PICKER MODAL (300+ ASSETS) ── */}
      {isPickerOpen && (
        <div
          onClick={() => setIsPickerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(720px, 95vw)',
              maxHeight: '85vh',
              background: '#0d1117',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '14px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header & Search Bar */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🌐</span>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                    Pilih Instrumen Trading
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--slate-500)', fontFamily: 'var(--font-mono)' }}>
                    ({allInstruments.length} Aset Tersedia)
                  </span>
                </div>
                <button
                  onClick={() => setIsPickerOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Search input */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari simbol atau nama (misal BTC, SOL, PEPE, BBCA, AMMN, NVDA, TSLA, GOLD)..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: '#f8fafc',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: `Semua (${allInstruments.length})` },
                  { id: 'CRYPTO', label: `⚡ Kripto Perps (${allInstruments.filter(i => i.market === 'CRYPTO').length})` },
                  { id: 'IDX', label: `🏛️ Saham BEI (${CORE_IDX_LIST.length})` },
                  { id: 'US', label: `🇺🇸 Wall Street (${CORE_US_LIST.length})` },
                  { id: 'COMMODITY', label: `🥇 Komoditas & FX (${CORE_COMMODITY_FOREX_LIST.length})` }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      background: selectedCategory === cat.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: selectedCategory === cat.id ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                      color: selectedCategory === cat.id ? 'var(--accent-sky)' : '#94a3b8',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Instrument List */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '420px', padding: '10px' }}>
              {filteredInstruments.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '13px' }}>
                  Tidak ada instrumen yang cocok dengan "{searchQuery}"
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '6px' }}>
                  {filteredInstruments.map(inst => {
                    const isSelected = selectedPair === inst.symbol || cleanSym === inst.coin;
                    const live = livePrices[inst.symbol] || livePrices[inst.coin] || livePrices[`${inst.coin}/USDT`] || livePrices[`${inst.coin}USDT`];
                    const px = live?.price;
                    const chg = live?.changePct;

                    return (
                      <div
                        key={`${inst.market}-${inst.symbol}`}
                        onClick={() => {
                          setSelectedPair(inst.symbol);
                          setOrderSize('');
                          setIsPickerOpen(false);
                          setSearchQuery('');
                        }}
                        style={{
                          background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          border: isSelected ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          padding: '9px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            fontSize: '13px',
                            color: isSelected ? 'var(--accent-sky)' : '#f8fafc'
                          }}>
                            {inst.coin}
                          </span>
                          <span style={{
                            fontSize: '12px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: inst.market === 'CRYPTO' ? 'rgba(16, 185, 129, 0.12)' : inst.market === 'IDX' ? 'rgba(168, 85, 247, 0.12)' : inst.market === 'US' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                            color: inst.market === 'CRYPTO' ? 'var(--accent-mint)' : inst.market === 'IDX' ? 'var(--accent-purple-light)' : inst.market === 'US' ? 'var(--accent-sky)' : '#facc15',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}>
                            {inst.market}
                          </span>
                        </div>

                        <div style={{
                          fontSize: '12px',
                          color: 'var(--slate-500)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {inst.name}
                        </div>

                        {px !== undefined && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
                              {inst.market === 'IDX' ? `Rp ${Math.round(px).toLocaleString('id-ID')}` : `$${Number(px).toLocaleString(undefined, { minimumFractionDigits: px < 1 ? 4 : 2, maximumFractionDigits: 4 })}`}
                            </span>
                            {chg !== undefined && (
                              <span style={{
                                fontSize: '12px',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                color: chg >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rust)'
                              }}>
                                {chg >= 0 ? '+' : ''}{Number(chg).toFixed(2)}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
