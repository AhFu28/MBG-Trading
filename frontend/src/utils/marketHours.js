/**
 * MBG TRADING - Standardized Market Hours Classifier
 * Resolves trading sessions, weekend freeze, and open/closed state across all asset classes.
 */

export function getZoneInfo(date = new Date(), timeZone = 'Asia/Jakarta') {
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
    const second = parseInt(getVal('second'), 10) || 0;
    const weekday = getVal('weekday'); // 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
    const minuteOfDay = hour * 60 + minute;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return { hour, minute, second, weekday, minuteOfDay, timeStr };
  } catch {
    const d = date;
    const hour = d.getHours();
    const minute = d.getMinutes();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      hour,
      minute,
      second: d.getSeconds(),
      weekday: days[d.getDay()],
      minuteOfDay: hour * 60 + minute,
      timeStr: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    };
  }
}

/**
 * Bursa Efek Indonesia (IDX)
 * Jam perdagangan reguler: Senin - Jumat 09:00 - 16:00 WIB
 * Tutup pada Sabtu, Minggu, dan hari libur bursa.
 */
export function isIdxMarketOpen(now = new Date()) {
  const jkt = getZoneInfo(now, 'Asia/Jakarta');
  if (jkt.weekday === 'Sat' || jkt.weekday === 'Sun') return false;
  // 09:00 WIB = 540 min, 16:00 WIB = 960 min
  return jkt.minuteOfDay >= 540 && jkt.minuteOfDay <= 960;
}

export function getIdxSessionDetail(now = new Date()) {
  const jkt = getZoneInfo(now, 'Asia/Jakarta');
  if (jkt.weekday === 'Sat' || jkt.weekday === 'Sun') {
    return { isOpen: false, status: 'LIBUR', label: 'Bursa Libur (Weekend)', timeStr: jkt.timeStr };
  }
  const min = jkt.minuteOfDay;
  if (jkt.weekday === 'Fri') {
    if (min >= 540 && min < 690) return { isOpen: true, status: 'SESI 1', label: 'Sesi 1 Berjalan', timeStr: jkt.timeStr };
    if (min >= 690 && min < 840) return { isOpen: false, status: 'ISTIRAHAT', label: 'Istirahat Siang / Sholat Jumat', timeStr: jkt.timeStr };
    if (min >= 840 && min < 950) return { isOpen: true, status: 'SESI 2', label: 'Sesi 2 Berjalan', timeStr: jkt.timeStr };
    if (min >= 950 && min <= 960) return { isOpen: true, status: 'PRE-CLOSE', label: 'Pre-Closing & Post-Trading', timeStr: jkt.timeStr };
    return { isOpen: false, status: 'TUTUP', label: 'Bursa Tutup (Official Close)', timeStr: jkt.timeStr };
  } else {
    if (min >= 540 && min < 720) return { isOpen: true, status: 'SESI 1', label: 'Sesi 1 Berjalan', timeStr: jkt.timeStr };
    if (min >= 720 && min < 810) return { isOpen: false, status: 'ISTIRAHAT', label: 'Istirahat Siang', timeStr: jkt.timeStr };
    if (min >= 810 && min < 950) return { isOpen: true, status: 'SESI 2', label: 'Sesi 2 Berjalan', timeStr: jkt.timeStr };
    if (min >= 950 && min <= 960) return { isOpen: true, status: 'PRE-CLOSE', label: 'Pre-Closing & Post-Trading', timeStr: jkt.timeStr };
    return { isOpen: false, status: 'TUTUP', label: 'Bursa Tutup (Official Close)', timeStr: jkt.timeStr };
  }
}

/**
 * US Equities (NYSE / NASDAQ)
 * Reguler: Senin - Jumat 09:30 - 16:00 New York Time (EDT/EST)
 * Tutup pada Sabtu, Minggu, dan US Federal Holidays.
 */
export function isUsMarketOpen(now = new Date()) {
  const ny = getZoneInfo(now, 'America/New_York');
  if (ny.weekday === 'Sat' || ny.weekday === 'Sun') return false;
  // 09:30 NY = 570 min, 16:00 NY = 960 min
  return ny.minuteOfDay >= 570 && ny.minuteOfDay <= 960;
}

export function getUsSessionDetail(now = new Date()) {
  const ny = getZoneInfo(now, 'America/New_York');
  if (ny.weekday === 'Sat' || ny.weekday === 'Sun') {
    return { isOpen: false, status: 'LIBUR', label: 'Wall Street Libur (Weekend)', timeStr: ny.timeStr };
  }
  const min = ny.minuteOfDay;
  if (min >= 240 && min < 570) return { isOpen: false, status: 'PRE-MKT', label: 'Pre-Market Session', timeStr: ny.timeStr };
  if (min >= 570 && min < 960) return { isOpen: true, status: 'BUKA', label: 'Regular Trading Hours', timeStr: ny.timeStr };
  if (min >= 960 && min <= 1200) return { isOpen: false, status: 'AFTER-HRS', label: 'After-Hours Session', timeStr: ny.timeStr };
  return { isOpen: false, status: 'TUTUP', label: 'Market Closed', timeStr: ny.timeStr };
}

/**
 * Forex & Commodities CFD (Interbank 24/5)
 * Buka: Minggu 17:00 NY (Senin pagi WIB)
 * Tutup: Jumat 17:00 NY (Sabtu pagi WIB)
 * Weekend Tutup: Jumat 17:00 NY s/d Minggu 17:00 NY.
 */
export function isForexCommodityOpen(now = new Date()) {
  const ny = getZoneInfo(now, 'America/New_York');
  if (ny.weekday === 'Sat') return false;
  if (ny.weekday === 'Sun') {
    return ny.minuteOfDay >= 1020; // Buka setelah 17:00 NY (17 * 60 = 1020)
  }
  if (ny.weekday === 'Fri') {
    return ny.minuteOfDay < 1020; // Tutup setelah 17:00 NY
  }
  return true; // Mon, Tue, Wed, Thu 24 jam buka
}

/**
 * Crypto Spot & Derivatives
 * 24/7/365 Non-stop
 */
export function isCryptoOpen() {
  return true;
}

/**
 * Ringkasan Status Seluruh Aset
 */
export function getAllMarketStatuses(now = new Date()) {
  const idx = getIdxSessionDetail(now);
  const us = getUsSessionDetail(now);
  const fx = {
    isOpen: isForexCommodityOpen(now),
    status: isForexCommodityOpen(now) ? 'BUKA' : 'LIBUR',
    label: isForexCommodityOpen(now) ? 'Interbank 24/5 Live' : 'Market Closed (Weekend)'
  };
  const crypto = {
    isOpen: true,
    status: 'LIVE',
    label: 'Binance 24/7 Continuous'
  };

  return { idx, us, forex: fx, crypto };
}
