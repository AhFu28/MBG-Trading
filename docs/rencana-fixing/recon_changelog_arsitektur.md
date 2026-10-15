# Recon: Changelog & Arsitektur (Flow + Bisnis Proses)

Task: task-8 · Owner: recon-docs · Tanggal recon: 2026-10-10 · Root: `MBG-Trading`

**Jawaban singkat untuk Jendral Arib:** bagiannya SUDAH ADA dan SUDAH terisi, tapi (a) dikunci khusus admin sehingga menunya tidak dirender untuk user biasa, dan (b) **changelog-nya mandek di 30 September 2026**. Jadi bukan hilang — tidak kelihatan dan basi.

## 1. Kondisi saat ini (apa adanya + bukti path:line)

### 1a. Komponen ada & dirender
- Lazy import: `frontend/src/App.jsx:22` (FlowProcessTab), `frontend/src/App.jsx:24` (ChangelogTab).
- Render: FLOW_PROCESS `App.jsx:918` → `<FlowProcessTab />` `App.jsx:922`; CHANGELOG `App.jsx:948` → `<ChangelogTab />` `App.jsx:952`.
- Judul tab: `App.jsx:600` "⚡ Flow Process & System Architecture", `App.jsx:601` "📜 Changelog Update & Catatan Rilis".

### 1b. Gerbang admin: di nav DAN di render
- Tier ADMIN di `featureAccess.js:119` (`FLOW_PROCESS`) dan `:120` (`CHANGELOG`). Komentar di `:118`: *"Admin only (Perintah Jendral Arib: Flow Process & Changelog khusus admin)"*.
- `featureAccess.js:172-179` `canAccess()`: admin bypass absolut (`:173`), dan `if (required === TIER.ADMIN) return false` (`:177`) — jadi non-admin **selalu** ditolak, bahkan LEGEND.
- Nav: `CmcTopNav.jsx:100` `ADMIN_ONLY_IDS = new Set(['FLOW_PROCESS','CHANGELOG','ADMIN_APPROVAL'])`; menu hanya disuntik bila admin di `CmcTopNav.jsx:244-250` (FLOW_PROCESS `:247`, CHANGELOG `:248`). Non-admin → menu **tidak dirender sama sekali**.
- Render: `App.jsx:920` (FLOW_PROCESS) dan `App.jsx:950` (CHANGELOG) bercabang pada `isAdmin`; kalau bukan admin → layar kunci "Modul Khusus Internal Admin" (`App.jsx:924-946`, `App.jsx:954-961`). Ada juga gate generik di `App.jsx:748-749` (`requiredTierFor(activeTab) === TIER.ADMIN`).
- **Definisi `isAdmin`** — `App.jsx:248-250`:
  ```
  const isAdmin = isLocalDev ||
                  !!account?.isAdmin ||
                  ['naufalarib60@gmail.com','ahmfuadi28@gmail.com'].includes(...email...);
  ```
  dengan `isLocalDev` dari localhost/port 19388/localStorage `mbg_admin_access` (`App.jsx:242-245`).
  **Ini kunci jawabannya**: kalau Jendral melihat app dari domain produksi (`mbg-trading.pages.dev`), belum login, atau login dengan email di luar dua email itu → `isAdmin = false` → menu Changelog & Flow Process hilang dari nav.
- Test mengunci perilaku admin-only ini: `frontend/src/components/__tests__/CmcTopNav.test.jsx:107-108` (menu tidak boleh muncul) dan `frontend/src/services/__tests__/featureAccess.test.js:152-153` (tier PRO ditolak).

### 1c. Kebocoran rute lewat Command Palette (Ctrl+K)
- `frontend/src/components/CommandPaletteModal.jsx:50` mendaftarkan `{ id: 'CHANGELOG', label: 'Changelog & System History' ... }` di `systemTabs` — **tanpa gating**: grep `isAdmin|canAccess|requiredTierFor|adminOnly|ADMIN` di file itu = 0 hasil.
- Akibatnya user biasa bisa membuka lewat Ctrl+K lalu mendarat di layar kunci admin. FLOW_PROCESS **tidak** ada di palette → jalur masuk tidak konsisten.
- Jalur lain: `frontend/src/components/SignalsTab.jsx:135` → `onClick={() => onNavigateTab('CHANGELOG')}`.

