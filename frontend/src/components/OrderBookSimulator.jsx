import React from 'react';

const OrderBookSimulator = ({ ticker = 'BBCA', currentPrice = 9000, isOpen = false, onClose }) => {
  if (!isOpen) return null;

  const generateLevels = (startPrice, isBid) => {
    return Array.from({ length: 10 }).map((_, i) => {
      const price = isBid ? startPrice - (i * 25) : startPrice + (i * 25);
      const lotQuantity = Math.floor(Math.random() * 5000) + 100;
      return { price, lotQuantity };
    });
  };

  const bids = generateLevels(currentPrice - 25, true);
  const asks = generateLevels(currentPrice + 25, false).reverse();

  let bidVol = 0;
  const bidsWithCumulative = bids.map(b => {
    bidVol += b.lotQuantity;
    return { ...b, cumulative: bidVol };
  });

  let askVol = 0;
  const asksWithCumulative = [...asks].reverse().map(a => {
    askVol += a.lotQuantity;
    return { ...a, cumulative: askVol };
  }).reverse();

  const maxVol = Math.max(bidVol, askVol);
  const spread = 25;
  const spreadPercent = ((spread / currentPrice) * 100).toFixed(2);
  const buyerRatio = Math.round((bidVol / (bidVol + askVol)) * 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl w-full max-w-4xl flex flex-col max-h-screen">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold">{ticker} Order Book</h2>
            <div className="text-sm text-gray-400">Market Depth & L2 Data Simulator</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white font-bold text-xl">&times;</button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-4 bg-gray-800 p-2 rounded">
            <div className="font-mono text-lg font-bold">Spread: Rp {spread} / {spreadPercent}%</div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">Power Ratio:</div>
              <div className="flex items-center w-64 h-4 bg-gray-700 rounded overflow-hidden">
                <div className="bg-green-500 h-full text-xs flex items-center justify-center font-bold" style={{ width: `${buyerRatio}%` }}>{buyerRatio}% Buy</div>
                <div className="bg-red-500 h-full text-xs flex items-center justify-center font-bold" style={{ width: `${100 - buyerRatio}%` }}>{100 - buyerRatio}% Sell</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* BIDS */}
            <div>
              <div className="grid grid-cols-3 text-sm text-gray-400 font-bold border-b border-gray-700 pb-2 mb-2 text-right">
                <div className="text-left">Cum Vol</div>
                <div>Lot</div>
                <div className="text-green-500">Bid</div>
              </div>
              {bidsWithCumulative.map((bid, i) => (
                <div key={i} className="grid grid-cols-3 text-sm font-mono relative py-1 hover:bg-gray-800 text-right group">
                  <div className="absolute right-0 top-0 bottom-0 bg-green-900 bg-opacity-30 z-0" style={{ width: `${(bid.cumulative / maxVol) * 100}%` }}></div>
                  <div className="relative z-10 text-left text-gray-400">{bid.cumulative.toLocaleString()}</div>
                  <div className="relative z-10 text-gray-300">{bid.lotQuantity.toLocaleString()}</div>
                  <div className="relative z-10 text-green-500 font-bold">{bid.price.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* ASKS */}
            <div>
              <div className="grid grid-cols-3 text-sm text-gray-400 font-bold border-b border-gray-700 pb-2 mb-2 text-left">
                <div className="text-red-500">Ask</div>
                <div>Lot</div>
                <div className="text-right">Cum Vol</div>
              </div>
              {asksWithCumulative.map((ask, i) => (
                <div key={i} className="grid grid-cols-3 text-sm font-mono relative py-1 hover:bg-gray-800 text-left group">
                  <div className="absolute left-0 top-0 bottom-0 bg-red-900 bg-opacity-30 z-0" style={{ width: `${(ask.cumulative / maxVol) * 100}%` }}></div>
                  <div className="relative z-10 text-red-500 font-bold">{ask.price.toLocaleString()}</div>
                  <div className="relative z-10 text-gray-300">{ask.lotQuantity.toLocaleString()}</div>
                  <div className="relative z-10 text-right text-gray-400">{ask.cumulative.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBookSimulator;
