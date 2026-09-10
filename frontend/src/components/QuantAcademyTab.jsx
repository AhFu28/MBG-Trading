import React, { useState, useEffect } from 'react';

export const ACADEMY_LEVELS = [
  {
    id: 1,
    title: 'LEVEL 1: Fondasi Disiplin Modal & Kalkulator Lot Astra (Pemula)',
    badge: 'Discipline Shield 🛡️',
    summary: '90% trader boncos karena mengabaikan risiko. Pelajari rem darurat 2% dan cara menghitung lot eksak agar Anda tidak pernah terkena margin call.',
    lessons: [
      {
        id: '1.1',
        title: 'Pelajaran 1.1: Anatomi Boncos & Hukum 90/90/90 di Bursa',
        content: 'Fakta pahit bursa: 90% trader pemula kehilangan 90% modal mereka dalam 90 hari pertama karena tidak memiliki sistem manajemen risiko tertulis. Kerugian di pasar saham bekerja secara asimetris: jika modal Anda jatuh 50%, Anda butuh keuntungan 100% hanya untuk kembali impas (balik modal)! Cut loss bukan tanda kegagalan, melainkan sabuk pengaman penyelamat nyawa trading Anda.',
        figure: '/figures/03_drawdown_vs_recovery.png',
        figureCaption: 'Gambar 1: Kurva Hiperbolik Drawdown vs Recovery Return (Ralph Vince, 1990). Hindari zona merah (>30%).'
      },
      {
        id: '1.2',
        title: 'Pelajaran 1.2: Mengapa Wajib Membatasi Risiko Maksimal 2%?',
        content: 'Aturan 2% Doktrin Astra: dalam 1 kali transaksi, Anda maksimal hanya boleh merisikokan 2% dari total ekuitas akun Anda. Jika modal Anda Rp 10.000.000, maka risiko per trade maksimal Rp 200.000. Dengan aturan ini, Anda butuh 35 kali kalah berturut-turut untuk membuat modal terpangkas separuh. Ini memberi napas panjang untuk terus belajar tanpa takut bangkrut.',
        figure: null
      },
      {
        id: '1.3',
        title: 'Pelajaran 1.3: Rumus Hitung Lot Eksak & Fraksi Harga BEI',
        content: 'Banyak pemula membeli saham secara acak (All-In). Trader kuantitatif selalu menghitung lot secara diskret: Max Lots = floor((Modal x 2%) / ((Entry - Hard SL) x 100)). Jika hasil hitung adalah 26.8 lot, selalu bulatkan ke bawah menjadi 26 lot agar batas toleransi risiko tidak terlampaui. Selalu sesuaikan antrean dengan fraksi harga resmi BEI (Rp 1, Rp 2, Rp 5, Rp 10, Rp 25).',
        figure: '/figures/04_astra_5_step_flowchart.png',
        figureCaption: 'Gambar 2: Diagram Alur SOP 5 Langkah Eksekusi Astra Standard (Makro -> IIFS -> SMC -> Lot 2% -> Journal).'
      }
    ],
    quiz: [
      {
        question: 'Berapa persen batas maksimal risiko per transaksi yang diwajibkan Doktrin Astra?',
        options: ['10% modal', '5% modal', 'Maksimal 2% modal portofolio', '50% modal'],
        answer: 2,
        explanation: 'Aturan emas 2% memastikan modal Anda tetap bertahan melewati rentetan kerugian pasar (drawdown).'
      },
      {
        question: 'Jika modal Anda turun 50%, berapa persen keuntungan yang dibutuhkan untuk kembali impas (balik modal)?',
        options: ['50%', '75%', '100%', '150%'],
        answer: 2,
        explanation: 'Karena basis modal telah berkurang separuh, Anda butuh kenaikan 100% dari saldo baru hanya untuk kembali ke titik semula.'
      },
      {
        question: 'Bagaimana cara menentukan jumlah lot yang benar saat membeli saham?',
        options: ['Menebak sesuai firasat', 'Membeli semaksimal mungkin (All In)', 'Membagi batas toleransi rupiah 2% dengan jarak harga Stop Loss dikali 100', 'Mengikuti ajakan influencer'],
        answer: 2,
        explanation: 'Position sizing rasional dihitung dari toleransi risiko rupiah dibagi selisih (Entry - Stop Loss) dikali 100 lembar per lot.'
      }
    ]
  },
  {
    id: 2,
    title: 'LEVEL 2: Membaca Arus Makroekonomi & Komoditas Global (Menengah)',
    badge: 'Macro Navigator 🧭',
    summary: 'Pahami korelasi Indeks Dolar (DXY), imbal hasil US10Y, serta transmisi harga Emas dunia (XAU) dan Minyak Mentah ke saham BEI.',
    lessons: [
      {
        id: '2.1',
        title: 'Pelajaran 2.1: Monster Inflasi CPI & Suku Bunga The Fed',
        content: 'Saat inflasi Amerika Serikat (CPI) melonjak, bank sentral The Fed menaikkan suku bunga acuan Fed Funds Rate (FFR). Suku bunga tinggi menaikkan biaya pinjaman korporasi dan meningkatkan imbal hasil obligasi bebas risiko. Akibatnya, valuasi saham-saham bertumbuh (growth stock) dan teknologi tertekan karena investor menuntut diskonto laba masa depan yang lebih tinggi.',
        figure: null
      },
      {
        id: '2.2',
        title: 'Pelajaran 2.2: Hubungan Yield Obligasi US10Y & Indeks Dolar DXY',
        content: 'US 10-Year Treasury Yield dan Dolar AS (DXY) adalah magnet likuiditas terbesar di dunia. Ketika yield obligasi AS melonjak, investor global menarik modal mereka dari pasar berkembang (emerging markets seperti IHSG Indonesia) untuk kembali ke aset Dolar AS. Hal ini memicu depresiasi Rupiah (USD/IDR melemah) dan aksi jual bersih (net foreign outflow) di bursa Jakarta.',
        figure: '/figures/08_macro_commodity_transmission.png',
        figureCaption: 'Gambar 3: Peta Transmisi Makro Segitiga Emas: DXY, US10Y, Kurs IDR, dan Dampaknya ke Sektor BEI.'
      },
      {
        id: '2.3',
        title: 'Pelajaran 2.3: Transmisi Harga Komoditas Dunia & Paradoks Operating Leverage',
        content: 'Indonesia adalah surga emiten berbasis komoditas. Lonjakan harga emas dunia (XAU) dan minyak mentah (Brent) mentransmisikan keuntungan langsung ke emiten tambang. Namun waspadai paradoks Operating Leverage: emiten tambang murni dengan biaya produksi tetap (seperti BRMS) akan menikmati lonjakan margin laba jauh lebih spektakuler dibanding emiten trading/refining dengan margin tipis (seperti ANTM).',
        figure: '/figures/09_operating_leverage_gold_brms_vs_antm.png',
        figureCaption: 'Gambar 4: Infografis Paradoks Operating Leverage: Mengapa Saham BRMS Naik Lebih Eksplosif Dibanding ANTM saat Harga Emas Menguat.'
      }
    ],
    quiz: [
      {
        question: 'Jika Indeks Dolar AS (DXY) melonjak drastis, apa dampak umum terhadap IHSG dan Rupiah?',
        options: ['Rupiah melemah dan potensi outflow dana asing dari IHSG', 'Rupiah menguat tajam', 'IHSG pasti langsung ARA 25%', 'Tidak ada dampak sama sekali'],
        answer: 0,
        explanation: 'Dolar yang terlalu perkasa menekan nilai tukar Rupiah dan memicu aksi jual bersih (net foreign sell) investor asing di BEI.'
      },
      {
        question: 'Mengapa saham tambang dengan operating leverage tinggi melompat lebih kencang saat harga komoditas naik?',
        options: ['Karena biaya produksinya tetap, sehingga setiap kenaikan harga komoditas langsung menggelembungkan laba bersih', 'Karena bandar menyukai namanya', 'Karena bebas pajak penghasilan', 'Karena tidak punya utang'],
        answer: 0,
        explanation: 'Operating leverage membuat peningkatan pendapatan langsung berubah menjadi lonjakan persentase laba operasional yang eksponensial.'
      },
      {
        question: 'Instrumen komoditas apa yang memiliki fungsi historis sebagai Safe Haven saat krisis geopolitik memanas?',
        options: ['Minyak Sawit CPO', 'Emas Murni (Gold / XAU)', 'Batu Bara', 'Nikel'],
        answer: 1,
        explanation: 'Emas dipandang sebagai aset penyimpan nilai paling aman dari risiko inflasi dan kekacauan geopolitik.'
      }
    ]
  },
  {
    id: 3,
    title: 'LEVEL 3: Smart Money Concepts (SMC) & Liquidity (Mahir)',
    badge: 'Smart Money Seeker 👁️',
    summary: 'Bedah footprint transaksi institusi: Order Block (OB), Fair Value Gap (FVG), Break of Structure (BOS), dan perangkap Liquidity Sweep.',
    lessons: [
      {
        id: '3.1',
        title: 'Pelajaran 3.1: Anatomi Candlestick & Bullish Order Block (OB)',
        content: 'Order Block adalah candle berlawanan arah terakhir sebelum terjadi dorongan harga impulsif besar (>2x ATR). Di zona inilah institusi memasang jutaan lot order beli yang belum tuntas terserap. Jangan mengejar harga yang sedang melonjak. Tunggu harga pullback kembali menguji (retest) kotak zona Order Block untuk entry dengan rasio Risk/Reward maksimal.',
        figure: '/figures/01_candlestick_order_block.png',
        figureCaption: 'Gambar 5: Anatomi Candlestick & Pembentukan Bullish Order Block Institusi di Zona Demand.'
      },
      {
        id: '3.2',
        title: 'Pelajaran 3.2: Fair Value Gap (FVG) sebagai Celah Hampa & Magnet Harga',
        content: 'Fair Value Gap (FVG) adalah celah ketidakseimbangan harga antara titik tertinggi Candle ke-1 dan titik terendah Candle ke-3. Lonjakan agresif satu arah menciptakan ruang hampa likuiditas. Algoritma institusional cenderung melakukan rebalancing harga dengan menarik harga kembali menutup celah FVG (khususnya level 50% Consequent Encroachment) sebelum melanjutkan reli.',
        figure: '/figures/02_fair_value_gap_fvg.png',
        figureCaption: 'Gambar 6: Struktur Imbalance 3 Candlestick & Area Fair Value Gap (FVG) dengan Titik Ekuilibrium 50%.'
      },
      {
        id: '3.3',
        title: 'Pelajaran 3.3: Break of Structure (BOS) & Liquidity Sweep (Turtle Soup)',
        content: 'Pasar digerakkan oleh perburuan likuiditas stop loss. Seringkali harga sengaja didorong menembus titik tertinggi (swing high) sesaat untuk memancing ritel melakukan breakout buying dan memicu stop loss penjual, lalu harga dibanting kembali ke arah berlawanan meninggalkan ekor panjang (rejection wick). Pola ini disebut Turtle Soup atau Liquidity Sweep.',
        figure: '/figures/07_liquidity_sweep_turtle_soup.png',
        figureCaption: 'Gambar 7: Anatomi Perangkap Liquidity Sweep (Stop Hunt): Fake Breakout dan Sumbu Rejection Wick.'
      }
    ],
    quiz: [
      {
        question: 'Apa ciri utama sebuah Bullish Order Block institusi yang valid?',
        options: ['Candle merah kecil tanpa volume', 'Candle bearish terakhir sebelum dorongan impulsif naik yang kuat (>2x ATR)', 'Candle doji di tengah sideways', 'Sembarang garis support acak'],
        answer: 1,
        explanation: 'Bullish OB mewakili jejak footprint institusi sebelum mereka memicu lonjakan harga ke atas.'
      },
      {
        question: 'Mengapa area Fair Value Gap (FVG) sangat diperhatikan oleh trader quant?',
        options: ['Karena bertindak sebagai magnet ketidakseimbangan harga yang sering diuji ulang (retest)', 'Karena pasti langsung tembus tanpa koreksi', 'Karena garisnya terlihat keren di chart', 'Karena sinyal jual mutlak'],
        answer: 0,
        explanation: 'FVG adalah celah likuiditas tidak efisien, di mana algoritma institusional cenderung melakukan rebalancing harga.'
      },
      {
        question: 'Apa yang dimaksud dengan fenomena Liquidity Sweep (Stop Hunt)?',
        options: ['Pembersihan cache aplikasi', 'Harga sengaja menembus support/resisten sesaat untuk menyapu order Stop Loss lalu berbalik arah tajam', 'Bursa tutup lebih awal', 'Pembagian dividen saham'],
        answer: 1,
        explanation: 'Institusi memanfaatkan order Stop Loss ritel yang terpicu di luar swing level sebagai likuiditas untuk memenuhi order raksasa mereka.'
      }
    ]
  },
  {
    id: 4,
    title: 'LEVEL 4: Bandarmologi Modern & Foreign Flow (Kuantitatif)',
    badge: 'Bandar Detective 🕵️',
    summary: 'Deteksi akumulasi/distribusi senyap pasca penutupan kode broker BEI menggunakan Z-Score IIFS, mikrostruktur Order Book, dan radar Dividend Trap.',
    lessons: [
      {
        id: '4.1',
        title: 'Pelajaran 4.1: Melacak Uang Bandar Pasca Penutupan Kode Broker BEI',
        content: 'Sejak BEI menutup kode broker real-time pada 6 Desember 2021 dan kode domisili pada 27 Juni 2022, trader ritel tidak lagi bisa mengintip siapa yang sedang membeli. Metode kuantitatif modern menggantikan cara lama dengan melacak Z-Score Foreign Net Flow, Volume Spread Analysis, dan deteksi manipulasi antrean Fake Bid/Offer (Spoofing) pada order book.',
        figure: '/figures/10_orderbook_spoofing_anatomy.png',
        figureCaption: 'Gambar 8: Mikrostruktur Order Book BEI: Fake Bid Spoofing untuk Menjebak HAKA vs Penyerapan Riil (Real Absorption).'
      },
      {
        id: '4.2',
        title: 'Pelajaran 4.2: Komposit IIFS 4 Pilar (OBV, MFI, VWAP, Chaikin A/D)',
        content: 'IIFS (Institutional Inflow Flow Score) menggabungkan 4 indikator arus dana: On-Balance Volume (bobot 30%), Money Flow Index (25%), Deviasi VWAP (25%), dan Chaikin Accumulation/Distribution (20%). Skor distandarisasi menjadi Z-Score (-2.0 s/d +2.0). Skor Z > +1.5 mengonfirmasi akumulasi agresif institusi, sedangkan Z < -1.5 adalah alarm bahaya distribusi masif.',
        figure: null
      },
      {
        id: '4.3',
        title: 'Pelajaran 4.3: Anatomi 4 Fase Dividend Trap Saham Siklikal',
        content: 'Jangan tergiur dividen jumbo 15%-25%! Banyak pemula terjebak membeli saham batubara/komoditas pada Cum-Date demi dividen, namun menderita penurunan harga beruntun (ARB) pada Ex-Date yang menghapus seluruh nilai dividen dan modal pokok. Amati pola distribusi bandar 2-4 minggu sebelum pengumuman RUPS dividen.',
        figure: '/figures/05_dividend_trap_anatomy.png',
        figureCaption: 'Gambar 9: Anatomi 4 Fase Dividend Trap Saham Siklikal: Akumulasi, Euforia Ritel, Kaskade ARB Ex-Date, dan Depresi.'
      }
    ],
    quiz: [
      {
        question: 'Apa yang dimaksud dengan fenomena Dividend Trap di pasar saham?',
        options: ['Perusahaan membagikan bonus saham cuma-cuma', 'Harga saham jatuh tajam pasca Cum-Date melebihi keuntungan dividen yang diterima', 'Saham yang tidak pernah membagikan dividen', 'Pajak dividen yang terlalu tinggi'],
        answer: 1,
        explanation: 'Banyak ritel terjebak membeli di pucuk sebelum ex-date, lalu menderita capital loss lebih besar daripada dividen tunainya.'
      },
      {
        question: 'Indikator apa yang menjadi patokan harga modal rata-rata yang dibayar pemain besar institusi sepanjang hari?',
        options: ['RSI', 'VWAP (Volume-Weighted Average Price)', 'Stochastic', 'Bollinger Bands'],
        answer: 1,
        explanation: 'VWAP adalah benchmark harga acuan volume tertimbang yang dipakai manajer investasi institusional.'
      },
      {
        question: 'Jika skor komposit IIFS berada di atas angka +2.0, apa interpretasi aliran dananya?',
        options: ['HEAVY_DISTRIBUTION', 'NEUTRAL', 'MILD_DISTRIBUTION', 'HEAVY_ACCUMULATION'],
        answer: 3,
        explanation: 'Z-score di atas +2.0 adalah anomali statistik kuat yang mencerminkan akumulasi masif oleh pemain raksasa.'
      }
    ]
  },
  {
    id: 5,
    title: 'LEVEL 5: Kripto Spot Mastery & Siklus Pasar (Spesialis Kripto)',
    badge: 'Crypto Whale Tracker 🐋',
    summary: 'Kuasai navigasi aset kripto murni tanpa leverage: proteksi flash dump, siklus Halving 4 tahunan, dan piramida likuiditas Bitcoin Dominance (BTC.D).',
    lessons: [
      {
        id: '5.1',
        title: 'Pelajaran 5.1: Mengapa Wajib Kripto Spot USDT (Nol Leverage, Nol Likuidasi)',
        content: 'Pasar derivatif/futures kripto dipenuhi manipulasi likuidasi long/short akibat leverage 20x hingga 100x. Trader quant profesional MBG berfokus pada pasar Spot USDT 1:1 murni. Pada pasar Spot, aset koin Anda dimiliki secara penuh tanpa beban bunga menginap (funding rate) dan nol risiko modal musnah tersita paksa saat terjadi pergerakan ekstrem (flash dump).',
        figure: null
      },
      {
        id: '5.2',
        title: 'Pelajaran 5.2: Piramida Likuiditas (Capital Waterfall) & Siklus BTC.D',
        content: 'Aliran dana kripto bergerak mengikuti hukum air terjun likuiditas (The Capital Waterfall): Uang Fiat/Stablecoin pertama kali masuk memompa Bitcoin (BTC). Ketika Bitcoin Dominance (BTC.D) mencapai puncak jenuh dan mulai berbelok turun, modal berotasi mengalir ke Ethereum (ETH), lalu ke Large-Cap Altcoins (SOL, BNB), dan akhirnya memicu musim ledakan Altseason pada koin berkapitalisasi kecil.',
        figure: '/figures/06_crypto_liquidity_pyramid.png',
        figureCaption: 'Gambar 10: Piramida Aliran Likuiditas Kripto (Capital Waterfall) & Rotasi Bitcoin Dominance (BTC.D) ke Altseason.'
      },
      {
        id: '5.3',
        title: 'Pelajaran 5.3: Siklus 4 Tahunan Bitcoin Halving & Flash Liquidity Sweep',
        content: 'Pasokan Bitcoin baru yang dicetak oleh penambang dipotong separuh (Halving) setiap 210.000 blok (~4 tahun sekali). Kejutan pasokan ini secara historis selalu menjadi fondasi bull-run makro. Sebelum reli besar dimulai, bursa kripto sering mengalami Flash Liquidity Sweep (seperti sapuan level $60.000 pada 1 Mei 2024 yang melikuidasi $450M leverage) untuk membersihkan pasar dari spekulan rapuh.',
        figure: null
      }
    ],
    quiz: [
      {
        question: 'Mengapa trader quant disiplin memilih bertransaksi di pasar Kripto Spot USDT dibanding pasar Futures ber-leverage tinggi?',
        options: ['Karena koin dimiliki murni 1:1, bebas biaya bunga inap (funding rate), dan nol risiko likuidasi paksa modal musnah', 'Karena pasar Spot lebih cepat kaya', 'Karena pasar Futures dilarang undang-undang', 'Karena koin Spot tidak pernah turun nilainya'],
        answer: 0,
        explanation: 'Pasar Spot memberikan kepemilikan aset riil sehingga investor dapat tidur nyenyak tanpa khawatir terkena margin call saat flash dump.'
      },
      {
        question: 'Apa yang biasanya terjadi di pasar kripto saat Bitcoin Dominance (BTC.D) mulai patah tren turun dari puncaknya?',
        options: ['Seluruh pasar kripto langsung mati', 'Rotasi modal mengalir dari Bitcoin menuju Ethereum dan Altcoin besar, memicu Altseason', 'Harga USDT turun menjadi nol', 'Semua penambang Bitcoin bangkrut'],
        answer: 1,
        explanation: 'Penurunan BTC.D saat harga Bitcoin stabil merupakan indikator klasik bahwa likuiditas sedang berotasi ke altcoin (Altseason).'
      },
      {
        question: 'Berapa tahun sekali siklus Bitcoin Halving terjadi secara terprogram di protokol blockchain?',
        options: ['Setiap 1 tahun sekali', 'Setiap 2 tahun sekali', 'Setiap 4 tahun sekali (210.000 blok)', 'Setiap 10 tahun sekali'],
        answer: 2,
        explanation: 'Siklus Halving Bitcoin diprogram terjadi setiap 210.000 blok transaksi atau rata-rata 4 tahun sekali.'
      }
    ]
  }
];

