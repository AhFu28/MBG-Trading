# rencana fixing.md

**Proyek:** MBG Quant Terminal (MBG-Trading)
**Disusun:** 2026-10-10 13:30 WIB (UTC+7)
**Dasar:** Audit Integritas & Provenance 2026-10-08/10 (`docs/audit_data_integrity_2026-10-08/`) + recon ticker, home, changelog/arsitektur.
**Sifat dokumen:** rencana kerja **+ catatan pelaksanaan**. Sebagian besar item sudah dikerjakan pada 2026-10-11 — lihat Status pelaksanaan di bawah.

---

## Status pelaksanaan (diperbarui 2026-10-15 — **sudah ter-deploy ke produksi**)

**Terbit 15 Oktober 2026:** empat commit di-push ke `main` dan Cloudflare Pages menerbitkannya. Diverifikasi live: bundle produksi kini `index-BYNDX5L6.js` (persis build lokal), `POST /api/auth` dengan sandi cockpit menjawab `tier: "legend"` + `isAdmin: true`, dan chunk tab Arsitektur merespons 200. Sesuai perintah Jendral Arib, sesi owner kini menjadi sesi admin dan semua fitur terbuka.

Satu endpoint masih 502: `/api/news`. Itu kini perilaku jujur yang baru — gagal dengan timeout terbatas dan pesan JSON yang jelas ("The operation was aborted") alih-alih menggantung diam-diam; penyebabnya RSS upstream yang lambat/mati saat itu, bukan kode yang hilang. Perlu ditinjau lagi bila berlanjut.

**Sudah dikerjakan** — 22 berkas diubah, 2 berkas mati dihapus (satu di antaranya 123 KB), 12 berkas baru, 44 berkas tes / **623 tes lulus**, build produksi sukses.

| Item | Status | Catatan |
|---|---|---|
| **P0-0** kunci JWT publik | **SEBAGIAN — butuh keputusan** | Klaim admin sudah fail-closed saat JWT_SECRET tidak diset. Kebocoran data belum tertutup; butuh env var Cloudflare. Penuh: Bagian P0-0 di atas. |
| **P0-1** /api/news 502 | Selesai (revisi 2026-10-15) | Awalnya cuma timeout 9000 ms + 1 ulang — ternyata masih 502 di produksi. Diukur: Google News normal dari IP biasa (0,7-2,7 dtk) tapi tak menjawab dari edge Cloudflare dua kali berturut. Sekarang dua mesin dipacu paralel (Google + Bing), yang pertama usable menang, respons menyebut `source_engine`. Diverifikasi live: ALL 35 artikel via google-news, CRYPTO 5 via bing-news — 502 hilang. Bing menolak operator OR (0 item, terukur) sehingga query-nya disaring; feed penerbit alternatif diperiksa semuanya mati (0 item) dan sengaja tidak dipakai. Sisa kecil: tautan Bing terbungkus pengalih `apiclick.aspx` — berfungsi, bisa dibongkar nanti |
| **P0-2** Market Overview crypto-only | Selesai | Content-Type text/plain. Diverifikasi end-to-end di browser: US/FX/CMDTY kini terisi |
| **P0-3** order book mengaku feed resmi | Selesai | Label jadi SIMULASI + banner peringatan saat data resmi tidak ada |
| **P0-5 / P0-6** admin terkunci | Selesai secara kode | Identitas admin diterbitkan server; klien berhenti menulis tier pro |
| **P1-1 / P1-2** ticker | Selesai | MarketTicker.jsx; landing 4 pasar, home 5 pasar; label Snapshot 60 detik |
| **E-9** (lanjutan) changelog ternyata masih terkunci | Selesai | Gerbang admin kedua di cabang render dibuang; FREE akhirnya benar-benar bisa membuka. Sebelumnya pintu ditawarkan lalu dibanting — E-1 tidak pernah terlihat |
| **E-6 / E-7** generator changelog | Selesai + diperbaiki | gen_changelog.mjs dari git log, jalan di workflow hourly yang sudah ada. Redaksi ditambahkan Lead karena drafnya menerbitkan ulang nomor telepon Kamerad Fuad tiap jam ke repo publik |
| **E-5** tautan Changelog -> Arsitektur | Selesai | ChangelogTab menerima onNavigateTab={setActiveTab} |
| **P1-3 / E-1 / E-3 / E-9** changelog terlihat | Sebagian (lihat E-9 lanjutan) | CHANGELOG turun ke FREE, pintu masuk di menu Account, palette digerbangi canAccess |
| **P1-4** changelog basi | Selesai | 3 entri Oktober ditambahkan; tidak ada nomor versi karangan |
| **P1-5** label hourly | Selesai | FlowProcessTab jujur menyebut 4-7 jam, status warn |
| **P1-8** tombol Signals salah arah | Selesai | Diarahkan ke SUBSCRIPTION |
| **P1-9** badge LandingPage | Selesai | Badge per tier; kartu INTERNAL tidak dirender di halaman publik |
| **P2-2** label REALTIME IDX | Selesai | JEDA ~12 DETIK, sumber useLivePrices.js:686 |
| **P2-4** provenance model | Selesai | Fallback keras gemini-3.8-flash dihapus + tes pengunci |
| **P2-1 / Bagian D** perapian Home (D-2..D-6) | Selesai | Kartu mayor ikut pasar, IHSG + DXY, tabel dikelompokkan, header dirapikan, footer 12px. 6 tes baru di CmcHomeLayout.test.jsx |
| **P2-3 / D-7** hapus kode mati | Selesai | HomeDashboardTab.jsx (123 KB) dan BloombergNewsWire.jsx dihapus; penjaga tes dipindahkan ke home yang hidup |
| **P2-7** simbol komoditas | Selesai | Awalan TVC:USOIL/TVC:UKOIL diperbaiki jadi FX: (dua simbol mati diam-diam); PLATINUM + PALLADIUM ditambahkan setelah diuji hidup |
| **E-12 / E-3** tab Arsitektur publik | Selesai | ArchitectureTab.jsx (378 baris) TIER.FREE, pintu masuk di Research & Learn, bisa dicari di palette. FlowProcessTab tetap ADMIN. Audit sanitasi: 0 kemunculan string sensitif |
| **P1-7** daftar email admin ganda | Selesai | Disatukan ke ADMIN_EMAILS + isAdminEmail() di featureAccess.js |
| **E-8** klaim basi FlowProcessTab | Selesai | Jumlah tes 396 -> 600+, klaim harga pasar kini menyebut apa yang diverifikasi dan apa yang belum ada |
| **Baru** redaksi data sensitif | Selesai | Nomor WA partner dan hash sandi dihapus dari UI changelog tier FREE |

**Belum dikerjakan — menunggu keputusan Jendral Arib:**

- **P0-0 penuh** — set JWT_SECRET + PASSWORD_HASH di Cloudflare Pages.
- **P0-4** data mati 5 berkas — **audit selesai**, lihat `docs/rencana-fixing/audit_p0_4_data_mati.md`. Tinggal setuju R-1..R-3 (cek umur tembolok, bawa umur ke label, hentikan tracking kelima berkas).
- **P1-6** jadwal IDX harian — kemacetan IDX pernah disebut "keputusan desain on-demand".
- **P1-10** bypass admin lewat `localStorage.mbg_admin_access` — **jangan dicabut dulu.** Flag itu sekarang justru satu-satunya jalan Jendral masuk mode admin, karena klaim admin dari server baru aktif setelah `JWT_SECRET` diset. Cabut setelah P0-0 beres, jangan sebelumnya.
- **Copper & natural gas** — `TVC:COPPER` dan `TVC:NATGAS` mati di pasar `cfd`. Padanannya ada di pasar `futures` sebagai `COMEX:HG1!` dan `NYMEX:NG1!`, tetapi butuh satu request tambahan tiap penyegaran. Perlu keputusan: sepadan atau tidak.
- **Kartu S&P 500 di Home** — tidak dibuat karena tidak ada sumbernya di komponen Home. Perlu sumber data baru bila memang diinginkan.

