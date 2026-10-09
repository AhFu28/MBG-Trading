/**
 * Cloudflare Pages Function: Live Financial News RSS Ingestion Engine
 *
 * Provides real-time financial news updated every minute/second from live RSS feeds
 * (Google News Indonesia & Financial Wires: IHSG, Saham, Kripto, Makro).
 *
 * Cache-Control: public, max-age=60 (edge cached for 60 seconds).
 */

const KNOWN_TICKERS = [
  'IHSG', 'BBCA', 'BBRI', 'BMRI', 'BBNI', 'ANTM', 'BRMS', 'MDKA', 'MEDC',
  'ENRG', 'ADRO', 'ADMR', 'BREN', 'CUAN', 'TPIA', 'PTRO', 'BYAN', 'ITMG',
  'PTBA', 'INDF', 'ICBP', 'ASII', 'UNTR', 'GOTO', 'TLKM', 'SMGR', 'BUMI',
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'NVDA', 'AAPL', 'TSLA'
];

const BULLISH_KEYWORDS = [
  'menguat', 'naik', 'melonjak', 'surges', 'rally', 'rebound', 'net buy',
  'tembus', 'melesat', 'ara', 'terangkat', 'cuan', 'akumulasi', 'laba',
  'dividen', 'bull', 'gain', 'all-time high', 'breakout', 'rekor'
];

const BEARISH_KEYWORDS = [
  'melemah', 'turun', 'anjlok', 'terkoreksi', 'tertekan', 'net sell',
  'jebol', 'tergelincir', 'ambles', 'rugi', 'terpuruk', 'distribusi',
  'drop', 'crash', 'plunge', 'slump', 'bear', 'arb', 'boncos'
];

function cleanHtml(str) {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '')
    .trim();
}

function parseWibDate(dateStr) {
  let dt = new Date(dateStr);
  if (isNaN(dt.getTime())) {
    dt = new Date();
  }

  const ts = dt.getTime();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  // Add 7 hours for WIB
  const wibTime = new Date(ts + 7 * 3600 * 1000);
  const day = String(wibTime.getUTCDate()).padStart(2, '0');
  const month = months[wibTime.getUTCMonth()];
  const year = wibTime.getUTCFullYear();
  const hours = String(wibTime.getUTCHours()).padStart(2, '0');
  const mins = String(wibTime.getUTCMinutes()).padStart(2, '0');

  const publishedDate = `${day} ${month} ${year}`;
  const publishedTime = `${hours}:${mins} WIB`;
  const publishedStr = `${publishedDate} • ${publishedTime}`;
  const dateIso = `${year}-${String(wibTime.getUTCMonth() + 1).padStart(2, '0')}-${day}`;

  return {
    timestamp_ms: ts,
    pub_date: dt.toUTCString(),
    published_str: publishedStr,
    published_date: publishedDate,
    published_time: publishedTime,
    date_iso: dateIso
  };
}

