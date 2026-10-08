import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import MbgLogo from './MbgLogo.jsx';
import { useWatchlist } from '../hooks/useWatchlist.js';
import { usePreferences } from '../context/PreferencesContext.jsx';

/**
 * CmcTopNav — the horizontal, hover-opened navigation bar.
 *
 * REQUEST (Jendral Arib, 2026-10-08):
 *   "pilihan sectionnya bukan di side bar, tapi di atas aja ... buat transisi nya
 *    juga sama persis jadi Head section ini semua yg ku sebutkan gaperlu di klik,
 *    arahin kursor maka akan muncul.. persis seperti coinmarketcap.com"
 *
 * BEHAVIOUR THAT MAKES IT FEEL LIKE CMC:
 *   1. Pointing at a top-level item opens its panel — no click needed.
 *   2. Moving the pointer into the panel keeps it open, so links stay reachable.
 *   3. Leaving both (with a short grace delay) closes it.
 *   4. Only one panel is ever open; hovering a sibling switches instantly.
 *   5. Escape closes; clicking a link closes.
 *
 * The grace delay is not decoration. Without it, the diagonal pointer path from
 * a menu label down into its panel crosses a gap, fires `mouseleave`, and the
 * panel vanishes before the user can reach it.
 */

const CLOSE_DELAY_MS = 140;

/**
 * Navigation model.
 *
 * STRUCTURE CHANGE REQUESTED: Futures and Spot are no longer separate top-level
 * destinations — they are one Crypto desk whose ticker differs, which is also
 * how CMC and Hyperliquid present it.
 */
export const NAV_GROUPS = [
  {
    id: 'HOME',
    label: 'Home',
    // No children: this item navigates directly, like CMC's own logo/home link.
    items: null,
  },
  {
    id: 'TRADE',
    label: 'Trade',
    items: [
      { id: 'SIGNALS', label: 'Sinyal Trading', desc: 'Rencana entry, SL & TP harian' },
      { id: 'AI_AGENTS', label: 'AI Agent Arena', desc: '16 bot otonom uji strategi 24/7' },
      { id: 'CHARTING', label: 'Charting Desk', desc: 'Chart TradingView & Pro Desk' },
    ],
  },
  {
    id: 'MARKETS',
    label: 'Markets',
    items: [
      { id: 'HEATMAP', label: 'Market Heatmap', desc: 'Peta panas performa aset' },
      { id: 'CRYPTO', label: 'Crypto', desc: 'Futures & Spot dalam satu meja' },
      { id: 'STOCK', label: 'Stock', desc: 'Saham IDX & US' },
      { id: 'FOREX', label: 'Forex & Commodities', desc: 'Valas, emas & energi' },
    ],
  },
  {
    id: 'RESEARCH',
    label: 'Research & Learn',
    items: [
      { id: 'NEWS', label: 'Live News Wire', desc: 'Berita pasar real-time' },
      { id: 'WHALES', label: 'Whales Tracker', desc: 'Aliran dana pemain besar' },
      { id: 'ECONOMIC_CALENDAR', label: 'Macro Calendar', desc: 'Jadwal data ekonomi' },
      { id: 'AI_SENTINEL', label: 'AI Sentiment DEFCON', desc: 'Analisa risiko & sentimen AI' },
      { id: 'ACADEMY', label: 'Quant Academy', desc: 'Materi belajar kuantitatif' },
      { id: 'PEARSON_CORRELATION', label: 'Pearson Correlation', desc: 'Matriks korelasi antar aset' },
      { id: 'TESTING', label: 'Testing Lab', desc: 'Backtest & forward test' },
    ],
  },
  {
    id: 'ACCOUNT',
    label: 'Account',
    items: [
      { id: 'SETTINGS', label: 'Setting', desc: 'Bahasa, mode tampilan & preferensi' },
      { id: 'SUBSCRIPTION', label: 'Langganan', desc: 'Status akun dan paket' },
      { id: 'ACHIEVEMENTS', label: 'Legend Path', desc: 'Achievement menuju tier Legend' },
      /**
       * The LEGEND desks are listed here so they are REACHABLE.
       *
       * They were registered, gated, priced and advertised with no route and no
       * menu entry, so the tier's flagship feature could not be opened at all.
       * Entry is visible to everyone on purpose: a locked desk that explains what
       * it is and what it takes to open is a reason to climb the tier, whereas a
       * hidden one is just absent. Clicking it as a non-Legend account lands on
       * the lock screen, which is the correct destination.
       */
      { id: 'TRADING_BOT', label: 'Trading Bot Otonom', desc: 'Eksekusi order otomatis (Legend)' },
      { id: 'JEV_EXECUTION', label: 'Jev Execution HUD', desc: 'TWAP / VWAP / POV (Legend)' },
      { id: 'WATCHLIST', label: 'Watchlist Saya', desc: 'Instrumen yang Anda bintangi' },
    ],
  },
];

