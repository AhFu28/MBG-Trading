/**
 * Shared TradingView Symbol Resolution Helper
 * Single source of truth across ChartingDeskTab, TradingViewModal, and SecurityHubDrawer.
 */
export const getTvSymbol = (sym, mkt) => {
  if (!sym) return 'IDX:BBCA';
  const s = String(sym).trim();
  if (s.includes(':')) return s;
  const clean = s.replace('.JK', '').replace('/', '').toUpperCase();

  const FOREX_CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
  const isForex = mkt === 'FOREX' || (clean.length === 6 && FOREX_CURRENCIES.some(c => clean.startsWith(c)) && FOREX_CURRENCIES.some(c => clean.endsWith(c)));
  if (isForex) return `FX:${clean}`;

  if (mkt === 'CRYPTO' || clean.endsWith('USDT') || clean.startsWith('BTC') || clean.startsWith('ETH') || clean.startsWith('SOL')) {
    const pair = clean.endsWith('USDT') ? clean : `${clean}USDT`;
    return `BINANCE:${pair}`;
  }

  const US_TOP = [
    'AAPL', 'NVDA', 'MSFT', 'META', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'AMD',
    'PLTR', 'SMCI', 'AVGO', 'CRM', 'NFLX', 'COIN', 'SOFI', 'JPM', 'GS',
    'V', 'MA', 'UNH', 'JNJ', 'PFE', 'LLY', 'XOM', 'CVX', 'BA', 'GE',
    'CAT', 'MU', 'INTC', 'ARM'
  ];
  if (mkt === 'US_STOCKS' || mkt === 'US_EQUITY' || mkt === 'US' || US_TOP.includes(clean)) {
    return `NASDAQ:${clean}`;
  }

  return `IDX:${clean}`;
};

export const cleanSymbolStr = (sym) => {
  return String(sym || '').replace('.JK', '').replace('/', '').replace('IDX:', '').replace('BINANCE:', '').replace('NASDAQ:', '').replace('FX:', '').toUpperCase();
};
