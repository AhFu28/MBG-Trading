# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: routes.spec.js >> navigation reaches every route by clicking, not by URL >> the Account menu reaches Legend Path and it renders
- Location: e2e\routes.spec.js:77:3

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /legend path/i
Received string:  "MBG QUANT
MARKET TERMINAL
Home
Trade
▼
Markets
▼
Research & Learn
▼
Account
▼
🔍
Cari
★
☀️
⭐
PRO
🏠 MARKET OVERVIEW
⚡
MODE PRO
🔍
Cari saham, crypto...
Ctrl K
BURSA
🇮🇩
JKT
22:57
·
🇯🇵
TYO
00:57
·
🇬🇧
LON
16:57
·
🇺🇸
NYC
11:57
🕒
22.57.11 WIB
🛡️
SENTINEL
💰
LOT CALC
🔄
☀️
LIGHT
Market Overview
LIVE
diperbarui 22.57.11
↻ Segarkan
BTC
7d
$81,075.25
-2.80%
ETH
7d
$2,433.96
-5.29%
BNB
7d
$732.06
-4.95%
SOL
7d
$108.69
-6.94%
XRP
7d
$1.35
-6.20%
Market Status
Status sesi bursa saat ini (waktu Jakarta)
Bursa Efek Indonesia
Besok 09:00 WIB
TUTUP
New York Stock Exchange
Tutup 16:00 ET
BUKA
London Stock Exchange
Besok 08:00 GMT
TUTUP
Tokyo Stock Exchange
Buka 09:00 JST
TUTUP
Crypto (24/7)
Perdagangan tanpa henti
BUKA
Fear & Greed
64
Greed
Sumber: alternative.me
Market Cap
$2.76T
-5.25%
Volume (24h)
$108.31B
Koin Aktif
22.086
Altcoin Season
—
Bitcoin Season
Altcoin Season
Dominasi
Bitcoin
59.1%
Ethereum
10.8%
Others
30.1%
Watchlist Saya
Belum ada instrumen
☆
Klik ikon bintang di tabel koin untuk menambahkan instrumen ke sini.
Kapitalisasi Pasar BTC
30 hari terakhir, dihitung dari harga BTC dan supply beredar
Overview
Breakdown
7d
30d
90d
Market Cap
$1.60T
-5.25%
Volume (24h)
$1.21B
$1.71T
$1.64T
$1.57T
$1.50T
9 Sep
8 Okt
Derivatives
Sumber: Hyperliquid
Open Interest
$11.62B
Volume (24h)
$7.63B
Open Interest Terbesar
BTC
$3.19B
0.0011%
ETH
$2.77B
-0.0008%
HYPE
$1.65B
0.0013%
SOL
$612.61M
-0.0008%
ZEC
$509.37M
0.0013%
Semua Aset
Crypto, saham US, forex dan komoditas dalam satu tabel
Semua (133)
🪙 Crypto (100)
🇺🇸 Saham US (19)
💱 Forex (10)
🛢️ Komoditas (4)
Pasar	Nama	Harga	24j %	Volume	Market Cap	Aksi
🪙 Crypto·
☆
USDC
USDC
	$1.00	+0.03%	$5.11B	—	📈 Chart
🪙 Crypto·
☆
BTC
BTC
	$81,075.25	-2.80%	$1.51B	—	📈 Chart
🪙 Crypto·
☆
ETH
ETH
	$2,433.96	-5.29%	$930.32M	—	📈 Chart
🪙 Crypto·
☆
SOL
SOL
	$108.69	-6.94%	$294.64M	—	📈 Chart
🪙 Crypto·
☆
NEAR
NEAR
	$4.67	-7.53%	$278.01M	—	📈 Chart
🪙 Crypto·
☆
ZEC
ZEC
	$1,122.43	-15.55%	$265.60M	—	📈 Chart
🪙 Crypto·
☆
USD1
USD1
	$0.9996	-0.01%	$237.13M	—	📈 Chart
🪙 Crypto·
☆
XRP
XRP
	$1.35	-6.20%	$220.79M	—	📈 Chart
🪙 Crypto·
☆
DOGE
DOGE
	$0.0826	-7.04%	$104.78M	—	📈 Chart
🪙 Crypto·
☆
BNB
BNB
	$732.06	-4.95%	$101.35M	—	📈 Chart
🪙 Crypto·
☆
SUI
SUI
	$1.03	-8.87%	$89.17M	—	📈 Chart
🪙 Crypto·
☆
RLUSD
RLUSD
	$1.00	+0.02%	$81.10M	—	📈 Chart
🪙 Crypto·
☆
UNI
UNI
	$7.34	-6.55%	$74.57M	—	📈 Chart
🪙 Crypto·
☆
PUMP
PUMP
	$0.00548800	-12.65%	$65.37M	—	📈 Chart
🪙 Crypto·
☆
AVAX
AVAX
	$10.00	-11.07%	$64.10M	—	📈 Chart
🪙 Crypto·
☆
MET
MET
	$0.4351	+31.05%	$54.37M	—	📈 Chart
🪙 Crypto·
☆
ADA
ADA
	$0.2313	-9.82%	$50.54M	—	📈 Chart
🪙 Crypto·
☆
ENA
ENA
	$0.2053	-10.23%	$44.98M	—	📈 Chart
🪙 Crypto·
☆
WLD
WLD
	$0.4768	-8.13%	$42.17M	—	📈 Chart
🪙 Crypto·
☆
HYPE
HYPE
	$83.40	-5.89%	$38.48M	—	📈 Chart
🪙 Crypto·
☆
TAO
TAO
	$263.60	-9.17%	$37.99M	—	📈 Chart
🪙 Crypto·
☆
QNT
QNT
	$229.53	-5.32%	$35.05M	—	📈 Chart
🪙 Crypto·
☆
OGN
OGN
	$0.0392	+79.18%	$34.24M	—	📈 Chart
🪙 Crypto·
☆
ONDO
ONDO
	$0.4445	-4.86%	$33.56M	—	📈 Chart
🪙 Crypto·
☆
LTC
LTC
	$62.02	-6.29%	$32.45M	—	📈 Chart
🪙 Crypto·
☆
TRX
TRX
	$0.3330	-0.69%	$32.42M	—	📈 Chart
🪙 Crypto·
☆
SAND
SAND
	$0.0682	-18.73%	$31.70M	—	📈 Chart
🪙 Crypto·
☆
PEPE
PEPE
	$0.00000375	-7.63%	$30.54M	—	📈 Chart
🪙 Crypto·
☆
U
U
	$0.9997	+0.02%	$29.10M	—	📈 Chart
🪙 Crypto·
☆
AAVE
AAVE
	$164.68	-4.38%	$27.75M	—	📈 Chart
🪙 Crypto·
☆
LINK
LINK
	$12.37	-7.98%	$27.59M	—	📈 Chart
🪙 Crypto·
☆
STRK
STRK
	$0.0604	+21.86%	$26.69M	—	📈 Chart
🪙 Crypto·
☆
SPCXB
SPCXB
	$163.39	-3.55%	$25.30M	—	📈 Chart
🪙 Crypto·
☆
FDUSD
FDUSD
	$0.9978	-0.09%	$22.49M	—	📈 Chart
🪙 Crypto·
☆
XAUT
XAUT
	$4,111.03	+0.05%	$22.42M	—	📈 Chart
🪙 Crypto·
☆
XLM
XLM
	$0.1890	-5.59%	$21.79M	—	📈 Chart
🪙 Crypto·
☆
FET
FET
	$0.2150	-5.29%	$21.18M	—	📈 Chart
🪙 Crypto·
☆
HBAR
HBAR
	$0.0891	-4.59%	$21.15M	—	📈 Chart
🪙 Crypto·
☆
SNDKB
SNDKB
	$1,633.30	-4.76%	$20.86M	—	📈 Chart
🪙 Crypto·
☆
EUR
EUR
	$1.12	+0.05%	$19.56M	—	📈 Chart
🪙 Crypto·
☆
ALGO
ALGO
	$0.1181	+1.46%	$18.53M	—	📈 Chart
🪙 Crypto·
☆
ARB
ARB
	$0.1663	-10.01%	$17.98M	—	📈 Chart
🪙 Crypto·
☆
W
W
	$0.0151	+5.82%	$17.57M	—	📈 Chart
🪙 Crypto·
☆
ZRO
ZRO
	$1.96	-7.47%	$17.56M	—	📈 Chart
🪙 Crypto·
☆
FIL
FIL
	$1.00	-3.89%	$16.58M	—	📈 Chart
🪙 Crypto·
☆
ORCA
ORCA
	$2.48	-9.63%	$16.45M	—	📈 Chart
🪙 Crypto·
☆
CRCLB
CRCLB
	$79.44	-1.56%	$15.18M	—	📈 Chart
🪙 Crypto·
☆
RAY
RAY
	$2.33	-6.10%	$14.87M	—	📈 Chart
🪙 Crypto·
☆
PROM
PROM
	$5.02	-6.73%	$14.63M	—	📈 Chart
🪙 Crypto·
☆
HEMI
HEMI
	$0.00571000	-3.06%	$14.42M	—	📈 Chart
🪙 Crypto·
☆
INJ
INJ
	$6.63	-9.35%	$14.09M	—	📈 Chart
🪙 Crypto·
☆
DOT
DOT
	$1.03	-6.61%	$13.94M	—	📈 Chart
🪙 Crypto·
☆
PENGU
PENGU
	$0.00785500	-8.60%	$13.57M	—	📈 Chart
🪙 Crypto·
☆
ASTER
ASTER
	$0.6813	-5.02%	$13.54M	—	📈 Chart
🪙 Crypto·
☆
TRUMP
TRUMP
	$1.77	-4.68%	$13.53M	—	📈 Chart
🪙 Crypto·
☆
PAXG
PAXG
	$4,117.04	-0.00%	$13.08M	—	📈 Chart
🪙 Crypto·
☆
CRV
CRV
	$0.3384	-4.49%	$12.93M	—	📈 Chart
🪙 Crypto·
☆
APT
APT
	$0.7117	-5.54%	$12.61M	—	📈 Chart
🪙 Crypto·
☆
MARSCOIN
MARSCOIN
	$0.0882	-10.18%	$12.37M	—	📈 Chart
🪙 Crypto·
☆
MSTRB
MSTRB
	$149.64	-3.81%	$12.09M	—	📈 Chart
🪙 Crypto·
☆
BCH
BCH
	$281.10	-7.14%	$11.92M	—	📈 Chart
🪙 Crypto·
☆
TIA
TIA
	$0.4501	+1.26%	$11.84M	—	📈 Chart
🪙 Crypto·
☆
MINA
MINA
	$0.0794	-15.35%	$11.52M	—	📈 Chart
🪙 Crypto·
☆
币安人生
币安人生
	$0.5165	+8.17%	$11.13M	—	📈 Chart
🪙 Crypto·
☆
GRAM
GRAM
	$1.35	-5.40%	$10.84M	—	📈 Chart
🪙 Crypto·
☆
RLC
RLC
	$0.7356	+6.24%	$10.75M	—	📈 Chart
🪙 Crypto·
☆
ETHFI
ETHFI
	$0.6711	-5.37%	$10.65M	—	📈 Chart
🪙 Crypto·
☆
POL
POL
	$0.0961	-6.62%	$10.58M	—	📈 Chart
🪙 Crypto·
☆
QQQB
QQQB
	$752.77	-0.54%	$10.46M	—	📈 Chart
🪙 Crypto·
☆
DASH
DASH
	$49.81	-6.57%	$9.71M	—	📈 Chart
🪙 Crypto·
☆
OP
OP
	$0.1150	-3.93%	$9.65M	—	📈 Chart
🪙 Crypto·
☆
XPL
XPL
	$0.0830	-4.16%	$9.41M	—	📈 Chart
🪙 Crypto·
☆
ICP
ICP
	$2.95	-6.55%	$9.24M	—	📈 Chart
🪙 Crypto·
☆
ERA
ERA
	$0.0629	+3.12%	$9.16M	—	📈 Chart
🪙 Crypto·
☆
PYTH
PYTH
	$0.0736	+3.59%	$9.14M	—	📈 Chart
🪙 Crypto·
☆
MOVR
MOVR
	$1.82	-8.12%	$8.75M	—	📈 Chart
🪙 Crypto·
☆
NMR
NMR
	$13.67	-5.79%	$8.49M	—	📈 Chart
🪙 Crypto·
☆
JTO
JTO
	$0.5124	+3.27%	$8.41M	—	📈 Chart
🪙 Crypto·
☆
GTC
GTC
	$0.1825	+2.17%	$8.39M	—	📈 Chart
🪙 Crypto·
☆
ACE
ACE
	$0.1793	+6.79%	$8.15M	—	📈 Chart
🪙 Crypto·
☆
CTSI
CTSI
	$0.0330	+12.69%	$7.81M	—	📈 Chart
🪙 Crypto·
☆
MUB
MUB
	$1,063.62	-1.21%	$7.80M	—	📈 Chart
🪙 Crypto·
☆
TON
TON
	$1.60	+0.95%	$7.72M	—	📈 Chart
🪙 Crypto·
☆
AERO
AERO
	$0.7881	-1.44%	$7.44M	—	📈 Chart
🪙 Crypto·
☆
RENDER
RENDER
	$1.81	-11.16%	$7.25M	—	📈 Chart
🪙 Crypto·
☆
SKL
SKL
	$0.00489000	+11.39%	$7.21M	—	📈 Chart
🪙 Crypto·
☆
MUBARAK
MUBARAK
	$0.0714	-3.45%	$7.18M	—	📈 Chart
🪙 Crypto·
☆
VIRTUAL
VIRTUAL
	$0.6953	-9.09%	$6.93M	—	📈 Chart
🪙 Crypto·
☆
LDO
LDO
	$0.4056	-5.41%	$6.87M	—	📈 Chart
🪙 Crypto·
☆
NVDAB
NVDAB
	$235.36	-0.87%	$6.52M	—	📈 Chart
🪙 Crypto·
☆
CHIP
CHIP
	$0.0469	-6.27%	$6.48M	—	📈 Chart
🪙 Crypto·
☆
SEI
SEI
	$0.0656	-3.77%	$6.43M	—	📈 Chart
🪙 Crypto·
☆
CAKE
CAKE
	$2.12	-4.25%	$6.39M	—	📈 Chart
🪙 Crypto·
☆
牛来
牛来
	$0.0713	-4.67%	$6.25M	—	📈 Chart
🪙 Crypto·
☆
BOME
BOME
	$0.00101590	+7.62%	$6.17M	—	📈 Chart
🪙 Crypto·
☆
ATOM
ATOM
	$1.69	-0.41%	$6.13M	—	📈 Chart
🪙 Crypto·
☆
JST
JST
	$0.1394	-0.65%	$5.71M	—	📈 Chart
🪙 Crypto·
☆
PENDLE
PENDLE
	$2.09	-8.11%	$5.58M	—	📈 Chart
🪙 Crypto·
☆
SKHYB
SKHYB
	$170.73	-4.91%	$5.57M	—	📈 Chart
🪙 Crypto·
☆
BNCB
BNCB
	$5.03	-9.37%	$5.19M	—	📈 Chart
🇺🇸 Saham US·
☆
🏛️
NVDA
NVIDIA Corporation
	$235.69	-0.75%	$33.71M	$5.68T	📈 Chart
🇺🇸 Saham US·
☆
🏛️
AAPL
Apple Inc.
	$337.85	+0.35%	$7.29M	$4.93T	📈 Chart
🇺🇸 Saham US·
☆
🏛️
MSFT
Microsoft Corporation
	$530.80	+0.20%	$5.51M	$3.94T	📈 Chart
🇺🇸 Saham US·
☆
🏛️
GOOGL
Alphabet Inc.
	$348.75	-0.50%	$9.38M	$4.25T	📈 Chart
🇺🇸 Saham US·
☆
🏛️
AMZN
Amazon.com, Inc.
	$257.85	-0.80%	$9.25M	$2.78T	📈 Chart
🇺🇸 Saham US·
☆
🏛️
META
Meta Platforms, Inc.
	$719.66	-0.23%	$5.82M	$1.83T	📈 Chart
🇺🇸 Saham US·
☆
🏛️
TSLA
Tesla, Inc.
	$372.02	-1.53%	$10.45M	$1.47T	📈 Chart
🇺🇸 Saham US·
☆
🏛️
AMD
Advanced Micro Devices, Inc.
	$634.48	-1.76%	$7.13M	$1.04T	📈 Chart
🇺🇸 Saham US·
☆
🏛️
AVGO
Broadcom Inc.
	$371.26	-1.39%	$7.00M	$1.77T	📈 Chart
🇺🇸 Saham US·
☆
🏛️
NFLX
Netflix, Inc.
	$71.08	+1.98%	$13.16M	$295.97B	📈 Chart
🇺🇸 Saham US·
☆
🏛️
JPM
JP Morgan Chase & Co.
	$326.56	-0.92%	$2.78M	$868.06B	📈 Chart
🇺🇸 Saham US·
☆
🏛️
V
Visa Inc.
	$375.40	+0.89%	$1.21M	$700.89B	📈 Chart
🇺🇸 Saham US·
☆
🏛️
XOM
ExxonMobil Holdings Corporation
	$168.80	+2.90%	$3.86M	$694.09B	📈 Chart
🇺🇸 Saham US·
☆
🏛️
COST
Costco Wholesale Corporation
	$949.67	+0.79%	$538.66K	$420.96B	📈 Chart
🇺🇸 Saham US·
☆
🏛️
UNH
UnitedHealth Group Incorporated
	$371.86	-1.10%	$1.27M	$333.78B	📈 Chart
🇺🇸 Saham US·
☆
🏛️
PLTR
Palantir Technologies Inc.
	$198.82	+2.42%	$26.22M	$477.77B	📈 Chart
🇺🇸 Saham US·
☆
🏛️
INTC
Intel Corporation
	$109.22	-3.45%	$41.01M	$577.35B	📈 Chart
🇺🇸 Saham US·
☆
🏛️
DIS
Walt Disney Company (The)
	$105.58	+0.79%	$1.40M	$182.30B	📈 Chart
🇺🇸 Saham US·
☆
🏛️
BA
Boeing Company (The)
	$185.36	-1.57%	$2.94M	$146.50B	📈 Chart
💱 Forex·
☆
💱
EURUSD
EURO / U.S. DOLLAR
	$1.12	-0.05%	$0.00	—	📈 Chart
💱 Forex·
☆
💱
USDJPY
U.S. DOLLAR / JAPANESE YEN
	$158.34	+0.19%	$0.00	—	📈 Chart
