import React, { useState, useMemo } from 'react';

// Dataset Makro Ekonomi Komprehensif (40+ Event Global: US, ID, EU, GB, JP, CN, AU)
const COMPREHENSIVE_MACRO_EVENTS = [
  // --- INDONESIA (ID) ---
  {
    id: 'id-1',
    time: '14:00',
    date: '2026-09-17',
    country: 'ID',
    countryName: 'Indonesia',
    flag: '🇮🇩',
    name: 'Keputusan Suku Bunga Bank Indonesia (BI 7-Day Reverse Repo Rate)',
    impact: 'HIGH',
    actual: '6.00%',
    forecast: '6.00%',
    previous: '6.25%',
    status: 'UPCOMING',
    details: {
      apaItu: 'Keputusan suku bunga acuan kebijakan moneter yang ditetapkan oleh Rapat Dewan Gubernur (RDG) Bank Indonesia.',
      kenapaPenting: 'Suku bunga acuan menentukan arah likuiditas perbankan nasional, beban bunga korporasi, dan stabilitas nilai tukar Rupiah terhadap USD.',
      dampakAset: [
        { asset: 'Saham (IHSG)', impact: 'Penurunan suku bunga = Katalis sangat positif untuk emiten perbankan, properti (BSDE, CTRA), dan konsumer (ICBP).' },
        { asset: 'Forex (USD/IDR)', impact: 'Bunga tetap/turun diimbangi inflow asing menjaga stabilitas Rupiah di kisaran Rp 15.400 - Rp 15.600.' },
        { asset: 'Obligasi (SBN 10Y)', impact: 'Yield obligasi negara menurun, harga SBN terapresiasi.' },
        { asset: 'Kripto / Emas', impact: 'Likuiditas domestik yang longgar meningkatkan alokasi ke aset alternatif.' }
      ],
      tipsRisiko: 'Perhatikan konferensi pers Gubernur BI pukul 14:30 WIB terkait proyeksi inflasi dan stabilitas nilai tukar.'
    }
  },
  {
    id: 'id-2',
    time: '11:00',
    date: '2026-09-15',
    country: 'ID',
    countryName: 'Indonesia',
    flag: '🇮🇩',
    name: 'Neraca Perdagangan Indonesia (Trade Balance)',
    impact: 'HIGH',
    actual: '+$2.89B',
    forecast: '+$2.45B',
    previous: '+$2.39B',
    status: 'RELEASED',
    details: {
      apaItu: 'Selisih antara total nilai ekspor dan impor barang komoditas dan manufaktur Indonesia.',
      kenapaPenting: 'Surplus perdagangan berkelanjutan menopang cadangan devisa dan menjadi bantalan pertahanan Rupiah.',
      dampakAset: [
        { asset: 'Saham Komoditas', impact: 'Surplus di atas ekspektasi menopang emiten CPO (AALI, LSIP) dan batu bara (ADRO, PTBA).' },
        { asset: 'Rupiah (USD/IDR)', impact: 'Surplus tinggi = Pasokan valas eksportir melimpah, Rupiah menguat.' }
      ],
      tipsRisiko: 'Cermati volume ekspor non-migas ke mitra dagang utama seperti Tiongkok dan India.'
    }
  },
  {
    id: 'id-3',
    time: '11:00',
    date: '2026-09-01',
    country: 'ID',
    countryName: 'Indonesia',
    flag: '🇮🇩',
    name: 'Tingkat Inflasi Tahunan Indonesia (CPI YoY)',
    impact: 'MED',
    actual: '2.12%',
    forecast: '2.20%',
    previous: '2.13%',
    status: 'RELEASED',
    details: {
      apaItu: 'Indeks Harga Konsumen tahunan yang dirilis oleh Badan Pusat Statistik (BPS).',
      kenapaPenting: 'Berada tepat di dalam target sasaran Bank Indonesia (2.5% ± 1%), memberi ruang pelonggaran moneter.',
      dampakAset: [
        { asset: 'IHSG', impact: 'Inflasi terjaga memperkuat daya beli masyarakat dan laba ritel konsumer (AMRT, ICBP).' },
        { asset: 'Suku Bunga', impact: 'Membuka ruang pemangkasan BI-Rate lebih lanjut di Q4 2026.' }
      ],
      tipsRisiko: 'Pantau komponen inflasi harga bergejolak (volatile food) menjelang akhir kuartal.'
    }
  },
  {
    id: 'id-4',
    time: '10:00',
    date: '2026-09-07',
    country: 'ID',
    countryName: 'Indonesia',
    flag: '🇮🇩',
    name: 'Cadangan Devisa Indonesia (Foreign Exchange Reserves)',
    impact: 'MED',
    actual: '$150.2B',
    forecast: '$148.5B',
    previous: '$145.4B',
    status: 'RELEASED',
    details: {
      apaItu: 'Total aset valuta asing resmi yang dikuasai Bank Indonesia untuk menjaga stabilitas moneter.',
      kenapaPenting: 'Cadangan devisa setara dengan pembiayaan 6.7 bulan impor, jauh melampaui standar kecukupan internasional 3 bulan.',
      dampakAset: [
        { asset: 'Rupiah & SBN', impact: 'Meningkatkan kepercayaan investor global dan rating surat utang RI.' }
      ],
      tipsRisiko: 'Kenaikan cadev menandakan intervensi pasar valas yang efektif.'
    }
  },
  {
    id: 'id-5',
    time: '08:30',
    date: '2026-09-01',
    country: 'ID',
    countryName: 'Indonesia',
    flag: '🇮🇩',
    name: 'S&P Global Purchasing Managers Index (PMI Manufaktur ID)',
    impact: 'LOW',
    actual: '50.8',
    forecast: '50.4',
    previous: '49.3',
    status: 'RELEASED',
    details: {
      apaItu: 'Indikator aktivitas ekspansi/kontraksi sektor manufaktur di atas angka 50.',
      kenapaPenting: 'Kembali ke zona ekspansi menandakan pemulihan pesanan baru dan serapan tenaga kerja pabrik.',
      dampakAset: [
        { asset: 'Saham Industri & Semen', impact: 'Positif untuk SMGR, INTP, dan emiten logistik.' }
      ],
      tipsRisiko: 'Perhatikan tren pesanan ekspor baru versus permintaan domestik.'
    }
  },

  // --- UNITED STATES (US) ---
  {
    id: 'us-1',
    time: '01:00',
    date: '2026-09-17',
    country: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    name: 'Keputusan Suku Bunga The Fed (FOMC Rate Decision)',
    impact: 'HIGH',
    actual: '5.00%',
    forecast: '5.00%',
    previous: '5.25%',
    status: 'UPCOMING',
    details: {
      apaItu: 'Penetapan batas atas dan bawah Federal Funds Rate oleh Komite Pasar Terbuka Federal (FOMC).',
      kenapaPenting: 'Gravitasi likuiditas keuangan global. Perubahan suku bunga Fed mempengaruhi valuasi saham dunia, yield obligasi, dan arus modal ke negara berkembang.',
      dampakAset: [
        { asset: 'Forex (USD & DXY)', impact: 'Pemangkasan suku bunga = DXY melemah, mata uang mitra (EUR, GBP, IDR) terapresiasi.' },
        { asset: 'Wall Street (SPX, NDX)', impact: 'Likuiditas lebih murah mendorong saham teknologi dan indeks S&P 500 naik.' },
        { asset: 'Emas (XAU/USD)', impact: 'Biaya peluang (opportunity cost) memegang emas non-bunga menurun, Emas sangat Bullish.' },
        { asset: 'Kripto (BTC/ETH)', impact: 'Risk-on appetite meningkat drastis, arus modal masuk ke Bitcoin.' }
      ],
      tipsRisiko: 'Konferensi pers Jerome Powell pukul 01:30 WIB sering menimbulkan volatilitas whipsaw ekstrim. Pasang trailing stop lebar atau amankan profit.'
    }
  },
  {
    id: 'us-2',
    time: '19:30',
    date: '2026-09-11',
    country: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    name: 'US Core CPI (Indeks Harga Konsumen Inti MoM & YoY)',
    impact: 'HIGH',
    actual: '0.2%',
    forecast: '0.2%',
    previous: '0.2%',
    status: 'RELEASED',
    details: {
      apaItu: 'Ukuran inflasi barang dan jasa di tingkat konsumen tidak termasuk pangan dan energi yang berfluktuasi tinggi.',
      kenapaPenting: 'Metrik inflasi kunci yang dipantau The Fed untuk menentukan kecepatan pemangkasan suku bunga.',
      dampakAset: [
        { asset: 'Forex (USD)', impact: 'Core CPI melandai = USD melemah, pasangan mata uang EURUSD & GBPUSD menguat.' },
        { asset: 'Saham Global', impact: 'Memicu optimisme soft-landing bagi korporasi AS.' }
      ],
      tipsRisiko: 'Perhatikan data SuperCore (jasa di luar shelter) untuk melihat persistensi inflasi upah.'
    }
  },
  {
    id: 'us-3',
    time: '19:30',
    date: '2026-09-04',
    country: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    name: 'US Non-Farm Payrolls (NFP Employment Change)',
    impact: 'HIGH',
    actual: '142K',
    forecast: '160K',
    previous: '114K',
    status: 'RELEASED',
    details: {
      apaItu: 'Jumlah tenaga kerja baru yang diserap oleh sektor industri dan jasa di luar sektor agrikultur.',
      kenapaPenting: 'Indikator primer kesehatan pasar tenaga kerja AS. NFP di bawah perkiraan memicu spekulasi Fed dovish.',
      dampakAset: [
        { asset: 'Forex & Gold', impact: 'NFP di bawah estimasi = Imbal hasil US Treasury turun, Emas reli kuat.' },
        { asset: 'IHSG', impact: 'Dolar yang melemah membuka pintu bagi foreign inflow ke bursa Asia.' }
      ],
      tipsRisiko: 'Data dirilis serentak dengan Tingkat Pengangguran (Unemployment Rate). Perhatikan revisi data 2 bulan sebelumnya.'
    }
  },
  {
    id: 'us-4',
    time: '19:30',
    date: '2026-09-04',
    country: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    name: 'Tingkat Pengangguran AS (US Unemployment Rate)',
    impact: 'HIGH',
    actual: '4.2%',
    forecast: '4.2%',
    previous: '4.3%',
    status: 'RELEASED',
    details: {
      apaItu: 'Persentase angkatan kerja AS yang aktif mencari pekerjaan namun belum terserap.',
      kenapaPenting: 'Pilar mandat ganda The Fed (Maximum Employment & Price Stability). Kenaikan menuju 4.3% mengaktifkan Sahm Rule.',
      dampakAset: [
        { asset: 'Saham US', impact: 'Koreksi pengangguran ke 4.2% meredakan kekhawatiran resesi mendalam.' }
      ],
      tipsRisiko: 'Gunakan rasio partisipasi angkatan kerja untuk memverifikasi kualitas penurunan angka.'
    }
  },
  {
    id: 'us-5',
    time: '19:30',
    date: '2026-09-25',
    country: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    name: 'US Core PCE Price Index (Indikator Inflasi Favorit The Fed)',
    impact: 'HIGH',
    actual: '—',
    forecast: '0.2%',
    previous: '0.2%',
    status: 'UPCOMING',
    details: {
      apaItu: 'Personal Consumption Expenditures Core yang mencerminkan pengeluaran riil masyarakat.',
      kenapaPenting: 'Indikator acuan resmi yang dipakai FOMC dalam menyusun Summary of Economic Projections (Dot Plot).',
      dampakAset: [
        { asset: 'Pasar Keuangan Global', impact: 'Angka di bawah 0.2% memastikan suku bunga terus dipangkas pada meeting berikutnya.' }
      ],
      tipsRisiko: 'Volatilitas tinggi diperkirakan pada pasangan mata uang major dan indeks Nasdaq.'
    }
  },
  {
    id: 'us-6',
    time: '19:30',
    date: '2026-09-17',
    country: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    name: 'US Penjualan Ritel MoM (Retail Sales)',
    impact: 'HIGH',
    actual: '0.1%',
    forecast: '-0.2%',
    previous: '1.1%',
    status: 'UPCOMING',
    details: {
      apaItu: 'Perubahan total nilai penjualan di tingkat toko ritel dan e-commerce AS.',
      kenapaPenting: 'Konsumsi domestik menyumbang lebih dari 68% dari total PDB Amerika Serikat.',
      dampakAset: [
        { asset: 'Wall Street', impact: 'Retail sales positif menunjukkan konsumen AS masih tangguh menghadapi era suku bunga tinggi.' }
      ],
      tipsRisiko: 'Bandingkan dengan Core Retail Sales (tidak termasuk otomotif dan bensin).'
    }
  },
  {
    id: 'us-7',
    time: '21:00',
    date: '2026-09-03',
    country: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    name: 'US ISM Manufacturing PMI',
    impact: 'HIGH',
    actual: '47.2',
    forecast: '47.5',
    previous: '46.8',
    status: 'RELEASED',
    details: {
      apaItu: 'Survei manajer pembelian sektor manufaktur yang disusun Institute for Supply Management.',
      kenapaPenting: 'Sektor manufaktur masih berada di zona kontraksi (<50), menandakan perlambatan ekonomi industri.',
      dampakAset: [
        { asset: 'Minyak Mentah', impact: 'PMI rendah menekan proyeksi permintaan minyak global.' }
      ],
      tipsRisiko: 'Perhatikan komponen New Orders dan Employment dalam rilis ISM.'
    }
  },
  {
    id: 'us-8',
    time: '21:00',
    date: '2026-09-05',
    country: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    name: 'US ISM Services PMI',
    impact: 'HIGH',
    actual: '51.5',
    forecast: '51.3',
    previous: '51.4',
    status: 'RELEASED',
    details: {
      apaItu: 'Survei aktivitas sektor jasa (transportasi, perbankan, restoran, teknologi) yang merupakan sektor terbesar AS.',
      kenapaPenting: 'Bertengger di zona ekspansi (>50), membuktikan sektor jasa menahan AS dari resesi.',
      dampakAset: [
        { asset: 'USD', impact: 'Sektor jasa yang solid memberi bantalan penguatan bagi Dolar AS.' }
      ],
      tipsRisiko: 'Cermati Prices Paid Index untuk melihat tekanan biaya input jasa.'
    }
  },
  {
    id: 'us-9',
    time: '19:30',
    date: '2026-09-18',
    country: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    name: 'Klaim Awal Pengangguran Mingguan (Initial Jobless Claims)',
    impact: 'MED',
    actual: '230K',
    forecast: '231K',
    previous: '228K',
    status: 'UPCOMING',
    details: {
      apaItu: 'Jumlah individu baru yang mengajukan klaim tunjangan asuransi pengangguran setiap minggu.',
      kenapaPenting: 'Indikator leading paling cepat memperingatkan jika gelombang pemutusan hubungan kerja (PHK) meningkat.',
      dampakAset: [
        { asset: 'Forex (USD)', impact: 'Klaim di atas 240K menekan USD karena mengindikasikan pasar tenaga kerja mendingin.' }
      ],
      tipsRisiko: 'Gunakan rata-rata pergerakan 4 minggu (4-week moving average) untuk menghilangkan anomali musiman.'
    }
  },
  {
    id: 'us-10',
    time: '21:30',
    date: '2026-09-16',
    country: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    name: 'EIA Laporan Stok Minyak Mentah AS (Crude Oil Inventories)',
    impact: 'MED',
    actual: '—',
    forecast: '-0.8M',
    previous: '+0.833M',
    status: 'UPCOMING',
    details: {
      apaItu: 'Perubahan jumlah barel minyak mentah komersial yang disimpan oleh perusahaan-perusahaan AS.',
      kenapaPenting: 'Penurunan inventori menandakan konsumsi kilang tinggi atau ekspor meningkat, mengangkat harga WTI/Brent.',
      dampakAset: [
        { asset: 'Minyak Mentah (WTI)', impact: 'Penarikan stok besar (drawdown) = WTI Bullish menguat tajam.' },
        { asset: 'Saham Migas BEI', impact: 'Sentimen positif untuk MEDC, ENRG, dan PGAS.' }
      ],
      tipsRisiko: 'Volatilitas harga minyak terjadi dalam hitungan 5 menit pasca-rilis pukul 21:30 WIB.'
    }
  },

  // --- EUROZONE (EU) ---
  {
    id: 'eu-1',
    time: '19:15',
    date: '2026-09-12',
    country: 'EU',
    countryName: 'Eurozone',
    flag: '🇪🇺',
    name: 'Keputusan Suku Bunga Bank Sentral Eropa (ECB Deposit Facility Rate)',
    impact: 'HIGH',
    actual: '3.50%',
    forecast: '3.50%',
    previous: '3.75%',
    status: 'RELEASED',
    details: {
      apaItu: 'Tingkat suku bunga fasilitas simpanan yang dibayarkan ECB kepada bank komersial.',
      kenapaPenting: 'ECB memangkas suku bunga sebesar 25 bps menyusul inflasi zona euro yang melandai mendekati target 2%.',
      dampakAset: [
        { asset: 'Forex (EUR/USD)', impact: 'Pemangkasan terkonfirmasi = EUR bergerak stabil dan berkonsolidasi di 1.1050 - 1.1150.' },
        { asset: 'Saham Eropa (DAX/CAC)', impact: 'Penurunan biaya pinjaman menstimulasi indeks saham Jerman dan Prancis.' }
      ],
      tipsRisiko: 'Konferensi pers Presiden ECB Christine Lagarde memberikan panduan arah suku bunga untuk akhir tahun.'
    }
  },
  {
    id: 'eu-2',
    time: '16:00',
    date: '2026-09-18',
    country: 'EU',
    countryName: 'Eurozone',
    flag: '🇪🇺',
    name: 'Eurozone HICP Inflasi Final YoY (CPI Zona Euro)',
    impact: 'HIGH',
    actual: '2.2%',
    forecast: '2.2%',
    previous: '2.6%',
    status: 'UPCOMING',
    details: {
      apaItu: 'Harmonised Index of Consumer Prices untuk 20 negara pengguna mata uang Euro.',
      kenapaPenting: 'Konfirmasi final apakah tekanan inflasi energi dan jasa telah terkendali sepenuhnya.',
      dampakAset: [
        { asset: 'EUR/USD', impact: 'Inflasi sesuai proyeksi menjaga ekspektasi pelonggaran moneter lanjutan.' }
      ],
      tipsRisiko: 'Perhatikan disparitas inflasi antara ekonomi utama Jerman versus negara selatan Eropa.'
    }
  },
  {
    id: 'eu-3',
    time: '16:00',
    date: '2026-09-06',
    country: 'EU',
    countryName: 'Eurozone',
    flag: '🇪🇺',
    name: 'Eurozone PDB Pertumbuhan Kuartalan (GDP Final QoQ)',
    impact: 'MED',
    actual: '0.2%',
    forecast: '0.3%',
    previous: '0.3%',
    status: 'RELEASED',
    details: {
      apaItu: 'Pertumbuhan output ekonomi agregat seluruh negara anggota Uni Eropa.',
      kenapaPenting: 'Pertumbuhan lambat di 0.2% memperkuat urgensi pemangkasan suku bunga lanjutan dari ECB.',
      dampakAset: [
        { asset: 'Obligasi Bund Jerman', impact: 'Yield obligasi Jerman turun.' }
      ],
      tipsRisiko: 'Sektor industri manufaktur Jerman masih menjadi beban pertumbuhan utama.'
    }
  },
  {
    id: 'eu-4',
    time: '16:00',
    date: '2026-09-16',
    country: 'EU',
    countryName: 'Germany',
    flag: '🇩🇪',
    name: 'German ZEW Economic Sentiment Index',
    impact: 'MED',
    actual: '3.6',
    forecast: '17.0',
    previous: '19.2',
    status: 'RELEASED',
    details: {
      apaItu: 'Survei terhadap 300 analis keuangan mengenai prospek ekonomi Jerman untuk 6 bulan ke depan.',
      kenapaPenting: 'Anjlok signifikan ke 3.6 mencerminkan pesimisme tajam terhadap pesanan industri otomotif dan kimia Jerman.',
      dampakAset: [
        { asset: 'Forex (EUR)', impact: 'Menahan penguatan EUR terhadap mata uang komoditas seperti AUD dan NZD.' }
      ],
      tipsRisiko: 'Sentimen ZEW sering menjadi leading indicator bagi indeks IFO Jerman.'
    }
  },

  // --- UNITED KINGDOM (GB) ---
  {
    id: 'gb-1',
    time: '18:00',
    date: '2026-09-19',
    country: 'GB',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    name: 'Keputusan Suku Bunga Bank of England (BoE Official Bank Rate)',
    impact: 'HIGH',
    actual: '5.00%',
    forecast: '5.00%',
    previous: '5.00%',
    status: 'UPCOMING',
    details: {
      apaItu: 'Suku bunga acuan yang ditetapkan oleh Komite Kebijakan Moneter (MPC) Bank sentral Inggris.',
      kenapaPenting: 'BoE diproyeksikan menahan suku bunga di 5.00% menyusul inflasi sektor jasa Inggris yang masih kaku di atas 5%.',
      dampakAset: [
        { asset: 'Forex (GBP/USD)', impact: 'Suku bunga bertahan = GBP mendapatkan sokongan carry-trade terhadap USD dan EUR.' },
        { asset: 'Indeks FTSE 100', impact: 'Perusahaan multinasional FTSE cenderung defensif.' }
      ],
      tipsRisiko: 'Perhatikan jumlah voting MPC (e.g. 7-2 atau 8-1) untuk mengukur seberapa dekat pemotongan berikutnya.'
    }
  },
  {
    id: 'gb-2',
    time: '13:00',
    date: '2026-09-18',
    country: 'GB',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    name: 'UK CPI Inflasi Tahunan (UK Consumer Price Index YoY)',
    impact: 'HIGH',
    actual: '2.2%',
    forecast: '2.2%',
    previous: '2.2%',
    status: 'UPCOMING',
    details: {
      apaItu: 'Ukuran utama perubahan harga barang dan jasa konsumen di Britania Raya.',
      kenapaPenting: 'Dirilis tepat sehari sebelum keputusan suku bunga BoE, menjadi faktor penentu utama keputusan dewan moneter.',
      dampakAset: [
        { asset: 'Poundsterling (GBP)', impact: 'Jika inflasi jasa melandai di bawah 5%, GBP berisiko terkoreksi tajam.' }
      ],
      tipsRisiko: 'Pasang alert harga pada pasangan GBP/USD dan GBP/JPY 15 menit sebelum rilis.'
    }
  },
  {
    id: 'gb-3',
    time: '13:00',
    date: '2026-09-11',
    country: 'GB',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    name: 'UK PDB Bulanan (GDP MoM)',
    impact: 'MED',
    actual: '0.0%',
    forecast: '0.2%',
    previous: '0.0%',
    status: 'RELEASED',
    details: {
      apaItu: 'Pertumbuhan Produk Domestik Bruto bulanan Britania Raya.',
      kenapaPenting: 'Stagnasi 0.0% dua bulan berturut-turut mencerminkan ekonomi Inggris yang rentan kehilangan momentum.',
      dampakAset: [
        { asset: 'GBP Crosses', impact: 'GBP melemah terhadap EUR dan CHF pasca-rilis.' }
      ],
      tipsRisiko: 'Cek output industri manufaktur dan konstruksi sebagai kontributor pelemahan.'
    }
  },

  // --- JAPAN (JP) ---
  {
    id: 'jp-1',
    time: '10:00',
    date: '2026-09-20',
    country: 'JP',
    countryName: 'Japan',
    flag: '🇯🇵',
    name: 'Keputusan Suku Bunga Bank of Japan (BoJ Policy Rate & Outlook)',
    impact: 'HIGH',
    actual: '0.25%',
    forecast: '0.25%',
    previous: '0.25%',
    status: 'UPCOMING',
    details: {
      apaItu: 'Tingkat suku bunga target overnight call rate yang ditetapkan oleh Bank Sentral Jepang (BoJ).',
      kenapaPenting: 'Kenaikan suku bunga BoJ sebelumnya memicu unwind yen carry trade global masif. Pasar memantau sinyal kenaikan menuju 0.50% sebelum akhir tahun.',
      dampakAset: [
        { asset: 'Forex (USD/JPY)', impact: 'Komentar hawkish Gubernur Ueda = Yen menguat, USD/JPY anjlok ke arah 140.00.' },
        { asset: 'Pasar Saham Global', impact: 'Penguatan Yen yang terlalu cepat berpotensi memicu volatilitas likuiditas di Wall Street dan Nikkei.' },
        { asset: 'Kripto (BTC)', impact: 'Unwind carry trade sempat menekan Bitcoin, pasar kini sangat waspada.' }
      ],
      tipsRisiko: 'Waktu rilis BoJ tidak memiliki jadwal menit yang pasti (biasanya antara 09:45 - 11:30 WIB). Selalu gunakan limit order.'
    }
  },
  {
    id: 'jp-2',
    time: '06:30',
    date: '2026-09-20',
    country: 'JP',
    countryName: 'Japan',
    flag: '🇯🇵',
    name: 'Jepang Inflasi Konsumen Inti Nasional (National Core CPI YoY)',
    impact: 'HIGH',
    actual: '2.8%',
    forecast: '2.8%',
    previous: '2.7%',
    status: 'UPCOMING',
    details: {
      apaItu: 'Tingkat inflasi nasional Jepang tidak termasuk makanan segar.',
      kenapaPenting: 'Inflasi bertahan di atas target 2% selama lebih dari 28 bulan berturut-turut, membenarkan normalisasi kebijakan BoJ.',
      dampakAset: [
        { asset: 'Yen (JPY)', impact: 'Mendorong apresiasi Yen terhadap mata uang G10.' }
      ],
      tipsRisiko: 'Perhatikan efek penghentian subsidi listrik dan gas pemerintah Jepang.'
    }
  },
  {
    id: 'jp-3',
    time: '06:50',
    date: '2026-09-09',
    country: 'JP',
    countryName: 'Japan',
    flag: '🇯🇵',
    name: 'Jepang PDB Pertumbuhan Tahunan Final (GDP Annualized QoQ)',
    impact: 'MED',
    actual: '2.9%',
    forecast: '3.2%',
    previous: '-2.3%',
    status: 'RELEASED',
    details: {
      apaItu: 'Pertumbuhan ekonomi Jepang yang disetahunkan.',
      kenapaPenting: 'Rebound kuat 2.9% mengonfirmasi pemulihan konsumsi rumah tangga pasca-skandal sertifikasi otomotif.',
      dampakAset: [
        { asset: 'Nikkei 225', impact: 'Mendukung fundamental laba korporasi domestik Jepang.' }
      ],
      tipsRisiko: 'Belanja modal swasta (capex) tumbuh stabil mendukung investasi AI.'
    }
  },

  // --- CHINA (CN) ---
  {
    id: 'cn-1',
    time: '08:45',
    date: '2026-09-02',
    country: 'CN',
    countryName: 'China',
    flag: '🇨🇳',
    name: 'Caixin Manufacturing PMI Tiongkok',
    impact: 'HIGH',
    actual: '50.4',
    forecast: '50.0',
    previous: '49.8',
    status: 'RELEASED',
    details: {
      apaItu: 'Survei manajer pembelian independen yang berfokus pada perusahaan manufaktur swasta dan berorientasi ekspor di Tiongkok.',
      kenapaPenting: 'Tiongkok adalah mitra dagang terbesar Indonesia. Rebound ke atas 50 menandakan pesanan ekspor tetap tangguh.',
      dampakAset: [
        { asset: 'Komoditas BEI (Tambang)', impact: 'Positif untuk emiten nikel (INCO, MDKA) dan batu bara (ADRO).' },
        { asset: 'Forex (AUD/USD)', impact: 'Dolar Australia (proxy Tiongkok) menguat mengikuti ekspansi PMI.' }
      ],
      tipsRisiko: 'Bandingkan dengan data PMI resmi NBS milik pemerintah.'
    }
  },
  {
    id: 'cn-2',
    time: '09:00',
    date: '2026-09-14',
    country: 'CN',
    countryName: 'China',
    flag: '🇨🇳',
    name: 'Produksi Industri Tiongkok YoY (Industrial Production)',
    impact: 'HIGH',
    actual: '4.5%',
    forecast: '4.8%',
    previous: '5.1%',
    status: 'RELEASED',
    details: {
      apaItu: 'Pertumbuhan output pabrik, tambang, dan utilitas di seluruh daratan Tiongkok.',
      kenapaPenting: 'Pertumbuhan melambat ke 4.5% meningkatkan desakan kepada Beijing untuk meluncurkan stimulus fiskal baru.',
      dampakAset: [
        { asset: 'Harga Logam & Tambang', impact: 'Harga tembaga dan bijih besi sempat tertekan menyusul perlambatan pabrik.' }
      ],
      tipsRisiko: 'Perhatikan paket stimulus fiskal dan moneter lanjutan dari PBOC.'
    }
  },
  {
    id: 'cn-3',
    time: '09:00',
    date: '2026-09-14',
    country: 'CN',
    countryName: 'China',
    flag: '🇨🇳',
    name: 'Penjualan Ritel Tiongkok YoY (Retail Sales)',
    impact: 'HIGH',
    actual: '2.1%',
    forecast: '2.5%',
    previous: '2.7%',
    status: 'RELEASED',
    details: {
      apaItu: 'Pertumbuhan pengeluaran konsumen di Tiongkok untuk barang konsumen.',
      kenapaPenting: 'Angka 2.1% menunjukkan konsumen Tiongkok masih menahan belanja di tengah krisis sektor properti.',
      dampakAset: [
        { asset: 'IHSG', impact: 'Daya beli Tiongkok yang lesu membatasi reli harga komoditas energi.' }
      ],
      tipsRisiko: 'Amati program subsidi tukar-tambah (trade-in) kendaraan listrik dan elektronik.'
    }
  },
  {
    id: 'cn-4',
    time: '08:15',
    date: '2026-09-20',
    country: 'CN',
    countryName: 'China',
    flag: '🇨🇳',
    name: 'Keputusan Suku Bunga Pinjaman Acuan PBOC (Loan Prime Rate 1Y & 5Y)',
    impact: 'HIGH',
    actual: '3.35%',
    forecast: '3.35%',
    previous: '3.35%',
    status: 'UPCOMING',
    details: {
      apaItu: 'Tingkat suku bunga acuan pinjaman komersial dan KPR di Tiongkok.',
      kenapaPenting: 'LPR 5-tahun menjadi patokan utama bunga hipotek properti Tiongkok.',
      dampakAset: [
        { asset: 'Saham Asia & Hang Seng', impact: 'Pemangkasan LPR memberikan suntikan likuiditas likuid bagi pasar Asia.' }
      ],
      tipsRisiko: 'Fokus pada spread antara MLF (Medium-term Lending Facility) dan LPR.'
    }
  },

  // --- AUSTRALIA (AU) ---
  {
    id: 'au-1',
    time: '11:30',
    date: '2026-09-24',
    country: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    name: 'Keputusan Suku Bunga Reserve Bank of Australia (RBA Cash Rate Target)',
    impact: 'HIGH',
    actual: '4.35%',
    forecast: '4.35%',
    previous: '4.35%',
    status: 'UPCOMING',
    details: {
      apaItu: 'Tingkat suku bunga target pinjaman antarbank yang ditetapkan oleh RBA.',
      kenapaPenting: 'Gubernur RBA Michele Bullock mempertahankan sikap hawkish karena inflasi inti Australia masih berada di atas target 3%.',
      dampakAset: [
        { asset: 'Forex (AUD/USD)', impact: 'Bunga bertahan tinggi = AUD menjadi mata uang berimbal hasil menarik (yield appeal).' },
        { asset: 'AUD/NZD & AUD/JPY', impact: 'Tren Bullish pada cross-pair berbasis AUD.' }
      ],
      tipsRisiko: 'RBA secara eksplisit menyatakan tidak terburu-buru mengikuti langkah pemangkasan The Fed.'
    }
  },
  {
    id: 'au-2',
    time: '08:30',
    date: '2026-09-19',
    country: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    name: 'Perubahan Ketenagakerjaan Australia (Employment Change & Unemployment Rate)',
    impact: 'HIGH',
    actual: '47.5K',
    forecast: '26.0K',
    previous: '58.2K',
    status: 'UPCOMING',
    details: {
      apaItu: 'Penambahan lapangan kerja baru di Australia dan tingkat pengangguran nasional.',
      kenapaPenting: 'Pasar tenaga kerja Australia yang sangat ketat membuat RBA enggan memangkas suku bunga dalam waktu dekat.',
      dampakAset: [
        { asset: 'Forex (AUD)', impact: 'Penambahan tenaga kerja tinggi memicu lonjakan spontan pada pasangan AUD/USD.' }
      ],
      tipsRisiko: 'Periksa proporsi pekerjaan purna waktu (full-time) vs paruh waktu (part-time).'
    }
  },
  {
    id: 'au-3',
    time: '08:30',
    date: '2026-09-25',
    country: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    name: 'Australia CPI Indikator Bulanan YoY (Monthly Consumer Price Index)',
    impact: 'HIGH',
    actual: '3.5%',
    forecast: '2.7%',
    previous: '3.5%',
    status: 'UPCOMING',
    details: {
      apaItu: 'Indikator inflasi bulanan Australia untuk memantau tren harga sebelum rilis triwulanan penuh.',
      kenapaPenting: 'Kunci penentu apakah RBA akan mempertahankan suku bunga hingga awal tahun depan.',
      dampakAset: [
        { asset: 'AUD Crosses', impact: 'Inflasi bertahan tinggi memperkuat posisi beli pada AUD.' }
      ],
      tipsRisiko: 'Perhatikan efek diskon tagihan listrik negara bagian pada angka headline.'
    }
  },

  // --- KOMODITAS & ENERGI GLOBAL (GLOBAL/OPEC) ---
  {
    id: 'glo-1',
    time: '18:00',
    date: '2026-09-21',
    country: 'GLOBAL',
    countryName: 'Global / OPEC+',
    flag: '🛢️',
    name: 'Pertemuan Monitoring Tingkat Menteri OPEC+ (JMMC Meeting)',
    impact: 'HIGH',
    actual: '—',
    forecast: 'Maintain Cuts',
    previous: 'Voluntary Cuts',
    status: 'UPCOMING',
    details: {
      apaItu: 'Pertemuan komite teknis aliansi negara pengekspor minyak OPEC dan sekutunya (Rusia cs).',
      kenapaPenting: 'Menentukan apakah penambahan produksi minyak harian sebesar 180.000 bpd akan ditunda atau dilanjutkan.',
      dampakAset: [
        { asset: 'Minyak Brent & WTI', impact: 'Penundaan kenaikan kuota = Harga minyak reli menembus $85-$90/barel.' },
        { asset: 'IHSG Migas', impact: 'Katalis langsung bagi saham MEDC, ENRG, ELSA.' }
      ],
      tipsRisiko: 'Pernyataan resmi menteri energi Arab Saudi sering membocorkan keputusan 2 jam sebelum komunike resmi.'
    }
  }
];

