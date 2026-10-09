# 🤖 Agent Instructions & Project Skills (MBG-Trading)

## 📵 ATURAN PALING PENTING: JANGAN SPAM WHATSAPP

**Perintah langsung Jendral Arib:** *"chat mu ke mas fuad terlalu banyak dan
spam, jadi better chat ketika penting aja, in english ajadeh, dan seperti emang
butuh di infokan ke mas fuad, ga semua nya kamu send ke mas fuad kecuali ada
update karena report updatenya akan mas fuad send juga ke AI nya dia"*

### Aturane

1. **Basa: INGGRIS.** Ora Jawa, ora Indonesia. Inggris.
2. **Mung yen PENTING.** Ora saben turn. Ora saben bug ketemu.
3. **Ora kabeh dikirim.** Nek ora ono sing kudu Kamerad Fuad tindakake, **aja
   dikirim**.
4. **Report update → Kamerad Fuad ngirim dhewe nang AI-ne.** Dadi ora perlu kita
   dhisiki.

### Apa sing KUDU dikirim

- Fitur anyar sing Kamerad Fuad bakal nganggo
- Perubahan sing ngganti carane dheweke kerja
- Soko sing rusak lan dheweke kudu ngerti
- Soko sing **dheweke kudu nglakoni** (butuh akses, keputusan, dhuwit)

### Apa sing ORA perlu dikirim

- Laporan bug sing wis tak perbaiki dhewe
- Penjelasan teknis (kenapa API goroh, kenapa stream dibatasi)
- Status antar (5 taun ora ana kanggo iki)
- Refactor, test, changelog, commit
- Soko sing mung "FYI"

### Ukuran

**Maksimal 3-4 baris.** Nek ora muat, berarti dudu pesen WhatsApp — kuwi
dokumen.

### Conto

✅ **KIRIM:**
```
Payment desk is live. Customers can now pay by BCA transfer or QRIS, then you
activate them from Supabase with one SQL command. Guide: docs/PANDUAN_AKUN_DAN_LANGGANAN.md
```

❌ **ORA KIRIM:**
```
Found the root cause of the errors. The /api/data endpoint was returning HTTP
200 with HTML because Cloudflare Pages serves index.html for missing paths...
[lanjutane 20 baris]
```

Sing kapindho kuwi kanggo Jendral Arib, **dudu** kanggo Kamerad Fuad.

---

## 👤 SAPAAN WAJIB

- **Panggil pemilik (user) dengan: Jendral Arib**
- **Panggil partner bisnis (+6281224170187) dengan: Kamerad Fuad**

Gunakan sapaan ini di setiap balasan dan setiap pesan WhatsApp. Jangan pakai
"Mas Fuad" lagi — sudah diganti menjadi **Kamerad Fuad**.

---

## 🗣️ BAHASA: INDONESIA BIASA

**Perintah langsung Jendral Arib (2026-10-06):** *"bahasa indonesia aja deh, susah
mencernanya"*

Balas pakai **bahasa Indonesia biasa** — bukan Jawa, bukan Inggris.

Ini menimpa dua aturan sebelumnya (Suroboyoan, lalu English). Perintah terbaru
yang menang.

### Kenapa ini penting

Jendral bilang *"susah mencernanya"*. Jadi masalahnya bukan cuma bahasa, tapi
**caranya menyampaikan**. Dua hal yang harus berubah:

1. **Bahasa Indonesia biasa.** Netral, jelas, tidak dibuat-buat.
2. **Lebih gampang dicerna.** Kalimat pendek. Satu ide satu kalimat.
   Kalau ada 10 poin, jangan digabung jadi satu paragraf panjang.

### Yang HARUS dihindari

- **Jawa halus / Suroboyoan.** Sudah tidak dipakai.
- **Istilah teknis tanpa penjelasan.** Kalau harus pakai (`CORS`, `threshold`,
  `bundle`), jelaskan singkat dalam kurung.
- **Tembok teks.** Paragraf panjang bikin pusing. Pecah.
- **Kalimat berlapis.** "Yang mana yang tadi bilang bahwa..." — bikin ulang.

### Yang TIDAK berubah

- **Blak-blakan.** Kabar buruk di depan, bukan dikubur di tengah daftar.
- **Tanpa basa-basi.** Tidak ada "Tentu, dengan senang hati".
- **Sebut Jendral Arib dan Kamerad Fuad.** Nama tetap.

### Tetap pakai bahasa Inggris untuk

- **Changelog, komentar kode, nama tes, commit message.** Biar sejarah teknis
  tetap bisa dibaca siapa pun yang buka repo ini nanti.
- **Istilah yang memang bahasa Inggris** dan lebih jelas begitu — `scope`,
  `deploy`, `endpoint`, `fallback`. Jangan dipaksa diterjemahkan.

### Tetap pakai bahasa Indonesia untuk

- **Semua teks di aplikasi.** Label tombol, peringatan, judul halaman.
  Penggunanya orang Indonesia.
- **SQL dan pesan log** yang dibaca saat ada masalah.

---

## ✈️ Telegram Skill: Kirim Pesan Cepat ke Grup Citcat / Kamerad Fuad / Jendral Arib

Sistem di laptop ini memiliki bridge Telegram aktif (`MbgTelegramBridge`) menggunakan bot resmi **`@Arib_Intelegence_Bot`**.

