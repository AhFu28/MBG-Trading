import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TIER } from '../services/featureAccess.js';
import { legendEligible, eligibilityMessage, loadAchievementContext } from '../services/achievements.js';

const KEY_ENABLED = 'mbg_audio_alert_enabled';
const KEY_CHIME = 'mbg_audio_chime_type';
const KEY_VOLUME = 'mbg_audio_volume';

const DEFAULT_CHIME = 'radar';
const DEFAULT_VOLUME = 0.7;

let audioCtx = null;
let ctxPromise = null;

/** Read volume, distinguishing "absent" from a deliberate 0 (the old `|| 0.7` bug). */
function readVolume() {
  const raw = localStorage.getItem(KEY_VOLUME);
  if (raw === null || raw === '') return DEFAULT_VOLUME;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_VOLUME;
  return Math.min(Math.max(parsed, 0), 1);
}

export function isAlertSoundEnabled() {
  try {
    return localStorage.getItem(KEY_ENABLED) !== 'false';
  } catch {
    return true;
  }
}

export function getChimeType() {
  try {
    return localStorage.getItem(KEY_CHIME) || DEFAULT_CHIME;
  } catch {
    return DEFAULT_CHIME;
  }
}

export function getAlertVolume() {
  try {
    return readVolume();
  } catch {
    return DEFAULT_VOLUME;
  }
}

/**
 * Single shared AudioContext, created lazily and reused forever.
 *
 * The previous inline implementation built a new AudioContext per call and never
 * closed it. Browsers cap concurrent contexts (~6 in Chrome); past that the
 * constructor throws, the catch swallowed it, and the chime went permanently
 * silent for the session. One context, cached, ends that failure mode.
 */
function getContext() {
  if (audioCtx) return Promise.resolve(audioCtx);
  if (ctxPromise) return ctxPromise;
  ctxPromise = new Promise((resolve) => {
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) {
        resolve(null);
        return;
      }
      audioCtx = new Ctor();
      resolve(audioCtx);
    } catch {
      ctxPromise = null;
      resolve(null);
    }
  });
  return ctxPromise;
}

/** Arm audio on the first real user gesture (autoplay policy). */
export async function unlockAlertAudio() {
  const ctx = await getContext();
  if (!ctx) return false;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
    return ctx.state === 'running';
  } catch {
    return false;
  }
}

/**
 * Play an alert. Returns true only when a sound was actually emitted, so callers
 * can tell "played" from "silently skipped" instead of assuming success.
 */
export async function playSignalChime(chimeType, volumeOverride) {
  if (!isAlertSoundEnabled()) return false;

  const type = chimeType || getChimeType();
  const volume = typeof volumeOverride === 'number' ? volumeOverride : getAlertVolume();
  if (volume <= 0) return false;

  const ctx = await getContext();
  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
      if (ctx.state !== 'running') return false;
    }
  } catch {
    return false;
  }

  const now = ctx.currentTime;
  const note = (freq, start, dur, wave, peak) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.max(peak, 0.0001), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  };

  try {
    if (type === 'chime') {
      [587.33, 880].forEach((f, i) => note(f, now + i * 0.1, 0.3, 'triangle', volume * 0.25));
    } else if (type === 'kaching') {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, now + i * 0.06, 0.25, 'sine', volume * 0.2));
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.max(volume * 0.3, 0.0001), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    return false;
  }
  return true;
}

/* ---------------------------------------------------------------------------
 * HONESTY NOTICE, and it is not decoration.
 *
 * The figures on this page are a DESIGN MOCK. They were removed once already and
 * then reinstated by a redesign that dropped the disclaimer while keeping the
 * numbers — the exact combination that makes an operator believe six bots are
 * trading their money. Nothing here is connected to an exchange, no order is
 * routed, and every P&L figure is a constant in this file.
 *
 * `SIMULATION_BADGE` and `HONESTY_NOTICE` are rendered unconditionally at the
 * top of the desk so that no future edit can show the numbers without the label.
 * ------------------------------------------------------------------------- */
