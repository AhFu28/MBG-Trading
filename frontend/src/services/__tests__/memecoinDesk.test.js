import { describe, it, expect } from 'vitest';
import { computeRugChecks, normalizePair } from '../memecoinDesk.js';

describe('computeRugChecks', () => {
  it('flags a brand-new token with no socials and thin liquidity as HIGH_RISK', () => {
    const fresh = {
      real_sol_reserves: 2e9,        // 2 SOL
      usd_market_cap: 3400,
      twitter: '',
      website: '',
      complete: false,
      transfer_fee_bps: 0,
    };
    const r = computeRugChecks(fresh);
    expect(r.verdict).toBe('HIGH_RISK');
    expect(r.flags.some(f => f.level === 'danger' && /Likuiditas sangat tipis/.test(f.text))).toBe(true);
    expect(r.flags.some(f => /Tanpa sosial media/.test(f.text))).toBe(true);
  });

  it('reports a graduated token with socials as CLEAN', () => {
    const solid = {
      real_sol_reserves: 90e9,       // 90 SOL — past graduation
      usd_market_cap: 250000,
      twitter: 'https://x.com/x',
      website: 'https://x.com',
      complete: true,
      transfer_fee_bps: 0,
    };
    const r = computeRugChecks(solid);
    expect(r.verdict).toBe('CLEAN');
    expect(r.progress).toBe(100);
    expect(r.flags.some(f => /LULUS/.test(f.text))).toBe(true);
  });

  it('never returns progress above 100 even past the curve threshold', () => {
    const r = computeRugChecks({ real_sol_reserves: 500e9, twitter: 'x', website: 'y' });
    expect(r.progress).toBe(100);
  });

  it('marks CAUTION (not HIGH_RISK) with exactly one danger flag', () => {
    // Healthy liquidity + socials, but a banned token = exactly one danger flag.
    const oneDanger = {
      real_sol_reserves: 40e9,
      usd_market_cap: 50000,
      twitter: 'https://x.com/x',
      website: 'https://x.com',
      complete: false,
      transfer_fee_bps: 0,
      is_banned: true,
    };
    const r = computeRugChecks(oneDanger);
    expect(r.flags.filter(f => f.level === 'danger')).toHaveLength(1);
    expect(r.verdict).toBe('CAUTION');
  });
});

describe('normalizePair', () => {
  it('flags thin liquidity below $10k as a scam-exit risk', () => {
    const row = normalizePair({
      chainId: 'solana',
      dexId: 'raydium',
      pairAddress: 'abc',
      baseToken: { symbol: 'wif', name: 'dogwifhat', address: 'mint1' },
      priceUsd: '2.38',
      volume: { h24: 5000 },
      liquidity: { usd: 4200 },
      priceChange: { m5: 1.2, h1: -3, h24: 12 },
      marketCap: 100000,
      pairCreatedAt: 1790932800000,
      url: 'https://dexscreener.com/solana/abc',
    });
    expect(row.symbol).toBe('WIF');
    expect(row.priceUsd).toBeCloseTo(2.38);
    expect(row.thinLiquidity).toBe(true);
    expect(row.change24h).toBe(12);
  });

  it('does not flag healthy liquidity', () => {
    const row = normalizePair({
      chainId: 'robinhood',
      dexId: 'uniswap',
      baseToken: { symbol: 'genie' },
      priceUsd: '0.5',
      liquidity: { usd: 250000 },
      volume: { h24: 90000 },
      priceChange: {},
    });
    expect(row.thinLiquidity).toBe(false);
    expect(row.change1h).toBeNull();
  });
});
