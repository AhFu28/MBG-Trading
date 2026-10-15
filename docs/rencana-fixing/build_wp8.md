# Build WP8 — Perapian Home (D-2 … D-6)

Task: task-22 · Builder: recon-ticker · 2026-10-11 11:19 – 2026-10-12 00:10 WIB. Tidak commit.

## 1. File yang disentuh

| File | Perubahan |
|---|---|
| `frontend/src/components/cmc/CmcMarketDashboard.jsx` | D-2 kartu majors mengikuti pill + kartu indeks; D-3 hapus Market Cap/Volume ganda + judul pemisah; D-4 sub-judul kelompok tabel; D-6 header & baris error; footer 12px |
| `frontend/src/index.css` | Kelas `.cmc-group-row` untuk sub-judul kelompok tabel |
| `docs/rencana-fixing/build_wp8.md` | Laporan ini |

`frontend/src/components/cmc/CmcPrimitives.jsx` TIDAK perlu diubah.

**Catatan penting:** ada penulis lain yang menyentuh `CmcMarketDashboard.jsx` di waktu yang sama
(footer 12px sudah berubah lebih dulu dengan komentar `D-6`, muncul blok `D-5 decision` di baris ~250 dan
empty-state `majorCards` di baris ~606 yang bukan tulisan saya). Edit saya tetap utuh dan build hijau,
tetapi diff final wajib direview Lead karena berkas ini punya dua penulis.

## 2. Keputusan per item

### D-2 — kartu majors tidak selalu crypto
- `majorCards` (baris ~417-448) mengikuti pill: ALL/CRYPTO → `data.majors` (crypto, satu-satunya yang punya sparkline),
  US/FX/COMMODITY → 5 baris pertama `assetRows` untuk pasar itu.
- Alasannya: kartu crypto punya `sparkline` 7 hari; pasar lain tidak, jadi kolom kanan kartu dibuat kondisional
  (`hasSparkline`) alih-alih menampilkan grafik kosong.
- `MajorCard` kini memakai glif pasar (`MARKET_GLYPH`) untuk non-crypto dan mengirim `openAsset(symbol, market)`.
- **Kartu indeks hanya dari data yang SUDAH ADA** (`indexCards`, baris ~453):
  - **IHSG: TERSEDIA** — `livePrices.IHSG` / `livePrices['IDX:COMPOSITE']` (seed bundle `macro_telemetry`).
  - **DXY: TERSEDIA** — `livePrices.DXY` (alias dari kuotasi `TVC:DXY`, tag COMMODITY).
  - **S&P 500: TIDAK TERSEDIA** di komponen ini — tidak ada di `livePrices`, `allIdxStocks`, maupun `crossMarket`.
    Karena aturan kejujuran, kartu S&P 500 TIDAK dibuat dan tidak ada angka karangan. Tidak ada panggilan TradingView baru.

### D-3 — buang duplikasi & beri pemisah
- Market Cap + Volume (24h) tampil dua kali: di panel Market Status (global) dan di panel 'Kapitalisasi Pasar BTC'
  (turunan seri BTC). **Satu sumber dipilih: blok global.** Panel grafik kini HANYA menampilkan grafik BTC;
  toggle `overview/breakdown` dihapus (state `view` ikut dihapus) karena seluruh isinya menduplikasi blok global.
- Blok Fear & Greed / Altcoin Season / Dominasi sekarang punya judul sendiri **"Sentimen & Metrik Global"**
  di dalam panel Market Status, dengan garis pemisah di atasnya (sebelumnya menempel tanpa label).
- 'Bursa Aktif' dipindah ke blok baru itu supaya tidak hilang saat toggle breakdown dibuang.
- `GlobalMarketTicker.jsx` tetap TIDAK dipakai.

### D-4 — kelompokkan tabel
- Saat filter ALL, baris tabel dipecah jadi kelompok ber-sub-judul: **Crypto**, **Saham US**, **Valas (Forex)**, **Komoditas**
  (masing-masing dengan jumlah baris). Saat filter pasar tunggal, tabel tetap datar.
- Satu definisi baris dipakai bersama (`renderAssetRow`) supaya markup tidak digandakan.

### D-5 — default filter
**Dipilih: tetap ALL, dengan pengelompokan D-4.** Alasan: ALL adalah tampilan jujur paling lengkap dan
pengguna Home memang datang untuk gambaran pasar; pengelompokan + pill + pencarian sudah mencegah campur aduk,
dan default CRYPTO justru menyembunyikan data lintas pasar yang baru hidup setelah P0-2. Jumlah baris wajar
(±20 koin + 38 baris lintas pasar) di dalam panel yang sudah punya scroll sendiri.

