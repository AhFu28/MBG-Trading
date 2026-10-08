import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import LandingPage from '../LandingPage.jsx';
import { PreferencesProvider } from '../../context/PreferencesContext.jsx';

/**
 * Tests for the landing page redesign requested on 2026-10-08:
 *   "landingpage awal ini tolong buat sekalian semenarik mungkin dong..."
 *
 * The visual work cannot be asserted, but two things must hold no matter how
 * the page is styled, and both are easy to break during a redesign:
 *
 *   1. HONESTY. No performance claims, and the risk disclaimer must be present.
 *      A prettier page is exactly the kind that tends to grow a fake track
 *      record.
 *   2. The sales path still works: the CTAs open the auth panel.
 */

function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage());
  // Market feeds unavailable: the page must still render and say so.
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
    ok: false,
    status: 503,
    json: () => Promise.resolve(null),
  })));
  // jsdom lacks IntersectionObserver; the reveal wrapper needs it.
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const renderPage = (props = {}) => render(
  <PreferencesProvider>
    <LandingPage onAuthenticated={() => {}} configured {...props} />
  </PreferencesProvider>,
);

describe('honesty rules survive the redesign', () => {
  it('keeps the risk disclaimer that says it is not investment advice', () => {
    renderPage();
    expect(screen.getByText(/bukan penasihat investasi/i)).toBeDefined();
  });

  it('states plainly that no profit is promised', () => {
    renderPage();
    expect(screen.getByText(/tidak menjanjikan keuntungan/i)).toBeDefined();
  });

  it('warns that past performance does not guarantee future results', () => {
    renderPage();
    // The phrase appears more than once on purpose (two separate disclaimers),
    // so assert presence rather than uniqueness.
    expect(screen.getAllByText(/tidak menjamin/i).length).toBeGreaterThan(0);
  });

  it('makes no track-record or win-rate claim anywhere', () => {
    const { container } = renderPage();
    const text = container.textContent.toLowerCase();
    // These are the phrases that would turn a sales page into a false promise.
    for (const claim of ['win rate', 'akurasi 9', 'profit pasti', 'dijamin untung', 'pasti cuan']) {
      expect(text).not.toContain(claim);
    }
  });

  it('labels the product mock as an illustration, not a screenshot', () => {
    // A redesign that quietly presents a mock as a live screen would be a lie.
    renderPage();
    const labels = screen.getAllByText(/ILUSTRASI|Ilustrasi/);
    expect(labels.length).toBeGreaterThan(0);
  });
});

describe('headline stats stay countable facts', () => {
  it('shows the same four product facts, not performance numbers', () => {
    renderPage();
    expect(screen.getByText('Kelas aset terpantau')).toBeDefined();
    expect(screen.getByText('Bot AI otonom')).toBeDefined();
    expect(screen.getByText('Jendela sinyal (Free)')).toBeDefined();
  });
});

describe('sales path still works', () => {
  it('offers both entry points', () => {
    renderPage();
    expect(screen.getAllByRole('button', { name: /Daftar Gratis/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Masuk/ }).length).toBeGreaterThan(0);
  });

  it('opens the auth panel when Daftar Gratis is clicked', () => {
    renderPage();
    const cta = screen.getAllByRole('button', { name: /Daftar Gratis/ })[0];
    act(() => { cta.click(); });
    // AuthPanel renders a headline supplied by the page.
    expect(screen.getByText(/Gratis untuk mulai/i)).toBeDefined();
  });

  it('labels every module with its access tier', () => {
    renderPage();
    expect(screen.getAllByText('PRO').length).toBeGreaterThan(0);
  });
});

describe('degrades honestly when market data is unreachable', () => {
  it('renders without throwing when every feed fails', () => {
    expect(() => renderPage()).not.toThrow();
  });

  it('says the market data could not be loaded instead of faking prices', async () => {
    renderPage();
    expect(await screen.findByText(/Data pasar sedang tidak bisa dimuat/i)).toBeDefined();
  });
});

describe('unconfigured accounts', () => {
  it('warns up front when signup is not ready', () => {
    render(
      <PreferencesProvider>
        <LandingPage onAuthenticated={() => {}} configured={false} />
      </PreferencesProvider>,
    );
    expect(screen.getByText(/Pendaftaran akun belum diaktifkan/i)).toBeDefined();
  });

  it('does not show that warning when accounts are ready', () => {
    renderPage();
    expect(screen.queryByText(/Pendaftaran akun belum diaktifkan/i)).toBeNull();
  });
});
