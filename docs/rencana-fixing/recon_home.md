# Recon: HOME + Market Overview

Scope: `frontend/src/components/cmc/CmcMarketDashboard.jsx` (Home aktif), `hooks/useMarketOverview.js`, `services/marketOverview.js`, `functions/api/scanner.js`.
Semua klaim di bawah punya bukti `path:line`. Yang belum sempat diverifikasi ditandai **BELUM DICEK**.

---

## 1. Kondisi saat ini

### 1.1 Home aktif dan orphan
- Home = `CmcMarketDashboard`. Import: `frontend/src/App.jsx:7`, render di `frontend/src/App.jsx:898-903` (tab `HOME`, cabang `App.jsx:891`).
- `HomeDashboardTab.jsx` **ORPHANED, terkonfirmasi**. Satu-satunya import produk di App.jsx adalah CmcMarketDashboard (`App.jsx:7`); tidak ada import `HomeDashboardTab` di `frontend/src` mana pun. Referensi yang tersisa:
  - file-nya sendiri: `frontend/src/components/HomeDashboardTab.jsx:85` (export default);
  - satu test yang membaca file itu **sebagai teks**, bukan merendernya: `frontend/src/services/__tests__/honestData.test.js:89` (`readCode('components/HomeDashboardTab.jsx')`);
  - sisanya hanya di dokumen (`new plan/MBG_TRADING_UPDATE_PLAN_V3.md:109` menyebut "HomeDashboardTab lama = ORPHANED").
- Artinya: file lama itu mati, tapi masih ada di repo dan masih dipagari test teks. Belum dihapus.

### 1.2 Apa yang sebenarnya bernama "Market Overview"
- `Market Overview` di `CmcMarketDashboard.jsx:353` adalah **judul halaman (h2)**, bukan nama panel. Isi halaman = 4 baris:
  - ROW 1 kartu koin besar: `CmcMarketDashboard.jsx:378-387` (hanya `majors`, kripto).
  - ROW 2 "Market Status" + Watchlist: `CmcMarketDashboard.jsx:389-515`. Metrik kripto saja: Fear & Greed `409-415`, Market Cap/Volume/Koin Aktif `420-435`, Altcoin Season/Dominasi `439-454`.
  - ROW 3 grafik kapitalisasi BTC + Derivatives: `CmcMarketDashboard.jsx:517-608`. Chart = BTC saja (`520-522`, dan catatan jujur di `69-75`, `563`); Derivatives = kripto (`586-607`).
  - ROW 4 "Semua Aset" + "Trending & Topik": `CmcMarketDashboard.jsx:610-776`.
- Sumber data seluruh halaman = satu hook: `frontend/src/hooks/useMarketOverview.js:22` → `fetchMarketOverview` (`marketOverview.js:818`).

### 1.3 Kenapa terlihat "crypto saja"
- Baris 1-3 (kartu besar, Market Status, chart, derivatives, Fear & Greed, Dominance) memang **hanya mengambil field kripto**: `global`, `fearGreed`, `altcoinSeason`, `majors`, `derivatives` (`CmcMarketDashboard.jsx:252-258`), yang di service diisi endpoint CMC/Binance/Hyperliquid saja (`marketOverview.js:829-839`, sumber di `marketOverview.js:30-33`).
- Panel kripto itu by design: komentar menjelaskan Home meniru CoinMarketCap dan konten IDX lama sengaja dipindah ke tab lain (`CmcMarketDashboard.jsx:35-39`).

