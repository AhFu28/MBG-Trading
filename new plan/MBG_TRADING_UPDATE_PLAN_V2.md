# MBG-Trading — Updated Plan V2 (7-Point UI/UX & 24/7 Engine Fix)

**Versi:** 2026-10-04 · **Status:** PROPOSED — tidak ada kode yang diubah untuk rencana ini
**Basis:** [MBG_TRADING_UPDATE_PLAN.md](C:\Users\ASUS\Downloads\MBG_TRADING_UPDATE_PLAN.md) (UP-01..24, PRD-01..24, fase F0–F5) + [MBG_TRADING_PROJECT_MANUAL.md](C:\Users\ASUS\Downloads\MBG_TRADING_PROJECT_MANUAL.md) (route inventory, P0/P1 findings, data contracts) + [update-fitur-ini.md](C:\Users\ASUS\Downloads\update-fitur-ini.md) (spesifikasi Research Desk v1.0 — diintegrasikan sebagai P-8) + audit kode langsung pada snapshot saat ini + connectivity audit (§8).

**Ruang lingkup update ini:** 7 temuan user (UI/UX + engine 24/7) + audit design OpenDesign (P-9) — BUKAN full roadmap UP-01..24. Paket di bawah memetakan ke ID rencana induk agar tidak duplikasi keputusan.

---

## 1. Keputusan utama

1. **Trust-first tetap hukum tertinggi** (mengikuti UPDATE_PLAN §1 + PRD-03 provenance per field): angka tanpa source/as-of tidak boleh tampil sebagai observed. Temuan baru di update ini justru melanggar prinsip ini di 2 tempat (Running Trade `Math.random()`, fallback count `849`).
2. **Urutan pengerjaan = quick wins dulu**: CSP fix (chart langsung hidup) → home redesign → IDX source truth → news rework → arena 24/7 → flow diagram → design unification → Research Desk. Estimasi total update ini: **60.5–97 PD** (P-1..P-7: 22.5–35 + P-9 Design: 5–8 + P-8 Research Desk: 33–54).
3. **Arena berubah arsitektur**: dari simulasi browser + dua writer menjadi **satu authority server-side 24/7** (mengikuti manual §11.3 + risiko UPDATE_PLAN "State Arena berbeda-beda → One authority, version CAS").
4. **Home berubah layout**: dari split 2-kolom (dengan section collapse) menjadi **full-page ~6 blok** (mengikuti UPDATE_PLAN §6 target Home: "maksimal ~6 blok utama; hilangkan KPI portfolio tanpa akun/run") — news dapat ruang penuh.
5. **Design disatukan via kontrak brand**: [DESIGN.md](../DESIGN.md) (dibuat dari audit OD · Critique 5-dim) = satu sumber kebenaran token/type/layout — semua komponen di-refresh ke kontrak ini (OpenDesign workflow: agent + DESIGN.md), nol hex hardcoded, type minimum 12px, a11y basics (focus-visible, reduced-motion) wajib.

---

## 2. Analisis & desain per temuan user

### P-1 — Home: Smart Money/Flow section "hilang" → redesign full-page

**Fakta (audit):** Section tersebut TIDAK dihapus oleh perbaikan footer. Kode `SMART MONEY ORDER FLOW & BANDARMOLOGY RADAR` (HomeDashboardTab.jsx ~baris 1239–1543) masih ada — tetapi wrapper-nya memakai `flex: '1 1 0'` + `minHeight: 0` (terduplikasi di baris 1244–1246 dan 1281–1282) di dalam parent flex auto-height (`.home-cockpit-left` → `.home-middle-cockpit-split`, grid `1fr + 350px`). Child dengan flex-basis 0 di parent yang di-stretch mengalami **collapse ke tinggi ~0** → tidak terlihat. Bukti: screenshot SEBELUM perbaikan footer pun sudah tidak menampilkan section ini (before/after sama-sama tanpa section ini) — bug sudah ada sebelumnya, bukan regresi perbaikan footer.

**Keputusan user:** tidak dikembalikan; ganti dengan layout lain.

**Desain (full-page, news lebih lega):**

