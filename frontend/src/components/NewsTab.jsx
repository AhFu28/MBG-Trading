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
  onOpenOrderBook,
  onSelectNews
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
    }).sort((a, b) => new Date(b.pub_date || 0) - new Date(a.pub_date || 0));
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
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      position: 'relative'
    }}>

      {/* 1. COMPACT HERO STRIP: Wire Title + Merged Sentiment Meter */}
      <div className='telemetry-panel' style={{
        padding: '8px 14px',
        background: 'var(--bg-panel)',
        borderLeft: '4px solid var(--accent-orange, #f59e0b)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', boxShadow: '0 0 6px var(--accent-green)' }} />
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
            MBG LIVE RESEARCH &amp; MACRO WIRE
          </span>
          <span className="badge badge-bull" style={{ fontSize: '9px', padding: '1px 6px' }}>
            24/7 DUAL-STREAM
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
            // IDX Equities &amp; Global Crypto ETF Intelligence
          </span>
        </div>

        {/* Compact Inline Sentiment Meter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '240px' }}>
          <div style={{ display: 'flex', gap: '8px', fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--accent-green)' }}>▲ {sentimentStats.bullPct}%</span>
            <span style={{ color: 'var(--text-muted)' }}>● {sentimentStats.neutPct}%</span>
            <span style={{ color: 'var(--accent-rust)' }}>▼ {sentimentStats.bearPct}%</span>
          </div>
          <div style={{
            height: '6px',
            flex: 1,
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

      {/* 2. MAIN 2-COLUMN COCKPIT (Left 65% Research Stream + Right 35% Macro & ETF Radar) */}
      <div className="news-tab-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)',
        gap: '12px',
        alignItems: 'start',
        width: '100%'
      }}>

        {/* ================= LEFT COLUMN: RESEARCH FEED & FILTER TOOLBAR ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
          
          {/* Unified Filter & Search Bar */}
          <div className='telemetry-panel' style={{ padding: '8px 12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setNewsFilter(cat.id)}
                    className={`telemetry-btn ${newsFilter === cat.id ? 'active' : ''}`}
                    style={{
                      fontSize: '10px',
                      padding: '4px 9px',
                      borderRadius: 'var(--radius-xs)',
                      letterSpacing: '0.03em'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 180px', justifyContent: 'flex-end' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '200px' }}>
                  <input
                    type='text'
                    placeholder='Cari ($BTC, $BBCA)...'
                    value={newsSearch}
                    onChange={e => setNewsSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '5px 24px 5px 8px',
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
                  ({filteredNews.length})
                </span>
              </div>
            </div>
          </div>

          {/* Research Articles Feed */}
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
                <h4
                  onClick={() => onSelectNews && onSelectNews(news)}
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: '2px 0 0 0',
                    lineHeight: 1.35,
                    cursor: onSelectNews ? 'pointer' : 'default',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { if (onSelectNews) e.currentTarget.style.color = 'var(--accent-blue)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                  title="Klik untuk membuka pop-up detail & analisis berita ini"
                >
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

                    {onSelectNews && (
                      <button
                        onClick={() => onSelectNews(news)}
                        className='telemetry-btn'
                        style={{
                          fontSize: '9px',
                          padding: '2px 7px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          color: 'var(--accent-blue)',
                          borderColor: 'rgba(59, 130, 246, 0.4)'
                        }}
                        title='Buka di Pop-up Modal Interaktif'
                      >
                        <span>🔍</span>
                        <span>Pop-up</span>
                      </button>
                    )}

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
        </div>

        {/* ================= RIGHT COLUMN: SPOT ETF FLOW & DAILY SNIPS ================= */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          position: 'sticky',
          top: '12px'
        }}>

          {/* 1. SPOT ETF FLOW & GLOBAL PULSE */}
          <div className='telemetry-panel' style={{
            padding: '10px 12px',
            background: 'var(--bg-panel)',
            border: 'var(--border-hairline)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '6px', borderBottom: 'var(--border-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px' }}>📊</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '0.04em' }}>
                  SPOT ETF FLOW &amp; GLOBAL PULSE
                </span>
              </div>
              <span className="badge badge-bull" style={{ fontSize: '8px', padding: '1px 5px' }}>LIVE</span>
            </div>

            {/* Quick Turnover Stats */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              background: 'var(--bg-canvas)',
              padding: '5px 8px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '9.5px',
              fontFamily: 'var(--font-mono)',
              marginBottom: '8px',
              border: 'var(--border-muted)'
            }}>
              <div>BTC Vol: <strong style={{ color: 'var(--accent-green)' }}>${macro?.etf_flows?.btc_etf_turnover_usd_m || 1580.4}M</strong></div>
              <div>ETH Vol: <strong style={{ color: 'var(--accent-green)' }}>${macro?.etf_flows?.eth_etf_turnover_usd_m || 620.5}M</strong></div>
            </div>

            {/* ETF List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {(macro?.etf_flows?.etfs || [
                { symbol: 'IBIT', name: 'BlackRock Bitcoin Trust', price: 43.11, change_pct: -3.64, turnover_m: 3314.0 },
                { symbol: 'FBTC', name: 'Fidelity Wise Origin BTC', price: 66.20, change_pct: -3.62, turnover_m: 423.3 },
                { symbol: 'GBTC', name: 'Grayscale Bitcoin Trust', price: 58.84, change_pct: -3.65, turnover_m: 210.1 },
                { symbol: 'ETHA', name: 'iShares Ethereum Trust', price: 18.20, change_pct: -5.06, turnover_m: 1346.6 },
                { symbol: 'FETH', name: 'Fidelity Ethereum Fund', price: 24.05, change_pct: -4.90, turnover_m: 156.3 }
              ]).map((etf, idx) => {
                const isPos = (etf.change_pct || 0) >= 0;
                return (
                  <div
                    key={etf.symbol || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '5px 8px',
                      background: 'var(--bg-canvas)',
                      borderRadius: 'var(--radius-xs)',
                      border: 'var(--border-muted)',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <strong style={{ fontSize: '11px', color: 'var(--text-primary)' }}>${etf.symbol}</strong>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Vol: ${etf.turnover_m}M</span>
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                        {etf.name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ${etf.price?.toFixed(2)}
                      </div>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: isPos ? 'var(--accent-green)' : 'var(--accent-rust)'
                      }}>
                        {isPos ? '+' : ''}{etf.change_pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Global Commodities Pulse (XAU, Brent, DXY, US10Y) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '5px',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: 'var(--border-muted)'
            }}>
              <div style={{ padding: '4px 6px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-xs)', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>XAU/USD: </span>
                <strong style={{ color: 'var(--text-primary)' }}>${macro?.gold_price || '2750'}</strong>
                <span style={{ color: (macro?.gold_change_pct || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)', marginLeft: '3px' }}>
                  {(macro?.gold_change_pct || 0) >= 0 ? '+' : ''}{macro?.gold_change_pct || '+0.39'}%
                </span>
              </div>
              <div style={{ padding: '4px 6px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-xs)', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>BRENT: </span>
                <strong style={{ color: 'var(--text-primary)' }}>${macro?.brent_oil_price || '74.2'}</strong>
                <span style={{ color: (macro?.brent_oil_change_pct || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)', marginLeft: '3px' }}>
                  {(macro?.brent_oil_change_pct || 0) >= 0 ? '+' : ''}{macro?.brent_oil_change_pct || '+2.03'}%
                </span>
              </div>
              <div style={{ padding: '4px 6px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-xs)', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>DXY: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{macro?.dxy_index || '99.65'}</strong>
                <span style={{ color: (macro?.dxy_change_pct || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)', marginLeft: '3px' }}>
                  {(macro?.dxy_change_pct || 0) >= 0 ? '+' : ''}{macro?.dxy_change_pct || '+0.19'}%
                </span>
              </div>
              <div style={{ padding: '4px 6px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-xs)', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>US10Y: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{macro?.us10y_yield || '4.94'}%</strong>
                <span style={{ color: 'var(--accent-green)', marginLeft: '3px' }}>+2bp</span>
              </div>
            </div>
          </div>

          {/* 2. MBG DAILY SNIPS & MARKET VERDICT */}
          <div className='telemetry-panel' style={{
            padding: '10px 12px',
            background: 'var(--bg-panel)',
            borderLeft: '4px solid var(--accent-blue)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            {/* Header with TTS & Copy */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '6px', borderBottom: 'var(--border-muted)' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)' }}>⚡ MBG DAILY SNIPS</span>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Rekap Pasar &amp; Analisa Saham</div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handleTTS('snips-daily', `${macro?.daily_snips?.market_verdict?.narrative || macro?.full_narrative || ''}`)}
                  className='telemetry-btn'
                  style={{ fontSize: '9px', padding: '2px 6px' }}
                  title='Putar Audio Intisari'
                >
                  {ttsState.isPlaying && ttsState.activeId === 'snips-daily' ? '⏹ Stop' : '🔊 Audio'}
                </button>
                <button
                  onClick={() => handleCopy(snipsExportText, 'snips-daily', 'Rekap Snips disalin!')}
                  className='telemetry-btn'
                  style={{ fontSize: '9px', padding: '2px 6px' }}
                  title='Salin untuk Telegram/WA'
                >
                  {copiedId === 'snips-daily' ? '✓' : '📋 Salin'}
                </button>
              </div>
            </div>

            {/* Verdict Badge & Headline */}
            <div style={{ marginBottom: '8px' }}>
              <span className='badge badge-bull' style={{ fontSize: '8.5px', padding: '1px 5px', display: 'inline-block', marginBottom: '4px' }}>
                {macro?.daily_snips?.market_verdict?.badge || '🟢 VOLATILITAS ENERGI TINGGI'}
              </span>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                {macro?.headline || 'Middle East Supply Tensions Drive Crude Oil Spike'}
              </div>
              <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                {macro?.daily_snips?.market_verdict?.narrative || macro?.full_narrative || 'Lonjakan harga minyak mentah menguntungkan emiten hulu migas, namun menekan margin sektor transportasi.'}
              </p>
            </div>

            {/* Impacted Stocks */}
            {macro?.idx_affected_stocks && macro.idx_affected_stocks.length > 0 && (
              <div style={{ paddingTop: '6px', borderTop: 'var(--border-muted)' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  🎯 EMITEN PALING TERDAMPAK:
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {macro.idx_affected_stocks.slice(0, 6).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectTicker && onSelectTicker(item.ticker, 'IDX')}
                      className='telemetry-btn'
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        borderColor: item.impact === 'BULLISH' ? 'var(--accent-green)' : item.impact === 'BEARISH' ? 'var(--accent-rust)' : 'var(--accent-orange)'
                      }}
                      title={item.reason}
                    >
                      <span>{item.impact === 'BULLISH' ? '🟢' : '🔴'}</span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>${item.ticker}</strong>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actionable Guidance Note */}
            {macro?.daily_snips?.actionable_guidance && (
              <div style={{
                marginTop: '8px',
                fontSize: '9.5px',
                color: 'var(--text-muted)',
                background: 'var(--bg-canvas)',
                padding: '5px 8px',
                borderRadius: 'var(--radius-xs)',
                borderLeft: '2px solid var(--accent-orange)'
              }}>
                💡 <strong>Tips:</strong> {macro.daily_snips.actionable_guidance}
              </div>
            )}
          </div>

        </div>

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