import React, { useState, useEffect } from 'react';
import { getZoneInfo, getIdxSessionDetail, getUsSessionDetail } from '../utils/marketHours.js';

export default function GlobalMarketTicker({ onNavigateGlobal }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getExchangeStatus = () => {
    const jkt = getIdxSessionDetail(currentTime);
    const tyo = getZoneInfo(currentTime, 'Asia/Tokyo');
    const tyoMin = tyo.minuteOfDay;
    const isTyoWeekend = tyo.weekday === 'Sat' || tyo.weekday === 'Sun';
    let tyoOpen = false;
    let tyoStatus = 'TUTUP';

    if (isTyoWeekend) {
      tyoStatus = 'LIBUR';
    } else if (tyoMin >= 540 && tyoMin < 690) {
      tyoOpen = true; tyoStatus = 'SESI 1';
    } else if (tyoMin >= 690 && tyoMin < 750) {
      tyoStatus = 'ISTIRAHAT';
    } else if (tyoMin >= 750 && tyoMin < 930) {
      tyoOpen = true; tyoStatus = 'SESI 2';
    }

    const lon = getZoneInfo(currentTime, 'Europe/London');
    const lonMin = lon.minuteOfDay;
    const isLonWeekend = lon.weekday === 'Sat' || lon.weekday === 'Sun';
    let lonOpen = false;
    let lonStatus = 'TUTUP';

    if (isLonWeekend) {
      lonStatus = 'LIBUR';
    } else if (lonMin >= 480 && lonMin < 990) {
      lonOpen = true; lonStatus = 'BUKA';
    }

    const ny = getUsSessionDetail(currentTime);

    return [
      { code: 'IDX', name: 'JKT', flag: '🇮🇩', time: jkt.timeStr, open: jkt.isOpen, status: jkt.status },
      { code: 'TSE', name: 'TYO', flag: '🇯🇵', time: tyo.timeStr, open: tyoOpen, status: tyoStatus },
      { code: 'LSE', name: 'LON', flag: '🇬🇧', time: lon.timeStr, open: lonOpen, status: lonStatus },
      { code: 'NYSE', name: 'NYC', flag: '🇺🇸', time: ny.timeStr, open: ny.isOpen, status: ny.status },
    ];
  };

  const sessions = getExchangeStatus();

  return (
    <div
      onClick={onNavigateGlobal}
      title="Status Bursa Dunia Realtime (Klik untuk modul Pasar Global)"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        background: 'var(--bg-ticker-pill, var(--bg-panel-subtle))',
        padding: '1px 5px',
        borderRadius: '3px',
        border: 'var(--border-hairline)',
        cursor: 'pointer',
        userSelect: 'none',
        flexWrap: 'nowrap',
        whiteSpace: 'nowrap'
      }}
    >
      <span style={{
        fontSize: '12px',
        color: 'var(--text-muted)',
        fontWeight: '800',
        letterSpacing: '0.04em',
        paddingRight: '1px',
        display: 'flex',
        alignItems: 'center',
        gap: '2px'
      }}>
        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 3px var(--accent-green)' }} />
        BURSA
      </span>

      {sessions.map((s, idx) => (
        <React.Fragment key={s.code}>
          {idx > 0 && <span style={{ color: 'var(--border-color)', fontSize: '12px' }}>·</span>}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              padding: '0 1px'
            }}
          >
            <span style={{ fontSize: '12px' }}>{s.flag}</span>
            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{s.name}</span>
            <span style={{ color: 'var(--text-muted)' }}>{s.time}</span>
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: s.open ? 'var(--accent-green)' : s.status === 'PRE-MKT' || s.status === 'ISTIRAHAT' ? 'var(--accent-orange)' : 'var(--accent-rust)',
                boxShadow: s.open ? '0 0 4px var(--accent-green)' : 'none',
                display: 'inline-block'
              }}
              title={`${s.code}: ${s.status}`}
            />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
