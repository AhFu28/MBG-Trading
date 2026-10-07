# Design System — MBG Quant Terminal (Market Brain Grid)

> Category: Fintech & Trading Terminal
> SpaceX-class dark terminal · Bloomberg-grade density · single-accent discipline. Zero-cosmetic-noise, data-first, trust via precision.
> Status: TARGET brand contract (hasil audit OD · Critique 4 Okt 2026) — token nilai diambil dari `frontend/src/index.css` yang sudah ada; aturan baru memperbaiki drift yang ditemukan audit.

## 1. Visual Theme & Atmosphere

MBG adalah terminal intelijen quant — ruang kerja operator yang memvisualkan keputusan trading dalam detik. Kanvas hitam murni (`#000000`, "SpaceX-class") dengan panel hairline (`#0a0d12`) dan inset (`#0e1219`) menciptakan kedalaman tanpa dekorasi; hierarki dibangun dari ukuran type, weight, dan satu accent biru (`#4d8dff`) — bukan dari warna tambahan. Data adalah bintangnya: angka live, perubahan harga, dan status feed tampil dengan `tabular-nums` dan mono.

Bahasa visualnya "Bloomberg meets SpaceX": density tinggi yang tetap terbaca, hairline borders, tanpa glassmorphism, tanpa gradien dekoratif. Semua elemen ada untuk menginformasikan keputusan — bukan untuk hiasan. Momen memorable (bento HUD, DEFCON barometer, marquee benchmark, flash per-tick) dipertahankan karena melayani tesis terminal.

**Key Characteristics:**
- Pure black canvas + hairline panels — kedalaman dari kontras, bukan shadow tebal
- Single accent biru (`#4d8dff`) untuk aksi/interaksi; semantic green/red HANYA untuk data (naik/turun)
- JetBrains Mono + tabular-nums untuk semua angka
- Density Bloomberg: panel padat dengan tier jelas (label → angka → meta)
- Tanpa glassmorphism/gradien dekoratif di surface terminal
- Hairline borders (8–10% opacity) — bukan border tebal

## 2. Color Palette & Roles

### Primary / Accent
- **Accent Blue** (`#4d8dff` dark · `#1d4ed8` light): SATU-SATUNYA accent interaksi — link, CTA border/active, focus ring, ticker aktif. Dilarang menambah accent brand lain.
- **Accent Green** (`#2ee6a8` dark ~12:1 · `#0e9f6e` light): HANYA data positif (harga naik, status CONNECTED/VERIFIED)
- **Accent Red/Rust** (`#ff5c5c` dark ~6.4:1 · `#dc2626` light): HANYA data negatif (harga turun, error, SL)
- **Accent Gold/Amber** (`#ffb454` dark · `#d97706` light): HANYA warning/degraded/stale (status kuning, peringatan risiko)

### Surface & Background (dark / light)
- Canvas: `#000000` / `#f7f8fa`
- Panel: `#0a0d12` / `#ffffff`
- Inset (panel-subtle): `#0e1219` / `#f1f3f7`
- Panel-dark (overlay): `#05070a` / `#1e293b`

### Text
- Primary: `#f5f7fa` / `#0f172a`
- Secondary: `#aab3c0` / `#3d4756`
- Muted: `#7a8798` (~5.3:1) / `#5c6673`
- Inverse: `#000000` / `#ffffff`

### Border
- Hairline: `1px solid rgba(255,255,255,.08)` / `rgba(15,23,42,.10)`
- Muted: `1px solid rgba(255,255,255,.05)` / `rgba(15,23,42,.06)`
- **Dilarang memakai token yang tidak didefinisikan** — semua `var(--*)` wajib ada di `:root` (audit menemukan `--border-subtle`, `--accent-amber/cyan/purple/red`, `--bg-card`, `--bg-main`, `--color-bear/bull` dipakai tanpa definisi → border render currentColor).

