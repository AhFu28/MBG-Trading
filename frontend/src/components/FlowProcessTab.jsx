import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * FLOW PROCESS — interactive project map (plan P-6).
 *
 * WHY THIS FILE CHANGED
 * ---------------------
 * The old tab was 588 lines of static styled text. The plan asked for a
 * zoomable node map (Miro/Visio style) built FROM docs/ALUR_PROSES.svg - the
 * collaborator's resolved pipeline diagram - with native pan/zoom (no new
 * dependency) and click-for-detail: the diagram is the project map, not
 * decoration.
 *
 * Facts are current to 2026-10-08: /api/data is session-gated (guests get the
 * bundled snapshot), the CSP fix opened TradingView, the credential rotation is
 * pending. Personal names stay out of the app surface - the owner-facing doc
 * versions live in docs/.
 */

// ---------------------------------------------------------------------------
// Diagram data: 5 stages left-to-right, nodes with status + detail.
// status: 'ok' | 'blocked' | 'removed' | 'pending'
// ---------------------------------------------------------------------------
const STAGES = [
  {
    id: 'local',
    title: '1 · MESIN LOKAL',
    subtitle: 'hanya dipakai manual',
    nodes: [
      { id: 'engine', label: 'Engine Python', status: 'ok', detail: 'Fetcher & analyzer lokal: engine/ + scripts/refresh_crypto_futures.py + scripts/refresh_forex.py. Sumber data: Gate.io, TradingView (28 pair + CFD untuk emas/perak/DXY), mempool.space (paus on-chain nyata).' },
      { id: 'jadwal', label: 'Jadwal Windows — DIHAPUS', status: 'removed', detail: 'Penjadwal laptop dipensiunkan (d071418 + e041862): cloud run sudah mencakup forex, jadi tugas lokal tidak perlu. Installer disimpan dengan pengaman: scripts/install_forex_task.ps1 + install_futures_task.ps1 menolak jalan tanpa -Force — tidak bisa dihidupkan tak sengaja.' },
    ],
  },
  {
    id: 'cloud',
    title: '2 · PIPELINE CLOUD',
    subtitle: 'pemilik data — GitHub Actions',
    nodes: [
      { id: 'hourly', label: 'Jadwal jam (:00)', status: 'ok', detail: '.github/workflows/hourly_crypto_macro.yml — mode hourly_crypto_macro: crypto_futures · whale · forex · macro. Bug "sukses 10 hari tanpa commit/push" ditutup: bundle kini di-commit DAN di-push (352cd07 + push_bundle_to_edge.py).' },
      { id: 'daily', label: 'Jadwal harian (22:30 UTC)', status: 'ok', detail: '.github/workflows/daily_idx_eod.yml — us_stocks + kalender + earnings, mode us_stocks (BARU, e97031e). Nama mode asli disebut di pesan commit (d347473).' },
      { id: 'validate', label: 'Validasi bundle', status: 'ok', detail: 'scripts/push_bundle_to_edge.py — menolak penanda konflik dan JSON rusak/terpotong sebelum commit; gagal bersuara kalau bundle kosong. Gerbang ini menangkap bundle rusak pada 6 Oktober sebelum sempat ter-push.' },
      { id: 'commit', label: 'Commit + push', status: 'ok', detail: 'Verifikasi run 37437433618: bundle valid & publishable, 25 sections, SEGAR 6 / BASI 0 — crypto 15 pair, whale 5 ekor, forex 33 pair.' },
    ],
  },
  {
    id: 'qa',
    title: '3 · GERBANG QA',
    subtitle: 'dijalankan sebelum setiap push',
    nodes: [
      { id: 'qa-ps', label: 'Sintaks PowerShell (2 installer)', status: 'ok', detail: 'Gerbang 1 dari 5: kedua installer .ps1 dicek sintaksnya sebelum push.' },
      { id: 'qa-yaml', label: 'Workflow YAML + sintaks Python', status: 'ok', detail: 'Gerbang 2: YAML workflow + sintaks Python engine dicek.' },
      { id: 'qa-engine', label: 'Tes engine (130+)', status: 'ok', detail: 'Gerbang 3: npm run test:engine — unittest suite engine (crypto_futures, liquidity_heat, forex_scanner, whale_tracker, vip_signal_router, send_wa_fuad).' },
      { id: 'qa-frontend', label: 'Tes frontend (396)', status: 'ok', detail: 'Gerbang 4: vitest run — 396 tes (honestData, dataEndpoint, account, paymentAndAdmin, signalTiers, chunkLoadRetry, dst.). Termasuk secret-guard: repo gagal push kalau membawa nilai kredensial (JWT_SECRET / COCKPIT_PASSWORD / PASSWORD_HASH / ADMIN_TOKEN / sb_secret_) — guard dibenahi 8 Okt setelah kunci lolos.' },
      { id: 'qa-build', label: 'Build produksi', status: 'ok', detail: 'Gerbang 5: vite build — bundle produksi harus bersih sebelum push.' },
    ],
  },
  {
    id: 'web',
    title: '4 · WEB (Cloudflare Pages)',
    subtitle: 'mbg-trading.pages.dev',
    nodes: [
      { id: 'web-prices', label: 'Harga pasar (CORS langsung)', status: 'ok', detail: 'SUDAH JALAN: saham, crypto, forex, emas — TradingView scanner + fallback langsung + Binance WS/REST. CSP fix (8 Okt) membuka TradingView widget di Charting Desk (script-src + frame-src).' },
      { id: 'web-data', label: 'Data engine → web', status: 'ok', detail: '/api/data kini SESSION-GATED (401 untuk tamu): rantai session → edge KV → bundled snapshot yang selalu ada. Tamu mendapat snapshot build-time dengan header X-Data-Source/X-Data-Age-Hours jujur — tidak disamarkan segar.' },
      { id: 'web-ea', label: '/api/ea (EA MT5)', status: 'blocked', detail: 'Masih placeholder-200 kecuali env MT5_EA_SOURCE di-set. EA riil ada di engine/mt5/ — penyajian EA terverifikasi = paket P-2 (rencana).' },
      { id: 'web-account', label: 'Daftar akun + pembayaran', status: 'pending', detail: 'Kode sudah ada (signup/login, payment-confirm, admin approve/reject, tabel subscription_requests) — butuh schema Supabase dijalankan di dashboard + env Supabase di Cloudflare (aksi owner).' },
    ],
  },
  {
    id: 'needs',
    title: '5 · YANG MASIH DIBUTUHKAN',
    subtitle: 'aksi owner',
    nodes: [
      { id: 'rotate', label: 'ROTASI kredensial', status: 'pending', detail: 'WAJIB sekarang: kunci JWT + password cockpit sempat ter-commit ke repo publik (7b5d3f4). Menghapus dari file TIDAK menutup bocornya — riwayat git tetap memuatnya. Buat yang baru, set di Cloudflare dashboard (encrypted env), BUKAN di file repo.' },
      { id: 'infra', label: 'Repo private + env + schema', status: 'pending', detail: 'Repo → private (menutup unduhan VIP bundle) + otorisasi ulang CF Pages setelahnya; env Supabase di Cloudflare; jalankan supabase/schema.sql, verifikasi rls_aktif = true sebelum lanjut.' },
    ],
  },
];

