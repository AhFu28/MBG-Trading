from analyzer.technical_indicators import TechnicalIndicators

class ForexAnalyzer:
    @staticmethod
    def analyze(df, pair):
        base = TechnicalIndicators.analyze(df)
        base['pair'] = pair
        base['market'] = 'FOREX'
        return base
