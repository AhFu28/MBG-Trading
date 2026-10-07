# UI-REVIEW: MBG QUANT Terminal & Web3 Desk (Comprehensive 6-Pillar Audit)

**Date:** 2026-10-07  
**Auditor:** GSD UI Reviewer / Codex Agent (powered by Gacor Vision & Codebase Introspection)  
**Scope:** Home Command Center, Markets (Futures, Spot, IDX, US, Forex, Degen), Research Desks, Signals, Subscription & Admin Governance Desk.  
**Target Resolution:** 1920x1080 Desktop Viewport (evaluated on 1917x986px live viewport).

---

## 🏆 Overall Assessment & Score Card

| Pillar | Focus Area | Score (1-4) | Status |
|---|---|:---:|---|
| **1. Copywriting & Content** | Microcopy, honest data disclosures, clarity of terminology, tone | **3.8 / 4.0** | 🟢 Institutional Ready |
| **2. Visual Hierarchy & Composition** | Bento-grid balance, HUD density, eye flow, visual anchors | **3.5 / 4.0** | 🟢 Very Strong |
| **3. Color System & Contrast** | Dark theme palette, status semantics, WCAG legibility | **3.6 / 4.0** | 🟢 High Fidelity |
| **4. Typography & Data Readability** | Monospace numbers, ticker sizing, hierarchical contrast | **3.7 / 4.0** | 🟢 Sharp & Consistent |
| **5. Spatial System & Density** | 100vh zero-scroll discipline, padding rhythm, grid gaps | **3.4 / 4.0** | 🟡 Polishing Needed |
| **6. Experience Design (UX & Flow)** | Progressive disclosure, click targets, feedback & friction | **3.2 / 4.0** | 🟡 Friction Identified |

### 🎯 Final Audit Score: **21.2 / 24.0** (Grade: **A- / Institutional Grade**)

---

## 🔍 Detailed Pillar Breakdown

### 1. Copywriting & Microcopy (Score: 3.8 / 4)
* **What Shines:**
  * **Zero-Fake-Data Adherence:** Sangat jujur dan berkelas. Label `SIMULATOR`, `Net Foreign (no data)`, dan `Arena engine stats — awaiting sync (em-dash)` mencerminkan integritas kuantitatif sejati tanpa pura-pura live.
  * **Desk Terminologies:** Penggunaan istilah finansial profesional yang sangat presisi (`DEFCON 4 - Stabil`, `+22 bps STEEPENING`, `Net Friction Deducted (-0.45%)`, `Range Accumulation`).
  * **Bilingual Flow:** Integrasi istilah global (English) dan instruksi lokal (Indonesia) berpadu harmonis tanpa canggung.
* **Findings & Improvements:**
  * *Discrepancy Label:* Di card `PORTFOLIO RISK`, tertera `USD/IDR: 15.680`, sedangkan di Market Benchmarks ribbon atas tertera `USD/IDR Rp 17.878 (-0.15%)`. Pastikan satu sumber data rate agar tidak ambigu.

---

### 2. Visual Hierarchy & Composition (Score: 3.5 / 4)
* **What Shines:**
  * **Bento Grid Layout:** Struktur 3-tier (Hero KPI -> Macro Risk Triple Barometer -> Tactical Execution Matrix 3-Kolom -> Right-Rail Wire) tersusun sangat simetris.
  * **Sidebar Compact Radar:** Inklusi mini-watchlist IDX vs Crypto di dalam Sidebar adalah sentuhan jenius yang menghemat ruang layar.
  * **Header Floating Glass:** Nuansa Dribbble clean glass HUD dengan jam bursa multi-negara (`JKT`, `TYO`, `LON`, `NYC`) memberikan rasa kendali global instan.
* **Findings & Improvements:**
  * *Benchmark Ribbon Overflow:* Ticker `XAU/USD $4,184` di kanan atas terpotong tipis di batas layar. Butuh `overflow-x: auto` tersembunyi (*marquee* halus) atau pengurangan gap ribbon.
  * *Visual Weight Competition:* Tombol aksi `⚡ Eksekusi Trade` (ungu-biru gradien) dan card `Portfolio Net Valuation` sedikit bersaing dengan sinyal hijau di bawahnya.

