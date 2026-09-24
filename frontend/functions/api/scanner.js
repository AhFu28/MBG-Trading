/**
 * Cloudflare Pages Function: TradingView Scanner Reverse Proxy (H-06)
 * Route: /api/scanner
 * 
 * Proxies scanner requests to TradingView with edge caching (10s)
 * shields client browsers from rate limits, CORS issues, and hides direct IP.
 */
export async function onRequestPost({ request }) {
  try {
    const url = new URL(request.url);
    const market = url.searchParams.get('market') || 'indonesia';
    const body = await request.text();

    const tvUrl = `https://scanner.tradingview.com/${encodeURIComponent(market)}/scan`;
    const tvResponse = await fetch(tvUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: body
    });

    if (!tvResponse.ok) {
      return new Response(tvResponse.body, {
        status: tvResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await tvResponse.text();
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10, s-maxage=15',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Scanner proxy failed', details: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