💱 Forex·
☆
💱
GBPUSD
BRITISH POUND / U.S. DOLLAR
	$1.32	-0.03%	$0.00	—	📈 Chart
💱 Forex·
☆
💱
AUDUSD
AUSTRALIAN DOLLAR / U.S. DOLLAR
	$0.6946	-0.20%	$0.00	—	📈 Chart
💱 Forex·
☆
💱
USDCAD
U.S. DOLLAR / CANADIAN DOLLAR
	$1.42	-0.05%	$0.00	—	📈 Chart
💱 Forex·
☆
💱
USDCHF
U.S. DOLLAR / SWISS FRANC
	$0.8334	+0.08%	$0.00	—	📈 Chart
💱 Forex·
☆
💱
NZDUSD
NEW ZEALAND DOLLAR / U.S. DOLLAR
	$0.5592	-0.11%	$0.00	—	📈 Chart
💱 Forex·
☆
💱
USDCNH
U.S. DOLLAR / OFFSHORE CHINESE YUAN
	$6.71	+0.03%	$0.00	—	📈 Chart
💱 Forex·
☆
💱
USDIDR
U.S. DOLLAR / INDONESIAN RUPIAH
	$17,885.00	+0.06%	$0.00	—	📈 Chart
💱 Forex·
☆
💱
USDSGD
U.S. DOLLAR / SINGAPORE DOLLAR
	$1.28	+0.21%	$0.00	—	📈 Chart
🛢️ Komoditas·
☆
🛢️
GOLD
Gold
	$4,111.58	+0.02%	$0.00	—	📈 Chart
🛢️ Komoditas·
☆
🛢️
SILVER
Silver
	$58.73	-1.77%	$0.00	—	📈 Chart
🛢️ Komoditas·
☆
🛢️
DXY
U.S. Dollar Currency Index
	$102.33	+0.08%	—	—	📈 Chart
🛢️ Komoditas·
☆
🛢️
PLATINUM
Platinum
	$1,627.60	-0.37%	$0.00	—	📈 Chart
