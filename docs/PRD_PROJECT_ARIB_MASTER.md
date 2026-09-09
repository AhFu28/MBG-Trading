# MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD)
## PROJECT ARIB — Institutional Cross-Asset & Macroeconomic Intelligence Terminal

**Document Identifier:** `ARIB-PRD-MASTER-END-TO-END-V1.0`  
**Classification:** Product Architecture & Full-Stack System Specification  
**Governing Standard:** Institutional Cross-Asset Standard · Zero-API-Cost Architecture  
**Target Environments:** Next.js 16 (App Router) · Vercel / Node.js Standalone · Bun Runtime  
**Document Status:** Approved for Review & Engineering Handover  
**Effective Date:** 2026-09-09  

---

## 1. Executive Summary & Visi Produk

### 1.1 Latar Belakang & Problem Statement
Dalam industri trading modern, pergerakan harga aset finansial (saham, kripto, forex, dan komoditas) didikte oleh dinamika makroekonomi global (kebijakan The Fed, inflasi CPI, data ketenagakerjaan, perang dagang, dan yield obligasi pemerintah). 

Namun, terdapat tiga masalah mendasar yang dihadapi trader retail hingga semi-institusi:
1. **Fragmentasi Data**: Trader terpaksa membuka 5-10 tab browser terpisah (ForexFactory untuk kalender, TradingView untuk chart, Yahoo Finance untuk saham global, CoinGecko untuk kripto, dan portal berita finansial).
2. **Kesenjangan Analisis Makro (Macro Literacy Gap)**: Kalender ekonomi tradisional hanya menyajikan angka statistik mentah (misal: *"US Core CPI MoM 0.3% vs Exp 0.2%"*) tanpa memberikan penjelasan gamblang mengenai apa dampaknya terhadap instrumen riil (misal: apa efeknya ke IHSG, Gold, Bitcoin, atau Dollar).
3. **Biaya Terminal Institusional yang Eksorbitan**: Terminal seperti Bloomberg Professional Service ($2.500/bulan) atau Refinitiv Eikon berada di luar jangkauan trader mandiri atau tim quant independen.

### 1.2 Visi & Nilai Inti Project ARIB
**Project ARIB** adalah **One-Stop Trading Intelligence Terminal** yang mengintegrasikan data pasar multi-regional, kalender ekonomi, yield obligasi, dan quant screener dalam satu antarmuka terpadu, berkecepatan tinggi, dan **100% Zero-API-Cost**.

Diferensiasi utama Project ARIB terletak pada:
* **Deterministic Impact Analysis Engine**: Pemetaan matematis dan logis 28 event ekonomi makro langsung ke 4 kelas aset (Forex, Equities, ETF, Crypto).
* **Edukasi "Bahasa Bayi" (Layman Explanations)**: Setiap event ekonomi dan analisis dampak dilengkapi analogi sederhana dan tip pemula agar dapat dipahami dalam hitungan detik.
* **Quant Backtest & Correlation Suite**: Dilengkapi perhitungan korelasi Pearson antar-aset dan backtest pergerakan harga historis pasca rilis berita ekonomi.
* **Integrasi Pasar Domestik & Global**: Menyajikan emiten blue chip BEI (BBCA, BBRI, BMRI, TLKM, ASII, GOTO) berdampingan dengan saham global Wall Street, Asia-Pasifik, dan pasar obligasi.

---

## 2. User Personas & End-to-End User Journey

### 2.1 Profil Pengguna Target
1. **The Macro & Swing Trader**:
   * Memerlukan pemantauan yield obligasi US (`^TNX`), pergerakan DXY, emas, minyak mentah, dan dampaknya terhadap saham/kripto secara real-time.
   * Menggunakan matriks korelasi Pearson untuk mengidentifikasi diversifikasi portofolio.