| # | Blok | Lebar | Sumber |
|---|---|---|---|
| 1 | Bloomberg News Wire (marquee benchmark + flash) | full | tetap |
| 2 | Portfolio & action bar (kompak 1 baris: valuasi + quick actions + alokasi) | full | refactor dari bento hero |
| 3 | Market bento: IHSG · Commodities · Crypto · IDX Alpha | full, 4 kolom | tetap, pindah dari split |
| 4 | Macro/risk: Yield curve · Portfolio risk · Sentiment gauges | full, 3 kolom | tetap, pindah dari split |
| 5 | **News & Research row — FULL WIDTH** (kartu lebih besar, 2–3 kolom, ruang baca lebih) | full | dikembangkan dari Live Intelligence Wire |
| 6 | Execution Matrix (3-kolom/tabel lebar) | full | tetap |

- Hapus `home-middle-cockpit-split` (2 kolom) dan section Smart Money yang collapse — fungsinya sudah tercakup di tab Whales (bandarmology) dan Saham IDX (flow per emiten).
- Hapus juga KPI portfolio yang tidak terikat akun/run (mengikuti UPDATE_PLAN §6 Home target).
- Verifikasi: screenshot 1600px & 1200px, tidak ada section tinggi-0 (cek DOM: tidak ada wrapper dengan computed height 0), vitest hijau.

**Estimasi:** 4–6 PD · **Dependensi:** tidak ada · **Memetakan ke:** UPDATE_PLAN §6 Home, PRD-20, UP-19 (parsial).

### P-2 — AI Agent Arena 24/7 real-trade (untuk pengembangan EA MT5)

**Fakta (audit):**
- Loop trading berjalan **di browser** dan hanya saat tab terbuka + flag `mbg_ai_arena_running` aktif (localStorage) → browser ditutup = arena berhenti. Bukan 24/7.
- State tersebar di **~12 localStorage keys** (`mbg_ai_arena_agents/positions/journal/capital_per_bot/risk_pct/timeframe/epoch_reports/execution_mode/scanner_mode/session_active_seconds/reset_ts/running`) — bukan satu ledger authoritative (manual: AI_AGENTS "Browser/localStorage simulation; not one authoritative ledger").
- Ada **dua writer engine**: `arena_evaluator.py` → `arena_state.json` vs `arena_runner_247.py` → `latest_arena_state.json` (BE-29 "Arena jumps backward", manual §7.1).
- GitHub Actions `arena_247_engine.yml`: cron tiap 5 menit, tapi tiap run hanya loop 4 menit @30s tick; scheduler delay + risiko cron disable 60 hari (manual §11.2: "A schedule declaration is not proof of successful execution").
- HF daemon (`deploy/huggingface/app.py`) menyajikan `/api/arena/state` tapi state-nya **instance-local file tanpa durable volume** (manual §11.3).
- `/api/ea` mengembalikan placeholder comment dengan status 200 (BE-28) — EA source tidak terverifikasi.

**Desain (satu authority, 24/7, dasar EA):**

1. **Pindahkan loop 24/7 ke HF daemon** — FastAPI background worker (tick 30s, jalan terus karena daemon selalu hidup), SATU writer dengan field `version` monotonic + CAS; state durabel (HF persistent volume, atau Supabase `system_state` sebagai store durabel).
2. **GH Actions jadi watchdog**, bukan engine utama: cek heartbeat daemon; hanya jalankan loop sendiri jika daemon down >15 menit. Hapus commit-state-per-5-menit ke git (sumber konflik rebase).
3. **Frontend jadi reader** canonical state: hapus loop simulasi browser + ledger localStorage; kontrol user (running/capital/risk) jadi panggilan API ke server. (Manual §9.3: satu account authoritative, events immutable & reconciled.)
4. **Data riil 24/7**: crypto via Binance stream (24/7); IDX/US/FX gated market-hours + Weekend Freeze (README Zero Simulation Policy) — bot memegang posisi EOD saat bursa tutup, tidak invent tick.
5. **Pipeline EA MT5**: reflection log + metrik per-strategi arena menjadi bahan evaluasi varian EA (kriteria champion: PF ≥ 1.6, MDD ≤ 10%, expectancy > 0, ≥ 40 trade/30 hari — README §Metodologi Turnamen); perbaiki `/api/ea` (BE-28) untuk menyajikan objek EA terverifikasi, bukan placeholder 200.

