# Recon Ticker Horizontal — Landing Page & HOME

Tugas: task-6 · Recon: recon-ticker · Waktu baca file: 2026-10-10 12:51–13:36 WIB (Asia/Bangkok).
Catatan: repo sedang aktif diubah; baris bisa bergeser. Semua klaim di bawah ada bukti path:line.

## 1. Kondisi saat ini (apa adanya)

**Ticker horizontal di landing page SUDAH ADA**, namanya `LiveTickerStrip`.
Komponen lokal (bukan file terpisah) di dalam LandingPage:
- Definisi: `frontend/src/components/LandingPage.jsx:83`
- Dipakai/di-render: `frontend/src/components/LandingPage.jsx:402`
- Animasi CSS: `frontend/src/index.css:1700-1715` (`.lp-marquee-track`, `animation: lp-marquee 46s linear infinite`, `translateX(0) -> translateX(-33.333%)`)
- Pause saat hover: `frontend/src/index.css:1708-1710`
- Mati saat `prefers-reduced-motion: reduce`: `frontend/src/index.css:1801-1803`
- Loop mulus: item digandakan 3x di JSX `frontend/src/components/LandingPage.jsx:156` (`[...items, ...items, ...items]`), makanya geseran CSS -33.333%.

**Ticker horizontal KEDUA ada tapi bukan harga** — pita berita:
- CSS: `frontend/src/index.css:742-770` (`.marquee-ticker-container`, `.marquee-ticker-track`, `tickmove`, `translateX(-50%)`)
- Pemakai: `frontend/src/components/BloombergNewsWire.jsx:131-132` (headline berita, bukan quote harga).

**Komponen kandidat lain — TIDAK ada animasi horizontal:**
- `frontend/src/components/GlobalMarketTicker.jsx:4` = status jam bursa (IDX/TSE/LSE/NYSE), baris statis, tanpa marquee/animation (baris 54-117).
- `frontend/src/components/RunningTradeWidget.jsx:4-19` = panel "PITA TRANSAKSI STANDBY"; generator trade palsu sudah dihapus (baris 30-88). Tidak ada ticker berjalan.

**HOME belum punya ticker harga sama sekali.**
- HOME = `CmcMarketDashboard`, dipasang saat `activeTab === 'HOME'`: `frontend/src/App.jsx:891`.
- Props yang masuk: hanya `livePrices`, `onOpenAsset`, `onOpenChart`, `newsRows` — `frontend/src/App.jsx:898-903`. `allIdxStocks`/`allCryptoSpot` TIDAK diteruskan ke sini.
- Di dalam CmcMarketDashboard, grep `marquee|ticker|Marquee` nol pemakaian; `livePrices` cuma dipakai di `frontend/src/components/cmc/CmcMarketDashboard.jsx:235` (signature) dan `:483` (lookup harga per item). Jadi tidak ada baris horizontal lintas pasar.

## 2. Instrumen yang sekarang masuk ticker landing page

**Hanya 5 kripto, hardcoded, bukan filter dinamis:**
- `frontend/src/services/marketOverview.js:398-404`: `MAJORS = [BTC/USDT, ETH/USDT, BNB/USDT, SOL/USDT, XRP/USDT]`.
- `fetchMajorCards()` `frontend/src/services/marketOverview.js:406-435` memanggil Binance `/ticker/24hr?symbols=...` (baris 408) + sparkline 1h (baris 413-419), kembalikan `{symbol, pair, price, change24h, ...}` (baris 421-434).
- Penyaring: BUKAN `endsWith('USDT')` di jalur ini — daftarnya literal 5 pasangan USDT. (Filter `endsWith('USDT')` ada di jalur lain: `marketOverview.js:294` untuk `fetchTopCoins`, `:373` untuk `fetchTrending`.)
- Yang ditampilkan di strip: `symbol`, `price`, `change24h` — `frontend/src/components/LandingPage.jsx:105-109` dan `156-164`.
- `fetchGlobalMetrics()` (`marketOverview.js:126`) hanya dipakai untuk teks kapitalisasi pasar global di bawah strip — `LandingPage.jsx:167-171`.

## 3. Dari mana datanya & seberapa segar