export const DICTIONARY_CATEGORIES = [
  'ALL',
  'Manajemen Risiko',
  'Mekanisme Bursa',
  'Price Action & SMC',
  'Bandarmologi & Flow',
  'Model Quant & AI',
  'Indikator & Analisis',
  'Makro & Kripto'
];

export const GLOSSARY_TERMS = [
  {
    "id": 1,
    "term": "Risk/Reward Ratio (R:R)",
    "category": "Manajemen Risiko",
    "desc": "Perbandingan antara uang yang Anda relakan hilang (risiko) dengan target cuan yang ingin didapat. Wajib minimal 1:2 (jika siap rugi Rp 100 ribu, target profit minimal Rp 200 ribu).",
    "practical": "Wajib minimal 1:2. Jika siap rugi Rp 100.000 (SL), target profit (TP) minimal Rp 200.000. Jangan masuk jika potensi cuan lebih kecil dari risiko."
  },
  {
    "id": 2,
    "term": "Hard Stop Loss (SL)",
    "category": "Manajemen Risiko",
    "desc": "Rem darurat otomatis: batas harga saklek di mana saham Anda langsung dijual rugi agar modal tidak hangus terseret lebih dalam.",
    "practical": "Tentukan harga SL sebelum klik tombol beli. Pasang automatic order di sekuritas agar emosi tidak menahan Anda membiarkan kerugian membesar."
  },
  {
    "id": 3,
    "term": "Aturan Risiko 2% (2% Rule)",
    "category": "Manajemen Risiko",
    "desc": "Aturan pelindung nyawa: dalam 1 kali transaksi, Anda maksimal hanya boleh rugi 2% dari total uang di akun (Modal Rp 10 juta = batas rugi maksimal Rp 200 ribu).",
    "practical": "Modal Rp 10.000.000 -> batas rugi per transaksi maksimal Rp 200.000. Ini menjamin Anda tetap hidup di bursa walau salah 10x berturut-turut."
  },
  {
    "id": 4,
    "term": "Position Sizing / Kalkulator Lot",
    "category": "Manajemen Risiko",
    "desc": "Penentu porsi belanja yang aman: menghitung berapa lembar/lot saham yang boleh Anda beli agar jika terkena Stop Loss, ruginya pas 2% modal, tidak lebih.",
    "practical": "Rumus: Max Lot = floor((Modal x 2%) / ((Entry - SL) x 100)). Jika hasil hitung 26.8 lot, selalu bulatkan ke bawah menjadi 26 lot."
  },
  {
    "id": 5,
    "term": "Trailing Stop",
    "category": "Manajemen Risiko",
    "desc": "Gembok pengaman cuan: batas jual darurat yang digeser naik mengikuti kenaikan harga saham, sehingga jika harga tiba-tiba berbalik anjlok, keuntungan Anda sudah terkunci aman.",
    "practical": "Jika saham sudah naik +10%, geser SL ke atas titik modal (Break Even) atau di bawah swing low terbaru untuk mengamankan cuan jika harga berbalik."
  },
  {
    "id": 6,
    "term": "Break-Even Point (BEP)",
    "category": "Manajemen Risiko",
    "desc": "Titik balik modal (bebas risiko): memindahkan batas jual rugi tepat ke harga beli setelah separuh keuntungan diamankan, sehingga trade menjadi 100% bebas risiko rugi.",
    "practical": "Begitu target awal tercapai, pindahkan SL ke titik masuk. Posisi Anda kini bebas risiko kerugian modal sepeserpun."
  },
  {
    "id": 7,
    "term": "Drawdown (DD)",
    "category": "Manajemen Risiko",
    "desc": "Tingkat penurunan saldo akun dari titik modal tertinggi ke titik terendah. Penurunan modal 50% membutuhkan cuan 100% hanya untuk kembali impas.",
    "practical": "Jaga drawdown di bawah 15%. Kerugian modal 50% membutuhkan kenaikan 100% hanya untuk kembali ke titik impas (balik modal)."
  },
  {
    "id": 8,
    "term": "Cut Loss vs Averaging Down",
    "category": "Manajemen Risiko",
    "desc": "Cut Loss = buang racun dengan memotong kerugian kecil. Averaging Down = nekat beli lagi saham yang sedang jatuh bebas (jebakan maut yang sering membuat modal amblas).",
    "practical": "Pemula DILARANG averaging down pada saham tren turun. Ini adalah jebakan psikologis yang sering mengunci modal hingga nyangkut parah."
  },
  {
    "id": 9,
    "term": "3 Invalidation Rules",
    "category": "Manajemen Risiko",
    "desc": "3 Tanda Batal Rencana: Tiga alarm fakta di pasar (struktur jebol, bandar kabur, atau berita makro buruk) yang mewajibkan Anda membatalkan rencana beli seketika.",
    "practical": "Jika struktur jebol, bandar berbalik distribusi masif, atau ada berita makro buruk, batalkan rencana beli seketika."
  },
  {
    "id": 10,
    "term": "Awaiting Human Review",
    "category": "Manajemen Risiko",
    "desc": "Menunggu Izin Anda: Status sistem di mana bot MBG hanya menyajikan data dan kalkulasi, namun tombol eksekusi beli/jual tetap 100% di bawah kendali jari Anda.",
    "practical": "Bot MBG hanya memberi rekomendasi data statistik. Keputusan akhir eksekusi beli/jual 100% berada di bawah kendali jari Anda."
  },
  {
    "id": 11,
    "term": "Lot Saham",
    "category": "Mekanisme Bursa",
    "desc": "Satuan resmi belanja saham di bursa Indonesia (1 Lot = 100 lembar). Membeli 10 lot saham seharga Rp 1.000 artinya Anda butuh uang Rp 1.000.000.",
    "practical": "Beli saham harga Rp 2.000 sebanyak 5 lot = 5 x 100 x Rp 2.000 = Rp 1.000.000 (tambahkan estimasi fee sekuritas ~0.15%)."
  },
  {
    "id": 12,
    "term": "Fraksi Harga BEI (Tick Size)",
    "category": "Mekanisme Bursa",
    "desc": "Kelipatan resmi naik-turun harga saham di bursa. Saham di bawah Rp 200 naiknya per Rp 1, saham Rp 2.000-Rp 5.000 naiknya per Rp 10.",
    "practical": "<Rp 200 (kelipatan Rp 1); Rp 200-500 (Rp 2); Rp 500-2.000 (Rp 5); Rp 2.000-5.000 (Rp 10); >Rp 5.000 (Rp 25). Antrean order wajib sesuai fraksi."
  },
  {
    "id": 13,
    "term": "ARA (Auto Rejection Atas)",
    "category": "Mekanisme Bursa",
    "desc": "Plafon kenaikan harga maksimal harian di bursa. Ketika saham menyentuh ARA, penjual habis. Hindari FOMO membeli di pucuk ini karena rentan dibanting besoknya.",
    "practical": "Saat saham menyentuh ARA, antrean offer kosong. Hindari FOMO membeli di pucuk ARA karena rawan aksi ambil untung keesokan harinya."
  },
  {
    "id": 14,
    "term": "ARB Simetris (Bawah)",
    "category": "Mekanisme Bursa",
    "desc": "Lantai penurunan harga terdalam harian di bursa. Saat saham menyentuh ARB, pembeli menghilang dan antrean macet sehingga saham sulit dijual seketika.",
    "practical": "Saat saham terkunci ARB, antrean bid kosong sehingga saham sulit dijual seketika. Selalu disiplin pasang Hard SL sebelum harga mendekati ARB."
  },
  {
    "id": 15,
    "term": "Bid & Offer (Order Book)",
    "category": "Mekanisme Bursa",
    "desc": "Daftar antrean harga: Bid (kiri) adalah rombongan orang yang mau menawar murah; Offer (kanan) adalah rombongan orang yang mau jual mahal.",
    "practical": "Harga saham baru bergerak naik jika ada pembeli yang HAKA antrean Offer, dan turun jika ada penjual yang HAKI antrean Bid."
  },
  {
    "id": 16,
    "term": "HAKA (Hajar Kanan)",
    "category": "Mekanisme Bursa",
    "desc": "Beli instan tanpa antre di harga penjual (Offer). Saham langsung dapat di tangan, tapi Anda membayar di harga yang sedikit lebih mahal.",
    "practical": "Gunakan HAKA saat momentum breakout sangat kuat dan Anda butuh masuk cepat, namun sadari bahwa harga beli Anda sedikit lebih tinggi."
  },
  {
    "id": 17,
    "term": "HAKI (Hajar Kiri)",
    "category": "Mekanisme Bursa",
    "desc": "Jual instan tanpa antre ke penawar (Bid). Wajib dipakai saat darurat Cut Loss agar posisi langsung lepas dan uang selamat.",
    "practical": "Wajib dilakukan saat Cut Loss darurat ketika struktur harga jebol dan Anda butuh melikuidasi posisi secepat kilat untuk proteksi modal."
  },
  {
    "id": 18,
    "term": "Cum Date & Ex Date",
    "category": "Mekanisme Bursa",
    "desc": "Cum Date = hari terakhir Anda wajib pegang saham jika mau dapat dividen. Ex Date = hari esoknya di mana pembeli baru TIDAK lagi berhak dapat dividen.",
    "practical": "Saham yang dipegang saat penutupan Cum Date berhak dapat dividen, namun bersiaplah harga saham biasanya dibuka gap down pada pagi Ex-Date."
  },
  {
    "id": 19,
    "term": "Dividend Trap",
    "category": "Mekanisme Bursa",
    "desc": "Jebakan Batman dividen: dapat dividen 10%, tapi besoknya harga sahamnya terjun bebas 15%. Bukannya untung, modal malah rugi bersih.",
    "practical": "Sering menimpa pemula yang beli saham komoditas siklikal tepat sebelum Cum-Date demi dividen 8-10%, namun rugi modal 15-20% saat Ex-Date."
  },
  {
    "id": 20,
    "term": "Tiering Saham (Bluechip s/d Gorengan)",
    "category": "Mekanisme Bursa",
    "desc": "Kasta saham: Blue Chip (perusahaan raksasa mapan & aman), Lapis Dua (perusahaan berkembang), dan Saham Gorengan (perusahaan kecil sangat liar yang gampang disetir bandar).",
    "practical": "Pemula disarankan 70-80% modal di saham Blue Chip (LQ45). Batasi atau hindari saham lapis 3 yang mudah dimanipulasi pergerakannya oleh bandar."
  },
  {
    "id": 21,
    "term": "UMA (Unusual Market Activity)",
    "category": "Mekanisme Bursa",
    "desc": "Kartu kuning peringatan dari bursa karena harga saham bergerak liar tidak wajar. Waspada jangan taruh banyak modal karena rawan digembok bursa.",
    "practical": "Jika saham berstatus UMA, batasi alokasi modal. Waspada jangan taruh banyak modal karena rawan digembok suspensi bursa."
  },
  {
    "id": 22,
    "term": "Suspensi Bursa",
    "category": "Mekanisme Bursa",
    "desc": "Kartu merah gembok bursa: perdagangan saham dibekukan sementara. Jika digembok, uang Anda terkunci dan tidak bisa ditarik sama sekali sampai gembok dibuka.",
    "practical": "Jika saham digembok bursa (suspensi), uang modal Anda terkunci dan tidak bisa diperjualbelikan sampai otoritas bursa membukanya."
  },
  {
    "id": 23,
    "term": "Klaster Konglomerasi",
    "category": "Mekanisme Bursa",
    "desc": "Grup keluarga konglomerat besar. Saham-saham di bawah satu payung konglo biasanya bergerak serempak saat pemiliknya melakukan aksi bisnis besar.",
    "practical": "Saham dalam satu klaster konglomerat sering bergerak bersamaan. Pantau saham induknya sebagai indikator sentimen kelompok."
  },
  {
    "id": 24,
    "term": "Order Block (OB)",
    "category": "Price Action & SMC",
    "desc": "Sarang Uang Institusi: batang lilin terakhir sebelum terjadi ledakan harga besar. Di area inilah pemain raksasa meninggalkan antrean belanjaan yang belum tuntas.",
    "practical": "Bullish OB = candle merah terakhir sebelum harga meroket naik. Pasang antrean beli saat harga turun kembali (retest) ke kotak area OB tersebut."
  },
  {
    "id": 25,
    "term": "Bullish OB vs Bearish OB",
    "category": "Price Action & SMC",
    "desc": "Bullish OB = sarang beli raksasa (area aman untuk kita ikut belanja); Bearish OB = sarang jual raksasa (area siap-siap jualan untuk ambil untung).",
    "practical": "Beli di Bullish OB saat harga diskon; Waspadai Bearish OB sebagai area potensi pembalikan turun atau target take profit."
  },
  {
    "id": 26,
    "term": "Status OB (Fresh/Tested/Broken)",
    "category": "Price Action & SMC",
    "desc": "Kondisi sarang uang: Fresh (belum pernah disentuh = paling kuat memantul), Tested (sudah disentuh = kekuatannya berkurang), Broken (jebol = sarang batal).",
    "practical": "Prioritaskan Fresh OB untuk akurasi tertinggi. Hindari entry pada OB yang sudah dites 3x atau strukturnya sudah jebol (broken)."
  },
  {
    "id": 27,
    "term": "Fair Value Gap (FVG)",
    "category": "Price Action & SMC",
    "desc": "Celah Ruang Hampa: lompatan harga kilat yang menyisakan celah kosong di grafik. Celah ini bekerja seperti magnet yang akan menyedot harga turun kembali sebelum naik lagi.",
    "practical": "FVG bertindak seperti magnet harga. Peluang entry terbaik adalah menunggu harga retrace masuk kembali ke dalam celah FVG sebelum rally."
  },
  {
    "id": 28,
    "term": "Break of Structure (BOS)",
    "category": "Price Action & SMC",
    "desc": "Tanda Lanjut Tancap Gas: harga berhasil menjebol puncak tertinggi sebelumnya, menandakan tren kenaikan masih bertenaga kuat untuk berlanjut.",
    "practical": "Jangan beli tepat di pucuk saat BOS baru pecah. Tunggu harga pullback ke area diskon (di bawah 50% rentang) untuk risiko terukur."
  },
  {
    "id": 29,
    "term": "Change of Character (CHoCH)",
    "category": "Price Action & SMC",
    "desc": "Tanda Putar Balik: sinyal pertama bahwa tren turun mulai patah dan harga bersiap berganti arah menuju tren naik.",
    "practical": "Sinyal peringatan awal bahwa tren lama melemah. Bersiaplah untuk mengubah bias analisis Anda dan tunggu konfirmasi BOS berikutnya."
  },
  {
    "id": 30,
    "term": "Liquidity Sweep (Stop Hunt)",
    "category": "Price Action & SMC",
    "desc": "Jebakan Sapu Bersih: harga sengaja diturunkan sebentar untuk memancing trader ritel panik menjual rugi, lalu harga ditarik roket ke atas oleh bandar.",
    "practical": "Ciri khasnya adalah candle meninggalkan ekor panjang (rejection wick) dengan volume besar pasca menembus support kunci."
  },
  {
    "id": 31,
    "term": "Discount Zone vs Premium Zone",
    "category": "Price Action & SMC",
    "desc": "Zona Diskon = area harga murah (di bawah separuh rentang harga, tempat wajib beli); Zona Premium = area harga mahal (tempat untuk jualan, bukan beli).",
    "practical": "Hanya lakukan pembelian saat harga berada di zona diskon (<50% Fibonacci range). Membeli di area premium memperburuk risk/reward."
  },
  {
    "id": 32,
    "term": "Confluence Score",
    "category": "Price Action & SMC",
    "desc": "Skor Lampu Hijau: nilai kecocokan sinyal. Semakin banyak syarat terpenuhi (harga murah + ada sarang bandar + volume mendukung), semakin tinggi peluang menang trade Anda.",
    "practical": "Hanya ambil trade jika Confluence Score >= 3 (misal: Diskon 50% + Fresh OB + FVG + Volume Inflow)."
  },
  {
    "id": 33,
    "term": "Support & Resistance (S/R)",
    "category": "Price Action & SMC",
    "desc": "Support = lantai penahan harga agar tidak jatuh lebih dalam; Resistance = plafon penahan harga yang menghambat kenaikan.",
    "practical": "Beli di area support yang teruji pantul dengan SL ketat. Jual sebagian atau bersiap exit saat harga mendekati plafon resistance."
  },
  {
    "id": 34,
    "term": "Institutional Inflow Score (IIFS)",
    "category": "Bandarmologi & Flow",
    "desc": "Radar Detektor Uang Bandar: skor pintar yang melacak apakah investor raksasa sedang diam-diam memborong saham (skor positif hijau) atau sedang buang barang (skor negatif merah).",
    "practical": "Skor Z > +1.5 menandakan akumulasi institusi agresif. Skor Z < -1.5 menandakan distribusi masif di mana Anda wajib waspada exit."
  },
  {
    "id": 35,
    "term": "Z-Score Normalization",
    "category": "Bandarmologi & Flow",
    "desc": "Skor Deteksi Keanehan: ukuran seberapa tidak wajarnya lonjakan transaksi hari ini dibanding rata-rata 20 hari terakhir (seperti mendeteksi demam suhu tubuh).",
    "practical": "Z-score di atas +2.0 adalah anomali statistik kuat yang mencerminkan akumulasi masif oleh institusi jauh di atas rata-rata normal."
  },
  {
    "id": 36,
    "term": "OBV Z-Score (30%)",
    "category": "Bandarmologi & Flow",
    "desc": "Pengukur Tenaga Akumulasi: menghitung apakah transaksi lebih banyak terjadi saat harga naik dibanding saat harga turun.",
    "practical": "Jika harga saham naik tipis namun OBV melonjak tajam, ini konfirmasi awal akumulasi senyap sebelum harga meledak ke atas."
  },
  {
    "id": 37,
    "term": "MFI Z-Score (25%)",
    "category": "Bandarmologi & Flow",
    "desc": "Termometer Arus Kas: mengukur seberapa deras uang tunai nyata yang dipompa masuk oleh pembeli besar ke dalam suatu saham.",
    "practical": "MFI > 80 menandakan uang tunai masuk sangat jenuh; MFI < 20 menunjukkan tekanan jual mulai reda dan peluang pantulan terbuka."
  },
  {
    "id": 38,
    "term": "Deviasi VWAP (25%)",
    "category": "Bandarmologi & Flow",
    "desc": "Jarak Modal Raksasa: melihat apakah harga saham saat ini berada di atas atau di bawah harga modal rata-rata yang dibeli oleh institusi.",
    "practical": "Harga di atas VWAP menandakan pembeli memegang kendali (Bullish Intraday). Jangan beli saham day trading jika harga jauh di bawah VWAP."
  },
  {
    "id": 39,
    "term": "Chaikin A/D Line (20%)",
    "category": "Bandarmologi & Flow",
    "desc": "Pengukur Kualitas Penutupan: melihat apakah saham ditutup menguat di pucuk harga atas (tanda bandar kuat) atau melempem di bawah menjelang pasar tutup.",
    "practical": "Jika lilin hijau ditutup dekat harga tertinggi hari itu, nilai Chaikin A/D naik mengonfirmasi dominasi pembeli institusional."
  },
  {
    "id": 40,
    "term": "Net Foreign Flow (NFF)",
    "category": "Bandarmologi & Flow",
    "desc": "Arus Dana Investor Asing: selisih total pembelian dikurangi penjualan oleh asing. Jika asing terus borong berhari-hari, saham perbankan besar biasanya terbang.",
    "practical": "Investor asing adalah motor utama saham penggerak indeks (BBCA, BBRI, BMRI, TLKM). Akumulasi asing berhari-hari pertanda tren naik sehat."
  },
  {
    "id": 41,
    "term": "Fase Akumulasi & Distribusi",
    "category": "Bandarmologi & Flow",
    "desc": "Akumulasi = bandar mengumpulkan saham diam-diam di harga murah. Distribusi = bandar jualan barang ke publik di harga mahal sambil menyebarkan berita positif.",
    "practical": "Ciri akumulasi: harga sideways tapi volume membesar atau foreign net buy stabil. Ciri distribusi: berita sangat heboh di media namun harga gagal naik."
  },
  {
    "id": 42,
    "term": "Fake Bid / Offer (Spoofing)",
    "category": "Bandarmologi & Flow",
    "desc": "Umpan Antrean Palsu: bandar memajang puluhan ribu lot antrean beli palsu untuk menipu ritel agar ikut beli, lalu antrean itu dicabut secepat kilat saat ritel terpancing.",
    "practical": "Bid tebal palsu sering dipasang di bawah agar terkesan ada penahan kuat, padahal begitu harga mendekat, antrean langsung ditarik."
  },
  {
    "id": 43,
    "term": "VWAP (Volume-Weighted Average Price)",
    "category": "Bandarmologi & Flow",
    "desc": "Harga Rata-Rata Bandar: patokan harga modal wajar pemain besar. Selama harga berada di atas garis ini, pembeli masih memegang kendali.",
    "practical": "Gunakan VWAP harian sebagai garis pertahanan batas Stop Loss atau titik ekuilibrium harga modal bandar."
  },
  {
    "id": 44,
    "term": "Google TimesFM 2.5",
    "category": "Model Quant & AI",
    "desc": "AI Prakiraan Tren: kecerdasan buatan dari Google Research yang membaca pola data masa lalu untuk memperkirakan arah lintasan harga 5 hari ke depan.",
    "practical": "Gunakan proyeksi 5 hari TimesFM untuk melihat tren arah umum, bukan sebagai angka pasti rupiah besok pagi."
  },
  {
    "id": 45,
    "term": "Confidence Band 80%",
    "category": "Model Quant & AI",
    "desc": "Pagar Batas Optimis & Pesimis: rentang jalur pergerakan harga dengan tingkat keyakinan 80%, membantu Anda melihat skenario terbaik dan terburuk.",
    "practical": "Pasang target profit di dekat batas pita atas dan letakkan Stop Loss di bawah batas pita bawah confidence band."
  },
  {
    "id": 46,
    "term": "Statistical Ensemble Fallback",
    "category": "Model Quant & AI",
    "desc": "Mesin Cadangan Otomatis: sistem perhitungan statistik otomatis yang langsung aktif jika server AI sedang gangguan, sehingga aplikasi tidak pernah mogok.",
    "practical": "Jika server AI mengalami pemeliharaan, sistem tetap menghitung proyeksi teknikal menggunakan model matematis cadangan tanpa henti."
  },
  {
    "id": 47,
    "term": "Exp3 Multi-Armed Bandit",
    "category": "Model Quant & AI",
    "desc": "Liga Strategi Cerdas: sistem cerdas yang mengadu semua strategi trading dan otomatis memilih strategi yang win-rate-nya sedang paling tinggi di bursa saat ini.",
    "practical": "Sistem secara berkala mengevaluasi bobot algoritma sehingga strategi yang paling cocok dengan kondisi bursa saat ini yang diutamakan."
  },
  {
    "id": 48,
    "term": "State Machine Virtual Portfolio",
    "category": "Model Quant & AI",
    "desc": "Akun Simulasi Latihan Nyata: fitur uji coba strategi otomatis tanpa menggunakan uang asli untuk menguji akurasi sinyal secara transparan.",
    "practical": "Manfaatkan akun simulasi untuk menguji konsistensi trading Anda selama minimal 30 hari sebelum terjun dengan modal rupiah riil."
  },
  {
    "id": 49,
    "term": "Rolling 30-Day Auto Purge",
    "category": "Model Quant & AI",
    "desc": "Pembersihan Riwayat Kedaluwarsa: penghapusan data uji coba yang sudah lewat dari 30 hari agar sistem tetap ringan dan hanya fokus pada kondisi pasar terbaru.",
    "practical": "Fokus pada data transaksi 30 hari terakhir karena dinamika pasar modern berubah cepat mengikuti siklus likuiditas baru."
  },
  {
    "id": 50,
    "term": "LLM Brain (Gemini Flash)",
    "category": "Model Quant & AI",
    "desc": "Otak Penerjemah AI: asisten cerdas yang menerjemahkan berita ekonomi rumit menjadi 2 kalimat santai dan jelas yang mudah dipahami orang awam.",
    "practical": "Baca rangkuman bahasa santai AI di tiket harian untuk memahami alasan fundamental di balik sinyal kuantitatif dalam 10 detik."
  },
  {
    "id": 51,
    "term": "Moving Average (MA20 & MA50)",
    "category": "Indikator & Analisis",
    "desc": "Garis Tren Rata-Rata: harga rata-rata selama 20 hari (tren pendek) dan 50 hari (tren menengah) untuk menyaring apakah saham sedang tren naik atau turun.",
    "practical": "Kondisi bullish ideal jika Harga > MA20 > MA50 (Golden Alignment). Hindari beli jika harga di bawah MA50 yang menukik turun."
  },
  {
    "id": 52,
    "term": "Golden Alignment",
    "category": "Indikator & Analisis",
    "desc": "Susunan Tangga Naik Ideal: kondisi ketika harga berada di atas garis 20 hari, dan garis 20 hari di atas garis 50 hari. Tanda pasti tren sedang sangat kuat naik.",
    "practical": "Saat Golden Alignment terbentuk, setiap penurunan harga ke MA20 merupakan peluang beli (buy on weakness) berisiko rendah."
  },
  {
    "id": 53,
    "term": "RSI 14 (Wilder's Smoothing)",
    "category": "Indikator & Analisis",
    "desc": "Spidometer Kejenuhan Pasar: skala 0-100. Angka di atas 70 artinya pasar sudah kekenyangan belanja (rawan turun); di bawah 30 artinya sudah jenuh jual (siap memantul).",
    "practical": "RSI > 70 = Overbought (rawan koreksi); RSI < 30 = Oversold (potensi rebound). Setup breakout terbaik terjadi saat RSI di zona 50-65."
  },
  {
    "id": 54,
    "term": "ATR (Average True Range)",
    "category": "Indikator & Analisis",
    "desc": "Pengukur Lebar Goyangan Harga: menghitung berapa rupiah biasanya saham ini naik-turun dalam sehari, berguna untuk menentukan jarak Stop Loss yang tidak gampang tersenggol.",
    "practical": "Gunakan 1.5x atau 2x nilai ATR untuk menentukan jarak Stop Loss yang fleksibel dan tidak mudah tergores goyangan pasar wajar."
  },
  {
    "id": 55,
    "term": "Volume Spike",
    "category": "Indikator & Analisis",
    "desc": "Ledakan Volume: lonjakan transaksi tiba-tiba melebihi 2 kali lipat hari biasa, menandakan adanya pembeli institusi besar yang sedang masuk serempak.",
    "practical": "Breakout resisten WAJIB divalidasi oleh volume spike >2x rata-rata 20 hari. Kenaikan harga tanpa volume rawan bull trap."
  },
  {
    "id": 56,
    "term": "Pearson Correlation Matrix",
    "category": "Indikator & Analisis",
    "desc": "Tabel Kekompakan Gerak Saham: mengecek apakah dua saham bergerak kembar searah, agar Anda tidak salah mengira sudah diversifikasi padahal risikonya sama persis.",
    "practical": "Jangan membeli 3 saham yang korelasinya +0.9 secara bersamaan, karena itu sama saja melipatgandakan risiko pada satu sektor yang sama."
  },
  {
    "id": 57,
    "term": "DXY (US Dollar Index)",
    "category": "Makro & Kripto",
    "desc": "Indeks Keperkasaan Dolar AS: jika indeks ini terbang tinggi, mata uang Rupiah melemah dan investor asing cenderung menarik uangnya dari bursa Indonesia.",
    "practical": "Jika DXY melonjak tajam, nilai tukar Rupiah tertekan dan dana asing cenderung keluar (outflow) dari pasar saham Indonesia (IHSG)."
  },
  {
    "id": 58,
    "term": "US10Y Treasury Yield",
    "category": "Makro & Kripto",
    "desc": "Bunga Tabungan Pemerintah Amerika 10 Tahun: tolok ukur bunga dunia. Jika bunga ini melonjak, pasar saham biasanya tertekan karena investor memilih cari aman di obligasi AS.",
    "practical": "Kenaikan yield US10Y menaikkan biaya modal global dan menekan saham teknologi serta saham yang memiliki beban bunga utang tinggi."
  },
  {
    "id": 59,
    "term": "Komoditas XAU & Brent Crude",
    "category": "Makro & Kripto",
    "desc": "Harga Emas dan Minyak Dunia: penggerak utama saham tambang di Indonesia. Emas dunia naik mendongkrak saham ANTM/BRMS; minyak dunia naik mendongkrak MEDC.",
    "practical": "Kenaikan harga Emas dunia langsung menguntungkan emiten tambang seperti ANTM & BRMS; lonjakan Minyak Mentah mengerek saham energi MEDC."
  },
  {
    "id": 60,
    "term": "Crypto Spot USDT",
    "category": "Makro & Kripto",
    "desc": "Beli Kripto Murni (Tanpa Utang): membeli koin secara tunai 1:1. Anda tidak akan pernah terkena sita paksa (margin call) meski harga sedang anjlok drastis.",
    "practical": "Gunakan Spot untuk investasi atau swing kripto. Saat terjadi flash dump mendadak, saldo koin Anda tetap utuh tanpa risiko modal musnah."
  },
  {
    "id": 61,
    "term": "Bitcoin Halving 4 Tahunan",
    "category": "Makro & Kripto",
    "desc": "Pesta Kelangkaan Bitcoin 4 Tahunan: pasokan koin baru yang dicetak otomatis dipotong separuh setiap 4 tahun, yang secara historis selalu memicu siklus kenaikan harga besar.",
    "practical": "Akumulasi koin utama (BTC) pada fase akumulasi 6-12 bulan sebelum atau sesudah Halving untuk menangkap siklus bull run 4 tahunan."
  },
  {
    "id": 62,
    "term": "Bitcoin Dominance (BTC.D)",
    "category": "Makro & Kripto",
    "desc": "Porsi Kuasa Bitcoin: persentase uang di pasar kripto yang dikuasai Bitcoin. Jika angka ini anjlok bebas, artinya musim pesta koin-koin lain (Altseason) resmi dimulai.",
    "practical": "Saat BTC.D mulai patah tren turun dari puncak, pindahkan sebagian profit dari Bitcoin ke aset Altcoin potensial (Altseason)."
  },
  {
    "id": 63,
    "term": "Master Top Bar HUD",
    "category": "Makro & Kripto",
    "desc": "Panel Navigasi Atas: pusat informasi waktu bursa Jakarta, indikator server aktif, dan tombol akses cepat kalkulator lot di layar MBG.",
    "practical": "Gunakan status indikator di Top Bar HUD untuk memastikan koneksi data bursa sedang aktif dan pasar sedang dalam jam perdagangan."
  },
  {
    "id": 64,
    "term": "Bloomberg NewsWire Tape",
    "category": "Makro & Kripto",
    "desc": "Pita Berita Berjalan: teks berjalan pemantau harga emas, minyak, dolar, serta kilasan berita ekonomi dunia yang langsung menunjukkan saham apa yang terkena dampaknya.",
    "practical": "Pantau pita berita berjalan untuk mengetahui sentimen makro yang sedang viral sebelum pasar saham Jakarta dibuka jam 09:00 WIB."
  },
  {
    "id": 65,
    "term": "Executive Hero Bar",
    "category": "Makro & Kripto",
    "desc": "3 Kartu Pilihan Utama: ringkasan kilat kondisi bursa hari ini serta 1 saham dan 1 kripto terbaik pilihan sistem dengan peluang menang tertinggi.",
    "practical": "Lihat Hero Bar setiap pagi untuk mengetahui arah kompas IHSG dan ide trading saham/kripto prioritas dengan skor tertinggi."
  },
  {
    "id": 66,
    "term": "Telegram Radar 24/7",
    "category": "Makro & Kripto",
    "desc": "Asisten Bot Pribadi 24 Jam: robot Telegram yang mengirimkan peringatan dini sinyal beli/jual dan rangkuman pasar langsung ke ponsel Anda tanpa perlu menatap layar seharian.",
    "practical": "Aktifkan notifikasi Telegram Radar agar Anda tidak melewatkan momentum swing penting saat sedang sibuk beraktivitas harian."
  }
];

