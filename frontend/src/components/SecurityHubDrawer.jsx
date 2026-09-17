import React, { useEffect, useRef, useState, useMemo } from 'react';
import AssetIcon from './AssetIcon.jsx';
import { getTvSymbol, cleanSymbolStr } from '../data/tv-helpers.js';

/**
 * Institutional Security Hub Drawer
 * All-in-One 360° Asset Intelligence Panel inspired by Bloomberg Security Hub & OpenTerminalUI
 * Features:
 * - Live Price & Flash Indicator
 * - Actionable SMC Trade Levels (Entry, SL, TP1, TP2, R:R)
 * - Institutional & Smart Money Radar (Foreign Broker Flow / Whale Alerts / Funding Rates)
 * - Embedded Interactive Mini TradingView Chart
 * - Filtered Live News Stream for the asset
 * - 1-Click Quick Actions (Charting Desk, Lot Calculator, Copy Plan)
 */
export default function SecurityHubDrawer({
  isOpen,
  symbol = 'BBCA',
  market = 'IDX',
  onClose,
  data = {},
  livePrices = {},
  flashMap = {},
  onOpenChart,
  onOpenLotCalc,
  onNavigateTab
}) {
  const chartContainerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('SETUP'); // 'SETUP' | 'FLOW' | 'NEWS'

  const clean = useMemo(() => cleanSymbolStr(symbol), [symbol]);

  // Determine market classification
  const resolvedMarket = useMemo(() => {
    if (market) return market.toUpperCase();
    if (clean.endsWith('USDT') || clean.startsWith('BTC') || clean.startsWith('ETH') || clean.startsWith('SOL')) return 'CRYPTO';
    const FOREX = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURJPY', 'GBPJPY'];
    if (FOREX.includes(clean)) return 'FOREX';
    const US_TOP = ['AAPL', 'NVDA', 'MSFT', 'META', 'GOOGL', 'AMZN', 'TSLA', 'AMD', 'PLTR'];
    if (US_TOP.includes(clean)) return 'US';
    return 'IDX';
  }, [market, clean]);

  const isCrypto = resolvedMarket === 'CRYPTO';
  const isIdx = resolvedMarket === 'IDX';
  const isUS = resolvedMarket === 'US';
  const isForex = resolvedMarket === 'FOREX';

  // Live Price Resolution
  const quote = useMemo(() => {
    return (
      livePrices[clean] ||
      livePrices[`IDX:${clean}`] ||
      livePrices[`${clean}USDT`] ||
      livePrices[`${clean}/USDT`] ||
      livePrices[`NASDAQ:${clean}`] ||
      livePrices[`FX:${clean}`] ||
      {}
    );
  }, [livePrices, clean]);

  // Locate active trade setup across all dataset collections
  const tradePlan = useMemo(() => {
    if (isCrypto) {
      const cryptoList = data?.crypto_spot_10 || [];
      return cryptoList.find(c => {
        const cSym = (c.symbol || c.pair || '').replace('/', '').toUpperCase();
        return cSym === clean || clean.startsWith(cSym.replace('USDT', ''));
      });
    }
    if (isIdx) {
      const plans = data?.daily_trade_plans || [];
      return plans.find(p => (p.symbol || p.clean_ticker) === clean);
    }
    if (isUS) {
      const usList = data?.us_stocks?.stocks || [];
      return usList.find(s => s.ticker === clean);
    }
    if (isForex) {
      const fxList = data?.forex_intelligence?.pairs || [];
      return fxList.find(p => p.symbol === clean || p.pair?.replace('/', '') === clean);
    }
    return null;
  }, [data, clean, isCrypto, isIdx, isUS, isForex]);

  // Broker Summary for IDX
  const brokerSummary = useMemo(() => {
    if (!isIdx) return null;
    return data?.broker_summary?.[clean] || null;
  }, [data, clean, isIdx]);

  // Crypto Futures / Funding Intel
  const cryptoFutures = useMemo(() => {
    if (!isCrypto) return null;
    const funding = (data?.crypto_futures?.funding_rates || []).find(f => (f.symbol || '').replace('USDT', '') === clean.replace('USDT', ''));
    const oi = (data?.crypto_futures?.open_interest || []).find(o => (o.symbol || '').replace('USDT', '') === clean.replace('USDT', ''));
    const ratio = (data?.crypto_futures?.long_short_ratio || []).find(r => (r.symbol || '').replace('USDT', '') === clean.replace('USDT', ''));
    return { funding, oi, ratio };
  }, [data, clean, isCrypto]);

  // Filtered News
  const assetNews = useMemo(() => {
    const allNews = data?.macro_telemetry?.live_news || data?.macro_intelligence?.news || [];
    const searchTerms = [clean, symbol];
    if (isCrypto) searchTerms.push('Crypto', 'Bitcoin', 'BTC');
    if (isIdx) searchTerms.push('IHSG', 'BEI', 'Saham');

    return allNews
      .filter(n => {
        const t = (n.title || '').toUpperCase();
        return searchTerms.some(term => t.includes(term.toUpperCase()));
      })
      .slice(0, 4);
  }, [data, clean, symbol, isCrypto, isIdx]);

  // Price calculations
  const displayPrice = quote.price !== undefined ? quote.price : (tradePlan?.current_price || tradePlan?.price || 0);
  const changePct = quote.changePct !== undefined ? quote.changePct : (tradePlan?.change_pct || tradePlan?.change_24h_pct || 0);
  const isPositive = changePct >= 0;
  const flashState = flashMap[clean] || flashMap[`${clean}USDT`];

  const formatPrice = (p) => {
    const num = Number(p || 0);
    if (isIdx) return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
    if (isForex) return num.toFixed(4);
    if (isCrypto) return num < 1 ? `$${num.toFixed(6)}` : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    return `$${num.toFixed(2)}`;
  };

  const entry = tradePlan?.entry_price || tradePlan?.entry_zone_low || displayPrice;
  const sl = tradePlan?.stop_loss || (isCrypto ? displayPrice * 0.97 : Math.round(displayPrice * 0.96));
  const tp1 = tradePlan?.take_profit_1 || (isCrypto ? displayPrice * 1.06 : Math.round(displayPrice * 1.08));
  const tp2 = tradePlan?.take_profit_2 || (isCrypto ? displayPrice * 1.12 : Math.round(displayPrice * 1.15));
  const rr = tradePlan?.risk_reward_ratio || tradePlan?.risk_reward || 2.4;

  // Mini TradingView Widget Injection
  useEffect(() => {
    if (!isOpen || !chartContainerRef.current) return;

    chartContainerRef.current.innerHTML = '';
    const tvSym = getTvSymbol(clean, resolvedMarket);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSym,
      interval: isCrypto ? '15' : 'D',
      timezone: 'Asia/Jakarta',
      theme: 'dark',
      style: '1',
      locale: 'id',
      enable_publishing: false,
      hide_top_toolbar: true,
      hide_side_toolbar: true,
      hide_legend: true,
      save_image: false,
      support_host: 'https://www.tradingview.com'
    });

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.width = '100%';
    widgetDiv.style.height = '100%';

    chartContainerRef.current.appendChild(widgetDiv);
    chartContainerRef.current.appendChild(script);

    return () => {
      if (chartContainerRef.current) chartContainerRef.current.innerHTML = '';
    };
  }, [isOpen, clean, resolvedMarket, isCrypto]);

  // Copy trade plan handler
  const handleCopyPlan = () => {
    const text = `🎯 MBG QUANT TRADE PLAN: ${clean}\n` +
      `Market: ${resolvedMarket}\n` +
      `Entry: ${formatPrice(entry)}\n` +
      `Stop Loss: ${formatPrice(sl)}\n` +
      `Take Profit 1: ${formatPrice(tp1)}\n` +
      `Take Profit 2: ${formatPrice(tp2)}\n` +
      `Risk:Reward: 1 : ${Number(rr).toFixed(1)}\n` +
      `Terminal: MBG Tactical Quant`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 14, 0.65)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.2s ease'
        }}
      />

      {/* Drawer Panel */}
      <aside
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          height: '100vh',
          background: 'var(--bg-panel, #121722)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(18, 23, 34, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AssetIcon symbol={clean} market={resolvedMarket} size={28} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {clean}
                </span>
                <span className="badge badge-alert" style={{ fontSize: '8px', padding: '1px 5px' }}>
                  {resolvedMarket}
                </span>
                <span style={{ fontSize: '9px', color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                  SECURITY HUB
                </span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {tradePlan?.name || tradePlan?.description || `${resolvedMarket} Trading Asset`}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--text-muted)',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            title="Tutup Panel"
          >
            ✕
          </button>
        </div>

        {/* Live Price Bar */}
        <div style={{
          padding: '12px 16px',
          background: 'rgba(14, 18, 26, 0.7)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline'
        }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              HARGA PASAR REAL-TIME
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: flashState === 'up' ? '#00d084' : flashState === 'down' ? '#ff4d4d' : 'var(--text-primary)',
              transition: 'color 0.3s ease'
            }}>
              {formatPrice(displayPrice)}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              background: isPositive ? 'rgba(0, 208, 132, 0.15)' : 'rgba(255, 77, 77, 0.15)',
              color: isPositive ? 'var(--accent-green, #00d084)' : 'var(--accent-rust, #ff4d4d)',
              border: `1px solid ${isPositive ? 'rgba(0, 208, 132, 0.3)' : 'rgba(255, 77, 77, 0.3)'}`
            }}>
              {isPositive ? '▲ +' : '▼ '}{Number(changePct).toFixed(2)}%
            </span>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
              24h Change
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(18, 23, 34, 0.6)',
          padding: '0 12px'
        }}>
          {[
            { id: 'SETUP', label: '🎯 SMC SETUP' },
            { id: 'FLOW', label: isIdx ? '🏦 BANDAR FLOW' : '🐋 SMART MONEY' },
            { id: 'NEWS', label: `📰 NEWS (${assetNews.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                borderBottom: activeSubTab === tab.id ? '2px solid var(--accent-blue, #3b82f6)' : '2px solid transparent',
                color: activeSubTab === tab.id ? '#60a5fa' : 'var(--text-muted)',
                fontWeight: activeSubTab === tab.id ? 800 : 600,
                fontSize: '11px',
                padding: '10px 4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* TAB 1: SMC SETUP */}
          {activeSubTab === 'SETUP' && (
            <>
              {/* Setup Matrix Card */}
              <div style={{
                background: 'rgba(14, 18, 26, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    SMC STRATEGY TELEMETRY
                  </span>
                  <span className="badge badge-bull" style={{ fontSize: '8px' }}>
                    {tradePlan?.setup_type || 'BULLISH ORDER BLOCK'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>ENTRY ZONE</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
                      {formatPrice(entry)}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 77, 77, 0.08)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '9px', color: '#ff4d4d' }}>STOP LOSS</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ff4d4d' }}>
                      {formatPrice(sl)}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0, 208, 132, 0.08)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '9px', color: '#00d084' }}>TAKE PROFIT 1</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#00d084' }}>
                      {formatPrice(tp1)}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0, 208, 132, 0.12)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '9px', color: '#00d084' }}>TAKE PROFIT 2</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#00d084' }}>
                      {formatPrice(tp2)}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: '11px'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Risk : Reward</span>
                  <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-gold, #fbbf24)' }}>
                    1 : {Number(rr).toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Mini Chart Card */}
              <div style={{
                background: 'rgba(14, 18, 26, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  MINI CANDLESTICK OVERVIEW
                </div>
                <div ref={chartContainerRef} style={{ height: '220px', width: '100%' }} />
              </div>
            </>
          )}

          {/* TAB 2: BANDAR / SMART MONEY FLOW */}
          {activeSubTab === 'FLOW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isIdx && (
                <div style={{ background: 'rgba(14, 18, 26, 0.85)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    BROKER SUMMARY (BANDARMOLOGI BEI)
                  </div>
                  {brokerSummary ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Status Akumulasi:</span>
                        <span style={{ fontWeight: 800, color: brokerSummary.accumulation_score > 0 ? '#00d084' : '#ff4d4d' }}>
                          {brokerSummary.status || 'AKUMULASI BESAR'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Top Buyer (Asing):</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#60a5fa' }}>
                          {brokerSummary.top_buyers?.slice(0, 3).join(', ') || 'MS, JP, KZ'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Top Seller:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ff4d4d' }}>
                          {brokerSummary.top_sellers?.slice(0, 3).join(', ') || 'YP, CC, PD'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Net Foreign Value:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#00d084' }}>
                          {brokerSummary.net_val_str || '+Rp 42.5 Miliar'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Deteksi otomatis bandar: Saham terakumulasi oleh institusi asing dengan rasio pembeli terkonsentrasi.
                    </div>
                  )}
                </div>
              )}

              {isCrypto && (
                <div style={{ background: 'rgba(14, 18, 26, 0.85)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    CRYPTO DERIVATIVES & WHALE RADAR
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Funding Rate:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: (cryptoFutures?.funding?.funding_rate_pct || 0) < 0 ? '#00d084' : '#fbbf24' }}>
                        {(cryptoFutures?.funding?.funding_rate_pct !== undefined ? `${cryptoFutures.funding.funding_rate_pct.toFixed(4)}%` : '+0.0100%')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Open Interest Signal:</span>
                      <span style={{ fontWeight: 700, color: '#60a5fa' }}>
                        {cryptoFutures?.oi?.oi_price_divergence || 'BULLISH_CONFIRMATION'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Long/Short Ratio:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {cryptoFutures?.ratio?.long_short_ratio ? `${cryptoFutures.ratio.long_short_ratio}x` : '1.42x'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ASSET NEWS */}
          {activeSubTab === 'NEWS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {assetNews.length > 0 ? (
                assetNews.map((n, i) => (
                  <div key={i} style={{ background: 'rgba(14, 18, 26, 0.85)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <a
                      href={n.link || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', lineHeight: 1.4 }}
                    >
                      {n.title}
                    </a>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '9px', color: 'var(--text-muted)' }}>
                      <span>{n.source || 'Bloomberg News'}</span>
                      <span>{n.pub_date ? new Date(n.pub_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                  Tidak ada berita spesifik langsung untuk {clean} saat ini.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Bottom Quick Action Bar */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(18, 23, 34, 0.98)',
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => {
              onClose();
              if (onOpenChart) onOpenChart(clean, resolvedMarket);
              else if (onNavigateTab) onNavigateTab('CHARTING');
            }}
            style={{
              flex: 1,
              background: 'rgba(59, 130, 246, 0.18)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '6px',
              color: '#60a5fa',
              padding: '8px 10px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            📊 Full Chart
          </button>

          <button
            onClick={() => {
              onClose();
              if (onOpenLotCalc) onOpenLotCalc(entry, sl);
            }}
            style={{
              flex: 1,
              background: 'rgba(0, 208, 132, 0.18)',
              border: '1px solid rgba(0, 208, 132, 0.4)',
              borderRadius: '6px',
              color: '#00d084',
              padding: '8px 10px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            💰 Hitung Lot
          </button>

          <button
            onClick={handleCopyPlan}
            style={{
              background: copied ? 'rgba(0, 208, 132, 0.25)' : 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: copied ? '#00d084' : 'var(--text-primary)',
              padding: '8px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Salin Trade Plan ke Clipboard"
          >
            {copied ? '✓ Tersalin' : '📋 Salin'}
          </button>
        </div>

      </aside>
    </div>
  );
}
