import React, { useMemo, useState, useEffect } from 'react';
import {
  ACHIEVEMENT_CATEGORY,
  buildAchievementBoard,
  legendEligible,
  eligibilityMessage,
  loadAchievementContext,
  recordActiveDay,
} from '../services/achievements.js';
import { TIER, PLANS, monthlyEquivalent } from '../services/featureAccess.js';

/**
 * Legend — the earned tier.
 *
 * OWNER'S DESIGN (2026-10-08):
 *   "sudah masuk level tertentu, baru bisa upgrade... jadi nanti level pro ada
 *    level nya... seperti game solo leveling.. bisa gak???"
 *   "aktivitas dan achievement"
 *   "langganan aja, dan sifatnya per minggu"
 *
 * So this page does two jobs that are really one: it shows the user HOW FAR they
 * are from the tier that can place orders, and it is the only place LEGEND can
 * be activated from. There is no "buy" button, because paying is not the gate —
 * the achievements are, and the subscription is the prerequisite.
 *
 * WHY EARNED, RESTATED FOR THE UI: LEGEND is the only tier that can spend the
 * user's money through their own API key. The achievements encode the skills
 * that make that safe. The page says this plainly rather than dressing it up as
 * a game, because a user who understands WHY will complete the list instead of
 * trying to skip it.
 */

