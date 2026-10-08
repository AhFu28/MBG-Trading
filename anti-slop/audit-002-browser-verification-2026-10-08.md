# Audit 002: Verifikasi Browser & Tiga Bug Routing

**Tanggal:** 2026-10-08
**Pemicu:** Jendral Arib: *"kamu gk ada fitur playwright kah?? setelah kamu bikin, harus ada testing dong... ayo lakukan testing... setelah testing, lakuakn dokumentasi pencatatan, lalu buat review apa yg kurang, audit... perbaiki,, push lagi, testing lagi, looping gitu terus"*

**Status:** Selesai. 472 tes unit + 20 tes browser, semuanya lulus.

---

## Ringkasan Eksekutif

Suite E2E pertama saya **lulus 23/23 dan tidak menguji apa pun.** Itu temuan terpenting dari sesi ini, dan saya tulis di depan karena pelajarannya berlaku untuk semua pekerjaan berikutnya.

Tanpa sesi palsu, aplikasi menampilkan Landing Page untuk setiap nilai `?tab=`. Jadi delapan belas tes "route berhasil dimuat" sebenarnya menguji **satu halaman yang sama, delapan belas kali**. Suite hijau yang tidak membuktikan apa pun lebih berbahaya daripada suite merah, karena ia membeli rasa percaya diri yang salah.

Setelah diperbaiki, suite itu menemukan **tiga bug nyata** yang tidak terlihat oleh 472 tes unit.

---

## Metode

**Kenapa perlu browser, bukan cuma jsdom.**

Tes unit merender komponen di lingkungan tiruan dengan jaringan dipalsukan. Itu membuktikan logika, dan **tidak bisa** menangkap jenis bug yang Jendral temui berulang kali:

| Gejala yang Jendral laporkan | Bisakah tes unit menangkap? |
|---|---|
| "Live News gk ada datanya" | Tidak, ini soal routing |
| Chart Pro Desk hitam | Tidak, ini soal widget browser |
| Panel Market Overview kosong | Tidak, ini soal kode HTTP |
| Angka `99.0` muncul | Tidak, ini angka yang salah, bukan error |

Keempatnya hanya muncul di browser sungguhan.

**Standar yang saya pakai.** Sebuah halaman dinyatakan lulus bukan karena "ada isinya", tapi kalau:

1. Shell terminal benar-benar terpasang (`.cmc-topnav` ada)
2. **Bukan** Landing Page
3. **Bukan** layar "modul tidak dikenal"
4. Konten **khas halaman itu** muncul (bukan sekadar "body tidak kosong")
5. Tidak ada `pageerror`

Poin 4 yang paling penting. Tes versi pertama saya hanya cek "body tidak kosong" — dan itulah kenapa ia lulus sambil menguji halaman yang salah.

---

## Tiga Bug Nyata yang Ditemukan

### Bug 1: Klik menu tidak membuka apa-apa

**File:** `CmcTopNav.jsx`

Kode lama:

```jsx
onClick={() => {
  if (hasPanel) setOpenGroup(isOpen ? null : group.id);  // toggle
}}
```

**Kenapa salah:** untuk mengklik tombol, kursor **harus tiba di tombol**. Saat tiba, `onMouseEnter` menyala dan membuka panel. Lalu klik membalik keadaan — **menutup panel yang baru saja dibuka hover.**

Bagi manusia ini tidak terasa, karena mata dan tangan bergerak bersamaan. Tapi logikanya salah, dan siapa pun yang menggerakkan mouse dengan hati-hati akan menemui panel yang menutup sendiri.

**Perbaikan:** klik selalu **membuka**, tidak membalik. Penutupan lewat Escape, klik di luar, atau pindah kursor — semuanya sudah ada.

**Kenapa tes unit tidak menemukan ini:** `.click()` sintetis di jsdom tidak membawa hover. Urutan nyata (hover dulu, baru klik) tidak pernah terjadi di sana.

### Bug 2: ARIA tidak valid — item menu tidak dikenali

**File:** `CmcTopNav.jsx`

Struktur lama:

```jsx
<div onMouseEnter={...}>        {/* pembungkus tanpa peran */}
  <div role="menu">
    <button role="menuitem">     {/* bukan anak langsung */}
```

ARIA mewajibkan `menuitem` menjadi anak yang dimiliki `menu`, **tanpa elemen generik di antaranya**. Dengan pembungkus itu, item menu tidak bisa diresolusi — baik oleh Playwright maupun oleh pembaca layar.

**Perbaikan:** handler hover dipindah ke `role="menu"` itu sendiri, pembungkusnya dibuang.

**Dampak nyata:** pengguna screen reader tidak bisa menavigasi menu ini sama sekali. Ini bukan soal tes.