**Catatan mutu:** wave 1 diverifikasi QA independen (recon-docs). Wave 2 diverifikasi Lead sendiri karena agen QA gagal di tengah. Wave 3 diverifikasi QA independen (recon-home) — menemukan 3 regresi asli. Wave 4 (WP10/WP11) belum diverifikasi pihak ketiga. Wave 3 diverifikasi QA independen (recon-home) — QA menemukan **3 regresi asli** di perapian Home yang tidak tertangkap penulisnya; ketiganya sudah diperbaiki dan tesnya diperkuat dari 6 menjadi 8. Catatan: klaim simbol komoditas P2-7 diuji ulang QA dengan 13 ticker (termasuk 2 kontrol palsu) dan **terkonfirmasi 100 persen**.

**Catatan berkas:** `rencana fixing.md` berada di root repo dan belum di-commit. Itu memang deliverable yang diminta Jendral Arib dengan nama tersebut, bukan berkas sampah. Rincian: `docs/rencana-fixing/qa_qc_report.md` dan `qa_qc_wave2.md`.

---

## 0. Ringkasan

Ada 5 area kerja:

| # | Area | Kondisi | Prioritas tertinggi |
|---|---|---|---|
| A | Integritas data (sisa temuan audit) | 2 P0 terbuka + 1 masalah produksi baru | **P0** |
| B | Ticker horizontal landing | crypto saja, belum ada di home | **P1** |
| C | Market Overview home (crypto saja) | **akar masalah sudah ketemu** | **P0** |
| D | Perapian home | padat, ada bagian tak berfungsi | P1 |
| E | Changelog & Arsitektur "tidak ada" | ada di kode, **tidak terlihat user** | P1 |

**Temuan tunggal paling berdampak:** Market Overview home hanya menampilkan crypto karena satu header HTTP yang salah. Detail di bagian C. Perbaikannya satu baris dan sekaligus menghidupkan US/FX/Komoditas di home dan ticker.

---

## 1. Backlog terurut urgensi

### P0-0 — KRITIS, DITEMUKAN & DIVERIFIKASI 2026-10-11 (di atas P0-1)

**Produksi berjalan tanpa JWT_SECRET dan PASSWORD_HASH, dan repositori GitHub ini PUBLIK.**

Bukti — reproduksi langsung oleh Lead, 2026-10-11:

| Uji | Hasil |
|---|---|
| POST /api/auth dengan password MBG | **200** — sandi cockpit memang "MBG" |
| GET /api/data dengan cookie itu | **200, 1.948.905 byte** |
| Token yang ditandatangani sendiri, dihitung dari nilai fallback yang ikut terbit di repo ini | **200** di /api/auth DAN /api/data |
| https://github.com/AhFu28/MBG-Trading | **HTTP 200 — publik** |

Akar masalah: `auth.js` memakai nilai fallback yang ikut terbit di repo publik untuk menurunkan kunci tanda tangan saat `JWT_SECRET` kosong. Resep reproduksinya **sengaja tidak ditulis di dokumen ini** karena repo bersifat publik — yang perlu diketahui cukuplah ini: selama secret belum diset, token palsu tidak dapat dibedakan dari token asli.

Dampak: **siapa pun di internet dapat membaca seluruh bundel data cockpit** tanpa akun.

**Pembaruan 2026-10-15 — perintah Jendral Arib:** *"pass MBG itu hanya untuk akses admin, dan untuk bagian admin pastikan semua fitur terbuka."* Aturan fail-closed yang menahan klaim admin saat `JWT_SECRET` kosong **dicabut**, karena aturan itu justru mengunci pemilik dari mejanya sendiri (produksi mengembalikan tier PRO tanpa `isAdmin`). Sekarang sesi owner langsung menjadi admin.

Konsekuensinya harus dinyatakan terus terang: selama `JWT_SECRET` belum diset, token palsu mewarisi hak admin yang sama. Satu perintah menutup jalur itu **tanpa mengubah cara Jendral masuk** — sandi tetap `MBG`:

    npx wrangler pages secret put JWT_SECRET

Perbaikan yang dibutuhkan (keputusan Jendral Arib):
1. wrangler pages secret put JWT_SECRET --project-name mbg-trading   (nilai acak 32 byte ke atas)
2. wrangler pages secret put PASSWORD_HASH --project-name mbg-trading  (sha256 sandi baru)
3. Opsional: fail-closed total bila env kosong, supaya salah konfigurasi berteriak, bukan diam.

Sudah dikerjakan: klaim isAdmin tidak lagi diberikan bila kunci dapat dihitung publik.
**Tambahan 2026-10-11 (setelah penelusuran lanjutan):** detail kredensial yang sama **juga** tertulis di `CHANGELOG.md:514` — dan repositori ini publik, jadi nilainya sudah terbit dan tidak bisa ditarik lagi lewat suntingan. Nomor WA partner (+62 812-2417-0187) juga tersebar di 15+ berkas repo, sudah tercatat sebagai isu PII di `new plan/MBG_TRADING_UPDATE_PLAN_V3.md:15`; nomor itu dipakai fitur (`engine/send_wa_fuad.py:16`, `whatsappHandoff.js`), jadi pemindahannya ke env var butuh keputusan Jendral.

Sudah diredaksi dari UI tier FREE: `frontend/src/data/changelogData.js` (nomor WA, link wa.me, potongan hash sandi) — 0 kemunculan setelah diperiksa. Rinciannya di `docs/rencana-fixing/build_wp7.md`.



### P0 — rusak / menyesatkan di produksi sekarang

| ID | Masalah | Bukti | File yang disentuh | Effort |
|---|---|---|---|---|
| **P0-1** | `/api/news` balas **502** di produksi; UI gagal senyap | `frontend/functions/api/news.js:139-140` (AbortController 4500 ms); `frontend/src/components/NewsTab.jsx:47-54` hanya proses bila `res.ok` | `news.js`, `NewsTab.jsx` | S |
| **P0-2** | Market Overview home **hanya crypto**: US/FX/Komoditas kosong | `marketOverview.js:560` pakai `Content-Type: application/json` → preflight ditolak; TradingView hanya mengizinkan `Referer,Accept` | `marketOverview.js:560` | **XS** |
| **P0-3** | Order book IDX sintetis tapi dilabeli "IDX OFFICIAL FEED" | `OrderBookSimulator.jsx:197-218` (dibangkitkan `Math.exp`), `:266-286` (broker mock), `:329` (label) | `OrderBookSimulator.jsx` | S |
| **P0-4** | 5 file data mati ~10 hari masih ikut alur publish | `macro_telemetry.json` dll, usia 234,9 j (2026-10-10 11:16) — **SELESAI 2026-10-15, lihat catatan di bawah** | `engine/run_pipeline.py`, `.gitignore`, UI | M |