**Estimasi:** 8–12 PD · **Dependensi:** akses HF daemon + keputusan store durabel · **Memetakan ke:** BE-29, BE-28, manual §8/§11, UPDATE_PLAN PRD-08/PRD-09, UP-10 (parsial).

### P-3 — Saham IDX: hardcoded atau tidak?

**Jawaban: campuran — universe LIVE, tapi 4 titik hardcoded:**

| Titik | Lokasi | Status |
|---|---|---|
| Universe tab Saham IDX (`allIdxStocks`) | `useLivePrices.js` baris 164–197 — TradingView scanner `active_symbol`, range 850, sort Value.Traded | **LIVE** (tidak hardcoded) |
| Priority/bluechip poll | `DEFAULT_IDX_TICKERS` 30 ticker hardcoded (`useLivePrices.js` baris 20–26) + plan tickers dari bundle | Hardcoded fallback |
| Heatmap universe | `MarketHeatmapTab.jsx` `IDX_UNIVERSE` hardcoded (baris 24) | Hardcoded |
| **Running Trade tape** | `RunningTradeWidget.jsx` baris 34–150: `IDX_TICKERS` hardcoded + **`Math.random()`** membangkitkan trade palsu (bias buy 55%, lot & broker acak) | **Pelanggaran Zero Simulation Policy** sendiri ("Nol Mutasi Acak: tidak ada Math.random") |
| Count "849 STOCKS" | `App.jsx` baris 448 `stockCount={allIdxStocks.length > 0 ? allIdxStocks.length : 849}` — tampil di FEED HEALTH | Hardcoded fallback |

**Desain:**
1. RunningTradeWidget: hentikan generasi `Math.random()` — ikat ke data riil (bundle broker/tape jika ada) atau tampilkan status standby tanpa trade palsu; sumber tape riil = UP-09 (IDX broker/foreign flow integration) di rencana induk.
2. Fallback lists diberi label eksplisit + diambil dari `idx_categorized` bundle, bukan konstanta frontend.
3. Count saham: tampilkan angka riil dari live scan atau em-dash — jangan pernah `849` hardcoded (PRD-03/PRD-04).

**Estimasi:** 3–5 PD · **Memetakan ke:** UP-07/UP-09, PRD-03/04/05, FE-07.

### P-4 — Charting Desk: chart tidak muncul (root cause ditemukan)

**Root cause:** CSP di `frontend/public/_headers` baris 6:
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` → **skrip widget** `https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js` **diblokir**;
- **tidak ada `frame-src`** → fallback ke `default-src 'self'` → **iframe widget** (`s.tradingview.com`) **diblokir**;
- Changelog mengklaim CSP "aman untuk WebSocket Binance dan feed TradingView" — yang dicek hanya `connect-src` (`https: wss:`), bukan `script-src`/`frame-src`.

**Desain (1 file, minimal):**
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com;
frame-src https://s.tradingview.com https://www.tradingview.com;
```
+ fallback terlihat: jika widget tidak render dalam N detik → error state dengan pesan (bukan pane hitam kosong) — EmptyState/ErrorState per UPDATE_PLAN design system. Berlaku juga untuk TradingViewModal.

**Estimasi:** 0.5–1 PD · **Verifikasi:** screenshot charting desk setelah fix + cek console tanpa CSP violation.

### P-5 — Live News: rework UI/UX + relevan 24/7 (scope dipersempit: berita saja)

**Fakta (audit):** NewsTab ~1400 baris dengan microcopy padat 10–11px; FE-14 (refresh melapor sukses pada HTTP error); label arsip 14 tapi item tidak konsisten (LIVE-04, BE-04/05); generasi berita lewat `hourly_crypto_macro` (hourly/manual — tanpa bukti eksekusi, tanpa label freshness).

**Perubahan scope (integrasi spesifikasi Research Desk):** bagian paper/riset pindah ke P-8. Mengikuti update-fitur-ini.md §6.3: NewsTab **tetap tipe berita** + tautan "Baca paper terkait"; NewsDetailModal = ringkasan cepat, paper panjang dibuka sebagai halaman penuh — bukan menumpuk paper di dalam tab berita.

