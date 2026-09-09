import React, { useState } from 'react';

const ASSETS = [
    { ticker: 'SPY', name: 'S&P 500', group: 'Equity' },
    { ticker: 'QQQ', name: 'Nasdaq', group: 'Equity' },
    { ticker: 'BTC', name: 'Bitcoin', group: 'Crypto' },
    { ticker: 'ETH', name: 'Ethereum', group: 'Crypto' },
    { ticker: 'EURUSD', name: 'Euro/USD', group: 'Forex' },
    { ticker: 'XAU', name: 'Gold', group: 'Commodity' },
    { ticker: 'WTI', name: 'Crude Oil', group: 'Commodity' },
    { ticker: 'US10Y', name: '10Y Treasury Yield', group: 'Rates' },
    { ticker: 'VIX', name: 'Volatility Index', group: 'Volatility' },
    { ticker: 'DXY', name: 'US Dollar Index', group: 'Forex' }
];

// Mock Data calibrated for typical intermarket relationships
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

const getCellStyling = (value) => {
    if (value === 1) return "bg-gray-800 text-gray-500 font-bold";
    if (value >= 0.7) return "bg-emerald-900 text-emerald-400 font-bold border border-emerald-500/30";
    if (value >= 0.3) return "bg-emerald-950/50 text-emerald-300";
    if (value > -0.3 && value < 0.3) return "bg-gray-800 text-gray-400";
    if (value <= -0.7) return "bg-rose-950 text-rose-400 font-bold border border-rose-500/30";
    return "bg-rose-950/40 text-rose-300";
};

const getTooltipText = (assetA, assetB, value) => {
    if (assetA === assetB) return `${assetA} berkorelasi sempurna dengan dirinya sendiri.`;
    
    let strength = "Lemah atau Tidak Ada";
    let direction = "";
    
    if (Math.abs(value) >= 0.7) strength = "Kuat";
    else if (Math.abs(value) >= 0.3) strength = "Moderat";

    if (value >= 0.3) direction = "Positif";
    else if (value <= -0.3) direction = "Negatif";

    let text = `${assetA} vs ${assetB}: Korelasi ${direction} ${strength} (${value > 0 ? '+' : ''}${value.toFixed(2)}) - `;
    
    if (value >= 0.7) text += "Cenderung bergerak sangat searah.";
    else if (value >= 0.3) text += "Sering bergerak searah.";
    else if (value <= -0.7) text += "Cenderung bergerak berlawanan arah secara signifikan.";
    else if (value <= -0.3) text += "Sering bergerak berlawanan arah.";
    else text += "Tidak ada hubungan pergerakan yang jelas (Independen).";

    return text;
};


export default function PearsonCorrelationWidget() {
    const [timeframe, setTimeframe] = useState('1M');

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex flex-col gap-6 shadow-xl">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <span style={{ fontSize: '22px' }}>🌐</span>
                    <h2 className="text-xl font-bold text-white tracking-wider">CROSS-ASSET PEARSON CORRELATION MATRIX</h2>
                </div>
                
                <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setTimeframe('1M')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${timeframe === '1M' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        1 BULAN (30 Hari)
                    </button>
                    <button 
                        onClick={() => setTimeframe('3M')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${timeframe === '3M' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        3 BULAN (90 Hari)
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-2 md:gap-6 text-xs text-gray-400 border-b border-gray-800 pb-4">
                <span className="font-semibold text-gray-300 mr-2">SKALA:</span>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-900 border border-emerald-500/50"></div>+1.0 (Positif Kuat)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-950/50"></div>+0.3 sd +0.7</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-800"></div>0.0 (Uncorrelated)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-rose-950/40"></div>-0.3 sd -0.7</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-rose-950 border border-rose-500/50"></div>-1.0 (Negatif Kuat)</div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto pb-4">
                <div className="min-w-[800px]">
                    <div className="grid grid-cols-11 gap-1">
                        {/* Empty top-left cell */}
                        <div className="p-2"></div>
                        
                        {/* Column Headers */}
                        {ASSETS.map(asset => (
                            <div key={`col-${asset.ticker}`} className="p-2 text-center flex flex-col justify-end group relative cursor-help">
                                <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">{asset.ticker}</span>
                                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-gray-800 text-xs text-gray-200 p-2 rounded shadow-lg pointer-events-none z-10 transition-opacity">
                                    {asset.name} ({asset.group})
                                </div>
                            </div>
                        ))}

                        {/* Rows */}
                        {ASSETS.map(rowAsset => (
                            <React.Fragment key={`row-${rowAsset.ticker}`}>
                                {/* Row Header */}
                                <div className="p-2 flex items-center justify-end group relative cursor-help pr-4">
                                    <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">{rowAsset.ticker}</span>
                                    <div className="opacity-0 group-hover:opacity-100 absolute right-full top-1/2 -translate-y-1/2 mr-2 w-max bg-gray-800 text-xs text-gray-200 p-2 rounded shadow-lg pointer-events-none z-10 transition-opacity">
                                        {rowAsset.name} ({rowAsset.group})
                                    </div>
                                </div>

                                {/* Cells */}
                                {ASSETS.map(colAsset => {
                                    const key = `${rowAsset.ticker}-${colAsset.ticker}`;
                                    const value = CORRELATION_DATA[timeframe][key];
                                    return (
                                        <div 
                                            key={key} 
                                            className={`
                                                relative group flex items-center justify-center p-3 rounded text-sm transition-all hover:scale-105 cursor-crosshair z-0 hover:z-10
                                                ${getCellStyling(value)}
                                            `}
                                        >
                                            {value > 0 && value !== 1 ? '+' : ''}{value === 1 ? '1.00' : value.toFixed(2)}
                                            
                                            {/* Cell Tooltip */}
                                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-950 border border-gray-700 text-xs text-gray-300 p-3 rounded-lg shadow-2xl pointer-events-none transition-opacity">
                                                {getTooltipText(rowAsset.ticker, colAsset.ticker, value)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Key Insights Box */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 mt-2">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <span>ℹ️</span>
                    KEY DIVERSIFICATION TAKEAWAYS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                        <div className="flex items-center gap-2 mb-2 text-emerald-400">
                            <span>🛡️</span>
                            <span className="text-xs font-bold uppercase">Best Hedge Pair</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            <strong className="text-gray-200">EURUSD vs DXY (-0.95)</strong>: Korelasi negatif sangat kuat. DXY secara inheren didominasi oleh EUR, menjadikannya lindung nilai (hedge) alami. SPY vs VIX (-0.85) juga menunjukkan hedge volatilitas klasik.
                        </p>
                    </div>
                    
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                        <div className="flex items-center gap-2 mb-2 text-blue-400">
                            <span>📈</span>
                            <span className="text-xs font-bold uppercase">Highest Synergy</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            <strong className="text-gray-200">SPY vs QQQ (+0.92)</strong> dan <strong className="text-gray-200">BTC vs ETH (+0.88)</strong>: Aset dalam kelas yang sama bergerak hampir identik. Hindari mengalokasikan modal terlalu besar di kedua aset ini sekaligus jika mencari diversifikasi.
                        </p>
                    </div>

                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                        <div className="flex items-center gap-2 mb-2 text-amber-400">
                            <span>📉</span>
                            <span className="text-xs font-bold uppercase">Safe Haven Status</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            <strong className="text-gray-200">Gold (XAU) vs VIX (+0.15)</strong>: Korelasi positif lemah dengan ketakutan pasar (VIX), menegaskan perannya sebagai pelindung nilai krisis. Emas (XAU) vs Dolar (DXY) (-0.65) menunjukkan emas ditekan saat dolar menguat.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
