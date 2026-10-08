import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import PasswordGate from './components/PasswordGate.jsx';
import { fetchMe } from './services/accountClient.js';
import { endSession } from './services/sessionCleanup.js';
import { canAccess, requiredTierFor, MODULES, TIER } from './services/featureAccess.js';
import MasterQuantLeaderboard from './components/MasterQuantLeaderboard.jsx';
import CmcMarketDashboard from './components/cmc/CmcMarketDashboard.jsx';
import CmcTopNav from './components/CmcTopNav.jsx';
import GlobalMarketTicker from './components/GlobalMarketTicker.jsx';
import { useLivePrices } from './hooks/useLivePrices.js';
import PersonalWatchlistTab from './components/PersonalWatchlistTab.jsx';
import CommandPaletteModal from './components/CommandPaletteModal.jsx';
import DataIntegrityModal from './components/DataIntegrityModal.jsx';
import ComplianceRiskModal from './components/ComplianceRiskModal.jsx';

// Code Splitting for heavy secondary modules
const TradingViewModal = lazy(() => import('./components/TradingViewModal.jsx'));
const LotCalculatorModal = lazy(() => import('./components/LotCalculatorModal.jsx'));
const OrderExecutionModal = lazy(() => import('./components/OrderExecutionModal.jsx'));
import { institutionalPaperBroker } from './services/brokerGateway.js';
const FlowProcessTab = lazy(() => import('./components/FlowProcessTab.jsx'));
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
const SecurityHubDrawer = lazy(() => import('./components/SecurityHubDrawer.jsx'));
const AiAgentArenaTab = lazy(() => import('./components/AiAgentArenaTab.jsx'));
const AiIntelligenceDrawer = lazy(() => import('./components/AiIntelligenceDrawer.jsx'));
const SignalsTab = lazy(() => import('./components/SignalsTab.jsx'));
const LandingPage = lazy(() => import('./components/LandingPage.jsx'));
const SubscriptionPage = lazy(() => import('./components/SubscriptionPage.jsx'));
const AdminApprovalDesk = lazy(() => import('./components/AdminApprovalDesk.jsx'));

const isIdxMarketOpen = () => {
  const now = new Date();
  const jktStr = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  const jktDate = new Date(jktStr);
  const day = jktDate.getDay();
  if (day === 0 || day === 6) return false;
  const totalMin = jktDate.getHours() * 60 + jktDate.getMinutes();
  if (day === 5) {
    return (totalMin >= 540 && totalMin <= 690) || (totalMin >= 840 && totalMin <= 949); // Friday close 15:49 WIB
  }
  return (totalMin >= 540 && totalMin <= 720) || (totalMin >= 810 && totalMin <= 950);
};

const jakartaTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  hourCycle: 'h23'
});

function HeaderClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div 
      style={{ 
        fontSize: '10px', 
        padding: '3px 8px', 
        borderRadius: 'var(--radius-xs)', 
        background: 'var(--bg-panel-subtle)', 
        color: 'var(--text-primary)', 
        fontFamily: 'var(--font-mono)',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        border: 'var(--border-hairline)'
      }}
      title="Waktu Jakarta (WIB)"
    >
      <span>🕒</span>
      <span>{jakartaTimeFormatter.format(now)} WIB</span>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Unified Real-time Live Price Engine (Binance WebSocket + TradingView Scanners)
  const { livePrices, flashMap, allIdxStocks, allCryptoSpot, isWsConnected, lastUpdateTime, refetchAll } = useLivePrices(data);

  // Native hash routing
  const getTabFromHash = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const qTab = params.get('tab');
      if (qTab) return qTab.toUpperCase();
    } catch (e) {}
    const hash = window.location.hash.replace('#', '').toUpperCase();
    return hash || 'HOME';
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
  const bundleColor = isBundleFresh ? '#10b981' : (bundleAgeMin < 360 ? '#f59e0b' : '#ef4444');
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

  useEffect(() => { refreshAccount(); }, [refreshAccount]);

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
  const userTier = isAdmin || account?.isPro ? 'PRO' : (account?.authenticated ? 'FREE' : 'GUEST');

  // TradingView Chart Modal State
  const [chartModal, setChartModal] = useState({
    isOpen: false,
    symbol: 'AMMN',
    market: 'IDX'
  });

  const handleOpenChart = useCallback((symbol = 'AMMN', market = 'IDX') => {
    setChartModal({
      isOpen: true,
      symbol: symbol,
      market: market
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
    }, 300000);

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

        {/* ===== TOP NAVIGATION (CoinMarketCap-style hover menus) =====
            The left sidebar was removed on Jendral Arib's instruction:
            "pilihan sectionnya bukan di side bar, tapi di atas aja".
            Mobile handling now lives inside the nav itself. */}
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
        />

        {/* ===== MAIN CONTENT AREA ===== */}
        <div className="main-content">

          {/* 1. Master Top Header Bar (Modern Dribbble Floating Glass HUD) */}
          <header className="telemetry-panel" style={{
            marginBottom: '10px',
            padding: '7px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'nowrap',
            gap: '10px',
            minHeight: '44px',
            borderRadius: '12px',
            background: 'var(--bg-panel)',
            boxShadow: 'var(--shadow-md)',
            overflowX: 'auto',
            boxSizing: 'border-box'
          }}>
            {/* Left: Active Module Title & Tier Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button
                className="mobile-header-hamburger"
                onClick={() => setMobileOpen(prev => !prev)}
                aria-label="Buka Navigasi"
                title="Buka Navigasi"
              >
                ☰
              </button>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '8px',
                background: 'var(--bg-panel-subtle)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px rgba(46, 230, 168, 0.55)' }} />
                <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.04em', color: 'var(--text-primary)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {getTabLabel(activeTab)}
                </div>
              </div>

              {/* Mode Santai / Mode Pro Switcher */}
              <button
                onClick={toggleDisplayMode}
                style={{
                  fontSize: '9.5px',
                  fontWeight: '600',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  padding: '3px 9px',
                  minHeight: '26px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: displayMode === 'SIMPLE' ? '1px solid rgba(100, 116, 139, 0.45)' : '1px solid rgba(100, 116, 139, 0.25)',
                  background: displayMode === 'SIMPLE' ? 'rgba(100, 116, 139, 0.12)' : 'rgba(100, 116, 139, 0.06)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title={displayMode === 'SIMPLE' ? 'Klik untuk beralih ke Mode Pro (Kuantitatif Lengkap)' : 'Klik untuk beralih ke Mode Santai (Ramah Pemula)'}
              >
                <span>{displayMode === 'SIMPLE' ? '🍃' : '⚡'}</span>
                <span>{displayMode === 'SIMPLE' ? 'MODE SANTAI' : 'MODE PRO'}</span>
              </button>
            </div>

            {/* Center: Dribbble-style Command Search Bar */}
            <div
              onClick={() => setIsPaletteOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-panel-subtle)',
                border: 'var(--border-hairline)',
                borderRadius: '6px',
                padding: '5px 12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                minWidth: '160px',
                maxWidth: '240px',
                flexShrink: 1,
                transition: 'all 0.2s ease'
              }}
              title="Buka Global Command Palette (Tekan Ctrl + K)"
            >
              <span>🔍</span>
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Cari saham, crypto...</span>
              <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Ctrl K</span>
            </div>

            {/* Right: Quick Launch Tools & Clock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', flexShrink: 0 }}>
              {/* Bursa Luar Negeri (Global Market Sessions Ticker) */}
              <GlobalMarketTicker onNavigateGlobal={() => setActiveTab('GLOBAL_MARKETS')} />

              {/* Master Terminal Time */}
              <HeaderClock />

              {/* AI Sentinel Quick Launch */}
              <button
                className="telemetry-btn"
                onClick={() => setIsAiDrawerOpen(true)}
                style={{
                  fontSize: '9.5px',
                  padding: '3px 8px',
                  color: 'var(--accent-blue)',
                  borderColor: 'rgba(77, 141, 255, 0.3)',
                  background: 'rgba(77, 141, 255, 0.1)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                title="Buka AI Sentinel Desk"
              >
                <span>🛡️</span>
                {/* Label is the desk name, not a threat level.
                    Two earlier revisions of this pill were both wrong: it first
                    showed a hardcoded "DEFCON 4" (invented readiness), then
                    "DEFCON —" (honest, but permanently empty). The reason is
                    simple — `geopolitical_threat` is not a key in the engine
                    bundle and no free source provides one, so ANY level here
                    would be fabricated.
                    The button itself is kept: it opens a real desk. It just
                    stops pretending to report a number it never had. */}
                <span style={{ fontWeight: 700 }}>SENTINEL</span>
              </button>

              {/* Quick Launch Lot Calculator Modal */}
              <button
                className="telemetry-btn"
                onClick={() => handleOpenLotCalc()}
                style={{
                  fontSize: '9.5px',
                  padding: '3px 8px',
                  color: 'var(--text-inverse)',
                  borderColor: 'var(--text-primary)',
                  background: 'var(--text-primary)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap'
                }}
                title="Kalkulator Ukuran Lot dan Manajemen Risiko"
              >
                <span>💰</span>
                <span style={{ fontWeight: 700 }}>LOT CALC</span>
              </button>

              {/* Manual Refresh / Sync Button */}
              <button
                className="telemetry-btn"
                onClick={() => {
                  refetchAll();
                  setSyncTrigger(prev => prev + 1);
                }}
                style={{ fontSize: '10px', padding: '3px 7px', borderRadius: '8px', whiteSpace: 'nowrap' }}
                title="Sinkronisasi Ulang Seluruh Data Ticker"
              >
                🔄
              </button>

              {/* Dark / Light Mode Switcher */}
              <button
                className="telemetry-btn"
                onClick={toggleTheme}
                style={{
                  fontSize: '9.5px',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap'
                }}
                title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              >
                <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                <span style={{ fontWeight: 700 }}>{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
              </button>
            </div>
          </header>

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

          {/* AI MULTI-AGENT ARENA (Mounted persistently so 24/7 background autonomous loop never stops) */}
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

          {/* 2. Main Content View Routing with Suspense fallback */}
          <Suspense fallback={
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
              <div style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>MEMUAT MODUL KUANTITATIF...</div>
            </div>
          }>
            {activeTab === 'AI_AGENTS' ? null :
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
            ) : (!isAdmin && !canAccess(activeTab, userTier, isAdmin)) ? (
              /* LOCKED MODULE — show what Pro unlocks instead of an empty desk */
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
                        background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000',
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
                <span style={{ color: isBundleFresh ? '#10b981' : '#f59e0b', fontWeight: 800 }}>
                  🛡️ FEED HEALTH: {isBundleFresh ? '🟢 VERIFIED' : '🟡 DEGRADED'}
                </span>
                <span>IDX BEI: <strong style={{ color: '#10b981' }}>{allIdxStocks.length > 0 ? `🟢 ${allIdxStocks.length} STOCKS` : '—'}</strong></span>
                <span>Binance WS: <strong style={{ color: isWsConnected ? '#10b981' : '#f59e0b' }}>{isWsConnected ? '🟢 CONNECTED' : '🟡 POLLING'}</strong></span>
                <span>Macro Bundle: <strong style={{ color: bundleColor }}>{bundleStatus} ({bundleAgeMin}m)</strong></span>
                <span>Gemini LLM: <strong style={{ color: '#38bdf8' }}>🟢 {geminiShortLabel}</strong></span>
                <span>MCP Server: <strong style={{ color: '#38bdf8' }}>🟢 READY</strong></span>
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
