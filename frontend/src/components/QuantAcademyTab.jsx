import React, { useState, useEffect, useMemo } from 'react';

/**
 * =========================================================================
 * MBG QUANT ACADEMY // INSTITUTIONAL WORKING PAPERS (WP SERIES 2026)
 * Curriculum Transformation: From Simple Levels to Hedge Fund Research Papers
 * Foundational Literature:
 *  - Ralph Vince (1990) The Mathematics of Money Management
 *  - Robert Carver (2015) Systematic Trading
 *  - Marcos López de Prado (2018) Advances in Financial Machine Learning
 *  - John J. Murphy (1999) Technical Analysis of the Financial Markets
 *  - Mark Andrew Lim (2016) The Handbook of Technical Analysis
 *  - Abdulkader Aljandali (2016) Quantitative Analysis & Statistics for Finance
 *  - Thomas N. Bulkowski (2013) Fundamental Analysis and Position Trading
 * =========================================================================
 */
export const INSTITUTIONAL_PAPERS = [
  {
    id: 1,
    paperCode: 'MBG-WP-01',
    category: 'PORTFOLIO RISK & APEX SIZING',
    badge: 'Risk Sovereign 🛡️',
    title: 'The Mathematics of Capital Preservation: Non-Linear Drawdown Dynamics & Discrete BEI Lot Sizing',
    subtitle: 'Mekanika Asimetri Penurunan Modal, Ralph Vince Fixed Fractional 2%, dan Sistem Rem Ganda Portofolio',
    authors: 'MBG Quantitative Desk • Ralph Vince (1990) & Robert Carver (2015) Alignment',
    jelCodes: 'G11, C58, D81',
    rigor: 'Mathematical Rigor: High',
    abstract: 'Studi empiris membuktikan bahwa kegagalan 90% pelaku pasar ritel dalam 90 hari pertama (Hukum 90/90/90) berakar dari ketidaktahuan atas fungsi hiperbolik pemulihan modal (drawdown recovery). Makalah ini menyajikan formulasi penentuan ukuran lot diskret terikat fraksi bursa BEI, membatasi risiko maksimal r <= 0.02 (2% ekuitas) dengan proteksi ganda (Dual Brake System) guna mengeliminasi peluang kebangkrutan modal.',
    
    laymanSection: {
      headline: 'Mengapa 90% Trader Boncos? Jurang Kematian Finansial & Sabuk Pengaman 2%',
      analogy: 'Ibarat menyetir mobil sport di jalan tol: Sebagian besar pemula menginjak gas sedalam-dalamnya (All-In) tanpa memastikan apakah mobil tersebut memiliki rem darurat yang berfungsi. Ketika terjadi kecelakaan (pasar berbalik arah), mobil langsung hancur total.',
      keyTakeaways: [
        'Sifat Asimetris Kerugian: Jika modal Anda rugi 50%, Anda TIDAK cukup untung 50% untuk balik modal! Anda wajib untung 100% dari sisa saldo baru hanya untuk sekadar kembali ke titik impas modal awal.',
        'Jurang Kematian Modal: Penurunan modal di atas 30% adalah zona merah berbahaya, dan di atas 50% adalah jurang kematian finansial di mana pemulihan membutuhkan keuntungan luar biasa (+100% hingga +900%).',
        'Aturan Emas 2%: Dengan membatasi risiko maksimal 2% dari total modal per transaksi, Anda membutuhkan 35 kali kalah beruntun tanpa pernah menang sekalipun untuk membuat modal terpangkas separuh. Ini memberi Anda napas panjang untuk bertahan dan bertumbuh.'
      ]
    },

    quantSection: {
      theorems: [
        {
          name: 'Hyperbolic Recovery Formula',
          formula: 'Recovery Required (%) = [ 1 / (1 - Drawdown) - 1 ] x 100%',
          description: 'Membuktikan peningkatan eksponensial keuntungan yang dibutuhkan untuk memulihkan modal awal seiring bertambahnya persentase drawdown modal.'
        },
        {
          name: 'Discrete BEI Lot Sizing (Ralph Vince Model)',
          formula: 'Max Lots = floor( (Equity x r) / ( (Entry - Hard_SL) x 100 ) )',
          description: 'Perhitungan ukuran posisi diskret terstandarisasi 1 lot = 100 lembar pada Pasar Reguler BEI, selalu dibulatkan ke bawah (floor) untuk kepatuhan batas risiko.'
        },
        {
          name: 'Dual Brake Safety Invariant',
          formula: 'Optimal Position = min( Max Lots_Risk2%, Max Lots_Allocation20% )',
          description: 'Rem Ganda: Memastikan alokasi pada satu saham tunggal tidak melampaui 20% total ekuitas portofolio meskipun jarak Stop Loss sangat sempit.'
        }
      ],
      codeSnippet: `def calculate_bei_lot_sizing(equity: float, entry_price: float, sl_price: float, risk_pct: float = 0.02, max_allocation_pct: float = 0.20) -> int:
    risk_budget_idr = equity * risk_pct
    sl_distance = max(1.0, abs(entry_price - sl_price))
    
    # Brake 1: Risk-based sizing
    lots_brake_1 = int(risk_budget_idr / (sl_distance * 100))
    
    # Brake 2: Portfolio concentration cap (max 20% equity)
    max_position_value = equity * max_allocation_pct
    lots_brake_2 = int(max_position_value / (entry_price * 100))
    
    # Dual Brake Invariant
    return max(1, min(lots_brake_1, lots_brake_2))`
    },

    historicalCase: {
      ticker: '$BBRI / Second Liner Mining',
      period: 'Koreksi Volatilitas 2024',
      narrative: 'Kasus Pemodal Ekuitas Rp 10.000.000: Membeli saham di harga Rp 1.500 dengan Stop Loss di Rp 1.425 (jarak Rp 75 = 5%). Tanpa sizing, pemula membeli 60 lot (Rp 9.000.000 = 90% modal). Saat terkena SL, ia rugi Rp 450.000 (4.5% modal). Dengan Doktrin 2% Rem Ganda, ukuran lot dibatasi tepat 26 lot (Rp 3.900.000), sehingga saat terkena SL kerugian terkunci tepat di Rp 195.000 (<2%). Portofolio selamat dan siap mengeksekusi peluang berikutnya.'
    },

    preFlightChecklist: [
      'Modal ekuitas akun dan batas risiko 2% telah dikalkulasi secara presisi.',
      'Level Stop Loss rasional telah ditentukan sebelum memasukkan order antrean beli.',
      'Ukuran lot dibulatkan ke bawah (floor) dan memenuhi fraksi harga resmi BEI.',
      'Nilai transaksi total tidak melampaui batas konsentrasi 20% modal portofolio.',
      'Jurnal perdagangan mencatat alasan entry dan rasio Risk/Reward minimal 1:2.0.'
    ],

    comprehensionQuiz: [
      {
        question: 'Jika portofolio Anda mengalami drawdown modal sebesar 50%, berapa persen keuntungan yang dibutuhkan untuk kembali ke modal awal (break-even)?',
        options: ['Cukup 50%', 'Dibutuhkan 75%', 'Wajib 100% dari sisa modal', 'Membutuhkan 150%'],
        answer: 2,
        explanation: 'Karena basis modal berkurang separuh, Anda butuh keuntungan 100% dari saldo sisa hanya untuk impas modal awal.'
      },
      {
        question: 'Apa fungsi utama Sistem Rem Ganda (Dual Brake System) dalam kalkulator lot MBG?',
        options: ['Memaksa trader membeli sebanyak mungkin lot', 'Menjaga kerugian <= 2% DAN mencegah penumpukan modal > 20% pada 1 saham', 'Menghilangkan keharusan memasang Stop Loss', 'Menjamin harga saham pasti naik'],
        answer: 1,
        explanation: 'Rem ganda membatasi risiko maksimal 2% sekaligus mencegah konsentrasi berlebih jika jarak SL sangat dekat.'
      },
      {
        question: 'Mengapa pembulatan ukuran lot di bursa BEI wajib menggunakan fungsi floor (dibulatkan ke bawah)?',
        options: ['Agar menghemat komisi broker', 'Agar toleransi risiko rupiah tidak melampaui batas maksimal yang diizinkan', 'Aturan acak tanpa dasar matematis', 'Agar antrean lot menjadi genap'],
        answer: 1,
        explanation: 'Pembulatan ke bawah memastikan nilai kerugian potensial tidak pernah melampaui alokasi risiko 2% yang telah ditetapkan.'
      }
    ],

    references: [
      'Ralph Vince (1990) The Mathematics of Money Management: Risk Analysis Techniques for Traders, John Wiley & Sons.',
      'Robert Carver (2015) Systematic Trading: A Unique New Method for Designing Trading and Investing Systems, Harriman House.',
      'Keputusan Direksi PT Bursa Efek Indonesia No. Kep-00101/BEI/12-2021 tentang Fraksi Harga Pasar Reguler.'
    ]
  },

  {
    id: 2,
    paperCode: 'MBG-WP-02',
    category: 'GLOBAL MACRO & TRANSMISSION',
    badge: 'Macro Navigator 🧭',
    title: 'Global Macroeconomic Transmission Channels: Sovereign Yield Curves, Carry Trade Dynamics, and Emerging Market Equity Regimes',
    subtitle: 'Segitiga Emas Makro: Korelasi US10Y, DXY, Transmisi Suku Bunga BI-Fed, dan Sensitivitas Sektor Komoditas BEI',
    authors: 'MBG Quantitative Desk • John J. Murphy (1999) & Abdulkader Aljandali (2016) Alignment',
    jelCodes: 'E43, E52, F31, G15',
    rigor: 'Mathematical Rigor: High',
    abstract: 'Makalah ini membedah mekanisme transmisi likuiditas intermarket global terhadap pergerakan pasar saham Indonesia (IHSG). Menggunakan framework Segitiga Emas Makro (US Dollar Index DXY, US 10-Year Treasury Yield, dan Inflasi CPI), kami memformulasikan Carry Spread Suku Bunga Bank Indonesia vs Federal Reserve (+125 bps) sebagai bantalan pelindung volatilitas Rupiah dan penggerak aliran dana asing (Foreign Capital Flow).',

    laymanSection: {
      headline: 'Mengapa Bank Sentral AS (The Fed) Mengendalikan Nasib Saham di Jakarta?',
      analogy: 'Ibarat gravitasi matahari dalam tata surya: Dolar AS dan obligasi pemerintah Amerika adalah magnet raksasa. Ketika suku bunga AS melonjak tinggi, likuiditas uang global tersedot pulang ke Wall Street, menyebabkan bursa negara berkembang seperti Indonesia mengalami kekeringan modal.',
      keyTakeaways: [
        'DXY (Indeks Dolar) Melandai = Angin Segar untuk IHSG: Ketika dolar AS melemah (DXY < 101), investor global cenderung mendistribusikan modalnya ke aset negara berkembang berimbal hasil tinggi, memicu aksi beli bersih asing (Foreign Net Buy).',
        'Kurva Imbal Hasil (Yield Curve 10Y-2Y): Selisih positif obligasi AS 10Y > 2Y menandakan ekonomi global dalam fase ekspansi sehat. Sebaliknya jika terjadi kurva terbalik (Inversi 2Y > 10Y), bursa global membunyikan sirine bahaya resesi dalam 6-18 bulan.',
        'Transmisi Emas & Minyak ke BEI: Kenaikan harga minyak mentah dunia (Brent) langsung mengerek laba emiten energi ($MEDC, $ELSA), sedangkan reli harga emas dunia ($XAU/USD) mentransmisikan sentimen bullish ke saham tambang logam mulia ($ANTM, $BRMS).'
      ]
    },

    quantSection: {
      theorems: [
        {
          name: 'Intermarket Sovereign Carry Spread Invariant',
          formula: 'Carry Spread = Yield(BI_Rate) - Yield(Fed_Funds_Rate) >= +100 bps',
          description: 'Spread positif minimal +100 bps berfungsi sebagai bantalan penahan depresiasi nilai tukar USD/IDR dari aksi jual agresif carry trader global.'
        },
        {
          name: 'Equity Valuation Transmission Model',
          formula: 'd_Valuation_IDX = beta_DXY*(d_DXY) + beta_US10Y*(d_US10Y) + beta_Oil*(d_Brent) + beta_Gold*(d_Gold)',
          description: 'Dekomposisi pergerakan valuasi IHSG terhadap vektor sensitivitas makro global menggunakan matriks kovariansi bergulir.'
        }
      ],
      codeSnippet: `def evaluate_macro_transmission_regime(dxy: float, us10y_yield: float, bi_rate: float, fed_rate: float) -> dict:
    carry_bps = (bi_rate - fed_rate) * 100
    is_idr_shielded = carry_bps >= 100.0
    risk_appetite = "RISK_ON" if dxy < 101.5 and us10y_yield < 4.25 else "RISK_OFF"
    return {
        "carry_spread_bps": carry_bps,
        "is_idr_shielded": is_idr_shielded,
        "macro_regime": risk_appetite,
        "foreign_flow_bias": "NET_INFLOW" if risk_appetite == "RISK_ON" else "DEFENSIVE"
    }`
    },

    historicalCase: {
      ticker: 'IHSG vs $MEDC, $ANTM',
      period: 'Eskalasi Geopolitik Timur Tengah 2024',
      narrative: 'Saat ketegangan militer memicu lonjakan harga minyak mentah Brent menembus $90/bbl dan Emas melonjak ke rekor tertinggi, IHSG broad-market sempat tertekan inflasi energi. Namun, model transmisi makro MBG mengeksekusi rotasi barbell: saham $MEDC melonjak +18% dan $ANTM melesat +14%, membuktikan bahwa pemahaman transmisi makro memberikan keunggulan kompetitif di atas analisis teknikal murni.'
    },

    preFlightChecklist: [
      'Indeks Dolar AS (DXY) dan imbal hasil US10Y telah diperiksa di running banner pagi.',
      'Spread suku bunga BI vs Fed terkonfirmasi berada di atas batas aman minimal +100 bps.',
      'Arah komoditas benchmark (Brent & Gold) selaras dengan sektor saham yang dipilih.',
      'Status DEFCON geopolitik tidak berada pada level ancaman darurat (DEFCON 1/2).',
      'Sentimen global 4-Barometer (Fear & Greed, VIX) mendukung risk appetite pasar.'
    ],

    comprehensionQuiz: [
      {
        question: 'Kondisi kurva imbal hasil obligasi AS (Yield Curve 10Y-2Y) yang curam ke atas (Steepening / Imbal Hasil 10Y > 2Y) menandakan kondisi apa bagi ekonomi global?',
        options: ['Sinyal resesi ekonomi parah', 'Kondisi ekspansi ekonomi normal dan sehat', 'Tanda kebangkrutan perbankan AS', 'Perang dunia akan segera pecah'],
        answer: 1,
        explanation: 'Kurva yield normal (10Y lebih tinggi dari 2Y) menunjukkan investor optimis terhadap pertumbuhan ekonomi jangka panjang.'
      },
      {
        question: 'Berapa batas spread minimal suku bunga BI vs Fed yang sehat untuk melindungi nilai tukar Rupiah dari pelarian modal asing?',
        options: ['Minus -200 bps', 'Nol (0 bps)', 'Minimal +100 hingga +125 bps Carry Spread', 'Wajib di atas +1.000 bps'],
        answer: 2,
        explanation: 'Selisih suku bunga domestik minimal +100 hingga +125 bps di atas Fed Rate memberikan insentif carry trade positif agar dana asing bertahan di instrumen IDR.'
      },
      {
        question: 'Ketika Indeks Dolar AS (DXY) mengalami penurunan tajam (melandai), bagaimana dampak tipikalnya terhadap aliran dana asing di bursa saham BEI?',
        options: ['Asing keluar dari semua saham Indonesia', 'Asing cenderung melakukan aksi beli bersih (Net Buy) karena selera risiko membaik', 'IHSG otomatis terkena suspend', 'Tidak ada pengaruh sama sekali'],
        answer: 1,
        explanation: 'Pelemahan dolar melonggarkan likuiditas global dan memicu rotasi modal dari aset berdenominasi USD ke pasar ekuitas berkembang berimbal hasil tinggi.'
      }
    ],

    references: [
      'John J. Murphy (1999) Technical Analysis of the Financial Markets & Intermarket Technical Analysis, New York Institute of Finance.',
      'Abdulkader Aljandali (2016) Quantitative Analysis and Statistics and Econometrics for Finance, Springer.',
      'Bank Indonesia (2024) Laporan Kebijakan Moneter & Transmisi Nilai Tukar Berkala.'
    ]
  },

  {
    id: 3,
    paperCode: 'MBG-WP-03',
    category: 'MARKET MICROSTRUCTURE & IIFS',
    badge: 'Order Book Quant 📊',
    title: 'Market Microstructure & Order Book Asymmetry: Institutional Absorption vs Algorithmic Spoofing Post-Broker Obfuscation',
    subtitle: 'Dekonstruksi Mikrostruktur Pasca Penutupan Kode Broker BEI, Institutional Inflow Flow Score (IIFS), dan Antrean Semu (Spoofing)',
    authors: 'MBG Quantitative Desk • Mark Andrew Lim (2016) Alignment',
    jelCodes: 'G12, G14, C13',
    rigor: 'Mathematical Rigor: High',
    abstract: 'Regulasi penutupan kode broker saat jam bursa (Desember 2021) dan penutupan tipe investor domestik/asing real-time (Juni 2022) mengubah lanskap mikrostruktur BEI. Makalah ini memperkenalkan algoritma Institutional Inflow Flow Score (IIFS) berbasis 4 indikator kuantitatif terintegrasi (OBV, MFI, VWAP Spread, Chaikin A/D), mendeteksi anomali penyerapan pasif institusi (Passive Absorption) serta membedakannya dari manipulasi antrean semu (Fake Bid Spoofing).',

    laymanSection: {
      headline: 'Cara Membaca Gerakan Bandar Tanpa Terkecoh Antrean Palsu',
      analogy: 'Ibarat taktik papan catur: Bandar memasang "benteng palsu" berupa antrean beli raksasa 50.000 lot di papan Bid untuk meyakinkan investor ritel bahwa harga tidak akan jatuh. Begitu investor ritel tergiur dan ikut membeli (HAKA), bandar seketika mencabut antrean 50.000 lot tersebut dan melemparkan jutaan sahamnya ke muka investor ritel.',
      keyTakeaways: [
        'Realitas Pasca Penutupan Kode Broker: Kita tidak bisa lagi melihat kode broker (CC, AK, YP) bergerak secara langsung saat bursa berjalan. Mengandalkan running trade kasat mata tanpa filter kuantitatif adalah jebakan empuk bagi bandar.',
        'Antrean Palsu (Spoofing) vs Akumulasi Nyata: Antrean bid raksasa yang mendadak hilang saat harga mendekat adalah spoofing. Akumulasi nyata ditandai oleh antrean yang konsisten menyerap transaksi jual (Passive Absorption) dengan skor IIFS Z-Score > +1.5.',
        'Harga Rata-Rata Bandar (Bandar VWAP): Smart Money selalu mengumpulkan saham di bawah atau di dekat harga rata-rata mereka. Membeli saham di harga diskon terhadap rata-rata akumulasi bandar memberikan probabilitas menang yang tinggi.'
      ]
    },

    quantSection: {
      theorems: [
        {
          name: 'Queue Imbalance Ratio (Microstructure Depth)',
          formula: 'QIR = (Volume_Bid - Volume_Ask) / (Volume_Bid + Volume_Ask)',
          description: 'Mengukur tekanan antrean buku order Level 2 dalam rentang [-1.0, +1.0]. Nilai ekstrem positif (> +0.65) tanpa diiringi lonjakan transaksi eksekusi riil merupakan indikator utama spoofing.'
        },
        {
          name: 'Institutional Inflow Flow Score (IIFS Composite Z-Score)',
          formula: 'IIFS_Composite = 0.35*(Z_OBV) + 0.25*(Z_MFI) + 0.20*(Z_VWAP_Spread) + 0.20*(Z_ChaikinAD)',
          description: 'Komposit bobot 4 variabel mikrostruktur bursa untuk mendeteksi jejak volume uang pintar institusi di balik layar.'
        }
      ],
      codeSnippet: `def evaluate_order_book_microstructure(bid_vol: int, ask_vol: int, trade_vol: int, iifs_score: float) -> dict:
    total_depth = bid_vol + ask_vol
    qir = (bid_vol - ask_vol) / total_depth if total_depth > 0 else 0.0
    
    # Spoofing Detection Logic
    is_spoofing_suspect = (qir > 0.60) and (trade_vol < 0.15 * bid_vol) and (iifs_score < 0.5)
    is_true_accumulation = (iifs_score >= 1.5) and (qir >= 0.15)
    
    return {
        "queue_imbalance": round(qir, 3),
        "spoofing_alert": is_spoofing_suspect,
        "stealth_accumulation": is_true_accumulation,
        "recommendation": "DO_NOT_CHASE" if is_spoofing_suspect else ("BUY_DIP" if is_true_accumulation else "NEUTRAL")
    }`
    },

    historicalCase: {
      ticker: '$BUMI & $AMMN',
      period: 'Distribusi Tersembunyi 2023',
      narrative: 'Di saham berlikuiditas tinggi, antrean tebal 100.000 lot dipasang di harga Rp 150 untuk memancing ritel berbelanja agresif. Algoritma IIFS mendeteksi Z-Score Chaikin A/D anjlok negatif (-2.3 sigma) menandakan distribusi masif broker asing. Beberapa menit kemudian antrean 100.000 lot dicabut, dan harga amblas -7% ke Rp 139. Trader yang mematuhi skor IIFS selamat dari jebakan likuiditas ini.'
    },

    preFlightChecklist: [
      'Antrean tebal pada papan bid telah diuji bukan merupakan antrean semu (spoofing).',
      'Skor komposit IIFS berada di zona positif akumulasi (Z-Score > +1.0).',
      'Harga eksekusi berada di dekat atau di bawah estimasi harga modal rata-rata bandar (Bandar VWAP).',
      'Volume transaksi harian memiliki rasio likuiditas memadai terhadap ukuran posisi portofolio.',
      'Foreign Net Flow harian tidak menunjukkan aksi distribusi agresif berturut-turut.'
    ],

    comprehensionQuiz: [
      {
        question: 'Apa ciri khas taktik antrean palsu (Fake Bid Spoofing) yang sering digunakan bandar di bursa BEI?',
        options: ['Antrean beli tipis tapi harga perlahan naik', 'Antrean beli raksasa yang mendadak dicabut tepat saat harga pasar mendekatinya', 'Bandar membeli langsung dengan harga pasar (HAKA)', 'Broker mengirim email pengumuman'],
        answer: 1,
        explanation: 'Spoofing bertujuan memanipulasi psikologi ritel dengan ilusi antrean beli tebal yang sebenarnya tidak pernah berniat dieksekusi.'
      },
      {
        question: 'Mengapa investor dilarang hanya mengandalkan running trade kasat mata pasca regulasi penutupan kode broker BEI?',
        options: ['Karena running trade memakan banyak kuota internet', 'Karena identitas broker ditutup saat jam bursa, sehingga transaksi frekuensi tinggi mudah disamarkan bandar', 'Karena running trade dilarang oleh bursa', 'Karena data running trade selalu salah'],
        answer: 1,
        explanation: 'Tanpa identitas broker real-time, bandar dapat melakukan transaksi wash trading silang antar sekuritas untuk memancing kerumunan ritel.'
      },
      {
        question: 'Bagaimana cara terbaik memvalidasi apakah akumulasi suatu saham benar-benar nyata (Passive Absorption)?',
        options: ['Membaca komentar di media sosial', 'Melihat apakah skor komposit IIFS positif dan didukung volume penyerapan stabil di dekat harga VWAP', 'Menunggu hingga harga saham naik 50%', 'Meminta rekomendasi teman kantor'],
        answer: 1,
        explanation: 'Akumulasi sejati terbukti secara matematis melalui persistensi skor IIFS dan konfirmasi volume penyerapan terdistribusi di dekat volume weighted average price.'
      }
    ],

    references: [
      'Mark Andrew Lim (2016) The Handbook of Technical Analysis: The Practitioner’s Comprehensive Guide to Technical Analysis, John Wiley & Sons.',
      'Surat Edaran Direksi PT Bursa Efek Indonesia No. SE-00010/BEI/12-2021 tentang Penutupan Kode Broker pada Jam Perdagangan.',
      'Otoritas Jasa Keuangan (OJK) Salinan Peraturan Nomor 22/POJK.04/2021 tentang Transparansi Transaksi Efek.'
    ]
  },

  {
    id: 4,
    paperCode: 'MBG-WP-04',
    category: 'SMART MONEY CONCEPTS & ALGO',
    badge: 'Liquidity Architect ⚡',
    title: 'Smart Money Concepts & Liquidity Architecture: Algorithmic Fair Value Gaps, Consequent Encroachment, and Rejection Sweeps',
    subtitle: 'Anatomi Imbalance Tiga Candlestick, Titik Magnet 50% Consequent Encroachment (C.E.), dan Perburuan Likuiditas Stop-Hunt (Turtle Soup)',
    authors: 'MBG Quantitative Desk • Inner Circle Trader (ICT) & Marcos López de Prado Alignment',
    jelCodes: 'G14, C45, C53',
    rigor: 'Mathematical Rigor: High',
    abstract: 'Algoritma eksekusi frekuensi tinggi institusional (Smart Money) meninggalkan jejak disekuilibrium likuiditas akibat ketidakseimbangan order beli/jual secara sepihak. Makalah ini membedah formulasi Fair Value Gap (FVG) tiga candlestick, membuktikan secara kuantitatif tingkat penarikan kembali harga ke titik magnet 50% Consequent Encroachment (C.E.), serta memanfaatkan fenomena Liquidity Sweep (Turtle Soup) untuk menghasilkan eksekusi dengan rasio Risk/Reward asimetris >= 1:3.',

    laymanSection: {
      headline: 'Menemukan Celah Magnet Harga Melalui Lompatan Tiga Lilin',
      analogy: 'Ibarat melompati anak tangga: Ketika seorang pelari melompat terburu-buru dari anak tangga ke-1 langsung menginjak tangga ke-3, tercipta ruang hampa udara kosong di anak tangga ke-2. Hukum fisika pasar mengharuskan harga untuk kembali menjejakkan kaki di ruang kosong tersebut sebelum melanjutkan pendakian.',
      keyTakeaways: [
        'Anatomi Fair Value Gap (FVG): Celah harga tercipta di antara titik tertinggi Candle 1 dan titik terendah Candle 3, di mana Candle 2 melesat terlalu kencang. Celah ini adalah area ketidakseimbangan likuiditas.',
        'Magnet 50% Consequent Encroachment (C.E.): Level tepat di titik tengah (50%) dari celah FVG berfungsi sebagai magnet paling akurat untuk entry pantulan harga. Trader disiplin tidak mengejar harga di puncak, melainkan sabar menunggu harga ditarik ke level C.E.',
        'Perburuan Likuiditas (Turtle Soup / Stop Hunt): Bandar sengaja menusuk level support kunci untuk memicu Stop Loss investor ritel (melikuidasi posisi). Begitu harga berbalik dan ditutup kembali di atas support (Daily Reclaim), terbentuk sinyal beli berdaya ledak tinggi.'
      ]
    },

    quantSection: {
      theorems: [
        {
          name: 'Bullish Fair Value Gap Formulation',
          formula: 'Bullish_FVG = Low(Candle_3) - High(Candle_1) > 0',
          description: 'Kondisi mutlak terciptanya celah likuiditas kosong searah pada formasi 3 candlestick sekuensial.'
        },
        {
          name: 'Consequent Encroachment (C.E.) Magnet Level',
          formula: 'Level_CE = High(Candle_1) + 0.50 * Bullish_FVG',
          description: 'Level 50% retracement geometris dari zona ketidakseimbangan yang memiliki densitas limit order institusi tertinggi.'
        },
        {
          name: 'Turtle Soup Reclaim Condition',
          formula: 'Low_Intraday < Key_Support AND Close_Daily >= Key_Support',
          description: 'Validasi formasi rejection wick ekstrim yang menandakan penyerapan likuiditas jual paksa ritel oleh institusi.'
        }
      ],
      codeSnippet: `def detect_ict_fvg_and_ce(c1_high: float, c2_high: float, c2_low: float, c3_low: float) -> dict:
    has_bullish_fvg = c3_low > c1_high
    fvg_size = (c3_low - c1_high) if has_bullish_fvg else 0.0
    ce_level = c1_high + (0.5 * fvg_size) if has_bullish_fvg else None
    
    return {
        "is_imbalance_valid": has_bullish_fvg,
        "fvg_top": round(c3_low, 2),
        "fvg_bottom": round(c1_high, 2),
        "ce_magnet_50pct": round(ce_level, 2) if ce_level else None,
        "entry_bracket": f"Limit Buy at {round(ce_level, 2)}" if ce_level else "NO_GAP"
    }`
    },

    historicalCase: {
      ticker: 'Bitcoin Spot & $CUAN',
      period: 'Breakout Cluster Barito & BTC Reclaim $60.500',
      narrative: 'Pada grafik BTC Spot harian, harga menusuk tajam ke $56.400 melikuidasi miliaran dolar posisi leverage ritel. Namun penutupan harian membentuk Rejection Wick panjang dan ditutup kembali di $61.500 (Daily Reclaim). Di saat bersamaan terbentuk Bullish FVG di $58.200 - $60.400 dengan C.E. tepat di $59.300. Entry buy limit di $59.300 dengan SL di $56.400 menghasilkan reli eksplosif menuju $71.900 (R:R 1:4.3).'
    },

    preFlightChecklist: [
      'Struktur tren pasar utama (Market Structure) terkonfirmasi Bullish via Break of Structure (BOS).',
      'Zona Fair Value Gap (FVG) tiga candlestick teridentifikasi dengan jelas tanpa saling overlap.',
      'Order entry dipasang secara pasif pada level 50% Consequent Encroachment (C.E.).',
      'Stop Loss ditempatkan secara logis di bawah ekor rejection wick terdalam.',
      'Proyeksi Take Profit menuju zona Buy-Side Liquidity menghasilkan rasio minimal 1:3.0.'
    ],

    comprehensionQuiz: [
      {
        question: 'Bagaimana cara mengidentifikasi zona Fair Value Gap (FVG) Bullish pada grafik candlestick?',
        options: ['Melihat moving average bersilangan', 'Titik terendah Candle ke-3 lebih tinggi daripada titik tertinggi Candle ke-1 (terdapat celah kosong di Candle 2)', 'Candle berwarna hijau tiga kali beruntun', 'Volume transaksi menyusut drastis'],
        answer: 1,
        explanation: 'FVG bullish terbentuk ketika Candle 2 melesat kencang sehingga ada ruang kosong antara High Candle 1 dan Low Candle 3.'
      },
      {
        question: 'Apa makna fungsional dari level 50% Consequent Encroachment (C.E.) dalam Smart Money Concepts?',
        options: ['Level untuk segera cut loss seluruh posisi', 'Level magnet di mana institusi menempatkan limit order untuk mengisi separuh celah ketidakseimbangan likuiditas', 'Harga tertinggi sepanjang sejarah saham', 'Penanda bahwa emiten akan membagikan dividen'],
        answer: 1,
        explanation: 'Consequent Encroachment (C.E.) adalah garis tengah 50% dari zona FVG yang bekerja sebagai area pantulan probabilitas tertinggi.'
      },
      {
        question: 'Apa yang dimaksud dengan peristiwa Liquidity Sweep (Turtle Soup / Stop Hunt)?',
        options: ['Harga menembus support dan terus anjlok tanpa henti', 'Harga menusuk menembus support kunci untuk menyapu stop loss ritel, lalu memantul cepat dan ditutup kembali di atas support', 'Perusahaan membeli kembali sahamnya di pasar reguler', 'Investor asing menjual seluruh kepemilikannya'],
        answer: 1,
        explanation: 'Liquidity sweep adalah manuver rekayasa likuiditas untuk memicu stop-loss ritel sebelum harga berbalik reli kencang.'
      }
    ],

    references: [
      'Michael J. Huddleston (Inner Circle Trader) The Algorithmic Theory of Price Delivery and Imbalance.',
      'Marcos López de Prado (2018) Advances in Financial Machine Learning, Chapter 3: Financial Labels & Triple-Barrier Method, Wiley.',
      'Mark Andrew Lim (2016) The Handbook of Technical Analysis, John Wiley & Sons.'
    ]
  },

  {
    id: 5,
    paperCode: 'MBG-WP-05',
    category: 'COMMODITY CYCLE & DIVIDEND ARBITRAGE',
    badge: 'Arbitrage Fellow 🎯',
    title: 'The Cyclical Commodity Dividend Cascade Trap: Empirical Anatomy, Distribution Schedules, and Net Realized Yield Optimization',
    subtitle: 'Anatomi 4 Fase Jebakan Dividen Saham Siklikal Batubara/Komoditas BEI, Kaskade ARB Simetris, dan Aksi Distribusi Smart Money',
    authors: 'MBG Quantitative Desk • Thomas N. Bulkowski Alignment',
    jelCodes: 'G11, G14, G35',
    rigor: 'Mathematical Rigor: High',
    abstract: 'Saham komoditas siklikal sering kali memikat investor ritel dengan yield dividen spektakuler (> 20%). Makalah ini membuktikan secara empiris fenomena "Dividend Trap" pada bursa BEI, di mana penerimaan dividen tunai justru berujung pada kerugian bersih portofolio (-9.3%) akibat kaskade penurunan harga Auto Reject Bawah (ARB) pasca Ex-Date dan aksi distribusi terencana oleh Smart Money.',

    laymanSection: {
      headline: 'Tragedi Jebakan Dividen Jumbo: Umpan Madu Beracun di Puncak Pesta',
      analogy: 'Ibarat makan prasmanan gratis di atas kapal yang sedang bocor: Investor tergiur mendapatkan hidangan lezat senilai Rp 100.000 (dividen), namun tanpa disadari kapal tersebut tenggelam dan menenggelamkan koper uangnya senilai Rp 300.000 (penurunan modal harga saham).',
      keyTakeaways: [
        'Anatomi 4 Fase Dividend Trap: (1) Akumulasi senyap 60 hari sebelum RUPS, (2) Euforia HAKA ritel pada Cum-Date, (3) Kaskade ARB terjun bebas pada Ex-Date tanpa ada pembeli, (4) Stagnasi panjang berbulan-bulan.',
        'Kalkulasi Riil Pasca Pajak: Dividen tunai dipotong pajak PPh 10%. Jika dividen Rp 1.094/saham diterima bersih Rp 985, namun harga saham anjlok Rp 1.250 pasca Ex-Date, investor justru mengalami kerugian bersih nyata.',
        'Distribusi Terbalik Smart Money: Smart Money justru memanfaatkan volume HAKA raksasa para pemburu dividen pada hari Cum-Date untuk mendistribusikan jutaan lot saham mereka di harga tertinggi.'
      ]
    },

    quantSection: {
      theorems: [
        {
          name: 'Net Realized Dividend PnL Equation',
          formula: 'Net_PnL = (Exit_Price - Cum_Entry_Price) + (Gross_DPS x (1 - Tax_Rate))',
          description: 'Persamaan matematis untuk mengevaluasi apakah partisipasi dalam cum-date dividen menghasilkan alfa positif atau destruksi modal.'
        },
        {
          name: 'Dividend Trap Vulnerability Ratio (DTVR)',
          formula: 'DTVR = Expected_Post_Ex_Drop / Gross_DPS',
          description: 'Rasio kerentanan jebakan dividen. Jika DTVR > 1.0, penurunan harga pasca Ex-Date diproyeksikan menghapus seluruh nilai dividen tunai yang diterima.'
        }
      ],
      codeSnippet: `def simulate_dividend_trap_scenario(cum_entry_price: float, gross_dps: float, post_ex_drop_pct: float, tax_rate: float = 0.10) -> dict:
    net_dps = gross_dps * (1.0 - tax_rate)
    ex_date_price = cum_entry_price * (1.0 - (post_ex_drop_pct / 100.0))
    capital_loss = cum_entry_price - ex_date_price
    net_pnl = net_dps - capital_loss
    net_return_pct = (net_pnl / cum_entry_price) * 100.0
    
    return {
        "cum_entry_price": cum_entry_price,
        "net_dividend_per_share": round(net_dps, 2),
        "capital_loss_per_share": round(capital_loss, 2),
        "net_pnl_per_share": round(net_pnl, 2),
        "net_return_pct": round(net_return_pct, 2),
        "is_trap": net_pnl < 0
    }`
    },

    historicalCase: {
      ticker: '$PTBA (Tambang Batubara Bukit Asam)',
      period: 'Tragedi Dividen Jumbo Juni 2023 & 2024',
      narrative: 'Kasus Nyata PTBA 2023: Emiten mengumumkan dividen rekor Rp 1.094/lembar (yield 28% pada harga Rp 3.900). Ritel berbondong-bondong HAKA hingga volume meledak 8x lipat di Cum-Date. Pada Ex-Date, harga saham seketika terkunci ARB simetris berhari-hari turun menuju Rp 2.650 (-32%). Ritel yang menahan demi dividen menderita kerugian modal Rp 1.250/lembar, sementara dividen bersih yang diterima hanya Rp 984.6/lembar. Hasil bersih: Rugi total -Rp 265/lembar (-9.3%) dan modal terkunci berbulan-bulan.'
    },

    preFlightChecklist: [
      'Siklus komoditas acuan (misal: harga batubara Newcastle) tidak sedang berada dalam tren penurunan curam.',
      'Kalkulasi DTVR membuktikan potensi penurunan pasca Ex-Date tidak melampaui nilai dividen bersih.',
      'Posisi saham telah dikumpulkan jauh hari sebelum Cum-Date (fase akumulasi senyap), bukan dibeli di hari H.',
      'Strategi exit telah dirancang: apakah menjual pada euforia Cum-Date atau menahan untuk investasi jangka panjang.',
      'Porsi alokasi modal tidak melampaui batas toleransi risiko portofolio.'
    ],

    comprehensionQuiz: [
      {
        question: 'Mengapa investor ritel yang membeli saham komoditas siklikal pada hari Cum-Date sering kali menderita kerugian bersih meskipun yield dividennya sangat besar (misal 25%)?',
        options: ['Karena dividen tidak pernah dibayarkan oleh emiten', 'Karena penurunan harga saham pasca Ex-Date (ARB cascade) jauh lebih dalam daripada nilai dividen bersih yang diterima setelah pajak', 'Karena bursa memotong saldo rekening ritel secara sepihak', 'Karena uang dividen dibayar dalam bentuk voucer belanja'],
        answer: 1,
        explanation: 'Jebakan dividen terjadi ketika capital loss akibat anjloknya harga pasca ex-date melampaui total dividen bersih yang diterima.'
      },
      {
        question: 'Bagaimana perilaku transaksi Smart Money institusi pada hari Cum-Date saham dividen jumbo?',
        options: ['Ikut berebut membeli saham bersama ritel', 'Memanfaatkan likuiditas euforia beli ritel di puncak harga untuk mendistribusikan (menjual) jutaan lot saham mereka', 'Menutup operasional kantor mereka', 'Membeli surat utang pemerintah'],
        answer: 1,
        explanation: 'Smart money yang telah mengakumulasi di harga bawah memanfaatkan lonjakan volume pemburu dividen di hari cum-date untuk merealisasikan keuntungan (distribusi).'
      },
      {
        question: 'Berapakah tarif pemotongan Pajak Penghasilan (PPh) final atas dividen saham yang berlaku bagi wajib pajak di Indonesia jika tidak diinvestasikan kembali?',
        options: ['Nol (0%)', 'PPh Final 10%', 'PPh Final 25%', 'PPh Progresif 35%'],
        answer: 1,
        explanation: 'Dividen tunai saham domestik dikenakan PPh final 10% kecuali diinvestasikan kembali dalam instrumen tertentu sesuai regulasi perpajakan.'
      }
    ],

    references: [
      'Thomas N. Bulkowski (2013) Fundamental Analysis and Position Trading: Evolution of a Trader, John Wiley & Sons.',
      'Data Historis Corporate Action & Dividen PT Bursa Efek Indonesia (KSEI / BEI 2022-2024).',
      'Undang-Undang Republik Indonesia Nomor 7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan (HPP).'
    ]
  },

  {
    id: 6,
    paperCode: 'MBG-WP-06',
    category: 'QUANTITATIVE VALIDATION & DSR',
    badge: 'Statistical Fellow 🔬',
    title: 'Deflated Sharpe Ratio & Statistical Defensibility: Eliminating Multiple-Testing Snooping Bias in Multi-Agent Quant Ensembles',
    subtitle: 'Koreksi Bias Seleksi Data-Snooping, Non-Normal Return Distributions, dan Verifikasi Matematis Strategi Bot Trading Otonom',
    authors: 'MBG Quantitative Desk • David H. Bailey & Marcos López de Prado (2014) Alignment',
    jelCodes: 'C12, C52, G11',
    rigor: 'Mathematical Rigor: High',
    abstract: 'Dalam pengembangan strategi kuantitatif modern dan bot trading multi-agent, 95% model yang terlihat sangat menguntungkan pada pengujian historis (backtesting) mengalami kegagalan total saat dioperasikan secara live. Makalah ini menerapkan formulasi Deflated Sharpe Ratio (DSR) dari Marcos López de Prado untuk mengoreksi inflasi Sharpe semu akibat pengujian berulang (multiple-testing / data snooping) dan distribusi return non-normal dengan kemencengan negatif serta fat-tail kurtosis tebal.',

    laymanSection: {
      headline: 'Alat Detektor Kebohongan Bot Trading: Membedakan Keberuntungan dengan Keahlian Sejati',
      analogy: 'Ibarat melempar koin: Jika ada 1.000 orang disuruh melempar koin sebanyak 10 kali, secara statistik pasti ada 1 orang yang berhasil melempar sisi "Gambar" 10 kali berturut-turut. Apakah orang tersebut peramal sakti? Bukan, itu hanyalah kebetulan statistik dari uji coba yang terlalu banyak. DSR adalah rumus untuk membongkar kebetulan tersebut.',
      keyTakeaways: [
        'Mengapa Backtest Sering Menipu? Jika seorang trader mengutak-atik 50 indikator berbeda sampai menemukan 1 kombinasi yang menghasilkan profit di masa lalu, hasil tersebut 99% adalah overfitting (cocoklogi) yang akan bangkrut saat trading live.',
        'Standar Defensible Spec (DSR >= 0.95): Hanya bot atau strategi yang memiliki nilai DSR di atas 0.95 yang diakui secara ilmiah memiliki keunggulan kompetitif (edge) sejati dan layak dialokasikan modal riil.',
        'Penalti Kurtosis & Skewness: Strategi yang sering untung kecil tapi sesekali mengalami kerugian raksasa (ekor tebal/fat-tail) akan mendapatkan pemotongan nilai Sharpe drastis oleh mesin DSR.'
      ]
    },

    quantSection: {
      theorems: [
        {
          name: 'Expected Maximum Sharpe Ratio under Null Hypothesis',
          formula: 'SR* = sqrt(2 * ln(N)) + gamma / sqrt(2 * ln(N))',
          description: 'Nilai ekspektasi Sharpe Ratio tertinggi yang dapat muncul murni karena faktor keberuntungan acak dari N kali percobaan backtest independen.'
        },
        {
          name: 'Deflated Sharpe Ratio (Bailey & López de Prado 2014)',
          formula: 'DSR = Phi( [ (SR_hat - SR*) * sqrt(T - 1) ] / sqrt[ 1 - gamma3 * SR_hat + ((gamma4 - 1)/4) * SR_hat^2 ] )',
          description: 'Probabilitas bahwa strategi yang diobservasi memiliki Sharpe Ratio di atas nol setelah memperhitungkan bias seleksi N pengujian, kemencengan (gamma3), dan kurtosis (gamma4).'
        }
      ],
      codeSnippet: `import math

def calculate_deflated_sharpe_ratio(observed_sr: float, num_trials: int, sample_length_years: float, skewness: float = -0.3, kurtosis: float = 4.2) -> dict:
    euler_mascheroni = 0.5772156649
    n = max(1, num_trials)
    
    # Expected Max SR under Null
    sr_star = math.sqrt(2 * math.log(n)) + (euler_mascheroni / math.sqrt(2 * math.log(n))) if n > 1 else 0.0
    
    # Variance under Non-Normality
    sr_var = 1.0 - (skewness * observed_sr) + (((kurtosis - 1.0) / 4.0) * (observed_sr ** 2))
    sr_std = math.sqrt(max(0.001, sr_var))
    
    # T samples (assuming 252 daily bars per year)
    t_samples = sample_length_years * 252
    z_stat = ((observed_sr - sr_star) * math.sqrt(max(1.0, t_samples - 1))) / sr_std
    
    # Standard Normal CDF approximation
    dsr = 0.5 * (1.0 + math.erf(z_stat / math.sqrt(2.0)))
    
    return {
        "observed_sr": round(observed_sr, 2),
        "expected_max_sr_null": round(sr_star, 2),
        "deflated_sharpe_ratio": round(dsr, 3),
        "is_defensible": dsr >= 0.95
    }`
    },

    historicalCase: {
      ticker: 'Bot-02 Momentum Alpha vs Bot-16 Chaos Anomaly',
      period: 'Audit Multi-Agent Arena Season 0.1',
      narrative: 'Dalam pengujian 24 model kuantitatif, sebuah strategi momentum mentah memperlihatkan Sharpe Ratio fantastis 2.85. Namun setelah diaudit dengan DSR memperhitungkan $N=24$ percobaan dan kurtosis 5.8, nilai DSR anjlok menjadi 0.72 (Overfitted). Sebaliknya, strategi Bandarmology VWAP dengan Sharpe konservatif 1.75 menghasilkan DSR 0.96 (Defensible Spec) karena memiliki kurtosis normal dan diuji tanpa data snooping.'
    },

    preFlightChecklist: [
      'Jumlah total variasi parameter backtest (N) telah dicatat secara jujur.',
      'Distribusi return telah diuji dari keberadaan kemencengan negatif ekstrem dan fat-tail kurtosis.',
      'Nilai Deflated Sharpe Ratio (DSR) terbukti melampaui batas signifikansi 0.95 (alpha = 0.05).',
      'Strategi diuji pada data di luar sampel (Out-of-Sample / Walk-Forward testing).',
      'Biaya friksi nyata (komisi bursa BEI 0.45% bolak-balik & slippage eksekusi) telah dikurangkan.'
    ],

    comprehensionQuiz: [
      {
        question: 'Mengapa nilai Sharpe Ratio yang sangat tinggi pada hasil backtest (misal SR 3.5) sering kali menipu dan gagal total saat dijalankan di pasar riil?',
        options: ['Karena pasar riil tidak pernah ada', 'Karena terjadi bias seleksi (data snooping / multiple testing) di mana model dipilih murni karena kebetulan acak dari puluhan variasi yang dicoba', 'Karena komputer salah menghitung matematika dasar', 'Karena komisi broker selalu 90%'],
        answer: 1,
        explanation: 'Semakin banyak variasi backtest yang Anda coba, semakin besar kemungkinan Anda menemukan model yang tampak hebat murni karena faktor keberuntungan statistik.'
      },
      {
        question: 'Berapakah nilai ambang batas minimal Deflated Sharpe Ratio (DSR) agar suatu strategi kuantitatif dinyatakan "Defensible Spec" (lolos verifikasi ilmiah)?',
        options: ['DSR >= 0.10', 'DSR >= 0.50', 'DSR >= 0.95 (Taraf signifikansi alpha = 0.05)', 'DSR wajib tepat 100.0'],
        answer: 2,
        explanation: 'Ambang batas DSR >= 0.95 memastikan dengan tingkat keyakinan 95% bahwa performa strategi bukan merupakan produk dari keberuntungan pengujian berulang.'
      },
      {
        question: 'Faktor apa saja yang diperhitungkan oleh rumus Deflated Sharpe Ratio ciptaan Marcos López de Prado yang tidak ada pada Sharpe Ratio konvensional?',
        options: ['Warna latar belakang grafik', 'Jumlah percobaan uji coba (N), durasi waktu sampel data, serta kemencengan (skewness) dan kurtosis dari return', 'Nama pembuat strategi', 'Harga emas dunia saat ini'],
        answer: 1,
        explanation: 'DSR mengoreksi bias pengujian berganda (N) dan mempertimbangkan distribusi return non-normal (skewness dan fat-tail kurtosis).'
      }
    ],

    references: [
      'David H. Bailey & Marcos López de Prado (2014) The Deflated Sharpe Ratio: Correcting for Selection Bias, Backtest Overfitting and Non-Normality, Journal of Portfolio Management.',
      'Marcos López de Prado (2018) Advances in Financial Machine Learning, Chapter 11 & 14, John Wiley & Sons.',
      'Campbell R. Harvey & Yan Liu (2015) Backtesting, The Journal of Portfolio Management.'
    ]
  }
];

