import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { buildScanUniverse, PUMPFUN_PAGE_SIZE } from '../services/memecoinDesk.js';
import { analyzeToken, buildDummyPlan, rankCandidates, checkLaunchWindow, LAUNCH_WINDOW } from '../services/earlySignal.js';

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
  CAUTION: { color: 'var(--accent-gold-bright)', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.4)', label: '⚠️ WASPADA' },
  CLEAN: { color: 'var(--accent-mint)', bg: 'rgba(16,185,129,0.14)', border: 'rgba(16,185,129,0.4)', label: '✅ RELATIF BERSIH' },
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
  const [jupiterHits, setJupiterHits] = useState(0);
  const [boostedCount, setBoostedCount] = useState(0);
  const [onlyQualified, setOnlyQualified] = useState(false);
  // Scan pool size in pump.fun pages (70 tokens each). All sources are free —
  // a larger pool costs more requests, not more money.
  const [scanPages, setScanPages] = useState(2);

  const scan = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const { scannable: rows, noPair: unpairable, totalActive, jupiterHits, boostedCount } = await buildScanUniverse(scanPages);
      const analyzed = rows.map(({ token, pair, jupiter, boostAmount }) => {
        const analysis = analyzeToken(pair, token.curve, jupiter);
        return {
          token,
          pair,
          jupiter,
          boostAmount: boostAmount || 0,
          analysis,
          launchWindow: checkLaunchWindow(analysis),
        };
      });
      setScannable(rankCandidates(analyzed));
      setNoPair(unpairable);
      setJupiterHits(jupiterHits ?? 0);
      setBoostedCount(boostedCount ?? 0);
      setNoPair(unpairable);
      setJupiterHits(jupiterHits ?? 0);
      setBoostedCount(boostedCount ?? 0);
      setLastUpdate(new Date());
      if (totalActive === 0) setError('pump.fun tidak mengembalikan token aktif saat ini.');
    } catch (e) {
      setError(`Pemindaian gagal: ${e?.message || 'error jaringan'}`);
    } finally {
      setLoading(false);
    }
  }, [scanPages]);

  useEffect(() => {
    scan();
    const t = setInterval(scan, 45000);
    return () => clearInterval(t);
  }, [scan]);

  const visible = useMemo(
    () => scannable.filter(r => {
      if (onlyQualified && !r.launchWindow.qualified) return false;
      if (r.analysis.score < minScore) return false;
      if (!showHighRisk && r.analysis.verdict === 'HIGH_RISK') return false;
      return true;
    }),
    [scannable, minScore, showHighRisk, onlyQualified]
  );

  const qualifiedCount = useMemo(
    () => scannable.filter(r => r.launchWindow.qualified).length,
    [scannable]
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
            EARLY SIGNAL RADAR : DETEKSI DINI BERBASIS BUKTI
          </span>
          <span style={{
            fontSize: '12px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px',
            background: 'rgba(56,189,248,0.15)', color: 'var(--accent-sky)', border: '1px solid rgba(56,189,248,0.35)'
          }}>
            BUKAN PREDIKSI
          </span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Memindai token Solana yang sedang aktif diperdagangkan · {scannable.length} teranalisis
          {qualifiedCount > 0 && ` · ${qualifiedCount} lolos semua kriteria`}
          {jupiterHits > 0 && ` · ${jupiterHits} dengan data holder & audit`}
          {boostedCount > 0 && ` · ${boostedCount} sedang promo berbayar`}
          {noPair.length > 0 && ` · ${noPair.length} belum punya pair DEX`}
          {lastUpdate && ` · update ${lastUpdate.toLocaleTimeString('id-ID')}`}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
          {[
            ['DexScreener', 'harga · volume · beli/jual', 'var(--accent-sky)'],
            ['Jupiter', 'holder · organik · audit', 'var(--accent-purple-light)'],
            ['pump.fun', 'bonding curve', 'var(--accent-gold)'],
          ].map(([name, desc, color]) => (
            <span key={name} style={{
              fontSize: '12px', padding: '3px 8px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}40`, color
            }}>
              <strong>{name}</strong> <span style={{ color: 'var(--text-muted)' }}>· {desc}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{
        background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)',
        borderRadius: '10px', padding: '12px 16px', fontSize: '12px', color: '#fb7185', lineHeight: 1.7
      }}>
        <strong>⚠️ BACA INI SEBELUM MEMAKAI ANGKA APA PUN DI HALAMAN INI:</strong>
        <div style={{ marginTop: '4px' }}>
          Tidak ada sistem mana pun (termasuk ini) yang bisa memprediksi memecoin akan naik puluhan ribu persen.
          Yang diukur di sini adalah <strong>bukti aktivitas nyata saat ini</strong>: tekanan beli, pertumbuhan holder,
          volume organik, kedalaman likuiditas, dan <strong>audit keamanan token</strong> (mint/freeze authority, konsentrasi holder, saldo dev).
          Skor tinggi berarti <em>"ada bukti akumulasi terukur"</em>, <strong>BUKAN</strong> <em>"harga akan naik"</em>.
          Mayoritas token yang menunjukkan sinyal ini tetap berakhir nol.
          Semua rencana entry di bawah adalah <strong>SIMULASI</strong> — tidak ada order yang dikirim dan tidak ada dompet yang disentuh.
        </div>
      </div>

      {/* ===== KOREKSI FILTER — ini yang membedakan dari saran medsos ===== */}
      <div style={{
        background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.3)',
        borderRadius: '10px', padding: '12px 16px', fontSize: '12px', lineHeight: 1.7, color: 'var(--text-secondary)'
      }}>
        <strong style={{ color: 'var(--accent-sky)' }}>📐 KENAPA FILTER "MCAP KECIL / LP KECIL / VOLUME KECIL" ITU BERBAHAYA:</strong>
        <div style={{ marginTop: '5px' }}>
          Saya uji saran itu ke data live dan hasilnya berlawanan:
        </div>
        <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
          <li><strong>MCap &lt; $35K</strong> — 62% token aktif masuk sini, dan <strong>7 dari 11</strong> token kecil yang diuji punya <strong>LP = $0</strong>. Tidak ada likuiditas = tidak bisa dijual.</li>
          <li><strong>LP &lt; $25K</strong> — <strong>11 dari 11</strong> token kecil sudah di bawah $25K. Filter ini tidak menyaring apa pun.</li>
          <li><strong>Volume &lt; $2.500</strong> — volume kecil bukan berarti "belum rame", tapi "tidak ada yang beli".</li>
        </ul>
        <div style={{ marginTop: '6px' }}>
          Target yang benar: token <strong>MUDA</strong> tapi sudah punya <strong>likuiditas nyata</strong> dan permintaan organik.
          Rentang yang dipakai radar ini: mcap <strong>${LAUNCH_WINDOW.minMcapUsd / 1000}K–${LAUNCH_WINDOW.maxMcapUsd / 1000}K</strong>,
          LP <strong>≥ ${LAUNCH_WINDOW.minLiquidityUsd / 1000}K</strong>, volume <strong>≥ ${LAUNCH_WINDOW.minVolume1hUsd / 1000}K/jam</strong>,
          umur <strong>≤ {LAUNCH_WINDOW.maxAgeMinutes / 60} jam</strong>.
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: 'var(--accent-gold-bright)' }}>
          📡 {error}
        </div>
      )}

      {/* ===== CONTROLS ===== */}
      <div className="telemetry-panel" style={{ padding: '10px 16px', borderRadius: '12px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: 'var(--accent-sky)' }}>
          📊 Jumlah token dipindai
          <select
            value={scanPages}
            onChange={e => setScanPages(Number(e.target.value))}
            style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}
          >
            <option value={1}>70 token (1 halaman) — cepat</option>
            <option value={2}>140 token (2 halaman)</option>
            <option value={4}>280 token (4 halaman)</option>
            <option value={8}>560 token (8 halaman) — maksimal</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
          Skor minimum
          <select value={minScore} onChange={e => setMinScore(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
            {[0, 20, 40, 60].map(s => <option key={s} value={s}>{s}+</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showHighRisk} onChange={e => setShowHighRisk(e.target.checked)} />
          Tampilkan yang Risiko Tinggi
        </label>
        <label style={{
          display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer',
          color: onlyQualified ? 'var(--accent-mint)' : 'var(--text-secondary)'
        }}>
          <input type="checkbox" checked={onlyQualified} onChange={e => setOnlyQualified(e.target.checked)} />
          HANYA yang lolos 9 kriteria ({qualifiedCount})
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
          Modal simulasi $
          <input
            type="number" min="10" step="100" value={capital}
            onChange={e => setCapital(Math.max(10, Number(e.target.value) || 0))}
            style={{ width: '90px', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}
          />
        </label>
        <button className="telemetry-btn" onClick={scan} disabled={loading} style={{ fontSize: '12px', padding: '5px 12px', marginLeft: 'auto', opacity: loading ? 0.6 : 1 }}>
          {loading ? '⏳ Memindai…' : '🔄 Pindai Ulang'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? 'minmax(0,1fr) 400px' : '1fr', gap: '12px', alignItems: 'start' }}>

        {/* ===== SCAN RESULTS ===== */}
        <div className="telemetry-panel" style={{ borderRadius: '14px', overflow: 'hidden' }}>
          <div className="telemetry-header">
            <span>
              📡 HASIL PEMINDAIAN : menampilkan {Math.min(visible.length, 200)} dari {visible.length} token
              {noPair.length > 0 && ` (+${noPair.length} tanpa pair DEX)`}
            </span>
            {loading && <span style={{ color: 'var(--accent-sky)', fontSize: '12px' }}>memindai {scanPages}×{PUMPFUN_PAGE_SIZE} token…</span>}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="telemetry-table" style={{ minWidth: '820px' }}>
              <thead>
                <tr>
                  <th>Token</th>
                  <th style={{ textAlign: 'center' }}>Skor</th>
                  <th style={{ textAlign: 'right' }}>Holder</th>
                  <th style={{ textAlign: 'right' }}>Δ Holder 1j</th>
                  <th style={{ textAlign: 'right' }}>Beli/Jual</th>
                  <th style={{ textAlign: 'right' }}>Likuiditas</th>
                  <th style={{ textAlign: 'right' }}>Top 10</th>
                  <th>Promo</th>
                  <th>Audit</th>
                  <th style={{ textAlign: 'center' }}>Kriteria</th>
                  <th>Penilaian</th>
                </tr>
              </thead>
              <tbody>
                {visible.slice(0, 200).map(row => {
                  const a = row.analysis;
                  const v = VERDICT[a.verdict];
                  const isSel = selected?.token?.mint === row.token.mint;
                  return (
                    <tr
                      key={row.token.mint}
                      tabIndex={0}
                      role="button"
                      onClick={() => setSelected(row)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelected(row);
                        }
                      }}
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
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fmtUsd(row.token.mcapUsd)} mcap</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', minWidth: '38px', padding: '3px 7px', borderRadius: '6px',
                          fontFamily: 'var(--font-mono)', fontWeight: '900', fontSize: '13px',
                          background: a.score >= 55 ? 'rgba(16,185,129,0.18)' : a.score >= 30 ? 'rgba(245,158,11,0.16)' : 'rgba(255,255,255,0.06)',
                          color: a.score >= 55 ? 'var(--accent-mint)' : a.score >= 30 ? 'var(--accent-gold-bright)' : 'var(--text-muted)'
                        }}>
                          {a.score}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {a.metrics.holderCount === null ? '—' : a.metrics.holderCount.toLocaleString('en-US')}
                      </td>
                      <td style={{
                        textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '700',
                        color: a.metrics.holderChange1h === null ? 'var(--text-muted)'
                          : a.metrics.holderChange1h > 0 ? 'var(--accent-mint)'
                          : a.metrics.holderChange1h < 0 ? '#fb7185' : 'var(--text-muted)'
                      }}>
                        {a.metrics.holderChange1h === null ? '—'
                          : `${a.metrics.holderChange1h > 0 ? '+' : ''}${a.metrics.holderChange1h}%`}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '700', color: a.metrics.ratio1h >= 1.5 ? 'var(--accent-mint)' : a.metrics.ratio1h !== null && a.metrics.ratio1h < 0.7 ? '#fb7185' : undefined }}>
                        {a.metrics.ratio1h === null ? '∞' : `${a.metrics.ratio1h}x`}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: a.metrics.liquidityUsd < 10000 ? '#fb7185' : undefined }}>
                        {fmtUsd(a.metrics.liquidityUsd)}
                      </td>
                      <td style={{
                        textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px',
                        color: a.metrics.topHoldersPct === null ? 'var(--text-muted)'
                          : a.metrics.topHoldersPct >= 50 ? '#fb7185'
                          : a.metrics.topHoldersPct >= 35 ? 'var(--accent-gold-bright)' : 'var(--accent-mint)'
                      }}>
                        {a.metrics.topHoldersPct === null ? '—' : `${a.metrics.topHoldersPct.toFixed(1)}%`}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {row.boostAmount > 0 ? (
                          <span title={`Promosi berbayar terdeteksi (boost ${row.boostAmount})`} style={{
                            fontSize: '12px', padding: '2px 5px', borderRadius: '4px',
                            background: 'rgba(192,132,252,0.18)', color: 'var(--accent-purple-light)', fontWeight: '800'
                          }}>
                            📣 {row.boostAmount}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                          {a.metrics.mintAuthDisabled === false && (
                            <span title="Mint authority aktif, dev bisa cetak token tanpa batas" style={{ fontSize: '12px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(244,63,94,0.2)', color: '#fb7185', fontWeight: '800' }}>MINT!</span>
                          )}
                          {a.metrics.freezeAuthDisabled === false && (
                            <span title="Freeze authority aktif, dompet bisa dibekukan" style={{ fontSize: '12px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(244,63,94,0.2)', color: '#fb7185', fontWeight: '800' }}>FREEZE!</span>
                          )}
                          {a.metrics.mintAuthDisabled === true && a.metrics.freezeAuthDisabled === true && (
                            <span title="Mint & freeze authority sudah dimatikan" style={{ fontSize: '12px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(16,185,129,0.18)', color: 'var(--accent-mint)', fontWeight: '800' }}>SAFE</span>
                          )}
                          {a.metrics.mintAuthDisabled === null && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)',
                          color: row.launchWindow.qualified ? 'var(--accent-mint)'
                            : row.launchWindow.passed >= 7 ? 'var(--accent-gold-bright)' : '#fb7185'
                        }}>
                          {row.launchWindow.passed}/{row.launchWindow.total}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: v.bg, color: v.color, borderColor: v.border, fontSize: '12px' }}>
                          {v.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!loading && visible.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '26px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      Tidak ada token yang lolos filter. Pindai ulang, atau turunkan skor minimum.
                      <div style={{ marginTop: '6px', fontSize: '12px' }}>
                        Ini normal: mayoritas token baru memang tidak punya bukti akumulasi apa pun.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {noPair.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '12px', color: 'var(--text-muted)' }}>
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
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selected.token.name}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
              </div>

              {/* Launch-window criteria — the 9-check gate */}
              <div style={{
                marginBottom: '12px', padding: '10px 12px', borderRadius: '8px',
                background: selected.launchWindow.qualified ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.07)',
                border: `1px solid ${selected.launchWindow.qualified ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
              }}>
                <div style={{
                  fontSize: '12px', fontWeight: '900', marginBottom: '6px',
                  color: selected.launchWindow.qualified ? 'var(--accent-mint)' : 'var(--accent-gold-bright)'
                }}>
                  {selected.launchWindow.qualified ? '✅ LOLOS SEMUA KRITERIA' : `⚠️ LOLOS ${selected.launchWindow.passed}/${selected.launchWindow.total} KRITERIA`}
                  {selected.boostAmount > 0 && (
                    <span style={{ marginLeft: '8px', fontSize: '12px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(192,132,252,0.2)', color: 'var(--accent-purple-light)' }}>
                      📣 PROMO BERBAYAR ({selected.boostAmount})
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {selected.launchWindow.checks.map(c => (
                    <div key={c.key} style={{ display: 'flex', gap: '6px', fontSize: '12px', lineHeight: 1.45 }}>
                      <span style={{ color: c.pass ? 'var(--accent-mint)' : '#fb7185', flexShrink: 0 }}>{c.pass ? '✓' : '✗'}</span>
                      <span style={{ color: c.pass ? 'var(--text-muted)' : 'var(--text-secondary)' }}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score breakdown — every point traceable */}
              <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                RINCIAN SKOR (setiap poin bisa ditelusuri):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                {selected.analysis.factors.length === 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tidak ada faktor positif maupun negatif terdeteksi.</div>
                )}
                {selected.analysis.factors.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', gap: '8px',
                    fontSize: '12px', padding: '5px 8px', borderRadius: '6px',
                    background: f.points > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
                    border: `1px solid ${f.points > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: f.points > 0 ? 'var(--accent-mint)' : '#fb7185', flexShrink: 0 }}>
                      {f.points > 0 ? '+' : ''}{f.points}
                    </span>
                  </div>
                ))}
              </div>

              {selected.analysis.riskFlags.length > 0 && (
                <>
                  <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '6px', color: '#fb7185' }}>
                    ⚠️ RISIKO TERDETEKSI:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '12px' }}>
                    {selected.analysis.riskFlags.map((r, i) => (
                      <div key={i} style={{ fontSize: '12px', color: '#fb7185', lineHeight: 1.5 }}>• {r}</div>
                    ))}
                  </div>
                </>
              )}

              {/* Raw metrics table */}
              <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                DATA MENTAH YANG DIUKUR:
              </div>
              <table className="telemetry-table" style={{ fontSize: '12px' }}>
                <tbody>
                  {[
                    ['Harga sekarang', fmtPrice(parseFloat(selected.pair.priceUsd || 0))],
                    ['Jumlah holder', selected.analysis.metrics.holderCount === null ? 'data Jupiter tidak tersedia' : selected.analysis.metrics.holderCount.toLocaleString('en-US')],
                    ['Δ Holder 1 jam', selected.analysis.metrics.holderChange1h === null ? '—' : `${selected.analysis.metrics.holderChange1h > 0 ? '+' : ''}${selected.analysis.metrics.holderChange1h}%`],
                    ['Net buyer 1j', selected.analysis.metrics.netBuyers1h === null ? '—' : `${selected.analysis.metrics.netBuyers1h > 0 ? '+' : ''}${selected.analysis.metrics.netBuyers1h} dari ${selected.analysis.metrics.numTraders1h} trader`],
                    ['Beli / Jual (1 jam)', `${selected.analysis.metrics.buys1h} / ${selected.analysis.metrics.sells1h}`],
                    ['Volume 1j / 24j', `${fmtUsd(selected.analysis.metrics.volume1h)} / ${fmtUsd(selected.analysis.metrics.volume24h)}`],
                    ['Volume organik (beli/jual)', selected.analysis.metrics.organicBuyVolume === null ? '—' : `${fmtUsd(selected.analysis.metrics.organicBuyVolume)} / ${fmtUsd(selected.analysis.metrics.organicSellVolume)}`],
                    ['Skor organik Jupiter', selected.analysis.metrics.organicScore === null ? '—' : `${Math.round(selected.analysis.metrics.organicScore)}/100`],
                    ['Likuiditas', fmtUsd(selected.analysis.metrics.liquidityUsd)],
                    ['Top holder pegang', selected.analysis.metrics.topHoldersPct === null ? '—' : `${selected.analysis.metrics.topHoldersPct.toFixed(1)}% supply`],
                    ['Dev masih pegang', selected.analysis.metrics.devBalancePct === null ? '—' : `${selected.analysis.metrics.devBalancePct.toFixed(4)}% supply`],
                    ['Mint authority', selected.analysis.metrics.mintAuthDisabled === null ? '—' : selected.analysis.metrics.mintAuthDisabled ? '✅ dimatikan' : '🚨 MASIH AKTIF'],
                    ['Freeze authority', selected.analysis.metrics.freezeAuthDisabled === null ? '—' : selected.analysis.metrics.freezeAuthDisabled ? '✅ dimatikan' : '🚨 MASIH AKTIF'],
                    ['Dev riwayat mint', selected.analysis.metrics.devMints === null ? '—' : `${selected.analysis.metrics.devMints}x mint`],
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

              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Sumber: DexScreener (harga/volume/txns) + Jupiter lite-api (holder, organik, audit).
                Jupiter tidak menyediakan identitas pemilik wallet top holder, hanya persentase agregatnya.
              </div>

              <a
                href={selected.pair.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', color: 'var(--accent-sky)', fontWeight: '700', textDecoration: 'none' }}
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
                  fontSize: '12px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px',
                  background: 'rgba(245,158,11,0.15)', color: 'var(--accent-gold-bright)', border: '1px solid rgba(245,158,11,0.35)'
                }}>
                  DUMMY / BUKAN ORDER NYATA
                </span>
              </div>

              {!plan ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Harga token tidak valid, rencana tidak bisa dihitung.
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.6 }}>
                    Semua angka dihitung dari volatilitas nyata token (1j & 24j) dan risiko 1% dari modal simulasi {fmtUsd(capital)}.
                    Stop loss = {plan.volatilityPct}% di bawah entry.
                  </div>

                  <table className="telemetry-table" style={{ fontSize: '12px' }}>
                    <tbody>
                      <tr>
                        <td style={{ color: 'var(--accent-sky)', fontWeight: '700' }}>Entry</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800' }}>{fmtPrice(plan.entry)}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#fb7185', fontWeight: '700' }}>Stop Loss</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#fb7185' }}>
                          {fmtPrice(plan.stopLoss)} <span style={{ fontSize: '12px', opacity: 0.8 }}>(-{plan.stopDistancePct}%)</span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--accent-mint)', fontWeight: '700' }}>Target 1 (1.5R)</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--accent-mint)' }}>{fmtPrice(plan.takeProfit1)}</td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--accent-mint)', fontWeight: '700' }}>Target 2 (3R)</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--accent-mint)' }}>{fmtPrice(plan.takeProfit2)}</td>
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
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--accent-mint)' }}>
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
                    fontSize: '12px', color: '#fb7185', lineHeight: 1.6
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
