# BUILD WP11 — Kejujuran klaim FlowProcessTab (E-8)

Task: task-26 · Tanggal: 2026-10-11 · Owner: lead

## Masalah

`FlowProcessTab` adalah peta arsitektur yang dibaca admin. Isinya dipercaya sebagai dokumentasi keadaan sistem — jadi setiap klaim basi di dalamnya berbahaya: orang mengambil keputusan dari situ.

Ditemukan dua klaim yang tidak lagi benar, dan satu klaim yang belum pernah benar saat ditulis.

## 1. Jumlah tes sudah basi

**Sebelum:** label `Tes frontend (396)`, detail `vitest run, 396 tes`.
**Kenyataan:** suite sekarang **603 tes** (43 berkas).

Angka 396 sudah tidak benar sejak beberapa rilis lalu. Angka yang bergerak akan selalu basi, jadi saya tidak menggantinya dengan angka baru yang akan basi lagi: label jadi `600+`, dan aturan yang mengikat dinyatakan tegas — **suite wajib hijau**, bukan jumlah tertentu.

## 2. Klaim harga pasar: dulu belum benar, sekarang benar tapi tanpa syarat

**Sebelum:** `SUDAH JALAN: saham, crypto, forex, emas`.

Kalimat itu ditulis saat rute lintas pasar **masih rusak** — header `application/json` memicu preflight CORS dan mati. Jadi klaimnya belum benar ketika ditulis. Ini yang membuat Jendral Arib melihat Market Overview hanya berisi crypto sementara dokumen bilang "sudah jalan".

**Sesudah:** disebutkan **apa** yang diverifikasi, **kapan**, dan **dengan cara apa**:

- diverifikasi 11 Oktober 2026 di browser sungguhan dari build produksi;
- saham US, forex, dan komoditas (emas, perak, minyak WTI/Brent, DXY, platinum, paladium) terisi;
- crypto lewat Binance WS/REST;
- kuncinya header `text/plain`;
- **BELUM ADA**: tembaga dan gas alam tidak tersedia di pasar `cfd`, padanannya di pasar `futures` butuh request tambahan.

Kalimat "SUDAH JALAN" tanpa syarat masih akan menyesatkan. Sekarang batasnya ikut tertulis.

## 3. Yang tidak saya ubah

- Baris `ROTASI kredensial` (`:73`) sudah benar dan menunjuk tindakan yang tepat — masih relevan, tidak perlu disunting.
- Riwayat run (`:42`) menyebut nomor run tertentu. Itu catatan historis, bukan klaim keadaan sekarang, jadi dibiarkan.

## 4. Ditunda: P1-7 (daftar email admin ganda)

Daftar `naufalarib60@gmail.com` / `ahmfuadi28@gmail.com` memang terduplikasi di `App.jsx:273` dan `CmcTopNav.jsx:177`. Rencananya disatukan ke satu helper di `featureAccess.js`.

**Ditunda** karena ketiga berkas itu sedang dipegang WP10 (tab Arsitektur publik). Menyentuhnya sekarang berarti dua penulis pada berkas yang sama. Dikerjakan setelah WP10 selesai.

## 5. Tes

    npx vitest run  -> 43 files, 603 tests passed
    npx vite build  -> sukses
