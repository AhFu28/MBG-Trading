# MBG-Trading — Update Plan V3 (Rekonsiliasi Sprint Kolaborator 2026-10-05..06)

**Versi:** 2026-10-07 · **Status:** PROPOSED — pengganti [MBG_TRADING_UPDATE_PLAN_V2.md](MBG_TRADING_UPDATE_PLAN_V2.md) (V2 tetap sebagai arsip keputusan)
**Basis:** Plan V2 (7-Point UI/UX & Engine) + rebase-audit lokal → `origin/main @ 0f29e3a` (**60 commit di depan, belum di-pull**) + dokumen upstream baru (`docs/GO_LIVE_10_MENIT.md`, `AGENTS.md`, CHANGELOG Sprint 22–30).

---

## 0. Ringkasan eksekutif

1. Lokal `main` (dfb2359, 3 Okt) **60 commit di belakang** origin/main (0f29e3a, 6 Okt). Catatan: status "behind 18" yang lama ternyata terhadap snapshot remote 5 Okt yang sudah usang — setelah fetch, angkanya 60. **Rebase tes: bersih tanpa konflik** — 3 file lokal yang belum di-commit rebase mulus ke origin/main.
2. Kolaborator mengejar sebagian besar semangat V2 lewat jalur berbeda: data jujur (honest-data sweep), pipeline/CI diperbaiki (bug "sukses 10 hari tanpa commit" ditutup), arena dibuat jujur (bukan klaim 24/7), sistem akun/langganan Supabase dibangun dari nol, WhatsApp handoff + daemon, signals desk berbayar.
3. **4 temuan baru yang lebih mendesak dari UI** (semua berbahaya dan murah untuk ditutup):
   - **[DIPERBARUI 2026-10-08] Kredensial produksi bocor di repo publik** — kunci JWT asli di-commit ke `wrangler.toml` (7b5d3f4) + password cockpit asli di dokumen PRD. Kode sudah dibersihkan (wrangler.toml, redaksi PRD) + secret-guard dibenahi; **ROTASI KEDUA KREDENSIAL di Cloudflare = WAJIB sekarang** — kombinasi kunci publik + admin berbasis email = approve langganan bisa dipalsukan siapa pun.
   - **VIP bundle bocor via repo publik** — `latest_cockpit_bundle.json` bisa diunduh siapa saja.
   - **PII nomor telepon** (+6281224170187) di 15+ tempat repo publik.
   - **Supabase schema belum dijalankan** (`profiles` 404) → pelanggan belum bisa daftar/bayar meski kodenya sudah ada.
4. **P-4 (CSP) masih belum dikerjakan upstream** — `_headers` tidak tersentuh; Charting Desk masih mati. Tetap quick win #1 di antara paket UI.

---

## 1. Apa yang berubah di upstream (60 commit, 5–6 Okt)

