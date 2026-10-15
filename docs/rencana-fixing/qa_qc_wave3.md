# QA/QC WAVE 3 (task-24) — verifikasi independen WP8 & WP9

Peran: QA independen. Tidak ada kode produk yang diubah. Satu-satunya berkas yang ditulis: laporan ini.
Tanggal: 2026-10-11. Semua pengujian dijalankan sendiri, tidak mengutip laporan WP.

## Ringkasan verdict

| # | Klaim | Verdict | Bukti |
|---|---|---|---|
| A1 | FX:USOIL & FX:UKOIL hidup | **PASS** | probe scanner: WTI 91.648, Brent 104.401 |
| A2 | TVC:USOIL & TVC:UKOIL mati | **PASS** | keduanya TIDAK dikembalikan scanner |
| A3 | TVC:PLATINUM hidup | **PASS** | 1687.8 |
| A4 | TVC:COPPER & TVC:NATGAS mati | **PASS** | keduanya TIDAK dikembalikan |
| A5 | Semua isi `DEFAULT_COMMODITY_TICKERS` hidup | **PASS** | 7/7 ticker mengembalikan harga |
| A6 | `marketOverview.js` bebas TVC:USOIL/UKOIL | **PASS** | `marketOverview.js:544-550` |
| B1 | `HomeDashboardTab.jsx` & `BloombergNewsWire.jsx` sudah tidak ada | **PASS** | glob = NONE, `git status` = `D` dua berkas |
| B2 | Tidak ada import/rujukan yang bisa menggagalkan build | **PASS** | grep seluruh repo: 0 rujukan kode |
| B3 | Penghapusan aman, tidak ada fitur hilang | **PASS** | keduanya orphan; build & suite hijau |
| C1 | `CmcHomeLayout.test.jsx` lulus | **PASS** | 6/6 tests |
| C2 | Tes itu jujur menguji perilaku | **SEBAGIAN** | render komponen nyata, tapi 2 assertion lemah (lihat C) |
| C3 | D-2/D-3/D-4/D-6 ada di kode nyata | **PASS** | `CmcMarketDashboard.jsx:567, 761, 453-459, 947-954` |
| D | Suite penuh | **PASS** | 43 files, 601 tests, 0 gagal |
| E | Kebersihan repo/proses | **SEBAGIAN** | bersih dari skrip temp, tapi ada berkas baru di luar scope QA |

---

## A. Uji ulang simbol komoditas (independen)

Perintah: `node cfd.cjs` di `%TEMP%\qa3\` → `POST https://scanner.tradingview.com/cfd/scan`, header `Content-Type: text/plain`, body berisi 13 ticker (termasuk 2 ticker kontrol palsu), `columns: ["description","close","change"]`.

**Dijalankan dua kali dengan Content-Type berbeda (`text/plain` dan `application/json`) — hasil identik (HTTP 200, 7 dari 13 ticker dikembalikan).**

| Ticker | Hasil scanner | Keterangan |
|---|---|---|
| TVC:GOLD | **HIDUP** 4193.84 | Gold |
| TVC:SILVER | **HIDUP** 60.817 | Silver |
| TVC:DXY | **HIDUP** 102.232 | U.S. Dollar Currency Index |
| TVC:PLATINUM | **HIDUP** 1687.8 | Platinum |
| TVC:PALLADIUM | **HIDUP** 1148.012 | Palladium |
| **FX:USOIL** | **HIDUP** 91.648 | WTI Oil Future |
| **FX:UKOIL** | **HIDUP** 104.401 | Brent Oil Futures |
| TVC:USOIL | **MATI** | tidak dikembalikan |
| TVC:UKOIL | **MATI** | tidak dikembalikan |
| TVC:COPPER | **MATI** | tidak dikembalikan |
| TVC:NATGAS | **MATI** | tidak dikembalikan |
| TVC:USOIL2 (kontrol) | MATI | tidak dikembalikan |
| FX:USOIL2 (kontrol) | MATI | tidak dikembalikan |

**Klaim Lead 100% terkonfirmasi, semuanya, tanpa pengecualian.** Dua ticker kontrol palsu juga tidak dikembalikan, jadi scanner memang mengabaikan simbol tak dikenal.

