# BUILD WP13 — Putaran tindak lanjut wave 4 (Lead)

Tanggal: 2026-10-12 · Owner: Lead · Tidak commit

Putaran ini menindaklanjuti QA wave 4. Dua temuan di bawah ini **serius** dan tidak ditemukan oleh tes mana pun yang sudah ada.

## 🔴 Temuan 1 — Generator changelog menerbitkan ulang nomor telepon Kamerad Fuad

**Yang terjadi.** WP12 membangun `scripts/gen_changelog.mjs` yang menyalin subjek commit `git log` **apa adanya** ke `docs/CHANGELOG_AUTO.md`. Lalu workflow `hourly_crypto_macro.yml` meng-`git add` berkas itu dan mem-push-nya **ke repo publik, tiap jam**.

Draf yang dihasilkan memuat, di baris 175:

    - feat(wa): one-click WhatsApp handoff to Mas Fuad (+62 812-2417-0187) (`d92ae72`)

Nomor itu **sama persis** dengan yang sudah saya redaksi dari changelog UI beberapa turn sebelumnya. Jadi tanpa sadar, pekerjaan redaksi itu akan dibatalkan — dan dibatalkan berulang tiap jam, permanen di riwayat git.

**Mengapa lolos.** WP12 menguji bahwa generator jalan, bahwa `--check` benar, dan bahwa YAML-nya sah. Semua benar. Tidak ada yang menguji **isi** drafnya. Pengujian fungsional tidak menangkap kebocoran data.

**Perbaikan.**

- `REDACTION_RULES` di generator: nomor telepon Indonesia, alamat email, token mirip JWT, hash hex panjang, dan blob base64 panjang semuanya diganti penanda `[disunting]`.
- `LITERAL_SECRETS` untuk nilai yang dikenal (nama pepper JWT).
- `findForbidden()` sebagai **penahan**: kalau setelah redaksi masih ada yang tampak sensitif, generator **menolak menulis** dan keluar dengan kode 1. Lebih baik gagal berisik daripada menerbitkan diam-diam.

**Bukti setelah perbaikan:**

    baris 175 -> - feat(wa): one-click WhatsApp handoff to Mas Fuad ([nomor disunting]) (`d92ae72`)
    pindai ulang 6281224170187 / 812-2417 / 8122417 / @gmail  -> 0 kemunculan
    node scripts/gen_changelog.mjs --check  -> exit 0

## 🔴 Temuan 2 — Tab Changelog masih terkunci admin, jadi E-1 tidak pernah terlihat

**Yang terjadi.** Rencana menyatakan E-1 **selesai**: CHANGELOG diturunkan ke `TIER.FREE`, pintu masuk dibuka di menu Account dan Command Palette.

Kenyataannya `App.jsx` masih membungkus render-nya dengan gerbang `isAdmin` **kedua**, dan cabang `else`-nya menampilkan layar kunci bertuliskan "Changelog Khusus Admin".

Jadi urutan yang dialami pengguna FREE: menu muncul (benar, digerbangi `canAccess`) → palette menemukan (benar) → diklik → **"Khusus Admin"**. Pintu ditawarkan lalu dibanting.

**Mengapa lolos.** Tes palette menguji bahwa pintunya **ditawarkan**, bukan bahwa pintunya **terbuka**. QA wave 4 bahkan menyatakan "gerbang Changelog tak rusak" — dan itu benar untuk yang diuji, yaitu keberadaan entri.

**Perbaikan.**

- Gerbang `isAdmin` di cabang CHANGELOG dibuang. Gerbang global di `App.jsx:773` sudah menangani hak akses, dan CHANGELOG bertier FREE.
- `ChangelogTab` kini menerima `onNavigateTab={setActiveTab}` — sekaligus menuntaskan E-5 (tautan Changelog → Arsitektur) yang tadinya menggantung karena App.jsx di luar write-scope WP12.
- Layar kunci mati itu dihapus, bukan dibiarkan sebagai kode tak terjangkau.

## Tindak lanjut QA wave 4 yang lain

| Temuan QA | Tindakan |
|---|---|
| `FlowProcessTab:40` klaim "Jadwal harian (22:30 UTC)" padahal `daily_idx_eod.yml` **tidak punya cron** (hanya `workflow_dispatch`); cron itu milik `hourly_crypto_macro.yml:22` | Label jadi "dipicu manual", status turun ke `warn`, teks diperbaiki |
| `FlowProcessTab:71` klaim "/api/ea masih placeholder" sudah basi — `ea.js:9,21` menyajikan `_ea_inline.txt` (EA asli 16.354 byte) tanpa env var | Status jadi `ok`, teks menyebut jalur sesi yang sebenarnya |
| `isAdminEmail` tanpa `trim`, dan koersi non-string membuat array/objek lolos | `typeof email === 'string' && ... .trim()` — klien dan server (`_shared.js`) kini sepakat |
| `build_wp10.md` menulis "7 tes" untuk `ArchitectureTab.test.jsx`, sebenarnya **13** | Dikoreksi beserta penjelasan sebabnya |

Semua temuan di atas saya verifikasi sendiri sebelum mengubah: cron dibaca langsung dari berkas workflow, dan `ea.js` dibaca langsung.

## Tes baru supaya tidak kembali

| Berkas | Tambahan | Fungsi |
|---|---|---|
| `CommandPaletteGate.test.jsx` | 3 → 8 | Tamu TIDAK melihat tab Arsitektur; FREE/PRO melihatnya; FLOW_PROCESS tidak pernah ditawarkan ke siapa pun |
| `lockedModuleScreen.test.js` | 7 → 8 | `canAccess` CHANGELOG benar untuk FREE/PRO/LEGEND dan menolak GUEST; cabang render CHANGELOG tidak boleh memuat layar kunci admin |

**Catatan kejujuran saat menulis tes ini.** Versi pertama tes FLOW_PROCESS berbunyi "PRO tidak boleh melihatnya" — dan **lolos secara semu**, karena entri itu memang tidak ada di palette untuk tier mana pun (`CommandPaletteModal.jsx:74`). Sudah diganti agar diuji dengan hak admin, sehingga menjadi penjaga yang benar-benar mengikat.

Versi pertama penjaga CHANGELOG juga gagal — bukan karena kode produk, tapi karena **komentarnya sendiri** memuat frasa "Changelog Khusus Admin" yang dilarang tes. Tes kini memakai `stripComments()`: penjaga yang melarang sebuah frasa tidak boleh melarang membicarakannya.

## Hasil akhir

    npx vitest run        -> 44 files, 623 tests passed
    npx vite build        -> sukses
    gen_changelog --check -> exit 0 (156 commit, 10 tanggal)

## Yang masih belum diverifikasi

- Tab Changelog dan Arsitektur belum dilihat di browser dengan akun FREE sungguhan. Yang terbukti: gerbang baca-sumber, uji perilaku `canAccess`, dan render palette di jsdom.
- Workflow belum pernah dijalankan; yang terbukti hanya YAML sah dan generatornya idempoten.
- Apakah redaksi generator cukup luas untuk subjek commit masa depan. Penahan `findForbidden()` yang akan menangkapnya, bukan jaminan bahwa polanya lengkap.
