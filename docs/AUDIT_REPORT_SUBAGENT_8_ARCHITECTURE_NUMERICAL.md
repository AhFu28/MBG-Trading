# Laporan Audit Sub-Agent 8: Arsitektur Target & Aturan Numerik Kanonikal

**Tanggal Audit:** 9 Oktober 2026  
**Auditor:** Sub-Agent 8 (Tim Audit MBG Trading)  
**Referensi Spesifikasi:** `MBG_TRADING_FULL_SYSTEM_BLUEPRINT .md` (Bagian 21 & Bagian 22, baris 1162–1332)  
**Target Audit:**
1. `MBG-Trading/frontend/src/services/brokerGateway.js`
2. `MBG-Trading/frontend/src/utils/format.js`
3. `MBG-Trading/frontend/src/utils/dynamicStrategy.js`
4. `MBG-Trading/frontend/src/services/marketOverview.js`
5. `MBG-Trading/frontend/src/services/chartPredictions.js`

---

## 1. Ringkasan Eksekutif & Status Temuan

Kabar buruk langsung di depan:
1. **Kebocoran Data Palsu di Formatter (`format.js`):** Fungsi `formatIdr`, `formatUsd`, `formatPct`, dan `formatIdNumber` mengubah nilai `null` menjadi `0`, `"Rp 0"`, dan `"$0.00"`. Ini melanggar aturan inti Blueprint *Zero-Slop Integrity* yang melarang keras kuotasi kosong direkayasa menjadi nol.
2. **Kebutaan Geometri Arah pada Perhitungan R:R (`dynamicStrategy.js`):** Menggunakan `Math.abs()` tanpa validasi geometri order. Order terbalik (misal LONG dengan SL di atas Entry) tetap menghasilkan rasio R:R valid (misal 1:2.0).
3. **Penyimpangan Eksekusi & Topologi Kritis (`brokerGateway.js`):**
   - Transaksi paper trading dan saldo disimpan 100% di `localStorage` peramban, menyimpang dari arsitektur ledger berbasis Supabase Postgres.
   - Kredensial Binance Live (`apiKey` & `secretKey`) disimpan di memori peramban klien dan menandatangani pesanan langsung via Web Crypto di frontend. Ini risiko keamanan fatal (*credential leak*).
   - Biaya pasar ekuitas US diabaikan total; seluruh transaksi non-IDX dikenakan biaya Crypto Spot Taker.
   - Sizing kuantitas fallback rusak (`notional / numPrice` selalu menghasilkan 0).
4. **Peluang Eksploitasi Legend Tier (`chartPredictions.js`):** Gamifikasi dan akumulasi poin penentu status Legend Tier disimpan di `localStorage`, rentan dimanipulasi di sisi klien. Selain itu, pesan evaluasi IDX meng-hardcode simbol dolar (`$10500`).
5. **Ketiadaan Modul Kanonikal Tunggal (`packages/risk-core`):** Blueprint Bagian 22.5 mewajibkan paket mandiri untuk perhitungan ukuran risiko dan biaya, tetapi modul ini belum dibuat. Akibatnya rumus kalkulasi dipecah-pecah secara tidak konsisten.

---

## 2. Temuan Audit Detail per Modul

### 2.1 `MBG-Trading/frontend/src/utils/format.js`
*Kategori: Pelanggaran Integritas Numerik / Zero-Slop (Tingkat Kritis: TINGGI)*

- **Kode Nyata:**
  ```javascript
  export function formatIdr(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return 'Rp —';
    return 'Rp ' + idrFormatter.format(Math.round(num));
  }
  ```
- **Masalah Matematis & JS:**
  Di JavaScript: `Number(null) === 0` dan `Number('') === 0`.
  Karena `0` adalah angka terhingga (`Number.isFinite(0) === true`), kuotasi `null` yang masuk menghasilkan:
  - `formatIdr(null)` -> `"Rp 0"`
  - `formatUsd(null)` -> `"$0.00"`
  - `formatPct(null)` -> `"0.00%"`
  - `formatIdNumber(null)` -> `"0"`
- **Pelanggaran Blueprint:**
  - Baris 200 (NFR-02): *Data integrity — no silent zero/default quote*.
  - Baris 449 & 1075: *QuoteDisplay: Never turn null into zero*.