export const SIMULATION_BADGE = 'SIMULASI — BELUM TERSAMBUNG BURSA';
export const HONESTY_NOTICE =
  'Angka di halaman ini adalah contoh rancangan, bukan hasil trading nyata. ' +
  'Tidak ada order yang dikirim ke bursa mana pun, dan tidak ada bot yang berjalan di akun Anda.';

/** Every numeric field below is a hardcoded placeholder, not telemetry. */
const GROKTAGON_AGENTS = [
  {
    id: 'BRAM',
    name: 'BRAM',
    codename: 'Breakout Momentum Harvester',
    role: 'PERPETUALS / VOLATILITY',
    market: 'CRYPTO PERPS',
    avatar: '⚡',
    color: '#38bdf8',
    status: 'EXECUTING',
    winRate: 76.4,
    profitFactor: 2.82,
    pnl24h: 3420.50,
    pnlPct: 18.2,
    activePair: 'BTC-USDC PERP',
    currentPosition: 'LONG 0.85 BTC @ $82,410',
    sl: '$81,200 (-1.47%)',
    tp: '$85,400 (+3.63%)',
    maxDrawdown: '3.1%',
    allocation: '$50,000',
    strategy: 'Deteksi kompresi volatilitas Bollinger Band & ekspansi volume instan. Masuk pada konfirmasi candle 5M break level resistance.'
  },
  {
    id: 'KETT',
    name: 'KETT',
    codename: 'Smart Money Liquidity Sniper',
    role: 'SMC / ORDER BLOCKS',
    market: 'CRYPTO PERPS',
    avatar: '🎯',
    color: '#10b981',
    status: 'MONITORING',
    winRate: 81.2,
    profitFactor: 3.14,
    pnl24h: 1890.20,
    pnlPct: 14.5,
    activePair: 'SOL-USDC PERP',
    currentPosition: 'LONG 65 SOL @ $168.40',
    sl: '$164.50 (-2.32%)',
    tp: '$178.00 (+5.70%)',
    maxDrawdown: '2.4%',
    allocation: '$40,000',
    strategy: 'Sniping Fair Value Gap (FVG) dan sweep likuiditas level equal lows. Eksekusi pasif limit order di discount array 61.8% OTE.'
  },
  {
    id: 'RIGO',
    name: 'RIGO',
    codename: 'Bandar & Conglomerate Flow',
    role: 'SAHAM IDX / VWAP',
    market: 'BURSA EFEK BEI',
    avatar: '🏛️',
    color: '#f59e0b',
    status: 'ACCUMULATING',
    winRate: 73.8,
    profitFactor: 2.45,
    pnl24h: 2150.00,
    pnlPct: 11.8,
    activePair: 'BBCA.JK',
    currentPosition: 'AKUMULASI 420 LOT @ Rp 9.850',
    sl: 'Rp 9.550 (-3.05%)',
    tp: 'Rp 10.450 (+6.09%)',
    maxDrawdown: '4.2%',
    allocation: '$45,000',
    strategy: 'Melacak akumulasi asing (Foreign Net Buy) dan volume spike broker tier-1 di saham bluechip LQ45. Akumulasi bertahap multi-day.'
  },
  {
    id: 'TESS',
    name: 'TESS',
    codename: 'Delta-Neutral Basis Harvester',
    role: 'FUNDING ARBITRAGE',
    market: 'CROSS-MARKET',
    avatar: '⚙️',
    color: '#a855f7',
    status: 'RUNNING',
    winRate: 94.1,
    profitFactor: 4.80,
    pnl24h: 840.10,
    pnlPct: 8.4,
    activePair: 'ETH-USDC BASIS',
    currentPosition: 'SPOT LONG + PERP SHORT (Hedge)',
    sl: 'SPREAD EXPANSION > 1.2%',
    tp: 'HARVEST FUNDING 8H',
    maxDrawdown: '0.8%',
    allocation: '$35,000',
    strategy: 'Memanfaatkan anomali funding rate positif antar exchange. Posisi delta-netral tanpa eksposur risiko arah pergerakan harga.'
  },
  {
    id: 'HOLT',
    name: 'HOLT',
    codename: 'DEFCON Macro Sentinel',
    role: 'TAIL-RISK HEDGER',
    market: 'GLOBAL MACRO',
    avatar: '🛡️',
    color: '#ec4899',
    status: 'STANDBY',
    winRate: 68.5,
    profitFactor: 2.10,
    pnl24h: 420.00,
    pnlPct: 5.2,
    activePair: 'XAUUSD (GOLD)',
    currentPosition: 'LONG GOLD SAFETY HEDGE',
    sl: '$2,610 (-1.5%)',
    tp: '$2,750 (+3.8%)',
    maxDrawdown: '2.0%',
    allocation: '$30,000',
    strategy: 'Memonitor sinyal DEFCON pasar (DXY, yield obligasi US 10Y, dan eskalasi geopolitik). Otomatis membuka hedging saat pasar stres.'
  },
  {
    id: 'ILSA',
    name: 'ILSA',
    codename: 'Whale Footprint & Tape Reader',
    role: 'ORDER FLOW / L2 BOOK',
    market: 'HYPERLIQUID L2',
    avatar: '🐋',
    color: '#06b6d4',
    status: 'EXECUTING',
    winRate: 79.0,
    profitFactor: 2.95,
    pnl24h: 1540.80,
    pnlPct: 15.4,
    activePair: 'HYPE-USDC PERP',
    currentPosition: 'SHORT 450 HYPE @ $28.40',
    sl: '$29.30 (-3.17%)',
    tp: '$26.50 (+6.69%)',
    maxDrawdown: '3.5%',
    allocation: '$50,000',
    strategy: 'Membaca tape orderbook L2 secara real-time. Mendeteksi penumpukan dinding bid/ask palsu (spoofing) dan penyerapan likuiditas whale.'
  }
];

