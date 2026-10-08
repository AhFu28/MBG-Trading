/**
 * Cloudflare Pages Function: Research Desk catalog + paper (P-8 P0c).
 * Route: /api/research/reports            -> the catalog (one row per paper)
 * Route: /api/research/reports?slug=...   -> the full paper for the reader
 *
 * Session-gated. Fallback chain (additive migration, spec 6.3):
 *   1. Supabase system_state key RESEARCH_REPORTS (the editorial pipeline
 *      publishes here once P0d lands),
 *   2. the build-inline sample paper (docs/research/IDX_STRATEGY_STUDY_SAMPLE.json,
 *      always available) with an honest X-Data-Source header so a pre-schema
 *      pilot never pretends to be a live catalog.
 */
import { requireSession, fetchSystemState } from '../_session.js';
import samplePaper from '../../../../docs/research/IDX_STRATEGY_STUDY_SAMPLE.json';

function catalogFrom(paper) {
  return [{
    slug: paper.report?.slug,
    title: paper.metadata?.title,
    report_type: paper.report?.report_type,
    state: paper.report?.state,
    language: paper.report?.language,
    data_cutoff: paper.metadata?.data_cutoff,
    reviewer: paper.metadata?.reviewer,
    edition_no: paper.report?.edition_no,
  }];
}

export async function onRequestGet(context) {
  const session = await requireSession(context);
  if (!session.ok) return session.response;

  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug');

  const cached = await fetchSystemState(session.supabaseUrl, session.supabaseKey, 'RESEARCH_REPORTS');
  if (cached) {
    const val = cached.val;
    const list = Array.isArray(val) ? val : catalogFrom(val);
    if (slug) {
      const hit = list.find((r) => r.slug === slug);
      if (!hit) return new Response(JSON.stringify({ error: 'Report tidak ditemukan' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify(hit), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=60', 'X-Data-Source': 'supabase-live' }
      });
    }
    return new Response(JSON.stringify(list), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=60', 'X-Data-Source': 'supabase-live' }
    });
  }

  // Pre-schema: the bundled sample paper, honestly labelled.
  if (slug && slug !== samplePaper.report?.slug) {
    return new Response(JSON.stringify({ error: 'Report tidak ditemukan' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify(slug ? samplePaper : catalogFrom(samplePaper)), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', 'X-Data-Source': 'sample-fallback' }
  });
}
