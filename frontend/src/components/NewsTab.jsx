import React, { useState, useMemo, useEffect } from 'react';
import {
  extractTickers,
  generateSmartBulletPoints,
  inferSentiment,
  playTTS,
  stopTTS
} from './newsHelpers.js';

export default function NewsTab({
  liveNews = [],
  macro = {},
  foreignFlow = {},
  onSelectTicker,
  onOpenOrderBook
}) {
  const [newsFilter, setNewsFilter] = useState('ALL');
  const [newsSearch, setNewsSearch] = useState('');
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mbg_news_bookmarks') || '[]');
    } catch {
      return [];
    }
  });
  const [ttsState, setTtsState] = useState({ isPlaying: false, activeId: null });
  const [copiedId, setCopiedId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Sync bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mbg_news_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.warn('Gagal menyimpan bookmark ke localStorage', e);
    }
  }, [bookmarks]);

  // Clean up TTS on unmount
  useEffect(() => {
    return () => {
      stopTTS();
    };
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  };

  const items = Array.isArray(liveNews) ? liveNews : [];

  // SoSoValue-style research categories
  const categories = [
    { id: 'ALL', label: '🔥 ALL RESEARCH' },
    { id: 'CRYPTO', label: '⚡ CRYPTO & ETFS' },
    { id: 'IDX', label: '🏛️ SAHAM IDX' },
    { id: 'BANKING', label: '🏦 PERBANKAN' },
    { id: 'COMMODITY', label: '⛏️ LOGAM & ENERGI' },
    { id: 'MACRO', label: '🌐 FED & MAKRO' },
    { id: 'SNIPS', label: '📋 DAILY RECAP' },
    { id: 'BOOKMARKS', label: `★ TERSIMPAN (${bookmarks.length})` }
  ];

  // Aggregate Market Sentiment for Hero Bar
  const sentimentStats = useMemo(() => {
    let bull = 0, bear = 0, neut = 0;
    items.forEach(item => {
      const s = (item.sentiment || '').toUpperCase();
      if (s === 'BULLISH') bull++;
      else if (s === 'BEARISH') bear++;
      else neut++;
    });
    const total = items.length || 1;
    return {
      bullPct: Math.round((bull / total) * 100),
      bearPct: Math.round((bear / total) * 100),
      neutPct: Math.round((neut / total) * 100),
      total: items.length
    };
  }, [items]);

  const toggleBookmark = (id) => {
    setBookmarks(prev => {
      const exists = prev.includes(id);
      if (exists) {
        showToast('Riset dihapus dari simpanan');
        return prev.filter(b => b !== id);
      } else {
        showToast('Riset berhasil disimpan!');
        return [...prev, id];
      }
    });
  };

  const handleCopy = (text, id, label = 'Tersalin ke clipboard!') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(id);
        showToast(label);
        setTimeout(() => setCopiedId(null), 2000);
      }).catch(() => {
        showToast('Gagal menyalin ke clipboard');
      });
    }
  };

  const handleTTS = (id, textToSpeak) => {
    if (ttsState.isPlaying && ttsState.activeId === id) {
      stopTTS();
      setTtsState({ isPlaying: false, activeId: null });
      showToast('Audio dihentikan');
    } else {
      stopTTS();
      setTtsState({ isPlaying: true, activeId: id });
      showToast('Memutar audio intisari riset...');
      playTTS(textToSpeak, () => {
        setTtsState({ isPlaying: false, activeId: null });
      });
    }
  };

  // Filter and Search logic
  const filteredNews = useMemo(() => {
    return items.filter((item, idx) => {
      const itemId = item.id || `news-${idx}`;
      const isBookmarked = bookmarks.includes(itemId);

      if (newsFilter === 'BOOKMARKS') {
        if (!isBookmarked) return false;
      } else if (newsFilter === 'CRYPTO') {
        const stream = item.stream || '';
        const tag = (item.tag || '').toUpperCase();
        if (stream !== 'CRYPTO' && !tag.includes('CRYPTO') && !tag.includes('DEFI')) return false;
      } else if (newsFilter === 'IDX') {
        const stream = item.stream || '';
        const tag = (item.tag || '').toUpperCase();
        if (stream === 'CRYPTO') return false;
        if (!['IHSG', 'BANKING', 'METALS', 'ENERGY', 'FOREIGN_FLOW'].includes(tag)) return false;
      } else if (newsFilter === 'BANKING') {
        const tag = (item.tag || '').toUpperCase();
        if (!tag.includes('BANK')) return false;
      } else if (newsFilter === 'COMMODITY') {
        const tag = (item.tag || '').toUpperCase();
        if (!tag.includes('METALS') && !tag.includes('ENERGY')) return false;
      } else if (newsFilter === 'MACRO') {
        const tag = (item.tag || '').toUpperCase();
        if (!tag.includes('MACRO') && !tag.includes('FED')) return false;
      }

      if (!newsSearch) return true;
      const q = newsSearch.toLowerCase();
      return (
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.source && item.source.toLowerCase().includes(q)) ||
        (item.summary && item.summary.toLowerCase().includes(q)) ||
        (item.tag && item.tag.toLowerCase().includes(q)) ||
        (item.related_tickers && item.related_tickers.some(t => t.toLowerCase().includes(q)))
      );
    });
  }, [items, newsFilter, newsSearch, bookmarks]);

  // Daily Snips summary text for WA / Telegram export
  const snipsExportText = useMemo(() => {
    const snips = macro?.daily_snips || {};
    const verdict = snips.market_verdict || {};
    const pulse = snips.macro_pulse || {};
    const goldChg = macro?.gold_change_pct ? `${macro.gold_change_pct > 0 ? '+' : ''}${macro.gold_change_pct}%` : '';
    const oilChg = macro?.brent_oil_change_pct ? `${macro.brent_oil_change_pct > 0 ? '+' : ''}${macro.brent_oil_change_pct}%` : '';
    const affected = (macro?.idx_affected_stocks || []).map(s => `$${s.ticker} (${s.impact}: ${s.reason})`).join('\n• ');

    return `📊 [MBG TRADING - DAILY MARKET SNIPS]
Edisi: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}

1. MARKET PULSE:
• Emas (XAU/USD): $${macro?.gold_price || '2750'} (${goldChg})
• Minyak Brent  : $${macro?.brent_oil_price || '74.2'} (${oilChg})
• DXY Dollar    : ${macro?.dxy_index || '104.5'} pts
• US 10Y Yield  : ${macro?.us10y_yield || '4.28'}%

2. MARKET VERDICT:
${verdict.badge || '🟢 ROTASI KOMODITAS & ENERGI'}
${verdict.narrative || macro?.full_narrative || 'Pasar bergerak dinamis menopang emiten likuid.'}

3. EMITEN TERDAMPAK:
• ${affected || 'Belum ada deviasi ekstrem'}

4. SARAN TRADER:
${snips.actionable_guidance || 'Disiplin pasang stop loss 3-4% dan hindari FOMO.'}

(Sumber: MBG Trading Terminal Intelligence Feed)`;
  }, [macro]);

  return (
    <div style={{
      maxWidth: '920px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      position: 'relative'
    }}>

      {/* 1. SOSOVALUE STYLE RESEARCH HERO BAR (Aggregated Sentiment & Wire Telemetry) */}
      <div className='telemetry-panel' style={{
        padding: '12px 16px',
        background: 'var(--bg-panel)',
        borderLeft: '4px solid var(--accent-orange, #f59e0b)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }} />
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                SOSOVALUE-STYLE RESEARCH &amp; MACRO WIRE
              </span>
              <span className="badge badge-bull" style={{ fontSize: '9px', padding: '1px 6px' }}>
                LIVE 24/7 DUAL-STREAM
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Kurasi riset institusional multi-stream: Saham IDX (BEI) &amp; Crypto Global ETF Flows dengan intisari AI Key Takeaways.
            </div>
          </div>

          {/* Sentiment Meter Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '220px', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--accent-green)' }}>BULLISH {sentimentStats.bullPct}%</span>
              <span style={{ color: 'var(--text-muted)' }}>NETRAL {sentimentStats.neutPct}%</span>
              <span style={{ color: 'var(--accent-rust)' }}>BEARISH {sentimentStats.bearPct}%</span>
            </div>
            <div style={{
              height: '6px',
              borderRadius: '3px',
              display: 'flex',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.06)'
            }}>
              <div style={{ width: `${sentimentStats.bullPct}%`, background: 'var(--accent-green)' }} title={`Bullish ${sentimentStats.bullPct}%`} />
              <div style={{ width: `${sentimentStats.neutPct}%`, background: '#8e8e93' }} title={`Netral ${sentimentStats.neutPct}%`} />
              <div style={{ width: `${sentimentStats.bearPct}%`, background: 'var(--accent-rust)' }} title={`Bearish ${sentimentStats.bearPct}%`} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTROL BAR (Filter Pills + Search) */}
      <div className='telemetry-panel' style={{ padding: '10px 14px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {/* Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setNewsFilter(cat.id)}
                className={`telemetry-btn ${newsFilter === cat.id ? 'active' : ''}`}
                style={{
                  fontSize: '10px',
                  padding: '5px 11px',
                  borderRadius: 'var(--radius-xs)',
                  letterSpacing: '0.04em'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 220px', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }}>
              <input
                type='text'
                placeholder='Cari berita ($BTC, $BBCA)...'
                value={newsSearch}
                onChange={e => setNewsSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 26px 6px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  border: 'var(--border-hairline)',
                  background: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  borderRadius: 'var(--radius-xs)'
                }}
              />
              {newsSearch && (
                <button
                  onClick={() => setNewsSearch('')}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                  title='Bersihkan pencarian'
                >
                  ✕
                </button>
              )}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              ({filteredNews.length} Riset)
            </span>
          </div>
        </div>
      </div>

      {/* 2. STOCKBIT SNIPS STYLE DAILY RECAP CARD */}
      {(newsFilter === 'ALL' || newsFilter === 'SNIPS') && (
        <div className='telemetry-panel' style={{
          borderLeft: '4px solid var(--accent-blue)',
          padding: '0',
          overflow: 'hidden',
          boxShadow: '0 4px 18px rgba(0,0,0,0.25)'
        }}>
          {/* Snips Header Banner */}
          <div style={{
            background: 'var(--bg-panel-subtle)',
            padding: '10px 14px',
            borderBottom: 'var(--border-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className='badge' style={{
                background: 'rgba(59, 130, 246, 0.18)',
                color: 'var(--accent-blue)',
                border: '1px solid var(--accent-blue)',
                fontWeight: '800',
                fontSize: '10px',
                letterSpacing: '0.04em'
              }}>
                ⚡ MBG DAILY SNIPS
              </span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Edisi Rekap Pasar & Analisa Saham
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                · ~2 Menit Baca
              </span>
            </div>

            {/* Quick Actions for Snips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => handleTTS('snips-daily', `${macro?.daily_snips?.market_verdict?.narrative || macro?.full_narrative || ''}`)}
                className='telemetry-btn'
                style={{
                  fontSize: '10px',
                  padding: '4px 9px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title='Dengarkan ringkasan via Text-to-Speech'
              >
                <span>{ttsState.isPlaying && ttsState.activeId === 'snips-daily' ? '⏹ Stop' : '🔊 Dengarkan Audio'}</span>
              </button>
              <button
                onClick={() => handleCopy(snipsExportText, 'snips-daily', 'Rekap Snips disalin! Siap untuk WA/Telegram.')}
                className='telemetry-btn'
                style={{
                  fontSize: '10px',
                  padding: '4px 9px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title='Salin rekap untuk WhatsApp / Telegram'
              >
                <span>{copiedId === 'snips-daily' ? '✓ Tersalin!' : '📋 Salin Rekap'}</span>
              </button>
            </div>
          </div>

          {/* Snips Body */}
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Market Pulse Bellwethers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
              gap: '8px',
              padding: '9px 12px',
              background: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-xs)',
              border: 'var(--border-muted)'
            }}>
              <div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>XAU/USD (EMAS)</div>
                <div style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                  ${macro?.gold_price || '2750.0'}
                  <span style={{
                    fontSize: '10px',
                    marginLeft: '5px',
                    color: (macro?.gold_change_pct || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)'
                  }}>
                    {(macro?.gold_change_pct || 0) >= 0 ? `+${macro?.gold_change_pct}%` : `${macro?.gold_change_pct}%`}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>BRENT OIL</div>
                <div style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                  ${macro?.brent_oil_price || '74.20'}
                  <span style={{
                    fontSize: '10px',
                    marginLeft: '5px',
                    color: (macro?.brent_oil_change_pct || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)'
                  }}>
                    {(macro?.brent_oil_change_pct || 0) >= 0 ? `+${macro?.brent_oil_change_pct}%` : `${macro?.brent_oil_change_pct}%`}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>US DOLLAR (DXY)</div>
                <div style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                  {macro?.dxy_index || '104.5'}
                  <span style={{
                    fontSize: '10px',
                    marginLeft: '5px',
                    color: (macro?.dxy_change_pct || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)'
                  }}>
                    {(macro?.dxy_change_pct || 0) >= 0 ? `+${macro?.dxy_change_pct}%` : `${macro?.dxy_change_pct}%`}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>US 10Y YIELD</div>
                <div style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                  {macro?.us10y_yield || '4.28'}%
                  <span style={{ fontSize: '10px', marginLeft: '5px', color: 'var(--text-muted)' }}>STABIL</span>
                </div>
              </div>
            </div>

            {/* Top Macro & Market Verdict Narrative */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-orange)' }}>
                  ⚡ MARKET VERDICT:
                </span>
                <span className='badge' style={{
                  background: 'rgba(27, 138, 75, 0.15)',
                  color: 'var(--accent-green)',
                  border: '1px solid var(--accent-green)',
                  fontSize: '9px',
                  fontWeight: '700'
                }}>
                  {macro?.daily_snips?.market_verdict?.badge || '🟢 ROTASI KOMODITAS & ENERGI'}
                </span>
              </div>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px 0', lineHeight: 1.35 }}>
                {macro?.headline || 'Pergerakan Pasar Modal Indonesia & Rotasi Sektoral'}
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                {macro?.daily_snips?.market_verdict?.narrative || macro?.full_narrative || 'Sentimen komoditas dan stabilitas nilai tukar Rupiah memandu pergerakan saham lapis satu.'}
              </p>
            </div>

            {/* Stock Catalyst Focus Chips */}
            {macro?.idx_affected_stocks && macro.idx_affected_stocks.length > 0 && (
              <div style={{ paddingTop: '8px', borderTop: 'var(--border-muted)' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  🎯 EMITEN PALING TERDAMPAK (KLIK UNTUK MEMBUKA CHART):
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {macro.idx_affected_stocks.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectTicker && onSelectTicker(item.ticker, 'IDX')}
                      className='telemetry-btn'
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderColor: item.impact === 'BULLISH' ? 'var(--accent-green)' : item.impact === 'BEARISH' ? 'var(--accent-rust)' : 'var(--accent-orange)',
                        cursor: 'pointer'
                      }}
                      title={item.reason}
                    >
                      <span>{item.impact === 'BULLISH' ? '🟢' : item.impact === 'BEARISH' ? '🔴' : '🟡'}</span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>${item.ticker}</strong>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>— {item.reason}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actionable Guidance Note */}
            {macro?.daily_snips?.actionable_guidance && (
              <div style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                background: 'var(--bg-canvas)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-xs)',
                borderLeft: '3px solid var(--accent-orange)'
              }}>
                💡 <strong>Tips Trader:</strong> {macro.daily_snips.actionable_guidance}
              </div>
            )}

          </div>
        </div>
      )}

      {/* 3. VERTICAL TIMELINE FEED (Single Column Stream) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredNews.length === 0 ? (
          <div className='telemetry-panel' style={{
            textAlign: 'center',
            padding: '42px 20px',
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: '22px', marginBottom: '8px' }}>🔍</div>
            <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>
              Tidak ada berita yang sesuai dengan filter atau kata kunci
            </div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              Coba gunakan filter 'SEMUA WIRE' atau ubah kata kunci pencarian.
            </div>
          </div>
        ) : (
          filteredNews.map((news, idx) => {
            const newsId = news.id || `news-${idx}`;
            const isBookmarked = bookmarks.includes(newsId);
            const sentiment = news.sentiment || inferSentiment(`${news.title} ${news.summary || ''}`);
            const bullets = (Array.isArray(news.key_takeaways) && news.key_takeaways.length > 0)
              ? news.key_takeaways
              : generateSmartBulletPoints(news);
            const detectedTickers = (Array.isArray(news.related_tickers) && news.related_tickers.length > 0)
              ? news.related_tickers
              : extractTickers(`${news.title} ${news.summary || ''}`);
            
            const textToSpeak = `${news.title}. ${bullets.join('. ')}`;

            return (
              <article
                key={newsId}
                className='telemetry-panel news-timeline-card'
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  borderLeft: sentiment === 'BULLISH' 
                    ? '3px solid var(--accent-green)' 
                    : sentiment === 'BEARISH' 
                      ? '3px solid var(--accent-rust)' 
                      : '3px solid var(--border-color)',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* News Top Metadata Strip */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Source */}
                    <span className='badge' style={{
                      fontSize: '9px',
                      background: 'var(--bg-panel-subtle)',
                      color: 'var(--text-primary)',
                      border: 'var(--border-hairline)'
                    }}>
                      {news.source || 'WIRE'}
                    </span>

                    {/* Tag */}
                    <span style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      color: 'var(--accent-blue)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      #{news.tag || 'IHSG'}
                    </span>

                    {/* Sentiment Badge */}
                    <span className={`badge ${
                      sentiment === 'BULLISH' ? 'badge-bull' : sentiment === 'BEARISH' ? 'badge-bear' : ''
                    }`} style={{ fontSize: '8px', padding: '1px 5px' }}>
                      {sentiment === 'BULLISH' ? '▲ BULLISH' : sentiment === 'BEARISH' ? '▼ BEARISH' : '● NEUTRAL'}
                    </span>

                    {/* Reading Time */}
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      ⏱ ~{news.reading_time_sec || 45}s
                    </span>
                  </div>

                  {/* Timestamp & Bookmark Star */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {news.published_str || (news.pub_date ? new Date(news.pub_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari ini')}
                    </span>
                    <button
                      onClick={() => toggleBookmark(newsId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: isBookmarked ? 'var(--accent-gold)' : 'var(--text-muted)',
                        padding: '2px 4px'
                      }}
                      title={isBookmarked ? 'Hapus dari Simpanan' : 'Simpan Berita'}
                    >
                      {isBookmarked ? '★' : '☆'}
                    </button>
                  </div>
                </div>

                {/* News Headline */}
                <h4 style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  margin: '2px 0 0 0',
                  lineHeight: 1.35
                }}>
                  {news.title}
                </h4>

                {/* Structured Key Highlights / Bullet Points */}
                <div style={{
                  background: 'var(--bg-canvas)',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'var(--border-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{
                    fontSize: '9px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.04em'
                  }}>
                    📌 KEY TAKEAWAYS (RINGKASAN POIN-POIN PENTING):
                  </div>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px'
                  }}>
                    {bullets.map((b, bIdx) => (
                      <li key={bIdx} style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Row: Clickable Tickers & Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  paddingTop: '6px',
                  borderTop: 'var(--border-muted)',
                  marginTop: '2px'
                }}>
                  {/* Tickers */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {detectedTickers.length > 0 ? (
                      <>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                          ASSET:
                        </span>
                        {detectedTickers.map(ticker => {
                          const isCryptoTicker = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'SUI', 'NEAR', 'PEPE', 'RENDER', 'FET'].includes(ticker.toUpperCase());
                          const targetMarket = isCryptoTicker ? 'CRYPTO' : 'IDX';
                          const formattedTicker = isCryptoTicker ? `${ticker.toUpperCase()}USDT` : ticker.toUpperCase();

                          return (
                            <button
                              key={ticker}
                              onClick={() => onSelectTicker && onSelectTicker(formattedTicker, targetMarket)}
                              className='telemetry-btn ticker-chip-interactive'
                              style={{
                                padding: '2px 7px',
                                fontSize: '9px',
                                color: isCryptoTicker ? 'var(--accent-orange, #f59e0b)' : 'var(--accent-blue)',
                                borderColor: isCryptoTicker ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0, 102, 204, 0.3)',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                              title={`Buka chart ${isCryptoTicker ? 'Crypto' : 'Saham'} $${ticker}`}
                            >
                              ${ticker} ↗
                            </button>
                          );
                        })}
                      </>
                    ) : (
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                        Klaster #{news.tag || 'MARKET'}
                      </span>
                    )}
                  </div>

                  {/* Actions (TTS, Copy, Link) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => handleTTS(newsId, textToSpeak)}
                      className='telemetry-btn'
                      style={{
                        fontSize: '9px',
                        padding: '2px 7px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                      title='Dengarkan butir berita ini'
                    >
                      {ttsState.isPlaying && ttsState.activeId === newsId ? '⏹ Stop' : '🔊 Dengar'}
                    </button>

                    <button
                      onClick={() => handleCopy(`${news.title}\n${bullets.map(b => '• ' + b).join('\n')}\nSumber: ${news.source}`, newsId, 'Poin ringkasan disalin!')}
                      className='telemetry-btn'
                      style={{
                        fontSize: '9px',
                        padding: '2px 7px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                      title='Salin ringkasan ke clipboard'
                    >
                      {copiedId === newsId ? '✓ Disalin' : '📋 Salin'}
                    </button>

                    {(news.link || news.url) && (
                      <a
                        href={news.link || news.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='telemetry-btn'
                        style={{
                          fontSize: '9px',
                          padding: '2px 7px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        Sumber Asli ↗
                      </a>
                    )}
                  </div>
                </div>

              </article>
            );
          })
        )}
      </div>

      {/* Toast Notification Popup */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--accent-blue)',
          color: '#ffffff',
          padding: '8px 14px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11px',
          fontWeight: '700',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
}