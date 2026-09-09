import React, { useState, useEffect } from 'react';

const ACADEMY_LEVELS = [
  {
    id: 1,
    title: 'LEVEL 1: Fondasi Disiplin Modal & Kalkulator Lot Astra (Pemula)',
    badge: 'Discipline Shield 🛡️',
    lessons: [
      { id: '1.1', title: 'Pelajaran 1.1: Anatomi Boncos & Hukum 90/90/90 di Bursa', content: 'Fakta pahit di bursa: 90% trader pemula kehilangan 90% modal mereka dalam 90 hari pertama karena tidak memiliki sistem manajemen risiko tertulis. Emosi serakah dan takut (FOMO) adalah musuh nomor satu.' },
      { id: '1.2', title: 'Pelajaran 1.2: Mengapa Harus Membatasi Risiko Maksimal 2%?', content: 'Jika Anda merisikokan 10% per trade, 5 kali salah berturut-turut akan memangkas setengah modal Anda. Dengan risiko 2%, Anda butuh 35 kali salah berturut-turut untuk modal berkurang separuh. Manajemen modal menjamin Anda tetap hidup di bursa.' },
      { id: '1.3', title: 'Pelajaran 1.3: Rumus Hitung Lot Eksak & Fraksi Harga BEI', content: 'Rumus: Max Lots = floor((Modal x 2%) / ((Entry - Hard SL) x 100)). Pahami fraksi harga BEI: Rp 2 (<Rp 200), Rp 5 (Rp 200-500), Rp 10 (Rp 500-2.000), Rp 25 (Rp 2.000-5.000), Rp 50 (>Rp 5.000).' },
    ],
    quiz: [
      {
        question: 'Berapa persen batas maksimal risiko per transaksi yang diwajibkan Doktrin Astra?',
        options: ['10% modal', '5% modal', 'Maksimal 2% modal portofolio', '50% modal'],
        answer: 2,
        explanation: 'Aturan emas 2% memastikan modal Anda bertahan melewati rentetan kerugian pasar (drawdown).'
      },
      {
        question: 'Apa arti dari fenomena Hukum 90/90/90 di bursa saham?',
        options: ['90% untung dalam 90 hari', '90% trader pemula kehilangan 90% uangnya dalam 90 hari', '90 lot dengan 90% akurasi', 'Rata-rata saham naik 90% per tahun'],
        answer: 1,
        explanation: 'Ini adalah statistik global bahwa trader tanpa rencana tertulis dan tanpa cut loss selalu tereliminasi cepat.'
      },
      {
        question: 'Bagaimana cara menentukan jumlah lot yang benar saat membeli saham?',
        options: ['Menebak sesuai firasat', 'Membeli semaksimal mungkin (All In)', 'Membagi batas toleransi risiko uang rupiah dengan jarak harga Stop Loss', 'Mengikuti ajakan influencer'],
        answer: 2,
        explanation: 'Position sizing rasional dihitung dari toleransi risiko rupiah dibagi selisih (Entry - Stop Loss) dikali 100.'
      }
    ]
  },
  {
    id: 2,
    title: 'LEVEL 2: Membaca Arus Makroekonomi Global (Menengah)',
    badge: 'Macro Navigator 🧭',
    lessons: [
      { id: '2.1', title: 'Pelajaran 2.1: Monster Inflasi CPI & Suku Bunga The Fed', content: 'Saat inflasi CPI tinggi, The Fed menaikkan suku bunga untuk mendinginkan ekonomi. Suku bunga acuan yang tinggi meningkatkan biaya modal emiten dan menekan valuasi saham teknologi dan siklikal.' },
      { id: '2.2', title: 'Pelajaran 2.2: Hubungan Yield Obligasi US10Y & Dolar DXY', content: 'Ketika Yield US 10-Year Treasury melonjak dan Indeks Dolar (DXY) menguat, dana asing cenderung ditarik keluar dari emerging market (termasuk IHSG Indonesia) kembali ke instrumen berdenominasi Dolar.' },
      { id: '2.3', title: 'Pelajaran 2.3: Transmisi Harga Komoditas ke Emiten BEI', content: 'Kenaikan harga Emas dunia langsung meningkatkan laba emiten tambang seperti ANTM dan BRMS. Lonjakan Minyak Mentah Brent menguntungkan emiten energi migas seperti MEDC dan ENRG.' },
    ],
    quiz: [
      {
        question: 'Jika Indeks Dolar AS (DXY) melonjak drastis, apa dampak umum terhadap IHSG dan Rupiah?',
        options: ['Rupiah melemah dan potensi outflow dana asing dari IHSG', 'Rupiah menguat tajam', 'IHSG pasti langsung ARA 25%', 'Tidak ada dampak sama sekali'],
        answer: 0,
        explanation: 'Dolar yang terlalu perkasa menekan nilai tukar Rupiah dan memicu aksi jual bersih (net sell) investor asing di BEI.'
      },
      {
        question: 'Instrumen komoditas apa yang memiliki fungsi historis sebagai Safe Haven saat krisis geopolitik?',
        options: ['Minyak Goreng', 'Emas Murni (Gold / XAU)', 'Batu Bara', 'Nikel'],
        answer: 1,
        explanation: 'Emas dipandang sebagai aset penyimpan nilai paling aman dari risiko inflasi dan kekacauan geopolitik.'
      },
      {
        question: 'Apa dampak kenaikan agresif suku bunga The Fed terhadap valuasi saham?',
        options: ['Valuasi saham menjadi semakin murah dan tertekan', 'Semua saham pasti langsung naik', 'Suku bunga tidak mempengaruhi saham', 'Perusahaan bebas hutang'],
        answer: 0,
        explanation: 'Suku bunga tinggi menaikkan discount rate dalam model DCF sehingga nilai wajar saham terdiskon ke bawah.'
      }
    ]
  },
  {
    id: 3,
    title: 'LEVEL 3: Smart Money Concepts (SMC) & Liquidity (Mahir)',
    badge: 'Smart Money Seeker 👁️',
    lessons: [
      { id: '3.1', title: 'Pelajaran 3.1: Order Block (OB) Institusi vs Support Ritel', content: 'Order Block adalah candle terakhir sebelum terjadi dorongan harga impulsif besar (>2x ATR). Di zona inilah institusi memasang jutaan lot order beli yang menunggu dijemput kembali.' },
      { id: '3.2', title: 'Pelajaran 3.2: Fair Value Gap (FVG) sebagai Magnet Harga', content: 'FVG terjadi saat candle melesat kencang meninggalkan celah antara High candle ke-1 dan Low candle ke-3. Harga memiliki kecenderungan matematis untuk berbalik menutup celah ini sebelum melanjutkan tren.' },
      { id: '3.3', title: 'Pelajaran 3.3: Break of Structure (BOS) & Diskon 50%', content: 'BOS terjadi saat harga menembus level puncak tertinggi sebelumnya. Jangan mengejar harga saat sudah di area Premium (mahal). Tunggu retest ke zona Diskon (di bawah 50% rentang pergerakan).' },
    ],
    quiz: [
      {
        question: 'Apa ciri utama sebuah Bullish Order Block institusi?',
        options: ['Candle merah kecil tanpa volume', 'Candle bearish terakhir sebelum terjadi pergerakan impulsif naik yang kuat', 'Candle doji di tengah sideways', 'Sembarang support garis horizontal'],
        answer: 1,
        explanation: 'Bullish OB mewakili jejak footprint institusi sebelum mereka memicu lonjakan harga ke atas.'
      },
      {
        question: 'Mengapa area Fair Value Gap (FVG) sangat diperhatikan oleh trader quant?',
        options: ['Karena bertindak sebagai magnet ketidakseimbangan harga yang sering diuji ulang (retest)', 'Karena pasti langsung tembus ke langit', 'Karena garisnya terlihat keren di chart', 'Karena sinyal jual pasti'],
        answer: 0,
        explanation: 'FVG adalah celah likuiditas yang tidak efisien, di mana algoritma institusional cenderung melakukan rebalancing harga.'
      },
      {
        question: 'Di area mana sebaiknya kita memasang antrean beli menurut prinsip Smart Money?',
        options: ['Di zona Premium (harga mahal di atas rata-rata)', 'Di puncak tertinggi historis', 'Di zona Diskon (harga murah di bawah titik ekuilibrium 50%)', 'Kapan saja tanpa melihat harga'],
        answer: 2,
        explanation: 'Smart money selalu mengakumulasi barang di zona Diskon untuk mendapatkan Risk/Reward optimal.'
      }
    ]
  },
  {
    id: 4,
    title: 'LEVEL 4: Bandarmologi Modern & Foreign Flow (Kuantitatif)',
    badge: 'Bandar Detective 🕵️',
    lessons: [
      { id: '4.1', title: 'Pelajaran 4.1: Melacak Arus Asing Tanpa Kode Broker', content: 'Sejak BEI menutup kode broker saat jam bursa pada 2021, trader ritel tertinggal. Metode kuantitatif modern menggunakan Z-Score Foreign Net Flow dan volume spread untuk mendeteksi akumulasi senyap.' },
      { id: '4.2', title: 'Pelajaran 4.2: Komposit IIFS (OBV, MFI, VWAP, Chaikin A/D)', content: 'IIFS menggabungkan On-Balance Volume (30%), Money Flow Index (25%), Deviasi VWAP (25%), dan Chaikin A/D (20%). Skor Z > +1.0 mengonfirmasi uang besar sedang masuk.' },
      { id: '4.3', title: 'Pelajaran 4.3: Menghindari Jebakan Dividen (Dividend Trap)', content: 'Jangan tergiur yield dividen 15% jika harga saham anjlok 20% saat ex-date! Cek historis payout ratio, cadangan laba ditahan, dan apakah bandar sedang distribusi menjelang cum-date.' },
    ],
    quiz: [
      {
        question: 'Apa yang dimaksud dengan Dividend Trap?',
        options: ['Perusahaan membagikan bonus saham', 'Harga saham jatuh tajam pasca Cum-Date melebihi keuntungan dividen yang diterima', 'Saham yang tidak pernah membagikan dividen', 'Pajak dividen yang terlalu tinggi'],
        answer: 1,
        explanation: 'Banyak ritel terjebak membeli di puncak sebelum ex-date, lalu menderita capital loss lebih besar daripada dividennya.'
      },
      {
        question: 'Indikator apa yang mengukur apakah harga saham diperdagangkan di atas atau di bawah rata-rata tertimbang volume institusi?',
        options: ['RSI', 'VWAP (Volume-Weighted Average Price)', 'Stochastic', 'Bollinger Bands'],
        answer: 1,
        explanation: 'VWAP adalah benchmark harga acuan yang dipakai oleh manajer investasi institusional dalam mengeksekusi order besar.'
      },
      {
        question: 'Jika skor komposit IIFS berada di atas +2.0, apa klasifikasi aliran dananya?',
        options: ['HEAVY_DISTRIBUTION', 'NEUTRAL', 'MILD_DISTRIBUTION', 'HEAVY_ACCUMULATION'],
        answer: 3,
        explanation: 'Z-score di atas +2.0 adalah anomali statistik kuat yang mencerminkan akumulasi masif oleh institusi.'
      }
    ]
  }
];

