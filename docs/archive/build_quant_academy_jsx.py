import json
import os

glossary = json.load(open('engine/cache/glossary_66_full.json', encoding='utf-8'))

template = '''import React, { useState, useEffect } from 'react';

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

export const GLOSSARY_TERMS = ''' + json.dumps(glossary, indent=2, ensure_ascii=False) + ''';

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
'''

with open('frontend/src/components/QuantAcademyTab.jsx', 'w', encoding='utf-8') as f:
    f.write(template)

print('Successfully updated frontend/src/components/QuantAcademyTab.jsx!')
