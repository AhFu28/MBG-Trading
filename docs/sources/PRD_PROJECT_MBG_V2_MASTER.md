# MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD)
## PROJECT MBG VERSION 2 — The Unified Autonomous Quant Cockpit & 24/7 Intelligence Terminal
### Penggabungan Komprehensif: Project ARIB (Terminal Visual) + MBG Trading Cockpit v1 (Otak BEI & Telegram) + MBG B Plan (SMC, Bandarmologi & TimesFM AI) + Cloudflare Edge

**Dokumen Identifier:** `MBG-V2-PRD-MASTER-LAYMAN-PRO-V2.0`  
**Nama Resmi Proyek:** **Project MBG version 2** (Market Brain Grid v2)  
**Target Pembaca:** Pemilik Bisnis, Investor, Trader Pemula/Awam, Tim IT, Desainer Produk  
**Standar Kepatuhan:** Doktrin 5 Langkah Astra (Pemisahan Fakta & Opini) · Zero-Hallucination Gate · OJK/BEI Microstructure  
**Infrastruktur Target:** Cloudflare Pages & Workers KV · GitHub Actions 24/7 · Supabase DB · Telegram Bot 24/7  
**Status Dokumen:** FINAL & APPROVED FOR PRODUCTION SPRINT  
**Tanggal Efektif:** 2026-09-09  

---

## 1. Visi Produk & Mengapa Project MBG version 2 Dibuat (Panduan Awam)

### 1.1 Masalah Nyata yang Dialami Trader Sehari-hari
Banyak orang ingin mendapatkan keuntungan dari pasar saham (BEI Indonesia), pasar saham global (Amerika, Asia), maupun pasar kripto. Namun, **90% trader pemula dan retail mengalami kerugian (boncos)** karena 3 alasan mendasar:
1. **Ketinggalan Berita & Sinyal Bagus (FOMO):**  
   Peluang emas di pasar sering muncul tiba-tiba saat kita sedang sibuk bekerja, di jalan, atau tidur. Trader sering baru tahu sebuah saham terbang setelah harganya di pucuk, lalu nekat membeli dan akhirnya tersangkut.
2. **Berita Terlalu Rumit / Tidak Tahu Efek Riilnya:**  
   Ketika ada rilis berita dunia (The Fed menaikkan suku bunga, eskalasi geopolitik, perang dagang, harga minyak mentah melonjak), orang awam tidak paham apa efeknya ke saham lokal seperti BBRI, ASII, atau koin Bitcoin.
3. **Trading Pakai Emosi & Salah Hitung Ukuran Pembelian (Lot):**  
   Banyak orang membeli saham tanpa rencana jelas. Mereka tidak tahu di harga berapa harus membatasi kerugian (*Stop Loss*) dan membeli terlalu banyak lot sehingga saat harga turun sedikit, uang tabungan langsung tergerus parah.

### 1.2 Solusi Project MBG version 2
**Project MBG version 2** adalah penggabungan terlengkap antara **Terminal Visual Modern (ARIB)**, **Otak Analisis Kuantitatif & Konglomerat BEI (MBG v1)**, **Kecerdasan Buatan Google TimesFM & Smart Money (MBG B Plan)**, dan **Infrastruktur Super Cepat Cloudflare**:
* **Asisten Pribadi 24/7 di Saku Anda:** Bot Telegram yang aktif siang-malam mengirimkan breaking news penting dan sinyal rekomendasi saham/kripto yang siap beli secara instan.
* **Menerjemahkan Bahasa Ekonomi Rumit ke "Bahasa Bayi":** Penjelasan santai yang bisa dipahami dalam 5 detik oleh siapa pun tanpa latar belakang sarjana ekonomi.
* **Detektor Uang Investor Kakap & Asing (Bandarmologi):** Memastikan kita hanya masuk ke saham yang sedang diakumulasi oleh investor institusi dan konglomerasi besar.
* **Kalkulator Anti-Boncos Standar Astra:** Menghitung secara eksak berapa lot yang boleh dibeli agar risiko terukur dan dompet tetap aman.
* **Infrastruktur Berkecepatan Tinggi & Nol Biaya (Zero-Cost):** Menggunakan server lokal Cloudflare Jakarta (<25ms) tanpa biaya langganan bulanan selamanya (Rp 0 / bulan).

