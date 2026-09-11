import React, { useState, useEffect } from 'react';

function getZoneInfo(date, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      hourCycle: 'h23',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const getVal = (type) => parts.find(p => p.type === type)?.value || '';
    const hour = parseInt(getVal('hour'), 10);
    const minute = parseInt(getVal('minute'), 10);
    const second = parseInt(getVal('second'), 10);
    const weekday = getVal('weekday');
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return { hour, minute, second, weekday, timeStr };
  } catch (e) {
    return { hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds(), weekday: 'Mon', timeStr: '--:--' };
  }
}

export default function GlobalMarketTicker({ onNavigateGlobal }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getExchangeStatus = () => {
    // 1. Jakarta (IDX)
    const jkt = getZoneInfo(currentTime, 'Asia/Jakarta');
    const jktMin = jkt.hour * 60 + jkt.minute;
    const isJktWeekend = jkt.weekday === 'Sat' || jkt.weekday === 'Sun';
    let jktOpen = false;
    let jktLabel = 'TUTUP';
    let jktColor = 'var(--accent-rust)';

    if (isJktWeekend) {
      jktLabel = 'LIBUR';
    } else if (jkt.weekday === 'Fri') {
      if (jktMin >= 540 && jktMin < 690) { jktOpen = true; jktLabel = 'BUKA SESI 1'; jktColor = 'var(--accent-green)'; }
      else if (jktMin >= 690 && jktMin < 840) { jktLabel = 'ISTIRAHAT JUMAT'; jktColor = 'var(--accent-orange)'; }
      else if (jktMin >= 840 && jktMin < 950) { jktOpen = true; jktLabel = 'BUKA SESI 2'; jktColor = 'var(--accent-green)'; }
      else { jktLabel = 'TUTUP'; }
    } else {
      if (jktMin >= 540 && jktMin < 720) { jktOpen = true; jktLabel = 'BUKA SESI 1'; jktColor = 'var(--accent-green)'; }
      else if (jktMin >= 720 && jktMin < 810) { jktLabel = 'ISTIRAHAT'; jktColor = 'var(--accent-orange)'; }
      else if (jktMin >= 810 && jktMin < 950) { jktOpen = true; jktLabel = 'BUKA SESI 2'; jktColor = 'var(--accent-green)'; }
      else { jktLabel = 'TUTUP'; }
    }

    // 2. Tokyo (TSE)
    const tyo = getZoneInfo(currentTime, 'Asia/Tokyo');
    const tyoMin = tyo.hour * 60 + tyo.minute;
    const isTyoWeekend = tyo.weekday === 'Sat' || tyo.weekday === 'Sun';
    let tyoOpen = false;
    let tyoLabel = 'TUTUP';
    let tyoColor = 'var(--accent-rust)';

    if (isTyoWeekend) {
      tyoLabel = 'LIBUR';
    } else if (tyoMin >= 540 && tyoMin < 690) {
      tyoOpen = true; tyoLabel = 'BUKA PAGI'; tyoColor = 'var(--accent-green)';
    } else if (tyoMin >= 690 && tyoMin < 750) {
      tyoLabel = 'ISTIRAHAT'; tyoColor = 'var(--accent-orange)';
    } else if (tyoMin >= 750 && tyoMin < 930) {
      tyoOpen = true; tyoLabel = 'BUKA SIANG'; tyoColor = 'var(--accent-green)';
    }

    // 3. London (LSE)
    const lon = getZoneInfo(currentTime, 'Europe/London');
    const lonMin = lon.hour * 60 + lon.minute;
    const isLonWeekend = lon.weekday === 'Sat' || lon.weekday === 'Sun';
    let lonOpen = false;
    let lonLabel = 'TUTUP';
    let lonColor = 'var(--accent-rust)';

    if (isLonWeekend) {
      lonLabel = 'LIBUR';
    } else if (lonMin >= 480 && lonMin < 990) {
      lonOpen = true; lonLabel = 'BUKA'; lonColor = 'var(--accent-green)';
    }

    // 4. New York (NYSE)
    const ny = getZoneInfo(currentTime, 'America/New_York');
    const nyMin = ny.hour * 60 + ny.minute;
    const isNyWeekend = ny.weekday === 'Sat' || ny.weekday === 'Sun';
    let nyOpen = false;
    let nyLabel = 'TUTUP';
    let nyColor = 'var(--accent-rust)';

    if (isNyWeekend) {
      nyLabel = 'LIBUR';
    } else if (nyMin >= 570 && nyMin < 960) {
      nyOpen = true; nyLabel = 'BUKA'; nyColor = 'var(--accent-green)';
    } else if (nyMin >= 240 && nyMin < 570) {
      nyLabel = 'PRE-MKT'; nyColor = 'var(--accent-orange)';
    }

    return [
      { code: 'IDX', name: 'JKT', flag: '🇮🇩', time: jkt.timeStr, open: jktOpen, label: jktLabel, color: jktColor },
      { code: 'TSE', name: 'TYO', flag: '🇯🇵', time: tyo.timeStr, open: tyoOpen, label: tyoLabel, color: tyoColor },
      { code: 'LSE', name: 'LON', flag: '🇬🇧', time: lon.timeStr, open: lonOpen, label: lonLabel, color: lonColor },
      { code: 'NYSE', name: 'NYC', flag: '🇺🇸', time: ny.timeStr, open: nyOpen, label: nyLabel, color: nyColor },
    ];
  };

  const sessions = getExchangeStatus();

  return (
    <div
      onClick={onNavigateGlobal}
      title="Status Bursa Dunia Realtime (Klik untuk detail Pasar Global)"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'var(--bg-panel-dark)',
        padding: '3px 8px',
        borderRadius: '4px',
        border: 'var(--border-hairline)',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', marginRight: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', boxShadow: '0 0 5px var(--accent-green)' }} />
        BURSA:
      </span>
      {sessions.map((s) => (
        <div
          key={s.code}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            padding: '1px 5px',
            background: s.open ? 'rgba(0, 208, 132, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            borderRadius: '3px',
            border: `1px solid ${s.open ? 'rgba(0, 208, 132, 0.3)' : 'var(--border-hairline)'}`
          }}
        >
          <span>{s.flag}</span>
          <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{s.name}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{s.time}</span>
          <span style={{
            fontSize: '8px',
            fontWeight: '800',
            color: s.color,
            padding: '0 2px'
          }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
