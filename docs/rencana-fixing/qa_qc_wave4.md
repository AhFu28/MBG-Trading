# QA/QC WAVE 4 (task-27) — verifikasi independen WP10, WP11, P1-7

QA tidak mengubah kode produk. Satu-satunya berkas yang ditulis: laporan ini.
Tanggal audit: 2026-10-11 s/d 12. Semua angka di bawah saya jalankan/ukur sendiri.

## DISCLOSURE — konflik kepentingan
Saya (recon-home) adalah **penulis WP10/task-25**. Lead meminta saya mengauditnya sendiri. Ini bukan QA pihak ketiga
yang sepenuhnya independen. Sanitasi, tier gate, wiring, dan perilaku palette saya uji ulang dengan pola dan skrip
buatan sendiri di luar repo, tetapi Lead harus menimbang konflik ini saat memutuskan.
Dua fakta yang perlu dicatat lebih dulu:
1. Satu tes WP10 **sempat GAGAL** di run saya sendiri: `CmcTopNav.test.jsx:82` mengunci daftar id grup RESEARCH secara
   persis, sehingga penambahan ARCHITECTURE memecahkannya. Sekarang baris 91-94 sudah memuat ARCHITECTURE, jadi tes itu
   lulus. Perbaikan itu **bukan** hasil kerja saya (task-25 sudah `completed` oleh lead).
2. `docs/rencana-fixing/build_wp10.md` (laporan WP10) menyebut "ArchitectureTab.test.jsx -> **7 tes lulus**". Jumlah
   sebenarnya **13 tes** (saya jalankan berkas itu sendirian: `13 passed`). Angka di laporan itu salah.

## Ringkasan verdict

| # | Yang diperiksa | Verdict | Bukti inti |
|---|---|---|---|
| A | Sanitasi ArchitectureTab.jsx (halaman PUBLIK) | **BERSIH** untuk kategori berbahaya; 5 kemunculan LOW di komentar | 14 pola saya, 0 kredensial/email/telepon/IP/URL/token |
| B | Tier gate ARCHITECTURE | **PASS** | 27/30 assertion skrip luar repo; palette 6/6 lulus |
| C | Wiring App / CmcTopNav / lazy import | **PASS** | branch tanpa isAdmin, bukan ADMIN_ONLY_IDS, chunk 11 KB terpisah |
| D | P1-7 satu sumber email admin (frontend/src) | **PASS** dengan 2 catatan | 1 literal di kode; `isAdminEmail` lemah pada non-string |
| E | E-8 klaim FlowProcessTab tidak basi | **SEBAGIAN — 2 klaim SALAH** | klaim /api/ea & jadwal harian 22:30 UTC |
| F | Suite penuh + build | **PASS** | 44 files / 616 tests, build 1,93 s |
| G | Regresi yang tidak tertangkap | 4 celah | lihat bagian G |

---

## A. Audit sanitasi ulang (pola buatan sendiri)

Skrip `%TEMP%\qa4\scan.cjs` membaca sumber `frontend/src/components/ArchitectureTab.jsx`
(378 baris, SHA-256 `D04253508038E419E859B0FAAE283DCDBA302ACF73BED4D7978DB76B7B8FB425`, belum berubah sejak ditulis)
dan menjalankan 14 pola. Hasil:

| Kategori pola | Hasil |
|---|---|
| `JWT_SECRET\|PASSWORD_HASH\|COCKPIT_PASSWORD\|ADMIN_TOKEN\|sb_secret_\|sbp_\|service_role` | **bersih** |
| nomor telepon `+62\|62 8\|08xx-xxxx-xxxx` | **bersih** |
| `wa.me\|whatsapp` | **bersih** |
| alamat email apa pun (`x@y.z`) | **bersih** |
| IP LAN `10.x\|192.168.x\|172.16-31.x` | **bersih** |
| port internal `:1938x\|:8787\|:3000` | **bersih** |
| host internal (`supabase.co\|dash.cloudflare\|pages.dev\|localhost\|127.0.0.1\|ngrok`) | **bersih** |
| hex ≥32 karakter | **bersih** |
| base64 ≥40 karakter | **bersih** |
| bentuk JWT `eyJ...x.y` | **bersih** |
| prosedur admin (`cara menaikkan\|approve tier\|chat_id\|expires_at\|grant`) | **bersih** |
| URL absolut `http(s)://` | **bersih** |
| **nama berkas/prosedur internal** | **4 HIT** (komentar saja) |
| **nama orang (owner)** | **1 HIT** (komentar saja) |