**Desain:**
1. **UI reader-first**: headline 16px + snippet, badge sumber + waktu (FreshnessBadge per UPDATE_PLAN design system), kartu summary-first, filter kategori jelas, tap target 44px, archive vs generate dipisah (UPDATE_PLAN §6 News: "Counts aktual; Refresh archive beda Generate").
2. **24/7 relevance**: news agent jalan per jam terjadwal + failure alert (L-03 sudah ada hook-nya); pertimbangkan HF daemon sebagai runner untuk reliabilitas; label freshness eksplisit observed/delayed/stale (manual §2.3) — edisi kadaluarsa terlihat, tidak disamarkan segar.
3. **Perbaiki FE-14**: gagal pada non-OK; pisahkan label "refresh arsip" vs "generate riset baru".
4. **Tautan paper**: item berita yang sudah menjadi paper terbit di Research Desk (P-8) tertaut "Baca paper terkait →".

**Estimasi:** 4–6 PD (turun dari 5–8; bagian paper pindah ke P-8) · **Memetakan ke:** FE-14, BE-04/05, UP-13 (parsial).

### P-6 — Flow Process: diagram zoomable (ala Miro/Visio)

**Fakta:** FlowProcessTab = penjelasan statis (34KB, tanpa grafik interaktif).

**Desain:** diagram SVG node-graph dari pipeline 5-layer (README: Data Ingestion → Quant Engine/AI Brain → State Storage → React Terminal → Execution/MT5):
- **Pan/zoom native**: wheel-zoom + drag-pan + tombol +/−/reset via CSS transform + event handler — **tanpa dependency baru** (ponytail ladder: native platform feature).
- Klik node → panel detail (endpoint/file/rule yang terlibat) — diagram = peta besar proyek, bukan dekorasi.
- Tetap satu file, data diagram dari konstanta lokal.

**Estimasi:** 3–5 PD · **Memetakan ke:** UPDATE_PLAN §6 "Academy/Flow/Changelog: education vs live analytics jelas".

### P-7 — Connectivity audit per section/feature (SELESAI)

Agent audit pertama **gagal sebelum selesai** (tanpa output); audit dikerjakan langsung dengan cakupan yang sama. Hasil: **semua `/api/*` yang dipanggil frontend punya handler production kecuali `/api/dev-bundle` (dev-only by design ✓)**; satu-satunya koneksi **BROKEN** = Charting Desk (CSP); **DEGRADED** = `/api/ea` (config placeholder) dan Arena (dua writer). Matriks lengkap + bukti file:line di §8; broken links dipetakan ke P-4, P-2, P-5, P-1.

### P-8 — Research Desk (jurnal/paper) — dari update-fitur-ini.md

**Sumber:** [update-fitur-ini.md](C:\Users\ASUS\Downloads\update-fitur-ini.md) v1.0 (4 Okt 2026) — spesifikasi implementasi lengkap MBG Research menjadi Research Desk bergaya jurnal/paper. Ruang lingkup khusus bagian Research; perubahan modul trading hanya untuk data/tautan yang dibutuhkan riset.

