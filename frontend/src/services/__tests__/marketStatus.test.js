import { describe, it, expect } from 'vitest';
import {
  computeMarketStatuses,
  rankTopicsFromHeadlines,
  topKeywordsFromHeadlines,
  formatDuration,
} from '../marketOverview.js';

/**
 * Tests for the market-status and topic-ranking helpers added on 2026-10-08.
 *
 * These are pure functions of their inputs (a clock, a list of headlines), so
 * they can be pinned exactly instead of being mocked.
 */

describe('computeMarketStatuses', () => {
  it('reports crypto as always open', () => {
    // Crypto never closes, so this must hold at any instant.
    for (const iso of ['2026-10-08T00:00:00Z', '2026-10-08T12:00:00Z', '2026-10-11T03:00:00Z']) {
      const crypto = computeMarketStatuses(new Date(iso)).find(s => s.id === 'CRYPTO');
      expect(crypto.state).toBe('OPEN');
    }
  });

  it('reports IDX as closed on a Sunday', () => {
    // 2026-10-11 is a Sunday in Jakarta.
    const idx = computeMarketStatuses(new Date('2026-10-11T04:00:00Z')).find(s => s.id === 'IDX');
    expect(idx.state).toBe('CLOSED');
    expect(idx.detail).toBe('Akhir pekan');
  });

  it('reports IDX as open during the Jakarta morning session on a weekday', () => {
    // Thursday 2026-10-08, 10:00 WIB = 03:00 UTC.
    const idx = computeMarketStatuses(new Date('2026-10-08T03:00:00Z')).find(s => s.id === 'IDX');
    expect(idx.state).toBe('OPEN');
  });

  it('reports IDX as on break during the midday gap', () => {
    // 12:30 WIB sits inside the 12:00-13:30 break.
    const idx = computeMarketStatuses(new Date('2026-10-08T05:30:00Z')).find(s => s.id === 'IDX');
    expect(idx.state).toBe('BREAK');
  });

  it('always returns a state and a human detail for every venue', () => {
    const statuses = computeMarketStatuses(new Date('2026-10-08T03:00:00Z'));
    expect(statuses.length).toBe(5);
    for (const s of statuses) {
      expect(['OPEN', 'BREAK', 'CLOSED']).toContain(s.state);
      expect(typeof s.detail).toBe('string');
      expect(s.detail.length).toBeGreaterThan(0);
      expect(s.name).toBeTruthy();
    }
  });

  it('never reports two incompatible states at once', () => {
    // A sanity sweep across a full week at 3-hour steps.
    for (let h = 0; h < 168; h += 3) {
      const at = new Date(Date.UTC(2026, 9, 5, h));
      for (const s of computeMarketStatuses(at)) {
        expect(['OPEN', 'BREAK', 'CLOSED']).toContain(s.state);
      }
    }
  });
});

describe('formatDuration', () => {
  it('renders hours and minutes', () => {
    expect(formatDuration(135)).toBe('2 jam 15 menit');
  });

  it('renders days once past 24 hours', () => {
    expect(formatDuration(1500)).toBe('1 hari 1 jam');
  });

  it('renders minutes only for short spans', () => {
    expect(formatDuration(45)).toBe('45 menit');
  });

  it('uses the magnitude so it works for past and future alike', () => {
    expect(formatDuration(-135)).toBe('2 jam 15 menit');
  });
});

describe('rankTopicsFromHeadlines', () => {
  it('groups headlines into the topics they actually mention', () => {
    const rows = [
      { title: 'Nvidia AI chip demand surges' },
      { title: 'Bitcoin ETF inflows hit record' },
      { title: 'Fed holds rates steady' },
    ];
    const topics = rankTopicsFromHeadlines(rows);
    const ids = topics.map(t => t.id);
    expect(ids).toContain('AI');
    expect(ids).toContain('CRYPTO');
    expect(ids).toContain('MACRO');
  });

  it('sorts by count so the busiest topic is first', () => {
    const rows = [
      { title: 'Bitcoin rallies' },
      { title: 'Crypto market cap climbs' },
      { title: 'Altcoin season returns' },
      { title: 'Gold steadies' },
    ];
    const topics = rankTopicsFromHeadlines(rows);
    expect(topics[0].id).toBe('CRYPTO');
    expect(topics[0].count).toBe(3);
  });

  it('recognises AI headlines, which the owner explicitly asked for', () => {
    // "gacuma crypto tapi saham, forex, atau bahkan AI sekalipun"
    const topics = rankTopicsFromHeadlines([{ title: 'OpenAI dan perlombaan chip AI' }]);
    expect(topics.some(t => t.id === 'AI')).toBe(true);
  });

  it('omits topics with no matching headline rather than showing a zero bar', () => {
    const topics = rankTopicsFromHeadlines([{ title: 'Bitcoin only headline' }]);
    expect(topics.every(t => t.count > 0)).toBe(true);
  });

  it('accepts both `title` and `headline` field names', () => {
    const viaTitle = rankTopicsFromHeadlines([{ title: 'Bitcoin up' }]);
    const viaHeadline = rankTopicsFromHeadlines([{ headline: 'Bitcoin up' }]);
    expect(viaTitle[0].id).toBe('CRYPTO');
    expect(viaHeadline[0].id).toBe('CRYPTO');
  });

  it('returns an empty array for no news instead of throwing', () => {
    expect(rankTopicsFromHeadlines([])).toEqual([]);
    expect(rankTopicsFromHeadlines(null)).toEqual([]);
    expect(rankTopicsFromHeadlines(undefined)).toEqual([]);
  });
});

describe('topKeywordsFromHeadlines', () => {
  it('surfaces repeated meaningful words', () => {
    const rows = [
      { title: 'Nvidia earnings beat expectations' },
      { title: 'Nvidia raises guidance' },
      { title: 'Markets watch Nvidia' },
    ];
    const words = topKeywordsFromHeadlines(rows);
    expect(words[0].word).toBe('nvidia');
    expect(words[0].count).toBe(3);
  });

  it('drops stopwords so they do not outrank real topics', () => {
    const rows = [
      { title: 'the market and the fed' },
      { title: 'the market and the rate' },
    ];
    const words = topKeywordsFromHeadlines(rows).map(w => w.word);
    expect(words).not.toContain('the');
    expect(words).not.toContain('and');
    expect(words).toContain('market');
  });

  it('only reports words seen at least twice', () => {
    const words = topKeywordsFromHeadlines([{ title: 'Unique singleton phrase' }]);
    expect(words).toEqual([]);
  });

  it('returns an empty array for empty input', () => {
    expect(topKeywordsFromHeadlines([])).toEqual([]);
    expect(topKeywordsFromHeadlines(null)).toEqual([]);
  });
});
