/**
 * Minimal JWT sign/verify using the Web Crypto API.
 *
 * Extracted from api/auth.js so the account endpoints and the legacy cockpit
 * password gate share ONE implementation. Two copies of crypto code is how
 * subtle divergence bugs and security holes appear.
 *
 * Edge-compatible: no Node.js dependencies.
 */

function base64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlDecode(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return atob(s);
}

async function hmacKey(secret, usages) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages,
  );
}

export async function signJWT(payload, secret) {
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64urlEncode(JSON.stringify(payload));
  const data = new TextEncoder().encode(`${header}.${body}`);
  const key = await hmacKey(secret, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return `${header}.${body}.${base64url(sig)}`;
}

export async function verifyJWT(token, secret) {
  try {
    const [headerB64, bodyB64, sigB64] = String(token || '').split('.');
    if (!headerB64 || !bodyB64 || !sigB64) return null;

    const data = new TextEncoder().encode(`${headerB64}.${bodyB64}`);
    const key = await hmacKey(secret, ['verify']);

    const sigStr = base64urlDecode(sigB64);
    const sigBytes = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) sigBytes[i] = sigStr.charCodeAt(i);

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, data);
    if (!valid) return null;

    return JSON.parse(base64urlDecode(bodyB64));
  } catch {
    return null;
  }
}

/** SHA-256 hex digest — used for the cockpit password, never for user accounts. */
export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
