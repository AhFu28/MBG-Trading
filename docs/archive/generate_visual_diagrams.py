# -*- coding: utf-8 -*-
"""
MBG QUANT ACADEMY - DIAGRAM VISUAL & INFOGRAPHIC GENERATOR
Penyusun: Visual Infographic & Diagram Designer
Deskripsi: Menghasilkan 6 diagram institusional resolusi tinggi (300 DPI)
           untuk Modul Buku Master MBG Quant Academy.
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.lines import Line2D

# ---------------------------------------------------------
# KONFIGURASI GLOBAL MATPLOTLIB & DIREKTORI OUTPUT
# ---------------------------------------------------------
OUTPUT_DIR = os.path.join("COMPILE PRD", "figures")
os.makedirs(OUTPUT_DIR, exist_ok=True)

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['Helvetica', 'DejaVu Sans', 'Arial'],
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
    'grid': '#E2E8F0',
    'border': '#CBD5E1'
}

def draw_candle(ax, x, o, h, l, c, width=0.5, bullish_col=COLORS['bullish'], bearish_col=COLORS['bearish']):
    """Helper untuk menggambar 1 candlestick mandiri."""
    is_bullish = c >= o
    color = bullish_col if is_bullish else bearish_col
    ax.vlines(x, l, h, color=color, linewidth=1.5, zorder=3)
    y_body = min(o, c)
    height = abs(c - o)
    if height < 0.05:
        height = 0.05
    rect = patches.Rectangle(
        (x - width/2, y_body), width, height,
        facecolor=color, edgecolor=color, alpha=0.9, zorder=4
    )
    ax.add_patch(rect)


# =========================================================
# 1. DIAGRAM 1: CANDLESTICK & ANATOMI ORDER BLOCK (OB)
# =========================================================
def generate_diagram_1():
    print("[1/6] Menghasilkan Diagram Anatomi Candlestick & Order Block...")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7.5), gridspec_kw={'width_ratios': [1, 1.8]})
    fig.patch.set_facecolor(COLORS['bg'])
    
    # --- PANEL 1: ANATOMI CANDLESTICK TUNGGAL ---
    ax1.set_facecolor(COLORS['card_bg'])
    ax1.set_title("A. Anatomi Fisik Candlestick", fontsize=12, fontweight='bold', color=COLORS['text_main'], pad=15)
    
    # Bullish Candle (Kiri)
    draw_candle(ax1, x=2, o=100, h=130, l=85, c=120, width=0.8)
    # Bearish Candle (Kanan)
    draw_candle(ax1, x=5, o=120, h=130, l=85, c=100, width=0.8)
    
    # Anotasi Bullish
    ax1.text(2, 133, "High (Tertinggi)", ha='center', fontsize=8.5, fontweight='bold', color=COLORS['text_sub'])
    ax1.text(2, 80, "Low (Terendah)", ha='center', fontsize=8.5, fontweight='bold', color=COLORS['text_sub'])
    ax1.annotate("Upper Wick\n(Penolakan Seller)", xy=(2, 125), xytext=(0.6, 126),
                 arrowprops=dict(arrowstyle="->", color=COLORS['text_sub']), fontsize=8, color=COLORS['text_sub'])
    ax1.annotate("Close (Penutupan)", xy=(2.4, 120), xytext=(2.9, 122),
                 arrowprops=dict(arrowstyle="->", color=COLORS['bullish_dark']), fontsize=8, fontweight='bold', color=COLORS['bullish_dark'])
    ax1.annotate("Open (Pembukaan)", xy=(2.4, 100), xytext=(2.9, 98),
                 arrowprops=dict(arrowstyle="->", color=COLORS['bullish_dark']), fontsize=8, fontweight='bold', color=COLORS['bullish_dark'])
    ax1.text(2, 110, "REAL BODY\n(Bullish: C > O)", ha='center', va='center', fontsize=8, fontweight='bold', color='white', zorder=5)
    
    # Anotasi Bearish
    ax1.text(5, 110, "REAL BODY\n(Bearish: C < O)", ha='center', va='center', fontsize=8, fontweight='bold', color='white', zorder=5)
    ax1.annotate("Open (Pembukaan)", xy=(5.4, 120), xytext=(5.9, 122),
                 arrowprops=dict(arrowstyle="->", color=COLORS['bearish_dark']), fontsize=8, fontweight='bold', color=COLORS['bearish_dark'])
    ax1.annotate("Close (Penutupan)", xy=(5.4, 100), xytext=(5.9, 98),
                 arrowprops=dict(arrowstyle="->", color=COLORS['bearish_dark']), fontsize=8, fontweight='bold', color=COLORS['bearish_dark'])
    ax1.annotate("Lower Wick\n(Penolakan Buyer)", xy=(5, 90), xytext=(5.8, 86),
                 arrowprops=dict(arrowstyle="->", color=COLORS['text_sub']), fontsize=8, color=COLORS['text_sub'])

    ax1.set_xlim(0.2, 7.2)
    ax1.set_ylim(75, 140)
    ax1.set_xticks([2, 5])
    ax1.set_xticklabels(["Bullish Candle\n(Buyer Menang)", "Bearish Candle\n(Seller Menang)"], fontsize=9, fontweight='bold')
    ax1.set_yticks([])
    
    # --- PANEL 2: ANATOMI BULLISH ORDER BLOCK ---
    ax2.set_facecolor(COLORS['card_bg'])
    ax2.set_title("B. Anatomi Bullish Order Block (OB) & Zona Diskon Demand", fontsize=12, fontweight='bold', color=COLORS['text_main'], pad=15)
    
    # Data Candles: 1=Setup, 2=OB Candle, 3=Impulse >2x ATR, 4=Consolidation, 5=Pullback, 6=Retest, 7=Expansion
    candles = [
        (1, 105, 110, 103, 108),      # Bullish kecil
        (2, 108, 110, 98, 100),       # OB CANDLE (Lilin Merah Terakhir!)
        (3, 100, 135, 99, 134),       # IMPULSE MOVE RAKSASA >2x ATR (Breakout)
        (4, 134, 138, 132, 136),      # Konsolidasi pucuk
        (5, 136, 137, 115, 118),      # Koreksi / Pullback
        (6, 118, 120, 99, 112),       # RETEST masuk ke kotak demand
        (7, 112, 148, 111, 146)       # PANTULAN RELI BARU
    ]
    for x, o, h, l, c in candles:
        draw_candle(ax2, x, o, h, l, c, width=0.55)
        
    # Zona Demand Kotak Order Block (dari C2 Low 98 sampai C2 Open/Body 108)
    ob_rect = patches.Rectangle((1.65, 98), 5.0, 10, facecolor=COLORS['bullish'], alpha=0.22,
                                edgecolor=COLORS['bullish_dark'], linestyle='--', linewidth=1.5, zorder=2)
    ax2.add_patch(ob_rect)
    
    # Garis Resistensi Lama yang Ditembus (Break of Structure / BOS)
    ax2.axhline(110, xmin=0.15, xmax=0.55, color=COLORS['accent'], linestyle=':', linewidth=1.5)
    ax2.text(3.5, 111.5, "Resisten Swing High", fontsize=8, color=COLORS['accent'], fontweight='bold')
    ax2.text(3.2, 137, "BOS (Break of Structure)\nTembus Valid!", fontsize=8.5, color=COLORS['bullish_dark'], fontweight='bold')

    # Anotasi Komponen OB
    ax2.annotate("1. BULLISH ORDER BLOCK\n(Lilin Merah Terakhir\nSebelum Ledakan Harga)",
                 xy=(2, 98), xytext=(0.8, 86),
                 arrowprops=dict(arrowstyle="->", color=COLORS['bearish_dark'], lw=1.2),
                 fontsize=8, fontweight='bold', color=COLORS['bearish_dark'],
                 bbox=dict(boxstyle="round,pad=0.3", fc="#FEE2E2", ec=COLORS['bearish_dark'], lw=0.8))
    
    ax2.annotate("2. IMPULSE MOVE (>2x ATR)\nVolume Institusi Besar\nMembuat Struktur Bullish",
                 xy=(3, 125), xytext=(1.8, 142),
                 arrowprops=dict(arrowstyle="->", color=COLORS['bullish_dark'], lw=1.2),
                 fontsize=8, fontweight='bold', color=COLORS['bullish_dark'],
                 bbox=dict(boxstyle="round,pad=0.3", fc="#DCFCE7", ec=COLORS['bullish_dark'], lw=0.8))

    ax2.annotate("3. RETEST & MITIGATION\nSmart Money Menjemput\nAntrian Beli di Sini",
                 xy=(6, 99), xytext=(4.5, 87),
                 arrowprops=dict(arrowstyle="->", color=COLORS['accent'], lw=1.2),
                 fontsize=8, fontweight='bold', color=COLORS['accent'],
                 bbox=dict(boxstyle="round,pad=0.3", fc="#E0F2FE", ec=COLORS['accent'], lw=0.8))

    # Anotasi Setup Trading Eksekusi
    ax2.text(6.7, 108, "ENTRY BUY (Top OB)", fontsize=8, color=COLORS['bullish_dark'], fontweight='bold')
    ax2.text(6.7, 96, "STOP LOSS (Below OB Low)", fontsize=8, color=COLORS['bearish_dark'], fontweight='bold')
    ax2.text(4.2, 102, "ZONA KOTAK DEMAND (INSTITUSIONAL ORDER BLOCK)", fontsize=8, fontweight='bold', color=COLORS['bullish_dark'])

    ax2.set_xlim(0.3, 7.8)
    ax2.set_ylim(80, 155)
    ax2.set_xticks(range(1, 8))
    ax2.set_xticklabels(["C1\nSetup", "C2\nOB Candle", "C3\nImpulse", "C4\nPuncak", "C5\nPullback", "C6\nRetest", "C7\nEkspansi"], fontsize=8)
    ax2.set_ylabel("Tingkat Harga Relatif", fontsize=9, fontweight='bold', color=COLORS['text_sub'])
    ax2.grid(True, linestyle=':', alpha=0.5, color=COLORS['grid'])
    
    plt.suptitle("MBG QUANT ACADEMY // MODUL 3: ANATOMI LILIN & SMART MONEY ORDER BLOCK",
                 fontsize=13, fontweight='bold', color=COLORS['text_main'], y=0.98)
    
    filepath = os.path.join(OUTPUT_DIR, "01_candlestick_order_block.png")
    plt.savefig(filepath)
    plt.close()
    print(f"  -> Disimpan: {filepath}")


# =========================================================
# 2. DIAGRAM 2: FAIR VALUE GAP (FVG) & 50% C.E.
# =========================================================
def generate_diagram_2():
    print("[2/6] Menghasilkan Diagram Fair Value Gap (FVG)...")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7.5))
    fig.patch.set_facecolor(COLORS['bg'])

    # --- PANEL A: BULLISH FVG (UNDERVALUED IMBALANCE) ---
    ax1.set_facecolor(COLORS['card_bg'])
    ax1.set_title("A. Bullish Fair Value Gap (FVG Imbalance)", fontsize=11.5, fontweight='bold', color=COLORS['text_main'], pad=12)
    
    # 5 Candle: 1=Base, 2=Massive Displacement, 3=Continuation, 4=Retest 50% CE, 5=Rally
    c_bull = [
        (1, 100, 108, 97, 106),      # C1: High = 108
        (2, 107, 134, 106, 133),     # C2: Giant Impulse
        (3, 133, 142, 118, 139),     # C3: Low = 118. Celah FVG = 108 s/d 118!
        (4, 138, 140, 113, 126),     # C4: Retest wick turun ke 113 (Menyentuh 50% CE di 113)
        (5, 126, 150, 125, 148)      # C5: Ekspansi lanjutan
    ]
    for x, o, h, l, c in c_bull:
        draw_candle(ax1, x, o, h, l, c, width=0.55)
        
    # Shading Celah FVG (dari y=108 sampai y=118, dari x=1 sampai x=4.2)
    fvg_box = patches.Rectangle((0.7, 108), 3.6, 10, facecolor='#38BDF8', alpha=0.25,
                                edgecolor='#0284C7', linestyle='--', linewidth=1.5, zorder=2)
    ax1.add_patch(fvg_box)
    
    # Garis Batas Atas & Bawah FVG
    ax1.axhline(118, xmin=0.35, xmax=0.75, color='#0284C7', linestyle='-', linewidth=1.2)
    ax1.axhline(108, xmin=0.15, xmax=0.55, color='#0284C7', linestyle='-', linewidth=1.2)
    ax1.text(3.4, 119, "Low Candle 3 (Rp 118)", fontsize=8, fontweight='bold', color='#0284C7')
    ax1.text(0.75, 105.5, "High Candle 1 (Rp 108)", fontsize=8, fontweight='bold', color='#0284C7')
    
    # Garis 50% Consequent Encroachment (C.E.) = (108 + 118)/2 = 113
    ax1.axhline(113, xmin=0.15, xmax=0.75, color=COLORS['gold'], linestyle='-.', linewidth=2)
    ax1.text(1.2, 113.8, "50% Consequent Encroachment (C.E.) = Titik Magnet Entry",
             fontsize=8.5, fontweight='bold', color='#B45309')

    # Anotasi FVG Shading
    ax1.text(2.2, 109.5, "CELAH KOSONG (FVG)", fontsize=9, fontweight='bold', color='#0369A1')
    ax1.annotate("Candle 2 Impulsif Raksasa\n(Ketidakseimbangan Pembeli)",
                 xy=(2, 134), xytext=(1.0, 146),
                 arrowprops=dict(arrowstyle="->", color=COLORS['bullish_dark']),
                 fontsize=8, fontweight='bold', color=COLORS['bullish_dark'])
    
    ax1.annotate("Retest Wick Masuk Tepat\nke 50% C.E. (Rebalancing Selesai)",
                 xy=(4, 113), xytext=(4.1, 98),
                 arrowprops=dict(arrowstyle="->", color='#B45309', lw=1.2),
                 fontsize=8, fontweight='bold', color='#B45309',
                 bbox=dict(boxstyle="round,pad=0.3", fc="#FEF3C7", ec=COLORS['gold'], lw=0.8))

    ax1.set_xlim(0.3, 5.8)
    ax1.set_ylim(92, 156)
    ax1.set_xticks(range(1, 6))
    ax1.set_xticklabels(["C1\nSetup", "C2\nImbalance", "C3\nKonfirmasi", "C4\nRetest C.E.", "C5\nReli"], fontsize=8.5)
    ax1.set_ylabel("Harga Transaksi Saham", fontsize=9, fontweight='bold', color=COLORS['text_sub'])
    ax1.grid(True, linestyle=':', alpha=0.4, color=COLORS['grid'])

    # --- PANEL B: BEARISH FVG (OVERVALUED IMBALANCE) ---
    ax2.set_facecolor(COLORS['card_bg'])
    ax2.set_title("B. Bearish Fair Value Gap (FVG Imbalance)", fontsize=11.5, fontweight='bold', color=COLORS['text_main'], pad=12)

    c_bear = [
        (1, 145, 148, 138, 140),     # C1: Low = 138
        (2, 139, 140, 112, 113),     # C2: Giant Bearish Drop
        (3, 113, 126, 105, 108),     # C3: High = 126. Celah FVG = 126 s/d 138!
        (4, 108, 132, 106, 115),     # C4: Pullback naik wick menyentuh 50% CE (132)
        (5, 115, 116, 94, 96)        # C5: Dump lanjutan
    ]
    for x, o, h, l, c in c_bear:
        draw_candle(ax2, x, o, h, l, c, width=0.55)

    # Shading Bearish FVG Box (126 s/d 138)
    fvg_bear_box = patches.Rectangle((0.7, 126), 3.6, 12, facecolor='#FDA4AF', alpha=0.3,
                                     edgecolor='#E11D48', linestyle='--', linewidth=1.5, zorder=2)
    ax2.add_patch(fvg_bear_box)
    
    ax2.axhline(138, xmin=0.15, xmax=0.55, color='#E11D48', linestyle='-', linewidth=1.2)
    ax2.axhline(126, xmin=0.35, xmax=0.75, color='#E11D48', linestyle='-', linewidth=1.2)
    ax2.text(0.8, 139.5, "Low Candle 1 (Rp 138)", fontsize=8, fontweight='bold', color='#E11D48')
    ax2.text(3.4, 123.5, "High Candle 3 (Rp 126)", fontsize=8, fontweight='bold', color='#E11D48')

    # Garis 50% CE Bearish = (138 + 126)/2 = 132
    ax2.axhline(132, xmin=0.15, xmax=0.75, color=COLORS['gold'], linestyle='-.', linewidth=2)
    ax2.text(1.2, 133, "50% Consequent Encroachment (C.E.) = Area Sell Rebalancing",
             fontsize=8.5, fontweight='bold', color='#B45309')

    ax2.text(2.2, 128, "CELAH KOSONG (BEARISH FVG)", fontsize=8.5, fontweight='bold', color='#BE123C')
    ax2.annotate("Pullback Wick Menutup 50% C.E.\nLalu Terpelanting Turun",
                 xy=(4, 132), xytext=(4.1, 144),
                 arrowprops=dict(arrowstyle="->", color='#B45309', lw=1.2),
                 fontsize=8, fontweight='bold', color='#B45309',
                 bbox=dict(boxstyle="round,pad=0.3", fc="#FEF3C7", ec=COLORS['gold'], lw=0.8))

    ax2.set_xlim(0.3, 5.8)
    ax2.set_ylim(88, 156)
    ax2.set_xticks(range(1, 6))
    ax2.set_xticklabels(["C1\nSetup", "C2\nImbalance", "C3\nKonfirmasi", "C4\nRetest C.E.", "C5\nDump"], fontsize=8.5)
    ax2.set_ylabel("Harga Transaksi Saham", fontsize=9, fontweight='bold', color=COLORS['text_sub'])
    ax2.grid(True, linestyle=':', alpha=0.4, color=COLORS['grid'])

    plt.suptitle("MBG QUANT ACADEMY // MODUL 3: FAIR VALUE GAP (FVG) & 50% CONSEQUENT ENCROACHMENT",
                 fontsize=13, fontweight='bold', color=COLORS['text_main'], y=0.98)

    filepath = os.path.join(OUTPUT_DIR, "02_fair_value_gap_fvg.png")
    plt.savefig(filepath)
    plt.close()
    print(f"  -> Disimpan: {filepath}")


# =========================================================
# 3. DIAGRAM 3: KURVA DRAWDOWN VS RECOVERY RETURN
# =========================================================
def generate_diagram_3():
    print("[3/6] Menghasilkan Grafik Kurva Drawdown vs Recovery Return...")
    fig, ax = plt.subplots(figsize=(13, 8))
    fig.patch.set_facecolor(COLORS['bg'])
    ax.set_facecolor(COLORS['card_bg'])

    # Kurva Matematis: R = D / (1 - D)
    d = np.linspace(0, 0.90, 400)
    r = (d / (1 - d)) * 100
    d_pct = d * 100

    # 4 Shading Zona Risiko
    ax.axvspan(0, 15, color='#D1FAE5', alpha=0.45, label='Zona Aman Astra (DD 0-15%): Pemulihan Mudah (<17.6%)')
    ax.axvspan(15, 30, color='#FEF3C7', alpha=0.45, label='Zona Waspada (DD 15-30%): Evaluasi Sistem (17.6-42.9%)')
    ax.axvspan(30, 50, color='#FFEDD5', alpha=0.55, label='Zona Kritis (DD 30-50%): Tekanan Mental Berat (42.9-100%)')
    ax.axvspan(50, 90, color='#FEE2E2', alpha=0.65, label='Zona Kehancuran Modal (DD >50%): Kurva Hiperbolik Meledak')

    # Plot Kurva Utama
    ax.plot(d_pct, r, color='#DC2626', linewidth=3.2, zorder=5, label='Kurva Matematis: Recovery % = D / (1 - D)')

    # Titik-titik Kunci
    key_dd = [5, 10, 20, 30, 50, 75, 90]
    for k in key_dd:
        rec = (k / (100 - k)) * 100
        ax.scatter(k, rec, color='#991B1B', s=55, zorder=6, edgecolors='white', linewidths=1.2)
        if k <= 30:
            ax.annotate(f"DD -{k}%\nRec +{rec:.1f}%", xy=(k, rec), xytext=(k - 2, rec + 38),
                        fontsize=7.8, fontweight='bold', color=COLORS['text_main'],
                        arrowprops=dict(arrowstyle="->", color=COLORS['text_sub'], lw=0.8))
        elif k == 50:
            # Callout Utama 50%
            ax.annotate("TITIK KRITIS MODAL: DRAWDOWN -50%\nButuh Cuan +100.0% Hanya Untuk Balik Modal (BEP)!\n(Modal Rp 100jt tinggal Rp 50jt)",
                        xy=(50, 100), xytext=(22, 240),
                        arrowprops=dict(arrowstyle="->", color='#B91C1C', lw=1.8),
                        fontsize=9, fontweight='bold', color='#991B1B',
                        bbox=dict(boxstyle="round,pad=0.5", fc="#FEE2E2", ec='#DC2626', lw=1.5))
        elif k == 75:
            ax.annotate(f"DD -75% &rarr; Wajib Cuan +{rec:.0f}%!", xy=(k, rec), xytext=(k - 18, rec + 60),
                        arrowprops=dict(arrowstyle="->", color='#991B1B'),
                        fontsize=8.5, fontweight='bold', color='#991B1B')
        elif k == 90:
            ax.annotate("TOTAL RUIN: DD -90%\nSisa modal Rp 10jt\nButuh CUAN +900% (10x lipat)!\nSecara statistik 99% trader bangkrut!",
                        xy=(90, 900), xytext=(52, 750),
                        arrowprops=dict(arrowstyle="->", color='#7F1D1D', lw=1.8),
                        fontsize=8.8, fontweight='bold', color='#7F1D1D',
                        bbox=dict(boxstyle="round,pad=0.5", fc="#FEE2E2", ec='#7F1D1D', lw=1.5))

    # Konfigurasi Sumbu
    ax.set_xlim(0, 92)
    ax.set_ylim(0, 950)
    ax.set_xlabel("Penurunan Modal Portofolio / Drawdown (%)", fontsize=10.5, fontweight='bold', color=COLORS['text_main'], labelpad=8)
    ax.set_ylabel("Tingkat Keuntungan Pemulihan / Required Recovery Return (%)", fontsize=10.5, fontweight='bold', color=COLORS['text_main'], labelpad=8)
    ax.set_xticks(range(0, 95, 10))
    ax.set_yticks(range(0, 1000, 100))
    ax.grid(True, linestyle=':', alpha=0.6, color=COLORS['grid'])
    
    # Legend
    legend = ax.legend(loc='upper left', frameon=True, framealpha=0.95, facecolor='white', edgecolor=COLORS['border'], fontsize=8.5)
    legend.get_title().set_fontweight('bold')

    plt.suptitle("MBG QUANT ACADEMY // MODUL 1: MATEMATIKA DRAWDOWN VS RECOVERY RETURN",
                 fontsize=13, fontweight='bold', color=COLORS['text_main'], y=0.96)
    plt.title("Hukum Kekekalan Modal: Mengapa Disiplin Rule Risiko 2% Astra Wajib Dipatuhi Tanpa Kompromi",
              fontsize=9.5, color=COLORS['text_sub'], pad=10)

    filepath = os.path.join(OUTPUT_DIR, "03_drawdown_vs_recovery.png")
    plt.savefig(filepath)
    plt.close()
    print(f"  -> Disimpan: {filepath}")


# =========================================================
# 4. DIAGRAM 4: FLOWCHART 5 LANGKAH KEPUTUSAN ASTRA
# =========================================================
def generate_diagram_4():
    print("[4/6] Menghasilkan Flowchart SOP 5 Langkah Astra...")
    fig, ax = plt.subplots(figsize=(15, 10))
    fig.patch.set_facecolor(COLORS['bg'])
    ax.set_facecolor(COLORS['card_bg'])

    # Definisi Kotak-kotak Flowchart Vertikal Bertingkat
    # Format: (id, label, subtext, x, y, width, height, bg_color, border_color)
    steps = [
        ("START", "MULAI: RADAR MBG SCANNER", "Filter kandidat saham BEI / Kripto Spot harian", 5, 9.2, 5.0, 0.7, "#0F172A", "#0F172A", "white"),
        ("STEP1", "LANGKAH 1: FILTER MAKROEKONOMI", "Indeks Dolar (DXY), US10Y Yield, Tren IHSG, & Komoditas Acuan", 5, 7.8, 5.4, 0.85, "#E0F2FE", "#0284C7", COLORS['text_main']),
        ("STEP2", "LANGKAH 2: CEK ARUS DANA ASING & IIFS", "Skor Komposit IIFS >= +0.50, OBV Kumulatif, MFI, & Broker Flow", 5, 6.2, 5.4, 0.85, "#DCFCE7", "#10B981", COLORS['text_main']),
        ("STEP3", "LANGKAH 3: CEK STRUKTUR SMC & HARGA", "Order Block Valid (>2x ATR), Fair Value Gap, & Posisi di Zona Diskon", 5, 4.6, 5.4, 0.85, "#FEF3C7", "#F59E0B", COLORS['text_main']),
        ("STEP4", "LANGKAH 4: KALKULATOR LOT 2% ASTRA", "Lot = floor((Modal x 2%) / ((Entry - SL) x 100)) | R:R Wajib >= 1:2.0", 5, 3.0, 5.4, 0.85, "#F3E8FF", "#8B5CF6", COLORS['text_main']),
        ("STEP5", "LANGKAH 5: EKSEKUSI GTC & BRACKET ORDER", "Pasang Antrean Beli Limit + Otomatis Pasang SL & TP di Sekuritas", 5, 1.4, 5.4, 0.85, "#CCFBF1", "#0D9488", COLORS['text_main']),
        ("END", "SELESAI: JURNAL & MONITOR PASIF", "Catat di 17 Parameter Jurnal MBG | Dilarang Menggeser Stop Loss!", 5, 0.2, 5.0, 0.65, "#0F172A", "#0F172A", "white")
    ]

    for sid, title, desc, cx, cy, w, h, bg, border, tc in steps:
        rect = patches.FancyBboxPatch((cx - w/2, cy - h/2), w, h,
                                      boxstyle="round,pad=0.15,rounding_size=0.15",
                                      facecolor=bg, edgecolor=border, linewidth=1.5, zorder=3)
        ax.add_patch(rect)
        ax.text(cx, cy + 0.14, title, ha='center', va='center', fontsize=9.2, fontweight='bold', color=tc, zorder=4)
        ax.text(cx, cy - 0.16, desc, ha='center', va='center', fontsize=7.5, color=tc if tc != COLORS['text_main'] else COLORS['text_sub'], zorder=4)

    # Panah Alur Sukses (Vertikal Lurus ke Bawah)
    arrow_y_pairs = [
        (8.85, 8.23), (7.37, 6.63), (5.77, 5.03), (4.17, 3.43), (2.57, 1.83), (0.97, 0.53)
    ]
    for y_start, y_end in arrow_y_pairs:
        ax.annotate("", xy=(5, y_end), xytext=(5, y_start),
                    arrowprops=dict(arrowstyle="->,head_width=0.35,head_length=0.4", color=COLORS['bullish_dark'], lw=2.2), zorder=5)
        ax.text(5.2, (y_start + y_end)/2, "LOLOS (PASS)", fontsize=7, fontweight='bold', color=COLORS['bullish_dark'])

    # Kotak Reject / Batal di Sisi Kanan (Gating Failures)
    reject_boxes = [
        ("REJECT 1", "TIDAK LOLOS MAKRO:\nPasar Sedang Risk-Off\n(SKIP / WAIT)", 7.8),
        ("REJECT 2", "DISTRIBUSI ASING:\nIIFS < +0.5 / Dump\n(HINDARI JEBAKAN)", 6.2),
        ("REJECT 3", "HARGA PREMIUM:\nBelum di Zona Diskon\n(JANGAN FOMO / LIMIT)", 4.6),
        ("REJECT 4", "RISIKO TIDAK LAYAK:\nR:R < 1:2 atau Lot 0\n(BATALKAN TIKET)", 3.0)
    ]
    for code, msg, y_pos in reject_boxes:
        # Kotak Merah Reject
        r_box = patches.FancyBboxPatch((8.3, y_pos - 0.35), 2.2, 0.7,
                                       boxstyle="round,pad=0.1",
                                       facecolor="#FEE2E2", edgecolor="#DC2626", linewidth=1.2, zorder=3)
        ax.add_patch(r_box)
        ax.text(9.4, y_pos, msg, ha='center', va='center', fontsize=7.2, fontweight='bold', color="#991B1B", zorder=4)
        
        # Panah dari Langkah ke Reject
        ax.annotate("", xy=(8.3, y_pos), xytext=(7.7, y_pos),
                    arrowprops=dict(arrowstyle="->", color="#DC2626", lw=1.8), zorder=5)
        ax.text(7.75, y_pos + 0.12, "GAGAL", fontsize=6.8, fontweight='bold', color="#DC2626")

    # Garis Merah Kolektif Pengembalian Modal / Batal Trading
    ax.plot([10.7, 10.7], [3.0, 7.8], color="#DC2626", linestyle='--', linewidth=1.2, zorder=2)
    ax.annotate("GAGAL SALAH SATU GERBANG = 100% BATALKAN TRADING\n(Uang Tetap Aman di Rekening Dana Nasabah / RDN)",
                xy=(10.7, 5.4), xytext=(11.1, 5.4), ha='left', va='center',
                fontsize=8, fontweight='bold', color="#991B1B",
                bbox=dict(boxstyle="round,pad=0.4", fc="#FEE2E2", ec="#DC2626", lw=1.2))

    ax.set_xlim(1.5, 14.5)
    ax.set_ylim(-0.3, 10.2)
    ax.axis('off')

    plt.suptitle("MBG QUANT ACADEMY // SOP PENGAMBILAN KEPUTUSAN TRADING 5 LANGKAH ASTRA",
                 fontsize=13, fontweight='bold', color=COLORS['text_main'], y=0.97)
    plt.title("Protokol Disiplin Tanpa Toleransi: Dari Radar Makro hingga Eksekusi Lot Terukur",
              fontsize=9.5, color=COLORS['text_sub'], pad=10)

    filepath = os.path.join(OUTPUT_DIR, "04_astra_5_step_flowchart.png")
    plt.savefig(filepath)
    plt.close()
    print(f"  -> Disimpan: {filepath}")


# =========================================================
# 5. DIAGRAM 5: ANATOMI DIVIDEND TRAP
# =========================================================
def generate_diagram_5():
    print("[5/6] Menghasilkan Diagram Anatomi Dividend Trap...")
    fig, (ax_price, ax_vol) = plt.subplots(2, 1, figsize=(14, 8.5), gridspec_kw={'height_ratios': [2.2, 1]}, sharex=True)
    fig.patch.set_facecolor(COLORS['bg'])
    ax_price.set_facecolor(COLORS['card_bg'])
    ax_vol.set_facecolor(COLORS['card_bg'])

    # Timeline Hari Trading: H-20 s/d H+10 terhadap Cum Date (Hari 0)
    days = np.arange(-20, 11)
    
    # Sintesis Harga: Pom-pom naik dari 3.000 ke 3.900 di Cum-Date (Day 0), lalu GAP DOWN ARB 3 hari ke 2.650
    price = []
    for d in days:
        if d < -10:
            price.append(3000 + (d + 20) * 15 + np.random.normal(0, 10))
        elif d <= 0:
            price.append(3150 + (d + 10) * 75 + np.random.normal(0, 15))  # Euforia menuju 3.900
        elif d == 1:
            price.append(3315)  # Ex-Date ARB 1 (-15%)
        elif d == 2:
            price.append(2820)  # ARB 2 (-15%)
        elif d == 3:
            price.append(2650)  # ARB 3 (-6%)
        else:
            price.append(2650 + (d - 3) * 5 + np.random.normal(0, 12))     # Nyangkut sideways di dasar
    price = np.array(price)

    # Plot Garis Harga Saham
    ax_price.plot(days, price, color='#0284C7', linewidth=2.5, zorder=4, label='Harga Saham (Rp)')
    p_cum = float(price[days == 0][0])
    ax_price.scatter(0, p_cum, color='#DC2626', s=80, zorder=6)
    
    # Shading 4 Fase
    ax_price.axvspan(-20, -10, color='#F1F5F9', alpha=0.6)
    ax_price.axvspan(-10, 0, color='#FEF3C7', alpha=0.45)
    ax_price.axvspan(0, 3, color='#FEE2E2', alpha=0.6)
    ax_price.axvspan(3, 10, color='#F8FAFC', alpha=0.8)

    ax_price.text(-15, 3750, "FASE 1:\nAkumulasi Senyap\nSmart Money", ha='center', fontsize=8, fontweight='bold', color=COLORS['text_sub'])
    ax_price.text(-5, 3750, "FASE 2:\nHype Dividen Jumbo\nRitel Masuk (FOMO)", ha='center', fontsize=8, fontweight='bold', color='#B45309')
    ax_price.text(1.5, 3750, "FASE 3:\nEX-DATE ARB\nKaskade Anjlok", ha='center', fontsize=8, fontweight='bold', color='#991B1B')
    ax_price.text(7, 3750, "FASE 4:\nModal Nyangkut\nLikuiditas Beku", ha='center', fontsize=8, fontweight='bold', color=COLORS['text_sub'])

    # Anotasi Titik Puncak Cum Date
    ax_price.annotate("CUM-DATE (Puncak Beli Ritel: Rp 3.900)\nYield Dividen Tergiur 25% (Rp 985/saham)\nRitel Berebut Hajar Kanan (HAKA)!",
                      xy=(0, 3900), xytext=(-12, 3450),
                      arrowprops=dict(arrowstyle="->", color='#DC2626', lw=1.5),
                      fontsize=8.5, fontweight='bold', color='#991B1B',
                      bbox=dict(boxstyle="round,pad=0.4", fc="#FEE2E2", ec='#DC2626', lw=1.2))

    # Anotasi Gap Down ARB Ex-Date
    ax_price.annotate("EX-DATE: GAP DOWN ARB BERUNTUN!\nHarga Terjun Bebas dari Rp 3.900 -> Rp 2.650 (-32%)\nAntrean Offer Berjuta Lot Tanpa Ada Bid",
                      xy=(1, 3315), xytext=(2.5, 3200),
                      arrowprops=dict(arrowstyle="->", color='#991B1B', lw=1.5),
                      fontsize=8.5, fontweight='bold', color='#991B1B',
                      bbox=dict(boxstyle="round,pad=0.4", fc="#FEF2F2", ec='#991B1B', lw=1.2))

    # Kotak Neraca Matematika Boncos
    calc_text = (
        "RAPOR HITUNGAN MATEMATIS DIVIDEND TRAP:\n"
        "• Modal Beli Pucuk Cum-Date : Rp 3.900 / saham\n"
        "• Dividen Bersih Diterima   : +Rp 886 / saham (+22.7%)\n"
        "• Penurunan Harga (Capital Loss): -Rp 1.250 / saham (-32.0%)\n"
        "----------------------------------------------------------\n"
        "HASIL BERSIH: BONCOS TOTAL -Rp 364 / saham (-9.3%)\n"
        "DANA TERKUNCI BULANAN DI SAHAM BOTTOM CYCLE!"
    )
    ax_price.text(-19, 2750, calc_text, fontsize=8, fontweight='bold', color='#7F1D1D',
                  bbox=dict(boxstyle="round,pad=0.5", fc="#FFF1F2", ec='#BE123C', lw=1.5))

    ax_price.set_ylabel("Harga Saham (IDR)", fontsize=9.5, fontweight='bold', color=COLORS['text_main'])
    ax_price.set_ylim(2500, 4050)
    ax_price.grid(True, linestyle=':', alpha=0.5, color=COLORS['grid'])

    # --- PANEL BAWAH: VOLUME RITEL VS NET FOREIGN FLOW (IIFS) ---
    vol_retail = np.array([20 + abs(d)*2 + (80 if d == 0 else 0) for d in days])
    flow_foreign = np.array([15 if d < -10 else (35 - (d+10)*8) for d in days])  # Asing Net Sell masif jelang Cum-Date

    # Volume Bar Ritel
    ax_vol.bar(days, vol_retail, color='#94A3B8', alpha=0.6, width=0.6, label='Volume Transaksi Ritel')
    ax_vol.bar(0, float(vol_retail[days == 0][0]), color='#EF4444', alpha=0.9, width=0.7, label='Ledakan Volume HAKA Ritel di Cum-Date')

    # Garis Foreign Flow / Smart Money
    ax_vol_twin = ax_vol.twinx()
    ax_vol_twin.plot(days, flow_foreign, color='#059669', linewidth=2.2, label='Arus Dana Asing / Smart Money Flow')
    ax_vol_twin.axhline(0, color='#64748B', linestyle='--', linewidth=0.8)

    ax_vol.set_xlabel("Hari Relatif Terhadap Cum-Date (Hari 0 = Cum Date, Hari +1 = Ex-Date)", fontsize=9.5, fontweight='bold', color=COLORS['text_main'])
    ax_vol.set_ylabel("Volume Transaksi (Juta Lot)", fontsize=8.5, fontweight='bold', color=COLORS['text_sub'])
    ax_vol_twin.set_ylabel("Net Foreign Flow (Miliar Rp)", fontsize=8.5, fontweight='bold', color='#059669')

    ax_vol.set_xticks(range(-20, 11, 2))
    ax_vol.grid(True, linestyle=':', alpha=0.4, color=COLORS['grid'])

    # Label Distribusi Asing
    ax_vol_twin.annotate("DISTRIBUSI ASING:\nAsing Guyur Barang Jual\nTepat Saat Ritel HAKA!",
                         xy=(0, float(flow_foreign[days == 0][0])), xytext=(-6, -30),
                         arrowprops=dict(arrowstyle="->", color='#047857', lw=1.2),
                         fontsize=7.8, fontweight='bold', color='#047857',
                         bbox=dict(boxstyle="round,pad=0.3", fc="#DCFCE7", ec='#059669', lw=1.0))

    plt.suptitle("MBG QUANT ACADEMY // MODUL 4: ANATOMI DIVIDEND TRAP SAHAM SIKLIKAL",
                 fontsize=13, fontweight='bold', color=COLORS['text_main'], y=0.98)

    filepath = os.path.join(OUTPUT_DIR, "05_dividend_trap_anatomy.png")
    plt.savefig(filepath)
    plt.close()
    print(f"  -> Disimpan: {filepath}")


# =========================================================
# 6. DIAGRAM 6: PIRAMIDA ALIRAN LIKUIDITAS KRIPTO
# =========================================================
def generate_diagram_6():
    print("[6/6] Menghasilkan Diagram Piramida Likuiditas Kripto (Waterfall)...")
    fig, (ax_pyr, ax_cycle) = plt.subplots(1, 2, figsize=(16, 8), gridspec_kw={'width_ratios': [1.3, 1]})
    fig.patch.set_facecolor(COLORS['bg'])
    ax_pyr.set_facecolor(COLORS['card_bg'])
    ax_cycle.set_facecolor(COLORS['card_bg'])

    # --- PANEL 1: PIRAMIDA BERJENJANG / CAPITAL WATERFALL ---
    ax_pyr.set_title("A. Piramida Aliran Likuiditas (The Capital Waterfall)", fontsize=11.5, fontweight='bold', color=COLORS['text_main'], pad=15)

    # 4 Layer Piramida dari Atas (Likuiditas Awal) ke Bawah (Spekulasi Ekstrem)
    layers = [
        ("LAYER 1: FIAT & STABLECOIN ON-RAMP", "USD, USDT, USDC, FDUSD", "Pintu Masuk Modal Global | Likuiditas Dasar", 4, 1.2, "#0F172A", "white"),
        ("LAYER 2: BITCOIN (BTC) - DIGITAL GOLD", "Market Cap #1 | Reserve Asset Pasar Kripto", "Fase 1: BTC Pump, BTC Dominance Naik Tajam (>60%)", 3, 1.2, "#D97706", "white"),
        ("LAYER 3: LARGE-CAP / ETHEREUM & L1 GIANTS", "ETH, SOL, BNB, AVAX, NEAR, LINK", "Fase 2: Profit BTC Dirotasi ke Ekosistem Smart Contract", 2, 1.2, "#0284C7", "white"),
        ("LAYER 4: ALTCOIN, MID-LOW CAP & MEME TOKENS", "100x Potential Altseason Mania | PEPE, DOGE, Gaming, AI", "Fase 3: BTC.D Anjlok Bebas | Puncak Euforia Ritel Sebelum Dump", 1, 1.2, "#7C3AED", "white")
    ]

    y_coords = [7.2, 5.0, 2.8, 0.6]
    widths = [9.5, 8.0, 6.5, 5.0]

    for (title, coins, desc, step_num, h, bg, tc), y, w in zip(layers, y_coords, widths):
        rect = patches.FancyBboxPatch((5 - w/2, y), w, 1.4,
                                      boxstyle="round,pad=0.15,rounding_size=0.2",
                                      facecolor=bg, edgecolor='none', alpha=0.92, zorder=3)
        ax_pyr.add_patch(rect)
        ax_pyr.text(5, y + 0.95, title, ha='center', va='center', fontsize=9.2, fontweight='bold', color=tc, zorder=4)
        ax_pyr.text(5, y + 0.55, coins, ha='center', va='center', fontsize=8.2, fontweight='bold', color='#CBD5E1' if tc == 'white' else COLORS['text_main'], zorder=4)
        ax_pyr.text(5, y + 0.22, desc, ha='center', va='center', fontsize=7.2, color='#94A3B8' if tc == 'white' else COLORS['text_sub'], zorder=4)

    # Panah Aliran Modal ke Bawah (Waterfall Inflow)
    for y_top in [7.2, 5.0, 2.8]:
        ax_pyr.annotate("", xy=(5, y_top - 0.75), xytext=(5, y_top),
                        arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.4", color='#10B981', lw=3.0), zorder=5)
        ax_pyr.text(5.3, y_top - 0.4, "Rotasi Profit", fontsize=7.5, fontweight='bold', color='#047857')

    # Panah Pembalikan Risiko ke Atas (Risk-Off Crash Drain)
    ax_pyr.annotate("", xy=(0.5, 7.8), xytext=(0.5, 1.2),
                    arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.4", color='#EF4444', lw=2.5, linestyle='--'), zorder=5)
    ax_pyr.text(0.7, 4.5, "FASE CRASH (BEAR MARKET):\nAltcoin Runtuh -90%\nModal Kabur Kembali ke BTC\nLalu Cair ke Fiat / Stablecoin",
                fontsize=7.8, fontweight='bold', color='#B91C1C', rotation=90, va='center')

    ax_pyr.set_xlim(-0.5, 10.5)
    ax_pyr.set_ylim(-0.2, 9.2)
    ax_pyr.axis('off')

    # --- PANEL 2: SIKLUS ROTASI BTC DOMINANCE (BTC.D) VS ALTSEASON ---
    ax_cycle.set_title("B. Siklus Transmisi BTC Dominance vs Altseason", fontsize=11.5, fontweight='bold', color=COLORS['text_main'], pad=15)
    
    t = np.linspace(0, 4*np.pi, 200)
    btc_dom = 60 + 12 * np.sin(t)
    alt_idx = 45 - 28 * np.sin(t)

    ax_cycle.plot(t, btc_dom, color='#D97706', linewidth=2.5, label='Bitcoin Dominance (BTC.D %)')
    ax_cycle.plot(t, alt_idx, color='#7C3AED', linewidth=2.5, linestyle='--', label='Altseason Index')

    ax_cycle.axhline(50, color='#94A3B8', linestyle=':', linewidth=0.8)

    # Anotasi Fase Siklus
    ax_cycle.text(1.5, 74, "FASE 1:\nBTC Run\n(BTC.D Puncak)", ha='center', fontsize=7.8, fontweight='bold', color='#B45309')
    ax_cycle.text(4.7, 74, "FASE 3:\nALTSEASON MANIA\n(BTC.D Anjlok Bebas)", ha='center', fontsize=7.8, fontweight='bold', color='#6D28D9')
    ax_cycle.text(7.8, 74, "FASE 1 KEMBALI:\nRisk-Off Reset", ha='center', fontsize=7.8, fontweight='bold', color='#B45309')

    # Kotak Doktrin Spot Murni
    spot_rule = (
        "DOKTRIN SPOT MASTERY MBG:\n"
        "1. Beli BTC saat BTC Dominance rendah & akumulasi.\n"
        "2. Ambil profit BTC & rotasi ke L1 saat BTC breakout ATH.\n"
        "3. Rotasi ke Altcoin HANYA saat BTC.D mulai patah tren.\n"
        "4. KELUAR KE USDT saat orang awam mulai membicarakan meme coin!\n"
        "5. NOL LEVERAGE: Tidak ada risiko likuidasi di Spot USDT."
    )
    ax_cycle.text(0.5, 12, spot_rule, fontsize=8, fontweight='bold', color='#0F172A',
                  bbox=dict(boxstyle="round,pad=0.5", fc="#F8FAFC", ec='#0284C7', lw=1.2))

    ax_cycle.set_xlabel("Fase Waktu Siklus 4 Tahunan Halving", fontsize=9.5, fontweight='bold', color=COLORS['text_sub'])
    ax_cycle.set_ylabel("Indeks Kekuatan Relatif (%)", fontsize=9.5, fontweight='bold', color=COLORS['text_sub'])
    ax_cycle.set_xticks([])
    ax_cycle.set_ylim(0, 85)
    ax_cycle.grid(True, linestyle=':', alpha=0.5, color=COLORS['grid'])
    ax_cycle.legend(loc='upper right', fontsize=8.2)

    plt.suptitle("MBG QUANT ACADEMY // MODUL 5: PIRAMIDA LIKUIDITAS KRIPTO & SIKLUS ROTASI MODAL",
                 fontsize=13, fontweight='bold', color=COLORS['text_main'], y=0.98)

    filepath = os.path.join(OUTPUT_DIR, "06_crypto_liquidity_pyramid.png")
    plt.savefig(filepath)
    plt.close()
    print(f"  -> Disimpan: {filepath}")


# =========================================================
# EKSEKUTOR UTAMA
# =========================================================
if __name__ == "__main__":
    print("===============================================================")
    print(" MEMULAI GENERASI 6 DIAGRAM VISUAL MBG QUANT ACADEMY (DPI 300)")
    print("===============================================================")
    generate_diagram_1()
    generate_diagram_2()
    generate_diagram_3()
    generate_diagram_4()
    generate_diagram_5()
    generate_diagram_6()
    print("===============================================================")
    print(f" SELURUH 6 GAMBAR BERHASIL DIBUAT DI FOLDER: {OUTPUT_DIR}")
    print("===============================================================")