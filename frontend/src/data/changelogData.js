// Master Changelog Data Registry (Official Documentation & Release History)

export const CHANGELOG_DATA = [
  {
    id: 'pkg-18092026-v41',
    version: 'Package 18092026',
    semanticVersion: 'v4.1.0',
    date: '18 September 2026',
    status: 'LATEST',
    statusColor: 'var(--accent-green)',
    badgeLabel: 'LATEST / ACTIVE HARI INI',
    title: 'Update Package 18092026 (v4.1 APEX): Tri-Signal Matrix Cockpit, US Stock Signals, Authentic Logos (IDX, Crypto, Wall St) & Laser-Aligned 6px Geometry',
    description: 'Penyempurnaan visual dan fungsional Cockpit Command Center: Memperluas radar sinyal Row 3 dari dual-box menjadi Tri-Signal Matrix (Saham IDX, Crypto Spot, dan US Stock Signals), integrasi logo/favicon resmi PT dan koin kripto di setiap baris ticker via Google Favicon CDN 64px & CoinCap/TradingView progressive waterfall, penstabilan layout dengan tableLayout fixed dan formatter desimal mikro, serta unifikasi presisi batas laser gap 6.0px terhadap Live News Wire.',
    processFlow: [
      { step: '1. Dual Cockpit Baseline', label: 'IDX & Crypto Only (17/09)' },
      { step: '2. Tri-Signal Architecture', label: 'Wall St US Signals Added (18/09)' },
      { step: '3. Authentic Logo CDN', label: 'Official PT & CoinCap Waterfall (18/09)' },
      { step: '4. Laser-Aligned 6px', label: 'Perfect Grid Geometry (18/09)' }
    ],
    markdownContent: `
### 🚀 Pembaruan Akbar v4.1 APEX (Highlights 18/09)
- **Tri-Signal Matrix 3-Pasar (Saham IDX, Crypto Spot, US Stocks):** Menambahkan kotak sinyal ketiga untuk saham bursa Wall Street Amerika Serikat (AAPL, NVDA, MSFT, META, GOOGL, AMD, TSLA, dll.) berdampingan simetris dengan Saham IDX dan Crypto Spot pada Row 3 Home Cockpit.
- **Logo Resmi Asli di Setiap Ticker (IDX, Kripto, Wall St):**
  - **Saham IDX:** Menampilkan favicon/logo resmi dari website masing-masing PT emiten (PT Petrindo Jaya Kreasi / CUAN, PT Petrosea / PTRO, PT Salim Ivomas Pratama / SIMP, PT Astra Graphia / ASGR, PT Supra Boga Lestari / RANC, PT Singaraja Putra / SINI, PT Jhonlin Agro Raya / JARR, dll.) melalui integrasi Google Favicon CDN 64px resolusi tinggi pada \`stock-icons.js\` dan \`AssetIcon.jsx\`.
  - **Crypto Spot:** Progressive CDN waterfall multi-tier (\`CoinCap 2x CDN\` $\\rightarrow$ \`TradingView SVG\` $\\rightarrow$ \`spothq CDN\` $\\rightarrow$ \`vector fallback\`) memastikan 100% token (termasuk PEPE, FET, NEAR, APT, BTC, ETH) memuat logo resmi asli tanpa error 404 atau pemblokiran CORS.
  - **US Stocks:** Logo korporat autentik untuk raksasa teknologi dan institusional Wall Street (Nvidia, Apple, Microsoft, Meta, Google, AMD, Tesla, Goldman Sachs).
- **Stabilisasi Grid & Anti-Overflow (\`tableLayout: 'fixed'\`):** Seluruh 3 tabel sinyal dikunci dengan \`tableLayout: fixed\` dan alokasi persentase kolom proporsional (28% Ticker, 22% Setup, 17% Entry, 16% SL, 17% TP1), mengeliminasi geseran layout (*layout shift*) saat angka harga berfluktuasi.
- **Formatter Harga Kripto Mikro (\`formatCryptoPrice\`):** Format angka dinamis yang menangani aset berdesimal banyak (seperti koin meme PEPE \`0.000004\`) sehingga tidak meregangkan kolom dan menjaga header TP1 tetap terlihat utuh.
- **Unifikasi Gap Laser-Aligned 6.0px:** Mengunci celah pembatas horizontal dan vertikal antar-kartu dan antar-baris tepat pada \`6.0px\`. Menyelaraskan batas kanan seluruh 4 baris Cockpit sejajar lurus tanpa celah berlebih terhadap Live News Wire Sidebar.
- **Sinkronisasi Baris Status Row 4:** Indikator instrumen diperbarui menjadi \`82 IDX · 10 CRYPTO · 31 US EQUITIES\` yang merefleksikan cakupan multiaset lengkap terminal.
    `.trim(),
    table: [
      { module: 'Tri-Signal Matrix', status: 'PROD', category: 'Cockpit / Signals', summary: '3 kotak sejajar: Saham IDX, Crypto Spot, dan US Stock Signals' },
      { module: 'US Stock Signals', status: 'PROD', category: 'US Equities', summary: 'Setup 31 saham Wall St (AAPL, NVDA, MSFT, META, dll.)' },
      { module: 'Official PT Favicon CDN', status: 'PROD', category: 'UI / Asset', summary: 'Logo resmi emiten BEI via Google Favicon CDN 64px' },
      { module: 'Crypto Progressive CDN', status: 'PROD', category: 'UI / Asset', summary: 'Multi-tier CoinCap 2x + TradingView + Spothq CDN waterfall' },
      { module: 'Fixed Table Geometry', status: 'PROD', category: 'UI / Layout', summary: 'tableLayout fixed 5 kolom stabil tanpa layout shift atau text clip' },
      { module: 'Crypto Micro Formatter', status: 'PROD', category: 'UI / Numbers', summary: 'formatCryptoPrice menjaga kejelasan desimal PEPE & altcoins' },
      { module: 'Laser-Aligned 6px Gaps', status: 'PROD', category: 'CSS / Grid', summary: 'Seluruh gap vertikal/horizontal rata sempurna 6.0px ke News Wire' },
      { module: 'Telemetry Strip Sync', status: 'PROD', category: 'Telemetry', summary: '82 IDX · 10 CRYPTO · 31 US EQUITIES status bar' }
    ]
  },
  {
    id: 'pkg-17092026-v4',
    version: 'Package 17092026',
    semanticVersion: 'v4.0.0',
    date: '17 September 2026',
    status: 'STABLE',
    statusColor: '#38bdf8',
    badgeLabel: 'STABLE',
    title: 'Update Package 17092026 (v4.0 APEX): Dual-Speed Reactive Quant Engine, Live Trailing Stop to BE, Zero-Cron Architecture & 100% Cloudflare Pages',
    description: 'Lompatan arsitektur terbesar v4.0 APEX: Mengubah sistem dari snapshot statis berbasis cron menjadi Dual-Speed Reactive Quant Platform. Menghadirkan Reactive Strategy Engine klien (dynamicStrategy.js), Dynamic Trailing Stop Loss ke Breakeven (BE 🛡️), eliminasi 100% scheduled cron jobs di GitHub Actions, pembersihan total artefak Vercel untuk standardisasi Cloudflare Pages murni, Multi-Chart Grid (2x2 / 1x2), Institutional Security Hub Drawer, Bloomberg v4.0 12-Stream News Intelligence, Market Heatmap Treemap, Authentic Brand Logos (IDX, US, Forex), Watcher Whale Radar (>100 BTC) dengan Audio Chime, dan Anti-Stale Cache-Busting.',
    processFlow: [
      { step: '1. Baseline & Cron', label: 'Static Snapshots (08-12/09)' },
      { step: '2. APEX v3.0', label: 'Whale, Futures & Forex (16/09)' },
      { step: '3. Zero-Cron Decouple', label: 'Eliminate Cron & Git Skip (17/09)' },
      { step: '4. APEX v4.0', label: 'Reactive Engine & Cloudflare (17/09)' }
    ],
    markdownContent: `
### 🚀 Pembaruan Akbar v4.0 APEX (Highlights 17/09)
- **Client-Side Reactive Strategy Engine (\`dynamicStrategy.js\`):** Mesin kuantitatif adaptif yang mengevaluasi sinyal trading plan secara seketika (< 1 detik via Binance WebSocket, 20 detik via TradingView Scanner) langsung di peramban pengguna. Menghadirkan State Machine Sinyal 7-fase (\`ENTRY_TRIGGER\`, \`IN_POSITION\`, \`TP1_HIT\`, \`TP2_HIT\`, \`EXTENDED / NO FOMO\`, \`STOPPED_OUT\`, \`WAITING_PULLBACK\`).
- **Dynamic Trailing Stop Loss ke Breakeven (BE 🛡️):** Perlindungan modal otomatis tingkat lanjut. Begitu harga live menyentuh Target 1 (TP1), level Stop Loss otomatis diratchet naik ke level Entry (*Risk-Free Trade*), mengunci modal pokok trader dari pembalikan harga mendadak.
- **Floating Risk/Reward & Live PnL:** Perhitungan dinamis rasio Risk-to-Reward aktual dan floating profit/loss secara instan mengikuti fluktuasi tick harga pasar.
- **100% Eliminasi Scheduled Cron Jobs di GitHub Actions:** Seluruh 6 workflow otomatisasi berkala (\`hourly_crypto_macro\`, \`intraday_idx_refresh\`, \`daily_idx_morning\`, \`midday_sesi1_recap\`, \`daily_idx_eod\`, \`evening_global_watch\`) telah dinonaktifkan dari jadwal cron otomatis dan dialihkan ke pemicu manual (*workflow_dispatch*). Menghilangkan ketergantungan pada bot git-commit \`[skip ci]\` yang sebelumnya membekukan deployment dan memicu konflik cache.
- **Pembersihan Total Artefak Vercel & Penyelarasan Cloudflare Pages Murni:** Menghapus seluruh file konfigurasi usang \`vercel.json\` dan \`frontend/vercel.json\`. Seluruh ekosistem MBG Trading kini terstandarisasi 100% pada infrastruktur **Cloudflare Pages & Edge Functions** (\`https://mbg-trading.pages.dev\`) tanpa jejak Vercel.
- **Multi-Chart Grid & Institutional Security Hub Drawer:** Visualisasi teknikal tingkat lanjut dengan grid multi-grafik interaktif (2x2 / 1x2) TradingView dan Security Hub Drawer geser komprehensif yang menampilkan data fundamental, rekapitulasi bandarmologi, dan metrik teknikal emiten.
- **Bloomberg Terminal v4.0 (12-Stream News Intelligence):** 12 saluran stream berita terklasifikasi (IHSG, Perbankan, Komoditas, Makro AS, Kripto, The Fed, Geopolitik) yang dilengkapi radar sentimen multi-agen dan korelasi antar-pasar (*Intermarket Correlation Matrix*).
- **Market Heatmap Treemap Dinamis:** Peta visual interaktif saham BEI dan pasar Kripto dengan pewarnaan gradasi performa harga serta proporsi bobot nilai transaksi (*turnover*).
- **Authentic Brand Logos & Multi-Market Badges:** Integrasi aset logo SVG otentik emiten blue-chip BEI (BBCA, BBRI, BMRI, BBNI, ASII, TLKM, dll.), saham teknologi AS, dan lencana bendera ganda (*dual-flag badges*) untuk pasangan mata uang Forex.
- **Watcher Whale Radar (>100 BTC) & Audio Chime:** Radar pelacak transaksi paus on-chain berukuran raksasa (>100 BTC) dilengkapi lonceng audio instan dan verifikasi hash transaksi langsung ke Blockchain Explorer.
- **Anti-Stale Cache-Busting:** Pemasangan parameter timestamp dinamis \`?v=\${Date.now()}\` serta header \`{ cache: 'no-cache' }\` pada pemuatan bundle data di \`App.jsx\`, menjamin browser tidak terjebak dalam respons HTTP 304 Not Modified.
- **Dividend Hunter Live Binding:** Harga saham pada radar dividen kini terhubung dinamis dengan data kuotasi TradingView Scanner, memastikan kalkulasi estimasi yield selalu akurat mengikuti harga pasar berjalan.
    `.trim(),
    table: [
      { module: 'Reactive Strategy Engine', status: 'PROD', category: 'Engine / Quant', summary: 'State machine adaptif real-time (<1s Crypto, 20s IDX) via dynamicStrategy.js' },
      { module: 'Dynamic Trailing Stop (BE)', status: 'PROD', category: 'Risk Management', summary: 'SL otomatis naik ke level Entry saat TP1 tercapai (Risk-Free Trade)' },
      { module: 'Zero-Cron Architecture', status: 'PROD', category: 'CI/CD', summary: 'Menghapus 6 jadwal cron otomatis; bebas bot commit [skip ci]' },
      { module: 'Pembersihan Vercel', status: 'PROD', category: 'Platform', summary: '100% Cloudflare Pages native; vercel.json root & frontend dihapus' },
      { module: 'Multi-Chart Grid', status: 'PROD', category: 'Charting', summary: 'Grid multi-grafik interaktif (2x2 / 1x2) TradingView' },
      { module: 'Security Hub Drawer', status: 'PROD', category: 'Research', summary: 'Drawer fakta fundamental, bandarmologi, dan metrik teknikal' },
      { module: 'Bloomberg v4.0 Terminal', status: 'PROD', category: 'News Intelligence', summary: '12 stream berita interaktif + radar sentimen multi-agen' },
      { module: 'Market Heatmap Treemap', status: 'PROD', category: 'Visualization', summary: 'Peta panas pasar saham BEI & kripto berbasis nilai transaksi' },
      { module: 'Brand Logos & Badges', status: 'PROD', category: 'UI / Asset', summary: 'Logo SVG emiten BEI, saham US, dan bendera ganda Forex' },
      { module: 'Watcher Whale (>100 BTC)', status: 'PROD', category: 'On-Chain Alert', summary: 'Deteksi transfer paus raksasa + audio alert chime + tx explorer' },
      { module: 'Cache-Busting Anti-304', status: 'PROD', category: 'Networking', summary: 'Timestamp query parameter ?v= menjamin data selalu fresh' },
      { module: 'Dividend Live Binding', status: 'PROD', category: 'Data Desk', summary: 'Harga saham dividen terhubung langsung ke TradingView Scanner' }
    ]
  },
  {
    id: 'pkg-16092026-v3',
    version: 'Package 16092026',
    semanticVersion: 'v3.0.0',
    date: '16 September 2026',
    status: 'STABLE',
    statusColor: '#38bdf8',
    badgeLabel: 'STABLE',
    title: 'Update Package 16092026 (v3.0 APEX): Whale Intelligence Hub, Running Trade BEI, Crypto Futures, Forex & Intraday Sync',
    description: 'Rilis akbar v3.0 menghadirkan integrasi holistik: Pelacakan Paus Kripto On-Chain (0s delay Mempool WS), Broker Summary & Portofolio Tracker BEI (Stockbit Style), Live Running Trade BEI, Dashboard Crypto Futures, Forex Command Center 28-Pair, US Stock Intelligence, Kalender Makro 40+ Event, CryptoWave Live News, NewsDetailModal, dan sinkronisasi intraday 30 menit.',
    processFlow: [
      { step: '1. Baseline Core', label: 'Quant & Plans (08-09/09)' },
      { step: '2. Telegram & Desk', label: 'Serverless Edge (10/09)' },
      { step: '3. Cockpit V2', label: 'SoSoValue Layout (11-12/09)' },
      { step: '4. APEX v3.0', label: 'Whale, Futures & Forex (16/09)' }
    ],
    markdownContent: `
### 🚀 Pembaruan Akbar v3.0 (Highlights 16/09)
- **Whale Intelligence Hub & Real-time Mempool WS:** Pelacakan paus on-chain Bitcoin & Ethereum real-time tanpa delay via WebSocket \`wss://mempool.space/api/v1/ws\` (100% gratis, tanpa API key) dengan deteksi Exchange Inflow/Outflow, verifikasi hash transaksi langsung ke Blockchain Explorer, dan analisis dampak likuiditas.
- **Running Trade Live Saham BEI (Stockbit Style):** Streaming tick transaksi pasar modal Indonesia real-time dengan aksi BUY (Haka)/SELL (Haki), filter lot cerdas (Whale ≥500 lot, Mega Whale ≥1.000 lot), identifikasi broker Buyer & Seller (Asing/Domestik), dan kontrol Pause/Resume.
- **Radar Asing & Portofolio Broker Tracker:** Rekapitulasi lengkap 18+ broker anggota bursa (AK, BK, CS, KZ, RX, CC, NI, YP, PD, SQ, dll.) dengan filter rentang waktu (1D EOD, 3D, 1W, 1M MTD), perhitungan harga beli rata-rata (*Avg Buy*), harga jual rata-rata (*Avg Sell*), net lot pegang barang, dan harga rata-rata akumulasi (*Avg Hold*).
- **Wall Street 13F Hedge Fund Desk:** Pemantauan portofolio institusi global tier-1 (Berkshire Hathaway / Warren Buffett, Citadel / Ken Griffin, Bridgewater / Ray Dalio, Renaissance Technologies / Jim Simons Desk) dengan rincian saham, nilai pasar USD, bobot portofolio (% AUM), dan estimasi avg cost.
- **Crypto Futures Intelligence:** Dashboard komprehensif 15 pair futures dari Binance: Funding Rate heatmap (sinyal overleveraged/squeeze), Open Interest vs Price divergence, rasio Long/Short global, dan radar likuidasi 24 jam.
- **Forex Command Center:** Pemindai 28 pair mata uang via TradingView Scanner, kalkulator risiko pip interaktif (USD & IDR), jam sesi pasar global (Sydney/Tokyo/London/New York), dan laporan CFTC Commitment of Traders (COT).
- **US Stock Intelligence:** Pemindai 30 emiten terpopuler AS (AAPL, NVDA, MSFT, TSLA, GOOGL, dll.) dengan heatmap performa sektor, setup top 5 trade plans, dan kalender earnings dengan countdown zona bahaya.
- **Kalender Makro Global 40+ Event:** Jadwal rilis kebijakan moneter lengkap (US, ID, EU, GB, JP, CN, AU, OPEC+) dengan filter multi-negara, klasifikasi dampak (Tinggi/Sedang/Rendah), status rilis, dan kartu edukasi analisis dampak ke instrumen Forex, Saham, Emas, dan Kripto.
- **CryptoWave Live News & Interactive NewsDetailModal:** Scraper berita terkini dari CryptoWave Indonesia terintegrasi dengan modal detail interaktif dan 3 Key Takeaways Stockbit Snips.
- **Otomasi EOD BEI & Intraday 30-Min Sync:** Workflow otomatisasi GitHub Actions penarikan data resmi Broker Summary EOD pukul **18:15 WIB** pasca tutup pasar dan refresh intraday setiap 30 menit.
- **Auto 1D Timeframe Charting:** TradingView Chart Modal dan Institutional Charting Desk otomatis menyetel interval ke \`1D\` untuk saham IDX dan mengenali prefix pasar \`FX:\`, \`NASDAQ:\`, \`BINANCE:\`, dan \`IDX:\`.
    `.trim(),
    table: [
      { module: 'Whale Hub & Mempool WS', status: 'PROD', category: 'Intelligence', summary: 'On-chain stream real-time 0s delay + verifikasi explorer tx' },
      { module: 'Running Trade BEI', status: 'PROD', category: 'Trading Desk', summary: 'Stockbit style streaming trade + filter lot whale & kode broker' },
      { module: 'Broker Summary & Portfolio', status: 'PROD', category: 'Bandarmology', summary: 'Rekap semua broker + avg buy/sell price + net lot holding' },
      { module: 'Wall Street 13F Desk', status: 'PROD', category: 'Institutional', summary: 'Breakdown portofolio Berkshire, Citadel, Bridgewater, Simons' },
      { module: 'Crypto Futures Hub', status: 'PROD', category: 'Futures', summary: 'Funding rate 15 pairs + Open Interest + Liquidation radar' },
      { module: 'Forex Command Center', status: 'PROD', category: 'Forex', summary: '28-pair scanner + Pip calculator + CFTC COT positioning' },
      { module: 'US Stock Screener', status: 'PROD', category: 'US Equities', summary: '30 top US stocks + Earnings calendar + Sector heatmap' },
      { module: 'Kalender Makro 40+ Event', status: 'PROD', category: 'Macro', summary: '40+ event US, ID, EU, GB, JP, CN + multi-filter negara & impact' },
      { module: 'CryptoWave News', status: 'PROD', category: 'News', summary: 'Scraper live news CryptoWave + NewsDetailModal + Stockbit takeaways' },
      { module: 'EOD Automation (18:15 WIB)', status: 'PROD', category: 'Cron / Workflow', summary: 'Penarikan data harian resmi EOD BEI otomatis pasca jam 18:00' },
      { module: 'Chart Timeframe 1D', status: 'PROD', category: 'Charting', summary: 'Auto-set interval 1D untuk saham IDX + adaptive market selector' },
      { module: 'Intraday 30-Min Sync', status: 'PROD', category: 'Engine / Cron', summary: 'Pipeline update 30 menit bursa IDX + multi-tier foreign flow' },
      { module: 'NewsDetailModal', status: 'PROD', category: 'UI / News', summary: 'Modal pop-up detail berita + 3 Key Takeaways Stockbit Snips' },
      { module: 'Bull-Bear Debate', status: 'PROD', category: 'AI / Quant', summary: 'Sintesis multi-agen analisa risiko sentimen saham IDX' }
    ]
  },
  {
    id: 'pkg-12092026',
    version: 'Package 12092026',
    semanticVersion: 'v2.3.0',
    date: '12 September 2026',
    status: 'STABLE',
    statusColor: '#38bdf8',
    badgeLabel: 'STABLE',
    title: 'Update Package 12092026: IHSG Real-Time Quote Feed & Macro Engine Synchronization',
    description: 'Rekapitulasi pembaruan 12 September 2026: Sinkronisasi real-time quote feed IHSG lintas modul telemetri dan integrasi indeks domestik pada payload eksekusi macro news.',
    processFlow: [
      { step: '1. Baseline', label: 'Quant Core' },
      { step: '2. Telegram & Desk', label: 'Serverless Edge' },
      { step: '3. IHSG Quote Sync', label: 'Level 6,506 (12/09)' }
    ],
    markdownContent: `
### 🚀 Pembaruan Utama (Highlights 12/09)
- **IHSG Real-Time Quote Sync:** Pembaruan live quote feed IHSG level 6,506 secara konsisten pada master bundle cache dan ticker bar terminal.
- **Macro Payload Enrichment:** Penyertaan variabel IHSG ke dalam eksekusi payload \`news_macro\` untuk korelasi sentimen berita dengan pergerakan indeks domestik.
- **Telemetry Stability:** Optimalisasi cron job sinkronisasi kripto dan makro tanpa jeda runtime.
    `.trim(),
    table: [
      { module: 'IHSG Live Feed', status: 'STABLE', category: 'Feed', summary: 'Live quote feed IHSG 6,506 di seluruh bundle cache' },
      { module: 'Macro Payload', status: 'STABLE', category: 'Macro Engine', summary: 'Injeksi variabel IHSG pada data analisis berita' },
      { module: 'Telemetry Cron', status: 'STABLE', category: 'Data Cron', summary: 'Sinkronisasi hourly telemetri kripto & makro' }
    ]
  },
  {
    id: 'pkg-11092026',
    version: 'Package 11092026',
    semanticVersion: 'v2.2.0',
    date: '11 September 2026',
    status: 'STABLE',
    statusColor: '#38bdf8',
    badgeLabel: 'STABLE',
    title: 'Update Package 11092026: SoSoValue Research Desk, Dual-Stream News Wire, Spot ETF Telemetry & Layout Cockpit V2',
    description: 'Pembaruan ekstensif menghadirkan tata letak Home Cockpit 2-kolom SoSoValue (72% Cockpit + 28% Live News) dengan zero horizontal scroll, running ticker tape tanpa jeda, telemetri ETF Spot BTC/ETH, Active Windowing dividen, dan dukungan multi-aset kripto di Charting Desk.',
    processFlow: [
      { step: '1. Baseline Core', label: 'Quant & Plans' },
      { step: '2. Cockpit V2', label: 'SoSoValue Layout (11/09)' }
    ],
    markdownContent: `
### 🚀 Pembaruan Utama (Highlights 11/09)
- **Continuous Running Ticker Tape:** Bar ticker berjalan real-time tanpa jeda di bagian atas layar dengan indikator status global dan subtle scrollbar Bloomberg.
- **Home Cockpit 2-Kolom SoSoValue:** Pembagian rasio proporsional 72% Cockpit (Market Pulse, Bandarmology, Foreign Flow) dan 28% Live News Wire tanpa scrolling horizontal liar.
- **SoSoValue Spot ETF Telemetry:** Pemantauan harian \`Net Flow (US$ M)\` dan turnover Bitcoin & Ethereum Spot ETF langsung di terminal.
- **Research Desk (24/7 Live Stream):** Stream ganda berita Bloomberg & Stockbit Snips yang menyajikan 3 poin kunci sentimen pasar per berita.
- **Dividen Hunter Active Windowing:** Jendela filter cerdas \`[-1 bulan s/d +6 bulan]\` dengan live countdown hari H-X untuk mengeliminasi riwayat dividen usang.
- **Technical Indicators Suite:** Integrasi indikator teknikal native (RSI, MACD, Bollinger Bands, EMA, ATR) dan confluence scoring.
- **Rebranding MBG APEX:** Logo resmi Quantum Emerald Tri-Loop vector murni dan penyelarasan seluruh nama entitas sistem.
    `.trim(),
    table: [
      { module: 'Home Cockpit V2', status: 'STABLE', category: 'UI/UX', summary: 'Rasio 72% / 28%, eliminasi horizontal overflow, telemetry strip' },
      { module: 'Running Ticker Tape', status: 'STABLE', category: 'Feed', summary: 'Continuous loop ticker tape dengan indikator jam bursa aktif' },
      { module: 'Spot ETF Flow', status: 'STABLE', category: 'Macro', summary: 'Net inflow/outflow harian BTC/ETH ETF berbasis SoSoValue' },
      { module: 'Dividen Hunter V2', status: 'STABLE', category: 'Screener', summary: 'Jendela aktif -1 bln s/d +6 bln, countdown timer, filter kadaluarsa' },
      { module: 'Technicals Suite', status: 'STABLE', category: 'Analysis', summary: 'RSI, MACD, Bollinger, EMA, ATR & Confluence Scoring' }
    ]
  },
  {
    id: 'pkg-10092026',
    version: 'Package 10092026',
    semanticVersion: 'v2.1.0',
    date: '10 September 2026',
    status: 'STABLE',
    statusColor: '#38bdf8',
    badgeLabel: 'STABLE',
    title: 'Update Package 10092026: Telegram Serverless, Command Center, Charting Desk & Changelog Engine',
    description: 'Rekapitulasi pembaruan 10 September 2026: Integrasi Bot Telegram serverless 24/7 di Cloudflare Pages, Institutional Charting Desk TradingView, Level 2 Market Depth & Radar Broker Summary, serta pengelompokan semesta Saham IDX.',
    processFlow: [
      { step: '1. Baseline Core', label: 'Quant & Plans' },
      { step: '2. Telegram & Desk', label: 'Serverless Edge (10/09)' }
    ],
    markdownContent: `
### 🚀 Pembaruan Utama (Highlights 10/09)
- **Institutional Charting Desk:** Workspace layar penuh didukung TradingView Advanced Real-Time Chart dengan full drawing toolbar, 4 Strategy Presets (SMC, Trend, Bandar, Mean Reversion), dan kalkulator lot MBG Apex.
- **Level 2 Market Depth & Broker Summary:** Eliminasi simulator acak. Integrasi 100% data riil: Real-time Orderbook Tokocrypto/Indodax & Best Quote BEI dengan Radar Detektif Bandar (Broker Summary 2 Kolom & CR3 Akumulasi).
- **Restrukturisasi Saham IDX:** Konsolidasi seluruh saham dan 12 grup konglomerasi ke dalam semesta "SEMUA SAHAM" dengan sub-filter terfokus: SEMUA SAHAM, 🎯 TOP TRADE PLANS, dan 💰 DIVIDEN HUNTER.
- **Serverless Telegram Bot 24/7:** Webhook \`/api/telegram-webhook\` berjalan di edge Cloudflare Pages tanpa runtime cost (\`Rp 0/bulan\`), melayani query /saham, /crypto, /macro, /plan, /dividend, dan /help.
- **Changelog & Testing Hub:** Registri riwayat rilis terstruktur dan konsolidasi modul pengujian forward & backtest.
    `.trim(),
    table: [
      { module: 'Charting Desk', status: 'STABLE', category: 'Charting', summary: 'TradingView Real-time + 4 Strategy Presets + Drawing Tools' },
      { module: 'L2 Market Depth', status: 'STABLE', category: 'Orderbook', summary: 'Orderbook riil BEI/Crypto + Broker Summary 2 Kolom & CR3' },
      { module: 'Telegram Webhook', status: 'STABLE', category: 'Bot', summary: '24/7 Cloudflare Pages Functions serverless bot (/saham, /plan, dll)' },
      { module: 'Unified Testing', status: 'STABLE', category: 'Testing', summary: 'Konsolidasi Backtest Lab 5-Tahun & Virtual Forward Test' }
    ]
  },
  {
    id: 'pkg-initial-launch',
    version: 'Initial Launch Package',
    semanticVersion: 'v1.0.0',
    date: '08 - 09 September 2026',
    status: 'CONSOLIDATED',
    statusColor: 'var(--text-muted)',
    badgeLabel: 'INITIAL MAJOR LAUNCH',
    title: 'Initial Major Launch Package: Core Quant Intelligence & Multi-Market Terminal',
    description: 'Rekapitulasi paket peluncuran utama yang merangkum seluruh fondasi awal sistem MBG Trading Intelligence Cockpit: model kuantitatif multi-agent, pemindai multi-aset, tools analisis profesional, dan suite makroekonomi ARIB.',
    processFlow: [
      { step: '1. Baseline Core', label: 'Quant Model & Plans (08-09/09)' }
    ],
    markdownContent: `
### 📦 Paket Fondasi Utama (Rekapitulasi Baseline)
- **Quant Core Engine:** Prediksi berbasis Google TimesFM (Zero-Shot Time Series Foundation Model), Smart Money Concepts (SMC Order Blocks, Liquidity Sweeps, & Fair Value Gaps), dan Institutional Investor Flow Score (IIFS).
- **Daily Trade Plans & Scanner:** 20 Daily Trade Plans harian dengan kalkulasi otomatis Entry, Stop Loss, Multi-Target, serta scanner Saham IDX dan 10 Crypto Spot.
- **Pro Trading Tools:** TradingView Pro Interactive Modal, OrderBook L2 Depth Simulator, Kalkulator Ukuran Lot & Manajemen Risiko (1-2%), dan Personal Watchlist.
- **ARIB Macro Suite:** Pemantauan real-time Pasar Global (S&P 500, Nasdaq, Nikkei, IHSG), Kalender Makroekonomi, Matriks Korelasi Pearson, dan Live News Wire.
- **Keamanan & Desain:** Password Gate enkripsi SHA-256 anti-brute lockout, dual-theme dark/light mode Bloomberg & SoSoValue, serta Quant Academy knowledge wiki.
    `.trim(),
    table: [
      { module: 'Quant Core Engine', status: 'BASELINE', category: 'Quant', summary: 'TimesFM + SMC Order Blocks + IIFS Flow Scoring' },
      { module: '20 Trade Plans', status: 'BASELINE', category: 'Scanner', summary: 'Rekomendasi harian IDX & Crypto Spot dengan kalkulasi R:R' },
      { module: 'ARIB Macro Suite', status: 'BASELINE', category: 'Macro', summary: 'Pasar Global, Kalender Makroekonomi & Korelasi Pearson' },
      { module: 'Security & Auth', status: 'BASELINE', category: 'Security', summary: 'SHA-256 Gate, lockout anti-brute force & dual theme' }
    ]
  }
];
