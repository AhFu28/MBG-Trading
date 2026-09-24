import React, { useState, useMemo } from 'react';
import { CHANGELOG_DATA } from '../data/changelogData.js';

export default function ChangelogTab() {
  const [selectedPackageId, setSelectedPackageId] = useState(CHANGELOG_DATA[0]?.id || 'pkg-24092026');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected daily package
  const activePackage = useMemo(() => {
    return CHANGELOG_DATA.find(p => p.id === selectedPackageId) || CHANGELOG_DATA[0];
  }, [selectedPackageId]);

  // Filter package list if search is typed
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return CHANGELOG_DATA;
    const q = searchTerm.trim().toLowerCase();
    return CHANGELOG_DATA.filter(pkg => {
      const inDate = (pkg.date || '').toLowerCase().includes(q);
      const inTitle = (pkg.title || '').toLowerCase().includes(q);
      const inDesc = (pkg.description || '').toLowerCase().includes(q);
      const inVer = (pkg.version || '').toLowerCase().includes(q);
      const inSemantic = (pkg.semanticVersion || '').toLowerCase().includes(q);
      const inMarkdown = (pkg.markdownContent || '').toLowerCase().includes(q);
      const inTable = (pkg.table || []).some(t => 
        (t.module || '').toLowerCase().includes(q) || (t.summary || '').toLowerCase().includes(q)
      );
      return inDate || inTitle || inDesc || inVer || inSemantic || inMarkdown || inTable;
    });
  }, [searchTerm]);

  // Render markdown text lines cleanly and beautifully
  const renderMarkdownLines = (text) => {
    if (!text) return null;
    const lines = text.trim().split('\n');

    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} style={{ height: '6px' }} />;

      // Horizontal separator
      if (trimmed === '---') {
        return <hr key={idx} style={{ border: 'none', borderTop: 'var(--border-muted)', margin: '14px 0' }} />;
      }

      // Blockquote alert
      if (trimmed.startsWith('> [!NOTE]')) {
        return (
          <div key={idx} style={{
            background: 'rgba(56, 189, 248, 0.08)',
            borderLeft: '4px solid var(--accent-cyan)',
            padding: '8px 12px',
            borderRadius: '0 6px 6px 0',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            margin: '8px 0',
            fontFamily: 'var(--font-mono)'
          }}>
            ℹ️ CATATAN SISTEM:
          </div>
        );
      }
      if (trimmed.startsWith('> ')) {
        return (
          <div key={idx} style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderLeft: '3px solid var(--border-color)',
            padding: '6px 12px',
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            margin: '4px 0 8px 0'
          }}>
            {trimmed.replace('> ', '')}
          </div>
        );
      }

      // Header 4
      if (trimmed.startsWith('#### ')) {
        return (
          <h4 key={idx} style={{
            fontSize: '13px',
            fontWeight: '800',
            color: '#38bdf8',
            marginTop: '12px',
            marginBottom: '6px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {trimmed.replace('#### ', '')}
          </h4>
        );
      }

      // Header 3
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} style={{
            fontSize: '14.5px',
            fontWeight: '800',
            color: 'var(--accent-green)',
            marginTop: '16px',
            marginBottom: '8px',
            fontFamily: 'var(--font-mono)'
          }}>
            {trimmed.replace('### ', '')}
          </h3>
        );
      }

      // Header 2
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} style={{
            fontSize: '15.5px',
            fontWeight: '800',
            color: '#38bdf8',
            marginTop: '18px',
            marginBottom: '8px',
            borderBottom: 'var(--border-muted)',
            paddingBottom: '4px'
          }}>
            {trimmed.replace('## ', '')}
          </h2>
        );
      }

      // List item
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemContent = trimmed.substring(2);
        const parts = itemContent.split(/(\*\*.*?\*\*|`.*?`)/g);

        return (
          <li key={idx} style={{
            fontSize: '12.5px',
            color: 'var(--text-primary)',
            lineHeight: '1.75',
            marginBottom: '6px'
          }}>
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={pIdx} style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith('`') && part.endsWith('`')) {
                return (
                  <code key={pIdx} style={{
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--bg-panel-subtle)',
                    border: 'var(--border-muted)',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#38bdf8'
                  }}>
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </li>
        );
      }

      // Regular paragraph
      return (
        <p key={idx} style={{
          fontSize: '12.5px',
          color: 'var(--text-muted)',
          lineHeight: '1.65',
          margin: '6px 0'
        }}>
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '30px' }}>
      
      {/* 1. Master Header Strip */}
      <div className="telemetry-panel" style={{
        padding: '12px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <div style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            marginBottom: '3px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: 'var(--accent-green)', fontWeight: '800' }}>MBG APEX</span>
            <span style={{ opacity: 0.4 }}>//</span>
            <span>DAILY RELEASE REGISTRY & UNIFIED KNOWLEDGE BASE</span>
          </div>

          <div style={{
            fontSize: '16px',
            fontWeight: '800',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📜 Histori Update Harian (1 Paket Besar Per Tanggal)</span>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(0, 208, 132, 0.15)',
              color: 'var(--accent-green)',
              border: '1px solid rgba(0, 208, 132, 0.4)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              Terbaru: {CHANGELOG_DATA[0]?.date} ({CHANGELOG_DATA[0]?.semanticVersion})
            </span>
          </div>
        </div>

        {/* Quick Telemetry */}
        <div style={{ display: 'flex', gap: '8px', fontFamily: 'var(--font-mono)' }}>
          <div style={{
            background: 'var(--bg-panel-subtle)',
            border: 'var(--border-muted)',
            padding: '6px 12px',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>TOTAL REKAP HARIAN</div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{CHANGELOG_DATA.length} Tanggal</div>
          </div>
          <div style={{
            background: 'var(--bg-panel-subtle)',
            border: 'var(--border-muted)',
            padding: '6px 12px',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>MODEL ARSITEKTUR</div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-green)' }}>1 Paket Per Tanggal</div>
          </div>
          <div style={{
            background: 'var(--bg-panel-subtle)',
            border: 'var(--border-muted)',
            padding: '6px 12px',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>FORMAT BACA</div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8' }}>Runtut & Terpadu</div>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Markdown & Package Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 300px) minmax(0, 1fr)',
        gap: '14px',
        alignItems: 'start'
      }}>
        
        {/* Left: Daily Package List (1 Paket Per Tanggal) */}
        <div className="telemetry-panel" style={{
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          position: 'sticky',
          top: '16px',
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: '800',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Daftar Tanggal Rilis</span>
            <span style={{ color: 'var(--accent-cyan)' }}>{filteredList.length} Hari</span>
          </div>

          {/* Quick Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari tanggal/fitur/modul..."
            style={{
              width: '100%',
              background: 'var(--bg-panel-subtle)',
              border: 'var(--border-muted)',
              color: 'var(--text-primary)',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          {/* Package Selector Buttons (1 Button per Calendar Date) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            {filteredList.map(pkg => {
              const isSelected = selectedPackageId === pkg.id;
              const isLatest = pkg.status === 'LATEST';

              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className="telemetry-btn"
                  style={{
                    background: isSelected ? 'rgba(0, 208, 132, 0.14)' : 'var(--bg-panel-subtle)',
                    borderColor: isSelected ? 'var(--accent-green)' : 'var(--border-color)',
                    color: isSelected ? 'var(--accent-green)' : 'var(--text-primary)',
                    textAlign: 'left',
                    padding: '9px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    boxShadow: isSelected ? '0 0 12px rgba(0,208,132,0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                      📅 {pkg.date}
                    </span>
                    <span style={{
                      fontSize: '9px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '800',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      background: isLatest ? 'var(--accent-green)' : 'rgba(255,255,255,0.08)',
                      color: isLatest ? '#000000' : 'var(--text-muted)'
                    }}>
                      {isLatest ? 'LATEST' : pkg.semanticVersion}
                    </span>
                  </div>

                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pkg.version.replace('Package ', 'Paket ')}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{
            marginTop: '8px',
            paddingTop: '10px',
            borderTop: 'var(--border-muted)',
            fontSize: '10px',
            color: 'var(--text-muted)',
            lineHeight: '1.5'
          }}>
            💡 Seluruh pembaruan dalam 1 hari dilebur menjadi <strong>1 Paket Terpadu</strong> dan disajikan secara runtut kronologis.
          </div>
        </div>

        {/* Right: Markdown Document Body (1 Comprehensive Story for the Selected Date) */}
        <div className="telemetry-panel" style={{
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          minWidth: 0
        }}>
          
          {/* Header Card */}
          <div style={{ borderBottom: 'var(--border-muted)', paddingBottom: '14px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '6px'
            }}>
              <h1 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '800',
                color: 'var(--accent-green)',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span># {activePackage.version}</span>
                <span style={{
                  fontSize: '11px',
                  background: activePackage.status === 'LATEST' ? 'rgba(0, 208, 132, 0.2)' : 'rgba(255,255,255,0.08)',
                  color: activePackage.status === 'LATEST' ? 'var(--accent-green)' : 'var(--text-muted)',
                  border: `1px solid ${activePackage.status === 'LATEST' ? 'var(--accent-green)' : 'var(--border-color)'}`,
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {activePackage.semanticVersion} • {activePackage.badgeLabel}
                </span>
              </h1>

              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                📅 {activePackage.date}
              </span>
            </div>

            <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.4' }}>
              {activePackage.title}
            </div>

            <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.65' }}>
              {activePackage.description}
            </p>
          </div>

          {/* 1. GRAFIK / DIAGRAM ALUR PROSES EVOLUSI (PROCESS PIPELINE) */}
          {activePackage.processFlow && activePackage.processFlow.length > 0 && (
            <div style={{
              background: 'var(--bg-panel-subtle)',
              border: 'var(--border-muted)',
              borderRadius: '8px',
              padding: '12px 16px'
            }}>
              <div style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: '800',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>📈</span>
                <span>Diagram Alur Proses Evolusi Paket ({activePackage.processFlow.length} Tahapan)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {activePackage.processFlow.map((step, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <div style={{
                      background: sIdx === activePackage.processFlow.length - 1 ? 'rgba(0, 208, 132, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: sIdx === activePackage.processFlow.length - 1 ? '1px solid var(--accent-green)' : 'var(--border-muted)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: sIdx === activePackage.processFlow.length - 1 ? 'var(--accent-green)' : 'var(--text-primary)'
                      }}>
                        {step.step}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {step.label}
                      </div>
                    </div>

                    {sIdx < activePackage.processFlow.length - 1 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>➔</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* 2. KONTEN DOKUMEN MODEL MARKDOWN (RUNTUT DARI PAGI HINGGA MALAM) */}
          <div>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {renderMarkdownLines(activePackage.markdownContent)}
            </ul>
          </div>

          {/* 3. TABEL REKAPITULASI STATUS MODUL */}
          {activePackage.table && activePackage.table.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <h3 style={{
                fontSize: '13px',
                fontWeight: '800',
                color: '#38bdf8',
                marginBottom: '8px',
                fontFamily: 'var(--font-mono)'
              }}>
                📊 Tabel Rekapitulasi Status Modul Terdampak ({activePackage.table.length} Komponen)
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  border: 'var(--border-muted)'
                }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-panel-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', borderBottom: 'var(--border-muted)', color: 'var(--text-muted)' }}>MODUL</th>
                      <th style={{ padding: '8px 10px', borderBottom: 'var(--border-muted)', color: 'var(--text-muted)' }}>STATUS</th>
                      <th style={{ padding: '8px 10px', borderBottom: 'var(--border-muted)', color: 'var(--text-muted)' }}>KATEGORI</th>
                      <th style={{ padding: '8px 10px', borderBottom: 'var(--border-muted)', color: 'var(--text-muted)' }}>RINGKASAN PEMBARUAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePackage.table.map((row, rIdx) => (
                      <tr key={rIdx} style={{
                        borderBottom: 'var(--border-muted)',
                        background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                      }}>
                        <td style={{ padding: '8px 10px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          <code>{row.module}</code>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{
                            padding: '1px 6px',
                            borderRadius: '3px',
                            fontSize: '9px',
                            fontWeight: '800',
                            background: row.status === 'PROD' ? 'rgba(0, 208, 132, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            color: row.status === 'PROD' ? 'var(--accent-green)' : '#38bdf8',
                            border: `1px solid ${row.status === 'PROD' ? 'rgba(0, 208, 132, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`
                          }}>
                            {row.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                          {row.category}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>
                          {row.summary}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
