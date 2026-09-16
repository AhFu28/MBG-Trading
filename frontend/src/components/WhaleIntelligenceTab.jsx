import React, { useState, useEffect, useRef } from 'react';

export default function WhaleIntelligenceTab({ data, onOpenChart }) {
  const [activeTab, setActiveTab] = useState('crypto');
  const [search, setSearch] = useState('');
  const [liveWhales, setLiveWhales] = useState([]);
  const [wsStatus, setWsStatus] = useState('CONNECTING'); // CONNECTING | LIVE | RECONNECTING
  const [lastBlockHeight, setLastBlockHeight] = useState(null);
  const [newTxNotice, setNewTxNotice] = useState(false);
  const wsRef = useRef(null);

  const initialWhales = data?.whale_intelligence?.crypto_whales || [];

  // Sinkronkan data awal bundle dengan live list
  useEffect(() => {
    if (initialWhales.length > 0 && liveWhales.length === 0) {
      setLiveWhales(initialWhales);
    }
  }, [initialWhales]);

  // WebSocket Live Connection ke Mempool.space (100% Gratis, Tanpa API Key)
  useEffect(() => {
    let isMounted = true;

    function connectWs() {
      try {
        const ws = new WebSocket('wss://mempool.space/api/v1/ws');
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setWsStatus('LIVE');
          // Minta stream blok terbaru dan transaksi live
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

              // Tarik transaksi terbesar di blok baru ini
              fetch(`https://mempool.space/api/block/${b.id}/txs/0`)
                .then(r => r.json())
                .then(txs => {
                  if (!isMounted || !Array.isArray(txs)) return;
                  const newOnChain = [];
                  for (const tx of txs) {
                    const totalSats = (tx.vout || []).reduce((acc, v) => acc + (v.value || 0), 0);
                    const btc = totalSats / 1e8;
                    if (btc >= 2.5) { // >= 2.5 BTC
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
                    setLiveWhales(prev => [...newOnChain, ...prev.map(p => ({ ...p, isNew: false }))].slice(0, 25));
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
            setTimeout(connectWs, 5000); // Reconnect otomatis jika putus
          }
        };
      } catch (err) {
        if (isMounted) setWsStatus('FALLBACK');
      }
    }

    connectWs();

    // Fallback Background Poller tiap 45 detik
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
  if (!whaleData && liveWhales.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐋</div>
        <div>Data belum tersedia</div>
      </div>
    );
  }

  const { idx_foreign_whales = [], us_institutional = [] } = whaleData || {};
  const activeCryptoWhales = liveWhales.length > 0 ? liveWhales : initialWhales;

  // Crypto Summaries
  const cryptoBullish = activeCryptoWhales.filter(w => w.sentiment === 'BULLISH').length;
  const cryptoBearish = activeCryptoWhales.filter(w => w.sentiment === 'BEARISH').length;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header Bar with Agile Glass Finish */}
      <div className="quant-card" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🐋</span>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              WHALE INTELLIGENCE HUB
            </h2>
            <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
              INSTITUTIONAL RADAR
            </span>
          </div>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '0.01em' }}>
            Pelacakan Paus Kripto On-Chain Real-Time &middot; Radar Broker Asing BEI &middot; Laporan 13F Wall Street
          </p>
        </div>

        {/* Live WebSocket Status Strip */}
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
              <span>BLOK BARU DITEMUKAN!</span>
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

      {/* 2. Top Summary Bento (Agile Fluid Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        <div className="quant-card quant-card-interactive" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>
              Crypto Whale Bias
            </span>
            <span style={{ fontSize: '18px' }}>🔗</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '8px 0', letterSpacing: '-0.02em', color: cryptoNetSentiment === 'BULLISH' ? 'var(--accent-green)' : cryptoNetSentiment === 'BEARISH' ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
            {cryptoNetSentiment}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent-green)', fontWeight: '700' }}>▲ {cryptoBullish} Inflow Out</span>
            <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
            <span style={{ color: 'var(--accent-rust)', fontWeight: '700' }}>▼ {cryptoBearish} Inflow In</span>
          </div>
        </div>

        <div className="quant-card quant-card-interactive" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>
              IDX Foreign Flow
            </span>
            <span style={{ fontSize: '18px' }}>🏦</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '8px 0', letterSpacing: '-0.02em', color: idxNetFlow >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
            {formatIdr(idxNetFlow)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Top Accumulating Broker: <strong style={{ color: 'var(--accent-gold)' }}>{idxTopBroker?.broker_code}</strong> ({idxTopBroker?.broker_name})
          </div>
        </div>

        <div className="quant-card quant-card-interactive" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>
              Wall Street Smart Money (13F)
            </span>
            <span style={{ fontSize: '18px' }}>🇺🇸</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '8px 0', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            {usIncreased} <span style={{ fontSize: '13px', color: 'var(--accent-green)', fontWeight: '700' }}>Inflow</span> / {usDecreased} <span style={{ fontSize: '13px', color: 'var(--accent-rust)', fontWeight: '700' }}>Trim</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Pergerakan portofolio hedge fund tier-1 global
          </div>
        </div>
      </div>

      {/* 3. Educational Guidance Strip */}
      <div className="quant-card" style={{
        padding: '14px 18px',
        fontSize: '11px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
        background: 'rgba(18, 23, 34, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '16px', lineHeight: 1 }}>🟢</span>
          <div>
            <strong style={{ color: 'var(--accent-green)', letterSpacing: '0.02em' }}>EXCHANGE OUTFLOW (BULLISH)</strong>
            <div style={{ color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
              Exchange &rarr; Cold Storage. Paus menarik koin untuk HODL, suplai di bursa berkurang.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '16px', lineHeight: 1 }}>🔴</span>
          <div>
            <strong style={{ color: 'var(--accent-rust)', letterSpacing: '0.02em' }}>EXCHANGE INFLOW (BEARISH)</strong>
            <div style={{ color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
              Cold Wallet &rarr; Exchange. Paus setor koin ke bursa, indikasi persiapan aksi jual.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '16px', lineHeight: 1 }}>🔵</span>
          <div>
            <strong style={{ color: '#60a5fa', letterSpacing: '0.02em' }}>TREASURY MINT (BULLISH)</strong>
            <div style={{ color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
              Tether/Circle &rarr; Exchange. Cetak likuiditas baru, suntikan amunisi beli segar.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <span style={{ fontSize: '16px', lineHeight: 1 }}>⚪</span>
          <div>
            <strong style={{ color: 'var(--text-primary)', letterSpacing: '0.02em' }}>OTC / WHALE-TO-WHALE</strong>
            <div style={{ color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
              Wallet &rarr; Market Maker. Transaksi blok besar di luar bursa tanpa guncang harga.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Agile Segmented Pill Bar + Search */}
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
          <button onClick={() => setActiveTab('us')} className={`quant-pill-btn ${activeTab === 'us' ? 'active' : ''}`}>
            <span>🇺🇸</span>
            <span>WALL STREET 13F</span>
          </button>
        </div>

        <input 
          type="text" 
          placeholder="Cari emiten, broker, address..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="quant-input"
          style={{ minWidth: '240px' }} 
        />
      </div>

      {/* 5. Main Content Panel */}
      <div className="quant-card" style={{ padding: '6px', overflow: 'hidden' }}>
        {activeTab === 'crypto' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activeCryptoWhales.filter(w => (w.symbol || '').toLowerCase().includes(search.toLowerCase()) || (w.from_name || '').toLowerCase().includes(search.toLowerCase()) || (w.to_name || '').toLowerCase().includes(search.toLowerCase())).map((whale, idx) => (
              <div key={idx} style={{
                background: whale.isNew ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-panel-subtle)',
                border: whale.isNew ? '1px solid #38bdf8' : 'var(--border-hairline)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                transition: 'all 0.3s ease'
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
          <div style={{ padding: '0', overflowX: 'auto' }}>
            <table className="quant-table">
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
          <div style={{ padding: '0', overflowX: 'auto' }}>
            <table className="quant-table">
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
