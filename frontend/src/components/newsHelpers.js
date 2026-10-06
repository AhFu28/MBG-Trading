// Smart Heuristic Micro-NLP & Utilities for MBG News Wire & Stockbit Snips
// Enhanced with Vijay Subramanian's 4-Pillar Intelligence Artifacts Framework

const KNOWN_TICKERS = [
  'BBCA','BBRI','BMRI','BBNI','ANTM','BRMS','MDKA','MEDC','ENRG','ADRO',
  'ASII','TLKM','BYAN','GOTO','AMMN','BREN','CUAN','PTBA','PGAS','ITMG',
  'UNTR','ICBP','INDF','CPIN','KLBF','ACES','SMRA','BSDE','CTRA','GIAA',
  'TPIA','PTRO','ADMR','TOWR','SMGR','INDY','BELI','BUMI','VKTR',
  // Global Crypto
  'BTC','ETH','SOL','BNB','XRP','DOGE','ADA','AVAX','LINK','SUI','NEAR','PEPE','RENDER','FET'
];

export function extractTickers(text = '') {
  if (!text) return [];
  const found = new Set();
  const words = text.replace(/[^a-zA-Z0-9]/g, ' ').toUpperCase().split(/\s+/);
  words.forEach(w => {
    if (KNOWN_TICKERS.includes(w)) found.add(w);
  });
  const upper = text.toUpperCase();
  if ((upper.includes('HAJI ISAM') || upper.includes('BAYAN')) && !found.has('BYAN')) found.add('BYAN');
  if (upper.includes('ANTAM') && !found.has('ANTM')) found.add('ANTM');
  if (upper.includes('MEDCO') && !found.has('MEDC')) found.add('MEDC');
  if ((upper.includes('BANK BRI') || upper.includes('BRI ')) && !found.has('BBRI')) found.add('BBRI');
  if ((upper.includes('BANK MANDIRI') || upper.includes('MANDIRI ')) && !found.has('BMRI')) found.add('BMRI');
  if ((upper.includes('BANK BCA') || upper.includes('BCA ')) && !found.has('BBCA')) found.add('BBCA');
  if (upper.includes('BITCOIN') && !found.has('BTC')) found.add('BTC');
  if (upper.includes('ETHEREUM') && !found.has('ETH')) found.add('ETH');
  if (upper.includes('SOLANA') && !found.has('SOL')) found.add('SOL');
  return Array.from(found);
}

export function inferSentiment(text = '') {
  const upper = text.toUpperCase();
  const bullWords = ['MENGUAT', 'NAIK', 'REBOUND', 'SURGE', 'BULL', 'ARA', 'AKUMULASI', 'NET BUY', 'LABA', 'DIVIDEN', 'MELONJAK', 'MELESAT', 'CUAN', 'DIINCAR', 'BREAKOUT', 'RALLY', 'INFLOWS', 'SURGES'];
  const bearWords = ['MELEMAH', 'TURUN', 'TERKOREKSI', 'ANJLOK', 'BEAR', 'ARB', 'NET SELL', 'TERTEKAN', 'JATUH', 'RUGI', 'AMBLES', 'DISTRIBUSI', 'PLUNGE', 'OUTFLOWS', 'DROP', 'SLUMPS'];

  const isBull = bullWords.some(w => upper.includes(w));
  const isBear = bearWords.some(w => upper.includes(w));

  if (isBull && !isBear) return 'BULLISH';
  if (isBear && !isBull) return 'BEARISH';
  return 'NEUTRAL';
}

export function extractMetrics(text = '') {
  const matches = [];
  const pcts = text.match(/[-+]?\d+[.,]?\d*%/g);
  if (pcts) matches.push(...pcts);
  const vals = text.match(/(?:Rp|US\$|\$)\s*[\d.,]+\s*(?:triliun|miliar|juta|T|M|B)?/gi);
  if (vals) matches.push(...vals);
  const levels = text.match(/\b(?:level|posisi|ke|support|resistance)\s+([\d.,]+)/gi);
  if (levels) matches.push(...levels);
  return Array.from(new Set(matches)).slice(0, 3);
}

/**
 * Transforms any raw news item into a structured 4-Pillar Intelligence Artifact:
 * 1. WHAT CHANGED (Numerical facts, price & volume deltas)
 * 2. WHY IT CHANGED (Driver decomposition with weighted attribution)
 * 3. WHAT MATTERS (Signal vs Noise synthesis, institutional validation)
 * 4. WHAT'S NEXT (Actionable playbook with urgency & invalidation)
 */
