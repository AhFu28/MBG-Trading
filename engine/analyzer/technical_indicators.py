import numpy as np
import pandas as pd

class TechnicalIndicators:
    """
    Zero-dependency institutional technical indicator suite using vectorized Pandas & NumPy.
    Calculates RSI-14, MACD (12,26,9), Bollinger Bands (20,2), EMA Alignment (20,50,200), and ATR-14.
    """

    @staticmethod
    def calculate_rsi(series: pd.Series, period: int = 14) -> float:
        if len(series) < period + 1:
            return 50.0
        delta = series.diff()
        gain = delta.where(delta > 0, 0.0)
        loss = -delta.where(delta < 0, 0.0)
        
        avg_gain = gain.rolling(window=period, min_periods=period).mean()
        avg_loss = loss.rolling(window=period, min_periods=period).mean()
        
        # Exponential smoothing (Wilder's method)
        for i in range(period, len(series)):
            avg_gain.iloc[i] = (avg_gain.iloc[i - 1] * (period - 1) + gain.iloc[i]) / period
            avg_loss.iloc[i] = (avg_loss.iloc[i - 1] * (period - 1) + loss.iloc[i]) / period
            
        rs = avg_gain / (avg_loss + 1e-9)
        rsi = 100.0 - (100.0 / (1.0 + rs))
        val = rsi.iloc[-1]
        return round(float(val), 2) if not np.isnan(val) else 50.0

    @staticmethod
    def calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> dict:
        if len(series) < slow + signal:
            return {'line': 0.0, 'signal': 0.0, 'hist': 0.0, 'status': 'NEUTRAL'}
            
        ema_fast = series.ewm(span=fast, adjust=False).mean()
        ema_slow = series.ewm(span=slow, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        hist = macd_line - signal_line
        
        last_macd = float(macd_line.iloc[-1])
        last_sig = float(signal_line.iloc[-1])
        last_hist = float(hist.iloc[-1])
        prev_hist = float(hist.iloc[-2]) if len(hist) > 1 else 0.0
        
        status = 'NEUTRAL'
        if prev_hist < 0 and last_hist >= 0:
            status = 'GOLDEN_CROSS'
        elif prev_hist > 0 and last_hist <= 0:
            status = 'DEATH_CROSS'
        elif last_hist > 0:
            status = 'BULLISH'
        elif last_hist < 0:
            status = 'BEARISH'
            
        return {
            'line': round(last_macd, 2),
            'signal': round(last_sig, 2),
            'hist': round(last_hist, 2),
            'status': status
        }

    @staticmethod
    def calculate_bollinger_bands(series: pd.Series, period: int = 20, num_std: float = 2.0) -> dict:
        if len(series) < period:
            last = float(series.iloc[-1]) if not series.empty else 0.0
            return {'upper': last, 'mid': last, 'lower': last, 'bandwidth': 0.0, 'is_squeeze': False}
            
        rolling_mean = series.rolling(window=period).mean()
        rolling_std = series.rolling(window=period).std()
        
        upper = rolling_mean + (rolling_std * num_std)
        lower = rolling_mean - (rolling_std * num_std)
        bandwidth = (upper - lower) / (rolling_mean + 1e-9)
        
        last_upper = float(upper.iloc[-1])
        last_mid = float(rolling_mean.iloc[-1])
        last_lower = float(lower.iloc[-1])
        last_bw = float(bandwidth.iloc[-1])
        
        # Squeeze defined as bandwidth in lowest 20th percentile of last 60 periods
        recent_bw = bandwidth.dropna().tail(60)
        is_squeeze = bool(last_bw <= recent_bw.quantile(0.20)) if len(recent_bw) >= 20 else False
        
        return {
            'upper': round(last_upper, 2),
            'mid': round(last_mid, 2),
            'lower': round(last_lower, 2),
            'bandwidth': round(last_bw, 4),
            'is_squeeze': is_squeeze
        }

    @staticmethod
    def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> float:
        if len(close) < period + 1:
            return round(float(high.iloc[-1] - low.iloc[-1]), 2) if not high.empty else 0.0
            
        prev_close = close.shift(1)
        tr1 = high - low
        tr2 = (high - prev_close).abs()
        tr3 = (low - prev_close).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        
        atr = tr.rolling(window=period).mean()
        val = float(atr.iloc[-1])
        return round(val, 2) if not np.isnan(val) else 0.0

    @classmethod
    def analyze(cls, df: pd.DataFrame) -> dict:
        """
        Takes an OHLCV DataFrame and generates multi-indicator confluence.
        """
        if df is None or len(df) < 20:
            return {
                'rsi_14': 50.0,
                'macd': {'status': 'NEUTRAL', 'line': 0.0, 'signal': 0.0, 'hist': 0.0},
                'bollinger': {'upper': 0.0, 'mid': 0.0, 'lower': 0.0, 'is_squeeze': False},
                'ema_alignment': 'NEUTRAL',
                'atr_14': 0.0,
                'confluence_score': 50
            }

        close = df['Close']
        high = df['High']
        low = df['Low']

        rsi = cls.calculate_rsi(close, 14)
        macd = cls.calculate_macd(close, 12, 26, 9)
        bb = cls.calculate_bollinger_bands(close, 20, 2.0)
        atr = cls.calculate_atr(high, low, close, 14)

        # EMA Alignment
        ema20 = float(close.ewm(span=20, adjust=False).mean().iloc[-1])
        ema50 = float(close.ewm(span=50, adjust=False).mean().iloc[-1]) if len(close) >= 50 else ema20
        ema200 = float(close.ewm(span=200, adjust=False).mean().iloc[-1]) if len(close) >= 200 else ema50
        last_price = float(close.iloc[-1])

        if last_price > ema20 > ema50 > ema200:
            ema_alignment = 'STRONG_BULLISH'
        elif last_price > ema20 > ema50:
            ema_alignment = 'BULLISH'
        elif last_price < ema20 < ema50 < ema200:
            ema_alignment = 'STRONG_BEARISH'
        else:
            ema_alignment = 'NEUTRAL'

        # Confluence scoring (0 - 100)
        score = 0
        # 1. RSI Scoring (25 pts max)
        if 40 <= rsi <= 60:
            score += 25  # Optimal accumulation zone
        elif 30 <= rsi < 40 or 60 < rsi <= 70:
            score += 18
        elif rsi < 30:
            score += 15  # Oversold (rebound potential)
        else:
            score += 5   # Overbought (>70)

        # 2. MACD Scoring (25 pts max)
        if macd['status'] == 'GOLDEN_CROSS':
            score += 25
        elif macd['status'] == 'BULLISH':
            score += 18
        elif macd['status'] == 'NEUTRAL':
            score += 10
        else:
            score += 0

        # 3. EMA Trend Alignment (25 pts max)
        if ema_alignment == 'STRONG_BULLISH':
            score += 25
        elif ema_alignment == 'BULLISH':
            score += 18
        elif ema_alignment == 'NEUTRAL':
            score += 10
        else:
            score += 0

        # 4. Bollinger Band (25 pts max)
        if bb['is_squeeze']:
            score += 25  # Explosive breakout setup
        elif last_price <= bb['lower'] * 1.01:
            score += 20  # Lower band bounce
        elif last_price >= bb['mid']:
            score += 15
        else:
            score += 8

        return {
            'rsi_14': rsi,
            'macd': macd,
            'bollinger': bb,
            'ema_alignment': ema_alignment,
            'atr_14': atr,
            'confluence_score': min(100, score)
        }