2. **The Retail / Beginner Trader**:
   * Membutuhkan bimbingan saat rilis berita berdampak besar.
   * Sangat terbantu oleh fitur *Inline Deep-Dive Accordion* yang menjelaskan *"Apa itu?", "Kenapa penting?", "Dampak ke apa?"*, dan *"Tips Pemula"*.
3. **The Multi-Asset Portfolio Investor**:
   * Memegang aset di pasar saham lokal (IDX), saham luar negeri (US/Asia), dan kripto.
   * Menggunakan modul portofolio lokal terenkripsi untuk tracking PnL, alokasi sektor, dan ekspor CSV.
4. **The Day Trader / Power-User**:
   * Mengutamakan kecepatan navigasi keyboard (`Ctrl+K` command palette, hotkey 1-5, r, t, f).
   * Membutuhkan audio alerts sintetis saat pasar menyentuh target harga atau saat event berdampak tinggi akan rilis.

### 2.2 End-to-End User Flow
```
[User Membuka Web Project ARIB]
             │
             ▼
[Header & Ticker Tape Aktif] ──> Ticker Tape berjalan menampilkan 36 aset global (IDX, US, Kripto, Forex)
             │
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PILIHAN TAB UTAMA                                                      │
├──────────────────┬──────────────────┬──────────────────┬───────────────┤
│ 1. DASHBOARD     │ 2. CALENDAR      │ 3. MARKETS       │ 4. IMPACT     │
│  - Stat Cards    │  - Filter Impact │  - 14 Tab Pasar  │  - 28 Event   │
│  - Heatmap       │  - Inline Deep-  │  - Bonds & Yield │  - Grid Aset  │
│  - Fear & Greed  │    Dive Accordion│  - Regional Logo │  - Layman Exp │
│  - Session Clock │  - Countdown     │  - TV Charts     │  - Duration   │
│  - Correlation   │  - Push Alert    │  - Converter 56x │               │
└──────────────────┴──────────────────┴──────────────────┴───────────────┘
             │
             ▼
[Interaksi Power-User]: Tekan `Ctrl+K` ──> Cari Aset / Pindah Tab / Filter
             │
             ▼
[Analisis Mendalam]: Pilih Event ──> Jalankan Backtest Historis 2 Tahun
             │
             ▼
[Eksekusi Mandiri / Pencatatan]: Masukkan Posisi ke Portfolio Tracker ──> Export CSV
```

---

## 3. Arsitektur Sistem & Data Pipeline

### 3.1 Diagram Arsitektur Komponen

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA INGESTION LAYER                            │
│  (100% Zero-API-Key Public Endpoints + CDN Caching)                    │
├───────────────────────┬────────────────────────┬───────────────────────┤
│ Frankfurter API (ECB) │ Yahoo Finance Query v8 │ TradingView CDN & Lib │
│  - Forex Live Rates   │  - Stocks, Bonds, ETF  │  - Symbol Logo CDN    │
│  - 12 Major Pairs     │  - Crypto & Commodity  │  - Interactive Charts │
│  - Zero Authentication│  - Historical OHLCV    │  - Ticker Tape Embed  │
└───────────────────────┴────────────────────────┴───────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS 16 API ROUTE HANDLERS                      │
│                (Edge & Node Runtime in `/src/app/api/...`)             │
├────────────────────────────────────────────────────────────────────────┤
│ • In-Memory Request Deduplication & TTL Cache Store (Anti 429 Shield)  │
│ • Quant Math Engine: Pearson Correlation Coefficient Evaluator         │
│ • Technical Indicator Engine: RSI(14), SMA(20/50), MACD(12,26,9)       │
│ • Macro Impact Evaluator (`src/lib/impact-engine.ts`)                   │
│ • Historical Event Backtest Evaluator (T-1, T+1, T+5 Return Analysis)  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       CLIENT PRESENTATION LAYER                        │
│             (Next.js 16 App Router + Tailwind v4 + Radix UI)           │
├────────────────────────────────────────────────────────────────────────┤
│ • Global State & Context: i18n Provider (EN/ID/ZH/KO), Theme Engine    │
│ • Audio Engine: Web Audio API Synthesizer (Zero MP3 Assets)            │
│ • Notification Engine: Browser Push Web Notifications API              │
│ • Persistence Store: LocalStorage Client Vault (Watchlist, Portfolio)  │
│ • UI Components: shadcn/ui (Dialog, Accordion, Sheet, Command, Table)  │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Strategi Caching & Ketahanan Data (Fault Tolerance)
1. **In-Memory TTL Map**: Disimpan pada memori runtime server Next.js untuk mencegah pemblokiran IP oleh Yahoo Finance / Frankfurter:
   * *Market Quotes*: Cache 60 detik.
   * *Signals & Technical Screener*: Cache 5 menit.
   * *Correlation Matrix*: Cache 15 menit.
   * *Event Backtesting*: Cache 30 menit.
