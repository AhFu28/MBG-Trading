// Master Changelog Data Registry (Official Documentation & Release History)
// Arsitektur Terpadu Harian: Setiap entri mewakili SATU TANGGAL KALENDER secara utuh dan runtut.

export const CHANGELOG_DATA = [
  {
    "id": "pkg-27092026",
    "sprintLabel": "Sprint 14 (Quantitative Audit Refactoring & Introspection)",
    "version": "Package 27092026",
    "semanticVersion": "v5.6.0",
    "date": "27 September 2026",
    "status": "LATEST",
    "statusColor": "var(--accent-green)",
    "badgeLabel": "LATEST / AUDIT REFACTOR & AI REFLECTION",
    "title": "Update v5.6.0: Multi-Agent Audit Modal Ergonomics, Net Realized Alpha Metric, AI Agent Self-Reflection Protocol & Streamlined Navigation",
    "description": "Penyempurnaan ergonomi dan integritas audit multi-agent arena: Penghapusan kolom redundant 'ALOKASI MODAL' untuk memperluas ruang metrik kinerja (+110px), eliminasi prefiks kaku tab bot ('TAB 1:' diganti '📋 RECAP ARENA' & avatar elemen bot ringkas), penggantian metrik semu 'Total Arena Equity' menjadi 'NET REALIZED PnL (ARENA)' yang mengukur akumulasi alpha bersih riil terhadap modal basis, pembersihan grafik simulasi candlestick statis duplikatif, integrasi protokol introspeksi diri AI (AI Agent Self-Reflection) pasca-Margin Call untuk seluruh 16 bot trading, serta pembersihan kartu arsitektur modal RPG statis.",
    "processFlow": [
      {
        "step": "1. Audit Modal Ergonomics",
        "label": "Pencabutan kolom Alokasi Modal memperluas ruang metrik performa (+110px)"
      },
      {
        "step": "2. Streamlined Tab Navigation",
        "label": "Rampingisasi tab review: '📋 RECAP ARENA' dan avatar elemen + nama bot ringkas"
      },
      {
        "step": "3. Net Realized Alpha Metric",
        "label": "Penggantian Total Equity semu dengan Net Realized PnL (ARENA) & Net ROI riil"
      },
      {
        "step": "4. AI Self-Reflection Protocol",
        "label": "Integrasi monolog introspeksi diri AI generator (getAgentSelfReflection) pasca Margin Call"
      },
      {
        "step": "5. Architecture & Chart Cleanup",
        "label": "Pembersihan grafik simulasi duplikatif dan kartu RPG 4-elemen statis dari audit modal"
      }
    ],
    "markdownContent": "\n### 🏛️ v5.6.0 — Multi-Agent Audit Modal Ergonomics, Net Realized Alpha Metric & AI Agent Self-Reflection Protocol\n\n#### 🧹 1. Dekonstruksi & Pembersihan Modal Audit Multi-Agent\n- **Pencabutan Kolom Alokasi Modal:** Menghapus kolom redundant `ALOKASI MODAL` yang menampilkan angka statis seragam (`Rp 1.000.000 Sovereign 100%`) di setiap baris tabel. Memberikan ekspansi ruang horizontal sebesar ~110px untuk kolom Strategi, Win Rate, dan Profit Factor.\n- **Rampingisasi Navigasi Tab Bot:** Mengeliminasi prefiks kaku `TAB 1:` dan `TAB X:`. Tab 1 bertransformasi menjadi `📋 RECAP ARENA`, dan tab bot disajikan ringkas dengan avatar elemen + nama bot (e.g., `🌊 WATER 15x MC`), menghemat ruang horizontal dan meminimalkan scrolling.\n- **Eliminasi Grafik Simulasi Candlestick Duplikatif:** Memindahkan chart simulasi statis entry/TP/SL dari modal audit kinerja ke tempat aslinya di Modal Profil & Filosofi, menjaga fokus modal audit murni pada pembuktian empiris riil.\n\n#### 📊 2. Transformasi Metrik 'Total Arena Equity' ke 'Net Realized PnL (ARENA)'\n- **Penyembuhan Ilusi Angka Semu:** Mengganti metrik ekuitas arena yang bias akibat injeksi saldo berulang saat respawn (Margin Call berkali-kali) dengan `NET REALIZED PnL (ARENA)`.\n- **Penghitungan Alpha Riil:** Menghitung secara dinamis total laba/rugi bersih yang terealisasi dari seluruh tiket tertutup arena dengan kalkulasi Net ROI terhadap total modal basis arena.\n\n#### 🧠 3. Integrasi Refleksi Diri AI Pasca-Margin Call (AI Agent Self-Reflection)\n- **AI Agent Self-Reflection Generator (`getAgentSelfReflection`):** Membangun modul introspeksi kepribadian algoritma untuk seluruh 16 bot trading (WATER, FIRE, AIR, EARTH, STEAM, STORM, MUD, LIGHTNING, LAVA, SANDSTORM, TEMPEST, OCEANIC, GEOTHERMAL, CYCLONE, AVATAR, CHAOS).\n- **Kartu Post-Mortem Monolog AI:** Menampilkan monolog evaluasi kegagalan AI secara jujur dan transparan saat bot mengalami likuidasi (analisis false sweep, news slippage, ranging squeeze, atau relentless trend) dan ikrar parameter mutasi DNA untuk generasi berikutnya.\n- **Status Operasional Prima Gen 0:** Menyediakan kartu refleksi kedisiplinan parameter bagi bot yang masih bertahan di Generasi Genesis tanpa kebangkrutan.\n\n#### 🛡️ 4. Pembersihan Komponen Arsitektur RPG Statis\n- Menghapus kartu statis 4-elemen lawas dari Tab Recap yang sudah tidak sinkron dengan portofolio 16-agent arena aktif.\n"
  },
  {
    "id": "pkg-26092026",
    "sprintLabel": "Sprint 13 (24/7 Autonomous Arena Continuous Engine & Zero-Dependency Execution)",
    "version": "Package 26092026",
    "semanticVersion": "v5.5.4",
    "date": "26 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / PUBLIC REPO & 24/7 CONTINUOUS RUNNER",
    "title": "Update v5.5.4: Public Repository Migration, Unlimited Cloud CI/CD & 24/7 Autonomous Multi-Tick Trading Runner",
    "description": "Migrasi repositori AhFu28/MBG-Trading ke status Public dengan kuota komputasi GitHub Actions unlimited bebas batas, standalone zero-dependency Python runner (arena_runner_247.py) berbasis library bawaan urllib tanpa pip install, multi-tick micro-loop 30 detik untuk 16 bot serempak, jadwal cron off-peak per 5 menit dengan proteksi git rebase retry loop, dan sinkronisasi client hydration instan.",
    "processFlow": [
      {
        "step": "1. Public Repo Migration",
        "label": "Repositori berstatus Public membuka kuota GitHub Actions 100% UNLIMITED"
      },
      {
        "step": "2. Zero-Dependency Runner",
        "label": "Runner otonom arena_runner_247.py murni stdlib Python urllib tanpa pip install"
      },
      {
        "step": "3. Continuous Multi-Tick Loop",
        "label": "Evaluasi micro-loop 30 detik per job runner untuk 16 bot tanpa bottleneck"
      },
      {
        "step": "4. Resilient Git Rebase Pipeline",
        "label": "Workflow arena_247_engine.yml cron 5 menit off-peak dengan 3x retry rebase push"
      },
      {
        "step": "5. Client Hydration Instant Sync",
        "label": "Sinkronisasi posisi & jurnal otomatis saat aplikasi web dibuka pengguna"
      }
    ],
    "markdownContent": "\n### ⚡ v5.5.4 — Public Repository Migration, Unlimited Cloud CI/CD & 24/7 Autonomous Multi-Tick Runner\n\n#### 🌐 1. Migrasi Repositori Public & Kuota Komputasi Unlimited\n- **Sovereign Public Status:** Repositori `AhFu28/MBG-Trading` resmi berstatus Public, membuka hak akses komputasi GitHub Actions 100% UNLIMITED & bebas batas kuota 2.000 menit/bulan.\n- **Due Diligence Security Audit:** Terverifikasi file `.env` lokal 100% terlindungi oleh `.gitignore` dan 0 secrets/API keys pernah terekspos di seluruh riwayat commit.\n\n#### ⚡ 2. Standalone Zero-Dependency Arena Engine (`arena_runner_247.py`)\n- **Standard Library Urllib Streaming:** Membangun modul runner otonom yang berjalan murni menggunakan pustaka bawaan Python (`urllib.request`), menghilangkan kebutuhan `pip install` berat dan memangkas waktu *cold-boot* di cloud runner menjadi <3 detik.\n- **Continuous Multi-Tick Micro-Loop:** Menjalankan evaluasi berulang setiap 30 detik dalam window 4 menit per job runner untuk 16 AI Trading Agents tanpa jeda round-robin.\n- **Friction & Ratchet Parity:** Menjaga integritas deduksi fee bursa Bitget 0.12% dan dynamic ratchet trailing stop (40% distance ke TP1 mengunci 30% profit).\n\n#### 🔄 3. Dedicated High-Frequency Workflow (`arena_247_engine.yml`)\n- **Off-Peak Cron Schedule:** Mengaktifkan jadwal cron per 5 menit pada menit ganjil/off-peak (`2,7,12,17,22,27,32,37,42,47,52,57 * * * *`) untuk menghindari antrian delay server GitHub Actions.\n- **Resilient Git Rebase Retry Loop:** Menambahkan proteksi `git pull --rebase -X theirs origin main && git push` dengan loop 3x retry untuk mencegah kegagalan commit non-fast-forward akibat benturan *concurrent push*.\n- **Client Hydration Instant Sync:** Frontend web secara otomatis membaca state cloud terbaru dan menggabungkan posisi serta riwayat trade yang terjadi selama pengguna offline.\n"
  },
  {
    "id": "pkg-25092026-r1",
    "sprintLabel": "Sprint 7 (Production Hardening & Reconciled Telemetry)",
    "version": "Package 25092026-R1",
    "semanticVersion": "v5.5.3",
    "date": "25 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / PRODUCTION HARDENED & RECONCILED",
    "title": "Update v5.5.3: Institutional US Equities Registry, Reconciled Paper Portfolio Bookkeeping, Stable SVG IDs, Theme-Aware Tables & CSP Security Headers",
    "description": "Perbaikan komprehensif audit forensik tahap 4: Integrasi registry metadata institusional untuk 31 saham mega-cap Wall Street (kapitalisasi pasar riil, rasio P/E aktual, nama korporat), rekonsiliasi matematis pembukuan portofolio forward-test (30 tiket selesai [6M/24K] + 52 posisi aktif + 33 antrean = 115 total tiket terverifikasi dengan win rate 20.0%), eliminasi DOM churn SVG sparkline via React useId(), pemulihan kontras tabel mode terang (Light Theme), penerapan Content Security Policy (CSP) ketat pada Cloudflare Pages, serta otomasi notifikasi kegagalan workflow GitHub Actions via Telegram.",
    "processFlow": [
      {
        "step": "1. Institutional US Equities Registry (H-05)",
        "label": "Pemetaan metadata fundamental 31 saham Wall Street (nama korporat, market cap multi-triliun riil, rasio P/E) tanpa dependensi API eksternal"
      },
      {
        "step": "2. Reconciled Paper Portfolio Bookkeeping (M-07)",
        "label": "Rekonsiliasi matematis statistik portofolio simulasi (30 ditutup [6W/24L] + 52 aktif + 33 antrean = 115 total) dengan standardisasi win_rate_pct 20.0%"
      },
      {
        "step": "3. Stable SVG Sparkline ID Generation (L-01)",
        "label": "Penggantian Math.random() dengan React useId() pada linearGradient SparklineChart melenyapkan DOM invalidation churn"
      },
      {
        "step": "4. Theme-Aware Contrast & CSP Protection (M-03 & L-02)",
        "label": "Penyelarasan kontras header tabel quant di tema terang serta injeksi Content-Security-Policy & Permissions-Policy di headers Cloudflare Pages"
      },
      {
        "step": "5. Automated CI/CD Failure Alerting (L-03)",
        "label": "Penambahan conditional Telegram failure alert step pada seluruh workflow GitHub Actions engine"
      }
    ],
    "markdownContent": "\n### 🏛️ v5.5.3 — Production Hardening, Fundamental Registry & Reconciled Bookkeeping\n\n#### 🇺🇸 1. Registry Fundamental Saham Wall Street (H-05)\n- **Metadata Mega-Cap Institusional:** 31 saham unggulan Wall Street (AAPL, MSFT, NVDA, GOOGL, AMZN, dsb.) kini dilengkapi metadata fundamental riil mencakup nama resmi emiten, kapitalisasi pasar triliunan dolar terkini, dan rasio P/E konsensus. Ticker tanpa histori teknikal ditandai RSI netral (50.0) secara transparan.\n\n#### 📊 2. Rekonsiliasi Matematika Portofolio Forward-Test (M-07)\n- **Presisi Buku Besar:** Seluruh agregasi statistik paper trading kini saling mengunci: 30 trade tertutup (6 Menang + 24 Kalah) + 52 trade aktif + 33 tiket pending = 115 total tiket. Rasio kemenangan distandarkan menjadi `win_rate_pct: 20.0%` (bukan desimal 0.2%).\n- **Arsitektur Pipeline:** Menambahkan alias method `get_portfolio_summary` pada engine Python untuk menjamin sinkronisasi otomatis bundle harian.\n\n#### ⚡ 3. Optimasi DOM & Performa Render Grafis (L-01)\n- **Stable React useId():** Komponen SparklineChart di AiAgentArenaTab kini menggunakan hook `useId()` deterministik untuk ID linearGradient SVG, melenyapkan DOM redraw churn akibat `Math.random()` pada setiap detik pembaruan harga.\n\n#### 🎨 4. Kontras Header Tabel & Keamanan Web Modern (M-03 & L-02)\n- **Dukungan Tema Terang Optimal:** Kelas CSS `.quant-table th` kini terikat ke variabel tema `--bg-panel-subtle`, `--text-muted`, dan `--border-hairline`, memastikan keterbacaan sempurna di tema gelap maupun terang.\n- **CSP & Permissions Headers:** File headers Cloudflare Pages diperkaya dengan `Content-Security-Policy`, `Permissions-Policy`, dan proteksi `X-Content-Type-Options: nosniff` yang aman untuk WebSocket Binance dan feed TradingView.\n\n#### 🔔 5. Pemantauan Pipeline GitHub Actions (L-03)\n- **Notifikasi Kegagalan Telegram:** Seluruh 6 alur kerja cron/dispatch di `.github/workflows/` kini memiliki hook conditional `if: failure()` untuk mengirimkan alert otomatis ke kanal Telegram pengelola jika terjadi kendala pada engine komputasi.\n"
  },
  {
    "id": "pkg-24092026",
    "sprintLabel": "Sprint 5 & 6 (Terpadu) — Compliance, Forensics Hardening & Telemetry Alignment",
    "version": "Package 24092026 (v5.4.0 → v5.5.2)",
    "semanticVersion": "v5.5.2",
    "date": "24 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / 4 SESI TERPADU",
    "title": "Rilis Akbar 24 September 2026: Compliance Audit, UI Canvas Restoration, Centralized Data Integrity, Live Forex Sync & Unified Pricing",
    "description": "Rekapitulasi terpadu seluruh 4 sesi pengembangan pada tanggal 24 September 2026: Sesi 1 Dini Hari (Compliance Zero Simulation Policy & Restorasi Lebar Kanvas Edukasi), Sesi 2 Siang (Modal Audit Integritas Data 6-Jalur & Saringan Stablecoin), Sesi 3 Sore (Sinkronisasi Kurs USD/IDR Live & Transparansi Model Broker), dan Sesi 4 Malam (Unifikasi Batas Harga Emas, Persistensi Sesi 24 Jam & Pip Dinamis JPY).",
    "processFlow": [
      {
        "step": "1. Compliance & Full-Width Layout (v5.4.0)",
        "label": "Sertifikasi Zero Simulation Policy & restorasi kanvas pembelajaran 100% full-width"
      },
      {
        "step": "2. Data Integrity Modal & Crypto Filter (v5.5.0)",
        "label": "Drawer verifikasi 6 sumber data riil, saringan stablecoin & lot kalkulator short"
      },
      {
        "step": "3. Live USD/IDR & Timezone Alignment (v5.5.1)",
        "label": "Sinkronisasi kurs USD/IDR live, penyembuhan WebSocket drop & jam Asia/Jakarta"
      },
      {
        "step": "4. Unified Gold & 24H Session TTL (v5.5.2)",
        "label": "Sanity check emas $1.800–$3.500, sesi tahan reload 24 jam & formula pip JPY dinamis"
      }
    ],
    "markdownContent": "\n### 🏛️ Rekapitulasi Rilis Akbar 24 September 2026 (4 Sesi Rilis)\n\n---\n\n### 🌅 Sesi 1 (Dini Hari) — Update v5.4.0: Compliance Audit & UI/UX Full-Width Canvas Restoration\n- **Zero Simulation Policy:** Terverifikasi 100% bebas dari `Math.random()` artifisial pada data pasar dan logika edukasi akademi.\n- **Security & Secret Leak Prevention:** Audit menyeluruh memverifikasi tidak ada API key, token rahasia, maupun kredensial privat yang terekspos.\n- **Level 5 FVG & Sweep Playground:** Menggantikan duplikasi OrderBook dengan kanvas interaktif Fair Value Gap 3-candle dan simulasi animasi sapuan likuiditas 4 tahap.\n- **Modul 3.3 Supercycle Sine Wave:** Visualisasi interaktif siklus komoditas 4 fase (Under-investment, Windfall Boom, Capex Glut, Crash) dengan rekomendasi alokasi aset.\n- **Restorasi Lebar Kanvas Edukasi (.quant-academy-main-grid):** Mengunci sidebar modul pada `280px` (sticky) dan mengalokasikan seluruh sisa ruang layar untuk materi pembelajaran hingga `1680px` full-width.\n\n---\n\n### ☀️ Sesi 2 (Siang) — Update v5.5.0: Pre-Launch Forensics Hardening & Centralized Data Integrity\n- **Modal Audit Integritas Data (Data Integrity & Provenance Modal):** Drawer telemetri transparan 6 sumber data (Macro Bundle, IDX BEI, Binance WebSocket, Valuta Global/CFD, Kurs USD/IDR, Gemini LLM).\n- **Filter Pasangan Stablecoin:** Saringan ketat (`USDC`, `FDUSD`, `TUSD`, `DAI`, dll) pada loop Binance spot agar terminal tidak mengeluarkan trade plan artifisial.\n- **Sanity Clamping R:R:** Membatasi rasio Risk/Reward antara 0.2x hingga 20.0x untuk mencegah anomali rasio ekstrem.\n- **Short-Order Lot Calculator:** Memperbaiki bug kalkulator lot di mana posisi Short (`SL > Entry`) sebelumnya menghasilkan 0 lot.\n- **Kepatuhan Regulasi & Backtest Non-Advisory:** Modal persetujuan risiko first-run dan banner transparansi simulasi backtest hipotetis.\n\n---\n\n### 🌇 Sesi 3 (Sore) — Update v5.5.1: Live USD/IDR Sync, WebSocket Gap Healing & Telemetry Alignment\n- **Live USD/IDR Feed:** Kuotasi live pasangan `USDTIDR` dari Binance Vision dan `FX_IDC:USDIDR` dari TradingView Scanner ke dalam penyimpanan terpusat `livePrices` dengan sinkronisasi ke `AiAgentArenaTab`.\n- **Penyembuhan Drop REST:** Pembaruan kuotasi REST yang diperbolehkan me-refresh instrumen eksis saat kuotasi kedaluwarsa >3 detik.\n- **Transparansi Broker Flow:** Badge mencolok `ESTIMATED FLOW (QUANT MODEL)` pada header tabel Smart Money Accumulation serta tag `[EST]` pada kode broker emulasi.\n- **Penegakan Jam WIB:** Opsi eksplisit `{ timeZone: 'Asia/Jakarta' }` pada seluruh parser tanggal (berita makro, header sistem forex, dan feed radar paus).\n- **Pengekangan Alarm Taktis:** Banner peringatan pertahanan taktis terikat ketat pada skor level DEFCON (`<= 3`) dan tingkat keparahan krisis bundle.\n\n---\n\n### 🌙 Sesi 4 (Malam) — Update v5.5.2: Unified Gold Bullion Pricing & 24H Session TTL Persistence\n- **Unifikasi Batas Harga Emas (H-04):** Sanity check ketat kuotasi emas dunia ($1.800 – $3.500) melenyapkan anomali kuotasi $4.381 dan fallback usang $272, dialihkan ke kuotasi spot aktual ~$2.650.\n- **Persistensi Sesi Otentikasi 24 Jam (M-04):** Penyimpanan sesi di `localStorage` dengan penanda `expiresAt` berbasis 24 jam mencegah logout tiba-tiba saat reload halaman.\n- **Kalender Makro Fokus Rilis Mendatang (M-05):** Default kalender makro menyaring event ke status `UPCOMING` berprioritas tinggi.\n- **Pip Dinamis JPY & Seleksi Agen Stabil (M-10 & M-11):** Rumus standar pasar interbank `(100.000 unit × 0.01) / Harga Entry` untuk valuta pasangan JPY dan seed hash deterministik 5 menit anti-jitter.\n"
  },
  {
    "id": "pkg-23092026",
    "version": "Package 23092026 (v5.0.0 → v5.3.0)",
    "semanticVersion": "v5.3.0",
    "date": "23 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / 4 SESI TERPADU",
    "title": "Rilis Akbar 23 September 2026: Institutional Cockpit Refinement, Tactical Defense, Symmetrical HUD & 6-Level Quant Academy Masterclass",
    "description": "Rekapitulasi terpadu seluruh 4 sesi pengembangan pada tanggal 23 September 2026 yang dirangkum secara runtut: Sesi 1 Pagi (AI Sentinel Desk & DEFCON Threat Barometer), Sesi 2 Siang (Quant Engine v3.0, Deflated Sharpe Ratio & MCP Server), Sesi 3 Sore (Symmetrical 50/50 Cockpit Alignment & 14-Category News Wire), dan Sesi 4 Malam (Transformasi 6-Level Masterclass Quant Academy & SVG Sandbox Suite).",
    "processFlow": [
      {
        "step": "1. Sesi Pagi (v5.0.0)",
        "label": "Sentinel Desk Macro, DEFCON Threat Barometer, Live News Synthesis & Explainable AI Arena"
      },
      {
        "step": "2. Sesi Siang (v5.1.0)",
        "label": "Jev-Trade Execution HUD, OpenQuant Strategy Contracts, DSR Validation & Local MCP Server"
      },
      {
        "step": "3. Sesi Sore (v5.2.0)",
        "label": "Symmetrical 50/50 Cockpit Alignment, 4-Barometer HUD, Nuclear Alert & 14-Category News Wire"
      },
      {
        "step": "4. Sesi Malam (v5.3.0)",
        "label": "6-Level Masterclass (20 Modul), Dam Simulator SVG, Crisis Charts, Order Book & Risk Desk"
      }
    ],
    "markdownContent": "\n### 🏛️ Rekapitulasi Rilis Akbar 23 September 2026 (4 Sesi Rilis)\n\n---\n\n### 🌅 Sesi 1 (Pagi) — Update v5.0.0: Institutional AI Desk & DEFCON Threat Barometer\n- **Sentinel Desk Macro & Geopolitical:** Tab baru `AiIntelligenceDrawer.jsx` yang memantau risiko sistemik global secara real-time.\n- **DEFCON Computed Threat Barometer:** Skala ancaman makro kuantitatif (0.00 - 1.00) dengan simulasi skenario What-If (*Oil Shock, Fed 50 bps Hike, Taiwan Strait Blockade*).\n- **Explainable AI Agent Arena:** Panel transparansi keputusan 16 bot trading (Weight allocation, EXP3 probability, reasoning text).\n- **Live News Research Synthesis:** Agregasi berita 12 sumber kredibel dengan estimasi probabilitas skenario pasar.\n\n---\n\n### ☀️ Sesi 2 (Siang) — Update v5.1.0: Institutional Quant Engine, DSR & Local MCP Server\n- **Jev-Trade Execution HUD:** Parameter eksekusi order institusional (TWAP, VWAP, POV, Implementation Shortfall).\n- **OpenQuant Strategy Contracts:** Standardisasi kontrak strategi berbasis schema formal (`strategy_spec.json`).\n- **Deflated Sharpe Ratio (DSR):** Filter over-fitting berbasis matematika Marcos López de Prado untuk mengeliminasi p-hacking pada backtesting.\n- **QuantDinger Local-First MCP Server:** Server MCP lokal (`engine/mcp/mbg_server.py`) dengan 5 tool analitik teruji 100% pass unit test.\n- **Interactive Math Lab Sandbox:** Laboratorium visual pengujian formula quant secara langsung di browser.\n\n---\n\n### 🌇 Sesi 3 (Sore) — Update v5.2.0: Symmetrical 50/50 Cockpit, Defense Alert & News Wire\n- **Symmetrical 50/50 Cockpit Alignment:** Menyeimbangkan pembagian garis vertikal antara *Smart Money Order Flow* (kiri) dan *Bandarmology Radar* (kanan).\n- **4-Barometer Top Row HUD:** Barometer Likuiditas Makro, Kurva Imbal Hasil (10Y-2Y), Hedge Fund Portfolio Risk, dan Factor Radar dipadatkan secara elegan di baris teratas.\n- **Tactical Defense & Nuclear Alert HUD:** Integrasi radar ancaman geopolitik (terinspirasi WorldMonitor & God's Eye View) dengan peringatan visual eskalasi nuklir/militer.\n- **Restorasi 14-Category News Wire:** Mengembalikan seluruh 14 kategori berita pasar lengkap dengan filter tab horizontal cepat.\n- **Standardisasi Bilingual:** Istilah-istilah keuangan ganjil dalam Bahasa Indonesia distandardisasi dengan padanan istilah institusional global yang tepat.\n\n---\n\n### 🌙 Sesi 4 (Malam) — Update v5.3.0: 6-Level Masterclass (20 Modul) & SVG Sandbox Suite\n- **Kurikulum 6 Level Berstandar Hedge Fund:** Transformasi kurikulum Quant Academy menjadi program pelatihan analis bertahap (Point72 / Bridgewater Associates):\n  * **Level 1 (Mekanisme Mesin Uang Dunia):** Uang fiat, bendungan likuiditas, hegemoni Dolar (Petrodollar), dan suku bunga termostat.\n  * **Level 2 (Transmisi Makro & Sejarah Krisis):** Pohon kausalitas 8 langkah The Fed dan bedah 5 krisis besar (1997, 2008, 2013, 2020, 2022).\n  * **Level 3 (Anatomi 5 Instrumen & Fundamental):** Saham, Obligasi, Forex, Komoditas, Kripto; arus kas operasional riil vs laba akrual; serta siklus komoditas.\n  * **Level 4 (Mikrostruktur & Bandarmology):** Lelang buku order (Limit vs Market), ekosistem BEI, 4 fase Wyckoff, dan jebakan dividen komoditas ($PTBA).\n  * **Level 5 (Analisis Teknikal & Likuiditas):** Auction theory, zona likuiditas sejati, magnet 50% Fair Value Gap, dan sapuan stop loss.\n  * **Level 6 (Risk Desk & Psikologi Hedge Fund):** Asimetri drawdown, kalkulator lot diskrit BEI anti-bangkrut 1-2%, R:R minimal 1:2, dan pre-flight checklist.\n- **Suite Visual Interaktif SVG:**\n  * **SVG Dam Simulator (Level 1):** Waduk likuiditas bank sentral dengan slider pintu air ke 4 kolam aset.\n  * **Domino Stepper (Level 2):** 8 tahap transmisi kebijakan The Fed ke bursa domestik dengan tombol langkah demi langkah.\n  * **Crisis Line Chart (Level 2):** Trajektori grafik SVG 4 krisis besar (1997, 2008, 2013, 2020) dengan titik panik dan rebound.\n  * **Timbangan Kas vs Laba (Level 3):** Deteksi rekayasa laba akuntansi vs arus kas operasional nyata.\n  * **Order Book Depth Ladder & Spoofing (Level 4):** Simulasi pasang antrian palsu 50.000 lot dan sapuan market order paus.\n  * **Dividend Trap Sandbox (Level 4):** Kalkulator pemilihan waktu beli saham dividen tinggi vs risiko gap down.\n  * **Visual Execution Bracket (Level 6):** Bracket posisi visual Entry, SL, dan TP dengan rasio R:R terkontrol.\n  * **Pre-Flight Launch Scorecard (Level 6):** Checklist keselamatan 5 protokol sebelum membuka posisi.\n"
  },
  {
    "id": "pkg-22092026",
    "version": "Package 22092026",
    "semanticVersion": "v4.9.0",
    "date": "22 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / LITERATURE & L2 ORDER BOOK",
    "title": "Update v4.9.0: AI Multi-Agent Arena Literature Alignment (16 Buku Finansial), Level-2 Order Book Simulator & Smoke Test Suite",
    "description": "Penyelarasan menyeluruh filosofi 16 bot trading AI ke 16 buku teks finansial dan quant terkemuka (López de Prado, Carver, Bulkowski, Murphy, Kathy Lien), pembangunan simulator interaktif Level-2 Order Book Microstructure, dan pengerasan build produksi.",
    "processFlow": [
      {
        "step": "1. Literature Alignment",
        "label": "Penyelarasan filosofi bot ke 16 buku keuangan institusional terkemuka"
      },
      {
        "step": "2. L2 Order Book Depth",
        "label": "Simulator antrian bid/ask, spoofing order palsu, dan metrik order imbalance"
      },
      {
        "step": "3. Dependency Fix",
        "label": "Resolusi dependensi melingkar antar-modal dialog"
      },
      {
        "step": "4. Build & Smoke Test",
        "label": "Verifikasi kompilasi produksi Vite dan integritas antarmuka"
      }
    ],
    "markdownContent": "\n### 📚 v4.9.0 — Literature Alignment & L2 Order Book Microstructure\n\n#### 🧠 1. Multi-Agent Arena Literature Alignment (16 Buku Finansial)\n- **Penyelarasan Literatur Resmi:** Mengaudit dan menghubungkan filosofi trading 16 bot autonomous langsung ke literatur akademis dan profesional:\n  * **John J. Murphy (1999):** *Technical Analysis of the Financial Markets* — pondasi chart pattern & intermarket analysis.\n  * **Marcos López de Prado (2018):** *Advances in Financial Machine Learning* — validasi Deflated Sharpe Ratio (DSR) & meta-labeling.\n  * **Robert Carver (2015):** *Systematic Trading* — manajemen posisi berbobot volatilitas & alokasi portofolio terukur.\n  * **Thomas N. Bulkowski:** *Fundamental Analysis and Position Trading* — statistik keandalan pola harga & breakout.\n  * **Mario Singh & Kathy Lien:** *Currency & Macro Trading* — transmisi suku bunga global & dinamika carry trade valas.\n  * **Abdulkader Aljandali:** *Quantitative Analysis and Statistics for Finance* — model regresi multivariat & uji kointegrasi.\n\n#### 📊 2. Level-2 Order Book Microstructure Simulator\n- **Komponen `OrderBookSimulator.jsx`:** Simulator interaktif mikrostruktur buku order L2 dengan kedalaman antrian bid/ask dinamis.\n- **Spoofing & Imbalance Radar:** Menghitung rasio ketidakseimbangan order buy vs sell (*Order Flow Imbalance*) dan mendeteksi spoofing bandar.\n\n#### 🛡️ 3. Smoke Test Suite & Build Hardening\n- Validasi build produksi Vite tanpa circular dependency.\n- Optimasi pemuatan modal TradingView dan kalender ekonomi.\n"
  },
  {
    "id": "pkg-21092026",
    "version": "Package 21092026 (v4.6.0 → v4.8.0)",
    "semanticVersion": "v4.8.0",
    "date": "21 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / 3 SESI TERPADU",
    "title": "Rilis Akbar 21 September 2026: AI Multi-Agent Integrity Refactor, Live USD/IDR Sync, Agent 16 CHAOS & Season 0.1 Calibration",
    "description": "Rekapitulasi terpadu rilis 21 September 2026 yang menggabungkan: Sesi 1 (Peluncuran Bot 16 CHAOS [The Rogue Singularity] & Genetic Rebirth), Sesi 2 (Engine Refactor Zero Side-Effects & Kurs Riil USD/IDR), dan Sesi 3 (Season 0.1 Auto-Label Calibration & Pair Recap Breakdown).",
    "processFlow": [
      {
        "step": "1. Sesi A (v4.6.0)",
        "label": "Agent 16 CHAOS, Carpet-Bomb Scalping, Self-Sovereign Ledger & Genetic Rebirth"
      },
      {
        "step": "2. Sesi B (v4.7.0)",
        "label": "AI Arena Engine Integrity Refactor, Zero Side-Effects Loop, Live USD/IDR Sync & WCAG Polish"
      },
      {
        "step": "3. Sesi C (v4.8.0)",
        "label": "Auto-Label Sesi Kalibrasi #0.1, Pair Recap Sub-Tab dengan Long/Short Breakdown & Bugfix"
      }
    ],
    "markdownContent": "\n### ⚡ Rekapitulasi Rilis Akbar 21 September 2026 (3 Sesi Rilis)\n\n---\n\n### 🚀 Sesi A — Update v4.6.0: Agent 16 CHAOS [The Rogue Singularity]\n- **Peluncuran Agent 16 CHAOS:** Bot ke-16 dengan filosofi rogue scalper independen yang agresif mengeksploitasi anomali volatilitas mikro.\n- **Unlimited Carpet-Bomb Scalping:** Algoritma scalping berfrekuensi tinggi dengan ukuran posisi terfragmentasi.\n- **Self-Sovereign Ledger & Genetic Rebirth:** Sistem pencatatan saldo mandiri per-bot dan mekanisme reset genetik saat terjadi drawdown berlebih.\n\n---\n\n### 🛠️ Sesi B — Update v4.7.0: AI Arena Engine Integrity & Live USD/IDR Sync\n- **Zero Side-Effects Loop:** Refaktor arsitektur state management arena AI untuk mencegah re-render berlebih dan race condition.\n- **Sinkronisasi Kurs Riil USD/IDR:** Seluruh metrik PnL dan alokasi modal dikonversi secara real-time ke Rupiah dengan kurs live Bank Indonesia / pasar spot.\n- **Dynamic KPIs & WCAG UI/UX Hardening:** Penyesuaian kontras rasio warna kartu bot dan indikator telemetri sesuai standar aksesibilitas WCAG.\n\n---\n\n### 🎯 Sesi C — Update v4.8.0: Season 0.1 Auto-Label Calibration & Pair Recap\n- **Auto-Label Sesi Kalibrasi #0.1:** Penandaan otomatis sesi trading kalibrasi historis untuk membedakan fase pengujian awal dengan eksekusi live.\n- **Pair Recap Sub-Tab:** Analisis performa per pasangan aset (IDX, Kripto, Forex) dengan pemisahan win-rate posisi Long vs Short.\n- **Perbaikan Auto-Start Bug:** Mengeliminasi bug timer yang sempat menghalangi inisialisasi bot arena secara otomatis saat halaman dimuat.\n",
    "table": [
      {
        "module": "Zero Side-Effects Engine",
        "status": "PROD",
        "category": "Architecture / Core",
        "summary": "Pure simulation loop dengan batch sequential dispatch"
      },
      {
        "module": "Live Dynamic USD/IDR",
        "status": "PROD",
        "category": "Quant / Exchange",
        "summary": "Sinkronisasi nilai tukar di 41 titik kalkulasi via usdToIdrRef"
      },
      {
        "module": "Dynamic KPI Metrics",
        "status": "PROD",
        "category": "Analytics / Math",
        "summary": "Sharpe ratio, running MDD, dan Win Rate dinamis dari data jurnal"
      },
      {
        "module": "Collision-Proof Trade IDs",
        "status": "PROD",
        "category": "Data Integrity",
        "summary": "Pencegahan duplikasi ID transaksi via timestamp Date.now()"
      },
      {
        "module": "WCAG ARIA Modal Dialogs",
        "status": "PROD",
        "category": "Accessibility / A11y",
        "summary": "Role dialog, aria-modal, dan labelledby pada 7 modal"
      },
      {
        "module": "Toast Stack Notification",
        "status": "PROD",
        "category": "UI / UX",
        "summary": "Queue multi-toast max 3 stack dengan slide-in animation"
      },
      {
        "module": "Touch Target Optimization",
        "status": "PROD",
        "category": "Ergonomics / Mobile",
        "summary": "Minimal tinggi tombol >= 24-26px dan typography floor >= 8px"
      },
      {
        "module": "Agent 16 CHAOS",
        "status": "PROD",
        "category": "AI Arena / Agents",
        "summary": "The Rogue Singularity Anomaly Agent (☣️ #a855f7)"
      },
      {
        "module": "Unlimited Carpet Bomb",
        "status": "PROD",
        "category": "Quant / Scalping",
        "summary": "Multi-position layering tanpa batasan kuantitas tiket"
      },
      {
        "module": "Self-Sovereign Ledger",
        "status": "PROD",
        "category": "Risk Management",
        "summary": "Modal terisolasi Rp 1M/bot, Total AUM dinamis Rp 16M"
      },
      {
        "module": "Genetic Auto-Rebirth",
        "status": "PROD",
        "category": "Evolution / Learning",
        "summary": "Auto-audit toxic pair, mutasi DNA, dan respawn Gen N+1"
      },
      {
        "module": "Deck Tab Anomaly",
        "status": "PROD",
        "category": "UI / Navigation",
        "summary": "Filter tab dedicated untuk mengisolasi Agen CHAOS"
      }
    ]
  },
  {
    "id": "pkg-20092026-v45",
    "version": "Package 20092026",
    "semanticVersion": "v4.5.0",
    "date": "20 September 2026",
    "status": "COMPLETED",
    "statusColor": "var(--accent-blue)",
    "badgeLabel": "STABLE RELEASE",
    "title": "Update Package 20092026 (v4.5 APEX): AI Multi-Agent Arena (15 Elemental Syndicate Bots), Locked 4-Column Deck, Independent Capital Ledger & Dynamic Sizing",
    "description": "Peluncuran akbar AI Multi-Agent Arena v4.5: Mengembangkan sistem dari 4 bot elemen dasar menjadi 15 bot independen (4 Base, 6 Duo, 4 Trio, dan 1 Master AVATAR Consensus). Menghadirkan Locked 4-Column Kanban Deck Grid dengan auto-wrap ke bawah, manajemen modal independen per bot (default Rp 1.000.000/bot) dengan indikator Total AUM dinamis (Rp 15.000.000), aturan kepatuhan arah instrumen (Saham BEI Long-Only, Kripto & Forex Dual Direction), dynamic position lot sizing anti-round-down, dan 100% Zero-Token Gemini AI runtime pada peramban klien.",
    "processFlow": [
      {
        "step": "1. Base 4 Elements",
        "label": "WATER, FIRE, AIR, EARTH (19/09)"
      },
      {
        "step": "2. 6 Duo Combos",
        "label": "STEAM, STORM, MUD, LIGHTNING, LAVA, SANDSTORM (20/09)"
      },
      {
        "step": "3. 4 Trio Combos",
        "label": "TEMPEST, OCEANIC, GEOTHERMAL, CYCLONE (20/09)"
      },
      {
        "step": "4. Master & 4-Col Grid",
        "label": "AVATAR Consensus & Locked 4-Col Kanban (20/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Akbar v4.5 APEX (Highlights 20/09)\n- **15 AI Multi-Agent Roster Lengkap (4 Base + 11 Fusi Elemen):**\n  - **4 Elemen Dasar:**\n    - 💧 **WATER (water-smc):** Liquidity Hunter (Smart Money Concepts) — Mendeteksi Order Block retest pasca liquidity sweep.\n    - 🔥 **FIRE (fire-momentum):** Momentum Trend Rider — Mengendarai tren kuat via EMA 9/21 ribbon & Donchian Channel breakout.\n    - 🌪️ **AIR (air-scalper):** High-Frequency Micro Scalper — Scalping kilat memanfaatkan micro FVG dan RSI(7) momentum.\n    - 🌍 **EARTH (earth-reversal):** Mean-Reversion Guardian — Menangkap pembalikan harga ekstrim dari Bollinger Bands 3 SD & RSI divergensi.\n  - **6 Kombo Duo (C(4,2)):**\n    - 💨 **STEAM [W+F]:** Liquidity News Sniper — Sweep likuiditas SMC dikonfirmasi lonjakan volume berita katalis.\n    - ⛈️ **STORM [W+A]:** SMC Trend Breakout — Konfirmasi Break of Structure (BOS) HTF + micro-breakout cepat.\n    - 🧱 **MUD [W+E]:** Liquidity Reversal Absorber — Sapuan likuiditas OB yang terabsorpsi di batas oversold/overbought ekstrim.\n    - ⚡ **LIGHTNING [F+A]:** Momentum Scalper Flash — Trend momentum impulsif dipadu eksekusi micro scalping agresif.\n    - 🌋 **LAVA [F+E]:** Post-News Reversal Fade — Memudar (*fade*) candle spike berita ketika harga menembus batas Bollinger 3 SD.\n    - 🏜️ **SANDSTORM [A+E]:** Range Scalper Mean Revert — Scalping mikro osilasi cepat di dalam rentang sideways.\n  - **4 Kombo Trio (C(4,3)):**\n    - 🌀 **TEMPEST [W+F+A]:** Hyper-Aggressive Trend Syndicate — Sapuan likuiditas SMC memicu akselerasi tren + micro scaling.\n    - 🌊 **OCEANIC [W+A+E]:** Smart Money Mean Reversion Anchor — Pengawal likuiditas institusional dengan penyerapan pembalikan arah terkontrol.\n    - 🌋 **GEOTHERMAL [W+F+E]:** Fundamental Macro Reversal Core — Penyerapan sentimen makro ekstrem diikuti akumulasi institusi skala besar.\n    - 🌪️ **CYCLONE [F+A+E]:** Dynamic Volatility Trend Engine — Ekspansi volatilitas Bollinger Bands dipadu trailing stop dinamis.\n  - **1 Master Ensemble (C(4,4)):**\n    - 🌟 **AVATAR [W+F+A+E]:** Consensus Multi-Agent Ensemble — Mengintegrasikan sistem pemungutan suara (voting) dari ke-4 elemen dasar. Order hanya dieksekusi jika $\\ge 3$ agen sepakat pada arah yang sama.\n- **Locked 4-Column Grid (`.arena-locked-4col-grid`):**\n  - Pada layar desktop ($\\ge 1180\\text{px}$), kartu kanban bot terkunci rapi tepat 4 kolom per baris dan menghasilkan baris ke bawah (4 baris $\\times$ 4 kolom).\n  - Mengeliminasi layout shift dan ketidaksejajaran ukuran kartu. Layar tablet otomatis switch ke 2 kolom dan mobile ke 1 kolom.\n- **Deck View Navigation Filter Tabs:**\n  - Tab filter cepat untuk kemudahan monitoring: **Semua Bot (15)**, **4 Elemen Dasar**, **6 Kombo Duo**, dan **5 Sindikat (Trio & Master)**.\n- **Manajemen Modal Independen & Dynamic Total AUM:**\n  - Setiap bot diberikan modal awal terisolasi (default Rp 1.000.000/bot).\n  - Total AUM terhitung otomatis secara transparan: **Total AUM: Rp 15.000.000 (15 Bot)**.\n  - Kerugian, margin call, dan keuntungan bot satu sama sekali tidak mempengaruhi bot lainnya.\n- **Aturan Directional Safety Berstandar Regulasi:**\n  - **Saham BEI (IDX):** Terkunci secara ketat **LONG-ONLY** (Dilarang Short Selling sesuai regulasi pasar modal Indonesia).\n  - **Crypto Perp & Forex:** Mendukung **LONG & SHORT** dua arah secara penuh.\n- **Dynamic Lot Sizing Anti-Round-Down:**\n  - Formula `calculateInstrumentLotSize` mengalokasikan target margin $\\approx$ Rp 30.000 / notional $\\approx$ $37 USD pada leverage 1:20.\n  - Mengatasi bug floating PnL bernilai Rp 0 pada koin berharga rendah seperti ADA, XRP, PEPE, dan DOGE.\n- **Zero-Token AI Runtime:**\n  - Seluruh mesin pemindaian, state machine, dan logika kombo beroperasi 100% secara deterministik kuantitatif di sisi klien tanpa mengonsumsi token API Gemini pengguna.",
    "table": [
      {
        "module": "15 Multi-Agent Roster",
        "status": "PROD",
        "category": "AI Arena / Agents",
        "summary": "4 Base Elements + 6 Duo Combos + 4 Trio + 1 Master AVATAR"
      },
      {
        "module": "Locked 4-Col Grid",
        "status": "PROD",
        "category": "UI / Kanban",
        "summary": "Grid 4 kolom terkunci di desktop, wrap ke bawah secara proporsional"
      },
      {
        "module": "Independent Capital Ledger",
        "status": "PROD",
        "category": "Risk Management",
        "summary": "Modal terisolasi default Rp 1.000.000 per bot + dynamic Total AUM Rp 15M"
      },
      {
        "module": "Directional Compliance Gate",
        "status": "PROD",
        "category": "Compliance",
        "summary": "BEI Strictly Long-Only; Kripto Futures & Forex mendukung Long & Short"
      },
      {
        "module": "Dynamic Lot Sizing",
        "status": "PROD",
        "category": "Quant / Execution",
        "summary": "Kalkulasi lot proporsional mengeliminasi floating PnL Rp 0 pada altcoins"
      },
      {
        "module": "Deck View Navigation",
        "status": "PROD",
        "category": "UI / Filter",
        "summary": "Filter tab: Semua Bot (15), 4 Base, 6 Duo, 5 Sindikat (Trio & Master)"
      },
      {
        "module": "Zero-Token Runtime Engine",
        "status": "PROD",
        "category": "Architecture",
        "summary": "100% deterministik kuantitatif klien tanpa mengonsumsi kuota token LLM"
      }
    ]
  },
  {
    "id": "pkg-19092026-v42",
    "version": "Package 19092026",
    "semanticVersion": "v4.2.0",
    "date": "19 September 2026",
    "status": "STABLE",
    "statusColor": "#38bdf8",
    "badgeLabel": "STABLE",
    "title": "Update Package 19092026 (v4.2 APEX): AI Agent Arena Genesis (4 Elements), Zero Simulation Policy, Post-Mortem Session 0 Archive & Resilient Session Timer",
    "description": "Fondasi peluncuran perdana AI Multi-Agent Arena: Memperkenalkan 4 agen kuantitatif elemen dasar (WATER, FIRE, AIR, EARTH) yang bertarung otonom, penegakan Zero Simulation Policy (eliminasi 100% synthetic tick delta demi data riil WebSocket Binance & Scanner TV), arsip post-mortem Sesi 0 Genesis (+Rp 255M PnL) serta evolusi DNA Gen 2, resilient uptime timer berbasis delta Date.now & visibilitychange, serta normalisasi TP/SL berbasis Dynamic Proportional ATR.",
    "processFlow": [
      {
        "step": "1. Tri-Signal Matrix",
        "label": "Wall St US Equities Added (18/09)"
      },
      {
        "step": "2. Zero-Simulation Gate",
        "label": "Purge Synthetic Ticks (19/09)"
      },
      {
        "step": "3. 4 Base Elements",
        "label": "WATER, FIRE, AIR, EARTH Genesis (19/09)"
      },
      {
        "step": "4. Post-Mortem & Gen 2",
        "label": "Session 0 Debrief & Evolution (19/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Akbar v4.2 APEX (Highlights 19/09)\n- **Peluncuran Perdana AI Multi-Agent Arena (4 Elemen Dasar):**\n  - Mengembangkan platform perdagangan otonom berbasis peramban dengan 4 kepribadian kuantitatif elemen inti:\n    - 💧 **WATER:** Smart Money Concepts (SMC), Order Blocks & Liquidity Sweeps.\n    - 🔥 **FIRE:** Event-driven momentum menangkap lonjakan volatilitas berita makro ekonomi.\n    - 🌪️ **AIR:** High-Frequency Scalper & Donchian Channel trend breakout.\n    - ⛰️ **EARTH:** Mean-reversion guardian memanfaatkan batas deviasi ekstrem Bollinger Bands 3 SD.\n- **Penegakan Zero Simulation Policy Mutlak:**\n  - Menghapus seluruh generator tick sintetis (*random fake ticks*) dan `Math.random()` dari pipeline harga.\n  - Sinyal dan floating PnL 100% dihitung dari denyut data pasar nyata: Binance MiniTicker WebSocket (kripto) dan TradingView Scanner (saham IDX, US, Forex, Emas, Minyak).\n  - Mengimplementasikan **Weekend Freeze** di mana kuotasi saham bursa konvensional terkunci rapi pada *Official Closing Price* tanpa deviasi palsu saat pasar tutup.\n- **Arsip Sesi #0 Genesis & Institutional Quant Post-Mortem:**\n  - Menyimpan rekapitulasi audit performa Sesi 0 (9.832 trade historis, total keuntungan bersih +Rp 255.462.417, win rate 21.0%).\n  - Menyediakan modal telaah mendalam (*Institutional Post-Mortem Debrief*) yang menganalisis rasio Risk/Reward, frekuensi transaksi, dan pemicu Margin Call (MC).\n  - Menginisiasi mutasi DNA agen menuju **Generasi 2 (Gen 2)** dengan parameter SL/TP trailing yang lebih adaptif.\n- **Resilient Session Uptime Timer:**\n  - Memperbaiki ketahanan timer durasi sesi arena menggunakan pelacak selisih waktu nyata (`Date.now()` delta tracking) dan pendengar event `visibilitychange` serta `window.focus`.\n  - Jam sesi tetap berjalan akurat dan tidak melambat (*throttled*) ketika peramban pengguna berpindah tab atau berjalan di latar belakang.\n- **Dynamic Proportional ATR & Position Normalizer:**\n  - Menggantikan batas ATR statis dengan Dynamic Proportional ATR yang menyesuaikan volatilitas spesifik masing-masing instrumen (0.35% Forex, 1.0% Saham, 1.2% Kripto).\n  - Melakukan normalisasi otomatis terhadap posisi lawas agar target TP dan batas keras Hard SL selalu berada pada rentang batas risiko institusional.",
    "table": [
      {
        "module": "4 Elements Genesis Arena",
        "status": "PROD",
        "category": "AI Arena / Engine",
        "summary": "WATER, FIRE, AIR, EARTH autonomous algorithmic trading agents"
      },
      {
        "module": "Zero Simulation Enforcement",
        "status": "PROD",
        "category": "Data Integrity",
        "summary": "100% data riil WebSocket Binance & TV Scanner; nol tick sintetis"
      },
      {
        "module": "Session 0 Post-Mortem Archive",
        "status": "PROD",
        "category": "Analytics / Audit",
        "summary": "Arsip audit 9.832 trade Genesis Sesi 0 (+Rp 255M PnL) & evaluasi MC"
      },
      {
        "module": "Gen 2 DNA Evolution",
        "status": "PROD",
        "category": "Reinforcement RL",
        "summary": "Adaptasi parameter DNA SL/TP trailing pasca evaluasi performa"
      },
      {
        "module": "Resilient Delta Uptime Timer",
        "status": "PROD",
        "category": "Telemetry",
        "summary": "Date.now delta tracking tahan sleep/background browser tabs"
      },
      {
        "module": "Dynamic Proportional ATR",
        "status": "PROD",
        "category": "Risk Management",
        "summary": "Penyesuaian TP/SL proporsional terhadap volatilitas riil per instrumen"
      },
      {
        "module": "Weekend Market Freeze Gate",
        "status": "PROD",
        "category": "Compliance",
        "summary": "Harga bursa konvensional terkunci pada official close saat libur"
      }
    ]
  },
  {
    "id": "pkg-18092026-v41",
    "version": "Package 18092026",
    "semanticVersion": "v4.1.0",
    "date": "18 September 2026",
    "status": "STABLE",
    "statusColor": "#38bdf8",
    "badgeLabel": "STABLE",
    "title": "Update Package 18092026 (v4.1 APEX): Tri-Signal Matrix Cockpit, US Stock Signals, Authentic Logos (IDX, Crypto, Wall St) & Laser-Aligned 6px Geometry",
    "description": "Penyempurnaan visual dan fungsional Cockpit Command Center: Memperluas radar sinyal Row 3 dari dual-box menjadi Tri-Signal Matrix (Saham IDX, Crypto Spot, dan US Stock Signals), integrasi logo/favicon resmi PT dan koin kripto di setiap baris ticker via Google Favicon CDN 64px & CoinCap/TradingView progressive waterfall, penstabilan layout dengan tableLayout fixed dan formatter desimal mikro, serta unifikasi presisi batas laser gap 6.0px terhadap Live News Wire.",
    "processFlow": [
      {
        "step": "1. Dual Cockpit Baseline",
        "label": "IDX & Crypto Only (17/09)"
      },
      {
        "step": "2. Tri-Signal Architecture",
        "label": "Wall St US Signals Added (18/09)"
      },
      {
        "step": "3. Authentic Logo CDN",
        "label": "Official PT & CoinCap Waterfall (18/09)"
      },
      {
        "step": "4. Laser-Aligned 6px",
        "label": "Perfect Grid Geometry (18/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Akbar v4.1 APEX (Highlights 18/09)\n- **Tri-Signal Matrix 3-Pasar (Saham IDX, Crypto Spot, US Stocks):** Menambahkan kotak sinyal ketiga untuk saham bursa Wall Street Amerika Serikat (AAPL, NVDA, MSFT, META, GOOGL, AMD, TSLA, dll.) berdampingan simetris dengan Saham IDX dan Crypto Spot pada Row 3 Home Cockpit.\n- **Logo Resmi Asli di Setiap Ticker (IDX, Kripto, Wall St):**\n  - **Saham IDX:** Menampilkan favicon/logo resmi dari website masing-masing PT emiten (PT Petrindo Jaya Kreasi / CUAN, PT Petrosea / PTRO, PT Salim Ivomas Pratama / SIMP, PT Astra Graphia / ASGR, PT Supra Boga Lestari / RANC, PT Singaraja Putra / SINI, PT Jhonlin Agro Raya / JARR, dll.) melalui integrasi Google Favicon CDN 64px resolusi tinggi pada `stock-icons.js` dan `AssetIcon.jsx`.\n  - **Crypto Spot:** Progressive CDN waterfall multi-tier (`CoinCap 2x CDN` $\\rightarrow$ `TradingView SVG` $\\rightarrow$ `spothq CDN` $\\rightarrow$ `vector fallback`) memastikan 100% token (termasuk PEPE, FET, NEAR, APT, BTC, ETH) memuat logo resmi asli tanpa error 404 atau pemblokiran CORS.\n  - **US Stocks:** Logo korporat autentik untuk raksasa teknologi dan institusional Wall Street (Nvidia, Apple, Microsoft, Meta, Google, AMD, Tesla, Goldman Sachs).\n- **Stabilisasi Grid & Anti-Overflow (`tableLayout: 'fixed'`):** Seluruh 3 tabel sinyal dikunci dengan `tableLayout: fixed` dan alokasi persentase kolom proporsional (28% Ticker, 22% Setup, 17% Entry, 16% SL, 17% TP1), mengeliminasi geseran layout (*layout shift*) saat angka harga berfluktuasi.\n- **Formatter Harga Kripto Mikro (`formatCryptoPrice`):** Format angka dinamis yang menangani aset berdesimal banyak (seperti koin meme PEPE `0.000004`) sehingga tidak meregangkan kolom dan menjaga header TP1 tetap terlihat utuh.\n- **Unifikasi Gap Laser-Aligned 6.0px:** Mengunci celah pembatas horizontal dan vertikal antar-kartu dan antar-baris tepat pada `6.0px`. Menyelaraskan batas kanan seluruh 4 baris Cockpit sejajar lurus tanpa celah berlebih terhadap Live News Wire Sidebar.\n- **Sinkronisasi Baris Status Row 4:** Indikator instrumen diperbarui menjadi `82 IDX · 10 CRYPTO · 31 US EQUITIES` yang merefleksikan cakupan multiaset lengkap terminal.",
    "table": [
      {
        "module": "Tri-Signal Matrix",
        "status": "PROD",
        "category": "Cockpit / Signals",
        "summary": "3 kotak sejajar: Saham IDX, Crypto Spot, dan US Stock Signals"
      },
      {
        "module": "US Stock Signals",
        "status": "PROD",
        "category": "US Equities",
        "summary": "Setup 31 saham Wall St (AAPL, NVDA, MSFT, META, dll.)"
      },
      {
        "module": "Official PT Favicon CDN",
        "status": "PROD",
        "category": "UI / Asset",
        "summary": "Logo resmi emiten BEI via Google Favicon CDN 64px"
      },
      {
        "module": "Crypto Progressive CDN",
        "status": "PROD",
        "category": "UI / Asset",
        "summary": "Multi-tier CoinCap 2x + TradingView + Spothq CDN waterfall"
      },
      {
        "module": "Fixed Table Geometry",
        "status": "PROD",
        "category": "UI / Layout",
        "summary": "tableLayout fixed 5 kolom stabil tanpa layout shift atau text clip"
      },
      {
        "module": "Crypto Micro Formatter",
        "status": "PROD",
        "category": "UI / Numbers",
        "summary": "formatCryptoPrice menjaga kejelasan desimal PEPE & altcoins"
      },
      {
        "module": "Laser-Aligned 6px Gaps",
        "status": "PROD",
        "category": "CSS / Grid",
        "summary": "Seluruh gap vertikal/horizontal rata sempurna 6.0px ke News Wire"
      },
      {
        "module": "Telemetry Strip Sync",
        "status": "PROD",
        "category": "Telemetry",
        "summary": "82 IDX · 10 CRYPTO · 31 US EQUITIES status bar"
      }
    ]
  },
  {
    "id": "pkg-17092026-v4",
    "version": "Package 17092026",
    "semanticVersion": "v4.0.0",
    "date": "17 September 2026",
    "status": "STABLE",
    "statusColor": "#38bdf8",
    "badgeLabel": "STABLE",
    "title": "Update Package 17092026 (v4.0 APEX): Dual-Speed Reactive Quant Engine, Live Trailing Stop to BE, Zero-Cron Architecture & 100% Cloudflare Pages",
    "description": "Lompatan arsitektur terbesar v4.0 APEX: Mengubah sistem dari snapshot statis berbasis cron menjadi Dual-Speed Reactive Quant Platform. Menghadirkan Reactive Strategy Engine klien (dynamicStrategy.js), Dynamic Trailing Stop Loss ke Breakeven (BE 🛡️), eliminasi 100% scheduled cron jobs di GitHub Actions, pembersihan total artefak Vercel untuk standardisasi Cloudflare Pages murni, Multi-Chart Grid (2x2 / 1x2), Institutional Security Hub Drawer, Bloomberg v4.0 12-Stream News Intelligence, Market Heatmap Treemap, Authentic Brand Logos (IDX, US, Forex), Watcher Whale Radar (>100 BTC) dengan Audio Chime, dan Anti-Stale Cache-Busting.",
    "processFlow": [
      {
        "step": "1. Baseline & Cron",
        "label": "Static Snapshots (08-12/09)"
      },
      {
        "step": "2. APEX v3.0",
        "label": "Whale, Futures & Forex (16/09)"
      },
      {
        "step": "3. Zero-Cron Decouple",
        "label": "Eliminate Cron & Git Skip (17/09)"
      },
      {
        "step": "4. APEX v4.0",
        "label": "Reactive Engine & Cloudflare (17/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Akbar v4.0 APEX (Highlights 17/09)\n- **Client-Side Reactive Strategy Engine (`dynamicStrategy.js`):** Mesin kuantitatif adaptif yang mengevaluasi sinyal trading plan secara seketika (< 1 detik via Binance WebSocket, 20 detik via TradingView Scanner) langsung di peramban pengguna. Menghadirkan State Machine Sinyal 7-fase (`ENTRY_TRIGGER`, `IN_POSITION`, `TP1_HIT`, `TP2_HIT`, `EXTENDED / NO FOMO`, `STOPPED_OUT`, `WAITING_PULLBACK`).\n- **Dynamic Trailing Stop Loss ke Breakeven (BE 🛡️):** Perlindungan modal otomatis tingkat lanjut. Begitu harga live menyentuh Target 1 (TP1), level Stop Loss otomatis diratchet naik ke level Entry (*Risk-Free Trade*), mengunci modal pokok trader dari pembalikan harga mendadak.\n- **Floating Risk/Reward & Live PnL:** Perhitungan dinamis rasio Risk-to-Reward aktual dan floating profit/loss secara instan mengikuti fluktuasi tick harga pasar.\n- **100% Eliminasi Scheduled Cron Jobs di GitHub Actions:** Seluruh 6 workflow otomatisasi berkala (`hourly_crypto_macro`, `intraday_idx_refresh`, `daily_idx_morning`, `midday_sesi1_recap`, `daily_idx_eod`, `evening_global_watch`) telah dinonaktifkan dari jadwal cron otomatis dan dialihkan ke pemicu manual (*workflow_dispatch*). Menghilangkan ketergantungan pada bot git-commit `[skip ci]` yang sebelumnya membekukan deployment dan memicu konflik cache.\n- **Pembersihan Total Artefak Vercel & Penyelarasan Cloudflare Pages Murni:** Menghapus seluruh file konfigurasi usang `vercel.json` dan `frontend/vercel.json`. Seluruh ekosistem MBG Trading kini terstandarisasi 100% pada infrastruktur **Cloudflare Pages & Edge Functions** (`https://mbg-trading.pages.dev`) tanpa jejak Vercel.\n- **Multi-Chart Grid & Institutional Security Hub Drawer:** Visualisasi teknikal tingkat lanjut dengan grid multi-grafik interaktif (2x2 / 1x2) TradingView dan Security Hub Drawer geser komprehensif yang menampilkan data fundamental, rekapitulasi bandarmologi, dan metrik teknikal emiten.\n- **Bloomberg Terminal v4.0 (12-Stream News Intelligence):** 12 saluran stream berita terklasifikasi (IHSG, Perbankan, Komoditas, Makro AS, Kripto, The Fed, Geopolitik) yang dilengkapi radar sentimen multi-agen dan korelasi antar-pasar (*Intermarket Correlation Matrix*).\n- **Market Heatmap Treemap Dinamis:** Peta visual interaktif saham BEI dan pasar Kripto dengan pewarnaan gradasi performa harga serta proporsi bobot nilai transaksi (*turnover*).\n- **Authentic Brand Logos & Multi-Market Badges:** Integrasi aset logo SVG otentik emiten blue-chip BEI (BBCA, BBRI, BMRI, BBNI, ASII, TLKM, dll.), saham teknologi AS, dan lencana bendera ganda (*dual-flag badges*) untuk pasangan mata uang Forex.\n- **Watcher Whale Radar (>100 BTC) & Audio Chime:** Radar pelacak transaksi paus on-chain berukuran raksasa (>100 BTC) dilengkapi lonceng audio instan dan verifikasi hash transaksi langsung ke Blockchain Explorer.\n- **Anti-Stale Cache-Busting:** Pemasangan parameter timestamp dinamis `?v=${Date.now()}` serta header `{ cache: 'no-cache' }` pada pemuatan bundle data di `App.jsx`, menjamin browser tidak terjebak dalam respons HTTP 304 Not Modified.\n- **Dividend Hunter Live Binding:** Harga saham pada radar dividen kini terhubung dinamis dengan data kuotasi TradingView Scanner, memastikan kalkulasi estimasi yield selalu akurat mengikuti harga pasar berjalan.",
    "table": [
      {
        "module": "Reactive Strategy Engine",
        "status": "PROD",
        "category": "Engine / Quant",
        "summary": "State machine adaptif real-time (<1s Crypto, 20s IDX) via dynamicStrategy.js"
      },
      {
        "module": "Dynamic Trailing Stop (BE)",
        "status": "PROD",
        "category": "Risk Management",
        "summary": "SL otomatis naik ke level Entry saat TP1 tercapai (Risk-Free Trade)"
      },
      {
        "module": "Zero-Cron Architecture",
        "status": "PROD",
        "category": "CI/CD",
        "summary": "Menghapus 6 jadwal cron otomatis; bebas bot commit [skip ci]"
      },
      {
        "module": "Pembersihan Vercel",
        "status": "PROD",
        "category": "Platform",
        "summary": "100% Cloudflare Pages native; vercel.json root & frontend dihapus"
      },
      {
        "module": "Multi-Chart Grid",
        "status": "PROD",
        "category": "Charting",
        "summary": "Grid multi-grafik interaktif (2x2 / 1x2) TradingView"
      },
      {
        "module": "Security Hub Drawer",
        "status": "PROD",
        "category": "Research",
        "summary": "Drawer fakta fundamental, bandarmologi, dan metrik teknikal"
      },
      {
        "module": "Bloomberg v4.0 Terminal",
        "status": "PROD",
        "category": "News Intelligence",
        "summary": "12 stream berita interaktif + radar sentimen multi-agen"
      },
      {
        "module": "Market Heatmap Treemap",
        "status": "PROD",
        "category": "Visualization",
        "summary": "Peta panas pasar saham BEI & kripto berbasis nilai transaksi"
      },
      {
        "module": "Brand Logos & Badges",
        "status": "PROD",
        "category": "UI / Asset",
        "summary": "Logo SVG emiten BEI, saham US, dan bendera ganda Forex"
      },
      {
        "module": "Watcher Whale (>100 BTC)",
        "status": "PROD",
        "category": "On-Chain Alert",
        "summary": "Deteksi transfer paus raksasa + audio alert chime + tx explorer"
      },
      {
        "module": "Cache-Busting Anti-304",
        "status": "PROD",
        "category": "Networking",
        "summary": "Timestamp query parameter ?v= menjamin data selalu fresh"
      },
      {
        "module": "Dividend Live Binding",
        "status": "PROD",
        "category": "Data Desk",
        "summary": "Harga saham dividen terhubung langsung ke TradingView Scanner"
      }
    ]
  },
  {
    "id": "pkg-16092026-v3",
    "version": "Package 16092026",
    "semanticVersion": "v3.0.0",
    "date": "16 September 2026",
    "status": "STABLE",
    "statusColor": "#38bdf8",
    "badgeLabel": "STABLE",
    "title": "Update Package 16092026 (v3.0 APEX): Whale Intelligence Hub, Running Trade BEI, Crypto Futures, Forex & Intraday Sync",
    "description": "Rilis akbar v3.0 menghadirkan integrasi holistik: Pelacakan Paus Kripto On-Chain (0s delay Mempool WS), Broker Summary & Portofolio Tracker BEI (Stockbit Style), Live Running Trade BEI, Dashboard Crypto Futures, Forex Command Center 28-Pair, US Stock Intelligence, Kalender Makro 40+ Event, CryptoWave Live News, NewsDetailModal, dan sinkronisasi intraday 30 menit.",
    "processFlow": [
      {
        "step": "1. Baseline Core",
        "label": "Quant & Plans (08-09/09)"
      },
      {
        "step": "2. Telegram & Desk",
        "label": "Serverless Edge (10/09)"
      },
      {
        "step": "3. Cockpit V2",
        "label": "SoSoValue Layout (11-12/09)"
      },
      {
        "step": "4. APEX v3.0",
        "label": "Whale, Futures & Forex (16/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Akbar v3.0 (Highlights 16/09)\n- **Whale Intelligence Hub & Real-time Mempool WS:** Pelacakan paus on-chain Bitcoin & Ethereum real-time tanpa delay via WebSocket `wss://mempool.space/api/v1/ws` (100% gratis, tanpa API key) dengan deteksi Exchange Inflow/Outflow, verifikasi hash transaksi langsung ke Blockchain Explorer, dan analisis dampak likuiditas.\n- **Running Trade Live Saham BEI (Stockbit Style):** Streaming tick transaksi pasar modal Indonesia real-time dengan aksi BUY (Haka)/SELL (Haki), filter lot cerdas (Whale ≥500 lot, Mega Whale ≥1.000 lot), identifikasi broker Buyer & Seller (Asing/Domestik), dan kontrol Pause/Resume.\n- **Radar Asing & Portofolio Broker Tracker:** Rekapitulasi lengkap 18+ broker anggota bursa (AK, BK, CS, KZ, RX, CC, NI, YP, PD, SQ, dll.) dengan filter rentang waktu (1D EOD, 3D, 1W, 1M MTD), perhitungan harga beli rata-rata (*Avg Buy*), harga jual rata-rata (*Avg Sell*), net lot pegang barang, dan harga rata-rata akumulasi (*Avg Hold*).\n- **Wall Street 13F Hedge Fund Desk:** Pemantauan portofolio institusi global tier-1 (Berkshire Hathaway / Warren Buffett, Citadel / Ken Griffin, Bridgewater / Ray Dalio, Renaissance Technologies / Jim Simons Desk) dengan rincian saham, nilai pasar USD, bobot portofolio (% AUM), dan estimasi avg cost.\n- **Crypto Futures Intelligence:** Dashboard komprehensif 15 pair futures dari Binance: Funding Rate heatmap (sinyal overleveraged/squeeze), Open Interest vs Price divergence, rasio Long/Short global, dan radar likuidasi 24 jam.\n- **Forex Command Center:** Pemindai 28 pair mata uang via TradingView Scanner, kalkulator risiko pip interaktif (USD & IDR), jam sesi pasar global (Sydney/Tokyo/London/New York), dan laporan CFTC Commitment of Traders (COT).\n- **US Stock Intelligence:** Pemindai 30 emiten terpopuler AS (AAPL, NVDA, MSFT, TSLA, GOOGL, dll.) dengan heatmap performa sektor, setup top 5 trade plans, dan kalender earnings dengan countdown zona bahaya.\n- **Kalender Makro Global 40+ Event:** Jadwal rilis kebijakan moneter lengkap (US, ID, EU, GB, JP, CN, AU, OPEC+) dengan filter multi-negara, klasifikasi dampak (Tinggi/Sedang/Rendah), status rilis, dan kartu edukasi analisis dampak ke instrumen Forex, Saham, Emas, dan Kripto.\n- **CryptoWave Live News & Interactive NewsDetailModal:** Scraper berita terkini dari CryptoWave Indonesia terintegrasi dengan modal detail interaktif dan 3 Key Takeaways Stockbit Snips.\n- **Otomasi EOD BEI & Intraday 30-Min Sync:** Workflow otomatisasi GitHub Actions penarikan data resmi Broker Summary EOD pukul **18:15 WIB** pasca tutup pasar dan refresh intraday setiap 30 menit.\n- **Auto 1D Timeframe Charting:** TradingView Chart Modal dan Institutional Charting Desk otomatis menyetel interval ke `1D` untuk saham IDX dan mengenali prefix pasar `FX:`, `NASDAQ:`, `BINANCE:`, dan `IDX:`.",
    "table": [
      {
        "module": "Whale Hub & Mempool WS",
        "status": "PROD",
        "category": "Intelligence",
        "summary": "On-chain stream real-time 0s delay + verifikasi explorer tx"
      },
      {
        "module": "Running Trade BEI",
        "status": "PROD",
        "category": "Trading Desk",
        "summary": "Stockbit style streaming trade + filter lot whale & kode broker"
      },
      {
        "module": "Broker Summary & Portfolio",
        "status": "PROD",
        "category": "Bandarmology",
        "summary": "Rekap semua broker + avg buy/sell price + net lot holding"
      },
      {
        "module": "Wall Street 13F Desk",
        "status": "PROD",
        "category": "Institutional",
        "summary": "Breakdown portofolio Berkshire, Citadel, Bridgewater, Simons"
      },
      {
        "module": "Crypto Futures Hub",
        "status": "PROD",
        "category": "Futures",
        "summary": "Funding rate 15 pairs + Open Interest + Liquidation radar"
      },
      {
        "module": "Forex Command Center",
        "status": "PROD",
        "category": "Forex",
        "summary": "28-pair scanner + Pip calculator + CFTC COT positioning"
      },
      {
        "module": "US Stock Screener",
        "status": "PROD",
        "category": "US Equities",
        "summary": "30 top US stocks + Earnings calendar + Sector heatmap"
      },
      {
        "module": "Kalender Makro 40+ Event",
        "status": "PROD",
        "category": "Macro",
        "summary": "40+ event US, ID, EU, GB, JP, CN + multi-filter negara & impact"
      },
      {
        "module": "CryptoWave News",
        "status": "PROD",
        "category": "News",
        "summary": "Scraper live news CryptoWave + NewsDetailModal + Stockbit takeaways"
      },
      {
        "module": "EOD Automation (18:15 WIB)",
        "status": "PROD",
        "category": "Cron / Workflow",
        "summary": "Penarikan data harian resmi EOD BEI otomatis pasca jam 18:00"
      },
      {
        "module": "Chart Timeframe 1D",
        "status": "PROD",
        "category": "Charting",
        "summary": "Auto-set interval 1D untuk saham IDX + adaptive market selector"
      },
      {
        "module": "Intraday 30-Min Sync",
        "status": "PROD",
        "category": "Engine / Cron",
        "summary": "Pipeline update 30 menit bursa IDX + multi-tier foreign flow"
      },
      {
        "module": "NewsDetailModal",
        "status": "PROD",
        "category": "UI / News",
        "summary": "Modal pop-up detail berita + 3 Key Takeaways Stockbit Snips"
      },
      {
        "module": "Bull-Bear Debate",
        "status": "PROD",
        "category": "AI / Quant",
        "summary": "Sintesis multi-agen analisa risiko sentimen saham IDX"
      }
    ]
  },
  {
    "id": "pkg-1315092026",
    "version": "Package 13092026-15092026",
    "semanticVersion": "v2.4.0-staging",
    "date": "13 - 15 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / TELEMETRY & STAGING",
    "title": "Siklus Pemeliharaan Telemetri Otomatis 24/7 & Staging Pipeline Bloomberg v3.0 Terminal",
    "description": "Dokumentasi aktivitas sistem pada tanggal 13, 14, dan 15 September 2026: Pemeliharaan data stream otomatis per jam (cron telemetry crypto, futures, foreign flow EOD broker summary, dan morning market plans), serta fase pengembangan & staging integrasi masif 4 modul baru (Whale Intelligence, Crypto Futures, Forex Command, dan US Stock Intelligence) sebelum rilis akbar v3.0 pada 16 September.",
    "processFlow": [
      {
        "step": "1. Automated Hourly Cron",
        "label": "Sinkronisasi telemetri likuiditas makro dan harga kripto setiap 60 menit via GitHub Actions"
      },
      {
        "step": "2. EOD Broker Summary",
        "label": "Agregasi data penutupan transaksi harian BEI pada pukul 18:15 WIB dan rencana pagi 08:30 WIB"
      },
      {
        "step": "3. Feature Staging Desk",
        "label": "Pembangunan 4 modul baru di branch staging (Whale Tracker, Futures, Forex, US Stock)"
      },
      {
        "step": "4. Pre-v3.0 Integration",
        "label": "Pengujian zero-delay Mempool Bitcoin WebSocket dan Binance Futures liquidation radar"
      }
    ],
    "markdownContent": "\n### 🔄 Siklus Pemeliharaan Telemetri Otomatis & Staging Pipeline v3.0 (13 - 15 September 2026)\n\n> [!NOTE]\n> Pada tanggal 13 (Minggu), 14, dan 15 September 2026, sistem bursa beroperasi dalam jadwal akhir pekan/awal pekan. Tidak ada rilis fitur publik baru pada antarmuka, melainkan **fase intensif pemeliharaan background cron telemetri dan integrasi fitur akbar v3.0**.\n\n#### 🤖 1. Pemeliharaan Otomatis Telemetri 24/7 (Hourly Cron)\n- **Sinkronisasi Likuiditas & Kripto:** Menjalankan pipeline cron otomatis setiap jam (`sync hourly crypto & macro telemetry`) tanpa henti.\n- **EOD Broker Summary BEI:** Mengambil dan merekap data aliran dana broker asing/domestik setiap pukul 18:15 WIB.\n- **Evening Global Watch & Morning Plans:** Publikasi rekapitulasi pasar global malam hari dan rencana perdagangan pagi hari (08:30 WIB).\n\n#### 🏗️ 2. Staging Pipeline Bloomberg v3.0 Terminal\n- **Pengembangan di Branch Terisolasi (`feature-naufal`):** Membangun 4 modul utama secara paralel:\n  * **Whale Intelligence Hub:** Pelacak transaksi paus Bitcoin on-chain via Mempool WebSocket (>100 BTC) & running trade BEI.\n  * **Crypto Futures Desk:** Layar perps Binance & Gate.io dengan spesifikasi Coinglass (Funding rate, Open Interest, Liquidations).\n  * **Forex Command Tab:** Telemetri pasangan mata uang mayor dan dual-flag badges.\n  * **US Stock Intelligence:** Scanner saham Wall Street & sinkronisasi harga TradingView.\n- **Peleburan Resmi:** Seluruh fitur yang dibangun pada siklus 13-15 September ini dilebur dan dirilis secara resmi pada **16 September 2026 (Package 16092026 / v3.0.0)**.\n"
  },
  {
    "id": "pkg-12092026",
    "version": "Package 12092026",
    "semanticVersion": "v2.3.0",
    "date": "12 September 2026",
    "status": "STABLE",
    "statusColor": "#38bdf8",
    "badgeLabel": "STABLE",
    "title": "Update Package 12092026: IHSG Real-Time Quote Feed & Macro Engine Synchronization",
    "description": "Rekapitulasi pembaruan 12 September 2026: Sinkronisasi real-time quote feed IHSG lintas modul telemetri dan integrasi indeks domestik pada payload eksekusi macro news.",
    "processFlow": [
      {
        "step": "1. Baseline",
        "label": "Quant Core"
      },
      {
        "step": "2. Telegram & Desk",
        "label": "Serverless Edge"
      },
      {
        "step": "3. IHSG Quote Sync",
        "label": "Level 6,506 (12/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Utama (Highlights 12/09)\n- **IHSG Real-Time Quote Sync:** Pembaruan live quote feed IHSG level 6,506 secara konsisten pada master bundle cache dan ticker bar terminal.\n- **Macro Payload Enrichment:** Penyertaan variabel IHSG ke dalam eksekusi payload `news_macro` untuk korelasi sentimen berita dengan pergerakan indeks domestik.\n- **Telemetry Stability:** Optimalisasi cron job sinkronisasi kripto dan makro tanpa jeda runtime.",
    "table": [
      {
        "module": "IHSG Live Feed",
        "status": "STABLE",
        "category": "Feed",
        "summary": "Live quote feed IHSG 6,506 di seluruh bundle cache"
      },
      {
        "module": "Macro Payload",
        "status": "STABLE",
        "category": "Macro Engine",
        "summary": "Injeksi variabel IHSG pada data analisis berita"
      },
      {
        "module": "Telemetry Cron",
        "status": "STABLE",
        "category": "Data Cron",
        "summary": "Sinkronisasi hourly telemetri kripto & makro"
      }
    ]
  },
  {
    "id": "pkg-11092026",
    "version": "Package 11092026",
    "semanticVersion": "v2.2.0",
    "date": "11 September 2026",
    "status": "STABLE",
    "statusColor": "#38bdf8",
    "badgeLabel": "STABLE",
    "title": "Update Package 11092026: SoSoValue Research Desk, Dual-Stream News Wire, Spot ETF Telemetry & Layout Cockpit V2",
    "description": "Pembaruan ekstensif menghadirkan tata letak Home Cockpit 2-kolom SoSoValue (72% Cockpit + 28% Live News) dengan zero horizontal scroll, running ticker tape tanpa jeda, telemetri ETF Spot BTC/ETH, Active Windowing dividen, dan dukungan multi-aset kripto di Charting Desk.",
    "processFlow": [
      {
        "step": "1. Baseline Core",
        "label": "Quant & Plans"
      },
      {
        "step": "2. Cockpit V2",
        "label": "SoSoValue Layout (11/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Utama (Highlights 11/09)\n- **Continuous Running Ticker Tape:** Bar ticker berjalan real-time tanpa jeda di bagian atas layar dengan indikator status global dan subtle scrollbar Bloomberg.\n- **Home Cockpit 2-Kolom SoSoValue:** Pembagian rasio proporsional 72% Cockpit (Market Pulse, Bandarmology, Foreign Flow) dan 28% Live News Wire tanpa scrolling horizontal liar.\n- **SoSoValue Spot ETF Telemetry:** Pemantauan harian `Net Flow (US$ M)` dan turnover Bitcoin & Ethereum Spot ETF langsung di terminal.\n- **Research Desk (24/7 Live Stream):** Stream ganda berita Bloomberg & Stockbit Snips yang menyajikan 3 poin kunci sentimen pasar per berita.\n- **Dividen Hunter Active Windowing:** Jendela filter cerdas `[-1 bulan s/d +6 bulan]` dengan live countdown hari H-X untuk mengeliminasi riwayat dividen usang.\n- **Technical Indicators Suite:** Integrasi indikator teknikal native (RSI, MACD, Bollinger Bands, EMA, ATR) dan confluence scoring.\n- **Rebranding MBG APEX:** Logo resmi Quantum Emerald Tri-Loop vector murni dan penyelarasan seluruh nama entitas sistem.",
    "table": [
      {
        "module": "Home Cockpit V2",
        "status": "STABLE",
        "category": "UI/UX",
        "summary": "Rasio 72% / 28%, eliminasi horizontal overflow, telemetry strip"
      },
      {
        "module": "Running Ticker Tape",
        "status": "STABLE",
        "category": "Feed",
        "summary": "Continuous loop ticker tape dengan indikator jam bursa aktif"
      },
      {
        "module": "Spot ETF Flow",
        "status": "STABLE",
        "category": "Macro",
        "summary": "Net inflow/outflow harian BTC/ETH ETF berbasis SoSoValue"
      },
      {
        "module": "Dividen Hunter V2",
        "status": "STABLE",
        "category": "Screener",
        "summary": "Jendela aktif -1 bln s/d +6 bln, countdown timer, filter kadaluarsa"
      },
      {
        "module": "Technicals Suite",
        "status": "STABLE",
        "category": "Analysis",
        "summary": "RSI, MACD, Bollinger, EMA, ATR & Confluence Scoring"
      }
    ]
  },
  {
    "id": "pkg-10092026",
    "version": "Package 10092026",
    "semanticVersion": "v2.1.0",
    "date": "10 September 2026",
    "status": "STABLE",
    "statusColor": "#38bdf8",
    "badgeLabel": "STABLE",
    "title": "Update Package 10092026: Telegram Serverless, Command Center, Charting Desk & Changelog Engine",
    "description": "Rekapitulasi pembaruan 10 September 2026: Integrasi Bot Telegram serverless 24/7 di Cloudflare Pages, Institutional Charting Desk TradingView, Level 2 Market Depth & Radar Broker Summary, serta pengelompokan semesta Saham IDX.",
    "processFlow": [
      {
        "step": "1. Baseline Core",
        "label": "Quant & Plans"
      },
      {
        "step": "2. Telegram & Desk",
        "label": "Serverless Edge (10/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Utama (Highlights 10/09)\n- **Institutional Charting Desk:** Workspace layar penuh didukung TradingView Advanced Real-Time Chart dengan full drawing toolbar, 4 Strategy Presets (SMC, Trend, Bandar, Mean Reversion), dan kalkulator lot MBG Apex.\n- **Level 2 Market Depth & Broker Summary:** Eliminasi simulator acak. Integrasi 100% data riil: Real-time Orderbook Tokocrypto/Indodax & Best Quote BEI dengan Radar Detektif Bandar (Broker Summary 2 Kolom & CR3 Akumulasi).\n- **Restrukturisasi Saham IDX:** Konsolidasi seluruh saham dan 12 grup konglomerasi ke dalam semesta \"SEMUA SAHAM\" dengan sub-filter terfokus: SEMUA SAHAM, 🎯 TOP TRADE PLANS, dan 💰 DIVIDEN HUNTER.\n- **Serverless Telegram Bot 24/7:** Webhook `/api/telegram-webhook` berjalan di edge Cloudflare Pages tanpa runtime cost (`Rp 0/bulan`), melayani query /saham, /crypto, /macro, /plan, /dividend, dan /help.\n- **Changelog & Testing Hub:** Registri riwayat rilis terstruktur dan konsolidasi modul pengujian forward & backtest.",
    "table": [
      {
        "module": "Charting Desk",
        "status": "STABLE",
        "category": "Charting",
        "summary": "TradingView Real-time + 4 Strategy Presets + Drawing Tools"
      },
      {
        "module": "L2 Market Depth",
        "status": "STABLE",
        "category": "Orderbook",
        "summary": "Orderbook riil BEI/Crypto + Broker Summary 2 Kolom & CR3"
      },
      {
        "module": "Telegram Webhook",
        "status": "STABLE",
        "category": "Bot",
        "summary": "24/7 Cloudflare Pages Functions serverless bot (/saham, /plan, dll)"
      },
      {
        "module": "Unified Testing",
        "status": "STABLE",
        "category": "Testing",
        "summary": "Konsolidasi Backtest Lab 5-Tahun & Virtual Forward Test"
      }
    ]
  },
  {
    "id": "pkg-initial-launch",
    "version": "Initial Launch Package",
    "semanticVersion": "v1.0.0",
    "date": "08 - 09 September 2026",
    "status": "CONSOLIDATED",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "INITIAL MAJOR LAUNCH",
    "title": "Initial Major Launch Package: Core Quant Intelligence & Multi-Market Terminal",
    "description": "Rekapitulasi paket peluncuran utama yang merangkum seluruh fondasi awal sistem MBG Trading Intelligence Cockpit: model kuantitatif multi-agent, pemindai multi-aset, tools analisis profesional, dan suite makroekonomi ARIB.",
    "processFlow": [
      {
        "step": "1. Baseline Core",
        "label": "Quant Model & Plans (08-09/09)"
      }
    ],
    "markdownContent": "### 📦 Paket Fondasi Utama (Rekapitulasi Baseline)\n- **Quant Core Engine:** Prediksi berbasis Google TimesFM (Zero-Shot Time Series Foundation Model), Smart Money Concepts (SMC Order Blocks, Liquidity Sweeps, & Fair Value Gaps), dan Institutional Investor Flow Score (IIFS).\n- **Daily Trade Plans & Scanner:** 20 Daily Trade Plans harian dengan kalkulasi otomatis Entry, Stop Loss, Multi-Target, serta scanner Saham IDX dan 10 Crypto Spot.\n- **Pro Trading Tools:** TradingView Pro Interactive Modal, OrderBook L2 Depth Simulator, Kalkulator Ukuran Lot & Manajemen Risiko (1-2%), dan Personal Watchlist.\n- **ARIB Macro Suite:** Pemantauan real-time Pasar Global (S&P 500, Nasdaq, Nikkei, IHSG), Kalender Makroekonomi, Matriks Korelasi Pearson, dan Live News Wire.\n- **Keamanan & Desain:** Password Gate enkripsi SHA-256 anti-brute lockout, dual-theme dark/light mode Bloomberg & SoSoValue, serta Quant Academy knowledge wiki.",
    "table": [
      {
        "module": "Quant Core Engine",
        "status": "BASELINE",
        "category": "Quant",
        "summary": "TimesFM + SMC Order Blocks + IIFS Flow Scoring"
      },
      {
        "module": "20 Trade Plans",
        "status": "BASELINE",
        "category": "Scanner",
        "summary": "Rekomendasi harian IDX & Crypto Spot dengan kalkulasi R:R"
      },
      {
        "module": "ARIB Macro Suite",
        "status": "BASELINE",
        "category": "Macro",
        "summary": "Pasar Global, Kalender Makroekonomi & Korelasi Pearson"
      },
      {
        "module": "Security & Auth",
        "status": "BASELINE",
        "category": "Security",
        "summary": "SHA-256 Gate, lockout anti-brute force & dual theme"
      }
    ]
  }
];
