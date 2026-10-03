import { requireAccess } from './_session.js';
import { fetchSystemState, jsonResponse } from './_private.js';
export async function onRequestGet(context) {
  const access = await requireAccess(context, 'ea.download');
  if (!access.ok) return access.response;
  try {
    const source = context.env.MT5_EA_SOURCE || (await fetchSystemState(context.env, 'MT5_EA_SOURCE'))?.val;
    if (typeof source !== 'string' || !source.trim()) return jsonResponse({ error: 'EA source unavailable' }, 503);
    return new Response(source, { headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="MBG_Institutional_Apex_EA.mq5"',
      'Cache-Control': 'private, no-store', Vary: 'Cookie',
    } });
  } catch { return jsonResponse({ error: 'EA service unavailable' }, 503); }
}