2. **Request Deduplication**: Jika terdapat 10 request bersamaan untuk simbol yang sama, hanya 1 request keluar yang dieksekusi; 9 lainnya menunggu promise resolver yang sama.
3. **Graceful Fallback**: Jika endpoint Frankfurter tidak merespons, sistem otomatis mengalihkan permintaan ke `open.er-api.com`. Jika Yahoo Finance rate-limited, data terakhir yang tersimpan di cache tetap disajikan dengan header status `stale`.

---

## 4. Spesifikasi Fungsional Detail (15 Modul Inti)

### Modul 1: Deterministic Impact Analysis Engine (`src/lib/impact-engine.ts`)
* **Cakupan Event**: Memetakan **28 event ekonomi global**:
  1. FOMC Interest Rate Decision
  2. US Non-Farm Payrolls (NFP)
  3. US Consumer Price Index (CPI)
  4. US Gross Domestic Product (GDP)
  5. Retail Sales
  6. Producer Price Index (PPI)
  7. ISM Manufacturing PMI
  8. ISM Services PMI
  9. Core PCE Price Index
  10. Initial Jobless Claims
  11. Consumer Sentiment (Univ of Michigan)
  12. Fed Chair Press Conference
  13. ECB Interest Rate Decision
  14. Bank of Japan (BoJ) Rate Decision
  15. Bank of England (BoE) Rate Decision
  16. OPEC+ Production Meeting
  17. EIA Crude Oil Inventory
  18. US Presidential Election / Geopolitical Transition
  19. US Trade Balance / Tariffs Policy
  20. China Manufacturing PMI
  21. Indonesia Bank Indonesia (BI) 7-Day Reverse Repo Rate
  22. Indonesia Inflation CPI
  23. US Treasury 10Y Yield Spike
  24. Geopolitical Escalation (Middle East / Taiwan)
  25. Global Supply Chain Disruption
  26. Sovereign Credit Rating Upgrade/Downgrade
  27. Corporate Earnings Super-Week (Mega-Cap Tech)
  28. Crypto Regulatory Action (SEC / Global Bans)
* **Atribut Analisis Tiap Event**:
  * `category`: Central Bank, Inflation, Employment, Growth, Commodities, Geopolitics.
  * `forex`, `stocks`, `etf`, `crypto`: Masing-masing memuat `affected` (boolean), `overall` (high/medium/low), `direction` (bullish/bearish/volatile/neutral), `summary`, dan daftar `items` (simbol aset terdampak dan catatan teknikal).
  * `simpleExplanation`: Penjelasan konsep dalam bahasa sehari-hari ("Bahasa Bayi").
  * `beginnerTip`: Rekomendasi tindakan taktis bagi trader pemula.
  * `typicalDuration`: Jangka waktu reaksi harga (misal: "1-4 jam untuk forex, 1-3 hari untuk saham").
  * `historicalNote`: Preseden historis konkret di masa lampau.

