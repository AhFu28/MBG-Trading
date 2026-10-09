import React, { useState, useEffect, useMemo } from 'react';
import { bumpAchievement } from '../services/achievements.js';

export default function PersonalWatchlistTab({ 
  allStocks = [], 
  onSelectTicker, 
  onOpenChart, 
  onOpenLotCalc,
  onNavigateTab,
  data, 
  allIdxStocks = [], 
  allCryptoSpot = [], 
  livePrices = {} 
}) {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('mbg_user_watchlist');
      return saved ? JSON.parse(saved) : ['BBRI', 'ASII', 'TLKM', 'MEDC', 'BTCUSDT'];
    } catch (e) {
      return ['BBRI', 'ASII', 'TLKM', 'MEDC', 'BTCUSDT'];
    }
  });

  const [inputTicker, setInputTicker] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('mbg_user_watchlist', JSON.stringify(watchlist));
    } catch (e) {
      console.error('Failed to save watchlist to localStorage:', e);
    }
    bumpAchievement('watchlistCount', watchlist.length, { absolute: true });
  }, [watchlist]);

  const handleAddTicker = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const clean = inputTicker.trim().toUpperCase().replace('$', '').replace('.JK', '');
    if (!clean) return;
    if (watchlist.includes(clean)) {
      setErrorMessage('Ticker sudah ada di Watchlist!');
      return;
    }
    setWatchlist(prev => [clean, ...prev]);
    setInputTicker('');
    setErrorMessage('');
  };

  const handleRemoveTicker = (tickerToRemove) => {
    setWatchlist(prev => prev.filter(t => t !== tickerToRemove));
  };

  const effectiveStocks = useMemo(() => {
    if (allStocks && allStocks.length > 0) return allStocks;
    const list = [];
    if (data?.daily_trade_plans) {
      data.daily_trade_plans.forEach(p => list.push({
        ticker: p.ticker,
        market: p.market || 'IDX',
        price: p.current_price || p.entry_price,
        changePct: p.change_pct !== undefined ? p.change_pct : 0,
        signal: p.action || 'SWING_PLAN',
        entry: p.entry_price,
        stopLoss: p.stop_loss,
        target1: p.target_1 || p.take_profit_1
      }));
    }
    if (data?.crypto_spot_10) {
      data.crypto_spot_10.forEach(c => list.push({
        ticker: c.pair,
        pair: c.pair,
        market: 'CRYPTO',
        price: c.current_price || c.entry_price,
        changePct: c.change_24h_pct !== undefined ? c.change_24h_pct : 0,
        signal: c.setup_type || 'SPOT_LONG',
        entry: c.entry_price,
        stopLoss: c.stop_loss,
        target1: c.take_profit_1
      }));
    }
    if (data?.conglomerates) {
      Object.values(data.conglomerates).forEach(arr => {
        if (Array.isArray(arr)) {
          arr.forEach(s => {
            if (s.ticker) {
              list.push({
                ticker: s.ticker,
                market: 'IDX',
                price: s.price || s.current_price,
                changePct: s.change_pct !== undefined ? s.change_pct : 0,
                signal: s.technical_signal || 'CONGLOMERATE',
                entry: s.price || s.current_price,
                stopLoss: Math.round(Number(s.price || s.current_price || 0) * 0.95),
                target1: Math.round(Number(s.price || s.current_price || 0) * 1.10)
              });
            }
          });
        }
      });
    }
    if (data?.dividend_hunters) {
      data.dividend_hunters.forEach(d => {
        if (d.ticker) {
          list.push({
            ticker: d.ticker,
            market: 'IDX',
            price: d.price || d.current_price,
            changePct: d.change_pct !== undefined ? d.change_pct : 0,
            signal: d.technical_signal || 'DIVIDEND_HUNTER',
            entry: d.price || d.current_price,
            stopLoss: d.sl || Math.round(Number(d.price || 0) * 0.95),
            target1: Math.round(Number(d.price || 0) * 1.08)
          });
        }
      });
    }
    const flowItems = [
      ...(data?.foreign_flow?.top_inflow || []),
      ...(data?.foreign_flow?.top_outflow || []),
      ...(data?.foreign_flow?.top_inflow_today || []),
      ...(data?.foreign_flow?.top_outflow_today || [])
    ];
    flowItems.forEach(f => {
      if (f.ticker) {
        list.push({
          ticker: f.ticker,
          market: 'IDX',
          price: f.price || f.current_price,
          changePct: f.change_pct !== undefined ? f.change_pct : 0,
          signal: f.technical_signal || 'FOREIGN_FLOW',
          entry: f.price || f.current_price,
          stopLoss: Math.round(Number(f.price || 0) * 0.95),
          target1: Math.round(Number(f.price || 0) * 1.08)
        });
      }
    });
    if (allIdxStocks && allIdxStocks.length > 0) {
      allIdxStocks.forEach(s => list.push({
        ticker: s.ticker,
        market: 'IDX',
        price: s.price,
        changePct: s.changePct,
        signal: 'IDX_EQUITY',
        entry: s.price,
        stopLoss: Math.round(Number(s.price || 0) * 0.95),
        target1: Math.round(Number(s.price || 0) * 1.08)
      }));
    }
    if (allCryptoSpot && allCryptoSpot.length > 0) {
      allCryptoSpot.forEach(c => list.push({
        ticker: c.pair || c.symbol,
        pair: c.pair || c.symbol,
        market: 'CRYPTO',
        price: c.price,
        changePct: c.change_24h_pct !== undefined ? c.change_24h_pct : (c.changePct || 0),
        signal: 'CRYPTO_SPOT'
      }));
    }
    return list;
  }, [allStocks, data, allIdxStocks, allCryptoSpot]);

  const watchlistItems = watchlist.map(ticker => {
    const cleanTicker = ticker.replace('/', '').toUpperCase();
    const found = effectiveStocks.find(s => {
      const sTicker = (s.ticker || '').replace('/', '').toUpperCase();
      const sPair = (s.pair || '').replace('/', '').toUpperCase();
      const sClean = (s.clean_ticker || '').replace('/', '').toUpperCase();
      return sTicker === cleanTicker || sPair === cleanTicker || sClean === cleanTicker;
    });

    const liveQuote = livePrices?.[cleanTicker] || 
                      livePrices?.[`IDX:${cleanTicker}`] || 
                      livePrices?.[`${cleanTicker}USDT`] || 
                      livePrices?.[`${cleanTicker}/USDT`];

    const isCrypto = ticker.includes('USDT') || (found && found.market === 'CRYPTO');
    const market = found?.market || (isCrypto ? 'CRYPTO' : 'IDX');

    const price = liveQuote?.price !== undefined 
      ? liveQuote.price 
      : (found?.price || found?.current_price || '-');

    const changePct = liveQuote?.changePct !== undefined 
      ? liveQuote.changePct 
      : (found?.changePct !== undefined 
          ? found.changePct 
          : (found?.change_pct !== undefined 
              ? found.change_pct 
              : (found?.change_24h_pct !== undefined ? found.change_24h_pct : 0)));

    return {
      ticker,
      market,
      price,
      changePct,
      signal: found?.signal || found?.technical_signal || (liveQuote ? 'LIVE' : 'MONITORED'),
      entry: found?.entry || found?.entry_price || '-',
      stopLoss: found?.stopLoss || found?.stop_loss || '-',
      target1: found?.target1 || found?.target_1 || found?.take_profit_1 || '-'
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Input Toolbar */}
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
        <form onSubmit={handleAddTicker} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>
            + TAMBAH EMITEN / PAIR:
          </span>
          <input
            type='text'
            placeholder='Contoh: BREN, ADRO, ETHUSDT...'
            value={inputTicker}
            onChange={e => {
              setInputTicker(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            style={{
              padding: '6px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              border: 'var(--border-muted)',
              background: 'var(--bg-canvas)',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              outline: 'none',
              width: '220px'
            }}
          />
          <button
            type='submit'
            className='telemetry-btn active'
            style={{ padding: '6px 12px', fontSize: '11px' }}
          >
            + SIMPAN
          </button>
          {errorMessage && (
            <span style={{ fontSize: '11px', color: '#ff3b30' }}>
              {errorMessage}
            </span>
          )}
        </form>

        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          💾 TERSIMPAN OTOMATIS DI BROWSER LOCALSTORAGE · {watchlist.length} TIKER
        </div>
      </div>

      {/* Watchlist Table */}
      <div style={{ overflowX: 'auto', background: 'var(--bg-panel)', border: 'var(--border-muted)' }}>
        <table className='telemetry-table' style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>#</th>
              <th>Ticker</th>
              <th>Market</th>
              <th>Status</th>
              <th>Harga</th>
              <th>Chg %</th>
              <th>Entry Ref</th>
              <th>SL Ref</th>
              <th>TP1 Ref</th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {watchlistItems.length === 0 ? (
              <tr>
                <td colSpan='10' style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Watchlist Anda masih kosong. Masukkan kode saham atau pair crypto di atas untuk mulai memantau!
                </td>
              </tr>
            ) : (
              watchlistItems.map((item, idx) => (
                <tr key={item.ticker}>
                  <td style={{ textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>
                    {idx + 1}
                  </td>
                  <td style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>
                    ${item.ticker}
                  </td>
                  <td>
                    <span className='badge' style={{
                      fontSize: '9px',
                      background: item.market === 'IDX' ? 'var(--bg-panel-subtle)' : '#fff8e1',
                      color: 'var(--text-primary)'
                    }}>
                      {item.market}
                    </span>
                  </td>
                  <td>
                    <span className='badge badge-blue' style={{ fontSize: '9px' }}>
                      {item.signal}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                    {item.price !== '-' ? (
                      item.market === 'IDX' ? ('Rp ' + Number(item.price).toLocaleString()) : ('$' + item.price)
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td style={{
                    fontWeight: '700',
                    color: Number(item.changePct) >= 0 ? '#34c759' : '#ff3b30'
                  }}>
                    {Number(item.changePct) >= 0 ? '+' + item.changePct + '%' : item.changePct + '%'}
                  </td>
                  <td>
                    <code>{item.entry !== '-' ? (item.market === 'IDX' ? ('Rp ' + Number(item.entry).toLocaleString()) : ('$' + item.entry)) : '-'}</code>
                  </td>
                  <td style={{ color: '#ff3b30' }}>
                    <code>{item.stopLoss !== '-' ? (item.market === 'IDX' ? ('Rp ' + Number(item.stopLoss).toLocaleString()) : ('$' + item.stopLoss)) : '-'}</code>
                  </td>
                  <td style={{ color: '#34c759' }}>
                    <code>{item.target1 !== '-' ? (item.market === 'IDX' ? ('Rp ' + Number(item.target1).toLocaleString()) : ('$' + item.target1)) : '-'}</code>
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      className='telemetry-btn'
                      onClick={() => (onSelectTicker || onOpenChart)?.(item.ticker, item.market)}
                      style={{ padding: '3px 8px', fontSize: '10px', marginRight: '6px' }}
                    >
                      📈 CHART
                    </button>
                    <button
                      className='telemetry-btn'
                      onClick={() => handleRemoveTicker(item.ticker)}
                      style={{ padding: '3px 8px', fontSize: '10px', color: '#ff3b30', borderColor: '#ff3b30' }}
                      title='Hapus dari Watchlist'
                    >
                      ✕ HAPUS
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}