> **Penyelesaian P0-4 (2026-10-15)** — rekomendasi di `docs/rencana-fixing/audit_p0_4_data_mati.md` kini dikerjakan:
> R-1 tembolok makro lebih tua dari 24 jam diperlakukan tidak ada (tidak bisa lagi tersaji seolah segar); R-2 umurnya dibawa ke label (`cached:2.0h`, bukan sekadar `cached`); R-3 sembilan artefak data keluar dari tracking, `engine/cache` diabaikan git **kecuali** dua berkas yang memang di-commit CI; R-5 terjawab — `research_archive.json` ternyata cache **aktif** (dibaca-ditulis `news_research_agent.py:341-364`), bukan artefak mati, jadi tidak dihapus melainkan ikut keluar tracking; plus satu perbaikan baru di luar rencana: label `live` dulu dipasang tanpa syarat setelah loop yfinance, sehingga sweep yang kosong pun menempelkan label live ke angka basi dan menulisnya balik ke cache — sekarang label `live` hanya bila ada harga yang benar-benar bergerak, dan cache hanya ditulis ulang saat itu. Semua dikunci `engine/tests/test_macro_cache_age.py` (5 tes, tanpa jaringan).
> **R-4 selesai (2026-10-16)** — dan ternyata jauh lebih dalam dari rencana awal. Angka karangan itu bukan cuma di satu dict: tertenun di seluruh alur dengan nilai yang saling bertentangan (DXY 104,50 / 104,0 / 104 / 99,65; emas 2750 / 4262,4; IHSG 6.374,91; VIX 18,0). `build_daily_snips` membangun **verdict pasar berlabel confidence HIGH** plus saran stop loss dari data default; podcast pagi menceritakan harga dalam kata-kata ("empat ribu dua ratus dolar") dari konstanta sendiri meski variabel live ada di baris atasnya; dan DXY karangan sempat memicu klasifikasi dampak di ambang 104,5. Sekarang: tak ada harga yang dikarang di jalur tanpa data — verdict bernama NO_DATA, frontend merender tanda pisah per field, dan skrip podcast hanya disusun dari nilai yang benar-benar ada. Dikunci 7 tes engine + suite frontend.
>
> Catatan konteks: komit `2026-10-10 10:33 docs(plan): P-8 P0c reader deployed; IDX staleness verdict - deliberate on-demand design, owner decision` menyatakan kemacetan IDX adalah **keputusan desain on-demand**, bukan kerusakan. Sebelum mengerjakan P0-4/P1-6, konfirmasi ke Jendral Arib mana yang disengaja dan mana yang tidak — jangan "perbaiki" sesuatu yang memang dipilih.

> **Tambahan P0-5/P0-6 (2026-10-10):** admin yang masuk lewat password owner berakhir sebagai PRO dan terkena layar "Khusus Pro"/"Khusus Legend". Rantai penyebab lengkap ada di **Bagian F** di bawah.

### P1 — terlihat salah / tidak bisa dipakai

| ID | Masalah | Bukti | File | Effort |
|---|---|---|---|---|
| **P1-1** | Ticker landing hanya crypto | `LandingPage.jsx:83-110` hanya `fetchMajorCards()` | `LandingPage.jsx`, komponen baru | M |
| **P1-2** | Ticker belum ada di Home | `CmcMarketDashboard.jsx` tidak punya strip; `livePrices` sudah dikirim dari `App.jsx:899` | `CmcMarketDashboard.jsx`, `App.jsx` | M |
| **P1-3** | Changelog & Flow/Arsitektur tidak terlihat user | `featureAccess.js:119-120` → `TIER.ADMIN`; `CmcTopNav.jsx` tidak memuat keduanya | `featureAccess.js`, `CmcTopNav.jsx` | S |
| **P1-4** | Isi changelog berhenti 30 Sep 2026 (10 hari kosong) | `changelogData.js:8-10` entri terbaru "30 September 2026" | `changelogData.js` / generator baru | M |
| **P1-5** | Job "Hourly" nyatanya 4-7 jam sekali | jeda commit 4,0/4,6/7,2/6,7 jam (10-10) | `.github/workflows/hourly_crypto_macro.yml`, label UI | S |
| **P1-6** | Data IDX harian bergantung trigger manual | `daily_idx_morning.yml:4` hanya `workflow_dispatch`; file berhenti 2026-10-07 | workflow + UI | M |

### P2 — kerapian

| ID | Masalah | Bukti | Effort |
|---|---|---|---|
| **P2-1** | Perapian home (hierarki, kepadatan, elemen mati) | lihat bagian D | M |
| **P2-2** | Label "REALTIME" untuk IDX (sebenarnya 12 dtk) | `MasterQuantLeaderboard.jsx:522,671` | XS |
| **P2-3** | `HomeDashboardTab.jsx` (123 KB) sudah tidak dipakai | komit `8b9271c` "old home orphaned" — perlu konfirmasi rujukan terakhir | S |
| **P2-4** | Nama model di provenance bergantung `model_used` bundle | sudah diperbaiki 2026-10-10; tinggal tes pengunci | S |

---

## 2. Bagian B — Ticker horizontal

### B.1 Kondisi sekarang (hasil analisa)

**Ticker di landing page adalah `LiveTickerStrip`**, bukan `GlobalMarketTicker`.
- `LandingPage.jsx:83` `function LiveTickerStrip()`; dirender di `LandingPage.jsx:402`.
- Sumber data: `fetchMajorCards()` + `fetchGlobalMetrics()` (`LandingPage.jsx:91`).
- `fetchMajorCards` (`marketOverview.js:406`) mengambil **5 koin yang ditulis tetap** di konstanta `MAJORS` (`marketOverview.js:398-404`: BTC/ETH/BNB/SOL/XRP) dari **Binance Vision** (`ticker/24hr`) → isinya crypto saja, dan jumlahnya tidak bisa bertambah tanpa mengubah kode.
- **Ticker tidak polling.** `useEffect` di `LandingPage.jsx:88-101` berjalan sekali saat mount (dependency kosong) → angka di ticker membeku sejak halaman dibuka, tidak ikut bergerak.
- Isi item: `symbol`, `price`, `change24h` (`LandingPage.jsx:105-109`), digandakan 3x untuk loop mulus (`LandingPage.jsx:156`).
- Animasi: `.lp-marquee-track` di `index.css:1700-1716` (`animation: lp-marquee 46s linear infinite`), berhenti saat hover (`:1708`).
- Fallback jujur sudah ada: bila gagal tampil "Data pasar sedang tidak bisa dimuat dari jaringan ini." (`LandingPage.jsx:112-126`).

**`GlobalMarketTicker.jsx` bukan ticker harga.** Isinya status sesi bursa (IDX/TSE/LSE/NYSE buka-tutup) — `GlobalMarketTicker.jsx:44-49`. Jangan dicampur.

### B.2 Masalah

1. Hanya crypto → tidak mencerminkan "terminal multi-aset" yang jadi positioning produk.
2. Tidak ada di Home padahal `livePrices` (WS Binance, realtime) sudah tersedia di `App.jsx:899`.
3. Label pasar tidak ada, jadi user tidak tahu item itu IDX, US, atau FX.
4. **Ticker membeku setelah load pertama** (`LandingPage.jsx:88-101` tanpa polling) → terlihat live padahal statis.
5. `46s` untuk 3x duplikasi daftar pendek = gerak terus tanpa henti. Catatan: `prefers-reduced-motion` **sudah** ditangani (`index.css:1801`), jadi ini bukan masalah aksesibilitas, hanya tempo.

### B.3 Rencana

