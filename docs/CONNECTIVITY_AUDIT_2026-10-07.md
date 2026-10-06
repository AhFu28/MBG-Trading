# Connectivity Audit v2 — 2026-10-07

**Status:** Refresh dari [connectivity audit v1](../../.tmp-audit/connectivity-audit.md) (7 Okt, pra-pull) setelah 60 commit kolaborator + 4 commit sinkronisasi/fix.
**Basis:** `main @ 5d5db26` — semua klaim dicek langsung ke source di snapshot ini.

## Ringkasan

| Section | Status v2 | Catatan |
|---|---|---|
| Charting Desk | **CONNECTED** (dulu **BROKEN**) | CSP fix `8631231`: `script-src` +s3.tradingview.com, `frame-src` +s +www — widget & iframe tidak diblokir lagi |
| Semua endpoint `/api/*` lokal | CONNECTED | Semua dipanggil frontend punya handler produksi, kecuali `/api/dev-bundle` (dev-only by design ✓ — produksi pakai `/api/research-archive` yang ADA) |
| `/api/ea` | DEGRADED | Masih placeholder-200 kecuali env `MT5_EA_SOURCE` (sekarang bisa baca kunci Supabase — sedikit lebih baik). EA riil ada di `engine/mt5/` → fix di P-2 |
| AI Agent Arena | CONNECTED* | Dua writer masih ada (`arena_evaluator.py` + `arena_runner_247.py`) → P-2. Merge state hf.space punya rantai fallback ✓ (fallback endpoint, bukan crash) |
| News | CONNECTED* | FE-14 ditemukan titik pastinya: toast sukses tampil tanpa syarat meski fetch gagal → **fix di commit P-5 (7 Okt ini)**; freshness kini terhitung dari `timestamp_ms` item |
| Live prices | CONNECTED | `/api/scanner` + fallback TradingView langsung + Binance WS/REST (URL absolut `api.binance.com` — bukan endpoint lokal) |
| Account & langganan | CONNECTED | `/api/account/{login,logout,me,signup}` + `_supabaseProject` ada, ada tests. ⚠ Schema Supabase belum dijalankan (owner action — Plan V3 N-1) |
| Tokocrypto / pumpfun | CONNECTED | Proxy catch-all `tokocrypto/[[path]].js`, `pumpfun/[[path]].js` ✓ |
| Telegram | CONNECTED | `telegram-webhook.js` ✓ |

## Endpoint lokal dipanggil frontend vs handler

| Dipanggil | Handler | Status |
|---|---|---|
| `/api/auth` (7×) | `auth.js` | ✓ |
| `/api/data` (6×) | `data.js` | ✓ (header jujur X-Data-Source/X-Data-Age-Hours) |
| `/api/account/me` (4×), `signup` (4×), `logout` (3×), `login` (2×) | `account/*.js` | ✓ |
| `/api/arena-state` (4×) | `arena-state.js` | ✓ |
| `/api/dev-bundle` (7×) | — (vite dev plugin) | ✓ dev-only by design; produksi pakai `/api/research-archive` |
| `/api/scanner` (3×) | `scanner.js` | ✓ |
| `/api/research-archive` (2×) | `research-archive.js` | ✓ |
| `/api/pumpfun/` (2×) | `pumpfun/[[path]].js` | ✓ |
| `/api/_supabaseProject`, `/api/telegram-webhook`, `/api/tokocrypto/...` | ada | ✓ |
| `https://ahfu28-mbg-trading-arena.hf.space/api/arena/state` | HF daemon (bukan lokal) | ✓ rantai fallback di klien |
| `/api/v3/*`, `/api/v4/futures/*`, `/api/depth/`, `/api/mempool/recent`, `/api/v1/ws` | URL absolut (Binance/HF), bukan endpoint lokal | ✓ di luar cakupan lokal |

## Yang masih terbuka (urutan Plan V3)

1. **Session forgery** — JWT_SECRET belum di-set di Cloudflare (owner action, N-1).
2. **VIP bundle bocor** via repo publik (owner action, N-1).
3. **Supabase schema** belum dijalankan — pelanggan belum bisa daftar (owner action, N-1).
4. **/api/ea placeholder** + dua writer arena (P-2).
5. **PII nomor telepon** di 15+ tempat repo publik (N-1 keputusan owner).