const DICTIONARY_CATEGORIES = [
  'ALL',
  'Manajemen Risiko',
  'Mekanisme Bursa',
  'Price Action & SMC',
  'Bandarmologi & Flow',
  'Indikator & Analisis',
  'Makro & Kripto'
];

const GLOSSARY_TERMS = [
  // 1. MANAJEMEN RISIKO & MODAL
  {
    term: 'Risk / Reward Ratio (R:R)',
    category: 'Manajemen Risiko',
    desc: 'Perbandingan antara nominal rupiah yang siap Anda rugikan (risiko) terhadap target keuntungan (reward) yang ingin dicapai.',
    practical: 'Wajib minimal 1:2. Jika siap rugi Rp 100.000 (SL), target profit (TP) minimal Rp 200.000. Jangan masuk jika potensi cuan lebih kecil dari risiko.'
  },
  {
    term: 'Hard Stop Loss (SL)',
    category: 'Manajemen Risiko',
    desc: 'Batas harga mutlak di mana posisi wajib segera di-cut loss untuk mengamankan sisa modal agar tidak tergerus lebih dalam.',
    practical: 'Tentukan harga SL sebelum klik tombol beli. Pasang automatic order di sekuritas agar emosi tidak menahan Anda membiarkan kerugian membesar.'
  },
  {
    term: 'Aturan Risiko Maksimal 2% (2% Rule)',
    category: 'Manajemen Risiko',
    desc: 'Prinsip ketat di mana kerugian dalam 1 kali transaksi tidak boleh melebihi 2% dari total modal portofolio Anda.',
    practical: 'Modal Rp 10.000.000 -> batas rugi per transaksi maksimal Rp 200.000. Ini menjamin Anda tetap hidup di bursa walau salah 10x berturut-turut.'
  },
  {
    term: 'Position Sizing (Kalkulator Lot)',
    category: 'Manajemen Risiko',
    desc: 'Metode menghitung jumlah lot yang dibeli secara presisi berdasarkan jarak titik beli ke Stop Loss, bukan membeli asal-asalan (All-In).',
    practical: 'Rumus: Max Lot = (Modal x 2%) / ((Harga Entry - Harga SL) x 100). Makin jauh jarak SL, makin sedikit lot yang boleh dibeli.'
  },
  {
    term: 'Trailing Stop',
    category: 'Manajemen Risiko',
    desc: 'Batas stop loss dinamis yang digeser naik mengikuti kenaikan harga saham untuk mengunci keuntungan yang sudah berjalan (floating profit).',
    practical: 'Jika saham sudah naik +10%, geser SL ke atas titik modal (Break Even) atau di bawah swing low terbaru untuk mengamankan cuan jika harga berbalik.'
  },
  {
    term: 'Drawdown (DD)',
    category: 'Manajemen Risiko',
    desc: 'Persentase penurunan saldo modal dari titik tertinggi (peak) ke titik terendah (trough) dalam suatu rentang waktu trading.',
    practical: 'Jaga drawdown di bawah 15%. Kerugian modal 50% membutuhkan kenaikan 100% hanya untuk kembali ke titik impas (balik modal).'
  },
  {
    term: 'Cut Loss vs Averaging Down',
    category: 'Manajemen Risiko',
    desc: 'Cut Loss adalah disiplin memotong kerugian. Averaging Down adalah membeli lagi saham saat harganya sedang turun terus.',
    practical: 'Pemula DILARANG averaging down pada saham tren turun (downtrend). Ini adalah jebakan psikologis yang sering mengunci modal hingga nyangkut parah.'
  },

  // 2. MEKANISME BURSA & FRAKSI BEI
  {
    term: 'Lot Saham',
    category: 'Mekanisme Bursa',
    desc: 'Satuan resmi perdagangan saham di Bursa Efek Indonesia (BEI). 1 Lot setara dengan 100 lembar saham.',
    practical: 'Beli saham harga Rp 2.000 sebanyak 5 lot = 5 x 100 x Rp 2.000 = Rp 1.000.000 (tambahkan estimasi fee sekuritas ~0.15%).'
  },
  {
    term: 'Fraksi Harga BEI (Tick Size)',
    category: 'Mekanisme Bursa',
    desc: 'Kelipatan resmi kenaikan/penurunan harga saham di BEI sesuai rentang kelompok harga.',
    practical: '<Rp 200 (kelipatan Rp 1); Rp 200-500 (Rp 2); Rp 500-2.000 (Rp 5); Rp 2.000-5.000 (Rp 10); >Rp 5.000 (Rp 25). Antrean order wajib sesuai fraksi.'
  },
  {
    term: 'ARA (Auto Rejection Atas)',
    category: 'Mekanisme Bursa',
    desc: 'Batas persentase kenaikan harga maksimal harian saham di BEI (20% hingga 35% tergantung fraksi harga).',
    practical: 'Saat saham menyentuh ARA, antrean offer kosong. Hindari FOMO membeli di pucuk ARA karena rawan aksi ambil untung (profit taking) keesokan harinya.'
  },
  {
    term: 'ARB (Auto Rejection Bawah)',
    category: 'Mekanisme Bursa',
    desc: 'Batas persentase penurunan harga terdalam harian saham di BEI (simetris dengan batas persentase ARA).',
    practical: 'Saat saham terkunci ARB, antrean bid kosong sehingga saham sulit dijual seketika. Selalu disiplin pasang Hard SL sebelum harga mendekati ARB.'
  },
  {
    term: 'Bid & Offer (Order Book)',
    category: 'Mekanisme Bursa',
    desc: 'Bid (kiri) adalah antrean calon pembeli (ingin semurah mungkin); Offer/Ask (kanan) adalah antrean penjual (ingin semahal mungkin).',
    practical: 'Harga saham baru bergerak naik jika ada pembeli yang HAKA antrean Offer, dan turun jika ada penjual yang HAKI antrean Bid.'
  },
  {
    term: 'HAKA (Hajar Kanan)',
    category: 'Mekanisme Bursa',
    desc: 'Tindakan membeli saham langsung pada harga Offer terbaik saat itu agar transaksi langsung Match tanpa mengantre.',
    practical: 'Gunakan HAKA saat momentum breakout sangat kuat dan Anda butuh masuk cepat, namun sadari bahwa harga beli Anda sedikit lebih tinggi.'
  },
  {
    term: 'HAKI (Hajar Kiri)',
    category: 'Mekanisme Bursa',
    desc: 'Tindakan menjual saham langsung pada harga Bid terbaik saat itu agar posisi saham langsung laku terjual saat itu juga.',
    practical: 'Wajib dilakukan saat Cut Loss darurat ketika struktur harga jebol dan Anda butuh melikuidasi posisi secepat kilat untuk proteksi modal.'
  },
  {
    term: 'Cum Date & Ex Date',
    category: 'Mekanisme Bursa',
    desc: 'Cum Date adalah hari terakhir membeli saham agar berhak atas dividen. Ex Date adalah hari berikutnya di mana pembeli TIDAK lagi berhak dapat dividen.',
    practical: 'Saham yang dipegang saat penutupan Cum Date berhak dapat dividen, namun bersiaplah harga saham biasanya dibuka gap down pada pagi Ex-Date.'
  },
  {
    term: 'Dividend Trap',
    category: 'Mekanisme Bursa',
    desc: 'Jebakan di mana harga saham anjlok jauh lebih dalam daripada persentase nominal dividen yang dibagikan pasca Ex-Date.',
    practical: 'Sering menimpa pemula yang beli saham komoditas siklikal tepat sebelum Cum-Date demi dividen 8-10%, namun menderita penurunan modal 15-20% saat Ex-Date.'
  },
  {
    term: 'Tiering Saham (Blue Chip, 2nd Liner, Gorengan)',
    category: 'Mekanisme Bursa',
    desc: 'Klasifikasi saham: Blue Chip (kapitalisasi besar >Rp 50T, likuid & aman); 2nd liner (mid-cap bertumbuh); 3rd liner / gorengan (kapitalisasi kecil & sangat volatil).',
    practical: 'Pemula disarankan 70-80% modal di saham Blue Chip (LQ45). Batasi atau hindari saham lapis 3 yang mudah dimanipulasi pergerakannya oleh bandar.'
  },
  {
    term: 'UMA & Suspensi Bursa',
    category: 'Mekanisme Bursa',
    desc: 'UMA (Unusual Market Activity) adalah radar waspada BEI atas pergerakan tak wajar; Suspensi adalah tindakan bursa mengunci perdagangan saham sementara waktu.',
    practical: 'Jika saham berstatus UMA, batasi alokasi modal. Jika saham digembok (suspensi), modal Anda terkunci tidak bisa diperjualbelikan sampai dibuka kembali.'
  },

  // 3. PRICE ACTION & SMART MONEY CONCEPTS (SMC)
  {
    term: 'Support & Resistance (S/R)',
    category: 'Price Action & SMC',
    desc: 'Support adalah lantai harga di mana minat beli menahan penurunan; Resistance adalah plafon harga di mana tekanan jual menahan kenaikan.',
    practical: 'Beli di area support yang teruji pantul dengan SL ketat. Jual sebagian atau bersiap exit saat harga mendekati plafon resistance.'
  },
  {
    term: 'Order Block (OB)',
    category: 'Price Action & SMC',
    desc: 'Candle berlawanan arah terakhir sebelum terjadi dorongan harga impulsif besar (>2x ATR) oleh modal institusi (Smart Money).',
    practical: 'Bullish OB = candle merah terakhir sebelum harga meroket naik. Pasang antrean beli saat harga turun kembali (retest) ke kotak area OB tersebut.'
  },
  {
    term: 'Fair Value Gap (FVG)',
    category: 'Price Action & SMC',
    desc: 'Celah ketidakseimbangan harga antara titik tertinggi Candle 1 dan titik terendah Candle 3 akibat dorongan agresif satu arah.',
    practical: 'FVG bertindak seperti magnet harga. Peluang entry terbaik adalah menunggu harga retrace masuk kembali ke dalam celah FVG sebelum bergerak searah tren.'
  },
  {
    term: 'Break of Structure (BOS)',
    category: 'Price Action & SMC',
    desc: 'Kondisi di mana harga berhasil menembus puncak sebelumnya (Higher High) pada tren naik, menandakan kelanjutan tren.',
    practical: 'Jangan beli tepat di pucuk saat BOS baru pecah. Tunggu harga pullback ke area diskon (di bawah 50% rentang pergerakan) untuk risiko lebih rendah.'
  },
  {
    term: 'Change of Character (CHoCH)',
    category: 'Price Action & SMC',
    desc: 'Tanda awal perubahan struktur pasar dari tren turun menjadi tren naik (atau sebaliknya) saat swing point kunci ditembus.',
    practical: 'Sinyal peringatan awal bahwa tren lama telah melemah dan bersiap untuk berganti arah. Waspadai pembalikan arah tren.'
  },
  {
    term: 'Liquidity Sweep (Stop Hunt)',
    category: 'Price Action & SMC',
    desc: 'Manuver harga sengaja didorong menembus support/resisten sesaat untuk memicu order cut loss ritel, lalu ditarik kencang ke arah berlawanan.',
    practical: 'Ciri khasnya adalah candle meninggalkan ekor panjang (rejection wick) dengan volume besar pasca menembus support kunci.'
  },

  // 4. BANDARMOLOGI & FLOW
  {
    term: 'Net Foreign Flow (NFF)',
    category: 'Bandarmologi & Flow',
    desc: 'Selisih nilai beli bersih dikurangi jual bersih oleh seluruh investor asing di bursa saham BEI.',
    practical: 'Investor asing adalah motor utama saham penggerak indeks (BBCA, BBRI, BMRI, TLKM). Akumulasi asing berhari-hari pertanda tren naik sehat.'
  },
  {
    term: 'Fase Akumulasi & Distribusi',
    category: 'Bandarmologi & Flow',
    desc: 'Akumulasi = bandar/institusi mengumpulkan saham diam-diam di harga murah; Distribusi = bandar menjual saham ke ritel di harga mahal.',
    practical: 'Ciri akumulasi: harga sideways tapi volume membesar atau foreign net buy stabil. Ciri distribusi: berita sangat positif di media namun harga gagal naik.'
  },
  {
    term: 'VWAP (Volume-Weighted Average Price)',
    category: 'Bandarmologi & Flow',
    desc: 'Harga rata-rata transaksi saham yang dihitung dengan memperhitungkan volume pada setiap tingkat harga.',
    practical: 'Harga di atas VWAP menandakan pembeli memegang kendali (Bullish Intraday). Jangan membeli saham untuk day trading jika harganya jauh di bawah VWAP.'
  },
  {
    term: 'Fake Bid & Fake Offer (Spoofing)',
    category: 'Bandarmologi & Flow',
    desc: 'Trik memajang puluhan ribu lot antrean bid/offer semu di order book untuk memanipulasi psikologi trader ritel.',
    practical: 'Bid tebal palsu sering dipasang di bawah agar terkesan ada penahan kuat, padahal begitu harga mendekat, antrean tersebut langsung dicabut (withdraw).'
  },
  {
    term: 'IIFS (Institutional Inflow Flow Score)',
    category: 'Bandarmologi & Flow',
    desc: 'Skor kuantitatif gabungan indikator volume (OBV 30%, MFI 25%, deviasi VWAP 25%, Chaikin A/D 20%) untuk melacak pergerakan uang besar.',
    practical: 'Skor Z > +1.5 menandakan akumulasi institusi agresif. Skor Z < -1.5 menandakan distribusi masif di mana Anda wajib waspada exit.'
  },

  // 5. INDIKATOR TEKNIS & ANALISIS
  {
    term: 'Moving Average (MA20 & MA50)',
    category: 'Indikator & Analisis',
    desc: 'Garis rata-rata harga penutupan selama 20 hari (tren pendek) dan 50 hari (tren menengah) untuk menyaring arah tren pasar.',
    practical: 'Kondisi bullish ideal jika Harga > MA20 > MA50 (Golden Alignment). Hindari membeli saham jika posisinya berada di bawah MA50 yang menukik turun.'
  },
  {
    term: 'RSI (Relative Strength Index)',
    category: 'Indikator & Analisis',
    desc: 'Indikator momentum pada skala 0 hingga 100 untuk mendeteksi tingkat kejenuhan beli (Overbought) atau jenuh jual (Oversold).',
    practical: 'RSI > 70 = Overbought (rawan koreksi); RSI < 30 = Oversold (potensi rebound). Setup breakout terbaik terjadi saat RSI bergerak di zona 50-65.'
  },
  {
    term: 'Volume Spike',
    category: 'Indikator & Analisis',
    desc: 'Lonjakan volume perdagangan yang melompat jauh di atas rata-rata normal (misalnya >2x rata-rata 20 hari).',
    practical: 'Breakout resisten WAJIB divalidasi oleh volume spike. Kenaikan harga tanpa volume adalah perangkap bull trap.'
  },

  // 6. MAKROEKONOMI & KRIPTO
  {
    term: 'DXY (US Dollar Index)',
    category: 'Makro & Kripto',
    desc: 'Indeks kekuatan mata uang Dolar AS terhadap mata uang utama dunia (Euro, Yen, Poundsterling, dll).',
    practical: 'Jika DXY melonjak tajam, nilai tukar Rupiah tertekan dan dana asing cenderung keluar (outflow) dari pasar saham Indonesia (IHSG).'
  },
  {
    term: 'Yield Obligasi US10Y (US 10-Year Treasury)',
    category: 'Makro & Kripto',
    desc: 'Imbal hasil surat utang pemerintah AS tenor 10 tahun yang menjadi patokan suku bunga bebas risiko dunia.',
    practical: 'Kenaikan imbal hasil US10Y menaikkan biaya modal global dan menekan valuasi saham teknologi serta saham yang berutang tinggi.'
  },
  {
    term: 'Crypto Spot USDT (No Leverage)',
    category: 'Makro & Kripto',
    desc: 'Pembelian aset kripto murni 1:1 tanpa menggunakan hutang/margin/leverage sehingga bebas biaya inap dan nol risiko likuidasi.',
    practical: 'Gunakan Spot untuk investasi atau swing kripto. Saat terjadi crash mendadak (flash dump), koin Anda tetap utuh tanpa risiko modal musnah.'
  }
];

