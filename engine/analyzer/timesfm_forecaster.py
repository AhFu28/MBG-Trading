import logging
import numpy as np
import pandas as pd
import math

# Configure basic logging
logger = logging.getLogger(__name__)

try:
    import timesfm
    TIMESFM_AVAILABLE = True
except ImportError:
    TIMESFM_AVAILABLE = False
    logger.warning("timesfm module not found. Will use statistical heuristic fallback.")

class TimesFMForecaster:
    def __init__(self, horizon=5, use_gpu=False):
        self.horizon = horizon
        self.use_gpu = use_gpu
        self.use_timesfm = TIMESFM_AVAILABLE
        self.model = None
        
        if self.use_timesfm:
            try:
                # Initialize TimesFM model
                self.model = timesfm.TimesFm(
                    context_len=128,
                    horizon_len=self.horizon,
                    input_patch_len=32,
                    output_patch_len=128,
                    num_layers=20,
                    model_dims=1280,
                    backend="gpu" if self.use_gpu else "cpu",
                )
                self.model.load_from_checkpoint(repo_id="google/timesfm-1.0-200m")
                logger.info("TimesFM model initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize TimesFM model: {e}. Falling back to heuristic.")
                self.use_timesfm = False
        else:
            logger.info("Initializing statistical heuristic forecaster.")

    def _forecast_timesfm(self, prices: np.array, horizon: int) -> dict:
        """
        Zero-shot forecast using Google TimesFM.
        Returns point forecasts and quantile predictions.
        """
        # Ensure prices are 1D array of floats
        prices = np.asarray(prices, dtype=np.float32)
        
        inputs = [prices]
        
        try:
            forecast_result = self.model.forecast(inputs, freq=[0]*len(inputs))
            point_forecasts = forecast_result[0][0][:horizon]
            
            if len(forecast_result) > 1 and forecast_result[1] is not None:
                q_forecasts = forecast_result[1][0][:horizon, :]
                lower_band = q_forecasts[:, 1] if q_forecasts.shape[1] > 1 else point_forecasts * 0.95
                upper_band = q_forecasts[:, -2] if q_forecasts.shape[1] > 8 else point_forecasts * 1.05
            else:
                std_dev = np.std(prices[-20:])
                lower_band = point_forecasts - 1.28 * std_dev
                upper_band = point_forecasts + 1.28 * std_dev
                
            return {
                'point': point_forecasts.tolist(),
                'lower': lower_band.tolist(),
                'upper': upper_band.tolist()
            }
        except Exception as e:
            logger.error(f"TimesFM forecast failed: {e}. Falling back to heuristic.")
            return self._forecast_heuristic(prices, horizon)

    def _forecast_heuristic(self, prices: np.array, horizon=5) -> dict:
        """
        Statistical fallback ensemble.
        a. Linear regression trend on last 20 bars
        b. Exponential Moving Average momentum
        c. Historical volatility
        d. Mean reversion to MA50
        """
        n = len(prices)
        if n < 20:
            return {
                'point': [prices[-1]] * horizon,
                'lower': [prices[-1]] * horizon,
                'upper': [prices[-1]] * horizon,
                'prob_up': 0.5,
                'trend_strength': 0.0
            }
        
        current_price = prices[-1]
        
        log_returns = np.diff(np.log(prices[prices > 0])) if np.all(prices > 0) else np.diff(prices) / prices[:-1]
        volatility = np.std(log_returns) if len(log_returns) > 0 else 0.01
        if np.isnan(volatility) or volatility == 0:
            volatility = 0.01
            
        daily_volatility_abs = volatility * current_price
        
        lookback = min(20, n)
        y = prices[-lookback:]
        x = np.arange(lookback)
        slope, intercept = np.polyfit(x, y, 1)
        
        alpha = 2 / (10 + 1)
        ema10 = pd.Series(prices).ewm(alpha=alpha, adjust=False).mean().iloc[-1]
        momentum_signal = (current_price - ema10) / current_price
        
        ma50_lookback = min(50, n)
        ma50 = np.mean(prices[-ma50_lookback:])
        mean_reversion_signal = (ma50 - current_price) / current_price
        
        forecasts = []
        lowers = []
        uppers = []
        
        for i in range(1, horizon + 1):
            lr_proj = current_price + slope * i
            mom_proj = current_price * (1 + momentum_signal * (1 - i/(horizon+1)))
            mr_proj = current_price + (ma50 - current_price) * (i / 50.0) 
            
            f_price = 0.5 * lr_proj + 0.3 * mom_proj + 0.2 * mr_proj
            forecasts.append(max(0, f_price))
            
            band_width = 1.28 * daily_volatility_abs * math.sqrt(i)
            lowers.append(max(0, f_price - band_width))
            uppers.append(f_price + band_width)
            
        prob_up = 0.5 + (np.sign(slope) * 0.2) + (np.sign(momentum_signal) * 0.1) + (np.sign(mean_reversion_signal) * 0.05)
        prob_up = max(0.0, min(1.0, prob_up))
        
        trend_strength = (slope / current_price) * 100 
        trend_strength = max(-1.0, min(1.0, trend_strength))
            
        return {
            'point': forecasts,
            'lower': lowers,
            'upper': uppers,
            'prob_up': prob_up,
            'trend_strength': trend_strength
        }

    def forecast(self, df: pd.DataFrame, ticker: str, horizon=None) -> dict:
        """
        Main forecast method routing to TimesFM or heuristic.
        """
        if horizon is None:
            horizon = self.horizon
            
        if df.empty or 'close' not in df.columns.str.lower():
            logger.warning(f"Invalid DataFrame for {ticker}")
            return None
            
        close_col = 'close' if 'close' in df.columns else 'Close'
        if close_col not in df.columns:
            return None
            
        prices = df[close_col].values
        
        if len(prices) == 0:
            return None
            
        current_price = float(prices[-1])
        
        if self.use_timesfm:
            raw_result = self._forecast_timesfm(prices, horizon)
            if 'prob_up' not in raw_result:
                method_used = 'TIMESFM_2.5'
                f_prices = raw_result['point']
                price_change = f_prices[-1] - current_price
                prob_up = 0.6 if price_change > 0 else 0.4
                trend_strength = (price_change / current_price) / horizon
                trend_strength = max(-1.0, min(1.0, trend_strength))
            else:
                method_used = 'STATISTICAL_ENSEMBLE'
                prob_up = raw_result['prob_up']
                trend_strength = raw_result['trend_strength']
        else:
            raw_result = self._forecast_heuristic(prices, horizon)
            method_used = 'STATISTICAL_ENSEMBLE'
            prob_up = raw_result['prob_up']
            trend_strength = raw_result['trend_strength']
            
        f_prices = raw_result['point']
        
        if prob_up > 0.55:
            direction = 'BULLISH'
        elif prob_up < 0.45:
            direction = 'BEARISH'
        else:
            direction = 'NEUTRAL'
            
        if abs(trend_strength) > 0.5:
            confidence = 'HIGH'
        elif abs(trend_strength) > 0.2:
            confidence = 'MEDIUM'
        else:
            confidence = 'LOW'
            
        return {
            'ticker': ticker,
            'method': method_used,
            'horizon_days': horizon,
            'current_price': current_price,
            'forecast_prices': f_prices,
            'forecast_direction': direction,
            'probability_up': float(prob_up),
            'confidence_band_80': {
                'upper': raw_result['upper'],
                'lower': raw_result['lower']
            },
            'price_target_5d': float(f_prices[-1]),
            'confidence': confidence,
            'trend_strength': float(trend_strength)
        }

    def batch_forecast(self, tickers_data: dict) -> list:
        """
        Process multiple tickers efficiently.
        """
        results = []
        for ticker, df in tickers_data.items():
            try:
                res = self.forecast(df, ticker)
                if res:
                    results.append(res)
            except Exception as e:
                logger.error(f"Error forecasting for {ticker}: {e}")
        return results

if __name__ == '__main__':
    # Test block
    print("Testing TimesFMForecaster...")
    
    np.random.seed(42)
    returns = np.random.normal(0.001, 0.02, 100)
    prices = 100 * np.exp(np.cumsum(returns))
    
    df = pd.DataFrame({'close': prices})
    
    forecaster = TimesFMForecaster(horizon=5)
    
    result = forecaster.forecast(df, ticker="TEST")
    
    import pprint
    pprint.pprint(result)
