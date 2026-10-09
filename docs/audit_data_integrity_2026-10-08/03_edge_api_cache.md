# 03 — Edge API, Cache & Supabase

> Audit Integritas & Provenance Data — MBG Trading
> Tanggal audit: **2026-10-08 19:35 – 2026-10-09 06:00 WIB** (UTC+7). t0 pengukuran usia = `2026-10-08T19:35:17+07:00`.
> 
> Metode: pembacaan kode langsung + perintah pengukuran + riwayat git. Setiap klaim punya bukti `path:line` atau perintah.


## 1. Ringkasan eksekutif

Edge layer sudah cukup jujur: endpoint utama menandai sumber dan usia data lewat header (`X-Data-Source`, `X-Data-Live`, `X-Data-Age-Hours`). Risiko terbesar ada pada **snapshot yang di-inline saat build** (`data.js:55`): ia hanya sesegar deploy terakhir, sementara commit data memakai `[skip ci]` yang berpotensi melewati build Cloudflare Pages.

## 2. Endpoint

| Endpoint | Sumber | Auth | Cache-Control | Label |
|---|---|---|---|---|
| `/api/data` | 1) Supabase REST `system_state.LATEST_COCKPIT_BUNDLE` -> 2) KV/R2 `MBG_BUNDLE` -> 3) snapshot inline | JWT cookie wajib (401 tanpa token) | `no-store` (error); `max-age=30, s-maxage=60, stale-while-revalidate=120` (Supabase); `max-age=30, s-maxage=60` (snapshot) | **PERIODIK-JADWAL** |
| `/api/scanner` | Proxy nyata ke `scanner.tradingview.com/<market>/scan` | JWT + rate limit 30/mnt + allowlist indonesia/america/forex/cfd | `max-age=10, s-maxage=15` | **NEAR-REALTIME** |
| `/api/arena-state` | Supabase `LATEST_ARENA_STATE` lalu fallback `/api/data` (`bundle.arena_state`) | JWT | `private, max-age=15` / `30` | **PERIODIK-JADWAL** |
| `/api/account/*` | Supabase (akun, sesi, pembayaran, admin approve/reject) | JWT/sesi | - | **REALTIME (tulis runtime)** |

Bukti: data.js:55, 164-206, 211-231, 239-257; scanner.js:10, 92, 120, 144; arena-state.js:8, 16, 30-40.

## 3. Risiko `[skip ci]` pada snapshot inline

- `hourly_crypto_macro.yml:159`: commit memakai pesan `chore(data): automated bundle refresh [<mode>] [skip ci]`.
- `data.js:55`: `import bundledSnapshot from '../../../engine/cache/latest_cockpit_bundle.json'` - di-inline saat build.
- Komentar `data.js:28-32` mengasumsikan Pages rebuild tiap commit sehingga lag ~1 jam.
- **RISIKO**: bila Pages menghormati `[skip ci]`, snapshot hanya berubah ketika ada commit kode. Usia snapshot bisa jauh melebihi 1 jam tanpa terlihat.
- Mitigasi sudah ada: `X-Data-Live: false` + `X-Data-Age-Hours` (data.js:252, 255) menyatakan jujur bahwa sumber ini bukan live.
- **TIDAK TERVERIFIKASI**: perilaku skip-build Cloudflare Pages untuk repo ini (perlu cek dashboard Pages).

## 4. Cache lokal (engine/cache/)

| File | Timestamp internal | Catatan |
|---|---|---|
| latest_cockpit_bundle.json | `last_updated = 2026-10-08T09:53:26Z` | mtime 17:15 WIB = waktu commit; isi lebih tua ~22 mnt |
| latest_arena_state.json | `last_evaluated = 2026-10-08T10:28:25Z` | konsisten dengan mtime |
| arena_state.json | `last_evaluated = 2026-10-05T07:43:06Z` | mtime 10-07 tetapi isi 10-05 -> **arsip** |
| macro_telemetry.json | `updated_at = 2026-09-27T14:26:07` | mtime 09-30, isi ~11 hari |
| crypto_spot_10, research_archive, paper_portfolio, last_known_macro | tidak ada kunci waktu | mtime 09-30 |
| daily_trade_plans, idx_categorized | tidak ada kunci waktu | mtime 10-07 05:43 |

**Kesimpulan penting**: mtime file cache **bukan** waktu produksi data, melainkan waktu commit/pull. Menilai kesegaran dari mtime saja akan melebih-lebihkan kesegaran. Pakai `last_updated`/`last_evaluated` internal.

## 5. Supabase

- Tabel `system_state` (schema.sql:83) adalah kanal data live: `supabase_client.py:112` meng-upsert `LATEST_COCKPIT_BUNDLE`.
- Pembacaan: `data.js:178`, `arena-state.js:16`, `_session.js:107`.
- Status: hanya hidup bila kredensial Supabase di-set di env pipeline; jika tidak, jalur jatuh ke snapshot inline.
- Data akun/pembayaran (`/api/account/*`) hanya hidup di Supabase - itu state nyata, bukan statis.
- **TIDAK TERVERIFIKASI**: apakah upsert benar-benar berjalan di produksi (butuh kredensial/observasi DB).

## 6. Rekomendasi

- **P0** - Verifikasi skip-build Pages. Bila `[skip ci]` memblokir rebuild, hapus flag itu untuk commit data atau kirim bundle via KV/R2 (`push_bundle_to_edge.py`).
- **P1** - Tampilkan `X-Data-Age-Hours`/`X-Data-Source` di UI provenance, bukan hanya di header.
- **P1** - Hentikan commit file cache mati (`macro_telemetry.json` dll.) atau tandai sebagai arsip.
