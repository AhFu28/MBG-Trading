import React, { useState, useEffect } from 'react';
import { getIdxSessionDetail } from '../utils/marketHours.js';

/**
 * RUNNING TRADE — standby panel.
 *
 * WHY THIS FILE SHRANK
 * --------------------
 * The old widget generated a fake per-trade tape with Math.random(): invented
 * prices, lots and broker codes displayed as a live "running trade" stream.
 * That violates the Zero Simulation Policy (no invented numbers as live market
 * data), so the generator is removed. A real per-trade tape needs the IDX
 * broker/foreign-flow integration (master plan UP-09); until it lands, this
 * panel shows the real BEI market status and an explicit standby state.
 *
 * livePrices is kept in the signature for that integration; onSelectTicker is
 * kept so the parent contract does not change.
 */
export default function RunningTradeWidget({ onSelectTicker, embedded = false, livePrices = {} }) {
  const [marketStatus, setMarketStatus] = useState(() => getIdxSessionDetail());

  // Pantau status jam bursa setiap 10 detik
  useEffect(() => {
    const statusChecker = setInterval(() => {
      setMarketStatus(getIdxSessionDetail());
    }, 10000);
    return () => clearInterval(statusChecker);
  }, []);

  return (
    <div className="quant-card" style={{ padding: embedded ? '10px' : '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
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
              RUNNING TRADE
            </span>
            <span style={{
              fontSize: '9px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: marketStatus.isOpen ? 'rgba(0, 208, 132, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: marketStatus.isOpen ? 'var(--accent-green)' : '#ef4444',
              fontWeight: '800',
              fontFamily: 'var(--font-mono)'
            }}>
              {marketStatus.isOpen ? 'BURSA BUKA' : 'BURSA TUTUP · ' + marketStatus.status}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Pita transaksi per-emiten &bull; menunggu sambungan data riil
          </div>
        </div>
      </div>

      {/* Standby banner — explicit, not disguised as live data */}
      <div style={{
        background: 'rgba(234, 179, 8, 0.08)',
        border: '1px solid rgba(234, 179, 8, 0.25)',
        borderRadius: '6px',
        padding: '10px 12px',
        fontSize: '11px',
        color: 'var(--accent-gold)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '14px' }}>🛰️</span>
        <div>
          <strong>PITA TRANSAKSI STANDBY</strong> — tape riil belum tersambung. Panel lama membangkitkan transaksi palsu; itu melanggar Zero Simulation Policy, jadi dihapus. Tape riil butuh integrasi data IDX broker/foreign flow (rencana induk UP-09).
        </div>
      </div>
    </div>
  );
}
