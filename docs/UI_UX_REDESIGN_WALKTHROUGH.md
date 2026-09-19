# Walkthrough: Perbaikan Desain UI/UX & Mockup 1:1 MBG Quant Terminal

Berikut adalah rekapitulasi komprehensif seluruh perbaikan desain tata letak (layout), ergonomi visual, konsistensi Light/Dark mode, format angka finansial, dan responsiveness mobile pada platform **MBG PRO Tactical Quant Terminal**, dilengkapi dengan mockup visual 1:1 hasil implementasi nyata.

---

## 1. Perbandingan Sebelum & Sesudah (Before vs After)

| Komponen & Aspek | Sebelum Perbaikan (Temuan Audit) | Sesudah Perbaikan (Implementasi & Mockup) | Status |
| :--- | :--- | :--- | :---: |
| **Light Mode Consistency** | Background bursa luar negeri, ticker pill, dan Bloomberg wire bocor/gelap (hitam pekat di atas putih), teks tidak terbaca. | Variabel CSS token `--bg-strip-wire`, `--bg-ticker-pill`, dan teks otomatis adaptif. Kontras tinggi, nyaman di mata. | ✅ Terverifikasi |
| **Ergonomi Tabel Saham IDX** | Angka rata kiri, format titik/koma campur (`Rp 16,800` vs `Rp 16800`), ticker hilang saat scroll horizontal. | Standar finansial: format ribuan titik (`Rp 16.800`), rata kanan (`text-align: right`), delta risiko jarak ke SL (`-X.X% ke SL`), kolom nomor & ticker `sticky`. | ✅ Terverifikasi |
| **Security Hub Drawer (Mini Chart)** | TradingView iframe 220px gagal me-load (kotak hitam kosong & layout bug). | Diganti dengan **native HTML5 Canvas `MiniCandleChart`**: 22 candlestick taktis intraday dengan garis overlay dinamis `TP1` (hijau), `ENTRY` (biru), dan `SL` (merah). Responsif, instan, zero network lag. | ✅ Terverifikasi |
| **Position Sizing & Lot Calculator** | Modal tertutup saat drawer dibuka, input tanpa pemisah ribuan, tidak ada indikasi nominal Rupiah. | Ditambahkan tab **`🧮 HITUNG LOT` langsung di dalam Drawer**, modal dilengkapi chip cepat (`10 Jt`, `50 Jt`, `100 Jt`; `0.5%`, `1%`, `2%`), teks nominal terbilang (*"10 Juta Rupiah"*), dan tombol *Salin Parameter*. | ✅ Terverifikasi |
| **Mobile Layout (375px)** | Tombol hamburger melayang menimpa konten, header wrapping berantakan, overflow horizontal pada ticker global. | Tombol hamburger diintegrasikan ke dalam header bar, padding & margin responsif, cards otomatis stack rapi 1 kolom tanpa overflow. | ✅ Terverifikasi |

---

## 2. Galeri Mockup Visual 1:1

### Mockup 1: Home Command Center (Dark Mode)
Tampilan cockpit utama dalam tema gelap dengan hierarki bento grid yang terstruktur, status real-time bursa global, ticker komoditas, dan live news wire.

![Home Command Center Dark](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/mockup_01_desktop_dark.png)

---

### Mockup 2: Home Command Center (Light Mode)
Verifikasi perbaikan kontras mode terang: Ticker sesi bursa dunia, Bloomberg news wire, badge komoditas OIL/GOLD, dan radar live sidebar kini sepenuhnya kontras dan terbaca jelas tanpa invasi warna gelap.

![Home Command Center Light](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/mockup_02_desktop_light.png)

---

### Mockup 3: Stock Screener Leaderboard (Format Finansial & Sticky Column)
Tabel Saham IDX Alpha dengan rata kanan data finansial (`tabular-nums`), pemisah ribuan titik standar Indonesia (`Rp 16.900`, `Rp 5.325`), live SL risk delta (`-1.9% ke SL`), dan kolom Ticker terkunci (*sticky*).

![Stock Screener Leaderboard](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/mockup_03_stock_screener.png)

---

### Mockup 4: Kalkulator Risiko & Position Sizing Modal
Modal kalkulator lot dengan tombol tutup minimalis, teks terbilang Rupiah dinamis, preset chips portofolio & risiko, serta perhitungan otomatis lot BEI (1 Lot = 100 Lembar).

![Lot Calculator Modal](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/mockup_04_lot_calc.png)

---

### Mockup 5: Security Hub Drawer dengan Native Canvas Mini Candlestick
Mini chart canvas interaktif yang merender candlestick taktis dengan garis panduan level `TP1` (Target Profit), `ENTRY` (Entry Zone), dan `SL` (Stop Loss) yang hidup dan bebas bug.

![Security Hub Drawer with Mini Candlestick](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/mockup_05_security_hub.png)

---

### Mockup 6: Embedded Position Sizing Sub-Tab di dalam Security Hub
Sub-tab `🧮 HITUNG LOT` yang tersemat langsung di dalam panel Drawer, memungkinkan trader menghitung alokasi lot dan menyalin parameter eksekusi seketika tanpa harus meninggalkan konteks analisa.

![Embedded Sizing Tab in Security Hub](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/mockup_05b_drawer_sizing.png)

---

### Mockup 7: Responsiveness Layar Mobile (375px Viewport)
Layout smartphone (iPhone 375x812) dengan tombol menu hamburger yang terintegrasi rapi di sebelah judul modul pada header panel, bebas overflow horizontal, dan kartu bento tersusun vertikal secara proporsional.

![Mobile Viewport 375px](file:///C:/Users/ASUS/.gemini/antigravity/brain/2387abc3-9e7d-48ab-9cf9-391daea2c661/screenshots/mockup_06_mobile_375px.png)

---

## 3. Verifikasi & Pengujian
- **Dev Server**: Vite dev server berjalan normal pada port `3000` dengan semua Hot Module Replacements (HMR) sukses tanpa kompilasi error.
- **Cross-Theme**: Pengujian dark mode dan light mode terbukti bekerja konsisten di seluruh elemen visual.
- **Canvas Rendering**: `MiniCandleChart` mendukung rendering HiDPI (`devicePixelRatio`) sehingga tetap tajam pada layar Retina/4K.
