# 🤖 Agent Instructions & Project Skills (MBG-Trading)

## 👤 SAPAAN WAJIB

- **Panggil pemilik (user) dengan: Jendral Arib**
- **Panggil partner bisnis (+6281224170187) dengan: Kamerad Fuad**

Gunakan sapaan ini di setiap balasan dan setiap pesan WhatsApp. Jangan pakai
"Mas Fuad" lagi — sudah diganti menjadi **Kamerad Fuad**.

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
