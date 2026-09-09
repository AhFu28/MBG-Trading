# 📘 MANUAL PENGGUNA & DEPLOYMENT GUIDE // PROJECT MBG VERSION 2
## The Unified Autonomous Quant Cockpit & 24/7 Intelligence Terminal

**Dokumen Versi:** `v2.2-PRODUCTION`  
**Status Sistem:** FULLY INTEGRATED & VERIFIED ✅  
**Terakhir Diperbarui:** 2026-09-09  

---

## 1. Arsitektur Sistem Terkini (Post-Audit Implementation)

Project MBG v2 menggabungkan 4 komponen utama tanpa biaya bulanan (Rp 0 / bulan):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PROJECT MBG V2 — SYSTEM TOPOLOGY                                │
├───────────────────────────────┬───────────────────────────────┬────────────────────────┤
│ 1. DATA & ENGINE (PYTHON)     │ 2. EDGE FRONTEND (CLOUDFLARE) │ 3. NOTIFIKASI & CHAT   │
├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ • yfinance & Binance Feeds    │ • Cloudflare Pages (Jakarta)  │ • 24/7 Broadcast Push  │
│ • Google News RSS Live        │ • Vite + React 18 SPA         │ • 2-Way Bot Polling    │
│ • SMC Order Block & FVG       │ • Bloomberg Terminal HUD      │ • Pagi (07:15 WIB)     │
│ • Bandarmologi IIFS Z-Score   │ • TradingView Modal           │ • Midday (12:15 WIB)   │
│ • TimesFM 2.5 AI Forecaster   │ • Astra Lot Calculator Modal  │ • Evening (18:30 WIB)  │
│ • Exp3 Multi-Armed Bandit     │ • Telemetry Cache (/data/)    │ • Hourly Flash Alerts  │
│ • Virtual Paper Trading 30-Day│ • Dual-Theme Dark/Light       │ • Interaktif: /rekom,  │
│ • Supabase + Local Fallback   │ • Latensi Edge <25ms          │   /cek, /news, /lot    │
└───────────────────────────────┴───────────────────────────────┴────────────────────────┘
```

---

## 2. Fitur Unggulan Terbaru

### A. Otak Analisis Kuantitatif (Quant Brain)
1. **SMC Detector (`smc_detector.py`):**
   - Mendeteksi *Bullish & Bearish Order Blocks* (status: `FRESH`, `TESTED`, `BROKEN`).
   - Melacak *Fair Value Gap (FVG)* yang belum tertutup (*unfilled*).
   - Mengidentifikasi *Break of Structure (BOS)* dan menghitung *Confluence Score* (0-100%).
2. **Bandarmologi IIFS (`bandarmology_iifs.py`):**
   - Menghitung skor komposit Z-score dari On-Balance Volume (OBV), Money Flow Index (MFI), Deviasi VWAP, dan Garis Akumulasi/Distribusi Chaikin (A/D).
   - Klasifikasi: `HEAVY_ACCUMULATION`, `ACCUMULATION`, `NEUTRAL`, `DISTRIBUTION`, `HEAVY_DISTRIBUTION`.
3. **TimesFM 2.5 AI Forecaster (`timesfm_forecaster.py`):**
   - Proyeksi probabilistik harga saham dengan *Confidence Band 80%*.
   - Dilengkapi *Statistical Ensemble Fallback* otomatis jika model AI belum terinstal lokal.
4. **Exp3 Strategy Bandit (`exp3_bandit.py`):**
   - Algoritma machine learning online yang mengevaluasi performa tiap strategi (Breakout, Accumulation, SMC, Dividend Trap) dan memprioritaskan strategi ber-win rate tertinggi.
5. **Virtual Paper Portfolio (`paper_portfolio.py`):**
   - Simulasi forward-test otomatis melacak pergerakan order (`PENDING` ➔ `ACTIVE` ➔ `TP1/TP2/SL`) dengan auto-purge riwayat 30 hari.

### B. Interaksi Telegram Bot 2-Arah (`telegram_bot_handler.py`)
Bot tidak hanya mengirim pesan siaga, namun bisa diajak chat interaktif kapan saja:
- `/rekom` : Menampilkan Top 5 rekomendasi saham/kripto terverifikasi.
- `/cek <TICKER>` : Analisis instan saham (contoh: `/cek BBRI` atau `/cek BTCUSDT`).
- `/news` : 5 berita makroekonomi & komoditas terkini beserta sektor terdampak.
- `/lot <MODAL> <ENTRY> <SL>` : Menghitung batas aman pembelian lot (Risiko 2% Standar Astra).
  *Contoh:* `/lot 10000000 4900 4750` ➔ output: **Maksimal 13 Lot**.

### C. Web Cockpit & Kalkulator Lot Interaktif
- **Kalkulator Lot Astra:** Tersedia via tombol `💰 KALKULATOR LOT` di top bar dan tombol `💰 Hitung Lot` di setiap drawer saham.
- **Hero Bar Dinamis:** Indikator sentimen dan narasi makro terhubung langsung ke data live.
- **Timestamp Jujur:** Menampilkan waktu sinkronisasi data aktual (`LAST UPDATE: HH:MM:SS WIB`).

---

## 3. Panduan Langkah Demi Langkah: Hubungkan ke Cloudflare Pages

Mengapa Cloudflare Pages?
- **Server Lokal Jakarta:** Latensi hanya 15–25 ms (jauh lebih cepat dibanding server Singapura/US di 80–150 ms).
- **Unlimited Bandwidth:** 100% gratis tanpa risiko tagihan over-quota.
- **Konfigurasi Otomatis:** File `_redirects` dan `_headers` sudah disiapkan di folder `frontend/public/`.

### Langkah 1: Push Project ke GitHub
Buka terminal dan jalankan:
```bash
git add .
git commit -m "feat: complete MBG v2 modules, Telegram bot, and Cloudflare configuration"
git push origin main
```

### Langkah 2: Hubungkan Repositori ke Cloudflare Dashboard
1. Buka [dash.cloudflare.com](https://dash.cloudflare.com/) dan login/daftar akun gratis.
2. Di sidebar kiri, klik **Workers & Pages**.
3. Klik tombol **Create Application** ➔ pilih tab **Pages** ➔ klik **Connect to Git**.
4. Pilih akun GitHub Anda dan pilih repository `mbg TRADING` (atau nama repo Anda).
5. Klik **Begin setup**.

### Langkah 3: Konfigurasi Build Settings di Cloudflare Pages
Isi formulir konfigurasi persis seperti berikut:

| Parameter | Nilai Pengaturan | Keterangan |
| :--- | :--- | :--- |
| **Project name** | `mbg-v2-cockpit` | Bebas (akan jadi URL: `*.pages.dev`) |
| **Production branch** | `main` | Branch utama Anda |
| **Framework preset** | `Vite` *(atau None)* | Arsitektur frontend SPA |
| **Root directory** | `frontend` | **PENTING**: Lokasi source code web |
| **Build command** | `npm run build` | Perintah compile frontend |
| **Build output directory** | `dist` | Folder hasil build Vite |

*(Tidak perlu Environment Variable tambahan di frontend karena data telemetry dibaca dari file publik `/data/latest_cockpit_bundle.json`).*

### Langkah 4: Klik "Save and Deploy"
1. Klik **Save and Deploy**.
2. Cloudflare akan melakukan build selama ~1-2 menit.
3. Setelah selesai, website Anda langsung online di URL:
   `https://mbg-v2-cockpit.pages.dev`
