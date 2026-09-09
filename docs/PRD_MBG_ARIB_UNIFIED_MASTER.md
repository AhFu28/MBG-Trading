# MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD)
## MBG-ARIB QUANTUM COCKPIT — Unified Institutional Trading & Macro Intelligence Terminal
### Penggabungan Komprehensif: Project ARIB + MBG Trading Cockpit v1 + MBG B Plan + Cloudflare Edge Infrastructure

**Dokumen Identifier:** `MBG-ARIB-PRD-UNIFIED-V1.0-LAYMAN-PRO`  
**Klasifikasi:** Master Product Specification & Non-Technical Executive Guide  
**Target Pembaca:** Pemilik Bisnis, Tim Trader, Investor, Pengembang IT, Desainer Produk, Pengguna Awam  
**Standar Kepatuhan:** Doktrin Pemisahan Fakta & Opini Astra · Zero-Hallucination Gate · OJK/BEI Microstructure  
**Infrastruktur Target:** Cloudflare Pages & Workers KV · GitHub Actions (Python Quant) · Supabase DB · Telegram Bot  
**Status Dokumen:** FINAL & SIAP UNTUK REVIEW & EKSEKUSI SPRINT  
**Tanggal Efektif:** 2026-09-09  

---

## 1. Visi Produk & Mengapa Sistem Ini Dibuat (Panduan Bahasa Awam)

### 1.1 Masalah Nyata yang Dialami Trader Sehari-hari
Banyak orang ingin mendapatkan keuntungan dari pasar saham (BEI Indonesia), pasar saham global (Amerika, Asia), maupun pasar kripto. Namun, **90% trader pemula dan retail mengalami kerugian (boncos)** karena 3 alasan utama:
1. **Terlalu Banyak Layar & Berita Berseliweran (Overwhelmed):**  
   Untuk memantau pasar, seseorang harus membuka situs kalender ekonomi, chart grafik harga, portal berita keuangan, hingga media sosial secara bersamaan. Informasi yang masuk saling bertentangan dan membingungkan.
2. **Berita Terlalu Rumit / Tidak Tahu Efek Riilnya:**  
   Ketika berita ekonomi dunia muncul (misalnya: *"The Fed mempertahankan suku bunga"* atau *"Data inflasi CPI Amerika naik 0.3%"*), orang awam tidak mengerti apa artinya bagi uang mereka. Apakah saham bank seperti BBCA akan naik? Apakah emas akan anjlok? Apakah Bitcoin akan crash?
3. **Trading Pakai Emosi & Salah Hitung Ukuran Pembelian (Lot):**  
   Banyak orang membeli saham hanya karena ikut-ikutan teman (FOMO) atau rekomendasi di grup media sosial. Mereka tidak tahu di harga berapa harus membatasi kerugian (*Stop Loss*) dan membeli terlalu banyak lot sehingga saat harga turun sedikit, uang tabungan langsung tergerus parah.

### 1.2 Solusi MBG-ARIB Quantum Cockpit
**MBG-ARIB Quantum Cockpit** adalah satu website terpadu yang bertindak seperti **"Asisten Keuangan Super Pintar & Disiplin"**:
* Sistem ini bekerja otomatis 24 jam sehari memantau seluruh pasar dunia (Indonesia, Amerika, Asia, Emas, Minyak, Dolar, Kripto).
* Sistem ini **menerjemahkan bahasa ekonomi yang rumit menjadi "Bahasa Sehari-hari (Bahasa Bayi)"** yang langsung bisa dipahami dalam 5 detik.
* Sistem ini **mendeteksi ke mana uang investor kakap/asing bergerak** (Bandarmologi & Smart Money) agar kita tidak terjebak membeli di pucuk.
* Sistem ini memiliki **Kalkulator Anti-Boncos Otomatis**: Menghitung secara pasti berapa lembar/lot yang boleh Anda beli sesuai uang dingin yang Anda miliki.
* Sistem ini mengirimkan ringkasan 5 saham pilihan terbaik **langsung ke handphone Anda via Telegram** setiap jam 07:15 pagi sebelum bursa buka.

