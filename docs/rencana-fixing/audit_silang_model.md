# AUDIT SILANG MODEL BERBEDA — diff WP1+WP2+WP3

Task: task-16 · Tanggal: 2026-10-11 · Lead: deepseek-v4.1-flash
Peninjau eksternal: **nvidia/nemotron-3-ultra-550b-a55b** dan **nvidia/z-ai/glm-5.3** (provider nvidia, model non-DeepSeek), masing-masing menerima diff 25.762 byte tanpa akses alat.

## Ringkasan

| Peninjau | Temuan utama | Status setelah adjudikasi |
|---|---|---|
| nemotron-3-ultra | "CRITICAL: token tanpa tanda tangan bisa jadi admin" | **DITOLAK** — false positive |
| glm-5.3 | "HIGH: ketidakcocokan huruf besar/kecil tier bisa membatalkan WP1" | **DITERIMA** — memicu perbaikan nyata |
| glm-5.3 | "MEDIUM: filter palette memakai perbandingan string, bukan gerbang asli" | **DITERIMA** — memperbaiki bug yang Lead buat sendiri |
| glm-5.3 | "legacy fallback fail-open, role admin mati, komentar terlalu panjang" | **DITERIMA sebagian** |
| QA (recon-docs) | "CRITICAL pre-existing: kunci JWT produksi dapat dihitung dari repo publik" | **DITERIMA — diverifikasi ulang oleh Lead** |

## 1. Nemotron: FALSE POSITIVE (CRITICAL)

Klaim: penyerang membuat JWT tanpa kind dengan tier apa pun, lalu mendapat isAdmin true.

Bantahan: predikat hanya berjalan **setelah** verifyJWT() memeriksa HMAC. auth.js:54-55 menolak tanda tangan tidak valid dan mengembalikan null saat gagal. Peninjau sendiri menulis di bagian 6 bahwa ia tidak dapat memverifikasi signJWT/verifyJWT — jadi temuan CRITICAL-nya dibangun di atas asumsi yang tidak diperiksa.

Namun klaim itu **berguna**: ia menunjukkan cabang legacy adalah fail-open bila ada keluarga token lain tanpa kind. Perbaikan diterapkan: bentuk legacy dicocokkan **tepat** (authenticated true DAN tier PRO), bukan lewat truthiness.

## 2. glm-5.3: TEMUAN VALID — inilah nilai audit silang

### 2a. Ketidakcocokan huruf besar/kecil tier (HIGH)

TIER = { GUEST: 'guest', ..., LEGEND: 'legend' } — huruf kecil, featureAccess.js:21. Server lama mengirim 'PRO' dan App.jsx:291 mengembalikan 'GUEST' untuk tamu.

Perbaikan: server kini mengirim 'legend' huruf kecil agar cocok dengan /api/account/me dan dengan perbandingan account.tier === 'legend' di CmcTopNav.jsx:565. Tanpa ini badge nav owner menampilkan label yang salah.

### 2b. Filter palette buatan Lead sendiri bocor (MEDIUM)

Lead menulis userTier !== 'guest'. Ternyata App.jsx:291 mengirim 'GUEST', sehingga 'GUEST' !== 'guest' bernilai true dan **tamu tetap melihat Changelog**. Gerbangnya mati.

Perbaikan: memakai canAccess(MODULES.CHANGELOG, userTier, isAdmin) yang menjalankan normalizeTier(). Satu gerbang, satu implementasi. Ditambah tes regresi CommandPaletteGate.test.jsx yang sengaja mengirim userTier="GUEST" huruf besar supaya kesalahan itu tidak bisa kembali.

### 2c. Diterima sebagian

- role admin dihapus dari klaim karena tidak pernah dibaca.
- Bentuk legacy diperketat (lihat 1).
- Komentar panjang dipertahankan: berkas ini membawa pelajaran insiden, biayanya hanya ukuran diff.

### 2d. Ditolak

- "email/expiresAt mati": email memang null pada jalur owner, tetapi kontrak respons dijaga seragam dengan jalur akun. Tidak diubah.
- "NewsTab GAGAL saat 0 artikel": itu justru perilaku yang diinginkan — feed tanpa item diperlakukan sebagai gagal, sesuai perbaikan P0-1.

## 3. QA (recon-docs) — temuan kritis pre-existing, DIVERIFIKASI ULANG OLEH LEAD

QA melaporkan kunci penandatanganan JWT produksi dapat dihitung dari konstanta publik. Lead mereproduksi sendiri:

```
POST https://mbg-trading.pages.dev/api/auth  {"password":"MBG"}
  -> 200 {"authenticated":true,"tier":"PRO"}
GET  /api/auth  (cookie dari login di atas)   -> 200
GET  /api/data  (cookie yang sama)            -> 200, 1.948.905 byte

Token yang ditandatangani sendiri memakai secret turunan
(sha256("MBG") + pepper publik "MBG-APEX-JWT-PEPPER-V1"):
GET  /api/auth  -> 200 {"authenticated":true,"tier":"legend"}
GET  /api/data  -> 200, 1.948.905 byte
```

Repo https://github.com/AhFu28/MBG-Trading **publik** (HTTP 200 saat diambil). Jadi hash sandi dan pepper benar-benar terbit.

**Akibat:** siapa pun dapat membaca seluruh bundel data cockpit (1,9 MB), dan sandi cockpit sebenarnya adalah MBG.
**Perbaikan diterapkan (sebagian):** klaim isAdmin kini fail-closed bila JWT_SECRET tidak diset, jadi WP1 tidak mengubah token palsu menjadi admin penuh. Perbaikan penuh butuh env var — lihat Bagian P0-0 di rencana.

## 4. Yang tidak bisa diverifikasi

- Perilaku UI setelah deploy.
- Jalur token akun lama yang mungkin terbit tanpa kind.
- Apakah setiap aksi admin memverifikasi ulang di server.
