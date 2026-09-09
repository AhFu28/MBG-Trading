import React, { useState } from 'react';

export default function NewsTab({ liveNews = [], macro = {} }) {
  const [newsFilter, setNewsFilter] = useState('ALL');
  const [newsSearch, setNewsSearch] = useState('');

  const items = Array.isArray(liveNews) ? liveNews : [];
  const categories = ['ALL', 'IHSG', 'METALS', 'ENERGY', 'BANKING', 'MACRO'];

  const filteredNews = items.filter(item => {
    const matchesSearch = !newsSearch || 
      (item.title && item.title.toLowerCase().includes(newsSearch.toLowerCase())) ||
      (item.source && item.source.toLowerCase().includes(newsSearch.toLowerCase())) ||
      (item.summary && item.summary.toLowerCase().includes(newsSearch.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (newsFilter === 'ALL') return true;
    const tag = (item.tag || item.category || '').toUpperCase();
    return tag.includes(newsFilter);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* News Controls Bar */}
      <div style={{
        padding: '10px 14px',
        background: 'var(--bg-panel)',
        border: 'var(--border-muted)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setNewsFilter(cat)}
              className={'telemetry-btn ' + (newsFilter === cat ? 'active' : '')}
              style={{ fontSize: '10px', padding: '4px 10px' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Real-time search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type='text'
            placeholder='Cari berita atau emiten...'
            value={newsSearch}
            onChange={e => setNewsSearch(e.target.value)}
            style={{
              padding: '5px 8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              border: 'var(--border-muted)',
              background: 'var(--bg-canvas)',
              color: 'var(--text-primary)',
              outline: 'none',
              width: '200px'
            }}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            ({filteredNews.length} Berita)
          </span>
        </div>
      </div>

      {/* Breaking Flash Banner if exists */}
      {macro && macro.headline && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-panel)',
          borderLeft: '4px solid var(--accent-orange)',
          borderTop: 'var(--border-muted)',
          borderRight: 'var(--border-muted)',
          borderBottom: 'var(--border-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className='badge' style={{ background: 'var(--accent-orange)', color: '#fff', fontSize: '9px', fontWeight: '700' }}>
              BREAKING FLASH
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {macro.source || 'Macro Desk'} · {new Date(macro.updated_at || Date.now()).toLocaleTimeString('id-ID')} WIB
            </span>
          </div>
          <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            ⚡ {macro.headline}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            {macro.full_narrative}
          </p>
        </div>
      )}

      {/* News Grid Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '12px'
      }}>
        {filteredNews.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '36px',
            background: 'var(--bg-panel)',
            border: 'var(--border-muted)',
            color: 'var(--text-muted)'
          }}>
            Tidak ada berita yang sesuai dengan filter atau pencarian saat ini.
          </div>
        ) : (
          filteredNews.map((news, idx) => (
            <div
              key={news.id || idx}
              style={{
                background: 'var(--bg-panel)',
                border: 'var(--border-muted)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div>
                {/* News Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className='badge' style={{ fontSize: '9px', background: 'var(--bg-panel-subtle)', color: 'var(--text-primary)' }}>
                    {news.source || 'WIRE'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {news.published_str || news.pub_date || 'Baru saja'}
                  </span>
                </div>

                {/* News Title */}
                <h4 style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  margin: '4px 0 6px 0',
                  lineHeight: 1.35
                }}>
                  {news.title}
                </h4>

                {/* News Summary */}
                {news.summary && (
                  <p style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    margin: 0,
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {news.summary}
                  </p>
                )}
              </div>

              {/* News Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '6px',
                borderTop: 'var(--border-muted)',
                marginTop: '4px'
              }}>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  TAG: <strong style={{ color: 'var(--accent-blue)' }}>{news.tag || 'MARKET'}</strong>
                </span>
                {(news.url || news.link) ? (
                  <a
                    href={news.url || news.link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='telemetry-btn'
                    style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    BACA BERITA ↗
                  </a>
                ) : (
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Internal Wire</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}