# 👤 PANDUAN SISTEM AKUN & LANGGANAN

**Untuk:** Mas Fuad
**Tanggal:** 5 Oktober 2026
**Status:** Kode SIAP. Perlu 1x setup Supabase (±15 menit)

---

## 📋 Apa yang Sudah Dibangun

Sistem akun sungguhan: pengunjung daftar gratis, dapat fitur terbatas, dan
harus berlangganan Pro untuk membuka fitur analitik + sinyal real-time.

```
Pengunjung buka website
        ↓
   Landing page (halaman penjualan)
        ↓
  ┌─────────────┬──────────────┐
  │  Daftar     │    Masuk     │
  └─────────────┴──────────────┘
        ↓
   Akun FREE (fitur terbatas)
   • Sinyal tertunda 24 jam
   • 6 sinyal/hari
   • Modul analitik TERKUNCI
        ↓
   Bayar (transfer / QRIS)
        ↓
   Anda aktifkan manual
        ↓
   Akun PRO (semua terbuka)
   • Sinyal REAL-TIME
   • Notifikasi Telegram
   • 14 modul analitik terbuka
```

---

## ⚙️ SETUP SUPABASE (Sekali Saja)

### Langkah 1: Buat Project Supabase

1. Buka **https://supabase.com** → **Sign up** (gratis)
2. Klik **New Project**
3. Isi:
   - **Name**: `mbg-trading`
   - **Database Password**: buat yang kuat, **simpan**
   - **Region**: pilih **Singapore** (paling dekat dengan Indonesia)
4. Tunggu ±2 menit sampai project siap

### Langkah 2: Jalankan Skema Database

1. Di sidebar Supabase, klik **SQL Editor**
2. Klik **New query**
3. Buka file **`supabase/schema.sql`** dari proyek ini
4. **Salin SELURUH isinya**, tempel ke SQL Editor
5. Klik **Run**

**Verifikasi:** di bagian bawah harus muncul hasil seperti ini:
```
tablename  | rls_aktif
profiles   | true
```

> ⚠️ **Kalau `rls_aktif` bukan `true`, JANGAN lanjut.** Itu berarti siapa pun
> bisa membaca data pelanggan Anda. Jalankan ulang skema.

### Langkah 3: Ambil Kredensial

1. Di sidebar Supabase, klik **Settings** (ikon gerigi)
2. Klik **API**
3. Salin **dua** nilai ini:
   - **Project URL** → contoh: `https://abcdefgh.supabase.co`
   - **anon public** key (bukan `service_role`!) → string panjang `eyJ...`

> 🔒 **PENTING:** pakai kunci **`anon public`**, JANGAN `service_role`.
> Kunci `service_role` bisa menghapus seluruh database Anda. Kunci itu
> **tidak boleh** ada di website.

### Langkah 4: Isi Environment Variables di Cloudflare

1. Buka **Cloudflare Dashboard** → **Workers & Pages**
2. Klik project **mbg-trading** → **Settings** → **Environment variables**
3. Tambahkan:

| Nama | Nilai | Tipe |
|---|---|---|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Text |
| `SUPABASE_ANON_KEY` | `eyJ...` (kunci anon) | **Secret** |
| `JWT_SECRET` | string acak panjang | **Secret** |

**Cara membuat `JWT_SECRET` yang aman:**
```powershell
# Jalankan di PowerShell, salin hasilnya
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
```

4. Klik **Save**
5. **Deploy ulang**: **Deployments** → **Retry deployment** (atau push commit baru)

### Langkah 5: Matikan Konfirmasi Email (opsional tapi disarankan)

Supabase secara default meminta pengguna konfirmasi email dulu. Untuk
mempermudah pendaftaran:

1. **Authentication** → **Providers** → **Email**
2. Matikan **Confirm email**
3. **Save**

> Kalau dibiarkan menyala, pengguna harus klik tautan di email sebelum bisa
> masuk. Itu lebih aman, tapi lebih banyak yang gagal daftar.

---

## ✅ CARA MENGUJI

### Uji 1: Landing page muncul
Buka **https://mbg-trading.pages.dev** → seharusnya muncul halaman penjualan,
bukan langsung terminal.

### Uji 2: Daftar akun
1. Klik **Daftar Gratis**
2. Isi nama, email, kata sandi (min. 8 karakter)
3. Klik **Daftar Sekarang**
4. Seharusnya langsung masuk ke cockpit sebagai **FREE**

### Uji 3: Pastikan fitur terkunci
1. Klik menu **🎯 Early Signal Radar**
2. Seharusnya muncul **"🔒 Modul Ini Khusus Pro"**, bukan halamannya

### Uji 4: Aktifkan Pro untuk diri sendiri
1. Buka **Supabase** → **SQL Editor**
2. Jalankan (ganti emailnya):
```sql
select public.activate_subscription('email-anda@gmail.com', 30, 'Test sendiri');
```
3. Kembali ke website → buka **👑 Akun & Langganan** → klik **🔄 Perbarui Status**
4. Badge harus berubah jadi **👑 PRO** dan semua menu terbuka

---

## 💰 CARA MENGELOLA PELANGGAN

Semua perintah dijalankan di **Supabase → SQL Editor**.

