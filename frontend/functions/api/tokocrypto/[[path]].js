/**
 * Cloudflare Pages Function: Tokocrypto Reverse Proxy (Hardened)
 * Route: /api/tokocrypto/*
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
  const target = `https://www.tokocrypto.com${url.pathname.replace(/^\/api\/tokocrypto/, '')}${url.search}`;
  
  try {
    const upstream = await fetch(target, {
      headers: { 'User-Agent': 'MBG-Trading-Cockpit/2.0' }
    });
    const allowedOrigin = getAllowedOrigin(request);

    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Cache-Control': 'public, max-age=5, s-maxage=10'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Tokocrypto proxy failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