**Ringkasan desain (10 keputusan D01–D10):**
- **Tiga lapisan dari satu edisi**: Ringkasan Eksekutif · Paper Lengkap · Lampiran Teknis (section IDs sama; satu konten kanonik web+PDF — D01).
- **Evidence ledger dengan klaim bertipe** (D04): `fact / derived / inference / scenario / illustration` (§3.3); klaim material empiris 100% punya sumber; missing = `null` + alasan; confidence angka hanya bila ada kalibrasi.
- **Lifecycle editorial berversi**: Draft → Review → Approved → Published → Superseded/Withdrawn (§5.3); paper terbit immutable (D02); koreksi = edisi baru + `supersedes_edition_id`; **review manusia wajib** (D03); self-review diberi label bila pilot satu owner.
- **Perhitungan deterministik** (D05): LLM tidak menjadi sumber harga/valuasi/metrik; angka derivasi merujuk `calculation_run`.
- **Agent bounded 12-role** (§11.2): Planner → Collector → Data Steward → Quant → Literature → Writer → Skeptical Reviewer → Citation Auditor → Visualisation → Editorial QA → Human Reviewer → Publisher Service; agent TANPA kewenangan trading/publish (D07); budget/retry per stage; abstain saat bukti kurang.
- **PDF export kontrak edisi sama** (§12): A4, figures + sumber lengkap, render QA per halaman, reproducibility bundle.
- **Akses server-enforced** (D08): capability (`research.read.full/export.pdf/edit/review/publish...`) + market packs (`idx/us_equity/crypto/macro/all`); pilot Free + Pro.
- **Mulai dari paper IDX terkurasi** (D06): P0b = 1 paper IDX sample dengan calculation manifests; broker/ownership dossier = jenis paper berikutnya dengan dokumen terverifikasi.
- **Logo MBG & logo instrumen dipertahankan** (D09): reuse registry `stock-icons.js`/`crypto-icons.js` + fallback monogram — logo gagal → monogram branded, bukan logo aset lain (spec §6.3, UPDATE_PLAN design system "Instrument").
- **Model/provider/renderer adapter-swappable** (D10): hosted/local model adapter dengan model revision; isi & proses editorial tidak tergantung satu vendor; LLM bukan dependency pada reader/PDF retrieval (spec §6.2/§9).
- **Design system research tokens** (§9): mode Terminal vs Reading; komponen ResearchCard, ClaimBlock, CitationLink, SourceDrawer, FigureBlock, PaperTOC, ExportControl, CorrectionNotice; target WCAG 2.2 AA.
- **14 struktur section wajib** (§3.1): Metadata → Abstrak → Ringkasan → Konteks → Teori → Data → Metode → Hasil → Diskusi → Kontra-tesis → Skenario → Risiko → Kesimpulan → Referensi.
- **ERD lengkap** (§7): research_reports/editions/sections/sources/snapshots/claims/datasets/calculation_runs/figures/reviews/jobs/artifacts/events/policies (+ invariants: composite FK lintas edition, hash freeze, append-only).
- **Kontrak API target** (§8.1): `/api/research/reports|editions|drafts|reviews|publish|corrections|withdraw|exports|agent-jobs|bookmarks` + status code stabil (409 revision/hash conflict, 422 quality gate).

**Integrasi dengan paket lain di rencana ini:**
- **P-5**: NewsTab tetap berita + "Baca paper terkait" (spec §6.3) — bagian paper pindah ke P-8.
- **P-1**: research tokens (§9) melengkapi design system home; reader dibuka full-page.
- **P-3**: prinsip "missing = null + alasan, bukan angka karangan" (spec §3.3) = prinsip yang sama dengan Zero Simulation Policy.
- **P-2**: prinsip agent bounded + deterministik (spec §11) = prinsip sama dengan arena single-authority.
- **Connectivity (P-7)**: endpoint `/api/research/*` adalah TARGET (belum ada) — ditambahkan sebagai `functions/api/research/` baru tanpa menghapus endpoint existing (spec §6.3, migration additive §14.2).

**Fase (spec §14.1) — MVP P0a–P0g, 33–54 hari-orang:**

| Fase | Deliverables | Effort | Exit gate |
|---|---|---|---|
| P0a Foundation | Current-main check, identity/entitlement, schema, storage, flags | 5–8 hari | Server actor unik + deny-by-default terbukti |
| P0b Curated content | Template, evidence ledger, 1 paper IDX sample, calculation manifests | 4–7 hari | Reviewer menerima struktur + bukti |
| P0c Reader/catalog | Routes, search/filter, responsive reader, source drawer | 5–8 hari | US01–03 usability + access gates |
| P0d Editorial | Draft editor, revision, review, publish/correction | 6–10 hari | Frozen content + stale approval rejection |
| P0e PDF | Exporter, renderer worker, queue, storage, page QA | 4–7 hari | Same-edition export + long-document QA |
| P0f Agent pilot | Bounded planner/collector/writer/skeptic/QA | 5–8 hari | Golden set, costs, human-only publication |
| P0g Release | Security/access/E2E, restore drill, telemetry | 4–6 hari | Seluruh P0 acceptance lolos |

