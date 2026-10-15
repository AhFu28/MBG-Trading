# Build WP12 — Generator changelog dari git log (E-6, E-7) + tautan E-5

Task: task-28 · Builder: recon-ticker · 2026-10-12 00:21–00:50 WIB. Tidak commit.

## 1. File yang disentuh

| File | Jenis | Perubahan |
|---|---|---|
| `scripts/gen_changelog.mjs` | BARU | Generator dari `git log` + mode `--check` |
| `docs/CHANGELOG_AUTO.md` | BARU (hasil generator) | Draft 292 baris |
| `.github/workflows/hourly_crypto_macro.yml` | ubah | `fetch-depth: 0`, 1 step generator, `git add docs/CHANGELOG_AUTO.md` |
| `frontend/src/components/ChangelogTab.jsx` | ubah | Prop opsional `onNavigateTab` + tombol tautan Arsitektur |
| `docs/rencana-fixing/build_wp12.md` | BARU | Laporan ini |

Tidak ada berkas lain yang disentuh. `frontend/src/data/changelogData.js` TIDAK diubah.

## 2. Isi draft yang dihasilkan

```
node scripts/gen_changelog.mjs
changelog: 156 commit(s) across 10 day(s)
changelog: newest commit 2026-10-10 (1 day(s) ago)
changelog: updated -> docs/CHANGELOG_AUTO.md        # run pertama
changelog: unchanged -> docs/CHANGELOG_AUTO.md      # run kedua (idempoten)
```

- **156 entri**, **10 tanggal**, tanggal terakhir **2026-10-10**, berkas 292 baris.
- Urutan: tanggal terbaru dulu, di dalam tanggal dikelompokkan Features / Fixes / Performance / Refactors /
  Docs / Tests / Chores & Data / Other.
- Contoh kepala draft: `## 2026-10-10` → Fixes (2 entri, `e8b1774`, `cfa57b8`) dan Docs (1 entri, `76e56d2`).
- **Pekerjaan hari ini (2026-10-11) TIDAK muncul** karena repo ini punya banyak perubahan yang belum di-commit.
  Generator sengaja tidak mengarang: yang tidak ada di `git log` tidak ditulis, dan draft hanya akan memuatnya
  setelah Lead melakukan commit.
- Commit data otomatis (`chore(data): automated bundle refresh`, `[skip ci]`) **dikecualikan secara default** karena
  terbit tiap jam dan tidak membawa perubahan manusiawi. Aturan ini eksplisit; pakai `--include-bot` untuk memasukkannya.
- Output **deterministik**: tidak ada timestamp jam-dinding, jadi berkas hanya berubah kalau sejarah git berubah
  (tidak menciptakan commit tambahan di CI).

## 3. Ambang staleness dan alasannya

**14 hari.** Alasan: repo ini commit secara meledak-meledak — kerja fitur, lalu jeda (akhir pekan, pembekuan rilis).
7 hari akan gagal pada minggu yang normal sepi; 30 hari akan menyembunyikan changelog yang benar-benar ditinggalkan.

`--check` keluar dengan kode != 0 bila salah satu dari tiga hal ini benar:
1. `git log` tidak punya commit bertanggal;
2. commit terbaru lebih tua dari 14 hari;
3. isi `docs/CHANGELOG_AUTO.md` di disk BEDA dari hasil generate saat itu (draft basi/belum ditulis).

Hasil uji:
```
node scripts/gen_changelog.mjs --check
changelog OK: 156 commit(s), newest 2026-10-10 (1 day(s) ago)
check_exit=0
```

## 4. E-7 — workflow yang dipilih

Dipilih **`.github/workflows/hourly_crypto_macro.yml`** (job `hourly-radar`).
Alasan: ini satu-satunya workflow yang (a) jalan rutin tiap jam, bukan jadwal langka, dan (b) **sudah punya step
commit + push** ke repo. Jadi draft benar-benar ikut tersimpan, bukan cuma dibuat lalu dibuang di runner.

Alternatif yang dipertimbangkan: `secret-guard.yml` jalan pada `push`/`pull_request` dan sudah `fetch-depth: 0`,
tetapi workflow itu tidak punya step commit — draft hanya akan dibuat lalu hilang. Ditempel ke secret-guard berarti
E-7 tidak menghasilkan apa pun. Karena itu tidak dipakai.

Tiga suntingan minimal di hourly workflow:
1. `actions/checkout@v4` + `with: fetch-depth: 0` (tanpa ini `git log` di runner hanya berisi 1 commit karena shallow);
2. step baru **"Refresh the auto-generated changelog draft (E-6)"** sebelum step commit, menjalankan
   `node scripts/gen_changelog.mjs` dan mencetak 15 baris pertama draft;
