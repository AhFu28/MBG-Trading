# Rencana putaran 5 — hasil pemeriksaan 2026-10-15

Semua angka di bawah **diukur**, bukan diperkirakan. Perintah dan keluarannya ada di bagian A.

---

## A. Status gerbang sekarang (semuanya hijau)

| Gerbang | Hasil |
|---|---|
| Tes frontend | 44 berkas, **623 tes lulus** |
| Build produksi | sukses |
| Tes engine | **160 lulus** + 5 subtes |
| Generator changelog | selftest **10/10**, `--check` exit 0 |
| Sintaks | Python `ast.parse` OK, YAML sah (9 step) |

Tidak ada yang rusak. Pekerjaan sesi ini secara teknis sehat — masalahnya di tempat lain (bagian B).

---

## B. Temuan, diurutkan menurut bahaya

### B-1 🔴 P0-0 masih terbuka — dibuktikan ulang HARI INI

```
POST https://mbg-trading.pages.dev/api/auth   {"password":"MBG"}
-> HTTP 200  {"authenticated":true,"tier":"PRO"}
```

Sandi default **"MBG"** masih membuka sesi tier PRO di produksi. Ini temuan yang sama dari 2026-10-11 — empat hari berlalu, belum ada rotasi.

Sampai ini ditutup, seluruh pekerjaan keamanan lain hanya menambal pintu yang pintunya sendiri masih terbuka. Rotasi `JWT_SECRET` + `PASSWORD_HASH` di Cloudflare Pages adalah **satu-satunya** perbaikan, dan hanya Jendral Arib yang bisa melakukannya.

### B-2 🟠 Tidak satu pun pekerjaan sesi ini live

Bukti: bundle produksi sekarang `assets/index-C5x-hBGv.js`. Tidak ada satu pun build lokal saya yang menghasilkan hash itu — artinya produksi belum pernah menjalankan perubahan ini.

Konsekuensinya: Market Overview yang tadinya crypto-only, ticker, tab Arsitektur, changelog FREE, dan semua perbaikan kejujuran **belum terlihat oleh pengguna mana pun**. 26 berkas berubah, 1.272 baris ditambah, 0 baris terkirim.

Penyebabnya: tidak ada commit sama sekali sepanjang sesi.

### B-3 🟠 Basis lokal tertinggal 42 commit di belakang `origin/main`

- Lokal: `0cd9ba7` · remote: `b91b8ee` · selisih: **42 commit**

**Kabar baiknya:** 42 commit itu **semuanya commit bot** dan hanya menyentuh dua berkas data (`latest_arena_state.json`, `latest_cockpit_bundle.json`). Tidak ada satu pun berkas sumber yang berubah, dan **nol bentrok** dengan 26 berkas yang saya ubah.

**Kabar buruknya:** kalau nanti di-publish tanpa sinkronisasi, perubahan akan duduk di atas snapshot data 4 hari lalu dan menimpa data yang lebih baru. Perlu `git pull` lebih dulu, sebelum commit apa pun.

### B-4 🟡 Dua item P0-4 setengah jalan

Yang **sudah** dikerjakan pada `news_macro.py`:
- R-1 cek umur tembolok (ambang 24 jam) — tembolok lebih tua diperlakukan sebagai tidak ada;
- R-2 umur dibawa ke label (`cached:264.5h`, bukan sekadar `cached`).

Yang **belum**:
- belum ada tes yang membuktikan ambangnya benar-benar bekerja;
- R-3 menghentikan tracking 5 berkas data mati di git;
- R-4 menghapus nilai keras `gold 2750 / brent 74.20 / dxy 104.50` yang bisa tampil sebagai angka sungguhan;
- R-5 memastikan `research_archive.json` benar dibaca atau memang artefak mati.

### B-5 🟡 Jam basi generator changelog

`--check` lulus hari ini karena commit terbaru 2026-10-10 (5 hari, ambang 14). Kalau tidak ada commit manusia sampai sekitar **2026-10-24**, gerbang itu mulai gagal. Ini bukan kerusakan — memang begitu seharusnya — tapi perlu diketahui sebelum menyalakannya di CI.

Catatan tambahan: langkah generator di workflow juga **belum ikut ter-commit**, jadi CI yang berjalan sekarang belum memakai generator itu sama sekali.

---

