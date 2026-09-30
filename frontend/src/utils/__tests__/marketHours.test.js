import { describe, it, expect } from 'vitest';

const { isIdxMarketOpen, isUsMarketOpen, isForexCommodityOpen, getIdxSessionDetail } = await import('../marketHours.js');

// Anchor week: Jan 5 2026 = Monday (UTC+7 = WIB). Construct instants with explicit offsets.
const WIB = '+07:00';
const NY_EST = '-05:00'; // January = EST

describe('IDX market hours', () => {
  it('open during SesI 1 Monday 09:30 WIB', () => {
    expect(isIdxMarketOpen(new Date(`2026-01-05T09:30:00${WIB}`))).toBe(true);
  });

  it('polling flag stays true through lunch break (12:30 WIB)', () => {
    // isIdxMarketOpen is the polling gate; session detail handles ISTIRAHAT
    expect(isIdxMarketOpen(new Date(`2026-01-05T12:30:00${WIB}`))).toBe(true);
    expect(getIdxSessionDetail(new Date(`2026-01-05T12:30:00${WIB}`)).status).toBe('ISTIRAHAT');
  });

  it('open right up to 16:00 WIB close boundary', () => {
    expect(isIdxMarketOpen(new Date(`2026-01-05T16:00:00${WIB}`))).toBe(true);
    expect(isIdxMarketOpen(new Date(`2026-01-05T16:01:00${WIB}`))).toBe(false);
  });

  it('closed before open (08:59 WIB)', () => {
    expect(isIdxMarketOpen(new Date(`2026-01-05T08:59:00${WIB}`))).toBe(false);
  });

  it('closed on weekend (Saturday)', () => {
    expect(isIdxMarketOpen(new Date(`2026-01-10T10:00:00${WIB}`))).toBe(false);
  });

  it('Friday lunch (ISTIRAHAT) 11:30–14:00, then SESI 2', () => {
    expect(getIdxSessionDetail(new Date(`2026-01-09T12:30:00${WIB}`)).status).toBe('ISTIRAHAT');
    expect(getIdxSessionDetail(new Date(`2026-01-09T13:59:00${WIB}`)).status).toBe('ISTIRAHAT');
    expect(getIdxSessionDetail(new Date(`2026-01-09T14:01:00${WIB}`)).status).toBe('SESI 2');
  });
});

describe('US market hours', () => {
  it('open during regular session (10:00 ET)', () => {
    expect(isUsMarketOpen(new Date(`2026-01-05T10:00:00${NY_EST}`))).toBe(true);
  });

  it('closed at 16:01 ET', () => {
    expect(isUsMarketOpen(new Date(`2026-01-05T16:01:00${NY_EST}`))).toBe(false);
  });

  it('closed on weekend', () => {
    expect(isUsMarketOpen(new Date(`2026-01-10T12:00:00${NY_EST}`))).toBe(false);
  });
});

describe('Forex/Commodity 24/5 hours', () => {
  it('open midweek any hour', () => {
    expect(isForexCommodityOpen(new Date(`2026-01-07T03:00:00${NY_EST}`))).toBe(true);
  });

  it('closes Friday after 17:00 ET', () => {
    expect(isForexCommodityOpen(new Date(`2026-01-09T16:00:00${NY_EST}`))).toBe(true);
    expect(isForexCommodityOpen(new Date(`2026-01-09T18:00:00${NY_EST}`))).toBe(false);
  });

  it('reopens Sunday after 17:00 ET', () => {
    expect(isForexCommodityOpen(new Date(`2026-01-11T16:00:00${NY_EST}`))).toBe(false);
    expect(isForexCommodityOpen(new Date(`2026-01-11T18:00:00${NY_EST}`))).toBe(true);
  });

  it('closed all Saturday', () => {
    expect(isForexCommodityOpen(new Date(`2026-01-10T12:00:00${NY_EST}`))).toBe(false);
  });
});