**Catatan presisi bahasa (bukan sanggahan):** scanner tidak mengembalikan baris berisi `null`; ia **menghilangkan** ticker itu dari respons. Jadi "MATI" di sini berarti "tidak dikembalikan", bukan "dikembalikan dengan harga kosong". Dampaknya sama untuk aplikasi (tidak ada harga), tapi definisinya perlu tepat.

### A5 — apakah SEMUA isi `DEFAULT_COMMODITY_TICKERS` hidup?
`frontend/src/hooks/useLivePrices.js:59-61`:
`TVC:GOLD, TVC:SILVER, FX:USOIL, FX:UKOIL, TVC:DXY, TVC:PLATINUM, TVC:PALLADIUM`
→ **7 dari 7 HIDUP** menurut probe di atas. **PASS.** Tidak ada lagi ticker mati seperti TVC:COPPER/NATGAS.

### A6 — apakah marketOverview.js bebas ticker mati?
`frontend/src/services/marketOverview.js:544-550` memuat komentar hasil probe 2026-10-11 dan daftar `TVC:GOLD, TVC:SILVER, FX:USOIL, FX:UKOIL, TVC:DXY, TVC:PLATINUM, TVC:PALLADIUM`. Grep `USOIL|UKOIL|COPPER|NATGAS|PLATINUM|PALLADIUM` di file itu hanya menemukan komentar dan daftar tersebut; **tidak ada `TVC:USOIL`, `TVC:UKOIL`, `TVC:COPPER`, `TVC:NATGAS` yang tersisa sebagai simbol aktif.** **PASS.** Kedua daftar (hook & service) kini identik.

---

## B. Kode mati

1. **Berkas sudah tidak ada.** `glob **/HomeDashboardTab.jsx` → NONE; `glob **/BloombergNewsWire.jsx` → NONE. `git status --porcelain` menampilkan keduanya sebagai `D` (deleted), bukan `??`.
2. **Tidak ada rujukan kode yang tersisa.** Grep `HomeDashboardTab|BloombergNewsWire` di **seluruh repo**: satu-satunya hasil di dalam `frontend/src` adalah:
   - `services/__tests__/honestData.test.js:82,89` → komentar,
   - `honestData.test.js:93-94` → justru assertion baru bahwa kedua berkas **tidak** ada,
   - `data/changelogData.js:73` → teks changelog yang dikutip (string di dalam `markdownContent`), bukan import.
   Sisanya hanya dokumen (`AUDIT_REPORT.md`, `CHANGELOG.md`, `README.md:594`, `rencana fixing.md`, `docs/sources/*`). **Nol import → build tidak bisa gagal karena ini.**
3. **Aman, tidak ada fitur hilang.** `BloombergNewsWire` satu-satunya pengimpor adalah `HomeDashboardTab.jsx:2` (dua-duanya orphan, sudah saya buktikan di task-10 lalu ditegaskan `honestData.test.js:88-90`), jadi marquee berita itu memang tidak pernah dirender di produksi. Bukti tidak ada regresi: `npx vite build` exit 0 dan `honestData.test.js` (termasuk assertion penghapusan) lulus di suite penuh. Penggantinya sekarang ada: `MarketTicker` baru dipakai di `CmcMarketDashboard.jsx:559`.

---

## C. Uji tata letak Home

`cd frontend && npx vitest run src/components/__tests__/CmcHomeLayout.test.jsx`
→ **1 file passed, 6 tests passed** (397 ms).

### Apakah tesnya jujur?
**SEBAGIAN jujur.** Yang benar:
- Ia me-`vi.mock` **hanya** `useMarketOverview` (sumber data), lalu merender **komponen asli** `CmcMarketDashboard` (`CmcHomeLayout.test.jsx:18-20, 47-49`). Jadi ia menguji logika render nyata, bukan mock-nya sendiri.
- Assertion terkuat dan sahih ada di D-4: `document.querySelectorAll('tr.cmc-group-row')` beserta **teksnya persis** `['Crypto (1)','Saham US (1)','Valas (Forex) (1)','Komoditas (1)']` (`:74-80`) dan hilang saat satu pasar dipilih (`:88`). Ini menguji struktur DOM, bukan helper mock.
- D-3 (`:97`) menghitung panel dengan label sama persis = 1. Ini menangkap duplikasi yang dulu ada.

