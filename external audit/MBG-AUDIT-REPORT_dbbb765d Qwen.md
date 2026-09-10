# MBG — Market Brain Grid (`mbg-trading.pages.dev`)
### Full review, audit and improvement plan
**Audited:** 10 Sep 2026 · **Build observed:** v2.4.0, bundle `index-SMveqI-Q.js` (416 KB raw / 121 KB gzip), data file `data/latest_cockpit_bundle.json` (272 KB raw / 41 KB gzip) · **Method:** hands-on browser testing (desktop 1440px + mobile 390px), source-bundle reverse engineering, live API cross-checks against Binance/Indodax, and static analysis of every data field shipped to the client.

> Evidence files (15 screenshots + raw JSON/JS/CSS captures) are in the `mbg-audit/` folder next to this report.

---

## 1. Verdict

This is an unusually well-crafted front-end wrapped around data that is, in large part, not real.

The **engineering craft is genuinely high**: a coherent design system, 12 working modules, real TradingView integration, a real Google News ingest, a real Indodax depth API, correct position-sizing maths, `ErrorBoundary`, `rel="noopener noreferrer"` on every outbound link, 212 ms first paint, and 45 s of animation-free, dependency-light rendering. Most people shipping a terminal this dense would have broken it in ten places. You haven't.

But as an audit subject it fails the one test that matters for a trading product: **a user cannot tell real numbers from invented ones, and the interface repeatedly tells them the invented ones are live.**

I found **11 separate mechanisms that fabricate market data or performance**, all of them rendered under labels like `REAL-TIME`, `OFFICIAL BEI BEST QUOTE`, `VERIFIED FACTS`, `100% DATA RIIL`, `Bappebti Live`, `TimesFM AI`. Four of them are the worst class of failure — *confident, plausible, and unverifiable by the user*: a synthetic Level-2 order book, a hard-coded broker summary naming ten real Indonesian securities firms, an economic calendar with invented "ACTUAL" prints, and crypto trade plans more than 100 % away from the real market price.

The honest read: **this is an excellent UI/UX prototype of a quant terminal, currently presenting itself as a quant data vendor.** The visual layer and the interaction layer are close to shippable. The data layer needs to be rebuilt or radically re-labelled before real users act on it.

**Overall: 34 / 100.** Not because it's badly made — because it's badly *truthful*. Fix the truthfulness and the same codebase is an 72–78.

---

## 2. Scorecard — by expert perspective

| # | Perspective | Score | Grade | One-line reason |
|---|---|---|---|---|
| 1 | **Data integrity / quant auditor** | **14** | F | 11 fabrication mechanisms; 9/12 trade plans contradict their own numbers; backtests statistically impossible |
| 2 | **Compliance & legal (ID capital markets)** | **18** | F | Specific entry/SL/TP on named securities + 1 tiny disclaimer + regulator/brand name-dropping + no ToS or identity |
| 3 | **Security engineer** | **24** | F | Client-side "auth" bypassed in 5 s; false "attempts are logged"; lockout defeated by F5; no CSP/HSTS |
| 4 | **Mobile UX** | **18** | F | Navigation is unreachable below 768 px — one CSS rule, later in the file, wins the cascade |
| 5 | **Accessibility (WCAG 2.2 AA)** | **31** | D | 0 headings, 0 real links, `<div>` tabs, no focus-visible, auto-rotating carousel with no pause, `lang="en"` on Indonesian |
| 6 | **SEO / AI-answer discoverability** | **12** | F | Password-gated CSR SPA: no meta, no OG, no canonical, no sitemap, no `robots.txt`, no JSON-LD, no routes (low priority for a gated tool — see §8) |
| 7 | **Marketing / copy / conversion** | **46** | D | Voice is distinctive and confident — but it over-claims, and the over-claim is its own biggest conversion risk |
| 8 | **UI / visual design (desktop)** | **76** | B | Dense, coherent, credible "terminal" feel; loses points on 10 px text, emoji-as-iconography, and ID/EN drift |
| 9 | **Front-end performance** | **79** | B | FCP 212 ms, 121 KB gzip JS; loses points on 41 KB poll/min and 4.6 MB of PNG infographics |
| 10 | **Software architecture / craft** | **68** | C | Clean React, good hygiene; loses points on no routing, dead `/api/tokocrypto` branch, `??`-fallback label strings |
| 11 | **Functionality (what a desktop user can click today)** | **55** | D | Watchlist, paper trades, academy, lot calc, search, theme, sync all work; order book, timezone, and watchlist resolver fail |

**Weighted overall (data 25 %, compliance 15 %, security 12 %, mobile 10 %, a11y 8 %, SEO 5 %, copy 8 %, UI 8 %, perf 4 %, architecture 4 %, function 11 %) → 34 / 100.**

---

## 3. Data authenticity — the hallucination check

This is the section you specifically asked for. I separated three different failure modes, because they need three different fixes.

### 3.1 What is genuinely REAL (verified)

| Item | How I verified | Result |
|---|---|---|
| Live crypto order book (Indodax) | `GET indodax.com/api/depth/btcidr` → top bid `1,365,700,000`; `btcusdt` → `78,225.20`; Binance BTCUSDT = `77,940` | ✅ **Real, live, and accurate to ~0.4 %** |
| 25 news headlines | Titles, publishers (CNBC Indonesia, ANTARA, Bloomberg Technoz, IDNFinancials, TopBusiness, InvestorTrust, pasardana.id), `pub_date` RFC-822 GMT, and 25 `news.google.com/rss/articles/...` links — all resolve HTTP 200 | ✅ **Real RSS ingest with real citations.** This is your best data asset |
| TradingView chart | `embed-widget-advanced-chart.js`, symbol mapping `IDX:XXXX` / `BINANCE:XXXXUSDT`, live OHLC in the widget | ✅ Real |
| Google Fonts, favicon, ErrorBoundary, `rel="noopener noreferrer"` | response headers / DOM | ✅ Present |
| Lot calculator maths | 10 M × 2 % = 200 k ÷ (5725−5496 = 229) = 873 lembar → **8 lot**, position value 4,580,000 = 45.8 %, TP at 1:2.2 = 6,228.8 | ✅ **All five numbers correct.** This module is genuinely good |
| Academy content (66-term dictionary, 5 levels, 10 infographics) | 10 PNGs at 3267×3746 px, all HTTP 200, `naturalWidth > 0` | ✅ Real, hand-authored substance |

### 3.2 What is FABRICATED (11 mechanisms, with proof)

**F1 — The entire "Pasar Global" module is typed into the JS bundle under a banner that says `SINKRONISASI BURSA GLOBAL REAL-TIME (STATUS BERUBAH OTOMATIS PER DETIK)`.**
11 instruments are string literals in `bundle.js`; there is no fetch, ever. They are frozen mid-2025 values:

```
AAPL $178.25 +1.45 | NVDA $118.80 +3.12 | MSFT $424.50 +0.85 | TSLA $210.40 -1.82
BBCA Rp 9.250 .54 | BBRI Rp 4.920 -1.2 | BMRI Rp 6.450 .78 | ASII Rp 5.150 1.18
^TNX 4.81% | ^TYX 4.95% | TLT $89.40
```
Every filter tab (ALL 20 rows, WALL STREET / ASIA PACIFIC / INDONESIA / BONDS & YIELD / FOREX & CURRENCIES 4 rows each) renders fake numbers in a real-looking table. **Fix or kill this module.**

**F2 — `crypto_spot_10` prices are hard-coded round placeholders, and the app publishes LONG/TP/SL off them.** Cross-checked against Binance spot at the same minute:

| Pair | MBG "current_price" | Binance live | MBG error |
|---|---|---|---|
| BTC/USDT | 68,500 | 77,940 | **−12.1 %** |
| ETH/USDT | 2,650.0 | 2,467.45 | +7.4 % |
| SOL/USDT | 178.5 | 101.12 | **+76.5 %** |
| BNB/USDT | 590.0 | 717.36 | −17.7 % |
| LINK/USDT | 12.8 | 11.809 | +8.4 % |
| NEAR/USDT | 5.2 | 2.407 | **+116 %** |
| AVAX/USDT | 28.4 | 7.727 | **+267 %** |
| RENDER/USDT | 6.4 | 1.42 | **+350 %** |
| SUI/USDT | 2.15 | 0.7606 | **+182 %** |
| FET/USDT | 1.45 | 0.1657 | **+775 %** |

The Home page hero card is `#1 CRYPTO SPOT MOMENTUM — SUI/USDT Entry $2.15 SL $2.0855 TP $2.279`. **The real price of SUI is $0.76.** A user reading that card is being shown a 2.8× wrong entry, and a 3.5× wrong stop, in large white type, under `⚡ SPOT TRADING USDT MURNI`. This is the single most dangerous string in the product.

**F3 — All 10 crypto "setups" are one arithmetic template, not 10 analyses.** Every row is `setup_type: PULLBACK_SUPPORT_RETEST`, every `risk_reward_ratio: 2.0`, and every level is a fixed percentage of `current_price`:

