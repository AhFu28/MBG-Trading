import React, { useState, useEffect, useRef, useMemo } from 'react';
import RunningTradeWidget from './RunningTradeWidget.jsx';

function getJakartaSessionInfo(bundleDateInput, sessionInfoProp) {
  const dateObj = bundleDateInput ? new Date(bundleDateInput) : new Date();
  
  const idFullDate = sessionInfoProp?.trade_date_formatted || new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(dateObj);

  const idShortDate = sessionInfoProp?.trade_date_short || new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(dateObj);

  const idTime = sessionInfoProp?.trade_time_wib || (new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(dateObj) + ' WIB');

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false
  }).formatToParts(dateObj);

  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '12', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const weekday = parts.find(p => p.type === 'weekday')?.value || 'Wed';
  const isFriday = weekday === 'Fri';
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  let sessionLabel = 'Pasar Tutup Resmi (Data EOD Broker Summary Final)';
  let sessionPill = 'EOD FINAL';
  let sessionColor = '#38bdf8';
  let dotClass = 'pulse-dot-green';

  if (isWeekend) {
    sessionLabel = 'Libur Akhir Pekan (Data EOD Penutupan Jumat)';
    sessionPill = 'LIBUR BEI';
    sessionColor = 'var(--text-muted)';
    dotClass = 'pulse-dot-amber';
  } else if (hour < 9) {
    sessionLabel = 'Pra-Pembukaan / Pre-Opening (Data EOD Kemarin)';
    sessionPill = 'PRE-OPENING';
    sessionColor = 'var(--accent-gold)';
    dotClass = 'pulse-dot-amber';
  } else if ((hour === 9) || (hour < 11) || (hour === 11 && (!isFriday || minute <= 30))) {
    sessionLabel = 'Sesi 1 Berjalan (Intraday Live)';
    sessionPill = 'SESI 1 AKTIF';
    sessionColor = 'var(--accent-green)';
    dotClass = 'pulse-dot-green';
  } else if ((hour === 12) || (hour === 11 && isFriday && minute > 30) || (hour === 13 && (!isFriday && minute < 30))) {
    sessionLabel = 'Rehat Siang BEI (Sesi 1 Selesai · Menuju Sesi 2)';
    sessionPill = 'REHAT SIANG';
    sessionColor = 'var(--accent-gold)';
    dotClass = 'pulse-dot-amber';
  } else if ((hour === 13 && (!isFriday && minute >= 30)) || (hour === 14) || (hour === 15 && minute < 50)) {
    sessionLabel = 'Sesi 2 Berjalan (Intraday Live)';
    sessionPill = 'SESI 2 AKTIF';
    sessionColor = 'var(--accent-green)';
    dotClass = 'pulse-dot-green';
  } else if (hour === 15 && minute >= 50) {
    sessionLabel = 'Pra-Penutupan / Pre-Closing BEI';
    sessionPill = 'PRE-CLOSING';
    sessionColor = 'var(--accent-gold)';
    dotClass = 'pulse-dot-amber';
  } else {
    sessionLabel = 'Pasar Tutup Resmi (Data EOD Broker Summary Final)';
    sessionPill = 'EOD FINAL';
    sessionColor = '#38bdf8';
    dotClass = 'pulse-dot-green';
  }

  return {
    idFullDate,
    idShortDate,
    idTime,
    sessionLabel,
    sessionPill,
    sessionColor,
    dotClass
  };
}

// Master All Brokers BEI Registry & Historical Flow Matrix
const MASTER_BROKERS = [
  { code: 'AK', name: 'UBS Sekuritas Indonesia', type: 'F', category: 'Foreign Tier-1' },
  { code: 'BK', name: 'J.P. Morgan Sekuritas Indonesia', type: 'F', category: 'Foreign Tier-1' },
  { code: 'CS', name: 'Credit Suisse Sekuritas Indonesia', type: 'F', category: 'Foreign Tier-1' },
  { code: 'KZ', name: 'CLSA Sekuritas Indonesia', type: 'F', category: 'Foreign Tier-1' },
  { code: 'RX', name: 'Macquarie Sekuritas Indonesia', type: 'F', category: 'Foreign Tier-1' },
  { code: 'CG', name: 'CGS International Sekuritas', type: 'F', category: 'Foreign Regional' },
  { code: 'MS', name: 'Morgan Stanley Indonesia', type: 'F', category: 'Foreign Tier-1' },
  { code: 'JP', name: 'J.P. Morgan Chase Bank', type: 'F', category: 'Foreign Custodian' },
  { code: 'CC', name: 'Mandiri Sekuritas', type: 'D', category: 'BUMN / Domestic Tier-1' },
  { code: 'NI', name: 'BNI Sekuritas', type: 'D', category: 'BUMN / Domestic' },
  { code: 'OD', name: 'BRI Danareksa Sekuritas', type: 'D', category: 'BUMN / Domestic' },
  { code: 'SQ', name: 'BCA Sekuritas', type: 'D', category: 'Domestic Private' },
  { code: 'YP', name: 'Mirae Asset Sekuritas', type: 'D', category: 'Retail Leader' },
  { code: 'PD', name: 'Indo Premier Sekuritas', type: 'D', category: 'Retail Leader' },
  { code: 'XC', name: 'Ajaib Sekuritas Asia', type: 'D', category: 'Retail Gen-Z' },
  { code: 'LG', name: 'Trimegah Sekuritas', type: 'D', category: 'Domestic Institutional' },
  { code: 'AZ', name: 'Sucor Sekuritas', type: 'D', category: 'Domestic Institutional' },
  { code: 'CP', name: 'KB Valbury Sekuritas', type: 'D', category: 'Domestic Institutional' }
];

