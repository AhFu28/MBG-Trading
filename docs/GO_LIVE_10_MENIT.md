# 🚀 GO LIVE — STATUS DAN LANGKAH BERIKUTNYA

**Untuk:** Jendral Arib
**Diperbarui:** 6 Oktober 2026
**Repo:** `AhFu28/MBG-Trading` (milik Kamerad Fuad)

---

## ✅ Yang SUDAH JALAN (tanpa perlu apa-apa)

Per 6 Oktober 2026, hal-hal ini sudah berfungsi **tanpa kredensial apa pun**:

| Fitur | Status |
|---|---|
| Harga pasar (saham, crypto, forex, emas) | ✅ Jalan |
| Crypto Futures — KONTRAK PERPETUAL | ✅ Jalan |
| Crypto Futures — OPEN INTEREST | ✅ Jalan |
| Crypto Futures — LONG/SHORT GAUGE | ✅ Jalan |
| Crypto Futures — LIKUIDASI 24 JAM | ✅ Jalan |
| Crypto Futures — LIKUIDITAS PANAS | ✅ Jalan |
| Paus on-chain (data nyata mempool) | ✅ Jalan |
| Data engine sampai ke web | ✅ Jalan |

**Kenapa jalan:** build Cloudflare sekarang menyertakan bundle engine
langsung di dalam worker. Tidak butuh Supabase, tidak butuh KV.

**Batasnya:** data itu se-fresh **deploy terakhir** — bisa tertinggal sampai
**~1 jam**. GitHub Action meng-commit bundle baru tiap jam.

Aplikasi melaporkan ini terbuka, bukan disembunyikan:
```
X-Data-Source    : bundled-snapshot
X-Data-Live      : false
X-Data-Age-Hours : 0.6
```

---

## 🔴 YANG MASIH MENGHALANGI

### 1. Pelanggan belum bisa daftar dan bayar

Butuh Supabase **schema** dijalankan. Lihat Langkah 2.

### 2. ⚠️ Data VIP bocor ke publik

Bundle engine di-commit ke repo GitHub yang **publik**, jadi bisa diunduh
siapa saja:

```
https://raw.githubusercontent.com/AhFu28/MBG-Trading/main/engine/cache/latest_cockpit_bundle.json
```

Isinya: `daily_trade_plans` (12), `broker_summary` (81),
`bandarmology_iifs` (18), `forecasts` (18).

**Penutupnya:** jadikan repo **private**. Satu klik untuk Kamerad Fuad.

> ⚠️ **Jangan lakukan tanpa verifikasi.** Kalau repo jadi private, integrasi
> Cloudflare Pages bisa perlu di-otorisasi ulang. Kabari saya dulu supaya saya
> bisa langsung cek situsnya masih hidup.

---

## 📋 LANGKAH 1 — Undangan akses (SEDANG BERJALAN)

Email yang dipakai: **`naufalarib60@gmail.com`**

### ⚠️ Lakukan ini DULU

Cloudflare dan Supabase **mengundang lewat email**. Kalau email itu belum
terdaftar, undangannya tidak akan sampai.

Daftar akun gratis dengan email tersebut:

- **Cloudflare**: https://dash.cloudflare.com/sign-up
- **Supabase**: https://supabase.com/dashboard/sign-up

Setelah itu kabari Kamerad Fuad.

### Yang Kamerad Fuad lakukan

**Cloudflare** (2 menit):
1. [dash.cloudflare.com](https://dash.cloudflare.com/?to=/:account/members) → menu **Members**
2. Klik **Invite**
3. Masukkan `naufalarib60@gmail.com`
4. **Roles**: pilih **Workers Platform Admin**
5. **Continue to summary** → **Invite**

> **Kenapa `Workers Platform Admin`, bukan Super Administrator?**
> Peran itu sudah mencakup **Pages** dan **KV** — semua yang kita butuhkan.
> Tapi **tidak** memberi akses billing, mengubah anggota, atau menghapus akun.
> Kamerad Fuad tidak perlu menyerahkan kunci seluruh akunnya.

**Supabase** (2 menit):
1. [supabase.com/dashboard](https://supabase.com/dashboard) → organisasi → **Team**
2. Undang `naufalarib60@gmail.com`, peran **Administrator**
3. ⚠️ **Undangan Supabase kedaluwarsa dalam 24 jam.** Kalau lewat, kirim ulang.

**Tidak perlu kirim token lewat chat.** Menambah sebagai member sudah cukup.

---

## 📋 LANGKAH 2 — Jalankan schema Supabase

Setelah dapat akses:

1. Buka project Supabase → **SQL Editor** → **New query**
2. Tempel seluruh isi `supabase/schema.sql`
3. Klik **Run**
4. **Verifikasi** `rls_aktif = true`

> ⚠️ Kalau `rls_aktif` bukan `true`, **jangan lanjut**. Row Level Security itu
> yang mencegah satu pelanggan membaca data pelanggan lain.

---

## 📋 LANGKAH 3 — Verifikasi

```powershell
# 1. Akun sudah aktif?
curl.exe -s https://mbg-trading.pages.dev/api/account/me
# harus: {"configured":true,...}
# kalau false, env Supabase belum terbaca

# 2. Data sampai ke web?
# Login dulu di situs, lalu:
curl.exe -s -b cookies.txt https://mbg-trading.pages.dev/api/data -o NUL -w "%{http_code} %{header_json}"
# harus 200, dengan X-Data-Source

# 3. Situs hidup?
curl.exe -s -o NUL -w "%{http_code}" https://mbg-trading.pages.dev
# harus 200
```

---

## 🎯 Setelah Semua Selesai

| Sekarang | Setelah |
|---|---|
| Pelanggan tidak bisa daftar | Bisa daftar |
| Pembayaran tidak jalan | Bisa bayar |
| Data ter-update tiap ~1 jam | Data live (< 1 menit) |
| Data VIP publik di GitHub | Tertutup |

---

## 📞 Kalau Ada Yang Tidak Jalan

Kabari saya dengan:
1. **Di mana** — halaman mana
2. **Apa** yang terlihat — pesan error atau kosong
3. **Kapan** — baru saja, atau sudah lama

**Satu hal yang tidak bisa saya lakukan:** mengisi kredensial yang hanya
pemilik akun yang punya. Selebihnya saya bisa.
