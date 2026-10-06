/**
 * Supabase project coordinates, committed as a FALLBACK.
 *
 * WHY COMMITTING A KEY HERE IS SAFE
 * ---------------------------------
 * This is the PUBLISHABLE key (`sb_publishable_...`). Supabase's own docs say it
 * is designed to ship in client code:
 *
 *   "Publishable keys identify the public components of your application...
 *    Safe to expose online: web page, mobile or desktop app, GitHub actions,
 *    CLIs, source code."
 *
 * It carries the same low privileges as the legacy `anon` key. What it can reach
 * is decided entirely by Row Level Security, which is why the schema in
 * supabase/schema.sql turns RLS on for every table.
 *
 * WHAT MUST NEVER GO IN THIS FILE
 * -------------------------------
 * The SECRET key (`sb_secret_...`, formerly `service_role`). It bypasses RLS and
 * would expose every customer's row. Same for the database password and any
 * Personal Access Token.
 *
 * WHY A FALLBACK AT ALL
 * ---------------------
 * The Cloudflare Pages environment variables are the normal path and still take
 * priority, so the owner can rotate the key without a code change. This exists so
 * the site works before those variables are set — the alternative was an account
 * system that returned 503 to every visitor while the credentials sat unused.
 *
 * Note that this does nothing for JWT_SECRET. That one must be set in the
 * environment, because the session signing key is not a value that can be
 * published — deriving it from repository constants is what allowed a forged
 * session to be accepted in production on 2026-10-06.
 */

/** Project ref is the subdomain: https://<ref>.supabase.co */
export const PROJECT_REF = 'wxmbqfjdyfqqjykkrkpj';

export const FALLBACK_SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

export const FALLBACK_SUPABASE_KEY = 'sb_publishable_9uPUXh0B8QVhOyeJC9TgFw_6Ahs-Hq6';

/**
 * Resolve the Supabase connection details.
 *
 * Environment wins. A rotated key or a moved project takes effect on the next
 * deploy without touching this file.
 *
 * @param {Record<string, string>} env  Cloudflare Pages environment
 */
export function resolveSupabaseConfig(env = {}) {
  const url = String(
    env.SUPABASE_URL || FALLBACK_SUPABASE_URL || ''
  ).replace(/\/+$/, '');

  // Accepts, in order: the explicit anon name, the newer publishable name, the
  // generic name this project used first, then the committed fallback.
  const key =
    env.SUPABASE_ANON_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_KEY ||
    FALLBACK_SUPABASE_KEY ||
    '';

  return { url, key, ready: Boolean(url && key) };
}
