# Cek Lanjutan: HOME, Layout & Browser (task-10)

Status: LENGKAP kecuali yang ditandai BELUM DICEK. Tanggal cek: 2026-10-10.

---

## Q1. Apakah `livePrices` memuat simbol US, FX, dan komoditas?

**Jawaban: YA, ketiganya dimuat.** Fungsi fetch masing-masing dipanggil saat mount untuk SEMUA pasar (initial snapshot), lalu di-refresh adaptif tiap 12 detik hanya bila bursa sedang buka.

- Initial snapshot semua pasar: `frontend/src/hooks/useLivePrices.js:663-668` (`fetchIdxQuotes/fetchBinance24hr/fetchUsQuotes/fetchForexQuotes/fetchCommodityQuotes`).
- Scheduler adaptif 12 detik: `useLivePrices.js:674-686`; US hanya jika `isUsMarketOpen` (`:679`), forex+komoditas hanya jika `isForexCommodityOpen` (`:682-685`). **Konsekuensi:** di luar jam bursa, harga US/FX/komoditas tetap ada tapi beku dari snapshot terakhir.
- **US** — sumber scanner `america`, ticker `DEFAULT_US_TICKERS` (`useLivePrices.js:29-35`: NASDAQ:AAPL, NVDA, MSFT, META, GOOGL, AMD, AVGO, NYSE:CRM, PLTR, SMCI, ... XOM, CVX, BA, GE, CAT). Tag `market: 'US'` di `useLivePrices.js:427`. Kunci penyimpanan: `next[clean]` (mis. `AAPL`), `next[rawSym]` (`NASDAQ:AAPL`), dan `next['FX:'+clean]` (`:430-432`).
- **FX** — scanner `forex`, ticker `DEFAULT_FOREX_TICKERS` (`useLivePrices.js:39-46`: FX_IDC:EURUSD, GBPUSD, USDJPY, AUDUSD, ..., CADCHF, dan **FX_IDC:USDIDR**). Tag `market: 'FOREX'` di `useLivePrices.js:472` — **perhatikan: tag-nya `FOREX`, bukan `FX`**. Kunci: `next[clean]` tanpa prefix (mis. `EURUSD`) dan `next[rawSym]` (`:475-476`). USDIDR juga dipersist ke localStorage (`:479-483`).
- **Komoditas** — scanner `cfd`, ticker `DEFAULT_COMMODITY_TICKERS` (`useLivePrices.js:51`: **TVC:GOLD, TVC:SILVER, FX:USOIL, FX:UKOIL, TVC:DXY**). Tag `market: 'COMMODITY'` di `useLivePrices.js:523`. Kunci = `name` + `rawSym` + alias (`:527-534`): GOLD→`GOLD/XAUUSD/XAU/USD`, SILVER→`SILVER/XAGUSD`, FX:USOIL→`USOIL/WTI/OIL_CRUDE`, FX:UKOIL→... (`:534`).

**Apakah Watchlist lintas pasar hidup?** Lookup-nya `livePrices[item.symbol] || livePrices[item.symbol+'USDT'] || livePrices['IDX:'+item.symbol]` (`frontend/src/components/cmc/CmcMarketDashboard.jsx:483`), yaitu **by simbol, bukan by market** — jadi mismatch tag `FOREX` vs `FX` tidak merusak harga.
- US: baris crossMarket simbol = `AAPL` → `livePrices['AAPL']` ada (`useLivePrices.js:430`). HIDUP.
- FX: simbol = `EURUSD` (`services/marketOverview.js:577` memotong prefix) → `livePrices['EURUSD']` ada (`:475`). HIDUP.
- Komoditas: simbol = `GOLD`, `SILVER`, `USOIL`, `UKOIL`, `DXY` → alias GOLD/SILVER/USOIL/UKOIL disediakan (`:528-534`). Untuk `TVC:PLATINUM/COPPER/NATGAS` yang ADA di `marketOverview.js:544-545` tapi TIDAK ada di `DEFAULT_COMMODITY_TICKERS` (`useLivePrices.js:51`) → harga watchlist-nya **"—"** (tidak pernah live).
- Catatan tag market: `CmcMarketDashboard.jsx:490` mengirim `item.market` ('US'/'FX'/'COMMODITY') ke `openAsset` — apakah handler chart di `App.jsx` mengenali 'FX'/'COMMODITY' → **BELUM DICEK**.

