from analyzer.technical_indicators import TechnicalIndicators

class USAnalyzer:
    @staticmethod
    def analyze(df, ticker):
        base = TechnicalIndicators.analyze(df)
        base['ticker'] = ticker
        base['market'] = 'US_EQUITY'
        return base
