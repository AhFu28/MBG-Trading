/**
 * Cloudflare Pages Function: session-gated arena state.
 * Route: /api/arena-state
 *
 * Replaces the public /data/latest_arena_state.json static file, which anyone
 * could download without authenticating.
 */
import { requireSession, fetchSystemState } from './_session.js';

export async function onRequestGet(context) {
  const { request } = context;

  const session = await requireSession(context);
  if (!session.ok) return session.response;

  const cached = await fetchSystemState(session.supabaseUrl, session.supabaseKey, 'LATEST_ARENA_STATE');
  if (cached) {
    return new Response(JSON.stringify(cached.val), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=15',
        'X-Data-Source': 'supabase-live'
      }
    });
  }

  // Fall back to the private bundle read through the same gated route.
  const url = new URL(request.url);
  const bundleResp = await fetch(`${url.origin}/api/data`);
  if (bundleResp.ok) {
    const bundle = await bundleResp.json();
    if (bundle?.arena_state) {
      return new Response(JSON.stringify(bundle.arena_state), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=30',
          'X-Data-Source': 'bundle-arena-state'
        }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Arena state unavailable' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}
