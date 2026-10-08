import React from 'react';
import { DashPanel } from './cmc/CmcPrimitives.jsx';
import { usePreferences, LANGUAGES, THEMES } from '../context/PreferencesContext.jsx';

/**
 * SettingsPage — the Account › Settings screen.
 *
 * REQUEST (Jendral Arib, 2026-10-08):
 *   "Account (Setting, Mode [Dark/Lab], Languange [English/ID/Chinese/Japan/Korean])"
 *
 * Both controls persist to localStorage and take effect immediately:
 *  - Language drives the navigation and this page through `t()`
 *  - Mode drives the existing theme attribute on <html>
 */

export default function SettingsPage({ account = {}, theme, onSetTheme }) {
  const { language, setLanguage, t } = usePreferences();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: 'var(--text-primary)' }}>
          ⚙️ {t('settings.title', 'Pengaturan')}
        </h2>
        {account?.email && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {account.email}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '11px' }}>

        {/* ---- Language ---- */}
        <DashPanel
          title={t('settings.language', 'Bahasa Tampilan')}
          subtitle={t('settings.languageHint', 'Berlaku untuk navigasi dan halaman pengaturan. Isi meja trading menyusul.')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {LANGUAGES.map(lang => {
              const active = language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: active ? '1px solid var(--accent-blue)' : 'var(--border-hairline)',
                    background: active ? 'rgba(59,130,246,0.13)' : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '12.5px',
                    fontWeight: active ? 800 : 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '15px' }}>{lang.flag}</span>
                  <span style={{ flex: 1 }}>{lang.label}</span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {lang.short}
                  </span>
                  {active && <span style={{ color: 'var(--accent-blue)', fontSize: '12px' }}>✓</span>}
                </button>
              );
            })}
          </div>
        </DashPanel>

        {/* ---- Appearance ---- */}
        <DashPanel
          title={t('settings.theme', 'Tampilan')}
          subtitle={t('settings.themeHint', 'Mode gelap disarankan untuk sesi trading panjang.')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {THEMES.map(mode => {
              const active = theme === mode.code;
              return (
                <button
                  key={mode.code}
                  onClick={() => {
                    // Direct set, not a toggle: picking the already-active mode
                    // must be a no-op rather than flipping to the other one.
                    if (!active && onSetTheme) onSetTheme(mode.code);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: active ? '1px solid var(--accent-blue)' : 'var(--border-hairline)',
                    background: active ? 'rgba(59,130,246,0.13)' : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '12.5px',
                    fontWeight: active ? 800 : 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '15px' }}>{mode.icon}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1 }}>
                    <span>{mode.label}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>{mode.hint}</span>
                  </span>
                  {active && <span style={{ color: 'var(--accent-blue)', fontSize: '12px' }}>✓</span>}
                </button>
              );
            })}
          </div>

          <div style={{ borderTop: 'var(--border-hairline)', paddingTop: '10px', fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {t('settings.saved', 'Preferensi tersimpan otomatis di perangkat ini.')}
          </div>
        </DashPanel>
      </div>
    </div>
  );
}
