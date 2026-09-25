/**
 * Cloudflare Pages Function: TradingView Scanner Reverse Proxy (Hardened)
 * Route: /api/scanner
 * 
 * Proxies scanner requests to TradingView with edge caching (10s)
 * Strict CORS origin protection prevents unauthorized third-party relay abuse.
 */

function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  if (
    origin.includes('mbg-trading.pages.dev') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  ) {
    return origin;
  }
  return 'https://mbg-trading.pages.dev';
}

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
    const allowedOrigin = getAllowedOrigin(request);

    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10, s-maxage=15',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Scanner proxy failed', details: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions({ request }) {
  const allowedOrigin = getAllowedOrigin(request);
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
