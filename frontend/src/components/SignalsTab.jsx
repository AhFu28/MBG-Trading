import React, { useMemo, useState } from 'react';
import {
  TIERS,
  buildTierView,
  maskPlanForTier,
  featuresFor,
} from '../services/signalTiers.js';

function fmtMoney(value, market) {
  if (value === null || value === undefined) return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  if (String(market).toUpperCase() === 'IDX') return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
  if (n >= 1000) return `$${Math.round(n).toLocaleString('en-US')}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(5)}`;
}

function fmtWhen(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(String(iso).replace('Z', '+00:00'));
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
    }) + ' WIB';
  } catch {
    return '—';
  }
}

const DIRECTION_STYLE = {
  LONG: { color: 'var(--accent-mint)', bg: 'rgba(16,185,129,0.14)', border: 'rgba(16,185,129,0.4)', label: '▲ LONG' },
  BUY: { color: 'var(--accent-mint)', bg: 'rgba(16,185,129,0.14)', border: 'rgba(16,185,129,0.4)', label: '▲ BUY' },
  SHORT: { color: '#fb7185', bg: 'rgba(244,63,94,0.14)', border: 'rgba(244,63,94,0.4)', label: '▼ SHORT' },
  SELL: { color: '#fb7185', bg: 'rgba(244,63,94,0.14)', border: 'rgba(244,63,94,0.4)', label: '▼ SELL' },
};

/**
 * SignalsTab — the website's signal desk.
 *
 * Everyone sees signals here; the difference between tiers is SPEED and depth,
 * not access. VIP sees a plan the moment it is published, FREE waits 24 hours,
 * GUEST waits 48 hours and sees no precise levels. The page always shows how
 * many signals are waiting, so the upgrade reason is visible rather than hidden.
 */