### Modul 2: Economic Calendar & Deep-Dive Engine (`src/lib/economic-calendar.ts`)
* **Spesifikasi**:
  * 22 template siklus makro berulang dengan generator tanggal dinamis.
  * Filter multi-kategori: All Impact, High Impact Only, Medium, Low.
  * Fitur pencarian instan nama event atau kode negara (US, EU, UK, JP, CN, ID, dll.).
  * **Inline Deep-Dive Accordion**: Ketika event diklik, panel accordion terbuka mulus di bawah baris tabel tanpa me-reload halaman, menampilkan 6 seksi edukatif:
    1. *Definisi & Konsep ("Apa itu?")*
    2. *Alasan Pengaruh ke Pasar ("Kenapa penting?")*
    3. *Matriks Dampak Lintas Aset (Forex, Saham, ETF, Kripto)*
    4. *Tingkat Keparahan / Volatilitas*
    5. *Panduan Membaca Forecast vs Actual*
    6. *Tips Manajemen Risiko Pemula*.

### Modul 3: Global Multi-Regional Market Tracker (`src/components/trading/markets-section.tsx`)
* **14 Tab Navigasi Terstruktur**:
  1. `Global`: Tampilan menyeluruh 10 regional sekaligus.
  2. `Forex`: 12 Pasang mata uang dunia (EUR/USD, USD/JPY, GBP/USD, AUD/USD, USD/CAD, USD/CHF, NZD/USD, EUR/GBP, EUR/JPY, GBP/JPY, USD/CNY, XAU/USD).
  3. `Stocks & Indices`: Indeks utama US (S&P 500, Nasdaq, Dow Jones, Russell 2000) dan saham Big Tech (Apple, Microsoft, NVIDIA, Amazon, Alphabet, Meta, Tesla).
  4. `ETFs`: SPY, QQQ, DIA, IWM, VOO, SOXX, ARKK.
  5. `Crypto`: Bitcoin (BTC), Ethereum (ETH), Solana (SOL), Binance Coin (BNB), Ripple (XRP), Cardano (ADA), Dogecoin (DOGE).
  6. `Bonds`: Yield US Treasury (3M `^IRX`, 5Y `^FVX`, 10Y `^TNX`, 30Y `^TYX`), US Bond Futures (`ZN=F`, `ZB=F`), Global Sovereign Yields (Jerman, Prancis, Inggris, Jepang, Korea, China, Indonesia), serta Bond ETF (`TLT`, `BNDX`, `EMB`).
  7. 🇮🇩 `Indonesia`: Saham kapitalisasi besar BEI: `BBCA.JK`, `BBRI.JK`, `BMRI.JK`, `TLKM.JK`, `ASII.JK`, `UNVR.JK`, `GOTO.JK`, `ICBP.JK` lengkap dalam denominasi Rupiah (IDR).
  8. 🇰🇷 `Korea`: Samsung Electronics (`005930.KS`), SK Hynix, NAVER, Hyundai.
  9. 🇸🇬 `Singapore`: DBS Group (`D05.SI`), UOB, Singtel, OCBC.
  10. 🇯🇵 `Japan`: Toyota Motor (`7203.T`), Sony, SoftBank, Keyence.
  11. 🇭🇰 `Hong Kong`: Tencent (`0700.HK`), Alibaba, Meituan, AIA Group.
  12. 🇨🇳 `China`: Kweichow Moutai (`600519.SS`), Ping An Insurance, BYD.
  13. 🇮🇳 `India`: Reliance Industries (`RELIANCE.NS`), TCS, Infosys, HDFC Bank.
  14. 🌏 `ASEAN & Oceania`: PTT Thailand (`PTT.BK`), Maybank Malaysia (`1023.KL`), BHP Group Australia (`BHP.AX`).
  15. 🇪🇺 `Europe`: SAP Germany (`SAP.DE`), Siemens, ASML Netherlands, HSBC UK.