### Dilarang
- Warna palette Tailwind hardcoded di JSX (`#38bdf8`, `#60a5fa`, `#34d399`, `#10b981`, `#f59e0b`, `rgba(59,130,246,*)`, `rgba(16,185,129,*)`) — migrasi ke `var(--accent-*)`.
- Gradient glassmorphism (`backdropFilter:blur(20px)` + gradient `rgba(17,24,39,.88)`) di surface terminal.
- Warna accent baru di luar blue/green/red/gold.

## 3. Typography Rules

### Font Family
- **UI/Sans:** Barlow, Plus Jakarta Sans, system-ui stack
- **Data/Mono:** JetBrains Mono, DM Mono, ui-monospace — semua angka wajib mono + `font-variant-numeric: tabular-nums`

### Hierarchy
| Role | Size | Weight | Notes |
|---|---|---|---|
| Display (hero stat) | 24–28px | 800–900 | Nilai utama (mis. portfolio valuation) |
| Heading (panel title) | 14–16px | 700–800 | Judul panel/kartu |
| Label | 12px | 700–800 | Uppercase + letter-spacing .04–.08em — ukuran MINIMUM |
| Body | 13–14px | 400–600 | Isi panel, deskripsi |
| Caption/meta | 12px | 400–500 | Timestamp, sumber, sub-label |
| Data cell | 12–14px mono | 600–800 | Angka tabel, harga, R:R |

**Aturan keras:**
- **Minimum 12px** — dilarang type di bawah 12px (audit menemukan 7px/7.5px/8px/8.5px/9px/9.5px/10px/10.5px — semuanya naik ke ≥12px).
- Uppercase + letter-spacing hanya untuk LABEL; dilarang pada body/prosa.
- Mono untuk angka, sans untuk teks — jangan mono untuk prosa.

## 4. Component Stylings

### Panel (telemetry-panel)
- Background: `var(--bg-panel)`; border: `var(--border-hairline)`; radius 4–6px; shadow `var(--shadow-sm)`
- Header panel: label 12px uppercase + badge status; konten: tier label → angka → meta
- Dilarang: gradient background inline, backdropFilter, radius >12px pada panel

### Button
- Primary: background `var(--accent-blue)` / text putih; radius 6px; padding ≥10px 16px; font 13–14px/700
- Secondary (telemetry-btn): background `var(--bg-panel-subtle)`; border hairline; text `var(--text-primary)`; font ≥12px
- **Touch target minimum 40×40px** (WCAG 2.2 target 24px minimum, 44px ideal) — dilarang tombol `padding:2px 7px` dengan font 7.5px
- Focus: `:focus-visible` ring 2px `var(--accent-blue)` + 2px offset — wajib ada global

### Status badge
- HANYA text-color semantic + border/background tint (green/red/gold); green BUKAN profit/verified — status terukur (VERIFIED/DEGRADED/STALE) dengan sumber waktu
- Kontras minimum 4.5:1 pada tint (pola yang sudah dipakai: `#166534` 6.3:1, `#be123c` 5.5:1, `#92400e` 6.7:1)

### Table (telemetry-table)
- Header: 12px uppercase muted, border-bottom hairline; sel: 12–14px mono tabular-nums, right-align untuk angka
- Row hover: `color-mix(in srgb, var(--text-primary) 3%, transparent)`
- `tableLayout: fixed` + `min-width:0` + overflow handling di container

### Ticker/wire (marquee)
- Flat, borderless, data bar — bukan dekorasi; animasi marquee wajib hormat `prefers-reduced-motion`

## 5. Layout Principles

### Spacing
Base 4px: 4 / 8 / 12 / 16 / 24 / 32 / 48. Gap antar-panel 6–10px; padding panel 8–16px; section margin 16–24px.