export const VISUAL_FIGURES_GALLERY = [
  { id: 1, title: 'Anatomi Candlestick & Bullish Order Block', file: '/figures/01_candlestick_order_block.png', category: 'Price Action & SMC', desc: 'Sumbu ekor vs body, pergerakan impulsif >2x ATR, dan area kotak demand institusional.' },
  { id: 2, title: 'Struktur Imbalance Fair Value Gap (FVG)', file: '/figures/02_fair_value_gap_fvg.png', category: 'Price Action & SMC', desc: 'Celah ruang hampa antara Candle 1 dan 3 serta titik tengah ekuilibrium diskon 50%.' },
  { id: 3, title: 'Kurva Drawdown vs Pemulihan Modal', file: '/figures/03_drawdown_vs_recovery.png', category: 'Manajemen Risiko', desc: 'Bukti matematis kenapa rugi 50% butuh cuan 100% dan bahaya zona merah penarikan >30%.' },
  { id: 4, title: 'Flowchart SOP 5 Langkah Astra Standard', file: '/figures/04_astra_5_step_flowchart.png', category: 'Manajemen Risiko', desc: 'Peta alur kerja wajib: Filter Makro -> Skor IIFS -> Area Diskon SMC -> Lot 2% -> Jurnal.' },
  { id: 5, title: 'Anatomi 4 Fase Jebakan Dividend Trap', file: '/figures/05_dividend_trap_anatomy.png', category: 'Bandarmologi & Flow', desc: 'Fase akumulasi senyap, lonjakan volume ritel di Cum-Date, hingga kaskade ARB di Ex-Date.' },
  { id: 6, title: 'Piramida Likuiditas Kripto (Capital Waterfall)', file: '/figures/06_crypto_liquidity_pyramid.png', category: 'Makro & Kripto', desc: 'Aliran rotasi dana dari Stablecoin/Fiat -> Bitcoin -> Ethereum -> Altseason.' },
  { id: 7, title: 'Anatomi Liquidity Sweep (Turtle Soup)', file: '/figures/07_liquidity_sweep_turtle_soup.png', category: 'Price Action & SMC', desc: 'Perangkap fake breakout di atas swing high, sumbu rejection wick, dan pembalikan arah.' },
  { id: 8, title: 'Peta Transmisi Makro Segitiga Emas', file: '/figures/08_macro_commodity_transmission.png', category: 'Makro & Kripto', desc: 'Transmisi DXY, imbal hasil US10Y, kurs Rupiah, dan pengaruhnya ke sektor-sektor BEI.' },
  { id: 9, title: 'Paradoks Operating Leverage BRMS vs ANTM', file: '/figures/09_operating_leverage_gold_brms_vs_antm.png', category: 'Makro & Kripto', desc: 'Perbedaan sensitivitas laba emiten pure-play gold mining vs emiten terintegrasi refining.' },
  { id: 10, title: 'Mikrostruktur Order Book: Fake Bid Spoofing', file: '/figures/10_orderbook_spoofing_anatomy.png', category: 'Bandarmologi & Flow', desc: 'Anatomi antrean palsu bandar untuk memancing HAKA ritel vs penyerapan riil di pasar.' }
];