**5 kemunculan, semuanya di komentar header berkas (baris 7-17), bukan di teks UI:**
- baris 8, 12, 13, 17: kata `FlowProcessTab` (menjelaskan mengapa komponen ini dipisah dari peta internal).
- baris 7: kutipan permintaan Jendral Arib ("bagian changelog & arsitektur kok tidak ada ya").

**Penilaian:** untuk kategori yang berbahaya (kredensial, data pribadi, alamat internal, token/hash, prosedur admin,
URL) halaman ini **bersih total** — tidak satu pun pengguna bisa melihatnya, karena komentar tidak dirender.
Dua sisa temuan saya nilai **LOW, bukan pelanggaran**: komentar tidak tampil di UI. Tetap saya laporkan karena
(a) repo ini kemungkinan masih publik (peta internal FlowProcessTab sendiri menyebut "Repo → private" masih pending),
dan (b) tes sanitasi milik WP10 memindai **sumber**, bukan hasil render — jadi sebuah komentar bisa menjadi satu-satunya
tempat materi internal lolos. **Saran (bukan perubahan yang saya lakukan):** ganti "FlowProcessTab" menjadi "peta proyek
internal" dan hapus nama orang dari komentar header.

## B. Tier gate — uji PERILAKU, bukan baca kode

Skrip `%TEMP%\qa4\tier.cjs` menyalin `frontend/src/services/featureAccess.js` ke `.mjs` di luar repo
(copy terbukti **byte-identical**, sha256 `c187ce6d38c9285f...`) lalu mengimpornya dan menguji matriks tier.
Hasil: **27 pass, 3 fail** — dan ketiga "fail" itu bukan regresi WP10:

| Uji | Hasil |
|---|---|
| GUEST tidak bisa ARCHITECTURE | **PASS** (`false`) — termasuk string `'GUEST'` huruf besar yang dipakai App.jsx |
| FREE / PRO / LEGEND / ADMIN bisa ARCHITECTURE | **PASS** (semua `true`) |
| flag admin membuka ARCHITECTURE walau tier GUEST | **PASS** |
| GUEST/FREE/PRO/LEGEND tidak bisa FLOW_PROCESS | **PASS** |
| flag admin membuka FLOW_PROCESS | **PASS** |
| `canAccess(FLOW_PROCESS, TIER.ADMIN)` (tier-string saja) | **false** — lihat catatan 1 |
| CHANGELOG: GUEST diblokir, FREE dibuka (E-1 tidak rusak) | **PASS** |

**Catatan 1 (perilaku lama, bukan WP10):** modul bertingkat ADMIN **tidak** bisa dibuka hanya dengan tier string
`'admin'`; `featureAccess.js:182` mengembalikan `false` sebelum perbandingan rank, sehingga hanya **flag** `isAdmin`
yang membuka. Ini sesuai komentar desain di `:167-176` ("admin bypass is absolute... must stay first") dan aman di App.jsx
karena `isAdmin` dihitung dari `account.isAdmin` + `isAdminEmail`. Tapi artinya kalimat "FLOW_PROCESS hanya ADMIN"
harus dibaca sebagai "hanya akun dengan flag admin".

**Palette — bukti perilaku sungguhan.** Saya menjalankan vitest di luar repo
(`%TEMP%\qa4\vitest.config.mjs` + `palette.test.jsx`, root diarahkan ke `frontend/`, DOM diisolasi dengan `cleanup()`):
**6/6 lulus** — GUEST: ARCHITECTURE **tidak tampil**; FREE: tampil; PRO: tampil; flag admin dengan tier GUEST: tampil;
dan gerbang CHANGELOG tidak rusak (GUEST sembunyi, FREE tampil). Ini membuktikan item ARCHITECTURE memakai
`canAccess(MODULES.ARCHITECTURE, userTier, isAdmin)` dan **tidak selalu tampil**.

## C. Wiring

| Klaim | Verdict | Bukti |
|---|---|---|
| App.jsx merender ArchitectureTab saat `activeTab === 'ARCHITECTURE'` | **PASS** | `App.jsx:974` cabang, `:980` `<ArchitectureTab />` |
| Tanpa gerbang `isAdmin` tersembunyi | **PASS** | `:974-981` hanya `<main>`, tidak ada `isAdmin`; komentar `:975-978` menyatakannya. Gerbang global `:771` (`canAccess(activeTab, userTier, isAdmin)`) sudah mendahului dan itulah yang memblokir GUEST |
| Ada label header | **PASS** | `App.jsx:626` `'🧭 Arsitektur Sistem'` |
| Item ARCHITECTURE ada di grup RESEARCH | **PASS** | `CmcTopNav.jsx:80`, di dalam grup `RESEARCH` |
| ARCHITECTURE TIDAK ada di ADMIN_ONLY_IDS | **PASS** | `CmcTopNav.jsx:118` = `new Set(['FLOW_PROCESS','ADMIN_APPROVAL'])` |
| Lazy import, bukan import statis | **PASS** | satu-satunya rujukan produk: `App.jsx:25` `lazy(() => import(...))`; grep seluruh repo tidak menemukan import statis. Bundel membuktikannya: `dist/assets/ArchitectureTab-o0kxG0Z2.js` **11.164 byte** sebagai chunk terpisah; `index-*.js` 393,79 kB |

