import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import PasswordGate from './components/PasswordGate.jsx';
import { fetchMe } from './services/accountClient.js';
import { endSession } from './services/sessionCleanup.js';
import { canAccess, requiredTierFor, MODULES, TIER } from './services/featureAccess.js';
import MasterQuantLeaderboard from './components/MasterQuantLeaderboard.jsx';
import CmcMarketDashboard from './components/cmc/CmcMarketDashboard.jsx';
import CmcTopNav from './components/CmcTopNav.jsx';
import { useLivePrices } from './hooks/useLivePrices.js';
import PersonalWatchlistTab from './components/PersonalWatchlistTab.jsx';
import CommandPaletteModal from './components/CommandPaletteModal.jsx';
import DataIntegrityModal from './components/DataIntegrityModal.jsx';
import ComplianceRiskModal from './components/ComplianceRiskModal.jsx';
import OnboardingModal from './components/OnboardingModal.jsx';

// Code Splitting for heavy secondary modules
const TradingViewModal = lazy(() => import('./components/TradingViewModal.jsx'));
const LotCalculatorModal = lazy(() => import('./components/LotCalculatorModal.jsx'));
const OrderExecutionModal = lazy(() => import('./components/OrderExecutionModal.jsx'));
const ChartPredictionModal = lazy(() => import('./components/ChartPredictionModal.jsx'));
import { institutionalPaperBroker } from './services/brokerGateway.js';
const FlowProcessTab = lazy(() => import('./components/FlowProcessTab.jsx'));
const ResearchDeskTab = lazy(() => import('./components/ResearchDeskTab.jsx'));
const ChangelogTab = lazy(() => import('./components/ChangelogTab.jsx'));
const ChartingDeskTab = lazy(() => import('./components/ChartingDeskTab.jsx'));
const WhaleIntelligenceTab = lazy(() => import('./components/WhaleIntelligenceTab.jsx'));
const CryptoFuturesTab = lazy(() => import('./components/CryptoFuturesTab.jsx'));
const CryptoDeskTab = lazy(() => import('./components/CryptoDeskTab.jsx'));
const StockDeskTab = lazy(() => import('./components/StockDeskTab.jsx'));
const SettingsPage = lazy(() => import('./components/SettingsPage.jsx'));
const ForexCommandTab = lazy(() => import('./components/ForexCommandTab.jsx'));
const USStockTab = lazy(() => import('./components/USStockTab.jsx'));
const MarketHeatmapTab = lazy(() => import('./components/MarketHeatmapTab.jsx'));
const NewsDetailModal = lazy(() => import('./components/NewsDetailModal.jsx'));
const NewsTab = lazy(() => import('./components/NewsTab.jsx'));
const SecurityHubDrawer = lazy(() => import('./components/SecurityHubDrawer.jsx'));
const AiAgentArenaTab = lazy(() => import('./components/AiAgentArenaTab.jsx'));
const AiIntelligenceDrawer = lazy(() => import('./components/AiIntelligenceDrawer.jsx'));
const SignalsTab = lazy(() => import('./components/SignalsTab.jsx'));
const LandingPage = lazy(() => import('./components/LandingPage.jsx'));
const SubscriptionPage = lazy(() => import('./components/SubscriptionPage.jsx'));
const AchievementsPage = lazy(() => import('./components/AchievementsPage.jsx'));
// The LEGEND desks are lazy for the same reason as every other heavy tab: a
// non-Legend account should never download the execution surface's code.
const LegendDeskTab = lazy(() => import('./components/LegendDeskTab.jsx'));
const AdminApprovalDesk = lazy(() => import('./components/AdminApprovalDesk.jsx'));

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Unified Real-time Live Price Engine (Binance WebSocket + TradingView Scanners)
  const { livePrices, flashMap, allIdxStocks, allCryptoSpot, isWsConnected, lastUpdateTime, refetchAll } = useLivePrices(data);

  // Native hash routing
  /**
   * Resolve the active tab from the URL.
   *
   * HASH WINS OVER THE QUERY STRING, and that ordering is load-bearing.
   *
   * `setActiveTab` writes the hash, and the hashchange listener re-reads the
   * whole URL. When the query string was checked FIRST, a URL like
   * `/?tab=HOME#achievements` resolved back to HOME on every hash change — so
   * clicking a menu item updated the hash and then immediately snapped back to
   * the page it started on. The menu looked dead: it changed nothing on screen.
   *
   * `?tab=` is still honoured for entry links (the E2E suite and any bookmark
   * use it), but only when there is no hash, which is the genuinely "fresh
   * navigation" case.
   */
  const getTabFromHash = () => {
    const hash = window.location.hash.replace('#', '').toUpperCase();
    if (hash) return hash;
    try {
      const params = new URLSearchParams(window.location.search);
      const qTab = params.get('tab');
      if (qTab) return qTab.toUpperCase();
    } catch (e) {}
    return 'HOME';
  };
  const [activeTab, setActiveTabState] = useState(getTabFromHash);

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    window.location.hash = tab.toLowerCase();
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const tab = getTabFromHash();
      if (tab) setActiveTabState(tab);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isIntegrityOpen, setIsIntegrityOpen] = useState(false);

  // Dynamic Data Health & Gemini Model derivation
  const bundleDate = data?.last_updated ? new Date(data.last_updated) : null;
  const bundleAgeMin = bundleDate ? Math.max(0, Math.round((Date.now() - bundleDate.getTime()) / 60000)) : 999;
  const isBundleFresh = bundleAgeMin < 60;
  const bundleStatus = isBundleFresh ? '🟢 SYNCED' : (bundleAgeMin < 360 ? '🟡 DEGRADED' : '🔴 STALE');
  const bundleColor = isBundleFresh ? 'var(--accent-emerald)' : (bundleAgeMin < 360 ? 'var(--accent-gold)' : '#ef4444');
  const activeGeminiModel = data?.model_used || data?.daily_snips?.model_used || 'gemini-3.8-flash';
  const geminiShortLabel = String(activeGeminiModel).toUpperCase().replace('GEMINI-', '').replace(' (AUTO-DISCOVERED)', '');

  // Global Keyboard Listener for Command Palette (Ctrl + K / Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dark Mode state with persistence in localStorage
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('mbg_theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('mbg_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  /**
   * Set the theme to a specific value.
   *
   * The Settings page offers Dark and Light as a direct choice, so it needs a
   * setter rather than a toggle — a toggle would flip AWAY from the mode the
   * user just clicked when it is already active.
   */
  const applyTheme = useCallback((next) => {
    setTheme(next === 'light' ? 'light' : 'dark');
  }, []);

  // Display Mode: 'SIMPLE' (Mode Santai / New User) vs 'PRO' (Full Quant Terminal)
  const [displayMode, setDisplayMode] = useState(() => {
    try {
      return localStorage.getItem('mbg_display_mode') || 'PRO';
    } catch (e) {
      return 'PRO';
    }
  });

  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(prev => {
      const next = prev === 'PRO' ? 'SIMPLE' : 'PRO';
      try { localStorage.setItem('mbg_display_mode', next); } catch (e) {}
      return next;
    });
  }, []);

  // ACCOUNT ENTITLEMENT — the tier is owned by the server.
  //
  // Order matters: /api/account/me is asked FIRST because it is the per-user
  // answer. Only if that says "no account session" do we fall back to the
  // legacy cockpit password (/api/auth), which the owner still uses. Before
  // this, every authenticated visitor was silently treated as PRO.
  const [account, setAccount] = useState(null);
  const [accountChecked, setAccountChecked] = useState(false);

  const refreshAccount = useCallback(async () => {
    const me = await fetchMe();
    if (me.authenticated) {
      setAccount(me);
      setAccountChecked(true);
      return me;
    }
    // Fall back to the owner password session.
    try {
      const res = await fetch('/api/auth', { credentials: 'same-origin' });
      if (res.ok) {
        const body = await res.json();
        if (body?.authenticated) {
          const owner = { authenticated: true, tier: 'pro', isPro: true, owner: true, email: body.email || null };
          setAccount(owner);
          setAccountChecked(true);
          return owner;
        }
      }
    } catch {
      // No server (static preview) — fall through to guest.
    }
    setAccount(me);
    setAccountChecked(true);
    return me;
  }, []);

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => { refreshAccount(); }, [refreshAccount]);

  useEffect(() => {
    if (account?.authenticated) {
      try {
        const onboarded = localStorage.getItem('mbg_onboarded_v1');
        if (!onboarded) {
          setShowOnboarding(true);
        }
      } catch (e) {}
    }
  }, [account?.authenticated]);

  /**
   * The single logout path for the whole app.
   *
   * Order matters: revoke on the server first, then clear the React account
   * state, then reload. Reloading is what guarantees the user actually lands on
   * the LandingPage — it re-asks /api/account/me and /api/auth with no stale
   * in-memory state that could flash the terminal for a frame.
   */
  const handleLogout = useCallback(async () => {
    await endSession();
    setAccount({ authenticated: false, tier: 'guest', isPro: false, isAdmin: false });
    window.location.reload();
  }, []);

  const isAdmin = !!account?.isAdmin || ['naufalarib60@gmail.com', 'ahmfuadi28@gmail.com'].includes(String(account?.email || '').toLowerCase());

  /**
   * The tier the UI gates on. The SERVER decides it; this only reads.
   *
   * BUG FIXED HERE (2026-10-09): this used to collapse every paid account to
   * 'PRO' whenever `isPro` was true, so a LEGEND account was labelled PRO and
   * then locked out of its own LEGEND modules by `canAccess`. The gate and the
   * label disagreed, and the gate won — a user who had earned the tier, and paid
   * for it, still saw "Modul Ini Khusus Legend" with no way through. Found by
   * probing what each tier actually renders, after a test that should have caught
   * it passed anyway.
   *
   * Order of precedence, and why:
   *   admin  — bypasses every gate, and must be checked before the server tier
   *            because an admin account may not carry a paid tier at all.
   *   legend — an explicit tier from the server. It is only ever issued after the
   *            server has re-verified the achievements, so trusting it here is
   *            trusting the authority that owns entitlement.
   *   pro    — `isPro` still implies PRO, for accounts whose tier field is absent
   *            (an older session shape). This is the previous behaviour, kept as
   *            the fallback rather than the first rule.
   */
  const userTier = (() => {
    if (isAdmin) return 'PRO';
    const serverTier = String(account?.tier || '').toUpperCase();
    if (serverTier === 'LEGEND') return 'LEGEND';
    if (serverTier === 'PRO' || account?.isPro) return 'PRO';
    return account?.authenticated ? 'FREE' : 'GUEST';
  })();

  // TradingView Chart Modal State
  const [chartModal, setChartModal] = useState({
    isOpen: false,
    symbol: 'AMMN',
    market: 'IDX'
  });

  const handleOpenChart = useCallback((symbol = 'AMMN', marketOrPair = 'IDX') => {
    const isPair = typeof marketOrPair === 'string' && (marketOrPair.includes('USDT') || marketOrPair.includes('USDC'));
    const isCryptoSym = typeof symbol === 'string' && (
      symbol.toUpperCase().endsWith('USDT') || symbol.toUpperCase().endsWith('USDC') ||
      ['BTC', 'ETH', 'SOL', 'HYPE', 'SUI', 'DOGE', 'AVAX', 'LINK', 'XRP', 'BNB'].includes(symbol.toUpperCase())
    );
    const resolvedSymbol = isPair ? marketOrPair : (isCryptoSym && !symbol.toUpperCase().endsWith('USDT') ? `${symbol.toUpperCase()}USDT` : symbol);
    const resolvedMarket = (isPair || isCryptoSym) ? 'CRYPTO' : (marketOrPair === 'CRYPTO' || marketOrPair === 'IDX' || marketOrPair === 'US' ? marketOrPair : 'IDX');

    setChartModal({
      isOpen: true,
      symbol: resolvedSymbol,
      market: resolvedMarket
    });
  }, []);

  const handleCloseChart = useCallback(() => {
    setChartModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Lot Calculator Modal State
  const [lotCalcModal, setLotCalcModal] = useState({
    isOpen: false,
    entry: '',
    sl: '',
    market: 'IDX',
    symbol: ''
  });

  const handleOpenLotCalc = useCallback((entry = '', sl = '', market = 'IDX', symbol = '') => {
    setLotCalcModal({ isOpen: true, entry, sl, market, symbol });
  }, []);

  const handleCloseLotCalc = useCallback(() => {
    setLotCalcModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Institutional Order Execution Modal State (Paper & Live)
  const [executionModal, setExecutionModal] = useState({
    isOpen: false,
    prefill: null
  });

  const handleOpenExecution = useCallback((prefill = null) => {
    setExecutionModal({
      isOpen: true,
      prefill
    });
  }, []);

  const handleCloseExecution = useCallback(() => {
    setExecutionModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // 🎯 Chart Prediction & Strategy Scoring Arena (Legend Path requirement)
  const [predictionModal, setPredictionModal] = useState({
    isOpen: false,
    symbol: 'BTCUSDT',
    market: 'CRYPTO',
    price: null,
  });

  const handleOpenPrediction = useCallback((prefill = {}) => {
    setPredictionModal({
      isOpen: true,
      symbol: prefill.symbol || 'BTCUSDT',
      market: prefill.market || 'CRYPTO',
      price: prefill.price || null,
    });
  }, []);

  const handleClosePrediction = useCallback(() => {
    setPredictionModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Live Position Ratchet & Trailing Stop Updates on Live Price Engine Ticks
  useEffect(() => {
    if (livePrices && Object.keys(livePrices).length > 0) {
      try {
        institutionalPaperBroker.updatePositionsOnTick(livePrices);
      } catch (e) {
        console.warn('Failed to update paper positions on tick:', e);
      }
    }
  }, [livePrices]);

  // News Detail Modal State
  const [newsModal, setNewsModal] = useState({
    isOpen: false,
    news: null
  });

  const handleOpenNews = useCallback((newsItem) => {
    if (!newsItem) return;
    setNewsModal({
      isOpen: true,
      news: newsItem
    });
  }, []);

  const handleCloseNews = useCallback(() => {
    setNewsModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Institutional Security Hub Drawer State
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  const [securityHub, setSecurityHub] = useState({
    isOpen: false,
    symbol: 'BBCA',
    market: 'IDX'
  });

  const handleOpenSecurityHub = useCallback((symbol = 'BBCA', market = 'IDX') => {
    setSecurityHub({
      isOpen: true,
      symbol: symbol,
      market: market
    });
  }, []);

  const handleCloseSecurityHub = useCallback(() => {
    setSecurityHub(prev => ({ ...prev, isOpen: false }));
  }, []);

  const parseSafeDate = (isoString) => {
    if (!isoString) return null;
    const safeIso = isoString.endsWith('Z') || isoString.includes('+') ? isoString : isoString + 'Z';
    return new Date(safeIso);
  };

  const [syncTrigger, setSyncTrigger] = useState(0);

  useEffect(() => {
    const loadBundle = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const cacheBuster = `?v=${Date.now()}`;
        let json = null;

        // 1. Attempt to fetch from authenticated/cached Cloudflare Pages Function endpoint
        try {
          const apiRes = await fetch(`/api/data${cacheBuster}`, { cache: 'no-cache' });
          const contentType = apiRes.headers.get('content-type') || '';
          if (apiRes.ok && contentType.includes('application/json')) {
            const parsed = await apiRes.json();
            if (parsed && (parsed.last_updated || parsed.daily_trade_plans)) {
              json = parsed;
            }
          }
        } catch (e) {
          json = null;
        }

        // 2. Dev/local fallback: served through the dev-only Vite middleware.
        //    In production this route does not exist, so VIP payloads are never
        //    exposed as a downloadable static file. See vite.config.js.
        if (!json && import.meta.env.DEV) {
          try {
            const devRes = await fetch(`/api/dev-bundle${cacheBuster}`, { cache: 'no-cache' });
            if (devRes.ok) {
              json = await devRes.json();
            }
          } catch (e) {
            console.warn('Dev bundle unavailable:', e);
          }
        }

        if (json) {
          try {
            const newsRes = await fetch(`/api/news?limit=30&_v=${Date.now()}`);
            if (newsRes.ok) {
              const newsPayload = await newsRes.json();
              if (Array.isArray(newsPayload?.articles) && newsPayload.articles.length > 0) {
                const existing = json.macro_telemetry?.live_news || [];
                const seen = new Set();
                const merged = [];
                for (const a of newsPayload.articles) {
                  const key = (a.title || '').trim().toLowerCase();
                  if (key && !seen.has(key)) {
                    seen.add(key);
                    merged.push(a);
                  }
                }
                for (const b of existing) {
                  const key = (b.title || '').trim().toLowerCase();
                  if (key && !seen.has(key)) {
                    seen.add(key);
                    merged.push(b);
                  }
                }
                json = {
                  ...json,
                  macro_telemetry: {
                    ...(json.macro_telemetry || {}),
                    live_news: merged
                  }
                };
              }
            }
          } catch (e) {
            // non-blocking
          }
          setData(json);
        } else {
          console.error('Failed to load cockpit bundle from any source');
        }
      } catch (err) {
        console.error('Error fetching latest bundle:', err);
      } finally {
        if (!silent) setLoading(false);
      }
    };

    loadBundle(syncTrigger !== 0 ? false : false);

    const intervalId = setInterval(() => {
      loadBundle(true);
    }, 60000); // Auto-refresh every 60 seconds (1 minute)

    return () => clearInterval(intervalId);
  }, [syncTrigger]);

  const getTabLabel = (tab) => {
    switch (tab) {
      case 'HOME': return '🏠 Market Overview';
      case 'STOCK': return '📈 Stock Desk (IDX & US)';
      case 'CRYPTO': return '⚡ Crypto Desk (Perp & Spot)';
      case 'CHARTING': return '📊 Institutional Charting Desk';
      case 'WATCHLIST': return '⭐ Personal Watchlist';
      case 'GLOBAL_MARKETS': return '🌍 Pasar Global';
      case 'TESTING': return '🧪 Strategy Testing Lab';
      case 'CURRENT_TEST': return '🧪 Forward Paper Trading';
      case 'BACKTEST_LAB': return '📊 Historical Backtest Lab';
      case 'ECONOMIC_CALENDAR': return '📅 Kalender Makro';
      case 'PEARSON_CORRELATION': return '🔗 Korelasi Pearson';
      case 'NEWS': return '📰 Terminal Live News';
      case 'ACADEMY': return '🎓 Quant Academy';
      case 'WHALES': return '🐋 Whale Intelligence Hub';
      case 'FUTURES': return '⚡ Crypto Desk (Perp & Spot)';
      case 'SIGNALS': return '📡 Sinyal Trading (Entry, SL & TP)';
      case 'SUBSCRIPTION': return '👑 Akun & Langganan';
      // The LEGEND desks. Without these the header showed the previous page's
      // label while the new desk rendered, which is how the routing probe
      // first detected that the branch was missing.
      case 'TRADING_BOT': return '🤖 Trading Bot Otonom';
      case 'JEV_EXECUTION': return '⚡ Jev Execution HUD';
      case 'ACHIEVEMENTS': return '🏆 Legend Path';
      case 'SETTINGS': return '⚙️ Pengaturan';
      case 'ADMIN_APPROVAL': return '⚡ Admin Approval Desk';
      case 'FOREX': return '💱 Forex & Komoditas';
      case 'US_STOCKS': return '📈 Stock Desk (IDX & US)';
      case 'FLOW_PROCESS': return '⚡ Flow Process & System Architecture';
      case 'CHANGELOG': return '📜 Changelog Update & Catatan Rilis';
      case 'AI_AGENTS': return '🤖 AI Multi-Agent Arena';
      case 'AI_SENTINEL':
      case 'AI_SENTINEL_DEFCON':
      case 'AI_SENTINEL_DEBATE':
      case 'SENTINEL': return '🛡️ AI Intelligence & Sentinel Desk';
      default: return 'Institutional Desk';
    }
  };

  // AUTH GATE — replaces the old single shared password screen.
  //
  //  not signed in       -> landing page (marketing + sign up / sign in)
  //  signed in as free   -> cockpit, paid desks locked
  //  signed in as pro    -> full cockpit
  //  owner password      -> treated as pro
  //
  // Rendered before the cockpit so a signed-out visitor never sees a flash of
  // the terminal, and never downloads the cockpit bundle.
  if (!accountChecked) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#070a13', color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'inherit',
      }}>
        Memuat…
      </div>
    );
  }

  if (!account?.authenticated) {
    return (
      <Suspense fallback={null}>
        <LandingPage onAuthenticated={() => refreshAccount()} configured={account?.configured !== false} />
      </Suspense>
    );
  }

  // Owner keeps the original gate reachable, but it is not the main path.
  // Fragments wrap layout + global modals, which used to be two children of
  // the removed PasswordGate wrapper.
  return (
    <>
    <div className="app-layout app-layout-topnav">

        {/* ===== TOP NAVIGATION (CoinMarketCap-style hover menus) ===== */}
        <CmcTopNav
          activeTab={activeTab}
          onNavigate={setActiveTab}
          onLogout={handleLogout}
          isAuthenticated={!!account?.authenticated}
          account={account}
          theme={theme}
          onToggleTheme={toggleTheme}
          isMobileOpen={isMobileOpen}
          setMobileOpen={setMobileOpen}
          onOpenCommandPalette={() => setIsPaletteOpen(true)}
          defconLabel={data?.geopolitical_threat?.defcon_level != null ? `DEFCON ${data.geopolitical_threat.defcon_level}` : 'SENTINEL'}
          onOpenSentinel={() => setIsAiDrawerOpen(true)}
          onOpenLotCalc={() => handleOpenLotCalc()}
        />

        {/* ===== MAIN CONTENT AREA ===== */}
        <div className="main-content">

          {/* Mode Santai (New User Guidance Ribbon) */}
          {displayMode === 'SIMPLE' && (
            <div style={{
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-xs)',
              padding: '6px 12px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>🍃</span>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Mode Santai Aktif (Ramah Pemula):
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                    Fokus pada Top 3 Sinyal Hari Ini, Ringkasan Berita Dunia, dan Kalkulator Lot Aman tanpa grafik rumit.
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => handleOpenLotCalc()}
                  style={{
                    fontSize: '9.5px',
                    fontWeight: '700',
                    background: 'var(--accent-gold)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    cursor: 'pointer'
                  }}
                >
                  Hitung Lot Aman
                </button>
                <button
                  onClick={toggleDisplayMode}
                  style={{
                    fontSize: '9.5px',
                    fontWeight: '600',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    cursor: 'pointer'
                  }}
                >
                  Beralih ke Mode Pro ⚡
                </button>
              </div>
            </div>
          )}

          {/* AI MULTI-AGENT ARENA (Mounted persistently so 24/7 background autonomous loop runs only if entitled) */}
          {canAccess('AI_AGENTS', userTier, isAdmin) && (
            <div style={{ display: activeTab === 'AI_AGENTS' ? 'block' : 'none' }}>
              <main>
                <AiAgentArenaTab
                  data={data}
                  livePrices={livePrices}
                  onOpenChart={handleOpenSecurityHub}
                  onOpenExecution={handleOpenExecution}
                />
              </main>
            </div>
          )}

          {/* 2. Main Content View Routing with Suspense fallback */}
          <Suspense fallback={
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
              <div style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>MEMUAT MODUL KUANTITATIF...</div>
            </div>
          }>
            {/* GLOBAL ACCESS GATE: Evaluated FIRST so no protected tab leaks to unentitled tiers */}
            {!isAdmin && !canAccess(activeTab, userTier, isAdmin) ? (
              requiredTierFor(activeTab) === TIER.ADMIN ? (
                <main>
                  <div className="telemetry-panel" style={{
                    borderRadius: '16px', padding: '52px 28px', textAlign: 'center', maxWidth: '560px', margin: '40px auto',
                  }}>
                    <div style={{ fontSize: '38px', marginBottom: '16px' }}>🔒</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '10px' }}>
                      Modul Khusus Administrator
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '22px' }}>
                      <strong>{getTabLabel(activeTab)}</strong> hanya dapat diakses oleh administrator sistem.
                    </div>
                    <button
                      onClick={() => setActiveTab('HOME')}
                      style={{
                        padding: '10px 22px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                        background: 'var(--accent-blue)', color: '#fff', border: 'none', cursor: 'pointer'
                      }}
                    >
                      ← Kembali ke Home
                    </button>
                  </div>
                </main>
              ) : requiredTierFor(activeTab) === TIER.LEGEND ? (
                <main>
                  <div className="telemetry-panel" style={{
                    borderRadius: '16px', padding: '52px 28px', textAlign: 'center', maxWidth: '600px', margin: '40px auto',
                  }}>
                    <div style={{ fontSize: '38px', marginBottom: '16px' }}>👑</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '10px' }}>
                      Modul Ini Khusus Legend
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '8px' }}>
                      <strong>{getTabLabel(activeTab)}</strong> adalah modul yang bisa
                      mengirim order ke akun bursa Anda.
                    </div>
                    <div style={{
                      fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.8,
                      marginBottom: '22px', padding: '12px 16px', borderRadius: '10px',
                      background: 'rgba(255,180,84,0.08)', border: '1px solid rgba(255,180,84,0.30)',
                    }}>
                      Karena itu LEGEND <strong>tidak bisa dibeli langsung</strong>.
                      Selesaikan seluruh achievement sambil berlangganan Pro, lalu
                      tier ini terbuka sendiri.
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setActiveTab('ACHIEVEMENTS')}
                        style={{
                          padding: '11px 24px', borderRadius: '9px', fontSize: '12.5px', fontWeight: '900',
                          background: 'linear-gradient(135deg,var(--accent-gold),#d97706)', color: '#000',
                          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        👑 Lihat Legend Path
                      </button>
                      <button
                        onClick={() => setActiveTab('ACHIEVEMENTS')}
                        style={{
                          padding: '11px 22px', borderRadius: '9px', fontSize: '12.5px', fontWeight: '700',
                          background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)',
                          border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Lihat Achievement
                      </button>
                    </div>
                  </div>
                </main>
              ) : (
                /* PRO MODULE — a straightforward purchase path */
                <main>
                  <div className="telemetry-panel" style={{
                    borderRadius: '16px', padding: '52px 28px', textAlign: 'center', maxWidth: '560px', margin: '40px auto',
                  }}>
                    <div style={{ fontSize: '38px', marginBottom: '16px' }}>🔒</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '10px' }}>
                      Modul Ini Khusus Pro
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '22px' }}>
                      <strong>{getTabLabel(activeTab)}</strong> memerlukan
                      paket <strong>{requiredTierFor(activeTab) === TIER.PRO ? 'Pro' : 'Free'}</strong>.
                      {userTier === 'GUEST'
                        ? ' Buat akun gratis untuk membuka lebih banyak fitur.'
                        : ' Upgrade untuk membuka seluruh alat analitik dan sinyal real-time.'}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setActiveTab('SUBSCRIPTION')}
                        style={{
                          padding: '11px 24px', borderRadius: '9px', fontSize: '12.5px', fontWeight: '900',
                          background: 'linear-gradient(135deg,var(--accent-gold),#d97706)', color: '#000',
                          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        👑 Lihat Paket Pro
                      </button>
                      <button
                        onClick={() => setActiveTab('SIGNALS')}
                        style={{
                          padding: '11px 22px', borderRadius: '9px', fontSize: '12.5px', fontWeight: '700',
                          background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)',
                          border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        ← Kembali ke Sinyal
                      </button>
                    </div>
                  </div>
                </main>
              )
            ) : activeTab === 'AI_AGENTS' ? null :
            activeTab === 'AI_SENTINEL' || activeTab === 'AI_SENTINEL_DEFCON' || activeTab === 'AI_SENTINEL_DEBATE' || activeTab === 'SENTINEL' ? (
              /* AI SENTINEL EMBEDDED DESK VIEW */
              <main style={{ padding: '12px 0' }}>
                <AiIntelligenceDrawer
                  isDrawer={false}
                  isOpen={true}
                  defaultTab={activeTab === 'AI_SENTINEL_DEFCON' ? 'DEFCON' : activeTab === 'AI_SENTINEL_DEBATE' ? 'DEBATE' : 'THEMATIC'}
                  threatData={data?.geopolitical_threat}
                  debateData={data?.ai_agent_arena}
                  aiDiagnostics={data?.ai_agent_arena?.diagnostics}
                  thematicData={data?.thematic_macro_regimes}
                  allIdxStocks={allIdxStocks}
                  onRefreshDesk={refetchAll}
                />
              </main>
            ) : activeTab === 'WATCHLIST' ? (
              /* PERSONAL WATCHLIST (Star Marked Items) */
              <main>
                <PersonalWatchlistTab
                  data={data}
                  allIdxStocks={allIdxStocks}
                  allCryptoSpot={allCryptoSpot}
                  livePrices={livePrices}
                  onSelectTicker={handleOpenSecurityHub}
                  onOpenChart={handleOpenSecurityHub}
                  onOpenLotCalc={handleOpenLotCalc}
                  onOpenExecution={handleOpenExecution}
                  onNavigateTab={setActiveTab}
                />
              </main>
            ) : activeTab === 'HOME' ? (
              /* CMC-STYLE MARKET OVERVIEW
                 Clicking any ticker opens the FULL chart directly, per request:
                 "ketika klik ticker nya, jgn munculin kecil gini tapi langsung
                  fullchartnya aja". The small Security Hub panel is no longer
                  in this path. */
              <main>
                <CmcMarketDashboard
                  livePrices={livePrices}
                  onOpenAsset={handleOpenChart}
                  onOpenChart={handleOpenChart}
                  newsRows={data?.macro_telemetry?.live_news || []}
                />
              </main>
            ) : activeTab === 'CHARTING' ? (
              /* INSTITUTIONAL CHARTING DESK */
              <main>
                <ChartingDeskTab
                  data={data}
                  livePrices={livePrices}
                  flashMap={flashMap}
                  onOpenLotCalc={handleOpenLotCalc}
                  onOpenPrediction={handleOpenPrediction}
                  onOpenExecution={handleOpenExecution}
                  initialSymbol={chartModal.symbol || 'BBCA'}
                />
              </main>
            ) : activeTab === 'FLOW_PROCESS' ? (
              /* SYSTEM FLOW PROCESS & ARCHITECTURE BLUEPRINT (KHUSUS ADMIN) */
              isAdmin ? (
                <main>
                  <FlowProcessTab />
                </main>
              ) : (
                <main>
                  <div className="telemetry-panel" style={{
                    borderRadius: '16px', padding: '52px 28px', textAlign: 'center', maxWidth: '560px', margin: '40px auto',
                  }}>
                    <div style={{ fontSize: '38px', marginBottom: '16px' }}>🔒</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '10px' }}>
                      Modul Khusus Internal Admin
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '22px' }}>
                      Arsitektur Flow Process hanya dapat diakses oleh administrator sistem.
                    </div>
                    <button
                      onClick={() => setActiveTab('HOME')}
                      style={{
                        padding: '10px 22px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                        background: 'var(--accent-blue)', color: '#fff', border: 'none', cursor: 'pointer'
                      }}
                    >
                      ← Kembali ke Home
                    </button>
                  </div>
                </main>
              )
            ) : activeTab === 'CHANGELOG' ? (
              /* SYSTEM CHANGELOG & VERSION RELEASES (KHUSUS ADMIN) */
              isAdmin ? (
                <main>
                  <ChangelogTab />
                </main>
              ) : (
                <main>
                  <div className="telemetry-panel" style={{
                    borderRadius: '16px', padding: '52px 28px', textAlign: 'center', maxWidth: '560px', margin: '40px auto',
                  }}>
                    <div style={{ fontSize: '38px', marginBottom: '16px' }}>🔒</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '10px' }}>
                      Changelog Khusus Admin
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '22px' }}>
                      Riwayat rilis teknis internal hanya dapat diakses oleh administrator sistem.
                    </div>
                    <button
                      onClick={() => setActiveTab('HOME')}
                      style={{
                        padding: '10px 22px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                        background: 'var(--accent-blue)', color: '#fff', border: 'none', cursor: 'pointer'
                      }}
                    >
                      ← Kembali ke Home
                    </button>
                  </div>
                </main>
              )
            ) : activeTab === 'NEWS' ? (
              /* TERMINAL LIVE NEWS — was never routed.
                 The menu entry existed since the CMC top nav shipped, but no
                 branch rendered it, so clicking it fell through to the
                 "unknown module" panel. NewsTab itself was only reachable as a
                 sub-tab of MasterQuantLeaderboard. */
              <main>
                <NewsTab
                  liveNews={data?.macro_telemetry?.live_news || []}
                  macro={data?.macro_telemetry || {}}
                  foreignFlow={data?.foreign_flow || {}}
                  onSelectTicker={handleOpenSecurityHub}
                  onSelectNews={handleOpenNews}
                />
              </main>
            ) : activeTab === 'RESEARCH' ? (
              /* RESEARCH DESK (P-8 P0c): the journal-style paper reader. Reads
                 /api/research/reports - session-gated; before the Supabase
                 schema runs it honestly serves the bundled sample paper. */
              <main>
                <ResearchDeskTab />
              </main>
            ) : activeTab === 'WHALES' ? (
              /* v3.0 WHALE INTELLIGENCE HUB */
              <main>
                <WhaleIntelligenceTab data={data} onOpenChart={handleOpenSecurityHub} livePrices={livePrices} />
              </main>
            ) : activeTab === 'CRYPTO' || activeTab === 'FUTURES' ? (
              /* UNIFIED CRYPTO DESK — perpetuals and spot in one place.
                 Per request: "Crypto [futures dan spot dijadikan satu aja,
                 beda di ticker aja kan]". The old FUTURES id still routes here
                 so any bookmark or deep link keeps working. */
              <main>
                <CryptoDeskTab
                  data={data}
                  onOpenChart={handleOpenSecurityHub}
                  onOpenExecution={handleOpenExecution}
                  livePrices={livePrices}
                  flashMap={flashMap}
                  allCryptoSpot={allCryptoSpot}
                />
              </main>
            ) : activeTab === 'SIGNALS' ? (
              /* SIGNAL DESK — tier-gated plan delivery (VIP sees instantly) */
              <main>
                <SignalsTab
                  plans={data?.daily_trade_plans || []}
                  userTier={userTier}
                  onNavigateTab={setActiveTab}
                  onOpenExecution={handleOpenExecution}
                />
              </main>
            ) : activeTab === 'SETTINGS' ? (
              /* ACCOUNT SETTINGS — language and appearance */
              <main>
                <SettingsPage
                  account={account || {}}
                  theme={theme}
                  onSetTheme={applyTheme}
                />
              </main>
            ) : activeTab === 'ACHIEVEMENTS' ? (
              /* LEGEND PATH — the earned-tier roadmap. Reachable by everyone,
                 because a user cannot work toward a goal they cannot see. */
              <main>
                <AchievementsPage
                  account={account || {}}
                  userTier={userTier}
                  isAdmin={isAdmin}
                  onNavigate={setActiveTab}
                  onOpenPredictionModal={handleOpenPrediction}
                />
              </main>
            ) : activeTab === 'SUBSCRIPTION' ? (
              /* ACCOUNT & SUBSCRIPTION — status, upgrade, manual payment steps */
              <main>
                <SubscriptionPage
                  account={account || {}}
                  onRefresh={refreshAccount}
                  onLogout={handleLogout}
                />
              </main>
            ) : activeTab === 'ADMIN_APPROVAL' ? (
              /* ADMIN APPROVAL DESK — instant 1-click subscription management */
              <main>
                <AdminApprovalDesk
                  account={account || {}}
                  onRefreshUser={refreshAccount}
                />
              </main>
            ) : (activeTab === 'TRADING_BOT' || activeTab === 'JEV_EXECUTION') ? (
              /**
               * THE LEGEND DESKS — placed AFTER the canAccess gate on purpose.
               *
               * These two modules were registered as modules, gated at LEGEND,
               * priced on the subscription page — and had NO route. `?tab=TRADING_BOT`
               * fell through to the leaderboard fallback, so the flagship feature of
               * the tier did not exist. The fallback happened to contain the words
               * "Khusus Legend", which made the tier tests pass while the desk was
               * missing entirely: the assertion matched text from an unrelated
               * component.
               *
               * Position matters. My first attempt put this branch BEFORE the gate,
               * which meant a free account reached the desk and the E2E suite caught
               * it: "TRADING_BOT did not lock a free account". Reaching here now
               * already proves canAccess passed, and LegendDeskTab re-checks the
               * eligibility predicate as well.
               */
              <main>
                <LegendDeskTab
                  moduleId={activeTab}
                  userTier={userTier}
                  isAdmin={isAdmin}
                  onNavigate={setActiveTab}
                />
              </main>
            ) : activeTab === 'FOREX' ? (
              /* v3.0 FOREX COMMAND CENTER */
              <main>
                <ForexCommandTab data={data} onOpenChart={handleOpenSecurityHub} livePrices={livePrices} flashMap={flashMap} />
              </main>
            ) : activeTab === 'STOCK' || activeTab === 'US_STOCKS' ? (
              /* UNIFIED STOCK DESK — IDX and US in one page with a market
                 switcher, per request: "Stock [ada IDX dan US]". The old
                 US_STOCKS id still routes here for existing deep links. */
              <main>
                <StockDeskTab
                  data={data}
                  livePrices={livePrices}
                  flashMap={flashMap}
                  allIdxStocks={allIdxStocks}
                  allCryptoSpot={allCryptoSpot}
                  onOpenChart={handleOpenSecurityHub}
                  onOpenLotCalc={handleOpenLotCalc}
                  onSelectNews={handleOpenNews}
                />
              </main>
            ) : activeTab === 'HEATMAP' ? (
              /* v4.0 MARKET HEATMAP TREEMAP */
              <main>
                <MarketHeatmapTab data={data} onSelectTicker={handleOpenSecurityHub} livePrices={livePrices} flashMap={flashMap} />
              </main>
            ) : (
              /* DEEP-DIVE SCREENER / TESTING LAB / KORELASI / ACADEMY / KALENDER MAKRO */
              <main>
                <MasterQuantLeaderboard
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  allIdxStocks={allIdxStocks}
                  allCryptoSpot={allCryptoSpot}
                  tradePlans={data?.daily_trade_plans || []}
                  cryptoSpotList={data?.crypto_spot_10 || []}
                  conglomerates={data?.conglomerates || {}}
                  dividendHunters={data?.dividend_hunters || []}
                  foreignFlow={data?.foreign_flow || {}}
                  liveNews={data?.macro_telemetry?.live_news || []}
                  macro={data?.macro_telemetry || {}}
                  paperPortfolio={data?.paper_portfolio || {}}
                  backtestLab={data?.backtest_lab || {}}
                  strategyRankings={data?.strategy_rankings || []}
                  brokerSummary={data?.broker_summary || {}}
                  bundle={data}
                  livePrices={livePrices}
                  flashMap={flashMap}
                  onSelectTicker={handleOpenSecurityHub}
                  onOpenLotCalc={handleOpenLotCalc}
                  onSelectNews={handleOpenNews}
                />
              </main>
            )}

            {/* 3. TradingView Chart Modal */}
            {chartModal.isOpen && (
              <TradingViewModal
                initialSymbol={chartModal.symbol}
                market={chartModal.market}
                onClose={handleCloseChart}
                onOpenLotCalc={handleOpenLotCalc}
                onOpenExecution={handleOpenExecution}
                tradePlans={data?.daily_trade_plans || []}
                livePrices={livePrices}
              />
            )}

            {/* 4. Lot Calculator Modal */}
            <LotCalculatorModal
              isOpen={lotCalcModal.isOpen}
              onClose={handleCloseLotCalc}
              prefillEntry={lotCalcModal.entry}
              prefillSL={lotCalcModal.sl}
              initialMarket={lotCalcModal.market}
              initialSymbol={lotCalcModal.symbol}
              onOpenExecution={(params) => {
                handleCloseLotCalc();
                handleOpenExecution(params);
              }}
            />

            {/* 4b. Institutional Order Execution Modal (Paper Sandbox & Live Broker) */}
            {executionModal.isOpen && (
              <OrderExecutionModal
                isOpen={executionModal.isOpen}
                onClose={handleCloseExecution}
                prefill={executionModal.prefill}
                livePrices={livePrices}
                onOrderSuccess={(order) => {
                  console.log('Order successfully executed:', order);
                }}
              />
            )}

            {/* 4c. Chart Prediction & Strategy Scoring Arena (Legend Path) */}
            {predictionModal.isOpen && (
              <ChartPredictionModal
                isOpen={predictionModal.isOpen}
                onClose={handleClosePrediction}
                initialSymbol={predictionModal.symbol}
                initialMarket={predictionModal.market}
                initialPrice={predictionModal.price}
                onPredictionSubmitted={(rec) => {
                  console.log('Chart prediction locked:', rec);
                }}
              />
            )}

            {/* 5. News Detail Modal */}
            {newsModal.isOpen && (
              <NewsDetailModal
                news={newsModal.news}
                allNews={data?.macro_telemetry?.live_news || []}
                onClose={handleCloseNews}
                onSelectTicker={handleOpenSecurityHub}
              />
            )}

            {/* 6. Institutional Security Hub Drawer */}
            {securityHub.isOpen && (
              <SecurityHubDrawer
                isOpen={securityHub.isOpen}
                symbol={securityHub.symbol}
                market={securityHub.market}
                onClose={handleCloseSecurityHub}
                data={data}
                livePrices={livePrices}
                flashMap={flashMap}
                onOpenChart={(sym, mkt) => {
                  handleCloseSecurityHub();
                  handleOpenChart(sym, mkt);
                }}
                onOpenLotCalc={(entry, sl, mkt, sym) => {
                  handleOpenLotCalc(entry, sl, mkt || securityHub.market, sym || securityHub.symbol);
                }}
                onOpenExecution={handleOpenExecution}
                onNavigateTab={(tab) => {
                  handleCloseSecurityHub();
                  setActiveTab(tab);
                }}
              />
            )}

            {/* AI Intelligence & Geopolitical Sentinel Drawer */}
            {isAiDrawerOpen && (
              <AiIntelligenceDrawer
                isOpen={isAiDrawerOpen}
                onClose={() => setIsAiDrawerOpen(false)}
                threatData={data?.geopolitical_threat}
                debateData={data?.ai_agent_arena}
                aiDiagnostics={data?.ai_agent_arena?.diagnostics}
                thematicData={data?.thematic_macro_regimes}
                allIdxStocks={allIdxStocks}
                onRefreshDesk={refetchAll}
              />
            )}

            {/* 7. Welcome Onboarding Modal (Journey A08-A10) */}
            <OnboardingModal
              isOpen={showOnboarding}
              onClose={() => setShowOnboarding(false)}
            />
          </Suspense>

          {/* 5. Institutional Disclaimer Footer + Feed Health Status (single bottom region) */}
          <footer style={{
            marginTop: '16px',
            borderTop: 'var(--border-muted)',
            paddingTop: '10px',
            paddingBottom: '16px',
            fontSize: '10px',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <button
              onClick={() => setIsIntegrityOpen(true)}
              title="Buka Telemetri Audit Integritas Data"
              style={{
                background: 'var(--bg-panel-subtle)',
                border: 'var(--border-hairline)',
                borderRadius: '6px',
                padding: '5px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '9.5px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: isBundleFresh ? 'var(--accent-emerald)' : 'var(--accent-gold)', fontWeight: 800 }}>
                  🛡️ FEED HEALTH: {isBundleFresh ? '🟢 VERIFIED' : '🟡 DEGRADED'}
                </span>
                <span>IDX BEI: <strong style={{ color: 'var(--accent-emerald)' }}>{allIdxStocks.length > 0 ? `🟢 ${allIdxStocks.length} STOCKS` : '—'}</strong></span>
                <span>Binance WS: <strong style={{ color: isWsConnected ? 'var(--accent-emerald)' : 'var(--accent-gold)' }}>{isWsConnected ? '🟢 CONNECTED' : '🟡 POLLING'}</strong></span>
                <span>Macro Bundle: <strong style={{ color: bundleColor }}>{bundleStatus} ({bundleAgeMin}m)</strong></span>
                <span>Gemini LLM: <strong style={{ color: 'var(--accent-sky)' }}>🟢 {geminiShortLabel}</strong></span>
                <span>MCP Server: <strong style={{ color: 'var(--accent-sky)' }}>🟢 READY</strong></span>
              </span>
              <span>AUDIT PROVENANCE & FRESHNESS ↗</span>
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <strong>DISCLAIMER</strong>: Algorithmic screening & quantitative intelligence only. Bukan ajakan atau nasihat investasi.
              </div>
              <div>
                MBG QUANT TERMINAL // MARKET BRAIN GRID · ZERO RUNTIME COST
              </div>
            </div>
          </footer>

        </div>{/* /main-content */}

      </div>{/* /app-layout */}

      {/* Global Command Palette Modal (Ctrl + K) */}
      <CommandPaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        allIdxStocks={allIdxStocks}
        allCryptoSpot={allCryptoSpot}
        onSelectTicker={handleOpenSecurityHub}
        onNavigateTab={setActiveTab}
        onOpenLotCalc={handleOpenLotCalc}
        onToggleTheme={toggleTheme}
        onRefetch={() => {
          refetchAll();
          setSyncTrigger(prev => prev + 1);
        }}
      />

      {/* Data Integrity & Provenance Telemetry Modal */}
      <DataIntegrityModal
        isOpen={isIntegrityOpen}
        onClose={() => setIsIntegrityOpen(false)}
        data={data}
        isWsConnected={isWsConnected}
        lastUpdateTime={lastUpdateTime}
        onRefetchAll={() => {
          refetchAll();
          setSyncTrigger(prev => prev + 1);
        }}
      />

      {/* Compliance & Risk Disclosure Modal (First-Run Acknowledgment) */}
      <ComplianceRiskModal />
    </>
  );
}
