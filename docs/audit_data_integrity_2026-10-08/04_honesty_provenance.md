# 04 — Uji Kejujuran Data (Adversarial)

> Audit Integritas & Provenance Data — MBG Trading
> Tanggal audit: **2026-10-08 19:35 – 2026-10-09 06:00 WIB** (UTC+7). t0 pengukuran usia = `2026-10-08T19:35:17+07:00`.
> 
> Metode: pembacaan kode langsung + perintah pengukuran + riwayat git. Setiap klaim punya bukti `path:line` atau perintah.


## 1. Ringkasan eksekutif

Modal "AUDIT INTEGRITAS & PROVENANCE DATA TERMINAL" - yang seharusnya menjadi sumber kebenaran - mengandung **setidaknya 7 klaim yang tidak didukung kode**. Empat dari tujuh feed di dalamnya berstatus hardcoded hijau. Tombol "Force Update" menampilkan progres buatan dan klaim "0ms Latency". Di sisi komponen, ada order book IDX dan tape whale yang dibangkitkan/ditulis tetap namun tampil sebagai data pasar.

## 2. Temuan

| # | Temuan | Bukti | Klasifikasi | Bahaya |
|---|---|---|---|---|
| H1 | Status IDX **hardcoded** `'ACTIVE'` hijau, tanpa perhitungan kesegaran | DataIntegrityModal.jsx:75-76, 166-167 | **MENYESATKAN** | Tinggi |
| H2 | Feed "Komoditas & Valuta Global" `status: 'SYNCED'` hardcoded | DataIntegrityModal.jsx:184-186 | **MENYESATKAN** | Tinggi |
| H3 | Kurs USD/IDR `status: 'VERIFIED'` hardcoded; nilainya default `16350` karena prop tidak pernah dikirim | DataIntegrityModal.jsx:14-15, 193-195; App.jsx:1248-1258 | **PALSU** | Tinggi |
| H4 | Mesin LLM `status: 'READY'` hardcoded; nama model fallback dikarang | DataIntegrityModal.jsx:83, 202-203 | **MENYESATKAN** | Sedang |
| H5 | Progress Force Update 15->100% dijalankan `setTimeout`; aksi nyata hanya `onRefetchAll()` + `fetchArena()` | DataIntegrityModal.jsx:91-126 | **PALSU** | Sedang |
| H6 | Banner "0ms Latency . All Feeds Refreshed" adalah string tetap | DataIntegrityModal.jsx:363 | **PALSU** | Sedang |
| H7 | OrderBookSimulator mengklaim "100% Real Data Pipeline" tetapi order book IDX dibangkitkan dari last price dan daftar broker ditulis hardcoded | OrderBookSimulator.jsx:5, 203-214, 271-286 | **PALSU** | Tinggi |
| H8 | `WhaleIntelligenceTab` membangkitkan transaksi dengan `Math.random()` | WhaleIntelligenceTab.jsx:407-582 | **SINTETIK, tetapi dilabeli** "SIMULATED WHALE FEED (DEMO)" (:936) | Rendah |
| H9 | Klaim IDX/FX/komoditas "REALTIME" di UI, padahal jalurnya cache 10-15 s + poll 12 s | scanner.js:144; useLivePrices.js:674-686; MasterQuantLeaderboard.jsx:522, 671 | **MENYESATKAN (ringan)** | Rendah |
| H10 | Job "Hourly Crypto & US Macro Radar" nyatanya berjalan 5-8 jam sekali | hourly_crypto_macro.yml:1, 6 vs riwayat git | **MENYESATKAN** | Sedang |
| H11 | Judul "audit integritas" sementara 4 dari 7 status di dalamnya tidak dihitung | DataIntegrityModal.jsx:245 vs 75/184/193/202 | **MENYESATKAN** | Tinggi |

## 3. Yang sudah jujur (pertahankan)

- Arena **tidak** diklaim realtime: `'PERIODIC ACTIVE'` + penjelasan ambang 400/800 menit dari jadwal nyata (DataIntegrityModal.jsx:61-72), dijaga `arenaFreshness.test.js`.
- Bundle macro memakai ambang nyata: HEALTHY <60 mnt, DEGRADED 60-360, STALE >360 (DataIntegrityModal.jsx:22-25).
- Crypto WS menyatakan benar `CONNECTED (REALTIME)` vs `FALLBACK POLLING (45S)` (baris 80).
- `/api/data` mengirim `X-Data-Live: false` untuk snapshot (data.js:255).
- `crypto_spot.py:143` memilih list kosong daripada fallback harga karangan; `whale_tracker.py:226-236` menghapus daftar paus hardcoded; `forex_scanner.py:19` menghapus COT hardcoded.

## 4. Tes honestData

`frontend/src/services/__tests__/honestData.test.js` mengunci beberapa perilaku jujur (RunningTrade tidak lagi `Math.random`, label kesegaran berita). Namun **tidak ada tes yang mengunci DataIntegrityModal** selain ambang arena - H1..H6 bisa kembali kapan saja tanpa gagal CI.

## 5. Rekomendasi

- **P0** - Ganti H1-H4 dengan perhitungan kesegaran nyata; bila data tidak tersedia tampilkan `TIDAK DIKETAHUI`, bukan hijau.
- **P0** - Kirim `usdToIdrRate`/`usdToIdrTime` dari App.jsx atau hapus barisnya dari modal.
- **P0** - Hapus string "0ms Latency" atau ganti dengan latensi terukur.
- **P1** - Ubah klaim OrderBookSimulator menjadi "order book crypto real; kedalaman IDX disimulasikan".
- **P1** - Tambahkan tes yang memastikan tidak ada status literal hardcoded di modal.