**Bukti:** `useLivePrices.js:29-51, 398-534, 663-692`; `marketOverview.js:522-546, 577`; `CmcMarketDashboard.jsx:483, 490`.

---

## Q2. Perilaku visual nyata pada 1024-1280px (Playwright)

**Jawaban: BELUM DICEK untuk halaman HOME.** Alasan: Home ada di balik gerbang otentikasi, dan probe tidak menemukan field password di halaman publik.

Yang SUDAH dilakukan (bukan nol, tapi bukan Home):
- Playwright dipasang **di luar repo** supaya produk tidak diubah: `C:/Users/ASUS/AppData/Local/Temp/pw-recon/` → `npm i playwright-core@1.52.0` → EXIT=0. Browser dari cache yang sudah ada: `C:/Users/ASUS/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe`. Repo TIDAK disentuh; `@playwright/test` sendiri **tidak terpasang** di `frontend/node_modules` (dicek: `@playwright\test = False`; `.bin/playwright*` kosong) walau terdaftar di `frontend/package.json` devDependencies (`"@playwright/test":"^1.64.0"`).
- Probe ke `https://mbg-trading.pages.dev` render sukses (HTTP 200), viewport 1280x800 dan 1024x800, screenshot tersimpan:
  - `docs/rencana-fixing/shot-1280.png` (338.826 byte)
  - `docs/rencana-fixing/shot-1024.png`
- **Tapi yang ter-render adalah LandingPage publik, bukan Home.** Bukti dari DOM probe: `text0` = "MBG TRADING / MARKET BRAIN GRID / Fitur Utama / Alur Trading / Modul Terminal / Biaya Akses / Masuk / Daftar Gratis / BTC $82,854.00 ..."; `inputCount = 0` (tidak ada `input` sama sekali, jadi tidak ada `input[type=password]` untuk diisi).
- Metrik terukur di halaman publik: `twoCol = []` artinya **`.cmc-two-col` tidak ada di DOM** → CmcMarketDashboard memang tidak ter-render; `document.documentElement.scrollWidth = 1280` pada viewport 1280 (tidak ada overflow halaman); ada 1 elemen `clientWidth 1280 / scrollWidth 2741` yang konsisten dengan marquee ticker yang diduplikasi 3x (teks BTC/ETH/BNB/SOL/XRP memang muncul 3x berurutan di `text0`) — **di LandingPage, bukan Home**.

**Jadi klaim "berdesakan di 1024-1280px" TETAP belum terbukti secara visual. Bucket BELUM DICEK.** Yang dibutuhkan: kredensial/sesi JWT untuk menembus gerbang, atau URL aplikasi terautentikasi.
**Bukti:** output probe (`twoCol:[]`, `inputCount:0`, `url1 = https://mbg-trading.pages.dev/`); screenshot di `docs/rencana-fixing/`. Catatan: model ini tidak bisa menampilkan gambar, jadi verifikasi isi PNG harus dilakukan Lead.

---

## Q3. Test di luar `frontend/src` yang masih menyentuh `HomeDashboardTab.jsx`?

**Jawaban: TIDAK ADA.** Pencarian `HomeDashboardTab` di seluruh repo hanya menghasilkan 3 lokasi non-dokumen:
1. `frontend/src/components/HomeDashboardTab.jsx:85` — file itu sendiri (export default).
2. `frontend/src/services/__tests__/honestData.test.js:82` — komentar.
3. `frontend/src/services/__tests__/honestData.test.js:89` — `readCode('components/HomeDashboardTab.jsx')`.

