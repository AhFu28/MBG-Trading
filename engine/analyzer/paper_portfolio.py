import json
import os
from datetime import datetime, timedelta
import uuid

class PaperPortfolio:
    """
    Track virtual trades to forward-test signal quality across multiple asset classes:
    IDX Stocks (1 lot = 100 shares), Forex (1 lot = 100k units), Crypto (1 unit), Commodities (100 oz), and US Stocks.
    """
    def __init__(self, initial_capital=100_000_000, risk_pct=0.02, state_file=None):
        self.initial_capital = initial_capital
        self.risk_pct = risk_pct
        self.realized_pnl_historical = 0.0
        self.trades = []
        if state_file is False:
            self.state_file = None
        else:
            self.state_file = state_file or os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cache', 'paper_portfolio.json')
            self.load_state()

    @staticmethod
    def detect_market(ticker: str) -> str:
        t = str(ticker).upper()
        if t.endswith('.JK') or t in ['BBCA', 'BBRI', 'BMRI', 'BBNI', 'TLKM', 'ASII', 'ANTM', 'BRMS', 'MDKA', 'MEDC', 'ADRO']:
            return 'IDX'
        if any(fx in t for fx in ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURJPY', 'GBPJPY']):
            return 'FOREX'
        if 'XAU' in t or 'GOLD' in t or 'XAG' in t or 'OIL' in t or 'WTI' in t or 'BRENT' in t:
            return 'COMMODITY'
        if 'USDT' in t or t in ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'SUI']:
            return 'CRYPTO'
        return 'US'

    def open_trade(self, ticker, entry_price, sl_price, tp1_price, tp2_price, strategy_type, lots=None, market=None) -> dict:
        for t in self.trades:
            if t['ticker'] == ticker and t['status'] in ['PENDING', 'ACTIVE']:
                return t

        market = market or self.detect_market(ticker)
        current_cap = self.initial_capital + sum(t.get('pnl', 0) for t in self.trades if t['status'] not in ['PENDING', 'ACTIVE']) + self.realized_pnl_historical
        max_position_val = max(1_000_000, current_cap * 0.25)
        risk_amount = self.initial_capital * self.risk_pct
        sl_distance = abs(entry_price - sl_price)

        if lots is None:
            if market == 'IDX':
                shares = (risk_amount / sl_distance) if sl_distance > 0 else 100
                lots = max(1, int(shares / 100))
            elif market == 'FOREX':
                # Mario Singh Fixed Fractional: 1 lot = 100,000 units ($10/pip on EURUSD)
                pip_size = 0.01 if 'JPY' in ticker.upper() else 0.0001
                sl_pips = max(1.0, sl_distance / pip_size)
                # Assuming USD base for risk amount in IDR/USD conversion (scaled to lot)
                lots = max(0.01, round(risk_amount / (sl_pips * 150_000), 2))
            elif market == 'COMMODITY':
                # Gold: 1 lot = 100 oz ($10 per $0.10 move)
                lots = max(0.01, round(risk_amount / (max(1.0, sl_distance) * 1_500_000), 2))
            elif market == 'CRYPTO':
                lots = max(0.001, round(risk_amount / (sl_distance * 15_000 + 1e-6), 4))
            else: # US Stock
                lots = max(1, int(risk_amount / (sl_distance * 15_000 + 1e-6)))

        # Position value cap safeguard
        pos_mult = 100 if market == 'IDX' else (100000 if market == 'FOREX' else 1)
        if entry_price > 0 and (lots * pos_mult * entry_price) > max_position_val and market == 'IDX':
            lots = max(1, int(max_position_val / (100 * entry_price)))

        trade = {
            'id': str(uuid.uuid4()),
            'ticker': ticker,
            'market': market,
            'entry_price': entry_price,
            'sl_price': sl_price,
            'tp1_price': tp1_price,
            'tp2_price': tp2_price,
            'lots': lots,
            'strategy_type': strategy_type,
            'status': 'PENDING',
            'opened_at': datetime.now().isoformat(),
            'closed_at': None,
            'pnl': 0,
            'pnl_pct': 0
        }
        self.trades.append(trade)
        self.save_state()
        return trade

    def check_and_update_trades(self, current_prices: dict) -> list:
        status_changes = []
        for trade in self.trades:
            if trade['status'] in ['EXPIRED', 'CANCELLED', 'TP1_HIT', 'TP2_HIT', 'SL_HIT']:
                continue

            ticker = trade['ticker']
            if ticker not in current_prices:
                continue

            curr_price = current_prices[ticker]
            if isinstance(curr_price, dict):
                price = curr_price.get('current', curr_price.get('close', 0))
                high = curr_price.get('high', price)
                low = curr_price.get('low', price)
            else:
                price = curr_price
                high = price
                low = price

            old_status = trade['status']
            market = trade.get('market', self.detect_market(ticker))

            if trade['status'] == 'PENDING':
                if price <= trade['entry_price']:
                    trade['status'] = 'ACTIVE'
                    status_changes.append({
                        'trade_id': trade['id'],
                        'old_status': old_status,
                        'new_status': 'ACTIVE',
                        'pnl': 0
                    })

            if trade['status'] == 'ACTIVE':
                new_status = None
                pnl = 0
                
                # Multi-asset position multiplier & fee model
                if market == 'IDX':
                    mult = 100
                    fee_rate = 0.004 # 0.4% IDX fee/tax
                elif market == 'FOREX':
                    mult = 100000
                    fee_rate = 0.00015 # ~1.5 pips spread
                elif market == 'COMMODITY':
                    mult = 100 # 100 oz per gold lot
                    fee_rate = 0.0002
                elif market == 'CRYPTO':
                    mult = 1.0
                    fee_rate = 0.0005 # 0.05% taker fee
                else: # US Stock
                    mult = 1.0
                    fee_rate = 0.001

                cost_basis = trade['entry_price'] * trade['lots'] * mult

                if low <= trade['sl_price']:
                    new_status = 'SL_HIT'
                    gross_pnl = (trade['sl_price'] - trade['entry_price']) * trade['lots'] * mult
                    pnl = gross_pnl - (cost_basis * fee_rate)
                elif high >= trade['tp2_price']:
                    new_status = 'TP2_HIT'
                    gross_pnl = (trade['tp2_price'] - trade['entry_price']) * trade['lots'] * mult
                    pnl = gross_pnl - (cost_basis * fee_rate)
                elif high >= trade['tp1_price']:
                    new_status = 'TP1_HIT'
                    gross_pnl = (trade['tp1_price'] - trade['entry_price']) * trade['lots'] * mult
                    pnl = gross_pnl - (cost_basis * fee_rate)

                if new_status:
                    trade['status'] = new_status
                    trade['closed_at'] = datetime.now().isoformat()
                    trade['pnl'] = pnl
                    trade['pnl_pct'] = pnl / cost_basis if cost_basis > 0 else 0
                    status_changes.append({
                        'trade_id': trade['id'],
                        'ticker': trade['ticker'],
                        'strategy_type': trade.get('strategy_type', 'Astra'),
                        'old_status': old_status,
                        'new_status': new_status,
                        'pnl': pnl,
                        'pnl_pct': trade['pnl_pct']
                    })

        if status_changes:
            self.save_state()

        return status_changes

    def expire_old_trades(self, max_days=5):
        changed = False
        now = datetime.now()
        for trade in self.trades:
            if trade['status'] == 'PENDING':
                opened = datetime.fromisoformat(trade['opened_at'])
                if now - opened > timedelta(days=max_days):
                    trade['status'] = 'EXPIRED'
                    trade['closed_at'] = now.isoformat()
                    changed = True
        if changed:
            self.save_state()

    def get_summary(self) -> dict:
        total_trades = len(self.trades)
        closed_trades = [t for t in self.trades if t['status'] in ['TP1_HIT', 'TP2_HIT', 'SL_HIT']]
        active_trades = [t for t in self.trades if t['status'] == 'ACTIVE']
        pending_trades = [t for t in self.trades if t['status'] == 'PENDING']

        wins = [t for t in closed_trades if t['pnl'] > 0]
        losses = [t for t in closed_trades if t['pnl'] <= 0]
        win_rate = len(wins) / len(closed_trades) if closed_trades else 0.0
        total_pnl = sum(t['pnl'] for t in closed_trades) + self.realized_pnl_historical

        gross_profit = sum(t['pnl'] for t in wins)
        gross_loss = abs(sum(t['pnl'] for t in losses))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else (99.0 if gross_profit > 0 else 0.0)

        return {
            'initial_capital': self.initial_capital,
            'current_capital': self.initial_capital + total_pnl,
            'total_pnl': total_pnl,
            'total_pnl_pct': total_pnl / self.initial_capital,
            'total_trades': total_trades,
            'closed_trades': len(closed_trades),
            'active_trades': len(active_trades),
            'pending_trades': len(pending_trades),
            'win_rate': round(win_rate, 4),
            'profit_factor': round(profit_factor, 2),
            'trades': self.trades[-20:]
        }

    def save_state(self):
        if not self.state_file:
            return
        os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
        try:
            with open(self.state_file, 'w') as f:
                json.dump({
                    'initial_capital': self.initial_capital,
                    'realized_pnl_historical': self.realized_pnl_historical,
                    'trades': self.trades
                }, f, indent=2)
        except Exception as e:
            pass

    def load_state(self):
        if not self.state_file or not os.path.exists(self.state_file):
            return
        try:
            with open(self.state_file, 'r') as f:
                data = json.load(f)
                self.initial_capital = data.get('initial_capital', self.initial_capital)
                self.realized_pnl_historical = data.get('realized_pnl_historical', 0.0)
                self.trades = data.get('trades', [])
        except Exception as e:
            pass
