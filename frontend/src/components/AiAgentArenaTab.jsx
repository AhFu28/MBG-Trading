import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import AssetIcon from './AssetIcon.jsx';

// Initial Mock Seed Data for Markets
const DEFAULT_MARKET_FEEDS = {
  'XAUUSD': { name: 'Gold / US Dollar', market: 'FUTURES', price: 2914.50, change: 0.85, high: 2928.00, low: 2898.10, atr: 18.5, regime: 'TRENDING_BULL' },
  'EURUSD': { name: 'Euro / US Dollar', market: 'FOREX', price: 1.0842, change: -0.12, high: 1.0875, low: 1.0820, atr: 0.0045, regime: 'RANGING' },
  'GBPUSD': { name: 'British Pound', market: 'FOREX', price: 1.2915, change: 0.34, high: 1.2950, low: 1.2880, atr: 0.0062, regime: 'TRENDING_BULL' },
  'BTCUSDT': { name: 'Bitcoin', market: 'CRYPTO', price: 92450.00, change: 2.45, high: 93800.00, low: 90200.00, atr: 1450.0, regime: 'HIGH_VOLATILITY' },
  'SOLUSDT': { name: 'Solana', market: 'CRYPTO', price: 188.40, change: 4.12, high: 194.20, low: 180.50, atr: 6.8, regime: 'MOMENTUM_BREAKOUT' },
  'BBCA': { name: 'Bank Central Asia', market: 'IDX', price: 9850, change: 1.02, high: 9950, low: 9750, atr: 120, regime: 'FOREIGN_ACCUMULATION' },
  'BBRI': { name: 'Bank Rakyat Indonesia', market: 'IDX', price: 4720, change: -0.63, high: 4780, low: 4690, atr: 75, regime: 'PULLBACK_SUPPORT' }
};

// 4 Specialized AI Agents Specifications
const INITIAL_AGENTS = [
  {
    id: 'TITAN',
    name: 'Agent TITAN',
    role: 'SMC & Liquidity Architect',
    description: 'Smart Money Concepts: Order Blocks, Fair Value Gaps (FVG), & Liquidity Sweeps. Low frequency, institutional R:R >= 1:3.',
    strategy: 'SMC_ORDER_BLOCK',
    avatar: '🏛️',
    color: '#3b82f6',
    status: 'HUNTING',
    targetMarkets: ['FUTURES', 'FOREX'],
    primaryPair: 'XAUUSD',
    winRate: 58.3,
    totalTrades: 24,
    wins: 14,
    losses: 10,
    profitFactor: 2.45,
    pnl: 1420.50,
    confidence: 86,
    exp3Weight: 0.32,
    activePositionsCount: 1
  },
  {
    id: 'ORACLE',
    name: 'Agent ORACLE',
    role: 'Macro & News Sentiment',
    description: 'Event-driven volatility capture for CPI, NFP, & Fed interest rates. Trailing stop agresif pada momentum berita.',
    strategy: 'NEWS_EVENT_MOMENTUM',
    avatar: '⚡',
    color: '#f59e0b',
    status: 'STANDBY',
    targetMarkets: ['FUTURES', 'FOREX', 'CRYPTO'],
    primaryPair: 'EURUSD',
    winRate: 63.6,
    totalTrades: 22,
    wins: 14,
    losses: 8,
    profitFactor: 2.10,
    pnl: 980.20,
    confidence: 78,
    exp3Weight: 0.26,
    activePositionsCount: 1
  },
  {
    id: 'VORTEX',
    name: 'Agent VORTEX',
    role: 'Trend Breakout & Momentum',
    description: 'Multi-Timeframe Donchian + ATR breakout rider. Mengikuti ekspansi tren besar di komoditas dan kripto.',
    strategy: 'VOLATILITY_EXPANSION',
    avatar: '🌪️',
    color: '#10b981',
    status: 'TRADING',
    targetMarkets: ['CRYPTO', 'FUTURES'],
    primaryPair: 'BTCUSDT',
    winRate: 52.0,
    totalTrades: 25,
    wins: 13,
    losses: 12,
    profitFactor: 2.80,
    pnl: 1850.40,
    confidence: 91,
    exp3Weight: 0.30,
    activePositionsCount: 1
  },
  {
    id: 'SENTINEL',
    name: 'Agent SENTINEL',
    role: 'Mean Reversion & Scalper',
    description: 'Asian Session & Sideways Scalper. Memanfaatkan deviasi Bollinger Bands + RSI oversold saat volatilitas rendah.',
    strategy: 'ASIAN_MEAN_REVERSION',
    avatar: '🛡️',
    color: '#8b5cf6',
    status: 'HUNTING',
    targetMarkets: ['FOREX', 'IDX'],
    primaryPair: 'BBCA',
    winRate: 71.4,
    totalTrades: 28,
    wins: 20,
    losses: 8,
    profitFactor: 1.95,
    pnl: 740.00,
    confidence: 74,
    exp3Weight: 0.12,
    activePositionsCount: 1
  }
];

