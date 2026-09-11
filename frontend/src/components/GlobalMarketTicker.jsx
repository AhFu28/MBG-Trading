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
    const weekday = getVal('weekday');
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return { hour, minute, weekday, timeStr };
  } catch (e) {
    return { hour: date.getHours(), minute: date.getMinutes(), weekday: 'Mon', timeStr: '--:--' };
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
    let jktStatus = 'TUTUP';

    if (isJktWeekend) {
      jktStatus = 'LIBUR';
    } else if (jkt.weekday === 'Fri') {
      if (jktMin >= 540 && jktMin < 690) { jktOpen = true; jktStatus = 'SESI 1'; }
      else if (jktMin >= 690 && jktMin < 840) { jktStatus = 'ISTIRAHAT'; }
      else if (jktMin >= 840 && jktMin < 950) { jktOpen = true; jktStatus = 'SESI 2'; }
      else { jktStatus = 'TUTUP'; }
    } else {
      if (jktMin >= 540 && jktMin < 720) { jktOpen = true; jktStatus = 'SESI 1'; }
      else if (jktMin >= 720 && jktMin < 810) { jktStatus = 'ISTIRAHAT'; }
      else if (jktMin >= 810 && jktMin < 950) { jktOpen = true; jktStatus = 'SESI 2'; }
      else { jktStatus = 'TUTUP'; }
    }

    // 2. Tokyo (TSE)
    const tyo = getZoneInfo(currentTime, 'Asia/Tokyo');
    const tyoMin = tyo.hour * 60 + tyo.minute;
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

    // 3. London (LSE)
    const lon = getZoneInfo(currentTime, 'Europe/London');
    const lonMin = lon.hour * 60 + lon.minute;
    const isLonWeekend = lon.weekday === 'Sat' || lon.weekday === 'Sun';
    let lonOpen = false;
    let lonStatus = 'TUTUP';

    if (isLonWeekend) {
      lonStatus = 'LIBUR';
    } else if (lonMin >= 480 && lonMin < 990) {
      lonOpen = true; lonStatus = 'BUKA';
    }

    // 4. New York (NYSE)
    const ny = getZoneInfo(currentTime, 'America/New_York');
    const nyMin = ny.hour * 60 + ny.minute;
    const isNyWeekend = ny.weekday === 'Sat' || ny.weekday === 'Sun';
    let nyOpen = false;
    let nyStatus = 'TUTUP';

    if (isNyWeekend) {
      nyStatus = 'LIBUR';
    } else if (nyMin >= 570 && nyMin < 960) {
      nyOpen = true; nyStatus = 'BUKA';
    } else if (nyMin >= 240 && nyMin < 570) {
      nyStatus = 'PRE-MKT';
    }

    return [
      { code: 'IDX', name: 'JKT', flag: '🇮🇩', time: jkt.timeStr, open: jktOpen, status: jktStatus },
      { code: 'TSE', name: 'TYO', flag: '🇯🇵', time: tyo.timeStr, open: tyoOpen, status: tyoStatus },
      { code: 'LSE', name: 'LON', flag: '🇬🇧', time: lon.timeStr, open: lonOpen, status: lonStatus },
      { code: 'NYSE', name: 'NYC', flag: '🇺🇸', time: ny.timeStr, open: nyOpen, status: nyStatus },
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
        gap: '4px',
        background: 'var(--bg-panel-dark)',
        padding: '2px 6px',
        borderRadius: '4px',
        border: 'var(--border-hairline)',
        cursor: 'pointer',
        userSelect: 'none',
        flexWrap: 'nowrap'
      }}
    >
      <span style={{
        fontSize: '9px',
        color: 'var(--text-muted)',
        fontWeight: '800',
        letterSpacing: '0.04em',
        paddingRight: '2px',
        display: 'flex',
        alignItems: 'center',
        gap: '3px'
      }}>
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 4px var(--accent-green)' }} />
        BURSA
      </span>

      {sessions.map((s, idx) => (
        <React.Fragment key={s.code}>
          {idx > 0 && <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '9px' }}>·</span>}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '1px 3px'
            }}
          >
            <span style={{ fontSize: '10px' }}>{s.flag}</span>
            <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '10px' }}>{s.name}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{s.time}</span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: s.open ? 'var(--accent-green)' : s.status === 'PRE-MKT' || s.status === 'ISTIRAHAT' ? 'var(--accent-orange)' : 'var(--accent-rust)',
                boxShadow: s.open ? '0 0 5px var(--accent-green)' : 'none',
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
