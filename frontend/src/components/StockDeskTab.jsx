import React, { useState, Suspense, lazy } from 'react';

/**
 * StockDeskTab — one Stock desk covering both IDX and US equities.
 *
 * REQUEST (Jendral Arib, 2026-10-08):
 *   "Stock [ada IDX dan US]"
 *
 * Same reasoning as the Crypto merge: the two markets were separate menu items
 * that differ only in ticker universe and trading hours. A user looking for "a
 * stock" should not first have to decide which exchange page to open.
 *
 * The market switch is explicit rather than merged into one table, because the
 * two differ in currency (IDR vs USD), session hours and price formatting —
 * mixing them into a single list would make every column ambiguous.
 */

const MasterQuantLeaderboard = lazy(() => import('./MasterQuantLeaderboard.jsx'));
const USStockTab = lazy(() => import('./USStockTab.jsx'));

const MARKETS = [
  { id: 'IDX', label: '🇮🇩 Saham IDX', hint: 'Bursa Efek Indonesia' },
  { id: 'US', label: '🇺🇸 US Stocks', hint: 'Wall Street' },
];

export default function StockDeskTab({
  data,
  livePrices = {},
  flashMap = {},
  allIdxStocks = [],
  allCryptoSpot = [],
  onOpenChart,
  onOpenLotCalc,
  onSelectNews,
}) {
  const [market, setMarket] = useState('IDX');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div
        className="telemetry-panel"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '12px', flexWrap: 'wrap', padding: '8px 13px', borderRadius: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ fontSize: '14px' }}>📈</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Stock Desk</span>
          </div>
          <div style={{ display: 'flex', background: 'var(--bg-panel-subtle)', borderRadius: '7px', padding: '2px', border: 'var(--border-hairline)' }}>
            {MARKETS.map(m => (
              <button
                key={m.id}
                onClick={() => setMarket(m.id)}
                title={m.hint}
                style={{
                  background: market === m.id ? 'var(--accent-blue)' : 'transparent',
                  color: market === m.id ? '#fff' : 'var(--text-muted)',
                  border: 'none', borderRadius: '5px', padding: '4px 12px',
                  fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          {market === 'IDX'
            ? `${allIdxStocks.length} emiten live · jam bursa Asia/Jakarta`
            : 'Wall Street · jam bursa Amerika'}
        </span>
      </div>

      <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat meja saham…</div>}>
        {market === 'IDX' ? (
          <MasterQuantLeaderboard
            activeTab="STOCK"
            onTabChange={() => {}}
            allIdxStocks={allIdxStocks}
            allCryptoSpot={allCryptoSpot}
            tradePlans={data?.daily_trade_plans || []}
            cryptoSpotList={data?.crypto_spot_10 || []}
            conglomerates={data?.conglomerates || {}}
            dividendHunters={data?.dividend_hunters || []}
            foreignFlow={data?.foreign_flow || {}}
            liveNews={data?.macro_telemetry?.live_news || []}
            macro={data?.macro_telemetry || {}}
            paperPortfolio={data?.paper_portfolio || {}}
            backtestLab={data?.backtest_lab || {}}
            strategyRankings={data?.strategy_rankings || []}
            brokerSummary={data?.broker_summary || {}}
            bundle={data}
            livePrices={livePrices}
            flashMap={flashMap}
            onSelectTicker={onOpenChart}
            onOpenLotCalc={onOpenLotCalc}
            onSelectNews={onSelectNews}
          />
        ) : (
          <USStockTab
            data={data}
            onOpenChart={onOpenChart}
            livePrices={livePrices}
            flashMap={flashMap}
          />
        )}
      </Suspense>
    </div>
  );
}