```
entry_low  = price × 0.99     (−1.0 %)
entry_high = price × 1.005    (+0.5 %)
take_profit_1 = price × 1.06  (+6.0 %)
take_profit_2 = price × 1.12  (+12.0 %)
stop_loss  = price × 0.97     (−3.0 %)
```
and `change_24h_pct` is a hand-entered monotonic descending ladder (6.5, 5.0, 4.8, 4.1, 3.7, 3.2, 2.4, 2.1, 1.8, 0.8) — so `rank 1…10` is "sorted by the fake gain", not by any signal. Each row also carries a unique-sounding `catalyst_thesis` ("Strong ecosystem TVL expansion; holding breakout retest above recent pivot") — 10 pre-written sentences that have nothing to do with the price levels, and an `invalidation_rule` that claims "4H candle close below $2.0855 voids trade **structure**" when $2.0855 is `price × 0.97`.

**F4 — 9 of 12 IDX trade plans assert a thesis their own numbers contradict.** `opinion_thesis` is a single template string with `{group}` interpolated:
`"Konsolidasi di atas MA20 didukung sentimen klaster {GROUP} dan akumulasi terukur."`
It is emitted whether or not price is above MA20:

| Ticker | Entry | MA20 | Above MA20? | Copy claims |
|---|---|---|---|---|
| ICBP | 7,200 | 7,533.8 | **no** | "di atas MA20" ❌ |
| GOTO | 50 | 50 | no | ❌ |
| BREN | 3,370 | 3,422 | **no** | ❌ |
| TPIA | 1,980 | 1,986.8 | **no** | ❌ |
| BRPT | 1,775 | 1,820.5 | **no** | ❌ |
| BBCA | 6,450 | 6,469 | **no** | ❌ |
| VKTR | 820 | 889.5 | **no** | ❌ |
| BRIS | 1,765 | 1,784 | **no** | ❌ |
| INDF / PTRO / ANTM / CUAN | — | — | yes | ✅ coincidentally correct |

Same for the other "AI explanation" fields: across all 12 plans there is exactly **1 distinct** `ai_thesis` ("Sentimen positif teknikal berdasarkan data empiris."), **1 distinct** `ai_bahasa_bayi` ("Harga turun dikit buat naik lebih tinggi, ayo beli."), **1 distinct** `weakest_assumption`, and **1 distinct** 3-item `three_invalidations`. `risk_reward_ratio` is 2.2 on 11 of 12. `direction` is LONG on 12/12. `status` is `AWAITING_HUMAN_REVIEW` on 12/12 — a queue with no reviewer behind it. **These are string constants, not model output.**

**F5 — SL/TP for IDX are percentages, presented as structural levels:** `SL = entry × 0.96`, `TP1 = entry × 1.088`, `TP2 = entry × 1.144` on all 12. The `1:2.2` in the UI is then arithmetically true and structurally meaningless.

**F6 — A synthetic Level-2 order book, generated in the browser, shown with no "simulated" marker.** In `bundle.js`:

```js
if (live ? f.bids.length > 0) { use real bids/asks }
else {                                  // ← this branch is the normal case
  for (let fe = 0; fe < 10; fe++) {
    const ql = Math.exp(-.08 * fe);                       // decay curve
    const Ru = Math.round(ae*ql*(.85 + fe%3*.12));       // invented lot size
    const Nu = Math.round(ae*ql*(.65 + (fe+1)%3*.15));   // invented lot size
    O.push({price: et, lotQuantity: Ru}); V.push({price: wu, lotQuantity: Nu});
  }
}
// then: spread, spreadPercent, cumulative depth, buyerRatio → rendered as real
```
…rendered under the panel header **`BEI REGULATED MICROSTRUCTURE & EOD BROKER SUMMARY`**. 10 fabricated price levels, fabricated sizes, a fabricated spread, a fabricated BID 54 %/ASK 46 % imbalance bar. There is no badge distinguishing this from live depth.

**F7 — A hard-coded broker summary attributing fake accumulation to ten real, named securities firms.** When no broker data exists (always), the default object is:

```js
K = i || { bandarm_accumulation_grade:"BIG_ACCUMULATION", cr3_percentage: 68,
  bandar_avg_price: Math.round(price*.998), buyer_dominance_ratio: 2.75,
  foreign_net_value_idr: 2682e8,
  top_buyers:[ {broker:"AK", name:"UBS Sekuritas", lots:284500, value_idr:1889e8},
               {broker:"YP", name:"Mirae Asset", …}, {broker:"CC", name:"Mandiri Sekuritas", …},
               {broker:"ZP", name:"Maybank Sekuritas", …}, {broker:"BK", name:"J.P. Morgan", …} ],
  top_sellers:[ {broker:"PD", name:"Indo Premier", …}, {broker:"NI", name:"BNI Sekuritas", …},
                {broker:"CP", name:"KB Valbury", …}, {broker:"XC", name:"Ajaib Sekuritas", …},
                {broker:"GR", name:"Panin Sekuritas", …} ] }
```
Real IDX broker codes + real firm names + invented lot counts and invented Rp-188.9-miliar values, under a "bandarmologi / smart money" heading. Two problems: users would act on it, and **you are printing fictitious trading activity against identifiable companies.**

**F8 — The Economic Calendar is hand-typed into the bundle, including invented "ACTUAL" prints.** There is no calendar API (zero matches for investing.com / TradingEconomics / ForexFactory / Finnhub in the bundle). Yet `Kalender Makro` renders a professional table with `ACTUAL / FORECAST / PREVIOUS / STATUS` and prints:

```
2026-09-04  US  Non-Farm Payrolls       ACTUAL 142K   FORECAST 160K   PREVIOUS 114K  RELEASED  ▼
2026-09-02  ID  Indonesia CPI Inflation ACTUAL 2.12%  FORECAST 2.15%  PREVIOUS 2.13% RELEASED  ▼
2026-09-18  ID  Bank Indonesia 7D RR    —              6.00%          6.25%
2026-09-12  EU  ECB Rate Decision       —              4.00%          4.25%
2026-09-10  US  FOMC Rate Decision      —              5.25%          5.25%
2026-09-05  EU  OPEC+ Meeting           —              —              —         (labelled RELEASED)
```
A released print that never happened is the most harmful kind of fabricated figure in a macro calendar — it is presented as history. Note also `US 10-Year Note Auction … PREVIOUS 3.96%` while the same product displays US10Y = **4.84 %** and a headline says **4.79 %**. Also `OPEC+ Meeting` reported as `RELEASED` with all three numeric fields `—`.

**F9 — `STATISTICAL_ENSEMBLE` forecasts are a straight line.** All **36/36** `forecast_prices` have a constant first difference (linear drift), e.g. BBCA = 6433.4702, 6448.2839, 6463.0975, 6477.9111, 6492.7247 — step 14.8136 five times. `method` is `"STATISTICAL_ENSEMBLE"` for all 36. `probability_up` is drawn from 7 coarse buckets {0.15, 0.25, 0.30, 0.45, 0.55, 0.65, 0.75}. `price_target_5d` is literally `forecast_prices[4]`. And `forecast_direction` disagrees with the visible slope: PTRO is `BULLISH / p_up 0.75` while its path decays every day (+1.52 % → +0.68 %); MEDC is `BULLISH` on a flat +1.95 % line; **GOTO is `BEARISH / p_up 0.30` on a path of exactly 0.0 % for five days.**

**F10 — The Pearson matrix is a hand-entered 100-cell constant.** 10 assets × 10 assets × 2 horizons, symmetric with a diagonal of exactly 1, every value a 2-decimal literal (`SPY-BTC:.45`, `DXY-EURUSD:-.95`, `VIX-US10Y:.45`). No prices are fetched, no correlation is computed, and there is no "recompute" affordance. It is internally consistent — someone typed it carefully — but it is not a measurement.

**F11 — The backtests are not possible results.** `backtest_lab.archetypes`:

| Archetype | Trades | Win % | Return | PF | Sharpe | Sortino | MaxDD | Expectancy | "Exp3 Rank" |
|---|---|---|---|---|---|---|---|---|---|
| SMC ORDER BLOCK | 100 | 65.0 | **+1,604.3 %** | 2.67 | **9.18** | 12.24 | 20.7 % | 3.47 | #5 |
| FOREIGN FLOW MOMENTUM | 100 | 60.0 | **+1,666.3 %** | 2.70 | 8.04 | 11.58 | 19.7 % | 4.25 | **#7** |
| OVERSOLD REBOUND | 100 | 61.0 | +492.3 % | 2.13 | 6.15 | 7.36 | 17.4 % | 1.84 | #3 |
| PULLBACK | 100 | 62.0 | +366.5 % | 2.15 | 5.91 | 6.71 | 14.3 % | 1.84 | #4 |
| DIVIDEND TRAP | 100 | 60.0 | +181.4 % | 1.79 | 4.63 | 5.14 | 23.4 % | 1.92 | #6 |
| ACCUMULATION | 100 | 56.0 | +174.1 % | 1.55 | 4.05 | 4.76 | 18.8 % | 2.01 | #2 |
| BREAKOUT | 100 | **49.0** | +225.4 % | 1.31 | 3.49 | 4.68 | **51.2 %** | 2.12 | **#1** |

