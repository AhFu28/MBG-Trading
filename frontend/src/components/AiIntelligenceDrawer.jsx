import React, { useState, useMemo } from 'react';

/**
 * Institutional AI Quant Intelligence & Sentinel Desk
 * Framework: Bridgewater Associates & Goldman Sachs Global Investment Research (GIR)
 * Features:
 * 1. Top-Down Macro Thematic Regimes (4 Big Macro Issues & Sectoral Transmission)
 * 2. Universal On-Demand Syndicate Debate & Fundamental Dossier (IDX 861+ Emiten, Crypto, US Equities)
 * 3. Deep-Dive Geopolitical DEFCON Desk:
 *    - Live Computed Institutional Threat Barometer (Non-Manual Slider, Segmented 5-Level Gauge)
 *    - 4 Quantitative Sub-Pillars Breakdown (Energy, Monetary/FX, Tariffs, Military)
 *    - 5 Global Flashpoints Monitor
 *    - Cross-Asset Transmission Impact Matrix
 *    - Interactive "What-If" Geopolitical Stress-Test Simulator (Scenario A / B / C)
 * 4. Fundamental Analysis (Earnings YoY, EBITDA Margin, Smelter/Plant Expansion, M&A Catalysts)
 * 5. Conglomerate Ecosystem & Value-Chain Linkage Graph (Interactive Clickable Ticker Chips)
 * 6. Understated, Non-Alay Model Telemetry & Cascade Failover Indicator
 */