### Grid
- Home: full-page single-column stack (≈6 blok: wire → action bar → market bento → macro/risk → news full-width → execution matrix)
- Bento grid: `repeat(4, minmax(0,1fr))` desktop → 2 kolom ≤1200px → 1 kolom ≤768px
- Trio grid: `repeat(3, minmax(0,1fr))` → 1 kolom ≤1200px
- Split: konten `minmax(0,1fr)` + sidebar `minmax(280px, 350px)`; DILARANG flex-basis 0 + minHeight 0 di parent auto-height (sumber collapse bug — audit P-1)
- Breakpoints: **3 nilai saja** — 480 / 768 / 1200px (audit menemukan 7 nilai tersebar: 480/820/860/1024/1080/1100/1200)
- Tanpa `!important` untuk layout normal — media query ditulis dengan specificity benar

### Whitespace
Density tinggi tapi terbaca: whitespace sebagai tier separator, bukan dekorasi. Panel padat, antar-panel bernapas 6–10px.

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat | panel + hairline | Default |
| Raised | `var(--shadow-sm)` | Panel dengan konten aktif |
| Overlay | `var(--shadow-md/lg)` + backdrop gelap | Modal, drawer |
| Pulse | glow accent (hormat reduced-motion) | Status live/alert (DEFCON, WS connected) |

Dilarang: shadow tebal dekoratif, hover-lift besar, 3D, glassmorphism blur di surface terminal.

## 7. Do's and Don'ts

### Do
- Satu accent (`#4d8dff`) untuk semua interaksi; green/red HANYA data
- Angka: mono + tabular-nums + right-align
- Hairline + flat + density — trust dari presisi
- Status terukur dengan sumber waktu (VERIFIED/DEGRADED/STALE + timestamp)
- Token semantik untuk SEMUA warna — nol hardcoded hex di JSX
- Focus-visible + reduced-motion global

### Don't
- Type < 12px
- Touch target < 40px
- Token yang tidak didefinisikan
- Glassmorphism/gradien dekoratif di terminal
- Animasi tanpa reduced-motion fallback
- Breakpoint lebih dari 3 nilai
- `Math.random()` untuk data tampilan (Zero Simulation Policy)

## 8. Responsive Behavior

| Breakpoint | Perubahan |
|---|---|
| <480px | 1 kolom penuh; sidebar jadi drawer; tabel scroll lokal; touch target 44px |
| 480–768px | 2 kolom bento; sidebar collapsed 64px atau drawer |
| 768–1200px | Full layout; bento 2 kolom; trio 1 kolom; split konten+sidebar |
| >1200px | Full: bento 4 kolom, trio 3 kolom, split + sidebar 350px |

Tabel boleh scroll lokal; halaman TIDAK boleh overflow horizontal. Reflow diuji di 320 CSS px.

## 9. Agent Prompt Guide

### Quick Reference
- CTA/interaksi: `var(--accent-blue)` (#4d8dff dark / #1d4ed8 light)
- Naik: `var(--accent-green)`; Turun: `var(--accent-rust)`; Warning: `var(--accent-gold)`
- Panel: `var(--bg-panel)` + `var(--border-hairline)`; Inset: `var(--bg-panel-subtle)`
- Angka: `var(--font-mono)` + tabular-nums
- Type minimum 12px; label uppercase 12px/700 + tracking .04em

### Example Prompts
- "Buat panel telemetry: background var(--bg-panel), border var(--border-hairline), radius 6px, header label 12px uppercase muted + badge status, konten angka 14px mono tabular-nums"
- "Buat baris bento 4 kolom (gap 10px, minmax(0,1fr)), tiap kartu: label 12px uppercase, nilai 22px/800 mono, meta 12px muted"
- "Buat button telemetry-btn: bg var(--bg-panel-subtle), border hairline, font 12px/700, padding 8px 14px, focus-visible ring 2px var(--accent-blue)"

### Iteration Guide
1. Satu komponen per iterasi; referensi token by name
2. Warna: SELALU `var(--accent-*)`/`var(--bg-*)` — nol hex hardcoded
3. Angka = hero panel; jangan biarkan label lebih besar dari angka
4. Panel baru mengikuti tier: label → angka → meta
5. Setelah render: cek konsol tanpa token undefined; cek tinggi section tidak 0
