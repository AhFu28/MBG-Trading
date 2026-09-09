# 📖 BUKU MANUAL LENGKAP & DEFINISI FITUR // PROJECT MBG VERSION 2
### *The Unified Autonomous Quant Cockpit & 24/7 Intelligence Terminal*
**Standar Dokumen:** `MBG-V2-MANUAL-OPERASIONAL-PRO-V2.0`  
**Kepatuhan PRD:** `PRD_Project_MBG_v2_Master.pdf` (Doktrin 5 Langkah Astra & Microstructure OJK/BEI)  
**Terakhir Diperbarui:** 2026-09-09  

---

## 1. PENDAHULUAN & PRINSIP DASAR

### 1.1 Visi & Tujuan
Project MBG (Market Brain Grid) version 2 dirancang untuk memecahkan 3 masalah utama trader retail:
1. **Ketinggalan Info & Terjebak FOMO:** Diselesaikan oleh radar bot Telegram otomatis yang memantau pasar 24/7.
2. **Berita Makro yang Membingungkan:** Disederhanakan menggunakan penerjemah narasi *"Bahasa Bayi"* berbasis AI.
3. **Trading Emosional & Boncos Akibat Salah Lot:** Dicegah menggunakan *Kalkulator Lot Standar Astra* yang membatasi risiko maksimal 2% modal per transaksi.

### 1.2 Doktrin 5 Langkah Astra (Pemisahan Fakta vs Opini)
Setiap tiket analisis dan rekomendasi wajib memisahkan secara ketat:
* **FAKTA DATA:** Harga terakhir, volume transaksi, moving average (MA20/MA50), RSI 14, dan data arus modal asing.
* **HIPOTESIS / TESIS:** Asumsi setup strategi kuantitatif (Breakout, Retest, Akumulasi).
* **BATAS INVALIDASI (GUGUR):** 3 kondisi objektif yang membatalkan rencana jika pasar berbalik arah.
* **STATUS:** Seluruh sinyal berstatus `AWAITING_HUMAN_REVIEW` (keputusan eksekusi 100% di tangan pengguna).

---

## 2. DEFINISI DETAIL FITUR & MODUL SISTEM

