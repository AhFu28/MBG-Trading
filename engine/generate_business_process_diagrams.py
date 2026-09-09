import matplotlib.pyplot as plt
import matplotlib.patches as patches

def create_business_process_diagram(output_path='engine/diagram_business_process.png'):
    fig, ax = plt.subplots(figsize=(14, 5.8), dpi=300)
    fig.patch.set_facecolor('#0F172A') # Dark institutional background
    ax.set_facecolor('#0F172A')

    # Title
    ax.text(7, 5.3, 'DIAGRAM ALUR PROSES BISNIS END-TO-END // PROJECT MBG VERSION 2', 
            fontsize=15, fontweight='bold', color='#F8FAFC', ha='center', va='center')
    ax.text(7, 4.95, 'Transformasi Data Mentah Menjadi Keputusan Finansial Disiplin, Aman, dan Menguntungkan', 
            fontsize=9.5, color='#94A3B8', ha='center', va='center')

    # 6 Process Steps Boxes
    steps = [
        {
            'num': 'TAHAP 1', 'title': 'PENGUMPULAN\nDATA 24/7',
            'desc': '• Harga Saham BEI\n• Wall Street & Asia\n• Kurs Forex & Kripto\n• Berita The Fed & Minyak\n(Zero-Cost Public Data)',
            'color': '#1E293B', 'border': '#38BDF8', 'x': 0.5
        },
        {
            'num': 'TAHAP 2', 'title': 'OTAK QUANT\n& AI PINTAR',
            'desc': '• Detektor Smart Money\n• Bandarmologi Asing\n• AI Google TimesFM 2.5\n• Translasi "Bahasa Bayi"\n(Filter Peluang Emas)',
            'color': '#1E293B', 'border': '#818CF8', 'x': 2.7
        },
        {
            'num': 'TAHAP 3', 'title': 'GERBANG RISIKO\nSTANDAR ASTRA',
            'desc': '• Pisah Fakta vs Opini\n• Batas Beli & Stop Loss\n• Hitung Lot Modal Aman\n• Status Human Review\n(Kunci Anti-Boncos)',
            'color': '#1E293B', 'border': '#F59E0B', 'x': 4.9
        },
        {
            'num': 'TAHAP 4', 'title': 'DISTRIBUSI\nMULTI-CHANNEL',
            'desc': '• Bot Telegram ke HP\n• Web Cockpit Cloudflare\n• Flash Alert Berita 24/7\n• Briefing Pagi 07:15\n(Siap Siaga di Saku)',
            'color': '#1E293B', 'border': '#10B981', 'x': 7.1
        },
        {
            'num': 'TAHAP 5', 'title': 'EKSEKUSI OLEH\nPENGGUNA',
            'desc': '• Pengguna Cek Rencana\n• Buka Aplikasi Sekuritas\n  (Ajaib, Stockbit, dll)\n• Beli Lot Sesuai Tiket\n(Disiplin Mandiri)',
            'color': '#1E293B', 'border': '#34D399', 'x': 9.3
        },
        {
            'num': 'TAHAP 6', 'title': 'EVALUASI\nOTOMATIS (LOOP)',
            'desc': '• Paper Trading Virtual\n• Rekam Jejak 30 Hari\n• Liga Strategi Exp3\n  (Sistem Makin Pintar)\n(Adaptasi Pasar)',
            'color': '#1E293B', 'border': '#A78BFA', 'x': 11.5
        },
    ]

    for s in steps:
        # Box background
        rect = patches.FancyBboxPatch(
            (s['x'], 1.2), 1.95, 3.2,
            boxstyle="round,pad=0.08,rounding_size=0.15",
            facecolor=s['color'], edgecolor=s['border'], linewidth=1.8
        )
        ax.add_patch(rect)

        # Header tag
        tag = patches.FancyBboxPatch(
            (s['x'] + 0.25, 3.9), 1.45, 0.35,
            boxstyle="round,pad=0.04,rounding_size=0.08",
            facecolor=s['border'], edgecolor='none'
        )
        ax.add_patch(tag)
        ax.text(s['x'] + 0.975, 4.07, s['num'], fontsize=7.5, fontweight='bold', color='#0F172A', ha='center', va='center')

        # Title
        ax.text(s['x'] + 0.975, 3.4, s['title'], fontsize=9, fontweight='bold', color='#F8FAFC', ha='center', va='center', linespacing=1.1)

        # Separator line
        ax.plot([s['x'] + 0.2, s['x'] + 1.75], [2.9, 2.9], color='#334155', linewidth=1)

        # Description
        ax.text(s['x'] + 0.975, 2.05, s['desc'], fontsize=7.2, color='#CBD5E1', ha='center', va='center', linespacing=1.2)

        # Connecting Arrow to next step
        if s['x'] < 11:
            ax.annotate('', xy=(s['x'] + 2.15, 2.8), xytext=(s['x'] + 1.95, 2.8),
                        arrowprops=dict(arrowstyle="->,head_width=0.25,head_length=0.3", color='#38BDF8', lw=1.8))

    # Bottom Feedback Loop Arrow (from Step 6 back to Step 2)
    ax.annotate('', xy=(3.675, 0.8), xytext=(12.475, 0.8),
                arrowprops=dict(arrowstyle="->,head_width=0.25,head_length=0.3", color='#A78BFA', lw=1.6, linestyle='--'))
    ax.plot([12.475, 12.475], [1.2, 0.8], color='#A78BFA', lw=1.6, linestyle='--')
    ax.plot([3.675, 3.675], [0.8, 1.2], color='#A78BFA', lw=1.6, linestyle='--')
    ax.text(8.0, 0.55, '[LOOP] REINFORCEMENT LEARNING: Evaluasi Hasil Nyata Memperbaiki Bobot Strategi Otomatis',
            fontsize=8, fontweight='bold', color='#C4B5FD', ha='center', va='center')

    ax.set_xlim(0, 14)
    ax.set_ylim(0.3, 5.8)
    ax.axis('off')

    plt.tight_layout()
    plt.savefig(output_path, bbox_inches='tight', dpi=300)
    plt.close()
    print(f"Business process diagram created at: {output_path}")

