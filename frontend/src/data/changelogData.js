/**
 * MBG APEX Quant Terminal - Changelog & Release History Dataset
 * Formatted and grouped by push date:
 * 1. Update Package 16092026 (16 September 2026) - Latest / Active
 * 2. Update Package 11092026 (11 September 2026) - Stable Evolution
 * 3. Update Package 10092026 (10 September 2026) - Major Evolution
 * 4. Initial Launch Package (08 - 09 September 2026) - Consolidated Baseline
 */

export const CHANGELOG_DATA = [
  {
    id: 'pkg-16092026',
    version: 'Package 16092026',
    semanticVersion: 'v2.3.0',
    date: '16 September 2026',
    status: 'LATEST',
    statusColor: 'var(--accent-green)',
    badgeLabel: 'LATEST / ACTIVE',
    title: 'Update Package 16092026: Interactive News Detail Modal, Stockbit Snips Takeaways & Dual-Modal Connectivity',
    description: 'Pembaruan interaktivitas modal menghadirkan pop-up detail berita interaktif saat mengklik berita di Live News maupun headline wire, ringkasan 3 poin kunci Stockbit Snips, audio TTS, navigasi keyboard cepat, serta trigger langsung ke TradingView Chart.',
    highlights: [
      {
        tag: 'NEWS MODAL',
        tagColor: 'var(--accent-blue)',
        icon: '📰',
        title: 'Interactive News Detail Modal (Pop-up Detail Berita)',
        desc: 'Klik pada kartu berita Live News, running headline bar, maupun feed riset memunculkan modal overlay detail berita: 3 poin Stockbit Snips, narasi lengkap, audio TTS, navigasi artikel cepat, dan link instan ke chart TradingView.'
      },
      {
        tag: 'DUAL-MODAL CONNECTIVITY',
        tagColor: 'var(--accent-green)',
        icon: '⚡',
        title: 'Direct TradingView Chart Trigger',
        desc: 'Chip ticker emiten terdampak ($BELI, $BBRI, $BTC) di dalam feed maupun modal berita dapat diklik langsung untuk memunculkan chart interaktif tanpa saling mengganggu.'
      },
      {
        tag: 'ACCESSIBILITY & TTS',
        tagColor: 'var(--accent-cyan)',
        icon: '🔊',
        title: 'Native Audio Reader (TTS) & Fast Navigation',
        desc: 'Fitur Text-to-Speech untuk mendengarkan rangkuman berita secara audio, dukungan navigasi keyboard panah kiri/kanan dan ESC, serta tombol salin instan ke clipboard.'
      }
    ]
  },
  {
    id: 'pkg-11092026',
    version: 'Package 11092026',
    semanticVersion: 'v2.2.0',
    date: '11 September 2026',
    status: 'STABLE',
    statusColor: 'var(--accent-blue)',
    badgeLabel: 'STABLE EVOLUTION',
    title: 'Update Package 11092026: SoSoValue Research Desk, Dual-Stream News Wire, Spot ETF Telemetry & Layout Cockpit V2',
    description: 'Pembaruan ekstensif menghadirkan tata letak Home Cockpit 2-kolom SoSoValue (72% Cockpit + 28% Live News) dengan zero horizontal scroll, running ticker tape tanpa jeda, telemetri ETF Spot BTC/ETH, Active Windowing dividen, dan dukungan multi-aset kripto di Charting Desk.',
    highlights: [
      {
        tag: 'RUNNING TICKER',
        tagColor: 'var(--accent-green)',
        icon: '📈',
        title: 'Continuous Running Ticker Tape & Dark Scrollbars',
        desc: 'Running ticker tape pasar atas terminal yang bergerak dinamis tanpa jeda dengan status indeks global, IHSG, serta styling scrollbars subtle blend Bloomberg.'
      },
      {
        tag: 'COCKPIT LAYOUT',
        tagColor: 'var(--accent-amber)',
        icon: '🏛️',
        title: 'Home Cockpit 2-Kolom SoSoValue (72% Cockpit + 28% Live News)',
        desc: 'Adopsi tata letak terpadu 2-kolom dengan zero horizontal scroll. Menampilkan struktur asli Top 5 Foreign Flow, Bandarmology radar cards, dan telemetry strip pengisi tinggi layar penuh.'
      },
      {
        tag: 'ETF TELEMETRY',
        tagColor: 'var(--accent-cyan)',
        icon: '⚡',
        title: 'SoSoValue Spot ETF Net Flow & Turnover Telemetry',
        desc: 'Widget telemetri institusional pemantau aliran dana bersih harian (Net Inflow/Outflow) Bitcoin & Ethereum Spot ETF serta turnover pasar global.'
      },
      {
        tag: 'RESEARCH DESK',
        tagColor: 'var(--accent-purple)',
        icon: '📰',
        title: 'SoSoValue-Style Research Desk (24/7 Dual-Stream Live News)',
        desc: 'Integrasi stream ganda berita live wire 24/7 dari Bloomberg/Reuters & Stockbit Snips dengan 3 poin kunci (Key Takeaways) dan sentimen pasar.'
      },
      {
        tag: 'DIVIDEND V2',
        tagColor: 'var(--accent-amber)',
        icon: '💰',
        title: 'Dividen Hunter Active Windowing (-1 Bln s/d +6 Bln)',
        desc: 'Jendela waktu aktif dividen dinamis yang hanya menampilkan emiten pasca-Ex 1 bulan terakhir hingga proyeksi 6 bulan ke depan dengan live countdown H-X.'
      },
      {
        tag: 'GLOBAL MACRO',
        tagColor: '#38bdf8',
        icon: '🌍',
        title: 'Pasar Global & Macro Barometer Enrichment',
        desc: 'Topbar session ticker waktu riil (WIB, NYSE, LSE, TKY), barometer risiko makro, serta pemantauan komoditas energi (Brent/WTI) dan logam mulia (Gold).'
      },
      {
        tag: 'CHARTING & RISK',
        tagColor: 'var(--accent-purple)',
        icon: '🪙',
        title: 'Multi-Asset Crypto Spot di Charting Desk & Lot Calculator',
        desc: 'Dukungan penuh simbol Crypto Spot di workspace layar penuh TradingView dan kalkulator ukuran lot otomatis berbasis margin serta saldo portofolio.'
      },
      {
        tag: 'BRAND IDENTITY',
        tagColor: 'var(--accent-green)',
        icon: '💎',
        title: 'Official MBG APEX Tri-Loop Vector Rebranding',
        desc: 'Peluncuran identitas resmi MBG APEX Market Brain Grid dengan Quantum Emerald Tri-Loop vector logo murni dan pembersihan seluruh residu legacy.'
      }
    ]
  },
  {
    id: 'pkg-10092026',
    version: 'Package 10092026',
    semanticVersion: 'v2.1.0',
    date: '10 September 2026',
    status: 'STABLE',
    statusColor: '#38bdf8',
    badgeLabel: 'STABLE EVOLUTION',
    title: 'Update Package 10092026: Telegram Serverless, Command Center, Charting Desk & Changelog Engine',
    description: 'Pembaruan arsitektur generasi kedua menghadirkan integrasi Bot Telegram serverless 24/7 di Cloudflare Pages, Command Center Home bento-grid, Institutional Charting Desk TradingView, Level 2 Market Depth, dan sistem Changelog Registry.',
    highlights: [
      {
        tag: 'CHARTING DESK',
        tagColor: 'var(--accent-purple)',
        icon: '📊',
        title: 'Institutional Charting Desk & 4 Strategy Presets (TradingView Engine)',
        desc: 'Workspace layar penuh didukung TradingView Advanced Real-Time Chart 100% gratis dengan full drawing toolbar, 4 Strategy Presets (SMC, Trend, Bandar, Mean Reversion), dan 1-klik kalkulator lot.'
      },
      {
        tag: 'ORDERBOOK & FLOW',
        tagColor: '#3b82f6',
        icon: '📊',
        title: 'Level 2 Real Market Depth & Broker Summary (Stockbit/NeoBDM Model)',
        desc: 'Integrasi data riil: Real-time Live Orderbook Kripto via Tokocrypto/Indodax & Official Best Quote BEI dengan Radar Detektif Bandar (Broker Summary 2 Kolom Buyer vs Seller & CR3 Akumulasi).'
      },
      {
        tag: 'SAHAM IDX RESTRUCTURE',
        tagColor: 'var(--accent-green)',
        icon: '🏛️',
        title: 'Restrukturisasi Saham IDX & Penyatuan Semesta (Unified Universe)',
        desc: 'Konsolidasi seluruh saham dan 12 grup konglomerasi ke dalam semesta "SEMUA SAHAM". Sub-filter diperingkas: SEMUA SAHAM, 🎯 TOP TRADE PLANS, dan 💰 DIVIDEN HUNTER.'
      },
      {
        tag: 'TELEGRAM',
        tagColor: 'var(--accent-cyan)',
        icon: '🤖',
        title: '24/7 Serverless Telegram Bot (Cloudflare Pages Functions)',
        desc: 'Webhook /api/telegram-webhook berjalan di edge Cloudflare tanpa runtime cost, melayani query real-time command /saham, /crypto, /macro, /plan, /dividend, dan /help.'
      },
      {
        tag: 'CHANGELOG',
        tagColor: 'var(--accent-green)',
        icon: '📜',
        title: 'Interactive Changelog & Release Notes Engine',
        desc: 'Menu khusus di sidebar untuk pemantauan rilis berkala, filter versi terstruktur, dan rekapitulasi paket rilis dengan visual timeline interaktif.'
      },
      {
        tag: 'QUANT LAB',
        tagColor: 'var(--accent-purple)',
        icon: '🧪',
        title: 'Unified Testing Hub & ErrorBoundary Hardening',
        desc: 'Konsolidasi Forward Paper Trading Portfolio dan Backtest Performance Lab dalam satu alur kerja terpadu dengan proteksi React ErrorBoundary.'
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
