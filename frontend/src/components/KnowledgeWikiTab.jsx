import React, { useState } from 'react';

export default function KnowledgeWikiTab() {
  const [wikiSearch, setWikiSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const terms = [
    {
      term: 'Risk/Reward Ratio (R:R)',
      tag: 'RISK MANAGEMENT',
      summary: 'Rasio perbandingan antara potensi kerugian (risk) dengan potensi keuntungan (reward).',
      explanation: 'Cockpit MBG mewajibkan rasio minimal 1:2. Artinya untuk setiap Rp 100 yang Anda risikokan pada Hard Stop Loss, Anda menargetkan potensi profit minimal Rp 200 pada TP1. Dengan R:R 1:2, sistem tetap profitabel meskipun win rate hanya 40%.'
    },
    {
      term: '3 Invalidation Rules (Cut Rules)',
      tag: 'DISCIPLINE',
      summary: 'Kondisi objektif berbasis data teknikal di mana tesis trading dinyatakan batal dan posisi wajib di-cut.',
      explanation: 'Sistem MBG tidak menggunakan asumsi emosional harapan atau fear. 3 Invalidation Rules biasanya mencakup: (1) Penutupan harga di bawah level Hard SL, (2) Breakdown struktur swing low / MA20 pada volume tinggi, (3) Pembalikan arah makro/sektor mendadak. Posisi harus segera dilikuidasi tanpa ragu jika salah satu rule terpenuhi.'
    },
    {
      term: 'Dividend Trap Risk',
      tag: 'EQUITY & VALUATION',
      summary: 'Jebakan dividen tinggi saat harga saham anjlok melebihi persentase dividen setelah ex-date.',
      explanation: 'Sering terjadi pada saham komoditas siklikal dengan dividen yield >10%. Setelah cum-date berakhir, harga saham jatuh (drop) tajam lebih dalam dari nilai dividen yang dibagikan karena aksi jual institusi. Cockpit menyaring dan menandai emiten dengan label SAFE atau HIGH TRAP RISK.'
    },
    {
      term: 'Foreign Net Flow (Akumulasi / Distribusi Asing)',
      tag: 'FLOW & BANDAR',
      summary: 'Total nilai transaksi bersih beli atau jual oleh investor asing di Bursa Efek Indonesia (IDX).',
      explanation: 'Investor asing adalah institusi liquidity provider utama di IHSG. Net buy konsisten selama 5-20 hari pada saham blue chip mengindikasikan fase akumulasi terukur, sementara net sell deras mendadak menandakan rotasi aset keluar ke instrumen obligasi global (US Treasury) atau dolar (DXY).'
    },
    {
      term: 'MA20 vs MA50 (Trend Filter)',
      tag: 'TECHNICAL',
      summary: 'Moving Average 20 hari (jangka pendek) dan 50 hari (jangka menengah) untuk konfirmasi tren.',
      explanation: 'Jika harga berada di atas MA20 dan MA20 berada di atas MA50 (Golden Alignment), saham berada di tren bullish sehat. Breakout di atas resistance yang divalidasi oleh MA20 support menjadi entry zone berkepastian tinggi.'
    },
    {
      term: 'RSI 14 & Wilder Smoothing',
      tag: 'TECHNICAL',
      summary: 'Relative Strength Index 14 periode dengan perhitungan standar J. Welles Wilder.',
      explanation: 'RSI mengukur kecepatan dan perubahan pergerakan harga pada skala 0 hingga 100. Angka di atas 70 mengindikasikan overbought (jenuh beli), sedangkan di bawah 30 mengindikasikan oversold (jenuh jual). MBG memprioritaskan setup momentum di zona 45 - 65 saat breakout.'
    },
    {
      term: 'Spot USDT (No Leverage)',
      tag: 'CRYPTO ALPHA',
      summary: 'Transaksi spot murni crypto tanpa pinjaman margin atau leverage derivatif.',
      explanation: 'Menghilangkan 100% risiko likuidasi paksa oleh exchange akibat flash crash (wicking). Aset dipegang sebagai saldo fisik token, memungkinkan swing trader bertahan saat volatilitas liar pasar crypto.'
    },
    {
      term: 'Conglomerate Clusters (Klaster Konglomerat)',
      tag: 'MARKET DYNAMICS',
      summary: 'Pengelompokan saham berdasarkan grup kepemilikan konglomerasi kongkrit di Indonesia.',
      explanation: 'Saham dalam satu konglomerasi (Barito/Prajogo Pangestu, Salim Group, Astra Group, Bakrie Group, Adaro Group, Djarum Group) seringkali bergerak dalam korelasi kuat saat ada corporate action, akuisisi, atau narasi sektor yang sama.'
    }
  ];

  const categories = ['ALL', 'RISK MANAGEMENT', 'DISCIPLINE', 'EQUITY & VALUATION', 'FLOW & BANDAR', 'TECHNICAL', 'CRYPTO ALPHA', 'MARKET DYNAMICS'];

  const filteredTerms = terms.filter(t => {
    const matchesSearch = !wikiSearch ||
      t.term.toLowerCase().includes(wikiSearch.toLowerCase()) ||
      t.summary.toLowerCase().includes(wikiSearch.toLowerCase()) ||
      t.explanation.toLowerCase().includes(wikiSearch.toLowerCase());
    
    if (!matchesSearch) return false;
    if (activeCategory === 'ALL') return true;
    return t.tag === activeCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Controls */}
      <div style={{
        padding: '12px 14px',
        background: 'var(--bg-panel)',
        border: 'var(--border-muted)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={'telemetry-btn ' + (activeCategory === cat ? 'active' : '')}
              style={{ fontSize: '10px', padding: '4px 10px' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Real-time search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='text'
            placeholder='Cari istilah / rumus...'
            value={wikiSearch}
            onChange={e => setWikiSearch(e.target.value)}
            style={{
              padding: '5px 8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              border: 'var(--border-muted)',
              background: 'var(--bg-canvas)',
              color: 'var(--text-primary)',
              outline: 'none',
              width: '200px'
            }}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            ({filteredTerms.length} Istilah)
          </span>
        </div>
      </div>

      {/* Dictionary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '12px'
      }}>
        {filteredTerms.map((item, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--bg-panel)',
              border: 'var(--border-muted)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className='badge badge-blue' style={{ fontSize: '9px' }}>
                {item.tag}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                #WIKI-0{idx + 1}
              </span>
            </div>

            <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', margin: '4px 0 2px 0' }}>
              📖 {item.term}
            </h3>

            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              color: 'var(--accent-orange)',
              background: 'var(--bg-panel-subtle)',
              padding: '6px 8px',
              borderLeft: '3px solid var(--accent-orange)'
            }}>
              {item.summary}
            </div>

            <p style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              margin: '4px 0 0 0'
            }}>
              {item.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}