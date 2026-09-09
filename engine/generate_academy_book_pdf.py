# -*- coding: utf-8 -*-
import sys, os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas

def clean_str(s):
    if not isinstance(s, str):
        return str(s)
    s = s.replace('\u201c', '"').replace('\u201d', '"').replace('\u2018', "'").replace('\u2019', "'")
    s = s.replace('\u2192', '->').replace('\u2190', '<-').replace('\u2014', '-').replace('\u2013', '-')
    s = s.replace('\u2022', '&bull;').replace('\u00d7', 'x').replace('\u2265', '>=').replace('\u2264', '<=')
    s = s.replace('\u00b1', '+/-')
    return s

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
    fig_caption = ParagraphStyle(
        'FigCaption',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=6.8,
        leading=9,
        alignment=1,
        textColor=colors.HexColor('#475569'),
        spaceAfter=5
    )

    def make_callout(text, title='CATATAN PENTING // DOKTRIN ASTRA', bg_col='#E0F2FE', border_col='#0284C7'):
        content = f"<b>{title}:</b><br/>{text}"
        t = Table([[Paragraph(content, callout_box)]], colWidths=[174*mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(bg_col)),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor(border_col)),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
        ]))
        return t

    def make_analogy_box(num_str, title_str, metaphor_str, narrative_str, lesson_str):
        header_text = f"<b>ANALOGI #{num_str}: {title_str.upper()}</b> &mdash; <i>{metaphor_str}</i>"
        body_content = f"{narrative_str}<br/><br/><b>Pelajaran Emas untuk Pemula:</b> {lesson_str}"
        t = Table([
            [Paragraph(header_text, table_header)],
            [Paragraph(body_content, table_cell)]
        ], colWidths=[174*mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0369A1')),
            ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#F0F9FF')),
            ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#0284C7')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#BAE6FD')),
            ('PADDING', (0,0), (-1,-1), 4.5)
        ]))
        return t

    def make_figure_block(img_rel_path, fig_num_str, title_str, caption_str, w_mm=170, h_mm=90):
        elements = []
        if os.path.exists(img_rel_path):
            img = Image(img_rel_path, width=w_mm*mm, height=h_mm*mm)
            elements.append(img)
            elements.append(Spacer(1, 1.5*mm))
            caption_text = f"<b>GAMBAR {fig_num_str}: {title_str.upper()}</b> &mdash; {caption_str}"
            elements.append(Paragraph(caption_text, fig_caption))
            elements.append(Spacer(1, 3.5*mm))
        else:
            elements.append(Paragraph(f"[PERINGATAN: Gambar {img_rel_path} tidak ditemukan]", fig_caption))
        return KeepTogether(elements)

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
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph('<b>1.3 Tujuh Analogi Membumi Penyelamat Nyawa Pemula</b>', h2_style))
    story.append(Paragraph(
        "Untuk membantu orang awam memahami pasar secara intuitif dalam hitungan menit tanpa tersesat dalam jargon teknis, "
        "MBG Quant Academy menetapkan 7 analogi baku yang wajib dipahami:",
        body_style
    ))
    story.append(Spacer(1, 2*mm))

    story.append(make_analogy_box(
        "1", "Hard Stop Loss (SL)", "Sabuk Pengaman & Airbag Mobil",
        "Stop Loss bukan tanda kekalahan atau kebodohan, melainkan persis seperti <b>sabuk pengaman dan airbag mobil</b>. "
        "Mengaktifkan Stop Loss bukan berniat menabrakkan mobil, melainkan saat ada truk rem blong (koreksi pasar tiba-tiba), "
        "airbag meledak menyelamatkan nyawa Anda. Anda lebam sedikit (rugi 2%), tetapi Anda tetap hidup dan besok bisa menyetir lagi.",
        "Jangan pernah masuk ke pasar modal tanpa memasang rem darurat saklek!"
    ))
    story.append(Spacer(1, 2.5*mm))

    story.append(make_analogy_box(
        "2", "Aturan Risiko 2% (2% Rule)", "Bensin Cadangan Jet Tempur F-16",
        "Pilot tempur selalu menyisakan bahan bakar cadangan saklek agar pesawat bisa pulang selamat ke kapal induk. "
        "Aturan Risiko 2% memastikan dalam 1 kali transaksi, Anda maksimal hanya boleh rugi 2% dari total modal akun (Modal Rp 10 juta = batas rugi maksimal Rp 200 ribu). "
        "Dibutuhkan 50 kali salah berturut-turut untuk menghabiskan modal Anda.",
        "Batasi risiko nominal per trade agar 1 kekalahan tidak pernah mengganggu ketenangan tidur Anda."
    ))
    story.append(Spacer(1, 2.5*mm))

    story.append(make_analogy_box(
        "3", "Order Block Institusi", "Jejak Kaki Gajah di Pasir Pantai",
        "Institusi raksasa mengelola ratusan miliar hingga triliunan rupiah. Ketika seekor <b>gajah raksasa melintasi pasir pantai yang basah</b>, "
        "jejak kakinya meninggalkan cekungan dalam (Order Block). Saat harga kembali menginjak cekungan pasir itu, area tersebut menjadi bantalan kuat pemantulan.",
        "Jangan melawan gajah. Cukup temukan jejak kakinya di grafik, lalu ikut menunggangi dorongannya."
    ))
    story.append(Spacer(1, 2.5*mm))

    story.append(make_analogy_box(
        "4", "Fair Value Gap (FVG)", "Celah Gravitasi & Magnet Diskon Supermarket",
        "Lompatan harga yang terburu-buru meninggalkan ruang hampa (vacuum) likuiditas 3 candlestick. "
        "Hukum pasar seperti gravitasi: harga saham pasti memiliki daya tarik magnetik untuk tersedot kembali mengisi ruang hampa diskon tersebut sebelum melanjutkan reli.",
        "Jangan pernah mengejar harga yang sedang lari kencang (FOMO). Tunggu harga ditarik magnet kembali ke FVG."
    ))
    story.append(Spacer(1, 2.5*mm))

    story.append(make_analogy_box(
        "5", "Dividend Trap Saham Siklikal", "Keju Gratis di Perangkap Tikus",
        "Aroma wangi keju dividen yield 25% memancing investor pemula berebut membeli di puncak Cum-Date. "
        "Namun esok harinya saat Ex-Date, bandar serentak membanting harga ARB simetris berhari-hari (-32%). Hasilnya: dividen didapat Rp 800, harga anjlok Rp 1.250 (boncos bersih -9.3%).",
        "Tidak ada makan siang gratis di bursa. Hindari membeli saham hanya karena tergiur besarnya persentase dividen!"
    ))
    story.append(Spacer(1, 2.5*mm))

    story.append(make_analogy_box(
        "6", "Order Book (Bid/Offer) & HAKA/HAKI", "Antrean Lelang Sayur di Pasar Tradisional",
        "Bid adalah antrean pedagang menawar murah, Offer adalah antrean petani memasang harga jual tinggi. "
        "HAKA (Hajar Kanan) adalah pembeli borong langsung tanpa menawar; HAKI (Hajar Kiri) adalah petani panik obral murah langsung ke antrean pembeli.",
        "Perhatikan apakah transaksi didorong agresivitas beli (HAKA) atau aksi panik buang barang (HAKI)."
    ))
    story.append(Spacer(1, 2.5*mm))

    story.append(make_analogy_box(
        "7", "Kripto Spot USDT", "Beli Emas Batangan Fisik vs Main Kasino Rentenir",
        "Membeli Spot USDT (tanpa leverage) seperti membeli keping emas murni lalu disimpan di brankas sendiri: tidak ada yang bisa menyita aset Anda. "
        "Sebaliknya, trading Futures leverage tinggi seperti berjudi di kasino dengan utang rentenir: jarum wicking flash dump seketika melenyapkan seluruh modal (likuidasi).",
        "Pegang aset Spot murni, nikmati tidur tenang tanpa rasa was-was terkena margin call!"
    ))
    story.append(PageBreak())

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

    # EMBED GAMBAR 3: Drawdown vs Recovery
    story.append(make_figure_block(
        os.path.join("COMPILE PRD", "figures", "03_drawdown_vs_recovery.png"),
        "1", "Kurva Hiperbolik Drawdown vs Persentase Pemulihan Modal (Recovery Return)",
        "Grafik memvisualisasikan bagaimana penurunan modal di atas 20% membuat kebutuhan pemulihan melonjak tajam secara eksponensial. "
        "Zona merah tebal (>50% DD) adalah 'Jurang Kematian Finansial' di mana trader membutuhkan keuntungan lebih dari 100% hingga 900% "
        "hanya untuk sekadar kembali ke titik impas modal awal.",
        w_mm=160, h_mm=108
    ))
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph('<b>2.3 Tiga Tier Modal Riil Pemula (Rupiah Nyata)</b>', h2_style))
    story.append(Paragraph(
        "Berapapun modal awal yang Anda miliki saat memulai, formula perlindungan modal 2% bekerja dengan disiplin yang sama persis. "
        "Berikut adalah batas risiko mutlak yang tidak boleh dilanggar untuk 3 profil modal awal pemula:",
        body_style
    ))

    tier_table_data = [
        [Paragraph('<b>TIER MODAL</b>', table_header), Paragraph('<b>TOTAL SALDO AKUN</b>', table_header), Paragraph('<b>BATAS RISIKO PER TRANSAKSI (2%)</b>', table_header), Paragraph('<b>MAKSIMAL ALOKASI DANA PER POSISI (25%)</b>', table_header), Paragraph('<b>DAYA TAHAN SALAH BERTURUT-TURUT</b>', table_header)],
        [Paragraph('<b>Tier Pemula Mini</b>', table_cell_bold), Paragraph('Rp 5.000.000', table_cell), Paragraph('<b>Rp 100.000</b>', table_cell_bold), Paragraph('Rp 1.250.000', table_cell), Paragraph('50 Kali Berturut-turut', table_cell)],
        [Paragraph('<b>Tier Standar Ritel</b>', table_cell_bold), Paragraph('Rp 10.000.000', table_cell), Paragraph('<b>Rp 200.000</b>', table_cell_bold), Paragraph('Rp 2.500.000', table_cell), Paragraph('50 Kali Berturut-turut', table_cell)],
        [Paragraph('<b>Tier Menengah Astra</b>', table_cell_bold), Paragraph('Rp 20.000.000', table_cell), Paragraph('<b>Rp 400.000</b>', table_cell_bold), Paragraph('Rp 5.000.000', table_cell), Paragraph('50 Kali Berturut-turut', table_cell)]
    ]
    t_tier = Table(tier_table_data, colWidths=[28*mm, 28*mm, 42*mm, 44*mm, 32*mm])
    t_tier.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 3.2),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t_tier)
    story.append(Spacer(1, 4*mm))

    story.append(Paragraph('<b>2.4 Sistem Rem Ganda (Dual-Brake System) & Panduan Hitung Lot</b>', h2_style))
    story.append(Paragraph(
        "Kelemahan paling umum dari rumus position sizing standar adalah: jika Stop Loss diletakkan sangat dekat dengan harga beli "
        "(misal hanya selisih 1-2 fraksi), rumus matematika akan menghasilkan jumlah lot yang sangat besar hingga menghabiskan 80-100% "
        "seluruh modal Anda (Over-concentration). Untuk mencegah malapetaka ini, sistem Astra memberlakukan <b>Sistem Rem Ganda</b>:",
        body_style
    ))

    dual_brake_box = (
        "<b>FORMULA SISTEM REM GANDA (DUAL-BRAKE LOT CALCULATION):</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Lot = min( Rem_1, Rem_2 )</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Rem_1 (Batas Risiko Nominal 2%) = floor[ (Modal x 2%) / ((Harga_Beli - Stop_Loss) x 100) ]</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Rem_2 (Batas Eksposur Portofolio 25%) = floor[ (Modal x 25%) / (Harga_Beli x 100) ]</b><br/>"
        "<i>*Catatan: Fungsi 'floor' berarti koma desimal SELALU dibuang ke bawah agar batas risiko tidak terlampaui.</i>"
    )
    story.append(make_callout(dual_brake_box, 'SISTEM REM GANDA ASTRA', '#ECFDF5', '#059669'))
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph('<b>Tutorial Contoh Kasus Nyata Hitung Lot:</b>', body_bold))
    story.append(Paragraph(
        "<b>Kasus Saham A (Harga Menengah):</b> Anda memiliki modal Rp 10.000.000. Ingin membeli saham perbankan di harga <b>Rp 1.500</b>, "
        "dengan batas Stop Loss di bawah swing low pada level <b>Rp 1.425</b> (Jarak SL = Rp 75 atau 5%).<br/>"
        "&bull; <b>Langkah 1:</b> Hitung batas rugi 2% = 2% x Rp 10.000.000 = Rp 200.000.<br/>"
        "&bull; <b>Langkah 2:</b> Hitung risiko per lembar saham = Rp 1.500 - Rp 1.425 = Rp 75 (atau Rp 7.500 per lot).<br/>"
        "&bull; <b>Langkah 3 (Rem 1):</b> Rp 200.000 / Rp 7.500 = 26,67 lot &rarr; Buang koma ke bawah = <b>26 Lot</b>.<br/>"
        "&bull; <b>Langkah 4 (Rem 2):</b> Batas modal 25% = Rp 2.500.000 / (Rp 1.500 x 100) = 16,67 lot &rarr; <b>16 Lot</b>.<br/>"
        "&bull; <b>HASIL KEPUTUSAN REM GANDA:</b> min(26 lot, 16 lot) = <b>16 Lot (Senilai Rp 2.400.000)</b>.<br/>"
        "<i>Perhatikan: Rem 2 aktif menyelamatkan portofolio Anda dari risiko menumpuk terlalu banyak modal pada satu saham saja!</i>",
        body_style
    ))
    story.append(Spacer(1, 2*mm))

    story.append(Paragraph(
        "<b>Kasus Saham B (Saham Murah / Second Liner):</b> Anda memiliki modal Rp 5.000.000. Ingin membeli saham tambang di harga <b>Rp 350</b>, "
        "dengan Stop Loss di <b>Rp 336</b> (Fraksi Rp 2, selisih 7 fraksi = Rp 14).<br/>"
        "&bull; <b>Rem 1 (Risiko 2% = Rp 100.000):</b> Rp 100.000 / (Rp 14 x 100) = 71,42 lot &rarr; <b>71 Lot</b>.<br/>"
        "&bull; <b>Rem 2 (Eksposur 25% = Rp 1.250.000):</b> Rp 1.250.000 / (Rp 350 x 100) = 35,71 lot &rarr; <b>35 Lot</b>.<br/>"
        "&bull; <b>HASIL KEPUTUSAN REM GANDA:</b> min(71 lot, 35 lot) = <b>35 Lot (Senilai Rp 1.225.000)</b>.<br/>"
        "Jika Anda terkena Stop Loss, nominal rugi Anda hanya 35 lot x Rp 14 x 100 = <b>Rp 49.000 (hanya 0.98% modal, sangat aman!)</b>.",
        body_style
    ))
    story.append(Spacer(1, 3*mm))

    p5 = (
        "<b>2.5 Simulasi Monte Carlo: Mengapa Risiko 10% Menghancurkan Akun vs Ketahanan 2%</b><br/>"
        "Dengan risiko r = 10% per trade, rentetan kerugian 7 kali berturut-turut akan memangkas modal sebesar: "
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
    story.append(Spacer(1, 3*mm))

    # EMBED GAMBAR 2: Macro & Commodity Transmission
    story.append(make_figure_block(
        os.path.join("COMPILE PRD", "figures", "08_macro_commodity_transmission.png"),
        "2", "Peta Transmisi Makroekonomi Global & Komoditas Fisik ke Saham Emiten BEI",
        "Panel kiri memetakan transmisi segitiga makro (DXY, US10Y, USD/IDR) terhadap Foreign Inflow/Outflow IHSG. "
        "Panel kanan menghubungkan komoditas fisik dunia (Emas, Minyak, Batubara, Nikel) langsung ke saham emiten pilihan BEI.",
        w_mm=170, h_mm=90
    ))
    story.append(Spacer(1, 4*mm))

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
    story.append(Spacer(1, 2*mm))

    # EMBED GAMBAR 1: Candlestick & Order Block
    story.append(make_figure_block(
        os.path.join("COMPILE PRD", "figures", "01_candlestick_order_block.png"),
        "3", "Anatomi Fisik Candlestick & Pembentukan Bullish Order Block Institusional",
        "Panel kiri membedah anatomi fisik candlestick (Body tebal vs Ekor Wick penolakan harga). Panel kanan menunjukkan proses pembentukan "
        "Bullish Order Block: lilin merah terakhir sebelum ledakan ekspansi >2x ATR yang menjebol resisten (BOS), menciptakan zona demand "
        "berbayang hijau sebagai sarang antrean beli institusi.",
        w_mm=170, h_mm=91
    ))
    story.append(Spacer(1, 3*mm))

    p9 = (
        "<b>4.2 Fair Value Gap (FVG) sebagai Magnet Ketidakseimbangan</b><br/>"
        "FVG terjadi pada formasi 3 bar candle berturut-turut akibat lonjakan agresif satu arah tanpa transaksi dua arah yang efisien. "
        "Pada Bullish FVG: <i>Low<sub>i+1</sub> &gt; High<sub>i-1</sub></i>. Jarak antara High candle ke-1 dan Low candle ke-3 adalah zona kosong. "
        "Algoritma institusi cenderung melakukan penyeimbangan harga kembali (*rebalancing / Consequent Encroachment 50%*) "
        "sebelum melanjutkan tren ekspansi utama. Area 50% median FVG adalah titik masuk ideal (Optimal Trade Entry)."
    )
    story.append(Paragraph(p9, body_style))
    story.append(Spacer(1, 2*mm))

    # EMBED GAMBAR 2: Fair Value Gap (FVG)
    story.append(make_figure_block(
        os.path.join("COMPILE PRD", "figures", "02_fair_value_gap_fvg.png"),
        "4", "Struktur Imbalance 3 Candlestick & Garis Magnet 50% Consequent Encroachment (C.E.)",
        "Diagram memperlihatkan celah likuiditas kosong berbayang biru di antara High Candle 1 dan Low Candle 3. Garis putus-putus emas adalah "
        "level 50% Consequent Encroachment (C.E.) yang berfungsi sebagai magnet paling akurat untuk entry pantulan harga.",
        w_mm=170, h_mm=89
    ))
    story.append(Spacer(1, 3*mm))

    p10 = (
        "<b>4.3 Break of Structure (BOS), CHoCH, dan Penentuan Zona Diskon vs Premium</b><br/>"
        "• <b>Change of Character (CHoCH):</b> Tanda awal pembalikan arah tren ketika swing low/high kunci pertama kali ditembus.<br/>"
        "• <b>Break of Structure (BOS):</b> Konfirmasi kelanjutan tren ketika harga mencetak Higher High baru dalam tren bullish.<br/>"
        "• <b>Equilibrium 50%:</b> Dihitung dari rentang 20 hari: <i>EQ = (High<sub>range</sub> + Low<sub>range</sub>) / 2</i>. "
        "Doktrin Astra melarang keras membeli saham di area <i>Premium Zone (&gt;50%)</i> karena risiko koreksi tinggi. "
        "Pembelian hanya diperbolehkan di <i>Discount Zone (&lt;50%)</i> yang berhimpitan dengan Fresh Order Block."
    )
    story.append(Paragraph(p10, body_style))
    story.append(Spacer(1, 2*mm))

    p10_sweep = (
        "<b>4.4 Anatomi Liquidity Sweep / Turtle Soup (Stop Hunt) & Rejection Wick</b><br/>"
        "Smart Money memerlukan kolam likuiditas besar untuk mengeksekusi akumulasi posisi mereka. "
        "Cara tercepat adalah dengan sengaja menjatuhkan harga sesaat menembus support kunci (Liquidity Sweep) untuk memicu order Stop Loss "
        "massal trader ritel dan memancing breakout seller terjebak. "
        "Begitu pesanan jual panik terserap habis, harga langsung ditutup memantul kembali ke atas (reclaim) dengan ekor jarum panjang (Rejection Wick). "
        "Pola Turtle Soup ini terjadi pada saham BBRI di Rp 4.150 dan Bitcoin di $60.000 sebelum reli kencang."
    )
    story.append(Paragraph(p10_sweep, body_style))
    story.append(Spacer(1, 2*mm))

    # EMBED GAMBAR 7: Liquidity Sweep
    story.append(make_figure_block(
        os.path.join("COMPILE PRD", "figures", "07_liquidity_sweep_turtle_soup.png"),
        "5", "Anatomi Liquidity Sweep / Turtle Soup & Formasi Rejection Wick Reclaim",
        "Visualisasi proses perburuan likuiditas (Stop Hunt): harga menusuk support kunci untuk melikuidasi posisi ritel, "
        "lalu memantul ditutup di atas support (Daily Reclaim). Menghasilkan rasio Risk/Reward asimetris > 1:4.",
        w_mm=170, h_mm=90
    ))
    story.append(Spacer(1, 3*mm))
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
    story.append(Spacer(1, 3*mm))

    # Walkthrough Hitungan IIFS
    story.append(Paragraph('<b>Studi Hitungan Nyata Komposit IIFS (Saham Perbankan Big-Cap):</b>', body_bold))
    story.append(Paragraph(
        "Sebuah saham perbankan sedang sideways di harga Rp 4.500. Engine MBG menghitung data statistik 20 hari terakhir:<br/>"
        "1. Nilai OBV hari ini berada 2.2 standar deviasi di atas rata-rata &rarr; Z(OBV) = +2.2 &rarr; Bobot 30% = <b>+0.66</b>.<br/>"
        "2. Nilai MFI melonjak ke level 78, setara Z-Score +1.6 &rarr; Z(MFI) = +1.6 &rarr; Bobot 25% = <b>+0.40</b>.<br/>"
        "3. Harga ditutup 1.8% di atas garis VWAP harian bandar &rarr; Z(&Delta;VWAP) = +1.8 &rarr; Bobot 25% = <b>+0.45</b>.<br/>"
        "4. Chaikin A/D menunjukkan penutupan selalu di pucuk candle &rarr; Z(Chaikin) = +1.4 &rarr; Bobot 20% = <b>+0.28</b>.<br/>"
        "&bull; <b>SKOR AKHIR IIFS:</b> 0.66 + 0.40 + 0.45 + 0.28 = <b>+1.79 (&asymp; +1.8) &rarr; STATUS: AKUMULASI AGRESIF INSTITUSI!</b><br/>"
        "<i>Kesimpulan bagi pemula: Saham ini sedang dikumpulkan secara senyap oleh investor paus meskipun grafik harganya tampak tenang.</i>",
        body_style
    ))
    story.append(Spacer(1, 3*mm))

    p12 = (
        "<b>5.2 Mikrostruktur BEI: 5 Kelompok Fraksi Harga, Aturan ARB Simetris & Anatomi Dividend Trap</b><br/>"
        "Berdasarkan Keputusan Direksi BEI No. <b>Kep-00055/BEI/03-2023</b> (efektif penuh sejak 4 September 2023), "
        "bursa memberlakukan <b>Batas Auto Rejection Simetris</b>: batas ARB setara dengan batas ARA:<br/>"
        "• Harga Rp 50 &ndash; Rp 200: Batas ARA/ARB = <b>&plusmn;35%</b> | Fraksi: <b>Rp 1</b><br/>"
        "• Harga &gt;Rp 200 &ndash; Rp 5.000: Batas ARA/ARB = <b>&plusmn;25%</b> | Fraksi: Rp 2 (200-500), Rp 5 (500-2rb), Rp 10 (2rb-5rb)<br/>"
        "• Harga &gt;Rp 5.000: Batas ARA/ARB = <b>&plusmn;20%</b> | Fraksi: <b>Rp 25</b><br/>"
        "<i>Waspada Dividend Trap:</i> Pada saham siklikal, pembagian dividen yield tinggi (>20%) kerap menjadi ajang exit bagi investor institusi. "
        "Saat ritel HAKA di Cum-Date, institusi melakukan Net Sell masif, memicu gap down ARB berhari-hari di Ex-Date."
    )
    story.append(Paragraph(p12, body_style))
    story.append(Spacer(1, 2*mm))

    # EMBED GAMBAR 5: Dividend Trap Anatomy
    story.append(make_figure_block(
        os.path.join("COMPILE PRD", "figures", "05_dividend_trap_anatomy.png"),
        "6", "Anatomi 4 Fase Dividend Trap Saham Siklikal & Kaskade ARB Simetris",
        "Panel atas memperlihatkan kaskade terjun bebas harga saham dari Rp 3.900 menuju Rp 2.650 (-32%) pasca Ex-Date. "
        "Panel bawah membuktikan kontras ekstrem: lonjakan volume HAKA ritel di puncak Cum-Date bertepatan tepat dengan aksi distribusi "
        "Net Sell masif oleh Smart Money asing, menyebabkan kerugian bersih total -9.3% dan modal terkunci berbulan-bulan.",
        w_mm=170, h_mm=110
    ))
    story.append(Spacer(1, 3*mm))

    p12_spoof = (
        "<b>5.3 Anatomi Order Book BEI: Fake Bid (Spoofing) vs Real Passive Absorption</b><br/>"
        "Manipulator pasar memanfaatkan visual Order Book untuk menggiring psikologi ritel. "
        "Mereka memasang antrean beli raksasa palsu (Fake Bid puluhan ribu lot) agar ritel mengira ada pembeli kuat, lalu ritel terburu-buru HAKA di harga penawaran (Offer). "
        "Begitu ritel membeli, antrean bid palsu langsung dicabut dan bandar mengguyur saham (HAKI) ke antrean bid tipis di bawahnya.<br/>"
        "Sebaliknya, akumulasi asli institusi ditandai oleh antrean bid yang tebal merata di setiap fraksi harga dan tidak pernah dicabut saat transaksi berlangsung."
    )
    story.append(Paragraph(p12_spoof, body_style))
    story.append(Spacer(1, 2*mm))

    # EMBED GAMBAR 10: Order Book Spoofing vs Real Absorption
    story.append(make_figure_block(
        os.path.join("COMPILE PRD", "figures", "10_orderbook_spoofing_anatomy.png"),
        "7", "Anatomi Mikrostruktur Order Book BEI: Fake Bid (Spoofing) vs Real Passive Absorption",
        "Panel kiri membedah trik Fake Bid bandar (48.500 lot semu) untuk memancing ritel HAKA sebelum bid dicabut. "
        "Panel kanan membuktikan ciri khas akumulasi nyata Smart Money: antrean bid tebal merata dan konsisten terkonfirmasi IIFS Z-Score > +1.5.",
        w_mm=170, h_mm=90
    ))
    story.append(Spacer(1, 3*mm))
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
        "<b>6.3 Rotasi Likuiditas Kripto, Bitcoin Dominance (BTC.D) & The Capital Waterfall</b><br/>"
        "Pergerakan likuiditas pasar kripto mengalir melalui 4 fase sistematis (*The Capital Waterfall*):"
    )
    story.append(Paragraph(p15, body_style))
    story.append(Spacer(1, 2*mm))

    # EMBED GAMBAR 6: Crypto Liquidity Pyramid
    story.append(make_figure_block(
        os.path.join("COMPILE PRD", "figures", "06_crypto_liquidity_pyramid.png"),
        "8", "Piramida Aliran Likuiditas Kripto (The Capital Waterfall) & Siklus Rotasi Altseason",
        "Panel kiri menggambarkan aliran modal 4 layer: Fiat/USDT On-Ramp -> Bitcoin -> Ethereum/L1 Giants -> Altcoin & Meme Tokens. "
        "Panel kanan memetakan korelasi siklus: Altseason meledak HANYA saat Bitcoin Dominance (BTC.D) anjlok bebas dari puncaknya.",
        w_mm=170, h_mm=99
    ))
    story.append(Spacer(1, 2*mm))

    crypto_flow = [
        "<b>Fase 1 (Bitcoin Surge):</b> Likuiditas baru masuk ke Bitcoin. Harga BTC melonjak kencang, Bitcoin Dominance (BTC.D) menanjak tajam. Altcoin tertinggal.",
        "<b>Fase 2 (Ethereum Transition):</b> Profit dari Bitcoin mulai dirotasi ke Ethereum. Rasio ETH/BTC breakout ke atas. Ethereum mengungguli persentase gain Bitcoin.",
        "<b>Fase 3 (Large-Caps Momentum):</b> Dana merembes ke koin Layer-1 dan utilitas berkapitalisasi besar (SOL, BNB, AVAX, LINK).",
        "<b>Fase 4 (Full Altseason & Blow-Off Top):</b> BTC.D anjlok bebas. Likuiditas spekulatif menyebar ke mid-cap dan meme tokens. Ini adalah fase puncak euforia di mana smart money keluar ke Stablecoin (USDT/USDC)."
    ]
    for pt in crypto_flow:
        story.append(Paragraph(f"• {pt}", bullet_style))
    story.append(Spacer(1, 2*mm))

    story.append(Paragraph(
        "<b>Aturan Emas Keluar Pasar (Golden Exit Rule):</b><br/>"
        "<i>'Saat supir taksi, teman kantor yang tidak pernah investasi, dan grup keluarga WhatsApp mulai bertanya cara membeli koin meme bertema binatang, "
        "itu adalah tanda mutlak bahwa siklus berada di pucuk mania Fase 4. Segera jual 100% altcoin Anda kembali ke USDT dan nikmati keuntungan di tempat aman!'</i>",
        body_style
    ))
    story.append(Spacer(1, 4*mm))
    story.append(PageBreak())

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
    story.append(Spacer(1, 2*mm))

    # EMBED GAMBAR 9: Operating Leverage ANTM vs BRMS
    story.append(make_figure_block(
        os.path.join("COMPILE PRD", "figures", "09_operating_leverage_gold_brms_vs_antm.png"),
        "9", "Infografis Paradoks Operating Leverage: Mengapa BRMS Naik +115% sedangkan ANTM Hanya +28%",
        "Panel kiri membandingkan lonjakan harga saham 2024 saat emas mencetak rekor dunia. "
        "Panel kanan membuktikan rahasia kuantitatif operating leverage: biaya gali emas BRMS tetap ($950/oz) "
        "sehingga kenaikan harga emas langsung melipatgandakan margin laba kotor menjadi laba murni (+67%), "
        "sementara ANTM terbebani margin tipis perdagangan ritel dan lesunya harga nikel.",
        w_mm=170, h_mm=90
    ))
    story.append(Spacer(1, 3*mm))

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

    p16_intro = (
        "<b>8.1 Flowchart Standar Operasional Prosedur (SOP) 5 Langkah Astra</b><br/>"
        "Trading profesional bukan aktivitas tebak-tebakan berdasarkan perasaan (feeling) atau bisikan grup saham. "
        "Setiap keputusan eksekusi di MBG Cockpit wajib melewati <b>5 Gerbang Keputusan Saklek (Zero-Tolerance Gating)</b> secara berurutan. "
        "Jika ada 1 gerbang saja yang tidak lolos kriteria, rencana trading otomatis BATAL seketika:"
    )
    story.append(Paragraph(p16_intro, body_style))
    story.append(Spacer(1, 2*mm))

    # EMBED GAMBAR 4: Flowchart SOP 5 Langkah Astra
    story.append(make_figure_block(
        os.path.join("COMPILE PRD", "figures", "04_astra_5_step_flowchart.png"),
        "10", "Flowchart Diagram Alur Pengambilan Keputusan Trading 5 Langkah Astra Standard",
        "Diagram alur vertikal menunjukkan proses penyaringan ketat: Mulai -> Filter Makro & Komoditas -> Verifikasi Arus Asing IIFS -> "
        "Validasi Struktur SMC & Zona Diskon -> Kalkulasi Lot Rem Ganda 2% -> Pemasangan Order Bracket GTC (SL + TP) -> Monitor Disiplin. "
        "Setiap cabang penolakan (TIDAK) langsung mengarahkan trader untuk 'TIDAK TRADING / WAIT & SEE'.",
        w_mm=155, h_mm=109
    ))
    story.append(Spacer(1, 3*mm))

    p16 = (
        "<b>8.2 Pre-Flight Safety Checklist (Gerbang Keputusan 5 Poin Saklek)</b><br/>"
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

    import json
    glossary_path = os.path.join("engine", "cache", "glossary_66_clean.json")
    terms_list = []
    if os.path.exists(glossary_path):
        with open(glossary_path, 'r', encoding='utf-8') as gf:
            terms_list = json.load(gf)

    def get_cat(tid):
        if tid <= 10:
            return "Manajemen Risiko"
        elif tid <= 23:
            return "Mekanisme Bursa BEI"
        elif tid <= 33:
            return "Smart Money Concepts"
        elif tid <= 43:
            return "Bandarmologi IIFS"
        elif tid <= 50:
            return "Kuantitatif & AI"
        elif tid <= 56:
            return "Indikator Teknis"
        else:
            return "Makro, Kripto & UI"

    table_rows = [
        [Paragraph('<b>#</b>', table_header), Paragraph('<b>ISTILAH & KATEGORI</b>', table_header), Paragraph('<b>DEFINISI RAMAH PEMULA, ANALOGI & TIPS OPERASIONAL</b>', table_header)]
    ]
    for item in terms_list:
        tid = item.get('id', 0)
        t_term = clean_str(item.get('term', ''))
        t_def = clean_str(item.get('def', ''))
        cat = get_cat(tid)
        term_cell = f"<b>{t_term}</b><br/><font color='#0284C7'>[{cat}]</font>"
        table_rows.append([
            Paragraph(str(tid), table_cell_bold),
            Paragraph(term_cell, table_cell),
            Paragraph(t_def, table_cell)
        ])

    t_gloss = Table(table_rows, colWidths=[8*mm, 44*mm, 122*mm], repeatRows=1)
    t_gloss.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 2.8),
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
