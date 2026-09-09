import React, { useState, useEffect } from 'react';

export default function PersonalWatchlistTab({ allStocks = [], onSelectTicker }) {
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

  const watchlistItems = watchlist.map(ticker => {
    const found = allStocks.find(s => s.ticker === ticker || s.pair === ticker || s.clean_ticker === ticker);
    if (found) {
      return {
        ticker,
        market: found.market || (ticker.includes('USDT') ? 'CRYPTO' : 'IDX'),
        price: found.price || found.current_price || '-',
        changePct: found.change_pct !== undefined ? found.change_pct : (found.changePct !== undefined ? found.changePct : (found.change_24h_pct !== undefined ? found.change_24h_pct : 0)),
        signal: found.signal || found.technical_signal || 'MONITORED',
        entry: found.entry || found.entry_price || '-',
        stopLoss: found.stopLoss || found.stop_loss || '-',
        target1: found.target1 || found.target_1 || found.take_profit_1 || '-'
      };
    }
    return {
      ticker,
      market: ticker.includes('USDT') ? 'CRYPTO' : 'IDX',
      price: '-',
      changePct: 0,
      signal: 'MANUAL_WATCH',
      entry: '-',
      stopLoss: '-',
      target1: '-'
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
                      onClick={() => onSelectTicker(item.ticker, item.market)}
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