4. Routing SPA dan cache data `/data/*.json` otomatis dioptimalkan oleh file `_redirects` dan `_headers`.

---

## 4. Panduan Setup Database Cloud (Supabase)

Agar data histori 30 hari tersimpan di cloud dan tidak muncul peringatan 404 saat pipeline berjalan:

1. Buka dashboard [supabase.com](https://supabase.com) dan buka project Anda.
2. Di menu sidebar kiri, klik icon **SQL Editor**.
3. Klik **New Query**.
4. Buka file [engine/database/schema.sql](file:///c:/Users/ASUS/Documents/Project%20anti%20gravitasi/mbg%20TRADING/engine/database/schema.sql), salin seluruh isinya, dan tempel ke SQL Editor Supabase.
5. Klik tombol **Run** (Ctrl + Enter).
6. Semua tabel (`macro_telemetry`, `idx_categorized`, `crypto_spot_10`, `daily_trade_plans`, `system_state`) serta fungsi auto-purge 30 hari langsung aktif!

---

## 5. SOP Harian Penggunaan (Bagi Trader Awam)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       RUTINITAS OPERASIONAL HARIAN TRADER                   │
├───────────────┬─────────────────────────────────────────────────────────────┤
│ 07:15 WIB     │ Buka Telegram: Baca Morning Briefing dari Bot               │
│               │ (Cek sentimen Wall Street & Top 5 Saham Rekomendasi Hari Ini)│
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 08:45 WIB     │ Buka Web Cockpit (Cloudflare Pages):                        │
│               │ Periksa sinyal SMC, Bandarmologi Inflow, & grafik TimesFM   │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 08:50 WIB     │ Buka Kalkulator Lot:                                        │
│               │ Klik "Hitung Lot" di drawer saham terpilih, masukkan modal, │
│               │ dapatkan angka lot pasti (disiplin risiko max 2%)           │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 09:00 WIB     │ Pasang Antrean di Aplikasi Sekuritas (Ajaib/Stockbit/dll):  │
│               │ Pasang order Buy, Stop Loss, dan Target Profit sesuai tiket │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 12:15 WIB     │ Cek Telegram: Evaluasi Sesi 1 BEI (Midday Recap)            │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 18:30 WIB     │ Cek Telegram: Evening Watch (Evaluasi Penutupan & Global)   │
└───────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 6. Perintah Menjalankan Secara Manual di Komputer

```powershell
# Menjalankan Pipeline Analisis & Kirim Notifikasi Telegram
py engine/run_pipeline.py --mode all

# Menjalankan Mode Bot Interaktif (Polling Chat Telegram)
py engine/run_pipeline.py --mode bot_polling

# Menjalankan Frontend Web Lokal di Laptop
cd frontend
npm run dev
# Buka http://localhost:3000
```
