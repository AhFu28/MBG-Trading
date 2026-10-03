import React, { useState, useEffect } from 'react';

const SESSION_KEY = 'mbg_cockpit_auth';

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState('subscriber');
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  // M-04: server-verified 24-hour session on mount. The HttpOnly cookie is the
  // single source of truth; localStorage is a display hint, never the authority.
  useEffect(() => {
    let disposed = false;
    async function verifySession() {
      try {
        const res = await fetch('/api/auth', { credentials: 'same-origin' });
        const body = await res.json().catch(() => ({}));
        if (res.ok && (body.authenticated !== true || !Array.isArray(body.features) || !Number.isFinite(body.expiresAt) || body.expiresAt <= Date.now())) throw new Error('unverified session');
        if (res.ok) {
          if (disposed) return;
          localStorage.setItem(SESSION_KEY, JSON.stringify(body));
          setSession(body);
          setAuthed(true);
          setLoading(false);
          return;
        }
        if (disposed) return;
        setAuthed(false);
        setSession(null);
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
      } catch (_) {
        if (!disposed) { setAuthed(false); setSession(null); }
      }
      if (!disposed) setLoading(false);
    }
    verifySession();
    const interval = setInterval(verifySession, 60000);
    return () => { disposed = true; clearInterval(interval); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked || !input.trim()) return;


    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password: input, ...(mode === 'subscriber' ? { email: email.trim() } : {}) })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated !== true || !Array.isArray(data.features) || !Number.isFinite(data.expiresAt) || data.expiresAt <= Date.now()) throw new Error('Invalid authentication response');
        const sessionPayload = data;
        setSession(data);
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
        setAuthed(true);
        setError('');
      } else if (res.status === 429) {
        setLocked(true);
        setError('LOCKED. Too many failed attempts. Wait 15 minutes.');
        setTimeout(() => { setLocked(false); setAttempts(0); setError(''); }, 15 * 60 * 1000);
      } else if (res.status >= 500) {
        setError('Authentication service unavailable. Try again later.');
      } else {
        // SECURITY: no client-side credential bypass — the server is the single source of truth.
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
    } catch (err) {
      setError('Network error during authentication.');
    }
  };

  const handleLogout = async () => {
    const response = await fetch('/api/auth', { method: 'DELETE', credentials: 'same-origin' }).catch(() => null);
    if (!response?.ok) { setError('Logout service unavailable. Try again.'); return; }
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setAuthed(false);
    setInput('');
  };

  if (loading) return null;


  if (authed) {
    if (session?.features?.includes('cockpit.read')) return children;
    return <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Account access</h1>
      <p>Your account does not have an active cockpit grant.</p>
      {session?.features?.includes('ea.download') && <p><a href="/api/ea">Download your EA source</a></p>}
      {session?.features?.includes('research.read') && <p><a href="/api/research-archive">Open research archive</a></p>}
      {session?.features?.includes('arena.read') && <p><a href="/api/arena-state">Open arena snapshot</a></p>}
      {error && <p role="alert">{error}</p>}
      <button onClick={handleLogout}>Log out</button>
    </div>;
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
          Individual accounts receive access through active feature grants. Owner access is for internal use.
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: '12px', color: '#1c1d22' }}>
            Login type
            <select value={mode} onChange={e => setMode(e.target.value)} style={{ width: '100%', padding: '8px' }}>
              <option value="subscriber">Subscriber account</option>
              <option value="owner">Owner access</option>
            </select>
          </label>
          {mode === 'subscriber' && <label style={{ display: 'block', marginBottom: '12px', color: '#1c1d22' }}>
            Email
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              autoComplete="username" style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </label>}
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
            autoComplete="current-password"
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
          SERVER-VERIFIED SESSION · ACCESS CHECKED ON EACH REQUEST

      </div>
    </div>
  );
}
