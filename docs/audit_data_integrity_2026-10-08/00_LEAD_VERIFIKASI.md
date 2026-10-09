# 00 — Verifikasi Langsung Lead (bukti mentah, sebelum konsolidasi)

> Dokumen ini diisi **Lead** dari pembacaan/perintah langsung, bukan rangkuman agen.
> Waktu verifikasi: **2026-10-08 ~19:35–22:50 WIB (UTC+7)**. t0 = `2026-10-08T19:35:17+07:00`.
> Semua temuan di bawah sudah diverifikasi ulang dengan membaca file/perintah yang disebut.

## A. Klaim status di modal "AUDIT INTEGRITAS & PROVENANCE DATA TERMINAL"

Sumber: `frontend/src/components/DataIntegrityModal.jsx`

| # | Baris | Kode | Masalah |
|---|-------|------|---------|
| A1 | 75–76 | `const idxStatus = 'ACTIVE'; const idxColor = '#10b981';` | Status IDX **hardcoded hijau**. Tidak ada perhitungan kesegaran sama sekali. |
| A2 | 184–186 | `status: 'SYNCED'`, `statusColor: '#10b981'` (Komoditas & Valuta Global) | **Hardcoded**. Tidak membaca `lastUpdateTime` untuk menentukan status. |
| A3 | 193–194 | `status: 'VERIFIED'`, `statusColor: '#10b981'` (Kurs USD/IDR) | **Hardcoded**; hanya `lastUpdate` (string) yang memakai `usdToIdrTime`. |
| A4 | 202–203 | `status: 'READY'`, `statusColor: '#38bdf8'` (Mesin Sintesis AI) | **Hardcoded**. |
| A5 | 83 | `data?.model_used \|\| data?.daily_snips?.model_used \|\| 'gemini-3.8-flash (Auto-Discovered)'` | Label default **dikarang di frontend**; bila bundle tidak memuat `model_used`, UI menampilkan nama model yang bisa saja bukan model yang benar-benar jalan. |
| A6 | 91–126 (`handleForceUpdate`) | Progres = `await new Promise(r => setTimeout(r, 280/320))`; aksi nyata hanya `onRefetchAll()` + `fetchArena()` | **Progress bar 15→45→70→90→100% palsu (timer)**, bukan hasil pengukuran sinkronisasi. |
| A7 | 363 | `0ms Latency · All Feeds Refreshed` | **String hardcoded**. Tidak ada pengukuran latency apa pun di file itu. Banner muncul setiap kali tombol Force Update ditekan. |

## B. Bug prop: USD/IDR selalu memakai nilai default

- `frontend/src/App.jsx:1204–1214` merender `<DataIntegrityModal data={data} isWsConnected={...} lastUpdateTime={...} onRefetchAll={...} />` — **tidak** mengirim `usdToIdrRate` maupun `usdToIdrTime`.
- Akibatnya modal selalu memakai default `usdToIdrRate = 16350` (`DataIntegrityModal.jsx:14`) dan `usdToIdrTime = null` (baris 15).
- Di UI: baris 192 menampilkan `'Real-time cache'` (karena `usdToIdrTime` null) dan baris 195 menampilkan `Rp 16.350` sebagai kurs acuan — **angka statis yang dipresentasikan sebagai terverifikasi**.

## C. Usia data sebenarnya (diukur, t0 = 2026-10-08 19:35 WIB)

| File (engine/cache/) | mtime lokal | Usia di t0 | Timestamp internal di JSON | Catatan |
|---|---|---|---|---|
| latest_cockpit_bundle.json | 2026-10-08 17:15:20 | **139,9 mnt (~2,3 j)** | `last_updated = 2026-10-08T09:53:26Z` (=16:53 WIB, usia ~2,7 j) | mtime = waktu commit/pull; isi lebih tua ~22 mnt |
| latest_arena_state.json | 2026-10-08 18:23:31 | **71,8 mnt** | `last_evaluated = 2026-10-08T10:28:25Z` (=17:28 WIB) | wajar untuk jadwal 4×/hari |
| daily_trade_plans.json | 2026-10-07 05:43:32 | **2.271,8 mnt (~1,6 hari)** | — | |
| idx_categorized.json | 2026-10-07 05:43:32 | **2.271,8 mnt (~1,6 hari)** | — | |
| arena_state.json | 2026-10-07 05:43:32 | **2.271,8 mnt (~1,6 hari)** | `last_evaluated = 2026-10-05T07:43:06Z` | **arsip**: konten 3 hari lebih tua dari mtime; sudah digantikan `latest_arena_state.json` |
| macro_telemetry.json | 2026-09-30 16:24:33 | **11.710,7 mnt (~8,1 hari)** | `updated_at = 2026-09-27T14:26:07` | isi ~11 hari |
| crypto_spot_10.json | 2026-09-30 16:24:32 | **11.710,7 mnt (~8,1 hari)** | — | |
| research_archive.json | 2026-09-30 16:24:33 | **11.710,7 mnt (~8,1 hari)** | — | |
| paper_portfolio.json | 2026-09-30 16:24:33 | **11.710,7 mnt (~8,1 hari)** | — | |
| last_known_macro.json | 2026-09-30 16:24:33 | **11.710,7 mnt (~8,1 hari)** | — | |

