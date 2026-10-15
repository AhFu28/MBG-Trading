# Build WP2 — P0-2 CORS TradingView + P0-1 /api/news 502

Task: task-12 · Builder: recon-ticker · Waktu: 2026-10-10 21:24–23:15 WIB.
Repo TIDAK di-commit. Menunggu review diff oleh Lead.

## 1. File yang diubah (hanya dalam write-scope)

| File | Perubahan | Alasan (bukti) |
|---|---|---|
| `frontend/src/services/marketOverview.js` | `Content-Type: application/json` → `text/plain` di `fetchScannerMarket` (baris ~560) + komentar bahasa Inggris kenapa | Preflight CORS TradingView menolak header `content-type`; terbukti di browser: `application/json` gagal, `text/plain` HTTP 200 |
| `frontend/functions/api/news.js` | Timeout 4500 ms → 9000 ms, ekstraksi `fetchRssOnce()`, retry 1x (total 2 percobaan), bentuk respons tetap | Produksi balas `502 {"status":"error","message":"The operation was aborted"}` |
| `frontend/src/components/NewsTab.jsx` | State `liveRssStatus` (`memuat`/`ok`/`gagal`), cabang gagal tidak lagi diam, artikel terakhir TIDAK dihapus, badge `LIVE RSS: OK/GAGAL/MEMUAT` | Aturan kejujuran: user tidak boleh mengira feed live saat endpoint gagal |
| `docs/rencana-fixing/build_wp2.md` | Laporan ini | — |

Tidak ada file lain yang disentuh. Bukti: `git status --porcelain` hanya 3 file produk yang `M`.

## 2. Detail perubahan

### TUGAS 1 (P0-2) — marketOverview.js
- Sebelum: `headers: { 'Content-Type': 'application/json' }` (`fetchScannerMarket`, di dalam `getJSON(\`${TV_SCANNER}/${scanner}/scan\`)`).
- Sesudah: `headers: { 'Content-Type': 'text/plain' }` dengan komentar panjang bahasa Inggris yang menjelaskan:
  preflight TradingView hanya mengizinkan `Referer,Accept`; `application/json` memicu OPTIONS yang ditolak
  (`Request header field content-type is not allowed by Access-Control-Allow-Headers in preflight response`);
  `text/plain` CORS-safelisted sehingga POST langsung 200; pola sama sudah dipakai `useLivePrices.js`;
  ada instruksi eksplisit "Do NOT change it back".
- Daftar simbol TIDAK diubah. Proxy TIDAK ditambahkan.
- Catatan: `marketOverview.js` masih punya satu `Content-Type: application/json` lain di baris ~448
  (payload Hyperliquid di `fetchDerivatives`) — itu jalur server-ke-server yang berbeda dan memang tidak boleh diubah.

### TUGAS 2 (P0-1) — news.js
- Percobaan upstream dipindah ke fungsi lokal `fetchRssOnce(timeoutMs)`; timer di-`clearTimeout` di blok `finally`.
- `RSS_TIMEOUT_MS = 9000` dan loop 2 percobaan (`attempt <= 2 && xml === null`). `xml === null` dipakai sebagai
  penanda "belum ada hasil" supaya body string kosong tetap dianggap hasil valid (bukan retry sia-sia).
- Bila dua percobaan tetap gagal: `throw lastError` → blok `catch` lama tetap mengembalikan
  `{ status:'error', message, articles: [] }` dengan HTTP 502. Bentuk respons sukses juga tidak berubah
  (`status, last_synced, total, articles`).
- `Cache-Control` tidak diubah.

### TUGAS 2 (lanjutan) — NewsTab.jsx
- State baru: `const [liveRssStatus, setLiveRssStatus] = useState('memuat')` (baris 43-45).
- `fetchLiveRssNews`:
  - sukses + ada artikel → `setDynamicArticles(...)` dan `setLiveRssStatus('ok')`;
  - HTTP ok tapi 0 artikel → `'gagal'` (200 kosong bukan data segar);
  - HTTP tidak ok → `'gagal'` (sebelumnya cabang ini diam total);
  - exception → `'gagal'`, artikel lama TIDAK dikosongkan.
