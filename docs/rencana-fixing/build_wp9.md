# BUILD WP9 — Kode mati D-7 dan simbol komoditas P2-7

Task: task-23 · Tanggal: 2026-10-11 · Owner: lead

## 1. D-7 — dua komponen mati dihapus

| Berkas | Ukuran | Bukti mati |
|---|---|---|
| `frontend/src/components/HomeDashboardTab.jsx` | 123 KB, 2.118 baris | nol import produk; satu-satunya rujukan adalah tes yang membacanya sebagai teks |
| `frontend/src/components/BloombergNewsWire.jsx` | — | hanya dipakai `HomeDashboardTab.jsx:2,413` |

Keduanya dihapus setelah diverifikasi. Efek berantai: `honestData.test.js:88-92` dulu membaca `HomeDashboardTab.jsx` sebagai teks untuk menjaga bug `defcon_level || 4`. Setelah berkasnya hilang, penjaga itu tidak ada artinya lagi, jadi saya pindahkan:

1. tes baru memastikan **kedua berkas tetap terhapus**, supaya tidak diam-diam dihidupkan lagi;
2. penjaga `defcon` dipindahkan ke komponen home yang **benar-benar dirender**, yaitu `cmc/CmcMarketDashboard.jsx`.

## 2. P2-7 — simbol komoditas: tiga kesalahan, bukan satu

Dugaan awal di rencana hanya "PLATINUM, COPPER, NATGAS tidak ada di daftar hook". Setelah diuji langsung ke TradingView, masalahnya lebih besar.

**Cara uji:** POST ke `https://scanner.tradingview.com/cfd/scan` dengan payload yang sama seperti produksi (`Content-Type: text/plain`).

| Simbol | Hasil uji 2026-10-11 |
|---|---|
| `TVC:GOLD` | hidup — Gold 4.193,84 |
| `TVC:SILVER` | hidup — Silver 60,817 |
| `TVC:DXY` | hidup — DXY 102,232 |
| `FX:USOIL` | **hidup** — WTI 91,648 |
| `FX:UKOIL` | **hidup** — Brent 104,401 |
| `TVC:PLATINUM` | **hidup** — Platinum 1.687,8 |
| `TVC:PALLADIUM` | **hidup** — Palladium 1.148,0 |
| `TVC:USOIL` | **MATI** — tidak mengembalikan apa pun |
| `TVC:UKOIL` | **MATI** |
| `TVC:COPPER` | MATI di pasar `cfd` |
| `TVC:NATGAS` | MATI di pasar `cfd` |

**Kesalahan yang ditemukan:**

1. `marketOverview.js:544` memakai `TVC:USOIL` dan `TVC:UKOIL` — awalan yang salah. Dua dari delapan simbol komoditas mati diam-diam. Hook `useLivePrices.js:51` selama ini memakai `FX:USOIL`/`FX:UKOIL` yang benar, jadi kedua daftar tidak sinkron.
2. `TVC:PLATINUM` **hidup** tetapi tidak ada di daftar mana pun sebelum perbaikan.
3. `TVC:COPPER` dan `TVC:NATGAS` memang tidak ada di pasar `cfd`. Padanannya ada di pasar `futures` sebagai `COMEX:HG1!` (Copper 6,692) dan `NYMEX:NG1!` (Henry Hub 3,22).

**Perbaikan:**

- `useLivePrices.js:50-61` — daftar jadi GOLD, SILVER, `FX:USOIL`, `FX:UKOIL`, DXY, PLATINUM, PALLADIUM. Semua sudah diuji hidup.
- `marketOverview.js:543-551` — awalan minyak diperbaiki; COPPER dan NATGAS dibuang beserta alasannya.
- Copper dan natural gas **tidak** ditambahkan lewat panggilan kedua ke pasar `futures`. Itu akan menambah satu request tiap penyegaran demi dua simbol. Dicatat sebagai pekerjaan lanjutan, bukan dipaksakan sekarang.

## 3. Tes

    npx vitest run  -> 43 files, 601 tests passed
    npx vite build  -> sukses

## 4. Sisa

- Copper dan natural gas belum tampil. Butuh keputusan apakah satu request tambahan ke pasar `futures` sepadan.
- `TVC:ALUMINUM`, `TVC:NICKEL`, `TVC:ZINC` juga sudah diuji dan tidak ada di pasar `cfd`. Tidak dimasukkan.
