import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ResearchDeskTab from '../ResearchDeskTab.jsx';

const mockCatalog = [
  {
    slug: 'idx-strategy-study-sample',
    title: 'Studi Strategi IDX Sample',
    report_type: 'strategy_study',
    state: 'draft',
    edition_no: 1,
  },
];

const mockPaper = {
  report: {
    slug: 'idx-strategy-study-sample',
    report_type: 'strategy_study',
    state: 'draft',
    edition_no: 1,
  },
  metadata: {
    title: 'Studi Strategi IDX Sample',
    data_cutoff: '2026-10-08T17:10:57Z',
    instruments: 'IDX equities',
    venue: 'BEI',
  },
  sections: [
    {
      section_key: 'metadata',
      claims: [
        { id: 'c1', claim_type: 'fact', evidence_status: 'sourced', text: 'Data bersumber langsung dari IDX.' },
      ],
      content_blocks: [
        { type: 'paragraph', text: 'Analisis empiris portofolio kuantitatif pasar saham Indonesia.' },
        { type: 'formula', text: 'Kelly% = W - (1-W)/R' },
      ],
    },
  ],
};

describe('ResearchDeskTab', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      const u = String(url);
      if (u.includes('slug=')) {
        return Promise.resolve({
          ok: true,
          headers: new Headers({ 'X-Data-Source': 'sample-fallback' }),
          json: () => Promise.resolve(mockPaper),
        });
      }
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'X-Data-Source': 'sample-fallback' }),
        json: () => Promise.resolve(mockCatalog),
      });
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading indicator initially', () => {
    render(<ResearchDeskTab />);
    expect(screen.getByText(/Memuat katalog/i)).toBeDefined();
  });

  it('renders the paper title and honest sample fallback banner', async () => {
    render(<ResearchDeskTab />);

    const title = await screen.findByText('Studi Strategi IDX Sample');
    expect(title).toBeDefined();

    // Honest banner indicating pre-schema pilot / sample fallback
    expect(screen.getByText(/PAPER PILOT \(sample\)/i)).toBeDefined();
  });

  it('renders claims, claim badges, and evidence badges', async () => {
    render(<ResearchDeskTab />);

    const claim = await screen.findByText(/Data bersumber langsung dari IDX/i);
    expect(claim).toBeDefined();

    // Claim badge and evidence status
    expect(screen.getByText('fact')).toBeDefined();
    expect(screen.getByText(/🛡️ bersumber/i)).toBeDefined();
  });

  it('renders formulas and paragraphs properly', async () => {
    render(<ResearchDeskTab />);

    const para = await screen.findByText(/Analisis empiris portofolio kuantitatif/i);
    expect(para).toBeDefined();

    expect(screen.getByText(/Kelly% = W - \(1-W\)\/R/i)).toBeDefined();
  });

  it('handles fetch failure honestly without crashing', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));

    render(<ResearchDeskTab />);

    const err = await screen.findByText(/Gagal memuat katalog riset/i);
    expect(err).toBeDefined();
    expect(screen.getByText(/Network error/i)).toBeDefined();
  });
});
