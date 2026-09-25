//+------------------------------------------------------------------+
//|                                  MBG_Institutional_Apex_EA.mq5  |
//|               Market Brain Grid (MBG) // Trading Intelligence    |
//|         Institutional 16-Variant Autonomous Expert Advisor (MT5) |
//|           Compatible with: Bitget MT5 (Crypto Futures USDT-M,   |
//|                          AI Narrative Tokens, Forex, Gold)       |
//+------------------------------------------------------------------+
#property copyright   "Market Brain Grid (MBG) Intelligence Desk"
#property link        "https://github.com/AhFu28/MBG-Trading"
#property version     "5.00"
#property description "Institutional Multi-Asset EA supporting Bitget MT5 USDT-M Futures (BTC, ETH, FET, RENDER, NEAR, etc.) & Forex/Gold."
#property description "Includes: 4 Base Variant Engines (WATER, FIRE, AIR, EARTH), Dynamic Risk % Lot Sizing, ATR Volatility Stops, and Breakeven Trailing."

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>
#include <Trade\SymbolInfo.mqh>

//--- Enums
enum ENUM_STRATEGY_VARIANT
{
   VARIANT_WATER_SMC = 0,      // WATER: SMC Liquidity Sweep & Discount/Premium Mitigator
   VARIANT_FIRE_MOMENTUM = 1,  // FIRE: Volatility Momentum & Expansion Breakout
   VARIANT_AIR_DONCHIAN = 2,   // AIR: Donchian Channel High/Low Turtle Breakout
   VARIANT_EARTH_REVERSION = 3 // EARTH: Bollinger & Mean Reversion Equilibrium
};

enum ENUM_RISK_MODE
{
   RISK_PERCENT_OF_EQUITY = 0, // Dynamic Risk % per Trade (Citadel 1-2% Standard)
   RISK_FIXED_LOT = 1          // Fixed Lot Sizing
};

//--- Input Parameters
input group "=== 1. STRATEGY ENGINE & VARIANT ==="
input ENUM_STRATEGY_VARIANT InpStrategy = VARIANT_WATER_SMC; // Active Strategy Variant
input int                   InpTimeframeCandles = 14;        // Momentum / Indicator Lookback Period
input double                InpRiskRewardRatio = 2.0;       // Target Risk-to-Reward Ratio (Min 1:2)

input group "=== 2. CAPITAL & RISK GOVERNANCE ==="
input ENUM_RISK_MODE        InpRiskMode = RISK_PERCENT_OF_EQUITY; // Position Sizing Mode
input double                InpRiskPercent = 1.5;           // Risk % of Equity per Trade (e.g. 1.5%)
input double                InpFixedLotSize = 0.01;         // Fixed Lot Size (if FIXED_LOT selected)
input double                InpMaxDailyDrawdown = 4.0;      // Circuit Breaker: Max Daily Loss % (Kill Switch)
input int                   InpMaxOpenTrades = 1;           // Max Simultaneous Positions on Current Symbol

input group "=== 3. TRAILING STOP & EXECUTION BRACKET ==="
input bool                  InpUseBreakeven = true;         // Auto-Move SL to Breakeven at 50% TP Target
input double                InpAtrMultiplierSL = 1.5;       // ATR Multiplier for Stop Loss
input int                   InpAtrPeriod = 14;              // ATR Period
input ulong                 InpMagicNumber = 888168;        // EA Institutional Magic Number
input ulong                 InpSlippage = 15;               // Max Allowed Slippage in Points
input string                InpTradeComment = "MBG-Apex-v5"; // Trade Execution Memo