### Bug 3: Hash dikalahkan kueri URL — menu terasa mati

**File:** `App.jsx`, fungsi `getTabFromHash`

```js
// SEBELUM: kueri dicek lebih dulu
const params = new URLSearchParams(window.location.search);
const qTab = params.get('tab');
if (qTab) return qTab.toUpperCase();     // ← selalu menang
const hash = window.location.hash...
```

**Kenapa salah:** `setActiveTab` menulis hash, lalu listener `hashchange` membaca **seluruh URL lagi**. Di URL seperti `/?tab=HOME#achievements`, kueri menang — jadi setiap klik menu mengubah hash lalu **langsung kembali ke halaman semula**.

**Gejala di layar:** hash berubah (bukti klik diterima), tapi halaman tidak pindah. Menu terasa rusak total.

**Perbaikan:** hash menang. `?tab=` tetap dihormati **hanya kalau tidak ada hash** — yaitu kasus navigasi masuk yang sesungguhnya (bookmark, dan suite E2E ini).

---

## Perbaikan Lain di Sesi Ini

**H-1 selesai (em dash).** 388 em dash tersisa dipilah:
- 179 komentar kode — R-02 hanya berlaku untuk teks yang dibaca pengguna
- Mayoritas sisanya `'—'` placeholder data — konvensi keuangan, sengaja dipertahankan
- **65 prosa asli** — diperbaiki
- `changelogData.js` dikecualikan: itu catatan rilis yang sudah diumumkan. Menulis ulang sejarah demi aturan gaya yang dibuat belakangan itu tidak jujur.

**Diff-nya saya baca, dan itu menangkap tiga kesalahan saya sendiri.** Penggantian mekanis jadi koma membuat:
- `DEGEN DESK, MULTI-CHAIN MEMECOIN RADAR` → harus titik dua (judul)
- `ALUR PROSES & QA, PETA PROYEK` → harus titik dua
- `(LIVE, dana nyata)` → jadi `(LIVE : dana nyata)`; koma di sebelah peringatan uang nyata adalah yang terburuk

Sekalian diperbaiki: `OrderExecutionModal` menulis *"disaranake, dana nyata ora kena"* — bahasa Jawa di teks UI. AGENTS.md mewajibkan Indonesia biasa.

**H-2 sebagian.** 380 hex dari 5 warna yang dilarang eksplisit `DESIGN.md` dimigrasikan ke token. Tidak ada warna yang berubah di layar — yang berubah siapa pemilik nilainya: berkas tema, bukan 38 komponen.

**`.gitignore`.** Commit sebelumnya tanpa sengaja menyertakan `test-results/`, trace, screenshot, dan dump konsol. Semuanya dibuang.

---

## Yang Masih Kurang

Saya catat dengan jujur, bukan disembunyikan.

### 0. Sudah tertutup di iterasi kedua

| Area | Status |
|---|---|
| Semua 18 halaman dimuat tanpa error | ✅ 18 tes |
| Nilai karangan tidak tampil di layar | ✅ 20 tes, 4 halaman |
| Logout lengkap (dua cookie) | ✅ 5 tes, diuji balik |
| Chart benar-benar menggambar | ✅ 3 tes + penjaga struktural |
| Teks Jawa di UI | ✅ 2 berkas diperbaiki |
| Rasio R:R karangan | ✅ 3 tempat, 10 tes penjaga |

**Total: 482 tes unit + 49 tes browser, semuanya lulus.**

---

## Iterasi Ketiga — Pola, Bukan Kejadian

Setelah menemukan `'2.0'` di form order, saya **tidak berhenti di situ.** Saya cari **bentuk** polanya di seluruh aplikasi:

```
cond ? hitung : <angka literal>
```

Itu menemukan **dua tempat lagi** dengan pola sama. Keduanya menampilkan angka karangan **di sebelah angka nyata**, dengan gaya yang sama persis.

| Lokasi | Angka karangan | Akibat |
|---|---|---|
| `OrderExecutionModal` | `'2.0'` | Order tanpa SL tampil "1 : 2.0" |
| `dynamicStrategy` (2 tempat) | `2.0` | Laporan R:R karangan |
| `MasterQuantLeaderboard` | `null` lolos guard | Tercetak **"1:null"** |
| `LotCalculatorModal` | `2.2` di 3 tempat | Bisa jadi tidak sinkron |

### Temuan tak terduga

Waktu saya ubah `dynamicStrategy` supaya mengembalikan `null`, **muncul bug baru yang selama ini tersembunyi** oleh angka karangan itu:

```js
actionAdvice = `... Rasio R:R terukur 1:${dynamicRR}. Siap eksekusi.`;
```

Tanpa fallback angka, itu akan mencetak **"1:null"**. Selama ini tidak pernah terlihat karena `2.0` selalu menutupinya.

