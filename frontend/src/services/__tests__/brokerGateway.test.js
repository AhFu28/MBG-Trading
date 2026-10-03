import { describe, it, expect, beforeEach, vi } from 'vitest';

// localStorage stub (jsdom provides it, but keep an isolated store per test run)
const store = new Map();
const localStorageMock = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const { PaperBroker, BROKER_FEES } = await import('../brokerGateway.js');

const IDX = { symbol: 'BBCA', market: 'IDX', price: 10000, lots: 1 }; // 100 shares, Rp 1,000,000 notional
const CRYPTO = { symbol: 'BTCUSDT', market: 'CRYPTO', price: 100, quantity: 10 }; // $1,000 notional

describe('PaperBroker v2 — LONG spot accounting', () => {
  beforeEach(() => {
    store.clear();
  });

  it('open BUY long: deducts notional + buy fee from cash', () => {
    const b = new PaperBroker();
    b.reset();
    const pos = b.placeOrder({ ...IDX, side: 'BUY', stopLoss: 9500, target1: 10500, target2: 11000 });
    const fee = 1_000_000 * BROKER_FEES.IDX_EQUITY.buy; // 0.15% = 1,500
    expect(b.portfolio.cashIdr).toBeCloseTo(100_000_000 - 1_000_000 - fee, 6);
    expect(pos.side).toBe('LONG');
    expect(pos.quantity).toBe(100);
  });

  it('close LONG at TP2: cash = initial + PnL − both fees', () => {
    const b = new PaperBroker();
    b.reset();
    b.placeOrder({ ...IDX, side: 'BUY', stopLoss: 9500, target1: 10500, target2: 11000 });
    const closed = b.closePosition(b.portfolio.positions[0].id, 11000, 'MANUAL');
    const buyFee = 1_000_000 * BROKER_FEES.IDX_EQUITY.buy;
    const sellFee = 1_100_000 * BROKER_FEES.IDX_EQUITY.sell; // 0.25% of exit notional
    const expectedPnL = 100_000 - buyFee - sellFee;
    expect(closed.realizedPnL).toBeCloseTo(expectedPnL, 4);
    expect(b.portfolio.cashIdr).toBeCloseTo(100_000_000 + expectedPnL, 4);
  });

  it('close LONG at SL: realizes a loss capped at risk + fees', () => {
    const b = new PaperBroker();
    b.reset();
    b.placeOrder({ ...IDX, side: 'BUY', stopLoss: 9500, target1: 10500 });
    const closed = b.closePosition(b.portfolio.positions[0].id, 9500, 'STOP_LOSS_HIT');
    const buyFee = 1_000_000 * BROKER_FEES.IDX_EQUITY.buy;
    const sellFee = 950_000 * BROKER_FEES.IDX_EQUITY.sell;
    expect(closed.realizedPnL).toBeCloseTo(-50_000 - buyFee - sellFee, 4);
    expect(closed.realizedPnL).toBeLessThan(0);
  });

  it('tick: LONG triggers SL below entry and TP2 above entry', () => {
    const b = new PaperBroker();
    b.reset();
    b.placeOrder({ ...CRYPTO, side: 'BUY', stopLoss: 95, target1: 105, target2: 110 });
    const id = b.portfolio.positions[0].id;

    b.updatePositionsOnTick({ BTCUSDT: { price: 94 } }); // SL hit
    expect(b.portfolio.positions.length).toBe(0);
    expect(b.portfolio.tradeHistory[0].closeReason).toBe('STOP_LOSS_HIT');

    b.placeOrder({ ...CRYPTO, side: 'BUY', stopLoss: 95, target1: 105, target2: 110 });
    b.updatePositionsOnTick({ BTCUSDT: { price: 111 } }); // TP2 hit
    expect(b.portfolio.positions.length).toBe(0);
    expect(b.portfolio.tradeHistory[0].closeReason).toBe('TARGET_2_MAX_PROFIT');
  });

  it('tick: TP1 touch ratchets effective SL to entry (breakeven)', () => {
    const b = new PaperBroker();
    b.reset();
    b.placeOrder({ ...CRYPTO, side: 'BUY', stopLoss: 95, target1: 105 });
    b.updatePositionsOnTick({ BTCUSDT: { price: 106 } });
    expect(b.portfolio.positions[0].hasHitTp1).toBe(true);
    expect(b.portfolio.positions[0].effectiveSl).toBe(100);
  });
});

