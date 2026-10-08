/**
 * Cloudflare Pages Function: session-gated MT5 Expert Advisor download.
 * Route: /api/ea
 *
 * The EA is a paid deliverable. It lives in engine/mt5/ (outside the static
 * public root) and is only served to an authenticated session.
 */
import { requireSession } from './_session.js';
import eaInline from './_ea_inline.txt';

export async function onRequestGet(context) {
  const { env } = context;

  const session = await requireSession(context);
  if (!session.ok) return session.response;

  // Priority: the owner env override, else the build-inline copy of
  // engine/mt5/MBG_Institutional_Apex_EA.mq5 (regenerate the .txt copy when the
  // EA changes). The EA source is already public in engine/mt5/ - this endpoint
  // exists so a session-gated download path exists, not to add secrecy.
  const source = env?.MT5_EA_SOURCE || eaInline;

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
      'X-Data-Source': env?.MT5_EA_SOURCE ? 'env' : 'inline-build'
    }
  });
}
