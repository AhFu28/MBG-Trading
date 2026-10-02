/**
 * Multi-chain Memecoin & Degen Desk data layer.
 *
 * Sources, all keyless and verified live:
 *   - pump.fun frontend-api-v3 : new Solana launches + bonding-curve progress
 *   - DexScreener               : prices/volume/txns for solana, robinhood, bsc (Aster), hyperevm
 *   - Jupiter lite-api          : holderCount, holder growth, organic score, token audit
 *
 * The Jupiter layer is what makes holder/insider analysis possible: DexScreener
 * exposes no holder field at all, but Jupiter's free lite-api returns holderCount,
 * stats*.holderChange, audit.topHoldersPercentage, audit.devBalancePercentage and
 * mint/freeze authority status — with NO API key required.
 *
 * ponytail: DexScreener is rate-limited (~300 req/min). Poll at 20s and let the
 * browser cache; switch to a server route with a shared cache if throughput matters.
 */

// Verified against the live API: `sort` accepts only
// created_timestamp | market_cap | ath_market_cap | reply_count | last_reply | last_trade_timestamp
const PUMPFUN_NEW = 'https://frontend-api-v3.pump.fun/coins?offset=0&limit=40&sort=created_timestamp&order=DESC&includeNsfw=false';
// "Currently being traded" — the pool where early accumulation actually shows up.
const PUMPFUN_ACTIVE = 'https://frontend-api-v3.pump.fun/coins?offset=0&limit=60&sort=last_trade_timestamp&order=DESC&includeNsfw=false';
const DEXSCREENER_TOKENS = 'https://api.dexscreener.com/latest/dex/tokens/';
const DEXSCREENER_BOOSTS = 'https://api.dexscreener.com/token-boosts/top/v1';
const JUPITER_SEARCH = 'https://lite-api.jup.ag/tokens/v2/search?query=';

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
 * Fetch holder + audit data for Solana tokens from Jupiter's free lite-api.
 *
 * This is the layer DexScreener lacks entirely. Returns a Map keyed by mint so
 * callers can enrich each row without caring about ordering.
 *
 * Verified live fields: holderCount, organicScore, organicScoreLabel, isVerified,
 * tags, dev, audit{mintAuthorityDisabled, freezeAuthorityDisabled,
 * topHoldersPercentage, devBalancePercentage, devMigrations, devMints},
 * stats5m/1h/6h/24h{holderChange, numTraders, numNetBuyers, numOrganicBuyers,
 * buyOrganicVolume, sellOrganicVolume, volumeChange, priceChange}.
 */
export async function fetchJupiterTokenData(mints) {
  const map = new Map();
  if (!mints?.length) return map;

  // Jupiter accepts comma-separated mints; keep batches modest to stay polite.
  const BATCH = 25;
  const chunks = [];
  for (let i = 0; i < mints.length; i += BATCH) {
    chunks.push(mints.slice(i, i + BATCH));
  }

  const results = await Promise.all(
    chunks.map(async chunk => {
      try {
        const res = await fetch(`${JUPITER_SEARCH}${chunk.join(',')}`, {
          headers: { accept: 'application/json' },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json) ? json : [];
      } catch {
        // A Jupiter outage must not break the scan; rows simply stay unenriched.
        return [];
      }
    })
  );

  for (const token of results.flat()) {
    if (token?.id) map.set(token.id, token);
  }
  return map;
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

/**
 * Fetch tokens that are CURRENTLY being traded on pump.fun.
 *
 * This is the input pool for early-signal scanning: filtering on new launches
 * alone finds mostly dead tokens (40+ launch per minute, almost all empty),
 * whereas active ones already have trades to measure.
 */
export async function fetchPumpFunActive() {
  const res = await fetch(PUMPFUN_ACTIVE, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`pump.fun active HTTP ${res.status}`);
  const raw = await res.json();
  return (Array.isArray(raw) ? raw : []).map(t => ({
    chain: 'solana',
    mint: t.mint,
    symbol: (t.symbol || '?').toUpperCase(),
    name: t.name || '?',
    icon: t.image_uri || '',
    mcapUsd: t.usd_market_cap || t.market_cap_usd || 0,
    replyCount: t.reply_count || 0,
    complete: !!t.complete,
    createdTimestamp: t.created_timestamp || 0,
    lastTradeTimestamp: t.last_trade_timestamp || 0,
    // Passed straight into earlySignal.analyzeToken() as curve data.
    curve: {
      real_sol_reserves: t.real_sol_reserves || 0,
      complete: !!t.complete,
      reply_count: t.reply_count || 0,
    },
    twitter: t.twitter || '',
    website: t.website || '',
    pumpUrl: `https://pump.fun/coin/${t.mint}`,
  }));
}

/**
 * Build the scan universe: pump.fun active tokens resolved to DexScreener pairs.
 *
 * Only tokens that actually have a DexScreener pair can be analysed, because
 * pump.fun alone exposes no buy/sell or volume data. Tokens still on the bonding
 * curve with no DEX pair yet are returned separately so the UI can be honest
 * about why they are unscannable.
 */
export async function buildScanUniverse() {
  const active = await fetchPumpFunActive();

  // DexScreener (market mechanics) and Jupiter (holders/audit) in parallel —
  // they are independent sources, so there is no reason to serialise them.
  const [pairs, jupiterMap] = await Promise.all([
    fetchDexPairs(active.map(t => t.mint)),
    fetchJupiterTokenData(active.map(t => t.mint)),
  ]);

  // A mint can have multiple pairs; keep the deepest-liquidity one per mint.
  const byMint = new Map();
  for (const p of pairs) {
    const addr = p.baseToken?.address;
    if (!addr) continue;
    const liq = p.liquidity?.usd || 0;
    const existing = byMint.get(addr);
    if (!existing || liq > (existing.liquidity?.usd || 0)) {
      byMint.set(addr, p);
    }
  }

  const scannable = [];
  const noPair = [];

  for (const token of active) {
    const pair = byMint.get(token.mint);
    const jup = jupiterMap.get(token.mint) || null;
    if (pair) {
      scannable.push({ token, pair, jupiter: jup });
    } else {
      noPair.push(token);
    }
  }

  return {
    scannable,
    noPair,
    totalActive: active.length,
    jupiterHits: scannable.filter(r => r.jupiter).length,
  };
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
