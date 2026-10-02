import React, { useState, useEffect, useCallback } from 'react';
import {
  TRACKED_CHAINS,
  fetchPumpFunLaunches,
  fetchBoostedTokens,
  pairAgeMinutes,
} from '../services/memecoinDesk.js';

/** Format a USD number compactly for tight table cells. */
function fmtUsd(v) {
  if (!v && v !== 0) return '-';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function fmtPrice(v) {
  if (!v) return '-';
  if (v >= 1000) return `$${Math.round(v).toLocaleString()}`;
  if (v >= 1) return `$${v.toFixed(3)}`;
  if (v >= 0.0001) return `$${v.toFixed(6)}`;
  return `$${v.toExponential(3)}`;
}

function fmtAge(minutes) {
  if (minutes === null || minutes === undefined) return '-';
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}j`;
  return `${Math.floor(minutes / 1440)}h`;
}

const VERDICT_STYLE = {
  HIGH_RISK: { bg: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: 'rgba(244, 63, 94, 0.4)', label: '🚨 RISIKO TINGGI' },
  CAUTION: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)', label: '⚠️ WASPADA' },
  CLEAN: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.4)', label: '✅ RELATIF AMAN' },
};

/**
 * DegenDesk — multi-chain memecoin radar with rug-check.
 *
 * Deliberately analysis-only: it never signs or submits a transaction.
 * Sending requires server-side signing or an explicit wallet approval flow.
 */
export default function DegenDesk({ onOpenSwap }) {
  const [launches, setLaunches] = useState([]);
  const [boosted, setBoosted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [minProgress, setMinProgress] = useState(0);
  const [hideHighRisk, setHideHighRisk] = useState(true);

  const load = useCallback(async () => {
    setError('');
    // Promise.allSettled: a pump.fun outage must not blank the boosted board.
    const [pumpRes, boostRes] = await Promise.allSettled([
      fetchPumpFunLaunches(),
      fetchBoostedTokens(),
    ]);
    if (pumpRes.status === 'fulfilled') setLaunches(pumpRes.value);
    else setError(`Gagal memuat pump.fun: ${pumpRes.reason?.message || 'error'}`);
    if (boostRes.status === 'fulfilled') setBoosted(boostRes.value);
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const visible = launches.filter(t => {
    if (hideHighRisk && t.rug.verdict === 'HIGH_RISK') return false;
    if (t.progress < minProgress) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div className="telemetry-panel" style={{
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        borderRadius: '14px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🎰</span>
            <span style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '-0.01em' }}>
              DEGEN DESK — MULTI-CHAIN MEMECOIN RADAR
            </span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
            pump.fun live launches + DexScreener boosted board · Solana / Robinhood Chain / BSC-Aster / HyperEVM
            {lastUpdate && ` · update ${lastUpdate.toLocaleTimeString('id-ID')}`}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: '700', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={hideHighRisk} onChange={e => setHideHighRisk(e.target.checked)} />
            Sembunyikan Risiko Tinggi
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: '700', color: 'var(--text-secondary)' }}>
            Min. Curve
            <select
              value={minProgress}
              onChange={e => setMinProgress(Number(e.target.value))}
              style={{ padding: '3px 6px', borderRadius: '6px', fontSize: '10.5px' }}
            >
              {[0, 10, 25, 50].map(p => <option key={p} value={p}>{p}%</option>)}
            </select>
          </label>
          <button className="telemetry-btn" onClick={load} style={{ fontSize: '10.5px', padding: '5px 10px' }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Danger banner — non-negotiable honesty about what this data is */}
      <div style={{
        background: 'rgba(244, 63, 94, 0.08)',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '10.5px',
        color: '#fb7185',
        lineHeight: 1.6
      }}>
        <strong>⚠️ PERINGATAN KERAS:</strong> 98% memecoin baru adalah rug pull. Pemeriksaan di bawah hanya membaca data publik
        on-chain (likuiditas, bonding curve, sosial media) — <strong>bukan jaminan keamanan dan bukan ajakan membeli</strong>.
        Desk ini <strong>tidak menandatangani atau mengirim transaksi apa pun</strong>. Selalu verifikasi mandiri, dan jangan
        pernah memasukkan uang yang kamu tidak siap kehilangan 100%.
      </div>

      {error && (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '10px', padding: '10px 14px', fontSize: '11px', color: '#fbbf24' }}>
          📡 {error}
        </div>
      )}

      {/* New Launches Table */}
      <div className="telemetry-panel" style={{ borderRadius: '14px', overflow: 'hidden' }}>
        <div className="telemetry-header">
          <span>🚀 PELUNCURAN BARU (pump.fun Live) — {visible.length} token</span>
          {loading && <span style={{ color: '#38bdf8', fontSize: '10px' }}>memuat…</span>}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="telemetry-table" style={{ minWidth: '860px' }}>
            <thead>
              <tr>
                <th>Token</th>
                <th>Umur</th>
                <th style={{ textAlign: 'right' }}>Market Cap</th>
                <th style={{ textAlign: 'right' }}>Bonding Curve</th>
                <th>Pemeriksaan Keamanan</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, 25).map(t => {
                const v = VERDICT_STYLE[t.rug.verdict];
                return (
                  <tr key={t.mint}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        {t.icon
                          ? <img src={t.icon} alt="" width={22} height={22}
                              style={{ borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.05)' }}
                              onError={e => { e.currentTarget.style.display = 'none'; }} />
                          : <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'inline-block' }} />}
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '12px' }}>${t.symbol}</div>
                          <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{fmtAge(t.ageMinutes)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: '700' }}>
                      {fmtUsd(t.mcapUsd)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <div style={{ width: '54px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${t.progress}%`,
                            height: '100%',
                            background: t.progress >= 100 ? '#10b981' : t.progress > 50 ? '#38bdf8' : '#f59e0b'
                          }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', fontWeight: '700', minWidth: '32px' }}>
                          {t.progress}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: v.bg, color: v.color, borderColor: v.border, fontSize: '9px' }}>
                        {v.label}
                      </span>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px', maxWidth: '230px', whiteSpace: 'normal', lineHeight: 1.4 }}>
                        {t.rug.flags.slice(0, 2).map((f, i) => <div key={i}>• {f.text}</div>)}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <a
                        href={t.pumpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '10px', color: '#c084fc', fontWeight: '700', textDecoration: 'none' }}
                      >
                        pump.fun ↗
                      </a>
                    </td>
                  </tr>
                );
              })}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                    Tidak ada token yang lolos filter saat ini. Coba turunkan filter atau matikan "Sembunyikan Risiko Tinggi".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Boosted board = what's being paid-shilled right now */}
      <div className="telemetry-panel" style={{ borderRadius: '14px', overflow: 'hidden' }}>
        <div className="telemetry-header">
          <span>📣 TOKEN DI-PROMOSIKAN (DexScreener Boosts) — {boosted.length} token</span>
          <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
            Boost = promosi berbayar, bukan sinyal beli
          </span>
        </div>
        <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
          {boosted.slice(0, 12).map(b => {
            const chain = TRACKED_CHAINS[b.chain] || { label: b.chain, icon: '🔗', color: '#94a3b8' };
            return (
              <div key={b.address} style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: chain.color }}>
                    {chain.icon} {chain.label}
                  </span>
                  <span style={{
                    fontSize: '9px', fontWeight: '700', fontFamily: 'var(--font-mono)',
                    background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px'
                  }}>
                    boost {b.boostAmount}
                  </span>
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: 1.45, maxHeight: '58px', overflow: 'hidden' }}>
                  {b.description}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a href={b.url} target="_blank" rel="noopener noreferrer"
                     style={{ fontSize: '9.5px', color: '#38bdf8', fontWeight: '700', textDecoration: 'none' }}>
                    Chart ↗
                  </a>
                  {b.links.filter(l => l.type === 'twitter').map((l, i) => (
                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                       style={{ fontSize: '9.5px', color: '#c084fc', fontWeight: '700', textDecoration: 'none' }}>
                      X ↗
                    </a>
                  ))}
                  {b.links.filter(l => l.url && !l.type).slice(0, 1).map((l, i) => (
                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                       style={{ fontSize: '9.5px', color: '#34d399', fontWeight: '700', textDecoration: 'none' }}>
                      Site ↗
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
          {!loading && boosted.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', padding: '8px' }}>
              Tidak ada data boost yang bisa dimuat.
            </div>
          )}
        </div>
      </div>

      {/* Routing info — what it would take to actually trade each chain */}
      <div className="telemetry-panel" style={{ borderRadius: '14px', padding: '14px 18px' }}>
        <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '8px' }}>
          🔌 RUTE EKSEKUSI (status integrasi sebenarnya)
        </div>
        <table className="telemetry-table" style={{ fontSize: '11px' }}>
          <thead>
            <tr>
              <th>Chain</th>
              <th>Router / DEX</th>
              <th>Status di Cockpit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>🟣 Solana</td>
              <td>Jupiter Aggregator</td>
              <td><span className="badge badge-alert" style={{ fontSize: '9px' }}>DEMO — belum menandatangani tx</span></td>
            </tr>
            <tr>
              <td>🪶 Robinhood Chain</td>
              <td>DEX native (Uniswap V3 fork per DexScreener)</td>
              <td><span className="badge" style={{ fontSize: '9px' }}>HANYA RADAR DATA</span></td>
            </tr>
            <tr>
              <td>🟡 BSC / ⚡ HyperEVM</td>
              <td>Aster DEX (perpetual & spot)</td>
              <td><span className="badge" style={{ fontSize: '9px' }}>HANYA RADAR DATA</span></td>
            </tr>
          </tbody>
        </table>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 }}>
          Eksekusi nyata di Solana memerlukan server penandatanganan (private key tidak boleh ada di browser)
          atau persetujuan dompet lewat Jupiter. Robinhood Chain dan Aster belum punya adapter — keduanya
          masih radar pasif sampai adapter dan izin API-nya dibangun.
        </div>
      </div>
    </div>
  );
}
