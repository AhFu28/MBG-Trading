# QA/QC WAVE 2 — verifikasi independen

Tanggal: 2026-10-11 · Task: task-20 · **Dikerjakan Lead**, karena agen QA (recon-docs) gagal di tengah dan tidak menghasilkan laporan apa pun. Keterbatasan ini dicatat apa adanya: verifikasi ini **bukan** oleh pihak ketiga independen seperti wave 1.

## Hasil tes

    cd frontend && npx vitest run     -> 42 Test Files passed, 594 Tests passed, exit 0
    cd frontend && npx vite build     -> sukses, 1,86 detik

Tidak ada kegagalan, jadi tidak ada kebutuhan membedakan kegagalan lama vs baru.

## Uji browser (Playwright, Chromium asli, dari build dist yang disajikan lokal)

| Periksa | Hasil |
|---|---|
| Pasar di ticker landing | **US, FX, CMDTY, CRYPTO** — 4 pasar, memenuhi acceptance criteria |
| Jumlah item di track | 32 (16 item x 2 salinan untuk loop mulus) |
| Harga terisi | Ya — NVDA 229.28, AAPL 336.64, MSFT 535.07, GOOGL 351.66, EURUSD 1.12, USDJPY 158.25, GOLD 4.193,84, SILVER 60.82, DXY 102.23, BTC 83.068,22, ETH, BNB, SOL, XRP |
| Placeholder kosong | Tidak ada |
| Stamp penyegaran | Diperbarui 10.39 |
| Error halaman | 0 |

**Temuan sampingan yang penting:** terisinya jalur US/FX/CMDTY membuktikan perbaikan CORS P0-2 (Content-Type text/plain) bekerja **end-to-end di aplikasi hasil build**, bukan hanya di probe terpisah.

IDX tidak muncul di landing — **wajar**, halaman publik tidak punya sesi sehingga tidak menerima data IDX. Acceptance criteria meminta 4 pasar, dan itu terpenuhi. Ticker di Home (setelah login) yang menerima allIdxStocks.

## Verifikasi redaksi data sensitif

Pencarian di frontend/src/data/changelogData.js untuk 812-2417, 8122417, 628122417, baab58, dan frasa sandi gerbang: **0 kemunculan**.
Konteks: sebelum redaksi, entri 6 Oktober memuat nomor WhatsApp partner dan link wa.me, dan entri v5.8.0 memuat sandi gerbang live beserta potongan hash sha256-nya. Karena Changelog kini tier FREE, keduanya akan terbaca setiap akun gratis.

## Klaim yang diperiksa

| Klaim | Status | Bukti |
|---|---|---|
| Ticker landing >= 4 pasar dengan badge | PASS | uji browser di atas |
| Ticker Home merakit dari data yang sudah ada, tanpa request baru | PASS | CmcMarketDashboard.jsx memakai livePrices/allIdxStocks/topCoins/crossMarket; tidak ada pemanggilan scanner baru |
| TradingView tetap 3 panggilan di landing | PASS | landing hanya memanggil US/FX/CMDTY lewat fetchCrossMarketAssets |
| prefers-reduced-motion dihormati | PASS | blok .market-ticker-track animation none di index.css |
| Label ticker tidak menyiratkan live | PASS | Realtime Market Engine diganti Snapshot 60 detik; komentar LandingPage.jsx:110 menyatakan tidak berpura-pura jadi live stream |
| Changelog: 3 entri Oktober, urutan menurun, tepat 1 LATEST | PASS | validasi struktur oleh WP5 + tes penuh lulus |
| semanticVersion tidak dikarang | PASS | diisi Tidak tercatat karena CHANGELOG.md memang tidak menyebut versi Oktober |
| Label IDX berhenti mengklaim REALTIME | PASS | MasterQuantLeaderboard.jsx -> JEDA ~12 DETIK, sumber jeda useLivePrices.js:686 |
| Jadwal hourly jujur | PASS | FlowProcessTab.jsx -> Cron tiap jam (:00), nyatanya 4-7 jam, status warn |
| Tidak ada fallback nama model keras | PASS | provenanceModel.test.js (3 tes) lulus; App.jsx kini null + TIDAK TERCATAT tanpa titik hijau |

## Sisa klaim live di landing yang saya nilai wajar

Uji browser menemukan kata live/realtime masih ada di halaman. Setelah ditelusuri, semuanya copy yang **benar**, bukan klaim palsu:
- LandingPage.jsx:585 Jam (Pro: real-time) dan :767 sinyal real-time tanpa penundaan — cocok dengan TIER_LIMITS PRO yang delayHours 0.
- :253 tagline cockpit v5.0 live market view — agak berlebihan untuk ticker snapshot 60 detik, tetapi terminal memang punya WebSocket Binance nyata. **Tidak diubah**, dicatat sebagai sisa.

## File di luar scope

Tidak ada. Seluruh berkas yang berubah dapat dipetakan ke write-scope task-12/13/14/17/18/19/21.

## Artefak asing

Bersih. Skrip sementara sudah dihapus; tidak ada .cjs di root repo. Server vite preview sudah dimatikan.

## Yang TIDAK bisa diverifikasi

1. **Perilaku di produksi** — perubahan belum di-deploy. Semua uji browser memakai build lokal.
2. **Ticker Home dengan sesi login** — butuh kredensial cockpit; yang diuji hanya landing publik. Klaim 5 pasar di Home berasal dari pembacaan kode, bukan pengamatan.
3. **Independensi** — wave 2 diverifikasi Lead sendiri setelah agen QA gagal, jadi tidak ada pemisahan penulis/penilai seperti wave 1.
4. **Kelengkapan riwayat changelog** — WP5 memetakan 14 section tanggal menjadi 3 entri (konvensi 1 entri per tanggal). Bila Jendral ingin 1 entri per sprint (33 heading), itu perubahan bentuk data.
