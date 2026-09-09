import React, { useState, useEffect } from 'react';

const ACADEMY_LEVELS = [
  {
    id: 1,
    title: 'LEVEL 1: Fondasi Disiplin Modal & Kalkulator Lot Astra (Pemula)',
    badge: 'Discipline Shield',
    lessons: [
      { id: '1.1', title: 'Pelajaran 1.1: Anatomi Boncos & Hukum 90/90/90 di Bursa', content: 'Sebagian besar trader rugi karena tidak disiplin. Hukum 90/90/90: 90% trader kehilangan 90% uangnya dalam 90 hari pertama.' },
      { id: '1.2', title: 'Pelajaran 1.2: Mengapa Harus Risiko Maksimal 2%?', content: 'Membatasi risiko maksimal 2% per trade memastikan modal Anda bertahan melewati rentetan kerugian (drawdown).' },
      { id: '1.3', title: 'Pelajaran 1.3: Rumus Hitung Lot Eksak & Fraksi Harga BEI', content: 'Selalu hitung lot berdasarkan (Modal x %Risiko) / Jarak Stop Loss. Pahami fraksi harga BEI agar perhitungan akurat.' },
    ],
    quiz: [
      {
        question: 'Berapa persen maksimal risiko per trade yang disarankan?',
        options: ['10%', '5%', '2%', '50%'],
        answer: 2,
        explanation: 'Risiko 2% memastikan modal Anda aman dan Anda bisa bertahan dalam permainan meskipun mengalami kekalahan beruntun.'
      },
      {
        question: 'Apa itu Hukum 90/90/90?',
        options: ['90% profit dalam 90 hari', '90% trader kehilangan 90% uang dalam 90 hari', '90 lot dengan 90% win rate', 'Indikator 90 hari Moving Average'],
        answer: 1,
        explanation: 'Fakta pahit di bursa bahwa mayoritas trader pemula gagal dengan cepat tanpa disiplin manajemen risiko.'
      },
      {
        question: 'Bagaimana cara menentukan jumlah lot yang dibeli?',
        options: ['Tebak saja', 'All in', 'Berdasarkan feeling', 'Berdasarkan batas risiko uang dibagi jarak Cut Loss'],
        answer: 3,
        explanation: 'Position sizing yang benar adalah membagi risiko uang (misal Rp100.000) dengan jarak Cut Loss per lembar saham.'
      }
    ]
  },
  {
    id: 2,
    title: 'LEVEL 2: Membaca Arus Makroekonomi Global (Menengah)',
    badge: 'Macro Navigator',
    lessons: [
      { id: '2.1', title: 'Pelajaran 2.1: Menjinakkan Monster Inflasi CPI & Suku Bunga The Fed', content: 'Inflasi tinggi mendorong Bank Sentral (The Fed) menaikkan suku bunga. Suku bunga tinggi buruk untuk saham growth.' },
      { id: '2.2', title: 'Pelajaran 2.2: Rahasia Yield US10Y (^TNX) & Indeks Dolar (DXY)', content: 'Yield US10Y dan DXY yang naik menekan aset berisiko seperti saham di emerging market (IHSG).' },
      { id: '2.3', title: 'Pelajaran 2.3: Transmisi Harga Emas & Minyak ke Emiten BEI ($ANTM, $MEDC)', content: 'Harga komoditas global berkorelasi langsung dengan emiten di BEI. Minyak naik = MEDC diuntungkan.' },
    ],
    quiz: [
      {
        question: 'Apa dampak umum jika suku bunga The Fed naik agresif?',
        options: ['Saham selalu naik tajam', 'IHSG tidak peduli', 'Tekanan pada aset berisiko dan saham', 'Harga minyak jatuh'],
        answer: 2,
        explanation: 'Suku bunga tinggi membuat aset safe haven (seperti obligasi US) lebih menarik daripada saham.'
      },
      {
        question: 'Jika Indeks Dolar (DXY) menguat tajam, bagaimana dampaknya ke Rupiah dan IHSG?',
        options: ['Rupiah melemah, IHSG tertekan', 'Rupiah menguat, IHSG naik', 'Tidak ada hubungan', 'Saham bank pasti ARB'],
        answer: 0,
        explanation: 'Dolar kuat berarti Rupiah melemah. Ini membebani emiten berhutang dolar dan memicu capital outflow asing.'
      },
      {
        question: 'Emiten mana yang berkorelasi positif paling kuat dengan harga minyak dunia?',
        options: ['UNVR', 'BBCA', 'MEDC', 'GOTO'],
        answer: 2,
        explanation: 'MEDC (Medco Energi) adalah perusahaan minyak & gas yang kinerjanya sangat bergantung pada harga minyak global.'
      }
    ]
  },
  {
    id: 3,
    title: 'LEVEL 3: Smart Money Concepts (SMC) & Liquidity (Mahir)',
    badge: 'Smart Money Seeker',
    lessons: [
      { id: '3.1', title: 'Pelajaran 3.1: Order Block (OB) Institusi vs Support Biasa', content: 'Support biasa sering dijebol untuk mencari likuiditas. Order Block adalah area di mana institusi besar menempatkan pesanan.' },
      { id: '3.2', title: 'Pelajaran 3.2: Fair Value Gap (FVG) sebagai Magnet Harga', content: 'Inefisiensi harga (FVG) cenderung diisi kembali (mitigated) oleh algoritma pasar sebelum melanjutkan tren.' },
      { id: '3.3', title: 'Pelajaran 3.3: Break of Structure (BOS) & Diskon 50%', content: 'Tunggu harga menembus struktur (BOS), lalu retrace ke area diskon (di bawah 50% rentang) untuk mencari entry optimal.' },
    ],
    quiz: [
      {
        question: 'Apa perbedaan Order Block dan Support biasa?',
        options: ['Tidak ada beda', 'Order Block adalah jejak institusi, support adalah level ritel', 'Support lebih kuat dari OB', 'OB hanya ada di saham AS'],
        answer: 1,
        explanation: 'Order block merepresentasikan jejak pesanan besar institusi yang belum terisi penuh, sedangkan support biasa rentan terkena stop hunt (sapu likuiditas).'
      },
      {
        question: 'Apa itu Fair Value Gap (FVG)?',
        options: ['Saham dengan PER murah', 'Gap harian yang selalu tertutup besoknya', 'Area inefisiensi harga akibat pergerakan impulsif sepihak', 'Perbedaan harga bid dan offer'],
        answer: 2,
        explanation: 'FVG atau Imbalance terjadi saat harga bergerak terlalu cepat (hanya ada pembeli atau penjual), meninggalkan ruang kosong yang sering diuji kembali.'
      },
      {
        question: 'Di area mana sebaiknya mencari buy entry pada tren naik menurut SMC?',
        options: ['Saat breakout di pucuk', 'Di area Premium (di atas 50%)', 'Di area Discount (di bawah 50%) menuju OB/FVG', 'Dimana saja asal tren naik'],
        answer: 2,
        explanation: 'Smart money membeli di harga murah (Area Discount) yang seringkali bertepatan dengan Order Block atau FVG.'
      }
    ]
  },
  {
    id: 4,
    title: 'LEVEL 4: Bandarmologi Modern & Foreign Flow (Kuantitatif)',
    badge: 'Bandar Detective',
    lessons: [
      { id: '4.1', title: 'Pelajaran 4.1: Membaca Akumulasi Asing Pasca Tutup Kode Broker', content: 'Gunakan data Net Foreign Buy/Sell dan analisa distribusi lot untuk melacak jejak institusi tanpa kode broker.' },
      { id: '4.2', title: 'Pelajaran 4.2: Menggabungkan OBV, MFI, dan Deviasi VWAP (IIFS)', content: 'Volume adalah jejak utama. Gabungkan On Balance Volume (OBV) dan Volume Weighted Average Price (VWAP) untuk deteksi akumulasi.' },
      { id: '4.3', title: 'Pelajaran 4.3: Menghindari Jebakan Dividen (Dividend Trap)', content: 'Harga sering turun sedalam dividen yield pada Ex-Date. Jangan beli di Cum-Date hanya demi dividen jika tren tidak mendukung.' },
    ],
    quiz: [
      {
        question: 'Bagaimana cara melacak bandar setelah penutupan kode broker (realtime)?',
        options: ['Tidak bisa lagi', 'Menebak-nebak', 'Menggunakan analisis Volume (VWAP, OBV) dan pergerakan agresif', 'Membaca berita saham'],
        answer: 2,
        explanation: 'Volume tidak bisa disembunyikan. Alat seperti VWAP, OBV, dan tape reading masih ampuh mendeteksi jejak uang besar.'
      },
      {
        question: 'Apa yang mengindikasikan distribusi (buang barang) meskipun harga sedang naik?',
        options: ['Volume sangat kecil saat harga naik, tapi besar saat harga turun', 'Harga selalu arah kanan', 'Banyak berita positif', 'Asing terus net buy'],
        answer: 0,
        explanation: 'Kenaikan harga tanpa dukungan volume atau volume buangan yang masif saat harga turun menunjukkan distribusi tersembunyi.'
      },
      {
        question: 'Kapan saat paling berisiko membeli saham yang membagikan dividen besar?',
        options: ['Satu bulan sebelum Cum-Date', 'Tepat saat penutupan hari Cum-Date', 'Satu minggu setelah Ex-Date', 'Saat harga konsolidasi'],
        answer: 1,
        explanation: 'Membeli saat Cum-Date sangat berisiko terkena Dividend Trap, dimana harga ARB pada hari Ex-Date, menghapus keuntungan dividen.'
      }
    ]
  }
];

