# BUILD WP10 — Tab Arsitektur publik (E-12, E-3, E-5)

Task: task-25 · Tanggal: 2026-10-11

**Catatan pelaksanaan:** dikerjakan rekan `recon-home`, lalu agennya gagal sebelum menulis laporan. Lead meninjau, menguji, memperbaiki satu tes yang tertinggal, dan menulis laporan ini.

## Masalah yang diselesaikan

Jendral Arib bertanya: *"bagian changelog & arsitektur kok tidak ada ya"*.
Changelog sudah dibereskan (E-1, E-3). Arsitektur belum: `FlowProcessTab` ada dan bagus, tetapi terkunci tier ADMIN **dan** tidak punya pintu masuk di navigasi. Dari produksi, tanpa login memakai akun owner, halaman itu mustahil dijangkau.

## Yang dibangun

| Bagian | Hasil | Bukti |
|---|---|---|
| Komponen baru | `frontend/src/components/ArchitectureTab.jsx` — 378 baris, peta arsitektur publik | berkas baru |
| Tier | `MODULES.ARCHITECTURE` = `TIER.FREE` | `featureAccess.js:34,134` |
| Pintu masuk | Item "Arsitektur Sistem" di grup Research & Learn | `CmcTopNav.jsx:79` |
| Bisa dicari | Terdaftar di Command Palette dan digerbangi `canAccess` | `CommandPaletteModal.jsx:61,81` |
| Wiring | Lazy import + render saat `activeTab === ARCHITECTURE`, TANPA gerbang isAdmin | `App.jsx:25,974-981` |
| FlowProcessTab | **tetap ADMIN** | `featureAccess.js:129` |

## Isi tab — dan mengapa ini aman dibaca publik

Halaman ini memuat: sumber data publik, pipeline cloud, penyimpanan, "gerbang kejujuran", dan alur sampai ke layar. Tiap pasar diberi label REAL-TIME / TERJADWAL / MANUAL supaya tidak ada klaim menyeluruh yang menyesatkan.

Bagian **"yang masih kurang"** justru dibuka lebar, antara lain: empat dari enam pipeline masih manual, riwayat historis valas dan komoditas belum ada, beberapa simbol komoditas tidak tersedia, dan jembatan MetaTrader 5 belum tersambung. Komentarnya: *"Bagian yang belum jadi lebih berguna kalau disebut daripada disembunyikan."*

Materi internal **sengaja tidak ditampilkan** — dinyatakan di komponen bahwa detail operasional tidak dimuat di halaman ini.

## Audit sanitasi (dijalankan Lead, independen)

Karena halaman ini dibaca akun FREE, saya pindai sendiri kode komponennya:

    JWT_SECRET, PASSWORD_HASH, COCKPIT_PASSWORD, ADMIN_TOKEN, sb_secret_,
    service_role, 6281224170187, 812-2417, naufalarib60, ahmfuadi28,
    @gmail, mbg_admin_access, password, sandi, token, api key, SUPABASE,
    dan pola hex 32+ karakter

Hasil: **nol kemunculan. Bersih.**

Berkas tesnya juga sudah memuat penjaga sanitasi berparameter: memastikan tidak ada string terlarang, tidak ada alamat konsol admin/host internal, dan memastikan tier-nya FREE (bukan GUEST) sehingga tamu tanpa akun tetap tidak bisa membacanya.

## Yang saya perbaiki setelah agen gagal

1. **Tes navigasi tertinggal.** `CmcTopNav.test.jsx` masih mengharapkan 8 item di grup Research & Learn; setelah ARCHITECTURE ditambahkan jadi 9, maka suite gagal 1. Ekspektasinya diperbarui beserta alasannya. Ini tepat jenis regresi yang tidak tertangkap kalau laporan ditulis sebelum tes dijalankan.
2. **Laporan ini.**

## P1-7 — daftar email admin ganda (dikerjakan menyusul)

Setelah WP10 selesai dan berkasnya bebas, daftar `naufalarib60@gmail.com` / `ahmfuadi28@gmail.com` yang terduplikasi di `App.jsx` dan `CmcTopNav.jsx` disatukan ke `ADMIN_EMAILS` + `isAdminEmail()` di `featureAccess.js`. Sekarang cuma ada satu daftar, jadi menu dan gerbang render tidak mungkin berbeda pendapat.

## Tes

    npx vitest run src/components/__tests__/ArchitectureTab.test.jsx  -> 13 tes lulus
    (koreksi QA wave 4: laporan ini semula menulis 7. Angka 7 diambil dari hitungan
     it() literal; tes berparameter mengembang jadi 13.)
    npx vitest run                                                    -> 44 files, 616 tests passed
    npx vite build                                                    -> sukses

## Risiko

- **Belum dilihat di browser.** Tab ini hanya terbuka setelah login; saya tidak memegang kredensial cockpit. Yang terbukti adalah render di jsdom, bukan tampilan nyata.
- Perubahan belum di-deploy, jadi produksi masih menampilkan keadaan lama.
