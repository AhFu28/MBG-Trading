# Cek lanjutan: Dokumen, Changelog & Jalur Akses (task-9)

Root: `MBG-Trading` · Owner: recon-docs · Tanggal: 2026-10-10

---

## Q1. Isi lengkap `CHANGELOG.md` root — tanggal terakhir, jumlah entri, format, 3 entri terakhir, layak jadi sumber?

**Jawaban:** Entri terakhir (paling baru) = **2026-10-06**. Total **33 entri**. File **967 baris**. Format: **enhanced Keep a Changelog**, urutan **terbalik (terbaru di atas)**, heading `## [YYYY-MM-DD] — Judul`, isi bullet dengan tag kategori institusional tebal.

**3 entri terbaru (paling atas):**
1. `CHANGELOG.md:17` — `## [2026-10-06] — Forex & Emas Dipulihkan: XAU Ora Ana Blas + Ora Tau Di-refresh`
2. `CHANGELOG.md:58` — `## [2026-10-06] — 24H Change Diperbaiki + Panel "Uang Sedang Ke Mana"`
3. `CHANGELOG.md:84` — `## [2026-10-06] — Crypto Futures: Data Basi 10 Hari Dipulihkan + Fokus Futures Murni`

**3 entri tertua (paling bawah):** `CHANGELOG.md:948` [2026-09-11], `:955` [2026-09-10], `:962` [2026-09-08 to 2026-09-09].

**5 entri bertanggal 2026-10-06** (baris 17, 58, 84, 117, 138). Tanggal unik lain: 10-05 (×3: :155, :192, :272), 10-02 (×6: :329–:477), 09-30 (:508), dst.

**Format** (bukti `CHANGELOG.md:1-12`): heading menyebut "enhanced Keep a Changelog", tag kategori `[COCKPIT UI/UX]`, `[MACRO & RISK DESK]`, `[BANDARMOLOGY & ORDER FLOW]`, `[QUANT & AGENTIC ENGINES]`, `[DEFENSE & GEOPOLITICAL HUD]`, `[RESEARCH & NEWS]`.

**Layak jadi sumber menyegarkan `changelogData.js`? YA, tapi butuh adapter.** Alasan:
- `CHANGELOG.md` berhenti di 2026-10-06, sedangkan UI berhenti di **30 September 2026** (`frontend/src/data/changelogData.js:10`). Ada **6 hari & ~10 entri** (02-Okt ×6, 05-Okt ×3, 06-Okt ×5) yang tidak pernah masuk UI.
- Bukti kesinambungan: entri UI terbaru (`pkg-30092026`, v5.8.0) punya padanan di `CHANGELOG.md:508` ([2026-09-30] Security Hardening, Honest Data Labeling & Institutional Paper Broker v2) — dua sumber melacak sejarah yang sama, UI-nya berhenti lebih awal.
- **Caveat format:** `CHANGELOG.md` hanya punya *tanggal + judul + bullet*. UI butuh field terstruktur: `id, sprintLabel, version, semanticVersion, status, statusColor, badgeLabel, title, description, processFlow[], markdownContent` (`changelogData.js:5-38`). Tidak ada `semanticVersion`/`processFlow`/status LATEST di `CHANGELOG.md` → perlu script konversi + isian kurasi manusia. Jadi `CHANGELOG.md` = sumber tanggal/isi, bukan sumber format.
- Catatan: `CHANGELOG.md` sendiri **tidak lebih baru dari git log** (commit 2026-10-10 di `git log`), dan `CHANGELOG.md` berhenti 1 hari setelah file terakhir diubah (07-Okt).

**Bukti:** `CHANGELOG.md:1-12, 17, 58, 84, 117, 138, 508, 948, 955, 962`; perintah `Get-Content CHANGELOG.md | Select-String '^## \['` → ENTRY COUNT: 33; `(Get-Content CHANGELOG.md).Count` → 967.

---

## Q2. `SignalsTab.jsx:135` — tombol di-gate atau bebas diklik non-admin?

**Jawaban: BEBAS untuk semua non-VIP (GUEST, FREE, PRO). Tombol ini BUG — CTA "pilih paket" justru melempar user ke tab admin-only.**

