import { requireAccess } from './_session.js';
import { fetchSystemState, jsonResponse } from './_private.js';
export async function serveSnapshot(context, { feature, key, validate, bundleField }) {
  const access = await requireAccess(context, feature);
  if (!access.ok) return access.response;
  try {
    let snapshot = await fetchSystemState(context.env, key);
    // Read the same private store directly. No HTTP self-call or public fallback.
    if (!snapshot && bundleField) {
      const bundle = await fetchSystemState(context.env, 'LATEST_COCKPIT_BUNDLE');
      if (bundle && bundle.val?.[bundleField] !== undefined) snapshot = { ...bundle, val: bundle.val[bundleField] };
    }
    if (!snapshot) return jsonResponse({ error: 'Snapshot unavailable' }, 503);
    if (!validate(snapshot.val) || !Number.isFinite(Date.parse(snapshot.updatedAt))) return jsonResponse({ error: 'Invalid snapshot' }, 503);
    return jsonResponse(snapshot.val, 200, { 'X-Data-Source': 'private-store', 'X-Bundle-Updated-At': snapshot.updatedAt });
  } catch { return jsonResponse({ error: 'Private data service unavailable' }, 503); }
}
export const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
