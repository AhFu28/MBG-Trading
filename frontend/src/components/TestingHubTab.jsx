import React, { useState } from 'react';
import VirtualForwardPortfolio from './VirtualForwardPortfolio.jsx';
import BacktestPerformanceLab from './BacktestPerformanceLab.jsx';

export default function TestingHubTab({
  dailyTradePlans = [],
  paperPortfolio = {},
  currentPrices = {},
  backtestLab = {},
  strategyRankings = [],
  onSelectTicker,
}) {
  const [activeSubTab, setActiveSubTab] = useState('PAPER'); // 'PAPER' | 'BACKTEST'

  return (
    <div className="telemetry-panel" style={{ border: 'var(--border-hairline)' }}>
      {/* Sub-tab Switcher Header */}
      <div className="telemetry-header" style={{
        background: 'var(--bg-panel-subtle)',
        borderBottom: 'var(--border-hairline)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 14px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-orange)', letterSpacing: '0.05em' }}>
            STRATEGY TESTING LAB //
          </span>

          <button
            className={'telemetry-btn ' + (activeSubTab === 'PAPER' ? 'active' : '')}
            onClick={() => setActiveSubTab('PAPER')}
            style={{ fontSize: '10px', padding: '5px 12px', fontWeight: '700' }}
          >
            🧪 FORWARD PAPER TRADING
          </button>

          <button
            className={'telemetry-btn ' + (activeSubTab === 'BACKTEST' ? 'active' : '')}
            onClick={() => setActiveSubTab('BACKTEST')}
            style={{ fontSize: '10px', padding: '5px 12px', fontWeight: '700' }}
          >
            📊 HISTORICAL BACKTEST LAB
          </button>
        </div>

        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          {activeSubTab === 'PAPER' 
            ? 'Forward Simulation · Real-time Execution Math · Zero Capital Risk'
            : 'Monte Carlo & Historical Risk-Adjusted Returns · Max Drawdown Verification'}
        </div>
      </div>

      {/* Sub-tab Content Area */}
      <div style={{ padding: '12px' }}>
        {activeSubTab === 'PAPER' ? (
          <VirtualForwardPortfolio
            dailyTradePlans={dailyTradePlans}
            paperPortfolio={paperPortfolio}
            currentPrices={currentPrices}
            onSelectTicker={onSelectTicker}
          />
        ) : (
          <BacktestPerformanceLab
            backtestLab={backtestLab}
            strategyRankings={strategyRankings}
          />
        )}
      </div>
    </div>
  );
}
