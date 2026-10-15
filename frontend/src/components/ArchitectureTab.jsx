import React from 'react';

/**
 * ARCHITECTURE TAB — the public, sanitised view of how the machine works (E-12).
 *
 * WHY THIS EXISTS (2026-10-11):
 * Jendral Arib asked "bagian changelog & arsitektur kok tidak ada ya". Changelog
 * was fixed (E-1/E-3). Architecture already had a tab — FlowProcessTab — but it
 * is TIER.ADMIN and has no navigation door, so an ordinary user could not read
 * how the system works at all.
 *
 * WHY A SEPARATE COMPONENT INSTEAD OF DEMOTING FlowProcessTab:
 * FlowProcessTab is an internal project map: it documents pending security work,
 * operational remediation and internal file paths. That must stay admin-only.
 * This file is the SANITISED public version: data sources, refresh cadence, the
 * honesty rules and what is still missing — and nothing else. Do NOT copy
 * operational detail from FlowProcessTab into this file.
 *
 * FACT DATE: 11 October 2026. Every claim below was checked against the working
 * tree on that date: the workflow YAML schedules, marketOverview.js universes and
 * the live-price polling interval. A claim that could not be verified was either
 * reworded as an order of magnitude or dropped. Where something is not available,
 * this page says so.
 */

const FACT_DATE = '11 Oktober 2026';

/** How a source behaves, so the reader can tell live from scheduled at a glance. */
const SOURCE_KIND = {
  live: { label: 'REAL-TIME', color: 'var(--accent-emerald)', bg: 'rgba(16, 185, 129, 0.14)' },
  scheduled: { label: 'TERJADWAL', color: 'var(--accent-sky-soft)', bg: 'rgba(59, 130, 246, 0.14)' },
  manual: { label: 'MANUAL', color: 'var(--accent-gold)', bg: 'rgba(245, 158, 11, 0.14)' },
};

/** 1. The data path, source to screen. */
const DATA_PATH = [
  {
    id: 'sources',
    step: '1',
    title: 'Sumber data publik',
    desc: 'Harga dan berita diambil dari endpoint publik yang bisa dijangkau dari Indonesia. Tidak ada angka yang dikarang: kalau sumber tidak menjawab, selnya berisi tanda pisah.',
    items: [
      'Pasar kripto: metrik global, daftar koin teratas, dan trending',
      'Indeks Fear & Greed dan indikator musim altcoin',
      'Data derivatif (funding, open interest) lewat bursa yang terjangkau',
      'Saham US, valas, dan komoditas lewat scanner pasar pihak ketiga',
      'Berita makro dari feed RSS publik',
    ],
  },
  {
    id: 'engine',
    step: '2',
    title: 'Pipeline engine di cloud',
    desc: 'Engine Python berjalan di runner cloud, bukan lagi di laptop. Setiap run memvalidasi bundel datanya dulu; bundel yang rusak atau bertanda konflik ditolak sebelum terbit.',
    items: [
      'Terjadwal: arena multi-agent, 4 kali sehari',
      'Terjadwal: radar kripto & makro, tiap jam',
      'Manual: briefing pagi saham BEI, rekap sesi 1, ringkasan penutupan, dan pantauan global sore',
      'Gerbang QA: tes engine dan tes frontend harus hijau sebelum perubahan boleh terbit',
    ],
  },
  {
    id: 'store',
    step: '3',
    title: 'Penyimpanan',
    desc: 'Hasil pipeline disimpan lalu diterbitkan ke lapisan yang dibaca aplikasi. Satu salinan internal disimpan terpisah untuk membandingkan kalau ada data yang terasa tidak sinkron.',
    items: [
      'Basis data terkelola (opsional, dipakai kalau dikonfigurasi)',
      'Bundel JSON publik yang dibaca web dan bot',
      'Salinan cache internal untuk pemeriksaan selisih',
    ],
  },
  {
    id: 'gate',
    step: '4',
    title: 'Gerbang kejujuran',
    desc: 'Ini bagian yang membuat angka di layar bisa dipercaya. Aturannya berlaku otomatis, bukan sekadar niat.',
    items: [
      'Setiap sinyal wajib membawa asal-usul (sumber) dan waktu pengamatan',
      'Sinyal tanpa asal-usul yang jelas diturunkan menjadi catatan publik, bukan dikirim sebagai sinyal',
      'Data sintetis atau simulasi selalu dilabeli, tidak pernah dijual sebagai data live',
      'Nilai yang tidak tersedia ditampilkan sebagai tanda pisah, tidak pernah diisi 0 atau tebakan',
    ],
  },
  {
    id: 'screen',
    step: '5',
    title: 'Sampai ke layar',
    desc: 'Dua jalur bertemu di halaman ini: data pasar yang diambil langsung dari browser, dan data hasil pipeline yang tiba sebagai snapshot terjadwal.',
    items: [
      'Data pasar live disegarkan berkala selama halaman terbuka',
      'Watchlist pribadi punya irama penyegaran sendiri yang lebih cepat',
      'Halaman depan memuat ulang data pasarnya sekitar tiap 90 detik',
      'Tamu melihat snapshot bawaan; akun yang masuk mendapat data terbaru',
    ],
  },
];

