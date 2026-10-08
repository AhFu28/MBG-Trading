import React, { useState, useMemo, Suspense, lazy } from 'react';
import HyperliquidProDesk from './HyperliquidProDesk.jsx';
import CryptoIcon from './CryptoIcon.jsx';
import { formatPrice, formatUsdCompact } from '../services/marketOverview.js';

/**
 * CryptoDeskTab — one Crypto desk covering both perpetual futures and spot.
 *
 * REQUEST (Jendral Arib, 2026-10-08):
 *   "Crypto [futures dan spot dijadikan satu aja, beda di ticker aja kan,
 *    bentuknya mau bgt sama ky hyperliquid]"
 *
 * WHY THIS REPLACES TWO SEPARATE TABS:
 * Previously "Crypto Futures" (a macro analytics surface: funding heat, open
 * interest, long/short, liquidations) and "Crypto Spot" (a scanner table) were
 * separate menu entries. They shared the same instrument list and the same live
 * feed — the only real difference was which column you looked at. Merging them
 * removes a navigation choice the user should never have had to make.
 *
 * LAYOUT: the Hyperliquid-style trade desk is the primary view, because that is
 * the shape the owner asked to match. The analytics surfaces that used to be
 * their own page are preserved as secondary views rather than deleted.
 */

const CryptoFuturesTab = lazy(() => import('./CryptoFuturesTab.jsx'));