### 1d. Isi FlowProcessTab — NYATA, bukan placeholder
- `FlowProcessTab.jsx` total 289 baris. Data 5 stage di `FlowProcessTab.jsx:24-77`: 1) MESIN LOKAL, 2) PIPELINE CLOUD, 3) GERBANG QA, 4) WEB (Cloudflare Pages), 5) YANG MASIH DIBUTUHKAN (aksi owner).
- Status per node `ok/blocked/removed/pending` (`:79-84`); zoom/pan native + klik detail (`:97-130`); SVG digambar **inline** di dalam komponen (`:202-254`).
- Klaim keusangan: "Facts are current to 2026-10-08" (`:14`).
- **Yang kosong/tidak ada:** peta masih hardcoded di komponen; `docs/ALUR_PROSES.svg` **tidak di-embed sebagai file** — hanya diklaim di teks UI (`:283`). Jadi komentar `:9` ("built FROM docs/ALUR_PROSES.svg") = rekonstruksi manual, bukan embed. Sinkronisasi dokumen ↔ UI harus manual.
- Tidak ada bagian "bisnis proses" (funnel, unit economics, siklus harian) — itu semua ada di `docs/audit_2026-10-02/06_BUSINESS_PROCESS.md` tapi tidak pernah masuk UI.

### 1e. Changelog — terisi, tapi mandek 10 hari
- Sumber: `frontend/src/data/changelogData.js:4` `CHANGELOG_DATA`.
- Entri terbaru index 0: id `pkg-30092026`, `v5.8.0`, date **"30 September 2026"**, status "LATEST" (`changelogData.js:6-11`).
- Semua tanggal di file (grep `"date":`): 30, 28, 27, 26, 25, 24, 23, 22, 21 (baris 10–279) Sep 2026, lalu 20 (379), 19 (453), 18 (527), 17 (607), 16 (711), "13-15" (827), 12 (857), 11 (903), 10 (957), "08-09" (1005).
- **Rentang 8 – 30 September 2026, 19 entri. Hari ini 10 Oktober 2026 → tidak ada satu pun entri Oktober.** Ini penyebab utama keluhan "changelog kok tidak ada ya?".
- Format entri: id, sprintLabel, version, semanticVersion, date, status, statusColor, badgeLabel, title, description, `processFlow[]` (step+label), `markdownContent` (dokumen rilis panjang) — `changelogData.js:5-38`.
- UI: "Terbaru: {CHANGELOG_DATA[0]?.date}" (`ChangelogTab.jsx:226`), jumlah "Tanggal" (`ChangelogTab.jsx:241`).
- **Temuan penting: ada changelog kedua di repo yang jauh lebih baru** — `CHANGELOG.md` root (108.860 byte, diubah 07-Oct-26, format enhanced Keep a Changelog, dikelompokkan kronologis). Dua sumber ini tidak terhubung dan berbeda tanggal terakhir.

### 1f. Materi arsitektur/bisnis proses di repo tapi tidak terhubung ke UI

| File | Ukuran | Terakhir diubah | Status |
|---|---|---|---|
| `docs/ALUR_PROSES.svg` | 9.3 KB | 07-Oct-26 | **Layak di-embed** — diagram pipeline 5-layer |
| `docs/ALUR_PROSES.png` | 136 KB | 07-Oct-26 | Layak — fallback raster |
| `docs/audit_2026-10-02/06_BUSINESS_PROCESS.md` | 10.5 KB | 03-Oct-26 | **Layak** — isi kaya: system context, daily cycle WIB, signal lifecycle, member journey & funnel, owner decision gates, timeline 4 minggu, unit economics, launch checklist + SOP harian |
| `docs/MASTERPLAN_MBG_UNIFIED_V3.md` | 73 KB | 03-Oct-26 | Terlalu besar untuk embed utuh; sumber link |
| `DESIGN.md` (root) | 11.1 KB | 08-Oct-26 | Ada — design system (bukan bisnis proses), bisa jadi tab Arsitektur |
| `CHANGELOG.md` (root) | 108.9 KB | 07-Oct-26 | Ada — sumber changelog yang lebih baru dari UI |
| `docs/archive/diagram_business_process.png` | 337 KB | 30-Sep-26 | Arsip/usang |
| `docs/archive/generate_business_process_diagrams.py` | 8.7 KB | 30-Sep-26 | Generator diagram, bisa dipakai ulang |

