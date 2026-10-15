# BUILD WP6 — Kejujuran label: REALTIME IDX & jadwal Hourly (P2-2, P1-5)

Owner: lead · Tanggal: 2026-10-11 · Task: task-19

## Masalah

1. **P2-2** — `MasterQuantLeaderboard.jsx:524` menulis "SCANNER TRADINGVIEW REALTIME" dan `:673` "⚡ REALTIME QUANT STREAM". Padahal scanner IDX disegarkan oleh penjadwal adaptif **12 detik** (`useLivePrices.js:686`), bukan tick realtime.
2. **P1-5** — `FlowProcessTab.jsx:39` menulis "Jadwal jam (:00)" dan workflow mengklaim hourly (`0 * * * *`). Jeda commit terukur pada 2026-10-10 adalah 4,0 / 4,6 / 7,2 / 6,7 jam, karena GitHub Actions menunda jadwal di runner gratis.

## Perubahan

| File | Sebelum | Sesudah |
|---|---|---|
| `MasterQuantLeaderboard.jsx:522-526` | "SCANNER TRADINGVIEW REALTIME" | "SCANNER TRADINGVIEW · JEDA ~12 DETIK" + komentar alasan |
| `MasterQuantLeaderboard.jsx:671-673` | "⚡ REALTIME QUANT STREAM" | "⚡ LIVE STREAM · IDX JEDA ~12 DTK", title menyebut crypto ~1 detik dan IDX ~12 detik |
| `FlowProcessTab.jsx:39` | "Jadwal jam (:00)", status ok | "Cron tiap jam (:00), nyatanya 4-7 jam", status **warn**, detail memuat angka jeda terukur |
| `.github/workflows/hourly_crypto_macro.yml:5-6` | tanpa catatan | catatan tegas: cron diminta tiap jam, **tidak dijamin** tiap jam; jangan sebut "tiap jam" di UI |

Crypto **tetap** disebut realtime, karena memang begitu: WebSocket Binance (~1 detik). Yang diperbaiki hanya klaim untuk IDX.

## Tes

```
npx vitest run src/components/__tests__/   -> 16 files, 158 tests passed
npx vite build                              -> sukses
```

## Sisa risiko

- Belum diverifikasi di produksi.
- Angka jeda 4-7 jam berasal dari pengukuran 2026-10-10; kalau GitHub mengubah kebijakan, angkanya bisa bergeser. Yang penting label tidak lagi menjanjikan kepastian.
