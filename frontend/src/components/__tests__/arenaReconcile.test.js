import { describe, it, expect } from 'vitest';
import { reconcileArenaPositions, reconcileArenaJournal } from '../AiAgentArenaTab.jsx';

/**
 * The arena is ONE engine shared by every account. Owner decision (2026-10-08):
 * "semua orang akan melihat yg sama aja".
 *
 * The previous merge broke that guarantee. It read:
 *
 *   setPositions(prev => prev.length === 0 ? cloudState.positions : prev)
 *
 * so a browser that had ever held a single position stopped accepting machine
 * state permanently. The owner noticed the symptom — "cache ku dan cache mas
 * fuad beda" — and the cause was that the two browsers had diverged and could
 * never reconverge.
 *
 * These tests pin the rules that replace it.
 */

const enginePos = (id, extra = {}) => ({
  id, agentId: 'WATER', symbol: 'BTCUSDT', market: 'CRYPTO',
  direction: 'LONG', entryPrice: 92000, currentPrice: 92000,
  origin: 'engine', ...extra,
});

describe('reconcileArenaPositions', () => {
  it('adopts machine positions into an empty browser', () => {
    const cloud = [enginePos('P1'), enginePos('P2')];
    const result = reconcileArenaPositions([], cloud);
    expect(result.map(p => p.id)).toEqual(['P1', 'P2']);
  });

  it('still adopts machine positions when the browser already has one', () => {
    // THE REGRESSION. A non-empty local list used to block the server forever.
    const local = [{ symbol: 'ETHUSDT', entryPrice: 2500, origin: 'local' }];
    const cloud = [enginePos('P1'), enginePos('P2')];

    const result = reconcileArenaPositions(local, cloud);
    const symbols = result.map(p => p.symbol);

    expect(symbols).toContain('BTCUSDT');
    expect(symbols).toContain('ETHUSDT');
    expect(result).toHaveLength(3);
  });

  it('refreshes a position both sides know, without duplicating it', () => {
    // Same id, newer price from the engine.
    const local = [enginePos('P1', { currentPrice: 91000 })];
    const cloud = [enginePos('P1', { currentPrice: 93500 })];

    const result = reconcileArenaPositions(local, cloud);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('P1');
    expect(result[0].currentPrice).toBe(93500);
  });

  it('drops a machine position the server no longer reports', () => {
    // The engine closed it. Leaving it on screen would show a trade that is
    // already done — the opposite of syncing.
    const local = [enginePos('P1'), enginePos('P-CLOSED')];
    const cloud = [enginePos('P1')];

    const result = reconcileArenaPositions(local, cloud);

    expect(result.map(p => p.id)).toEqual(['P1']);
  });

  it('keeps a local-only position the engine never opened', () => {
    // The user's own paper trade. Not the engine's to delete.
    // It carries no server id, so it cannot collide with engine rows.
    const local = [{ agentId: 'FIRE', symbol: 'ETHUSDT', entryPrice: 2500, origin: 'local' }];
    const result = reconcileArenaPositions(local, [enginePos('P1')]);
    expect(result).toHaveLength(2);
  });

  it('keeps an untagged position with no id, rather than losing the user row', () => {
    // No id means it cannot be matched. Dropping it would silently delete data;
    // showing a stale row is the safer failure.
    const local = [{ agentId: 'FIRE', symbol: 'ETHUSDT', entryPrice: 2500 }];
    const result = reconcileArenaPositions(local, [enginePos('P1')]);
    expect(result).toHaveLength(2);
  });

  it('does not claim an untagged row is engine-owned when the id is unknown', () => {
    // The local list in the app always carries ids for engine rows, so a local
    // row with no id is genuinely the user's.
    const local = [{ symbol: 'BBCA', entryPrice: 6350 }];
    const result = reconcileArenaPositions(local, []);
    expect(result).toHaveLength(1);
  });

  it('treats a local row with an engine id as engine-owned, not a duplicate', () => {
    // A position created before the `origin` tag existed must not be mistaken
    // for a user row and kept alongside its own server copy.
    const local = [{ id: 'P1', agentId: 'WATER', entryPrice: 92000 }];
    const cloud = [enginePos('P1')];
    const result = reconcileArenaPositions(local, cloud);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('P1');
  });

  it('handles missing or malformed input without throwing', () => {
    expect(reconcileArenaPositions(null, null)).toEqual([]);
    expect(reconcileArenaPositions(undefined, [enginePos('P1')])).toHaveLength(1);
    // Junk entries must be skipped, not rendered.
    expect(reconcileArenaPositions([null, undefined], [null])).toEqual([]);
  });

  it('drops engine-tagged rows when the server reports nothing at all', () => {
    // An empty server roster means the engine holds no positions. A locally
    // cached engine row is therefore closed, and must not linger.
    // Note the distinction: a LOCAL row with no id survives (see below).
    expect(reconcileArenaPositions([enginePos('P1')], [])).toEqual([]);
    expect(reconcileArenaPositions([enginePos('P1'), { symbol: 'BBCA' }], [])).toHaveLength(1);
  });

  it('produces the same roster for two accounts against the same engine', () => {
    // The owner's actual requirement: Jendral and Kamerad Fuad see one arena.
    const engineRoster = [enginePos('P1'), enginePos('P2'), enginePos('P3')];

    const jendralLocal = [enginePos('P1'), enginePos('P-STALE')];
    const fuadLocal = [enginePos('P2', { origin: 'local', currentPrice: 999 })];

    const jendralView = reconcileArenaPositions(jendralLocal, engineRoster);
    const fuadView = reconcileArenaPositions(fuadLocal, engineRoster);

    // Both see all three engine positions.
    for (const id of ['P1', 'P2', 'P3']) {
      expect(jendralView.map(p => p.id)).toContain(id);
      expect(fuadView.map(p => p.id)).toContain(id);
    }
    // Neither still shows the closed one.
    expect(jendralView.map(p => p.id)).not.toContain('P-STALE');
  });
});