Trending & Topik
Paling dicari dan paling diliput hari ini
1
☆
SIMD
Super Intelligent Identity
$0.0214
+19.79%
2
☆
DRV
Derive
$0.4123
+11.44%
3
☆
QTC
Quantus
$168.50
+65.67%
4
☆
BTC
Bitcoin
$81,207.90
-2.51%
5
☆
NEAR
NEAR Protocol
$4.69
-7.05%
6
☆
PRL
Pearl
$1.42
+5.61%
7
☆
TRUMP
Official Trump
$1.78
-3.89%
8
☆
PENGU
Pudgy Penguins
$0.00791553
-7.27%
Jumlah berita per topik dari Live News Wire (bukan media sosial)
Belum ada berita yang bisa dikelompokkan.
Sumber data: Binance Vision (tabel koin, top gainers, grafik BTC) · CoinGecko (market cap global, dominasi, trending) · Hyperliquid (open interest & funding) · TradingView (saham US, forex, komoditas) · alternative.me (Fear & Greed).
Tidak ditampilkan: ETF Flows, Likuidasi 24 Jam, Community Posts, dan Altcoin Season Index (belum ada sumber data publik gratis, jadi panelnya dikosongkan daripada diisi angka perkiraan).
Catatan grafik: grafik market cap menampilkan kapitalisasi pasar BTC, bukan seluruh pasar kripto. Tidak ada sumber gratis yang menyediakan seri total market cap.
🛡️ FEED HEALTH: 🟡 DEGRADED
IDX BEI: 🟢 850 STOCKS
Binance WS: 🟢 CONNECTED
Macro Bundle: 🔴 STALE (999m)
Gemini LLM: 🟢 3.8-FLASH
MCP Server: 🟢 READY
AUDIT PROVENANCE & FRESHNESS ↗
DISCLAIMER: Algorithmic screening & quantitative intelligence only. Bukan ajakan atau nasihat investasi.
MBG QUANT TERMINAL // MARKET BRAIN GRID · ZERO RUNTIME COST"
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - button "MBG QUANT Market Terminal" [ref=e5] [cursor=pointer]:
      - generic [ref=e13]:
        - generic [ref=e14]: MBG QUANT
        - generic [ref=e15]: Market Terminal
    - generic [ref=e17]:
      - button "Home" [ref=e19] [cursor=pointer]
      - button "Trade ▼" [ref=e21] [cursor=pointer]:
        - text: Trade
        - generic [ref=e22]: ▼
      - button "Markets ▼" [ref=e24] [cursor=pointer]:
        - text: Markets
        - generic [ref=e25]: ▼
      - button "Research & Learn ▼" [ref=e27] [cursor=pointer]:
        - text: Research & Learn
        - generic [ref=e28]: ▼
      - button "Account ▼" [ref=e30] [cursor=pointer]:
        - text: Account
        - generic [ref=e31]: ▼
    - generic [ref=e32]:
      - button "🔍 Cari" [ref=e33] [cursor=pointer]:
        - text: 🔍
        - generic [ref=e34]: Cari
      - button "★" [ref=e35] [cursor=pointer]
      - button "☀️" [ref=e36] [cursor=pointer]
      - button "⭐ PRO" [ref=e37] [cursor=pointer]:
        - generic [ref=e38]: ⭐
        - generic [ref=e39]: PRO
  - generic [ref=e40]:
    - banner [ref=e41]:
      - generic [ref=e42]:
        - generic [ref=e43]: 🏠 Market Overview
        - button "⚡ MODE PRO" [ref=e46] [cursor=pointer]:
          - generic [ref=e47]: ⚡
          - generic [ref=e48]: MODE PRO
      - generic "Buka Global Command Palette (Tekan Ctrl + K)" [ref=e49] [cursor=pointer]:
        - generic [ref=e50]: 🔍
        - generic [ref=e51]: Cari saham, crypto...
        - generic [ref=e52]: Ctrl K
      - generic [ref=e53]:
        - generic "Status Bursa Dunia Realtime (Klik untuk modul Pasar Global)" [ref=e54] [cursor=pointer]:
          - generic [ref=e55]: BURSA
          - generic [ref=e57]:
            - generic [ref=e58]: 🇮🇩
            - generic [ref=e59]: JKT
            - generic [ref=e60]: 22:57
            - 'generic "IDX: TUTUP" [ref=e61]'
          - generic [ref=e62]: ·
          - generic [ref=e63]:
            - generic [ref=e64]: 🇯🇵
            - generic [ref=e65]: TYO
            - generic [ref=e66]: 00:57
            - 'generic "TSE: TUTUP" [ref=e67]'
          - generic [ref=e68]: ·
          - generic [ref=e69]:
            - generic [ref=e70]: 🇬🇧
            - generic [ref=e71]: LON
            - generic [ref=e72]: 16:57
            - 'generic "LSE: TUTUP" [ref=e73]'
          - generic [ref=e74]: ·
          - generic [ref=e75]:
            - generic [ref=e76]: 🇺🇸
            - generic [ref=e77]: NYC
            - generic [ref=e78]: 11:57
            - 'generic "NYSE: BUKA" [ref=e79]'
        - generic "Waktu Jakarta (WIB)" [ref=e80]:
          - generic [ref=e81]: 🕒
          - generic [ref=e82]: 22.57.13 WIB
        - button "🛡️ SENTINEL" [ref=e83] [cursor=pointer]:
          - generic [ref=e84]: 🛡️
          - generic [ref=e85]: SENTINEL
        - button "💰 LOT CALC" [ref=e86] [cursor=pointer]:
          - generic [ref=e87]: 💰
          - generic [ref=e88]: LOT CALC
        - button "🔄" [ref=e89] [cursor=pointer]
        - button "☀️ LIGHT" [ref=e90] [cursor=pointer]:
          - generic [ref=e91]: ☀️
          - generic [ref=e92]: LIGHT
    - main [ref=e93]:
      - generic [ref=e94]:
        - generic [ref=e95]:
          - generic [ref=e96]:
            - heading "Market Overview" [level=2] [ref=e97]
            - generic [ref=e98]: LIVE
            - generic [ref=e100]: diperbarui 22.57.11
          - button "↻ Segarkan" [ref=e101] [cursor=pointer]
        - generic [ref=e102]:
          - button "BTC BTC 7d $81,075.25 -2.80% 7 day price trend" [ref=e103] [cursor=pointer]:
            - generic [ref=e104]:
              - generic "Bitcoin (BTC)" [ref=e105]:
                - img "BTC" [ref=e106]
              - generic [ref=e107]: BTC
              - generic [ref=e108]: 7d
            - generic [ref=e109]:
              - generic [ref=e110]:
                - generic [ref=e111]: $81,075.25
                - generic [ref=e112]: "-2.80%"
              - img "7 day price trend" [ref=e113]
          - button "ETH ETH 7d $2,433.96 -5.29% 7 day price trend" [ref=e116] [cursor=pointer]:
            - generic [ref=e117]:
              - generic "Ethereum (ETH)" [ref=e118]:
                - img "ETH" [ref=e119]
              - generic [ref=e120]: ETH
              - generic [ref=e121]: 7d
            - generic [ref=e122]:
              - generic [ref=e123]:
                - generic [ref=e124]: $2,433.96
                - generic [ref=e125]: "-5.29%"
              - img "7 day price trend" [ref=e126]
          - button "BNB BNB 7d $732.06 -4.95% 7 day price trend" [ref=e129] [cursor=pointer]:
            - generic [ref=e130]:
              - generic "BNB (BNB)" [ref=e131]:
                - img "BNB" [ref=e132]
              - generic [ref=e133]: BNB
              - generic [ref=e134]: 7d
            - generic [ref=e135]:
              - generic [ref=e136]:
                - generic [ref=e137]: $732.06
                - generic [ref=e138]: "-4.95%"
              - img "7 day price trend" [ref=e139]
          - button "SOL SOL 7d $108.69 -6.94% 7 day price trend" [ref=e142] [cursor=pointer]:
            - generic [ref=e143]:
              - generic "Solana (SOL)" [ref=e144]:
                - img "SOL" [ref=e145]
              - generic [ref=e146]: SOL
              - generic [ref=e147]: 7d
            - generic [ref=e148]:
              - generic [ref=e149]:
                - generic [ref=e150]: $108.69
                - generic [ref=e151]: "-6.94%"
              - img "7 day price trend" [ref=e152]
          - button "XRP XRP 7d $1.35 -6.20% 7 day price trend" [ref=e155] [cursor=pointer]:
            - generic [ref=e156]:
              - generic "XRP (XRP)" [ref=e157]:
                - img "XRP" [ref=e158]
              - generic [ref=e159]: XRP
              - generic [ref=e160]: 7d
            - generic [ref=e161]:
              - generic [ref=e162]:
                - generic [ref=e163]: $1.35
                - generic [ref=e164]: "-6.20%"
              - img "7 day price trend" [ref=e165]
        - generic [ref=e168]:
          - generic [ref=e169]:
            - generic [ref=e171]:
              - heading "Market Status" [level=3] [ref=e172]
              - generic [ref=e173]: Status sesi bursa saat ini (waktu Jakarta)
            - generic [ref=e174]:
              - generic [ref=e175]:
                - generic [ref=e177]:
                  - generic [ref=e178]: Bursa Efek Indonesia
                  - generic [ref=e179]: Besok 09:00 WIB
                - generic [ref=e180]: TUTUP
              - generic [ref=e181]:
                - generic [ref=e183]:
                  - generic [ref=e184]: New York Stock Exchange
                  - generic [ref=e185]: Tutup 16:00 ET
                - generic [ref=e186]: BUKA
              - generic [ref=e187]:
                - generic [ref=e189]:
                  - generic [ref=e190]: London Stock Exchange
                  - generic [ref=e191]: Besok 08:00 GMT
                - generic [ref=e192]: TUTUP
              - generic [ref=e193]:
                - generic [ref=e195]:
                  - generic [ref=e196]: Tokyo Stock Exchange
                  - generic [ref=e197]: Buka 09:00 JST
                - generic [ref=e198]: TUTUP
              - generic [ref=e199]:
                - generic [ref=e201]:
                  - generic [ref=e202]: Crypto (24/7)
                  - generic [ref=e203]: Perdagangan tanpa henti
                - generic [ref=e204]: BUKA
            - generic [ref=e205]:
              - generic [ref=e206]:
                - generic [ref=e207]: Fear & Greed
                - generic [ref=e208]:
                  - img "Fear and Greed index 64" [ref=e209]
                  - generic [ref=e216]:
                    - generic [ref=e217]: "64"
                    - generic [ref=e218]: Greed
                - generic [ref=e219]: "Sumber: alternative.me"
              - generic [ref=e220]:
                - generic "Total kapitalisasi pasar seluruh aset kripto, 24 jam" [ref=e221]:
                  - generic [ref=e222]: Market Cap
                  - generic [ref=e223]: $2.76T
                  - generic [ref=e224]: "-5.25%"
                - generic [ref=e225]:
                  - generic [ref=e226]: Volume (24h)
                  - generic [ref=e227]: $108.31B
                - generic [ref=e228]:
                  - generic [ref=e229]: Koin Aktif
                  - generic [ref=e230]: "22.086"
              - generic [ref=e231]:
                - generic [ref=e232]:
                  - generic [ref=e233]:
                    - generic [ref=e234]: Altcoin Season
                    - strong [ref=e235]: —
                  - generic [ref=e236]:
                    - 'generic "Altcoin Season Index: 0" [ref=e241]'
                    - generic [ref=e242]:
                      - generic [ref=e243]: Bitcoin Season
                      - generic [ref=e244]: Altcoin Season
                - generic [ref=e245]:
                  - generic [ref=e246]: Dominasi
                  - generic [ref=e247]:
                    - generic [ref=e248]:
                      - 'generic "Bitcoin: 59.08%" [ref=e249]'
                      - 'generic "Ethereum: 10.83%" [ref=e250]'
                      - 'generic "Others: 30.09%" [ref=e251]'
                    - generic [ref=e252]:
                      - generic [ref=e253]:
                        - generic [ref=e255]: Bitcoin
                        - strong [ref=e256]: 59.1%
                      - generic [ref=e257]:
                        - generic [ref=e259]: Ethereum
                        - strong [ref=e260]: 10.8%
                      - generic [ref=e261]:
                        - generic [ref=e263]: Others
                        - strong [ref=e264]: 30.1%
          - generic [ref=e265]:
            - generic [ref=e267]:
              - heading "Watchlist Saya" [level=3] [ref=e268]
              - generic [ref=e269]: Belum ada instrumen
            - generic [ref=e270]:
              - generic [ref=e271]: ☆
              - generic [ref=e272]: Klik ikon bintang di tabel koin untuk menambahkan instrumen ke sini.
        - generic [ref=e273]:
          - generic [ref=e274]:
            - generic [ref=e275]:
              - generic [ref=e276]:
                - heading "Kapitalisasi Pasar BTC" [level=3] [ref=e277]
                - generic [ref=e278]: 30 hari terakhir, dihitung dari harga BTC dan supply beredar
              - generic [ref=e279]:
                - generic [ref=e280]:
                  - button "overview" [ref=e281] [cursor=pointer]
                  - button "breakdown" [ref=e282] [cursor=pointer]
                - generic [ref=e283]:
                  - button "7d" [ref=e284] [cursor=pointer]
                  - button "30d" [ref=e285] [cursor=pointer]
                  - button "90d" [ref=e286] [cursor=pointer]
            - generic [ref=e287]:
              - generic [ref=e288]:
                - generic [ref=e289]: Market Cap
                - generic [ref=e290]: $1.60T
                - generic [ref=e291]: "-5.25%"
              - generic [ref=e292]:
                - generic [ref=e293]: Volume (24h)
                - generic [ref=e294]: $1.21B
            - generic [ref=e295]:
              - generic [ref=e296]:
                - generic:
                  - generic: $1.71T
                  - generic: $1.64T
                  - generic: $1.57T
                  - generic: $1.50T
                - img "Kapitalisasi pasar Bitcoin sepanjang waktu" [ref=e297]
              - generic [ref=e300]:
                - generic [ref=e301]: 9 Sep
                - generic [ref=e302]: 8 Okt
          - generic [ref=e303]:
            - generic [ref=e305]:
              - heading "Derivatives" [level=3] [ref=e306]
              - generic [ref=e307]: "Sumber: Hyperliquid"
            - generic [ref=e308]:
              - generic [ref=e309]:
                - generic [ref=e310]: Open Interest
                - generic [ref=e311]: $11.62B
              - generic [ref=e312]:
                - generic [ref=e313]: Volume (24h)
                - generic [ref=e314]: $7.63B
              - generic [ref=e315]:
                - generic [ref=e316]: Open Interest Terbesar
                - generic [ref=e317]:
                  - generic [ref=e318]: BTC
                  - generic [ref=e319]: $3.19B
                  - generic [ref=e320]: 0.0011%
                - generic [ref=e321]:
                  - generic [ref=e322]: ETH
                  - generic [ref=e323]: $2.77B
                  - generic [ref=e324]: "-0.0008%"
                - generic [ref=e325]:
                  - generic [ref=e326]: HYPE
                  - generic [ref=e327]: $1.65B
                  - generic [ref=e328]: 0.0013%
                - generic [ref=e329]:
                  - generic [ref=e330]: SOL
                  - generic [ref=e331]: $612.61M
                  - generic [ref=e332]: "-0.0008%"
                - generic [ref=e333]:
                  - generic [ref=e334]: ZEC
                  - generic [ref=e335]: $509.37M
                  - generic [ref=e336]: 0.0013%
        - generic [ref=e337]:
          - generic [ref=e338]:
            - generic [ref=e339]:
              - generic [ref=e340]:
                - heading "Semua Aset" [level=3] [ref=e341]
                - generic [ref=e342]: Crypto, saham US, forex dan komoditas dalam satu tabel
              - textbox "Cari aset..." [ref=e343]
            - generic [ref=e344]:
              - button "Semua (133)" [ref=e345] [cursor=pointer]
              - button "🪙 Crypto (100)" [ref=e346] [cursor=pointer]
              - button "🇺🇸 Saham US (19)" [ref=e347] [cursor=pointer]
              - button "💱 Forex (10)" [ref=e348] [cursor=pointer]
              - button "🛢️ Komoditas (4)" [ref=e349] [cursor=pointer]
            - table [ref=e351]:
              - rowgroup [ref=e352]:
                - row [ref=e353]:
                  - columnheader "Pasar" [ref=e354]
                  - columnheader "Nama" [ref=e355]
                  - columnheader "Harga" [ref=e356]
                  - columnheader "24j %" [ref=e357]
                  - columnheader "Volume" [ref=e358]
                  - columnheader "Market Cap" [ref=e359]
                  - columnheader "Aksi" [ref=e360]
              - rowgroup [ref=e361]:
                - button [ref=e362] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e363]
                  - cell "Tambah USDC ke watchlist USDC USDC USDC" [ref=e364]:
                    - generic [ref=e365]:
                      - button "Tambah USDC ke watchlist" [ref=e366]: ☆
                      - generic "USDC (USDC)" [ref=e367]:
                        - img "USDC" [ref=e368]
                      - generic [ref=e369]: USDC
                      - generic [ref=e370]: USDC
                  - cell "$1.00" [ref=e371]
                  - cell "+0.03%" [ref=e372]
                  - cell "$5.11B" [ref=e373]
                  - cell "—" [ref=e374]
                  - cell [ref=e375]:
                    - button "📈 Chart" [ref=e376]
                - button [ref=e377] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e378]
                  - cell "Tambah BTC ke watchlist BTC BTC BTC" [ref=e379]:
                    - generic [ref=e380]:
                      - button "Tambah BTC ke watchlist" [ref=e381]: ☆
                      - generic "Bitcoin (BTC)" [ref=e382]:
                        - img "BTC" [ref=e383]
                      - generic [ref=e384]: BTC
                      - generic [ref=e385]: BTC
                  - cell "$81,075.25" [ref=e386]
                  - cell "-2.80%" [ref=e387]
                  - cell "$1.51B" [ref=e388]
                  - cell "—" [ref=e389]
                  - cell [ref=e390]:
                    - button "📈 Chart" [ref=e391]
                - button [ref=e392] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e393]
                  - cell "Tambah ETH ke watchlist ETH ETH ETH" [ref=e394]:
                    - generic [ref=e395]:
                      - button "Tambah ETH ke watchlist" [ref=e396]: ☆
                      - generic "Ethereum (ETH)" [ref=e397]:
                        - img "ETH" [ref=e398]
                      - generic [ref=e399]: ETH
                      - generic [ref=e400]: ETH
                  - cell "$2,433.96" [ref=e401]
                  - cell "-5.29%" [ref=e402]
                  - cell "$930.32M" [ref=e403]
                  - cell "—" [ref=e404]
                  - cell [ref=e405]:
                    - button "📈 Chart" [ref=e406]
                - button [ref=e407] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e408]
                  - cell "Tambah SOL ke watchlist SOL SOL SOL" [ref=e409]:
                    - generic [ref=e410]:
                      - button "Tambah SOL ke watchlist" [ref=e411]: ☆
                      - generic "Solana (SOL)" [ref=e412]:
                        - img "SOL" [ref=e413]
                      - generic [ref=e414]: SOL
                      - generic [ref=e415]: SOL
                  - cell "$108.69" [ref=e416]
                  - cell "-6.94%" [ref=e417]
                  - cell "$294.64M" [ref=e418]
                  - cell "—" [ref=e419]
                  - cell [ref=e420]:
                    - button "📈 Chart" [ref=e421]
                - button [ref=e422] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e423]
                  - cell "Tambah NEAR ke watchlist NEAR NEAR NEAR" [ref=e424]:
                    - generic [ref=e425]:
                      - button "Tambah NEAR ke watchlist" [ref=e426]: ☆
                      - generic "NEAR Protocol (NEAR)" [ref=e427]:
                        - img "NEAR" [ref=e428]
                      - generic [ref=e429]: NEAR
                      - generic [ref=e430]: NEAR
                  - cell "$4.67" [ref=e431]
                  - cell "-7.53%" [ref=e432]
                  - cell "$278.01M" [ref=e433]
                  - cell "—" [ref=e434]
                  - cell [ref=e435]:
                    - button "📈 Chart" [ref=e436]
                - button [ref=e437] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e438]
                  - cell "Tambah ZEC ke watchlist ZEC ZEC ZEC" [ref=e439]:
                    - generic [ref=e440]:
                      - button "Tambah ZEC ke watchlist" [ref=e441]: ☆
                      - generic "ZEC (ZEC)" [ref=e442]:
                        - img "ZEC" [ref=e443]
                      - generic [ref=e444]: ZEC
                      - generic [ref=e445]: ZEC
                  - cell "$1,122.43" [ref=e446]
                  - cell "-15.55%" [ref=e447]
                  - cell "$265.60M" [ref=e448]
                  - cell "—" [ref=e449]
                  - cell [ref=e450]:
                    - button "📈 Chart" [ref=e451]
                - button [ref=e452] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e453]
                  - cell "Tambah USD1 ke watchlist USD1 USD1 USD1" [ref=e454]:
                    - generic [ref=e455]:
                      - button "Tambah USD1 ke watchlist" [ref=e456]: ☆
                      - generic "USD1 (USD1)" [ref=e457]:
                        - img "USD1" [ref=e458]
                      - generic [ref=e459]: USD1
                      - generic [ref=e460]: USD1
                  - cell "$0.9996" [ref=e461]
                  - cell "-0.01%" [ref=e462]
                  - cell "$237.13M" [ref=e463]
                  - cell "—" [ref=e464]
                  - cell [ref=e465]:
                    - button "📈 Chart" [ref=e466]
                - button [ref=e467] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e468]
                  - cell "Tambah XRP ke watchlist XRP XRP XRP" [ref=e469]:
                    - generic [ref=e470]:
                      - button "Tambah XRP ke watchlist" [ref=e471]: ☆
                      - generic "XRP (XRP)" [ref=e472]:
                        - img "XRP" [ref=e473]
                      - generic [ref=e474]: XRP
                      - generic [ref=e475]: XRP
                  - cell "$1.35" [ref=e476]
                  - cell "-6.20%" [ref=e477]
                  - cell "$220.79M" [ref=e478]
                  - cell "—" [ref=e479]
                  - cell [ref=e480]:
                    - button "📈 Chart" [ref=e481]
                - button [ref=e482] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e483]
                  - cell "Tambah DOGE ke watchlist DOGE DOGE DOGE" [ref=e484]:
                    - generic [ref=e485]:
                      - button "Tambah DOGE ke watchlist" [ref=e486]: ☆
                      - generic "Dogecoin (DOGE)" [ref=e487]:
                        - img "DOGE" [ref=e488]
                      - generic [ref=e489]: DOGE
                      - generic [ref=e490]: DOGE
                  - cell "$0.0826" [ref=e491]
                  - cell "-7.04%" [ref=e492]
                  - cell "$104.78M" [ref=e493]
                  - cell "—" [ref=e494]
                  - cell [ref=e495]:
                    - button "📈 Chart" [ref=e496]
                - button [ref=e497] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e498]
                  - cell "Tambah BNB ke watchlist BNB BNB BNB" [ref=e499]:
                    - generic [ref=e500]:
                      - button "Tambah BNB ke watchlist" [ref=e501]: ☆
                      - generic "BNB (BNB)" [ref=e502]:
                        - img "BNB" [ref=e503]
                      - generic [ref=e504]: BNB
                      - generic [ref=e505]: BNB
                  - cell "$732.06" [ref=e506]
                  - cell "-4.95%" [ref=e507]
                  - cell "$101.35M" [ref=e508]
                  - cell "—" [ref=e509]
                  - cell [ref=e510]:
                    - button "📈 Chart" [ref=e511]
                - button [ref=e512] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e513]
                  - cell "Tambah SUI ke watchlist SUI SUI SUI" [ref=e514]:
                    - generic [ref=e515]:
                      - button "Tambah SUI ke watchlist" [ref=e516]: ☆
                      - generic "Sui (SUI)" [ref=e517]:
                        - img "SUI" [ref=e518]
                      - generic [ref=e519]: SUI
                      - generic [ref=e520]: SUI
                  - cell "$1.03" [ref=e521]
                  - cell "-8.87%" [ref=e522]
                  - cell "$89.17M" [ref=e523]
                  - cell "—" [ref=e524]
                  - cell [ref=e525]:
                    - button "📈 Chart" [ref=e526]
                - button [ref=e527] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e528]
                  - cell "Tambah RLUSD ke watchlist RL RLUSD RLUSD" [ref=e529]:
                    - generic [ref=e530]:
                      - button "Tambah RLUSD ke watchlist" [ref=e531]: ☆
                      - generic "RL (RL)" [ref=e532]: RL
                      - generic [ref=e534]: RLUSD
                      - generic [ref=e535]: RLUSD
                  - cell "$1.00" [ref=e536]
                  - cell "+0.02%" [ref=e537]
                  - cell "$81.10M" [ref=e538]
                  - cell "—" [ref=e539]
                  - cell [ref=e540]:
                    - button "📈 Chart" [ref=e541]
                - button [ref=e542] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e543]
                  - cell "Tambah UNI ke watchlist UNI UNI UNI" [ref=e544]:
                    - generic [ref=e545]:
                      - button "Tambah UNI ke watchlist" [ref=e546]: ☆
                      - generic "Uniswap (UNI)" [ref=e547]:
                        - img "UNI" [ref=e548]
                      - generic [ref=e549]: UNI
                      - generic [ref=e550]: UNI
                  - cell "$7.34" [ref=e551]
                  - cell "-6.55%" [ref=e552]
                  - cell "$74.57M" [ref=e553]
                  - cell "—" [ref=e554]
                  - cell [ref=e555]:
                    - button "📈 Chart" [ref=e556]
                - button [ref=e557] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e558]
                  - cell "Tambah PUMP ke watchlist PUMP PUMP PUMP" [ref=e559]:
                    - generic [ref=e560]:
                      - button "Tambah PUMP ke watchlist" [ref=e561]: ☆
                      - generic "PUMP (PUMP)" [ref=e562]:
                        - img "PUMP" [ref=e563]
                      - generic [ref=e564]: PUMP
                      - generic [ref=e565]: PUMP
                  - cell "$0.00548800" [ref=e566]
                  - cell "-12.65%" [ref=e567]
                  - cell "$65.37M" [ref=e568]
                  - cell "—" [ref=e569]
                  - cell [ref=e570]:
                    - button "📈 Chart" [ref=e571]
                - button [ref=e572] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e573]
                  - cell "Tambah AVAX ke watchlist AVAX AVAX AVAX" [ref=e574]:
                    - generic [ref=e575]:
                      - button "Tambah AVAX ke watchlist" [ref=e576]: ☆
                      - generic "Avalanche (AVAX)" [ref=e577]:
                        - img "AVAX" [ref=e578]
                      - generic [ref=e579]: AVAX
                      - generic [ref=e580]: AVAX
                  - cell "$10.00" [ref=e581]
                  - cell "-11.07%" [ref=e582]
                  - cell "$64.10M" [ref=e583]
                  - cell "—" [ref=e584]
                  - cell [ref=e585]:
                    - button "📈 Chart" [ref=e586]
                - button [ref=e587] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e588]
                  - cell "Tambah MET ke watchlist MET MET MET" [ref=e589]:
                    - generic [ref=e590]:
                      - button "Tambah MET ke watchlist" [ref=e591]: ☆
                      - generic "MET (MET)" [ref=e592]:
                        - img "MET" [ref=e593]
                      - generic [ref=e594]: MET
                      - generic [ref=e595]: MET
                  - cell "$0.4351" [ref=e596]
                  - cell "+31.05%" [ref=e597]
                  - cell "$54.37M" [ref=e598]
                  - cell "—" [ref=e599]
                  - cell [ref=e600]:
                    - button "📈 Chart" [ref=e601]
                - button [ref=e602] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e603]
                  - cell "Tambah ADA ke watchlist ADA ADA ADA" [ref=e604]:
                    - generic [ref=e605]:
                      - button "Tambah ADA ke watchlist" [ref=e606]: ☆
                      - generic "Cardano (ADA)" [ref=e607]:
                        - img "ADA" [ref=e608]
                      - generic [ref=e609]: ADA
                      - generic [ref=e610]: ADA
                  - cell "$0.2313" [ref=e611]
                  - cell "-9.82%" [ref=e612]
                  - cell "$50.54M" [ref=e613]
                  - cell "—" [ref=e614]
                  - cell [ref=e615]:
                    - button "📈 Chart" [ref=e616]
                - button [ref=e617] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e618]
                  - cell "Tambah ENA ke watchlist ENA ENA ENA" [ref=e619]:
                    - generic [ref=e620]:
                      - button "Tambah ENA ke watchlist" [ref=e621]: ☆
                      - generic "Ethena (ENA)" [ref=e622]:
                        - img "ENA" [ref=e623]
                      - generic [ref=e624]: ENA
                      - generic [ref=e625]: ENA
                  - cell "$0.2053" [ref=e626]
                  - cell "-10.23%" [ref=e627]
                  - cell "$44.98M" [ref=e628]
                  - cell "—" [ref=e629]
                  - cell [ref=e630]:
                    - button "📈 Chart" [ref=e631]
                - button [ref=e632] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e633]
                  - cell "Tambah WLD ke watchlist WLD WLD WLD" [ref=e634]:
                    - generic [ref=e635]:
                      - button "Tambah WLD ke watchlist" [ref=e636]: ☆
                      - generic "Worldcoin (WLD)" [ref=e637]:
                        - img "WLD" [ref=e638]
                      - generic [ref=e639]: WLD
                      - generic [ref=e640]: WLD
                  - cell "$0.4768" [ref=e641]
                  - cell "-8.13%" [ref=e642]
                  - cell "$42.17M" [ref=e643]
                  - cell "—" [ref=e644]
                  - cell [ref=e645]:
                    - button "📈 Chart" [ref=e646]
                - button [ref=e647] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e648]
                  - cell "Tambah HYPE ke watchlist HYPE HYPE HYPE" [ref=e649]:
                    - generic [ref=e650]:
                      - button "Tambah HYPE ke watchlist" [ref=e651]: ☆
                      - generic "HYPE (HYPE)" [ref=e652]:
                        - img "HYPE" [ref=e653]
                      - generic [ref=e654]: HYPE
                      - generic [ref=e655]: HYPE
                  - cell "$83.40" [ref=e656]
                  - cell "-5.89%" [ref=e657]
                  - cell "$38.48M" [ref=e658]
                  - cell "—" [ref=e659]
                  - cell [ref=e660]:
                    - button "📈 Chart" [ref=e661]
                - button [ref=e662] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e663]
                  - cell "Tambah TAO ke watchlist TAO TAO TAO" [ref=e664]:
                    - generic [ref=e665]:
                      - button "Tambah TAO ke watchlist" [ref=e666]: ☆
                      - generic "Bittensor (TAO)" [ref=e667]:
                        - img "TAO" [ref=e668]
                      - generic [ref=e669]: TAO
                      - generic [ref=e670]: TAO
                  - cell "$263.60" [ref=e671]
                  - cell "-9.17%" [ref=e672]
                  - cell "$37.99M" [ref=e673]
                  - cell "—" [ref=e674]
                  - cell [ref=e675]:
                    - button "📈 Chart" [ref=e676]
                - button [ref=e677] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e678]
                  - cell "Tambah QNT ke watchlist QNT QNT QNT" [ref=e679]:
                    - generic [ref=e680]:
                      - button "Tambah QNT ke watchlist" [ref=e681]: ☆
                      - generic "QNT (QNT)" [ref=e682]:
                        - img "QNT" [ref=e683]
                      - generic [ref=e684]: QNT
                      - generic [ref=e685]: QNT
                  - cell "$229.53" [ref=e686]
                  - cell "-5.32%" [ref=e687]
                  - cell "$35.05M" [ref=e688]
                  - cell "—" [ref=e689]
                  - cell [ref=e690]:
                    - button "📈 Chart" [ref=e691]
                - button [ref=e692] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e693]
                  - cell "Tambah OGN ke watchlist OGN OGN OGN" [ref=e694]:
                    - generic [ref=e695]:
                      - button "Tambah OGN ke watchlist" [ref=e696]: ☆
                      - generic "OGN (OGN)" [ref=e697]:
                        - img "OGN" [ref=e698]
                      - generic [ref=e699]: OGN
                      - generic [ref=e700]: OGN
                  - cell "$0.0392" [ref=e701]
                  - cell "+79.18%" [ref=e702]
                  - cell "$34.24M" [ref=e703]
                  - cell "—" [ref=e704]
                  - cell [ref=e705]:
                    - button "📈 Chart" [ref=e706]
                - button [ref=e707] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e708]
                  - cell "Tambah ONDO ke watchlist ONDO ONDO ONDO" [ref=e709]:
                    - generic [ref=e710]:
                      - button "Tambah ONDO ke watchlist" [ref=e711]: ☆
                      - generic "Ondo (ONDO)" [ref=e712]:
                        - img "ONDO" [ref=e713]
                      - generic [ref=e714]: ONDO
                      - generic [ref=e715]: ONDO
                  - cell "$0.4445" [ref=e716]
                  - cell "-4.86%" [ref=e717]
                  - cell "$33.56M" [ref=e718]
                  - cell "—" [ref=e719]
                  - cell [ref=e720]:
                    - button "📈 Chart" [ref=e721]
                - button [ref=e722] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e723]
                  - cell "Tambah LTC ke watchlist LTC LTC LTC" [ref=e724]:
                    - generic [ref=e725]:
                      - button "Tambah LTC ke watchlist" [ref=e726]: ☆
                      - generic "LTC (LTC)" [ref=e727]:
                        - img "LTC" [ref=e728]
                      - generic [ref=e729]: LTC
                      - generic [ref=e730]: LTC
                  - cell "$62.02" [ref=e731]
                  - cell "-6.29%" [ref=e732]
                  - cell "$32.45M" [ref=e733]
                  - cell "—" [ref=e734]
                  - cell [ref=e735]:
                    - button "📈 Chart" [ref=e736]
                - button [ref=e737] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e738]
                  - cell "Tambah TRX ke watchlist TRX TRX TRX" [ref=e739]:
                    - generic [ref=e740]:
                      - button "Tambah TRX ke watchlist" [ref=e741]: ☆
                      - generic "TRON (TRX)" [ref=e742]:
                        - img "TRX" [ref=e743]
                      - generic [ref=e744]: TRX
                      - generic [ref=e745]: TRX
                  - cell "$0.3330" [ref=e746]
                  - cell "-0.69%" [ref=e747]
                  - cell "$32.42M" [ref=e748]
                  - cell "—" [ref=e749]
                  - cell [ref=e750]:
                    - button "📈 Chart" [ref=e751]
                - button [ref=e752] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e753]
                  - cell "Tambah SAND ke watchlist SAND SAND SAND" [ref=e754]:
                    - generic [ref=e755]:
                      - button "Tambah SAND ke watchlist" [ref=e756]: ☆
                      - generic "SAND (SAND)" [ref=e757]:
                        - img "SAND" [ref=e758]
                      - generic [ref=e759]: SAND
                      - generic [ref=e760]: SAND
                  - cell "$0.0682" [ref=e761]
                  - cell "-18.73%" [ref=e762]
                  - cell "$31.70M" [ref=e763]
                  - cell "—" [ref=e764]
                  - cell [ref=e765]:
                    - button "📈 Chart" [ref=e766]
                - button [ref=e767] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e768]
                  - cell "Tambah PEPE ke watchlist PEPE PEPE PEPE" [ref=e769]:
                    - generic [ref=e770]:
                      - button "Tambah PEPE ke watchlist" [ref=e771]: ☆
                      - generic "Pepe (PEPE)" [ref=e772]:
                        - img "PEPE" [ref=e773]
                      - generic [ref=e774]: PEPE
                      - generic [ref=e775]: PEPE
                  - cell "$0.00000375" [ref=e776]
                  - cell "-7.63%" [ref=e777]
                  - cell "$30.54M" [ref=e778]
                  - cell "—" [ref=e779]
                  - cell [ref=e780]:
                    - button "📈 Chart" [ref=e781]
                - button [ref=e782] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e783]
                  - cell "Tambah U ke watchlist U U U" [ref=e784]:
                    - generic [ref=e785]:
                      - button "Tambah U ke watchlist" [ref=e786]: ☆
                      - generic "U (U)" [ref=e787]:
                        - img "U" [ref=e788]
                      - generic [ref=e789]: U
                      - generic [ref=e790]: U
                  - cell "$0.9997" [ref=e791]
                  - cell "+0.02%" [ref=e792]
                  - cell "$29.10M" [ref=e793]
                  - cell "—" [ref=e794]
                  - cell [ref=e795]:
                    - button "📈 Chart" [ref=e796]
                - button [ref=e797] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e798]
                  - cell "Tambah AAVE ke watchlist AAVE AAVE AAVE" [ref=e799]:
                    - generic [ref=e800]:
                      - button "Tambah AAVE ke watchlist" [ref=e801]: ☆
                      - generic "Aave (AAVE)" [ref=e802]:
                        - img "AAVE" [ref=e803]
                      - generic [ref=e804]: AAVE
                      - generic [ref=e805]: AAVE
                  - cell "$164.68" [ref=e806]
                  - cell "-4.38%" [ref=e807]
                  - cell "$27.75M" [ref=e808]
                  - cell "—" [ref=e809]
                  - cell [ref=e810]:
                    - button "📈 Chart" [ref=e811]
                - button [ref=e812] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e813]
                  - cell "Tambah LINK ke watchlist LINK LINK LINK" [ref=e814]:
                    - generic [ref=e815]:
                      - button "Tambah LINK ke watchlist" [ref=e816]: ☆
                      - generic "Chainlink (LINK)" [ref=e817]:
                        - img "LINK" [ref=e818]
                      - generic [ref=e819]: LINK
                      - generic [ref=e820]: LINK
                  - cell "$12.37" [ref=e821]
                  - cell "-7.98%" [ref=e822]
                  - cell "$27.59M" [ref=e823]
                  - cell "—" [ref=e824]
                  - cell [ref=e825]:
                    - button "📈 Chart" [ref=e826]
                - button [ref=e827] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e828]
                  - cell "Tambah STRK ke watchlist STRK STRK STRK" [ref=e829]:
                    - generic [ref=e830]:
                      - button "Tambah STRK ke watchlist" [ref=e831]: ☆
                      - generic "STRK (STRK)" [ref=e832]:
                        - img "STRK" [ref=e833]
                      - generic [ref=e834]: STRK
                      - generic [ref=e835]: STRK
                  - cell "$0.0604" [ref=e836]
                  - cell "+21.86%" [ref=e837]
                  - cell "$26.69M" [ref=e838]
                  - cell "—" [ref=e839]
                  - cell [ref=e840]:
                    - button "📈 Chart" [ref=e841]
                - button [ref=e842] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e843]
                  - cell "Tambah SPCXB ke watchlist SPCXB SPCXB SPCXB" [ref=e844]:
                    - generic [ref=e845]:
                      - button "Tambah SPCXB ke watchlist" [ref=e846]: ☆
                      - generic "SPCXB (SPCXB)" [ref=e847]:
                        - img "SPCXB" [ref=e848]
                      - generic [ref=e849]: SPCXB
                      - generic [ref=e850]: SPCXB
                  - cell "$163.39" [ref=e851]
                  - cell "-3.55%" [ref=e852]
                  - cell "$25.30M" [ref=e853]
                  - cell "—" [ref=e854]
                  - cell [ref=e855]:
                    - button "📈 Chart" [ref=e856]
                - button [ref=e857] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e858]
                  - cell "Tambah FDUSD ke watchlist FD FDUSD FDUSD" [ref=e859]:
                    - generic [ref=e860]:
                      - button "Tambah FDUSD ke watchlist" [ref=e861]: ☆
                      - generic "FD (FD)" [ref=e862]:
                        - img "FD" [ref=e863]
                      - generic [ref=e864]: FDUSD
                      - generic [ref=e865]: FDUSD
                  - cell "$0.9978" [ref=e866]
                  - cell "-0.09%" [ref=e867]
                  - cell "$22.49M" [ref=e868]
                  - cell "—" [ref=e869]
                  - cell [ref=e870]:
                    - button "📈 Chart" [ref=e871]
                - button [ref=e872] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e873]
                  - cell "Tambah XAUT ke watchlist XAUT XAUT XAUT" [ref=e874]:
                    - generic [ref=e875]:
                      - button "Tambah XAUT ke watchlist" [ref=e876]: ☆
                      - generic "XAUT (XAUT)" [ref=e877]:
                        - img "XAUT" [ref=e878]
                      - generic [ref=e879]: XAUT
                      - generic [ref=e880]: XAUT
                  - cell "$4,111.03" [ref=e881]
                  - cell "+0.05%" [ref=e882]
                  - cell "$22.42M" [ref=e883]
                  - cell "—" [ref=e884]
                  - cell [ref=e885]:
                    - button "📈 Chart" [ref=e886]
                - button [ref=e887] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e888]
                  - cell "Tambah XLM ke watchlist XLM XLM XLM" [ref=e889]:
                    - generic [ref=e890]:
                      - button "Tambah XLM ke watchlist" [ref=e891]: ☆
                      - generic "XLM (XLM)" [ref=e892]:
                        - img "XLM" [ref=e893]
                      - generic [ref=e894]: XLM
                      - generic [ref=e895]: XLM
                  - cell "$0.1890" [ref=e896]
                  - cell "-5.59%" [ref=e897]
                  - cell "$21.79M" [ref=e898]
                  - cell "—" [ref=e899]
                  - cell [ref=e900]:
                    - button "📈 Chart" [ref=e901]
                - button [ref=e902] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e903]
                  - cell "Tambah FET ke watchlist FET FET FET" [ref=e904]:
                    - generic [ref=e905]:
                      - button "Tambah FET ke watchlist" [ref=e906]: ☆
                      - generic "Fetch.ai (FET)" [ref=e907]:
                        - img "FET" [ref=e908]
                      - generic [ref=e909]: FET
                      - generic [ref=e910]: FET
                  - cell "$0.2150" [ref=e911]
                  - cell "-5.29%" [ref=e912]
                  - cell "$21.18M" [ref=e913]
                  - cell "—" [ref=e914]
                  - cell [ref=e915]:
                    - button "📈 Chart" [ref=e916]
                - button [ref=e917] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e918]
                  - cell "Tambah HBAR ke watchlist HBAR HBAR HBAR" [ref=e919]:
                    - generic [ref=e920]:
                      - button "Tambah HBAR ke watchlist" [ref=e921]: ☆
                      - generic "HBAR (HBAR)" [ref=e922]:
                        - img "HBAR" [ref=e923]
                      - generic [ref=e924]: HBAR
                      - generic [ref=e925]: HBAR
                  - cell "$0.0891" [ref=e926]
                  - cell "-4.59%" [ref=e927]
                  - cell "$21.15M" [ref=e928]
                  - cell "—" [ref=e929]
                  - cell [ref=e930]:
                    - button "📈 Chart" [ref=e931]
                - button [ref=e932] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e933]
                  - cell "Tambah SNDKB ke watchlist SNDKB SNDKB SNDKB" [ref=e934]:
                    - generic [ref=e935]:
                      - button "Tambah SNDKB ke watchlist" [ref=e936]: ☆
                      - generic "SNDKB (SNDKB)" [ref=e937]:
                        - img "SNDKB" [ref=e938]
                      - generic [ref=e939]: SNDKB
                      - generic [ref=e940]: SNDKB
                  - cell "$1,633.30" [ref=e941]
                  - cell "-4.76%" [ref=e942]
                  - cell "$20.86M" [ref=e943]
                  - cell "—" [ref=e944]
                  - cell [ref=e945]:
                    - button "📈 Chart" [ref=e946]
                - button [ref=e947] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e948]
                  - cell "Tambah EUR ke watchlist EUR EUR EUR" [ref=e949]:
                    - generic [ref=e950]:
                      - button "Tambah EUR ke watchlist" [ref=e951]: ☆
                      - generic "EUR (EUR)" [ref=e952]:
                        - img "EUR" [ref=e953]
                      - generic [ref=e954]: EUR
                      - generic [ref=e955]: EUR
                  - cell "$1.12" [ref=e956]
                  - cell "+0.05%" [ref=e957]
                  - cell "$19.56M" [ref=e958]
                  - cell "—" [ref=e959]
                  - cell [ref=e960]:
                    - button "📈 Chart" [ref=e961]
                - button [ref=e962] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e963]
                  - cell "Tambah ALGO ke watchlist ALGO ALGO ALGO" [ref=e964]:
                    - generic [ref=e965]:
                      - button "Tambah ALGO ke watchlist" [ref=e966]: ☆
                      - generic "ALGO (ALGO)" [ref=e967]:
                        - img "ALGO" [ref=e968]
                      - generic [ref=e969]: ALGO
                      - generic [ref=e970]: ALGO
                  - cell "$0.1181" [ref=e971]
                  - cell "+1.46%" [ref=e972]
                  - cell "$18.53M" [ref=e973]
                  - cell "—" [ref=e974]
                  - cell [ref=e975]:
                    - button "📈 Chart" [ref=e976]
                - button [ref=e977] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e978]
                  - cell "Tambah ARB ke watchlist ARB ARB ARB" [ref=e979]:
                    - generic [ref=e980]:
                      - button "Tambah ARB ke watchlist" [ref=e981]: ☆
                      - generic "Arbitrum (ARB)" [ref=e982]:
                        - img "ARB" [ref=e983]
                      - generic [ref=e984]: ARB
                      - generic [ref=e985]: ARB
                  - cell "$0.1663" [ref=e986]
                  - cell "-10.01%" [ref=e987]
                  - cell "$17.98M" [ref=e988]
                  - cell "—" [ref=e989]
                  - cell [ref=e990]:
                    - button "📈 Chart" [ref=e991]
                - button [ref=e992] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e993]
                  - cell "Tambah W ke watchlist W W W" [ref=e994]:
                    - generic [ref=e995]:
                      - button "Tambah W ke watchlist" [ref=e996]: ☆
                      - generic "W (W)" [ref=e997]:
                        - img "W" [ref=e998]
                      - generic [ref=e999]: W
                      - generic [ref=e1000]: W
                  - cell "$0.0151" [ref=e1001]
                  - cell "+5.82%" [ref=e1002]
                  - cell "$17.57M" [ref=e1003]
                  - cell "—" [ref=e1004]
                  - cell [ref=e1005]:
                    - button "📈 Chart" [ref=e1006]
                - button [ref=e1007] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1008]
                  - cell "Tambah ZRO ke watchlist ZRO ZRO ZRO" [ref=e1009]:
                    - generic [ref=e1010]:
                      - button "Tambah ZRO ke watchlist" [ref=e1011]: ☆
                      - generic "ZRO (ZRO)" [ref=e1012]:
                        - img "ZRO" [ref=e1013]
                      - generic [ref=e1014]: ZRO
                      - generic [ref=e1015]: ZRO
                  - cell "$1.96" [ref=e1016]
                  - cell "-7.47%" [ref=e1017]
                  - cell "$17.56M" [ref=e1018]
                  - cell "—" [ref=e1019]
                  - cell [ref=e1020]:
                    - button "📈 Chart" [ref=e1021]
                - button [ref=e1022] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1023]
                  - cell "Tambah FIL ke watchlist FIL FIL FIL" [ref=e1024]:
                    - generic [ref=e1025]:
                      - button "Tambah FIL ke watchlist" [ref=e1026]: ☆
                      - generic "Filecoin (FIL)" [ref=e1027]:
                        - img "FIL" [ref=e1028]
                      - generic [ref=e1029]: FIL
                      - generic [ref=e1030]: FIL
                  - cell "$1.00" [ref=e1031]
                  - cell "-3.89%" [ref=e1032]
                  - cell "$16.58M" [ref=e1033]
                  - cell "—" [ref=e1034]
                  - cell [ref=e1035]:
                    - button "📈 Chart" [ref=e1036]
                - button [ref=e1037] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1038]
                  - cell "Tambah ORCA ke watchlist ORC ORCA ORCA" [ref=e1039]:
                    - generic [ref=e1040]:
                      - button "Tambah ORCA ke watchlist" [ref=e1041]: ☆
                      - generic "ORCA (ORCA)" [ref=e1042]: ORC
                      - generic [ref=e1044]: ORCA
                      - generic [ref=e1045]: ORCA
                  - cell "$2.48" [ref=e1046]
                  - cell "-9.63%" [ref=e1047]
                  - cell "$16.45M" [ref=e1048]
                  - cell "—" [ref=e1049]
                  - cell [ref=e1050]:
                    - button "📈 Chart" [ref=e1051]
                - button [ref=e1052] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1053]
                  - cell "Tambah CRCLB ke watchlist CRCLB CRCLB CRCLB" [ref=e1054]:
                    - generic [ref=e1055]:
                      - button "Tambah CRCLB ke watchlist" [ref=e1056]: ☆
                      - generic "CRCLB (CRCLB)" [ref=e1057]:
                        - img "CRCLB" [ref=e1058]
                      - generic [ref=e1059]: CRCLB
                      - generic [ref=e1060]: CRCLB
                  - cell "$79.44" [ref=e1061]
                  - cell "-1.56%" [ref=e1062]
                  - cell "$15.18M" [ref=e1063]
                  - cell "—" [ref=e1064]
                  - cell [ref=e1065]:
                    - button "📈 Chart" [ref=e1066]
                - button [ref=e1067] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1068]
                  - cell "Tambah RAY ke watchlist RAY RAY RAY" [ref=e1069]:
                    - generic [ref=e1070]:
                      - button "Tambah RAY ke watchlist" [ref=e1071]: ☆
                      - generic "RAY (RAY)" [ref=e1072]:
                        - img "RAY" [ref=e1073]
                      - generic [ref=e1074]: RAY
                      - generic [ref=e1075]: RAY
                  - cell "$2.33" [ref=e1076]
                  - cell "-6.10%" [ref=e1077]
                  - cell "$14.87M" [ref=e1078]
                  - cell "—" [ref=e1079]
                  - cell [ref=e1080]:
                    - button "📈 Chart" [ref=e1081]
                - button [ref=e1082] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1083]
                  - cell "Tambah PROM ke watchlist PROM PROM PROM" [ref=e1084]:
                    - generic [ref=e1085]:
                      - button "Tambah PROM ke watchlist" [ref=e1086]: ☆
                      - generic "PROM (PROM)" [ref=e1087]:
                        - img "PROM" [ref=e1088]
                      - generic [ref=e1089]: PROM
                      - generic [ref=e1090]: PROM
                  - cell "$5.02" [ref=e1091]
                  - cell "-6.73%" [ref=e1092]
                  - cell "$14.63M" [ref=e1093]
                  - cell "—" [ref=e1094]
                  - cell [ref=e1095]:
                    - button "📈 Chart" [ref=e1096]
                - button [ref=e1097] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1098]
                  - cell "Tambah HEMI ke watchlist HEMI HEMI HEMI" [ref=e1099]:
                    - generic [ref=e1100]:
                      - button "Tambah HEMI ke watchlist" [ref=e1101]: ☆
                      - generic "HEMI (HEMI)" [ref=e1102]:
                        - img "HEMI" [ref=e1103]
                      - generic [ref=e1104]: HEMI
                      - generic [ref=e1105]: HEMI
                  - cell "$0.00571000" [ref=e1106]
                  - cell "-3.06%" [ref=e1107]
                  - cell "$14.42M" [ref=e1108]
                  - cell "—" [ref=e1109]
                  - cell [ref=e1110]:
                    - button "📈 Chart" [ref=e1111]
                - button [ref=e1112] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1113]
                  - cell "Tambah INJ ke watchlist INJ INJ INJ" [ref=e1114]:
                    - generic [ref=e1115]:
                      - button "Tambah INJ ke watchlist" [ref=e1116]: ☆
                      - generic "Injective (INJ)" [ref=e1117]:
                        - img "INJ" [ref=e1118]
                      - generic [ref=e1119]: INJ
                      - generic [ref=e1120]: INJ
                  - cell "$6.63" [ref=e1121]
                  - cell "-9.35%" [ref=e1122]
                  - cell "$14.09M" [ref=e1123]
                  - cell "—" [ref=e1124]
                  - cell [ref=e1125]:
                    - button "📈 Chart" [ref=e1126]
                - button [ref=e1127] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1128]
                  - cell "Tambah DOT ke watchlist DOT DOT DOT" [ref=e1129]:
                    - generic [ref=e1130]:
                      - button "Tambah DOT ke watchlist" [ref=e1131]: ☆
                      - generic "Polkadot (DOT)" [ref=e1132]:
                        - img "DOT" [ref=e1133]
                      - generic [ref=e1134]: DOT
                      - generic [ref=e1135]: DOT
                  - cell "$1.03" [ref=e1136]
                  - cell "-6.61%" [ref=e1137]
                  - cell "$13.94M" [ref=e1138]
                  - cell "—" [ref=e1139]
                  - cell [ref=e1140]:
                    - button "📈 Chart" [ref=e1141]
                - button [ref=e1142] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1143]
                  - cell "Tambah PENGU ke watchlist PENGU PENGU PENGU" [ref=e1144]:
                    - generic [ref=e1145]:
                      - button "Tambah PENGU ke watchlist" [ref=e1146]: ☆
                      - generic "PENGU (PENGU)" [ref=e1147]:
                        - img "PENGU" [ref=e1148]
                      - generic [ref=e1149]: PENGU
                      - generic [ref=e1150]: PENGU
                  - cell "$0.00785500" [ref=e1151]
                  - cell "-8.60%" [ref=e1152]
                  - cell "$13.57M" [ref=e1153]
                  - cell "—" [ref=e1154]
                  - cell [ref=e1155]:
                    - button "📈 Chart" [ref=e1156]
                - button [ref=e1157] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1158]
                  - cell "Tambah ASTER ke watchlist AST ASTER ASTER" [ref=e1159]:
                    - generic [ref=e1160]:
                      - button "Tambah ASTER ke watchlist" [ref=e1161]: ☆
                      - generic "ASTER (ASTER)" [ref=e1162]: AST
                      - generic [ref=e1164]: ASTER
                      - generic [ref=e1165]: ASTER
                  - cell "$0.6813" [ref=e1166]
                  - cell "-5.02%" [ref=e1167]
                  - cell "$13.54M" [ref=e1168]
                  - cell "—" [ref=e1169]
                  - cell [ref=e1170]:
                    - button "📈 Chart" [ref=e1171]
                - button [ref=e1172] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1173]
                  - cell "Tambah TRUMP ke watchlist TRUMP TRUMP TRUMP" [ref=e1174]:
                    - generic [ref=e1175]:
                      - button "Tambah TRUMP ke watchlist" [ref=e1176]: ☆
                      - generic "TRUMP (TRUMP)" [ref=e1177]:
                        - img "TRUMP" [ref=e1178]
                      - generic [ref=e1179]: TRUMP
                      - generic [ref=e1180]: TRUMP
                  - cell "$1.77" [ref=e1181]
                  - cell "-4.68%" [ref=e1182]
                  - cell "$13.53M" [ref=e1183]
                  - cell "—" [ref=e1184]
                  - cell [ref=e1185]:
                    - button "📈 Chart" [ref=e1186]
                - button [ref=e1187] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1188]
                  - cell "Tambah PAXG ke watchlist PAXG PAXG PAXG" [ref=e1189]:
                    - generic [ref=e1190]:
                      - button "Tambah PAXG ke watchlist" [ref=e1191]: ☆
                      - generic "PAXG (PAXG)" [ref=e1192]:
                        - img "PAXG" [ref=e1193]
                      - generic [ref=e1194]: PAXG
                      - generic [ref=e1195]: PAXG
                  - cell "$4,117.04" [ref=e1196]
                  - cell "-0.00%" [ref=e1197]
                  - cell "$13.08M" [ref=e1198]
                  - cell "—" [ref=e1199]
                  - cell [ref=e1200]:
                    - button "📈 Chart" [ref=e1201]
                - button [ref=e1202] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1203]
                  - cell "Tambah CRV ke watchlist CRV CRV CRV" [ref=e1204]:
                    - generic [ref=e1205]:
                      - button "Tambah CRV ke watchlist" [ref=e1206]: ☆
                      - generic "Curve (CRV)" [ref=e1207]:
                        - img "CRV" [ref=e1208]
                      - generic [ref=e1209]: CRV
                      - generic [ref=e1210]: CRV
                  - cell "$0.3384" [ref=e1211]
                  - cell "-4.49%" [ref=e1212]
                  - cell "$12.93M" [ref=e1213]
                  - cell "—" [ref=e1214]
                  - cell [ref=e1215]:
                    - button "📈 Chart" [ref=e1216]
                - button [ref=e1217] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1218]
                  - cell "Tambah APT ke watchlist APT APT APT" [ref=e1219]:
                    - generic [ref=e1220]:
                      - button "Tambah APT ke watchlist" [ref=e1221]: ☆
                      - generic "Aptos (APT)" [ref=e1222]:
                        - img "APT" [ref=e1223]
                      - generic [ref=e1224]: APT
                      - generic [ref=e1225]: APT
                  - cell "$0.7117" [ref=e1226]
                  - cell "-5.54%" [ref=e1227]
                  - cell "$12.61M" [ref=e1228]
                  - cell "—" [ref=e1229]
                  - cell [ref=e1230]:
                    - button "📈 Chart" [ref=e1231]
                - button [ref=e1232] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1233]
                  - cell "Tambah MARSCOIN ke watchlist MAR MARSCOIN MARSCOIN" [ref=e1234]:
                    - generic [ref=e1235]:
                      - button "Tambah MARSCOIN ke watchlist" [ref=e1236]: ☆
                      - generic "MARSCOIN (MARSCOIN)" [ref=e1237]: MAR
                      - generic [ref=e1239]: MARSCOIN
                      - generic [ref=e1240]: MARSCOIN
                  - cell "$0.0882" [ref=e1241]
                  - cell "-10.18%" [ref=e1242]
                  - cell "$12.37M" [ref=e1243]
                  - cell "—" [ref=e1244]
                  - cell [ref=e1245]:
                    - button "📈 Chart" [ref=e1246]
                - button [ref=e1247] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1248]
                  - cell "Tambah MSTRB ke watchlist MST MSTRB MSTRB" [ref=e1249]:
                    - generic [ref=e1250]:
                      - button "Tambah MSTRB ke watchlist" [ref=e1251]: ☆
                      - generic "MSTRB (MSTRB)" [ref=e1252]: MST
                      - generic [ref=e1254]: MSTRB
                      - generic [ref=e1255]: MSTRB
                  - cell "$149.64" [ref=e1256]
                  - cell "-3.81%" [ref=e1257]
                  - cell "$12.09M" [ref=e1258]
                  - cell "—" [ref=e1259]
                  - cell [ref=e1260]:
                    - button "📈 Chart" [ref=e1261]
                - button [ref=e1262] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1263]
                  - cell "Tambah BCH ke watchlist BCH BCH BCH" [ref=e1264]:
                    - generic [ref=e1265]:
                      - button "Tambah BCH ke watchlist" [ref=e1266]: ☆
                      - generic "BCH (BCH)" [ref=e1267]:
                        - img "BCH" [ref=e1268]
                      - generic [ref=e1269]: BCH
                      - generic [ref=e1270]: BCH
                  - cell "$281.10" [ref=e1271]
                  - cell "-7.14%" [ref=e1272]
                  - cell "$11.92M" [ref=e1273]
                  - cell "—" [ref=e1274]
                  - cell [ref=e1275]:
                    - button "📈 Chart" [ref=e1276]
                - button [ref=e1277] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1278]
                  - cell "Tambah TIA ke watchlist TIA TIA TIA" [ref=e1279]:
                    - generic [ref=e1280]:
                      - button "Tambah TIA ke watchlist" [ref=e1281]: ☆
                      - generic "Celestia (TIA)" [ref=e1282]:
                        - img "TIA" [ref=e1283]
                      - generic [ref=e1284]: TIA
                      - generic [ref=e1285]: TIA
                  - cell "$0.4501" [ref=e1286]
                  - cell "+1.26%" [ref=e1287]
                  - cell "$11.84M" [ref=e1288]
                  - cell "—" [ref=e1289]
                  - cell [ref=e1290]:
                    - button "📈 Chart" [ref=e1291]
                - button [ref=e1292] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1293]
                  - cell "Tambah MINA ke watchlist MINA MINA MINA" [ref=e1294]:
                    - generic [ref=e1295]:
                      - button "Tambah MINA ke watchlist" [ref=e1296]: ☆
                      - generic "MINA (MINA)" [ref=e1297]:
                        - img "MINA" [ref=e1298]
                      - generic [ref=e1299]: MINA
                      - generic [ref=e1300]: MINA
                  - cell "$0.0794" [ref=e1301]
                  - cell "-15.35%" [ref=e1302]
                  - cell "$11.52M" [ref=e1303]
                  - cell "—" [ref=e1304]
                  - cell [ref=e1305]:
                    - button "📈 Chart" [ref=e1306]
                - button [ref=e1307] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1308]
                  - cell "Tambah 币安人生 ke watchlist 币安人 币安人生 币安人生" [ref=e1309]:
                    - generic [ref=e1310]:
                      - button "Tambah 币安人生 ke watchlist" [ref=e1311]: ☆
                      - generic "币安人生 (币安人生)" [ref=e1312]: 币安人
                      - generic [ref=e1314]: 币安人生
                      - generic [ref=e1315]: 币安人生
                  - cell "$0.5165" [ref=e1316]
                  - cell "+8.17%" [ref=e1317]
                  - cell "$11.13M" [ref=e1318]
                  - cell "—" [ref=e1319]
                  - cell [ref=e1320]:
                    - button "📈 Chart" [ref=e1321]
                - button [ref=e1322] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1323]
                  - cell "Tambah GRAM ke watchlist GRAM GRAM GRAM" [ref=e1324]:
                    - generic [ref=e1325]:
                      - button "Tambah GRAM ke watchlist" [ref=e1326]: ☆
                      - generic "GRAM (GRAM)" [ref=e1327]:
                        - img "GRAM" [ref=e1328]
                      - generic [ref=e1329]: GRAM
                      - generic [ref=e1330]: GRAM
                  - cell "$1.35" [ref=e1331]
                  - cell "-5.40%" [ref=e1332]
                  - cell "$10.84M" [ref=e1333]
                  - cell "—" [ref=e1334]
                  - cell [ref=e1335]:
                    - button "📈 Chart" [ref=e1336]
                - button [ref=e1337] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1338]
                  - cell "Tambah RLC ke watchlist RLC RLC RLC" [ref=e1339]:
                    - generic [ref=e1340]:
                      - button "Tambah RLC ke watchlist" [ref=e1341]: ☆
                      - generic "RLC (RLC)" [ref=e1342]:
                        - img "RLC" [ref=e1343]
                      - generic [ref=e1344]: RLC
                      - generic [ref=e1345]: RLC
                  - cell "$0.7356" [ref=e1346]
                  - cell "+6.24%" [ref=e1347]
                  - cell "$10.75M" [ref=e1348]
                  - cell "—" [ref=e1349]
                  - cell [ref=e1350]:
                    - button "📈 Chart" [ref=e1351]
                - button [ref=e1352] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1353]
                  - cell "Tambah ETHFI ke watchlist ETHFI ETHFI ETHFI" [ref=e1354]:
                    - generic [ref=e1355]:
                      - button "Tambah ETHFI ke watchlist" [ref=e1356]: ☆
                      - generic "ETHFI (ETHFI)" [ref=e1357]:
                        - img "ETHFI" [ref=e1358]
                      - generic [ref=e1359]: ETHFI
                      - generic [ref=e1360]: ETHFI
                  - cell "$0.6711" [ref=e1361]
                  - cell "-5.37%" [ref=e1362]
                  - cell "$10.65M" [ref=e1363]
                  - cell "—" [ref=e1364]
                  - cell [ref=e1365]:
                    - button "📈 Chart" [ref=e1366]
                - button [ref=e1367] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1368]
                  - cell "Tambah POL ke watchlist POL POL POL" [ref=e1369]:
                    - generic [ref=e1370]:
                      - button "Tambah POL ke watchlist" [ref=e1371]: ☆
                      - generic "Polygon (POL)" [ref=e1372]:
                        - img "POL" [ref=e1373]
                      - generic [ref=e1374]: POL
                      - generic [ref=e1375]: POL
                  - cell "$0.0961" [ref=e1376]
                  - cell "-6.62%" [ref=e1377]
                  - cell "$10.58M" [ref=e1378]
                  - cell "—" [ref=e1379]
                  - cell [ref=e1380]:
                    - button "📈 Chart" [ref=e1381]
                - button [ref=e1382] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1383]
                  - cell "Tambah QQQB ke watchlist QQQ QQQB QQQB" [ref=e1384]:
                    - generic [ref=e1385]:
                      - button "Tambah QQQB ke watchlist" [ref=e1386]: ☆
                      - generic "QQQB (QQQB)" [ref=e1387]: QQQ
                      - generic [ref=e1389]: QQQB
                      - generic [ref=e1390]: QQQB
                  - cell "$752.77" [ref=e1391]
                  - cell "-0.54%" [ref=e1392]
                  - cell "$10.46M" [ref=e1393]
                  - cell "—" [ref=e1394]
                  - cell [ref=e1395]:
                    - button "📈 Chart" [ref=e1396]
                - button [ref=e1397] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1398]
                  - cell "Tambah DASH ke watchlist DASH DASH DASH" [ref=e1399]:
                    - generic [ref=e1400]:
                      - button "Tambah DASH ke watchlist" [ref=e1401]: ☆
                      - generic "DASH (DASH)" [ref=e1402]:
                        - img "DASH" [ref=e1403]
                      - generic [ref=e1404]: DASH
                      - generic [ref=e1405]: DASH
                  - cell "$49.81" [ref=e1406]
                  - cell "-6.57%" [ref=e1407]
                  - cell "$9.71M" [ref=e1408]
                  - cell "—" [ref=e1409]
                  - cell [ref=e1410]:
                    - button "📈 Chart" [ref=e1411]
                - button [ref=e1412] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1413]
                  - cell "Tambah OP ke watchlist OP OP OP" [ref=e1414]:
                    - generic [ref=e1415]:
                      - button "Tambah OP ke watchlist" [ref=e1416]: ☆
                      - generic "Optimism (OP)" [ref=e1417]:
                        - img "OP" [ref=e1418]
                      - generic [ref=e1419]: OP
                      - generic [ref=e1420]: OP
                  - cell "$0.1150" [ref=e1421]
                  - cell "-3.93%" [ref=e1422]
                  - cell "$9.65M" [ref=e1423]
                  - cell "—" [ref=e1424]
                  - cell [ref=e1425]:
                    - button "📈 Chart" [ref=e1426]
                - button [ref=e1427] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1428]
                  - cell "Tambah XPL ke watchlist XPL XPL XPL" [ref=e1429]:
                    - generic [ref=e1430]:
                      - button "Tambah XPL ke watchlist" [ref=e1431]: ☆
                      - generic "XPL (XPL)" [ref=e1432]:
                        - img "XPL" [ref=e1433]
                      - generic [ref=e1434]: XPL
                      - generic [ref=e1435]: XPL
                  - cell "$0.0830" [ref=e1436]
                  - cell "-4.16%" [ref=e1437]
                  - cell "$9.41M" [ref=e1438]
                  - cell "—" [ref=e1439]
                  - cell [ref=e1440]:
                    - button "📈 Chart" [ref=e1441]
                - button [ref=e1442] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1443]
                  - cell "Tambah ICP ke watchlist ICP ICP ICP" [ref=e1444]:
                    - generic [ref=e1445]:
                      - button "Tambah ICP ke watchlist" [ref=e1446]: ☆
                      - generic "ICP (ICP)" [ref=e1447]:
                        - img "ICP" [ref=e1448]
                      - generic [ref=e1449]: ICP
                      - generic [ref=e1450]: ICP
                  - cell "$2.95" [ref=e1451]
                  - cell "-6.55%" [ref=e1452]
                  - cell "$9.24M" [ref=e1453]
                  - cell "—" [ref=e1454]
                  - cell [ref=e1455]:
                    - button "📈 Chart" [ref=e1456]
                - button [ref=e1457] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1458]
                  - cell "Tambah ERA ke watchlist ERA ERA ERA" [ref=e1459]:
                    - generic [ref=e1460]:
                      - button "Tambah ERA ke watchlist" [ref=e1461]: ☆
                      - generic "ERA (ERA)" [ref=e1462]:
                        - img "ERA" [ref=e1463]
                      - generic [ref=e1464]: ERA
                      - generic [ref=e1465]: ERA
                  - cell "$0.0629" [ref=e1466]
                  - cell "+3.12%" [ref=e1467]
                  - cell "$9.16M" [ref=e1468]
                  - cell "—" [ref=e1469]
                  - cell [ref=e1470]:
                    - button "📈 Chart" [ref=e1471]
                - button [ref=e1472] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1473]
                  - cell "Tambah PYTH ke watchlist PYTH PYTH PYTH" [ref=e1474]:
                    - generic [ref=e1475]:
                      - button "Tambah PYTH ke watchlist" [ref=e1476]: ☆
                      - generic "Pyth Network (PYTH)" [ref=e1477]:
                        - img "PYTH" [ref=e1478]
                      - generic [ref=e1479]: PYTH
                      - generic [ref=e1480]: PYTH
                  - cell "$0.0736" [ref=e1481]
                  - cell "+3.59%" [ref=e1482]
                  - cell "$9.14M" [ref=e1483]
                  - cell "—" [ref=e1484]
                  - cell [ref=e1485]:
                    - button "📈 Chart" [ref=e1486]
                - button [ref=e1487] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1488]
                  - cell "Tambah MOVR ke watchlist MOVR MOVR MOVR" [ref=e1489]:
                    - generic [ref=e1490]:
                      - button "Tambah MOVR ke watchlist" [ref=e1491]: ☆
                      - generic "MOVR (MOVR)" [ref=e1492]:
                        - img "MOVR" [ref=e1493]
                      - generic [ref=e1494]: MOVR
                      - generic [ref=e1495]: MOVR
                  - cell "$1.82" [ref=e1496]
                  - cell "-8.12%" [ref=e1497]
                  - cell "$8.75M" [ref=e1498]
                  - cell "—" [ref=e1499]
                  - cell [ref=e1500]:
                    - button "📈 Chart" [ref=e1501]
                - button [ref=e1502] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1503]
                  - cell "Tambah NMR ke watchlist NMR NMR NMR" [ref=e1504]:
                    - generic [ref=e1505]:
                      - button "Tambah NMR ke watchlist" [ref=e1506]: ☆
                      - generic "NMR (NMR)" [ref=e1507]:
                        - img "NMR" [ref=e1508]
                      - generic [ref=e1509]: NMR
                      - generic [ref=e1510]: NMR
                  - cell "$13.67" [ref=e1511]
                  - cell "-5.79%" [ref=e1512]
                  - cell "$8.49M" [ref=e1513]
                  - cell "—" [ref=e1514]
                  - cell [ref=e1515]:
                    - button "📈 Chart" [ref=e1516]
                - button [ref=e1517] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1518]
                  - cell "Tambah JTO ke watchlist JTO JTO JTO" [ref=e1519]:
                    - generic [ref=e1520]:
                      - button "Tambah JTO ke watchlist" [ref=e1521]: ☆
                      - generic "JTO (JTO)" [ref=e1522]:
                        - img "JTO" [ref=e1523]
                      - generic [ref=e1524]: JTO
                      - generic [ref=e1525]: JTO
                  - cell "$0.5124" [ref=e1526]
                  - cell "+3.27%" [ref=e1527]
                  - cell "$8.41M" [ref=e1528]
                  - cell "—" [ref=e1529]
                  - cell [ref=e1530]:
                    - button "📈 Chart" [ref=e1531]
                - button [ref=e1532] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1533]
                  - cell "Tambah GTC ke watchlist GTC GTC GTC" [ref=e1534]:
                    - generic [ref=e1535]:
                      - button "Tambah GTC ke watchlist" [ref=e1536]: ☆
                      - generic "GTC (GTC)" [ref=e1537]:
                        - img "GTC" [ref=e1538]
                      - generic [ref=e1539]: GTC
                      - generic [ref=e1540]: GTC
                  - cell "$0.1825" [ref=e1541]
                  - cell "+2.17%" [ref=e1542]
                  - cell "$8.39M" [ref=e1543]
                  - cell "—" [ref=e1544]
                  - cell [ref=e1545]:
                    - button "📈 Chart" [ref=e1546]
                - button [ref=e1547] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1548]
                  - cell "Tambah ACE ke watchlist ACE ACE ACE" [ref=e1549]:
                    - generic [ref=e1550]:
                      - button "Tambah ACE ke watchlist" [ref=e1551]: ☆
                      - generic "ACE (ACE)" [ref=e1552]:
                        - img "ACE" [ref=e1553]
                      - generic [ref=e1554]: ACE
                      - generic [ref=e1555]: ACE
                  - cell "$0.1793" [ref=e1556]
                  - cell "+6.79%" [ref=e1557]
                  - cell "$8.15M" [ref=e1558]
                  - cell "—" [ref=e1559]
                  - cell [ref=e1560]:
                    - button "📈 Chart" [ref=e1561]
                - button [ref=e1562] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1563]
                  - cell "Tambah CTSI ke watchlist CTSI CTSI CTSI" [ref=e1564]:
                    - generic [ref=e1565]:
                      - button "Tambah CTSI ke watchlist" [ref=e1566]: ☆
                      - generic "CTSI (CTSI)" [ref=e1567]:
                        - img "CTSI" [ref=e1568]
                      - generic [ref=e1569]: CTSI
                      - generic [ref=e1570]: CTSI
                  - cell "$0.0330" [ref=e1571]
                  - cell "+12.69%" [ref=e1572]
                  - cell "$7.81M" [ref=e1573]
                  - cell "—" [ref=e1574]
                  - cell [ref=e1575]:
                    - button "📈 Chart" [ref=e1576]
                - button [ref=e1577] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1578]
                  - cell "Tambah MUB ke watchlist MUB MUB MUB" [ref=e1579]:
                    - generic [ref=e1580]:
                      - button "Tambah MUB ke watchlist" [ref=e1581]: ☆
                      - generic "MUB (MUB)" [ref=e1582]:
                        - img "MUB" [ref=e1583]
                      - generic [ref=e1584]: MUB
                      - generic [ref=e1585]: MUB
                  - cell "$1,063.62" [ref=e1586]
                  - cell "-1.21%" [ref=e1587]
                  - cell "$7.80M" [ref=e1588]
                  - cell "—" [ref=e1589]
                  - cell [ref=e1590]:
                    - button "📈 Chart" [ref=e1591]
                - button [ref=e1592] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1593]
                  - cell "Tambah TON ke watchlist TON TON TON" [ref=e1594]:
                    - generic [ref=e1595]:
                      - button "Tambah TON ke watchlist" [ref=e1596]: ☆
                      - generic "Toncoin (TON)" [ref=e1597]:
                        - img "TON" [ref=e1598]
                      - generic [ref=e1599]: TON
                      - generic [ref=e1600]: TON
                  - cell "$1.60" [ref=e1601]
                  - cell "+0.95%" [ref=e1602]
                  - cell "$7.72M" [ref=e1603]
                  - cell "—" [ref=e1604]
                  - cell [ref=e1605]:
                    - button "📈 Chart" [ref=e1606]
                - button [ref=e1607] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1608]
                  - cell "Tambah AERO ke watchlist AERO AERO AERO" [ref=e1609]:
                    - generic [ref=e1610]:
                      - button "Tambah AERO ke watchlist" [ref=e1611]: ☆
                      - generic "AERO (AERO)" [ref=e1612]:
                        - img "AERO" [ref=e1613]
                      - generic [ref=e1614]: AERO
                      - generic [ref=e1615]: AERO
                  - cell "$0.7881" [ref=e1616]
                  - cell "-1.44%" [ref=e1617]
                  - cell "$7.44M" [ref=e1618]
                  - cell "—" [ref=e1619]
                  - cell [ref=e1620]:
                    - button "📈 Chart" [ref=e1621]
                - button [ref=e1622] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1623]
                  - cell "Tambah RENDER ke watchlist RENDER RENDER RENDER" [ref=e1624]:
                    - generic [ref=e1625]:
                      - button "Tambah RENDER ke watchlist" [ref=e1626]: ☆
                      - generic "Render (RENDER)" [ref=e1627]:
                        - img "RENDER" [ref=e1628]
                      - generic [ref=e1629]: RENDER
                      - generic [ref=e1630]: RENDER
                  - cell "$1.81" [ref=e1631]
                  - cell "-11.16%" [ref=e1632]
                  - cell "$7.25M" [ref=e1633]
                  - cell "—" [ref=e1634]
                  - cell [ref=e1635]:
                    - button "📈 Chart" [ref=e1636]
                - button [ref=e1637] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1638]
                  - cell "Tambah SKL ke watchlist SKL SKL SKL" [ref=e1639]:
                    - generic [ref=e1640]:
                      - button "Tambah SKL ke watchlist" [ref=e1641]: ☆
                      - generic "SKL (SKL)" [ref=e1642]:
                        - img "SKL" [ref=e1643]
                      - generic [ref=e1644]: SKL
                      - generic [ref=e1645]: SKL
                  - cell "$0.00489000" [ref=e1646]
                  - cell "+11.39%" [ref=e1647]
                  - cell "$7.21M" [ref=e1648]
                  - cell "—" [ref=e1649]
                  - cell [ref=e1650]:
                    - button "📈 Chart" [ref=e1651]
                - button [ref=e1652] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1653]
                  - cell "Tambah MUBARAK ke watchlist MUBARAK MUBARAK MUBARAK" [ref=e1654]:
                    - generic [ref=e1655]:
                      - button "Tambah MUBARAK ke watchlist" [ref=e1656]: ☆
                      - generic "MUBARAK (MUBARAK)" [ref=e1657]:
                        - img "MUBARAK" [ref=e1658]
                      - generic [ref=e1659]: MUBARAK
                      - generic [ref=e1660]: MUBARAK
                  - cell "$0.0714" [ref=e1661]
                  - cell "-3.45%" [ref=e1662]
                  - cell "$7.18M" [ref=e1663]
                  - cell "—" [ref=e1664]
                  - cell [ref=e1665]:
                    - button "📈 Chart" [ref=e1666]
                - button [ref=e1667] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1668]
                  - cell "Tambah VIRTUAL ke watchlist VIRTUAL VIRTUAL VIRTUAL" [ref=e1669]:
                    - generic [ref=e1670]:
                      - button "Tambah VIRTUAL ke watchlist" [ref=e1671]: ☆
                      - generic "VIRTUAL (VIRTUAL)" [ref=e1672]:
                        - img "VIRTUAL" [ref=e1673]
                      - generic [ref=e1674]: VIRTUAL
                      - generic [ref=e1675]: VIRTUAL
                  - cell "$0.6953" [ref=e1676]
                  - cell "-9.09%" [ref=e1677]
                  - cell "$6.93M" [ref=e1678]
                  - cell "—" [ref=e1679]
                  - cell [ref=e1680]:
                    - button "📈 Chart" [ref=e1681]
                - button [ref=e1682] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1683]
                  - cell "Tambah LDO ke watchlist LDO LDO LDO" [ref=e1684]:
                    - generic [ref=e1685]:
                      - button "Tambah LDO ke watchlist" [ref=e1686]: ☆
                      - generic "Lido (LDO)" [ref=e1687]:
                        - img "LDO" [ref=e1688]
                      - generic [ref=e1689]: LDO
                      - generic [ref=e1690]: LDO
                  - cell "$0.4056" [ref=e1691]
                  - cell "-5.41%" [ref=e1692]
                  - cell "$6.87M" [ref=e1693]
                  - cell "—" [ref=e1694]
                  - cell [ref=e1695]:
                    - button "📈 Chart" [ref=e1696]
                - button [ref=e1697] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1698]
                  - cell "Tambah NVDAB ke watchlist NVDAB NVDAB NVDAB" [ref=e1699]:
                    - generic [ref=e1700]:
                      - button "Tambah NVDAB ke watchlist" [ref=e1701]: ☆
                      - generic "NVDAB (NVDAB)" [ref=e1702]:
                        - img "NVDAB" [ref=e1703]
                      - generic [ref=e1704]: NVDAB
                      - generic [ref=e1705]: NVDAB
                  - cell "$235.36" [ref=e1706]
                  - cell "-0.87%" [ref=e1707]
                  - cell "$6.52M" [ref=e1708]
                  - cell "—" [ref=e1709]
                  - cell [ref=e1710]:
                    - button "📈 Chart" [ref=e1711]
                - button [ref=e1712] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1713]
                  - cell "Tambah CHIP ke watchlist CHIP CHIP CHIP" [ref=e1714]:
                    - generic [ref=e1715]:
                      - button "Tambah CHIP ke watchlist" [ref=e1716]: ☆
                      - generic "CHIP (CHIP)" [ref=e1717]:
                        - img "CHIP" [ref=e1718]
                      - generic [ref=e1719]: CHIP
                      - generic [ref=e1720]: CHIP
                  - cell "$0.0469" [ref=e1721]
                  - cell "-6.27%" [ref=e1722]
                  - cell "$6.48M" [ref=e1723]
                  - cell "—" [ref=e1724]
                  - cell [ref=e1725]:
                    - button "📈 Chart" [ref=e1726]
                - button [ref=e1727] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1728]
                  - cell "Tambah SEI ke watchlist SEI SEI SEI" [ref=e1729]:
                    - generic [ref=e1730]:
                      - button "Tambah SEI ke watchlist" [ref=e1731]: ☆
                      - generic "Sei (SEI)" [ref=e1732]:
                        - img "SEI" [ref=e1733]
                      - generic [ref=e1734]: SEI
                      - generic [ref=e1735]: SEI
                  - cell "$0.0656" [ref=e1736]
                  - cell "-3.77%" [ref=e1737]
                  - cell "$6.43M" [ref=e1738]
                  - cell "—" [ref=e1739]
                  - cell [ref=e1740]:
                    - button "📈 Chart" [ref=e1741]
                - button [ref=e1742] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1743]
                  - cell "Tambah CAKE ke watchlist CAKE CAKE CAKE" [ref=e1744]:
                    - generic [ref=e1745]:
                      - button "Tambah CAKE ke watchlist" [ref=e1746]: ☆
                      - generic "CAKE (CAKE)" [ref=e1747]:
                        - img "CAKE" [ref=e1748]
                      - generic [ref=e1749]: CAKE
                      - generic [ref=e1750]: CAKE
                  - cell "$2.12" [ref=e1751]
                  - cell "-4.25%" [ref=e1752]
                  - cell "$6.39M" [ref=e1753]
                  - cell "—" [ref=e1754]
                  - cell [ref=e1755]:
                    - button "📈 Chart" [ref=e1756]
                - button [ref=e1757] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1758]
                  - cell "Tambah 牛来 ke watchlist 牛来 牛来 牛来" [ref=e1759]:
                    - generic [ref=e1760]:
                      - button "Tambah 牛来 ke watchlist" [ref=e1761]: ☆
                      - generic "牛来 (牛来)" [ref=e1762]:
                        - img "牛来" [ref=e1763]
                      - generic [ref=e1764]: 牛来
                      - generic [ref=e1765]: 牛来
                  - cell "$0.0713" [ref=e1766]
                  - cell "-4.67%" [ref=e1767]
                  - cell "$6.25M" [ref=e1768]
                  - cell "—" [ref=e1769]
                  - cell [ref=e1770]:
                    - button "📈 Chart" [ref=e1771]
                - button [ref=e1772] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1773]
                  - cell "Tambah BOME ke watchlist BOME BOME BOME" [ref=e1774]:
                    - generic [ref=e1775]:
                      - button "Tambah BOME ke watchlist" [ref=e1776]: ☆
                      - generic "BOME (BOME)" [ref=e1777]:
                        - img "BOME" [ref=e1778]
                      - generic [ref=e1779]: BOME
                      - generic [ref=e1780]: BOME
                  - cell "$0.00101590" [ref=e1781]
                  - cell "+7.62%" [ref=e1782]
                  - cell "$6.17M" [ref=e1783]
                  - cell "—" [ref=e1784]
                  - cell [ref=e1785]:
                    - button "📈 Chart" [ref=e1786]
                - button [ref=e1787] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1788]
                  - cell "Tambah ATOM ke watchlist ATOM ATOM ATOM" [ref=e1789]:
                    - generic [ref=e1790]:
                      - button "Tambah ATOM ke watchlist" [ref=e1791]: ☆
                      - generic "Cosmos (ATOM)" [ref=e1792]:
                        - img "ATOM" [ref=e1793]
                      - generic [ref=e1794]: ATOM
                      - generic [ref=e1795]: ATOM
                  - cell "$1.69" [ref=e1796]
                  - cell "-0.41%" [ref=e1797]
                  - cell "$6.13M" [ref=e1798]
                  - cell "—" [ref=e1799]
                  - cell [ref=e1800]:
                    - button "📈 Chart" [ref=e1801]
                - button [ref=e1802] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1803]
                  - cell "Tambah JST ke watchlist JST JST JST" [ref=e1804]:
                    - generic [ref=e1805]:
                      - button "Tambah JST ke watchlist" [ref=e1806]: ☆
                      - generic "JST (JST)" [ref=e1807]:
                        - img "JST" [ref=e1808]
                      - generic [ref=e1809]: JST
                      - generic [ref=e1810]: JST
                  - cell "$0.1394" [ref=e1811]
                  - cell "-0.65%" [ref=e1812]
                  - cell "$5.71M" [ref=e1813]
                  - cell "—" [ref=e1814]
                  - cell [ref=e1815]:
                    - button "📈 Chart" [ref=e1816]
                - button [ref=e1817] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1818]
                  - cell "Tambah PENDLE ke watchlist PENDLE PENDLE PENDLE" [ref=e1819]:
                    - generic [ref=e1820]:
                      - button "Tambah PENDLE ke watchlist" [ref=e1821]: ☆
                      - generic "Pendle (PENDLE)" [ref=e1822]:
                        - img "PENDLE" [ref=e1823]
                      - generic [ref=e1824]: PENDLE
                      - generic [ref=e1825]: PENDLE
                  - cell "$2.09" [ref=e1826]
                  - cell "-8.11%" [ref=e1827]
                  - cell "$5.58M" [ref=e1828]
                  - cell "—" [ref=e1829]
                  - cell [ref=e1830]:
                    - button "📈 Chart" [ref=e1831]
                - button [ref=e1832] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1833]
                  - cell "Tambah SKHYB ke watchlist SKHYB SKHYB SKHYB" [ref=e1834]:
                    - generic [ref=e1835]:
                      - button "Tambah SKHYB ke watchlist" [ref=e1836]: ☆
                      - generic "SKHYB (SKHYB)" [ref=e1837]:
                        - img "SKHYB" [ref=e1838]
                      - generic [ref=e1839]: SKHYB
                      - generic [ref=e1840]: SKHYB
                  - cell "$170.73" [ref=e1841]
                  - cell "-4.91%" [ref=e1842]
                  - cell "$5.57M" [ref=e1843]
                  - cell "—" [ref=e1844]
                  - cell [ref=e1845]:
                    - button "📈 Chart" [ref=e1846]
                - button [ref=e1847] [cursor=pointer]:
                  - cell "🪙 Crypto" [ref=e1848]
                  - cell "Tambah BNCB ke watchlist BNCB BNCB BNCB" [ref=e1849]:
                    - generic [ref=e1850]:
                      - button "Tambah BNCB ke watchlist" [ref=e1851]: ☆
                      - generic "BNCB (BNCB)" [ref=e1852]:
                        - img "BNCB" [ref=e1853]
                      - generic [ref=e1854]: BNCB
                      - generic [ref=e1855]: BNCB
                  - cell "$5.03" [ref=e1856]
                  - cell "-9.37%" [ref=e1857]
                  - cell "$5.19M" [ref=e1858]
                  - cell "—" [ref=e1859]
                  - cell [ref=e1860]:
                    - button "📈 Chart" [ref=e1861]
                - button [ref=e1862] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e1863]
                  - cell "Tambah NVDA ke watchlist 🏛️ NVDA NVIDIA Corporation" [ref=e1864]:
                    - generic [ref=e1865]:
                      - button "Tambah NVDA ke watchlist" [ref=e1866]: ☆
                      - generic [ref=e1867]: 🏛️
                      - generic [ref=e1868]: NVDA
                      - generic [ref=e1869]: NVIDIA Corporation
                  - cell "$235.69" [ref=e1870]
                  - cell "-0.75%" [ref=e1871]
                  - cell "$33.71M" [ref=e1872]
                  - cell "$5.68T" [ref=e1873]
                  - cell [ref=e1874]:
                    - button "📈 Chart" [ref=e1875]
                - button [ref=e1876] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e1877]
                  - cell "Tambah AAPL ke watchlist 🏛️ AAPL Apple Inc." [ref=e1878]:
                    - generic [ref=e1879]:
                      - button "Tambah AAPL ke watchlist" [ref=e1880]: ☆
                      - generic [ref=e1881]: 🏛️
                      - generic [ref=e1882]: AAPL
                      - generic [ref=e1883]: Apple Inc.
                  - cell "$337.85" [ref=e1884]
                  - cell "+0.35%" [ref=e1885]
                  - cell "$7.29M" [ref=e1886]
                  - cell "$4.93T" [ref=e1887]
                  - cell [ref=e1888]:
                    - button "📈 Chart" [ref=e1889]
                - button [ref=e1890] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e1891]
                  - cell "Tambah MSFT ke watchlist 🏛️ MSFT Microsoft Corporation" [ref=e1892]:
                    - generic [ref=e1893]:
                      - button "Tambah MSFT ke watchlist" [ref=e1894]: ☆
                      - generic [ref=e1895]: 🏛️
                      - generic [ref=e1896]: MSFT
                      - generic [ref=e1897]: Microsoft Corporation
                  - cell "$530.80" [ref=e1898]
                  - cell "+0.20%" [ref=e1899]
                  - cell "$5.51M" [ref=e1900]
                  - cell "$3.94T" [ref=e1901]
                  - cell [ref=e1902]:
                    - button "📈 Chart" [ref=e1903]
                - button [ref=e1904] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e1905]
                  - cell "Tambah GOOGL ke watchlist 🏛️ GOOGL Alphabet Inc." [ref=e1906]:
                    - generic [ref=e1907]:
                      - button "Tambah GOOGL ke watchlist" [ref=e1908]: ☆
                      - generic [ref=e1909]: 🏛️
                      - generic [ref=e1910]: GOOGL
                      - generic [ref=e1911]: Alphabet Inc.
                  - cell "$348.75" [ref=e1912]
                  - cell "-0.50%" [ref=e1913]
                  - cell "$9.38M" [ref=e1914]
                  - cell "$4.25T" [ref=e1915]
                  - cell [ref=e1916]:
                    - button "📈 Chart" [ref=e1917]
                - button [ref=e1918] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e1919]
                  - cell "Tambah AMZN ke watchlist 🏛️ AMZN Amazon.com, Inc." [ref=e1920]:
                    - generic [ref=e1921]:
                      - button "Tambah AMZN ke watchlist" [ref=e1922]: ☆
                      - generic [ref=e1923]: 🏛️
                      - generic [ref=e1924]: AMZN
                      - generic [ref=e1925]: Amazon.com, Inc.
                  - cell "$257.85" [ref=e1926]
                  - cell "-0.80%" [ref=e1927]
                  - cell "$9.25M" [ref=e1928]
                  - cell "$2.78T" [ref=e1929]
                  - cell [ref=e1930]:
                    - button "📈 Chart" [ref=e1931]
                - button [ref=e1932] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e1933]
                  - cell "Tambah META ke watchlist 🏛️ META Meta Platforms, Inc." [ref=e1934]:
                    - generic [ref=e1935]:
                      - button "Tambah META ke watchlist" [ref=e1936]: ☆
                      - generic [ref=e1937]: 🏛️
                      - generic [ref=e1938]: META
                      - generic [ref=e1939]: Meta Platforms, Inc.
                  - cell "$719.66" [ref=e1940]
                  - cell "-0.23%" [ref=e1941]
                  - cell "$5.82M" [ref=e1942]
                  - cell "$1.83T" [ref=e1943]
                  - cell [ref=e1944]:
                    - button "📈 Chart" [ref=e1945]
                - button [ref=e1946] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e1947]
                  - cell "Tambah TSLA ke watchlist 🏛️ TSLA Tesla, Inc." [ref=e1948]:
                    - generic [ref=e1949]:
                      - button "Tambah TSLA ke watchlist" [ref=e1950]: ☆
                      - generic [ref=e1951]: 🏛️
                      - generic [ref=e1952]: TSLA
                      - generic [ref=e1953]: Tesla, Inc.
                  - cell "$372.02" [ref=e1954]
                  - cell "-1.53%" [ref=e1955]
                  - cell "$10.45M" [ref=e1956]
                  - cell "$1.47T" [ref=e1957]
                  - cell [ref=e1958]:
                    - button "📈 Chart" [ref=e1959]
                - button [ref=e1960] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e1961]
                  - cell "Tambah AMD ke watchlist 🏛️ AMD Advanced Micro Devices, Inc." [ref=e1962]:
                    - generic [ref=e1963]:
                      - button "Tambah AMD ke watchlist" [ref=e1964]: ☆
                      - generic [ref=e1965]: 🏛️
                      - generic [ref=e1966]: AMD
                      - generic [ref=e1967]: Advanced Micro Devices, Inc.
                  - cell "$634.48" [ref=e1968]
                  - cell "-1.76%" [ref=e1969]
                  - cell "$7.13M" [ref=e1970]
                  - cell "$1.04T" [ref=e1971]
                  - cell [ref=e1972]:
                    - button "📈 Chart" [ref=e1973]
                - button [ref=e1974] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e1975]
                  - cell "Tambah AVGO ke watchlist 🏛️ AVGO Broadcom Inc." [ref=e1976]:
                    - generic [ref=e1977]:
                      - button "Tambah AVGO ke watchlist" [ref=e1978]: ☆
                      - generic [ref=e1979]: 🏛️
                      - generic [ref=e1980]: AVGO
                      - generic [ref=e1981]: Broadcom Inc.
                  - cell "$371.26" [ref=e1982]
                  - cell "-1.39%" [ref=e1983]
                  - cell "$7.00M" [ref=e1984]
                  - cell "$1.77T" [ref=e1985]
                  - cell [ref=e1986]:
                    - button "📈 Chart" [ref=e1987]
                - button [ref=e1988] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e1989]
                  - cell "Tambah NFLX ke watchlist 🏛️ NFLX Netflix, Inc." [ref=e1990]:
                    - generic [ref=e1991]:
                      - button "Tambah NFLX ke watchlist" [ref=e1992]: ☆
                      - generic [ref=e1993]: 🏛️
                      - generic [ref=e1994]: NFLX
                      - generic [ref=e1995]: Netflix, Inc.
                  - cell "$71.08" [ref=e1996]
                  - cell "+1.98%" [ref=e1997]
                  - cell "$13.16M" [ref=e1998]
                  - cell "$295.97B" [ref=e1999]
                  - cell [ref=e2000]:
                    - button "📈 Chart" [ref=e2001]
                - button [ref=e2002] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e2003]
                  - cell "Tambah JPM ke watchlist 🏛️ JPM JP Morgan Chase & Co." [ref=e2004]:
                    - generic [ref=e2005]:
                      - button "Tambah JPM ke watchlist" [ref=e2006]: ☆
                      - generic [ref=e2007]: 🏛️
                      - generic [ref=e2008]: JPM
                      - generic [ref=e2009]: JP Morgan Chase & Co.
                  - cell "$326.56" [ref=e2010]
                  - cell "-0.92%" [ref=e2011]
                  - cell "$2.78M" [ref=e2012]
                  - cell "$868.06B" [ref=e2013]
                  - cell [ref=e2014]:
                    - button "📈 Chart" [ref=e2015]
                - button [ref=e2016] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e2017]
                  - cell "Tambah V ke watchlist 🏛️ V Visa Inc." [ref=e2018]:
                    - generic [ref=e2019]:
                      - button "Tambah V ke watchlist" [ref=e2020]: ☆
                      - generic [ref=e2021]: 🏛️
                      - generic [ref=e2022]: V
                      - generic [ref=e2023]: Visa Inc.
                  - cell "$375.40" [ref=e2024]
                  - cell "+0.89%" [ref=e2025]
                  - cell "$1.21M" [ref=e2026]
                  - cell "$700.89B" [ref=e2027]
                  - cell [ref=e2028]:
                    - button "📈 Chart" [ref=e2029]
                - button [ref=e2030] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e2031]
                  - cell "Tambah XOM ke watchlist 🏛️ XOM ExxonMobil Holdings Corporation" [ref=e2032]:
                    - generic [ref=e2033]:
                      - button "Tambah XOM ke watchlist" [ref=e2034]: ☆
                      - generic [ref=e2035]: 🏛️
                      - generic [ref=e2036]: XOM
                      - generic [ref=e2037]: ExxonMobil Holdings Corporation
                  - cell "$168.80" [ref=e2038]
                  - cell "+2.90%" [ref=e2039]
                  - cell "$3.86M" [ref=e2040]
                  - cell "$694.09B" [ref=e2041]
                  - cell [ref=e2042]:
                    - button "📈 Chart" [ref=e2043]
                - button [ref=e2044] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e2045]
                  - cell "Tambah COST ke watchlist 🏛️ COST Costco Wholesale Corporation" [ref=e2046]:
                    - generic [ref=e2047]:
                      - button "Tambah COST ke watchlist" [ref=e2048]: ☆
                      - generic [ref=e2049]: 🏛️
                      - generic [ref=e2050]: COST
                      - generic [ref=e2051]: Costco Wholesale Corporation
                  - cell "$949.67" [ref=e2052]
                  - cell "+0.79%" [ref=e2053]
                  - cell "$538.66K" [ref=e2054]
                  - cell "$420.96B" [ref=e2055]
                  - cell [ref=e2056]:
                    - button "📈 Chart" [ref=e2057]
                - button [ref=e2058] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e2059]
                  - cell "Tambah UNH ke watchlist 🏛️ UNH UnitedHealth Group Incorporated" [ref=e2060]:
                    - generic [ref=e2061]:
                      - button "Tambah UNH ke watchlist" [ref=e2062]: ☆
                      - generic [ref=e2063]: 🏛️
                      - generic [ref=e2064]: UNH
                      - generic [ref=e2065]: UnitedHealth Group Incorporated
                  - cell "$371.86" [ref=e2066]
                  - cell "-1.10%" [ref=e2067]
                  - cell "$1.27M" [ref=e2068]
                  - cell "$333.78B" [ref=e2069]
                  - cell [ref=e2070]:
                    - button "📈 Chart" [ref=e2071]
                - button [ref=e2072] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e2073]
                  - cell "Tambah PLTR ke watchlist 🏛️ PLTR Palantir Technologies Inc." [ref=e2074]:
                    - generic [ref=e2075]:
                      - button "Tambah PLTR ke watchlist" [ref=e2076]: ☆
                      - generic [ref=e2077]: 🏛️
                      - generic [ref=e2078]: PLTR
                      - generic [ref=e2079]: Palantir Technologies Inc.
                  - cell "$198.82" [ref=e2080]
                  - cell "+2.42%" [ref=e2081]
                  - cell "$26.22M" [ref=e2082]
                  - cell "$477.77B" [ref=e2083]
                  - cell [ref=e2084]:
                    - button "📈 Chart" [ref=e2085]
                - button [ref=e2086] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e2087]
                  - cell "Tambah INTC ke watchlist 🏛️ INTC Intel Corporation" [ref=e2088]:
                    - generic [ref=e2089]:
                      - button "Tambah INTC ke watchlist" [ref=e2090]: ☆
                      - generic [ref=e2091]: 🏛️
                      - generic [ref=e2092]: INTC
                      - generic [ref=e2093]: Intel Corporation
                  - cell "$109.22" [ref=e2094]
                  - cell "-3.45%" [ref=e2095]
                  - cell "$41.01M" [ref=e2096]
                  - cell "$577.35B" [ref=e2097]
                  - cell [ref=e2098]:
                    - button "📈 Chart" [ref=e2099]
                - button [ref=e2100] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e2101]
                  - cell "Tambah DIS ke watchlist 🏛️ DIS Walt Disney Company (The)" [ref=e2102]:
                    - generic [ref=e2103]:
                      - button "Tambah DIS ke watchlist" [ref=e2104]: ☆
                      - generic [ref=e2105]: 🏛️
                      - generic [ref=e2106]: DIS
                      - generic [ref=e2107]: Walt Disney Company (The)
                  - cell "$105.58" [ref=e2108]
                  - cell "+0.79%" [ref=e2109]
                  - cell "$1.40M" [ref=e2110]
                  - cell "$182.30B" [ref=e2111]
                  - cell [ref=e2112]:
                    - button "📈 Chart" [ref=e2113]
                - button [ref=e2114] [cursor=pointer]:
                  - cell "🇺🇸 Saham US" [ref=e2115]
                  - cell "Tambah BA ke watchlist 🏛️ BA Boeing Company (The)" [ref=e2116]:
                    - generic [ref=e2117]:
                      - button "Tambah BA ke watchlist" [ref=e2118]: ☆
                      - generic [ref=e2119]: 🏛️
                      - generic [ref=e2120]: BA
                      - generic [ref=e2121]: Boeing Company (The)
                  - cell "$185.36" [ref=e2122]
                  - cell "-1.57%" [ref=e2123]
                  - cell "$2.94M" [ref=e2124]
                  - cell "$146.50B" [ref=e2125]
                  - cell [ref=e2126]:
                    - button "📈 Chart" [ref=e2127]
                - button [ref=e2128] [cursor=pointer]:
                  - cell "💱 Forex" [ref=e2129]
                  - cell "Tambah EURUSD ke watchlist 💱 EURUSD EURO / U.S. DOLLAR" [ref=e2130]:
                    - generic [ref=e2131]:
                      - button "Tambah EURUSD ke watchlist" [ref=e2132]: ☆
                      - generic [ref=e2133]: 💱
                      - generic [ref=e2134]: EURUSD
                      - generic [ref=e2135]: EURO / U.S. DOLLAR
                  - cell "$1.12" [ref=e2136]
                  - cell "-0.05%" [ref=e2137]
                  - cell "$0.00" [ref=e2138]
                  - cell "—" [ref=e2139]
                  - cell [ref=e2140]:
                    - button "📈 Chart" [ref=e2141]
                - button [ref=e2142] [cursor=pointer]:
                  - cell "💱 Forex" [ref=e2143]
                  - cell "Tambah USDJPY ke watchlist 💱 USDJPY U.S. DOLLAR / JAPANESE YEN" [ref=e2144]:
                    - generic [ref=e2145]:
                      - button "Tambah USDJPY ke watchlist" [ref=e2146]: ☆
                      - generic [ref=e2147]: 💱
                      - generic [ref=e2148]: USDJPY
                      - generic [ref=e2149]: U.S. DOLLAR / JAPANESE YEN
                  - cell "$158.34" [ref=e2150]
                  - cell "+0.19%" [ref=e2151]
                  - cell "$0.00" [ref=e2152]
                  - cell "—" [ref=e2153]
                  - cell [ref=e2154]:
                    - button "📈 Chart" [ref=e2155]
                - button [ref=e2156] [cursor=pointer]:
                  - cell "💱 Forex" [ref=e2157]
                  - cell "Tambah GBPUSD ke watchlist 💱 GBPUSD BRITISH POUND / U.S. DOLLAR" [ref=e2158]:
                    - generic [ref=e2159]:
                      - button "Tambah GBPUSD ke watchlist" [ref=e2160]: ☆
                      - generic [ref=e2161]: 💱
                      - generic [ref=e2162]: GBPUSD
                      - generic [ref=e2163]: BRITISH POUND / U.S. DOLLAR
                  - cell "$1.32" [ref=e2164]
                  - cell "-0.03%" [ref=e2165]
                  - cell "$0.00" [ref=e2166]
                  - cell "—" [ref=e2167]
                  - cell [ref=e2168]:
                    - button "📈 Chart" [ref=e2169]
                - button [ref=e2170] [cursor=pointer]:
                  - cell "💱 Forex" [ref=e2171]
                  - cell "Tambah AUDUSD ke watchlist 💱 AUDUSD AUSTRALIAN DOLLAR / U.S. DOLLAR" [ref=e2172]:
                    - generic [ref=e2173]:
                      - button "Tambah AUDUSD ke watchlist" [ref=e2174]: ☆
                      - generic [ref=e2175]: 💱
                      - generic [ref=e2176]: AUDUSD
                      - generic [ref=e2177]: AUSTRALIAN DOLLAR / U.S. DOLLAR
                  - cell "$0.6946" [ref=e2178]
                  - cell "-0.20%" [ref=e2179]
                  - cell "$0.00" [ref=e2180]
                  - cell "—" [ref=e2181]
                  - cell [ref=e2182]:
                    - button "📈 Chart" [ref=e2183]
                - button [ref=e2184] [cursor=pointer]:
                  - cell "💱 Forex" [ref=e2185]
                  - cell "Tambah USDCAD ke watchlist 💱 USDCAD U.S. DOLLAR / CANADIAN DOLLAR" [ref=e2186]:
                    - generic [ref=e2187]:
                      - button "Tambah USDCAD ke watchlist" [ref=e2188]: ☆
                      - generic [ref=e2189]: 💱
                      - generic [ref=e2190]: USDCAD
                      - generic [ref=e2191]: U.S. DOLLAR / CANADIAN DOLLAR
                  - cell "$1.42" [ref=e2192]
                  - cell "-0.05%" [ref=e2193]
                  - cell "$0.00" [ref=e2194]
                  - cell "—" [ref=e2195]
                  - cell [ref=e2196]:
                    - button "📈 Chart" [ref=e2197]
                - button [ref=e2198] [cursor=pointer]:
                  - cell "💱 Forex" [ref=e2199]
                  - cell "Tambah USDCHF ke watchlist 💱 USDCHF U.S. DOLLAR / SWISS FRANC" [ref=e2200]:
                    - generic [ref=e2201]:
                      - button "Tambah USDCHF ke watchlist" [ref=e2202]: ☆
                      - generic [ref=e2203]: 💱
                      - generic [ref=e2204]: USDCHF
                      - generic [ref=e2205]: U.S. DOLLAR / SWISS FRANC
                  - cell "$0.8334" [ref=e2206]
                  - cell "+0.08%" [ref=e2207]
                  - cell "$0.00" [ref=e2208]
                  - cell "—" [ref=e2209]
                  - cell [ref=e2210]:
                    - button "📈 Chart" [ref=e2211]
                - button [ref=e2212] [cursor=pointer]:
                  - cell "💱 Forex" [ref=e2213]
                  - cell "Tambah NZDUSD ke watchlist 💱 NZDUSD NEW ZEALAND DOLLAR / U.S. DOLLAR" [ref=e2214]:
                    - generic [ref=e2215]:
                      - button "Tambah NZDUSD ke watchlist" [ref=e2216]: ☆
                      - generic [ref=e2217]: 💱
                      - generic [ref=e2218]: NZDUSD
                      - generic [ref=e2219]: NEW ZEALAND DOLLAR / U.S. DOLLAR
                  - cell "$0.5592" [ref=e2220]
                  - cell "-0.11%" [ref=e2221]
                  - cell "$0.00" [ref=e2222]
                  - cell "—" [ref=e2223]
                  - cell [ref=e2224]:
                    - button "📈 Chart" [ref=e2225]
                - button [ref=e2226] [cursor=pointer]:
                  - cell "💱 Forex" [ref=e2227]
                  - cell "Tambah USDCNH ke watchlist 💱 USDCNH U.S. DOLLAR / OFFSHORE CHINESE YUAN" [ref=e2228]:
                    - generic [ref=e2229]:
                      - button "Tambah USDCNH ke watchlist" [ref=e2230]: ☆
                      - generic [ref=e2231]: 💱
                      - generic [ref=e2232]: USDCNH
                      - generic [ref=e2233]: U.S. DOLLAR / OFFSHORE CHINESE YUAN
                  - cell "$6.71" [ref=e2234]
                  - cell "+0.03%" [ref=e2235]
                  - cell "$0.00" [ref=e2236]
                  - cell "—" [ref=e2237]
                  - cell [ref=e2238]:
                    - button "📈 Chart" [ref=e2239]
                - button [ref=e2240] [cursor=pointer]:
                  - cell "💱 Forex" [ref=e2241]
                  - cell "Tambah USDIDR ke watchlist 💱 USDIDR U.S. DOLLAR / INDONESIAN RUPIAH" [ref=e2242]:
                    - generic [ref=e2243]:
                      - button "Tambah USDIDR ke watchlist" [ref=e2244]: ☆
                      - generic [ref=e2245]: 💱
                      - generic [ref=e2246]: USDIDR
                      - generic [ref=e2247]: U.S. DOLLAR / INDONESIAN RUPIAH
                  - cell "$17,885.00" [ref=e2248]
                  - cell "+0.06%" [ref=e2249]
                  - cell "$0.00" [ref=e2250]
                  - cell "—" [ref=e2251]
                  - cell [ref=e2252]:
                    - button "📈 Chart" [ref=e2253]
                - button [ref=e2254] [cursor=pointer]:
                  - cell "💱 Forex" [ref=e2255]
                  - cell "Tambah USDSGD ke watchlist 💱 USDSGD U.S. DOLLAR / SINGAPORE DOLLAR" [ref=e2256]:
                    - generic [ref=e2257]:
                      - button "Tambah USDSGD ke watchlist" [ref=e2258]: ☆
                      - generic [ref=e2259]: 💱
                      - generic [ref=e2260]: USDSGD
                      - generic [ref=e2261]: U.S. DOLLAR / SINGAPORE DOLLAR
                  - cell "$1.28" [ref=e2262]
                  - cell "+0.21%" [ref=e2263]
                  - cell "$0.00" [ref=e2264]
                  - cell "—" [ref=e2265]
                  - cell [ref=e2266]:
                    - button "📈 Chart" [ref=e2267]
                - button [ref=e2268] [cursor=pointer]:
                  - cell "🛢️ Komoditas" [ref=e2269]
                  - cell "Tambah GOLD ke watchlist 🛢️ GOLD Gold" [ref=e2270]:
                    - generic [ref=e2271]:
                      - button "Tambah GOLD ke watchlist" [ref=e2272]: ☆
                      - generic [ref=e2273]: 🛢️
                      - generic [ref=e2274]: GOLD
                      - generic [ref=e2275]: Gold
                  - cell "$4,111.58" [ref=e2276]
                  - cell "+0.02%" [ref=e2277]
                  - cell "$0.00" [ref=e2278]
                  - cell "—" [ref=e2279]
                  - cell [ref=e2280]:
                    - button "📈 Chart" [ref=e2281]
                - button [ref=e2282] [cursor=pointer]:
                  - cell "🛢️ Komoditas" [ref=e2283]
                  - cell "Tambah SILVER ke watchlist 🛢️ SILVER Silver" [ref=e2284]:
                    - generic [ref=e2285]:
                      - button "Tambah SILVER ke watchlist" [ref=e2286]: ☆
                      - generic [ref=e2287]: 🛢️
                      - generic [ref=e2288]: SILVER
                      - generic [ref=e2289]: Silver
                  - cell "$58.73" [ref=e2290]
                  - cell "-1.77%" [ref=e2291]
                  - cell "$0.00" [ref=e2292]
                  - cell "—" [ref=e2293]
                  - cell [ref=e2294]:
                    - button "📈 Chart" [ref=e2295]
                - button [ref=e2296] [cursor=pointer]:
                  - cell "🛢️ Komoditas" [ref=e2297]
                  - cell "Tambah DXY ke watchlist 🛢️ DXY U.S. Dollar Currency Index" [ref=e2298]:
                    - generic [ref=e2299]:
                      - button "Tambah DXY ke watchlist" [ref=e2300]: ☆
                      - generic [ref=e2301]: 🛢️
                      - generic [ref=e2302]: DXY
                      - generic [ref=e2303]: U.S. Dollar Currency Index
                  - cell "$102.33" [ref=e2304]
                  - cell "+0.08%" [ref=e2305]
                  - cell "—" [ref=e2306]
                  - cell "—" [ref=e2307]
                  - cell [ref=e2308]:
                    - button "📈 Chart" [ref=e2309]
                - button [ref=e2310] [cursor=pointer]:
                  - cell "🛢️ Komoditas" [ref=e2311]
                  - cell "Tambah PLATINUM ke watchlist 🛢️ PLATINUM Platinum" [ref=e2312]:
                    - generic [ref=e2313]:
                      - button "Tambah PLATINUM ke watchlist" [ref=e2314]: ☆
                      - generic [ref=e2315]: 🛢️
                      - generic [ref=e2316]: PLATINUM
                      - generic [ref=e2317]: Platinum
                  - cell "$1,627.60" [ref=e2318]
                  - cell "-0.37%" [ref=e2319]
                  - cell "$0.00" [ref=e2320]
                  - cell "—" [ref=e2321]
                  - cell [ref=e2322]:
                    - button "📈 Chart" [ref=e2323]
          - generic [ref=e2324]:
            - generic [ref=e2326]:
              - heading "Trending & Topik" [level=3] [ref=e2327]
              - generic [ref=e2328]: Paling dicari dan paling diliput hari ini
            - generic [ref=e2329]:
              - generic [ref=e2330] [cursor=pointer]:
                - generic [ref=e2331]: "1"
                - button "Tambah SIMD ke watchlist" [ref=e2332]: ☆
                - generic "SIMD (SIMD)" [ref=e2333]:
                  - img "SIMD" [ref=e2334]
                - generic [ref=e2335]:
                  - generic [ref=e2336]: SIMD
                  - generic [ref=e2337]: Super Intelligent Identity
                - generic [ref=e2338]:
                  - generic [ref=e2339]: $0.0214
                  - generic [ref=e2340]: +19.79%
              - generic [ref=e2341] [cursor=pointer]:
                - generic [ref=e2342]: "2"
                - button "Tambah DRV ke watchlist" [ref=e2343]: ☆
                - generic "DRV (DRV)" [ref=e2344]:
                  - img "DRV" [ref=e2345]
                - generic [ref=e2346]:
                  - generic [ref=e2347]: DRV
                  - generic [ref=e2348]: Derive
                - generic [ref=e2349]:
                  - generic [ref=e2350]: $0.4123
                  - generic [ref=e2351]: +11.44%
              - generic [ref=e2352] [cursor=pointer]:
                - generic [ref=e2353]: "3"
                - button "Tambah QTC ke watchlist" [ref=e2354]: ☆
                - generic "QTC (QTC)" [ref=e2355]:
                  - img "QTC" [ref=e2356]
                - generic [ref=e2357]:
                  - generic [ref=e2358]: QTC
                  - generic [ref=e2359]: Quantus
                - generic [ref=e2360]:
                  - generic [ref=e2361]: $168.50
                  - generic [ref=e2362]: +65.67%
              - generic [ref=e2363] [cursor=pointer]:
                - generic [ref=e2364]: "4"
                - button "Tambah BTC ke watchlist" [ref=e2365]: ☆
                - generic "Bitcoin (BTC)" [ref=e2366]:
                  - img "BTC" [ref=e2367]
                - generic [ref=e2368]:
                  - generic [ref=e2369]: BTC
                  - generic [ref=e2370]: Bitcoin
                - generic [ref=e2371]:
                  - generic [ref=e2372]: $81,207.90
                  - generic [ref=e2373]: "-2.51%"
              - generic [ref=e2374] [cursor=pointer]:
                - generic [ref=e2375]: "5"
                - button "Tambah NEAR ke watchlist" [ref=e2376]: ☆
                - generic "NEAR Protocol (NEAR)" [ref=e2377]:
                  - img "NEAR" [ref=e2378]
                - generic [ref=e2379]:
                  - generic [ref=e2380]: NEAR
                  - generic [ref=e2381]: NEAR Protocol
                - generic [ref=e2382]:
                  - generic [ref=e2383]: $4.69
                  - generic [ref=e2384]: "-7.05%"
              - generic [ref=e2385] [cursor=pointer]:
                - generic [ref=e2386]: "6"
                - button "Tambah PRL ke watchlist" [ref=e2387]: ☆
                - generic "PRL (PRL)" [ref=e2388]:
                  - img "PRL" [ref=e2389]
                - generic [ref=e2390]:
                  - generic [ref=e2391]: PRL
                  - generic [ref=e2392]: Pearl
                - generic [ref=e2393]:
                  - generic [ref=e2394]: $1.42
                  - generic [ref=e2395]: +5.61%
              - generic [ref=e2396] [cursor=pointer]:
                - generic [ref=e2397]: "7"
                - button "Tambah TRUMP ke watchlist" [ref=e2398]: ☆
                - generic "TRUMP (TRUMP)" [ref=e2399]:
                  - img "TRUMP" [ref=e2400]
                - generic [ref=e2401]:
                  - generic [ref=e2402]: TRUMP
                  - generic [ref=e2403]: Official Trump
                - generic [ref=e2404]:
                  - generic [ref=e2405]: $1.78
                  - generic [ref=e2406]: "-3.89%"
              - generic [ref=e2407] [cursor=pointer]:
                - generic [ref=e2408]: "8"
                - button "Tambah PENGU ke watchlist" [ref=e2409]: ☆
                - generic "PENGU (PENGU)" [ref=e2410]:
                  - img "PENGU" [ref=e2411]
                - generic [ref=e2412]:
                  - generic [ref=e2413]: PENGU
                  - generic [ref=e2414]: Pudgy Penguins
                - generic [ref=e2415]:
                  - generic [ref=e2416]: $0.00791553
                  - generic [ref=e2417]: "-7.27%"
            - generic [ref=e2418]:
              - generic [ref=e2419]: Jumlah berita per topik dari Live News Wire (bukan media sosial)
              - generic [ref=e2420]: Belum ada berita yang bisa dikelompokkan.
        - generic [ref=e2421]:
          - strong [ref=e2422]: "Sumber data:"
          - text: Binance Vision (tabel koin, top gainers, grafik BTC) · CoinGecko (market cap global, dominasi, trending) · Hyperliquid (open interest & funding) · TradingView (saham US, forex, komoditas) · alternative.me (Fear & Greed).
          - strong [ref=e2423]: "Tidak ditampilkan:"
          - text: ETF Flows, Likuidasi 24 Jam, Community Posts, dan Altcoin Season Index (belum ada sumber data publik gratis, jadi panelnya dikosongkan daripada diisi angka perkiraan).
          - strong [ref=e2424]: "Catatan grafik:"
          - text: grafik market cap menampilkan kapitalisasi pasar BTC, bukan seluruh pasar kripto. Tidak ada sumber gratis yang menyediakan seri total market cap.
    - contentinfo [ref=e2425]:
      - 'button "🛡️ FEED HEALTH: 🟡 DEGRADED IDX BEI: 🟢 850 STOCKS Binance WS: 🟢 CONNECTED Macro Bundle: 🔴 STALE (999m) Gemini LLM: 🟢 3.8-FLASH MCP Server: 🟢 READY AUDIT PROVENANCE & FRESHNESS ↗" [ref=e2426] [cursor=pointer]':
        - generic [ref=e2427]:
          - generic [ref=e2428]: "🛡️ FEED HEALTH: 🟡 DEGRADED"
          - generic [ref=e2429]:
            - text: "IDX BEI:"
            - strong [ref=e2430]: 🟢 850 STOCKS
          - generic [ref=e2431]:
            - text: "Binance WS:"
            - strong [ref=e2432]: 🟢 CONNECTED
          - generic [ref=e2433]:
            - text: "Macro Bundle:"
            - strong [ref=e2434]: 🔴 STALE (999m)
          - generic [ref=e2435]:
            - text: "Gemini LLM:"
            - strong [ref=e2436]: 🟢 3.8-FLASH
          - generic [ref=e2437]:
            - text: "MCP Server:"
            - strong [ref=e2438]: 🟢 READY
        - generic [ref=e2439]: AUDIT PROVENANCE & FRESHNESS ↗
      - generic [ref=e2440]:
        - generic [ref=e2441]:
          - strong [ref=e2442]: DISCLAIMER
          - text: ": Algorithmic screening & quantitative intelligence only. Bukan ajakan atau nasihat investasi."
        - generic [ref=e2443]: MBG QUANT TERMINAL // MARKET BRAIN GRID · ZERO RUNTIME COST