function analyzeText(title, source) {
  const lower = (title || '').toLowerCase();

  let bullScore = 0;
  for (const w of BULLISH_KEYWORDS) {
    if (lower.includes(w)) bullScore++;
  }

  let bearScore = 0;
  for (const w of BEARISH_KEYWORDS) {
    if (lower.includes(w)) bearScore++;
  }

  let sentiment = 'NEUTRAL';
  let sentimentScore = 0.0;

  if (bullScore > bearScore) {
    sentiment = 'BULLISH';
    sentimentScore = Math.min(1.0, 0.3 + bullScore * 0.2);
  } else if (bearScore > bullScore) {
    sentiment = 'BEARISH';
    sentimentScore = Math.max(-1.0, -0.3 - bearScore * 0.2);
  }

  const relatedTickers = [];
  for (const t of KNOWN_TICKERS) {
    const regex = new RegExp(`\\b${t}\\b`, 'i');
    if (regex.test(title)) {
      relatedTickers.push(t);
    }
  }

  const primaryTicker = relatedTickers[0] || (lower.includes('crypto') || lower.includes('bitcoin') ? 'BTC' : 'IHSG');

  return {
    sentiment,
    sentiment_score: sentimentScore,
    related_tickers: relatedTickers.length > 0 ? relatedTickers : [primaryTicker],
    primary_ticker: primaryTicker
  };
}

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const category = (url.searchParams.get('category') || 'ALL').toUpperCase();
  const limit = Math.min(60, parseInt(url.searchParams.get('limit') || '35', 10));

  let query = 'IHSG+OR+saham+Indonesia+OR+kripto+OR+bitcoin';
  let tag = 'MARKET';

  if (category === 'IDX') {
    query = 'IHSG+OR+"saham+Indonesia"+OR+"Bursa+Efek+Indonesia"+OR+BBCA+OR+BBRI';
    tag = 'IDX';
  } else if (category === 'CRYPTO') {
    query = 'bitcoin+OR+crypto+OR+ethereum+OR+kripto+OR+altcoin';
    tag = 'CRYPTO';
  } else if (category === 'MACRO') {
    query = '"Bank+Indonesia"+OR+"Federal+Reserve"+OR+inflasi+OR+rupiah+OR+"suku+bunga"';
    tag = 'MACRO';
  }

  const rssUrl = `https://news.google.com/rss/search?q=${query}+when:1d&hl=id&gl=ID&ceid=ID:id`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const resp = await fetch(rssUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      throw new Error(`Upstream returned ${resp.status}`);
    }

    const xml = await resp.text();
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    const articles = [];

    for (let i = 0; i < Math.min(itemMatches.length, limit); i++) {
      const itemXml = itemMatches[i];

      let rawTitle = (itemXml.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
      let link = (itemXml.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
      let pubDate = (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
      let sourceName = (itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || '';

      rawTitle = cleanHtml(rawTitle);
      link = cleanHtml(link);
      pubDate = cleanHtml(pubDate);
      sourceName = cleanHtml(sourceName);

      // Separate title from publisher suffix if source was not in <source> tag
      let title = rawTitle;
      if (!sourceName && rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ');
        sourceName = parts.pop().trim();
        title = parts.join(' - ').trim();
      }
      if (!sourceName) sourceName = 'Warta Pasar';

      const dateMeta = parseWibDate(pubDate);
      const analysis = analyzeText(title, sourceName);

      articles.push({
        id: `live-rss-${dateMeta.timestamp_ms}-${i}`,
        title: title,
        source: sourceName,
        link: link,
        pub_date: dateMeta.pub_date,
        timestamp_ms: dateMeta.timestamp_ms,
        published_str: dateMeta.published_str,
        published_date: dateMeta.published_date,
        published_time: dateMeta.published_time,
        date_iso: dateMeta.date_iso,
        tag: tag,
        stream: tag,
        sentiment: analysis.sentiment,
        sentiment_score: analysis.sentiment_score,
        related_tickers: analysis.related_tickers,
        primary_ticker: analysis.primary_ticker,
        summary: `Pantauan radar finansial terkini mengenai ${analysis.primary_ticker}: ${title}. Sentimen terukur bernada ${analysis.sentiment.toLowerCase()} terhadap dinamika volatilitas pasar saat ini.`,
        key_takeaways: [
          `Fokus berita pada ${analysis.primary_ticker} dengan nada ${analysis.sentiment}.`,
          `Sumber terpercaya: ${sourceName}. Dipublikasikan ${dateMeta.published_time}.`,
          `Perhatikan batas risiko toleransi sebelum mengambil posisi trading terkait.`
        ],
        reading_time_sec: 45
      });
    }

    return new Response(JSON.stringify({
      status: 'ok',
      last_synced: new Date().toISOString(),
      total: articles.length,
      articles
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      status: 'error',
      message: err.message || 'Failed to fetch live RSS feed',
      articles: []
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
}