describe('reconcileArenaJournal', () => {
  const trade = (id, closedAt) => ({ id, closedAt, pnlIdr: 1000, isWin: true });

  it('unions local and cloud history instead of replacing it', () => {
    const local = [trade('T1', '2026-10-01T00:00:00Z')];
    const cloud = [trade('T2', '2026-10-02T00:00:00Z')];

    const result = reconcileArenaJournal(local, cloud);
    expect(result.map(t => t.id).sort()).toEqual(['T1', 'T2']);
  });

  it('prefers the engine copy when both describe the same trade', () => {
    const local = [{ id: 'T1', closedAt: '2026-10-01T00:00:00Z', pnlIdr: 0 }];
    const cloud = [{ id: 'T1', closedAt: '2026-10-01T00:00:00Z', pnlIdr: 5000 }];

    const result = reconcileArenaJournal(local, cloud);
    expect(result).toHaveLength(1);
    expect(result[0].pnlIdr).toBe(5000);
  });

  it('sorts newest first', () => {
    const result = reconcileArenaJournal(
      [trade('OLD', '2026-09-01T00:00:00Z')],
      [trade('NEW', '2026-10-05T00:00:00Z')],
    );
    expect(result[0].id).toBe('NEW');
  });

  it('handles missing input without throwing', () => {
    expect(reconcileArenaJournal(null, null)).toEqual([]);
    expect(reconcileArenaJournal(undefined, [trade('T1', '2026-10-01T00:00:00Z')])).toHaveLength(1);
  });

  it('never loses a local-only trade', () => {
    // The journal is a historical record. Losing a row would rewrite history.
    const local = [trade('T1', '2026-10-01T00:00:00Z'), trade('T2', '2026-10-02T00:00:00Z')];
    const result = reconcileArenaJournal(local, []);
    expect(result).toHaveLength(2);
  });
});