---

## 2. Visualisasi Grafik Alur Proses Bisnis & Alur Keputusan Pengguna Awam

Untuk memudahkan pemahaman bagi tim non-IT, proses bisnis Project MBG version 2 dirangkum ke dalam 2 diagram alur visual:

### 2.1 Diagram Alur Proses Bisnis Menyeluruh (End-to-End System Architecture)
Diagram ini menggambarkan bagaimana data mentah dari bursa dunia diolah oleh kecerdasan buatan hingga menjadi keputusan trading yang aman dan terukur:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          DIAGRAM ALUR PROSES BISNIS END-TO-END // PROJECT MBG VERSION 2                     │
├─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬───────────────────┤
│    TAHAP 1      │     TAHAP 2     │     TAHAP 3     │     TAHAP 4     │     TAHAP 5     │      TAHAP 6      │
│  PENGUMPULAN    │   OTAK QUANT    │  FILTER RISIKO  │   DISTRIBUSI    │    EKSEKUSI     │ EVALUASI OTOMATIS │
│    DATA 24/7    │   & AI PINTAR   │  STANDAR ASTRA  │  MULTI-CHANNEL  │  OLEH PENGGUNA  │  (FEEDBACK LOOP)  │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼───────────────────┤
│ • Saham BEI     │ • Detektor SMC  │ • Pisah Fakta   │ • Push Telegram │ • Pengguna Cek  │ • Paper Trading   │
│ • Wall Street   │   (Order Block) │   vs Opini      │   ke Smartphone │   Rencana di Web│   Virtual 30 Hari │
│ • Kurs Forex    │ • Bandarmologi  │ • Hitung Batas  │ • Web Cockpit   │ • Buka Sekuritas│ • Liga Strategi   │
│ • Suku Bunga Fed│   Asing (IIFS)  │   Beli & SL     │   Cloudflare    │   (Ajaib/Stock) │   Exp3 Bandit     │
│ • Minyak & Emas │ • AI TimesFM    │ • Formula Lot   │ • Flash Alert   │ • Beli Sesuai   │ • Sistem Otomatis │
│ (Zero-Cost API) │   (Rentang 80%) │   Modal Aman    │   Makro 24/7    │   Ukuran Lot    │   Makin Pintar    │
└────────┬────────┴────────┬────────┴────────┬────────┴────────┬────────┴────────┬────────┴─────────┬─────────┘
         │                 │                 │                 │                 │                  │
         └─────────────────┴─────────────────┴─────────────────┴─────────────────┴──────────────────┘
                                   ▲                                                        │
                                   └─────── [FEEDBACK LOOP: Evaluasi Hasil Memperbaiki Bobot] ──┘