### D-6 — header
- Judul + badge LIVE di kiri; waktu 'diperbarui' + tombol '↻ Segarkan' di kanan.
- Peringatan error turun jadi baris sendiri di bawah header, dengan kalimat "Sebagian data gagal dimuat.
  Hanya angka yang berhasil diambil yang ditampilkan." — tidak ada klaim data lengkap saat sebagian gagal.
- Footer: 11px → 12px, teks kecil 10,5px → 12px.

## 3. Acceptance criteria

| Kriteria | Status | Bukti |
|---|---|---|
| Satu layar tanpa scroll horizontal di 1280px | Sebagian | Tabel tetap punya `overflowX: auto` di dalam panel (bukan scroll halaman); jumlah kolom tidak diubah. Verifikasi visual BELUM DICEK |
| Tidak ada dua panel dengan informasi sama | Ya | Market Cap/Volume hanya di 'Sentimen & Metrik Global'; toggle breakdown + tile gandanya dihapus |
| Setiap bagian punya judul | Ya | 'Koin Mayor'/'Instrumen …', 'Indeks & Makro', 'Sentimen & Metrik Global', 'Semua Aset' + sub-judul kelompok |
| Footer minimal 12px | Ya | `fontSize: '12px'` pada footer dan teks kecilnya |

## 4. Perintah tes + hasil

```
cd frontend && npx vitest run src/components/__tests__/
```
```
 Test Files  20 passed (20)
      Tests  194 passed (194)
```
Exit code 0. Tidak ada tes yang perlu dilunakkan.

```
cd frontend && npx vite build
```
```
dist/assets/index-BpLV1cHo.js   393.79 kB │ gzip: 122.03 kB
✓ built in 2.01s
```
Exit code 0.

## 5. Sisa risiko

- **Konflik penulis**: berkas ini juga disentuh pihak lain saat saya bekerja. Diff final harus direview ulang.
- **Belum diverifikasi di browser**: layout 1280px, tinggi kartu non-crypto (tanpa sparkline), dan sticky sub-judul
  tabel (`top: 28px`) belum dilihat mata.
- **`top: 28px` untuk sticky group row** adalah perkiraan tinggi thead; kalau thead lebih tinggi, sub-judul bisa
  naik sedikit menutupi baris pertama.
- Kartu indeks hanya muncul kalau `livePrices.IHSG`/`DXY` sudah terisi; kalau belum, blok 'Indeks & Makro'
  tidak dirender (memang disengaja).

## 6. Belum dicek

- Tampilan nyata di browser 1280px dan perilaku scroll tabel — BELUM DICEK.
- Apakah S&P 500 bisa didapat dari sumber yang sudah ada — BELUM DICEK (di komponen ini tidak ada).
---

## 7. Tindak lanjut QA wave 3 (ditambahkan Lead, 2026-10-12)

Catatan: laporan di atas adalah akun pembangun aslinya. Bagian ini ditambahkan Lead setelah laporan sempat tertimpa,
supaya riwayat verifikasi tidak hilang.

QA independen (recon-home) memverifikasi WP8 dan menemukan **tiga regresi asli** yang tidak tertangkap tim penulis. Ketiganya sudah diperbaiki:

| # | Temuan QA | Perbaikan |
|---|---|---|
| 1 | Pasar terpilih kosong (scanner gagal) meninggalkan judul tanpa satu pun kartu | Empty state: "Belum ada kutipan untuk pasar ini..." saat tanpa kartu dan tidak sedang memuat |
| 2 | Kotak pencarian tabel ikut mengosongkan baris kartu mayor | `assetRows` dipecah: `marketRows` (tanpa pencarian) untuk kartu, `assetRows` (dengan pencarian) untuk tabel |
| 3 | `assetGroups = []` bersifat truthy sehingga bisa memilih jalur render yang salah | Mengembalikan `null` bila tidak ada grup berisi |

QA juga menilai dua assertion tes lemah. Keduanya diperkuat:

- **D-6** dulu hanya mengecualikan `10.5px` dan `11px`, sehingga regresi ke `9px` akan lolos. Sekarang menelusuri elemen induk dan memastikan ukurannya **angka >= 12**.
- **D-2** dulu hanya memastikan judul berubah. Sekarang menghitung kemunculan simbol `NVDA` sebelum dan sesudah, membuktikan **isinya** berganti, bukan hanya judulnya.

Tes bertambah dari 6 menjadi **8** (`CmcHomeLayout.test.jsx`).

**Hasil akhir:**

    npx vitest run src/components/__tests__/CmcHomeLayout.test.jsx  -> 8 passed
    npx vitest run                                                  -> 44 files, 616 tests passed
    npx vite build                                                  -> sukses

**Selisih angka dengan bagian 4 di atas** wajar: bagian 4 dijalankan saat WP8 baru selesai (194 tes komponen).
Bagian ini dijalankan setelah perbaikan QA dan mencakup seluruh suite.

