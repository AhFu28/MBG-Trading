import React, { useState, useMemo } from 'react';

// ============================================================================
// MBG QUANT ACADEMY // MASTERCLASS CURRICULUM (LEVEL 1 - LEVEL 6)
// ============================================================================

const CURRICULUM_LEVELS = [
  {
    id: 'lvl-1',
    levelNum: '01',
    levelCode: 'LEVEL 1',
    title: 'Mekanisme Mesin Uang Dunia',
    subtitle: 'The Plumbing: Asal-Usul Uang, Likuiditas Global, Bank Sentral, & Hegemoni Dolar',
    badgeColor: 'var(--accent-cyan)',
    readTime: '20 Menit',
    moduleCount: 3,
    modules: [
      {
        id: 'mod-1-1',
        code: 'MODUL 1.1',
        title: 'Asal-Usul Uang, Likuiditas, & Bank Sentral',
        keyQuestion: 'Mengapa uang di dunia tidak pernah diam dan selalu mencari aset?',
        analogy: 'Bayangkan sistem finansial seperti jaringan irigasi raksasa. Bank Sentral adalah bendungan utama. Likuiditas adalah debit air yang mengalir ke sawah-sawah (saham, obligasi, properti, komoditas, kripto). Ketika pintu bendungan dibuka lebar (suku bunga rendah / cetak stimulus), sawah banjir air dan semua harga aset naik. Ketika pintu ditutup (suku bunga tinggi), sawah mengalami kekeringan dan pasar mengalami kontraksi.',
        mechanism: 'Uang modern (fiat) diciptakan melalui sistem perbankan (fractional reserve banking) dan kebijakan Bank Sentral. Ketika bank sentral memangkas suku bunga atau membeli obligasi melalui Quantitative Easing (QE), jumlah uang beredar meningkat drastis. Lembaga pengelola dana (dana pensiun, sovereign funds, manajer investasi) memiliki kas berlebih yang harus diinvestasikan agar tidak tergerus inflasi. Sebaliknya, saat likuiditas disedot melalui Quantitative Tightening (QT), uang tunai menjadi barang langka (Cash is King) dan aset-aset berisiko mengalami tekanan jual.',
        retailTrap: 'Investor pemula mengira harga saham naik semata-mata karena "kinerja keuangan emiten bagus". Faktanya, di tengah banjir likuiditas global, saham perusahaan merugi pun bisa naik 300%. Sebaliknya, saat krisis likuiditas, saham dengan laba rekor pun bisa anjlok 30%. Arus likuiditas selalu mengalahkan fundamental dalam jangka pendek.',
        takeaway: 'Jangan pernah melawan arah kebijakan Bank Sentral (Don\'t fight the Fed). Saat bank sentral sedang mengetatkan likuiditas, pertahankan porsi kas yang besar.',
        widget: 'fed-hike-simulator'
      },
      {
        id: 'mod-1-2',
        code: 'MODUL 1.2',
        title: 'Sistem Moneter Global & Hegemoni Dolar AS (Petrodollar)',
        keyQuestion: 'Mengapa jika ekonomi Amerika bersin, seluruh bursa dunia ikut masuk angin?',
        analogy: 'Dolar AS adalah seperti "oksigen" di dalam tabung penyelaman ekonomi dunia. Siapapun yang ingin bernapas di perdagangan internasional harus menggunakan tabung Dolar tersebut.',
        mechanism: 'Sejak Perjanjian Bretton Woods (1944) dan lahirnya sistem Petrodollar (1973) di mana minyak mentah dunia wajib diperdagangkan dalam USD, Dolar AS menjadi mata uang cadangan devisa utama dunia (mencakup 58%+ transaksi dan cadangan bank sentral global). Ketika pemerintah AS menerbitkan obligasi (US Treasury), seluruh dunia membelinya sebagai aset teraman. Akibatnya, setiap pergeseran nilai Dolar AS (DXY) langsung menggoncang kurs mata uang negara berkembang, termasuk Rupiah Indonesia.',
        retailTrap: 'Mengabaikan pergerakan indeks Dolar (DXY) saat trading saham BEI. Jika DXY sedang reli menembus level 105+, sangat sulit bagi IHSG untuk mencetak rekor baru karena dana asing sedang ditarik kembali ke Dolar.',
        takeaway: 'Pantau indeks DXY setiap hari. Pelemahan Dolar (DXY < 101) adalah katalis positif bagi pasar saham Indonesia (IHSG).',
        widget: 'dxy-impact-matrix'
      },
      {
        id: 'mod-1-3',
        code: 'MODUL 1.3',
        title: 'Suku Bunga & Inflasi: Termostat Perekonomian Dunia',
        keyQuestion: 'Mengapa Bank Sentral sengaja "mendinginkan" ekonomi saat harga barang naik?',
        analogy: 'Suku bunga bekerja persis seperti termostat AC. Jika ruangan terlalu panas (inflasi melonjak, harga kebutuhan tak terkendali), termostat disetel dingin (bunga dinaikkan) agar konsumsi masyarakat dan belanja korporasi mengerem. Jika ekonomi kedinginan (resesi, pabrik tutup), termostat dipanaskan (bunga dipotong) agar kredit kembali murah.',
        mechanism: 'The Federal Reserve mengendalikan suku bunga acuan dunia (Fed Funds Rate), sementara Bank Indonesia mengendalikan BI-Rate (7-Day Reverse Repo Rate). Bank Indonesia wajib menjaga selisih imbal hasil positif (Carry Spread minimal 100-200 bps) di atas bunga The Fed agar investor asing tidak mencairkan dana mereka dari Surat Berharga Negara (SBN) untuk dipindahkan ke obligasi AS.',
        retailTrap: 'Membeli saham berutang tinggi (High Debt-to-Equity Ratio) saat siklus kenaikan suku bunga baru dimulai. Beban bunga utang emiten akan melonjak berlipat ganda dan menggerus dividen.',
        takeaway: 'Pilih emiten kaya kas bebas utang (Net Cash) saat suku bunga tinggi, dan beli emiten ekspansif saat suku bunga mulai dipangkas.'
      }
    ]
  },
  {
    id: 'lvl-2',
    levelNum: '02',
    levelCode: 'LEVEL 2',
    title: 'Transmisi Makro & Sejarah Krisis',
    subtitle: 'The Domino Machine: 8 Rantai Efek The Fed, Matriks Antar-Aset, & Bedah 5 Krisis Finansial Nyata',
    badgeColor: 'var(--accent-blue)',
    readTime: '25 Menit',
    moduleCount: 3,
    modules: [
      {
        id: 'mod-2-1',
        code: 'MODUL 2.1',
        title: 'Pohon Transmisi Kausalitas The Fed (8 Langkah ke IHSG & Rupiah)',
        keyQuestion: 'Bagaimana keputusan rapat The Fed di Washington bisa menurunkan harga saham di Jakarta?',
        analogy: 'Efek domino meja: Menjatuhkan balok domino pertama di ujung barat akan meruntuhkan balok-balok berikutnya secara otomatis hingga balok terakhir di ujung timur meja.',
        mechanism: 'Rantai sebab-akibat 8 langkah transmisi moneter global:\n1. Inflasi AS Panas -> The Fed menaikkan Fed Funds Rate (+50 bps).\n2. Yield US Treasury 10Y Naik -> Menawarkan kupon bebas risiko yang sangat menarik bagi institusi global.\n3. Indeks Dolar (DXY) Menguat -> Modal global memburu Dolar untuk ditempatkan di surat utang AS.\n4. Capital Outflow dari Emerging Markets -> Manajer investasi asing menarik modal dari BEI, Thailand, Filipina.\n5. Kurs Rupiah (USD/IDR) Tertekan -> Penjualan aset Rupiah untuk dikonversi ke USD mendepresiasi kurs.\n6. Bank Indonesia Naikkan BI-Rate -> BI mempertahankan selisih carry spread agar cadangan devisa tidak terkuras.\n7. Biaya Pinjaman Emiten Naik -> Suku bunga kredit modal kerja dan investasi bank domestik naik.\n8. Valuasi Saham BEI Terkoreksi -> Laba bersih emiten tergerus beban bunga dan investor menuntut diskon harga saham.',
        retailTrap: 'Mengira depresiasi Rupiah selalu buruk untuk semua saham. Padahal emiten eksportir komoditas (emas, batubara, CPO) yang pendapatannya berdenominasi Dolar AS justru meraup windfall profit lonjakan laba dalam Rupiah!',
        takeaway: 'Saat Rupiah melemah akibat The Fed hawkish, rotasikan portofolio ke saham eksportir berbasis Dolar ($MEDC, $ITMG, $ANTM) dan hindari emiten dengan utang valas besar.',
        widget: 'domino-interactive-tree'
      },
      {
        id: 'mod-2-2',
        code: 'MODUL 2.2',
        title: 'Intermarket Matrix: Hubungan Obligasi, Valas, Emas, Minyak, & Saham',
        keyQuestion: 'Bagaimana instrumen yang berbeda saling menggerakkan satu sama lain?',
        analogy: 'Pasar finansial seperti jungkat-jungkit raksasa dengan banyak papan yang saling terikat tali pengait.',
        mechanism: 'Hukum Korelasi Antar-Aset Institusional:\n- Dolar AS (DXY) vs Emas (XAU/USD): Berbanding terbalik. Pelemahan Dolar membuat emas lebih murah bagi pembeli luar AS sehingga memicu lonjakan harga emas.\n- Yield Obligasi 10Y vs Saham Teknologi: Berbanding terbalik. Kenaikan yield obligasi mendiskon nilai kas masa depan (discounted cash flow) saham pertumbuhan teknologi.\n- Minyak Mentah (Brent) vs Saham Manufaktur: Kenaikan minyak menyulut biaya produksi pabrik dan logistik transportasi, menekan margin emiten konsumer dan semen.\n- Inversi Kurva Imbal Hasil (Yield Curve Inversion 10Y-2Y): Ketika bunga obligasi 2 tahun lebih tinggi dari obligasi 10 tahun, pasar sedang memprediksi terjadinya resesi ekonomi dalam 12-18 bulan ke depan.',
        retailTrap: 'Melihat saham secara terisolasi tanpa memantau harga komoditas acuan dunia dan kurva obligasi negara.',
        takeaway: 'Gunakan kurva imbal hasil dan harga minyak dunia sebagai radar cuaca awal sebelum mengambil keputusan investasi besar.',
        widget: 'intermarket-matrix-table'
      },
      {
        id: 'mod-2-3',
        code: 'MODUL 2.3',
        title: 'Laboratorium Sejarah: Membedah 5 Krisis Finansial Nyata',
        keyQuestion: 'Pelajaran berharga apa yang ditinggalkan oleh krisis-krisis masa lalu?',
        analogy: 'Sejarah tidak pernah terulang persis sama, tetapi polanya selalu berirama (Mark Twain).',
        mechanism: 'Analisis 5 Peristiwa Bersejarah Pasar Modal:\n1. Krisis Moneter Asia (1997-1998): Serangan spekulasi pada mata uang Baht Thailand menular ke Rupiah (anjlok dari Rp 2.500 ke Rp 16.000/USD). Korporasi dengan utang valas tanpa lindung nilai (hedging) bangkrut massal.\n2. Krisis Finansial Global (2008): Keruntuhan subprime mortgage AS memicu kebangkrutan Lehman Brothers. BEI membekukan perdagangan (suspend). Lahirlah era pencetakan uang QE.\n3. Taper Tantrum (2013): Pidato The Fed yang memberi sinyal pengurangan stimulus memicu capital outflow mendadak. IHSG anjlok -25% dan Rupiah terpuruk.\n4. Crash Pandemi Covid-19 (Maret 2020): Kepanikan lockdown merontokkan IHSG ke 3.900, disusul injeksi likuiditas moneter terbesar sejarah yang melontarkan IHSG ke 7.300+.\n5. Kenaikan Suku Bunga Agresif 500 bps (2022-2023): Inflasi global perang Ukraina memaksa The Fed menaikkan bunga tercepat dalam 4 dekade, mengakhiri era uang murah.',
        retailTrap: 'Panik menjual seluruh portofolio di titik terendah krisis saat berita di televisi paling menakutkan, lalu membeli kembali saat harga sudah reli di pucuk.',
        takeaway: 'Krisis likuiditas akut selalu menciptakan peluang pembelian terbaik dalam satu dekade jika Anda memegang porsi kas siap eksekusi.',
        widget: 'historical-timeline-explorer'
      }
    ]
  },
  {
    id: 'lvl-3',
    levelNum: '03',
    levelCode: 'LEVEL 3',
    title: 'Anatomi Instrumen & Fundamental Riil',
    subtitle: 'The Engines: 5 Kelas Aset, Kas Riil vs Laba Akuntansi, & Hukum Siklus Komoditas Supercycle',
    badgeColor: 'var(--accent-green)',
    readTime: '22 Menit',
    moduleCount: 3,
    modules: [
      {
        id: 'mod-3-1',
        code: 'MODUL 3.1',
        title: 'Anatomi 5 Kelas Aset Finansial Utama',
        keyQuestion: 'Apa perbedaan mendasar antara Saham, Obligasi, Forex, Komoditas, dan Kripto?',
        analogy: 'Seperti memilih kendaraan: Sepeda motor (lincah tapi bahaya), Truk kontainer (lambat tapi angkut muatan masif), Kapal tanker (kuasai samudra), atau Jet supersonik.',
        mechanism: 'Karakteristik 5 Kelas Aset:\n- Saham (Equities): Hak kepemilikan bisnis riil, pembagian dividen dari laba bersih, potensi capital gain. Pemain: Ritel, Manajer Investasi, Institusi.\n- Obligasi (Bonds): Pasar utang terbesar dunia ($130 Triliun+). Membayar kupon bunga berkala dan pengembalian pokok. Pemain: Bank Sentral, Dana Pensiun, Asuransi.\n- Valuta Asing (Forex): Volume transaksi harian raksasa $7.5 Triliun. Beroperasi 24 jam dengan leverage tinggi. Pemain: Bank Multinasional, Eksportir-Importir.\n- Komoditas Strategis: Emas (asuransi moneter bebas risiko kredit), Minyak Mentah (bahan bakar energi industri), Batubara & Nikel (motor devisa ekspor RI).\n- Kripto (Digital Assets): Bitcoin dengan pasokan tetap (21 juta koin). Spons likuiditas paling sensitif terhadap ekspansi suplai uang global M2.',
        retailTrap: 'Menaruh seluruh modal di aset berisiko tinggi (kripto koin micin / saham gorengan) tanpa memiliki bantalan aset pelindung di obligasi atau saham berdividen sehat.',
        takeaway: 'Susun portofolio seimbang: 60% saham defensif berdividen kuat, 20% obligasi/kas, 20% komoditas/pertumbuhan tinggi.',
        widget: 'asset-comparator-tool'
      },
      {
        id: 'mod-3-2',
        code: 'MODUL 3.2',
        title: 'Membedah Laporan Keuangan: Kas Riil vs Laba di Atas Kertas',
        keyQuestion: 'Mengapa perusahaan yang mencetak laba triliunan bisa tiba-tiba bangkrut?',
        analogy: 'Pendapatan adalah kesombongan (vanity), Laba bersih adalah kewarasan (sanity), tapi Arus Kas adalah Raja yang sesungguhnya (Cash is King).',
        mechanism: 'Laba bersih (Net Profit) di laporan laba rugi dihitung berdasarkan prinsip akuntansi akrual (pendapatan dicatat saat barang dikirim walau pembeli belum membayar). Emiten bisa merekayasa laba dengan piutang fiktif. Sebaliknya, Laporan Arus Kas Operasional (Operating Cash Flow / OCF) mencatat uang tunai nyata yang benar-benar masuk ke rekening bank perusahaan. Jika Laba Bersih naik tapi Arus Kas Operasional negatif berturut-turut, itu tanda bahaya merah!',
        retailTrap: 'Hanya melihat Price to Earnings Ratio (PER) dan laba bersih di aplikasi sekuritas tanpa pernah memeriksa apakah kas operasional perusahaan positif.',
        takeaway: 'Selalu pastikan Arus Kas Operasional perusahaan setara atau lebih besar daripada Laba Bersihnya (Cash Conversion Ratio >= 1.0).',
        widget: 'financial-health-audit'
      },
      {
        id: 'mod-3-3',
        code: 'MODUL 3.3',
        title: 'Siklus Komoditas (Commodity Supercycle): Kapan Masuk & Kapan Keluar',
        keyQuestion: 'Bagaimana cara membaca waktu siklus tambang batubara, minyak, dan nikel?',
        analogy: 'Siklus komoditas seperti musim tanam dan panen raya petani buah. Saat buah langka harga selangit; saat semua orang serentak menanam, panen berlebih membuat harga anjlok.',
        mechanism: 'Anatomi 4 Babak Siklus Komoditas:\n1. Babak Bawah (Under-investment): Harga komoditas murah bertahun-tahun, tambang tutup, belanja modal (Capex) ditekan minim.\n2. Babak Ledakan (Shock & Windfall): Pasokan langka berbenturan dengan lonjakan permintaan global. Harga tambang meroket ke rekor tertinggi. Emiten mencetak laba abnormal triliunan.\n3. Babak Ekspansi Berlebih: Laba melimpah membuat emiten berbondong-bondong membuka tambang baru secara agresif.\n4. Babak Kelebihan Pasokan (Glut & Crash): Tambang-tambang baru serentak beroperasi, pasar kebanjiran pasokan, harga komoditas jatuh bebas kembali ke titik dasar.',
        retailTrap: 'Membeli saham tambang saat rasio PER terlihat "sangat murah" (misal PER 2x-3x) di puncak siklus panen laba, tepat sebelum harga komoditas jatuh.',
        takeaway: 'Hukum Emas Saham Komoditas: Belilah saat PER terlihat mahal (laba di dasar siklus) dan juallah saat PER terlihat sangat murah (laba di puncak siklus).',
        widget: 'commodity-cycle-map'
      }
    ]
  },
  {
    id: 'lvl-4',
    levelNum: '04',
    levelCode: 'LEVEL 4',
    title: 'Mikrostruktur Pasar & Bandarmology',
    subtitle: 'The Hidden Game: Mekanika Lelang Buku Order, Ekosistem BEI, 4 Fase Wyckoff, & Jebakan Dividen',
    badgeColor: 'var(--accent-orange)',
    readTime: '24 Menit',
    moduleCount: 4,
    modules: [
      {
        id: 'mod-4-1',
        code: 'MODUL 4.1',
        title: 'Mekanika Lelang Dua Arah (Order Book & Limit vs Market Order)',
        keyQuestion: 'Apa yang sebenarnya membuat angka harga di layar monitor bergerak naik atau turun?',
        analogy: 'Pelelangan ikan di dermaga: Penjual menaruh ikan di meja pada harga tertentu (Limit Ask) dan pembeli menawar santai di bawah (Limit Bid). Jika semua orang pasif, harga tidak akan pernah bergerak. Harga HANYA naik jika ada pembeli agresif yang datang membawa segepok uang tunai dan menyapu seluruh ikan di meja berapapun harganya (Market Buy).',
        mechanism: 'Buku order (Limit Order Book) mempertemukan antrian beli pasif (Bid) dan antrian jual pasif (Offer/Ask). Selisih harga terbaik disebut Spread. Pergerakan harga adalah produk dari pesanan agresif (Market Order) yang melahap likuiditas pasif di buku order. Pesanan beli pasar menyapu antrian ask ke atas (Lifting the Ask), sedangkan pesanan jual pasar membanting antrian bid ke bawah (Hitting the Bid).',
        retailTrap: 'Mengira antrian tebal di kolom Bid berarti "harga aman tidak akan turun". Seringkali antrian bid tebal itu adalah order palsu (spoofing) dari bandar yang dibatalkan seketika saat ritel ikut antri di atasnya.',
        takeaway: 'Perhatikan volume running trade riil yang terjadi, bukan ilusi antrian bid/offer yang belum tentu tereksekusi.',
        widget: 'order-book-depth-sandbox'
      },
      {
        id: 'mod-4-2',
        code: 'MODUL 4.2',
        title: 'Ekosistem Pelaku Pasar di Bursa Efek Indonesia',
        keyQuestion: 'Siapa saja pihak yang bertarung di bursa saham setiap hari dan apa motif mereka?',
        analogy: 'Di kolam bursa terdapat plankton (ritel), kura-kura lambat (dana pensiun), hiu paus pengelana (dana asing), dan penguasa kolam lokal (market maker / bandar).',
        mechanism: 'Karakteristik 4 Pelaku Utama di BEI:\n1. Investor Ritel: Jumlah akun jutaan, modal rata-rata kecil, reaktif terhadap berita headline media sosial, mudah panik saat merah dan serakah saat hijau.\n2. Institusi Domestik (BPJS TK, Taspen, Asuransi, MI): Modal ratusan triliun, pergerakan sangat lambat, terikat mandat regulasi yang ketat.\n3. Asing (Foreign Institutional Funds): Membeli emiten berkapitalisasi pasar besar (Big Caps) berbasis alokasi makro regional. Keluar-masuk dalam volume triliunan per hari.\n4. Bandar / Market Maker / Sponsor Saham: Pelaku bermodal besar dengan puluhan akun nominee yang bertugas menjaga likuiditas atau mengarahkan tren harga saham lapis dua dan tiga (Mid-Small Caps).',
        retailTrap: 'Mencoba melawan arah gerak bandar atau dana asing pada saham-saham likuiditas tipis.',
        takeaway: 'Jangan pernah mencoba menjadi penggerak pasar. Jadilah ikan remora cerdas yang berenang di samping sirip paus dan ikut menikmati arus likuiditasnya.',
        widget: 'broker-flow-profiler'
      },
      {
        id: 'mod-4-3',
        code: 'MODUL 4.3',
        title: 'Siklus 4 Fase Wyckoff di Pasar Saham Nyata',
        keyQuestion: 'Bagaimana cara smart money mengumpulkan dan membuang barang dalam skala jutaan lot?',
        analogy: 'Seperti pedagang grosir beras: Membeli gabah murah langsung dari petani saat panen melimpah (Akumulasi), mengangkut ke toko (Markup), menjual eceran ke pembeli kota di harga mahal (Distribusi), lalu mengosongkan gudang (Markdown).',
        mechanism: '4 Babak Siklus Wyckoff di BEI:\n1. Akumulasi: Harga bergerak mendatar (sideways) membosankan selama berbulan-bulan. Berita media bernada sepi atau negatif. Ritel putus asa menjual sahamnya, dan smart money menyerap barang perlahan tanpa membuat harga melonjak.\n2. Markup: Setelah sebagian besar saham beredar dikuasai, smart money menyapu penawaran harga ke atas. Volume transaksi meningkat, memicu scanner teknikal ritel untuk ikut memburu.\n3. Distribusi: Harga berada di level tertinggi. Berita-berita fantastis membanjiri media sosial, target harga analis dinaikkan tinggi-tinggi, dividen jumbo diumumkan. Ritel berbondong-bondong memborong karena takut ketinggalan (FOMO). Di balik layar, smart money menjual barangnya ke antrian beli ritel.\n4. Markdown: Smart money sudah selesai mengosongkan inventarisnya dan tidak lagi menaruh antrian beli penopang. Harga saham longsor bebas tanpa rem, mengunci ritel di pucuk.',
        retailTrap: 'Membeli saham di fase distribusi hanya karena melihat grafik harga sedang reli kencang dan berita di media sangat optimis.',
        takeaway: 'Beli saat pasar sedang membosankan di akhir fase akumulasi, dan jual saat pasar sedang riuh gegap gempita di fase distribusi.',
        widget: 'wyckoff-phase-interactive'
      },
      {
        id: 'mod-4-4',
        code: 'MODUL 4.4',
        title: 'Anatomi Jebakan Dividen Saham Siklikal ($PTBA & $ADRO)',
        keyQuestion: 'Mengapa investor yang mengejar dividen yield 20% justru modalnya tergerus habis?',
        analogy: 'Umpan madu di atas jebakan lubang: Madu di atasnya memang manis, tapi lubang di bawahnya sangat dalam.',
        mechanism: 'Kronologi Nyata Jebakan Dividen di BEI:\n1. Menjelang RUPS & Cum-Date: Harga saham dikerek naik dengan narasi bombastis "Dividen Yield 25% Terbesar Sepanjang Sejarah".\n2. Hari Cum-Date (Batas Akhir Dapat Dividen): Ritel memborong saham habis-habisan di harga tertinggi demi mendapatkan dividen instan.\n3. Hari Ex-Date: Pagi hari bursa dibuka, harga saham langsung anjlok Auto Reject Bawah (ARB) berturut-turut minus -25% hingga -35% karena tidak ada lagi insentif dividen.\n4. Hasil Akhir: Dividen yang didapat (misal Rp 1.000 per lembar) langsung hangus tertelan penurunan modal harga saham (-Rp 1.500 per lembar), menyisakan kerugian bersih dan modal terkunci berbulan-bulan.',
        retailTrap: 'Masuk membeli saham di hari Cum-Date tanpa memperhitungkan penurunan harga di hari Ex-Date.',
        takeaway: 'Jika Anda sudah memegang saham siklikal dengan keuntungan modal yang besar menjelang dividen, juallah di hari Cum-Date saat ritel sedang berebut membelinya di harga puncak.',
        widget: 'dividend-trap-netpnl-calc'
      }
    ]
  },
  {
    id: 'lvl-5',
    levelNum: '05',
    levelCode: 'LEVEL 5',
    title: 'Analisis Teknikal & Struktur Harga',
    subtitle: 'Liquidity Price Action: Auction Market Theory, Support/Resistance Likuiditas, FVG Magnet, & Sweeps',
    badgeColor: 'var(--accent-purple)',
    readTime: '22 Menit',
    moduleCount: 4,
    modules: [
      {
        id: 'mod-5-1',
        code: 'MODUL 5.1',
        title: 'Mengapa Harga Membentuk Tren (Auction Market Theory)',
        keyQuestion: 'Bagaimana cara membedakan tren harga yang sehat vs tren palsu?',
        analogy: 'Mendaki tangga: Setiap langkah naik butuh pijakan tangga yang kokoh (Higher High & Higher Low). Jika pijakannya rapuh, pendaki akan tergelincir ke bawah.',
        mechanism: 'Struktur tren terbentuk dari keseimbangan harga lelang. Dalam Uptrend, pembeli agresif rela membayar di harga yang semakin mahal di setiap lembah koreksi. Dalam Downtrend, penjual pasrah melepas barang di harga yang semakin murah di setiap puncak pantulan. Konfirmasi tren didapat melalui Break of Structure (BOS), sedangkan pembalikan arah tren diawali dengan Change of Character (CHoCH) saat titik struktur swing penting berhasil ditembus.',
        retailTrap: 'Menebak-nebak titik pembalikan harga (reversal) dan melawan tren utama yang sedang berlangsung (Bottom Fishing di pisau jatuh).',
        takeaway: 'Tren harga adalah sahabat terbaik Anda. Ikuti arah struktur tren hingga muncul tanda pembalikan arah yang terkonfirmasi secara objektif.',
        widget: 'trend-structure-builder'
      },
      {
        id: 'mod-5-2',
        code: 'MODUL 5.2',
        title: 'Support & Resistance Sejati (Zona Konsentrasi Likuiditas)',
        keyQuestion: 'Mengapa garis Support dan Resistance tipis sering kali ditembus dengan mudah?',
        analogy: 'Bukan garis tipis pensil di atas kertas, melainkan seperti lantai trampolin bertulang baja dengan ketebalan zona tertentu.',
        mechanism: 'Support dan Resistance sejati bukanlah garis horizontal acak, melainkan area harga di mana volume transaksi besar institusi sebelumnya terkonsentrasi. Jika harga kembali mengunjungi zona tersebut, pembeli institusi yang belum selesai mengisi muatan akan kembali menaruh pesanan beli mereka untuk melindungi harga rata-rata kepemilikan mereka.',
        retailTrap: 'Menaruh Stop Loss tepat 1 tick di bawah garis support yang sangat kentara bagi semua orang.',
        takeaway: 'Tandai Support dan Resistance sebagai zona rentang harga (area box), bukan garis tipis tunggal.',
        widget: 'liquidity-zone-mapper'
      },
      {
        id: 'mod-5-3',
        code: 'MODUL 5.3',
        title: 'Celah Harga & Ketidakseimbangan (Fair Value Gap / FVG)',
        keyQuestion: 'Mengapa harga di grafik sering kali berbalik arah menutup celah kosong masa lalu?',
        analogy: 'Sebuah mobil balap melaju 180 km/jam melewati 3 pos pemeriksaan tanpa sempat berhenti sama sekali. Jalan tersebut meninggalkan kekosongan transaksi. Cepat atau lambat, polisi patroli akan meminta mobil kembali melayani pos-pos yang terlewat.',
        mechanism: 'Fair Value Gap (FVG) terjadi ketika muncul satu candle impulsif raksasa di mana sumbu tertinggi Candle 1 dan sumbu terendah Candle 3 tidak saling bersentuhan. Celah kosong ini mencerminkan transaksi satu arah yang tidak seimbang. Sifat alamiah lelang pasar cenderung menarik harga kembali untuk mengisi minimal 50% dari ruang kosong ini (disebut Consequent Encroachment / C.E.) sebelum melanjutkan arah tren aslinya.',
        retailTrap: 'Langsung memburu (chasing) harga yang sedang melesat kencang meninggalkan FVG besar, padahal harga berpeluang besar mengalami retrace ke level 50% FVG.',
        takeaway: 'Tunggulah harga retrace kembali mengisi 50% Fair Value Gap untuk mendapatkan harga beli dengan rasio risk-to-reward terbaik.',
        widget: 'fvg-50-magnet-sandbox'
      },
      {
        id: 'mod-5-4',
        code: 'MODUL 5.4',
        title: 'Liquidity Sweeps: Kenapa Stop Loss Ritel Sering Tersapu Lalu Harga Terbang?',
        keyQuestion: 'Mengapa setelah Anda terkena cut-loss, harga saham langsung berbalik melesat kencang?',
        analogy: 'Kapal tanker raksasa butuh dermaga berair dalam untuk berlabuh. Jika airnya dangkal, kapal akan kandas.',
        mechanism: 'Institusi yang butuh membeli 1.000.000 lot saham tidak bisa menekan tombol beli di pasar tipis karena harga akan langsung meroket tajam dan harga beli mereka jadi sangat mahal. Mereka butuh volume jual dalam jumlah raksasa di harga murah. Karena trader ritel diajarkan menaruh Stop Loss bergerombol tepat di bawah garis support, institusi dengan sengaja menekan harga turun sedikit menembus support. Ribuan Stop Loss ritel terpicu massal menjadi order jual pasar. Di kolam likuiditas inilah institusi dengan tenang menampung jutaan lot tersebut, lalu membiarkan harga melesat terbang tinggi!',
        retailTrap: 'Menaruh Stop Loss di tempat yang sama dengan jutaan trader ritel lainnya tanpa memberi ruang toleransi volatilitas.',
        takeaway: 'Masuklah membeli SETELAH liquidity sweep terjadi, yaitu ketika harga menembus support lalu dengan cepat kembali ditutup di atas support (False Breakdown / Spring).',
        widget: 'liquidity-sweep-simulator'
      }
    ]
  },
  {
    id: 'lvl-6',
    levelNum: '06',
    levelCode: 'LEVEL 6',
    title: 'Risk Desk & Psikologi Hedge Fund',
    subtitle: 'The Survival Cockpit: Matematika Drawdown, Formula Lot Sizing Diskrit, R:R Minimal 1:2, & Checklist Eksekusi',
    badgeColor: 'var(--accent-red)',
    readTime: '20 Menit',
    moduleCount: 4,
    modules: [
      {
        id: 'mod-6-1',
        code: 'MODUL 6.1',
        title: 'Asimetri Kehancuran: Matematika Drawdown & Pemulihan Modal',
        keyQuestion: 'Mengapa mengendalikan kerugian adalah SATU-SATUNYA kunci bertahan hidup di pasar modal?',
        analogy: 'Turun lift vs naik tangga darurat: Jatuh 50 meter dengan lift butuh waktu 5 detik, namun untuk naik kembali 50 meter Anda harus ngos-ngosan menaiki ratusan anak tangga sambil membawa beban ransel berat.',
        mechanism: 'Hukum Asimetri Kerugian Modal Finansial:\n- Modal turun -10% -> Butuh cuan +11.1% untuk kembali ke modal awal.\n- Modal turun -20% -> Butuh cuan +25.0% untuk kembali ke modal awal.\n- Modal turun -30% -> Butuh cuan +42.9% untuk kembali ke modal awal.\n- Modal turun -50% -> Butuh cuan +100.0% (DUA KALI LIPAT!) hanya untuk sekadar impas!\n- Modal turun -80% -> Butuh cuan +400.0% (LIMA KALI LIPAT!).\n- Modal turun -90% -> Butuh cuan +900.0% (SEPULUH KALI LIPAT!).',
        retailTrap: 'Membiarkan kerugian -5% membesar menjadi -20%, lalu -50% dengan alasan "menjadi investor jangka panjang", hingga modal terkunci permanen.',
        takeaway: 'Tebas kerugian sedini mungkin saat masih kecil (-2% hingga -5%). Jangan pernah membiarkan satu transaksi merusak seluruh portofolio Anda.',
        widget: 'drawdown-recovery-slider'
      },
      {
        id: 'mod-6-2',
        code: 'MODUL 6.2',
        title: 'Formula Ukuran Lot Diskrit Saham BEI (Aturan Anti-Bangkrut 1-2%)',
        keyQuestion: 'Berapa banyak lot saham yang boleh saya beli agar tidak pernah bangkrut?',
        analogy: 'Bukan seberapa banyak uang yang Anda punya di dompet untuk dibelanjakan semua, melainkan berapa banyak risiko yang diizinkan dompet Anda jika analisa Anda meleset.',
        mechanism: 'Rumus Ukuran Lot Diskrit Standar Hedge Fund BEI:\nJumlah Lot = Floor((Total Modal Akun x Toleransi Risiko %) / ((Harga Beli - Harga Stop Loss) x 100))\n\nContoh Nyata Perhitungan:\n- Total Kas Portofolio: Rp 100.000.000\n- Batas Toleransi Risiko: 1.5% = Rp 1.500.000 (Kerugian maksimal yang diizinkan)\n- Harga Beli Saham: Rp 3.000 per lembar\n- Batas Stop Loss Disiplin: Rp 2.850 per lembar (Jarak risiko = Rp 150 per lembar)\n- Maksimal Lot yang Boleh Dibeli = Rp 1.500.000 / (Rp 150 x 100) = 100 LOT\n- Total Modal Terpakai: 100 lot x 100 lembar x Rp 3.000 = Rp 30.000.000 (30% dari total kas).\n- Jika Stop Loss tersentuh di Rp 2.850, Anda menjual disiplin dan kerugian Anda TEPAT Rp 1.500.000 (1.5% modal). Modal Anda tetap utuh 98.5% untuk peluang berikutnya!',
        retailTrap: 'Membeli saham dengan menghabiskan seluruh kas akun (all-in) tanpa menghitung jarak stop loss terlebih dahulu.',
        takeaway: 'Hitung ukuran lot berdasarkan jarak stop loss, bukan berdasarkan sisa uang tunai yang ada di akun sekuritas Anda.',
        widget: 'exact-lot-calculator'
      },
      {
        id: 'mod-6-3',
        code: 'MODUL 6.3',
        title: 'Rasio Risk-to-Reward (R:R >= 1:2) & Mengapa Win Rate 40% Menghasilkan Kekayaan',
        keyQuestion: 'Mengapa trader profesional bisa konsisten kaya raya walau tebakannya sering salah?',
        analogy: 'Jika Anda bertaruh melempar koin: saat salah Anda hanya bayar Rp 1.000, tapi saat benar Anda dibayar Rp 2.500. Anda akan sangat kaya raya meski tebakan Anda hanya benar 4 dari 10 kali.',
        mechanism: 'Simulasi Matematika Ekspektansi:\nDari 10 kali transaksi, Anda salah 6 kali (Win Rate 40%):\n- 6 kali kalah x Rp 1.000.000 = -Rp 6.000.000\n- 4 kali menang x Rp 2.500.000 (R:R 1:2.5) = +Rp 10.000.000\n- Hasil Keuntungan Bersih: +Rp 4.000.000 Profit Konsisten!\n\nTrader profesional tidak membutuhkan akurasi 90%. Kunci keberhasilan mereka adalah membiarkan posisi profit berjalan hingga target (Let your winners run) dan memotong posisi rugi dengan cepat (Cut your losses short).',
        retailTrap: 'Terlalu cepat mengambil profit kecil (+2%) karena takut hilang, tetapi membiarkan posisi rugi membengkak (-30%) karena berharap harga akan balik.',
        takeaway: 'Jangan pernah masuk ke dalam transaksi jika potensi keuntungannya tidak minimal dua kali lipat lebih besar daripada jarak risiko stop loss-nya (R:R minimal 1:2).',
        widget: 'expectancy-winrate-table'
      },
      {
        id: 'mod-6-4',
        code: 'MODUL 6.4',
        title: 'Pre-Flight Checklist 5 Menit & Evaluasi Post-Mortem',
        keyQuestion: 'Apa saja 5 hal wajib yang harus diperiksa sebelum menekan tombol beli di aplikasi sekuritas?',
        analogy: 'Pilot pesawat terbang profesional selalu membaca checklist keselamatan di kokpit sebelum lepas landas, tidak peduli sudah berapa ribu jam terbang yang dimilikinya.',
        mechanism: 'Checklist Pra-Terbang 5 Menit MBG:\n1. Arah Arus Likuiditas Makro: Apakah DXY dan yield obligasi sedang mendukung atau menekan IHSG?\n2. Logika Katalis & Fundamental: Apakah perusahaan memiliki arus kas sehat atau sedang dalam fase akumulasi Wyckoff?\n3. Level Batas Pembatalan (Invalidation Stop Loss): Di mana letak pasti titik yang membuktikan bahwa analisa saya keliru?\n4. Ukuran Lot Terukur: Apakah jumlah lot yang diinput sudah sesuai dengan formula risiko 1-2% modal?\n5. Rasio Risk-to-Reward: Apakah jarak ke Target Profit minimal 2x lebih jauh daripada jarak ke Stop Loss?',
        retailTrap: 'Membeli saham karena panik melihat harga tiba-tiba melonjak di running trade tanpa rencana transaksi tertulis.',
        takeaway: 'Jika ada satu saja poin dalam checklist keselamatan yang tidak terpenuhi, batalkan transaksi dan tunggu peluang berikutnya.',
        widget: 'preflight-interactive-checklist'
      }
    ]
  }
];

