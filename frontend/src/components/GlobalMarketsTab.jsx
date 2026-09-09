import React, { useState, useEffect } from 'react';

const GlobalMarketsTab = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const tabs = ['ALL', 'WALL STREET', 'ASIA PACIFIC', 'INDONESIA', 'BONDS & YIELD', 'FOREX & CURRENCIES'];

  const marketSessions = [
    { name: 'Tokyo (TSE)', flag: '🇯🇵', open: '07:00', close: '13:30', isOpen: false },
    { name: 'Jakarta (IDX)', flag: '🇮🇩', open: '09:00', close: '16:00', isOpen: true },
    { name: 'London (LSE)', flag: '🇬🇧', open: '15:00', close: '23:30', isOpen: false },
    { name: 'New York (NYSE)', flag: '🇺🇸', open: '20:30', close: '03:00', isOpen: false },
  ];

  const assets = [
    { ticker: 'AAPL', name: 'Apple Inc.', flag: '🇺🇸', price: 175.50, change: 1.2, high: 176.0, low: 174.1, region: 'WALL STREET' },
    { ticker: 'BBCA', name: 'Bank Central Asia', flag: '🇮🇩', price: 9000, change: -0.5, high: 9050, low: 8950, region: 'INDONESIA' },
    { ticker: 'USD/IDR', name: 'US Dollar / Rupiah', flag: '🇺🇸/🇮🇩', price: 15500, change: 0.1, high: 15520, low: 15480, region: 'FOREX & CURRENCIES' },
  ];

  const filteredAssets = activeTab === 'ALL' ? assets : assets.filter(a => a.region === activeTab);

  const [convertFrom, setConvertFrom] = useState('USD');
  const [convertTo, setConvertTo] = useState('IDR');
  const [amount, setAmount] = useState(1);

  const handleChartClick = (ticker) => {
    alert(`Opening TradingView for ${ticker}`);
  };

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg shadow-lg">
      <div className="flex flex-wrap justify-between items-center mb-6">
        {marketSessions.map(session => (
          <div key={session.name} className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
            <span>{session.flag}</span>
            <span className="font-semibold text-sm">{session.name}</span>
            <span className="text-xs text-gray-400">{session.open} - {session.close} WIB</span>
            <span className={`h-2 w-2 rounded-full ${session.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
          </div>
        ))}
      </div>

      <div className="flex space-x-4 mb-4 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded font-semibold whitespace-nowrap ${activeTab === tab ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-2">Asset</th>
              <th className="p-2">Last Price</th>
              <th className="p-2">24h Change</th>
              <th className="p-2">High/Low</th>
              <th className="p-2">Trend</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map(asset => (
              <tr key={asset.ticker} className="border-b border-gray-800 hover:bg-gray-800">
                <td className="p-2">
                  <div className="flex items-center space-x-2">
                    <span>{asset.flag}</span>
                    <div>
                      <div className="font-bold">{asset.ticker}</div>
                      <div className="text-xs text-gray-400">{asset.name}</div>
                    </div>
                  </div>
                </td>
                <td className="p-2 font-mono">{asset.price.toLocaleString()}</td>
                <td className={`p-2 font-mono ${asset.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {asset.change > 0 ? '+' : ''}{asset.change}%
                </td>
                <td className="p-2 text-sm text-gray-400 font-mono">
                  {asset.high.toLocaleString()} / {asset.low.toLocaleString()}
                </td>
                <td className="p-2">
                  <div className={`h-1 w-12 rounded ${asset.change >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </td>
                <td className="p-2">
                  <button onClick={() => handleChartClick(asset.ticker)} className="bg-blue-500 hover:bg-blue-600 text-xs px-3 py-1 rounded">Chart</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Multi-Currency Quick Converter</h3>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-24 focus:outline-none"
          />
          <select value={convertFrom} onChange={(e) => setConvertFrom(e.target.value)} className="bg-gray-700 rounded px-2 py-1 border border-gray-600">
            {['USD', 'IDR', 'EUR', 'JPY', 'SGD', 'BTC', 'ETH'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span>=</span>
          <select value={convertTo} onChange={(e) => setConvertTo(e.target.value)} className="bg-gray-700 rounded px-2 py-1 border border-gray-600">
            {['USD', 'IDR', 'EUR', 'JPY', 'SGD', 'BTC', 'ETH'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="font-mono font-bold bg-gray-900 px-3 py-1 rounded border border-gray-600">--</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalMarketsTab;