```

#### Penjelasan Tahapan bagi Orang Awam:
1. **Tahap 1 (Pengumpulan Data 24/7):** Sistem menyedot data harga pasar dunia tanpa henti menggunakan API resmi European Central Bank dan Yahoo Finance secara gratis (Zero-Cost).
2. **Tahap 2 (Otak Quant & AI Pintar):** Data disaring oleh kecerdasan buatan Google TimesFM 2.5 dan algoritma Bandarmologi untuk memastikan kita hanya melirik saham yang sedang diborong investor kakap/asing.
3. **Tahap 3 (Filter Risiko Standar Astra):** Sistem menguji kelayakan sinyal. Jika rasio untung/rugi di bawah 1:2 atau risiko terlalu besar, sinyal **langsung dibuang demi keamanan uang pengguna**.
4. **Tahap 4 (Distribusi Multi-Channel):** Sinyal yang lolos sensor seketika dikirim ke handphone Anda via Telegram dan ditampilkan di web cockpit Cloudflare.
5. **Tahap 5 (Eksekusi Mandiri Pengguna):** Pengguna membaca tiket trading, memasukkan modal di kalkulator lot, dan memasang antrean di aplikasi sekuritas resmi (Ajaib, Stockbit, Mandiri Sekuritas, dll.).
6. **Tahap 6 (Evaluasi Otomatis & Feedback Loop):** Setiap hasil transaksi dicatat di portofolio virtual. Algoritma Exp3 Multi-Armed Bandit mengevaluasi strategi mana yang paling ampuh, sehingga sistem terus belajar dan semakin pintar seiring berjalannya waktu.

---

### 2.2 Diagram Alur Perjalanan Pengguna Awam (User Daily Operational Flowchart)
Diagram ini memandu langkah demi langkah yang harus dilakukan seorang trader awam sejak bangun tidur hingga bursa tutup:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                      SOP HARIAN PENGGUNA AWAM // BAGAIMANA TRADER MENGAMBIL KEPUTUSAN                       │
├──────────────────────┬──────────────────────┬──────────────────────┬────────────────────────────────────────┤
│    JAM 07:15 WIB     │    JAM 08:45 WIB     │    JAM 08:50 WIB     │             JAM 09:00 WIB              │
│   1. BUKA TELEGRAM   │  2. BUKA WEB COCKPIT │  3. HITUNG LOT MODAL │        4. ORDER DI SEKURITAS           │
├──────────────────────┼──────────────────────┼──────────────────────┼────────────────────────────────────────┤
│ • Buka pesan di HP   │ • Buka link di web   │ • Buka Kalkulator    │ • Buka aplikasi sekuritas Anda         │
│ • Baca ringkasan     │ • Cek grafik AI      │   Lot Astra          │ • Pasang antre beli persis angka tiket │
│   kondisi dunia      │   TimesFM 80%        │ • Ketik modal Anda   │ • Pasang Stop Loss dan Target Untung   │
│ • Lihat Top 5 Saham  │ • Pastikan indikator │ • Sistem hitungkan:  │ • Eksekusi santai dan disiplin tanpa   │
│   BEI & Kripto       │   Asing warna HIJAU  │   "Beli 12 Lot"      │   emosi dan rasa takut                 │
└──────────────────────┴──────────────────────┴──────────────────────┴────────────────────────────────────────┘
          ▲
          └─────────── [SIAGA 24/7: Jika ada Berita Darurat / Sinyal Baru, HP Otomatis Bergetar!]
```

---

## 3. Fitur Unggulan Bot Telegram 24/7 (News & Rekomendasi Saham Siaga)

