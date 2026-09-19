# LAPORAN AUDIT MASTER UI/UX, INTERACTION FLOW & TRADING COCKPIT ERGONOMICS
**Platform:** MBG PRO Tactical Quant Terminal  
**Tanggal Audit:** 19 September 2026  
**Metode:** Multi-Agent Multi-Perspective Deep Audit  
**Panel Auditor:**  
1. **Senior UI Visual & Design System Specialist**  
2. **Senior UX & Information Architecture Specialist**  
3. **Head of Trading Desk Usability & Quantitative Financial Cockpit Expert**  
4. **Senior Frontend Accessibility (a11y) & Responsive Layout Engineer**  

---

## 1. Executive Summary & Scorecard

Audit multi-agen independen telah dilakukan terhadap platform **MBG PRO Tactical Quant Terminal** melalui inspeksi source code (`App.jsx`, `index.css`, `Sidebar.jsx`, `HomeDashboardTab.jsx`, `MasterQuantLeaderboard.jsx`, `SecurityHubDrawer.jsx`, `LotCalculatorModal.jsx`) dan evaluasi visual rendering langsung menggunakan headless browser.

### Evaluasi Skor Cockpit (Skala 1 - 10)

| Dimensi Audit | Skor | Status | Temuan Kunci |
|:---|:---:|:---:|:---|
| **Visual Hierarchy & Polish** | **6.5 / 10** | ⚠️ Butuh Perbaikan | Saturasi badge neon tinggi, inkonsistensi Light Mode ("Black-on-Black text"), subpixel fractional rendering. |
| **UX & Interaction Flow** | **5.5 / 10** | ⚠️ Kritis | Handoff destruktif (modal menutup drawer), redundansi 80% antara inline accordion vs drawer, tidak ada autofill emiten. |
| **Trading Ergonomics & Formatting** | **6.0 / 10** | ⚠️ Kritis Finansial | Angka tabel rata kiri, inkonsistensi titik (.) vs koma (,) bursa lokal, input lot calculator rawan fat-finger, mini chart hitam/kosong. |
| **Responsive Mobile (375px) & a11y** | **4.5 / 10** | ❌ Gagal Standar | Header pecah 3 baris, ticker bursa terpotong, kolom harga tabel terputus ke kanan tanpa sticky column, touch target < 20px. |

---

## 2. Galeri Bukti Visual & Temuan Spesifik (Screenshots)

Berikut adalah bukti visual tangkapan layar langsung (*high-resolution screenshots*) yang diambil dari lingkungan runtime aktif:

### Bukti 1: Desktop Home Command Center (Dark Mode)
![01_homepage_dark](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/01_homepage_dark.png)

