// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestGet } from '../../../functions/api/news.js';

/**
 * THE NEWS ENDPOINT MUST NOT FABRICATE ATTRIBUTION OR TRACK ITS READERS.
 *
 * Two behaviours are pinned here, both found by measuring real feeds:
 *
 * 1. Bing wraps every RSS link in apiclick.aspx, a redirect that carries the
 *    real article URL in a url= parameter. Unwrapped, the reader goes straight
 *    to the publisher. Google News links are left as-is on purpose: their
 *    target is encoded opaquely, and guessing would risk a fabricated link.
 *
 * 2. When a feed names no publisher, the old fallback stamped every article
 *    with the product's own brand ("Warta Pasar"), so a Forbes piece was
 *    attributed to us. The hostname of the real link is the honest label, and
 *    "Sumber tidak tercatat" when even that cannot be parsed.
 */
const RSS = "<?xml version=\"1.0\"?><rss version=\"2.0\"><channel><title>t</title>\r\n<item><title>IHSG ambles 2,16 persen</title>\r\n<link>http://www.bing.com/news/apiclick.aspx?ref=FexRss&url=https%3a%2f%2fwww.idnfinancials.com%2fnews%2f12345%2fihsg-drops</link>\r\n<pubDate>Wed, 14 Oct 2026 05:49:00 GMT</pubDate></item>\r\n<item><title>Rupiah melemah tipis</title>\r\n<source>Kontan</source>\r\n<link>https://news.google.com/rss/articles/CBMioAFBVV95cUxQc3JONzdQWk1sTkM</link>\r\n<pubDate>Wed, 14 Oct 2026 06:00:00 GMT</pubDate></item>\r\n<item><title>Berita tanpa penerbit</title>\r\n<link>bukan-sebuah-url</link>\r\n<pubDate>Wed, 14 Oct 2026 06:30:00 GMT</pubDate></item>\r\n</channel></rss>";

function stubFetch() {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(RSS, { status: 200 })));
}

async function call() {
  const res = await onRequestGet({ request: new Request("https://x/api/news?category=ALL"), env: {} });
  return { status: res.status, body: await res.json() };
}

describe('news endpoint — links and attribution', () => {
  beforeEach(() => stubFetch());
  afterEach(() => vi.unstubAllGlobals());

  it('unwraps the Bing click tracker to the real publisher URL', async () => {
    const { status, body } = await call();
    expect(status).toBe(200);
    expect(body.articles[0].link).toBe('https://www.idnfinancials.com/news/12345/ihsg-drops');
  });

  it('derives the source from the real link instead of branding it', async () => {
    const { body } = await call();
    expect(body.articles[0].source).toBe('idnfinancials.com');
  });

  it('leaves Google News links alone and keeps the feed own source', async () => {
    const { body } = await call();
    const second = body.articles[1];
    expect(second.link).toMatch(/^https:\/\/news\.google\.com\/rss\/articles\//);
    expect(second.source).toBe('Kontan');
  });

  it('admits it cannot attribute when even the link is unusable', async () => {
    const { body } = await call();
    expect(body.articles[2].source).toBe('Sumber tidak tercatat');
  });
});
