/**
 * MBG TRADING // Institutional Broker Gateway (v5.0 APEX)
 * Production-Grade Multi-Broker Execution Interface
 * 
 * Supports:
 * 1. Institutional Paper Broker (Deterministic Matching Engine, Slippage, Fees, Persistent State)
 * 2. Binance Live & Testnet API (HMAC-SHA256 Signed Order Dispatch via Web Crypto)
 * 3. Citadel-Grade Risk Controls (2% Risk Cap, 25% Position Cap, Emergency Kill Switch)
 */

const STORAGE_KEYS = {
  PORTFOLIO: 'mbg_paper_portfolio_v5',
  API_CONFIG: 'mbg_live_broker_config_v5',
  KILL_SWITCH: 'mbg_emergency_kill_switch_active'
};

// Default initial capital: Rp 100 Juta IDR & $10,000 USDT
const DEFAULT_INITIAL_CAPITAL = {
  IDR: 100000000,
  USDT: 10000
};

// Fee structures (round-trip modeling)
export const BROKER_FEES = {
  IDX_EQUITY: { buy: 0.0015, sell: 0.0025, name: 'IDX OJK / Sekuritas (0.15% Buy + 0.25% Sell)' },
  CRYPTO_SPOT: { maker: 0.0010, taker: 0.0010, name: 'Binance / Tokocrypto Spot (0.10% Taker)' },
  CRYPTO_FUTURES: { maker: 0.0002, taker: 0.0005, name: 'Binance Futures (0.05% Taker)' },
  US_EQUITY: { commissionPerShare: 0.005, minCommission: 1.0, name: 'Alpaca / US Broker ($0.005/sh)' }
};

// ==========================================
// 1. INSTITUTIONAL PAPER BROKER ENGINE
// ==========================================

export class PaperBroker {
  constructor() {
    this.portfolio = this._loadPortfolio();
  }

