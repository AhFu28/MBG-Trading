# 00 — Ringkasan Eksekutif
## AUDIT INTEGRITAS & PROVENANCE DATA TERMINAL — MBG Trading

Sumber objek audit: `frontend/src/components/DataIntegrityModal.jsx:245`
Waktu audit: **2026-10-08 19:35 – 2026-10-09 06:20 WIB**. Pengukuran ulang terakhir: **2026-10-09 06:08 WIB**.

---

## 1. Jawaban singkat

**Yang benar-benar realtime (3):**
1. Crypto spot — WebSocket Binance, `useLivePrices.js:564`. Push sub-detik, 24/7.
2. Crypto futures — WebSocket Binance, `CryptoFuturesTab.jsx:330`.
3. Akun/sesi/pembayaran — ditulis ke Supabase per request.

**Yang mendekati realtime (5):** IDX/US/Forex/Komoditas (poll 12 detik, tapi **hanya saat pasar buka**), Hyperliquid (1,5 detik), mempool Bitcoin (12 detik), order book crypto (Binance), global metrics (CoinGecko).

**Yang periodik, bukan realtime (6):** Macro Bundle (3–4 kali/hari, bukan tiap jam), Arena AI (3–4 kali/hari), News, Broker Summary IDX, Foreign Flow, US Stocks.

**Yang lama tidak update (7):**
- 2 hari: `idx_categorized.json`, `daily_trade_plans.json`.
- ~8,6 hari: `macro_telemetry.json`, `crypto_spot_10.json`, `research_archive.json`, `paper_portfolio.json`, `last_known_macro.json`.
- `arena_state.json` berstatus arsip: mtime 2 hari, isi sebenarnya **2026-10-05**.

**Yang menyesatkan (paling penting):** modal provenance itu sendiri. 4 dari 7 status feed-nya **hardcoded hijau** dan tidak pernah dihitung.

---

## 2. Tabel utama: mana realtime, mana tidak

| Stream | Sumber | Cadence NYATA | Usia saat audit | Verdict |
|---|---|---|---|---|
| Crypto spot | WS Binance | sub-detik | live | **REALTIME** |
| Crypto futures | WS + poll 20/30 s | live | live | **REALTIME** |
| Akun & pembayaran | Supabase | per request | live | **REALTIME** |
| Hyperliquid L2 | Hyperliquid | 1,5 s | ~1,5 s | NEAR-REALTIME |
| Mempool BTC | mempool.space | 12 s | ~12 s | NEAR-REALTIME |
| Order book crypto | Binance depth | on-demand | ~1 s | NEAR-REALTIME |
| IDX / US / FX / Komoditas | TradingView via /api/scanner | 12 s **saat buka saja** | membeku saat tutup | NEAR-REALTIME / BEKAS |
| Global metrics | CoinGecko (CMC gagal CORS) | periodik | 1–2 mnt | PERIODIK-CEPAT |
| Macro Bundle | git commit + Pages | 3–4×/hari (klaim: hourly) | 0,3 j | PERIODIK-JADWAL |
| Arena AI | commit akhir sesi | 3–4×/hari | 4,7 j | PERIODIK-JADWAL |
| News | ikut bundle | 3–4×/hari | ikut bundle | PERIODIK-JADWAL |
| IDX trade plans & kategori | workflow manual | terakhir 2026-10-07 | **48,4 j** | **STALE** |
| macro_telemetry & 4 lainnya | cache lama | berhenti 2026-09-30 | **205,7 j** | **MATI** |
| arena_state.json (lama) | arsip | berhenti | isi 2026-10-05 | **ARSIP** |
| Kurs USD/IDR di modal | hardcoded 16350 | tidak pernah | selamanya | **STATIS (diklaim VERIFIED)** |
| Whale tape | `Math.random()` | sintetis | - | **SINTETIK** (dilabeli DEMO) |
| Order book IDX + broker | dibangkitkan + hardcoded | sintetis | - | **SINTETIK** (diklaim "100% Real") |

Matriks lengkap 28 stream: `data_provenance_matrix.json`.

---

## 3. Alasan — kenapa ini terjadi

**a) Job "hourly" tidak hourly.**
`hourly_crypto_macro.yml:6` menjadwalkan `0 * * * *`. Commit nyatanya berjarak 3,7–7,5 jam. Rata-rata ~6 jam. GitHub Actions tidak menjamin cron rapat; antrean bisa turun.

**b) Lima workflow tidak punya jadwal.**
`daily_idx_morning`, `daily_idx_eod`, `evening_global_watch`, `intraday_idx_refresh`, `midday_sesi1_recap` hanya `workflow_dispatch`. Jadi IDX harian bergantung pada ada orang menekan tombol. Terakhir jalan 2026-10-07 05:43.

**c) Modal provenance tidak mengukur apa pun untuk 4 feed.**
- IDX: `const idxStatus = 'ACTIVE'` — hardcoded (`DataIntegrityModal.jsx:75`).
- Komoditas/FX: `status: 'SYNCED'` — hardcoded (baris 184).
- USD/IDR: `status: 'VERIFIED'` — hardcoded (baris 193). Nilainya pun default 16350 karena `App.jsx:1248-1258` tidak mengirim `usdToIdrRate`.
- Gemini: `status: 'READY'` — hardcoded (baris 202).

**d) Tombol Force Update hanya animasi.**
Progres 15→100% dijalankan `setTimeout` (`DataIntegrityModal.jsx:98-112`). Aksi nyatanya hanya `onRefetchAll()` dan `fetchArena()`. Tulisan "0ms Latency · All Feeds Refreshed" (baris 363) adalah string tetap.

