import React, { useState, useMemo } from 'react';

/**
 * TradervueCalendarAndEquity
 *
 * Professional Prop-Firm / Hedge-Fund grade analytics:
 * 1. Interactive Visual Equity Curve with High-Water Mark & Max Drawdown
 * 2. Monthly PnL Heatmap Calendar with daily performance & psychological tags
 * 3. Daily Trade Drill-down
 */

function formatIdrCompact(val) {
  if (val === undefined || val === null || isNaN(val)) return 'Rp 0';
  const num = Number(val);
  const sign = num > 0 ? '+' : num < 0 ? '-' : '';
  const abs = Math.abs(num);
  if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toFixed(2)} M`;
  if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toFixed(1)} Jt`;
  if (abs >= 1e3) return `${sign}Rp ${(abs / 1e3).toFixed(0)} Rb`;
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
}

export default function TradervueCalendarAndEquity({
  startingCapital = 100000000,
  closedPositions = [],
  journals = [],
  unrealizedPnL = 0
}) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  // Normalize all closed trades & journals into a combined list of dated events
  const combinedEvents = useMemo(() => {
    const list = [];

    // From closed positions
    closedPositions.forEach((cp, idx) => {
      const dt = cp.date ? new Date(cp.date) : new Date(Date.now() - (idx + 1) * 86400000 * 2);
      const dayKey = dt.toISOString().slice(0, 10);
      list.push({
        id: cp.id || `cp-${idx}`,
        type: 'TRADE',
        symbol: cp.ticker,
        pnl: Number(cp.realizedPnL || 0),
        result: cp.result || (cp.realizedPnL > 0 ? 'WIN' : 'LOSS'),
        strategy: cp.strategy || 'Paper Broker',
        date: dt,
        dayKey,
        detail: `Entry ${cp.entryPrice} → Exit ${cp.exitPrice || cp.entryPrice}`
      });
    });

    // From journal entries
    journals.forEach((j, idx) => {
      const dt = j.date ? new Date(j.date) : new Date();
      const dayKey = dt.toISOString().slice(0, 10);
      list.push({
        id: j.id || `jr-${idx}`,
        type: 'JOURNAL',
        symbol: j.symbol,
        pnl: j.result === 'WIN' ? 1500000 : j.result === 'LOSS' ? -750000 : 0,
        result: j.result,
        emotionalState: j.emotionalState,
        thesis: j.thesis,
        lesson: j.lessonLearned,
        date: dt,
        dayKey
      });
    });

    // Sort chronologically ascending for equity curve calculation
    return list.sort((a, b) => a.date - b.date);
  }, [closedPositions, journals]);

  // Calculate Equity Curve points
  const equityPoints = useMemo(() => {
    let runningCapital = startingCapital;
    let highWaterMark = startingCapital;
    let maxDrawdown = 0;

    const points = [{
      date: new Date(Date.now() - 30 * 86400000),
      equity: startingCapital,
      pnl: 0,
      drawdownPct: 0
    }];

    combinedEvents.forEach(ev => {
      runningCapital += ev.pnl;
      if (runningCapital > highWaterMark) highWaterMark = runningCapital;
      const dd = highWaterMark > 0 ? ((highWaterMark - runningCapital) / highWaterMark) * 100 : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;

      points.push({
        date: ev.date,
        equity: runningCapital,
        pnl: ev.pnl,
        drawdownPct: dd,
        symbol: ev.symbol,
        event: ev
      });
    });

    // Add current unrealized snapshot point
    const currentEquity = runningCapital + unrealizedPnL;
    points.push({
      date: new Date(),
      equity: currentEquity,
      pnl: unrealizedPnL,
      drawdownPct: maxDrawdown,
      isCurrent: true
    });

    const netProfit = currentEquity - startingCapital;
    const netReturnPct = (netProfit / startingCapital) * 100;

    return {
      points,
      currentEquity,
      highWaterMark,
      maxDrawdown,
      netProfit,
      netReturnPct
    };
  }, [startingCapital, combinedEvents, unrealizedPnL]);

  // Aggregate stats per day for the Calendar
  const dayStatsMap = useMemo(() => {
    const map = {};
    combinedEvents.forEach(ev => {
      if (!map[ev.dayKey]) {
        map[ev.dayKey] = {
          dayKey: ev.dayKey,
          pnl: 0,
          tradeCount: 0,
          emotions: new Set(),
          events: []
        };
      }
      map[ev.dayKey].pnl += ev.pnl;
      map[ev.dayKey].tradeCount += 1;
      if (ev.emotionalState) map[ev.dayKey].emotions.add(ev.emotionalState);
      map[ev.dayKey].events.push(ev);
    });
    return map;
  }, [combinedEvents]);

  // Calendar days grid for the selected month
  const calendarDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding before 1st of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      const key = dt.toISOString().slice(0, 10);
      const stat = dayStatsMap[key];
      days.push({
        dayNumber: d,
        date: dt,
        key,
        stat
      });
    }

    return days;
  }, [selectedMonth, dayStatsMap]);

  // Month summary stats
  const monthSummary = useMemo(() => {
    let monthPnl = 0;
    let greenDays = 0;
    let redDays = 0;
    let totalTrades = 0;

    calendarDays.forEach(d => {
      if (!d.empty && d.stat) {
        monthPnl += d.stat.pnl;
        totalTrades += d.stat.tradeCount;
        if (d.stat.pnl > 0) greenDays += 1;
        else if (d.stat.pnl < 0) redDays += 1;
      }
    });

    const activeDays = greenDays + redDays;
    const winRate = activeDays > 0 ? (greenDays / activeDays) * 100 : 0;

    return { monthPnl, greenDays, redDays, totalTrades, winRate };
  }, [calendarDays]);

  const monthName = selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setSelectedMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  };

  // Helper SVG Polyline points
  const svgMetrics = useMemo(() => {
    const pts = equityPoints.points;
    if (pts.length < 2) return null;

    const minEq = Math.min(...pts.map(p => p.equity)) * 0.98;
    const maxEq = Math.max(...pts.map(p => p.equity)) * 1.02;
    const range = maxEq - minEq || 1;

    const width = 800;
    const height = 180;
    const padding = 20;

    const coords = pts.map((p, i) => {
      const x = padding + (i / (pts.length - 1)) * (width - padding * 2);
      const y = height - padding - ((p.equity - minEq) / range) * (height - padding * 2);
      return { x, y, p };
    });

    const polylineStr = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const areaStr = `${coords[0].x},${height - padding} ${polylineStr} ${coords[coords.length - 1].x},${height - padding}`;

    return { coords, polylineStr, areaStr, width, height, minEq, maxEq };
  }, [equityPoints]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ================= 1. VISUAL EQUITY CURVE WIDGET ================= */}
      <div style={{
        background: '#131923',
        border: '1px solid #2F3A49',
        borderRadius: '14px',
        padding: '20px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.06em', color: '#78A9FF', textTransform: 'uppercase' }}>
              📈 KURVA PERTUMBUHAN MODAL (VISUAL EQUITY CURVE)
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#F3F5F7', fontFamily: 'var(--font-mono)' }}>
                Rp {equityPoints.currentEquity.toLocaleString('id-ID')}
              </span>
              <span style={{
                fontSize: '13px',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)',
                color: equityPoints.netProfit >= 0 ? '#3BC78A' : '#FF6B75'
              }}>
                {equityPoints.netProfit >= 0 ? '+' : ''}{formatIdrCompact(equityPoints.netProfit)} ({equityPoints.netReturnPct >= 0 ? '+' : ''}{equityPoints.netReturnPct.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ background: '#1B2431', padding: '8px 14px', borderRadius: '8px', border: '1px solid #2F3A49' }}>
              <div style={{ fontSize: '10px', color: '#A7B0BD', fontWeight: '700' }}>MODAL AWAL</div>
              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#F3F5F7', fontFamily: 'var(--font-mono)' }}>
                Rp {startingCapital.toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{ background: '#1B2431', padding: '8px 14px', borderRadius: '8px', border: '1px solid #2F3A49' }}>
              <div style={{ fontSize: '10px', color: '#A7B0BD', fontWeight: '700' }}>HIGH-WATER MARK</div>
              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#3BC78A', fontFamily: 'var(--font-mono)' }}>
                Rp {equityPoints.highWaterMark.toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{ background: '#1B2431', padding: '8px 14px', borderRadius: '8px', border: '1px solid #2F3A49' }}>
              <div style={{ fontSize: '10px', color: '#A7B0BD', fontWeight: '700' }}>MAX DRAWDOWN</div>
              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#FF6B75', fontFamily: 'var(--font-mono)' }}>
                -{equityPoints.maxDrawdown.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* SVG Equity Graph */}
        <div style={{ width: '100%', height: '180px', position: 'relative', overflow: 'hidden', borderRadius: '8px', background: '#0B0E14' }}>
          {svgMetrics ? (
            <svg
              viewBox={`0 0 ${svgMetrics.width} ${svgMetrics.height}`}
              style={{ width: '100%', height: '100%', display: 'block' }}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2457D6" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#2457D6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="20" y1="40" x2={svgMetrics.width - 20} y2="40" stroke="#2F3A49" strokeDasharray="3 3" opacity="0.6" />
              <line x1="20" y1="90" x2={svgMetrics.width - 20} y2="90" stroke="#2F3A49" strokeDasharray="3 3" opacity="0.6" />
              <line x1="20" y1="140" x2={svgMetrics.width - 20} y2="140" stroke="#2F3A49" strokeDasharray="3 3" opacity="0.6" />

              {/* Area gradient */}
              <polygon points={svgMetrics.areaStr} fill="url(#equityFill)" />

              {/* Line */}
              <polyline
                fill="none"
                stroke="#3BC78A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={svgMetrics.polylineStr}
              />

              {/* Markers */}
              {svgMetrics.coords.map((c, i) => (
                <circle
                  key={i}
                  cx={c.x}
                  cy={c.y}
                  r="3.5"
                  fill="#F3F5F7"
                  stroke="#2457D6"
                  strokeWidth="2"
                />
              ))}
            </svg>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#A7B0BD', fontSize: '12px' }}>
              Belum ada titik transaksi yang cukup untuk menggambar kurva.
            </div>
          )}
        </div>
      </div>

      {/* ================= 2. TRADERVUE-STYLE PNL HEATMAP CALENDAR ================= */}
      <div style={{
        background: '#131923',
        border: '1px solid #2F3A49',
        borderRadius: '14px',
        padding: '20px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Calendar Header with Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.06em', color: '#78A9FF', textTransform: 'uppercase' }}>
              📅 KALENDER HASIL TRADING BULANAN (TRADERVUE HEATMAP)
            </div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#F3F5F7', marginTop: '2px', textTransform: 'capitalize' }}>
              {monthName}
            </div>
          </div>

          {/* Month Summary Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '12px', color: '#A7B0BD' }}>
              Total PnL:{' '}
              <strong style={{ fontFamily: 'var(--font-mono)', color: monthSummary.monthPnl >= 0 ? '#3BC78A' : '#FF6B75' }}>
                {formatIdrCompact(monthSummary.monthPnl)}
              </strong>
            </div>
            <div style={{ fontSize: '12px', color: '#A7B0BD' }}>
              Rasio Hari Hijau:{' '}
              <strong style={{ color: '#F3F5F7' }}>
                {monthSummary.greenDays} Win / {monthSummary.redDays} Loss ({monthSummary.winRate.toFixed(0)}%)
              </strong>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={prevMonth}
                style={{ background: '#1B2431', border: '1px solid #2F3A49', color: '#F3F5F7', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                ◀ Bulan Lalu
              </button>
              <button
                type="button"
                onClick={nextMonth}
                style={{ background: '#1B2431', border: '1px solid #2F3A49', color: '#F3F5F7', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                Bulan Berikutnya ▶
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Day Labels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '6px' }}>
          {['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'].map(day => (
            <div key={day} style={{ fontSize: '10.5px', fontWeight: '800', color: '#A7B0BD', padding: '4px 0' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {calendarDays.map((d, idx) => {
            if (d.empty) {
              return (
                <div
                  key={d.key || idx}
                  style={{
                    height: '82px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px dashed rgba(255,255,255,0.04)'
                  }}
                />
              );
            }

            const stat = d.stat;
            const hasTrades = Boolean(stat && stat.tradeCount > 0);
            const isGreen = hasTrades && stat.pnl > 0;
            const isRed = hasTrades && stat.pnl < 0;
            const isSelected = selectedDayKey === d.key;

            const bg = isGreen
              ? 'linear-gradient(135deg, rgba(59, 199, 138, 0.22) 0%, rgba(16, 185, 129, 0.12) 100%)'
              : isRed
                ? 'linear-gradient(135deg, rgba(255, 107, 117, 0.22) 0%, rgba(239, 68, 68, 0.12) 100%)'
                : hasTrades
                  ? 'rgba(36, 87, 214, 0.15)'
                  : '#1B2431';

            const border = isSelected
              ? '2px solid #78A9FF'
              : isGreen
                ? '1px solid rgba(59, 199, 138, 0.45)'
                : isRed
                  ? '1px solid rgba(255, 107, 117, 0.45)'
                  : '1px solid #2F3A49';

            return (
              <div
                key={d.key}
                onClick={() => hasTrades && setSelectedDayKey(isSelected ? null : d.key)}
                style={{
                  height: '82px',
                  borderRadius: '8px',
                  background: bg,
                  border,
                  padding: '6px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                  cursor: hasTrades ? 'pointer' : 'default',
                  transition: 'transform 120ms ease, border-color 150ms ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: isGreen ? '#3BC78A' : isRed ? '#FF6B75' : '#F3F5F7' }}>
                    {d.dayNumber}
                  </span>
                  {hasTrades && (
                    <span style={{
                      fontSize: '9px',
                      fontWeight: '800',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: 'rgba(0,0,0,0.4)',
                      color: '#F3F5F7'
                    }}>
                      {stat.tradeCount} trade
                    </span>
                  )}
                </div>

                {hasTrades ? (
                  <div>
                    <div style={{
                      fontSize: '11.5px',
                      fontWeight: '900',
                      fontFamily: 'var(--font-mono)',
                      color: isGreen ? '#3BC78A' : isRed ? '#FF6B75' : '#F3F5F7'
                    }}>
                      {formatIdrCompact(stat.pnl)}
                    </div>
                    {stat.emotions.size > 0 && (
                      <div style={{ fontSize: '10px', marginTop: '2px' }}>
                        {Array.from(stat.emotions).map(e => e === 'ZEN' ? '🧘' : e === 'FOMO' ? '⚡' : e === 'FEAR' ? '😰' : e === 'GREED' ? '🤑' : '⏳').join(' ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '9px', color: '#657286', fontStyle: 'italic' }}>
                    Libur / flat
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Day Drilldown */}
        {selectedDayKey && dayStatsMap[selectedDayKey] && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '10px',
            background: '#0B0E14',
            border: '1px solid #78A9FF'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '900', color: '#F3F5F7' }}>
                🔍 Detail Transaksi Tanggal {new Date(selectedDayKey).toLocaleDateString('id-ID', { dateStyle: 'full' })}
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayKey(null)}
                style={{ background: 'none', border: 'none', color: '#A7B0BD', cursor: 'pointer', fontSize: '12px' }}
              >
                ✕ Tutup
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dayStatsMap[selectedDayKey].events.map((ev, i) => (
                <div
                  key={ev.id || i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#131923',
                    border: '1px solid #2F3A49',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: '#F3F5F7' }}>{ev.symbol}</strong>
                    <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: ev.result === 'WIN' ? 'rgba(59,199,138,0.2)' : 'rgba(255,107,117,0.2)', color: ev.result === 'WIN' ? '#3BC78A' : '#FF6B75', fontWeight: '800' }}>
                      {ev.result}
                    </span>
                    {ev.thesis && <span style={{ color: '#A7B0BD', fontSize: '11px' }}>{ev.thesis.slice(0, 50)}...</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: ev.pnl >= 0 ? '#3BC78A' : '#FF6B75' }}>
                    {formatIdrCompact(ev.pnl)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