Semua ini **nol referensi dari frontend**: grep `.svg`/`ALUR_PROSES` di `frontend/src` hanya menemukan `FlowProcessTab.jsx:9` dan `:283` (teks komentar/UI), bukan embed sungguhan.

## 2. Akar masalah / kenapa begitu
1. **Bukan "tidak ada", tapi "khusus admin".** Keputusan sadar tercatat di `featureAccess.js:118`. Menu sengaja tidak dirender untuk non-admin (`CmcTopNav.jsx:244-250`) dan di-gate ulang saat render (`App.jsx:920,950`), plus dikunci test (`CmcTopNav.test.jsx:107-108`).
2. **`isAdmin` bergantung pada email hardcoded / localhost** (`App.jsx:248-250`). Buka dari produksi tanpa login dengan `naufalarib60@gmail.com` atau `ahmfuadi28@gmail.com` → menu hilang. Kemungkinan besar ini yang Jendral alami.
3. **Changelog mandek 30 September 2026** (`changelogData.js:10`), sementara `CHANGELOG.md` root sudah sampai 07-Okt dan git log aktif sampai 10-Okt. UI mengambil sumber yang salah / tidak disinkronkan.
4. **Jalur masuk tidak konsisten**: Ctrl+K menawarkan CHANGELOG ke siapa pun (`CommandPaletteModal.jsx:50`), Signals punya tombol ke CHANGELOG (`SignalsTab.jsx:135`), tapi FLOW_PROCESS tidak punya jalur sama sekali untuk non-admin. Hasilnya kadang "tidak ketemu", kadang "ketemu tapi dikunci".
5. **Tidak ada jembatan dokumen → UI.** FlowProcessTab menyalin isi `ALUR_PROSES.svg` secara manual ke kode (`:24-77`, `:202-254`), dan changelog disalin manual ke `changelogData.js`. Dua tempat yang harus di-update manual = pasti basi.

## 3. Opsi perbaikan + trade-off

**Opsi A — Turunkan tier / tampilkan sebagai locked teaser di nav.**
- Ubah `featureAccess.js:119-120`, hapus dari `CmcTopNav.jsx:100`.
- Trade-off: langsung terlihat; tapi melanggar perintah owner yang tercatat di kode, dan Flow Process memuat info sensitif (rotasi kredensial, `FlowProcessTab.jsx:73`) → tidak layak publik. Effort **S**.

**Opsi B — Tetap admin-only, rapikan jalur masuk & pesan kunci.**
- Tambah prop `isAdmin` ke `CommandPaletteModal` dan filter CHANGELOG (`CommandPaletteModal.jsx:50`); samakan perlakuan tombol Signals.
- Trade-off: konsisten & aman; tapi keluhan "arsitektur tidak ada" untuk user biasa tidak terjawab. Effort **S**.

**Opsi C — Pisah publik vs admin: halaman "Arsitektur & Cara Kerja" publik.**
- Tab baru tier GUEST/PRO yang meng-embed `docs/ALUR_PROSES.svg` + rangkuman `06_BUSINESS_PROCESS.md`; FLOW_PROCESS admin tetap untuk detail internal.
- Trade-off: paling menjawab keluhan, aman, sekaligus menghubungkan aset docs yang sudah ada; butuh sanitasi SVG + dua konten. Effort **M**.