Salah satu keunggulan terbesar Project MBG version 2 adalah **Mesin Bot Telegram Otonom 24/7**. Sistem ini memiliki dua mode operasional:
1. **Mode Broadcast Push Otomatis (Siaga 24/7):** Bot secara mandiri mengirimkan sinyal siap beli, breaking news, dan briefing harian.
2. **Mode Percakapan Interaktif 2-Arah (Conversational Chat Mode):** Pengguna dapat mengetik pesan/perintah kapan saja (misal: `/rekom`, `/news`, `/cek BBRI`) dan bot akan langsung membalas percakapan secara cerdas.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                  6 FORMAT PESAN TELEGRAM BOT PROJECT MBG V2                │
├─────────────────────────────────────┬──────────────────────────────────────┤
│ 1. Sinyal Siap Beli (Instant Buy)   │ 2. Breaking News & Macro Alert 24/7  │
│ 3. Morning Briefing (07:15 WIB)     │ 4. Midday Sesi 1 Recap (12:15 WIB)   │
│ 5. Evening Global Watch (18:30 WIB) │ 6. Chat Interaktif 2-Arah (/rekom)   │
└─────────────────────────────────────┴──────────────────────────────────────┘
```

### 3.1 Tipe 1: Sinyal Saham & Kripto Siap Beli (Instant Buy Signal Alert — Siaga 24/7)
* **Kapan Dikirim?** Seketika saat sistem mendeteksi ada saham BEI atau pair kripto yang menyentuh "Zona Emas" (Konfirmasi Smart Money Order Block + Akumulasi Asing Z-score tinggi + Tren AI TimesFM positif).
* **Format Pesan Telegram:**
  ```text
  🎯 [SINYAL SIAP BELI] — REKOMENDASI TERVERIFIKASI
  Instrumen: $BBRI (Bank Rakyat Indonesia)
  Setup: Rebound Support Konglomerat & Inflow Asing
  
  📊 FAKTA DATA:
  • Harga Terakhir: Rp 4.920
  • Net Foreign Buy 3 Hari: +Rp 385 Miliar (Akumulasi Kuat)
  • Sinyal AI TimesFM: Probabilitas Bullish 84% (Rentang Rp 4.900 - Rp 5.250)
  
  🎯 RENCANA EKSEKUSI (STANDAR ASTRA):
  • Area Beli (Entry Zone): Rp 4.900 - Rp 4.940
  • Hard Stop Loss (SL): Rp 4.750 (Jual rugi jika jebol)
  • Target Profit 1 (TP1): Rp 5.150 (+4.6%)
  • Target Profit 2 (TP2): Rp 5.350 (+8.7%)
  • Rasio Risk/Reward: 1 : 2.5 (Sangat Sehat)
  
  💰 KALKULATOR LOT (CONTOH MODAL RP 10 JUTA, RISIKO 2% = RP 200.000):
  👉 Beli Maksimal: 12 Lot (Jangan lebih demi keamanan modal!)
  
  ⚠️ CATATAN: Status AWAITING_HUMAN_REVIEW. Cek chart lengkap di Cockpit:
  🔗 https://mbg-v2.pages.dev/markets/indonesia
  ```

### 3.2 Tipe 2: Breaking News & Macro Shock Radar (Siaga 24/7)
* **Kapan Dikirim?** Seketika saat terjadi lonjakan harga Emas (XAU), Minyak Mentah (Brent/WTI), Dolar AS (DXY), atau ada rilis data The Fed/inflasi/geopolitik mendadak.
* **Format Pesan Telegram:**
  ```text
  🚨 [BREAKING MACRO ALERT] — VOLATILITAS TINGGI TERDETEKSI
  Peristiwa: Lonjakan Harga Emas Dunia (+2.4% dalam 2 Jam)
  Level Bahaya: 🔴 TINGGI (HIGH IMPACT)
  
  💡 PENJELASAN BAHASA BAYI:
  "Ketegangan geopolitik Timur Tengah memanas. Investor dunia panik dan
  berebut mengamankan uang ke Emas. Akibatnya harga emas internasional terbang."
  
  🌊 DAMPAK KE PASAR & DOMPET ANDA:
  • Saham Emas BEI ($ANTM, $BRMS): Bullish kuat (potensi lonjakan pembukaan).
  • Saham Perbankan & IHSG: Potensi tertekan aksi ambil untung sementara.
  • Aset Kripto ($BTC): Mengalami volatilitas tajam 2-4 jam ke depan.
  
  🛡️ SARAN TINDAKAN TRADER:
  Jangan buru-buru 'Haka' saham perbankan. Pantau saham emas untuk swing cepat, dan pasang Stop Loss ketat.
  ```

### 3.3 Tipe 3: Morning Intelligence Briefing (Setiap Hari Jam 07:15 WIB)
* **Kapan Dikirim?** Pagi hari pukul 07:15 WIB sebelum bursa saham Indonesia (BEI) dibuka.
* **Format Pesan Telegram:**
  ```text
  🌅 [MORNING BRIEFING] — RADAR INTELIJEN PASAR MBG V2
  📅 Tanggal: Kamis, 10 September 2026 | Jam: 07:15 WIB
  
  🌍 SENTIMEN PASAR GLOBAL:
  • Wall Street: S&P 500 (+0.45%), Nasdaq (+0.62%) — Rally saham teknologi
  • Komoditas: Minyak Brent ($78.40 / +1.2%), Emas ($2.510 / +0.3%)
  • Kurs & Yield: DXY (101.2 pts), US 10Y Yield (3.82% / Stabil)
  • Kesimpulan Makro: Pasar cenderung Kondusif & Bullish untuk IHSG hari ini.
  
  🇮🇩 TOP 5 SAHAM PILIHAN BEI HARI INI (REKOMENDASI ASTRA):
  1. $BBRI [BUY] — Entry: Rp 4.900 | SL: Rp 4.750 | TP: Rp 5.250 (Asing Akumulasi)
  2. $ASII [BUY] — Entry: Rp 5.150 | SL: Rp 5.000 | TP: Rp 5.450 (Rebound Support)
  3. $BREN [BUY] — Entry: Rp 9.800 | SL: Rp 9.400 | TP: Rp 10.600 (Breakout Konglo)
  4. $ICBP [BUY] — Entry: Rp 11.200 | SL: Rp 10.900 | TP: Rp 11.800 (Defensif Salim)
  5. $PTBA [BUY] — Entry: Rp 2.650 | SL: Rp 2.580 | TP: Rp 2.800 (Dividen Trap Aman)
  
  ⚡ TOP 3 CRYPTO SPOT (USDT):
  1. $BTC/USDT [LONG] — Entry: $58.200 | SL: $56.800 | TP: $61.500
  2. $ETH/USDT [LONG] — Entry: $2.480 | SL: $2.390 | TP: $2.650
  3. $SOL/USDT [LONG] — Entry: $138.5 | SL: $132.0 | TP: $152.0
  
  🔗 Buka Cockpit Lengkap & Kalkulator Lot: https://mbg-v2.pages.dev
  ```

### 3.4 Tipe 4: Midday Session 1 Recap (Setiap Hari Bursa Jam 12:15 WIB)
* **Kapan Dikirim?** Siang hari pukul 12:15 WIB saat istirahat perdagangan Sesi 1 BEI.
* **Format Pesan Telegram:**
  ```text
  ☕ [MIDDAY RECAP] — LAPORAN SESI 1 BURSA EFEK INDONESIA
  📊 IHSG Sesi 1: 7.540 (+0.58%) | Total Transaksi: Rp 5.8 Triliun
  
  🌊 RADAR BANDARMOLOGI & FOREIGN FLOW:
  • Net Foreign Flow: +Rp 412 Miliar (Net Buy Asing Masif)
  • Top 3 Akumulasi Asing: $BBRI (+Rp 180B), $BMRI (+Rp 95B), $ASII (+Rp 62B)
  • Top 3 Distribusi Asing: $GOTO (-Rp 45B), $TLKM (-Rp 38B), $KLBF (-Rp 21B)
  
  💡 PANDUAN SESI 2 (13:30 WIB):
  "Inflow asing sangat kuat di sektor perbankan. Saham $BBRI dan $BMRI berpotensi
  melanjutkan penguatan. Saham $ASII bertahan kuat di area support. Amankan posisi
  dan jangan mengejar saham yang sudah naik di atas +10%."
  ```

### 3.5 Tipe 5: Evening Closing & Global Night Watch (Setiap Hari Jam 18:30 WIB)
* **Kapan Dikirim?** Sore/malam hari pukul 18:30 WIB setelah bursa BEI tutup dan menjelang Wall Street buka.
* **Format Pesan Telegram:**
  ```text
  🌙 [EVENING WATCH] — EVALUASI BEI & RADAR WALL STREET
  📊 Penutupan IHSG: 7.562 (+0.87%) | Net Foreign Buy Total: +Rp 740 Miliar
  
  📋 STATUS REKOMENDASI HARI INI:
  • $BBRI: TP1 TERCAPAI di Rp 5.150 (+4.6%) — Amankan 50% profit, pasang SL di BEP!
  • $ASII: AKTIF di Rp 5.225 (+1.4%) — Hold sesuai rencana
  • $BREN: PENDING ENTRY — Belum menyentuh batas antre beli aman
  
  🇺🇸 PERSIAPAN PEMBUKAAN WALL STREET (20:30 WIB):
  • Agenda Malam Ini: Rilis Data Klaim Pengangguran US (Initial Jobless Claims)
  • Fokus Pantauan: Aset Kripto $BTC dan Indeks Nasdaq
  • Bot tetap siaga 24/7 memantau volatilitas pasar malam ini.
  ```

### 3.6 Tipe 6: Format Percakapan Interaktif 2-Arah (Conversational Chat Mode)
Pengguna dapat mengobrol / berkirim pesan interaktif dengan bot di Telegram. Bot mengenali perintah cerdas dan langsung menjawab seketika:

* **Contoh 1: Meminta Rekomendasi Saham Aktif**
  * **User Chat:** `/rekom`
  * **Bot Balas:**
    ```text
    🤖 [REKOMENDASI AKTIF SAAT INI]
    Ada 3 setup berprobabilitas tinggi yang siap dipantau:
    1. $BBRI (Buy Zone: Rp 4.900 - Rp 4.940 | R:R 1:2.5)
    2. $ASII (Buy Zone: Rp 5.150 - Rp 5.175 | R:R 1:2.2)
    3. $BTC/USDT (Long Zone: $58.000 - $58.300 | R:R 1:2.8)
    
    👉 Ketik /cek [KODE_SAHAM] untuk melihat tiket detail & hitung lot modal Anda!
    ```

* **Contoh 2: Meminta Analisis Saham Tertentu**
  * **User Chat:** `/cek BBCA`
  * **Bot Balas:**
    ```text
    🔍 [ANALISIS KILAT] — $BBCA (Bank Central Asia)
    • Harga Terakhir: Rp 9.850 (-0.25%)
    • Status Bandar: Net Foreign Buy +Rp 142 Miliar hari ini (Akumulasi Sehat)
    • Level Diskon Smart Money: Order Block di Rp 9.750 - Rp 9.800
    • Ramalan AI TimesFM: Tren Bullish Moderat (Rentang: Rp 9.750 - Rp 10.150)
    • Rekomendasi: Antre beli di area Rp 9.775, Stop Loss di Rp 9.600, Target Rp 10.150.
    ```

* **Contoh 3: Meminta Update Berita Makro Terkini**
  * **User Chat:** `/news`
  * **Bot Balas:**
    ```text
    📰 [RADAR BERITA MAKRO TERKINI]
    1. 🏦 The Fed rilis notula rapat malam ini jam 01:00 WIB (Potensi volatilitas USD).
    2. 🛢️ Cadangan minyak mentah AS turun 2.1 juta barel (Minyak Brent menguat).
    3. 🇮🇩 Bank Indonesia pertahankan suku bunga BI-Rate di 6.00% (Sentimen stabil).
    ```

---

## 3. Spesifikasi Modul Fitur Lengkap Project MBG version 2

```
┌────────────────────────────────────────────────────────────────────────────┐
│                 ARSITEKTUR UTAMA PROJECT MBG VERSION 2                     │
├────────────────────────────────────────────────────────────────────────────┤
│ 1. Terminal Web Cockpit (Next.js 16 + Tailwind v4 + Cloudflare Pages)      │
│    • 14 Tab Pasar Dunia (BEI, Wall Street, Asia, Bonds, Forex, Kripto)     │
│    • Kalender Ekonomi Deep-Dive & Penerjemah Makro "Bahasa Bayi"          │
│    • Matriks Korelasi Pearson & Simulasi Backtest Historis 2 Tahun        │
│    • Command Palette (Ctrl+K), Audio Alert Synthesizer, & i18n 4 Bahasa   │
├────────────────────────────────────────────────────────────────────────────┤
│ 2. Otak Quant & Bandarmologi (Python 3.11 + GitHub Actions Cron 24/7)      │
│    • Smart Money Concepts (Order Block & Fair Value Gap discount)          │
│    • Bandarmologi IIFS (Z-Score Net Foreign Flow & Akumulasi Broker)      │
│    • AI Google TimesFM 2.5 Probabilistic Price Forecasting (Rentang 80%)  │
│    • Exp3 Multi-Armed Bandit (Liga Strategi Otomatis Beradaptasi)        │
│    • Virtual Paper Trading State Machine (Pengujian Sinyal Tanpa Risiko)   │
├────────────────────────────────────────────────────────────────────────────┤
│ 3. Sistem Distribusi Sinyal & Notifikasi (Telegram Official Bot API)       │
│    • Push Sinyal Siap Beli 24/7 + Breaking News + Morning/Evening Briefing │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Evaluasi Cloudflare — Mengapa Jauh Lebih Menguntungkan?