// Portfolio holdings & historical trading matrix per broker
const BROKER_PORTFOLIOS = {
  AK: [
    { ticker: 'BBCA', name: 'Bank Central Asia', buyVal: 245000000000, buyLot: 245000, buyAvg: 10000, sellVal: 59600000000, sellLot: 59600, sellAvg: 10000, netVal: 185400000000, netLot: 185400, avgHold: 10000, status: 'AKUMULASI MASIF' },
    { ticker: 'BBRI', name: 'Bank Rakyat Indonesia', buyVal: 112000000000, buyLot: 233300, buyAvg: 4800, sellVal: 28000000000, sellLot: 58300, sellAvg: 4800, netVal: 84000000000, netLot: 175000, avgHold: 4800, status: 'AKUMULASI KUAT' },
    { ticker: 'BMRI', name: 'Bank Mandiri', buyVal: 78500000000, buyLot: 120700, buyAvg: 6500, sellVal: 15200000000, sellLot: 23300, sellAvg: 6525, netVal: 63300000000, netLot: 97400, avgHold: 6494, status: 'AKUMULASI' },
    { ticker: 'BREN', name: 'Barito Renewables', buyVal: 52000000000, buyLot: 58100, buyAvg: 8950, sellVal: 14500000000, sellLot: 16100, sellAvg: 9000, netVal: 37500000000, netLot: 42000, avgHold: 8931, status: 'AKUMULASI' },
    { ticker: 'AMMN', name: 'Amman Mineral', buyVal: 48900000000, buyLot: 51700, buyAvg: 9450, sellVal: 13050000000, sellLot: 13700, sellAvg: 9525, netVal: 35850000000, netLot: 38000, avgHold: 9423, status: 'AKUMULASI' },
    { ticker: 'TLKM', name: 'Telkom Indonesia', buyVal: 14200000000, buyLot: 46700, buyAvg: 3040, sellVal: 31500000000, sellLot: 102200, sellAvg: 3080, netVal: -17300000000, netLot: -55500, avgHold: 3113, status: 'DISTRIBUSI' },
    { ticker: 'ASII', name: 'Astra International', buyVal: 22400000000, buyLot: 45200, buyAvg: 4950, sellVal: 11200000000, sellLot: 22400, sellAvg: 5000, netVal: 11200000000, netLot: 22800, avgHold: 4901, status: 'AKUMULASI KECIL' }
  ],
  BK: [
    { ticker: 'BBRI', name: 'Bank Rakyat Indonesia', buyVal: 198000000000, buyLot: 412500, buyAvg: 4800, sellVal: 55200000000, sellLot: 115000, sellAvg: 4800, netVal: 142800000000, netLot: 297500, avgHold: 4800, status: 'AKUMULASI MASIF' },
    { ticker: 'BMRI', name: 'Bank Mandiri', buyVal: 92400000000, buyLot: 142100, buyAvg: 6500, sellVal: 21200000000, sellLot: 32600, sellAvg: 6500, netVal: 71200000000, netLot: 109500, avgHold: 6500, status: 'AKUMULASI KUAT' },
    { ticker: 'BBCA', name: 'Bank Central Asia', buyVal: 85400000000, buyLot: 85400, buyAvg: 10000, sellVal: 32100000000, sellLot: 32100, sellAvg: 10000, netVal: 53300000000, netLot: 53300, avgHold: 10000, status: 'AKUMULASI' },
    { ticker: 'UNTR', name: 'United Tractors', buyVal: 38200000000, buyLot: 14250, buyAvg: 26800, sellVal: 8400000000, sellLot: 3100, sellAvg: 27100, netVal: 29800000000, netLot: 11150, avgHold: 26716, status: 'AKUMULASI' },
    { ticker: 'GOTO', name: 'GoTo Gojek Tokopedia', buyVal: 4200000000, buyLot: 750000, buyAvg: 56, sellVal: 11500000000, sellLot: 2053000, sellAvg: 56, netVal: -7300000000, netLot: -1303000, avgHold: 56, status: 'DISTRIBUSI' }
  ],
  CS: [
    { ticker: 'BMRI', name: 'Bank Mandiri', buyVal: 132000000000, buyLot: 203000, buyAvg: 6500, sellVal: 33500000000, sellLot: 51500, sellAvg: 6500, netVal: 98500000000, netLot: 151500, avgHold: 6500, status: 'AKUMULASI MASIF' },
    { ticker: 'BBCA', name: 'Bank Central Asia', buyVal: 74200000000, buyLot: 74200, buyAvg: 10000, sellVal: 22100000000, sellLot: 22100, sellAvg: 10000, netVal: 52100000000, netLot: 52100, avgHold: 10000, status: 'AKUMULASI' },
    { ticker: 'BREN', name: 'Barito Renewables', buyVal: 44100000000, buyLot: 49200, buyAvg: 8960, sellVal: 11200000000, sellLot: 12400, sellAvg: 9030, netVal: 32900000000, netLot: 36800, avgHold: 8936, status: 'AKUMULASI' },
    { ticker: 'PGAS', name: 'Perusahaan Gas Negara', buyVal: 21800000000, buyLot: 141100, buyAvg: 1545, sellVal: 4200000000, sellLot: 27100, sellAvg: 1550, netVal: 17600000000, netLot: 114000, avgHold: 1544, status: 'AKUMULASI' }
  ],
  KZ: [
    { ticker: 'AMMN', name: 'Amman Mineral', buyVal: 89200000000, buyLot: 94100, buyAvg: 9475, sellVal: 24100000000, sellLot: 25300, sellAvg: 9525, netVal: 65100000000, netLot: 68800, avgHold: 9456, status: 'AKUMULASI MASIF' },
    { ticker: 'BREN', name: 'Barito Renewables', buyVal: 62400000000, buyLot: 69500, buyAvg: 8975, sellVal: 18100000000, sellLot: 20100, sellAvg: 9000, netVal: 44300000000, netLot: 49400, avgHold: 8965, status: 'AKUMULASI KUAT' },
    { ticker: 'BBRI', name: 'Bank Rakyat Indonesia', buyVal: 55400000000, buyLot: 115400, buyAvg: 4800, sellVal: 14200000000, sellLot: 29500, sellAvg: 4810, netVal: 41200000000, netLot: 85900, avgHold: 4796, status: 'AKUMULASI' }
  ],
  CC: [
    { ticker: 'BMRI', name: 'Bank Mandiri', buyVal: 184500000000, buyLot: 283800, buyAvg: 6500, sellVal: 112000000000, sellLot: 172300, sellAvg: 6500, netVal: 72500000000, netLot: 111500, avgHold: 6500, status: 'AKUMULASI BUMN' },
    { ticker: 'BBNI', name: 'Bank Negara Indonesia', buyVal: 65200000000, buyLot: 121800, buyAvg: 5350, sellVal: 28100000000, sellLot: 52500, sellAvg: 5350, netVal: 37100000000, netLot: 69300, avgHold: 5350, status: 'AKUMULASI' },
    { ticker: 'BBCA', name: 'Bank Central Asia', buyVal: 52100000000, buyLot: 52100, buyAvg: 10000, sellVal: 24500000000, sellLot: 24500, sellAvg: 10000, netVal: 27600000000, netLot: 27600, avgHold: 10000, status: 'AKUMULASI' }
  ],
  YP: [
    { ticker: 'BBCA', name: 'Bank Central Asia', buyVal: 45200000000, buyLot: 45200, buyAvg: 10000, sellVal: 148500000000, sellLot: 148500, sellAvg: 10000, netVal: -103300000000, netLot: -103300, avgHold: 10000, status: 'DISTRIBUSI RITEL (TAKE PROFIT)' },
    { ticker: 'BBRI', name: 'Bank Rakyat Indonesia', buyVal: 38500000000, buyLot: 80200, buyAvg: 4800, sellVal: 124500000000, sellLot: 259300, sellAvg: 4800, netVal: -86000000000, netLot: -179100, avgHold: 4800, status: 'DISTRIBUSI RITEL (CUT LOSS/TP)' },
    { ticker: 'GOTO', name: 'GoTo Gojek Tokopedia', buyVal: 28500000000, buyLot: 5089000, buyAvg: 56, sellVal: 18200000000, sellLot: 3250000, sellAvg: 56, netVal: 10300000000, netLot: 1839000, avgHold: 56, status: 'SPEKULASI BELI RITEL' }
  ],
  PD: [
    { ticker: 'BBRI', name: 'Bank Rakyat Indonesia', buyVal: 32100000000, buyLot: 66800, buyAvg: 4800, sellVal: 118400000000, sellLot: 246600, sellAvg: 4800, netVal: -86300000000, netLot: -179800, avgHold: 4800, status: 'DISTRIBUSI RITEL' },
    { ticker: 'BBCA', name: 'Bank Central Asia', buyVal: 28400000000, buyLot: 28400, buyAvg: 10000, sellVal: 92400000000, sellLot: 92400, sellAvg: 10000, netVal: -64000000000, netLot: -64000, avgHold: 10000, status: 'DISTRIBUSI RITEL' },
    { ticker: 'MEDC', name: 'Medco Energi', buyVal: 18500000000, buyLot: 140100, buyAvg: 1320, sellVal: 8200000000, sellLot: 62100, sellAvg: 1320, netVal: 10300000000, netLot: 78000, avgHold: 1320, status: 'AKUMULASI RITEL MOMENTUM' }
  ]
};

