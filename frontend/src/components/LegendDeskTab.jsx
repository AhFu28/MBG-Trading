import React, { useMemo } from 'react';
import { TIER } from '../services/featureAccess.js';
import { legendEligible, eligibilityMessage, loadAchievementContext } from '../services/achievements.js';

/**
 * The two LEGEND desks: autonomous trading, and the execution overlay.
 *
 * WHY THIS EXISTS AT ALL, and the bug it fixes: `TRADING_BOT` and
 * `JEV_EXECUTION` were registered as modules, gated at LEGEND, listed on the
 * pricing page — and had NO ROUTE. `?tab=TRADING_BOT` fell through to the
 * leaderboard fallback, so the feature was advertised and unreachable.
 *
 * Worse, the fallback happened to contain the words "Khusus Legend", which made
 * the tier tests pass while the desk did not exist. That is how a green suite
 * hid a missing page: the assertion matched text from an unrelated component.
 *
 * WHAT THIS PAGE DOES AND DOES NOT DO — stated plainly because it is the honest
 * part of shipping this feature:
 *
 *   It shows the desk, its controls, and its risk envelope.
 *   It does NOT send orders. Order routing is not connected yet.
 *
 * A dry-run desk that says it is a dry run is useful: it lets the owner see the
 * surface and decide on routing. A dry-run desk that LOOKS live is not, because
 * a user would believe an order was placed. So every simulated figure on this
 * page is labelled, and the execution controls are disabled with the reason on
 * screen rather than silently doing nothing.
 */

const DISABLED_REASON = 'Eksekusi otomatis belum tersambung ke bursa. Halaman ini menampilkan rancangan alurnya.';

/** A labelled row. Used for the metric strips. */
function Metric({ label, value, muted }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '110px' }}>
      <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <span style={{
        fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)',
        color: muted ? 'var(--text-muted)' : 'var(--text-primary)',
      }}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="telemetry-panel" style={{ padding: '16px 18px', borderRadius: '12px' }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.6 }}>
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