| Parameter | Hosting Biasa (Vercel) | Cloudflare Pages + Workers (Pilihan Juara) | Manfaat Riil Bagi Pengguna |
| :--- | :--- | :--- | :--- |
| **Kecepatan di Indonesia** | 80 - 150 ms (Server Singapore/US) | **15 - 25 ms (Data Center Lokal Jakarta)** | Web terbuka seketika (*zero-lag*), grafik chart tidak berputar-putar. |
| **Batas Kuota Bandwidth** | 100 GB/bulan (Lewat kuota bayar mahal) | **GRATIS TANPA BATAS (Unlimited Bandwidth)** | Mau dibuka oleh ribuan pengunjung, nol risiko tagihan tak terduga. |
| **Proteksi Keamanan Bot** | Captcha standar membingungkan | **Cloudflare Turnstile Enterprise** | Dashboard aman dari serangan hacker tanpa mengganggu user manusia. |
| **Edge Memory Caching** | Terbatas pada memory lokal | **Workers KV Distributed Global Cache** | Data harga saham disimpan di ribuan edge server, anti-blokir Yahoo. |
| **Biaya Server Bulanan** | Berpotensi $20 - $100/bulan | **RP 0 / BULAN (100% Free Tier Compliant)** | 100% bebas biaya operasional bulanan selamanya. |