P1 (multi-asset, bookmark, compare) dan P2 (user request, Basic/Business, team workspace) diestimasi ulang setelah pilot. **Definition of Done MVP = checklist §15.2 spesifikasi** (14 item, termasuk: katalog tidak hardcode count, 1 paper IDX memenuhi template penuh, web+PDF same-edition hash, publish/correction/withdrawal terbukti, premium tidak bocor, agent abstain + berhenti saat budget habis).

**Estimasi:** 33–54 PD (MVP P0a–P0g) · **Dependensi:** keputusan persistence (Supabase project aktif) + reviewer capacity; identity minimal dibangun di P0a (overlap UP-02 rencana induk — satu jalur, jangan dua implementasi identitas).

---

### P-9 — Design-system unification via OpenDesign workflow (audit + refresh ke brand contract)

**Sumber:** OpenDesign (github.com/nexu-io/open-design, Apache-2.0) — audit via **OD · Critique skill (5-dim)** + **DESIGN.md brand contract**. Deliverable sudah dibuat: [critique-mbg-web.html](../../.tmp-audit/critique-mbg-web.html) (laporan review single-file dengan radar chart) + [DESIGN.md](../DESIGN.md) (kontrak brand 9-seksi, nilai token dari `frontend/src/index.css` yang ada).

**Fakta (skor audit, worst sustained band):**

| Dimensi | Skor | Bukti utama |
|---|---|---|
| Philosophy consistency | 5/10 | Arah SpaceX-class + single accent dideklarasikan, tapi JSX hardcode ~10 warna Tailwind (`#38bdf8/#60a5fa/#34d399/#10b981/#f59e0b` + rgba) yang tidak ada di token; komentar kode mengakui campuran "DRIBBBLE-STYLE HERO / Glassmorphic Bento" di desain Bloomberg/SpaceX |
| Visual hierarchy | **4/10 Broken** | 12+ ukuran font di bawah 14px (7px–10.5px, uppercase + tracking di mana-mana); lompatan hero 26px vs panel 8px; 10 kartu metrik bersaing tanpa tier |
| Detail execution | 5/10 | Token UNDEFINED dipakai (`--border-subtle`, `--accent-amber/cyan/purple/red`, `--bg-card`, `--bg-main`, `--color-bear/bull` → border render currentColor); section Smart Money collapse invisible; TAPI kontras badge sudah dikoreksi terukur (6.3:1/5.5:1/6.7:1) |
| Functionality | 5/10 | Charting Desk BROKEN (CSP, → P-4); touch target micro (font 7.5px, padding 2px 7px vs 44px WCAG); tanpa `:focus-visible` + `prefers-reduced-motion` (0 matches); breakpoint 7 nilai tersebar + `!important` |
| Innovation | 6/10 | Bento HUD + DEFCON barometer + marquee = memorable & earned; glassmorphism hero = grafted (dribbble di terminal) |

**Desain (workflow OpenDesign "refresh an existing codebase" = DESIGN.md + agent refactor komponen nyata ke brand spec):**

1. **Definisikan token undefined di `:root`** (P0, 1 file) — `--border-subtle`, `--accent-amber/cyan/purple/red`, `--bg-card`, `--bg-main`, `--color-bear/bull` → border berhenti render currentColor.
2. **Migrasi warna Tailwind hardcoded JSX → `var(--accent-*)`** (P1, per komponen) — HomeDashboardTab, AiAgentArenaTab, NewsTab, dll.
3. **Skala type ke ambang baca** (P1) — minimum 12px; microcopy 7–10.5px naik; body panel 13–14px; label 12px uppercase sebagai tier minimum.
4. **A11y basics global** (quick win) — `:focus-visible` ring 2px accent + offset; `@media (prefers-reduced-motion: reduce)` mematikan `tacticalPulse` + marquee.
5. **Satukan breakpoint** (P1) — 7 nilai → 3 (480/768/1200); hapus `!important` layout.
6. **Putuskan glassmorphism hero** (P1) — token-kan sebagai satu treatment terbatas atau hapus (DESIGN.md: dilarang di surface terminal).
7. **Touch target ≥40px** (P1) — tombol telemetry-btn + action pills.
8. **Critique re-run sebagai gate** — skor target: Hierarchy ≥7, Philosophy ≥7, tak ada band Broken; console tanpa token undefined.