describe('PaperBroker v2 — SHORT accounting (crypto only)', () => {
  beforeEach(() => store.clear());

  it('open SELL short: margin hold = notional + fee; cash reduced', () => {
    const b = new PaperBroker();
    b.reset();
    const pos = b.placeOrder({ ...CRYPTO, side: 'SELL', stopLoss: 105, target1: 95, target2: 90 });
    const fee = 1_000 * BROKER_FEES.CRYPTO_SPOT.taker;
    expect(pos.side).toBe('SHORT');
    expect(b.portfolio.cashUsdt).toBeCloseTo(10_000 - 1_000 - fee, 6);
  });

  it('close SHORT in profit: PnL = (entry − exit) × qty − fees; cash reconciles', () => {
    const b = new PaperBroker();
    b.reset();
    b.placeOrder({ ...CRYPTO, side: 'SELL', stopLoss: 105, target1: 95, target2: 90 });
    const closed = b.closePosition(b.portfolio.positions[0].id, 90, 'MANUAL');
    const entryFee = 1_000 * BROKER_FEES.CRYPTO_SPOT.taker;   // on entry notional ($1,000)
    const exitFee = 900 * BROKER_FEES.CRYPTO_SPOT.taker;      // on exit notional ($900)
    const expectedPnL = (100 - 90) * 10 - entryFee - exitFee; // 100 − 1 − 0.9 = 98.1
    expect(closed.realizedPnL).toBeCloseTo(expectedPnL, 6);
    expect(b.portfolio.cashUsdt).toBeCloseTo(10_000 + expectedPnL, 6);
  });

  it('tick: SHORT triggers SL above entry and TP below entry', () => {
    const b = new PaperBroker();
    b.reset();
    b.placeOrder({ ...CRYPTO, side: 'SELL', stopLoss: 105, target1: 95, target2: 90 });

    b.updatePositionsOnTick({ BTCUSDT: { price: 106 } }); // SL (105 ratchet-safe) hit
    expect(b.portfolio.positions.length).toBe(0);
    expect(b.portfolio.tradeHistory[0].closeReason).toBe('STOP_LOSS_HIT');

    b.placeOrder({ ...CRYPTO, side: 'SELL', stopLoss: 105, target1: 95, target2: 90 });
    b.updatePositionsOnTick({ BTCUSDT: { price: 89 } }); // TP2 hit
    expect(b.portfolio.positions.length).toBe(0);
    expect(b.portfolio.tradeHistory[0].closeReason).toBe('TARGET_2_MAX_PROFIT');
  });

  it('tick: SHORT TP1 touch ratchets effective SL down to entry', () => {
    const b = new PaperBroker();
    b.reset();
    b.placeOrder({ ...CRYPTO, side: 'SELL', stopLoss: 105, target1: 95 });
    b.updatePositionsOnTick({ BTCUSDT: { price: 94 } });
    expect(b.portfolio.positions[0].hasHitTp1).toBe(true);
    expect(b.portfolio.positions[0].effectiveSl).toBe(100);
  });

  it('IDX rejects SELL/SHORT (OJK long-only)', () => {
    const b = new PaperBroker();
    b.reset();
    expect(() => b.placeOrder({ ...IDX, side: 'SELL', stopLoss: 10500, target1: 9500 }))
      .toThrow(/long-only/i);
  });

  it('rejects invalid bracket geometry', () => {
    const b = new PaperBroker();
    b.reset();
    // LONG with SL above entry → reject
    expect(() => b.placeOrder({ ...CRYPTO, side: 'BUY', stopLoss: 105, target1: 110 }))
      .toThrow(/DI BAWAH/i);
    // SHORT with SL below entry → reject
    expect(() => b.placeOrder({ ...CRYPTO, side: 'SELL', stopLoss: 95, target1: 90 }))
      .toThrow(/DI ATAS/i);
  });
});

describe('PaperBroker v2 — guards', () => {
  beforeEach(() => store.clear());

  it('kill switch blocks new orders', () => {
    const b = new PaperBroker();
    b.reset();
    b.setKillSwitch(true);
    expect(() => b.placeOrder({ ...IDX, side: 'BUY', stopLoss: 9500 })).toThrow(/KILL SWITCH/i);
    b.setKillSwitch(false);
  });

  it('insufficient cash is rejected', () => {
    const b = new PaperBroker();
    b.reset(1_000_000, 100); // tiny balances
    expect(() => b.placeOrder({ ...CRYPTO, side: 'BUY', quantity: 10 })).toThrow(/Saldo tidak mencukupi/i);
  });

  it('legacy portfolio data is normalized to LONG on load (schema v2)', () => {
    store.set('mbg_paper_portfolio_v5', JSON.stringify({
      cashIdr: 50_000_000,
      cashUsdt: 5_000,
      initialCashIdr: 100_000_000,
      initialCashUsdt: 10_000,
      positions: [{ id: 'X1', symbol: 'BBCA', market: 'IDX', side: 'BUY', quantity: 100, entryPrice: 10000, notional: 1_000_000, entryFee: 1500 }],
      tradeHistory: []
    }));
    const b = new PaperBroker();
    expect(b.portfolio.schemaVersion).toBe(2);
    expect(b.portfolio.positions[0].side).toBe('LONG');
  });
});

describe('Browser live execution boundary', () => {
  it('rejects account and order calls without contacting a broker or retaining keys', async () => {
    const { BinanceLiveAdapter } = await import('../brokerGateway.js');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    try {
      const adapter = new BinanceLiveAdapter('test-key', 'test-secret', false);
      await expect(adapter.testConnection()).rejects.toThrow('disabled');
      await expect(adapter.placeOrder({ symbol: 'TEST', quantity: 1 })).rejects.toThrow('disabled');
      expect(adapter.apiKey).toBeUndefined();
      expect(adapter.secretKey).toBeUndefined();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
});