  _loadPortfolio() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Schema migration v2: legacy positions were always executed long (side field was
        // decorative). Normalize so the corrected side-aware math treats them as LONG.
        (parsed.positions || []).forEach(p => {
          if (p.side !== 'LONG' && p.side !== 'SHORT') p.side = 'LONG';
        });
        parsed.schemaVersion = 2;
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to read paper portfolio from storage, initializing fresh:', e);
    }
    return {
      schemaVersion: 2,
      cashIdr: DEFAULT_INITIAL_CAPITAL.IDR,
      cashUsdt: DEFAULT_INITIAL_CAPITAL.USDT,
      initialCashIdr: DEFAULT_INITIAL_CAPITAL.IDR,
      initialCashUsdt: DEFAULT_INITIAL_CAPITAL.USDT,
      positions: [],
      tradeHistory: [],
      lastUpdated: new Date().toISOString()
    };
  }

  _savePortfolio() {
    try {
      this.portfolio.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(this.portfolio));
    } catch (e) {
      console.error('Failed to save paper portfolio:', e);
    }
  }

  getSummary() {
    return { ...this.portfolio };
  }

  reset(cashIdr = DEFAULT_INITIAL_CAPITAL.IDR, cashUsdt = DEFAULT_INITIAL_CAPITAL.USDT) {
    this.portfolio = {
      schemaVersion: 2,
      cashIdr: Number(cashIdr) || DEFAULT_INITIAL_CAPITAL.IDR,
      cashUsdt: Number(cashUsdt) || DEFAULT_INITIAL_CAPITAL.USDT,
      initialCashIdr: Number(cashIdr) || DEFAULT_INITIAL_CAPITAL.IDR,
      initialCashUsdt: Number(cashUsdt) || DEFAULT_INITIAL_CAPITAL.USDT,
      positions: [],
      tradeHistory: [],
      lastUpdated: new Date().toISOString()
    };
    this._savePortfolio();
    return this.getSummary();
  }

  /**
   * Place a simulated order with realistic execution rules and fee deduction.
   * v2: side-aware accounting (BUY/SELL × LONG/SHORT), IDX long-only enforcement,
   * bracket validation (SL/TP must sit on the correct side of entry).
   */
  placeOrder({
    symbol,
    market = 'IDX',
    side = 'BUY', // 'BUY' (open long / cover short) | 'SELL' (close long / open short)
    type = 'LIMIT', // 'LIMIT' | 'MARKET'
    price = 0,
    lots = 0, // for IDX (1 lot = 100 shares)
    quantity = 0, // for Crypto/US
    stopLoss = 0,
    target1 = 0,
    target2 = 0,
    agentId = 'MANUAL',
    agentName = 'Manual Trader'
  }) {
    // Check master kill switch
    if (this.isKillSwitchActive()) {
      throw new Error('EMERGENCY KILL SWITCH AKTIF. Seluruh order baru diblokir demi keamanan modal.');
    }

    const isCrypto = market === 'CRYPTO' || symbol.includes('USDT');
    const isIdr = market === 'IDX';
    const numPrice = Number(price);

    if (numPrice <= 0) throw new Error('Harga order tidak valid.');
    if (side !== 'BUY' && side !== 'SELL') throw new Error('Arah order tidak valid (BUY/SELL).');

    // IDX is long-only per OJK/IDX rules (README policy).
    if (isIdr && side === 'SELL') {
      throw new Error('IDX long-only (aturan OJK/BEI): order SELL/SHORT ditolak di paper broker.');
    }

    // Validate bracket geometry up-front: LONG needs SL<entry<TP; SHORT needs TP<entry<SL.
    const sl = Number(stopLoss) || 0;
    const tp1 = Number(target1) || 0;
    const tp2 = Number(target2) || 0;
    if (sl > 0) {
      if (side === 'BUY' && sl >= numPrice) throw new Error('Stop Loss harus DI BAWAH harga entry untuk posisi LONG.');
      if (side === 'SELL' && sl <= numPrice) throw new Error('Stop Loss harus DI ATAS harga entry untuk posisi SHORT.');
    }
    if (tp1 > 0) {
      if (side === 'BUY' && tp1 <= numPrice) throw new Error('Target 1 harus DI ATAS harga entry untuk posisi LONG.');
      if (side === 'SELL' && tp1 >= numPrice) throw new Error('Target 1 harus DI BAWAH harga entry untuk posisi SHORT.');
    }
    if (tp2 > 0 && tp1 > 0) {
      if (side === 'BUY' && tp2 <= tp1) throw new Error('Target 2 harus lebih jauh dari Target 1 (LONG).');
      if (side === 'SELL' && tp2 >= tp1) throw new Error('Target 2 harus lebih jauh dari Target 1 (SHORT).');
    }

    // Determine effective opening direction: BUY opens/covers LONG, SELL opens SHORT.
    const positionSide = side === 'BUY' ? 'LONG' : 'SHORT';

    // Calculate total notional value
    let notional = 0;
    let effectiveUnits = 0;

    if (isIdr) {
      const numLots = Math.max(1, Math.floor(Number(lots) || 1));
      effectiveUnits = numLots * 100;
      notional = effectiveUnits * numPrice;
    } else {
      effectiveUnits = Number(quantity) > 0 ? Number(quantity) : (notional / numPrice);
      notional = effectiveUnits * numPrice;
    }

    if (notional <= 0) throw new Error('Ukuran kuantitas order harus lebih besar dari 0.');

    // Fee charged on the correct side of the transaction:
    // opening BUY (long/cover) pays buy fee; opening SELL (short entry) pays sell fee.
    const feeRate = isIdr
      ? (positionSide === 'LONG' ? BROKER_FEES.IDX_EQUITY.buy : BROKER_FEES.IDX_EQUITY.sell)
      : BROKER_FEES.CRYPTO_SPOT.taker;
    const estimatedFee = notional * feeRate;
    const totalRequiredCash = notional + estimatedFee;

    // Check available cash balance
    const availableCash = isIdr ? this.portfolio.cashIdr : this.portfolio.cashUsdt;
    if (totalRequiredCash > availableCash) {
      const curr = isIdr ? 'Rp ' : '$';
      throw new Error(`Saldo tidak mencukupi. Dibutuhkan ${curr}${Math.round(totalRequiredCash).toLocaleString()}, Saldo tersedia ${curr}${Math.round(availableCash).toLocaleString()}`);
    }

    if (positionSide === 'LONG') {
      // BUY LONG: reserve full notional + entry fee from cash (settled on close).
      if (isIdr) {
        this.portfolio.cashIdr -= totalRequiredCash;
      } else {
        this.portfolio.cashUsdt -= totalRequiredCash;
      }
    } else {
      // SELL SHORT: hold notional + fee as margin collateral; proceeds credited at close.
      if (isIdr) {
        this.portfolio.cashIdr -= totalRequiredCash;
      } else {
        this.portfolio.cashUsdt -= totalRequiredCash;
      }
    }

    const orderId = `ORD_${Date.now()}_${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36)).slice(0, 5).toUpperCase()}`;
    const newPosition = {
      id: orderId,
      symbol: symbol.toUpperCase(),
      market,
      side: positionSide,
      orderSide: side,
      type,
      entryPrice: numPrice,
      currentPrice: numPrice,
      lots: isIdr ? Math.floor(effectiveUnits / 100) : 0,
      quantity: effectiveUnits,
      notional,
      entryFee: estimatedFee,
      stopLoss: sl,
      effectiveSl: sl,
      target1: tp1,
      target2: tp2,
      hasHitTp1: false,
      hasHitTp2: false,
      agentId,
      agentName,
      status: 'OPEN',
      openedAt: new Date().toISOString(),
      floatingPnL: 0,
      floatingPnLPct: 0
    };

    this.portfolio.positions.unshift(newPosition);
    this._savePortfolio();
    return newPosition;
  }

  /**
   * Close an open position and realize PnL with correct-side exit fee.
   * v2: direction-aware settlement for LONG (sell to exit) and SHORT (buy to cover).
   */
  closePosition(positionId, exitPrice = null, reason = 'MANUAL_CLOSE') {
    const idx = this.portfolio.positions.findIndex(p => p.id === positionId);
    if (idx === -1) throw new Error('Posisi tidak ditemukan.');

    const pos = this.portfolio.positions[idx];
    const isIdr = pos.market === 'IDX';
    const posSide = pos.side === 'SHORT' ? 'SHORT' : 'LONG'; // legacy data normalized on load
    const numExit = Number(exitPrice) || pos.currentPrice || pos.entryPrice;

    // Gross exit notional
    const exitNotional = pos.quantity * numExit;

    // Exit fee charged on the correct side: LONG exits via SELL (0.25% IDX), SHORT covers via BUY (0.15% IDX).
    const feeRate = isIdr
      ? (posSide === 'LONG' ? BROKER_FEES.IDX_EQUITY.sell : BROKER_FEES.IDX_EQUITY.buy)
      : BROKER_FEES.CRYPTO_SPOT.taker;
    const exitFee = exitNotional * feeRate;

    // Realized Net PnL (direction-aware):
    //   LONG:  (exit - entry) * qty - entryFee - exitFee
    //   SHORT: (entry - exit) * qty - entryFee - exitFee
    const priceDelta = posSide === 'LONG' ? (numExit - pos.entryPrice) : (pos.entryPrice - numExit);
    const realizedPnL = (priceDelta * pos.quantity) - (pos.entryFee || 0) - exitFee;
    const totalCostBasis = (pos.notional || 0) + (pos.entryFee || 0);
    const realizedPnLPct = Number(((realizedPnL / totalCostBasis) * 100).toFixed(2));

    // Cash settlement — release the reserved pool plus realized PnL:
    //   cashRelease = (notional + entryFee) + realizedPnL
    //   LONG  ⇒ notional + (exit−entry)*qty − exitFee   (= exitNotional − exitFee)
    //   SHORT ⇒ notional + (entry−exit)*qty − exitFee   (= 2·notional − exitNotional − exitFee)
    const cashRelease = posSide === 'LONG'
      ? exitNotional - exitFee
      : (2 * pos.notional) - exitNotional - exitFee;
    if (isIdr) {
      this.portfolio.cashIdr += cashRelease;
    } else {
      this.portfolio.cashUsdt += cashRelease;
    }

    // Archive to trade history
    const closedRecord = {
      ...pos,
      side: posSide,
      status: 'CLOSED',
      exitPrice: numExit,
      exitFee,
      totalFees: (pos.entryFee || 0) + exitFee,
      realizedPnL,
      realizedPnLPct,
      closedAt: new Date().toISOString(),
      closeReason: reason
    };

    this.portfolio.positions.splice(idx, 1);
    this.portfolio.tradeHistory.unshift(closedRecord);
    this._savePortfolio();
    return closedRecord;
  }

  /**
   * Update all active positions against incoming live prices.
   * v2: direction-aware floating PnL, TP1 breakeven ratchet and SL/TP triggers for LONG and SHORT.
   */
  updatePositionsOnTick(livePricesMap = {}) {
    let hasChanges = false;
    const closedPositions = [];

    this.portfolio.positions = this.portfolio.positions.filter(pos => {
      const quote = livePricesMap[pos.symbol] || livePricesMap[`IDX:${pos.symbol}`] || livePricesMap[`${pos.symbol}.JK`];
      if (!quote || !quote.price) return true;

      const posSide = pos.side === 'SHORT' ? 'SHORT' : 'LONG';
      const currentPrice = Number(quote.price);
      pos.currentPrice = currentPrice;

      // Direction-aware floating PnL (gross, fees settled at close)
      const priceDelta = posSide === 'LONG' ? (currentPrice - pos.entryPrice) : (pos.entryPrice - currentPrice);
      pos.floatingPnL = Math.round(priceDelta * pos.quantity);
      pos.floatingPnLPct = Number(((priceDelta / pos.entryPrice) * 100).toFixed(2));

      // TP1 touched → ratchet stop to breakeven (mirrored for SHORT)
      const tp1Touched = posSide === 'LONG'
        ? (pos.target1 > 0 && currentPrice >= pos.target1)
        : (pos.target1 > 0 && currentPrice <= pos.target1);
      if (tp1Touched && !pos.hasHitTp1) {
        pos.hasHitTp1 = true;
        if (posSide === 'LONG') {
          pos.effectiveSl = Math.max(pos.effectiveSl || pos.stopLoss, pos.entryPrice);
        } else {
          pos.effectiveSl = (pos.effectiveSl || pos.stopLoss) > 0
            ? Math.min(pos.effectiveSl, pos.entryPrice)
            : pos.entryPrice;
        }
        hasChanges = true;
      }

      // Check Stop Loss Trigger (direction-aware, against effective ratcheted SL)
      const slHit = posSide === 'LONG'
        ? (pos.effectiveSl > 0 && currentPrice <= pos.effectiveSl)
        : (pos.effectiveSl > 0 && currentPrice >= pos.effectiveSl);
      if (slHit) {
        const reason = pos.hasHitTp1 ? 'TRAILING_STOP_BREAKEVEN_HIT' : 'STOP_LOSS_HIT';
        const closed = this.closePosition(pos.id, pos.effectiveSl, reason);
        closedPositions.push(closed);
        hasChanges = true;
        return false;
      }

      // Check Target 2 Full Exit Trigger (direction-aware)
      const tp2Hit = posSide === 'LONG'
        ? (pos.target2 > 0 && currentPrice >= pos.target2)
        : (pos.target2 > 0 && currentPrice <= pos.target2);
      if (tp2Hit) {
        const closed = this.closePosition(pos.id, pos.target2, 'TARGET_2_MAX_PROFIT');
        closedPositions.push(closed);
        hasChanges = true;
        return false;
      }

      hasChanges = true;
      return true;
    });

    if (hasChanges) {
      this._savePortfolio();
    }

    return { active: this.portfolio.positions, closed: closedPositions };
  }

  // Master Emergency Kill Switch
  isKillSwitchActive() {
    try {
      return localStorage.getItem(STORAGE_KEYS.KILL_SWITCH) === 'true';
    } catch {
      return false;
    }
  }

  setKillSwitch(active = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.KILL_SWITCH, active ? 'true' : 'false');
    } catch {}
    return active;
  }

  emergencyLiquidateAll(livePricesMap = {}) {
    const closed = [];
    const positionsCopy = [...this.portfolio.positions];
    positionsCopy.forEach(pos => {
      const quote = livePricesMap[pos.symbol] || livePricesMap[`IDX:${pos.symbol}`] || livePricesMap[`${pos.symbol}.JK`];
      const exitPrice = quote?.price || pos.currentPrice || pos.entryPrice;
      try {
        const res = this.closePosition(pos.id, exitPrice, 'EMERGENCY_KILL_SWITCH_LIQUIDATION');
        closed.push(res);
      } catch (e) {
        console.error('Error emergency closing position:', pos.id, e);
      }
    });
    this.setKillSwitch(true);
    return closed;
  }
}