- Kondisi render hanya `{tier !== TIERS.VIP && (...)}` → `SignalsTab.jsx:115`. Tidak ada cek `isAdmin`, tidak ada `canAccess`, tidak ada role.
- Handler: `onClick={() => onNavigateTab && onNavigateTab('CHANGELOG')}` → `SignalsTab.jsx:135`.
- Label tombol: "**Lihat Paket VIP**" → `SignalsTab.jsx:141-142`, di dalam kotak header "👑 Upgrade ke VIP Pro" (`:120-121`).
- Tujuan klik salah tab: seharusnya `SUBSCRIPTION` (halaman langganan), tapi diarahkan ke `CHANGELOG` yang **admin-only** (`featureAccess.js:120`). Akibatnya non-admin mendarat di layar kunci "Modul Khusus Administrator" (`App.jsx:748-756`).
- **Bukti:** `frontend/src/components/SignalsTab.jsx:115, 120-121, 134-143`; `frontend/src/services/featureAccess.js:120`; `frontend/src/App.jsx:748-749, 756`.

---

## Q3. `docs/audit_2026-10-02/06_BUSINESS_PROCESS.md` — struktur & nilai yang bisa dipakai tab Arsitektur publik

**Struktur (211 baris, 8 bagian) — bukti heading:** `06_BUSINESS_PROCESS.md:1` judul, `:9` §1 System context, `:54` §2 Daily operating cycle (WIB), `:86` §3 Signal lifecycle, `:103` §4 Member journey & funnel, `:125` §5 Owner decision gates, `:143` §6 4-week M0 timeline (gantt), `:168` §7 Unit economics, `:193` §8 Launch checklist + daily SOP (`:195`, `:206`).

**Kontennya diagram Mermaid, bukan prosa:** §1 flowchart LR (Data sources → Engine → Storage → Surfaces), §2 sequenceDiagram (07:15 morning brief, 5-menit arena, hourly crypto/macro, 12:15 recap, 18:30 evening watch), §3 stateDiagram signal lifecycle (Generated → ProvenanceGated → DryRun/Dispatched/Blocked/LabelledSynthetic), §4 flowchart funnel visitor→free→VIP→payment→grant→active→churn/winback, §5 flowchart owner decision gates D-1/D-3/D-5/D-6/D-4, §6 gantt M0 4 pekan.

**Nilai yang LAYAK untuk tab Arsitektur publik (setelah disanitasi):**
- §1 system context — arsitektur data→engine→storage→permukaan. Bagus, tapi **wajib hapus** node `PUB[frontend/public/data - PUBLIC = TRUST04 leak S2]` dan catatan `supabase_client.py:36-51` (`06_BUSINESS_PROCESS.md:26` untuk node, `:52` untuk legend).
- §2 daily operating cycle — menunjukkan produk hidup 24/7, aman untuk publik.
- §3 signal lifecycle — menjelaskan kenapa sinyal bisa "blocked"/"synthetic", bagus untuk kepercayaan & edukasi.

**Nilai yang JANGAN dipublikasikan (internal):**
- §4 funnel + §5 owner gates + §7 unit economics: harga founding Rp150.000/bln, LTV Rp1.000.000, churn 20%, infra US$30/mo, strategi refund 7 hari, cap 30-50 member (`06_BUSINESS_PROCESS.md:168-192`). §5 juga menyebut opsi legal/ilegal IDX (`:129`, `:131`) dan "premium JSON public" (`:140`).
- §8 checklist launch (`:195-211`) — operasional owner.

**Bukti:** `06_BUSINESS_PROCESS.md:9, 54, 86, 103, 125, 143, 168, 183, 193, 195, 206`; isi §1–§8 dibaca langsung.

---

## Q4. `docs/MASTERPLAN_MBG_UNIFIED_V3.md` — struktur; mana usang vs relevan

**Struktur (73 KB, dari heading):** §0 Document control + aturan bukti; §1 Keputusan konsolidasi (dua horizon); §2 Ground truth; §3 Definisi produk (ICP, value prop, disposition fitur, tier, kuota); §4 Rencana terpadu M0 4 pekan → W0–W5; §5 Workstream keamanan & kepercayaan; §6 Integrasi desain UI/UX v4; §7 Arsitektur & kontrak data; §8 Mesin pendapatan; §9 Acceptance/monitoring/gate rilis.

