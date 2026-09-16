"""
Pearson Correlation Matrix Calculator
Computes pairwise correlation between asset returns using historical close prices.
"""
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Assets to correlate: IDX blue-chips + crypto + macro
DEFAULT_ASSETS = [
    "BBCA.JK", "BBRI.JK", "TLKM.JK", "ASII.JK", "BRPT.JK",
    "BTCUSDT", "ETHUSDT",
    "GC=F", "BZ=F", "DX-Y.NYB"
]

ASSET_LABELS = {
    "BBCA.JK": "BBCA", "BBRI.JK": "BBRI", "TLKM.JK": "TLKM",
    "ASII.JK": "ASII", "BRPT.JK": "BRPT",
    "BTCUSDT": "BTC", "ETHUSDT": "ETH",
    "GC=F": "Gold", "BZ=F": "Oil", "DX-Y.NYB": "DXY"
}

def compute_correlation_matrix(history_dfs: dict, assets: list = None) -> dict:
    """
    Compute Pearson correlation matrix from daily close returns.
    
    Args:
        history_dfs: dict of {ticker: pd.DataFrame with 'Close' column}
        assets: list of tickers to include (default: DEFAULT_ASSETS)
    
    Returns:
        dict with 'assets' (labels) and 'matrix' (2D correlation values)
    """
    if assets is None:
        assets = DEFAULT_ASSETS
    
    available = [a for a in assets if a in history_dfs and len(history_dfs[a]) >= 10]
    
    if len(available) < 3:
        logger.warning(f"Not enough assets for correlation: {len(available)}/3 minimum")
        return None
    
    # Extract daily returns
    returns = {}
    min_len = min(len(history_dfs[a]) for a in available)
    
    for asset in available:
        df = history_dfs[asset]
        close = df['Close'].values[-min_len:]  # Align lengths
        daily_ret = np.diff(close) / close[:-1]  # Daily % returns
        returns[asset] = daily_ret
    
    # Build matrix
    labels = [ASSET_LABELS.get(a, a) for a in available]
    n = len(available)
    matrix = np.zeros((n, n))
    
    for i in range(n):
        for j in range(n):
            if i == j:
                matrix[i][j] = 1.0
            else:
                corr = np.corrcoef(returns[available[i]], returns[available[j]])[0, 1]
                matrix[i][j] = round(float(corr), 3) if not np.isnan(corr) else 0.0
    
    return {
        "assets": labels,
        "matrix": matrix.tolist(),
        "data_source": "live",
        "sample_size": min_len - 1
    }