/** 2. Which source feeds which market, and how fresh it is. */
const MARKETS = [
  {
    market: 'Kripto (spot & perp)',
    source: 'Beberapa API publik pasar kripto',
    kind: 'live',
    note: 'Harga disegarkan di layar. Sebagian penyedia derivatif diblokir di jaringan Indonesia dan karena itu tidak dipakai.',
  },
  {
    market: 'Saham US',
    source: 'Scanner pasar pihak ketiga (pasar America)',
    kind: 'live',
    note: 'Daftar mega-cap dikurasi, bukan seluruh bursa.',
  },
  {
    market: 'Valas (Forex)',
    source: 'Scanner pasar pihak ketiga (pasar Forex)',
    kind: 'live',
    note: 'Sepuluh pasangan utama, termasuk USD/IDR.',
  },
  {
    market: 'Komoditas',
    source: 'Scanner pasar pihak ketiga (pasar CFD)',
    kind: 'live',
    note: 'Emas, perak, minyak WTI & Brent, indeks dolar, platinum, dan paladium.',
  },
  {
    market: 'Saham BEI (IDX)',
    source: 'Pipeline engine + sumber publik',
    kind: 'scheduled',
    note: 'Angka hariannya tiba lewat pipeline terjadwal/manual. Feed harga BEI masih memakai sumber publik, belum feed berlisensi bursa.',
  },
  {
    market: 'Berita & makro',
    source: 'Feed RSS publik',
    kind: 'scheduled',
    note: 'Dipakai untuk panel berita dan hitungan topik, bukan siaran berbayar.',
  },
  {
    market: 'Watchlist pribadi',
    source: 'Sumber yang sama seperti di atas',
    kind: 'live',
    note: 'Disiapkan agar menyegar lebih cepat daripada halaman utama. Simbol tanpa harga tampil sebagai tanda pisah.',
  },
];

/** 3. What is still missing. Honest gaps, not a roadmap promise. */
const GAPS = [
  {
    title: 'Empat dari enam pipeline masih dijalankan manual',
    detail: 'Hanya arena multi-agent dan radar kripto-makro yang punya jadwal otomatis. Briefing pagi, rekap sesi 1, ringkasan penutupan, dan refresh intraday masih menunggu tombol manual.',
  },
  {
    title: 'Riwayat harga historis baru ada untuk sebagian pasar',
    detail: 'Saham US dan saham BEI punya riwayat harian terbatas. Valas dan komoditas belum punya endpoint riwayat sama sekali, jadi grafik historisnya belum tersedia.',
  },
  {
    title: 'Beberapa simbol komoditas tidak tersedia di sumbernya',
    detail: 'Tembaga dan gas alam tidak dikembalikan oleh pasar CFD yang kami pakai. Simbol itu dihapus dari daftar daripada dipaksa tampil dengan harga kosong.',
  },
  {
    title: 'Harga pasar pihak ketiga bersifat indikatif',
    detail: 'Angkanya berguna untuk membaca arah, tetapi bukan feed resmi bursa dan tidak boleh dipakai sebagai acuan eksekusi final.',
  },
  {
    title: 'Jembatan ke MetaTrader 5 belum tersambung',
    detail: 'Endpoint-nya masih berupa tempat kosong sampai sumber datanya tersedia. Belum ada tanggal penyelesaian.',
  },
];

/** A section heading, kept in one place so every block looks the same. */
function SectionTitle({ icon, title, subtitle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
          {title}
        </h2>
      </div>
      {subtitle && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.55 }}>{subtitle}</div>
      )}
    </div>
  );
}