| # | Kategori | Commit kunci | Dampak ke V2 |
|---|---|---|---|
| 1 | **Data jujur** | a3c2fe3 (hapus angka karangan di 6+ komponen + honestData.test.js), e286ac0 (whale palsu dihapus), 9ce035c (`/api/data` tadinya balas HTML 200 — akar "semua desk error"; sekarang header jujur `X-Data-Source/X-Data-Live/X-Data-Age-Hours`) | **P-3 menyusut**; P-7 perlu refresh |
| 2 | **Pipeline & CI** | 4bbd597 (gold tak pernah di-fetch → CFD scanner), dd04d77 (futures 10 hari stale dipulihkan, desk futures-only), 7a14050 (24h change stuck + panel "where is the money going"), 8b69938 + 352cd07 (hourly workflow "sukses" 10 hari tanpa commit/push → `push_bundle_to_edge.py`), d071418 + e041862 (laptop task dipensiunkan, cloud cover forex), e97031e (us_stocks harian), d347473 (nama mode jujur) | P-7 refresh; arsitektur data baru: **bundle engine ikut di-build ke worker + refresh per jam** |
| 3 | **Arena jujur** | 4fa799f (klaim 24/7 dihapus; 4×/hari × 5.5 jam ≈ 22 jam; timeout 350 menit; 60s tick ≈ 325 siklus/run; arenaFreshness.test.js), a10b0b4 (DNA unik + Binance multi-host 1 → 3110 instrumen) | **P-2 di-reframe**: premis "24/7" V2 mati (GH cron tidak mampu); inti single-writer tetap valid |
| 4 | **Akun & langganan (Supabase)** | 2f45787 (signup, free tier, Pro), a04f03c (signals tier), 940b65d (owner login reachable), f248866 (koordinat Supabase di-commit, publishable key saja), b9f0442 (format kunci baru + temuan forgery), `supabase/schema.sql`, `functions/api/account/*`, AuthPanel, SubscriptionPage, featureAccess.js | **Baru (di luar V2)**; P-8 kini membangun DI ATAS identitas ini |
| 5 | **Signals desk berbayar** | 1bf985b (provenance gate + staleness guard), a04f03c, SignalsTab, signalTiers.js ("jual KECEPATAN, bukan rahasia") | Baru; selaras trust-first → N-3 |
| 6 | **WhatsApp** | 6f5aebb, d92ae72 (handoff ke Mas Fuad), 6ba935f (auto send), b895e10 (kirim gambar), `wa_daemon.mjs`, `send_wa_fuad`, WhatsAppHandoff.jsx, AGENTS.md (aturan anti-spam) | Baru → N-2; PII → N-1 |
| 7 | **Resilience & landing** | ac8dcb6 (chunk load retry), LandingPage.jsx (baru) | Baru → masuk scope P-9 |
| 8 | **Diagram proses** | ea32f39, d3f3658, eff9a0d (`docs/ALUR_PROSES.svg` + PNG, refresh 3×) | P-6 rebase ke SVG ini |
| 9 | Commit bot (arena state + bundle refresh) | — | Noise; tidak menambah keputusan |

---

## 2. Status paket V2 — keep / upgrade / fix / drop

| Paket | Status setelah sprint kolaborator | Keputusan V3 |
|---|---|---|
| **P-4** CSP fix | **BELUM dikerjakan** (`_headers` tidak tersentuh; `script-src` tanpa `s3.tradingview.com`, tanpa `frame-src`) | **KEEP** — tetap quick win #1; desain tidak berubah |
| **P-1** Home redesign | BELUM; lokal punya langkah pertama (footer cleanup, rebase mulus) | **KEEP** + serap perubahan lokal; pertimbangkan LandingPage baru sebagai pintu masuk |
| **P-3** IDX source truth | **SEBAGIAN selesai** (honest-data sweep + whale palsu dihapus) | **UPGRADE (menyusut)**: sisa = `RunningTradeWidget` Math.random + fallback `849` + span `🟢 849 STOCKS` di App.jsx. Catatan: perubahan lokal App.jsx masih MEMBAWA span 849 ke footer → **dibetulkan bersamaan di gelombang ini** |
| **P-2** Arena | **DIUBAH ARAH oleh upstream** (jujur: periodik ~22 jam, bukan 24/7). **Dua writer MASIH ada** (`arena_evaluator.py` + `arena_runner_247.py`; workflow commit `latest_arena_state.json`). Ledger localStorage (~12 keys) MASIH di AiAgentArenaTab. `/api/ea` masih placeholder-200 kecuali `MT5_EA_SOURCE` (sekarang bisa baca kunci Supabase — sedikit lebih baik) | **FIX & UPGRADE**: ganti premis "24/7" → "periodik jujur ~22 jam"; inti tetap: satu writer + version CAS, state server-owned, frontend jadi reader, hapus loop simulasi browser; sajikan EA riil dari `engine/mt5/` |
| **P-5** News rework | BELUM | **KEEP**; catatan baru: freshness kini terukur (`X-Data-Age-Hours`, bundle per jam) — FreshnessBadge pakai sinyal ini |
| **P-6** Flow diagram | SEBAGIAN (kolaborator buat `docs/ALUR_PROSES.svg`+PNG statis, refresh 3×) | **UPGRADE**: diagram interaktif FlowProcessTab dibangun **DARI ALUR_PROSES.svg** (sumber kebenaran baru), bukan dari nol; effort turun |
| **P-7** Connectivity audit | SEBAGIAN USANG (data endpoint, gold, futures, CI sudah fixed upstream; endpoint `account/*` baru ada) | **UPGRADE**: re-audit v2 SETELAH pull (1× cepat) |
| **P-8** Research Desk | Schema riset BELUM mulai; tapi **identitas + entitlement SUDAH dibangun upstream** (account + tier free/pro + tests) | **FIX & UPGRADE**: bangun DI ATAS identitas Supabase yang ada (kekhawatiran V2 "dua implementasi identitas" kini terjawab); effort P0a turun |
| **P-9** Design unification | BELUM; **SCOPE NAIK**: 4 permukaan baru (LandingPage, SignalsTab, SubscriptionPage, AuthPanel) | **UPGRADE**: tambah 4 komponen baru ke daftar refresh + **commit DESIGN.md** (masih untracked) |

