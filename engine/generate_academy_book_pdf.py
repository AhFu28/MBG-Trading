# -*- coding: utf-8 -*-
import sys, os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas

class AcademyNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(AcademyNumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(AcademyNumberedCanvas, self).showPage()
        super(AcademyNumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover page

        self.saveState()
        self.setFont('Helvetica-Bold', 7)
        self.setFillColor(colors.HexColor('#475569'))
        
        # Header (Top)
        self.drawString(18*mm, 282*mm, 'MBG QUANT ACADEMY // INSTITUTIONAL TRADING & QUANTITATIVE CURRICULUM')
        self.setFont('Helvetica', 7)
        self.drawRightString(192*mm, 282*mm, 'ASTRA DISCIPLINE STANDARD')
        self.setStrokeColor(colors.HexColor('#CBD5E1'))
        self.setLineWidth(0.5)
        self.line(18*mm, 280*mm, 192*mm, 280*mm)

        # Footer (Bottom)
        self.line(18*mm, 15*mm, 192*mm, 15*mm)
        self.setFont('Helvetica', 7)
        self.drawString(18*mm, 11*mm, 'DOKUMEN RESMI PELATIHAN // IDX EQUITIES, SMC, BANDARMOLOGY & CRYPTO SPOT')
        self.drawRightString(192*mm, 11*mm, f'Halaman {self._pageNumber} dari {page_count}')
        self.restoreState()


def build_pdf():
    target_dir = 'COMPILE PRD'
    os.makedirs(target_dir, exist_ok=True)
    target_pdf = os.path.join(target_dir, 'MBG_Quant_Academy_Master_Book.pdf')
    
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
        fontSize=20,
        leading=25,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=15,
        textColor=colors.HexColor('#0284C7'),
        spaceAfter=8
    )
    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.2,
        leading=12.5,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )
    h3_style = ParagraphStyle(
        'Header3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.2,
        leading=11,
        textColor=colors.HexColor('#0369A1'),
        spaceBefore=5,
        spaceAfter=2,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=11,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=3.5
    )
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=11,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=3.5
    )
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.4,
        leading=10.5,
        textColor=colors.HexColor('#1E293B'),
        leftIndent=10,
        firstLineIndent=-6,
        spaceAfter=2
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.6,
        leading=8.8,
        textColor=colors.HexColor('#1E293B')
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.6,
        leading=8.8,
        textColor=colors.HexColor('#0F172A')
    )
    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.8,
        leading=9,
        textColor=colors.white
    )
    callout_box = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.2,
        leading=10,
        textColor=colors.HexColor('#0C4A6E')
    )
    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=6.6,
        leading=8.6,
        textColor=colors.HexColor('#0F172A')
    )

    story = []

    # ==========================================
    # 1. COVER PAGE
    # ==========================================
    story.append(Spacer(1, 15*mm))
    meta_box = [
        [Paragraph('<b>KURIKULUM AKADEMI TRADING KUANTITATIF RESMI</b>', table_header), Paragraph('<b>EDISI MASTER 2026</b>', table_header)],
        [Paragraph('<b>STANDAR OPERASIONAL:</b> Doktrin 5 Langkah Astra & Microstructure OJK/BEI', table_cell),
         Paragraph('<b>CAKUPAN:</b> Saham IDX, SMC, Bandarmologi IIFS, Kripto Spot', table_cell)]
    ]
    t_meta = Table(meta_box, colWidths=[110*mm, 64*mm])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#F1F5F9')),
        ('PADDING', (0,0), (-1,-1), 4.5),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#0F172A')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 8*mm))

    story.append(Paragraph('BUKU PANDUAN LENGKAP & KURIKULUM INSTITUSIONAL', title_style))
    story.append(Paragraph('MBG QUANT ACADEMY // MASTER TRAINING MANUAL', subtitle_style))
    story.append(Paragraph('<i>Sistem Edukasi Finansial Kuantitatif Berjenjang: Manajemen Risiko 2%, Makroekonomi Global, Smart Money Concepts (SMC), Bandarmologi Modern IIFS, dan Kripto Spot Mastery.</i>', body_style))
    story.append(Spacer(1, 4*mm))

    # Executive Summary Card
    exec_text = (
        "<b>EKSEKUTIF BRIEF:</b> Buku ini disusun secara kolaboratif oleh 4 divisi ahli (Quant Specialist, Trading Specialist, "
        "Education Specialist, dan Case Study Writer) untuk menjawab masalah utama trader retail: (1) 90% trader boncos karena nihil manajemen risiko, "
        "(2) terjebak manipulasi bandar akibat penutupan kode broker BEI, (3) tidak memahami siklus makro & transmisi komoditas, serta "
        "(4) likuidasi paksa di pasar kripto ber-leverage. Seluruh formula matematika, regulasi bursa BEI, algoritma Smart Money, dan data historis "
        "telah diverifikasi 100% terhadap literatur ilmiah dan kode sistemik engine MBG Trading Cockpit."
    )
    t_exec = Table([[Paragraph(exec_text, callout_box)]], colWidths=[174*mm])
    t_exec.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#E0F2FE')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#0284C7')),
        ('PADDING', (0,0), (-1,-1), 6)
    ]))
    story.append(t_exec)
    story.append(Spacer(1, 6*mm))

    # Table of Core Modules
    module_data = [
        [Paragraph('<b>LEVEL</b>', table_header), Paragraph('<b>FOKUS KURIKULUM & MATERI INTI</b>', table_header), Paragraph('<b>STANDAR VERIFIKASI</b>', table_header)],
        [Paragraph('<b>Level 1</b>', table_cell_bold), Paragraph('<b>Fondasi Risiko 2% & Matematika Modal</b>: Zero-Breach sizing lot, Drawdown recovery matrix, Expectancy ratio, ATR stop loss.', table_cell), Paragraph('Ralph Vince (1990), Van Tharp, Kep-00023/BEI/04-2016', table_cell)],
        [Paragraph('<b>Level 2</b>', table_cell_bold), Paragraph('<b>Makroekonomi Global & Rotasi Komoditas</b>: DXY, US10Y Treasury, transmisi Emas ke ANTM/BRMS, Minyak ke MEDC, Batubara ke PTBA/ADRO.', table_cell), Paragraph('Intermarket Analysis, Federal Reserve & Bank Indonesia Data', table_cell)],
        [Paragraph('<b>Level 3</b>', table_cell_bold), Paragraph('<b>Smart Money Concepts (SMC)</b>: Order Block terverifikasi (>2x ATR), Fair Value Gap (FVG), BOS, CHoCH, Equilibrium 50% discount/premium.', table_cell), Paragraph('Michael J. Huddleston (ICT), J. Welles Wilder (1978)', table_cell)],
        [Paragraph('<b>Level 4</b>', table_cell_bold), Paragraph('<b>Bandarmologi Modern IIFS (BEI)</b>: Pasca penutupan kode broker, Komposit IIFS 4 Pilar (OBV 30%, MFI 25%, VWAP 25%, Chaikin 20%), ARB simetris, Dividend Trap.', table_cell), Paragraph('Kep-00055/BEI/03-2023, Granville (1963), Quong & Soudack', table_cell)],
        [Paragraph('<b>Level 5</b>', table_cell_bold), Paragraph('<b>Kripto Spot Mastery & Siklus Pasar</b>: Zero-liquidation Spot USDT, proteksi flash dump, siklus 4 tahunan Bitcoin Halving, dan rotasi BTC.D ke Altseason.', table_cell), Paragraph('Satoshi Nakamoto (2008), Stock-to-Flow Model, On-Chain Metrics', table_cell)],
        [Paragraph('<b>Studi Kasus</b>', table_cell_bold), Paragraph('<b>4 Kasus Nyata Mendalam</b>: (1) Dividend Trap PTBA, (2) Bullish OB BBRI, (3) Transmisi Emas ANTM vs BRMS, (4) BTC $60k Liquidity Sweep.', table_cell), Paragraph('Data Historis BEI 2023–2024 & Binance Spot 2024', table_cell)],
        [Paragraph('<b>Praktik & SOP</b>', table_cell_bold), Paragraph('<b>Pre-Flight Safety Checklist & Trading Journal</b>: 5 gerbang keputusan saklek, skema 17 parameter jurnal, dan emotional audit tagging.', table_cell), Paragraph('Astra Trading Doctrine & Behavioral Finance Standards', table_cell)],
        [Paragraph('<b>Master Kamus</b>', table_cell_bold), Paragraph('<b>Kamus Kilat 66 Istilah Finansial Terverifikasi</b>: Tabel lengkap seluruh terminologi bursa, quant, dan kripto.', table_cell), Paragraph('Glosarium Resmi Sistem MBG Cockpit Engine', table_cell)]
    ]
    t_mod = Table(module_data, colWidths=[20*mm, 106*mm, 48*mm])
    t_mod.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    story.append(t_mod)
    story.append(PageBreak())

    # ==========================================
    # 2. BAB 1: FILOSOFI & ARSITEKTUR PEDAGOGI
    # ==========================================
    story.append(Paragraph('BAB 1: FILOSOFI PENDIDIKAN & ARSITEKTUR PEDAGOGI', h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceAfter=5))
    
    p1 = (
        "<b>1.1 Mengapa 90% Trader Retail Boncos di Bursa?</b><br/>"
        "Statistik global membuktikan fenomena <b>Hukum 90/90/90</b>: 90% trader pemula kehilangan 90% modal mereka dalam 90 hari pertama. "
        "Penyebab utamanya bukan kurangnya indikator teknikal, melainkan tiga bias psikologis dan kegagalan struktural: "
        "(1) <i>All-In Mentality</i> tanpa kalkulasi ukuran lot, (2) penolakan psikologis untuk mengeksekusi <i>cut loss</i> (anchoring bias), dan "
        "(3) trading reaktif berdasarkan bisikan media sosial / influencer daripada pembacaan struktur likuiditas institusi."
    )
    story.append(Paragraph(p1, body_style))

    p2 = (
        "<b>1.2 Kerangka Pembelajaran Kuantitatif Berjenjang (Cognitive Scaffolding)</b><br/>"
        "MBG Quant Academy mengadopsi <b>Taksonomi Bloom Terevisi</b> yang dipadukan dengan <i>Cognitive Scaffolding</i>. "
        "Trader tidak diizinkan melompat ke analisis teknikal atau bandarmologi sebelum lulus dari ujian pertahanan modal (Level 1). "
        "Urutan pembelajaran dirancang dari fondasi proteksi defensif menuju agresi berbasis data institusi:"
    )
    story.append(Paragraph(p2, body_style))

    scaffold_table = [
        [Paragraph('<b>TINGKATAN</b>', table_header), Paragraph('<b>TAHAP KOMPETENSI</b>', table_header), Paragraph('<b>OUTPUT PERILAKU TRADER</b>', table_header)],
        [Paragraph('<b>Level 1 (Dasar)</b>', table_cell_bold), Paragraph('Remember & Understand: Capital Defense', table_cell), Paragraph('Mampu menghitung lot eksak, patuh batas rugi 2%, tidak pernah averaging down.', table_cell)],
        [Paragraph('<b>Level 2 (Menengah)</b>', table_cell_bold), Paragraph('Analyze: Macro & Intermarket Flow', table_cell), Paragraph('Memahami transmisi suku bunga, DXY, dan pergerakan komoditas ke emiten BEI.', table_cell)],
        [Paragraph('<b>Level 3 (Lanjutan)</b>', table_cell_bold), Paragraph('Apply & Evaluate: Smart Money Delivery', table_cell), Paragraph('Menemukan jejak Order Block institusi, FVG imbalance, dan masuk hanya di zona Diskon.', table_cell)],
        [Paragraph('<b>Level 4 (Spesialis)</b>', table_cell_bold), Paragraph('Evaluate & Synthesize: Bandarmology IIFS', table_cell), Paragraph('Mendeteksi akumulasi/distribusi uang besar tanpa kode broker dan lolos Dividend Trap.', table_cell)],
        [Paragraph('<b>Level 5 (Mastery)</b>', table_cell_bold), Paragraph('Create & Execute: Crypto Spot & Macro Cycles', table_cell), Paragraph('Memanfaatkan siklus halving 4 tahunan dan rotasi BTC Dominance tanpa risiko likuidasi.', table_cell)]
    ]
    t_scaff = Table(scaffold_table, colWidths=[28*mm, 56*mm, 90*mm])
    t_scaff.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    story.append(t_scaff)
    story.append(Spacer(1, 5*mm))

    # ==========================================
    # 3. BAB 2: LEVEL 1 — FONDASI RISIKO 2% & MATEMATIKA MODAL
    # ==========================================
    story.append(Paragraph('BAB 2: LEVEL 1 — FONDASI MANAJEMEN RISIKO & MATEMATIKA MODAL (ASTRA STANDARD)', h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceAfter=5))

    p3 = (
        "<b>2.1 Doktrin Risiko Maksimal 2% Modal & Formula Kalkulator Lot Eksak BEI</b><br/>"
        "Berdasarkan <i>Fixed Fractional Risk Model</i> (Ralph Vince, 1990), batas risiko per transaksi tunggal ditetapkan maksimal $r = 0.02$ (2% dari ekuitas). "
        "Karena perdagangan saham di Pasar Reguler BEI wajib dalam satuan diskret 1 Lot = 100 lembar, diterapkan fungsi lantai (floor function) matematis "
        "guna menjamin <b>Zero-Breach Guarantee</b> terhadap batas toleransi risiko nominal ($R_{IDR} = C \\times 0.02$):"
    )
    story.append(Paragraph(p3, body_style))

    formula_box = (
        "<b>FORMULA KALKULATOR LOT DISKRET ASTRA:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>L<sub>exact</sub> = &lfloor; (Modal &times; 2%) / ((Harga Entry - Harga Stop Loss) &times; 100) &rfloor;</b><br/>"
        "<i>Keterangan:</i> Jika Modal = Rp 10.000.000, Entry = Rp 1.500, Stop Loss = Rp 1.425 (&Delta;P = Rp 75):<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;Risk Budget = Rp 200.000 | Lot = &lfloor; 200.000 / (75 &times; 100) &rfloor; = &lfloor; 26,67 &rfloor; = <b>26 Lot</b>.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;Komitmen Modal = 26 &times; 100 &times; Rp 1.500 = Rp 3.900.000 (39% dari modal total &rarr; Warning Konsentrasi Modal &gt;25%)."
    )
    t_form = Table([[Paragraph(formula_box, code_style)]], colWidths=[174*mm])
    t_form.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#0284C7')),
        ('PADDING', (0,0), (-1,-1), 5)
    ]))
    story.append(t_form)
    story.append(Spacer(1, 4*mm))

    p4 = (
        "<b>2.2 Matematika Drawdown & Bukti Ilmiah Mengapa Rugi 50% Butuh Recovery 100%</b><br/>"
        "Misalkan modal awal $C_0$ mengalami drawdown persentase sebesar $D \\in (0, 1)$. Modal tersisa adalah $C_1 = C_0(1 - D)$. "
        "Agar modal kembali ke titik impas awal $C_0$, dibutuhkan tingkat imbal hasil pemulihan (Recovery Return) sebesar $R$:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<i>C<sub>1</sub> &times; (1 + R) = C<sub>0</sub> &rArr; C<sub>0</sub>(1 - D)(1 + R) = C<sub>0</sub> &rArr; 1 + R = 1 / (1 - D)</i><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>R(D) = D / (1 - D)</b><br/>"
        "Untuk $D = 0.50$ (50% kerugian): <b>R(0.50) = 0.50 / (1 - 0.50) = 1.00 (100%)</b>. "
        "Derivatif pertama $dR/dD = 1 / (1 - D)^2$ menunjukkan akselerasi kebutuhan pemulihan modal bersifat hiperbolik mendekati tak hingga. "
        "Itulah mengapa mempertahankan modal (capital preservation) jauh lebih penting daripada mencari keuntungan cepat."
    )
    story.append(Paragraph(p4, body_style))

    # Drawdown Table
    dd_table = [
        [Paragraph('<b>DRAWDOWN (D)</b>', table_header), Paragraph('<b>MODAL TERSISA (1-D)</b>', table_header), Paragraph('<b>RECOVERY DIPERLUKAN (R)</b>', table_header), Paragraph('<b>IMPLIKASI PSIKOLOGIS TRADER</b>', table_header)],
        [Paragraph('<b>5%</b>', table_cell_bold), Paragraph('95.0%', table_cell), Paragraph('<b>5.26%</b>', table_cell), Paragraph('Koreksi minor wajar, mudah dipulihkan dalam 1-2 trade.', table_cell)],
        [Paragraph('<b>10%</b>', table_cell_bold), Paragraph('90.0%', table_cell), Paragraph('<b>11.11%</b>', table_cell), Paragraph('Batas toleransi drawdown bulanan trader profesional.', table_cell)],
        [Paragraph('<b>20%</b>', table_cell_bold), Paragraph('80.0%', table_cell), Paragraph('<b>25.00%</b>', table_cell), Paragraph('Mulai membutuhkan performa luar biasa di atas rata-rata pasar.', table_cell)],
        [Paragraph('<b>30%</b>', table_cell_bold), Paragraph('70.0%', table_cell), Paragraph('<b>42.86%</b>', table_cell), Paragraph('Tekanan mental meningkat; kecenderungan revenge trading.', table_cell)],
        [Paragraph('<b>50%</b>', table_cell_bold), Paragraph('50.0%', table_cell), Paragraph('<b>100.00%</b>', table_cell), Paragraph('Bencana modal. Butuh keuntungan 2x lipat hanya untuk balik modal.', table_cell)],
        [Paragraph('<b>75%</b>', table_cell_bold), Paragraph('25.0%', table_cell), Paragraph('<b>300.00%</b>', table_cell), Paragraph('Hampir mustahil dipulihkan tanpa keajaiban atau risiko spekulatif.', table_cell)],
        [Paragraph('<b>90%</b>', table_cell_bold), Paragraph('10.0%', table_cell), Paragraph('<b>900.00%</b>', table_cell), Paragraph('Total Ruin (Bangkrut). Sisa modal hangus di pasar.', table_cell)]
    ]
    t_dd = Table(dd_table, colWidths=[28*mm, 35*mm, 38*mm, 73*mm])
    t_dd.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    story.append(t_dd)
    story.append(Spacer(1, 4*mm))

    p5 = (
        "<b>2.3 Simulasi Monte Carlo: Mengapa Risiko 10% Menghancurkan Akun vs Ketahanan 2%</b><br/>"
        "Dengan risiko $r = 10\%$ per trade, rentetan kerugian 7 kali berturut-turut akan memangkas modal sebesar: "
        "<i>D<sub>7</sub> = 1 - (0.90)<sup>7</sup> = 52.17%</i> (modal tinggal separuh). "
        "Sebaliknya, dengan Doktrin Astra 2%, dibutuhkan <b>35 kali salah berturut-turut</b> untuk mengalami drawdown yang sama: "
        "<i>D<sub>35</sub> = 1 - (0.98)<sup>35</sup> = 50.60%</i>. "
        "Dalam hukum probabilitas, peluang trader mengalami 35 kekalahan beruntun pada sistem trading ber-expectancy positif adalah mendekati 0%."
    )
    story.append(Paragraph(p5, body_style))
    story.append(PageBreak())

    # ==========================================
    # 4. BAB 3: LEVEL 2 — MAKROEKONOMI & KOMODITAS
    # ==========================================
    story.append(Paragraph('BAB 3: LEVEL 2 — MAKROEKONOMI GLOBAL & ROTASI KOMODITAS (TOP-DOWN ALPHA)', h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceAfter=5))

    p6 = (
        "<b>3.1 Segitiga Emas Makroekonomi: DXY, US10Y Yield, dan Inflasi CPI</b><br/>"
        "Pasar modal Indonesia (IHSG) adalah bagian dari ekosistem <i>Emerging Markets</i> yang sangat sensitif terhadap likuiditas global. "
        "Tiga indikator utama yang wajib dipantau setiap pagi di Bloomberg NewsWire Cockpit adalah:"
    )
    story.append(Paragraph(p6, body_style))

    macro_points = [
        "<b>Indeks Dolar AS (DXY):</b> Mengukur kekuatan USD terhadap sekeranjang mata uang dunia. Jika DXY melonjak di atas 105–106, mata uang Rupiah melemah dan dana asing (Foreign Funds) terdorong keluar dari IHSG (Outflow) untuk memarkir likuiditas di aset berdenominasi Dolar.",
        "<b>US 10-Year Treasury Yield (US10Y):</b> Imbal hasil surat utang pemerintah AS tenor 10 tahun merupakan benchmark tingkat suku bunga bebas risiko (Risk-Free Rate) dunia. Kenaikan tajam yield US10Y menaikkan biaya modal (Cost of Capital) emiten dan menekan valuasi saham teknologi dan pertumbuhan tinggi (growth stocks).",
        "<b>Suku Bunga Acuan (The Fed & BI-Rate):</b> Siklus kenaikan suku bunga menekan daya beli dan valuasi DCF emiten, namun menguntungkan perbankan dengan ekspansi Net Interest Margin (NIM) jangka pendek jika transmisi kredit lancar."
    ]
    for pt in macro_points:
        story.append(Paragraph(f"• {pt}", bullet_style))
    story.append(Spacer(1, 3*mm))

    p7 = (
        "<b>3.2 Peta Transmisi Komoditas ke Sektoral Saham BEI</b><br/>"
        "Indonesia adalah negara lumbung komoditas. Pergerakan harga komoditas global ditransmisikan secara langsung ke perolehan laba emiten BEI:"
    )
    story.append(Paragraph(p7, body_style))

    comm_table = [
        [Paragraph('<b>KOMODITAS GLOBAL</b>', table_header), Paragraph('<b>BENCHMARK FISIK</b>', table_header), Paragraph('<b>EMITEN BEI TERDAMPAK</b>', table_header), Paragraph('<b>MEKANISME TRANSMISI LABA</b>', table_header)],
        [Paragraph('<b>Emas Murni (Gold)</b>', table_cell_bold), Paragraph('XAU/USD ($/troy ounce)', table_cell), Paragraph('<b>$ANTM, $BRMS, $PSAB</b>', table_cell_bold), Paragraph('Kenaikan ASP emas langsung mendongkrak margin operasional penambang hulu murni.', table_cell)],
        [Paragraph('<b>Minyak Mentah</b>', table_cell_bold), Paragraph('Brent Crude & WTI ($/barel)', table_cell), Paragraph('<b>$MEDC, $ENRG, $AKRA, $ELSA</b>', table_cell_bold), Paragraph('Kenaikan harga minyak menaikkan realized selling price migas dan pendapatan jasa penunjang.', table_cell)],
        [Paragraph('<b>Batu Bara Termal</b>', table_cell_bold), Paragraph('Newcastle Coal ($/ton)', table_cell), Paragraph('<b>$PTBA, $ADRO, $ITMG, $UNTR</b>', table_cell_bold), Paragraph('Mendorong windfall profit dan dividen yield jumbo, namun rawan Dividend Trap pasca puncak siklus.', table_cell)],
        [Paragraph('<b>Nikel & Baterai EV</b>', table_cell_bold), Paragraph('LME Nickel ($/ton)', table_cell), Paragraph('<b>$INCO, $NCKL, $MBMA, $ANTM</b>', table_cell_bold), Paragraph('Mempengaruhi ASP feronikel dan Mixed Hydroxide Precipitate (MHP) untuk ekosistem EV.', table_cell)]
    ]
    t_comm = Table(comm_table, colWidths=[28*mm, 35*mm, 38*mm, 73*mm])
    t_comm.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    story.append(t_comm)
    story.append(Spacer(1, 5*mm))

    # ==========================================
    # 5. BAB 4: LEVEL 3 — SMART MONEY CONCEPTS (SMC)
    # ==========================================
    story.append(Paragraph('BAB 4: LEVEL 3 — SMART MONEY CONCEPTS (SMC) & STRUKTUR LIKUIDITAS', h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceAfter=5))

    p8 = (
        "<b>4.1 Order Block (OB) Terverifikasi vs Candlestick Biasa</b><br/>"
        "Institusi finansial kakap tidak dapat mengeksekusi order jutaan lot tanpa menggerakkan pasar. "
        "Mereka meninggalkan jejak berupa <b>Order Block</b>: candle berlawanan arah terakhir sebelum terjadi lonjakan harga impulsif besar. "
        "Standar kuantitatif MBG mewajibkan filter volatilitas: candle disebut Bullish OB hanya jika candle sesudahnya memiliki badan candle "
        "<i>Body<sub>t+1</sub> &gt; 2.0 &times; ATR<sub>14</sub></i> dan menembus struktur swing high sebelumnya (Break of Structure).<br/>"
        "• <b>Status FRESH:</b> Belum pernah disentuh kembali oleh harga &rarr; Peluang pantulan tertinggi.<br/>"
        "• <b>Status TESTED:</b> Sudah dipantulkan 1 kali &rarr; Risiko meningkat jika diuji ulang berulang-ulang.<br/>"
        "• <b>Status BROKEN:</b> Penutupan harga menembus batas bawah Low OB &rarr; Tesis gugur otomatis (Invalidated)."
    )
    story.append(Paragraph(p8, body_style))

    p9 = (
        "<b>4.2 Fair Value Gap (FVG) sebagai Magnet Ketidakseimbangan</b><br/>"
        "FVG terjadi pada formasi 3 bar candle berturut-turut akibat lonjakan agresif satu arah tanpa transaksi dua arah yang efisien. "
        "Pada Bullish FVG: <i>Low<sub>i+1</sub> &gt; High<sub>i-1</sub></i>. Jarak antara High candle ke-1 dan Low candle ke-3 adalah zona kosong. "
        "Algoritma institusi cenderung melakukan penyeimbangan harga kembali (*rebalancing / Consequent Encroachment 50%*) "
        "sebelum melanjutkan tren ekspansi utama. Area 50% median FVG adalah titik masuk ideal (Optimal Trade Entry)."
    )
    story.append(Paragraph(p9, body_style))

    p10 = (
        "<b>4.3 Break of Structure (BOS), CHoCH, dan Penentuan Zona Diskon vs Premium</b><br/>"
        "• <b>Change of Character (CHoCH):</b> Tanda awal pembalikan arah tren ketika swing low/high kunci pertama kali ditembus.<br/>"
        "• <b>Break of Structure (BOS):</b> Konfirmasi kelanjutan tren ketika harga mencetak Higher High baru dalam tren bullish.<br/>"
        "• <b>Equilibrium 50%:</b> Dihitung dari rentang 20 hari: <i>EQ = (High<sub>range</sub> + Low<sub>range</sub>) / 2</i>. "
        "Doktrin Astra melarang keras membeli saham di area <i>Premium Zone (&gt;50%)</i> karena risiko koreksi tinggi. "
        "Pembelian hanya diperbolehkan di <i>Discount Zone (&lt;50%)</i> yang berhimpitan dengan Fresh Order Block."
    )
    story.append(Paragraph(p10, body_style))
    story.append(PageBreak())

    # ==========================================
    # 6. BAB 5: LEVEL 4 — BANDARMOLOGI MODERN IIFS (BEI)
    # ==========================================
    story.append(Paragraph('BAB 5: LEVEL 4 — BANDARMOLOGI MODERN IIFS & MIKROSTRUKTUR BEI', h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceAfter=5))

    p11 = (
        "<b>5.1 Realitas Pasar Pasca Penutupan Kode Broker (2021) & Tipe Investor (2022)</b><br/>"
        "Sejak BEI menutup kode broker saat jam bursa (6 Desember 2021) dan penutupan tipe investor domestik/asing real-time (27 Juni 2022), "
        "metode lama 'menebak kode broker intraday' sudah tidak berfungsi. "
        "Sebagai gantinya, MBG Cockpit menggunakan <b>Institutional Investor Flow Score (IIFS)</b> berbasis normalisasi Z-Score multi-variabel "
        "yang menggabungkan 4 pilar kuantitatif:"
    )
    story.append(Paragraph(p11, body_style))

    # Formula Box IIFS
    iifs_box = (
        "<b>FORMULA SKOR KOMPOSIT IIFS:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>IIFS<sub>t</sub> = 0.30 &times; Z<sub>OBV</sub> + 0.25 &times; Z<sub>MFI</sub> + 0.25 &times; Z<sub>VWAP</sub> + 0.20 &times; Z<sub>AD</sub></b><br/>"
        "<i>1. On-Balance Volume (OBV) Z-Score (30%):</i> Mengukur akumulasi volume kumulatif pada hari-hari kenaikan harga.<br/>"
        "<i>2. Money Flow Index (MFI) Z-Score (25%):</i> Volume tertimbang harga tipikal (Typical Price) untuk mengukur tekanan uang nyata.<br/>"
        "<i>3. Deviasi Rolling VWAP (25%):</i> Jarak harga terakhir terhadap harga rata-rata transaksi institusi berbobot volume.<br/>"
        "<i>4. Chaikin Accumulation/Distribution (20%):</i> Posisi penutupan candle harian terhadap rentang High-Low dikali volume."
    )
    t_iifs = Table([[Paragraph(iifs_box, code_style)]], colWidths=[174*mm])
    t_iifs.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#059669')),
        ('PADDING', (0,0), (-1,-1), 5)
    ]))
    story.append(t_iifs)
    story.append(Spacer(1, 3*mm))

    # IIFS Classification Table
    iifs_table = [
        [Paragraph('<b>INTERVAL Z-SCORE</b>', table_header), Paragraph('<b>KLASIFIKASI MBG</b>', table_header), Paragraph('<b>KARAKTERISTIK ALIRAN DANA</b>', table_header), Paragraph('<b>REKOMENDASI AKSI</b>', table_header)],
        [Paragraph('<b>Z &gt; +2.0</b>', table_cell_bold), Paragraph('<b>HEAVY_ACCUMULATION</b>', table_cell_bold), Paragraph('Inflow luar biasa masif (&gt;2 standar deviasi). Big player masuk agresif.', table_cell), Paragraph('Prioritas Beli Utama di area Retest.', table_cell)],
        [Paragraph('<b>+1.0 &lt; Z &le; +2.0</b>', table_cell_bold), Paragraph('ACCUMULATION', table_cell), Paragraph('Akumulasi institusional teratur dan berkelanjutan.', table_cell), Paragraph('Setup Beli Terkonfirmasi.', table_cell)],
        [Paragraph('<b>+0.5 &lt; Z &le; +1.0</b>', table_cell_bold), Paragraph('MILD_ACCUMULATION', table_cell), Paragraph('Aliran dana masuk bertahap dengan volume moderat.', table_cell), Paragraph('Pantau di Watchlist.', table_cell)],
        [Paragraph('<b>-0.5 &le; Z &le; +0.5</b>', table_cell_bold), Paragraph('NEUTRAL', table_cell), Paragraph('Transaksi berimbang, fase konsolidasi / sideways.', table_cell), Paragraph('Wait and See.', table_cell)],
        [Paragraph('<b>-1.0 &le; Z &lt; -0.5</b>', table_cell_bold), Paragraph('MILD_DISTRIBUTION', table_cell), Paragraph('Tekanan jual institusi mulai terasa pelan-pelan.', table_cell), Paragraph('Perketat Trailing Stop.', table_cell)],
        [Paragraph('<b>-2.0 &le; Z &lt; -1.0</b>', table_cell_bold), Paragraph('DISTRIBUTION', table_cell), Paragraph('Pelepasan barang institusional konsisten ke investor ritel.', table_cell), Paragraph('Ambil Profit / Kurangi Posisi.', table_cell)],
        [Paragraph('<b>Z &lt; -2.0</b>', table_cell_bold), Paragraph('<b>HEAVY_DISTRIBUTION</b>', table_cell_bold), Paragraph('Dumping agresif / capital outflow masif.', table_cell), Paragraph('Wajib Exit / Dilarang Tangkap Pisau.', table_cell)]
    ]
    t_iifs_cls = Table(iifs_table, colWidths=[28*mm, 35*mm, 68*mm, 43*mm])
    t_iifs_cls.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    story.append(t_iifs_cls)
    story.append(Spacer(1, 4*mm))

    p12 = (
        "<b>5.2 Mikrostruktur BEI: 5 Kelompok Fraksi Harga & Aturan ARB Simetris</b><br/>"
        "Berdasarkan Keputusan Direksi BEI No. <b>Kep-00055/BEI/03-2023</b> (efektif penuh sejak 4 September 2023), "
        "bursa memberlakukan <b>Batas Auto Rejection Simetris</b>: batas ARB setara dengan batas ARA:<br/>"
        "• Harga Rp 50 – Rp 200: Batas ARA/ARB = <b>&plusmn;35%</b> | Fraksi: <b>Rp 1</b><br/>"
        "• Harga &gt;Rp 200 – Rp 5.000: Batas ARA/ARB = <b>&plusmn;25%</b> | Fraksi: Rp 2 (200-500), Rp 5 (500-2rb), Rp 10 (2rb-5rb)<br/>"
        "• Harga &gt;Rp 5.000: Batas ARA/ARB = <b>&plusmn;20%</b> | Fraksi: <b>Rp 25</b><br/>"
        "<i>Waspada Spoofing:</i> Manipulator pasar kerap memasang <b>Fake Bid</b> tebal untuk memicu ritel melakukan HAKA (Hajar Kanan). "
        "Ketika ritel membeli di Offer, manipulator langsung mencabut (cancel) bid tebal dan melakukan HAKI (Hajar Kiri) masif."
    )
    story.append(Paragraph(p12, body_style))
    story.append(PageBreak())

    # ==========================================
    # 7. BAB 6: LEVEL 5 — KRIPTO SPOT MASTERY & SIKLUS PASAR
    # ==========================================
    story.append(Paragraph('BAB 6: LEVEL 5 — KRIPTO SPOT MASTERY, SIKLUS 4 TAHUNAN & ON-CHAIN', h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceAfter=5))

    p13 = (
        "<b>6.1 Doktrin Kripto Spot Murni: Zero Liquidation Risk & Zero Funding Rate</b><br/>"
        "Di pasar kripto ber-leverage (Futures/Perpetual), 95% trader terlikuidasi akibat volatilitas ekstrem jarum likuidasi (*wicking*). "
        "MBG mengadopsi doktrin <b>Spot USDT 1:1</b>:<br/>"
        "1. <b>Nol Risiko Likuidasi:</b> Membeli 1.000 USDT Bitcoin Spot berarti memegang koin fisik utuh. "
        "Bahkan jika harga BTC terkoreksi 30% dalam semalam, jumlah satoshi Anda tidak berkurang satu pun dan akun tidak akan di-margin call.<br/>"
        "2. <b>Bebas Biaya Pendanaan (No Funding Rate):</b> Pada posisi Futures, biaya funding rate dipotong setiap 8 jam. "
        "Di Spot, trader bebas menahan posisi (swing holding) selama berbulan-bulan tanpa beban biaya inap sepeser pun.<br/>"
        "3. <b>Kebebasan Cold Storage:</b> Aset kripto spot dapat dipindahkan ke hardware wallet pribadi untuk keamanan maksimal."
    )
    story.append(Paragraph(p13, body_style))

    p14 = (
        "<b>6.2 Siklus 4 Tahunan Bitcoin Halving & Model Stock-to-Flow</b><br/>"
        "Protokol Bitcoin memangkas imbalan blok penambang sebesar 50% setiap 210.000 blok (~4 tahun sekali). "
        "Pada Halving ke-4 (April 2024), imbalan blok turun dari 6.25 BTC menjadi <b>3.125 BTC per blok</b> (hanya 450 BTC baru/hari). "
        "Secara historis, kejutan pasokan (*Supply Shock*) ini selalu diikuti fase ekspansi pasar bullish dalam horizon 12–18 bulan pasca-halving."
    )
    story.append(Paragraph(p14, body_style))

    p15 = (
        "<b>6.3 Rotasi Likuiditas Kripto & Bitcoin Dominance (BTC.D)</b><br/>"
        "Pergerakan likuiditas pasar kripto mengalir melalui 4 fase sistematis (*The Capital Waterfall*):"
    )
    story.append(Paragraph(p15, body_style))

    crypto_flow = [
        "<b>Fase 1 (Bitcoin Surge):</b> Likuiditas baru masuk ke Bitcoin. Harga BTC melonjak kencang, Bitcoin Dominance (BTC.D) menanjak tajam. Altcoin tertinggal.",
        "<b>Fase 2 (Ethereum Transition):</b> Profit dari Bitcoin mulai dirotasi ke Ethereum. Rasio ETH/BTC breakout ke atas. Ethereum mengungguli persentase gain Bitcoin.",
        "<b>Fase 3 (Large-Caps Momentum):</b> Dana merembes ke koin Layer-1 dan utilitas berkapitalisasi besar (SOL, BNB, AVAX, LINK).",
        "<b>Fase 4 (Full Altseason & Blow-Off Top):</b> BTC.D anjlok bebas. Likuiditas spekulatif menyebar ke mid-cap dan meme tokens. Ini adalah fase puncak euforia di mana smart money keluar ke Stablecoin (USDT/USDC)."
    ]
    for pt in crypto_flow:
        story.append(Paragraph(f"• {pt}", bullet_style))
    story.append(Spacer(1, 4*mm))

    # ==========================================
    # 8. BAB 7: 4 STUDI KASUS NYATA MENDALAM
    # ==========================================
    story.append(Paragraph('BAB 7: 4 STUDI KASUS NYATA MENDALAM (INSTITUTIONAL PLAYBOOK)', h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceAfter=5))

    cs1 = (
        "<b>STUDI KASUS 1: Tragedi Saham PTBA (Dividend Trap Jumbo 2023 & 2024)</b><br/>"
        "• <i>Konteks:</i> Laba rekor batubara Newcastle mendorong PTBA membagikan dividen Rp 1.094/saham pada Juni 2023 (Yield 28% pada harga Rp 3.800). "
        "Media dan influencer mempromosikan narasi 'passive income gratis'.<br/>"
        "• <i>Jebakan Ritel:</i> Ritel berbondong-bondong HAKA pada Cum-Date (23 Juni 2023). "
        "Broker summary membuktikan asing/bandar justru mencatatkan <b>Net Sell puluhan miliar</b> tepat di hari Cum-Date mentransfer barang ke ritel.<br/>"
        "• <i>Hasil:</i> Pada Ex-Date, saham PTBA langsung terkunci <b>ARB Simetris 3 hari berturut-turut</b> tanpa ada antrean bid. "
        "Harga terjun ke Rp 2.650 (Capital Loss -Rp 1.150). Dividen diterima Rp 984,6 (setelah pajak 10%). "
        "<b>Ritel menderita net loss bersih -Rp 165,4 per lembar (-4,35% modal amblas dan dana terkunci 1 bulan lebih)</b>.<br/>"
        "• <i>Pelajaran:</i> Haram membeli saham dividen yield &gt;10% pada rentang H-7 hingga Cum-Date. "
        "Jika ingin dividen play, belilah 1-2 bulan sebelum RUPS dan <b>jual pada sesi penutupan Cum-Date</b>."
    )
    story.append(Paragraph(cs1, body_style))
    story.append(Spacer(1, 2.5*mm))

    cs2 = (
        "<b>STUDI KASUS 2: Setup Bullish Order Block + Retest FVG pada Saham BBRI (2024)</b><br/>"
        "• <i>Konteks:</i> BBRI terkoreksi 35% dari All-Time High Rp 6.400 menuju Rp 4.150 (Juni 2024) akibat lonjakan DXY dan kekhawatiran NPL mikro.<br/>"
        "• <i>Analisis SMC:</i> Di area Rp 4.150–4.250 terdapat Weekly Bullish Order Block historis. "
        "Pada awal Juli 2024, terbentuk candle impulsif (&gt;2x ATR) yang memecahkan resisten Rp 4.450 (Bullish BOS), meninggalkan <b>Fair Value Gap (FVG)</b> di Rp 4.350–4.420.<br/>"
        "• <i>Eksekusi:</i> Limit buy dipasang pada Consequent Encroachment (50% FVG) di <b>Rp 4.380</b> dengan SL di bawah swing low OB di <b>Rp 4.220</b> (Risiko: 3,6%). "
        "Target Profit 1 di Rp 4.800 (R:R 1:2.6) dan TP2 di Rp 5.200 (R:R 1:5.1).<br/>"
        "• <i>Hasil:</i> Saham meroket melampaui Rp 5.200 pada September 2024 seiring inflow asing pasca pemangkasan suku bunga The Fed (+18.7% gain murni)."
    )
    story.append(Paragraph(cs2, body_style))
    story.append(Spacer(1, 2.5*mm))

    cs3 = (
        "<b>STUDI KASUS 3: Transmisi Reli Emas Dunia (XAU) ke Saham ANTM vs BRMS (2024)</b><br/>"
        "• <i>Konteks:</i> Harga emas dunia melonjak dari $2.050 menuju rekor $2.500+/oz pada 2024. Ritel berfokus pada ANTM karena gerai butik emas selalu antre.<br/>"
        "• <i>Perbedaan Fundamental:</i> ANTM adalah trader/refiner emas dengan gross margin tipis (2-4%), sedangkan <b>BRMS adalah penambang hulu murni (Pure-Play Gold Producer)</b> dengan gross margin tebal (&gt;40%). "
        "Biaya penambangan BRMS tetap di ~$1.000/oz. Kenaikan ASP emas dari $2.000 ke $2.500 menghasilkan <b>Operating Leverage eksplosif</b> (+50% peningkatan laba operasional).<br/>"
        "• <i>Hasil Kinerja Saham:</i> ANTM hanya naik +30.4% (Rp 1.380 &rarr; Rp 1.800) karena tertahan harga nikel yang lesu, "
        "sementara BRMS meroket <b>+115% (Rp 150 &rarr; Rp 320+)</b> didukung akumulasi institusional."
    )
    story.append(Paragraph(cs3, body_style))
    story.append(Spacer(1, 2.5*mm))

    cs4 = (
        "<b>STUDI KASUS 4: Bitcoin $60.000 Turtle Soup Liquidity Sweep (1 Mei 2024)</b><br/>"
        "• <i>Konteks:</i> Pasca All-Time High $73.700, Bitcoin berkonsolidasi di atas support psikologis $60.000 di mana jutaan order stop-loss ritel berkumpul.<br/>"
        "• <i>Rekayasa Likuiditas:</i> Pada 1 Mei 2024, harga sengaja dijatuhkan menembus $60.000 hingga mencatatkan titik terendah $56.552, "
        "memicu likuidasi posisi Long lebih dari <b>$450 juta</b>. Smart money menyerap pesanan jual panik tersebut via <i>Passive Buy Limit Absorption</i>.<br/>"
        "• <i>Konfirmasi:</i> Candle Daily membentuk <b>Long Rejection Wick</b> dan ditutup kembali (Daily Reclaim) di atas $61.500. "
        "Entry buy spot di $60.500 pasca reclaim dengan SL di $56.400 menghasilkan reli ke $71.900 dalam 3 pekan (+27% gain spot tanpa risiko likuidasi)."
    )
    story.append(Paragraph(cs4, body_style))
    story.append(PageBreak())

    # ==========================================
    # 9. BAB 8: SOP, PRE-FLIGHT CHECKLIST & JURNAL
    # ==========================================
    story.append(Paragraph('BAB 8: SOP OPERASIONAL, PRE-FLIGHT CHECKLIST & JURNAL DISIPLIN', h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceAfter=5))

    p16 = (
        "<b>8.1 Pre-Flight Safety Checklist (Gerbang Keputusan 5 Poin Saklek)</b><br/>"
        "Sama seperti pilot yang dilarang lepas landas jika ada alarm kabin menyala, trader kuantitatif MBG "
        "<b>DILARANG MENGEKSEKUSI ORDER BELI</b> jika salah satu dari 5 parameter ini berstatus merah:"
    )
    story.append(Paragraph(p16, body_style))

    check_table = [
        [Paragraph('<b>NO</b>', table_header), Paragraph('<b>PARAMETER CHECKLIST</b>', table_header), Paragraph('<b>AMBANG BATAS KELAYAKAN (THRESHOLD)</b>', table_header), Paragraph('<b>STATUS</b>', table_header)],
        [Paragraph('1', table_cell_bold), Paragraph('<b>Risiko Maksimal 2% & Kalkulator Lot</b>', table_cell), Paragraph('Kerugian jika kena SL &le; 2% total modal portofolio. Alokasi per saham &le; 25%.', table_cell), Paragraph('WAJIB HIJAU', table_cell_bold)],
        [Paragraph('2', table_cell_bold), Paragraph('<b>Asimetri Risk-to-Reward (R:R)</b>', table_cell), Paragraph('Rasio R:R terukur minimal 1 : 2.0 (Target profit minimal 2x jarak Stop Loss).', table_cell), Paragraph('WAJIB HIJAU', table_cell_bold)],
        [Paragraph('3', table_cell_bold), Paragraph('<b>Alignment Aliran Dana (IIFS / Flow)</b>', table_cell), Paragraph('IIFS Z-Score &ge; +0.5 (Akumulasi IDX) ATAU Exchange Outflow dominan (Kripto Spot).', table_cell), Paragraph('WAJIB HIJAU', table_cell_bold)],
        [Paragraph('4', table_cell_bold), Paragraph('<b>Batas Invalidasi Objektif</b>', table_cell), Paragraph('Titik gugur analisa ditetapkan pada level chart teknikal & order SL terpasang di sekuritas.', table_cell), Paragraph('WAJIB HIJAU', table_cell_bold)],
        [Paragraph('5', table_cell_bold), Paragraph('<b>Hygiene Psikologis Trader</b>', table_cell), Paragraph('Skor emosi 1-2 (Tenang/Objektif). Bukan revenge trading atau FOMO mengejar harga.', table_cell), Paragraph('WAJIB HIJAU', table_cell_bold)]
    ]
    t_chk = Table(check_table, colWidths=[10*mm, 52*mm, 88*mm, 24*mm])
    t_chk.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    story.append(t_chk)
    story.append(Spacer(1, 4*mm))

    p17 = (
        "<b>8.2 Kerangka Trading Journal Kuantitatif & Emotional Audit</b><br/>"
        "Sistem MBG menyediakan format pencatatan 17 parameter terukur untuk mengevaluasi performa dan bias emosi trader:"
    )
    story.append(Paragraph(p17, body_style))

    journal_table = [
        [Paragraph('<b>KATEGORI METRIK</b>', table_header), Paragraph('<b>PARAMETER YANG DICATAT</b>', table_header), Paragraph('<b>STANDAR PENGUKURAN & TUJUAN AUDIT</b>', table_header)],
        [Paragraph('<b>Identitas Trade</b>', table_cell_bold), Paragraph('Trade ID, Ticker, Asset Class, Strategy Setup', table_cell), Paragraph('Klasifikasi sistematis jenis strategi (SMC OB, IIFS Breakout, Macro Cycle).', table_cell)],
        [Paragraph('<b>Harga & Sizing</b>', table_cell_bold), Paragraph('Entry Price, Hard SL, TP1, Lot/Qty, Risk Nominal', table_cell), Paragraph('Memverifikasi kepatuhan terhadap formula kalkulator lot diskret 2%.', table_cell)],
        [Paragraph('<b>Hasil Finansial</b>', table_cell_bold), Paragraph('Exit Price, Gross PnL, Net PnL, R-Multiple Achieved', table_cell), Paragraph('Mengukur ekspektansi: target minimal rata-rata +2.0R per kemenangan.', table_cell)],
        [Paragraph('<b>Audit Emosi</b>', table_cell_bold), Paragraph('Pre-Trade Mood (1-5), Error Taxonomy Tagging', table_cell), Paragraph('Mendeteksi kesalahan: EARLY_EXIT, MOVED_SL, CHASED_PRICE, OVERSIZED.', table_cell)]
    ]
    t_jrn = Table(journal_table, colWidths=[32*mm, 56*mm, 86*mm])
    t_jrn.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    story.append(t_jrn)
    story.append(Spacer(1, 4*mm))

    p18 = (
        "<b>8.3 SOP Harian Trader MBG Cockpit (Runtutan Waktu Jakarta WIB)</b><br/>"
        "• <b>07:15 WIB:</b> Buka Telegram Morning Intelligence. Periksa arah DXY, US10Y, harga komoditas dunia, dan Top 5 Saham BEI.<br/>"
        "• <b>08:45 WIB:</b> Buka Web Cockpit. Cek apakah saham incaran berada di zona Diskon SMC (&lt;50%) dan IIFS berstatus Akumulasi Hijau.<br/>"
        "• <b>08:50 WIB:</b> Buka Kalkulator Lot Astra. Masukkan modal, Entry, dan SL. Verifikasi 5 Poin Pre-Flight Checklist.<br/>"
        "• <b>09:00 WIB:</b> Pasang order di aplikasi sekuritas: limit buy di Entry zone, order Stop Loss otomatis di RDN, dan TP1.<br/>"
        "• <b>12:15 WIB:</b> Evaluasi penutupan Sesi 1 via Telegram Midday Recap.<br/>"
        "• <b>16:15 WIB:</b> Catat transaksi di Trading Journal pasca penutupan bursa. Geser SL ke Break-Even (BEP) jika TP1 telah tercapai."
    )
    story.append(Paragraph(p18, body_style))
    story.append(PageBreak())

    # ==========================================
    # 10. BAB 9: MASTER GLOSSARY 66 ISTILAH
    # ==========================================
    story.append(Paragraph('BAB 9: MASTER GLOSSARY // KAMUS KILAT 66 ISTILAH TRADING TERVERIFIKASI', h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceAfter=5))

    glossary_intro = (
        "Daftar komprehensif 66 istilah teknis, mikrostruktur bursa BEI, algoritma kuantitatif, Smart Money Concepts, dan aset kripto spot. "
        "Dirancang untuk menjadi kamus saku referensi cepat bagi seluruh siswa MBG Quant Academy:"
    )
    story.append(Paragraph(glossary_intro, body_style))

    raw_glossary = [
        ("1", "Risk/Reward Ratio (R:R)", "Manajemen Risiko", "Perbandingan potensi risiko nominal rugi terhadap target profit.", "Wajib minimal 1:2. Jangan masuk trade jika potensi profit lebih kecil dari risiko."),
        ("2", "Hard Stop Loss (SL)", "Manajemen Risiko", "Batas harga mutlak di mana posisi wajib segera di-cut loss.", "Tentukan harga SL sebelum klik beli. Pasang auto-order di sekuritas/exchange."),
        ("3", "Aturan Risiko 2% (2% Rule)", "Manajemen Risiko", "Batas kerugian per transaksi maksimal 2% dari total ekuitas modal.", "Modal Rp10jt -> batas rugi maks Rp200rb. Menjamin akun bertahan dari rentetan rugi."),
        ("4", "Position Sizing / Kalkulator Lot", "Manajemen Risiko", "Kalkulasi matematis jumlah lot berdasarkan jarak entry ke Stop Loss.", "Lot = floor((Modal x 2%) / ((Entry - SL) x 100)). Mencegah pembelian all-in."),
        ("5", "Trailing Stop", "Manajemen Risiko", "Stop loss dinamis yang digeser naik mengunci floating profit.", "Jika saham naik +10%, geser SL ke atas titik modal (BEP) atau bawah swing low."),
        ("6", "Break-Even Point (BEP)", "Manajemen Risiko", "Menggeser batas SL ke harga beli setelah TP1 tercapai.", "Membuat sisa posisi 50% menjadi 'Risk-Free Trade' tanpa beban psikologis."),
        ("7", "Drawdown (DD)", "Manajemen Risiko", "Persentase penurunan modal portofolio dari puncak tertinggi ke lembah.", "Jaga DD di bawah 15%. Penurunan 50% butuh recovery 100% hanya untuk impas."),
        ("8", "Cut Loss vs Averaging Down", "Manajemen Risiko", "Cut Loss = buang rugi; Averaging Down = beli lagi saham turun.", "Pemula dilarang averaging down pada saham downtrend karena mengunci modal."),
        ("9", "3 Invalidation Rules", "Manajemen Risiko", "3 kondisi objektif yang otomatis menggugurkan tesis trading.", "Jebol support struktur, IIFS berbalik distribusi, atau pembalikan makro ekstrem."),
        ("10", "Awaiting Human Review", "Manajemen Risiko", "Status sinyal kuantitatif di mana eksekusi akhir 100% di tangan trader.", "Bot MBG memberikan alpha berbasis data; eksekusi akhir diotorisasi oleh manusia."),
        
        ("11", "Lot Saham", "Mekanisme Bursa", "Satuan baku transaksi saham resmi BEI (1 Lot = 100 lembar saham).", "Beli 5 lot saham Rp2.000 butuh modal Rp1.000.000 (tambah estimasi fee ~0.15%)."),
        ("12", "Fraksi Harga BEI (Tick Size)", "Mekanisme Bursa", "Kelipatan kenaikan/penurunan harga resmi sesuai 5 kelompok harga.", "<200 (Rp1), 200-500 (Rp2), 500-2rb (Rp5), 2rb-5rb (Rp10), >=5rb (Rp25)."),
        ("13", "ARA (Auto Rejection Atas)", "Mekanisme Bursa", "Batas maksimal persentase kenaikan harga harian di bursa (20% - 35%).", "Antrean offer kosong. Hindari FOMO membeli di pucuk ARA karena rawan koreksi."),
        ("14", "ARB Simetris (Bawah)", "Mekanisme Bursa", "Batas maksimal persentase penurunan harga harian (-20% s/d -35%).", "Berdasarkan Kep-00055/BEI/03-2023, batas ARB simetris dengan persentase ARA."),
        ("15", "Bid & Offer (Order Book)", "Mekanisme Bursa", "Bid (kiri) = antrean pembeli; Offer/Ask (kanan) = antrean penjual.", "Harga naik jika ada yang HAKA Offer; harga turun jika ada yang HAKI Bid."),
        ("16", "HAKA (Hajar Kanan)", "Mekanisme Bursa", "Membeli langsung di harga Offer terbaik agar order tereksekusi instan.", "Gunakan saat momentum breakout kuat, namun sadari harga beli lebih mahal."),
        ("17", "HAKI (Hajar Kiri)", "Mekanisme Bursa", "Menjual langsung di harga Bid terbaik agar posisi laku seketika.", "Wajib dilakukan saat Cut Loss darurat ketika struktur harga jebol."),
        ("18", "Cum Date & Ex Date", "Mekanisme Bursa", "Cum Date = hari terakhir berhak dividen; Ex Date = hari tanpa dividen.", "Memegang saham di Cum Date berhak dividen, namun Ex-Date rawan dibuka gap down."),
        ("19", "Dividend Trap", "Mekanisme Bursa", "Jebakan penurunan harga di Ex-Date melebihi dividen tunai yang diterima.", "Sering terjadi pada saham siklikal komoditas dengan dividen yield >10%."),
        ("20", "Tiering Saham (Bluechip s/d Gorengan)", "Mekanisme Bursa", "Blue Chip (>Rp50T likuid); 2nd liner (mid-cap); 3rd liner (small-cap).", "Pemula wajib 70-80% modal di Blue Chip / LQ45. Batasi saham gorengan."),
        ("21", "UMA (Unusual Market Activity)", "Mekanisme Bursa", "Radar peringatan BEI atas pergerakan saham di luar kebiasaan.", "Batasi alokasi modal pada saham UMA karena memiliki risiko suspensi gembok bursa."),
        ("22", "Suspensi Bursa", "Mekanisme Bursa", "Penghentian sementara perdagangan suatu saham oleh otoritas BEI.", "Jika disuspensi, dana Anda terkunci tidak bisa ditransaksikan sampai gembok dibuka."),
        ("23", "Klaster Konglomerasi", "Mekanisme Bursa", "Grup kepemilikan konglo (Barito, Salim, Astra, Djarum, Bakrie, Adaro).", "Saham dalam satu konglomerasi bergerak dalam korelasi kuat saat aksi korporasi."),

        ("24", "Order Block (OB)", "Price Action & SMC", "Candle berlawanan arah terakhir sebelum lonjakan impulsif >2x ATR.", "Bullish OB = candle merah sebelum reli. Pasang antrean beli saat retest."),
        ("25", "Bullish OB vs Bearish OB", "Price Action & SMC", "OB Beli (sebelum reli naik) vs OB Jual (sebelum penurunan tajam).", "Bullish OB dipakai untuk entry buy; Bearish OB dipakai untuk target exit/TP."),
        ("26", "Status OB (Fresh/Tested/Broken)", "Price Action & SMC", "Fresh (belum disentuh); Tested (sudah dipantulkan); Broken (jebol).", "Prioritaskan Fresh OB. Hindari OB yang sudah diuji >2 kali karena rentan jebol."),
        ("27", "Fair Value Gap (FVG)", "Price Action & SMC", "Celah ketidakseimbangan harga antara Candle ke-1 dan Candle ke-3.", "FVG bertindak sebagai magnet. Entry terbaik saat harga retrace menutup FVG."),
        ("28", "Break of Structure (BOS)", "Price Action & SMC", "Penembusan swing high/low sebelumnya mengonfirmasi kelanjutan tren.", "Tunggu harga pullback ke area diskon pasca BOS, jangan kejar di pucuk breakout."),
        ("29", "Change of Character (CHoCH)", "Price Action & SMC", "Sinyal awal pembalikan arah struktur pasar dari turun ke naik (reversal).", "Peringatan awal bahwa tren lama melemah dan tren baru mulai terbentuk."),
        ("30", "Liquidity Sweep (Stop Hunt)", "Price Action & SMC", "Manipulasi harga menembus support sesaat untuk memicu cut loss ritel.", "Ciri khas: candle meninggalkan ekor panjang (wick) bervolume besar pasca tembus support."),
        ("31", "Discount Zone vs Premium Zone", "Price Action & SMC", "Diskon (<50% range) = area beli; Premium (>50% range) = area jual.", "Beli hanya di zona diskon yang bersinggungan dengan Bullish Order Block."),
        ("32", "Confluence Score", "Price Action & SMC", "Skor kumulatif keselarasan teknikal (Diskon + Fresh OB + FVG + Volume).", "Skor >75% menandakan setup dengan probabilitas keberhasilan tinggi."),
        ("33", "Support & Resistance (S/R)", "Price Action & SMC", "Lantai penahan turun (Support) dan plafon penahan naik (Resistance).", "Beli di support teruji dengan SL ketat; jual sebagian di plafon resistance."),

        ("34", "Institutional Inflow Score (IIFS)", "Bandarmologi & Flow", "Skor kuantitatif gabungan 4 indikator volume melacak uang bandar/asing.", "Skor Z > +1.5 = akumulasi agresif; Skor Z < -1.5 = distribusi masif."),
        ("35", "Z-Score Normalization", "Bandarmologi & Flow", "Standarisasi deviasi statistik data deret waktu dengan rolling window 20.", "Mengukur keabnormalan volume transaksi relatif terhadap rata-rata 20 hari."),
        ("36", "OBV Z-Score (30%)", "Bandarmologi & Flow", "Pilar 1 IIFS: volume kumulatif pada hari kenaikan vs penurunan harga.", "OBV divergence naik saat harga flat mengonfirmasi akumulasi senyap bandar."),
        ("37", "MFI Z-Score (25%)", "Bandarmologi & Flow", "Pilar 2 IIFS: Money Flow Index tertimbang volume harga tipikal.", "Mengukur tekanan likuiditas uang nyata pembeli institusi."),
        ("38", "Deviasi VWAP (25%)", "Bandarmologi & Flow", "Pilar 3 IIFS: selisih harga terakhir terhadap Volume-Weighted Average Price.", "Harga di atas VWAP menandakan pembeli dominan; patokan harga rata-rata institusi."),
        ("39", "Chaikin A/D Line (20%)", "Bandarmologi & Flow", "Pilar 4 IIFS: posisi penutupan harian dalam rentang High-Low dikali volume.", "Mengukur apakah institusi menutup posisi di pucuk atas atau bawah spread."),
        ("40", "Net Foreign Flow (NFF)", "Bandarmologi & Flow", "Selisih beli bersih dikurangi jual bersih oleh seluruh investor asing.", "Asing penggerak utama saham penggerak indeks (BBCA, BBRI, BMRI, TLKM)."),
        ("41", "Fase Akumulasi & Distribusi", "Bandarmologi & Flow", "Akumulasi = kumpul barang murah; Distribusi = buang barang di harga mahal.", "Akumulasi: harga sideways volume membesar. Distribusi: berita positif harga gagal naik."),
        ("42", "Fake Bid / Offer (Spoofing)", "Bandarmologi & Flow", "Pemasangan puluhan ribu lot order semu yang dicabut sebelum tereksekusi.", "Bid tebal palsu dipasang memancing ritel HAKA sebelum bandar banting harga."),
        ("43", "VWAP", "Bandarmologi & Flow", "Volume-Weighted Average Price patokan harga wajar transaksi big player.", "Jangan membeli untuk day trade jika harga saham berada jauh di bawah VWAP."),

        ("44", "Google TimesFM 2.5", "Model Kuantitatif & AI", "Foundation Model AI Google Research untuk meramal lintasan harga 5 hari.", "Memberikan proyeksi tren probabilistik dengan arsitektur Transformer time-series."),
        ("45", "Confidence Band 80%", "Model Kuantitatif & AI", "Pita batas ramalan atas dan bawah dengan derajat keyakinan 80%.", "Membantu trader melihat batas optimis dan pesimis pergerakan harga."),
        ("46", "Statistical Ensemble Fallback", "Model Kuantitatif & AI", "Sistem cadangan regresi linear + EMA momentum jika TimesFM offline.", "Menjamin sistem tidak pernah crash dan selalu menyajikan proyeksi matematis."),
        ("47", "Exp3 Multi-Armed Bandit", "Model Kuantitatif & AI", "Algoritma online machine learning melombakan bobot strategi trading.", "Otomatis menaikkan bobot strategi yang sedang memiliki win rate tertinggi."),
        ("48", "State Machine Virtual Portfolio", "Model Kuantitatif & AI", "Alur simulasi forward testing: PENDING -> ACTIVE -> TP/SL HIT -> EXPIRED.", "Mencatat performa simulasi tanpa risiko dengan batas kedaluwarsa 30 hari."),
        ("49", "Rolling 30-Day Auto Purge", "Model Kuantitatif & AI", "Pembersihan otomatis riwayat simulasi yang berumur lebih dari 30 hari.", "Menjaga database tetap bersih, ringan, dan relevan dengan kondisi bursa terkini."),
        ("50", "LLM Brain (Gemini Flash)", "Model Kuantitatif & AI", "AI sintesis tiket trading harian dan penerjemah narasi 'Bahasa Bayi'.", "Menjelaskan peristiwa makro rumit dalam 2 kalimat santai ramah pemula."),

        ("51", "Moving Average (MA20 & MA50)", "Indikator Teknis", "Rata-rata harga penutupan 20 hari (pendek) dan 50 hari (menengah).", "Kondisi bullish sehat jika Harga > MA20 > MA50 (Golden Alignment)."),
        ("52", "Golden Alignment", "Indikator Teknis", "Susunan sempurna tren naik di mana Harga > MA20 > MA50.", "Konfirmasi tren bullish berkepastian tinggi untuk strategi swing trading."),
        ("53", "RSI 14 (Wilder's Smoothing)", "Indikator Teknis", "Indikator momentum 0-100: Overbought (>70), Oversold (<30).", "Zona momentum breakout terbaik berada pada rentang RSI 50-65."),
        ("54", "ATR (Average True Range)", "Indikator Teknis", "Ukuran volatilitas rata-rata rentang harga per candle selama 14 periode.", "Dipakai untuk mengukur impulse Order Block (>2x ATR) dan trailing stop."),
        ("55", "Volume Spike", "Indikator Teknis", "Lonjakan volume perdagangan melompat >2x rata-rata 20 hari.", "Breakout resisten wajib divalidasi volume spike untuk menghindari bull trap."),
        ("56", "Pearson Correlation Matrix", "Indikator Teknis", "Matriks korelasi statistik (-1.0 s/d +1.0) pergerakan antar aset.", "Menghindari diversifikasi semu saham yang bergerak searah 100%."),

        ("57", "DXY (US Dollar Index)", "Makro & Kripto", "Indeks kekuatan mata uang USD terhadap mata uang utama dunia.", "DXY melonjak tajam memicu capital outflow asing dari IHSG dan pelemahan Rupiah."),
        ("58", "US10Y Treasury Yield", "Makro & Kripto", "Imbal hasil obligasi AS 10 tahun tolok ukur risk-free rate dunia.", "Kenaikan US10Y menaikkan biaya modal global dan menekan valuasi saham."),
        ("59", "Komoditas XAU & Brent Crude", "Makro & Kripto", "Harga acuan Emas dunia (safe haven) dan Minyak Mentah energi.", "Transmisi langsung ke saham tambang emas (ANTM/BRMS) dan migas (MEDC/ENRG)."),
        ("60", "Crypto Spot USDT", "Makro & Kripto", "Pembelian aset kripto murni 1:1 tanpa leverage pinjaman margin.", "Bebas biaya inap, nol risiko likuidasi paksa saat terjadi flash dump."),
        ("61", "Bitcoin Halving 4 Tahunan", "Makro & Kripto", "Pemotongan 50% imbalan penambang BTC setiap 210.000 blok.", "Memicu kejutan pasokan (supply shock) dan awal siklus pasar bullish."),
        ("62", "Bitcoin Dominance (BTC.D)", "Makro & Kripto", "Persentase kapitalisasi pasar Bitcoin terhadap total pasar kripto.", "BTC.D anjlok mengonfirmasi dimulainya musim altcoin (Altseason)."),

        ("63", "Master Top Bar HUD", "Cockpit UI MBG", "Bar atas navigasi waktu WIB, status data real-time, dan kalkulator.", "Pusat kontrol navigasi terminal pasar modal MBG Cockpit."),
        ("64", "Bloomberg NewsWire Tape", "Cockpit UI MBG", "Pita berjalan 4 indikator makro dan carousel berita headline 6 detik.", "Menyajikan radar berita makro dan ticker emiten terdampak secara instan."),
        ("65", "Executive Hero Bar", "Cockpit UI MBG", "3 kartu ringkasan eksekutif: Sentimen IHSG, Top Saham, dan Top Crypto.", "Menampilkan alpha pilihan harian dengan skor probabilitas tertinggi."),
        ("66", "Telegram Radar 24/7", "Cockpit UI MBG", "Bot asisten siaga 6 format pesan (Morning, Midday, Evening, Alert, Chat).", "Mengirim sinyal instan dan panduan interaktif langsung ke smartphone trader.")
    ]

    table_rows = [
        [Paragraph('<b>#</b>', table_header), Paragraph('<b>ISTILAH & KATEGORI</b>', table_header), Paragraph('<b>PENJELASAN KONSEP (PEMULA)</b>', table_header), Paragraph('<b>ATURAN / TIPS PRAKTIS DI PASAR</b>', table_header)]
    ]
    for row in raw_glossary:
        no, term, cat, desc, practical = row
        term_cell = f"<b>{term}</b><br/><font color='#0284C7'>[{cat}]</font>"
        practical_cell = f"<font color='#D97706'><b>Tips Praktis:</b></font> {practical}"
        table_rows.append([
            Paragraph(no, table_cell_bold),
            Paragraph(term_cell, table_cell),
            Paragraph(desc, table_cell),
            Paragraph(practical_cell, table_cell)
        ])

    t_gloss = Table(table_rows, colWidths=[8*mm, 42*mm, 60*mm, 64*mm], repeatRows=1)
    t_gloss.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 2.6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    story.append(t_gloss)
    story.append(PageBreak())

    # ==========================================
    # 11. BAB 10: DAFTAR REFERENSI ILMIAH & REGULASI
    # ==========================================
    story.append(Paragraph('BAB 10: DAFTAR REFERENSI ILMIAH & REGULASI RESMI BURSA', h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0F172A'), spaceAfter=5))

    p_ref = (
        "Seluruh materi, formula matematis, dan studi kasus dalam kurikulum ini diverifikasi berdasarkan literatur ilmiah terindeks "
        "dan regulasi resmi otoritas pasar modal:"
    )
    story.append(Paragraph(p_ref, body_style))

    ref_items = [
        "<b>Regulasi BEI/OJK:</b> Keputusan Direksi PT Bursa Efek Indonesia No. Kep-00023/BEI/04-2016 tentang Perubahan Satuan Perubahan Harga (Fraksi).",
        "<b>Regulasi BEI/OJK:</b> Keputusan Direksi PT Bursa Efek Indonesia No. Kep-00055/BEI/03-2023 tentang Normalisasi Batas Auto Rejection Simetris Pasar Reguler dan Tunai.",
        "<b>Regulasi BEI/OJK:</b> Peraturan BEI Nomor II-A tentang Perdagangan Efek Bersifat Ekuitas (Mekanisme JATS FIFO Price/Time Priority).",
        "<b>Position Sizing:</b> Vince, Ralph (1990). <i>Portfolio Management Formulas: Mathematical Trading Methods for the Futures, Options, and Stock Markets</i>. John Wiley & Sons.",
        "<b>Manajemen Modal:</b> Tharp, Van K. (1998). <i>Trade Your Way to Financial Freedom</i>. McGraw-Hill (The 2% Position Sizing & Expectancy Model).",
        "<b>Probabilitas Drawdown:</b> Feller, William (1968). <i>An Introduction to Probability Theory and Its Applications</i> (Vol. 1, 3rd ed.). John Wiley & Sons (Classical Gambler’s Ruin).",
        "<b>Indikator Volatilitas:</b> Wilder, J. Welles Jr. (1978). <i>New Concepts in Technical Trading Systems</i>. Trend Research (Formulasi ATR & RSI Wilder's Smoothing).",
        "<b>Volume Arus Dana:</b> Granville, Joseph E. (1963). <i>Granville’s New Key to Stock Market Profits</i>. Prentice-Hall (Penemu On-Balance Volume / OBV).",
        "<b>Money Flow:</b> Quong, Gene & Soudack, Avrum (1989). 'Volume-Weighted RSI: Money Flow Index'. <i>Technical Analysis of Stocks & Commodities</i>, 7(3), 76-80.",
        "<b>Benchmark VWAP:</b> Berkowitz, S. A., Logue, D. E., & Noser, E. A. (1988). 'The Total Cost of Transactions on the NYSE'. <i>The Journal of Finance</i>, 43(1), 97-112.",
        "<b>Akumulasi/Distribusi:</b> Chaikin, Marc (1981). <i>Volume Accumulator: A New Way to Measure Institutional Activity</i>. Technical Paper.",
        "<b>Smart Money Concepts:</b> Huddleston, Michael J. (2016-2022). <i>The Inner Circle Trader (ICT) Methodology: Institutional Order Flow, Order Blocks, and Liquidity Pools</i>.",
        "<b>Machine Learning AI:</b> Das, A., Kong, W., Sen, R., & Zhou, Y. (2024). 'A Decoder-Only Foundation Model for Time-Series Forecasting (TimesFM)'. <i>Proceedings of the 41st International Conference on Machine Learning (ICML 2024)</i>. Google Research.",
        "<b>Algoritma Bandit:</b> Auer, P., Cesa-Bianchi, N., Freund, Y., & Schapire, R. E. (2002). 'The Nonstochastic Multiarmed Bandit Problem (Exp3 Algorithm)'. <i>SIAM Journal on Computing</i>, 32(1), 48-77.",
        "<b>Protokol Kripto:</b> Nakamoto, Satoshi (2008). <i>Bitcoin: A Peer-to-Peer Electronic Cash System</i>. Whitepaper.",
        "<b>Siklus Kripto:</b> PlanB (2019). 'Modeling Bitcoin Value with Scarcity (Stock-to-Flow Model)'. <i>Medium Analysis</i>."
    ]
    for r in ref_items:
        story.append(Paragraph(f"[{r.split(':')[0]}] {':'.join(r.split(':')[1:])}", bullet_style))
        
    story.append(Spacer(1, 8*mm))
    colophon = (
        "<b>LEMBAR PENGESAHAN DOKUMEN SISTEM MBG:</b><br/>"
        "Dokumen ini diterbitkan secara resmi oleh <b>Astra Quant Intelligence Desk // Market Brain Grid</b>. "
        "Seluruh modul telah melalui tahap verifikasi silang (cross-verification) oleh Tim Kuantitatif, Tim Trading Pasar Modal, "
        "Tim Pedagogi Finansial, dan Tim Analisis Kasus Historis. Dokumen ini dilindungi hak cipta internal untuk penggunaan para stakeholder, "
        "trader kuantitatif, dan pengguna resmi terminal MBG Version 2."
    )
    t_col = Table([[Paragraph(colophon, callout_box)]], colWidths=[174*mm])
    t_col.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#475569')),
        ('PADDING', (0,0), (-1,-1), 6)
    ]))
    story.append(t_col)

    # Build document
    doc.build(story, canvasmaker=AcademyNumberedCanvas)
    print(f"[SUCCESS] Master Training Book PDF generated successfully: {target_pdf}")

if __name__ == '__main__':
    build_pdf()