export default function LegendDeskTab({ moduleId, userTier = TIER.GUEST, isAdmin = false, onNavigate }) {
  const ctx = useMemo(() => loadAchievementContext(), []);
  const gate = useMemo(() => legendEligible(ctx, userTier, isAdmin), [ctx, userTier, isAdmin]);

  const isBot = moduleId === 'TRADING_BOT';
  const title = isBot ? '🤖 Trading Bot Otonom' : '⚡ Jev Execution HUD';

  /**
   * The gate is re-checked HERE, not only in App.
   *
   * Defence in depth: App's branch decides whether this component mounts, and
   * this component decides whether to show its contents. If a future refactor
   * mounts the desk by another path, the desker still refuses to render its
   * controls. The check is cheap and the cost of being wrong is an unauthorised
   * execution surface.
   */
  if (!gate.eligible) {
    return (
      <div className="telemetry-panel" style={{
        padding: '48px 28px', borderRadius: '16px', textAlign: 'center',
        maxWidth: '560px', margin: '40px auto',
      }}>
        <div style={{ fontSize: '34px', marginBottom: '14px' }}>👑</div>
        <div style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Belum Terbuka
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '20px' }}>
          {eligibilityMessage(gate)}
        </div>
        <button
          onClick={() => onNavigate && onNavigate('ACHIEVEMENTS')}
          style={{
            padding: '11px 24px', borderRadius: '9px', fontSize: '12.5px', fontWeight: 900,
            background: 'linear-gradient(135deg,var(--accent-gold),#d97706)', color: '#000',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          👑 Lihat Legend Path
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>

      {/* ---------- HEADER ---------- */}
      <div className="telemetry-panel" style={{ padding: '16px 18px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>
              {title}
            </h2>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.6, maxWidth: '680px' }}>
              {isBot
                ? 'Mengirim order otomatis ke akun bursa Anda memakai API key Anda sendiri.'
                : 'Membelah order besar menjadi potongan kecil agar tidak menggerakkan harga.'}
            </div>
          </div>
          <span style={{
            padding: '5px 11px', borderRadius: '7px', fontSize: '10.5px', fontWeight: 800,
            background: 'rgba(255,180,84,0.14)', color: 'var(--accent-gold)',
            border: '1px solid rgba(255,180,84,0.34)', whiteSpace: 'nowrap',
          }}>
            BELUM TERSAMBUNG
          </span>
        </div>
      </div>

      {/* ---------- HONEST STATUS ---------- */}
      <div style={{
        padding: '13px 16px', borderRadius: '11px', fontSize: '12px', lineHeight: 1.75,
        background: 'rgba(255,180,84,0.09)', border: '1px solid rgba(255,180,84,0.32)',
        color: 'var(--text-secondary)',
      }}>
        <strong style={{ color: 'var(--accent-gold)' }}>⚠️ Mode rancangan.</strong> {DISABLED_REASON}
        {' '}Tidak ada order yang dikirim dari halaman ini, dan tidak ada angka pasar yang ditampilkan
        seolah-olah nyata.
      </div>

      {isBot ? (
        <>
          <Section
            title="Parameter Bot"
            subtitle="Nilai di bawah ini adalah batas aman, bukan hasil pengukuran pasar."
          >
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <Metric label="Modal per bot" value="—" muted />
              <Metric label="Risiko per posisi" value="—" muted />
              <Metric label="Maksimum posisi" value="—" muted />
              <Metric label="Stop wajib" value="Ya" />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Batas ditampilkan kosong karena belum ada nilai tersimpan. Angka yang belum diatur
              tidak diisi dengan perkiraan.
            </div>
          </Section>

          <Section
            title="Alur Eksekusi"
            subtitle="Urutan yang akan dijalankan begitu routing tersambung."
          >
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 2 }}>
              <li>Bot menyusun rencana: arah, entry, stop loss, target.</li>
              <li>Order dikirim ke bursa memakai API key Anda, bukan key kami.</li>
              <li>Stop loss dipasang bersamaan, bukan sesudahnya.</li>
              <li>Posisi dipantau, dan ditutup otomatis saat stop tersentuh.</li>
              <li>Setiap aksi dicatat agar bisa Anda periksa ulang.</li>
            </ol>
          </Section>

          <Section
            title="Peringatan Risiko"
            subtitle="Ditampilkan sebelum bot dinyalakan, bukan sesudah."
          >
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 2 }}>
              <li>Bot bisa salah. Kerugian nyata bisa terjadi.</li>
              <li>Modal awal, penarikan, dan order manual di akun yang sama tidak bisa kami pantau.</li>
              <li>Karena itu kami tidak menjanjikan persentase keuntungan apa pun.</li>
            </ul>
          </Section>
        </>
      ) : (
        <>
          <Section
            title="Metode Eksekusi"
            subtitle="Cara order besar dipecah agar tidak menggerakkan harga."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { k: 'TWAP', d: 'Order dibagi rata sepanjang waktu yang ditentukan.' },
                { k: 'VWAP', d: 'Order dibagi mengikuti pola volume pasar.' },
                { k: 'POV', d: 'Order mengikuti persentase volume yang berjalan.' },
              ].map(m => (
                <div key={m.k} style={{
                  display: 'flex', gap: '12px', alignItems: 'baseline',
                  padding: '10px 12px', borderRadius: '9px',
                  background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', minWidth: '48px' }}>
                    {m.k}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{m.d}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Status"
            subtitle="HUD ini menampilkan order berjalan. Belum ada order berjalan."
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              Tidak ada order aktif. HUD akan terisi begitu routing eksekusi tersambung.
            </div>
          </Section>
        </>
      )}

      {/* ---------- DISABLED CONTROL ---------- */}
      <div className="telemetry-panel" style={{ padding: '16px 18px', borderRadius: '12px' }}>
        <button
          disabled
          title={DISABLED_REASON}
          style={{
            width: '100%', padding: '13px', borderRadius: '10px', fontSize: '13px', fontWeight: 900,
            background: 'var(--bg-panel-subtle)', color: 'var(--text-muted)',
            border: 'var(--border-hairline)', cursor: 'not-allowed', fontFamily: 'inherit',
          }}
        >
          {isBot ? 'Nyalakan Bot' : 'Mulai Eksekusi Bertahap'} (belum tersedia)
        </button>
        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
          Nonaktif: {DISABLED_REASON}
        </div>
      </div>
    </div>
  );
}
