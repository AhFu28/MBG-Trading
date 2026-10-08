import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { generateSmartBulletPoints, getIntelligenceArtifact, playTTS, stopTTS, formatNewsDateTime } from './newsHelpers.js';

export default function NewsDetailModal({
  news,
  allNews = [],
  onClose,
  onSelectTicker
}) {
  const [currentNews, setCurrentNews] = useState(news);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeChartSymbol, setActiveChartSymbol] = useState(null);

  // Sync internal state when parent news prop changes
  useEffect(() => {
    if (news) {
      setCurrentNews(news);
      // Reset active chart symbol to news primary symbol
      const tickers = Array.isArray(news.related_tickers) ? news.related_tickers : [];
      const isCrypto = news.stream === 'CRYPTO' || tickers.some(t => ['BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'XRP', 'SUI'].includes(t));
      const firstTicker = news.primary_ticker || (tickers.length > 0 ? tickers[0] : (news.tag === 'DAILY_BRIEF' ? 'IHSG' : 'BBCA'));
      const defaultSymbol = news.chart_symbol || (firstTicker === 'IHSG' ? 'IDX:COMPOSITE' : (isCrypto ? `BINANCE:${firstTicker}USDT` : `IDX:${firstTicker}`));
      setActiveChartSymbol(defaultSymbol);
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

  const dtInfo = formatNewsDateTime(currentNews);
  const pubDate = dtInfo.fullStr;
  const originalSourceTime = currentNews.source_time_utc || currentNews.source_published_at || currentNews.pub_date || '';

  const isBull = sentiment === 'BULLISH';
  const isBear = sentiment === 'BEARISH';
  const sentimentColor = isBull ? 'var(--accent-green)' : isBear ? 'var(--accent-red)' : 'var(--text-muted)';
  const sentimentBadgeClass = isBull ? 'badge-bull' : isBear ? 'badge-bear' : 'badge-neutral';

  const tickers = Array.isArray(currentNews.related_tickers) ? currentNews.related_tickers : [];
  const isCrypto = currentNews.stream === 'CRYPTO' || tickers.some(t => ['BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'XRP', 'SUI'].includes(t));

  const intel = getIntelligenceArtifact(currentNews);
  const snrScore = currentNews.snr_score || intel.what_matters?.snr_score || 90;
  const bulletPoints = generateSmartBulletPoints(currentNews);
  const readingTimeSec = currentNews.reading_time_sec || 60;
  const readingTimeStr = `⏱️ ~${Math.max(1, Math.round(readingTimeSec / 60))} mnt baca`;

  const narrative = currentNews.summary || currentNews.full_narrative ||
    'Perkembangan pasar domestik dan global terus dipantau oleh pelaku pasar institusi seiring dinamika rotasi likuiditas dan sentimen makro terkini.';

  // Technical Levels & Playbook
  const techLevels = currentNews.technical_levels;
  const playbook = currentNews.actionable_playbook;

  // Active chart symbol for iframe
  const resolvedChartSymbol = activeChartSymbol || (tickers.length > 0 ? (isCrypto ? `BINANCE:${tickers[0]}USDT` : `IDX:${tickers[0]}`) : 'IDX:COMPOSITE');

  // TTS Toggle
  const handleToggleTts = () => {
    if (isTtsPlaying) {
      stopTTS();
      setIsTtsPlaying(false);
    } else {
      const speechText = `${title}. What Changed: ${intel.what_changed?.summary || ''}. Why It Changed: ${intel.why_it_changed?.primary_driver || ''}. What Matters: ${intel.what_matters?.signal_vs_noise || ''}. What's Next: ${intel.whats_next?.guidance || ''}`;
      setIsTtsPlaying(true);
      playTTS(speechText, () => setIsTtsPlaying(false));
    }
  };

  // Copy Summary
  const handleCopySummary = () => {
    let textToCopy = `🏛️ [${source}] ${title}\n📅 ${pubDate} | Sentimen: ${sentiment} | SNR: ${snrScore}%\n\n📊 [1] WHAT CHANGED:\n${intel.what_changed?.summary}\n\n🔍 [2] WHY IT CHANGED:\n${intel.why_it_changed?.primary_driver}\n\n🎯 [3] WHAT MATTERS:\n${intel.what_matters?.signal_vs_noise}\n\n⚡ [4] WHAT'S NEXT (${intel.whats_next?.urgency} IMPACT):\n${intel.whats_next?.action}: ${intel.whats_next?.guidance}`;
    if (techLevels) {
      textToCopy += `\n\n📊 LEVEL TEKNIKAL:\n• Pivot: ${techLevels.pivot}\n• Support: S1 ${techLevels.s1} | S2 ${techLevels.s2}\n• Resistance: R1 ${techLevels.r1} | R2 ${techLevels.r2}\n• Invalidation: ${techLevels.invalidation}`;
    }
    textToCopy += `\n\nVia MBG Quantitative Terminal`;

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
        backgroundColor: 'rgba(8, 10, 14, 0.82)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
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
          maxWidth: '820px',
          maxHeight: '92vh',
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
              INSTITUTIONAL RESEARCH DESK
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

            {/* SNR Gauge */}
            <span style={{
              fontSize: '8.5px',
              fontFamily: 'var(--font-mono)',
              fontWeight: '800',
              padding: '2px 6px',
              borderRadius: '3px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              background: snrScore >= 85 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: snrScore >= 85 ? 'var(--accent-green)' : 'var(--accent-gold)',
              border: snrScore >= 85 ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)'
            }}>
              <span>⚡</span>
              <span>{snrScore}% SIGNAL RATIO</span>
            </span>
          </div>

          {/* Right Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleToggleTts}
              className="telemetry-btn"
              title={isTtsPlaying ? 'Hentikan Audio' : 'Dengarkan Ringkasan Riset'}
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

            <button
              onClick={handleCopySummary}
              className="telemetry-btn"
              title="Salin ringkasan riset ke clipboard"
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                🗓️ {dtInfo.dateStr}
              </span>
              <span style={{ color: 'var(--accent-blue, var(--accent-sky-soft))', fontWeight: '600' }}>
                ⏰ {dtInfo.timeStr}
              </span>
              {originalSourceTime && (
                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }} title={`Waktu asli rilis dari sumber: ${originalSourceTime}`}>
                  (Sumber: {originalSourceTime})
                </span>
              )}
              <span>•</span>
              <span>{readingTimeStr}</span>
              {currentNews.metrics && currentNews.metrics.length > 0 && (
                <>
                  <span>•</span>
                  <span style={{ color: 'var(--accent-blue)' }}>{currentNews.metrics.slice(0, 2).join(' | ')}</span>
                </>
              )}
            </div>
            {currentIndex >= 0 && (
              <div>
                Edisi <strong style={{ color: 'var(--text-primary)' }}>{currentIndex + 1}</strong> dari {allNews.length}
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

          {/* Executive One-Liner Summary (Institutional Standard) */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: '6px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '2px' }}>🏛️</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{
                fontSize: '9.5px',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-blue)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                EXECUTIVE INTELLIGENCE SYNTHESIS // 4-PILLAR FRAMEWORK
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                lineHeight: 1.5
              }}>
                {currentNews.summary || `${title}. ${intel.why_it_changed?.primary_driver || ''} ${intel.whats_next?.guidance || ''}`}
              </div>
            </div>
          </div>

          {/* 4-Pillar Grid Overview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '8px',
            background: 'var(--bg-canvas, #090b10)',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ padding: '6px 8px', background: 'rgba(59, 130, 246, 0.04)', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ fontSize: '8.5px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>[1] WHAT CHANGED</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.35 }}>{intel.what_changed?.summary}</div>
            </div>
            <div style={{ padding: '6px 8px', background: 'rgba(245, 158, 11, 0.04)', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ fontSize: '8.5px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>[2] WHY IT CHANGED</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.35 }}>{intel.why_it_changed?.primary_driver}</div>
            </div>
            <div style={{ padding: '6px 8px', background: 'rgba(168, 85, 247, 0.04)', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              <div style={{ fontSize: '8.5px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#c084fc' }}>[3] WHAT MATTERS</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.35 }}>{intel.what_matters?.signal_vs_noise}</div>
            </div>
            <div style={{ padding: '6px 8px', background: 'rgba(16, 185, 129, 0.04)', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '8.5px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>[4] WHAT'S NEXT ({intel.whats_next?.urgency})</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.35 }}>{intel.whats_next?.action}: {intel.whats_next?.guidance}</div>
            </div>
          </div>

          {/* Tickers Selector & Quick Navigation */}
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
                🎯 INSTRUMEN SOROTAN:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {tickers.map(ticker => {
                  const tvSym = ticker === 'IHSG' ? 'IDX:COMPOSITE' : (isCrypto ? `BINANCE:${ticker}USDT` : `IDX:${ticker}`);
                  const isActive = resolvedChartSymbol === tvSym;
                  return (
                    <button
                      key={ticker}
                      onClick={() => setActiveChartSymbol(tvSym)}
                      className="telemetry-btn"
                      title={`Tampilkan chart ${ticker} di bawah`}
                      style={{
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '800',
                        color: isActive ? '#fff' : 'var(--accent-blue)',
                        background: isActive ? 'var(--accent-blue)' : 'rgba(59, 130, 246, 0.12)',
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <span>📊</span>
                      <span>${ticker}</span>
                    </button>
                  );
                })}
              </div>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                (Pilih ticker untuk berganti cuplikan grafik)
              </span>
            </div>
          )}

          {/* 3. Support / Resistance Quantitative Matrix Card */}
          {techLevels && (
            <div
              style={{
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.35) 0%, rgba(15, 23, 42, 0.45) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
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
                borderBottom: '1px dashed rgba(59, 130, 246, 0.25)',
                paddingBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px' }}>📐</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-blue)',
                    letterSpacing: '0.04em'
                  }}>
                    SUPPORT & RESISTANCE TECHNICAL MATRIX ({techLevels.unit || 'IDR'})
                  </span>
                </div>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  CLASSIC PIVOT FORMULA
                </span>
              </div>

              {/* 4 Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px'
              }}>
                {/* Pivot */}
                <div style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '8px 10px',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', fontWeight: '700' }}>
                    ⚖️ PIVOT (POROS)
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {typeof techLevels.pivot === 'number' ? techLevels.pivot.toLocaleString() : techLevels.pivot}
                  </div>
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Equilibrium harian
                  </div>
                </div>

                {/* Support S1 & S2 */}
                <div style={{
                  background: 'rgba(0, 208, 132, 0.08)',
                  border: '1px solid rgba(0, 208, 132, 0.3)',
                  padding: '8px 10px',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', fontWeight: '700' }}>
                    🛡️ SUPPORT (S1 / S2)
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--accent-green)', marginTop: '2px' }}>
                    {techLevels.s1?.toLocaleString()} / {techLevels.s2?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Zona toleransi koreksi
                  </div>
                </div>

                {/* Resistance R1 & R2 */}
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '8px 10px',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--accent-red)', fontWeight: '700' }}>
                    🎯 RESISTANCE (R1 / R2)
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--accent-red)', marginTop: '2px' }}>
                    {techLevels.r1?.toLocaleString()} / {techLevels.r2?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Target take profit / rawan retest
                  </div>
                </div>

                {/* Invalidation */}
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '8px 10px',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)', fontWeight: '700' }}>
                    ⚠️ INVALIDATION (CUT LOSS)
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--accent-gold)', marginTop: '2px' }}>
                    {techLevels.invalidation?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Batas risiko mutlak
                  </div>
                </div>
              </div>

              {techLevels.invalidation_thesis && (
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '6px 10px',
                  borderRadius: '3px'
                }}>
                  💡 <strong>Catatan Disiplin Risiko:</strong> {techLevels.invalidation_thesis}
                </div>
              )}
            </div>
          )}

          {/* 4. Interactive TradingView Chart Snippet */}
          <div
            style={{
              background: 'var(--bg-panel-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{
              padding: '8px 12px',
              background: 'var(--bg-panel-dark)',
              borderBottom: 'var(--border-hairline)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px' }}>📈</span>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--text-primary)' }}>
                  TRADINGVIEW LIVE SNIPPET // {resolvedChartSymbol}
                </span>
              </div>
              <button
                onClick={() => {
                  const cleanSym = resolvedChartSymbol.replace(/^(IDX:|BINANCE:|TVC:)/, '').replace('USDT', '');
                  onSelectTicker && onSelectTicker(cleanSym, isCrypto ? 'CRYPTO' : 'IDX');
                }}
                className="telemetry-btn"
                style={{
                  fontSize: '9px',
                  padding: '2px 8px',
                  color: 'var(--accent-blue)',
                  borderColor: 'rgba(59, 130, 246, 0.4)'
                }}
              >
                Buka Fullscreen Chart ↗
              </button>
            </div>
            <div style={{ width: '100%', height: '230px', position: 'relative' }}>
              <iframe
                title={`Chart ${resolvedChartSymbol}`}
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_news_snippet&symbol=${encodeURIComponent(resolvedChartSymbol)}&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=12151b&studies=[]&theme=dark&style=1&timezone=Asia%2FJakarta&locale=id`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                loading="lazy"
              />
            </div>
          </div>

          {/* 5. Actionable Tactical Playbook Card */}
          {playbook && (
            <div
              style={{
                background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, rgba(59, 130, 246, 0.04) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{
                fontSize: '11px',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-green)',
                letterSpacing: '0.04em'
              }}>
                🛡️ ACTIONABLE TACTICAL PLAYBOOK
              </div>
              <div style={{ fontSize: '11px', lineHeight: 1.5, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>
                  <strong style={{ color: 'var(--accent-green)' }}>[🟢 Skenario Bullish]:</strong> {playbook.bull_scenario}
                </div>
                <div>
                  <strong style={{ color: 'var(--accent-red)' }}>[🔴 Skenario Bearish]:</strong> {playbook.bear_scenario}
                </div>
                <div>
                  <strong style={{ color: 'var(--accent-gold)' }}>[⚠️ Aturan Invalidation]:</strong> {playbook.invalidation_rule}
                </div>
              </div>
            </div>
          )}

          {/* 6. Driver Decomposition & Key Intelligence Panel (Vijay Subramanian Framework) */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.55) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: '6px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px dashed rgba(59, 130, 246, 0.25)',
              paddingBottom: '10px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>🌊</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-blue)',
                  letterSpacing: '0.04em'
                }}>
                  DRIVER DECOMPOSITION & ATRIBUSI PENGGERAK PASAR
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  color: snrScore >= 85 ? 'var(--accent-green)' : 'var(--accent-gold)',
                  fontWeight: '800',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '2px 6px',
                  borderRadius: '3px'
                }}>
                  ⚡ SNR: {snrScore}% (SIGNAL VERIFIED)
                </span>
                <span style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  color: sentimentColor,
                  fontWeight: '800'
                }}>
                  SENTIMEN: {sentiment}
                </span>
              </div>
            </div>

            {/* Waterfall Driver Progress Bars */}
            {Array.isArray(intel.why_it_changed?.drivers) && (
              <div style={{
                background: 'rgba(0,0,0,0.25)',
                padding: '12px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '9.5px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>
                    📊 DEKOMPOSISI FAKTOR PENYEBAB (KENAPA BERGERAK?):
                  </span>
                  <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                    Total Kontribusi: 100%
                  </span>
                </div>

                {intel.why_it_changed.drivers.map((d, dIdx) => (
                  <div key={dIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                        {dIdx === 0 ? '①' : dIdx === 1 ? '②' : '③'} {d.factor}
                      </span>
                      <strong style={{ color: d.color }}>+{d.weight_pct}%</strong>
                    </div>
                    <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${d.weight_pct}%`, background: d.color, borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4-Pillar Detailed Insights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '5px', padding: '10px' }}>
                <div style={{ fontSize: '9px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>📊</span> [1] WHAT CHANGED (FAKTA PASAR)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.45 }}>
                  {intel.what_changed?.summary}
                </div>
              </div>

              <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '5px', padding: '10px' }}>
                <div style={{ fontSize: '9px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🔍</span> [2] WHY IT CHANGED (TRANSMISI UTAMA)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                  {intel.why_it_changed?.primary_driver}
                </div>
              </div>

              <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '5px', padding: '10px' }}>
                <div style={{ fontSize: '9px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🎯</span> [3] WHAT MATTERS (SIGNAL VS NOISE)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.45 }}>
                  {intel.what_matters?.signal_vs_noise}
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '5px', padding: '10px' }}>
                <div style={{ fontSize: '9px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>⚡</span> [4] WHAT'S NEXT ({intel.whats_next?.urgency} IMPACT)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.45 }}>
                  <strong style={{ color: 'var(--accent-green)' }}>{intel.whats_next?.action}:</strong> {intel.whats_next?.guidance}
                </div>
              </div>
            </div>
          </div>

          {/* 7. Full Layman Context & Narrative */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{
              fontSize: '10px',
              fontWeight: '800',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              📝 Konteks & Narasi Pasar (Penjelasan Bahasa Awam)
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

        {/* 8. Footer Navigation Bar */}
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
            <span>Edisi Sebelumnya</span>
          </button>

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
                <span>Buka Chart ${tickers[0]}</span>
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
                <span>Buka Sumber</span>
                <span>↗</span>
              </a>
            )}
          </div>

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
            <span>Edisi Selanjutnya</span>
            <span>▶</span>
          </button>
        </div>
      </div>
    </div>
  );
}