- **Tindakan Korektif:**
  Tambahkan pengecekan eksplisit terhadap `null`, `undefined`, boolean, dan string kosong:
  ```javascript
  function toFiniteNumber(n) {
    if (n === null || n === undefined || typeof n === 'boolean') return null;
    if (typeof n === 'string' && n.trim() === '') return null;
    const num = Number(n);
    return Number.isFinite(num) ? num : null;
  }
  ```

---

### 2.2 `MBG-Trading/frontend/src/utils/dynamicStrategy.js`
*Kategori: Pelanggaran Geometri Order & State Boundaries (Tingkat Kritis: SEDANG-TINGGI)*

- **Kode Nyata:**
  ```javascript
  const initialRisk = Math.abs(entry - sl);
  const initialReward = Math.abs(tp1 - entry);
  const initialRR = initialRisk > 0 ? Number((initialReward / initialRisk).toFixed(2)) : null;
  ```
- **Masalah Matematis:**
  1. **Geometri Terbalik Diabaikan:** Jika posisi `LONG` memiliki `sl = 110` dan `entry = 100`, rumus `Math.abs(100 - 110)` menghasilkan jarak risiko 10, dan menghasilkan rasio R:R valid padahal stop loss berada di atas harga beli.
  2. **Inversi Jarak Target Dinamis:**
     ```javascript
     const targetForReward = (hasHitTp1 && tp2 > 0) ? tp2 : tp1;
     const currentRewardDist = Math.abs(targetForReward - price);
     ```
     Jika harga telah melewati Target 2 (misal harga 120, TP2 116), rumus `Math.abs(116 - 120)` menghasilkan nilai 4. Akibatnya sistem menghitung rasio R:R baru seolah-olah masih ada sisa jarak target.
  3. **Bypass Format Standar:** Baris 166, 181, dan 196 menggunakan `entry.toLocaleString()`, mengabaikan `formatIdr` / `formatIdNumber`.
  4. **Unscoped Memory Map:** Baris 14 menggunakan `const sessionTrailingState = new Map();` di tingkat modul, melanggar Blueprint Bagian 21.3 yang mewajibkan isolasi state berbasis `(instrumentId, venueId, planVersionId)`.
- **Tindakan Korektif:**
  - Validasi ketat geometri arah sebelum perhitungan:
    - Long: wajib `sl < entry && tp1 > entry`.
    - Short: wajib `sl > entry && tp1 < entry`.
  - Jika geometri tidak valid, kembalikan status `INVALID_GEOMETRY` dan `dynamicRR: null`.
  - Jika harga telah melewati target (`price >= targetForReward` pada Long), tetapkan `currentRewardDist = 0` dan `dynamicRR = 0`.

---

### 2.3 `MBG-Trading/frontend/src/services/brokerGateway.js`
*Kategori: Arsitektur Eksekusi, Biaya Broker, & Keamanan (Tingkat Kritis: TINGGI)*

- **Masalah Detail:**
  1. **Penyimpangan Topologi Runtime:**
     Eksekusi, pencatatan transaksi, dan saldo tersimpan di `localStorage` peramban (`mbg_paper_portfolio_v5`). Blueprint Bagian 21.1 dan 22.6 menegaskan eksekusi paper trading harus diverifikasi di backend dengan transaksi debit/kredit di Supabase Postgres.
  2. **Kebocoran Kredensial Langsung (`BinanceLiveAdapter`):**
     Memproses order Binance riil langsung dari peramban klien menggunakan Web Crypto HMAC-SHA256 (baris 416-432). Kredensial rahasia terekspos di memori klien dan rawan dibajak XSS. Seharusnya order Binance dialihkan melalui Pages Functions BFF berotentikasi.
  3. **Bug Kuantitas Kripto:**
     Baris 161:
     `effectiveUnits = Number(quantity) > 0 ? Number(quantity) : (notional / numPrice);`
     Karena `notional` bernilai 0 di baris 153, `(notional / numPrice)` selalu menghasilkan 0, menyebabkan order tanpa kuantitas eksplisit langsung gagal.
  4. **Kebutaan Biaya Non-IDX:**
     Baris 169-172 & 248-251: Sistem hanya memeriksa `if (isIdr)`. Aset US Equities (`market === 'US'`) salah dibebankan fee Crypto Spot Taker (0.10%) alih-alih `BROKER_FEES.US_EQUITY` ($0.005/lembar, minimal $1.00).
  5. **Pemotongan Nilai Sen Kripto:**
     Baris 312: `pos.floatingPnL = Math.round(priceDelta * pos.quantity);` membulatkan floating PnL kripto (USDT) ke integer, memangkas nilai sen/desimal.
  6. **Ketidaksinkronan dengan `LotCalculatorModal.jsx`:**
     Kalkulator lot menghitung batas lot tanpa menyisihkan biaya beli IDX (0.15%). Saat nilai lot tersebut dieksekusi di `brokerGateway.js`, pesanan ditolak karena saldo kurang.
