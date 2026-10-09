# 05 — Matriks Staleness Empiris (terukur)

> t0 pengukuran ulang: **2026-10-09T06:08:35+07:00**. Usia = t0 - LastWriteTime (jam).
> PENTING: mtime file cache = waktu commit/pull, **bukan** waktu produksi data. Kolom "Timestamp internal" adalah sumber kebenaran.

## 1. Usia file cache (terukur)

| File | Usia (jam) | Timestamp internal | Verdict |
|---|---|---|---|
| latest_cockpit_bundle.json | ~0,3 | `last_updated = 2026-10-08T22:48Z` (05:48 WIB) | **PERIODIK-JADWAL** (sehat saat ini) |
| latest_arena_state.json | ~4,7 | `last_evaluated = 2026-10-08T18:24Z` (01:24 WIB) | **PERIODIK-JADWAL** (wajar) |
| daily_trade_plans.json | 48,4 | - | **STALE** (2 hari) |
| idx_categorized.json | 48,4 | - | **STALE** (2 hari) |
| arena_state.json | 48,4 | `last_evaluated = 2026-10-05T07:43Z` | **STATIS/ARSIP** (isi 4 hari lebih tua dari mtime) |
| arena_state_ARCHIVE_...json | 48,4 | - | **STATIS (arsip)** |
| macro_telemetry.json | 205,7 | `updated_at = 2026-09-27T14:26Z` | **MATI** (~8,6 hari; isi ~11,6 hari) |
| crypto_spot_10.json | 205,7 | - | **MATI** (~8,6 hari) |
| research_archive.json | 205,7 | - | **MATI** (~8,6 hari) |
| paper_portfolio.json | 205,7 | - | **MATI** (~8,6 hari) |
| last_known_macro.json | 205,7 | - | **MATI** (~8,6 hari) |

## 2. Cadence NYATA dari git (bukan teori cron)

### Job "hourly_crypto_macro" — diklaim tiap jam
| Tanggal (UTC) | Jam commit | Jarak dari sebelumnya |
|---|---|---|
| 2026-10-08 | 22:48 | 5,6 j |
| 2026-10-08 | 17:11 | 7,3 j |
| 2026-10-08 | 09:53 | 7,4 j |
| 2026-10-08 | 02:26 | 3,7 j |
| 2026-10-07 | 22:36 | 4,9 j |
| 2026-10-07 | 17:14 | 7,5 j |

**Rata-rata jeda ~6 jam.** Job "hourly" berjalan 3-4 kali sehari.
Ket. tambahan: `us_stocks` muncul terpisah pada 02:13Z (10-08), 01:46Z (10-07), 08:38Z (10-06) -> sekitar harian, sesuai cron `30 22 * * *`.

### Job "arena_247_engine" — diklaim 4 sesi/hari (00/06/12/18 UTC)
| Tanggal (UTC) | Jam commit |
|---|---|
| 2026-10-08 | 18:24, 10:28, 04:15 |
| 2026-10-07 | 18:15, 10:18, 03:51 |
| 2026-10-06 | 18:21, 10:49 |
| 2026-10-05 | 07:01, 01:13 |

**3-4×/hari** - sesuai desain (sesi 5j25m, state di-commit di akhir sesi).

### Workflow manual (tidak punya `schedule:`)
`daily_idx_morning`, `daily_idx_eod`, `evening_global_watch`, `intraday_idx_refresh`, `midday_sesi1_recap` -> **BATCH-MANUAL**. Efek terlihat: `idx_categorized.json`, `daily_trade_plans.json`, `arena_state.json` (versi lama) berhenti di 2026-10-07 05:43.

## 3. Ringkasan verdict

| Verdict | Jumlah | Item |
|---|---|---|
| Sehat / sesuai jadwal | 2 | latest_cockpit_bundle, latest_arena_state |
| STALE (2 hari) | 2 | daily_trade_plans, idx_categorized |
| STATIS/arsip | 2 | arena_state, arena_state_ARCHIVE |
| MATI (>8 hari) | 5 | macro_telemetry, crypto_spot_10, research_archive, paper_portfolio, last_known_macro |

**11 file cache: hanya 2 yang sehat.** 7 di antaranya berhenti tersentuh >= 2 hari.

## 4. Catatan reliabilitas pengukuran

- Repo aktif berubah selama audit (file berubah mtime 2026-10-08 20:08 dan 2026-10-09 00:00). Angka di atas adalah snapshot pada t0 dan bisa berubah.
- Jangan menyimpulkan staleness dari mtime saja (lihat bagian 1 dan 03 laporan).
- Ketiadaan `schedule:` diverifikasi langsung di file workflow: arena_247_engine.yml:17 dan hourly_crypto_macro.yml:4.
