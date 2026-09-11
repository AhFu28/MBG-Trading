import React, { useState, useMemo } from 'react';
import { CHANGELOG_DATA } from '../data/changelogData.js';

export default function ChangelogTab() {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logic
  const filteredReleases = useMemo(() => {
    let list = CHANGELOG_DATA;

    if (selectedFilter !== 'ALL') {
      list = list.filter(pkg => pkg.id === selectedFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(pkg => {
        const inTitle = pkg.title.toLowerCase().includes(q);
        const inDesc = pkg.description.toLowerCase().includes(q);
        const inVersion = pkg.version.toLowerCase().includes(q);
        const inHighlights = (pkg.highlights || []).some(h => 
          h.title.toLowerCase().includes(q) || h.desc.toLowerCase().includes(q) || h.tag.toLowerCase().includes(q)
        );
        const inCategories = (pkg.categories || []).some(cat => 
          cat.categoryTitle.toLowerCase().includes(q) || (cat.items || []).some(item => item.toLowerCase().includes(q))
        );
        return inTitle || inDesc || inVersion || inHighlights || inCategories;
      });
    }

    return list;
  }, [selectedFilter, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '24px' }}>
      
      {/* 1. Header Banner */}
      <div className="telemetry-panel" style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: 'var(--accent-green)', fontWeight: '800' }}>MBG APEX</span>
            <span style={{ opacity: 0.4 }}>//</span>
            <span>SYSTEM CHANGELOG & VERSION REGISTRY</span>
          </div>

          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '800',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span>📜 Histori Update & Catatan Rilis</span>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(0, 208, 132, 0.15)',
              color: 'var(--accent-green)',
              border: '1px solid rgba(0, 208, 132, 0.4)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              Active: {CHANGELOG_DATA[0]?.version || 'Update Package'}
            </span>
          </h2>

          <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Transparansi siklus pembaruan fitur, optimasi engine kuantitatif, dan arsitektur sistem MBG Trading Intelligence Cockpit.
          </p>
        </div>

        {/* Telemetry Quick Badges */}
        <div style={{ display: 'flex', gap: '8px', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
          <div style={{
            background: 'var(--bg-panel-subtle)',
            border: 'var(--border-muted)',
            padding: '8px 12px',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TOTAL PAKET</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>{CHANGELOG_DATA.length} Releases</div>
          </div>
          <div style={{
            background: 'var(--bg-panel-subtle)',
            border: 'var(--border-muted)',
            padding: '8px 12px',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RUNTIME COST</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-green)' }}>Rp 0 (Serverless)</div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Toolbar */}
      <div className="telemetry-panel" style={{
        padding: '10px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Package Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedFilter('ALL')}
            className="telemetry-btn"
            style={{
              background: selectedFilter === 'ALL' ? 'var(--accent-green)' : 'var(--bg-panel-subtle)',
              color: selectedFilter === 'ALL' ? '#ffffff' : 'var(--text-primary)',
              borderColor: selectedFilter === 'ALL' ? 'var(--accent-green)' : 'var(--border-color)',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: '700'
            }}
          >
            SEMUA PAKET ({CHANGELOG_DATA.length})
          </button>

          {CHANGELOG_DATA.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => setSelectedFilter(pkg.id)}
              className="telemetry-btn"
              style={{
                background: selectedFilter === pkg.id ? 'var(--accent-green)' : 'var(--bg-panel-subtle)',
                color: selectedFilter === pkg.id ? '#ffffff' : 'var(--text-primary)',
                borderColor: selectedFilter === pkg.id ? 'var(--accent-green)' : 'var(--border-color)',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              {pkg.status === 'LATEST' ? '🚀 ' : '📦 '}{pkg.version.toUpperCase()} {pkg.status === 'LATEST' ? '(AKTIF)' : ''}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div style={{ minWidth: '220px', flex: '1 1 200px', maxWidth: '340px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari fitur, telegram, engine, makro..."
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
        </div>
      </div>

      {/* 3. Timeline / Release Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredReleases.length === 0 ? (
          <div className="telemetry-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Tidak ada catatan rilis yang cocok dengan filter pencarian "{searchTerm}".
          </div>
        ) : (
          filteredReleases.map(pkg => {
            const isLatest = pkg.status === 'LATEST';

            return (
              <div
                key={pkg.id}
                className="telemetry-panel"
                style={{
                  padding: '20px',
                  borderRadius: '8px',
                  border: isLatest ? '1px solid rgba(0, 208, 132, 0.4)' : 'var(--border-color)',
                  boxShadow: isLatest ? '0 0 16px rgba(0, 208, 132, 0.08)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                {/* Header Package Card */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '10px',
                  borderBottom: 'var(--border-muted)',
                  paddingBottom: '12px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '16px',
                        fontWeight: '800',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {pkg.version}
                      </span>

                      <span style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: isLatest ? 'rgba(0, 208, 132, 0.15)' : 'var(--bg-panel-subtle)',
                        color: isLatest ? 'var(--accent-green)' : 'var(--text-muted)',
                        border: isLatest ? '1px solid rgba(0, 208, 132, 0.4)' : 'var(--border-muted)'
                      }}>
                        {pkg.badgeLabel}
                      </span>

                      <span style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        • {pkg.date}
                      </span>
                    </div>

                    <div style={{
                      marginTop: '4px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: 'var(--text-primary)'
                    }}>
                      {pkg.title}
                    </div>
                  </div>

                  <div style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-panel-subtle)',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    TAG: {pkg.semanticVersion}
                  </div>
                </div>

                {/* Description */}
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, var(--text-primary))', lineHeight: '1.6' }}>
                  {pkg.description}
                </div>

                {/* Consolidated Baseline Notice (For Initial Launch Package) */}
                {pkg.consolidatedNotice && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    color: 'var(--accent-amber)',
                    lineHeight: '1.5'
                  }}>
                    <strong>{pkg.consolidatedNotice}</strong>
                  </div>
                )}

                {/* Highlights Grid (For Update Package 10092026) */}
                {pkg.highlights && pkg.highlights.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '12px',
                    marginTop: '4px'
                  }}>
                    {pkg.highlights.map((h, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'var(--bg-panel-subtle)',
                          border: 'var(--border-muted)',
                          borderRadius: '6px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '16px' }}>{h.icon}</span>
                          <span style={{
                            fontSize: '9px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: '800',
                            padding: '1px 6px',
                            borderRadius: '3px',
                            background: 'rgba(255,255,255,0.05)',
                            color: h.tagColor || 'var(--accent-green)',
                            border: `1px solid ${h.tagColor || 'var(--accent-green)'}`
                          }}>
                            {h.tag}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {h.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                          {h.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Categories Breakdown (For Initial Launch Package) */}
                {pkg.categories && pkg.categories.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '12px',
                    marginTop: '4px'
                  }}>
                    {pkg.categories.map((cat, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-panel-subtle)',
                          border: 'var(--border-muted)',
                          borderRadius: '6px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          fontFamily: 'var(--font-mono)',
                          color: cat.color || 'var(--text-primary)',
                          borderBottom: 'var(--border-muted)',
                          paddingBottom: '6px'
                        }}>
                          <span>{cat.icon}</span>
                          <span>{cat.categoryTitle}</span>
                        </div>

                        <ul style={{
                          margin: 0,
                          paddingLeft: '18px',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          lineHeight: '1.4'
                        }}>
                          {cat.items.map((item, itemIdx) => (
                            <li key={itemIdx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