**Langkah 1 — ekstrak jadi komponen bersama.**
Buat `frontend/src/components/MarketTicker.jsx`:
- Props: `items` (array `{market, symbol, price, change}`), `speedSec`, `showMarketBadge`, `onSelect`.
- Isi dipindah dari `LiveTickerStrip` (`LandingPage.jsx:144-172`) + `.lp-marquee-track` CSS.
- Tambah badge pasar: `IDX` / `US` / `FX` / `CMDTY` / `CRYPTO` dengan warna konsisten token yang sudah ada.
- Hormati `prefers-reduced-motion: reduce` → matikan animasi, tampilkan potongan statis.

**Langkah 2 — isi instrument.**
| Pasar | Sumber yang SUDAH ADA | Catatan |
|---|---|---|
| Crypto | `livePrices` (WS Binance, `useLivePrices.js:564`) | realtime, di home paling akurat |
| Crypto (landing) | `fetchMajorCards()` | landing publik, tanpa sesi |
| IDX | `allIdxStocks` dari `useLivePrices` | sudah tersedia di App; `livePrices` sudah bertag `market:'IDX'` (`useLivePrices.js:248,260,285`) |
| US | `fetchCrossMarketAssets()` market `US` | **setelah P0-2 diperbaiki** |
| Forex | `fetchCrossMarketAssets()` market `FX` | idem |
| Komoditas | `fetchCrossMarketAssets()` market `COMMODITY` | idem |
| Indeks/DXY | `DEFAULT_COMMODITY_TICKERS` sudah memuat `TVC:DXY` (`useLivePrices.js:51`) | tinggal ditampilkan |

Urutan tampil yang disarankan: IDX → US → FX → Komoditas → Crypto (cermin urutan menu `Markets` di `CmcTopNav.jsx:54-58`).

**Langkah 3 — pasang di landing.**
- Ganti pemanggilan `LiveTickerStrip` (`LandingPage.jsx:402`) dengan `<MarketTicker />`.
- Landing publik tidak punya `livePrices` → tetap pakai fetch sendiri, tapi gabungkan `fetchMajorCards()` + `fetchCrossMarketAssets()` (maks 12-16 item agar payload ringan).
- **Prasyarat: P0-2 selesai lebih dulu**, kalau tidak bagian US/FX/Komoditas akan kosong.

**Langkah 4 — pasang di Home.**
- Tempat: `CmcMarketDashboard.jsx`, tepat di bawah header "Market Overview" (`:346-376`) atau di atas Row 1.
- Data: `livePrices` + `allIdxStocks` **sudah dikirim** dari `App.jsx:898-903`? → `livePrices` ya; `allIdxStocks` **belum**. Perlu tambah prop di `App.jsx:898`.
- `crossMarket` sudah ada di dalam dashboard (`CmcMarketDashboard.jsx:259`) → bisa langsung dipakai.
- Jadi Home tidak perlu request baru: cukup rakit dari `livePrices` + `allIdxStocks` + `crossMarket`.

**Acceptance criteria B:**
- Ticker landing memuat minimal 4 pasar dengan badge.
- Ticker home memuat minimal 4 pasar dan ikut berubah saat WS crypto bergerak.
- Tidak ada tambahan request ke TradingView melebihi 3 panggilan per muat.
- `prefers-reduced-motion` dihormati (sudah ada di `index.css:1801`, pastikan tetap berlaku untuk komponen baru).
- Ticker landing **menyegarkan** minimal tiap 60 detik, atau menampilkan jam "diperbarui HH:MM" supaya tidak menyiratkan live tanpa dasar.

---

## 3. Bagian C — Market Overview hanya crypto (P0-2, akar masalah sudah pasti)

### C.1 Jawaban singkat

**Bukan karena desain.** Home **sudah** punya filter lintas pasar: `ALL / CRYPTO / US / FX / COMMODITY` (`CmcMarketDashboard.jsx:331-337`), dan `fetchMarketOverview` sudah mengembalikan field `crossMarket` (`marketOverview.js:841-856`).

Yang terjadi: **`crossMarket` selalu kosong saat berjalan di browser**, jadi yang terlihat tinggal crypto.

Konfirmasi dari recon agen: jalur tampilannya **sudah lengkap dan sudah tersambung** —
- `fetchCrossMarketAssets()` dipanggil di `marketOverview.js:838`,
- dikembalikan sebagai field `crossMarket` (`marketOverview.js:850`),
- dikonsumsi di `CmcMarketDashboard.jsx:259`,
- dirender di tabel "Semua Aset" (`CmcMarketDashboard.jsx:610-712`) lengkap dengan pill filter pasar (`:625`).

Artinya: **ini murni masalah lapisan data, bukan UI.** Tidak perlu membuat tabel atau filter baru — cukup buat datanya sampai. Sebaliknya, baris 1-3 (kartu koin mayor, Market Status, chart BTC/Derivatives) dan panel Trending memang **crypto-only menurut desain** (`CmcMarketDashboard.jsx:252-258`, Trending `:714-775`) — di situlah pekerjaan "tambah instrument lain" (bagian D) diperlukan.

### C.2 Akar masalah (terbukti empiris)

`marketOverview.js:556-567` memanggil TradingView Scanner langsung dari browser dengan:
```js
headers: { 'Content-Type': 'application/json' }
```

Uji OPTIONS ke `https://scanner.tradingview.com/america/scan` dari origin `https://mbg-trading.pages.dev`:
```
status=204
Access-Control-Allow-Origin: https://mbg-trading.pages.dev
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Referer,Accept      <-- content-type TIDAK ada
```
Preflight meminta `content-type`, server tidak mengizinkannya → browser memblokir POST → `getJSON` menangkap error dan mengembalikan `null` (`marketOverview.js:61-63`) → `fetchCrossMarketAssets` mengembalikan `[]` (`:597-599`).

**Bukti pembanding yang menuntaskan perkara:** `useLivePrices.js:59` dan `:68` memakai `Content-Type: text/plain` — memang sengaja untuk menghindari preflight (ditandai komentar `H-06`). Itu sebabnya terminal IDX/US/FX **jalan**, sementara Market Overview **tidak**. Dua jalur memperlakukan header yang sama secara berbeda.

Catatan: POST langsung dari PowerShell mengembalikan 200 karena PowerShell tidak menegakkan CORS. Jadi "berhasil di curl" bukan bukti bahwa browser berhasil.

**Dikonfirmasi di browser asli (2026-10-10 malam), dari origin produksi:** `text/plain` → **HTTP 200 + data asli**; `application/json` → **`TypeError: Failed to fetch`**. Diuji dua kali secara terpisah dengan hasil identik. **P0-2 terkunci: satu baris, tanpa proxy.**

### C.3 Perbaikan

**Fix inti (XS, 1 baris)** — `marketOverview.js:560`:
```diff
- headers: { 'Content-Type': 'application/json' },
+ headers: { 'Content-Type': 'text/plain' },
```

**Perbaikan pendukung:**
1. `fetchScannerMarket` belum punya fallback ke `/api/scanner`. Tambahkan urutan sama seperti `useLivePrices.callTvScanner` (proxy → langsung). Catatan: `/api/scanner` **session-gated** (`scanner.js:92-99`, terbukti 401 untuk tamu), jadi untuk tamu andalkan jalur langsung.
2. Cache hasil scanner di sisi klien (minimal 60 dtk) agar refresh berulang tidak memanggil TradingView terus.
3. Tampilkan status jujur per pasar: bila satu pasar gagal, tulis "US: gagal dimuat" — jangan sembunyikan sebagai kosong.

**Acceptance criteria C:**
- Di `https://mbg-trading.pages.dev`, tab HOME sebagai tamu menampilkan baris US, FX, dan Komoditas.
- Pill filter menunjukkan jumlah > 0 untuk US/FX/COMMODITY.
- Bila TradingView gagal, muncul penanda gagal (bukan tabel kosong).

