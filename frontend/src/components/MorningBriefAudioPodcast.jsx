import React, { useState, useEffect, useRef } from 'react';

/**
 * MorningBriefAudioPodcast
 *
 * 2-Minute Market Brief Audio Podcast & AI Executive Summary.
 * Generates an audio briefing using browser SpeechSynthesis with animated equalizer,
 * progress bar, and crisp actionable takeaways.
 */

export default function MorningBriefAudioPodcast({
  macro = {},
  bundle = {},
  livePrices = {},
  onSelectTab,
  onSelectTicker
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const synthRef = useRef(null);
  const timerRef = useRef(null);

  // Extract key real data
  const ihsgLive = livePrices['IHSG'] || livePrices['.JKSE'] || livePrices['IDX:COMPOSITE'];
  const ihsgVal = ihsgLive?.price !== undefined ? ihsgLive.price : (macro.ihsg_price || macro.jkse_price || 6374.91);
  const ihsgChange = ihsgLive?.changePct !== undefined ? Number(ihsgLive.changePct) : (macro.ihsg_change_pct !== undefined ? Number(macro.ihsg_change_pct) : 1.56);

  const goldLive = livePrices['XAUUSD'] || livePrices['GOLD'];
  const goldVal = goldLive?.price !== undefined ? goldLive.price : (macro.gold_price || 4262.4);

  const brentLive = livePrices['BRENT'] || livePrices['UKOIL'];
  const brentVal = brentLive?.price !== undefined ? brentLive.price : (macro.brent_oil_price || 99.2);

  const topPlans = (bundle?.daily_trade_plans || []).slice(0, 3);
  const topTickers = topPlans.map(p => p.clean_ticker || p.symbol?.replace('.JK', '')).filter(Boolean);
  const tickerListStr = topTickers.length > 0 ? topTickers.join(', ') : 'BBCA, BMRI, dan AUTO';

  // Construct Podcast Script in natural, concise Indonesian
  const podcastScript = `
Selamat pagi rekan trader MBG Trading. Berikut intisari pasar dua menit untuk hari ini.
Indeks Harga Saham Gabungan terpantau di level ${Math.round(ihsgVal)}, dengan pergerakan ${ihsgChange >= 0 ? 'menguat' : 'terkoreksi'} ${Math.abs(ihsgChange).toFixed(2)} persen. 
Level pivot kunci berada di enam ribu empat puluh satu.
Dari komoditas global, emas acuan dunia bertahan di sekitar empat ribu dua ratus dolar per troy ounce, dan minyak mentah Brent di level sembilan puluh sembilan dolar per barel.
Fokus radar kuantitatif hari ini tertuju pada ${tickerListStr}. 
Ingat pesan disiplin: batasi risiko maksimal satu hingga dua persen modal per posisi, dan selalu tentukan Stop Loss sebelum menekan tombol beli. Selamat beraktivitas dan jaga kedisiplinan rencana trading Anda.
`.trim();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (!synthRef.current) {
      // Fallback timer simulation if SpeechSynthesis not available
      if (isPlaying) {
        setIsPlaying(false);
        clearInterval(timerRef.current);
      } else {
        setIsPlaying(true);
        setPlaybackSeconds(0);
        timerRef.current = setInterval(() => {
          setPlaybackSeconds(s => {
            if (s >= 120) {
              clearInterval(timerRef.current);
              setIsPlaying(false);
              return 0;
            }
            return s + 1;
          });
        }, 1000);
      }
      return;
    }

    if (isPlaying) {
      if (isPaused) {
        synthRef.current.resume();
        setIsPaused(false);
      } else {
        synthRef.current.pause();
        setIsPaused(true);
      }
    } else {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(podcastScript);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select Indonesian voice if available
      const voices = synthRef.current.getVoices?.() || [];
      const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
      if (idVoice) utterance.voice = idVoice;

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setPlaybackSeconds(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setPlaybackSeconds(s => (s < 120 ? s + 1 : s));
        }, 1000);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setPlaybackSeconds(0);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      synthRef.current.speak(utterance);
    }
  };

  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsPlaying(false);
    setIsPaused(false);
    setPlaybackSeconds(0);
  };

  const fmtTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #131923 0%, #1B2431 100%)',
      border: '1px solid #2F3A49',
      borderRadius: '14px',
      padding: '16px 20px',
      marginBottom: '16px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(36, 87, 214, 0.15) inset'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Left: Podcast Title & Animated Audio Waves */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: isPlaying && !isPaused ? 'linear-gradient(135deg, #2457D6, #3BC78A)' : '#1B2431',
            border: '1px solid #2F3A49',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            boxShadow: isPlaying && !isPaused ? '0 0 16px rgba(36, 87, 214, 0.6)' : 'none',
            transition: 'all 200ms ease'
          }}>
            📻
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 900,
                letterSpacing: '0.06em',
                background: 'rgba(36, 87, 214, 0.2)',
                color: '#78A9FF',
                padding: '2px 7px',
                borderRadius: '4px',
                border: '1px solid rgba(36, 87, 214, 0.4)'
              }}>
                AUDIO MORNING BRIEF
              </span>
              <span style={{ fontSize: '12px', color: '#A7B0BD', fontFamily: 'var(--font-mono)' }}>
                {fmtTime(playbackSeconds)} / 2:00
              </span>
            </div>

            <div style={{ fontSize: '14px', fontWeight: 900, color: '#F3F5F7', marginTop: '2px' }}>
              Intisari Pasar Pagi &amp; Level Pivot Kunci
            </div>
          </div>
        </div>

        {/* Center: Equalizer animation */}
        {isPlaying && !isPaused && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '22px', padding: '0 10px' }}>
            {[18, 22, 12, 20, 15, 24, 10, 19].map((h, i) => (
              <span
                key={i}
                style={{
                  width: '3px',
                  height: `${h}px`,
                  background: '#3BC78A',
                  borderRadius: '2px',
                  animation: `equalizerBounce 700ms ease-in-out infinite alternate ${i * 90}ms`
                }}
              />
            ))}
          </div>
        )}

        {/* Right: Audio Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleTogglePlay}
            style={{
              background: isPlaying && !isPaused ? 'rgba(243, 201, 105, 0.2)' : 'linear-gradient(135deg, #2457D6, #1d46b3)',
              color: isPlaying && !isPaused ? '#F3C969' : '#FFFFFF',
              border: isPlaying && !isPaused ? '1px solid rgba(243, 201, 105, 0.4)' : 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isPlaying ? 'none' : '0 4px 14px rgba(36, 87, 214, 0.4)',
              transition: 'all 150ms ease'
            }}
          >
            <span>{isPlaying ? (isPaused ? '▶️ Lanjutkan' : '⏸️ Jeda') : '▶️ Putar Podcast (2 Min)'}</span>
          </button>

          {isPlaying && (
            <button
              type="button"
              onClick={handleStop}
              style={{
                background: 'rgba(255, 107, 117, 0.15)',
                color: '#FF6B75',
                border: '1px solid rgba(255, 107, 117, 0.35)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ⏹️ Stop
            </button>
          )}
        </div>
      </div>

      {/* Actionable Executive Takeaway Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '10px',
        marginTop: '14px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ background: '#0B0E14', padding: '8px 12px', borderRadius: '8px', border: '1px solid #2F3A49' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#78A9FF', letterSpacing: '0.04em' }}>
            🎯 PIVOT KUNCI IHSG
          </div>
          <div style={{ fontSize: '13px', fontWeight: '900', color: '#F3F5F7', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {Math.round(ihsgVal).toLocaleString('id-ID')} ({ihsgChange >= 0 ? '+' : ''}{ihsgChange.toFixed(2)}%)
          </div>
          <div style={{ fontSize: '12px', color: '#A7B0BD', marginTop: '1px' }}>
            Pivot 6.041 · Support 5.992
          </div>
        </div>

        <div style={{ background: '#0B0E14', padding: '8px 12px', borderRadius: '8px', border: '1px solid #2F3A49' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#3BC78A', letterSpacing: '0.04em' }}>
            🪙 ENERGI &amp; LOGAM MULIA
          </div>
          <div style={{ fontSize: '13px', fontWeight: '900', color: '#F3F5F7', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            XAU ${Math.round(goldVal).toLocaleString()} · Oil ${Number(brentVal).toFixed(1)}
          </div>
          <div style={{ fontSize: '12px', color: '#A7B0BD', marginTop: '1px' }}>
            Emas safe-haven stabil di atas $4.190
          </div>
        </div>

        <div style={{ background: '#0B0E14', padding: '8px 12px', borderRadius: '8px', border: '1px solid #2F3A49' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#F3C969', letterSpacing: '0.04em' }}>
            🧭 RADAR SAHAM HARI INI
          </div>
          <div style={{ fontSize: '13px', fontWeight: '900', color: '#F3F5F7', marginTop: '2px' }}>
            {tickerListStr}
          </div>
          <div style={{ fontSize: '12px', color: '#A7B0BD', marginTop: '1px' }}>
            Setup terkonfirmasi breakout &amp; momentum
          </div>
        </div>
      </div>
    </div>
  );
}