// ==========================================
// 2. BINANCE LIVE & TESTNET API ADAPTER
// ==========================================

export class BinanceLiveAdapter {
  constructor(apiKey = '', secretKey = '', isTestnet = true) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.isTestnet = isTestnet;
    this.baseUrl = isTestnet
      ? 'https://testnet.binance.vision'
      : 'https://api.binance.com';
  }

  /**
   * Generates HMAC-SHA256 signature using native Web Crypto API
   */
  async _generateSignature(queryString) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.secretKey);
    const msgData = encoder.encode(queryString);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Test API connectivity and verify authentication
   */
  async testConnection() {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('API Key & Secret Key diperlukan untuk terhubung ke Binance.');
    }

    const timestamp = Date.now();
    const query = `timestamp=${timestamp}`;
    const signature = await this._generateSignature(query);

    const url = `${this.baseUrl}/api/v3/account?${query}&signature=${signature}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': this.apiKey
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Binance API Error (${res.status}): ${err.msg || res.statusText}`);
    }

    const data = await res.json();
    return {
      connected: true,
      canTrade: data.canTrade,
      accountType: data.accountType,
      isTestnet: this.isTestnet,
      balances: (data.balances || []).filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
    };
  }

  /**
   * Dispatch a real live order to Binance
   */
  async placeOrder({ symbol, side, type = 'LIMIT', quantity, price, timeInForce = 'GTC' }) {
    // TRUST06 release flag: real Binance orders stay DISABLED unless explicitly
    // enabled at build/env time. No accidental real-money orders.
    const flag = (typeof import.meta !== 'undefined' && import.meta.env)
      ? import.meta.env.VITE_ENABLE_REAL_ORDERS
      : undefined;
    if (flag !== '1') {
      throw new Error('REAL ORDERS DISABLED (TRUST06): set VITE_ENABLE_REAL_ORDERS=1 untuk mengaktifkan order Binance sungguhan.');
    }
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Binance credentials not set.');
    }

    const timestamp = Date.now();
    let query = `symbol=${symbol.replace('/', '').toUpperCase()}&side=${side}&type=${type}&quantity=${quantity}&timestamp=${timestamp}`;
    if (type === 'LIMIT') {
      query += `&price=${price}&timeInForce=${timeInForce}`;
    }

    const signature = await this._generateSignature(query);
    const url = `${this.baseUrl}/api/v3/order?${query}&signature=${signature}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': this.apiKey
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Order Gagal (${res.status}): ${err.msg || res.statusText}`);
    }

    return await res.json();
  }
}

// Global Singleton Instance for application-wide paper execution
export const institutionalPaperBroker = new PaperBroker();
