# Market Brain Grid // Trading Intelligence Cockpit

> **Institutional-Grade Autonomous Quant Intelligence & Daily Stock/Crypto Picker**  
> Melacak Saham Konglomerat BEI, Dividen Hunters, Foreign Flow, 10 Pair Spot Kripto (USDT), Radar Makro AS 24/7 (Fed, Trump, Oil, Gold), serta Bot Telegram Notifier.  
> **Arsitektur Zero-Cost**: GitHub Actions Cron + Supabase PostgreSQL + Cloudflare Pages Dashboard (Password-Protected).

---

## 🔐 Kredensial Akses Web Dashboard (Default)

Web dashboard dilindungi oleh **Password Gate SHA-256 / Edge JWT** (anti-brute force, auto lockout setelah 5x salah, session 24 jam):

- **Master Password (Fase Pengujian)**: `mbg`
- *(Opsional Produksi: Set custom password via environment variable `PASSWORD_HASH` di Cloudflare Pages & `.env`.)*

---

## 🚀 Fitur Utama

1. **🔴 24/7 Global Macro & US Impact Radar**:
   - Pemantauan otomatis harga Emas (XAU), Minyak Mentah Brent, US Dollar Index (DXY), dan Yield US 10Y.
   - Peringatan dampak otomatis ke sektor & emiten BEI (misal: Emas naik $\to$ Bullish $ANTM, $BRMS; Minyak naik $\to$ Bullish $MEDC, $ENRG).
   - Analisis pidato Presiden AS/Trump, rilis data The Fed (CPI/Suku bunga).
2. **⚡ 10 Rekomendasi Spot Kripto (USDT)**:
   - Khusus Spot Market (Tanpa leverage, aman dari likuidasi).
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
7. **📱 Telegram Automated Intelligence Push**:
   - Push briefing pagi pukul 07:15 WIB (Top 5 Saham IDX + Top 5 Spot Kripto).
   - Push Macro Flash Alert instan jika terjadi lonjakan harga Emas/Minyak/DXY (Severity HIGH/CRITICAL).

---

## 🛠️ Arsitektur Sistem (Zero Server Cost)

```
[GitHub Actions Cron]
  ├── Hourly (Tiap Jam)  ──> Tarik Makro AS + Scan 10 Kripto ──> [Telegram Flash jika Kritis]
  └── Daily (07:15 WIB)  ──> Skrining IDX + 20 Trade Plans   ──> [Telegram Daily Morning Push]
            │
            ▼
     [Supabase DB] ── In-place Upsert & Rolling Purge 30 Hari (Anti Mentok Limit 500MB)
            │
            ▼
   [Cloudflare Pages] ── Web Dashboard + Edge Functions (Password-Protected) + TradingView Chart
```

---

## 📖 PANDUAN LENGKAP SETUP: DARI WEB SAMPAI TELEGRAM

Ikuti langkah-langkah di bawah ini secara berurutan:

---

### TAHAP 1: Menjalankan & Menguji di Lokal (Opsional)

#### 1.1 Backend Python Engine
```bash
# Dari root direktori mbg TRADING:
py -m pip install -r engine/requirements.txt

# Menjalankan seluruh pipeline data (IDX, Crypto, Macro, Trade Plans):
py engine/run_pipeline.py --mode all
```
*Data hasil kalkulasi akan otomatis tersimpan di folder `frontend/public/data/latest_cockpit_bundle.json`.*

#### 1.2 Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
1. Buka browser di `http://localhost:3000`.
2. Halaman terkunci oleh **Password Gate**.
3. Masukkan password yang telah Anda konfigurasi di `.env` lalu klik **AUTHENTICATE**.
4. Dashboard telemetry akan terbuka penuh.

---

### TAHAP 2: Setup Bot Telegram & Dapatkan Chat ID

Untuk menerima notifikasi otomatis di HP/Desktop via Telegram:

#### 2.1 Buat Bot Baru
1. Buka Telegram dan cari akun resmi **@BotFather**.
2. Kirim pesan: `/newbot`.
3. Masukkan nama bot Anda, misalnya: `MBG Trading Cockpit Bot`.
4. Masukkan username bot (harus berakhiran `bot`), misalnya: `mbg_trading_quant_bot`.
5. Salin token API yang diberikan BotFather. Formatnya seperti ini:
   ```text
   7123456789:AAFlkjw98234-xYzAbCdEfGhIjKlMnOpQrS
   ```
   *(Simpan token ini sebagai `TELEGRAM_BOT_TOKEN`).*