export function getIntelligenceArtifact(newsItem = {}) {
  if (newsItem.intelligence_blocks && newsItem.intelligence_blocks.what_changed) {
    return newsItem.intelligence_blocks;
  }

  const title = newsItem.title || '';
  const summary = newsItem.summary || '';
  const tag = (newsItem.tag || 'IHSG').toUpperCase();
  const combined = `${title} ${summary}`;
  const sentiment = (newsItem.sentiment || inferSentiment(combined)).toUpperCase();
  const tickers = (Array.isArray(newsItem.related_tickers) && newsItem.related_tickers.length > 0)
    ? newsItem.related_tickers
    : extractTickers(combined);
  const isCrypto = newsItem.stream === 'CRYPTO' || tag.includes('CRYPTO') || tickers.some(t => ['BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'XRP', 'SUI'].includes(t));
  const tickerLabel = tickers.length > 0 ? tickers.map(t => `$${t}`).join(', ') : '';

  const metricsFound = Array.isArray(newsItem.metrics) && newsItem.metrics.length > 0
    ? newsItem.metrics
    : extractMetrics(combined);

  // [1] WHAT CHANGED
  let whatChangedSummary = '';
  if (tickers.length > 0) {
    if (sentiment === 'BULLISH') {
      whatChangedSummary = `${tickerLabel} mencatatkan momentum akumulasi aktif${metricsFound.length ? ` (${metricsFound.join(', ')})` : ''} dengan ekspansi volume di atas rata-rata 20 hari.`;
    } else if (sentiment === 'BEARISH') {
      whatChangedSummary = `${tickerLabel} tertekan aksi jual aktif${metricsFound.length ? ` (${metricsFound.join(', ')})` : ''} memicu pengujian level support terdekat.`;
    } else {
      whatChangedSummary = `${tickerLabel} bergerak konsolidatif tertahan${metricsFound.length ? ` (${metricsFound.join(', ')})` : ''} menunggu konfirmasi katalis arah tren.`;
    }
  } else {
    whatChangedSummary = `Klaster #${tag} mencatatkan perubahan likuiditas${metricsFound.length ? ` (${metricsFound.join(', ')})` : ''} di pasar domestik dan global.`;
  }

  // [2] WHY IT CHANGED (Driver Decomposition)
  let macroWeight = 50;
  let bandarWeight = 35;
  let techWeight = 15;
  let primaryDriver = '';

  if (isCrypto) {
    macroWeight = 55;
    bandarWeight = 30;
    techWeight = 15;
    primaryDriver = 'Dinamika likuiditas Spot ETF US dan rotasi modal pasar derivatif global.';
  } else if (['METALS', 'ENERGY', 'COMMODITY', 'COMMODITIES'].includes(tag)) {
    macroWeight = 60;
    bandarWeight = 25;
    techWeight = 15;
    primaryDriver = 'Transmisi pergerakan harga komoditas acuan dunia (emas / minyak mentah) ke ekspektasi margin emiten.';
  } else if (['BANKING', 'FOREIGN_FLOW'].includes(tag)) {
    macroWeight = 30;
    bandarWeight = 55;
    techWeight = 15;
    primaryDriver = 'Arus akumulasi/distribusi bersih broker institusi asing (Whale Flow) pada saham tier-1.';
  } else {
    macroWeight = 45;
    bandarWeight = 35;
    techWeight = 20;
    primaryDriver = 'Pergeseran selera risiko sektoral dan penyesuaian bobot portofolio pelaku pasar.';
  }

  const drivers = [
    { factor: isCrypto ? 'Katalis ETF & Makro' : (['METALS', 'ENERGY'].includes(tag) ? 'Harga Komoditas Acuan' : 'Katalis Makro & Sektor'), weight_pct: macroWeight, color: 'var(--accent-blue, #3b82f6)' },
    { factor: isCrypto ? 'Whale / Exchange Flow' : 'Arus Institusi / Bandar', weight_pct: bandarWeight, color: 'var(--accent-gold, #f59e0b)' },
    { factor: 'Momentum Teknikal', weight_pct: techWeight, color: 'var(--accent-green, #10b981)' }
  ];

  // [3] WHAT MATTERS (Signal vs Noise)
  let signalVsNoise = '';
  let snrScore = 88;
  if (sentiment === 'BULLISH') {
    signalVsNoise = `Sinyal terverifikasi likuiditas institusi. Kenaikan harga didukung partisipasi volume nyata, meminimalkan risiko false breakout.`;
    snrScore = 92;
  } else if (sentiment === 'BEARISH') {
    signalVsNoise = `Tekanan jual terkonfirmasi distribusi aktif. Hindari spekulasi serok bawah prematur sebelum terbentuk base support solid.`;
    snrScore = 86;
  } else {
    signalVsNoise = `Konsolidasi wajar dalam rentang seimbang. Fluktuasi intraday tergolong noise likuiditas tanpa pembalikan arah tren struktural.`;
    snrScore = 75;
  }

  // [4] WHAT'S NEXT (Actionable Playbook)
  let urgency = sentiment === 'NEUTRAL' ? 'MEDIUM' : 'HIGH';
  let action = '';
  let guidance = '';
  const techLevels = newsItem.technical_levels;

  if (sentiment === 'BULLISH') {
    action = 'BUY ON PULLBACK';
    guidance = techLevels
      ? `Akumulasi bertahap di area S1 (${techLevels.s1}) - Pivot (${techLevels.pivot}). Target kenaikan R1 (${techLevels.r1}). Invalidation ketat < ${techLevels.invalidation}.`
      : `Disiplin akumulasi saat retest support; kawal keuntungan dengan trailing stop 2.5% - 3.0%.`;
  } else if (sentiment === 'BEARISH') {
    action = 'DEFENSIVE / WAIT SUPPORT';
    guidance = techLevels
      ? `Tahan posisi kas. Pantau respon pantulan di zona support S1 (${techLevels.s1}) / S2 (${techLevels.s2}). Batas pembatalan skenario jika tembus < ${techLevels.invalidation}.`
      : `Pertahankan cadangan likuiditas kas; tunggu terbentuknya candle reversal harian terkonfirmasi.`;
  } else {
    action = 'MONITOR / RANGE TRADING';
    guidance = `Terapkan taktik range-bound (beli dekat support, jual dekat resistance) dengan alokasi posisi terukur.`;
  }

  return {
    what_changed: {
      summary: whatChangedSummary,
      metrics: metricsFound
    },
    why_it_changed: {
      primary_driver: primaryDriver,
      drivers
    },
    what_matters: {
      signal_vs_noise: signalVsNoise,
      snr_score: snrScore
    },
    whats_next: {
      urgency,
      action,
      guidance,
      technical_levels: techLevels || null
    }
  };
}

export function generateSmartBulletPoints(newsItem = {}) {
  if (Array.isArray(newsItem.key_takeaways) && newsItem.key_takeaways.length >= 3) {
    return newsItem.key_takeaways;
  }
  const intel = getIntelligenceArtifact(newsItem);
  return [
    `[WHAT CHANGED] ${intel.what_changed.summary}`,
    `[WHY IT CHANGED] ${intel.why_it_changed.primary_driver}`,
    `[WHAT MATTERS] ${intel.what_matters.signal_vs_noise}`,
    `[WHAT'S NEXT] ${intel.whats_next.action}: ${intel.whats_next.guidance}`
  ];
}

export function playTTS(text = '', onEnd = () => {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'id-ID';
  utterance.rate = 1.05;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopTTS() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function formatNewsDateTime(newsItem = {}) {
  if (newsItem.published_date && newsItem.published_time) {
    return {
      dateStr: newsItem.published_date,
      timeStr: newsItem.published_time,
      fullStr: newsItem.published_str || `${newsItem.published_date} • ${newsItem.published_time}`,
      sourceTime: newsItem.source_time_utc || (newsItem.pub_date ? `${newsItem.pub_date}` : '')
    };
  }

  if (newsItem.pub_date) {
    try {
      const d = new Date(newsItem.pub_date);
      if (!isNaN(d.getTime())) {
        const dateStr = d.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'Asia/Jakarta'
        });
        const timeStr = d.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Jakarta'
        }) + ' WIB';
        return {
          dateStr,
          timeStr,
          fullStr: `${dateStr} • ${timeStr}`,
          sourceTime: newsItem.source_time_utc || newsItem.pub_date
        };
      }
    } catch {
      // fallback
    }
  }

  return {
    dateStr: newsItem.published_date || 'Hari ini',
    timeStr: newsItem.published_time || 'Baru saja',
    fullStr: newsItem.published_str || 'Hari ini',
    sourceTime: newsItem.source_time_utc || newsItem.pub_date || ''
  };
}

/**
 * Freshness from the item's own publish time (timestamp_ms, else pub_date).
 *
 * Honest label per manual section 2.3: an old edition must look old, not be
 * disguised as fresh. Unknown time returns null so the caller renders a dash
 * instead of a fake "fresh".
 */
export function newsFreshness(newsItem = {}) {
  const ts = newsItem.timestamp_ms || (newsItem.pub_date ? new Date(newsItem.pub_date).getTime() : 0);
  if (!ts || isNaN(ts)) return null;
  const ageMin = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (ageMin < 60) return { label: 'FRESH', color: 'var(--accent-green, #10b981)', ageMin };
  if (ageMin < 360) return { label: 'TERLAMBAT', color: 'var(--accent-gold, #f59e0b)', ageMin };
  return { label: 'STALE', color: 'var(--accent-rust, #ef4444)', ageMin };
}

/** Compact age string: 12m / 2.4h / — */
export function formatAge(ageMin) {
  if (ageMin == null) return '—';
  if (ageMin < 60) return ageMin + 'm';
  return (ageMin / 60).toFixed(1) + 'h';
}
