# QA/QC Independen — WP1 + WP2 + WP3 (task-15)

Root: `MBG-Trading` · Verifier: recon-docs · Waktu: 2026-10-11 01:30–02:20 WIB
Diverifikasi terhadap **working tree saat ini** (setelah revisi Lead: `isOwner` diperketat, `isUsable` pada news, tes diperbarui). Bukan snapshot awal.

---

## 0. RINGKASAN EKSEKUTIF (baca ini dulu)

- **Tes penuh: LULUS.** `39 Test Files passed (39)`, `575 Tests passed (575)`, `EXITCODE=0`, durasi 8.78s (perintah: `cd frontend && npx vitest run`).
- **Klaim audit lain ("penyerang bisa membuat token TANPA tanda tangan untuk jadi admin") = TIDAK TERBUKTI sebagai klaim.** Token tanpa tanda tangan DITOLAK 401 (`auth.js:54-55`, `_jwt.js:57-58`; uji runtime E di §C).
- **TAPI ADA TEMUAN KRITIS yang lebih serius dan NYATA:** kunci penandatanganan JWT di produksi **dapat dihitung dari konstanta publik di repo**. Saya membuktikan **live**: token yang saya tandatangani sendiri memakai kunci default publik **diterima produksi** — `GET https://mbg-trading.pages.dev/api/auth` → `200 {"authenticated":true,"tier":"LEGEND"}`, dan `/api/data` → `200`. **Setelah WP1 di-deploy, token palsu yang sama akan mengembalikan `isAdmin:true`** dan membuka seluruh modul ADMIN. Ini **pre-existing** (bukan bug baru WP1), tapi **WP1 menaikkan dampaknya dari "akses data LEGEND" menjadi "admin penuh"**. Detail + bukti di §C0.
- **Skop:** 1 file di luar scope WP (§A), 2 artefak asing belum dibersihkan (§A).

---

## A. SUSUNAN PERUBAHAN

### A1. Perbandingan diff vs write-scope task

`git diff --name-only` (13 file, belum di-commit, tidak ada yang staged) — semua file yang dimodifikasi masuk gabungan scope task-12/13/14 **KECUALI satu**:

| File | WP terkait | Status |
|---|---|---|
| `frontend/functions/api/auth.js` | WP1 (task-13) | dalam scope |
| `frontend/src/App.jsx` | WP1 (task-13) | dalam scope |
| `frontend/src/services/marketOverview.js` | WP2 (task-14) | dalam scope |
| `frontend/functions/api/news.js` | WP2 (task-14) | dalam scope |
| `frontend/src/components/NewsTab.jsx` | WP2 (task-14) | dalam scope |
| `frontend/src/components/SignalsTab.jsx` | WP3 (task-12) | dalam scope |
| `frontend/src/components/LandingPage.jsx` | WP3 (task-12) | dalam scope |
| `frontend/src/components/CmcTopNav.jsx` | WP3 (task-12) | dalam scope |
| `frontend/src/components/CommandPaletteModal.jsx` | WP3 (task-12) | dalam scope |
| `frontend/src/services/featureAccess.js` | WP3 (task-12) | dalam scope |
| `frontend/src/components/__tests__/CmcTopNav.test.jsx` | WP3 (task-12) | dalam scope |
| `frontend/src/services/__tests__/featureAccess.test.js` | WP3 (task-12) | dalam scope |
| **`frontend/src/components/OrderBookSimulator.jsx`** | **tidak ada** | **DI LUAR SCOPE** |

### A2. File di luar scope — `OrderBookSimulator.jsx` (+18 / -2)
Mengubah komentar header dan badge dari `🏛️ IDX OFFICIAL FEED` → `🏛️ SIMULASI DEPTH (SINTETIS)`, ditandai `P0-3, 2026-10-11`. Tidak tercantum di write-scope task-12/13/14, tidak disebut di pesan penugasan WP1/WP2/WP3, dan tidak ada laporan `build_wp3.md`/rencana yang saya lihat. Perubahan isinya sendiri **terlihat benar secara honesty** (mengakui depth IDX sintetis), tapi **provenance-nya tidak jelas** dan tidak punya tes. Perlu dikonfirmasi Lead: siapa yang menulis ini dan di WP mana.