3. `git add docs/CHANGELOG_AUTO.md` di step commit yang sudah ada (berdampingan dengan bundle).

Validasi YAML setelah disunting:
```
python -c "import yaml; d=yaml.safe_load(open('.github/workflows/hourly_crypto_macro.yml',encoding='utf-8')); print('YAML OK jobs:', list(d['jobs'].keys())); print('steps:', len(list(d['jobs'].values())[0]['steps']))"
YAML OK jobs: ['hourly-radar']
steps: 8        # sebelumnya 7
```
Guard lama tidak diubah: step commit tetap gagal keras kalau bundle tidak berubah.

## 5. E-5 — tautan Changelog ke Arsitektur

- `ChangelogTab.jsx` kini menerima prop opsional `onNavigateTab`; kalau ada, muncul tombol
  **"🧭 Lihat Arsitektur Sistem"** yang memanggil `onNavigateTab('ARCHITECTURE')` (tab ARCHITECTURE = TIER.FREE,
  `frontend/src/services/featureAccess.js:134`). Kalau prop tidak dikirim, tombol tidak dirender dan tab tetap normal.
- **BELUM AKTIF DI PRODUK**: `App.jsx:986` masih merender `<ChangelogTab />` tanpa prop, dan `App.jsx` TIDAK termasuk
  write-scope tugas ini. Perlu 1 baris dari Lead: `<ChangelogTab onNavigateTab={setActiveTab} />` (pola sama dengan
  `App.jsx:913`/`:1060`). Tanpa itu tautan tidak terlihat. Saya tidak menyentuh App.jsx demi aturan scope.

## 6. Perintah tes + hasil

```
node scripts/gen_changelog.mjs
-> 156 commit(s) across 10 day(s); updated -> docs/CHANGELOG_AUTO.md; gen_exit=0
node scripts/gen_changelog.mjs --check
-> changelog OK: 156 commit(s), newest 2026-10-10 (1 day(s) ago); check_exit=0
```
```
cd frontend && npx vitest run
 Test Files  44 passed (44)
      Tests  616 passed (616)
   Duration  9.90s
vitest_exit=0
```
```
cd frontend && npx vite build
dist/assets/index-Ce1iUYas.js   393.81 kB │ gzip: 122.04 kB
✓ built in 2.01s
build_exit=0
```
Catatan: baris `Edge bundle read failed: Error: kv down` di stderr vitest sudah ada sebelum perubahan ini dan tidak
menggagalkan suite (44/44 tetap lulus).

Skrip sementara: TIDAK ADA yang tertinggal di repo. `git status` untuk berkas WP12:
```
 M .github/workflows/hourly_crypto_macro.yml
 M frontend/src/components/ChangelogTab.jsx
?? docs/CHANGELOG_AUTO.md
?? scripts/gen_changelog.mjs
```

## 7. Yang TIDAK bisa diotomatiskan

- **Narasi rilis yang dikurasi** (`frontend/src/data/changelogData.js`: judul paket, tabel modul, pelajaran) tetap
  pekerjaan manusia. Generator hanya menghasilkan daftar commit mentah; ia tidak bisa menilai "apa artinya".
- **Pekerjaan yang belum di-commit** tidak akan pernah muncul. Selama tim bekerja tanpa commit, changelog auto akan
  terlihat basi — itu keterbatasan git, bukan bug generator.
- **Penilaian "basi" secara semantik**: `--check` hanya tahu umur commit dan sinkronisasi berkas. Ia tidak tahu apakah
  perubahan besar sudah dijelaskan.

## 8. Sisa risiko

- **Workflow produksi berubah.** Step commit sekarang juga membawa `docs/CHANGELOG_AUTO.md`. Risiko rendah karena
  output deterministik, tetapi commit otomatis pertama akan menyertakan berkas baru ini.
- **`--check` belum dipasang di workflow mana pun** (tidak diminta di tugas ini). Kalau nanti dipasang di pipeline
  yang berjalan saat push, ia akan gagal sampai draft di-commit lebih dulu.
- **Filter bot** membuang `[skip ci]` dan `chore(data)` otomatis. Kalau suatu hari ada commit manusia yang mengandung
  `[skip ci]`, ia ikut terbuang — disadari dan didokumentasikan.
- `fetch-depth: 0` menambah waktu checkout pada workflow hourly (riwayat penuh). Untuk repo ini dampaknya kecil
  dibanding waktu pipeline Python-nya.

## 9. Belum dicek

- Eksekusi nyata workflow di GitHub Actions — BELUM DICEK (butuh push; dilarang commit di tugas ini).
- Tampilan tombol Arsitektur di UI — BELUM DICEK karena prop belum dipasang di `App.jsx`.