**Opsi D — Auto-generate changelog dari git log / `CHANGELOG.md`.**
- Script Node membaca `git log` (atau parse `CHANGELOG.md` yang sudah 108 KB) → JSON untuk `ChangelogTab`.
- Trade-off: berhenti mandek; tapi format kaya `processFlow`/`markdownContent` sulit digenerate otomatis, dan commit message repo campur bahasa. Effort **M**.

## 4. Rekomendasi + estimasi effort

**Urutan: B (S) → C (M) → D (M).**

1. **(S) Kunci akses yang bocor + samakan jalur masuk.** Tambah prop `isAdmin` ke `CommandPaletteModal`, filter entri CHANGELOG untuk non-admin. File: `frontend/src/components/CommandPaletteModal.jsx` (+ pemanggil di `App.jsx`).
2. **(S) Jawab "kenapa tidak ada" dengan UI eksplisit.** Untuk non-admin, entah sembunyikan total (konsisten) atau tampilkan menu "Arsitektur" dengan layar kunci yang menjelaskan. File: `CmcTopNav.jsx`, `App.jsx:748-749`.
3. **(S) Segarkan changelog.** Tarik entri dari `CHANGELOG.md` root (07-Okt) — minimal tambah entri 1–10 Oktober 2026 dan turunkan badge "LATEST" di `changelogData.js:6-11`. File: `frontend/src/data/changelogData.js`.
4. **(M) Halaman arsitektur/bisnis proses publik.** Tab baru yang meng-embed `docs/ALUR_PROSES.svg` + ringkasan `docs/audit_2026-10-02/06_BUSINESS_PROCESS.md` (funnel, siklus harian, unit economics). File: komponen baru, `App.jsx`, `featureAccess.js`, `CmcTopNav.jsx`.
5. **(M) Auto-generate changelog.** Script generator + fallback `changelogData.js`. File: script baru di `scripts/`, `package.json`.
6. **(S) Sinkronkan FlowProcessTab** ke fakta terkini (masih klaim 2026-10-08 di `:14`).

## 5. Risiko & hal yang bisa rusak
- **Mengubah tier/`ADMIN_ONLY_IDS` memecahkan test yang ada**: `CmcTopNav.test.jsx:107-108` dan `featureAccess.test.js:152-153` mengunci perilaku admin-only — kalau komponen diubah tanpa test, CI merah.
- **Flow Process memuat info sensitif**: `FlowProcessTab.jsx:73` menyebut rotasi kredensial & kunci yang pernah ter-commit. Membukanya = membocorkan peta kelemahan.
- **Embed SVG**: wajib sanitasi; komentar `FlowProcessTab.jsx:16` menyatakan nama personal sengaja dikeluarkan dari permukaan app.
- **Auto-generate changelog**: commit message campur (hash + ID/EN) → hasil bisa lebih jelek dari manual; `changelogData.js` saat ini punya narasi kurasi manusia.
- **`isAdmin` berbasis email hardcoded** (`App.jsx:250`) gampang bocor/rapuh: menambah admin = edit kode + deploy; dan kalau akun itu diambil alih, bypass-nya absolut (`featureAccess.js:173`).
- **Dua changelog** (`CHANGELOG.md` root vs `changelogData.js`) berisiko makin berbeda kalau tidak dipilih satu sumber kebenaran.

## 6. Belum dicek
- Isi lengkap `CHANGELOG.md` root sampai tanggal berapa persisnya (baru dibaca 12 baris pertama; ukuran 108 KB).
- Apakah `SignalsTab.jsx:135` tombolnya di-gate atau bebas diklik non-admin (baru lihat baris pemanggil).
- Isi lengkap `06_BUSINESS_PROCESS.md` dan `MASTERPLAN_MBG_UNIFIED_V3.md` (baru heading & metadata).
- Apakah ada mekanisme lain yang menyuntik tab FLOW_PROCESS (mis. deep-link `?tab=FLOW_PROCESS`) — belum ditelusuri.
- Cara `account.isAdmin` diisi dari server (Supabase/edge) — belum ditelusuri.
- Apakah `LandingPage.jsx:21,36` menampilkan kartu CHANGELOG/FLOW_PROCESS ke tamu (label ada, perilaku klik belum dicek).
