/**
 * MBG APEX Quant Terminal - Changelog & Release History Dataset
 * Formatted and grouped per user requirement:
 * 1. Update Package 10092026 (10 September 2026) - Current / Active
 * 2. Initial Launch Package (08 - 09 September 2026) - Consolidated Baseline
 */

export const CHANGELOG_DATA = [
  {
    id: 'pkg-10092026',
    version: 'Package 10092026',
    semanticVersion: 'v2.1.0',
    date: '10 September 2026',
    status: 'LATEST',
    statusColor: 'var(--accent-green)',
    badgeLabel: 'LATEST / ACTIVE',
    title: 'Update Package 10092026: Telegram Serverless, Command Center & Changelog Engine',
    description: 'Pembaruan arsitektur generasi kedua menghadirkan integrasi Bot Telegram serverless 24/7 di Cloudflare Pages, Command Center Home bento-grid, Zero-Scroll Sidebar, serta sistem Changelog Update terpadu.',
    highlights: [
      {
        tag: 'CHARTING DESK',
        tagColor: 'var(--accent-purple)',
        icon: '📊',
        title: 'Institutional Charting Desk & 4 Strategy Presets (TradingView Engine)',
        desc: 'Menu baru workspace layar penuh didukung TradingView Advanced Real-Time Chart 100% gratis dengan full drawing toolbar (Trendline, Fibonacci, Position Tool). Dilengkapi 4 Strategy Presets (SMC Desk, Trend Following, Bandar Flow, Mean Reversion), telemetri setup terpadu, dan 1-klik kalkulator lot MBG Apex.'
      },
      {
        tag: 'ORDERBOOK & FLOW',
        tagColor: '#3b82f6',
        icon: '📊',
        title: 'Level 2 Real Market Depth & Broker Summary (Stockbit/NeoBDM Model)',
        desc: 'Eliminasi total simulator acak. Integrasi 100% data riil: Real-time Live Orderbook Kripto via Tokocrypto/Indodax Bappebti API & Official Best Quote BEI. Dilengkapi Radar Detektif Bandar (Broker Summary 2 Kolom Buyer vs Seller, CR3 Konsentrasi Akumulasi, dan Foreign Flow).'
      },
      {
        tag: 'SAHAM IDX RESTRUCTURE',
        tagColor: 'var(--accent-green)',
        icon: '🏛️',
        title: 'Restrukturisasi Saham IDX & Penyatuan Semesta (Unified Universe)',
        desc: 'Konsolidasi seluruh saham dan 12 grup konglomerasi ke dalam semesta "SEMUA SAHAM". Kolom dinamis diubah menjadi "Grup" (saham) dan "Klaster" (kripto). Sub-filter diperingkas menjadi 3: SEMUA SAHAM, 🎯 TOP TRADE PLANS (murni rekomendasi buy setup), dan 💰 DIVIDEN HUNTER.'
      },
      {
        tag: 'DIVIDEN HUNTER V2',
        tagColor: 'var(--accent-amber)',
        icon: '💰',
        title: 'Dividen Hunter V2: Kalender, Worth to Buy Scoring & Telegram Alert',
        desc: 'Kalender pembagian dividen lengkap dengan Cum Date, Ex Date, Pay Date, DPS (Rp), Yield %, serta evaluasi kuantitatif "Worth to Buy" (Yield vs Trap Risk vs Payout Ratio). Terintegrasi dengan bot Telegram via /dividend.'
      },
      {
        tag: 'FOREIGN FLOW',
        tagColor: 'var(--accent-cyan)',
        icon: '🌐',
        title: 'Sentralisasi Foreign Flow Macro ke Home Command Center',
        desc: 'Eliminasi baris pseudo-trade plan dari tabel saham. Dialihkan menjadi widget makro likuiditas terpadu di Home Command Center: Net Foreign Flow Harian & 5-Hari (Triliun Rp), status Regime, serta Top 5 Inflow vs Outflow.'
      },
      {
        tag: 'NEWS & SNIPS',
        tagColor: '#a855f7',
        icon: '📰',
        title: 'NewsTab V2 & Stockbit Snips Daily Recap',
        desc: 'Tampilan feed vertikal satu kolom dengan 3 poin penting (Key Takeaways) per berita, Stockbit Snips Daily Recap di header, sentimen pasar, dan Web Speech Audio Narrator.'
      },
      {
        tag: 'CHANGELOG',
        tagColor: 'var(--accent-green)',
        icon: '📜',
        title: 'Interactive Changelog & Release Notes Engine',
        desc: 'Menu khusus di sidebar untuk pemantauan rilis berkala, filter versi terstruktur, dan rekapitulasi paket rilis dengan visual timeline interaktif.'
      },
      {
        tag: 'TELEGRAM',
        tagColor: 'var(--accent-cyan)',
        icon: '🤖',
        title: '24/7 Serverless Telegram Bot (Cloudflare Pages Functions)',
        desc: 'Webhook /api/telegram-webhook berjalan di edge Cloudflare tanpa runtime cost, melayani query real-time command /saham, /crypto, /macro, /plan, /dividend, dan /help.'
      },
      {
        tag: 'DASHBOARD',
        tagColor: 'var(--accent-amber)',
        icon: '🏠',
        title: 'Home Command Center (Bento-Grid Cockpit)',
        desc: 'Tampilan terpadu eksekutif dengan widget Market Pulse, Top 5 Alpha Picks, Radar Foreign Flow Inflow/Outflow, Radar Klaster Konglomerat, dan Live News Wire.'
      },
      {
        tag: 'NAVIGATION',
        tagColor: '#38bdf8',
        icon: '📐',
        title: 'Zero-Scroll Sidebar & Quick Header Tools',
        desc: 'Struktur sidebar compact 100vh tanpa scrolling vertikal berlebih, serta penambahan tombol pintas cepat "LAUNCH CHART" & "KALKULATOR LOT" pada top header.'
      },
      {
        tag: 'QUANT LAB',
        tagColor: 'var(--accent-purple)',
        icon: '🧪',
        title: 'Unified Testing Hub',
        desc: 'Konsolidasi menyeluruh antara Forward Paper Trading Portfolio dan Backtest Performance Lab (5-year walkforward) dalam satu alur kerja pengujian terpadu.'
      },
      {
        tag: 'STABILITY',
        tagColor: '#ef4444',
        icon: '🛡️',
        title: 'React ErrorBoundary & Crash Hardening',
        desc: 'Proteksi komponen dari blank screen jika terjadi data parsing error, pembersihan mojibake encoding, dan sinkronisasi telemetri engine instan.'
      }
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
    consolidatedNotice: '📦 Paket Rilis Utama: Seluruh histori pembaruan awal hingga kemarin (8-9 September 2026) telah direkapitulasi secara komprehensif ke dalam 1 paket peluncuran baseline ini.',
    categories: [
      {
        categoryTitle: 'QUANT CORE ENGINE & ALPHA SCANNER',
        icon: '🧠',
        color: 'var(--accent-green)',
        items: [
          'Prediksi berbasis Google TimesFM (Zero-Shot Time Series Foundation Model).',
          'Deteksi Smart Money Concepts (SMC Order Blocks, Liquidity Sweeps, & Fair Value Gaps).',
          'Perhitungan Institutional Investor Flow Score (IIFS) untuk mengukur jejak akumulasi bandar.',
          '20 Daily Trade Plans harian dengan kalkulasi otomatis Entry, Stop Loss, dan Multi-Target.',
          'Scanner Multi-Market: Saham IDX (Bluechip, Dividend Hunters, Foreign Flow) & 10 Crypto Spot Momentum.',
          'Radar Klaster Konglomerasi Konglomerat (Grup Barito, Salim, Astra, Djarum, dll).'
        ]
      },
      {
        categoryTitle: 'PRO TRADING TOOLS & ANALISIS MENDALAM',
        icon: '📊',
        color: 'var(--accent-cyan)',
        items: [
          'TradingView Pro Interactive Modal lengkap dengan indikator MA, EMA, RSI, dan time-frame dinamis.',
          'OrderBook L2 Depth Simulator dengan visualisasi volume wall Bid/Ask serta deteksi spoofing order.',
          'Kalkulator Ukuran Lot & Manajemen Risiko berbasis modal akun dan batas risiko per trade (1-2%).',
          'Personal Watchlist terintegrasi dengan penyimpanan lokal di peramban pengguna.'
        ]
      },
      {
        categoryTitle: 'ARIB MACRO SUITE & GLOBAL SURVEILLANCE',
        icon: '🌐',
        color: 'var(--accent-purple)',
        items: [
          'Pemantauan Pasar Global real-time (Indeks AS, Nikkei, Hang Seng, IHSG, Komoditas Minyak/Emas).',
          'Kalender Makroekonomi berkala untuk tracking rilis data inflasi, suku bunga BI, dan FOMC Fed.',
          'Matriks Korelasi Pearson lintas kelas aset untuk diversifikasi risiko portofolio.',
          'Bloomberg Live News Wire otomatis yang memantau sentimen pasar global & domestik.'
        ]
      },
      {
        categoryTitle: 'SECURITY GATEWAY, UI/UX & DOKUMENTASI',
        icon: '🛡️',
        color: 'var(--accent-amber)',
        items: [
          'Password Gate dengan enkripsi SHA-256 dan pembatasan percobaan login (anti-brute force lockout).',
          'Sistem Desain Dual-Theme (High-contrast Institutional Bloomberg Dark Mode & SoSoValue Light Mode).',
          'Quant Academy Wiki: panduan edukasi strategi kuantitatif, formulasi indikator, dan terminologi trading.',
          'Penyusunan PRD Master v2, PRD ARIB Unified, serta Manual Definisi Fitur operasional menyeluruh.'
        ]
      }
    ]
  }
];