/** Menus only an admin may see. Mirrors the gate in featureAccess.js. */
const ADMIN_ONLY_IDS = new Set(['FLOW_PROCESS', 'CHANGELOG', 'ADMIN_APPROVAL']);

export default function CmcTopNav({
  activeTab,
  onNavigate,
  onLogout,
  isAuthenticated = false,
  account = {},
  theme,
  onToggleTheme,
  isMobileOpen,
  setMobileOpen,
  onOpenCommandPalette,
}) {
  const [openGroup, setOpenGroup] = useState(null);
  const [mobileGroup, setMobileGroup] = useState(null);
  const closeTimer = useRef(null);
  const navRef = useRef(null);
  const watchlist = useWatchlist();
  const { t } = usePreferences();

  /**
   * Translated navigation model.
   *
   * Items are translated by id so the structure stays single-sourced in
   * NAV_GROUPS above. An untranslated id falls back to its Indonesian label,
   * which is why the whole app keeps working as languages are added.
   */
  const navGroups = useMemo(() => NAV_GROUPS.map(g => ({
    ...g,
    label: t(`nav.${g.id.toLowerCase()}`, g.label),
  })), [t]);

  const isAdmin = useMemo(
    () => !!account?.isAdmin
      || ['naufalarib60@gmail.com', 'ahmfuadi28@gmail.com'].includes(String(account?.email || '').toLowerCase()),
    [account],
  );

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenGroup(null), CLOSE_DELAY_MS);
  }, [cancelClose]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  // Escape closes the panel — expected of any dropdown, and needed for keyboard
  // users who cannot "move the pointer away" to dismiss it.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpenGroup(null);
        setMobileOpen && setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setMobileOpen]);

  // Clicking anywhere outside the nav dismisses an open panel.
  useEffect(() => {
    const onClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenGroup(null);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleNavigate = useCallback((id) => {
    setOpenGroup(null);
    setMobileGroup(null);
    if (setMobileOpen) setMobileOpen(false);
    if (onNavigate) onNavigate(id);
  }, [onNavigate, setMobileOpen]);

  /**
   * Logout lives at the foot of the Account menu.
   *
   * WHY HERE: it was previously reachable only from Account > Langganan, which
   * is not where anyone looks for it — the owner reported "gk ada tombol logout".
   * Account is the menu a user opens when they want out, so the action belongs
   * there. It closes every open menu before handing off, so the nav does not
   * stay expanded behind the confirmation.
   */
  const handleLogoutClick = useCallback(() => {
    setOpenGroup(null);
    setMobileGroup(null);
    if (setMobileOpen) setMobileOpen(false);
    if (onLogout) onLogout();
  }, [onLogout, setMobileOpen]);

  /** Which group contains the active tab, so it can be highlighted. */
  const activeGroupId = useMemo(() => {
    if (activeTab === 'HOME') return 'HOME';
    for (const g of NAV_GROUPS) {
      if (g.items?.some(i => i.id === activeTab)) return g.id;
    }
    if (ADMIN_ONLY_IDS.has(activeTab)) return 'ACCOUNT';
    // Tabs reachable only from the secondary tools map, e.g. TESTING sub-views.
    const secondary = ['CURRENT_TEST', 'BACKTEST_LAB', 'GLOBAL_MARKETS'];
    if (secondary.includes(activeTab)) return 'RESEARCH';
    return null;
  }, [activeTab]);

  /** Secondary tools an admin reaches from the Account menu. */
  const adminExtras = isAdmin
    ? [
        { id: 'ADMIN_APPROVAL', label: 'Admin Approval Desk', desc: 'Kelola langganan pengguna' },
        { id: 'FLOW_PROCESS', label: 'Flow Process', desc: 'Arsitektur sistem (internal)' },
        { id: 'CHANGELOG', label: 'Changelog', desc: 'Riwayat rilis (internal)' },
      ]
    : [];

  const renderPanel = (group) => {
    const items = group.id === 'ACCOUNT' ? [...group.items, ...adminExtras] : group.items;
    if (!items) return null;

    return (
      <div
        role="menu"
        aria-label={group.label}
        /**
         * The hover handlers live ON the menu, not on a wrapper around it.
         *
         * ARIA requires `menuitem` to be an owned child of `menu`, with no
         * intervening generic element. The previous structure was
         * <div onMouseEnter><div role="menu"><button role="menuitem"> — so the
         * menu items were nested inside an unlabelled div and assistive tech
         * (and Playwright's role queries) could not resolve them. Moving the
         * handlers here keeps the "pointer may travel into the panel during the
         * grace period" behaviour while making the roles valid.
         */
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          minWidth: '268px',
          maxWidth: '340px',
          background: 'var(--bg-panel)',
          border: 'var(--border-hairline)',
          borderRadius: '11px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
          padding: '7px',
          zIndex: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
        }}
      >
        {items.map(item => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              role="menuitem"
              onClick={() => handleNavigate(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '1px',
                width: '100%',
                padding: '7px 10px',
                borderRadius: '7px',
                border: 'none',
                background: active ? 'rgba(59,130,246,0.13)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = active ? 'rgba(59,130,246,0.18)' : 'var(--bg-panel-subtle)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = active ? 'rgba(59,130,246,0.13)' : 'transparent'; }}
            >
              <span style={{ fontSize: '12px', fontWeight: 700, color: active ? 'var(--accent-sky-soft)' : 'var(--text-primary)' }}>
                {item.label}
              </span>
              {item.desc && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {item.desc}
                </span>
              )}
            </button>
          );
        })}

        {/* Logout sits below a divider so it is not mistaken for a page link. */}
        {group.id === 'ACCOUNT' && isAuthenticated && onLogout && (
          <>
            <div style={{ height: '1px', background: 'var(--border-subtle, rgba(255,255,255,0.08))', margin: '5px 3px' }} />
            <button
              role="menuitem"
              onClick={handleLogoutClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                width: '100%',
                padding: '8px 10px',
                borderRadius: '7px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                color: 'var(--accent-red, #ff5c5c)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 92, 92, 0.10)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '13px' }}>⏻</span>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>Log out</span>
            </button>
          </>
        )}
      </div>
    );
  };

  const navButtons = (
    <div ref={navRef} style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'relative' }}>
      {navGroups.map(group => {
        const isOpen = openGroup === group.id;
        const isActive = activeGroupId === group.id;
        const hasPanel = !!group.items;

        return (
          <div
            key={group.id}
            style={{ position: 'relative' }}
            onMouseEnter={() => {
              if (!hasPanel) { cancelClose(); setOpenGroup(null); return; }
              cancelClose();
              setOpenGroup(group.id);
            }}
            onMouseLeave={() => { if (hasPanel) scheduleClose(); }}
          >
            <button
              onClick={() => {
                /**
                 * Click OPENS; it does not toggle.
                 *
                 * A plain toggle is wrong here because hover has already opened
                 * the panel before the click lands — the pointer has to arrive
                 * at the button to click it, and arriving triggers onMouseEnter.
                 * So `isOpen ? null : group.id` closed the panel that hover had
                 * just opened, and every click appeared to do nothing. That is
                 * what the E2E suite hit when driving the nav as a user would.
                 *
                 * Opening unconditionally is also the correct behaviour for a
                 * touch device, where there is no hover and a click is the only
                 * way in. Dismissal happens by moving away, pressing Escape, or
                 * clicking outside — all of which are already wired.
                 */
                if (hasPanel) { cancelClose(); setOpenGroup(group.id); }
                else handleNavigate(group.id);
              }}
              aria-haspopup={hasPanel ? 'true' : undefined}
              aria-expanded={hasPanel ? isOpen : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '7px 11px',
                borderRadius: '8px',
                border: 'none',
                background: isOpen || isActive ? 'var(--bg-panel-subtle)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                transition: 'background 0.14s ease, color 0.14s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = isActive ? 'var(--text-primary)' : 'var(--text-secondary)'; }}
            >
              {group.label}
              {hasPanel && (
                <span style={{ fontSize: '12px', opacity: 0.6, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.14s ease' }}>
                  ▼
                </span>
              )}
            </button>

            {hasPanel && isOpen && renderPanel(group)}
          </div>
        );
      })}
    </div>
  );

  return (
    <nav
      className="telemetry-panel cmc-topnav"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '7px 13px',
        borderRadius: '12px',
        marginBottom: '10px',
        position: 'relative',
        zIndex: 300,
      }}
    >
      {/* Brand */}
      <button
        onClick={() => handleNavigate('HOME')}
        style={{ display: 'flex', alignItems: 'center', gap: '9px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        title="MBG Quant Terminal"
      >
        <MbgLogo size={27} />
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
          <span style={{ fontSize: '12.5px', fontWeight: 900, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
            MBG QUANT
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Market Terminal
          </span>
        </span>
      </button>

      {/* Desktop hover menus */}
      <div className="cmc-topnav-desktop" style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
        {navButtons}
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            title="Cari aset (Ctrl+K)"
            style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '5px 9px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            🔍<span className="cmc-hide-narrow">Cari</span>
          </button>
        )}

        <button
          onClick={() => handleNavigate('WATCHLIST')}
          title={`Watchlist (${watchlist.count} instrumen)`}
          style={{ position: 'relative', background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--accent-gold)', borderRadius: '8px', padding: '5px 9px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ★
          {watchlist.count > 0 && (
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--accent-gold)', color: '#000', borderRadius: '9px', fontSize: '12px', fontWeight: 900, padding: '0 4px', lineHeight: '13px', minWidth: '13px' }}>
              {watchlist.count}
            </span>
          )}
        </button>

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
            style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '5px 9px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        )}

        <button
          onClick={() => handleNavigate('SUBSCRIPTION')}
          title={account?.email ? `Masuk sebagai ${account.email}` : 'Akun'}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {/*
            The badge reads the TIER, not `isPro`.

            `isPro` is true for both PRO and LEGEND, so a Legend account was
            labelled "PRO" in the top nav while its own desks were gated at
            LEGEND — the badge and the gate disagreed, and a user who had earned
            the tier saw a lower one. The icon differs too: a crown for Legend,
            a star for Pro, so the two are distinguishable at a glance rather
            than by reading small text.
          */}
          <span>{isAdmin ? '👑' : account?.tier === 'legend' ? '👑' : account?.isPro ? '⭐' : '👤'}</span>
          <span className="cmc-hide-narrow">
            {isAdmin ? 'ADMIN' : account?.tier === 'legend' ? 'LEGEND' : account?.isPro ? 'PRO' : 'AKUN'}
          </span>
        </button>

        {/* Mobile hamburger */}
        <button
          className="cmc-topnav-mobile-toggle"
          onClick={() => setMobileOpen && setMobileOpen(!isMobileOpen)}
          aria-label="Buka navigasi"
          style={{ display: 'none', background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--text-primary)', borderRadius: '8px', padding: '5px 10px', fontSize: '14px', cursor: 'pointer' }}
        >
          ☰
        </button>
      </div>

      {/* Mobile drawer: tap-to-expand, because hover does not exist on touch */}
      {isMobileOpen && (
        <div
          className="cmc-topnav-mobile-drawer"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'var(--bg-panel)', border: 'var(--border-hairline)', borderRadius: '11px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)', padding: '9px', zIndex: 400,
            maxHeight: '68vh', overflowY: 'auto',
          }}
        >
          {navGroups.map(group => {
            const items = group.id === 'ACCOUNT' ? [...(group.items || []), ...adminExtras] : group.items;
            if (!items) {
              return (
                <button key={group.id} onClick={() => handleNavigate(group.id)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 11px', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {group.label}
                </button>
              );
            }
            const open = mobileGroup === group.id;
            return (
              <div key={group.id}>
                <button
                  onClick={() => setMobileGroup(open ? null : group.id)}
                  style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', padding: '9px 11px', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <span>{group.label}</span>
                  <span style={{ fontSize: '12px' }}>{open ? '▲' : '▼'}</span>
                </button>
                {open && items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 11px 7px 22px', background: activeTab === item.id ? 'rgba(59,130,246,0.13)' : 'none', border: 'none', color: activeTab === item.id ? 'var(--accent-sky-soft)' : 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '6px' }}
                  >
                    {item.label}
                  </button>
                ))}
                {/* Logout mirrors the desktop Account menu — same divider, same position. */}
                {open && group.id === 'ACCOUNT' && isAuthenticated && onLogout && (
                  <button
                    onClick={handleLogoutClick}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 11px 8px 22px', background: 'none', border: 'none', color: 'var(--accent-red, #ff5c5c)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', borderRadius: '6px' }}
                  >
                    ⏻ Log out
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </nav>
  );
}