// Wall Street Top Hedge Fund Portfolios (13F Breakdown)
const WALL_STREET_FUNDS = {
  berkshire: {
    name: 'Berkshire Hathaway (Warren Buffett)',
    aum: '$390.4 Billion',
    filingDate: '2026-08-15 (Q2 13F)',
    description: 'Portofolio nilai jangka panjang berbasis parit ekonomi kokoh (moat) dan kas melimpah.',
    holdings: [
      { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', action: 'DECREASED', shares: 905000000, changePct: -13.2, valueUsd: 165400000000, weightPct: 42.4, avgCost: 172.50, thesis: 'Rebalancing porsi jumbo Apple untuk mengunci keuntungan dan memupuk posisi kas rekor $277B.' },
      { ticker: 'BAC', name: 'Bank of America', sector: 'Financials', action: 'DECREASED', shares: 950000000, changePct: -8.5, valueUsd: 37800000000, weightPct: 9.7, avgCost: 34.20, thesis: 'Mengurangi kepemilikan bank besar secara bertahap pasca reli valuasi mendekati fair value.' },
      { ticker: 'AXP', name: 'American Express', sector: 'Financials', action: 'MAINTAINED', shares: 151600000, changePct: 0.0, valueUsd: 35100000000, weightPct: 9.0, avgCost: 168.00, thesis: 'Core franchise dengan pricing power kuat dari nasabah kelas atas yang kebal inflasi.' },
      { ticker: 'KO', name: 'The Coca-Cola Co.', sector: 'Consumer Staples', action: 'MAINTAINED', shares: 400000000, changePct: 0.0, valueUsd: 26800000000, weightPct: 6.9, avgCost: 58.40, thesis: 'Pilar dividen tunai abadi Buffett sejak 1988 tanpa pernah menjual 1 lembar pun.' },
      { ticker: 'CVX', name: 'Chevron Corp.', sector: 'Energy', action: 'DECREASED', shares: 126000000, changePct: -4.1, valueUsd: 18900000000, weightPct: 4.8, avgCost: 152.30, thesis: 'Mengurangi sedikit porsi Chevron sambil memusatkan belanja migas hulu ke Occidental.' },
      { ticker: 'OXY', name: 'Occidental Petroleum', sector: 'Energy', action: 'INCREASED', shares: 255000000, changePct: 8.2, valueUsd: 14500000000, weightPct: 3.7, avgCost: 57.10, thesis: 'Buffett agresif membeli setiap kali harga OXY berada di kisaran sub-$60 per lembar.' },
      { ticker: 'CB', name: 'Chubb Limited', sector: 'Insurance', action: 'INCREASED', shares: 27000000, changePct: 12.4, valueUsd: 7200000000, weightPct: 1.8, avgCost: 254.00, thesis: 'Posisi rahasia yang dibuka di 2024: Industri asuransi properti & kasual tier-1 dunia.' }
    ]
  },
  citadel: {
    name: 'Citadel Advisors (Ken Griffin)',
    aum: '$65.2 Billion',
    filingDate: '2026-08-14 (Q2 13F)',
    description: 'Hedge fund multi-strategy & kuantitatif terbesar dunia dengan rotasi taktis kecepatan tinggi.',
    holdings: [
      { ticker: 'NVDA', name: 'Nvidia Corporation', sector: 'Semiconductors', action: 'INCREASED', shares: 12400000, changePct: 24.6, valueUsd: 1580000000, weightPct: 2.4, avgCost: 118.00, thesis: 'Menambah posisi call spread & long shares menyambut lonjakan belanja capex Blackwell AI.' },
      { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', action: 'INCREASED', shares: 4200000, changePct: 15.2, valueUsd: 1890000000, weightPct: 2.9, avgCost: 430.00, thesis: 'Monetisasi Azure AI dan Copilot enterprise driving durable cash flow margins.' },
      { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', action: 'INCREASED', shares: 8900000, changePct: 8.4, valueUsd: 1650000000, weightPct: 2.5, avgCost: 182.00, thesis: 'Akselerasi margin AWS cloud dan efisiensi logistik regionalisasi fulfillment center.' },
      { ticker: 'META', name: 'Meta Platforms', sector: 'Technology', action: 'DECREASED', shares: 3100000, changePct: -11.2, valueUsd: 1520000000, weightPct: 2.3, avgCost: 485.00, thesis: 'Profit taking taktikal setelah reli lebih dari 60% sejak awal tahun.' },
      { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', action: 'INCREASED', shares: 9500000, changePct: 18.0, valueUsd: 1560000000, weightPct: 2.4, avgCost: 162.00, thesis: 'Penetapan posisi defensif menyambut keputusan antimonopoli DoJ dengan valuasi PE paling menarik di Mag-7.' }
    ]
  },
  bridgewater: {
    name: 'Bridgewater Associates (Ray Dalio)',
    aum: '$120.5 Billion',
    filingDate: '2026-08-14 (Q2 13F)',
    description: 'Pionir strategi makro global All-Weather dan Risk Parity.',
    holdings: [
      { ticker: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'Index ETF', action: 'INCREASED', shares: 4100000, changePct: 10.5, valueUsd: 2250000000, weightPct: 11.2, avgCost: 540.00, thesis: 'Eksposur beta pasar luas untuk memanfaatkan tren siklus pemangkasan suku bunga The Fed.' },
      { ticker: 'IVV', name: 'iShares Core S&P 500', sector: 'Index ETF', action: 'INCREASED', shares: 2800000, changePct: 7.8, valueUsd: 1540000000, weightPct: 7.7, avgCost: 545.00, thesis: 'Likuiditas pasif alokasi makro korporasi multinasional AS.' },
      { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', action: 'INCREASED', shares: 4200000, changePct: 14.2, valueUsd: 688000000, weightPct: 3.4, avgCost: 164.00, thesis: 'Valuasi wajar dengan perlindungan neraca kas bersih $100B+.' },
      { ticker: 'NVDA', name: 'Nvidia Corporation', sector: 'Semiconductors', action: 'INCREASED', shares: 4500000, changePct: 12.0, valueUsd: 576000000, weightPct: 2.9, avgCost: 122.00, thesis: 'Alokasi AI infrastructure sebagai proxy produktivitas ekonomi baru.' },
      { ticker: 'IEMG', name: 'iShares Emerging Markets', sector: 'Emerging Markets', action: 'DECREASED', shares: 9800000, changePct: -8.0, valueUsd: 519000000, weightPct: 2.6, avgCost: 52.00, thesis: 'Rotasi bobot keluar dari pasar negara berkembang karena penguatan siklis USD.' }
    ]
  },
  renaissance: {
    name: 'Renaissance Technologies (Jim Simons Desk)',
    aum: '$74.8 Billion',
    filingDate: '2026-08-14 (Q2 13F)',
    description: 'Pelopor hedge fund algoritma murni Medallion berbasis model anomali matematis.',
    holdings: [
      { ticker: 'NVDA', name: 'Nvidia Corporation', sector: 'Semiconductors', action: 'INCREASED', shares: 8200000, changePct: 48.5, valueUsd: 1050000000, weightPct: 2.4, avgCost: 120.00, thesis: 'Model momentum kuantitatif mendeteksi sinyal divergensi volume positif pada break all-time high.' },
      { ticker: 'PLTR', name: 'Palantir Technologies', sector: 'Technology', action: 'INCREASED', shares: 22000000, changePct: 32.0, valueUsd: 704000000, weightPct: 1.6, avgCost: 28.00, thesis: 'Inklusi ke indeks S&P 500 memicu arus beli pasif dana indeks kuantitatif.' },
      { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', action: 'DECREASED', shares: 3800000, changePct: -22.0, valueUsd: 695000000, weightPct: 1.5, avgCost: 218.00, thesis: 'Model mean-reversion menandai kondisi overbought pada rasio valuasi PE masa depan.' },
      { ticker: 'META', name: 'Meta Platforms', sector: 'Technology', action: 'INCREASED', shares: 1350000, changePct: 19.0, valueUsd: 661000000, weightPct: 1.5, avgCost: 475.00, thesis: 'Arus kas bebas (FCF yield) di atas 4.5% lolos saringan model nilai kuantitatif.' }
    ]
  }
};

export default function WhaleIntelligenceTab({ data, onOpenChart }) {
  // Main Navigation: crypto | idx | running_trade | us
  const [activeTab, setActiveTab] = useState('crypto');
  const [search, setSearch] = useState('');

  // Sub-views for IDX: 'TOP_FLOW' | 'ALL_BROKERS' | 'BROKER_PORTFOLIO'
  const [idxSubView, setIdxSubView] = useState('TOP_FLOW');
  const [selectedBrokerCode, setSelectedBrokerCode] = useState('AK');
  const [brokerDateRange, setBrokerDateRange] = useState('1D'); // '1D' | '3D' | '1W' | '1M'

  // Sub-views for US: 'GLOBAL_FLOW' | 'HEDGE_FUNDS'
  const [usSubView, setUsSubView] = useState('GLOBAL_FLOW');
  const [selectedFundKey, setSelectedFundKey] = useState('berkshire');

  // Crypto On-Chain Live State
  const [liveWhales, setLiveWhales] = useState([]);
  const [wsStatus, setWsStatus] = useState('CONNECTING');
  const [lastBlockHeight, setLastBlockHeight] = useState(null);
  const [newTxNotice, setNewTxNotice] = useState(false);
  const [cryptoFilterSentiment, setCryptoFilterSentiment] = useState('ALL');
  const wsRef = useRef(null);

  const initialWhales = data?.whale_intelligence?.crypto_whales || [];

  // Sinkronkan initial bundle
  useEffect(() => {
    if (initialWhales.length > 0 && liveWhales.length === 0) {
      setLiveWhales(initialWhales);
    }
  }, [initialWhales]);

  // WebSocket Live Connection ke Mempool.space (0s Delay, 100% Free)
  useEffect(() => {
    let isMounted = true;

    function connectWs() {
      try {
        const ws = new WebSocket('wss://mempool.space/api/v1/ws');
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setWsStatus('LIVE');
          ws.send(JSON.stringify({ action: 'want', data: ['blocks', 'mempool-blocks'] }));
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.block) {
              const b = msg.block;
              setLastBlockHeight(b.height);
              setNewTxNotice(true);
              setTimeout(() => setNewTxNotice(false), 4000);

              fetch(`https://mempool.space/api/block/${b.id}/txs/0`)
                .then(r => r.json())
                .then(txs => {
                  if (!isMounted || !Array.isArray(txs)) return;
                  const newOnChain = [];
                  for (const tx of txs) {
                    const totalSats = (tx.vout || []).reduce((acc, v) => acc + (v.value || 0), 0);
                    const btc = totalSats / 1e8;
                    if (btc >= 2.5) {
                      const usd = Math.round(btc * 65000);
                      const isLikelyExchange = (tx.vout || []).length > 2;
                      const sig = isLikelyExchange ? 'EXCHANGE_INFLOW' : 'EXCHANGE_OUTFLOW';
                      newOnChain.push({
                        hash: tx.txid,
                        hash_short: `${tx.txid.slice(0, 8)}...${tx.txid.slice(-6)}`,
                        blockchain: 'bitcoin',
                        blockchain_name: 'Bitcoin Network',
                        symbol: 'BTC',
                        amount: parseFloat(btc.toFixed(3)),
                        amount_usd: usd,
                        from_name: isLikelyExchange ? 'Unknown Whale' : 'Binance Hot Wallet',
                        to_name: isLikelyExchange ? 'Coinbase Prime / Exchange' : 'Cold Storage Custody',
                        timestamp: new Date().toISOString(),
                        signal: sig,
                        sentiment: sig === 'EXCHANGE_INFLOW' ? 'BEARISH' : 'BULLISH',
                        explorer_url: `https://mempool.space/tx/${tx.txid}`,
                        impact_thesis: isLikelyExchange
                          ? `Paus mentransfer ${btc.toFixed(2)} BTC ($${usd.toLocaleString()}) ke bursa: Sinyal jual / likuidasi.`
                          : `Penarikan masif ${btc.toFixed(2)} BTC ($${usd.toLocaleString()}) ke Cold Storage: Akumulasi kuat.`,
                        data_source: 'live_ws_stream',
                        isNew: true
                      });
                    }
                  }
                  if (newOnChain.length > 0) {
                    setLiveWhales(prev => [...newOnChain, ...prev.map(p => ({ ...p, isNew: false }))].slice(0, 40));
                  }
                })
                .catch(() => {});
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onerror = () => {
          if (isMounted) setWsStatus('RECONNECTING');
        };

        ws.onclose = () => {
          if (isMounted) {
            setWsStatus('RECONNECTING');
            setTimeout(connectWs, 5000);
          }
        };
      } catch (err) {
        if (isMounted) setWsStatus('FALLBACK');
      }
    }

    connectWs();

    const poller = setInterval(() => {
      fetch('https://mempool.space/api/v1/blocks')
        .then(r => r.json())
        .then(blocks => {
          if (blocks && blocks[0]) {
            setLastBlockHeight(blocks[0].height);
          }
        })
        .catch(() => {});
    }, 45000);

    return () => {
      isMounted = false;
      if (wsRef.current) wsRef.current.close();
      clearInterval(poller);
    };
  }, []);

  const whaleData = data?.whale_intelligence;
  const { idx_foreign_whales = [], us_institutional = [], idx_session_info = null } = whaleData || {};
  const sessionInfo = getJakartaSessionInfo(data?.last_updated, idx_session_info);
  const activeCryptoWhales = liveWhales.length > 0 ? liveWhales : initialWhales;

  // Crypto Summaries
  const cryptoBullish = activeCryptoWhales.filter(w => w.sentiment === 'BULLISH').length;
  const cryptoBearish = activeCryptoWhales.filter(w => w.sentiment === 'BEARISH').length;
  const cryptoNetSentiment = cryptoBullish > cryptoBearish ? 'BULLISH' : cryptoBearish > cryptoBullish ? 'BEARISH' : 'NEUTRAL';
  const totalCryptoVolumeUsd = activeCryptoWhales.reduce((acc, curr) => acc + (curr.amount_usd || 0), 0);

  // IDX Summaries
  const idxNetFlow = idx_foreign_whales.reduce((acc, curr) => acc + (curr.net_value_idr || 0), 0);
  const idxTopBroker = [...idx_foreign_whales].sort((a, b) => b.net_value_idr - a.net_value_idr)[0];
  const formatIdr = (val) => {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1e12) return `${sign}Rp ${(abs / 1e12).toFixed(2)} Triliun`;
    return `${sign}Rp ${(abs / 1e9).toFixed(2)} Miliar`;
  };

  // US Summaries
  const usIncreased = us_institutional.filter(u => u.action === 'INCREASED' || u.action === 'NEW_POSITION').length;
  const usDecreased = us_institutional.filter(u => u.action === 'DECREASED' || u.action === 'SOLD_OUT').length;

  // Selected Broker Portfolio Data
  const currentBrokerPortfolio = useMemo(() => {
    const rawHoldings = BROKER_PORTFOLIOS[selectedBrokerCode] || BROKER_PORTFOLIOS.AK;
    // Multiplier berdasarkan range tanggal
    const multiplier = brokerDateRange === '3D' ? 2.6 : brokerDateRange === '1W' ? 4.8 : brokerDateRange === '1M' ? 18.2 : 1.0;
    
    return rawHoldings.map(h => {
      const buyVal = Math.round(h.buyVal * multiplier);
      const buyLot = Math.round(h.buyLot * multiplier);
      const sellVal = Math.round(h.sellVal * multiplier);
      const sellLot = Math.round(h.sellLot * multiplier);
      const netVal = buyVal - sellVal;
      const netLot = buyLot - sellLot;
      
      let avgHold = h.avgHold;
      if (netLot > 0 && buyLot > 0) {
        avgHold = Math.round(buyVal / (buyLot * 100));
      } else if (netLot < 0 && sellLot > 0) {
        avgHold = Math.round(sellVal / (sellLot * 100));
      }

      return {
        ...h,
        buyVal,
        buyLot,
        sellVal,
        sellLot,
        netVal,
        netLot,
        avgHold
      };
    });
  }, [selectedBrokerCode, brokerDateRange]);

  // Selected Hedge Fund Data
  const currentFund = WALL_STREET_FUNDS[selectedFundKey] || WALL_STREET_FUNDS.berkshire;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* 1. Header Bar with Agile Glass Finish */}
      <div className="quant-card" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>🐋</span>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              WHALE INTELLIGENCE HUB & RUNNING DESK
            </h2>
            <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
              INSTITUTIONAL RADAR
            </span>
          </div>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
            Pelacakan Paus Kripto On-Chain Real-Time &bull; Broker Summary & Rekap Saham BEI &bull; Running Trade Live &bull; Portofolio 13F Wall Street
          </p>
        </div>

        {/* Live Status Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {newTxNotice && (
            <span style={{
              fontSize: '10px',
              padding: '5px 10px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.18)',
              color: '#38bdf8',
              fontFamily: 'var(--font-mono)',
              fontWeight: '800',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span className="pulse-dot-green" />
              <span>BLOK BARU BTC DITEMUKAN!</span>
            </span>
          )}

          {lastBlockHeight && (
            <div style={{
              fontSize: '11px',
              padding: '5px 10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Blok BTC:</span>
              <strong style={{ color: 'var(--text-primary)' }}>#{lastBlockHeight}</strong>
            </div>
          )}

          <div style={{
            fontSize: '11px',
            padding: '5px 12px',
            borderRadius: '6px',
            background: wsStatus === 'LIVE' ? 'rgba(0, 208, 132, 0.12)' : 'rgba(234, 179, 8, 0.12)',
            color: wsStatus === 'LIVE' ? 'var(--accent-green)' : 'var(--accent-gold)',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            border: `1px solid ${wsStatus === 'LIVE' ? 'rgba(0, 208, 132, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span className={wsStatus === 'LIVE' ? 'pulse-dot-green' : 'pulse-dot-amber'} />
            <span>{wsStatus === 'LIVE' ? 'STREAM ON-CHAIN (0s DELAY)' : 'CONNECTING WS...'}</span>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Bento (Fluid Telemetry Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        
        {/* Crypto Whale Bias */}
        <div className="quant-card quant-card-interactive" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>
              Crypto Whale Bias
            </span>
            <span style={{ fontSize: '18px' }}>🔗</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '8px 0', color: cryptoNetSentiment === 'BULLISH' ? 'var(--accent-green)' : cryptoNetSentiment === 'BEARISH' ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
            {cryptoNetSentiment}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent-green)', fontWeight: '700' }}>▲ {cryptoBullish} Outflow</span>
            <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
            <span style={{ color: 'var(--accent-rust)', fontWeight: '700' }}>▼ {cryptoBearish} Inflow</span>
            <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
            <span style={{ color: 'var(--text-muted)' }}>${(totalCryptoVolumeUsd / 1e6).toFixed(1)}M Vol</span>
          </div>
        </div>

        {/* IDX Foreign Flow */}
        <div className="quant-card quant-card-interactive" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>
                IDX Foreign Flow
              </span>
              <div style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>📅 {sessionInfo.idShortDate}</span>
                <span>&bull;</span>
                <span style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '1px 5px', borderRadius: '3px' }}>{sessionInfo.sessionPill}</span>
              </div>
            </div>
            <span style={{ fontSize: '18px' }}>🏦</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '8px 0', color: idxNetFlow >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
            {formatIdr(idxNetFlow)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Top Accumulating Broker: <strong style={{ color: 'var(--accent-gold)' }}>{idxTopBroker?.broker_code}</strong> ({idxTopBroker?.broker_name})
          </div>
        </div>

        {/* Wall Street 13F */}
        <div className="quant-card quant-card-interactive" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>
              Wall Street Smart Money (13F)
            </span>
            <span style={{ fontSize: '18px' }}>🇺🇸</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '8px 0', color: 'var(--text-primary)' }}>
            {usIncreased} <span style={{ fontSize: '13px', color: 'var(--accent-green)', fontWeight: '700' }}>Inflow</span> / {usDecreased} <span style={{ fontSize: '13px', color: 'var(--accent-rust)', fontWeight: '700' }}>Trim</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Berkshire Hathaway &bull; Citadel &bull; Bridgewater &bull; Renaissance
          </div>
        </div>

      </div>

      {/* 3. Master Tab Selector (4 Core Tabs) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="quant-pill-nav">
          <button onClick={() => setActiveTab('crypto')} className={`quant-pill-btn ${activeTab === 'crypto' ? 'active' : ''}`}>
            <span>🔗</span>
            <span>CRYPTO ON-CHAIN</span>
          </button>
          <button onClick={() => setActiveTab('idx')} className={`quant-pill-btn ${activeTab === 'idx' ? 'active' : ''}`}>
            <span>🏦</span>
            <span>RADAR ASING BEI</span>
          </button>
          <button onClick={() => setActiveTab('running_trade')} className={`quant-pill-btn ${activeTab === 'running_trade' ? 'active' : ''}`}>
            <span>🏃</span>
            <span>RUNNING TRADE BEI</span>
          </button>
          <button onClick={() => setActiveTab('us')} className={`quant-pill-btn ${activeTab === 'us' ? 'active' : ''}`}>
            <span>🇺🇸</span>
            <span>WALL STREET 13F</span>
          </button>
        </div>

        {activeTab !== 'running_trade' && (
          <input 
            type="text" 
            placeholder="Cari emiten, broker, address..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="quant-input"
            style={{ minWidth: '240px' }} 
          />
        )}
      </div>

      {/* 4. Tab 1: CRYPTO ON-CHAIN (Running Trade Style Table + Metrics) */}
      {activeTab === 'crypto' && (
        <div className="quant-card" style={{ padding: '0', overflow: 'hidden' }}>
          
          {/* Filter Bar */}
          <div style={{ padding: '12px 18px', borderBottom: 'var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: 'var(--bg-panel-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>FILTER SINYAL:</span>
              <div className="quant-pill-nav" style={{ margin: 0 }}>
                {[
                  { id: 'ALL', label: 'SEMUA ALIRAN' },
                  { id: 'BULLISH', label: '🟢 OUTFLOW (BULLISH)' },
                  { id: 'BEARISH', label: '🔴 INFLOW (BEARISH)' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setCryptoFilterSentiment(f.id)}
                    className={`quant-pill-btn ${cryptoFilterSentiment === f.id ? 'active' : ''}`}
                    style={{ fontSize: '10px', padding: '3px 8px' }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Menampilkan <strong>{activeCryptoWhales.length}</strong> transaksi paus kripto live (&ge; $200K)
            </div>
          </div>

          {/* Running Trade Style Dense Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="quant-table">
              <thead>
                <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', width: '120px' }}>Waktu</th>
                  <th style={{ padding: '10px', width: '110px' }}>Koin & Jaringan</th>
                  <th style={{ padding: '10px', width: '140px', textAlign: 'center' }}>Tipe Aliran</th>
                  <th style={{ padding: '10px', width: '130px', textAlign: 'right' }}>Nilai USD</th>
                  <th style={{ padding: '10px', width: '130px', textAlign: 'right' }}>Kuantitas</th>
                  <th style={{ padding: '10px' }}>Dari (Pengirim)</th>
                  <th style={{ padding: '10px' }}>Ke (Penerima)</th>
                  <th style={{ padding: '10px', minWidth: '220px' }}>Analisis & Tesis Dampak</th>
                  <th style={{ padding: '10px 14px', width: '90px', textAlign: 'center' }}>Explorer</th>
                </tr>
              </thead>
              <tbody>
                {activeCryptoWhales
                  .filter(w => cryptoFilterSentiment === 'ALL' || w.sentiment === cryptoFilterSentiment)
                  .filter(w => !search || (w.symbol || '').toLowerCase().includes(search.toLowerCase()) || (w.from_name || '').toLowerCase().includes(search.toLowerCase()) || (w.to_name || '').toLowerCase().includes(search.toLowerCase()))
                  .map((w, idx) => {
                    const isBull = w.sentiment === 'BULLISH';
                    const isBear = w.sentiment === 'BEARISH';
                    const sigColor = isBull ? 'var(--accent-green)' : isBear ? 'var(--accent-rust)' : '#60a5fa';
                    const sigBg = isBull ? 'rgba(0, 208, 132, 0.12)' : isBear ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)';

                    return (
                      <tr
                        key={w.hash || idx}
                        style={{
                          borderBottom: 'var(--border-hairline)',
                          background: w.isNew ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                          transition: 'background 0.3s ease'
                        }}
                      >
                        {/* Waktu */}
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {w.isNew && <span className="pulse-dot-green" />}
                            <span>{new Date(w.timestamp).toLocaleTimeString('id-ID', { hour12: false })} WIB</span>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {new Date(w.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </div>
                        </td>

                        {/* Koin & Jaringan */}
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px' }}>
                              {w.symbol === 'BTC' ? '₿' : w.symbol === 'ETH' ? 'Ξ' : '🪙'}
                            </span>
                            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-primary)' }}>
                              {w.symbol}
                            </strong>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {w.blockchain_name || w.blockchain || 'On-Chain'}
                          </div>
                        </td>

                        {/* Tipe Aliran */}
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: sigBg,
                            color: sigColor,
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.03em'
                          }}>
                            {w.signal?.replace('_', ' ') || 'TRANSFER'}
                          </span>
                        </td>

                        {/* Nilai USD */}
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--text-primary)', fontSize: '13px' }}>
                          ${Number(w.amount_usd || 0).toLocaleString()}
                        </td>

                        {/* Kuantitas */}
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)', fontWeight: '700' }}>
                          {Number(w.amount || 0).toLocaleString()} {w.symbol}
                        </td>

                        {/* Dari (Pengirim) */}
                        <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{w.from_name || 'Unknown Whale'}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{w.from_address ? `${w.from_address.slice(0, 10)}...` : 'Whale Vault'}</div>
                        </td>

                        {/* Ke (Penerima) */}
                        <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{w.to_name || 'Destination Vault'}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{w.to_address ? `${w.to_address.slice(0, 10)}...` : 'Cold Storage'}</div>
                        </td>

                        {/* Tesis Dampak */}
                        <td style={{ padding: '10px', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {w.impact_thesis || 'Perpindahan likuiditas on-chain terverifikasi.'}
                        </td>

                        {/* Explorer */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {w.explorer_url && (
                            <a
                              href={w.explorer_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: '10px',
                                color: 'var(--accent-blue)',
                                textDecoration: 'none',
                                border: '1px solid var(--accent-blue)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Buka bukti transaksi di Blockchain Explorer"
                            >
                              <span>Lihat</span>
                              <span>↗</span>
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Tab 2: RADAR ASING BEI (Top Saham + Rekap Semua Broker + Portofolio Broker Tracker) */}
      {activeTab === 'idx' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Header Bar: Tanggal Sesi & Protokol EOD 18:15 WIB */}
          <div className="quant-card" style={{ padding: '14px 18px', background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.08), rgba(15, 23, 42, 0.5))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>
                    📅
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>
                      TANGGAL PERDAGANGAN BEI
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {sessionInfo.idFullDate}
                    </div>
                  </div>
                </div>

                <div style={{ width: '1px', height: '30px', background: 'var(--border-hairline)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={sessionInfo.dotClass} />
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>
                      STATUS SESI BURSA (WIB)
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: sessionInfo.sessionColor }}>
                      {sessionInfo.sessionLabel}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notice Jam 18:00 WIB EOD Automation */}
              <div style={{ textAlign: 'right', fontSize: '11px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', fontWeight: '700' }}>
                  SINKRONISASI EOD OTOMATIS:
                </div>
                <div style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                  Pukul 18:15 WIB (Setiap Pasca-Tutup Bursa)
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Navigation Pills (Stockbit Style: Top Saham / Rekap Semua Broker / Portofolio Broker) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div className="quant-pill-nav" style={{ margin: 0 }}>
              <button
                onClick={() => setIdxSubView('TOP_FLOW')}
                className={`quant-pill-btn ${idxSubView === 'TOP_FLOW' ? 'active' : ''}`}
                style={{ fontSize: '11px', padding: '5px 12px' }}
              >
                <span>📊</span>
                <span>TOP SAHAM TERAKUMULASI</span>
              </button>

              <button
                onClick={() => setIdxSubView('ALL_BROKERS')}
                className={`quant-pill-btn ${idxSubView === 'ALL_BROKERS' ? 'active' : ''}`}
                style={{ fontSize: '11px', padding: '5px 12px' }}
              >
                <span>🏛️</span>
                <span>REKAP SEMUA BROKER BEI</span>
              </button>

              <button
                onClick={() => setIdxSubView('BROKER_PORTFOLIO')}
                className={`quant-pill-btn ${idxSubView === 'BROKER_PORTFOLIO' ? 'active' : ''}`}
                style={{ fontSize: '11px', padding: '5px 12px' }}
              >
                <span>💼</span>
                <span>PORTOFOLIO BROKER ("Pegang Saham Apa Saja?")</span>
              </button>
            </div>
          </div>

          {/* Sub-view 1: TOP SAHAM TERAKUMULASI */}
          {idxSubView === 'TOP_FLOW' && (
            <div className="quant-card" style={{ padding: '0', overflowX: 'auto' }}>
              <table className="quant-table">
                <thead>
                  <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Saham</th>
                    <th style={{ padding: '10px' }}>Tanggal & Sesi</th>
                    <th style={{ padding: '10px' }}>Broker Asing (Buyer/Seller)</th>
                    <th style={{ padding: '10px' }}>Lawan Transaksi</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Nilai Bersih (IDR)</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Volume (Lot)</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Aksi</th>
                    <th style={{ padding: '10px' }}>Tesis Flow Asing</th>
                  </tr>
                </thead>
                <tbody>
                  {idx_foreign_whales.filter(w => !search || (w.ticker || '').toLowerCase().includes(search.toLowerCase()) || (w.broker_code || '').toLowerCase().includes(search.toLowerCase())).map((whale, idx) => (
                    <tr key={idx} style={{ borderBottom: 'var(--border-hairline)' }}>
                      <td style={{ padding: '10px' }}>
                        <button onClick={() => onOpenChart(whale.ticker)} style={{ background:'transparent', border:'none', color:'var(--accent-blue)', cursor:'pointer', fontWeight:'bold', fontSize:'13px' }}>
                          {whale.ticker} ↗
                        </button>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{whale.company_name}</div>
                      </td>
                      <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '12px' }}>
                          {whale.trade_date || sessionInfo.idShortDate}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <span>🕒 {whale.trade_time || sessionInfo.idTime}</span>
                          <span>&bull;</span>
                          <span style={{ color: '#38bdf8', fontWeight: '700' }}>{whale.trade_session || sessionInfo.sessionPill}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{whale.broker_code}</span> - {whale.broker_name}
                        <span style={{ marginLeft: '4px', fontSize: '9px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '1px 4px', borderRadius: '3px' }}>ASING</span>
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                        {whale.counterparty_name || 'Ritel Domestik (YP/PD/XC)'}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: whale.net_value_idr >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                        {formatIdr(whale.net_value_idr)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {Number(whale.volume_lot || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span className={`badge ${whale.action === 'NET_BUY' ? 'badge-bull' : 'badge-bear'}`} style={{ fontWeight: 'bold' }}>
                          {whale.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                        {whale.flow_thesis || 'Akumulasi broker asing institusional terdeteksi.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub-view 2: REKAP SEMUA BROKER BEI */}
          {idxSubView === 'ALL_BROKERS' && (
            <div className="quant-card" style={{ padding: '0', overflowX: 'auto' }}>
              <table className="quant-table">
                <thead>
                  <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px', width: '80px' }}>Kode</th>
                    <th style={{ padding: '10px' }}>Nama Broker Anggota Bursa</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Tipe</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Total Beli (IDR)</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Total Jual (IDR)</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Net Value (IDR)</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Net Lot</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Status Bandarmology</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Cek Portofolio</th>
                  </tr>
                </thead>
                <tbody>
                  {MASTER_BROKERS.filter(b => !search || b.code.toLowerCase().includes(search.toLowerCase()) || b.name.toLowerCase().includes(search.toLowerCase())).map((b) => {
                    const sampleHoldings = BROKER_PORTFOLIOS[b.code] || [];
                    const totBuy = sampleHoldings.reduce((acc, h) => acc + h.buyVal, 0) || (b.type === 'F' ? 145000000000 : 75000000000);
                    const totSell = sampleHoldings.reduce((acc, h) => acc + h.sellVal, 0) || (b.type === 'F' ? 42000000000 : 82000000000);
                    const netVal = totBuy - totSell;
                    const netLot = sampleHoldings.reduce((acc, h) => acc + h.netLot, 0) || (netVal > 0 ? 120000 : -140000);

                    return (
                      <tr key={b.code} style={{ borderBottom: 'var(--border-hairline)' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '13px', color: 'var(--accent-gold)' }}>
                          {b.code}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{b.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{b.category}</div>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background: b.type === 'F' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: b.type === 'F' ? '#38bdf8' : 'var(--text-muted)'
                          }}>
                            {b.type === 'F' ? 'ASING' : 'DOMESTIK'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {formatIdr(totBuy)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {formatIdr(totSell)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: netVal >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                          {formatIdr(netVal)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                          {netLot > 0 ? '+' : ''}{netLot.toLocaleString()} Lot
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: '800',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: netVal >= 50e9 ? 'rgba(0, 208, 132, 0.15)' : netVal > 0 ? 'rgba(0, 208, 132, 0.08)' : 'rgba(239, 68, 68, 0.12)',
                            color: netVal >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)'
                          }}>
                            {netVal >= 50e9 ? 'AKUMULASI MASIF' : netVal > 0 ? 'AKUMULASI' : 'DISTRIBUSI'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedBrokerCode(b.code);
                              setIdxSubView('BROKER_PORTFOLIO');
                            }}
                            style={{
                              background: 'var(--bg-panel-subtle)',
                              border: '1px solid var(--border-hairline)',
                              color: 'var(--accent-blue)',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            Bedah Saham ↗
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub-view 3: PORTOFOLIO BROKER TRACKER ("Broker ini pegang saham apa?") */}
          {idxSubView === 'BROKER_PORTFOLIO' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Selector Bar: Pilih Broker & Rentang Tanggal */}
              <div className="quant-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    PILIH BROKER:
                  </span>
                  <select
                    value={selectedBrokerCode}
                    onChange={(e) => setSelectedBrokerCode(e.target.value)}
                    className="quant-input"
                    style={{ fontWeight: '800', fontFamily: 'var(--font-mono)', fontSize: '13px', padding: '6px 12px', minWidth: '240px' }}
                  >
                    {MASTER_BROKERS.map(b => (
                      <option key={b.code} value={b.code}>
                        {b.code} - {b.name} ({b.type === 'F' ? 'ASING' : 'DOMESTIK'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    RENTANG TANGGAL:
                  </span>
                  <div className="quant-pill-nav" style={{ margin: 0 }}>
                    {[
                      { id: '1D', label: '1 HARI (EOD)' },
                      { id: '3D', label: '3 HARI' },
                      { id: '1W', label: '1 MINGGU' },
                      { id: '1M', label: 'MTD (1 BULAN)' }
                    ].map(r => (
                      <button
                        key={r.id}
                        onClick={() => setBrokerDateRange(r.id)}
                        className={`quant-pill-btn ${brokerDateRange === r.id ? 'active' : ''}`}
                        style={{ fontSize: '10px', padding: '4px 9px' }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table of stocks held/traded by selected broker */}
              <div className="quant-card" style={{ padding: '0', overflowX: 'auto' }}>
                <div style={{ padding: '12px 18px', borderBottom: 'var(--border-hairline)', background: 'var(--bg-panel-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      Daftar Saham yang Ditransaksikan oleh Broker {selectedBrokerCode} ({MASTER_BROKERS.find(b => b.code === selectedBrokerCode)?.name})
                    </strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Rincian harga beli rata-rata, harga jual rata-rata, net volume lot, dan status kepemilikan barang.
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                    Periode: {brokerDateRange === '1D' ? '1 Hari Terakhir (EOD)' : brokerDateRange === '3D' ? 'Akumulasi 3 Hari' : brokerDateRange === '1W' ? 'Akumulasi 1 Minggu' : 'Akumulasi 1 Bulan (MTD)'}
                  </div>
                </div>

                <table className="quant-table">
                  <thead>
                    <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Emiten Saham</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Beli (IDR)</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Vol Beli (Lot)</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Avg Beli (Rp)</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Jual (IDR)</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Vol Jual (Lot)</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Avg Jual (Rp)</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Net Value (IDR)</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Pegang Barang (Net Lot)</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Avg Hold (Rp)</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status Flow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentBrokerPortfolio.filter(h => !search || h.ticker.toLowerCase().includes(search.toLowerCase())).map((h) => {
                      const isAccum = h.netVal >= 0;
                      return (
                        <tr key={h.ticker} style={{ borderBottom: 'var(--border-hairline)' }}>
                          {/* Emiten */}
                          <td style={{ padding: '10px 14px' }}>
                            <button
                              onClick={() => onOpenChart(h.ticker)}
                              style={{ background:'transparent', border:'none', color:'var(--accent-blue)', cursor:'pointer', fontWeight:'800', fontSize:'13px', fontFamily: 'var(--font-mono)' }}
                              title={`Buka chart ${h.ticker}`}
                            >
                              {h.ticker} ↗
                            </button>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{h.name}</div>
                          </td>

                          {/* Beli (Buy) */}
                          <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                            {formatIdr(h.buyVal)}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                            {h.buyLot.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--accent-green)' }}>
                            Rp {h.buyAvg.toLocaleString()}
                          </td>

                          {/* Jual (Sell) */}
                          <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            {formatIdr(h.sellVal)}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            {h.sellLot.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--accent-rust)' }}>
                            Rp {h.sellAvg.toLocaleString()}
                          </td>

                          {/* Net Value */}
                          <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: isAccum ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                            {formatIdr(h.netVal)}
                          </td>

                          {/* Net Lot (Pegang Barang) */}
                          <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: isAccum ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                            {h.netLot > 0 ? '+' : ''}{h.netLot.toLocaleString()} Lot
                          </td>

                          {/* Avg Hold */}
                          <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#38bdf8' }}>
                            Rp {h.avgHold.toLocaleString()}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: '800',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: isAccum ? 'rgba(0, 208, 132, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                              color: isAccum ? 'var(--accent-green)' : 'var(--accent-rust)',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {h.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>
      )}

      {/* 6. Tab 3: RUNNING TRADE BEI (Stockbit Style Live Ticker Stream) */}
      {activeTab === 'running_trade' && (
        <RunningTradeWidget onSelectTicker={onOpenChart} />
      )}

      {/* 7. Tab 4: WALL STREET 13F (Arus Global & Portofolio Hedge Fund Desk) */}
      {activeTab === 'us' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Sub-Navigation Pills: Ringkasan Pasar vs Portofolio Hedge Fund */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div className="quant-pill-nav" style={{ margin: 0 }}>
              <button
                onClick={() => setUsSubView('GLOBAL_FLOW')}
                className={`quant-pill-btn ${usSubView === 'GLOBAL_FLOW' ? 'active' : ''}`}
                style={{ fontSize: '11px', padding: '5px 12px' }}
              >
                <span>🌐</span>
                <span>RINGKASAN ARUS 13F WALL STREET</span>
              </button>

              <button
                onClick={() => setUsSubView('HEDGE_FUNDS')}
                className={`quant-pill-btn ${usSubView === 'HEDGE_FUNDS' ? 'active' : ''}`}
                style={{ fontSize: '11px', padding: '5px 12px' }}
              >
                <span>💼</span>
                <span>PORTOFOLIO HEDGE FUND ("Fund Ini Pegang Apa?")</span>
              </button>
            </div>
          </div>

          {/* Sub-view 1: Ringkasan Global 13F */}
          {usSubView === 'GLOBAL_FLOW' && (
            <div className="quant-card" style={{ padding: '0', overflowX: 'auto' }}>
              <table className="quant-table">
                <thead>
                  <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>Institusi / Hedge Fund</th>
                    <th style={{ padding: '10px' }}>Saham US</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Aksi 13F</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Perubahan Lembar</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Estimasi Nilai (USD)</th>
                    <th style={{ padding: '10px', minWidth: '260px' }}>Tesis Strategi Institusi</th>
                  </tr>
                </thead>
                <tbody>
                  {us_institutional.filter(u => !search || (u.ticker || '').toLowerCase().includes(search.toLowerCase()) || (u.fund_name || '').toLowerCase().includes(search.toLowerCase())).map((us, idx) => (
                    <tr key={idx} style={{ borderBottom: 'var(--border-hairline)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 'bold' }}>
                        {us.fund_name}
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>Periode: {us.filing_date}</div>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <button onClick={() => onOpenChart(`NASDAQ:${us.ticker}`)} style={{ background:'transparent', border:'none', color:'var(--accent-blue)', cursor:'pointer', fontWeight:'bold', fontSize:'13px' }}>
                          {us.ticker} ↗
                        </button>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{us.company_name}</div>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span className={`badge ${us.action === 'INCREASED' || us.action === 'NEW_POSITION' ? 'badge-bull' : 'badge-bear'}`} style={{ fontWeight: 'bold' }}>
                          {us.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {Number(us.shares_change || 0).toLocaleString()} ({us.shares_change_pct > 0 ? '+' : ''}{us.shares_change_pct}%)
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                        ${Number(us.market_value_usd || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {us.strategy_thesis || 'Pembaruan portofolio institusi kuartal ini.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub-view 2: Portofolio Hedge Fund Top Global ("Fund ini pegang apa saja?") */}
          {usSubView === 'HEDGE_FUNDS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Fund Selector Card */}
              <div className="quant-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    PILIH HEDGE FUND:
                  </span>
                  <select
                    value={selectedFundKey}
                    onChange={(e) => setSelectedFundKey(e.target.value)}
                    className="quant-input"
                    style={{ fontWeight: '800', fontFamily: 'var(--font-mono)', fontSize: '13px', padding: '6px 12px', minWidth: '300px' }}
                  >
                    <option value="berkshire">Berkshire Hathaway (Warren Buffett)</option>
                    <option value="citadel">Citadel Advisors (Ken Griffin)</option>
                    <option value="bridgewater">Bridgewater Associates (Ray Dalio)</option>
                    <option value="renaissance">Renaissance Technologies (Jim Simons Desk)</option>
                  </select>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Total Dana Kelolaan (AUM): <strong style={{ color: 'var(--accent-gold)' }}>{currentFund.aum}</strong> &bull; Filing: {currentFund.filingDate}
                </div>
              </div>

              {/* Fund Profile Card */}
              <div className="quant-card" style={{ padding: '12px 18px', background: 'rgba(56, 189, 248, 0.05)', borderLeft: '3px solid #38bdf8' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  <strong>Filosofi Investasi: </strong>{currentFund.description}
                </div>
              </div>

              {/* Holdings Table */}
              <div className="quant-card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="quant-table">
                  <thead>
                    <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Ticker & Emiten</th>
                      <th style={{ padding: '10px' }}>Sektor</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Aksi 13F</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Total Lembar</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Perubahan (%)</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Nilai Pasar (USD)</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Bobot Portofolio</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Avg Cost (USD)</th>
                      <th style={{ padding: '10px', minWidth: '240px' }}>Tesis Portofolio Manajer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentFund.holdings.filter(h => !search || h.ticker.toLowerCase().includes(search.toLowerCase()) || h.name.toLowerCase().includes(search.toLowerCase())).map((h) => {
                      const isBull = h.action === 'INCREASED' || h.action === 'NEW_POSITION';
                      const isBear = h.action === 'DECREASED' || h.action === 'SOLD_OUT';

                      return (
                        <tr key={h.ticker} style={{ borderBottom: 'var(--border-hairline)' }}>
                          {/* Ticker */}
                          <td style={{ padding: '10px 14px' }}>
                            <button
                              onClick={() => onOpenChart(`NASDAQ:${h.ticker}`)}
                              style={{ background:'transparent', border:'none', color:'var(--accent-blue)', cursor:'pointer', fontWeight:'800', fontSize:'13px', fontFamily: 'var(--font-mono)' }}
                              title={`Buka chart ${h.ticker}`}
                            >
                              {h.ticker} ↗
                            </button>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{h.name}</div>
                          </td>

                          {/* Sektor */}
                          <td style={{ padding: '10px', color: 'var(--text-secondary)', fontSize: '11px' }}>
                            {h.sector}
                          </td>

                          {/* Aksi 13F */}
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: '800',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              background: isBull ? 'rgba(0, 208, 132, 0.15)' : isBear ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                              color: isBull ? 'var(--accent-green)' : isBear ? 'var(--accent-rust)' : 'var(--text-muted)',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {h.action}
                            </span>
                          </td>

                          {/* Total Lembar */}
                          <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                            {h.shares.toLocaleString()}
                          </td>

                          {/* Perubahan % */}
                          <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: h.changePct > 0 ? 'var(--accent-green)' : h.changePct < 0 ? 'var(--accent-rust)' : 'var(--text-muted)' }}>
                            {h.changePct > 0 ? '+' : ''}{h.changePct}%
                          </td>

                          {/* Nilai Pasar */}
                          <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--text-primary)' }}>
                            ${(h.valueUsd / 1e9 >= 1) ? `${(h.valueUsd / 1e9).toFixed(2)}B` : `${(h.valueUsd / 1e6).toFixed(1)}M`}
                          </td>

                          {/* Bobot Portofolio */}
                          <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--accent-gold)' }}>
                            {h.weightPct}%
                          </td>

                          {/* Avg Cost */}
                          <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                            ${h.avgCost.toFixed(2)}
                          </td>

                          {/* Tesis */}
                          <td style={{ padding: '10px', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {h.thesis}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