export default function SignalsTab({ plans = [], userTier = TIERS.GUEST, onNavigateTab, onOpenExecution }) {
  const tier = String(userTier || '').toUpperCase() === 'PRO' || String(userTier || '').toUpperCase() === 'VIP'
    ? TIERS.VIP
    : String(userTier || '').toUpperCase() === 'FREE' ? TIERS.FREE : TIERS.GUEST;

  const [now] = useState(() => new Date());
  const [filter, setFilter] = useState('ALL');

  const view = useMemo(() => buildTierView(plans, tier, now), [plans, tier, now]);
  const features = featuresFor(tier);

  const visible = useMemo(() => {
    const rows = view.visible.map(p => maskPlanForTier(p, tier));
    if (filter === 'ALL') return rows;
    return rows.filter(r => String(r.market).toUpperCase() === filter);
  }, [view, tier, filter]);

  const idrCount = view.visible.filter(p => String(p.market).toUpperCase() === 'IDX').length;
  const cryptoCount = view.visible.filter(p => String(p.market).toUpperCase() === 'CRYPTO').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ===== TIER STATUS BANNER ===== */}
      <div className="telemetry-panel" style={{
        padding: '16px 20px',
        borderRadius: '14px',
        background: tier === TIERS.VIP
          ? 'linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(17,23,38,0.9) 60%)'
          : 'linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(17,23,38,0.9) 60%)',
        border: `1px solid ${tier === TIERS.VIP ? 'rgba(245,158,11,0.35)' : 'rgba(99,102,241,0.3)'}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '20px' }}>{features.icon}</span>
              <span style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '-0.01em' }}>
                SINYAL TRADING
              </span>
              <span style={{
                fontSize: '9.5px', fontWeight: '800', padding: '3px 9px', borderRadius: '9999px',
                background: tier === TIERS.VIP ? 'rgba(245,158,11,0.18)' : 'rgba(99,102,241,0.18)',
                color: tier === TIERS.VIP ? '#fbbf24' : '#818cf8',
                border: `1px solid ${tier === TIERS.VIP ? 'rgba(245,158,11,0.45)' : 'rgba(99,102,241,0.45)'}`,
              }}>
                {features.icon} {features.label}
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {features.note}
            </div>
            <div style={{ display: 'flex', gap: '14px', marginTop: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--accent-mint)' }}>● {view.totalVisible} terlihat</span>
              {view.totalLocked > 0 && (
                <span style={{ color: '#fbbf24' }}>🔒 {view.totalLocked} terkunci</span>
              )}
            </div>
          </div>

          {/* Upgrade call-to-action — only for non-VIP */}
          {tier !== TIERS.VIP && (
            <div style={{
              background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: '10px', padding: '12px 14px', minWidth: '230px', maxWidth: '290px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#fbbf24', marginBottom: '6px' }}>
                👑 Upgrade ke VIP Pro
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {tier === TIERS.GUEST ? (
                  <>• Sinyal <strong>real-time</strong> (bukan 48 jam)<br />
                    • Level presisi Entry / SL / TP<br />
                    • Alasan lengkap tiap sinyal</>
                ) : (
                  <>• Sinyal <strong>24 jam lebih cepat</strong><br />
                    • Notifikasi langsung ke Telegram<br />
                    • Alasan &amp; skenario lengkap</>
                )}
              </div>
              <button
                onClick={() => onNavigateTab && onNavigateTab('CHANGELOG')}
                style={{
                  marginTop: '10px', width: '100%', padding: '7px 12px', borderRadius: '7px',
                  background: 'linear-gradient(135deg, var(--accent-gold) 0%, #d97706 100%)',
                  color: '#000', border: 'none', fontSize: '10.5px', fontWeight: '900', cursor: 'pointer',
                }}
              >
                Lihat Paket VIP
              </button>
            </div>
          )}

          {tier === TIERS.VIP && features.showTelegram && (
            <div style={{
              background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.35)',
              borderRadius: '10px', padding: '12px 14px', maxWidth: '250px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-mint)', marginBottom: '4px' }}>
                ✅ Akses Penuh Aktif
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Sinyal baru juga dikirim otomatis ke Telegram Anda.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== FILTER ===== */}
      <div className="telemetry-panel" style={{ padding: '10px 16px', borderRadius: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {[
          ['ALL', `Semua (${view.visible.length})`],
          ['IDX', `Saham IDX (${idrCount})`],
          ['CRYPTO', `Kripto (${cryptoCount})`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '5px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
              background: filter === key ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'var(--bg-panel-subtle)',
              color: filter === key ? '#fff' : 'var(--text-secondary)',
              border: filter === key ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Jam: {now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
        </span>
      </div>

      {/* ===== SIGNAL CARDS ===== */}
      {visible.length === 0 ? (
        <div className="telemetry-panel" style={{ borderRadius: '14px', padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '30px', marginBottom: '10px' }}>📭</div>
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
            Belum ada sinyal yang bisa Anda lihat
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.7 }}>
            {view.totalLocked > 0
              ? `${view.totalLocked} sinyal sedang menunggu masa tayang untuk tier ${features.label}. Sinyal VIP tampil seketika.`
              : 'Pipeline belum menghasilkan rencana trading. Sinyal akan muncul otomatis setelah pipeline berjalan.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '12px' }}>
          {visible.map((row, idx) => {
            const dir = DIRECTION_STYLE[String(row.direction).toUpperCase()] || {
              color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.35)', label: row.direction || '—',
            };
            return (
              <div key={`${row.clean_ticker}-${idx}`} className="telemetry-panel" style={{
                borderRadius: '14px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '-0.01em' }}>
                      ${row.clean_ticker}
                    </div>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {row.market} · {fmtWhen(row.observed_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: '900', padding: '3px 9px', borderRadius: '6px',
                      background: dir.bg, color: dir.color, border: `1px solid ${dir.border}`,
                    }}>
                      {dir.label}
                    </span>
                    {row.technical_signal && (
                      <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {row.technical_signal}
                      </span>
                    )}
                  </div>
                </div>

                {/* Levels */}
                {row.masked ? (
                  <div style={{
                    background: 'rgba(245,158,11,0.07)', border: '1px dashed rgba(245,158,11,0.4)',
                    borderRadius: '8px', padding: '12px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '16px', marginBottom: '4px' }}>🔒</div>
                    <div style={{ fontSize: '10.5px', color: '#fbbf24', fontWeight: '700' }}>
                      Level presisi terkunci
                    </div>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      Entry, Stop Loss &amp; Target hanya untuk member
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                    {[
                      ['ENTRY', row.entry_price, 'var(--accent-sky)'],
                      ['STOP LOSS', row.stop_loss, '#fb7185'],
                      ['TARGET 1', row.target_1, 'var(--accent-mint)'],
                      ['TARGET 2', row.target_2, 'var(--accent-mint)'],
                    ].map(([label, value, color]) => (
                      <div key={label} style={{
                        background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px', padding: '7px 10px',
                      }}>
                        <div style={{ fontSize: '8.5px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                          {label}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)', color, marginTop: '2px' }}>
                          {fmtMoney(value, row.market)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* R:R */}
                {!row.masked && row.risk_reward_ratio != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Risk / Reward</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--accent-mint)' }}>
                      1:{Number(row.risk_reward_ratio).toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Rationale — VIP only */}
                {row.masked === false && row.opinion_thesis && (
                  <div style={{
                    fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: 1.6,
                    background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: '8px', padding: '9px 11px',
                  }}>
                    💡 {row.opinion_thesis}
                  </div>
                )}

                {/* Locked rationale teaser for non-VIP */}
                {row.masked === false && !row.opinion_thesis && (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    🔒 Alasan lengkap hanya untuk VIP Pro
                  </div>
                )}

                {/* Execution Gateway Trigger */}
                {row.masked === false && (
                  <button
                    onClick={() => onOpenExecution && onOpenExecution({
                      symbol: row.symbol,
                      market: row.market,
                      entryPrice: row.entry_price,
                      stopLoss: row.stop_loss,
                      target1: row.target_1,
                      target2: row.target_2,
                      direction: row.direction
                    })}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800,
                      background: 'rgba(59, 130, 246, 0.12)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: 'var(--accent-blue)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      marginTop: '4px'
                    }}
                  >
                    ⚡ Eksekusi Rencana Ini
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== LOCKED SIGNALS TEASER ===== */}
      {view.totalLocked > 0 && tier !== TIERS.VIP && (
        <div className="telemetry-panel" style={{ borderRadius: '14px', padding: '14px 18px' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '8px' }}>
            🔒 {view.totalLocked} Sinyal Baru Menunggu Masa Tayang
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.6 }}>
            Sinyal ini sudah keluar untuk member VIP, tapi baru bisa Anda lihat setelah masa tayang tier {features.label} selesai.
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {view.locked.slice(0, 8).map((l, i) => (
              <span key={i} style={{
                fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '4px 10px', borderRadius: '6px',
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24',
              }}>
                {l.plan.clean_ticker || '?'} · {l.hoursUntil}h lagi
              </span>
            ))}
            {view.locked.length > 8 && (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                +{view.locked.length - 8} lainnya
              </span>
            )}
          </div>
        </div>
      )}

      {/* ===== HONESTY FOOTER ===== */}
      <div style={{
        background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.28)',
        borderRadius: '10px', padding: '12px 16px', fontSize: '10.5px', color: '#fb7185', lineHeight: 1.7,
      }}>
        <strong>⚠️ PERINGATAN:</strong> Sinyal di halaman ini adalah <strong>hasil screening algoritmik</strong>,
        bukan nasihat investasi dan bukan ajakan membeli. Semua trading mengandung risiko kehilangan modal.
        Angka Entry / Stop Loss / Target adalah level perencanaan, <strong>bukan jaminan</strong> harga akan bergerak ke sana.
        Selalu lakukan verifikasi mandiri dan gunakan manajemen risiko yang sesuai.
      </div>
    </div>
  );
}
