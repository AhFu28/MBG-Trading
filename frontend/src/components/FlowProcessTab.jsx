import React, { useState } from 'react';

export default function FlowProcessTab() {
  const [activeSection, setActiveSection] = useState('FLOW_DIAGRAM'); // FLOW_DIAGRAM | DATA_REALITY | TOURNAMENT_16 | MT5_EA | AI_AUDIT_SPEC
  const [copiedCode, setCopiedCode] = useState(false);

  // The EA is a paid deliverable: fetched through the session-gated route, not
  // from a public static path, so it cannot be downloaded without authenticating.
  const EA_ROUTE = import.meta.env.DEV ? '/api/dev-bundle?type=ea' : '/api/ea';

  const handleCopyEA = () => {
    fetch(EA_ROUTE)
      .then(res => res.text())
      .then(text => {
        navigator.clipboard.writeText(text);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
      })
      .catch(() => {
        alert('Gagal menyalin kode EA otomatis. Silakan unduh langsung file .mq5.');
      });
  };

  return (
    <div style={{
      padding: '20px 24px',
      color: '#e6edf3',
      maxWidth: '1600px',
      margin: '0 auto',
      fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)'
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '16px',
        marginBottom: '20px',
        borderBottom: '1px solid #30363d'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>⚡</span>
            <h1 style={{
              fontSize: '20px',
              fontWeight: '800',
              letterSpacing: '-0.3px',
              margin: 0,
              color: '#f0f6fc',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono, monospace)'
            }}>
              System Flow Process & Architecture Blueprint
            </h1>
            <span style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontWeight: '700',
              fontFamily: 'var(--font-mono, monospace)'
            }}>
              v5.0 APEX AUDITED
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8b949e' }}>
            Dokumentasi komprehensif arsitektur end-to-end data, logika kuantitatif, turnamen 16 bot otonom, dan modul eksekusi Bitget MT5 EA.
          </p>
        </div>

        {/* Section Navigation Pills */}
        <div style={{
          display: 'flex',
          background: '#161b22',
          padding: '3px',
          borderRadius: '6px',
          border: '1px solid #30363d',
          gap: '2px'
        }}>
          {[
            { id: 'FLOW_DIAGRAM', label: '1. Pipeline & Data Flow' },
            { id: 'DATA_REALITY', label: '2. Integritas Data & Audit' },
            { id: 'TOURNAMENT_16', label: '3. Turnamen 16 Bot' },
            { id: 'MT5_EA', label: '4. Ekspor Bitget MT5 EA' },
            { id: 'AI_AUDIT_SPEC', label: '5. Panduan AI Auditor' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              style={{
                padding: '6px 14px',
                fontSize: '11.5px',
                fontWeight: activeSection === tab.id ? '700' : '500',
                background: activeSection === tab.id ? 'var(--accent-blue, #1f6feb)' : 'transparent',
                color: activeSection === tab.id ? '#ffffff' : '#8b949e',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'var(--font-mono, monospace)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: END-TO-END SYSTEM FLOW & PIPELINE DIAGRAM */}
      {/* ========================================================================= */}
      {activeSection === 'FLOW_DIAGRAM' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Visual Stepper */}
          <div style={{
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#58a6ff', fontFamily: 'var(--font-mono)' }}>
              ARUS DATA END-TO-END (INGESTION $\to$ BRAIN $\to$ BUNDLE $\to$ TERMINAL $\to$ MT5)
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              position: 'relative'
            }}>
              {/* Step 1 */}
              <div style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '6px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ background: '#238636', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>1. INGESTION</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f0f6fc', marginBottom: '6px' }}>Multi-Market Fetchers</div>
                <p style={{ fontSize: '12px', color: '#8b949e', margin: 0, lineHeight: 1.5 }}>
                  • <b>Crypto:</b> TradingView Scanner & Binance FAPI.<br/>
                  • <b>IDX Equities:</b> TradingView Scanner & yfinance EOD.<br/>
                  • <b>Forex & US:</b> TV Interbank Scanner (28 pairs).<br/>
                  • <b>Macro/News:</b> Yahoo Finance & RSS Feeds.
                </p>
              </div>

              {/* Step 2 */}
              <div style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '6px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ background: '#1f6feb', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>2. ANALYZER</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f0f6fc', marginBottom: '6px' }}>Quant Brain & Gemini LLM</div>
                <p style={{ fontSize: '12px', color: '#8b949e', margin: 0, lineHeight: 1.5 }}>
                  • <b>LLM Brain:</b> Gemini 3.6 Flash mensintesis berita makro $\to$ Trade Plans standar Astra.<br/>
                  • <b>Bull vs Bear Debate:</b> Validasi veto skenario.<br/>
                  • <b>Quant Filters:</b> SMC Order Block & Exp3 Multi-Armed Bandit.
                </p>
              </div>

              {/* Step 3 */}
              <div style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '6px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ background: '#8957e5', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>3. STORAGE</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f0f6fc', marginBottom: '6px' }}>Atomic Master Bundle</div>
                <p style={{ fontSize: '12px', color: '#8b949e', margin: 0, lineHeight: 1.5 }}>
                  • Output dikompilasi menjadi satu berkas JSON master: <code>latest_cockpit_bundle.json</code>.<br/>
                  • Disinkronkan ke Supabase & Git repository.<br/>
                  • Cloudflare Pages menyajikan bundle ke browser via CDN tepi global (Edge CDN).
                </p>
              </div>

              {/* Step 4 */}
              <div style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '6px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ background: '#d29922', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>4. FRONTEND</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f0f6fc', marginBottom: '6px' }}>Reactive Terminal UI</div>
                <p style={{ fontSize: '12px', color: '#8b949e', margin: 0, lineHeight: 1.5 }}>
                  • <code>useLivePrices.js</code> polling tick scanner per 5s.<br/>
                  • 16 Bot Arena menghitung trailing stop ke Breakeven secara real-time.<br/>
                  • Charting Desk terintegrasi TradingView Advanced Widget.
                </p>
              </div>

              {/* Step 5 */}
              <div style={{
                background: '#161b22',
                border: '1px solid #d29922',
                borderRadius: '6px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ background: '#da3633', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>5. EXECUTION</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f0f6fc', marginBottom: '6px' }}>Broker & MT5 Export</div>
                <p style={{ fontSize: '12px', color: '#8b949e', margin: 0, lineHeight: 1.5 }}>
                  • <b>Paper Broker:</b> Matching engine lokal & slippage.<br/>
                  • <b>Binance Adapter:</b> HMAC-SHA256 Web Crypto.<br/>
                  • <b>Bitget MT5 EA:</b> File <code>.mq5</code> diekspor langsung ke terminal trading MT5.
                </p>
              </div>
            </div>
          </div>

          {/* Cron Trigger Architecture */}
          <div style={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f0f6fc', fontFamily: 'var(--font-mono)' }}>
              ⏰ ARSITEKTUR OTOMASI PENGUMPULAN DATA (CRON & GITHUB ACTIONS)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#0d1117', padding: '14px', borderRadius: '6px', border: '1px solid #21262d' }}>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#38bdf8', marginBottom: '4px' }}>Hourly Crypto & Macro Runner (`0 * * * *`)</div>
                <div style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.5 }}>
                  Setiap jam (24/7), GitHub Actions mengeksekusi <code>py engine/run_pipeline.py --mode hourly_crypto_macro</code> untuk merefresh harga Spot Crypto Top 10, data makro DXY/Gold/Oil, dan Whale Tracker. Hasilnya di-commit otomatis ke repo.
                </div>
              </div>

              <div style={{ background: '#0d1117', padding: '14px', borderRadius: '6px', border: '1px solid #21262d' }}>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#38bdf8', marginBottom: '4px' }}>Daily IDX Morning Runner (`0 1 * * 1-5`)</div>
                <div style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.5 }}>
                  Pukul 08:00 WIB (01:00 UTC) setiap hari kerja bursa, engine mengeksekusi pemindaian konglomerasi BEI, foreign flow, dan LLM Brain menghasilkan <b>Astra Daily Trade Plans</b> untuk hari tersebut sebelum bursa buka.
                </div>
              </div>

              <div style={{ background: '#0d1117', padding: '14px', borderRadius: '6px', border: '1px solid #21262d' }}>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#38bdf8', marginBottom: '4px' }}>Client-Side Reactive Polling (Edge Worker 5s)</div>
                <div style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.5 }}>
                  Ketika tab browser terbuka, hook <code>useLivePrices.js</code> menembak Cloudflare Functions reverse-proxy (<code>/api/scanner</code>) untuk memperbarui harga tick emiten aktif secara langsung tanpa delay.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: DATA INTEGRITY & AUDIT DISCLOSURES */}
      {/* ========================================================================= */}
      {activeSection === 'DATA_REALITY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#f0f6fc', fontFamily: 'var(--font-mono)' }}>
              MATRIKS ASAL-USUL DATA & TRANSPARANSI INSTITUSIONAL
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: '#8b949e' }}>
              Berdasarkan hasil Audit Kepatuhan 25 September 2026, berikut adalah klasifikasi ketat setiap sumber data yang ditampilkan di terminal:
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px',
                textAlign: 'left'
              }}>
                <thead>
                  <tr style={{ background: '#0d1117', borderBottom: '2px solid #30363d' }}>
                    <th style={{ padding: '10px 12px', color: '#58a6ff' }}>Data Point</th>
                    <th style={{ padding: '10px 12px', color: '#58a6ff' }}>Sumber Literal</th>
                    <th style={{ padding: '10px 12px', color: '#58a6ff' }}>Status Data</th>
                    <th style={{ padding: '10px 12px', color: '#58a6ff' }}>Frekuensi Update</th>
                    <th style={{ padding: '10px 12px', color: '#58a6ff' }}>Catatan Integritas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #21262d' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '700' }}>Harga Spot Crypto Top 10</td>
                    <td style={{ padding: '10px 12px' }}>TradingView Crypto Scanner</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: '#3fb950', fontWeight: '700' }}>LIVE TICK</span></td>
                    <td style={{ padding: '10px 12px' }}>5s – 10s</td>
                    <td style={{ padding: '10px 12px', color: '#8b949e' }}>Kuotasi bursa Binance langsung via proxy scanner.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #21262d' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '700' }}>Harga Saham BEI (IDX)</td>
                    <td style={{ padding: '10px 12px' }}>TradingView Scanner / yfinance</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: '#3fb950', fontWeight: '700' }}>LIVE (Jam Bursa)</span></td>
                    <td style={{ padding: '10px 12px' }}>5s – 15s</td>
                    <td style={{ padding: '10px 12px', color: '#8b949e' }}>Terkunci pada Official Closing Price saat bursa tutup.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #21262d' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '700' }}>Forex Scanner (28 Pairs)</td>
                    <td style={{ padding: '10px 12px' }}>TradingView Forex Scanner</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: '#3fb950', fontWeight: '700' }}>LIVE</span></td>
                    <td style={{ padding: '10px 12px' }}>5s – 15s</td>
                    <td style={{ padding: '10px 12px', color: '#8b949e' }}>Presisi interbank 5 desimal (3 desimal untuk JPY).</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #21262d' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '700' }}>Emas (XAU/USD) & Minyak</td>
                    <td style={{ padding: '10px 12px' }}>TradingView `TVC:GOLD` & `BZ=F`</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: '#d29922', fontWeight: '700' }}>DELAYED / BUNDLE</span></td>
                    <td style={{ padding: '10px 12px' }}>Tiap Jam (Cron)</td>
                    <td style={{ padding: '10px 12px', color: '#8b949e' }}>Ternormalisasi ke harga spot fisik dunia (~$4,310/oz).</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #21262d' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '700' }}>Net Foreign Flow (Asing)</td>
                    <td style={{ padding: '10px 12px' }}>GOAPI / IndexAlpha / Heuristik</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: '#e3b341', fontWeight: '700' }}>ESTIMASI MODEL</span></td>
                    <td style={{ padding: '10px 12px' }}>EOD / Intraday</td>
                    <td style={{ padding: '10px 12px', color: '#8b949e' }}>Jika API kuota limit, dihitung via formula <code>(Price * Vol * Chg%) * 0.35</code>.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #21262d' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '700' }}>Whale Tracker On-Chain</td>
                    <td style={{ padding: '10px 12px' }}>Mempool.space API</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: '#3fb950', fontWeight: '700' }}>LIVE (BTC)</span></td>
                    <td style={{ padding: '10px 12px' }}>Per Block</td>
                    <td style={{ padding: '10px 12px', color: '#8b949e' }}>Menarik transaksi blockchain asli tanpa API key.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #21262d' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '700' }}>16 Bot Signals & Trailing</td>
                    <td style={{ padding: '10px 12px' }}>Dynamic Reactive Engine (JS)</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: '#58a6ff', fontWeight: '700' }}>HEURISTIK ALGORITMA</span></td>
                    <td style={{ padding: '10px 12px' }}>Real-time Client</td>
                    <td style={{ padding: '10px 12px', color: '#8b949e' }}>Aturan kuantitatif deterministik (bukan model neural net).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: 16-BOT TOURNAMENT ARCHITECTURE & 1-MONTH TEST */}
      {/* ========================================================================= */}
      {activeSection === 'TOURNAMENT_16' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#f0f6fc', fontFamily: 'var(--font-mono)' }}>
              STRUKTUR TURNAMEN 1 BULAN: CHAMPION-CHALLENGER (KAIZEN CONTINUOUS IMPROVEMENT)
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#8b949e', lineHeight: 1.6 }}>
              Tujuan pengujian 16 varian adalah mencari strategi paling tangguh di pasar riil melalui metodologi <b>Walk-Forward Evaluation</b>.
              Setelah 1 bulan pengujian, varian dengan performa terbaik dinobatkan sebagai <b>Champion EA</b> dan dideploy ke Bitget MT5.
              Varian yang belum terpilih tidak dibuang, melainkan ditingkatkan parameternya (Challenger) untuk siklus evaluasi berikutnya.
            </p>

            {/* 4 Base Elements Table */}
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#58a6ff', fontFamily: 'var(--font-mono)' }}>
              DNA 4 ELEMEN DASAR & HIPOTESIS KUANTITATIF
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div style={{ background: '#0d1117', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '6px', padding: '16px' }}>
                <div style={{ color: '#38bdf8', fontWeight: '800', fontSize: '14px', marginBottom: '4px' }}>💧 WATER // Smart Money Concepts (SMC)</div>
                <div style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.5 }}>
                  <b>Logika:</b> Menunggu liquidity sweep di extreme range (&lt; 28% atau &gt; 72%) dan RSI recovery.<br/>
                  <b>Target Karakter:</b> High Win Rate (~65%), Risk/Reward 1:2. Cocok untuk pasar berayun / swing.
                </div>
              </div>

              <div style={{ background: '#0d1117', border: '1px solid rgba(248, 113, 113, 0.4)', borderRadius: '6px', padding: '16px' }}>
                <div style={{ color: '#f87171', fontWeight: '800', fontSize: '14px', marginBottom: '4px' }}>🔥 FIRE // Volatility Momentum Expansion</div>
                <div style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.5 }}>
                  <b>Logika:</b> Candle body eksplosif &gt; 1.2x ATR dengan konfirmasi volume tinggi.<br/>
                  <b>Target Karakter:</b> Menangkap pergerakan tren tajam. Win rate ~45%, tetapi profit per trade sangat besar.
                </div>
              </div>

              <div style={{ background: '#0d1117', border: '1px solid rgba(167, 139, 250, 0.4)', borderRadius: '6px', padding: '16px' }}>
                <div style={{ color: '#a78bfa', fontWeight: '800', fontSize: '14px', marginBottom: '4px' }}>💨 AIR // Donchian Channel High/Low Breakout</div>
                <div style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.5 }}>
                  <b>Logika:</b> Turtle Trading system — eksekusi breakout di atas highest high 14 bar.<br/>
                  <b>Target Karakter:</b> Trend-following klasik. Kebal false breakout karena trailing stop cepat.
                </div>
              </div>

              <div style={{ background: '#0d1117', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '6px', padding: '16px' }}>
                <div style={{ color: '#34d399', fontWeight: '800', fontSize: '14px', marginBottom: '4px' }}>🌍 EARTH // Mean Reversion Equilibrium</div>
                <div style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.5 }}>
                  <b>Logika:</b> Beli saat RSI &lt; 30 dan harga menyentuh lower Bollinger Band, jual saat equilibrium tercapai.<br/>
                  <b>Target Karakter:</b> Win rate konsisten di pasar sideways / konsolidasi.
                </div>
              </div>
            </div>

            {/* Turnamen 1 Bulan Checklist */}
            <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#f0f6fc', marginBottom: '8px' }}>
                📊 MATRIKS EVALUASI SELEKSI AKHIR (HARI KE-30):
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#8b949e', lineHeight: 1.7 }}>
                <li><b>Profit Factor (PF):</b> Rasio Total Gross Profit dibagi Total Gross Loss (Syarat kelulusan: PF &ge; 1.6).</li>
                <li><b>Maximum Drawdown (MDD):</b> Penurunan modal terdalam dari puncak ekuitas (Syarat kelulusan: MDD &le; 10%).</li>
                <li><b>Expectancy Matematis:</b> <code>(WinRate * AvgWin) - (LossRate * AvgLoss) &gt; 0</code>.</li>
                <li><b>Jumlah Sampel Transaksi:</b> Minimal 40 transaksi teruji dalam 30 hari perdagangan.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: BITGET MT5 EA EXPORT & CODE REPO */}
      {/* ========================================================================= */}
      {activeSection === 'MT5_EA' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#f0f6fc', fontFamily: 'var(--font-mono)' }}>
                  BITGET MT5 EXPERT ADVISOR (MQL5 NATIVE)
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#8b949e' }}>
                  Source code siap pakai MetaTrader 5 untuk eksekusi live / demo di broker Bitget MT5.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={EA_ROUTE}
                  download="MBG_Institutional_Apex_EA.mq5"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: '#238636',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  ⬇️ UNDUH FILE .MQ5
                </a>
                <button
                  onClick={handleCopyEA}
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: '#21262d',
                    color: copiedCode ? '#3fb950' : '#c9d1d9',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {copiedCode ? '✓ KODE TERSALIN' : '📋 SALIN SOURCE CODE'}
                </button>
              </div>
            </div>

            {/* Supported Instruments on Bitget MT5 */}
            <div style={{
              background: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px' }}>
                ✅ DAFTAR INSTRUMEN DIDUKUNG DI BITGET MT5:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '12px', color: '#8b949e' }}>
                <div>
                  <b style={{ color: '#f0f6fc' }}>Crypto USDT-M Majors:</b><br/>
                  BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT
                </div>
                <div>
                  <b style={{ color: '#f0f6fc' }}>AI Narrative Tokens:</b><br/>
                  FETUSDT, RENDERUSDT, NEARUSDT, TAOUSDT
                </div>
                <div>
                  <b style={{ color: '#f0f6fc' }}>Komoditas & Logam:</b><br/>
                  XAUUSD (Emas), XAGUSD (Perak), USOIL
                </div>
                <div>
                  <b style={{ color: '#f0f6fc' }}>Forex Interbank:</b><br/>
                  EURUSD, GBPUSD, USDJPY, AUDUSD
                </div>
              </div>
            </div>

            {/* How to Install on Bitget MT5 */}
            <div style={{
              background: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: '6px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#f0f6fc', marginBottom: '8px' }}>
                🚀 CARA MEMASANG EA DI BITGET METATRADER 5:
              </div>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#8b949e', lineHeight: 1.8 }}>
                <li>Buka aplikasi <b>MetaTrader 5</b> yang terhubung ke akun <b>Bitget MT5</b> Anda.</li>
                <li>Klik menu <code>File</code> $\to$ <code>Open Data Folder</code>.</li>
                <li>Masuk ke folder <code>MQL5</code> $\to$ <code>Experts</code>.</li>
                <li>Salin file <code>MBG_Institutional_Apex_EA.mq5</code> ke dalam folder tersebut.</li>
                <li>Di MT5, buka jendela <b>Navigator</b> (Ctrl+N), klik kanan pada <b>Expert Advisors</b>, lalu klik <code>Refresh</code>.</li>
                <li>Tarik (drag-and-drop) EA ke chart instrumen yang ingin ditradingkan (misal: <code>FETUSDT</code> atau <code>BTCUSDT</code>).</li>
                <li>Centang <b>"Allow Algo Trading"</b> pada tab Common, lalu tentukan Risk % (misal 1.5%) dan Varian bot yang dipilih. Selesai!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: AI AUDITOR SPECIFICATION */}
      {/* ========================================================================= */}
      {activeSection === 'AI_AUDIT_SPEC' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#f0f6fc', fontFamily: 'var(--font-mono)' }}>
              PANDUAN ACUAN AUDIT SISTEM BAGI AI AUDITOR EKSTERNAL
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#8b949e', lineHeight: 1.6 }}>
              Bagian ini disediakan sebagai acuan deterministik bagi model AI, auditor pihak ketiga, atau sistem due-diligence otomatis untuk memvalidasi kepatuhan kode dan integritas komputasi proyek:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12.5px', color: '#8b949e' }}>
              <div style={{ background: '#0d1117', padding: '14px', borderRadius: '6px', border: '1px solid #21262d' }}>
                <b style={{ color: '#58a6ff' }}>1. Verifikasi Nol Mutasi Acak (Zero-Random Check):</b><br/>
                Periksa direktori <code>engine/fetchers/</code>. Seluruh data tick harga bursa wajib bersumber dari endpoint publik scanner riil. Tidak diperkenankan menggunakan <code>random.uniform()</code> atau mock acak tanpa penanda status eksplisit.
              </div>

              <div style={{ background: '#0d1117', padding: '14px', borderRadius: '6px', border: '1px solid #21262d' }}>
                <b style={{ color: '#58a6ff' }}>2. Verifikasi Batas Risiko Portofolio (Risk Governance):</b><br/>
                Periksa <code>frontend/src/services/brokerGateway.js</code>. Modul wajib mematuhi aturan Citadel: risiko maksimal 2% per transaksi, batas konsentrasi 25% modal per posisi, dan Kill Switch darurat yang dapat menghentikan seluruh transaksi dalam 1 klik.
              </div>

              <div style={{ background: '#0d1117', padding: '14px', borderRadius: '6px', border: '1px solid #21262d' }}>
                <b style={{ color: '#58a6ff' }}>3. Verifikasi Logika Trailing Stop Breakeven:</b><br/>
                Periksa <code>frontend/src/utils/dynamicStrategy.js</code>. Ketika Target 1 (TP1) tersentuh, Stop Loss wajib terkunci ke harga Entry (Breakeven) dan tidak boleh kembali turun meski harga melakukan koreksi teknikal (*pullback latching*).
              </div>

              <div style={{ background: '#0d1117', padding: '14px', borderRadius: '6px', border: '1px solid #21262d' }}>
                <b style={{ color: '#58a6ff' }}>4. Verifikasi Integritas MQL5 EA:</b><br/>
                Periksa <code>engine/mt5/MBG_Institutional_Apex_EA.mq5</code>. Formula lot sizing wajib menggunakan normalisasi step volume broker (<code>SYMBOL_VOLUME_STEP</code>) dan menghitung eksposur modal berdasarkan jarak pips Stop Loss terhadap ekuitas akun riil.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
