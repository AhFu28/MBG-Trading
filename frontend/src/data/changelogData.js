// Master Changelog Data Registry (Official Documentation & Release History)

export const CHANGELOG_DATA = [
  {
    id: 'pkg-16092026-v3',
    version: 'Package 16092026',
    semanticVersion: 'v3.0.0',
    date: '16 September 2026',
    status: 'LATEST',
    statusColor: 'var(--accent-green)',
    badgeLabel: 'LATEST / ACTIVE HARI INI',
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