- **Bukan dari App.jsx.** `LiveTickerStrip` mengambil data sendiri: `frontend/src/components/LandingPage.jsx:88-101` (`fetchMajorCards()` + `fetchGlobalMetrics()` dalam `Promise.all`).
- `<LandingPage>` di App.jsx:634 hanya diberi `onAuthenticated` dan `configured` — tidak ada `livePrices`.
- **Kesegaran: sekali saat mount, tanpa polling/stream.** `useEffect` dengan dependency array kosong + flag `alive` (`LandingPage.jsx:88-101`). Harga tidak berubah sampai halaman di-reload. Bandingkan dengan terminal: `livePrices` di `frontend/src/App.jsx:53` (`useLivePrices(data)`) bersifat streaming/polling.
- Efek: ticker landing page bisa basi, dan sumbernya berbeda dari harga yang dilihat user setelah login (dua jalur API).
- Fallback ada: gagal -> "Data pasar sedang tidak bisa dimuat dari jaringan ini" (`LandingPage.jsx:112-126`); kosong -> "Memuat data pasar…" (`:128-142`).

## 4. Apakah ticker yang sama sudah ada di Home?

**Belum.** Lihat bukti bagian 1. Home hanya menerima `livePrices` (`App.jsx:899`) dan memakainya untuk lookup per kartu (`CmcMarketDashboard.jsx:483`), bukan pita berjalan.

## 5. Cara menambahkan instrumen lain — sumber data yang SUDAH ADA

Jangan tambah API baru. Sumber paling siap: `livePrices` dari `frontend/src/hooks/useLivePrices.js:77`, sudah dipakai App.jsx:53 dan sudah diberi tag pasar per entri:
- Bentuk entri: `{ symbol, fullSymbol, price, changePct, market, updatedAt }` — contoh `useLivePrices.js:248`, `:260-261`, `:273`.
- Tag `market` yang tersedia:
  - `IDX` — `useLivePrices.js:141, 193, 215, 248, 260, 285` (termasuk IHSG `IDX:COMPOSITE`).
  - `US` — `useLivePrices.js:273, 427` (prefix `NASDAQ:`).
  - `FOREX` — `useLivePrices.js:362, 472` (termasuk USDIDR, `:354-366`).
  - `CRYPTO` — `useLivePrices.js:382, 613` (spot USDT Binance, `:299-320`, 744+ pasangan).
  - `COMMODITY` — `useLivePrices.js:523` (gold alias GOLD/XAUUSD/XAU/USD, `:529`).
- **Belum ada tag khusus untuk indeks global/DXY** di grep ini — DXY kemungkinan ikut FOREX atau belum ada. Status: BELUM DICEK.
- Sumber cadangan lain di App.jsx (tinggal dilempar sebagai prop): `allIdxStocks` (`App.jsx:872, 881, 1108, 1247, 1321`), `allCryptoSpot` (`App.jsx:882, 1017, 1109, 1127, 1322`), `data` (bundle, mis. `data?.macro_telemetry?.live_news` `App.jsx:902`), `flashMap` (`App.jsx:53`).
- Catatan: Arena/trade signal tidak punya sumber harga sendiri — pakai `data?.ai_agent_arena` sebagai badge jumlah sinyal; bentuk field-nya BELUM DICEK.

## 6. Rancangan bentuk

**Bentuk yang disarankan: SATU baris gabungan lintas pasar + badge pasar, bukan beberapa baris.**
- Satu baris hemat tinggi, cocok di bawah top bar landing page maupun Home; banyak baris bikin layout HOME (bento) bergetar.
- Isi diambil dari `Object.values(livePrices)`, dikelompokkan per `market`, lalu dikunci prioritas: IDX unggulan -> US -> FOREX (USDIDR, DXY) -> CRYPTO major -> COMMODITY.
- Batas jumlah: ~30-50 item agar animasi tetap ringan; sisanya tidak ditampilkan.
- Badge pasar: label kecil sebelum simbol, mis. `IDX`/`US`/`FX`/`CRYPTO`/`KOMODITAS`, warna beda per pasar. Bisa pakai ulang pola chip yang sudah ada (`index.css:678` `.ticker-chip-interactive`) supaya klik item bisa membuka chart (`onSelectTicker`/`onOpenChart` sudah tersedia di App.jsx).
- Kinerja:
  - Duplikasi 2x + `translateX(-50%)` (pola tipe `tickmove` `index.css:763-770`), bukan 3x, agar tidak 3 salinan DOM. Kalau pakai 3x, geseran harus -33.333% (pola `lp-marquee`).
  - Batasi `will-change: transform` (sudah ada di `index.css:1704`).
  - Wajib `prefers-reduced-motion: reduce -> animation: none` (sudah ada di `index.css:1795-1803`; tambahkan selector komponen baru ke blok itu).
  - Jangan re-render seluruh track tiap tick harga; kalau perlu, throttle update (mis. tiap 2-3 detik) atau pecah item jadi komponen `memo`.

## 3-opsi perbaikan (trade-off)