---

## 5. Rincian Anggaran Resource (Pembuktian Biaya Operasional Rp 0 / Bulan)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                ANGGARAN OPERASIONAL BULANAN PROJECT MBG V2                 │
├────────────────────────────┬─────────────────────────────┬─────────────────┤
│ Komponen Sistem            │ Penyedia Layanan            │ Biaya Bulanan   │
├────────────────────────────┼─────────────────────────────┼─────────────────┤
│ 1. Web Frontend & CDN      │ Cloudflare Pages            │ Rp 0 (Free)     │
│ 2. Edge Cache Data Harga   │ Cloudflare Workers KV       │ Rp 0 (Free)     │
│ 3. Keamanan Anti-Bot       │ Cloudflare Turnstile        │ Rp 0 (Free)     │
│ 4. Otak Analisis Quant 24/7│ GitHub Actions (Ubuntu)     │ Rp 0 (Free)     │
│ 5. Database Riwayat 30 Hari│ Supabase PostgreSQL         │ Rp 0 (Free)     │
│ 6. Bot Notifikasi 24/7     │ Telegram Official Bot API   │ Rp 0 (Free)     │
│ 7. Sumber Data Harga Live  │ Frankfurter ECB + Yahoo v8  │ Rp 0 (Free)     │
│ 8. Domain Kustom (Opsional)│ Cloudflare Registrar        │ ~Rp 12.500/bln  │
│                            │ (Hanya Rp 150.000 / tahun)  │                 │
├────────────────────────────┴─────────────────────────────┼─────────────────┤
│ TOTAL BIAYA OPERASIONAL BULANAN                          │ RP 0 / BULAN    │
└──────────────────────────────────────────────────────────┴─────────────────┘
```

---

## 6. Panduan Lengkap Tahapan Set Up (Step-by-Step Setup Guide)

Berikut adalah panduan instalasi langkah demi langkah dari nol agar sistem ini dapat langsung dijalankan oleh siapa pun:

```
[LANGKAH 1] Ekstraksi Source Code ──> [LANGKAH 2] Setup Database Supabase
        │                                       │
        ▼                                       ▼
