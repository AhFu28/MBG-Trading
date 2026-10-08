import React, { useState, useMemo, useEffect, useRef } from 'react';

// ============================================================================
// DATA KURIKULUM 6 LEVEL & 20 MODUL LENGKAP
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
        interactiveType: 'dam-simulator'
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
        interactiveType: 'dam-simulator'
      },
      {
        id: 'mod-1-3',
        code: 'MODUL 1.3',
        title: 'Suku Bunga & Inflasi: Termostat Perekonomian Dunia',
        keyQuestion: 'Mengapa Bank Sentral sengaja "mendinginkan" ekonomi saat harga barang naik?',
        analogy: 'Suku bunga bekerja persis seperti termostat AC. Jika ruangan terlalu panas (inflasi melonjak, harga kebutuhan tak terkendali), termostat disetel dingin (bunga dinaikkan) agar konsumsi masyarakat dan belanja korporasi mengerem. Jika ekonomi kedinginan (resesi, pabrik tutup), termostat dipanaskan (bunga dipotong) agar kredit kembali murah.',
        mechanism: 'The Federal Reserve mengendalikan suku bunga acuan dunia (Fed Funds Rate), sementara Bank Indonesia mengendalikan BI-Rate (7-Day Reverse Repo Rate). Bank Indonesia wajib menjaga selisih imbal hasil positif (Carry Spread minimal 100-200 bps) di atas bunga The Fed agar investor asing tidak mencairkan dana mereka dari Surat Berharga Negara (SBN) untuk dipindahkan ke obligasi AS.',
        retailTrap: 'Membeli saham berutang tinggi (High Debt-to-Equity Ratio) saat siklus kenaikan suku bunga baru dimulai. Beban bunga utang emiten akan melonjak berlipat ganda dan menggerus dividen.',
        takeaway: 'Pilih emiten kaya kas bebas utang (Net Cash) saat suku bunga tinggi, dan beli emiten ekspansif saat suku bunga mulai dipangkas.',
        interactiveType: 'dam-simulator'
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
        interactiveType: 'domino-stepper'
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
        interactiveType: 'crisis-charts'
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
        interactiveType: 'crisis-charts'
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
        interactiveType: 'balance-scale'
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
        interactiveType: 'balance-scale'
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
        interactiveType: 'supercycle-sine'
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
        interactiveType: 'orderbook-ladder'
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
        interactiveType: 'orderbook-ladder'
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
        interactiveType: 'dividend-trap-sandbox'
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
        interactiveType: 'dividend-trap-sandbox'
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
        interactiveType: 'fvg-sweep-playground'
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
        interactiveType: 'fvg-sweep-playground'
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
        interactiveType: 'fvg-sweep-playground'
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
        interactiveType: 'fvg-sweep-playground'
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
        interactiveType: 'execution-bracket'
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
        interactiveType: 'execution-bracket'
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
        interactiveType: 'execution-bracket'
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
        interactiveType: 'preflight-scorecard'
      }
    ]
  }
];

