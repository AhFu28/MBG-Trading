# BUILD WP5 (P1-4) — changelogData.js basi

Status: SELESAI & TERVERIFIKASI. Tanggal: 2026-10-11.

## Masalah
`frontend/src/data/changelogData.js` berhenti di entri `30 September 2026` (LATEST), sedangkan `CHANGELOG.md` root sudah memuat rilis sampai `2026-10-06`. Jadi menu Changelog — yang baru dibuka untuk tier FREE (WP3) — menampilkan riwayat 10 hari basi.

## Yang dikerjakan
Menambahkan **3 entri baru** ke `CHANGELOG_DATA`, mengikuti konvensi file yang sudah ada ("Setiap entri mewakili SATU TANGGAL KALENDER secara utuh", `changelogData.js:2`):

| id | date | status | isi (dari CHANGELOG.md) | processFlow | markdownContent |
|---|---|---|---|---|---|
| `pkg-06102026` | 6 Oktober 2026 | **LATEST** | 5 section: Sprint 30, 29, 28, 27, 26 | 5 langkah | 13 KB |
| `pkg-05102026` | 5 Oktober 2026 | STABLE | 3 section: Sprint 25, 24, 23 + satu `### Sprint 16` | 5 langkah | 19 KB |
| `pkg-02102026` | 2 Oktober 2026 | STABLE | 6 section: Sprint 22, 21, 20, 19, 18, 17 | 6 langkah | 20 KB |

Dengan itu **seluruh 14 section `## [2026-10-xx]` di CHANGELOG.md tercakup** (5 + 3 + 6). Urutan tetap terbaru → terlama, dan `LATEST` dipindah dari 30 September ke 6 Oktober.

Bentuk field **sama persis**: `id, sprintLabel, version, semanticVersion, date, status, statusColor, badgeLabel, title, description, processFlow[{step,label}], markdownContent`. Isi `markdownContent` adalah **kutipan apa adanya** dari `CHANGELOG.md` (tiap section disalin utuh, dipisah `---`), tanpa klaim baru.

### Perubahan pada entri lama (hanya yang wajib)
- `30 September 2026`: `status` LATEST → STABLE, `badgeLabel` "LATEST / …" → "STABLE / SECURITY & DATA INTEGRITY", `statusColor` `var(--accent-green)` → `var(--text-muted)` (menyamai semua entri STABLE lain). Alasan: file hanya boleh punya satu LATEST.
- Tidak ada entri lama lain yang diubah.

### Keputusan kejujuran
- **`semanticVersion: "Tidak tercatat"`.** `CHANGELOG.md` tidak menyebut nomor versi untuk satu pun rilis Oktober (dicek: tidak ada pola `vX.Y.Z` di baris 17-508), `git tag` kosong, dan `frontend/package.json` masih `1.0.0`. Menulis "v5.9.0" atau sejenisnya berarti mengarang.
- `title` memakai format `"Update 6 Oktober 2026: <judul-judul section>"` — bukan "Update v5.9.0" — supaya tidak mengklaim versi yang tidak ada.
- `sprintLabel` menyebut nomor sprint yang benar-benar ada di section hari itu (bukan rentang yang diasumsikan).

## Bukti perintah & hasil
1. `node validate.cjs` (validator di **luar repo**, `%TEMP%\wp5\validate.cjs`) — memuat modul lalu memeriksa: array, field wajib per entri, tanggal menurun, tidak ada id duplikat, `processFlow` tidak kosong, `markdownContent` tidak kosong, tepat satu `LATEST`, dan LATEST = entri terbaru.
   → `entries total: 22` · `october entries: 6 Oktober 2026 [pkg-06102026] flow=5 md=13KB | 5 Oktober 2026 [pkg-05102026] flow=5 md=19KB | 2 Oktober 2026 [pkg-02102026] flow=6 md=20KB` · `newest: pkg-06102026 6 Oktober 2026 LATEST` · **`VALIDATION OK`** untuk semua entri baru. Satu-satunya "problem" yang tersisa adalah 2 entri **lama** bertanggal rentang (`13 - 15 September 2026`, `08 - 09 September 2026`) yang tidak bisa diparse validator saya — bukan berasal dari perubahan ini.