* **Logo Resolver Engine**: Mengonversi kode bursa lokal ke TradingView CDN asset:
  * `BBCA.JK` $\to$ `IDX:BBCA` $\to$ `https://s3-symbol-logo.tradingview.com/jkt-bbca.png`
  * Dilengkapi penanganan fallback ke avatar inisial berwarna jika logo belum tersedia.

### Modul 4: Technical Analysis & Quant Signals Screener (`/api/signals`)
* **Perhitungan Algoritmik**:
  * **RSI(14)**: Identifikasi area kejenuhan pasar (Oversold $<30$, Overbought $>70$).
  * **Moving Average Convergence**: Trend tracking SMA(20) vs SMA(50). Sinyal Golden Cross saat SMA20 memotong ke atas SMA50.
  * **MACD Indicator**: Kalkulasi garis MACD (12, 26) dan Signal Line (9) beserta visualisasi histogram.
* **Sinyal Komposit**: Mengagregasikan metrik menjadi rekomendasi visual: *STRONG BUY, BUY, NEUTRAL, SELL, STRONG SELL* disertai skor numerik.

### Modul 5: Cross-Asset Pearson Correlation Matrix (`/api/correlation`)
* **Rumus Matematis**:
  Mengukur derajat asosiasi linier antara persentase return harian dua aset ($X$ dan $Y$):
  $$r_{XY} = \frac{\sum_{i=1}^{n} (X_i - \bar{X})(Y_i - \bar{Y})}{\sqrt{\sum_{i=1}^{n} (X_i - \bar{X})^2 \sum_{i=1}^{n} (Y_i - \bar{Y})^2}}$$
* **10 Aset Acuan**: SPY, QQQ, BTC-USD, ETH-USD, EURUSD=X, Gold Futures (`GC=F`), Oil Fund (`USO`), US 20Y Bond ETF (`TLT`), Volatility Index (`^VIX`), US Dollar Index (`DX-Y.NYB`).
* **Jendela Waktu**: Pilihan fleksibel 1 Bulan (1mo) atau 3 Bulan (3mo).
* **Interaktivitas Visual**: Matriks sel dengan warna dinamis (Hijau emerald pekat untuk korelasi positif $+1.0$, abu-abu netral untuk $0.0$, merah rose pekat untuk korelasi negatif $-1.0$).

### Modul 6: Event Backtest Simulator (`/api/backtest`)
* **Metodologi Simulasi**:
  * Pengguna memilih Event Makro (misal: *US CPI*) dan Aset Finansial (misal: *SPY* atau *BTC-USD*).
  * Backend memindai histori rilis 2 tahun terakhir.
  * Mengukur perubahan persentase harga pada tiga horizon:
    * $T_{-1}$: Harga penutupan 1 hari sebelum rilis.
    * $T_{+1}$: Harga penutupan 1 hari setelah rilis.
    * $T_{+5}$: Harga penutupan 5 hari setelah rilis.
  * **Output Kuantitatif**: Rata-rata return %, tingkat kemenangan (*Win Rate %*), volatilitas rata-rata, dan tabel detail per tanggal kejadian.

### Modul 7: Simulated Order Book & Market Depth (`order-book.tsx`)
* **Spesifikasi**:
  * Mensimulasikan visualisasi kedalaman pasar institusi (Level 2 Order Book) untuk instrumen pilihan.
  * Menampilkan bar volume kumulatif bid (hijau) dan ask (merah), spread harga real-time, dan rasio dominasi pembeli vs penjual (*Buyer/Seller Power Ratio*).

### Modul 8: Portfolio Tracker & Performance Attribution (`portfolio-tracker.tsx`)
* **Fitur & Kapabilitas**:
  * Input manual posisi trading: Simbol, Kelas Aset, Jumlah Unit/Lot, Harga Masuk (*Average Buy Price*).
  * Kalkulasi metrik otomatis: *Total Portfolio Value, Total Invested Capital, Unrealized PnL (Nominal & %), Today's PnL*.
  * **Attribution Breakdown**: Visualisasi alokasi modal per kelas aset (Saham, Kripto, Forex, ETF) dan per sektor industri.
  * **Export Utility**: Download laporan posisi portofolio dalam format CSV dan JSON dengan satu klik.
  * **Keamanan Privasi**: Penyimpanan 100% pada `localStorage` browser pengguna (tanpa risiko kebocoran data portofolio ke server pihak ketiga).