- **Tindakan Korektif:**
  - Perbaiki rumus kuantitas dan alokasi biaya broker sesuai tabel aset.
  - Pisahkan pembulatan PnL IDR (bulat) dan USDT/USD (2 desimal).
  - Pindahkan eksekusi API Binance ke Cloudflare Functions endpoint terproteksi.

---

### 2.4 `MBG-Trading/frontend/src/services/marketOverview.js`
*Kategori: Kontrak Instrumen Kanonikal & Integritas Data (Tingkat Kritis: RENDAH-SEDANG)*

- **Aspek Positif:**
  Fungsi `toNumberOrNull` (baris 77-84) adalah implementasi model *zero-slop* yang sangat baik. Kebijakan menolak data palsu (ETF net flow, liquidations) dipatuhi dengan jujur.
- **Masalah Detail:**
  1. **Penghapusan Prefix Bursa (Stripping Venue):**
     Baris 577:
     `const ticker = fullSymbol.includes(':') ? fullSymbol.split(':').pop() : fullSymbol;`
     Menghilangkan nama venue (`NASDAQ:NVDA` -> `NVDA`, `FX_IDC:EURUSD` -> `EURUSD`), sehingga merusak format kontrak kanonikal `market:symbol` (Blueprint Bagian 22.1).
  2. **Jadwal Istirahat IDX Statis Tanpa Kalender Libur:**
     Baris 615 menetapkan jam istirahat BEI `[720, 810]` (12:00 - 13:30) sama rata untuk semua hari kerja. Padahal jadwal resmi BEI hari Jumat adalah pukul 11:30 - 14:00 ([690, 840]). Selain itu, belum ada pengecekan kalender hari libur bursa (`sessionCalendarId`).
- **Tindakan Korektif:**
  - Pertahankan `fullSymbol` sebagai identitas unik kanonikal.
  - Perbarui jadwal sesi BEI untuk membedakan hari Jumat.

---

### 2.5 `MBG-Trading/frontend/src/services/chartPredictions.js`
*Kategori: Gamifikasi & Aturan Mata Uang (Tingkat Kritis: SEDANG)*

- **Masalah Detail:**
  1. **Eksploitasi Legend Tier di Sisi Klien:**
     Poin gamifikasi dan verifikasi tebakan disimpan di `localStorage` (`mbg_chart_predictions_v1`), membuka celah pengguna mengubah data di browser untuk mendapatkan status *Legend Tier* tanpa verifikasi server.
  2. **Hardcode Simbol Mata Uang Dolar (`$`):**
     Baris 214, 226, 238, dan 250 mencetak pesan dengan simbol `$`:
     `Target $${p.targetPrice} tercapai pada harga $${curPrice}!`
     Untuk emiten saham BEI (seperti BBCA), pesan menjadi `Target $10500`, melanggar aturan format mata uang IDR (`Rp`).
  3. **Toleransi Heuristik Longgar pada R:R:**
     Baris 85: `if (risk > 0 && reward / risk >= 1.95) points += 25;`
     Menggunakan angka toleransi `1.95` alih-alih perbandingan matematis eksak terhadap target R:R 2.0.
  4. **Bias Hasil Favorable pada Candle Ambigu:**
     Baris 207-229 mengevaluasi `curPrice >= targetPrice` sebelum memeriksa `stopLoss`. Jika candle menyentuh target dan stop loss bersamaan, sistem secara bias memenangkan target, melanggar Blueprint Bagian 22.6.