const GLOSSARY = [
  { term: 'Stop Loss (SL)', desc: 'Titik harga untuk membatasi kerugian secara otomatis.' },
  { term: 'Take Profit (TP)', desc: 'Titik harga target untuk merealisasikan keuntungan.' },
  { term: 'Risk/Reward Ratio (RRR)', desc: 'Perbandingan antara potensi risiko (kerugian) dan potensi keuntungan.' },
  { term: 'Drawdown', desc: 'Penurunan puncak modal ke titik terendah selama periode tertentu.' },
  { term: 'Liquidity Sweep', desc: 'Pergerakan harga cepat menembus support/resistance untuk memicu stop loss ritel.' },
  { term: 'Market Structure', desc: 'Rangkaian titik tertinggi (High) dan terendah (Low) yang menentukan tren.' },
  { term: 'Cum-Date (Cum Dividend)', desc: 'Hari terakhir perdagangan untuk mendapatkan hak dividen.' },
  { term: 'Ex-Date (Ex Dividend)', desc: 'Hari pertama perdagangan tanpa hak dividen.' }
];

export default function QuantAcademyTab() {
  const [progress, setProgress] = useState({
    completedLessons: [],
    completedLevels: [],
    levelScores: {}
  });
  const [activeTab, setActiveTab] = useState('academy'); // 'academy', 'dictionary', 'certificate'
  const [activeLevel, setActiveLevel] = useState(1);
  const [activeQuiz, setActiveQuiz] = useState(null); // null or level id
  const [quizState, setQuizState] = useState({}); // { levelId: { answers: { 0: optionIdx }, showResults: boolean } }
  const [searchTerm, setSearchTerm] = useState('');
  const [userName, setUserName] = useState('');

  // Load progress from local storage
  useEffect(() => {
    const saved = localStorage.getItem('mbg_academy_progress');
    if (saved) {
      setProgress(JSON.parse(saved));
    }
    const name = localStorage.getItem('mbg_academy_user');
    if (name) {
      setUserName(name);
    }
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem('mbg_academy_progress', JSON.stringify(progress));
  }, [progress]);

  const handleReset = () => {
    if (window.confirm('Reset semua progress belajar Anda?')) {
      const resetState = {
        completedLessons: [],
        completedLevels: [],
        levelScores: {}
      };
      setProgress(resetState);
      setQuizState({});
      setActiveLevel(1);
      setActiveQuiz(null);
    }
  };

  const handleLessonComplete = (lessonId) => {
    if (!progress.completedLessons.includes(lessonId)) {
      setProgress(prev => ({
        ...prev,
        completedLessons: [...prev.completedLessons, lessonId]
      }));
    }
  };

  const startQuiz = (levelId) => {
    setActiveQuiz(levelId);
    setQuizState(prev => ({
      ...prev,
      [levelId]: { answers: {}, showResults: false }
    }));
  };

  const handleQuizAnswer = (levelId, questionIdx, optionIdx) => {
    if (quizState[levelId]?.showResults) return; // Prevent changing after submit
    setQuizState(prev => ({
      ...prev,
      [levelId]: {
        ...prev[levelId],
        answers: {
          ...(prev[levelId]?.answers || {}),
          [questionIdx]: optionIdx
        }
      }
    }));
  };

  const submitQuiz = (levelId) => {
    const levelData = ACADEMY_LEVELS.find(l => l.id === levelId);
    const answers = quizState[levelId]?.answers || {};
    let correctCount = 0;
    
    levelData.quiz.forEach((q, idx) => {
      if (answers[idx] === q.answer) correctCount++;
    });

    const score = (correctCount / levelData.quiz.length) * 100;
    const passed = score === 100;

    setQuizState(prev => ({
      ...prev,
      [levelId]: { ...prev[levelId], showResults: true, score, passed }
    }));

    if (passed) {
      setProgress(prev => ({
        ...prev,
        completedLevels: prev.completedLevels.includes(levelId) ? prev.completedLevels : [...prev.completedLevels, levelId],
        levelScores: { ...prev.levelScores, [levelId]: score }
      }));
    }
  };

  // Calculate overall progress
  const totalLessons = ACADEMY_LEVELS.reduce((acc, lvl) => acc + lvl.lessons.length, 0);
  const totalQuizzes = ACADEMY_LEVELS.length;
  const totalItems = totalLessons + totalQuizzes;
  const completedItems = progress.completedLessons.length + progress.completedLevels.length;
  const percentComplete = Math.round((completedItems / totalItems) * 100) || 0;

  const earnedBadges = ACADEMY_LEVELS.filter(l => progress.completedLevels.includes(l.id)).map(l => l.badge);

  const filteredGlossary = GLOSSARY.filter(item => 
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const CertificateView = () => {
    if (progress.completedLevels.length < 4) {
      return (
        <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
          <p className="mb-4">Selesaikan semua 4 level untuk mendapatkan sertifikat.</p>
          <button onClick={() => setActiveTab('academy')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Kembali Belajar</button>
        </div>
      );
    }

    return (
      <div className="p-8 bg-white border-8 border-gray-800 rounded-xl text-center shadow-2xl m-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-yellow-50 opacity-10"></div>
        <h2 className="text-3xl font-serif font-bold text-gray-800 mb-2">SERTIFIKAT KELULUSAN</h2>
        <h3 className="text-xl text-yellow-600 font-bold mb-8">MBG QUANT ACADEMY</h3>
        <p className="text-gray-600 mb-2">Diberikan kepada:</p>
        
        {userName ? (
          <h1 className="text-4xl font-bold text-blue-900 mb-8 uppercase tracking-widest">{userName}</h1>
        ) : (
          <div className="mb-8 flex justify-center">
            <input 
              type="text" 
              placeholder="Masukkan Nama Anda" 
              className="border-b-2 border-gray-400 text-center text-2xl outline-none p-2"
              onBlur={(e) => {
                setUserName(e.target.value);
                localStorage.setItem('mbg_academy_user', e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setUserName(e.target.value);
                  localStorage.setItem('mbg_academy_user', e.target.value);
                }
              }}
            />
          </div>
        )}

        <p className="text-gray-700 mb-6 font-medium px-12">
          Telah berhasil menyelesaikan 4 level pelatihan intensif dan berhak menyandang gelar:
        </p>
        <h2 className="text-2xl font-black text-gray-900 mb-8 border-y-2 border-gray-200 py-4 mx-8">
          "ASTRA-CERTIFIED DISCIPLINED QUANT TRADER"
        </h2>
        
        <div className="flex justify-between items-end mt-12 px-8">
          <div>
            <p className="text-sm text-gray-500">Tanggal Lulus:</p>
            <p className="font-bold">{new Date().toLocaleDateString('id-ID')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Otoritas:</p>
            <p className="font-bold italic">Astra Disciplinary System</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800">
      {/* HUD Header */}
      <div className="bg-slate-900 text-slate-100 p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold tracking-tight">🎓 MBG QUANT ACADEMY <span className="text-blue-400 font-normal text-lg">// ASTRA DISCIPLINARY TRAINING</span></h1>
          <button onClick={handleReset} className="text-xs bg-red-900/50 hover:bg-red-800 text-red-200 px-3 py-1 rounded">Reset Progress</button>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress Keseluruhan</span>
            <span className="font-bold text-blue-400">{percentComplete}% Selesai</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5">
            <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentComplete}%` }}></div>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Badges Earned:</p>
          <div className="flex gap-2 flex-wrap">
            {earnedBadges.length > 0 ? (
              earnedBadges.map((badge, idx) => (
                <span key={idx} className="bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 text-xs font-bold px-2 py-1 rounded-md flex items-center shadow-sm">
                  🏆 {badge}
                </span>
              ))
            ) : (
              <span className="text-slate-500 text-xs italic">Belum ada badge. Selesaikan kuis dengan nilai 100% untuk mendapatkan badge.</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        <button onClick={() => setActiveTab('academy')} className={`flex-1 py-3 font-semibold ${activeTab === 'academy' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Kurikulum Academy</button>
        <button onClick={() => setActiveTab('dictionary')} className={`flex-1 py-3 font-semibold ${activeTab === 'dictionary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Quick Dictionary</button>
        {progress.completedLevels.length === 4 && (
          <button onClick={() => setActiveTab('certificate')} className={`flex-1 py-3 font-bold ${activeTab === 'certificate' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-yellow-500 hover:text-yellow-600'}`}>🎓 Sertifikat Kelulusan</button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'dictionary' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 relative">
              <input 
                type="text" 
                placeholder="Cari istilah trading..." 
                className="w-full p-3 pl-10 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-3 top-3 text-slate-400">🔍</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGlossary.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg shadow border border-slate-100 hover:border-blue-200 transition-colors">
                  <h3 className="font-bold text-blue-900 mb-1">{item.term}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              ))}
              {filteredGlossary.length === 0 && (
                <p className="col-span-2 text-center text-slate-500 py-8">Istilah tidak ditemukan.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'certificate' && <CertificateView />}

        {activeTab === 'academy' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Level Selector */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {ACADEMY_LEVELS.map(level => {
                const isCompleted = progress.completedLevels.includes(level.id);
                return (
                  <button
                    key={level.id}
                    onClick={() => { setActiveLevel(level.id); setActiveQuiz(null); }}
                    className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-colors ${activeLevel === level.id ? 'bg-blue-600 text-white shadow-md' : isCompleted ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'}`}
                  >
                    Level {level.id} {isCompleted && '✓'}
                  </button>
                );
              })}
            </div>

            {/* Active Level Content */}
            {ACADEMY_LEVELS.filter(l => l.id === activeLevel).map(level => (
              <div key={level.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-6">
                  <h2 className="text-xl font-bold text-slate-800">{level.title}</h2>
                  {progress.completedLevels.includes(level.id) && (
                    <span className="inline-block mt-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">✓ LEVEL LULUS (Badge: {level.badge})</span>
                  )}
                </div>
                
                <div className="p-6">
                  {!activeQuiz || activeQuiz !== level.id ? (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        {level.lessons.map(lesson => {
                          const isRead = progress.completedLessons.includes(lesson.id);
                          return (
                            <div key={lesson.id} className={`p-4 rounded-lg border transition-colors ${isRead ? 'bg-slate-50 border-slate-200' : 'bg-white border-blue-100 hover:border-blue-300 shadow-sm'}`}>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-800">{lesson.title}</h3>
                                {isRead && <span className="text-green-500 text-sm font-bold">✓ Dibaca</span>}
                              </div>
                              <p className="text-slate-600 text-sm mb-3">{lesson.content}</p>
                              {!isRead && (
                                <button onClick={() => handleLessonComplete(lesson.id)} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 font-medium">
                                  Tandai Selesai Dibaca
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="pt-6 border-t border-slate-200 text-center">
                        <button 
                          onClick={() => startQuiz(level.id)}
                          className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold shadow hover:bg-slate-800 transition-colors"
                        >
                          {progress.completedLevels.includes(level.id) ? 'Ulangi Kuis Level Ini' : 'Mulai Kuis Level Ini'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Quiz Interface
                    <div className="space-y-8">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Ujian Akhir: Level {level.id}</h3>
                        <button onClick={() => setActiveQuiz(null)} className="text-sm text-slate-500 hover:text-slate-800">Kembali ke Materi</button>
                      </div>

                      {level.quiz.map((q, qIdx) => {
                        const selectedAnswer = quizState[level.id]?.answers?.[qIdx];
                        const showResults = quizState[level.id]?.showResults;
                        
                        return (
                          <div key={qIdx} className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                            <p className="font-bold text-slate-800 mb-4">{qIdx + 1}. {q.question}</p>
                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => {
                                let btnClass = "w-full text-left p-3 rounded border transition-colors ";
                                
                                if (showResults) {
                                  if (optIdx === q.answer) {
                                    btnClass += "bg-green-100 border-green-500 text-green-900 font-medium";
                                  } else if (selectedAnswer === optIdx) {
                                    btnClass += "bg-red-100 border-red-500 text-red-900";
                                  } else {
                                    btnClass += "bg-white border-slate-200 opacity-50";
                                  }
                                } else {
                                  btnClass += selectedAnswer === optIdx 
                                    ? "bg-blue-100 border-blue-500 text-blue-900 font-medium" 
                                    : "bg-white border-slate-300 hover:bg-slate-100";
                                }

                                return (
                                  <button
                                    key={optIdx}
                                    disabled={showResults}
                                    onClick={() => handleQuizAnswer(level.id, qIdx, optIdx)}
                                    className={btnClass}
                                  >
                                    <span className="inline-block w-6 font-bold">{['A','B','C','D'][optIdx]}.</span> {opt}
                                  </button>
                                );
                              })}
                            </div>
                            
                            {showResults && (
                              <div className={`mt-4 p-3 rounded text-sm ${selectedAnswer === q.answer ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                <span className="font-bold">{selectedAnswer === q.answer ? '✅ Benar! ' : '❌ Salah! '}</span>
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {!quizState[level.id]?.showResults ? (
                        <button 
                          onClick={() => submitQuiz(level.id)}
                          disabled={Object.keys(quizState[level.id]?.answers || {}).length < level.quiz.length}
                          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                        >
                          Submit Jawaban
                        </button>
                      ) : (
                        <div className={`p-6 text-center rounded-lg border-2 ${quizState[level.id]?.passed ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                          <h4 className={`text-xl font-bold mb-2 ${quizState[level.id]?.passed ? 'text-green-800' : 'text-red-800'}`}>
                            {quizState[level.id]?.passed ? '🎉 SELAMAT! ANDA LULUS' : '⚠️ BELUM LULUS'}
                          </h4>
                          <p className="mb-4 text-slate-700">Skor Anda: <strong>{quizState[level.id]?.score}%</strong> (Syarat lulus: 100%)</p>
                          
                          <div className="flex justify-center gap-4">
                            <button onClick={() => startQuiz(level.id)} className="px-6 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 font-medium text-slate-700">
                              Ulangi Kuis
                            </button>
                            {quizState[level.id]?.passed && level.id < ACADEMY_LEVELS.length && (
                              <button onClick={() => { setActiveLevel(level.id + 1); setActiveQuiz(null); }} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold shadow-sm">
                                Lanjut ke Level {level.id + 1}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