Tidak ada paket V2 yang di-drop; satu di-reframe (P-2), empat menyusut/rebase ke baseline baru (P-3, P-6, P-7, P-8), satu scope naik (P-9).

---

## 2b. P-1b — Live Intelligence Wire memanjang dari Portfolio Net Valuation

**Sumber:** Permintaan langsung Jendral Arib (7 Okt 2026) — "Portfolio Net Valuation dikurangi space kanannya, space-nya dipakai LIVE INTELLIGENCE WIRE, jadi wire di kanan memanjang dari atas mulai Portfolio Net Valuation hingga di atas TACTICAL QUANTITATIVE EXECUTION MATRIX."
**Status:** DEPLOYED — commit `1f3fd9c` (7 Okt 2026). Verifikasi visual (screenshot 1600/1200) menyusul di sesi dengan browser.

### Fakta (snapshot `main @ 578af5c`, HomeDashboardTab.jsx 2119 baris)

| Baris | Blok | Lebar sekarang |
|---|---|---|
| 380 | Bloomberg News Wire (marquee) | full |
| 384–668 | **Bento hero** — Portfolio Net Valuation + 24h Alpha + Quick Actions + Macro Stats | **full** (grid internal 2 kolom: `minmax(320px, 1.2fr) minmax(360px, 1.8fr)`, min ~700px + gap) |
| 670 | Split mulai — kiri: macro trio + market bento | kanan: wire | kiri 1fr, kanan 350px → **wire baru mulai sejajar macro trio** |
| ~1557 | TACTICAL QUANTITATIVE EXECUTION MATRIX | full |

### Target

```
[Bloomberg News Wire (full)]
[SPLIT mulai di sini]
  KIRI: Bento hero — Portfolio Net Valuation (menyempit)
  KANAN: LIVE INTELLIGENCE WIRE (350px) ← mulai dari level hero
  KIRI: macro trio           | KANAN: wire berlanjut
  KIRI: market bento         | KANAN: wire berlanjut
[SPLIT selesai — tepat di atas Execution Matrix]
[TACTICAL QUANTITATIVE EXECUTION MATRIX (full)]
```

- Wire memanjang dari level Portfolio Net Valuation sampai atas Execution Matrix — kolom kanan dapat tinggi hero (~300px) + macro + bento.
- Execution Matrix tetap full width.

### Perubahan (3 langkah, ~1–2 PD)

1. **Pindahkan pembuka split** — 2 baris JSX (`home-middle-cockpit-split` + `home-cockpit-left`) naik dari baris 670–673 ke setelah BloombergNewsWire (~382). Hero + macro trio + market bento jadi isi kolom kiri. Kolom wire TIDAK berpindah (tetap child grid kedua) — tingginya otomatis mengikuti kolom kiri yang lebih tinggi.
2. **Responsive hero** — grid internal hero min ~700px; di lebar kolom kiri baru (~570px pada layar 1200px) tiles akan sesak. Tambah aturan: grid internal hero → 1 kolom (stack) saat kolom kiri sempit (media query di index.css, bukan rework JSX).
3. **Verifikasi** — build + vitest + tidak ada section height-0; screenshot 1600px & 1200px (butuh browser — pemicu sesi berikutnya).

