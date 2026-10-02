import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { buildScanUniverse } from '../services/memecoinDesk.js';
import { analyzeToken, buildDummyPlan, rankCandidates } from '../services/earlySignal.js';

function fmtUsd(v) {
  if (v === null || v === undefined) return '-';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function fmtPrice(v) {
  if (!v) return '-';
  if (v >= 1000) return `$${Math.round(v).toLocaleString()}`;
  if (v >= 1) return `$${v.toFixed(4)}`;
  if (v >= 0.0001) return `$${v.toFixed(7)}`;
  return `$${v.toExponential(3)}`;
}

function fmtAge(min) {
  if (min === null || min === undefined) return '-';
  if (min < 60) return `${min}m`;
  if (min < 1440) return `${Math.floor(min / 60)}j ${min % 60}m`;
  return `${Math.floor(min / 1440)}h`;
}

const VERDICT = {
  HIGH_RISK: { color: '#fb7185', bg: 'rgba(244,63,94,0.14)', border: 'rgba(244,63,94,0.4)', label: '🚨 RISIKO TINGGI' },
  CAUTION: { color: '#fbbf24', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.4)', label: '⚠️ WASPADA' },
  CLEAN: { color: '#34d399', bg: 'rgba(16,185,129,0.14)', border: 'rgba(16,185,129,0.4)', label: '✅ RELATIF BERSIH' },
};

/**
 * MemecoinRadar — early-signal scanner with evidence-based scoring.
 *
 * DELIBERATE DESIGN CHOICE: this shows the full scoring breakdown rather than a
 * single "buy" verdict. The user can see exactly which measurements produced the
 * score, and which risks are present. Hiding that would make it a black box,
 * which is how signal groups mislead people.
 */
export default function MemecoinRadar() {
  const [scannable, setScannable] = useState([]);
  const [noPair, setNoPair] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selected, setSelected] = useState(null);
  const [capital, setCapital] = useState(1000);
  const [minScore, setMinScore] = useState(0);
  const [showHighRisk, setShowHighRisk] = useState(false);

  const scan = useCallback(async () => {
    setError('');
    try {
      const { scannable: rows, noPair: unpairable, totalActive } = await buildScanUniverse();
      const analyzed = rows.map(({ token, pair }) => ({
        token,
        pair,
        analysis: analyzeToken(pair, token.curve),
      }));
      setScannable(rankCandidates(analyzed));
      setNoPair(unpairable);
      setLastUpdate(new Date());
      if (totalActive === 0) setError('pump.fun tidak mengembalikan token aktif saat ini.');
    } catch (e) {
      setError(`Pemindaian gagal: ${e?.message || 'error jaringan'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    scan();
    const t = setInterval(scan, 45000);
    return () => clearInterval(t);
  }, [scan]);

  const visible = useMemo(
    () => scannable.filter(r => r.analysis.score >= minScore && (showHighRisk || r.analysis.verdict !== 'HIGH_RISK')),
    [scannable, minScore, showHighRisk]
  );

  const plan = useMemo(() => {
    if (!selected?.pair) return null;
    return buildDummyPlan(selected.pair, selected.analysis, { capitalUsd: capital, riskPct: 0.01 });
  }, [selected, capital]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ===== HONESTY HEADER — non-negotiable ===== */}
      <div className="telemetry-panel" style={{ padding: '16px 20px', borderRadius: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '20px' }}>🎯</span>
          <span style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '-0.01em' }}>
            EARLY SIGNAL RADAR — DETEKSI DINI BERBASIS BUKTI
          </span>
          <span style={{
            fontSize: '9.5px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px',
            background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.35)'
          }}>
            BUKAN PREDIKSI
          </span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Memindai token Solana yang sedang aktif diperdagangkan · {scannable.length} teranalisis
          {noPair.length > 0 && ` · ${noPair.length} belum punya pair DEX`}
          {lastUpdate && ` · update ${lastUpdate.toLocaleTimeString('id-ID')}`}
        </div>
      </div>

      <div style={{
        background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)',
        borderRadius: '10px', padding: '12px 16px', fontSize: '11px', color: '#fb7185', lineHeight: 1.7
      }}>
        <strong>⚠️ BACA INI SEBELUM MEMAKAI ANGKA APA PUN DI HALAMAN INI:</strong>
        <div style={{ marginTop: '4px' }}>
          Tidak ada sistem mana pun — termasuk ini — yang bisa memprediksi memecoin akan naik puluhan ribu persen.
          Yang diukur di sini hanyalah <strong>bukti aktivitas nyata saat ini</strong>: tekanan beli, akselerasi volume,
          kedalaman likuiditas, dan progres bonding curve. Skor tinggi berarti
          <em> "ada aktivitas beli terukur"</em>, <strong>BUKAN</strong> <em>"harga akan naik"</em>.
          Mayoritas token yang menunjukkan sinyal ini tetap berakhir nol.
          Semua rencana entry di bawah adalah <strong>SIMULASI</strong> — tidak ada order yang dikirim dan tidak ada dompet yang disentuh.
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '10px', padding: '10px 14px', fontSize: '11px', color: '#fbbf24' }}>
          📡 {error}
        </div>
      )}

      {/* ===== CONTROLS ===== */}
      <div className="telemetry-panel" style={{ padding: '10px 16px', borderRadius: '12px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>
          Skor minimum
          <select value={minScore} onChange={e => setMinScore(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>
            {[0, 20, 40, 60].map(s => <option key={s} value={s}>{s}+</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showHighRisk} onChange={e => setShowHighRisk(e.target.checked)} />
          Tampilkan yang Risiko Tinggi
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>
          Modal simulasi $
          <input
            type="number" min="10" step="100" value={capital}
            onChange={e => setCapital(Math.max(10, Number(e.target.value) || 0))}
            style={{ width: '90px', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}
          />
        </label>
        <button className="telemetry-btn" onClick={scan} style={{ fontSize: '11px', padding: '5px 12px', marginLeft: 'auto' }}>
          🔄 Pindai Ulang
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? 'minmax(0,1fr) 400px' : '1fr', gap: '12px', alignItems: 'start' }}>

        {/* ===== SCAN RESULTS ===== */}
        <div className="telemetry-panel" style={{ borderRadius: '14px', overflow: 'hidden' }}>
          <div className="telemetry-header">
            <span>📡 HASIL PEMINDAIAN — {visible.length} token</span>
            {loading && <span style={{ color: '#38bdf8', fontSize: '10px' }}>memindai… (butuh ~5 detik)</span>}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="telemetry-table" style={{ minWidth: '820px' }}>
              <thead>
                <tr>
                  <th>Token</th>
                  <th style={{ textAlign: 'center' }}>Skor Bukti</th>
                  <th style={{ textAlign: 'right' }}>Beli/Jual 1j</th>
                  <th style={{ textAlign: 'right' }}>Aksel. Volume</th>
                  <th style={{ textAlign: 'right' }}>Likuiditas</th>
                  <th style={{ textAlign: 'right' }}>Curve</th>
                  <th style={{ textAlign: 'right' }}>Umur</th>
                  <th>Penilaian</th>
                </tr>
              </thead>
              <tbody>
                {visible.slice(0, 30).map(row => {
                  const a = row.analysis;
                  const v = VERDICT[a.verdict];
                  const isSel = selected?.token?.mint === row.token.mint;
                  return (
                    <tr
                      key={row.token.mint}
                      onClick={() => setSelected(row)}
                      style={{ cursor: 'pointer', background: isSel ? 'rgba(99,102,241,0.12)' : undefined }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          {row.token.icon
                            ? <img src={row.token.icon} alt="" width={22} height={22} style={{ borderRadius: '50%', objectFit: 'cover' }}
                                onError={e => { e.currentTarget.style.display = 'none'; }} />
                            : <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'inline-block' }} />}
                          <div>
                            <div style={{ fontWeight: '800', fontSize: '12px' }}>${row.token.symbol}</div>
                            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{fmtUsd(row.token.mcapUsd)} mcap</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', minWidth: '38px', padding: '3px 7px', borderRadius: '6px',
                          fontFamily: 'var(--font-mono)', fontWeight: '900', fontSize: '13px',
                          background: a.score >= 55 ? 'rgba(16,185,129,0.18)' : a.score >= 30 ? 'rgba(245,158,11,0.16)' : 'rgba(255,255,255,0.06)',
                          color: a.score >= 55 ? '#34d399' : a.score >= 30 ? '#fbbf24' : 'var(--text-muted)'
                        }}>
                          {a.score}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11.5px', fontWeight: '700', color: a.metrics.ratio1h >= 1.5 ? '#34d399' : a.metrics.ratio1h !== null && a.metrics.ratio1h < 0.7 ? '#fb7185' : undefined }}>
                        {a.metrics.ratio1h === null ? '∞' : `${a.metrics.ratio1h}x`}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                        {a.metrics.volumeAccel}x
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: a.metrics.liquidityUsd < 10000 ? '#fb7185' : undefined }}>
                        {fmtUsd(a.metrics.liquidityUsd)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                        {a.metrics.curveProgress === null ? '-' : `${a.metrics.curveProgress}%`}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {fmtAge(a.metrics.ageMinutes)}
                      </td>
                      <td>
                        <span className="badge" style={{ background: v.bg, color: v.color, borderColor: v.border, fontSize: '9px' }}>
                          {v.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!loading && visible.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '26px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      Tidak ada token yang lolos filter. Pindai ulang, atau turunkan skor minimum.
                      <div style={{ marginTop: '6px', fontSize: '10.5px' }}>
                        Ini normal — mayoritas token baru memang tidak punya bukti akumulasi apa pun.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {noPair.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '10.5px', color: 'var(--text-muted)' }}>
              ℹ️ {noPair.length} token aktif belum punya pair DEX (masih di bonding curve), jadi belum bisa dianalisis —
              pump.fun tidak menyediakan data beli/jual/volume. Token ini tidak ditampilkan agar tidak ada angka karangan.
            </div>
          )}
        </div>

        {/* ===== DETAIL + DUMMY PLAN ===== */}
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '12px' }}>
            <div className="telemetry-panel" style={{ borderRadius: '14px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '900' }}>${selected.token.symbol}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{selected.token.name}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
              </div>

              {/* Score breakdown — every point traceable */}
              <div style={{ fontSize: '11px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                RINCIAN SKOR (setiap poin bisa ditelusuri):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                {selected.analysis.factors.length === 0 && (
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Tidak ada faktor positif maupun negatif terdeteksi.</div>
                )}
                {selected.analysis.factors.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', gap: '8px',
                    fontSize: '10.5px', padding: '5px 8px', borderRadius: '6px',
                    background: f.points > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
                    border: `1px solid ${f.points > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: f.points > 0 ? '#34d399' : '#fb7185', flexShrink: 0 }}>
                      {f.points > 0 ? '+' : ''}{f.points}
                    </span>
                  </div>
                ))}
              </div>

              {selected.analysis.riskFlags.length > 0 && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: '800', marginBottom: '6px', color: '#fb7185' }}>
                    ⚠️ RISIKO TERDETEKSI:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '12px' }}>
                    {selected.analysis.riskFlags.map((r, i) => (
                      <div key={i} style={{ fontSize: '10.5px', color: '#fb7185', lineHeight: 1.5 }}>• {r}</div>
                    ))}
                  </div>
                </>
              )}

              {/* Raw metrics table */}
              <div style={{ fontSize: '11px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                DATA MENTAH YANG DIUKUR:
              </div>
              <table className="telemetry-table" style={{ fontSize: '10.5px' }}>
                <tbody>
                  {[
                    ['Harga sekarang', fmtPrice(parseFloat(selected.pair.priceUsd || 0))],
                    ['Beli / Jual (1 jam)', `${selected.analysis.metrics.buys1h} / ${selected.analysis.metrics.sells1h}`],
                    ['Volume 1j / 24j', `${fmtUsd(selected.analysis.metrics.volume1h)} / ${fmtUsd(selected.analysis.metrics.volume24h)}`],
                    ['Likuiditas', fmtUsd(selected.analysis.metrics.liquidityUsd)],
                    ['Perubahan 1j / 24j', `${selected.analysis.metrics.change1h ?? '-'}% / ${selected.analysis.metrics.change24h ?? '-'}%`],
                    ['Turnover', `${selected.analysis.metrics.turnover}x`],
                    ['Progres curve', selected.analysis.metrics.curveProgress === null ? 'tidak tersedia' : `${selected.analysis.metrics.curveProgress}%`],
                    ['Umur pair', fmtAge(selected.analysis.metrics.ageMinutes)],
                  ].map(([k, val]) => (
                    <tr key={k}>
                      <td style={{ color: 'var(--text-muted)' }}>{k}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <a
                href={selected.pair.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: '10px', fontSize: '10.5px', color: '#38bdf8', fontWeight: '700', textDecoration: 'none' }}
              >
                Verifikasi sendiri di DexScreener ↗
              </a>
            </div>

            {/* ===== DUMMY ENTRY PLAN ===== */}
            <div className="telemetry-panel" style={{ borderRadius: '14px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px' }}>🧪</span>
                <span style={{ fontSize: '12px', fontWeight: '900' }}>RENCANA ENTRY SIMULASI</span>
                <span style={{
                  fontSize: '8.5px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px',
                  background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)'
                }}>
                  DUMMY / BUKAN ORDER NYATA
                </span>
              </div>

              {!plan ? (
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  Harga token tidak valid, rencana tidak bisa dihitung.
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.6 }}>
                    Semua angka dihitung dari volatilitas nyata token (1j & 24j) dan risiko 1% dari modal simulasi {fmtUsd(capital)}.
                    Stop loss = {plan.volatilityPct}% di bawah entry.
                  </div>

                  <table className="telemetry-table" style={{ fontSize: '11px' }}>
                    <tbody>
                      <tr>
                        <td style={{ color: '#38bdf8', fontWeight: '700' }}>Entry</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800' }}>{fmtPrice(plan.entry)}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#fb7185', fontWeight: '700' }}>Stop Loss</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#fb7185' }}>
                          {fmtPrice(plan.stopLoss)} <span style={{ fontSize: '9.5px', opacity: 0.8 }}>(-{plan.stopDistancePct}%)</span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: '#34d399', fontWeight: '700' }}>Target 1 (1.5R)</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#34d399' }}>{fmtPrice(plan.takeProfit1)}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#34d399', fontWeight: '700' }}>Target 2 (3R)</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#34d399' }}>{fmtPrice(plan.takeProfit2)}</td>
                      </tr>
                      <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <td style={{ color: 'var(--text-muted)' }}>Ukuran posisi</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                          {plan.units.toLocaleString('en-US', { maximumFractionDigits: 2 })} unit ({fmtUsd(plan.positionUsd)})
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-muted)' }}>Risiko maksimal</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#fb7185' }}>
                          {fmtUsd(Math.abs(plan.lossAtSlUsd))} ({plan.actualRiskPct}% modal)
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-muted)' }}>Potensi cuan TP1 / TP2</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#34d399' }}>
                          {fmtUsd(plan.gainAtTp1Usd)} / {fmtUsd(plan.gainAtTp2Usd)}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--text-muted)' }}>Rasio R:R</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{plan.rrRatio}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{
                    marginTop: '10px', padding: '8px 10px', borderRadius: '6px',
                    background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
                    fontSize: '10px', color: '#fb7185', lineHeight: 1.6
                  }}>
                    Memecoin bisa turun 100% dalam hitungan detik dan stop loss <strong>tidak selalu tereksekusi</strong>
                    saat likuiditas kering. Angka di atas adalah simulasi matematis, bukan jaminan.
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
