import React, { useState } from 'react';

const ASSETS = [
    { ticker: 'SPY', name: 'S&P 500', group: 'Equity' },
    { ticker: 'QQQ', name: 'Nasdaq', group: 'Equity' },
    { ticker: 'BTC', name: 'Bitcoin', group: 'Crypto' },
    { ticker: 'ETH', name: 'Ethereum', group: 'Crypto' },
    { ticker: 'EURUSD', name: 'Euro/USD', group: 'Forex' },
    { ticker: 'XAU', name: 'Gold', group: 'Commodity' },
    { ticker: 'WTI', name: 'Crude Oil', group: 'Commodity' },
    { ticker: 'US10Y', name: '10Y Yield', group: 'Rates' },
    { ticker: 'VIX', name: 'Volatility', group: 'Volatility' },
    { ticker: 'DXY', name: 'US Dollar', group: 'Forex' }
];

const CORRELATION_DATA = {
    '1M': {
        'SPY-SPY': 1.0, 'SPY-QQQ': 0.92, 'SPY-BTC': 0.45, 'SPY-ETH': 0.42, 'SPY-EURUSD': 0.35, 'SPY-XAU': 0.15, 'SPY-WTI': 0.25, 'SPY-US10Y': -0.45, 'SPY-VIX': -0.85, 'SPY-DXY': -0.40,
        'QQQ-SPY': 0.92, 'QQQ-QQQ': 1.0, 'QQQ-BTC': 0.55, 'QQQ-ETH': 0.50, 'QQQ-EURUSD': 0.30, 'QQQ-XAU': 0.10, 'QQQ-WTI': 0.15, 'QQQ-US10Y': -0.65, 'QQQ-VIX': -0.88, 'QQQ-DXY': -0.38,
        'BTC-SPY': 0.45, 'BTC-QQQ': 0.55, 'BTC-BTC': 1.0, 'BTC-ETH': 0.88, 'BTC-EURUSD': 0.25, 'BTC-XAU': 0.20, 'BTC-WTI': 0.10, 'BTC-US10Y': -0.35, 'BTC-VIX': -0.55, 'BTC-DXY': -0.30,
        'ETH-SPY': 0.42, 'ETH-QQQ': 0.50, 'ETH-BTC': 0.88, 'ETH-ETH': 1.0, 'ETH-EURUSD': 0.28, 'ETH-XAU': 0.18, 'ETH-WTI': 0.12, 'ETH-US10Y': -0.38, 'ETH-VIX': -0.52, 'ETH-DXY': -0.32,
        'EURUSD-SPY': 0.35, 'EURUSD-QQQ': 0.30, 'EURUSD-BTC': 0.25, 'EURUSD-ETH': 0.28, 'EURUSD-EURUSD': 1.0, 'EURUSD-XAU': 0.45, 'EURUSD-WTI': 0.20, 'EURUSD-US10Y': -0.25, 'EURUSD-VIX': -0.22, 'EURUSD-DXY': -0.95,
        'XAU-SPY': 0.15, 'XAU-QQQ': 0.10, 'XAU-BTC': 0.20, 'XAU-ETH': 0.18, 'XAU-EURUSD': 0.45, 'XAU-XAU': 1.0, 'XAU-WTI': 0.25, 'XAU-US10Y': -0.55, 'XAU-VIX': 0.15, 'XAU-DXY': -0.65,
        'WTI-SPY': 0.25, 'WTI-QQQ': 0.15, 'WTI-BTC': 0.10, 'WTI-ETH': 0.12, 'WTI-EURUSD': 0.20, 'WTI-XAU': 0.25, 'WTI-WTI': 1.0, 'WTI-US10Y': 0.35, 'WTI-VIX': -0.10, 'WTI-DXY': -0.25,
        'US10Y-SPY': -0.45, 'US10Y-QQQ': -0.65, 'US10Y-BTC': -0.35, 'US10Y-ETH': -0.38, 'US10Y-EURUSD': -0.25, 'US10Y-XAU': -0.55, 'US10Y-WTI': 0.35, 'US10Y-US10Y': 1.0, 'US10Y-VIX': 0.45, 'US10Y-DXY': 0.55,
        'VIX-SPY': -0.85, 'VIX-QQQ': -0.88, 'VIX-BTC': -0.55, 'VIX-ETH': -0.52, 'VIX-EURUSD': -0.22, 'VIX-XAU': 0.15, 'VIX-WTI': -0.10, 'VIX-US10Y': 0.45, 'VIX-VIX': 1.0, 'VIX-DXY': 0.35,
        'DXY-SPY': -0.40, 'DXY-QQQ': -0.38, 'DXY-BTC': -0.30, 'DXY-ETH': -0.32, 'DXY-EURUSD': -0.95, 'DXY-XAU': -0.65, 'DXY-WTI': -0.25, 'DXY-US10Y': 0.55, 'DXY-VIX': 0.35, 'DXY-DXY': 1.0,
    },
    '3M': {
        'SPY-SPY': 1.0, 'SPY-QQQ': 0.88, 'SPY-BTC': 0.35, 'SPY-ETH': 0.32, 'SPY-EURUSD': 0.25, 'SPY-XAU': 0.05, 'SPY-WTI': 0.15, 'SPY-US10Y': -0.55, 'SPY-VIX': -0.75, 'SPY-DXY': -0.30,
        'QQQ-SPY': 0.88, 'QQQ-QQQ': 1.0, 'QQQ-BTC': 0.45, 'QQQ-ETH': 0.42, 'QQQ-EURUSD': 0.20, 'QQQ-XAU': 0.02, 'QQQ-WTI': 0.10, 'QQQ-US10Y': -0.72, 'QQQ-VIX': -0.78, 'QQQ-DXY': -0.28,
        'BTC-SPY': 0.35, 'BTC-QQQ': 0.45, 'BTC-BTC': 1.0, 'BTC-ETH': 0.92, 'BTC-EURUSD': 0.15, 'BTC-XAU': 0.10, 'BTC-WTI': 0.05, 'BTC-US10Y': -0.25, 'BTC-VIX': -0.45, 'BTC-DXY': -0.20,
        'ETH-SPY': 0.32, 'ETH-QQQ': 0.42, 'ETH-BTC': 0.92, 'ETH-ETH': 1.0, 'ETH-EURUSD': 0.18, 'ETH-XAU': 0.08, 'ETH-WTI': 0.07, 'ETH-US10Y': -0.28, 'ETH-VIX': -0.42, 'ETH-DXY': -0.22,
        'EURUSD-SPY': 0.25, 'EURUSD-QQQ': 0.20, 'EURUSD-BTC': 0.15, 'EURUSD-ETH': 0.18, 'EURUSD-EURUSD': 1.0, 'EURUSD-XAU': 0.55, 'EURUSD-WTI': 0.10, 'EURUSD-US10Y': -0.35, 'EURUSD-VIX': -0.12, 'EURUSD-DXY': -0.98,
        'XAU-SPY': 0.05, 'XAU-QQQ': 0.02, 'XAU-BTC': 0.10, 'XAU-ETH': 0.08, 'XAU-EURUSD': 0.55, 'XAU-XAU': 1.0, 'XAU-WTI': 0.15, 'XAU-US10Y': -0.68, 'XAU-VIX': 0.25, 'XAU-DXY': -0.75,
        'WTI-SPY': 0.15, 'WTI-QQQ': 0.10, 'WTI-BTC': 0.05, 'WTI-ETH': 0.07, 'WTI-EURUSD': 0.10, 'WTI-XAU': 0.15, 'WTI-WTI': 1.0, 'WTI-US10Y': 0.45, 'WTI-VIX': -0.05, 'WTI-DXY': -0.15,
        'US10Y-SPY': -0.55, 'US10Y-QQQ': -0.72, 'US10Y-BTC': -0.25, 'US10Y-ETH': -0.28, 'US10Y-EURUSD': -0.35, 'US10Y-XAU': -0.68, 'US10Y-WTI': 0.45, 'US10Y-US10Y': 1.0, 'US10Y-VIX': 0.55, 'US10Y-DXY': 0.65,
        'VIX-SPY': -0.75, 'VIX-QQQ': -0.78, 'VIX-BTC': -0.45, 'VIX-ETH': -0.42, 'VIX-EURUSD': -0.12, 'VIX-XAU': 0.25, 'VIX-WTI': -0.05, 'VIX-US10Y': 0.55, 'VIX-VIX': 1.0, 'VIX-DXY': 0.25,
        'DXY-SPY': -0.30, 'DXY-QQQ': -0.28, 'DXY-BTC': -0.20, 'DXY-ETH': -0.22, 'DXY-EURUSD': -0.98, 'DXY-XAU': -0.75, 'DXY-WTI': -0.15, 'DXY-US10Y': 0.65, 'DXY-VIX': 0.25, 'DXY-DXY': 1.0,
    }
};

