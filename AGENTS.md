# 🤖 Agent Instructions & Project Skills (MBG-Trading)

## 📱 WhatsApp Skill: Kirim Pesan ke Mas Fuad (+6281224170187)
Sistem di laptop ini memiliki bridge WhatsApp aktif (`MbgWaBridge`) yang sudah login permanen dan terdaftar whitelist khusus untuk partner: **Mas Fuad (+6281224170187)**.

Perintah CLI `wa-masfuad` sudah terpasang global di PATH sistem dan bisa dipanggil langsung dari terminal / shell mana saja.

### 🛠️ Cara Penggunaan oleh AI Agent:
Gunakan tool shell (`pwsh` atau `bash`) untuk menjalankan perintah:

1. **Kirim teks langsung:**
   ```bash
   wa-masfuad "Halo Mas Fuad, ini update terbaru dari sistem..."
   ```

2. **Kirim dari file teks / markdown (untuk pesan panjang / changelog):**
   ```bash
   wa-masfuad --file "path/ke/file_pesan.txt"
   ```

### 📋 Aturan & Pemicu:
- **Pemicu Utama:** Jika user meminta *"kirim ke Mas Fuad"*, *"update Mas Fuad"*, *"kabari Mas Fuad"*, atau terdapat catatan/blok bertanda `💬 Untuk Mas Fuad`.
- **Format Pesan:** Ringkas, padat, informatif (bahasa santai/Jawa/Indonesia sesuai permintaan user), dan sertakan poin-poin penting perubahan.
- **Keamanan:** Perintah ini sudah dibatasi whitelist di bridge (hanya bisa terkirim ke nomor Mas Fuad: `6281224170187`).
