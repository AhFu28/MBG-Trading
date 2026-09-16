import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { generateSmartBulletPoints, playTTS, stopTTS } from './newsHelpers.js';

export default function NewsDetailModal({
  news,
  allNews = [],
  onClose,
  onSelectTicker
}) {
  const [currentNews, setCurrentNews] = useState(news);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync internal state when parent news prop changes
  useEffect(() => {
    if (news) {
      setCurrentNews(news);
    }
  }, [news]);

  // Clean up TTS when modal closes or changes
  useEffect(() => {
    return () => {
      stopTTS();
    };
  }, []);

  // Compute current index in allNews for prev/next navigation
  const currentIndex = useMemo(() => {
    if (!Array.isArray(allNews) || allNews.length === 0 || !currentNews) return -1;
    return allNews.findIndex(item => 
      (item.id && item.id === currentNews.id) || 
      (item.title && item.title === currentNews.title)
    );
  }, [allNews, currentNews]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allNews.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      stopTTS();
      setIsTtsPlaying(false);
      setCurrentNews(allNews[currentIndex - 1]);
    }
  }, [hasPrev, allNews, currentIndex]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      stopTTS();
      setIsTtsPlaying(false);
      setCurrentNews(allNews[currentIndex + 1]);
    }
  }, [hasNext, allNews, currentIndex]);

  // Keyboard navigation: ESC to close, Left/Right arrows for prev/next
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  if (!currentNews) return null;

  const title = currentNews.title || 'Informasi Pasar Finansial';
  const source = (currentNews.source || 'Market Wire').toUpperCase();
  const sentiment = (currentNews.sentiment || 'NEUTRAL').toUpperCase();
  const tag = currentNews.tag || 'MARKET';
  const pubDate = currentNews.pub_date 
    ? new Date(currentNews.pub_date).toLocaleString('id-ID', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }) + ' WIB'
    : 'Hari ini';

  const isBull = sentiment === 'BULLISH';
  const isBear = sentiment === 'BEARISH';
  const sentimentColor = isBull ? 'var(--accent-green)' : isBear ? 'var(--accent-red)' : 'var(--text-muted)';
  const sentimentBadgeClass = isBull ? 'badge-bull' : isBear ? 'badge-bear' : 'badge-neutral';

  const tickers = Array.isArray(currentNews.related_tickers) ? currentNews.related_tickers : [];
  const isCrypto = currentNews.stream === 'CRYPTO' || tickers.some(t => ['BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'XRP', 'SUI'].includes(t));

  // Key takeaways bullet points
  const bulletPoints = generateSmartBulletPoints(currentNews);

  // Reading time
  const readingTimeSec = currentNews.reading_time_sec || 60;
  const readingTimeStr = `⏱️ ~${Math.max(1, Math.round(readingTimeSec / 60))} mnt baca`;

  // Narrative / summary text
  const narrative = currentNews.summary || currentNews.full_narrative || 
    'Perkembangan pasar domestik dan global terus dipantau oleh pelaku pasar institusi seiring dinamika rotasi likuiditas dan sentimen makro terkini.';

  // TTS Toggle
  const handleToggleTts = () => {
    if (isTtsPlaying) {
      stopTTS();
      setIsTtsPlaying(false);
    } else {
      const speechText = `${title}. Rangkuman poin penting: ${bulletPoints.join('. ')}. ${narrative}`;
      setIsTtsPlaying(true);
      playTTS(speechText, () => setIsTtsPlaying(false));
    }
  };

  // Copy Summary
  const handleCopySummary = () => {
    const textToCopy = `📰 [${source}] ${title}\n📅 ${pubDate} | Sentimen: ${sentiment}\n\n📌 KEY TAKEAWAYS:\n${bulletPoints.map(b => '• ' + b).join('\n')}\n\n📝 KONTEKS:\n${narrative}\n\nVia MBG Trading Terminal`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(8, 10, 14, 0.78)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="telemetry-panel"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out'
        }}
      >
        {/* 1. Modal Top Bar */}
        <div
          style={{
            padding: '12px 18px',
            background: 'var(--bg-panel-dark, #12151b)',
            borderBottom: 'var(--border-hairline)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          {/* Left info tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px' }}>📰</span>
            <span style={{ fontSize: '11px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              MARKET INTEL BRIEF
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>//</span>
            <span style={{
              fontSize: '9px',
              fontFamily: 'var(--font-mono)',
              fontWeight: '800',
              padding: '2px 6px',
              borderRadius: '3px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              {source}
            </span>
            <span className={`badge ${sentimentBadgeClass}`} style={{ fontSize: '8px', padding: '2px 6px' }}>
              {sentiment}
            </span>
            <span style={{
              fontSize: '8px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              background: 'var(--bg-panel-subtle)',
              padding: '2px 5px',
              borderRadius: '2px'
            }}>
              #{tag}
            </span>
          </div>

          {/* Right Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Audio TTS Button */}
            <button
              onClick={handleToggleTts}
              className="telemetry-btn"
              title={isTtsPlaying ? 'Hentikan Audio' : 'Dengarkan Ringkasan Berita'}
              style={{
                padding: '3px 8px',
                fontSize: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: isTtsPlaying ? 'rgba(0, 208, 132, 0.2)' : 'transparent',
                borderColor: isTtsPlaying ? 'var(--accent-green)' : 'var(--border-color)',
                color: isTtsPlaying ? 'var(--accent-green)' : 'var(--text-secondary)'
              }}
            >
              <span>{isTtsPlaying ? '⏹️' : '🔊'}</span>
              <span>{isTtsPlaying ? 'Membaca...' : 'Audio'}</span>
            </button>

            {/* Copy Summary Button */}
            <button
              onClick={handleCopySummary}
              className="telemetry-btn"
              title="Salin ringkasan berita ke clipboard"
              style={{
                padding: '3px 8px',
                fontSize: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: copied ? 'var(--accent-green)' : 'var(--text-secondary)'
              }}
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="telemetry-btn"
              title="Tutup Modal (Esc)"
              style={{
                padding: '3px 9px',
                fontSize: '11px',
                fontWeight: '800',
                color: 'var(--text-muted)'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2. Scrollable Body Content */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Metadata Sub-bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            flexWrap: 'wrap',
            gap: '8px',
            paddingBottom: '6px',
            borderBottom: 'var(--border-hairline)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📅 {pubDate}</span>
              <span>•</span>
              <span>{readingTimeStr}</span>
            </div>
            {currentIndex >= 0 && (
              <div>
                Berita <strong style={{ color: 'var(--text-primary)' }}>{currentIndex + 1}</strong> dari {allNews.length}
              </div>
            )}
          </div>

          {/* Headline Title */}
          <h2
            style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: '800',
              lineHeight: 1.4,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em'
            }}
          >
            {title}
          </h2>

          {/* Related Tickers Row (Clickable directly to TradingView Chart!) */}
          {tickers.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                background: 'var(--bg-panel-subtle)',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'var(--border-hairline)'
              }}
            >
              <span style={{
                fontSize: '10px',
                fontWeight: '700',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                letterSpacing: '0.04em'
              }}>
                🎯 EMITEN TERDAMPAK:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {tickers.map(ticker => (
                  <button
                    key={ticker}
                    onClick={() => onSelectTicker && onSelectTicker(ticker, isCrypto ? 'CRYPTO' : 'IDX')}
                    className="telemetry-btn"
                    title={`Klik untuk buka Chart ${ticker} di TradingView`}
                    style={{
                      padding: '2px 8px',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '800',
                      color: 'var(--accent-blue)',
                      background: 'rgba(59, 130, 246, 0.12)',
                      borderColor: 'rgba(59, 130, 246, 0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>📊</span>
                    <span>${ticker}</span>
                    <span style={{ fontSize: '8px', opacity: 0.7 }}>↗</span>
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                (Klik ticker untuk buka chart interaktif)
              </span>
            </div>
          )}

          {/* 3. Key Takeaways Panel (Stockbit Snips Style) */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(0, 208, 132, 0.04) 0%, rgba(59, 130, 246, 0.04) 100%)',
              border: '1px solid rgba(0, 208, 132, 0.3)',
              borderRadius: '6px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px dashed rgba(0, 208, 132, 0.25)',
              paddingBottom: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px' }}>📋</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-green)',
                  letterSpacing: '0.04em'
                }}>
                  KEY TAKEAWAYS // SNIPS INTELLIGENCE
                </span>
              </div>
              <span style={{
                fontSize: '9px',
                fontFamily: 'var(--font-mono)',
                color: sentimentColor,
                fontWeight: '700'
              }}>
                SENTIMEN: {sentiment}
              </span>
            </div>

            {/* Bullet Points List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bulletPoints.map((bullet, idx) => {
                const icons = ['📌', '📊', '🎯'];
                const labels = ['Inti Peristiwa', 'Dampak Sektor & Pasar', 'Actionable Playbook'];
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      fontSize: '11px',
                      lineHeight: 1.45,
                      color: 'var(--text-primary)'
                    }}
                  >
                    <span style={{ fontSize: '11px', flexShrink: 0, marginTop: '1px' }}>
                      {icons[idx] || '•'}
                    </span>
                    <div>
                      <strong style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        marginRight: '6px'
                      }}>
                        [{labels[idx] || `Poin ${idx + 1}`}]:
                      </strong>
                      <span>{bullet}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Full Context & Narrative */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{
              fontSize: '10px',
              fontWeight: '800',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              📝 Konteks & Narasi Pasar
            </div>
            <div
              style={{
                fontSize: '12px',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                background: 'var(--bg-panel-subtle)',
                padding: '12px 14px',
                borderRadius: '6px',
                border: 'var(--border-hairline)'
              }}
            >
              {narrative}
            </div>
          </div>
        </div>

        {/* 3. Footer Navigation & External Action Bar */}
        <div
          style={{
            padding: '12px 18px',
            background: 'var(--bg-panel-dark, #12151b)',
            borderTop: 'var(--border-hairline)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            disabled={!hasPrev}
            className="telemetry-btn"
            style={{
              padding: '6px 12px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              opacity: hasPrev ? 1 : 0.4,
              cursor: hasPrev ? 'pointer' : 'not-allowed'
            }}
            title="Berita Sebelumnya (Panah Kiri)"
          >
            <span>◀</span>
            <span>Berita Sebelumnya</span>
          </button>

          {/* Center External Source Link & Primary Chart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {tickers.length > 0 && (
              <button
                onClick={() => onSelectTicker && onSelectTicker(tickers[0], isCrypto ? 'CRYPTO' : 'IDX')}
                className="telemetry-btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--accent-blue)',
                  borderColor: 'rgba(59, 130, 246, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>📈</span>
                <span>Chart ${tickers[0]}</span>
              </button>
            )}

            {currentNews.link && currentNews.link !== '#' && (
              <a
                href={currentNews.link}
                target="_blank"
                rel="noopener noreferrer"
                className="telemetry-btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  textDecoration: 'none'
                }}
                title="Buka berita di situs web sumber asli"
              >
                <span>Buka Sumber Asli</span>
                <span>↗</span>
              </a>
            )}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!hasNext}
            className="telemetry-btn"
            style={{
              padding: '6px 12px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              opacity: hasNext ? 1 : 0.4,
              cursor: hasNext ? 'pointer' : 'not-allowed'
            }}
            title="Berita Selanjutnya (Panah Kanan)"
          >
            <span>Berita Selanjutnya</span>
            <span>▶</span>
          </button>
        </div>
      </div>
    </div>
  );
}