## D. P1-7 — satu sumber daftar email admin

Grep `naufalarib60@gmail.com` di seluruh `frontend/src`: **4 berkas**, dan **hanya 1 berkas KODE**:

| Berkas | Jenis | Catatan |
|---|---|---|
| `services/featureAccess.js:158` | **kode (satu-satunya)** | `ADMIN_EMAILS` + `isAdminEmail` `:160-161` |
| `services/__tests__/paymentAndAdmin.test.js:17,133,184` | fixture tes | tidak dihitung |
| `components/__tests__/CmcTopNav.test.jsx:143` | fixture tes | tidak dihitung |

`App.jsx:274` dan `CmcTopNav.jsx:186` sekarang **memanggil `isAdminEmail(...)`**, tidak lagi menyimpan literal →
**PASS**: satu sumber untuk frontend. Perilaku `isAdminEmail` (13 uji): exact `true`, UPPER CASE `true`, campuran `true`,
null `false`, undefined `false`, `''` `false`, spasi saja `false`, string lain `false`, angka `false`. **Dua temuan tambahan:**
1. **Spasi tidak di-trim.** `isAdminEmail(' ' + email)` → `false`. Server punya versi yang **memang** trim:
   `frontend/functions/api/account/_shared.js:306` `String(email).trim().toLowerCase()`. Jadi daftarnya memang masih
   **dua salinan** (satu di klien, satu di server) dan keduanya tidak identik perilakunya.
