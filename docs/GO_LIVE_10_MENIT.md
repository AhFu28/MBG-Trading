# 🚀 GO LIVE — 10 MENIT, KABEH MLARAK

**Kanggo:** Jendral Arib
**Tanggal:** 6 Oktober 2026

---

## ⚡ Sing Bener-Bener Ngalangi

Kabeh **kode** wis rampung lan ter-deploy. Sing kurang mung **rong kredensial** sing
mung Jendral sing duwe akses.

| Sing rusak | Sebab | Butuh sapa |
|---|---|---|
| Pelanggan ora iso daftar | Supabase durung diisi | **Jendral** (10 mnt) |
| Data engine ora mlebu web | Ora ana pipa data | **Jendral** (5 mnt) |
| **Rega pasar** | — | ✅ **WIS MLARAK** |
| **Crypto Futures** | — | ✅ **WIS MLARAK** |
| **Forex & Emas** | — | ✅ **WIS MLARAK** |
| **Paus on-chain** | — | ✅ **WIS MLARAK** |

---

## ✅ Sing Wis Ora Perlu Dipikir

Tak priksa **CORS** menyang produksi — kabeh telu ngidini browser njupuk langsung:

| Sumber | Asil |
|---|---|
| Gate.io Futures | `Access-Control-Allow-Origin: *` ✅ |
| TradingView | `Access-Control-Allow-Origin: https://mbg-trading.pages.dev` ✅ |
| Binance Vision | `Access-Control-Allow-Origin: *` ✅ |

**Tegese: data pasar ora butuh backend blas.** Browser njupuk dhewe. Wis mlarak.

---

## 📋 LANGKAH 1 — Supabase (akun + dhuwit) · 10 menit

Iki sing **paling penting**. Tanpa iki ora ana sing iso daftar lan ora ana dhuwit mlebu.

1. **Buat project** nang https://supabase.com → **New Project**
   - Region: **Singapore** (paling cedhak)
   - Simpen database password

2. **SQL Editor** → **New query** → tempel kabeh isi `supabase/schema.sql` → **Run**
   - Verifikasi `rls_aktif = true`. **Nek ora, aja lanjut** — data pelanggan iso dibaca wong.

3. **Settings → API** → salin loro:
   - **Project URL** (`https://xxxxx.supabase.co`)
   - **anon public** key (dudu `service_role`!)

4. **Cloudflare** → Workers & Pages → `mbg-trading` → Settings → Environment variables:

   | Jeneng | Nilai | Tipe |
   |---|---|---|
   | `SUPABASE_URL` | `https://xxxxx.supabase.co` | Text |
   | `SUPABASE_KEY` | `eyJ...` (anon) | **Secret** |

5. **Deploy ulang**: Deployments → Retry deployment

6. **Uji**: buka situs → Daftar → kudu iso mlebu

---

## 📋 LANGKAH 2 — Pipa Data Engine · 5 menit

Supabase mung nyimpen **akun**. Data engine (trade plan, arena, broker summary)
kudu dikirim saka laptop iki menyang web.

**Pilih siji:**

### Opsi A · Cloudflare KV (disaranake — otomatis)

```powershell
# 1. Nang Cloudflare: Workers & Pages -> KV -> Create namespace
#    Jeneng: mbg-bundle     (salin Namespace ID)

# 2. Set 3 environment variable:
setx CLOUDFLARE_ACCOUNT_ID "account-id-saka-dashboard"
setx CLOUDFLARE_API_TOKEN  "token-kanti-izin-Workers-KV-Edit"
setx MBG_KV_NAMESPACE_ID   "namespace-id"

# 3. Tutup lan buka maneh PowerShell (supaya variable kebaca)

# 4. Bind KV nang Pages:
#    Pages -> mbg-trading -> Settings -> Functions -> KV namespace bindings
#    Variable name: MBG_BUNDLE     KV namespace: mbg-bundle

# 5. Uji:
npm run bundle:push
```

**Sakwise iki, kabeh otomatis.** Jadwal saben 30 menit bakal refresh **lan** push.

### Opsi B · Static file (ora disaranake)

Nek mung pengin cepet ndeleng, file bundle iso disalin menyang
`frontend/public/data/latest_cockpit_bundle.json` banjur push.

> ⚠️ **ORA AMAN.** Kabeh data PRO (trade plan, arena, broker summary) dadi file
> publik sing iso diundhuh sapa wae **tanpa login**. Wong ora perlu mbayar maneh.
> Mung kanggo testing lokal.

---

## ✅ Cara Priksa Kabeh Wis Mlarak

```powershell
# 1. Pipa data
npm run bundle:push-check

# 2. Data seger?
python scripts/refresh_crypto_futures.py
python scripts/refresh_forex.py

# 3. Jadwal mlaku?
Get-ScheduledTask -TaskName "MBG-*" | ForEach-Object {
  $i = Get-ScheduledTaskInfo -TaskName $_.TaskName
  "{0}  last={1}  result={2}" -f $_.TaskName, $i.LastRunTime, $i.LastTaskResult
}
# result=0 = sukses

# 4. Endpoint jujur?
curl.exe -s https://mbg-trading.pages.dev/api/account/me
# kudu: {"configured":true,...}   <- yen false, Supabase durung kebaca
```

---

## 🎯 Sing Bakal Katon Beda Sakwise Setup

| Sadurunge | Sakwise |
|---|---|
| Tombol Daftar → gagal | Pelanggan iso daftar |
| Landing page omong "belum diaktifkan" | Langsung form daftar |
| Akun & Langganan → kosong | Status + cara bayar |
| Data engine kosong | Trade plan, arena, broker mlebu |
| **Rega pasar** | ✅ **wis mlarak sakdurunge** |

---

## ⚠️ Wates Sing Kudu Dingerteni

**1. Aktivasi pelanggan isih manual.** Sawise transfer, Jendral kudu nglakoni:
```sql
select public.activate_subscription('pelanggan@gmail.com', 30, 'Transfer BCA');
```

**2. `AiAgentArenaTab.jsx` 7.416 baris.** Siji file. Nek ana bug nang kene, angel
digoleki. Iki utang teknis, dudu blocker.

**3. Sawetara desk isih metokake data conto** sing wis **dilabeli jelas** (Degen,
Memecoin Radar, Running Trade). Ora nyamar dadi nyata.

**4. `broker_summary` tanggal 17 Sep 2026.** Basi. Butuh pipeline IDX mlaku.

---

## 📞 Nek Ana Sing Ora Mlarak

Kabari aku kanti:
1. **Endi** sing ora mlarak (desk endi)
2. **Apa** sing katon (pesen error / kosong)
3. **Kapan** (baru wae, utawa wis suwe)

Aku iso langsung mriksa. Sing ora iso tak lakoni mung siji: **ngisi kredensial
sing mung Jendral sing duwe.** Liyane iso.