```

# Test source

```ts
  1   | import { test, expect, gotoCockpitRoute } from './fixtures.js';
  2   | 
  3   | /**
  4   |  * Route coverage: every navigable page must mount inside the authenticated shell
  5   |  * and render content specific to that page.
  6   |  *
  7   |  * HISTORY — this file was WRONG on its first run and the mistake is worth
  8   |  * keeping in the record. It passed 23/23 while asserting nothing: with no
  9   |  * session fixture, App.jsx served LandingPage for every `?tab=` value, so all
  10  |  * 18 route tests were checking the same page. `gotoCockpitRoute` now waits for
  11  |  * `.cmc-topnav`, which only exists inside the authenticated shell, so this
  12  |  * failure mode cannot recur silently.
  13  |  *
  14  |  * The `marker` is a page-specific string. A test that only asserts "body is not
  15  |  * empty" would pass on the wrong page; requiring the marker is what makes each
  16  |  * row prove its own route.
  17  |  */
  18  | 
  19  | const ROUTES = [
  20  |   { id: 'HOME', marker: /market overview|kapitalisasi|semua aset/i },
  21  |   { id: 'SIGNALS', marker: /sinyal|signal|entry/i },
  22  |   { id: 'AI_AGENTS', marker: /arena|agent|elemen|bot/i },
  23  |   { id: 'CHARTING', marker: /chart|grafik|candle|tradingview/i },
  24  |   { id: 'HEATMAP', marker: /heatmap|peta|panas/i },
  25  |   { id: 'CRYPTO', marker: /crypto|order book|bids|asks|harga/i },
  26  |   { id: 'STOCK', marker: /saham|stock|idx|emiten/i },
  27  |   { id: 'FOREX', marker: /forex|komoditas|emas|gold|oil/i },
  28  |   { id: 'NEWS', marker: /berita|news|headline/i },
  29  |   { id: 'WHALES', marker: /whale|paus|on-chain|dompet/i },
  30  |   { id: 'ECONOMIC_CALENDAR', marker: /kalender|calendar|event|rilis/i },
  31  |   { id: 'ACADEMY', marker: /academy|materi|belajar|kurikulum/i },
  32  |   { id: 'PEARSON_CORRELATION', marker: /korelasi|correlation|pearson|matriks/i },
  33  |   { id: 'TESTING', marker: /backtest|testing|strategi|lab/i },
  34  |   { id: 'WATCHLIST', marker: /watchlist|pantau|bintang/i },
  35  |   { id: 'SETTINGS', marker: /setting|bahasa|tema|theme|tampilan/i },
  36  |   { id: 'ACHIEVEMENTS', marker: /legend|achievement|achievement selesai/i },
  37  |   { id: 'SUBSCRIPTION', marker: /langganan|paket|pro|harga/i },
  38  | ];
  39  | 
  40  | test.describe('cockpit routes', () => {
  41  |   for (const route of ROUTES) {
  42  |     test(`${route.id} mounts and shows its own content`, async ({ authedPage: page }) => {
  43  |       const pageErrors = [];
  44  |       page.on('pageerror', e => pageErrors.push(e.message));
  45  | 
  46  |       await gotoCockpitRoute(page, route.id);
  47  | 
  48  |       const text = await page.locator('body').innerText();
  49  | 
  50  |       // 1. The authenticated shell is present. If the session fixture broke,
  51  |       //    this fails loudly instead of silently testing the landing page.
  52  |       await expect(page.locator('.cmc-topnav')).toBeVisible();
  53  | 
  54  |       // 2. Not the landing page.
  55  |       expect(text, `${route.id} served the landing page instead of the cockpit`)
  56  |         .not.toMatch(/sudah punya akun\?|daftar gratis/i);
  57  | 
  58  |       // 3. Not the unknown-module lock screen (a route with no branch).
  59  |       expect(text, `${route.id} hit the unknown-module fallback`)
  60  |         .not.toMatch(/modul tidak dikenal|unknown module/i);
  61  | 
  62  |       // 4. This route's own content is on screen.
  63  |       expect(text, `${route.id} did not render its expected content`).toMatch(route.marker);
  64  | 
  65  |       // 5. Nothing threw.
  66  |       expect(pageErrors, `${route.id} threw`).toEqual([]);
  67  |     });
  68  |   }
  69  | });
  70  | 
  71  | test.describe('navigation reaches every route by clicking, not by URL', () => {
  72  |   /**
  73  |    * The URL tests above drive the router directly. This one drives the actual
  74  |    * nav, because a menu entry pointing at an unrouted id is exactly the bug the
  75  |    * owner reported for Live News Wire.
  76  |    */
  77  |   test('the Account menu reaches Legend Path and it renders', async ({ authedPage: page }) => {
  78  |     await gotoCockpitRoute(page, 'HOME');
  79  | 
  80  |     const accountBtn = page.getByRole('button', { name: /Account/i }).first();
  81  |     await accountBtn.click();
  82  |     await page.waitForTimeout(300);
  83  |     await page.getByRole('menuitem', { name: /Legend Path/i }).click();
  84  |     await page.waitForTimeout(700);
  85  | 
  86  |     const text = await page.locator('body').innerText();
> 87  |     expect(text).toMatch(/legend path/i);
      |                  ^ Error: expect(received).toMatch(expected)
  88  |     expect(text).toMatch(/achievement/i);
  89  |   });
  90  | 
  91  |   test('the Trade menu reaches Live News Wire and it renders content', async ({ authedPage: page }) => {
  92  |     await gotoCockpitRoute(page, 'HOME');
  93  | 
  94  |     // News lives under Research & Learn in the current nav model.
  95  |     const researchBtn = page.getByRole('button', { name: /Research/i }).first();
  96  |     await researchBtn.click();
  97  |     await page.waitForTimeout(300);
  98  |     await page.getByRole('menuitem', { name: /Live News Wire/i }).click();
  99  |     await page.waitForTimeout(800);
  100 | 
  101 |     const text = await page.locator('body').innerText();
  102 |     // The regression: this used to fall through to the fallback desk.
  103 |     expect(text).not.toMatch(/modul tidak dikenal/i);
  104 |     expect(text).toMatch(/berita|news|headline|wire/i);
  105 |   });
  106 | });
  107 | 
```