- **Sharpe 3.5–9.2 and Sortino up to 12.2.** World-class discretionary and systematic funds sustain 1.5–2.5. A Sharpe of 9.18 on an equity curve is not a good strategy, it is proof of a broken simulation.
- **Exactly 100 trades per archetype**, always — the sample is capped, it isn't an outcome.
- **`expectancy_pct × total_trades` does not reconcile with `total_return_pct` in 5 of 7 rows** (SMC: 3.472 × 100 = 347 % vs the claimed 1,604 %; Foreign Flow: 425 % vs 1,666 %; Pullback: 184 % vs 366 %; Oversold: 184 % vs 492 %; Accumulation: 201 % vs 174 %). Two of the numbers on the same row are measuring different universes.
- The hero line misreads its own table: **`🏆 #1 STRATEGY: FOREIGN FLOW MOMENTUM (Sharpe 9.18)`** — 9.18 is SMC's Sharpe; Foreign Flow's is 8.04. The "Exp3 Rank" column is scrambled against every sortable column (#1 is the strategy with a 49 % win rate and 51 % drawdown; #7 is the one the header calls best).
- Sub-copy says **"QUANT STRATEGY BACKTEST LAB // 2-YEAR HISTORICAL SIMULATION"** while the changelog says **"(5-year walkforward)"**, and the tab title says **"MONTE CARLO & HISTORICAL RISK-ADJUSTED RETURNS"**. Three different methodologies for one frozen table. And nothing here is Monte Carlo: the numbers are byte-identical on every load.
- No backtest window, no universe definition, no per-trade distribution, no benchmark, no survivorship handling, no slippage table (despite quoting 0.2 % slippage and 0.15/0.25 % commission as caption text).

### 3.3 Internal contradictions visible at the same moment

| # | Contradiction | Where |
|---|---|---|
| 1 | **Brent = `$101.05` and Brent = `$82.5` on one screen** | Home: macro wire vs `IHSG & GLOBAL REGIME` card |
| 2 | **US10Y = 4.84 %, 4.81 %, 4.79 %, 3.96 %** | wire, `^TNX` literal, headline text, calendar auction row |
| 3 | **BBCA = Rp 6,450 (bundle) vs Rp 9,250 (Pasar Global)**; BBRI 3,370 vs 4,920; BMRI 4,370 vs 6,450; ASII 4,880 vs 5,150 | two modules, same app, 43 % apart on the flagship name |
| 4 | **Headline "Commodity Prices Stable" while gold +0.91 %**; **"Emas & Minyak Menguat" (gold *and oil* rising) while Brent is −0.16 %** | Home wire items 1 and 2 |
| 5 | BBRI is **−Rp 1.04 B foreign OUTFLOW** on one card and **+Rp 70.4 B ACCUMULATION / MFI 71 / OBV UP** on the next, with nothing explaining foreign-vs-domestic | Home flow vs bandarmology cards |
| 6 | `NET ASING TERPANTAU +Rp 1.09 B` is arithmetically fine, **but `AKUMULASI INFLOW TOP 5 +Rp 5.53 B` is 97 % one stock**, and the "TOP 5" inflow table lists `MDKA +Rp 0`, `GOTO +Rp 0`, and `BRIS −Rp 18.7 M` (a *negative* number in the *inflow* list) | Home foreign-flow widget |
| 7 | `MDKA +Rp 0` / `GOTO +Rp 0` render as positive-looking inflows; the widget claims TOP 5 but shows 4 chips | Home |
| 8 | **Two clocks, one hour apart, both labelled WIB** — top bar `18.40.31 WIB` vs Pasar Global `17:40:31 WIB`, correct answer 17:40 | every screen |
| 9 | `🟢 SYNCED` status light next to a tooltip that says **"Snapshot Pipeline"** with a timestamp 8 hours old; the file is unchanged all day | top bar |
| 10 | `24h Vol: Active Spot` — a text placeholder sitting in a numeric volume field | crypto row detail |
| 11 | GOTO record is degenerate (`price 50, ma20 50, ma50 50, rsi 0.0, change 0.0, foreign_net 0.0`) → **flat series read as RSI 0 → "OVERSOLD_REBOUND" → a live LONG plan with TP/SL on the Home page** | bundle → Home |

### 3.4 False capability claims (marketing text describing code that doesn't exist)

| Claim (verbatim) | Reality |
|---|---|
| `⚙️` "Version: 2.4.0 … **TimesFM + SMC + IIFS Active**", `ENGINE: TimesFM AI + SMC + IIFS`, "Prediksi berbasis Google TimesFM (Zero-Shot Time Series Foundation Model)", Academy: "AI Prakiraan Tren: kecerdasan buatan dari Google Research" | **No TimesFM anywhere.** Zero inference endpoints, no onnx/tensorflow/transformers, no model weights, no API calls. The forecast is a straight line and its own `method` field says `STATISTICAL_ENSEMBLE`. Also uses a Google Research trademark as a product component |
| "⚠ AUTHORIZED PERSONNEL ONLY. **All access attempts are logged.**" | **Zero network requests fire on a failed login.** Nothing is logged, nothing is sent anywhere. Proven: filtered resource list after a failed attempt = `[]` |
| `ANTI-BRUTE: 5 ATTEMPTS/LOCKOUT` | Engages correctly *until you press F5*. Counter is React state; `{disabled:false}` immediately after reload, message resets to `(1/5)` |
| `SHA-256 CLIENT-SIDE VERIFICATION` | True — and that's the vulnerability: the digest is a literal in a public bundle, and the session flag is `localStorage.mbg_cockpit_auth = {"exp": <any future ms>}`. Setting that one key grants full access. **Proven — I was in as a visitor with no password in one console line** |
| "Level 2 **Real** Market Depth & Broker Summary … **Eliminasi total simulator acak. Integrasi 100% data riil**" + "**Official BEI Best Quote**" + "BEI REGULATED MICROSTRUCTURE & EOD BROKER SUMMARY" | Its own changelog entry is contradicted by the shipped code, which still contains the random-decay simulator (F6) and the hard-coded broker summary (F7). No BEI endpoint is called from the browser at all |
| "`🔗 Korelasi Pearson`" cross-asset measurement | 200 hand-typed literals (F10) |
| "Kalender Makro … tracking rilis data inflasi, suku bunga BI, dan FOMC Fed" | Hard-coded, with invented actuals (F8) |
| "SINKRONISASI BURSA GLOBAL **REAL-TIME**" | 11 literals (F1) |
| "`🧪 FORWARD SIMULATION · REAL-TIME EXECUTION MATH`" | The paper trader has **no price feed**: `Current` always equals `Entry`, `Unrealized PnL` is permanently `Rp 0 (0.00%)`, and `Close` books `exitPrice = entryPrice, realizedPnL: 0` classified as **"FLAT (CLOSED)"** and excluded from W/L. **The simulation cannot ever produce a win or a loss** |
| "5-year walkforward" (changelog) vs "2-YEAR HISTORICAL SIMULATION" (screen) vs "MONTE CARLO" (screen) | one frozen 7-row table |

**The one thing this product must never be is ambiguous about which numbers are measured and which are illustrative. Right now nothing on screen is labelled, and four labels actively claim the opposite.**

---

## 4. Functional defect log (all reproduced hands-on)

Severity: 🔴 breaks a user's work · 🟠 misleads or degrades badly · 🟡 polish.

| # | Sev | Defect | Reproduction / evidence | Fix |
|---|---|---|---|---|
| D1 | 🔴 | **The whole app is unnavigable at ≤768 px.** The drawer is off-canvas and the hamburger is permanently hidden. | At 390 px: `.sidebar` computed `transform: matrix(1,0,0,1,-230,0)` (first nav item at x = **−230**, `onScreen:false`), `.sidebar-hamburger` computed `display:none`. No other nav affordance exists. Phone users are stuck on whatever tab they landed on | Cascade order bug. In `app.css` the media rule is followed at the same specificity by the base rule, so the base rule wins:<br>`@media(max-width:768px){.sidebar-hamburger{display:flex}}`<br>`.sidebar-hamburger{display:none;…}` ← **later**<br>Move the base rule *before* the media query (or `.sidebar-hamburger{display:none}` → gate it as `@media(min-width:769px){.sidebar-hamburger{display:none}}`) |
| D2 | 🔴 | **Live order book can never load in the browser** — CORS. | Console: `Access to fetch at 'https://indodax.com/api/depth/suiusdt' from origin 'https://mbg-trading.pages.dev' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header`. Two failures (`/api/…` then `indodax.com`) then the synthetic book (F6) renders | Proxy depth through a Pages Function (`/api/depth/:venue/:pair`) with a 5–15 s edge cache. You already ship Functions — `/api/telegram-webhook` returns real JSON |
| D3 | 🔴 | **Every timestamp in the app is wrong for any non-Indonesian visitor, and still labelled WIB.** | Clock renders `new Date().toLocaleTimeString("id-ID",{hour12:false})` = **device** zone (my machine `Asia/Shanghai`, offset −480) → top bar `18.40.31 WIB` while Pasar Global shows `17:40:31 WIB`. Correct WIB = 17:40. News `pub_date 04:01:50 GMT` prints "12.01 WIB" instead of 11.01 | Hard-code the zone, don't inherit the device: `new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',hour12:false}).format(d)`. One helper, used by all three clocks and every news/calendar timestamp. For a tool showing an FOMC row, this is a "you missed the print" bug |
| D4 | 🔴 | `Watchlist` cannot resolve most tickers you already have data for. | Default list `["BBRI","ASII","TLKM","MEDC","BTCUSDT"]`. **TLKM renders `MANUAL_WATCH · - · +0 % · entry - · SL - · TP1 -`, and there is a full `forecasts.TLKM` record at Rp 2,640 in the same JSON.** Lookup only searches `daily_trade_plans` (12) + `crypto_spot_10` (10) + a few, so a 36-ticker universe is invisible to it. `BTCUSDT` also mismatches the stored key `BTC/USDT` | Resolve against the union of every universe in the bundle, keyed on a normalised symbol (`BTCUSDT` ≡ `BTC/USDT`). Add a "no coverage for this symbol" row instead of `-` |
| D5 | 🟠 | `Avg Risk/Reward` reads `1 : 0.00` while 5 open positions each carry R:R 2.2 | Testing Lab, immediately after `🤖 AUTO-PICK AI TOP 5` | Average `tp1/entry &c.` across the active book; show `—` not `0.00` when undefined |
| D6 | 🟠 | Dead primary data branch burns a request every time | `fetch('/api/tokocrypto/open/v1/market/depth?…')` → SPA fallback returns **200 + `text/html`** → `U.ok` true → `U.json()` throws → catch → Indodax. And Tokocrypto's public API answers `{"code":2802,"msg":"Trading pair does not exist"}` for BTCUSDT/BTCIDR/SOLUSDT/ETHUSDT anyway | Either implement `/api/tokocrypto/*` as a real proxy or delete the branch. Guard with `const ct = U.headers.get('content-type'); if(!ct?.includes('json')) throw` |
| D7 | 🟠 | Indodax pair normalisation drops only the first `_`, and most USDT pairs don't exist there | `g.toLowerCase().replace("_","")` (string, not regex) → `btc_idr`→`btcidr` ✅ ; `sol_usdt`→`solusdt` ❌ `invalid_pair`; `suiusdt` ❌; `xrusdt` ❌; `bnbusdt` ❌ | Map explicitly: `{BTC:'btc_idr', SOL:'solusdt→…'}`, or fetch `indodax.com/api/v1 pairs` once at boot and only offer supported pairs; surface "not listed on this venue" |
| D8 | 🟠 | Wrong source label shown when data is absent | `(f?.source) \|\| "Tokocrypto / Binance Live"` — a *fallback string*, so an empty synthetic book is credited to a venue that was never contacted; `source:"Indodax Bappebti Live"` is only set on the real path | `{source ?? null}` plus an explicit `SIMULATED` badge state |
| D9 | 🟠 | Modal/overlay traps the shell | Opening `📊 ORDER BOOK` paints `position:fixed;inset:0;z-index:9999` above the sidebar (`z-index:100`). Sidebar clicks time out with "…subtree intercepts pointer events". **No `role="dialog"`, no `aria-modal`, no labelledby exists anywhere in the DOM**, and the panel is not keyboard-dismissable | Real dialog: `role="dialog" aria-modal="true"`, ESC handler, focus trap, focus restore, `inset:0 0 0 230px` on desktop so the shell stays usable |
| D10 | 🟡 | Lot calculator accepts values its own label forbids | Label says `RISK % PER TRADE (1-5%)`; entering **100** yields `436 LOT … 2496.1 % dari Portfolio` with only a soft >25 % warning. `capital 0` → `0 LOT` silently, while the target-price block still prints `Rp 6,228.8 / 1 : 2.2`. Entry = SL is handled well ✅ ("⚠️ ERROR: Harga Stop Loss harus lebih rendah dari Harga Entry!") | `min/max/step` + clamp + hard error outside 0.25–5 %; suppress the TP block whenever the lot block is invalid; add a plausibility check vs. shares outstanding |
| D11 | 🟡 | Two money formats in one product | Calculator: `Rp 6,228.8`, `Rp 4,580,000`, `Rp 249,610,000`. Tables everywhere: `Rp 5.725`, `Rp 6.228`, `Rp 100.000.000`. For ID users a swapped separator is a misread-a-price risk | `new Intl.NumberFormat('id-ID')` in one place; keep US style only on `$` crypto |
| D12 | 🟡 | Redundant save affordance + wrong "max" | Watchlist shows `+ SIMPAN` **and** `TERSIMPAN OTOMATIS DI BROWSER LOCALSTORAGE` together; calculator headline reads `BELI MAKSIMAL` for what is the exact risk-based size, not a ceiling | Drop the button; rename to `UKURAN POSISI` |
| D13 | 🟡 | Duplicate logout control | A floating `🔓 LOGOUT` chip pinned bottom-right **and** `🚪 Logout` in the sidebar. The floating one is also first in tab order, and on mobile it overlaps table content | Keep the sidebar one; the chip should be the mobile drawer's close affordance instead |
| D14 | 🟡 | Auto-rotating wire can't be paused | `setInterval(() => d(k => (k+1)%s.length), 6e3)` on the 4-item FLASH ticker — no pause on hover/focus, no pause control, no `prefers-reduced-motion` guard (WCAG 2.2.2) | Pause on `:hover`/`:focus-within`, add `⏸`, and honour `prefers-reduced-motion` |
| D15 | 🟡 | Cache-buster defeats your own CDN cache | `fetch('/data/latest_cockpit_bundle.json?_t='+Date.now())` every `60 000 ms` → 41 KB gzip per open tab per minute ≈ 60 MB/tab/day for a file that changes once daily (and 1/minute of needless React re-render) | Poll 1× per 15 min and only re-fetch when `ETag` changes (`If-None-Match` → 304 = ~0 bytes); keep `SYNC` as the manual escape hatch |
| D16 | 🟡 | Flash of wrong theme | `<html>` ships with no `data-theme`; dark is applied post-mount → light-mode users see a dark→light (and light login→dark shell) jump | 3-line inline `head` script setting `data-theme` from `localStorage` before CSS paints |
| D17 | 🟡 | Login screen is styled for a different app | `fontFamily:"'DM Mono', 'IBM Plex Mono', monospace"` — neither font is loaded (the app loads JetBrains Mono + Plus Jakarta Sans) → the **first screen every user sees renders in a fallback font**, hardcoded `#faf9f5` light regardless of stored theme, and the error text (`ACCESS DENIED (1/5)`, `LOCKED…`) has no `aria-live`, so screen-reader users never hear why they're stuck | Move login styles into `app.css` with the app's real font stack; `aria-live="polite"` on the message; respect `mbg_theme` |
| D18 | 🟡 | 404 = soft 404 for every path | `/robots.txt`, `/sitemap.xml`, `/manifest.json`, `/llms.txt`, `/_headers`, `/data/nope.json`, `/definitely-not-a-page-xyz` all return **HTTP 200 + the 833-byte SPA shell** (`text/html`) | Add real `robots.txt`/`sitemap.xml` (or `noindex` if the tool stays gated) and a `_headers` + `404.html` so unknown paths answer 404 honestly |
| D19 | 🟡 | `⚙️ Settings` isn't settings | It fires `alert('MBG Astra Quantitative Desk\nVersion: 2.4.0 (Zero Runtime Cost)\nTimesFM + SMC + IIFS Active')`. There is genuinely no settings surface: no timezone, no watchlist sync, no data-source toggle, no density control, no reset-with-confirm | Real panel, or rename to `ℹ️ System & Versi` |

**Also verified working** (worth knowing, because these are the parts to protect in a rewrite): watchlist persistence, `+ Uji Beli Virtual`, `AUTO-PICK AI TOP 5`, position close + `CLOSED & HISTORY` + `STRATEGY STATS`, `🗑️ Reset`, academy `TANDAI SELESAI DIBACA` + progress + 66-term dictionary search + 10 real infographics, all 10 gallery images HTTP 200, search cascade filter (33 → 6 rows on `bac`; clean empty state `Tidak ada instrumen yang sesuai…`), sort headers `⇅`, `🔊 Dengar` (Web Speech, `lang:"id-ID"`), `📋 Salin`, `★ TERSIMPAN` bookmarks, calendar impact filters, `🔄 SYNC`, theme toggle (`mbg_theme` persists), `⭐/📰/📈` sidebar badges, keyboard tab order sane, 0 console errors on load, and `18.3.1` React with no sourcemap published.

---

## 5. Security audit

The threat model here is small — it's a personal tool with no accounts, no payments, no PII, everything in `localStorage` — so nothing here is a breach. But the *claims* are the problem: the UI asserts controls that don't exist, which is worse than silence.

| Item | State | Notes |
|---|---|---|
| Authentication model | 🔴 **cosmetic** | SHA-256 of the password compared to a constant (`286713785e8f…3e18`) inside the public bundle. I recomputed it: `sha256(sha-quoted-password)` matches exactly, so the scheme is as described — and worthless. Bypass A: `localStorage.setItem('mbg_cockpit_auth', JSON.stringify({exp:Date.now()+864e5}))` → **grants full access with no password** (verified). Bypass B: offline — all app content is already in `/assets/index-SMveqI-Q.js`, unencrypted, fetchable by anyone who finds the URL |
| Secrets exposure | 🟠 | **There is no secret.** The password, the whole app, and the entire dataset are public. If you ever add paid/PII content, this design leaks it on day one |
| "All access attempts are logged" | 🔴 **false** | No request fires on a failed attempt (`performance.getEntriesByType('resource')` after a bad login, filtered → `[]`). Asserting surveillance that doesn't happen is both deceptive and, in some jurisdictions, a privacy-representation problem |
| Rate limiting | 🔴 **none** | Counter is React state; reload resets. 5 attempts/60 s is decorative. Since there's nothing to protect, this is a claim problem not a control problem |
| Session | 🟡 | `{exp}` only — no device binding, no revocation, no re-auth. 24 h fixed. Fine for a personal tool |
| `Strict-Transport-Security` | 🟠 missing | Cloudflare gives you HTTPS; send HSTS |
| `Content-Security-Policy` | 🟠 missing | Real exposure: **3 inline `style` objects everywhere** plus `s3.tradingview.com`, `tradingview.com`, `fonts.googleapis.com`, `fonts.gstatic.com`, `widget-sheriff.tradingview-widget.com`, `indodax.com`, `tokocrypto.com`, `news.google.com` all third-party. Start with `Report-Only`, drop `unsafe-inline` for styles last |
| `Permissions-Policy` | 🟠 missing | Declare `geolocation=(), camera=(), microphone=(), payment=()`; `accelerometer=()` is worth gating given TradingView |
| `access-control-allow-origin: *` | 🟡 | On the JSON bundle it's harmless (public data) but unnecessary; drop it — it's the header a scanner flags first |
| `X-Frame-Options: SAMEORIGIN` / `X-Content-Type-Options: nosniff` / `Referrer-Policy: strict-origin-when-cross-origin` | ✅ | Present |
| Outbound links | ✅ | **all 25 have `rel="noopener noreferrer"` + `target="_blank"`** — good discipline, most teams miss this |
| XSS | 🟡 low | React escapes by default; I found no `dangerouslySetInnerHTML` on user data. Keep it that way for news titles ("Auto sanitization of HTML tags inside Markdown" is in the changelog — make sure any HTML-ish summary is escaped, not just stripped) |
| `localStorage` | 🟡 | Fine for personal data; watchlist can't inject because it's not rendered as HTML — keep it that way |
| `.git` / `.env` / directory listing | ✅ | all soft-404 to the SPA shell, nothing enumerable; sourcemap not published |
| Secrets in bundle | ✅ | none (no bot token, chat id, API key) |
| Supply chain | 🟡 | React 18.3.1 + one emoji icon set + TradingView embed. Small and good. Add a `Dependabot`/`npm audit` CI gate before it grows |

**Bottom line for §5:** if the password is meant to gate a *personal* tool, admit it (`this is obscurity, not security`) and delete the surveillance/lockout claims. If it's meant to gate a *product*, move the gate to a Pages Function (HTTP-only `__Host-` cookie + a real signed session), keep the dataset behind an authenticated endpoint, and stop shipping the data to unauthenticated browsers.

---

## 6. UI / UX / accessibility

### 6.1 What the design gets right — don't lose this
The desktop dark theme actually looks like a desk a trader would tolerate for eight hours. Dense bento grid with real grouping; JetBrains Mono for figures and Plus Jakarta Sans for prose is a correct pairing; tabular numerals; `SYNCED` dot + snapshot timestamp in the header (a genuinely good trust instinct — it just needs to be *true*); one accent per semantic (`#00d084` up / `#c44b2b` alert / purple SMC / blue flow, used consistently); `#`+`⇅` sort affordances on every table; and no gratuitous animation. This is a distinctive, coherent design language — not a generic dashboard.

The `🟢/🔴` impact colour coding on the economic calendar is consistent (`HIGH/MED/LOW` = red/amber/green, `RELEASED` greyed, `UPCOMING` amber) and ACTUAL-vs-FORECAST hierarchy is genuinely excellent. Same verdict for the correlation heatmap: green/red divergent, readable cells, diagonal distinct, "best hedge / highest synergy / safe haven" call-outs below. **These two screens are the strongest UI in the product — and the two most fabricated datasets. That combination is the whole problem in miniature.**

### 6.2 Design problems

| Sev | Problem | Where / evidence | Fix |
|---|---|---|---|
| 🟠 | **10 px baseline on a money app** | `.sidebar-nav-label`, badges, `telemetry-btn`, table cells, footer `fontSize:"10px"`, macro headlines `10px`; media query drops `body` to **12 px**; WCAG recommends a ≥ 24 px CSS target for text at that size, and 10 px grey-on-dark sub-labels (`text-muted` `#8a8a8a` family) sit right at the legibility cliff for a 35+ trading audience | 12 px floor for meta, 13 px for table cells; add a `Density: Compact / Comfortable` toggle in real Settings; fix the axe-flagged contrast on `.active > .sidebar-nav-label`, `.sidebar-nav-badge`, `.telemetry-btn span` |
| 🟠 | **Emoji used as the entire icon system** | Sidebar `🏠📈⚡📊⭐🌍🧪📅🔗📰🎓📜`, `🕵️ Broker Flow`, `💰 HITUNG LOT`, `📊 Order Book L2`, `🐳`, `🔒` | Emoji render differently per OS, can't be recoloured or sized, and read as decorative to screen readers. Swap to one line-icon set (Lucide/Phosphor) at 16 px, keep emoji only in prose |
| 🟠 | **Language drift damages the "institutional" claim** | EN chrome + ID content: `ACTIVE POSITIONS` next to `Uji Beli Virtual`; `Strategy/Entry/Current/SL/TP1/Unrealized PnL/Status/Action` beside `Hasil/Exit Price`; `MENAMPILKAN 10 DARI 10 INSTRUMEN` under English headers. Pick one. If the product is for IDX traders, that's Indonesian, with English only for genuine terms (SMA, RSI, FVG) |
| 🟠 | **Data density with no escape valve** | Home is a 4-tier bento of 15 widgets that must be scrolled; the 8-column signal table (`TICKER/ASSET/SIGNAL SETUP/ENTRY/STOP LOSS/TARGET 1/R:R/ACTION`) has no sticky header and no visible horizontal scrollbar, so `ACTION` is silently off-canvas at 1440 px | Sticky `thead`; visible scroll affordance (fade + `◀▶`); per-table column show/hide; `⭐ Pin to top` on signal rows |
| 🟠 | **`KLASTER` + `SINYAL/SETUP` identical in all 10 crypto rows** | every row is `LAYER 1 / DEFI` + `PULLBACK_SUPPORT_RETEST`, ~150 px of horizontal noise, and a tell that the analysis is monotone (the caption even says so: `(10 Hasil)`) | Drop `KLASTER` when it's a single value (or facet it); fix the clusters (`FET` is *not* a "LAYER 1 / DEFI" asset) |
| 🟠 | **Zero visual signal of staleness or provenance** | Prices in "VERIFIED FACTS" are 8–20 h old; "Order Book L2" has no `SIMULATED` badge when synthesised; `24h Vol: Active Spot` masquerades as a number | **A provenance chip on every number**: `LIVE` green · `SNAPSHOT 11:41 WIB` grey · `SIMULATED` amber · `STALE 4h` red. This one component would fix most of §3. See §10 P0-1 |
| 🟠 | **`AWAITING_HUMAN_REVIEW` with no reviewer; `CONFIDENCE` has no definition** | 12/12 plans forever pending; `HIGH/MEDIUM/LOW` confidence unquantified | Either wire a real reviewer queue, or rename to `MODEL OUTPUT — UNVERIFIED`. Define confidence as a formula and show it |
| 🟡 | `⚡ Sizing` / `📈 Chart` are icon-only on hover-less surfaces; `▼ Detail` vs `▼` vs `⇅` carry three different meanings | add `aria-label` + tooltips |
| 🟡 | Academy infographic renders a 3267 × 3746 px PNG into a narrow column → axis labels are illegible (confirmed in screenshot) | serve responsive WebP/AVIF at 1×/2× (~30–50 KB); make figures real `<figure>` with a `figcaption`; let users zoom |
| 🟡 | `5 LEVELS COMPLETE` is ambiguous against `0 % SELESAI (0/5 LEVEL LULUS)` | `5 LEVELS AVAILABLE` |
| 🟡 | Glossary search has no "did you mean" and no fuzzy match; "Kalkulator Lot & Cockpit Checklist" is a 4th tab in a 3-tab strip | trivial |
| 🟡 | `⚪ KONSOLIDASI PASAR SEHAT` with a grey dot = no up/down semantics but a bullish phrase | neutral → grey `KONSOLIDASI`; the word `SEHAT` is an opinion |
| 🟡 | `10092026` sidebar badge is an unreadable date; users must click to learn "what changed" | `v2.4 · 10 Sep` |
| 🟡 | Changelog card grid is ragged (masonry heights), version `v2.1.0` chip is low-contrast grey-on-grey and easy to miss | equal-height rows or a real vertical timeline (`v2.4 → v2.1` down the left rail) |

### 6.3 Accessibility — axe-core + manual, WCAG 2.2 AA

axe-core run on the live DOM returned 2 rule groups, but axe cannot see the structural problems below; manual findings dominate.

| Sev | Finding | SC | Evidence / fix |
|---|---|---|---|
| 🔴 | **No heading structure at all.** In the shell: `h1: 0, h2: 0, h3: 0`. Every section title is a `<div>` with inline styles. Screen-reader users get no outline and no way to navigate a 12-module app; also directly costs SEO (§8) | 1.3.1 / 2.4.6 | `<h1>`=module title, `<h2>`=widget, `<h3>`=sub. The login screen *does* use `<h1>`, so you know how |
| 🔴 | **Zero real links.** `a[href]` count in the shell = **0**; all nav is `<button>` + React state at a single URL `/` | 2.4.5 | No deep link, no right-click→open in new tab, no browser back, no shareable state, nothing for a crawler. Use `HashRouter`/`BrowserRouter` with 12 routes |
| 🔴 | **Tabs and accordions are `<div onClick>`.** `Active Positions` / `Closed & History` / `Strategy Stats` are `DIV`, `tabindex:null`, no `role`. Unreachable by keyboard; they do work under mouse | 2.1.1 / 4.1.2 | `role="tablist"`+`role="tab"`+`aria-selected`, `tabindex="0"`, ArrowLeft/Right handling |
| 🟠 | **No focus indicator.** `:focus`/`:focus-visible` appears **0 times in `app.css`**; computed `outline: auto 0px` with no `box-shadow` fallback → keyboard users can't see where they are on a dark canvas | 2.4.7 | `:focus-visible{outline:2px solid #4a90e2; outline-offset:2px}` globally |
| 🟠 | **Dialog semantics absent.** `document.querySelector('[role=dialog], .modal')` → `null` and no `aria-modal`. The order-book overlay covers the sidebar (z-9999 vs 100), traps clicks, does not restore focus, and — per D9 — does not close on ESC | 4.1.2 | proper dialog |
| 🟠 | **Contrast failures (axe, "serious"):** `.active > .sidebar-nav-label`, `.active > .sidebar-nav-badge`, `.telemetry-btn span`; light-theme `PRO` badge is light-grey-on-white | 1.4.3 | audit `--text-muted` in both themes; 4.5:1 for meta text |
| 🟠 | **`<html lang="en">` while the content is ~90 % Indonesian** → screen readers mispronounce every label. And **`Kalender Makro` claims `Timezone: Asia/Jakarta (WIB)` with no user control** | 3.1.1 / 1.4.x | `lang="id"`; if/when you add EN, `lang` per node + `hreflang` |
| 🟠 | **Unlabelled numeric form controls.** The 4 lot-calculator inputs have `placeholder:""` and no `id`/`label[for]`/`aria-label`. A keyboard/screen-reader user literally cannot tell capital from risk from entry from stop on a *money* form. Search inputs (`placeholder` only) same issue. Chrome flags the password field too (`Input elements should have autocomplete attributes`) | 3.3.2 / 1.3.1 | real `<label>`, `inputmode="decimal"`, `autocomplete="off"` on the credential field |
| 🟠 | **Auto-rotating 6 s carousel with no pause** (D14) | 2.2.2 | pause + `⏸` + `prefers-reduced-motion` (0 occurrences in CSS today) |
| 🟡 | Tables have no `<caption>`, no `scope="col"`, and the 8-col signal table is not responsive/pinnable | 1.3.1 | add `scope`; `caption` (visually hidden is fine) |
| 🟡 | Icon-only buttons (`▼`, `⇅`, `×`, `☆`, `🔊`) mostly unnamed; `Settings` and `Logout` do have `title` ✅ | 4.1.2 | `aria-label` on each |
| 🟡 | No skip link; no focus management on module change (SPA sways focus to `<body>`) | 2.4.1 | `<a class="sr-only" href="#main">Lewati ke konten</a>` + move focus to the new `<h1>` |
| ✅ | Landmarks are correct — exactly one each of `aside` (complementary), `nav`, `header` (banner), `main`; `aria-label="Toggle Sidebar"` on the (hidden) hamburger; `title` attributes on settings/logout/logo; zero images without `alt` | | real baseline to keep |

**Honest score: this is not a "needs some a11y polish" app, it's an app where a keyboard-only or screen-reader user can't do 4 of the 12 jobs.** The three structural fixes (headings, links/routes, real buttons for tabs) unlock most of it at once.

---

## 7. Compliance & legal risk — treat this as the second-urgent section after §3

I'm not a lawyer and this is not legal advice; take it to Indonesian counsel. But an auditor's read of the risk surface, in exposure order:

1. 🔴 **Securities-recommendation exposure.** The Home page and `Saham IDX` publish, for 12 named IDX tickers, a directional call (`LONG`), a specific `entry`, `hard SL`, `TP1`, `TP2` and a computed lot size on a stated Rp 100 jt portfolio. Under Indonesian capital-markets rules, the activity of habitually giving specific buy/sell recommendations on securities for consideration is a licensed activity (the OJK-licenced penasihat investasi / agency-transaction regimes; offering securities-related advice for compensation without a licence is the exposure). Today the *entire* mitigation is:
 > `DISCLAIMER: Algorithmic screening & quantitative intelligence only. Bukan ajakan atau nasihat investasi.`
 …one 10 px line in the page footer. **One footer line does not discharge that risk against 22 prominent signal cards with entry/SL/TP.** Fix: move the disclaimer to be adjacent to every signal, in the card; add an interstitial on first open ("This is a personal research tool, not advice, no license, no track record"); gate the entry/SL/TP columns with `EDUKASI — bukan rekomendasi`; get counsel on whether you need a licence before you charge anyone.

2. 🔴 **`BIG_ACCUMULATION`, CR3 68 %, and invented Rp 188.9 miliar attributed to UBS Sekuritas / J.P. Morgan Sekuritas / Mirae Asset / Mandiri Sekuritas / Maybank / BNI Sekuritas / KB Valbury / Ajaib / Indo Premier / Panin.** These are real firms. Publishing invented per-broker transaction data against them on a paid research-style product is a straightforward commercial-defamation and unfair-competition exposure, entirely avoidable. **Delete the fabricated broker object today** (it's dead weight anyway — nothing reads it from a real source).

3. 🔴 **Fabricated "released" economic data presented as fact.** Printing `NFP ACTUAL 142K` that never happened, on a product users may trade off, plus a `Timezone: Asia/Jakarta (WIB)` confidence cue and (D3) wrong local times. Fix: pull a real calendar (or drop the numeric columns).
4. 🟠 **Regulator / exchange / vendor name-dropping.** `Indodax Bappebti Live`, `BEI REGULATED MICROSTRUCTURE & EOD BROKER SUMMARY`, `Official BEI Best Quote`, `IDX OFFICIAL FEED`, `Bloomberg NewsWire Tape` (the feed is actually Google News RSS from CNBC Indonesia/ANTARA/etc.), `Kalkulasi Lot Fraksi OJK`. Each implies an endorsement, a licence, or a data licence you do not have. `Bappebti` and `OJK` are regulator names; `BEI`/`IDX` and `Bloomberg` are trademarked. Rename to what is literally true: *"Order book: Indodax public depth API"*, *"Berita: agregasi Google News RSS"*, *"Ukuran lot: 1 lot = 100 lembar (konvensi BEI)"*.
5. 🟠 **`Astra`.** The methodology is repeatedly branded `MBG Astra Quantitative Desk`, `Astra Quant Intelligence Desk`, `Doktrin Astra`, `Astra Standard`, `Kalkulator Lot Astra`, `FLOWCHART SOP 5 LANGKAH ASTRA STANDARD` — inside a product whose flagship universe includes `ASII = Astra International`. Astra International is a listed Indonesian conglomerate and a well-known mark. This reads as affiliation. Rename the doctrine (`Doktrin MBG`, `SOP Disiplin 2 %`) and say so plainly in the changelog.
6. 🟠 **`Google TimesFM` attribution** (§3.4) — third problem: trademark association plus a capability that doesn't exist.
7. 🔴 **Empty paper-trading track record.** Because D3/D6 leave `Current = Entry`, the simulation can only ever print `FLAT (CLOSED)` and 0.00 %. A "test lab" that can't produce outcomes is worse than no lab if anyone cites it as evidence of accuracy. Ship live prices into the paper book or state plainly that it's a journalling tool, not a performance test.
8. 🟡 **No Terms, no Privacy Policy, no contact, no operator identity, no company/imprint, no cookie/consent banner** — I confirmed there is no `/tos`, and there are no `a[href]` to any such page. Low real harm today (analytics and PII are absent; storage is `localStorage` only), but it's the first thing an OJK enquiry, an app-store review, a payment processor, or a partnership diligence will ask for. Add: ToS, Privacy (say "no data leaves your browser"), Risk Disclosure (crypto + equities both), a real e-mail, and — the big one — *who operates MBG*.
9. 🟡 **Crypto-specific risk language** is present (`⚡ SPOT … BEBAS RISIKO LIKUIDASI LEVERAGE`), and correct, but the product never says crypto is not a Bappebti/OJK-supervised investment for these purposes, nor that 5 of these 10 pairs may not be listed on a domestic venue at all.
10. 🟡 **AI-content labelling** is coming in from several directions (EU AI Act transparency; Indonesian `UU ITE` + the new `PP PMSE`/OJK guidance on financial-content marketing). Fields named `ai_thesis`, `ai_bahasa_bayi`, `ai_market_sentiment` exist. They are string constants. Label generated text `contoh keluaran model`, and only say "AI" when a model generated that sentence.

---

## 8. Performance, SEO, AI-answer readiness

### 8.1 Front-end performance — genuinely good (79/100)
Metrics: FCP 212 ms · DOMContentLoaded 119 ms · load 159 ms · 9 resources · HTTP `103 Early Hint` preconnect to fonts.googleapis.com · JS 121 KB gzip · CSS 2.7 KB gzip · JSON 41 KB gzip · 655 DOM nodes on Home · 0 CSS keyframes. That beats most "dashboard" templates; the Cloudflare edge is doing its job (`cf-ray`, `h3`, `ETag`, `cache-control: public,max-age=60,s-maxage=300` on assets).

Remaining perf work, roughly in order of value: D15 (kill the 41 KB/min cache-busted poll; `If-None-Match`), D16 (theme-flash), 4.6 MB of infographic PNGs at ~3400 × 3700 → responsive AVIF/WebP would cut this to ~350 KB total, render-blocking Google-Fonts CSS → `font-display:swap` (you already request it) plus `preload` for one weight per family, and the three separate 1-second `setInterval` clocks (collapse into one `useClock()` hook).

### 8.2 SEO — 12/100, and mostly *by design* (gate-keeping). Here's the honest framing:
The indexable surface is: `<title>MBG // Market Brain Grid — Tactical Quant Terminal</title>`, `<meta name="viewport">`, a favicon, and **nothing else**. Everything a crawler needs is absent.

| Missing | Impact if you want traffic |
|---|---|
| `<meta name="description">` | Google writes its own snippet from… nothing, since the body is `<div id="root"></div>` |
| Open Graph + Twitter Card (`og:title/description/image/url`, `twitter:card`) | **Links shared to WhatsApp/Telegram/X render as a bare URL.** For a product whose changelog advertises a Telegram bot, this is your #1 acquisition hole |
| `rel="canonical"` | duplicate-URL risk if you ever add query params |
| `robots.txt`, `sitemap.xml` | both soft-404 to the SPA shell (D18) — Google sees a 200 HTML page and indexes it as a soft 404 |
| JSON-LD (`Application`, `Organization`, `WebSite`, `Dataset`, `SoftwareSourceCode`) | no entity graph, no rich results; a *data product* publishing a `Dataset` schema would be unusual and useful |
| Headings (`h1:0`) | no topical signal, and an a11y failure (D2.6.3) |
| Real routes / `<a>` links (`0`) | 12 modules are undiscoverable to any crawler |
| SSR / prerender / hydration | CSR only → Googlebot's WRT index *can* run your JS, but Bing/AI crawlers largely don't, and 200–500 ms of JS + 41 KB JSON is a real cost for them |
| `lang="en"` vs Indonesian content | wrong language signal, no `hreflang` |
| `og:image` / 1200 × 630 preview | none exists |
| `favicon` | ✅ present (`image/svg+xml`) |
| `theme-color` | absent → ugly browser chrome in both themes |

### 8.3 GEO / AI-answer readiness (this is where a gated tool can still win)
- No `llms.txt`. If MBG ever exposes public methodology docs, `llms.txt` gets you cited by ChatGPT/Perplexity/AI Overviews.
- No `robots.txt` = permissive-but-broken (D18). Explicit is better: allow `/academy`, disallow the gated app, point at the sitemap.
- Methodology pages written as short, self-contained, quotable facts ("Lot = 100 lembar; risiko 2 % = (modal × 0.02) ÷ (entry − SL)") are *exactly* the shape LLMs cite. Your `Quant Academy` (66 terms, 5 levels, real authored explanations with citations like `Ralph Vince, 1990` and named IDX rules `ARA/ARB`, `fraksi harga`) is a genuine, unusual GEO asset — currently invisible because it's behind a password in a CSR shell with no headings.
- **GEO integrity warning:** an AI ingesting your copy would confidently repeat "TimesFM foundation model", "Bloomberg newswire tape", "official BEI best quote", "Bappebti live", "Sharpe 9.18". Fabricated claims get *worse* when they get quoted by machines. Publish only what you can defend.
- E-E-A-T: **Experience** and **Expertise** are the two missing pillars — no author, no operator, no credentials, no contact, no "who built this and why". For a financial topic, Google's `YMYL` treatment makes these near-decisive. The `full_narrative` / `key_takeaways` template strings also *destroy* Trust once read closely; write less, mean it.

---

## 9. Marketing, positioning, copy and conversion (46/100)

**What's good and should stay:** a razor-sharp niche — Indonesian retail equity traders who want institution-shaped tools (bandarmologi, IIFS, SMC, fraksi BEI, lot sizing, Rupiah porto) and can't afford a Bloomberg. Naming local concepts (`boncos`, `bandar`, `bahasa bayi`, `ARA/ARB`, `CR3`, `Doktrin 2 %`) is the right, differentiated, culturally fluent move. The `facts → opinion → invalidation → weakest assumption` framing on trade plans is a genuinely sophisticated disclosure pattern (and if the numbers were true, it'd be best-in-class). `⚡ SIZING` next to every signal is a smart conversion affordance: the user's job is *what size*, not *what price*. Honest, self-deprecating product voice (`Anatomi Boncos`, `ANTI BONCOS`, `0% SELESAI`, `Hukum 90/90/90`) is memorable, human, and completely unlike generic AI dashboards.

**What's costing you users:**

1. 🔴 **`100 % data riil`, `ELIMINASI TOTAL SIMULATOR ACAK`, `REAL-TIME`, `OFFICIAL BEI BEST QUOTE`, `VERIFIED FACTS`, `TimesFM + SMC + IIFS Active`, `ANTI-BRUTE`, `attempts are logged`.** Indonesian retail-trading communities are forensically suspicious of exactly this vocabulary. The moment one person dumps the bundle and finds `cr3_percentage:68` and the `Math.exp(-.08*i)` order book — one thread, one screenshot — *is* your reputational kill shot. Your own changelog hands them the checklist.
2. 🔴 **The unexplained `Astra`.** New users cannot tell if this is affiliated, endorsed, or the name of the method. Ambiguity always resolves to the cynical read. Rename and move on.
3. 🟠 **Feature-led, not outcome-led.** Every headline names a widget (`🏠 HOME COMMAND CENTER`, `🌐 SENTRALISASI FOREIGN FLOW MACRO`). The value is `saya berhenti over-size dan cut loss lebih cepat`, not the panel. Rewrite each module's opening line as the decision it improves.
4. 🟠 **`🟢 SYNCED` vs a snapshot timestamp = a standing contradiction.** If `SNAPSHOT · 11:41 WIB` were the visible state, it would *read as honest* (and it is).
5. 🟠 **No activation moment.** 12 undifferentiated sidebar items, a default watchlist you didn't choose, a paper book that can't move. First-run should be: choose 3 tickers → see *live* depth for one of them → size one trade → get the disclaimer → *done*. Nothing onboarding-adjacent exists today.
6. 🟠 **Language drift is a positioning problem**, not just polish (see §6.2).
7. 🟡 **No pricing / plan / CTA at all.** Unknown intent, but if a `$` tier is ever planned, `PRO` badges + `v2.4.0 (Zero Runtime Cost)` are a strange architecture to sell off. `Zero Runtime Cost` is an engineering brag — cut it from the login dialog.
8. 🟡 **No social proof or operator bio.** No results, no screenshots, no community, no author. The Academy can carry that. `full_narrative` is 145 characters of filler.
9. 🟡 **Changelog is internal-notes-shaped**, not user-shaped. Tagging is a mix of `v2.1.0` and an unreadable `10092026`, and it's the *only* place describing the product's own claims. Rewrite as `Ada yang berubah: … → manfaatnya buat Anda`.
10. 🟡 **`PELJARAN 5.1: Mengapa Wajib Kripto Spot USDT (Nol Leverage, Nol Likuidasi)`** is a strong editorial opinion with real bias (`Pasar derivatif/futur…`) presented inside an education module. Label opinion, or give the counter-case.

**Positioning I'd adopt** — narrow and hard to attack: *"Alat riset pribadi untuk trader saham IDX. Data: apa adanya, sumber: tertulis, tanggal snapshot: terlihat. Semua simulasi diberi label SIMULASI."* Honesty *is* the differentiator in a local market full of signal-selling — that's the most valuable marketing idea in this audit.

---

## 10. The fix list, in order

### 🔴 P0 — before any other person is given the password (≈ 1 day of work, and this is cheap relative to the exposure)

**P0-1 · Build one "provenance chip" and put it on every number.** One component; four states: `● LIVE 12:41:03 WIB` · `◐ SNAPSHOT 11:41 WIB` · `◔ SIMULATED` · `✕ NO DATA`. Apply it to the price, order book, calendar actuals, correlation cells, broker panel, crypto cards, watchlist, and portfolio value. This one decision dissolves ~90 % of §3's harm **without deleting a single screen**, and immediately makes `VERIFIED FACTS` true.

**P0-2 · Delete or badge the four worst fabrications.**
1. `crypto_spot_10` — fetch live spot (Binance public REST via your own Functions proxy; or Tokocrypto's real, correct symbol) and **recompute entry/TP/SL from real structure**, or (interim) replace the whole module with `SNAPSHOT · 09 Sep 16:51 · bukan harga live` on every row. Never leave 68,500 BTC on screen under a "momentum" claim.
2. The **broker summary** default object (F7) and its 10 named firms → **delete today**; show `Broker summary: tidak tersedia` (that string is already written in the code — you have the honest branch, you're just not using it).
3. **Synthetic L2 book** (F6) → keep it (it's a legitimately useful "what depth looks like" demo) but title it `CONTOH SKEMA (bukan riil)`, hide `spread`/`imbalance`, and route real depth through the `/api/depth` proxy so the live case is the normal case.
4. **Economic calendar** actuals (F8) → pull a real feed, or blank the `ACTUAL/FORECAST/PREVIOUS` columns to `—` (which you already do for 5 of 12 rows).

**P0-3 · Fix the three bugs that break real work.** Mobile hamburger (D1, one CSS reorder — the app is currently unusable on a phone for most of your likely audience), timezone (D3, one helper), and the CORS order-book proxy (D2 — you already ship Pages Functions, so this is small).

**P0-4 · Remove every claim you can't defend.** Replace `REAL-TIME`/`OFFICIAL BEI BEST QUOTE`/`100 % data riil`/`Binance`/`Bloomberg NewsWire Tape`/`BEI REGULATED`/`Indodax Bappebti Live`/`TimesFM` with literal descriptions. Fix the two `🏆 #1 / Sharpe 9.18` misreads and the 4.79/4.81/4.84/3.96 % and 101.05/82.5 Brent pairs so no two numbers disagree on screen. Fix `Avg Risk/Reward 1:0.00`, plus clock #2, plus the `24h Vol: Active Spot` placeholder.

**P0-5 · Truth in the login screen.** Drop `All access attempts are logged` (false). Reframe `ANTI-BRUTE: 5 ATTEMPTS/LOCKOUT` as `5 percobaan lalu tunggu 60 detik — hanya di perangkat/tab ini`, and make it a soft hint like `⚠️ Kata sandi membuka tampilan — bukan keamanan data. Semua konten tersedia di sisi klien.` If the intent is a real paywall, §5's move is small and you already have the primitives.

**P0-6 · Compliance surface.** Adjacent-to-signal disclaimer, one-line risk disclosure on each crypto pair, first-open interstitial, plus ToS / Privacy / Risk / contact/identity page. Send the fabricated-broker item (§7.2) and the Astra and TimesFM names (§7.5/6) to Indonesian counsel before monetising.

### 🟠 P1 — 1–2 weeks of real product improvement

1. **Route-based navigation + deep links** (`#/saham/BBCA`, `#/kalender`) → enables back/forward, sharing, per-module metadata. Solves the biggest architecture problem (§6.3) and the biggest conversion problem (§9.5) in one change.
2. **Rebuild the backtest lab into something you can defend.** Report the *window* and *universe*; make trades organic (not 100); publish the per-trade distribution; state the 0.2 % slippage/0.15/0.25 % commission and a benchmark comparison; compute `expectancy × n ≡ total_return`; drop the "Exp3 Rank" and Monte Carlo verbiage. Add an in-product, seeded, client-computed backtest — it removes the whole static-file trust problem — and label it clearly `HASIL SIMULASI, BUKAN TRACK RECORD`.
3. **Make the template strings real, or write less.** `facts_summary` is genuinely correct (it interpolates price/signal/RSI/MA20/subgroup — 3/3 sample rows checked). `opinion_thesis`/`ai_thesis`/`ai_bahasa_bayi`/`three_invalidations`/`weakest_assumption`/`catalyst_thesis` are constants. Generate from *deltas* only — if price < MA20 the string must say `di bawah MA20` — and cap each entry to its honest value. Same in news (`Warta dari {source}: …`, 3 fixed takeaways, `reading_time_sec: 45` for all 25 → compute real reading time from word count; `key_takeaways` should differ between a bullish and bearish item).
4. **Fix the `probability_up` / direction / path triangle** so all three agree. Then show `p_up`, the 80 % band as a cone (which is right), *and* the walk-forward error of your own method against real outcomes.
5. **Watchlist resolution** (D4) + `+ SIMPAN`/`MANUAL_WATCH` clean-up + live "no coverage" state.
6. **A real `Settings` panel**: timezone, currency, language, density, data-venue, and a `Reset semua data lokal` with typed confirmation (currently `confirm()` + `alert()` are the app's only dialogs).
7. **Kill dead code paths** (D6/D7/D8) and make the failure state visible: right now a broken fetch silently becomes a pretty fake book; that's the pattern to remove everywhere.
8. **Onboarding**: empty-state-first watchlist, a 4-step guided first trade, and a "what this is / is not" first-run card.
9. **A11y pass**: headings → `role="tab"`/`dialog` → focus-visible → labels on the 4 calculator inputs → carousel pause → `lang="id"` → contrast on the 3 axe-flagged tokens. That's ~2 days and takes you from 31 to roughly 70.
10. **Add the news module's real superpower:** group 25 headlines into ~4 deduped stories (news-1/9/15/25 are the same ANTARA piece; 7 sources publish the same "IHSG dibuka menguat"), then show `7 sumber melaporkan ini` + a consensus direction. Nobody else in the segment does this well.

### 🟡 P2 — next tier

Public, uncatalogued "What is MBG" landing page with metadata/OG/`llms.txt` + 6 SEO/GEO pages; 10 infographics as real figures plus a downloadable PDF; TradingView widgets for global markets (fixes F1 without needing price data); real IDX/BEI data licence, or an explicit `unofficial` disclaimer; Telegram bot `/saham` etc., which almost exists (`/api/telegram-webhook` already responds) — a genuinely strong distribution channel for this audience, and a good reason to fix the data first; `ETag` polling, clock consolidation, font preload, AVIF figures; Playwright smoke tests + CI (`axe`, `lhci`, bundle budget, `npm audit`); a public data-quality page (sources, coverage, update cadence, known-stale tickers like GOTO); a `dividend_hunters` / `conglomerates` / `smc_analysis` re-audit (I confirmed `dividend_yield_pct: 0` and `dividend_trap_risk: "N/A"` across all 10 dividend rows and `BARITO_GROUP`/`SALIM_GROUP`/`ASTRA_GROUP` cluster lists exist, so the same provenance chip applies there too).

---

## 11. What to protect

Don't rebuild this. It's 80 % of the distance and the hard 80 % — design system, module architecture, form maths, and a real news ingest with citations that resolve — is done, and done better than most products with a team behind it. The missing 20 % is discipline about what a number means, and it's the cheapest 20 % in the project: one chip, one fetch per fabrication, one honest sentence per claim.

Ship P0-1→P0-4 this week and MBG goes from "impressive, but I'd never trade off it" to "the only Indonesian retail tool that tells me where each number came from" — which is the one position in this market that nobody else currently owns.

---

### Method note (so you can re-run everything)
Password verification: `printf '%s' "$PASS" | sha256sum` = `286713785e8fbca141922642c96747842acd886f6da2f7598d0bc8554b8c3e18` = the `ig` constant in `bundle.js`, so the scheme is described accurately and is client-side only. Crypto prices: `Binance /api/v3/ticker/price` for 10 pairs at ~10:32 UTC on 10 Sep 2026. Live order book: `indodax.com/api/depth/{btcidr,ethidr,btcusdt,ethusdt,solusdt,suiusdt,xrusdt,bnbusdt}` (2 valid, 6 `invalid_pair`) and `tokocrypto.com/open/v1/market/depth?symbol=…` (`code 2802` for all four tested). News links: HTTP 200 at `news.google.com/rss/articles/…`. Fabrication evidence: string-literal search in `bundle.js` + `/data/latest_cockpit_bundle.json` fetched and analysed in Python (all 36 forecasts, 12 plans, 10 crypto setups, 7 archetypes, 25 news items, 100-cell correlation matrix). Interaction testing: Playwright at 1440 × 900 and 390 × 844, `console`/`network` logs, `axe-core@4.10.2`, Performance API, plus 6 explicit lot-calculator edge-case inputs. Screenshots: 15 in this folder.
