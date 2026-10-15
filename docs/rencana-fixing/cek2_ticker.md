# Cek2 Ticker — livePrices, Arena, Test, CORS Browser

Task: task-11 · Recon: recon-ticker · Dikerjakan 2026-10-10 17:27–18:35 WIB.
Prioritas nomor 5 SUDAH TERBUKTI dengan Playwright di produksi.

## 1. DXY / indeks global sudah ada di livePrices? Tag market apa?

**Jawaban: ADA, tapi tag-nya `COMMODITY`, bukan tag indeks/global tersendiri.**
- `TVC:DXY` ada di daftar default komoditas: `frontend/src/hooks/useLivePrices.js:51`.
- Diambil lewat scanner CFD: `frontend/src/hooks/useLivePrices.js:495-500` (`callTvScanner('cfd', ...)`).
- Disimpan dengan `market: 'COMMODITY'`: `frontend/src/hooks/useLivePrices.js:523`.
- Alias yang dibuat: `DXY` dan `USDX`: `frontend/src/hooks/useLivePrices.js:536-538`.
- Tidak ada tag `GLOBAL`/`INDEX` untuk DXY. Badge "Global/DXY" harus diturunkan dari `fullSymbol === 'TVC:DXY'`, bukan dari `market`.

## 2. Bentuk pasti field data?.ai_agent_arena

**Sebagian: BELUM DICEK — alasan: produsen datanya di luar repo ini.**
- `data` berasal dari bundle API `/api/data` — `frontend/src/App.jsx:490` (fetch), `:551` (`setData(json)`).
- Konsumen: `frontend/src/App.jsx:869-870` dan `:1244-1245` (`debateData={data?.ai_agent_arena}`, `aiDiagnostics={data?.ai_agent_arena?.diagnostics}`).
- Grep `ai_agent_arena` di seluruh repo (js/jsx/ts/py/json): HANYA di App.jsx. Tidak ada produsen di repo.
- Satu-satunya field terbukti: `ai_agent_arena.diagnostics`. Sisa struktur JSON **BELUM DICEK** (payload `/api/data` tidak diambil).
- Terkait: `frontend/functions/api/arena-state.js:33-39` memakai `bundle.arena_state` (endpoint lain, session-gated).

## 3. Jumlah entri livePrices + biaya render

**Hitungan dari daftar default (runtime BELUM DICEK, app tidak dijalankan):**
- IDX 30 (`frontend/src/hooks/useLivePrices.js:20-26`), US 31 (`:29-35`), FOREX 29 (`:38-47`), Komoditas 5 (`:50-52`) = **95 instrumen statis**.
- Key lebih banyak karena alias:
  - IDX 3 key/simbol (`sym`, `sym.JK`, `IDX:sym`) — `:261-263`, `:286-288`; IHSG `:249-251`.
  - US 3 key (`clean`, `NASDAQ:...`, `FX:clean`) — `:430-432`.
  - FOREX 2 key — `:475-476`.
  - CRYPTO 3 key/pasangan (`BTCUSDT`, `BTC/USDT`, `BTC`) — `:617-619`, `:385-387`; seluruh spot USDT Binance ("744+", `:299-320`), WS juga filter `endsWith('USDT')` `:583`.
- Estimasi: ~744×3 ≈ 2.200 key kripto + ~250 key lainnya ≈ **±2.400-2.500 key**. Angka runtime pasti **BELUM DICEK**.
- Batas aman objek: **±2.400-2.500 key**; yang layak masuk ticker: **30-50 item** setelah dedupe per `symbol`/`fullSymbol` (banyak key menunjuk quote yang sama).
- Biaya render: `Object.values(livePrices)` mentah = ±2.400 node span + ±800 duplikat visual. Wajib dedupe + cap.

## 4. Test ticker: apa yang di-assert?

**Jawaban: TIDAK ADA assertion tentang ticker/harga/marquee. Perubahan ticker tidak memecahkan test, dengan 3 syarat.**
- `frontend/src/components/__tests__/LandingPage.test.jsx:57` — `renderPage` hanya kirim `onAuthenticated` + `configured`; tidak ada prop harga.
- `frontend/src/components/__tests__/LandingPage.test.jsx:141` — `configured={false}` untuk peringatan signup.
- Assertion (baris 61-150): disclaimer risiko (`:64`), "tidak menjanjikan keuntungan" (`:69`), "tidak menjamin" (`:76`), tidak ada klaim win-rate (`:79-86`), label ILUSTRASI (`:91`), headline stat (`:99-101`), tombol Daftar/Masuk (`:108-109`), AuthPanel (`:117`), label PRO (`:122`), **pesan gagal "Data pasar sedang tidak bisa dimuat" (`:133`)**, peringatan akun belum aktif (`:144`).
- `beforeEach` men-stub `fetch` agar SELALU gagal (`ok:false, status:503`) — `:32-36`. Test berjalan di jalur "feed mati".
- Syarat tetap lulus: (1) cabang gagal `LiveTickerStrip` tetap ada; (2) tidak menambah klaim performa; (3) komponen tahan `livePrices` undefined.

## 5. (PRIORITAS) Apakah TradingView menerima Content-Type: text/plain dari BROWSER?