---

## 2. Hasil Diskusi & Kesepakatan 3 Pilar Tim (IT, Trader, Desain)

Untuk memastikan sistem ini sempurna dari segala sudut pandang, telah dilakukan koordinasi mendalam antara 3 divisi:

```
                  ┌──────────────────────────────────────────┐
                  │          KONSENSUS STRATEGIS 3 TIM       │
                  └────────────────────┬─────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│     TIM IT       │          │    TIM TRADER    │          │    TIM DESAIN    │
│ "Gunakan Stack   │          │ "Wajib Rumus Lot │          │ "Wajib Bahasa    │
│  Next.js 16 ARIB │          │  Astra & Filter  │          │  Awam, Warna     │
│  & Cloudflare"   │          │  Bandarmologi"   │          │  Lampu Lalu Lintas"│
└──────────────────┘          └──────────────────┘          └──────────────────┘
```

### Kesepakatan 1: Keputusan Tim IT (Infrastruktur)
* **Frontend:** Menjadikan antarmuka **Project ARIB (Next.js 16 + Tailwind CSS v4 + shadcn/ui)** sebagai rumah utama. Frontend lama MBG v1 dipensiunkan agar tampilan menjadi ultra-modern dan ringan.
* **Infrastruktur Cloudflare:** Mengalihkan hosting ke **Cloudflare Pages & Workers KV**. Hasilnya: Kecepatan buka web di Indonesia turun drastis ke **di bawah 25 milidetik** (karena server Cloudflare ada di Jakarta) dan **biaya bandwidth 100% GRATIS TANPA BATAS**.
* **Mesin Analisis Quant (Python):** Tetap berjalan otomatis via **GitHub Actions Cron**. Tidak ada server berbayar yang harus disewa bulanan. Seluruh sistem beroperasi dengan **Biaya Operasional Rp 0 / Bulan**.

### Kesepakatan 2: Keputusan Tim Trader (Quant & Risiko)
* **Doktrin 5 Langkah Astra:** Tidak ada rekomendasi yang boleh keluar tanpa pemisahan tegas antara FAKTA (angka real-time) dan OPINI (analisis).
* **Kalkulator Lot Transparan:** Setiap kartu rencana trading wajib menampilkan perhitungan lot transparan: `(Modal x Toleransi Risiko) / (Entry - Stop Loss) = Lot Maksimal`.
* **Smart Money & Bandarmologi:** Saham konglomerat BEI (Grup Barito, Salim, Astra, Djarum, Bakrie, Adaro) wajib dilengkapi skor akumulasi broker dan net foreign flow agar pengguna tahu apakah bandar sedang masuk atau keluar.
* **Status Human-Review:** Status akhir di layar tetap `AWAITING_HUMAN_REVIEW`. Komputer hanya menganalisis dan memberi rekomendasi; keputusan akhir menekan tombol beli di aplikasi sekuritas tetap berada di tangan manusia.

### Kesepakatan 3: Keputusan Tim Desain (UX & Pengalaman Pengguna Awam)
* **Konsep Lampu Lalu Lintas (Traffic Light):**  
  * 🟢 **Hijau Emerald:** Aman, Peluang Bagus, Akumulasi Asing.
  * 🔴 **Merah Rose:** Bahaya, Jual Rugi (Stop Loss), Distribusi Asing, Waspada Dividend Trap.
  * 🟡 **Kuning Amber:** Netral, Hati-hati, Volatilitas Berita Tinggi.