// Initial Seed Open Positions
const INITIAL_POSITIONS = [
  {
    id: 'POS-TITAN-XAU-01',
    agentId: 'TITAN',
    symbol: 'XAUUSD',
    market: 'FUTURES',
    direction: 'LONG',
    entryPrice: 2908.40,
    currentPrice: 2914.50,
    slPrice: 2898.00,
    tp1Price: 2928.00,
    tp2Price: 2945.00,
    sizeLots: 0.50,
    trailingStopActive: true,
    floatingPnl: 305.00,
    roiPct: 2.10,
    openedAt: '2026-09-19T14:20:00Z',
    rationale: 'H4 Bullish Order Block mitigation with FVG sweep confirmation.'
  },
  {
    id: 'POS-VORTEX-BTC-01',
    agentId: 'VORTEX',
    symbol: 'BTCUSDT',
    market: 'CRYPTO',
    direction: 'LONG',
    entryPrice: 91800.00,
    currentPrice: 92450.00,
    slPrice: 90500.00,
    tp1Price: 94200.00,
    tp2Price: 96000.00,
    sizeLots: 0.50,
    trailingStopActive: false,
    floatingPnl: 325.00,
    roiPct: 0.71,
    openedAt: '2026-09-19T15:05:00Z',
    rationale: '20-day High Donchian Breakout confirmed by surge in volume.'
  },
  {
    id: 'POS-SENTINEL-BBCA-01',
    agentId: 'SENTINEL',
    symbol: 'BBCA',
    market: 'IDX',
    direction: 'LONG',
    entryPrice: 9775,
    currentPrice: 9850,
    slPrice: 9650,
    tp1Price: 10000,
    tp2Price: 10200,
    sizeLots: 100, // 100 Lot
    trailingStopActive: false,
    floatingPnl: 750000, // IDR
    isIdr: true,
    roiPct: 0.77,
    openedAt: '2026-09-19T10:15:00Z',
    rationale: 'RSI Rebound from lower Bollinger Band with foreign inflow.'
  }
];

// Initial Seed Closed History Journal
const INITIAL_JOURNAL = [
  {
    id: 'TRD-TITAN-001',
    agentId: 'TITAN',
    symbol: 'XAUUSD',
    market: 'FUTURES',
    direction: 'LONG',
    entryPrice: 2885.00,
    exitPrice: 2912.00,
    slPrice: 2874.00,
    tp1Price: 2910.00,
    pnl: 1350.00,
    roiPct: 9.35,
    rrAchieved: 2.45,
    exitReason: 'HIT_TP1',
    closedAt: '2026-09-19T12:30:00Z',
    isWin: true
  },
  {
    id: 'TRD-VORTEX-002',
    agentId: 'VORTEX',
    symbol: 'SOLUSDT',
    market: 'CRYPTO',
    direction: 'LONG',
    entryPrice: 178.50,
    exitPrice: 191.20,
    slPrice: 172.00,
    tp1Price: 190.00,
    pnl: 635.00,
    roiPct: 7.11,
    rrAchieved: 1.95,
    exitReason: 'TRAILING_STOP',
    closedAt: '2026-09-19T11:45:00Z',
    isWin: true
  },
  {
    id: 'TRD-ORACLE-003',
    agentId: 'ORACLE',
    symbol: 'EURUSD',
    market: 'FOREX',
    direction: 'SHORT',
    entryPrice: 1.0890,
    exitPrice: 1.0915,
    slPrice: 1.0915,
    tp1Price: 1.0820,
    pnl: -250.00,
    roiPct: -2.29,
    rrAchieved: -1.00,
    exitReason: 'HIT_SL',
    closedAt: '2026-09-19T09:15:00Z',
    isWin: false
  },
  {
    id: 'TRD-SENTINEL-004',
    agentId: 'SENTINEL',
    symbol: 'GBPUSD',
    market: 'FOREX',
    direction: 'LONG',
    entryPrice: 1.2840,
    exitPrice: 1.2885,
    slPrice: 1.2815,
    tp1Price: 1.2885,
    pnl: 450.00,
    roiPct: 3.50,
    rrAchieved: 1.80,
    exitReason: 'HIT_TP1',
    closedAt: '2026-09-19T08:00:00Z',
    isWin: true
  }
];

