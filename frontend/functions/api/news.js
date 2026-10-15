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

/*
 * Bing wraps its RSS links in a click tracker: the real article URL is the url=
 * query parameter, percent-encoded. Unwrapping sends the reader straight to the
 * publisher instead of through Bing's redirect, and lets the hostname serve as
 * an honest source label when the feed names no publisher.
 *
 * Google News links are deliberately left alone: their /rss/articles/CBMi...
 * form encodes the target opaquely, and guessing at it risks fabricating a link
 * — which is worse than a working redirect.
 */
function unwrapLink(link) {
  if (!link || link.indexOf('bing.com/news/apiclick.aspx') === -1) return link;
  try {
    const parsed = new URL(link);
    const real = parsed.searchParams.get('url');
    if (!real) return link;
    let target = decodeURIComponent(real);
    // Bing sometimes double-encodes; a target that still looks encoded gets one more pass.
    if (/%3a%2f%2f/i.test(target) || /%2f/i.test(target)) {
      try { target = decodeURIComponent(target); } catch (e) { /* keep the first pass */ }
    }
    return /^https?:\/\//i.test(target) ? target : link;
  } catch (e) {
    return link;
  }
}

function sourceFromLink(link) {
  try {
    return new URL(link).hostname.replace(/^www\./, '') || '';
  } catch (e) {
    return '';
  }
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

  /*
   * TWO INDEPENDENT ENGINES, RACED (P0-1, revised 2026-10-15).
   *
   * Measured evidence: news.google.com answers in 0.7-2.7 s from a residential
   * connection but did not answer within 9 s from Cloudflare's edge, TWICE — the
   * pattern of Google throttling datacentre egress ranges. A single-source
   * endpoint therefore had a single point of failure that no retry could fix:
   * the retry simply ran into the same wall a second time.
   *
   * Bing News is the second engine, measured working from the same machine
   * (11-12 items). It refuses the OR operator (zero items when it is present),
   * so its query is the same terms with OR stripped; quoted phrases and plain
   * multi-word queries both work.
   *
   * The first USABLE response wins, so a slow Google can never hold this
   * endpoint hostage: whichever engine answers first serves the request, and
   * the response says which one did.
   */
  const qBing = query.split('+OR+').join('+');
  const SOURCES = [
    { id: 'google-news', url: 'https://news.google.com/rss/search?q=' + query + '+when:1d&hl=id&gl=ID&ceid=ID:id' },
    { id: 'bing-news', url: 'https://www.bing.com/news/search?q=' + qBing + '&format=RSS' },
  ];

  async function fetchRssOnce(url, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      });
      if (!resp.ok) {
        throw new Error('Upstream returned ' + resp.status);
      }
      return await resp.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  try {
    /*
     * Two ROUNDS of parallel attempts (initial + 1 retry).
     *
     * An EMPTY body is not a success. The first version of the retry loop
     * repeated only while `xml === null`, so a whitespace-only upstream response
     * ended the loop and was reported as a healthy feed with zero articles —
     * exactly the silent downgrade this incident is about. A usable feed must
     * contain at least one <item>.
     */
    const RSS_TIMEOUT_MS = 9000;
    const isUsable = (body) => typeof body === 'string' && /<item>[\s\S]*?<\/item>/.test(body);

    async function attempt(source) {
      const body = await fetchRssOnce(source.url, RSS_TIMEOUT_MS);
      if (!isUsable(body)) {
        throw new Error(source.id + ': feed answered but contains no <item>');
      }
      return { source: source.id, body };
    }

    let xml = null;
    let engine = null;
    let lastError = null;
    for (let round = 1; round <= 2 && !xml; round++) {
      try {
        // Promise.any: the first usable feed settles the round, so a hanging
        // engine cannot add its own timeout to the user's wait.
        const winner = await Promise.any(SOURCES.map(attempt));
        xml = winner.body;
        engine = winner.source;
      } catch (agg) {
        lastError = agg && agg.errors && agg.errors[0] ? agg.errors[0] : agg;
      }
    }
    if (!isUsable(xml)) {
      throw lastError || new Error('No live RSS source returned usable items');
    }
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    const articles = [];

    for (let i = 0; i < Math.min(itemMatches.length, limit); i++) {
      const itemXml = itemMatches[i];

      let rawTitle = (itemXml.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
      let link = (itemXml.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
      let pubDate = (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
      let sourceName = (itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || '';

      rawTitle = cleanHtml(rawTitle);
      link = unwrapLink(cleanHtml(link));
      pubDate = cleanHtml(pubDate);
      sourceName = cleanHtml(sourceName);

      // Separate title from publisher suffix if source was not in <source> tag
      let title = rawTitle;
      if (!sourceName && rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ');
        sourceName = parts.pop().trim();
        title = parts.join(' - ').trim();
      }
      // No invented attribution: when the feed names no publisher, the link
      // hostname is the honest label — and 'tidak tercatat' when even that fails.
      if (!sourceName) sourceName = sourceFromLink(link) || 'Sumber tidak tercatat';

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
      source_engine: engine,
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