* **Progressive Disclosure (Tampilan Bertingkat):** Pengguna awam hanya melihat kartu ringkasan sederhana (Beli di berapa, Risiko berapa rupiah, Potensi untung berapa). Pengguna mahir dapat mengklik tombol *"Lihat Detail Quant"* untuk membuka grafik probabilitas AI TimesFM, Order Book, dan korelasi Pearson.
* **Pusat Komando Keyboard (`Ctrl+K`):** Navigasi super cepat layaknya mengetik di kolom pencarian Google untuk mencari saham apa pun di dunia.

---

## 3. Cara Kerja Sistem End-to-End (Analogi Sederhana untuk Orang Awam)

Bayangkan sistem ini bekerja seperti **Stasiun Cuaca & Radar Bandara**:

1. **Langkah 1 (Sensor Bekerja 24 Jam):**  
   Sensor sistem terus-menerus memantau harga emas di London, harga minyak mentah di New York, nilai tukar Dolar, inflasi, suku bunga The Fed, dan pergerakan saham di 10 bursa dunia.
2. **Langkah 2 (Penyaringan Angka Kasar oleh Otak Quant):**  
   Setiap pagi pukul 07:00 WIB, mesin pintar menyaring ratusan saham di Bursa Efek Indonesia (BEI) dan ribuan koin kripto. Mesin mengecek: *Siapa saham yang sedang diborong asing? Siapa yang mau bagi dividen besar tapi harganya aman? Siapa yang sedang membentuk pola pantulan kuat?*
3. **Langkah 3 (Kecerdasan Buatan Google TimesFM Menghitung Peluang):**  
   AI menghitung ramalan probabilitas harga 5 hari ke depan, layaknya ramalan cuaca memperkirakan peluang hujan 80%.
4. **Langkah 4 (Penerjemahan Bahasa Manusia):**  
   Sistem menyusun hasil analisis ke dalam kartu sederhana berformat bahasa santai, lengkap dengan hitungan lot modal Anda.
5. **Langkah 5 (Pengiriman Laporan):**  
   Pukul 07:15 WIB, handphone Anda berbunyi menerima pesan Telegram berisi Top 5 Saham Pilihan hari itu beserta link untuk membuka dashboard web interaktif Anda.

---