const getCellStyle = (val) => {
    if (val === 1) return { background: '#1c1d22', color: '#888', fontWeight: 'bold' };
    if (val >= 0.7) return { background: '#064e3b', color: '#6ee7b7', fontWeight: 'bold' };
    if (val >= 0.3) return { background: '#062d22', color: '#a7f3d0' };
    if (val > -0.3 && val < 0.3) return { background: '#18191d', color: '#9ca3af' };
    if (val <= -0.7) return { background: '#881337', color: '#fca5a5', fontWeight: 'bold' };
    return { background: '#3f121d', color: '#fecaca' };
};

export default function PearsonCorrelationWidget({ correlationData }) {
    const [timeframe, setTimeframe] = useState('1M');
    const [activeTooltip, setActiveTooltip] = useState(null);
    
    // Seamless handling for both backend matrix format ({ assets, matrix, sample_size }) and legacy pair map
    const isLiveMatrix = Boolean(correlationData && Array.isArray(correlationData.assets) && Array.isArray(correlationData.matrix));
    const liveAssets = isLiveMatrix ? correlationData.assets.map(a => ({ ticker: a, name: a, group: 'Cross-Asset' })) : ASSETS;
    
    // Build pair lookup from 2D matrix if live
    const livePairLookup = {};
    if (isLiveMatrix) {
        const assetsList = correlationData.assets;
        const mat = correlationData.matrix;
        for (let i = 0; i < assetsList.length; i++) {
            for (let j = 0; j < assetsList.length; j++) {
                livePairLookup[`${assetsList[i]}-${assetsList[j]}`] = mat[i][j];
            }
        }
    }
    
    const displayAssets = isLiveMatrix ? liveAssets : ASSETS;
    const getValue = (rowTick, colTick) => {
        if (isLiveMatrix) {
            const val = livePairLookup[`${rowTick}-${colTick}`];
            return typeof val === 'number' ? val : (rowTick === colTick ? 1.0 : 0.0);
        }
        const periodData = correlationData?.[timeframe] || CORRELATION_DATA[timeframe] || {};
        return periodData[`${rowTick}-${colTick}`] !== undefined ? periodData[`${rowTick}-${colTick}`] : (rowTick === colTick ? 1.0 : 0.0);
    };

    return (
        <div style={{ background: 'var(--bg-panel)', border: 'var(--border-hairline)', padding: '16px', fontFamily: 'var(--font-mono)' }}>
            {!correlationData && <div style={{fontSize:11,color:'#f59e0b',marginBottom:8}}>📊 Showing demo correlation data</div>}
            
            {/* Header Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🌐</span>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.06em', color: 'var(--text-primary)' }}>
                            CROSS-ASSET PEARSON CORRELATION MATRIX
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            LINEAR ASSOCIATION (-1.0 TO +1.0) ACROSS 10 GLOBAL BENCHMARK ASSETS
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => setTimeframe('1M')}
                        className={'telemetry-btn ' + (timeframe === '1M' ? 'active' : '')}
                        style={{ fontSize: '10px', padding: '4px 10px', fontWeight: '700' }}
                    >
                        1 BULAN (30 Hari)
                    </button>
                    <button
                        onClick={() => setTimeframe('3M')}
                        className={'telemetry-btn ' + (timeframe === '3M' ? 'active' : '')}
                        style={{ fontSize: '10px', padding: '4px 10px', fontWeight: '700' }}
                    >
                        3 BULAN (90 Hari)
                    </button>
                </div>
            </div>

            {/* Legend Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '8px 10px', background: 'var(--bg-panel-subtle)', border: 'var(--border-muted)', fontSize: '10px', marginBottom: '14px' }}>
                <span style={{ fontWeight: '700', color: 'var(--accent-orange)' }}>SKALA WARNA:</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '10px', height: '10px', background: '#064e3b', display: 'inline-block' }}></span> +1.0 (Positif Kuat)
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '10px', height: '10px', background: '#062d22', display: 'inline-block' }}></span> +0.3 s/d +0.7
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '10px', height: '10px', background: '#18191d', display: 'inline-block' }}></span> 0.0 (Netral)
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '10px', height: '10px', background: '#3f121d', display: 'inline-block' }}></span> -0.3 s/d -0.7
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '10px', height: '10px', background: '#881337', display: 'inline-block' }}></span> -1.0 (Negatif Kuat)
                </span>
            </div>

            {/* Heatmap Grid Table */}
            <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'center' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '6px', background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)' }}></th>
                            {displayAssets.map(col => (
                                <th key={'col-' + col.ticker} style={{ padding: '6px 4px', background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--text-primary)', fontWeight: '700' }}>
                                    {col.ticker}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayAssets.map(row => (
                            <tr key={'row-' + row.ticker}>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '700', background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                    {row.ticker}
                                </td>
                                {displayAssets.map(col => {
                                    const key = `${row.ticker}-${col.ticker}`;
                                    const val = getValue(row.ticker, col.ticker);
                                    const style = getCellStyle(val);
                                    return (
                                        <td
                                            key={key}
                                            style={{
                                                padding: '8px 4px',
                                                border: 'var(--border-hairline)',
                                                cursor: 'pointer',
                                                transition: 'opacity 0.15s',
                                                ...style
                                            }}
                                            onMouseEnter={() => setActiveTooltip({ row: row.ticker, col: col.ticker, val })}
                                            onMouseLeave={() => setActiveTooltip(null)}
                                            title={`${row.ticker} vs ${col.ticker}: ${val > 0 ? '+' : ''}${val.toFixed(2)}`}
                                        >
                                            {val > 0 && val !== 1 ? '+' : ''}{val.toFixed(2)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Active Tooltip Callout */}
            {activeTooltip && (
                <div style={{ padding: '8px 12px', background: 'var(--bg-panel-subtle)', border: '1px solid var(--accent-blue)', fontSize: '11px', marginBottom: '14px', color: 'var(--text-primary)' }}>
                    💡 <strong>{activeTooltip.row} vs {activeTooltip.col}</strong>: Nilai Korelasi = <strong>{activeTooltip.val > 0 ? '+' : ''}{activeTooltip.val.toFixed(2)}</strong>.
                    {activeTooltip.val <= -0.7 ? ' Hubungan berlawanan arah sangat kuat (ideal untuk instrumen lindung nilai / hedging).' : activeTooltip.val >= 0.7 ? ' Bergerak hampir identik bersamaan (hindari double risk pada setup yang sama).' : ' Bergerak independen satu sama lain.'}
                </div>
            )}

            {/* Key Insights Box */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                <div style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '10px' }}>
                    <div style={{ color: 'var(--accent-green)', fontWeight: '700', fontSize: '10px', marginBottom: '4px' }}>
                        🛡️ BEST HEDGE PAIR (LINDUNG NILAI):
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        <strong>EUR/USD vs DXY (-0.95)</strong> &amp; <strong>SPY vs VIX (-0.85)</strong>: Ketika indeks saham jatuh terjal, volatilitas (VIX) melesat naik tajam. Gunakan emas atau instrumen inverse untuk memproteksi portofolio.
                    </div>
                </div>

                <div style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '10px' }}>
                    <div style={{ color: 'var(--accent-blue)', fontWeight: '700', fontSize: '10px', marginBottom: '4px' }}>
                        📈 HIGHEST SYNERGY (SEARAH):
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        <strong>SPY vs QQQ (+0.92)</strong> &amp; <strong>BTC vs ETH (+0.88)</strong>: Saham teknologi dan kripto utama bergerak seirama. Hindari memasang alokasi modal besar di keduanya sekaligus jika mencari diversifikasi murni.
                    </div>
                </div>

                <div style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', padding: '10px' }}>
                    <div style={{ color: 'var(--accent-gold)', fontWeight: '700', fontSize: '10px', marginBottom: '4px' }}>
                        🪙 SAFE HAVEN DYNAMICS:
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        <strong>Emas (XAU) vs DXY (-0.65)</strong>: Emas ditekan saat indeks Dolar AS menguat. Saat yield obligasi US10Y turun, daya tarik emas sebagai aset tanpa yield meningkat tajam.
                    </div>
                </div>
            </div>
        </div>
    );
}
