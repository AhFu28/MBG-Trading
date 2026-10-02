/**
 * Cloudflare Pages Function: session-gated research archive.
 * Route: /api/research-archive
 *
 * Replaces the public /data/research_archive.json static file.
 */
import { requireSession, fetchSystemState } from './_session.js';

export async function onRequestGet(context) {
  const { request } = context;

  const session = await requireSession(context);
  if (!session.ok) return session.response;

  const cached = await fetchSystemState(session.supabaseUrl, session.supabaseKey, 'RESEARCH_ARCHIVE');
  if (cached) {
    return new Response(JSON.stringify(cached.val), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60',
        'X-Data-Source': 'supabase-live'
      }
    });
  }

  const url = new URL(request.url);
  const bundleResp = await fetch(`${url.origin}/api/data`);
  if (bundleResp.ok) {
    const bundle = await bundleResp.json();
    if (Array.isArray(bundle?.research_archive)) {
      return new Response(JSON.stringify(bundle.research_archive), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=120',
          'X-Data-Source': 'bundle-research-archive'
        }
      });
    }
  }

  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'X-Data-Source': 'empty' }
  });
}