export default function AiAgentArenaTab({ data, livePrices = {}, onOpenChart }) {
  // Master Autonomous System State
  const [isRunning, setIsRunning] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_ai_arena_running');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [marketFeeds, setMarketFeeds] = useState(DEFAULT_MARKET_FEEDS);
  const [agents, setAgents] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_ai_arena_agents');
      return saved ? JSON.parse(saved) : INITIAL_AGENTS;
    } catch {
      return INITIAL_AGENTS;
    }
  });

  const [positions, setPositions] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_ai_arena_positions');
      return saved ? JSON.parse(saved) : INITIAL_POSITIONS;
    } catch {
      return INITIAL_POSITIONS;
    }
  });

  const [journal, setJournal] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_ai_arena_journal');
      return saved ? JSON.parse(saved) : INITIAL_JOURNAL;
    } catch {
      return INITIAL_JOURNAL;
    }
  });

  // Account Capital & Balances
  const [account, setAccount] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_ai_arena_account');
      return saved ? JSON.parse(saved) : {
        initialBalance: 10000.00,
        realizedBalance: 12180.20,
        currency: 'USD',
        maxDrawdownPct: 3.42,
        peakEquity: 12850.00
      };
    } catch {
      return {
        initialBalance: 10000.00,
        realizedBalance: 12180.20,
        currency: 'USD',
        maxDrawdownPct: 3.42,
        peakEquity: 12850.00
      };
    }
  });

  // Filters for Journal
  const [journalFilterAgent, setJournalFilterAgent] = useState('ALL');
  const [journalFilterMarket, setJournalFilterMarket] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  // Persistence Handler
  useEffect(() => {
    try {
      localStorage.setItem('mbg_ai_arena_running', JSON.stringify(isRunning));
      localStorage.setItem('mbg_ai_arena_agents', JSON.stringify(agents));
      localStorage.setItem('mbg_ai_arena_positions', JSON.stringify(positions));
      localStorage.setItem('mbg_ai_arena_journal', JSON.stringify(journal));
      localStorage.setItem('mbg_ai_arena_account', JSON.stringify(account));
    } catch (e) {
      console.warn('Storage sync failed:', e);
    }
  }, [isRunning, agents, positions, journal, account]);

  // Toast Helper
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Total Floating PnL
  const totalFloatingPnl = useMemo(() => {
    return positions.reduce((acc, pos) => {
      // If IDR, convert to USD approx (1 USD = 16,000 IDR) for aggregate portfolio display
      const pnlUsd = pos.isIdr ? pos.floatingPnl / 16000 : pos.floatingPnl;
      return acc + pnlUsd;
    }, 0);
  }, [positions]);

  const totalEquity = account.realizedBalance + totalFloatingPnl;

  // Real-Time 24/7 Tick & Order Simulation Engine
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setMarketFeeds(prevFeeds => {
        const nextFeeds = { ...prevFeeds };
        
        // Random slight market tick fluctuation
        Object.keys(nextFeeds).forEach(sym => {
          const item = nextFeeds[sym];
          const volatility = item.price * 0.0004; // 0.04% random swing
          const delta = (Math.random() - 0.495) * volatility;
          const newPrice = Number((item.price + delta).toFixed(item.price > 500 ? 2 : 4));
          nextFeeds[sym] = {
            ...item,
            price: newPrice,
            high: Math.max(item.high, newPrice),
            low: Math.min(item.low, newPrice)
          };
        });
        return nextFeeds;
      });

      // Update Running Positions based on simulated tick movements
      setPositions(prevPositions => {
        let hasClosedAny = false;
        const closedTradesToAdd = [];

        const updated = prevPositions.map(pos => {
          const feed = marketFeeds[pos.symbol];
          if (!feed) return pos;

          const currentPrice = feed.price;
          const calculatePnl = (direction, entry, current, lots, mkt, sym) => {
            const delta = direction === 'LONG' ? (current - entry) : (entry - current);
            if (mkt === 'IDX') return delta * lots * 100; // IDR shares
            if (sym.includes('XAU') || mkt === 'FUTURES') return delta * lots * 100; // Gold 100oz/lot
            if (mkt === 'FOREX') return delta * lots * 100000; // 100k units/lot
            if (mkt === 'CRYPTO') return delta * lots; // direct coin units
            return delta * lots;
          };

          const floatingPnl = calculatePnl(pos.direction, pos.entryPrice, currentPrice, pos.sizeLots, pos.market, pos.symbol);
          const roiPct = pos.direction === 'LONG'
            ? ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100
            : ((pos.entryPrice - currentPrice) / pos.entryPrice) * 100;

          // Check Trailing Stop Upgrade (if price achieved >= 1.2R, move SL to entry)
          let trailingStopActive = pos.trailingStopActive;
          let currentSl = pos.slPrice;
          if (pos.direction === 'LONG' && currentPrice >= (pos.entryPrice + (pos.tp1Price - pos.entryPrice) * 0.5)) {
            if (!trailingStopActive) {
              trailingStopActive = true;
              currentSl = pos.entryPrice + (currentPrice - pos.entryPrice) * 0.2; // Breakeven + buffer
            }
          }

          // Check Hit TP or Hit SL
          let shouldClose = false;
          let exitReason = '';
          let exitPrice = currentPrice;

          if (pos.direction === 'LONG') {
            if (currentPrice >= pos.tp2Price) {
              shouldClose = true;
              exitReason = 'HIT_TP2';
              exitPrice = pos.tp2Price;
            } else if (currentPrice >= pos.tp1Price && Math.random() < 0.20) {
              shouldClose = true;
              exitReason = 'HIT_TP1';
              exitPrice = pos.tp1Price;
            } else if (currentPrice <= currentSl) {
              shouldClose = true;
              exitReason = trailingStopActive ? 'TRAILING_STOP' : 'HIT_SL';
              exitPrice = currentSl;
            }
          }

          if (shouldClose) {
            hasClosedAny = true;
            closedTradesToAdd.push({
              id: `TRD-${Date.now()}-${pos.symbol}`,
              agentId: pos.agentId,
              symbol: pos.symbol,
              market: pos.market,
              direction: pos.direction,
              entryPrice: pos.entryPrice,
              exitPrice: exitPrice,
              slPrice: pos.slPrice,
              tp1Price: pos.tp1Price,
              pnl: pos.isIdr ? floatingPnl / 16000 : floatingPnl,
              roiPct: Number(roiPct.toFixed(2)),
              rrAchieved: Number((roiPct / 1.5).toFixed(2)),
              exitReason: exitReason,
              closedAt: new Date().toISOString(),
              isWin: floatingPnl > 0
            });
            return null; // Will be filtered out
          }

          return {
            ...pos,
            currentPrice,
            slPrice: currentSl,
            trailingStopActive,
            floatingPnl: Number(floatingPnl.toFixed(2)),
            roiPct: Number(roiPct.toFixed(2))
          };
        }).filter(Boolean);

        // Process closed trades
        if (hasClosedAny && closedTradesToAdd.length > 0) {
          setJournal(prevJ => [...closedTradesToAdd, ...prevJ]);
          
          // Update Account Balance
          const netPnlDelta = closedTradesToAdd.reduce((acc, c) => acc + c.pnl, 0);
          setAccount(prevAcc => {
            const nextRealized = prevAcc.realizedBalance + netPnlDelta;
            return {
              ...prevAcc,
              realizedBalance: Number(nextRealized.toFixed(2)),
              peakEquity: Math.max(prevAcc.peakEquity, nextRealized)
            };
          });

          // Self-Improvement / Update EXP3 Bandit weights
          setAgents(prevAgents => {
            return prevAgents.map(ag => {
              const agentTrades = closedTradesToAdd.filter(c => c.agentId === ag.id);
              if (agentTrades.length === 0) return ag;

              const winsCount = agentTrades.filter(t => t.isWin).length;
              const totalNew = agentTrades.length;
              const newWins = ag.wins + winsCount;
              const newTotal = ag.totalTrades + totalNew;
              const newWinRate = Number(((newWins / newTotal) * 100).toFixed(1));
              const newPnl = Number((ag.pnl + agentTrades.reduce((acc, t) => acc + t.pnl, 0)).toFixed(2));

              // Bandit reinforcement adjustment
              const weightDelta = winsCount > 0 ? 0.03 : -0.02;
              const newWeight = Math.min(0.50, Math.max(0.05, Number((ag.exp3Weight + weightDelta).toFixed(2))));

              return {
                ...ag,
                wins: newWins,
                totalTrades: newTotal,
                winRate: newWinRate,
                pnl: newPnl,
                exp3Weight: newWeight,
                activePositionsCount: Math.max(0, ag.activePositionsCount - totalNew)
              };
            });
          });

          showToast(`⚡ Order Closed: ${closedTradesToAdd[0].symbol} (${closedTradesToAdd[0].exitReason}) PnL: $${closedTradesToAdd[0].pnl.toFixed(2)}`);
        }

        return updated;
      });

      // Periodically spawn new smart trades if slots open
      if (Math.random() < 0.08 && positions.length < 5) {
        const availableAgents = agents.filter(a => a.activePositionsCount < 2);
        if (availableAgents.length > 0) {
          const chosenAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
          const feedKeys = Object.keys(marketFeeds);
          const targetKey = feedKeys[Math.floor(Math.random() * feedKeys.length)];
          const targetFeed = marketFeeds[targetKey];

          if (targetFeed && !positions.some(p => p.symbol === targetKey)) {
            const entry = targetFeed.price;
            const isLong = Math.random() > 0.3; // 70% Long bias
            const atr = targetFeed.atr || (entry * 0.01);
            const sl = isLong ? entry - (atr * 1.5) : entry + (atr * 1.5);
            const tp1 = isLong ? entry + (atr * 2.5) : entry - (atr * 2.5);
            const tp2 = isLong ? entry + (atr * 4.0) : entry - (atr * 4.0);

            const newPos = {
              id: `POS-${chosenAgent.id}-${targetKey}-${Date.now().toString().slice(-4)}`,
              agentId: chosenAgent.id,
              symbol: targetKey,
              market: targetFeed.market,
              direction: isLong ? 'LONG' : 'SHORT',
              entryPrice: Number(entry.toFixed(targetFeed.market === 'IDX' ? 0 : 2)),
              currentPrice: Number(entry.toFixed(targetFeed.market === 'IDX' ? 0 : 2)),
              slPrice: Number(sl.toFixed(targetFeed.market === 'IDX' ? 0 : 2)),
              tp1Price: Number(tp1.toFixed(targetFeed.market === 'IDX' ? 0 : 2)),
              tp2Price: Number(tp2.toFixed(targetFeed.market === 'IDX' ? 0 : 2)),
              sizeLots: targetFeed.market === 'IDX' ? 100 : targetKey.includes('BTC') ? 0.04 : 0.40,
              trailingStopActive: false,
              floatingPnl: 0,
              roiPct: 0,
              isIdr: targetFeed.market === 'IDX',
              openedAt: new Date().toISOString(),
              rationale: `${chosenAgent.role}: Autonomous Opportunity Signal detected with regime ${targetFeed.regime}.`
            };

            setPositions(prev => [newPos, ...prev]);
            setAgents(prev => prev.map(a => a.id === chosenAgent.id ? { ...a, activePositionsCount: a.activePositionsCount + 1 } : a));
            showToast(`🚀 New Trade Opened by ${chosenAgent.name}: ${targetKey} (${isLong ? 'BUY' : 'SELL'})`);
          }
        }
      }

    }, 1400);

    return () => clearInterval(interval);
  }, [isRunning, marketFeeds, positions, agents, showToast]);

  // Manual Close Single Trade
  const handleManualClose = useCallback((posId) => {
    setPositions(prev => {
      const target = prev.find(p => p.id === posId);
      if (!target) return prev;

      const pnlUsd = target.isIdr ? target.floatingPnl / 16000 : target.floatingPnl;
      const closedEntry = {
        id: `TRD-MANUAL-${Date.now()}`,
        agentId: target.agentId,
        symbol: target.symbol,
        market: target.market,
        direction: target.direction,
        entryPrice: target.entryPrice,
        exitPrice: target.currentPrice,
        slPrice: target.slPrice,
        tp1Price: target.tp1Price,
        pnl: Number(pnlUsd.toFixed(2)),
        roiPct: target.roiPct,
        rrAchieved: Number((target.roiPct / 1.5).toFixed(2)),
        exitReason: 'MANUAL_CLOSE',
        closedAt: new Date().toISOString(),
        isWin: pnlUsd > 0
      };

      setJournal(j => [closedEntry, ...j]);
      setAccount(acc => ({
        ...acc,
        realizedBalance: Number((acc.realizedBalance + pnlUsd).toFixed(2))
      }));
      setAgents(ags => ags.map(a => a.id === target.agentId ? { ...a, activePositionsCount: Math.max(0, a.activePositionsCount - 1) } : a));
      showToast(`Position ${target.symbol} closed manually.`);

      return prev.filter(p => p.id !== posId);
    });
  }, [showToast]);

  // Reset Simulation State
  const handleResetSimulation = () => {
    if (window.confirm('Reset seluruh data simulasi AI Agent Arena kembali ke setelan awal default?')) {
      localStorage.removeItem('mbg_ai_arena_running');
      localStorage.removeItem('mbg_ai_arena_agents');
      localStorage.removeItem('mbg_ai_arena_positions');
      localStorage.removeItem('mbg_ai_arena_journal');
      localStorage.removeItem('mbg_ai_arena_account');
      setAgents(INITIAL_AGENTS);
      setPositions(INITIAL_POSITIONS);
      setJournal(INITIAL_JOURNAL);
      setAccount({
        initialBalance: 10000.00,
        realizedBalance: 12180.20,
        currency: 'USD',
        maxDrawdownPct: 3.42,
        peakEquity: 12850.00
      });
      setIsRunning(true);
      showToast('Simulation state successfully reset.');
    }
  };

  // Filtered Journal
  const filteredJournal = useMemo(() => {
    return journal.filter(item => {
      const matchAgent = journalFilterAgent === 'ALL' || item.agentId === journalFilterAgent;
      const matchMarket = journalFilterMarket === 'ALL' || item.market === journalFilterMarket;
      return matchAgent && matchMarket;
    });
  }, [journal, journalFilterAgent, journalFilterMarket]);

  // Aggregated Performance Statistics
  const stats = useMemo(() => {
    const total = filteredJournal.length;
    const wins = filteredJournal.filter(j => j.isWin).length;
    const losses = total - wins;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
    const grossProfit = filteredJournal.filter(j => j.pnl > 0).reduce((a, b) => a + b.pnl, 0);
    const grossLoss = Math.abs(filteredJournal.filter(j => j.pnl < 0).reduce((a, b) => a + b.pnl, 0));
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? '99.0' : '0.0');
    const netPnl = grossProfit - grossLoss;

    return { total, wins, losses, winRate, profitFactor, netPnl, grossProfit, grossLoss };
  }, [filteredJournal]);

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'var(--bg-panel-dark)',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--accent-blue)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🤖</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MASTER TELEMETRY & 24/7 COMMAND CONTROL DECK                           */}
      {/* ========================================================================= */}
      <div className="telemetry-panel" style={{ padding: '16px', background: 'var(--bg-panel)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
                AI Multi-Agent EA Arena & Cockpit
              </h1>
              <span className="badge" style={{ background: 'rgba(37, 99, 235, 0.15)', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)' }}>
                v1.0 REAL-MARKET SIMULATOR
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Ekosistem 4 Agen Kuantitatif Mandiri dengan Adaptasi EXP3 Reinforcement Learning, Evaluasi Berita Makro, & Eksekusi Real-Market.
            </p>
          </div>

          {/* Master Control Toggle Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                setIsRunning(prev => !prev);
                showToast(isRunning ? 'AI Agents paused.' : 'AI Agents started 24/7 scanning.');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                border: 'none',
                background: isRunning ? 'var(--accent-green)' : 'var(--accent-rust)',
                color: '#ffffff',
                boxShadow: isRunning ? '0 0 16px rgba(22, 163, 74, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffffff', display: 'inline-block' }} />
              <span>{isRunning ? '▶ 24/7 AUTONOMOUS ACTIVE' : '⏸ SYSTEM PAUSED'}</span>
            </button>

            <button
              onClick={handleResetSimulation}
              className="telemetry-btn"
              style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700' }}
              title="Reset ke kondisi awal"
            >
              🔄 Reset Lab
            </button>
          </div>
        </div>

        {/* Portfolio Stats Bento Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
          
          <div style={{ padding: '12px', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)', border: 'var(--border-hairline)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Virtual Equity</div>
            <div style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
              ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '10px', color: totalFloatingPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {totalFloatingPnl >= 0 ? '+' : ''}${totalFloatingPnl.toFixed(2)} Floating PnL
            </div>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)', border: 'var(--border-hairline)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Realized Balance</div>
            <div style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
              ${account.realizedBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              +${(account.realizedBalance - account.initialBalance).toFixed(2)} Net Gain
            </div>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)', border: 'var(--border-hairline)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Global Win Rate</div>
            <div style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', marginTop: '2px' }}>
              {stats.winRate}%
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {stats.wins} Menang / {stats.losses} Kalah
            </div>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)', border: 'var(--border-hairline)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Profit Factor</div>
            <div style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', marginTop: '2px' }}>
              {stats.profitFactor}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              Gross: +${stats.grossProfit.toFixed(0)} / -${stats.grossLoss.toFixed(0)}
            </div>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)', border: 'var(--border-hairline)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Max Drawdown</div>
            <div style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--accent-rust)', marginTop: '2px' }}>
              {account.maxDrawdownPct}%
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              Batas Kill-Switch: 5.0%
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 4 AI AGENTS BATTLEGROUND CARDS                                     */}
      {/* ========================================================================= */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>⚔️</span>
            <h2 style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0 }}>
              Agent Battleground & Self-Improvement Leaderboard
            </h2>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Algoritma: EXP3 Multi-Armed Bandit Dynamic Weighting
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '12px' }}>
          {agents.map(ag => {
            const isDefensive = ag.status === 'DEFENSIVE';
            const isStandby = ag.status === 'STANDBY';
            return (
              <div 
                key={ag.id} 
                className="telemetry-panel" 
                style={{ 
                  padding: '14px', 
                  borderTop: `3px solid ${ag.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '24px' }}>{ag.avatar}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '900', color: 'var(--text-primary)' }}>{ag.name}</div>
                        <div style={{ fontSize: '10px', color: ag.color, fontWeight: '700' }}>{ag.role}</div>
                      </div>
                    </div>
                    
                    <span 
                      className="badge" 
                      style={{ 
                        fontSize: '9px',
                        background: isDefensive ? 'rgba(220, 38, 38, 0.15)' : isStandby ? 'rgba(245, 158, 11, 0.15)' : 'rgba(22, 163, 74, 0.15)',
                        color: isDefensive ? 'var(--accent-rust)' : isStandby ? 'var(--accent-orange)' : 'var(--accent-green)',
                        border: '1px solid currentColor'
                      }}
                    >
                      {ag.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '12px', minHeight: '30px' }}>
                    {ag.description}
                  </p>

                  {/* Agent Metrics Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', background: 'var(--bg-panel-subtle)', padding: '8px', borderRadius: '4px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Win Rate</div>
                      <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
                        {ag.winRate}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Profit Factor</div>
                      <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
                        {ag.profitFactor}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PnL Kontribusi</div>
                      <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        +${ag.pnl.toFixed(0)}
                      </div>
                    </div>
                  </div>

                  {/* EXP3 Bandit Weight Bar */}
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Alokasi Modal (EXP3 Weight)</span>
                      <span style={{ fontWeight: '800', color: ag.color }}>{(ag.exp3Weight * 100).toFixed(0)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${ag.exp3Weight * 100}%`, height: '100%', background: ag.color, borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: 'var(--border-hairline)', fontSize: '10px', color: 'var(--text-muted)' }}>
                  <span>Target: <strong style={{ color: 'var(--text-primary)' }}>{ag.primaryPair}</strong></span>
                  <span>Trade Aktif: <strong style={{ color: 'var(--accent-blue)' }}>{ag.activePositionsCount}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SMART CROSS-MARKET OPPORTUNITY RADAR                                   */}
      {/* ========================================================================= */}
      <div className="telemetry-panel" style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>📡</span>
            <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0 }}>
              Smart Cross-Market Opportunity Radar (Live Regime Scanner)
            </h3>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
            ● AUTO-FUNNEL KE PAIR TERTINGGI
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          {Object.entries(marketFeeds).map(([sym, feed]) => {
            const isForex = feed.market === 'FOREX';
            const isIdx = feed.market === 'IDX';
            const isCrypto = feed.market === 'CRYPTO';
            return (
              <div 
                key={sym} 
                style={{ 
                  padding: '10px', 
                  background: 'var(--bg-panel-subtle)', 
                  borderRadius: 'var(--radius-sm)', 
                  border: 'var(--border-hairline)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '900', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {sym}
                    </span>
                    <span className="badge" style={{ fontSize: '8px', padding: '1px 5px' }}>
                      {feed.market}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>{feed.name}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                      {isIdx ? `Rp ${Math.round(feed.price).toLocaleString('id-ID')}` : `$${feed.price.toLocaleString('en-US', { minimumFractionDigits: isForex ? 4 : 2 })}`}
                    </span>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: feed.change >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                      {feed.change >= 0 ? '+' : ''}{feed.change}%
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '9px', padding: '3px 6px', borderRadius: '3px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  Regime: <strong>{feed.regime}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. RUNNING POSITIONS (LIVE TRADE STREAM)                                  */}
      {/* ========================================================================= */}
      <div className="telemetry-panel" style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>⚡</span>
            <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0 }}>
              Posisi Terbuka Real-Time ({positions.length})
            </h3>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Trailing Stop Otomatis Aktif saat Profit $\ge 1.2R$
          </span>
        </div>

        {positions.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            Tidak ada posisi aktif saat ini. Agen sedang memindai peluang setup baru...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              <thead>
                <tr style={{ borderBottom: 'var(--border-hairline)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>PAIR / INSTRUMEN</th>
                  <th style={{ padding: '8px' }}>AGEN</th>
                  <th style={{ padding: '8px' }}>ARAH</th>
                  <th style={{ padding: '8px' }}>ENTRY</th>
                  <th style={{ padding: '8px' }}>HARGA SEKARANG</th>
                  <th style={{ padding: '8px' }}>SL / TRAILING</th>
                  <th style={{ padding: '8px' }}>TARGET TP1</th>
                  <th style={{ padding: '8px' }}>FLOATING PnL</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(pos => {
                  const isLong = pos.direction === 'LONG';
                  const isProfit = pos.floatingPnl >= 0;
                  return (
                    <tr key={pos.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: '800', color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{pos.symbol}</span>
                          <span className="badge" style={{ fontSize: '7.5px', padding: '1px 4px' }}>{pos.market}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{ fontWeight: '700', color: 'var(--accent-blue)' }}>{pos.agentId}</span>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span 
                          style={{ 
                            fontWeight: '800', 
                            padding: '2px 6px', 
                            borderRadius: '3px',
                            background: isLong ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                            color: isLong ? 'var(--accent-green)' : 'var(--accent-rust)'
                          }}
                        >
                          {pos.direction}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px' }}>{pos.entryPrice}</td>
                      <td style={{ padding: '10px 8px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {pos.currentPrice}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{pos.slPrice}</span>
                          {pos.trailingStopActive && (
                            <span style={{ fontSize: '8px', padding: '1px 4px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-blue)', borderRadius: '2px' }}>
                              TRAIL
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--accent-green)' }}>{pos.tp1Price}</td>
                      <td style={{ padding: '10px 8px', fontWeight: '800', color: isProfit ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                        {isProfit ? '+' : ''}{pos.isIdr ? `Rp ${pos.floatingPnl.toLocaleString('id-ID')}` : `$${pos.floatingPnl.toFixed(2)}`} ({pos.roiPct > 0 ? '+' : ''}{pos.roiPct}%)
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleManualClose(pos.id)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '9px',
                            background: 'rgba(220, 38, 38, 0.1)',
                            border: '1px solid var(--accent-rust)',
                            color: 'var(--accent-rust)',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: '700'
                          }}
                        >
                          Tutup
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE TRADE JOURNAL & REKAP ANALITIK                             */}
      {/* ========================================================================= */}
      <div className="telemetry-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>📓</span>
              <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0 }}>
                Jurnal Trading & Rekap Riwayat Transaksi ({filteredJournal.length})
              </h3>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Laporan performa otomatis untuk evaluasi strategi, rasio profitabilitas, dan kurva hasil.
            </div>
          </div>

          {/* Interactive Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Filter Agen:</span>
              <select
                value={journalFilterAgent}
                onChange={e => setJournalFilterAgent(e.target.value)}
                style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', background: 'var(--bg-panel-subtle)', color: 'var(--text-primary)', border: 'var(--border-hairline)' }}
              >
                <option value="ALL">Semua Agen</option>
                <option value="TITAN">Agent TITAN (SMC)</option>
                <option value="ORACLE">Agent ORACLE (News)</option>
                <option value="VORTEX">Agent VORTEX (Trend)</option>
                <option value="SENTINEL">Agent SENTINEL (Range)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Filter Pasar:</span>
              <select
                value={journalFilterMarket}
                onChange={e => setJournalFilterMarket(e.target.value)}
                style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', background: 'var(--bg-panel-subtle)', color: 'var(--text-primary)', border: 'var(--border-hairline)' }}
              >
                <option value="ALL">Semua Pasar</option>
                <option value="FUTURES">Futures / Commodities</option>
                <option value="FOREX">Forex</option>
                <option value="CRYPTO">Crypto</option>
                <option value="IDX">Saham BEI</option>
              </select>
            </div>
          </div>
        </div>

        {/* Closed History Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr style={{ borderBottom: 'var(--border-hairline)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>WAKTU EKSEKUSI</th>
                <th style={{ padding: '8px' }}>PAIR</th>
                <th style={{ padding: '8px' }}>AGEN</th>
                <th style={{ padding: '8px' }}>ENTRY</th>
                <th style={{ padding: '8px' }}>EXIT</th>
                <th style={{ padding: '8px' }}>ALASAN KELUAR</th>
                <th style={{ padding: '8px' }}>R:R DICAPAI</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>REALIZED PnL</th>
              </tr>
            </thead>
            <tbody>
              {filteredJournal.map(item => {
                const isWin = item.isWin;
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '9px 8px', color: 'var(--text-muted)' }}>
                      {new Date(item.closedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </td>
                    <td style={{ padding: '9px 8px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {item.symbol}
                    </td>
                    <td style={{ padding: '9px 8px', color: 'var(--accent-blue)', fontWeight: '700' }}>
                      {item.agentId}
                    </td>
                    <td style={{ padding: '9px 8px' }}>{item.entryPrice}</td>
                    <td style={{ padding: '9px 8px' }}>{item.exitPrice}</td>
                    <td style={{ padding: '9px 8px' }}>
                      <span 
                        style={{ 
                          fontSize: '8.5px', 
                          padding: '2px 5px', 
                          borderRadius: '3px',
                          background: isWin ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                          color: isWin ? 'var(--accent-green)' : 'var(--accent-rust)',
                          fontWeight: '700'
                        }}
                      >
                        {item.exitReason}
                      </span>
                    </td>
                    <td style={{ padding: '9px 8px', color: item.rrAchieved > 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                      {item.rrAchieved > 0 ? `1:${item.rrAchieved}` : `${item.rrAchieved}R`}
                    </td>
                    <td style={{ padding: '9px 8px', textAlign: 'right', fontWeight: '800', color: isWin ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                      {isWin ? '+' : ''}${item.pnl.toFixed(2)} ({item.roiPct > 0 ? '+' : ''}{item.roiPct}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