### A3. Artefak asing / scope declaration gap
- **`frontend/__cors_probe.cjs`** — file untracked di dalam repo, di luar scope semua task. Ini sisa probe WP2. **Harus dihapus** (bukan bagian produk).
- **`frontend/src/services/__tests__/ownerAdminSession.test.js`** — file tes BARU untuk WP1, tapi write-scope task-13 hanya mencantumkan `auth.js` dan `App.jsx`. Tes ini disebut di pesan WP1 Lead, jadi niatnya sah; **deklarasi scope-nya yang kurang**, bukan pelanggaran.
- **`docs/audit_data_integrity_2026-10-08/06_RE_CHECK_2026-10-10.md`** — untracked, di luar scope, bukan milik WP1/2/3.
- `docs/rencana-fixing/` dan `rencana fixing.md` untracked (dokumen, wajar).

### A4. Pembacaan diff penuh
Seluruh `git diff` (277 insertions, 47 deletions, 13 file) sudah dibaca baris per baris pada revisi final. Tidak ada perubahan tersembunyi di luar yang dilaporkan.

---

## B. HASIL TES PENUH

Perintah: `cd C:\Users\ASUS\Documents\deepseek-harness\default-workspace\MBG-Trading\frontend && npx vitest run`

```
 Test Files  39 passed (39)
      Tests  575 passed (575)
   Duration  8.78s (transform 7.06s, setup 0ms, collect 15.12s, tests 12.60s, environment 39.65s, prepare 5.94s)
EXITCODE=0
```

- **Kegagalan: NIHIL.** Tidak ada test yang gagal, jadi tidak ada kebutuhan `git stash` untuk membedakan kegagalan baru vs lama. Working tree **tidak pernah di-stash**.
- Catatan: output berisi banyak `Warning: An update to LiveTickerStrip ... not wrapped in act(...)` (dari `LandingPage.jsx:92`). Itu **warning lama**, bukan kegagalan, dan tidak ditimbulkan oleh WP3 (muncul juga di alur LandingPage lama).
- Klaim "396 tes" di `FlowProcessTab.jsx:53` kini usang (sekarang 575) — kosmetik dokumen, bukan bug.
- Tes yang Lead sebut lulus (ownerAdminSession + featureAccess + CmcTopNav = 70) konsisten dengan run penuh yang lulus.

---

## C. VERIFIKASI PER KLAIM

### C0. 🔴 TEMUAN KRITIS — kunci JWT produksi dapat dihitung dari repo publik (PRE-EXISTING, diperkuat WP1)

**Ini temuan terpenting dan tidak disebut di laporan mana pun.**

**Fakta kode:**
- `auth.js:68` `const DEFAULT_PASSWORD_HASH = 'baab58…dc30'` (sha256("MBG"), konstanta publik).
- `auth.js:72-80` `deriveJwtSecret()` memakai pepper konstan publik `'MBG-APEX-JWT-PEPPER-V1'` (:75).
- `auth.js:82-86` `resolveAuthConfig(env)`: `jwtSecret = env.JWT_SECRET || deriveJwtSecret(env.PASSWORD_HASH || DEFAULT_PASSWORD_HASH)`.
- Pola identik ada di `data.js:133-150`, `scanner.js:50-94`, `_session.js:53-72`.

**Uji runtime lokal (Node, memanggil `onRequestGet` asli dari `auth.js` dengan `env={}`):**
```
DERIVED_SECRET=46e2d35f9a1c068a7edd4596a222c4c6ea8a8017918bc707dfcfb38563842d7d
A forged kind=owner (self-signed w/ public default)  => 200 {"authenticated":true,"tier":"LEGEND","isAdmin":true,...}
B account token kind=account tier=PRO (real shape)   => 200 {"authenticated":true,"tier":"FREE","isAdmin":false,...}
C account token kind=account authenticated tier=PRO  => 200 {"authenticated":true,"tier":"PRO","isAdmin":false,...}
D legacy no-kind tier=PRO authenticated=true         => 200 {"authenticated":true,"tier":"LEGEND","isAdmin":true,...}
E unsigned/garbage token                             => 401 {"error":"Unauthorized or token expired"}
F valid-sig but expiresAt past                       => 401 {"error":"Unauthorized or token expired"}
```