> [!NOTE]
> **Temuan Kunci Screenshot 01:**
> - **Sensory Overload:** 13 widget aktif bersaing memperebutkan perhatian pengguna dalam 1 layar tanpa anchor fokus utama (*erratic zig-zag scanning*).
> - **Badge Saturation:** Setiap kartu dan ticker memuat badge neon jenuh (`LIVE`, `BREAKOUT`, `NO LEV · SPOT`, `ACTIVE`) tanpa hierarki bobot visual yang seimbang.
> - **Font Sub-Readable:** Di kartu Bento atas (#1 Crypto Spot & #1 IDX Alpha), kuotasi Entry, SL, TP berukuran hanya 9px sehingga sulit dibaca sekilas pada monitor trading resolusi tinggi.

---

### Bukti 2: Desktop Home (Light Mode Inconsistencies & Failures)
![02_homepage_light](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/02_homepage_light.png)

> [!CAUTION]
> **Temuan Kunci Screenshot 02 (Kegagalan Kritis Light Mode):**
> - **Black-on-Black Text di Ticker Sesi Bursa:** Baris bursa dunia (`JKT`, `TYO`, `LON`, `NYC`) mempertahankan background `#1e2024` dari Dark Mode sementara teksnya menggunakan `#121316` (kontras 1.1:1). Nama bursa **hilang total dan tidak terbaca**.
> - **Dark Invasion:** Strip ticker berita atas (`MBG MACRO INTELLIGENCE WIRE`) tetap berwarna hitam pekat di atas halaman yang bernuansa terang, merusak estetika desain sistem.
> - **WCAG AA Contrast Failures:** Teks `GOLD $4,410` (#facc15 di atas putih, rasio 1.56:1) dan `OIL $102.0` (#f59e0b di atas putih, rasio 2.23:1) gagal total memenuhi standar minimal WCAG AA (4.5:1).
> - **Footer Card Kotor:** Bagian bawah kartu bento menampilkan warna abu-abu keruh akibat hardcoded `rgba(0,0,0,0.15)`.

---

### Bukti 3: Screener Saham IDX Alpha (Desktop Table)
![03_stock_screener_dark](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/03_stock_screener_dark.png)

> [!IMPORTANT]
> **Temuan Kunci Screenshot 03 (Ergonomi & Formatting Finansial):**
> - **Inkonsistensi Fatal Titik vs Koma dalam 1 Baris:** Pada emiten `$PGUN`, `Harga Terakhir` diformat `Rp 10.100` (separator titik), tetapi kolom `Entry Plan` dan `Hard SL` diformat `Rp 10,050` dan `Rp 9,648` (separator koma US). Percampuran ini meningkatkan risiko kesalahan baca (*fat-finger error*).
> - **Perataan Angka Kiri (Left-Aligned):** Seluruh angka harga, SL, dan TP rata kiri sehingga digit ribuan tidak lurus secara vertikal. Standar terminal institusional mewajibkan rata kanan (`text-align: right`) dengan `tabular-nums`.
> - **Q-Score Tidak Bisa Di-sort:** Metrik kuantitatif utama terminal (`⚡ 51% Q-Score`, `⚡ 68% Q-Score`) dijejalkan ke dalam sel teks dan tidak memiliki header sorting tersendiri.
> - **Alert Fatigue:** Kolom `Hard SL` selalu berwarna merah menyala statis di setiap baris, melelahkan mata trader dan menumpulkan kepekaan terhadap sinyal bahaya sebenarnya.

---

### Bukti 4: Modal Kalkulator Ukuran Lot & Manajemen Risiko
![04_lot_calc_modal](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/04_lot_calc_modal.png)

> [!WARNING]
> **Temuan Kunci Screenshot 04 (UX & Fat-Finger Risk):**
> - **Input Portofolio Tanpa Pemisah Ribuan:** Menampilkan angka mentah `10000000`. Trader tidak dapat membedakan 10 juta atau 100 juta dalam 1 detik.
> - **Context Blindness:** Modal kalkulator tidak mencantumkan nama emiten yang sedang dihitung.
> - **Input Kosong:** Field `Harga Entry` dan `Harga Stop Loss` kosong dan tidak terisi otomatis saat dibuka dari tombol baris tabel.
> - **Tombol Tutup Agresif:** Tombol `X CLOSE` berwarna merah neon menyala mendominasi visual kalkulator secara tidak perlu.

---

### Bukti 5: Inline Expandable Row Accordion
![05_row_expanded_details](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/05_row_expanded_details.png)

> [!NOTE]
> **Temuan Kunci Screenshot 05:**
> - **Layout Disruption:** Membuka baris detail mendorong seluruh tabel di bawahnya sejauh 300px+, menghilangkan emiten pembanding dari pandangan mata.
> - **Redundansi 80%:** Data di dalam accordion ini hampir identik dengan yang ditampilkan di Security Hub Drawer. Dua komponen terpisah untuk fungsi yang sama memperbesar beban kode dan membingungkan trader.
> - **Hardcoded Math vs Calculator:** Teks statis formula portofolio `Rp 100M x 1% = Rp 1M` tidak sinkron dengan default kalkulator yang menggunakan `Rp 10.000.000` dan `2%`.

---

### Bukti 6: Security Hub Drawer & Mini Candlestick Bug
![06_security_hub_drawer](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/06_security_hub_drawer.png)

> [!CAUTION]
> **Temuan Kunci Screenshot 06 (Root Cause Bug Chart Kosong/Hitam):**
> - **Mini Candlestick Overview Hitam Kosong:** Script yang disuntikkan adalah `embed-widget-advanced-chart.js` (TradingView Advanced iframe) yang membutuhkan tinggi minimal 350px. Di dalam kontainer sempit `height: 220px` dengan animasi CSS `slideInRight`, widget gagal menyelesaikan render layout.
> - **Destructive Navigation:** Mengklik tombol `Full Chart` atau `Hitung Lot` di bagian bawah drawer langsung **menutup paksa drawer**, sehingga trader kehilangan konteks analisa dan harus mengulang pencarian dari awal.
> - **Order Book Terisolasi:** Drawer ini tidak mengintegrasikan simulator order book Level 2, padahal komponen `OrderBookSimulator.jsx` sudah tersedia di codebase.

---

### Bukti 7: Full TradingView Chart Modal
![07_tradingview_modal](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/07_tradingview_modal.png)

> [!NOTE]
> **Temuan Kunci Screenshot 07:**
> - Modal chart berfungsi baik secara visual, namun kontainer dasarnya memiliki inline style `background: '#ffffff'` yang sempat memunculkan flash putih sebelum iframe TradingView termuat di dark mode.

---

### Bukti 8: Terminal Live News Wire Tab
![08_news_tab](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/08_news_tab.png)

> [!NOTE]
> **Temuan Kunci Screenshot 08:**
> - Filter chips di bagian atas (`ALL RESEARCH`, `DAILY BRIEF`, `CRYPTO & ETFS`, dsb.) sangat padat dan tidak memiliki pemisahan visual antara kategori aset dan kategori makro.
> - Kartu berita memiliki hierarki teks yang baik, namun tombol aksi (`DENGAR`, `SALIN`, `POP-UP`) memiliki tap target vertikal yang terlalu sempit untuk penggunaan layar sentuh/tablet.

---

### Bukti 9: Mobile Layout 375px (Viewport Breakage & Clutter)
![09_mobile_homepage](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/09_mobile_homepage.png)

> [!CAUTION]
> **Temuan Kunci Screenshot 09 (Kerusakan Fatal Layar Mobile):**
> - **Floating Hamburger Menu Terisolasi:** Tombol ☰ mengambang sendirian di pojok kiri atas di luar header karena `position: fixed; top: 10px; left: 10px;` sementara main content diberi `padding-top: 56px`.
> - **Header Wrap Berantakan:** Flex header pecah menjadi 3 baris bertingkat yang tidak simetris.
> - **Bursa Global Terpotong:** Status bursa `BURSA ID JKT ... JP TYO ... GB LON ... US NYC 0...` terpotong paksa tanpa indikator scroll horizontal.
> - **Running Wire Tumpang Tindih:** Teks headline dan ticker makro jatuh ke baris bawah dan bertumpuk tidak beraturan.

---

### Bukti 10: Mobile Stock Screener (Data Loss & Column Truncation)
![10_mobile_stock_screener](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/10_mobile_stock_screener.png)

> [!CAUTION]
> **Temuan Kunci Screenshot 10 (Kehilangan Data Kritis di Layar Mobile):**
> - **Data Harga & SL Berada di Luar Layar (Off-Screen):** Hanya kolom `#`, `TICKER`, `GRUP`, dan sebagian `SINYAL` yang tampil di layar 375px. Kolom krusial seperti Harga Terakhir, Entry Plan, Hard SL, TP1, dan R:R terlempar ke kanan.
> - **Ketiadaan Sticky Column:** Tidak ada sticky left pada kolom Ticker. Jika trader menggeser tabel ke kanan, nama emiten hilang dari pandangan.
> - **Touch Target < 20px:** Tombol chart dan panah aksi memiliki area sentuh di bawah 20px (standar minimal WCAG adalah 44x44px).

---

## 3. Matriks Rekomendasi Solusi & Desain Ulang (Action Plan)

Berdasarkan konsensus 4 agen auditor, berikut adalah rencana solusi perbaikan desain bertahap untuk mentransformasi MBG PRO menjadi terminal quant bertaraf institusional:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ROADMAP TRANSFORMASI MBG PRO UI/UX                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  FASE 1: Quick Wins (Formatting, Contrast & Fatal Bugs)                     │
│  - Hapus Black-on-Black text di GlobalMarketTicker                          │
│  - Perbaiki palet Light Mode agar lulus WCAG AA (kontras min. 4.5:1)       │
│  - Standarisasi format angka: rata kanan + pemisah ribuan bursa lokal (.)   │
│  - Ganti TradingView embed di SecurityHub dengan Mini Canvas Chart          │
├─────────────────────────────────────────────────────────────────────────────┤
│  FASE 2: Unified Cockpit & UX Flow Simplification                           │
│  - Satukan Inline Accordion & Security Hub ke "Unified Right Inspector"     │
│  - Sematkan Kalkulator Lot langsung di dalam Inspector (tanpa modal gelap)  │
│  - Tambahkan Formatted Currency Input + Quick Chips (10Jt, 50Jt, 100Jt)     │
│  - Sediakan tombol "Salin Parameter Eksekusi" & "Simpan ke Watchlist"      │
├─────────────────────────────────────────────────────────────────────────────┤
│  FASE 3: Mobile & Layout Responsiveness Overhaul                            │
│  - Satukan tombol hamburger ke dalam navigation header terpadu             │
│  - Terapkan Dual-Mode Screener: Card View di mobile, Table View di desktop  │
│  - Tambahkan Sticky Columns pada kolom Ticker untuk desktop table           │
│  - Perbesar area tap sentuh (min. 44x44px) via invisible pseudo-elements    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Rincian Perbaikan per Komponen

### A. Perbaikan Format Angka & Notasi Finansial
1. **Pemisah Ribuan Seragam:** Terapkan satu fungsi sentral `formatIdrPrice(num)` menggunakan format Indonesia (`.` untuk ribuan) di seluruh sel `Harga Terakhir`, `Entry`, `Hard SL`, dan `TP1`.
2. **Perataan Rata Kanan:** Seluruh sel kuotasi finansial diubah menjadi `text-align: right` dengan class font `tabular-nums`.
3. **Standarisasi Satuan Finansial BEI:** Ganti singkatan `M` (Million) menjadi `Jt` (Juta), dan `B` (Billion) menjadi `M` (Miliar) sesuai konvensi resmi Bursa Efek Indonesia.
4. **Indikator Jarak ke SL/TP (Delta):** Tambahkan mikro-indikator di bawah harga live, misalnya: `(-2.8% ke SL)`.

### B. Perbaikan Design Tokens & Palet Warna (WCAG AA Compliance)
1. **Definisikan Token Semantik Adaptif di `index.css`:**
   ```css
   /* Light Mode Tokens */
   :root {
     --accent-gold-text: #854d0e;   /* Kontras 6.8:1 */
     --accent-orange-text: #c2410c; /* Kontras 4.8:1 */
     --accent-green-text: #15803d;  /* Kontras 4.6:1 */
     --accent-rust-text: #b91c1c;   /* Kontras 5.9:1 */
     --bg-strip-wire: #ffffff;
     --bg-bursa-chip: #f1f5f9;
   }
   /* Dark Mode Tokens */
   [data-theme="dark"] {
     --accent-gold-text: #fbbf24;   /* Kontras 9.2:1 */
     --accent-orange-text: #fb923c; /* Kontras 8.1:1 */
     --accent-green-text: #00d084;  /* Kontras 10.5:1 */
     --accent-rust-text: #ff4d4d;   /* Kontras 6.4:1 */
     --bg-strip-wire: #07090d;
     --bg-bursa-chip: #18202e;
   }
   ```
2. **Eliminasi Subpixel Rendering:** Standarkan seluruh padding, margin, dan gap ke kelipatan grid `4px` dan `8px` (hilangkan semua `3.5px`, `4.5px`, `7.5px`).

### C. Konsolidasi Arsitektur Interaksi: "Unified Right Inspector"
1. **Satu Titik Inspeksi:** Menghilangkan *Inline Accordion* di tabel yang mendorong baris ke bawah. Mengklik baris tabel atau ticker di radar otomatis membuka **Right Inspector Drawer**.
2. **Kalkulator Terintegrasi:** Tab kalkulator berada langsung di dalam Right Inspector (berdampingan dengan mini chart dan level harga), sehingga trader tidak lagi mengalami *context blindness*.
3. **Penyelesaian Bug Mini Candlestick:** Ganti injeksi iframe Advanced Chart TradingView yang gagal pada kontainer 220px dengan **Lightweight-Charts HTML5 Canvas** berukuran ringan (45KB, render seketika tanpa network dependency iframe).

### D. Perbaikan Responsivitas Layar Mobile (< 640px)
1. **Header Re-Architecture:** Pindahkan tombol hamburger ke dalam header flex baris pertama. Hapus `padding-top: 56px` statis pada main content.
2. **Mobile Card View:** Pada layar ponsel (<640px), ubah tabel screener menjadi **Kartu Ringkasan Sinyal Vertikal** yang menyajikan:
   - Baris 1: Ticker + Logo + Harga Live + Persentase Perubahan
   - Baris 2: Badge Sinyal + Q-Score
   - Baris 3: Matrix Level (Entry, SL, TP, R:R)
   - Baris 4: Tombol Aksi Cepat (Chart & Sizing)
3. **Sticky Column untuk Layar Tablet/Desktop:** Bila tabel tetap digunakan pada viewport menengah, kunci kolom `#` dan `Ticker` menggunakan `position: sticky; left: 0; z-index: 2`.
4. **Touch Target Enforcement:** Bungkus semua tombol ikon mikro dengan padding tak terlihat minimal 44x44px (`::after` hit area).
