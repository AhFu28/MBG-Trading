# AUDIT P0-4 — Lima berkas data mati

Tanggal: 2026-10-12 · Penyusun: Lead · Sifat: audit + rekomendasi (belum ada kode diubah)

Tujuan: mengubah P0-4 dari "perlu keputusan" menjadi "tinggal setuju atau tidak" dengan menyebut bukti dan risiko tiap berkas.

## Apa yang dimaksud

Lima berkas di `engine/cache/` berumur 271 jam (11,3 hari), semuanya ditulis pada **satu momen yang sama**: 30 September 2026 16:24.

| Berkas | Ukuran | Pembaca | Status |
|---|---|---|---|
| `last_known_macro.json` | 269 B | **DIBACA** `engine/fetchers/news_macro.py:379` | **RISIKO NYATA** |
| `macro_telemetry.json` | 1,8 MB | tidak ada yang membaca | artefak mati |
| `crypto_spot_10.json` | 7,7 KB | tidak ada yang membaca | artefak mati |
| `paper_portfolio.json` | 47 KB | tidak ada; UI memakai `localStorage.mbg_paper_portfolio_v5` | artefak mati |
| `research_archive.json` | 48 KB | konstanta path di `news_research_agent.py:26` | perlu ditegaskan |

## Mengapa berkas ini bisa basi

Semua `upsert_*()` di `engine/database/supabase_client.py` menulis salinan lokal sebagai fallback (`_save_local_fallback`, `:36-56`). Jadi berkas ini adalah **tembolok cadangan**, bukan sumber data utama.

Mereka berhenti diperbarui sejak 30 September karena pipeline sudah pindah jalan di GitHub Actions — runner cloud menulis salinannya sendiri, clone lokal ini tidak ikut diperbarui. Sebagai pembanding, `latest_cockpit_bundle.json` berumur 36,9 jam, jadi berkas lain memang tetap segar.

## Yang membuat `last_known_macro.json` berbahaya

Bukti di `engine/fetchers/news_macro.py`:

1. **`:383-385` membaca tanpa memeriksa umur.** Tidak ada perbandingan timestamp. Tembolok 11 hari diperlakukan sama dengan tembolok 11 menit.
2. **`:389-403` kalau berkas tidak ada, dipakai nilai keras** — gold 2750,00 · brent 74,20 · DXY 104,50 · US10Y 4,28 · IHSG 6.506,40. Nilai ini ditandai `data_source: "fallback"`, jadi jujur, tetapi tetap angka karangan yang bisa tampil.
3. **`:406-409` ada penyaring kewarasan** yang menolak gold di luar 1.000-10.000 dan brent di luar 40-160. Bagus, tetapi penyaring ini justru bisa **mempertahankan angka keras** `4262.0` dan `74.20` saat kuotasi dianggap anomali.
4. **`:411-444` data live yfinance menimpa nilai tembolok**, dan kalau berhasil cache ditulis ulang (`:446-449`). Jadi pada jalur normal, tembolok tidak dipakai.
5. **Tetapi `:827` menulis `updated_at: datetime.now()`.** Artinya bila yfinance gagal, angka tembolok 30 September disajikan **dengan cap waktu hari ini**. Ini pelanggaran provenance: labelnya bilang baru, angkanya tua.
6. `:822-826` menyusun `full_narrative` yang menyebut angka-angka itu secara eksplisit: *"Gold at $X, Brent Crude at $Y, DXY at Z pts"* — narasi yang dibaca manusia, terbentuk dari angka yang bisa saja tua.

**Ringkas:** risikonya bukan pada temboloknya, melainkan pada **cap waktunya**. Angka tua yang diberi label "baru" lebih berbahaya daripada angka tua yang mengaku tua.

## Mengapa berkas ini ikut terbit

`git ls-files engine/cache` menunjukkan **11 berkas ter-track**, termasuk kelima berkas mati itu. Dan `engine/cache` **tidak ada di `.gitignore`** (yang terdaftar hanya `engine/config/vip_subscribers.json`).

Akibatnya artefak data ikut masuk riwayat git. Ini berbahaya dua kali:
- `mtime` berkas di clone lain menjadi menyesatkan (terlihat "baru" karena baru di-checkout, padahal isinya tua);
- setiap orang mengira berkas itu sumber resmi, padahal hanya tembolok cadangan runner.

Catatan positif: `frontend/public/data/` **sudah tidak ada**, dan `_save_local_fallback:39-42` menjelaskan bahwa jalur publik itu sengaja ditutup. Jadi kebocoran payload VIP lewat berkas statis sudah beres.

## Rekomendasi

| # | Tindakan | Alasan | Effort |
|---|---|---|---|
| R-1 | Tambah **cek umur** pada pembacaan `last_known_macro.json`. Kalau lebih tua dari ambang (usul: 24 jam), perlakukan sebagai tidak ada dan catat di log. | Menutup akar risiko. Tembolok tua lebih jujur diabaikan daripada dipakai diam-diam. | S |
| R-2 | Bawa umurnya ke label: kalau nilai berasal dari tembolok, tulis `data_source: "cached:<umur>j"`, bukan `"cached"`. | `updated_at` tetap waktu tulis, tetapi asal angkanya jadi terlihat. | S |
| R-3 | **Hentikan tracking** kelima berkas: keluarkan dari git dan tambahkan `engine/cache/*.json` ke `.gitignore`. | Artefak data tidak boleh ada di riwayat git. | S |
| **R-4 — SELESAI 2026-10-16** | Jalur nilai keras dihapus — dan ternyata tertenun lebih dalam dari perkiraan: default serupa ada di `build_daily_snips` (DXY 104,0), `generate_impact_assessment` (104), frontend `NewsTab` (104,5 **dan** 99,65 — dua nilai berbeda untuk satu field), `MorningBriefAudioPodcast` (emas 4262,4, IHSG 6.374,91, VIX 18,0 — podcast bahkan menucapkannya dalam kata-kata). Kini verdict tanpa data bernama NO_DATA, frontend merender tanda pisah, dan skrip podcast hanya disusun dari nilai yang ada. | Patuh aturan kejujuran proyek: sel kosong lebih baik daripada angka karangan. | M |
| **R-5 — TERJAWAB 2026-10-16** | `research_archive.json` **aktif**: dibaca dan ditulis `news_research_agent.py:341-364`. Ia basi di clone lokal hanya karena agent tidak jalan lokal sejak 30 September. Bukan artefak mati — tidak dihapus, tetapi tetap keluar dari tracking git (artefak data runtime). | — | S |

**R-1, R-2, dan R-3 saya sarankan dikerjakan lebih dulu** — ketiganya kecil, dan bersama-sama menutup risiko provenance tanpa mengubah tampilan produk.

R-4 lebih besar karena menyentuh perilaku tampilan saat data gagal, jadi wajar ditunda.

## Yang TIDAK saya verifikasi

- Apakah pipeline cloud saat ini benar-benar menjalankan mode yang memanggil `fetch_macro_indicators`. Saya belum menjalankan pipeline-nya, hanya membaca jalur kode.
- Umur berkas di runner GitHub Actions. Yang saya ukur adalah clone lokal ini.
- Apakah `research_archive.json` dipakai saat runtime (baru konstanta yang saya lihat).