## 4. Spesifikasi 10 Modul Fitur Unggulan (Detail Tampilan & Kemampuan)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                  10 MODUL UTAMA MBG-ARIB QUANTUM COCKPIT                   │
├─────────────────────────────────────┬──────────────────────────────────────┤
│ M01. Radar Makro "Bahasa Bayi"      │ M02. Kalender Ekonomi Deep-Dive      │
│ M03. Detektor Smart Money & Bandar  │ M04. Ramalan Cuaca AI (TimesFM)      │
│ M05. Kartu Trading Anti-Boncos Astra│ M06. Laboratorium Portofolio Kertas  │
│ M07. Liga Strategi Otomatis (Exp3)  │ M08. Matriks Korelasi & Backtesting  │
│ M09. Terminal 14 Pasar Dunia        │ M10. Bot Telegram Asisten Pribadi    │
└─────────────────────────────────────┴──────────────────────────────────────┘
```

### Modul 1: Radar Makro Global & Penerjemah Berita "Bahasa Bayi"
* **Tampilan di Layar:** Banner peringatan di bagian paling atas dashboard dengan warna sesuai tingkat bahaya (Hijau/Kuning/Merah).
* **Apa yang Dilakukan Sistem:** Memetakan 28 peristiwa penting dunia (Rapat suku bunga The Fed/FOMC, Inflasi CPI, Data Pengangguran NFP, Perang Dagang/Tarif, Pertemuan OPEC).
* **Bagi Orang Awam:** Anda tidak perlu kuliah ekonomi untuk paham berita dunia.  
  *Contoh Tulisan di Layar:*  
  *"🏦 **The Fed Menahan Suku Bunga:** Bank sentral Amerika memutuskan belum menurunkan bunga pinjaman. Artinya dollar masih kuat. Dampak: Saham teknologi dan kripto mungkin agak tertekan 1-2 hari ini. Saham perbankan besar Indonesia (BBCA, BMRI) cenderung aman dan stabil."*

### Modul 2: Kalender Ekonomi Interaktif & Accordion Deep Dive
* **Tampilan di Layar:** Tabel daftar tanggal dan jam rilis berita ekonomi dunia dengan bendera negara (🇺🇸 🇮🇩 🇪🇺 🇯🇵 🇨🇳).
* **Fitur Klik (Accordion):** Ketika sebuah baris berita diklik, baris tersebut membuka panel penjelasan di tempat tanpa pindah halaman:
  1. *Apa ini?* (Definisi sederhana dengan contoh barang belanjaan).
  2. *Kenapa pasar peduli?* (Alasan pengusaha dan bank memantaunya).
  3. *Dampaknya ke mana?* (Tabel efek ke Saham, Forex, Kripto, Emas).
  4. *Tips Pemula:* (Rekomendasi tindakan, misal: "Pasang stop loss lebih ketat atau jangan masuk posisi 30 menit sebelum pengumuman").

### Modul 3: Detektor "Smart Money" (SMC) & Bandarmologi Konglomerat BEI
* **Tampilan di Layar:** Tab khusus bursa Indonesia yang membagi saham berdasarkan pemilik konglomerasi:
  * **Barito Group** (Prajogo Pangestu: BREN, BRPT, TPIA, CUAN, PTRO).
  * **Salim Group** (AMMN, ICBP, INDF, MEDC).
  * **Astra Group** (ASII, AUTO, UNTR).
  * **Djarum Group** (BBCA, TOWR, BELI).
  * **Bakrie Group** (BRMS, BUMI, ENRG).
  * **Adaro Group** (ADRO, ADMR).
* **Detektor Foreign Flow:** Menampilkan indikator meteran akumulasi asing. Jika warna hijau tebal, artinya asing sedang memborong secara masif. Jika merah, artinya asing sedang mencicil jualan.
* **Detektor Smart Money Western (SMC):** Menemukan area *Order Block (OB)* dan *Fair Value Gap (FVG)*—yaitu harga diskon tempat investor institusi biasanya meletakkan order beli raksasa.

### Modul 4: Ramalan Cuaca Harga AI (Google TimesFM 2.5)
* **Tampilan di Layar:** Grafik harga dengan pita bayangan warna hijau/biru transparan di depan lilin candlestick terakhir.
* **Bagi Orang Awam:** Ini bukan ramalan dukun atau tebak-tebak buah manggis. AI menganalisis ribuan pergerakan masa lalu dan memberikan rentang probabilitas:
  * *"Peluang 80% harga saham BMRI akan bergerak di antara Rp 7.100 sampai Rp 7.550 dalam 5 hari bursa ke depan."*
  * Jika harga bergerak keluar dari pita ramalan, sistem akan otomatis membunyikan alarm peringatan anomali.

### Modul 5: Kartu Rencana Trading Standar Astra (Kalkulator Anti-Boncos)
* **Tampilan di Layar:** Kartu tiket trading satu halaman yang rapi dan terstruktur.
* **Isi Kartu:**
  * **Fakta:** Harga penutupan kemarin, volume transaksi, net foreign buy.
  * **Rencana Aksi:** Entry Zone (Beli di area berapa), Hard Stop Loss (Jual rugi mutlak di berapa), Take Profit 1 & 2 (Ambil untung bertahap).
  * **Kalkulator Lot Interaktif:** Anda mengetik modal (misal: Rp 20.000.000) dan risiko yang Anda ikhlaskan (misal: 1% = Rp 200.000). Sistem seketika memunculkan: *"Beli TEPAT 18 LOT, jangan lebih!"*
  * **3 Syarat Pembatalan:** Daftar kondisi yang membuat analisa ini batal (misal: *"Batal jika IHSG turun di bawah 7.400"*).
  * **Status Wajib:** `AWAITING_HUMAN_REVIEW` (Pengguna harus meninjau ulang sebelum memesan di sekuritas).

### Modul 6: Laboratorium Uji Coba & Portofolio Kertas Virtual (Paper Trading)
* **Tampilan di Layar:** Dompet simulasi portofolio dengan grafik pertumbuhan nilai uang dan diagram lingkaran alokasi aset.
* **Bagi Orang Awam:** Anda bisa "berlatih trading sungguhan tanpa menggunakan uang asli".
* **Kemampuan:** Sistem melacak setiap sinyal secara otomatis. Anda bisa melihat rekam jejak: Berapa kali sinyal berhasil kena Take Profit vs berapa kali terkena Stop Loss dalam 30 hari terakhir. Semua data tersimpan aman di browser Anda dan bisa diekspor ke file Excel/CSV.

### Modul 7: "Liga Strategi Otomatis" (Exp3 Multi-Armed Bandit Meta-Learner)
* **Bagi Orang Awam:** Bayangkan Anda memiliki 4 analis trading di dalam kantor Anda:
  1. Analis Khusus Breakout (Membeli saat harga tembus rekor tertinggi).
  2. Analis Khusus Rebound (Membeli saham bagus yang sudah turun terlalu dalam).
  3. Analis Bandarmologi (Mengikuti ke mana uang asing masuk).
  4. Analis Dividen (Membeli saham berdividen tinggi yang aman).
* **Cara Kerjanya:** Sistem komputer bertindak sebagai manajer tim. Strategi yang sedang sering menang di kondisi pasar saat ini akan diberikan bobot lebih besar. Jika pasar sedang sepi dan strategi breakout sering gagal, sistem secara otomatis menurunkan porsi strategi breakout ke bangku cadangan.

### Modul 8: Matriks Korelasi Lintas Aset & Simulasi Reaksi Berita (Backtest)
* **Matriks Korelasi:** Tabel matriks warna-warni yang menunjukkan hubungan antar aset. Misalnya: Apakah kalau Emas naik, IHSG ikut naik? (Warna hijau = searah, merah = berlawanan).
* **Simulasi Reaksi Berita (Backtest):** Anda bisa memilih event: *"Bagaimana biasanya reaksi harga Bitcoin ketika pengumuman inflasi Amerika rilis?"* Sistem akan membuka histori 2 tahun ke belakang dan menampilkan: *"Dari 8 kali rilis terakhir, 6 kali harga naik dalam 24 jam pertama dengan rata-rata kenaikan +3.2%."*

### Modul 9: Terminal 14 Pasar Dunia, Valuta Asing & Ticker Tape
* **Tampilan di Layar:**
  * **Ticker Tape Berjalan:** Pita harga bergerak di bagian paling atas layar memuat 36 aset acuan dunia dengan logo perusahaan resmi.
  * **14 Tab Pasar:** Indonesia (BEI), Korea Selatan (Samsung), Jepang (Toyota), Singapura (Bank DBS), Hong Kong (Tencent), China, India, ASEAN, Eropa, Wall Street, Obligasi Pemerintah (US Yield 10 Tahun), Forex (12 mata uang), dan Kripto.
  * **Konverter Kurs 56 Mata Uang:** Kalkulator instan menghitung Rupiah ke Dolar, Yen, Won, Euro, hingga Bitcoin.

### Modul 10: Bot Asisten Telegram Otomatis di Smartphone
* **Bagi Orang Awam:** Anda tidak perlu terus-menerus memelototi layar komputer.
* **Fitur Telegram:**
  * **Morning Briefing Jam 07:15 WIB:** Sebelum bursa buka, Telegram mengirimkan pesan ramah berisi rangkuman kondisi dunia semalam dan Top 5 Saham Pilihan hari ini.
  * **Emergency Flash Alert:** Jika tiba-tiba harga minyak dunia melonjak atau ada eskalasi geopolitik mendadak, bot akan langsung mengirimkan pesan darurat berbunyi: *"⚠️ PERINGATAN MAKRO: Emas melonjak +2.5%, waspada aksi ambil untung pada saham perbankan dan potensi lonjakan saham tambang."*

---

## 5. Evaluasi Infrastruktur Cloudflare — Mengapa Jauh Lebih Menguntungkan?

Berdasarkan analisis teknis mendalam tim IT, menggunakan **Cloudflare Pages & Workers KV** memberikan lompatan efisiensi yang sangat masif dibandingkan stack hosting standar:

| Parameter Evaluasi | Menggunakan Vercel Biasa | Menggunakan Cloudflare (Pilihan Juara) | Manfaat Nyata Bagi Pengguna & Pemilik |
| :--- | :--- | :--- | :--- |
| **Kecepatan Akses di Indonesia** | 80 s/d 150 milidetik (Server di Singapura/US) | **15 s/d 25 milidetik (Server Lokal Jakarta)** | Halaman web terbuka seketika (*instant zero-lag*), grafik harga muncul tanpa loading berputar. |
| **Batas Kuota Bandwidth** | Dibatasi 100 GB/bulan (Lewat kuota harus bayar mahal) | **GRATIS TANPA BATAS (Unlimited Bandwidth)** | Mau dibuka oleh 100 orang atau 100.000 orang setiap hari, tidak ada risiko tagihan bengkak. |
| **Proteksi Keamanan & Anti-Hacker** | Standar biasa | **Cloudflare WAF & Turnstile Enterprise** | Dashboard trading aman dari serangan hacker, DDOS, dan bot pencuri data tanpa captcha yang menyebalkan. |
| **Penyimpanan Cache Data Harga** | Terbatas & bayar ekstra | **Cloudflare Workers KV (Global Edge Cache)** | Data harga saham dan kurs disimpan di ribuan server dunia. Sangat aman dari risiko diblokir Yahoo Finance. |
| **Biaya Server Bulanan** | Berpotensi $20 - $100 / bulan | **Rp 0 / Bulan (100% Free Tier Compliant)** | Bebas biaya langganan bulanan selamanya. |

---

## 6. Rincian Kebutuhan Resource & Anggaran Biaya Bulanan

Sistem gabungan ini dirancang secara jenius menggunakan prinsip **"Hedge-Fund Grade Intelligence on Zero-Server Budget"**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                  ANGGARAN OPERASIONAL BULANAN MBG-ARIB                     │
├────────────────────────────┬─────────────────────────────┬─────────────────┤
│ Komponen Infrastruktur     │ Penyedia Layanan            │ Biaya Bulanan   │
├────────────────────────────┼─────────────────────────────┼─────────────────┤
│ 1. Hosting Web & Frontend  │ Cloudflare Pages            │ Rp 0 (Free)     │
│ 2. Edge Cache Data Harga   │ Cloudflare Workers KV       │ Rp 0 (Free)     │
│ 3. Keamanan Anti-Bot & SSL │ Cloudflare Turnstile & CDN  │ Rp 0 (Free)     │
│ 4. Otak Analisis Quant AI  │ GitHub Actions (Python 3.11)│ Rp 0 (Free)     │
│ 5. Database Riwayat 30 Hari│ Supabase PostgreSQL         │ Rp 0 (Free)     │
│ 6. Bot Notifikasi Telegram │ Telegram Official Bot API   │ Rp 0 (Free)     │
│ 7. Sumber Data Saham/Forex │ Frankfurter ECB + Yahoo v8  │ Rp 0 (Free)     │
│ 8. Domain Web (.com / .id) │ Cloudflare / Namecheap      │ ~Rp 12.500/bln  │
│                            │ (Opsional, Rp 150rb/tahun)  │                 │
├────────────────────────────┴─────────────────────────────┼─────────────────┤
│ TOTAL BIAYA OPERASIONAL BULANAN                          │ Rp 0 / BULAN    │
└──────────────────────────────────────────────────────────┴─────────────────┘
```