### Modul 9: Sentiment Gauge & Market Heatmap
* **Fear & Greed Speedometer (`fear-greed-gauge.tsx`)**: Menampilkan sentimen pasar harian dari 0 (Extreme Fear) hingga 100 (Extreme Greed).
* **Market Heatmap Grid (`market-heatmap.tsx`)**: Tampilan grid blok proporsional yang merepresentasikan pergerakan harga saham dan aset kripto hari ini dengan pewarnaan emerald/rose.

### Modul 10: Session Timeline & Market Countdown (`session-timeline.tsx`)
* **Visualisasi Jam Bursa Global**:
  * Melacak status operasional bursa dunia: **Tokyo (TSE)**, **London (LSE)**, **New York (NYSE/NASDAQ)**, dan **Jakarta (IDX)**.
  * Menampilkan jam lokal, indikator status (Open/Closed), dan hitung mundur (*countdown timer*) waktu menuju sesi buka atau tutup berikutnya.

### Modul 11: Multi-Currency Converter (`currency-converter.tsx`)
* **Cakupan Mata Uang (56 Simbol)**:
  * Mata Uang Utama: USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD.
  * Mata Uang Asia: IDR, KRW, SGD, CNY, HKD, TWD, THB, MYR, PHP, VND, INR, PKR, BDT.
  * Timur Tengah & Afrika: AED, SAR, QAR, TRY, ILS, ZAR, EGP, NGN.
  * Amerika Latin & Eropa Timur: MXN, BRL, ARS, CLP, COP, SEK, NOK, DKK, PLN, CZK, HUF, RUB.
  * Kripto Utama: BTC, ETH, SOL, XRP, ADA, DOGE.
* **Fitur**: Pencarian cepat, swap tombol instan, kalkulasi live rate otomatis.

### Modul 12: Audio FX & Browser Notification Alerts (`src/lib/alert-sound.ts`)
* **Synthesizer Web Audio API**: Menghasilkan suara peringatan teknikal tanpa membutuhkan asset eksternal `.mp3` atau `.wav`. Menggunakan osilator frekuensi ganda (880Hz & 1320Hz) yang jernih dan profesional.
* **Push Notification Scheduler**: Notifikasi pop-up desktop via Web Notifications API untuk mengingatkan pengguna 15 menit sebelum event makro berdampak tinggi dirilis.

### Modul 13: TradingView Widgets Suite & Fullscreen Maximizer (`tradingview-widgets.tsx`)
* **Koleksi Widget Terintegrasi**:
  * Ticker Tape Banner di bagian atas dashboard.
  * Advanced Real-time Candlestick Chart dengan indikator teknikal lengkap.
  * Mini Symbol Overview & Stock Screener.
  * Technical Analysis Summary Speedometer.
  * Market Stories Timeline Feed.
* **Maximizable Widget Wrapper**: Setiap widget dilengkapi tombol expand untuk membuka modal fullscreen (95vw x 95vh) berlatar belakang gelap (`#0D1117`) tanpa terdistorsi.

### Modul 14: Power-User Command Palette & Shortcuts (`command-palette.tsx`)
* **Global Command Palette (`Ctrl+K` / `Cmd+K`)**:
  * Pencarian instan seluruh instrumen finansial.
  * Navigasi kilat antar tab dashboard.
  * Toggle tema dan peralihan bahasa.
