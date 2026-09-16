/**
 * MBG APEX Quant Terminal - Changelog & Release History Dataset
 * Daily package model: each package recaps all updates pushed on that specific day.
 * 
 * 1. Package 16092026 (16 September 2026) - LATEST / ACTIVE HARI INI
 * 2. Package 12092026 (12 September 2026) - STABLE
 * 3. Package 11092026 (11 September 2026) - STABLE
 * 4. Package 10092026 (10 September 2026) - STABLE
 * 5. Initial Launch Package (08 - 09 September 2026) - CONSOLIDATED BASELINE
 */

export const CHANGELOG_DATA = [
  {
    id: 'pkg-16092026',
    version: 'Package 16092026',
    semanticVersion: 'v2.4.0',
    date: '16 September 2026',
    status: 'LATEST',
    statusColor: 'var(--accent-green)',
    badgeLabel: 'LATEST / ACTIVE HARI INI',
    title: 'Update Package 16092026: NewsDetailModal, Bull-Bear Debate Engine, Auth Hardening & Markdown Changelog',
    description: 'Rekapitulasi pembaruan 16 September 2026: Integrasi modal detail berita interaktif (NewsDetailModal), Bull-Bear Debate Engine, audit keamanan Cloudflare Pages, serta penyederhanaan antarmuka Changelog ke model dokumen Markdown bersih.',
    processFlow: [
      { step: '1. Baseline Core', label: 'Quant & Plans (08-09/09)' },
      { step: '2. Telegram & Desk', label: 'Serverless Edge (10/09)' },
      { step: '3. Cockpit V2', label: 'SoSoValue Layout (11/09)' },
      { step: '4. AI Debate & Modal', label: 'Aktif Hari Ini (16/09)' }
    ],
    markdownContent: `
### 🚀 Pembaruan Utama (Highlights Hari Ini)
- **Interactive NewsDetailModal:** Modal baca detail berita instan saat kartu berita diklik. Menampilkan narasi lengkap, sentimen pasar (*BULLISH/BEARISH/NEUTRAL*), serta 3 poin kunci (*Key Takeaways*) Stockbit Snips.
- **Bull-Bear Debate Engine:** Engine sintesis sentimen multi-agen yang mengadu tesis Bullish vs Bearish untuk menguji ketahanan setiap sinyal trading saham IDX.
- **Auth Hardening & Cloudflare Deployment:** Pembersihan autentikasi login (default: \`mbg\`), eliminasi celah keamanan runtime, dan verifikasi deployment Cloudflare Pages Functions.
- **Simplified Markdown Changelog:** Restrukturisasi antarmuka riwayat versi dari kartu kotak-kotak tebal (*chunky grid*) menjadi format dokumen Markdown elegan dengan tipografi bersih, diagram alur proses, dan tabel rekapitulasi.
    `.trim(),
    table: [
      { module: 'NewsDetailModal', status: 'PROD', category: 'UI / News', summary: 'Modal pop-up baca berita lengkap + 3 Key Takeaways' },
      { module: 'Bull-Bear Debate', status: 'PROD', category: 'AI / Quant', summary: 'Simulasi debat multi-perspektif analisa risiko saham' },
      { module: 'Auth & CF Pages', status: 'PROD', category: 'Security', summary: 'Hardening Cloudflare Pages edge runtime & auto-auth' },
      { module: 'Markdown Changelog', status: 'PROD', category: 'System', summary: 'Format dokumen Markdown bersih + diagram alur proses' }
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
    title: 'Update Package 11092026: SoSoValue Research Desk, Dual-Stream News Wire, Spot ETF Telemetry & Cockpit V2',
    description: 'Rekapitulasi pembaruan 11 September 2026: Tata letak Home Cockpit 2-kolom SoSoValue (72% Cockpit + 28% Live News), continuous running ticker tape, telemetri Spot ETF BTC/ETH, Active Windowing dividen, dan technical indicators suite.',
    processFlow: [
      { step: '1. Baseline Core', label: 'Quant & Plans' },
      { step: '2. Telegram & Desk', label: 'Serverless Edge' },
      { step: '3. Cockpit V2 & ETF', label: 'SoSoValue Layout (11/09)' }
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
