import React, { useState, useEffect, useRef, useMemo } from 'react';

// Pool data emiten liquid IDX untuk generator running trade real-time
const IDX_TICKERS = [
  { symbol: 'BBCA', name: 'Bank Central Asia', basePrice: 6375, tick: 25, changePct: -0.39 },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia', basePrice: 3340, tick: 10, changePct: 0.60 },
  { symbol: 'BMRI', name: 'Bank Mandiri', basePrice: 4300, tick: 25, changePct: -0.92 },
  { symbol: 'BBNI', name: 'Bank Negara Indonesia', basePrice: 4380, tick: 20, changePct: -0.45 },
  { symbol: 'BREN', name: 'Barito Renewables', basePrice: 8975, tick: 25, changePct: 1.12 },
  { symbol: 'AMMN', name: 'Amman Mineral', basePrice: 5150, tick: 25, changePct: 1.98 },
  { symbol: 'ASII', name: 'Astra International', basePrice: 4880, tick: 10, changePct: -0.20 },
  { symbol: 'TLKM', name: 'Telkom Indonesia', basePrice: 2670, tick: 10, changePct: -1.11 },
  { symbol: 'LSIP', name: 'PP London Sumatra', basePrice: 1725, tick: 5, changePct: 2.37 },
  { symbol: 'UNTR', name: 'United Tractors', basePrice: 26800, tick: 50, changePct: 0.94 },
  { symbol: 'ICBP', name: 'Indofood CBP', basePrice: 11450, tick: 25, changePct: 0.44 },
  { symbol: 'PGAS', name: 'Perusahaan Gas Negara', basePrice: 1545, tick: 5, changePct: 2.32 },
  { symbol: 'ADRO', name: 'Adaro Energy', basePrice: 3680, tick: 10, changePct: 1.66 },
  { symbol: 'MEDC', name: 'Medco Energi', basePrice: 1320, tick: 5, changePct: 3.12 },
  { symbol: 'PTBA', name: 'Bukit Asam', basePrice: 2690, tick: 10, changePct: 0.74 },
  { symbol: 'BRMS', name: 'Bumi Resources Minerals', basePrice: 398, tick: 2, changePct: 3.12 },
  { symbol: 'CPIN', name: 'Charoen Pokphand', basePrice: 5125, tick: 25, changePct: -0.49 },
  { symbol: 'KLBF', name: 'Kalbe Farma', basePrice: 1675, tick: 5, changePct: 0.60 },
  { symbol: 'MDKA', name: 'Merdeka Copper Gold', basePrice: 2340, tick: 10, changePct: 1.74 },
  { symbol: 'ANTM', name: 'Aneka Tambang', basePrice: 1530, tick: 5, changePct: 1.34 },
  { symbol: 'CUAN', name: 'Petrindo Jaya Kreasi', basePrice: 7150, tick: 25, changePct: 2.14 },
  { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia', basePrice: 56, tick: 1, changePct: 0.00 }
];

const FOREIGN_BROKERS = ['AK', 'BK', 'CS', 'KZ', 'RX', 'CG', 'MS', 'JP'];
const DOMESTIC_INSTITUTION = ['CC', 'NI', 'SQ', 'OD', 'LG', 'AZ'];
const DOMESTIC_RETAIL = ['YP', 'PD', 'XC', 'XC', 'YP', 'PD'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateInitialTrades(count = 25) {
  const trades = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const tTime = new Date(now.getTime() - (count - i) * getRandomInt(1200, 3500));
    const emiten = getRandomItem(IDX_TICKERS);
    const isBuy = Math.random() > 0.45; // 55% buy bias
    
    // Lot size: skew toward realistic distribution with occasional whale orders
    let lot = 0;
    const lotRoll = Math.random();
    if (lotRoll < 0.5) lot = getRandomInt(10, 180);
    else if (lotRoll < 0.8) lot = getRandomInt(200, 750);
    else if (lotRoll < 0.95) lot = getRandomInt(800, 2500);
    else lot = getRandomInt(3000, 12500); // Whale trade

    const price = emiten.basePrice;
    const valueIdr = lot * 100 * price;

    const buyerBroker = isBuy ? getRandomItem([...FOREIGN_BROKERS, ...DOMESTIC_INSTITUTION]) : getRandomItem(DOMESTIC_RETAIL);
    const sellerBroker = isBuy ? getRandomItem(DOMESTIC_RETAIL) : getRandomItem([...FOREIGN_BROKERS, ...DOMESTIC_INSTITUTION]);

    trades.unshift({
      id: `trade-${Date.now()}-${i}`,
      time: tTime.toLocaleTimeString('id-ID', { hour12: false }),
      symbol: emiten.symbol,
      companyName: emiten.name,
      action: isBuy ? 'BUY' : 'SELL',
      price: price,
      changePct: emiten.changePct,
      lot: lot,
      valueIdr: valueIdr,
      buyer: buyerBroker,
      buyerType: FOREIGN_BROKERS.includes(buyerBroker) ? 'F' : 'D',
      seller: sellerBroker,
      sellerType: FOREIGN_BROKERS.includes(sellerBroker) ? 'F' : 'D',
      isWhale: lot >= 500,
      isMegaWhale: lot >= 1000,
      isNew: false
    });
  }
  return trades;
}

export default function RunningTradeWidget({ onSelectTicker, embedded = false, livePrices = {} }) {
  const [trades, setTrades] = useState(() => generateInitialTrades(30));
  const [isPaused, setIsPaused] = useState(false);
  const [minLotFilter, setMinLotFilter] = useState(0); // 0, 100, 500, 1000
  const [actionFilter, setActionFilter] = useState('ALL'); // 'ALL' | 'BUY' | 'SELL'
  const [searchTicker, setSearchTicker] = useState('');
  const [tradeCount, setTradeCount] = useState(0);
  const timerRef = useRef(null);
  const livePricesRef = useRef(livePrices);

  useEffect(() => {
    livePricesRef.current = livePrices;
  }, [livePrices]);

  // Live real-time tick engine
  useEffect(() => {
    if (isPaused) return;

    function scheduleNextTick() {
      const delay = getRandomInt(800, 2200); // interval realistis antara 0.8s s/d 2.2s
      timerRef.current = setTimeout(() => {
        const emiten = getRandomItem(IDX_TICKERS);
        const live = livePricesRef.current[emiten.symbol] || livePricesRef.current[`IDX:${emiten.symbol}`];
        const isBuy = Math.random() > 0.44;
        
        let lot = 0;
        const roll = Math.random();
        if (roll < 0.52) lot = getRandomInt(15, 220);
        else if (roll < 0.82) lot = getRandomInt(250, 700);
        else if (roll < 0.96) lot = getRandomInt(800, 2800);
        else lot = getRandomInt(3200, 15000); // Whale burst

        const price = live?.price || emiten.basePrice;
        const changePct = live?.changePct !== undefined ? live.changePct : emiten.changePct;
        const valueIdr = lot * 100 * price;
        const buyerBroker = isBuy ? getRandomItem([...FOREIGN_BROKERS, ...DOMESTIC_INSTITUTION]) : getRandomItem(DOMESTIC_RETAIL);
        const sellerBroker = isBuy ? getRandomItem(DOMESTIC_RETAIL) : getRandomItem([...FOREIGN_BROKERS, ...DOMESTIC_INSTITUTION]);

        const newTrade = {
          id: `trade-${Date.now()}-${Math.random()}`,
          time: new Date().toLocaleTimeString('id-ID', { hour12: false }),
          symbol: emiten.symbol,
          companyName: emiten.name,
          action: isBuy ? 'BUY' : 'SELL',
          price: price,
          changePct: changePct,
          lot: lot,
          valueIdr: valueIdr,
          buyer: buyerBroker,
          buyerType: FOREIGN_BROKERS.includes(buyerBroker) ? 'F' : 'D',
          seller: sellerBroker,
          sellerType: FOREIGN_BROKERS.includes(sellerBroker) ? 'F' : 'D',
          isWhale: lot >= 500,
          isMegaWhale: lot >= 1000,
          isNew: true
        };

        setTrades(prev => [newTrade, ...prev.map(t => ({ ...t, isNew: false }))].slice(0, 60));
        setTradeCount(c => c + 1);

        scheduleNextTick();
      }, delay);
    }

    scheduleNextTick();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused]);

  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      const matchLot = t.lot >= minLotFilter;
      const matchAction = actionFilter === 'ALL' || t.action === actionFilter;
      const matchSearch = !searchTicker || t.symbol.toLowerCase().includes(searchTicker.toLowerCase());
      return matchLot && matchAction && matchSearch;
    });
  }, [trades, minLotFilter, actionFilter, searchTicker]);

  const formatValue = (idr) => {
    if (idr >= 1e9) {
      return `Rp ${(idr / 1e9).toFixed(2)} M`;
    }
    return `Rp ${(idr / 1e6).toFixed(1)} Jt`;
  };

  return (
    <div className="quant-card" style={{ padding: embedded ? '10px' : '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* 1. Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(0, 208, 132, 0.15)',
            border: '1px solid rgba(0, 208, 132, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px'
          }}>
            ⚡
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                RUNNING TRADE LIVE BEI
              </span>
              <span style={{
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: isPaused ? 'rgba(234, 179, 8, 0.15)' : 'rgba(0, 208, 132, 0.15)',
                color: isPaused ? 'var(--accent-gold)' : 'var(--accent-green)',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)'
              }}>
                {isPaused ? 'STREAM PAUSED' : 'LIVE STREAM'}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Stockbit-Style Streaming Trade &bull; Filter Lot Paus &bull; Kode Broker Buyer & Seller
            </div>
          </div>
        </div>

        {/* Live Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Pause / Play button */}
          <button
            onClick={() => setIsPaused(p => !p)}
            className="telemetry-btn"
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '700',
              background: isPaused ? 'rgba(0, 208, 132, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: isPaused ? 'var(--accent-green)' : 'var(--text-primary)',
              borderColor: isPaused ? 'var(--accent-green)' : 'var(--border-hairline)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title={isPaused ? 'Lanjutkan stream running trade' : 'Jeda stream sementara'}
          >
            <span>{isPaused ? '▶️ RESUME' : '⏸️ PAUSE'}</span>
          </button>

          {/* Search Box */}
          <input
            type="text"
            placeholder="Cari emiten..."
            value={searchTicker}
            onChange={(e) => setSearchTicker(e.target.value)}
            className="quant-input"
            style={{ width: '120px', padding: '4px 8px', fontSize: '11px' }}
          />
        </div>
      </div>

      {/* 2. Filter Pills Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: 'var(--border-hairline)', paddingTop: '8px' }}>
        
        {/* Min Lot Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>LOT:</span>
          <div className="quant-pill-nav" style={{ margin: 0 }}>
            {[
              { val: 0, label: 'SEMUA' },
              { val: 100, label: '≥ 100' },
              { val: 500, label: '🐋 ≥ 500' },
              { val: 1000, label: '🚨 ≥ 1.000 (MEGA)' }
            ].map(f => (
              <button
                key={f.val}
                onClick={() => setMinLotFilter(f.val)}
                className={`quant-pill-btn ${minLotFilter === f.val ? 'active' : ''}`}
                style={{ fontSize: '10px', padding: '3px 7px' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Filter (Buy/Sell/All) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AKSI:</span>
          <div className="quant-pill-nav" style={{ margin: 0 }}>
            {[
              { val: 'ALL', label: 'SEMUA' },
              { val: 'BUY', label: '🟢 BUY (HAKA)' },
              { val: 'SELL', label: '🔴 SELL (HAKI)' }
            ].map(a => (
              <button
                key={a.val}
                onClick={() => setActionFilter(a.val)}
                className={`quant-pill-btn ${actionFilter === a.val ? 'active' : ''}`}
                style={{ fontSize: '10px', padding: '3px 7px' }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Streaming Table */}
      <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
        <table className="quant-table" style={{ fontSize: '11px', width: '100%' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 2 }}>
            <tr style={{ borderBottom: 'var(--border-muted)', textAlign: 'left' }}>
              <th style={{ padding: '7px 8px', width: '70px' }}>Waktu</th>
              <th style={{ padding: '7px 8px', width: '95px' }}>Emiten</th>
              <th style={{ padding: '7px 8px', width: '65px', textAlign: 'center' }}>Aksi</th>
              <th style={{ padding: '7px 8px', width: '75px', textAlign: 'right' }}>Harga</th>
              <th style={{ padding: '7px 8px', width: '65px', textAlign: 'right' }}>Chg %</th>
              <th style={{ padding: '7px 8px', width: '85px', textAlign: 'right' }}>Vol (Lot)</th>
              <th style={{ padding: '7px 8px', width: '90px', textAlign: 'right' }}>Nilai IDR</th>
              <th style={{ padding: '7px 8px', width: '85px', textAlign: 'center' }}>Buyer</th>
              <th style={{ padding: '7px 8px', width: '85px', textAlign: 'center' }}>Seller</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Tidak ada transaksi yang cocok dengan filter lot.
                </td>
              </tr>
            ) : (
              filteredTrades.map(t => {
                const isBuy = t.action === 'BUY';
                const actionBg = isBuy ? 'rgba(0, 208, 132, 0.12)' : 'rgba(239, 68, 68, 0.12)';
                const actionColor = isBuy ? 'var(--accent-green)' : 'var(--accent-rust)';
                const flashStyle = t.isNew ? {
                  animation: 'pulseHighlight 1.5s ease-out',
                  background: isBuy ? 'rgba(0, 208, 132, 0.18)' : 'rgba(239, 68, 68, 0.18)'
                } : {};

                return (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom: 'var(--border-hairline)',
                      ...flashStyle,
                      transition: 'background 0.3s ease'
                    }}
                  >
                    {/* Waktu */}
                    <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {t.time}
                    </td>

                    {/* Emiten */}
                    <td style={{ padding: '7px 8px' }}>
                      <button
                        onClick={() => onSelectTicker?.(t.symbol)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent-blue)',
                          cursor: 'pointer',
                          fontWeight: '800',
                          fontSize: '12px',
                          padding: 0,
                          fontFamily: 'var(--font-mono)'
                        }}
                        title={`Buka chart ${t.symbol}`}
                      >
                        {t.symbol} ↗
                      </button>
                      {t.isMegaWhale && (
                        <span style={{ marginLeft: '4px', fontSize: '10px' }} title="Mega Whale Order (≥1,000 Lot)">
                          🚨
                        </span>
                      )}
                      {t.isWhale && !t.isMegaWhale && (
                        <span style={{ marginLeft: '4px', fontSize: '10px' }} title="Whale Order (≥500 Lot)">
                          🐋
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '800',
                        padding: '2px 5px',
                        borderRadius: '3px',
                        background: actionBg,
                        color: actionColor,
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {t.action}
                      </span>
                    </td>

                    {/* Harga */}
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {t.price.toLocaleString()}
                    </td>

                    {/* Change % */}
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', color: t.changePct >= 0 ? 'var(--accent-green)' : 'var(--accent-rust)' }}>
                      {t.changePct > 0 ? '+' : ''}{t.changePct.toFixed(2)}%
                    </td>

                    {/* Vol (Lot) */}
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: t.isWhale ? '800' : '500', color: t.isWhale ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                      {t.lot.toLocaleString()}
                    </td>

                    {/* Nilai IDR */}
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {formatValue(t.valueIdr)}
                    </td>

                    {/* Buyer Broker */}
                    <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '800',
                        color: t.buyerType === 'F' ? 'var(--accent-gold)' : 'var(--text-primary)'
                      }}>
                        {t.buyer}
                      </span>
                      <span style={{
                        fontSize: '8px',
                        marginLeft: '3px',
                        padding: '1px 3px',
                        borderRadius: '2px',
                        background: t.buyerType === 'F' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: t.buyerType === 'F' ? '#38bdf8' : 'var(--text-muted)'
                      }}>
                        {t.buyerType}
                      </span>
                    </td>

                    {/* Seller Broker */}
                    <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '800',
                        color: t.sellerType === 'F' ? 'var(--accent-gold)' : 'var(--text-primary)'
                      }}>
                        {t.seller}
                      </span>
                      <span style={{
                        fontSize: '8px',
                        marginLeft: '3px',
                        padding: '1px 3px',
                        borderRadius: '2px',
                        background: t.sellerType === 'F' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: t.sellerType === 'F' ? '#38bdf8' : 'var(--text-muted)'
                      }}>
                        {t.sellerType}
                      </span>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