const STATUS_STYLE = {
  ok: { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', label: '' },
  blocked: { bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', label: 'TERHALANG' },
  removed: { bg: 'rgba(148, 163, 184, 0.12)', color: 'var(--text-muted)', label: 'DIHAPUS' },
  pending: { bg: 'rgba(239, 68, 68, 0.12)', color: 'var(--accent-red)', label: 'BUTUH' },
};

const STAGE_W = 280;
const STAGE_GAP = 56;
const NODE_H = 46;
const NODE_GAP = 8;
const HEADER_H = 58;
const CANVAS_H = 620;

const totalW = STAGES.length * STAGE_W + (STAGES.length - 1) * STAGE_GAP;

const stageX = (i) => 40 + i * (STAGE_W + STAGE_GAP);

export default function FlowProcessTab() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);
  const dragRef = useRef({ active: false, moved: 0, lastX: 0, lastY: 0 });

  const clampZoom = (z) => Math.min(3, Math.max(0.4, z));

  // Zoom anchored at the cursor: the point under the cursor stays put.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setZoom((z) => {
        const nz = clampZoom(z * (e.deltaY < 0 ? 1.12 : 0.89));
        const k = nz / z;
        setPan((p) => ({ x: cx - (cx - p.x) * k, y: cy - (cy - p.y) * k }));
        return nz;
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = useCallback((e) => {
    dragRef.current = { active: true, moved: 0, lastX: e.clientX, lastY: e.clientY };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.moved += Math.abs(dx) + Math.abs(dy);
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current.active = false;
    setDragging(false);
  }, []);

  const openNode = (id) => {
    if (dragRef.current.moved > 4) return; // it was a pan, not a click
    for (const s of STAGES) {
      const n = s.nodes.find((x) => x.id === id);
      if (n) { setSelected({ stage: s.title, ...n }); return; }
    }
  };

  const zoomBy = (k) => setZoom((z) => clampZoom(z * k));
  const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); setSelected(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>⚡</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              ALUR PROSES & QA — PETA PROYEK
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Scroll = zoom · drag = geser · klik node = detail file & aturan · fakta per 8 Okt 2026
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={() => zoomBy(0.85)} className="telemetry-btn" style={{ fontSize: '13px', padding: '4px 12px', fontWeight: 800 }} title="Zoom out">−</button>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: '44px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => zoomBy(1.18)} className="telemetry-btn" style={{ fontSize: '13px', padding: '4px 12px', fontWeight: 800 }} title="Zoom in">+</button>
          <button onClick={reset} className="telemetry-btn" style={{ fontSize: '12px', padding: '4px 12px' }} title="Reset zoom & posisi">RESET</button>
        </div>
      </div>

      {/* Pan/zoom canvas */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          height: CANVAS_H + 'px',
          overflow: 'hidden',
          border: 'var(--border-hairline)',
          borderRadius: '10px',
          background: 'var(--bg-panel-subtle)',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        <div style={{ transform: 'translate(' + pan.x + 'px, ' + pan.y + 'px) scale(' + zoom + ')', transformOrigin: '0 0', width: totalW + 80 + 'px' }}>
          <svg width={totalW + 80} height={CANVAS_H} style={{ display: 'block' }}>
            {/* Stage connectors */}
            {STAGES.slice(0, -1).map((s, i) => {
              const x1 = stageX(i) + STAGE_W + 6;
              const x2 = stageX(i + 1) - 6;
              const y = 120;
              return (
                <g key={s.id + '-arrow'}>
                  <line x1={x1} y1={y} x2={x2 - 8} y2={y} stroke="var(--accent-sky)" strokeWidth="2" opacity="0.5" />
                  <polygon points={(x2 - 8) + ',' + (y - 5) + ' ' + x2 + ',' + y + ' ' + (x2 - 8) + ',' + (y + 5)} fill="var(--accent-sky)" opacity="0.7" />
                </g>
              );
            })}

            {STAGES.map((s, i) => {
              const x = stageX(i);
              return (
                <g key={s.id}>
                  {/* Stage header */}
                  <rect x={x} y={30} width={STAGE_W} height={HEADER_H} rx="10" fill="var(--bg-panel)" stroke="var(--border-color)" />
                  <text x={x + 14} y={54} fontSize="13" fontWeight="800" fill="var(--text-primary)">{s.title}</text>
                  <text x={x + 14} y={72} fontSize="11" fill="var(--text-muted)">{s.subtitle}</text>

                  {/* Nodes */}
                  {s.nodes.map((n, j) => {
                    const ny = 30 + HEADER_H + 10 + j * (NODE_H + NODE_GAP);
                    const ss = STATUS_STYLE[n.status];
                    const isSel = selected && selected.id === n.id;
                    return (
                      <g key={n.id} onClick={() => openNode(n.id)} style={{ cursor: 'pointer' }}>
                        <rect x={x} y={ny} width={STAGE_W} height={NODE_H} rx="8"
                          fill={isSel ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-panel)'}
                          stroke={isSel ? 'var(--accent-sky)' : 'var(--border-color)'}
                          strokeWidth={isSel ? 2 : 1} />
                        <text x={x + 12} y={ny + 20} fontSize="12" fontWeight="700" fill="var(--text-primary)">
                          {n.label.length > 30 ? n.label.slice(0, 29) + '…' : n.label}
                        </text>
                        <text x={x + 12} y={ny + 36} fontSize="10" fill="var(--text-muted)">
                          klik untuk detail
                        </text>
                        {ss.label && (
                          <g>
                            <rect x={x + STAGE_W - 74} y={ny + 12} width={62} height={18} rx="4" fill={ss.bg} />
                            <text x={x + STAGE_W - 68} y={ny + 25} fontSize="10" fontWeight="800" fill={ss.color}>{ss.label}</text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Detail panel */}
      <div style={{
        background: 'var(--bg-panel)',
        border: selected ? '1px solid var(--accent-sky)' : 'var(--border-hairline)',
        borderRadius: '10px',
        padding: '14px 16px',
        minHeight: '90px'
      }}>
        {selected ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{selected.stage}</span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{selected.label}</span>
              {selected.status !== 'ok' && (
                <span style={{ fontSize: '10px', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', background: STATUS_STYLE[selected.status].bg, color: STATUS_STYLE[selected.status].color }}>
                  {STATUS_STYLE[selected.status].label}
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {selected.detail}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Klik node mana pun di peta untuk membuka detail: file, aturan, dan status yang terlibat. Peta ini dibangun dari <strong style={{ color: 'var(--text-primary)' }}>docs/ALUR_PROSES.svg</strong> (pipeline 5-layer) — versi interaktif, tanpa dependency baru.
          </div>
        )}
      </div>
    </div>
  );
}