### Risiko

| Risiko | Mitigasi |
|---|---|
| Tiles hero sesak di lebar baru | Langkah 2: stack internal saat sempit |
| Konten wire dipaksa tinggi besar | Wire sudah `overflow: hidden` + list scroll internal ✓ |
| Mobile ≤820px | Sudah stack via media query existing ✓ |

### Catatan

- Permintaan ini **menyempurnakan** target P-1 (V2: "News & Research full width") — keputusan baru: wire kembali ke kolom kanan, tapi lebih tinggi. Keputusan owner menang.
- Section Smart Money yang collapse sudah dihapus (`578af5c`) — tidak ada kembaliannya; fungsinya tetap tercakup di tab Whales + Saham IDX.

---

## 3. Paket baru dari temuan upstream (N)

### N-1 — Trust hardening (URGENT — murah, mendahului semua UI)

**Fakta (bukti upstream, diuji ke produksi 2026-10-06; DIPERBARUI 2026-10-08 setelah 7b5d3f4):**
- **[2026-10-08, KRITIS] Kunci JWT produksi di-commit ke repo publik** — `wrangler.toml` + `frontend/wrangler.toml` di 7b5d3f4 membawa kunci JWT dalam teks polos. Repo publik → siapa pun bisa membacanya dan memalsukan sesi valid langsung. **Lebih buruk dari celah yang mau ditutup.** Sudah dibersihkan dari kedua file (commit 2026-10-08) — tapi riwayat git tetap memuatnya → **ROTASI WAJIB**.
- **[2026-10-08, KRITIS] Kombinasi membunuh: kunci publik + admin berbasis email** — approve/reject langganan dicek dengan `isAdmin(session.email)` (daftar email di `_shared.js`). Kunci publik → siapa pun bisa memalsukan sesi dengan email admin → **approve langganan sendiri gratis**. Sampai rotasi, semua aksi admin dianggap bisa dipalsukan.
- **[2026-10-08, KRITIS] Password cockpit web asli di dokumen PRD** — `docs/sources/PRD_PROJECT_MBG_V2_MASTER.md` membawa `COCKPIT_PASSWORD` asli (kredensial login owner via `/api/auth` yang masih dipakai). Sudah direduksi (commit 2026-10-08) — riwayat git tetap memuatnya → **rotasi password cockpit juga wajib**.
- **Session forgery (2026-10-06)**: fallback `deriveJwtSecret(PASSWORD_HASH || DEFAULT_PASSWORD_HASH)` — cookie palsu dari konstanta publik → HTTP 200, payload VIP 1750 KB. b9f0442: *"THE REAL FIX IS OPERATIONAL, NOT CODE."* Fallback kini sudah DIHAPUS dari `_jwt.js` (auth fail-closed tanpa `JWT_SECRET`) — pintu konstanta tertutup; kunci asli yang bocor (poin pertama) jadi satu-satunya pintu.
- **Secret guard bolong (sudah diperbaiki 2026-10-08)**: guard lama memindai label diskusi + email admin (konfigurasi disengaja) → **selalu MERAH, alarm fatigue** — itulah kenapa kunci yang di-commit lolos tanpa terlihat. Guard baru: pola nilai kredensial + `*.toml` + buang pola stale.
- **VIP bundle bocor**: `engine/cache/latest_cockpit_bundle.json` dapat diunduh raw (daily_trade_plans 12, broker_summary 81, bandarmology_iifs 18, forecasts 18). Penutup: repo → **private** (satu klik owner) + otorisasi ulang CF Pages setelahnya — ⚠ jangan tanpa verifikasi (GO_LIVE).
- **PII**: nomor +6281224170187 di 15+ tempat (AGENTS.md, CHANGELOG, `engine/send_wa_fuad.py` TARGET_PHONE, tests, SubscriptionPage.jsx).
- **Supabase schema belum dijalankan** (GET /rest/v1/profiles → 404) → pelanggan belum bisa daftar/bayar.

