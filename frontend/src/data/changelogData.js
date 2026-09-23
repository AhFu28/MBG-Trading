// Master Changelog Data Registry (Official Documentation & Release History)

export const CHANGELOG_DATA = [
  {
    id: 'pkg-23092026-v50',
    version: 'Package 23092026-A',
    semanticVersion: 'v5.0.0',
    date: '23 September 2026',
    status: 'LATEST',
    statusColor: 'var(--accent-green)',
    badgeLabel: 'LATEST / INSTITUTIONAL AI DESK',
    title: 'Update v5.0.0 (INSTITUTIONAL AI DESK): Sentinel Desk Macro & Geopolitical, DEFCON Computed Threat Barometer, Live News Research Synthesis, dan Explainable AI Agent Arena',
    description: 'Peningkatan besar-besaran standar hedge fund: peluncuran AI Quant Intelligence & Sentinel Desk dengan analisis transmisi makro & debat sindikasi multi-universe (IDX 861+ emiten, Crypto, US Stocks), transformasi DEFCON menjadi Threat Barometer terkuantisasi (0.42 / 1.00) dengan What-If Stress Simulator, integrasi live Gemini LLM ke Daily Brief & Research Note format Goldman Sachs Barbell, Emergency Macro & War Flash Alert Sentinel, Explainable AI Trade Reflection pada jurnal transaksi Agent Arena, tombol manual sync ber-cache-busting, perbaikan kritis parsing data anti-NaN, dan penegasan arsitektur Multi-Agent Sovereign untuk pensiunnya modul EXP3 bandit.',
    processFlow: [
      { step: '1. Model Discovery', label: 'Dynamic Gemini 3.6/3.7/3.8 discovery dengan cascade failover aman' },
      { step: '2. Threat Barometer', label: 'DEFCON komposit matematis 4 sub-pilar terbobot + What-If Stress Simulator' },
      { step: '3. Research Synthesis', label: 'Live News Daily Brief & Sector Research Note (Barbell Strategy + S/R Matrix)' },
      { step: '4. Crisis Flash Alert', label: 'Pulsating emergency alert banner untuk deteksi ancaman perang/krisis makro' },
      { step: '5. Trade Reflection', label: 'Explainable AI quant reasoning pada setiap closed trade di Agent Arena' },
      { step: '6. Cache & Sync', label: 'Tombol manual [🔄 Refresh Riset AI] & [🔄 Sync Desk] dengan cache-busting' }
    ],
    markdownContent: `
### 🛡️ v5.0.0 — Institutional AI Quant Intelligence & Sentinel Desk

#### 🏛️ 1. AI Quant Intelligence & Sentinel Desk
- **Struktur 3 Tab Institusional (Bebas Alay & Tanpa Tab Promosi):**
  - **Tab 1 — Isu Makro & Transmisi:** Pemetaan rezim tematik makro (Suku Bunga Fed/BI, Inflasi, Dolar AS) dan rantai transmisinya ke emiten penerima manfaat (*beneficiaries*) serta emiten yang tertekan (*losers*).
  - **Tab 2 — Debat Sindikasi & On-Demand Dossier:** Analisis fundamental dan debat tesis Bull vs Bear untuk **seluruh instrumen pasar**:
    - **Saham BEI (IDX 861+ Emiten):** Dilengkapi analisis pertumbuhan laba YoY, margin EBITDA, rasio utang/DER, arus kas, katalis korporasi riil (ekspansi/merger), dan **Peta Relasi Konglomerasi** (Grup Astra, Barito, Medco, Bakrie, Salim, dll) dengan *clickable chips* untuk navigasi instan antar emiten afiliasi.
    - **Crypto Spot:** Valuasi on-chain, fee protokol, staking yield, dan korelasi ekosistem (BTC, ETH, SOL, NEAR, LINK, SUI).
    - **US Equities:** Supercycle capex AI datacenter hyperscalers, Wall Street consensus, dan rantai pasok chip semikonduktor (NVDA, AAPL, MSFT, TSLA, AMD).
  - **Tab 3 — Geopolitical Sentinel & DEFCON Threat Barometer:**
    - Transformasi DEFCON dari slider manual menjadi **Threat Barometer Terkuantisasi 5 Segmen** yang terkunci pada skor ancaman komposit riil (\`0.42 / 1.00\`, Level 4 Guarded).
    - **4 Sub-Pilar Kuantitatif:** Rantai Pasok Energi & Hormuz (68/100, bobot 35%), Divergensi Moneter & Kurs Rupiah (54/100, bobot 30%), Perang Tarif Dagang (45/100, bobot 20%), dan Titik Rawan Maritim (32/100, bobot 15%).
    - **What-If Escalation Simulator:** Simulasi stress-test portofolio tanpa mengubah data riil (Skenario 1: Status Quo, Skenario 2: Penutupan Selat Hormuz / Oil Shock, Skenario 3: Perang Tarif Global / Stagflasi).

#### 📰 2. Autonomous News Research Intelligence
- **Live AI Synthesis via Gemini LLM:** Mengganti template statis dengan pemanggilan model Gemini terkini (\`gemini-3.6-flash\`) untuk memproses feed berita finansial harian aktual.
- **Dua Output Riset Standar Hedge Fund:**
  - **☀️ Daily Brief (Morning Executive Summary):** Penjelasan bahasa awam (*layman translation*), rangkuman poin penggerak pasar, dan pedoman likuiditas kas.
  - **🔬 Sector Research Note:** Pendekatan *Goldman Sachs GIR / Ray Dalio Barbell Strategy* (60% Saham Perbankan Dividen Tinggi : 40% Saham Momentum Komoditas/Emas).
  - **S/R Technical Matrix:** Level kuantitatif terukur (Pivot, S1/S2, R1/R2, dan batas *Invalidation Cut-off* disiplin risiko) untuk emiten spotlight (\`$BBCA\` & \`$ANTM\`).
- **Emergency Macro & War Flash Alert Sentinel:** Banner pulsating merah-emas di atas cockpit yang otomatis aktif jika terdeteksi headline ancaman krisis perang darurat atau disrupsi makro ekstrem.
- **14-Edition Historical Research Archive:** Manajemen arsip FIFO otomatis untuk menjaga riwayat 14 edisi sebelumnya dengan ukuran data di bawah 60 KB (mencegah memory bloat).
- **Tombol Sinkronisasi Manual:** Tombol **\`[🔄 Refresh Riset AI]\`** di News Tab dan **\`[🔄 Sync Desk]\`** di Sentinel Desk dengan parameter cache-busting (\`?v=\${Date.now()}\`).

#### 🤖 3. Explainable AI Trade Reflection (AI Agent Arena)
- **Sub-row \`🤖 AI REFLECTION\` di Jurnal Transaksi:** Setiap posisi tertutup (*closed trade*) kini menyertakan catatan reasoning kuantitatif independen dalam bahasa Indonesia yang menjelaskan mengapa bot mengambil keputusan tersebut (apakah liquidity sweep SMC, akumulasi broker bandarmology, momentum breakout volume, atau deviasi mean reversion).
- **Penegasan Status EXP3 Multi-Armed Bandit:** Modul \`exp3_bandit.py\` resmi berstatus **ARCHIVED / RETIRED** karena arsitektur Arena telah beralih ke **Multi-Agent Sovereign** di mana setiap bot memiliki modal mandiri **Rp 1.000.000** dan mengelola risiko Margin Call (MC <= 15%) sendiri secara independen.

#### 🛡️ 4. Data Reliability & Engine Hardening
- **JSON Parser Anti-NaN Bug Fix:** Menuntaskan bug kritis di mana kuotasi \`NaN\` dari pandas/yfinance menyebabkan kegagalan parsing JSON pada browser. Seluruh nilai \`NaN\` kini disanitasi menjadi \`null\` secara otomatis.
- **Dual-Layer Cascade Failover:** Jika Google Gemini API mengalami lonjakan trafik (*HTTP 503 Spike*) atau limit kuota (*HTTP 429*), sistem otomatis melakukan failover bertingkat antar model (\`3.6-flash\` -> \`3.7-flash\` -> \`3.8-flash\`) hingga fallback ke template deterministik institusional tanpa pernah menyebabkan UI crash atau blank.
`
  },
  {
    id: 'pkg-21092026-v48',
    version: 'Package 21092026-B',
    semanticVersion: 'v4.8.0',
    date: '21 September 2026',
    status: 'PREVIOUS',
    statusColor: 'var(--text-muted)',
    badgeLabel: 'PREVIOUS / STABLE',
    title: 'Update v4.8.0 (SEASON 0.1): Auto-Label Sesi Kalibrasi #0.1, Pair Recap Sub-Tab dengan Long/Short Breakdown & Bug Fix Auto-Start',
    description: 'Penambahan fitur Pair Recap (sub-tab di dalam Session Recap modal) dengan breakdown performa per instrumen berdasarkan arah trade (Long/Short). Sesi pertama setelah Genesis #0 kini otomatis dilabeli Sesi #0.1 (Calibration & Hardening). Data allPairs kini disimpan ke laporan epoch untuk histori jangka panjang. Bug kritis diperbaiki: tombol di sesi arsip tidak lagi auto-start trading.',
    processFlow: [
      { step: '1. Session Labeling', label: 'Auto-label Sesi #0.1 jika genesis-only, semua label template string aman' },
      { step: '2. Data Layer', label: 'pairStats + Long/Short split, allPairs tersimpan ke epoch report' },
      { step: '3. Pair Recap UI', label: 'Sub-tab 🗂️ Pair Recap: tabel instrumen + filter Semua/Long/Short' },
      { step: '4. Bug Fix', label: 'Tombol arsip tidak lagi auto-start trading (setIsRunning bug removed)' }
    ],
    markdownContent: `
### 🗂️ v4.8.0 — Season 0.1 + Pair Recap Sub-Tab

#### ✨ Fitur Baru: Pair Recap
- **Sub-tab baru "🗂️ Pair Recap"** di dalam Session Recap modal (Opsi B — ringkas tanpa tombol terpisah)
- **Tabel performa per instrumen:** Kolom Net PnL, Trades, WR%, Long PnL, Short PnL
- **Filter arah trade:** Chips ⚡ Semua / 📈 Long / 📉 Short — sort otomatis berdasarkan arah dipilih
- **Badge market berwarna:** FOREX (biru), CRYPTO (oranye), FUTURES (ungu), IDX (hijau)
- **Fallback graceful:** Sesi arsip lama tanpa data pair menampilkan pesan informatif

#### 🔖 Fitur Baru: Season 0.1 Auto-Label
- Sesi pertama setelah Genesis #0 kini otomatis diberi label **Sesi #0.1 (Calibration & Hardening)**
- Dropdown "Pilih Sesi" di Session Recap juga menampilkan label yang sama
- Sesi berikutnya akan mulai dari Sesi #2 (atau disesuaikan)

#### 📦 Data Integrity
- \`allPairs\` (breakdown lengkap semua pair) kini tersimpan ke setiap epoch report di localStorage
- \`pairStats\` di live sessionRecapData dan generateEpochReportAndAdapt diperluas dengan: \`longTrades\`, \`longWins\`, \`longNetPnlIdr\`, \`shortTrades\`, \`shortWins\`, \`shortNetPnlIdr\`, \`longWinRate\`, \`shortWinRate\`

#### 🐛 Bug Fix
- **[CRITICAL]** Tombol footer sesi arsip tidak lagi memanggil \`setIsRunning(true)\` — trading tidak akan auto-start saat user menutup laporan sesi lama
- Reset self-learning tetap berjalan benar: \`isRunning = false\` setelah global reset, user harus tekan Start manual
`
  },
  {

    id: 'pkg-21092026-v47',
    version: 'Package 21092026',
    semanticVersion: 'v4.7.0',
    date: '21 September 2026',
    status: 'COMPLETED',
    statusColor: '#94a3b8',
    badgeLabel: 'COMPLETED',
    title: 'Update Package 21092026 (v4.7 APEX): AI Arena Engine Integrity Refactor, Zero Side-Effects Loop, Live USD/IDR Sync, Dynamic KPIs & WCAG UI/UX Hardening',
    description: 'Audit komprehensif dan hardening produksi AI Multi-Agent Arena (18 Item Resolusi 100%): Rekonstruksi simulation loop murni bebas side-effect via batch sequential dispatch, live USD/IDR dynamic synchronization (usdToIdrRef) di 41 titik kalkulasi, formula collision-proof trade IDs, kalkulasi dinamis metrik KPI (Sharpe Ratio matematis, running MDD, Win Rate), reaktif clock 60s & anti-drift timer, serta standarisasi aksesibilitas WCAG (7 ARIA modal dialog, stacked toast queue max 3, mobile cockpit grid, typography floor >= 8px, touch targets >= 24-26px, dan backdrop/ESC dismiss).',
    processFlow: [
      { step: '1. Logic & Integrity', label: 'usdToIdrRef (41 Titik), Collision-Proof IDs & Dynamic KPIs' },
      { step: '2. Pure Simulation', label: 'Decoupled Batch Dispatch (Zero Nested Side-Effects)' },
      { step: '3. A11y & UI/UX Polish', label: '7 ARIA Modals, Toast Queue (Max 3) & Focus Rings' },
      { step: '4. QA/QC Clearance', label: '12/12 Automated Checks Passed + Clean Build' }
    ],
    markdownContent: `
### 🛡️ Pembaruan Akbar v4.7 (Full Engine Audit & WCAG UI/UX Hardening)
- **Rekonstruksi Integritas Mesin & Simulasi (Logic Integrity):**
  - **Zero Side-Effects Simulation Loop:** Menghilangkan mutasi bersarang dalam updater \`setPositions\`. Seluruh perhitungan likuidasi, margin call, spawner, dan mutasi DNA kini dikalkulasi secara murni di memori lokal, lalu di-dispatch secara batch berurutan (\`setPositions\` → \`setJournal\` → \`setAgents\` → \`toasts\`).
  - **Live USD/IDR Dynamic Synchronization (\`usdToIdrRef\`):** Mengganti seluruh konstanta nilai tukar statis dengan sinkronisasi reaktif di 41 titik kalkulasi PnL, notional, dan batas margin.
  - **Collision-Proof Trade & Liquidation IDs:** Format ID transaksi kini menggunakan timestamp unik \`TRD-\${pos.id}-\${Date.now()}\` dan \`LIQ-\${pos.id}-\${Date.now()}\` untuk mencegah duplikasi histori saat penutupan massal.
  - **Stale Closure Mitigation:** \`handleManualClose\` mengonsumsi \`positionsRef.current\` dan \`usdToIdrRef.current\` secara murni tanpa risiko capture closure basi.
  - **True Dynamic Calculated KPIs:** Metrik performa makro (Win Rate, Sharpe Ratio matematis, dan Running Peak-to-Trough Max Drawdown) dihitung 100% dari jurnal transaksi riil, mengeliminasi nilai hardcoded statis.
  - **Clock Reaktif 60s & Anti-Drift Uptime:** Menggunakan state \`clockTick\` untuk memperbarui badge sesi pasar (IDX, US, Forex/Emas, Kripto) secara real-time dan mengisolasi akumulasi uptime dari event pergantian tab browser.
- **Standarisasi Aksesibilitas & UI/UX (WCAG & Ergonomi):**
  - **Full ARIA Modal Compliance:** Ketujuh modal institusional dilengkapi \`role="dialog"\`, \`aria-modal="true"\`, dan \`aria-labelledby\` terhubung ke heading masing-masing.
  - **Dual Modal Dismissal Ergonomics:** Seluruh modal mendukung penutupan intuitif via klik backdrop overlay dan tombol keyboard global \`Escape\`.
  - **Stacked Toast Notification Queue:** Sistem notifikasi multi-pesan (maksimal 3 tumpukan aktif) dengan transisi animasi \`toastSlideIn\` dan auto-dismiss independen 3,5 detik.
  - **Responsive Cockpit Breakpoint:** Grid kontrol cockpit menggunakan \`minmax(min(100%, 360px), 1fr)\` mencegah horizontal scrolling pada layar smartphone.
  - **Accessible Focus Rings & Typography Floor:** Menghapus seluruh \`outline: 'none'\` telanjang, menetapkan cincin fokus kontras tinggi (\`focus-visible\`), dan menaikkan batas bawah ukuran font menjadi minimal 8–8.5px.
  - **WCAG Touch Target Compliance (≥ 24–26px):** Memperbesar tombol interaktif seperti tab filter deck, tombol generasi bot, tombol close transaksi (×), dan tombol navigasi laporan.
    `.trim(),
    table: [
      { module: 'Zero Side-Effects Engine', status: 'PROD', category: 'Architecture / Core', summary: 'Pure simulation loop dengan batch sequential dispatch' },
      { module: 'Live Dynamic USD/IDR', status: 'PROD', category: 'Quant / Exchange', summary: 'Sinkronisasi nilai tukar di 41 titik kalkulasi via usdToIdrRef' },
      { module: 'Dynamic KPI Metrics', status: 'PROD', category: 'Analytics / Math', summary: 'Sharpe ratio, running MDD, dan Win Rate dinamis dari data jurnal' },
      { module: 'Collision-Proof Trade IDs', status: 'PROD', category: 'Data Integrity', summary: 'Pencegahan duplikasi ID transaksi via timestamp Date.now()' },
      { module: 'WCAG ARIA Modal Dialogs', status: 'PROD', category: 'Accessibility / A11y', summary: 'Role dialog, aria-modal, dan labelledby pada 7 modal' },
      { module: 'Toast Stack Notification', status: 'PROD', category: 'UI / UX', summary: 'Queue multi-toast max 3 stack dengan slide-in animation' },
      { module: 'Touch Target Optimization', status: 'PROD', category: 'Ergonomics / Mobile', summary: 'Minimal tinggi tombol >= 24-26px dan typography floor >= 8px' }
    ]
  },
  {
    id: 'pkg-21092026-v46',
    version: 'Package 21092026',
    semanticVersion: 'v4.6.0',
    date: '21 September 2026',
    status: 'COMPLETED',
    statusColor: 'var(--accent-blue)',
    badgeLabel: 'STABLE RELEASE',
    title: 'Update Package 21092026 (v4.6 CHAOS): Agent 16 CHAOS [The Rogue Singularity], Unlimited Carpet-Bomb Scalping, Self-Sovereign Ledger & Genetic Rebirth',
    description: 'Peluncuran resmi Agent ke-16 "CHAOS" di AI Multi-Agent Arena: Bot mandiri kategori ANOMALY yang melanggar batas risiko konvensional untuk memburu profit asimetris eksponensial (1:12+ R:R) melalui machine-gun carpet bombing multi-posisi tanpa batas tiket pada satu pair, saldo mandiri terisolasi Rp 1.000.000 (Total AUM Rp 16.000.000), serta sistem Genetic Self-Learning & Auto-Rebirth otomatis saat Margin Call.',
    processFlow: [
      { step: '1. Roster Expansion', label: '16 Bots (4 Base + 6 Duo + 4 Trio + 1 Master + 1 Anomaly)' },
      { step: '2. Unlimited Stacking', label: 'Machine-Gun Carpet Bombing (Zero Cooldown)' },
      { step: '3. Self-Sovereign Ledger', label: 'Alokasi Mandiri Rp 1M + Dynamic Total AUM Rp 16M' },
      { step: '4. Genetic Rebirth', label: 'Auto-Audit Forensik, DNA Mutation & Respawn Gen N+1' }
    ],
    markdownContent: `
### 🚀 Pembaruan Akbar v4.6 (Agent 16: CHAOS)
- **Peluncuran Agent ke-16: CHAOS (The Rogue Singularity):**
  - **Tier ANOMALY / UNBOUND (☣️ #a855f7):** Agen independen berkecepatan tinggi yang mengeksploitasi anomali likuiditas fraktal (*liquidity vacuum*) dan klaster likuidasi berantai.
  - **Unlimited Carpet-Bomb Scalping (\`mode: 'UNLIMITED_CARPET_BOMB'\`):** Mengabaikan batasan kuantitas tiket konvensional (\`maxPerPair: 999\`). Selama free margin tersedia, CHAOS menembakkan order beruntun dengan zero cooldown (\`minCooldownSec: 0\`).
  - **Self-Sovereign Capital Ledger:** Modal Rp 1.000.000 dikelola 100% secara mandiri. Keuntungan di-compound di dompet CHAOS sendiri, dan jika terjadi Margin Call, tidak menyentuh saldo 15 bot lainnya.
  - **Autonomous Genetic Rebirth & Self-Learning:** Saat akun menyentuh limit likuidasi, CHAOS langsung mengeksekusi audit forensik mendeteksi *toxic pair*, memutasi sensitivitas volume ledakan, mereset saldo ke Rp 1.000.000, dan langsung bangkit ke generasi berikutnya (\`generation + 1\`).
  - **Visualisasi Khusus di Deck Grid & Filter Tab:** Dilengkapi badge status \`Bomb∞\`, filter tab **1 Anomali (CHAOS)**, dan simulasi strategi kinetik interaktif di modal profil.
    `.trim(),
    table: [
      { module: 'Agent 16 CHAOS', status: 'PROD', category: 'AI Arena / Agents', summary: 'The Rogue Singularity Anomaly Agent (☣️ #a855f7)' },
      { module: 'Unlimited Carpet Bomb', status: 'PROD', category: 'Quant / Scalping', summary: 'Multi-position layering tanpa batasan kuantitas tiket' },
      { module: 'Self-Sovereign Ledger', status: 'PROD', category: 'Risk Management', summary: 'Modal terisolasi Rp 1M/bot, Total AUM dinamis Rp 16M' },
      { module: 'Genetic Auto-Rebirth', status: 'PROD', category: 'Evolution / Learning', summary: 'Auto-audit toxic pair, mutasi DNA, dan respawn Gen N+1' },
      { module: 'Deck Tab Anomaly', status: 'PROD', category: 'UI / Navigation', summary: 'Filter tab dedicated untuk mengisolasi Agen CHAOS' }
    ]
  },
  {
    id: 'pkg-20092026-v45',
    version: 'Package 20092026',
    semanticVersion: 'v4.5.0',
    date: '20 September 2026',
    status: 'COMPLETED',
    statusColor: 'var(--accent-blue)',
    badgeLabel: 'STABLE RELEASE',
    title: 'Update Package 20092026 (v4.5 APEX): AI Multi-Agent Arena (15 Elemental Syndicate Bots), Locked 4-Column Deck, Independent Capital Ledger & Dynamic Sizing',
    description: 'Peluncuran akbar AI Multi-Agent Arena v4.5: Mengembangkan sistem dari 4 bot elemen dasar menjadi 15 bot independen (4 Base, 6 Duo, 4 Trio, dan 1 Master AVATAR Consensus). Menghadirkan Locked 4-Column Kanban Deck Grid dengan auto-wrap ke bawah, manajemen modal independen per bot (default Rp 1.000.000/bot) dengan indikator Total AUM dinamis (Rp 15.000.000), aturan kepatuhan arah instrumen (Saham BEI Long-Only, Kripto & Forex Dual Direction), dynamic position lot sizing anti-round-down, dan 100% Zero-Token Gemini AI runtime pada peramban klien.',
    processFlow: [
      { step: '1. Base 4 Elements', label: 'WATER, FIRE, AIR, EARTH (19/09)' },
      { step: '2. 6 Duo Combos', label: 'STEAM, STORM, MUD, LIGHTNING, LAVA, SANDSTORM (20/09)' },
      { step: '3. 4 Trio Combos', label: 'TEMPEST, OCEANIC, GEOTHERMAL, CYCLONE (20/09)' },
      { step: '4. Master & 4-Col Grid', label: 'AVATAR Consensus & Locked 4-Col Kanban (20/09)' }
    ],
    markdownContent: `
### 🚀 Pembaruan Akbar v4.5 APEX (Highlights 20/09)
- **15 AI Multi-Agent Roster Lengkap (4 Base + 11 Fusi Elemen):**
  - **4 Elemen Dasar:**
    - 💧 **WATER (water-smc):** Liquidity Hunter (Smart Money Concepts) — Mendeteksi Order Block retest pasca liquidity sweep.
    - 🔥 **FIRE (fire-momentum):** Momentum Trend Rider — Mengendarai tren kuat via EMA 9/21 ribbon & Donchian Channel breakout.
    - 🌪️ **AIR (air-scalper):** High-Frequency Micro Scalper — Scalping kilat memanfaatkan micro FVG dan RSI(7) momentum.
    - 🌍 **EARTH (earth-reversal):** Mean-Reversion Guardian — Menangkap pembalikan harga ekstrim dari Bollinger Bands 3 SD & RSI divergensi.
  - **6 Kombo Duo (C(4,2)):**
    - 💨 **STEAM [W+F]:** Liquidity News Sniper — Sweep likuiditas SMC dikonfirmasi lonjakan volume berita katalis.
    - ⛈️ **STORM [W+A]:** SMC Trend Breakout — Konfirmasi Break of Structure (BOS) HTF + micro-breakout cepat.
    - 🧱 **MUD [W+E]:** Liquidity Reversal Absorber — Sapuan likuiditas OB yang terabsorpsi di batas oversold/overbought ekstrim.
    - ⚡ **LIGHTNING [F+A]:** Momentum Scalper Flash — Trend momentum impulsif dipadu eksekusi micro scalping agresif.
    - 🌋 **LAVA [F+E]:** Post-News Reversal Fade — Memudar (*fade*) candle spike berita ketika harga menembus batas Bollinger 3 SD.
    - 🏜️ **SANDSTORM [A+E]:** Range Scalper Mean Revert — Scalping mikro osilasi cepat di dalam rentang sideways.
  - **4 Kombo Trio (C(4,3)):**
    - 🌀 **TEMPEST [W+F+A]:** Hyper-Aggressive Trend Syndicate — Sapuan likuiditas SMC memicu akselerasi tren + micro scaling.
    - 🌊 **OCEANIC [W+A+E]:** Smart Money Mean Reversion Anchor — Pengawal likuiditas institusional dengan penyerapan pembalikan arah terkontrol.
    - 🌋 **GEOTHERMAL [W+F+E]:** Fundamental Macro Reversal Core — Penyerapan sentimen makro ekstrem diikuti akumulasi institusi skala besar.
    - 🌪️ **CYCLONE [F+A+E]:** Dynamic Volatility Trend Engine — Ekspansi volatilitas Bollinger Bands dipadu trailing stop dinamis.
  - **1 Master Ensemble (C(4,4)):**
    - 🌟 **AVATAR [W+F+A+E]:** Consensus Multi-Agent Ensemble — Mengintegrasikan sistem pemungutan suara (voting) dari ke-4 elemen dasar. Order hanya dieksekusi jika $\\ge 3$ agen sepakat pada arah yang sama.
- **Locked 4-Column Grid (\`.arena-locked-4col-grid\`):**
  - Pada layar desktop ($\\ge 1180\\text{px}$), kartu kanban bot terkunci rapi tepat 4 kolom per baris dan menghasilkan baris ke bawah (4 baris $\\times$ 4 kolom).
  - Mengeliminasi layout shift dan ketidaksejajaran ukuran kartu. Layar tablet otomatis switch ke 2 kolom dan mobile ke 1 kolom.
- **Deck View Navigation Filter Tabs:**
  - Tab filter cepat untuk kemudahan monitoring: **Semua Bot (15)**, **4 Elemen Dasar**, **6 Kombo Duo**, dan **5 Sindikat (Trio & Master)**.
- **Manajemen Modal Independen & Dynamic Total AUM:**
  - Setiap bot diberikan modal awal terisolasi (default Rp 1.000.000/bot).
  - Total AUM terhitung otomatis secara transparan: **Total AUM: Rp 15.000.000 (15 Bot)**.
  - Kerugian, margin call, dan keuntungan bot satu sama sekali tidak mempengaruhi bot lainnya.
- **Aturan Directional Safety Berstandar Regulasi:**
  - **Saham BEI (IDX):** Terkunci secara ketat **LONG-ONLY** (Dilarang Short Selling sesuai regulasi pasar modal Indonesia).
  - **Crypto Perp & Forex:** Mendukung **LONG & SHORT** dua arah secara penuh.
- **Dynamic Lot Sizing Anti-Round-Down:**
  - Formula \`calculateInstrumentLotSize\` mengalokasikan target margin $\\approx$ Rp 30.000 / notional $\\approx$ $37 USD pada leverage 1:20.
  - Mengatasi bug floating PnL bernilai Rp 0 pada koin berharga rendah seperti ADA, XRP, PEPE, dan DOGE.
- **Zero-Token AI Runtime:**
  - Seluruh mesin pemindaian, state machine, dan logika kombo beroperasi 100% secara deterministik kuantitatif di sisi klien tanpa mengonsumsi token API Gemini pengguna.
    `.trim(),
    table: [
      { module: '15 Multi-Agent Roster', status: 'PROD', category: 'AI Arena / Agents', summary: '4 Base Elements + 6 Duo Combos + 4 Trio + 1 Master AVATAR' },
      { module: 'Locked 4-Col Grid', status: 'PROD', category: 'UI / Kanban', summary: 'Grid 4 kolom terkunci di desktop, wrap ke bawah secara proporsional' },
      { module: 'Independent Capital Ledger', status: 'PROD', category: 'Risk Management', summary: 'Modal terisolasi default Rp 1.000.000 per bot + dynamic Total AUM Rp 15M' },
      { module: 'Directional Compliance Gate', status: 'PROD', category: 'Compliance', summary: 'BEI Strictly Long-Only; Kripto Futures & Forex mendukung Long & Short' },
      { module: 'Dynamic Lot Sizing', status: 'PROD', category: 'Quant / Execution', summary: 'Kalkulasi lot proporsional mengeliminasi floating PnL Rp 0 pada altcoins' },
      { module: 'Deck View Navigation', status: 'PROD', category: 'UI / Filter', summary: 'Filter tab: Semua Bot (15), 4 Base, 6 Duo, 5 Sindikat (Trio & Master)' },
      { module: 'Zero-Token Runtime Engine', status: 'PROD', category: 'Architecture', summary: '100% deterministik kuantitatif klien tanpa mengonsumsi kuota token LLM' }
    ]
  },
  {
    id: 'pkg-19092026-v42',
    version: 'Package 19092026',
    semanticVersion: 'v4.2.0',
    date: '19 September 2026',
    status: 'STABLE',
    statusColor: '#38bdf8',
    badgeLabel: 'STABLE',
    title: 'Update Package 19092026 (v4.2 APEX): AI Agent Arena Genesis (4 Elements), Zero Simulation Policy, Post-Mortem Session 0 Archive & Resilient Session Timer',
    description: 'Fondasi peluncuran perdana AI Multi-Agent Arena: Memperkenalkan 4 agen kuantitatif elemen dasar (WATER, FIRE, AIR, EARTH) yang bertarung otonom, penegakan Zero Simulation Policy (eliminasi 100% synthetic tick delta demi data riil WebSocket Binance & Scanner TV), arsip post-mortem Sesi 0 Genesis (+Rp 255M PnL) serta evolusi DNA Gen 2, resilient uptime timer berbasis delta Date.now & visibilitychange, serta normalisasi TP/SL berbasis Dynamic Proportional ATR.',
    processFlow: [
      { step: '1. Tri-Signal Matrix', label: 'Wall St US Equities Added (18/09)' },
      { step: '2. Zero-Simulation Gate', label: 'Purge Synthetic Ticks (19/09)' },
      { step: '3. 4 Base Elements', label: 'WATER, FIRE, AIR, EARTH Genesis (19/09)' },
      { step: '4. Post-Mortem & Gen 2', label: 'Session 0 Debrief & Evolution (19/09)' }
    ],
    markdownContent: `
### 🚀 Pembaruan Akbar v4.2 APEX (Highlights 19/09)
- **Peluncuran Perdana AI Multi-Agent Arena (4 Elemen Dasar):**
  - Mengembangkan platform perdagangan otonom berbasis peramban dengan 4 kepribadian kuantitatif elemen inti:
    - 💧 **WATER:** Smart Money Concepts (SMC), Order Blocks & Liquidity Sweeps.
    - 🔥 **FIRE:** Event-driven momentum menangkap lonjakan volatilitas berita makro ekonomi.
    - 🌪️ **AIR:** High-Frequency Scalper & Donchian Channel trend breakout.
    - ⛰️ **EARTH:** Mean-reversion guardian memanfaatkan batas deviasi ekstrem Bollinger Bands 3 SD.
- **Penegakan Zero Simulation Policy Mutlak:**
  - Menghapus seluruh generator tick sintetis (*random fake ticks*) dan \`Math.random()\` dari pipeline harga.
  - Sinyal dan floating PnL 100% dihitung dari denyut data pasar nyata: Binance MiniTicker WebSocket (kripto) dan TradingView Scanner (saham IDX, US, Forex, Emas, Minyak).
  - Mengimplementasikan **Weekend Freeze** di mana kuotasi saham bursa konvensional terkunci rapi pada *Official Closing Price* tanpa deviasi palsu saat pasar tutup.
- **Arsip Sesi #0 Genesis & Institutional Quant Post-Mortem:**
  - Menyimpan rekapitulasi audit performa Sesi 0 (9.832 trade historis, total keuntungan bersih +Rp 255.462.417, win rate 21.0%).
  - Menyediakan modal telaah mendalam (*Institutional Post-Mortem Debrief*) yang menganalisis rasio Risk/Reward, frekuensi transaksi, dan pemicu Margin Call (MC).
  - Menginisiasi mutasi DNA agen menuju **Generasi 2 (Gen 2)** dengan parameter SL/TP trailing yang lebih adaptif.
- **Resilient Session Uptime Timer:**
  - Memperbaiki ketahanan timer durasi sesi arena menggunakan pelacak selisih waktu nyata (\`Date.now()\` delta tracking) dan pendengar event \`visibilitychange\` serta \`window.focus\`.
  - Jam sesi tetap berjalan akurat dan tidak melambat (*throttled*) ketika peramban pengguna berpindah tab atau berjalan di latar belakang.
- **Dynamic Proportional ATR & Position Normalizer:**
  - Menggantikan batas ATR statis dengan Dynamic Proportional ATR yang menyesuaikan volatilitas spesifik masing-masing instrumen (0.35% Forex, 1.0% Saham, 1.2% Kripto).
  - Melakukan normalisasi otomatis terhadap posisi lawas agar target TP dan batas keras Hard SL selalu berada pada rentang batas risiko institusional.
    `.trim(),
    table: [
      { module: '4 Elements Genesis Arena', status: 'PROD', category: 'AI Arena / Engine', summary: 'WATER, FIRE, AIR, EARTH autonomous algorithmic trading agents' },
      { module: 'Zero Simulation Enforcement', status: 'PROD', category: 'Data Integrity', summary: '100% data riil WebSocket Binance & TV Scanner; nol tick sintetis' },
      { module: 'Session 0 Post-Mortem Archive', status: 'PROD', category: 'Analytics / Audit', summary: 'Arsip audit 9.832 trade Genesis Sesi 0 (+Rp 255M PnL) & evaluasi MC' },
      { module: 'Gen 2 DNA Evolution', status: 'PROD', category: 'Reinforcement RL', summary: 'Adaptasi parameter DNA SL/TP trailing pasca evaluasi performa' },
      { module: 'Resilient Delta Uptime Timer', status: 'PROD', category: 'Telemetry', summary: 'Date.now delta tracking tahan sleep/background browser tabs' },
      { module: 'Dynamic Proportional ATR', status: 'PROD', category: 'Risk Management', summary: 'Penyesuaian TP/SL proporsional terhadap volatilitas riil per instrumen' },
      { module: 'Weekend Market Freeze Gate', status: 'PROD', category: 'Compliance', summary: 'Harga bursa konvensional terkunci pada official close saat libur' }
    ]
  },
  {
    id: 'pkg-18092026-v41',
    version: 'Package 18092026',
    semanticVersion: 'v4.1.0',
    date: '18 September 2026',
    status: 'STABLE',
    statusColor: '#38bdf8',
    badgeLabel: 'STABLE',
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