- **Tindakan Korektif:**
  - Gunakan helper pemformat mata uang berbasis instrumen/pasar (`formatIdr` untuk IDX, `formatUsd` untuk Crypto/US).
  - Ubah ambang batas penilaian menjadi eksak `reward / risk >= 2.0`.
  - Terapkan aturan konservatif pada evaluasi live: jika harga menyentuh kedua level, tandai ambigu atau prioritaskan evaluasi risiko (Stop Loss).

---

## 3. Matriks Kepatuhan terhadap Blueprint (Bagian 21 & 22)

| Parameter Aturan Blueprint | Status Kepatuhan | Keterangan Temuan |
| :--- | :---: | :--- |
| **Topologi Cloudflare Pages/Functions & DB** | ⚠️ PARSIAL | Frontend aktif di Pages, tapi eksekusi paper & order Binance berjalan di client `localStorage`/browser. |
| **Format Canonical Instrument ID** (`IDX:BBCA`, `BINANCE:BTCUSDT`) | ❌ NON-COMPLIANT | Diredusir menjadi bare string ticker di banyak fungsi; resolusi kuotasi memakai string fallback ad-hoc. |
| **Floating-Point Discipline & Rounding** | ⚠️ PARSIAL | Sizing BEI bulat 100 lembar, namun PnL kripto dipotong `Math.round()` dan toleransi R:R memakai `1.95`. |
| **Aturan Format Mata Uang** (IDR bulat, USD 2 desimal) | ❌ CRITICAL BUG | `format.js` mengubah `null` menjadi `Rp 0` & `$0.00`. `chartPredictions.js` meng-hardcode `$` untuk saham IDX. |
| **Lot Sizing BEI (100 lembar per lot)** | ⚠️ PARSIAL | `brokerGateway.js` memaksa kelipatan 100, tapi `LotCalculatorModal` tidak menyisihkan fee beli saat hitung max lots. |
| **Fee Modeling (IDX 0.15%/0.25%, Crypto, US)** | ⚠️ PARSIAL | IDX & Crypto dimodelkan, tapi US Equities diabaikan dan fee exit dihitung dari harga entry di modal kalkulator. |
| **Kanonikal Perhitungan R:R & Proteksi Nol** | ⚠️ PARSIAL | Proteksi `initialRisk > 0` sudah ada, tapi orientasi arah (arah geometris) diabaikan oleh `Math.abs()`. |
| **Pencegahan Data Rekayasa (Zero-Slop)** | ❌ CRITICAL BUG | `format.js` memalsukan `null` menjadi angka nol; `chartPredictions` menyimpan rank di `localStorage`. |

---

## 4. Rencana Tindakan Korektif (Corrective Action Plan)

### Prioritas 1 (P0 - Segera / Critical):
1. **Perbaiki `format.js`**: Cegah konversi `null` / `undefined` / `''` menjadi `0`. Kembalikan `'Rp —'`, `'$—'`, dan `'—'`.
2. **Perbaiki Geometri Arah di `dynamicStrategy.js`**: Tolak rasio R:R jika posisi berlawanan arah geometri (LONG dengan SL di atas Entry atau TP di bawah Entry).
3. **Perbaiki Format Mata Uang di `chartPredictions.js`**: Ganti hardcode `$` dengan format dinamis sesuai pasar (`Rp` untuk IDX).

### Prioritas 2 (P1 - Target Rilis Berikutnya):
1. **Standardisasi Identitas Instrumen Kanonikal**: Pertahankan pasangan `venue:symbol` (misal `IDX:BBCA`, `BINANCE:BTCUSDT`) tanpa memotong prefix venue.
2. **Sinkronisasi Fee pada Kalkulator Lot**: Hitung daya beli modal dengan menyertakan fee beli (0.15%), dan hitung fee jual berdasarkan harga stop/target aktual.
3. **Penyelarasan Jam Istirahat Bursa BEI**: Pisahkan jadwal istirahat Jumat (11:30 - 14:00 WIB) di `marketOverview.js`.

### Prioritas 3 (P2 - Arsitektur Jangka Menengah):
1. **Membangun `packages/risk-core`**: Satukan seluruh kalkulator sizing, pembulatan lot, tick-rule, dan fee ke satu modul deterministik bersama.
2. **Migrasi Paper Broker & Gamifikasi ke Server**: Pindahkan pencatatan transaksi dari `localStorage` ke Supabase Postgres via Cloudflare Pages Functions terotentikasi.