**Uji LIVE terhadap produksi (token yang saya tandatangani sendiri dengan kunci default publik):**
```
GET https://mbg-trading.pages.dev/api/auth  (Cookie: mbg_jwt=<forged>)  => 200 {"authenticated":true,"tier":"LEGEND"}
GET https://mbg-trading.pages.dev/api/data  (Cookie: mbg_jwt=<forged>)  => 200 {"last_updated":"2026-10-10T01:53:16...", ...}
kontrol tanpa cookie                                                      => 401
```
**Kesimpulan:** produksi saat ini berjalan TANPA `JWT_SECRET` dan TANPA `PASSWORD_HASH` (kalau salah satunya di-set, token saya akan ditolak). Artinya siapa pun yang membaca repo publik bisa menandatangani JWT yang diterima produksi. Produksi saat ini mengembalikan `tier: LEGEND` tanpa `isAdmin` (kode lama belum WP1). **Setelah WP1 deploy, token palsu yang sama akan mengembalikan `isAdmin:true`** (`auth.js:180,185`) → bypass admin absolut (`featureAccess.js:173`).

**Penilaian klaim audit lain:** kalimat *"penyerang bisa membuat token tanpa kind dan tier apa pun untuk jadi admin"* — **TIDAK TERBUKTI sebagai klaim** (token tanpa tanda tangan benar ditolak: uji E, `auth.js:54-55`). Namun **hasil akhirnya tetap tercapai** dengan jalan berbeda: tanda tangan yang sah bisa dibuat karena kuncinya publik. Jadi klaimnya salah mekanisme, tapi kesimpulannya benar-arah. **Rekomendasi segera (blast radius: seluruh platform):** set `JWT_SECRET` + `PASSWORD_HASH` di Cloudflare, dan ubah `resolveAuthConfig` agar **gagal tertutup** (tolak semua sesi) bila kedua env tidak ada — jangan pernah menurunkan kunci dari konstanta repo.

**Bukti:** `frontend/functions/api/auth.js:68, 72-80, 82-86, 141-144, 175-180, 185`; `frontend/functions/api/data.js:133-150`; `frontend/functions/api/_jwt.js:45-64`; hasil perintah di atas.

---

### C1. P0-5 / P0-6 — admin dikenali sebagai admin → **PASS (dengan catatan C0)**

- POST owner menandatangani `kind: 'owner', role: 'admin', tier: 'LEGEND'` dan merespons `{authenticated:true, tier:'LEGEND', isAdmin:true, expiresAt}` (`auth.js:256-263`).
- GET menurunkan identitas dari klaim terverifikasi: `isOwner = payload.kind === 'owner' || isLegacyOwnerToken` (`auth.js:175-180`), lalu `isAdmin: isOwner` (:185). `isLegacyOwnerToken` dicocokkan **persis** (`kind === undefined && authenticated === true && tier === 'PRO'`) — bukan truthiness.
- `App.jsx` berhenti menulis `tier: 'pro'`: sekarang `tier: body.tier || 'legend'` + `isAdmin: !!body.isAdmin` (diff `App.jsx` @@ -191,7 +191,20; lihat `ownerAdminSession.test.js:81-87`).
- **Uji keamanan inti — token akun biasa TIDAK bisa naik jadi admin: PASS.** `account/login.js:60` menandatangani `kind:'account'`; `account/signup.js:68` juga `kind:'account'`. Uji runtime B & C: `isAdmin:false` bahkan ketika token akun mengklaim `tier:'PRO'`. Predikat legacy menuntut `kind === undefined`, jadi token akun (`kind:'account'`) tak pernah cocok.
- **Catatan mutu tes:** `ownerAdminSession.test.js` adalah **tes regex atas teks sumber**, bukan tes perilaku. Ia membuktikan pola teks ada/tidak ada, bukan bahwa fungsi edge benar saat dijalankan. Bukti perilaku sebenarnya saya dapat dari probe runtime di C0. Untuk WP keamanan, ini **SEBAGIAN** dalam hal kekuatan bukti.
- **Cacat tes yang saya temukan:** `ownerAdminSession.test.js:76` `expect(authSrc).not.toMatch(/isAdmin:\s*true\s*\n\s*\}/)` adalah asersi rapuh/tautologis — fragmen itu tidak akan pernah cocok karena `isAdmin: true,` di `auth.js:256-263` diikuti koma, dan cabang GET memakai `isAdmin: isOwner`. Tes ini tidak menguji apa pun yang bermakna; ia lulus bukan karena desain.

