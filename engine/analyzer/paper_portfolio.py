import json
import os
from datetime import datetime, timedelta
import uuid

class PaperPortfolio:
    """
    Track virtual trades to forward-test signal quality without risking real money
    """
    def __init__(self, initial_capital=100_000_000, risk_pct=0.02):
        self.initial_capital = initial_capital
        self.risk_pct = risk_pct
        self.realized_pnl_historical = 0.0
        self.trades = []
        self.state_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cache', 'paper_portfolio.json')
        self.load_state()

    def open_trade(self, ticker, entry_price, sl_price, tp1_price, tp2_price, strategy_type, lots=None) -> dict:
        for t in self.trades:
            if t['ticker'] == ticker and t['status'] in ['PENDING', 'ACTIVE']:
                return t

        current_cap = self.initial_capital + sum(t.get('pnl', 0) for t in self.trades if t['status'] not in ['PENDING', 'ACTIVE']) + self.realized_pnl_historical
        max_position_val = max(1_000_000, current_cap * 0.25)

        if lots is None:
            risk_amount = self.initial_capital * self.risk_pct
            risk_per_share = abs(entry_price - sl_price)
            if risk_per_share > 0:
                shares = risk_amount / risk_per_share
                lots = max(1, int(shares / 100))
            else:
                lots = 1

        if entry_price > 0 and (lots * 100 * entry_price) > max_position_val:
            lots = max(1, int(max_position_val / (100 * entry_price)))
        
        trade = {
            'id': str(uuid.uuid4()),
            'ticker': ticker,
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
        # current_prices format: {ticker: {high, low, current}} or {ticker: price}
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
                fee_rate = 0.004 # 0.4% round-trip IDX fee & tax
                cost_basis = trade['entry_price'] * trade['lots'] * 100
                if low <= trade['sl_price']:
                    new_status = 'SL_HIT'
                    gross_pnl = (trade['sl_price'] - trade['entry_price']) * trade['lots'] * 100
                    pnl = gross_pnl - (cost_basis * fee_rate)
                elif high >= trade['tp2_price']:
                    new_status = 'TP2_HIT'
                    gross_pnl = (trade['tp2_price'] - trade['entry_price']) * trade['lots'] * 100
                    pnl = gross_pnl - (cost_basis * fee_rate)
                elif high >= trade['tp1_price']:
                    new_status = 'TP1_HIT'
                    gross_pnl = (trade['tp1_price'] - trade['entry_price']) * trade['lots'] * 100
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
                opened_at = datetime.fromisoformat(trade['opened_at'])
                if (now - opened_at).days >= max_days:
                    trade['status'] = 'EXPIRED'
                    trade['closed_at'] = now.isoformat()
                    changed = True
        if changed:
            self.save_state()

    def get_portfolio_summary(self) -> dict:
        total_trades = len(self.trades)
        active_trades = len([t for t in self.trades if t['status'] in ['PENDING', 'ACTIVE']])
        
        closed_trades = [t for t in self.trades if t['status'] in ['TP1_HIT', 'TP2_HIT', 'SL_HIT']]
        win_trades = [t for t in closed_trades if t['pnl'] > 0]
        loss_trades = [t for t in closed_trades if t['pnl'] < 0]
        
        win_count = len(win_trades)
        loss_count = len(loss_trades)
        win_rate_pct = win_count / len(closed_trades) if closed_trades else 0
        
        total_pnl = sum(t['pnl'] for t in closed_trades) + self.realized_pnl_historical
        
        best_trade = max(closed_trades, key=lambda x: x['pnl']) if closed_trades else None
        worst_trade = min(closed_trades, key=lambda x: x['pnl']) if closed_trades else None
        
        strategy_breakdown = {}
        for t in closed_trades:
            st = t['strategy_type']
            if st not in strategy_breakdown:
                strategy_breakdown[st] = {'wins': 0, 'losses': 0, 'pnl': 0}
            if t['pnl'] > 0:
                strategy_breakdown[st]['wins'] += 1
            else:
                strategy_breakdown[st]['losses'] += 1
            strategy_breakdown[st]['pnl'] += t['pnl']
            
        return {
            'total_trades': total_trades,
            'active_trades': active_trades,
            'win_count': win_count,
            'loss_count': loss_count,
            'win_rate_pct': win_rate_pct,
            'total_pnl': total_pnl,
            'total_pnl_pct': total_pnl / self.initial_capital if self.initial_capital else 0,
            'best_trade': best_trade,
            'worst_trade': worst_trade,
            'avg_rr_achieved': 0, # Placeholder
            'current_capital': self.initial_capital + total_pnl,
            'strategy_breakdown': strategy_breakdown
        }

    def get_active_trades(self) -> list:
        return [t for t in self.trades if t['status'] in ['PENDING', 'ACTIVE']]

    def get_recent_closed(self, limit=20) -> list:
        closed = [t for t in self.trades if t['status'] not in ['PENDING', 'ACTIVE']]
        closed.sort(key=lambda x: x.get('closed_at') or '', reverse=True)
        return closed[:limit]

    def save_state(self):
        # Rolling 30-day purge with historical PnL preservation
        now = datetime.now()
        filtered_trades = []
        for t in self.trades:
            if t['status'] in ['PENDING', 'ACTIVE']:
                filtered_trades.append(t)
            elif t.get('closed_at'):
                try:
                    closed_at = datetime.fromisoformat(t['closed_at'])
                    if (now - closed_at).days <= 30:
                        filtered_trades.append(t)
                    else:
                        self.realized_pnl_historical += float(t.get('pnl', 0))
                except Exception:
                    filtered_trades.append(t)
            else:
                filtered_trades.append(t)
        self.trades = filtered_trades
        
        os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
        try:
            with open(self.state_file, 'w') as f:
                json.dump({
                    'initial_capital': self.initial_capital,
                    'risk_pct': self.risk_pct,
                    'realized_pnl_historical': self.realized_pnl_historical,
                    'trades': self.trades
                }, f, indent=2)
        except Exception as e:
            print(f"Error saving paper portfolio state: {e}")

    def load_state(self):
        if not os.path.exists(self.state_file):
            return
        try:
            with open(self.state_file, 'r') as f:
                data = json.load(f)
                self.initial_capital = data.get('initial_capital', self.initial_capital)
                self.risk_pct = data.get('risk_pct', self.risk_pct)
                self.realized_pnl_historical = float(data.get('realized_pnl_historical', 0.0))
                self.trades = data.get('trades', [])
        except Exception as e:
            print(f"Error loading paper portfolio state: {e}")
            self.trades = []
