/**
 * Cloudflare Pages Function: Pump.fun Edge Reverse Proxy
 * Route: /api/pumpfun/*
 *
 * Problem Solved:
 * pump.fun's Cloudflare WAF allows `Origin: http://localhost:3000` (dev),
 * but blocks third-party production origins like `https://mbg-trading.pages.dev` with HTTP 403 Forbidden.
 *
 * This Edge Function fetches server-side without the client Origin header,
 * caching the response briefly to protect rate limits and returning clean CORS headers.
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

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const subpath = url.pathname.replace(/^\/api\/pumpfun/, '');
  const target = `https://frontend-api-v3.pump.fun${subpath}${url.search}`;

  try {
    const upstream = await fetch(target, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const allowedOrigin = getAllowedOrigin(request);

    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Cache-Control': 'public, max-age=10, s-maxage=20'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Pump.fun edge proxy failed', details: err?.message }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': getAllowedOrigin(request)
      }
    });
  }
}
