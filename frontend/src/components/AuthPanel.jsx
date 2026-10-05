import React, { useState } from 'react';
import { PLANS, TIER } from '../services/featureAccess.js';
import { signUp, logIn, ownerLogin } from '../services/accountClient.js';

/**
 * AuthPanel — sign in / sign up.
 *
 * Replaces the old single shared password screen. The owner password is still
 * here, but tucked behind a link so it does not confuse customers.
 */
export default function AuthPanel({ initialMode = 'login', headline, onAuthenticated }) {
  const [mode, setMode] = useState(initialMode); // login | signup | owner
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setNotice('');
    setBusy(true);

    try {
      if (mode === 'owner') {
        if (!password.trim()) throw new Error('Kata sandi wajib diisi.');
        await ownerLogin(password.trim());
        onAuthenticated && onAuthenticated({ tier: TIER.PRO, isPro: true, owner: true });
        return;
      }

      if (mode === 'signup') {
        const body = await signUp({ email: email.trim(), password, displayName: displayName.trim() });
        if (body?.requiresConfirmation) {
          setNotice('Akun dibuat. Cek email Anda untuk konfirmasi, lalu masuk.');
          setMode('login');
          setPassword('');
          return;
        }
        onAuthenticated && onAuthenticated({ tier: body?.tier || TIER.FREE, isPro: false });
        return;
      }

      await logIn({ email: email.trim(), password });
      onAuthenticated && onAuthenticated({ tier: TIER.FREE, isPro: false });
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const field = {
    width: '100%', padding: '11px 13px', borderRadius: '9px', fontSize: '13px',
    background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.12)',
    color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
  };
  const label = {
    display: 'block', fontSize: '10.5px', fontWeight: '800', letterSpacing: '0.06em',
    color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase',
  };

  const titles = {
    login: 'Masuk ke Akun Anda',
    signup: 'Buat Akun Gratis',
    owner: 'Akses Pemilik',
  };

  return (
    <div style={{
      width: '100%', maxWidth: '420px', margin: '0 auto',
      background: 'linear-gradient(160deg, rgba(20,26,44,0.96) 0%, rgba(12,16,28,0.98) 100%)',
      border: '1px solid rgba(99,102,241,0.28)', borderRadius: '18px',
      padding: '28px 26px', boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '26px', marginBottom: '6px' }}>📡</div>
        <div style={{ fontSize: '17px', fontWeight: '900', letterSpacing: '-0.02em' }}>
          {titles[mode]}
        </div>
        {headline && (
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.6 }}>
            {headline}
          </div>
        )}
      </div>

      {/* Mode tabs — hidden in owner mode to keep it unobtrusive */}
      {mode !== 'owner' && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px',
          background: 'rgba(0,0,0,0.30)', borderRadius: '10px', padding: '4px', marginBottom: '18px',
        }}>
          {[['login', 'Masuk'], ['signup', 'Daftar']].map(([key, text]) => (
            <button
              key={key}
              type="button"
              onClick={() => { setMode(key); setError(''); setNotice(''); }}
              style={{
                padding: '8px', borderRadius: '7px', fontSize: '12px', fontWeight: '800',
                cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                background: mode === key ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'transparent',
                color: mode === key ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {text}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
        {mode === 'signup' && (
          <div>
            <label style={label} htmlFor="mbg-name">Nama (opsional)</label>
            <input
              id="mbg-name" style={field} value={displayName} autoComplete="name"
              onChange={e => setDisplayName(e.target.value)} placeholder="Nama Anda"
            />
          </div>
        )}

        {mode !== 'owner' && (
          <div>
            <label style={label} htmlFor="mbg-email">Email</label>
            <input
              id="mbg-email" style={field} value={email} type="email" required
              autoComplete="email" inputMode="email"
              onChange={e => setEmail(e.target.value)} placeholder="nama@email.com"
            />
          </div>
        )}

        <div>
          <label style={label} htmlFor="mbg-pass">Kata Sandi</label>
          <input
            id="mbg-pass" style={field} value={password} type="password" required
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            onChange={e => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'Minimal 8 karakter' : '••••••••'}
          />
          {mode === 'signup' && (
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '5px' }}>
              Minimal 8 karakter. Gunakan yang tidak Anda pakai di tempat lain.
            </div>
          )}
        </div>

        {error && (
          <div role="alert" style={{
            fontSize: '11.5px', color: '#fb7185', background: 'rgba(244,63,94,0.10)',
            border: '1px solid rgba(244,63,94,0.32)', borderRadius: '8px', padding: '9px 11px', lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}
        {notice && (
          <div role="status" style={{
            fontSize: '11.5px', color: '#34d399', background: 'rgba(16,185,129,0.10)',
            border: '1px solid rgba(16,185,129,0.32)', borderRadius: '8px', padding: '9px 11px', lineHeight: 1.5,
          }}>
            {notice}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            marginTop: '3px', padding: '12px', borderRadius: '9px', border: 'none',
            background: busy ? 'rgba(99,102,241,0.45)' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
            color: '#fff', fontSize: '13px', fontWeight: '900', fontFamily: 'inherit',
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy ? 'Memproses…' : (mode === 'signup' ? 'Daftar Sekarang' : 'Masuk')}
        </button>
      </form>

      {mode === 'signup' && (
        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '14px', lineHeight: 1.65, textAlign: 'center' }}>
          Akun gratis memberi Anda sinyal tertunda 24 jam.<br />
          Untuk sinyal real-time, lihat paket di bawah.
        </div>
      )}

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => { setMode(mode === 'owner' ? 'login' : 'owner'); setError(''); setNotice(''); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '10.5px', color: 'var(--text-muted)', textDecoration: 'underline',
          }}
        >
          {mode === 'owner' ? '← Kembali' : 'Akses pemilik (kata sandi sistem)'}
        </button>
      </div>
    </div>
  );
}

/** Small helper so the landing page can reuse the plan data. */
export function cheapestPaidPlan() {
  return PLANS.find(p => p.id === TIER.PRO);
}