* **Keyboard Shortcuts Bus**:
  * `1` s/d `5`: Akses langsung tab Dashboard, Calendar, Markets, Impact, News.
  * `t`: Toggle tema gelap / terang.
  * `r`: Manual refresh API cache.
  * `f`: Fullscreen chart mode.
  * `?`: Menampilkan modal panduan pintasan keyboard.

### Modul 15: Multi-Language Internationalization (`src/lib/i18n.ts`)
* **Dukungan Bahasa Penuh**:
  * 🇬🇧 English
  * 🇮🇩 Bahasa Indonesia
  * 🇨🇳 中文 (Mandarin Simplified)
  * 🇰🇷 한국어 (Korean)
* Mencakup seluruh navigasi, label metrik keuangan, nama instrumen, dan deskripsi brand.

---

## 5. Katalog Lengkap API Endpoints Internal

Seluruh API route diimplementasikan pada direktori Next.js App Router (`src/app/api/...`):

| Endpoint Path | HTTP Method | Query Parameters | Response Data & Deskripsi | TTL Cache |
| :--- | :---: | :--- | :--- | :---: |
| `/api/markets/indonesia` | GET | `-` | Quotes 8 saham BEI (BBCA, BBRI, BMRI, TLKM, ASII, UNVR, GOTO, ICBP) dalam IDR | 60s |
| `/api/markets/bonds` | GET | `-` | Yield US Treasury 3M, 5Y, 10Y, 30Y, Yield global, dan Bond ETF | 60s |
| `/api/markets/forex` | GET | `-` | Live rate 12 pasang mata uang utama dunia (Frankfurter API) | 60s |
| `/api/markets/forex-extended` | GET | `-` | Live rate mata uang extended dunia termasuk IDR cross-rates | 60s |
| `/api/markets/stocks` | GET | `-` | Quotes indeks Wall Street & Big Tech mega-caps | 60s |
| `/api/markets/crypto` | GET | `-` | Quotes top spot crypto (BTC, ETH, SOL, BNB, XRP, ADA, DOGE) | 60s |
| `/api/markets/etf` | GET | `-` | Quotes ETF utama (SPY, QQQ, DIA, IWM, VOO, SOXX, ARKK) | 60s |
| `/api/markets/korea` | GET | `-` | Quotes saham Samsung, SK Hynix, NAVER dalam KRW | 60s |
| `/api/markets/japan` | GET | `-` | Quotes saham Toyota, Sony, SoftBank dalam JPY | 60s |
| `/api/markets/singapore` | GET | `-` | Quotes saham DBS, UOB, Singtel dalam SGD | 60s |
| `/api/markets/hongkong` | GET | `-` | Quotes saham Tencent, Alibaba, Meituan dalam HKD | 60s |
| `/api/markets/china` | GET | `-` | Quotes saham Moutai, Ping An dalam CNY | 60s |
| `/api/markets/india` | GET | `-` | Quotes saham Reliance, TCS, Infosys dalam INR | 60s |
| `/api/markets/asean` | GET | `-` | Quotes saham unggulan Thailand, Malaysia, Australia | 60s |
| `/api/markets/europe` | GET | `-` | Quotes saham SAP, Siemens, ASML, HSBC dalam EUR/GBP | 60s |
| `/api/economic-calendar` | GET | `limit, impact` | Daftar jadwal rilis ekonomi terstruktur dan konsensus | 300s |
| `/api/impact` | GET | `eventId` | Output komprehensif Impact Engine untuk event tertentu | 600s |
| `/api/correlation` | GET | `range=1mo\|3mo` | Matriks korelasi Pearson 10 aset acuan | 900s |
| `/api/signals` | GET | `-` | Sinyal kuantitatif komposit (RSI, SMA cross, MACD) | 300s |
| `/api/technical-analysis`| GET | `symbol` | Data indikator teknikal mendalam 1 aset spesifik | 300s |
| `/api/backtest` | GET | `eventId, symbol, lookback` | Simulasi performa harga historis T-1, T+1, T+5 | 1800s |
| `/api/orderbook` | GET | `symbol` | Level 2 Order Book sintetis (kedalaman bid/ask) | 15s |
| `/api/portfolio-history` | GET | `symbols, timeframe` | Histori nilai aset portofolio untuk chart akumulasi | 300s |
| `/api/sparkline` | GET | `symbols` | Array mini harga 7 hari untuk chart mini sparkline | 300s |
| `/api/sentiment` | GET | `-` | Skor sentimen pasar gabungan dan Fear & Greed index | 600s |
| `/api/news` | GET | `category` | Feed berita pasar terkini dengan tagging sentimen | 300s |
| `/api/quote` | GET | `symbol` | Live quote satuan untuk aset apa pun di dunia | 60s |

