# 🚀 PANDUAN AKTIVASI SINYAL VIP TELEGRAM

**Untuk:** Mas Fuad & Tim MBG Trading
**Tanggal:** 5 Oktober 2026
**Status saat ini:** Sistem SIAP, tinggal 2 hal yang harus Anda isi sendiri (kredensial)

---

## ⚠️ BACA DULU: Kenapa Belum Aktif?

Saat saya hendak mengaktifkan VIP hari ini, saya menemukan **masalah serius** dan **berhenti** — karena kalau diteruskan, Anda akan mengirim sinyal yang merugikan pelanggan.

### Masalah yang ditemukan & sudah diperbaiki

| Masalah | Temuan | Status |
|---|---|---|
| **Data basi 18 hari** | Trade plan terakhir dibuat **17 September**. Contoh: CUAN tertulis entry **Rp 945**, harga asli **Rp 840** (turun 11%) | ✅ Diperbaiki — pipeline dijalankan ulang |
| **Tidak ada jejak sumber** | Plan tidak punya field `source` & `observed_at`, jadi gerbang kejujuran memblokir semua 12 sinyal | ✅ Diperbaiki — generator sekarang menulis provenance |
| **Tidak ada pengaman kesegaran** | Tidak ada yang mencegah sinyal basi terkirim di masa depan | ✅ Diperbaiki — sinyal > 48 jam otomatis DIBLOKIR |

**Kalau saya aktifkan kemarin, grup berbayar Anda akan menerima "Beli CUAN di Rp 945" padahal harganya Rp 840.**

Sekarang pengaman itu **tidak bisa dilewati** — sudah ada 34 tes otomatis yang menjaganya.

---

## 📋 YANG PERLU ANDA ISI (2 Hal)

### 1️⃣ Token Bot Telegram

**Kalau belum punya bot:**
1. Buka Telegram, cari **@BotFather**
2. Kirim `/newbot`
3. Ikuti instruksinya (beri nama & username bot)
4. BotFather akan memberi **TOKEN** seperti:
   ```
   7845123456:AAH9xK2mPqRsTuVwXyZ1234567890abcde
   ```
5. **Simpan token ini** — jangan bagikan ke siapa pun

### 2️⃣ Chat ID Grup VIP

**Cara mendapatkannya:**
1. Buat grup Telegram baru (mis. "MBG VIP Signals")
2. **Tambahkan bot Anda ke grup itu sebagai admin**
3. Kirim satu pesan apa pun di grup
4. Buka di browser:
   ```
   https://api.telegram.org/bot<TOKEN_ANDA>/getUpdates
   ```
5. Cari bagian `"chat":{"id": -1001234567890}` — **angka itu chat_id grup** (selalu mulai dengan minus)

---

## ⚙️ CARA MENGISINYA

### Langkah 1: Buat file `.env`

Di folder utama proyek, buat file bernama `.env` (kalau belum ada):

```env
TELEGRAM_BOT_TOKEN=7845123456:AAH9xK2mPqRsTuVwXyZ1234567890abcde
TELEGRAM_CHAT_ID=-1001234567890
```

> ⚠️ File `.env` sudah otomatis dikecualikan dari Git. **Jangan pernah commit token.**

### Langkah 2: Daftarkan penerima berbayar

Salin file contoh lalu isi:
```powershell
Copy-Item engine\config\vip_subscribers.example.json engine\config\vip_subscribers.json
```

Lalu edit `engine/config/vip_subscribers.json` menjadi:

```json
{
  "subscribers": [
    {
      "chat_id": "-1001234567890",
      "tier": "VIP",
      "expires_at": "2026-11-30",
      "active": true,
      "name": "pelanggan-01-budi"
    },
    {
      "chat_id": "-1009876543210",
      "tier": "VIP",
      "expires_at": "2026-12-31",
      "active": true,
      "name": "pelanggan-02-siti"
    }
  ]
}
```

**Catatan penting:**
- `expires_at` = tanggal langganan berakhir. Setelah lewat, **akses otomatis dicabut**.
- Untuk pelanggan yang berhenti bayar: ubah `active` menjadi `false`.
- **Jangan commit file ini** kalau sudah berisi chat_id pelanggan asli.