**Eksekusi OpenDesign:** workflow native = `od agent setup deepseek-harness` (setelah `od` CLI / desktop app terinstall — saat ini hanya STUB plugin tanpa CLI/app; alternatif: agent + [DESIGN.md](../DESIGN.md) langsung di repo ini, tanpa install — path yang dipakai rencana ini). Critique skill = self-check loop sebelum emit tiap iterasi UI.

**Estimasi:** 5–8 PD · **Dependensi:** tidak ada (DESIGN.md sudah ada; P-4 mendahului untuk chart) · **Memetakan ke:** UPDATE_PLAN PRD-20, UP-19 (parsial), manual §5.3 (design tokens + a11y).

---

## 3. Paket, estimasi, dan urutan

| Urutan | Paket | Estimasi PD | Gate keluar |
|---|---|---|---|
| 0 | P-7 Connectivity audit | 0 (SELESAI) | Report di §8; broken links dipetakan ke P-4/P-2/P-5/P-1 |
| 1 | P-4 CSP fix (chart hidup) | 0.5–1 | Charting Desk render + console bersih |
| 2 | P-1 Home full-page redesign | 4–6 | Tidak ada section height-0; screenshot 2 lebar; vitest hijau |
| 3 | P-3 Source truth IDX (anti Math.random, count riil) | 3–5 | Tidak ada `Math.random()` di tape; count = riil/em-dash |
| 4 | P-5 News rework (berita saja) | 4–6 | FE-14 closed; freshness label; UI reader-first |
| 5 | P-2 Arena 24/7 single authority | 8–12 | Satu writer + version CAS; loop jalan saat browser tertutup; /api/ea bukan placeholder |
| 6 | P-6 Flow diagram zoomable | 3–5 | Pan/zoom jalan; klik node = detail |
| 7 | P-9 Design-system unification (OD critique + DESIGN.md) | 5–8 | Critique re-run: tak ada band Broken; console tanpa token undefined |
| 8 | P-8 Research Desk (jurnal/paper) | 33–54 (MVP P0a–P0g) | Definition of Done MVP = checklist §15.2 spesifikasi |

**Total update ini: 60.5–97 PD** (P-1..P-7: 22.5–35 + P-9 Design: 5–8 + P-8 Research Desk: 33–54) — tetap bukan full roadmap 79–141 PD di UPDATE_PLAN §7 (billing automation penuh tetap jalur induk; P-8 membangun identity minimal di P0a sesuai spesifikasinya — satu jalur dengan UP-02, jangan dua implementasi identitas).

---

## 4. Yang TIDAK masuk update ini

- Billing automation, team workspace, kuota berbayar penuh (UP-03/22; spec §5 P2) — P-8 memakai pilot Free + Pro; identity minimal dibangun di P-8 P0a sesuai spesifikasi, sisanya tetap jalur rencana induk.
- RWA, futures lab (UP-16/18) — keluar scope.
- Live execution uang nyata — tetap disabled sampai gate F5 (UPDATE_PLAN §7.1); arena 24/7 di P-2 adalah PAPER/simulasi deterministik untuk evaluasi EA, bukan trading uang nyata.
- Auto-publish tanpa reviewer, klaim peer-reviewed akademik/DOI (spec D02/D03, §1.1) — dilarang.
- Migrasi seluruh situs / model forecasting baru (spec §2.3) — keluar scope.

---

## 5. Verifikasi & rollout

1. Tiap paket: implement → vitest (86 test + tambahan) → screenshot 1600px & 1200px → `npm run build` → commit terpisah per paket.
2. Rollout: commit & push → Cloudflare Pages auto-deploy → verifikasi live (auth gate tetap; verifikasi manual lewat staging/local functions emulator — manual §10.2 poin 7). P-8 pakai feature flags terpisah (`research_catalog/reader/editorial/pdf/agents` — spec §14.3): internal owner/reviewer → curated paper public → Pro cohort.
3. Rollback: revert commit per paket (frontend revert aman karena tanpa migrasi schema di update ini; P-2 menyentuh store state — rollback = kembali ke writer GH Actions).