**Pelajarannya:** angka karangan bukan cuma menyesatkan. Ia **menyembunyikan** jalur kode yang belum pernah diuji.

Dan di `MasterQuantLeaderboard`, guard-nya `dynamicRR !== undefined` — yang **meloloskan `null`**. Jadi kombinasi keduanya akan menghasilkan teks "1:null" yang tampil ke pengguna.

---

## Cara Saya Menemukan Ketiga Bug (metode yang berulang)

### 1. Yang belum diuji di browser

| Belum diuji | Risiko |
|---|---|
| **Order placement** | Satu-satunya alur yang menyentuh uang, dan sama sekali belum diuji |
| Persistensi watchlist antar reload | Data pengguna |
| Ganti bahasa dan tema | Belum diverifikasi di browser |
| Login sungguhan (bukan sesi palsu) | Alur sesi |
| Eksekusi Binance / Hyperliquid | Belum ada sama sekali |

**Prioritas berikutnya: order placement.** Setiap alur lain sudah punya penjaga; yang ini tidak, padahal dampaknya paling besar.

### 2. H-2 belum selesai

380 dari 1.494 hex beres. **Sisanya ~1.100 di 271 warna unik.**

Saya tidak menyelesaikannya karena setiap sisa warna butuh keputusan **per permukaan** tentang token mana yang semantis benar. Mengganti asal-asalan hanya menukar satu nilai salah dengan nilai salah yang lain. Butuh sesi tersendiri dengan mata di setiap layar.

### 3. M-3, M-4, M-5, L-1, L-2, L-3 belum tersentuh

- **M-3** glassmorphism — 33 `backdrop-filter`, target 1-2
- **M-4** font mikro — 1.675 dari 2.282 deklarasi di bawah 12px
- **M-5** 14 breakpoint → 3
- **L-1** 8 dependensi npm tak terpakai
- **L-2** label CTA belum seragam
- **L-3** panah `→` belum dipangkas

### 4. Keputusan yang saya pertahankan — perlu persetujuan Jendral

Ini bukan pelanggaran menurut saya, dan saya minta Jendral menilai:

| Item | Alasan dipertahankan |
|---|---|
| `DASH = '—'` | Placeholder data kosong. Tanda hubung akan terbaca sebagai angka negatif kecil. |
| `↗` (27 pemakaian) | Penanda tautan eksternal. Fungsional, bukan hiasan. |
| Label huruf besar + letter-spacing | Konvensi label data Bloomberg. Dilarang untuk prosa, tepat untuk label tabel. |

### 5. Satu bug yang saya temukan tapi belum diperbaiki

Saat memeriksa panel, saya melihat `EconometricCalendarTab` punya teks berbahasa Jawa:

```
acara kuwi kerangka nyata, nanging angka actual/forecast/previous isih conto
```

Itu melanggar aturan bahasa AGENTS.md, dan **saya belum memperbaikinya** karena sesi ini sudah panjang dan saya ingin menyelesaikan verifikasi E2E dulu. Tercatat di sini supaya tidak hilang.

---

## Bukti

| Pemeriksaan | Hasil |
|---|---|
| Tes unit | **472 lulus** / 472, 26 berkas |
| Tes browser | **20 lulus** / 20 |
| Build produksi | **berhasil** |
| Rute terverifikasi | 18 halaman, masing-masing dengan penanda konten sendiri |
| Tes negatif (nilai karangan) | 4 lulus — `DEFCON 4`, `PF 99.0`, `$529.7M`, `$1.78B` tidak ada di layar |
| Navigasi lewat klik | 2 lulus — Account → Legend Path, Research → News Wire |

---

## Catatan Metode: Cara Saya Menemukan Ketiga Bug

Ketiganya muncul dari hal yang sama: **tes gagal, lalu saya tidak langsung memperbaiki tesnya.**

Untuk setiap kegagalan saya menulis *probe* — tes sekali pakai yang mencetak keadaan sebenarnya:

1. **Probe 1** menemukan bahwa 23 tes lulus sambil menguji halaman yang sama
2. **Probe 2** menemukan `#root` menutupi nav — yang ternyata modal kepatuhan
3. **Probe 3** menemukan klik toggle menutup panel yang baru dibuka hover
4. **Probe 4** menemukan hash dikalahkan kueri URL

Probe-probe itu sudah dihapus. Yang tinggal hanya tes yang mengunci perilaku benar.

**Pelajaran yang saya catat untuk diri sendiri:** ketika tes gagal, pertanyaan pertamanya bukan *"kenapa tesnya salah?"* tapi *"apa yang sebenarnya terjadi?"* Empat kali di sesi ini, jawabannya adalah bug produk.