### Aktifkan langganan 30 hari
```sql
select public.activate_subscription('pelanggan@gmail.com', 30, 'Transfer BCA 5 Okt');
```

### Aktifkan 90 hari (diskon)
```sql
select public.activate_subscription('pelanggan@gmail.com', 90, 'Transfer BCA 5 Okt - paket 3 bulan');
```

> 💡 **Perpanjangan tidak hangus.** Kalau pelanggan masih punya 10 hari sisa lalu
> Anda tambah 30 hari, dia dapat **40 hari**. Perhitungan dimulai dari tanggal
> berakhir yang ada, bukan dari hari ini.

### Matikan akses (pelanggan berhenti)
```sql
select public.deactivate_subscription('pelanggan@gmail.com');
```

### Lihat semua pelanggan berbayar
```sql
select email, tier, expires_at, payment_note
from public.profiles
where tier = 'pro'
order by expires_at;
```

### Lihat yang akan habis dalam 7 hari (untuk pengingat)
```sql
select email, expires_at
from public.profiles
where tier = 'pro'
  and expires_at between now() and now() + interval '7 days'
order by expires_at;
```

---

## 🔐 KEAMANAN YANG SUDAH TERPASANG

| Perlindungan | Status |
|---|---|
| Kata sandi di-hash oleh Supabase Auth (bukan kode kita) | ✅ |
| Cookie sesi `HttpOnly` — tidak bisa dibaca JavaScript | ✅ |
| Tier dibaca dari **database**, bukan dari browser | ✅ |
| Pelanggan **tidak bisa** mengubah tier sendiri (RLS) | ✅ |
| Langganan lewat tanggal → **otomatis** jadi Free | ✅ |
| Pesan error login tidak membocorkan email mana yang terdaftar | ✅ |
| 171 tes otomatis menjaga semua ini | ✅ |

**Yang sengaja TIDAK dilakukan:**
- Menyimpan kata sandi sendiri — itu cara paling umum kebocoran data terjadi
- Menaruh kunci `service_role` di website
- Mempercayai browser soal tier

---

## ⚠️ BATAS YANG PERLU ANDA TAHU

**1. Aktivasi masih manual.**
Setelah pelanggan transfer, Anda harus menjalankan perintah SQL. Kalau ada
50 pelanggan baru sehari, ini akan melelahkan. Saat itu terjadi, kita perlu
payment gateway otomatis (Midtrans/Xendit).

**2. Halaman terkunci bukan tembok beton.**
Orang yang bisa mengedit JavaScript bisa *melihat* menu Pro — tapi **datanya
tetap dari server** yang memeriksa sendiri. Jadi mereka tidak dapat data Pro
sungguhan. Ini cukup untuk sekarang, tapi **jangan pernah menaruh rahasia**
(misal kunci API) di fitur yang hanya dijaga cara ini.

**3. Belum ada pengingat otomatis.**
Langganan habis tidak mengirim email. Anda perlu cek manual dengan perintah
SQL di atas.

---

## 🎯 URUTAN YANG DISARANKAN

```
Hari ini    → Setup Supabase, uji daftar + aktivasi sendiri
Besok       → Ajak 2-3 orang uji coba (gratis), kumpulkan masukan
Minggu ini  → Tawarkan ke 10 orang pertama dengan harga founding member
Bulan depan → Kalau sudah >20 pelanggan, pertimbangkan payment gateway
```

---

## ❓ KALAU ADA MASALAH

**"Layanan akun belum dikonfigurasi"**
→ `SUPABASE_URL` / `SUPABASE_ANON_KEY` belum diisi di Cloudflare, atau
belum deploy ulang setelah mengisi.

**Pendaftaran berhasil tapi tidak bisa masuk**
→ Kemungkinan konfirmasi email masih menyala. Cek Langkah 5 di atas.

**Sudah bayar tapi masih Free**
→ Jalankan `activate_subscription` dengan email yang **persis sama**, lalu
klik **🔄 Perbarui Status** di halaman Akun & Langganan.

**Muncul "Anda tidak punya akses" padahal sudah Pro**
→ Cek tanggal berakhir:
```sql
select email, tier, expires_at from public.profiles where email = 'email-anda';
```
Kalau `expires_at` sudah lewat, aksesnya otomatis dicabut (memang begitu caranya).

---

## 📁 FILE TERKAIT

| File | Fungsi |
|---|---|
| `supabase/schema.sql` | Skema database — **jalankan sekali** |
| `frontend/functions/api/account/_shared.js` | Logika inti tier & keamanan |
| `frontend/functions/api/account/signup.js` | Endpoint daftar |
| `frontend/functions/api/account/login.js` | Endpoint masuk |
| `frontend/functions/api/account/me.js` | Sumber kebenaran tier |
| `frontend/functions/api/account/logout.js` | Keluar |
| `frontend/src/services/featureAccess.js` | **Peta fitur per tier** |
| `frontend/src/components/LandingPage.jsx` | Halaman penjualan |
| `frontend/src/components/AuthPanel.jsx` | Form masuk/daftar |
| `frontend/src/components/SubscriptionPage.jsx` | Halaman langganan |
| `frontend/src/services/__tests__/accountApi.test.js` | 27 tes keamanan |

---

**Pertanyaan?** Kabari saya — saya bisa bantu setup atau periksa kalau ada yang tidak jalan.