---

### 3. Color System & Palette (Score: 3.6 / 4)
* **What Shines:**
  * **Cyber Terminal Palette:** Dominasi slate-black `#0b0f19` dengan border tipis `rgba(255,255,255,0.08)` sangat nyaman di mata untuk sesi trading berjam-jam (anti-fatigue).
  * **Semantic Indicators:**
    * Hijau `#10b981` / `#34d399` untuk Profit, Bullish, Steepening.
    * Merah `#ef4444` / `#f87171` untuk Stop Loss, Drawdown, Negatif.
    * Emas `#fbbf24` untuk Komoditas, VIP, dan Risk Buffer.
    * Cyan/Blue `#38bdf8` / `#818cf8` untuk Saham IDX & US Equities.
* **Findings & Improvements:**
  * *Badge Contrast:* Badge abu-abu `CONSIDERATION` dan `RANGE_ACC` di tabel sinyal bawah memiliki tingkat kontras teks agak rendah pada latar gelap. Naikkan brightness teksnya ke `#e2e8f0`.

---

### 4. Typography & Monospace Formatting (Score: 3.7 / 4)
* **What Shines:**
  * **Tabular Numbers:** Angka harga, level SL, TP1, dan Entry di tabel bawah menggunakan font monospace dengan pemisah ribuan titik/koma yang konsisten.
  * **Headline Valuation:** `$10,000.00` tampil tegas dengan bobot font 900, menjadikannya focal point utama saat pertama kali mendarat di dashboard.
* **Findings & Improvements:**
  * Di tabel sinyal Saham IDX, sub-label kecil seperti `Rp 95 (-7.5%)` di bawah nama ticker agak terlalu rapat (*line-height: 1.1*). Berikan jarak vertikal `2px` agar tidak menempel ke kode ticker.

---

### 5. Spatial System & Density (Score: 3.4 / 4)
* **What Shines:**
  * **Zero-Scroll Desktop Discipline:** Di resolusi 1080p, seluruh ringkasan portofolio, 3 matriks makro, radar eksekusi, dan live news wire tertampung dalam 1 viewport tanpa harus scroll ke bawah.
* **Findings & Improvements:**
  * *News Wire Right-Rail:* Kolom `LIVE INTELLIGENCE WIRE` di kanan menyita $\approx 24\%$ lebar layar. Pada layar laptop 13-14 inch (1366x768 atau 1440x900), kolom ini berpotensi mendesak tabel matriks sinyal. Disarankan memberi toggle tombol `[Collapse News Panel ⇥]` agar tabel sinyal bisa melebar penuh saat dibutuhkan.

---

### 6. Experience Design & Friction (Score: 3.2 / 4)
* **What Shines:**
  * Navigasi sidebar instan tanpa reload halaman (*client-side reactive routing*).
  * Filter kategori berita di feed kanan (`SEMUA`, `☢️ NUKLIR & PERANG`, `BRIEF`, `RISET`, `SAHAM IDX`) sangat responsif dan fungsional.
* **Findings & Improvements:**
  * *Affordance Tombol:* Baris sinyal di matriks bawah belum memiliki hover state atau tombol aksi cepat `[Detail]` / `[Trade]`. Klik pada baris sebaiknya membuka Order Modal atau TradingView chart popup.

---

## 🚀 3 Rekomendasi Poles Paling Berdampak (Quick Wins)

1. **Tambahkan Tombol Collapse untuk Right Rail (`LIVE INTELLIGENCE WIRE`):**  
   Memberikan tombol minimize di pojok kanan atas news wire akan membebaskan 25% area layar ketika trader ingin fokus penuh menganalisis chart atau tabel sinyal.
2. **Sinkronisasi Kurs USD/IDR di Seluruh Widget:**  
   Pastikan angka rate USD/IDR di card `Risk Desk` membaca variabel state yang sama dengan `Market Benchmarks` di atas.
3. **Interactive Row pada Execution Matrix:**  
   Jadikan baris sinyal (AUTO, SINI, BTC, AAPL) bisa diklik langsung untuk memicu modal order atau membuka TradingView chart di tab sebelah.