### 1.4 Kualitas tata letak (temuan konkret)
1. **Duplikasi metrik.** "Market Cap" + "Volume (24h)" muncul dua kali di layar yang sama: `CmcMarketDashboard.jsx:420-429` (panel Market Status) dan lagi `CmcMarketDashboard.jsx:561-569` (panel chart). Nilai chart memakai `chartSeries` (BTC-only, komentar `marketOverview.js:38-45`), yang pertama `global.totalMarketCap` — dua angka berbeda untuk label sama.
2. **Toggle `overview|breakdown` tidak menambah informasi.** `CmcMarketDashboard.jsx:526-538`; isi "breakdown" (`574-582`) = DominanceBar + Dominasi BTC/ETH + Total Aset + Bursa Aktif, yang menimpa DominanceBar di panel yang sama (`451-453`, `452`) dan metric di `420-435`. Efeknya satu panel punya dua kontrol (view + rentang waktu) dan salah satunya hanya menampilkan ulang data.
3. **Judul vs isi tidak sinkron.** Panel judul "Market Status" (`393`) isinya status bursa (`401-403`, `MarketStatusRow`) — sudah benar setelah diperbaiki (`396-399`) — tapi blok Fear & Greed/Dominance/Altcoin Season masih menempel di dalamnya (`406-455`) tanpa header pemisah, jadi secara hierarki terlihat bagian dari "status bursa".
4. **Baris 3 dan 4 terlalu padat satu baris.** `cmc-two-col` (`390`, `518`, `611`) baru stack di <=768px (`frontend/src/index.css:1671-1676`). Pada 1024-1200px, tabel 6 kolom + panel Trending berdampingan (`611`) berdesakan: tabel punya scroll horizontal sendiri (`634-635`), jadi di layar sedang ada **dua scrollbar vertikal bersarang** (tabel `maxHeight 430px` `634` + halaman).
5. **Elemen dekoratif yang sudah pernah diminta dihapus masih ada.** `backdropFilter: blur(16px)` di kartu koin `CmcMarketDashboard.jsx:160-161` dan `blur(20px)` di setiap panel `CmcPanel` (`CmcPrimitives.jsx:385-386`); keputusan audit sebelumnya adalah blur hanya untuk modal/drawer overlay (`anti-slop/audit-001-followup-2026-10-08.md:43`). Blur di ~10 panel sekaligus mahal untuk GPU saat scroll.
6. **Konsistensi font/warna: baik.** Semua label di file ini 12px (`183`, `396`, `409`, `431`, `665`, dst.) dan warna pakai token `var(--cmc-up/--cmc-down/--accent-*)` (`106`, `194`, `355`, `755`). Sisa hardcode ada di `rgba(255,255,255,0.05)` bingkai (`121`, `158`, `387`) dan `#fff` pada tombol aktif (`532`, `547`) — minor.
7. **Footer.** Bar telemetri `CmcMarketDashboard.jsx:778-786` memakai font 11px/`10.5px`, satu-satunya tempat di file ini di bawah 12px, dan isinya branding + disclaimer, bukan data.

---

## 2. Akar masalah: apakah data lintas pasar sudah ada?

**Ya. Sudah ada, dan sudah ditampilkan — tapi hanya di satu tempat.**

- Universe lintas pasar: `CROSS_MARKET_UNIVERSES` `marketOverview.js:515-548` (US 20 ticker, FX 10, COMMODITY 8). Komentar di `marketOverview.js:497-510` menyebut permintaan Jendral Arib 2026-10-08 agar tidak crypto-only.
- Fetcher: `fetchScannerMarket` `marketOverview.js:556-594` (1 POST ke TradingView scanner per market, kolom description/close/change/volume/market_cap/type di `563`), pembungkus `fetchCrossMarketAssets()` `marketOverview.js:597-600`.
- **`fetchMarketOverview` MEMANGGIL-nya sebagai bagian dari `Promise.all`**: `marketOverview.js:828` (destructuring `crossMarket`) dan `marketOverview.js:838` (pemanggilan). Field keluaran bernama **`crossMarket`** (`marketOverview.js:850`, objek hasil `841-856`).
- UI **memakainya untuk tabel aset, bukan cuma Trending**: `CmcMarketDashboard.jsx:259` (`data?.crossMarket`), dipetakan jadi baris `303-313`, digabung dengan crypto `315-316`, filter market `316`, hitungan pill `326-338`, dan dirender di panel "Semua Aset" `610-712` (pill `625`, badge `666`, baris `648-691`).
- Panel **"Trending & Topik" (`714-775`) justru crypto-only**: daftar trending dari `data.trending` CMC (`716-736`) dan topik hasil hitung headline berita (`749-773`) — tidak menyentuh `crossMarket`.
- Jadi jawaban tepatnya: **datanya tersedia dan terpakai, tapi tidak untuk bagian "overview"/headline** (kartu besar, Market Status, chart, derivatives). Yang crypto-only adalah baris 1-3; yang cross-market adalah tabel baris 4.