## C. Rencana kerja

Urutan ini disengaja: menutup kebocoran dulu, baru memasang perbaikan, baru menyelesaikan sisa.

### Paket 1 — Tutup kebocoran (Jendral Arib, di luar kode)

| # | Tindakan | Selesai bila |
|---|---|---|
| 1.1 | `npx wrangler login` lalu `wrangler pages secret put JWT_SECRET` dan `PASSWORD_HASH` | `POST /api/auth` dengan sandi `MBG` menjawab **bukan 200** |
| 1.2 | Rotasi juga `PASSWORD_HASH` karena hash lamanya masih tertulis di `CHANGELOG.md:514` dan riwayat git | Sandi lama tidak lagi diterima |

Setelah 1.1 beres, klaim admin berhenti fail-closed, dan **P1-10** (bypass `localStorage.mbg_admin_access`) baru aman dicabut. Jangan dibalik urutannya.

### Paket 2 — Samakan basis lalu terbitkan (Lead)

| # | Tindakan | Selesai bila |
|---|---|---|
| 2.1 | `git stash` → `git pull --rebase` → `git stash pop`, atau commit ke cabang baru dari `origin/main` | `git rev-list --count HEAD..origin/main` = 0, dan 623 tes tetap lulus |
| 2.2 | Commit 26 berkas perubahan + 13 berkas baru dalam beberapa commit bertema | `git status` bersih |
| 2.3 | Push ke `main`, tunggu Cloudflare Pages | Hash bundle produksi berubah dan tab Arsitektur bisa dibuka akun FREE |

**Risiko yang harus dijaga:** repo ini publik. Sebelum push, jalankan ulang pemindai PII pada berkas baru (`docs/rencana-fixing/*`, `rencana fixing.md`, `docs/CHANGELOG_AUTO.md`) supaya tidak ada nomor telepon atau email yang ikut terbit — persis kesalahan yang sudah pernah terjadi di sesi ini.

### Paket 3 — Selesaikan P0-4 (Lead)

| # | Tindakan | Effort |
|---|---|---|
| 3.1 | Tes engine untuk ambang umur tembolok (24 jam): tembolok tua diabaikan, tembolok segar dipakai | S |
| 3.2 | R-3 keluarkan 5 berkas data mati dari tracking + `.gitignore` selektif | S |
| 3.3 | R-4 hapus nilai keras, atau tampilkan "tidak tersedia" | M |
| 3.4 | R-5 pastikan `research_archive.json` dibaca atau dihapus | S |

**Peringatan untuk 3.2:** jangan abaikan seluruh `engine/cache/`. `latest_cockpit_bundle.json` dan `latest_arena_state.json` **memang sengaja** di-commit oleh workflow — itulah jalur terbitnya data. Yang diabaikan hanya 5 berkas mati.

### Paket 4 — Sisa produk (butuh keputusan dulu)

| # | Item | Yang dibutuhkan dari Jendral |
|---|---|---|
| 4.1 | Copper & natural gas | Setuju satu request tambahan ke pasar `futures`? |
| 4.2 | Kartu S&P 500 di Home | Sumber data mana? Belum ada di komponen. |
| 4.3 | P1-6 jadwal IDX harian | Terima "on-demand" sebagai desain, atau mau dijadwalkan? |
| 4.4 | Nomor WA Kamerad Fuad di kode | Pindah ke env var, atau biarkan? |

---

## D. Yang tidak bisa saya buktikan

- Tab Changelog dan Arsitektur belum dilihat di browser dengan akun FREE sungguhan.
- Workflow `hourly_crypto_macro.yml` belum pernah saya jalankan; yang terbukti hanya YAML sah, generator idempoten, dan selftest lulus.
- Apakah `fetch_macro_indicators` benar-benar dipanggil di pipeline cloud saat ini.
- Berapa lama Cloudflare Pages butuh untuk menerbitkan setelah push.

---

## E. Ringkas satu paragraf

Kode sesi ini sehat dan semua gerbangnya hijau, tetapi belum ada satu baris pun yang sampai ke pengguna, dan kebocoran kredensial yang jadi akar masalahnya masih terbuka empat hari kemudian. Urutan yang benar: Jendral merotasi kredensial, Lead menyamakan basis lalu menerbitkan, baru sisa pekerjaan dilanjutkan.
