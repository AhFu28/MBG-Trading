/**
 * MBG TRADING // Dynamic Reactive Strategy Engine v4.5
 * Client-Side Edge Quant Module (Zero Dependency, Ultra Low Latency)
 * 
 * Correctness Guarantees:
 * 1. Persistent Trailing Stop: Once TP1 is reached, SL stays ratcheted to Breakeven
 *    even when price pulls back below TP1.
 * 2. True 2-Way Directionality: Full support for LONG and SHORT positions.
 * 3. Bounded Risk-Reward: Dynamic R:R is anchored to structural risk and
 *    capped to prevent mathematical explosion near stop-loss.
 */

// Persistent in-memory session cache for trailing stop states across renders
const sessionTrailingState = new Map();

export function resetTrailingState(symbol) {
  if (symbol) {
    sessionTrailingState.delete(symbol);
  } else {
    sessionTrailingState.clear();
  }
}

export function evaluateDynamicStrategy({
  symbol = '',
  entryPrice = 0,
  stopLoss = 0,
  target1 = 0,
  target2 = 0,
  currentPrice = 0,
  market = 'IDX',
  direction = 'LONG'
}) {
  const price = Number(currentPrice) || 0;
  const entry = Number(entryPrice) || 0;
  const sl = Number(stopLoss) || 0;
  const tp1 = Number(target1) || 0;
  const isShort = String(direction).toUpperCase() === 'SHORT';
  
  // Calculate secondary target if not provided
  let tp2 = Number(target2) || 0;
  if (!tp2 && entry > 0 && tp1 > 0) {
    tp2 = isShort 
      ? Number((entry - Math.abs(entry - tp1) * 1.6).toFixed(4))
      : Number((entry + Math.abs(tp1 - entry) * 1.6).toFixed(4));
  }

  // Baseline fallback if missing core levels
  if (!price || !entry || !sl || !tp1) {
    return {
      status: 'NEUTRAL',
      statusLabel: 'MONITOR',
      badgeClass: 'badge-neutral',
      currentPrice: price,
      effectiveSl: sl,
      isTrailingActive: false,
      floatingPnLPct: 0,
      dynamicRR: 2.0,
      actionAdvice: 'Menunggu konfirmasi harga pasar...',
      isTp1Hit: false,
      isTp2Hit: false,
      isStoppedOut: false
    };
  }

  // Calculate percentage delta from entry (correct for Long and Short)
  const rawPnlPct = isShort
    ? ((entry - price) / entry) * 100
    : ((price - entry) / entry) * 100;
  const pnlPct = Number(rawPnlPct.toFixed(2));

  // State detection based on direction
  const isStoppedOut = isShort ? price >= sl : price <= sl;
  const isTp1HitNow = isShort ? price <= tp1 : price >= tp1;
  const isTp2HitNow = tp2 > 0 && (isShort ? price <= tp2 : price >= tp2);

  // Persistent Trailing Stop State Recovery
  const cacheKey = symbol || `${market}_${entry}_${sl}_${tp1}`;
  let hasHitTp1 = false;
  let hasHitTp2 = false;

  if (sessionTrailingState.has(cacheKey)) {
    const cached = sessionTrailingState.get(cacheKey);
    hasHitTp1 = cached.hasHitTp1 || false;
    hasHitTp2 = cached.hasHitTp2 || false;
  }

  // Latch triggered states so pullbacks do not reset trailing stop
  if (isTp1HitNow) hasHitTp1 = true;
  if (isTp2HitNow) hasHitTp2 = true;

  if (hasHitTp1 || hasHitTp2) {
    sessionTrailingState.set(cacheKey, { hasHitTp1, hasHitTp2, updatedAt: Date.now() });
  }

  // Dynamic Trailing Stop to Breakeven
  // Once Target 1 is touched at least once, stop loss locks to Entry level (Risk-Free)
  let effectiveSl = sl;
  let isTrailingActive = false;

  if (hasHitTp1 || hasHitTp2) {
    effectiveSl = isShort ? Math.min(sl, entry) : Math.max(sl, entry);
    isTrailingActive = true;
  }

  // Check if stopped out against effective (ratcheted) stop loss
  const isEffectiveStoppedOut = isShort ? price >= effectiveSl : price <= effectiveSl;

  // Bounded Dynamic Risk / Reward Calculation
  // Standard Initial R:R = |Target 1 - Entry| / |Entry - StopLoss|
  const initialRisk = Math.abs(entry - sl);
  const initialReward = Math.abs(tp1 - entry);
  const initialRR = initialRisk > 0 ? Number((initialReward / initialRisk).toFixed(2)) : 2.0;

  // Floating R:R relative to current distance to target vs current distance to SL
  const currentRiskDist = Math.abs(price - effectiveSl);
  const targetForReward = (hasHitTp1 && tp2 > 0) ? tp2 : tp1;
  const currentRewardDist = Math.abs(targetForReward - price);

  let dynamicRR = initialRR;
  if (isEffectiveStoppedOut) {
    dynamicRR = 0.0;
  } else if (currentRiskDist <= entry * 0.003) {
    // Within 0.3% of stop loss: risk is exhausted; don't return an exploding ratio
    dynamicRR = 0.1;
  } else if (currentRiskDist > 0) {
    const rawRR = currentRewardDist / currentRiskDist;
    // Cap at 10.0 to prevent absurd numbers when hovering near SL
    dynamicRR = Number(Math.min(10.0, Math.max(0.1, rawRR)).toFixed(2));
  }

  // State Machine Classification
  const isExtended = pnlPct > 3.5 && !hasHitTp1;
  const isReadyToEnter = Math.abs(pnlPct) <= 0.8 && !isEffectiveStoppedOut;
  const isInTrade = pnlPct > 0.8 && pnlPct <= 3.5 && !hasHitTp1;
  const isWaitingPullback = pnlPct < -0.8 && !isEffectiveStoppedOut;

  let status = 'PENDING';
  let statusLabel = '⏳ PENDING ENTRY';
  let badgeClass = 'badge-pending';
  let actionAdvice = `Harga berada di bawah level beli ideal (${pnlPct}% dari Entry). Tunggu pullback terkonfirmasi.`;

  if (hasHitTp2) {
    status = 'TP2_HIT';
    statusLabel = '🎯 TARGET 2 MAX HIT';
    badgeClass = 'badge-success-glow';
    actionAdvice = `Target ekspansi tercapai (+${pnlPct}%). Amankan seluruh sisa profit.`;
  } else if (hasHitTp1) {
    status = 'TP1_HIT';
    statusLabel = '🛡️ TP1 HIT (SL @ BE LOCKED)';
    badgeClass = 'badge-neon-green';
    actionAdvice = `Target 1 tercapai (+${pnlPct}%)! Trailing Stop terkunci permanen di modal (Entry: ${entry.toLocaleString()}). Risk-Free Trade.`;
  } else if (isEffectiveStoppedOut) {
    status = 'STOPPED_OUT';
    statusLabel = '🚨 STOP LOSS HIT';
    badgeClass = 'badge-danger-glow';
    actionAdvice = `Harga menembus batas toleransi risiko (${pnlPct}%). Setup batal / Cut loss disiplin.`;
  } else if (isExtended) {
    status = 'EXTENDED';
    statusLabel = '⚠️ EXTENDED (NO FOMO)';
    badgeClass = 'badge-warning';
    actionAdvice = `Harga sudah melambung +${pnlPct}% dari titik optimal. Dilarang mengejar harga. Tunggu retest support.`;
  } else if (isInTrade) {
    status = 'IN_POSITION';
    statusLabel = '⚡ TRADE ACTIVE';
    badgeClass = 'badge-active-trade';
    actionAdvice = `Posisi aktif running (+${pnlPct}%). Menuju Target 1 (${tp1.toLocaleString()}). Biarkan pemenang berjalan.`;
  } else if (isReadyToEnter) {
    status = 'ENTRY_TRIGGER';
    statusLabel = '🎯 TRIGGER ZONE';
    badgeClass = 'badge-entry-ready';
    actionAdvice = `Harga berada di zona eksekusi optimal (±${Math.abs(pnlPct)}% dari Entry). Rasio R:R terukur 1:${dynamicRR}. Siap eksekusi.`;
  } else if (isWaitingPullback) {
    status = 'WAITING_PULLBACK';
    statusLabel = '⏳ WAIT RETEST';
    badgeClass = 'badge-pullback';
    actionAdvice = `Harga berada di discount ${pnlPct}% dari entry. Siapkan antrian di dekat support ${sl.toLocaleString()}.`;
  }

  return {
    status,
    statusLabel,
    badgeClass,
    currentPrice: price,
    effectiveSl,
    isTrailingActive,
    floatingPnLPct: pnlPct,
    dynamicRR,
    actionAdvice,
    isTp1Hit: hasHitTp1,
    isTp2Hit: hasHitTp2,
    isStoppedOut: isEffectiveStoppedOut
  };
}