---

## 6. Risiko

| Risiko | Mitigasi |
|---|---|
| CSP longgar membuka permukaan baru | Hanya 2 origin TradingView ditambahkan; tanpa wildcard |
| Arena single-authority: HF daemon restart = state hilang | Durable volume/Supabase store + snapshot recovery; watchdog GH Actions |
| Home redesign menggeser perilaku responsive | Media query ditulis ulang menyeluruh (bukan nilai 480–1200px tersebar — manual §5.3) |
| Menghapus tape `Math.random()` mengubah tampilan yang "hidup" | Ganti dengan status standby/data riil; policy menang atas kosmetik |

---

## 7. Lampiran — bukti audit langsung (snapshot ini)

- Home: `HomeDashboardTab.jsx` baris 1240–1248 (flex collapse), screenshot before/after tanpa section Smart Money.
- Arena: `AiAgentArenaTab.jsx` baris 1939–2522 (localStorage), 2403–2440 (cloud merge hf.space + /api/arena-state); `.github/workflows/arena_247_engine.yml` (cron 5-menit, loop 4 menit); manual §7.1 (dua writer), BE-28/29.
- IDX: `useLivePrices.js` baris 20–26/164–197; `RunningTradeWidget.jsx` baris 34–150 (Math.random); `App.jsx` baris 448 (849 fallback).
- Charting: `ChartingDeskTab.jsx` baris 143–177 (widget embed); `frontend/public/_headers` baris 6 (CSP tanpa script-src/frame-src TradingView).
- News: `NewsTab.jsx` baris 42–97 (fetch/refresh); manual FE-14, LIVE-04.
- Flow: `FlowProcessTab.jsx` (statik, 34KB).
- **Design (OD critique)**: [critique-mbg-web.html](../../.tmp-audit/critique-mbg-web.html) — skor Philosophy 5 / Hierarchy **4 Broken** / Detail 5 / Function 5 / Innovation 6 (mean 5.0); bukti: ~10 warna Tailwind hardcoded di JSX, token undefined (`--border-subtle` dll.), microcopy 7–8px, tanpa focus-visible/reduced-motion, CSP memblokir chart. Kontrak brand: [DESIGN.md](../DESIGN.md).

---

## 8. Lampiran — Connectivity audit report (SELESAI)

Report lengkap: [connectivity-audit.md](../../.tmp-audit/connectivity-audit.md). Ringkasan:

| Section | Status | Catatan |
|---|---|---|
| Semua endpoint `/api/*` yang dipanggil frontend | CONNECTED | Semua punya handler production **kecuali** `/api/dev-bundle` (dev-only by design ✓, VIP payload tidak bocor) |
| **Charting Desk** | **BROKEN** | TradingView widget diblokir CSP (`script-src` tanpa `s3.tradingview.com`; tanpa `frame-src` → iframe fallback `default-src 'self'`) → fix **P-4** |
| `/api/ea` | DEGRADED | Placeholder 200 (`X-Data-Source: placeholder`) bila env `MT5_EA_SOURCE` tidak di-set; file EA riil ADA di `engine/mt5/MBG_Institutional_Apex_EA.mq5` → fix **P-2** |
| AI Agent Arena | CONNECTED* | Dua writer (BE-29) + loop hanya di browser (tidak 24/7) → fix **P-2** |
| News | CONNECTED* | Cookie forwarding/fallback mismatch (BE-04/05) + FE-14 → fix **P-5** |
| Home | CONNECTED* | Collapse bug section Smart Money (flex-basis 0) → fix **P-1** |
| Live prices | CONNECTED | `/api/scanner` + direct TradingView fallback + Binance WS/REST sehat; client updatedAt = arrival time, bukan event time |
| Lainnya (IDX, Crypto, Futures, Degen, OrderBook, Watchlist, Telegram) | CONNECTED | Caveat kualitas data (BE-09 OI units, funding fallback, provenance) = jalur rencana induk (UP-06/09/16) |

Catatan: agent audit pertama gagal sebelum selesai (tanpa output); audit dikerjakan langsung dengan cakupan yang sama — matriks lengkap + bukti file:line di report terlampir.
