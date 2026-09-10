// Smart Heuristic Micro-NLP & Utilities for MBG News Wire & Stockbit Snips

const KNOWN_TICKERS = [
  'BBCA','BBRI','BMRI','BBNI','ANTM','BRMS','MDKA','MEDC','ENRG','ADRO',
  'ASII','TLKM','BYAN','GOTO','AMMN','BREN','CUAN','PTBA','PGAS','ITMG',
  'UNTR','ICBP','INDF','CPIN','KLBF','ACES','SMRA','BSDE','CTRA','GIAA',
  'TPIA','PTRO','ADMR','TOWR','SMGR','INDY','BELI','BUMI','VKTR'
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
  return Array.from(found);
}

export function inferSentiment(text = '') {
  const upper = text.toUpperCase();
  const bullWords = ['MENGUAT', 'NAIK', 'REBOUND', 'SURGE', 'BULL', 'ARA', 'AKUMULASI', 'NET BUY', 'LABA', 'DIVIDEN', 'MELONJAK', 'MELESAT', 'CUAN', 'DIINCAR'];
  const bearWords = ['MELEMAH', 'TURUN', 'TERKOREKSI', 'ANJLOK', 'BEAR', 'ARB', 'NET SELL', 'TERTEKAN', 'JATUH', 'RUGI', 'AMBLES', 'DISTRIBUSI'];

  const isBull = bullWords.some(w => upper.includes(w));
  const isBear = bearWords.some(w => upper.includes(w));

  if (isBull && !isBear) return 'BULLISH';
  if (isBear && !isBull) return 'BEARISH';
  return 'NEUTRAL';
}

export function generateSmartBulletPoints(newsItem = {}) {
  if (Array.isArray(newsItem.key_takeaways) && newsItem.key_takeaways.length > 0) {
    return newsItem.key_takeaways;
  }

  const { title = '', summary = '', tag = 'IHSG' } = newsItem;
  const combined = `${title} ${summary}`;
  const sentiment = inferSentiment(combined);
  const tickers = extractTickers(combined);
  const bullets = [];

  // Poin 1: Inti Peristiwa & Metrik
  const metricMatch = combined.match(/(\d+[.,]?\d*%)|(Rp\s*\d+[.,]?\d*(\s*(triliun|miliar|juta))?)|(US\$\s*\d+[.,]?\d*(\s*(miliar|juta))?)|(level\s*[\d.,]+)/gi);
  const metricStr = metricMatch && metricMatch.length > 0 ? ` Terpantau metrik: ${Array.from(new Set(metricMatch)).slice(0, 2).join(' · ')}.` : '';

  if (sentiment === 'BULLISH') {
    bullets.push(`Katalis positif mendorong sentimen pasar dengan indikasi akumulasi pada instrumen terkait.${metricStr}`);
  } else if (sentiment === 'BEARISH') {
    bullets.push(`Tekanan jual dan sentimen kehati-hatian membayangi perdagangan jangka pendek.${metricStr}`);
  } else {
    bullets.push(`Pergerakan pasar terpantau konsolidatif menjelang konfirmasi katalis makro dan sektoral.${metricStr}`);
  }

  // Poin 2: Sektor & Emiten Terdampak
  if (tickers.length > 0) {
    bullets.push(`Fokus pasar tertuju pada pergerakan saham ${tickers.map(t => '$' + t).join(', ')} dengan dinamika volume aktif.`);
  } else {
    bullets.push(`Pengaruh sentimen langsung menyasar klaster sektor ${tag || 'IHSG'} dalam rentang pergerakan wajar.`);
  }

  // Poin 3: Panduan & Rekomendasi Trader
  if (sentiment === 'BULLISH') {
    bullets.push(`Disarankan mengantisipasi momentum lanjutan dengan tetap disiplin memasang trailing stop 3%.`);
  } else if (sentiment === 'BEARISH') {
    bullets.push(`Hindari aksi beli agresif; tunggu konfirmasi sinyal reversal candle pada level support kuat.`);
  } else {
    bullets.push(`Cermati volume transaksi dan arah rotasi likuiditas saat sesi perdagangan berlangsung.`);
  }

  return bullets;
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