Bentuk satu baris `crossMarket` (dari `579-592`): `{ market, marketLabel, symbol, fullSymbol, name, type, price, change24h, volume, marketCap }`; baris tanpa harga sudah difilter (`599`).

---

## 3. Opsi perbaikan + trade-off

### Opsi A — Permukaan lintas pasar di atas (angka, bukan tabel). Effort: M
Tambah 1 baris "Global Markets" di antara ROW 1 dan ROW 2: kartu ringkas per market (`US`, `FX`, `COMMODITY`) berisi 1 pemenang/pecundang + breadth (jumlah naik vs turun) dari `crossMarket` yang **sudah** di-fetch. Tidak ada request baru.
- Untung: home langsung terasa multi-asset sesuai permintaan Jendral Arib; nol biaya jaringan.
- Rugi: butuh komponen baru; risiko menambah kepadatan — harus dibayar dengan menghapus duplikasi di §1.4 no.1/2.

### Opsi B — Perluas universe lintas pasar yang sudah ada (tambah instrumen, bukan market). Effort: S
Cukup tambah ticker ke `CROSS_MARKET_UNIVERSES` (`marketOverview.js:522-527`, `533-537`, `543-546`) dan/atau tambah market baru (mis. `indonesia`, sudah ada di allowlist proxy `scanner.js:10`).
- Untung: perubahan 1 file, risiko rendah; karena scanner menerima banyak ticker dalam 1 POST (`marketOverview.js:561-565`), menambah ticker di market yang sama = **0 request tambahan**.
- Rugi: tidak mengubah kesan "home crypto-only" di area atas; tabel makin panjang.

### Opsi C — Panel lintas pasar penuh dengan chart/derivatives non-kripto. Effort: L
Ganti sebagian isi ROW 3 dengan chart atau data US/FX/komoditas.
- Untung: paling menjawab "Market Overview kenapa crypto saja".
- Rugi: tidak ada sumber gratis untuk derivatives non-kripto; chart historis lintas pasar tidak ada di service ini (tidak ada fetcher time-series selain BTC `marketOverview.js:38-45`). Harus bikin fetcher baru + endpoint baru, dan itu menyentuh rate limit (lihat §5).

---

## 4. Rekomendasi (prioritas) + effort + file

1. **P1 — Buang duplikasi dulu, baru tambah.** Hapus MetricTile Market Cap/Volume di `CmcMarketDashboard.jsx:420-429` (biarkan versi chart `561-569`), dan buang toggle `overview|breakdown` `526-538` beserta cabang breakdown `573-583`; taruh Dominance/Altcoin Season sebagai panel metrik sendiri. Effort **S**. File: `CmcMarketDashboard.jsx` saja.
2. **P2 — Tambah 1 baris "Global Markets" (Opsi A)** di atas ROW 2, sumber `crossMarket`. Effort **M**. File: `CmcMarketDashboard.jsx` (+ mungkin `CmcPrimitives.jsx` bila perlu kartu baru).
3. **P3 — Perluas universe (Opsi B)** sedikit untuk memberi isi P2 (mis. tambah 1-2 ETF/indeks dan 1-2 komoditas). Effort **S**. File: `marketOverview.js` (`515-548`).
4. **P4 — Pisahkan blok Fear & Greed/Dominance/Altcoin Season dari panel "Market Status"** jadi panel sendiri. Effort **S**. File: `CmcMarketDashboard.jsx:406-455`.
5. **P5 — Rapikan kepadatan**: beri breakpoint menengah (mis. 1100px) untuk `cmc-two-col`, atau pindahkan panel Trending ke bawah tabel penuh (foto 1 kolom). Effort **S**. File: `frontend/src/index.css:1671-1676`, `CmcMarketDashboard.jsx:611`.
6. **P6 — Hapus blur di panel/kartu home** (sesuai keputusan audit yang belum dieksekusi). Effort **S**. File: `CmcPrimitives.jsx:385-386`, `CmcMarketDashboard.jsx:160-161`.
7. **P7 — Hapus file orphan `HomeDashboardTab.jsx`** + test teks yang menempel padanya. Effort **S**, tapi **butuh keputusan Lead**: test `honestData.test.js:88-91` harus ikut diubah/dihapus, dan `.jsx` itu ~2000 baris. Jangan digabung ke sprint lain.
8. **P8 — Naikkan footer `778-786` ke >=12px** atau hapus baris branding-nya. Effort **S**.

