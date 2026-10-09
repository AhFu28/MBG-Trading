# 02 — Engine Python & Penjadwalan

> Audit Integritas & Provenance Data — MBG Trading
> Tanggal audit: **2026-10-08 19:35 – 2026-10-09 06:00 WIB** (UTC+7). t0 pengukuran usia = `2026-10-08T19:35:17+07:00`.
> 
> Metode: pembacaan kode langsung + perintah pengukuran + riwayat git. Setiap klaim punya bukti `path:line` atau perintah.
> Catatan proses: delegasi ke model alternatif (`nvidia/*`) gagal — route tersebut tidak mengeksekusi tool di sesi ini (probe menulis file tidak menghasilkan file). Teammate Agent Teams juga berhenti tanpa menulis laporan. Karena itu **audit diselesaikan langsung oleh Lead**; bukti mentah ada di `00_LEAD_VERIFIKASI.md`.


## 1. Ringkasan eksekutif

Dari 8 fetcher, **6 bersumber pasar nyata** dan **2 punya jalur sintetis** yang dilabeli (`broker_summary_fetcher` → `data_source="simulated"`, `foreign_flow_fetcher` → `data_source="estimated"`). Masalah utamanya bukan sumber, melainkan **jadwal**: `hourly_crypto_macro` dijadwalkan tiap jam (`cron: '0 * * * *'`) tetapi commit nyata berjarak **5–8 jam**. Lima workflow lain (termasuk semua yang menyegarkan IDX harian) **tidak punya `schedule:`** — hanya `workflow_dispatch` — sehingga efektif BATCH-MANUAL dan bergantung pada ada orang menekan tombol.

## 2. Peta mode → fetcher → output

| Mode (`run_pipeline.py`) | Fetcher | Output | Cadence |
|---|---|---|---|
| `all`, `hourly_crypto_macro` (baris 200) | crypto spot/futures, macro telemetry | bundle | Terjadwal (nyatanya 5–8 j) |
| `all`, `hourly_crypto_macro`, `whale` (247) | whale tracker | bundle | idem |
| `all`, `daily_idx_morning`, `forex`, `hourly_crypto_macro` (269) | forex scanner | bundle | idem |
| `all`, `daily_idx_morning`, `us_stocks` (277) | us market (yfinance) | bundle | **harian `30 22 * * *`** |
| `all`, `daily_idx_morning` (285) | IDX market + broker/foreign flow | bundle | **manual saja** |
| `intraday_idx_refresh` (297) | refresh IDX intraday | bundle | **manual saja** |

## 3. Sumber data fetcher (host nyata, bukan mock)

| Fetcher | Host sumber | Catatan |
|---|---|---|
| crypto_spot.py | api.coingecko.com, scanner.tradingview.com, api.binance.com | Bila semua gagal → **list kosong**, bukan harga palsu (baris 143) |
| crypto_futures.py | fapi.binance.com, api.gateio.ws | |
| idx_market.py | scanner.tradingview.com:393 | menulis `last_updated` (688) |
| forex_scanner.py | scanner.tradingview.com:121 | COT report hardcoded sudah dihapus (komentar baris 19) |
| news_macro.py | news.google.com, alternative.me, coingecko, 4 media ID/global | `data_source` = live/cached/fallback (402-443); last-resort hardcoded (390) |
| whale_tracker.py | api.whale-alert.io, mempool.space, api.binance.com, etherscan.io | curated hardcoded list dihapus (226-236) |
| broker_summary_fetcher.py | api.indexalpha.id (kuota gratis 5/hari) | **fallback SINTETIK** + `simulated_warning` (86-92, 225-238, 299) |
| foreign_flow_fetcher.py | api.goapi.io, api.indexalpha.id | fallback `"estimated"` (125-142) |

## 4. Jadwal nyata (dari git, bukan teori)

- `arena_247_engine.yml:20` → `cron: '0 0,6,12,18 * * *'`; durasi sesi `--duration-seconds 19500` (`→ 5j25m`), tick 60 s (baris 51). Commit arena nyata: 10-08 10:28Z, 04:15Z; 10-07 18:15Z, 10:18Z, 03:51Z → **~4×/hari, konsisten**.
- `hourly_crypto_macro.yml:6` → `cron: '0 * * * *'`; commit nyata 10-08 09:53Z, 02:26Z; 10-07 22:36Z, 17:14Z, 09:44Z, 02:01Z → **jarak 5–8 jam**. Job "hourly" tidak hourly.
- `hourly_crypto_macro.yml:17` → `cron: '30 22 * * *'` untuk US stocks/earnings (harian).
- Manual (`workflow_dispatch` saja, komentarnya sendiri menulis "Cron scheduled runs disabled"): `daily_idx_morning.yml:4`, `daily_idx_eod.yml:4`, `evening_global_watch.yml:4`, `intraday_idx_refresh.yml:4`, `midday_sesi1_recap.yml:4` → **BATCH-MANUAL**.

## 5. Gerbang provenance

- `vip_signal_router.py:37-38` mewajibkan `source` + `observed_at`; baris 235 menolak sinyal yang kehilangan kunci itu. Ada `NON_LIVE_STATES` untuk menandai synthetic/simulated/mock sebagai bukan LIVE.
- Kesimpulan: pengiriman sinyal VIP **ditolak**, bukan sekadar dilabeli — ini kontrol yang benar.

## 6. Rekomendasi

- **P0** — Perbaiki jadwal yang tidak jujur: ganti nama job "hourly" atau tambahkan pemantauan keberhasilan cron. Sekarang UI/klaim menyiratkan tiap jam, kenyataannya 5–8 jam.
- **P1** — Beri `schedule:` untuk `intraday_idx_refresh` bila IDX memang ingin intraday, atau tegaskan di UI bahwa IDX EOD bergantung trigger manual.
- **P1** — Kirim peringatan Telegram saat `broker_summary_fetcher` beralih ke `simulated` (sekarang hanya warning di objek).
