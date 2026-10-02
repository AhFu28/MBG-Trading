/**
 * Multi-chain Memecoin & Degen Desk data layer.
 *
 * Sources, all keyless and verified live:
 *   - pump.fun frontend-api-v3 : new Solana launches + bonding-curve progress
 *   - DexScreener               : prices/volume for solana, robinhood, bsc (Aster), hyperevm
 *
 * ponytail: DexScreener is rate-limited (~300 req/min). Poll at 20s and let the
 * browser cache; switch to a server route with a shared cache if throughput matters.
 */

// Verified against the live API: `sort` accepts only
// created_timestamp | market_cap | ath_market_cap | reply_count | last_reply | last_trade_timestamp
const PUMPFUN_NEW = 'https://frontend-api-v3.pump.fun/coins?offset=0&limit=40&sort=created_timestamp&order=DESC&includeNsfw=false';
const DEXSCREENER_TOKENS = 'https://api.dexscreener.com/latest/dex/tokens/';
const DEXSCREENER_BOOSTS = 'https://api.dexscreener.com/token-boosts/top/v1';

/** Chains we track. DexScreener chainId values are authoritative. */
export const TRACKED_CHAINS = {
  solana: { label: 'Solana', icon: '🟣', router: 'Jupiter', color: '#9945FF' },
  robinhood: { label: 'Robinhood Chain', icon: '🪶', router: 'Native DEX', color: '#00C805' },
  bsc: { label: 'BSC (Aster)', icon: '🟡', router: 'Aster DEX', color: '#F0B90B' },
  hyperevm: { label: 'HyperEVM (Aster)', icon: '⚡', router: 'Aster DEX', color: '#00D4AA' },
};

/** Pump.fun bonding curve completes at ~85 SOL raised. */
const PUMPFUN_GRADUATION_SOL = 85;

/**
 * Red flags computed from raw on-chain/curve data only. No scoring theatre:
 * each flag is a concrete, checkable fact.
 */
export function computeRugChecks(token) {
  const flags = [];
  const sol = token.real_sol_reserves ? token.real_sol_reserves / 1e9 : 0;
  const mcap = token.usd_market_cap || token.market_cap_usd || 0;
  const progress = Math.min(100, Math.round((sol / PUMPFUN_GRADUATION_SOL) * 100));

  if (sol < 5) flags.push({ level: 'danger', text: `Likuiditas sangat tipis (${sol.toFixed(2)} SOL)` });
  else if (sol < 20) flags.push({ level: 'warn', text: `Likuiditas tipis (${sol.toFixed(2)} SOL)` });

  if (progress >= 100) flags.push({ level: 'good', text: 'Bonding curve LULUS (siap Raydium)' });
  else if (progress > 60) flags.push({ level: 'warn', text: `Bonding curve ${progress}% — belum lulus` });

  if (token.complete === true && progress < 50) {
    flags.push({ level: 'warn', text: 'Ditandai complete tapi likuiditas rendah — verifikasi manual' });
  }
  if (!token.twitter && !token.website) {
    flags.push({ level: 'danger', text: 'Tanpa sosial media / website terdaftar' });
  }
  if (mcap > 0 && mcap < 5000) {
    flags.push({ level: 'danger', text: `Market cap mikro ($${Math.round(mcap).toLocaleString()}) — mudah dimanipulasi` });
  }
  if (token.transfer_fee_bps > 0) {
    flags.push({ level: 'warn', text: `Transfer fee ${token.transfer_fee_bps} bps aktif` });
  }
  if (token.is_banned || token.nsfw) {
    flags.push({ level: 'danger', text: 'Token ditandai banned/NSFW oleh pump.fun' });
  }

  const dangerCount = flags.filter(f => f.level === 'danger').length;
  const verdict = dangerCount >= 2 ? 'HIGH_RISK' : dangerCount === 1 ? 'CAUTION' : 'CLEAN';
  return { flags, progress, verdict };
}

/** Fetch freshly launched pump.fun tokens with computed rug checks. */
export async function fetchPumpFunLaunches() {
  const res = await fetch(PUMPFUN_NEW, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`pump.fun HTTP ${res.status}`);
  const raw = await res.json();
  return (Array.isArray(raw) ? raw : []).map(t => {
    const ageMs = Date.now() - (t.created_timestamp || 0);
    return {
      chain: 'solana',
      mint: t.mint,
      symbol: (t.symbol || '?').toUpperCase(),
      name: t.name || '?',
      icon: t.image_uri || '',
      mcapUsd: t.usd_market_cap || t.market_cap_usd || 0,
      ageMinutes: Math.max(0, Math.round(ageMs / 60000)),
      progress: computeRugChecks(t).progress,
      rug: computeRugChecks(t),
      twitter: t.twitter || '',
      website: t.website || '',
      pumpUrl: `https://pump.fun/coin/${t.mint}`,
    };
  });
}

/**
 * Fetch live pair data for tokens on any tracked chain via DexScreener.
 * Batches up to 30 addresses per call (DexScreener's documented limit).
 */
export async function fetchDexPairs(addresses) {
  if (!addresses?.length) return [];
  const chunks = [];
  for (let i = 0; i < addresses.length; i += 30) {
    chunks.push(addresses.slice(i, i + 30).join(','));
  }
  const results = await Promise.all(
    chunks.map(async chunk => {
      const res = await fetch(`${DEXSCREENER_TOKENS}${chunk}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json?.pairs || [];
    })
  );
  return results.flat();
}

/** Boosted = paid promotion. Useful as a "what's being shilled right now" board. */
export async function fetchBoostedTokens() {
  const res = await fetch(DEXSCREENER_BOOSTS);
  if (!res.ok) throw new Error(`boosts HTTP ${res.status}`);
  const raw = await res.json();
  return (Array.isArray(raw) ? raw : [])
    .filter(t => TRACKED_CHAINS[t.chainId])
    .slice(0, 24)
    .map(t => ({
      chain: t.chainId,
      address: t.tokenAddress,
      description: t.description || '(tanpa deskripsi)',
      icon: t.icon?.startsWith('http') ? t.icon : '',
      boostAmount: t.totalAmount || 0,
      url: t.url,
      links: t.links || [],
    }));
}

/** Normalize a DexScreener pair into a row the desk can render. */
export function normalizePair(pair) {
  const chg = pair.priceChange || {};
  const vol = pair.volume || {};
  const liq = pair.liquidity?.usd || 0;
  return {
    chain: pair.chainId,
    dex: pair.dexId,
    pairAddress: pair.pairAddress,
    symbol: (pair.baseToken?.symbol || '?').toUpperCase(),
    name: pair.baseToken?.name || '',
    address: pair.baseToken?.address,
    priceUsd: parseFloat(pair.priceUsd || 0),
    change5m: chg.m5 ?? null,
    change1h: chg.h1 ?? null,
    change24h: chg.h24 ?? null,
    volume24h: vol.h24 || 0,
    liquidityUsd: liq,
    mcap: pair.marketCap || pair.fdv || 0,
    created: pair.pairCreatedAt || null,
    url: pair.url,
    // Liquidity under $10k on a memecoin is where you get exit-scammed.
    thinLiquidity: liq > 0 && liq < 10000,
  };
}

/** Age in minutes of a pair, or null when unknown. */
export function pairAgeMinutes(pair) {
  if (!pair.created) return null;
  return Math.max(0, Math.round((Date.now() - pair.created) / 60000));
}
