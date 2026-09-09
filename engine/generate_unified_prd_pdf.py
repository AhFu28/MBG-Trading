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
            return  # Skip cover

        self.saveState()
        self.setFont('Helvetica-Bold', 7)
        self.setFillColor(colors.HexColor('#64748B'))
        
        # Header
        self.drawString(18*mm, 282*mm, 'MBG-ARIB QUANTUM COCKPIT // MASTER UNIFIED PRD (LAYMAN & PRO)')
        self.setFont('Helvetica', 7)
        self.drawRightString(192*mm, 282*mm, 'UNIFIED SPECIFICATION V1.0')
        self.setStrokeColor(colors.HexColor('#CBD5E1'))
        self.setLineWidth(0.5)
        self.line(18*mm, 280*mm, 192*mm, 280*mm)

        # Footer
        self.line(18*mm, 15*mm, 192*mm, 15*mm)
        self.setFont('Helvetica', 7)
        self.drawString(18*mm, 11*mm, 'CONFIDENTIAL & PROPRIETARY - FOR STAKEHOLDERS, TRADERS & ENGINEERS')
        self.drawRightString(192*mm, 11*mm, f'Page {self._pageNumber} of {page_count}')
        self.restoreState()

def build_pdf():
    target_dir = 'COMPILE PRD'
    os.makedirs(target_dir, exist_ok=True)
    target_pdf = os.path.join(target_dir, 'PRD_MBG_ARIB_Unified_Master_v1.0.pdf')
    
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
        leading=28,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=3
    )
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor('#059669'),
        spaceAfter=10
    )
    meta_label = ParagraphStyle('MetaLabel', fontName='Helvetica-Bold', fontSize=7.5, leading=10, textColor=colors.HexColor('#475569'))
    meta_val = ParagraphStyle('MetaVal', fontName='Helvetica', fontSize=7.5, leading=10, textColor=colors.HexColor('#0F172A'))

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12.5,
        leading=16,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=11,
        spaceAfter=4,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13.5,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=11.2,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=3.5
    )
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=11.2,
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
        leading=9.2,
        textColor=colors.HexColor('#1E293B')
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.8,
        leading=9.2,
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
        leading=10.5,
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
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        return t

    # ----------------- COVER / HEADER PAGE -----------------
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph('MBG-ARIB QUANTUM COCKPIT', title_style))
    story.append(Paragraph('Unified Institutional Trading &amp; Macro Intelligence Terminal', subtitle_style))
    story.append(Paragraph('Penggabungan Komprehensif: Project ARIB + MBG Trading Cockpit v1 + MBG B Plan + Cloudflare Edge', body_style))
    story.append(Spacer(1, 2*mm))
    story.append(HRFlowable(width='100%', thickness=2, color=colors.HexColor('#059669'), spaceAfter=8))

    meta_data = [
        [Paragraph('Document Identifier', meta_label), Paragraph('MBG-ARIB-PRD-UNIFIED-V1.0-LAYMAN-PRO', meta_val),
         Paragraph('Effective Date', meta_label), Paragraph('2026-09-09', meta_val)],
        [Paragraph('Document Scope', meta_label), Paragraph('End-to-End Layman &amp; Technical Master PRD', meta_val),
         Paragraph('Document Status', meta_label), Paragraph('APPROVED FOR SPRINT EXECUTION', meta_val)],
        [Paragraph('Unified Tech Stack', meta_label), Paragraph('Next.js 16 (ARIB UI) + Python Brain (MBG) + Cloudflare Edge', meta_val),
         Paragraph('Operating Budget', meta_label), Paragraph('RP 0 / BULAN (Zero Server Cost Architecture)', meta_val)],
        [Paragraph('Core Innovations', meta_label), Paragraph('Layman Bahasa Bayi + SMC &amp; Bandarmologi + TimesFM AI', meta_val),
         Paragraph('Target Audience', meta_label), Paragraph('Trader Awam, Investor, Quant Analyst, IT Developers', meta_val)],
    ]
    t_meta = Table(meta_data, colWidths=[36*mm, 54*mm, 34*mm, 50*mm])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 4*mm))

    story.append(make_callout('<b>RINGKASAN EKSEKUTIF (UNTUK ORANG AWAM):</b> Dokumen ini adalah cetak biru resmi penggabungan 3 sistem besar: Terminal Visual <b>Project ARIB</b>, Otak Analisis Konglomerat &amp; Telegram <b>MBG v1</b>, serta Algoritma Cerdas <b>MBG B Plan</b> (Smart Money, AI TimesFM, &amp; Bandarmologi) di atas infrastruktur super cepat <b>Cloudflare</b>. Hasilnya adalah satu terminal trading all-in-one yang sangat canggih sekelas hedge fund, namun dirancang dengan bahasa yang sangat sederhana ("Bahasa Bayi") sehingga orang awam dapat langsung memanfaatkannya untuk trading tanpa takut boncos.'))
    story.append(Spacer(1, 3*mm))

    # SECTION 1
    story.append(Paragraph('1. Visi Produk &amp; Mengapa Sistem Ini Dibuat (Panduan Awam)', h1_style))
    story.append(Paragraph('1.1 Masalah Nyata yang Dialami Trader Sehari-hari', h2_style))
    story.append(Paragraph('Sebanyak 90% trader pemula dan investor retail mengalami kerugian di pasar saham maupun kripto karena 3 kendala klasik:', body_style))
    story.append(Paragraph('&bull; <b>Terlalu Banyak Tab &amp; Berita Membingungkan:</b> Trader harus membuka puluhan website terpisah (kalender, chart, berita, grup sosmed) yang seringkali memberikan informasi saling bertentangan.', bullet_style))
    story.append(Paragraph('&bull; <b>Macro Literacy Gap:</b> Berita ekonomi dunia disajikan dalam bahasa teknis yang rumit. Orang awam tidak paham apa dampaknya data inflasi Amerika terhadap saham BBCA atau Bitcoin.', bullet_style))
    story.append(Paragraph('&bull; <b>Trading Pakai Emosi &amp; Salah Ukuran Lot:</b> Masuk ke pasar karena ikut-ikutan (FOMO), tidak memasang pembatas rugi (Stop Loss), dan membeli terlalu banyak lot sehingga saldo tabungan cepat terkuras saat pasar koreksi.', bullet_style))

    story.append(Paragraph('1.2 Solusi MBG-ARIB: Kokpit Pintar Anti-Boncos', h2_style))
    story.append(Paragraph('Sistem ini bertindak seperti <b>Asisten Keuangan Pribadi yang Disiplin</b>:', body_style))
    story.append(Paragraph('&bull; <b>Menerjemahkan Berita ke Bahasa Sehari-hari:</b> Mengubah angka ekonomi rumit menjadi rekomendasi konkret berformat bahasa santai ("Bahasa Bayi").', bullet_style))
    story.append(Paragraph('&bull; <b>Mendeteksi Jejak Uang Investor Kakap (Bandarmologi):</b> Memberi tahu Anda apakah saham yang sedang naik benar-benar diborong asing atau hanya jebakan buang barang.', bullet_style))
    story.append(Paragraph('&bull; <b>Kalkulator Lot Anti-Boncos Transparan:</b> Menghitung secara eksak berapa lembar/lot yang boleh Anda beli agar dompet Anda terlindungi dari kerugian fatal.', bullet_style))
    story.append(Paragraph('&bull; <b>Notifikasi Telegram Pagi Jam 07:15 WIB:</b> Mengirimkan 5 saham pilihan terbaik hari itu langsung ke handphone Anda sebelum bursa buka.', bullet_style))

    story.append(PageBreak())

    # SECTION 2
    story.append(Paragraph('2. Notulensi Kesepakatan Diskusi 3 Pilar Tim (IT, Trader, Desain)', h1_style))
    story.append(Paragraph('Telah dilakukan sinkronisasi mendalam antara 3 divisi kunci untuk memastikan sistem ini seimbang antara kecanggihan teknologi, keamanan risiko uang, dan kemudahan pemakaian:', body_style))

    teams_data = [
        [Paragraph('Divisi Tim', table_header), Paragraph('Kekhawatiran Utama', table_header), Paragraph('Solusi &amp; Kesepakatan Final yang Diterapkan', table_header)],
        [
            Paragraph('<b>Tim IT &amp; Infra</b><br/>(System Architect)', table_cell),
            Paragraph('Stack terpecah (Python, Vite React, Next.js 16). Risiko server jebol dan biaya cloud bengkak jika dibuka banyak user.', table_cell),
            Paragraph('&bull; Gunakan <b>Next.js 16 ARIB</b> sebagai frontend tunggal.<br/>&bull; Pindahkan hosting ke <b>Cloudflare Pages + Workers KV</b>.<br/>&bull; Hasil: Latensi Jakarta &lt;25ms &amp; <b>Biaya Server Rp 0 (Free Tier)</b>.', table_cell)
        ],
        [
            Paragraph('<b>Tim Trader</b><br/>(Quant &amp; Risk Head)', table_cell),
            Paragraph('UI visual jangan hanya jadi pajangan data. Trader butuh aksi riil, disiplin lot, dan anti-halusinasi AI.', table_cell),
            Paragraph('&bull; Wajib <b>Doktrin 5 Langkah Astra</b> (Pemisahan Fakta vs Opini).<br/>&bull; Tampilkan <b>Kalkulator Lot Sizing</b> di setiap kartu tiket.<br/>&bull; Status akhir wajib tertahan pada <b>AWAITING_HUMAN_REVIEW</b>.', table_cell)
        ],
        [
            Paragraph('<b>Tim Desain</b><br/>(UX / Layman Lead)', table_cell),
            Paragraph('Istilah quant (Pearson, FVG, TimesFM, Z-score) bikin orang awam pusing dan takut memakai web.', table_cell),
            Paragraph('&bull; Sistem <b>Warna Lampu Lalu Lintas</b> (Hijau, Kuning, Merah).<br/>&bull; <b>Progressive Disclosure:</b> Awam lihat kartu simpel; jika diklik baru muncul detail quant.<br/>&bull; Seluruh istilah teknis diberi ikon tanda tanya (?) berpenjelasan analogi.', table_cell)
        ]
    ]
    t_team = Table(teams_data, colWidths=[32*mm, 52*mm, 90*mm])
    t_team.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_team)
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph('3. Cara Kerja Sistem End-to-End (Analogi Radar Cuaca)', h1_style))
    story.append(Paragraph('Cara kerja sistem gabungan ini dapat dianalogikan seperti <b>Stasiun Pengawas Cuaca &amp; Radar Bandara</b>:', body_style))
    story.append(Paragraph('<b>1. Sensor Aktif 24/7 (Data Ingestion):</b> Sensor mengumpulkan live price dari New York, London, Tokyo, dan Jakarta (Emas, Minyak, Yield Obligasi, Kurs Forex, Kripto, Saham) secara gratis via Frankfurter dan Yahoo Finance v8.', bullet_style))
    story.append(Paragraph('<b>2. Otak Quant Menyaring Sinyal (07:00 WIB):</b> Algoritma Python MBG memindai seluruh emiten BEI. Memilah saham konglomerat (Barito, Salim, Astra, dll.), memeriksa arus uang asing (Bandarmologi), dan mendeteksi level harga diskon (SMC Order Block).', bullet_style))
    story.append(Paragraph('<b>3. AI Menghitung Rentang Probabilitas (TimesFM):</b> Kecerdasan buatan Google TimesFM 2.5 memproyeksikan rentang harga 5 hari ke depan dengan tingkat keyakinan 80% (tidak pernah menjanjikan kepastian 100% demi mencegah kebohongan/halusinasi).', bullet_style))
    story.append(Paragraph('<b>4. Translasi ke Bahasa Bayi:</b> Sistem menyusun tiket rencana trading yang menjelaskan alasan masuk posisi dalam bahasa santai dan menghitungkan jumlah lot modal Anda.', bullet_style))
    story.append(Paragraph('<b>5. Pengiriman Laporan Cepat:</b> Jam 07:15 WIB, handphone Anda menerima briefing Telegram. Anda membuka website di browser laptop/HP untuk melihat chart interaktif yang dimuat kilat lewat server Cloudflare Jakarta.', bullet_style))

    story.append(PageBreak())

    # SECTION 4
    story.append(Paragraph('4. Spesifikasi 10 Modul Fitur Unggulan (Detail Layar &amp; Fungsi Awam)', h1_style))
    story.append(Paragraph('Berikut adalah 10 modul utama yang akan dilihat dan digunakan oleh pengguna pada antarmuka web:', body_style))

    modules_data = [
        [Paragraph('No &amp; Nama Modul', table_header), Paragraph('Tampilan di Layar Web', table_header), Paragraph('Apa yang Dilakukan &amp; Manfaat Bagi Orang Awam', table_header)],
        [
            Paragraph('<b>M01: Radar Makro &amp;<br/>Penerjemah Berita</b>', table_cell_bold),
            Paragraph('Banner peringatan di pucuk atas web dengan warna Hijau/Kuning/Merah.', table_cell),
            Paragraph('Memantau 28 peristiwa dunia (The Fed, Inflasi, Perang, Minyak). Menerjemahkan angka rumit jadi bahasa santai. Awam langsung tahu efeknya ke IHSG, Emas, Dolar, atau Kripto.', table_cell)
        ],
        [
            Paragraph('<b>M02: Kalender Ekonomi<br/>Deep-Dive Accordion</b>', table_cell_bold),
            Paragraph('Tabel jadwal rilis berita ekonomi dunia dengan bendera negara.', table_cell),
            Paragraph('Baris berita dapat diklik untuk membuka penjelasan 6 seksi di tempat: Apa ini?, Kenapa penting?, Dampak ke aset apa?, dan Tips tindakan bagi trader pemula.', table_cell)
        ],
        [
            Paragraph('<b>M03: Detektor Smart<br/>Money &amp; Bandar BEI</b>', table_cell_bold),
            Paragraph('Tab saham konglomerasi (Barito, Salim, Astra) + meteran arus asing.', table_cell),
            Paragraph('Mendeteksi apakah saham naik karena diborong investor kakap/asing atau hanya jebakan retail. Menemukan area diskon institusi (Order Block &amp; Fair Value Gap).', table_cell)
        ],
        [
            Paragraph('<b>M04: Ramalan Cuaca AI<br/>(Google TimesFM 2.5)</b>', table_cell_bold),
            Paragraph('Pita bayangan berwarna transparan di depan grafik harga terakhir.', table_cell),
            Paragraph('Menampilkan rentang kemungkinan harga 5 hari ke depan dengan probabilitas 80%. Memberikan gambaran realistis batas atas dan batas bawah pergerakan harga.', table_cell)
        ],
        [
            Paragraph('<b>M05: Kartu Trading Astra<br/>(Kalkulator Anti-Boncos)</b>', table_cell_bold),
            Paragraph('Kartu tiket trading 1 halaman berisi area Beli, Stop Loss, &amp; Target Untung.', table_cell),
            Paragraph('Pengguna mengetik modal (misal Rp 10 juta) dan toleransi risiko rugi (misal Rp 200 ribu). Sistem otomatis menghitungkan: Beli TEPAT sekian lot, jangan lebih!', table_cell)
        ],
        [
            Paragraph('<b>M06: Laboratorium Uji<br/>Coba (Paper Trading)</b>', table_cell_bold),
            Paragraph('Dompet simulasi dengan grafik return portofolio dan diagram lingkaran.', table_cell),
            Paragraph('Pengguna bisa menguji sinyal sistem menggunakan uang virtual tanpa risiko kehilangan uang asli. Rekam jejak untung/rugi 30 hari tercatat transparan dan bisa di-download.', table_cell)
        ],
        [
            Paragraph('<b>M07: Liga Strategi<br/>Otonom (Exp3 Bandit)</b>', table_cell_bold),
            Paragraph('Widget leaderboard performa strategi trading (Breakout, Rebound, dll).', table_cell),
            Paragraph('Sistem secara mandiri menilai strategi mana yang sedang sering menang di kondisi pasar saat ini. Strategi yang sedang jelek otomatis diistirahatkan di bangku cadangan.', table_cell)
        ],
        [
            Paragraph('<b>M08: Matriks Korelasi &amp;<br/>Backtest Reaksi Berita</b>', table_cell_bold),
            Paragraph('Matriks sel warna-warni Pearson dan simulator reaksi rilis 2 tahun.', table_cell),
            Paragraph('Melihat apakah Emas dan Saham bergerak searah, serta mensimulasikan riwayat: "Bagaimana pergerakan Bitcoin setiap kali data inflasi Amerika diumumkan 2 tahun terakhir?".', table_cell)
        ],
        [
            Paragraph('<b>M09: Terminal 14 Pasar<br/>&amp; Ticker Tape Dunia</b>', table_cell_bold),
            Paragraph('Pita harga berjalan di atas + 14 tab bursa dunia + konverter 56 valuta.', table_cell),
            Paragraph('Menyajikan harga saham BEI, Wall Street, bursa Asia, yield obligasi US 10Y, forex, dan kripto dalam 1 layar instan lengkap dengan logo resmi perusahaan.', table_cell)
        ],
        [
            Paragraph('<b>M10: Bot Telegram<br/>Asisten Handphone</b>', table_cell_bold),
            Paragraph('Aplikasi Telegram resmi di smartphone pengguna.', table_cell),
            Paragraph('Briefing pagi jam 07:15 WIB berisi Top 5 Saham hari ini, serta pesan darurat kilat jika terjadi lonjakan harga emas/minyak dunia di luar jam kerja.', table_cell)
        ],
    ]
    t_mod = Table(modules_data, colWidths=[36*mm, 48*mm, 90*mm])
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

    # SECTION 5
    story.append(Paragraph('5. Evaluasi Komparasi: Mengapa Cloudflare Jauh Lebih Unggul?', h1_style))
    story.append(Paragraph('Infrastruktur lama MBG menggunakan Vercel. Berdasarkan audit tim IT, beralih ke <b>Cloudflare Pages + Workers KV</b> memberikan keunggulan mutlak tanpa biaya tambahan:', body_style))

    cf_data = [
        [Paragraph('Parameter Evaluasi', table_header), Paragraph('Hosting Standar (Vercel)', table_header), Paragraph('Cloudflare Pages + Workers KV (Pilihan)', table_header), Paragraph('Dampak Langsung ke Pengguna', table_header)],
        [
            Paragraph('<b>Lokasi Server &amp; Latensi</b>', table_cell_bold),
            Paragraph('Server Singapura / US (~80-150ms).', table_cell),
            Paragraph('<b>Point of Presence Lokal di Jakarta (&lt;25ms).</b>', table_cell),
            Paragraph('Web terbuka seketika, chart dan tabel harga muncul tanpa jeda loading.', table_cell)
        ],
        [
            Paragraph('<b>Batas Kuota Bandwidth</b>', table_cell_bold),
            Paragraph('Dibatasi 100 GB/bulan (risiko overage fee).', table_cell),
            Paragraph('<b>GRATIS TANPA BATAS (Unlimited Bandwidth).</b>', table_cell),
            Paragraph('Bebas dibuka oleh ribuan pengunjung tanpa rasa was-was tagihan bengkak.', table_cell)
        ],
        [
            Paragraph('<b>Proteksi Keamanan Bot</b>', table_cell_bold),
            Paragraph('Captcha gambar standar (mengganggu).', table_cell),
            Paragraph('<b>Cloudflare Turnstile &amp; Enterprise WAF.</b>', table_cell),
            Paragraph('Dashboard terlindungi dari hacker dan bot tanpa membuat user kesal mengetik captcha.', table_cell)
        ],
        [
            Paragraph('<b>Penyimpanan Cache Harga</b>', table_cell_bold),
            Paragraph('Server memory lokal terbatas.', table_cell),
            Paragraph('<b>Workers KV Global Distributed Edge Cache.</b>', table_cell),
            Paragraph('Data kurs dan harga tersimpan di ribuan edge server, bebas risiko blokir Yahoo.', table_cell)
        ],
        [
            Paragraph('<b>Biaya Operasional Server</b>', table_cell_bold),
            Paragraph('Berpotensi $20 s/d $100 / bulan.', table_cell),
            Paragraph('<b>RP 0 / BULAN (100% Free Tier Compliant).</b>', table_cell),
            Paragraph('Nol biaya langganan bulanan selamanya bagi organisasi Anda.', table_cell)
        ],
    ]
    t_cf = Table(cf_data, colWidths=[34*mm, 44*mm, 48*mm, 48*mm])
    t_cf.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_cf)
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph('6. Rincian Kebutuhan Resource &amp; Anggaran Biaya (Budget Rp 0)', h1_style))
    story.append(Paragraph('Berikut adalah pembuktian arsitektur bahwa sistem ini dapat berjalan 100% tanpa biaya sewa server bulanan:', body_style))

    budget_data = [
        [Paragraph('Komponen Sistem', table_header), Paragraph('Penyedia Layanan', table_header), Paragraph('Spesifikasi &amp; Kapasitas Free Tier', table_header), Paragraph('Biaya Bulanan', table_header)],
        [Paragraph('Web Frontend &amp; CDN', table_cell_bold), Paragraph('Cloudflare Pages', table_cell), Paragraph('Unlimited Bandwidth, 500 build/bln, SSL Otomatis', table_cell), Paragraph('<b>Rp 0</b>', table_cell)],
        [Paragraph('Edge Cache Data API', table_cell_bold), Paragraph('Cloudflare Workers KV', table_cell), Paragraph('100.000 read/hari, 1.000 write/hari (Sangat cukup)', table_cell), Paragraph('<b>Rp 0</b>', table_cell)],
        [Paragraph('Anti-Bot Gatekeeper', table_cell_bold), Paragraph('Cloudflare Turnstile', table_cell), Paragraph('Proteksi akses dashboard tanpa batas request', table_cell), Paragraph('<b>Rp 0</b>', table_cell)],
        [Paragraph('Heavy Quant AI Engine', table_cell_bold), Paragraph('GitHub Actions (Ubuntu)', table_cell), Paragraph('2.000 menit cron/bln (Penggunaan rutin hanya ~300 mnt)', table_cell), Paragraph('<b>Rp 0</b>', table_cell)],
        [Paragraph('Database Riwayat 30 Hari', table_cell_bold), Paragraph('Supabase PostgreSQL', table_cell), Paragraph('500 MB database, auto-purge 30 hari, pooling connection', table_cell), Paragraph('<b>Rp 0</b>', table_cell)],
        [Paragraph('Notifikasi Smartphone', table_cell_bold), Paragraph('Telegram Bot API', table_cell), Paragraph('Unlimited push message ke channel/grup/pribadi', table_cell), Paragraph('<b>Rp 0</b>', table_cell)],
        [Paragraph('Data Saham, Forex, Bonds', table_cell_bold), Paragraph('Frankfurter ECB + Yahoo v8', table_cell), Paragraph('Endpoint publik resmi tanpa langganan API berbayar', table_cell), Paragraph('<b>Rp 0</b>', table_cell)],
        [Paragraph('Domain Kustom (Opsional)', table_cell_bold), Paragraph('Cloudflare Registrar', table_cell), Paragraph('Nama domain pribadi (misal: mbg-arib.com) ~Rp 150rb/tahun', table_cell), Paragraph('~Rp 12.500/bln', table_cell)],
        [Paragraph('<b>TOTAL BIAYA OPERASIONAL BULANAN</b>', table_cell_bold), Paragraph('<b>Arsitektur Zero-Cost</b>', table_cell_bold), Paragraph('<b>Sistem Hedge Fund Siap Pakai Tanpa Beban Finansial</b>', table_cell_bold), Paragraph('<b>RP 0 / BULAN</b>', table_cell_bold)],
    ]
    t_bud = Table(budget_data, colWidths=[38*mm, 42*mm, 68*mm, 26*mm])
    t_bud.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-2), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#ECFDF5')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_bud)

    story.append(PageBreak())

    # SECTION 6
    story.append(Paragraph('7. Panduan Standar Operasional (SOP) Harian untuk Trader Awam', h1_style))
    story.append(Paragraph('Bagi pengguna awam, cukup ikuti alur 4 langkah disiplin setiap hari perdagangan bursa:', body_style))

    sop_data = [
        [Paragraph('Waktu (WIB)', table_header), Paragraph('Aktivitas Pengguna', table_header), Paragraph('Instruksi SOP &amp; Tindakan Riil', table_header)],
        [
            Paragraph('<b>07:15 WIB</b><br/>(Pagi Hari)', table_cell_bold),
            Paragraph('Buka Telegram di HP', table_cell),
            Paragraph('Baca ringkasan kondisi pasar dunia semalam dan lihat <b>Top 5 Saham Pilihan</b> hari ini. Anda langsung tahu sektor mana yang sedang diborong asing dan sektor mana yang harus dihindari.', table_cell)
        ],
        [
            Paragraph('<b>08:45 WIB</b><br/>(Sebelum Bursa Buka)', table_cell_bold),
            Paragraph('Buka Web MBG-ARIB di Laptop/HP', table_cell),
            Paragraph('Klik tab <b>Indonesia</b> atau <b>Crypto</b>. Pilih kartu saham berstatus lampu hijau (misal BBRI atau ASII). Periksa ramalan cuaca harga AI TimesFM untuk memastikan tren dalam kondisi sehat.', table_cell)
        ],
        [
            Paragraph('<b>08:50 WIB</b><br/>(Hitung Ukuran Lot)', table_cell_bold),
            Paragraph('Gunakan Kalkulator Lot Astra', table_cell),
            Paragraph('Ketik modal dingin Anda di kalkulator lot. Sistem seketika memberi tahu: <i>"Beli maksimal 15 lot di harga Rp 4.900. Pasang Stop Loss ketat di Rp 4.750."</i> Catat angka tersebut.', table_cell)
        ],
        [
            Paragraph('<b>09:00 WIB</b><br/>(Bursa Dibuka)', table_cell_bold),
            Paragraph('Pasang Order di Sekuritas Anda', table_cell),
            Paragraph('Buka aplikasi sekuritas langganan Anda (Ajaib, Stockbit, Mandiri, dll.). Pasang antrean beli persis sesuai angka tiket. Jika kena target untung, jual bertahap. Jika menyentuh batas rugi, keluar dengan disiplin.', table_cell)
        ]
    ]
    t_sop = Table(sop_data, colWidths=[28*mm, 42*mm, 104*mm])
    t_sop.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_sop)
    story.append(Spacer(1, 3*mm))

    story.append(Paragraph('8. Roadmap Eksekusi &amp; Rencana Peluncuran (Sprint Plan)', h1_style))

    sprint_data = [
        [Paragraph('Tahapan Sprint', table_header), Paragraph('Target Output Fungsional', table_header), Paragraph('Penanggung Jawab', table_header)],
        [
            Paragraph('<b>Sprint 1: Fondasi Stack</b><br/>(Minggu 1)', table_cell_bold),
            Paragraph('&bull; Ekstrak source code Project ARIB ke direktori kerja utama.<br/>&bull; Deploy Next.js 16 ARIB ke <b>Cloudflare Pages</b> dengan domain kustom.<br/>&bull; Aktifkan proteksi <b>Cloudflare Turnstile</b> pada gerbang dashboard.', table_cell),
            Paragraph('Tim IT &amp; Infra', table_cell)
        ],
        [
            Paragraph('<b>Sprint 2: Injeksi Otak MBG</b><br/>(Minggu 2)', table_cell_bold),
            Paragraph('&bull; Hubungkan data 6 Konglomerat BEI, Dividen Hunter, dan Foreign Flow ke UI ARIB.<br/>&bull; Sematkan <b>Kartu Trading Standar Astra</b> lengkap dengan kalkulator lot interaktif.<br/>&bull; Aktifkan sinkronisasi database Supabase PostgreSQL.', table_cell),
            Paragraph('Tim IT &amp; Tim Trader', table_cell)
        ],
        [
            Paragraph('<b>Sprint 3: Aktivasi MBG B Plan</b><br/>(Minggu 3)', table_cell_bold),
            Paragraph('&bull; Visualisasikan level Smart Money (Order Block &amp; FVG) di chart TradingView.<br/>&bull; Tampilkan pita ramalan cuaca probabilitas AI <b>Google TimesFM 2.5</b>.<br/>&bull; Sambungkan Virtual Paper Trading dan algoritma liga <b>Exp3 Bandit</b> ke tab Portofolio.', table_cell),
            Paragraph('Tim Quant &amp; Tim Desain', table_cell)
        ],
        [
            Paragraph('<b>Sprint 4: Uji Coba &amp; Telegram</b><br/>(Minggu 4)', table_cell_bold),
            Paragraph('&bull; Verifikasi pengiriman briefing otomatis jam 07:15 WIB dan Flash Alert via Telegram.<br/>&bull; Jalankan simulasi trading virtual selama 14 hari bursa.<br/>&bull; Handover sistem ke seluruh stakeholder dan peluncuran resmi.', table_cell),
            Paragraph('Seluruh Tim Terpadu', table_cell)
        ],
    ]
    t_spr = Table(sprint_data, colWidths=[36*mm, 102*mm, 36*mm])
    t_spr.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_spr)
    story.append(Spacer(1, 4*mm))

    story.append(make_callout('<b>KESIMPULAN FINAL UNTUK STAKEHOLDER &amp; REKAN KERJA:</b> Penggabungan MBG-ARIB Quantum Cockpit di atas Cloudflare adalah solusi terlengkap yang memadukan keindahan visual terminal modern, kedalaman analisis kecerdasan buatan, serta disiplin risiko uang nyata. Seluruh sistem dirancang sedemikian rupa agar orang awam dapat mengambil keputusan finansial sekelas profesional dengan tenang, terarah, dan 100% bebas biaya operasional bulanan.'))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f'SUCCESS: Unified Master PRD PDF generated at {target_pdf}')

if __name__ == '__main__':
    build_pdf()
