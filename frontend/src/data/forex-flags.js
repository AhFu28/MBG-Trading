// Forex Currency to Country Flags, Names and National Colors
// Enables institutional dual-flag overlay badges for Forex Scanner & Currency conversion

export const CURRENCY_FLAGS = {
  EUR: { flag: '🇪🇺', name: 'Euro', country: 'Eurozone', color: '#003399' },
  USD: { flag: '🇺🇸', name: 'US Dollar', country: 'United States', color: '#B22234' },
  GBP: { flag: '🇬🇧', name: 'British Pound', country: 'United Kingdom', color: '#012169' },
  JPY: { flag: '🇯🇵', name: 'Japanese Yen', country: 'Japan', color: '#BC002D' },
  AUD: { flag: '🇦🇺', name: 'Australian Dollar', country: 'Australia', color: '#00008B' },
  CAD: { flag: '🇨🇦', name: 'Canadian Dollar', country: 'Canada', color: '#FF0000' },
  CHF: { flag: '🇨🇭', name: 'Swiss Franc', country: 'Switzerland', color: '#D52B1E' },
  NZD: { flag: '🇳🇿', name: 'New Zealand Dollar', country: 'New Zealand', color: '#00247D' },
  IDR: { flag: '🇮🇩', name: 'Indonesian Rupiah', country: 'Indonesia', color: '#FF0000' },
  SGD: { flag: '🇸🇬', name: 'Singapore Dollar', country: 'Singapore', color: '#ED2939' },
  CNY: { flag: '🇨🇳', name: 'Chinese Yuan', country: 'China', color: '#DE2910' },
  CNH: { flag: '🇨🇳', name: 'Chinese Offshore Yuan', country: 'China', color: '#DE2910' },
  HKD: { flag: '🇭🇰', name: 'Hong Kong Dollar', country: 'Hong Kong', color: '#C8102E' },
  MXN: { flag: '🇲🇽', name: 'Mexican Peso', country: 'Mexico', color: '#006847' }
};

export const parseForexPair = (pair) => {
  if (!pair) return null;
  const clean = String(pair).toUpperCase().replace(/^(FX:|OANDA:|FOREXCOM:|FX_IDC:)/, '').replace(/[\/\-_]/g, '').trim();
  if (clean.length < 6) return null;
  const base = clean.slice(0, 3);
  const quote = clean.slice(3, 6);
  const baseData = CURRENCY_FLAGS[base] || { flag: '🌐', name: base, country: base, color: '#3B82F6' };
  const quoteData = CURRENCY_FLAGS[quote] || { flag: '🌐', name: quote, country: quote, color: '#64748B' };

  return {
    pair: `${base}/${quote}`,
    cleanPair: `${base}${quote}`,
    base,
    quote,
    baseFlag: baseData.flag,
    quoteFlag: quoteData.flag,
    baseData,
    quoteData
  };
};