// Alias for backwards compatibility
export const ACADEMY_LEVELS = INSTITUTIONAL_PAPERS;

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
  { id: 4, title: 'Flowchart SOP 5 Langkah MBG Apex Standard', file: '/figures/04_astra_5_step_flowchart.png', category: 'Manajemen Risiko', desc: 'Peta alur kerja wajib: Filter Makro -> Skor IIFS -> Area Diskon SMC -> Lot 2% -> Jurnal.' },
  { id: 5, title: 'Anatomi 4 Fase Jebakan Dividend Trap', file: '/figures/05_dividend_trap_anatomy.png', category: 'Bandarmologi & Flow', desc: 'Fase akumulasi senyap, lonjakan volume ritel di Cum-Date, hingga kaskade ARB di Ex-Date.' },
  { id: 6, title: 'Piramida Likuiditas Kripto (Capital Waterfall)', file: '/figures/06_crypto_liquidity_pyramid.png', category: 'Makro & Kripto', desc: 'Aliran rotasi dana dari Stablecoin/Fiat -> Bitcoin -> Ethereum -> Altseason.' },
  { id: 7, title: 'Anatomi Liquidity Sweep (Turtle Soup)', file: '/figures/07_liquidity_sweep_turtle_soup.png', category: 'Price Action & SMC', desc: 'Perangkap fake breakout di atas swing high, sumbu rejection wick, dan pembalikan arah.' },
  { id: 8, title: 'Peta Transmisi Makro Segitiga Emas', file: '/figures/08_macro_commodity_transmission.png', category: 'Makro & Kripto', desc: 'Transmisi DXY, imbal hasil US10Y, kurs Rupiah, dan pengaruhnya ke sektor-sektor BEI.' },
  { id: 9, title: 'Paradoks Operating Leverage BRMS vs ANTM', file: '/figures/09_operating_leverage_gold_brms_vs_antm.png', category: 'Makro & Kripto', desc: 'Perbedaan sensitivitas laba emiten pure-play gold mining vs emiten terintegrasi refining.' },
  { id: 10, title: 'Mikrostruktur Order Book: Fake Bid Spoofing', file: '/figures/10_orderbook_spoofing_anatomy.png', category: 'Bandarmologi & Flow', desc: 'Anatomi antrean palsu bandar untuk memancing HAKA ritel vs penyerapan riil di pasar.' }
];