2. **Koersi non-string bisa lolos.** `isAdminEmail(['naufalarib60@gmail.com'])` → **true**, dan objek dengan
   `toString()` yang mengembalikan email → **true** (`String(email || '')` menelan array/objek). Ini bertentangan dengan
   prinsip yang sudah dipegang berkas yang sama di `normalizeTier` ("Only a real string may name a tier... non-strings are
   rejected outright rather than stringified"). Dampak praktis rendah (`account.email` berasal dari server), tetapi
   ini jalur eskalasi hak akses yang sebaiknya ditutup dengan `typeof email === 'string'`.

## E. E-8 — klaim FlowProcessTab (berkas tidak saya sentuh; hash `EA270B829EA38E9F92BF9ABF926DB24F85695DE68B890C5A884E7B7EDD0F0C93`)

| Baris | Klaim | Verdict |
|---|---|---|
| `:56` | "Tes frontend (600+)" | **BENAR** — suite sekarang **616 tes** |
| `:39` | cron `hourly_crypto_macro` = `0 * * * *`, jeda nyata 4,0/4,6/7,2/6,7 jam | cron **BENAR** (terverifikasi di YAML). Angka jeda = pengukuran empiris, **tidak bisa saya verifikasi** ulang |
| `:70` | `/api/data` session-gated, 401 untuk tamu, header `X-Data-Source`/`X-Data-Age-Hours` jujur | **BENAR** — `functions/api/data.js:156,164` mengembalikan 401; header ada di `:210,238,266,267,285` |
| `:69` | harga pasar lewat TradingView `text/plain`; tembaga & gas alam tidak ada di pasar cfd | **BENAR** — cocok dengan `marketOverview.js:576` dan probe simbol saya di wave 3 |
| **`:40`** | "**Jadwal harian (22:30 UTC)**" merujuk `.github/workflows/daily_idx_eod.yml` | **SALAH.** `daily_idx_eod.yml` **tidak punya cron sama sekali** (hanya `workflow_dispatch`, komentarnya sendiri: "Cron scheduled runs disabled"). Cron `30 22 * * *` itu milik `hourly_crypto_macro.yml`. Jadi jadwalnya nyata, **berkasnya salah** |
| **`:71`** | "**/api/ea Masih placeholder-200 kecuali env MT5_EA_SOURCE di-set**" (status `blocked`) | **SALAH/basi.** `functions/api/ea.js:9` meng-import `_ea_inline.txt` (16.354 byte, 419 baris — isi EA asli, dan `engine/mt5/` memang berisi EA 15.935 byte), lalu `:21` menyajikan `env?.MT5_EA_SOURCE \|\| eaInline`. Jadi **tanpa** env var endpoint menyajikan EA asli (dan tetap session-gated); placeholder hanya muncul kalau keduanya tidak ada |
| `:42,52` | "Verifikasi run 37437433618...", "Tes engine (130+)" | **tidak bisa saya verifikasi** dari repo (butuh akses GitHub Actions / menjalankan suite engine) |

Kesimpulan E: dari 6 klaim yang bisa diperiksa, **2 salah** (satu atribusi berkas jadwal, satu status endpoint yang sudah
tidak berlaku) dan **1 benar** sebagai angka. Klaim E-8 soal jumlah tes frontend memang sudah diperbaiki dengan benar.

## F. Tes penuh + build

```
cd frontend && npx vitest run
  Test Files  44 passed (44)
       Tests  616 passed (616)
   Duration  9.68s
cd frontend && npx vite build
  ✓ built in 1.93s
```
**Tidak ada kegagalan**, jadi tidak ada pertanyaan "baru atau lama". `ArchitectureTab.test.jsx` sendirian: **13 passed**.

## G. Regresi yang TIDAK tertangkap

1. **Tidak ada tes yang membuktikan ArchitectureTab hanya untuk FREE di level App.** Gerbang global `App.jsx:771` memang
   generik dan sudah ada sebelumnya, dan saya membuktikan `canAccess` untuk ARCHITECTURE di luar repo — tetapi tidak ada
   tes di repo yang merender App dengan tier GUEST lalu memastikan "Modul Ini Khusus ..." muncul, bukan peta arsitektur.
2. **"Dibuka tanpa data" bukan risiko, dan itu terverifikasi.** `ArchitectureTab` 100% statis: grep
   `useState|useEffect|useMemo|fetch(|props|async` pada berkas itu = **0 kemunculan**. Tidak ada properti yang bisa
   dilempar, tidak ada jaringan. Jadi halaman ini tidak bisa gagal karena data kosong — sekaligus berarti ia **tidak**
   menampilkan data live apa pun (isi klaimnya statis per 11 Oktober 2026 dan akan basi kalau tidak diperbarui).
3. **Sifat tes ArchitectureTab.test.jsx: sebagian besar pencocokan teks** (3 tes render + 8 tes pola-pola terlarang pada
   sumber + 2 tes tier). Untuk halaman statis ini wajar, tetapi perlu dinyatakan terang: tes itu **tidak** menjamin
   navigasi, routing, atau gating di App; ia menjamin isi dan sanitasi berkasnya.
4. **Sanitasi diperiksa pada sumber, bukan pada HTML hasil render.** Pola checksum/URL saya juga memindai sumber, jadi
   cocok dengan cara tes WP10 bekerja. Namun tidak ada tes yang memastikan hal berbeda: bahwa tidak ada materi internal
   yang lolos lewat jalur render (mis. dari props/context di masa depan). Karena komponen ini tidak menerima props sama
   sekali, risiko itu nol **hari ini** — dan hilang otomatis begitu ada orang menambahkan props padanya.
5. **Laporan WP10 salah menghitung tesnya sendiri** (7 vs 13) — bukan regresi kode, tapi klaim dokumen yang perlu dikoreksi.

## Yang TIDAK bisa saya verifikasi
1. **Tampilan sungguhan halaman Arsitektur.** Tidak ada tes browser/login di sini; saya tidak bisa membuka Home/Arsitektur
   sebagai akun FREE. Semua verdict UI berbasis sumber + render jsdom.
2. **Klaim "DIVERIFIKASI 11 Okt di browser sungguhan"** (`FlowProcessTab:69`) — tidak bisa saya ulang; yang bisa saya
   pastikan hanya bahwa kodenya (`text/plain`, daftar simbol) memang sesuai.
3. **Angka empiris jadwal GitHub** ("nyatanya 4-7 jam") dan **verifikasi run CI tertentu** ("run 37437433618") — butuh
   akses GitHub Actions.
4. **Suite engine "130+"** — tidak dijalankan dalam audit ini (di luar cakupan frontend).
5. **Berkas `scripts/`, `.github/workflows/`, dan `ChangelogTab.jsx`** sedang dikerjakan rekan lain; saya hanya membaca
   YAML workflow. Isinya bisa sudah berubah setelah laporan ini.
6. Skrip harness saya hidup di `%TEMP%\qa4\` (di luar repo, jadi tidak ada berkas sampah di repo):
   `scan.cjs`, `tier.cjs`, `vitest.config.mjs`, `palette.test.jsx`.