**USANG / sudah ditandai sendiri sebagai belum benar:**
- `MASTERPLAN_MBG_UNIFIED_V3.md:145` — `### 3.4 Tier (target, bukan migrasi yang sudah terjadi)`.
- `:328` — `### 5.4 Rencana migrasi TRUST04 ... — belum dikerjakan, jangan diklaim selesai`.
- `:352` — tabel polish `index.css` berlabel "**TERLIHAT, sebagian disuperseded** oleh pass v4".
- Koreksi Supabase Auth: baris SHIP NOW menyebut Supabase Auth sebagai target, bukan implementasi; gate nyata = Cloudflare Pages Function `functions/api/auth.js` (`:142-143`). **Kalau ini tercermin di tab Arsitektur, jangan tulis "Supabase Auth sudah jalan".**
- `:165-171` §3.5 menegaskan angka kuota (Rp199.000 vs Rp249.000) adalah **hipotesis desain, bukan tarif final**; tarif riil = D-3 Rp150rb/bln founding.

**MASIH RELEVAN:**
- §0.3 Aturan bukti + §5.2 Kebijakan akses (mengikat) + §7 kontrak data + §9 gate rilis/acceptance.
- §6.2 prinsip desain v4 (mengikat untuk W2).
- §3.3 disposition fitur: 20 SHIP NOW / 14 DEFER / 4 DROP (`:127-131`) — ini yang paling berguna untuk *membedakan mana yang memang ada vs janji*.

**Bukti:** `MASTERPLAN_MBG_UNIFIED_V3.md:127-131, 142-143, 145, 165-171, 328, 352`; daftar heading dibaca via `Select-String '^#{1,3} '`.

**Catatan konflik yang harus dijaga:** harga di MASTERPLAN (Rp199rb/249rb, `:165-171`) ≠ harga di 06_BUSINESS_PROCESS (Rp150rb founding, FACT). Jangan campur di satu halaman publik.

---

## Q5. Ada mekanisme lain yang menyuntik tab FLOW_PROCESS?

**Jawaban: YA — satu-satunya mekanisme "suntik" adalah deep-link URL, dan ia TIDAK bisa bypass kunci. Tapi ada satu bypass admin via localStorage yang perlu diperhatikan.**

1. **Deep-link (ADA, tidak bypass):** `App.jsx:71-80` `getTabFromHash()` — hash menang atas query string; `?tab=` dihormati bila tak ada hash (`:74-78`). Nilainya dipakai sebagai state awal `App.jsx:81` `useState(getTabFromHash)`, dan `setActiveTab` menulis hash (`:83-86`). Jadi `https://mbg-trading.pages.dev/?tab=FLOW_PROCESS` (atau `#flow_process`) **membuat activeTab = FLOW_PROCESS untuk siapa pun**. Tapi render tetap dikunci: gate global `App.jsx:748-749` dan cek `isAdmin` di `App.jsx:920` → user biasa tetap melihat layar kunci. Tidak ada validasi allowlist tab di `getTabFromHash`.
2. **localStorage (ADA, BYPASS):** `App.jsx:237-246` `isLocalDev` bernilai true bila hostname localhost/127.0.0.1/10.*/192.168.*, port 5173/19387/19388, **atau `localStorage.getItem('mbg_admin_access') === 'true'`** (`:245`). Karena `isAdmin = isLocalDev || ...` (`App.jsx:248`), siapa pun yang bisa menjalankan `localStorage.setItem('mbg_admin_access','true')` di browser sendiri akan mendapat `isAdmin = true` → menu Flow Process & Changelog **muncul**. Ini gate sisi klien, bukan boundary keamanan (konsisten dengan catatan `featureAccess.js:14-18`), tapi pastikan endpoint di baliknya memang menolak server-side.
3. **CommandPaletteModal:** hanya `CHANGELOG` (`CommandPaletteModal.jsx:50`), **FLOW_PROCESS tidak terdaftar**. Gating: tidak ada sama sekali di file itu.
4. **SignalsTab:** hanya `CHANGELOG` (`SignalsTab.jsx:135`).
5. **CmcTopNav:** FLOW_PROCESS hanya muncul lewat `adminExtras` bila `isAdmin` (`CmcTopNav.jsx:244-249`).
6. **Grep menyeluruh `FLOW_PROCESS` di `frontend/src`** hanya menemukan: `App.jsx:22,600,918`, `featureAccess.js:40,119`, `CmcTopNav.jsx:100,247`, `tests/CmcTopNav.test.jsx:107`, `tests/featureAccess.test.js:152`, `LandingPage.jsx:36`. **Tidak ada tombol/route lain.** Jadi tidak ada jalur tersembunyi lain.

