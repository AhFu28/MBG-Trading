import React, { useState, useMemo, useEffect } from 'react';

const FALLBACK_EVENTS = [
  {
    id: 1,
    time: '01:00',
    date: '2026-09-10',
    country: 'US',
    name: '[DEMO DATA] FOMC Interest Rate Decision',
    impact: 'HIGH',
    actual: '-',
    forecast: '5.25%',
    previous: '5.25%',
    status: 'UPCOMING',
    details: {
      apaItu: 'Keputusan tingkat suku bunga acuan (Federal Funds Rate) yang ditetapkan oleh bank sentral Amerika Serikat (The Fed).',
      kenapaPenting: 'Suku bunga adalah "gravitasi" dari seluruh aset finansial. Kenaikan/penurunan suku bunga mengubah biaya pinjaman, nilai valuasi, dan selera risiko global.',
      dampakAset: [
        { asset: 'Forex (USD)', impact: 'Kenaikan suku bunga = USD Menguat (Bullish). Penurunan = USD Melemah.' },
        { asset: 'Saham (IHSG/Wall St)', impact: 'Kenaikan suku bunga = Tekanan bagi IHSG, terutama sektor properti & teknologi.' },
        { asset: 'Emas (XAU)', impact: 'Kenaikan suku bunga = Harga Emas tertekan.' },
        { asset: 'Kripto (BTC)', impact: 'Kenaikan suku bunga = Arus keluar dari aset berisiko (Bearish).' }
      ],
      tipsRisiko: 'Hindari membuka posisi baru 30 menit sebelum dan sesudah rilis. Volatilitas sangat ekstrim dapat memicu slippage atau stop-loss hunter.'
    }
  },
  {
    id: 2,
    time: '19:30',
    date: '2026-09-10',
    country: 'US',
    name: '[DEMO DATA] US Core CPI (Inflasi Inti)',
    impact: 'HIGH',
    actual: '-',
    forecast: '0.2%',
    previous: '0.2%',
    status: 'UPCOMING',
    details: {
      apaItu: 'Data inflasi (Indeks Harga Konsumen) yang mengukur perubahan harga barang dan jasa, tidak termasuk sektor pangan dan energi yang fluktuatif.',
      kenapaPenting: 'Indikator utama inflasi bagi The Fed. Inflasi tinggi = potensi kenaikan suku bunga lebih lanjut.',
      dampakAset: [
        { asset: 'Forex (USD)', impact: 'Inflasi tinggi = USD Menguat (ekspektasi suku bunga naik).' },
        { asset: 'Saham', impact: 'Inflasi tinggi = Negatif untuk saham (Bearish).' },
        { asset: 'Emas', impact: 'Inflasi tinggi = Bearish jangka pendek karena yield obligasi naik.' },
        { asset: 'Kripto', impact: 'Inflasi tinggi = Tekanan jual (Bearish).' }
      ],
      tipsRisiko: 'Gunakan lot kecil jika terpaksa menahan posisi. Data ini sering direvisi dan memicu "whipsaw" (harga naik turun drastis secara cepat).'
    }
  },
  {
    id: 3,
    time: '19:30',
    date: '2026-09-04',
    country: 'US',
    name: '[DEMO DATA] Non-Farm Payrolls (NFP)',
    impact: 'HIGH',
    actual: '142K',
    forecast: '160K',
    previous: '114K',
    status: 'RELEASED',
    details: {
      apaItu: 'Laporan penambahan lapangan kerja di sektor non-pertanian AS. Laporan ini dirilis pada hari Jumat minggu pertama setiap bulan.',
      kenapaPenting: 'Menggambarkan kesehatan ekonomi AS. Pasar tenaga kerja yang kuat berarti ekonomi stabil, tapi memicu inflasi jika terlalu kuat.',
      dampakAset: [
        { asset: 'Forex (USD)', impact: 'NFP Tinggi = USD Bullish.' },
        { asset: 'Saham', impact: 'NFP sangat tinggi bisa jadi negatif (takut bunga naik).' },
        { asset: 'Emas', impact: 'NFP Tinggi = Emas Bearish.' },
        { asset: 'Kripto', impact: 'NFP Tinggi = Agak bearish karena USD menguat.' }
      ],
      tipsRisiko: 'Volatilitas NFP adalah yang terbesar bulanan. Pemula disarankan menjadi penonton sampai market menemukan arah jelas 1 jam setelah rilis.'
    }
  }
];

