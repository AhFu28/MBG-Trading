# 01 — Data Realtime di Lapisan Frontend

> Audit Integritas & Provenance Data — MBG Trading
> Tanggal audit: **2026-10-08 19:35 – 2026-10-09 06:00 WIB** (UTC+7). t0 pengukuran usia = `2026-10-08T19:35:17+07:00`.
> 
> Metode: pembacaan kode langsung + perintah pengukuran + riwayat git. Setiap klaim punya bukti `path:line` atau perintah.
> Catatan proses: delegasi ke model alternatif (`nvidia/*`) gagal — route tersebut tidak mengeksekusi tool di sesi ini (probe menulis file tidak menghasilkan file). Teammate Agent Teams juga berhenti tanpa menulis laporan. Karena itu **audit diselesaikan langsung oleh Lead**; bukti mentah ada di `00_LEAD_VERIFIKASI.md`.


## 1. Ringkasan eksekutif

Hanya **dua** jalur di frontend yang benar-benar REALTIME: WebSocket mini-ticker Binance (`useLivePrices.js:564`) dan WebSocket mempool Bitcoin (`WhaleIntelligenceTab.jsx:744`). Sisanya adalah polling 1,5–45 detik, atau **data yang dibangkitkan/di-hardcode tetapi tampil seperti data pasar**. Titik terlemah: saat bursa tutup, scheduler IDX/US/FX/komoditas **berhenti total** (`useLivePrices.js:674-686`) sehingga UI menampilkan harga terakhir dari sesi sebelumnya tanpa penanda "bekas" yang memadai.

## 2. Tabel klasifikasi

| Stream/Dataset | Sumber & endpoint | Mekanisme | Cadence nyata + bukti | Usia saat audit | Label | Bukti |
|---|---|---|---|---|---|---|
| Crypto spot (700+ pasangan) | `wss://data-stream.binance.vision/ws/!miniTicker@arr` | WebSocket push, reconnect 4 s | Sub-detik, kontinu | Live | **REALTIME** | useLivePrices.js:564, 638 |
| Crypto 24h summary | `data-api.binance.vision/api/v3/ticker/24hr` | Poll | 45.000 ms | < 1 mnt | **NEAR-REALTIME** | useLivePrices.js:302, 671 |
| Crypto futures desk | Binance Vision WS + REST top-up | WS + poll | WS live; 20 s; 30 s | Live | **REALTIME / NEAR-REALTIME** | CryptoFuturesTab.jsx:330, 180, 366 |
| IDX, US, Forex, Komoditas | `/api/scanner` → `scanner.tradingview.com/<market>/scan` | Poll proxy + edge cache | 12.000 ms, **hanya bila pasar buka** | ≤12 s saat buka; saat tutup = harga sesi terakhir | **NEAR-REALTIME (buka) / BEKAS (tutup)** | useLivePrices.js:57, 674-686; scanner.js:120,144 |
| Hyperliquid L2 | Hyperliquid API | Poll | 1.500 ms (book), 30.000 ms (ctx) | ~1,5 s | **NEAR-REALTIME** | HyperliquidProDesk.jsx:176, 182 |
| Bitcoin mempool (recent) | `mempool.space/api/mempool/recent` + WS | Poll + WS | 12.000 ms | ~12 s | **NEAR-REALTIME** | WhaleIntelligenceTab.jsx:679, 734, 744 |
| "Mega whale" tape | Generator internal `Math.random()` | Dibangkitkan | Sintetis | Tidak ada | **SINTETIK** (dilabeli "SIMULATED WHALE FEED (DEMO)") | WhaleIntelligenceTab.jsx:407-582, 936 |
| Order book crypto | Binance depth API | Fetch saat dibuka | On-demand/auto | ~1 s | **NEAR-REALTIME** | OrderBookSimulator.jsx:115, 148 |
| Order book IDX + broker summary | Depth dibangkitkan dari last price + daftar broker hardcoded | Dibangkitkan | Sintetis | Tidak ada | **SINTETIK / STATIS** — klaim "100% Real Data Pipeline" menyesatkan | OrderBookSimulator.jsx:5, 203-214, 271-286 |
| Global metrics (mcap, dominasi) | CMC langsung (CORS gagal) → CoinGecko | Poll | On-mount/periodik | ~1-2 mnt (sumber) | **PERIODIK-CEPAT** | marketOverview.js:126-156 |
| Memecoin radar | CoinGecko/Binance | Poll | 45.000 ms | ≤45 s | **NEAR-REALTIME** | MemecoinRadar.jsx:93 |
| Degen desk | — | Poll | 30.000 ms | ≤30 s | **NEAR-REALTIME** (dengan label DEMO) | DegenDesk.jsx:70, 319 |
| News & sentimen | Bundle engine + publish time item | Bundle | Ikut bundle | Ikut usia bundle | **PERIODIK-JADWAL** | NewsTab.jsx:717; newsHelpers.js:272 |
| Arena / AI syndicate | `/api/arena-state` | Commit akhir sesi | ~4×/hari | ~72 mnt | **PERIODIK-JADWAL** | DataIntegrityModal.jsx:58-71; arena_247_engine.yml:20 |
| Kurs USD/IDR di modal | Default `16350`, prop tidak dikirim App.jsx | Statis | Tidak ada | Selamanya | **STATIS** (dilabeli "VERIFIED") | DataIntegrityModal.jsx:14-15, 192-195; App.jsx:1248-1258 |

## 3. Temuan penting

1. **Scheduler berhenti saat pasar tutup.** `useLivePrices.js:674-686` hanya memanggil `fetchIdxQuotes`/`fetchUsQuotes`/`fetchForexQuotes` bila `isIdxMarketOpen`/`isUsMarketOpen`/`isForexCommodityOpen` benar. Tidak ada penanda visual "harga penutupan" yang diikat ke status ini di modal integritas — feed IDX selalu hijau "ACTIVE".
2. **Adaptive 12 detik hanya berlaku pada jam buka.** Di luar jam bursa, usia harga tumbuh tanpa batas sampai hari bursa berikutnya.
3. **Dua WebSocket nyata** memang realtime dan tidak digerbangi jam pasar (crypto 24/7) — ini bagian yang jujur.
4. **OrderBookSimulator**: untuk IDX, order book dihasilkan dari `currentPrice` dengan peluruhan eksponensial (`Math.exp(-0.08 * i)`) dan daftar broker (UBS, Mirae, Mandiri, dst.) ditulis hardcoded lalu diskalakan ke harga (`OrderBookSimulator.jsx:271-286`). Header file mengklaim "100% Real Data Pipeline". Prop `brokerSummaryData` ada (jalur nyata), tetapi fallback hardcoded tetap tampil bila prop kosong.
5. `WhaleIntelligenceTab` mencampur data nyata (mempool REST/WS) dengan tape sintetis. Label "SIMULATED WHALE FEED (DEMO)" di baris 936 sudah jujur, tetapi baris 1347 tetap menulis "REAL-TIME RADAR".

## 4. Belum terverifikasi

- Apakah di produksi `/api/scanner` selalu tersedia; bila 401 (tanpa sesi), `useLivePrices.js:66` jatuh ke TradingView langsung yang bisa diblokir CORS.
- Tingkat pembaruan efektif CoinGecko free tier saat rate-limit.

## 5. Log perintah audit

```powershell
Get-ChildItem -Recurse -File 'MBG-Trading/frontend/src' | ...
Select-String -Pattern 'setInterval\(|wss://|Math\.random' di frontend/src
Get-Item frontend/src/components/DataIntegrityModal.jsx | Select LastWriteTime
```
