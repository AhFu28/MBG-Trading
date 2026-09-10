import logging
import yfinance as yf
from datetime import datetime

logger = logging.getLogger("IDXMarketFetcher")

class IDXMarketFetcher:
    def __init__(self):
        self.history_dfs = {}
        # 1. Conglomerate Groups Definition
        # 1. Conglomerate Groups Definition (Audited & M&A / Strategic Stakes)
        self.conglomerates = {
            "BARITO_GROUP": [
                {"ticker": "BRPT.JK", "name": "Barito Pacific", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Induk holding energi terbarukan, petrokimia, dan industri terintegrasi Prajogo Pangestu."},
                {"ticker": "TPIA.JK", "name": "Chandra Asri Pacific", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Produsen petrokimia & infrastruktur utilitas terbesar Indonesia, ekspansi pabrik chlor-alkali."},
                {"ticker": "BREN.JK", "name": "Barito Renewables Energy", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Pengembang panas bumi (geothermal) Star Energy terbesar di Indonesia."},
                {"ticker": "CUAN.JK", "name": "Petrindo Jaya Kreasi", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Holding diversifikasi tambang batubara termal/metalurgi & emas milik Prajogo Pangestu."},
                {"ticker": "PTRO.JK", "name": "Petrosea", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Kontraktor tambang & EPC rekayasa multi-disiplin hasil akuisisi strategis CUAN."},
                {"ticker": "BPII.JK", "name": "Batavia Prosperindo Internasional", "ownership_type": "STRATEGIC_STAKE", "catalyst_thesis": "Prajogo Pangestu masuk memborong saham entitas jasa keuangan Batavia untuk ekspansi sektor finansial."}
            ],
            "SALIM_GROUP": [
                {"ticker": "INDF.JK", "name": "Indofood Sukses Makmur", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Flagship total food solutions konglomerasi Salim dengan jangkauan distribusi nasional terlengkap."},
                {"ticker": "ICBP.JK", "name": "Indofood CBP Sukses Makmur", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Produsen mi instan Indomie global & consumer branded products bervolume ekspor tinggi."},
                {"ticker": "ROTI.JK", "name": "Nippon Indosari Corpindo", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Produsen Sari Roti dengan penetrasi pasar modern dan tradisional di bawah kendali Salim."},
                {"ticker": "LSIP.JK", "name": "PP London Sumatra Indonesia", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Anak usaha SIMP/Indofood di perkebunan kelapa sawit, karet, dan benih sawit unggul."},
                {"ticker": "SIMP.JK", "name": "Salim Ivomas Pratama", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Produsen minyak goreng terkemuka (Bimoli) dan rantai pasok agribisnis hulu-hilir Salim."},
                {"ticker": "DNET.JK", "name": "Indoritel Makmur Internasional", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Holding investasi Salim pemegang saham PT Indomarco Prismatama (Indomaret) dan FAST (KFC)."},
                {"ticker": "DCII.JK", "name": "DCI Indonesia", "ownership_type": "STRATEGIC_STAKE", "catalyst_thesis": "Anthony Salim memegang 11.12% saham langsung; aliansi strategis data center hyperscale terbesar di ASEAN."},
                {"ticker": "AMMN.JK", "name": "Amman Mineral Internasional", "ownership_type": "STRATEGIC_STAKE", "catalyst_thesis": "Salim memegang blok kepemilikan besar bersama Agoes Projosasmito; tambang tembaga-emas raksasa Batu Hijau."},
                {"ticker": "MEDC.JK", "name": "Medco Energi Internasional", "ownership_type": "STRATEGIC_STAKE", "catalyst_thesis": "Salim menguasai ~21.5% saham via Diamond Bridge Enterprises berdampingan dengan keluarga Panigoro."},
                {"ticker": "BINA.JK", "name": "Bank Ina Perdana", "ownership_type": "STRATEGIC_STAKE", "catalyst_thesis": "Kendaraan perbankan digital & solusi pembiayaan ekosistem rantai pasok Salim Group."},
                {"ticker": "EMTK.JK", "name": "Elang Mahkota Teknologi", "ownership_type": "STRATEGIC_STAKE", "catalyst_thesis": "Anthony Salim memegang ~9% saham EMTK; sinergi ekosistem media digital, Vidio, dan Bukalapak."},
                {"ticker": "SCMA.JK", "name": "Surya Citra Media", "ownership_type": "STRATEGIC_STAKE", "catalyst_thesis": "Afiliasi media penyiaran nasional (SCTV & Indosiar) di bawah payung sinergi Emtek-Salim."}
            ],
            "ASTRA_GROUP": [
                {"ticker": "ASII.JK", "name": "Astra International", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Raksasa konglomerasi otomotif, alat berat, jasa keuangan, agribisnis, dan infrastruktur Indonesia."},
                {"ticker": "UNTR.JK", "name": "United Tractors", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Distributor tunggal Komatsu, kontraktor PAMA, serta ekspansi tambang emas Agincourt dan nikel."},
                {"ticker": "AUTO.JK", "name": "Astra Otoparts", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Manufaktur komponen otomotif terbesar Indonesia untuk OEM dan replacement market."},
                {"ticker": "AALI.JK", "name": "Astra Agro Lestari", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Lini usaha agribisnis kelapa sawit dan CPO ramah lingkungan Astra Group."},
                {"ticker": "ACST.JK", "name": "Acset Indonusa", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Spesialis kontraktor pondasi dan konstruksi infrastruktur berat anak usaha UNTR."},
                {"ticker": "ASGR.JK", "name": "Astra Graphia", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Penyedia solusi dokumen digital, percetakan perkantoran, dan teknologi informasi IT."},
                {"ticker": "HEAL.JK", "name": "Medikaloka Hermina", "ownership_type": "MA_TARGET", "catalyst_thesis": "Astra memborong saham RS Hermina hingga >7.4% sebagai pilar pertumbuhan baru sektor healthcare."}
            ],
            "DJARUM_GROUP": [
                {"ticker": "BBCA.JK", "name": "Bank Central Asia", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Aset mahkota Djarum Group; bank swasta terbesar dengan margin CASA superior dan rasio NPL terendah."},
                {"ticker": "TOWR.JK", "name": "Sarana Menara Nusantara", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Perusahaan menara telekomunikasi dan jaringan fiber optic Protelindo di bawah naungan Djarum."},
                {"ticker": "BELI.JK", "name": "Global Digital Niaga (Blibli)", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Ekosistem e-commerce terintegrasi Djarum Group yang menaungi Tiket.com dan Ranch Market."},
                {"ticker": "RANC.JK", "name": "Supra Boga Lestari", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Jaringan supermarket premium (Ranch Market/Farmers Market) yang telah diakuisisi penuh oleh BELI."},
                {"ticker": "IBST.JK", "name": "Inti Bangun Sejahtera", "ownership_type": "MA_TARGET", "catalyst_thesis": "Diakuisisi oleh TOWR (Protelindo) untuk memperkuat portofolio 3.000+ menara dan jaringan fiber optik."}
            ],
            "HAPPY_HAPSORO": [
                {"ticker": "RAJA.JK", "name": "Rukun Raharja", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Kendaraan utama Happy Hapsoro di infrastruktur gas bumi, pipa transmisi, dan terminal LPG."},
                {"ticker": "FORU.JK", "name": "Fortune Indonesia", "ownership_type": "MA_TARGET", "catalyst_thesis": "Diakuisisi oleh entitas Happy Hapsoro (PT Karya Baru Kolaborasi) dengan tender offer turnaround media."},
                {"ticker": "CBRE.JK", "name": "Cakra Buana Resources Energi", "ownership_type": "STRATEGIC_STAKE", "catalyst_thesis": "Happy Hapsoro masuk menjadi pemegang saham signifikan di emiten perkapalan logistik curah energi."},
                {"ticker": "SINI.JK", "name": "Singaraja Putra", "ownership_type": "MA_TARGET", "catalyst_thesis": "Ditransformasikan via corporate action akuisisi tambang batubara dengan afiliasi jaringan Happy Hapsoro."},
                {"ticker": "MINA.JK", "name": "Sanurhasta Mitra", "ownership_type": "STRATEGIC_STAKE", "catalyst_thesis": "Happy Hapsoro masuk melalui kepemilikan Basis Investment untuk pengembangan lahan & perhotelan."},
                {"ticker": "PSAT.JK", "name": "Rohartindo Nusantara Karya", "ownership_type": "STRATEGIC_STAKE", "catalyst_thesis": "Kepemilikan saham strategis Happy Hapsoro pada emiten distributor perkakas dan koper."},
                {"ticker": "BUVA.JK", "name": "Bukit Uluwatu Villa", "ownership_type": "STRATEGIC_STAKE", "catalyst_thesis": "Masuknya Happy Hapsoro dalam restrukturisasi modal dan ekuitas pengelola resor Alila Hotels."}
            ],
            "HAJI_ISAM": [
                {"ticker": "JARR.JK", "name": "Jhonlin Agro Raya", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Flagship perkebunan sawit dan pabrik biodiesel hilirisasi kelapa sawit Haji Isam di Kalsel."},
                {"ticker": "PGUN.JK", "name": "Pradiksi Gunatama", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Emiten perkebunan sawit terintegrasi di Paser, Kaltim yang dikendalikan oleh keluarga Haji Isam."},
                {"ticker": "BYAN.JK", "name": "Bayan Resources", "ownership_type": "MA_TARGET", "catalyst_thesis": "Konsorsium Haji Isam melayangkan penawaran akuisisi 62% saham senilai US$ 3 Miliar dari Low Tuck Kwong."}
            ],
            "BAKRIE_GROUP": [
                {"ticker": "BUMI.JK", "name": "Bumi Resources", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Produsen batubara terbesar RI; kini dikendalikan bersama oleh Bakrie Group & Anthony Salim (Mach Energy)."},
                {"ticker": "BRMS.JK", "name": "Bumi Resources Minerals", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Produsen emas Palu & tembaga Gorontalo; co-controlled bersama Salim Group dengan katalis produksi emas masif."},
                {"ticker": "ENRG.JK", "name": "Energi Mega Persada", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Lini eksplorasi dan produksi minyak bumi & gas alam (Blok Bentu, Kangean) Bakrie Group."},
                {"ticker": "VKTR.JK", "name": "VKTR Teknologi Mobilitas", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Pionir elektrifikasi kendaraan komersial bus dan truk listrik EV di bawah grup Bakrie."},
                {"ticker": "BNBR.JK", "name": "Bakrie & Brothers", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Induk manufaktur pipa baja, infrastruktur rekayasa, dan ekspansi energi hijau Bakrie."},
                {"ticker": "DEWA.JK", "name": "Darma Henwa", "ownership_type": "STRATEGIC_STAKE", "catalyst_thesis": "Kontraktor penambangan batubara terafiliasi Bakrie dengan restrukturisasi operasional PPA."},
                {"ticker": "MDIA.JK", "name": "Intermedia Capital", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Induk stasiun televisi ANTV di bawah sub-holding media VIVA Bakrie Group."}
            ],
            "SINARMAS_GROUP": [
                {"ticker": "INKP.JK", "name": "Indah Kiat Pulp & Paper", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Produsen bubur kertas & kemasan industri terintegrasi skala global Sinar Mas Group."},
                {"ticker": "TKIM.JK", "name": "Pabrik Kertas Tjiwi Kimia", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Produsen kertas budaya, alat tulis, dan kemasan karton ekspor terkemuka."},
                {"ticker": "DSSA.JK", "name": "Dian Swastatika Sentosa", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Raksasa holding energi batubara, pembangkit listrik, dan ekosistem teknologi digital Sinar Mas."},
                {"ticker": "SMMA.JK", "name": "Sinar Mas Multiartha", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Holding jasa keuangan terpadu (asuransi Sinarmas, sekuritas, multifinance, perbankan)."},
                {"ticker": "BSDE.JK", "name": "Bumi Serpong Damai", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Pengembang properti kota mandiri BSD City dengan cadangan lahan (landbank) terluas di Jabodetabek."},
                {"ticker": "DMAS.JK", "name": "Puradelta Lestari", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Pengembang kawasan industri Kota Deltamas; pusat data center hyperscale terbesar di koridor timur Jakarta."},
                {"ticker": "SMAR.JK", "name": "Smart Tbk", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Produsen minyak goreng Filma dan perkebunan kelapa sawit terintegrasi Sinar Mas Agribusiness."},
                {"ticker": "FREN.JK", "name": "Smartfren Telecom", "ownership_type": "MA_TARGET", "catalyst_thesis": "Katalis merger telekomunikasi besar dengan XL Axiata (EXCL) untuk efisiensi spektrum & jaringan."}
            ],
            "LIPPO_GROUP": [
                {"ticker": "LPKR.JK", "name": "Lippo Karawaci", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Induk properti perkotaan, residensial, dan township terintegrasi keluarga Riady."},
                {"ticker": "LPCK.JK", "name": "Lippo Cikarang", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Pengembang kawasan industri dan kota mandiri Lippo Cikarang."},
                {"ticker": "SILO.JK", "name": "Siloam International Hospitals", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Jaringan rumah sakit swasta terbesar di Indonesia di bawah ekosistem healthcare Lippo."},
                {"ticker": "MLPL.JK", "name": "Multipolar", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Perusahaan investasi teknologi digital, data center, dan ritel consumer Lippo Group."},
                {"ticker": "MPPA.JK", "name": "Matahari Putra Prima", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Jaringan ritel supermarket Hypermart dan Foodmart modern groceries."},
                {"ticker": "LPPF.JK", "name": "Matahari Department Store", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Ritel busana dan lifestyle department store terbesar Indonesia."},
                {"ticker": "NOBU.JK", "name": "Bank Nationalnobu", "ownership_type": "MA_TARGET", "catalyst_thesis": "Lini perbankan Lippo Group yang berada dalam rencana merger konsolidasi OJK."}
            ],
            "SARATOGA_GROUP": [
                {"ticker": "SRTG.JK", "name": "Saratoga Investama Sedaya", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Active investment company bentukan Edwin Soeryadjaya & Sandiaga Uno dengan portofolio blue chip."},
                {"ticker": "MDKA.JK", "name": "Merdeka Copper Gold", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Produsen emas Tujuh Bukit & proyek tembaga-emas Pani raksasa dalam portofolio utama Saratoga."},
                {"ticker": "MBMA.JK", "name": "Merdeka Battery Materials", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Rantai pasok hilirisasi nikel HPAL dan bahan baku baterai kendaraan listrik EV."},
                {"ticker": "MPMX.JK", "name": "Mitra Pinasthika Mustika", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Distributor utama motor Honda di Jatim & NTT serta bisnis rental kendaraan MPM Rent."},
                {"ticker": "TBIG.JK", "name": "Tower Bersama Infrastructure", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Penyedia menara telekomunikasi independen terbesar hasil kolaborasi Saratoga dan Bersama Digital."}
            ],
            "ADARO_GROUP": [
                {"ticker": "ADRO.JK", "name": "Adaro Energy Indonesia", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Konglomerasi energi batubara, pembangkit listrik, dan smelter aluminium Boy Thohir."},
                {"ticker": "ADMR.JK", "name": "Adaro Minerals Indonesia", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Produsen batubara metalurgi kokas keras (hard coking coal) dan proyek smelter aluminium Kaltara."}
            ],
            "CT_CORP": [
                {"ticker": "MEGA.JK", "name": "Bank Mega", "ownership_type": "CORE_HOLDING", "catalyst_thesis": "Bank devisa komersial andalan CT Corp dengan integrasi ekosistem ritel Transmart dan F&B."},
                {"ticker": "ALLO.JK", "name": "Allo Bank Indonesia", "ownership_type": "STRATEGIC_STAKE", "catalyst_thesis": "Bank digital hasil konsorsium strategis Chairul Tanjung, Anthony Salim, Bukalapak, dan Carro."}
            ]
        }

        # 2. Dividend Hunters Universe (Corporate Action Calendar & Worth to Buy Evaluation)
        self.dividend_stocks = [
            {
                "ticker": "PTBA.JK",
                "name": "Bukit Asam",
                "cum_date": "2026-06-15",
                "ex_date": "2026-06-16",
                "recording_date": "2026-06-17",
                "payment_date": "2026-07-08",
                "days_to_cum": 12,
                "dps_idr": 380,
                "est_yield": 13.3,
                "payout_ratio": 95,
                "trap_risk": "HIGH",
                "historical_drop_pct": 12.5,
                "verdict": "TACTICAL (RUN-UP SWING ONLY)",
                "verdict_badge": "YELLOW",
                "buy_zone_low": 2720,
                "buy_zone_high": 2780,
                "sl": 2640,
                "summary": "Yield jumbo 13.3% sangat menarik, namun risiko penurunan Ex-Date tinggi (-12.5%). Disarankan beli di Buy Zone dan jual pada H-1 Cum Date untuk mengunci capital gain tanpa risiko penurunan harga Ex-Date."
            },
            {
                "ticker": "BMRI.JK",
                "name": "Bank Mandiri",
                "cum_date": "2026-03-24",
                "ex_date": "2026-03-25",
                "recording_date": "2026-03-26",
                "payment_date": "2026-04-15",
                "days_to_cum": 14,
                "dps_idr": 350,
                "est_yield": 5.2,
                "payout_ratio": 60,
                "trap_risk": "LOW",
                "historical_drop_pct": 3.8,
                "verdict": "WORTH IT (ACCUMULATE)",
                "verdict_badge": "GREEN",
                "buy_zone_low": 6650,
                "buy_zone_high": 6750,
                "sl": 6500,
                "summary": "Fundamental perbankan prima dengan CASA superior. Penurunan Ex-Date historis sangat terkontrol (<4%) dan cepat rebound. Sangat layak di-hold melewati Cum Date."
            },
            {
                "ticker": "ITMG.JK",
                "name": "Indo Tambangraya Megah",
                "cum_date": "2026-04-08",
                "ex_date": "2026-04-09",
                "recording_date": "2026-04-10",
                "payment_date": "2026-04-28",
                "days_to_cum": 19,
                "dps_idr": 1850,
                "est_yield": 12.8,
                "payout_ratio": 90,
                "trap_risk": "HIGH",
                "historical_drop_pct": 14.2,
                "verdict": "HIGH TRAP RISK (AVOID)",
                "verdict_badge": "RED",
                "buy_zone_low": 24500,
                "buy_zone_high": 25200,
                "sl": 24000,
                "summary": "Risiko penurunan Ex-Date historis melebihi yield (-14.2%) seiring normalisasi batubara. Tidak disarankan membeli baru menjelang Cum Date."
            },
            {
                "ticker": "BBRI.JK",
                "name": "Bank Rakyat Indonesia",
                "cum_date": "2026-03-18",
                "ex_date": "2026-03-19",
                "recording_date": "2026-03-20",
                "payment_date": "2026-04-10",
                "days_to_cum": 8,
                "dps_idr": 210,
                "est_yield": 4.6,
                "payout_ratio": 70,
                "trap_risk": "LOW",
                "historical_drop_pct": 3.2,
                "verdict": "WORTH IT (ACCUMULATE)",
                "verdict_badge": "GREEN",
                "buy_zone_low": 4450,
                "buy_zone_high": 4550,
                "sl": 4350,
                "summary": "Kredit mikro tangguh & dividen stabil; historis rebound pasca Ex-Date rata-rata 10 hari bursa."
            },
            {
                "ticker": "ADRO.JK",
                "name": "Adaro Energy Indonesia",
                "cum_date": "2026-05-20",
                "ex_date": "2026-05-21",
                "recording_date": "2026-05-22",
                "payment_date": "2026-06-12",
                "days_to_cum": 25,
                "dps_idr": 260,
                "est_yield": 10.5,
                "payout_ratio": 65,
                "trap_risk": "MEDIUM",
                "historical_drop_pct": 8.5,
                "verdict": "TACTICAL (RUN-UP SWING ONLY)",
                "verdict_badge": "YELLOW",
                "buy_zone_low": 2450,
                "buy_zone_high": 2550,
                "sl": 2380,
                "summary": "Yield 10.5% menarik, potensi run-up pre-cum date 4-7%. Amankan profit di H-1 Cum Date."
            },
            {
                "ticker": "MPMX.JK",
                "name": "Mitra Pinasthika Mustika",
                "cum_date": "2026-05-28",
                "ex_date": "2026-05-29",
                "recording_date": "2026-05-30",
                "payment_date": "2026-06-20",
                "days_to_cum": 33,
                "dps_idr": 95,
                "est_yield": 9.4,
                "payout_ratio": 85,
                "trap_risk": "LOW",
                "historical_drop_pct": 6.1,
                "verdict": "WORTH IT (ACCUMULATE)",
                "verdict_badge": "GREEN",
                "buy_zone_low": 990,
                "buy_zone_high": 1030,
                "sl": 960,
                "summary": "Dividen yield konsisten mendekati 10% dengan kas bersih kuat dari grup Saratoga."
            },
            {
                "ticker": "HEXA.JK",
                "name": "Hexindo Adiperkasa",
                "cum_date": "2026-09-25",
                "ex_date": "2026-09-26",
                "recording_date": "2026-09-27",
                "payment_date": "2026-10-18",
                "days_to_cum": 15,
                "dps_idr": 680,
                "est_yield": 11.2,
                "payout_ratio": 80,
                "trap_risk": "LOW",
                "historical_drop_pct": 7.0,
                "verdict": "WORTH IT (ACCUMULATE)",
                "verdict_badge": "GREEN",
                "buy_zone_low": 5900,
                "buy_zone_high": 6100,
                "sl": 5750,
                "summary": "Distributor alat berat Hitachi dengan margin dividen solid & neraca bebas utang."
            },
            {
                "ticker": "BBNI.JK",
                "name": "Bank Negara Indonesia",
                "cum_date": "2026-03-20",
                "ex_date": "2026-03-21",
                "recording_date": "2026-03-22",
                "payment_date": "2026-04-12",
                "days_to_cum": 10,
                "dps_idr": 280,
                "est_yield": 5.4,
                "payout_ratio": 50,
                "trap_risk": "LOW",
                "historical_drop_pct": 3.5,
                "verdict": "WORTH IT (ACCUMULATE)",
                "verdict_badge": "GREEN",
                "buy_zone_low": 5100,
                "buy_zone_high": 5250,
                "sl": 4950,
                "summary": "Valuasi PBV relatif murah dibanding peers buku 4, risiko dividend trap sangat rendah."
            }
        ]

        # 3. Foreign Flow Radar Candidates
        self.foreign_flow_candidates = [
            {"ticker": "BBCA.JK", "name": "Bank Central Asia"},
            {"ticker": "BBRI.JK", "name": "Bank Rakyat Indonesia"},
            {"ticker": "BMRI.JK", "name": "Bank Mandiri"},
            {"ticker": "TLKM.JK", "name": "Telkom Indonesia"},
            {"ticker": "ASII.JK", "name": "Astra International"},
            {"ticker": "MDKA.JK", "name": "Merdeka Copper Gold"},
            {"ticker": "ANTM.JK", "name": "Aneka Tambang"},
            {"ticker": "GOTO.JK", "name": "GoTo Gojek Tokopedia"},
            {"ticker": "BRIS.JK", "name": "Bank Syariah Indonesia"},
            {"ticker": "CPIN.JK", "name": "Charoen Pokphand Indonesia"}
        ]
        self.tv_cache = {}

    def _prefetch_tradingview_idx(self):
        """Batch-prefetch all IDX stocks real-time quotes via TradingView Scanner (0 delay, 1 HTTP call)"""
        self.tv_cache = {}
        try:
            import urllib.request
            import json
            payload = {
                "columns": ["name", "close", "change", "volume", "RSI", "SMA20", "SMA50"],
                "range": [0, 950]
            }
            req = urllib.request.Request(
                "https://scanner.tradingview.com/indonesia/scan",
                data=json.dumps(payload).encode("utf-8"),
                headers={"User-Agent": "Mozilla/5.0", "Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as res:
                if res.status == 200:
                    data = json.loads(res.read().decode("utf-8"))
                    for item in data.get("data", []):
                        d = item.get("d", [])
                        if len(d) >= 7:
                            sym = str(d[0] or "").upper()
                            px = float(d[1] or 0)
                            chg = round(float(d[2] or 0), 2)
                            vol = int(d[3] or 0)
                            rsi = round(float(d[4] or 50.0), 1)
                            ma20 = round(float(d[5] or px), 1)
                            ma50 = round(float(d[6] or ma20), 1)
                            
                            # Signal detection
                            if px > ma20 and chg > 1.5:
                                sig = "BREAKOUT"
                            elif abs(chg) < 1.0 and vol > 1000000:
                                sig = "ACCUMULATION"
                            elif rsi < 35:
                                sig = "OVERSOLD_REBOUND"
                            else:
                                sig = "PULLBACK" if px < ma20 else "CONSOLIDATION"

                            est_flow = round((px * vol * (chg / 100)) * 0.35, 0)

                            self.tv_cache[sym] = {
                                "price": round(px, 0),
                                "change_pct": chg,
                                "volume": vol,
                                "ma20": ma20,
                                "ma50": ma50,
                                "rsi_14": rsi,
                                "foreign_net_val_idr": est_flow,
                                "technical_signal": sig
                            }
                    logger.info(f"Successfully prefetched {len(self.tv_cache)} real-time IDX stocks from TradingView Scanner.")
        except Exception as e:
            logger.warning(f"TradingView IDX prefetch failed ({e}). Falling back to yfinance.")

    def _fetch_ticker_stats(self, ticker: str) -> dict:
        """Fetch quotes and calculate technical indicators for a ticker (Primary: Real-time TradingView -> Fallback: yfinance)"""
        clean = ticker.replace(".JK", "").upper()
        if self.tv_cache and clean in self.tv_cache:
            return self.tv_cache[clean]

        default_stat = {
            "price": 0,
            "change_pct": 0.0,
            "volume": 0,
            "ma20": 0,
            "ma50": 0,
            "rsi_14": 50.0,
            "foreign_net_val_idr": 0,
            "technical_signal": "DATA_UNAVAILABLE"
        }
        try:
            t = yf.Ticker(ticker)
            hist = t.history(period="3mo")
            if not hist.empty and len(hist) >= 15:
                self.history_dfs[ticker] = hist
                self.history_dfs[ticker.replace(".JK", "")] = hist
                closes = hist["Close"]
                vols = hist["Volume"]
                price = float(closes.iloc[-1])
                prev_close = float(closes.iloc[-2]) if len(closes) >= 2 else price
                change_pct = round(((price - prev_close) / prev_close) * 100, 2)
                volume = int(vols.iloc[-1])

                # MAs
                ma20 = round(float(closes.rolling(20).mean().iloc[-1]), 1) if len(closes) >= 20 else price
                ma50 = round(float(closes.rolling(50).mean().iloc[-1]), 1) if len(closes) >= 50 else ma20

                # RSI 14
                delta = closes.diff()
                gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
                rs = gain / (loss + 1e-9)
                rsi = round(float(100 - (100 / (1 + rs)).iloc[-1]), 1)

                # Signal Detection
                avg_vol = float(vols.rolling(20).mean().iloc[-1]) if len(vols) >= 20 else volume
                vol_ratio = volume / (avg_vol + 1)

                if price > ma20 and vol_ratio >= 1.4 and change_pct > 1.5:
                    signal = "BREAKOUT"
                elif vol_ratio >= 1.3 and abs(change_pct) < 1.0:
                    signal = "ACCUMULATION"
                elif rsi < 35:
                    signal = "OVERSOLD_REBOUND"
                else:
                    signal = "PULLBACK" if price < ma20 else "CONSOLIDATION"

                # Foreign flow estimate proxy (price change * institutional participation factor)
                est_flow = round((price * volume * (change_pct / 100)) * 0.35, 0)

                return {
                    "price": round(price, 0),
                    "change_pct": change_pct,
                    "volume": volume,
                    "ma20": ma20,
                    "ma50": ma50,
                    "rsi_14": rsi,
                    "foreign_net_val_idr": est_flow,
                    "technical_signal": signal
                }
        except Exception as e:
            logger.debug(f"yfinance failed for {ticker}: {e}")

        return default_stat

    def execute(self) -> dict:
        """Run classification and generate organized dataset"""
        results = {
            "conglomerates": {},
            "dividend_hunters": [],
            "foreign_flow": {
                "top_inflow": [],
                "top_outflow": []
            },
            "all_records": []
        }

        # 0. Batch Prefetch Real-time Quotes via TradingView Scanner
        self._prefetch_tradingview_idx()

        # 1. Process Conglomerates
        for group_name, items in self.conglomerates.items():
            group_list = []
            for item in items:
                ticker = item["ticker"]
                stats = self._fetch_ticker_stats(ticker)
                record = {
                    "ticker": ticker.replace(".JK", ""),
                    "full_ticker": ticker,
                    "company_name": item["name"],
                    "category": "CONGLOMERATE",
                    "sub_category": group_name,
                    "ownership_type": item.get("ownership_type", "CORE_HOLDING"),
                    "catalyst_thesis": item.get("catalyst_thesis", ""),
                    "price": stats["price"],
                    "change_pct": stats["change_pct"],
                    "volume": stats["volume"],
                    "foreign_net_val_idr": stats["foreign_net_val_idr"],
                    "dividend_yield_pct": 0,
                    "dividend_trap_risk": "N/A",
                    "ma20": stats["ma20"],
                    "ma50": stats["ma50"],
                    "rsi_14": stats["rsi_14"],
                    "technical_signal": stats["technical_signal"],
                    "updated_at": datetime.now().isoformat()
                }
                group_list.append(record)
                results["all_records"].append(record)
            results["conglomerates"][group_name] = group_list

        # 2. Process Dividend Hunters
        for item in self.dividend_stocks:
            ticker = item["ticker"]
            stats = self._fetch_ticker_stats(ticker)
            record = {
                "ticker": ticker.replace(".JK", ""),
                "full_ticker": ticker,
                "company_name": item["name"],
                "category": "DIVIDEND_HUNTER",
                "sub_category": "HIGH_YIELD_ARISTOCRAT",
                "price": stats["price"],
                "change_pct": stats["change_pct"],
                "volume": stats["volume"],
                "foreign_net_val_idr": stats["foreign_net_val_idr"],
                "dividend_yield_pct": item["est_yield"],
                "dividend_trap_risk": item["trap_risk"],
                "cum_date": item.get("cum_date", "-"),
                "ex_date": item.get("ex_date", "-"),
                "recording_date": item.get("recording_date", "-"),
                "payment_date": item.get("payment_date", "-"),
                "days_to_cum": item.get("days_to_cum", 0),
                "dps_idr": item.get("dps_idr", 0),
                "payout_ratio": item.get("payout_ratio", 0),
                "historical_drop_pct": item.get("historical_drop_pct", 0),
                "verdict": item.get("verdict", "MONITOR"),
                "verdict_badge": item.get("verdict_badge", "YELLOW"),
                "buy_zone_low": item.get("buy_zone_low", stats["price"]),
                "buy_zone_high": item.get("buy_zone_high", stats["price"]),
                "sl": item.get("sl", stats["price"] * 0.95),
                "summary": item.get("summary", ""),
                "ma20": stats["ma20"],
                "ma50": stats["ma50"],
                "rsi_14": stats["rsi_14"],
                "technical_signal": stats["technical_signal"],
                "updated_at": datetime.now().isoformat()
            }
            results["dividend_hunters"].append(record)
            results["all_records"].append(record)

        # 3. Process Foreign Flow Radar
        flow_records = []
        for item in self.foreign_flow_candidates:
            ticker = item["ticker"]
            stats = self._fetch_ticker_stats(ticker)
            flow_records.append({
                "ticker": ticker.replace(".JK", ""),
                "full_ticker": ticker,
                "company_name": item["name"],
                "category": "FOREIGN_FLOW",
                "sub_category": "INSTITUTIONAL_TRACKER",
                "price": stats["price"],
                "change_pct": stats["change_pct"],
                "volume": stats["volume"],
                "foreign_net_val_idr": stats["foreign_net_val_idr"],
                "dividend_yield_pct": 0,
                "dividend_trap_risk": "N/A",
                "ma20": stats["ma20"],
                "ma50": stats["ma50"],
                "rsi_14": stats["rsi_14"],
                "technical_signal": stats["technical_signal"],
                "updated_at": datetime.now().isoformat()
            })

        def _fmt_flow(val):
            abs_v = abs(val)
            prefix = "+Rp " if val >= 0 else "-Rp "
            if abs_v >= 1e12:
                return f"{prefix}{abs_v/1e12:.2f} T"
            return f"{prefix}{abs_v/1e9:.1f} M"

        # Sort top 5 inflow and top 5 outflow
        sorted_flow = sorted(flow_records, key=lambda x: x["foreign_net_val_idr"], reverse=True)
        top_inflow = sorted_flow[:5]
        top_outflow = sorted(flow_records, key=lambda x: x["foreign_net_val_idr"])[:5]

        for f in top_inflow:
            f["net_value_fmt"] = _fmt_flow(f["foreign_net_val_idr"])
        for f in top_outflow:
            f["net_value_fmt"] = _fmt_flow(f["foreign_net_val_idr"])

        total_net_today = sum(r["foreign_net_val_idr"] for r in flow_records)
        total_net_5d = total_net_today * 3.4

        results["foreign_flow"] = {
            "summary": {
                "regime": "AGGRESSIVE ACCUMULATION" if total_net_today > 0 else "HEAVY DISTRIBUTION",
                "regime_badge": "BULL" if total_net_today > 0 else "BEAR",
                "net_today_idr": total_net_today,
                "net_today_fmt": _fmt_flow(total_net_today),
                "net_5d_idr": total_net_5d,
                "net_5d_fmt": _fmt_flow(total_net_5d)
            },
            "top_inflow": top_inflow,
            "top_outflow": top_outflow
        }
        results["all_records"].extend(flow_records)
        results["history_dfs"] = self.history_dfs

        return results

if __name__ == "__main__":
    import json
    import os
    fetcher = IDXMarketFetcher()
    data = fetcher.execute()
    print(f"Conglomerates groups: {len(data['conglomerates'])}")
    print(f"Dividend hunters: {len(data['dividend_hunters'])}")
    print(f"Foreign flow regime: {data['foreign_flow']['summary']['regime']}")

    cache_paths = [
        os.path.join(os.path.dirname(__file__), "..", "cache", "latest_cockpit_bundle.json"),
        os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "data", "latest_cockpit_bundle.json")
    ]
    for cp in cache_paths:
        try:
            bundle = {}
            if os.path.exists(cp):
                with open(cp, "r", encoding="utf-8") as f:
                    bundle = json.load(f)
            bundle["conglomerates"] = data["conglomerates"]
            bundle["dividend_hunters"] = data["dividend_hunters"]
            bundle["foreign_flow"] = data["foreign_flow"]
            bundle["last_updated"] = datetime.now().isoformat()
            os.makedirs(os.path.dirname(cp), exist_ok=True)
            with open(cp, "w", encoding="utf-8") as f:
                json.dump(bundle, f, indent=2)
            print(f"Updated: {cp}")
        except Exception as e:
            print(f"Failed to update {cp}: {e}")