const INITIAL_LOGS = [
  { time: '19:14:02', agent: 'BRAM', level: 'EXEC', msg: 'Breakout konfirmasi pada BTC-USDC. Order market long 0.85 BTC dieksekusi di $82,410.' },
  { time: '19:12:45', agent: 'KETT', level: 'SNIPE', msg: 'FVG 15M tercapai di SOL-USDC. Limit bid terpasang di $168.20, slippage 0.01%.' },
  { time: '19:10:18', agent: 'ILSA', level: 'ALERT', msg: 'Whale spoofing terdeteksi di orderbook HYPE. Dinding ask $29.00 ditarik, momentum bearish short dibuka.' },
  { time: '19:08:50', agent: 'TESS', level: 'FEE', msg: 'Funding snapshot settlement: berhasil mengunci fee +$42.10 net delta-netral.' },
  { time: '19:05:12', agent: 'RIGO', level: 'FLOW', msg: 'Net buy asing BBCA tembus Rp 180M. Akumulasi batch 3 sebanyak 150 lot selesai di rata-rata Rp 9.850.' },
  { time: '19:01:30', agent: 'HOLT', level: 'SENTINEL', msg: 'DEFCON Telemetry: Status GREEN. Volatilitas VIX normal di 14.8, hedging cadangan dipertahankan.' },
  { time: '18:55:04', agent: 'BRAM', level: 'TRAIL', msg: 'Trailing stop aktif untuk posisi BTC. SL diamankan ke break-even +$320.' }
];