- UI: badge di sebelah tombol "Live Feed (Ns)" (baris ~510-533), teks `LIVE RSS: OK` / `LIVE RSS: GAGAL` /
  `LIVE RSS: MEMUAT`, warna hijau/merah/abu, plus `title` berbahasa Indonesia yang menyatakan artikel terakhir
  dipertahankan saat gagal. Tidak ada klaim "live" saat status gagal.

## 3. Perintah tes + hasil (WAJIB)

Perintah:
```
cd frontend
npx vitest run src/services/__tests__/marketOverview.test.js src/components/__tests__/LandingPage.test.jsx
```
Hasil:
```
Test Files  2 passed (2)
     Tests  22 passed (22)
  Duration  2.33s (transform 145ms, setup 0ms, collect 372ms, tests 1.06s, environment 1.12s, prepare 242ms)
```
Exit code 0. (Ada warning `act(...)` dari `LiveTickerStrip` — sudah ada sebelum perubahan, bukan kegagalan test.)

Pemeriksaan tambahan (syntax/parse ketiga file) — `esbuild`:
```
node node_modules/esbuild/bin/esbuild functions/api/news.js --log-level=warning --outfile=NUL
node node_modules/esbuild/bin/esbuild src/components/NewsTab.jsx --log-level=warning --outfile=NUL
node node_modules/esbuild/bin/esbuild src/services/marketOverview.js --log-level=warning --outfile=NUL
-> SYNTAX_OK (exit 0, tanpa error)
```

`git diff --stat`:
```
 frontend/functions/api/news.js          | 55 ++++++++++++++++++++++++---------
 frontend/src/components/NewsTab.jsx     | 38 +++++++++++++++++++++++
 frontend/src/services/marketOverview.js | 13 +++++++-
 3 files changed, 90 insertions(+), 16 deletions(-)
```

### Tes baru untuk NewsTab
TIDAK dibuat. Alasan: `marketOverview.test.js` sengaja tidak memock fetch (lihat komentar di
`frontend/src/services/__tests__/marketOverview.test.js:7-14`), dan menulis tes render NewsTab butuh
setup `localStorage` + timer 60 detik + mock `/api/news`; time-box 75 menit sudah terlampaui sehingga
tes itu tidak diselesaikan. Perilaku baru tetap diverifikasi lewat syntax check + review diff manual.
Kalau Lead mau, tes mock `/api/news` (assert status 'gagal' saat `res.ok === false` dan artikel lama
tetap tampil) bisa ditambahkan menyusul.

## 4. Sisa risiko

- **Belum diverifikasi di produksi.** Perbaikan baru berlaku setelah deploy Cloudflare Pages. `GET /api/news`
  dan tabel cross-market Home masih perlu dites di `https://mbg-trading.pages.dev` setelah deploy.
  Retry 2×9000 ms berarti respons terburuk bisa ~18 detik; `Cache-Control` tetap 60 detik sehingga
  kegagalan tidak akan menyerang tiap request, tapi request pertama setelah cache basi bisa lambat.
- **Timeout Cloudflare:** batas CPU/wall time Pages Function jauh di atas 18 detik, jadi aman, tapi ini
  asumsi BELUM DICEK dengan pengukuran langsung di edge.
- **Badge status hanya mewakili percobaan terakhir**, bukan kesehatan agregat. Kalau satu kali poll gagal
  lalu poll berikutnya sukses, badge kembali OK — memang disengaja.
- **Filter kategori berubah** memicu `fetchLiveRssNews` baru (dependency `newsFilter`); saat gagal, artikel
  lama dari kategori sebelumnya tetap tampil dan badge menunjukkan GAGAL. Tidak ada salah klaim, tapi daftar
  bisa tercampur antar kategori.
- `marketOverview.test.js` tidak menyentuh jalur fetch, jadi perubahan header `text/plain` TIDAK tercakup
  tes otomatis mana pun; jaring pengaman satu-satunya adalah skrip `scripts/verify-market-overview.mjs`
  atau tes browser manual.

## 5. Belum dicek

- Hasil nyata `/api/news` setelah deploy (butuh deploy; tidak dilakukan karena aturan tidak commit).
- Waktu respons edge sesungguhnya untuk 2 percobaan × 9000 ms.
- Apakah Home menampilkan 38 baris cross-market setelah deploy (P0-2 sudah diperbaiki di kode, belum diuji end-to-end).