---

## 7. Panduan Standar Operasional Prosedur (SOP) untuk Trader Pemula

Bagi orang awam yang baru pertama kali menggunakan terminal ini, ikuti **4 Langkah Mudah Setiap Hari**:

```
[JAM 07:15 WIB] ──> Buka Pesan Telegram di HP ──> Baca 5 Saham Pilihan & Arah Makro Hari Ini
        │
        ▼
[JAM 08:45 WIB] ──> Buka Website Terminal MBG-ARIB di Browser Laptop / HP
        │
        ▼
[JAM 08:50 WIB] ──> Masukkan Modal Anda di "Kalkulator Lot" ──> Catat Angka Entry, SL, & Lot
        │
        ▼
[JAM 09:00 WIB] ──> Pasang Order di Aplikasi Sekuritas Anda Sesuai Rencana (Disiplin Mutlak)
```

1. **Pagi Hari (07:15 WIB):** Buka aplikasi Telegram di handphone Anda. Baca pesan ringkasan pagi. Anda langsung tahu apakah pasar sedang ramah atau berbahaya hari ini.
2. **Sebelum Bursa Buka (08:45 WIB):** Buka link website MBG-ARIB. Masuk ke tab **Indonesia** atau **Crypto**.
3. **Hitung Ukuran Pembelian (08:50 WIB):** Pilih kartu saham yang memiliki status lampu hijau (misal: BBRI atau ASII). Buka kalkulator lot, ketik berapa rupiah uang Anda. Sistem memberi tahu: *"Beli maksimal 15 lot di harga Rp 4.900. Pasang Stop Loss di Rp 4.750."*
4. **Pasang Order di Sekuritas Anda:** Buka aplikasi sekuritas langganan Anda (Ajaib, Stockbit, Mandiri Sekuritas, Indo Premier, dll.). Pasang antrean beli persis sesuai angka dari kartu rencana. Jika harga menyentuh target untung, ambil keuntungan. Jika menyentuh batas rugi, keluar dengan disiplin tanpa penyesalan karena risiko sudah terukur sejak awal.