export default function EconomicCalendarTab() {
  const [filterImpact, setFilterImpact] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setLoading(true);
        // Finnhub economic calendar (free, no API key needed for basic)
        const today = new Date();
        const from = today.toISOString().split('T')[0];
        const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        const to = futureDate.toISOString().split('T')[0];
        
        const resp = await fetch(`https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=demo`);
        if (!resp.ok) throw new Error(`Finnhub API error: ${resp.status}`);
        const data = await resp.json();
        
        if (data?.economicCalendar?.length > 0) {
          const mapped = data.economicCalendar.map((e, i) => ({
            id: i + 1,
            date: e.time ? e.time.split(' ')[0] : e.date,
            time: e.time ? e.time.split(' ')[1] : '00:00',
            name: e.event,
            country: e.country,
            impact: e.impact >= 3 ? 'HIGH' : e.impact >= 2 ? 'MED' : 'LOW',
            actual: e.actual ?? '—',
            forecast: e.estimate ?? '—',
            previous: e.prev ?? '—',
            status: 'UPCOMING',
            details: {
              apaItu: 'Data ditarik dari Finnhub API.',
              kenapaPenting: 'Indikator makro penting untuk analisis sentimen global.',
              dampakAset: [],
              tipsRisiko: 'Perhatikan volatilitas tinggi saat rilis berita.'
            }
          }));
          setEvents(mapped);
        } else {
          // Fallback to a minimal set if API returns empty
          setEvents(FALLBACK_EVENTS);
        }
      } catch (err) {
        setError(err.message);
        setEvents(FALLBACK_EVENTS);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchImpact = filterImpact === 'ALL' || event.impact === filterImpact;
      const term = searchQuery.toLowerCase();
      const matchSearch = event.name.toLowerCase().includes(term) || event.country.toLowerCase().includes(term);
      return matchImpact && matchSearch;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filterImpact, searchQuery]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'HIGH': return '#ff4444';
      case 'MED': return '#ffbb33';
      case 'LOW': return '#00C851';
      default: return '#fff';
    }
  };

  const getImpactDot = (impact) => {
    switch (impact) {
      case 'HIGH': return '🔴';
      case 'MED': return '🟡';
      case 'LOW': return '🟢';
      default: return '';
    }
  };

  return (
    <div className="econ-calendar-container">
      <style>{`
        .econ-calendar-container {
          background-color: var(--bg-panel, #000);
          color: #fff;
          font-family: 'Courier New', Courier, monospace;
          border: 1px solid #333;
          border-radius: 4px;
          padding: 16px;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #333;
        }

        .filter-pills {
          display: flex;
          gap: 8px;
        }

        .filter-pill {
          background: #111;
          border: 1px solid #444;
          color: #ccc;
          padding: 6px 12px;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .filter-pill:hover, .filter-pill.active {
          background: #333;
          color: #fff;
          border-color: #666;
        }

        .search-input {
          background: #111;
          border: 1px solid #444;
          color: #fff;
          padding: 6px 12px;
          font-family: inherit;
          font-size: 12px;
          width: 200px;
        }

        .search-input:focus {
          outline: none;
          border-color: #666;
        }

        .meta-info {
          font-size: 12px;
          color: #aaa;
          display: flex;
          gap: 16px;
        }

        .calendar-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .calendar-table th, .calendar-table td {
          padding: 10px 8px;
          text-align: left;
          border-bottom: 1px solid #222;
        }

        .calendar-table th {
          color: #888;
          font-weight: normal;
          text-transform: uppercase;
        }

        .table-row {
          cursor: pointer;
          transition: background 0.2s;
        }

        .table-row:hover {
          background: #111;
        }

        .table-row.expanded {
          background: #151515;
          border-left: 2px solid #555;
        }

        .status-upcoming {
          color: #ffbb33;
          animation: pulse 2s infinite;
        }

        .status-released {
          color: #888;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .accordion-cell {
          padding: 0 !important;
          border: none !important;
        }

        .accordion-content {
          background: #0d0d0d;
          border-left: 2px solid #555;
          padding: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          border-bottom: 1px solid #222;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .acc-section {
          background: #151515;
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #2a2a2a;
        }

        .acc-title {
          font-weight: bold;
          font-size: 13px;
          color: #fff;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .acc-body {
          font-size: 12px;
          color: #bbb;
          line-height: 1.5;
        }

        .asset-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .asset-list li {
          margin-bottom: 6px;
          padding-left: 10px;
          position: relative;
        }

        .asset-list li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #666;
        }

        .asset-name {
          color: #ddd;
          font-weight: 500;
        }
      `}</style>

      <div className="calendar-header">
        <div className="filter-pills">
          <button className={`filter-pill ${filterImpact === 'ALL' ? 'active' : ''}`} onClick={() => setFilterImpact('ALL')}>
            ALL IMPACT
          </button>
          <button className={`filter-pill ${filterImpact === 'HIGH' ? 'active' : ''}`} onClick={() => setFilterImpact('HIGH')}>
            🔴 HIGH IMPACT ONLY
          </button>
          <button className={`filter-pill ${filterImpact === 'MED' ? 'active' : ''}`} onClick={() => setFilterImpact('MED')}>
            🟡 MEDIUM
          </button>
          <button className={`filter-pill ${filterImpact === 'LOW' ? 'active' : ''}`} onClick={() => setFilterImpact('LOW')}>
            🟢 LOW
          </button>
        </div>

        <input
          type="text"
          className="search-input"
          placeholder="Search event or country (e.g. US)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="meta-info">
          <span>Timezone: Asia/Jakarta (WIB)</span>
        </div>
      </div>

      <table className="calendar-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time (WIB)</th>
            <th>Ctry</th>
            <th>Event Name</th>
            <th>Impact</th>
            <th>Actual</th>
            <th>Forecast</th>
            <th>Previous</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan="10" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                Loading Economic Calendar from Finnhub API...
              </td>
            </tr>
          )}
          {!loading && error && (
            <tr>
              <td colSpan="10" style={{ textAlign: 'center', padding: '20px', color: '#ff4444' }}>
                Error loading calendar: {error}. Using fallback demo data.
              </td>
            </tr>
          )}
          {!loading && filteredEvents.map(event => (
            <React.Fragment key={event.id}>
              <tr 
                className={`table-row ${expandedId === event.id ? 'expanded' : ''}`}
                onClick={() => toggleExpand(event.id)}
              >
                <td>{event.date}</td>
                <td>{event.time}</td>
                <td>{event.country}</td>
                <td style={{ color: '#fff' }}>{event.name}</td>
                <td>
                  <span style={{ color: getImpactColor(event.impact) }}>
                    {getImpactDot(event.impact)} {event.impact}
                  </span>
                </td>
                <td style={{ fontWeight: 'bold' }}>{event.actual}</td>
                <td>{event.forecast}</td>
                <td>{event.previous}</td>
                <td>
                  <span className={event.status === 'UPCOMING' ? 'status-upcoming' : 'status-released'}>
                    {event.status}
                  </span>
                </td>
                <td style={{ color: '#666' }}>
                  {expandedId === event.id ? '▲' : '▼'}
                </td>
              </tr>
              {expandedId === event.id && (
                <tr>
                  <td colSpan="10" className="accordion-cell">
                    <div className="accordion-content">
                      <div className="acc-section">
                        <div className="acc-title">💡 Apa Itu? (Definisi & Konsep)</div>
                        <div className="acc-body">{event.details.apaItu}</div>
                      </div>
                      
                      <div className="acc-section">
                        <div className="acc-title">⚡ Kenapa Penting Bagi Pasar?</div>
                        <div className="acc-body">{event.details.kenapaPenting}</div>
                      </div>

                      <div className="acc-section" style={{ gridColumn: '1 / -1' }}>
                        <div className="acc-title">🎯 Dampak Lintas Aset</div>
                        <div className="acc-body">
                          <ul className="asset-list">
                            {event.details.dampakAset.map((item, idx) => (
                              <li key={idx}>
                                <span className="asset-name">{item.asset}:</span> {item.impact}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="acc-section" style={{ gridColumn: '1 / -1', background: '#221100', borderColor: '#442200' }}>
                        <div className="acc-title">🛡️ Tips Manajemen Risiko Pemula</div>
                        <div className="acc-body" style={{ color: '#ffb366' }}>
                          {event.details.tipsRisiko}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          {!loading && filteredEvents.length === 0 && (
            <tr>
              <td colSpan="10" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No events found matching your criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