Yang **lemah** dan tidak boleh dianggap bukti kuat:
1. **D-6 hanya mengecualikan dua nilai.** `CmcHomeLayout.test.jsx:105-106` menguji `fontSize` `!==` `'10.5px'` dan `!==` `'11px'`. Regresi ke `9px`, `0.7rem`, atau `10px` akan **lulus**. Uji yang benar: `parseFloat(disclaimer.style.fontSize) >= 12`.
2. **D-2 tidak membuktikan kartunya berganti isi.** `:63` hanya memastikan teks `/Instrumen/` muncul, dan teks itu berasal dari **judul** (`CmcMarketDashboard.jsx:567`), bukan dari kartu. Yang benar-benar menguji adalah `:64` (`Koin Mayor` hilang), tapi itu pun tidak memeriksa apakah kartu NVDA/EURUSD/GOLD benar-benar ter-render.
3. Fixture `crossMarket` (`:25-29`) hanya berisi **1 baris per pasar**, sehingga jumlah per grup selalu `(1)`; pemotongan `slice(0,5)` di `majorCards` (`CmcMarketDashboard.jsx:416-423`) tidak pernah teruji.

### Verifikasi saya sendiri atas isi klaim (baca kode, bukan hanya tes)
- **D-2 kartu mayor mengikuti pill** — `CmcMarketDashboard.jsx:404-425`: ALL/CRYPTO → `majors`; US/FX/COMMODITY → `assetRows.filter(...).slice(0,5)`. Judul ikut berubah di `:567`. **Benar.**
- **D-4 sub-judul saat ALL** — `CmcMarketDashboard.jsx:453-459`: label `{ CRYPTO:'Crypto', US:'Saham US', FX:'Valas (Forex)', COMMODITY:'Komoditas' }`, **digroup hanya saat `assetMarket === 'ALL'`**, dan grup kosong dibuang (`:458`). **Benar.**
- **D-3 satu panel kapitalisasi** — hanya satu `title="Kapitalisasi Pasar BTC"` (`:761`); komentar `:782` menyatakan duplikat dihapus. MetricTile `label="Market Cap"` (`:652-657`) memang **bukan** duplikat: itu total kapitalisasi kripto dari `global.totalMarketCap` dengan `hint` eksplisit, berbeda dari seri BTC. **Benar.**
- **D-6 footer ≥12px** — `:947` font 12px pada kontainer; div teks disclaimer `:952-954` **tidak** punya `fontSize` lokal sehingga mewarisi 12px, dengan komentar `:951`. **Benar di kode**, walau tesnya lemah.

### Regresi yang TIDAK tertangkap
1. **Pasar terpilih kosong → judul tanpa kartu.** Kalau `crossMarket` tidak punya baris untuk pasar yang dipilih (mis. FX kosong karena scanner gagal), `majorCards` = `[]` (`:418-423`) dan yang tampil hanya **judul "Instrumen Valas (Forex)" dengan grid kosong** — tidak ada empty state, tidak ada pesan. Tidak ada satu pun tes yang menutup kasus ini (CmcHomeLayout memakai fixture yang selalu berisi; `CmcMarketDashboard.test.jsx` membuat semua request gagal sehingga `assetMarket` tetap ALL).
2. **Pencarian ikut mengosongkan baris mayor.** `majorCards` membaca `assetRows` yang sudah difilter `search` (`:290-323` → `:404-425`). Mengetik kata yang tidak cocok di pasar US akan menyisakan judul "Instrumen Saham US" tanpa kartu. Tidak teruji.
3. **`assetGroups = []` bersifat truthy.** Saat ALL dan `assetRows` kosong, `assetGroups` mengembalikan array kosong (truthy), sehingga cabang render memetakan nol grup; empty state tetap muncul karena diperiksa terpisah di `:860`. **Tidak ada bug**, tapi rawan: kalau kelak cek `assetRows.length === 0` dipindah ke dalam ternary, empty state akan hilang tanpa tes yang menangkapnya.
4. **`MarketTicker` (baru) tidak diuji di sini** — ia punya tes sendiri (`MarketTicker.test.jsx`, untracked) yang **tidak** saya review karena di luar scope QA ini.

