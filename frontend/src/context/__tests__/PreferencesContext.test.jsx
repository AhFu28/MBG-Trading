import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { PreferencesProvider, usePreferences, LANGUAGES } from '../PreferencesContext.jsx';

/**
 * Tests for the language and appearance preferences requested on 2026-10-08:
 *   "Account (Setting, Mode [Dark/Lab], Languange
 *    [English/ID/Chinese/Japan/Korean])"
 *
 * The important property to pin is the FALLBACK: an untranslated screen must
 * render its original text, never a raw key like "nav.home". Getting that wrong
 * would visibly break every desk the moment a user switches language.
 */

function makeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

function Probe() {
  const { language, setLanguage, t } = usePreferences();
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="known">{t('nav.home', 'Home')}</span>
      <span data-testid="unknown">{t('some.untranslated.key', 'Teks Asli')}</span>
      <button onClick={() => setLanguage('en')}>to-en</button>
      <button onClick={() => setLanguage('ja')}>to-ja</button>
      <button onClick={() => setLanguage('ko')}>to-ko</button>
      <button onClick={() => setLanguage('zh')}>to-zh</button>
      <button onClick={() => setLanguage('id')}>to-id</button>
    </div>
  );
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage());
  document.documentElement.removeAttribute('lang');
});

describe('language catalogue', () => {
  it('offers exactly the five requested languages', () => {
    // "English/ID/Chinese/Japan/Korean"
    expect(LANGUAGES.map(l => l.code)).toEqual(['id', 'en', 'zh', 'ja', 'ko']);
  });

  it('gives every language a label and a short code', () => {
    for (const l of LANGUAGES) {
      expect(l.label).toBeTruthy();
      expect(l.short).toBeTruthy();
      expect(l.flag).toBeTruthy();
    }
  });
});

describe('defaults and persistence', () => {
  it('defaults to Indonesian', () => {
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    expect(screen.getByTestId('lang').textContent).toBe('id');
  });

  it('restores a previously chosen language', () => {
    vi.stubGlobal('localStorage', makeStorage({ mbg_language: 'ja' }));
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    expect(screen.getByTestId('lang').textContent).toBe('ja');
  });

  it('ignores a stored value that is not a supported language', () => {
    // A hand-edited or legacy value must not break the UI.
    vi.stubGlobal('localStorage', makeStorage({ mbg_language: 'klingon' }));
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    expect(screen.getByTestId('lang').textContent).toBe('id');
  });

  it('saves the choice when the user switches', () => {
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    act(() => { screen.getByText('to-ja').click(); });
    expect(localStorage.getItem('mbg_language')).toBe('ja');
  });

  it('syncs the document lang attribute for screen readers', () => {
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    act(() => { screen.getByText('to-ko').click(); });
    expect(document.documentElement.getAttribute('lang')).toBe('ko');
  });
});

describe('translation and fallback', () => {
  it('returns the source text in Indonesian, the primary language', () => {
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    expect(screen.getByTestId('known').textContent).toBe('Home');
  });

  it('translates a known key once a language is chosen', () => {
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    act(() => { screen.getByText('to-en').click(); });
    expect(screen.getByTestId('known').textContent).toBe('Home');
  });

  it('translates to Japanese', () => {
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    act(() => { screen.getByText('to-ja').click(); });
    expect(screen.getByTestId('known').textContent).toBe('ホーム');
  });

  it('translates to Korean', () => {
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    act(() => { screen.getByText('to-ko').click(); });
    expect(screen.getByTestId('known').textContent).toBe('홈');
  });

  it('translates to Chinese', () => {
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    act(() => { screen.getByText('to-zh').click(); });
    expect(screen.getByTestId('known').textContent).toBe('首页');
  });

  it('falls back to the original text for an untranslated key', () => {
    // This is what keeps a partially translated app usable.
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    act(() => { screen.getByText('to-ja').click(); });
    expect(screen.getByTestId('unknown').textContent).toBe('Teks Asli');
  });

  it('never renders a raw key as visible text', () => {
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    act(() => { screen.getByText('to-zh').click(); });
    expect(screen.getByTestId('unknown').textContent).not.toContain('.');
  });

  it('returns to Indonesian text when switching back', () => {
    render(<PreferencesProvider><Probe /></PreferencesProvider>);
    act(() => { screen.getByText('to-ja').click(); });
    act(() => { screen.getByText('to-id').click(); });
    expect(screen.getByTestId('known').textContent).toBe('Home');
  });
});

describe('without a provider', () => {
  it('still works, falling back to Indonesian', () => {
    // A component adopting t() before the tree is wrapped must not crash.
    render(<Probe />);
    expect(screen.getByTestId('lang').textContent).toBe('id');
    expect(screen.getByTestId('known').textContent).toBe('Home');
  });
});