### C2. P0-2 — CORS `fetchScannerMarket` memakai `text/plain` → **PASS (diverifikasi di BROWSER nyata)**

- Kode: `marketOverview.js:571` `headers: { 'Content-Type': 'text/plain' }` (komentar penjelas :560-570).
- **Uji Playwright** di origin produksi `https://mbg-trading.pages.dev` (Chromium 1228), POST ke `https://scanner.tradingview.com/america/scan`:
```
text/plain        => 200  len=226  {"totalCount":2,"data":[{"s":"NASDAQ:NVDA","d":["NVIDIA Corporation",229.28,...]}]}
application/json  => TypeError: Failed to fetch   (preflight diblokir)
```
- **Klaim TERBUKTI mandiri**, termasuk angka NVDA 229.28 yang sama seperti di laporan WP2. Ini bukan sekadar percaya PowerShell.

### C3. P0-1 — timeout/retry `/api/news` + NewsTab berhenti diam → **PASS**

- Retry + `isUsable`: `news.js:176` `RSS_TIMEOUT_MS = 9000`; `:177` `const isUsable = (body) => typeof body === 'string' && /<item>[\s\S]*?<\/item>/.test(body)`; `:180` loop `attempt <= 2 && !isUsable(xml)`; `:188` `if (!isUsable(xml))` → error. Body kosong / tanpa `<item>` **tidak** dianggap sukses (revisi Lead terverifikasi).
- NewsTab: `liveRssStatus` ditambahkan (`NewsTab.jsx:45`), di-set `'ok'` hanya saat ada artikel (:55) dan `'gagal'` pada HTTP non-ok (:60), artikel kosong (:65), dan exception (:69); UI menampilkan badge jujur. Ini menutup bug lama "diam saat gagal".
- **Reproduksi bug asal di produksi (kode lama belum deploy — wajar):** `GET https://mbg-trading.pages.dev/api/news` → **502 Bad Gateway setelah 4848 ms**, cocok dengan laporan insiden (timeout lama 4500 ms). Jadi bug nyata; perbaikannya belum ter-deploy.

### C4. P1-8 — tujuan tombol SignalsTab → **PASS**
- `SignalsTab.jsx:140` `onNavigateTab('SUBSCRIPTION')`. Label "Lihat Paket VIP" sekarang konsisten: halamannya benar-benar halaman langganan, bukan CHANGELOG admin-only. Bug lama (semua non-VIP dilempar ke layar kunci) tertutup.

### C5. P1-9 — badge "GRATIS" untuk modul ADMIN & kartu INTERNAL untuk tamu → **PASS**
- `LandingPage.jsx:749` `if (minTier === TIER.ADMIN) return null;` → kartu ADMIN (FLOW_PROCESS, CHANGELOG, ADMIN_APPROVAL) **tidak dirender** ke tamu.
- `LandingPage.jsx:46` `MODULE_BADGE` punya cabang eksplisit untuk GUEST/FREE/PRO/**LEGEND**/**ADMIN**, dan fallback-nya `MODULE_BADGE[TIER.ADMIN]` ("INTERNAL") — bukan lagi "GRATIS". Jalur "ADMIN → GRATIS" sudah tidak ada.
- Tidak ada lagi modul LEGEND yang salah label GRATIS (sebelumnya TRADING_BOT & JEV_EXECUTION ikut jatuh ke else).

### C6. E-1 / E-3 / E-9 — Changelog terlihat, FLOW_PROCESS tetap ADMIN, palette tidak bocor → **PASS (dengan 1 catatan)**

