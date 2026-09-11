import sys, os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
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
            return

        self.saveState()
        self.setFont('Helvetica-Bold', 7)
        self.setFillColor(colors.HexColor('#64748B'))
        
        # Header
        self.drawString(18*mm, 282*mm, 'PROJECT ARIB // MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD)')
        self.setFont('Helvetica', 7)
        self.drawRightString(192*mm, 282*mm, 'V1.0 - INSTITUTIONAL SPEC')
        self.setStrokeColor(colors.HexColor('#CBD5E1'))
        self.setLineWidth(0.5)
        self.line(18*mm, 280*mm, 192*mm, 280*mm)

        # Footer
        self.line(18*mm, 15*mm, 192*mm, 15*mm)
        self.setFont('Helvetica', 7)
        self.drawString(18*mm, 11*mm, 'CONFIDENTIAL - FOR INTERNAL REVIEW & ENGINEERING HANDOVER')
        self.drawRightString(192*mm, 11*mm, f'Page {self._pageNumber} of {page_count}')
        self.restoreState()

def build_pdf():
    target_dir = 'COMPILE PRD'
    os.makedirs(target_dir, exist_ok=True)
    target_pdf = os.path.join(target_dir, 'PRD_Project_ARIB_Master_v1.0.pdf')
    
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
        fontSize=24,
        leading=30,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#059669'),
        spaceAfter=12
    )
    meta_label = ParagraphStyle('MetaLabel', fontName='Helvetica-Bold', fontSize=7.5, leading=10, textColor=colors.HexColor('#475569'))
    meta_val = ParagraphStyle('MetaVal', fontName='Helvetica', fontSize=7.5, leading=10, textColor=colors.HexColor('#0F172A'))

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=12,
        spaceAfter=5,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=4
    )
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor('#1E293B'),
        leftIndent=10,
        firstLineIndent=-6,
        spaceAfter=2.5
    )
    code_block = ParagraphStyle(
        'CodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor('#0F172A')
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor('#1E293B')
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9.5,
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
        fontSize=7.5,
        leading=11,
        textColor=colors.HexColor('#1E293B')
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
            ('LEFTPADDING', (0,0), (-1,-1), 7),
            ('RIGHTPADDING', (0,0), (-1,-1), 7),
        ]))
        return t

    # ----------------- COVER / HEADER PAGE -----------------
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph('PROJECT ARIB', title_style))
    story.append(Paragraph('Autonomous Real-time Intelligence &amp; Backtesting Terminal', subtitle_style))
    story.append(Paragraph('One-Stop Cross-Asset Macro Intelligence Cockpit &bull; Institutional Technical Specification', body_style))
    story.append(Spacer(1, 2*mm))
    story.append(HRFlowable(width='100%', thickness=2, color=colors.HexColor('#059669'), spaceAfter=10))

    meta_data = [
        [Paragraph('Document Identifier', meta_label), Paragraph('ARIB-PRD-MASTER-END-TO-END-V1.0', meta_val),
         Paragraph('Effective Date', meta_label), Paragraph('2026-09-09', meta_val)],
        [Paragraph('Classification', meta_label), Paragraph('Institutional Technical Architecture &amp; Product PRD', meta_val),
         Paragraph('Document Status', meta_label), Paragraph('Approved for Review &amp; Handover', meta_val)],
        [Paragraph('Technology Stack', meta_label), Paragraph('Next.js 16 (App Router), TypeScript, Tailwind v4, shadcn/ui', meta_val),
         Paragraph('Target Runtime', meta_label), Paragraph('Vercel Edge / Node.js 20+ / Bun Standalone', meta_val)],
        [Paragraph('Core Philosophy', meta_label), Paragraph('Zero-API-Cost Resilience &bull; Layman Impact Engine', meta_val),
         Paragraph('Codebase Origin', meta_label), Paragraph('TradePulse Terminal v0.2.0 (Phase 1-13 Production)', meta_val)],
    ]
    t_meta = Table(meta_data, colWidths=[38*mm, 52*mm, 34*mm, 50*mm])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 5*mm))

    story.append(make_callout('<b>EXECUTIVE SUMMARY:</b> Project ARIB adalah terminal trading multi-aset terpadu yang dirancang untuk mengatasi kesenjangan antara berita makroekonomi global dan pergerakan instrumen keuangan riil. Menggunakan arsitektur Next.js 16 dengan 100% Zero-API-Cost (Frankfurter, Yahoo Finance, TradingView CDN), sistem ini mengintegrasikan 10 pasar regional dunia (termasuk IDX Indonesia), pasar obligasi, quant screener, matriks korelasi Pearson, simulasi backtest historis, dan Impact Engine deterministik berbahasa santai (Bahasa Bayi).'))
    story.append(Spacer(1, 4*mm))

    # SECTION 1
    story.append(Paragraph('1. Product Vision, Problem Statement &amp; Personas', h1_style))
    story.append(Paragraph('1.1 Latar Belakang &amp; Problem Statement', h2_style))
    story.append(Paragraph('Di pasar keuangan modern, volatilitas harga lintas instrumen (Saham, Kripto, Forex, Komoditas) dipicu oleh rilis indikator makroekonomi global. Namun trader menghadapi 3 hambatan utama:', body_style))
    story.append(Paragraph('&bull; <b>Fragmentasi Alat &amp; Tab:</b> Trader harus membuka 5-10 tab berbeda (kalender ekonomi, chart teknikal, screener saham, yield obligasi, portal berita).', bullet_style))
    story.append(Paragraph('&bull; <b>Macro Literacy Gap:</b> Angka statistik kalender ekonomi (misal CPI MoM 0.3% vs estimasi 0.2%) disajikan tanpa translasi jelas ke dampak instrumen riil (IHSG, Gold, Bitcoin, DXY).', bullet_style))
    story.append(Paragraph('&bull; <b>Biaya Terminal Institusi:</b> Akses ke terminal institusi seperti Bloomberg Professional ($2,500/bln) tidak realistis bagi trader independen.', bullet_style))

    story.append(Paragraph('1.2 Profil Pengguna Target (User Personas)', h2_style))
    story.append(Paragraph('&bull; <b>The Macro Swing Trader:</b> Memantau pergerakan yield obligasi US 10Y (^TNX), DXY, emas, minyak, dan korelasi Pearson lintas aset untuk merancang portofolio swing berdurasi multi-hari.', bullet_style))
    story.append(Paragraph('&bull; <b>The Retail &amp; Beginner Trader:</b> Sangat memerlukan panduan translasi berita makro ke bahasa awam yang ringkas melalui modul inline deep-dive kalender.', bullet_style))
    story.append(Paragraph('&bull; <b>The Multi-Asset Investor:</b> Mengelola portofolio kombinasi saham BEI Indonesia, saham Wall Street, dan kripto dengan pelacakan PnL lokal dan ekspor laporan.', bullet_style))
    story.append(Paragraph('&bull; <b>The Power-User Day Trader:</b> Memanfaatkan navigasi keyboard kilat (Ctrl+K, hotkey 1-5) dan audio alert tanpa latensi.', bullet_style))

    story.append(PageBreak())

    # SECTION 2
    story.append(Paragraph('2. Arsitektur Sistem End-to-End &amp; Data Flow', h1_style))
    story.append(Paragraph('2.1 Diagram Aliran Data &amp; Layering Arsitektur', h2_style))
    story.append(Paragraph('Project ARIB beroperasi secara fullstack pada kerangka Next.js 16 App Router dengan pemisahan tanggung jawab yang modular:', body_style))

    arch_table_data = [
        [Paragraph('Layer Arsitektur', table_header), Paragraph('Komponen &amp; Teknologi', table_header), Paragraph('Deskripsi Fungsional &amp; Mekanisme', table_header)],
        [Paragraph('1. Ingestion Layer', table_cell_bold), Paragraph('Frankfurter API<br/>Yahoo Finance Query v8<br/>TradingView CDN', table_cell), Paragraph('Menarik live forex 12 pairs, quotes saham 10 kawasan global, crypto, bonds, dan logo emiten tanpa API key.', table_cell)],
        [Paragraph('2. Routing &amp; Cache', table_cell_bold), Paragraph('Next.js API Route Handlers<br/>In-Memory TTL Store<br/>Request Deduplication', table_cell), Paragraph('Menyaring request keluar, caching 60 detik (quotes) hingga 30 menit (backtest), mencegah IP rate limiting.', table_cell)],
        [Paragraph('3. Quant Engines', table_cell_bold), Paragraph('Pearson Correlation Math<br/>Technical Screener (RSI/SMA/MACD)<br/>Historical Backtest Engine', table_cell), Paragraph('Menghitung metrik kuantitatif secara deterministik di level server saat requested, mengurangi beban client.', table_cell)],
        [Paragraph('4. Presentation Layer', table_cell_bold), Paragraph('Tailwind CSS v4<br/>shadcn/ui &bull; Radix UI<br/>Web Audio API Synthesizer', table_cell), Paragraph('Dashboard bertema gelap institusional (#0D1117), responsive fluid, audio alert synthesizer, dan i18n 4 bahasa.', table_cell)],
        [Paragraph('5. Client Storage', table_cell_bold), Paragraph('Browser LocalStorage<br/>Export Utility (CSV/JSON)', table_cell), Paragraph('Penyimpanan data portofolio dan watchlist 100% lokal di browser pengguna demi privasi dan nol latensi.', table_cell)]
    ]
    t_arch = Table(arch_table_data, colWidths=[30*mm, 46*mm, 98*mm])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph('2.2 Strategi Zero-Cost API &amp; Ketahanan Sistem', h2_style))
    story.append(Paragraph('Sistem didesain untuk berjalan tanpa biaya bulanan layanan data pihak ketiga:', body_style))
    story.append(Paragraph('&bull; <b>Forex Resilience:</b> Menggunakan Frankfurter API (data resmi European Central Bank). Apabila terjadi kegagalan jaringan, sistem secara otomatis beralih ke <code>open.er-api.com</code>.', bullet_style))
    story.append(Paragraph('&bull; <b>Equities &amp; Bonds:</b> Menggunakan endpoint Yahoo Finance query v8 dengan custom header User-Agent yang tersanitasi. Seluruh response di-cache secara agresif di server memory.', bullet_style))
    story.append(Paragraph('&bull; <b>Logo Resolver:</b> Simbol saham dikonversi ke format TradingView CDN (misal <code>BBCA.JK</code> &rarr; <code>IDX:BBCA</code> &rarr; <code>jkt-bbca.png</code>). Jika CDN mengembalikan 404, komponen UI otomatis menampilkan avatar inisial berwarna.', bullet_style))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph('3. Spesifikasi Fungsional 15 Modul Inti', h1_style))

    modules_summary = [
        [Paragraph('Modul Fungsional', table_header), Paragraph('Lokasi File Kode', table_header), Paragraph('Fitur &amp; Kemampuan Kunci', table_header)],
        [Paragraph('M01: Impact Engine', table_cell_bold), Paragraph('src/lib/impact-engine.ts', table_cell), Paragraph('Memetakan 28 event ekonomi makro ke Forex, Stocks, ETF, Crypto dengan arah dampak, durasi, dan penjelasan Bahasa Bayi.', table_cell)],
        [Paragraph('M02: Economic Calendar', table_cell_bold), Paragraph('src/components/trading/<br/>economic-calendar.tsx', table_cell), Paragraph('22 template event berulang, filter dampak (High/Med/Low), search, dan inline deep-dive accordion 6 seksi.', table_cell)],
        [Paragraph('M03: Global Markets', table_cell_bold), Paragraph('src/components/trading/<br/>markets-section.tsx', table_cell), Paragraph('14 tab pasar: Global, Forex, Stocks, ETF, Crypto, Bonds/Yields, serta 9 bursa regional (ID, KR, SG, JP, HK, CN, IN, ASEAN, EU).', table_cell)],
        [Paragraph('M04: Quant Signals', table_cell_bold), Paragraph('src/app/api/signals/route.ts<br/>signals-screener.tsx', table_cell), Paragraph('Kalkulasi batch RSI(14), SMA(20) vs SMA(50) Golden/Death Cross, MACD(12,26,9), dan rating komposit Strong Buy s/d Strong Sell.', table_cell)],
        [Paragraph('M05: Correlation Matrix', table_cell_bold), Paragraph('src/app/api/correlation/<br/>correlation-matrix.tsx', table_cell), Paragraph('Perhitungan koefisien korelasi Pearson r harian (1mo/3mo) untuk 10 aset benchmark (SPY, QQQ, BTC, ETH, Gold, Oil, Bonds, DXY, VIX).', table_cell)],
        [Paragraph('M06: Event Backtest', table_cell_bold), Paragraph('src/app/api/backtest/<br/>event-backtest.tsx', table_cell), Paragraph('Simulasi reaksi harga historis 2 tahun pasca event makro (T-1, T+1, T+5), win rate %, dan rata-rata volatilitas.', table_cell)],
        [Paragraph('M07: Order Book', table_cell_bold), Paragraph('src/components/trading/<br/>order-book.tsx', table_cell), Paragraph('Visualisasi Level 2 market depth sintetis, volume kumulatif bid/ask, dan buyer/seller power ratio bar.', table_cell)],
        [Paragraph('M08: Portfolio Tracker', table_cell_bold), Paragraph('src/components/trading/<br/>portfolio-tracker.tsx', table_cell), Paragraph('Pencatatan posisi multi-aset, kalkulasi PnL riil, analisis atribusi sektor &amp; kelas aset, serta export file CSV/JSON.', table_cell)],
        [Paragraph('M09: Sentiment &amp; Heatmap', table_cell_bold), Paragraph('fear-greed-gauge.tsx<br/>market-heatmap.tsx', table_cell), Paragraph('Speedometer Fear &amp; Greed (0-100) dan visualisasi grid heatmap performa aset harian bergradien warna emerald/rose.', table_cell)],
        [Paragraph('M10: Session Timeline', table_cell_bold), Paragraph('src/components/trading/<br/>session-timeline.tsx', table_cell), Paragraph('Status buka/tutup bursa New York, London, Tokyo, dan Jakarta dengan hitung mundur waktu countdown jam:menit:detik.', table_cell)],
        [Paragraph('M11: Currency Converter', table_cell_bold), Paragraph('src/components/trading/<br/>currency-converter.tsx', table_cell), Paragraph('Konverter multi-arah 56 mata uang dunia (fiat &amp; crypto) dengan live exchange rate dan pencarian dropdown cepat.', table_cell)],
        [Paragraph('M12: Audio &amp; Alert FX', table_cell_bold), Paragraph('src/lib/alert-sound.ts<br/>high-impact-events.tsx', table_cell), Paragraph('Synthesizer nada ganda (880Hz &amp; 1320Hz) via Web Audio API tanpa file mp3 eksternal, plus Web Notification push.', table_cell)],
        [Paragraph('M13: TradingView Suite', table_cell_bold), Paragraph('src/components/trading/<br/>tradingview-widgets.tsx', table_cell), Paragraph('Ticker tape banner, advanced chart, mini overview, screener, dan modal fullscreen maximizer (95vw x 95vh).', table_cell)],
        [Paragraph('M14: Command Palette', table_cell_bold), Paragraph('src/components/trading/<br/>command-palette.tsx', table_cell), Paragraph('Pusat komando universal Ctrl+K / Cmd+K untuk cari ticker, navigasi tab, ganti tema, plus shortcut angka 1-5.', table_cell)],
        [Paragraph('M15: Multi-Language i18n', table_cell_bold), Paragraph('src/lib/i18n.ts<br/>language-selector.tsx', table_cell), Paragraph('Sistem translasi 4 bahasa (English, Bahasa Indonesia, Mandarin, Korea) mencakup seluruh UI, label, dan navigasi.', table_cell)],
    ]
    t_mod = Table(modules_summary, colWidths=[32*mm, 42*mm, 100*mm])
    t_mod.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_mod)

    story.append(PageBreak())

    # SECTION 3
    story.append(Paragraph('4. Deep Dive: Impact Engine &amp; Layman Concept ("Bahasa Bayi")', h1_style))
    story.append(Paragraph('4.1 Logika Deterministic Mapping', h2_style))
    story.append(Paragraph('Impact Engine (<code>src/lib/impact-engine.ts</code>) memetakan 28 event ekonomi global ke dalam model data terstruktur:', body_style))
    story.append(Paragraph('Setiap event dievaluasi dampaknya ke 4 kelas aset secara simultan: <b>Forex</b>, <b>Stocks</b>, <b>ETF</b>, dan <b>Crypto</b>. Evaluasi memuat arah proyeksi (<i>bullish</i>, <i>bearish</i>, <i>volatile</i>, <i>neutral</i>), estimasi durasi dampak, dan preseden historis.', body_style))

    story.append(Paragraph('4.2 Contoh Pemetaan Event &amp; Penjelasan Edukatif', h2_style))

    sample_impact_data = [
        [Paragraph('Event Makro', table_header), Paragraph('Dampak ke Aset (Direction &amp; Note)', table_header), Paragraph('Penjelasan Bahasa Bayi (Layman Explanation)', table_header)],
        [
            Paragraph('<b>FOMC Rate Decision</b><br/>(The Fed Interest Rate)<br/><i>Impact: HIGH</i>', table_cell),
            Paragraph('&bull; <b>Forex:</b> USD Volatile / Bullish jika hawkish.<br/>&bull; <b>Stocks:</b> Bearish tech, Bullish bank.<br/>&bull; <b>Crypto:</b> Bearish jika suku bunga naik.<br/>&bull; <b>Durasi:</b> 1-3 hari reaksi berlanjut.', table_cell),
            Paragraph('&ldquo;FOMC itu rapat orang-orang penting di bank sentral Amerika buat nentuin bunga pinjaman. Kalo bunga dinaikin, orang males minjem duit buat belanja atau beli saham/kripto, jadinya pasar saham bisa lesu tapi dollar makin kuat.&rdquo;', table_cell)
        ],
        [
            Paragraph('<b>US Non-Farm Payrolls</b><br/>(NFP Jobs Report)<br/><i>Impact: HIGH</i>', table_cell),
            Paragraph('&bull; <b>Forex:</b> Volatilitas ekstrem pada USD pairs.<br/>&bull; <b>Stocks:</b> Mixed tergantung ekspektasi inflasi.<br/>&bull; <b>Crypto:</b> Volatile tajam 1-2 jam pertama.<br/>&bull; <b>Durasi:</b> 2-4 jam intraday.', table_cell),
            Paragraph('&ldquo;NFP ngitung berapa banyak orang Amerika yang dapet kerjaan baru bulan lalu. Kalo angkanya gede banget, artinya ekonomi lagi panas, The Fed mungkin bakal naikin bunga biar ga inflasi. Biasanya market langsung heboh pas detik-detik rilis.&rdquo;', table_cell)
        ],
        [
            Paragraph('<b>US Consumer Price Index</b><br/>(CPI / Inflasi)<br/><i>Impact: HIGH</i>', table_cell),
            Paragraph('&bull; <b>Forex:</b> DXY menguat tajam jika CPI panas.<br/>&bull; <b>Stocks:</b> Tech &amp; Growth tertekan.<br/>&bull; <b>Crypto:</b> Koreksi jika inflasi di atas ekspektasi.<br/>&bull; <b>Durasi:</b> 1-2 hari.', table_cell),
            Paragraph('&ldquo;CPI itu ngecek apakah harga barang-barang kebutuhan makin mahal. Kalo inflasi makin tinggi, duit kita makin ga ada harganya. Bank sentral bakal terpaksa ngerem ekonomi dengan naikin bunga pinjaman.&rdquo;', table_cell)
        ],
        [
            Paragraph('<b>OPEC+ Production Meeting</b><br/>(Kebijakan Minyak)<br/><i>Impact: MEDIUM-HIGH</i>', table_cell),
            Paragraph('&bull; <b>Commodity:</b> Brent &amp; WTI Crude langsung lonjak.<br/>&bull; <b>Forex:</b> CAD menguat (petrocurrency).<br/>&bull; <b>Stocks:</b> Energi &amp; Mining bullish.<br/>&bull; <b>Durasi:</b> 3-7 hari.', table_cell),
            Paragraph('&ldquo;Negara-negara penghasil minyak kumpul buat mutusin mau kurangi atau nambah sedotan minyak bumi. Kalo mereka sepakat kurangi produksi, minyak dunia jadi langka dan harganya otomatis melonjak naik.&rdquo;', table_cell)
        ],
    ]
    t_imp = Table(sample_impact_data, colWidths=[36*mm, 56*mm, 82*mm])
    t_imp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_imp)
    story.append(Spacer(1, 3*mm))

    story.append(PageBreak())

    # SECTION 4
    story.append(Paragraph('5. Katalog Lengkap 28 API Endpoints Internal', h1_style))
    story.append(Paragraph('Seluruh request dikonsumsi oleh UI melalui internal Next.js Route Handlers (`src/app/api/...`):', body_style))

    api_table_data = [
        [Paragraph('Endpoint Path', table_header), Paragraph('Method &amp; Params', table_header), Paragraph('Output Data &amp; Kegunaan', table_header), Paragraph('TTL Cache', table_header)],
        [Paragraph('<code>/api/markets/indonesia</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Quotes 8 saham blue chip BEI (BBCA, BBRI, BMRI, TLKM, ASII, UNVR, GOTO, ICBP) dlm IDR', table_cell), Paragraph('60s', table_cell)],
        [Paragraph('<code>/api/markets/bonds</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Yield US Treasury (^TNX, ^TYX, ^FVX, ^IRX), Global Sovereign Yields, Bond ETF', table_cell), Paragraph('60s', table_cell)],
        [Paragraph('<code>/api/markets/forex</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Live exchange rates 12 pair mayor dunia dari Frankfurter API', table_cell), Paragraph('60s', table_cell)],
        [Paragraph('<code>/api/markets/stocks</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Indeks Wall Street (SPY, QQQ, DIA, IWM) &amp; Mega-Cap Tech (AAPL, NVDA, TSLA, dll)', table_cell), Paragraph('60s', table_cell)],
        [Paragraph('<code>/api/markets/crypto</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Quotes live spot kripto (BTC, ETH, SOL, BNB, XRP, ADA, DOGE) dlm USD', table_cell), Paragraph('60s', table_cell)],
        [Paragraph('<code>/api/markets/etf</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Quotes instrumen ETF acuan (SPY, QQQ, DIA, IWM, VOO, SOXX, ARKK)', table_cell), Paragraph('60s', table_cell)],
        [Paragraph('<code>/api/markets/korea</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Quotes saham unggulan Korea (Samsung, SK Hynix, NAVER, Hyundai) dlm KRW', table_cell), Paragraph('60s', table_cell)],
        [Paragraph('<code>/api/markets/japan</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Quotes saham unggulan Jepang (Toyota, Sony, SoftBank, Keyence) dlm JPY', table_cell), Paragraph('60s', table_cell)],
        [Paragraph('<code>/api/markets/singapore</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Quotes saham blue chip Singapura (DBS, UOB, Singtel, OCBC) dlm SGD', table_cell), Paragraph('60s', table_cell)],
        [Paragraph('<code>/api/markets/hongkong</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Quotes saham bursa Hong Kong (Tencent, Alibaba, Meituan, AIA) dlm HKD', table_cell), Paragraph('60s', table_cell)],
        [Paragraph('<code>/api/markets/china</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Quotes saham bursa China daratan (Moutai, Ping An, BYD) dlm CNY', table_cell), Paragraph('60s', table_cell)],
        [Paragraph('<code>/api/markets/india</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Quotes saham bursa India NSE (Reliance, TCS, Infosys, HDFC) dlm INR', table_cell), Paragraph('60s', table_cell)],
        [Paragraph('<code>/api/markets/asean</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Quotes saham acuan Thailand (PTT), Malaysia (Maybank), Australia (BHP)', table_cell), Paragraph('60s', table_cell)],
        [Paragraph('<code>/api/markets/europe</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Quotes saham unggulan Eropa (SAP, Siemens, ASML, HSBC) dlm EUR/GBP', table_cell), Paragraph('60s', table_cell)],
        [Paragraph('<code>/api/economic-calendar</code>', table_cell_bold), Paragraph('GET <i>limit, impact</i>', table_cell), Paragraph('Daftar jadwal rilis indikator ekonomi makro terstruktur beserta konsensus', table_cell), Paragraph('300s', table_cell)],
        [Paragraph('<code>/api/impact</code>', table_cell_bold), Paragraph('GET <i>eventId</i>', table_cell), Paragraph('Matriks evaluasi dampak mendalam ke 4 kelas aset dari Impact Engine', table_cell), Paragraph('600s', table_cell)],
        [Paragraph('<code>/api/correlation</code>', table_cell_bold), Paragraph('GET <i>range=1mo|3mo</i>', table_cell), Paragraph('Matriks korelasi Pearson 10 aset acuan (SPY, QQQ, BTC, ETH, Gold, dll)', table_cell), Paragraph('900s', table_cell)],
        [Paragraph('<code>/api/signals</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Screener teknikal komposit batch: RSI(14), SMA(20/50), MACD(12,26,9)', table_cell), Paragraph('300s', table_cell)],
        [Paragraph('<code>/api/technical-analysis</code>', table_cell_bold), Paragraph('GET <i>symbol</i>', table_cell), Paragraph('Data analisis teknikal lengkap dan histori candlestick 1 instrumen spesifik', table_cell), Paragraph('300s', table_cell)],
        [Paragraph('<code>/api/backtest</code>', table_cell_bold), Paragraph('GET <i>eventId, symbol</i>', table_cell), Paragraph('Simulasi reaksi harga 2 tahun: pergerakan T-1, T+1, T+5, win rate &amp; volatilitas', table_cell), Paragraph('1800s', table_cell)],
        [Paragraph('<code>/api/orderbook</code>', table_cell_bold), Paragraph('GET <i>symbol</i>', table_cell), Paragraph('Data kedalaman buku pesanan (bids/asks depth) sintetis real-time', table_cell), Paragraph('15s', table_cell)],
        [Paragraph('<code>/api/portfolio-history</code>', table_cell_bold), Paragraph('GET <i>symbols</i>', table_cell), Paragraph('Histori nilai aset portofolio untuk chart akumulasi nilai modal', table_cell), Paragraph('300s', table_cell)],
        [Paragraph('<code>/api/sparkline</code>', table_cell_bold), Paragraph('GET <i>symbols</i>', table_cell), Paragraph('Array mini pergerakan harga 7 hari untuk chart sparkline di tabel', table_cell), Paragraph('300s', table_cell)],
        [Paragraph('<code>/api/sentiment</code>', table_cell_bold), Paragraph('GET', table_cell), Paragraph('Skor sentimen pasar gabungan dan nilai indeks Fear &amp; Greed harian', table_cell), Paragraph('600s', table_cell)],
        [Paragraph('<code>/api/news</code>', table_cell_bold), Paragraph('GET <i>category</i>', table_cell), Paragraph('Feed berita keuangan terkurasi dengan tagging sentimen otomatis', table_cell), Paragraph('300s', table_cell)],
        [Paragraph('<code>/api/quote</code>', table_cell_bold), Paragraph('GET <i>symbol</i>', table_cell), Paragraph('Live quote instan untuk sembarang instrumen keuangan global', table_cell), Paragraph('60s', table_cell)],
    ]
    t_api = Table(api_table_data, colWidths=[40*mm, 28*mm, 90*mm, 16*mm])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_api)

    story.append(PageBreak())

    # SECTION 5
    story.append(Paragraph('6. UI/UX Design System &amp; Institutional Aesthetic', h1_style))
    story.append(Paragraph('6.1 Filosofi Visual &amp; Color Palette', h2_style))
    story.append(Paragraph('Desain antarmuka Project ARIB mengusung standar estetika dark institutional trading cockpit (#0D1117). Mengeliminasi warna biru/indigo generik dan menggantinya dengan palet fungsional bertaraf pro:', body_style))

    ui_palette = [
        [Paragraph('Warna &amp; Hex Code', table_header), Paragraph('Peruntukan Visual', table_header), Paragraph('Rasional Desain', table_header)],
        [Paragraph('<b>Deep Slate</b><br/><code>#0D1117</code>', table_cell), Paragraph('Latar Belakang Utama Terminal (Canvas)', table_cell), Paragraph('Mengurangi ketegangan mata trader saat monitoring multi-layar berkepanjangan.', table_cell)],
        [Paragraph('<b>Container Surface</b><br/><code>#161B22</code>', table_cell), Paragraph('Kartu Statistik, Panel Widget, Dialog', table_cell), Paragraph('Menciptakan kontras elevasi halus tanpa mengorbankan nuansa gelap minimalis.', table_cell)],
        [Paragraph('<b>Emerald Green</b><br/><code>#10B981</code>', table_cell), Paragraph('Bullish Movement, Positive Yield, Buy Signal', table_cell), Paragraph('Warna universal kenaikan harga dan sinyal positif dengan visibilitas tajam.', table_cell)],
        [Paragraph('<b>Rose Red</b><br/><code>#F43F5E</code>', table_cell), Paragraph('Bearish Movement, Negative Yield, Sell Signal', table_cell), Paragraph('Warna peringatan penurunan harga dan sinyal risiko tinggi.', table_cell)],
        [Paragraph('<b>Amber Gold</b><br/><code>#F59E0B</code>', table_cell), Paragraph('Medium Impact, Neutral Status, Caution Notice', table_cell), Paragraph('Penanda level kewaspadaan sedang pada rilis kalender ekonomi.', table_cell)],
    ]
    t_pal = Table(ui_palette, colWidths=[38*mm, 54*mm, 82*mm])
    t_pal.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_pal)
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph('6.2 Power-User Interaction Model', h2_style))
    story.append(Paragraph('&bull; <b>Global Command Palette (Ctrl+K / Cmd+K):</b> Pengguna dapat menekan shortcut ini kapan saja untuk mencari aset global secara instan, melompat antar tab, atau mengganti pengaturan bahasa.', bullet_style))
    story.append(Paragraph('&bull; <b>Direct Number Navigation (1 s/d 5):</b> Menekan tombol 1 untuk Dashboard, 2 untuk Calendar, 3 untuk Markets, 4 untuk Impact, dan 5 untuk News.', bullet_style))
    story.append(Paragraph('&bull; <b>Audio Synthesizer Alert:</b> Dibangun di atas native Web Audio API (<code>src/lib/alert-sound.ts</code>). Menghasilkan nada alert profesional secara matematis tanpa dependensi berkas suara eksternal yang lambat dimuat.', bullet_style))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph('7. Panduan Instalasi, Setup &amp; Deployment (Developer Handover)', h1_style))
    story.append(Paragraph('7.1 Prosedur Ekstraksi Berkas', h2_style))
    story.append(Paragraph('Seluruh source code Project ARIB berada di dalam arsip tar pada path:<br/><code>C:\\Users\\ASUS\\Documents\\Project anti gravitasi\\mbg TRADING\\another project\\workspace-a06a10fe-6053-422d-8978-e162f9d1f17d.tar</code>', body_style))
    story.append(Paragraph('Perintah ekstraksi via PowerShell / Command Prompt:', body_style))
    story.append(Paragraph('<code>mkdir project-arib<br/>cd project-arib<br/>tar -xf &quot;..\\another project\\workspace-a06a10fe-6053-422d-8978-e162f9d1f17d.tar&quot;</code>', code_block))

    story.append(Spacer(1, 2*mm))
    story.append(Paragraph('7.2 Menjalankan Development Server', h2_style))
    story.append(Paragraph('Proyek telah diverifikasi kompatibel dengan Node.js 20+ (NPM) dan Bun runtime:', body_style))
    story.append(Paragraph('<code># Menggunakan Bun (Direkomendasikan - boot &lt; 500ms):<br/>bun install<br/>bun dev<br/><br/># Atau menggunakan NPM:<br/>npm install<br/>npm run dev</code>', code_block))
    story.append(Paragraph('Buka peramban di <code>http://localhost:3000</code>. Seluruh data pasar dan API route langsung beroperasi dengan data live.', body_style))

    story.append(Spacer(1, 2*mm))
    story.append(Paragraph('7.3 Production Build &amp; Deployment Target', h2_style))
    story.append(Paragraph('&bull; <b>Vercel Edge / Serverless:</b> Deploy 1-klik dengan menghubungkan repository Git ke dashboard Vercel. Seluruh route handler otomatis berjalan sebagai edge/serverless functions.', bullet_style))
    story.append(Paragraph('&bull; <b>Docker / Node Standalone:</b> Jalankan <code>npm run build</code> lalu jalankan server via <code>node .next/standalone/server.js</code>.', bullet_style))

    story.append(Spacer(1, 3*mm))
    story.append(Paragraph('8. Analisis Komparasi &amp; Roadmap Sinergi dengan MBG TRADING', h1_style))
    story.append(Paragraph('8.1 Matriks Sinergi Dua Proyek', h2_style))

    synergy_data = [
        [Paragraph('Aspek Sistem', table_header), Paragraph('Project ARIB (Another Project)', table_header), Paragraph('Proyek MBG Anda (mbg TRADING)', table_header), Paragraph('Peluang Sinergi Ideal', table_header)],
        [Paragraph('Frontend UI/UX', table_cell_bold), Paragraph('Next.js 16, Tailwind v4, shadcn/ui, Command Palette, i18n 4 bahasa', table_cell), Paragraph('Vite + React 18, vanilla CSS (index.css), Password Gate SHA-256', table_cell), Paragraph('Adopsi frontend Project ARIB sebagai antarmuka utama cockpit MBG.', table_cell)],
        [Paragraph('Data Pipeline', table_cell_bold), Paragraph('On-demand API route handler dengan in-memory server cache', table_cell), Paragraph('Python batch cron runner via GitHub Actions, persisten ke Supabase', table_cell), Paragraph('Python cron MBG mengekspor hasil ke JSON/Supabase, dikonsumsi API ARIB.', table_cell)],
        [Paragraph('Risk &amp; Execution', table_cell_bold), Paragraph('Screener teknikal umum, backtest event, kalkulator portofolio', table_cell), Paragraph('Doktrin Astra ketat: Sizing lot, batas invalidasi, AWAITING_HUMAN_REVIEW', table_cell), Paragraph('Sematkan kartu trade plan Astra ke dalam tab Indonesia di Project ARIB.', table_cell)],
        [Paragraph('Alerting Channel', table_cell_bold), Paragraph('Browser Web Notification + Web Audio Synthesizer sound alert', table_cell), Paragraph('Telegram Bot Notifier otomatis (Morning Briefing &amp; Macro Flash)', table_cell), Paragraph('Kombinasi alert audio di layar browser + push notifikasi Telegram di ponsel.', table_cell)]
    ]
    t_syn = Table(synergy_data, colWidths=[24*mm, 48*mm, 48*mm, 54*mm])
    t_syn.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_syn)

    story.append(Spacer(1, 4*mm))
    story.append(make_callout('<b>KESIMPULAN &amp; REKOMENDASI DISKUSI:</b> Project ARIB adalah platform yang sudah 95% matang dari sisi visual frontend, UX interaktif, dan arsitektur API. Platform ini siap dipresentasikan kepada rekan kerja atau investor sebagai terminal intelligence modern. Jika dipadukan dengan mesin analisis quant, bot Telegram, dan database Supabase dari proyek MBG Anda, gabungan kedua sistem ini akan menjadi solusi terminal trading institusional yang sangat tangguh.'))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f'SUCCESS: PDF successfully generated at {target_pdf}')

if __name__ == '__main__':
    build_pdf()