[LANGKAH 3] Buat Bot Telegram     ──> [LANGKAH 4] Konfigurasi Berkas .env
        │                                       │
        ▼                                       ▼
[LANGKAH 5] Uji Coba di Laptop    ──> [LANGKAH 6] Deploy 1-Klik ke Cloudflare
```

### Langkah 1: Ekstraksi Berkas & Persiapan Lingkungan
1. Pastikan di komputer Anda terpasang **Node.js (v20+)** atau **Bun**, serta **Python 3.11+**.
2. Ekstrak file arsip Project ARIB ke dalam folder proyek:
   ```powershell
   mkdir "C:\Users\ASUS\Documents\Project anti gravitasi\mbg TRADING\project-mbg-v2"
   cd "C:\Users\ASUS\Documents\Project anti gravitasi\mbg TRADING\project-mbg-v2"
   tar -xf "..\another project\workspace-a06a10fe-6053-422d-8978-e162f9d1f17d.tar"
   ```

### Langkah 2: Setup Database Supabase (Gratis)
1. Buka [supabase.com](https://supabase.com) dan buat akun gratis.
2. Buat proyek baru dengan nama `mbg-v2-db` (pilih region Singapore).
3. Masuk ke menu **SQL Editor**, salin dan jalankan skrip `engine/database/schema.sql` untuk membuat tabel trade plans, foreign flow, dan paper portfolio.
4. Buka menu **Project Settings > API**, salin `Project URL` dan `anon / service_role API Key`.

### Langkah 3: Membuat Bot Telegram & Mendapatkan Chat ID
1. Buka aplikasi Telegram, cari akun resmi **@BotFather**.
2. Ketik `/newbot`, beri nama: `MBG v2 Trading Radar`, dan username: `mbg_v2_quant_bot`.
3. Simpan **Telegram Bot Token** yang diberikan.
4. Untuk mendapatkan Chat ID Anda: Cari akun **@userinfobot** di Telegram, klik Start. Catat angka `Id` Anda (misal: `123456789`).

### Langkah 4: Konfigurasi File Lingkungan (`.env`)
Buat file bernama `.env` di folder utama dan isi kredensial Anda:
```ini
# Database Supabase
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...kunci_rahasia