// ============================================================================
// 66 GLOSSARY TERMS
// ============================================================================
const GLOSSARY_CATEGORIES = ['Semua', 'Makro & Suku Bunga', 'Mikrostruktur & Order Book', 'Smart Money & Teknikal', 'Manajemen Risiko'];

const GLOSSARY_DATA = [
  { term: 'The Fed (Federal Reserve)', category: 'Makro & Suku Bunga', def: 'Bank Sentral Amerika Serikat yang memegang kendali atas suku bunga acuan dunia (Fed Funds Rate) dan suplai Dolar global.' },
  { term: 'BI-Rate (7-Day Reverse Repo Rate)', category: 'Makro & Suku Bunga', def: 'Suku bunga acuan Bank Indonesia untuk mengendalikan inflasi dan menjaga stabilitas nilai tukar Rupiah.' },
  { term: 'DXY (US Dollar Index)', category: 'Makro & Suku Bunga', def: 'Indeks yang mengukur kekuatan Dolar AS terhadap 6 mata uang utama dunia (Euro, Yen, Pound, CAD, Krona, Franc).' },
  { term: 'Yield Curve Inversion (Inversi Kurva Imbal Hasil)', category: 'Makro & Suku Bunga', def: 'Kondisi di mana imbal hasil obligasi jangka pendek (2 tahun) lebih tinggi daripada jangka panjang (10 tahun), merupakan indikator historis resesi terkuat.' },
  { term: 'Quantitative Easing (QE)', category: 'Makro & Suku Bunga', def: 'Kebijakan bank sentral mencetak likuiditas dengan membeli obligasi di pasar untuk menurunkan suku bunga jangka panjang dan memacu ekonomi.' },
  { term: 'Quantitative Tightening (QT)', category: 'Makro & Suku Bunga', def: 'Kebijakan menyedot likuiditas dengan membiarkan obligasi jatuh tempo tanpa reinvestasi, mengurangi neraca bank sentral.' },
  { term: 'Carry Trade', category: 'Makro & Suku Bunga', def: 'Strategi meminjam mata uang di negara dengan suku bunga rendah (misal Yen) untuk membeli obligasi di negara berbunga tinggi (misal Rupiah).' },
  { term: 'CPI (Consumer Price Index)', category: 'Makro & Suku Bunga', def: 'Ukuran statistik rata-rata harga sekeranjang barang dan jasa konsumen, tolok ukur utama inflasi.' },
  { term: 'Non-Farm Payrolls (NFP)', category: 'Makro & Suku Bunga', def: 'Data bulanan rilis ketenagakerjaan AS yang mengukur jumlah pekerjaan baru di luar sektor agrikultur.' },
  { term: 'Capital Outflow / Inflow', category: 'Makro & Suku Bunga', def: 'Arus dana investasi asing yang keluar atau masuk ke pasar finansial suatu negara.' },
  { term: 'Limit Order', category: 'Mikrostruktur & Order Book', def: 'Pesanan pasif membeli atau menjual di harga tertentu atau lebih baik yang mengantri di buku order bursa.' },
  { term: 'Market Order', category: 'Mikrostruktur & Order Book', def: 'Pesanan agresif membeli atau menjual seketika di harga terbaik yang tersedia saat itu di buku order.' },
  { term: 'Bid & Ask (Offer)', category: 'Mikrostruktur & Order Book', def: 'Bid adalah antrian harga beli tertinggi dari pembeli, Ask/Offer adalah antrian harga jual terendah dari penjual.' },
  { term: 'Spread', category: 'Mikrostruktur & Order Book', def: 'Selisih harga antara antrian beli tertinggi (Best Bid) dan antrian jual terendah (Best Ask).' },
  { term: 'Slippage', category: 'Mikrostruktur & Order Book', def: 'Perbedaan antara harga yang diharapkan saat order dikirim dengan harga eksekusi aktual karena likuiditas tipis.' },
  { term: 'Order Book Depth (Kedalaman Pasar)', category: 'Mikrostruktur & Order Book', def: 'Total volume lot yang mengantri di berbagai tingkatan harga bid dan ask.' },
  { term: 'Spoofing', category: 'Mikrostruktur & Order Book', def: 'Taktik manipulatif memasang antrian pesanan palsu berjumlah raksasa di buku order lalu membatalkannya sebelum tereksekusi untuk menipu ritel.' },
  { term: 'Iceberg Order', category: 'Mikrostruktur & Order Book', def: 'Pesanan institusi berukuran jumbo yang dipecah otomatis oleh sistem menjadi potongan-potongan kecil agar tidak terlihat di running trade.' },
  { term: 'Volume Weighted Average Price (VWAP)', category: 'Mikrostruktur & Order Book', def: 'Rata-rata harga tertimbang volume transaksi, menjadi patokan efisiensi eksekusi manajer investasi institusi.' },
  { term: 'Foreign Net Buy / Sell', category: 'Mikrostruktur & Order Book', def: 'Selisih bersih nilai pembelian saham oleh investor asing dikurangi nilai penjualan mereka pada suatu emiten atau bursa.' },
  { term: 'Fair Value Gap (FVG)', category: 'Smart Money & Teknikal', def: 'Area ketidakseimbangan harga antara sumbu candle ke-1 dan ke-3 yang terjadi akibat dorongan agresif candle ke-2.' },
  { term: 'Consequent Encroachment (C.E.)', category: 'Smart Money & Teknikal', def: 'Level persis 50% dari rentang Fair Value Gap yang sering bertindak sebagai magnet pantulan harga.' },
  { term: 'Liquidity Sweep', category: 'Smart Money & Teknikal', def: 'Pergerakan menembus level puncak (High) atau lembah (Low) untuk melahap stop loss trader ritel sebelum harga berbalik arah.' },
  { term: 'Order Block (OB)', category: 'Smart Money & Teknikal', def: 'Candle terakhir sebelum pergerakan impulsif tajam, mengindikasikan zona di mana institusi menaruh pesanan skala besar.' },
  { term: 'Break of Structure (BOS)', category: 'Smart Money & Teknikal', def: 'Penembusan valid level swing high (dalam uptrend) atau swing low (dalam downtrend) yang mengonfirmasi kelanjutan tren.' },
  { term: 'Change of Character (CHoCH)', category: 'Smart Money & Teknikal', def: 'Sinyal awal perubahan arah tren ketika harga menembus titik struktur swing berlawanan untuk pertama kali.' },
  { term: 'Akumulasi Wyckoff', category: 'Smart Money & Teknikal', def: 'Fase di mana smart money menyerap saham secara diam-diam di rentang sideways saat pasar sepi sebelum markup.' },
  { term: 'Distribusi Wyckoff', category: 'Smart Money & Teknikal', def: 'Fase di mana smart money menjual sahamnya ke publik di puncak harga saat berita positif ramai sebelum markdown.' },
  { term: 'Cum-Date & Ex-Date', category: 'Smart Money & Teknikal', def: 'Cum-Date adalah batas akhir kepemilikan saham untuk berhak dapat dividen; Ex-Date adalah hari di mana pembeli saham tidak lagi berhak dapat dividen.' },
  { term: 'Dividend Trap', category: 'Smart Money & Teknikal', def: 'Jebakan di mana harga saham anjlok pasca Ex-Date lebih dalam daripada nilai dividen yang dibagikan.' },
  { term: 'Drawdown', category: 'Manajemen Risiko', def: 'Penurunan nilai puncak portofolio ke titik terendah sebelum mencetak rekor baru, diukur dalam persentase.' },
  { term: 'Value at Risk (VaR)', category: 'Manajemen Risiko', def: 'Estimasi kerugian maksimal yang mungkin dialami portofolio dalam horizon waktu tertentu pada tingkat kepercayaan tertentu (misal 95%).' },
  { term: 'Risk-to-Reward Ratio (R:R)', category: 'Manajemen Risiko', def: 'Perbandingan antara potensi kerugian (jarak stop loss) dengan potensi keuntungan (jarak target profit).' },
  { term: 'Position Sizing', category: 'Manajemen Risiko', def: 'Kalkulasi jumlah lot saham yang dibeli agar jika stop loss terpicu, nilai kerugian tidak melebihi toleransi risiko akun.' },
  { term: 'Sharpe Ratio', category: 'Manajemen Risiko', def: 'Rasio yang mengukur imbal hasil berlebih (excess return) relatif terhadap volatilitas risiko portofolio.' },
  { term: 'Deflated Sharpe Ratio (DSR)', category: 'Manajemen Risiko', def: 'Metode statistik Marcos López de Prado untuk mengoreksi Sharpe Ratio palsu yang dihasilkan dari overfitting banyak backtest.' }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function QuantAcademyTab() {
  const [activeLevelId, setActiveLevelId] = useState('lvl-1');
  const [activeModuleId, setActiveModuleId] = useState('mod-1-1');
  const [completedModules, setCompletedModules] = useState(['mod-1-1']);
  const [searchGlossary, setSearchGlossary] = useState('');
  const [selectedGlossaryCategory, setSelectedGlossaryCategory] = useState('Semua');

  // Interactive Widgets State
  const [fedBps, setFedBps] = useState(50);
  const [drawdownPct, setDrawdownPct] = useState(30);
  const [fvgHeight, setFvgHeight] = useState(60);
  const [lotModal, setLotModal] = useState(100000000);
  const [lotRiskPct, setLotRiskPct] = useState(1.5);
  const [lotEntry, setLotEntry] = useState(3000);
  const [lotSL, setLotSL] = useState(2850);
  const [activeHistoryCase, setActiveHistoryCase] = useState(0);

  // Active level & module derivation
  const activeLevel = useMemo(() => {
    return CURRICULUM_LEVELS.find(l => l.id === activeLevelId) || CURRICULUM_LEVELS[0];
  }, [activeLevelId]);

  const activeModule = useMemo(() => {
    return activeLevel.modules.find(m => m.id === activeModuleId) || activeLevel.modules[0];
  }, [activeLevel, activeModuleId]);

  const handleSelectModule = (lvlId, modId) => {
    setActiveLevelId(lvlId);
    setActiveModuleId(modId);
    if (!completedModules.includes(modId)) {
      setCompletedModules(prev => [...prev, modId]);
    }
  };

  // Calculations for lot sizing
  const lotRiskRupiah = (lotModal * lotRiskPct) / 100;
  const riskPerShare = Math.max(1, lotEntry - lotSL);
  const calculatedLots = Math.max(1, Math.floor(lotRiskRupiah / (riskPerShare * 100)));
  const totalModalUsed = calculatedLots * 100 * lotEntry;
  const modalUsagePct = ((totalModalUsed / lotModal) * 100).toFixed(1);

  // Drawdown recovery
  const recoveryNeeded = ((1 / (1 - drawdownPct / 100) - 1) * 100).toFixed(1);

  // Filtered glossary
  const filteredGlossary = useMemo(() => {
    return GLOSSARY_DATA.filter(item => {
      const matchCat = selectedGlossaryCategory === 'Semua' || item.category === selectedGlossaryCategory;
      const matchSearch = item.term.toLowerCase().includes(searchGlossary.toLowerCase()) || item.def.toLowerCase().includes(searchGlossary.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [searchGlossary, selectedGlossaryCategory]);

  return (
    <div style={{ padding: '16px', maxWidth: '1440px', margin: '0 auto', color: 'var(--text-primary)' }}>
      {/* COCKPIT HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 24, 40, 0.95), rgba(20, 32, 54, 0.95))',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '20px 24px',
        marginBottom: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                MBG QUANT ACADEMY // 6-LEVEL MASTERCLASS
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• Dari Nol Hingga Standar Analis Hedge Fund</span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.3px', color: '#fff' }}>
              Bagaimana Dunia Finansial Bekerja & Cara Bertahan di Pasar Modal
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '920px', lineHeight: '1.5' }}>
              Kurikulum bertahap 20 modul terstruktur tanpa jargon membingungkan. Pelajari bagaimana uang bergerak di seluruh dunia, transmisi makro The Fed, anatomi 5 instrumen pasar, analisis fundamental & teknikal riil, rahasia bandarmology di BEI, serta sistem manajemen risiko pelindung modal.
            </p>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>PROGRESS KURIKULUM</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-green)' }}>
              {completedModules.length} / 20 MODUL ({Math.round((completedModules.length / 20) * 100)}%)
            </div>
            <div style={{ width: '130px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${(completedModules.length / 20) * 100}%`, height: '100%', background: 'var(--accent-green)', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {/* 6 LEVELS NAVIGATION CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginTop: '16px' }}>
          {CURRICULUM_LEVELS.map((lvl) => {
            const isActive = activeLevelId === lvl.id && activeLevelId !== 'glossary';
            const lvlDoneCount = lvl.modules.filter(m => completedModules.includes(m.id)).length;
            return (
              <button
                key={lvl.id}
                onClick={() => {
                  setActiveLevelId(lvl.id);
                  setActiveModuleId(lvl.modules[0].id);
                  if (!completedModules.includes(lvl.modules[0].id)) {
                    setCompletedModules(prev => [...prev, lvl.modules[0].id]);
                  }
                }}
                style={{
                  background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: isActive ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: lvl.badgeColor }}>{lvl.levelCode}</span>
                  <span style={{ fontSize: '10px', color: lvlDoneCount === lvl.moduleCount ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                    {lvlDoneCount}/{lvl.moduleCount} Selesai
                  </span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: isActive ? '#fff' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {lvl.title}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{lvl.readTime} • {lvl.moduleCount} Modul</div>
              </button>
            );
          })}

          {/* GLOSSARY BUTTON */}
          <button
            onClick={() => setActiveLevelId('glossary')}
            style={{
              background: activeLevelId === 'glossary' ? 'rgba(251, 146, 60, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: activeLevelId === 'glossary' ? '1px solid var(--accent-orange)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '10px 12px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-orange)' }}>REFERENSI</div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: activeLevelId === 'glossary' ? '#fff' : 'var(--text-secondary)' }}>
              Kamus 66 Istilah
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Pencarian Cepat</div>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {activeLevelId !== 'glossary' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: '16px' }}>
          {/* LEFT SIDEBAR: MODULE LIST OF CURRENT LEVEL */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '16px',
            height: 'fit-content'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: activeLevel.badgeColor, marginBottom: '4px' }}>
              {activeLevel.levelCode} // DAFTAR MODUL
            </div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginBottom: '14px' }}>
              {activeLevel.title}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activeLevel.modules.map((mod) => {
                const isModActive = activeModuleId === mod.id;
                const isModDone = completedModules.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => handleSelectModule(activeLevel.id, mod.id)}
                    style={{
                      background: isModActive ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: isModActive ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '6px',
                      padding: '10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: isModActive ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                        {mod.code}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: isModActive ? '#fff' : 'var(--text-secondary)', lineHeight: '1.3' }}>
                        {mod.title.split(': ')[0]}
                      </div>
                    </div>
                    {isModDone && <span style={{ fontSize: '11px', color: 'var(--accent-green)' }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL: ACTIVE MODULE CONTENT */}
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* MODULE HEADER CARD */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '20px 24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: activeLevel.badgeColor, letterSpacing: '0.8px' }}>
                  {activeLevel.levelCode} • {activeModule.code}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: '700' }}>
                  {completedModules.includes(activeModule.id) ? '✓ Telah Dipelajari' : '• Sedang Dipelajari'}
                </span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0', color: '#fff' }}>
                {activeModule.title}
              </h2>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid var(--accent-cyan)' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-cyan)' }}>PERTANYAAN KUNCI: </span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{activeModule.keyQuestion}</span>
              </div>
            </div>

            {/* ANALOGY BOX */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              borderLeft: '4px solid var(--accent-cyan)',
              padding: '16px 20px',
              borderRadius: '0 8px 8px 0'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                💡 ANALOGI KEHIDUPAN NYATA (MENTAL MODEL):
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                {activeModule.analogy}
              </div>
            </div>

            {/* REAL MECHANISM BOX */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 10px 0' }}>
                ⚙️ Bagaimana Mekanisme & Rantai Transmisi di Baliknya?
              </h3>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                {activeModule.mechanism}
              </div>
            </div>

            {/* RETAIL TRAP VS SMART MONEY PLAYBOOK */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px'
            }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-red)', marginBottom: '6px' }}>
                  ⚠️ JEBAKAN INVESTOR AWAM / RITEL:
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  {activeModule.retailTrap}
                </div>
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-green)', marginBottom: '6px' }}>
                  🛡️ TINDAKAN TAKTIS INVESTOR CERDAS (PLAYBOOK):
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  {activeModule.takeaway}
                </div>
              </div>
            </div>

            {/* INTERACTIVE WIDGET SECTION */}
            {activeModule.widget === 'fed-hike-simulator' && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 4px 0' }}>
                      🎛️ Simulator Interaktif: Kenaikan Suku Bunga The Fed vs Dampak ke BEI
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Geser slider untuk melihat bagaimana kenaikan suku bunga The Fed memengaruhi DXY, Rupiah, dan Valuasi IHSG.
                    </p>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-cyan)' }}>
                    +{fedBps} bps ({fedBps / 100}%)
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="150"
                  step="25"
                  value={fedBps}
                  onChange={(e) => setFedBps(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)', marginBottom: '16px', cursor: 'pointer' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Indeks Dolar (DXY)</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: fedBps > 50 ? 'var(--accent-green)' : '#fff' }}>
                      {(100.5 + fedBps * 0.04).toFixed(2)} ({fedBps > 0 ? `+${(fedBps * 0.04).toFixed(1)}%` : '0%'})
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimasi Kurs USD/IDR</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: fedBps > 50 ? 'var(--accent-red)' : '#fff' }}>
                      Rp {Math.round(15500 + fedBps * 8.5).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Diskon Valuasi IHSG</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: fedBps > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                      {fedBps === 0 ? 'Netral / Stabil' : `-${(fedBps * 0.035).toFixed(2)}%`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LOT CALCULATOR WIDGET (LEVEL 6) */}
            {activeModule.widget === 'exact-lot-calculator' && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-green)', margin: '0 0 6px 0' }}>
                  🛡️ Kalkulator Ukuran Lot Diskrit Saham BEI (Aturan Anti-Bangkrut 1-2%)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                  Hitung ukuran lot aman berdasarkan batas toleransi kerugian modal akun Anda, bukan berdasarkan tebakan.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Total Kas Akun (Rp)</label>
                    <input
                      type="number"
                      value={lotModal}
                      onChange={(e) => setLotModal(Number(e.target.value))}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Toleransi Risiko (%)</label>
                    <input
                      type="number"
                      value={lotRiskPct}
                      onChange={(e) => setLotRiskPct(Number(e.target.value))}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Harga Beli (Entry Rp)</label>
                    <input
                      type="number"
                      value={lotEntry}
                      onChange={(e) => setLotEntry(Number(e.target.value))}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Batas Cut-Loss (Stop Loss Rp)</label>
                    <input
                      type="number"
                      value={lotSL}
                      onChange={(e) => setLotSL(Number(e.target.value))}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Maksimal Boleh Dibeli</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent-green)' }}>{calculatedLots.toLocaleString()} LOT</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({(calculatedLots * 100).toLocaleString()} Lembar)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Modal Terpakai</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>Rp {totalModalUsed.toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{modalUsagePct}% dari total kas akun</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Risiko Maksimal Jika Kena SL</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-red)' }}>Rp {lotRiskRupiah.toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Tepat {lotRiskPct}% dari total modal</div>
                  </div>
                </div>
              </div>
            )}

            {/* DRAWDOWN RECOVERY SLIDER (LEVEL 6) */}
            {activeModule.widget === 'drawdown-recovery-slider' && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-red)', margin: '0 0 8px 0' }}>
                  📉 Simulator Asimetri Drawdown: Uji Beban Pemulihan Modal Anda
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Kerugian Modal Anda:</span>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-red)' }}>-{drawdownPct}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="5"
                  value={drawdownPct}
                  onChange={(e) => setDrawdownPct(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-red)', marginBottom: '14px' }}
                />
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px 16px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#fff' }}>Keuntungan Wajib Dicapai Hanya untuk Balik Modal:</span>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-green)' }}>+{recoveryNeeded}%</span>
                </div>
              </div>
            )}

            {/* FVG SANDBOX (LEVEL 5) */}
            {activeModule.widget === 'fvg-50-magnet-sandbox' && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 8px 0' }}>
                  🎯 Sandbox Celah Harga: Mengapa 50% Consequent Encroachment (C.E.) Menjadi Magnet?
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tinggi Celah FVG:</span>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={fvgHeight}
                    onChange={(e) => setFvgHeight(Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent-purple)' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-purple)' }}>{fvgHeight} Pts</span>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '180px', position: 'relative' }}>
                  <div style={{ width: '28px', height: '60px', background: 'var(--accent-green)', borderRadius: '3px', margin: '0 16px' }} />
                  <div style={{
                    position: 'absolute',
                    left: '30%',
                    right: '30%',
                    bottom: '65px',
                    height: `${fvgHeight}px`,
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px dashed var(--accent-purple)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-purple)' }}>FVG IMBALANCE</span>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid var(--accent-cyan)' }}>
                      <span style={{ position: 'absolute', right: '4px', top: '-12px', fontSize: '9px', color: 'var(--accent-cyan)', fontWeight: '800' }}>50% C.E.</span>
                    </div>
                  </div>
                  <div style={{ width: '32px', height: `${80 + fvgHeight * 0.7}px`, background: 'var(--accent-green)', borderRadius: '3px', margin: '0 16px', zIndex: 2 }} />
                  <div style={{ width: '28px', height: '50px', background: 'var(--accent-red)', borderRadius: '3px', margin: '0 16px', alignSelf: 'flex-start' }} />
                </div>
              </div>
            )}

            {/* NAVIGATION BUTTONS PREV / NEXT */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <button
                onClick={() => {
                  const currentModIdx = activeLevel.modules.findIndex(m => m.id === activeModuleId);
                  if (currentModIdx > 0) {
                    handleSelectModule(activeLevel.id, activeLevel.modules[currentModIdx - 1].id);
                  } else {
                    const currentLvlIdx = CURRICULUM_LEVELS.findIndex(l => l.id === activeLevelId);
                    if (currentLvlIdx > 0) {
                      const prevLvl = CURRICULUM_LEVELS[currentLvlIdx - 1];
                      handleSelectModule(prevLvl.id, prevLvl.modules[prevLvl.modules.length - 1].id);
                    }
                  }
                }}
                disabled={activeLevelId === 'lvl-1' && activeModuleId === 'mod-1-1'}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: (activeLevelId === 'lvl-1' && activeModuleId === 'mod-1-1') ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
              >
                ← Modul Sebelumnya
              </button>

              <button
                onClick={() => {
                  const currentModIdx = activeLevel.modules.findIndex(m => m.id === activeModuleId);
                  if (currentModIdx < activeLevel.modules.length - 1) {
                    handleSelectModule(activeLevel.id, activeLevel.modules[currentModIdx + 1].id);
                  } else {
                    const currentLvlIdx = CURRICULUM_LEVELS.findIndex(l => l.id === activeLevelId);
                    if (currentLvlIdx < CURRICULUM_LEVELS.length - 1) {
                      const nextLvl = CURRICULUM_LEVELS[currentLvlIdx + 1];
                      handleSelectModule(nextLvl.id, nextLvl.modules[0].id);
                    } else {
                      setActiveLevelId('glossary');
                    }
                  }
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  background: 'var(--accent-green)',
                  color: '#000',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '800'
                }}
              >
                Lanjut ke Modul Berikutnya →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOSSARY VIEW */}
      {activeLevelId === 'glossary' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#fff' }}>
                📖 Kamus Istilah Pasar Finansial ({filteredGlossary.length} Istilah)
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                Glosarium lengkap istilah makroekonomi, mikrostruktur bursa, smart money concepts, dan manajemen risiko.
              </p>
            </div>

            <input
              type="text"
              placeholder="Cari istilah atau definisi..."
              value={searchGlossary}
              onChange={(e) => setSearchGlossary(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '8px 14px',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                minWidth: '240px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {GLOSSARY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedGlossaryCategory(cat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  background: selectedGlossaryCategory === cat ? 'var(--accent-orange)' : 'rgba(255,255,255,0.05)',
                  color: selectedGlossaryCategory === cat ? '#000' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
            {filteredGlossary.map((item, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>{item.term}</span>
                  <span style={{ fontSize: '10px', color: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    {item.category}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {item.def}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
