/**
 * GET /api/account/me — who am I, and what am I entitled to?
 *
 * This is the single source of truth for entitlement in the browser. The tier
 * is read from the database under the user's own RLS, then recalculated against
 * expires_at so a lapsed subscription loses Pro immediately.
 *
 * The client must never be trusted to know its own tier — it may only ask.
 */

import {
  config, notConfigured, json, readSession, fetchProfile, resolveEntitlement,
} from './_shared.js';

export async function onRequestGet(context) {
  const { env, request } = context;

  const cfg = config(env);
  if (!cfg.ready) {
    // Not configured is NOT an error for the visitor: they simply have no
    // account yet. Report guest so the landing page still renders.
    return json({ authenticated: false, tier: 'guest', configured: false }, 200);
  }

  const session = await readSession(request, env);
  if (!session?.accessToken) {
    return json({ authenticated: false, tier: 'guest', configured: true }, 200);
  }

  const profile = await fetchProfile(cfg, session.accessToken);

  if (!profile) {
    // Session valid but no profile row (e.g. the schema's trigger was added
    // after the account was created). Treat as free rather than erroring.
    return json({
      authenticated: true,
      configured: true,
      tier: 'free',
      tierLabel: 'Free',
      isPro: false,
      email: session.email || null,
      profileMissing: true,
    }, 200);
  }

  const entitlement = resolveEntitlement(profile);

  return json({
    authenticated: true,
    configured: true,
    ...entitlement,
  }, 200);
}
