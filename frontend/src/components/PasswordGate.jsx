import React, { useState, useEffect } from 'react';

// SHA-256 hash of the access password — plaintext NEVER stored in source
const PASS_HASH = '286713785e8fbca141922642c96747842acd886f6da2f7598d0bc8554b8c3e18';
const SESSION_KEY = 'mbg_cockpit_auth';
const SESSION_HOURS = 24;

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const { exp } = JSON.parse(raw);
        if (Date.now() < exp) {
          setAuthed(true);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch { localStorage.removeItem(SESSION_KEY); }
    setLoading(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked || !input.trim()) return;

    const hash = await sha256(input.trim());
    if (hash === PASS_HASH) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        exp: Date.now() + SESSION_HOURS * 3600000
      }));
      setAuthed(true);
      setError('');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(`ACCESS DENIED. Invalid credentials. (${newAttempts}/5)`);
      setInput('');

      // Lock after 5 failed attempts for 60 seconds
      if (newAttempts >= 5) {
        setLocked(true);
        setError('LOCKED. Too many failed attempts. Wait 60 seconds.');
        setTimeout(() => { setLocked(false); setAttempts(0); setError(''); }, 60000);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setInput('');
  };

  if (loading) return null;

  if (authed) {
    return (
      <>
        {/* Floating logout button */}
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            position: 'fixed', bottom: '16px', right: '16px', zIndex: 10000,
            background: '#1c1d22', color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-mono, monospace)', fontSize: '10px', padding: '6px 12px',
            letterSpacing: '0.05em', opacity: 0.6
          }}
          onMouseEnter={e => e.target.style.opacity = 1}
          onMouseLeave={e => e.target.style.opacity = 0.6}
        >
          🔓 LOGOUT
        </button>
        {children}
      </>
    );
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
        <div style={{
          marginTop: '24px', paddingTop: '14px', borderTop: '1px solid #e5e5e5',
          fontSize: '9px', color: '#b0b0b0', textAlign: 'center', letterSpacing: '0.03em'
        }}>
          SHA-256 CLIENT-SIDE VERIFICATION · SESSION: {SESSION_HOURS}H · ANTI-BRUTE: 5 ATTEMPTS/LOCKOUT
        </div>
      </div>
    </div>
  );
}
