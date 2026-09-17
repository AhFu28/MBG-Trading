/**
 * MBG TRADING // Dynamic Reactive Strategy Engine
 * Client-Side Edge Quant Module (Zero Dependency, Ultra Low Latency)
 * 
 * Re-evaluates trade plans and crypto spot setups against live price ticks
 * in real-time (< 1s from Binance WS / 20s from TradingView Scanner).
 */

export function evaluateDynamicStrategy({
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
  const tp2 = Number(target2) || (tp1 > entry ? Number((entry + (tp1 - entry) * 1.6).toFixed(4)) : 0);

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
      actionAdvice: 'Menunggu konfirmasi harga pasar...'
    };
  }

  // Calculate percentage delta from entry
  const pnlPct = Number((((price - entry) / entry) * 100).toFixed(2));
  
  // State detection
  const isStoppedOut = price <= sl;
  const isTp1Hit = price >= tp1;
  const isTp2Hit = tp2 > 0 && price >= tp2;
  const isExtended = pnlPct > 3.2 && !isTp1Hit;
  const isReadyToBuy = Math.abs(pnlPct) <= 0.8;
  const isInTrade = pnlPct > 0.8 && pnlPct <= 3.2 && !isTp1Hit;
  const isWaitingPullback = pnlPct < -0.8 && !isStoppedOut;

  // Dynamic Trailing Stop Mechanism
  // Once Target 1 is touched, stop loss immediately ratchets to Breakeven (Entry level)
  let effectiveSl = sl;
  let isTrailingActive = false;

  if (isTp1Hit || isTp2Hit) {
    effectiveSl = Math.max(sl, entry);
    isTrailingActive = true;
  }

  // Dynamic Floating Risk / Reward Ratio
  const currentRisk = Math.abs(price - effectiveSl);
  const currentReward = Math.abs((isTp1Hit && tp2 > price ? tp2 : tp1) - price);
  const dynamicRR = currentRisk > 0 ? Number((currentReward / currentRisk).toFixed(2)) : 0;

  // State Machine Classification
  let status = 'PENDING';
  let statusLabel = '⏳ PENDING ENTRY';
  let badgeClass = 'badge-pending';
  let actionAdvice = `Harga berada di bawah level beli ideal (${pnlPct}% dari Entry). Tunggu pullback terkonfirmasi.`;

  if (isTp2Hit) {
    status = 'TP2_HIT';
    statusLabel = '🎯 TARGET 2 MAX HIT';
    badgeClass = 'badge-success-glow';
    actionAdvice = `Target ekspansi tercapai (+${pnlPct}%). Amankan seluruh sisa profit.`;
  } else if (isTp1Hit) {
    status = 'TP1_HIT';
    statusLabel = '⚡ TP1 HIT (SL @ BE)';
    badgeClass = 'badge-neon-green';
    actionAdvice = `Target 1 tercapai (+${pnlPct}%)! Trailing Stop otomatis terkunci di modal (Entry: ${entry.toLocaleString()}). Risk Free.`;
  } else if (isStoppedOut) {
    status = 'STOPPED_OUT';
    statusLabel = '🛑 STOP LOSS HIT';
    badgeClass = 'badge-danger-glow';
    actionAdvice = `Harga menembus batas toleransi risiko (${pnlPct}%). Setup batal / Cut loss disiplin.`;
  } else if (isExtended) {
    status = 'EXTENDED';
    statusLabel = '⚠️ EXTENDED (NO FOMO)';
    badgeClass = 'badge-warning';
    actionAdvice = `Harga sudah melambung +${pnlPct}% dari titik beli optimal. Dilarang mengejar harga (risk/reward buruk). Tunggu retest.`;
  } else if (isInTrade) {
    status = 'IN_POSITION';
    statusLabel = '🟢 TRADE ACTIVE';
    badgeClass = 'badge-active-trade';
    actionAdvice = `Posisi aktif running (+${pnlPct}%). Menuju Target 1 (${tp1.toLocaleString()}). Biarkan pemenang berjalan.`;
  } else if (isReadyToBuy) {
    status = 'ENTRY_TRIGGER';
    statusLabel = '🔥 BUY TRIGGER ZONE';
    badgeClass = 'badge-entry-ready';
    actionAdvice = `Harga berada di zona eksekusi optimal (±${Math.abs(pnlPct)}% dari Entry). Rasio R:R prima 1:${dynamicRR}. Siap entry.`;
  } else if (isWaitingPullback) {
    status = 'WAITING_PULLBACK';
    statusLabel = '⏳ BUY ON RETEST';
    badgeClass = 'badge-pullback';
    actionAdvice = `Harga diskon ${pnlPct}% di bawah entry. Siapkan bid antrian di dekat support ${sl.toLocaleString()}.`;
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
    isTp1Hit,
    isTp2Hit,
    isStoppedOut
  };
}