- **E-1**: `featureAccess.js:125` `[MODULES.CHANGELOG]: TIER.FREE` (sebelumnya ADMIN). FLOW_PROCESS tetap `TIER.ADMIN`. Tes menegaskan `canAccess(CHANGELOG, FREE)=true`, `(CHANGELOG, PRO)=true`, `(CHANGELOG, GUEST)=false`, dan `(FLOW_PROCESS, PRO)=false` (semua lulus).
- **E-3 (pintu masuk)**: `CmcTopNav.jsx:88` menambahkan entri statis `{ id: 'CHANGELOG', label: 'Changelog' }` di grup ACCOUNT; `:110` `ADMIN_ONLY_IDS = new Set(['FLOW_PROCESS','ADMIN_APPROVAL'])` (CHANGELOG dikeluarkan). Entri CHANGELOG juga dihapus dari `adminExtras` → **tidak ada menu ganda** untuk admin. Tes `CmcTopNav.test.jsx` menegaskan CHANGELOG ADA dan FLOW_PROCESS/ADMIN_APPROVAL TIDAK ADA di model statis.
- **E-9 (palette)**: `CommandPaletteModal.jsx:70` `return tabs.filter(t => t.id !== 'CHANGELOG' || isAdmin || userTier !== 'guest')`. FLOW_PROCESS tidak pernah ada di palette. Di `App.jsx:1331-1341`, `CommandPaletteModal` sekarang menerima `userTier` (`:1340`) dan `isAdmin` (`:1341`) → filter tidak default. **Tidak ada tab admin yang bisa ditawarkan ke tamu.**
- **Catatan (SEBAGIAN kecil):** entri CHANGELOG di `CmcTopNav` adalah statis dan tidak difilter `canAccess`, sedangkan `userTier` **tidak** dipakai di `CmcTopNav` (hanya `isAdmin` di :175-176). Untuk GUEST, cockpit nav normalnya tidak dirender (tamu melihat LandingPage), jadi praktiknya tidak bocor — tapi **BELUM DICEK** apakah ada jalur render nav untuk tamu. Bukan regresi yang saya temukan, hanya jaminan yang tidak lengkap.

---

## D. REGRESI & KESALAHAN LAIN YANG DITEMUKAN

| # | Temuan | Bukti | Tingkat |
|---|---|---|---|
| R1 | `OrderBookSimulator.jsx` diubah di luar scope WP mana pun (badge `IDX OFFICIAL FEED` → `SIMULASI DEPTH (SINTETIS)`, ditandai P0-3 2026-10-11) | `git diff` file ini; write-scope task-12/13/14 | Perlu konfirmasi pemilik |
| R2 | `frontend/__cors_probe.cjs` tertinggal di repo (untracked, artefak probe) | `git status --short` → `?? frontend/__cors_probe.cjs` | Hygiene, harus dihapus |
| R3 | Tes keamanan WP1 berbasis regex teks sumber, bukan perilaku; satu asersi tautologis | `ownerAdminSession.test.js:44-87`, khususnya :76 | Mutu bukti |
| R4 | `ownerAdminSession.test.js` tidak ada di write-scope task-13 | scope task-13 = `auth.js`, `App.jsx` saja | Deklarasi scope |
| R5 | `auth.js` punya salinan sendiri dari JWT `signJWT/verifyJWT/deriveJwtSecret`, padahal `_jwt.js` sudah jadi implementasi bersama | `auth.js:26-61`, `_jwt.js:36-64`; komentar `_jwt.js:1-9` sendiri menyebut dua salinan crypto = sumber lubang keamanan | Utang desain (pre-existing) |
| R6 | Klaim "396 tes" di UI tidak lagi akurat (575) | `FlowProcessTab.jsx:53` | Kosmetik |
| R7 | Produksi tidak punya `JWT_SECRET`/`PASSWORD_HASH` → kunci JWT publik | §C0 | 🔴 KRITIS |

**Yang saya cari tapi TIDAK menemukan regresi:** menu ganda (CHANGELOG dihapus dari `adminExtras`, sudah dicek), tombol mati akibat perubahan navigasi (CHANGELOG kini punya tujuan nyata; SUBSCRIPTION adalah tab valid), dan komentar yang bertentangan dengan kode pada file yang diubah WP1/2/3 (komentar di `CommandPaletteModal.jsx:60-69`, `featureAccess.js:117-124`, `LandingPage.jsx:39-45`, `marketOverview.js:560-570` semuanya cocok dengan kodenya).