---

## 6. UI/UX Design System & Theme Specification

### 6.1 Color Palette
* **Deep Institutional Slate (Background Utama)**: `#0D1117`
* **Card & Container Surface**: `#161B22`
* **Subtle Structural Border**: `#30363D`
* **Bullish Green / Positive Yield**: `#10B981` (`emerald-500`)
* **Bearish Red / Negative Yield**: `#F43F5E` (`rose-500`)
* **Alert & Warning Amber**: `#F59E0B` (`amber-500`)
* **Neutral Slate Text**: `#94A3B8` (Secondary), `#F8FAFC` (Primary White)

### 6.2 Typography & Component Principles
* **Font**: Monospace numerik untuk angka harga (`font-mono` tabular figures) agar digit tidak melompat saat data ter-refresh.
* **Component Kit**: Ditenagai oleh **shadcn/ui** berbasis Radix UI Primitives (Accordion, Dialog, Select, Dropdown, Table, Sheet, Sonner toast).

---

## 7. Panduan Instalasi, Setup & Deployment

### 7.1 Ekstraksi Berkas Proyek
File arsip Project ARIB berada di:
`"C:\Users\ASUS\Documents\Project anti gravitasi\mbg TRADING\another project\workspace-a06a10fe-6053-422d-8978-e162f9d1f17d.tar"`

Perintah ekstraksi via PowerShell:
```powershell
# Buat direktori kerja baru
mkdir "C:\Users\ASUS\Documents\Project anti gravitasi\mbg TRADING\project-arib"
cd "C:\Users\ASUS\Documents\Project anti gravitasi\mbg TRADING\project-arib"

# Ekstrak seluruh berkas
tar -xf "..\another project\workspace-a06a10fe-6053-422d-8978-e162f9d1f17d.tar"
```

### 7.2 Menjalankan di Lingkungan Lokal
Mendukung runtime **Node.js (v20+)** atau **Bun**:

```bash
# Opsi 1: Menggunakan NPM
npm install
npm run dev

# Opsi 2: Menggunakan Bun (Sangat Cepat)
bun install
bun dev
```
Buka `http://localhost:3000` pada peramban web. Seluruh 28 endpoint API dan data live langsung aktif.

### 7.3 Build & Deployment Production
Proyek sudah siap untuk di-deploy ke **Vercel** atau server privat **Docker / Standalone Node.js**:
```bash
# Build production bundle
npm run build

# Menjalankan server standalone
npm run start
```

---

## 8. Rekomendasi Roadmap Pengembangan Berikutnya

1. **Integrasi Bot Telegram**: Mengirimkan notifikasi flash alert saat Impact Engine mendeteksi rilis data berkategori HIGH (misal: FOMC rilis 15 menit lagi).
2. **Koneksi Database Cloud (Supabase / PostgreSQL)**: Memindahkan penyimpanan portofolio dari `localStorage` ke Supabase agar dapat disinkronkan antar-perangkat (desktop & smartphone).
3. **Penyatuan dengan Algoritma Astra MBG**: Memasukkan modul kalkulator lot risiko `(Modal × Risk %) ÷ (Entry - SL)` dan skrining konglomerasi BEI ke dalam tab pasar Indonesia Project ARIB.