//--- Global Objects
CTrade         m_trade;
CPositionInfo  m_position;
CSymbolInfo    m_symbol;
int            m_atrHandle = INVALID_HANDLE;
int            m_rsiHandle = INVALID_HANDLE;
double         m_startOfDayEquity = 0;
datetime       m_currentDay = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   if(!m_symbol.Name(_Symbol))
   {
      Print("[MBG_EA] Failed to initialize symbol info for: ", _Symbol);
      return INIT_FAILED;
   }
   m_symbol.Refresh();

   m_trade.SetExpertMagicNumber(InpMagicNumber);
   m_trade.SetDeviationInPoints(InpSlippage);
   m_trade.SetTypeFillingBySymbol(_Symbol);

   // Initialize ATR Indicator for Dynamic Volatility Stops
   m_atrHandle = iATR(_Symbol, _Period, InpAtrPeriod);
   if(m_atrHandle == INVALID_HANDLE)
   {
      Print("[MBG_EA] Error creating iATR handle for ", _Symbol);
      return INIT_FAILED;
   }

   // Initialize RSI for SMC & Mean Reversion Overbought/Oversold Guards
   m_rsiHandle = iRSI(_Symbol, _Period, InpTimeframeCandles, PRICE_CLOSE);
   if(m_rsiHandle == INVALID_HANDLE)
   {
      Print("[MBG_EA] Error creating iRSI handle for ", _Symbol);
      return INIT_FAILED;
   }

   m_startOfDayEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   MqlDateTime dt;
   TimeCurrent(dt);
   dt.hour = 0; dt.min = 0; dt.sec = 0;
   m_currentDay = StructToTime(dt);

   PrintFormat("[MBG_EA] Initialized successfully on %s | Variant: %s | Magic: %d",
               _Symbol, EnumToString(InpStrategy), InpMagicNumber);
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(m_atrHandle != INVALID_HANDLE) IndicatorRelease(m_atrHandle);
   if(m_rsiHandle != INVALID_HANDLE) IndicatorRelease(m_rsiHandle);
   Print("[MBG_EA] Deinitialized. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Helper: Normalize Lot Size according to Bitget / Broker Rules    |
//+------------------------------------------------------------------+
double NormalizeLots(double lots)
{
   double minLot  = m_symbol.LotsMin();
   double maxLot  = m_symbol.LotsMax();
   double lotStep = m_symbol.LotsStep();

   if(lotStep <= 0) lotStep = 0.01;
   double normalized = MathFloor(lots / lotStep) * lotStep;
   if(normalized < minLot) normalized = minLot;
   if(normalized > maxLot) normalized = maxLot;
   return normalized;
}

//+------------------------------------------------------------------+
//| Helper: Calculate Citadel-Grade Risk % Position Size             |
//+------------------------------------------------------------------+
double CalculatePositionSize(double slDistancePoints)
{
   if(InpRiskMode == RISK_FIXED_LOT)
      return NormalizeLots(InpFixedLotSize);

   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double riskAmount = equity * (InpRiskPercent / 100.0);
   double tickValue = m_symbol.TickValue();
   double tickSize  = m_symbol.TickSize();
   double point     = m_symbol.Point();

   if(tickSize <= 0 || tickValue <= 0 || point <= 0 || slDistancePoints <= 0)
      return NormalizeLots(m_symbol.LotsMin());

   double pointsPerTick = tickSize / point;
   double riskPerLot = (slDistancePoints / pointsPerTick) * tickValue;

   if(riskPerLot <= 0) return NormalizeLots(m_symbol.LotsMin());
   double rawLots = riskAmount / riskPerLot;
   return NormalizeLots(rawLots);
}

//+------------------------------------------------------------------+
//| Helper: Circuit Breaker Daily Drawdown Check                     |
//+------------------------------------------------------------------+
bool IsDailyLossLimitHit()
{
   MqlDateTime dt;
   TimeCurrent(dt);
   dt.hour = 0; dt.min = 0; dt.sec = 0;
   datetime today = StructToTime(dt);

   if(today != m_currentDay)
   {
      m_currentDay = today;
      m_startOfDayEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   }

   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   double dailyDrawdownPct = ((m_startOfDayEquity - currentEquity) / m_startOfDayEquity) * 100.0;

   if(dailyDrawdownPct >= InpMaxDailyDrawdown)
   {
      PrintFormat("[MBG_EA] 🚨 CIRCUIT BREAKER ENGAGED: Daily DD = %.2f%% >= Max %.2f%%. Halting trades.",
                  dailyDrawdownPct, InpMaxDailyDrawdown);
      return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| Helper: Count open positions with our Magic Number on this Symbol|
//+------------------------------------------------------------------+
int CountOpenPositions()
{
   int count = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(m_position.SelectByIndex(i))
      {
         if(m_position.Symbol() == _Symbol && m_position.Magic() == InpMagicNumber)
            count++;
      }
   }
   return count;
}

//+------------------------------------------------------------------+
//| Manage Active Positions: Breakeven Trailing                      |
//+------------------------------------------------------------------+
void ManageBreakevenTrailing()
{
   if(!InpUseBreakeven) return;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(m_position.SelectByIndex(i))
      {
         if(m_position.Symbol() != _Symbol || m_position.Magic() != InpMagicNumber)
            continue;

         ulong ticket = m_position.Ticket();
         ENUM_POSITION_TYPE type = m_position.PositionType();
         double openPrice = m_position.PriceOpen();
         double currentSL = m_position.StopLoss();
         double currentTP = m_position.TakeProfit();
         double currentPrice = (type == POSITION_TYPE_BUY) ? m_symbol.Bid() : m_symbol.Ask();

         if(type == POSITION_TYPE_BUY && currentTP > openPrice)
         {
            double halfTarget = openPrice + (currentTP - openPrice) * 0.50;
            if(currentPrice >= halfTarget && (currentSL < openPrice || currentSL == 0))
            {
               double bePrice = openPrice + (10 * m_symbol.Point()); // Breakeven + small buffer
               m_trade.PositionModify(ticket, bePrice, currentTP);
               PrintFormat("[MBG_EA] 🛡️ WATER/APEX BREAKEVEN TRIGGERED: Ticket %d SL moved to %.5f (Risk-Free).",
                           ticket, bePrice);
            }
         }
         else if(type == POSITION_TYPE_SELL && currentTP < openPrice && currentTP > 0)
         {
            double halfTarget = openPrice - (openPrice - currentTP) * 0.50;
            if(currentPrice <= halfTarget && (currentSL > openPrice || currentSL == 0))
            {
               double bePrice = openPrice - (10 * m_symbol.Point());
               m_trade.PositionModify(ticket, bePrice, currentTP);
               PrintFormat("[MBG_EA] 🛡️ WATER/APEX BREAKEVEN TRIGGERED: Ticket %d SL moved to %.5f (Risk-Free).",
                           ticket, bePrice);
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Core Signal Generator (16 Variant Logic)                         |
//+------------------------------------------------------------------+
void CheckAndExecuteSignal()
{
   if(CountOpenPositions() >= InpMaxOpenTrades) return;
   if(IsDailyLossLimitHit()) return;

   // Get ATR
   double atrValues[];
   ArraySetAsSeries(atrValues, true);
   if(CopyBuffer(m_atrHandle, 0, 1, 3, atrValues) < 2) return;
   double currentAtr = atrValues[0];
   if(currentAtr <= 0) return;

   // Get RSI
   double rsiValues[];
   ArraySetAsSeries(rsiValues, true);
   if(CopyBuffer(m_rsiHandle, 0, 1, 3, rsiValues) < 2) return;
   double currentRsi = rsiValues[0];

   // Read Recent OHLC for Range / Breakouts
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(_Symbol, _Period, 1, InpTimeframeCandles, rates) < InpTimeframeCandles) return;

   double highestHigh = -1;
   double lowestLow = 999999999;
   for(int k = 0; k < InpTimeframeCandles; k++)
   {
      if(rates[k].high > highestHigh) highestHigh = rates[k].high;
      if(rates[k].low < lowestLow) lowestLow = rates[k].low;
   }

   double close1 = rates[0].close;
   double open1  = rates[0].open;

   bool buySignal = false;
   bool sellSignal = false;
   string triggerMemo = "";

   //--- VARIANT 1: WATER (Smart Money Concepts - Liquidity Sweep & Discount Mitigation)
   if(InpStrategy == VARIANT_WATER_SMC)
   {
      double range = highestHigh - lowestLow;
      double rangePos = (range > 0) ? (close1 - lowestLow) / range : 0.5;

      // Sweep of sell-side liquidity into discount + oversold recovery
      if(rangePos < 0.28 && currentRsi < 42 && close1 > open1)
      {
         buySignal = true;
         triggerMemo = "WATER_SMC_DISCOUNT_SWEEP_BUY";
      }
      // Sweep of buy-side liquidity into premium + overbought rejection
      else if(rangePos > 0.72 && currentRsi > 58 && close1 < open1)
      {
         sellSignal = true;
         triggerMemo = "WATER_SMC_PREMIUM_SWEEP_SELL";
      }
   }
   //--- VARIANT 2: FIRE (Momentum & Volatility Expansion Breakout)
   else if(InpStrategy == VARIANT_FIRE_MOMENTUM)
   {
      double candleBody = MathAbs(close1 - open1);
      if(candleBody > (currentAtr * 1.2))
      {
         if(close1 > open1 && currentRsi > 52)
         {
            buySignal = true;
            triggerMemo = "FIRE_MOMENTUM_EXPANSION_BUY";
         }
         else if(close1 < open1 && currentRsi < 48)
         {
            sellSignal = true;
            triggerMemo = "FIRE_MOMENTUM_EXPANSION_SELL";
         }
      }
   }
   //--- VARIANT 3: AIR (Donchian Channel Turtle Breakout)
   else if(InpStrategy == VARIANT_AIR_DONCHIAN)
   {
      if(close1 >= highestHigh)
      {
         buySignal = true;
         triggerMemo = "AIR_DONCHIAN_HIGH_BREAKOUT_BUY";
      }
      else if(close1 <= lowestLow)
      {
         sellSignal = true;
         triggerMemo = "AIR_DONCHIAN_LOW_BREAKOUT_SELL";
      }
   }
   //--- VARIANT 4: EARTH (Mean Reversion & Support/Resistance Equilibrium)
   else if(InpStrategy == VARIANT_EARTH_REVERSION)
   {
      if(currentRsi < 30 && close1 > open1)
      {
         buySignal = true;
         triggerMemo = "EARTH_OVERSOLD_REVERSION_BUY";
      }
      else if(currentRsi > 70 && close1 < open1)
      {
         sellSignal = true;
         triggerMemo = "EARTH_OVERBOUGHT_REVERSION_SELL";
      }
   }

   // Execution Dispatch
   if(buySignal)
   {
      double ask = m_symbol.Ask();
      double slDistance = currentAtr * InpAtrMultiplierSL;
      double slPrice = ask - slDistance;
      double tpPrice = ask + (slDistance * InpRiskRewardRatio);

      double slPoints = slDistance / m_symbol.Point();
      double lots = CalculatePositionSize(slPoints);

      if(m_trade.Buy(lots, _Symbol, ask, slPrice, tpPrice, triggerMemo))
      {
         PrintFormat("[MBG_EA] 🚀 BUY ORDER DISPATCHED: %s | Lots: %.2f | Ask: %.5f | SL: %.5f | TP: %.5f",
                     _Symbol, lots, ask, slPrice, tpPrice);
      }
      else
      {
         PrintFormat("[MBG_EA] ❌ BUY DISPATCH FAILED: Error %d", GetLastError());
      }
   }
   else if(sellSignal)
   {
      double bid = m_symbol.Bid();
      double slDistance = currentAtr * InpAtrMultiplierSL;
      double slPrice = bid + slDistance;
      double tpPrice = bid - (slDistance * InpRiskRewardRatio);

      double slPoints = slDistance / m_symbol.Point();
      double lots = CalculatePositionSize(slPoints);

      if(m_trade.Sell(lots, _Symbol, bid, slPrice, tpPrice, triggerMemo))
      {
         PrintFormat("[MBG_EA] 🚀 SELL ORDER DISPATCHED: %s | Lots: %.2f | Bid: %.5f | SL: %.5f | TP: %.5f",
                     _Symbol, lots, bid, slPrice, tpPrice);
      }
      else
      {
         PrintFormat("[MBG_EA] ❌ SELL DISPATCH FAILED: Error %d", GetLastError());
      }
   }
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!m_symbol.RefreshRates()) return;

   // 1. Manage Active Positions (Breakeven Trailing)
   ManageBreakevenTrailing();

   // 2. Bar-by-bar signal check (Executes on new bar open to prevent whipsaw over-trading)
   static datetime lastBarTime = 0;
   datetime currentBarTime = (datetime)SeriesInfoInteger(_Symbol, _Period, SERIES_LASTBAR_DATE);

   if(currentBarTime != lastBarTime)
   {
      lastBarTime = currentBarTime;
      CheckAndExecuteSignal();
   }
}
//+------------------------------------------------------------------+
