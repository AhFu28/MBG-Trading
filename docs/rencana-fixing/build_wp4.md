# Build WP4 — Ticker horizontal lintas pasar

Task: task-17 · Builder: recon-ticker · 2026-10-11 05:18–05:40 WIB. Tidak commit; menunggu review diff Lead.

## 1. File yang diubah (hanya write-scope)

| File | Perubahan |
|---|---|
| `frontend/src/components/MarketTicker.jsx` (BARU) | Komponen bersama: badge pasar, urutan IDX→US→FX→CMDTY→CRYPTO, duplikasi loop, `updatedAt` stamp, `onSelect` opsional, harga hilang → '—' |
| `frontend/src/components/LandingPage.jsx` | `LiveTickerStrip` lama (hanya 5 koin, tanpa polling) diganti: gabungan `fetchMajorCards()` + `fetchCrossMarketAssets()` + `fetchGlobalMetrics()`, cap 16 item, interval 60 detik, render `<MarketTicker>` |
| `frontend/src/components/cmc/CmcMarketDashboard.jsx` | Prop `allIdxStocks`, `tickerItems` useMemo (dedupe `livePrices` + `allIdxStocks` + `topCoins` + `crossMarket`), render `<MarketTicker>` tepat di bawah header Market Overview |
| `frontend/src/App.jsx` | Kirim `allIdxStocks={allIdxStocks}` ke `<CmcMarketDashboard>` di cabang HOME |
| `frontend/src/index.css` | Kelas `.market-ticker*` + `@keyframes marketTickerMove` (translateX -50%) + `.market-ticker-track { animation: none }` di blok `prefers-reduced-motion` |
| `frontend/src/components/__tests__/MarketTicker.test.jsx` (BARU) | 12 tes: badge, urutan, loop, angka jujur, items kosong, reduced-motion, stamp |
| `docs/rencana-fixing/build_wp4.md` | Laporan ini |

Catatan: `git status` menunjukkan banyak file lain berubah — itu pekerjaan teammate lain, bukan saya. Saya hanya menyentuh 6 file di atas.

## 2. Keputusan desain yang diminta dijelaskan

- **Landing: 60 detik polling DAN stamp jam.** Keduanya dipakai, bukan salah satu: polling menjaga data segar, stamp
  "Diperbarui HH:MM" (dari `updatedAt`) menjamin tidak ada kesan live saat halaman lama dibiarkan terbuka.
  Teks lama "Realtime Market Engine" diganti "Snapshot 60 detik".
- **Landing memuat 4 pasar** (US, FX, Komoditas, Crypto) = kuota 4+4+3+5 = **16 item**. IDX tidak ada di landing
  karena pengunjung publik tidak punya `livePrices`; menambah IDX butuh API baru, dan itu dilarang.
- **Home memuat 5 pasar** dari data yang sudah ada di halaman (tanpa request baru): IDX (`livePrices` seed + `allIdxStocks`),
  US/FX/CMDTY (`livePrices` + `crossMarket`), CRYPTO (`livePrices` WS + `topCoins`). Kuota IDX 8, US 6, FX 5, CMDTY 3, CRYPTO 4.
- **Realtime di Home**: `tickerItems` bergantung pada `livePrices`, yang berubah tiap tick WebSocket Binance → lane crypto ikut bergerak.
- **Dedupe**: `livePrices` menyimpan ribuan key alias yang menunjuk objek quote yang sama, jadi dedupe lewat identitas
  objek (`Set`) + kunci `market:symbol` sebelum kuota diterapkan.

## 3. Acceptance criteria

| Kriteria | Status | Bukti |
|---|---|---|
| Landing ≥4 pasar + badge | Ya (US/FX/CMDTY/CRYPTO) | `LandingPage.jsx` `pickQuota` ×4; `MarketTicker` badge |
| Home ≥4 pasar & reaktif WS | Ya (5 pasar) | `CmcMarketDashboard.jsx` `tickerItems` deps `[livePrices, ...]` |
| TradingView ≤3 call per muat | Ya | landing hanya `fetchCrossMarketAssets()` = 3 scanner (US/FX/CMDTY); crypto Binance, global metrics bukan TradingView. Home tidak menambah call sama sekali |
| prefers-reduced-motion | Ya | `index.css` blok `@media (prefers-reduced-motion: reduce)` → `.market-ticker-track { animation: none; }`; item tetap tampil sebagai potongan statis |
| Landing ≥60 detik / stamp jam | Ya, keduanya | `setInterval(load, 60000)` + `.market-ticker-stamp` |

## 4. Perintah tes + hasil

```
cd frontend
npx vitest run src/components/__tests__/MarketTicker.test.jsx src/components/__tests__/LandingPage.test.jsx
```
```
 ✓ src/components/__tests__/MarketTicker.test.jsx (12 tests) 103ms
 ✓ src/components/__tests__/LandingPage.test.jsx (13 tests) 848ms
 Test Files  2 passed (2)
      Tests  25 passed (25)
   Duration  1.96s
```
Exit code 0. Tidak ada jaringan nyata di tes: `MarketTicker.test.jsx` merender item buatan, `LandingPage.test.jsx`
men-stub `fetch` agar selalu gagal (`ok:false, status:503`) sehingga cabang "Data pasar sedang tidak bisa dimuat" tetap teruji.

```
cd frontend
npx vite build
```
```
dist/assets/LandingPage-kWt2-sQn.js               31.66 kB │ gzip:   9.38 kB
dist/assets/index-VVX6i1Yq.js                    390.30 kB │ gzip: 121.22 kB
✓ built in 1.85s
```
Exit code 0 — tidak ada impor rusak.

## 5. Sisa risiko

- **Belum diverifikasi di browser/produksi.** Tampilan nyata (lebar strip, badge, kecepatan 46–52 detik) belum dilihat mata.
- **Biaya render Home**: `Object.values(livePrices)` (±2.400 key) dipindai ulang tiap tick WS (±1 detik) di `useMemo`.
  Dedupe berbasis referensi membuatnya satu pass linier, tapi ini tetap kerja per detik yang sebelumnya tidak ada.
- **Kasus degradasi**: kalau scanner TradingView mati, landing hanya menampilkan crypto — jumlah pasar turun di bawah 4.
  Perilaku ini jujur (tidak ada data dipalsukan) tetapi tidak memenuhi AC 4 pasar pada kondisi rusak itu.
- **Ketergantungan P0-2**: jalur US/FX/Komoditas landing hanya terisi karena `marketOverview.js` sekarang memakai
  `Content-Type: text/plain`. Kalau ada yang mengembalikannya ke `application/json`, ticker landing kembali crypto-only.
- `onSelect` disediakan di `MarketTicker` tetapi sengaja **tidak** dipakai di landing maupun Home (keduanya tidak
  mengirim prop itu), untuk menghindari salah bentuk argumen ke `handleOpenChart`. Klik item belum aktif.

## 6. Belum dicek

- Tampilan visual dan perilaku hover-pause di browser nyata — BELUM DICEK.
- Apakah `allIdxStocks` dari scanner IDX benar-benar terisi saat Home dibuka di produksi (butuh sesi login) — BELUM DICEK.
- Jumlah pasti tick yang memicu re-render Home per detik — BELUM DICEK.