---

## ✅ CARA MENGUJI SEBELUM KIRIM SUNGGUHAN

### Uji 1: Dry-run (TIDAK mengirim apa pun)

```powershell
python scripts\send_vip_signals.py --limit 3
```

Yang Anda lihat:
- `VIP queued: 0` → ❌ belum ada subscriber
- `VIP queued: 3` → ✅ siap kirim

### Uji 2: Kirim sungguhan (`--live`)

```powershell
python scripts\send_vip_signals.py --live --limit 1
```

**Mulai dengan `--limit 1`** supaya kalau ada yang salah, hanya 1 pesan terkirim.

---

## 🛡️ PENGAMAN YANG SUDAH TERPASANG

Sistem **menolak mengirim** sinyal presisi kalau:

| Kondisi | Perilaku |
|---|---|
| Tidak ada `source` | ❌ Diblokir → turun jadi catatan publik |
| Tidak ada `observed_at` | ❌ Diblokir |
| Data bertanda synthetic/simulasi | ❌ Diblokir |
| **Umur plan > 48 jam** | ❌ **Diblokir (BARU)** |
| Umur plan 12–48 jam | ⚠️ Dikirim dengan peringatan |
| Tanggal tidak bisa dibaca | ❌ Diblokir |

**Yang diblokir tidak hilang** — otomatis berubah menjadi "catatan publik" tanpa level presisi. Jadi Anda tetap tahu ada plan, tapi pelanggan tidak diberi harga yang salah.

---

## 📊 STATUS SISTEM SAAT INI

| Komponen | Status |
|---|---|
| Data trade plan | ✅ **Segar** (5 Okt 2026, 14:43 WIB) |
| Provenance (jejak sumber) | ✅ Lengkap (source + observed_at) |
| Gerbang kejujuran | ✅ Lolos semua 12 plan |
| Pengaman kesegaran | ✅ Aktif (34 tes lulus) |
| Subscriber | ⏳ **Perlu diisi** |
| Token Telegram | ⏳ **Perlu diisi** |

---

## 💡 ALUR BISNIS YANG DISARANKAN

```
Pekan 1 — Uji internal
  ├─ Isi .env + vip_subscribers.json (chat_id Mas Fuad & Naufal saja)
  ├─ Jalankan --live --limit 1
  └─ Pastikan pesan sampai & formatnya benar

Pekan 2 — Founding cohort (Rp 150.000/bulan)
  ├─ Buka pendaftaran 20-30 orang pertama
  ├─ Tambahkan chat_id mereka satu per satu
  └─ Kirim sinyal harian dari pipeline otomatis

Pekan 3 — Evaluasi
  ├─ Cek: apakah pelanggan bertahan? (target >70%)
  └─ Tanya: fitur apa yang mereka butuhkan?
```

---

## ❓ KALAU ADA MASALAH

**"VIP queued: 0" padahal subscriber sudah diisi**
→ Cek `expires_at` — mungkin sudah lewat, atau `active` bernilai `false`.

**Bot tidak mengirim ke grup**
→ Pastikan bot sudah **admin** di grup itu, dan chat_id **dimulai dengan minus**.

**Pesan muncul tapi tanpa level entry/SL/TP**
→ Berarti gerbang kejujuran memblokir. Cek alasan di output — biasanya data terlalu tua.

**Ingin menguji tanpa mengganggu pelanggan**
→ Pakai grup Telegram terpisah untuk uji coba.

---

## 📁 FILE TERKAIT

| File | Fungsi |
|---|---|
| `engine/notifiers/vip_signal_router.py` | Gerbang kejujuran + pengaman kesegaran |
| `engine/notifiers/telegram_notifier.py` | Pengirim pesan ke Telegram |
| `scripts/send_vip_signals.py` | Perintah kirim manual |
| `engine/config/vip_subscribers.json` | **Daftar penerima (Anda isi di sini)** |
| `.env` | **Token & chat ID (Anda isi di sini)** |
| `engine/tests/test_vip_signal_router.py` | 34 tes pengaman |

---

**Pertanyaan?** Kabari saya — saya bisa bantu setup atau periksa kalau ada yang tidak jalan.