export default function LegendDeskTab({ moduleId, userTier = TIER.GUEST, isAdmin = false, onNavigate }) {
  const ctx = useMemo(() => loadAchievementContext(), []);
  const gate = useMemo(() => legendEligible(ctx, userTier, isAdmin), [ctx, userTier, isAdmin]);

  // Main Desk View Mode
  const [activeView, setActiveView] = useState(moduleId === 'JEV_EXECUTION' ? 'JEV' : 'GROKTAGON');
  const [isHalted, setIsHalted] = useState(false);
  const [agents, setAgents] = useState(GROKTAGON_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState('ALL');
  const [logs, setLogs] = useState(INITIAL_LOGS);

  // Jev Execution Slicer Simulator State
  const [slicerSymbol, setSlicerSymbol] = useState('BTCUSDT');
  const [slicerAmount, setSlicerAmount] = useState('100000');
  const [slicerAlgo, setSlicerAlgo] = useState('TWAP');
  const [slicerInterval, setSlicerInterval] = useState('30m');
  const [slicerRunning, setSlicerRunning] = useState(false);
  const [slicerProgress, setSlicerProgress] = useState(0);

  // Terminal Log Auto-Append Simulation
  useEffect(() => {
    if (isHalted) return;
    const interval = setInterval(() => {
      const randomAgent = GROKTAGON_AGENTS[Math.floor(Math.random() * GROKTAGON_AGENTS.length)];
      const now = new Date().toLocaleTimeString('id-ID', { hour12: false });
      const actions = [
        `Re-evaluating order book depth for ${randomAgent.activePair}. Spread tight at 0.01%.`,
        `Q-Score momentum alignment confirmed. Sizing within risk envelope.`,
        `Trailing profit stop updated. Risk-to-reward ratio 1:3.2.`,
        `Latency telemetry ping to Hyperliquid L1: 3.4ms nominal.`,
        `Heartbeat check passed. Risk budget: optimal.`
      ];
      const action = actions[Math.floor(Math.random() * actions.length)];
      setLogs(prev => [
        { time: now, agent: randomAgent.id, level: 'TICK', msg: action },
        ...prev.slice(0, 30)
      ]);
    }, 7000);

    return () => clearInterval(interval);
  }, [isHalted]);

  // Jev Slicer execution simulator
  const handleStartSlicer = () => {
    setSlicerRunning(true);
    setSlicerProgress(0);
    let p = 0;
    const timer = setInterval(() => {
      p += 20;
      setSlicerProgress(p);
      if (p >= 100) {
        clearInterval(timer);
        setSlicerRunning(false);
        const now = new Date().toLocaleTimeString('id-ID', { hour12: false });
        setLogs(prev => [
          { time: now, agent: 'JEV', level: 'FILLED', msg: `Jev Slicer: Selesai mengeksekusi order $${Number(slicerAmount).toLocaleString()} ${slicerSymbol} via ${slicerAlgo}. Estimasi penghematan slippage: $240.50.` },
          ...prev
        ]);
      }
    }, 600);
  };

  const toggleAgent = (agentId) => {
    setAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        const nextStatus = a.status === 'PAUSED' ? 'RUNNING' : 'PAUSED';
        return { ...a, status: nextStatus };
      }
      return a;
    }));
  };

  if (!gate.eligible) {
    return (
      <div className="telemetry-panel" style={{
        padding: '48px 28px', borderRadius: '16px', textAlign: 'center',
        maxWidth: '560px', margin: '40px auto',
      }}>
        <div style={{ fontSize: '34px', marginBottom: '14px' }}>👑</div>
        <div style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Modul Khusus Legend & Admin
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '20px' }}>
          {eligibilityMessage(gate)}
        </div>
        <button
          onClick={() => onNavigate && onNavigate('ACHIEVEMENTS')}
          style={{
            padding: '11px 24px', borderRadius: '9px', fontSize: '12.5px', fontWeight: 900,
            background: 'linear-gradient(135deg,var(--accent-gold),#d97706)', color: '#000',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          👑 Lihat Legend Path
        </button>
      </div>
    );
  }

  const filteredLogs = selectedAgent === 'ALL'
    ? logs
    : logs.filter(l => l.agent === selectedAgent);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', paddingBottom: '30px' }}>

      {/*
        HONESTY BANNER — rendered before anything else, unconditionally.
        Deliberately placed above the metrics so a screenshot of this page always
        carries the label. See the notice above GROKTAGON_AGENTS for why.
      */}
      <div style={{
        padding: '12px 16px',
        borderRadius: '12px',
        background: 'rgba(245, 158, 11, 0.10)',
        border: '1px solid rgba(245, 158, 11, 0.42)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      }}>
        <span style={{ fontSize: '17px', lineHeight: 1.2 }}>⚠️</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <span style={{
            fontSize: '11.5px',
            fontWeight: 900,
            color: '#fbbf24',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em'
          }}>
            {SIMULATION_BADGE}
          </span>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {HONESTY_NOTICE}
          </span>
        </div>
      </div>
      
      {/* ── TOP ARENA COMMAND BAR ── */}
      <div style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #0a0d14 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '14px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid var(--accent-sky)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px'
          }}>
            🥋
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                THE GROKTAGON // AUTONOMOUS BOT ARENA
              </span>
              <span style={{
                fontSize: '9.5px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                background: isHalted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isHalted ? '#f87171' : 'var(--accent-mint)',
                border: isHalted ? '1px solid #ef4444' : '1px solid rgba(16, 185, 129, 0.4)',
                fontFamily: 'var(--font-mono)'
              }}>
                {isHalted ? '● SYSTEM HALTED' : '● 6 AGENTS ACTIVE'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              Autonomous trading floor executing quantitative strategies across Hyperliquid & BEI
            </div>
          </div>
        </div>

        {/* View Switcher & Kill Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '8px',
            padding: '2px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              onClick={() => setActiveView('GROKTAGON')}
              style={{
                background: activeView === 'GROKTAGON' ? 'var(--accent-sky)' : 'transparent',
                color: activeView === 'GROKTAGON' ? '#000000' : '#94a3b8',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🤖 Bot Arena (Floor View)
            </button>
            <button
              onClick={() => setActiveView('JEV')}
              style={{
                background: activeView === 'JEV' ? 'var(--accent-sky)' : 'transparent',
                color: activeView === 'JEV' ? '#000000' : '#94a3b8',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ⚡ Jev Execution HUD
            </button>
          </div>

          <button
            onClick={() => setIsHalted(prev => !prev)}
            style={{
              background: isHalted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: isHalted ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              color: isHalted ? 'var(--accent-mint)' : '#f87171',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 900,
              cursor: 'pointer'
            }}
            title="Emergency halt halts all bot order emissions immediately"
          >
            {isHalted ? '▶ RESUME FLOOR' : '🛑 EMERGENCY HALT'}
          </button>
        </div>
      </div>

      {/* ── METRICS TELEMETRY STRIP ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px'
      }}>
        {[
          { label: 'Total Allocated Capital', val: '$250,000.00', sub: 'Across 6 Bot Accounts', col: '#cbd5e1' },
          { label: '24h Realized PnL', val: '+$10,261.60', sub: '+4.10% Net Gain', col: 'var(--accent-mint)' },
          { label: 'Cumulative Win Rate', val: '79.2%', sub: '142 Orders Filled', col: 'var(--accent-sky)' },
          { label: 'Floor Sharpe Ratio', val: '2.84', sub: 'Low Tail-Risk Variance', col: 'var(--accent-gold)' },
          { label: 'Execution Latency', val: '3.4 ms', sub: 'Direct WebSocket L1', col: 'var(--accent-mint)' },
        ].map(m => (
          <div key={m.label} style={{
            background: 'var(--bg-panel, #0a0d12)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            <span style={{ fontSize: '9.5px', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {m.label}
            </span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: m.col, fontFamily: 'var(--font-mono)' }}>
              {m.val}
            </span>
            <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
              {m.sub}
            </span>
          </div>
        ))}
      </div>

      {activeView === 'GROKTAGON' ? (
        <>
          {/* ── 6 AUTONOMOUS AGENTS FLOOR CARDS ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '12px'
          }}>
            {agents.map(agent => {
              const isExecuting = agent.status === 'EXECUTING';
              const isPaused = agent.status === 'PAUSED';

              return (
                <div
                  key={agent.id}
                  style={{
                    background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.7) 0%, rgba(10, 13, 20, 0.9) 100%)',
                    border: isExecuting ? `1px solid ${agent.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{agent.avatar}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                            {agent.name}
                          </span>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '3px',
                            background: `${agent.color}20`,
                            color: agent.color,
                            border: `1px solid ${agent.color}40`,
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {agent.role}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {agent.codename}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill & Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isPaused ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: isPaused ? '#f87171' : 'var(--accent-mint)',
                        border: isPaused ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {agent.status}
                      </span>
                      <button
                        onClick={() => toggleAgent(agent.id)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#cbd5e1',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                        title={isPaused ? "Nyalakan bot ini" : "Jeda bot ini"}
                      >
                        {isPaused ? '▶' : '⏸'}
                      </button>
                    </div>
                  </div>

                  {/* Strategy Description */}
                  <div style={{ fontSize: '10.5px', color: '#64748b', lineHeight: 1.5, background: 'rgba(0, 0, 0, 0.25)', padding: '6px 8px', borderRadius: '6px' }}>
                    {agent.strategy}
                  </div>

                  {/* Current Active Position Box */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span style={{ color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Target Pair</span>
                      <span style={{ color: '#f8fafc', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{agent.activePair}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                      <span style={{ color: '#64748b' }}>Posisi Terbuka</span>
                      <span style={{ color: agent.currentPosition.includes('LONG') ? 'var(--accent-mint)' : agent.currentPosition.includes('SHORT') ? '#f87171' : 'var(--accent-gold)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {agent.currentPosition}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                      <span>SL: {agent.sl}</span>
                      <span>TP: {agent.tp}</span>
                    </div>
                  </div>

                  {/* Agent Performance Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '6px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    paddingTop: '8px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    <div>
                      <div style={{ color: '#64748b' }}>Win Rate</div>
                      <div style={{ fontWeight: 800, color: 'var(--accent-mint)' }}>{agent.winRate}%</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b' }}>Profit Factor</div>
                      <div style={{ fontWeight: 800, color: '#f8fafc' }}>{agent.profitFactor}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#64748b' }}>24h Net PnL</div>
                      <div style={{ fontWeight: 800, color: 'var(--accent-mint)' }}>+${agent.pnl24h.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── TERMINAL STREAM / GROKTAGON ACTIVITY LOG ── */}
          <div style={{
            background: '#07090e',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>📟</span>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                  GROKTAGON EXECUTION FEED & DECISION STREAM
                </span>
              </div>

              {/* Filter Agent */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {['ALL', 'BRAM', 'KETT', 'RIGO', 'TESS', 'HOLT', 'ILSA'].map(ag => (
                  <button
                    key={ag}
                    onClick={() => setSelectedAgent(ag)}
                    style={{
                      background: selectedAgent === ag ? 'var(--accent-sky)' : 'rgba(255, 255, 255, 0.04)',
                      color: selectedAgent === ag ? '#000000' : '#94a3b8',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '9.5px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {ag}
                  </button>
                ))}
              </div>
            </div>

            {/* Terminal Lines */}
            <div style={{
              height: '180px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px'
            }}>
              {filteredLogs.map((log, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                  <span style={{ color: '#64748b' }}>[{log.time}]</span>
                  <span style={{
                    color: log.agent === 'BRAM' ? '#38bdf8' : log.agent === 'KETT' ? '#10b981' : log.agent === 'RIGO' ? '#f59e0b' : log.agent === 'TESS' ? '#a855f7' : log.agent === 'HOLT' ? '#ec4899' : '#06b6d4',
                    fontWeight: 800,
                    minWidth: '45px'
                  }}>
                    {log.agent}
                  </span>
                  <span style={{
                    fontSize: '9px',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#94a3b8'
                  }}>
                    {log.level}
                  </span>
                  <span style={{ color: '#cbd5e1', flex: 1 }}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* ── JEV EXECUTION HUD (ALGORITHMIC ORDER SLICER) ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '14px'
        }}>
          {/* Order Slicing Configuration */}
          <div style={{
            background: 'var(--bg-panel, #0a0d12)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#f8fafc' }}>
                ⚡ Jev Institutional Algorithmic Slicer
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                Memecah pesanan volume institusi besar menjadi sub-order mikro untuk meminimalkan dampak harga (market impact & slippage).
              </div>
            </div>

            {/* Algorithm Choice */}
            <div>
              <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Algoritma Pemotongan:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '6px' }}>
                {[
                  { id: 'TWAP', label: 'TWAP', desc: 'Bagi Rata Sesuai Waktu' },
                  { id: 'VWAP', label: 'VWAP', desc: 'Mengikuti Kurva Volume' },
                  { id: 'ICEBERG', label: 'Iceberg Stealth', desc: 'Sembunyikan Ukuran Asli' },
                ].map(algo => (
                  <button
                    key={algo.id}
                    type="button"
                    onClick={() => setSlicerAlgo(algo.id)}
                    style={{
                      background: slicerAlgo === algo.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: slicerAlgo === algo.id ? '1px solid var(--accent-sky)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 6px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 800, color: slicerAlgo === algo.id ? 'var(--accent-sky)' : '#cbd5e1' }}>
                      {algo.label}
                    </span>
                    <span style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>
                      {algo.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs: Asset & Size */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700 }}>Simbol Aset:</label>
                <select
                  value={slicerSymbol}
                  onChange={(e) => setSlicerSymbol(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '12px',
                    marginTop: '4px'
                  }}
                >
                  <option value="BTCUSDT">BTC/USDC Perp</option>
                  <option value="ETHUSDT">ETH/USDC Perp</option>
                  <option value="SOLUSDT">SOL/USDC Perp</option>
                  <option value="BBCA">BBCA (Saham BEI)</option>
                  <option value="AMMN">AMMN (Saham BEI)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700 }}>Nominal Order ($):</label>
                <input
                  type="number"
                  value={slicerAmount}
                  onChange={(e) => setSlicerAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '12px',
                    marginTop: '4px',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700 }}>Durasi Pembagian:</label>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                {['15m', '30m', '1h', '2h', '4h'].map(dur => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSlicerInterval(dur)}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      borderRadius: '6px',
                      background: slicerInterval === dur ? 'var(--accent-sky)' : 'rgba(255, 255, 255, 0.04)',
                      color: slicerInterval === dur ? '#000' : '#94a3b8',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>

            {/* Execution Trigger */}
            <button
              onClick={handleStartSlicer}
              disabled={slicerRunning}
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: slicerRunning ? 'rgba(56, 189, 248, 0.3)' : 'linear-gradient(135deg, var(--accent-sky), #0284c7)',
                color: slicerRunning ? '#cbd5e1' : '#000000',
                border: 'none',
                fontWeight: 900,
                fontSize: '13px',
                cursor: slicerRunning ? 'not-allowed' : 'pointer'
              }}
            >
              {slicerRunning ? `Mengeksekusi Sub-order... (${slicerProgress}%)` : '▶ Jalankan Simulasi Jev Slicer'}
            </button>
          </div>

          {/* Slicer Telemetry & Savings Visualization */}
          <div style={{
            background: 'var(--bg-panel, #0a0d12)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
              📊 Analisis Dampak Likuiditas & Slippage
            </div>

            {/* Progress bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Progres Eksekusi Chunk:</span>
                <span style={{ color: 'var(--accent-mint)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{slicerProgress}% Selesai</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${slicerProgress}%`, height: '100%', background: 'var(--accent-sky)', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* Slicing statistics cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Sub-order Terbagi</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>24 Potongan</div>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>Rata-rata $4,166 per fill</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '10px', color: 'var(--accent-mint)' }}>Penghematan Slippage</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-mint)', fontFamily: 'var(--font-mono)' }}>+$240.50</div>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>Dibandingkan market dump biasa</div>
              </div>
            </div>

            {/* Algorithmic safety note */}
            <div style={{
              fontSize: '10.5px',
              color: '#64748b',
              lineHeight: 1.6,
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.04)'
            }}>
              🛡️ <strong>Stealth Execution Guard:</strong> Jev HUD secara otomatis menyesuaikan kecepatan kirim order jika orderbook mengalami penurunan likuiditas mendadak atau terdeteksi predatory HFT frontrunning.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
