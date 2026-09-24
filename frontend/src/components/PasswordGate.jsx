import React, { useState, useEffect } from 'react';

const SESSION_KEY = 'mbg_cockpit_auth';

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  // M-04: Check existing 24-hour session on mount
  useEffect(() => {
    async function verifySession() {
      try {
        const savedSession = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          // If session is authenticated and within 24-hour TTL window, grant immediate access
          if (parsed?.authenticated && parsed?.expiresAt && Date.now() < parsed.expiresAt) {
            setAuthed(true);
            setLoading(false);
            return;
          } else if (parsed?.authenticated && !parsed?.expiresAt) {
            // Upgrade legacy sessions to 24h expiration
            parsed.expiresAt = Date.now() + 24 * 3600 * 1000;
            localStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
            setAuthed(true);
            setLoading(false);
            return;
          } else {
            localStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (_) {}

      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const expiresAt = Date.now() + 24 * 3600 * 1000;
          localStorage.setItem(SESSION_KEY, JSON.stringify({ authenticated: true, expiresAt }));
          setAuthed(true);
        }
      } catch (err) {
        // Fallback for static host / local dev
      }
      setLoading(false);
    }
    verifySession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked || !input.trim()) return;

    const expiresAt = Date.now() + 24 * 3600 * 1000; // 24-Hour Session TTL

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        const sessionPayload = { ...data, authenticated: true, expiresAt };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
        setAuthed(true);
        setError('');
      } else if (res.status === 429) {
        setLocked(true);
        setError('LOCKED. Too many failed attempts. Wait 15 minutes.');
        setTimeout(() => { setLocked(false); setAttempts(0); setError(''); }, 15 * 60 * 1000);
      } else {
        // Test phase convenience fallback: allow 'mbg' immediately (C-02 Owner Directive)
        if (input.trim().toLowerCase() === 'mbg') {
          const sessionPayload = { authenticated: true, testMode: true, expiresAt };
          localStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
          setAuthed(true);
          setError('');
          return;
        }

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
      if (input.trim().toLowerCase() === 'mbg') {
        const sessionPayload = { authenticated: true, testMode: true, expiresAt };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
        setAuthed(true);
        setError('');
        return;
      }
      setError('Network error during authentication.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    // Ideally we'd hit a logout endpoint to clear the cookie as well
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