---

## 8. Roadmap Pelaksanaan Bertahap (Sprint Execution Plan)

* **Sprint 1 (Fondasi & Ekstraksi Stack):**
  * Ekstrak source code Project ARIB dari arsip tar ke folder kerja `project-arib`.
  * Hubungkan repository ke Cloudflare Pages untuk menguji build deployment global.
  * Pasang proteksi Cloudflare Turnstile pada gerbang depan dashboard.
* **Sprint 2 (Penyatuan Otak Quant MBG ke Dalam Tampilan ARIB):**
  * Sambungkan pipeline data Python MBG (Saham Konglomerat BEI, Dividen Hunter, Foreign Flow) ke dalam API route Next.js ARIB.
  * Tampilkan Kartu Rencana Trading Standar Astra lengkap dengan kalkulator lot interaktif di tab bursa Indonesia.
* **Sprint 3 (Aktivasi Algoritma Cerdas MBG B Plan):**
  * Tampilkan deteksi Smart Money (Order Block & FVG) pada chart TradingView.
  * Aktifkan pita ramalan cuaca probabilitas Google TimesFM 2.5.
  * Hubungkan Virtual Paper Trading dan algoritma liga Exp3 Multi-Armed Bandit ke tab Portofolio.
* **Sprint 4 (Uji Coba Lapangan & Finalisasi Telegram):**
  * Uji pengiriman briefing otomatis Telegram jam 07:15 WIB dan Flash Alert Makro.
  * Lakukan simulasi paper trading selama 2 minggu bursa berjalan.
  * Evaluasi latensi akses web dari jaringan Telkomsel/Indosat/Biznet via server Cloudflare Jakarta.
