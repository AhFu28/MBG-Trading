/**
 * Client for the account endpoints.
 *
 * The browser never decides its own tier — it only ASKS. Every call here hits a
 * server endpoint that reads the tier from the database. If a user edits
 * JavaScript to claim Pro, the server still returns free and the paid desks
 * stay locked.
 *
 * All requests use credentials: 'same-origin' so the HttpOnly session cookie is
 * sent. The cookie is never readable from JavaScript, so an XSS bug cannot
 * steal a session.
 */

const BASE = '/api/account';

async function call(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const message = body?.error || `Permintaan gagal (${res.status}).`;
    const err = new Error(message);
    err.status = res.status;
    err.hint = body?.hint || null;
    err.detail = body?.detail || null;
    throw err;
  }
  return body;
}

/**
 * Ask the server who we are.
 * Always resolves — an unreachable API means "guest", never an exception that
 * would leave the app stuck on a spinner.
 */
export async function fetchMe() {
  try {
    const body = await call('/me', { method: 'GET' });
    return {
      authenticated: !!body?.authenticated,
      tier: body?.tier || 'guest',
      tierLabel: body?.tierLabel || null,
      isPro: !!body?.isPro,
      email: body?.email || null,
      displayName: body?.displayName || null,
      expiresAt: body?.expiresAt || null,
      daysLeft: body?.daysLeft ?? null,
      expired: !!body?.expired,
      configured: body?.configured !== false,
    };
  } catch {
    // Network failure or a 5xx. Treat as guest so the landing page still works.
    return { authenticated: false, tier: 'guest', isPro: false, configured: false, offline: true };
  }
}

export async function signUp({ email, password, displayName }) {
  return call('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
}

export async function logIn({ email, password }) {
  return call('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logOut() {
  try {
    return await call('/logout', { method: 'POST' });
  } catch {
    // Logging out locally must always succeed from the user's point of view.
    return { ok: true };
  }
}

/**
 * Owner access: the original shared cockpit password.
 * Kept so the owner is never locked out of their own system by an account
 * database problem. It grants Pro and is unaffected by subscriptions.
 */
export async function ownerLogin(password) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(body?.error || 'Kata sandi salah.');
    err.status = res.status;
    throw err;
  }
  return body;
}