**Yang sebaiknya DIHAPUS (bukan ditambah):** duplikasi Market Cap/Volume (`420-429`), toggle `overview|breakdown` (`526-583`), blur panel (`CmcPrimitives.jsx:385-386` + `CmcMarketDashboard.jsx:160-161`), footer branding (`778-786`), dan file `HomeDashboardTab.jsx` yang sudah mati.

---

## 5. Risiko & hal yang bisa rusak

1. **Rate limit bukan di jalur ini — jangan salah sasaran.** Limit 30 scan/menit per IP + cache edge 10 detik hanya ada di proxy `/api/scanner` (`frontend/functions/api/scanner.js:5`, `:28`). Tapi `fetchScannerMarket` **memanggil TradingView langsung**, bukan lewat proxy: `marketOverview.js:512` (`TV_SCANNER`) dan `:557`. Jadi menambah ticker/market di `CROSS_MARKET_UNIVERSES` **tidak** memakan kuota 30/menit.
2. **Yang benar-benar kurang: tidak ada cache/backoff di service overview.** `getJSON` `marketOverview.js:54-67` selalu `fetch` baru, tanpa cache. Satu siklus `fetchMarketOverview` = **9 request paralel** (`marketOverview.js:829-839`), 3 di antaranya POST scanner (`838` → `598`), dan ini berulang tiap **90 detik** (`useMarketOverview.js:20`, interval `65`). Menambah market baru = +1 request per market per 90 dtk. Kalau nanti diarahkan lewat `/api/scanner` untuk kestabilan, barulah anggaran 30/menit jadi relevan — dan itu harus dibagi dengan `useLivePrices.js:57` yang polling lewat proxy (interval 12 dtk di `useLivePrices.js:686`).
3. **Menambah market baru berisiko CORS/geo.** `marketOverview.js:14-21` mencatat sebagian host diblokir DNS Indonesia (Bybit/OKX/fapi.binance). `scanner.tradingview.com` sudah terverifikasi jalan, tapi market baru (mis. bursa lain) belum.
4. **Kalau `crossMarket` gagal, UI diam-diam tetap "crypto-only".** `fetchScannerMarket` mengembalikan `[]` saat gagal (`marketOverview.js:570`) dan baris tanpa harga difilter (`599`); di UI baris 4 hanya menampilkan pesan generik "Sumber data untuk pasar ini sedang tidak mengembalikan hasil." (`700-702`). Tidak ada indikator bahwa lintas pasar sedang mati — kalau P2 ditambah, ini harus diberi state error eksplisit.
5. **Watchlist lintas pasar bergantung pada `market` yang benar.** Baris watchlist membuka `item.market === 'CRYPTO' ? 'CRYPTO' : item.market` (`CmcMarketDashboard.jsx:490`) dan harga fallback cuma `livePrices[item.symbol]` (`483`); untuk US/FX/komoditas harga live kemungkinan tidak ketemu → tampil "—" (`500-504`). **BELUM DICEK** apakah `livePrices` memuat simbol US/FX/komoditas.
6. **Perubahan di P1/P5 menyentuh file yang sama dengan P2/P4** (`CmcMarketDashboard.jsx`) — jangan dikerjakan paralel oleh dua penulis.

---

## 6. Belum dicek

- Apakah `livePrices` (dari useLivePrices) benar memuat simbol US/FX/komoditas sehingga Watchlist lintas pasar hidup. **BELUM DICEK**.
- Perilaku visual nyata (screenshot) pada 1024-1280px: klaim "berdesakan" di §1.4 no.4 berdasarkan CSS/layout, bukan observasi browser. **BELUM DICEK**.
- Apakah test suite lain (selain `honestData.test.js:89`) masih menyentuh `HomeDashboardTab.jsx`. Pencarian hanya menemukan satu test teks. **BELUM DICEK** untuk test di luar `frontend/src`.
- Jumlah baris final `HomeDashboardTab.jsx` saat ini (di dokumen lama disebut 2.007-2.199 baris, `docs/audit_2026-10-02/07_LIVE_COMPARISON_AND_PLAN.md:47`). **BELUM DICEK**.
- Apakah ada endpoint/scanner server-side lain yang menyajikan FX/komoditas historis (untuk Opsi C). **BELUM DICEK**.