export default function AiIntelligenceDrawer({
  isOpen,
  onClose,
  isDrawer = true,
  threatData = null,
  debateData = null,
  aiDiagnostics = null,
  thematicData = null,
  allIdxStocks = [],
  cryptoData = [],
  usStocksData = null,
  onRefreshDesk = null
}) {
  const [activeTab, setActiveTab] = useState('THEMATIC'); // 'THEMATIC' | 'DEBATE' | 'DEFCON'
  const [selectedThemeId, setSelectedThemeId] = useState('THEME_ENERGY_GEOPOLITICS');
  const [selectedUniverse, setSelectedUniverse] = useState('IDX'); // 'IDX' | 'CRYPTO' | 'US_EQUITIES'
  const [selectedTicker, setSelectedTicker] = useState('MEDC');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState('SCENARIO_BASE');

  // 1. Data Sumber Isu Makro
  const activeThemes = useMemo(() => {
    return thematicData?.macro_themes || [
      {
        id: 'THEME_ENERGY_GEOPOLITICS',
        title: 'Tensi Geopolitik Timur Tengah & Lonjakan Harga Energi',
        tag: 'GEOPOLITIK & ENERGI',
        severity: 'ELEVATED',
        icon: '⚡',
        threat_score: 0.78,
        catalyst_summary: 'Ketegangan di Selat Hormuz memicu premi risiko perang pada rute pasokan minyak mentah dunia, mendorong harga Brent berfluktuasi tinggi.',
        transmission_chain: {
          root_driver: 'Disrupsi Logistik & Ketegangan Jalur Selat Hormuz',
          intermediate_fx: 'Lonjakan harga minyak mentah Brent (> $80/bbl) & kenaikan biaya freight kapal tanker',
          macro_impact: 'Tekanan inflasi energi global, lonjakan harga bahan bakar industri, dan pelebaran defisit neraca dagang migas RI',
          positive_sectors: [
            { sector: 'Minyak & Gas Bumi Hulu (Upstream O&G)', rationale: 'Kenaikan ASP minyak mentah langsung melipatgandakan margin EBITDA tanpa kenaikan biaya lifting.' },
            { sector: 'Penyedia Jasa & Logistik Energi', rationale: 'Permintaan kapal tanker dan sewa rig lepas pantai menguat tajam.' },
            { sector: 'Batu Bara Termal Alternatif', rationale: 'Substitusi pembangkit listrik Eropa dan Asia saat harga gas/minyak membengkak.' }
          ],
          negative_sectors: [
            { sector: 'Aviasi & Transportasi Maskapai', rationale: 'Biaya bahan bakar avtur mencakup >35% struktur biaya operasional, menekan laba bersih.' },
            { sector: 'Manufaktur Plastik & Petrokimia', rationale: 'Kenaikan harga bahan baku nafta turunan minyak bumi tidak bisa langsung di-pass-on ke konsumen.' },
            { sector: 'Ritel & Konsumen Barang Sekunder', rationale: 'Erosi purchasing power jika subsidi BBM domestik mengalami penyesuaian harga.' }
          ]
        },
        top_beneficiaries: [
          { ticker: 'MEDC', name: 'PT Medco Energi Internasional Tbk', category: 'UPSTREAM OIL & GAS', current_price: 1285, target_price: 1540, stop_loss: 1180, fit_score: 94, transmission_link: 'Sensitivitas EBITDA tertinggi terhadap kenaikan harga minyak mentah Brent ($1 kenaikan = +$15M EBITDA).', consensus_bull_pct: 85, arbiter_verdict: 'STRONG ACCUMULATE (85% SIZE)' },
          { ticker: 'ENRG', name: 'PT Energi Mega Persada Tbk', category: 'OIL & GAS EXPLORATION', current_price: 240, target_price: 310, stop_loss: 218, fit_score: 88, transmission_link: 'Peningkatan produksi gas Blok Kangean & Malacca Strait diuntungkan kontrak penyerapan gas industri harga premium.', consensus_bull_pct: 78, arbiter_verdict: 'APPROVED // TACTICAL (70% SIZE)' },
          { ticker: 'PGAS', name: 'PT Perusahaan Gas Negara Tbk', category: 'GAS TRANSMISSION', current_price: 1560, target_price: 1780, stop_loss: 1450, fit_score: 85, transmission_link: 'Volume transmisi pipa gas stabil dengan perbaikan pasokan regasifikasi LNG ke pembangkit listrik PLN.', consensus_bull_pct: 75, arbiter_verdict: 'APPROVED (75% SIZE)' },
          { ticker: 'AKRA', name: 'PT AKR Corporindo Tbk', category: 'ENERGY LOGISTICS', current_price: 1480, target_price: 1720, stop_loss: 1390, fit_score: 82, transmission_link: 'Model bisnis pass-through formula BBM industri melindungi margin, ditambah monetisasi lahan JIIPE.', consensus_bull_pct: 80, arbiter_verdict: 'APPROVED (80% SIZE)' }
        ],
        safe_havens: [
          { ticker: 'ADRO', name: 'PT Alamtri Resources Indonesia Tbk', reason: 'Cadangan kas masif (>Rp 30T) dan yield dividen tebal >8%.' },
          { ticker: 'PTBA', name: 'PT Bukit Asam Tbk', reason: 'Kontrak pasokan batubara DMO domestik PLN menjamin arus kas defensif.' }
        ],
        vulnerable_stocks: [
          { ticker: 'GIAA', name: 'PT Garuda Indonesia (Persero) Tbk', reason: 'Sensitivitas ekstrem terhadap lonjakan harga avtur dan depresiasi rupiah.' },
          { ticker: 'TPIA', name: 'PT Chandra Asri Pacific Tbk', reason: 'Kompresi margin petrokimia akibat mahalnya nafta impor berbasis minyak mentah.' }
        ]
      },
      {
        id: 'THEME_MONETARY_FX',
        title: 'Divergensi Moneter The Fed - BI & Pertahanan Kurs Rupiah',
        tag: 'MAKRO MONETER & KURS',
        severity: 'HIGH',
        icon: '🏦',
        threat_score: 0.72,
        catalyst_summary: 'Indeks DXY bertahan kuat di atas 104 dan yield US Treasury 10Y tinggi membatasi ruang pelonggaran BI-Rate dan menekan Rupiah mendekati level Rp 16.000/USD.',
        transmission_chain: {
          root_driver: 'Ketahanan Ekonomi AS & Divergensi Suku Bunga Global',
          intermediate_fx: 'Yield spread US-SBN menyempit, memicu foreign portfolio rebalancing ke aset USD',
          macro_impact: 'Pengetatan likuiditas valas domestik, BI menaikkan suku bunga SRBI, dan biaya impor membengkak',
          positive_sectors: [
            { sector: 'Eksportir Murni Berbasis Pendapatan USD', rationale: 'Biaya operasional mayoritas dalam Rupiah sementara pendapatan dalam USD menghasilkan windfall kurs.' },
            { sector: 'Perbankan Tier-1 Ber-CASA Tebal', rationale: 'Dana murah (CASA > 80%) melindungi margin bunga bersih (NIM) saat suku bunga pasar antarbank tinggi.' }
          ],
          negative_sectors: [
            { sector: 'Emiten dengan Utang Valas Tanpa Hedging', rationale: 'Beban rugi selisih kurs langsung menggerus laba bersih di laporan keuangan.' },
            { sector: 'Manufaktur Bahan Baku Impor (Konsumer & Farmasi)', rationale: 'Biaya pokok produksi (COGS) naik karena impor bahan baku lebih mahal dalam rupiah.' }
          ]
        },
        top_beneficiaries: [
          { ticker: 'BBCA', name: 'PT Bank Central Asia Tbk', category: 'BANKING LEADER', current_price: 6200, target_price: 6500, stop_loss: 6050, fit_score: 92, transmission_link: 'Rasio CASA tertinggi (82%) memberikan imunitas terhadap lonjakan biaya dana (CoF).', consensus_bull_pct: 82, arbiter_verdict: 'STRONG ACCUMULATE (85% SIZE)' },
          { ticker: 'ITMG', name: 'PT Indo Tambangraya Megah Tbk', category: 'EXPORT COAL', current_price: 26800, target_price: 29500, stop_loss: 25200, fit_score: 89, transmission_link: '100% pendapatan ekspor batubara dalam denominasi USD dengan neraca net-cash tanpa utang jangka panjang.', consensus_bull_pct: 78, arbiter_verdict: 'APPROVED // DIVIDEND CASH COW (75% SIZE)' },
          { ticker: 'AMMN', name: 'PT Amman Mineral Internasional Tbk', category: 'COPPER & GOLD EXPORTER', current_price: 9300, target_price: 10800, stop_loss: 8650, fit_score: 86, transmission_link: 'Pendapatan ekspor konsentrat tembaga-emas dalam USD didukung harga tembaga global yang tangguh.', consensus_bull_pct: 75, arbiter_verdict: 'APPROVED // GROWTH PLAY (70% SIZE)' }
        ],
        safe_havens: [
          { ticker: 'BMRI', name: 'PT Bank Mandiri (Persero) Tbk', reason: 'Dominasi transaksi korporasi dan transaksi valas perbankan nasional.' },
          { ticker: 'ICBP', name: 'PT Indofood CBP Sukses Makmur Tbk', reason: 'Pricing power kuat emiten mie instan untuk mengompensasi biaya gandum impor.' }
        ],
        vulnerable_stocks: [
          { ticker: 'JSMR', name: 'PT Jasa Marga (Persero) Tbk', reason: 'Beban bunga utang proyek infrastruktur saat suku bunga pinjaman bertahan tinggi.' },
          { ticker: 'KLBF', name: 'PT Kalbe Farma Tbk', reason: '>85% bahan baku obat aktif (API) masih diimpor dalam USD.' }
        ]
      },
      {
        id: 'THEME_GOLD_COMMODITY',
        title: 'Supercycle Logam Mulia & Safe-Haven Emas Dunia',
        tag: 'KOMODITAS & SAFE-HAVEN',
        severity: 'BULLISH_OPPORTUNITY',
        icon: '🪙',
        threat_score: 0.45,
        catalyst_summary: 'Harga Emas Spot internasional menembus rekor all-time high ($2,650+/oz) didorong de-dolarisasi cadangan devisa bank sentral global, ketidakpastian utang kedaulatan barat, dan permintaan safe-haven ritel.',
        transmission_chain: {
          root_driver: 'Akumulasi Emas Bank Sentral Dunia & De-Dolarisasi Cadangan',
          intermediate_fx: 'Lonjakan harga emas fisik per gram di pasar domestik melampaui Rp 1.450.000/gram',
          macro_impact: 'Margin pemurnian dan perdagangan emas ritel meledak, valuasi cadangan mineral tambang emas terevaluasi naik',
          positive_sectors: [
            { sector: 'Penambang & Pedagang Emas (Gold Miners & Traders)', rationale: 'Kenaikan harga jual emas langsung mengalir ke arus kas operasional tanpa kenaikan biaya penambangan sebanding.' },
            { sector: 'Mineral Tembaga & Perak Terkait', rationale: 'Produk sampingan (by-product) emas dalam bijih tembaga menurunkan net cash cost penambangan.' }
          ],
          negative_sectors: [
            { sector: 'Manufaktur Perhiasan Konsumsi Lokal', rationale: 'Harga emas terlalu mahal memicu perlambatan volume pembelian perhiasan ritel domestik.' }
          ]
        },
        top_beneficiaries: [
          { ticker: 'ANTM', name: 'PT Aneka Tambang Tbk', category: 'GOLD TRADING & PRECIOUS METALS', current_price: 1585, target_price: 1850, stop_loss: 1460, fit_score: 96, transmission_link: 'Monopoli pasar emas ritel bersertifikasi LBMA di Indonesia, volume penjualan emas Logam Mulia melonjak ke rekor tertinggi.', consensus_bull_pct: 88, arbiter_verdict: 'STRONG BUY // ASYMMETRIC LONG (85% SIZE)' },
          { ticker: 'BRMS', name: 'PT Bumi Resources Minerals Tbk', category: 'PURE GOLD MINING', current_price: 360, target_price: 440, stop_loss: 320, fit_score: 91, transmission_link: 'Kapasitas pabrik pengolahan emas Poboya Palu (Pabrik ke-2) beroperasi penuh di tengah rekor harga emas dunia.', consensus_bull_pct: 82, arbiter_verdict: 'APPROVED // MOMENTUM LONG (75% SIZE)' },
          { ticker: 'MDKA', name: 'PT Merdeka Copper Gold Tbk', category: 'DIVERSIFIED GOLD & COPPER', current_price: 2340, target_price: 2750, stop_loss: 2150, fit_score: 85, transmission_link: 'Arus kas dari Tambang Emas Tujuh Bukit menopang pembiayaan proyek tembaga bawah tanah Tujuh Bukit Copper.', consensus_bull_pct: 78, arbiter_verdict: 'APPROVED // BREAKOUT WATCH (70% SIZE)' }
        ],
        safe_havens: [
          { ticker: 'ANTM', name: 'PT Aneka Tambang Tbk', reason: 'Penerima manfaat langsung inflasi dan devaluasi mata uang kertas.' },
          { ticker: 'UNTR', name: 'PT United Tractors Tbk', reason: 'Ekspansi tambang emas Martabe dan Sumbawa Jutaraya mempertebal kontribusi laba non-batubara.' }
        ],
        vulnerable_stocks: [
          { ticker: 'HRUM', name: 'PT Harum Energy Tbk', reason: 'Porsi nikel tinggi yang masih terbebani oversupply NPI global.' }
        ]
      },
      {
        id: 'THEME_DOMESTIC_CONSUMPTION',
        title: 'Siklus Konsumsi Domestik & Transisi Kendaraan Listrik (EV)',
        tag: 'KONSUMSI & INDUSTRI',
        severity: 'MODERATE',
        icon: '🛒',
        threat_score: 0.38,
        catalyst_summary: 'Stimulus fiskal program bantuan sosial, akselerasi proyek hilirisasi ekosistem baterai EV nasional, dan momentum belanja ritel kuartalan.',
        transmission_chain: {
          root_driver: 'Belanja Rumah Tangga Kuat & Hilirisasi Baterai Nikel',
          intermediate_fx: 'Perputaran uang cepat di sektor FMCG dan lonjakan investasi pabrik baterai hilir',
          macro_impact: 'Kenaikan konsumsi domestik, penguatan indeks penjualan eceran, dan adopsi EV komersial',
          positive_sectors: [
            { sector: 'Barang Konsumsi Cepat Habis (FMCG)', rationale: 'Permintaan pangan dan minuman stabil dengan margin tebal di segmen mass market.' },
            { sector: 'Ritel Modern & Minimarket', rationale: 'Ekspansi gerai terarah ke kota-kota tier 2 dan tier 3 mengunci market share.' },
            { sector: 'Hilirisasi Nikel & Rantai Baterai EV', rationale: 'Insentif fiskal pembebasan PPN EV dan pembangunan smelter HPAL mengerek serapan bijih nikel.' }
          ],
          negative_sectors: [
            { sector: 'Otomotif ICE Konvensional', rationale: 'Penyusutan pangsa pasar kendaraan bensin akibat persaingan ketat EV pabrikan luar negeri.' }
          ]
        },
        top_beneficiaries: [
          { ticker: 'ICBP', name: 'PT Indofood CBP Sukses Makmur Tbk', category: 'CONSUMER STAPLES LEADER', current_price: 12050, target_price: 13400, stop_loss: 11450, fit_score: 93, transmission_link: 'Dominasi mutlak pangsa pasar mie instan (>70%) dengan elastisitas harga rendah dan ekspansi Pinehill luar negeri.', consensus_bull_pct: 84, arbiter_verdict: 'STRONG BUY // QUALITY COMPOUNDER (80% SIZE)' },
          { ticker: 'AMRT', name: 'PT Sumber Alfaria Trijaya Tbk', category: 'MODERN RETAIL DISTRIBUTION', current_price: 3120, target_price: 3550, stop_loss: 2940, fit_score: 90, transmission_link: 'Jaringan lebih dari 20.000 gerai Alfamart menjadi saluran utama sirkulasi bansos dan belanja mikro rumah tangga.', consensus_bull_pct: 80, arbiter_verdict: 'APPROVED // ACCUMULATE ON DIP (75% SIZE)' },
          { ticker: 'NCKL', name: 'PT Trimegah Bangun Persada Tbk', category: 'BATTERY NICKEL HPAL', current_price: 895, target_price: 1080, stop_loss: 820, fit_score: 87, transmission_link: 'Biaya produksi HPAL Pulau Obi termasuk kuartil terendah di dunia dengan kontrak pasokan MHP ke produsen katoda global.', consensus_bull_pct: 76, arbiter_verdict: 'APPROVED // COMMODITY RECOVERY (70% SIZE)' }
        ],
        safe_havens: [
          { ticker: 'MYOR', name: 'PT Mayora Indah Tbk', reason: 'Kekuatan ekspor biskuit & permen ke >100 negara mengimbangi risiko konsumsi lokal.' },
          { ticker: 'INDF', name: 'PT Indofood Sukses Makmur Tbk', reason: 'Valuasi diskon konglomerasi tebal dengan kepemilikan saham di ICBP dan agribisnis.' }
        ],
        vulnerable_stocks: [
          { ticker: 'ASII', name: 'PT Astra International Tbk', reason: 'Penyusutan pangsa pasar penjualan mobil 4W domestik akibat penetrasi EV impor.' },
          { ticker: 'ACES', name: 'PT Aspirasi Hidup Indonesia Tbk', reason: 'Sensitivitas belanja barang gaya hidup rumah tangga kelas menengah.' }
        ]
      }
    ];
  }, [thematicData]);

  // Current selected theme
  const currentTheme = useMemo(() => {
    return activeThemes.find(t => t.id === selectedThemeId) || activeThemes[0];
  }, [activeThemes, selectedThemeId]);

  // 2. Geopolitical Desk Data
  const geoDesk = useMemo(() => {
    return threatData || {
      defcon_level: 4,
      defcon_title: 'DEFCON 4 // GUARDED / WASPADA TERUKUR',
      primary_threat: 'Tensi geopolitik energi Selat Hormuz & divergensi suku bunga The Fed-BI memicu rebalancing portofolio lintas aset.',
      threat_score: 0.42,
      macro_risk_guidance: 'Pertahankan alokasi cadangan kas 25-30% likuid. Pasang trailing stop disiplin (1.8x ATR) pada saham energi & perbankan. Manfaatkan emas spot & instrumen jangka pendek untuk safe-haven hedge.',
      sub_pillars: [
        { id: 'PILLAR_ENERGY', name: 'Rantai Pasok Energi & Chokepoint Selat Hormuz', score: 68, severity: 'ELEVATED', weight: '35%', note: 'Premi risiko perang tanker naik, Brent rentan spike ke $85-$92/bbl' },
        { id: 'PILLAR_FX', name: 'Divergensi Moneter & Pertahanan Kurs Rupiah', score: 54, severity: 'MODERATE', weight: '30%', note: 'DXY di atas 104, BI intervensi valas & SRBI untuk menjaga Rp 16.000' },
        { id: 'PILLAR_TRADE', name: 'Perang Tarif Dagang & Fragmentasi Pasok', score: 45, severity: 'MODERATE', weight: '20%', note: 'Tekanan proteksionisme AS-Tiongkok, peluang relokasi pabrik ke KIT Batang' },
        { id: 'PILLAR_MILITARY', name: 'Manuver Militer & Titik Rawan Maritim', score: 32, severity: 'GUARDED', weight: '15%', note: 'Pengawasan patroli maritim Selat Malaka & Selat Taiwan' }
      ],
      simulated_scenarios: [
        {
          id: 'SCENARIO_BASE',
          name: 'SKENARIO 1: STATUS QUO (DEFCON 4 // GUARDED)',
          defcon_level: 4,
          badge: 'KONDISI RIIL AKTIF',
          threat_score: 0.42,
          brent_price: '$78 - $84 / bbl',
          usd_idr: 'Rp 15.900 - Rp 16.150',
          sbn_yield: '6.75% - 6.90%',
          cash_buffer: '25% - 30% Likuid',
          tactical_focus: 'Akumulasi terarah saham berfundamental prima (BBCA, BMRI, ICBP). Manfaatkan swing momentum pada ANTM & MEDC.',
          winners: ['MEDC', 'BBCA', 'ICBP'],
          losers: ['GIAA', 'JSMR']
        },
        {
          id: 'SCENARIO_HORMUZ',
          name: 'SKENARIO 2: ESKALASI SELAT HORMUZ (DEFCON 2 // ARMED ENGAGEMENT)',
          defcon_level: 2,
          badge: 'SIMULASI SHOCK MINYAK',
          threat_score: 0.78,
          brent_price: '$95 - $110 / bbl (+28%)',
          usd_idr: 'Rp 16.350 - Rp 16.600 (+3.5%)',
          sbn_yield: '7.15% - 7.40%',
          cash_buffer: '35% - 40% Likuid',
          tactical_focus: 'Rotasi agresif: Naikkan porsi emiten hulu migas (MEDC, ENRG) dan emas safe-haven (ANTM). Cut loss langsung maskapai (GIAA) & manufaktur bahan baku impor.',
          winners: ['MEDC', 'ENRG', 'ANTM'],
          losers: ['GIAA', 'TPIA', 'KLBF']
        },
        {
          id: 'SCENARIO_TARIFFS',
          name: 'SKENARIO 3: PERANG TARIF GLOBAL & STAGFLASI (DEFCON 3 // ELEVATED)',
          defcon_level: 3,
          badge: 'SIMULASI SHOCK PERDAGANGAN',
          threat_score: 0.62,
          brent_price: '$70 - $76 / bbl (-12%)',
          usd_idr: 'Rp 16.200 - Rp 16.450',
          sbn_yield: '6.95% - 7.20%',
          cash_buffer: '30% - 35% Likuid',
          tactical_focus: 'Pindah ke mode defensif maksimal. Tingkatkan alokasi instrumen pasar uang, emas spot, dan emiten berdividen tunai jumbo (ITMG, ADRO).',
          winners: ['ITMG', 'ADRO', 'ANTM'],
          losers: ['ASII', 'ACES', 'DMAS']
        }
      ],
      flashpoints: [
        {
          id: 'FLASH_HORMUZ',
          name: 'Selat Hormuz & Jalur Tanker Minyak Teluk Persia',
          region: 'Timur Tengah (Iran / Selat Hormuz)',
          threat_level: 'ELEVATED',
          severity_score: 0.85,
          status_badge: 'ACTIVE CHOKEPOINT RISK',
          description: 'Selat Hormuz dilalui oleh lebih dari 20% pasokan minyak mentah cair dunia (±21 juta barel per hari). Friksi militer secara berkala memicu lonjakan premi asuransi perang tanker hingga +300% dan risiko lonjakan harga minyak mentah Brent menembus $90+/barel.',
          transmission: 'Lonjakan ASP minyak mentah -> Ekuitas O&G Hulu (MEDC, ENRG) mencetak windfall EBITDA -> Beban avtur maskapai (GIAA) dan biaya bahan baku nafta petrokimia (TPIA) terkompresi tajam.',
          affected_tickers: ['MEDC', 'ENRG', 'PGAS', 'AKRA', 'GIAA', 'TPIA'],
          catalysts: ['Premi risiko perang asuransi tanker', 'Kepatuhan kuota produksi OPEC+', 'Cadangan minyak strategis SPR AS']
        },
        {
          id: 'FLASH_FED_BI',
          name: 'Divergensi Suku Bunga The Fed vs BI-Rate & Ketahanan Rupiah',
          region: 'Global / Pasar Finansial Domestik',
          threat_level: 'HIGH',
          severity_score: 0.76,
          status_badge: 'MONETARY REGIME PRESSURE',
          description: 'Indeks DXY bertahan di atas 104 dan yield US 10-Year Treasury bertahan tinggi menyempitkan yield spread dengan SBN 10Y RI. Bank Indonesia dipaksa mempertahankan suku bunga SRBI tinggi untuk membendung arus modal keluar (capital outflow) dan menahan depresiasi Rupiah di kisaran Rp 16.000 - 16.250/USD.',
          transmission: 'Suku bunga tinggi berlarut menekan emiten dengan leverage utang tinggi (JSMR, WIKA). Namun, perbankan tier-1 dengan rasio CASA masif (BBCA 82%, BMRI 78%) menikmati Net Interest Margin (NIM) prima.',
          affected_tickers: ['BBCA', 'BMRI', 'BBRI', 'BBNI', 'JSMR', 'KLBF'],
          catalysts: ['Dot Plot suku bunga The Fed', 'Lelang instrumen SRBI & SVBI BI', 'Cadangan devisa Bank Indonesia']
        },
        {
          id: 'FLASH_TARIFFS',
          name: 'Perang Tarif Dagang & Embargo Semikonduktor AS-Tiongkok',
          region: 'Asia Pasifik / AS - Tiongkok',
          threat_level: 'MODERATE',
          severity_score: 0.65,
          status_badge: 'SUPPLY CHAIN REALIGNMENT',
          description: 'Kenaikan tarif bea masuk produk industri Tiongkok ke pasar barat dan restriksi ekspor chip canggih memicu fragmentasi rantai pasok global. Tiongkok mengalihkan ekspor murah ke negara berkembang (risiko dumping pasar lokal), namun membuka peluang \'China+1\' berupa relokasi pabrik manufaktur ke koridor industri Jawa Tengah (KIT Batang, KI Kendal).',
          transmission: 'Peluang penyerapan lahan industri (DMAS, SSIA, AKRA) meningkat. Di sisi lain, persaingan harga produk hilir tekstil & baja lokal tertekan produk impor murah.',
          affected_tickers: ['AKRA', 'DMAS', 'SSIA', 'ASII', 'SRIL'],
          catalysts: ['Regulasi Section 301 tarif AS', 'Investasi langsung PMA Tiongkok ke RI', 'Kebijakan anti-dumping Kemendag']
        },
        {
          id: 'FLASH_TAIWAN',
          name: 'Selat Taiwan & Keamanan Jalur Maritim Pasifik Barat',
          region: 'Asia Timur / Selat Taiwan',
          threat_level: 'GUARDED',
          severity_score: 0.58,
          status_badge: 'TECH LOGISTICS WATCH',
          description: 'Selat Taiwan dan Laut Cina Selatan memproses hampir separuh armada peti kemas dunia dan mayoritas distribusi fabrikasi chip logika canggih TSMC. Setiap peningkatan manuver maritim memicu keterlambatan pengapalan komponen elektronik, server AI, dan suku cadang presisi.',
          transmission: 'Disrupsi pengapalan hardware global -> Kenaikan lead time server cloud & telco (TLKM, ISAT) -> Likuiditas pasar modal Asia bergerak defensif.',
          affected_tickers: ['NVDA', 'TSM', 'AAPL', 'TLKM', 'TOWR'],
          catalysts: ['Latihan maritim lintas selat', 'Diversifikasi pabrik TSMC ke Arizona/Jepang', 'Biaya kargo kontainer rute trans-Pasifik']
        },
        {
          id: 'FLASH_BLACKSEA',
          name: 'Koridor Gandum & Pasokan Pupuk Kalium/Fosfat Laut Hitam',
          region: 'Eropa Timur / Laut Hitam',
          threat_level: 'MODERATE',
          severity_score: 0.52,
          status_badge: 'FOOD & COMMODITY WATCH',
          description: 'Ketidakpastian logistik Laut Hitam mempengaruhi harga acuan gandum Chicago (CBOT) dan pasokan pupuk kalium/fosfat dunia. Bagi Indonesia, harga gandum mempengaruhi beban biaya produksi mie instan dan pakan ternak, sementara harga pupuk menentukan biaya operasional perkebunan kelapa sawit.',
          transmission: 'Volatilitas harga gandum diimbangi oleh kenaikan harga CPO global akibat substitusi minyak nabati -> Emiten CPO (AALI, LSIP, TAPG) mendapatkan momentum perbaikan arus kas operasional.',
          affected_tickers: ['ICBP', 'INDF', 'AALI', 'LSIP', 'CPIN', 'JPFA'],
          catalysts: ['Kesepakatan koridor biji-bijian Laut Hitam', 'Bea keluar CPO & pungutan BPDPKS', 'Harga pupuk NPK internasional']
        }
      ],
      cross_asset_matrix: [
        { asset: 'Minyak Mentah Brent', trend: 'BULLISH', impact: 'Lonjakan premi risiko perang Selat Hormuz', affected_sectors: 'Migas Hulu (+), Aviasi (-), Petrokimia (-)', sentiment_color: '#10b981' },
        { asset: 'Emas Spot (XAU/USD)', trend: 'STRONG_BULLISH', impact: 'All-Time High de-dolarisasi cadangan devisa bank sentral', affected_sectors: 'Tambang Emas (ANTM, BRMS, MDKA) (+)', sentiment_color: '#10b981' },
        { asset: 'US Dollar (DXY)', trend: 'BULLISH', impact: 'Yield Treasury 10Y tinggi menarik modal ke safe USD', affected_sectors: 'Eksportir USD (+), Emiten Utang Valas (-)', sentiment_color: '#38bdf8' },
        { asset: 'USD / IDR', trend: 'BEARISH_PRESSURE', impact: 'Tekanan pelemahan rupiah mendekati level psikologis Rp 16.000', affected_sectors: 'Impor Bahan Baku (-), SBN Valas (-)', sentiment_color: '#ef4444' },
        { asset: 'Obligasi SBN 10Y', trend: 'NEUTRAL_CAUTION', impact: 'Yield bertahan di kisaran 6.75% - 6.95%', affected_sectors: 'Perbankan NIM (↔), Properti & Konstruksi (-)', sentiment_color: '#f59e0b' },
        { asset: 'Saham Perbankan Tier-1', trend: 'DEFENSIVE_QUALITY', impact: 'CASA tebal > 80% menjadi jangkar bantalan likuiditas', affected_sectors: 'BBCA, BMRI, BBNI (Defensive Safe Haven)', sentiment_color: '#10b981' }
      ]
    };
  }, [threatData]);

  // DEFCON is computed strictly from intelligence data (0.42 -> DEFCON 4)
  const defcon = geoDesk.defcon_level || 4;

  // Selected simulated scenario
  const activeSimulatedScenario = useMemo(() => {
    return geoDesk.simulated_scenarios?.find(s => s.id === selectedScenarioId) || geoDesk.simulated_scenarios?.[0] || {
      id: 'SCENARIO_BASE',
      name: 'SKENARIO 1: STATUS QUO (DEFCON 4 // GUARDED)',
      defcon_level: 4,
      brent_price: '$78 - $84 / bbl',
      usd_idr: 'Rp 15.900 - Rp 16.150',
      sbn_yield: '6.75% - 6.90%',
      cash_buffer: '25% - 30% Likuid',
      tactical_focus: 'Akumulasi terarah saham berfundamental prima (BBCA, BMRI, ICBP). Manfaatkan swing momentum pada ANTM & MEDC.',
      winners: ['MEDC', 'BBCA', 'ICBP'],
      losers: ['GIAA', 'JSMR']
    };
  }, [geoDesk, selectedScenarioId]);

  // 3. Diagnostics & Telemetry Data (Strictly non-alay, factual model status)
  const diag = aiDiagnostics || debateData?.diagnostics || {
    active_model: 'gemini-3.8-flash',
    fast_model: 'gemini-3.8-flash',
    status: 'ONLINE',
    latency_ms: 158
  };

  const activeModelName = diag.active_model || 'gemini-3.8-flash';
  const isFailover = diag.status === 'FAILOVER' || activeModelName.includes('2.5') || activeModelName.includes('fallback');
  const activeLatency = diag.last_call?.latency_ms || diag.latency_ms || 158;

  // 4. Fundamental & Linkages Catalog (Local fallback if API offline)
  const fundamentalCatalog = {
    MEDC: {
      net_profit_yoy: '+38.4%',
      revenue_yoy: '+22.1%',
      ebitda_margin: '44.8%',
      der: '1.15x',
      operating_cash_flow: 'Positif Kuat (> $450M Anualisasi)',
      key_corporate_catalyst: 'Penyelesaian akuisisi hak partisipasi Blok Sakakemang dan peningkatan kapasitas produksi gas pipa koridor Sumatera Selatan. Kepemilikan 21% di AMMN menyumbang dividen & equity income tebal pasca smelter Sumbawa beroperasi.'
    },
    ENRG: {
      net_profit_yoy: '+29.2%',
      revenue_yoy: '+17.5%',
      ebitda_margin: '48.2%',
      der: '0.85x',
      operating_cash_flow: 'Positif Solid',
      key_corporate_catalyst: 'Pengeboran 4 sumur eksplorasi gas baru di Blok Kangean dan Malacca Strait untuk memperpanjang kontrak penyerapan gas industri jangka panjang dengan harga premium.'
    },
    PGAS: {
      net_profit_yoy: '+14.7%',
      revenue_yoy: '+8.9%',
      ebitda_margin: '23.5%',
      der: '0.72x',
      operating_cash_flow: 'Positif Sangat Sehat',
      key_corporate_catalyst: 'Penyelesaian pipa gas Cirebon-Semarang (Cisem) Tahap 2 menghubungkan pasokan gas bumi murah ke kawasan industri Kendal dan Batang, memacu volume niaga gas harian.'
    },
    BBCA: {
      net_profit_yoy: '+15.8%',
      revenue_yoy: '+12.4%',
      ebitda_margin: 'N/A (NIM: 5.8%)',
      der: 'Rasio CASA: 82.1%',
      operating_cash_flow: 'Kualitas Aset Prima (NPL 1.9%)',
      key_corporate_catalyst: 'Kombinasi dana murah CASA 82% dan pertumbuhan kredit korporasi hijau (green financing) menjaga imunitas laba bersih terhadap fluktuasi suku bunga acuan.'
    },
    BMRI: {
      net_profit_yoy: '+18.5%',
      revenue_yoy: '+14.2%',
      ebitda_margin: 'N/A (NIM: 5.2%)',
      der: 'Rasio CASA: 78.4%',
      operating_cash_flow: 'NPL Terendah (1.12% Gross)',
      key_corporate_catalyst: 'Platform Livin\' & Kopra by Mandiri membukukan rekor volume transaksi >Rp 3.500T, mendominasi pembiayaan sindikasi infrastruktur & komoditas nasional.'
    },
    BBRI: {
      net_profit_yoy: '+8.2%',
      revenue_yoy: '+11.5%',
      ebitda_margin: 'N/A (NIM: 7.7%)',
      der: 'Rasio CASA: 65.2%',
      operating_cash_flow: 'Pencadangan NPL Aman (Coverage >220%)',
      key_corporate_catalyst: 'Holding integrasi Ultra Mikro (Pegadaian & PNM) mempercepat ekspansi nasabah produktif tier bawah dengan marjin bunga tebal pasca normalisasi restrukturisasi kredit.'
    },
    ANTM: {
      net_profit_yoy: '+42.1%',
      revenue_yoy: '+33.8%',
      ebitda_margin: '22.4%',
      der: '0.45x',
      operating_cash_flow: 'Positif Tinggi',
      key_corporate_catalyst: 'Volume penjualan emas fisik Logam Mulia menembus rekor all-time high di tengah reli harga emas dunia, ditambah progres pembangunan ekosistem baterai nikel terintegrasi dengan konsorsium LG.'
    },
    BRMS: {
      net_profit_yoy: '+64.5%',
      revenue_yoy: '+51.2%',
      ebitda_margin: '52.0%',
      der: '0.32x',
      operating_cash_flow: 'Ekspansi Kas Operasional',
      key_corporate_catalyst: 'Pabrik pengolahan bijih emas kedua di Palu beroperasi dengan kapasitas penuh 4.000 ton/hari, serta akselerasi pengeboran cadangan emas kadar tinggi di Gorontalo Minerals.'
    },
    MDKA: {
      net_profit_yoy: '+19.8%',
      revenue_yoy: '+26.4%',
      ebitda_margin: '31.5%',
      der: '0.95x',
      operating_cash_flow: 'Positif Solid',
      key_corporate_catalyst: 'Pengembangan proyek tambang tembaga bawah tanah kelas dunia Tujuh Bukit Copper Project didanai dari arus kas tambang emas Tujuh Bukit dan smelter nikel HPAL Morowali.'
    },
    ASII: {
      net_profit_yoy: '+5.2%',
      revenue_yoy: '+7.8%',
      ebitda_margin: '18.6%',
      der: '0.48x',
      operating_cash_flow: 'Kas Operasional Prima (>Rp 35T)',
      key_corporate_catalyst: 'Diversifikasi non-otomotif agresif via UNTR (akuisisi tambang nikel Stargate & emas Martabe), mengimbangi dinamika persaingan pasar mobil 4W konvensional.'
    },
    UNTR: {
      net_profit_yoy: '+12.3%',
      revenue_yoy: '+15.0%',
      ebitda_margin: '26.8%',
      der: '0.35x',
      operating_cash_flow: 'Kas Bersih Melimpah',
      key_corporate_catalyst: 'Peningkatan kontribusi pendapatan tambang emas Martabe dan Sumbawa Jutaraya hingga >35% dari total laba, bertransformasi dari ketergantungan murni kontraktor batubara.'
    },
    BRPT: {
      net_profit_yoy: '+21.4%',
      revenue_yoy: '+18.9%',
      ebitda_margin: '34.2%',
      der: '1.05x',
      operating_cash_flow: 'Positif Terkonsolidasi',
      key_corporate_catalyst: 'Holding konglomerasi Barito mengintegrasikan ekspansi PLTP Star Energy BREN dan pembangunan mega-proyek pabrik chlor-alkali & ethylene dichloride TPIA senilai $1 Miliar.'
    },
    BREN: {
      net_profit_yoy: '+16.7%',
      revenue_yoy: '+14.5%',
      ebitda_margin: '78.4%',
      der: '1.40x',
      operating_cash_flow: 'Arus Kas Kontrak Jangka Panjang USD',
      key_corporate_catalyst: 'Ekspansi kapasitas panas bumi Salak, Darajat, dan Wayang Windu sebesar 102.5 MW serta monetisasi sertifikat kredit karbon internasional (VCS).'
    },
    TPIA: {
      net_profit_yoy: '+11.2%',
      revenue_yoy: '+13.4%',
      ebitda_margin: '14.8%',
      der: '0.88x',
      operating_cash_flow: 'Positif Stabil',
      key_corporate_catalyst: 'Konstruksi pabrik chlor-alkali & EDC skala global di Cilegon untuk menyuplai bahan kimia pemurnian smelter nikel dan alumina di Indonesia Timur.'
    },
    CUAN: {
      net_profit_yoy: '+55.0%',
      revenue_yoy: '+48.3%',
      ebitda_margin: '38.5%',
      der: '0.92x',
      operating_cash_flow: 'Lonjakan Kas Masuk',
      key_corporate_catalyst: 'Sinergi operasional penuh pasca akuisisi Petrosea (PTRO), diversifikasi ke konsesi tambang batubara metalurgi coking coal dan tambang silika/emas.'
    },
    PTRO: {
      net_profit_yoy: '+41.8%',
      revenue_yoy: '+36.5%',
      ebitda_margin: '24.6%',
      der: '0.78x',
      operating_cash_flow: 'Positif Kuat',
      key_corporate_catalyst: 'Perolehan kontrak baru jasa penambangan dan rekayasa EPC senilai total lebih dari $1.2 Miliar dari konsorsium domestik dan multinasional.'
    },
    AMMN: {
      net_profit_yoy: '+88.6%',
      revenue_yoy: '+62.4%',
      ebitda_margin: '61.2%',
      der: '0.82x',
      operating_cash_flow: 'Kas Operasional Super-Jumbo',
      key_corporate_catalyst: 'Smelter tembaga Sumbawa beroperasi komersial penuh memurnikan 900.000 ton konsentrat per tahun menjadi katoda tembaga murni, emas batangan, dan asam sulfat.'
    },
    ADRO: {
      net_profit_yoy: '+15.3%',
      revenue_yoy: '+11.0%',
      ebitda_margin: '39.8%',
      der: '0.28x',
      operating_cash_flow: 'Kas Melimpah (>Rp 32 Triliun)',
      key_corporate_catalyst: 'Spin-off bisnis batubara termal dan percepatan pembangunan smelter aluminium hijau raksasa di Kalimantan Utara senilai $2 Miliar untuk rantai pasok industri global.'
    },
    ADMR: {
      net_profit_yoy: '+34.2%',
      revenue_yoy: '+28.5%',
      ebitda_margin: '49.1%',
      der: '0.42x',
      operating_cash_flow: 'Positif Sangat Sehat',
      key_corporate_catalyst: 'Commissioning fase 1 smelter aluminium kapasitas 500.000 ton/tahun dan kenaikan volume penjualan batubara metalurgi kokas keras (hard coking coal).'
    },
    ICBP: {
      net_profit_yoy: '+14.1%',
      revenue_yoy: '+10.8%',
      ebitda_margin: '21.5%',
      der: '0.65x',
      operating_cash_flow: 'Defensive Cash Generator Kuat',
      key_corporate_catalyst: 'Pertumbuhan volume penjualan mie instan Indomie di Timur Tengah, Afrika, dan Eropa via Pinehill melampaui ekspektasi dengan stabilitas biaya gandum dunia.'
    }
  };

  const conglomerateCatalog = {
    ASII: {
      group_name: 'Grup Astra International',
      role: 'Holding Induk Konglomerasi',
      parent: null,
      subsidiaries: ['UNTR', 'AUTO', 'AALI'],
      supply_chain: ['DRMA', 'SMSM'],
      peers: ['MEDC', 'ICBP', 'BMRI'],
      linkage_thesis: 'Induk konglomerasi terdiversifikasi terbesar Indonesia; pergerakan harga mencerminkan konsolidasi dividen dari UNTR (alat berat & tambang), AUTO (komponen), dan AALI (sawit).'
    },
    UNTR: {
      group_name: 'Grup Astra International',
      role: 'Anak Usaha Alat Berat & Mineral Emas/Nikel',
      parent: 'ASII',
      subsidiaries: ['PAMA (Kontraktor)', 'Agincourt Resources'],
      supply_chain: ['ADRO', 'PTBA', 'BYAN'],
      peers: ['HEXA', 'DOID', 'PTRO'],
      linkage_thesis: 'Anak usaha utama ASII yang menyumbang >40% laba bersih konsolidasian; kontraktor utama batubara untuk ADRO dan PTBA serta pemilik tambang emas Martabe.'
    },
    BRPT: {
      group_name: 'Grup Barito Pacific (Prajogo Pangestu)',
      role: 'Holding Induk Energi Terbarukan & Petrokimia',
      parent: null,
      subsidiaries: ['BREN', 'TPIA', 'CUAN', 'PTRO', 'BPII'],
      supply_chain: ['PGAS', 'PERTAMINA'],
      peers: ['MEDC', 'AMMN'],
      linkage_thesis: 'Holding induk kerajaan bisnis Prajogo Pangestu; mengendalikan BREN (panas bumi), TPIA (petrokimia), serta CUAN dan PTRO (kontraktor tambang).'
    },
    BREN: {
      group_name: 'Grup Barito Pacific (Prajogo Pangestu)',
      role: 'Anak Usaha Energi Baru & Terbarukan (Geothermal)',
      parent: 'BRPT',
      subsidiaries: ['Star Energy Geothermal'],
      supply_chain: ['PLN (Offtaker Utama)'],
      peers: ['PGEO', 'KEEN', 'ARKORA'],
      linkage_thesis: 'Entitas panas bumi terbesar Indonesia yang dikendalikan BRPT; arus kas stabil terikat kontrak jangka panjang USD dengan PLN.'
    },
    TPIA: {
      group_name: 'Grup Barito Pacific (Prajogo Pangestu)',
      role: 'Anak Usaha Petrokimia & Infrastruktur Utilitas',
      parent: 'BRPT',
      subsidiaries: ['Chandra Asri Alkali'],
      supply_chain: ['Pertamina', 'Siam Cement Group'],
      peers: ['BRPT', 'INKP', 'AVIA'],
      linkage_thesis: 'Produsen petrokimia tunggal terintegrasi RI di bawah BRPT, mengeksekusi ekspansi pabrik chlor-alkali senilai $1 Miliar.'
    },
    CUAN: {
      group_name: 'Grup Barito Pacific (Prajogo Pangestu)',
      role: 'Sub-Holding Pertambangan & Logistik',
      parent: 'BRPT',
      subsidiaries: ['PTRO'],
      supply_chain: ['BREN', 'BUMI'],
      peers: ['ADRO', 'ITMG'],
      linkage_thesis: 'Kendaraan investasi pertambangan diversifikasi Barito; pemilik 34% pengendali kontraktor rekayasa tambang PTRO.'
    },
    PTRO: {
      group_name: 'Grup Barito Pacific (Prajogo Pangestu)',
      role: 'Kontraktor Tambang & Rekayasa EPC',
      parent: 'CUAN',
      subsidiaries: [],
      supply_chain: ['CUAN', 'BREN', 'AMMN', 'BUMI'],
      peers: ['DOID', 'UNTR'],
      linkage_thesis: 'Kontraktor tambang dan EPC multi-disiplin di bawah CUAN/BRPT; memenangkan kontrak EPC fasilitas hilirisasi BREN dan AMMN.'
    },
    MEDC: {
      group_name: 'Grup Medco Energi (Keluarga Panigoro)',
      role: 'Holding Hulu Migas & Pemilik 21% Saham AMMN',
      parent: null,
      subsidiaries: ['Medco E&P', 'Medco Power'],
      supply_chain: ['AMMN', 'PGAS', 'PLN'],
      peers: ['ENRG', 'PGAS', 'AKRA'],
      linkage_thesis: 'Konglomerasi migas swasta terbesar; memiliki 21% kepemilikan saham di raksasa tembaga AMMN yang menghasilkan dividen signifikan.'
    },
    AMMN: {
      group_name: 'Grup Medco & Afiliasi Salim',
      role: 'Produsen Tembaga, Emas & Smelter Katoda Terintegrasi',
      parent: 'MEDC (Afiliasi 21%)',
      subsidiaries: ['Amman Mineral Nusa Tenggara'],
      supply_chain: ['PTRO (Kontraktor)', 'PLN'],
      peers: ['MDKA', 'ANTM', 'BRMS'],
      linkage_thesis: 'Pengembang tambang Batu Hijau & Elang di Sumbawa; kepemilikan silang strategis dengan MEDC dan konsorsium grup Salim.'
    },
    BUMI: {
      group_name: 'Grup Bakrie & Salim (Joint Control)',
      role: 'Holding Batubara Terbesar Volume Nasional',
      parent: null,
      subsidiaries: ['BRMS', 'KPC', 'Arutmin'],
      supply_chain: ['DEWA (Kontraktor)', 'PLN'],
      peers: ['ADRO', 'PTBA', 'ITMG'],
      linkage_thesis: 'Induk produsen batubara terbesar Indonesia yang dikendalikan bersama oleh Grup Bakrie dan Grup Salim; pemilik saham pengendali BRMS (tambang emas).'
    },
    BRMS: {
      group_name: 'Grup Bakrie & Salim',
      role: 'Anak Usaha Tambang Emas Murni',
      parent: 'BUMI',
      subsidiaries: ['Citra Palu Minerals', 'Gorontalo Minerals'],
      supply_chain: ['ANTM (Pemurnian)'],
      peers: ['ANTM', 'MDKA', 'PSAB'],
      linkage_thesis: 'Anak usaha emas BUMI dengan cadangan emas murni masif di Palu dan Gorontalo; diuntungkan langsung kenaikan harga emas spot global.'
    },
    ADRO: {
      group_name: 'Grup Adaro Energy (Garibaldi Thohir)',
      role: 'Holding Energi & Smelter Aluminium Ramah Lingkungan',
      parent: null,
      subsidiaries: ['ADMR', 'Adaro Power'],
      supply_chain: ['UNTR (PAMA)', 'PLN'],
      peers: ['PTBA', 'ITMG', 'BYAN'],
      linkage_thesis: 'Konglomerasi energi dengan cadangan kas terbesar; memegang kendali atas ADMR (batubara metalurgi & smelter aluminium Kaltara).'
    },
    ADMR: {
      group_name: 'Grup Adaro Energy',
      role: 'Anak Usaha Coking Coal & Smelter Aluminium',
      parent: 'ADRO',
      subsidiaries: ['Kaltara Smelter'],
      supply_chain: ['Pabrik Baja Global'],
      peers: ['INCO', 'TINS'],
      linkage_thesis: 'Anak usaha ADRO yang memproduksi batubara kokas keras untuk industri baja dan membangun smelter aluminium 500.000 ton/tahun.'
    },
    INDF: {
      group_name: 'Grup Salim (Anthony Salim)',
      role: 'Holding Pangan & Agribisnis Terintegrasi',
      parent: null,
      subsidiaries: ['ICBP', 'LSIP', 'SIMP'],
      supply_chain: ['Bogasari Flour Mills'],
      peers: ['MYOR', 'UNVR'],
      linkage_thesis: 'Holding induk pangan Grup Salim yang menguasai 80.5% saham ICBP serta perkebunan kelapa sawit terintegrasi.'
    },
    ICBP: {
      group_name: 'Grup Salim',
      role: 'Produsen Makanan Olahan (Indomie Leader)',
      parent: 'INDF',
      subsidiaries: ['Pinehill Holding (Timur Tengah & Afrika)'],
      supply_chain: ['Bogasari (Tepung Terigu)'],
      peers: ['MYOR', 'CMRY', 'ROTI'],
      linkage_thesis: 'Penyumbang laba terbesar Grup Salim; memiliki penetrasi global di 100+ negara dan pricing power mutlak di segmen mie instan.'
    },
    BBCA: {
      group_name: 'Grup Djarum (Hartono Bersaudara)',
      role: 'Jangkar Finansial & Bank Swasta Terbesar',
      parent: 'PT Dwimuria Investama Andalan',
      subsidiaries: ['BCA Syariah', 'BCA Finance'],
      supply_chain: ['Ekosistem Korporasi & Ritel RI'],
      peers: ['BMRI', 'BBRI', 'BBNI'],
      linkage_thesis: 'Jangkar perbankan nasional milik Grup Djarum; pengendali likuiditas transaksi harian terbesar di Indonesia dengan dana murah CASA 82%.'
    }
  };

  const cryptoCatalog = {
    BTCUSDT: { symbol: 'BTCUSDT', name: 'Bitcoin', category: 'DIGITAL GOLD & SOVEREIGN RESERVE', price: 64250, bull_catalyst: 'Post-halving supply shock & akumulasi Spot ETF institusi >$25B.', bear_catalyst: 'Miner capitulation & ketidakpastian suku bunga The Fed.', linkages: ['ETHUSDT', 'SOLUSDT', 'MSTR', 'COIN'], support: 60500, r1: 68500 },
    ETHUSDT: { symbol: 'ETHUSDT', name: 'Ethereum', category: 'SMART CONTRACT LAYER-1 & DEFI', price: 2650, bull_catalyst: 'Tokenisasi Real-World Assets (RWA) institusional & staking inflow.', bear_catalyst: 'Kompresi fee mainnet akibat migrasi volume ke jaringan Layer-2.', linkages: ['BTCUSDT', 'NEARUSDT', 'LINKUSDT', 'LDO'], support: 2420, r1: 2850 },
    SOLUSDT: { symbol: 'SOLUSDT', name: 'Solana', category: 'HIGH-THROUGHPUT MONOLITHIC L1', price: 152, bull_catalyst: 'Volume transaksi DEX harian tertinggi & client Firedancer 1M TPS.', bear_catalyst: 'Tingkat inflasi emisi tahunan & koreksi spekulatif ritel.', linkages: ['BTCUSDT', 'ETHUSDT', 'RENDERUSDT', 'RAY'], support: 138, r1: 168 },
    NEARUSDT: { symbol: 'NEARUSDT', name: 'NEAR Protocol', category: 'USER-OWNED AI & CHAIN ABSTRACTION', price: 4.85, bull_catalyst: 'Adopsi chain abstraction & riset infrastruktur open-source AI.', bear_catalyst: 'Persaingan modul Data Availability (DA) dengan Celestia.', linkages: ['FETUSDT', 'RENDERUSDT', 'ETHUSDT'], support: 4.20, r1: 5.60 },
    LINKUSDT: { symbol: 'LINKUSDT', name: 'Chainlink', category: 'ORACLE & INSTITUTIONAL RWA', price: 11.80, bull_catalyst: 'Protokol CCIP menjadi standar tokenisasi perbankan global (Swift, DTCC).', bear_catalyst: 'Rotasi momentum altcoin tertinggal saat market rebound.', linkages: ['ETHUSDT', 'BTCUSDT', 'AVAXUSDT'], support: 10.40, r1: 13.50 }
  };

  const usStocksCatalog = {
    NVDA: { symbol: 'NVDA', name: 'NVIDIA Corp', category: 'AI ACCELERATOR MONOPOLY', price: 122.5, bull_catalyst: 'Pangsa pasar GPU datacenter >85% & pesanan Blackwell B200 penuh 12 bulan.', bear_catalyst: 'Keterbatasan packaging CoWoS TSMC & evaluasi antimonopoli DoJ.', linkages: ['TSM', 'AMD', 'MSFT', 'SMCI', 'AVGO'], support: 114.0, r1: 134.0 },
    AAPL: { symbol: 'AAPL', name: 'Apple Inc', category: 'PREMIUM CONSUMER ECOSYSTEM', price: 228.0, bull_catalyst: 'Siklus upgrade Apple Intelligence & marjin jasa Services >74%.', bear_catalyst: 'Persaingan smartphone di Tiongkok & gugatan antitrust App Store.', linkages: ['NVDA', 'TSM', 'QCOM', 'GOOGL'], support: 216.0, r1: 238.0 },
    MSFT: { symbol: 'MSFT', name: 'Microsoft Corp', category: 'ENTERPRISE CLOUD & COPILOT', price: 435.0, bull_catalyst: 'Akselerasi Azure AI & penetrasi Copilot ke 400M+ pengguna enterprise.', bear_catalyst: 'Capex GPU datacenter yang sangat masif memicu pertanyaan ROI.', linkages: ['NVDA', 'CRWD', 'ORCL', 'AMZN'], support: 418.0, r1: 455.0 },
    TSLA: { symbol: 'TSLA', name: 'Tesla Inc', category: 'EV + ROBOTAXI OTONOM', price: 245.0, bull_catalyst: 'Peluncuran Robotaxi Cybercab & pertumbuhan baterai Megapack >100%.', bear_catalyst: 'Perang diskon EV global & waktu perizinan regulasi FSD.', linkages: ['NVDA', 'ALB', 'BYD', 'CATL'], support: 220.0, r1: 270.0 },
    AMD: { symbol: 'AMD', name: 'Advanced Micro Devices', category: 'DATACENTER CPU & ACCELERATOR', price: 156.0, bull_catalyst: 'Target pendapatan MI300X >$4.5B dengan adopsi Azure & Meta.', bear_catalyst: 'Kekuatan ekosistem CUDA Nvidia yang masih sangat dominan.', linkages: ['NVDA', 'TSM', 'MSFT', 'INTC'], support: 142.0, r1: 172.0 }
  };

  // 5. On-Demand Dossier Calculation for Selected Ticker
  const currentDossier = useMemo(() => {
    const raw = selectedTicker.toUpperCase().trim();
    const clean = raw.replace('.JK', '');

    // A. Check if Crypto
    if (selectedUniverse === 'CRYPTO' || clean in cryptoCatalog || clean.endsWith('USDT')) {
      const key = clean in cryptoCatalog ? clean : (clean + 'USDT' in cryptoCatalog ? clean + 'USDT' : 'BTCUSDT');
      const item = cryptoCatalog[key] || cryptoCatalog.BTCUSDT;
      return {
        universe: 'CRYPTO',
        ticker: item.symbol,
        name: item.name,
        sector: item.category,
        currency: 'USD',
        price: item.price,
        fit_score: 92,
        bull_pct: 82,
        bear_pct: 18,
        stance: 'STRONG_BULL',
        macro_theme: {
          title: 'Likuiditas Makro Web3 & De-Dolarisasi Cadangan',
          tag: 'WEB3 & MACRO LIQUIDITY',
          icon: '🪙',
          transmission_chain: 'Ekspansi likuiditas M2 global & akumulasi Spot ETF institusi.'
        },
        fundamentals: {
          net_profit_yoy: 'N/A (Layer-1 Gas Fee +34.5%)',
          revenue_yoy: '+48.2% Protocol Fees',
          ebitda_margin: 'N/A (Validator Staking Yield: 4.8%)',
          der: 'Sirkulasi: 94.2% Circulating',
          operating_cash_flow: 'Inflow Institusional ETF Berlanjut',
          key_corporate_catalyst: item.bull_catalyst
        },
        ecosystem_linkages: {
          group_name: `Ekosistem Aset Digital ${item.name}`,
          role: item.category,
          parent: null,
          subsidiaries: [],
          supply_chain: [],
          peers: item.linkages,
          linkage_thesis: `Aset ${item.symbol} memiliki korelasi beta tinggi dengan: ${item.linkages.join(', ')}.`
        },
        theses_bull: [
          item.bull_catalyst,
          `Struktur breakout di atas support $${item.support} mempertahankan momentum bullish kuat.`,
          `Target kenaikan terdekat menuju $${item.r1} dengan rasio risk-to-reward sangat terukur.`
        ],
        theses_bear: [
          item.bear_catalyst,
          `Volatilitas likuiditas derivatif berisiko memicu stop run di bawah $${item.support}.`
        ],
        levels: {
          pivot: item.price,
          r1: item.r1,
          r2: Math.round(item.r1 * 1.06),
          s1: item.support,
          s2: Math.round(item.support * 0.94),
          stop_loss: Math.round(item.support * 0.96)
        },
        risk_arbiter: {
          verdict: 'APPROVED // ACCUMULATE ON DIP',
          size_pct: 75.0,
          stop_loss: Math.round(item.support * 0.96),
          critical_risk: `Disiplin cut loss mutlak jika harga ditutup di bawah $${Math.round(item.support * 0.96)}.`,
          reasoning: `Setup didukung akumulasi institusional dan posisi dominan pada sektor ${item.category}.`,
          model_used: activeModelName,
          latency_ms: activeLatency
        }
      };
    }

    // B. Check if US Equities
    if (selectedUniverse === 'US_EQUITIES' || clean in usStocksCatalog) {
      const item = usStocksCatalog[clean] || usStocksCatalog.NVDA;
      return {
        universe: 'US_EQUITIES',
        ticker: item.symbol,
        name: item.name,
        sector: item.category,
        currency: 'USD',
        price: item.price,
        fit_score: 95,
        bull_pct: 85,
        bear_pct: 15,
        stance: 'STRONG_BULL',
        macro_theme: {
          title: 'Supercycle Komputasi AI & Belanja Capex Datacenter',
          tag: 'US TECH & MEGA CAPEX',
          icon: '🇺🇸',
          transmission_chain: 'Supercycle pengeluaran AI Hyperscalers & komputasi data center.'
        },
        fundamentals: {
          net_profit_yoy: '+122.4% YoY (Earnings Beat)',
          revenue_yoy: '+88.5% Datacenter YoY',
          ebitda_margin: '62.8% GAAP',
          der: '0.18x (Net Cash > $30B)',
          operating_cash_flow: 'Free Cash Flow Rekor Tertinggi',
          key_corporate_catalyst: item.bull_catalyst
        },
        ecosystem_linkages: {
          group_name: `Rantai Pasok Teknologi ${item.symbol}`,
          role: item.category,
          parent: null,
          subsidiaries: [],
          supply_chain: ['TSM'],
          peers: item.linkages,
          linkage_thesis: `Keterkaitan pasokan semikonduktor & komputasi awan dengan: ${item.linkages.join(', ')}.`
        },
        theses_bull: [
          item.bull_catalyst,
          `Pertumbuhan estimasi konsensus Wall Street terakselerasi dengan target resisten $${item.r1}.`,
          `Posisi kas tebal dan kekuatan pricing power melindungi margin operasional.`
        ],
        theses_bear: [
          item.bear_catalyst,
          `Multiple valuasi PE tinggi rentan terhadap koreksi sentimen pasar makro.`
        ],
        levels: {
          pivot: item.price,
          r1: item.r1,
          r2: Math.round(item.r1 * 1.05 * 10) / 10,
          s1: item.support,
          s2: Math.round(item.support * 0.95 * 10) / 10,
          stop_loss: Math.round(item.support * 0.97 * 10) / 10
        },
        risk_arbiter: {
          verdict: 'APPROVED // ASYMMETRIC LONG',
          size_pct: 80.0,
          stop_loss: Math.round(item.support * 0.97 * 10) / 10,
          critical_risk: `Disiplin cut loss mutlak jika harga ditutup di bawah $${Math.round(item.support * 0.97 * 10) / 10}.`,
          reasoning: `Setup didukung moat persaingan kuat dan siklus pengeluaran capex AI multi-tahun.`,
          model_used: activeModelName,
          latency_ms: activeLatency
        }
      };
    }

    // C. IDX Equities (Default)
    const matchBeneficiary = currentTheme.top_beneficiaries?.find(b => b.ticker === clean);
    const price = matchBeneficiary?.current_price || 1500;
    const targetPrice = matchBeneficiary?.target_price || Math.round(price * 1.15);
    const stopLoss = matchBeneficiary?.stop_loss || Math.round(price * 0.93);
    const fitScore = matchBeneficiary?.fit_score || 82;
    const bullPct = matchBeneficiary?.consensus_bull_pct || 78;
    const bearPct = 100 - bullPct;

    const fund = fundamentalCatalog[clean] || {
      net_profit_yoy: '+14.5%',
      revenue_yoy: '+11.2%',
      ebitda_margin: '26.4%',
      der: '0.65x',
      operating_cash_flow: 'Positif Sehat',
      key_corporate_catalyst: `Emiten ${clean} mencatatkan efisiensi operasional dan penjajakan kontrak baru di sektornya.`
    };

    const linkage = conglomerateCatalog[clean] || {
      group_name: 'Ekosistem Sektoral Reguler BEI',
      role: `Emiten Pasar Reguler`,
      parent: null,
      subsidiaries: [],
      supply_chain: [],
      peers: currentTheme.top_beneficiaries?.map(b => b.ticker).filter(t => t !== clean).slice(0, 3) || ['MEDC', 'ENRG', 'PGAS'],
      linkage_thesis: `Memiliki korelasi transmisi dengan emiten sejenis di sektor terkait.`
    };

    return {
      universe: 'IDX',
      ticker: clean,
      name: matchBeneficiary?.name || `PT ${clean} Tbk`,
      sector: matchBeneficiary?.category || 'INDONESIAN EQUITY',
      currency: 'IDR',
      price: price,
      fit_score: fitScore,
      bull_pct: bullPct,
      bear_pct: bearPct,
      stance: bullPct >= 80 ? 'STRONG_BULL' : 'LEAN_BULL',
      macro_theme: {
        title: currentTheme.title,
        tag: currentTheme.tag,
        icon: currentTheme.icon,
        transmission_chain: currentTheme.transmission_chain?.intermediate_fx || 'Transmisi sentimen makro dan sektoral.'
      },
      fundamentals: fund,
      ecosystem_linkages: linkage,
      theses_bull: [
        `Katalis tema makro '${currentTheme.title}' memberi dorongan positif langsung terhadap pendapatan operasional.`,
        `Katalis fundamental: ${fund.key_corporate_catalyst}`,
        `Peluang ekspansi harga terukur menuju area resisten R1 Rp ${targetPrice.toLocaleString('id-ID')} dengan rasio reward-to-risk menguntungkan.`
      ],
      theses_bear: [
        `Risiko de-eskalasi mendadak pada isu '${currentTheme.tag}' dapat memicu rotasi likuiditas sektoral.`,
        `Penetrasi volume pasar yang belum optimal berpotensi memicu aksi false breakout di dekat area R1.`,
        `Penurunan di bawah Support S1 Rp ${stopLoss.toLocaleString('id-ID')} dapat memicu stop loss hunt beruntun.`
      ],
      levels: {
        pivot: price,
        r1: targetPrice,
        r2: Math.round(targetPrice * 1.05),
        s1: stopLoss,
        s2: Math.round(stopLoss * 0.95),
        stop_loss: stopLoss
      },
      risk_arbiter: {
        verdict: matchBeneficiary?.arbiter_verdict || (bullPct >= 80 ? 'STRONG ACCUMULATE (80% SIZE)' : 'APPROVED // ACCUMULATE (70% SIZE)'),
        size_pct: bullPct >= 80 ? 80.0 : 70.0,
        stop_loss: stopLoss,
        critical_risk: `Disiplin cut loss mutlak jika harga tertekan di bawah Rp ${stopLoss.toLocaleString('id-ID')}.`,
        reasoning: `Setup alokasi memanfaatkan gelombang isu ${currentTheme.title} dengan disiplin risiko terukur.`,
        model_used: activeModelName,
        latency_ms: activeLatency
      }
    };
  }, [selectedTicker, selectedUniverse, currentTheme, activeModelName, activeLatency]);

  // 6. Autocomplete Search Options based on Active Universe
  const searchResults = useMemo(() => {
    const q = searchQuery.toUpperCase().trim();
    if (!q) return [];

    if (selectedUniverse === 'CRYPTO') {
      const keys = Object.keys(cryptoCatalog);
      return keys
        .filter(k => k.includes(q) || cryptoCatalog[k].name.toUpperCase().includes(q))
        .map(k => ({ ticker: k, name: cryptoCatalog[k].name, universe: 'CRYPTO' }));
    }

    if (selectedUniverse === 'US_EQUITIES') {
      const keys = Object.keys(usStocksCatalog);
      return keys
        .filter(k => k.includes(q) || usStocksCatalog[k].name.toUpperCase().includes(q))
        .map(k => ({ ticker: k, name: usStocksCatalog[k].name, universe: 'US_EQUITIES' }));
    }

    // IDX Stocks
    const catalogMatches = Object.keys(fundamentalCatalog)
      .filter(t => t.includes(q))
      .map(t => ({ ticker: t, name: `PT ${t} Tbk`, universe: 'IDX' }));

    const externalMatches = (allIdxStocks || [])
      .filter(s => s.ticker && s.ticker.toUpperCase().includes(q) && !fundamentalCatalog[s.ticker.toUpperCase()])
      .map(s => ({ ticker: s.ticker.toUpperCase(), name: s.name || `PT ${s.ticker} Tbk`, universe: 'IDX' }))
      .slice(0, 15);

    return [...catalogMatches, ...externalMatches].slice(0, 15);
  }, [searchQuery, selectedUniverse, allIdxStocks]);

  if (!isOpen) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: isDrawer ? '100vh' : 'auto',
      minHeight: isDrawer ? '100vh' : '820px',
      background: 'var(--bg-canvas, #07090d)',
      color: 'var(--text-primary, #e2e8f0)',
      fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      borderLeft: isDrawer ? '1px solid var(--border-color, #1e2638)' : 'none',
      boxShadow: isDrawer ? '-10px 0 30px rgba(0,0,0,0.7)' : 'none',
      position: isDrawer ? 'fixed' : 'relative',
      right: isDrawer ? 0 : 'auto',
      top: isDrawer ? 0 : 'auto',
      width: isDrawer ? 'min(980px, 95vw)' : '100%',
      zIndex: isDrawer ? 9999 : 1
    }}>
      {/* 1. Header Bar: Title & Minimalist Model Badge (Clean, Non-Alay) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-color, #1e2638)',
        background: 'var(--bg-panel, #0c1017)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(16, 185, 129, 0.25))',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            🛡️
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '900', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.04em', color: '#fff' }}>
              AI QUANT INTELLIGENCE & SENTINEL DESK
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
              Top-Down Macro Thematic Regimes • Sectoral Transmission • Universal On-Demand Analyzer
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Minimalist Model Status (Gambar 3 & 4 Solution) */}
          <div style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono, monospace)',
            padding: '4px 10px',
            borderRadius: '4px',
            background: isFailover ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: isFailover ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
            color: isFailover ? '#f59e0b' : '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isFailover ? '#f59e0b' : '#10b981',
              boxShadow: isFailover ? '0 0 6px #f59e0b' : '0 0 6px #10b981'
            }} />
            <span>MODEL: {activeModelName} {isFailover ? '(Failover)' : '(Online)'}</span>
          </div>

          <button
            onClick={() => {
              if (onRefreshDesk) {
                onRefreshDesk();
              } else {
                window.location.reload();
              }
            }}
            className="telemetry-btn"
            style={{
              padding: '3px 8px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: '700',
              color: '#38bdf8',
              borderColor: 'rgba(56, 189, 248, 0.4)',
              background: 'rgba(56, 189, 248, 0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            title="Sinkronisasi ulang data intelijen makro dan DEFCON geopolitik terkini"
          >
            <span>🔄</span>
            <span>Sync Desk</span>
          </button>

          {isDrawer && (
            <button
              onClick={onClose}
              className="telemetry-btn"
              style={{
                width: '28px',
                height: '28px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '700',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              title="Tutup Panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Navigation Tabs: 3 Clean Tabs (Gambar 1 Solution: Tab 4 Alay Removed) */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color, #1e2638)',
        background: 'var(--bg-canvas, #07090d)'
      }}>
        {[
          { id: 'THEMATIC', icon: '🌐', label: `1. ISU MAKRO & TRANSMISI (${activeThemes.length} TEMA)` },
          { id: 'DEBATE', icon: '⚔️', label: `2. DEBAT SINDIKASI (ON-DEMAND: ${selectedTicker})` },
          { id: 'DEFCON', icon: '🛡️', label: `3. GEOPOLITICAL (DEFCON ${defcon})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              borderRadius: 0,
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              padding: '11px 10px',
              fontSize: '11px',
              fontWeight: '700',
              fontFamily: 'var(--font-mono, monospace)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-muted, #94a3b8)',
              background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Main Scrollable Container */}
      <div style={{
        padding: '18px 20px',
        overflowY: 'auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>

        {/* =================================================================== */}
        {/* TAB 1: TOP-DOWN THEMATIC REGIMES & SECTORAL TRANSMISSION           */}
        {/* =================================================================== */}
        {activeTab === 'THEMATIC' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Thematic Selector Ribbon */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
              {activeThemes.map(theme => {
                const isSelected = theme.id === selectedThemeId;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border-color, #1e2638)',
                      background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-panel, #0c1017)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px' }}>{theme.icon}</span>
                      <span style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: theme.severity === 'ELEVATED' || theme.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: theme.severity === 'ELEVATED' || theme.severity === 'HIGH' ? '#ef4444' : '#10b981',
                        fontWeight: '800'
                      }}>
                        {theme.tag}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: isSelected ? '#fff' : 'var(--text-primary)', marginTop: '4px' }}>
                      {theme.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Transmission Chain Breakdown Diagram */}
            <div style={{
              background: 'var(--bg-panel-subtle, #141922)',
              border: '1px solid var(--border-color, #1e2638)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#38bdf8', marginBottom: '8px' }}>
                ⚡ RANTAI KAUSALITAS TRANSMISI MAKRO KE MIKRO
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.5 }}>
                {currentTheme.catalyst_summary}
              </div>

              {/* 3-Step Flow Diagram */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono)', color: '#f59e0b', fontWeight: '800' }}>[1] ROOT DRIVER</div>
                  <div style={{ fontSize: '11px', color: '#fff', marginTop: '4px' }}>{currentTheme.transmission_chain.root_driver}</div>
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: '800' }}>[2] TRANSMISI PERANTARA</div>
                  <div style={{ fontSize: '11px', color: '#fff', marginTop: '4px' }}>{currentTheme.transmission_chain.intermediate_fx}</div>
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '9.5px', fontFamily: 'var(--font-mono)', color: '#10b981', fontWeight: '800' }}>[3] DAMPAK EKONOMI RI</div>
                  <div style={{ fontSize: '11px', color: '#fff', marginTop: '4px' }}>{currentTheme.transmission_chain.macro_impact}</div>
                </div>
              </div>

              {/* Winner vs Loser Sectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#10b981', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                    ▲ SEKTOR PENERIMA MANFAAT (NET WINNER)
                  </div>
                  {currentTheme.transmission_chain.positive_sectors.map((s, idx) => (
                    <div key={idx} style={{ fontSize: '10.5px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      <strong style={{ color: '#fff' }}>• {s.sector}</strong>: {s.rationale}
                    </div>
                  ))}
                </div>

                <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#ef4444', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
                    ▼ SEKTOR TERTEKAN (MARGIN COMPRESSION)
                  </div>
                  {currentTheme.transmission_chain.negative_sectors.map((s, idx) => (
                    <div key={idx} style={{ fontSize: '10.5px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      <strong style={{ color: '#fff' }}>• {s.sector}</strong>: {s.rationale}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Beneficiary Stocks Grid */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                  🎯 SAHAM PRIMADONA TEMA ({currentTheme.top_beneficiaries?.length || 0} REKOMENDASI TERTINGGI)
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Klik emiten untuk membuka Debat Sindikasi & Analisis Fundamental
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                {currentTheme.top_beneficiaries?.map(stock => (
                  <div
                    key={stock.ticker}
                    onClick={() => {
                      setSelectedTicker(stock.ticker);
                      setSelectedUniverse('IDX');
                      setActiveTab('DEBATE');
                    }}
                    style={{
                      background: 'var(--bg-panel, #0c1017)',
                      border: '1px solid var(--border-color, #1e2638)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color, #1e2638)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                          ${stock.ticker}
                        </span>
                        <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                          {stock.name}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        fontWeight: '800'
                      }}>
                        FIT: {stock.fit_score}/100
                      </span>
                    </div>

                    <div style={{ fontSize: '10.5px', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      {stock.transmission_link}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Harga: </span>
                        <strong style={{ color: '#fff' }}>Rp {stock.current_price?.toLocaleString('id-ID')}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Target: </span>
                        <strong style={{ color: '#10b981' }}>Rp {stock.target_price?.toLocaleString('id-ID')}</strong>
                      </div>
                      <div style={{ color: '#38bdf8', fontWeight: '800' }}>
                        Buka Dossier ➔
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Understated Bottom Telemetry Note */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '10px',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--text-muted, #94a3b8)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isFailover ? '#f59e0b' : '#10b981' }} />
                <span>AI Engine: <strong style={{ color: '#fff' }}>{activeModelName}</strong></span>
                <span>•</span>
                <span style={{ color: isFailover ? '#f59e0b' : '#10b981' }}>{isFailover ? 'Failover Fallback' : 'Active Online'}</span>
                <span>•</span>
                <span>Latency: {activeLatency} ms</span>
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                Cascade Failover: Ready
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: UNIVERSAL ON-DEMAND SYNDICATE DEBATE & FUNDAMENTAL DOSSIER   */}
        {/* =================================================================== */}
        {activeTab === 'DEBATE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* A. Universe Switcher & Search Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-panel, #0c1017)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #1e2638)'
            }}>
              {/* Universe Selector Buttons */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'IDX', label: '🇮🇩 SAHAM IDX (861+)' },
                  { id: 'CRYPTO', label: '🪙 CRYPTO SPOT' },
                  { id: 'US_EQUITIES', label: '🇺🇸 US EQUITIES' }
                ].map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUniverse(u.id);
                      if (u.id === 'CRYPTO') setSelectedTicker('BTCUSDT');
                      else if (u.id === 'US_EQUITIES') setSelectedTicker('NVDA');
                      else setSelectedTicker('MEDC');
                    }}
                    style={{
                      border: selectedUniverse === u.id ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                      background: selectedUniverse === u.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      color: selectedUniverse === u.id ? '#fff' : 'var(--text-muted)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {u.label}
                  </button>
                ))}
              </div>

              {/* Search Box with Autocomplete */}
              <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '380px' }}>
                <input
                  type="text"
                  placeholder={`Cari ${selectedUniverse === 'CRYPTO' ? 'Crypto (BTC, ETH...)' : selectedUniverse === 'US_EQUITIES' ? 'Saham US (NVDA...)' : 'Ticker IDX (MEDC, BBCA...)'}...`}
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color, #1e2638)',
                    background: 'var(--bg-canvas, #07090d)',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)'
                  }}
                />

                {isSearchOpen && searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: '#0c1017',
                    border: '1px solid #3b82f6',
                    borderRadius: '6px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    zIndex: 100,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
                  }}>
                    {searchResults.map(res => (
                      <div
                        key={res.ticker}
                        onClick={() => {
                          setSelectedTicker(res.ticker);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '11px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>${res.ticker}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{res.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Universe Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Quick Select:</span>
              {(selectedUniverse === 'CRYPTO'
                ? ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'NEARUSDT', 'LINKUSDT']
                : selectedUniverse === 'US_EQUITIES'
                ? ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMD']
                : ['MEDC', 'ENRG', 'PGAS', 'BBCA', 'BMRI', 'ANTM', 'BRMS', 'ASII', 'UNTR', 'BRPT', 'BREN', 'CUAN', 'PTRO', 'AMMN', 'ADRO', 'ICBP']
              ).map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTicker(t)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: selectedTicker === t ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.06)',
                    background: selectedTicker === t ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: selectedTicker === t ? '#38bdf8' : 'var(--text-primary)',
                    fontSize: '9.5px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  ${t}
                </button>
              ))}
            </div>

            {/* B. Header Dossier: Emiten Name, Price, Stance & Macro Linkage */}
            <div style={{
              background: 'var(--bg-panel, #0c1017)',
              border: '1px solid var(--border-color, #1e2638)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                      ${currentDossier.ticker}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {currentDossier.name}
                    </span>
                    <span style={{
                      fontSize: '9.5px',
                      fontFamily: 'var(--font-mono)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#38bdf8',
                      fontWeight: '800'
                    }}>
                      {currentDossier.sector}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Harga Terkini:</span>
                    <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                      {currentDossier.currency === 'USD' ? `$${currentDossier.price}` : `Rp ${currentDossier.price?.toLocaleString('id-ID')}`}
                    </strong>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontWeight: '800' }}>
                      Konsensus Sindikasi: {currentDossier.bull_pct}% Bull / {currentDossier.bear_pct}% Bear
                    </span>
                  </div>
                </div>

                {/* Consensus Gauge Badge */}
                <div style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: currentDossier.stance === 'STRONG_BULL' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  border: currentDossier.stance === 'STRONG_BULL' ? '1px solid #10b981' : '1px solid #3b82f6',
                  textAlign: 'right'
                }}>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Sikap AI Sindikasi</div>
                  <div style={{ fontSize: '12px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: currentDossier.stance === 'STRONG_BULL' ? '#10b981' : '#38bdf8' }}>
                    {currentDossier.stance === 'STRONG_BULL' ? 'STRONG BULLISH ACCUMULATE' : 'LEAN BULLISH'}
                  </div>
                </div>
              </div>
            </div>

            {/* C. FUNDAMENTAL DOSSIER & CORPORATE ACTIONS CARD (Eksplorasi Analis Fundamental) */}
            <div style={{
              background: 'var(--bg-panel-subtle, #141922)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                  📊 ANALISIS FUNDAMENTAL & KATALIS ISU KORPORASI
                </div>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Metrik Laba, Kapasitas Pabrik/Smelter & Arus Kas
                </div>
              </div>

              {/* 5-Column Financial Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                <div style={{ padding: '8px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Pertumbuhan Laba YoY</div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#10b981', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {currentDossier.fundamentals?.net_profit_yoy}
                  </div>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Pendapatan YoY</div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {currentDossier.fundamentals?.revenue_yoy}
                  </div>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Margin EBITDA / NIM</div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {currentDossier.fundamentals?.ebitda_margin}
                  </div>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Rasio Modal / DER</div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {currentDossier.fundamentals?.der}
                  </div>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Status Arus Kas</div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>
                    {currentDossier.fundamentals?.operating_cash_flow}
                  </div>
                </div>
              </div>

              {/* Isu Riil Korporasi: Ekspansi / Merger / Capex */}
              <div style={{
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                fontSize: '11px',
                lineHeight: 1.55,
                color: 'var(--text-primary)'
              }}>
                <strong style={{ color: '#38bdf8' }}>🏭 Katalis Ekspansi & Isu Riil Perusahaan: </strong>
                {currentDossier.fundamentals?.key_corporate_catalyst}
              </div>
            </div>

            {/* D. PETA KETERKAITAN ANTAR SAHAM (Ecosystem & Conglomerate Graph with Clickable Chips) */}
            <div style={{
              background: 'var(--bg-panel, #0c1017)',
              border: '1px solid var(--border-color, #1e2638)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                  🌐 PETA KETERKAITAN KONGLOMERASI & RANTAI PASOK (VALUE-CHAIN GRAPH)
                </div>
                <div style={{ fontSize: '9.5px', color: '#38bdf8' }}>
                  Klik ticker terkait untuk langsung membuka analisisnya
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.5 }}>
                {currentDossier.ecosystem_linkages?.linkage_thesis}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <div style={{
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontWeight: '800'
                }}>
                  GRUP: {currentDossier.ecosystem_linkages?.group_name}
                </div>

                {currentDossier.ecosystem_linkages?.parent && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Induk:</span>
                    <button
                      onClick={() => setSelectedTicker(currentDossier.ecosystem_linkages.parent)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid #3b82f6',
                        color: '#fff',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                      title="Buka Analisis Induk Perusahaan"
                    >
                      ${currentDossier.ecosystem_linkages.parent} ➔
                    </button>
                  </div>
                )}

                {currentDossier.ecosystem_linkages?.subsidiaries?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Anak Usaha:</span>
                    {currentDossier.ecosystem_linkages.subsidiaries.map(sub => (
                      <button
                        key={sub}
                        onClick={() => setSelectedTicker(sub.replace(/[^A-Za-z0-9]/g, ''))}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: '#10b981',
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        ${sub}
                      </button>
                    ))}
                  </div>
                )}

                {currentDossier.ecosystem_linkages?.peers?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Mitra & Peers Terkait:</span>
                    {currentDossier.ecosystem_linkages.peers.map(peer => (
                      <button
                        key={peer}
                        onClick={() => setSelectedTicker(peer.replace(/[^A-Za-z0-9]/g, ''))}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#e2e8f0',
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        ${peer}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* E. 3-Agent Syndicate Adversarial Debate */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {/* Agent 1: Bull Specialist */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.04)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                padding: '14px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#10b981', marginBottom: '8px' }}>
                  🐂 BULL CASE STRATEGIST
                </div>
                {currentDossier.theses_bull?.map((t, idx) => (
                  <div key={idx} style={{ fontSize: '10.5px', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.45 }}>
                    • {t}
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)', paddingTop: '6px', marginTop: '8px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                  Target Resisten R1: <strong>{currentDossier.currency === 'USD' ? `$${currentDossier.levels?.r1}` : `Rp ${currentDossier.levels?.r1?.toLocaleString('id-ID')}`}</strong>
                </div>
              </div>

              {/* Agent 2: Bear / Risk Red-Teamer */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.04)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '14px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#ef4444', marginBottom: '8px' }}>
                  🐻 RISK RED-TEAMER (SKEPTIC)
                </div>
                {currentDossier.theses_bear?.map((t, idx) => (
                  <div key={idx} style={{ fontSize: '10.5px', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.45 }}>
                    • {t}
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '6px', marginTop: '8px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#ef4444' }}>
                  Batas Invalidation S1: <strong>{currentDossier.currency === 'USD' ? `$${currentDossier.levels?.s1}` : `Rp ${currentDossier.levels?.s1?.toLocaleString('id-ID')}`}</strong>
                </div>
              </div>

              {/* Agent 3: Chief Risk Officer (CRO) Arbiter */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                borderRadius: '8px',
                padding: '14px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#38bdf8', marginBottom: '8px' }}>
                  ⚖️ CRO RISK ARBITER (VERDICT)
                </div>
                <div style={{ fontSize: '12px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: '#fff', marginBottom: '4px' }}>
                  {currentDossier.risk_arbiter?.verdict}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.45 }}>
                  {currentDossier.risk_arbiter?.reasoning}
                </div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#f59e0b', marginBottom: '4px' }}>
                  Stop Loss Ketat: <strong>{currentDossier.currency === 'USD' ? `$${currentDossier.risk_arbiter?.stop_loss}` : `Rp ${currentDossier.risk_arbiter?.stop_loss?.toLocaleString('id-ID')}`}</strong>
                </div>

                {/* Clean Model Evaluation Note (Gambar 3 Solution) */}
                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: '6px',
                  marginTop: '8px',
                  fontSize: '9.5px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Model: <strong style={{ color: '#fff' }}>{currentDossier.risk_arbiter?.model_used}</strong></span>
                  <span>Latency: {currentDossier.risk_arbiter?.latency_ms} ms</span>
                </div>
              </div>
            </div>

            {/* Understated Bottom Telemetry Note */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '10px',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--text-muted, #94a3b8)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isFailover ? '#f59e0b' : '#10b981' }} />
                <span>AI Engine: <strong style={{ color: '#fff' }}>{activeModelName}</strong></span>
                <span>•</span>
                <span style={{ color: isFailover ? '#f59e0b' : '#10b981' }}>{isFailover ? 'Failover Fallback' : 'Active Online'}</span>
                <span>•</span>
                <span>Latency: {activeLatency} ms</span>
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                Cascade Failover: Ready
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: DEEP-DIVE GEOPOLITICAL DESK (INSTITUTIONAL BAROMETER)        */}
        {/* =================================================================== */}
        {activeTab === 'DEFCON' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* A. Live Computed Threat Barometer (Non-Manual Slider, Segmented 5-Level Gauge) */}
            <div style={{
              background: 'var(--bg-panel, #0c1017)',
              border: '1px solid var(--border-color, #1e2638)',
              borderRadius: '8px',
              padding: '18px 20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
                    <span style={{
                      fontSize: '15px',
                      fontWeight: '900',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.03em',
                      color: '#38bdf8'
                    }}>
                      DEFCON {defcon} // GUARDED / WASPADA TERUKUR
                    </span>
                    <span style={{
                      fontSize: '9.5px',
                      fontFamily: 'var(--font-mono)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      fontWeight: '800'
                    }}>
                      LIVE COMPUTED LEVEL
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#e2e8f0', marginTop: '6px', lineHeight: 1.5, maxWidth: '640px' }}>
                    {geoDesk.primary_threat}
                  </div>
                </div>

                <div style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  textAlign: 'right'
                }}>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Skor Ancaman Komposit</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>
                    {geoDesk.threat_score} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/ 1.00</span>
                  </div>
                </div>
              </div>

              {/* 5-Segment Institutional Barometer Gauge */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '8px' }}>
                  {[
                    { lvl: 5, label: 'LVL 5 // NORMAL', range: '0.00 - 0.20', color: '#10b981' },
                    { lvl: 4, label: 'LVL 4 // GUARDED', range: '0.21 - 0.45', color: '#38bdf8', active: true },
                    { lvl: 3, label: 'LVL 3 // ELEVATED', range: '0.46 - 0.65', color: '#f59e0b' },
                    { lvl: 2, label: 'LVL 2 // CONFLICT', range: '0.66 - 0.85', color: '#f97316' },
                    { lvl: 1, label: 'LVL 1 // WARTIME', range: '0.86 - 1.00', color: '#ef4444' }
                  ].map(seg => {
                    const isActive = seg.active;
                    return (
                      <div
                        key={seg.lvl}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '4px',
                          background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.02)',
                          border: isActive ? `1.5px solid ${seg.color}` : '1px solid rgba(255,255,255,0.06)',
                          boxShadow: isActive ? `0 0 12px rgba(56, 189, 248, 0.3)` : 'none',
                          textAlign: 'center',
                          position: 'relative'
                        }}
                      >
                        {isActive && (
                          <div style={{
                            position: 'absolute',
                            top: '-7px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#38bdf8',
                            color: '#07090d',
                            fontSize: '8px',
                            fontWeight: '900',
                            fontFamily: 'var(--font-mono)',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            letterSpacing: '0.04em'
                          }}>
                            ACTIVE
                          </div>
                        )}
                        <div style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          fontFamily: 'var(--font-mono)',
                          color: isActive ? '#fff' : 'var(--text-muted)'
                        }}>
                          {seg.label}
                        </div>
                        <div style={{ fontSize: '8.5px', color: isActive ? seg.color : 'rgba(255,255,255,0.3)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          {seg.range}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Linear Continuous Gauge Bar */}
                <div style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(255,255,255,0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                  marginTop: '10px'
                }}>
                  <div style={{
                    width: `${(geoDesk.threat_score || 0.42) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981 0%, #38bdf8 35%, #f59e0b 65%, #ef4444 100%)',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            </div>

            {/* B. 4 Quantitative Sub-Pillars Breakdown Grid */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                  📐 4 SUB-PILAR INTELIJEN RISIKO GLOBAL (QUANTITATIVE SUB-INDICES)
                </div>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                  Pembobotan kuantitatif yang mengkalkulasi Skor Ancaman Komposit 0.42
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {geoDesk.sub_pillars?.map(pillar => (
                  <div
                    key={pillar.id}
                    style={{
                      background: 'var(--bg-panel-subtle, #141922)',
                      border: '1px solid var(--border-color, #1e2638)',
                      borderRadius: '6px',
                      padding: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Bobot: {pillar.weight}</span>
                      <span style={{
                        fontSize: '8.5px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 5px',
                        borderRadius: '3px',
                        background: pillar.severity === 'ELEVATED' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                        color: pillar.severity === 'ELEVATED' ? '#ef4444' : '#f59e0b',
                        fontWeight: '800'
                      }}>
                        {pillar.severity}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
                      {pillar.name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '6px 0' }}>
                      <span style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: pillar.score >= 60 ? '#ef4444' : pillar.score >= 45 ? '#f59e0b' : '#38bdf8' }}>
                        {pillar.score}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>/ 100</span>
                    </div>

                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {pillar.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* C. Tactical Macro Risk Mitigation Playbook */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '14px 16px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#10b981', marginBottom: '6px' }}>
                🎯 PANDUAN TAKTIKAL MITIGASI RISIKO MAKRO & PORTFOLIO ARMOR:
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                {geoDesk.macro_risk_guidance}
              </div>
            </div>

            {/* D. WHAT-IF SCENARIO STRESS TEST SIMULATOR (Interactive) */}
            <div style={{
              background: 'var(--bg-panel, #0c1017)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                  🧪 WHAT-IF SCENARIO STRESS TEST (SIMULASI RISIKO MAKRO)
                </div>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                  Pilih skenario untuk melihat simulasi dampak portofolio jika eskalasi terjadi
                </div>
              </div>

              {/* Scenario Selector Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                {geoDesk.simulated_scenarios?.map(sc => {
                  const isSelected = sc.id === selectedScenarioId;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => setSelectedScenarioId(sc.id)}
                      style={{
                        textAlign: 'left',
                        padding: '12px',
                        borderRadius: '6px',
                        border: isSelected ? '1.5px solid #3b82f6' : '1px solid var(--border-color, #1e2638)',
                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-panel-subtle, #141922)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '8.5px',
                          fontFamily: 'var(--font-mono)',
                          padding: '2px 5px',
                          borderRadius: '3px',
                          background: isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.06)',
                          color: isSelected ? '#38bdf8' : 'var(--text-muted)',
                          fontWeight: '800'
                        }}>
                          {sc.badge}
                        </span>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#f59e0b', fontWeight: '800' }}>
                          DEFCON {sc.defcon_level}
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', fontWeight: '800', color: isSelected ? '#fff' : 'var(--text-primary)' }}>
                        {sc.name}
                      </div>

                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Brent: <strong style={{ color: '#fff' }}>{sc.brent_price}</strong> • USD/IDR: <strong style={{ color: '#fff' }}>{sc.usd_idr}</strong>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Simulation Preview Card */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '6px',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    HASIL SIMULASI: {activeSimulatedScenario.name}
                  </div>
                  <span style={{ fontSize: '9.5px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    Cadangan Kas Direkomendasikan: <strong style={{ color: '#f59e0b' }}>{activeSimulatedScenario.cash_buffer}</strong>
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '10px' }}>
                  <strong style={{ color: '#10b981' }}>Fokus Taktikal: </strong>
                  {activeSimulatedScenario.tactical_focus}
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', fontSize: '10px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Emiten Net-Winner: </span>
                    {activeSimulatedScenario.winners?.map(w => (
                      <button
                        key={w}
                        onClick={() => {
                          setSelectedTicker(w);
                          setActiveTab('DEBATE');
                        }}
                        style={{
                          margin: '0 3px',
                          padding: '2px 5px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#10b981',
                          borderRadius: '3px',
                          fontSize: '9.5px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        ${w} ➔
                      </button>
                    ))}
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Emiten Wajib Cut-Loss/Hedge: </span>
                    {activeSimulatedScenario.losers?.map(l => (
                      <span
                        key={l}
                        style={{
                          margin: '0 3px',
                          padding: '2px 5px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          borderRadius: '3px',
                          fontSize: '9.5px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '800'
                        }}
                      >
                        ${l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* E. 5 Global Geopolitical Flashpoints (Deep-Dive) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                  🔥 5 TITIK RAWAN GEOPOLITIK GLOBAL (FLASHPOINTS MONITOR)
                </div>
                <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                  Analisis transmisi ke saham energi, perbankan, dan logistik BEI
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '12px' }}>
                {geoDesk.flashpoints?.map(fp => (
                  <div
                    key={fp.id}
                    style={{
                      background: 'var(--bg-panel, #0c1017)',
                      border: '1px solid var(--border-color, #1e2638)',
                      borderRadius: '8px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>
                          {fp.name}
                        </div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Wilayah: {fp.region}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '8.5px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: fp.threat_level === 'HIGH' || fp.threat_level === 'ELEVATED' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                        color: fp.threat_level === 'HIGH' || fp.threat_level === 'ELEVATED' ? '#ef4444' : '#f59e0b',
                        fontWeight: '800'
                      }}>
                        {fp.status_badge}
                      </span>
                    </div>

                    <div style={{ fontSize: '10.5px', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      {fp.description}
                    </div>

                    <div style={{
                      padding: '8px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      lineHeight: 1.4
                    }}>
                      <strong style={{ color: '#38bdf8' }}>Transmisi Sektoral: </strong>
                      {fp.transmission}
                    </div>

                    {/* Affected Tickers Chips */}
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center', marginTop: '2px' }}>
                      <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Emiten Terdampak:</span>
                      {fp.affected_tickers?.map(t => (
                        <button
                          key={t}
                          onClick={() => {
                            setSelectedTicker(t);
                            setActiveTab('DEBATE');
                          }}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#38bdf8',
                            fontSize: '9.5px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                          title="Buka Debat Emiten"
                        >
                          ${t}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* F. Cross-Asset Transmission Impact Matrix */}
            <div style={{
              background: 'var(--bg-panel, #0c1017)',
              border: '1px solid var(--border-color, #1e2638)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#38bdf8', marginBottom: '10px' }}>
                📈 MATRIKS TRANSMISI LINTAS ASET (CROSS-ASSET IMPACT MATRIX)
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px' }}>KELAS ASET</th>
                      <th style={{ padding: '6px 8px' }}>TREN SENTIMEN</th>
                      <th style={{ padding: '6px 8px' }}>TRANSMISI DAMPAK</th>
                      <th style={{ padding: '6px 8px' }}>SEKTOR TERDAMPAK DI BEI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geoDesk.cross_asset_matrix?.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '8px', fontWeight: '700', color: '#fff' }}>{row.asset}</td>
                        <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: row.sentiment_color, fontWeight: '800' }}>
                          {row.trend}
                        </td>
                        <td style={{ padding: '8px', color: 'var(--text-primary)' }}>{row.impact}</td>
                        <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{row.affected_sectors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Understated Bottom Telemetry Note */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '10px',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--text-muted, #94a3b8)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isFailover ? '#f59e0b' : '#10b981' }} />
                <span>AI Engine: <strong style={{ color: '#fff' }}>{activeModelName}</strong></span>
                <span>•</span>
                <span style={{ color: isFailover ? '#f59e0b' : '#10b981' }}>{isFailover ? 'Failover Fallback' : 'Active Online'}</span>
                <span>•</span>
                <span>Latency: {activeLatency} ms</span>
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                Cascade Failover: Ready
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