Kesimpulan awal: 5 dari 10 file cache **> 8 hari tidak tersentuh**.

## D. Jadwal nyata vs klaim (dari riwayat git, bukan teori cron)

- `hourly_crypto_macro.yml:6` menjadwalkan `cron: '0 * * * *'` (tiap jam).
- Commit `chore(data): automated bundle refresh [hourly_crypto_macro]` yang benar-benar terjadi:
  - 2026-10-08 09:53Z, 2026-10-08 02:26Z, 2026-10-07 22:36Z, 2026-10-07 17:14Z, 2026-10-07 09:44Z, 2026-10-07 02:01Z, 2026-10-06 22:14Z, 2026-10-06 17:51Z, 2026-10-06 11:44Z …
  - **Jarak antar-commit 5–8 jam**, bukan 1 jam. Job "hourly" secara efektif hanya jalan beberapa kali sehari.
- `arena_247_engine.yml:20` `cron: '0 0,6,12,18 * * *'`; commit arena nyata: 10-08 10:28Z, 10-08 04:15Z, 10-07 18:15Z, 10-07 10:18Z, 10-07 03:51Z → **konsisten ~4×/hari** (offset ~2–4 jam dari slot 00/06/12/18 karena sesi berdurasi 5j25m).
- Workflow manual (tanpa `schedule:`): `daily_idx_morning`, `daily_idx_eod`, `evening_global_watch`, `intraday_idx_refresh`, `midday_sesi1_recap` → **BATCH-MANUAL**.

## E. Risiko `[skip ci]` terhadap snapshot yang di-inline

- `hourly_crypto_macro.yml:159` → commit memakai pesan `... [skip ci]`.
- `frontend/functions/api/data.js:55` meng-import bundle sebagai **snapshot yang di-inline saat build**: `import bundledSnapshot from '../../../engine/cache/latest_cockpit_bundle.json'`, dan komentar baris 28–32 menyatakan snapshot "as fresh as the last Cloudflare deploy" (lag ~1 jam diasumsikan).
- **RISIKO**: bila Cloudflare Pages menghormati `[skip ci]` (men-skip build), snapshot yang di-inline **tidak ikut ter-refresh** oleh commit data, sehingga jalur fallback bisa tertinggal jauh lebih lama dari 1 jam — hanya ikut berubah saat ada commit kode.
- Sisi baik: `data.js:252–255` mengirim header jujur `X-Data-Live: false` + `X-Data-Age-Hours`.
- **Status: TIDAK TERVERIFIKASI** apakah Pages skip build untuk `[skip ci]` pada repo ini — perlu cek dashboard Cloudflare Pages / setelan build.

## F. Endpoint (dibaca langsung)

- `frontend/functions/api/scanner.js`: reverse proxy nyata ke `https://scanner.tradingview.com/<market>/scan` (baris 120–128), session-gated (92–99), rate limit 30/menit (28), edge cache `max-age=10, s-maxage=15` (144), allowlist `indonesia|america|forex|cfd` (10). → Klaim "REALTIME" untuk IDX/FX/CFD/US sebenarnya **NEAR-REALTIME** (cache upstream 10–15 dtk + poll klien 12 dtk).
- `frontend/functions/api/arena-state.js`: ambil `LATEST_ARENA_STATE` dari Supabase → fallback `/api/data` (`bundle.arena_state`) dengan `Cache-Control: private, max-age=30`. → **PERIODIK-JADWAL**.
- `frontend/functions/api/data.js`: urutan sumber = Supabase REST → KV/R2 → snapshot inline; `Cache-Control: no-store` untuk error, `max-age=30, s-maxage=60, stale-while-revalidate=120` untuk jalur Supabase.

## G. Catatan lingkungan

- Repo sedang **aktif diubah** oleh pekerjaan lain selama audit (banyak file berubah mtime 2026-10-08 20:08; muncul `new plan/MBG_TRADING_UPDATE_PLAN_V3.md`, `supabase/schema.sql` baru 20:44). Temuan apa pun harus diverifikasi ulang terhadap mtime file saat dibaca.
- Route subagen alternatif (`nvidia/*`: glm, nemotron, kimi) **tidak mengeksekusi tool** di sesi ini — probe menulis file gagal (file tidak dibuat). Karena itu investigasi dijalankan lewat **Agent Teams** (harness sesi), dan model alternatif hanya dipakai sebagai reviewer teks.
