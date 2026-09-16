import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import NewsTab from './NewsTab.jsx';
import PersonalWatchlistTab from './PersonalWatchlistTab.jsx';
import PearsonCorrelationWidget from './PearsonCorrelationWidget.jsx';

const VirtualForwardPortfolio = lazy(() => import('./VirtualForwardPortfolio.jsx'));
const BacktestPerformanceLab = lazy(() => import('./BacktestPerformanceLab.jsx'));
const EconomicCalendarTab = lazy(() => import('./EconomicCalendarTab.jsx'));
const GlobalMarketsTab = lazy(() => import('./GlobalMarketsTab.jsx'));
const OrderBookSimulator = lazy(() => import('./OrderBookSimulator.jsx'));
const QuantAcademyTab = lazy(() => import('./QuantAcademyTab.jsx'));
const TestingHubTab = lazy(() => import('./TestingHubTab.jsx'));

export default function MasterQuantLeaderboard({
  activeTab = 'STOCK',          // controlled from App.jsx (via Sidebar)
  onTabChange,                  // callback so inner navigation still works
  allIdxStocks = [],
  allCryptoSpot = [],
  tradePlans = [],
  cryptoSpotList = [],
  conglomerates = {},
  dividendHunters = [],
  foreignFlow = {},
  liveNews = [],
  macro = {},
  paperPortfolio = {},
  backtestLab = {},
  strategyRankings = [],
  brokerSummary = {},
  bundle = null,
  livePrices = {},
  flashMap = {},
  onSelectTicker,
  onOpenLotCalc,
  onSelectNews
}) {
  // Alias for internal use — reads from controlled prop
  const activeMainTab = activeTab;
  const setActiveMainTab = (tab) => onTabChange?.(tab);

  const [stockSubFilter, setStockSubFilter] = useState('ALL_STOCKS');
  const [cryptoSubFilter, setCryptoSubFilter] = useState('ALL_CRYPTO');
  const [dividendWindow, setDividendWindow] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'PAST_MONTH'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [orderBookModal, setOrderBookModal] = useState({ isOpen: false, ticker: 'BBRI', price: 4900 });

  const [sortField, setSortField] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');

  // Reset expanded drawer and search term when tab changes from sidebar
  useEffect(() => { 
    setExpandedId(null); 
    setSearchTerm('');
  }, [activeTab]);


  // Conglomerate lookup map
  const kongloLookup = useMemo(() => {
    const map = {};
    Object.entries(conglomerates || {}).forEach(([groupName, stocks]) => {
      if (Array.isArray(stocks)) {
        stocks.forEach(s => {
          const cleanGroup = groupName.replace('_GROUP', '').replace('_', ' ');
          map[s.ticker] = cleanGroup;
        });
      }
    });
    return map;
  }, [conglomerates]);

  // Sets of tickers for accurate sub-filter categorization (prevents data dropout)
  const dividendTickerSet = useMemo(() => new Set((dividendHunters || []).map(d => d.ticker)), [dividendHunters]);
  const foreignTickerSet = useMemo(() => {
    const s = new Set();
    (foreignFlow?.top_inflow || []).forEach(f => s.add(f.ticker));
    (foreignFlow?.top_outflow || []).forEach(f => s.add(f.ticker));
    return s;
  }, [foreignFlow]);

  // Market price lookup map from all available live/snapshot asset sources
  const marketPriceMap = useMemo(() => {
    const map = {};
    (cryptoSpotList || []).forEach(c => {
      if (c.pair && (c.current_price || c.price)) map[c.pair] = Number(c.current_price || c.price);
    });
    Object.values(conglomerates || {}).forEach(stocks => {
      if (Array.isArray(stocks)) {
        stocks.forEach(s => {
          if (s.ticker && (s.price || s.current_price)) map[s.ticker] = Number(s.price || s.current_price);
        });
      }
    });
    (dividendHunters || []).forEach(d => {
      if (d.ticker && (d.price || d.current_price)) map[d.ticker] = Number(d.price || d.current_price);
    });
    [...(foreignFlow?.top_inflow || []), ...(foreignFlow?.top_outflow || [])].forEach(f => {
      if (f.ticker && (f.price || f.current_price)) map[f.ticker] = Number(f.price || f.current_price);
    });
    return map;
  }, [cryptoSpotList, conglomerates, dividendHunters, foreignFlow]);

  // Dynamic R:R calculator
  const calcRR = (entry, sl, tp) => {
    const risk = Math.abs(Number(entry) - Number(sl));
    const reward = Math.abs(Number(tp) - Number(entry));
    if (risk <= 0) return 2.0;
    return Number((reward / risk).toFixed(2));
  };

  // Build unified items list
  const { allItems, allStockItems, allCryptoItems } = useMemo(() => {
    const items = [];

    // 1. Trade Plans
    tradePlans.forEach((plan, idx) => {
      const ticker = plan.clean_ticker || (plan.symbol ? plan.symbol.replace('.JK', '') : ('PLAN-' + idx));
      const entry = plan.entry_price || 0;
      const sl = plan.stop_loss || 0;
      const tp = plan.target_1 || 0;
      const realRR = plan.risk_reward_ratio || calcRR(entry, sl, tp);
      
      const live = livePrices[ticker] || livePrices[`IDX:${ticker}`] || livePrices[`${ticker}.JK`] || livePrices[plan.symbol];
      const actualPrice = live?.price !== undefined ? live.price : (marketPriceMap[ticker] || plan.current_price || plan.last_price || plan.price || entry);
      const changePct = live?.changePct !== undefined ? live.changePct : (plan.change_pct !== undefined ? plan.change_pct : (plan.raw_change_pct !== undefined ? plan.raw_change_pct : 0.0));

      items.push({
        id: plan.plan_id || ('plan-' + idx),
        rank: idx + 1,
        ticker: ticker,
        fullSymbol: plan.symbol,
        market: plan.market,
        cluster: kongloLookup[ticker] || (plan.market === 'IDX' ? 'BLUECHIP' : 'CRYPTO ALPHA'),
        categoryLabel: plan.market === 'IDX' ? 'TRADE PLAN (IDX)' : 'CRYPTO ALPHA (USDT)',
        price: actualPrice,
        changePct: changePct,
        signal: plan.technical_signal || 'BUY',
        signalType: 'BULL',
        entry: entry,
        stopLoss: sl,
        target1: tp,
        riskReward: realRR,
        isTradePlan: true,
        rawPlan: plan
      });
    });

    // 2. Crypto Spot Pairs
    cryptoSpotList.forEach((c) => {
      const existing = items.find(i => i.ticker === c.pair || i.ticker === c.pair.replace('/', '') || i.ticker === c.symbol);
      if (!existing) {
        const cleanPair = c.pair?.replace('/', '');
        const liveC = livePrices[c.pair] || livePrices[c.symbol] || livePrices[cleanPair] || livePrices[c.symbol?.replace('USDT', '')];
        const actualCPrice = liveC?.price !== undefined ? liveC.price : (c.current_price || c.entry_high || 0);
        const actualCChange = liveC?.changePct !== undefined ? liveC.changePct : (c.change_24h_pct || 0);
        const entry = actualCPrice;
        const sl = c.stop_loss || 0;
        const tp = c.take_profit_1 || 0;
        const realRR = c.risk_reward_ratio || calcRR(entry, sl, tp);

        items.push({
          id: 'crypto-' + c.pair,
          rank: items.length + 1,
          ticker: c.pair,
          fullSymbol: c.pair,
          market: 'CRYPTO',
          cluster: 'LAYER 1 / DEFI',
          categoryLabel: 'SPOT USDT (NO LEV)',
          price: actualCPrice,
          changePct: actualCChange,
          signal: c.setup_type || 'SPOT_LONG',
          signalType: 'BLUE',
          entry: entry,
          entryRange: c.entry_low && c.entry_high ? (c.entry_low + ' - ' + c.entry_high) : null,
          stopLoss: sl,
          target1: tp,
          riskReward: realRR,
          isTradePlan: false,
          rawCrypto: c
        });
      }
    });

    // 3. Conglomerates
    Object.entries(conglomerates || {}).forEach(([group, stocks]) => {
      if (Array.isArray(stocks)) {
        stocks.forEach(s => {
          if (!items.find(i => i.ticker === s.ticker)) {
            const cleanGroup = group.replace('_GROUP', '').replace('_', ' ');
            const liveS = livePrices[s.ticker] || livePrices[`IDX:${s.ticker}`];
            const price = liveS?.price !== undefined ? liveS.price : (s.price || 0);
            const chg = liveS?.changePct !== undefined ? liveS.changePct : (s.change_pct || 0);
            const sl = Math.round(Number(price) * 0.95);
            const tp = Math.round(Number(price) * 1.10);
            const realRR = calcRR(price, sl, tp);

            items.push({
              id: 'konglo-' + s.ticker,
              rank: items.length + 1,
              ticker: s.ticker,
              fullSymbol: s.full_ticker || (s.ticker + '.JK'),
              market: 'IDX',
              cluster: cleanGroup,
              categoryLabel: cleanGroup,
              price: price,
              changePct: chg,
              signal: s.technical_signal || 'MONITOR',
              signalType: s.technical_signal === 'BREAKOUT' ? 'BULL' : 'BLUE',
              entry: price,
              stopLoss: sl,
              target1: tp,
              riskReward: realRR,
              isTradePlan: false,
              rawStock: s
            });
          }
        });
      }
    });

    // 4. Dividend Hunters
    (dividendHunters || []).forEach(d => {
      if (!items.find(i => i.ticker === d.ticker)) {
        const price = d.price || 0;
        const sl = Math.round(Number(price) * 0.95);
        const tp = Math.round(Number(price) * 1.10);
        const realRR = calcRR(price, sl, tp);

        items.push({
          id: 'div-' + d.ticker,
          rank: items.length + 1,
          ticker: d.ticker,
          fullSymbol: d.full_ticker || (d.ticker + '.JK'),
          market: 'IDX',
          cluster: kongloLookup[d.ticker] || 'DIVIDEND QUALITY',
          categoryLabel: 'YIELD ' + d.dividend_yield_pct + '%',
          price: price,
          changePct: d.change_pct || 0,
          signal: d.dividend_trap_risk === 'LOW' ? 'HIGH YIELD SAFE' : 'TRAP RISK',
          signalType: d.dividend_trap_risk === 'LOW' ? 'BULL' : 'WARN',
          entry: price,
          stopLoss: sl,
          target1: tp,
          riskReward: realRR,
          isTradePlan: false,
          rawStock: d
        });
      }
    });

    // 5. Seluruh Alam Semesta Saham BEI (849+ Emiten dari TradingView Scanner)
    (allIdxStocks || []).forEach(s => {
      const existing = items.find(i => i.ticker === s.ticker || i.ticker === s.name);
      if (!existing && s.ticker) {
        const liveS = livePrices[s.ticker] || livePrices[`IDX:${s.ticker}`];
        const price = liveS?.price !== undefined ? liveS.price : (s.price || 0);
        const chg = liveS?.changePct !== undefined ? liveS.changePct : (s.changePct || 0);
        const sl = Math.round(Number(price) * 0.95);
        const tp = Math.round(Number(price) * 1.08);
        const realRR = calcRR(price, sl, tp);

        const sig = chg > 2.5 ? 'MOMENTUM BUY' : (chg < -2.5 ? 'OVERSOLD WATCH' : (chg > 0 ? 'ACCUMULATION' : 'NEUTRAL'));
        const sigType = chg > 0 ? 'BULL' : (chg < -2 ? 'WARN' : 'BLUE');

        items.push({
          id: 'idx-all-' + s.ticker,
          rank: items.length + 1,
          ticker: s.ticker,
          fullSymbol: s.fullSymbol || ('IDX:' + s.ticker),
          market: 'IDX',
          cluster: kongloLookup[s.ticker] || (s.valueTraded > 50000000000 ? 'BEI LIQUID' : 'BEI REGULER'),
          categoryLabel: s.description || 'EMITEN BEI',
          price: price,
          changePct: chg,
          signal: sig,
          signalType: sigType,
          entry: price,
          stopLoss: sl,
          target1: tp,
          riskReward: realRR,
          volume: s.volume || 0,
          valueTraded: s.valueTraded || 0,
          rsi: s.rsi || null,
          isTradePlan: false,
          rawStock: s
        });
      }
    });

    // 6. Seluruh Alam Semesta Crypto Spot Binance (744+ Pasangan USDT)
    (allCryptoSpot || []).forEach(c => {
      const existing = items.find(i => i.ticker === c.pair || i.ticker === c.symbol || i.ticker === c.baseCoin);
      if (!existing && c.symbol) {
        const liveC = livePrices[c.symbol] || livePrices[c.pair];
        const price = liveC?.price !== undefined ? liveC.price : (c.price || 0);
        const chg = liveC?.changePct !== undefined ? liveC.changePct : (c.changePct || 0);
        const sl = Number((price * 0.94).toFixed(4));
        const tp = Number((price * 1.12).toFixed(4));
        const realRR = calcRR(price, sl, tp);

        const sig = chg > 5 ? 'STRONG MOMENTUM' : (chg < -5 ? 'DIP WATCH' : 'CONSOLIDATION');
        const sigType = chg > 0 ? 'BULL' : (chg < -3 ? 'WARN' : 'BLUE');

        items.push({
          id: 'crypto-all-' + c.symbol,
          rank: items.length + 1,
          ticker: c.pair || (`${c.baseCoin}/USDT`),
          fullSymbol: c.symbol,
          market: 'CRYPTO',
          cluster: c.quoteVolume > 10000000 ? 'TOP LIQUIDITY' : 'ALTCOIN',
          categoryLabel: 'SPOT USDT (BINANCE)',
          price: price,
          changePct: chg,
          signal: sig,
          signalType: sigType,
          entry: price,
          stopLoss: sl,
          target1: tp,
          riskReward: realRR,
          volume: c.quoteVolume || 0,
          isTradePlan: false,
          rawCrypto: c
        });
      }
    });

    const stockOnly = items.filter(i => i.market === 'IDX');
    const cryptoOnly = items.filter(i => i.market === 'CRYPTO');

    return { allItems: items, allStockItems: stockOnly, allCryptoItems: cryptoOnly };
  }, [tradePlans, cryptoSpotList, conglomerates, dividendHunters, kongloLookup, livePrices, allIdxStocks, allCryptoSpot]);

  const tradePlansCount = useMemo(() => allStockItems.filter(i => i.isTradePlan).length, [allStockItems]);

  const filteredDividends = useMemo(() => {
    let list = dividendHunters || [];

    // Current reference date (today in local time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Compute dynamic days_diff and date window membership
    list = list.map(d => {
      let daysDiff = d.days_to_cum || 0;
      let cumDateObj = null;
      if (d.cum_date && d.cum_date !== '-') {
        try {
          cumDateObj = new Date(d.cum_date + 'T00:00:00');
          const diffTime = cumDateObj.getTime() - today.getTime();
          daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (e) {
          daysDiff = d.days_to_cum || 0;
        }
      }
      return {
        ...d,
        days_to_cum: daysDiff,
        isPast: daysDiff < 0,
        isToday: daysDiff === 0,
        isFuture: daysDiff > 0
      };
    });

    // 1. Filter by requested window: -1 Month (past 30 days) to +6 Months (next 185 days)
    list = list.filter(d => d.days_to_cum >= -30 && d.days_to_cum <= 185);

    // 2. Filter by dividendWindow sub-tab
    if (dividendWindow === 'UPCOMING') {
      list = list.filter(d => d.days_to_cum >= 0);
    } else if (dividendWindow === 'PAST_MONTH') {
      list = list.filter(d => d.days_to_cum < 0);
    }

    // 3. Search query filter
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(d => 
        (d.ticker && d.ticker.toLowerCase().includes(q)) ||
        (d.company_name && d.company_name.toLowerCase().includes(q)) ||
        (d.verdict && d.verdict.toLowerCase().includes(q)) ||
        (d.dividend_trap_risk && d.dividend_trap_risk.toLowerCase().includes(q)) ||
        (kongloLookup[d.ticker] && kongloLookup[d.ticker].toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => {
      let valA = a[sortField] !== undefined ? a[sortField] : a.dividend_yield_pct;
      let valB = b[sortField] !== undefined ? b[sortField] : b.dividend_yield_pct;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc' 
        ? String(valA || '').localeCompare(String(valB || ''))
        : String(valB || '').localeCompare(String(valA || ''));
    });
  }, [dividendHunters, dividendWindow, searchTerm, kongloLookup, sortField, sortDirection]);

  // Robust filtering using Membership Sets & Full Multi-Asset Universe
  const currentDataset = useMemo(() => {
    let list = [];
    if (activeMainTab === 'STOCK') {
      if (stockSubFilter === 'PLANS') {
        list = allStockItems.filter(i => i.isTradePlan);
      } else if (stockSubFilter === 'TOP_TURNOVER') {
        list = [...allStockItems].sort((a, b) => (b.valueTraded || 0) - (a.valueTraded || 0)).slice(0, 50);
      } else {
        list = allStockItems;
      }
    } else if (activeMainTab === 'CRYPTO') {
      if (cryptoSubFilter === 'MOMENTUM_10') {
        list = allCryptoItems.filter(i => i.rawCrypto?.setup_type || i.rawCrypto?.conviction);
      } else if (cryptoSubFilter === 'TOP_VOLUME') {
        list = [...allCryptoItems].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 30);
      } else {
        list = allCryptoItems;
      }
    } else {
      list = allItems;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(i => 
        (i.ticker && i.ticker.toLowerCase().includes(q)) ||
        (i.fullSymbol && i.fullSymbol.toLowerCase().includes(q)) ||
        (i.cluster && i.cluster.toLowerCase().includes(q)) ||
        (i.categoryLabel && i.categoryLabel.toLowerCase().includes(q)) ||
        (i.signal && i.signal.toLowerCase().includes(q)) ||
        (i.rawStock?.description && i.rawStock.description.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'price' || sortField === 'changePct' || sortField === 'riskReward' || sortField === 'rank' || sortField === 'volume' || sortField === 'valueTraded') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [activeMainTab, stockSubFilter, cryptoSubFilter, searchTerm, allStockItems, allCryptoItems, allItems, sortField, sortDirection, kongloLookup, dividendTickerSet, foreignTickerSet]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return ' ⇅';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <Suspense fallback={<div className='telemetry-panel' style={{ padding: '30px', textAlign: 'center', color: 'var(--text-primary)' }}>Memuat modul quant...</div>}>
      <div className='telemetry-panel' style={{ border: 'var(--border-hairline)' }}>
      {/* Sub-filter context bar for STOCK/CRYPTO tabs */}
      {(activeMainTab === 'STOCK' || activeMainTab === 'CRYPTO') && (
        <div className='telemetry-header' style={{ background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span>
            {activeMainTab === 'STOCK'
              ? `📈 Saham IDX · ${allStockItems.length} emiten aktif BEI · SCANNER TRADINGVIEW REALTIME · KLIK BARIS UNTUK CHART & ORDER BOOK`
              : `⚡ Crypto Spot · ${allCryptoItems.length} pasangan USDT Binance · LIVE WEBSOCKET 1 DETIK`}
          </span>
        </div>
      )}

      {/* VIEW ACCORDING TO ACTIVE MAIN TAB */}
      {activeMainTab === 'TESTING' && (
        <div style={{ padding: '0' }}>
          <TestingHubTab
            dailyTradePlans={tradePlans}
            paperPortfolio={paperPortfolio}
            currentPrices={{ ...marketPriceMap, ...Object.fromEntries(allItems.map(i => [i.ticker, i.price])) }}
            backtestLab={backtestLab}
            strategyRankings={strategyRankings}
            onSelectTicker={onSelectTicker}
          />
        </div>
      )}

      {activeMainTab === 'CURRENT_TEST' && (
        <div style={{ padding: '12px' }}>
          <VirtualForwardPortfolio
            dailyTradePlans={tradePlans}
            paperPortfolio={paperPortfolio}
            currentPrices={{ ...marketPriceMap, ...Object.fromEntries(allItems.map(i => [i.ticker, i.price])) }}
            onSelectTicker={onSelectTicker}
          />
        </div>
      )}

      {activeMainTab === 'BACKTEST_LAB' && (
        <div style={{ padding: '12px' }}>
          <BacktestPerformanceLab
            backtestLab={backtestLab}
            strategyRankings={strategyRankings}
          />
        </div>
      )}

      {activeMainTab === 'GLOBAL_MARKETS' && (
        <div style={{ padding: '12px' }}>
          <GlobalMarketsTab onSelectTicker={onSelectTicker} macro={macro} bundle={bundle} />
        </div>
      )}

      {activeMainTab === 'ECONOMIC_CALENDAR' && (
        <div style={{ padding: '12px' }}>
          <EconomicCalendarTab />
        </div>
      )}

      {activeMainTab === 'PEARSON_CORRELATION' && (
        <div style={{ padding: '12px' }}>
          <PearsonCorrelationWidget correlationData={bundle?.correlation_data} />
        </div>
      )}

      {activeMainTab === 'ACADEMY' && (
        <div style={{ padding: '12px' }}>
          <QuantAcademyTab />
        </div>
      )}

      {activeMainTab === 'NEWS' && (
        <div style={{ padding: '12px' }}>
          <NewsTab 
            liveNews={liveNews} 
            macro={macro} 
            foreignFlow={foreignFlow}
            onSelectTicker={onSelectTicker} 
            onSelectNews={onSelectNews}
          />
        </div>
      )}

      {activeMainTab === 'WATCHLIST' && (
        <div style={{ padding: '12px' }}>
          <PersonalWatchlistTab allStocks={allItems} onSelectTicker={onSelectTicker} />
        </div>
      )}

      {(activeMainTab === 'STOCK' || activeMainTab === 'CRYPTO') && (
        <>
          {/* Sub-toolbar */}
          <div style={{
            padding: '8px 12px',
            background: 'var(--bg-panel)',
            borderBottom: 'var(--border-muted)',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Sub-pills for Stock / Crypto tabs */}
            {activeMainTab === 'STOCK' ? (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL_STOCKS', label: `🏛️ SEMUA SAHAM BEI (${allStockItems.length})` },
                  { id: 'PLANS', label: `🎯 TOP 20 ALPHA PLANS (${tradePlansCount})` },
                  { id: 'DIVIDEND', label: `💰 DIVIDEN HUNTER (${filteredDividends.length})` },
                  { id: 'TOP_TURNOVER', label: `🔥 TOP TURNOVER BEI (50)` }
                ].map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => setStockSubFilter(btn.id)}
                    className={'telemetry-btn ' + (stockSubFilter === btn.id ? 'active' : '')}
                    style={{ fontSize: '10px', padding: '3px 8px' }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL_CRYPTO', label: `⚡ SEMUA SPOT USDT (${allCryptoItems.length})` },
                  { id: 'MOMENTUM_10', label: `🎯 TOP 10 MOMENTUM PICKS (${cryptoSpotList.length})` },
                  { id: 'TOP_VOLUME', label: `🔥 TOP VOLUME (30)` }
                ].map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => setCryptoSubFilter(btn.id)}
                    className={'telemetry-btn ' + (cryptoSubFilter === btn.id ? 'active' : '')}
                    style={{ fontSize: '10px', padding: '3px 8px' }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}

            {/* Real-time search & Data Transparency Badge */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span 
                style={{ 
                  fontSize: '9px', 
                  fontFamily: 'var(--font-mono)', 
                  padding: '3px 6px', 
                  borderRadius: '3px', 
                  background: 'rgba(255,255,255,0.06)', 
                  border: '1px solid var(--border-muted)',
                  color: 'var(--text-muted)' 
                }}
                title="Harga di tabel merupakan snapshot sinkronisasi pipeline. Klik tombol CHART untuk streaming realtime TradingView."
              >
                📊 SNAPSHOT PIPELINE
              </span>
              <input
                type='text'
                placeholder={activeMainTab === 'STOCK' ? 'Cari Ticker / Grup...' : 'Cari Ticker / Klaster...'}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '5px 8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  border: 'var(--border-muted)',
                  background: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  width: '180px',
                  textTransform: 'uppercase'
                }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                ({stockSubFilter === 'DIVIDEND' ? filteredDividends.length : currentDataset.length} Hasil)
              </span>
            </div>
          </div>

          {/* Table View: SPECIALIZED DIVIDEND VIEW vs STANDARD LEADERBOARD */}
          {activeMainTab === 'STOCK' && stockSubFilter === 'DIVIDEND' ? (
            <div style={{ overflowX: 'auto', maxHeight: '580px', background: 'var(--bg-panel)' }}>
              <div style={{
                padding: '8px 12px',
                background: 'rgba(245, 158, 11, 0.1)',
                borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--accent-gold, #fbbf24)', fontWeight: '700' }}>
                    📅 KALENDER DIVIDEN BEI (1 BULAN TERAKHIR & 3-6 BULAN KEDEPAN)
                  </span>
                  
                  {/* Sub-window Filter Buttons */}
                  <div style={{ display: 'inline-flex', background: 'var(--bg-panel-subtle)', borderRadius: '4px', padding: '2px', border: 'var(--border-muted)', gap: '2px' }}>
                    {[
                      { id: 'ALL', label: 'SEMUA AKTIF' },
                      { id: 'UPCOMING', label: '⏳ MENDATANG (3-6 BLN)' },
                      { id: 'PAST_MONTH', label: '🏁 1 BLN TERAKHIR (PASCA EX)' }
                    ].map(w => (
                      <button
                        key={w.id}
                        onClick={() => setDividendWindow(w.id)}
                        style={{
                          background: dividendWindow === w.id ? 'var(--accent-gold, #fbbf24)' : 'transparent',
                          color: dividendWindow === w.id ? '#000000' : 'var(--text-muted)',
                          border: 'none',
                          padding: '2px 8px',
                          fontSize: '10px',
                          fontWeight: '800',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  KLIK BARIS UNTUK RADAR DIVIDEND TRAP & METRIK LENGKAP
                </span>
              </div>
              <table className='telemetry-table' style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '35px', textAlign: 'center' }}>#</th>
                    <th>Ticker & Emiten</th>
                    <th>Grup</th>
                    <th>Jadwal Cum Date</th>
                    <th style={{ textAlign: 'right' }}>DPS (Rp)</th>
                    <th style={{ textAlign: 'right' }}>Yield %</th>
                    <th>Ex & Pay Date</th>
                    <th style={{ textAlign: 'center' }}>Worth to Buy?</th>
                    <th>Ideal Buy Zone</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDividends.length === 0 ? (
                    <tr>
                      <td colSpan='10' style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        Tidak ada dividen yang sesuai dalam jendela waktu ini.
                      </td>
                    </tr>
                  ) : (
                    filteredDividends.map((d, idx) => {
                      const isExpanded = expandedId === ('div-' + d.ticker);
                      const bColor = d.verdict_badge === 'GREEN' ? 'badge-bull' : d.verdict_badge === 'RED' ? 'badge-warn' : 'badge-gold';
                      const grp = kongloLookup[d.ticker] || 'BLUECHIP';
                      
                      // Format Countdown Badge
                      let countdownBadge = null;
                      if (d.days_to_cum === 0) {
                        countdownBadge = (
                          <span className="badge badge-warn" style={{ fontSize: '9px', marginTop: '2px', background: '#dc2626', color: '#ffffff' }}>
                            🔴 HARI INI (CUM DATE)
                          </span>
                        );
                      } else if (d.days_to_cum > 0) {
                        countdownBadge = (
                          <span className="badge badge-gold" style={{ fontSize: '9px', marginTop: '2px' }}>
                            H-{d.days_to_cum} HARI
                          </span>
                        );
                      } else {
                        countdownBadge = (
                          <span className="badge badge-neutral" style={{ fontSize: '9px', marginTop: '2px', color: 'var(--text-muted)' }}>
                            PASCA EX (H+{Math.abs(d.days_to_cum)})
                          </span>
                        );
                      }

                      return (
                        <React.Fragment key={d.ticker}>
                          <tr
                            onClick={() => toggleExpand('div-' + d.ticker)}
                            style={{
                              cursor: 'pointer',
                              background: isExpanded ? 'var(--bg-panel-subtle)' : 'transparent',
                              opacity: d.days_to_cum < 0 ? 0.85 : 1,
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                            <td>
                              <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '12px' }}>
                                ${d.ticker}
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{d.company_name}</div>
                            </td>
                            <td>
                              <span className="badge badge-neutral" style={{ fontSize: '9px', fontWeight: '700' }}>
                                {grp}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{d.cum_date}</div>
                              {countdownBadge}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>
                              Rp {Number(d.dps_idr || 0).toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--accent-green)', fontSize: '12px' }}>
                              {d.dividend_yield_pct}%
                            </td>
                            <td style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              <div>Ex: {d.ex_date}</div>
                              <div>Pay: {d.payment_date}</div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`badge ${bColor}`} style={{ fontSize: '9px', fontWeight: '800', display: 'inline-block' }}>
                                {d.verdict}
                              </span>
                              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '160px', margin: '2px auto 0' }}>
                                {d.verdict_badge === 'YELLOW' ? 'Jual H-1 Cum Date' : d.verdict_badge === 'GREEN' ? 'Aman Hold Lewat Ex' : 'Risiko Drop > Yield'}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: '700', color: 'var(--accent-green)' }}>
                                {Number(d.buy_zone_low).toLocaleString()} - {Number(d.buy_zone_high).toLocaleString()}
                              </div>
                              <div style={{ fontSize: '9px', color: 'var(--accent-rust)' }}>
                                SL: {Number(d.sl).toLocaleString()}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button
                                  className="telemetry-btn"
                                  onClick={() => onSelectTicker(d.ticker, 'IDX')}
                                  style={{ fontSize: '9px', padding: '3px 6px', color: 'var(--accent-blue)' }}
                                >
                                  CHART ↗
                                </button>
                                <button
                                  className="telemetry-btn"
                                  onClick={() => onOpenLotCalc?.(d.buy_zone_low || d.price, d.sl)}
                                  style={{ fontSize: '9px', padding: '3px 6px' }}
                                >
                                  LOT 💰
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Dividend Drawer */}
                          {isExpanded && (
                            <tr>
                              <td colSpan='10' style={{ background: 'var(--bg-canvas)', padding: '12px', borderBottom: 'var(--border-hairline)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                  
                                  {/* Box 1: Fundamental Facts */}
                                  <div style={{ background: 'var(--bg-panel)', padding: '10px', border: 'var(--border-muted)', fontSize: '11px' }}>
                                    <div style={{ fontWeight: '700', color: 'var(--accent-blue)', marginBottom: '6px', fontSize: '10px' }}>
                                      📊 FAKTA FUNDAMENTAL DIVIDEN:
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
                                      • <strong>DPS:</strong> Rp {Number(d.dps_idr).toLocaleString()} / lembar
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
                                      • <strong>Payout Ratio (DPR):</strong> {d.payout_ratio}%
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
                                      • <strong>Recording Date:</strong> {d.recording_date}
                                    </div>
                                    <div style={{ color: 'var(--text-primary)' }}>
                                      • <strong>Payment Date:</strong> {d.payment_date}
                                    </div>
                                  </div>

                                  {/* Box 2: Radar Dividend Trap */}
                                  <div style={{ background: 'var(--bg-panel)', padding: '10px', border: 'var(--border-muted)', fontSize: '11px' }}>
                                    <div style={{ fontWeight: '700', color: 'var(--accent-gold, #fbbf24)', marginBottom: '6px', fontSize: '10px' }}>
                                      ⚠️ RADAR DIVIDEND TRAP:
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
                                      • <strong>Trap Risk Level:</strong> <span style={{ color: d.dividend_trap_risk === 'LOW' ? 'var(--accent-green)' : '#ff3b30', fontWeight: '700' }}>{d.dividend_trap_risk}</span>
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
                                      • <strong>Hist. Ex-Date Drop:</strong> -{d.historical_drop_pct}%
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
                                      • <strong>Net Gain vs Ex Drop:</strong> {(Number(d.dividend_yield_pct) - Number(d.historical_drop_pct)).toFixed(1)}%
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                                      • Estimasi pemulihan harga rata-rata 10-30 hari bursa.
                                    </div>
                                  </div>

                                  {/* Box 3: Trader Playbook */}
                                  <div style={{ background: 'var(--bg-panel)', padding: '10px', border: 'var(--border-muted)', fontSize: '11px' }}>
                                    <div style={{ fontWeight: '700', color: 'var(--accent-green)', marginBottom: '6px', fontSize: '10px' }}>
                                      🎯 PLAYBOOK EKSEKUSI (WORTH TO BUY?):
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.4 }}>
                                      {d.summary}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                      Ideal Entry: <strong>Rp {Number(d.buy_zone_low).toLocaleString()} - Rp {Number(d.buy_zone_high).toLocaleString()}</strong> | Hard SL: <strong>Rp {Number(d.sl).toLocaleString()}</strong>
                                    </div>
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '580px', background: 'var(--bg-panel)' }}>
              <table className='telemetry-table' style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('rank')}>
                      #{getSortIcon('rank')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ticker')}>
                      Ticker{getSortIcon('ticker')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('cluster')}>
                      {activeMainTab === 'STOCK' ? 'Grup' : 'Klaster'}{getSortIcon('cluster')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('signal')}>
                      Sinyal / Setup{getSortIcon('signal')}
                    </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('price')} title="Harga pasar terkini (realtime tick / scanner)">
                    Harga Terakhir (Live){getSortIcon('price')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('changePct')}>
                    Chg %{getSortIcon('changePct')}
                  </th>
                  <th title="Zona beli terencana berdasarkan setup teknikal quant">Entry Plan</th>
                  <th>Hard SL</th>
                  <th>TP1</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('riskReward')}>
                    R:R{getSortIcon('riskReward')}
                  </th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentDataset.length === 0 ? (
                  <tr>
                    <td colSpan='11' style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      Tidak ada instrumen yang sesuai dengan filter atau pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  currentDataset.map((item, idx) => {
                    const isExpanded = expandedId === item.id;
                    const p = item.rawPlan;
                    const c = item.rawCrypto;
                    const s = item.rawStock;

                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          onClick={() => toggleExpand(item.id)}
                          style={{
                            cursor: 'pointer',
                            background: isExpanded ? 'var(--bg-panel-subtle)' : 'transparent',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)', fontSize: '11px' }}>
                            {idx + 1}
                          </td>
                          <td style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>
                            ${item.ticker}
                          </td>
                          <td>
                            <span className='badge' style={{
                              fontSize: '9px',
                              background: 'var(--bg-panel-subtle)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-muted)'
                            }}>
                              {item.cluster || item.categoryLabel || '-'}
                            </span>
                          </td>
                          <td>
                            <span className={'badge ' + (
                              item.signal === 'BREAKOUT' || item.signal === 'HIGH YIELD SAFE' || item.signal === 'FOREIGN BUY' ? 'badge-bull' :
                              item.signal === 'ACCUMULATION' || item.signal === 'SPOT_LONG' ? 'badge-blue' :
                              item.signal === 'TRAP RISK' || item.signal === 'FOREIGN SELL' ? 'badge-bear' : 'badge'
                            )}>
                              {item.signal}
                            </span>
                            {item.rawPlan?.technicals?.confluence_score !== undefined && (
                              <div style={{ marginTop: '3px' }}>
                                <span style={{
                                  fontSize: '9px',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: '800',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  background: item.rawPlan.technicals.confluence_score >= 70 ? 'rgba(52, 199, 89, 0.15)' : item.rawPlan.technicals.confluence_score >= 40 ? 'rgba(255, 149, 0, 0.15)' : 'rgba(255, 59, 48, 0.15)',
                                  color: item.rawPlan.technicals.confluence_score >= 70 ? 'var(--accent-green)' : item.rawPlan.technicals.confluence_score >= 40 ? 'var(--accent-orange)' : '#ff3b30',
                                  border: `1px solid ${item.rawPlan.technicals.confluence_score >= 70 ? 'rgba(52, 199, 89, 0.3)' : item.rawPlan.technicals.confluence_score >= 40 ? 'rgba(255, 149, 0, 0.3)' : 'rgba(255, 59, 48, 0.3)'}`
                                }}>
                                  ⚡ {item.rawPlan.technicals.confluence_score}% Q-Score
                                </span>
                              </div>
                            )}
                          </td>
                          <td style={{
                            fontWeight: '800',
                            fontFamily: 'var(--font-mono)',
                            color: flashMap?.[item.ticker] === 'up' ? 'var(--accent-green)' : flashMap?.[item.ticker] === 'down' ? 'var(--accent-rust)' : 'var(--text-primary)',
                            background: flashMap?.[item.ticker] === 'up' ? 'rgba(0, 208, 132, 0.15)' : flashMap?.[item.ticker] === 'down' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                            transition: 'all 0.3s ease'
                          }}>
                            {item.market === 'IDX'
                              ? ('Rp ' + Math.round(Number(item.price)).toLocaleString('id-ID'))
                              : ('$' + Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }))}
                            {flashMap?.[item.ticker] === 'up' && <span style={{ color: 'var(--accent-green)', marginLeft: '3px' }}>▲</span>}
                            {flashMap?.[item.ticker] === 'down' && <span style={{ color: 'var(--accent-rust)', marginLeft: '3px' }}>▼</span>}
                          </td>
                          <td style={{
                            fontWeight: '700',
                            fontFamily: 'var(--font-mono)',
                            color: Number(item.changePct) >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)'
                          }}>
                            {Number(item.changePct) >= 0 ? '+' + Number(item.changePct).toFixed(2) + '%' : Number(item.changePct).toFixed(2) + '%'}
                          </td>
                          <td>
                            <code>{item.entryRange ? item.entryRange : (item.market === 'IDX' ? ('Rp ' + Number(item.entry).toLocaleString()) : ('$' + item.entry))}</code>
                          </td>
                          <td style={{ color: '#ff3b30' }}>
                            <code>{item.market === 'IDX' ? ('Rp ' + Number(item.stopLoss).toLocaleString()) : ('$' + item.stopLoss)}</code>
                          </td>
                          <td style={{ color: '#34c759', fontWeight: '700' }}>
                            <code>{item.market === 'IDX' ? ('Rp ' + Number(item.target1).toLocaleString()) : ('$' + item.target1)}</code>
                          </td>
                          <td>
                            <span style={{ fontWeight: '700', color: 'var(--accent-blue)' }}>
                              1:{item.riskReward}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <button
                              className='telemetry-btn'
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTicker(item.ticker, item.market);
                              }}
                              style={{ padding: '2px 8px', fontSize: '10px', background: 'var(--text-primary)', color: 'var(--bg-canvas)', marginRight: '4px' }}
                            >
                              📈 CHART
                            </button>
                            <button
                              className='telemetry-btn'
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(item.id);
                              }}
                              style={{ padding: '2px 6px', fontSize: '10px' }}
                            >
                              {isExpanded ? '▲' : '▼'}
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDED PROGRESSIVE DISCLOSURE DRAWER */}
                        {isExpanded && (
                          <tr className='drawer-content' style={{ background: 'var(--bg-panel-subtle)' }}>
                            <td colSpan='11' style={{ padding: '12px 16px', borderBottom: 'var(--border-hairline)', whiteSpace: 'normal' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', fontSize: '11px' }}>
                                
                                {/* Drawer Box 1: Facts & Metrics */}
                                <div className='drawer-box' style={{ background: 'var(--bg-panel)', padding: '10px', border: 'var(--border-muted)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                  <div style={{ fontWeight: '700', color: 'var(--accent-blue)', marginBottom: '6px', fontSize: '10px', letterSpacing: '0.04em' }}>
                                    📊 VERIFIED FACTS &amp; METRICS:
                                  </div>
                                  {p && (
                                    <p style={{ color: 'var(--text-primary)', lineHeight: 1.45, margin: 0 }}>
                                      {p.facts_summary}
                                    </p>
                                  )}
                                  {c && (
                                    <p style={{ color: 'var(--text-primary)', lineHeight: 1.45, margin: 0 }}>
                                      <strong>Pair:</strong> {c.pair} | <strong>24h Vol:</strong> Active Spot | <strong>Conviction:</strong> {c.conviction}
                                    </p>
                                  )}
                                  {s && (
                                    <p style={{ color: 'var(--text-primary)', lineHeight: 1.45, margin: 0 }}>
                                      <strong>Emiten:</strong> {s.company_name} | <strong>MA20:</strong> Rp {s.ma20} | <strong>RSI 14:</strong> {s.rsi_14}
                                    </p>
                                  )}
                                </div>

                                {/* Drawer Box 2: Opinion & Sizing Math */}
                                <div className='drawer-box' style={{ background: 'var(--bg-panel)', padding: '10px', border: 'var(--border-muted)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <div style={{ fontWeight: '700', color: 'var(--accent-orange)', fontSize: '10px', letterSpacing: '0.04em' }}>
                                      💡 THESIS &amp; POSITION SIZING MATH:
                                    </div>
                                    <div>
                                      <button 
                                        className="telemetry-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onOpenLotCalc) onOpenLotCalc(item.entry, item.stopLoss);
                                        }}
                                        style={{ padding: '2px 8px', fontSize: '10px', background: 'var(--accent-green)', color: '#fff' }}
                                      >
                                        💰 Hitung Lot
                                      </button>
                                       <button 
                                         className="telemetry-btn"
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           setOrderBookModal({ 
                                             isOpen: true, 
                                             ticker: item.ticker, 
                                             price: item.price,
                                             brokerData: brokerSummary[item.ticker] || brokerSummary[item.ticker?.replace('.JK', '')]
                                           });
                                         }}
                                         style={{ padding: '2px 8px', fontSize: '10px', background: '#0066cc', color: '#fff', marginLeft: '6px' }}
                                       >
                                         📊 Order Book
                                       </button>
                                       {!item.ticker.includes('USDT') && !item.ticker.includes('USD') && (
                                         <button 
                                           className="telemetry-btn"
                                           onClick={(e) => {
                                             e.stopPropagation();
                                             setOrderBookModal({ 
                                               isOpen: true, 
                                               ticker: item.ticker, 
                                               price: item.price,
                                               brokerData: brokerSummary[item.ticker] || brokerSummary[item.ticker?.replace('.JK', '')]
                                             });
                                           }}
                                           style={{ padding: '2px 8px', fontSize: '10px', background: '#7c3aed', color: '#fff', marginLeft: '6px' }}
                                           title="Radar Uang Bandar & Broker Summary ala Stockbit"
                                         >
                                           🕵️ Broker Flow
                                         </button>
                                       )}
                                     </div>
                                  </div>
                                  {p && (
                                    <>
                                      <p style={{ color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.45 }}>
                                        <strong>Thesis:</strong> {p.opinion_thesis}
                                      </p>
                                      <div style={{ background: 'var(--bg-panel-subtle)', border: '1px solid var(--border-muted)', padding: '6px 8px', fontSize: '10px', color: 'var(--accent-orange)', fontWeight: '700' }}>
                                        {p.position_size_math}
                                      </div>
                                    </>
                                  )}
                                  {c && (
                                    <p style={{ color: 'var(--text-primary)', lineHeight: 1.45, margin: 0 }}>
                                      <strong>Thesis:</strong> {c.catalyst_thesis}
                                    </p>
                                  )}
                                  {s && (
                                    <p style={{ color: 'var(--text-primary)', lineHeight: 1.45, margin: 0 }}>
                                      <strong>Klaster:</strong> {item.cluster} | <strong>Vol:</strong> {Number(s.volume || 0).toLocaleString()}
                                    </p>
                                  )}
                                </div>

                                {/* Drawer Box 3: Invalidation Rules (Cleaned Bullets) */}
                                <div className='drawer-box' style={{ background: 'var(--bg-panel)', padding: '10px', border: 'var(--border-muted)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                  <div style={{ fontWeight: '700', color: '#ff3b30', marginBottom: '6px', fontSize: '10px', letterSpacing: '0.04em' }}>
                                    ⛔ {p?.three_invalidations?.length ? '3 INVALIDATION (CUT RULES):' : 'INVALIDATION (CUT RULES):'}
                                  </div>
                                  {p && Array.isArray(p.three_invalidations) && p.three_invalidations.map((inv, i) => {
                                    const cleanText = inv.replace(/^\d+[\.\)]\s*/, '');
                                    return (
                                      <div key={i} style={{ color: 'var(--text-primary)', marginBottom: '4px', fontSize: '10px', lineHeight: 1.4 }}>
                                        • {cleanText}
                                      </div>
                                    );
                                  })}
                                  {c && (
                                    <div style={{ color: '#ff3b30', fontSize: '10px', lineHeight: 1.4 }}>
                                      • {c.invalidation_rule}
                                    </div>
                                  )}
                                  {(!p && !c) && (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', lineHeight: 1.4 }}>
                                      • Penutupan candle harian di bawah level Hard SL Rp {item.stopLoss} atau MA20.
                                    </div>
                                  )}
                                </div>

                                {/* Drawer Box 4: Technical Confluence & Indicators */}
                                {p?.technicals && (
                                  <div className='drawer-box' style={{ background: 'var(--bg-panel)', padding: '10px', border: 'var(--border-muted)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                      <div style={{ fontWeight: '700', color: 'var(--accent-green)', fontSize: '10px', letterSpacing: '0.04em' }}>
                                        📈 TEKNIKAL &amp; CONFLUENCE SCORE:
                                      </div>
                                      <span style={{
                                        fontSize: '10px',
                                        fontFamily: 'var(--font-mono)',
                                        fontWeight: '800',
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        background: p.technicals.confluence_score >= 70 ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 149, 0, 0.2)',
                                        color: p.technicals.confluence_score >= 70 ? 'var(--accent-green)' : 'var(--accent-orange)'
                                      }}>
                                        {p.technicals.confluence_score}/100 CONF
                                      </span>
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', marginBottom: '4px', fontSize: '10px' }}>
                                      • <strong>RSI (14):</strong> {p.technicals.rsi_14} ({p.technicals.rsi_14 >= 70 ? 'Overbought' : p.technicals.rsi_14 <= 30 ? 'Oversold' : 'Zona Akumulasi Sehat'})
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', marginBottom: '4px', fontSize: '10px' }}>
                                      • <strong>MACD Status:</strong> <span style={{ fontWeight: '700', color: p.technicals.macd_status === 'GOLDEN_CROSS' || p.technicals.macd_status === 'BULLISH' ? 'var(--accent-green)' : '#ff3b30' }}>{p.technicals.macd_status}</span>
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', marginBottom: '4px', fontSize: '10px' }}>
                                      • <strong>EMA Alignment:</strong> {p.technicals.ema_alignment} (EMA 20/50/200)
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', marginBottom: '4px', fontSize: '10px' }}>
                                      • <strong>Bollinger Bands:</strong> {p.technicals.bollinger_squeeze ? '⚠️ SQUEEZE (Setup Ledakan Volatilitas)' : 'Band Normal'}
                                    </div>
                                    <div style={{ color: 'var(--text-primary)', fontSize: '10px' }}>
                                      • <strong>ATR (14) Volatilitas:</strong> {p.technicals.atr_14 > 0 ? (item.market === 'IDX' ? `Rp ${Number(p.technicals.atr_14).toLocaleString()}` : `$${p.technicals.atr_14}`) : 'N/A'}
                                    </div>
                                  </div>
                                )}

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

          {/* Table Footer */}
          <div style={{
            padding: '6px 12px',
            background: 'var(--bg-panel-subtle)',
            borderTop: 'var(--border-hairline)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>
              MENAMPILKAN {currentDataset.length} DARI {activeMainTab === 'STOCK' ? allStockItems.length : allCryptoItems.length} INSTRUMEN
            </div>
            <div>
              MBG APEX DISCIPLINE ENGINE · STRICT 1:2 R:R RATIO · ZERO EMOTIONAL HOPE
            </div>
          </div>
        </>
      )}

      {/* Level 2 Order Book Modal */}
      {orderBookModal.isOpen && (
        <OrderBookSimulator
          ticker={orderBookModal.ticker}
          currentPrice={orderBookModal.price}
          isOpen={orderBookModal.isOpen}
          brokerSummaryData={orderBookModal.brokerData || brokerSummary[orderBookModal.ticker] || brokerSummary[orderBookModal.ticker?.replace('.JK', '')]}
          onClose={() => setOrderBookModal({ isOpen: false, ticker: 'BBRI', price: 4900 })}
        />
      )}
      </div>
    </Suspense>
  );
}