/** One achievement row: icon, name, requirement, progress bar. */
function AchievementRow({ item }) {
  const pct = Math.round(item.ratio * 100);
  const shown = Math.min(item.current, item.target);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '11px',
      padding: '10px 12px',
      borderRadius: '9px',
      background: item.unlocked ? 'rgba(46, 230, 168, 0.07)' : 'var(--bg-panel-subtle)',
      border: item.unlocked ? '1px solid rgba(46, 230, 168, 0.30)' : 'var(--border-hairline)',
    }}>
      <span style={{ fontSize: '20px', flexShrink: 0, opacity: item.unlocked ? 1 : 0.55 }}>
        {item.unlocked ? '✅' : item.icon}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {item.name}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {item.category}
          </span>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.5 }}>
          {item.desc}
        </div>

        {/* Progress bar. The numbers come from the real counter, so a user who
            has done nothing sees 0; not a flattering placeholder. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
          <div style={{
            flex: 1, height: '5px', borderRadius: '3px',
            background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
          }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: item.unlocked ? 'var(--accent-green)' : 'var(--accent-blue)',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{
            fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700,
            color: item.unlocked ? 'var(--accent-green)' : 'var(--text-muted)',
            whiteSpace: 'nowrap',
          }}>
            {shown}/{item.target} {item.unit}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AchievementsPage({ account = {}, userTier = TIER.GUEST, isAdmin = false, onNavigate, onOpenPredictionModal }) {
  const [ctx, setCtx] = useState(() => loadAchievementContext());

  // Opening this page counts as a day of activity. It is the user's own action,
  // which is exactly what the counter is meant to record.
  useEffect(() => {
    recordActiveDay();
    setCtx(loadAchievementContext());
  }, []);

  const board = useMemo(() => buildAchievementBoard(ctx), [ctx]);
  const gate = useMemo(() => legendEligible(ctx, userTier, isAdmin), [ctx, userTier, isAdmin]);
  const legendPlan = PLANS.find(p => p.id === TIER.LEGEND);

  const grouped = useMemo(() => {
    const out = {};
    for (const item of board.items) {
      (out[item.category] = out[item.category] || []).push(item);
    }
    return out;
  }, [board]);

  const alreadyLegend = userTier === TIER.LEGEND || isAdmin;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>

      {/* ---------- HEADER ---------- */}
      <div className="telemetry-panel" style={{ padding: '16px 18px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>
              🏆 Legend Path
            </h2>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.6, maxWidth: '640px' }}>
              Legend adalah satu-satunya paket yang bisa mengeksekusi order memakai API key Anda.
              Karena itu tidak bisa dibeli langsung, harus dibuka lewat kemampuan yang terbukti.
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: board.allUnlocked ? 'var(--accent-green)' : 'var(--accent-blue)' }}>
              {board.unlockedCount}/{board.total}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>achievement selesai</div>
          </div>
        </div>

        {/* Overall bar */}
        <div style={{ marginTop: '13px', height: '7px', borderRadius: '4px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.round(board.completion * 100)}%`, height: '100%',
            background: board.allUnlocked ? 'var(--accent-green)' : 'var(--accent-blue)',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* ---------- ARENA PREDIKSI STRATEGI CALLOUT ---------- */}
      <div className="telemetry-panel" style={{
        padding: '14px 18px',
        borderRadius: '12px',
        background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.12) 0%, rgba(30, 41, 59, 0.25) 100%)',
        border: '1px solid rgba(234, 179, 8, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '26px' }}>🎯</span>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 900, color: 'var(--accent-gold)' }}>
              Arena Tebak Chart & Uji Strategi
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Makin sering analisa chart Anda terverifikasi benar, makin tinggi poin kuantitatif Anda menuju LEGEND.
            </div>
          </div>
        </div>
        <button
          id="btn-open-prediction-modal-achievements"
          onClick={() => onOpenPredictionModal && onOpenPredictionModal()}
          style={{
            padding: '8px 16px',
            background: 'var(--accent-gold, #facc15)',
            color: '#000000',
            border: 'none',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: 900,
            cursor: 'pointer',
            letterSpacing: '0.03em',
          }}
        >
          🚀 Buka Arena Prediksi (+Poin)
        </button>
      </div>

      {/* ---------- THE GATE ---------- */}
      <div className="telemetry-panel" style={{
        padding: '15px 18px', borderRadius: '12px',
        background: gate.eligible ? 'rgba(46, 230, 168, 0.06)' : 'var(--bg-panel)',
        border: gate.eligible ? '1px solid rgba(46, 230, 168, 0.35)' : 'var(--border-hairline)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '22px' }}>{alreadyLegend ? '👑' : gate.eligible ? '🔓' : '🔒'}</span>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)' }}>
              {alreadyLegend ? 'Legend sudah aktif' : gate.eligible ? 'Legend siap diaktifkan' : 'Legend belum terbuka'}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.6 }}>
              {alreadyLegend
                ? 'Bot trading dan Jev Execution HUD terbuka untuk akun ini.'
                : eligibilityMessage(gate)}
            </div>
          </div>

          {gate.eligible && !alreadyLegend && (
            <button
              onClick={() => onNavigate && onNavigate('SUBSCRIPTION')}
              style={{
                padding: '10px 20px', borderRadius: '9px', fontSize: '12.5px', fontWeight: 800,
                background: 'var(--accent-green)', color: '#04140d', border: 'none', cursor: 'pointer',
              }}
            >
              Aktifkan Legend
            </button>
          )}

          {!gate.eligible && gate.reason === 'not_pro' && (
            <button
              onClick={() => onNavigate && onNavigate('SUBSCRIPTION')}
              style={{
                padding: '10px 20px', borderRadius: '9px', fontSize: '12.5px', fontWeight: 800,
                background: 'var(--accent-blue)', color: '#fff', border: 'none', cursor: 'pointer',
              }}
            >
              Mulai dari Pro
            </button>
          )}
        </div>
      </div>

      {/* ---------- ACHIEVEMENTS, GROUPED ---------- */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="telemetry-panel" style={{ padding: '14px 16px', borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            {category === ACHIEVEMENT_CATEGORY.ACTIVITY && '📅 Aktivitas'}
            {category === ACHIEVEMENT_CATEGORY.SKILL && '🛠️ Kemampuan'}
            {category === ACHIEVEMENT_CATEGORY.MILESTONE && '🎯 Pencapaian'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {items.map(item => <AchievementRow key={item.id} item={item} />)}
          </div>
        </div>
      ))}

      {/* ---------- PRICING ---------- */}
      <div className="telemetry-panel" style={{ padding: '15px 18px', borderRadius: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '10px' }}>
          Harga Legend
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '26px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {legendPlan?.price}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{legendPlan?.period}</span>
          {monthlyEquivalent(75000) && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              (setara {`Rp ${monthlyEquivalent(75000).toLocaleString('id-ID')}`} per bulan)
            </span>
          )}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.7 }}>
          Ditagih mingguan supaya bisa dicoba tanpa komitmen panjang.
        </div>
      </div>

      {/* ---------- RISK DISCLOSURE ---------- */}
      <div className="telemetry-panel" style={{
        padding: '13px 16px', borderRadius: '12px',
        background: 'rgba(255, 180, 84, 0.06)', border: '1px solid rgba(255, 180, 84, 0.28)',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '5px' }}>
          ⚠️ Baca sebelum mengaktifkan
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Bot trading ini mengeksekusi order di akun bursa Anda memakai API key yang Anda berikan sendiri.
          Hasil masa lalu tidak menjamin hasil ke depan. Selalu uji di testnet lebih dulu, dan jangan
          aktifkan bot dengan dana yang tidak siap Anda risikokan.
        </div>
      </div>
    </div>
  );
}
