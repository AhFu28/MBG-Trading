# Market Brain Grid // Trading Intelligence Cockpit

> **Institutional-Grade Autonomous Quant Intelligence & Daily Stock/Crypto Picker**  
> Melacak Saham Konglomerat BEI, Dividen Hunters, Foreign Flow, 10 Pair Spot Kripto (USDT), serta Radar Makro AS 24/7 (Fed, Trump, Oil, Gold).  
> **Arsitektur Zero-Cost**: GitHub Actions Cron + Supabase PostgreSQL + Vercel Web Dashboard.

---

## 🚀 Fitur Utama

1. **🔴 24/7 Global Macro & US Impact Radar**:
   - Pemantauan otomatis harga Emas (XAU), Minyak Mentah Brent, US Dollar Index (DXY), dan Yield US 10Y.
   - Peringatan dampak otomatis ke sektor & emiten BEI (misal: Emas naik $\to$ Bullish $ANTM, $BRMS; Minyak naik $\to$ Bullish $MEDC, $ENRG).
   - Analisis pidato Presiden AS/Trump, rilis data The Fed (CPI/Suku bunga).
2. **⚡ 10 Rekomendasi Spot Kripto (USDT)**:
   - Khusus Spot Market (Tanpa margin/leverage, aman dari likuidasi).
   - Setiap kartu menyajikan: **Entry Zone, Hard Stop-Loss, Take Profit 1 (TP1), Take Profit 2 (TP2), dan Rasio Risk/Reward $\ge 1:2$**.
3. **🏢 Segmentasi Saham Konglomerat (Kongsi BEI)**:
   - Pengelompokan emiten: **Barito Group (Prajogo Pangestu)**, **Salim Group**, **Astra Group**, **Djarum Group**, **Bakrie Group**, dan **Adaro Group**.
   - Dilengkapi sinyal teknikal harian: *Breakout*, *Accumulation*, *Oversold Rebound*, *Pullback*.
4. **💰 Dividend Hunters & Aristocrats**:
   - Skrining emiten berdividen tinggi (ITMG, PTBA, ADRO, MPMX, perbankan BUMN).
   - Dilengkapi **Dividend Trap Radar** (peringatan risiko penurunan harga saat Ex-Date).
5. **🌊 Foreign Inflow & Outflow Radar**:
   - Deteksi Top 5 Akumulasi Beli Bersih Asing (*Net Foreign Buy*) vs Top 5 Distribusi Jual Bersih Asing (*Net Foreign Sell*).
6. **🎯 Kartu Rencana Trading Standar Astra**:
   - Pemisahan tegas antara **FAKTA** (harga, tanggal, metrik) vs **OPINI** (tesis teknikal).
   - Aritmatika ukuran posisi transparan: `(Modal × Risk %) ÷ (Entry - SL) = Lot`.
   - 3 Syarat invalidasi pembatalan setup & status wajib: `AWAITING_HUMAN_REVIEW`.

---

## 🛠️ Arsitektur Sistem (Zero Server Cost)

```
[GitHub Actions Cron]
  ├── Hourly (Tiap Jam)  ──> Tarik Berita Makro AS + Scan 10 Spot Kripto
  └── Daily (07:15 WIB)  ──> Skrining Lengkap Saham IDX (Konglo, Dividen, Foreign Flow)
            │
            ▼
     [Supabase DB] ── In-place Upsert & Rolling Purge 30 Hari (Anti Mentok Limit 500MB)
            │
            ▼
    [Vercel Frontend] ── Dashboard Web Instan (< 500ms) Desain Tactical Blueprint
```

---

## 📦 Panduan Menjalankan di Komputer Lokal

### 1. Menjalankan Python Engine (Backend Data)
```bash
# Masuk ke folder engine
cd engine

# Install library
pip install -r requirements.txt

# Jalankan pipeline penuh
python run_pipeline.py --mode all
```
*Hasil analisis akan otomatis tersimpan ke `frontend/public/data/latest_cockpit_bundle.json` dan Supabase.*

### 2. Menjalankan Web Dashboard (Frontend)
```bash
# Masuk ke folder frontend
cd frontend

# Install node modules
npm install

# Jalankan server lokal
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 🌐 Panduan Deploy ke Web & GitHub

### Langkah 1: Push ke Repositori GitHub
```bash
git init
git add .
git commit -m "feat: initial release of MBG Trading Cockpit"
git branch -M main
git remote add origin https://github.com/USERNAME/mbg-trading-cockpit.git
git push -u origin main
```

### Langkah 2: Setting GitHub Secrets (Untuk Cron 24 Jam Otomatis)
Buka repository GitHub Anda $\to$ **Settings** $\to$ **Secrets and variables** $\to$ **Actions** $\to$ Tambahkan:
1. `SUPABASE_URL`: URL project Supabase Anda (opsional, jika pakai Supabase).
2. `SUPABASE_KEY`: Service role key / anon key Supabase Anda.
3. `GEMINI_API_KEY`: API Key Gemini (dari Google AI Studio, gratis).

### Langkah 3: Deploy Frontend ke Vercel (Gratis)
1. Buka [Vercel.com](https://vercel.com) dan hubungkan akun GitHub Anda.
2. Klik **Add New Project** $\to$ Pilih repository `mbg-trading-cockpit`.
3. Set **Root Directory** ke: `frontend`.
4. Klik **Deploy**. Selesai! Web Anda langsung online dan auto-update setiap ada data baru.

---

## ⚖️ Lisensi & Disclaimer
Platform ini dibangun khusus untuk riset kuantitatif dan intelijen pasar. Tidak ada eksekusi order otomatis ke bursa. Semua keputusan jual/beli berada 100% di tangan Anda.