**Opsi A — Ekstrak komponen bersama `MarketTicker.jsx`, pakai di LandingPage + Home.**
- Buat `frontend/src/components/MarketTicker.jsx` yang menerima `livePrices` (dari App.jsx) dan `items` fallback (dari `fetchMajorCards()` untuk pengunjung belum login).
- LandingPage: `<MarketTicker livePrices={livePrices} fallbackItems={...} />`; App.jsx:634 perlu kirim `livePrices`.
- Home: pasang di `CmcMarketDashboard` dan teruskan dari `App.jsx:898-903`.
- Trade-off: satu sumber kebenaran, konsisten, tapi menyentuh 3 file + index.css. Effort M.

**Opsi B — Cepat: pasang ticker hanya di Home, satu komponen baru, tanpa ubah LandingPage.**
- Tambah `MarketTicker.jsx` + panggil di CmcMarketDashboard; data langsung dari prop `livePrices` yang sudah ada (`App.jsx:899`).
- Trade-off: kebutuhan Jendral ("pasang juga di home") terpenuhi cepat, risiko regresi landing page nol. Tapi landing page tetap 5 kripto statis (masalah basi tidak hilang). Effort S.

**Opsi C — Ubah `LiveTickerStrip` jadi multi-pasar tapi tetap self-fetch (tambah endpoint).**
- Trade-off: menyentuh `marketOverview.js` + API baru -> melanggar arahan "tidak perlu API baru", dan menambah beban jaringan di halaman publik. Tidak disarankan.

## 4. Rekomendasi + estimasi

Jalankan **Opsi B dulu, lalu Opsi A**:
1. (S, ~1-2 jam) Buat `frontend/src/components/MarketTicker.jsx` dengan sumber `livePrices`, badge pasar, cap item, loop 2x, CSS baru + masuk blok reduced-motion di `index.css`. Pasang di CmcMarketDashboard (Home).
2. (S, ~30-60 menit) Teruskan `livePrices` ke `<LandingPage>` di `App.jsx:634` dan pakai komponen yang sama dengan fallback `fetchMajorCards()`.
3. (S) Samakan geseran CSS ke satu pola saja (-50% dengan 2 salinan) supaya tidak ada dua konvensi.

File yang disentuh: `frontend/src/components/MarketTicker.jsx` (baru), `frontend/src/components/cmc/CmcMarketDashboard.jsx`, `frontend/src/components/LandingPage.jsx`, `frontend/src/App.jsx` (`~:634`, `~:898-903`), `frontend/src/index.css` (`~:1699-1715`, `~:1795-1803`).

## 5. Risiko & hal yang bisa rusak

- `livePrices` berisi 744+ pasangan spot (`useLivePrices.js:299-320`). Tanpa cap dan kurasi, ticker jadi sangat panjang dan berat -> wajib batasi jumlah item.
- Kunci lookup tidak seragam: ada `symbol` polos (BTC), prefix (`IDX:BBCA`, `NASDAQ:AAPL`), dan pair (`BTC/USDT`). Salah kunci -> harga kosong/undefined. Lihat pola lookup yang sudah dipakai `CmcMarketDashboard.jsx:483`.
- Nilai `null` mungkin ada (`toNumberOrNull` di `marketOverview.js:427`) -> wajib guard sebelum `toFixed` (bandingkan pola aman `LandingPage.jsx:161` yang bungkus dengan `Number(...)`).
- Dua konvensi loop (3x/-33.333% vs 2x/-50%) rawan salah pasang saat komponen dipakai di dua tempat.
- Menambah marquee kedua di halaman yang sama bisa memicu biaya animasi ganda; jangan pasang dua ticker berjalan bersamaan di Home.
- `prefers-reduced-motion` wajib: kalau selector komponen baru tidak didaftarkan di `index.css:1795-1803`, animasi tetap jalan untuk user yang minta gerak minimal.
- Komponen `LandingPage` di-lazy-load (`App.jsx:40`); menambah prop tidak masalah, tapi jangan tambah fetch baru di sana.

## 6. Belum dicek

- Apakah DXY / indeks global sudah ada sebagai entri `livePrices` (tag `market` apa) — BELUM DICEK.
- Bentuk pasti field `data?.ai_agent_arena` untuk badge sinyal Arena — BELUM DICEK.
- Isi lengkap `CmcMarketDashboard.jsx` (789 baris) di luar hasil grep — BELUM DICEK, hanya grep yang dipakai.
- Apakah ada ticker di header/nav global di luar `BloombergNewsWire` — BELUM DICEK.
- Jumlah nyata entri `livePrices` saat runtime dan biaya render — BELUM DICEK (butuh menjalankan app).
- Test yang menyentuh ticker: `frontend/src/components/__tests__/LandingPage.test.jsx:57,141` ada, tapi assertion-nya terhadap ticker — BELUM DICEK.