**e) Saat pasar tutup, tidak ada polling.**
`useLivePrices.js:674-686` hanya me-refresh bila pasar buka. Di luar jam bursa, harga terakhir tetap tampil tanpa label "penutupan".

**f) Ada data yang dirakit di frontend.**
Order book IDX dibangkitkan dari harga terakhir dengan peluruhan eksponensial, dan daftar broker (UBS, Mirae, Mandiri) ditulis tetap lalu diskalakan (`OrderBookSimulator.jsx:203-214, 271-286`). File-nya tetap mengklaim "100% Real Data Pipeline".

**g) Snapshot edge bisa tertinggal.**
`data.js:55` meng-inline bundle saat build. Commit data memakai `[skip ci]` (`hourly_crypto_macro.yml:159`). Bila Cloudflare Pages menghormati flag itu, snapshot tidak ikut ter-refresh. **Belum diverifikasi** — perlu cek dashboard Pages.

**h) mtime menipu.**
mtime file cache = waktu commit/pull, bukan waktu produksi. `arena_state.json` mtime 2 hari tapi isinya 2026-10-05. Penilaian kesegaran harus pakai `last_updated`/`last_evaluated` di dalam JSON.

---

## 4. Rekomendasi lanjutan

**P0 — hentikan klaim palsu (paling mendesak)**
1. Ganti 4 status hardcoded di `DataIntegrityModal.jsx` dengan perhitungan nyata. Bila data tidak tersedia, tulis `TIDAK DIKETAHUI`, jangan hijau.
2. Kirim `usdToIdrRate` dan `usdToIdrTime` dari `App.jsx` ke modal — atau hapus barisnya.
3. Hapus "0ms Latency · All Feeds Refreshed", ganti dengan latensi terukur atau hilangkan.
4. Hapus klaim "100% Real Data Pipeline" di `OrderBookSimulator.jsx:5`, ganti menjadi "order book crypto real; kedalaman IDX disimulasikan".

**P0 — hentikan data mati**
5. Putuskan: `macro_telemetry.json`, `crypto_spot_10.json`, `research_archive.json`, `paper_portfolio.json`, `last_known_macro.json` dihidupkan lagi atau dihapus dari alur publish. Sekarang sudah 8+ hari mati.
6. Beri `schedule:` untuk IDX harian, atau tampilkan di UI bahwa IDX EOD bergantung trigger manual.

**P1 — jaga kejujuran dan kesegaran**
7. Verifikasi perilaku `[skip ci]` terhadap build Cloudflare Pages. Bila memblokir, hapus flag itu untuk commit data atau kirim bundle via KV/R2.
8. Tampilkan `X-Data-Age-Hours` dan `X-Data-Source` dari `/api/data` di UI, bukan hanya di header HTTP.
9. Tambahkan indikator "harga penutupan" saat pasar tutup.
10. Kirim alert Telegram saat `broker_summary_fetcher` jatuh ke mode `simulated`.
11. Bersihkan `arena_state.json` lama agar tidak terbaca sebagai sumber aktif.

**P2 — kerapian**
12. Turunkan label "REALTIME" pada IDX jadi "NEAR-REALTIME (12 detik)".
13. Pisahkan secara visual data nyata dan data simulasi di `WhaleIntelligenceTab`.

**Jaring pengaman:** tambahkan tes yang gagal bila `DataIntegrityModal.jsx` memuat status literal (`'ACTIVE'`, `'SYNCED'`, `'VERIFIED'`, `'READY'`). Sekarang hanya `arenaFreshness.test.js` yang menyentuh modal.

---

## 5. Yang belum bisa diverifikasi

- Apakah Cloudflare Pages men-skip build untuk commit `[skip ci]` → perlu dashboard Pages.
- Apakah upsert Supabase (`supabase_client.py:112`) benar-benar jalan di produksi → perlu kredensial/observasi DB.
- Cadence efektif CoinGecko free tier saat kena rate limit.
- Perilaku di produksi saat `/api/scanner` mengembalikan 401.

---

## 6. Catatan proses (penting)

Permintaan awal: deploy beberapa agen dengan **model berbeda** agar hasil saling melengkapi.
Hasilnya:
- Route model alternatif (`nvidia/*`: glm, nemotron, kimi) **tidak mengeksekusi tool** di sesi ini. Probe "tulis file" tidak menghasilkan file; satu agen mengeluarkan teks tidak terbaca (token soup). Sudah diuji, bukan dugaan.
- Lima teammate Agent Teams berjalan >2 jam dan **berhenti tanpa menulis laporan**, walau sudah di-time-box.
- Karena itu **audit diselesaikan langsung oleh Lead** dengan pembacaan kode dan pengukuran nyata. Bukti mentah: `00_LEAD_VERIFIKASI.md`.
- Konsekuensinya: tidak ada verifikasi silang antar-model. Semua temuan di laporan ini sudah diverifikasi ulang secara manual terhadap file pada 2026-10-09 06:00–06:20 WIB.

---

## 7. Isi folder ini

| File | Isi |
|---|---|
| `00_RINGKASAN_EKSEKUTIF.md` | Dokumen ini |
| `00_LEAD_VERIFIKASI.md` | Bukti mentah hasil verifikasi Lead |
| `01_frontend_realtime.md` | Audit stream data frontend |
| `02_engine_schedulers.md` | Audit engine Python & penjadwalan |
| `03_edge_api_cache.md` | Audit endpoint edge, cache, Supabase |
| `04_honesty_provenance.md` | Uji kejujuran/adversarial (11 temuan) |
| `05_staleness_matrix.md` | Matriks staleness terukur |
| `data_provenance_matrix.json` | Matriks 28 stream, machine-readable |
