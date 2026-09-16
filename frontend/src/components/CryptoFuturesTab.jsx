import React, { useState, useEffect, useRef } from 'react';

export default function CryptoFuturesTab({ data, onOpenChart }) {
  const [activeTab, setActiveTab] = useState('funding');
  const [liveFundingRates, setLiveFundingRates] = useState([]);
  const [liveLiquidations, setLiveLiquidations] = useState([]);
  const [wsStatus, setWsStatus] = useState('CONNECTING'); // CONNECTING | LIVE | RECONNECTING
  const [countdown, setCountdown] = useState('');
  const [flashingPairs, setFlashingPairs] = useState({});
  const wsRef = useRef(null);
  const liqWsRef = useRef(null);

  const initialRates = data?.crypto_futures?.funding_rates || [];
  const initialLiq = data?.crypto_futures?.liquidations_24h || {};
  const initialOI = data?.crypto_futures?.open_interest || [];
  const initialLS = data?.crypto_futures?.long_short_ratio || [];

  // Sinkronisasi data awal
  useEffect(() => {
    if (initialRates.length > 0 && liveFundingRates.length === 0) {
      setLiveFundingRates(initialRates);
    }
  }, [initialRates]);

  // 1. Live Countdown ke 8-Hour Funding Settlement (07:00, 15:00, 23:00 WIB)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentHours = now.getUTCHours();
      const nextFundingHour = (Math.floor(currentHours / 8) + 1) * 8;
      const target = new Date(now);
      target.setUTCHours(nextFundingHour, 0, 0, 0);

      const diffMs = target - now;
      if (diffMs <= 0) {
        setCountdown('00:00:00');
        return;
      }
      const h = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, '0');
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const s = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0');
      setCountdown(`${h}:${m}:${s}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Binance Live WebSocket untuk Mark Price & Funding Rate (!markPrice@arr@1s)
  useEffect(() => {
    let isMounted = true;

    function connectBinanceWs() {
      try {
        const ws = new WebSocket('wss://fstream.binance.com/ws/!markPrice@arr@1s');
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) setWsStatus('LIVE');
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const rawList = JSON.parse(event.data);
            if (!Array.isArray(rawList)) return;

            const priceMap = {};
            for (const item of rawList) {
              priceMap[item.s] = {
                price: parseFloat(item.p || 0),
                fundingRate: parseFloat(item.r || 0),
                nextFundingTime: item.T
              };
            }

            setLiveFundingRates(prev => {
              const currentList = prev.length > 0 ? prev : initialRates;
              const flash = {};
              const updated = currentList.map(item => {
                const live = priceMap[item.symbol];
                if (!live) return item;

                const oldPrice = item.mark_price || 0;
                if (oldPrice && live.price !== oldPrice) {
                  flash[item.symbol] = live.price > oldPrice ? 'up' : 'down';
                }

                const frPct = live.fundingRate * 100;
                const sig = frPct > 0.05 ? 'OVERLEVERAGED_LONGS' : frPct < -0.01 ? 'SHORT_SQUEEZE_SETUP' : 'NEUTRAL';

                return {
                  ...item,
                  mark_price: live.price,
                  funding_rate: live.fundingRate,
                  funding_rate_pct: parseFloat(frPct.toFixed(4)),
                  signal: sig,
                  isLiveTick: true
                };
              });

              if (Object.keys(flash).length > 0) {
                setFlashingPairs(flash);
                setTimeout(() => setFlashingPairs({}), 600);
              }

              return updated;
            });
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
            setTimeout(connectBinanceWs, 5000);
          }
        };
      } catch {
        if (isMounted) setWsStatus('FALLBACK');
      }
    }

    // 3. Binance Live Liquidation Stream (!forceOrder@arr)
    function connectLiqWs() {
      try {
        const wsLiq = new WebSocket('wss://fstream.binance.com/ws/!forceOrder@arr');
        liqWsRef.current = wsLiq;

        wsLiq.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data?.o) {
              const o = data.o;
              const usdVal = parseFloat(o.q || 0) * parseFloat(o.p || 0);
              const liqItem = {
                symbol: o.s,
                pair: o.s.replace('USDT', '/USDT'),
                side: o.S, // SELL = Long Liquidated, BUY = Short Liquidated
                price: parseFloat(o.p || 0),
                qty: parseFloat(o.q || 0),
                usd_value: Math.round(usdVal),
                timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                isNew: true
              };
              setLiveLiquidations(prev => [liqItem, ...prev.map(p => ({ ...p, isNew: false }))].slice(0, 30));
            }
          } catch {}
        };
      } catch {}
    }

    connectBinanceWs();
    connectLiqWs();

    return () => {
      isMounted = false;
      if (wsRef.current) wsRef.current.close();
      if (liqWsRef.current) liqWsRef.current.close();
    };
  }, []);

  const rates = liveFundingRates.length > 0 ? liveFundingRates : initialRates;
  const totalOI = initialOI.reduce((acc, curr) => acc + (curr.open_interest_usd || 0), 0);
  const avgFunding = rates.reduce((acc, curr) => acc + (curr.funding_rate_pct || 0), 0) / (rates.length || 1);
  const lsRatios = initialLS.map(r => r.long_short_ratio);
  const avgLsRatio = lsRatios.reduce((acc, curr) => acc + curr, 0) / (lsRatios.length || 1);
  const marketBias = avgLsRatio > 1.05 ? 'LONG BIASED' : avgLsRatio < 0.95 ? 'SHORT BIASED' : 'NEUTRAL';

  const getFundingBg = (val) => {
    if (val > 0.05) return 'rgba(184, 50, 50, 0.2)'; // High positive -> red warning
    if (val < -0.01) return 'rgba(27, 138, 75, 0.2)'; // Negative -> green opportunity
    return 'transparent';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', boxSizing: 'border-box' }}>
      {/* 1. Header with Live Status & Countdown */}
      <div className="quant-card" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              CRYPTO FUTURES INTELLIGENCE
            </h2>
            <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
              DERIVATIVES COCKPIT
            </span>
          </div>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '0.01em' }}>
            Funding Rate Live 1s &middot; Open Interest &middot; Long/Short Ratio &middot; Radar Likuidasi Real-Time
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Countdown Next Settlement */}
          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>SETTLE COUNTDOWN:</span>
            <strong style={{ color: 'var(--accent-gold)', letterSpacing: '0.05em' }}>{countdown || '--:--:--'}</strong>
          </div>

          {/* WebSocket Status */}
          <div style={{
            fontSize: '11px',
            padding: '6px 12px',
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
            <span>{wsStatus === 'LIVE' ? 'BINANCE STREAM (0s)' : 'SYNCHRONIZING...'}</span>
          </div>
        </div>
      </div>

      {/* 2. Top 4 Summary Bento (Agile Fluid Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="quant-card quant-card-interactive" style={{ padding: '16px 18px', position: 'relative' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>
            Total Open Interest
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '8px 0', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            ${(totalOI / 1e9).toFixed(2)}B
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Kontrak Berjangka Aktif Terbuka</div>
        </div>

        <div className="quant-card quant-card-interactive" style={{ padding: '16px 18px', position: 'relative' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>
            Avg Funding Rate (Live)
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '8px 0', letterSpacing: '-0.02em', color: avgFunding < -0.01 ? 'var(--accent-green)' : avgFunding > 0.05 ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
            {avgFunding.toFixed(4)}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {avgFunding > 0.03 ? '⚠️ Long Terlalu Padat' : avgFunding < -0.01 ? '🚀 Peluang Short Squeeze' : 'Normal / Seimbang'}
          </div>
        </div>

        <div className="quant-card quant-card-interactive" style={{ padding: '16px 18px', position: 'relative' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>
            Market Bias (L/S Ratio)
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '8px 0', letterSpacing: '-0.02em', color: marketBias === 'LONG BIASED' ? 'var(--accent-green)' : marketBias === 'SHORT BIASED' ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
            {marketBias}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Rasio Akun Global: <strong>{avgLsRatio.toFixed(2)}x</strong></div>
        </div>
        
        <div className="quant-card quant-card-interactive" style={{ padding: '16px 18px', position: 'relative' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>
            24h Liquidations
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'var(--font-mono)', margin: '8px 0', letterSpacing: '-0.02em', color: 'var(--accent-rust)' }}>
            ${(initialLiq.total_liquidated_usd / 1e6 || 0).toFixed(2)}M
          </div>
          <div style={{ fontSize: '11px', display: 'flex', gap: '10px' }}>
            <span style={{ color: 'var(--accent-green)', fontWeight: '700' }}>▲ L: ${(initialLiq.long_liquidated_usd / 1e6 || 0).toFixed(1)}M</span>
            <span style={{ color: 'var(--accent-rust)', fontWeight: '700' }}>▼ S: ${(initialLiq.short_liquidated_usd / 1e6 || 0).toFixed(1)}M</span>
          </div>
        </div>
      </div>

      {/* 3. Agile Segmented Pill Navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div className="quant-pill-nav">
          <button onClick={() => setActiveTab('funding')} className={`quant-pill-btn ${activeTab === 'funding' ? 'active' : ''}`}>
            <span>💰</span>
            <span>FUNDING RATE LIVE</span>
          </button>
          <button onClick={() => setActiveTab('oi')} className={`quant-pill-btn ${activeTab === 'oi' ? 'active' : ''}`}>
            <span>📊</span>
            <span>OPEN INTEREST</span>
          </button>
          <button onClick={() => setActiveTab('ls')} className={`quant-pill-btn ${activeTab === 'ls' ? 'active' : ''}`}>
            <span>⚖️</span>
            <span>LONG / SHORT GAUGE</span>
          </button>
          <button onClick={() => setActiveTab('liquidations')} className={`quant-pill-btn ${activeTab === 'liquidations' ? 'active' : ''}`}>
            <span>💀</span>
            <span>RADAR LIKUIDASI ({liveLiquidations.length > 0 ? liveLiquidations.length : 'LIVE'})</span>
          </button>
        </div>
      </div>

      {/* 4. Main Table / Content Panel */}
      <div className="quant-card" style={{ padding: '0', overflow: 'hidden' }}>
        {activeTab === 'funding' && (
          <table className="quant-table">
            <thead>
              <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Pair Kripto</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Funding Rate (8h)</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Mark Price (Live 1s)</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Settle Countdown</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Sinyal Leverage</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((f, idx) => {
                const flash = flashingPairs[f.symbol];
                const flashBg = flash === 'up' ? 'rgba(0, 208, 132, 0.18)' : flash === 'down' ? 'rgba(239, 68, 68, 0.18)' : getFundingBg(f.funding_rate_pct);
                return (
                  <tr key={idx} style={{ borderBottom: 'var(--border-hairline)', background: flashBg, transition: 'background 0.4s ease' }}>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => onOpenChart(`BINANCE:${f.symbol}`)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                        {f.pair} ↗
                      </button>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: f.funding_rate_pct < -0.01 ? 'var(--accent-green)' : f.funding_rate_pct > 0.05 ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
                      {f.funding_rate_pct > 0 ? '+' : ''}{f.funding_rate_pct.toFixed(4)}%
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                      ${Number(f.mark_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      {flash === 'up' && <span style={{ color: 'var(--accent-green)', marginLeft: '4px' }}>▲</span>}
                      {flash === 'down' && <span style={{ color: 'var(--accent-rust)', marginLeft: '4px' }}>▼</span>}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {countdown || '08:00:00'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span className={`badge ${f.funding_rate_pct < -0.01 ? 'badge-bull' : f.funding_rate_pct > 0.05 ? 'badge-bear' : ''}`} style={{ fontWeight: 'bold' }}>
                        {f.signal === 'OVERLEVERAGED_LONGS' ? '⚠️ OVERLEVERAGED' : f.signal === 'SHORT_SQUEEZE_SETUP' ? '🚀 SQUEEZE POTENTIAL' : 'NEUTRAL'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === 'oi' && (
          <table className="quant-table">
            <thead>
              <tr style={{ borderBottom: 'var(--border-muted)', background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Pair</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Open Interest (USD)</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Perubahan 1 Jam</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Harga Acuan</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Sinyal Divergensi OI</th>
              </tr>
            </thead>
            <tbody>
              {initialOI.map((o, idx) => {
                let badgeClass = '';
                if (o.oi_price_divergence === 'BULLISH_CONFIRMATION') badgeClass = 'badge-bull';
                else if (o.oi_price_divergence === 'BEARISH_DIVERGENCE') badgeClass = 'badge-bear';
                return (
                  <tr key={idx} style={{ borderBottom: 'var(--border-hairline)' }}>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => onOpenChart(`BINANCE:${o.symbol}`)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 'bold' }}>
                        {o.pair} ↗
                      </button>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      ${(o.open_interest_usd / 1e6).toFixed(2)}M
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: o.oi_change_1h_pct > 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                      {o.oi_change_1h_pct > 0 ? '+' : ''}{o.oi_change_1h_pct}%
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      ${Number(o.price || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span className={`badge ${badgeClass}`} style={{ fontWeight: 'bold' }}>
                        {o.oi_price_divergence}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === 'ls' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {initialLS.map((ls, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 140px', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{ls.pair}</div>
                <div style={{ height: '24px', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', overflow: 'hidden', border: 'var(--border-hairline)' }}>
                  <div style={{ width: `${ls.long_pct * 100}%`, background: 'rgba(0, 208, 132, 0.85)', color: '#fff', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(ls.long_pct * 100).toFixed(1)}% Long
                  </div>
                  <div style={{ width: `${ls.short_pct * 100}%`, background: 'rgba(239, 68, 68, 0.85)', color: '#fff', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(ls.short_pct * 100).toFixed(1)}% Short
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{ls.long_short_ratio}x</span>
                  <span className={`badge ${ls.bias === 'LONG_HEAVY' ? 'badge-bull' : ls.bias === 'SHORT_HEAVY' ? 'badge-bear' : ''}`} style={{ fontWeight: 'bold' }}>
                    {ls.bias}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'liquidations' && (
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <strong style={{ fontSize: '14px' }}>📡 STREAM FORCED LIQUIDATIONS BINANCE (REAL-TIME)</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Posisi margin trader yang terlikuidasi otomatis detik ini</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--accent-rust)', fontFamily: 'var(--font-mono)' }}>
                Largest 24h: ${(initialLiq.largest_single || 0).toLocaleString()}
              </div>
            </div>

            {liveLiquidations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {liveLiquidations.map((liq, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-xs)',
                    background: liq.isNew ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-panel-subtle)',
                    border: liq.isNew ? '1px solid var(--accent-rust)' : 'var(--border-hairline)',
                    fontSize: '12px',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{liq.timestamp}</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{liq.pair}</span>
                      <span className={`badge ${liq.side === 'SELL' ? 'badge-bear' : 'badge-bull'}`} style={{ fontWeight: 'bold' }}>
                        {liq.side === 'SELL' ? 'LONG LIQUIDATED 💀' : 'SHORT LIQUIDATED 💥'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>@{liq.price.toLocaleString()}</span>
                      <strong style={{ color: liq.side === 'SELL' ? 'var(--accent-rust)' : 'var(--accent-green)', fontSize: '13px' }}>
                        ${liq.usd_value.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px', background: 'var(--bg-panel-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>📡 Menunggu event likuidasi baru dari Binance WebSocket...</div>
                <div style={{ fontSize: '11px' }}>Setiap kali ada posisi futures trader yang terkena margin call di Binance, data akan langsung muncul di sini secara instan.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