**Bukti:** `App.jsx:71-81, 83-86, 237-250, 748-749, 920`; `CmcTopNav.jsx:100, 244-249`; `CommandPaletteModal.jsx:50`; `SignalsTab.jsx:135`.

---

## Q6. Bagaimana `account.isAdmin` diisi dari server?

**Jawaban: BUKAN kolom Supabase. Ini allowlist email hardcoded di Cloudflare Pages Function, dihitung server-side lalu dikirim sebagai field `isAdmin`.**

- Sumber kebenaran: `frontend/functions/api/account/_shared.js:299-307`:
  ```
  export const ADMIN_EMAILS = ['naufalarib60@gmail.com','ahmfuadi28@gmail.com'];
  export function isAdmin(email) { ... return ADMIN_EMAILS.includes(String(email).trim().toLowerCase()); }
  ```
- Ditempel ke respons profil: `_shared.js:194` `isAdmin: isAdmin(profile.email)`.
- Profil diambil dari **Supabase tabel `profiles`**, kolom `id, email, display_name, tier, expires_at` → `_shared.js:147` (`/rest/v1/profiles?select=id,email,display_name,tier,expires_at&limit=1`). **Tidak ada kolom `is_admin`/`role`** yang dibaca.
- Endpoint klien: `/api/account/me` → `accountClient.js:48` `call('/me')`; field dipetakan di `accountClient.js:59` `isAdmin: !!body?.isAdmin` (klien mempercayai server).
- Route admin juga memverifikasi server-side, bukan hanya UI: `functions/api/account/admin/approve.js:24` `if (!session?.email || !isAdmin(session.email)) ...` — sama di `reject.js:24` dan `requests.js:24`.
- **Fallback ganda di klien:** `App.jsx:248-250` juga menerima `isLocalDev` dan **mengulang daftar email yang sama hardcoded**. Jadi allowlist ada di dua tempat (edge + frontend) → menambah admin = ubah dua file + deploy.

**Implikasi untuk keluhan Jendral Arib:** kalau login bukan dengan salah satu dari dua email itu (atau email berbeda huruf besar/kecil — sudah di-lowercase, aman), `isAdmin = false` → menu Changelog & Flow Process tidak dirender.

**Bukti:** `frontend/functions/api/account/_shared.js:147, 194, 299-307`; `frontend/functions/api/account/admin/approve.js:24`; `frontend/src/services/accountClient.js:48, 59`; `frontend/src/App.jsx:248-250`.

---

## Q7. `LandingPage.jsx:21` & `:36` — kartu CHANGELOG/FLOW_PROCESS ke tamu? Kalau diklik?

**Jawaban: DITAMPILKAN ke tamu, salah label "GRATIS", dan tidak bisa diklik sama sekali.**

- `LandingPage.jsx:21` dan `:36` adalah entri peta label `MODULE_LABEL`: `CHANGELOG: 'Changelog Sistem'` (`:21`), `FLOW_PROCESS: 'Flow Process Blueprint'` (`:36`).
- Kartu dirender dari iterasi **seluruh** `MODULE_TIER`: `LandingPage.jsx:725` `Object.entries(MODULE_TIER).map(...)`, label di `:750` `{MODULE_LABEL[id] || id}`. Karena `CHANGELOG` dan `FLOW_PROCESS` ada di `MODULE_TIER` (`featureAccess.js:119-120`), **keduanya tampil sebagai kartu di landing publik**.
- **Bug label:** badge hanya tahu tiga cabang — PRO (`:726, 728`), GUEST (`:727, 730`), sisanya **"GRATIS"** (`:732`). Modul tier **ADMIN** (CHANGELOG, FLOW_PROCESS, ADMIN_APPROVAL) dan **LEGEND** (TRADING_BOT, JEV_EXECUTION) jatuh ke `else` → dilabeli **"GRATIS"** padahal terkunci. Ini klaim keliru yang dilihat tamu.
- **Klik tidak melakukan apa pun:** kartu adalah `<div>` murni (`LandingPage.jsx:736-747`) **tanpa `onClick`**. Dan `LandingPage` tidak menerima prop navigasi: `LandingPage.jsx:289` `export default function LandingPage({ onAuthenticated, configured = true })` — **tidak ada `onNavigateTab`**. Grep `onNavigate` di file itu = 0 hasil.
- Jadi: tamu melihat "Changelog Sistem" & "Flow Process Blueprint" berlabel GRATIS, mencoba klik, tidak terjadi apa-apa. Tidak ada handler untuk mengarahkan ke layar kunci/paket.

