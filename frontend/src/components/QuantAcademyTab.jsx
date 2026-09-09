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

const GLOSSARY_TERMS = [
  { term: 'Risk / Reward Ratio (R:R)', desc: 'Perbandingan antara nominal rupiah yang siap Anda rugikan dan target keuntungan minimal 1:2.' },
  { term: 'Hard Stop Loss (SL)', desc: 'Batas harga mutlak di mana posisi wajib dipotong rugi demi menyelamatkan kelangsungan modal akun.' },
  { term: 'Order Block (OB)', desc: 'Area jejak candle institusi tempat akumulasi atau distribusi sebelum pergerakan impulsif besar terjadi.' },
  { term: 'Fair Value Gap (FVG)', desc: 'Celah ketidakseimbangan harga antara 3 candle berturut-turut yang sering diuji ulang oleh harga.' },
  { term: 'Dividend Trap', desc: 'Penurunan harga drastis pasca tanggal Cum-Date yang melampaui persentase dividen yang diterima investor.' },
  { term: 'Net Foreign Flow (NFF)', desc: 'Selisih nilai beli bersih dikurangi jual bersih oleh seluruh investor asing di bursa saham BEI.' },
  { term: 'Moving Average (MA20/50)', desc: 'Garis rata-rata harga penutupan 20 hari (jangka pendek) dan 50 hari (jangka menengah).' },
  { term: 'Crypto Spot (USDT)', desc: 'Pembelian aset kripto murni 1:1 tanpa hutang/leverage sehingga bebas biaya inap dan nol risiko likuidasi.' }
];

export default function QuantAcademyTab() {
  const [activeTab, setActiveTab] = useState('academy');
  const [activeLevel, setActiveLevel] = useState(1);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredGlossary = GLOSSARY_TERMS.filter(g =>
    g.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          📖 Quick Dictionary
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
        <div>
          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Cari istilah dalam kamus..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
            {filteredGlossary.map((item, idx) => (
              <div key={idx} style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-blue)', marginBottom: '4px' }}>
                  {item.term}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {item.desc}
                </div>
              </div>
            ))}
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
