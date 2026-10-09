import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * CommandPaletteModal - Bloomberg / OpenTerminalUI Style Global Command Palette
 * Accessible anywhere via Ctrl + K or Cmd + K
 */
export default function CommandPaletteModal({
  isOpen,
  onClose,
  allIdxStocks = [],
  allCryptoSpot = [],
  onSelectTicker,
  onNavigateTab,
  onOpenLotCalc,
  onToggleTheme,
  onRefetch
}) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'IDX' | 'CRYPTO' | 'TABS' | 'ACTIONS'
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Focus input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  // Terminal Navigation Tabs
  const systemTabs = useMemo(() => [
    { id: 'HOME', label: 'Home Command Center', category: 'TABS', icon: '🏠', desc: 'Ringkasan makro wire, bento barometer & top alpha' },
    { id: 'CHARTING', label: 'Institutional Charting Desk', category: 'TABS', icon: '📈', desc: 'TradingView multi-pane & Jev-Trade execution overlay' },
    { id: 'AI_AGENTS', label: 'AI Agent Arena', category: 'TABS', icon: '🤖', desc: '16 Sovereign algorithmic bots & live trading simulator' },
    { id: 'AI_SENTINEL', label: 'AI Sentinel & Geopolitical Desk', category: 'TABS', icon: '🛡️', desc: 'Macro regimes, DEFCON Threat Barometer & syndicate debate' },
    { id: 'TESTING_LAB', label: 'Testing Lab (Backtest & DSR)', category: 'TABS', icon: '🧪', desc: 'Historical backtester, OpenQuant spec contract & Deflated Sharpe' },
    { id: 'QUANT_ACADEMY', label: 'Quant Academy & Math Lab', category: 'TABS', icon: '🎓', desc: 'Kurikulum disiplin risiko & Interactive Math Lab sandbox' },
    { id: 'NEWS', label: 'Bloomberg Macro Wire & News', category: 'TABS', icon: '📰', desc: '4-Pilar intelligence, daily brief & Goldman Sachs barbell research' },
    { id: 'WHALES', label: 'Whale Intelligence Hub', category: 'TABS', icon: '🐋', desc: 'Analisis akumulasi bandar, foreign flow & tape antrean paus' },
    { id: 'HEATMAP', label: 'Market Heatmap Treemap', category: 'TABS', icon: '🗺️', desc: 'Peta visual performa saham BEI per sektor' },
    { id: 'CRYPTO', label: 'Crypto Desk (Perp & Spot)', category: 'TABS', icon: '⚡', desc: 'Perpetual funding rates, open interest, long/short ratio & daftar spot' },
    { id: 'FOREX', label: 'Forex & Commodities', category: 'TABS', icon: '💱', desc: 'Major interbank forex pairs, emas & energi' },
    { id: 'STOCK', label: 'Stock Desk (IDX & US)', category: 'TABS', icon: '🏛️', desc: 'Saham BEI dan mega-cap Wall Street dalam satu meja' },
    { id: 'WATCHLIST', label: 'Personal Watchlist', category: 'TABS', icon: '⭐', desc: 'Koleksi instrumen favorit bertanda bintang' },
    { id: 'CHANGELOG', label: 'Changelog & System History', category: 'TABS', icon: '📋', desc: 'Dokumentasi rilis dan riwayat evolusi platform' }
  ], []);

  // System Actions
  const systemActions = useMemo(() => [
    {
      id: 'ACT_LOT_CALC',
      label: 'Kalkulator Lot & Risiko 2%',
      category: 'ACTIONS',
      icon: '💰',
      desc: 'Buka kalkulator ukuran lot diskret BEI & sizing kripto',
      action: () => onOpenLotCalc && onOpenLotCalc()
    },
    {
      id: 'ACT_SYNC',
      label: 'Sinkronisasi Ulang Data Feed (Refresh)',
      category: 'ACTIONS',
      icon: '🔄',
      desc: 'Paksa fetch ulang kuotasi live prices & macro wire',
      action: () => onRefetch && onRefetch()
    },
    {
      id: 'ACT_THEME',
      label: 'Ganti Tema Layar (Dark / Light Mode)',
      category: 'ACTIONS',
      icon: '🌓',
      desc: 'Beralih antara mode gelap institusional & terang',
      action: () => onToggleTheme && onToggleTheme()
    }
  ], [onOpenLotCalc, onRefetch, onToggleTheme]);

  // Filtered Results
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    // 1. Tickers Matching
    let matchedIdx = [];
    if (activeCategory === 'ALL' || activeCategory === 'IDX') {
      const idxList = allIdxStocks.length > 0 ? allIdxStocks : [
        { symbol: 'BBCA', name: 'Bank Central Asia', sector: 'Financial' },
        { symbol: 'BBRI', name: 'Bank Rakyat Indonesia', sector: 'Financial' },
        { symbol: 'BMRI', name: 'Bank Mandiri', sector: 'Financial' },
        { symbol: 'BREN', name: 'Barito Renewables', sector: 'Energy' },
        { symbol: 'AMMN', name: 'Amman Mineral Internasional', sector: 'Mining' },
        { symbol: 'BRMS', name: 'Bumi Resources Minerals', sector: 'Mining' },
        { symbol: 'ANTM', name: 'Aneka Tambang', sector: 'Mining' },
        { symbol: 'TLKM', name: 'Telkom Indonesia', sector: 'Telecommunication' },
        { symbol: 'ASII', name: 'Astra International', sector: 'Industrial' }
      ];
      matchedIdx = idxList
        .filter(s => {
          if (!q) return true;
          const sym = (s.symbol || '').toLowerCase();
          const name = (s.name || '').toLowerCase();
          return sym.includes(q) || name.includes(q);
        })
        .slice(0, 15)
        .map(s => ({
          id: `IDX_${s.symbol}`,
          symbol: s.symbol,
          market: 'IDX',
          label: `${s.symbol} (${s.name || 'Saham BEI'})`,
          desc: `Saham BEI · ${s.sector || 'Ekuitas Terdaftar'}`,
          category: 'IDX',
          icon: '📈',
          action: () => onSelectTicker && onSelectTicker(s.symbol, 'IDX')
        }));
    }

    // 2. Crypto Matching
    let matchedCrypto = [];
    if (activeCategory === 'ALL' || activeCategory === 'CRYPTO') {
      const cryptoList = allCryptoSpot.length > 0 ? allCryptoSpot : [
        { symbol: 'BTCUSDT', name: 'Bitcoin / USDT' },
        { symbol: 'ETHUSDT', name: 'Ethereum / USDT' },
        { symbol: 'SOLUSDT', name: 'Solana / USDT' },
        { symbol: 'BNBUSDT', name: 'Binance Coin / USDT' },
        { symbol: 'NEARUSDT', name: 'NEAR Protocol / USDT' },
        { symbol: 'SUIUSDT', name: 'Sui Network / USDT' }
      ];
      matchedCrypto = cryptoList
        .filter(c => {
          if (!q) return true;
          const sym = (c.symbol || c.pair || '').toLowerCase();
          return sym.includes(q);
        })
        .slice(0, 10)
        .map(c => {
          const sym = c.symbol || c.pair;
          return {
            id: `CRYPTO_${sym}`,
            symbol: sym,
            market: 'CRYPTO',
            label: `${sym}`,
            desc: `Pasar Kripto Spot Binance`,
            category: 'CRYPTO',
            icon: '⚡',
            action: () => onSelectTicker && onSelectTicker(sym, 'CRYPTO')
          };
        });
    }

    // 3. Navigation Tabs
    let matchedTabs = [];
    if (activeCategory === 'ALL' || activeCategory === 'TABS') {
      matchedTabs = systemTabs
        .filter(t => {
          if (!q) return true;
          const cleanQ = q.replace('/', '');
          return t.id.toLowerCase().includes(cleanQ) ||
                 t.label.toLowerCase().includes(cleanQ) ||
                 t.desc.toLowerCase().includes(cleanQ);
        })
        .map(t => ({
          ...t,
          action: () => onNavigateTab && onNavigateTab(t.id)
        }));
    }

    // 4. System Actions
    let matchedActions = [];
    if (activeCategory === 'ALL' || activeCategory === 'ACTIONS') {
      matchedActions = systemActions.filter(a => {
        if (!q) return true;
        return a.label.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q);
      });
    }

    return [...matchedActions, ...matchedTabs, ...matchedIdx, ...matchedCrypto];
  }, [query, activeCategory, allIdxStocks, allCryptoSpot, systemTabs, systemActions, onSelectTicker, onNavigateTab]);

  // Keep selection within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  // Execute selected item
  const handleExecute = (item) => {
    if (!item) return;
    onClose();
    if (item.action) {
      item.action();
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleExecute(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Auto-scroll to selected element
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 8, 14, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '10vh'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '640px',
          maxWidth: '92vw',
          maxHeight: '75vh',
          background: 'var(--bg-panel, #121722)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          borderRadius: '10px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-mono, monospace)',
          animation: 'paletteFadeIn 0.15s ease-out'
        }}
      >
        {/* Search Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          borderBottom: 'var(--border-hairline, 1px solid rgba(255,255,255,0.08))',
          background: 'rgba(18, 23, 34, 0.95)'
        }}>
          <span style={{ fontSize: '16px', color: 'var(--accent-sky-soft)' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari emiten BEI (BBCA), kripto (BTC), rute (/chart), atau aksi..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: '13px',
              fontFamily: 'inherit',
              fontWeight: 600
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-muted, #94a3b8)',
              padding: '2px 5px',
              borderRadius: '3px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              ESC to exit
            </span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '6px 14px',
          borderBottom: 'var(--border-hairline, 1px solid rgba(255,255,255,0.06))',
          background: 'rgba(10, 14, 22, 0.6)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'TABS', label: '🏛️ Tab Rute' },
            { id: 'ACTIONS', label: '🛠️ Aksi Cepat' },
            { id: 'IDX', label: '🇮🇩 Saham BEI' },
            { id: 'CRYPTO', label: '⚡ Kripto Spot' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              style={{
                background: activeCategory === c.id ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                color: activeCategory === c.id ? 'var(--accent-sky-soft)' : 'var(--text-muted, #94a3b8)',
                border: activeCategory === c.id ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: '420px',
            padding: '6px'
          }}
        >
          {filteredItems.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '12px' }}>
              Tidak ditemukan instrumen atau perintah yang cocok dengan "<strong>{query}</strong>".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id || idx}
                  data-selected={isSelected}
                  onClick={() => handleExecute(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
                    border: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                    transition: 'all 0.1s ease',
                    marginBottom: '2px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: isSelected ? 'var(--text-inverse)' : 'var(--text-primary, #f1f5f9)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.label}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: isSelected ? '#93c5fd' : 'var(--text-muted, #94a3b8)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.desc}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: item.category === 'IDX'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : item.category === 'CRYPTO'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : item.category === 'ACTIONS'
                        ? 'rgba(168, 85, 247, 0.15)'
                        : 'rgba(59, 130, 246, 0.15)',
                      color: item.category === 'IDX'
                        ? 'var(--accent-emerald)'
                        : item.category === 'CRYPTO'
                        ? 'var(--accent-gold)'
                        : item.category === 'ACTIONS'
                        ? 'var(--accent-purple-light)'
                        : 'var(--accent-sky-soft)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      {item.category}
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: '12px', color: 'var(--accent-sky-soft)' }}>↵</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          background: 'rgba(10, 14, 22, 0.95)',
          borderTop: 'var(--border-hairline, 1px solid rgba(255,255,255,0.08))',
          fontSize: '12px',
          color: 'var(--text-muted, #94a3b8)'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span><strong style={{ color: '#f1f5f9' }}>↑↓</strong> Navigasi</span>
            <span><strong style={{ color: '#f1f5f9' }}>↵</strong> Pilih</span>
            <span><strong style={{ color: '#f1f5f9' }}>ESC</strong> Tutup</span>
          </div>
          <div style={{ color: 'var(--accent-sky-soft)', fontWeight: 700 }}>
            MBG QUICK LAUNCHER // OPENTERMINALUI SPEC
          </div>
        </div>
      </div>
    </div>
  );
}