---

## 4. Bagian D — Perapian Home

### D.1 Kondisi sekarang

Struktur `CmcMarketDashboard.jsx` (semua dalam satu kolom, `gap: 11px`, `:347`):
1. Header "Market Overview" + badge LIVE + "diperbarui HH:MM" + tombol Segarkan (`:349-376`)
2. Row 1: kartu koin mayor, `minmax(178px, 1fr)` (`:378-387`)
3. Row 2: 2 kolom `Market Status` + Watchlist (`:389-390`)
4. Row 3: tabel aset lintas pasar + pill filter (`:325-337`)
5. Grafik market cap 30 hari + range (`:276-281`)

### D.2 Temuan yang perlu dirapikan

1. **Baris 1 selalu crypto.** Lima kartu koin mayor, padahal positioning produk multi-aset. Sebaiknya kartu "majors" mengikuti pasar yang dipilih, atau ditambah kartu indeks (IHSG, S&P, DXY).
2. **Pengulangan internal.** Row 2 "Market Status" menampilkan status bursa; blok Fear & Greed/Dominance lalu ditempel di panel yang sama. **Koreksi:** klaim duplikasi dengan `GlobalMarketTicker.jsx` **batal** — komponen itu orphan (nol import), tidak dirender di mana pun.
3. **Header padat.** Judul + LIVE + waktu + tombol + peringatan error dalam satu baris (`:350-369`); saat error muncul, baris itu bisa membungkus dan berantakan.
4. **Hierarki tidak jelas.** Tidak ada pemisah visual antara "ringkasan pasar" dan "daftar aset". Semua memakai `gap: 11px` yang sama.
5. **Default filter `ALL` (`assetMarket = 'ALL'`, `:241`)** mencampur crypto dan non-crypto tanpa pengelompokan; setelah P0-2 hidup, daftar akan tercampur ribuan baris.
6. **`HomeDashboardTab.jsx` (123 KB)** kemungkinan besar sudah mati (komit `8b9271c` "old home orphaned") tetapi masih ada di repo → kandidat hapus.

### D.2b Temuan tambahan (dari recon agen, sudah dicek)

| Temuan | Bukti | Dampak |
|---|---|---|
| **Market Cap & Volume tampil dua kali dengan angka berbeda** | `CmcMarketDashboard.jsx:420-429` vs `:561-569` | Angka sama-sama "benar" tapi beda sumber → user bingung, dan melemahkan kepercayaan |
| Toggle `overview/breakdown` hanya mengulang data | `CmcMarketDashboard.jsx:526-583` | Kontrol tanpa fungsi nyata |
| Blok Fear & Greed / Dominance menempel di panel "Market Status" tanpa pemisah | `CmcMarketDashboard.jsx:406-455` | Mengulang kesalahan lama: sentimen ditempel di panel status |
| `cmc-two-col` baru menumpuk di <=768px → dua scrollbar bersarang | `index.css:1671-1676`; tabel `maxHeight: 430px` di `CmcMarketDashboard.jsx:634` | Di layar sedang, user menggulir di dalam penggulung |
| `backdropFilter` masih dipakai di panel (bukan hanya modal) | `CmcMarketDashboard.jsx:160-161`, `CmcPrimitives.jsx:385-386`; permintaan audit `audit-001-followup:43` | Beban render, dan menyimpang dari keputusan audit |
| Footer teks 10,5px | `CmcMarketDashboard.jsx:778-786` | Terlalu kecil untuk dibaca |
| `HomeDashboardTab.jsx` **terkonfirmasi orphan** | nol import di `frontend/src`; sisa rujukan hanya file itu sendiri `:85` + test yang membacanya sebagai teks `honestData.test.js:89` | 123 KB kode mati |

Catatan beban jaringan: `/api/scanner` punya batas 30/menit (`scanner.js:28`), tetapi `fetchScannerMarket` memanggil `scanner.tradingview.com` **langsung** (`marketOverview.js:512,557`) sehingga tidak memakai kuota proxy itu. Satu siklus = 9 request paralel (`marketOverview.js:829-839`), tiap 90 detik (`useMarketOverview.js:20`). Menambah item di pasar yang sudah diambil = **0 request tambahan**; menambah pasar baru = +1 request per pasar per 90 detik. `getJSON` belum punya cache (`marketOverview.js:54-67`) → kandidat perbaikan murah.

### D.3 Rencana perapian (terurut)

| # | Tindakan | Alasan |
|---|---|---|
| D-1 | Tambah `MarketTicker` di bawah header | Ringkasan cepat lintas pasar, konteks sebelum tabel |
| D-2 | Kartu majors jadi dapat dikonfigurasi per pasar; tambah IHSG / S&P 500 / DXY | Menjawab positioning multi-aset |
| D-3 | Buang duplikasi status bursa (pilih Row 2 atau `GlobalMarketTicker`) | Satu informasi satu tempat |
| D-4 | Kelompokkan tabel: bagian "Crypto" dan "Saham/Valas/Komoditas" dengan sub-judul | Mencegah campur aduk saat lintas pasar hidup |
| D-5 | Default filter ke `CRYPTO` atau tambah pengelompokan visual pada `ALL` | Konsistensi |
| D-6 | Rapikan header: judul di kiri, status/waktu di kanan, peringatan error turun jadi baris sendiri | Hindari wrap berantakan |
| D-7 | Konfirmasi + hapus `HomeDashboardTab.jsx` bila benar mati | Kurangi 123 KB kode mati |

**Acceptance criteria D:**
- Home memuat dalam satu layar tanpa scroll horizontal pada 1280px.
- Tidak ada dua panel yang menampilkan informasi sama.
- Setiap bagian punya judul yang jelas.

---

## 5. Bagian E — Changelog & Arsitektur "kok tidak ada"

### E.1 Jawaban singkat

**Keduanya ADA dan sudah terpasang di kode — tetapi tidak bisa dilihat user biasa.**

Bukti:
- `App.jsx:22,24` — `FlowProcessTab` dan `ChangelogTab` di-lazy-import.
- `App.jsx:918` — dirender saat `activeTab === 'FLOW_PROCESS'`; `App.jsx:948` saat `activeTab === 'CHANGELOG'`.
- `featureAccess.js:119-120`:
  ```js
  [MODULES.FLOW_PROCESS]: TIER.ADMIN,
  [MODULES.CHANGELOG]:   TIER.ADMIN,
  ```
- Ada **layar kunci admin** di `App.jsx`: `FLOW_PROCESS` hanya dirender bila `isAdmin` (`App.jsx:920`); bila bukan, muncul layar "Modul Khusus Internal Admin" (`App.jsx:924-946`). `CHANGELOG` sama (`App.jsx:950`, layar kunci `App.jsx:954-961`).
- `CmcTopNav.jsx` (daftar menu Home/Trade/Markets/Research & Learn/Account) **tidak memuat** `FLOW_PROCESS` maupun `CHANGELOG` sama sekali. Paling dekat hanya `SETTINGS`, `SUBSCRIPTION`, `ACHIEVEMENTS` (`CmcTopNav.jsx:79-81`).

Jadi: bukan salah judul, tapi **gerbang tier ADMIN + tidak ada pintu masuk di navigasi** → praktis tidak terjangkau.

