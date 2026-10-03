import { requireAccess } from './_session.js';
import { jsonResponse, sameOrigin } from './_private.js';
const MARKETS = new Set(['indonesia', 'america', 'forex', 'cfd']);
const MAX_BODY_BYTES = 64 * 1024;
// Isolate-local throttle, supplemented by deployment-level rate rules.
const scans = new Map();
function rateAllowed(ip) {
  const now = Date.now();
  for (const [key, entry] of scans) if (entry.until <= now) scans.delete(key);
  const entry = scans.get(ip) || { count: 0, until: now + 60000 };
  entry.count++;
  scans.set(ip, entry);
  return entry.count <= 30;
}
export async function onRequestPost(context) {
  const { request } = context;
  if (!sameOrigin(request)) return jsonResponse({ error: 'Origin not allowed' }, 403);
  const market = new URL(request.url).searchParams.get('market') || 'indonesia';
  if (!MARKETS.has(market)) return jsonResponse({ error: 'Market not allowed' }, 400);
  const access = await requireAccess(context, `scanner.${market}`);
  if (!access.ok) return access.response;
  if (!rateAllowed(request.headers.get('CF-Connecting-IP') || 'unknown')) return jsonResponse({ error: 'Rate limit exceeded' }, 429, { 'Retry-After': '60' });
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return jsonResponse({ error: 'Payload too large' }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return jsonResponse({ error: 'Invalid scanner request' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonResponse({ error: 'Invalid scanner request' }, 400);
    const upstream = await fetch(`https://scanner.tradingview.com/${market}/scan`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw,
      signal: AbortSignal.timeout(8000), cache: 'no-store',
    });
    if (!upstream.ok) return jsonResponse({ error: 'Scanner upstream unavailable' }, 502);
    return jsonResponse(await upstream.json());
  } catch { return jsonResponse({ error: 'Scanner service unavailable' }, 502); }
}
export async function onRequestOptions({ request }) {
  if (!sameOrigin(request)) return jsonResponse({ error: 'Origin not allowed' }, 403);
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'private, no-store', Allow: 'POST, OPTIONS' } });
}