Semua hasil grep lain ada di file `.md` (dokumen rencana/audit), bukan kode. `frontend/src/App.jsx` hanya meng-import `CmcMarketDashboard` (`App.jsx:7`).
**Bukti:** grep `HomeDashboardTab` seluruh repo; `App.jsx:7`.

---

## Q4. Jumlah baris & byte final `HomeDashboardTab.jsx`

**Jawaban: 2.118 baris, 124.401 byte** (~121,5 KB).
Perintah: `Get-Content ... | Measure-Object -Line` → `lines=2118`; `(Get-Item $f).Length` → `bytes=124401`.
Dokumen lama menyebut 2.007-2.199 baris (`docs/audit_2026-10-02/07_LIVE_COMPARISON_AND_PLAN.md:47` = 2.007; `new plan/MBG_TRADING_UPDATE_PLAN_V3.md:60` = 2.119) — angka sekarang masih di rentang itu, tidak menyusut.
**Bukti:** output PowerShell `lines=2118 bytes=124401`; `frontend/src/components/HomeDashboardTab.jsx`.

---

## Q5. Endpoint/scanner server-side lain untuk FX/komoditas historis?

**Jawaban: TIDAK ADA untuk FX/komoditas historis.** Yang ada hanya snapshot live + histori harian milik Python engine (US & IDX), dan itu pun tidak diekspos ke API frontend.

- `frontend/functions/api/` berisi: `arena-state.js, auth.js, data.js, ea.js, news.js, research-archive.js, scanner.js, telegram-webhook.js` (+ helper `_ea_inline.txt, _jwt.js, _session.js, _supabaseProject.js`). `scanner.js` = reverse-proxy `/api/scanner` ke TradingView `/scan` — **snapshot, bukan historis** (`frontend/functions/api/scanner.js:3,5,10`).
- Grep `history|ohlc|candle|timeseries|fx|commodit|forex` di `frontend/functions/api/data.js` → **0 match**. Bundel data utama tidak menyajikan histori FX/komoditas.
- Python engine:
  - `engine/fetchers/us_market.py:34` → `yf.download(self.tickers, period='3mo', interval='1d')`, hasil `history_dfs` (`us_market.py:45`), dikembalikan `us_market.py:140`. **Histori harian 3 bulan saham US — ADA di engine.**
  - `engine/fetchers/idx_market.py:456` → `t.history(period="3mo")`, disimpan `history_dfs` (`:458-459`), keluar sebagai `results["history_dfs"]` (`:663`). **Histori IDX — ADA di engine.**
  - `engine/fetchers/news_macro.py:342, 414, 505` → `t.history(period="5d"/"2d")` untuk instrumen makro (internal, bukan API).
  - `engine/fetchers/forex_scanner.py` → **tidak menyentuh yfinance/history sama sekali**; isinya `_fetch_tradingview_forex` (`:73`), `_scan` (`:89`), `_scan_commodities` (`:103`), `_post_scan` (`:118`) — murni scan live TradingView.
  - Tidak ada file `commodity*` di `engine/fetchers/` (isi: broker_summary_fetcher, crypto_futures, crypto_spot, foreign_flow_fetcher, forex_scanner, idx_market, news_macro, us_market, whale_tracker).
**Implikasi Opsi C:** chart historis FX/komoditas **tidak** bisa diambil dari infrastruktur yang ada; butuh fetcher + endpoint baru (atau perluas `scanner.js` dengan TradingView history, yang belum ada). Untuk saham US, histori 3 bulan sudah dihitung engine tapi belum ada jalur frontend-nya.
**Bukti:** listing `frontend/functions/api`; grep `data.js` (0 hasil); `us_market.py:34,45,140`; `idx_market.py:456-459,663`; `forex_scanner.py:73,89,103,118`.

---

## Q6. Baca penuh `CmcMarketDashboard.jsx` (789 baris)

Dibaca utuh baris 1-789 (bukan grep). Peta blok:

| Baris | Blok |
|---|---|
| 1-19 | import (CmcPrimitives, service marketOverview, hook useMarketOverview, useWatchlist, CryptoIcon) |
| 21-47 | doc modul (alasan CMC-style, IDX dipindah ke tab lain, panel sengaja absen) |
| 49-53 | `TIME_RANGES` (7d/30d/90d) |
| 55-67 | `MARKET_BADGE` + `MARKET_GLYPH` |
| 69-144 | `MarketCapChart` (SVG polyline; empty-state jujur "kapitalisasi BTC") |
| 146-202 | `MajorCard` (kartu koin + Sparkline) |
| 204-233 | `StarButton` (toggle watchlist) |
| 235-250 | signature `({ onOpenAsset, onOpenChart, livePrices, newsRows })`; `openAsset = onOpenChart || onOpenAsset` |
| 252-259 | ekstraksi data (global, fng, season, majors, topCoins, trending, deriv, crossMarket) |
| 261-272 | `nowTick` 60 dtk + `marketStatuses` |
| 274-281 | `chartSeries` (slice 30d lokal) |
| 283-323 | `assetRows` (gabung crypto + crossMarket; filter market + search) |
| 325-338 | `marketCounts` untuk pill |
| 340-344 | `watched`, `nothingLoaded` |
| 346-376 | HEADER (h2 "Market Overview" :352-354, badge LIVE :355-358, timestamp :359-363, tombol Segarkan :370-375) |
| 378-387 | ROW 1 — grid kartu koin besar (`majors`) |
| 389-515 | ROW 2 — panel "Market Status" (:392-456) + panel "Watchlist Saya" (:459-514) |
| 517-608 | ROW 3 — panel chart "Kapitalisasi Pasar BTC" (:520-584, termasuk toggle overview/breakdown :526-538) + panel "Derivatives" (:586-607) |
| 610-776 | ROW 4 — panel "Semua Aset" (:613-712: pill :625, tabel :634-710) + panel "Trending & Topik" (:714-775) |
| 778-786 | FOOTER branding/legal (font 11px :779 & 10.5px :783) |

**Prop yang diterima:** 4 — `onOpenAsset` (`App.jsx:900`), `onOpenChart` (`App.jsx:901`), `livePrices` (`App.jsx:899`), `newsRows` (`App.jsx:902`).
**Prop diterima tapi praktis tak dipakai:** `onOpenAsset`. Hanya dipakai sebagai fallback `onOpenChart || onOpenAsset` (:250); karena App.jsx mengirim `onOpenChart` juga (`App.jsx:900-901`), cabang `onOpenAsset` **tidak pernah aktif di produksi** — jalur mati, bukan bug.
**Blok menganggur / duplikatif:**
1. Toggle `overview|breakdown` (:526-538) → cabang `breakdown` (:573-583) hanya menampilkan ulang DominanceBar + Dominasi BTC/ETH + Total Aset + Bursa Aktif yang sudah ada di ROW 2 (:439-454 dan :420-435). State `view` (:240) tidak dipakai di tempat lain.
2. MetricTile "Market Cap" + "Volume (24h)" muncul dua kali: (:420-429) dan (:561-569) — sumber nilainya beda (global vs chartSeries BTC).
3. `MARKET_BADGE` (:55-61) dan `MARKET_GLYPH` (:63-67) isinya tumpang tindih per market; `MARKET_GLYPH` hanya dipakai sekali (:673).
4. Tidak ada import yang menganggur; `DASH`, `changeColor`, `formatPct` dipakai konsisten.
**Bukti:** pembacaan penuh file; `App.jsx:898-903`.

---

## Q7. Ticker berjalan di header/nav global selain `BloombergNewsWire`?

**Jawaban: TIDAK ADA ticker di header/nav aplikasi. Dua komponen ticker yang ada justru tidak terpakai.**