Sistem Project MBG v2 dibangun di atas 8 modul inti yang bekerja secara terkoordinasi:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PETA ARSITEKTUR 8 MODUL FITUR MBG V2                                      │
├────────────────────────────────┬────────────────────────────────┬──────────────────────────────────────────┤
│ 1. Terminal Web Cockpit        │ 2. SMC Detector                │ 3. Bandarmologi IIFS                     │
│    (Next.js/React + Cloudflare)│    (Order Block, FVG, & BOS)   │    (Z-Score Composite Inflow/Outflow)    │
├────────────────────────────────┼────────────────────────────────┼──────────────────────────────────────────┤
│ 4. TimesFM 2.5 Forecaster      │ 5. Exp3 Strategy Bandit        │ 6. Virtual Paper Trading                 │
│    (Probabilitas 80% Band)     │    (Liga Pembelajaran Mesin)   │    (Forward Test State Machine 30 Hari)  │
├────────────────────────────────┼────────────────────────────────┼──────────────────────────────────────────┤
│ 7. LLM Brain Astra Plan        │ 8. Telegram Radar 24/7         │ 9. Edge Infrastructure                   │
│    (Gemini Narrative & Sizing) │    (6 Template Siaga & 2-Arah) │    (Cloudflare Pages Jakarta <25ms)      │
└────────────────────────────────┴────────────────────────────────┴──────────────────────────────────────────┘
```

---

### MODUL 1: TERMINAL WEB COCKPIT (FRONTEND INTERAKTIF)
*Lokasi Kode:* `frontend/src/`  
Antarmuka visual modern berstandar *Bloomberg Terminal* dengan skema warna gelap (*Dark Slate*), font monospace (*DM Mono / Roboto Mono*), dan tata letak informasi padat tanpa scrolling berlebih.

#### Komponen Fitur Web:
1. **Master Top Bar HUD:**
   - **WIB Digital Clock:** Waktu pasar real-time Jakarta.
   - **Status Data:** Menampilkan timestamp pembaruan data terkini (`LAST UPDATE: HH:MM:SS WIB`) atau status `DATA OFFLINE 🔴`.
   - **Tombol Kalkulator Lot (`💰 KALKULATOR LOT`):** Membuka modal kalkulator ukuran lot modal.
   - **Tombol Chart Global (`📈 LAUNCH CHART`):** Membuka modal TradingView interaktif untuk emiten mana pun.
   - **Theme Toggle:** Beralih antara Dark Mode dan Light Mode instan.
2. **Bloomberg NewsWire (Macro Ticker Tape & Carousel):**
   - Menampilkan 4 tolok ukur makro dunia: **Emas (XAU)**, **Minyak Mentah Brent**, **Indeks Dolar (DXY)**, dan **Yield Obligasi US 10Y**.
   - Carousel berita headline berputar otomatis setiap 6 detik.
   - Menampilkan badge emiten BEI yang langsung terdampak (contoh: lonjakan emas memunculkan badge hijau `$ANTM`, `$BRMS` yang dapat diklik langsung untuk memunculkan chart).
3. **Executive Hero Bar (3-Box HUD):**
   - **Kotak 1: Sentimen Pasar & IHSG Bias:** Menampilkan sentimen umum (*BULLISH / CAUTIOUS / BEARISH*) dan penjelasan makro ringkas.
   - **Kotak 2: Alpha Saham BEI Pilihan #1:** Saham lokal dengan skor probabilitas tertinggi hari ini.
   - **Kotak 3: Alpha Crypto Spot Pilihan #1:** Pair kripto USDT dengan momentum teknikal terbersih.
4. **Master Quant Leaderboard (5 Tab Navigasi Utama):**
   - **Tab 1: 📈 SAHAM IDX:**
     Menggabungkan seluruh emiten saham Indonesia dalam tabel kuantitatif berurut. Memiliki 5 sub-filter (Pill):
     - `SEMUA SAHAM`: Seluruh pantauan bursa.
     - `🎯 TOP TRADE PLANS`: Khusus emiten yang memiliki tiket beli resmi Astra.
     - `🏢 KLASTER KONGLO`: Filter 6 grup konglomerasi besar (Barito, Salim, Astra, Djarum, Bakrie, Adaro).
     - `💰 DIVIDEN HUNTER`: Saham pembagi dividen yield tinggi lengkap dengan indikator risiko *Dividend Trap*.
     - `🌊 FLOW ASING`: Saham yang sedang diakumulasi (*Inflow*) atau dilepas (*Outflow*) oleh asing.
   - **Tab 2: ⚡ CRYPTO SPOT:**
     Tabel 10 setup kripto spot USDT (tanpa margin/leverage sehingga nol risiko likuidasi).
   - **Tab 3: 📰 LIVE NEWS:**
     Feed 25 berita ekonomi terkini yang disaring otomatis dari RSS dengan kategori tag (*METALS, ENERGY, BANKING, FOREIGN_FLOW, MACRO, IHSG*).
   - **Tab 4: ⭐ WATCHLIST SAYA:**
     Fitur pantauan kustom berbasis penyimpanan lokal browser (`localStorage`). Pengguna dapat menambah/menghapus emiten favorit.
   - **Tab 5: 📚 WIKI & KAMUS:**
     Kamus saku menjelaskan istilah teknis (R:R, Invalidation Rules, Bandarmologi, Dividend Trap, RSI, MA20/MA50).
5. **Interactive TradingView Modal:**
   - Menyematkan widget resmi TradingView Advanced Candle Chart lengkap dengan indikator MA, RSI, dan Volume tanpa perlu keluar dari dashboard.
6. **Kalkulator Lot Astra Modal (`LotCalculatorModal.jsx`):**
   - Input: Modal (Rp), Harga Entry, Harga Stop Loss, dan Persentase Risiko (1%–5%).
   - Output Otomatis: Jumlah maksimal lot aman yang boleh dibeli, total nilai pembelian, persentase portofolio, dan rasio Risk/Reward.
   - Peringatan Risiko: Tanda bahaya kuning jika total alokasi melebihi 25% modal portofolio.

---

### MODUL 2: DETEKTOR SMART MONEY CONCEPTS (SMC)
*Lokasi Kode:* `engine/analyzer/smc_detector.py`  
Modul yang melacak jejak transaksi institusi keuangan kakap melalui pergerakan harga tanpa bias emosi:

1. **Order Block (OB):**
   - **Bullish OB:** Candle *bearish* terakhir sebelum terjadi lonjakan harga impulsif naik (*impulse move* > 2x ATR atau 3 candle hijau berturut-turut). Ini adalah zona di mana institusi memasang order beli masif.
   - **Bearish OB:** Candle *bullish* terakhir sebelum penurunan tajam.
   - **Status Order Block:**
     - `FRESH`: Belum pernah disentuh kembali oleh harga (peluang pantulan tertinggi).
     - `TESTED`: Harga sudah masuk ke zona ini dan memantul.
     - `BROKEN`: Harga sudah menembus zona ini (area dibatalkan).
2. **Fair Value Gap (FVG):**
   - Ketidakseimbangan harga (*imbalance*) yang terjadi antara titik *High* candle ke-(n-1) dan titik *Low* candle ke-(n+1). Area ini sering bertindak sebagai magnet bagi harga untuk "menutup celah".
3. **Break of Structure (BOS):**
   - Konfirmasi pergeseran tren. Terjadi ketika harga menembus level puncak tertinggi sebelumnya (*Bullish BOS*) atau menembus level terendah sebelumnya (*Bearish BOS*).
4. **Zona Diskon vs Premium:**
   - Membagi rentang pergerakan 20 hari menjadi dua:
     - **Discount Zone (Bawah):** Area murah di bawah harga wajar tengah (Golden zone beli).
     - **Premium Zone (Atas):** Area mahal di atas harga tengah (Area take profit).
5. **Confluence Score (0–100%):**
   - Skor akumulatif kelayakan setup: bertambah jika harga berada di zona diskon + dekat Order Block Fresh + terdapat FVG yang belum tertutup + konfirmasi BOS bullish.

---

### MODUL 3: BANDARMOLOGI IIFS (INSTITUTIONAL INVESTOR FLOW SCORE)
*Lokasi Kode:* `engine/analyzer/bandarmology_iifs.py`  
Karena data *broker summary* BEI disamarkan sejak 2021, modul ini menggunakan proxy statistik multi-variabel untuk mendeteksi uang investor asing dan bandar:

1. **Komponen Skor Komposit IIFS:**
   - **On-Balance Volume (OBV) Z-Score (Bobot 30%):** Mengukur apakah volume lebih besar terjadi di hari kenaikan atau penurunan.
   - **Money Flow Index (MFI) Z-Score (Bobot 25%):** Mengukur tekanan volume pada harga rata-rata tipikal.
   - **Deviasi VWAP (Bobot 25%):** Jarak harga terhadap *Volume-Weighted Average Price*.
   - **Chaikin Accumulation/Distribution Line (Bobot 20%):** Mengukur posisi penutupan relatif terhadap rentang harian dikali volume.
2. **Klasifikasi Aliran Dana Asing/Bandar:**
   - `HEAVY_ACCUMULATION` ($Z > +2.0$): Akumulasi masif luar biasa.
   - `ACCUMULATION` ($+1.0 < Z \le +2.0$): Pembelian institusional teratur.
   - `MILD_ACCUMULATION` ($+0.5 < Z \le +1.0$): Aliran masuk bertahap.
   - `NEUTRAL` ($-0.5 \le Z \le +0.5$): Tidak ada dominasi pembeli/penjual.
   - `DISTRIBUTION` ($-2.0 \le Z < -1.0$): Aksi jual dan pembuangan barang.
   - `HEAVY_DISTRIBUTION` ($Z < -2.0$): Distribusi dan *dumping* agresif.

---

### MODUL 4: GOOGLE TIMESFM 2.5 FORECASTER (AI RAMALAN HARGA)
*Lokasi Kode:* `engine/analyzer/timesfm_forecaster.py`  
Kecerdasan buatan foundation model waktu runtut (*time-series*) yang dikembangkan oleh Google Research untuk meramalkan lintasan harga ke depan:

1. **Horizon Prediksi:** 5 hari bursa ke depan.
2. **Pita Probabilitas 80% (Confidence Bands):**
   - Tidak hanya memberikan 1 angka ramalan, tetapi rentang *Upper Band* (Batas Atas Optimis) dan *Lower Band* (Batas Bawah Pesimis) dengan derajat keyakinan 80%.
3. **Probabilitas Tren (`probability_up`):** Peluang persentase harga bergerak menguat vs melemah.
4. **Statistical Ensemble Fallback:**
   - Jika pustaka TimesFM tidak terpasang di komputer/server, modul otomatis beralih ke mesin statistik gabungan (Regresi Linear 20 bar + Momentum EMA + Volatilitas Historis Log Return) tanpa pernah terjadi error.

---

### MODUL 5: LIGA STRATEGI EXP3 MULTI-ARMED BANDIT
*Lokasi Kode:* `engine/analyzer/exp3_bandit.py`  
Algoritma pembelajaran mesin adaptif (*online machine learning*) yang menjalankan "liga persaingan" antar strategi trading:

1. **Strategi yang Dilombakan:** `BREAKOUT`, `ACCUMULATION`, `OVERSOLD_REBOUND`, `PULLBACK`, `SMC_ORDER_BLOCK`, `DIVIDEND_TRAP`, `FOREIGN_FLOW_MOMENTUM`.
2. **Mekanisme Pembobotan:**
   - Setiap transaksi yang berhasil mencapai Target Profit diberi poin reward positif.
   - Setiap transaksi yang menyentuh Stop Loss diberi bobot negatif.
   - Sistem secara dinamis meningkatkan porsi rekomendasi untuk strategi yang sedang memiliki win rate tertinggi pada kondisi bursa terkini.

---

### MODUL 6: VIRTUAL PAPER TRADING PORTFOLIO (PENGUJIAN TANPA RISIKO)
*Lokasi Kode:* `engine/analyzer/paper_portfolio.py`  
Mesin simulasi forward-testing otomatis yang mencatat dan menguji setiap tiket rekomendasi:

1. **Alur Status Transaksi (State Machine):**
   ```
   [PENDING] ──> Harga masuk zona beli ──> [ACTIVE]
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
             [TP1/TP2 HIT]                [SL HIT]                  [EXPIRED]
           (Untung Terkunci)          (Rugi Dibatasi)          (Batal jika >5 hari)
   ```
2. **Pencatatan Riwayat:**
   - Menghitung modal virtual (dimulai dari Rp 100 Juta), Win Rate %, Total PnL, rata-rata R:R yang dicapai, serta otomatis mengarsipkan tiket transaksi yang berumur lebih dari 30 hari (*rolling 30-day auto-purge*).

---

### MODUL 7: LLM BRAIN & SINTESIS TIKET ASTRA
*Lokasi Kode:* `engine/analyzer/llm_brain.py`  
Mesin pembentuk rencana trading harian yang menggabungkan seluruh analisis kuantitatif menjadi tiket eksekusi ramah pengguna:

1. **Formula Perhitungan Risiko:**
   - **Entry Price:** Harga penutupan terkini atau zona diskon Smart Money.
   - **Hard Stop Loss (SL):** Ditetapkan ketat (rata-rata 3%–4% di bawah harga beli).
   - **Target Profit 1 (TP1):** Dihitung minimum $2.2 \times$ Risiko ($R:R \ge 1:2.2$).
   - **Target Profit 2 (TP2):** Dihitung $3.6 \times$ Risiko ($R:R \ge 1:3.6$).
2. **Penerjemah "Bahasa Bayi" (Gemini 2.0 Flash):**
   - Menjelaskan peristiwa ekonomi global rumit dalam 2 kalimat santai yang bisa dimengerti oleh pemula tanpa latar belakang sarjana ekonomi.

---

### MODUL 8: MESIN NOTIFIKASI & CHAT BOT TELEGRAM 24/7
*Lokasi Kode:* `engine/notifiers/telegram_notifier.py` & `telegram_bot_handler.py`  
Asisten pribadi pintar di saku pengguna yang siaga siang dan malam.

#### 6 Format Komunikasi Telegram:
1. **Sinyal Saham & Kripto Siap Beli (Instant Buy Alert):**
   Dikirim saat terdeteksi konfirmasi SMC + Akumulasi Asing. Memuat kode saham, fakta harga, rentang antre beli, titik SL, TP1, TP2, dan instruksi lot aman.
2. **Breaking Macro & Shock Radar (Siaga 24/7):**
   Dikirim seketika saat Emas, Minyak, atau Dolar bergerak ekstrem, lengkap dengan penjelasan bahasa bayi dan sektor emiten BEI yang diuntungkan.
3. **Morning Intelligence Briefing (Setiap Hari Pukul 07:15 WIB):**
   Ringkasan Wall Street semalam, harga komoditas dunia, dan Top 5 Saham BEI pilihan hari ini sebelum pasar dibuka.
4. **Midday Sesi 1 Recap (Setiap Hari Bursa Pukul 12:15 WIB):**
   Laporan transaksi paruh hari BEI, top saham akumulasi asing, dan panduan taktis sesi 2.
5. **Evening Closing & Global Night Watch (Setiap Hari Pukul 18:30 WIB):**
   Evaluasi penutupan IHSG, status rekomendasi yang mencapai target profit, dan radar pembukaan bursa New York malam hari.
6. **Chat Interaktif 2-Arah (Conversational Mode):**
   Pengguna dapat mengetik pesan kapan saja ke bot:
   - `/start` : Panduan bantuan bot.
   - `/rekom` : Menampilkan saham rekomendasi teratas saat ini.
   - `/cek <TICKER>` : Menampilkan bedah teknikal dan bandar kilat (contoh: `/cek BBRI`).
   - `/news` : Menampilkan 5 berita ekonomi dunia terkini.
   - `/lot <MODAL> <ENTRY> <SL>` : Menghitung batas pembelian lot aman.

---

## 3. PANDUAN STANDAR OPERASIONAL PROSEDUR (SOP) TRADER

Diagram alur keputusan bagi seorang trader sejak pagi hingga malam:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            SOP HARIAN PENGGUNA TRADING MBG V2                               │
├───────────────┬─────────────────────────────────────────────────────────────────────────────┤
│ 07:15 WIB     │ 1. BUKA NOTIFIKASI TELEGRAM DI SMARTPHONE                                   │
│               │ • Baca Morning Briefing: Cek arah indeks global dan komoditas.              │
│               │ • Catat Top 5 Saham BEI pilihan hari ini.                                   │
├───────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 08:45 WIB     │ 2. BUKA WEB COCKPIT CLOUDFLARE (https://mbg-trading.pages.dev)              │
│               │ • Periksa apakah saham incaran berada di zona diskon SMC.                   │
│               │ • Pastikan status Arus Asing (IIFS) berwarna HIJAU (Akumulasi).             │
├───────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 08:50 WIB     │ 3. HITUNG LOT AMAN DENGAN KALKULATOR LOT ASTRA                              │
│               │ • Buka tombol "Hitung Lot" di drawer saham.                                 │
│               │ • Masukkan total modal Anda (misal: Rp 10.000.000).                         │
│               │ • Sistem akan menampilkan batas lot maksimal (misal: "Beli Maks 12 Lot").   │
├───────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 09:00 WIB     │ 4. PASANG ORDER DI APLIKASI SEKURITAS ANDA (Ajaib, Stockbit, dll)           │
│               │ • Pasang antre beli persis di rentang Entry Zone.                            │
│               │ • Pasang order jual otomatis Stop Loss (disiplin cut loss jika tersentuh).   │
│               │ • Pasang antrean jual Target Profit 1 (TP1) untuk mengunci untung 50%.       │
├───────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 12:15 WIB     │ 5. CEK TELEGRAM MIDDAY RECAP                                                │
│               │ • Evaluasi penutupan sesi 1. Amati jika asing menambah atau melepas posisi. │
├───────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 18:30 WIB     │ 6. EVALUASI SORE HARI                                                       │
│               │ • Baca Evening Watch di Telegram. Geser Stop Loss ke Break-Even Point (BEP) │
│               │   jika saham Anda sudah menyentuh target TP1.                               │
└───────────────┴─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. KAMUS ISTILAH KUANTITATIF (GLOSARIUM AWAM)

| Istilah | Penjelasan Bagi Orang Awam |
| :--- | :--- |
| **Risk / Reward Ratio (R:R)** | Perbandingan antara risiko kerugian dan target keuntungan. Standar Astra mewajibkan minimal 1:2 (artinya siap rugi Rp 100 untuk potensi untung minimal Rp 200). |
| **Hard Stop Loss (SL)** | Batas harga mutlak di mana trader harus menjual rugi demi mencegah kehancuran modal akun. |
| **Dividend Trap** | Fenomena di mana harga saham anjlok tajam setelah tanggal *Cum Date* dividen lewat, melebihi keuntungan dividen yang diterima. |
| **Net Foreign Flow** | Selisih total nilai pembelian dikurangi penjualan oleh investor asing. Bernilai positif jika asing memborong saham lokal. |
| **Moving Average (MA20 / MA50)** | Garis harga rata-rata selama 20 hari (jangka pendek) dan 50 hari (jangka menengah). Jika harga di atas MA20, tren dinyatakan naik (*uptrend*). |
| **RSI 14 Wilder Smoothing** | Indikator pengukur kejenuhan pasar dari skala 0–100. Angka di bawah 35 menandakan saham sudah terlalu murah (*oversold*) dan berpotensi memantul naik. |
| **Crypto Spot (USDT)** | Pembelian aset kripto murni tanpa pinjaman atau leverage. Bebas biaya inap dan tidak dapat dilikuidasi ke nol saat pasar berfluktuasi tajam. |
| **Klaster Konglomerat** | Pengelompokan saham berdasarkan pemilik modal taipan Indonesia (contoh: Prajogo Pangestu di Barito Group, Salim Group di Indofood). |

---

## 5. REKAPITULASI BIAYA BULANAN (Rp 0 / BULAN)

| Komponen Sistem | Penyedia Layanan | Biaya Bulanan |
| :--- | :--- | :--- |
| Web Frontend & CDN Global | Cloudflare Pages (Jakarta Node) | **Rp 0** (Free Unlimited) |
| Edge Redirect & Headers Cache | Cloudflare Edge Engine | **Rp 0** (Free) |
| Otak Analisis Python & 4 Cron 24/7 | GitHub Actions (Ubuntu Runner) | **Rp 0** (Free 2.000 menit/bln) |
| Database Riwayat 30 Hari | Supabase PostgreSQL | **Rp 0** (Free Tier 500MB) |
| Jalur Notifikasi Telegram | Telegram Official Bot API | **Rp 0** (Free Unlimited) |
| Data Pasar Saham & Makro | Yahoo Finance & Binance Public API | **Rp 0** (Free Open Endpoints) |
| **TOTAL BIAYA OPERASIONAL** | — | **RP 0 / BULAN (GRATIS SELAMANYA)** |