**Paket (urutan WAJIB — rotasi dulu):**
1. *(Owner, ~5 menit — LAKUKAN SEKARANG)* **Rotasi kunci JWT**: buat string acak BARU (32+ karakter), set di **Cloudflare Pages dashboard** (encrypted env var) — BUKAN di file repo. Kunci lama yang bocor mati; sesi lama hangus (security win). Verifikasi: cookie palsu → **401**. ⚠ Setelah fix kode 2026-10-08, deploy berikutnya tidak lagi membawa kunci dari `wrangler.toml` — kalau dashboard belum di-set, auth gagal-closed (401) sampai variabel di-set. Set dashboard dulu.
2. *(Owner, ~5 menit)* **Rotasi password cockpit** (kredensial `/api/auth` di Cloudflare env) — password lama bocor di dokumen PRD. Verifikasi: login dengan password lama → **401**.
2. *(Owner, 1 klik + verifikasi)* Repo → private; sesudahnya verifikasi integrasi CF Pages masih hidup (langkah GO-LIVE; rollback = public lagi).
3. *(Kode, 0.5 PD)* PII → env/config: `WA_TARGET_PHONE` env; SubscriptionPage + docs tidak menampilkan nomor mentah di UI publik; grep gate di CI agar nomor tidak kembali masuk.
4. *(Owner, ~5 menit + verifikasi)* Jalankan `supabase/schema.sql`, verifikasi `rls_aktif = true` (GO-LIVE Langkah 2; jangan lanjut kalau bukan true).

**Estimasi:** 1 PD kode + aksi owner · **Gate:** cookie palsu 401 · repo private + situs hidup · signup jalan · RLS aktif.

### N-2 — WhatsApp daemon ops review (0.5–1 PD)

- Baileys unattended session (`wa_daemon.mjs`, 591 baris): di mana file session disimpan, perilaku restart, risiko ban, batas rate, kirim gambar.
- Auto-dispatch sudah diatur di AGENTS.md (anti-spam: bahasa Inggris, hanya penting, tidak semua dikirim) — **verifikasi aturan itu diterapkan di kode, bukan hanya di dokumen** (aturan spam muncul karena kejadian nyata "chat mu ke mas fuad terlalu banyak").

### N-3 — Verifikasi permukaan baru (1–2 PD, input untuk P-9)

- LandingPage, AuthPanel, SubscriptionPage, SignalsTab: trust check (premium tidak bocor — tests featureAccess sudah ada; badge tier display-only; "jual kecepatan bukan rahasia" konsisten dengan PRD-03 provenance: fitur delivery-time, bukan isi sinyal) + a11y baseline (focus-visible, reduced-motion, touch target).
- Hasil jadi input langsung daftar refresh P-9.

---

## 4. Perubahan lokal yang belum di-commit — disposisi

| File | Isi | Keputusan |
|---|---|---|
| `App.jsx` (footer cleanup) | Feed Health bar digabung ke footer (region bawah tunggal) | **KEEP** — rebase mulus; langkah mikro P-1/P-9; **TAPI masih membawa `849 STOCKS` hardcode → dibetulkan bersamaan dengan P-3** |
| `HomeDashboardTab.jsx` | Footer nav bar dihapus (TESTING LAB / ACADEMY / BOT ARENA) | **KEEP** — navigasi redundan (Sidebar sudah mencakup AI_AGENTS / TESTING / ACADEMY); tidak konflik |
| `vite.config.js` | Dev-only stub `/api/auth` → `{authenticated:true, tier:'PRO'}` | **RE-VERIFY saat merge**: upstream membuat auth jalan tanpa config (f248866 / 940b65d) — stub kemungkinan redundan. Kalau masih dipakai dev, jangan fake `tier:'PRO'` (pola anti-trust) — beri label dev yang jujur |
| `DESIGN.md` (untracked) | Kontrak brand P-9 (9-seksi, token dari index.css) | **COMMIT** sebagai bagian P-9 |
| `deploy/huggingface/data/` (untracked) | Data runtime | Tidak di-commit; tambahkan ke `.gitignore` |

---

