import pandas as pd
import numpy as np

class SMCDetector:
    def __init__(self, ob_lookback=20, bos_lookback=20):
        self.ob_lookback = ob_lookback
        self.bos_lookback = bos_lookback

    def _calculate_atr(self, df: pd.DataFrame, period: int = 14) -> pd.Series:
        high_low = df['High'] - df['Low']
        high_close = np.abs(df['High'] - df['Close'].shift())
        low_close = np.abs(df['Low'] - df['Close'].shift())
        ranges = pd.concat([high_low, high_close, low_close], axis=1)
        true_range = np.max(ranges, axis=1)
        return true_range.rolling(period).mean()

    def detect_order_blocks(self, df: pd.DataFrame, lookback=20) -> list:
        if len(df) < lookback:
            return []

        order_blocks = []
        atr = self._calculate_atr(df)
        
        for i in range(1, len(df) - 1):
            is_bullish_impulse = False
            if i + 3 < len(df):
                if all(df['Close'].iloc[i+j] > df['Open'].iloc[i+j] for j in range(1, 4)):
                    is_bullish_impulse = True
            
            body = abs(df['Close'].iloc[i+1] - df['Open'].iloc[i+1])
            if body > 2 * atr.iloc[i+1]:
                if df['Close'].iloc[i+1] > df['Open'].iloc[i+1]:
                    is_bullish_impulse = True
            
            is_bearish = df['Close'].iloc[i] < df['Open'].iloc[i]
            if is_bullish_impulse and is_bearish:
                price_high = df['High'].iloc[i]
                price_low = df['Low'].iloc[i]
                candle_date = df.index[i]
                
                status = 'FRESH'
                for j in range(i + 2, len(df)):
                    if df['Close'].iloc[j] < price_low:
                        status = 'BROKEN'
                        break
                    if df['Low'].iloc[j] <= price_high:
                        status = 'TESTED'
                
                order_blocks.append({
                    'type': 'BULLISH_OB',
                    'price_high': float(price_high),
                    'price_low': float(price_low),
                    'candle_date': str(candle_date.date()),
                    'strength': 'STRONG' if body > 2 * atr.iloc[i+1] else 'MODERATE',
                    'status': status
                })

            is_bearish_impulse = False
            if i + 3 < len(df):
                if all(df['Close'].iloc[i+j] < df['Open'].iloc[i+j] for j in range(1, 4)):
                    is_bearish_impulse = True
            
            if body > 2 * atr.iloc[i+1]:
                if df['Close'].iloc[i+1] < df['Open'].iloc[i+1]:
                    is_bearish_impulse = True
                    
            is_bullish = df['Close'].iloc[i] > df['Open'].iloc[i]
            if is_bearish_impulse and is_bullish:
                price_high = df['High'].iloc[i]
                price_low = df['Low'].iloc[i]
                candle_date = df.index[i]
                
                status = 'FRESH'
                for j in range(i + 2, len(df)):
                    if df['Close'].iloc[j] > price_high:
                        status = 'BROKEN'
                        break
                    if df['High'].iloc[j] >= price_low:
                        status = 'TESTED'
                
                order_blocks.append({
                    'type': 'BEARISH_OB',
                    'price_high': float(price_high),
                    'price_low': float(price_low),
                    'candle_date': str(candle_date.date()),
                    'strength': 'STRONG' if body > 2 * atr.iloc[i+1] else 'MODERATE',
                    'status': status
                })
        return order_blocks

    def detect_fair_value_gaps(self, df: pd.DataFrame) -> list:
        if len(df) < 3:
            return []
            
        fvgs = []
        for i in range(1, len(df) - 1):
            prev_high = df['High'].iloc[i-1]
            next_low = df['Low'].iloc[i+1]
            
            prev_low = df['Low'].iloc[i-1]
            next_high = df['High'].iloc[i+1]
            
            if next_low > prev_high:
                gap_low = prev_high
                gap_high = next_low
                gap_size_pct = (gap_high - gap_low) / gap_low * 100
                
                filled = False
                for j in range(i + 2, len(df)):
                    if df['Low'].iloc[j] <= gap_low:
                        filled = True
                        break
                        
                fvgs.append({
                    'type': 'BULLISH_FVG',
                    'gap_high': float(gap_high),
                    'gap_low': float(gap_low),
                    'gap_size_pct': float(gap_size_pct),
                    'candle_date': str(df.index[i].date()),
                    'filled': filled
                })
                
            if next_high < prev_low:
                gap_high = prev_low
                gap_low = next_high
                gap_size_pct = (gap_high - gap_low) / gap_low * 100
                
                filled = False
                for j in range(i + 2, len(df)):
                    if df['High'].iloc[j] >= gap_high:
                        filled = True
                        break
                        
                fvgs.append({
                    'type': 'BEARISH_FVG',
                    'gap_high': float(gap_high),
                    'gap_low': float(gap_low),
                    'gap_size_pct': float(gap_size_pct),
                    'candle_date': str(df.index[i].date()),
                    'filled': filled
                })
                
        return fvgs

    def detect_break_of_structure(self, df: pd.DataFrame, lookback=20) -> dict:
        if len(df) < lookback:
            return {'direction': 'NEUTRAL', 'last_break_date': None, 'break_level': None}
            
        recent_data = df.iloc[-lookback:]
        swing_high = recent_data['High'].max()
        swing_low = recent_data['Low'].min()
        
        last_price = df['Close'].iloc[-1]
        
        direction = 'NEUTRAL'
        break_level = None
        last_break_date = None
        
        if last_price > swing_high:
            direction = 'BULLISH'
            break_level = float(swing_high)
            last_break_date = str(df.index[-1].date())
        elif last_price < swing_low:
            direction = 'BEARISH'
            break_level = float(swing_low)
            last_break_date = str(df.index[-1].date())
            
        return {
            'direction': direction,
            'last_break_date': last_break_date,
            'break_level': break_level
        }

    def analyze(self, df: pd.DataFrame, ticker: str) -> dict:
        if len(df) < 30:
            return {
                'ticker': ticker,
                'error': 'Insufficient data, needs at least 30 bars.'
            }
            
        df = df[df['Volume'] > 0]
        
        ob = self.detect_order_blocks(df, self.ob_lookback)
        fvg = self.detect_fair_value_gaps(df)
        bos = self.detect_break_of_structure(df, self.bos_lookback)
        
        recent_high = df['High'].rolling(20).max().iloc[-1]
        recent_low = df['Low'].rolling(20).min().iloc[-1]
        
        if pd.isna(recent_high) or pd.isna(recent_low):
            recent_high = df['High'].max()
            recent_low = df['Low'].min()
            
        midline = (recent_high + recent_low) / 2
        
        discount_zone = {'high': float(midline), 'low': float(recent_low)}
        premium_zone = {'high': float(recent_high), 'low': float(midline)}
        
        last_price = df['Close'].iloc[-1]
        
        in_discount = last_price <= midline
        
        has_fresh_bullish_ob = any(o['type'] == 'BULLISH_OB' and o['status'] in ['FRESH', 'TESTED'] and last_price >= o['price_low'] and last_price <= o['price_high'] * 1.05 for o in ob)
        has_unfilled_bullish_fvg = any(f['type'] == 'BULLISH_FVG' and not f['filled'] and last_price >= f['gap_low'] for f in fvg)
        is_bullish_bos = bos['direction'] == 'BULLISH'
        
        score = 0
        if in_discount: score += 25
        if has_fresh_bullish_ob: score += 30
        if has_unfilled_bullish_fvg: score += 25
        if is_bullish_bos: score += 20
        
        bias = 'NEUTRAL'
        if score >= 70:
            bias = 'BULLISH'
        elif score < 30:
            bias = 'BEARISH'
            
        return {
            'ticker': ticker,
            'smc_bias': bias,
            'order_blocks': ob,
            'fair_value_gaps': fvg,
            'structure': bos,
            'discount_zone': discount_zone,
            'premium_zone': premium_zone,
            'confluence_score': score
        }

if __name__ == '__main__':
    import yfinance as yf
    import json
    
    print("Fetching BBRI.JK 3-month data...")
    ticker = "BBRI.JK"
    try:
        # Avoid multi-index columns by downloading directly 
        df = yf.download(ticker, period="3m")
        # Ensure single level columns
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.droplevel(1)
        
        detector = SMCDetector()
        results = detector.analyze(df, ticker)
        
        print(json.dumps(results, indent=2))
    except Exception as e:
        print(f"Error fetching data or running analysis: {e}")