---

## E. UJI BROWSER (Playwright)

- Chromium dari `C:\Users\ASUS\AppData\Local\ms-playwright\chromium-1228\chrome-win64\chrome.exe`, modul dari `...\_npx\e41f203b7505f1fb\node_modules\playwright`. **Tidak ada instalasi baru.**
- Yang diuji: CORS preflight TradingView dari origin produksi (hasil di §C2). Skrip sementara ditulis di `%TEMP%` (`cors_probe_qa.cjs`, `sec_probe.mjs`, `gen_tok.mjs`) — **tidak ada file QA yang saya tinggalkan di repo**.
- Produksi **belum memuat** perubahan WP1/WP2/WP3 (terbukti: `/api/news` masih 502 di 4848 ms; `/api/auth` masih mengembalikan bentuk lama tanpa `isAdmin`). Ini **wajar dan bukan kegagalan** WP — hanya berarti verifikasi perilaku UI (badge Changelog, palette, CTA Signals) belum bisa diuji end-to-end sampai deploy.

---

## F. STATUS AKHIR PER KLAIM

| Klaim | Status | Ringkas |
|---|---|---|
| P0-5/P0-6 admin dikenali | **PASS** | POST/GET berbasis klaim; akun biasa tak bisa naik admin (probe B/C) |
| — jaminan keamanan token palsu | **SEBAGIAN** | unsigned ditolak; tapi kunci publik → token sah bisa dipalsukan (C0) |
| P0-2 CORS text/plain | **PASS** | Playwright: text/plain 200, application/json gagal |
| P0-1 news retry + status jujur | **PASS** | `news.js:176-188`, `NewsTab.jsx:45-69` |
| P1-8 CTA Signals → SUBSCRIPTION | **PASS** | `SignalsTab.jsx:140` |
| P1-9 badge ADMIN & kartu INTERNAL | **PASS** | `LandingPage.jsx:46,749` |
| E-1 CHANGELOG FREE / FLOW_PROCESS ADMIN | **PASS** | `featureAccess.js:125` |
| E-3 pintu masuk Changelog | **PASS** | `CmcTopNav.jsx:88,110` |
| E-9 palette tidak bocorkan tab admin | **PASS** | `CommandPaletteModal.jsx:70` + `App.jsx:1340-1341` |
| Tes penuh hijau | **PASS** | 39 file / 575 tes / exit 0 |

---

## G. YANG TIDAK BISA SAYA VERIFIKASI

1. **Perilaku UI WP3 di produksi** (Changelog muncul untuk user FREE, badge tidak lagi GRATIS, palette) — **TIDAK BISA DIVERIFIKASI**: produksi belum memuat perubahan dan saya tidak punya akun FREE untuk login. Diverifikasi lewat kode + tes unit saja.
2. **Apakah ada jalur render `CmcTopNav` untuk tamu** (yang bisa menampilkan CHANGELOG ke guest) — BELUM DICEK, alasan: butuh menjalankan shell aplikasi dengan state guest, di luar time-box.
3. **Riwayat token akun lama**: apakah pernah ada versi `account/login.js` yang menandatangani `tier:'PRO'` **tanpa** `kind`, yang akan cocok dengan `isLegacyOwnerToken` — BELUM DICEK, alasan: perlu menelusuri git history `login.js`.
4. **Apakah `env.JWT_SECRET`/`PASSWORD_HASH` di-set di Cloudflare** — saya tidak punya akses dashboard; **tetapi secara tidak langsung terbukti TIDAK di-set** karena token dengan kunci default publik diterima produksi (§C0). Ini bukti perilaku, bukan konfirmasi konfigurasi.
5. **Runtime fungsi edge hasil WP1 dengan env yang benar-benar terkonfigurasi** — BELUM DICEK: butuh `wrangler pages dev` + secret, di luar time-box. Yang saya jalankan adalah `onRequestGet` asli dengan `env={}`.
6. **Mutu `OrderBookSimulator.jsx` (P0-3)** — hanya diff-nya dibaca; klaim "crypto side L2 nyata" tidak saya uji.