## 5. Urutan update optimal (V3)

| Urutan | Paket | Estimasi | Perubahan dari V2 |
|---|---|---|---|
| 0 | **Sinkronisasi**: commit lokal (2 commit: footer cleanup + dev stub) → `git pull --rebase` → gates (vitest + build + pytest) | 0.5 PD | Rebase teruji bersih; test count naik (130 engine, 259+ frontend) |
| 1 | **N-1 Trust hardening** | 1 PD + aksi owner | BARU — mendahului semua UI; termurah, nilai tertinggi |
| 2 | P-4 CSP fix (chart hidup) | 0.5–1 PD | Tidak berubah — chart masih mati upstream |
| 3 | P-1 Home + P-3 sisa (satu gelombang UI home) | 5–8 PD (P-1 4–6 + P-3 sisa 1–2) | P-3 menyusut; `849` dibetulkan di sini |
| 4 | P-7v2 connectivity re-audit | 0.5 PD | Cepat, setelah data endpoint baru |
| 5 | P-5 News rework | 4–6 PD | Freshness pakai `X-Data-Age-Hours` |
| 6 | N-2 + N-3 (WA ops + verifikasi permukaan baru) | 1.5–3 PD | BARU |
| 7 | P-2 Arena (reframed: periodik jujur, satu writer, frontend reader) | 6–10 PD (turun dari 8–12) | Premis 24/7 ganti; inti single-writer tetap |
| 8 | P-6 Flow diagram interaktif (dari ALUR_PROSES.svg) | 2–4 PD (turun dari 3–5) | Sumber kebenaran sudah ada |
| 9 | P-9 Design unification (scope +4 permukaan; DESIGN.md di-commit dulu) | 6–10 PD (naik dari 5–8) | Scope naik |
| 10 | P-8 Research Desk (di atas identitas yang ada) | 28–48 PD (turun dari 33–54) | P0a identitas sudah dibangun |

**Total V3: ~53–95 PD** (V2: 60.5–97; turun meski scope naik — trust hardening + re-audit murah, dan identitas riset sudah dibangun upstream).

---

## 6. Verifikasi & rollout

1. **Sinkronisasi dulu (urutan 0)** — jangan kerjakan paket apa pun sebelum pull; semua baris file:line audit lama di V2 bergeser setelah 60 commit (referensi baris di V2 sudah usang).
2. Tiap paket: implement → vitest → build → screenshot 1600/1200 → commit terpisah.
3. Aksi owner N-1 diverifikasi langsung: cookie palsu → 401; signup → 200; situs tetap hidup setelah repo private.
4. Rollback: revert per paket; rollback N-1 = kembalikan env/visibility repo (terdokumentasi di GO_LIVE).

---

## 7. Risiko

| Risiko | Mitigasi |
|---|---|
| Repo private memutus CF Pages | GO-LIVE ⚠: verifikasi situs langsung sesudahnya; rollback = public lagi |
| JWT_SECRET di-set → sesi lama (derived key) invalid | Diterima — itu security win; sesi lama hangus, login ulang |
| `849`/PII tersisa di file yang tidak tersentuh sweep upstream | P-3 sisa + N-1 PII sweep + **grep gate di CI** (fail build jika muncul) |
| Dua writer arena masih konflik state (BE-29) | P-2 single-writer + version CAS; sementara: hanya `latest_arena_state.json` yang di-commit workflow (sudah begitu) |
| Dev stub auth menyesatkan pengembang | Re-verify saat merge; label jujur atau hapus |
| Referensi baris audit V2 usang setelah 60 commit | V3 memakai nama simbol/nama file, bukan baris; P-7v2 mem-refresh bukti |

---

## 8. Yang tidak berubah dari V2

- **Trust-first = hukum tertinggi**; Zero Simulation Policy; PRD-03 provenance per field.
- Yang tidak masuk scope: billing automation penuh, RWA, futures lab, live execution uang nyata sampai gate F5, auto-publish tanpa reviewer, klaim peer-reviewed/DOI.
- Verifikasi per paket & rollout Cloudflare Pages (vitest + build + screenshot per commit).
