import sys, os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover

        self.saveState()
        self.setFont('Helvetica-Bold', 7)
        self.setFillColor(colors.HexColor('#64748B'))
        
        # Header
        self.drawString(18*mm, 282*mm, 'PROJECT MBG VERSION 2 // MASTER SPECIFICATION & SETUP GUIDE')
        self.setFont('Helvetica', 7)
        self.drawRightString(192*mm, 282*mm, 'MBG V2.0 - MASTER PRD')
        self.setStrokeColor(colors.HexColor('#CBD5E1'))
        self.setLineWidth(0.5)
        self.line(18*mm, 280*mm, 192*mm, 280*mm)

        # Footer
        self.line(18*mm, 15*mm, 192*mm, 15*mm)
        self.setFont('Helvetica', 7)
        self.drawString(18*mm, 11*mm, 'CONFIDENTIAL - FOR STAKEHOLDERS, TRADERS & SYSTEM ENGINEERS')
        self.drawRightString(192*mm, 11*mm, f'Page {self._pageNumber} of {page_count}')
        self.restoreState()

def build_pdf():
    target_dir = 'COMPILE PRD'
    os.makedirs(target_dir, exist_ok=True)
    target_pdf = os.path.join(target_dir, 'PRD_Project_MBG_v2_Master.pdf')
    
    doc = SimpleDocTemplate(
        target_pdf,
        pagesize=A4,
        leftMargin=18*mm,
        rightMargin=18*mm,
        topMargin=22*mm,
        bottomMargin=20*mm
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=27,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=3
    )
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#059669'),
        spaceAfter=10
    )
    meta_label = ParagraphStyle('MetaLabel', fontName='Helvetica-Bold', fontSize=7.2, leading=9.5, textColor=colors.HexColor('#475569'))
    meta_val = ParagraphStyle('MetaVal', fontName='Helvetica', fontSize=7.2, leading=9.5, textColor=colors.HexColor('#0F172A'))

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15.5,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.6,
        leading=11,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=3.5
    )
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.6,
        leading=11,
        textColor=colors.HexColor('#1E293B'),
        leftIndent=10,
        firstLineIndent=-6,
        spaceAfter=2
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.8,
        leading=9,
        textColor=colors.HexColor('#1E293B')
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.8,
        leading=9,
        textColor=colors.HexColor('#0F172A')
    )
    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9.5,
        textColor=colors.white
    )
    callout_text = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.4,
        leading=10.5,
        textColor=colors.HexColor('#1E293B')
    )
    telegram_box = ParagraphStyle(
        'TelegramBox',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=6.8,
        leading=9.2,
        textColor=colors.HexColor('#0F172A')
    )

    story = []

    def make_callout(text):
        p = Paragraph(text, callout_text)
        t = Table([[p]], colWidths=[174*mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('LINELEFT', (0,0), (0,0), 3, colors.HexColor('#059669')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        return t

    def make_telegram_card(text):
        p = Paragraph(text, telegram_box)
        t = Table([[p]], colWidths=[174*mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F0FDF4')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#86EFAC')),
            ('LINELEFT', (0,0), (0,0), 3.5, colors.HexColor('#16A34A')),
            ('TOPPADDING', (0,0), (-1,-1), 3.5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        return t

    # ----------------- COVER / HEADER PAGE -----------------
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph('PROJECT MBG VERSION 2', title_style))
    story.append(Paragraph('The Unified Autonomous Quant Cockpit &amp; 24/7 Intelligence Terminal', subtitle_style))
    story.append(Paragraph('Penggabungan Komprehensif: Project ARIB + MBG Trading Cockpit v1 + MBG B Plan + Cloudflare Edge', body_style))
    story.append(Spacer(1, 2*mm))
    story.append(HRFlowable(width='100%', thickness=2, color=colors.HexColor('#059669'), spaceAfter=8))

    meta_data = [
        [Paragraph('Official Project Name', meta_label), Paragraph('Project MBG version 2', meta_val),
         Paragraph('Effective Date', meta_label), Paragraph('2026-09-09', meta_val)],
        [Paragraph('Document Identifier', meta_label), Paragraph('MBG-V2-PRD-MASTER-LAYMAN-PRO-V2.0', meta_val),
         Paragraph('Document Status', meta_label), Paragraph('APPROVED FOR PRODUCTION SPRINT', meta_val)],
        [Paragraph('Unified Tech Stack', meta_label), Paragraph('Next.js 16 (ARIB UI) + Python 3.11 + Cloudflare Pages', meta_val),
         Paragraph('Monthly Infrastructure', meta_label), Paragraph('RP 0 / BULAN (Zero-Server-Cost Architecture)', meta_val)],
        [Paragraph('Core Highlights', meta_label), Paragraph('Visual Process Flow + 24/7 Telegram + Setup Guide', meta_val),
         Paragraph('Target Audience', meta_label), Paragraph('Trader Pemula, Investor, Non-IT People, Developers', meta_val)],
    ]
    t_meta = Table(meta_data, colWidths=[36*mm, 54*mm, 34*mm, 50*mm])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 4*mm))

    story.append(make_callout('<b>RINGKASAN EKSEKUTIF (UNTUK ORANG AWAM):</b> Project MBG version 2 adalah terminal trading terlengkap yang menyatukan antarmuka visual modern Project ARIB, otak kuantitatif konglomerat BEI dari MBG v1, kecerdasan buatan Google TimesFM dari MBG B Plan, serta jaringan super cepat Cloudflare. Sistem ini dirancang 100% ramah orang awam dengan diagram proses visual, bahasa santai ("Bahasa Bayi"), kalkulator lot anti-boncos, panduan setup praktis, dan <b>Mesin Bot Telegram Siaga 24/7</b> yang mengirimkan berita penting dan rekomendasi saham siap beli secara instan.'))
    story.append(Spacer(1, 3*mm))

    # SECTION 1
    story.append(Paragraph('1. Visi Produk &amp; Mengapa Project MBG version 2 Dibuat', h1_style))
    story.append(Paragraph('1.1 Masalah Nyata yang Dihadapi Trader Sehari-hari', h2_style))
    story.append(Paragraph('Sebanyak 90% trader pemula dan retail boncos di pasar modal karena 3 kendala besar:', body_style))
    story.append(Paragraph('&bull; <b>Ketinggalan Sinyal &amp; Berita Bagus (FOMO):</b> Peluang emas sering terjadi saat kita sedang sibuk bekerja atau di jalan. Trader baru tahu setelah harga melonjak tinggi, lalu beli di pucuk dan akhirnya nyangkut.', bullet_style))
    story.append(Paragraph('&bull; <b>Berita Terlalu Rumit:</b> Berita The Fed, inflasi CPI, atau perang dagang disajikan dengan istilah rumit. Orang awam tidak tahu efek riilnya ke saham lokal seperti BBRI atau koin Bitcoin.', bullet_style))
    story.append(Paragraph('&bull; <b>Trading Pakai Emosi &amp; Salah Ukuran Lot:</b> Masuk pasar tanpa Stop Loss dan membeli terlalu banyak lot sehingga tabungan cepat terkuras saat pasar mengalami koreksi.', bullet_style))

    story.append(Paragraph('1.2 Solusi Project MBG version 2: Asisten Pribadi 24/7 di Saku Anda', h2_style))
    story.append(Paragraph('&bull; <b>Radar Telegram Siaga 24/7:</b> Mengirimkan alert saham/kripto yang siap dibeli dan breaking news makro seketika ke HP Anda.', bullet_style))
    story.append(Paragraph('&bull; <b>Bahasa Bayi Edukatif:</b> Menjelaskan istilah ekonomi rumit dengan analogi sehari-hari yang mudah dimengerti dalam 5 detik.', bullet_style))
    story.append(Paragraph('&bull; <b>Kalkulator Lot Anti-Boncos Astra:</b> Menghitungkan secara pasti berapa lot yang boleh Anda beli sesuai uang dingin modal Anda.', bullet_style))
    story.append(Paragraph('&bull; <b>Infrastruktur Cloudflare Jakarta (&lt;25ms):</b> Tampilan web terbuka seketika tanpa loading berputar, dengan biaya operasional Rp 0 / bulan.', bullet_style))

    story.append(PageBreak())

    # SECTION 2: VISUALISASI GRAFIK PROSES BISNIS
    story.append(Paragraph('2. Visualisasi Grafik Alur Proses Bisnis &amp; User Journey', h1_style))
    story.append(Paragraph('Untuk memudahkan seluruh pemangku kepentingan (termasuk non-IT), proses bisnis inti dan perjalanan harian pengguna disajikan dalam dua diagram visual alur di bawah ini:', body_style))
    story.append(Spacer(1, 2*mm))

    diag_bp = 'engine/diagram_business_process.png'
    if os.path.exists(diag_bp):
        story.append(Image(diag_bp, width=174*mm, height=72*mm))
        story.append(Spacer(1, 2*mm))

    story.append(Paragraph('2.1 Penjelasan 6 Tahapan Proses Bisnis End-to-End:', h2_style))
    story.append(Paragraph('&bull; <b>Tahap 1 (Pengumpulan Data 24/7):</b> Sensor menarik live data bursa BEI, Wall Street, kurs forex, obligasi, dan komoditas via endpoint publik gratis tanpa biaya langganan data.', bullet_style))
    story.append(Paragraph('&bull; <b>Tahap 2 (Otak Quant &amp; AI Pintar):</b> Algoritma memindai Smart Money (Order Block/FVG), arus akumulasi asing BEI, dan menghitung proyeksi probabilitas AI Google TimesFM 2.5.', bullet_style))
    story.append(Paragraph('&bull; <b>Tahap 3 (Gerbang Risiko Standar Astra):</b> Uji kelayakan ketat. Sinyal yang memiliki rasio untung/rugi di bawah 1:2 atau tidak memenuhi syarat invalidasi langsung dibuang demi keamanan.', bullet_style))
    story.append(Paragraph('&bull; <b>Tahap 4 (Distribusi Multi-Channel):</b> Sinyal yang lolos uji diteruskan ke smartphone via Bot Telegram dan ditampilkan di web cockpit Cloudflare.', bullet_style))
    story.append(Paragraph('&bull; <b>Tahap 5 (Eksekusi Pengguna Mandiri):</b> Pengguna membaca rencana trading, memasukkan modal di kalkulator lot, dan memasang order beli di aplikasi sekuritas resmi (Ajaib, Stockbit, dll).', bullet_style))
    story.append(Paragraph('&bull; <b>Tahap 6 (Evaluasi Otomatis / Feedback Loop):</b> Hasil transaksi dicatat di Paper Trading virtual. Algoritma Exp3 Multi-Armed Bandit mengevaluasi performa agar sistem semakin pintar setiap hari.', bullet_style))

    story.append(PageBreak())

    # SECTION 2.2: DIAGRAM USER JOURNEY
    story.append(Paragraph('2.2 Diagram Alur Pengambilan Keputusan Pengguna Awam (User Daily SOP)', h1_style))
    story.append(Paragraph('Diagram berikut menunjukkan bagaimana seorang pengguna awam menjalankan aktivitas trading harian secara disiplin dan terarah:', body_style))
    story.append(Spacer(1, 2*mm))

    diag_uj = 'engine/diagram_user_journey.png'
    if os.path.exists(diag_uj):
        story.append(Image(diag_uj, width=174*mm, height=70*mm))
        story.append(Spacer(1, 2*mm))

    story.append(Paragraph('Panduan Singkat Langkah Harian:', h2_style))
    story.append(Paragraph('&bull; <b>Pagi (07:15 WIB):</b> Cukup buka Telegram di HP untuk melihat arah pasar dunia dan Top 5 Saham Pilihan hari ini.', bullet_style))
    story.append(Paragraph('&bull; <b>Sebelum Bursa Buka (08:45 WIB):</b> Buka web cockpit, konfirmasi bahwa indikator asing berwarna hijau dan grafik ramalan AI TimesFM mendukung.', bullet_style))
    story.append(Paragraph('&bull; <b>Hitung Lot Modal (08:50 WIB):</b> Masukkan uang dingin Anda di kalkulator lot untuk mengetahui jumlah lot yang aman dibeli.', bullet_style))
    story.append(Paragraph('&bull; <b>Pasang Order (09:00 WIB):</b> Buka sekuritas langganan Anda, antre beli sesuai angka tiket. Jika kena TP jual untung, jika kena SL keluar disiplin.', bullet_style))

    story.append(PageBreak())

    # SECTION 3: TELEGRAM BOT 24/7
    story.append(Paragraph('3. Fitur Unggulan Bot Telegram 24/7 (News, Sinyal Siap Beli &amp; Chat 2-Arah)', h1_style))
    story.append(Paragraph('Sistem bot Telegram Project MBG version 2 beroperasi penuh 24/7 dalam dua mode: <b>Broadcast Otomatis</b> (notifikasi kilat) dan <b>Percakapan Interaktif 2-Arah</b> (pengguna bisa chat ke bot kapan saja):', body_style))

    story.append(Paragraph('3.1 Tipe 1: Sinyal Saham Siap Beli (Instant Buy Signal Alert — Siaga 24/7)', h2_style))
    sample_buy_alert = (
        '<b>🎯 [SINYAL SIAP BELI] — REKOMENDASI TERVERIFIKASI</b><br/>'
        '<b>Instrumen:</b> $BBRI (Bank Rakyat Indonesia) &bull; <b>Setup:</b> Rebound Support Konglomerat &amp; Inflow Asing<br/>'
        '<b>📊 FAKTA DATA:</b> Harga: Rp 4.920 &bull; Net Foreign Buy 3 Hari: +Rp 385 Miliar &bull; AI TimesFM: Bullish 84% (Rp 4.900 - 5.250)<br/>'
        '<b>🎯 RENCANA EKSEKUSI ASTRA:</b> Entry: Rp 4.900 - 4.940 &bull; Hard SL: Rp 4.750 &bull; TP1: Rp 5.150 (+4.6%) &bull; TP2: Rp 5.350 (+8.7%)<br/>'
        '<b>💰 KALKULATOR LOT (MODAL RP 10JT, RISIKO 2% = RP 200RB):</b> 👉 <b>Beli Maksimal: 12 Lot</b> (Rugi terkunci maks Rp 204.000)<br/>'
        '⚠️ <i>Status: AWAITING_HUMAN_REVIEW. Cek chart interaktif di: https://mbg-v2.pages.dev/markets/indonesia</i>'
    )
    story.append(make_telegram_card(sample_buy_alert))
    story.append(Spacer(1, 1.5*mm))

    story.append(Paragraph('3.2 Tipe 2: Breaking News &amp; Macro Shock Radar (Siaga 24/7)', h2_style))
    sample_macro_alert = (
        '<b>🚨 [BREAKING MACRO ALERT] — VOLATILITAS TINGGI TERDETEKSI</b><br/>'
        '<b>Peristiwa:</b> Lonjakan Harga Emas Dunia (+2.4% dlm 2 Jam) &bull; <b>Level Bahaya:</b> 🔴 TINGGI (HIGH IMPACT)<br/>'
        '<b>💡 BAHASA BAYI:</b> &ldquo;Geopolitik memanas, investor dunia panik mengamankan uang ke Emas. Harga emas internasional terbang.&rdquo;<br/>'
        '<b>🌊 DAMPAK PASAR:</b> Saham Emas BEI ($ANTM, $BRMS) Bullish Kuat &bull; Saham Bank/IHSG Tertekan Sementara &bull; Kripto ($BTC) Volatile.<br/>'
        '<b>🛡️ SARAN TINDAKAN:</b> Jangan buru-buru Haka saham perbankan. Pantau saham emas untuk swing cepat, pasang Stop Loss ketat.'
    )
    story.append(make_telegram_card(sample_macro_alert))
    story.append(Spacer(1, 1.5*mm))

    story.append(Paragraph('3.3 Tipe 3: Morning Briefing 07:15 WIB &amp; Midday Recap 12:15 WIB', h2_style))
    sample_briefing = (
        '<b>🌅 [MORNING BRIEFING 07:15 WIB] — TOP 5 SAHAM BEI &amp; KRIPTO HARI INI</b><br/>'
        '<b>🌍 GLOBAL:</b> Wall St Bullish (+0.5%) &bull; Minyak Brent $78.40 (+1.2%) &bull; DXY 101.2 &bull; <b>Sentimen IHSG: Bullish Hijau</b><br/>'
        '<b>🇮🇩 TOP 5 BEI:</b> 1. $BBRI (Buy 4900/TP 5250) &bull; 2. $ASII (Buy 5150/TP 5450) &bull; 3. $BREN (Buy 9800/TP 10600) &bull; 4. $ICBP &bull; 5. $PTBA<br/>'
        '<b>⚡ TOP 3 KRIPTO SPOT:</b> 1. $BTC/USDT (Long $58.200) &bull; 2. $ETH ($2.480) &bull; 3. $SOL ($138.5) | 🔗 <i>Web: https://mbg-v2.pages.dev</i>'
    )
    story.append(make_telegram_card(sample_briefing))
    story.append(Spacer(1, 1.5*mm))

    story.append(Paragraph('3.4 Tipe 4: Format Percakapan Interaktif 2-Arah (Conversational Chat Mode)', h2_style))
    sample_chat_mode = (
        '<b>🤖 [CONVERSATIONAL BOT CHAT — PENGGUNA BISA CHAT KAPAN SAJA]</b><br/>'
        '<b>&bull; User:</b> <code>/rekom</code> &rarr; <b>Bot:</b> &ldquo;Daftar Saham Siap Beli: 1. $BBRI (Buy Rp 4.900), 2. $ASII (Buy Rp 5.150). Ketik /cek BBRI untuk detail!&rdquo;<br/>'
        '<b>&bull; User:</b> <code>/cek BBCA</code> &rarr; <b>Bot:</b> &ldquo;BBCA Rp 9.850. Net Foreign Buy +Rp 142 Miliar. Order Block di Rp 9.775. AI TimesFM Bullish Rp 10.150.&rdquo;<br/>'
        '<b>&bull; User:</b> <code>/news</code> &rarr; <b>Bot:</b> &ldquo;3 Berita Terkini: 1. The Fed rilis notula rapat, 2. Cadangan minyak AS turun, 3. BI-Rate tetap di 6.00%.&rdquo;<br/>'
        '<b>&bull; User:</b> <code>/makro</code> &rarr; <b>Bot:</b> &ldquo;Radar Makro: Emas $2.510 (+0.3%), Brent $78.40 (+1.2%), DXY 101.2 pts, Yield US 10Y 3.82% (Stabil).&rdquo;'
    )
    story.append(make_telegram_card(sample_chat_mode))
    story.append(Spacer(1, 2*mm))

    tg_schedule_data = [
        [Paragraph('Waktu / Pola', table_header), Paragraph('Nama Format Pesan Telegram', table_header), Paragraph('Fungsi &amp; Manfaat bagi Pengguna', table_header)],
        [Paragraph('<b>07:15 WIB</b>', table_cell_bold), Paragraph('Morning Briefing', table_cell), Paragraph('Rangkuman Wall Street semalam &amp; <b>Top 5 Saham BEI + Top 3 Kripto Pilihan</b> hari ini.', table_cell)],
        [Paragraph('<b>12:15 WIB</b>', table_cell_bold), Paragraph('Midday Session 1', table_cell), Paragraph('Review Sesi 1 IHSG, daftar akumulasi asing terbanyak vs distribusi asing terbanyak.', table_cell)],
        [Paragraph('<b>18:30 WIB</b>', table_cell_bold), Paragraph('Evening Watch', table_cell), Paragraph('Rekap penutupan bursa BEI, status TP/SL hari ini, dan persiapan Wall Street malam.', table_cell)],
        [Paragraph('<b>Realtime 24/7</b>', table_cell_bold), Paragraph('Instant Buy &amp; Macro Shock', table_cell), Paragraph('Peringatan seketika jika ada saham menyentuh area beli atau lonjakan emas/minyak/dolar.', table_cell)],
        [Paragraph('<b>Chat 2-Arah</b>', table_cell_bold), Paragraph('Conversational Commands', table_cell), Paragraph('Pengguna bisa chat <code>/rekom</code>, <code>/cek [EMITEN]</code>, <code>/news</code>, <code>/makro</code> kapan saja.', table_cell)],
    ]
    t_tgs = Table(tg_schedule_data, colWidths=[24*mm, 42*mm, 108*mm])
    t_tgs.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_tgs)

    story.append(PageBreak())

    # SECTION 4 & 5
    story.append(Paragraph('4. Panduan Lengkap Tahapan Set Up (Step-by-Step Setup Guide)', h1_style))
    story.append(Paragraph('Berikut adalah panduan instalasi langkah-demi-langkah dari nol agar sistem ini dapat langsung dioperasikan oleh siapa pun:', body_style))

    setup_steps = [
        [Paragraph('Tahap &amp; Langkah', table_header), Paragraph('Aktivitas yang Dilakukan', table_header), Paragraph('Perintah / Tindakan Konkret', table_header)],
        [
            Paragraph('<b>Langkah 1:</b><br/>Persiapan Komputer', table_cell_bold),
            Paragraph('Pastikan terpasang Node.js v20+ atau Bun, serta Python 3.11+.', table_cell),
            Paragraph('Ekstrak berkas source code:<br/><code>mkdir project-mbg-v2<br/>cd project-mbg-v2<br/>tar -xf &quot;..\\another project\\workspace-...tar&quot;</code>', table_cell)
        ],
        [
            Paragraph('<b>Langkah 2:</b><br/>Setup Database Supabase', table_cell_bold),
            Paragraph('Buat akun gratis di <b>supabase.com</b>, buat proyek <code>mbg-v2-db</code>.', table_cell),
            Paragraph('Buka menu <b>SQL Editor</b>, jalankan skrip <code>engine/database/schema.sql</code>. Salin <code>Project URL</code> dan <code>anon key</code> dari menu API Settings.', table_cell)
        ],
        [
            Paragraph('<b>Langkah 3:</b><br/>Setup Bot Telegram', table_cell_bold),
            Paragraph('Buat Bot baru via <b>@BotFather</b> di aplikasi Telegram.', table_cell),
            Paragraph('Ketik <code>/newbot</code>, beri nama <code>MBG v2 Radar Bot</code>. Salin <b>Bot Token</b>. Cari <b>@userinfobot</b> untuk mengetahui <code>Chat ID</code> Anda.', table_cell)
        ],
        [
            Paragraph('<b>Langkah 4:</b><br/>Konfigurasi Berkas .env', table_cell_bold),
            Paragraph('Buat file <code>.env</code> di root folder untuk menyimpan kredensial aman.', table_cell),
            Paragraph('Isi nilai:<br/><code>SUPABASE_URL=https://...<br/>TELEGRAM_BOT_TOKEN=123...<br/>TELEGRAM_CHAT_ID=456...</code>', table_cell)
        ],
        [
            Paragraph('<b>Langkah 5:</b><br/>Uji Coba di Komputer', table_cell_bold),
            Paragraph('Uji kirim Telegram dan jalankan dashboard web di localhost.', table_cell),
            Paragraph('Jalankan backend: <code>py engine/run_pipeline.py --mode all</code> (cek Telegram Anda!). Jalankan web: <code>npm install &amp;&amp; npm run dev</code>.', table_cell)
        ],
        [
            Paragraph('<b>Langkah 6:</b><br/>Deploy ke Cloudflare', table_cell_bold),
            Paragraph('Hubungkan repository GitHub ke <b>Cloudflare Pages</b> (Gratis).', table_cell),
            Paragraph('Pilih preset <b>Next.js</b>, klik Deploy. Web aktif 24/7 di domain <code>https://mbg-v2.pages.dev</code>. Cron Python berjalan otomatis di GitHub Actions.', table_cell)
        ],
    ]
    t_stp = Table(setup_steps, colWidths=[28*mm, 52*mm, 94*mm])
    t_stp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_stp)
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph('5. Evaluasi Cloudflare — Mengapa Jauh Lebih Menguntungkan?', h1_style))
    cf_eval = [
        [Paragraph('Kriteria Perbandingan', table_header), Paragraph('Vercel Biasa', table_header), Paragraph('Cloudflare Pages (Pilihan Juara)', table_header), Paragraph('Dampak Langsung ke Pengguna', table_header)],
        [Paragraph('<b>Kecepatan di Indonesia</b>', table_cell_bold), Paragraph('80 - 150 ms (Server Singapore)', table_cell), Paragraph('<b>15 - 25 ms (Data Center Jakarta)</b>', table_cell), Paragraph('Web terbuka seketika tanpa jeda loading.', table_cell)],
        [Paragraph('<b>Batas Kuota Bandwidth</b>', table_cell_bold), Paragraph('100 GB/bln (Overage fee mahal)', table_cell), Paragraph('<b>UNLIMITED BANDWIDTH (Gratis Bebas)</b>', table_cell), Paragraph('Nol risiko tagihan membengkak jika ramai.', table_cell)],
        [Paragraph('<b>Proteksi Keamanan Bot</b>', table_cell_bold), Paragraph('Captcha standar', table_cell), Paragraph('<b>Cloudflare Turnstile Enterprise</b>', table_cell), Paragraph('Aman dari hacker tanpa mengganggu user.', table_cell)],
        [Paragraph('<b>Biaya Server Bulanan</b>', table_cell_bold), Paragraph('Berpotensi $20 - $100/bln', table_cell), Paragraph('<b>RP 0 / BULAN (100% Free Tier)</b>', table_cell), Paragraph('Bebas biaya langganan bulanan selamanya.', table_cell)],
    ]
    t_cfe = Table(cf_eval, colWidths=[34*mm, 44*mm, 48*mm, 48*mm])
    t_cfe.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_cfe)

    story.append(PageBreak())

    # SECTION 6 & 7
    story.append(Paragraph('6. Spesifikasi 10 Modul Fitur Unggulan Project MBG version 2', h1_style))
    mod_spec = [
        [Paragraph('Modul Fungsional', table_header), Paragraph('Asal Sistem', table_header), Paragraph('Fitur Kunci &amp; Manfaat Nyata untuk Pengguna Awam', table_header)],
        [Paragraph('<b>1. Radar Makro Bahasa Bayi</b>', table_cell_bold), Paragraph('Project ARIB', table_cell), Paragraph('Memantau 28 event ekonomi global, menerjemahkan angka rumit ke bahasa santai ber-emoji.', table_cell)],
        [Paragraph('<b>2. Kalender Deep-Dive</b>', table_cell_bold), Paragraph('Project ARIB', table_cell), Paragraph('Jadwal rilis ekonomi dunia, baris berita bisa diklik membuka penjelasan edukatif 6 seksi.', table_cell)],
        [Paragraph('<b>3. Detektor Smart Money &amp; Bandar</b>', table_cell_bold), Paragraph('MBG v1 + B Plan', table_cell), Paragraph('Lacak konglomerat BEI (Barito, Salim, Astra, dll.), akumulasi broker &amp; level Order Block diskon.', table_cell)],
        [Paragraph('<b>4. Ramalan AI TimesFM 2.5</b>', table_cell_bold), Paragraph('MBG B Plan', table_cell), Paragraph('Kecerdasan buatan Google memetakan rentang kemungkinan harga 5 hari ke depan (probabilitas 80%).', table_cell)],
        [Paragraph('<b>5. Kartu Anti-Boncos Astra</b>', table_cell_bold), Paragraph('MBG v1 Core', table_cell), Paragraph('Tiket trading dengan batas beli, Stop Loss, dan kalkulator lot modal otomatis yang transparan.', table_cell)],
        [Paragraph('<b>6. Virtual Paper Trading</b>', table_cell_bold), Paragraph('MBG B Plan', table_cell), Paragraph('Uji coba sinyal sistem dengan uang virtual tanpa risiko, rekam jejak 30 hari tersimpan rapi.', table_cell)],
        [Paragraph('<b>7. Liga Strategi Exp3 Bandit</b>', table_cell_bold), Paragraph('MBG B Plan', table_cell), Paragraph('Sistem otomatis menyeleksi strategi yang sedang sering menang dan memarkir strategi yang lesu.', table_cell)],
        [Paragraph('<b>8. Matriks Korelasi &amp; Backtest</b>', table_cell_bold), Paragraph('Project ARIB', table_cell), Paragraph('Matriks korelasi Pearson 10 aset dan simulasi reaksi harga historis 2 tahun pasca event.', table_cell)],
        [Paragraph('<b>9. Terminal 14 Pasar Dunia</b>', table_cell_bold), Paragraph('Project ARIB', table_cell), Paragraph('Ticker tape 36 aset, bursa saham global (US, ID, Asia), obligasi yield US 10Y, dan 56 mata uang.', table_cell)],
        [Paragraph('<b>10. Bot Telegram Siaga 24/7</b>', table_cell_bold), Paragraph('MBG v1 + v2 Engine', table_cell), Paragraph('Push notifikasi sinyal siap beli, breaking news shock, dan briefing harian langsung ke HP.', table_cell)],
    ]
    t_msp = Table(mod_spec, colWidths=[36*mm, 32*mm, 106*mm])
    t_msp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_msp)
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph('7. Rincian Anggaran Resource (Pembuktian Biaya Rp 0 / Bulan)', h1_style))
    budget_table = [
        [Paragraph('Komponen Sistem', table_header), Paragraph('Penyedia Layanan', table_header), Paragraph('Kapasitas Free Tier yang Disediakan', table_header), Paragraph('Biaya Bulanan', table_header)],
        [Paragraph('Web Frontend &amp; CDN', table_cell_bold), Paragraph('Cloudflare Pages', table_cell), Paragraph('Unlimited Bandwidth, 500 builds/bln, SSL Otomatis', table_cell), Paragraph('<b>Rp 0</b>', table_cell)],
        [Paragraph('Edge Cache Data Harga', table_cell_bold), Paragraph('Cloudflare Workers KV', table_cell), Paragraph('100.000 read requests/hari (Lebih dari cukup)', table_cell), Paragraph('<b>Rp 0</b>', table_cell)],
        [Paragraph('Keamanan Anti-Hacker', table_cell_bold), Paragraph('Cloudflare Turnstile', table_cell), Paragraph('Proteksi anti-bot enterprise tanpa captcha gambar', table_cell), Paragraph('<b>Rp 0</b>', table_cell)],
        [Paragraph('Otak Analisis Quant 24/7', table_cell_bold), Paragraph('GitHub Actions', table_cell), Paragraph('2.000 menit cron gratis/bulan (Pemakaian ~300 mnt)', table_cell), Paragraph('<b>Rp 0</b>', table_cell)],
        [Paragraph('Database Riwayat 30 Hari', table_cell_bold), Paragraph('Supabase PostgreSQL', table_cell), Paragraph('500 MB database, auto-purge 30 hari', table_cell), Paragraph('<b>Rp 0</b>', table_cell)],
        [Paragraph('Notifikasi Smartphone', table_cell_bold), Paragraph('Telegram Bot API', table_cell), Paragraph('Unlimited push message gratis selamanya', table_cell), Paragraph('<b>Rp 0</b>', table_cell)],
        [Paragraph('Data Saham &amp; Forex Live', table_cell_bold), Paragraph('Frankfurter + Yahoo v8', table_cell), Paragraph('Endpoint publik resmi tanpa langganan API', table_cell), Paragraph('<b>Rp 0</b>', table_cell)],
        [Paragraph('<b>TOTAL BIAYA BULANAN</b>', table_cell_bold), Paragraph('<b>Hedge Fund Zero-Cost</b>', table_cell_bold), Paragraph('<b>Bebas Beban Finansial Selamanya</b>', table_cell_bold), Paragraph('<b>RP 0 / BULAN</b>', table_cell_bold)],
    ]
    t_bt = Table(budget_table, colWidths=[36*mm, 42*mm, 70*mm, 26*mm])
    t_bt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-2), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#ECFDF5')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_bt)

    story.append(PageBreak())

    # SECTION 8: ROADMAP
    story.append(Paragraph('8. Roadmap Eksekusi &amp; Rencana Peluncuran (Sprint Plan)', h1_style))
    sprint_table = [
        [Paragraph('Tahapan Sprint', table_header), Paragraph('Target Output Fungsional Sistem', table_header), Paragraph('Penanggung Jawab', table_header)],
        [Paragraph('<b>Sprint 1: Fondasi Stack</b><br/>(Minggu 1)', table_cell_bold), Paragraph('Ekstrak berkas Project ARIB, setup repository GitHub, deploy ke Cloudflare Pages, aktifkan proteksi Turnstile.', table_cell), Paragraph('Tim IT &amp; Infra', table_cell)],
        [Paragraph('<b>Sprint 2: Injeksi Otak MBG</b><br/>(Minggu 2)', table_cell_bold), Paragraph('Hubungkan data 6 Konglomerat BEI, Dividen Hunter, dan kalkulator lot Astra ke UI. Setup database Supabase PostgreSQL.', table_cell), Paragraph('Tim IT &amp; Trader', table_cell)],
        [Paragraph('<b>Sprint 3: Bot Telegram 24/7</b><br/>(Minggu 3)', table_cell_bold), Paragraph('Konfigurasikan notifikasi Sinyal Siap Beli instan, breaking news radar 24/7, dan integrasikan grafik AI TimesFM 2.5.', table_cell), Paragraph('Tim Quant &amp; IT', table_cell)],
        [Paragraph('<b>Sprint 4: Uji Coba Lapangan</b><br/>(Minggu 4)', table_cell_bold), Paragraph('Jalankan paper trading virtual 14 hari bursa, verifikasi keandalan bot Telegram saat volatilitas tinggi, handover ke user.', table_cell), Paragraph('Seluruh Tim', table_cell)],
    ]
    t_sp = Table(sprint_table, colWidths=[36*mm, 102*mm, 36*mm])
    t_sp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_sp)
    story.append(Spacer(1, 4*mm))

    story.append(make_callout('<b>KESIMPULAN FINAL PROJECT MBG VERSION 2:</b> Project MBG version 2 adalah terminal trading masa depan yang menggabungkan kecerdasan analitik level hedge fund dengan visual proses bisnis yang sangat mudah dipahami orang awam. Didukung jaringan Cloudflare lokal Jakarta dan bot Telegram siaga 24/7, Anda tidak akan pernah lagi ketinggalan momen emas di pasar, terhindar dari jebakan berita rumit, dan dapat mengelola risiko modal secara terukur tanpa biaya operasional bulanan.'))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f'SUCCESS: Project MBG v2 Master PRD PDF generated at {target_pdf}')

if __name__ == '__main__':
    build_pdf()
