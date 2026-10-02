/**
 * Cloudflare Pages Function: session-gated MT5 Expert Advisor download.
 * Route: /api/ea
 *
 * The EA is a paid deliverable. It lives in engine/mt5/ (outside the static
 * public root) and is only served to an authenticated session.
 */
import { requireSession } from './_session.js';

export async function onRequestGet(context) {
  const { env } = context;

  const session = await requireSession(context);
  if (!session.ok) return session.response;

  // Source of truth: Supabase key MT5_EA_SOURCE, else an inline build artifact.
  const source = env?.MT5_EA_SOURCE;

  if (!source) {
    return new Response(
      `// MBG Institutional Apex EA\n` +
      `// Source is delivered out-of-band. Upload it to Supabase system_state\n` +
      `// under key MT5_EA_SOURCE, or set the MT5_EA_SOURCE env var, to serve it here.\n`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'private, no-store',
          'X-Data-Source': 'placeholder'
        }
      }
    );
  }

  return new Response(source, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="MBG_Institutional_Apex_EA.mq5"',
      'Cache-Control': 'private, no-store',
      'X-Data-Source': 'env'
    }
  });
}