export default function QuantAcademyTab() {
  const [activeTab, setActiveTab] = useState('academy');
  const [activeLevel, setActiveLevel] = useState(1);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_academy_progress');
      return saved ? JSON.parse(saved) : { completedLessons: [], completedLevels: [] };
    } catch {
      return { completedLessons: [], completedLevels: [] };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mbg_academy_progress', JSON.stringify(progress));
    } catch {}
  }, [progress]);

  const handleLessonComplete = (lessonId) => {
    if (!progress.completedLessons.includes(lessonId)) {
      setProgress(prev => ({
        ...prev,
        completedLessons: [...prev.completedLessons, lessonId]
      }));
    }
  };

  const handleOptionSelect = (qIdx, optIdx) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleQuizSubmit = (level) => {
    setQuizSubmitted(true);
    const allCorrect = level.quiz.every((q, idx) => quizAnswers[idx] === q.answer);
    if (allCorrect) {
      if (!progress.completedLevels.includes(level.id)) {
        setProgress(prev => ({
          ...prev,
          completedLevels: [...prev.completedLevels, level.id]
        }));
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset seluruh progres belajar dan sertifikat?')) {
      setProgress({ completedLessons: [], completedLevels: [] });
      setQuizAnswers({});
      setQuizSubmitted(false);
      setActiveQuiz(null);
    }
  };

  const totalLessons = ACADEMY_LEVELS.reduce((acc, l) => acc + l.lessons.length, 0);
  const percentComplete = Math.round((progress.completedLevels.length / 4) * 100);
  const earnedBadges = ACADEMY_LEVELS.filter(l => progress.completedLevels.includes(l.id)).map(l => l.badge);

  const filteredGlossary = GLOSSARY_TERMS.filter(g => {
    const termLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      g.term.toLowerCase().includes(termLower) ||
      g.desc.toLowerCase().includes(termLower) ||
      (g.practical && g.practical.toLowerCase().includes(termLower)) ||
      (g.category && g.category.toLowerCase().includes(termLower));
    
    if (!matchesSearch) return false;
    if (activeCategory === 'ALL') return true;
    return g.category === activeCategory;
  });

  return (
    <div style={{ background: 'var(--bg-panel)', border: 'var(--border-hairline)', padding: '16px', fontFamily: 'var(--font-mono)' }}>
      
      {/* 1. Academy HUD Header */}
      <div style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.06em' }}>
              🎓 MBG QUANT ACADEMY // ASTRA DISCIPLINARY TRAINING
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              KURIKULUM TRADING KUANTITATIF BERJENJANG · MANAJEMEN MODAL · SMART MONEY · BANDARMOLOGI
            </div>
          </div>
          <button
            onClick={handleReset}
            className="telemetry-btn"
            style={{ fontSize: '10px', padding: '3px 8px', color: 'var(--accent-rust)' }}
          >
            🔄 Reset Progres
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Progres Kelulusan Akademi:</span>
            <span style={{ fontWeight: '800', color: percentComplete === 100 ? 'var(--accent-green)' : 'var(--accent-blue)' }}>
              {percentComplete}% SELESAI ({progress.completedLevels.length} / 4 LEVEL LULUS)
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#2a2b30' }}>
            <div style={{ width: `${percentComplete}%`, height: '100%', background: percentComplete === 100 ? 'var(--accent-green)' : '#0066cc', transition: 'width 0.4s ease' }}></div>
          </div>
        </div>

        {/* Badges Earned */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '10px' }}>
          <span style={{ fontWeight: '700', color: 'var(--accent-orange)' }}>BADGE DIRAIH:</span>
          {earnedBadges.length > 0 ? (
            earnedBadges.map((b, i) => (
              <span key={i} className="badge badge-bull" style={{ fontSize: '9px' }}>{b}</span>
            ))
          ) : (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Selesaikan kuis level untuk meraih badge pertama.</span>
          )}
        </div>
      </div>

      {/* 2. Sub Navigation */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', borderBottom: 'var(--border-hairline)', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('academy')}
          className={'telemetry-btn ' + (activeTab === 'academy' ? 'active' : '')}
          style={{ fontSize: '11px', padding: '5px 12px', fontWeight: '700' }}
        >
          📚 Kurikulum Pelatihan (4 Level)
        </button>
        <button
          onClick={() => setActiveTab('dictionary')}
          className={'telemetry-btn ' + (activeTab === 'dictionary' ? 'active' : '')}
          style={{ fontSize: '11px', padding: '5px 12px', fontWeight: '700' }}
        >
          📖 Quick Dictionary ({GLOSSARY_TERMS.length})
        </button>
        {progress.completedLevels.length === 4 && (
          <button
            onClick={() => setActiveTab('certificate')}
            className={'telemetry-btn ' + (activeTab === 'certificate' ? 'active' : '')}
            style={{ fontSize: '11px', padding: '5px 12px', fontWeight: '700', color: 'var(--accent-gold)' }}
          >
            🏆 Sertifikat Digital Kelulusan
          </button>
        )}
      </div>

      {/* TAB 1: ACADEMY CURRICULUM */}
      {activeTab === 'academy' && (
        <div>
          {/* Level Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {ACADEMY_LEVELS.map(l => {
              const isPassed = progress.completedLevels.includes(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => { setActiveLevel(l.id); setActiveQuiz(null); setQuizSubmitted(false); setQuizAnswers({}); }}
                  className={'telemetry-btn ' + (activeLevel === l.id ? 'active' : '')}
                  style={{ fontSize: '10px', padding: '4px 10px', fontWeight: '700' }}
                >
                  Level {l.id} {isPassed ? '✓' : ''}
                </button>
              );
            })}
          </div>

          {/* Active Level Content */}
          {ACADEMY_LEVELS.filter(l => l.id === activeLevel).map(level => {
            const isLevelPassed = progress.completedLevels.includes(level.id);
            return (
              <div key={level.id} style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)' }}>{level.title}</div>
                    <div style={{ fontSize: '10px', color: 'var(--accent-blue)' }}>Penghargaan: {level.badge}</div>
                  </div>
                  {isLevelPassed && <span className="badge badge-bull">✓ LEVEL LULUS</span>}
                </div>

                {!activeQuiz ? (
                  <>
                    {/* Lessons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      {level.lessons.map(lesson => {
                        const isRead = progress.completedLessons.includes(lesson.id);
                        return (
                          <div key={lesson.id} style={{ background: 'var(--bg-panel)', border: 'var(--border-muted)', padding: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <strong style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{lesson.title}</strong>
                              {isRead && <span style={{ color: 'var(--accent-green)', fontSize: '10px', fontWeight: '700' }}>✓ Dibaca</span>}
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '6px 0 10px 0' }}>
                              {lesson.content}
                            </p>
                            {!isRead && (
                              <button
                                onClick={() => handleLessonComplete(lesson.id)}
                                className="telemetry-btn"
                                style={{ fontSize: '10px', padding: '3px 8px' }}
                              >
                                Tandai Selesai Dibaca
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ textAlign: 'center', paddingTop: '10px', borderTop: 'var(--border-muted)' }}>
                      <button
                        onClick={() => { setActiveQuiz(level.id); setQuizSubmitted(false); setQuizAnswers({}); }}
                        className="telemetry-btn"
                        style={{ padding: '8px 20px', fontSize: '11px', fontWeight: '800', background: 'var(--accent-orange)', color: '#fff' }}
                      >
                        {isLevelPassed ? '🔄 Ulangi Kuis Ujian Level ' + level.id : '📝 Mulai Kuis Ujian Level ' + level.id}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Quiz Interface */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: 'var(--border-muted)', paddingBottom: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '12px', color: 'var(--accent-orange)' }}>
                        UJIAN PEMAHAMAN: LEVEL {level.id} (3 SOAL)
                      </span>
                      <button
                        onClick={() => setActiveQuiz(null)}
                        className="telemetry-btn"
                        style={{ fontSize: '10px', padding: '2px 6px' }}
                      >
                        ✕ Kembali ke Materi
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                      {level.quiz.map((q, qIdx) => {
                        const userAns = quizAnswers[qIdx];
                        const isCorrect = userAns === q.answer;
                        return (
                          <div key={qIdx} style={{ background: 'var(--bg-panel)', border: 'var(--border-muted)', padding: '12px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                              {qIdx + 1}. {q.question}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {q.options.map((opt, optIdx) => {
                                let optBg = 'var(--bg-panel-subtle)';
                                let optBorder = 'var(--border-muted)';
                                if (userAns === optIdx) {
                                  optBg = '#1c2438';
                                  optBorder = '1px solid #0066cc';
                                }
                                if (quizSubmitted) {
                                  if (optIdx === q.answer) {
                                    optBg = '#064e3b';
                                    optBorder = '1px solid var(--accent-green)';
                                  } else if (userAns === optIdx && !isCorrect) {
                                    optBg = '#881337';
                                    optBorder = '1px solid var(--accent-rust)';
                                  }
                                }
                                return (
                                  <div
                                    key={optIdx}
                                    onClick={() => handleOptionSelect(qIdx, optIdx)}
                                    style={{
                                      padding: '8px 10px',
                                      background: optBg,
                                      border: optBorder,
                                      fontSize: '11px',
                                      color: 'var(--text-primary)',
                                      cursor: quizSubmitted ? 'default' : 'pointer',
                                      transition: 'background 0.15s'
                                    }}
                                  >
                                    <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                                  </div>
                                );
                              })}
                            </div>
                            {quizSubmitted && (
                              <div style={{ marginTop: '8px', fontSize: '10px', color: isCorrect ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                                {isCorrect ? '✅ TEPAT!' : '❌ KURANG TEPAT.'} {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      {!quizSubmitted ? (
                        <button
                          onClick={() => handleQuizSubmit(level)}
                          disabled={Object.keys(quizAnswers).length < level.quiz.length}
                          className="telemetry-btn"
                          style={{ padding: '8px 24px', fontSize: '11px', fontWeight: '800', background: 'var(--accent-green)', color: '#fff' }}
                        >
                          Kirim Jawaban &amp; Cek Nilai
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                            className="telemetry-btn"
                            style={{ padding: '6px 14px', fontSize: '10px' }}
                          >
                            Coba Lagi
                          </button>
                          <button
                            onClick={() => setActiveQuiz(null)}
                            className="telemetry-btn"
                            style={{ padding: '6px 14px', fontSize: '10px', background: 'var(--accent-blue)', color: '#fff' }}
                          >
                            Selesai &amp; Lanjut Materi
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: QUICK DICTIONARY */}
      {activeTab === 'dictionary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Header & Filter Controls */}
          <div style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                  📖 KAMUS KILAT TRADING PEMULA // QUICK GLOSSARY & CHEATSHEET
                </span>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Daftar istilah esensial bursa saham BEI, Smart Money Concepts (SMC), Bandarmologi, dan Manajemen Modal dengan tips penerapan praktis.
                </div>
              </div>
              <span className="badge badge-blue" style={{ fontSize: '10px', padding: '3px 8px' }}>
                {filteredGlossary.length} dari {GLOSSARY_TERMS.length} Istilah Ditampilkan
              </span>
            </div>

            {/* Search Input */}
            <div>
              <input
                type="text"
                placeholder="🔍 Cari istilah, singkatan (SL, FVG, ARA, NFF, VWAP...), definisi, atau tips praktis..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-panel)',
                  border: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: '4px' }}>FILTER:</span>
              {DICTIONARY_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={'telemetry-btn ' + (activeCategory === cat ? 'active' : '')}
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                >
                  {cat === 'ALL' ? 'SEMUA KATEGORI' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Vertical Table Layout (Model Tabel Kebawah Rapi) */}
          <div style={{ overflowX: 'auto', border: 'var(--border-hairline)', background: 'var(--bg-panel-subtle)' }}>
            <table className="telemetry-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '38px', textAlign: 'center' }}>#</th>
                  <th style={{ width: '220px' }}>ISTILAH & KATEGORI</th>
                  <th style={{ width: '40%' }}>PENJELASAN KONSEP (PEMULA)</th>
                  <th style={{ width: '42%' }}>ATURAN / TIPS PRAKTIS DI PASAR</th>
                </tr>
              </thead>
              <tbody>
                {filteredGlossary.length > 0 ? (
                  filteredGlossary.map((item, idx) => (
                    <tr key={idx} style={{ verticalAlign: 'top' }}>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '700', padding: '10px 6px' }}>
                        {idx + 1}
                      </td>
                      <td style={{ whiteSpace: 'normal', padding: '10px 12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-blue)', marginBottom: '5px' }}>
                          {item.term}
                        </div>
                        <span className={`badge ${
                          item.category === 'Manajemen Risiko' ? 'badge-alert' :
                          item.category === 'Mekanisme Bursa' ? 'badge-blue' :
                          item.category === 'Price Action & SMC' ? 'badge-bull' :
                          item.category === 'Bandarmologi & Flow' ? 'badge-blue' :
                          item.category === 'Indikator & Analisis' ? 'badge-bull' : 'badge-alert'
                        }`} style={{ fontSize: '9px' }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'normal', fontSize: '11px', lineHeight: 1.5, color: 'var(--text-primary)', padding: '10px 12px' }}>
                        {item.desc}
                      </td>
                      <td style={{ whiteSpace: 'normal', fontSize: '10.5px', lineHeight: 1.5, color: 'var(--text-muted)', padding: '10px 12px' }}>
                        <span style={{ color: 'var(--accent-orange)', fontWeight: '700' }}>💡 Aturan Praktis: </span>
                        {item.practical}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px 14px', color: 'var(--text-muted)', fontSize: '11px' }}>
                      Tidak ada istilah yang cocok dengan pencarian "<strong>{searchTerm}</strong>". Coba kata kunci lain atau pilih tombol SEMUA KATEGORI.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 3: CERTIFICATE VIEW */}
      {activeTab === 'certificate' && progress.completedLevels.length === 4 && (
        <div style={{ background: 'var(--bg-panel-subtle)', border: '2px solid var(--accent-gold)', padding: '30px', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
          <div style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'var(--accent-gold)', fontWeight: '700', textTransform: 'uppercase' }}>
            SERTIFIKAT KELULUSAN DISIPLIN RESMI
          </div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-primary)', margin: '12px 0 6px 0', letterSpacing: '0.04em' }}>
            ASTRA-CERTIFIED DISCIPLINED QUANT TRADER
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
            Diberikan kepada trader yang telah menyelesaikan seluruh 4 tingkat kurikulum kuantitatif: Fondasi Disiplin Risiko 2%, Makroekonomi Global, Smart Money Concepts (SMC), dan Bandarmologi Modern IIFS dengan nilai sempurna.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: 'var(--border-muted)', paddingTop: '14px', fontSize: '10px' }}>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>TANGGAL KELULUSAN:</div>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{new Date().toLocaleDateString('id-ID')}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>OTORITAS SISTEM:</div>
              <div style={{ fontWeight: '700', color: 'var(--accent-orange)' }}>Astra Quant Intelligence Desk</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