// ============================================================================
// 66 GLOSSARY ITEMS
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
// KOMPONEN VISUAL 1: BENDUNGAN LIKUIDITAS BANK SENTRAL (SVG INTERACTIVE DAM)
// ============================================================================
function SvgDamSimulator() {
  const [gateOpening, setGateOpening] = useState(65);

  const stockHeight = Math.round(20 + gateOpening * 0.7);
  const bondYield = (5.5 - (gateOpening * 0.03)).toFixed(2);
  const cryptoHeight = Math.round(10 + gateOpening * 0.85);
  const goldHeight = Math.round(30 + gateOpening * 0.5);

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 4px 0' }}>
            🌊 ILUSTRASI VISUAL: BENDUNGAN LIKUIDITAS BANK SENTRAL
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Geser bukaan pintu bendungan untuk melihat bagaimana debit likuiditas mengalir mengisi 4 kolam aset finansial dunia.
          </p>
        </div>
        <div style={{ fontSize: '15px', fontWeight: '900', color: gateOpening > 50 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
          Pintu Bendungan: {gateOpening}% {gateOpening >= 70 ? '(Stimulus / Bunga Rendah)' : gateOpening <= 30 ? '(Kering / QT Ketat)' : '(Netral)'}
        </div>
      </div>

      <input
        type="range"
        min="10"
        max="100"
        value={gateOpening}
        onChange={(e) => setGateOpening(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent-cyan)', marginBottom: '18px', cursor: 'pointer' }}
      />

      <div style={{ background: 'rgba(0, 0, 0, 0.45)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <rect x="20" y="20" width="160" height="90" fill="#1e293b" stroke="#334155" strokeWidth="2" rx="4" />
          <text x="100" y="45" fill="var(--accent-sky)" fontSize="11" fontWeight="800" textAnchor="middle">THE FED & BI</text>
          <text x="100" y="62" fill="#94a3b8" fontSize="9" textAnchor="middle">Waduk Likuiditas Global</text>
          
          <rect x="70" y="75" width="60" height="30" fill="#0f172a" stroke="#475569" strokeWidth="1" />
          <rect x="70" y={105 - (gateOpening * 0.25)} width="60" height={gateOpening * 0.25} fill="#0284c7" opacity="0.8" />
          <text x="100" y="94" fill="#fff" fontSize="8" fontWeight="800" textAnchor="middle">PINTU AIR</text>

          <path d="M 130 90 L 220 90 L 220 140 L 750 140" fill="none" stroke="#0284c7" strokeWidth={Math.max(2, gateOpening * 0.08)} strokeDasharray="4" opacity={gateOpening / 100} />

          {/* POOL 1: SAHAM */}
          <g transform="translate(240, 50)">
            <rect x="0" y="0" width="105" height="130" fill="#0f172a" stroke="#334155" strokeWidth="1.5" rx="4" />
            <rect x="3" y={127 - stockHeight} width="99" height={stockHeight} fill="var(--accent-green)" opacity="0.65" rx="2" />
            <text x="52" y="24" fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle">📈 SAHAM (BEI)</text>
            <text x="52" y="40" fill={stockHeight > 55 ? 'var(--accent-green)' : 'var(--accent-red)'} fontSize="12" fontWeight="900" textAnchor="middle">
              {stockHeight > 55 ? `+${((stockHeight - 50) * 0.6).toFixed(1)}%` : `-${((50 - stockHeight) * 0.6).toFixed(1)}%`}
            </text>
            <text x="52" y="120" fill="#94a3b8" fontSize="8" textAnchor="middle">Air: {stockHeight}%</text>
          </g>

          {/* POOL 2: OBLIGASI */}
          <g transform="translate(370, 50)">
            <rect x="0" y="0" width="105" height="130" fill="#0f172a" stroke="#334155" strokeWidth="1.5" rx="4" />
            <rect x="3" y={127 - (100 - gateOpening * 0.7)} width="99" height={100 - gateOpening * 0.7} fill="var(--accent-blue)" opacity="0.65" rx="2" />
            <text x="52" y="24" fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle">🏛️ OBLIGASI</text>
            <text x="52" y="40" fill="var(--accent-cyan)" fontSize="11" fontWeight="800" textAnchor="middle">
              Yield: {bondYield}%
            </text>
            <text x="52" y="120" fill="#94a3b8" fontSize="8" textAnchor="middle">Kupon Relatif</text>
          </g>

          {/* POOL 3: KOMODITAS */}
          <g transform="translate(500, 50)">
            <rect x="0" y="0" width="105" height="130" fill="#0f172a" stroke="#334155" strokeWidth="1.5" rx="4" />
            <rect x="3" y={127 - goldHeight} width="99" height={goldHeight} fill="var(--accent-orange)" opacity="0.65" rx="2" />
            <text x="52" y="24" fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle">⛏️ EMAS & MINYAK</text>
            <text x="52" y="40" fill="var(--accent-orange)" fontSize="11" fontWeight="800" textAnchor="middle">
              {goldHeight > 55 ? 'Lindung Nilai' : 'Stabil'}
            </text>
            <text x="52" y="120" fill="#94a3b8" fontSize="8" textAnchor="middle">Air: {goldHeight}%</text>
          </g>

          {/* POOL 4: KRIPTO */}
          <g transform="translate(630, 50)">
            <rect x="0" y="0" width="105" height="130" fill="#0f172a" stroke="#334155" strokeWidth="1.5" rx="4" />
            <rect x="3" y={127 - cryptoHeight} width="99" height={cryptoHeight} fill="var(--accent-purple)" opacity="0.65" rx="2" />
            <text x="52" y="24" fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle">🪙 KRIPTO (BTC)</text>
            <text x="52" y="40" fill={cryptoHeight > 55 ? 'var(--accent-green)' : 'var(--accent-red)'} fontSize="12" fontWeight="900" textAnchor="middle">
              {cryptoHeight > 55 ? `+${((cryptoHeight - 45) * 1.5).toFixed(0)}%` : `-${((45 - cryptoHeight) * 1.5).toFixed(0)}%`}
            </text>
            <text x="52" y="120" fill="#94a3b8" fontSize="8" textAnchor="middle">Air: {cryptoHeight}%</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN VISUAL 2: DIAGRAM INTERAKTIF EFEK DOMINO 8-TAHAP (LEVEL 2)
// ============================================================================
function DominoStepper() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { title: '1. The Fed Naikkan Bunga', desc: 'The Fed di Washington menaikkan Fed Funds Rate (+50 bps) untuk mendinginkan inflasi di AS.' },
    { title: '2. Yield US 10Y Melonjak', desc: 'Obligasi pemerintah AS menawarkan bunga lebih tinggi tanpa risiko gagal bayar.' },
    { title: '3. Indeks Dolar (DXY) Menguat', desc: 'Investor global memburu Dolar AS untuk membeli surat utang AS berbunga tinggi.' },
    { title: '4. Capital Outflow dari Emerging Markets', desc: 'Manajer investasi asing menarik modal dari bursa berkembang (BEI, Thailand, Filipina).' },
    { title: '5. Nilai Tukar Rupiah Tertekan', desc: 'Penjualan aset berdenominasi Rupiah untuk dikonversi ke USD mendepresiasi kurs USD/IDR.' },
    { title: '6. Bank Indonesia Naikkan BI-Rate', desc: 'BI menaikkan suku bunga untuk mempertahankan selisih bunga (carry spread) pelindung devisa.' },
    { title: '7. Beban Bunga Emiten Bertambah', desc: 'Bunga kredit perbankan dalam negeri naik, menggerus laba bersih perusahaan berutang.' },
    { title: '8. Valuasi Saham BEI Terkoreksi', desc: 'Harga saham di IHSG mengalami diskon valuasi dan indeks cenderung bergerak volatil.' }
  ];

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 4px 0' }}>
            ⚡ DIAGRAM ALUR INTERAKTIF: 8 TAHAP RANTAI TRANSMISI THE FED KE BEI
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Klik tombol langkah demi langkah untuk melihat bagaimana keputusan moneter di Washington merambat hingga ke lantai bursa Jakarta.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', cursor: activeStep === 0 ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: '700' }}
          >
            ← Mundur
          </button>
          <button
            onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
            disabled={activeStep === steps.length - 1}
            style={{ padding: '6px 12px', background: 'var(--accent-cyan)', border: 'none', color: '#000', borderRadius: '4px', cursor: activeStep === steps.length - 1 ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: '800' }}
          >
            Langkah Selanjutnya →
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '16px' }}>
        {steps.map((st, idx) => {
          const isCurrent = idx === activeStep;
          const isPassed = idx < activeStep;
          return (
            <div
              key={idx}
              onClick={() => setActiveStep(idx)}
              style={{
                background: isCurrent ? 'rgba(56, 189, 248, 0.2)' : isPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                border: isCurrent ? '2px solid var(--accent-cyan)' : isPassed ? '1px solid var(--accent-green)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '6px',
                padding: '10px 8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: '800', color: isCurrent ? 'var(--accent-cyan)' : isPassed ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                TAHAP {idx + 1}
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: isCurrent ? '#fff' : 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.2' }}>
                {st.title.split('. ')[1]}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderLeft: '4px solid var(--accent-cyan)', padding: '16px 20px', borderRadius: '0 8px 8px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-cyan)', marginBottom: '4px' }}>
          PENJELASAN TAHAP {activeStep + 1} DARI 8:
        </div>
        <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
          {steps[activeStep].title}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
          {steps[activeStep].desc}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN VISUAL 3: CHART SEJARAH 5 KRISIS BESAR (LEVEL 2)
// ============================================================================
function CrisisChartViewer() {
  const [selectedCrisis, setSelectedCrisis] = useState('taper-2013');

  const crisisData = {
    'asia-1997': {
      title: 'Krisis Moneter Asia (1997 - 1998)',
      trigger: 'Serangan spekulasi Baht Thailand menular ke Rupiah. Utang valas membengkak.',
      drawdown: '-65% IHSG, Rupiah Rp 2.500 -> Rp 16.000',
      rebound: 'Reformasi moneter & restrukturisasi perbankan nasional.',
      points: '20,80 80,75 140,50 200,160 260,180 320,150 380,120 440,90 500,40'
    },
    'gfc-2008': {
      title: 'Krisis Finansial Global / Lehman Collapse (2008)',
      trigger: 'Subprime mortgage AS runtuh, likuiditas global membeku seketika.',
      drawdown: '-60% IHSG (2.800 ke 1.100), bursa suspend 3 hari.',
      rebound: 'The Fed meluncurkan cetak uang Quantitative Easing (QE) 0%.',
      points: '20,40 80,45 140,70 200,170 260,185 320,140 380,80 440,50 500,30'
    },
    'taper-2013': {
      title: 'Taper Tantrum (Mei - September 2013)',
      trigger: 'Sinyal pemangkasan stimulus The Fed (Bernanke) memicu capital outflow mendadak.',
      drawdown: '-25% IHSG dalam beberapa pekan, Rupiah tembus Rp 12.000/USD.',
      rebound: 'BI menaikkan suku bunga 175 bps mengunci modal asing kembali.',
      points: '20,50 80,45 140,40 200,120 260,140 320,110 380,90 440,70 500,55'
    },
    'covid-2020': {
      title: 'Crash Pandemi Covid-19 (Maret 2020)',
      trigger: 'Lockdown global mematikan aktivitas riil seketika.',
      drawdown: '-37% IHSG sentuh dasar 3.900 akibat panic selling masif.',
      rebound: 'Injeksi stimulus moneter $5 Triliun mendorong reli IHSG ke 7.300+.',
      points: '20,60 80,55 140,65 200,180 260,160 320,110 380,60 440,35 500,20'
    }
  };

  const curr = crisisData[selectedCrisis];

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 4px 0' }}>
            📈 REKONSTRUKSI VISUAL: TRAJEKTORI 4 KRISIS BESAR PASAR MODAL
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Pilih peristiwa bersejarah untuk melihat pola kejatuhan dan kecepatan pemulihannya.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Object.keys(crisisData).map(k => (
            <button
              key={k}
              onClick={() => setSelectedCrisis(k)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                background: selectedCrisis === k ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                color: selectedCrisis === k ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              {crisisData[k].title.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{curr.title}</span>
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-red)' }}>Penurunan Maks: {curr.drawdown}</span>
        </div>

        <svg viewBox="0 0 520 200" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <line x1="20" y1="180" x2="500" y2="180" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1="20" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3" />
          
          <polyline
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth="3"
            points={curr.points}
          />

          <circle cx="200" cy="170" r="5" fill="var(--accent-red)" />
          <text x="210" y="165" fill="var(--accent-red)" fontSize="9" fontWeight="800">TITIK DASAR PANIK</text>

          <circle cx="500" cy="30" r="5" fill="var(--accent-green)" />
          <text x="440" y="25" fill="var(--accent-green)" fontSize="9" fontWeight="800">REBOUND REKOR</text>
        </svg>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-primary)' }}>
            <strong style={{ color: 'var(--accent-red)' }}>Pemicu Krisis:</strong> {curr.trigger}
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-primary)' }}>
            <strong style={{ color: 'var(--accent-green)' }}>Katalis Pemulihan:</strong> {curr.rebound}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN VISUAL 4: TIMBANGAN KAS RIIL VS LABA AKRUAL (LEVEL 3)
// ============================================================================
function BalanceScaleSimulator() {
  const [netIncome, setNetIncome] = useState(1000);
  const [cashFlow, setCashFlow] = useState(300);

  const ratio = (cashFlow / Math.max(1, netIncome)).toFixed(2);
  const isRedFlag = ratio < 0.7;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 4px 0' }}>
            ⚖️ TIMBANGAN KAS OPERASIONAL VS LABA DI ATAS KERTAS
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Uji kesehatan keuangan emiten: geser laba bersih vs arus kas masuk riil untuk mendeteksi manipulasi akuntansi.
          </p>
        </div>
        <div style={{ fontSize: '14px', fontWeight: '900', color: isRedFlag ? 'var(--accent-red)' : 'var(--accent-green)' }}>
          {isRedFlag ? '⚠️ BAHAYA: Manipulasi Akrual' : '✅ SEHAT: Kas Riil Menopang Laba'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Laba Bersih Akuntansi: Rp {netIncome.toLocaleString()} Miliar
          </label>
          <input
            type="range"
            min="200"
            max="2000"
            step="50"
            value={netIncome}
            onChange={(e) => setNetIncome(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Arus Kas Operasional Riil: Rp {cashFlow.toLocaleString()} Miliar
          </label>
          <input
            type="range"
            min="50"
            max="2000"
            step="50"
            value={cashFlow}
            onChange={(e) => setCashFlow(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-green)' }}
          />
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
        <svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', maxWidth: '400px', height: 'auto', margin: '0 auto', display: 'block' }}>
          <polygon points="200,90 190,120 210,120" fill="#475569" />
          <circle cx="200" cy="90" r="4" fill="#fff" />

          <line
            x1="80"
            y1={90 + (netIncome - cashFlow) * 0.02}
            x2="320"
            y2={90 - (netIncome - cashFlow) * 0.02}
            stroke="#94a3b8"
            strokeWidth="4"
          />

          <rect x="50" y={90 + (netIncome - cashFlow) * 0.02} width="60" height="20" fill="#0284c7" rx="3" />
          <text x="80" y={104 + (netIncome - cashFlow) * 0.02} fill="#fff" fontSize="8" fontWeight="800" textAnchor="middle">LABA KERTAS</text>

          <rect x="290" y={90 - (netIncome - cashFlow) * 0.02} width="60" height="20" fill="var(--accent-emerald)" rx="3" />
          <text x="320" y={104 - (netIncome - cashFlow) * 0.02} fill="#fff" fontSize="8" fontWeight="800" textAnchor="middle">KAS RIIL</text>
        </svg>

        <div style={{ fontSize: '13px', fontWeight: '700', color: isRedFlag ? 'var(--accent-red)' : 'var(--accent-green)', marginTop: '8px' }}>
          Rasio Kas terhadap Laba: {ratio}x {isRedFlag ? '(Kas operasional kurang dari 70% laba bersih!)' : '(Kas operasional sehat mengalir lancar)'}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN VISUAL: SIKLUS SUPER KOMODITAS SINE WAVE (LEVEL 3 MODUL 3.3)
// ============================================================================
function SupercycleSineWave() {
  const [activePhase, setActivePhase] = useState(1);

  const phases = [
    { title: 'Fase 1: Under-Investment (Dasar Siklus)', desc: 'Harga komoditas murah bertahun-tahun. Tambang tutup. Smart Money mulai mencicil akumulasi saat PE ratio terlihat mahal (karena laba sedang tertekan).', actor: 'Smart Money Masuk Diam-Diam', markerX: 80, markerY: 140, color: 'var(--accent-cyan)' },
    { title: 'Fase 2: Ledakan Permintaan / Windfall Boom (Puncak Siklus)', desc: 'Pasokan langka memicu lonjakan harga komoditas global ($400/ton batubara). Laba emiten melompat 500%, dividen yield fantastis diumumkan.', actor: 'Laba Rekor Tertinggi', markerX: 250, markerY: 30, color: 'var(--accent-green)' },
    { title: 'Fase 3: Ekspansi Berlebih & Jebakan Ritel (Capex Glut)', desc: 'Ritel berbondong-bondong membeli karena terpikat PER rendah (2x-3x). Emiten jor-joran belanja modal membuka tambang baru secara serentak.', actor: 'Ritel Terjebak FOMO', markerX: 370, markerY: 80, color: 'var(--accent-orange)' },
    { title: 'Fase 4: Kelebihan Pasokan & Kejatuhan Harga (Crash)', desc: 'Tambang baru banjir pasokan, harga komoditas jatuh bebas kembali ke dasar, mengunci modal ritel yang membeli di pucuk.', actor: 'Margin Tergerus Drastis', markerX: 470, markerY: 170, color: 'var(--accent-red)' }
  ];

  const curr = phases[activePhase];

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(251, 146, 60, 0.3)', borderRadius: '10px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-orange)', margin: '0 0 4px 0' }}>
            🔄 GELOMBANG SIKLUS SUPER KOMODITAS (COMMODITY SUPERCYCLE)
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Klik 4 fase siklus tambang untuk memahami mengapa membeli saham komoditas saat PER "murah" adalah jebakan maut.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {phases.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setActivePhase(idx)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                background: activePhase === idx ? p.color : 'rgba(255,255,255,0.05)',
                color: activePhase === idx ? '#000' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '800'
              }}
            >
              Fase {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <svg viewBox="0 0 520 200" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* BASELINE */}
          <line x1="20" y1="180" x2="500" y2="180" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1="20" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.08)" strokeDasharray="3" />

          {/* SINE WAVE OF COMMODITY CYCLE */}
          <path
            d="M 20 160 Q 140 160 170 100 T 250 30 T 370 80 T 490 170"
            fill="none"
            stroke="var(--accent-orange)"
            strokeWidth="3.5"
          />

          {/* ACTIVE MARKER */}
          <circle cx={curr.markerX} cy={curr.markerY} r="7" fill={curr.color} stroke="#fff" strokeWidth="2" />
          <text x={curr.markerX} y={curr.markerY - 14} fill={curr.color} fontSize="10" fontWeight="900" textAnchor="middle">
            {curr.actor.toUpperCase()}
          </text>
        </svg>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '6px', borderLeft: `4px solid ${curr.color}`, marginTop: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>{curr.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{curr.desc}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN VISUAL 5: ORDER BOOK DEPTH LADDER & SPOOFING SIMULATOR (LEVEL 4)
// ============================================================================
function OrderBookDepthLadder() {
  const [spoofActive, setSpoofActive] = useState(false);
  const [marketBuyActive, setMarketBuyActive] = useState(false);

  const spoofTimerRef = useRef(null);
  const marketBuyTimerRef = useRef(null);

  // Clean timers on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (spoofTimerRef.current) clearTimeout(spoofTimerRef.current);
      if (marketBuyTimerRef.current) clearTimeout(marketBuyTimerRef.current);
    };
  }, []);

  const handleSpoof = () => {
    setSpoofActive(true);
    if (spoofTimerRef.current) clearTimeout(spoofTimerRef.current);
    spoofTimerRef.current = setTimeout(() => setSpoofActive(false), 3000);
  };

  const handleMarketBuy = () => {
    setMarketBuyActive(true);
    if (marketBuyTimerRef.current) clearTimeout(marketBuyTimerRef.current);
    marketBuyTimerRef.current = setTimeout(() => setMarketBuyActive(false), 2500);
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(251, 146, 60, 0.3)', borderRadius: '10px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 4px 0' }}>
            📊 LADDER BUKU ORDER: DETEKSI SPOOFING & SAPUAN PAUS
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Simulasikan bagaimana bandar memasang antrian palsu (spoofing) dan bagaimana paus menyapu antrian offer.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSpoof}
            disabled={spoofActive}
            style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '800' }}
          >
            {spoofActive ? '⏳ Spoofing Aktif (Menghilang dalam 3s)...' : '🔴 Pasang Spoofing 50.000 Lot'}
          </button>
          <button
            onClick={handleMarketBuy}
            disabled={marketBuyActive}
            style={{ padding: '6px 12px', background: 'var(--accent-green)', border: 'none', color: '#000', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '800' }}
          >
            {marketBuyActive ? '💥 Paus Menyapu Offer!' : '🟢 Haka / Market Buy Paus 25.000 Lot'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-green)', marginBottom: '8px', textAlign: 'center' }}>
            ANTRIAN BELI (BID)
          </div>
          {[
            { price: 2980, lots: 1250 },
            { price: 2960, lots: spoofActive ? 51400 : 1400, isSpoof: spoofActive },
            { price: 2940, lots: 2100 },
            { price: 2920, lots: 3500 },
            { price: 2900, lots: 4800 }
          ].map((row, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: row.isSpoof ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.05)', marginBottom: '4px', borderRadius: '4px', borderLeft: row.isSpoof ? '3px solid var(--accent-red)' : 'none' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-green)' }}>Rp {row.price}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: row.isSpoof ? 'var(--accent-red)' : '#fff' }}>
                {row.lots.toLocaleString()} Lot {row.isSpoof && '⚠️ (PALSU)'}
              </span>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-red)', marginBottom: '8px', textAlign: 'center' }}>
            ANTRIAN JUAL (OFFER / ASK)
          </div>
          {[
            { price: 3000, lots: marketBuyActive ? 0 : 850, isEaten: marketBuyActive },
            { price: 3020, lots: marketBuyActive ? 0 : 2100, isEaten: marketBuyActive },
            { price: 3040, lots: 4200 },
            { price: 3060, lots: 5600 },
            { price: 3080, lots: 8900 }
          ].map((row, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: row.isEaten ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.05)', marginBottom: '4px', borderRadius: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-red)' }}>Rp {row.price}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: row.isEaten ? 'var(--accent-green)' : '#fff' }}>
                {row.isEaten ? '0 Lot (TERLAHAP PAUS!)' : `${row.lots.toLocaleString()} Lot`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN VISUAL 6: SIMULATOR JEBAKAN DIVIDEN $PTBA (LEVEL 4)
// ============================================================================
function DividendTrapSandbox() {
  const [buyTiming, setBuyTiming] = useState('cum-date');

  const scenarios = {
    'pre-cum': {
      label: 'Beli H-14 Sebelum Cum Date (Rp 3.200)',
      dividend: 800,
      sellPrice: 3800,
      action: 'Jual di hari Cum Date saat ritel berebut beli.',
      netPnL: '+Rp 600 per lembar (+18.7% Capital Gain)',
      color: 'var(--accent-green)'
    },
    'cum-date': {
      label: 'Beli di Hari H Cum Date Demi Dividen (Rp 3.800)',
      dividend: 800,
      sellPrice: 2600,
      action: 'Dapat dividen Rp 800, tapi saham ARB berturut-turut ke Rp 2.600.',
      netPnL: '-Rp 400 per lembar (-10.5% Net Kerugian Bersih)',
      color: 'var(--accent-red)'
    },
    'post-ex': {
      label: 'Beli Pasca Ex-Date Setelah 3x ARB (Rp 2.500)',
      dividend: 0,
      sellPrice: 2850,
      action: 'Menampung barang saat ritel panik cut-loss.',
      netPnL: '+Rp 350 per lembar (+14.0% Technical Rebound)',
      color: 'var(--accent-green)'
    }
  };

  const curr = scenarios[buyTiming];

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '20px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-red)', margin: '0 0 4px 0' }}>
        🍯 SIMULATOR JEBAKAN DIVIDEN SIKLIKAL ($PTBA CASE STUDY)
      </h3>
      <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
        Pilih waktu pembelian Anda untuk melihat kalkulasi keuntungan riil vs kerugian modal setelah dividen dibagikan.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {Object.keys(scenarios).map(k => (
          <button
            key={k}
            onClick={() => setBuyTiming(k)}
            style={{
              padding: '8px 14px',
              borderRadius: '4px',
              background: buyTiming === k ? scenarios[k].color : 'rgba(255,255,255,0.05)',
              color: buyTiming === k ? (scenarios[k].color === 'var(--accent-green)' ? '#000' : '#fff') : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '800'
            }}
          >
            {scenarios[k].label.split(' (')[0]}
          </button>
        ))}
      </div>

      <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '16px', borderLeft: `4px solid ${curr.color}` }}>
        <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>{curr.label}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{curr.action}</div>
        <div style={{ fontSize: '16px', fontWeight: '900', color: curr.color }}>
          HASIL AKHIR: {curr.netPnL}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN VISUAL: FVG & LIQUIDITY SWEEP PLAYGROUND (LEVEL 5)
// ============================================================================
function FvgSweepPlayground() {
  const [fvgHeight, setFvgHeight] = useState(60);
  const [sweepState, setSweepState] = useState(0); // 0: Normal, 1: Retail Stop Loss Placed, 2: Sweep Wick, 3: Rebound

  const handleSweepPlay = () => {
    setSweepState(1);
    setTimeout(() => {
      setSweepState(2);
      setTimeout(() => {
        setSweepState(3);
      }, 1500);
    }, 1200);
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-purple)', margin: '0 0 4px 0' }}>
            🕯️ PLAYGROUND CANDLESTICK: CELAH FVG & SAPUAN PAUS (SWEEP)
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Uji interaktif tarikan magnet 50% Consequent Encroachment (C.E.) dan bagaimana paus melahap stop loss ritel.
          </p>
        </div>

        <button
          onClick={handleSweepPlay}
          style={{ padding: '7px 14px', background: 'var(--accent-purple)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '800' }}
        >
          {sweepState === 0 ? '▶ Putar Rekonstruksi Sapuan Paus' : sweepState === 3 ? '🔄 Ulangi Rekonstruksi' : '⏳ Mensimulasikan Sapuan...'}
        </button>
      </div>

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

      {/* SVG CANDLESTICK CANVAS */}
      <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '16px', position: 'relative' }}>
        <svg viewBox="0 0 500 180" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* SUPPORT LEVEL LINE */}
          <line x1="20" y1="120" x2="480" y2="120" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" strokeDasharray="4" />
          <text x="30" y="115" fill="var(--accent-cyan)" fontSize="9" fontWeight="800">SUPPORT LEVEL RITEL</text>

          {/* CANDLE 1 (BULLISH) */}
          <rect x="80" y="70" width="24" height="50" fill="var(--accent-green)" rx="2" />
          <line x1="92" y1="50" x2="92" y2="130" stroke="var(--accent-green)" strokeWidth="2" />

          {/* FVG ZONE BOX */}
          <rect x="120" y={120 - fvgHeight} width="120" height={fvgHeight} fill="rgba(168, 85, 247, 0.15)" stroke="var(--accent-purple)" strokeWidth="1" strokeDasharray="3" rx="2" />
          <line x1="120" y1={120 - (fvgHeight / 2)} x2="240" y2={120 - (fvgHeight / 2)} stroke="var(--accent-cyan)" strokeWidth="1.5" />
          <text x="180" y={116 - (fvgHeight / 2)} fill="var(--accent-cyan)" fontSize="8" fontWeight="800" textAnchor="middle">50% C.E. MAGNET</text>

          {/* CANDLE 2 (IMPULSE PAUS) */}
          <rect x="130" y={120 - fvgHeight - 20} width="30" height={fvgHeight + 20} fill="var(--accent-green)" rx="2" />
          <line x1="145" y1={120 - fvgHeight - 35} x2="145" y2="130" stroke="var(--accent-green)" strokeWidth="2" />

          {/* CANDLE 3 (RETRACE / SWEEP CANDLE) */}
          {sweepState === 0 && (
            <g>
              <rect x="280" y="70" width="24" height="40" fill="var(--accent-red)" rx="2" />
              <line x1="292" y1="60" x2="292" y2="115" stroke="var(--accent-red)" strokeWidth="2" />
            </g>
          )}

          {sweepState === 1 && (
            <g>
              <rect x="280" y="70" width="24" height="45" fill="var(--accent-red)" rx="2" />
              <line x1="292" y1="60" x2="292" y2="125" stroke="var(--accent-red)" strokeWidth="2" />
              {/* RETAIL STOP LOSS HIGHLIGHT */}
              <circle cx="292" cy="135" r="5" fill="var(--accent-red)" />
              <text x="305" y="138" fill="var(--accent-red)" fontSize="9" fontWeight="800">STOP LOSS RITEL TERSAPU!</text>
            </g>
          )}

          {(sweepState === 2 || sweepState === 3) && (
            <g>
              {/* HAMMER / PINBAR SWEEP CANDLE */}
              <rect x="280" y="60" width="24" height="25" fill="var(--accent-green)" rx="2" />
              <line x1="292" y1="50" x2="292" y2="155" stroke="var(--accent-green)" strokeWidth="2.5" />
              <circle cx="292" cy="155" r="4" fill="var(--accent-cyan)" />
              <text x="305" y="158" fill="var(--accent-cyan)" fontSize="9" fontWeight="800">SPRING SWEEP (PAUS MENAMPUNG)</text>

              {sweepState === 3 && (
                <g>
                  {/* EXPLOSIVE CANDLE 4 */}
                  <rect x="330" y="30" width="26" height="70" fill="var(--accent-green)" rx="2" />
                  <line x1="343" y1="20" x2="343" y2="110" stroke="var(--accent-green)" strokeWidth="2" />
                  <text x="343" y="15" fill="var(--accent-green)" fontSize="9" fontWeight="900" textAnchor="middle">TERBANG KE ATAS!</text>
                </g>
              )}
            </g>
          )}
        </svg>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
          {sweepState === 0 && 'Kondisi netral: Ritel menunggu di support.'}
          {sweepState === 1 && 'Tahap 1: Harga mendekati support, ritel pasang stop loss di bawahnya.'}
          {sweepState === 2 && 'Tahap 2: Jarum panjang menusuk ke bawah support melahap stop loss ritel.'}
          {sweepState === 3 && 'Tahap 3: Likuiditas terserap, candle ditutup hammer dan harga melesat terbang!'}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN VISUAL 7: BRACKET RISK-REWARD & EXECUTION TOOL (LEVEL 6)
// ============================================================================
function VisualExecutionBracket() {
  const [modal, setModal] = useState(100000000);
  const [riskPct, setRiskPct] = useState(1.5);
  const [entryPrice, setEntryPrice] = useState(3000);
  const [slPrice, setSlPrice] = useState(2850);
  const [tpPrice, setTpPrice] = useState(3375);

  const safeModal = Math.max(1000000, Number(modal) || 0);
  const safeRiskPct = Math.max(0.1, Number(riskPct) || 0);
  const safeEntry = Math.max(1, Number(entryPrice) || 0);
  const safeSL = Math.max(1, Number(slPrice) || 0);
  const safeTP = Math.max(1, Number(tpPrice) || 0);

  const riskPerShare = Math.max(1, Math.abs(safeEntry - safeSL));
  const rewardPerShare = Math.max(0, safeTP - safeEntry);
  const rrRatio = (rewardPerShare / riskPerShare).toFixed(2);

  const riskRupiah = (safeModal * safeRiskPct) / 100;
  const calculatedLots = Math.max(1, Math.floor(riskRupiah / (riskPerShare * 100)));
  const profitPotentialRupiah = calculatedLots * 100 * rewardPerShare;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-green)', margin: '0 0 4px 0' }}>
            🎯 VISUAL EXECUTION BRACKET: KALKULASI LOT & TARGET PROFIT
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Garis visual Entry, Stop Loss, dan Target Profit interaktif standar desk perdagangan hedge fund.
          </p>
        </div>
        <div style={{ fontSize: '16px', fontWeight: '900', color: Number(rrRatio) >= 2 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
          Rasio R:R: 1 : {rrRatio} {Number(rrRatio) >= 2 ? '✅ (Layak Eksekusi)' : '⚠️ (Rasio Risiko Terlalu Buruk)'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Profit (TP Rp)</label>
          <input
            type="number"
            value={tpPrice}
            onChange={(e) => setTpPrice(Number(e.target.value))}
            style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-green)', padding: '6px 10px', borderRadius: '4px', color: 'var(--accent-green)', fontWeight: '800' }}
          />
          {safeTP <= safeEntry && <div style={{ fontSize: '10px', color: 'var(--accent-red)', marginTop: '2px' }}>TP harus di atas Entry!</div>}
        </div>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Harga Beli (Entry Rp)</label>
          <input
            type="number"
            value={entryPrice}
            onChange={(e) => setEntryPrice(Number(e.target.value))}
            style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-cyan)', padding: '6px 10px', borderRadius: '4px', color: '#fff', fontWeight: '800' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Batas Cut-Loss (SL Rp)</label>
          <input
            type="number"
            value={slPrice}
            onChange={(e) => setSlPrice(Number(e.target.value))}
            style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-red)', padding: '6px 10px', borderRadius: '4px', color: 'var(--accent-red)', fontWeight: '800' }}
          />
          {safeSL >= safeEntry && <div style={{ fontSize: '10px', color: 'var(--accent-red)', marginTop: '2px' }}>SL harus di bawah Entry!</div>}
        </div>

        {/* Capital and risk were fixed constants driving the lot maths, with no
            way to set them; so the calculator could only ever answer for one
            hypothetical account. Both are now inputs. */}
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Modal (Rp)</label>
          <input
            type="number"
            value={modal}
            onChange={(e) => setModal(Number(e.target.value))}
            style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-hairline)', padding: '6px 10px', borderRadius: '4px', color: 'var(--text-primary)', fontWeight: '800' }}
          />
          {Number(modal) < 1000000 && <div style={{ fontSize: '10px', color: 'var(--accent-gold)', marginTop: '2px' }}>Minimum Rp 1.000.000</div>}
        </div>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Risiko per Trade (%)</label>
          <input
            type="number"
            step="0.1"
            value={riskPct}
            onChange={(e) => setRiskPct(Number(e.target.value))}
            style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-hairline)', padding: '6px 10px', borderRadius: '4px', color: 'var(--text-primary)', fontWeight: '800' }}
          />
          {Number(riskPct) > 5 && <div style={{ fontSize: '10px', color: 'var(--accent-red)', marginTop: '2px' }}>Di atas 5% per trade terlalu agresif</div>}
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Maksimal Boleh Dibeli</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-green)' }}>{calculatedLots.toLocaleString()} LOT</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Risiko Terkunci Jika SL Kena</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-red)' }}>-Rp {riskRupiah.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Potensi Cuan Jika TP Kena</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-green)' }}>+Rp {profitPotentialRupiah.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN VISUAL 8: PRE-FLIGHT SCORECARD 5 MENIT (LEVEL 6)
// ============================================================================
function PreflightScorecard() {
  const [checks, setChecks] = useState({
    c1: false,
    c2: false,
    c3: false,
    c4: false,
    c5: false
  });

  const toggleCheck = (k) => setChecks(prev => ({ ...prev, [k]: !prev[k] }));
  const score = Object.values(checks).filter(Boolean).length * 20;

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 4px 0' }}>
            🚀 PRE-FLIGHT LAUNCH SCORECARD: KESIAPAN SEBELUM MEMBELI
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Centang 5 protokol keselamatan sebelum menekan tombol beli di aplikasi sekuritas Anda.
          </p>
        </div>
        <div style={{ fontSize: '16px', fontWeight: '900', color: score === 100 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
          Kesiapan: {score}% {score === 100 ? '✅ GO FOR LAUNCH' : '⛔ FLIGHT ABORTED'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[
          { key: 'c1', label: '1. Arah Arus Makro Mendukung: Dolar DXY sedang melunak & arus asing net buy di IHSG.' },
          { key: 'c2', label: '2. Katalis Fundamental Sehat: Emiten memiliki arus kas operasional riil positif.' },
          { key: 'c3', label: '3. Titik Stop Loss Jelas: Level pembatalan skenario telah ditentukan sebelum entry.' },
          { key: 'c4', label: '4. Ukuran Lot Terukur: Lot dihitung berbasis risiko 1-2% modal (bukan all-in).' },
          { key: 'c5', label: '5. Rasio R:R Minimal 1:2: Potensi target profit minimal 2x lipat lebih besar dari risiko.' }
        ].map(item => (
          <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={checks[item.key]}
              onChange={() => toggleCheck(item.key)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-green)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '12px', color: checks[item.key] ? '#fff' : 'var(--text-secondary)', fontWeight: checks[item.key] ? '700' : '400' }}>
              {item.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN TAB EXPORT
// ============================================================================
export default function QuantAcademyTab() {
  const [activeLevelId, setActiveLevelId] = useState('lvl-1');
  const [activeModuleId, setActiveModuleId] = useState('mod-1-1');
  const [completedModules, setCompletedModules] = useState(['mod-1-1']);
  const [searchGlossary, setSearchGlossary] = useState('');
  const [selectedGlossaryCategory, setSelectedGlossaryCategory] = useState('Semua');

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

  const filteredGlossary = useMemo(() => {
    return GLOSSARY_DATA.filter(item => {
      const matchCat = selectedGlossaryCategory === 'Semua' || item.category === selectedGlossaryCategory;
      const matchSearch = item.term.toLowerCase().includes(searchGlossary.toLowerCase()) || item.def.toLowerCase().includes(searchGlossary.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [searchGlossary, selectedGlossaryCategory]);

  return (
    <div style={{ padding: '16px 20px', width: '100%', maxWidth: '1680px', margin: '0 auto', color: 'var(--text-primary)' }}>
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
                MBG QUANT ACADEMY // 6-LEVEL INTERACTIVE MASTERCLASS
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• Visual, Diagram Interaktif, & Simulasi Riil</span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.3px', color: '#fff' }}>
              Bagaimana Dunia Finansial Bekerja & Cara Bertahan di Pasar Modal
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '920px', lineHeight: '1.5' }}>
              Kurikulum bertahap 20 modul visual tanpa jargon membingungkan. Dilengkapi diagram alur hidup, simulator bendungan likuiditas, grafik rekonstruksi krisis sejarah, timbangan kas riil, ladder order book, dan instrumen manajemen risiko.
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
        <div className="quant-academy-main-grid">
          {/* LEFT SIDEBAR */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '16px',
            position: 'sticky',
            top: '16px',
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

          {/* RIGHT PANEL */}
          <div style={{ display: 'grid', gap: '16px', minWidth: 0 }}>
            {/* MODULE HEADER */}
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
                <span style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.5' }}>{activeModule.keyQuestion}</span>
              </div>
            </div>

            {/* MENTAL MODEL ANALOGY */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              borderLeft: '4px solid var(--accent-cyan)',
              padding: '16px 20px',
              borderRadius: '0 8px 8px 0'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                💡 ANALOGI KEHIDUPAN NYATA (MENTAL MODEL):
              </div>
              <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.65' }}>
                {activeModule.analogy}
              </div>
            </div>

            {/* EMBEDDED VISUAL SIMULATORS & INTERACTIVE CHARTS */}
            {activeLevel.id === 'lvl-1' && <SvgDamSimulator />}
            {activeLevel.id === 'lvl-2' && activeModule.id === 'mod-2-1' && <DominoStepper />}
            {activeLevel.id === 'lvl-2' && (activeModule.id === 'mod-2-2' || activeModule.id === 'mod-2-3') && <CrisisChartViewer />}
            {activeLevel.id === 'lvl-3' && (activeModule.id === 'mod-3-1' || activeModule.id === 'mod-3-2') && <BalanceScaleSimulator />}
            {activeLevel.id === 'lvl-3' && activeModule.id === 'mod-3-3' && <SupercycleSineWave />}
            {activeLevel.id === 'lvl-4' && (activeModule.id === 'mod-4-1' || activeModule.id === 'mod-4-2') && <OrderBookDepthLadder />}
            {activeLevel.id === 'lvl-4' && (activeModule.id === 'mod-4-3' || activeModule.id === 'mod-4-4') && <DividendTrapSandbox />}
            {activeLevel.id === 'lvl-5' && <FvgSweepPlayground />}
            {activeLevel.id === 'lvl-6' && (activeModule.id === 'mod-6-1' || activeModule.id === 'mod-6-2' || activeModule.id === 'mod-6-3') && <VisualExecutionBracket />}
            {activeLevel.id === 'lvl-6' && activeModule.id === 'mod-6-4' && <PreflightScorecard />}

            {/* MECHANISM */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '0 0 10px 0' }}>
                ⚙️ Bagaimana Mekanisme & Rantai Transmisi di Baliknya?
              </h3>
              <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.75', whiteSpace: 'pre-line' }}>
                {activeModule.mechanism}
              </div>
            </div>

            {/* TRAP VS PLAYBOOK */}
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

            {/* NAVIGATION PREV / NEXT */}
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
