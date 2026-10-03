import React, { useState, useEffect } from 'react';

// Non-authoritative UX/debug hint only. Authorization is decided by the server-issued,
// HttpOnly, signed session cookie; this value can never grant access on its own.
const SESSION_KEY = 'mbg_cockpit_auth';

const AUTH_ENDPOINT = '/api/auth';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24-Hour Session TTL

// TRUST01: explicit, opt-in, development-only escape hatch.
// `import.meta.env.DEV` is statically replaced with `false` by Vite in production
// builds, so this branch cannot be enabled in a production bundle. It also requires
// the operator to opt in with VITE_MBG_DEV_AUTH_BYPASS=true. There is no hardcoded
// password and no silent bypass anywhere in this component.
const DEV_AUTH_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_MBG_DEV_AUTH_BYPASS === 'true';

function writeSessionHint(expiresAt, session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ expiresAt, session: session || null }));
  } catch (_) {}
}

function clearSessionHint() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('mbg_cockpit_auth_time');
  } catch (_) {}
}

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  // M-04/TRUST01: the 24-hour session is owned by the server. A stored hint is never
  // trusted: every mount re-verifies the HttpOnly session cookie against /api/auth,
  // so writing localStorage cannot forge access.
  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      if (DEV_AUTH_BYPASS) {
        console.warn(
          '[PasswordGate] DEV_AUTH_BYPASS enabled (import.meta.env.DEV + ' +
          'VITE_MBG_DEV_AUTH_BYPASS=true). Server authentication is skipped. ' +
          'This branch can never exist in a production build.'
        );
        if (!cancelled) { setAuthed(true); setLoading(false); }
        return;
      }

      // Discard any local/forgeable hint before asking the server.
      clearSessionHint();

      try {
        const res = await fetch(AUTH_ENDPOINT, {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data && data.authenticated === true) {
            const expiresAt = Number(data.expiresAt) || Date.now() + SESSION_TTL_MS;
            writeSessionHint(expiresAt, data.session);
            if (!cancelled) { setAuthed(true); setLoading(false); }
            return;
          }
        }
      } catch (_) {
        // No auth endpoint (static host / local dev without the Pages function).
        // Fail closed: access then requires the explicit dev opt-in or a live server.
      }

      if (!cancelled) { setAuthed(false); setLoading(false); }
    }

    verifySession();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked || !input.trim()) return;

    try {
      const res = await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ password: input.trim() })
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        // Never mint a session client-side: the server must confirm it.
        if (!data || data.authenticated !== true) {
          setError('ACCESS DENIED. Server did not confirm the session.');
          setInput('');
          return;
        }
        const expiresAt = Number(data.expiresAt) || Date.now() + SESSION_TTL_MS;
        writeSessionHint(expiresAt, data.session);
        setAuthed(true);
        setError('');
      } else if (res.status === 429) {
        setLocked(true);
        setError('LOCKED. Too many failed attempts. Wait 15 minutes.');
        setTimeout(() => { setLocked(false); setAttempts(0); setError(''); }, 15 * 60 * 1000);
      } else if (res.status === 503) {
        setError('SERVER MISCONFIGURED. Authentication is temporarily unavailable.');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError(`ACCESS DENIED. Invalid credentials. (${newAttempts}/5)`);
        setInput('');

        // Lock after 5 failed attempts for 60 seconds (local enforcement, server will enforce at 15m)
        if (newAttempts >= 5) {
          setLocked(true);
          setError('LOCKED. Too many failed attempts. Wait 60 seconds.');
          setTimeout(() => { setLocked(false); setAttempts(0); setError(''); }, 60000);
        }
      }
    } catch (_) {
      // Never fall back to a client-side password check.
      setError('Network error during authentication.');
    }
  };

  const handleLogout = () => {
    clearSessionHint();
    // Server-side cookie revocation is TRUST01 follow-up (see migration note); the
    // HttpOnly cookie remains valid until it expires until then.
    setAuthed(false);
    setInput('');
  };

  if (loading) return null;


  if (authed) {
    return children;
  }

  // Login Gate UI
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#faf9f5', fontFamily: "'DM Mono', 'IBM Plex Mono', monospace"
    }}>
      <div style={{
        width: '100%', maxWidth: '420px', padding: '40px 32px',
        border: '2px solid #1c1d22', background: '#ffffff',
        boxShadow: '6px 6px 0px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <div style={{
            width: '12px', height: '12px', background: '#c44b2b',
            margin: '0 auto 16px', display: 'block'
          }} />
          <h1 style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.06em', margin: 0, color: '#1c1d22' }}>
            MARKET BRAIN GRID
          </h1>
          <div style={{ fontSize: '10px', color: '#8a8a8a', marginTop: '4px', letterSpacing: '0.04em' }}>
            TRADING INTELLIGENCE COCKPIT // RESTRICTED ACCESS
          </div>
        </div>

        {/* Warning box */}
        <div style={{
          background: '#f5f0e8', border: '1px solid #d4c5a9', padding: '10px 14px',
          marginBottom: '20px', fontSize: '10px', color: '#6b5e3f', letterSpacing: '0.02em'
        }}>
          ⚠ AUTHORIZED PERSONNEL ONLY. All access attempts are logged.
          Unauthorized access is prohibited.
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label style={{
            display: 'block', fontSize: '10px', fontWeight: '700',
            letterSpacing: '0.06em', color: '#1c1d22', marginBottom: '6px'
          }}>
            ACCESS CREDENTIAL:
          </label>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={locked}
            placeholder="Enter access password..."
            autoFocus
            style={{
              width: '100%', padding: '10px 12px', fontSize: '13px',
              fontFamily: "'DM Mono', monospace", border: '2px solid #1c1d22',
              outline: 'none', background: locked ? '#f0f0f0' : '#fff',
              boxSizing: 'border-box', letterSpacing: '0.08em'
            }}
          />

          {error && (
            <div style={{
              marginTop: '8px', padding: '8px 12px', fontSize: '10px',
              background: '#fef2f2', border: '1px solid #c44b2b', color: '#c44b2b',
              fontWeight: '700', letterSpacing: '0.03em'
            }}>
              🔴 {error}
            </div>
          )}

          <button
            type="submit"
            disabled={locked || !input.trim()}
            style={{
              width: '100%', marginTop: '14px', padding: '10px',
              background: locked ? '#ccc' : '#1c1d22', color: '#fff',
              border: 'none', cursor: locked ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Mono', monospace", fontSize: '12px',
              fontWeight: '700', letterSpacing: '0.06em'
            }}
          >
            {locked ? '🔒 LOCKED (60s)' : '→ AUTHENTICATE'}
          </button>
        </form>

        {/* Footer */}
          SERVER-SIDE JWT VERIFICATION · SESSION: 24H · ANTI-BRUTE: 5 ATTEMPTS/LOCKOUT

      </div>
    </div>
  );
}
