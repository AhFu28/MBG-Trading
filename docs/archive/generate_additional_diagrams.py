# -*- coding: utf-8 -*-
"""
MBG QUANT ACADEMY - ADDITIONAL VISUAL DIAGRAMS (DIAGRAM 7 - 10)
Menghasilkan 4 diagram visual institusional pelengkap (DPI 300)
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUTPUT_DIR = os.path.join("COMPILE PRD", "figures")
os.makedirs(OUTPUT_DIR, exist_ok=True)

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['DejaVu Sans', 'Arial', 'Helvetica'],
    'figure.autolayout': False,
    'figure.dpi': 300,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight',
    'axes.edgecolor': '#94A3B8',
    'axes.linewidth': 0.8,
})

COLORS = {
    'bg': '#FFFFFF',
    'card_bg': '#F8FAFC',
    'text_main': '#0F172A',
    'text_sub': '#475569',
    'accent': '#0284C7',
    'bullish': '#10B981',
    'bullish_dark': '#047857',
    'bearish': '#EF4444',
    'bearish_dark': '#B91C1C',
    'gold': '#F59E0B',
    'purple': '#7C3AED',
    'grid': '#E2E8F0',
    'border': '#CBD5E1'
}

def draw_candle(ax, x, o, h, l, c, width=0.55, bullish_col=COLORS['bullish'], bearish_col=COLORS['bearish']):
    is_bullish = c >= o
    color = bullish_col if is_bullish else bearish_col
    ax.vlines(x, l, h, color=color, linewidth=1.6, zorder=3)
    y_body = min(o, c)
    height = abs(c - o)
    if height < 0.05:
        height = 0.05
    rect = patches.Rectangle(
        (x - width/2, y_body), width, height,
        facecolor=color, edgecolor=color, alpha=0.92, zorder=4
    )
    ax.add_patch(rect)


# =========================================================
# 7. DIAGRAM 7: LIQUIDITY SWEEP / TURTLE SOUP & REJECTION WICK
# =========================================================
def generate_diagram_7():
    print("[7/10] Menghasilkan Diagram Liquidity Sweep / Turtle Soup...")
    fig, ax = plt.subplots(figsize=(16, 8.5))
    fig.patch.set_facecolor(COLORS['bg'])
    ax.set_facecolor(COLORS['card_bg'])

    # Data Candlestick Formasi Sweep Support
    candles = [
        (1, 105, 108, 102, 103),  # Down
        (2, 103, 104, 99.5, 100), # Swing Low Support 1 (100)
        (3, 100, 106, 99.8, 105), # Bounce
        (4, 105, 107, 103, 106),  # Swing High
        (5, 106, 106.5, 101, 101.5),# Pullback
        (6, 101.5, 103, 100.2, 101),# Konsolidasi di atas Support
        (7, 101, 101.5, 94.0, 102.5),# SWEEP CANDLE (Jarum Menusuk ke 94, Reclaim ke 102.5!)
        (8, 102.5, 109, 102, 108.5), # Bullish Expansion
        (9, 108.5, 114, 107.5, 113.5),# Markup
        (10, 113.5, 118, 112, 117.5) # Markup lanjut
    ]

    for x, o, h, l, c in candles:
        # Warna khusus untuk candle ke-7 (Sweep Rejection)
        b_col = '#059669' if x == 7 else COLORS['bullish']
        draw_candle(ax, x, o, h, l, c, width=0.55, bullish_col=b_col)

    # Garis Support Kunci Ritel (Level 100)
    ax.axhline(100, color='#DC2626', linestyle='--', linewidth=1.8, label='Support Kunci Ritel (Rp 100 / $60.000)')
    ax.text(0.5, 100.4, "SUPPORT KUNCI RITEL", fontsize=9, fontweight='bold', color='#DC2626')

    # Kolam Stop Loss Ritel (Sell Stop Liquidity Pool)
    pool_rect = patches.Rectangle((1.5, 94), 6, 6, facecolor='#FEE2E2', edgecolor='#EF4444', linestyle=':', alpha=0.5, zorder=2)
    ax.add_patch(pool_rect)
    ax.text(4.5, 96.5, "KOLAM LIKUIDITAS STOP LOSS RITEL\n(Sell Stops & Posisi Long Ritel Terlikuidasi)", ha='center', fontsize=8.5, fontweight='bold', color='#B91C1C')

    # Anotasi Jarum Rejection Wick (Candle 7)
    ax.annotate("TURTLE SOUP SWEEP!\nJarum menusuk Support 100 -> 94\nMenyapu Stop Loss Ritel senilai jutaan lot\nLalu memantul ditutup di ATAS 100 (Reclaim)!",
                xy=(7, 94), xytext=(7.5, 90.5),
                arrowprops=dict(arrowstyle="->", color='#059669', lw=2.0),
                fontsize=9, fontweight='bold', color='#047857',
                bbox=dict(boxstyle="round,pad=0.5", fc="#DCFCE7", ec='#059669', lw=1.2))

    # Anotasi Titik Masuk Disiplin (Optimal Entry)
    ax.annotate("TITIK MASUK OPTIMAL (ENTRY RECLAIM):\nBeli saat candle Daily ditutup kembali di atas 100\nPasang Stop Loss Saklek di 93.5 (bawah jarum sweep)\nRisk/Reward Asimetris > 1:4!",
                xy=(8, 103), xytext=(8.5, 98),
                arrowprops=dict(arrowstyle="->", color='#0284C7', lw=1.8),
                fontsize=8.5, fontweight='bold', color='#0369A1',
                bbox=dict(boxstyle="round,pad=0.4", fc="#E0F2FE", ec='#0284C7', lw=1.2))

    # Anotasi Target Profit Swing High
    ax.annotate("TARGET TAKE PROFIT (SWING HIGH):\nLikuidasi Beli di Pucuk Struktur",
                xy=(10, 117.5), xytext=(8.2, 119),
                arrowprops=dict(arrowstyle="->", color='#047857', lw=1.5),
                fontsize=8.5, fontweight='bold', color='#047857',
                bbox=dict(boxstyle="round,pad=0.3", fc="#ECFDF5", ec='#10B981', lw=1.0))

    # Kotak Doktrin Pemula
    doktrin = (
        "DOKTRIN LIQUIDITY SWEEP UNTUK PEMULA:\n"
        "1. JANGAN letakkan Stop Loss persis di bawah garis support bulat (itu makanan empuk bandar).\n"
        "2. JANGAN panik saat melihat candle menembus support sesaat (tunggu penutupan body candle).\n"
        "3. JIKA harga menusuk support lalu ditutup kembali ke atas (wick panjang), itu sinyal BELI terkuat!\n"
        "4. Trik ini terjadi di Saham BBRI Rp 4.150 dan Bitcoin $60.000 sebelum reli kencang."
    )
    ax.text(1.2, 112, doktrin, fontsize=8.5, fontweight='bold', color='#0F172A',
            bbox=dict(boxstyle="round,pad=0.6", fc="#F8FAFC", ec='#475569', lw=1.2))

    ax.set_xlim(0, 11.5)
    ax.set_ylim(88, 122)
    ax.set_xlabel("Siklus Waktu Candlestick (Time Frame Harian / 4 Jam)", fontsize=9.5, fontweight='bold', color=COLORS['text_sub'])
    ax.set_ylabel("Tingkat Harga Saham / Kripto", fontsize=9.5, fontweight='bold', color=COLORS['text_sub'])
    ax.set_title("MBG QUANT ACADEMY // MODUL 3: ANATOMI LIQUIDITY SWEEP / TURTLE SOUP & REJECTION WICK",
                 fontsize=12.5, fontweight='bold', color=COLORS['text_main'], pad=15)
    ax.grid(True, linestyle=':', alpha=0.5, color=COLORS['grid'])
    ax.legend(loc='lower left', fontsize=8.5)

    filepath = os.path.join(OUTPUT_DIR, "07_liquidity_sweep_turtle_soup.png")
    plt.savefig(filepath)
    plt.close()
    print(f"  -> Disimpan: {filepath}")


# =========================================================
# 8. DIAGRAM 8: PETA TRANSMISI KOMODITAS & MAKRO KE BEI
# =========================================================
def generate_diagram_8():
    print("[8/10] Menghasilkan Diagram Peta Transmisi Komoditas & Makro...")
    fig, (ax_macro, ax_sectors) = plt.subplots(1, 2, figsize=(16, 8.5), gridspec_kw={'width_ratios': [1, 1.2]})
    fig.patch.set_facecolor(COLORS['bg'])
    ax_macro.set_facecolor(COLORS['card_bg'])
    ax_sectors.set_facecolor(COLORS['card_bg'])

    # --- PANEL 1: SEGI TIGA MAKRO GLOBAL (DXY, US10Y, USD/IDR) ---
    ax_macro.set_title("A. Segitiga Indikator Makro Global & Arus Keluar/Masuk Modal", fontsize=11, fontweight='bold', color=COLORS['text_main'], pad=12)

    boxes_macro = [
        ("US DOLLAR INDEX (DXY)\nKekuatan Mata Uang USD", 2, 7.5, 3.8, 1.3, "#0F172A", "white"),
        ("US 10-YEAR TREASURY (US10Y)\nSuku Bunga Bebas Risiko Dunia", 7, 7.5, 3.8, 1.3, "#0F172A", "white"),
        ("NILAI TUKAR RUPIAH (USD/IDR)\nStabilitas Kurs Domestik", 4.5, 4.8, 4.0, 1.3, "#0369A1", "white"),
        ("ARUS DANA ASING (FOREIGN FLOW)\nBensin Utama Indeks IHSG", 4.5, 1.8, 4.5, 1.4, "#059669", "white")
    ]

    for title, x, y, w, h, bg, tc in boxes_macro:
        rect = patches.FancyBboxPatch((x - w/2, y - h/2), w, h,
                                      boxstyle="round,pad=0.15,rounding_size=0.2",
                                      facecolor=bg, edgecolor='none', alpha=0.92, zorder=3)
        ax_macro.add_patch(rect)
        ax_macro.text(x, y, title, ha='center', va='center', fontsize=8.2, fontweight='bold', color=tc, zorder=4)

    # Panah Transmisi Makro
    ax_macro.annotate("", xy=(4.0, 5.5), xytext=(2.5, 6.8),
                      arrowprops=dict(arrowstyle="->", color='#DC2626', lw=2.2))
    ax_macro.text(2.6, 6.0, "Dolar Naik\nRp Tertekan", fontsize=7.5, fontweight='bold', color='#DC2626')

    ax_macro.annotate("", xy=(5.0, 5.5), xytext=(6.5, 6.8),
                      arrowprops=dict(arrowstyle="->", color='#DC2626', lw=2.2))
    ax_macro.text(6.0, 6.0, "Yield Naik\nCapital Outflow", fontsize=7.5, fontweight='bold', color='#DC2626')

    ax_macro.annotate("", xy=(4.5, 2.6), xytext=(4.5, 4.1),
                      arrowprops=dict(arrowstyle="->", color='#059669', lw=2.5))
    ax_macro.text(4.7, 3.3, "Rupiah Stabil -> Asing Masuk (Inflow)\nRupiah Anjlok -> Asing Kabur (Outflow)", fontsize=7.8, fontweight='bold', color='#0F172A')

    ax_macro.set_xlim(-0.2, 9.2)
    ax_macro.set_ylim(0.5, 8.8)
    ax_macro.axis('off')

    # --- PANEL 2: MATRIKS TRANSMISI KOMODITAS KE SAHAM BEI ---
    ax_sectors.set_title("B. Jalur Transmisi Komoditas Fisik ke Saham Emiten BEI", fontsize=11, fontweight='bold', color=COLORS['text_main'], pad=12)

    commodities = [
        ("EMAS MURNI (XAU/USD)\nSafe Haven & Lindung Nilai", "BRMS, ANTM, PSAB, ARCI", "Margin tambang melompat; Operating leverage pure-play (BRMS)", "#D97706", 7.2),
        ("MINYAK MENTAH (BRENT/WTI)\nBahan Bakar Industri & Geopolitik", "MEDC, ELSA, AKRA, PGAS", "ASP migas naik; Pendapatan jasa sewa rig pengeboran hulu", "#0284C7", 5.0),
        ("BATUBARA (NEWCASTLE COAL)\nKrisis Energi & Listrik Global", "PTBA, ADRO, ITMG, BUMI", "Windfall laba bersih & dividen jumbo; Waspada Dividend Trap", "#475569", 2.8),
        ("NIKEL & TEMBAGA (LME / SHFE)\nBahan Baku Baterai Listrik EV", "NCKL, MBMA, INCO, ANTM", "Sentimen adopsi EV; Margin penambang berbiaya tunai rendah", "#059669", 0.6)
    ]

    for comm_title, tickers, impact, col, y in commodities:
        # Kotak Komoditas Kiri
        r_comm = patches.FancyBboxPatch((0.2, y), 3.4, 1.5, boxstyle="round,pad=0.1,rounding_size=0.15",
                                       facecolor=col, edgecolor='none', alpha=0.9, zorder=3)
        ax_sectors.add_patch(r_comm)
        ax_sectors.text(1.9, y + 0.75, comm_title, ha='center', va='center', fontsize=7.8, fontweight='bold', color='white', zorder=4)

        # Panah Transmisi
        ax_sectors.annotate("", xy=(4.6, y + 0.75), xytext=(3.7, y + 0.75),
                            arrowprops=dict(arrowstyle="->", color=col, lw=2.5), zorder=4)

        # Kotak Saham Kanan
        r_stock = patches.FancyBboxPatch((4.7, y), 5.5, 1.5, boxstyle="round,pad=0.1,rounding_size=0.15",
                                        facecolor='#FFFFFF', edgecolor=col, lw=1.5, zorder=3)
        ax_sectors.add_patch(r_stock)
        ax_sectors.text(4.9, y + 1.05, f"Saham Pilihan: {tickers}", fontsize=8.2, fontweight='bold', color='#0F172A', zorder=4)
        ax_sectors.text(4.9, y + 0.45, impact, fontsize=7.2, color=COLORS['text_sub'], zorder=4)

    ax_sectors.set_xlim(0, 10.5)
    ax_sectors.set_ylim(-0.2, 9.2)
    ax_sectors.axis('off')

    plt.suptitle("MBG QUANT ACADEMY // MODUL 2: PETA TRANSMISI MAKROEKONOMI GLOBAL & KOMODITAS KE EMITEN BEI",
                 fontsize=12.5, fontweight='bold', color=COLORS['text_main'], y=0.98)

    filepath = os.path.join(OUTPUT_DIR, "08_macro_commodity_transmission.png")
    plt.savefig(filepath)
    plt.close()
    print(f"  -> Disimpan: {filepath}")


# =========================================================
# 9. DIAGRAM 9: OPERATING LEVERAGE PARADOKS ANTM VS BRMS
# =========================================================
def generate_diagram_9():
    print("[9/10] Menghasilkan Diagram Paradoks Operating Leverage ANTM vs BRMS...")
    fig, (ax_bars, ax_math) = plt.subplots(1, 2, figsize=(16, 8.5), gridspec_kw={'width_ratios': [1.1, 1]})
    fig.patch.set_facecolor(COLORS['bg'])
    ax_bars.set_facecolor(COLORS['card_bg'])
    ax_math.set_facecolor(COLORS['card_bg'])

    # --- PANEL 1: PERBANDINGAN PERFORMA SAHAM VS MARGIN LABA ---
    ax_bars.set_title("A. Perbandingan Kinerja Harga Saham 2024 (Emas All-Time High)", fontsize=11, fontweight='bold', color=COLORS['text_main'], pad=12)

    categories = ['Emas Dunia\n(XAU/USD)', 'Saham ANTM\n(Aneka Tambang)', 'Saham BRMS\n(Bumi Resources Minerals)']
    gains = [32.5, 28.2, 115.0]
    bar_colors = ['#F59E0B', '#64748B', '#10B981']

    bars = ax_bars.bar(categories, gains, color=bar_colors, width=0.55, edgecolor='#0F172A', lw=1.2, zorder=3)

    for bar, val in zip(bars, gains):
        y_val = bar.get_height()
        ax_bars.text(bar.get_x() + bar.get_width()/2, y_val + 3.0, f"+{val:.1f}%",
                     ha='center', fontsize=10, fontweight='bold', color='#0F172A')

    ax_bars.set_ylabel("Persentase Kenaikan Harga (%)", fontsize=9.5, fontweight='bold', color=COLORS['text_sub'])
    ax_bars.set_ylim(0, 135)
    ax_bars.grid(True, linestyle=':', alpha=0.5, color=COLORS['grid'])

    # Anotasi Misteri
    ax_bars.text(1.0, 45, "MENGAPA ANTM TERTINGGAL?\nDiversifikasi nikel lesu +\nMayoritas pendapatan dari jual-beli emas\nmargin sangat tipis (2-3%)!",
                 ha='center', fontsize=7.8, fontweight='bold', color='#991B1B',
                 bbox=dict(boxstyle="round,pad=0.4", fc="#FEE2E2", ec='#DC2626', lw=1.0))

    ax_bars.text(2.0, 75, "MENGAPA BRMS MELEJIT?\nPenambang Hulu Murni (Pure-Play)!\nBiaya gali emas tetap ($950/oz),\nKenaikan harga emas langsung jadi laba murni!",
                 ha='center', fontsize=7.8, fontweight='bold', color='#047857',
                 bbox=dict(boxstyle="round,pad=0.4", fc="#DCFCE7", ec='#059669', lw=1.0))

    # --- PANEL 2: BEDAH MATEMATIS OPERATING LEVERAGE ---
    ax_math.set_title("B. Anatomi Operating Leverage: Tambang Murni vs Trader Ritel", fontsize=11, fontweight='bold', color=COLORS['text_main'], pad=12)

    gold_prices = [2000, 2700]  # Emas naik dari $2000 ke $2700 (+35%)

    # Kasus ANTM (Trading Margin Tetap ~3%)
    antm_profit = [2000 * 0.03, 2700 * 0.03] # Laba dari $60 naik ke $81 (+35%)

    # Kasus BRMS (Pure Play: Cash Cost Tetap $950/oz)
    brms_profit = [2000 - 950, 2700 - 950]  # Laba dari $1050 naik ke $1750 (+66.7%!)

    x_idx = np.array([1, 2])
    width = 0.35

    ax_math.bar(x_idx - width/2, antm_profit, width=width, color='#94A3B8', label='ANTM: Laba Kotor per Oz (Margin Tipis 3%)', zorder=3)
    ax_math.bar(x_idx + width/2, brms_profit, width=width, color='#059669', label='BRMS: Laba Kotor per Oz (Cash Cost Tetap $950)', zorder=3)

    ax_math.text(1 - width/2, antm_profit[0] + 30, f"${antm_profit[0]:.0f}", ha='center', fontsize=8.5, fontweight='bold')
    ax_math.text(2 - width/2, antm_profit[1] + 30, f"${antm_profit[1]:.0f}\n(+35%)", ha='center', fontsize=8.5, fontweight='bold', color='#475569')

    ax_math.text(1 + width/2, brms_profit[0] + 30, f"${brms_profit[0]:.0f}", ha='center', fontsize=8.5, fontweight='bold')
    ax_math.text(2 + width/2, brms_profit[1] + 30, f"${brms_profit[1]:.0f}\n(+67% Laba!)", ha='center', fontsize=8.5, fontweight='bold', color='#047857')

    ax_math.set_xticks(x_idx)
    ax_math.set_xticklabels(['Emas Dunia = $2.000 / oz\n(Awal 2024)', 'Emas Dunia = $2.700 / oz\n(Puncak Rekor 2024)'], fontsize=8.5, fontweight='bold')
    ax_math.set_ylabel("Laba Kotor per Troy Ounce ($)", fontsize=9.5, fontweight='bold', color=COLORS['text_sub'])
    ax_math.set_ylim(0, 2100)
    ax_math.grid(True, linestyle=':', alpha=0.5, color=COLORS['grid'])
    ax_math.legend(loc='upper left', fontsize=8.2)

    plt.suptitle("MBG QUANT ACADEMY // STUDI KASUS 3: PARADOKS OPERATING LEVERAGE EMAS ANTM VS BRMS",
                 fontsize=12.5, fontweight='bold', color=COLORS['text_main'], y=0.98)

    filepath = os.path.join(OUTPUT_DIR, "09_operating_leverage_gold_brms_vs_antm.png")
    plt.savefig(filepath)
    plt.close()
    print(f"  -> Disimpan: {filepath}")


# =========================================================
# 10. DIAGRAM 10: ORDER BOOK SPOOFING VS ABSORPTION
# =========================================================
def generate_diagram_10():
    print("[10/10] Menghasilkan Diagram Order Book Spoofing vs Real Absorption...")
    fig, (ax_spoof, ax_real) = plt.subplots(1, 2, figsize=(16, 8.5))
    fig.patch.set_facecolor(COLORS['bg'])
    ax_spoof.set_facecolor(COLORS['card_bg'])
    ax_real.set_facecolor(COLORS['card_bg'])

    # --- PANEL 1: JEBAKAN FAKE BID (SPOOFING) BANDAR ---
    ax_spoof.set_title("A. Trik Fake Bid (Spoofing) Bandar: Menjebak Ritel HAKA", fontsize=11, fontweight='bold', color='#B91C1C', pad=12)

    # Data Simulasi Order Book Spoofing
    prices = [1050, 1045, 1040, 1035, 1030]
    bids_fake = [1200, 1500, 48500, 850, 600] # Antrean raksasa palsu 48.500 lot di Rp 1.040
    offers = [2500, 3100, 1800, 2200, 1900]

    y_pos = np.arange(len(prices))

    # Plot Bid (Kiri) & Offer (Kanan)
    ax_spoof.barh(y_pos, [-b for b in bids_fake], color=['#94A3B8', '#94A3B8', '#EF4444', '#94A3B8', '#94A3B8'], alpha=0.85, label='Antrean BID (Pembeli)')
    ax_spoof.barh(y_pos, offers, color='#0284C7', alpha=0.85, label='Antrean OFFER (Penjual)')

    ax_spoof.set_yticks(y_pos)
    ax_spoof.set_yticklabels([f"Rp {p}" for p in prices], fontsize=9, fontweight='bold')
    ax_spoof.axvline(0, color='#0F172A', linewidth=1.5)

    # Label Anotasi Fake Bid
    ax_spoof.annotate("FAKE BID TEBAL (48.500 LOT)!\nBandar pasang antrean semu agar ritel mengira\nada pembeli raksasa, memicu ritel HAKA Offer.\nBegitu ritel beli, BID DICABUT dan bandar HAKI!",
                      xy=(-35000, 2), xytext=(-45000, 3.8),
                      arrowprops=dict(arrowstyle="->", color='#B91C1C', lw=1.8),
                      fontsize=8.2, fontweight='bold', color='#991B1B',
                      bbox=dict(boxstyle="round,pad=0.4", fc="#FEE2E2", ec='#DC2626', lw=1.2))

    ax_spoof.set_xlabel("Volume Antrean Lot (Kiri = BID, Kanan = OFFER)", fontsize=9, fontweight='bold', color=COLORS['text_sub'])
    ax_spoof.set_xlim(-55000, 25000)
    ax_spoof.grid(True, linestyle=':', alpha=0.4, color=COLORS['grid'])
    ax_spoof.legend(loc='lower left', fontsize=8.2)

    # --- PANEL 2: REAL ABSORPTION (AKUMULASI NYATA IIFS) ---
    ax_real.set_title("B. Akumulasi Asli (Real Passive Absorption Smart Money)", fontsize=11, fontweight='bold', color='#047857', pad=12)

    bids_real = [12500, 14200, 15800, 16500, 18000] # Antrean merata stabil
    offers_thin = [1800, 1200, 950, 1100, 800]       # Offer tipis (mudah ditembus)

    ax_real.barh(y_pos, [-b for b in bids_real], color='#10B981', alpha=0.85, label='BID Tebal Merata Asli')
    ax_real.barh(y_pos, offers_thin, color='#64748B', alpha=0.7, label='OFFER Tipis (Mudah Dihabisi)')

    ax_real.set_yticks(y_pos)
    ax_real.set_yticklabels([f"Rp {p}" for p in prices], fontsize=9, fontweight='bold')
    ax_real.axvline(0, color='#0F172A', linewidth=1.5)

    ax_real.annotate("AKUMULASI SENYAP BERTAHAP:\nAntrean Bid tebal merata di semua fraksi.\nVolume konsisten tanpa dicabut saat transaksi.\nIIFS Z-Score menunjukkan angka > +1.5!",
                     xy=(-14000, 1), xytext=(-35000, 0.2),
                     arrowprops=dict(arrowstyle="->", color='#047857', lw=1.8),
                     fontsize=8.2, fontweight='bold', color='#047857',
                     bbox=dict(boxstyle="round,pad=0.4", fc="#DCFCE7", ec='#059669', lw=1.2))

    ax_real.set_xlabel("Volume Antrean Lot (Kiri = BID, Kanan = OFFER)", fontsize=9, fontweight='bold', color=COLORS['text_sub'])
    ax_real.set_xlim(-40000, 20000)
    ax_real.grid(True, linestyle=':', alpha=0.4, color=COLORS['grid'])
    ax_real.legend(loc='lower left', fontsize=8.2)

    plt.suptitle("MBG QUANT ACADEMY // MODUL 4: ANATOMI MIKROSTRUKTUR ORDER BOOK BEI (SPOOFING VS ABSORPTION)",
                 fontsize=12.5, fontweight='bold', color=COLORS['text_main'], y=0.98)

    filepath = os.path.join(OUTPUT_DIR, "10_orderbook_spoofing_anatomy.png")
    plt.savefig(filepath)
    plt.close()
    print(f"  -> Disimpan: {filepath}")


if __name__ == '__main__':
    print("===============================================================")
    print(" MEMULAI GENERASI 4 DIAGRAM VISUAL TAMBAHAN (DPI 300)")
    print("===============================================================")
    generate_diagram_7()
    generate_diagram_8()
    generate_diagram_9()
    generate_diagram_10()
    print("===============================================================")
    print(f" SELURUH DIAGRAM TAMBAHAN BERHASIL DIBUAT DI: {OUTPUT_DIR}")
    print("===============================================================")