- `frontend/src/components/CmcTopNav.jsx` — **nav murni, tanpa ticker**. Tidak ada import/elemen `Ticker`/`Marquee`; grep hanya menemukan `useState/useRef/useEffect/useCallback/useMemo`, `onClick` navigasi (`:299, 465, 535, 549, 585, 604`) dan `handleLogoutClick` (`:342, 613`). Dipasang di `App.jsx:8` (import) dan `App.jsx:647` (render).
- `frontend/src/components/GlobalMarketTicker.jsx:4` (`export default function GlobalMarketTicker({ onNavigateGlobal })`) — **tidak di-import di mana pun**. Grep `GlobalMarketTicker` di seluruh `frontend/src` hanya menemukan definisinya. **ORPHAN.**
- `frontend/src/components/BloombergNewsWire.jsx:3` — satu-satunya import-nya `frontend/src/components/HomeDashboardTab.jsx:2`, dipakai di `HomeDashboardTab.jsx:413`. Karena `HomeDashboardTab` orphan (Q3), `BloombergNewsWire` **ikut mati di produksi**.
- Ticker yang BENAR-BENAR jalan hanya di LandingPage publik — terobservasi live di probe Q2: `BTC $82,854.00 -0.26% / ETH $2,497.81 +0.02% / BNB $748.70 +0.88% / SOL $109.79 -0.54% / XRP $1.40 +1.03%`, diulang 3x (konten ≈2741px di viewport 1280). Itu LandingPage, bukan header aplikasi.
**Bukti:** grep di `CmcTopNav.jsx`, `GlobalMarketTicker.jsx`, `BloombergNewsWire.jsx`, `App.jsx`; output probe Q2.

---

## Kesimpulan yang mengubah rencana
1. **Watchlist lintas pasar BUKAN masalah.** US/FX/komoditas sudah masuk `livePrices` (Q1). Yang perlu diperbaiki hanya cakupan: `TVC:PLATINUM/COPPER/NATGAS` ada di `marketOverview.js:544-545` tapi tidak ada di `DEFAULT_COMMODITY_TICKERS` (`useLivePrices.js:51`) → harganya tak pernah live. Cukup samakan dua daftar itu, effort S, 1 file.
2. **Klaim "berdesakan 1024-1280px" belum boleh masuk rencana final** — belum ada bukti visual Home (Q2). Sebelum menulis rekomendasi breakpoint, butuh sesi ber-login.
3. **Opsi C (chart lintas pasar) mahal.** Tidak ada endpoint historis FX/komoditas (Q5); harus bikin fetcher + endpoint baru. Saham US punya histori 3 bulan di engine tapi tanpa jalur frontend.
4. **Dua orphan baru ditemukan** selain `HomeDashboardTab.jsx`: `GlobalMarketTicker.jsx` (Q7) dan (efektif) `BloombergNewsWire.jsx` karena hanya dipakai file orphan (Q7). Kandidat hapus bertambah tanpa analisis lanjutan.
5. **Test di luar `frontend/src` aman** (Q3): menghapus `HomeDashboardTab.jsx` hanya perlu mengubah 1 test di `honestData.test.js:82,89`. Tidak ada test lain yang menempel.

## Masih belum dicek
- **Q2 inti**: tampilan visual nyata Home pada 1024x800 & 1280x800. Screenshot yang ada hanya LandingPage publik. Butuh sesi terautentikasi (JWT cookie / kredensial). **BELUM DICEK.**
- Alias `DXY` (dan lanjutan `useLivePrices.js:534+`, belum dibaca) — apakah `livePrices['DXY']` benar terbentuk. **BELUM DICEK.**
- Apakah `handleOpenChart` di `App.jsx` menerima tag market `'FX'`/`'COMMODITY'` dari `CmcMarketDashboard.jsx:490`. **BELUM DICEK.**
- Test e2e/Playwright di luar `frontend/src` (folder `tests/`/`e2e/`) yang menguji Home. **BELUM DICEK** (belum disisir).
- Isi `newsRows` untuk panel topik Trending (`data?.macro_telemetry?.live_news`, `App.jsx:902`). **BELUM DICEK.**
