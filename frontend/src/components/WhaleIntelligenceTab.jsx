import React, { useState } from 'react';

export default function WhaleIntelligenceTab({ data, onOpenChart }) {
  const [activeTab, setActiveTab] = useState('crypto');
  const [search, setSearch] = useState('');

  const whaleData = data?.whale_intelligence;
  if (!whaleData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐋</div>
        <div>Data belum tersedia</div>
      </div>
    );
  }

  const { crypto_whales = [], idx_foreign_whales = [], us_institutional = [] } = whaleData;

  // Crypto Summaries
  const cryptoBullish = crypto_whales.filter(w => w.sentiment === 'BULLISH').length;
  const cryptoBearish = crypto_whales.filter(w => w.sentiment === 'BEARISH').length;
  const cryptoNetSentiment = cryptoBullish > cryptoBearish ? 'BULLISH' : cryptoBearish > cryptoBullish ? 'BEARISH' : 'NEUTRAL';

  // IDX Summaries
  const idxNetFlow = idx_foreign_whales.reduce((acc, curr) => acc + (curr.net_value_idr || 0), 0);
  const idxTopBroker = [...idx_foreign_whales].sort((a, b) => b.net_value_idr - a.net_value_idr)[0];
  const formatIdr = (val) => {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    return `${sign}Rp ${(abs / 1e9).toFixed(2)} Miliar`;
  };

  // US Summaries
  const usIncreased = us_institutional.filter(u => u.action === 'INCREASED' || u.action === 'NEW').length;
  const usDecreased = us_institutional.filter(u => u.action === 'DECREASED' || u.action === 'SOLD_OUT').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
      <div className="telemetry-panel" style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🐋 WHALE INTELLIGENCE HUB
        </h2>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
          Pelacakan Paus Kripto On-Chain · Radar Asing BEI · Institusi Wall Street
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div className="telemetry-panel" style={{ padding: '12px', borderLeft: '3px solid var(--accent-blue)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Crypto Whale Sentiment</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', margin: '8px 0', color: cryptoNetSentiment === 'BULLISH' ? 'var(--accent-green)' : cryptoNetSentiment === 'BEARISH' ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
            {cryptoNetSentiment}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--accent-green)' }}>{cryptoBullish} Bullish</span> vs <span style={{ color: 'var(--accent-rust)' }}>{cryptoBearish} Bearish</span>
          </div>
        </div>

        <div className="telemetry-panel" style={{ padding: '12px', borderLeft: '3px solid var(--accent-gold)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>IDX Foreign Flow</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', margin: '8px 0', color: idxNetFlow >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
            {formatIdr(idxNetFlow)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Top Accumulating: <strong>{idxTopBroker?.broker_code}</strong>
          </div>
        </div>

        <div className="telemetry-panel" style={{ padding: '12px', borderLeft: '3px solid var(--accent-orange)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>US Institutional</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', margin: '8px 0' }}>
            {usIncreased} <span style={{fontSize:'14px',color:'var(--text-muted)'}}>In</span> / {usDecreased} <span style={{fontSize:'14px',color:'var(--text-muted)'}}>Out</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Position updates across major funds
          </div>
        </div>
      </div>

      {/* Educational Banner: Panduan Membaca Aliran Dana Paus */}
      <div style={{
        background: 'var(--bg-panel-subtle)',
        border: 'var(--border-hairline)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 16px',
        fontSize: '11px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>🟢</span>
          <div>
            <strong style={{ color: 'var(--accent-green)' }}>EXCHANGE OUTFLOW (BULLISH)</strong>
            <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
              Exchange &rarr; Cold Storage pribadi. Suplai di bursa berkurang karena paus hodl jangka panjang.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>🔴</span>
          <div>
            <strong style={{ color: 'var(--accent-rust)' }}>EXCHANGE INFLOW (BEARISH)</strong>
            <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
              Cold Wallet &rarr; Exchange. Paus memindahkan koin ke bursa untuk persiapan aksi jual / dump.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>🔵</span>
          <div>
            <strong style={{ color: 'var(--accent-blue)' }}>TREASURY MINT (BULLISH)</strong>
            <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
              Tether/Circle Treasury &rarr; Exchange. Pencetakan stablecoin baru menyuntikkan amunisi likuiditas beli.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>⚪</span>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>OTC / WHALE-TO-WHALE</strong>
            <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
              Wallet &rarr; Market Maker (Wintermute/Jump). Transaksi blok besar di luar bursa tanpa guncang harga.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', borderBottom: 'var(--border-hairline)', paddingBottom: '8px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveTab('crypto')} style={{ background: activeTab === 'crypto' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'crypto' ? 'bold' : 'normal', color: activeTab === 'crypto' ? 'var(--accent-green)' : 'var(--text-secondary)' }}>🔗 CRYPTO ON-CHAIN WHALES</button>
          <button onClick={() => setActiveTab('idx')} style={{ background: activeTab === 'idx' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'idx' ? 'bold' : 'normal', color: activeTab === 'idx' ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>🏦 RADAR ASING BEI (BROKER FLOW)</button>
          <button onClick={() => setActiveTab('us')} style={{ background: activeTab === 'us' ? 'var(--bg-panel-subtle)' : 'transparent', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontWeight: activeTab === 'us' ? 'bold' : 'normal', color: activeTab === 'us' ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>🇺🇸 INSTITUSI WALL STREET (13F)</button>
        </div>
        <input 
          type="text" 
          placeholder="Cari emiten, broker, wallet..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          style={{ padding: '6px 12px', border: 'var(--border-hairline)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-panel)', fontSize: '11px', minWidth: '220px' }} 
        />
      </div>

      <div className="telemetry-panel">
        {activeTab === 'crypto' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {crypto_whales.filter(w => (w.symbol || '').toLowerCase().includes(search.toLowerCase()) || (w.from_name || '').toLowerCase().includes(search.toLowerCase()) || (w.to_name || '').toLowerCase().includes(search.toLowerCase())).map((whale, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-panel-subtle)',
                border: 'var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {/* Header Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>
                      {whale.sentiment === 'BULLISH' ? '🟢' : whale.sentiment === 'BEARISH' ? '🔴' : '⚪'}
                    </span>
                    <span style={{ fontWeight: '800', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                      {Number(whale.amount || 0).toLocaleString()} {whale.symbol}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      (&asymp; ${(Number(whale.amount_usd || 0)).toLocaleString()})
                    </span>
                    <span style={{ fontSize: '10px', background: 'var(--bg-panel)', padding: '2px 6px', borderRadius: '4px', border: 'var(--border-hairline)', color: 'var(--text-secondary)' }}>
                      {whale.blockchain_name || whale.blockchain || 'Blockchain'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${whale.sentiment === 'BULLISH' ? 'badge-bull' : whale.sentiment === 'BEARISH' ? 'badge-bear' : ''}`} style={{ fontWeight: 'bold' }}>
                      {whale.signal}
                    </span>
                    {whale.explorer_url && (
                      <a 
                        href={whale.explorer_url} 
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
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Buka bukti transaksi di Blockchain Explorer"
                      >
                        <span>🔍 Buka Explorer</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Routing Dari Mana Ke Mana */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'var(--bg-panel)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>DARI (PENGIRIM):</div>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{whale.from_name || 'Unknown Whale'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{whale.from_address || whale.hash_short || '-'}</div>
                  </div>
                  <div style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>&rarr;</div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>KE (PENERIMA):</div>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{whale.to_name || 'Destination Wallet'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{whale.to_address || 'Exchange Vault'}</div>
                  </div>
                </div>

                {/* Thesis / Dampak ke Pasar */}
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <strong style={{ color: whale.sentiment === 'BULLISH' ? 'var(--accent-green)' : whale.sentiment === 'BEARISH' ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
                    ANALISIS DAMPAK:
                  </strong> {whale.impact_thesis || 'Perpindahan likuiditas on-chain terdeteksi di jaringan.'}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'idx' && (
          <div style={{ padding: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Saham</th>
                  <th style={{ padding: '10px' }}>Broker Asing (Pembeli/Penjual)</th>
                  <th style={{ padding: '10px' }}>Lawan Transaksi</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Nilai Bersih (IDR)</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Volume (Lot)</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Aksi</th>
                  <th style={{ padding: '10px' }}>Tesis Flow Asing</th>
                </tr>
              </thead>
              <tbody>
                {idx_foreign_whales.filter(w => (w.ticker || '').toLowerCase().includes(search.toLowerCase()) || (w.broker_code || '').toLowerCase().includes(search.toLowerCase())).map((whale, idx) => (
                  <tr key={idx} style={{ borderBottom: 'var(--border-hairline)' }}>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => onOpenChart(whale.ticker)} style={{ background:'transparent', border:'none', color:'var(--accent-blue)', cursor:'pointer', fontWeight:'bold', fontSize:'13px' }}>
                        {whale.ticker} ↗
                      </button>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{whale.company_name}</div>
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

        {activeTab === 'us' && (
          <div style={{ padding: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Institusi / Hedge Fund</th>
                  <th style={{ padding: '10px' }}>Saham US</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Aksi 13F</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Perubahan Lembar</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Estimasi Nilai (USD)</th>
                  <th style={{ padding: '10px' }}>Tesis Strategi Institusi</th>
                </tr>
              </thead>
              <tbody>
                {us_institutional.filter(u => (u.ticker || '').toLowerCase().includes(search.toLowerCase()) || (u.fund_name || '').toLowerCase().includes(search.toLowerCase())).map((us, idx) => (
                  <tr key={idx} style={{ borderBottom: 'var(--border-hairline)' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>
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
                    <td style={{ padding: '10px', fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '320px' }}>
                      {us.strategy_thesis || 'Pembaruan portofolio institusi kuartal ini.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