2. `cd frontend && npx vitest run src/components/__tests__/ChangelogTab.test.jsx`
   → **"No test files found, exiting with code 1"** — file tes itu memang tidak ada di repo (`glob frontend/src/**/__tests__/*Changelog*` = kosong). Satu-satunya pengimpor `changelogData.js` adalah `frontend/src/components/ChangelogTab.jsx:2`.
3. `cd frontend && npx vite build`
   → **exit 0, "✓ built in 1.86s"**; chunk `ChangelogTab` tumbuh `89.02 kB → 148.10 kB` (gzip `31.42 → 54.32 kB`) — sesuai dengan tambahan ~52 KB konten Oktober.
4. `cd frontend && npx vitest run` (suite penuh)
   → **42 files passed, 594 tests passed**.

### Catatan soal tes yang tidak dibuat
Tugas menyebut "kalau tidak ada [tes] sama sekali, buat tes kecil". Aturan tugas nomor 2 berkata hanya file di write-scope boleh disentuh (`changelogData.js` + laporan ini). Saya memilih **tidak menambah file tes baru ke repo** dan sebagai gantinya menjalankan validator di luar repo (bukti butir 1). Kalau Lead ingin tes permanen, tambahkan `frontend/src/**/__tests__/changelogData.test.js` dengan assertion yang sama seperti validator itu — skripnya ada di `%TEMP%\wp5\validate.cjs`.

## Entri yang saling bertentangan / tanggal tidak jelas (tidak dipaksa)
1. **`### Sprint 22` dipakai dua kali**: satu di `CHANGELOG.md:274` (blok 2026-10-05) dan satu lagi di `CHANGELOG.md:331` (blok 2026-10-02).
2. **`### Sprint 16` juga dipakai dua kali**: `CHANGELOG.md:510` (blok 2026-09-30, sudah ada di data lama) dan `CHANGELOG.md:306` — heading ini secara posisi berada **di dalam blok 2026-10-05** (setelah heading `## [2026-10-05]` baris 272, sebelum `## [2026-10-02]` baris 329) padahal isinya audit UI/UX yang tidak bernomor urut. Saya biarkan di tempat aslinya dan tidak memindahkan/menomori ulang; `sprintLabel` entri 5 Oktober karena itu berbunyi "Sprint 16, 22, 23, 24, 25".
3. **Tanggal kosong**: tidak ada section untuk 1, 3, dan 4 Oktober di `CHANGELOG.md`, jadi tidak ada entri untuk tanggal-tanggal itu. Tidak diisi karangan.

## Utang & sisa risiko
1. **"33 entri" vs 3 entri.** Lead menyebut 33 entri October; yang ada di `CHANGELOG.md` adalah **14 section tanggal** berisi 33 heading sprint/bullet bertanda. Saya mengikuti konvensi file (1 entri = 1 tanggal) sehingga menjadi 3 entri. Kalau yang diinginkan 1 entri per sprint, itu **mengubah bentuk data** dan harus diputuskan Lead lebih dulu.
2. **`semanticVersion: "Tidak tercatat"` akan tampil apa adanya** di `ChangelogTab.jsx:226` ("Terbaru: 6 Oktober 2026 (Tidak tercatat)") dan `:421`. Itu disengaja; kalau produk ingin nomor versi, nomor itu harus diterbitkan dulu, bukan dikarang.
3. **Ukuran bundle naik** ~59 kB mentah pada chunk ChangelogTab. Masih wajar (chunk terpisah, lazy), tetapi kalau changelog tumbuh terus, pertimbangkan memuat `markdownContent` per tanggal secara lazy.
4. Entri 6 Oktober menyebut nomor WhatsApp `+62 812-2417-0187` (`CHANGELOG.md:138`) dan kini tampil di UI untuk tier FREE. Isinya memang sudah publik di file changelog repo, tetapi perlu keputusan Lead apakah nomor itu boleh ikut dirender di aplikasi.