export default function QuantAcademyTab() {
  const [activeTab, setActiveTab] = useState('academy'); // 'academy' | 'dictionary' | 'gallery' | 'calculator' | 'certificate'
  const [activeLevel, setActiveLevel] = useState(1);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedGalleryImg, setSelectedGalleryImg] = useState(null);

  // Mini Interactive Lot Calculator State
  const [calcEquity, setCalcEquity] = useState(10000000);
  const [calcEntry, setCalcEntry] = useState(1500);
  const [calcStopLoss, setCalcStopLoss] = useState(1425);
  const [calcRiskPct, setCalcRiskPct] = useState(2);

  // Pre-Flight Checklist State
  const [checklist, setChecklist] = useState({
    gate1: false,
    gate2: false,
    gate3: false,
    gate4: false,
    gate5: false
  });

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
    if (window.confirm('Reset seluruh progres belajar dan sertifikat MBG Academy?')) {
      setProgress({ completedLessons: [], completedLevels: [] });
      setQuizAnswers({});
      setQuizSubmitted(false);
      setActiveQuiz(null);
    }
  };

  // Calculations
  const riskRupiahMax = Math.round((calcEquity * calcRiskPct) / 100);
  const slDistanceRupiah = Math.max(1, calcEntry - calcStopLoss);
  const slDistancePct = ((slDistanceRupiah / calcEntry) * 100).toFixed(2);
  const calculatedLots = Math.max(0, Math.floor(riskRupiahMax / (slDistanceRupiah * 100)));
  const totalPositionValue = calculatedLots * 100 * calcEntry;
  const portfolioExposurePct = calcEquity > 0 ? ((totalPositionValue / calcEquity) * 100).toFixed(1) : 0;
  const actualRiskRupiah = calculatedLots * 100 * slDistanceRupiah;

  const totalLessons = ACADEMY_LEVELS.reduce((acc, l) => acc + l.lessons.length, 0);
  const percentComplete = Math.round((progress.completedLevels.length / 5) * 100);
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

  const allGatesChecked = Object.values(checklist).every(Boolean);

  return (
    <div style={{ background: 'var(--bg-panel)', border: 'var(--border-hairline)', padding: '16px', fontFamily: 'var(--font-mono)' }}>
      
      {/* 1. Academy HUD Header */}
      <div style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎓 MBG QUANT ACADEMY // ASTRA DISCIPLINARY SYSTEM</span>
              <span className="badge badge-bull" style={{ fontSize: '9px' }}>5 LEVELS COMPLETE</span>
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
              KURIKULUM FINANSIAL & TRADING KUANTITATIF BERJENJANG · MANAJEMEN MODAL · SMART MONEY · BANDARMOLOGI · KRIPTO SPOT
            </div>
          </div>
          <button
            onClick={handleReset}
            className="telemetry-btn"
            style={{ fontSize: '10px', padding: '4px 9px', color: 'var(--accent-rust)' }}
            title="Reset ulang seluruh progres"
          >
            🔄 Reset Progres
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Status Kelulusan Materi & Evaluasi Kuis:</span>
            <span style={{ fontWeight: '800', color: percentComplete === 100 ? 'var(--accent-green)' : 'var(--accent-blue)' }}>
              {percentComplete}% SELESAI ({progress.completedLevels.length} / 5 LEVEL LULUS)
            </span>
          </div>
          <div style={{ width: '100%', height: '7px', background: '#202228', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${percentComplete}%`, height: '100%', background: percentComplete === 100 ? 'var(--accent-green)' : '#0066cc', transition: 'width 0.4s ease' }}></div>
          </div>
        </div>

        {/* Badges Earned */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '10px' }}>
          <span style={{ fontWeight: '700', color: 'var(--accent-orange)' }}>LENCANA DIRAIH:</span>
          {earnedBadges.length > 0 ? (
            earnedBadges.map((b, i) => (
              <span key={i} className="badge badge-bull" style={{ fontSize: '9.5px' }}>{b}</span>
            ))
          ) : (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Selesaikan kuis evaluasi tiap level untuk meraih lencana keahlian Anda.</span>
          )}
        </div>
      </div>

      {/* 2. Sub Navigation */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', borderBottom: 'var(--border-hairline)', paddingBottom: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('academy')}
          className={'telemetry-btn ' + (activeTab === 'academy' ? 'active' : '')}
          style={{ fontSize: '11px', padding: '6px 13px', fontWeight: '700' }}
        >
          📚 Kurikulum Pelatihan (5 Level)
        </button>
        <button
          onClick={() => setActiveTab('dictionary')}
          className={'telemetry-btn ' + (activeTab === 'dictionary' ? 'active' : '')}
          style={{ fontSize: '11px', padding: '6px 13px', fontWeight: '700' }}
        >
          📖 Quick Dictionary ({GLOSSARY_TERMS.length})
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={'telemetry-btn ' + (activeTab === 'gallery' ? 'active' : '')}
          style={{ fontSize: '11px', padding: '6px 13px', fontWeight: '700' }}
        >
          🖼️ Galeri Visual ({VISUAL_FIGURES_GALLERY.length} Infografis)
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={'telemetry-btn ' + (activeTab === 'calculator' ? 'active' : '')}
          style={{ fontSize: '11px', padding: '6px 13px', fontWeight: '700' }}
        >
          🧮 Kalkulator Lot & Cockpit Checklist
        </button>
        {progress.completedLevels.length === 5 && (
          <button
            onClick={() => setActiveTab('certificate')}
            className={'telemetry-btn ' + (activeTab === 'certificate' ? 'active' : '')}
            style={{ fontSize: '11px', padding: '6px 13px', fontWeight: '700', color: 'var(--accent-gold)' }}
          >
            🏆 Sertifikat Kelulusan
          </button>
        )}
      </div>

      {/* TAB 1: ACADEMY CURRICULUM */}
      {activeTab === 'academy' && (
        <div>
          {/* Level Selection Tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {ACADEMY_LEVELS.map(l => {
              const isPassed = progress.completedLevels.includes(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => { setActiveLevel(l.id); setActiveQuiz(null); setQuizSubmitted(false); setQuizAnswers({}); }}
                  className={'telemetry-btn ' + (activeLevel === l.id ? 'active' : '')}
                  style={{ fontSize: '10.5px', padding: '5px 12px', fontWeight: '700' }}
                >
                  Level {l.id} {isPassed ? '✓ Lulus' : ''}
                </button>
              );
            })}
          </div>

          {/* Active Level Body */}
          {ACADEMY_LEVELS.filter(l => l.id === activeLevel).map(level => {
            const isLevelPassed = progress.completedLevels.includes(level.id);
            return (
              <div key={level.id} style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{level.title}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--accent-blue)', marginTop: '2px' }}>Penghargaan: {level.badge}</div>
                  </div>
                  {isLevelPassed && <span className="badge badge-bull" style={{ padding: '4px 10px', fontSize: '10px' }}>✓ RESMI LULUS EVALUASI</span>}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px', fontStyle: 'italic', borderBottom: 'var(--border-muted)', paddingBottom: '8px' }}>
                  {level.summary}
                </div>

                {!activeQuiz ? (
                  <>
                    {/* Lessons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
                      {level.lessons.map(lesson => {
                        const isRead = progress.completedLessons.includes(lesson.id);
                        return (
                          <div key={lesson.id} style={{ background: 'var(--bg-panel)', border: 'var(--border-muted)', padding: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <strong style={{ fontSize: '11.5px', color: 'var(--text-primary)' }}>{lesson.title}</strong>
                              {isRead ? (
                                <span style={{ color: 'var(--accent-green)', fontSize: '10px', fontWeight: '700' }}>✓ Selesai Dibaca</span>
                              ) : (
                                <button
                                  onClick={() => handleLessonComplete(lesson.id)}
                                  className="telemetry-btn"
                                  style={{ fontSize: '9.5px', padding: '3px 8px' }}
                                >
                                  Tandai Selesai Dibaca
                                </button>
                              )}
                            </div>

                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, margin: '6px 0 10px 0' }}>
                              {lesson.content}
                            </p>

                            {/* Embedded Visual Figure if exists */}
                            {lesson.figure && (
                              <div style={{ marginTop: '12px', background: '#0a0c10', border: '1px solid #232732', padding: '8px', textAlign: 'center' }}>
                                <img
                                  src={lesson.figure}
                                  alt={lesson.title}
                                  style={{ maxWidth: '100%', height: 'auto', maxHeight: '340px', objectFit: 'contain', cursor: 'pointer', borderRadius: '2px' }}
                                  onClick={() => setSelectedGalleryImg(lesson.figure)}
                                  title="Klik untuk memperbesar tampilan"
                                />
                                {lesson.figureCaption && (
                                  <div style={{ fontSize: '10px', color: 'var(--accent-orange)', marginTop: '6px', fontWeight: '600' }}>
                                    {lesson.figureCaption}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ textAlign: 'center', paddingTop: '12px', borderTop: 'var(--border-muted)' }}>
                      <button
                        onClick={() => { setActiveQuiz(level.id); setQuizSubmitted(false); setQuizAnswers({}); }}
                        className="telemetry-btn"
                        style={{ padding: '9px 24px', fontSize: '11.5px', fontWeight: '800', background: 'var(--accent-orange)', color: '#fff' }}
                      >
                        {isLevelPassed ? '🔄 Ulangi Kuis Ujian Level ' + level.id : '📝 Mulai Ujian Evaluasi Kelulusan Level ' + level.id}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Quiz Interface */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: 'var(--border-muted)', paddingBottom: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '12px', color: 'var(--accent-orange)' }}>
                        UJIAN EVALUASI KELULUSAN: LEVEL {level.id} (3 SOAL WAJIB LULUS 100%)
                      </span>
                      <button
                        onClick={() => setActiveQuiz(null)}
                        className="telemetry-btn"
                        style={{ fontSize: '10px', padding: '3px 8px' }}
                      >
                        ✕ Tutup Kuis & Kembali ke Materi
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
                      {level.quiz.map((q, qIdx) => {
                        const userAns = quizAnswers[qIdx];
                        const isCorrect = userAns === q.answer;
                        return (
                          <div key={qIdx} style={{ background: 'var(--bg-panel)', border: 'var(--border-muted)', padding: '14px' }}>
                            <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>
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
                                      padding: '9px 12px',
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
                              <div style={{ marginTop: '10px', fontSize: '10.5px', color: isCorrect ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                                {isCorrect ? '✅ JAWABAN TEPAT!' : '❌ KURANG TEPAT.'} {q.explanation}
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
                          style={{ padding: '9px 28px', fontSize: '11.5px', fontWeight: '800', background: 'var(--accent-green)', color: '#fff' }}
                        >
                          Kirim Jawaban &amp; Cek Kelulusan
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button
                            onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                            className="telemetry-btn"
                            style={{ padding: '7px 16px', fontSize: '10.5px' }}
                          >
                            Ulangi Kuis
                          </button>
                          <button
                            onClick={() => setActiveQuiz(null)}
                            className="telemetry-btn"
                            style={{ padding: '7px 16px', fontSize: '10.5px', background: 'var(--accent-blue)', color: '#fff' }}
                          >
                            Selesai &amp; Kembali ke Materi
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

      {/* TAB 2: QUICK DICTIONARY (MODEL TABEL KEBAWAH RAPI) */}
      {activeTab === 'dictionary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Header & Filter Controls */}
          <div style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                  📖 MASTER GLOSSARY // KAMUS KILAT 66 ISTILAH TRADING & QUANT TERVERIFIKASI
                </span>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Disajikan dalam format tabel vertikal terstruktur untuk pemula. Dilengkapi definisi ramah awam, analogi dunia nyata, dan aturan praktis eksekusi pasar.
                </div>
              </div>
              <span className="badge badge-blue" style={{ fontSize: '10.5px', padding: '4px 10px' }}>
                Menampilkan {filteredGlossary.length} dari {GLOSSARY_TERMS.length} Istilah
              </span>
            </div>

            {/* Search Input */}
            <div>
              <input
                type="text"
                placeholder="🔍 Cari istilah, singkatan (SL, FVG, ARA, NFF, VWAP, BTC.D, TimesFM...), definisi, atau tips pasar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 13px',
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
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: '4px' }}>KATEGORI:</span>
              {DICTIONARY_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={'telemetry-btn ' + (activeCategory === cat ? 'active' : '')}
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                >
                  {cat === 'ALL' ? 'SEMUA KATEGORI (66)' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Model Tabel Kebawah Rapi (4 Kolom Sesuai Permintaan User) */}
          <div style={{ overflowX: 'auto', border: 'var(--border-hairline)', background: 'var(--bg-panel-subtle)' }}>
            <table className="telemetry-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '42px', textAlign: 'center' }}>#</th>
                  <th style={{ width: '230px' }}>ISTILAH & KATEGORI</th>
                  <th style={{ width: '42%' }}>PENJELASAN KONSEP (RAMAH PEMULA)</th>
                  <th style={{ width: '42%' }}>ATURAN / TIPS PRAKTIS DI PASAR</th>
                </tr>
              </thead>
              <tbody>
                {filteredGlossary.length > 0 ? (
                  filteredGlossary.map((item, idx) => (
                    <tr key={item.id || idx} style={{ verticalAlign: 'top', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '700', padding: '11px 6px' }}>
                        {item.id || idx + 1}
                      </td>
                      <td style={{ whiteSpace: 'normal', padding: '11px 12px' }}>
                        <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--accent-blue)', marginBottom: '5px' }}>
                          {item.term}
                        </div>
                        <span className={`badge ${
                          item.category === 'Manajemen Risiko' ? 'badge-alert' :
                          item.category === 'Mekanisme Bursa' ? 'badge-blue' :
                          item.category === 'Price Action & SMC' ? 'badge-bull' :
                          item.category === 'Bandarmologi & Flow' ? 'badge-blue' :
                          item.category === 'Model Quant & AI' ? 'badge-alert' :
                          item.category === 'Indikator & Analisis' ? 'badge-bull' : 'badge-alert'
                        }`} style={{ fontSize: '9px' }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'normal', fontSize: '11px', lineHeight: 1.5, color: 'var(--text-primary)', padding: '11px 12px' }}>
                        {item.desc}
                      </td>
                      <td style={{ whiteSpace: 'normal', fontSize: '10.5px', lineHeight: 1.5, color: 'var(--text-muted)', padding: '11px 12px' }}>
                        <span style={{ color: 'var(--accent-orange)', fontWeight: '700' }}>💡 Aturan Praktis: </span>
                        {item.practical}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '36px 14px', color: 'var(--text-muted)', fontSize: '11px' }}>
                      Tidak ada istilah yang cocok dengan kata kunci "<strong>{searchTerm}</strong>". Coba kata kunci lain atau klik tombol SEMUA KATEGORI.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 3: GALERI VISUAL 10 INFOGRAFIS */}
      {activeTab === 'gallery' && (
        <div>
          <div style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '14px', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
              🖼️ MASTER INFOGRAPHICS & DIAGRAM PROCESS GALLERY (10 FIGUR 300 DPI)
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Seluruh grafik dan visualisasi proses yang dirancang khusus untuk mempermudah orang awam memahami logika pasar, risiko, dan aliran institusi dalam waktu 5 detik.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {VISUAL_FIGURES_GALLERY.map(fig => (
              <div key={fig.id} style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Figur {fig.id}: {fig.title}
                  </span>
                  <span className="badge badge-blue" style={{ fontSize: '9px' }}>{fig.category}</span>
                </div>
                
                <div style={{ background: '#0a0c10', border: '1px solid #232732', padding: '6px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setSelectedGalleryImg(fig.file)}>
                  <img
                    src={fig.file}
                    alt={fig.title}
                    style={{ width: '100%', height: '180px', objectFit: 'contain' }}
                  />
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '4px' }}>🔍 Klik untuk memperbesar</div>
                </div>

                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {fig.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INTERACTIVE LOT CALCULATOR & PRE-FLIGHT CHECKLIST */}
      {activeTab === 'calculator' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          
          {/* Box 1: Position Sizing Calculator */}
          <div style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
              🧮 KALKULATOR LOT PRESISI ASTRA (2% RULE)
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Hitung jumlah lot belanja maksimal secara matematis agar toleransi kerugian Anda terkunci saklek di 2% modal.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>MODAL PORTOFOLIO (RP):</label>
                <input
                  type="number"
                  value={calcEquity}
                  onChange={e => setCalcEquity(Number(e.target.value))}
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-panel)', border: 'var(--border-hairline)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>HARGA ENTRY (RP):</label>
                  <input
                    type="number"
                    value={calcEntry}
                    onChange={e => setCalcEntry(Number(e.target.value))}
                    style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-panel)', border: 'var(--border-hairline)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>HARD STOP LOSS (RP):</label>
                  <input
                    type="number"
                    value={calcStopLoss}
                    onChange={e => setCalcStopLoss(Number(e.target.value))}
                    style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-panel)', border: 'var(--border-hairline)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>BATAS RISIKO PER TRADE (%):</label>
                <select
                  value={calcRiskPct}
                  onChange={e => setCalcRiskPct(Number(e.target.value))}
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--bg-panel)', border: 'var(--border-hairline)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                >
                  <option value={1}>1.0% (Sangat Konservatif / Akun Besar)</option>
                  <option value={2}>2.0% (Standar Baku Doktrin Astra)</option>
                  <option value={3}>3.0% (Agresif Terkontrol)</option>
                </select>
              </div>
            </div>

            {/* Calculation Output Cards */}
            <div style={{ background: 'var(--bg-panel)', border: 'var(--border-muted)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Toleransi Rugi Maksimal (2%):</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-rust)' }}>Rp {riskRupiahMax.toLocaleString('id-ID')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Jarak ke Stop Loss:</span>
                <span style={{ fontWeight: '700', color: 'var(--accent-orange)' }}>-Rp {slDistanceRupiah} (-{slDistancePct}%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: 'var(--border-muted)', paddingTop: '8px' }}>
                <span style={{ fontWeight: '800', color: 'var(--accent-blue)' }}>JUMLAH LOT DISARANKAN:</span>
                <span style={{ fontWeight: '900', color: 'var(--accent-green)', fontSize: '15px' }}>{calculatedLots} LOT</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Nilai Modal Terpakai:</span>
                <span style={{ color: 'var(--text-primary)' }}>Rp {totalPositionValue.toLocaleString('id-ID')} ({portfolioExposurePct}% Ekuitas)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Risiko Riil Jika Kena SL:</span>
                <span style={{ color: 'var(--accent-rust)' }}>Rp {actualRiskRupiah.toLocaleString('id-ID')}</span>
              </div>

              {Number(portfolioExposurePct) > 25 && (
                <div style={{ marginTop: '6px', padding: '6px 8px', background: '#3b1c1c', border: '1px solid var(--accent-rust)', fontSize: '10px', color: '#ffb3b3' }}>
                  ⚠️ PERINGATAN: Eksposur posisi ({portfolioExposurePct}%) melebihi batas 25% modal per emiten. Disarankan memilih titik SL yang lebih dekat atau memperbesar modal.
                </div>
              )}
            </div>
          </div>

          {/* Box 2: Pre-Flight Safety Checklist */}
          <div style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
              ✈️ PRE-FLIGHT COCKPIT CHECKLIST (5 PINTU KESELAMATAN)
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              SOP wajib sebelum menekan tombol beli di aplikasi sekuritas. 1 Lampu Merah = BATALKAN TRANSAKSI!
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {[
                { key: 'gate1', text: '1. Risiko Per Trade ≤ 2% Modal (Lot sudah dihitung pakai kalkulator di samping).' },
                { key: 'gate2', text: '2. Rasio Cuan vs Rugi (R:R) Minimal 1:2 (Potensi TP minimal dua kali lipat jarak SL).' },
                { key: 'gate3', text: '3. Arus Uang Bandar / Asing Terkonfirmasi (IIFS Z-Score > 0 atau Foreign Net Buy stabil).' },
                { key: 'gate4', text: '4. Titik Batal (Invalidation) & Hard Stop Loss sudah ditentukan dan siap dipasang.' },
                { key: 'gate5', text: '5. Pikiran Tenang, Tidak Ada FOMO atau Desakan Ingin Cepat Kaya Mendadak.' }
              ].map(gate => (
                <label
                  key={gate.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    background: checklist[gate.key] ? '#0b2b1a' : 'var(--bg-panel)',
                    border: checklist[gate.key] ? '1px solid var(--accent-green)' : 'var(--border-muted)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: checklist[gate.key] ? 'var(--accent-green)' : 'var(--text-primary)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checklist[gate.key]}
                    onChange={e => setChecklist(prev => ({ ...prev, [gate.key]: e.target.checked }))}
                  />
                  <span>{gate.text}</span>
                </label>
              ))}
            </div>

            <div style={{ textAlign: 'center', padding: '12px', background: allGatesChecked ? '#064e3b' : '#3d1a24', border: allGatesChecked ? '1px solid var(--accent-green)' : '1px solid var(--accent-rust)' }}>
              <div style={{ fontSize: '12px', fontWeight: '900', color: allGatesChecked ? 'var(--accent-green)' : 'var(--accent-rust)', letterSpacing: '0.04em' }}>
                {allGatesChecked ? '✅ SEMUA PINTU LOLOS // SIAP EKSEKUSI DI BURSA!' : '🛑 LAMPU MERAH // DILARANG BELI (STAND DOWN)'}
              </div>
              <div style={{ fontSize: '10px', color: '#ccc', marginTop: '3px' }}>
                {allGatesChecked
                  ? 'Kondisi disiplin terpenuhi 100%. Pasang automatic order Stop Loss seketika setelah order match.'
                  : 'Centang kelima poin keselamatan di atas untuk memastikan Anda tidak bertrading karena emosi semata.'}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: CERTIFICATE VIEW (UNLOCKED AT 5/5 LEVELS) */}
      {activeTab === 'certificate' && progress.completedLevels.length === 5 && (
        <div style={{ background: 'var(--bg-panel-subtle)', border: '2px solid var(--accent-gold)', padding: '36px 24px', textAlign: 'center', maxWidth: '680px', margin: '0 auto', boxShadow: '0 0 30px rgba(217, 119, 6, 0.15)' }}>
          <div style={{ fontSize: '38px', marginBottom: '10px' }}>🏆</div>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--accent-gold)', fontWeight: '800', textTransform: 'uppercase' }}>
            SERTIFIKAT KELULUSAN DISIPLIN FINANSIAL RESMI
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', margin: '12px 0 6px 0', letterSpacing: '0.04em' }}>
            ASTRA-CERTIFIED DISCIPLINED QUANT TRADER
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '22px', maxWidth: '540px', margin: '0 auto 22px auto' }}>
            Diberikan kepada trader yang telah berhasil menyelesaikan seluruh 5 tingkat kurikulum kuantitatif: Fondasi Disiplin Risiko 2%, Makroekonomi & Komoditas Global, Smart Money Concepts (SMC), Bandarmologi Modern IIFS, dan Kripto Spot Mastery dengan kelulusan evaluasi sempurna (100%).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: 'var(--border-muted)', paddingTop: '16px', fontSize: '10px', gap: '10px' }}>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>TANGGAL KELULUSAN:</div>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>{new Date().toLocaleDateString('id-ID')}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>STATUS VERIFIKASI:</div>
              <div style={{ fontWeight: '700', color: 'var(--accent-green)', marginTop: '2px' }}>VERIFIED (100% PASS)</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>OTORITAS SISTEM:</div>
              <div style={{ fontWeight: '700', color: 'var(--accent-orange)', marginTop: '2px' }}>Astra Quant Intelligence Desk</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom Popup for Gallery & Lessons */}
      {selectedGalleryImg && (
        <div
          onClick={() => setSelectedGalleryImg(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={selectedGalleryImg}
              alt="Preview Zoom"
              style={{ maxWidth: '100%', maxHeight: '88vh', objectFit: 'contain', border: '2px solid #3b82f6' }}
            />
            <div style={{ textAlign: 'center', color: '#fff', fontSize: '11px', marginTop: '8px' }}>
              Klik di mana saja untuk menutup tampilan penuh.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