**Bukti:** `frontend/src/components/LandingPage.jsx:17-37, 289, 725-768`; `frontend/src/services/featureAccess.js:119-120`.

---

## Kesimpulan yang mengubah rencana

1. **Changelog UI bukan cuma basi — ada sumber resmi yang 6 hari lebih baru.** Rencana "tulis manual entri Oktober" diganti: **konversi `CHANGELOG.md` (33 entri, s/d 2026-10-06) → `changelogData.js`** via adapter, lalu jaga dengan generator. Ini menghapus 10 entri yang hilang sekaligus.
2. **Ada bug user-facing di SignalsTab, bukan sekadar temuan admin-only.** CTA "Lihat Paket VIP" (`SignalsTab.jsx:141-142`) melempar ke CHANGELOG admin-only (`:135`) → semua non-VIP kena layar kunci. Perbaikan 1 baris: arahkan ke `SUBSCRIPTION`. Prioritas naik.
3. **LandingPage memberi informasi keliru ke tamu.** CHANGELOG + FLOW_PROCESS (+ LEGEND modules) tampil berlabel "GRATIS" (`LandingPage.jsx:732`) dan kartunya mati (tidak ada `onClick`/`onNavigateTab`). Rencana "sembunyikan atau tampilkan sebagai locked teaser" harus mencakup perbaikan badge untuk tier ADMIN & LEGEND, bukan hanya menyembunyikan.
4. **Gate `isAdmin` bisa dilewati dari browser** lewat `localStorage.mbg_admin_access` (`App.jsx:245`). Untuk rencana keamanan: jangan pernah menaruh rahasia di tab Flow Process; pastikan data sensitif tetap di endpoint ber-otorisasi server (`approve.js:24` polanya sudah benar).
5. **Untuk tab Arsitektur publik, pakai `06_BUSINESS_PROCESS.md` §1–§3 saja** (system context, daily cycle, signal lifecycle), sanitasi node TRUST04 leak. §4/§5/§7 (harga, LTV, churn, gate keputusan owner) tetap internal.
6. **`MASTERPLAN_MBG_UNIFIED_V3.md` jangan dikutip mentah.** Bagian §3.4, §3.5, §5.4 sudah menandai dirinya target/belum dikerjakan, dan klaim Supabase Auth sudah dikoreksi di dalam dokumen itu sendiri (`:142-143`). Pakai sebagai sumber arah, bukan status.
7. **Allowlist admin ada di dua tempat** (`_shared.js:299-302` dan `App.jsx:250`) — setiap perubahan admin butuh dua edit; usulan: ambil dari satu sumber (edge) dan buang fallback klien.

## Masih belum dicek

- Verifikasi langsung di produksi (`https://mbg-trading.pages.dev/?tab=FLOW_PROCESS`) dengan browser/Playwright — **BELUM DICEK**, alasan: tidak dijalankan di sesi ini (menghindari `npx playwright install` yang lama); bukti yang diberikan murni dari pembacaan kode.
- Apakah `mbg_admin_access` di `localStorage` pernah di-set oleh aplikasi sendiri (bukan hanya dibaca) — belum ditelusuri pemasangnya. **BELUM DICEK**, alasan: belum digrep khusus `setItem`.
- Isi lengkap `CHANGELOG.md` baris 1–16 sudah dibaca (header + format), tetapi 33 body entri tidak dibaca satu per satu; yang diverifikasi hanya heading, tanggal, dan 3 entri teratas + 3 terbawah. **BELUM DICEK** — alasan: time-box.
- Isi lengkap `MASTERPLAN_MBG_UNIFIED_V3.md` (73 KB) — baru sebagian (§3, §5.4, sumber); bagian §4 rencana W0–W5 dan §9 acceptance belum dibaca penuh. **BELUM DICEK** — alasan: time-box.
- Apakah `accountClient.js` memetakan `displayName`/`tier` lain dengan benar dan bagaimana `/me` menangani sesi legacy `mbg_jwt` — di luar lingkup pertanyaan, **BELUM DICEK**.
