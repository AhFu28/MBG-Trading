import React, { useState, useMemo } from 'react';
import { CHANGELOG_DATA, getDailyGroupedChangelog } from '../data/changelogData.js';

export default function ChangelogTab() {
  const dailyGroups = useMemo(() => getDailyGroupedChangelog(CHANGELOG_DATA), []);

  const [selectedDate, setSelectedDate] = useState(dailyGroups[0]?.date || '24 September 2026');
  const [activeSprintFilter, setActiveSprintFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Active selected date group
  const activeDateGroup = useMemo(() => {
    return dailyGroups.find(g => g.date === selectedDate) || dailyGroups[0];
  }, [dailyGroups, selectedDate]);

  // Packages to display inside the selected date
  const packagesToDisplay = useMemo(() => {
    if (!activeDateGroup) return [];
    if (activeSprintFilter === 'ALL') {
      return activeDateGroup.packages;
    }
    return activeDateGroup.packages.filter(p => p.id === activeSprintFilter);
  }, [activeDateGroup, activeSprintFilter]);

  // Filter daily groups based on search term
  const filteredDailyGroups = useMemo(() => {
    if (!searchTerm.trim()) return dailyGroups;
    const q = searchTerm.trim().toLowerCase();

    return dailyGroups.filter(group => {
      const matchDate = group.date.toLowerCase().includes(q);
      const matchTitle = group.title.toLowerCase().includes(q);
      const matchPackages = group.packages.some(pkg => {
        const inTitle = (pkg.title || '').toLowerCase().includes(q);
        const inDesc = (pkg.description || '').toLowerCase().includes(q);
        const inVer = (pkg.version || '').toLowerCase().includes(q);
        const inSemantic = (pkg.semanticVersion || '').toLowerCase().includes(q);
        const inSprint = (pkg.sprintLabel || '').toLowerCase().includes(q);
        const inMarkdown = (pkg.markdownContent || '').toLowerCase().includes(q);
        const inTable = (pkg.table || []).some(t => 
          (t.module || '').toLowerCase().includes(q) || (t.summary || '').toLowerCase().includes(q)
        );
        return inTitle || inDesc || inVer || inSemantic || inSprint || inMarkdown || inTable;
      });

      return matchDate || matchTitle || matchPackages;
    });
  }, [dailyGroups, searchTerm]);

  // When date is clicked, switch date & reset sub-sprint filter to 'ALL'
  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setActiveSprintFilter('ALL');
  };

  // Render markdown text lines cleanly and beautifully
  const renderMarkdownLines = (text) => {
    if (!text) return null;
    const lines = text.trim().split('\n');

    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} style={{ height: '6px' }} />;

      // Header 4
      if (trimmed.startsWith('#### ')) {
        return (
          <h4 key={idx} style={{
            fontSize: '13px',
            fontWeight: '800',
            color: '#38bdf8',
            marginTop: '14px',
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
            fontSize: '14px',
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
            fontSize: '15px',
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
            fontSize: '12px',
            color: 'var(--text-primary)',
            lineHeight: '1.7',
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
          fontSize: '12px',
          color: 'var(--text-muted)',
          lineHeight: '1.6',
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
            <span>DAILY-GROUPED CHANGELOG & ARCHIVAL REGISTRY</span>
          </div>

          <div style={{
            fontSize: '16px',
            fontWeight: '800',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📜 Histori Update Harian (Per Tanggal Kalender)</span>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(0, 208, 132, 0.15)',
              color: 'var(--accent-green)',
              border: '1px solid rgba(0, 208, 132, 0.4)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              Terbaru: {dailyGroups[0]?.date} ({dailyGroups[0]?.versionRange})
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
            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>TOTAL HARI RILIS</div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{dailyGroups.length} Tanggal</div>
          </div>
          <div style={{
            background: 'var(--bg-panel-subtle)',
            border: 'var(--border-muted)',
            padding: '6px 12px',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>TOTAL SPRINT / PAKET</div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-green)' }}>{CHANGELOG_DATA.length} Sprints</div>
          </div>
          <div style={{
            background: 'var(--bg-panel-subtle)',
            border: 'var(--border-muted)',
            padding: '6px 12px',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>STRUKTUR GROUPING</div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8' }}>Per Tanggal</div>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Layout: Date Selector on Left, Daily Roll-Up on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 300px) minmax(0, 1fr)',
        gap: '14px',
        alignItems: 'start'
      }}>
        
        {/* Left: Date Group List */}
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
            <span style={{ color: 'var(--accent-cyan)' }}>{filteredDailyGroups.length} Hari</span>
          </div>

          {/* Quick Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari tanggal/fitur/sprint..."
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

          {/* Date Selector Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            {filteredDailyGroups.map(group => {
              const isSelected = selectedDate === group.date;
              const isLatest = group.isLatest;

              return (
                <button
                  key={group.date}
                  onClick={() => handleSelectDate(group.date)}
                  className="telemetry-btn"
                  style={{
                    background: isSelected ? 'rgba(0, 208, 132, 0.12)' : 'var(--bg-panel-subtle)',
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
                      📅 {group.date}
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
                      {isLatest ? 'LATEST' : `${group.count} RILIS`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span>{group.versionRange}</span>
                    <span style={{ opacity: 0.7 }}>
                      {group.count > 1 ? `${group.count} Sprints Tergabung` : '1 Sesi Rilis'}
                    </span>
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
            💡 Seluruh update, sprint, dan paket perubahan dikelompokkan per tanggal kalender sesuai standar <strong>CHANGELOG.md</strong>.
          </div>
        </div>

        {/* Right: Daily Roll-Up Canvas (Merangkum SEMUA update pada tanggal tersebut) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
          
          {/* A. Master Date Header Banner */}
          <div className="telemetry-panel" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-green)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <div>
                <div style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ color: 'var(--accent-green)', fontWeight: '800' }}>TANGGAL KALENDER // HARIAN</span>
                  <span>•</span>
                  <span>{activeDateGroup.date}</span>
                </div>

                <h1 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '800',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)'
                }}>
                  📅 Rekapitulasi Rilis: {activeDateGroup.date}
                </h1>
              </div>

              {/* Status and Version Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '800',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  background: activeDateGroup.isLatest ? 'rgba(0, 208, 132, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                  color: activeDateGroup.isLatest ? 'var(--accent-green)' : 'var(--text-muted)',
                  border: `1px solid ${activeDateGroup.isLatest ? 'var(--accent-green)' : 'var(--border-muted)'}`
                }}>
                  {activeDateGroup.status} • {activeDateGroup.versionRange}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '800',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}>
                  {activeDateGroup.count} SPRINT / PAKET
                </span>
              </div>
            </div>

            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
              {activeDateGroup.title}
            </div>

            <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Halaman ini merangkum seluruh pembaruan arsitektur, sprint quant, perbaikan antarmuka (UI/UX), kepatuhan, dan integrasi yang di-push pada tanggal <strong>{activeDateGroup.date}</strong>.
            </p>
          </div>

          {/* B. Sub-Sprint Quick Filter Pills (Jika dalam 1 tanggal ada lebih dari 1 paket/sprint) */}
          {activeDateGroup.packages.length > 1 && (
            <div className="telemetry-panel" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
                Filter Sub-Sprint:
              </span>

              {/* Show All Button */}
              <button
                onClick={() => setActiveSprintFilter('ALL')}
                style={{
                  background: activeSprintFilter === 'ALL' ? 'var(--accent-green)' : 'rgba(255, 255, 255, 0.04)',
                  color: activeSprintFilter === 'ALL' ? '#000000' : 'var(--text-secondary)',
                  border: activeSprintFilter === 'ALL' ? '1px solid var(--accent-green)' : 'var(--border-muted)',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                🌟 Tampilkan Semua Update Hari Ini ({activeDateGroup.packages.length} Rilis)
              </button>

              {/* Individual Sprint Buttons */}
              {activeDateGroup.packages.map((pkg) => {
                const isBtnActive = activeSprintFilter === pkg.id;
                const label = pkg.sprintLabel || `${pkg.semanticVersion} • ${pkg.version}`;

                return (
                  <button
                    key={pkg.id}
                    onClick={() => setActiveSprintFilter(pkg.id)}
                    style={{
                      background: isBtnActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: isBtnActive ? '#38bdf8' : 'var(--text-muted)',
                      border: isBtnActive ? '1px solid #38bdf8' : 'var(--border-muted)',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: isBtnActive ? '800' : '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* C. Chronological Sprint Stack (Menampilkan seluruh rilis pada hari tersebut) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {packagesToDisplay.map((pkg, pIdx) => (
              <div
                key={pkg.id}
                className="telemetry-panel"
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderTop: pIdx > 0 ? '2px solid rgba(56, 189, 248, 0.3)' : undefined
                }}
              >
                {/* Sprint Header Badge */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  borderBottom: 'var(--border-muted)',
                  paddingBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '800',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-green)'
                    }}>
                      # {pkg.version}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.3)'
                    }}>
                      {pkg.semanticVersion}
                    </span>
                    {pkg.sprintLabel && (
                      <span style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '700',
                        color: 'var(--text-secondary)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: 'var(--border-muted)'
                      }}>
                        {pkg.sprintLabel}
                      </span>
                    )}
                  </div>

                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    ID: {pkg.id}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h2 style={{
                    margin: '0 0 6px 0',
                    fontSize: '15px',
                    fontWeight: '800',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: '1.4'
                  }}>
                    {pkg.title}
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: '12.5px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.65'
                  }}>
                    {pkg.description}
                  </p>
                </div>

                {/* Process Flow Pipeline */}
                {pkg.processFlow && pkg.processFlow.length > 0 && (
                  <div style={{
                    background: 'var(--bg-panel-subtle)',
                    border: 'var(--border-muted)',
                    borderRadius: '8px',
                    padding: '12px 14px'
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
                      <span>Diagram Alur Proses Evolusi ({pkg.processFlow.length} Tahapan)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {pkg.processFlow.map((step, sIdx) => (
                        <React.Fragment key={sIdx}>
                          <div style={{
                            background: sIdx === pkg.processFlow.length - 1 ? 'rgba(0, 208, 132, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                            border: sIdx === pkg.processFlow.length - 1 ? '1px solid var(--accent-green)' : 'var(--border-muted)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              color: sIdx === pkg.processFlow.length - 1 ? 'var(--accent-green)' : 'var(--text-primary)'
                            }}>
                              {step.step}
                            </div>
                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {step.label}
                            </div>
                          </div>

                          {sIdx < pkg.processFlow.length - 1 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>➔</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* Markdown Content Lines */}
                <div>
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    {renderMarkdownLines(pkg.markdownContent)}
                  </ul>
                </div>

                {/* Impacted Modules Table */}
                {pkg.table && pkg.table.length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    <h3 style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      color: '#38bdf8',
                      marginBottom: '8px',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      📊 Tabel Status Modul Terdampak ({pkg.table.length} Komponen)
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
                          {pkg.table.map((row, rIdx) => (
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
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