**Jawaban: YA — text/plain 200 OK. application/json GAGAL karena preflight. P0-2 cukup 1 baris, TIDAK perlu proxy.**
Playwright (headless Chrome 149, origin `https://mbg-trading.pages.dev`, 2026-10-10 ~18:35 WIB), `page.evaluate` fetch ke `https://scanner.tradingview.com/america/scan`:
- `Content-Type: text/plain`: **ok=true, status 200, 748 ms**, body asli `{"totalCount":2,"data":[{"s":"NASDAQ:AAPL","d":["AAPL",336.64,-1.1103930438869718,"Apple Inc."]},{"s":"NASDAQ:NVDA",...}`.
- `Content-Type: application/json`: **gagal — `TypeError: Failed to fetch`** (266 ms). Console: `Access to fetch at 'https://scanner.tradingview.com/america/scan' from origin 'https://mbg-trading.pages.dev' has been blocked by CORS policy: Request header field content-type is not allowed by Access-Control-Allow-Headers in preflight response.`
- `OPTIONS` preflight manual: **gagal — `TypeError: Failed to fetch`** (608 ms).
- Sebab: `text/plain` CORS-safelisted → tanpa preflight → 200. `application/json` memicu preflight, TradingView tidak mengizinkan header `content-type`.
- Pembanding proxy in-app: `POST /api/scanner?market=america` text/plain dari halaman publik → **401 `{"error":"Unauthorized"}`** (62 ms). Proxy session-gated bukan pengganti; jalur langsung text/plain yang bekerja.
- Konteks halaman: banyak resource 401 + `Failed to load cockpit bundle from any source` (halaman publik belum login).

## 6. fetchMajorCards & fetchGlobalMetrics kena CORS sama?

**Jawaban: BEDA. Binance lolos; CMC diblokir; CoinGecko lolos (fallback yang jalan).**
- `fetchMajorCards` → `https://data-api.binance.vision/api/v3/ticker/24hr?symbols=...` + `/klines` (`frontend/src/services/marketOverview.js:32`, `:406-419`). Browser: 24hr **200 OK 105 ms**; klines **200 OK 104 ms**.
- `fetchGlobalMetrics` → CMC `https://api.coinmarketcap.com/data-api/v3/global-metrics/quotes/latest` (`marketOverview.js:30`, `:127`). Browser: **gagal `TypeError: Failed to fetch`** (28 ms), console: `... blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present`.
- Fallback CoinGecko `https://api.coingecko.com/api/v3/global` (`marketOverview.js:143`) → **200 OK 302 ms**.
- Konsisten dengan komentar `marketOverview.js:111-125` (CMC tanpa header CORS; yang jalan cabang CoinGecko).

## 7. Berapa baris crossMarket setelah P0-2, perlu paginasi?

**Jawaban: 38 baris, tidak perlu paginasi untuk tabel. Untuk ticker tetap harus di-cap.**
- `CROSS_MARKET_UNIVERSES` — `frontend/src/services/marketOverview.js:515-548`: US 20 (`:522-527`), FX 10 (`:533-537`), COMMODITY 8 (`:543-546`) = **38**.
- Kolom: `description, close, change, volume, market_cap_basic, type` — `:563`; satu POST per market (`:557-563`).
- Paginasi tabel tidak perlu. Kalau 38 baris digabung IDX + kripto ke satu ticker, potong ke 30-50 item.

## 8. HomeDashboardTab.jsx masih dirujuk dari mana pun?

**Jawaban: TIDAK dirujuk sebagai komponen. Dead code (kecuali test yang membaca teksnya).**
- File ada: `frontend/src/components/HomeDashboardTab.jsx`, default export `:85`.
- Grep `HomeDashboardTab` di `frontend/src` hanya: definisinya (`:85`) dan `frontend/src/services/__tests__/honestData.test.js:89` (`readCode('components/HomeDashboardTab.jsx')` — baca teks, bukan import).
- Tidak ada `import ... HomeDashboardTab` di `frontend/src`. Referensi lain hanya dokumen (AUDIT_REPORT.md, CHANGELOG.md, new plan/*).
- Konsekuensi: menambah ticker di sana tidak akan terlihat di UI.

## 9. prefers-reduced-motion untuk .lp-marquee-track?

**Jawaban: SUDAH ditangani.**
- `frontend/src/index.css:1795-1809` — `@media (prefers-reduced-motion: reduce)`.
- Aturan persis: `frontend/src/index.css:1801-1803` → `.lp-marquee-track { animation: none; }`.
- Di blok sama: `.lp-reveal` transition (`:1796-1800`), transform hover `.lp-card/.lp-stat/.lp-preview` (`:1804-1808`).

## Kesimpulan yang mengubah rencana

1. **P0-2 cukup 1 baris `Content-Type: text/plain`** — terbukti 200 OK dari browser produksi. Jangan pakai `application/json`; pasti gagal preflight.
2. **Jangan jadikan `/api/scanner` jalur utama** untuk pengunjung publik: hasilnya 401. Pakai jalur langsung text/plain.
3. **DXY sudah ada tapi bertag `COMMODITY`** — badge harus menangani `TVC:DXY` sebagai kasus khusus.
4. **Ticker wajib dedupe + cap 30-50 item**: `livePrices` menyimpan ribuan key alias untuk quote yang sama.
5. **HomeDashboardTab mati** — target ticker Home yang benar: `CmcMarketDashboard.jsx` (dipasang `App.jsx:891-903`).
6. **Test landing page aman** selama cabang "Data pasar sedang tidak bisa dimuat" dipertahankan dan komponen tahan `livePrices` undefined.

## Masih belum dicek

- Struktur JSON lengkap `data.ai_agent_arena` (produsen di luar repo) — BELUM DICEK.
- Jumlah entri `livePrices` runtime nyata setelah login — BELUM DICEK (butuh sesi login).
- Apakah `/api/scanner` balas 200 di halaman setelah login — BELUM DICEK (probe hanya publik → 401).
- Perilaku di browser non-Chromium — BELUM DICEK.