export default function EconomicCalendarTab() {
  const [filterCountry, setFilterCountry] = useState('ALL');
  const [filterImpact, setFilterImpact] = useState('ALL');
  // M-05: Default filter to UPCOMING so calendar displays current and upcoming actionable releases first
  const [filterTimeframe, setFilterTimeframe] = useState('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // STATIC SAMPLE, NOT A LIVE FEED.
  //
  // The bundle has no `economic_calendar` key, and this component takes no
  // props — `setEvents(COMPREHENSIVE_MACRO_EVENTS)` re-assigns the same
  // constant. So every `actual` value below (BI Rate 6.00%, CPI 2.12%,
  // Cadev $150.2B) is a fixed string, and rows carry RELEASED badges and
  // "✅ Sudah Dirilis" as if the figures had been published.
  //
  // Rather than invent a fetch, the rows are now labelled as a template. The
  // schedule skeleton is genuinely useful for planning; the numbers are not
  // real and must not be read as outcomes.
  const [events] = useState(COMPREHENSIVE_MACRO_EVENTS);

  const isStaticSample = true;

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchCountry = filterCountry === 'ALL' || event.country === filterCountry;
      const matchImpact = filterImpact === 'ALL' || event.impact === filterImpact;

      let matchTimeframe = true;
      if (filterTimeframe === 'UPCOMING') {
        matchTimeframe = event.status === 'UPCOMING';
      } else if (filterTimeframe === 'RELEASED') {
        matchTimeframe = event.status === 'RELEASED';
      }

      const term = searchQuery.toLowerCase();
      const matchSearch = 
        (event.name || '').toLowerCase().includes(term) || 
        (event.country || '').toLowerCase().includes(term) ||
        (event.countryName || '').toLowerCase().includes(term);

      return matchCountry && matchImpact && matchTimeframe && matchSearch;
    }).sort((a, b) => {
      // Prioritize UPCOMING status over past RELEASED events if viewing ALL
      if (a.status !== b.status) {
        return a.status === 'UPCOMING' ? -1 : 1;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [events, filterCountry, filterImpact, filterTimeframe, searchQuery]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getImpactBadge = (impact) => {
    switch (impact) {
      case 'HIGH':
        return { label: 'TINGGI', color: 'var(--accent-rust)', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
      case 'MED':
        return { label: 'SEDANG', color: 'var(--accent-gold)', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)' };
      case 'LOW':
        return { label: 'RENDAH', color: 'var(--accent-green)', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
      default:
        return { label: 'NORMAL', color: 'var(--text-muted)', bg: 'rgba(255, 255, 255, 0.05)', border: 'var(--border-hairline)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>

      {/* Honest disclosure. Without this the table reads as a live wire: rows
          carry RELEASED badges and "✅ Sudah Dirilis" beside invented numbers. */}
      {isStaticSample && (
        <div style={{
          background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.38)',
          borderRadius: '10px', padding: '12px 16px', fontSize: '12px',
          color: '#fbbf24', lineHeight: 1.7,
        }}>
          <strong>⚠️ Jadwal contoh, dudu feed langsung.</strong> Tanggal rilis lan jeneng
          acara kuwi kerangka nyata, <strong>nanging angka actual/forecast/previous isih conto</strong> —
          aja dianggep asil rilis. Sumber kalender durung disambungake.
        </div>
      )}

      {/* 1. Header Hub Card */}
      <div className="quant-card" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>📅</span>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              KALENDER MAKRO EKONOMI GLOBAL
            </h2>
            <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
              {filteredEvents.length} EVENT TERJADWAL
            </span>
          </div>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
            Rilis Kebijakan Moneter Suku Bunga &bull; Inflasi CPI &bull; Ketenagakerjaan NFP &bull; PDB &bull; Neraca Dagang (US, ID, EU, GB, JP, CN, AU)
          </p>
        </div>

        {/* Global Summary Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            fontSize: '11px',
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.12)',
            color: 'var(--accent-rust)',
            fontWeight: '700',
            fontFamily: 'var(--font-mono)',
            border: '1px solid rgba(239, 68, 68, 0.25)'
          }}>
            🔴 {events.filter(e => e.impact === 'HIGH').length} High Impact
          </div>
          <div style={{
            fontSize: '11px',
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'rgba(56, 189, 248, 0.12)',
            color: '#38bdf8',
            fontWeight: '700',
            fontFamily: 'var(--font-mono)',
            border: '1px solid rgba(56, 189, 248, 0.25)'
          }}>
            🇮🇩 {events.filter(e => e.country === 'ID').length} Event Domestik
          </div>
        </div>
      </div>

      {/* 2. Comprehensive Filter Toolbar */}
      <div className="quant-card" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Country Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: '70px' }}>
            NEGARA:
          </span>
          <div className="quant-pill-nav" style={{ margin: 0 }}>
            {[
              { id: 'ALL', label: '🌍 SEMUA' },
              { id: 'ID', label: '🇮🇩 INDONESIA' },
              { id: 'US', label: '🇺🇸 US FED' },
              { id: 'EU', label: '🇪🇺 EUROZONE' },
              { id: 'GB', label: '🇬🇧 UK BOE' },
              { id: 'JP', label: '🇯🇵 JEPANG BOJ' },
              { id: 'CN', label: '🇨🇳 TIONGKOK' },
              { id: 'AU', label: '🇦🇺 AUSTRALIA' },
              { id: 'GLOBAL', label: '🛢️ OPEC+' }
            ].map(c => (
              <button
                key={c.id}
                onClick={() => setFilterCountry(c.id)}
                className={`quant-pill-btn ${filterCountry === c.id ? 'active' : ''}`}
                style={{ fontSize: '11px', padding: '5px 10px' }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Impact & Status Filter Pills + Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Impact Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>IMPACT:</span>
              <div className="quant-pill-nav" style={{ margin: 0 }}>
                {[
                  { id: 'ALL', label: 'SEMUA' },
                  { id: 'HIGH', label: '🔴 TINGGI' },
                  { id: 'MED', label: '🟡 SEDANG' },
                  { id: 'LOW', label: '🟢 RENDAH' }
                ].map(imp => (
                  <button
                    key={imp.id}
                    onClick={() => setFilterImpact(imp.id)}
                    className={`quant-pill-btn ${filterImpact === imp.id ? 'active' : ''}`}
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    {imp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>STATUS:</span>
              <div className="quant-pill-nav" style={{ margin: 0 }}>
                {[
                  { id: 'ALL', label: 'SEMUA' },
                  { id: 'UPCOMING', label: '⏳ AKAN RILIS' },
                  { id: 'RELEASED', label: '✅ TELAH RILIS' }
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setFilterTimeframe(st.id)}
                    className={`quant-pill-btn ${filterTimeframe === st.id ? 'active' : ''}`}
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Cari event makro (e.g. Suku Bunga, NFP, CPI)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="quant-input"
            style={{ minWidth: '260px' }}
          />
        </div>
      </div>

      {/* 3. Main Calendar Table */}
      <div className="quant-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="quant-table">
          <thead>
            <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
              <th style={{ padding: '12px 14px', width: '130px' }}>Waktu & Tanggal</th>
              <th style={{ padding: '12px 10px', width: '80px', textAlign: 'center' }}>Negara</th>
              <th style={{ padding: '12px 10px' }}>Indikator / Event Makro</th>
              <th style={{ padding: '12px 10px', width: '100px', textAlign: 'center' }}>Impact</th>
              <th style={{ padding: '12px 10px', width: '90px', textAlign: 'right' }}>Aktual</th>
              <th style={{ padding: '12px 10px', width: '90px', textAlign: 'right' }}>Prakiraan</th>
              <th style={{ padding: '12px 10px', width: '90px', textAlign: 'right' }}>Sebelumnya</th>
              <th style={{ padding: '12px 14px', width: '110px', textAlign: 'center' }}>Detail & Tesis</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Tidak ada event makro yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => {
                const impactBadge = getImpactBadge(evt.impact);
                const isExpanded = expandedId === evt.id;

                return (
                  <React.Fragment key={evt.id}>
                    <tr 
                      onClick={() => toggleExpand(evt.id)}
                      style={{ 
                        borderBottom: 'var(--border-hairline)', 
                        cursor: 'pointer',
                        background: isExpanded ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      {/* Waktu & Tanggal */}
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>
                        <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '13px' }}>
                          {evt.time} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>WIB</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {evt.date}
                        </div>
                      </td>

                      {/* Negara */}
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', lineHeight: 1 }} title={evt.countryName}>
                          {evt.flag}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                          {evt.country}
                        </div>
                      </td>

                      {/* Event Name */}
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                          {evt.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {evt.countryName} &bull; {evt.status === 'RELEASED' ? '✅ Sudah Dirilis' : '⏳ Menunggu Rilis'}
                        </div>
                      </td>

                      {/* Impact Badge */}
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: impactBadge.bg,
                          color: impactBadge.color,
                          border: `1px solid ${impactBadge.border}`,
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.04em'
                        }}>
                          {impactBadge.label}
                        </span>
                      </td>

                      {/* Aktual */}
                      <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: evt.actual !== '—' && evt.actual !== '-' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {evt.actual}
                      </td>

                      {/* Prakiraan */}
                      <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {evt.forecast}
                      </td>

                      {/* Sebelumnya */}
                      <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {evt.previous}
                      </td>

                      {/* Expander Button */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(evt.id);
                          }}
                          style={{
                            background: isExpanded ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-panel-subtle)',
                            border: isExpanded ? '1px solid #38bdf8' : 'var(--border-hairline)',
                            color: isExpanded ? '#38bdf8' : 'var(--text-primary)',
                            padding: '4px 10px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          {isExpanded ? 'Tutup ▲' : 'Bedah ▼'}
                        </button>
                      </td>
                    </tr>

                    {/* Educational Deep-Dive Drawer */}
                    {isExpanded && (
                      <tr style={{ background: 'var(--bg-panel-subtle)', borderBottom: 'var(--border-hairline)' }}>
                        <td colSpan={8} style={{ padding: '18px 22px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                            
                            {/* Card 1: Pengertian & Relevansi */}
                            <div style={{ background: 'var(--bg-panel)', padding: '14px 16px', borderRadius: 'var(--radius-xs)', border: 'var(--border-hairline)' }}>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: '6px' }}>
                                💡 APA ITU & KENAPA PENTING?
                              </div>
                              <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 8px 0' }}>
                                {evt.details?.apaItu}
                              </p>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, borderTop: 'var(--border-hairline)', paddingTop: '6px' }}>
                                <strong>Implikasi Makro:</strong> {evt.details?.kenapaPenting}
                              </div>
                            </div>

                            {/* Card 2: Dampak Lintas Aset */}
                            <div style={{ background: 'var(--bg-panel)', padding: '14px 16px', borderRadius: 'var(--radius-xs)', border: 'var(--border-hairline)' }}>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                📊 DAMPAK TERHADAP KELAS ASET
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {(evt.details?.dampakAset || []).map((da, idx) => (
                                  <div key={idx} style={{ fontSize: '11px', lineHeight: 1.4 }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>{da.asset}: </strong>
                                    <span style={{ color: 'var(--text-secondary)' }}>{da.impact}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Card 3: Tips Eksekusi & Manajemen Risiko */}
                            <div style={{ background: 'var(--bg-panel)', padding: '14px 16px', borderRadius: 'var(--radius-xs)', border: 'var(--border-hairline)' }}>
                              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-green)', textTransform: 'uppercase', marginBottom: '6px' }}>
                                🛡️ TIPS MANAJEMEN RISIKO TRADING
                              </div>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                                {evt.details?.tipsRisiko}
                              </p>
                              <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                STATUS: {evt.status === 'RELEASED' ? 'Data final telah tercatat di bursa' : 'Menjelang rilis berita'}
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