#### 2.2 Dapatkan Chat ID Anda
1. Buka bot yang baru dibuat di Telegram, lalu klik tombol **Start** (atau kirim pesan apa saja, misalnya: `Halo`).
2. Buka browser Anda dan akses URL berikut (ganti `<TOKEN>` dengan token bot Anda):
   ```text
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
3. Cari bagian `"chat":{"id":123456789,...}`. Angka `123456789` adalah **Chat ID** Anda.
   *(Simpan angka ini sebagai `TELEGRAM_CHAT_ID`).*

#### 2.3 Uji Coba Pengiriman Telegram dari Lokal (Opsional)
Buat file `.env` di root project Anda (salin dari `.env.example`):
```env
TELEGRAM_BOT_TOKEN=7123456789:AAFlkjw98234-xYzAbCdEfGhIjKlMnOpQrS
TELEGRAM_CHAT_ID=123456789
```
Lalu jalankan pipeline:
```bash
py engine/run_pipeline.py --mode all
```
*Bot Telegram Anda akan langsung mengirimkan laporan Daily Briefing IDX & Kripto!*

---

### TAHAP 3: Push Source Code ke GitHub

1. Buat repository baru di [GitHub](https://github.com/new) (disarankan **Private**). Beri nama misalnya: `mbg-trading-cockpit`.
2. Di terminal komputer Anda, commit dan push kode ke GitHub:
```bash
git add -A
git commit -m "feat: complete mbg cockpit with password gate and telegram notifier"
git branch -M main
git remote add origin https://github.com/USERNAME/mbg-trading-cockpit.git
git push -u origin main
```

---

### TAHAP 4: Konfigurasi GitHub Secrets (Supaya AI & Bot Jalan 24 Jam)

GitHub Actions akan menjalankan engine secara otomatis setiap jam (kripto & makro) dan setiap pagi pukul 07:15 WIB (saham IDX & trade plans).

1. Buka repository Anda di GitHub.
2. Klik tab **Settings** $\to$ Pilih **Secrets and variables** di menu kiri $\to$ Klik **Actions**.
3. Klik tombol **New repository secret**, lalu tambahkan variabel berikut:

| Nama Secret | Keterangan | Wajib/Opsional |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Token dari @BotFather | **Wajib** (jika ingin notifikasi Telegram) |
| `TELEGRAM_CHAT_ID` | ID chat/channel Telegram Anda | **Wajib** (jika ingin notifikasi Telegram) |
| `GEMINI_API_KEY` | API Key dari [Google AI Studio](https://aistudio.google.com/) | Opsional (fallback otomatis ke deterministic Astra engine) |
| `SUPABASE_URL` | URL project Supabase Anda | Opsional (fallback otomatis ke file JSON) |
| `SUPABASE_KEY` | Service Role Key Supabase Anda | Opsional |

4. Aktifkan Workflow Permissions:
   - Masih di tab **Settings** $\to$ **Actions** $\to$ **General**.
   - Di bagian **Workflow permissions**, pilih **Read and write permissions**.
   - Klik **Save**. *(Ini diperlukan agar GitHub Actions dapat meng-commit file data terbaru ke repositori).*

---

### TAHAP 5: Deploy Web Dashboard ke Cloudflare Pages (Gratis & Cepat)

1. Buka [Cloudflare Dashboard](https://dash.cloudflare.com) $\to$ **Workers & Pages** $\to$ **Create application** $\to$ **Pages** $\to$ **Connect to Git**.
2. Pilih repository `MBG-Trading` dari daftar GitHub Anda, klik **Begin setup**.
3. Di bagian konfigurasi build:
   - **Project name**: `mbg-trading` (URL: `https://mbg-trading.pages.dev`)
   - **Production branch**: `main`
   - **Framework preset**: `Vite`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Di bagian **Environment variables (advanced)**, tambahkan:
   - `PASSWORD_HASH`: *(Opsional, default test password adalah `mbg`)*
   - `JWT_SECRET`: *(String rahasia acak untuk token login)*
   - `TELEGRAM_WEBHOOK_SECRET`: *(Secret token webhook Telegram)*
5. Klik **Save and Deploy**.
6. Cloudflare Pages akan otomatis mem-build frontend dan mendeploy Edge Functions (`frontend/functions/api/`). Dashboard Anda live di `https://mbg-trading.pages.dev`.

---

### TAHAP 6: Cara Menggunakan & Operasional Sehari-hari

1. **Buka Web**: Kunjungi `https://mbg-trading.pages.dev`, ketik password (default fase test: `mbg`) untuk membuka dashboard.
2. **Cek Telegram Pagi (07:15 WIB)**: Baca ringkasan Top 5 Saham BEI & Top 5 Spot Kripto langsung dari HP Anda.
3. **Cek Grafik Real-Time**: Di dashboard web, klik tombol **"📈 LAUNCH TRADINGVIEW"** atau klik ticker saham/kripto apa pun untuk memunculkan chart interaktif TradingView lengkap dengan indikator MA20, RSI, dan Volume.
4. **Trigger Manual**: Jika sewaktu-waktu ingin memperbarui data secara instan tanpa menunggu jam cron:
   - Buka repo GitHub Anda $\to$ Tab **Actions**.
   - Pilih workflow **"Daily IDX Morning Market Prep"** atau **"24/7 Hourly Crypto & US Macro Radar"**.
   - Klik tombol **Run workflow**.

---

## ⚖️ Lisensi & Disclaimer
Platform ini dibangun khusus untuk riset kuantitatif dan intelijen pasar. Tidak ada eksekusi order otomatis ke bursa. Semua keputusan jual/beli berada 100% di tangan Anda.