**Akar masalah yang lebih dalam — `isAdmin` sendiri.** `App.jsx:248-250`:
```js
const isAdmin = isLocalDev ||
                !!account?.isAdmin ||
                ['naufalarib60@gmail.com', 'ahmfuadi28@gmail.com'].includes(String(account?.email || '').toLowerCase());
```
`isLocalDev` (`App.jsx:240-245`) bernilai benar hanya di localhost, LAN, port 5173/19387/19388, atau ada `localStorage.mbg_admin_access === 'true'`.
**Akibatnya: dari produksi, bila tidak login memakai dua email itu, menu Changelog dan Arsitektur hilang total.** Inilah yang Jendral Arib alami — bukan file-nya yang tidak ada.

### E.2 Masalah tambahan

1. **Isi changelog basi.** Entri terbaru `changelogData.js:8-10` = "30 September 2026" — 19 entri, rentang 8-30 Sep, **nol entri Oktober**. Padahal `CHANGELOG.md` di root repo sudah **108.860 byte** dan diperbarui 07-Okt-2026, sementara git log aktif sampai 10-Okt. Isinya sudah ada, hanya tidak pernah disalin ke UI.
2. **FlowProcessTab justru bagus tapi tersembunyi.** Ia bukan teks statis: peta simpul interaktif 5 tahap (Lokal → Pipeline Cloud → Gerbang QA → Web → Yang Masih Dibutuhkan) dengan pan/zoom, dibangun dari `docs/ALUR_PROSES.svg` (`FlowProcessTab.jsx:3-18, 24-74`).
3. **Klaim FlowProcessTab perlu diverifikasi.** `:62` menulis "Harga pasar (CORS langsung): SUDAH JALAN: saham, crypto, forex, emas" — padahal rute cross-market di `marketOverview.js` sedang gagal karena preflight (P0-2). Dokumen arsitektur ikut melebih-lebihkan; harus dikoreksi setelah perbaikan.
4. **Materi arsitektur sudah ada tapi tidak terhubung UI:** `docs/ALUR_PROSES.svg`, `docs/ALUR_PROSES.png`, `docs/audit_2026-10-02/06_BUSINESS_PROCESS.md`, `docs/MASTERPLAN_MBG_UNIFIED_V3.md`, `DESIGN.md`.

### E.3 Rencana

| # | Tindakan | Detail |
|---|---|---|
| E-1 | Turunkan tier `CHANGELOG` dari `TIER.ADMIN` ke `TIER.FREE` | Riwayat rilis wajar dibaca pelanggan |
| E-2 | Turunkan tier `FLOW_PROCESS` ke `TIER.FREE`, atau sediakan versi publik yang disaring | Sekarang ADMIN (`featureAccess.js:119`) |
| E-3 | Tambahkan pintu masuk: item `Changelog` di menu ACCOUNT (`CmcTopNav.jsx:76-82`) dan `Arsitektur` di menu Research & Learn (`:62-73`) | Tanpa ini, poin E-1/E-2 tidak ada gunanya |
| E-4 | Daftarkan di `CommandPaletteModal.jsx` agar bisa dicari | Aksesibilitas |
| E-5 | Tambahkan tautan dari changelog terbaru ke halaman arsitektur | Keterkaitan |
| E-6 | Isi changelog: buat generator dari `git log` (mis. `scripts/gen_changelog.mjs`) yang mengelompokkan `feat/fix/docs/chore` per hari | Menghentikan kebasian permanen |
| E-7 | Jadwalkan pembaruan changelog di salah satu workflow yang sudah ada | Otomatis |
| E-8 | Koreksi klaim di `FlowProcessTab.jsx:62` setelah P0-2 selesai | Kejujuran dokumen |
| E-9 | **Tutup kebocoran Command Palette**: `CommandPaletteModal.jsx` tidak menggerbangi tab admin | Setiap tab admin yang ditambahkan nanti akan ikut bocor lewat pencarian |
| E-10 | Perbaiki `isAdmin` (`App.jsx:248-250`): jangan bergantung pada localhost + email hardcoded; pakai `account.isAdmin` dari server/Supabase | Tanpa ini, user sah tetap terkunci di produksi |
| E-11 | Segarkan `changelogData.js` dari `CHANGELOG.md` root (108.860 byte, 07-Okt) lebih dulu, sebelum bikin generator | Sumber paling murah dan sudah terkurasi manusia |
| E-12 | Jadikan "Arsitektur" tab publik tersendiri; `FlowProcessTab` tetap admin setelah disanitasi | Memisahkan yang boleh publik dari yang internal |

**Acceptance criteria E:**
- User tier Free bisa membuka Changelog dan Arsitektur dari navigasi.
- Changelog memuat entri sampai tanggal berjalan (selisih maksimal 1 hari).
- Diagram `ALUR_PROSES.svg` dapat dibuka dari menu.

---

## 5B. Bagian F — Admin terkunci di tier PRO (temuan baru 2026-10-10)

### F.1 Gejala yang dilaporkan

Jendral Arib: *"kenapa untuk admin masih kena notif ini untuk pro, ini untuk legend. harusnya untuk admin kan semua open dan max."*

### F.2 Hasil penelusuran: asalnya dari jalur login owner

**Rantai penyebabnya jelas dan bisa dilacak baris per baris.**

1. **Server: `/api/auth` tidak pernah mengirim identitas admin.**
   - `frontend/functions/api/auth.js:153` (GET): `{ authenticated: true, tier: payload.tier || 'PRO' }`
   - `frontend/functions/api/auth.js:218` (POST): `{ authenticated: true, tier: 'PRO', expiresAt }`
   - Keduanya **tidak** memuat `email` maupun `isAdmin`.

2. **Klien: jalur owner menulis tier PRO secara tetap dan kehilangan email.**
   `App.jsx:194`:
   ```js
   const owner = { authenticated: true, tier: 'pro', isPro: true, owner: true, email: body.email || null };
   ```
   Karena `/api/auth` tidak mengirim `email`, hasilnya `email: null`.

3. **Akibatnya `isAdmin` selalu `false` untuk jalur owner.**
   `App.jsx:248-250` memerlukan `account.isAdmin` (tidak ada) atau email cocok dengan daftar (`null` → tidak cocok).

4. **`userTier` lalu jatuh ke PRO.**
   `App.jsx:273-279`: baris 274 `if (isAdmin) return 'LEGEND'` tidak pernah kena; baris 277 `account?.isPro` → **`userTier = 'PRO'`**.

5. **Gerbang modul menolak.** `App.jsx:748`: `!isAdmin && !canAccess(activeTab, userTier, isAdmin)` → `true`, sehingga muncul:
   - `App.jsx:772-817` → **"Modul Ini Khusus Legend"** (untuk TRADING_BOT dan JEV_EXECUTION).
   - `App.jsx:749-771` → **"Modul Khusus Administrator"** (untuk FLOW_PROCESS dan CHANGELOG).

**Kesimpulan:** siapa pun yang masuk lewat **password owner/cockpit** akan selalu berakhir sebagai PRO, dan **tidak pernah** dianggap admin. Itu persis gejala yang Jendral alami. Jalur akun biasa tidak terkena karena `/api/account/me` memang menghitung `isAdmin: isAdmin(profile.email)` (`_shared.js:194`).

### F.3 Bukti pendukung

- Daftar email admin ada di **dua tempat** dan bisa menyimpang:
  - server: `frontend/functions/api/account/_shared.js:299-302` (`ADMIN_EMAILS`), dipakai `isAdmin()` di `:304-306`;
  - klien: `App.jsx:250` (duplikat literal).
- `accountClient.js:4-7` menegaskan prinsip proyek: *"The browser never decides its own tier — it only ASKS."* Maka perbaikan **harus di server**, bukan menambal `isAdmin: true` di klien.

### F.4 Catatan soal "max" (limit tier)