def create_user_journey_diagram(output_path='engine/diagram_user_journey.png'):
    fig, ax = plt.subplots(figsize=(13, 5.2), dpi=300)
    fig.patch.set_facecolor('#0F172A')
    ax.set_facecolor('#0F172A')

    # Title
    ax.text(6.5, 4.8, 'SOP HARIAN PENGGUNA AWAM // BAGAIMANA TRADER MENGAMBIL KEPUTUSAN', 
            fontsize=14, fontweight='bold', color='#F8FAFC', ha='center', va='center')
    ax.text(6.5, 4.45, '4 Langkah Mudah dan Disiplin dari Pagi Sampai Sore (Anti-Bingung, Anti-Boncos)', 
            fontsize=9, color='#94A3B8', ha='center', va='center')

    steps = [
        {
            'time': 'JAM 07:15 WIB', 'title': '1. BUKA TELEGRAM DI HP',
            'desc': '• Terima pesan ringkasan pagi\n• Cek arah pasar dunia semalam\n• Lihat Top 5 Saham Pilihan\n(Cukup baca 1 menit di kasur/meja)',
            'color': '#064E3B', 'border': '#10B981', 'x': 0.5
        },
        {
            'time': 'JAM 08:45 WIB', 'title': '2. BUKA WEB COCKPIT',
            'desc': '• Buka link dari Telegram di browser\n• Cek grafik ramalan AI TimesFM\n• Pastikan Asing sedang akumulasi\n(Konfirmasi lampu hijau visual)',
            'color': '#1E3A8A', 'border': '#3B82F6', 'x': 3.6
        },
        {
            'time': 'JAM 08:50 WIB', 'title': '3. HITUNG LOT MODAL',
            'desc': '• Buka Kalkulator Lot Astra di web\n• Ketik uang modal Anda (misal 10jt)\n• Sistem hitungkan: "Beli 12 Lot"\n(Kunci batas risiko rugi terukur)',
            'color': '#78350F', 'border': '#F59E0B', 'x': 6.7
        },
        {
            'time': 'JAM 09:00 WIB', 'title': '4. ORDER DI SEKURITAS',
            'desc': '• Buka aplikasi Ajaib / Stockbit\n• Pasang antre beli sesuai angka tiket\n• Pasang Stop Loss & Target TP\n(Eksekusi tenang tanpa emosi)',
            'color': '#312E81', 'border': '#8B5CF6', 'x': 9.8
        },
    ]

    for s in steps:
        # Box background
        rect = patches.FancyBboxPatch(
            (s['x'], 1.1), 2.7, 2.9,
            boxstyle="round,pad=0.08,rounding_size=0.15",
            facecolor='#1E293B', edgecolor=s['border'], linewidth=1.8
        )
        ax.add_patch(rect)

        # Header tag
        tag = patches.FancyBboxPatch(
            (s['x'] + 0.35, 3.55), 2.0, 0.36,
            boxstyle="round,pad=0.04,rounding_size=0.08",
            facecolor=s['color'], edgecolor=s['border'], linewidth=1
        )
        ax.add_patch(tag)
        ax.text(s['x'] + 1.35, 3.73, s['time'], fontsize=8, fontweight='bold', color='#F8FAFC', ha='center', va='center')

        # Title
        ax.text(s['x'] + 1.35, 3.15, s['title'], fontsize=9, fontweight='bold', color='#F8FAFC', ha='center', va='center')

        # Separator line
        ax.plot([s['x'] + 0.3, s['x'] + 2.4], [2.75, 2.75], color='#334155', linewidth=1)

        # Description
        ax.text(s['x'] + 1.35, 1.9, s['desc'], fontsize=7.5, color='#CBD5E1', ha='center', va='center', linespacing=1.25)

        # Connecting Arrow to next step
        if s['x'] < 9.5:
            ax.annotate('', xy=(s['x'] + 2.9, 2.55), xytext=(s['x'] + 2.7, 2.55),
                        arrowprops=dict(arrowstyle="->,head_width=0.25,head_length=0.3", color='#38BDF8', lw=1.8))

    # Continuous Monitoring Callout
    banner = patches.FancyBboxPatch(
        (0.5, 0.3), 12.0, 0.55,
        boxstyle="round,pad=0.05,rounding_size=0.1",
        facecolor='#1E293B', edgecolor='#10B981', linewidth=1.2
    )
    ax.add_patch(banner)
    ax.text(6.5, 0.57, '[SIAGA 24/7]: Jika ada berita darurat atau sinyal baru, HP Anda otomatis bergetar menerima push Telegram!',
            fontsize=8, fontweight='bold', color='#34D399', ha='center', va='center')

    ax.set_xlim(0, 13)
    ax.set_ylim(0.1, 5.2)
    ax.axis('off')

    plt.tight_layout()
    plt.savefig(output_path, bbox_inches='tight', dpi=300)
    plt.close()
    print(f"User journey diagram created at: {output_path}")

if __name__ == '__main__':
    create_business_process_diagram()
    create_user_journey_diagram()
