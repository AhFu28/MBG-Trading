import React, { useState } from 'react';
import { PLANS, TIER, limitsFor } from '../services/featureAccess.js';

/**
 * SubscriptionPage — status langganan + cara upgrade.
 *
 * Payment is MANUAL for now (owner decision, 2026-10-05): the customer
 * transfers, then the owner activates the account. So this page must be
 * extremely clear about what happens AFTER paying, otherwise people pay and
 * then sit waiting with no idea what to do.
 */

const PAYMENT_CHANNELS = [
  {
    method: 'Transfer Bank',
    detail: 'BCA',
    account: '1234567890',
    holder: 'Naufal Arib',
    icon: '🏦',
  },
  {
    method: 'QRIS',
    detail: 'Semua e-wallet & mobile banking',
    account: 'Scan QR dari admin',
    holder: 'Minta QR ke admin',
    icon: '📱',
  },
];

export default function SubscriptionPage({ account = {}, onRefresh, onLogout }) {
  const [copied, setCopied] = useState('');

  const isPro = !!account.isPro;
  const email = account.email || '—';
  const daysLeft = account.daysLeft;
  const expired = !!account.expired;

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setCopied('');
    }
  };

  const proPlan = PLANS.find(p => p.id === TIER.PRO);
  const limits = limitsFor(account.tier || TIER.FREE);

  const panel = {
    background: 'rgba(255,255,255,0.032)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '14px', padding: '20px 22px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '820px' }}>

      {/* ===== CURRENT STATUS ===== */}
      <div style={{
        ...panel,
        background: isPro
          ? 'linear-gradient(150deg, rgba(245,158,11,0.10) 0%, rgba(15,20,35,0.96) 55%)'
          : 'linear-gradient(150deg, rgba(99,102,241,0.09) 0%, rgba(15,20,35,0.96) 55%)',
        border: `1px solid ${isPro ? 'rgba(245,158,11,0.38)' : 'rgba(99,102,241,0.30)'}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: '800', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '7px' }}>
              Akun Anda
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '4px' }}>{email}</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px', fontWeight: '900', padding: '4px 12px', borderRadius: '9999px',
                background: isPro ? 'rgba(245,158,11,0.18)' : 'rgba(99,102,241,0.18)',
                color: isPro ? '#fbbf24' : '#818cf8',
                border: `1px solid ${isPro ? 'rgba(245,158,11,0.45)' : 'rgba(99,102,241,0.45)'}`,
              }}>
                {isPro ? '👑 PRO' : '⭐ FREE'}
              </span>
              {isPro && daysLeft !== null && (
                <span style={{ fontSize: '11px', color: daysLeft <= 7 ? '#fb7185' : 'var(--text-secondary)' }}>
                  {daysLeft} hari tersisa
                </span>
              )}
              {account.expiresAt && (
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  s/d {new Date(account.expiresAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onRefresh}
              style={{
                padding: '8px 15px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700',
                background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)',
                border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              🔄 Perbarui Status
            </button>
            <button
              onClick={onLogout}
              style={{
                padding: '8px 15px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700',
                background: 'rgba(244,63,94,0.10)', color: '#fb7185',
                border: '1px solid rgba(244,63,94,0.30)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Keluar
            </button>
          </div>
        </div>

        {expired && (
          <div style={{
            marginTop: '15px', background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.32)',
            borderRadius: '9px', padding: '11px 14px', fontSize: '12px', color: '#fb7185', lineHeight: 1.6,
          }}>
            ⚠️ <strong>Langganan Pro Anda telah berakhir.</strong> Akses Pro dinonaktifkan otomatis.
            Hubungi admin untuk memperpanjang.
          </div>
        )}

        {!isPro && (
          <div style={{
            marginTop: '15px', background: 'rgba(0,0,0,0.26)', borderRadius: '9px',
            padding: '13px 15px', fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.7,
          }}>
            Anda sedang di paket <strong>Free</strong>: sinyal tertunda {limits.delayHours} jam,
            maksimal {limits.signals} sinyal per hari, dan modul analitik masih terkunci.
          </div>
        )}
      </div>

      {/* ===== UPGRADE (only when not Pro) ===== */}
      {!isPro && (
        <>
          <div style={panel}>
            <div style={{ fontSize: '16px', fontWeight: '900', marginBottom: '5px' }}>
              👑 Upgrade ke Pro — {proPlan.price} <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '400' }}>{proPlan.period}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Sinyal real-time, notifikasi Telegram, dan seluruh modul analitik terbuka.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px', marginBottom: '18px' }}>
              {proPlan.features.map(f => (
                <div key={f} style={{ fontSize: '11.5px', display: 'flex', gap: '8px', lineHeight: 1.55 }}>
                  <span style={{ color: '#34d399', flexShrink: 0 }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '11px' }}>
              Cara Berlangganan
            </div>

            {/* Steps — explicit, because manual activation needs expectations set */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '18px' }}>
              {[
                'Transfer sesuai nominal ke salah satu rekening di bawah.',
                'Simpan bukti transfer (screenshot / struk).',
                `Kirim bukti + email akun Anda (${email}) ke admin via WhatsApp atau Telegram.`,
                'Admin mengaktifkan akun Anda. Klik "Perbarui Status" setelah dikonfirmasi.',
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', gap: '11px', fontSize: '12px', lineHeight: 1.6 }}>
                  <span style={{
                    flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%',
                    background: 'rgba(99,102,241,0.22)', color: '#a5b4fc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10.5px', fontWeight: '900',
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Payment channels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '11px' }}>
              {PAYMENT_CHANNELS.map(ch => (
                <div key={ch.method} style={{
                  background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '11px', padding: '14px 16px',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '9px' }}>
                    {ch.icon} {ch.method.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>{ch.detail}</div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '9px', marginTop: '7px',
                  }}>
                    <code style={{
                      fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-mono)',
                      color: '#fbbf24', letterSpacing: '0.02em',
                    }}>
                      {ch.account}
                    </code>
                    <button
                      onClick={() => copy(ch.account, ch.method)}
                      style={{
                        padding: '3px 9px', borderRadius: '6px', fontSize: '9.5px', fontWeight: '700',
                        background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {copied === ch.method ? '✓ Tersalin' : 'Salin'}
                    </button>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    a.n. {ch.holder}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '15px', background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.30)', borderRadius: '9px',
              padding: '12px 15px', fontSize: '11.5px', color: '#fbbf24', lineHeight: 1.65,
            }}>
              ⏱ <strong>Aktivasi manual.</strong> Setelah bukti transfer diterima, admin mengaktifkan
              akun Anda. Biasanya dalam beberapa jam pada hari kerja. Anda tidak perlu membayar dua kali —
              sampaikan email akun saat menghubungi admin.
            </div>
          </div>
        </>
      )}

      {/* ===== HOW THE TIERS DIFFER ===== */}
      <div style={panel}>
        <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '13px' }}>
          Perbandingan Paket
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '9px 8px', color: 'var(--text-muted)', fontWeight: '800', fontSize: '10px' }}>FITUR</th>
                <th style={{ textAlign: 'center', padding: '9px 8px', color: 'var(--text-muted)', fontWeight: '800', fontSize: '10px' }}>FREE</th>
                <th style={{ textAlign: 'center', padding: '9px 8px', color: '#fbbf24', fontWeight: '800', fontSize: '10px' }}>PRO</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Keterlambatan sinyal', '24 jam', 'Real-time'],
                ['Jumlah sinyal / hari', '6', 'Tak terbatas'],
                ['Level Entry / SL / TP', '✓', '✓'],
                ['Alasan & skenario', '✕', '✓'],
                ['Notifikasi Telegram', '✕', '✓'],
                ['AI Multi-Agent Arena', '✕', '✓'],
                ['Early Signal Radar', '✕', '✓'],
                ['Charting & Whale Tracker', '✕', '✓'],
                ['Forex, US Stocks, Futures', '✕', '✓'],
                ['AI Sentinel Desk', '✕', '✓'],
              ].map(([label, free, pro]) => (
                <tr key={label} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '9px 8px', color: 'var(--text-secondary)' }}>{label}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', color: free === '✕' ? 'var(--text-muted)' : 'var(--text-primary)' }}>{free}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', color: pro === '✕' ? 'var(--text-muted)' : '#34d399', fontWeight: '700' }}>{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        background: 'rgba(244,63,94,0.065)', border: '1px solid rgba(244,63,94,0.26)',
        borderRadius: '11px', padding: '15px 18px', fontSize: '11px',
        color: 'var(--text-secondary)', lineHeight: 1.75,
      }}>
        <strong style={{ color: '#fb7185' }}>⚠️ Risiko:</strong> Semua sinyal adalah hasil screening
        algoritmik, bukan nasihat investasi. Kinerja masa lalu tidak menjamin hasil di masa depan.
        Anda dapat kehilangan seluruh modal. Keputusan trading sepenuhnya tanggung jawab Anda.
      </div>
    </div>
  );
}
