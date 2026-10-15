# BUILD WP3 — SignalsTab CTA, LandingPage module cards, Changelog access

Status: SELESAI & TERVERIFIKASI. Tanggal: 2026-10-11.

## Catatan penting: ada penulis kedua di scope ini
Saat saya mengerjakan, **penulis lain sudah menerapkan sebagian perubahan yang sama** (kemungkinan Lead atau sesi paralel) di `CmcTopNav.jsx`, `CommandPaletteModal.jsx`, dan kedua file tes. Saya mendeteksi itu saat edit `LandingPage.jsx` gagal karena isinya sudah berubah, lalu saya:
1. berhenti menimpa, membaca ulang file;
2. merekonsiliasi `LandingPage.jsx` (lihat di bawah) karena sempat ada referensi ke `MODULE_BADGE[TIER.ADMIN]` sebelum key-nya ada;
3. menjalankan tes yang diminta sebagai bukti akhir, bukan mengklaim "sudah saya tulis semua".

Diff final tetap perlu direview Lead.

## Tugas 1 (P1-8) — tombol menyesatkan
- `frontend/src/components/SignalsTab.jsx`: tombol "Lihat Paket VIP" kini `onNavigateTab('SUBSCRIPTION')` (sebelumnya `'CHANGELOG'`).
- Alasan: CHANGELOG dulu ADMIN-only, jadi semua non-VIP mendarat di layar kunci. Label menjanjikan paket, maka tujuannya halaman langganan.
- `SUBSCRIPTION` di-gate `TIER.GUEST` (`featureAccess.js:77`), jadi selalu bisa dibuka; rutenya ada di `App.jsx:1064`.

## Tugas 2 (P1-9) — kartu LandingPage
Perubahan di `frontend/src/components/LandingPage.jsx`:
1. **Tabel badge per tier** `MODULE_BADGE` (GUEST→PUBLIK, FREE→GRATIS, PRO→PRO, LEGEND→LEGEND, ADMIN→INTERNAL). Tidak ada lagi fallback implisit "GRATIS" untuk tier tak dikenal.
2. **Kartu ADMIN disembunyikan** dari halaman publik: `if (minTier === TIER.ADMIN) return null;` — tamu tidak lagi melihat FLOW_PROCESS/ADMIN_APPROVAL, apalagi dilabeli gratis.
3. **`proCount` diperbaiki**: dari `Object.keys(MODULE_TIER).length` (menghitung modul admin, melebih-lebihkan paket berbayar) menjadi `allowedModules(TIER.PRO).length`.
4. **Rekonsiliasi saya**: mengganti sisa `isPro`/`isGuest` yang sudah tak terpakai menjadi satu `isLocked` (PRO atau LEGEND) untuk border emas + ikon 🔒, supaya LEGEND tidak tampil seperti modul bebas.

Tidak ada navigasi/props baru yang ditambahkan, sesuai batasan tugas.

## Tugas 3 (E-1, E-3, E-9)
- `frontend/src/services/featureAccess.js`: `MODULES.CHANGELOG` diturunkan `TIER.ADMIN` → `TIER.FREE`. `FLOW_PROCESS` **tetap** `TIER.ADMIN` (memuat informasi sensitif: kunci JWT & kredensial cockpit yang pernah ter-commit).
- `frontend/src/components/CmcTopNav.jsx`: item `CHANGELOG` ditambahkan ke grup `ACCOUNT` sehingga user FREE punya pintu; `CHANGELOG` dikeluarkan dari `ADMIN_ONLY_IDS` dan dari `adminExtras` supaya tidak ter-render dua kali untuk admin.
- `frontend/src/components/CommandPaletteModal.jsx`: entri `CHANGELOG` di palet kini difilter dengan `canAccess(MODULES.CHANGELOG, userTier, isAdmin)`; komponen menerima prop baru `userTier` (default `'guest'`) dan `isAdmin` (default `false`). Default sengaja menutup (fail-closed), jadi admin hanya melihat entri itu bila `App.jsx` mengirim prop tersebut — pengkabelan di `App.jsx` di luar write-scope tugas ini dan dicatat sebagai tindak lanjut.

## Tes wajib — perintah & hasil
1. `cd frontend && npx vitest run src/services/__tests__/featureAccess.test.js src/components/__tests__/CmcTopNav.test.jsx`
   → **2 files passed, 62 tests passed** (featureAccess 38, CmcTopNav 24), 1.48s.
2. `cd frontend && npx vitest run src/components/__tests__/CommandPaletteGate.test.jsx` (tes baru dari penulis paralel, menutup E-9)
   → **1 file passed, 3 tests passed**.
3. `cd frontend && npx vite build`
   → **exit 0, "✓ built in 4.88s"** (chunk ChangelogTab ikut ter-build).
4. `cd frontend && npx vitest run` (suite penuh)
   → **40 files passed / 1 failed; 581 tests passed / 1 failed**.

### Tes yang diubah karena perilaku memang berubah (bukan dilunakkan)
- `frontend/src/services/__tests__/featureAccess.test.js`: set modul FREE kini menyertakan `MODULES.CHANGELOG`, dan blok "admin-only" diubah menjadi `canAccess(CHANGELOG, FREE) === true`, `(CHANGELOG, PRO) === true`, `(CHANGELOG, GUEST) === false`. Alasan: keputusan E-1 memang menurunkan tier-nya.
- `frontend/src/components/__tests__/CmcTopNav.test.jsx`: assertion "CHANGELOG tidak ada di nav statis" dihapus dan diganti menjadi "Changelog HARUS ada di menu Account" + "Changelog terlihat untuk akun biasa, Flow Process/Admin Approval tetap tersembunyi". Alasan: E-3 memang menambahkan pintunya.

## Sisa risiko
1. **Satu tes suite penuh gagal, TIDAK terkait WP3**: `frontend/src/components/__tests__/provenanceModel.test.js:35` (`appCode` tidak boleh punya fallback model bernama) — file tes ini **untracked** (`?? provenanceModel.test.js`), ditulis untuk `App.jsx`, dan `App.jsx` tidak ada di scope WP3. Perlu pemilik tes itu memperbaikinya.
2. **`App.jsx` belum mengirim `userTier`/`isAdmin` ke `CommandPaletteModal`** → saat ini entri Changelog di palet tersembunyi untuk SEMUA orang (termasuk admin). Tidak ada fitur yang hilang karena Changelog sudah punya pintu di menu Account. Pengkabelan `App.jsx` dijadwalkan terpisah.
3. **Risiko konflik penulis**: karena ada penulis kedua di file yang sama, Lead wajib mereview diff final `git diff -- frontend/src/components/LandingPage.jsx frontend/src/components/CmcTopNav.jsx frontend/src/components/CommandPaletteModal.jsx`.
4. `MODULE_LABEL` di LandingPage masih memuat label `ADMIN_APPROVAL`/`FLOW_PROCESS` yang kini tidak pernah dirender. Bukan bug, hanya sisa data.