/** Instrument universe for the spot/futures browser. */
const INSTRUMENTS = [
  { symbol: 'BTCUSDT', base: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', base: 'ETH', name: 'Ethereum' },
  { symbol: 'SOLUSDT', base: 'SOL', name: 'Solana' },
  { symbol: 'BNBUSDT', base: 'BNB', name: 'BNB' },
  { symbol: 'XRPUSDT', base: 'XRP', name: 'XRP' },
  { symbol: 'DOGEUSDT', base: 'DOGE', name: 'Dogecoin' },
  { symbol: 'SUIUSDT', base: 'SUI', name: 'Sui' },
  { symbol: 'AVAXUSDT', base: 'AVAX', name: 'Avalanche' },
  { symbol: 'LINKUSDT', base: 'LINK', name: 'Chainlink' },
  { symbol: 'HYPEUSDC', base: 'HYPE', name: 'Hyperliquid' },
  { symbol: 'ARBUSDT', base: 'ARB', name: 'Arbitrum' },
  { symbol: 'OPUSDT', base: 'OP', name: 'Optimism' },
];

/**
 * Which contract the desk is trading.
 *
 * A perpetual is a derivatives contract with funding; spot is outright
 * ownership. They are genuinely different products, so the toggle is labelled
 * — but both live in one desk because the chart, orderbook and order form are
 * the same instrument.
 */
const CONTRACT_TYPES = [
  { id: 'PERP', label: 'Perpetual', hint: 'Kontrak derivatif dengan funding rate' },
  { id: 'SPOT', label: 'Spot', hint: 'Beli/lepas aset langsung' },
];

export default function CryptoDeskTab({ data, onOpenChart, onOpenExecution, livePrices = {}, flashMap = {}, allCryptoSpot = [] }) {
  const [contractType, setContractType] = useState('PERP');
  const [view, setView] = useState('DESK'); // 'DESK' | 'FUNDING' | 'SPOT'
  const [search, setSearch] = useState('');

  /**
   * Spot rows come from the live Binance scanner (allCryptoSpot) so the list is
   * the real market, not a curated shortlist. Falls back to the static
   * instrument list while that feed is still connecting.
   */
  const spotRows = useMemo(() => {
    const q = search.trim().toUpperCase();
    const source = allCryptoSpot.length > 0
      ? allCryptoSpot.slice(0, 120)
      : INSTRUMENTS.map(i => ({ symbol: i.symbol, pair: `${i.base}/USDT`, ...i }));

    return source
      .map(row => {
        const symbol = row.symbol || row.pair?.replace('/', '') || '';
        const base = row.base || row.baseCoin || symbol.replace(/USDT$|USDC$/, '');
        const live = livePrices[symbol] || livePrices[`${base}/USDT`] || livePrices[base];
        return {
          symbol,
          base,
          name: row.name || base,
          price: live?.price ?? row.current_price ?? row.price ?? null,
          change24h: live?.changePct ?? row.change_24h_pct ?? row.changePct ?? null,
          volume: live?.volume ?? row.volume_quote ?? null,
        };
      })
      .filter(r => r.symbol)
      .filter(r => !q || r.base.includes(q) || r.symbol.includes(q));
  }, [allCryptoSpot, livePrices, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* ---- Control bar: contract type + view switch ---- */}
      <div
        className="telemetry-panel"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '12px', flexWrap: 'wrap', padding: '8px 13px', borderRadius: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ fontSize: '14px' }}>⚡</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Crypto Desk</span>
          </div>

          {/* Contract type toggle — the futures/spot distinction now lives here */}
          <div style={{ display: 'flex', background: 'var(--bg-panel-subtle)', borderRadius: '7px', padding: '2px', border: 'var(--border-hairline)' }}>
            {CONTRACT_TYPES.map(c => (
              <button
                key={c.id}
                onClick={() => setContractType(c.id)}
                title={c.hint}
                style={{
                  background: contractType === c.id ? 'var(--accent-blue)' : 'transparent',
                  color: contractType === c.id ? '#fff' : 'var(--text-muted)',
                  border: 'none', borderRadius: '5px', padding: '4px 11px',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--bg-panel-subtle)', borderRadius: '7px', padding: '2px', border: 'var(--border-hairline)' }}>
            {[
              { id: 'DESK', label: '🖥️ Trade Desk' },
              { id: 'FUNDING', label: '📊 Funding & OI' },
              { id: 'SPOT', label: '📋 Daftar Spot' },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                style={{
                  background: view === v.id ? 'var(--accent-blue)' : 'transparent',
                  color: view === v.id ? '#fff' : 'var(--text-muted)',
                  border: 'none', borderRadius: '5px', padding: '4px 10px',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => onOpenChart && onOpenChart('BTCUSDT', 'CRYPTO')}
            style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--text-secondary)', borderRadius: '7px', padding: '5px 11px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ⤢ Popup Chart
          </button>

          <button
            id="btn-open-order-modal"
            onClick={() => onOpenExecution && onOpenExecution({ symbol: 'BTCUSDT', market: 'CRYPTO' })}
            style={{
              background: 'linear-gradient(135deg, var(--accent-blue), #2563eb)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '7px',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
            }}
          >
            ⚡ Tiket Order
          </button>
        </div>
      </div>

      {/* ---- Primary view: Hyperliquid-style 3-column trade desk ---- */}
      {view === 'DESK' && (
        <div style={{ height: 'calc(100vh - 140px)', minHeight: '650px', width: '100%' }}>
          <HyperliquidProDesk
            initialSymbol="BTCUSDT"
            livePrices={livePrices}
          />
        </div>
      )}

      {/* ---- Funding / open interest analytics (was the Futures page) ---- */}
      {view === 'FUNDING' && (
        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat analitik derivatif…</div>}>
          <CryptoFuturesTab
            data={data}
            onOpenChart={onOpenChart}
            livePrices={livePrices}
            flashMap={flashMap}
            allCryptoSpot={allCryptoSpot}
          />
        </Suspense>
      )}

      {/* ---- Spot browser ---- */}
      {view === 'SPOT' && (
        <div className="telemetry-panel" style={{ padding: '13px 15px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '11px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <h3 style={{ margin: 0, fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Pasangan Spot USDT
              </h3>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {spotRows.length} pasangan · harga live dari Binance
              </span>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pasangan…"
              style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', borderRadius: '6px', padding: '5px 10px', fontSize: '11.5px', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', width: '170px' }}
            />
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 2, color: 'var(--text-muted)', fontSize: '10px' }}>
                  <th style={{ textAlign: 'left', padding: '6px 5px', fontWeight: 700 }}>Pasangan</th>
                  <th style={{ textAlign: 'right', padding: '6px 5px', fontWeight: 700 }}>Harga</th>
                  <th style={{ textAlign: 'right', padding: '6px 5px', fontWeight: 700 }}>24j %</th>
                  <th style={{ textAlign: 'right', padding: '6px 5px', fontWeight: 700 }}>Volume (24j)</th>
                  <th style={{ textAlign: 'center', padding: '6px 5px', fontWeight: 700 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {spotRows.map(row => (
                  <tr key={row.symbol} style={{ borderTop: 'var(--border-hairline)' }}>
                    <td style={{ padding: '7px 5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CryptoIcon symbol={row.base} size={17} />
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{row.base}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/USDT</span>
                      </div>
                    </td>
                    <td style={{ padding: '7px 5px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatPrice(row.price)}</td>
                    <td style={{ padding: '7px 5px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: row.change24h === null ? 'var(--text-muted)' : row.change24h >= 0 ? '#16c784' : '#ea3943' }}>
                      {row.change24h === null || row.change24h === undefined ? '—' : `${row.change24h > 0 ? '+' : ''}${Number(row.change24h).toFixed(2)}%`}
                    </td>
                    <td style={{ padding: '7px 5px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {formatUsdCompact(row.volume)}
                    </td>
                    <td style={{ padding: '7px 5px', textAlign: 'center' }}>
                      <button
                        onClick={() => onOpenChart && onOpenChart(row.symbol, 'CRYPTO')}
                        style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--accent-blue)', borderRadius: '5px', padding: '3px 9px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Chart
                      </button>
                    </td>
                  </tr>
                ))}
                {spotRows.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '26px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Tidak ada pasangan yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