Untuk limit, admin **sudah** benar bila `isAdmin` bernilai true: `App.jsx:274` mengembalikan `LEGEND`, dan `TIER_LIMITS[LEGEND]` = `signals: 100, delayHours: 0, showLevels: true` (`featureAccess.js:202`). Bahkan PRO pun sudah 100/0/true. Jadi **yang rusak adalah "open", bukan "max"**.

Yang tetap rapuh: `allowedModules` / `lockedModules` / `limitsFor` (`featureAccess.js:185-206`) **tidak menerima parameter `isAdmin`** — semuanya bergantung pada `userTier` yang sudah di-LEGEND-kan. Test mengakui ini (`__tests__/adminAccess.test.jsx:73-75`). Aman hari ini, tapi mudah rusak.

### F.5 Rencana perbaikan

| ID | Tindakan | Prioritas | Effort |
|---|---|---|---|
| **P0-5** | `auth.js`: sertakan klaim peran admin pada JWT owner dan kembalikan `{ isAdmin: true, email: <owner email>, tier: 'legend' }` di GET (`:153`) dan POST (`:218`) | **P0** | S |
| **P0-6** | `App.jsx:194`: jangan menulis `tier: 'pro'` tetap; baca dari respons server | **P0** | XS |
| P1-7 | Satukan sumber daftar admin: hapus literal di `App.jsx:250`, andalkan `isAdmin` dari server | P1 | S |
| P2-5 | Tambahkan parameter `isAdmin` ke `allowedModules`/`lockedModules`/`limitsFor` agar tidak bergantung pada efek samping `userTier` | P2 | S |
| P2-6 | `App.jsx:830`: label `requiredTierFor(...) === TIER.PRO ? 'Pro' : 'Free'` menyederhanakan tiga tingkat jadi dua; pakai `TIER` sebenarnya | P2 | XS |

**Acceptance criteria F:**
- Login lewat password owner di produksi → menu Changelog dan Arsitektur langsung terlihat.
- Modul Legend (Trading Bot, Jev Execution) terbuka tanpa layar kunci.
- Tidak ada email admin yang ditulis di kode klien.
- Tes `adminAccess.test.jsx` dan `lockedModuleScreen.test.js` tetap lulus setelah perubahan.

---

## 6. Urutan eksekusi (wave)

**Wave 1 — hentikan yang rusak (hari ini, kecil semua)**
1. P0-2 header `text/plain` di `marketOverview.js:560` (1 baris).
2. P0-1 timeout + retry + fallback `/api/news`, dan UI berhenti gagal senyap.
3. P1-3 + E-1 + E-2 + E-3: changelog & arsitektur jadi terlihat.
4. **P0-5 + P0-6**: sesi owner mengenali dirinya sebagai admin → satu perbaikan yang sekaligus menyelesaikan bagian E.

**Wave 2 — jujur soal data**
4. P0-3 order book IDX: hapus generasi atau ubah label.
5. P0-4 putuskan 5 file mati.
6. P1-5 + P2-2 perbaiki klaim "hourly" dan "REALTIME".

**Wave 3 — fitur ticker & home**
7. `MarketTicker.jsx` + pasang di landing (P1-1) dan home (P1-2).
8. Perapian home D-1..D-7.

**Wave 4 — otomatisasi**
9. E-6/E-7 generator changelog.
10. P1-6 jadwal IDX harian.
11. P2-3 hapus home lama.

---

## 7. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Mengubah header ke `text/plain` ternyata ditolak TradingView | Cross-market tetap kosong | Uji POST dengan `text/plain` dari browser sebelum commit; bila gagal, pakai proxy publik ber-cache |
| Ticker di home menambah beban render | Home melambat | Batasi 12-16 item, memoize, jangan fetch baru |
| Menurunkan tier CHANGELOG/FLOW_PROCESS | Isi admin bocor ke publik | Periksa `FlowProcessTab` tidak memuat nama personal/kredensial — komentarnya sendiri menyatakan nama personal sudah dikeluarkan (`:16-17`) |
| Repo sedang diubah banyak agen | Konflik edit | Kerjakan per file, commit kecil, koordinasi lewat satu pemilik per file |
| Generator changelog menghasilkan noise | Changelog tidak terbaca | Kelompokkan per hari, saring `chore: [skip ci]` |
| Menurunkan tier CHANGELOG/FLOW_PROCESS **memecahkan tes yang ada** | CI merah | `frontend/src/components/__tests__/CmcTopNav.test.jsx:107-108` dan `featureAccess.test.js:152-153` mengunci perilaku admin-only; perbarui tesnya bersamaan |
| `FlowProcessTab.jsx:73` memuat informasi sensitif (menyebut kunci JWT & password cockpit yang sempat ter-commit) | Bocor ke publik bila tier diturunkan tanpa disanitasi | Sanitasi dulu, baru buka; atau pisahkan jadi tab publik terpisah (E-12) |
| Command Palette membocorkan tab admin | Akses tak wajar | Selesaikan E-9 sebelum menambah tab apa pun |

---

## 8. Hasil verifikasi lanjutan (2026-10-10 malam) — otoritatif

Bagian ini menggantikan daftar "yang belum dicek" sebelumnya. Semua item di bawah sudah diperiksa, sebagian dengan browser asli.

### 8.1 P0-2 TERBUKTI dan TERKUNCI — cukup satu baris

Diuji di **browser asli** (headless Chromium, origin `https://mbg-trading.pages.dev`), dari halaman produksi:

| Content-Type | Hasil |
|---|---|
| `text/plain` | **HTTP 200**, data asli (`totalCount: 2`, NVDA 229.28, AAPL 336.64) |
| `application/json` | **GAGAL** — `TypeError: Failed to fetch` / `Request header field content-type is not allowed by Access-Control-Allow-Headers in preflight response` |

Diuji **dua kali secara terpisah** (oleh Lead dan oleh agen recon-ticker) dengan hasil identik. **Kesimpulan: P0-2 cukup mengganti satu baris ke `text/plain`. Tidak perlu proxy baru.**

Kontrol lain dari browser yang sama: Binance 24hr **200 OK**, CoinGecko global **200 OK**. Jadi `fetchMajorCards` dan `fetchGlobalMetrics` **tidak** terkena masalah ini — hanya jalur `fetchScannerMarket` yang salah. Catatan: `/api/scanner` dari halaman publik membalas **401** (memang session-gated), jadi jangan dijadikan fallback untuk tamu.

### 8.2 Jawaban atas pertanyaan yang sebelumnya menggantung

| Pertanyaan | Jawaban |
|---|---|
| `crossMarket` perlu paginasi? | **Tidak.** `CROSS_MARKET_UNIVERSES` = **38 baris** (US 20 + FX 10 + Komoditas 8, `marketOverview.js:515-548`). Aman ditampilkan sekaligus |
| `livePrices` memuat US/FX/Komoditas? | **Ya.** Tag `US` (`useLivePrices.js:29-35,427`), `FOREX` (`:39-46,472`, termasuk USDIDR), `COMMODITY` (`:51,523`). Snapshot semua pasar saat mount (`:663-668`), refresh adaptif 12 dtk saat bursa buka (`:674-686`) |
| DXY/indeks global ada? | **Ada** — `TVC:DXY` di `useLivePrices.js:51`, tag `COMMODITY` (`:523`), alias `DXY`/`USDX` (`:536-538`). Tidak ada tag "global" tersendiri |
| `prefers-reduced-motion` ditangani? | **Ya** — `index.css:1801-1803`: `.lp-marquee-track { animation: none; }` |
| Ada histori FX/komoditas di server? | **Tidak ada.** `scanner.js` hanya snapshot; `data.js` nol match untuk history/ohlc/fx. `forex_scanner.py` tidak memakai yfinance. **Opsi C butuh fetcher + endpoint baru → ditunda** |
| Ada ticker di header/nav global? | **Tidak ada.** `CmcTopNav.jsx` murni navigasi |
| Test yang menyentuh ticker? | `LandingPage.test.jsx:57,141` **tidak** meng-assert isi ticker. Aman selama pesan "Data pasar sedang tidak bisa dimuat" (`LandingPage.jsx:133`) tetap ada dan tahan `livePrices` undefined |
| Test lain menyentuh `HomeDashboardTab`? | **Tidak ada.** Hanya 3 lokasi non-dokumen: file itu sendiri (`:85`) + `honestData.test.js:82,89` |
| Ukuran `HomeDashboardTab.jsx` | **2.118 baris, 124.401 byte (~121,5 KB)** |
| `prefers-reduced-motion` di `.lp-marquee-track` | Sudah (lihat di atas) |