# Bot Telegram 24/7
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ
TELEGRAM_CHAT_ID=123456789

# Master Password Cockpit Web
COCKPIT_PASSWORD=MBG::Xk9#Tr4d3!C0ckp1t_Zw&Qr7
```

### Langkah 5: Menjalankan & Menguji di Komputer Lokal
1. **Jalankan Pipeline Analisis Python (Test Kirim Telegram):**
   ```bash
   py -m pip install -r engine/requirements.txt
   py engine/run_pipeline.py --mode all
   ```
   *Cek HP Anda: Pesan briefing Telegram pertama akan langsung masuk dalam hitungan detik!*
2. **Jalankan Tampilan Web Dashboard:**
   ```bash
   npm install
   npm run dev
   ```
   Buka browser di `http://localhost:3000`. Dashboard interaktif langsung aktif dengan data live.

### Langkah 6: Deploy Otomatis ke Cloudflare Pages (Online 24/7)
1. Simpan proyek ke akun GitHub Anda (`git push origin main`).
2. Buka dashboard [cloudflare.com](https://cloudflare.com), pilih menu **Compute (Pages) > Connect to Git**.
3. Pilih repository Anda, set Framework Preset: **Next.js**, lalu klik **Save and Deploy**.
4. Website Anda langsung online di domain gratis: `https://project-mbg-v2.pages.dev` dengan kecepatan server lokal Jakarta dan proteksi anti-DDoS gratis.
5. GitHub Actions otomatis bekerja siang-malam menjalankan cron radar makro dan sinyal trading setiap jam tanpa perlu laptop Anda menyala.

---

## 7. Panduan SOP Harian Penggunaan bagi Trader Awam

```
[07:15 WIB] Buka Telegram di HP ──> Baca 5 Saham Pilihan & Arah Makro Dunia Hari Ini
     │
     ▼
[08:45 WIB] Buka Web Cockpit    ──> Cek Grafik AI TimesFM & Detektor Arus Asing (Bandar)
     │
     ▼
[08:50 WIB] Hitung Ukuran Lot   ──> Masukkan Modal di Kalkulator Lot (Ketahui Risiko Maksimal)
     │
     ▼
[09:00 WIB] Pasang Order        ──> Antre Beli di Aplikasi Sekuritas Anda Sesuai Rencana
     │
     ▼
[SEPANJANG HARI] Siaga Telegram ──> Jika Ada Berita Darurat / Sinyal Baru, HP Otomatis Berbunyi
```

---

## 8. Roadmap Pelaksanaan Bertahap (Sprint Execution Plan)

* **Sprint 1 (Fondasi & Cloudflare Deploy):**
  * Ekstrak stack Next.js ARIB dan koneksikan ke Cloudflare Pages.
  * Uji latensi server Jakarta (<25ms) dan pasang proteksi Cloudflare Turnstile.
* **Sprint 2 (Penyatuan Otak Quant MBG):**
  * Sambungkan radar konglomerat BEI, Dividen Hunter, dan kalkulator lot Astra ke UI.
  * Hubungkan database Supabase PostgreSQL untuk rekam jejak 30 hari.
* **Sprint 3 (Aktivasi Bot Telegram 24/7 & AI TimesFM):**
  * Konfigurasikan bot Telegram untuk mengirimkan Sinyal Siap Beli instan dan Flash Alert Makro.
  * Aktifkan pita probabilitas harga Google TimesFM 2.5 di grafik chart.
* **Sprint 4 (Simulasi Virtual & Peluncuran Resmi):**
  * Lakukan uji coba paper trading selama 14 hari perdagangan bursa.
  * Verifikasi keandalan notifikasi saat terjadi rilis data ekonomi berdampak tinggi.
  * Peluncuran resmi **Project MBG version 2** kepada seluruh stakeholder.
