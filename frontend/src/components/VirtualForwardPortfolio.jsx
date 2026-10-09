import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { institutionalPaperBroker } from '../services/brokerGateway.js';
import { bumpAchievement } from '../services/achievements.js';
import TradervueCalendarAndEquity from './TradervueCalendarAndEquity.jsx';

const JOURNAL_STORAGE_KEY = 'mbg_user_trade_journal_v1';

const EMOTIONAL_STATES = [
  { id: 'ZEN', label: '🧘 Disiplin Zen (Sesuai Rencana)', color: 'var(--accent-green, var(--accent-emerald))' },
  { id: 'FOMO', label: '⚡ FOMO (Mengejar Lilin Hijau)', color: 'var(--accent-orange, var(--accent-gold))' },
  { id: 'FEAR', label: '😰 Takut / Cutloss Dini', color: 'var(--accent-red, var(--accent-red))' },
  { id: 'GREED', label: '🤑 Serakah (Tidak Pasang TP)', color: 'var(--accent-purple, #a855f7)' },
  { id: 'PATIENT', label: '⏳ Sabar Menunggu Konfirmasi', color: 'var(--accent-cyan, #06b6d4)' }
];

const VirtualForwardPortfolio = ({ dailyTradePlans = [], paperPortfolio, currentPrices = {}, onSelectTicker }) => {
  const [activeTab, setActiveTab] = useState('active'); // active, history, strategy, journal
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [paperState, setPaperState] = useState(() => institutionalPaperBroker.getSummary());
  
  // User Journal state
  const [journals, setJournals] = useState(() => {
    try {
      const saved = localStorage.getItem(JOURNAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [journalForm, setJournalForm] = useState({
    symbol: '',
    tradeType: 'LONG',
    result: 'WIN',
    emotionalState: 'ZEN',
    rating: 5,
    thesis: '',
    lessonLearned: ''
  });
  
  // Order Form State
  const [orderForm, setOrderForm] = useState({
    ticker: '',
    market: 'IDX',
    allocation: '10000000',
    entryPrice: '',
    sl: '',
    tp1: ''
  });

  // Sync state from broker
  const refreshBroker = useCallback(() => {
    setPaperState(institutionalPaperBroker.getSummary());
  }, []);

  useEffect(() => {
    refreshBroker();
  }, [refreshBroker]);

  // Combine broker positions and any external props
  const activePositions = useMemo(() => {
    const brokerPositions = (paperState?.positions || []).map(p => ({
      id: p.id,
      ticker: p.symbol,
      market: p.market || 'IDX',
      side: p.side || 'LONG',
      strategy: p.strategy || 'Paper Sandbox',
      entryPrice: p.entryPrice,
      currentPrice: currentPrices[p.symbol] || p.entryPrice,
      sl: p.stopLoss,
      tp1: p.targetPrice,
      allocation: p.size * p.entryPrice,
      status: 'ACTIVE',
      date: p.executionTime,
      source: 'broker'
    }));

    const propPositions = (paperPortfolio?.positions || [])
      .filter(p => p.status === 'ACTIVE' || p.status === 'PENDING')
      .map(p => ({
        id: p.id || p.ticker,
        ticker: p.ticker,
        market: 'IDX',
        side: 'LONG',
        strategy: p.strategy || 'Prop Setup',
        entryPrice: p.entryPrice,
        currentPrice: currentPrices[p.ticker] || p.entryPrice,
        sl: p.sl,
        tp1: p.tp1,
        allocation: p.allocation || 10000000,
        status: p.status,
        date: p.date || new Date().toISOString(),
        source: 'prop'
      }));

    return [...brokerPositions, ...propPositions];
  }, [paperState, paperPortfolio, currentPrices]);

  // Combine closed history
  const closedPositions = useMemo(() => {
    const brokerHistory = (paperState?.tradeHistory || []).map(h => ({
      id: h.id,
      ticker: h.symbol,
      date: h.closedAt,
      result: (h.pnl || 0) > 0 ? 'WIN' : (h.pnl || 0) < 0 ? 'LOSS' : 'FLAT',
      entryPrice: h.entryPrice,
      exitPrice: h.exitPrice,
      realizedPnL: h.pnl || 0,
      sl: h.stopLoss,
      tp1: h.targetPrice,
      strategy: 'Paper Broker',
      status: h.reason || 'CLOSED'
    }));

    const propHistory = (paperPortfolio?.positions || [])
      .filter(p => ['TP1_HIT', 'TP2_HIT', 'SL_HIT', 'EXPIRED', 'CLOSED'].includes(p.status))
      .map(p => ({
        id: p.id || p.ticker,
        ticker: p.ticker,
        date: p.closedAt || p.date,
        result: (p.realizedPnL || 0) > 0 ? 'WIN' : (p.realizedPnL || 0) < 0 ? 'LOSS' : 'FLAT',
        entryPrice: p.entryPrice,
        exitPrice: p.exitPrice || p.entryPrice,
        realizedPnL: p.realizedPnL || 0,
        sl: p.sl,
        tp1: p.tp1,
        strategy: p.strategy || 'Prop Setup',
        status: p.status
      }));

    return [...brokerHistory, ...propHistory];
  }, [paperState, paperPortfolio]);

  // 1-Click Auto-Pick Top 5 AI Setups
  const handleAutoPickAI = () => {
    if (!dailyTradePlans || dailyTradePlans.length === 0) {
      alert("Belum ada Trade Plans AI yang tersedia di sistem.");
      return;
    }

    const currentTickers = new Set(activePositions.map(p => p.ticker));
    const eligiblePlans = dailyTradePlans
      .filter(p => {
        const sym = (p.clean_ticker || (p.symbol ? p.symbol.replace('.JK', '') : '')).toUpperCase();
        return sym && !currentTickers.has(sym);
      })
      .slice(0, 5);

    if (eligiblePlans.length === 0) {
      alert("Semua Top Setup AI hari ini sudah ada dalam portofolio Paper Trading Anda.");
      return;
    }

    let successCount = 0;
    eligiblePlans.forEach((plan, idx) => {
      const sym = (plan.clean_ticker || (plan.symbol ? plan.symbol.replace('.JK', '') : `AI-${idx}`)).toUpperCase();
      const entry = Number(plan.entry_price || plan.current_price || 1000);
      const sl = Number(plan.stop_loss || Math.round(entry * 0.95));
      const tp = Number(plan.target_1 || Math.round(entry * 1.08));
      const lots = Math.max(1, Math.floor(10000000 / (entry * 100)));

      try {
        institutionalPaperBroker.executeOrder({
          symbol: sym,
          market: 'IDX',
          side: 'LONG',
          orderType: 'MARKET',
          entryPrice: entry,
          stopLoss: sl,
          targetPrice: tp,
          lotSize: lots,
          notes: 'Auto-Pick AI Setup'
        });
        successCount++;
        if (sl > 0) bumpAchievement('positionsWithStopLoss', 1);
        bumpAchievement('manualOrdersPlaced', 1);
      } catch (err) {
        console.warn('Auto-pick execute error:', err);
      }
    });

    refreshBroker();
    alert(`Berhasil mengeksekusi ${successCount} posisi AI ke Paper Broker.`);
  };

  // Close position
  const handleClosePosition = (pos) => {
    const currentPrice = currentPrices[pos.ticker] || pos.currentPrice || pos.entryPrice;
    if (pos.source === 'broker') {
      try {
        institutionalPaperBroker.closePosition(pos.id, currentPrice, 'MANUAL_EXIT');
        bumpAchievement('paperTradesClosed', 1);
        refreshBroker();
      } catch (e) {
        alert(e.message);
      }
    } else {
      alert('Posisi ini dikelola oleh bundle model rekomendasi.');
    }
  };

  // Submit manual order
  const handleOrderSubmit = (e) => {
    e.preventDefault();
    const entry = Number(orderForm.entryPrice);
    const sl = Number(orderForm.sl);
    const tp = Number(orderForm.tp1);
    const alloc = Number(orderForm.allocation);
    const sym = orderForm.ticker.trim().toUpperCase();

    if (!sym || entry <= 0 || alloc <= 0) {
      alert('Harap isi simbol, entry, dan modal dengan benar.');
      return;
    }

    const lots = Math.max(1, Math.floor(alloc / (entry * 100)));

    try {
      institutionalPaperBroker.executeOrder({
        symbol: sym,
        market: orderForm.market,
        side: 'LONG',
        orderType: 'MARKET',
        entryPrice: entry,
        stopLoss: sl,
        targetPrice: tp,
        lotSize: lots,
        notes: 'Manual Paper Order'
      });

      if (sl > 0) bumpAchievement('positionsWithStopLoss', 1);
      bumpAchievement('manualOrdersPlaced', 1);
      refreshBroker();

      setOrderForm({ ticker: '', market: 'IDX', allocation: '10000000', entryPrice: '', sl: '', tp1: '' });
      setShowOrderForm(false);
    } catch (err) {
      alert(err.message);
    }
  };

  // Save Trade Journal Entry
  const handleSaveJournal = (e) => {
    e.preventDefault();
    if (!journalForm.symbol.trim() || !journalForm.thesis.trim()) {
      alert('Harap isi simbol dan tesis transaksi.');
      return;
    }

    const newEntry = {
      id: `journal_${Date.now()}`,
      date: new Date().toISOString(),
      symbol: journalForm.symbol.trim().toUpperCase(),
      tradeType: journalForm.tradeType,
      result: journalForm.result,
      emotionalState: journalForm.emotionalState,
      rating: Number(journalForm.rating) || 5,
      thesis: journalForm.thesis.trim(),
      lessonLearned: journalForm.lessonLearned.trim()
    };

    const updated = [newEntry, ...journals];
    setJournals(updated);
    try {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}

    bumpAchievement('journalEntries', 1);

    setJournalForm({
      symbol: '',
      tradeType: 'LONG',
      result: 'WIN',
      emotionalState: 'ZEN',
      rating: 5,
      thesis: '',
      lessonLearned: ''
    });

    alert('Catatan jurnal tersimpan! Poin kedisiplinan bertambah di Jalur Legend.');
  };

  const handleDeleteJournal = (id) => {
    if (window.confirm('Hapus catatan jurnal ini?')) {
      const updated = journals.filter(j => j.id !== id);
      setJournals(updated);
      try {
        localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  // Format currency
  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  // Metrics calculation
  let realizedPnL = 0;
  let wins = 0;
  let losses = 0;
  let totalRR = 0;
  let rrCount = 0;
  const strategyStats = {};

  closedPositions.forEach(p => {
    const pnl = Number(p.realizedPnL) || 0;
    realizedPnL += pnl;
    if (pnl > 0) wins++;
    else if (pnl < 0) losses++;

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
    const currentPrice = Number(currentPrices[p.ticker] || p.currentPrice || entryPriceNum);
    const qty = (p.allocation && entryPriceNum > 0) ? Number(p.allocation) / entryPriceNum : 0;
    const currentPnL = (currentPrice - entryPriceNum) * qty;
    unrealizedPnL += currentPnL;
  });

  const initialCapital = (paperState?.initialCashIdr || 100000000);
  const currentEquity = initialCapital + realizedPnL + unrealizedPnL;
  const totalPnLPercent = ((currentEquity - initialCapital) / initialCapital) * 100;
  const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
  const avgRR = rrCount > 0 ? (totalRR / rrCount) : 0;

  const getPnLColor = (val) => val > 0 ? 'var(--accent-green, var(--accent-emerald))' : val < 0 ? 'var(--accent-red, var(--accent-red))' : 'var(--text-primary)';

  return (
    <div style={{ padding: '20px', backgroundColor: 'var(--bg-main, #0a0a0a)', color: 'var(--text-primary, #e0e0e0)', fontFamily: 'inherit' }}>
      
      {/* HUD Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: 'var(--bg-panel, #1a1a1a)', padding: '15px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', textTransform: 'uppercase', fontWeight: '800' }}>Modal Virtual (IDR)</div>
          <div style={{ fontSize: '19px', fontWeight: '900', marginTop: '4px' }}>{formatIDR(currentEquity)}</div>
          <div style={{ color: getPnLColor(totalPnLPercent), fontSize: '12px', fontWeight: '700', marginTop: '2px' }}>
            {totalPnLPercent > 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}% ROI
          </div>
        </div>
        
        <div style={{ backgroundColor: 'var(--bg-panel, #1a1a1a)', padding: '15px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', textTransform: 'uppercase', fontWeight: '800' }}>Tingkat Menang (Win Rate)</div>
          <div style={{ fontSize: '19px', fontWeight: '900', marginTop: '4px', color: winRate >= 50 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
            {winRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{wins} Menang / {losses} Rugi</div>
        </div>
        
        <div style={{ backgroundColor: 'var(--bg-panel, #1a1a1a)', padding: '15px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', textTransform: 'uppercase', fontWeight: '800' }}>Posisi Terbuka</div>
          <div style={{ fontSize: '19px', fontWeight: '900', marginTop: '4px' }}>{activePositions.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Sedang Berjalan</div>
        </div>
        
        <div style={{ backgroundColor: 'var(--bg-panel, #1a1a1a)', padding: '15px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', textTransform: 'uppercase', fontWeight: '800' }}>Rasio Risk/Reward Rata-rata</div>
          <div style={{ fontSize: '19px', fontWeight: '900', marginTop: '4px' }}>1 : {avgRR.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Disiplin Geometri</div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'active', label: `Posisi Aktif (${activePositions.length})` },
            { id: 'history', label: `Riwayat Closed (${closedPositions.length})` },
            { id: 'calendar', label: '📅 Kalender PnL & Equity' },
            { id: 'strategy', label: 'Statistik Strategi' },
            { id: 'journal', label: `📓 Jurnal Evaluasi (${journals.length})` }
          ].map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-blue, #6366f1)' : '2px solid transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? '800' : '600',
                fontSize: '13px'
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            type="button"
            onClick={handleAutoPickAI}
            style={{ 
              backgroundColor: 'var(--accent-orange, var(--accent-gold))', 
              color: '#000', 
              border: 'none', 
              padding: '7px 12px', 
              cursor: 'pointer', 
              borderRadius: '5px',
              fontWeight: '800',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Otomatis masukkan Top 5 rekomendasi saham AI hari ini ke portofolio virtual"
          >
            🤖 AUTO-PICK AI TOP 5
          </button>
          <button 
            type="button"
            onClick={() => setShowOrderForm(!showOrderForm)}
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '7px 12px', cursor: 'pointer', borderRadius: '5px', fontSize: '12px', fontWeight: '700' }}
          >
            {showOrderForm ? 'Tutup Formulir' : '+ Uji Beli Virtual'}
          </button>
          <button 
            type="button"
            onClick={() => {
              if (window.confirm("Reset seluruh data saldo & posisi simulasi Paper Broker ke Rp 100 Juta?")) {
                institutionalPaperBroker.reset();
                refreshBroker();
              }
            }}
            style={{ backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)', padding: '7px 10px', cursor: 'pointer', borderRadius: '5px', fontSize: '12px' }}
            title="Reset portofolio simulasi ke Rp 100 Juta"
          >
            🔄 Reset Saldo
          </button>
        </div>
      </div>

      {/* Manual Order Form */}
      {showOrderForm && (
        <div style={{ backgroundColor: 'var(--bg-panel, #1a1a1a)', padding: '18px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '800' }}>Formulir Eksekusi Paper Order (Simulasi Disiplin)</h4>
          <form onSubmit={handleOrderSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>Simbol Ticker</label>
              <input value={orderForm.ticker} onChange={e => setOrderForm({...orderForm, ticker: e.target.value})} style={{ backgroundColor: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 10px', borderRadius: '4px', fontSize: '13px' }} placeholder="Contoh: BBCA" required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>Pasar</label>
              <select value={orderForm.market} onChange={e => setOrderForm({...orderForm, market: e.target.value})} style={{ backgroundColor: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 10px', borderRadius: '4px', fontSize: '13px' }}>
                <option value="IDX">IDX (Saham BEI)</option>
                <option value="CRYPTO">Crypto (Binance)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>Modal Alokasi (Rp)</label>
              <input type="number" value={orderForm.allocation} onChange={e => setOrderForm({...orderForm, allocation: e.target.value})} style={{ backgroundColor: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 10px', borderRadius: '4px', fontSize: '13px' }} placeholder="10000000" required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>Harga Masuk (Entry)</label>
              <input type="number" value={orderForm.entryPrice} onChange={e => setOrderForm({...orderForm, entryPrice: e.target.value})} style={{ backgroundColor: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 10px', borderRadius: '4px', fontSize: '13px' }} placeholder="8500" required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>Stop Loss (SL Wajib)</label>
              <input type="number" value={orderForm.sl} onChange={e => setOrderForm({...orderForm, sl: e.target.value})} style={{ backgroundColor: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 10px', borderRadius: '4px', fontSize: '13px' }} placeholder="8100" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700' }}>Target Profit (TP1)</label>
              <input type="number" value={orderForm.tp1} onChange={e => setOrderForm({...orderForm, tp1: e.target.value})} style={{ backgroundColor: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 10px', borderRadius: '4px', fontSize: '13px' }} placeholder="9200" />
            </div>
            <button type="submit" style={{ backgroundColor: 'var(--accent-green, var(--accent-emerald))', color: '#000', fontWeight: '800', border: 'none', padding: '9px 18px', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}>
              Kirim Order Paper
            </button>
          </form>
        </div>
      )}

      {/* Active Positions Table */}
      {activeTab === 'active' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#141721', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                <th style={{ padding: '12px 10px' }}>Ticker</th>
                <th style={{ padding: '12px 10px' }}>Pasar / Arah</th>
                <th style={{ padding: '12px 10px' }}>Harga Entry</th>
                <th style={{ padding: '12px 10px' }}>Harga Terkini</th>
                <th style={{ padding: '12px 10px' }}>Hard SL</th>
                <th style={{ padding: '12px 10px' }}>TP Target</th>
                <th style={{ padding: '12px 10px' }}>Unrealized PnL</th>
                <th style={{ padding: '12px 10px' }}>Status</th>
                <th style={{ padding: '12px 10px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {activePositions.map((p) => {
                const currentPrice = Number(currentPrices[p.ticker] || p.currentPrice || p.entryPrice);
                const qty = (p.allocation && p.entryPrice > 0) ? p.allocation / p.entryPrice : 0;
                const pnl = (currentPrice - p.entryPrice) * qty;
                const pnlPct = p.entryPrice > 0 ? ((currentPrice - p.entryPrice) / p.entryPrice) * 100 : 0;
                
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: '900', color: '#fff' }}>{p.ticker}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                      <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
                        {p.market} · {p.side}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', fontFamily: 'monospace' }}>{p.entryPrice}</td>
                    <td style={{ padding: '12px 10px', fontFamily: 'monospace' }}>{currentPrice}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--accent-red, var(--accent-red))', fontFamily: 'monospace' }}>{p.sl || '—'}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--accent-green, var(--accent-emerald))', fontFamily: 'monospace' }}>{p.tp1 || '—'}</td>
                    <td style={{ padding: '12px 10px', color: getPnLColor(pnl), fontWeight: '700', fontFamily: 'monospace' }}>
                      {formatIDR(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        fontWeight: '800',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--accent-green, var(--accent-emerald))',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {onSelectTicker && (
                          <button
                            type="button"
                            onClick={() => onSelectTicker(p.ticker, p.market || 'IDX')}
                            style={{ backgroundColor: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                            title="Buka Chart TradingView"
                          >
                            Chart
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => handleClosePosition(p)}
                          style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                        >
                          Tutup
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {activePositions.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Belum ada posisi aktif di Paper Broker. Klik <strong>Auto-Pick AI</strong> atau <strong>+ Uji Beli Virtual</strong> untuk mulai simulasi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Closed Positions History */}
      {activeTab === 'history' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#141721', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                <th style={{ padding: '12px 10px' }}>Waktu Tutup</th>
                <th style={{ padding: '12px 10px' }}>Ticker</th>
                <th style={{ padding: '12px 10px' }}>Hasil</th>
                <th style={{ padding: '12px 10px' }}>Harga Keluar</th>
                <th style={{ padding: '12px 10px' }}>Realized PnL</th>
                <th style={{ padding: '12px 10px' }}>R:R Dicapai</th>
              </tr>
            </thead>
            <tbody>
              {closedPositions.map((p) => {
                const pnl = Number(p.realizedPnL) || 0;
                let rr = '—';
                if (p.entryPrice && p.sl && p.exitPrice) {
                  const risk = Math.abs(p.entryPrice - p.sl);
                  const reward = Math.abs(p.exitPrice - p.entryPrice);
                  if (risk > 0) rr = `1 : ${(reward / risk).toFixed(2)}`;
                }
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{p.date ? new Date(p.date).toLocaleString('id-ID') : '—'}</td>
                    <td style={{ padding: '12px 10px', fontWeight: '800', color: '#fff' }}>{p.ticker}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '800',
                        background: p.result === 'WIN' ? 'rgba(16,185,129,0.2)' : p.result === 'LOSS' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                        color: p.result === 'WIN' ? 'var(--accent-green)' : p.result === 'LOSS' ? 'var(--accent-red)' : '#fff'
                      }}>
                        {p.result} ({p.status})
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', fontFamily: 'monospace' }}>{p.exitPrice}</td>
                    <td style={{ padding: '12px 10px', color: getPnLColor(pnl), fontWeight: '700', fontFamily: 'monospace' }}>
                      {formatIDR(pnl)}
                    </td>
                    <td style={{ padding: '12px 10px', fontFamily: 'monospace' }}>{rr}</td>
                  </tr>
                );
              })}
              {closedPositions.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Belum ada riwayat transaksi yang ditutup.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tradervue Calendar & Visual Equity Curve */}
      {activeTab === 'calendar' && (
        <TradervueCalendarAndEquity
          startingCapital={initialCapital}
          closedPositions={closedPositions}
          journals={journals}
          unrealizedPnL={unrealizedPnL}
        />
      )}

      {/* Strategy Stats */}
      {activeTab === 'strategy' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '15px' }}>
          {Object.entries(strategyStats).map(([strat, stats]) => (
            <div key={strat} style={{ backgroundColor: 'var(--bg-panel, #1a1a1a)', padding: '16px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '10px', color: '#fff' }}>{strat}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Jumlah Transaksi:</span>
                <span style={{ fontWeight: '700', color: '#fff' }}>{stats.count}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Realized PnL:</span>
                <span style={{ color: getPnLColor(stats.pnl), fontWeight: '800' }}>{formatIDR(stats.pnl)}</span>
              </div>
            </div>
          ))}
          {Object.keys(strategyStats).length === 0 && (
            <div style={{ color: 'var(--text-muted)', padding: '20px', gridColumn: '1 / -1', textAlign: 'center' }}>
              Belum ada data strategi yang terkumpul.
            </div>
          )}
        </div>
      )}

      {/* Personal Trading Journal (Journey C & E) */}
      {activeTab === 'journal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* New Journal Form */}
          <div style={{ backgroundColor: 'var(--bg-panel, #1a1a1a)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.25)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '900', color: '#fff' }}>
              📓 Tulis Jurnal Evaluasi Trading (Disiplin & Psikologi)
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Kunci menjadi trader institusional adalah mencatat setiap evaluasi secara jujur. Setiap jurnal yang Anda tulis langsung membuka pencapaian <strong>Pencatat Jurnal</strong> di Jalur Legend.
            </p>

            <form onSubmit={handleSaveJournal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    SIMBOL TICKER
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: BBCA / BTCUSDT"
                    value={journalForm.symbol}
                    onChange={(e) => setJournalForm({ ...journalForm, symbol: e.target.value })}
                    required
                    style={{ width: '100%', padding: '9px 12px', background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    ARAH POSISI
                  </label>
                  <select
                    value={journalForm.tradeType}
                    onChange={(e) => setJournalForm({ ...journalForm, tradeType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="LONG">LONG (Beli Naik)</option>
                    <option value="SHORT">SHORT (Jual Turun)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    HASIL AKHIR
                  </label>
                  <select
                    value={journalForm.result}
                    onChange={(e) => setJournalForm({ ...journalForm, result: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="WIN">WIN (Profit Sesuai Rencana)</option>
                    <option value="LOSS">LOSS (Kena Stop Loss Terukur)</option>
                    <option value="BREAKEVEN">BREAK EVEN (Impas)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    KONDISI PSIKOLOGI SAAT EKSEKUSI
                  </label>
                  <select
                    value={journalForm.emotionalState}
                    onChange={(e) => setJournalForm({ ...journalForm, emotionalState: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    {EMOTIONAL_STATES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  TESIS TRANSAKSI & ALASAN MASUK (ENTRY THESIS)
                </label>
                <textarea
                  rows={2}
                  placeholder="Mengapa Anda mengambil posisi ini? Katalis berita, indikator teknikal, breakout volume, dsb..."
                  value={journalForm.thesis}
                  onChange={(e) => setJournalForm({ ...journalForm, thesis: e.target.value })}
                  required
                  style={{ width: '100%', padding: '9px 12px', background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '12.5px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  EVALUASI & PEMBELAJARAN (LESSON LEARNED)
                </label>
                <textarea
                  rows={2}
                  placeholder="Apa yang berjalan baik? Apa yang harus dihindari di transaksi berikutnya?"
                  value={journalForm.lessonLearned}
                  onChange={(e) => setJournalForm({ ...journalForm, lessonLearned: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#fff', fontSize: '12.5px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12.5px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                💾 Simpan Catatan Jurnal & Tambah Skor Disiplin
              </button>
            </form>
          </div>

          {/* Journal Entries List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#fff' }}>
              Daftar Catatan Jurnal Pribadi Anda ({journals.length})
            </h5>

            {journals.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-panel)', borderRadius: '8px' }}>
                Belum ada jurnal trading tercatat. Isi formulir di atas setelah mengeksekusi trade untuk melatih kedisiplinan.
              </div>
            ) : (
              journals.map(j => {
                const emo = EMOTIONAL_STATES.find(s => s.id === j.emotionalState) || EMOTIONAL_STATES[0];
                return (
                  <div key={j.id} style={{ backgroundColor: 'var(--bg-panel, #1a1a1a)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '900', color: '#fff' }}>{j.symbol}</span>
                        <span style={{ fontSize: '12px', fontWeight: '800', padding: '2px 7px', borderRadius: '4px', background: j.result === 'WIN' ? 'rgba(16,185,129,0.2)' : j.result === 'LOSS' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)', color: j.result === 'WIN' ? 'var(--accent-green)' : j.result === 'LOSS' ? 'var(--accent-red)' : '#fff' }}>
                          {j.result} ({j.tradeType})
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: emo.color }}>
                          {emo.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(j.date).toLocaleString('id-ID')}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteJournal(j.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '12px' }}
                          title="Hapus jurnal"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '12.5px', color: '#e2e8f0', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px', marginBottom: '2px' }}>TESIS MASUK:</strong>
                      {j.thesis}
                    </div>

                    {j.lessonLearned && (
                      <div style={{ fontSize: '12px', color: '#a5b4fc', background: 'rgba(99,102,241,0.08)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #6366f1' }}>
                        <strong style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', marginBottom: '2px' }}>Pelajaran yang Dipetik:</strong>
                        {j.lessonLearned}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualForwardPortfolio;
