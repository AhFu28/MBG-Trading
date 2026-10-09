import React, { useState, useEffect } from 'react';
import { SECTION_ORDER, CLAIM_TYPES } from '../services/researchTemplate.js';

/**
 * RESEARCH DESK — catalog + paper reader (P-8 P0c).
 *
 * Reads /api/research/reports (session-gated). Before the Supabase schema runs,
 * the endpoint honestly serves the bundled sample paper with
 * X-Data-Source: sample-fallback — this surface shows that label plainly and
 * never dresses a pilot up as a live catalog.
 *
 * The reader renders the mandatory 14-section template: content blocks, typed
 * claims with evidence status, and locators — a material claim without evidence
 * shows its reason, never a plausible-looking number.
 */
export default function ResearchDeskTab() {
  const [catalog, setCatalog] = useState([]);
  const [paper, setPaper] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('metadata');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/research/reports', { credentials: 'same-origin' });
        if (!res.ok) {
          throw new Error('HTTP ' + res.status);
        }
        const list = await res.json();
        if (cancelled) return;
        setCatalog(Array.isArray(list) ? list : []);
        setDataSource(res.headers.get('X-Data-Source'));
        // load the first paper fully
        const first = Array.isArray(list) ? list[0] : null;
        if (first?.slug) {
          const res2 = await fetch('/api/research/reports?slug=' + encodeURIComponent(first.slug), { credentials: 'same-origin' });
          if (res2.ok && !cancelled) {
            setPaper(await res2.json());
            setDataSource(res2.headers.get('X-Data-Source'));
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const openPaper = async (slug) => {
    try {
      setLoading(true);
      const res = await fetch('/api/research/reports?slug=' + encodeURIComponent(slug), { credentials: 'same-origin' });
      if (res.ok) {
        setPaper(await res.json());
        setDataSource(res.headers.get('X-Data-Source'));
        setActiveSection('metadata');
      }
    } finally {
      setLoading(false);
    }
  };

  const backToCatalog = () => { setPaper(null); setActiveSection('metadata'); };

  const stateBadge = (state) => {
    const map = {
      draft: { bg: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)' },
      review: { bg: 'rgba(234, 179, 8, 0.15)', color: 'var(--accent-gold)' },
      approved: { bg: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-sky)' },
      published: { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' },
    };
    const s = map[state] || map.draft;
    return <span style={{ fontSize: '12px', fontWeight: 800, padding: '1px 8px', borderRadius: '4px', background: s.bg, color: s.color, textTransform: 'uppercase' }}>{state || 'draft'}</span>;
  };

  const claimBadge = (claim) => {
    const t = claim.claim_type;
    const colors = {
      fact: 'var(--accent-sky)',
      derived: 'var(--accent-emerald)',
      inference: 'var(--accent-purple)',
      scenario: 'var(--accent-gold)',
      illustration: 'var(--text-muted)',
    };
    return (
      <span title={CLAIM_TYPES[t] || t} style={{ fontSize: '12px', fontWeight: 800, padding: '1px 7px', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.1)', color: colors[t] || 'var(--text-muted)', textTransform: 'uppercase' }}>
        {t}
      </span>
    );
  };

  const evidenceBadge = (claim) => {
    if (claim.evidence_status === 'sourced') {
      return <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-emerald)' }}>🛡️ bersumber</span>;
    }
    if (claim.evidence_status === 'missing') {
      return <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-amber)' }}>⚠️ tanpa bukti — alasan tercatat</span>;
    }
    return <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>⏳ menunggu bukti</span>;
  };

  const renderBlock = (block, i) => {
    if (block.type === 'paragraph') {
      return <p key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 10px 0' }}>{block.text}</p>;
    }
    if (block.type === 'formula') {
      return (
        <div key={i} style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', borderRadius: '8px', padding: '10px 14px', marginBottom: '10px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
          📐 {block.text}
        </div>
      );
    }
    if (block.type === 'table') {
      const cols = block.rows && block.rows[0] ? Object.keys(block.rows[0]) : [];
      return (
        <div key={i} style={{ overflowX: 'auto', marginBottom: '10px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{block.caption}</div>
          <table className="quant-table" style={{ fontSize: '12px', width: '100%' }}>
            <thead><tr style={{ borderBottom: 'var(--border-muted)', textAlign: 'left' }}>
              {cols.map((c) => <th key={c} style={{ padding: '6px 10px' }}>{c}</th>)}
            </tr></thead>
            <tbody>
              {block.rows.map((row, j) => (
                <tr key={j} style={{ borderBottom: 'var(--border-hairline)' }}>
                  {cols.map((c) => <td key={c} style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{row[c]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (block.type === 'list') {
      return (
        <ul key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 10px 0', paddingLeft: '20px' }}>
          {block.items.map((it, j) => <li key={j} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{it}</li>)}
        </ul>
      );
    }
    if (block.type === 'kv') {
      return (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '10px' }}>
          {Object.entries(block.items || {}).map(([k, v]) => (
            <div key={k} style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', borderRadius: '6px', padding: '8px 10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{v == null ? '—' : String(v)}</div>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderClaim = (claim) => (
    <div key={claim.id} style={{ background: 'var(--bg-panel-subtle)', border: 'var(--border-hairline)', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
        {claimBadge(claim)}
        {evidenceBadge(claim)}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{claim.text}</div>
      {claim.evidence_status === 'missing' && claim.missing_reason && (
        <div style={{ fontSize: '12px', color: 'var(--accent-amber)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
          alasan tidak ada bukti: {claim.missing_reason}
        </div>
      )}
      {Array.isArray(claim.evidence) && claim.evidence.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
          {claim.evidence.map((e, j) => (
            <span key={j} title={e.locator} style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-sky)', background: 'rgba(59, 130, 246, 0.08)', padding: '2px 7px', borderRadius: '4px', cursor: 'help' }}>
              📎 {e.source}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>📚</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>RESEARCH DESK — KATALOG RISET</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Paper bergaya jurnal: 14 section wajib · klaim bertipe · bukti dengan locator · review manusia wajib sebelum terbit
            </div>
          </div>
        </div>
        {dataSource && (
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', padding: '3px 9px', borderRadius: '4px', background: dataSource === 'sample-fallback' ? 'rgba(234, 179, 8, 0.12)' : 'rgba(16, 185, 129, 0.12)', color: dataSource === 'sample-fallback' ? 'var(--accent-gold)' : 'var(--accent-emerald)' }} title="Sumber data katalog">
            {dataSource === 'sample-fallback' ? '📋 PAPER PILOT (sample) — schema riset belum dijalankan' : dataSource === 'supabase-live' ? '🟢 LIVE dari Supabase' : dataSource}
          </span>
        )}
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: 'var(--accent-red)' }}>
          Gagal memuat katalog riset ({error}) — coba lagi nanti.
        </div>
      )}
      {loading && !paper && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px 0' }}>Memuat katalog…</div>
      )}

      {/* Catalog */}
      {!paper && catalog.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
          {catalog.map((r) => (
            <button key={r.slug} onClick={() => openPaper(r.slug)} style={{ textAlign: 'left', background: 'var(--bg-panel)', border: 'var(--border-hairline)', borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {stateBadge(r.state)}
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{r.report_type}</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4 }}>{r.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>cutoff {r.data_cutoff || '—'}</div>
            </button>
          ))}
        </div>
      )}

      {/* Paper reader */}
      {paper && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} className="research-print-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={backToCatalog} className="telemetry-btn no-print" style={{ fontSize: '12px', padding: '4px 12px' }}>
              ← Kembali ke katalog
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="telemetry-btn no-print"
              style={{ fontSize: '12px', padding: '4px 12px', background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.35)', color: 'var(--accent-sky)' }}
            >
              🖨️ Cetak / Ekspor PDF
            </button>
          </div>

          <div style={{ background: 'var(--bg-panel)', border: 'var(--border-hairline)', borderRadius: '10px', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {stateBadge(paper.report?.state)}
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>edisi {paper.report?.edition_no} · {paper.report?.language}</span>
            </div>
            <h2 style={{ fontSize: '19px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.02em', lineHeight: 1.3 }}>{paper.metadata?.title}</h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {paper.metadata?.author} · reviewer: {paper.metadata?.reviewer} · cutoff {paper.metadata?.data_cutoff}
            </div>
          </div>

          {/* Section TOC */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {SECTION_ORDER.map((s) => (
              <button key={s.key} onClick={() => setActiveSection(s.key)} className={'quant-pill-btn' + (activeSection === s.key ? ' active' : '')} style={{ fontSize: '12px', padding: '3px 9px' }}>
                {s.no}. {s.title}
              </button>
            ))}
          </div>

          {/* Sections */}
          {paper.sections?.filter((s) => s.section_key === activeSection).map((s) => {
            const meta = SECTION_ORDER.find((x) => x.key === s.section_key);
            return (
              <div key={s.section_key} style={{ background: 'var(--bg-panel)', border: 'var(--border-hairline)', borderRadius: '10px', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--accent-sky)', fontFamily: 'var(--font-mono)' }}>{String(meta?.no).padStart(2, '0')}</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{meta?.title}</h3>
                </div>
                {(s.content_blocks || []).map(renderBlock)}
                {(s.claims || []).length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Klaim & bukti</div>
                    {s.claims.map(renderClaim)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Manifests */}
          {paper.manifests && (
            <div style={{ background: 'var(--bg-panel)', border: 'var(--border-hairline)', borderRadius: '10px', padding: '16px 18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Manifest kalkulasi (deterministik)</div>
              {Object.entries(paper.manifests).map(([k, m]) => (
                <div key={k} style={{ background: 'var(--bg-panel-subtle)', borderRadius: '6px', padding: '8px 10px', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{k}</strong> — {m.formula} → {JSON.stringify(m.outputs)} ({m.state})
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