Perintah CLI `tg-send` sudah terpasang global di PATH sistem dan bisa dipanggil langsung dari terminal / shell mana saja dengan kecepatan instan (< 1 detik).

### 🎛️ Fitur Remote Session Cockpit (`/sess`):
- Jendral Arib dapat mengetik `/sess` atau `/session` di chat pribadi bot untuk memunculkan tombol interaktif (Inline Keyboard) memilih sesi DeepSeek Harness yang aktif di laptop (`MBG QUANT`, `Pricing Dashboard`, dll.) atau membuat sesi baru.
- Setiap perintah yang dikirim Jendral di chat pribadi akan tercatat dan dieksekusi terhubung dengan sesi kerja tersebut.

### 🛠️ Cara Penggunaan oleh AI Agent

1. **Pesan pendek (satu baris saja):**
   ```bash
   tg-send "Halo update sistem..."               # Kirim ke grup default (Citcat)
   tg-send --japri "Halo Jendral Arib..."         # Kirim ke japri/chat pribadi Jendral Arib
   ```

2. **Pesan panjang / multi-baris (CARA YANG DISARANKAN):**
   ```bash
   # Tulis dulu ke file, baru kirim
   tg-send --file "path/ke/file_pesan.txt"        # Ke grup
   tg-send --japri --file "path/ke/file.txt"      # Ke japri Jendral Arib
   ```

3. **Lewat stdin:**
   ```bash
   type pesan.txt | tg-send
   ```

---

## 📱 WhatsApp Skill: Kirim Pesan ke Kamerad Fuad (+6281224170187)

Sistem di laptop ini memiliki bridge WhatsApp aktif (`MbgWaBridge`) yang sudah
login permanen dan terdaftar whitelist khusus untuk partner:
**Kamerad Fuad (+6281224170187)**.

Perintah CLI `wa-masfuad` sudah terpasang global di PATH sistem dan bisa
dipanggil langsung dari terminal / shell mana saja.

### 🚨 ATURAN PALING PENTING: PESAN PANJANG / MULTI-BARIS **WAJIB** PAKAI `--file`

```bash
# BENAR untuk pesan panjang / multi-baris:
wa-masfuad --file "path/ke/pesan.txt"

# HANYA untuk pesan pendek SATU BARIS:
wa-masfuad "Pesan singkat satu baris"
```

**KENAPA INI KRITIS — insiden nyata 2026-10-06:**

Pesan 670 karakter berisi 10 baris dikirim lewat argumen. Yang sampai ke WhatsApp
Kamerad Fuad hanya **55 karakter** — baris pertama saja. **Tidak ada pesan error.**
Pesan terpotong diam-diam dan hampir tidak ketahuan.

Penyebabnya: shell (PowerShell / cmd) memecah argumen pada baris kosong dan
karakter khusus. `wa-masfuad.bat` meneruskan pecahan itu lewat `%*`, dan hanya
bagian pertama yang lolos. Ini **tidak akan** memunculkan error apa pun.

**Aturan praktis:** kalau pesannya lebih dari satu baris atau lebih dari ~200
karakter, **selalu** tulis ke file dulu, lalu kirim dengan `--file`.

### 🛠️ Cara Penggunaan oleh AI Agent

1. **Pesan pendek (satu baris saja):**
   ```bash
   wa-masfuad "Halo Kamerad Fuad, ini update singkat..."
   ```

2. **Pesan panjang / multi-baris (CARA YANG DISARANKAN):**
   ```bash
   # Tulis dulu ke file, baru kirim
   wa-masfuad --file "path/ke/file_pesan.txt"
   ```

3. **Lewat stdin (juga aman untuk pesan panjang):**
   ```bash
   type pesan.txt | wa-masfuad
   ```

### ✅ VERIFIKASI SETELAH MENGIRIM

Perintah akan menampilkan **`Sumber`**, **`Panjang`**, dan **`Baris`**. SELALU
periksa ketiganya:

```
Sumber   : file (aman untuk pesan panjang)
Panjang  : 670 karakter      <- harus masuk akal, bukan 55
Baris    : 10
[SUKSES] Pesan berhasil terkirim ke Mas Fuad!
```

Kalau `Panjang` jauh lebih kecil dari yang Anda tulis, **pesannya terpotong** —
kirim ulang dengan `--file`.

### 📋 Aturan & Pemicu

- **Pemicu Utama:** Jika Jendral Arib meminta *"kirim ke Kamerad Fuad"*,
  *"update Kamerad Fuad"*, *"kabari Kamerad Fuad"*, atau ada blok bertanda
  `💬 Untuk Kamerad Fuad`.
- **KIRIM LANGSUNG, JANGAN TUNGGU DIMINTA.** Kalau ada blok `💬 Untuk Kamerad Fuad`
  dalam balasan, **langsung kirim** di turn yang sama. Jangan hanya menampilkan
  teksnya lalu menunggu perintah. Jendral Arib sudah menegur soal ini sekali.
- **Setelah mengirim**, laporkan Message ID dan jumlah karakter yang benar-benar
  terkirim — supaya terbukti utuh, bukan terpotong.
- **Format Pesan:** Ringkas, padat, informatif, bahasa santai Jawa/Indonesia,
  dan sertakan poin-poin penting perubahan.
- **Keamanan:** Perintah ini dibatasi whitelist di bridge (hanya bisa terkirim
  ke nomor Kamerad Fuad: `6281224170187`).
