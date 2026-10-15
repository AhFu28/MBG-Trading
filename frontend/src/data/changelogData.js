// Master Changelog Data Registry (Official Documentation & Release History)
// Arsitektur Terpadu Harian: Setiap entri mewakili SATU TANGGAL KALENDER secara utuh dan runtut.

export const CHANGELOG_DATA = [
  {
    "id": "pkg-06102026",
    "sprintLabel": "Sprint 26, 27, 28, 29, 30 (5 rilis pada 6 Oktober 2026)",
    "version": "Package 06102026",
    "semanticVersion": "Tidak tercatat",
    "date": "6 Oktober 2026",
    "status": "LATEST",
    "statusColor": "var(--accent-green)",
    "badgeLabel": "LATEST / FOREX & EMAS DIPULIHKAN XAU ORA ANA BLAS",
    "title": "Update 6 Oktober 2026: Forex & Emas Dipulihkan: XAU Ora Ana Blas + Ora Tau Di-refresh; 24H Change Diperbaiki + Panel \"Uang Sedang Ke Mana\"; Crypto Futures: Data Basi 10 Hari Dipulihkan + Fokus Futures Mu",
    "description": "Ringkasan 5 rilis pada 6 Oktober 2026 - Forex & Emas Dipulihkan: XAU Ora Ana Blas + Ora Tau Di-refresh; 24H Change Diperbaiki + Panel \"Uang Sedang Ke Mana\"; Crypto Futures: Data Basi 10 Hari Dipulihkan + Fokus Futures Murni; Automated WhatsApp Bot Daemon (Baileys + Outbox Queue); One-Click WhatsApp Direct Handoff ([nomor disunting]).",
    "processFlow": [
      {
        "step": "Sprint 30 — Logam, Energi & Indeks Dolar Mlebu Desker",
        "label": "[LAPORAN JENDRAL ARIB] \"forex dan xau dll ga jalan\":"
      },
      {
        "step": "Sprint 29 — Aliran Likuiditas & Perbaikan Umpan Harga",
        "label": "[MASALAH YANG DILAPORKAN PEMILIK] \"24H Change masih 0% semua\":"
      },
      {
        "step": "Sprint 28 — Membongkar Kenapa Tab Futures Tidak Pernah Update",
        "label": "[MASALAH YANG DILAPORKAN PEMILIK] \"KENAPA ITU GA UPDATE\":"
      },
      {
        "step": "Sprint 27 — Zero-Click Automatic Dispatch ke kanal operasional (nomor disunting dari changelog publik, 2026-10-11)",
        "label": "[AUTOMATION BOT] Local WhatsApp Web Daemon (scripts/wa_daemon.mjs):"
      },
      {
        "step": "Sprint 26 — Direct Operator Communication & Payment Confirmation",
        "label": "[OPERATOR WORKFLOW] One-Click WhatsApp Links for Mas Fuad:"
      }
    ],
    "markdownContent": "\n## [2026-10-06] — Forex & Emas Dipulihkan: XAU Ora Ana Blas + Ora Tau Di-refresh\n\n### Sprint 30 — Logam, Energi & Indeks Dolar Mlebu Desker\n- **[LAPORAN JENDRAL ARIB] \"forex dan xau dll ga jalan\"**:\n  - Tak priksa kabeh: **jaringan ora masalah blas.** TradingView mangsuli **28/28 pair** lan **kabeh ticker komoditas** saka laptop iki.\n  - Dadi salah-ne dudu blokir. Ana **rong masalah liya**.\n- **[AKAR 1] XAU ORA ANA NANG DAFTAR — BLAS**:\n  - `forex_scanner.py` mung ngemot **28 pair valas**. Emas, perak, minyak lan indeks dolar (DXY) dipakai nang akeh panggonan (agen arena, news wire, global markets, flow desk), tapi **ora ana sing njupuk**.\n  - Akibate desker iki **ora duwe baris logam sekotak-kotak**.\n  - Saiki dijupuk saka **CFD scanner** (dudu forex scanner — wis tak uji, forex scanner nolak ticker iki):\n    | Instrumen | Jenis | Harga live |\n    |---|---|---|\n    | GOLD (XAU/USD) | Logam | 4130.25 |\n    | SILVER (XAG/USD) | Logam | 60.76 |\n    | USOIL | Energi | 89.73 |\n    | UKOIL | Energi | 100.64 |\n    | DXY | Indeks | 102.16 |\n- **[AKAR 2] ORA ANA SING NGREFRESH**:\n  - Pipeline pungkasan mlaku **sedino kepungkur**, mode `daily_idx_morning`.\n  - Ora ana jadwal otomatis — padha karo kasus futures. Data basi mergo **ora ana sing takon**.\n  - Saiki: `scripts/refresh_forex.py` + jadwal Windows **saben 30 menit**, wis tak uji mlaku (`LastTaskResult: 0`).\n  - Script mung nyentuh **rong key** (`forex_intelligence` + cap waktu makro). Yen TradingView mati, bundle **ora ditimpa**.\n- **[DATA PALSU DIBUWANG] Laporan COT**:\n  - `_fetch_cot_report()` mbalekake **siji baris EUR hardcoded** kanthi angka karangan (`net_speculative 50000`, `sentiment LONG`) sing disuguhake minangka bacaan CFTC.\n  - Kuwi **data karangan nang alat trading**. Data COT asli butuh file mingguan CFTC sing ora dijupuk pipeline iki.\n  - Saiki field-e **kosong**. Luwih becik ora ana ketimbang goroh.\n- **[BUG LIYA SING TAK TEMOKNO] Setup mung saka tandha owah-owahan**:\n  - Kode lawas: `setup = \"LONG\" if change > 0 else \"SHORT\"` — dina mudhun **kabeh** dilabel SHORT. Kuwi **dudu setup**.\n  - Saiki dijupuk saka kolom sinyal TradingView: `|signal| > 0.1` → LONG/SHORT, liyane NEUTRAL. Keyakinan uga ngikuti kekuwatan sinyal.\n- **[BUG UI] Desimal hardcoded**:\n  - `const decimals = isJpy ? 3 : 5` nggawe GOLD katon **`4130.25000`** — ora kaya dealing desk nyebut.\n  - Saiki ngikuti instrumen: logam/energi/indeks **2 desimal**, JPY 3, valas liyane 5.\n- **[FALLBACK JUJUR]** Yen ora ana bursa sing bisa diakses, baris lawas diisi `price=1.0` kanggo kabeh 28 pair — tembok `1.00000` sing **ketok kaya rega datar sing nyata**. Saiki ditandhani `DATA_UNAVAILABLE` kanthi rega 0.\n- **[TAB ANYAR]** **🥇 EMAS & KOMODITAS** nang `ForexCommandTab` — tabel kapisah kanggo logam, energi lan indeks dolar.\n- **[VERIFIKASI]**:\n  - **30 tes anyar** `test_forex_scanner.py`: XAU kudu ikut dipindai, desimal saben instrumen, setup saka sinyal (dudu tandha owah-owahan), COT ora tau dikarang, lan fallback ora nate nggawe rega palsu.\n  - **122 tes engine** lulus (30 anyar) + 206 tes frontend. Build bersih 1,59s.\n  - Data live: GOLD `4130.25` · SILVER `60.76` · USOIL `89.73` · UKOIL `100.64` · DXY `102.16` · 28 pair valas kabeh keisi.\n\n---\n\n## [2026-10-06] — 24H Change Diperbaiki + Panel \"Uang Sedang Ke Mana\"\n\n### Sprint 29 — Aliran Likuiditas & Perbaikan Umpan Harga\n- **[MASALAH YANG DILAPORKAN PEMILIK] \"24H Change masih 0% semua\"**:\n  - **Dua bug bertumpuk**, keduanya ditemukan dengan mengukur langsung ke Binance:\n    1. **Stream dibatasi 99 simbol.** Kode berlangganan `!miniTicker@arr`. Diuji langsung: hanya **15 dari 60 pair** kita yang pernah datang. 45 pair lain diam-diam memakai nilai bundle, jadi kolom 24h Change tampak beku di 0.00%.\n    2. **Open price yang hilang dipaksa jadi nol.** Baris `openP > 0 ? ... : 0` membuat perubahan yang **tidak diketahui** dirender sebagai **\"datar\"**, lalu nilai nol itu **menimpa data server yang sebenarnya benar**. Perubahan yang tidak diketahui sekarang menjadi `null` dan data lama dipertahankan.\n  - Solusi: **satu panggilan REST** `ticker/24hr` tanpa parameter — diuji live: **HTTP 200, 3.723 simbol, 1.863 KB, 1,2 detik, 58 dari 60 pair** kita cocok. WebSocket tetap dipakai agar harga berdenyut lebih cepat, REST jadi penopang utama tiap 30 detik.\n  - Panggilan `?symbols=[...]` **dibuang**: daftar dalam kurung siku harus di-encode persis atau Binance menjawab `HTTP 400 Invalid symbol` — rapuh dan sudah terbukti gagal.\n  - Poll TradingView tiap 12 detik **dihapus**: dependensi pihak ketiga tanpa autentikasi, kegagalannya ditelan `catch` kosong, dan sekarang tidak diperlukan lagi.\n- **[FITUR BARU] Panel \"🔥 UANG SEDANG KE MANA\"** (tab pertama, langsung terbuka):\n  - Menjawab pertanyaan pemilik: *\"liquidity lagi rame dimana... biar oh karna duitnya pada kesana jadi bisa tradingin pair itu\"*.\n  - **Bukan papan peringkat volume.** Volume besar dengan Open Interest datar hanya berarti koin yang sama berpindah tangan — tidak ada uang baru. Sinyal yang layak ditradingkan adalah **turnover tinggi DAN Open Interest naik DAN arah jelas**.\n  - **Skor = 40% kenaikan OI + 25% turnover + 20% keyakinan arah + 15% funding ekstrem.**\n  - Setiap baris menyertakan **label aliran** dalam bahasa manusia: `Uang Baru Masuk — LONG`, `Short Covering`, `Long Likuidasi`, `Posisi Bertambah, Arah Belum Jelas`, atau `Searah / Churn`.\n  - Setiap baris juga menyertakan **alasan konkret** (misal *\"Harga turun 1.04% sambil OI naik\"*), supaya trader tidak diminta mempercayai angka tanpa penjelasan.\n  - **Regime pasar** ditampilkan di header: `POSISI BERTAMBAH`, `LONG AGAK PADAT`, `POSISI DITUTUP`, atau `CAMPURAN`.\n  - Peringatan kejujuran: kenaikan OI dibatasi 15% agar satu pair parabola tidak mendominasi; baris `offline_fallback` **tidak pernah** ikut dinilai.\n- **[BUG YANG DITEMUKAN TES SENDIRI]** Pair dengan turnover terbesar tapi OI datar hanya mendapat alasan *\"turnover terbesar\"* dan **tidak pernah** diberi tahu bahwa tidak ada sinyal arah. Itu membuat churn tampak seperti peluang. Sekarang selalu ditambahkan *\"Belum ada sinyal arah — likuiditas hanya berputar\"*.\n- **[VERIFIKASI]**:\n  - **27 tes baru** `test_liquidity_heat.py` + **28 tes** `test_crypto_futures.py` (total **55**), termasuk tes bahwa pair dengan OI naik **mengalahkan** pair dengan volume 4x lebih besar tapi OI datar — janji inti fitur ini.\n  - 206 tes frontend lulus. Build bersih 1,52s. Jadwal 30 menit tetap berjalan.\n  - Data live: BTC `-1.04%` dengan OI naik; NEAR `+6.49%` dengan OI naik.\n\n---\n\n## [2026-10-06] — Crypto Futures: Data Basi 10 Hari Dipulihkan + Fokus Futures Murni\n\n### Sprint 28 — Membongkar Kenapa Tab Futures Tidak Pernah Update\n- **[MASALAH YANG DILAPORKAN PEMILIK] \"KENAPA ITU GA UPDATE\"**:\n  - Ditemukan data `crypto_futures` **terakhir diperbarui 26 September 2026** — beku **10 hari** tanpa peringatan apa pun.\n  - Penyebabnya bukan crash. Sistem tidak error, hanya diam-diam menyajikan angka nol.\n- **[AKAR MASALAH 1] Hanya Binance, dan Binance Diblokir di Indonesia**:\n  - `fapi.binance.com` → **SSLError**. Begitu juga `fapi1/2/3.binance.com`, `www.okx.com`, dan `api.bybit.com`.\n  - Setiap permintaan gagal → setiap metode jatuh ke cabang `offline_fallback` → Funding, Open Interest, dan Long/Short semuanya **nol sejak 26 September**.\n  - **Yang masih bisa diakses dari Indonesia: `api.gateio.ws`** (HTTP 200).\n  - Solusi: rantai fallback Binance → Gate.io. Binance tetap **dicoba lebih dulu** karena API-nya lebih kaya dan berfungsi normal dari jaringan luar Indonesia; fetcher menyelidiki **sekali** lalu memakai bursa mana pun yang benar-benar menjawab. Kode yang sama jadi benar di laptop Kediri maupun di VPS Singapura.\n- **[AKAR MASALAH 2] Likuidasi Selalu $0**:\n  - `_fetch_liquidations` mengembalikan **array kosong** dengan komentar *\"sampai WebSocket likuidasi dipasang\"* — WebSocket-nya ternyata **tidak pernah dipasang**.\n  - UI membaca `liquidations_24h.largest_single`, sedangkan array tidak punya key itu → tab Likuidasi **mustahil menampilkan apa pun selain $0**.\n  - Solusi: bentuk data diperbaiki jadi **object** dengan `largest_single`, `total_usd`, `long_usd`, `short_usd`, dan rincian per pair. Gate.io menyediakan datanya.\n- **[AKAR MASALAH 3] Tidak Ada Jadwal Otomatis**:\n  - `Get-ScheduledTask` untuk MBG: **kosong**. Telemetri kripto hanya menyegar kalau seseorang menjalankannya manual — dan tidak ada yang menjalankan.\n  - Solusi: `scripts/refresh_crypto_futures.py` + jadwal Windows **setiap 30 menit**, sudah diuji berjalan (`LastTaskResult: 0`).\n  - Script ini **hanya menyentuh satu key** (`crypto_futures`). Sudah diverifikasi: **23 bagian bundle lain tidak tersentuh sama sekali**.\n  - Jika semua bursa mati, bundle **tidak ditimpa** — data lama dibiarkan utuh daripada diganti nol.\n- **[FOKUS FUTURES MURNI] DexScreener Dikeluarkan dari Desker Ini**:\n  - Tab bernama \"CRYPTO FUTURES & DEXSCREENER RADAR\" mencampur **perpetual futures** (instrumen CEX) dengan **trending pair DEX/memecoin** (instrumen on-chain). Dua pasar berbeda, dua keputusan berbeda.\n  - Trader yang membaca funding rate tidak perlu melihat peluncuran pump.fun di layar yang sama.\n  - **232 baris kode DexScreener dihapus** dari `CryptoFuturesTab.jsx`. Chunk turun **39 KB → 27 KB**.\n  - Cakupan on-chain tetap ada di **Memecoin Radar** dan **Degen Desk** — tidak ada kemampuan yang hilang, hanya dipindah ke tempat yang benar.\n- **[KEJUJURAN LABEL]** Klaim **\"REALTIME GACOR\"** dan **\"STREAM FORCED LIQUIDATIONS (REAL-TIME)\"** dihapus. Data likuidasi diambil saat pipeline berjalan, **bukan streaming per detik**. Label sekarang menyebut jendela waktu yang sebenarnya.\n- **[VERIFIKASI]**:\n  - **28 tes baru** `test_crypto_futures.py`: pemilihan sumber, kebijakan zero-simulation, **bentuk data likuidasi** (regresi yang membuat tab selalu $0), dan pemetaan field Gate.io. Semua berjalan offline.\n  - **206 tes frontend** + 34 tes VIP router tetap lulus. Build bersih 1,52s.\n  - Data live terverifikasi: BTC funding `+0.0026%` @ `$85,550`, OI `$4.37B`, L/S `51.4%/48.6%`, likuidasi 24 jam `$7.15M`.\n\n---\n\n## [2026-10-06] — Automated WhatsApp Bot Daemon (Baileys + Outbox Queue)\n\n### Sprint 27 — Zero-Click Automatic Dispatch to Mas Fuad ([nomor disunting])\n- **[AUTOMATION BOT] Local WhatsApp Web Daemon (`scripts/wa_daemon.mjs`)**:\n  - Ditenagai `@whiskeysockets/baileys` melalui koneksi WebSocket resmi WhatsApp Web (ringan, pure Node.js, tanpa Chrome/Puppeteer berat).\n  - Menyediakan embedded HTTP REST microservice di `http://127.0.0.1:5055` (`/status`, `/send-fuad`, `/send`, `/qr`, `/`).\n  - Dilengkapi antrean Outbox (`wa_auth/outbox_queue.json`) otomatis: jika bot offline atau baru menyala, pesan tidak akan hilang melainkan disimpan di antrean dan langsung dikirim secara beruntun begitu bot terkoneksi.\n  - Sesi login terenkripsi disimpan secara lokal di folder `wa_auth/` (terlindungi di `.gitignore`, tidak pernah ter-commit).\n- **[VISUAL QR CODE DASHBOARD]**:\n  - Saat pairing awal, QR code otomatis muncul di terminal ASCII (`qrcode-terminal`) DAN di web browser visual SVG `http://127.0.0.1:5055/` dengan auto-refresh setiap 6 detik.\n  - Cukup 1x scan QR dari aplikasi WhatsApp di HP (Perangkat Tertaut), selanjutnya bot terhubung permanen tanpa perlu scan ulang.\n- **[CROSS-LANGUAGE CLI & PYTHON BRIDGE]**:\n  - Node.js CLI: `npm run wa:start`, `npm run wa:status`, `npm run wa:qr`, dan `npm run wa:send \"pesan\"`.\n  - Python engine module: `engine/send_wa_fuad.py` dengan fungsi `send_wa_mas_fuad(text)`.\n- **[VERIFIKASI & QA]**:\n  - Unit test Python `engine/tests/test_send_wa_fuad.py` (3 tests).\n  - 206 tes frontend tetap 100% passing.\n  - 34 tes VIP signal router tetap passing.\n\n---\n\n## [2026-10-06] — One-Click WhatsApp Direct Handoff ([nomor disunting])\n\n### Sprint 26 — Direct Operator Communication & Payment Confirmation\n- **[OPERATOR WORKFLOW] One-Click WhatsApp Links for Mas Fuad**:\n  - Semua catatan eksekutif dan briefing Javanese-Kediri `💬 Untuk Mas Fuad` kini otomatis dilengkapi link langsung `wa.me/[nomor disunting]?text=...`.\n  - Satu kali klik (mobile/desktop) langsung membuka aplikasi WhatsApp atau web dengan pesan bersih yang sudah terisi siap kirim (tanpa perlu manual copy-paste atau ketik ulang nomor).\n  - Parser cerdas `cleanForWhatsApp()` membersihkan format markdown, wrapper quote, asterisks ganda, dan header tanpa merusak substansi dialek Kediri.\n- **[PAYMENT DESK INTEGRATION] WhatsApp Confirmation Button on Subscription Page**:\n  - Pada `SubscriptionPage.jsx`, setelah bagian rekening BCA & QRIS, ditambahkan tombol konfirmasi pembayaran langsung ke WhatsApp Mas Fuad ([nomor disunting]).\n  - Pesan otomatis menyertakan email akun pendaftar sehingga admin langsung tahu email mana yang perlu diaktifkan via query SQL tanpa tanya bolak-balik.\n- **[VERIFIKASI & QA]**:\n  - 23 tes unit baru pada `whatsappHandoff.test.js` mencakup normalisasi berbagai format nomor Indonesia (`+62`, `08`, `62`, spasi, dash), URL encoding, sanitasi pesan, dan edge cases.\n  - Total 206 tes frontend lolos (100% passing).\n  - 34 tes engine Python lolos. Build produksi Vite bersih 1.87s."
  },
  {
    "id": "pkg-05102026",
    "sprintLabel": "Sprint 16, 22, 23, 24, 25 (3 rilis pada 5 Oktober 2026)",
    "version": "Package 05102026",
    "semanticVersion": "Tidak tercatat",
    "date": "5 Oktober 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / SISTEM AKUN, LANDING PAGE & LANGGANAN BERBAYAR",
    "title": "Update 5 Oktober 2026: Sistem Akun, Landing Page & Langganan Berbayar; Aktivasi VIP: Provenance, Pengaman Kesegaran & Perbaikan Pipeline; Arena Frequency Fix & Honest Scheduling Claims",
    "description": "Ringkasan 3 rilis pada 5 Oktober 2026 - Sistem Akun, Landing Page & Langganan Berbayar; Aktivasi VIP: Provenance, Pengaman Kesegaran & Perbaikan Pipeline; Arena Frequency Fix & Honest Scheduling Claims.",
    "processFlow": [
      {
        "step": "Sprint 25 — Dari Satu Kata Sandi Bersama Menjadi Akun Per-Pengguna",
        "label": "[PERUBAHAN MODEL BISNIS] Pengunjung Kini Daftar Sendiri, Free Sangat Terbatas:"
      },
      {
        "step": "Sprint 24 — Menutup Celah yang Hampir Mengirim Sinyal Basi ke Pelanggan Berbayar",
        "label": "[TEMUAN KRITIS — AKTIVASI DIHENTIKAN] Data Trade Plan Basi 18 Hari:"
      },
      {
        "step": "Sprint 23 — Menghilangkan \"16 Bot Kembar\" & Memperbaiki Kegagalan Senyap Data Tunggal",
        "label": "[LAPORAN PEMILIK] \"Bot iki ancen aneh\" — Terbukti Benar, Akar Masalah Ditemukan:"
      },
      {
        "step": "Sprint 22 — Menghilangkan Klaim \"24/7\" yang Tidak Akurat & Memperbaiki Cakupan Mesin 10×",
        "label": "[TEMUAN TERUKUR] Arena \"24/7 tiap 5 menit\" Ternyata Hanya Jalan 5–6× Sehari:"
      },
      {
        "step": "Sprint 16 — Multi-Agent UI/UX Audit Remediation (playbook panel: Navigator + Forge + Scout)",
        "label": "[COCKPIT UI/UX] Light-Mode Critical Contrast Fixes (WCAG 2.2 AA):"
      }
    ],
    "markdownContent": "\n## [2026-10-05] — Sistem Akun, Landing Page & Langganan Berbayar\n\n### Sprint 25 — Dari Satu Kata Sandi Bersama Menjadi Akun Per-Pengguna\n- **[PERUBAHAN MODEL BISNIS] Pengunjung Kini Daftar Sendiri, Free Sangat Terbatas**:\n  - Sebelumnya: satu kata sandi bersama, siapa pun yang tahu langsung dapat akses penuh sebagai PRO.\n  - Sekarang: landing page → daftar gratis → akun FREE dengan fitur terbatas → bayar untuk membuka Pro.\n  - **Peta tier** (`featureAccess.js`) adalah satu-satunya sumber kebenaran: **GUEST** (4 modul publik), **FREE** (+News), **PRO** (14 modul analitik).\n  - Modul yang dikunci Pro: AI Arena, Early Signal Radar, Degen Desk, Charting, Whale Tracker, Forex, US Stocks, Futures, Sentinel, Saham IDX, Crypto Spot, Heatmap, Watchlist, Flow Process.\n- **[KEAMANAN] Kata Sandi Ditangani Supabase Auth, Bukan Kode Kita**:\n  - Roll-your-own password hashing adalah penyebab paling umum kebocoran kredensial. Tidak ada hash/salt/password yang disimpan di repo ini.\n  - Cookie sesi `HttpOnly` + `Secure` + `SameSite=Strict` — tidak dapat dibaca JavaScript, sehingga bug XSS tidak bisa mencuri sesi.\n  - `JWT_SECRET` dipisah dari `SUPABASE_ANON_KEY`. Kunci `service_role` **tidak pernah** dipakai di sisi klien.\n  - Baris di `supabase/schema.sql` mengaktifkan **Row Level Security** dengan hanya policy SELECT untuk baris milik sendiri. Pengguna **tidak bisa** memberi dirinya tier Pro walau mengubah JavaScript.\n- **[ANTI-KEDALUWARSA] Langganan Habis → Akses Otomatis Dicabut**:\n  - Tier dihitung ulang dari `expires_at` **setiap kali dibaca**. Tidak perlu cron job untuk mencabut akses — pelanggan yang habis langsung turun ke Free.\n  - Tanggal yang tidak terbaca diperlakukan sebagai **tanpa kedaluwarsa**, bukan sebagai habis: lebih baik pelanggan yang membayar tetap masuk daripada terkunci karena salah ketik.\n  - `expired: true` dikirim ke UI agar penurunan akses **dijelaskan**, bukan terjadi diam-diam.\n- **[TOOLING] Perpanjangan Tidak Menghanguskan Sisa Hari**:\n  - `activate_subscription(email, hari, catatan)` menambah dari tanggal berakhir yang ada, bukan dari hari ini. Pelanggan dengan sisa 10 hari yang membeli 30 hari mendapat **40 hari**.\n  - Tersedia juga `deactivate_subscription()` dan query pengingat perpanjangan 7 hari.\n- **[BUG NYATA YANG DITEMUKAN PEMERIKSAAN SENDIRI]**:\n  1. **Jalur impor salah** — `_shared.js` mengimpor `./_jwt.js` padahal file berada di `../_jwt.js`. Semua endpoint akun akan gagal saat deploy; tertangkap sebelum push.\n  2. **`PUBLIC_MODULES` tidak konsisten** — daftar publik ditulis terpisah dari peta tier dan langsung saling bertentangan (`SIGNALS` dinyatakan publik tapi peta tier menolak tamu). Sekarang **diturunkan otomatis** dari peta tier sehingga tidak bisa lagi berbeda.\n  3. **`String(['pro'])` menjadi `'pro'`** — tier non-string bisa lolos sebagai Pro. `normalizeTier` kini **menolak non-string** alih-alih mengonversinya.\n  4. **Struktur JSX rusak** — penghapusan `PasswordGate` menyisakan tag tak seimbang; build gagal. Diperbaiki dengan Fragment.\n- **[HALAMAN BARU]**:\n  - **LandingPage** — halaman penjualan: hero, daftar modul per tier, tabel harga, dan **disclaimer risiko permanen**. Mengandung pernyataan tegas bahwa sistem ini adalah alat screening, bukan penasihat investasi, dan tidak menjanjikan keuntungan.\n  - **AuthPanel** — masuk/daftar, plus tautan tersembunyi \"akses pemilik\" agar pemilik tidak pernah terkunci dari sistemnya sendiri.\n  - **SubscriptionPage** — status langganan, sisa hari, langkah pembayaran manual, rekening transfer & QRIS dengan tombol salin, dan tabel perbandingan paket.\n- **[VERIFIKASI]**:\n  - **171 tes frontend lulus** (naik dari 144), termasuk 27 tes khusus jalur akun: penolakan cookie palsu, konfigurasi belum diisi mengembalikan 503 (bukan diam-diam memberi akses), validasi email/kata sandi, dan pencabutan Pro saat kedaluwarsa.\n  - Build produksi bersih 1,55s. Chunk `LandingPage` (15 KB) dan `SubscriptionPage` (9 KB) terpisah — pengunjung yang belum masuk **tidak** mengunduh bundel cockpit.\n  - **34 tes Python** tetap lulus.\n- **[PANDUAN]** `docs/PANDUAN_AKUN_DAN_LANGGANAN.md` — panduan setup Supabase langkah demi langkah, cara mengaktifkan pelanggan, query pengingat perpanjangan, dan batas sistem yang perlu diketahui pemilik (aktivasi masih manual; gating klien bukan tembok beton).\n\n---\n\n## [2026-10-05] — Aktivasi VIP: Provenance, Pengaman Kesegaran & Perbaikan Pipeline\n\n### Sprint 24 — Menutup Celah yang Hampir Mengirim Sinyal Basi ke Pelanggan Berbayar\n- **[TEMUAN KRITIS — AKTIVASI DIHENTIKAN] Data Trade Plan Basi 18 Hari**:\n  - Saat hendak mengaktifkan VIP, ditemukan trade plan terakhir dibuat **17 September** — sudah **18 hari**.\n  - **Bukti kerugian nyata**: plan CUAN menuliskan entry **Rp 945**, sedangkan harga pasar saat itu **Rp 840** (selisih **−11%**).\n  - Jika VIP diaktifkan tanpa pemeriksaan, grup berbayar akan menerima **\"Beli CUAN di Rp 945\"** padahal harga sudah jauh di bawah. Penerima membeli di harga yang tidak ada lagi.\n  - **Keputusan**: aktivasi **dihentikan**, akar masalah diperbaiki lebih dulu.\n- **[PERBAIKAN HULU] Generator Trade Plan Kini Menulis Provenance**:\n  - `llm_brain.py` sebelumnya hanya menulis `created_at`. Kini juga menulis:\n    - **`source`** — fetcher mana yang benar-benar menghasilkan data (IDXMarketFetcher + TechnicalIndicators untuk IDX; CryptoSpotFetcher untuk kripto).\n    - **`observed_at`** — waktu data benar-benar diamati, diambil dari timestamp fetcher atau record terbaru.\n    - **`data_state`** — `live`.\n  - Ditambahkan helper `_market_observed_at()` dengan urutan preferensi: timestamp snapshot → timestamp per-record terbaru → waktu sekarang (jujur sebagai \"dibaca saat ini\").\n- **[PERBAIKAN HILIR] Pengaman Kesegaran di Gerbang VIP**:\n  - Ditambahkan ambang bertingkat di `vip_signal_router.py`:\n    - **> 48 jam → DIBLOKIR total** sebagai sinyal presisi.\n    - **12–48 jam → dikirim dengan peringatan** \"aging\".\n    - Timestamp tidak terbaca → **diblokir** (tidak bisa diverifikasi = tidak layak dijual).\n  - `provenance_gap()` dan `route()` kini menerima parameter `now` yang dapat di-inject, sehingga pengujian dan replay mengevaluasi kesegaran terhadap jam tetap, bukan waktu berjalan.\n  - **Plan 17 September sekarang otomatis diblokir** (429,6 jam) — masalah ini tidak dapat terulang.\n- **[BUG PIPELINE] `UnboundLocalError` di Mode `daily_idx_morning`**:\n  - Pipeline **crash** di akhir saat menyusun bundle: `cannot access local variable 'broker_summaries'`.\n  - **Penyebab**: `broker_summaries` (dan 13 variabel lain) hanya diinisialisasi di dalam blok analitik berat yang tidak berjalan pada semua mode.\n  - **Perbaikan**: seluruh 14 variabel diinisialisasi di awal `main()`. Sekaligus menghapus deklarasi duplikat yang membingungkan.\n  - **Hasil**: pipeline selesai bersih dalam **4,64 detik**, menghasilkan **12 trade plan segar** dengan provenance lengkap.\n- **[VERIFIKASI END-TO-END]**:\n  - Dry-run VIP dengan data segar: **12 plan lolos gerbang kejujuran** — tidak ada lagi blokir \"missing provenance\" maupun \"stale\".\n  - **Alat backfill** (`scripts/backfill_plan_provenance.py`) dibuat untuk memperbaiki plan lama tanpa menunggu pipeline — mengambil `source` dari market plan dan `observed_at` dari `created_at` yang asli, bukan mengarang data.\n  - **Panduan aktivasi lengkap** (`docs/PANDUAN_AKTIVASI_VIP.md`) untuk Mas Fuad: cara ambil token @BotFather, cara ambil chat ID grup, cara daftar pelanggan, dan cara menguji.\n  - **Keamanan**: `vip_subscribers.json`, `.env`, dan `.venv/` dipastikan masuk `.gitignore` agar chat ID pelanggan tidak pernah ter-commit.\n  - **Tes**: **50 tes Python lulus** (termasuk 9 tes kesegaran baru), **92 tes frontend lulus**. Dua bug nyata ditemukan oleh tes saat pengerjaan (parameter `now` tidak diteruskan; `route()` memakai waktu berjalan).\n\n---\n\n\n### Sprint 23 — Menghilangkan \"16 Bot Kembar\" & Memperbaiki Kegagalan Senyap Data Tunggal\n- **[LAPORAN PEMILIK] \"Bot iki ancen aneh\" — Terbukti Benar, Akar Masalah Ditemukan**:\n  - Audit state produksi 5 Oktober menemukan tiga gejala yang saling berkaitan:\n    1. **16 agen hanya punya 6 logika.** AVATAR, CHAOS, OCEANIC, dan TEMPEST menjalankan aturan `Synthesis (chg >= 0)` yang **persis identik**.\n    2. **Posisi kembar.** `XAUUSD SHORT` dibuka oleh **12 agen berbeda** di entry **sama persis (4205,3)**; `FETUSDT` oleh 14 agen di `0,2369`.\n    3. **Agen mandek.** 12 dari 16 agen **belum pernah menutup satu trade pun** dalam 3 hari; hanya 4 trade tertutup, semuanya −0,92%.\n  - **Kesimpulan jujur:** itu bukan 16 strategi berbeda, melainkan **1 strategi dijalankan 16 kali**. Menjualnya sebagai \"16 bot otonom\" akan menyesatkan pelanggan.\n- **[AKAR MASALAH KEDUA — KEGAGALAN SENYAP] Hanya 1 Instrumen yang Berhasil Diambil**:\n  - Ditemukan saat pengujian: `fetch_live_prices()` hanya mengembalikan **1 instrumen (XAUUSD)**.\n  - **Penyebab:** `api.binance.com` **tidak dapat diakses dari jaringan ini** (TLS handshake ditolak), sementara Yahoo Finance tetap lolos. Runner **gagal secara senyap** tanpa peringatan apa pun.\n  - **Akibatnya:** seluruh universe kripto kosong, sehingga semua agen wajib memilih emas — inilah sebab sebenarnya 12 agen menumpuk di XAUUSD.\n  - **Perbaikan:** multi-host fallback (`api.binance.com` → **`data-api.binance.vision`** → `api1` → `api2`). Mirror publik resmi Binance terbukti dapat diakses.\n  - **Hasil:** dari **1 instrumen menjadi 3.110 instrumen**. Jika semua host gagal, sekarang dicatat sebagai **ERROR eksplisit** — bukan lagi kegagalan senyap.\n- **[PERBAIKAN UTAMA] Agent DNA — Setiap Agen Kini Punya Aturan Sendiri**:\n  - Ditambahkan tabel `AGENT_DNA` dengan 16 entri, masing-masing berisi:\n    - **`family`** — logika keputusan, kini **unik per agen** (16 family berbeda, tidak ada yang berbagi).\n    - **`sens`** — pengali sensitivitas ambang batas (0,72–1,35).\n    - **`min_conf`** — ambang keyakinan milik agen itu sendiri (62–80), sebelumnya **dipatok 68 untuk semua**.\n    - **`assets`** — preferensi instrumen: `crypto` / `commodity` / `majors` / `both`.\n    - **`bias`** — kecenderungan arah (−0,30 hingga +0,30).\n  - **10 family baru dibuat** agar tidak ada duplikasi: `smc_tight`, `donchian_fast`, `deep_value`, `impulse`, `fade_break`, `triple_conf`, `vol_expand`, `channel_rev`, `asym_reversal`, `quad_synth`.\n  - Contoh konkret: WATER dan STEAM dulu **identik**; kini WATER memakai `smc` (discount < 40%) sedangkan STEAM memakai `smc_tight` (hanya discount dalam < 25%).\n- **[PERBAIKAN KETIGA] Preferensi Instrumen Sempat Tidak Dihormati**:\n  - Versi DNA pertama tetap membuat semua agen memilih emas, karena pencarian menggabungkan universe agen **dan** daftar penuh lalu mengambil nilai keyakinan tertinggi secara global. XAUUSD (volatilitas tinggi = confidence tinggi) selalu menang.\n  - **Diperbaiki:** pencarian universe agen sendiri **diutamakan dan langsung diterima**; fallback ke daftar penuh hanya jika universe agen benar-benar tidak menghasilkan kandidat.\n  - **Ditambahkan juga batas konsentrasi `MAX_AGENTS_PER_SYMBOL = 4`**. Tanpa ini, satu aset yang melonjak menyerap seluruh arena — persis yang terjadi saat FETUSDT naik +15,7% dan 9 agen menumpuk di harga yang sama.\n- **[HASIL TERUKUR] Sebelum vs Sesudah**:\n\n  | Metrik | Sebelum | Sesudah |\n  |---|---|---|\n  | Instrumen diambil | **1** | **3.110** |\n  | Instrumen dipegang | 4 (12 agen di 1 aset) | **6, maks 4 agen/aset** |\n  | Agen belum pernah trading | **12 dari 16** | **0 dari 16** |\n  | Variasi confidence | semua 68 | **71–95** |\n  | Distribusi arah | menumpuk | 9 SHORT / 7 LONG (seimbang) |\n\n- **[VERIFIKASI & PEMBERSIHAN]**:\n  - **11 tes baru** di `test_agent_dna.py`, termasuk penjaga yang gagal jika: ada dua agen ber-fingerprint sama, ada dua agen ber-`family` sama, semua agen sepakat arah, atau agen `crypto-only` memilih emas.\n  - Verifikasi sidik jari: **16 signature unik, 0 kembar** (sebelumnya hanya 6 perilaku berbeda).\n  - **State arena direset bersih** — 48 posisi kembar tidak layak dipertahankan. Diarsipkan ke `engine/cache/arena_state_ARCHIVE_2026-10-05_twin-logic.json` untuk jejak audit.\n  - Test suite: **11 tes DNA lulus**, **92 tes frontend lulus**.\n\n---\n\n## [2026-10-05] — Arena Frequency Fix & Honest Scheduling Claims\n\n### Sprint 22 — Menghilangkan Klaim \"24/7\" yang Tidak Akurat & Memperbaiki Cakupan Mesin 10×\n- **[TEMUAN TERUKUR] Arena \"24/7 tiap 5 menit\" Ternyata Hanya Jalan 5–6× Sehari**:\n  - Audit commit 5 hari terakhir menunjukkan pola: **1, 6, 6, 5, 5, 5 commit/hari** — bukan 288/hari seperti yang dijadwalkan.\n  - **Efisiensi nyata: ~2% dari jadwal.** Posisi (SL/TP) hanya terkelola tiap beberapa jam, bukan tiap 5 menit.\n  - **Akar masalah**: GitHub Actions **tidak menjamin cron frekuensi tinggi** pada runner gratis — jadwal di bawah 15 menit akan ditunda atau dijatuhkan. Ini batasan platform, bukan bug kode. Mempercepat cron justru memperburuk (antrean menumpuk lalu dibuang).\n  - Runner alternatif (HuggingFace Space) diperiksa: **mati (HTTP 404)**, jadi GitHub Actions satu-satunya jalur.\n- **[PERBAIKAN 2] Cakupan Mesin Naik ~10× (Dari ~20 Menit/Hari ke ~22 Jam/Hari)**:\n  - Strategi diubah dari \"banyak trigger pendek\" menjadi **\"sedikit trigger, job panjang\"** — satu-satunya pendekatan yang benar untuk scheduler GitHub.\n  - Jadwal baru: **4 sesi/hari × ~5j25m** (cron `0 0,6,12,18 * * *`) — sebelumnya 4 menit per run.\n  - Tick diperpanjang 30 → **60 detik**: kompromi sadar antara presisi trailing-stop dan stabilitas, serta menghindari pemborosan request API.\n  - **~325 siklus evaluasi per sesi** (sebelumnya 8).\n  - `timeout-minutes: 350` (di bawah batas keras GitHub 360) dan durasi loop 19.500s dipilih agar **langkah commit selalu tereksekusi** — state tidak pernah hilang.\n  - Commit state memakai `if: always()` sehingga **crash di tengah sesi tetap menyimpan** posisi yang sudah tercapai.\n  - `concurrency: cancel-in-progress: false` dipertahankan agar sesi berjalan tidak pernah dibunuh di tengah pengelolaan posisi.\n- **[PERBAIKAN 1] Klaim Publik Dibersihkan (Klaim \"24/7/Real-time\" Dihapus)**:\n  - **`README.md`**: baris \"AI Agent Arena Loop — Real-time per tick harga\" diganti menjadi frekuensi sebenarnya (**4 sesi/hari × ~5,5 jam, tick 60 detik, cakupan ≈22 jam/hari**) beserta catatan bahwa penjadwal GitHub dapat menunda. Diagram arsitektur \"Tournament Evaluator 24/7\" → \"Periodic Tournament Evaluator\".\n  - **`DataIntegrityModal.jsx`** (modal Provenance Data — justru tempat yang seharusnya paling jujur): provider \"Continuous Micro-Loop (30s Ticks)\" diganti menjadi **\"Scheduled Sessions (4×/hari × ~5,5 jam, tick 60 detik)\"**, status `24/7 ACTIVE` → `PERIODIC ACTIVE`, dan catatan tegas **\"Ini BUKAN engine real-time\"**.\n  - **`arena_runner_247.py`**: docstring \"STANDALONE 24/7 ARENA CONTINUOUS RUNNER\" diganti dengan penjelasan batasan eksplisit (sesi terbatas, bukan daemon; jangan sebut real-time/24/7 di materi pengguna).\n  - Komentar internal di `AiAgentArenaTab.jsx` disesuaikan agar tidak lagi menyebut runner \"24/7\".\n  - **Klarifikasi**: label `CRYPTO: ● 24/7` di UI tetap dipertahankan karena merujuk pada **jam pasar kripto** (yang memang 24/7), bukan mesin arena — itu akurat.\n- **[BUG IKUTAN DIPERBAIKI] Modal Provenance Akan Selalu Berbunyi \"OFFLINE\"**:\n  - Ambang kesegaran sebelumnya **15/60 menit**, diwarisi dari asumsi jadwal 5 menit. Dengan jadwal baru (state hanya di-commit di akhir sesi ~5,5 jam), ambang itu akan **selalu melaporkan OFFLINE** pada mesin yang sehat — alarm palsu yang merusak kepercayaan.\n  - Ambang baru berbasis jadwal nyata: **aktif ≤ 400 menit (~6j40m)**, **DELAYED ≤ 800 menit**, di luar itu baru **OFFLINE**.\n  - Ditambahkan **6 tes penjaga** (`arenaFreshness.test.js`) yang gagal jika seseorang mengembalikan ambang ke nilai 15 menit yang salah.\n- **[VERIFIKASI]**:\n  - Runner diuji langsung: **3 tick berhasil**, mengambil harga live, state tersimpan. State produksi dipulihkan setelah uji agar tidak terkontaminasi.\n  - Test suite: **92/92 lulus** (6 tes kesegaran arena baru).\n  - Build produksi bersih 1,81s; diverifikasi teks lama \"Continuous Micro-Loop\" **hilang** dari bundle dan teks baru **ada**.\n\n---\n\n\n### Sprint 16 — Multi-Agent UI/UX Audit Remediation (playbook panel: Navigator + Forge + Scout)\n- **[COCKPIT UI/UX] Light-Mode Critical Contrast Fixes (WCAG 2.2 AA)**:\n  - **Dark-Surface Resurfacing**: Blok `[data-theme=\"light\"]` baru di `index.css` mengembalikan permukaan terang untuk `.quant-card`, `.quant-card-interactive`, `.quant-pill-nav`, `.quant-pill-btn`, `.quant-input`, `.ticker-chip-interactive`, dan `.mobile-header-hamburger` yang sebelumnya hardcoded gelap (kontras teks terukur **1.09:1** — tidak terbaca).\n  - **Badge AA Text Colors**: Teks badge light mode diganti ke warna lolos AA terukur: `#166534` (bull, **6.34:1**), `#be123c` (bear, **5.50:1**), `#92400e` (alert, **6.67:1**), `#1d4ed8` (blue, **6.0:1**), dengan border 40%-alpha yang dilembutkan.\n  - **Dark Muted Text Bump**: `--text-muted` dark `#64748b` → `#7d8daa` (**3.42:1 → 5.32:1**) untuk label kecil di panel subtle.\n- **[COCKPIT UI/UX] Single Source of Truth Number Formatting (`src/utils/format.js` — NEW)**:\n  - **Locale-Safe IDR/USD**: Helper bersama `formatIdNumber`/`formatIdr` (selalu `id-ID` → `Rp 16.800`), `formatUsd` (selalu `en-US`), `formatPct`, dengan fallback em-dash untuk nilai invalid — menghapus ketergantungan 128 panggilan `.toLocaleString()` pada locale browser (sebelumnya `16,800` di browser en-US vs `16.800` di id-ID).\n- **[COCKPIT UI/UX] Honest Data States & Newcomer Onboarding**:\n  - **Honest RSI (US Stocks)**: Kolom RSI (14) tidak lagi menampilkan nilai palsu `50.0 (NEUTRAL)` dari default pipeline `rsi_14=50`; tepat-50 dirender `—` dengan tooltip bahasa Indonesia (oversold/overbought/netral dijelaskan).\n  - **Real Setup Badges**: Badge setup crypto `{c.setup_type || 'RANGE_ACC'}` dari data engine (TREND_CONTINUATION, dsb.) alih-alih hardcoded `RANGE_ACC` statis di setiap baris.\n  - **Jargon Tooltips & Legend**: Tooltip bahasa Indonesia pada header MKT CAP/P/E/RSI/CHG %/GROSS R:R/NET R:R/Hard SL/TP1, legend Q-Score on-screen (\"skor kuantitatif 0-100 dari momentum, likuiditas, valuasi & arus dana institusi\"), tooltip engine \"TimesFM + SMC (Smart Money Concepts)\".\n  - **Empty State Screener**: State kosong US Stocks screener yang menjelaskan aksi berikutnya (\"Coba reset pencarian atau pilih sector: ALL\").\n- **[COCKPIT UI/UX] Touch Targets, Sticky Column & Layout Tokens**:\n  - **44px Touch Targets**: `min-height` 26/28/32px pada tombol header/chips/sidebar + `@media (pointer:coarse)` 44px pada empat kelas interaktif (WCAG 2.5.5 / Apple HIG 44pt).\n  - **Sticky Ticker Column**: Kolom TICKER sticky (`.sticky-col-num`, sudah terdefinisi di `index.css:544`) di US Stocks screener & MasterQuantLeaderboard dalam container scroll horizontal.\n  - **Spacing Tokens**: Token `--space-1/2/3` (4/8/16px) + warna marquee adaptif light/dark.\n- **[VERIFICATION & QA] Build + Visual + Computed WCAG Evidence**:\n  - **Build**: `npm ci` (63 packages, lockfile; package.json untouched) → `npm run build` ✓ built in 3.19s, zero errors, 19 chunks (diverifikasi ulang secara independen oleh Lead).\n  - **Visual**: 4 screenshot light/dark/US-Stocks/mobile-375px diarsipkan di `docs/screenshots/ui_polish_2026-09-30/` — light mode sepenuhnya terbaca, COMPANY NAME menampilkan nama emiten riil (\"Apple Inc.\", \"NVIDIA Corp.\"), MKT CAP/P/E nilai riil, RSI honest em-dash, mobile 375px bebas overflow & header rapi.\n  - **Computed WCAG**: 5 pasangan warna baru diukur dengan formula relative-luminance WCAG 2.x — semua **PASS ≥ 4.5:1**.\n  - **Files Changed (7)**: `src/utils/format.js` (NEW), `src/index.css`, `src/components/USStockTab.jsx`, `src/components/HomeDashboardTab.jsx`, `src/components/MasterQuantLeaderboard.jsx`, `src/components/LotCalculatorModal.jsx`, `src/App.jsx` — 161 insertions / 59 deletions, semua di dalam `frontend/src/**`."
  },
  {
    "id": "pkg-02102026",
    "sprintLabel": "Sprint 17, 18, 19, 20, 21, 22 (6 rilis pada 2 Oktober 2026)",
    "version": "Package 02102026",
    "semanticVersion": "Tidak tercatat",
    "date": "2 Oktober 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / PERLUASAN CAKUPAN PEMINDAIAN PAGINATION MULTIH",
    "title": "Update 2 Oktober 2026: Perluasan Cakupan Pemindaian: Pagination Multi-Halaman (Tetap Gratis); Perbaikan Kritis: pump.fun Terblokir 403 di Produksi (Edge Proxy); Launch Window Filter: Koreksi Berbasis Dat",
    "description": "Ringkasan 6 rilis pada 2 Oktober 2026 - Perluasan Cakupan Pemindaian: Pagination Multi-Halaman (Tetap Gratis); Perbaikan Kritis: pump.fun Terblokir 403 di Produksi (Edge Proxy); Launch Window Filter: Koreksi Berbasis Data atas Saran Filter Medsos; Jupiter Enrichment: Holder Growth, Organic Demand & Token Audit; Early Signal Radar: Evidence-Based Memecoin Scanner & Simulated Entry Planner; VIP Signal Dispatch, Multi-Chain Degen Desk & Public Payload Leak Closure.",
    "processFlow": [
      {
        "step": "Sprint 22 — Menjawab \"Kenapa Cuma Sedikit?\" dengan Data",
        "label": "[DIAGNOSA] Kenapa Hasil Pemindaian Terlihat Sedikit:"
      },
      {
        "step": "Sprint 21 — Diagnosa Origin-Lock & Solusi Cloudflare Edge Proxy",
        "label": "[BUG PRODUKSI] \"Gagal memuat pump.fun: Failed to fetch\" Hanya di Web Asli:"
      },
      {
        "step": "Sprint 20 — 9 Kriteria Kelayakan & Pelacakan Promosi Berbayar",
        "label": "[KOREKSI PENTING] Saran Filter \"MCap Kecil / LP Kecil / Volume Kecil\" Terbukti Berbahaya:"
      },
      {
        "step": "Sprint 19 — Dari Radar Bukti Menjadi Radar Lengkap (Tetap Tanpa API Key)",
        "label": "[TEMUAN KUNCI] DexScreener Tidak Punya Data Holder — Jupiter Punya, dan Gratis:"
      },
      {
        "step": "Sprint 18 — Deteksi Dini Berbasis Bukti, Bukan Prediksi",
        "label": "[NEW TAB — EARLY SIGNAL RADAR] Pemindai Sinyal Dini Memecoin Solana:"
      },
      {
        "step": "Sprint 17 — Revenue Path Wiring, Memecoin Radar & Attack-Surface Reduction",
        "label": "[REVENUE CRITICAL] VIP Signal Dispatcher Now Actually Fires:"
      }
    ],
    "markdownContent": "\n## [2026-10-02] — Perluasan Cakupan Pemindaian: Pagination Multi-Halaman (Tetap Gratis)\n\n### Sprint 22 — Menjawab \"Kenapa Cuma Sedikit?\" dengan Data\n- **[DIAGNOSA] Kenapa Hasil Pemindaian Terlihat Sedikit**:\n  - Dilakukan analisis funnel terhadap data live untuk menemukan penyebab sebenarnya:\n    - pump.fun diambil: **70 token** (batas keras upstream)\n    - Punya pair DexScreener: **~53%** (16 dari 30 dalam sample) — sisanya masih di bonding curve\n    - Lolos filter 9 kriteria: **7 token** — karena **14 token gagal di LP < $15K**\n  - **Kesimpulan**: hasil sedikit **bukan karena API berbayar**, melainkan karena (a) batas 70 token per request, dan (b) mayoritas memecoin memang tidak punya likuiditas layak.\n- **[TEMUAN] pump.fun Membatasi 70 Token per Request — Bukan per Hari**:\n  - Diuji langsung: `limit=40/60` dihormati, tetapi `limit=100/200/500` **semuanya mengembalikan tepat 70**.\n  - **Pagination `offset` terbukti bekerja** dan **100% gratis**: offset 0/70/140/210 mengembalikan set token yang berbeda.\n  - Verifikasi 8 halaman: **456 token unik** terkumpul (70+70+70+70+70+70+70+70, terdeduplikasi).\n- **[APLIKASI] Pemindaian Multi-Halaman (`fetchPumpFunPages`)**:\n  - Halaman diambil **secara paralel** dengan `Promise.all`; halaman yang gagal dilewati, tidak menggagalkan seluruh pemindaian.\n  - **Deduplikasi berbasis mint** karena jendela pagination dapat tumpang tindih saat token baru terus lahir.\n  - `buildScanUniverse(pageCount)` kini menerima jumlah halaman; `fetchPumpFunActive()` juga.\n  - Batch DexScreener dinaikkan dari 30 → **40 alamat/request** (diuji: 100 alamat pun diterima 200 OK).\n  - Kegagalan satu batch DexScreener tidak lagi membatalkan seluruh hasil.\n- **[UI] Kontrol Ukuran Pool Pemindaian**:\n  - Dropdown baru **\"Jumlah token dipindai\"**: 70 (cepat) / 140 / 280 / **560 token (maksimal)**.\n  - Header tabel menampilkan **\"menampilkan X dari Y token\"** secara transparan, bukan hanya jumlah yang terpotong.\n  - Batas tampilan baris dinaikkan **30 → 200 baris**; filter dan tombol pindai ulang menampilkan status loading.\n- **[BIAYA] Konfirmasi: Semua Sumber Gratis**:\n  - 456 token hanya memerlukan **12 request DexScreener + 19 request Jupiter** (batch 40 dan 25).\n  - Tidak ada API berbayar yang dibutuhkan untuk cakupan ini. Biaya hanya muncul bila nanti butuh **identitas wallet insider** (Helius/Birdeye), yang memang tidak tersedia gratis.\n- **[QA/QC & CERTIFICATION]**:\n  - Test Suite: **86/86 lulus**. Build produksi bersih 1.41s.\n  - Verifikasi live: pagination 8 halaman mengembalikan 456 token unik melalui proxy produksi.\n  - Verifikasi dev: `fetchPumpFunPages` dan `PUMPFUN_PAGE_SIZE` tersaji benar di `localhost:3000`.\n\n---\n\n## [2026-10-02] — Perbaikan Kritis: pump.fun Terblokir 403 di Produksi (Edge Proxy)\n\n### Sprint 21 — Diagnosa Origin-Lock & Solusi Cloudflare Edge Proxy\n- **[BUG PRODUKSI] \"Gagal memuat pump.fun: Failed to fetch\" Hanya di Web Asli**:\n  - **Gejala**: Radar berjalan normal di `localhost:3000`, tetapi **gagal total** di `https://mbg-trading.pages.dev` dengan pesan `Failed to fetch`.\n  - **Diagnosa**: Diuji dengan header `Origin` yang berbeda terhadap endpoint pump.fun:\n    - `Origin: http://localhost:3000` → **200 OK** (diizinkan)\n    - `Origin: https://mbg-trading.pages.dev` → **403 Forbidden** (diblokir WAF Cloudflare pump.fun)\n  - **Akar masalah**: Cloudflare WAF milik pump.fun menerapkan **origin-lock** — hanya mengizinkan origin yang di-whitelist. Ini tidak terdeteksi di dev karena localhost kebetulan diizinkan. Error `Failed to fetch` muncul karena browser memblokir response 403 tanpa header CORS.\n  - **Bukan masalah CORS biasa**: DexScreener (`Access-Control-Allow-Origin: *`) dan Jupiter (mengizinkan origin produksi) terverifikasi **aman** — hanya pump.fun yang terblokir.\n- **[SOLUSI] Cloudflare Pages Edge Function Reverse Proxy (`/api/pumpfun/[[path]].js`)**:\n  - Request diteruskan **server-side** dari edge Cloudflare, sehingga tidak ada header `Origin` browser yang dikirim ke pump.fun — melewati origin-lock sepenuhnya.\n  - Ditambahkan `User-Agent` browser standar untuk kompatibilitas.\n  - **Caching edge** (`max-age=10, s-maxage=20`) melindungi dari rate-limit dan mempercepat response.\n  - CORS bersih dikembalikan ke client (`Access-Control-Allow-Origin` sesuai origin pemanggil yang sah).\n  - Error handling: kegagalan upstream mengembalikan **502** dengan pesan jelas, bukan crash.\n- **[RESILIENSI] Fallback Otomatis di `memecoinDesk.js`**:\n  - Fungsi baru `fetchPumpFunEndpoint()` mencoba **proxy edge lebih dulu**, dan otomatis jatuh ke endpoint langsung jika proxy tidak tersedia (mis. saat dev tanpa fungsi Pages).\n  - Kedua pemanggil (`fetchPumpFunLaunches` dan `fetchPumpFunActive`) kini melalui jalur tunggal ini, sehingga perbaikan berlaku untuk **semua** konsumen pump.fun sekaligus.\n  - Vite dev server diberi proxy `/api/pumpfun` agar perilaku dev dan produksi **identik** — mencegah bug \"jalan di lokal, rusak di produksi\" terulang.\n- **[VERIFIKASI] Diuji Tuntas di Kedua Lingkungan**:\n  - Dev: `http://localhost:3000/api/pumpfun/coins?...` → **200 OK** (2 token terverifikasi).\n  - Produksi: `https://mbg-trading.pages.dev/api/pumpfun/coins?...` → **200 OK**, mengembalikan data live (GSMG, BRR, SULY).\n  - Audit origin menyeluruh: DexScreener tokens ✅, DexScreener boosts ✅, Jupiter lite-api ✅, pump.fun langsung ❌ 403, **pump.fun via proxy ✅ 200**.\n  - Test suite: **86/86 lulus**. Build produksi bersih 1.41s.\n\n---\n\n---\n\n## [2026-10-02] — Launch Window Filter: Koreksi Berbasis Data atas Saran Filter Medsos\n\n### Sprint 20 — 9 Kriteria Kelayakan & Pelacakan Promosi Berbayar\n- **[KOREKSI PENTING] Saran Filter \"MCap Kecil / LP Kecil / Volume Kecil\" Terbukti Berbahaya**:\n  - Saran yang beredar di Threads/Twitter (mcap < $35K, volume < $2.5K, LP < $25K) **diuji langsung terhadap data live** dan hasilnya berlawanan dengan tujuan:\n    - **MCap < $35K**: 62% token aktif masuk kategori ini. Dari **11 token kecil** dengan pair DEX, **7 punya LP = $0** — tidak ada likuiditas sama sekali, posisi tidak bisa dijual.\n    - **LP < $25K**: **11 dari 11** token kecil sudah di bawah $25K. Filter ini tidak menyaring apa pun.\n    - **Volume < $2.5K**: volume kecil bukan berarti \"belum rame\", tetapi \"tidak ada yang membeli\".\n  - **Validasi tambahan**: dari 3 token yang lolos filter lama, **3/3 punya LP = $0**. Filter baru menghasilkan token dengan LP nyata $26K–$71K.\n  - **Kesimpulan**: target yang benar adalah token **MUDA** yang **sudah punya likuiditas nyata** dan permintaan organik — bukan token kecil tanpa likuiditas.\n- **[FILTER BARU — `checkLaunchWindow()`] 9 Kriteria Kelayakan**:\n  - Rentang mcap **$20K–$800K**, likuiditas **≥ $15K**, volume **≥ $1.000/jam**, umur **5 menit – 72 jam**.\n  - **Security gate**: mint authority **wajib** dimatikan, freeze authority **wajib** dimatikan, konsentrasi top holder **< 45%**, holder **≥ 100**, holder tidak menyusut.\n  - **Fail-closed**: data yang tidak tersedia (misalnya token belum ada di Jupiter) dihitung **GAGAL**, bukan lolos. Token tidak boleh melewati gerbang keamanan yang tidak bisa diperiksa.\n  - Setiap kriteria mengembalikan nilai terukur + target, sehingga UI dapat menampilkan alasan penolakan secara spesifik — bukan penolakan buta.\n  - **OR logic** pada authority: mint **atau** freeze masih aktif = fatal (`authorityCompromised`).\n- **[KOL CALLER] Klaim \"Top Caller\" Tidak Dapat Diverifikasi — Diganti Data Boost Nyata**:\n  - **Temuan**: API DexScreener **tidak punya** field `kol`, `caller`, `influencer`, atau `promotedBy` sama sekali (diverifikasi langsung). Klaim \"top caller\" di media sosial umumnya berupa screenshot grup Telegram berbayar, bukan data terverifikasi.\n  - **Pengganti yang jujur**: `fetchBoostedAddressSet()` melacak **promosi berbayar** (boost) yang benar-benar terdata di DexScreener. Token yang sedang boost = sedang dipromosikan; ini fakta, bukan rumor.\n  - Kolom **Promo** baru menampilkan jumlah boost; badge muncul di panel detail. Boost diperlakukan sebagai enrichment saja — kegagalannya tidak pernah merusak pemindaian.\n- **[UI — `MemecoinRadar.jsx`]**:\n  - Panel penjelasan yang menampilkan **mengapa saran filter medsos berbahaya**, dengan angka hasil pengujian live.\n  - Toggle **\"HANYA yang lolos 9 kriteria\"** beserta hitungan token yang lolos.\n  - Kolom baru: **Promo** (boost) dan **Kriteria** (mis. `9/9` hijau, `7/9` kuning, sisanya merah).\n  - Panel detail menampilkan **checklist 9 kriteria** dengan tanda ✓/✗ per baris, sehingga terlihat persis kriteria mana yang gagal.\n- **[QA/QC & CERTIFICATION]**:\n  - Test Suite: **86/86 tes lulus** (earlySignal 53, brokerGateway 14, marketHours 13, memecoinDesk 6).\n  - 11 tes baru untuk launch window, termasuk: penolakan token LP nol (sesuai temuan 7/11 dunia nyata), penolakan mint/freeze authority aktif meski semua kriteria lain sempurna, dan **fail-closed saat data Jupiter tidak ada**.\n  - Ditambahkan **guard test** yang gagal jika seseorang mengubah ambang batas kembali ke angka saran medsos yang terbukti berbahaya.\n  - Validasi live: filter lama meloloskan 3 token dengan LP $0; filter baru meloloskan token dengan LP $26K–$71K.\n  - Build produksi bersih 1.41s.\n\n---\n\n## [2026-10-02] — Jupiter Enrichment: Holder Growth, Organic Demand & Token Audit\n\n### Sprint 19 — Dari Radar Bukti Menjadi Radar Lengkap (Tetap Tanpa API Key)\n- **[TEMUAN KUNCI] DexScreener Tidak Punya Data Holder — Jupiter Punya, dan Gratis**:\n  - Diuji langsung: DexScreener **tidak punya** field `holders`, `holderCount`, `topHolders`, `traders`, atau `devWallet` sama sekali.\n  - **Jupiter `lite-api` (gratis, TANPA API key)** menyediakan persis yang kurang: `holderCount`, `stats1h.holderChange`, `audit.topHoldersPercentage`, `audit.devBalancePercentage`, `mintAuthorityDisabled`, `freezeAuthorityDisabled`, `numNetBuyers`, `numTraders`, volume organik, dan `organicScore`.\n  - **Tidak perlu API berbayar.** Radar sekarang menggabungkan 3 sumber gratis: pump.fun (curve) + DexScreener (harga/volume/txns) + Jupiter (holder/audit).\n  - Verifikasi live: **30 token aktif → 30 pair DexScreener → 25 token ter-enrich Jupiter** dalam satu siklus pemindaian.\n- **[ENRICHMENT — `fetchJupiterTokenData()`] Layer Data Holder & Audit**:\n  - Batch hingga 25 mint per request, dijalankan **paralel** dengan DexScreener (sumber independen, tidak ada alasan diserialisasi).\n  - Kegagalan Jupiter **tidak merusak pemindaian** — baris hanya tetap tanpa data enrichment, bukan error total.\n- **[SCORING BARU — 6 Faktor Jupiter] Sinyal yang Sebelumnya Mustahil**:\n  - **Pertumbuhan holder**: +2% dalam 1 jam → **+20 poin**; holder menyusut ≤ −1% → **−20 poin** dan naik jadi flag risiko. Ini proksi paling jujur untuk \"uang baru sedang masuk\".\n  - **Net buyer**: mayoritas wallet akumulasi → **+15 poin**; net seller → **−15 poin**.\n  - **Volume organik**: membedakan permintaan asli dari wash/bot trading. Beli organik dominan → **+15 poin**; jual organik dominan → **−15 poin**. Volume debu (< $1.000) diabaikan agar tidak menyesatkan.\n  - **Audit authority**: `mintAuthority` masih aktif → **−25 poin** (dev bisa cetak supply tanpa batas); `freezeAuthority` aktif → **−20 poin** (dompet bisa dibekukan).\n  - **Konsentrasi holder**: top holder ≥ 50% → **−25 poin**; ≥ 35% → **−10 poin**; distribusi sehat → **+10 poin**.\n  - **Saldo dev**: masih pegang ≥ 5% supply → **−25 poin** (risiko dump).\n- **[UI — `MemecoinRadar.jsx`] Kolom Baru & Transparansi Sumber**:\n  - Kolom tabel baru: **Holder**, **Δ Holder 1j**, **Top 10 (%)**, dan **badge Audit** (`MINT!` / `FREEZE!` / `SAFE`).\n  - Panel detail menampilkan 18 metrik termasuk holder, net buyer, volume organik, skor organik, saldo dev, dan riwayat mint dev.\n  - Header menampilkan **cakupan sumber data** secara eksplisit (DexScreener / Jupiter / pump.fun) beserta jumlah token yang berhasil di-enrich.\n  - Catatan keterbatasan diperbarui: Jupiter **tidak** menyediakan identitas pemilik wallet top holder — hanya persentase agregat. Identitas wallet tetap tidak ditampilkan karena tidak tersedia, bukan dikarang.\n- **[QA/QC & CERTIFICATION]**:\n  - Test Suite: **75/75 tes lulus** (earlySignal 42, brokerGateway 14, marketHours 13, memecoinDesk 6).\n  - 15 tes baru khusus faktor Jupiter: pertumbuhan holder, net buyer, dominasi organik, mint/freeze authority, konsentrasi holder, saldo dev.\n  - Kasus batas diuji: token tanpa entri Jupiter tetap menghasilkan skor valid tanpa faktor holder; volume organik debu diabaikan; skor tetap dibatasi 0–100.\n  - Skenario bentuk-rug penuh (mint+freeze aktif, top holder 70%, dev 15%, holder menyusut) terbukti menghasilkan **skor 0 dengan verdict HIGH_RISK**.\n  - Build produksi bersih 1.55s.\n\n---\n\n## [2026-10-02] — Early Signal Radar: Evidence-Based Memecoin Scanner & Simulated Entry Planner\n\n### Sprint 18 — Deteksi Dini Berbasis Bukti, Bukan Prediksi\n- **[NEW TAB — EARLY SIGNAL RADAR] Pemindai Sinyal Dini Memecoin Solana**:\n  - **Tab baru `MemecoinRadar.jsx`** di bagian MARKETS, memindai token Solana yang **sedang aktif diperdagangkan** (bukan sekadar peluncuran baru).\n  - **Alur Data Nyata**: `pump.fun (sort=last_trade_timestamp, 60 token)` → resolve ke `DexScreener` (batch 30) → hitung bukti akumulasi. Diuji live: **60 token aktif → 30 pair ter-resolve → semua field analyzer tersedia**.\n  - **Fokus pada token yang BISA dianalisis**: pump.fun sendiri tidak menyediakan data beli/jual/volume, jadi token tanpa pair DEX dipisahkan dan diberi penjelasan eksplisit — bukan ditampilkan dengan angka karangan.\n- **[ENGINE — `earlySignal.js`] Skor Berbasis Bukti dengan Setiap Poin Bisa Ditelusuri**:\n  - **6 Faktor Terukur**: tekanan beli/jual per interval (1j & 5m), akselerasi volume terhadap baseline 24 jam, keamanan likuiditas, turnover, deteksi **akumulasi sebelum harga bergerak** (beli kuat + harga masih flat), dan progres bonding curve.\n  - **Penalti Nyata**: likuiditas < $10.000 (−30 poin), tekanan jual dominan (−20), turnover berlebih/churn (−15), bonding curve hampir kosong (−10).\n  - **Skor Dibatasi 0–100** dan setiap faktor mengembalikan label penjelas — UI menampilkan rincian poin, bukan kotak hitam.\n  - **Risiko Dihitung Terpisah**: token bisa \"early\" DAN scam sekaligus. Verdict `HIGH_RISK` / `CAUTION` / `CLEAN` berasal dari flag risiko konkret (likuiditas tipis, umur < 5 menit, curve kosong, churn tinggi).\n- **[DUMMY ENTRY PLANNER] Rencana Trading Simulasi dari Volatilitas Nyata**:\n  - **Semua Angka Diturunkan dari Data**: entry = harga saat ini, stop loss = jarak berbasis volatilitas terukur (dikunci 12%–60%), target TP1 = 1.5R dan TP2 = 3R dengan R:R dihitung sungguhan.\n  - **Manajemen Risiko Benar**: ukuran posisi dari anggaran risiko 1% modal, dibatasi maksimal 10% modal per posisi, stop loss tidak pernah nol/negatif.\n  - **Konsistensi Matematis Diverifikasi Tes**: kerugian maksimal tidak pernah melebihi ukuran posisi, dan setiap angka cuan/rugi konsisten dengan unit × selisih harga.\n  - Ditandai `simulated: true` dan diberi label **DUMMY / BUKAN ORDER NYATA** agar tidak pernah disalahartikan sebagai order sungguhan.\n- **[KEJUJURAN PRODUK — KEPUTUSAN DESAIN] Label Eksplisit yang Tidak Dapat Dimatikan**:\n  - Banner merah permanen menyatakan: **tidak ada sistem yang bisa memprediksi memecoin naik puluhan ribu persen**; skor tinggi berarti \"ada aktivitas beli terukur\", BUKAN \"harga akan naik\"; mayoritas token bersinyal tetap berakhir nol.\n  - **Keterbatasan Didokumentasikan di Kode**: API pump.fun tidak punya field holder, dan Solana RPC publik menolak `getTokenLargestAccounts` saat pengembangan. Karena itu **tidak ada UI analisis holder** — fitur tersebut sengaja tidak dibuat daripada menampilkan data fabrikasi.\n  - Setiap token menyediakan tautan **verifikasi mandiri ke DexScreener**.\n- **[QA/QC & CERTIFICATION]**:\n  - Test Suite: **60/60 tes lulus** (earlySignal 27, brokerGateway 14, marketHours 13, memecoinDesk 6).\n  - Kasus batas diuji khusus: token tanpa penjualan (`Infinity` tidak bocor ke data tampilan), token mati total, skor tidak pernah melebihi 100 atau di bawah 0, posisi tidak pernah melebihi batas modal, stop loss tidak pernah nol.\n  - Verifikasi live: pipeline pemindaian terbukti jalan terhadap API sesungguhnya; build produksi bersih 1.38s.\n\n---\n\n## [2026-10-02] — VIP Signal Dispatch, Multi-Chain Degen Desk & Public Payload Leak Closure\n\n### Sprint 17 — Revenue Path Wiring, Memecoin Radar & Attack-Surface Reduction\n- **[REVENUE CRITICAL] VIP Signal Dispatcher Now Actually Fires**:\n  - **Dead Code Resolution**: `broadcast_vip_trade_signal()` di `telegram_notifier.py` sebelumnya punya **0 pemanggil** — produk yang akan dijual (sinyal VIP) secara teknis belum pernah mengirim satu sinyal pun. Kini dipanggil nyata dari `run_pipeline.py` melalui `dispatch_vip_signals()`.\n  - **Specialist Bot Routing**: Memilih maksimal satu tiket per instrumen spesialis (IDX pilih skor bandarmology tertinggi, Crypto pilih momentum 24 jam tertinggi) alih-alih membanjiri grup dengan 16 sinyal arena.\n  - **Dedupe Ledger**: `engine/cache/vip_signal_ledger.json` mencegah satu tiket terkirim dua kali saat pipeline re-run. Entry price berubah = tiket baru; identik = dibungkam.\n  - **Zero-Entry Guard**: Tiket tanpa harga entry dibuang sebelum dikirim, mencegah sinyal sampah masuk grup berbayar.\n- **[MULTI-CHAIN DEGE] Degen Desk — Memecoin Radar & Rug-Check (Solana / Robinhood Chain / BSC-Aster / HyperEVM)**:\n  - **`memecoinDesk.js`**: Layer data baru berbasis endpoint keyless terverifikasi live — `frontend-api-v3.pump.fun` (peluncuran baru + progres bonding curve) dan DexScreener (harga/volume/boost multi-chain, termasuk `robinhood` dan `bsc`/Aster).\n  - **`computeRugChecks()`**: Pemeriksaan faktual dari data on-chain mentah (likuiditas SOL, progres curve, keberadaan sosial media, transfer fee, status banned) dengan verdict `HIGH_RISK` / `CAUTION` / `CLEAN`. Tanpa skor teatrikal — setiap tanda adalah fakta yang bisa diperiksa.\n  - **`DegenDesk.jsx`**: Radar peluncuran baru + papan token yang sedang di-boost, dengan filter \"sembunyikan risiko tinggi\" dan ambang minimum bonding curve.\n  - **Kejujuran Eksekusi**: Tabel rute eksekusi menyatakan status sebenarnya per chain — Solana masih DEMO (belum menandatangani transaksi), Robinhood Chain & Aster masih radar data saja. Tidak ada klaim swap yang tidak benar.\n- **[SECURITY — P0] Penutupan Kebocoran Payload VIP ke Publik**:\n  - **Akar Masalah**: `DatabaseClient._save_local_fallback()` menulis setiap payload VIP (trade plans, arena state, macro telemetry, research archive) ke `frontend/public/data/`, yang merupakan folder statis publik. Siapa pun bisa mengunduh seluruh sinyal berbayar tanpa login.\n  - **Perbaikan Hulu**: Seluruh penulisan diarahkan ke `engine/cache/` saja. Memperbaiki satu fungsi ini menutup semua pemanggil sekaligus.\n  - **Perbaikan Hilir**: Delapan file JSON VIP dihapus dari `frontend/public/data/`, serta **EA MT5 (`MBG_Institutional_Apex_EA.mq5`) dipindahkan ke `engine/mt5/`** karena sebelumnya juga dapat diunduh gratis.\n  - **Rute API Terproteksi Sesi**: Ditambahkan `functions/api/_session.js` (verifikasi JWT bersama), `/api/arena-state`, `/api/research-archive`, dan `/api/ea` — semuanya wajib sesi valid.\n  - **Dev Fallback Terpisah**: Vite middleware `/api/dev-bundle` melayani data lokal hanya saat development; rute ini tidak ada di build produksi.\n  - **CI Diperbaiki**: Workflow `arena_247_engine.yml` dan `hourly_crypto_macro.yml` tidak lagi meng-commit ke `frontend/public/data/`.\n  - **Verifikasi**: Seluruh delapan endpoint lama kini mengembalikan SPA shell (bukan data), dan build produksi terbukti bersih dari JSON VIP maupun sumber EA.\n- **[DEAD CODE PURGE] Penghapusan 1.560 Baris Kode Mati & 609 KB Artefak Yatim**:\n  - Dihapus: `us_analyzer.py`, `top_down_macro_engine.py` (1.251 baris), `forex_analyzer.py`, `cryptowave_fetcher.py` — keempatnya terbukti 0 referensi di seluruh repo, CI, dan konfigurasi.\n  - Dihapus: `subagent_materials.json`, `test_img.pdf`, `glossary_66_clean.json`, `glossary_66_full.json` (glosarium sudah hardcoded di `QuantAcademyTab.jsx`).\n  - Dihapus: empat file mockup HTML/JPG yatim di `public/` yang masih ter-deploy ke publik.\n- **[QA/QC & CERTIFICATION]**:\n  - Test Suite: **33/33 tes lulus** (marketHours 13, brokerGateway 14, memecoinDesk 6).\n  - Bug ditemukan & diperbaiki saat pengujian: parameter `sort=created` pada pump.fun API tidak valid — diganti ke `created_timestamp` setelah verifikasi terhadap API live.\n  - Build produksi Vite bersih dalam 1.22s tanpa error/warning.\n  - Verifikasi live: seluruh endpoint publik lama tertutup, rute terproteksi berfungsi."
  },
  {
    "id": "pkg-30092026",
    "sprintLabel": "Sprint 16 (Security Hardening, Data Integrity & Broker Engine v2)",
    "version": "Package 30092026",
    "semanticVersion": "v5.8.0",
    "date": "30 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / SECURITY & DATA INTEGRITY",
    "title": "Update v5.8.0: Security Hardening, Honest Data Labeling & Institutional Paper Broker v2 (Side-Aware)",
    "description": "Audit keamanan menyeluruh dan perbaikan integritas data: otentikasi edge tanpa kredensial legacy dengan sesi JWT HttpOnly + rate limit, label jujur pada feed paus simulasi & metrik semu homepage, Paper Broker v2 dengan akuntansi dua arah (LONG/SHORT) yang benar, guard bracket order real-time, serta CI secret guard dan 27 unit test hijau.",
    "processFlow": [
      {
        "step": "1. Authentication Hardening",
        "label": "Penghapusan hash legacy & bypass klien; JWT HttpOnly + constant-time compare + rate limit"
      },
      {
        "step": "2. Honest Data Labeling",
        "label": "Whale feed & swap Solana diberi label SIMULASI/DEMO; KPI homepage dihitung dari data riil"
      },
      {
        "step": "3. Broker Engine v2",
        "label": "Akuntansi side-aware LONG/SHORT, ratchet breakeven cermin, dan IDX long-only"
      },
      {
        "step": "4. Bracket Order Guard",
        "label": "Validasi geometri SL/TP live di modal eksekusi; submit terkunci saat invalid"
      },
      {
        "step": "5. CI Secret Guard & Tests",
        "label": "Workflow anti-kebocoran kredensial + 27 unit test (broker & jam bursa) hijau"
      }
    ],
    "markdownContent": "\n### 🛡️ v5.8.0 — Security Hardening, Honest Data Labeling & Institutional Paper Broker v2 (Side-Aware)\n\n#### 🔐 1. Hardening Otentikasi & Sesi JWT\n- **Penghapusan Kredensial Legacy:** Hash cadangan dan pemeriksaan password plaintext (`mbg`, `MBG::...`) dihapus dari fungsi edge `/api/auth`. Validasi kini memakai HMAC dan perbandingan constant-time terhadap `PASSWORD_HASH`.\n- **Gate Password Sisi Server:** `PasswordGate` tidak lagi memiliki bypass sisi klien. Seluruh sesi diverifikasi via JWT HttpOnly 24 jam dengan rate limit 5 percobaan / 15 menit per IP.\n- **[DISUNTING 2026-10-11] Detail kredensial gerbang dihapus dari catatan ini.** Catatan ini sebelumnya menyebut sandi gerbang live dan potongan hash-nya secara terbuka. Karena Changelog kini dapat dibaca akun FREE (E-1), detail itu tidak boleh berada di UI. Yang tetap benar: sesi diverifikasi lewat JWT HttpOnly 24 jam tanpa bypass sisi klien, dan rotasi sandi dilakukan lewat env `PASSWORD_HASH` + `JWT_SECRET` di dashboard Cloudflare tanpa deploy ulang.\n- **/api/data & /api/scanner Wajib Sesi:** Endpoint telemetri dan proxy scanner menolak request tanpa cookie JWT valid (401), dengan allowlist pasar ketat, limit 30 scan/menit per IP, dan batas payload 64 KB.\n\n#### 🐳 2. Transparansi Sumber Data & Penghapusan Metrik Semu\n- **Whale Feed Jujur:** Badge `STREAM ON-CHAIN (0s DELAY)` diganti `SIMULATED WHALE FEED (DEMO)` disertai peringatan header. Baris simulasi tidak lagi menampilkan tautan explorer palsu (hash:null, `SIM-<SYM>-<USD>`); transaksi mempool Bitcoin riil tetap tertaut ke explorer.\n- **KPI Homepage Riil:** Valuasi portofolio dihitung dari kas + posisi riil (mark-to-market live), volume 24 jam dijumlahkan dari quoteVolume Binance, statistik Arena Alpha diambil dari state engine riil dengan tag `(engine)`, dan aliran asing tampil `—` saat data tidak tersedia.\n- **Heatmap NO DATA:** Nilai acak ±5% dihapus. Petak tanpa data tampil abu-abu netral `NO DATA` dan statistik agregat mengecualikannya.\n- **News Wire Live-First:** Marquee memakai harga live (XAU/UKOIL/DXY/USDIDR) dengan fallback EOD berlabel; USD/IDR live menggantikan angka statis 15.680; US10Y diberi label EOD.\n- **Solana Swap Mode Demo:** Sukses swap palsu + tautan Solscan diganti pemberitahuan jujur `MODE DEMO — TIDAK ADA TRANSAKSI TERKIRIM`.\n\n#### 📊 3. Institutional Paper Broker v2 (Side-Aware Accounting)\n- **Perbaikan Bug Kritis SELL-as-BUY:** Order SELL kini membuka posisi SHORT dengan margin hold — sebelumnya salah tercatat sebagai pembelian. PnL, fee exit, dan cash release dihitung per arah posisi (LONG & SHORT) dengan benar.\n- **Ratchet Breakeven Cermin:** Ratchet SL ke breakeven berlaku benar untuk LONG dan SHORT; geometri bracket divalidasi (SL/TP wajib berada di sisi yang benar) dan order bracket invalid ditolak.\n- **IDX Long-Only:** Order SELL instrumen IDX ditolak eksplisit sesuai aturan bursa.\n- **Migrasi Skema v2:** Posisi legacy dinormalisasi ke LONG saat load; orderId memakai `crypto.randomUUID`; emergency liquidate memakai quote lookup penuh.\n\n#### 🧪 4. Bracket Guard UI & QA\n- **Guard Bracket Real-Time:** Modal Eksekusi Trade menghitung `bracketError` live, menampilkan peringatan amber, dan menonaktifkan tombol submit saat bracket invalid.\n- **UUID Arena:** ID toast & posisi AI Agent Arena beralih dari `Math.random` ke `crypto.randomUUID`.\n- **CI Secret Guard:** Workflow GitHub Actions baru gagal-build jika kredensial lama (email, hash legacy, JWT fallback) muncul kembali di repo.\n- **Creds Engine Env-Only:** `cryptowave_fetcher.py` memakai `CRYPTOWAVE_EMAIL`/`CRYPTOWAVE_PASSWORD` dari environment; password ter-redaksi dari PRD.\n- **27 Unit Tests Hijau:** 14 test brokerGateway (akuntansi LONG/SHORT, fee, ratchet, IDX, cash conservation) + 13 test marketHours (sesi WIB) via vitest + jsdom (`npm test`).\n"
  },
  {
    "id": "pkg-28092026",
    "sprintLabel": "Sprint 15 (Simple Mode, 3-Tier Access & Bandarmology Confluence)",
    "version": "Package 28092026",
    "semanticVersion": "v5.7.0",
    "date": "28 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / DRIBBBLE UI & WEB3 SWAP",
    "title": "Update v5.7.0: Dribbble-Grade UI/UX Overhaul, Portfolio Analytics Hero, Phantom Web3 Connect & VIP Signals",
    "description": "Perombakan total desain antarmuka (UI/UX) mengadopsi estetika Dribbble modern dan clean: ambient dark obsidian bloom, floating glass header dock, sleek rounded pill navigation di sidebar, hero analytics card portofolio multi-aset dengan toggle USD/IDR, integrasi dompet Phantom native, modul Solana memecoin fast swap via Jupiter DEX 0.8% fee, Bandarmology IIFS confluence gate, dan dispatcher sinyal VIP Telegram.",
    "processFlow": [
      {
        "step": "1. Dribbble Clean UI/UX",
        "label": "Overhaul antarmuka glassmorphic, floating header dock, dan hero analytics portofolio"
      },
      {
        "step": "2. Simple & Pro Modes",
        "label": "Toggle Mode Santai vs Mode Pro di header bar untuk pengalaman ramah pemula"
      },
      {
        "step": "3. Web3 Phantom Connect",
        "label": "Koneksi dompet Phantom native tanpa dependensi eksternal berat (0 kB bundle bloat)"
      },
      {
        "step": "4. Solana Memecoin Swap",
        "label": "Radar memecoin viral & eksekusi swap 1-2 detik via Jupiter DEX dengan komisi platform 0.8%"
      },
      {
        "step": "5. Bandarmology Confluence",
        "label": "Filter konfirmasi akumulasi/distribusi bandar otomatis pada rencana trading saham IDX"
      }
    ],
    "markdownContent": "\n### 🚀 v5.7.0 — Mode Santai (Simple Mode) vs Pro Switcher, 3-Tier Access Foundation, Bandarmology Confluence & VIP Signal Engine\n\n#### 🍃 1. Mode Santai vs Mode Pro Switcher\n- **Dual Display Modes:** Menambahkan toggle `[ 🍃 MODE SANTAI ]` vs `[ ⚡ MODE PRO ]` langsung pada master top header bar untuk membebaskan pengguna baru dari beban kognitif berlebih (*cognitive overload*).\n- **Guidance Ribbon:** Mode Santai menampilkan pita panduan ringkas berfokus pada Top 3 Sinyal Hari Ini, Ringkasan Berita Dunia, dan tombol akses cepat kalkulator lot aman.\n\n#### 👤 2. 3-Tier User Privilege Skeleton\n- **Role-Based Access Foundation:** Menanamkan simulator status hak akses pengguna (`[ 👤 TAMU ]` → `[ ⭐ FREE MEMBER ]` → `[ 👑 VIP PRO ]`) dengan persistensi `localStorage`, meletakkan pondasi bagi integrasi otentikasi role-based access control (RBAC).\n\n#### 🛡️ 3. Bandarmology IIFS Confluence Gate\n- **Confluence Gatekeeper:** Menghubungkan skor komposit `BandarmologyIIFS` (Z-score gabungan OBV, MFI, Deviasi VWAP, dan Chaikin A/D Line) secara otomatis ke setiap rencana trading saham IDX (`trade_plans`).\n- **Peringatan & Konfirmasi Otomatis:** Memberikan badge `🛡️ BANDAR ACCUM` untuk skor $\ge 0.6$, `⚠️ BANDAR DISTRIBUSI` untuk skor $\le -0.6$, dan otomatis menurunkan status tiket jika terdeteksi distribusi berat.\n\n#### 🐳 4. Mempool Live Whale Expansion & Benchmark Disclosures\n- **Mempool.space On-Chain Live Expansion:** Meningkatkan batas tangkapan transaksi paus Bitcoin riil dari blockchain Mempool menjadi hingga 8 transaksi live terverifikasi per siklus evaluasi.\n- **Transparansi Sumber Data:** Menambahkan label penafian tegas `HISTORICAL_BENCHMARK_MATRIX` dan `BENCHMARK_REFERENCE` pada modul aliran broker asing dan portofolio 13F Wall Street.\n\n#### 👑 5. VIP Trade Signal Dispatcher (`broadcast_vip_trade_signal`)\n- **Actionable Signal Formatter:** Menyediakan template sinyal trading VIP Telegram berstandar institusi mencakup instrumen, arah posisi, entry zone, Stop Loss presisi, Target 1 & Target 2, Risk/Reward ratio, dan status konfirmasi bandarmology.\n"
  },
  {
    "id": "pkg-27092026",
    "sprintLabel": "Sprint 14 (Quantitative Audit Refactoring & Introspection)",
    "version": "Package 27092026",
    "semanticVersion": "v5.6.0",
    "date": "27 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / AUDIT REFACTOR & AI REFLECTION",
    "title": "Update v5.6.0: Multi-Agent Audit Modal Ergonomics, Net Realized Alpha Metric, AI Agent Self-Reflection Protocol & Streamlined Navigation",
    "description": "Penyempurnaan ergonomi dan integritas audit multi-agent arena: Penghapusan kolom redundant 'ALOKASI MODAL' untuk memperluas ruang metrik kinerja (+110px), eliminasi prefiks kaku tab bot ('TAB 1:' diganti '📋 RECAP ARENA' & avatar elemen bot ringkas), penggantian metrik semu 'Total Arena Equity' menjadi 'NET REALIZED PnL (ARENA)' yang mengukur akumulasi alpha bersih riil terhadap modal basis, pembersihan grafik simulasi candlestick statis duplikatif, integrasi protokol introspeksi diri AI (AI Agent Self-Reflection) pasca-Margin Call untuk seluruh 16 bot trading, serta pembersihan kartu arsitektur modal RPG statis.",
    "processFlow": [
      {
        "step": "1. Audit Modal Ergonomics",
        "label": "Pencabutan kolom Alokasi Modal memperluas ruang metrik performa (+110px)"
      },
      {
        "step": "2. Streamlined Tab Navigation",
        "label": "Rampingisasi tab review: '📋 RECAP ARENA' dan avatar elemen + nama bot ringkas"
      },
      {
        "step": "3. Net Realized Alpha Metric",
        "label": "Penggantian Total Equity semu dengan Net Realized PnL (ARENA) & Net ROI riil"
      },
      {
        "step": "4. AI Self-Reflection Protocol",
        "label": "Integrasi monolog introspeksi diri AI generator (getAgentSelfReflection) pasca Margin Call"
      },
      {
        "step": "5. Architecture & Chart Cleanup",
        "label": "Pembersihan grafik simulasi duplikatif dan kartu RPG 4-elemen statis dari audit modal"
      },
      {
        "step": "6. Global News Wire & Precise Timestamps",
        "label": "18 stream berita makro dunia, parser tanggal/jam rilis asli sumber, dan sort kronologis mutlak"
      }
    ],
    "markdownContent": "\n### 🏛️ v5.6.0 — Multi-Agent Audit Modal Ergonomics, Net Realized Alpha Metric & AI Agent Self-Reflection Protocol\n\n#### 🧹 1. Dekonstruksi & Pembersihan Modal Audit Multi-Agent\n- **Pencabutan Kolom Alokasi Modal:** Menghapus kolom redundant `ALOKASI MODAL` yang menampilkan angka statis seragam (`Rp 1.000.000 Sovereign 100%`) di setiap baris tabel. Memberikan ekspansi ruang horizontal sebesar ~110px untuk kolom Strategi, Win Rate, dan Profit Factor.\n- **Rampingisasi Navigasi Tab Bot:** Mengeliminasi prefiks kaku `TAB 1:` dan `TAB X:`. Tab 1 bertransformasi menjadi `📋 RECAP ARENA`, dan tab bot disajikan ringkas dengan avatar elemen + nama bot (e.g., `🌊 WATER 15x MC`), menghemat ruang horizontal dan meminimalkan scrolling.\n- **Eliminasi Grafik Simulasi Candlestick Duplikatif:** Memindahkan chart simulasi statis entry/TP/SL dari modal audit kinerja ke tempat aslinya di Modal Profil & Filosofi, menjaga fokus modal audit murni pada pembuktian empiris riil.\n\n#### 📊 2. Transformasi Metrik 'Total Arena Equity' ke 'Net Realized PnL (ARENA)'\n- **Penyembuhan Ilusi Angka Semu:** Mengganti metrik ekuitas arena yang bias akibat injeksi saldo berulang saat respawn (Margin Call berkali-kali) dengan `NET REALIZED PnL (ARENA)`.\n- **Penghitungan Alpha Riil:** Menghitung secara dinamis total laba/rugi bersih yang terealisasi dari seluruh tiket tertutup arena dengan kalkulasi Net ROI terhadap total modal basis arena.\n\n#### 🧠 3. Integrasi Refleksi Diri AI Pasca-Margin Call (AI Agent Self-Reflection)\n- **AI Agent Self-Reflection Generator (`getAgentSelfReflection`):** Membangun modul introspeksi kepribadian algoritma untuk seluruh 16 bot trading (WATER, FIRE, AIR, EARTH, STEAM, STORM, MUD, LIGHTNING, LAVA, SANDSTORM, TEMPEST, OCEANIC, GEOTHERMAL, CYCLONE, AVATAR, CHAOS).\n- **Kartu Post-Mortem Monolog AI:** Menampilkan monolog evaluasi kegagalan AI secara jujur dan transparan saat bot mengalami likuidasi (analisis false sweep, news slippage, ranging squeeze, atau relentless trend) dan ikrar parameter mutasi DNA untuk generasi berikutnya.\n- **Status Operasional Prima Gen 0:** Menyediakan kartu refleksi kedisiplinan parameter bagi bot yang masih bertahan di Generasi Genesis tanpa kebangkrutan.\n\n#### 🛡️ 4. Pembersihan Komponen Arsitektur RPG Statis\n- Menghapus kartu statis 4-elemen lawas dari Tab Recap yang sudah tidak sinkron dengan portofolio 16-agent arena aktif.\n"
  },
  {
    "id": "pkg-26092026",
    "sprintLabel": "Sprint 13 (24/7 Autonomous Arena Continuous Engine & Zero-Dependency Execution)",
    "version": "Package 26092026",
    "semanticVersion": "v5.5.4",
    "date": "26 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / PUBLIC REPO & 24/7 CONTINUOUS RUNNER",
    "title": "Update v5.5.4: Public Repository Migration, Unlimited Cloud CI/CD & 24/7 Autonomous Multi-Tick Trading Runner",
    "description": "Migrasi repositori AhFu28/MBG-Trading ke status Public dengan kuota komputasi GitHub Actions unlimited bebas batas, standalone zero-dependency Python runner (arena_runner_247.py) berbasis library bawaan urllib tanpa pip install, multi-tick micro-loop 30 detik untuk 16 bot serempak, jadwal cron off-peak per 5 menit dengan proteksi git rebase retry loop, dan sinkronisasi client hydration instan.",
    "processFlow": [
      {
        "step": "1. Public Repo Migration",
        "label": "Repositori berstatus Public membuka kuota GitHub Actions 100% UNLIMITED"
      },
      {
        "step": "2. Zero-Dependency Runner",
        "label": "Runner otonom arena_runner_247.py murni stdlib Python urllib tanpa pip install"
      },
      {
        "step": "3. Continuous Multi-Tick Loop",
        "label": "Evaluasi micro-loop 30 detik per job runner untuk 16 bot tanpa bottleneck"
      },
      {
        "step": "4. Resilient Git Rebase Pipeline",
        "label": "Workflow arena_247_engine.yml cron 5 menit off-peak dengan 3x retry rebase push"
      },
      {
        "step": "5. Client Hydration Instant Sync",
        "label": "Sinkronisasi posisi & jurnal otomatis saat aplikasi web dibuka pengguna"
      }
    ],
    "markdownContent": "\n### ⚡ v5.5.4 — Public Repository Migration, Unlimited Cloud CI/CD & 24/7 Autonomous Multi-Tick Runner\n\n#### 🌐 1. Migrasi Repositori Public & Kuota Komputasi Unlimited\n- **Sovereign Public Status:** Repositori `AhFu28/MBG-Trading` resmi berstatus Public, membuka hak akses komputasi GitHub Actions 100% UNLIMITED & bebas batas kuota 2.000 menit/bulan.\n- **Due Diligence Security Audit:** Terverifikasi file `.env` lokal 100% terlindungi oleh `.gitignore` dan 0 secrets/API keys pernah terekspos di seluruh riwayat commit.\n\n#### ⚡ 2. Standalone Zero-Dependency Arena Engine (`arena_runner_247.py`)\n- **Standard Library Urllib Streaming:** Membangun modul runner otonom yang berjalan murni menggunakan pustaka bawaan Python (`urllib.request`), menghilangkan kebutuhan `pip install` berat dan memangkas waktu *cold-boot* di cloud runner menjadi <3 detik.\n- **Continuous Multi-Tick Micro-Loop:** Menjalankan evaluasi berulang setiap 30 detik dalam window 4 menit per job runner untuk 16 AI Trading Agents tanpa jeda round-robin.\n- **Friction & Ratchet Parity:** Menjaga integritas deduksi fee bursa Bitget 0.12% dan dynamic ratchet trailing stop (40% distance ke TP1 mengunci 30% profit).\n\n#### 🔄 3. Dedicated High-Frequency Workflow (`arena_247_engine.yml`)\n- **Off-Peak Cron Schedule:** Mengaktifkan jadwal cron per 5 menit pada menit ganjil/off-peak (`2,7,12,17,22,27,32,37,42,47,52,57 * * * *`) untuk menghindari antrian delay server GitHub Actions.\n- **Resilient Git Rebase Retry Loop:** Menambahkan proteksi `git pull --rebase -X theirs origin main && git push` dengan loop 3x retry untuk mencegah kegagalan commit non-fast-forward akibat benturan *concurrent push*.\n- **Client Hydration Instant Sync:** Frontend web secara otomatis membaca state cloud terbaru dan menggabungkan posisi serta riwayat trade yang terjadi selama pengguna offline.\n"
  },
  {
    "id": "pkg-25092026-r1",
    "sprintLabel": "Sprint 7 (Production Hardening & Reconciled Telemetry)",
    "version": "Package 25092026-R1",
    "semanticVersion": "v5.5.3",
    "date": "25 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / PRODUCTION HARDENED & RECONCILED",
    "title": "Update v5.5.3: Institutional US Equities Registry, Reconciled Paper Portfolio Bookkeeping, Stable SVG IDs, Theme-Aware Tables & CSP Security Headers",
    "description": "Perbaikan komprehensif audit forensik tahap 4: Integrasi registry metadata institusional untuk 31 saham mega-cap Wall Street (kapitalisasi pasar riil, rasio P/E aktual, nama korporat), rekonsiliasi matematis pembukuan portofolio forward-test (30 tiket selesai [6M/24K] + 52 posisi aktif + 33 antrean = 115 total tiket terverifikasi dengan win rate 20.0%), eliminasi DOM churn SVG sparkline via React useId(), pemulihan kontras tabel mode terang (Light Theme), penerapan Content Security Policy (CSP) ketat pada Cloudflare Pages, serta otomasi notifikasi kegagalan workflow GitHub Actions via Telegram.",
    "processFlow": [
      {
        "step": "1. Institutional US Equities Registry (H-05)",
        "label": "Pemetaan metadata fundamental 31 saham Wall Street (nama korporat, market cap multi-triliun riil, rasio P/E) tanpa dependensi API eksternal"
      },
      {
        "step": "2. Reconciled Paper Portfolio Bookkeeping (M-07)",
        "label": "Rekonsiliasi matematis statistik portofolio simulasi (30 ditutup [6W/24L] + 52 aktif + 33 antrean = 115 total) dengan standardisasi win_rate_pct 20.0%"
      },
      {
        "step": "3. Stable SVG Sparkline ID Generation (L-01)",
        "label": "Penggantian Math.random() dengan React useId() pada linearGradient SparklineChart melenyapkan DOM invalidation churn"
      },
      {
        "step": "4. Theme-Aware Contrast & CSP Protection (M-03 & L-02)",
        "label": "Penyelarasan kontras header tabel quant di tema terang serta injeksi Content-Security-Policy & Permissions-Policy di headers Cloudflare Pages"
      },
      {
        "step": "5. Automated CI/CD Failure Alerting (L-03)",
        "label": "Penambahan conditional Telegram failure alert step pada seluruh workflow GitHub Actions engine"
      }
    ],
    "markdownContent": "\n### 🏛️ v5.5.3 — Production Hardening, Fundamental Registry & Reconciled Bookkeeping\n\n#### 🇺🇸 1. Registry Fundamental Saham Wall Street (H-05)\n- **Metadata Mega-Cap Institusional:** 31 saham unggulan Wall Street (AAPL, MSFT, NVDA, GOOGL, AMZN, dsb.) kini dilengkapi metadata fundamental riil mencakup nama resmi emiten, kapitalisasi pasar triliunan dolar terkini, dan rasio P/E konsensus. Ticker tanpa histori teknikal ditandai RSI netral (50.0) secara transparan.\n\n#### 📊 2. Rekonsiliasi Matematika Portofolio Forward-Test (M-07)\n- **Presisi Buku Besar:** Seluruh agregasi statistik paper trading kini saling mengunci: 30 trade tertutup (6 Menang + 24 Kalah) + 52 trade aktif + 33 tiket pending = 115 total tiket. Rasio kemenangan distandarkan menjadi `win_rate_pct: 20.0%` (bukan desimal 0.2%).\n- **Arsitektur Pipeline:** Menambahkan alias method `get_portfolio_summary` pada engine Python untuk menjamin sinkronisasi otomatis bundle harian.\n\n#### ⚡ 3. Optimasi DOM & Performa Render Grafis (L-01)\n- **Stable React useId():** Komponen SparklineChart di AiAgentArenaTab kini menggunakan hook `useId()` deterministik untuk ID linearGradient SVG, melenyapkan DOM redraw churn akibat `Math.random()` pada setiap detik pembaruan harga.\n\n#### 🎨 4. Kontras Header Tabel & Keamanan Web Modern (M-03 & L-02)\n- **Dukungan Tema Terang Optimal:** Kelas CSS `.quant-table th` kini terikat ke variabel tema `--bg-panel-subtle`, `--text-muted`, dan `--border-hairline`, memastikan keterbacaan sempurna di tema gelap maupun terang.\n- **CSP & Permissions Headers:** File headers Cloudflare Pages diperkaya dengan `Content-Security-Policy`, `Permissions-Policy`, dan proteksi `X-Content-Type-Options: nosniff` yang aman untuk WebSocket Binance dan feed TradingView.\n\n#### 🔔 5. Pemantauan Pipeline GitHub Actions (L-03)\n- **Notifikasi Kegagalan Telegram:** Seluruh 6 alur kerja cron/dispatch di `.github/workflows/` kini memiliki hook conditional `if: failure()` untuk mengirimkan alert otomatis ke kanal Telegram pengelola jika terjadi kendala pada engine komputasi.\n"
  },
  {
    "id": "pkg-24092026",
    "sprintLabel": "Sprint 5 & 6 (Terpadu) — Compliance, Forensics Hardening & Telemetry Alignment",
    "version": "Package 24092026 (v5.4.0 → v5.5.2)",
    "semanticVersion": "v5.5.2",
    "date": "24 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / 4 SESI TERPADU",
    "title": "Rilis Akbar 24 September 2026: Compliance Audit, UI Canvas Restoration, Centralized Data Integrity, Live Forex Sync & Unified Pricing",
    "description": "Rekapitulasi terpadu seluruh 4 sesi pengembangan pada tanggal 24 September 2026: Sesi 1 Dini Hari (Compliance Zero Simulation Policy & Restorasi Lebar Kanvas Edukasi), Sesi 2 Siang (Modal Audit Integritas Data 6-Jalur & Saringan Stablecoin), Sesi 3 Sore (Sinkronisasi Kurs USD/IDR Live & Transparansi Model Broker), dan Sesi 4 Malam (Unifikasi Batas Harga Emas, Persistensi Sesi 24 Jam & Pip Dinamis JPY).",
    "processFlow": [
      {
        "step": "1. Compliance & Full-Width Layout (v5.4.0)",
        "label": "Sertifikasi Zero Simulation Policy & restorasi kanvas pembelajaran 100% full-width"
      },
      {
        "step": "2. Data Integrity Modal & Crypto Filter (v5.5.0)",
        "label": "Drawer verifikasi 6 sumber data riil, saringan stablecoin & lot kalkulator short"
      },
      {
        "step": "3. Live USD/IDR & Timezone Alignment (v5.5.1)",
        "label": "Sinkronisasi kurs USD/IDR live, penyembuhan WebSocket drop & jam Asia/Jakarta"
      },
      {
        "step": "4. Unified Gold & 24H Session TTL (v5.5.2)",
        "label": "Sanity check emas $1.800–$3.500, sesi tahan reload 24 jam & formula pip JPY dinamis"
      }
    ],
    "markdownContent": "\n### 🏛️ Rekapitulasi Rilis Akbar 24 September 2026 (4 Sesi Rilis)\n\n---\n\n### 🌅 Sesi 1 (Dini Hari) — Update v5.4.0: Compliance Audit & UI/UX Full-Width Canvas Restoration\n- **Zero Simulation Policy:** Terverifikasi 100% bebas dari `Math.random()` artifisial pada data pasar dan logika edukasi akademi.\n- **Security & Secret Leak Prevention:** Audit menyeluruh memverifikasi tidak ada API key, token rahasia, maupun kredensial privat yang terekspos.\n- **Level 5 FVG & Sweep Playground:** Menggantikan duplikasi OrderBook dengan kanvas interaktif Fair Value Gap 3-candle dan simulasi animasi sapuan likuiditas 4 tahap.\n- **Modul 3.3 Supercycle Sine Wave:** Visualisasi interaktif siklus komoditas 4 fase (Under-investment, Windfall Boom, Capex Glut, Crash) dengan rekomendasi alokasi aset.\n- **Restorasi Lebar Kanvas Edukasi (.quant-academy-main-grid):** Mengunci sidebar modul pada `280px` (sticky) dan mengalokasikan seluruh sisa ruang layar untuk materi pembelajaran hingga `1680px` full-width.\n\n---\n\n### ☀️ Sesi 2 (Siang) — Update v5.5.0: Pre-Launch Forensics Hardening & Centralized Data Integrity\n- **Modal Audit Integritas Data (Data Integrity & Provenance Modal):** Drawer telemetri transparan 6 sumber data (Macro Bundle, IDX BEI, Binance WebSocket, Valuta Global/CFD, Kurs USD/IDR, Gemini LLM).\n- **Filter Pasangan Stablecoin:** Saringan ketat (`USDC`, `FDUSD`, `TUSD`, `DAI`, dll) pada loop Binance spot agar terminal tidak mengeluarkan trade plan artifisial.\n- **Sanity Clamping R:R:** Membatasi rasio Risk/Reward antara 0.2x hingga 20.0x untuk mencegah anomali rasio ekstrem.\n- **Short-Order Lot Calculator:** Memperbaiki bug kalkulator lot di mana posisi Short (`SL > Entry`) sebelumnya menghasilkan 0 lot.\n- **Kepatuhan Regulasi & Backtest Non-Advisory:** Modal persetujuan risiko first-run dan banner transparansi simulasi backtest hipotetis.\n\n---\n\n### 🌇 Sesi 3 (Sore) — Update v5.5.1: Live USD/IDR Sync, WebSocket Gap Healing & Telemetry Alignment\n- **Live USD/IDR Feed:** Kuotasi live pasangan `USDTIDR` dari Binance Vision dan `FX_IDC:USDIDR` dari TradingView Scanner ke dalam penyimpanan terpusat `livePrices` dengan sinkronisasi ke `AiAgentArenaTab`.\n- **Penyembuhan Drop REST:** Pembaruan kuotasi REST yang diperbolehkan me-refresh instrumen eksis saat kuotasi kedaluwarsa >3 detik.\n- **Transparansi Broker Flow:** Badge mencolok `ESTIMATED FLOW (QUANT MODEL)` pada header tabel Smart Money Accumulation serta tag `[EST]` pada kode broker emulasi.\n- **Penegakan Jam WIB:** Opsi eksplisit `{ timeZone: 'Asia/Jakarta' }` pada seluruh parser tanggal (berita makro, header sistem forex, dan feed radar paus).\n- **Pengekangan Alarm Taktis:** Banner peringatan pertahanan taktis terikat ketat pada skor level DEFCON (`<= 3`) dan tingkat keparahan krisis bundle.\n\n---\n\n### 🌙 Sesi 4 (Malam) — Update v5.5.2: Unified Gold Bullion Pricing & 24H Session TTL Persistence\n- **Unifikasi Batas Harga Emas (H-04):** Sanity check ketat kuotasi emas dunia ($1.800 – $3.500) melenyapkan anomali kuotasi $4.381 dan fallback usang $272, dialihkan ke kuotasi spot aktual ~$2.650.\n- **Persistensi Sesi Otentikasi 24 Jam (M-04):** Penyimpanan sesi di `localStorage` dengan penanda `expiresAt` berbasis 24 jam mencegah logout tiba-tiba saat reload halaman.\n- **Kalender Makro Fokus Rilis Mendatang (M-05):** Default kalender makro menyaring event ke status `UPCOMING` berprioritas tinggi.\n- **Pip Dinamis JPY & Seleksi Agen Stabil (M-10 & M-11):** Rumus standar pasar interbank `(100.000 unit × 0.01) / Harga Entry` untuk valuta pasangan JPY dan seed hash deterministik 5 menit anti-jitter.\n"
  },
  {
    "id": "pkg-23092026",
    "version": "Package 23092026 (v5.0.0 → v5.3.0)",
    "semanticVersion": "v5.3.0",
    "date": "23 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / 4 SESI TERPADU",
    "title": "Rilis Akbar 23 September 2026: Institutional Cockpit Refinement, Tactical Defense, Symmetrical HUD & 6-Level Quant Academy Masterclass",
    "description": "Rekapitulasi terpadu seluruh 4 sesi pengembangan pada tanggal 23 September 2026 yang dirangkum secara runtut: Sesi 1 Pagi (AI Sentinel Desk & DEFCON Threat Barometer), Sesi 2 Siang (Quant Engine v3.0, Deflated Sharpe Ratio & MCP Server), Sesi 3 Sore (Symmetrical 50/50 Cockpit Alignment & 14-Category News Wire), dan Sesi 4 Malam (Transformasi 6-Level Masterclass Quant Academy & SVG Sandbox Suite).",
    "processFlow": [
      {
        "step": "1. Sesi Pagi (v5.0.0)",
        "label": "Sentinel Desk Macro, DEFCON Threat Barometer, Live News Synthesis & Explainable AI Arena"
      },
      {
        "step": "2. Sesi Siang (v5.1.0)",
        "label": "Jev-Trade Execution HUD, OpenQuant Strategy Contracts, DSR Validation & Local MCP Server"
      },
      {
        "step": "3. Sesi Sore (v5.2.0)",
        "label": "Symmetrical 50/50 Cockpit Alignment, 4-Barometer HUD, Nuclear Alert & 14-Category News Wire"
      },
      {
        "step": "4. Sesi Malam (v5.3.0)",
        "label": "6-Level Masterclass (20 Modul), Dam Simulator SVG, Crisis Charts, Order Book & Risk Desk"
      }
    ],
    "markdownContent": "\n### 🏛️ Rekapitulasi Rilis Akbar 23 September 2026 (4 Sesi Rilis)\n\n---\n\n### 🌅 Sesi 1 (Pagi) — Update v5.0.0: Institutional AI Desk & DEFCON Threat Barometer\n- **Sentinel Desk Macro & Geopolitical:** Tab baru `AiIntelligenceDrawer.jsx` yang memantau risiko sistemik global secara real-time.\n- **DEFCON Computed Threat Barometer:** Skala ancaman makro kuantitatif (0.00 - 1.00) dengan simulasi skenario What-If (*Oil Shock, Fed 50 bps Hike, Taiwan Strait Blockade*).\n- **Explainable AI Agent Arena:** Panel transparansi keputusan 16 bot trading (Weight allocation, EXP3 probability, reasoning text).\n- **Live News Research Synthesis:** Agregasi berita 12 sumber kredibel dengan estimasi probabilitas skenario pasar.\n\n---\n\n### ☀️ Sesi 2 (Siang) — Update v5.1.0: Institutional Quant Engine, DSR & Local MCP Server\n- **Jev-Trade Execution HUD:** Parameter eksekusi order institusional (TWAP, VWAP, POV, Implementation Shortfall).\n- **OpenQuant Strategy Contracts:** Standardisasi kontrak strategi berbasis schema formal (`strategy_spec.json`).\n- **Deflated Sharpe Ratio (DSR):** Filter over-fitting berbasis matematika Marcos López de Prado untuk mengeliminasi p-hacking pada backtesting.\n- **QuantDinger Local-First MCP Server:** Server MCP lokal (`engine/mcp/mbg_server.py`) dengan 5 tool analitik teruji 100% pass unit test.\n- **Interactive Math Lab Sandbox:** Laboratorium visual pengujian formula quant secara langsung di browser.\n\n---\n\n### 🌇 Sesi 3 (Sore) — Update v5.2.0: Symmetrical 50/50 Cockpit, Defense Alert & News Wire\n- **Symmetrical 50/50 Cockpit Alignment:** Menyeimbangkan pembagian garis vertikal antara *Smart Money Order Flow* (kiri) dan *Bandarmology Radar* (kanan).\n- **4-Barometer Top Row HUD:** Barometer Likuiditas Makro, Kurva Imbal Hasil (10Y-2Y), Hedge Fund Portfolio Risk, dan Factor Radar dipadatkan secara elegan di baris teratas.\n- **Tactical Defense & Nuclear Alert HUD:** Integrasi radar ancaman geopolitik (terinspirasi WorldMonitor & God's Eye View) dengan peringatan visual eskalasi nuklir/militer.\n- **Restorasi 14-Category News Wire:** Mengembalikan seluruh 14 kategori berita pasar lengkap dengan filter tab horizontal cepat.\n- **Standardisasi Bilingual:** Istilah-istilah keuangan ganjil dalam Bahasa Indonesia distandardisasi dengan padanan istilah institusional global yang tepat.\n\n---\n\n### 🌙 Sesi 4 (Malam) — Update v5.3.0: 6-Level Masterclass (20 Modul) & SVG Sandbox Suite\n- **Kurikulum 6 Level Berstandar Hedge Fund:** Transformasi kurikulum Quant Academy menjadi program pelatihan analis bertahap (Point72 / Bridgewater Associates):\n  * **Level 1 (Mekanisme Mesin Uang Dunia):** Uang fiat, bendungan likuiditas, hegemoni Dolar (Petrodollar), dan suku bunga termostat.\n  * **Level 2 (Transmisi Makro & Sejarah Krisis):** Pohon kausalitas 8 langkah The Fed dan bedah 5 krisis besar (1997, 2008, 2013, 2020, 2022).\n  * **Level 3 (Anatomi 5 Instrumen & Fundamental):** Saham, Obligasi, Forex, Komoditas, Kripto; arus kas operasional riil vs laba akrual; serta siklus komoditas.\n  * **Level 4 (Mikrostruktur & Bandarmology):** Lelang buku order (Limit vs Market), ekosistem BEI, 4 fase Wyckoff, dan jebakan dividen komoditas ($PTBA).\n  * **Level 5 (Analisis Teknikal & Likuiditas):** Auction theory, zona likuiditas sejati, magnet 50% Fair Value Gap, dan sapuan stop loss.\n  * **Level 6 (Risk Desk & Psikologi Hedge Fund):** Asimetri drawdown, kalkulator lot diskrit BEI anti-bangkrut 1-2%, R:R minimal 1:2, dan pre-flight checklist.\n- **Suite Visual Interaktif SVG:**\n  * **SVG Dam Simulator (Level 1):** Waduk likuiditas bank sentral dengan slider pintu air ke 4 kolam aset.\n  * **Domino Stepper (Level 2):** 8 tahap transmisi kebijakan The Fed ke bursa domestik dengan tombol langkah demi langkah.\n  * **Crisis Line Chart (Level 2):** Trajektori grafik SVG 4 krisis besar (1997, 2008, 2013, 2020) dengan titik panik dan rebound.\n  * **Timbangan Kas vs Laba (Level 3):** Deteksi rekayasa laba akuntansi vs arus kas operasional nyata.\n  * **Order Book Depth Ladder & Spoofing (Level 4):** Simulasi pasang antrian palsu 50.000 lot dan sapuan market order paus.\n  * **Dividend Trap Sandbox (Level 4):** Kalkulator pemilihan waktu beli saham dividen tinggi vs risiko gap down.\n  * **Visual Execution Bracket (Level 6):** Bracket posisi visual Entry, SL, dan TP dengan rasio R:R terkontrol.\n  * **Pre-Flight Launch Scorecard (Level 6):** Checklist keselamatan 5 protokol sebelum membuka posisi.\n"
  },
  {
    "id": "pkg-22092026",
    "version": "Package 22092026",
    "semanticVersion": "v4.9.0",
    "date": "22 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / LITERATURE & L2 ORDER BOOK",
    "title": "Update v4.9.0: AI Multi-Agent Arena Literature Alignment (16 Buku Finansial), Level-2 Order Book Simulator & Smoke Test Suite",
    "description": "Penyelarasan menyeluruh filosofi 16 bot trading AI ke 16 buku teks finansial dan quant terkemuka (López de Prado, Carver, Bulkowski, Murphy, Kathy Lien), pembangunan simulator interaktif Level-2 Order Book Microstructure, dan pengerasan build produksi.",
    "processFlow": [
      {
        "step": "1. Literature Alignment",
        "label": "Penyelarasan filosofi bot ke 16 buku keuangan institusional terkemuka"
      },
      {
        "step": "2. L2 Order Book Depth",
        "label": "Simulator antrian bid/ask, spoofing order palsu, dan metrik order imbalance"
      },
      {
        "step": "3. Dependency Fix",
        "label": "Resolusi dependensi melingkar antar-modal dialog"
      },
      {
        "step": "4. Build & Smoke Test",
        "label": "Verifikasi kompilasi produksi Vite dan integritas antarmuka"
      }
    ],
    "markdownContent": "\n### 📚 v4.9.0 — Literature Alignment & L2 Order Book Microstructure\n\n#### 🧠 1. Multi-Agent Arena Literature Alignment (16 Buku Finansial)\n- **Penyelarasan Literatur Resmi:** Mengaudit dan menghubungkan filosofi trading 16 bot autonomous langsung ke literatur akademis dan profesional:\n  * **John J. Murphy (1999):** *Technical Analysis of the Financial Markets* — pondasi chart pattern & intermarket analysis.\n  * **Marcos López de Prado (2018):** *Advances in Financial Machine Learning* — validasi Deflated Sharpe Ratio (DSR) & meta-labeling.\n  * **Robert Carver (2015):** *Systematic Trading* — manajemen posisi berbobot volatilitas & alokasi portofolio terukur.\n  * **Thomas N. Bulkowski:** *Fundamental Analysis and Position Trading* — statistik keandalan pola harga & breakout.\n  * **Mario Singh & Kathy Lien:** *Currency & Macro Trading* — transmisi suku bunga global & dinamika carry trade valas.\n  * **Abdulkader Aljandali:** *Quantitative Analysis and Statistics for Finance* — model regresi multivariat & uji kointegrasi.\n\n#### 📊 2. Level-2 Order Book Microstructure Simulator\n- **Komponen `OrderBookSimulator.jsx`:** Simulator interaktif mikrostruktur buku order L2 dengan kedalaman antrian bid/ask dinamis.\n- **Spoofing & Imbalance Radar:** Menghitung rasio ketidakseimbangan order buy vs sell (*Order Flow Imbalance*) dan mendeteksi spoofing bandar.\n\n#### 🛡️ 3. Smoke Test Suite & Build Hardening\n- Validasi build produksi Vite tanpa circular dependency.\n- Optimasi pemuatan modal TradingView dan kalender ekonomi.\n"
  },
  {
    "id": "pkg-21092026",
    "version": "Package 21092026 (v4.6.0 → v4.8.0)",
    "semanticVersion": "v4.8.0",
    "date": "21 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / 3 SESI TERPADU",
    "title": "Rilis Akbar 21 September 2026: AI Multi-Agent Integrity Refactor, Live USD/IDR Sync, Agent 16 CHAOS & Season 0.1 Calibration",
    "description": "Rekapitulasi terpadu rilis 21 September 2026 yang menggabungkan: Sesi 1 (Peluncuran Bot 16 CHAOS [The Rogue Singularity] & Genetic Rebirth), Sesi 2 (Engine Refactor Zero Side-Effects & Kurs Riil USD/IDR), dan Sesi 3 (Season 0.1 Auto-Label Calibration & Pair Recap Breakdown).",
    "processFlow": [
      {
        "step": "1. Sesi A (v4.6.0)",
        "label": "Agent 16 CHAOS, Carpet-Bomb Scalping, Self-Sovereign Ledger & Genetic Rebirth"
      },
      {
        "step": "2. Sesi B (v4.7.0)",
        "label": "AI Arena Engine Integrity Refactor, Zero Side-Effects Loop, Live USD/IDR Sync & WCAG Polish"
      },
      {
        "step": "3. Sesi C (v4.8.0)",
        "label": "Auto-Label Sesi Kalibrasi #0.1, Pair Recap Sub-Tab dengan Long/Short Breakdown & Bugfix"
      }
    ],
    "markdownContent": "\n### ⚡ Rekapitulasi Rilis Akbar 21 September 2026 (3 Sesi Rilis)\n\n---\n\n### 🚀 Sesi A — Update v4.6.0: Agent 16 CHAOS [The Rogue Singularity]\n- **Peluncuran Agent 16 CHAOS:** Bot ke-16 dengan filosofi rogue scalper independen yang agresif mengeksploitasi anomali volatilitas mikro.\n- **Unlimited Carpet-Bomb Scalping:** Algoritma scalping berfrekuensi tinggi dengan ukuran posisi terfragmentasi.\n- **Self-Sovereign Ledger & Genetic Rebirth:** Sistem pencatatan saldo mandiri per-bot dan mekanisme reset genetik saat terjadi drawdown berlebih.\n\n---\n\n### 🛠️ Sesi B — Update v4.7.0: AI Arena Engine Integrity & Live USD/IDR Sync\n- **Zero Side-Effects Loop:** Refaktor arsitektur state management arena AI untuk mencegah re-render berlebih dan race condition.\n- **Sinkronisasi Kurs Riil USD/IDR:** Seluruh metrik PnL dan alokasi modal dikonversi secara real-time ke Rupiah dengan kurs live Bank Indonesia / pasar spot.\n- **Dynamic KPIs & WCAG UI/UX Hardening:** Penyesuaian kontras rasio warna kartu bot dan indikator telemetri sesuai standar aksesibilitas WCAG.\n\n---\n\n### 🎯 Sesi C — Update v4.8.0: Season 0.1 Auto-Label Calibration & Pair Recap\n- **Auto-Label Sesi Kalibrasi #0.1:** Penandaan otomatis sesi trading kalibrasi historis untuk membedakan fase pengujian awal dengan eksekusi live.\n- **Pair Recap Sub-Tab:** Analisis performa per pasangan aset (IDX, Kripto, Forex) dengan pemisahan win-rate posisi Long vs Short.\n- **Perbaikan Auto-Start Bug:** Mengeliminasi bug timer yang sempat menghalangi inisialisasi bot arena secara otomatis saat halaman dimuat.\n",
    "table": [
      {
        "module": "Zero Side-Effects Engine",
        "status": "PROD",
        "category": "Architecture / Core",
        "summary": "Pure simulation loop dengan batch sequential dispatch"
      },
      {
        "module": "Live Dynamic USD/IDR",
        "status": "PROD",
        "category": "Quant / Exchange",
        "summary": "Sinkronisasi nilai tukar di 41 titik kalkulasi via usdToIdrRef"
      },
      {
        "module": "Dynamic KPI Metrics",
        "status": "PROD",
        "category": "Analytics / Math",
        "summary": "Sharpe ratio, running MDD, dan Win Rate dinamis dari data jurnal"
      },
      {
        "module": "Collision-Proof Trade IDs",
        "status": "PROD",
        "category": "Data Integrity",
        "summary": "Pencegahan duplikasi ID transaksi via timestamp Date.now()"
      },
      {
        "module": "WCAG ARIA Modal Dialogs",
        "status": "PROD",
        "category": "Accessibility / A11y",
        "summary": "Role dialog, aria-modal, dan labelledby pada 7 modal"
      },
      {
        "module": "Toast Stack Notification",
        "status": "PROD",
        "category": "UI / UX",
        "summary": "Queue multi-toast max 3 stack dengan slide-in animation"
      },
      {
        "module": "Touch Target Optimization",
        "status": "PROD",
        "category": "Ergonomics / Mobile",
        "summary": "Minimal tinggi tombol >= 24-26px dan typography floor >= 8px"
      },
      {
        "module": "Agent 16 CHAOS",
        "status": "PROD",
        "category": "AI Arena / Agents",
        "summary": "The Rogue Singularity Anomaly Agent (☣️ #a855f7)"
      },
      {
        "module": "Unlimited Carpet Bomb",
        "status": "PROD",
        "category": "Quant / Scalping",
        "summary": "Multi-position layering tanpa batasan kuantitas tiket"
      },
      {
        "module": "Self-Sovereign Ledger",
        "status": "PROD",
        "category": "Risk Management",
        "summary": "Modal terisolasi Rp 1M/bot, Total AUM dinamis Rp 16M"
      },
      {
        "module": "Genetic Auto-Rebirth",
        "status": "PROD",
        "category": "Evolution / Learning",
        "summary": "Auto-audit toxic pair, mutasi DNA, dan respawn Gen N+1"
      },
      {
        "module": "Deck Tab Anomaly",
        "status": "PROD",
        "category": "UI / Navigation",
        "summary": "Filter tab dedicated untuk mengisolasi Agen CHAOS"
      }
    ]
  },
  {
    "id": "pkg-20092026-v45",
    "version": "Package 20092026",
    "semanticVersion": "v4.5.0",
    "date": "20 September 2026",
    "status": "COMPLETED",
    "statusColor": "var(--accent-blue)",
    "badgeLabel": "STABLE RELEASE",
    "title": "Update Package 20092026 (v4.5 APEX): AI Multi-Agent Arena (15 Elemental Syndicate Bots), Locked 4-Column Deck, Independent Capital Ledger & Dynamic Sizing",
    "description": "Peluncuran akbar AI Multi-Agent Arena v4.5: Mengembangkan sistem dari 4 bot elemen dasar menjadi 15 bot independen (4 Base, 6 Duo, 4 Trio, dan 1 Master AVATAR Consensus). Menghadirkan Locked 4-Column Kanban Deck Grid dengan auto-wrap ke bawah, manajemen modal independen per bot (default Rp 1.000.000/bot) dengan indikator Total AUM dinamis (Rp 15.000.000), aturan kepatuhan arah instrumen (Saham BEI Long-Only, Kripto & Forex Dual Direction), dynamic position lot sizing anti-round-down, dan 100% Zero-Token Gemini AI runtime pada peramban klien.",
    "processFlow": [
      {
        "step": "1. Base 4 Elements",
        "label": "WATER, FIRE, AIR, EARTH (19/09)"
      },
      {
        "step": "2. 6 Duo Combos",
        "label": "STEAM, STORM, MUD, LIGHTNING, LAVA, SANDSTORM (20/09)"
      },
      {
        "step": "3. 4 Trio Combos",
        "label": "TEMPEST, OCEANIC, GEOTHERMAL, CYCLONE (20/09)"
      },
      {
        "step": "4. Master & 4-Col Grid",
        "label": "AVATAR Consensus & Locked 4-Col Kanban (20/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Akbar v4.5 APEX (Highlights 20/09)\n- **15 AI Multi-Agent Roster Lengkap (4 Base + 11 Fusi Elemen):**\n  - **4 Elemen Dasar:**\n    - 💧 **WATER (water-smc):** Liquidity Hunter (Smart Money Concepts) — Mendeteksi Order Block retest pasca liquidity sweep.\n    - 🔥 **FIRE (fire-momentum):** Momentum Trend Rider — Mengendarai tren kuat via EMA 9/21 ribbon & Donchian Channel breakout.\n    - 🌪️ **AIR (air-scalper):** High-Frequency Micro Scalper — Scalping kilat memanfaatkan micro FVG dan RSI(7) momentum.\n    - 🌍 **EARTH (earth-reversal):** Mean-Reversion Guardian — Menangkap pembalikan harga ekstrim dari Bollinger Bands 3 SD & RSI divergensi.\n  - **6 Kombo Duo (C(4,2)):**\n    - 💨 **STEAM [W+F]:** Liquidity News Sniper — Sweep likuiditas SMC dikonfirmasi lonjakan volume berita katalis.\n    - ⛈️ **STORM [W+A]:** SMC Trend Breakout — Konfirmasi Break of Structure (BOS) HTF + micro-breakout cepat.\n    - 🧱 **MUD [W+E]:** Liquidity Reversal Absorber — Sapuan likuiditas OB yang terabsorpsi di batas oversold/overbought ekstrim.\n    - ⚡ **LIGHTNING [F+A]:** Momentum Scalper Flash — Trend momentum impulsif dipadu eksekusi micro scalping agresif.\n    - 🌋 **LAVA [F+E]:** Post-News Reversal Fade — Memudar (*fade*) candle spike berita ketika harga menembus batas Bollinger 3 SD.\n    - 🏜️ **SANDSTORM [A+E]:** Range Scalper Mean Revert — Scalping mikro osilasi cepat di dalam rentang sideways.\n  - **4 Kombo Trio (C(4,3)):**\n    - 🌀 **TEMPEST [W+F+A]:** Hyper-Aggressive Trend Syndicate — Sapuan likuiditas SMC memicu akselerasi tren + micro scaling.\n    - 🌊 **OCEANIC [W+A+E]:** Smart Money Mean Reversion Anchor — Pengawal likuiditas institusional dengan penyerapan pembalikan arah terkontrol.\n    - 🌋 **GEOTHERMAL [W+F+E]:** Fundamental Macro Reversal Core — Penyerapan sentimen makro ekstrem diikuti akumulasi institusi skala besar.\n    - 🌪️ **CYCLONE [F+A+E]:** Dynamic Volatility Trend Engine — Ekspansi volatilitas Bollinger Bands dipadu trailing stop dinamis.\n  - **1 Master Ensemble (C(4,4)):**\n    - 🌟 **AVATAR [W+F+A+E]:** Consensus Multi-Agent Ensemble — Mengintegrasikan sistem pemungutan suara (voting) dari ke-4 elemen dasar. Order hanya dieksekusi jika $\\ge 3$ agen sepakat pada arah yang sama.\n- **Locked 4-Column Grid (`.arena-locked-4col-grid`):**\n  - Pada layar desktop ($\\ge 1180\\text{px}$), kartu kanban bot terkunci rapi tepat 4 kolom per baris dan menghasilkan baris ke bawah (4 baris $\\times$ 4 kolom).\n  - Mengeliminasi layout shift dan ketidaksejajaran ukuran kartu. Layar tablet otomatis switch ke 2 kolom dan mobile ke 1 kolom.\n- **Deck View Navigation Filter Tabs:**\n  - Tab filter cepat untuk kemudahan monitoring: **Semua Bot (15)**, **4 Elemen Dasar**, **6 Kombo Duo**, dan **5 Sindikat (Trio & Master)**.\n- **Manajemen Modal Independen & Dynamic Total AUM:**\n  - Setiap bot diberikan modal awal terisolasi (default Rp 1.000.000/bot).\n  - Total AUM terhitung otomatis secara transparan: **Total AUM: Rp 15.000.000 (15 Bot)**.\n  - Kerugian, margin call, dan keuntungan bot satu sama sekali tidak mempengaruhi bot lainnya.\n- **Aturan Directional Safety Berstandar Regulasi:**\n  - **Saham BEI (IDX):** Terkunci secara ketat **LONG-ONLY** (Dilarang Short Selling sesuai regulasi pasar modal Indonesia).\n  - **Crypto Perp & Forex:** Mendukung **LONG & SHORT** dua arah secara penuh.\n- **Dynamic Lot Sizing Anti-Round-Down:**\n  - Formula `calculateInstrumentLotSize` mengalokasikan target margin $\\approx$ Rp 30.000 / notional $\\approx$ $37 USD pada leverage 1:20.\n  - Mengatasi bug floating PnL bernilai Rp 0 pada koin berharga rendah seperti ADA, XRP, PEPE, dan DOGE.\n- **Zero-Token AI Runtime:**\n  - Seluruh mesin pemindaian, state machine, dan logika kombo beroperasi 100% secara deterministik kuantitatif di sisi klien tanpa mengonsumsi token API Gemini pengguna.",
    "table": [
      {
        "module": "15 Multi-Agent Roster",
        "status": "PROD",
        "category": "AI Arena / Agents",
        "summary": "4 Base Elements + 6 Duo Combos + 4 Trio + 1 Master AVATAR"
      },
      {
        "module": "Locked 4-Col Grid",
        "status": "PROD",
        "category": "UI / Kanban",
        "summary": "Grid 4 kolom terkunci di desktop, wrap ke bawah secara proporsional"
      },
      {
        "module": "Independent Capital Ledger",
        "status": "PROD",
        "category": "Risk Management",
        "summary": "Modal terisolasi default Rp 1.000.000 per bot + dynamic Total AUM Rp 15M"
      },
      {
        "module": "Directional Compliance Gate",
        "status": "PROD",
        "category": "Compliance",
        "summary": "BEI Strictly Long-Only; Kripto Futures & Forex mendukung Long & Short"
      },
      {
        "module": "Dynamic Lot Sizing",
        "status": "PROD",
        "category": "Quant / Execution",
        "summary": "Kalkulasi lot proporsional mengeliminasi floating PnL Rp 0 pada altcoins"
      },
      {
        "module": "Deck View Navigation",
        "status": "PROD",
        "category": "UI / Filter",
        "summary": "Filter tab: Semua Bot (15), 4 Base, 6 Duo, 5 Sindikat (Trio & Master)"
      },
      {
        "module": "Zero-Token Runtime Engine",
        "status": "PROD",
        "category": "Architecture",
        "summary": "100% deterministik kuantitatif klien tanpa mengonsumsi kuota token LLM"
      }
    ]
  },
  {
    "id": "pkg-19092026-v42",
    "version": "Package 19092026",
    "semanticVersion": "v4.2.0",
    "date": "19 September 2026",
    "status": "STABLE",
    "statusColor": "#38bdf8",
    "badgeLabel": "STABLE",
    "title": "Update Package 19092026 (v4.2 APEX): AI Agent Arena Genesis (4 Elements), Zero Simulation Policy, Post-Mortem Session 0 Archive & Resilient Session Timer",
    "description": "Fondasi peluncuran perdana AI Multi-Agent Arena: Memperkenalkan 4 agen kuantitatif elemen dasar (WATER, FIRE, AIR, EARTH) yang bertarung otonom, penegakan Zero Simulation Policy (eliminasi 100% synthetic tick delta demi data riil WebSocket Binance & Scanner TV), arsip post-mortem Sesi 0 Genesis (+Rp 255M PnL) serta evolusi DNA Gen 2, resilient uptime timer berbasis delta Date.now & visibilitychange, serta normalisasi TP/SL berbasis Dynamic Proportional ATR.",
    "processFlow": [
      {
        "step": "1. Tri-Signal Matrix",
        "label": "Wall St US Equities Added (18/09)"
      },
      {
        "step": "2. Zero-Simulation Gate",
        "label": "Purge Synthetic Ticks (19/09)"
      },
      {
        "step": "3. 4 Base Elements",
        "label": "WATER, FIRE, AIR, EARTH Genesis (19/09)"
      },
      {
        "step": "4. Post-Mortem & Gen 2",
        "label": "Session 0 Debrief & Evolution (19/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Akbar v4.2 APEX (Highlights 19/09)\n- **Peluncuran Perdana AI Multi-Agent Arena (4 Elemen Dasar):**\n  - Mengembangkan platform perdagangan otonom berbasis peramban dengan 4 kepribadian kuantitatif elemen inti:\n    - 💧 **WATER:** Smart Money Concepts (SMC), Order Blocks & Liquidity Sweeps.\n    - 🔥 **FIRE:** Event-driven momentum menangkap lonjakan volatilitas berita makro ekonomi.\n    - 🌪️ **AIR:** High-Frequency Scalper & Donchian Channel trend breakout.\n    - ⛰️ **EARTH:** Mean-reversion guardian memanfaatkan batas deviasi ekstrem Bollinger Bands 3 SD.\n- **Penegakan Zero Simulation Policy Mutlak:**\n  - Menghapus seluruh generator tick sintetis (*random fake ticks*) dan `Math.random()` dari pipeline harga.\n  - Sinyal dan floating PnL 100% dihitung dari denyut data pasar nyata: Binance MiniTicker WebSocket (kripto) dan TradingView Scanner (saham IDX, US, Forex, Emas, Minyak).\n  - Mengimplementasikan **Weekend Freeze** di mana kuotasi saham bursa konvensional terkunci rapi pada *Official Closing Price* tanpa deviasi palsu saat pasar tutup.\n- **Arsip Sesi #0 Genesis & Institutional Quant Post-Mortem:**\n  - Menyimpan rekapitulasi audit performa Sesi 0 (9.832 trade historis, total keuntungan bersih +Rp 255.462.417, win rate 21.0%).\n  - Menyediakan modal telaah mendalam (*Institutional Post-Mortem Debrief*) yang menganalisis rasio Risk/Reward, frekuensi transaksi, dan pemicu Margin Call (MC).\n  - Menginisiasi mutasi DNA agen menuju **Generasi 2 (Gen 2)** dengan parameter SL/TP trailing yang lebih adaptif.\n- **Resilient Session Uptime Timer:**\n  - Memperbaiki ketahanan timer durasi sesi arena menggunakan pelacak selisih waktu nyata (`Date.now()` delta tracking) dan pendengar event `visibilitychange` serta `window.focus`.\n  - Jam sesi tetap berjalan akurat dan tidak melambat (*throttled*) ketika peramban pengguna berpindah tab atau berjalan di latar belakang.\n- **Dynamic Proportional ATR & Position Normalizer:**\n  - Menggantikan batas ATR statis dengan Dynamic Proportional ATR yang menyesuaikan volatilitas spesifik masing-masing instrumen (0.35% Forex, 1.0% Saham, 1.2% Kripto).\n  - Melakukan normalisasi otomatis terhadap posisi lawas agar target TP dan batas keras Hard SL selalu berada pada rentang batas risiko institusional.",
    "table": [
      {
        "module": "4 Elements Genesis Arena",
        "status": "PROD",
        "category": "AI Arena / Engine",
        "summary": "WATER, FIRE, AIR, EARTH autonomous algorithmic trading agents"
      },
      {
        "module": "Zero Simulation Enforcement",
        "status": "PROD",
        "category": "Data Integrity",
        "summary": "100% data riil WebSocket Binance & TV Scanner; nol tick sintetis"
      },
      {
        "module": "Session 0 Post-Mortem Archive",
        "status": "PROD",
        "category": "Analytics / Audit",
        "summary": "Arsip audit 9.832 trade Genesis Sesi 0 (+Rp 255M PnL) & evaluasi MC"
      },
      {
        "module": "Gen 2 DNA Evolution",
        "status": "PROD",
        "category": "Reinforcement RL",
        "summary": "Adaptasi parameter DNA SL/TP trailing pasca evaluasi performa"
      },
      {
        "module": "Resilient Delta Uptime Timer",
        "status": "PROD",
        "category": "Telemetry",
        "summary": "Date.now delta tracking tahan sleep/background browser tabs"
      },
      {
        "module": "Dynamic Proportional ATR",
        "status": "PROD",
        "category": "Risk Management",
        "summary": "Penyesuaian TP/SL proporsional terhadap volatilitas riil per instrumen"
      },
      {
        "module": "Weekend Market Freeze Gate",
        "status": "PROD",
        "category": "Compliance",
        "summary": "Harga bursa konvensional terkunci pada official close saat libur"
      }
    ]
  },
  {
    "id": "pkg-18092026-v41",
    "version": "Package 18092026",
    "semanticVersion": "v4.1.0",
    "date": "18 September 2026",
    "status": "STABLE",
    "statusColor": "#38bdf8",
    "badgeLabel": "STABLE",
    "title": "Update Package 18092026 (v4.1 APEX): Tri-Signal Matrix Cockpit, US Stock Signals, Authentic Logos (IDX, Crypto, Wall St) & Laser-Aligned 6px Geometry",
    "description": "Penyempurnaan visual dan fungsional Cockpit Command Center: Memperluas radar sinyal Row 3 dari dual-box menjadi Tri-Signal Matrix (Saham IDX, Crypto Spot, dan US Stock Signals), integrasi logo/favicon resmi PT dan koin kripto di setiap baris ticker via Google Favicon CDN 64px & CoinCap/TradingView progressive waterfall, penstabilan layout dengan tableLayout fixed dan formatter desimal mikro, serta unifikasi presisi batas laser gap 6.0px terhadap Live News Wire.",
    "processFlow": [
      {
        "step": "1. Dual Cockpit Baseline",
        "label": "IDX & Crypto Only (17/09)"
      },
      {
        "step": "2. Tri-Signal Architecture",
        "label": "Wall St US Signals Added (18/09)"
      },
      {
        "step": "3. Authentic Logo CDN",
        "label": "Official PT & CoinCap Waterfall (18/09)"
      },
      {
        "step": "4. Laser-Aligned 6px",
        "label": "Perfect Grid Geometry (18/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Akbar v4.1 APEX (Highlights 18/09)\n- **Tri-Signal Matrix 3-Pasar (Saham IDX, Crypto Spot, US Stocks):** Menambahkan kotak sinyal ketiga untuk saham bursa Wall Street Amerika Serikat (AAPL, NVDA, MSFT, META, GOOGL, AMD, TSLA, dll.) berdampingan simetris dengan Saham IDX dan Crypto Spot pada Row 3 Home Cockpit.\n- **Logo Resmi Asli di Setiap Ticker (IDX, Kripto, Wall St):**\n  - **Saham IDX:** Menampilkan favicon/logo resmi dari website masing-masing PT emiten (PT Petrindo Jaya Kreasi / CUAN, PT Petrosea / PTRO, PT Salim Ivomas Pratama / SIMP, PT Astra Graphia / ASGR, PT Supra Boga Lestari / RANC, PT Singaraja Putra / SINI, PT Jhonlin Agro Raya / JARR, dll.) melalui integrasi Google Favicon CDN 64px resolusi tinggi pada `stock-icons.js` dan `AssetIcon.jsx`.\n  - **Crypto Spot:** Progressive CDN waterfall multi-tier (`CoinCap 2x CDN` $\\rightarrow$ `TradingView SVG` $\\rightarrow$ `spothq CDN` $\\rightarrow$ `vector fallback`) memastikan 100% token (termasuk PEPE, FET, NEAR, APT, BTC, ETH) memuat logo resmi asli tanpa error 404 atau pemblokiran CORS.\n  - **US Stocks:** Logo korporat autentik untuk raksasa teknologi dan institusional Wall Street (Nvidia, Apple, Microsoft, Meta, Google, AMD, Tesla, Goldman Sachs).\n- **Stabilisasi Grid & Anti-Overflow (`tableLayout: 'fixed'`):** Seluruh 3 tabel sinyal dikunci dengan `tableLayout: fixed` dan alokasi persentase kolom proporsional (28% Ticker, 22% Setup, 17% Entry, 16% SL, 17% TP1), mengeliminasi geseran layout (*layout shift*) saat angka harga berfluktuasi.\n- **Formatter Harga Kripto Mikro (`formatCryptoPrice`):** Format angka dinamis yang menangani aset berdesimal banyak (seperti koin meme PEPE `0.000004`) sehingga tidak meregangkan kolom dan menjaga header TP1 tetap terlihat utuh.\n- **Unifikasi Gap Laser-Aligned 6.0px:** Mengunci celah pembatas horizontal dan vertikal antar-kartu dan antar-baris tepat pada `6.0px`. Menyelaraskan batas kanan seluruh 4 baris Cockpit sejajar lurus tanpa celah berlebih terhadap Live News Wire Sidebar.\n- **Sinkronisasi Baris Status Row 4:** Indikator instrumen diperbarui menjadi `82 IDX · 10 CRYPTO · 31 US EQUITIES` yang merefleksikan cakupan multiaset lengkap terminal.",
    "table": [
      {
        "module": "Tri-Signal Matrix",
        "status": "PROD",
        "category": "Cockpit / Signals",
        "summary": "3 kotak sejajar: Saham IDX, Crypto Spot, dan US Stock Signals"
      },
      {
        "module": "US Stock Signals",
        "status": "PROD",
        "category": "US Equities",
        "summary": "Setup 31 saham Wall St (AAPL, NVDA, MSFT, META, dll.)"
      },
      {
        "module": "Official PT Favicon CDN",
        "status": "PROD",
        "category": "UI / Asset",
        "summary": "Logo resmi emiten BEI via Google Favicon CDN 64px"
      },
      {
        "module": "Crypto Progressive CDN",
        "status": "PROD",
        "category": "UI / Asset",
        "summary": "Multi-tier CoinCap 2x + TradingView + Spothq CDN waterfall"
      },
      {
        "module": "Fixed Table Geometry",
        "status": "PROD",
        "category": "UI / Layout",
        "summary": "tableLayout fixed 5 kolom stabil tanpa layout shift atau text clip"
      },
      {
        "module": "Crypto Micro Formatter",
        "status": "PROD",
        "category": "UI / Numbers",
        "summary": "formatCryptoPrice menjaga kejelasan desimal PEPE & altcoins"
      },
      {
        "module": "Laser-Aligned 6px Gaps",
        "status": "PROD",
        "category": "CSS / Grid",
        "summary": "Seluruh gap vertikal/horizontal rata sempurna 6.0px ke News Wire"
      },
      {
        "module": "Telemetry Strip Sync",
        "status": "PROD",
        "category": "Telemetry",
        "summary": "82 IDX · 10 CRYPTO · 31 US EQUITIES status bar"
      }
    ]
  },
  {
    "id": "pkg-17092026-v4",
    "version": "Package 17092026",
    "semanticVersion": "v4.0.0",
    "date": "17 September 2026",
    "status": "STABLE",
    "statusColor": "#38bdf8",
    "badgeLabel": "STABLE",
    "title": "Update Package 17092026 (v4.0 APEX): Dual-Speed Reactive Quant Engine, Live Trailing Stop to BE, Zero-Cron Architecture & 100% Cloudflare Pages",
    "description": "Lompatan arsitektur terbesar v4.0 APEX: Mengubah sistem dari snapshot statis berbasis cron menjadi Dual-Speed Reactive Quant Platform. Menghadirkan Reactive Strategy Engine klien (dynamicStrategy.js), Dynamic Trailing Stop Loss ke Breakeven (BE 🛡️), eliminasi 100% scheduled cron jobs di GitHub Actions, pembersihan total artefak Vercel untuk standardisasi Cloudflare Pages murni, Multi-Chart Grid (2x2 / 1x2), Institutional Security Hub Drawer, Bloomberg v4.0 12-Stream News Intelligence, Market Heatmap Treemap, Authentic Brand Logos (IDX, US, Forex), Watcher Whale Radar (>100 BTC) dengan Audio Chime, dan Anti-Stale Cache-Busting.",
    "processFlow": [
      {
        "step": "1. Baseline & Cron",
        "label": "Static Snapshots (08-12/09)"
      },
      {
        "step": "2. APEX v3.0",
        "label": "Whale, Futures & Forex (16/09)"
      },
      {
        "step": "3. Zero-Cron Decouple",
        "label": "Eliminate Cron & Git Skip (17/09)"
      },
      {
        "step": "4. APEX v4.0",
        "label": "Reactive Engine & Cloudflare (17/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Akbar v4.0 APEX (Highlights 17/09)\n- **Client-Side Reactive Strategy Engine (`dynamicStrategy.js`):** Mesin kuantitatif adaptif yang mengevaluasi sinyal trading plan secara seketika (< 1 detik via Binance WebSocket, 20 detik via TradingView Scanner) langsung di peramban pengguna. Menghadirkan State Machine Sinyal 7-fase (`ENTRY_TRIGGER`, `IN_POSITION`, `TP1_HIT`, `TP2_HIT`, `EXTENDED / NO FOMO`, `STOPPED_OUT`, `WAITING_PULLBACK`).\n- **Dynamic Trailing Stop Loss ke Breakeven (BE 🛡️):** Perlindungan modal otomatis tingkat lanjut. Begitu harga live menyentuh Target 1 (TP1), level Stop Loss otomatis diratchet naik ke level Entry (*Risk-Free Trade*), mengunci modal pokok trader dari pembalikan harga mendadak.\n- **Floating Risk/Reward & Live PnL:** Perhitungan dinamis rasio Risk-to-Reward aktual dan floating profit/loss secara instan mengikuti fluktuasi tick harga pasar.\n- **100% Eliminasi Scheduled Cron Jobs di GitHub Actions:** Seluruh 6 workflow otomatisasi berkala (`hourly_crypto_macro`, `intraday_idx_refresh`, `daily_idx_morning`, `midday_sesi1_recap`, `daily_idx_eod`, `evening_global_watch`) telah dinonaktifkan dari jadwal cron otomatis dan dialihkan ke pemicu manual (*workflow_dispatch*). Menghilangkan ketergantungan pada bot git-commit `[skip ci]` yang sebelumnya membekukan deployment dan memicu konflik cache.\n- **Pembersihan Total Artefak Vercel & Penyelarasan Cloudflare Pages Murni:** Menghapus seluruh file konfigurasi usang `vercel.json` dan `frontend/vercel.json`. Seluruh ekosistem MBG Trading kini terstandarisasi 100% pada infrastruktur **Cloudflare Pages & Edge Functions** (`https://mbg-trading.pages.dev`) tanpa jejak Vercel.\n- **Multi-Chart Grid & Institutional Security Hub Drawer:** Visualisasi teknikal tingkat lanjut dengan grid multi-grafik interaktif (2x2 / 1x2) TradingView dan Security Hub Drawer geser komprehensif yang menampilkan data fundamental, rekapitulasi bandarmologi, dan metrik teknikal emiten.\n- **Bloomberg Terminal v4.0 (12-Stream News Intelligence):** 12 saluran stream berita terklasifikasi (IHSG, Perbankan, Komoditas, Makro AS, Kripto, The Fed, Geopolitik) yang dilengkapi radar sentimen multi-agen dan korelasi antar-pasar (*Intermarket Correlation Matrix*).\n- **Market Heatmap Treemap Dinamis:** Peta visual interaktif saham BEI dan pasar Kripto dengan pewarnaan gradasi performa harga serta proporsi bobot nilai transaksi (*turnover*).\n- **Authentic Brand Logos & Multi-Market Badges:** Integrasi aset logo SVG otentik emiten blue-chip BEI (BBCA, BBRI, BMRI, BBNI, ASII, TLKM, dll.), saham teknologi AS, dan lencana bendera ganda (*dual-flag badges*) untuk pasangan mata uang Forex.\n- **Watcher Whale Radar (>100 BTC) & Audio Chime:** Radar pelacak transaksi paus on-chain berukuran raksasa (>100 BTC) dilengkapi lonceng audio instan dan verifikasi hash transaksi langsung ke Blockchain Explorer.\n- **Anti-Stale Cache-Busting:** Pemasangan parameter timestamp dinamis `?v=${Date.now()}` serta header `{ cache: 'no-cache' }` pada pemuatan bundle data di `App.jsx`, menjamin browser tidak terjebak dalam respons HTTP 304 Not Modified.\n- **Dividend Hunter Live Binding:** Harga saham pada radar dividen kini terhubung dinamis dengan data kuotasi TradingView Scanner, memastikan kalkulasi estimasi yield selalu akurat mengikuti harga pasar berjalan.",
    "table": [
      {
        "module": "Reactive Strategy Engine",
        "status": "PROD",
        "category": "Engine / Quant",
        "summary": "State machine adaptif real-time (<1s Crypto, 20s IDX) via dynamicStrategy.js"
      },
      {
        "module": "Dynamic Trailing Stop (BE)",
        "status": "PROD",
        "category": "Risk Management",
        "summary": "SL otomatis naik ke level Entry saat TP1 tercapai (Risk-Free Trade)"
      },
      {
        "module": "Zero-Cron Architecture",
        "status": "PROD",
        "category": "CI/CD",
        "summary": "Menghapus 6 jadwal cron otomatis; bebas bot commit [skip ci]"
      },
      {
        "module": "Pembersihan Vercel",
        "status": "PROD",
        "category": "Platform",
        "summary": "100% Cloudflare Pages native; vercel.json root & frontend dihapus"
      },
      {
        "module": "Multi-Chart Grid",
        "status": "PROD",
        "category": "Charting",
        "summary": "Grid multi-grafik interaktif (2x2 / 1x2) TradingView"
      },
      {
        "module": "Security Hub Drawer",
        "status": "PROD",
        "category": "Research",
        "summary": "Drawer fakta fundamental, bandarmologi, dan metrik teknikal"
      },
      {
        "module": "Bloomberg v4.0 Terminal",
        "status": "PROD",
        "category": "News Intelligence",
        "summary": "12 stream berita interaktif + radar sentimen multi-agen"
      },
      {
        "module": "Market Heatmap Treemap",
        "status": "PROD",
        "category": "Visualization",
        "summary": "Peta panas pasar saham BEI & kripto berbasis nilai transaksi"
      },
      {
        "module": "Brand Logos & Badges",
        "status": "PROD",
        "category": "UI / Asset",
        "summary": "Logo SVG emiten BEI, saham US, dan bendera ganda Forex"
      },
      {
        "module": "Watcher Whale (>100 BTC)",
        "status": "PROD",
        "category": "On-Chain Alert",
        "summary": "Deteksi transfer paus raksasa + audio alert chime + tx explorer"
      },
      {
        "module": "Cache-Busting Anti-304",
        "status": "PROD",
        "category": "Networking",
        "summary": "Timestamp query parameter ?v= menjamin data selalu fresh"
      },
      {
        "module": "Dividend Live Binding",
        "status": "PROD",
        "category": "Data Desk",
        "summary": "Harga saham dividen terhubung langsung ke TradingView Scanner"
      }
    ]
  },
  {
    "id": "pkg-16092026-v3",
    "version": "Package 16092026",
    "semanticVersion": "v3.0.0",
    "date": "16 September 2026",
    "status": "STABLE",
    "statusColor": "#38bdf8",
    "badgeLabel": "STABLE",
    "title": "Update Package 16092026 (v3.0 APEX): Whale Intelligence Hub, Running Trade BEI, Crypto Futures, Forex & Intraday Sync",
    "description": "Rilis akbar v3.0 menghadirkan integrasi holistik: Pelacakan Paus Kripto On-Chain (0s delay Mempool WS), Broker Summary & Portofolio Tracker BEI (Stockbit Style), Live Running Trade BEI, Dashboard Crypto Futures, Forex Command Center 28-Pair, US Stock Intelligence, Kalender Makro 40+ Event, CryptoWave Live News, NewsDetailModal, dan sinkronisasi intraday 30 menit.",
    "processFlow": [
      {
        "step": "1. Baseline Core",
        "label": "Quant & Plans (08-09/09)"
      },
      {
        "step": "2. Telegram & Desk",
        "label": "Serverless Edge (10/09)"
      },
      {
        "step": "3. Cockpit V2",
        "label": "SoSoValue Layout (11-12/09)"
      },
      {
        "step": "4. APEX v3.0",
        "label": "Whale, Futures & Forex (16/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Akbar v3.0 (Highlights 16/09)\n- **Whale Intelligence Hub & Real-time Mempool WS:** Pelacakan paus on-chain Bitcoin & Ethereum real-time tanpa delay via WebSocket `wss://mempool.space/api/v1/ws` (100% gratis, tanpa API key) dengan deteksi Exchange Inflow/Outflow, verifikasi hash transaksi langsung ke Blockchain Explorer, dan analisis dampak likuiditas.\n- **Running Trade Live Saham BEI (Stockbit Style):** Streaming tick transaksi pasar modal Indonesia real-time dengan aksi BUY (Haka)/SELL (Haki), filter lot cerdas (Whale ≥500 lot, Mega Whale ≥1.000 lot), identifikasi broker Buyer & Seller (Asing/Domestik), dan kontrol Pause/Resume.\n- **Radar Asing & Portofolio Broker Tracker:** Rekapitulasi lengkap 18+ broker anggota bursa (AK, BK, CS, KZ, RX, CC, NI, YP, PD, SQ, dll.) dengan filter rentang waktu (1D EOD, 3D, 1W, 1M MTD), perhitungan harga beli rata-rata (*Avg Buy*), harga jual rata-rata (*Avg Sell*), net lot pegang barang, dan harga rata-rata akumulasi (*Avg Hold*).\n- **Wall Street 13F Hedge Fund Desk:** Pemantauan portofolio institusi global tier-1 (Berkshire Hathaway / Warren Buffett, Citadel / Ken Griffin, Bridgewater / Ray Dalio, Renaissance Technologies / Jim Simons Desk) dengan rincian saham, nilai pasar USD, bobot portofolio (% AUM), dan estimasi avg cost.\n- **Crypto Futures Intelligence:** Dashboard komprehensif 15 pair futures dari Binance: Funding Rate heatmap (sinyal overleveraged/squeeze), Open Interest vs Price divergence, rasio Long/Short global, dan radar likuidasi 24 jam.\n- **Forex Command Center:** Pemindai 28 pair mata uang via TradingView Scanner, kalkulator risiko pip interaktif (USD & IDR), jam sesi pasar global (Sydney/Tokyo/London/New York), dan laporan CFTC Commitment of Traders (COT).\n- **US Stock Intelligence:** Pemindai 30 emiten terpopuler AS (AAPL, NVDA, MSFT, TSLA, GOOGL, dll.) dengan heatmap performa sektor, setup top 5 trade plans, dan kalender earnings dengan countdown zona bahaya.\n- **Kalender Makro Global 40+ Event:** Jadwal rilis kebijakan moneter lengkap (US, ID, EU, GB, JP, CN, AU, OPEC+) dengan filter multi-negara, klasifikasi dampak (Tinggi/Sedang/Rendah), status rilis, dan kartu edukasi analisis dampak ke instrumen Forex, Saham, Emas, dan Kripto.\n- **CryptoWave Live News & Interactive NewsDetailModal:** Scraper berita terkini dari CryptoWave Indonesia terintegrasi dengan modal detail interaktif dan 3 Key Takeaways Stockbit Snips.\n- **Otomasi EOD BEI & Intraday 30-Min Sync:** Workflow otomatisasi GitHub Actions penarikan data resmi Broker Summary EOD pukul **18:15 WIB** pasca tutup pasar dan refresh intraday setiap 30 menit.\n- **Auto 1D Timeframe Charting:** TradingView Chart Modal dan Institutional Charting Desk otomatis menyetel interval ke `1D` untuk saham IDX dan mengenali prefix pasar `FX:`, `NASDAQ:`, `BINANCE:`, dan `IDX:`.",
    "table": [
      {
        "module": "Whale Hub & Mempool WS",
        "status": "PROD",
        "category": "Intelligence",
        "summary": "On-chain stream real-time 0s delay + verifikasi explorer tx"
      },
      {
        "module": "Running Trade BEI",
        "status": "PROD",
        "category": "Trading Desk",
        "summary": "Stockbit style streaming trade + filter lot whale & kode broker"
      },
      {
        "module": "Broker Summary & Portfolio",
        "status": "PROD",
        "category": "Bandarmology",
        "summary": "Rekap semua broker + avg buy/sell price + net lot holding"
      },
      {
        "module": "Wall Street 13F Desk",
        "status": "PROD",
        "category": "Institutional",
        "summary": "Breakdown portofolio Berkshire, Citadel, Bridgewater, Simons"
      },
      {
        "module": "Crypto Futures Hub",
        "status": "PROD",
        "category": "Futures",
        "summary": "Funding rate 15 pairs + Open Interest + Liquidation radar"
      },
      {
        "module": "Forex Command Center",
        "status": "PROD",
        "category": "Forex",
        "summary": "28-pair scanner + Pip calculator + CFTC COT positioning"
      },
      {
        "module": "US Stock Screener",
        "status": "PROD",
        "category": "US Equities",
        "summary": "30 top US stocks + Earnings calendar + Sector heatmap"
      },
      {
        "module": "Kalender Makro 40+ Event",
        "status": "PROD",
        "category": "Macro",
        "summary": "40+ event US, ID, EU, GB, JP, CN + multi-filter negara & impact"
      },
      {
        "module": "CryptoWave News",
        "status": "PROD",
        "category": "News",
        "summary": "Scraper live news CryptoWave + NewsDetailModal + Stockbit takeaways"
      },
      {
        "module": "EOD Automation (18:15 WIB)",
        "status": "PROD",
        "category": "Cron / Workflow",
        "summary": "Penarikan data harian resmi EOD BEI otomatis pasca jam 18:00"
      },
      {
        "module": "Chart Timeframe 1D",
        "status": "PROD",
        "category": "Charting",
        "summary": "Auto-set interval 1D untuk saham IDX + adaptive market selector"
      },
      {
        "module": "Intraday 30-Min Sync",
        "status": "PROD",
        "category": "Engine / Cron",
        "summary": "Pipeline update 30 menit bursa IDX + multi-tier foreign flow"
      },
      {
        "module": "NewsDetailModal",
        "status": "PROD",
        "category": "UI / News",
        "summary": "Modal pop-up detail berita + 3 Key Takeaways Stockbit Snips"
      },
      {
        "module": "Bull-Bear Debate",
        "status": "PROD",
        "category": "AI / Quant",
        "summary": "Sintesis multi-agen analisa risiko sentimen saham IDX"
      }
    ]
  },
  {
    "id": "pkg-1315092026",
    "version": "Package 13092026-15092026",
    "semanticVersion": "v2.4.0-staging",
    "date": "13 - 15 September 2026",
    "status": "STABLE",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "STABLE / TELEMETRY & STAGING",
    "title": "Siklus Pemeliharaan Telemetri Otomatis 24/7 & Staging Pipeline Bloomberg v3.0 Terminal",
    "description": "Dokumentasi aktivitas sistem pada tanggal 13, 14, dan 15 September 2026: Pemeliharaan data stream otomatis per jam (cron telemetry crypto, futures, foreign flow EOD broker summary, dan morning market plans), serta fase pengembangan & staging integrasi masif 4 modul baru (Whale Intelligence, Crypto Futures, Forex Command, dan US Stock Intelligence) sebelum rilis akbar v3.0 pada 16 September.",
    "processFlow": [
      {
        "step": "1. Automated Hourly Cron",
        "label": "Sinkronisasi telemetri likuiditas makro dan harga kripto setiap 60 menit via GitHub Actions"
      },
      {
        "step": "2. EOD Broker Summary",
        "label": "Agregasi data penutupan transaksi harian BEI pada pukul 18:15 WIB dan rencana pagi 08:30 WIB"
      },
      {
        "step": "3. Feature Staging Desk",
        "label": "Pembangunan 4 modul baru di branch staging (Whale Tracker, Futures, Forex, US Stock)"
      },
      {
        "step": "4. Pre-v3.0 Integration",
        "label": "Pengujian zero-delay Mempool Bitcoin WebSocket dan Binance Futures liquidation radar"
      }
    ],
    "markdownContent": "\n### 🔄 Siklus Pemeliharaan Telemetri Otomatis & Staging Pipeline v3.0 (13 - 15 September 2026)\n\n> [!NOTE]\n> Pada tanggal 13 (Minggu), 14, dan 15 September 2026, sistem bursa beroperasi dalam jadwal akhir pekan/awal pekan. Tidak ada rilis fitur publik baru pada antarmuka, melainkan **fase intensif pemeliharaan background cron telemetri dan integrasi fitur akbar v3.0**.\n\n#### 🤖 1. Pemeliharaan Otomatis Telemetri 24/7 (Hourly Cron)\n- **Sinkronisasi Likuiditas & Kripto:** Menjalankan pipeline cron otomatis setiap jam (`sync hourly crypto & macro telemetry`) tanpa henti.\n- **EOD Broker Summary BEI:** Mengambil dan merekap data aliran dana broker asing/domestik setiap pukul 18:15 WIB.\n- **Evening Global Watch & Morning Plans:** Publikasi rekapitulasi pasar global malam hari dan rencana perdagangan pagi hari (08:30 WIB).\n\n#### 🏗️ 2. Staging Pipeline Bloomberg v3.0 Terminal\n- **Pengembangan di Branch Terisolasi (`feature-naufal`):** Membangun 4 modul utama secara paralel:\n  * **Whale Intelligence Hub:** Pelacak transaksi paus Bitcoin on-chain via Mempool WebSocket (>100 BTC) & running trade BEI.\n  * **Crypto Futures Desk:** Layar perps Binance & Gate.io dengan spesifikasi Coinglass (Funding rate, Open Interest, Liquidations).\n  * **Forex Command Tab:** Telemetri pasangan mata uang mayor dan dual-flag badges.\n  * **US Stock Intelligence:** Scanner saham Wall Street & sinkronisasi harga TradingView.\n- **Peleburan Resmi:** Seluruh fitur yang dibangun pada siklus 13-15 September ini dilebur dan dirilis secara resmi pada **16 September 2026 (Package 16092026 / v3.0.0)**.\n"
  },
  {
    "id": "pkg-12092026",
    "version": "Package 12092026",
    "semanticVersion": "v2.3.0",
    "date": "12 September 2026",
    "status": "STABLE",
    "statusColor": "#38bdf8",
    "badgeLabel": "STABLE",
    "title": "Update Package 12092026: IHSG Real-Time Quote Feed & Macro Engine Synchronization",
    "description": "Rekapitulasi pembaruan 12 September 2026: Sinkronisasi real-time quote feed IHSG lintas modul telemetri dan integrasi indeks domestik pada payload eksekusi macro news.",
    "processFlow": [
      {
        "step": "1. Baseline",
        "label": "Quant Core"
      },
      {
        "step": "2. Telegram & Desk",
        "label": "Serverless Edge"
      },
      {
        "step": "3. IHSG Quote Sync",
        "label": "Level 6,506 (12/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Utama (Highlights 12/09)\n- **IHSG Real-Time Quote Sync:** Pembaruan live quote feed IHSG level 6,506 secara konsisten pada master bundle cache dan ticker bar terminal.\n- **Macro Payload Enrichment:** Penyertaan variabel IHSG ke dalam eksekusi payload `news_macro` untuk korelasi sentimen berita dengan pergerakan indeks domestik.\n- **Telemetry Stability:** Optimalisasi cron job sinkronisasi kripto dan makro tanpa jeda runtime.",
    "table": [
      {
        "module": "IHSG Live Feed",
        "status": "STABLE",
        "category": "Feed",
        "summary": "Live quote feed IHSG 6,506 di seluruh bundle cache"
      },
      {
        "module": "Macro Payload",
        "status": "STABLE",
        "category": "Macro Engine",
        "summary": "Injeksi variabel IHSG pada data analisis berita"
      },
      {
        "module": "Telemetry Cron",
        "status": "STABLE",
        "category": "Data Cron",
        "summary": "Sinkronisasi hourly telemetri kripto & makro"
      }
    ]
  },
  {
    "id": "pkg-11092026",
    "version": "Package 11092026",
    "semanticVersion": "v2.2.0",
    "date": "11 September 2026",
    "status": "STABLE",
    "statusColor": "#38bdf8",
    "badgeLabel": "STABLE",
    "title": "Update Package 11092026: SoSoValue Research Desk, Dual-Stream News Wire, Spot ETF Telemetry & Layout Cockpit V2",
    "description": "Pembaruan ekstensif menghadirkan tata letak Home Cockpit 2-kolom SoSoValue (72% Cockpit + 28% Live News) dengan zero horizontal scroll, running ticker tape tanpa jeda, telemetri ETF Spot BTC/ETH, Active Windowing dividen, dan dukungan multi-aset kripto di Charting Desk.",
    "processFlow": [
      {
        "step": "1. Baseline Core",
        "label": "Quant & Plans"
      },
      {
        "step": "2. Cockpit V2",
        "label": "SoSoValue Layout (11/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Utama (Highlights 11/09)\n- **Continuous Running Ticker Tape:** Bar ticker berjalan real-time tanpa jeda di bagian atas layar dengan indikator status global dan subtle scrollbar Bloomberg.\n- **Home Cockpit 2-Kolom SoSoValue:** Pembagian rasio proporsional 72% Cockpit (Market Pulse, Bandarmology, Foreign Flow) dan 28% Live News Wire tanpa scrolling horizontal liar.\n- **SoSoValue Spot ETF Telemetry:** Pemantauan harian `Net Flow (US$ M)` dan turnover Bitcoin & Ethereum Spot ETF langsung di terminal.\n- **Research Desk (24/7 Live Stream):** Stream ganda berita Bloomberg & Stockbit Snips yang menyajikan 3 poin kunci sentimen pasar per berita.\n- **Dividen Hunter Active Windowing:** Jendela filter cerdas `[-1 bulan s/d +6 bulan]` dengan live countdown hari H-X untuk mengeliminasi riwayat dividen usang.\n- **Technical Indicators Suite:** Integrasi indikator teknikal native (RSI, MACD, Bollinger Bands, EMA, ATR) dan confluence scoring.\n- **Rebranding MBG APEX:** Logo resmi Quantum Emerald Tri-Loop vector murni dan penyelarasan seluruh nama entitas sistem.",
    "table": [
      {
        "module": "Home Cockpit V2",
        "status": "STABLE",
        "category": "UI/UX",
        "summary": "Rasio 72% / 28%, eliminasi horizontal overflow, telemetry strip"
      },
      {
        "module": "Running Ticker Tape",
        "status": "STABLE",
        "category": "Feed",
        "summary": "Continuous loop ticker tape dengan indikator jam bursa aktif"
      },
      {
        "module": "Spot ETF Flow",
        "status": "STABLE",
        "category": "Macro",
        "summary": "Net inflow/outflow harian BTC/ETH ETF berbasis SoSoValue"
      },
      {
        "module": "Dividen Hunter V2",
        "status": "STABLE",
        "category": "Screener",
        "summary": "Jendela aktif -1 bln s/d +6 bln, countdown timer, filter kadaluarsa"
      },
      {
        "module": "Technicals Suite",
        "status": "STABLE",
        "category": "Analysis",
        "summary": "RSI, MACD, Bollinger, EMA, ATR & Confluence Scoring"
      }
    ]
  },
  {
    "id": "pkg-10092026",
    "version": "Package 10092026",
    "semanticVersion": "v2.1.0",
    "date": "10 September 2026",
    "status": "STABLE",
    "statusColor": "#38bdf8",
    "badgeLabel": "STABLE",
    "title": "Update Package 10092026: Telegram Serverless, Command Center, Charting Desk & Changelog Engine",
    "description": "Rekapitulasi pembaruan 10 September 2026: Integrasi Bot Telegram serverless 24/7 di Cloudflare Pages, Institutional Charting Desk TradingView, Level 2 Market Depth & Radar Broker Summary, serta pengelompokan semesta Saham IDX.",
    "processFlow": [
      {
        "step": "1. Baseline Core",
        "label": "Quant & Plans"
      },
      {
        "step": "2. Telegram & Desk",
        "label": "Serverless Edge (10/09)"
      }
    ],
    "markdownContent": "### 🚀 Pembaruan Utama (Highlights 10/09)\n- **Institutional Charting Desk:** Workspace layar penuh didukung TradingView Advanced Real-Time Chart dengan full drawing toolbar, 4 Strategy Presets (SMC, Trend, Bandar, Mean Reversion), dan kalkulator lot MBG Apex.\n- **Level 2 Market Depth & Broker Summary:** Eliminasi simulator acak. Integrasi 100% data riil: Real-time Orderbook Tokocrypto/Indodax & Best Quote BEI dengan Radar Detektif Bandar (Broker Summary 2 Kolom & CR3 Akumulasi).\n- **Restrukturisasi Saham IDX:** Konsolidasi seluruh saham dan 12 grup konglomerasi ke dalam semesta \"SEMUA SAHAM\" dengan sub-filter terfokus: SEMUA SAHAM, 🎯 TOP TRADE PLANS, dan 💰 DIVIDEN HUNTER.\n- **Serverless Telegram Bot 24/7:** Webhook `/api/telegram-webhook` berjalan di edge Cloudflare Pages tanpa runtime cost (`Rp 0/bulan`), melayani query /saham, /crypto, /macro, /plan, /dividend, dan /help.\n- **Changelog & Testing Hub:** Registri riwayat rilis terstruktur dan konsolidasi modul pengujian forward & backtest.",
    "table": [
      {
        "module": "Charting Desk",
        "status": "STABLE",
        "category": "Charting",
        "summary": "TradingView Real-time + 4 Strategy Presets + Drawing Tools"
      },
      {
        "module": "L2 Market Depth",
        "status": "STABLE",
        "category": "Orderbook",
        "summary": "Orderbook riil BEI/Crypto + Broker Summary 2 Kolom & CR3"
      },
      {
        "module": "Telegram Webhook",
        "status": "STABLE",
        "category": "Bot",
        "summary": "24/7 Cloudflare Pages Functions serverless bot (/saham, /plan, dll)"
      },
      {
        "module": "Unified Testing",
        "status": "STABLE",
        "category": "Testing",
        "summary": "Konsolidasi Backtest Lab 5-Tahun & Virtual Forward Test"
      }
    ]
  },
  {
    "id": "pkg-initial-launch",
    "version": "Initial Launch Package",
    "semanticVersion": "v1.0.0",
    "date": "08 - 09 September 2026",
    "status": "CONSOLIDATED",
    "statusColor": "var(--text-muted)",
    "badgeLabel": "INITIAL MAJOR LAUNCH",
    "title": "Initial Major Launch Package: Core Quant Intelligence & Multi-Market Terminal",
    "description": "Rekapitulasi paket peluncuran utama yang merangkum seluruh fondasi awal sistem MBG Trading Intelligence Cockpit: model kuantitatif multi-agent, pemindai multi-aset, tools analisis profesional, dan suite makroekonomi ARIB.",
    "processFlow": [
      {
        "step": "1. Baseline Core",
        "label": "Quant Model & Plans (08-09/09)"
      }
    ],
    "markdownContent": "### 📦 Paket Fondasi Utama (Rekapitulasi Baseline)\n- **Quant Core Engine:** Prediksi berbasis Google TimesFM (Zero-Shot Time Series Foundation Model), Smart Money Concepts (SMC Order Blocks, Liquidity Sweeps, & Fair Value Gaps), dan Institutional Investor Flow Score (IIFS).\n- **Daily Trade Plans & Scanner:** 20 Daily Trade Plans harian dengan kalkulasi otomatis Entry, Stop Loss, Multi-Target, serta scanner Saham IDX dan 10 Crypto Spot.\n- **Pro Trading Tools:** TradingView Pro Interactive Modal, OrderBook L2 Depth Simulator, Kalkulator Ukuran Lot & Manajemen Risiko (1-2%), dan Personal Watchlist.\n- **ARIB Macro Suite:** Pemantauan real-time Pasar Global (S&P 500, Nasdaq, Nikkei, IHSG), Kalender Makroekonomi, Matriks Korelasi Pearson, dan Live News Wire.\n- **Keamanan & Desain:** Password Gate enkripsi SHA-256 anti-brute lockout, dual-theme dark/light mode Bloomberg & SoSoValue, serta Quant Academy knowledge wiki.",
    "table": [
      {
        "module": "Quant Core Engine",
        "status": "BASELINE",
        "category": "Quant",
        "summary": "TimesFM + SMC Order Blocks + IIFS Flow Scoring"
      },
      {
        "module": "20 Trade Plans",
        "status": "BASELINE",
        "category": "Scanner",
        "summary": "Rekomendasi harian IDX & Crypto Spot dengan kalkulasi R:R"
      },
      {
        "module": "ARIB Macro Suite",
        "status": "BASELINE",
        "category": "Macro",
        "summary": "Pasar Global, Kalender Makroekonomi & Korelasi Pearson"
      },
      {
        "module": "Security & Auth",
        "status": "BASELINE",
        "category": "Security",
        "summary": "SHA-256 Gate, lockout anti-brute force & dual theme"
      }
    ]
  }
];