---

## D. Suite penuh

`cd frontend && npx vitest run`
→ **Test Files 43 passed (43) · Tests 601 passed (601) · Duration 9.39s**

**Tidak ada kegagalan sama sekali**, jadi tidak ada pertanyaan "baru atau lama". (Sebagai konteks: pada pukul 05:26 tadi suite masih 41 file / 581 tes dengan 1 kegagalan di `provenanceModel.test.js`; kegagalan itu sudah diperbaiki pemiliknya sebelum wave ini.)

---

## E. Kebersihan

`git -C <repo> status --porcelain` (relevan):
- Terhapus sesuai WP9: `D frontend/src/components/BloombergNewsWire.jsx`, `D frontend/src/components/HomeDashboardTab.jsx`.
- Diubah sesuai WP8/WP9: `M frontend/src/components/cmc/CmcMarketDashboard.jsx`, `M frontend/src/hooks/useLivePrices.js`, `M frontend/src/services/marketOverview.js`, `M frontend/src/services/__tests__/honestData.test.js`.
- Baru: `?? frontend/src/components/__tests__/CmcHomeLayout.test.jsx` (sesuai WP8).

**Berkas/keadaan di luar scope QA ini (perlu diketahui Lead, bukan pelanggaran WP8/WP9):**
- `M frontend/src/index.css` — tidak ada di scope WP8/WP9, kemungkinan dari pekerjaan MarketTicker.
- `?? frontend/src/components/MarketTicker.jsx` dan `?? frontend/src/components/__tests__/MarketTicker.test.jsx` — komponen baru yang **belum pernah saya review**.
- `?? "rencana fixing.md"` — berkas untracked di root repo dengan spasi di nama, di luar folder `docs/`. Kandidat sampah.
- `?? docs/audit_data_integrity_2026-10-08/06_RE_CHECK_2026-10-10.md`, `?? frontend/src/components/__tests__/CommandPaletteGate.test.jsx`, `?? frontend/src/components/__tests__/provenanceModel.test.js`, `?? frontend/src/services/__tests__/ownerAdminSession.test.js`, `?? docs/rencana-fixing/` — artefak kerja lain.

**Skrip sementara:** tidak ada `.cjs` liar di repo. Dua yang ditemukan (`scripts/migrate-hex-tokens.cjs`, `scripts/prune-sidebar-css.cjs`) **tidak muncul di `git status`**, artinya sudah tracked dan memang bagian repo. Skrip QA saya sendiri saya taruh di `%TEMP%\qa3\` (di luar repo).

**Server tertinggal:** hanya satu proses `node` yang mendengarkan, yaitu port **3080** — itu DSH Web GUI sesi ini, bukan dev server Vite yang tertinggal. Tidak ada `vite`/`preview` di port lain.

---

## Yang TIDAK bisa saya verifikasi
1. **Tampilan Home sungguhan tidak bisa saya lihat.** Home ada di balik gerbang autentikasi; probe Playwright di task-10 hanya sampai LandingPage publik (`inputCount = 0`). Semua verdict tata letak di atas berbasis pembacaan kode + render jsdom, **bukan** observasi browser ber-login. Ditambah lagi, model saya tidak bisa menampilkan gambar, jadi screenshot pun tidak bisa saya nilai.
2. **Apakah tabel lintas pasar benar-benar terisi di produksi.** Itu bergantung pada respons `scanner.tradingview.com` saat berjalan dengan sesi user; saya hanya bisa memverifikasi skema endpoint-nya (bagian A), bukan hasil di layar.
3. **`MarketTicker.jsx`, `MarketTicker.test.jsx`, dan perubahan `index.css`** tidak saya review.
4. **Cakupan simbol selain yang diminta** (mis. apakah `TVC:USOIL` mungkin hidup di pasar `forex` alih-alih `cfd`) tidak diuji; saya hanya menguji pasar `cfd` sesuai perintah, dan `marketOverview.js:557` memang memakai `cfd` untuk komoditas.