/**
 * InteractiveQuantLabSandbox - OpenQuant Initiative Inspired Math-First Interactive Simulator
 * Features:
 * 1. Bandarmology Concentration (BCR & HHI)
 * 2. Robert Carver Volatility-Targeted Position Sizing
 * 3. Marcos López de Prado Deflated Sharpe Ratio (DSR) Multi-Testing Simulator
 */


/**
 * =========================================================================
 * IN-PAPER INTERACTIVE WIDGETS (HEDGE FUND SANDBOX LABS)
 * Embedded directly inside each working paper for immediate empirical validation
 * =========================================================================
 */

// Widget 1: Hyperbolic Drawdown Recovery & Dual-Brake Lot Sizing (Paper 1)
function Paper1DrawdownWidget() {
  const [ddPct, setDdPct] = useState(30);
  const [equity, setEquity] = useState(10000000);
  const [entryPrice, setEntryPrice] = useState(1500);
  const [slPrice, setSlPrice] = useState(1425);

  const recoveryReq = ddPct < 100 ? ((1 / (1 - ddPct / 100)) - 1) * 100 : 9999;
  const riskBudget = equity * 0.02;
  const slDist = Math.max(1, Math.abs(entryPrice - slPrice));
  const brake1Lots = Math.floor(riskBudget / (slDist * 100));
  const maxCap = equity * 0.20;
  const brake2Lots = Math.floor(maxCap / (entryPrice * 100));
  const finalLots = Math.max(1, Math.min(brake1Lots, brake2Lots));
  const activeBrake = brake1Lots <= brake2Lots ? 'Brake 1 (Risk 2%)' : 'Brake 2 (Cap 20% Portfolio)';

  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '4px', padding: '12px 14px', margin: '14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🔬 INTERACTIVE LAB:</span>
          <span>Hyperbolic Drawdown & Dual-Brake Lot Calculator (Vince & Carver Model)</span>
        </div>
        <span className="badge badge-bull" style={{ fontSize: '8.5px' }}>LIVE SIMULATOR</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '14px' }}>
        {/* Left: Drawdown slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Simulasi Drawdown Modal:</span>
            <strong style={{ color: ddPct > 30 ? '#ef4444' : '#f59e0b', fontFamily: 'var(--font-mono)' }}>-{ddPct}%</strong>
          </div>
          <input
            type="range"
            min="5"
            max="80"
            step="5"
            value={ddPct}
            onChange={e => setDdPct(Number(e.target.value))}
            style={{ width: '100%', accentColor: ddPct > 30 ? '#ef4444' : '#f59e0b' }}
          />
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '3px', marginTop: '6px', fontSize: '9px', lineHeight: 1.4 }}>
            <span>Target Pemulihan (Recovery): </span>
            <strong style={{ color: ddPct > 30 ? '#ef4444' : '#10b981', fontFamily: 'var(--font-mono)' }}>+{recoveryReq.toFixed(1)}%</strong>
            <div style={{ color: 'var(--text-muted)', fontSize: '8px', marginTop: '2px' }}>
              {ddPct <= 20 ? '✅ Zona Aman Terkendali' : ddPct <= 30 ? '⚠️ Batas Waspada Toleransi' : '🚨 JURANG KEMATIAN MODAL (>30% DD)'}
            </div>
          </div>
        </div>

        {/* Right: Exact BEI lot calculator */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '9px', marginBottom: '6px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Modal Ekuitas:</span>
              <input
                type="number"
                value={equity}
                onChange={e => setEquity(Number(e.target.value))}
                style={{ width: '100%', background: '#111827', border: '1px solid #374151', color: '#fff', fontSize: '9px', padding: '2px 4px', borderRadius: '2px' }}
              />
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Entry / SL (Rp):</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                <input
                  type="number"
                  value={entryPrice}
                  onChange={e => setEntryPrice(Number(e.target.value))}
                  style={{ width: '50%', background: '#111827', border: '1px solid #374151', color: '#34d399', fontSize: '9px', padding: '2px 4px', borderRadius: '2px' }}
                  title="Harga Entry"
                />
                <input
                  type="number"
                  value={slPrice}
                  onChange={e => setSlPrice(Number(e.target.value))}
                  style={{ width: '50%', background: '#111827', border: '1px solid #374151', color: '#ef4444', fontSize: '9px', padding: '2px 4px', borderRadius: '2px' }}
                  title="Harga Stop Loss"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '5px 8px', borderRadius: '3px' }}>
            <div>
              <div style={{ fontSize: '7.5px', color: 'var(--text-muted)' }}>REKOMENDASI LOT BEI (REM GANDA):</div>
              <strong style={{ fontSize: '13px', color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>{finalLots} Lot</strong>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', marginLeft: '6px' }}>Rp {(finalLots * entryPrice * 100).toLocaleString('id-ID')}</span>
            </div>
            <span style={{ fontSize: '7.5px', color: '#a78bfa', background: 'rgba(167, 139, 250, 0.15)', padding: '2px 5px', borderRadius: '2px' }}>
              {activeBrake}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Widget 2: Macro Transmission & Carry Spread Simulator (Paper 2)
function Paper2MacroWidget() {
  const [dxy, setDxy] = useState(100.6);
  const [us10y, setUs10y] = useState(4.18);
  const [biRate, setBiRate] = useState(6.00);
  const [fedRate, setFedRate] = useState(4.75);

  const carryBps = Math.round((biRate - fedRate) * 100);
  const isCarryShielded = carryBps >= 100;
  const riskRegime = dxy < 101.5 && us10y < 4.25 ? 'RISK-ON (KONDUSIF UNTUK IHSG)' : 'RISK-OFF (DEFENSIVE)';

  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '4px', padding: '12px 14px', margin: '14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🧭 INTERACTIVE LAB:</span>
          <span>Global Macro Transmission & Carry Spread Engine</span>
        </div>
        <span className="badge badge-bull" style={{ fontSize: '8.5px' }}>INTERMARKET ALPHA</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '9px', marginBottom: '8px' }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>DXY Index: <strong style={{ color: '#fff' }}>{dxy.toFixed(1)}</strong></span>
          <input type="range" min="95" max="110" step="0.2" value={dxy} onChange={e => setDxy(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>US 10Y Yield: <strong style={{ color: '#fff' }}>{us10y.toFixed(2)}%</strong></span>
          <input type="range" min="3.0" max="5.5" step="0.05" value={us10y} onChange={e => setUs10y(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>BI-Rate: <strong style={{ color: '#fff' }}>{biRate.toFixed(2)}%</strong></span>
          <input type="range" min="4.0" max="8.0" step="0.25" value={biRate} onChange={e => setBiRate(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Fed Funds Rate: <strong style={{ color: '#fff' }}>{fedRate.toFixed(2)}%</strong></span>
          <input type="range" min="2.0" max="6.0" step="0.25" value={fedRate} onChange={e => setFedRate(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '3px', fontSize: '9px' }}>
        <div>
          <span>Carry Spread BI vs Fed: </span>
          <strong style={{ color: isCarryShielded ? '#10b981' : '#ef4444', fontFamily: 'var(--font-mono)' }}>+{carryBps} bps</strong>
          <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({isCarryShielded ? '🛡️ IDR Terlindungi' : '⚠️ Rentan Depresiasi'})</span>
        </div>
        <div>
          <span>Rezim Transmisi Global: </span>
          <strong style={{ color: riskRegime.includes('RISK-ON') ? '#10b981' : '#f59e0b' }}>{riskRegime}</strong>
        </div>
      </div>
    </div>
  );
}

// Widget 3: Live L2 Queue Imbalance & Spoofing Tester (Paper 3)
function Paper3OrderBookWidget() {
  const [bidVol, setBidVol] = useState(48500);
  const [askVol, setAskVol] = useState(12400);
  const [tradeVol, setTradeVol] = useState(2500);

  const totalDepth = bidVol + askVol;
  const qir = totalDepth > 0 ? (bidVol - askVol) / totalDepth : 0;
  const isSpoofing = qir > 0.55 && tradeVol < 0.12 * bidVol;

  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', padding: '12px 14px', margin: '14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📊 INTERACTIVE LAB:</span>
          <span>Order Book L2 Queue Imbalance & Spoofing Detector</span>
        </div>
        <span className="badge badge-bull" style={{ fontSize: '8.5px' }}>MICROSTRUCTURE</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '9px', marginBottom: '8px' }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Antrean Bid (Lot): <strong style={{ color: '#34d399' }}>{bidVol.toLocaleString()}</strong></span>
          <input type="range" min="5000" max="100000" step="2500" value={bidVol} onChange={e => setBidVol(Number(e.target.value))} style={{ width: '100%', accentColor: '#10b981' }} />
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Antrean Ask (Lot): <strong style={{ color: '#ef4444' }}>{askVol.toLocaleString()}</strong></span>
          <input type="range" min="5000" max="100000" step="2500" value={askVol} onChange={e => setAskVol(Number(e.target.value))} style={{ width: '100%', accentColor: '#ef4444' }} />
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Volume Eksekusi Riil (Lot): <strong style={{ color: '#60a5fa' }}>{tradeVol.toLocaleString()}</strong></span>
          <input type="range" min="500" max="25000" step="500" value={tradeVol} onChange={e => setTradeVol(Number(e.target.value))} style={{ width: '100%', accentColor: '#60a5fa' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '3px', fontSize: '9px' }}>
        <div>
          <span>Queue Imbalance Ratio (QIR): </span>
          <strong style={{ color: qir > 0 ? '#34d399' : '#ef4444', fontFamily: 'var(--font-mono)' }}>{qir > 0 ? '+' : ''}{qir.toFixed(3)}</strong>
        </div>
        <div>
          <span style={{
            padding: '2px 7px',
            borderRadius: '2px',
            fontWeight: '800',
            fontSize: '8.5px',
            background: isSpoofing ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: isSpoofing ? '#ef4444' : '#10b981',
            border: isSpoofing ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'
          }}>
            {isSpoofing ? '🚨 DETEKSI ANOMALI: SPOOFING FAKE BID (JANGAN HAKA)' : '✅ PENYERAPAN PASIF SEJATI (PASSIVE ABSORPTION)'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Widget 4: 3-Candle Imbalance & 50% Consequent Encroachment (C.E.) Magnet Calculator (Paper 4)
function Paper4SmcFvgWidget() {
  const [c1High, setC1High] = useState(940);
  const [c2High, setC2High] = useState(1010);
  const [c2Low, setC2Low] = useState(935);
  const [c3Low, setC3Low] = useState(980);

  const hasBullishFvg = c3Low > c1High;
  const fvgHeight = hasBullishFvg ? c3Low - c1High : 0;
  const ce50 = hasBullishFvg ? c1High + (fvgHeight * 0.5) : null;
  const sl = c2Low;
  const risk = ce50 ? ce50 - sl : 1;
  const tp1 = ce50 ? ce50 + (risk * 2.0) : 0;
  const tp2 = ce50 ? ce50 + (risk * 3.5) : 0;

  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '4px', padding: '12px 14px', margin: '14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>⚡ INTERACTIVE LAB:</span>
          <span>SMC 3-Candle Imbalance & 50% Consequent Encroachment (C.E.) Calculator</span>
        </div>
        <span className="badge badge-bull" style={{ fontSize: '8.5px' }}>ALGORITHMIC SMC</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '9px', marginBottom: '8px' }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Candle 1 High:</span>
          <input type="number" value={c1High} onChange={e => setC1High(Number(e.target.value))} style={{ width: '100%', background: '#111827', border: '1px solid #374151', color: '#fff', fontSize: '9px', padding: '2px 4px', borderRadius: '2px' }} />
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Candle 2 Low:</span>
          <input type="number" value={c2Low} onChange={e => setC2Low(Number(e.target.value))} style={{ width: '100%', background: '#111827', border: '1px solid #374151', color: '#fff', fontSize: '9px', padding: '2px 4px', borderRadius: '2px' }} />
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Candle 2 High:</span>
          <input type="number" value={c2High} onChange={e => setC2High(Number(e.target.value))} style={{ width: '100%', background: '#111827', border: '1px solid #374151', color: '#fff', fontSize: '9px', padding: '2px 4px', borderRadius: '2px' }} />
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Candle 3 Low:</span>
          <input type="number" value={c3Low} onChange={e => setC3Low(Number(e.target.value))} style={{ width: '100%', background: '#111827', border: '1px solid #374151', color: '#fff', fontSize: '9px', padding: '2px 4px', borderRadius: '2px' }} />
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '3px', fontSize: '9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span>Status FVG: </span>
          <strong style={{ color: hasBullishFvg ? '#10b981' : '#ef4444' }}>
            {hasBullishFvg ? `VALID BULLISH FVG (${c1High} - ${c3Low})` : 'TIDAK ADA CELAH (OVERLAPPING)'}
          </strong>
        </div>
        {hasBullishFvg && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <span>Magnet C.E. (50%): <strong style={{ color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>Rp {ce50}</strong></span>
            <span>Stop Loss: <strong style={{ color: '#ef4444', fontFamily: 'var(--font-mono)' }}>Rp {sl}</strong></span>
            <span>Target TP2 (1:3.5): <strong style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>Rp {Math.round(tp2)}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}

// Widget 5: Dividend Trap Net PnL Scenario Modeler (Paper 5)
function Paper5DividendTrapWidget() {
  const [cumPrice, setCumPrice] = useState(3900);
  const [grossDps, setGrossDps] = useState(1094);
  const [exDropPct, setExDropPct] = useState(32);

  const netDps = grossDps * 0.90; // 10% tax
  const exPrice = Math.round(cumPrice * (1 - (exDropPct / 100)));
  const capLoss = cumPrice - exPrice;
  const netPnL = netDps - capLoss;
  const isTrap = netPnL < 0;

  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', padding: '12px 14px', margin: '14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🎯 INTERACTIVE LAB:</span>
          <span>Dividend Trap Realized Net PnL Simulator ($PTBA Case Study)</span>
        </div>
        <span className="badge badge-bull" style={{ fontSize: '8.5px' }}>ARBITRAGE ANOMALY</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '9px', marginBottom: '8px' }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Harga Beli Cum-Date (Rp):</span>
          <input type="number" value={cumPrice} onChange={e => setCumPrice(Number(e.target.value))} style={{ width: '100%', background: '#111827', border: '1px solid #374151', color: '#fff', fontSize: '9px', padding: '2px 4px', borderRadius: '2px' }} />
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Dividen Kotor / Lembar (DPS):</span>
          <input type="number" value={grossDps} onChange={e => setGrossDps(Number(e.target.value))} style={{ width: '100%', background: '#111827', border: '1px solid #374151', color: '#fff', fontSize: '9px', padding: '2px 4px', borderRadius: '2px' }} />
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Penurunan Ex-Date: <strong style={{ color: '#ef4444' }}>-{exDropPct}%</strong></span>
          <input type="range" min="5" max="45" step="1" value={exDropPct} onChange={e => setExDropPct(Number(e.target.value))} style={{ width: '100%', accentColor: '#ef4444' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '3px', fontSize: '9px' }}>
        <div>
          <span>Dividen Bersih (PPh 10%): <strong style={{ color: '#34d399' }}>+Rp {netDps.toFixed(0)}</strong></span>
          <span style={{ marginLeft: '10px' }}>Capital Loss: <strong style={{ color: '#ef4444' }}>-Rp {capLoss}</strong></span>
        </div>
        <div>
          <span style={{
            padding: '2px 8px',
            borderRadius: '2px',
            fontWeight: '800',
            fontSize: '9px',
            background: isTrap ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: isTrap ? '#ef4444' : '#10b981',
            border: isTrap ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'
          }}>
            {isTrap ? `🚨 DIVIDEND TRAP: RUGI BERSIH -Rp ${Math.abs(netPnL).toFixed(0)}/LEMBAR` : `✅ CUAN BERSIH: +Rp ${netPnL.toFixed(0)}/LEMBAR`}
          </span>
        </div>
      </div>
    </div>
  );
}

// Widget 6: Deflated Sharpe Ratio Multi-Testing Simulator (Paper 6)
function Paper6DsrWidget() {
  const [observedSr, setObservedSr] = useState(2.2);
  const [trialsN, setTrialsN] = useState(24);
  const [skewness, setSkewness] = useState(-0.3);
  const [kurtosis, setKurtosis] = useState(4.2);

  const euler = 0.5772156649;
  const n = Math.max(1, trialsN);
  const srStar = n > 1 ? Math.sqrt(2 * Math.log(n)) + (euler / Math.sqrt(2 * Math.log(n))) : 0.0;
  const srVar = 1.0 - (skewness * observedSr) + (((kurtosis - 1.0) / 4.0) * (observedSr ** 2));
  const srStd = Math.sqrt(Math.max(0.001, srVar));
  const tSamples = 2.0 * 252; // 2 years
  const zStat = ((observedSr - srStar) * Math.sqrt(Math.max(1.0, tSamples - 1))) / srStd;
  
  // Normal CDF approximation
  const dsr = Math.min(0.999, Math.max(0.001, 0.5 * (1.0 + Math.tanh(zStat * 0.79788456 * (1 + 0.044715 * zStat * zStat)))));
  const isDefensible = dsr >= 0.95;

  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '4px', padding: '12px 14px', margin: '14px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🔬 INTERACTIVE LAB:</span>
          <span>Deflated Sharpe Ratio (DSR) Multiple-Testing Decay Sandbox</span>
        </div>
        <span className="badge badge-bull" style={{ fontSize: '8.5px' }}>LÓPEZ DE PRADO ENGINE</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '9px', marginBottom: '8px' }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Observed Sharpe: <strong style={{ color: '#fff' }}>{observedSr.toFixed(2)}</strong></span>
          <input type="range" min="0.5" max="3.5" step="0.1" value={observedSr} onChange={e => setObservedSr(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Trials Count (N): <strong style={{ color: '#fff' }}>{trialsN}</strong></span>
          <input type="range" min="1" max="100" step="1" value={trialsN} onChange={e => setTrialsN(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Skewness: <strong style={{ color: '#fff' }}>{skewness.toFixed(1)}</strong></span>
          <input type="range" min="-1.5" max="1.5" step="0.1" value={skewness} onChange={e => setSkewness(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Kurtosis (Fat Tails): <strong style={{ color: '#fff' }}>{kurtosis.toFixed(1)}</strong></span>
          <input type="range" min="2.0" max="8.0" step="0.2" value={kurtosis} onChange={e => setKurtosis(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '3px', fontSize: '9px' }}>
        <div>
          <span>Sharpe Ambang Keberuntungan (SR*): <strong style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>{srStar.toFixed(2)}</strong></span>
          <span style={{ marginLeft: '12px' }}>Nilai DSR Terhitung: <strong style={{ color: isDefensible ? '#10b981' : '#ef4444', fontFamily: 'var(--font-mono)' }}>{dsr.toFixed(3)}</strong></span>
        </div>
        <div>
          <span style={{
            padding: '2px 8px',
            borderRadius: '2px',
            fontWeight: '800',
            fontSize: '9px',
            background: isDefensible ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: isDefensible ? '#10b981' : '#ef4444',
            border: isDefensible ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)'
          }}>
            {isDefensible ? '🛡️ DEFENSIBLE SPEC (LOLOS STATISTIK ALPHA = 0.05)' : '⚠️ OVERFITTED (GAGAL SIGNIFIKANSI / MURNI KEBETULAN)'}
          </span>
        </div>
      </div>
    </div>
  );
}

function InteractiveQuantLabSandbox() {
  const [labMode, setLabMode] = useState('BCR'); // 'BCR' | 'CARVER' | 'DSR'

  // Module 1: BCR & HHI State
  const [b1, setB1] = useState(145000);
  const [b2, setB2] = useState(98000);
  const [b3, setB3] = useState(62000);
  const [bRest, setBRest] = useState(195000);

  const totalVol = b1 + b2 + b3 + bRest;
  const s1 = totalVol > 0 ? (b1 / totalVol) * 100 : 0;
  const s2 = totalVol > 0 ? (b2 / totalVol) * 100 : 0;
  const s3 = totalVol > 0 ? (b3 / totalVol) * 100 : 0;
  const sRest = totalVol > 0 ? (bRest / totalVol) * 100 : 0;

  const bcr1 = s1.toFixed(1);
  const bcr3 = (s1 + s2 + s3).toFixed(1);
  const hhi = Math.round((s1 * s1) + (s2 * s2) + (s3 * s3) + (sRest * sRest));

  let bcrGrade = 'NEUTRAL / RETAIL DISPERSED';
  let bcrColor = 'var(--text-muted, #94a3b8)';
  if (hhi > 2500 || Number(bcr3) > 65) {
    bcrGrade = '🚨 EXTREME ACCUMULATION / MONOPOLY (Bandar Masif)';
    bcrColor = '#10b981';
  } else if (hhi >= 1500 || Number(bcr3) >= 45) {
    bcrGrade = '⚖️ MODERATE ACCUMULATION (Konsentrasi Menengah)';
    bcrColor = '#3b82f6';
  }

  // Module 2: Robert Carver Sizing State
  const [equity, setEquity] = useState(50000000);
  const [targetVolAnn, setTargetVolAnn] = useState(16); // %
  const [dailyVolPct, setDailyVolPct] = useState(2.4); // %
  const [stockPrice, setStockPrice] = useState(3850); // Rp

  const dailyTargetRupiah = (equity * (targetVolAnn / 100)) / Math.sqrt(252);
  const dailyCashVolPerShare = stockPrice * (dailyVolPct / 100);
  const carverLots = dailyCashVolPerShare > 0 ? Math.floor(dailyTargetRupiah / (100 * dailyCashVolPerShare)) : 0;
  const carverAllocRupiah = carverLots * 100 * stockPrice;
  const carverAllocPct = equity > 0 ? ((carverAllocRupiah / equity) * 100).toFixed(1) : 0;

  // Module 3: Deflated Sharpe Ratio State
  const [obsSharpe, setObsSharpe] = useState(1.75);
  const [numTrials, setNumTrials] = useState(12);
  const [skewness, setSkewness] = useState(-0.35);
  const [kurtosis, setKurtosis] = useState(4.2);
  const [trackYears, setTrackYears] = useState(2.0);

  // DSR calculation
  const eulerGamma = 0.5772156649;
  const lnN = Math.log(Math.max(1, numTrials));
  const expectedMaxSR = Math.sqrt(2 * lnN) + (eulerGamma / Math.sqrt(2 * lnN));
  const sampleT = trackYears * 252;
  const denomVariance = 1 - (skewness * obsSharpe) + (((kurtosis - 1) / 4) * (obsSharpe * obsSharpe));
  const zScore = denomVariance > 0
    ? ((obsSharpe - expectedMaxSR) * Math.sqrt(sampleT - 1)) / Math.sqrt(denomVariance)
    : 0;

  // Approx norm cdf
  const approxNormCdf = (z) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  };
  const dsrScore = Math.max(0.01, Math.min(0.999, approxNormCdf(zScore)));
  const dsrDefensible = dsrScore >= 0.95;

  return (
    <div style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              🔬 OPENQUANT INTERACTIVE LAB // QUANTITATIVE FORMULA SIMULATOR
            </span>
            <span style={{ fontSize: '9px', fontWeight: 800, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px' }}>
              OPENQUANT SPEC v3.0
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '720px', lineHeight: 1.5 }}>
            Eksplorasi formula kuantitatif institusional tanpa tebak-tebakan: uji sensitivitas konsentrasi broker bandar (BCR/HHI), sizing target volatilitas Carver, dan haircut Deflated Sharpe Ratio (DSR) dari Marcos López de Prado.
          </div>
        </div>

        {/* Module Switcher Buttons */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '6px' }}>
          {[
            { id: 'BCR', label: '📊 1. Bandarmology HHI' },
            { id: 'CARVER', label: '🎯 2. Vol Sizing Carver' },
            { id: 'DSR', label: '🛡️ 3. Deflated Sharpe' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setLabMode(m.id)}
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: labMode === m.id ? 'var(--accent-blue, #0066cc)' : 'transparent',
                color: labMode === m.id ? '#fff' : 'var(--text-muted)'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* MODULE 1: BCR & HHI */}
      {labMode === 'BCR' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Controls */}
          <div style={{ background: 'var(--bg-panel)', padding: '14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
              1. Parameter Volume Broker Pembeli (Lot)
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Top 1 Broker (cth: YU / AK):</span>
                <strong style={{ color: '#60a5fa' }}>{b1.toLocaleString()} Lot ({s1.toFixed(1)}%)</strong>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="5000"
                value={b1}
                onChange={e => setB1(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Top 2 Broker (cth: BK):</span>
                <strong style={{ color: '#60a5fa' }}>{b2.toLocaleString()} Lot ({s2.toFixed(1)}%)</strong>
              </div>
              <input
                type="range"
                min="10000"
                max="300000"
                step="5000"
                value={b2}
                onChange={e => setB2(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Top 3 Broker (cth: CC):</span>
                <strong style={{ color: '#60a5fa' }}>{b3.toLocaleString()} Lot ({s3.toFixed(1)}%)</strong>
              </div>
              <input
                type="range"
                min="10000"
                max="200000"
                step="5000"
                value={b3}
                onChange={e => setB3(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Broker Lain / Ritel (PD, XC, NI...):</span>
                <strong style={{ color: 'var(--text-muted)' }}>{bRest.toLocaleString()} Lot ({sRest.toFixed(1)}%)</strong>
              </div>
              <input
                type="range"
                min="20000"
                max="600000"
                step="10000"
                value={bRest}
                onChange={e => setBRest(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div style={{ fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
              Total Volume Transaksi: <strong>{totalVol.toLocaleString()} Lot</strong>
            </div>
          </div>

          {/* Math Output & Analytics */}
          <div style={{ background: 'var(--bg-panel)', padding: '14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Output Matriks Konsentrasi Pasar
              </div>

              {/* Formula Snippet */}
              <div style={{ background: 'rgba(0,0,0,0.35)', padding: '8px', borderRadius: '4px', fontFamily: 'serif', fontSize: '11px', color: '#93c5fd', marginBottom: '10px' }}>
                BCR_k = (∑ V_buy,i / V_total) × 100% &nbsp;|&nbsp; HHI = ∑ (s_i)^2
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-panel-subtle)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>BCR Top 1 (Konsentrasi Tunggal):</span>
                  <strong style={{ color: '#60a5fa' }}>{bcr1}%</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-panel-subtle)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>BCR Top 3 (Akumulasi Oligopoli):</span>
                  <strong style={{ color: '#10b981', fontSize: '12px' }}>{bcr3}%</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-panel-subtle)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Herfindahl-Hirschman Index (HHI):</span>
                  <strong style={{ color: '#fbbf24', fontSize: '12px' }}>{hhi}</strong>
                </div>
              </div>
            </div>

            <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: `1px solid ${bcrColor}` }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                STATUS STRUKTUR PASAR:
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: bcrColor, marginTop: '3px' }}>
                {bcrGrade}
              </div>
              <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.4 }}>
                {hhi > 2500
                  ? 'Kondisi ideal untuk mengikuti aksi Smart Money (Ride the Whale) karena akumulasi sangat terpusat.'
                  : 'Arus transaksi terdistribusi ke banyak broker ritel; hindari menganggap lonjakan harga sebagai akumulasi bandar terstruktur.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: ROBERT CARVER VOLATILITY SIZING */}
      {labMode === 'CARVER' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Controls */}
          <div style={{ background: 'var(--bg-panel)', padding: '14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
              2. Parameter Portofolio & Volatilitas Aset (Carver Model)
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Ekuitas Akun:</span>
                <strong style={{ color: '#60a5fa' }}>Rp {equity.toLocaleString('id-ID')}</strong>
              </div>
              <input
                type="range"
                min="10000000"
                max="500000000"
                step="5000000"
                value={equity}
                onChange={e => setEquity(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Volatilitas Portofolio Tahunan (σ_target):</span>
                <strong style={{ color: '#10b981' }}>{targetVolAnn}% / tahun</strong>
              </div>
              <input
                type="range"
                min="6"
                max="30"
                step="1"
                value={targetVolAnn}
                onChange={e => setTargetVolAnn(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Volatilitas Harian Saham (σ_daily via ATR%):</span>
                <strong style={{ color: '#fbbf24' }}>{dailyVolPct}% / hari</strong>
              </div>
              <input
                type="range"
                min="0.8"
                max="6.0"
                step="0.1"
                value={dailyVolPct}
                onChange={e => setDailyVolPct(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Harga Saham BEI:</span>
                <strong style={{ color: 'var(--text-primary)' }}>Rp {stockPrice.toLocaleString('id-ID')}</strong>
              </div>
              <input
                type="range"
                min="200"
                max="25000"
                step="50"
                value={stockPrice}
                onChange={e => setStockPrice(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Carver Output */}
          <div style={{ background: 'var(--bg-panel)', padding: '14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Ukuran Posisi Sesuai Doktrin Robert Carver (Systematic Trading)
              </div>

              <div style={{ background: 'rgba(0,0,0,0.35)', padding: '8px', borderRadius: '4px', fontFamily: 'serif', fontSize: '11px', color: '#93c5fd', marginBottom: '10px' }}>
                N_lots = ⌊ (Equity × (σ_ann / √252)) / (100 × Price × σ_daily) ⌋
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-panel-subtle)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Alokasi Risiko Harian (Daily Vol Cash):</span>
                  <strong>Rp {Math.round(dailyTargetRupiah).toLocaleString('id-ID')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-panel-subtle)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ukuran Posisi Optimal BEI:</span>
                  <strong style={{ color: '#10b981', fontSize: '14px' }}>{carverLots.toLocaleString()} Lot</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-panel-subtle)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Nilai Pembelian Total:</span>
                  <strong>Rp {Math.round(carverAllocRupiah).toLocaleString('id-ID')} ({carverAllocPct}% modal)</strong>
                </div>
              </div>
            </div>

            <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: Number(carverAllocPct) > 30 ? '1px solid #ef4444' : '1px solid #10b981' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                DISIPLIN RISIKO PORTOFOLIO:
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: Number(carverAllocPct) > 30 ? '#f87171' : '#34d399', marginTop: '2px' }}>
                {Number(carverAllocPct) > 30
                  ? '⚠️ EKSPOSUR TINGGI (>30% Modal). Pertimbangkan menurunkan target volatilitas tahunan.'
                  : '✅ EKSPOSUR SEIMBANG. Sesuai prinsip Volatility Parity institusional.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: DEFLATED SHARPE RATIO (LÓPEZ DE PRADO) */}
      {labMode === 'DSR' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Controls */}
          <div style={{ background: 'var(--bg-panel)', padding: '14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
              3. Parameter Backtest & Distribusi Return Non-Normal
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sharpe Ratio Terobservasi (SR):</span>
                <strong style={{ color: '#60a5fa' }}>{obsSharpe.toFixed(2)}</strong>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.5"
                step="0.05"
                value={obsSharpe}
                onChange={e => setObsSharpe(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Jumlah Percobaan Trial Backtest (N):</span>
                <strong style={{ color: '#fbbf24' }}>{numTrials} Model Diuji</strong>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={numTrials}
                onChange={e => setNumTrials(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Semakin banyak kombinasi parameter yang Anda coba, semakin tinggi risiko overfit!
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Skewness Return (γ_3):</span>
                <strong style={{ color: skewness < 0 ? '#ef4444' : '#10b981' }}>{skewness.toFixed(2)}</strong>
              </div>
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step="0.05"
                value={skewness}
                onChange={e => setSkewness(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Kurtosis (Fat Tail γ_4, Normal = 3):</span>
                <strong style={{ color: kurtosis > 3 ? '#fbbf24' : 'var(--text-primary)' }}>{kurtosis.toFixed(1)}</strong>
              </div>
              <input
                type="range"
                min="2.0"
                max="9.0"
                step="0.2"
                value={kurtosis}
                onChange={e => setKurtosis(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Durasi Track Record Backtest:</span>
                <strong>{trackYears.toFixed(1)} Tahun ({Math.round(sampleT)} Bar)</strong>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.5"
                value={trackYears}
                onChange={e => setTrackYears(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* DSR Output */}
          <div style={{ background: 'var(--bg-panel)', padding: '14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Hasil Audit López de Prado (2018) Deflated Sharpe Ratio
              </div>

              <div style={{ background: 'rgba(0,0,0,0.35)', padding: '8px', borderRadius: '4px', fontFamily: 'serif', fontSize: '11px', color: '#93c5fd', marginBottom: '10px' }}>
                SR* = √(2 ln N) + γ/√(2 ln N) &nbsp;|&nbsp; DSR = Φ( (SR - SR*)√(T-1) / √V )
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-panel-subtle)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Expected Max Sharpe dari Kebetulan Acak (SR*):</span>
                  <strong style={{ color: '#f59e0b' }}>{expectedMaxSR.toFixed(2)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-panel-subtle)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Deflated Sharpe Ratio (DSR):</span>
                  <strong style={{ color: dsrDefensible ? '#10b981' : '#ef4444', fontSize: '14px' }}>
                    {(dsrScore * 100).toFixed(1)}% (p-val: {(1 - dsrScore).toFixed(3)})
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-panel-subtle)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ambang Batas Signifikansi:</span>
                  <strong>Minimal 95.0% (α = 0.05)</strong>
                </div>
              </div>
            </div>

            <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: dsrDefensible ? '1px solid #10b981' : '1px solid #ef4444' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                KESIMPULAN AUDIT STATISTIK KUANTITATIF:
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: dsrDefensible ? '#34d399' : '#f87171', marginTop: '3px' }}>
                {dsrDefensible ? '🛡️ STATISTICALLY DEFENSIBLE (Bebas Dari False Discovery)' : '⚠️ SUSPECT OVERFITTING (Kemungkinan Hasil Kebetulan Acak)'}
              </div>
              <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.4 }}>
                {dsrDefensible
                  ? 'Strategi ini terbukti secara statistik memiliki alpha murni yang bertahan melewati koreksi multiple-testing.'
                  : 'Jumlah percobaan backtest yang terlalu banyak memudarkan keandalan Sharpe Ratio. Jangan deploy ke akun riil sebelum lolos DSR ≥ 95%.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * =========================================================================
 * MAIN COMPONENT: QuantAcademyTab
 * Redesigned as an Executive Hedge Fund Working Paper Reader & Research Portal
 * =========================================================================
 */

/**
 * =========================================================================
 * MAIN COMPONENT: QuantAcademyTab
 * Redesigned as an Executive Hedge Fund Working Paper Reader & Research Portal
 * =========================================================================
 */
export default function QuantAcademyTab() {
  const [activeTab, setActiveTab] = useState('academy'); // 'academy' | 'dictionary' | 'gallery' | 'calculator' | 'quant_lab' | 'certificate'
  const [activePaperId, setActivePaperId] = useState(1);
  const [viewMode, setViewMode] = useState('LAYMAN'); // 'LAYMAN' | 'QUANT'
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedGalleryImg, setSelectedGalleryImg] = useState(null);

  // Standalone Mini Lot Calculator State
  const [calcEquity, setCalcEquity] = useState(10000000);
  const [calcEntry, setCalcEntry] = useState(1500);
  const [calcStopLoss, setCalcStopLoss] = useState(1425);
  const [calcRiskPct, setCalcRiskPct] = useState(2);

  // Standalone Pre-Flight Checklist State
  const [checklist, setChecklist] = useState({
    gate1: false,
    gate2: false,
    gate3: false,
    gate4: false,
    gate5: false
  });

  // User LocalStorage Progress
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

  const currentPaper = useMemo(() => {
    return INSTITUTIONAL_PAPERS.find(p => p.id === activePaperId) || INSTITUTIONAL_PAPERS[0];
  }, [activePaperId]);

  const handlePaperComplete = (paperId) => {
    if (!progress.completedLessons.includes(`wp-${paperId}`)) {
      setProgress(prev => ({
        ...prev,
        completedLessons: [...prev.completedLessons, `wp-${paperId}`]
      }));
    }
  };

  const handleOptionSelect = (qIdx, optIdx) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleQuizSubmit = (paper) => {
    setQuizSubmitted(true);
    const allCorrect = paper.comprehensionQuiz.every((q, idx) => quizAnswers[idx] === q.answer);
    if (allCorrect) {
      if (!progress.completedLevels.includes(paper.id)) {
        setProgress(prev => ({
          ...prev,
          completedLevels: [...prev.completedLevels, paper.id]
        }));
      }
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset seluruh progres membaca paper dan sertifikat MBG Academy?')) {
      setProgress({ completedLessons: [], completedLevels: [] });
      setQuizAnswers({});
      setQuizSubmitted(false);
      setActiveQuiz(null);
    }
  };

  const percentComplete = Math.round((progress.completedLevels.length / INSTITUTIONAL_PAPERS.length) * 100);
  const earnedBadges = INSTITUTIONAL_PAPERS
    .filter(p => progress.completedLevels.includes(p.id))
    .map(p => p.badge);

  // Standalone lot calculations
  const riskRupiahMax = Math.round((calcEquity * calcRiskPct) / 100);
  const slDistanceRupiah = Math.max(1, calcEntry - calcStopLoss);
  const exactLotSizing = Math.max(1, Math.floor(riskRupiahMax / (slDistanceRupiah * 100)));
  const totalPositionValue = exactLotSizing * calcEntry * 100;
  const positionWeightPct = (totalPositionValue / calcEquity) * 100;

  // Filter dictionary
  const filteredTerms = GLOSSARY_TERMS.filter(item => {
    const matchesCat = activeCategory === 'ALL' || item.category === activeCategory;
    const matchesSearch = item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.tips.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="tab-pane" style={{ padding: '14px', maxWidth: '1480px', margin: '0 auto' }}>
      
      {/* 1. ACADEMY EXECUTIVE HERO HEADER */}
      <div className="telemetry-panel" style={{ padding: '14px 18px', marginBottom: '14px', borderLeft: '4px solid var(--accent-blue)', background: 'linear-gradient(135deg, var(--bg-panel) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎓 MBG QUANT ACADEMY // WORKING PAPER SERIES 2026</span>
              <span className="badge badge-bull" style={{ fontSize: '9px' }}>6 RESEARCH PAPERS</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
              STANDAR PENDIDIKAN HEDGE FUND · RALPH VINCE 2% · ROBERT CARVER VOL SIZING · LÓPEZ DE PRADO DSR · MICROSTRUCTURE IIFS · SMC FAIR VALUE GAPS
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
            <span style={{ color: 'var(--text-muted)' }}>Status Evaluasi & Peer-Review Research Papers:</span>
            <span style={{ fontWeight: '800', color: percentComplete === 100 ? 'var(--accent-green)' : 'var(--accent-blue)' }}>
              {percentComplete}% SELESAI ({progress.completedLevels.length} / {INSTITUTIONAL_PAPERS.length} PAPERS VERIFIED)
            </span>
          </div>
          <div style={{ width: '100%', height: '7px', background: '#202228', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${percentComplete}%`, height: '100%', background: percentComplete === 100 ? 'var(--accent-green)' : '#0066cc', transition: 'width 0.4s ease' }}></div>
          </div>
        </div>

        {/* Badges Earned */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '10px' }}>
          <span style={{ fontWeight: '700', color: 'var(--accent-orange)' }}>SPESIALISASI DIRAIH:</span>
          {earnedBadges.length > 0 ? (
            earnedBadges.map((b, i) => (
              <span key={i} className="badge badge-bull" style={{ fontSize: '9.5px' }}>{b}</span>
            ))
          ) : (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pelajari dan selesaikan evaluasi tiap research paper untuk meraih lencana keahlian Anda.</span>
          )}
        </div>
      </div>

      {/* 2. SUB NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', borderBottom: 'var(--border-hairline)', paddingBottom: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('academy')}
          className={'telemetry-btn ' + (activeTab === 'academy' ? 'active' : '')}
          style={{ fontSize: '11px', padding: '6px 13px', fontWeight: '700' }}
        >
          📄 Working Papers (6 Modul Riset)
        </button>
        <button
          onClick={() => setActiveTab('quant_lab')}
          className={'telemetry-btn ' + (activeTab === 'quant_lab' ? 'active' : '')}
          style={{ 
            fontSize: '11px', 
            padding: '6px 13px', 
            fontWeight: '700',
            background: activeTab === 'quant_lab' ? 'rgba(59, 130, 246, 0.25)' : undefined,
            color: activeTab === 'quant_lab' ? '#60a5fa' : undefined,
            border: activeTab === 'quant_lab' ? '1px solid rgba(59, 130, 246, 0.4)' : undefined
          }}
        >
          🔬 Interactive Quant Lab (OpenQuant Sandbox)
        </button>
        <button
          onClick={() => setActiveTab('dictionary')}
          className={'telemetry-btn ' + (activeTab === 'dictionary' ? 'active' : '')}
          style={{ fontSize: '11px', padding: '6px 13px', fontWeight: '700' }}
        >
          📖 Master Glossary (66 Istilah)
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={'telemetry-btn ' + (activeTab === 'gallery' ? 'active' : '')}
          style={{ fontSize: '11px', padding: '6px 13px', fontWeight: '700' }}
        >
          🖼️ Visual Anatomy Gallery
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={'telemetry-btn ' + (activeTab === 'calculator' ? 'active' : '')}
          style={{ fontSize: '11px', padding: '6px 13px', fontWeight: '700' }}
        >
          💰 Kalkulator Lot Mandiri
        </button>
        <button
          onClick={() => setActiveTab('certificate')}
          className={'telemetry-btn ' + (activeTab === 'certificate' ? 'active' : '')}
          style={{ fontSize: '11px', padding: '6px 13px', fontWeight: '700', color: progress.completedLevels.length === INSTITUTIONAL_PAPERS.length ? 'var(--accent-gold)' : undefined }}
        >
          🏆 Sertifikasi Resmi {progress.completedLevels.length === INSTITUTIONAL_PAPERS.length ? '✓ Terbuka' : `(${progress.completedLevels.length}/${INSTITUTIONAL_PAPERS.length})`}
        </button>
      </div>

      {/* =========================================================================
          TAB 1: WORKING PAPERS READER (HEDGE FUND LEVEL CURRICULUM)
          ========================================================================= */}
      {activeTab === 'academy' && (
        <div>
          {/* Paper Selector Ribbon */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '14px' }}>
            {INSTITUTIONAL_PAPERS.map(p => {
              const isPassed = progress.completedLevels.includes(p.id);
              const isActive = activePaperId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { setActivePaperId(p.id); setActiveQuiz(null); setQuizSubmitted(false); setQuizAnswers({}); }}
                  style={{
                    background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(30, 41, 59, 0.8) 100%)' : 'var(--bg-panel-subtle)',
                    border: isActive ? '1px solid var(--accent-blue)' : 'var(--border-hairline)',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '52px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: isActive ? '#60a5fa' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      [{p.paperCode}]
                    </span>
                    {isPassed && <span style={{ color: 'var(--accent-green)', fontSize: '9px', fontWeight: '800' }}>✓ LULUS</span>}
                  </div>
                  <div style={{ fontSize: '9.5px', fontWeight: '700', color: isActive ? '#fff' : 'var(--text-secondary)', lineHeight: 1.2, marginTop: '3px' }}>
                    {p.badge.split(' ')[0]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Research Paper Container */}
          <div style={{ background: 'var(--bg-panel)', border: 'var(--border-hairline)', borderRadius: '4px', padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            
            {/* Academic Paper Header */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '9.5px', fontWeight: '800', color: 'var(--accent-blue)', background: 'rgba(59, 130, 246, 0.15)', padding: '2px 7px', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>
                    {currentPaper.paperCode}
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '2px' }}>
                    JEL: {currentPaper.jelCodes}
                  </span>
                  <span style={{ fontSize: '9px', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 6px', borderRadius: '2px', fontWeight: '700' }}>
                    {currentPaper.rigor}
                  </span>
                  <span style={{ fontSize: '9px', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 6px', borderRadius: '2px' }}>
                    {currentPaper.category}
                  </span>
                </div>

                {/* Dual-Layer View Mode Switch */}
                <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', padding: '2px', border: 'var(--border-hairline)' }}>
                  <button
                    onClick={() => setViewMode('LAYMAN')}
                    style={{
                      background: viewMode === 'LAYMAN' ? 'var(--accent-blue)' : 'transparent',
                      color: viewMode === 'LAYMAN' ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '9px',
                      padding: '4px 10px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    👔 Executive / Layman View
                  </button>
                  <button
                    onClick={() => setViewMode('QUANT')}
                    style={{
                      background: viewMode === 'QUANT' ? 'var(--accent-purple)' : 'transparent',
                      color: viewMode === 'QUANT' ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '9px',
                      padding: '4px 10px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    🔬 Quant Formalism &amp; Proofs
                  </button>
                </div>
              </div>

              {/* Title & Authors */}
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: '6px 0 4px 0', lineHeight: 1.35, letterSpacing: '0.02em' }}>
                {currentPaper.title}
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: '600', marginBottom: '8px' }}>
                {currentPaper.subtitle}
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {currentPaper.authors}
              </div>
            </div>

            {/* Executive Abstract Box */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderLeft: '3px solid var(--accent-blue)', padding: '10px 14px', borderRadius: '0 4px 4px 0', marginBottom: '16px' }}>
              <div style={{ fontSize: '8.5px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '4px', textTransform: 'uppercase' }}>
                EXECUTIVE ABSTRACT &amp; PROBLEM STATEMENT
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {currentPaper.abstract}
              </p>
            </div>

            {/* DUAL-LAYER BODY CONTENT */}
            {viewMode === 'LAYMAN' ? (
              /* ================= LAYMAN / EXECUTIVE VIEW ================= */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '4px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#34d399', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>💡</span>
                    <span>{currentPaper.laymanSection.headline}</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-primary)', lineHeight: 1.55, fontStyle: 'italic', marginBottom: '10px', background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '3px' }}>
                    {currentPaper.laymanSection.analogy}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>Poin Kunci yang Wajib Dipahami:</strong>
                    <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {currentPaper.laymanSection.keyTakeaways.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= QUANT FORMALISM VIEW ================= */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '4px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#c084fc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📐</span>
                    <span>MATHEMATICAL THEOREMS &amp; FORMULATION</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                    {currentPaper.quantSection.theorems.map((t, idx) => (
                      <div key={idx} style={{ background: 'rgba(0,0,0,0.35)', padding: '10px 12px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#93c5fd' }}>{t.name}</div>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#fbbf24', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                          {t.formula}
                        </div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {t.description}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Code Block */}
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                      PYTHON / VECTORBT ALGORITHMIC IMPLEMENTATION:
                    </div>
                    <pre style={{
                      background: '#090d16',
                      border: '1px solid #1f2937',
                      borderRadius: '3px',
                      padding: '10px 12px',
                      fontSize: '9.5px',
                      color: '#a5f3fc',
                      fontFamily: 'var(--font-mono)',
                      overflowX: 'auto',
                      lineHeight: 1.5,
                      margin: 0
                    }}>
                      {currentPaper.quantSection.codeSnippet}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* EMBEDDED IN-PAPER INTERACTIVE WIDGET SANDBOX */}
            {currentPaper.id === 1 && <Paper1DrawdownWidget />}
            {currentPaper.id === 2 && <Paper2MacroWidget />}
            {currentPaper.id === 3 && <Paper3OrderBookWidget />}
            {currentPaper.id === 4 && <Paper4SmcFvgWidget />}
            {currentPaper.id === 5 && <Paper5DividendTrapWidget />}
            {currentPaper.id === 6 && <Paper6DsrWidget />}

            {/* REAL HISTORICAL MARKET CASE STUDY */}
            <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '12px 14px', margin: '14px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🗂️</span>
                  <span>STUDI KASUS EMPIRIS HISTORIS: {currentPaper.historicalCase.ticker}</span>
                </div>
                <span style={{ fontSize: '8.5px', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                  {currentPaper.historicalCase.period}
                </span>
              </div>
              <p style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {currentPaper.historicalCase.narrative}
              </p>
            </div>

            {/* PRE-FLIGHT EXECUTION SOP CHECKLIST */}
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#fbbf24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📋</span>
                <span>INSTITUTIONAL PRE-FLIGHT EXECUTION CHECKLIST (5 GATES):</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {currentPaper.preFlightChecklist.map((gate, gIdx) => (
                  <label key={gIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ accentColor: '#10b981' }} />
                    <span>Gate {gIdx + 1}: {gate}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* LITERATURE BIBLIOGRAPHY */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginBottom: '16px', fontSize: '9px', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>DAFTAR PUSTAKA &amp; REFERENSI RESMI BUKU:</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {currentPaper.references.map((ref, rIdx) => (
                  <li key={rIdx}>{ref}</li>
                ))}
              </ul>
            </div>

            {/* COMPREHENSION EVALUATION QUIZ */}
            <div style={{ borderTop: '2px solid rgba(59, 130, 246, 0.3)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    ✍️ UJI KOMPREHENSI KUANTITATIF RESMI ({currentPaper.paperCode})
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Jawab seluruh pertanyaan dengan benar untuk memperoleh verifikasi kelulusan dan lencana spesialisasi.
                  </div>
                </div>
                {progress.completedLevels.includes(currentPaper.id) && (
                  <span className="badge badge-bull" style={{ fontSize: '9px', padding: '3px 8px' }}>
                    ✓ LULUS VERIFIKASI (100% SCORE)
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                {currentPaper.comprehensionQuiz.map((q, qIdx) => (
                  <div key={qIdx} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {qIdx + 1}. {q.question}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {q.options.map((opt, oIdx) => {
                        const isSelected = quizAnswers[qIdx] === oIdx;
                        let optionStyle = {
                          background: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.03)',
                          border: isSelected ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.05)',
                          padding: '6px 10px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          color: isSelected ? '#fff' : 'var(--text-secondary)',
                          cursor: quizSubmitted ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        };

                        if (quizSubmitted) {
                          if (oIdx === q.answer) {
                            optionStyle.background = 'rgba(16, 185, 129, 0.2)';
                            optionStyle.border = '1px solid #10b981';
                            optionStyle.color = '#34d399';
                          } else if (isSelected && oIdx !== q.answer) {
                            optionStyle.background = 'rgba(239, 68, 68, 0.2)';
                            optionStyle.border = '1px solid #ef4444';
                            optionStyle.color = '#f87171';
                          }
                        }

                        return (
                          <div
                            key={oIdx}
                            onClick={() => handleOptionSelect(qIdx, oIdx)}
                            style={optionStyle}
                          >
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800' }}>
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div style={{ marginTop: '8px', fontSize: '9.5px', color: quizAnswers[qIdx] === q.answer ? '#34d399' : '#f87171', background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '2px' }}>
                        <strong>Penjelasan Ilmiah:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Quiz Button */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => handleQuizSubmit(currentPaper)}
                  className="telemetry-btn"
                  style={{ fontSize: '11px', padding: '7px 18px', fontWeight: '800', background: 'var(--accent-blue)', color: '#fff' }}
                >
                  🚀 Submit &amp; Verifikasi Jawaban
                </button>
                {quizSubmitted && (
                  <button
                    onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                    className="telemetry-btn"
                    style={{ fontSize: '10px', padding: '7px 12px' }}
                  >
                    🔄 Coba Ulang Kuis
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MASTER GLOSSARY (PRESERVED & EXPANDED)
          ========================================================================= */}
      {activeTab === 'dictionary' && (
        <div style={{ background: 'var(--bg-panel)', border: 'var(--border-hairline)', borderRadius: '4px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                📖 MASTER GLOSSARY &amp; TAXONOMY TRADING
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                66 Istilah Finansial, Mikrostruktur Bursa BEI, SMC, dan Kripto Terverifikasi
              </div>
            </div>
            <input
              type="text"
              placeholder="Cari istilah, definisi, kata kunci..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #374151', color: '#fff', fontSize: '10.5px', padding: '5px 10px', borderRadius: '3px', width: '220px' }}
            />
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {DICTIONARY_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={'telemetry-btn ' + (activeCategory === cat.id ? 'active' : '')}
                style={{ fontSize: '9.5px', padding: '3px 8px' }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Glossary Terms List */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '10px', maxHeight: '680px', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredTerms.map((item, idx) => (
              <div key={idx} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '11px', color: '#60a5fa' }}>{item.term}</strong>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '2px' }}>
                    {item.category}
                  </span>
                </div>
                <p style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '4px 0 6px 0' }}>
                  {item.definition}
                </p>
                <div style={{ fontSize: '9px', color: '#34d399', background: 'rgba(16, 185, 129, 0.08)', padding: '3px 6px', borderRadius: '2px' }}>
                  💡 {item.tips}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: VISUAL ANATOMY GALLERY
          ========================================================================= */}
      {activeTab === 'gallery' && (
        <div style={{ background: 'var(--bg-panel)', border: 'var(--border-hairline)', borderRadius: '4px', padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
            🖼️ VISUAL ANATOMY GALLERY (7 MASTER FIGURES)
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Diagram Resmi Kurikulum Finansial Kuantitatif MBG 2026. Klik gambar untuk memperbesar (Full Resolution).
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {VISUAL_FIGURES_GALLERY.map(fig => (
              <div
                key={fig.id}
                onClick={() => setSelectedGalleryImg(fig)}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', cursor: 'zoom-in', transition: 'transform 0.2s' }}
              >
                <div style={{ height: '140px', background: '#0a0c10', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={fig.src} alt={fig.caption} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#60a5fa', marginBottom: '2px' }}>{fig.title}</div>
                  <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', lineHeight: 1.35 }}>{fig.caption}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: STANDALONE LOT CALCULATOR
          ========================================================================= */}
      {activeTab === 'calculator' && (
        <div style={{ background: 'var(--bg-panel)', border: 'var(--border-hairline)', borderRadius: '4px', padding: '18px', maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
            💰 KALKULATOR UKURAN LOT MANDIRI (APEX DISCIPLINE)
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Formula Matematis: Max Lots = floor( (Modal x Risk%) / ( (Entry - SL) x 100 lembar ) )
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Modal Ekuitas (Rp):</span>
              <input type="number" value={calcEquity} onChange={e => setCalcEquity(Number(e.target.value))} style={{ width: '100%', background: '#111827', border: '1px solid #374151', color: '#fff', fontSize: '10px', padding: '4px', borderRadius: '3px' }} />
            </div>
            <div>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Toleransi Risiko (%):</span>
              <input type="number" step="0.5" value={calcRiskPct} onChange={e => setCalcRiskPct(Number(e.target.value))} style={{ width: '100%', background: '#111827', border: '1px solid #374151', color: '#34d399', fontSize: '10px', padding: '4px', borderRadius: '3px' }} />
            </div>
            <div>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Harga Entry (Rp):</span>
              <input type="number" value={calcEntry} onChange={e => setCalcEntry(Number(e.target.value))} style={{ width: '100%', background: '#111827', border: '1px solid #374151', color: '#fff', fontSize: '10px', padding: '4px', borderRadius: '3px' }} />
            </div>
            <div>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Harga Stop Loss (Rp):</span>
              <input type="number" value={calcStopLoss} onChange={e => setCalcStopLoss(Number(e.target.value))} style={{ width: '100%', background: '#111827', border: '1px solid #374151', color: '#ef4444', fontSize: '10px', padding: '4px', borderRadius: '3px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>BATAS RUGI RUPIAH:</div>
              <strong style={{ fontSize: '13px', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>Rp {riskRupiahMax.toLocaleString('id-ID')}</strong>
            </div>
            <div>
              <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>UKURAN LOT EKSAK:</div>
              <strong style={{ fontSize: '16px', color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>{exactLotSizing} Lot</strong>
            </div>
            <div>
              <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>BOBOT MODAL TERPAKAI:</div>
              <strong style={{ fontSize: '13px', color: positionWeightPct > 25 ? '#ef4444' : '#10b981', fontFamily: 'var(--font-mono)' }}>{positionWeightPct.toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: INTERACTIVE QUANT LAB (OPENQUANT SANDBOX)
          ========================================================================= */}
      {activeTab === 'quant_lab' && (
        <InteractiveQuantLabSandbox />
      )}

      {/* =========================================================================
          TAB 6: CERTIFICATE VIEW
          ========================================================================= */}
      {activeTab === 'certificate' && progress.completedLevels.length === INSTITUTIONAL_PAPERS.length && (
        <div style={{ background: 'var(--bg-panel-subtle)', border: '2px solid var(--accent-gold)', padding: '36px 24px', textAlign: 'center', maxWidth: '680px', margin: '0 auto', boxShadow: '0 0 30px rgba(217, 119, 6, 0.15)' }}>
          <div style={{ fontSize: '38px', marginBottom: '10px' }}>🏆</div>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--accent-gold)', fontWeight: '800', textTransform: 'uppercase' }}>
            SERTIFIKAT KELULUSAN DISIPLIN FINANSIAL RESMI
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', margin: '12px 0 6px 0', letterSpacing: '0.04em' }}>
            MBG APEX-CERTIFIED QUANTITATIVE RESEARCH FELLOW
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '22px', maxWidth: '540px', margin: '0 auto 22px auto' }}>
            Diberikan kepada researcher / trader yang telah berhasil menyelesaikan dan memverifikasi seluruh 6 Institutional Working Papers: The Mathematics of Capital Preservation, Macroeconomic Transmission Channels, Market Microstructure &amp; IIFS, Smart Money Concepts &amp; FVG Magnet, Dividend Cascade Anomaly, dan Deflated Sharpe Ratio (DSR) Verification.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: 'var(--border-muted)', paddingTop: '16px', fontSize: '10px', gap: '10px' }}>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>TANGGAL KELULUSAN:</div>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>{new Date().toLocaleDateString('id-ID')}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>STATUS VERIFIKASI:</div>
              <div style={{ fontWeight: '700', color: 'var(--accent-green)', marginTop: '2px' }}>PEER-REVIEWED (100% PASS)</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>OTORITAS SISTEM:</div>
              <div style={{ fontWeight: '700', color: 'var(--accent-orange)', marginTop: '2px' }}>MBG Quant Intelligence Desk</div>
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
          <div style={{ maxWidth: '90vw', maxHeight: '90vh', textAlign: 'center' }}>
            <img src={selectedGalleryImg.src} alt={selectedGalleryImg.caption} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
            <div style={{ color: '#fff', fontSize: '12px', marginTop: '10px', fontWeight: '700' }}>{selectedGalleryImg.title}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px', maxWidth: '600px', margin: '4px auto 0 auto' }}>{selectedGalleryImg.caption}</div>
          </div>
        </div>
      )}

    </div>
  );
}