export default function ArchitectureTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div className="telemetry-panel" style={{ borderRadius: '14px', padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '26px' }}>🧭</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Arsitektur Sistem
            </h1>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Dari sumber data sampai angka yang Anda lihat di layar. Fakta per {FACT_DATE}.
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: '14px',
            padding: '10px 12px',
            borderRadius: '9px',
            background: 'var(--bg-panel-subtle)',
            border: 'var(--border-hairline)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
          }}
        >
          Halaman ini adalah versi publik yang sudah disanitasi. Peta proyek internal — termasuk hal-hal
          operasional — sengaja tidak ditampilkan di sini. Kalau ada yang belum tersedia, halaman ini
          mengatakannya apa adanya daripada mengisi kekosongan dengan tebakan.
        </div>
      </div>

      {/* 1. Data path */}
      <div className="telemetry-panel" style={{ borderRadius: '14px', padding: '18px 20px' }}>
        <SectionTitle
          icon="🔀"
          title="Alur data: dari sumber sampai layar"
          subtitle="Lima tahap. Setiap tahap menyebut apa yang benar-benar terjadi, bukan yang direncanakan."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {DATA_PATH.map(stage => (
            <div
              key={stage.id}
              style={{
                border: 'var(--border-hairline)',
                borderRadius: '10px',
                padding: '12px',
                background: 'var(--bg-panel-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '7px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.18)',
                    color: 'var(--accent-sky-soft)',
                    fontSize: '12px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {stage.step}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{stage.title}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{stage.desc}</div>
              <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {stage.items.map(item => (
                  <li key={item} style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Sources per market */}
      <div className="telemetry-panel" style={{ borderRadius: '14px', padding: '18px 20px' }}>
        <SectionTitle
          icon="🗂️"
          title="Sumber data per pasar"
          subtitle="Mana yang datang real-time dan mana yang tiba terjadwal. Pasar yang datanya belum tersedia tetap dicantumkan supaya tidak terlihat seperti sudah ada."
        />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '7px 6px', fontWeight: 700 }}>Pasar</th>
                <th style={{ padding: '7px 6px', fontWeight: 700 }}>Sumber</th>
                <th style={{ padding: '7px 6px', fontWeight: 700 }}>Sifat data</th>
                <th style={{ padding: '7px 6px', fontWeight: 700 }}>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {MARKETS.map(row => {
                const kind = SOURCE_KIND[row.kind];
                return (
                  <tr key={row.market} style={{ borderTop: 'var(--border-hairline)' }}>
                    <td style={{ padding: '8px 6px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {row.market}
                    </td>
                    <td style={{ padding: '8px 6px', color: 'var(--text-secondary)' }}>{row.source}</td>
                    <td style={{ padding: '8px 6px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: kind.color,
                          background: kind.bg,
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '4px',
                          padding: '2px 7px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {kind.label}
                      </span>
                    </td>
                    <td style={{ padding: '8px 6px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{row.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Gaps */}
      <div className="telemetry-panel" style={{ borderRadius: '14px', padding: '18px 20px' }}>
        <SectionTitle
          icon="🚧"
          title="Yang masih kurang"
          subtitle="Daftar ini sengaja terbuka. Bagian yang belum jadi lebih berguna kalau disebut daripada disembunyikan."
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {GAPS.map(gap => (
            <div
              key={gap.title}
              style={{
                border: 'var(--border-hairline)',
                borderLeft: '3px solid var(--accent-gold)',
                borderRadius: '8px',
                padding: '10px 12px',
                background: 'var(--bg-panel-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: 'var(--accent-gold)',
                    background: 'rgba(245, 158, 11, 0.14)',
                    borderRadius: '4px',
                    padding: '2px 7px',
                  }}
                >
                  BELUM TERSEDIA
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{gap.title}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.65, marginTop: '5px' }}>
                {gap.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="telemetry-panel"
        style={{ borderRadius: '12px', padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}
      >
        <strong style={{ color: 'var(--text-secondary)' }}>Catatan kejujuran data</strong> · Semua angka di aplikasi ini
        berasal dari sumber yang bisa diperiksa. Data yang tidak tersedia ditandai, bukan ditambal. Rincian operasional
        internal tidak dipublikasikan di halaman ini.
      </div>
    </div>
  );
}