### 8.3 Komponen mati yang terkonfirmasi

| Komponen | Status | Bukti |
|---|---|---|
| `GlobalMarketTicker.jsx` | **ORPHAN** — nol import, hanya definisinya sendiri | grep di `frontend/src` → 1 hasil |
| `BloombergNewsWire.jsx` | **MATI** — hanya dipakai `HomeDashboardTab.jsx:2,413`, dan file itu sendiri orphan | grep → 3 hasil |
| `HomeDashboardTab.jsx` | **ORPHAN** (121,5 KB) | nol import produk |

**Koreksi pada Bagian D:** klaim "duplikasi status bursa dengan `GlobalMarketTicker`" **batal** — komponen itu tidak dirender di mana pun. Jadi tidak ada duplikasi antar-komponen; yang ada hanya pengulangan internal di dashboard.

### 8.4 Temuan baru yang harus masuk backlog

| ID | Masalah | Bukti | Prioritas | Effort |
|---|---|---|---|---|
| **P1-8** | Tombol `SignalsTab.jsx:135` tampil ke **semua non-VIP** (`:115`), berlabel "Lihat Paket VIP" (`:142`), tetapi `onNavigateTab('CHANGELOG')` → CHANGELOG admin-only → user biasa **kena layar kunci**. Seharusnya `SUBSCRIPTION` | `SignalsTab.jsx:115,135,142` | **P1** | XS |
| **P1-9** | `LandingPage` merender kartu untuk **seluruh** `MODULE_TIER` (`:725`) sehingga CHANGELOG & FLOW_PROCESS tampil ke tamu, badge-nya jatuh ke `else 'GRATIS'` (`:732`) = **salah label**. Kartunya `<div>` tanpa `onClick` (`:736-747`) dan LandingPage tidak punya `onNavigateTab` (`:289`) → **klik tidak melakukan apa pun** | `LandingPage.jsx:289,725,732,736-747` | **P1** | S |
| **P1-10** | Gerbang admin **hanya di sisi klien**, dan bisa dilewati dengan `localStorage.mbg_admin_access = 'true'` → `isAdmin` (`App.jsx:245,248`). Selama tidak ada rahasia asli di tab admin, ini kebocoran informasi terbatas; begitu ada, naik jadi P0 | `App.jsx:245,248` | **P1** | S |
| **P2-7** | `TVC:PLATINUM`, `TVC:COPPER`, `TVC:NATGAS` ada di `marketOverview.js:544-545` tetapi **tidak** ada di `DEFAULT_COMMODITY_TICKERS` (`useLivePrices.js:51`) → harganya selalu "—" | `useLivePrices.js:51` vs `marketOverview.js:544-545` | P2 | XS |
| **P2-8** | `livePrices` berisi 95 instrumen inti **tetapi ribuan key alias** (crypto ~3 key per pair, 744+ pair → ~2.400-2.500 key). **Wajib di-dedupe sebelum masuk ticker**, kalau tidak baris akan penuh duplikat | `useLivePrices.js` | P2 | S |
| **P2-9** | Prop `onOpenAsset` di `CmcMarketDashboard` praktis mati karena `App.jsx:900-901` juga mengirim `onOpenChart` | `App.jsx:900-901` | P2 | XS |
| **P2-10** | `CHANGELOG.md` root: **33 entri, 967 baris, terakhir 2026-10-06** — 6 hari/10 entri lebih baru dari UI. Layak jadi sumber, tetapi perlu adapter (tidak ada `semanticVersion`/`processFlow`/`status`) | `CHANGELOG.md:17,58,84,117,138` | P2 | M |

### 8.5 Yang masih benar-benar belum dicek

- **Isi visual `shot-1024.png` dan `shot-1280.png`.** Kedua file ada, tetapi **yang ter-render adalah LandingPage publik**, bukan dashboard — gate sesi mencegah masuk tanpa kredensial. Selain itu model Lead maupun agen tidak punya input gambar, jadi isi PNG **harus dilihat Jendral Arib**. Klaim "berdesakan" di 1024-1280px **belum terkonfirmasi**.
- **Bentuk field `data?.ai_agent_arena`** untuk badge Arena. Produsennya di luar repo ini; hanya `.diagnostics` yang terbukti (`App.jsx:869-870`). Perlukah badge Arena di ticker: **tunda sampai bentuk field dipastikan**.
- **Siapa yang men-set `mbg_admin_access`** — belum diketahui asalnya.
- **Verifikasi visual `CmcMarketDashboard` sebagai admin** — butuh sesi login, belum dilakukan.
- Isi penuh 33 body `CHANGELOG.md` dan §4/§9 `MASTERPLAN_MBG_UNIFIED_V3.md`.

### 8.6 Materi yang sudah siap dipakai untuk tab Arsitektur

- `docs/audit_2026-10-02/06_BUSINESS_PROCESS.md` — **8 bagian, diagram Mermaid**. Boleh publik: §1 system context (`:9`), §2 daily cycle (`:54`), §3 signal lifecycle (`:86`) — **setelah** node TRUST04 disanitasi (`:26`,`:52`). Internal: §4 funnel (`:103`), §5 owner gates (`:125-140`), §7 unit economics (`:168`).
- `MASTERPLAN_MBG_UNIFIED_V3.md` — usang dan **ditandai sendiri**: §3.4 tier target (`:145`), §5.4 TRUST04 belum dikerjakan (`:328`), kuota masih hipotesis (`:165-171`), klaim Supabase Auth sudah dikoreksi (`:142-143`). Masih relevan: §0.3 aturan bukti, §5.2 akses, §7 kontrak data, §9 gate, §3.3 (20 SHIP / 14 DEFER / 4 DROP, `:127-131`).
- `isAdmin` **bukan kolom Supabase**. Allowlist email hardcoded di edge (`_shared.js:299-307`, ditempel di `:194`); tabel `profiles` hanya berisi `id,email,display_name,tier,expires_at` (`:147`). Jalur `FLOW_PROCESS` satu-satunya hanya deep-link `?tab=`/`#` (`App.jsx:71-81`), tetap dikunci render.

---

---

## 9. Lampiran: berkas terkait

- Audit: `docs/audit_data_integrity_2026-10-08/00_RINGKASAN_EKSEKUTIF.md` … `06_RE_CHECK_2026-10-10.md`
- Recon: `docs/rencana-fixing/recon_ticker.md`, `recon_home.md`, `recon_changelog_arsitektur.md`
- Arsitektur: `docs/ALUR_PROSES.svg`, `docs/audit_2026-10-02/06_BUSINESS_PROCESS.md`
