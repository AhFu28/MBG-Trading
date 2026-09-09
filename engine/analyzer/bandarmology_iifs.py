import pandas as pd
import numpy as np

class BandarmologyIIFS:
    """
    Institutional Investor Flow Score (IIFS) Analyzer
    Uses statistical proxies (OBV, MFI, VWAP deviation, A/D Line) to estimate
    accumulation/distribution patterns without relying on exact broker summary data.
    """
    
    def __init__(self, lookback: int = 20):
        """
        Initialize the BandarmologyIIFS analyzer.
        
        Args:
            lookback (int): Rolling window period for Z-score normalization.
        """
        self.lookback = lookback

    def _zscore(self, series: pd.Series) -> pd.Series:
        """Helper method to compute rolling Z-score."""
        rolling_mean = series.rolling(window=self.lookback).mean()
        rolling_std = series.rolling(window=self.lookback).std().replace(0, 1e-9)
        return (series - rolling_mean) / rolling_std

    def compute_obv_zscore(self, df: pd.DataFrame) -> pd.Series:
        """Compute On-Balance Volume (OBV) Z-score."""
        close_diff = df['Close'].diff()
        direction = np.where(close_diff > 0, 1, np.where(close_diff < 0, -1, 0))
        obv = (direction * df['Volume']).cumsum()
        return self._zscore(obv)

    def compute_mfi(self, df: pd.DataFrame, period: int = 14) -> pd.Series:
        """Compute Money Flow Index (MFI) (0-100)."""
        typical_price = (df['High'] + df['Low'] + df['Close']) / 3
        raw_money_flow = typical_price * df['Volume']

        tp_diff = typical_price.diff()
        pos_flow = np.where(tp_diff > 0, raw_money_flow, 0)
        neg_flow = np.where(tp_diff < 0, raw_money_flow, 0)

        pos_flow_sum = pd.Series(pos_flow, index=df.index).rolling(window=period).sum()
        neg_flow_sum = pd.Series(neg_flow, index=df.index).rolling(window=period).sum()

        money_ratio = pos_flow_sum / neg_flow_sum.replace(0, 1e-9)
        mfi = 100 - (100 / (1 + money_ratio))
        return mfi

    def compute_vwap_deviation(self, df: pd.DataFrame) -> pd.Series:
        """Compute % deviation from rolling VWAP."""
        typical_price = (df['High'] + df['Low'] + df['Close']) / 3
        tp_v = typical_price * df['Volume']
        
        roll_tp_v = tp_v.rolling(window=self.lookback).sum()
        roll_v = df['Volume'].rolling(window=self.lookback).sum()
        
        rolling_vwap = roll_tp_v / roll_v.replace(0, 1e-9)
        deviation = (df['Close'] - rolling_vwap) / rolling_vwap.replace(0, 1e-9)
        return deviation

    def compute_ad_line(self, df: pd.DataFrame) -> pd.Series:
        """Compute Chaikin Accumulation/Distribution Line."""
        high_low = df['High'] - df['Low']
        # CLV (Close Location Value)
        clv = ((df['Close'] - df['Low']) - (df['High'] - df['Close'])) / high_low.replace(0, 1e-9)
        ad = (clv * df['Volume']).cumsum()
        return ad

    def compute_iifs_score(self, df: pd.DataFrame) -> pd.Series:
        """
        Compute Composite Institutional Investor Flow Score (IIFS) Z-score.
        Weighted average: OBV_z(0.3) + MFI_z(0.25) + VWAP_dev_z(0.25) + AD_z(0.2)
        """
        obv_z = self.compute_obv_zscore(df)
        
        mfi = self.compute_mfi(df)
        mfi_z = self._zscore(mfi)
        
        vwap_dev = self.compute_vwap_deviation(df)
        vwap_dev_z = self._zscore(vwap_dev)
        
        ad = self.compute_ad_line(df)
        ad_z = self._zscore(ad)
        
        iifs = (obv_z * 0.30) + (mfi_z * 0.25) + (vwap_dev_z * 0.25) + (ad_z * 0.20)
        return iifs

    def classify_flow(self, iifs_score: float) -> str:
        """Returns flow classification based on IIFS score."""
        if pd.isna(iifs_score):
            return 'NEUTRAL'
            
        if iifs_score > 2.0:
            return 'HEAVY_ACCUMULATION'
        elif iifs_score > 1.0:
            return 'ACCUMULATION'
        elif iifs_score > 0.5:
            return 'MILD_ACCUMULATION'
        elif iifs_score > -0.5:
            return 'NEUTRAL'
        elif iifs_score > -1.0:
            return 'MILD_DISTRIBUTION'
        elif iifs_score > -2.0:
            return 'DISTRIBUTION'
        else:
            return 'HEAVY_DISTRIBUTION'

    def analyze(self, df: pd.DataFrame, ticker: str) -> dict:
        """
        Main analysis pipeline.
        Returns a dictionary of metrics, trends, and classifications.
        """
        if len(df) < self.lookback:
            return {
                "ticker": ticker,
                "error": "Insufficient history for rolling calculations"
            }
            
        # Ensure all necessary columns exist and handle lowercase if necessary
        df_copy = df.copy()
        for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
            if col not in df_copy.columns:
                if col.lower() in df_copy.columns:
                    df_copy = df_copy.rename(columns={col.lower(): col})
                else:
                    # Fallback to Close if High/Low are missing, or 0 for volume
                    df_copy[col] = df_copy['Close'] if 'Close' in df_copy.columns else 0
                    
        # Replace 0 volume with tiny value to avoid division by zero edge cases
        df_copy['Volume'] = df_copy['Volume'].replace(0, 1e-9)

        # Calculate metrics
        iifs_series = self.compute_iifs_score(df_copy)
        obv_z_series = self.compute_obv_zscore(df_copy)
        mfi_series = self.compute_mfi(df_copy)
        mfi_z_series = self._zscore(mfi_series)
        vwap_dev_series = self.compute_vwap_deviation(df_copy)
        vwap_dev_z_series = self._zscore(vwap_dev_series)
        ad_series = self.compute_ad_line(df_copy)
        ad_z_series = self._zscore(ad_series)
        
        # Get latest values
        iifs_score = iifs_series.iloc[-1]
        iifs_zscore = iifs_score  # IIFS is natively a composite Z-score
        
        obv_z = obv_z_series.iloc[-1]
        mfi_val = mfi_series.iloc[-1]
        mfi_z = mfi_z_series.iloc[-1]
        vwap_dev = vwap_dev_series.iloc[-1]
        vwap_dev_z = vwap_dev_z_series.iloc[-1]
        ad_z = ad_z_series.iloc[-1]
        
        # Determine Trends and Classifications
        flow_class = self.classify_flow(iifs_score)
        obv_trend = 'UP' if obv_z > 0 else 'DOWN'
        ad_trend = 'UP' if ad_z > 0 else 'DOWN'
        is_accum = iifs_score > 0
        
        # Confidence calculation (agreement among indicators)
        indicators_up = sum(1 for val in [obv_z, mfi_z, vwap_dev_z, ad_z] if val > 0)
        if indicators_up == 4 or indicators_up == 0:
            confidence = 'HIGH'
        elif indicators_up == 3 or indicators_up == 1:
            confidence = 'MEDIUM'
        else:
            confidence = 'LOW'
            
        # Estimated Flow Value in IDR
        # Average daily value transacted
        daily_val = df_copy['Close'] * df_copy['Volume']
        avg_daily_val = daily_val.rolling(self.lookback).mean().iloc[-1]
        
        # Proxy flow: Z-score * Avg Daily Value * 15% 
        # (Assuming institutional participation correlates with score)
        est_flow = 0 if pd.isna(iifs_score) else (iifs_score * avg_daily_val * 0.15)
        
        return {
            "ticker": ticker,
            "iifs_score": float(iifs_score) if not pd.isna(iifs_score) else 0.0,
            "iifs_zscore": float(iifs_zscore) if not pd.isna(iifs_zscore) else 0.0,
            "flow_classification": flow_class,
            "obv_trend": obv_trend,
            "mfi_value": float(mfi_val) if not pd.isna(mfi_val) else 50.0,
            "vwap_deviation_pct": float(vwap_dev * 100) if not pd.isna(vwap_dev) else 0.0,
            "ad_trend": ad_trend,
            "is_accumulating": bool(is_accum),
            "confidence": confidence,
            "estimated_flow_idr": int(est_flow) if not pd.isna(est_flow) else 0
        }

if __name__ == '__main__':
    import yfinance as yf
    import warnings
    warnings.filterwarnings("ignore")
    
    print("Fetching BBRI.JK test data...")
    df = yf.download("BBRI.JK", period="6mo", progress=False)
    
    # Handle yfinance multi-index columns in recent versions
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
        
    df.dropna(inplace=True)
    
    analyzer = BandarmologyIIFS(lookback=20)
    res = analyzer.analyze(df, "BBRI.JK")
    
    print("\n--- Bandarmology IIFS Analysis Result ---")
    for k, v in res.items():
        if isinstance(v, float):
            print(f"{k}: {v:.4f}")
        else:
            print(f"{k}: {v}")
