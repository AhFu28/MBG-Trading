import React, { useState, useEffect } from 'react';

const VirtualForwardPortfolio = ({ dailyTradePlans = [], paperPortfolio, currentPrices = {}, onSelectTicker }) => {
  const [activeTab, setActiveTab] = useState('active'); // active, history, strategy
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [userTrades, setUserTrades] = useState([]);
  
  // Order Form State
  const [orderForm, setOrderForm] = useState({
    ticker: '',
    allocation: '',
    entryPrice: '',
    sl: '',
    tp1: ''
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedTrades = localStorage.getItem('mbg_user_paper_trades');
    if (savedTrades) {
      try {
        setUserTrades(JSON.parse(savedTrades));
      } catch (e) {
        console.error("Failed to parse user paper trades", e);
      }
    }
  }, []);

  // 1-Click Auto-Pick Top 5 AI Setups
  const handleAutoPickAI = () => {
    if (!dailyTradePlans || dailyTradePlans.length === 0) {
      alert("Belum ada Trade Plans AI yang tersedia di sistem.");
      return;
    }

    const currentTickers = new Set([
      ...(paperPortfolio?.positions || []).filter(p => p.status === 'ACTIVE' || p.status === 'PENDING').map(p => p.ticker),
      ...userTrades.filter(t => t.status === 'ACTIVE' || t.status === 'PENDING').map(t => t.ticker)
    ]);

    // Ambil top 5 plans yang belum ada di portfolio
    const eligiblePlans = dailyTradePlans
      .filter(p => {
        const sym = (p.clean_ticker || (p.symbol ? p.symbol.replace('.JK', '') : '')).toUpperCase();
        return sym && !currentTickers.has(sym);
      })
      .slice(0, 5);

    if (eligiblePlans.length === 0) {
      alert("Semua Top Setup AI hari ini sudah ada dalam portofolio Forward Paper Trading Anda.");
      return;
    }

    const defaultAllocation = 10000000; // Rp 10 Juta per emiten
    const newTrades = eligiblePlans.map((plan, idx) => {
      const sym = (plan.clean_ticker || (plan.symbol ? plan.symbol.replace('.JK', '') : `AI-${idx}`)).toUpperCase();
      const entry = plan.entry_price || plan.current_price || 1000;
      return {
        id: `ai_autopick_${Date.now()}_${sym}`,
        ticker: sym,
        strategy: plan.strategy || plan.technical_signal || 'AI Alpha Breakout',
        entryPrice: entry,
        sl: plan.stop_loss || Math.round(entry * 0.95),
        tp1: plan.target_1 || Math.round(entry * 1.08),
        allocation: defaultAllocation,
        status: 'ACTIVE',
        date: new Date().toISOString()
      };
    });

    const updated = [...userTrades, ...newTrades];
    setUserTrades(updated);
    localStorage.setItem('mbg_user_paper_trades', JSON.stringify(updated));
  };

  // Format currency
  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };
  
  // Combine bundle portfolio with user trades
  const allPositions = [...(paperPortfolio?.positions || []), ...userTrades];
  
  const activePositions = allPositions.filter(p => p.status === 'ACTIVE' || p.status === 'PENDING');
  const closedPositions = allPositions.filter(p => ['TP1_HIT', 'TP2_HIT', 'SL_HIT', 'EXPIRED', 'CLOSED'].includes(p.status));
  
  // Calculate HUD Metrics
  const initialCapital = 100000000;
  
  let realizedPnL = 0;
  let wins = 0;
  let losses = 0;
  let totalRR = 0;
  let rrCount = 0;
  
  // Basic strategy breakdown
  const strategyStats = {};

  closedPositions.forEach(p => {
    const pnl = p.realizedPnL || 0;
    realizedPnL += pnl;
    
    if (pnl > 0) {
      wins++;
    } else if (pnl < 0) {
      losses++;
    }
    
    // RR calc approximation
    if (p.entryPrice && p.sl && p.exitPrice) {
      const risk = Math.abs(p.entryPrice - p.sl);
      const reward = Math.abs(p.exitPrice - p.entryPrice);
      if (risk > 0) {
        totalRR += (reward / risk);
        rrCount++;
      }
    }
    
    const strat = p.strategy || 'Manual';
    if (!strategyStats[strat]) strategyStats[strat] = { pnl: 0, count: 0 };
    strategyStats[strat].pnl += pnl;
    strategyStats[strat].count++;
  });
  
  let unrealizedPnL = 0;
  activePositions.forEach(p => {
    const entryPriceNum = Number(p.entryPrice) || 0;
    const currentPrice = currentPrices[p.ticker] || p.currentPrice || entryPriceNum;
    const qty = (p.allocation && entryPriceNum > 0) ? Number(p.allocation) / entryPriceNum : 0;
    const currentPnL = (currentPrice - entryPriceNum) * qty;
    unrealizedPnL += currentPnL;
  });

  const currentEquity = initialCapital + realizedPnL + unrealizedPnL;
  const totalPnLPercent = ((currentEquity - initialCapital) / initialCapital) * 100;
  
  const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
  const avgRR = rrCount > 0 ? (totalRR / rrCount) : 0;

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    if (!orderForm.ticker || !orderForm.allocation || !orderForm.entryPrice) return;
    
    const newTrade = {
      id: `manual_${Date.now()}`,
      ticker: orderForm.ticker.toUpperCase(),
      strategy: 'Manual Uji Beli',
      entryPrice: parseFloat(orderForm.entryPrice),
      sl: parseFloat(orderForm.sl),
      tp1: parseFloat(orderForm.tp1),
      allocation: parseFloat(orderForm.allocation),
      status: 'PENDING',
      date: new Date().toISOString()
    };
    
    const updatedTrades = [...userTrades, newTrade];
    setUserTrades(updatedTrades);
    localStorage.setItem('mbg_user_paper_trades', JSON.stringify(updatedTrades));
    
    setOrderForm({ ticker: '', allocation: '', entryPrice: '', sl: '', tp1: '' });
    setShowOrderForm(false);
  };
  
  const handleClosePosition = (id) => {
    const updatedTrades = userTrades.map(t => {
      if (t.id === id) {
        const exitPrice = currentPrices[t.ticker] || t.currentPrice || t.entryPrice;
        const qty = t.allocation ? (t.allocation / t.entryPrice) : 0;
        const pnl = Math.round((exitPrice - t.entryPrice) * qty);
        let finalStatus = 'CLOSED';
        if (t.tp1 && exitPrice >= t.tp1) finalStatus = 'TP1_HIT';
        else if (t.sl && exitPrice <= t.sl) finalStatus = 'SL_HIT';

        return { 
          ...t, 
          status: finalStatus, 
          exitPrice: exitPrice, 
          realizedPnL: pnl,
          closedAt: new Date().toISOString()
        };
      }
      return t;
    });
    setUserTrades(updatedTrades);
    localStorage.setItem('mbg_user_paper_trades', JSON.stringify(updatedTrades));
  };

  const getPnLColor = (val) => val > 0 ? 'var(--accent-green)' : val < 0 ? 'var(--accent-red)' : 'var(--text-primary)';

  return (
    <div style={{ padding: '20px', backgroundColor: 'var(--bg-main, #0a0a0a)', color: 'var(--text-primary, #e0e0e0)', fontFamily: 'monospace' }}>
      
      {/* HUD Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: 'var(--bg-panel, #1a1a1a)', padding: '15px', border: '1px solid #333', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>Virtual Capital</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatIDR(currentEquity)}</div>
          <div style={{ color: getPnLColor(totalPnLPercent), fontSize: '14px' }}>
            {totalPnLPercent > 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
          </div>
        </div>
        
        <div style={{ backgroundColor: 'var(--bg-panel, #1a1a1a)', padding: '15px', border: '1px solid #333', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>Win Rate</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{winRate.toFixed(1)}%</div>
          <div style={{ fontSize: '12px' }}>{wins} Wins / {losses} Losses</div>
        </div>
        
        <div style={{ backgroundColor: 'var(--bg-panel, #1a1a1a)', padding: '15px', border: '1px solid #333', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>Active Positions</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{activePositions.length}</div>
          <div style={{ fontSize: '12px' }}>Pending & Active</div>
        </div>
        
        <div style={{ backgroundColor: 'var(--bg-panel, #1a1a1a)', padding: '15px', border: '1px solid #333', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>Avg Risk/Reward</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>1 : {avgRR.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', marginBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          {['active', 'history', 'strategy'].map(tab => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 15px',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid var(--accent-blue, #4a90e2)' : '2px solid transparent',
                color: activeTab === tab ? '#fff' : '#888',
                textTransform: 'uppercase'
              }}
            >
              {tab === 'active' ? 'Active Positions' : tab === 'history' ? 'Closed & History' : 'Strategy Stats'}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={handleAutoPickAI}
            style={{ 
              backgroundColor: 'var(--accent-orange, #f59e0b)', 
              color: '#000', 
              border: 'none', 
              padding: '6px 12px', 
              cursor: 'pointer', 
              borderRadius: '3px',
              fontWeight: '800',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Otomatis masukkan Top 5 rekomendasi saham AI hari ini ke portofolio virtual"
          >
            🤖 AUTO-PICK AI TOP 5
          </button>
          <button 
            onClick={() => setShowOrderForm(!showOrderForm)}
            style={{ backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444', padding: '6px 12px', cursor: 'pointer', borderRadius: '3px', fontSize: '11px' }}
          >
            + Uji Beli Virtual
          </button>
          {userTrades.length > 0 && (
            <button 
              onClick={() => {
                if (window.confirm("Hapus semua trade simulasi manual & auto-pick Anda?")) {
                  setUserTrades([]);
                  localStorage.removeItem('mbg_user_paper_trades');
                }
              }}
              style={{ backgroundColor: 'transparent', color: '#888', border: '1px solid #333', padding: '6px 8px', cursor: 'pointer', borderRadius: '3px', fontSize: '10px' }}
              title="Reset trade manual Anda"
            >
              🗑️ Reset
            </button>
          )}
        </div>
      </div>

      {showOrderForm && (
        <div style={{ backgroundColor: 'var(--bg-panel, #1a1a1a)', padding: '15px', marginBottom: '20px', border: '1px solid #333', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 15px 0' }}>Simulated Order Input</h4>
          <form onSubmit={handleOrderSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>Ticker</label>
              <input value={orderForm.ticker} onChange={e => setOrderForm({...orderForm, ticker: e.target.value})} style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #333', padding: '5px' }} placeholder="BBCA" required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>Modal (Rp)</label>
              <input type="number" value={orderForm.allocation} onChange={e => setOrderForm({...orderForm, allocation: e.target.value})} style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #333', padding: '5px' }} placeholder="10000000" required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>Entry Price</label>
              <input type="number" value={orderForm.entryPrice} onChange={e => setOrderForm({...orderForm, entryPrice: e.target.value})} style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #333', padding: '5px' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>Hard SL</label>
              <input type="number" value={orderForm.sl} onChange={e => setOrderForm({...orderForm, sl: e.target.value})} style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #333', padding: '5px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>TP1</label>
              <input type="number" value={orderForm.tp1} onChange={e => setOrderForm({...orderForm, tp1: e.target.value})} style={{ backgroundColor: '#000', color: '#fff', border: '1px solid #333', padding: '5px' }} />
            </div>
            <button type="submit" style={{ backgroundColor: 'var(--accent-green, #28a745)', color: '#fff', border: 'none', padding: '7px 15px', cursor: 'pointer', borderRadius: '3px' }}>
              Submit Order
            </button>
          </form>
        </div>
      )}

      {/* Tables */}
      {activeTab === 'active' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#1a1a1a', borderBottom: '2px solid #333', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Ticker</th>
              <th style={{ padding: '10px' }}>Strategy</th>
              <th style={{ padding: '10px' }}>Entry</th>
              <th style={{ padding: '10px' }}>Current</th>
              <th style={{ padding: '10px' }}>SL</th>
              <th style={{ padding: '10px' }}>TP1</th>
              <th style={{ padding: '10px' }}>Unrealized PnL</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {activePositions.map((p, i) => {
              const currentPrice = currentPrices[p.ticker] || p.currentPrice || p.entryPrice;
              const qty = p.allocation ? p.allocation / p.entryPrice : 0;
              const pnl = (currentPrice - p.entryPrice) * qty;
              const pnlPct = ((currentPrice - p.entryPrice) / p.entryPrice) * 100;
              
              return (
                <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{p.ticker}</td>
                  <td style={{ padding: '10px', color: '#aaa' }}>{p.strategy}</td>
                  <td style={{ padding: '10px' }}>{p.entryPrice}</td>
                  <td style={{ padding: '10px' }}>{currentPrice}</td>
                  <td style={{ padding: '10px', color: 'var(--accent-red, #dc3545)' }}>{p.sl}</td>
                  <td style={{ padding: '10px', color: 'var(--accent-green, #28a745)' }}>{p.tp1}</td>
                  <td style={{ padding: '10px', color: getPnLColor(pnl) }}>
                    {formatIDR(pnl)} ({pnlPct.toFixed(2)}%)
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ 
                      padding: '3px 6px', 
                      borderRadius: '3px', 
                      fontSize: '11px',
                      backgroundColor: p.status === 'ACTIVE' ? 'rgba(40,167,69,0.2)' : 'rgba(255,193,7,0.2)',
                      color: p.status === 'ACTIVE' ? '#28a745' : '#ffc107',
                      animation: p.status === 'ACTIVE' ? 'pulse 2s infinite' : 'none'
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {onSelectTicker && (
                        <button
                          onClick={() => onSelectTicker(p.ticker, 'IDX')}
                          style={{ backgroundColor: 'var(--accent-blue, #2563eb)', color: '#fff', border: 'none', padding: '3px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}
                          title="Buka Chart TradingView"
                        >
                          Chart
                        </button>
                      )}
                      {(p.id?.startsWith('manual') || p.id?.startsWith('ai_autopick')) && (
                        <button 
                          onClick={() => handleClosePosition(p.id)}
                          style={{ backgroundColor: 'transparent', color: '#ff4444', border: '1px solid #ff4444', padding: '3px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px' }}
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {activePositions.length === 0 && (
              <tr>
                <td colSpan="9" style={{ padding: '20px', textAlign: 'center', color: '#555' }}>No active positions</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {activeTab === 'history' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#1a1a1a', borderBottom: '2px solid #333', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Date</th>
              <th style={{ padding: '10px' }}>Ticker</th>
              <th style={{ padding: '10px' }}>Result</th>
              <th style={{ padding: '10px' }}>Exit Price</th>
              <th style={{ padding: '10px' }}>Realized PnL</th>
              <th style={{ padding: '10px' }}>R:R Achieved</th>
            </tr>
          </thead>
          <tbody>
            {closedPositions.map((p, i) => {
              const pnl = p.realizedPnL || 0;
              const result = pnl > 0 ? 'WIN' : pnl < 0 ? 'LOSS' : 'FLAT';
              let rr = '-';
              if (p.entryPrice && p.sl && p.exitPrice) {
                const risk = Math.abs(p.entryPrice - p.sl);
                const reward = Math.abs(p.exitPrice - p.entryPrice);
                if (risk > 0) rr = `1:${(reward/risk).toFixed(2)}`;
              }
              return (
                <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '10px', color: '#888' }}>{p.date ? new Date(p.date).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{p.ticker}</td>
                  <td style={{ padding: '10px', color: getPnLColor(pnl) }}>{result} ({p.status})</td>
                  <td style={{ padding: '10px' }}>{p.exitPrice}</td>
                  <td style={{ padding: '10px', color: getPnLColor(pnl) }}>{formatIDR(pnl)}</td>
                  <td style={{ padding: '10px' }}>{rr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {activeTab === 'strategy' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
          {Object.entries(strategyStats).map(([strat, stats]) => (
            <div key={strat} style={{ backgroundColor: 'var(--bg-panel, #1a1a1a)', padding: '15px', border: '1px solid #333', borderRadius: '4px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>{strat}</div>
              <div style={{ fontSize: '12px', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Trades:</span>
                <span>{stats.count}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#888', display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <span>Total PnL:</span>
                <span style={{ color: getPnLColor(stats.pnl), fontWeight: 'bold' }}>{formatIDR(stats.pnl)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default VirtualForwardPortfolio;
