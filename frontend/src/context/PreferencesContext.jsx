import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Language and appearance preferences.
 *
 * REQUEST (Jendral Arib, 2026-10-08):
 *   "Account (Setting, Mode [Dark/Lab], Languange [English/ID/Chinese/Japan/Korean])"
 *
 * SCOPE — READ THIS BEFORE USING:
 * This provides the MECHANISM for five languages plus a real preference store.
 * It does NOT translate the whole application: the terminal has thousands of
 * Indonesian strings across ~45 components, and machine-translating them all
 * silently would produce a worse product than leaving them. What is wired here
 * is the shell — navigation, account menu, and the settings page itself.
 *
 * `t()` returns the key's translation when one exists and falls back to the
 * source string when it does not, so untranslated screens keep working exactly
 * as they do today while translation proceeds screen by screen.
 */

export const LANGUAGES = [
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩', short: 'ID' },
  { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' },
  { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳', short: 'ZH' },
  { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵', short: 'JA' },
  { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷', short: 'KO' },
];

export const THEMES = [
  { code: 'dark', label: 'Dark', icon: '🌙', hint: 'Terminal gelap, nyaman untuk sesi panjang' },
  { code: 'light', label: 'Light', icon: '☀️', hint: 'Latar terang untuk ruangan berbayang' },
];

/**
 * Translation table.
 *
 * Kept flat (one key namespace) because every entry here is shell chrome.
 * Per-desk strings will move into their own files as they are translated.
 */
const TRANSLATIONS = {
  en: {
    'nav.home': 'Home',
    'nav.trade': 'Trade',
    'nav.markets': 'Markets',
    'nav.research': 'Research & Learn',
    'nav.account': 'Account',
    'nav.search': 'Search',
    'account.settings': 'Settings',
    'account.watchlist': 'My Watchlist',
    'account.language': 'Language',
    'account.theme': 'Mode',
    'account.subscription': 'Plan & Billing',
    'settings.title': 'Settings',
    'settings.language': 'Display Language',
    'settings.languageHint': 'Applies to the navigation and settings. Desk content follows.',
    'settings.theme': 'Appearance',
    'settings.themeHint': 'Dark is recommended for long trading sessions.',
    'settings.saved': 'Preferences are saved automatically on this device.',
  },
  zh: {
    'nav.home': '首页',
    'nav.trade': '交易',
    'nav.markets': '市场',
    'nav.research': '研究与学习',
    'nav.account': '账户',
    'nav.search': '搜索',
    'account.settings': '设置',
    'account.watchlist': '我的自选',
    'account.language': '语言',
    'account.theme': '模式',
    'account.subscription': '套餐与账单',
    'settings.title': '设置',
    'settings.language': '显示语言',
    'settings.languageHint': '应用于导航和设置页面。',
    'settings.theme': '外观',
    'settings.themeHint': '长时间交易建议使用深色模式。',
    'settings.saved': '偏好设置会自动保存在本设备。',
  },
  ja: {
    'nav.home': 'ホーム',
    'nav.trade': 'トレード',
    'nav.markets': 'マーケット',
    'nav.research': 'リサーチ',
    'nav.account': 'アカウント',
    'nav.search': '検索',
    'account.settings': '設定',
    'account.watchlist': 'ウォッチリスト',
    'account.language': '言語',
    'account.theme': 'モード',
    'account.subscription': 'プランと請求',
    'settings.title': '設定',
    'settings.language': '表示言語',
    'settings.languageHint': 'ナビゲーションと設定に適用されます。',
    'settings.theme': '外観',
    'settings.themeHint': '長時間の取引にはダークモードを推奨します。',
    'settings.saved': '設定はこの端末に保存されます。',
  },
  ko: {
    'nav.home': '홈',
    'nav.trade': '거래',
    'nav.markets': '시장',
    'nav.research': '리서치',
    'nav.account': '계정',
    'nav.search': '검색',
    'account.settings': '설정',
    'account.watchlist': '내 관심목록',
    'account.language': '언어',
    'account.theme': '모드',
    'account.subscription': '요금제 및 결제',
    'settings.title': '설정',
    'settings.language': '표시 언어',
    'settings.languageHint': '내비게이션과 설정에 적용됩니다.',
    'settings.theme': '테마',
    'settings.themeHint': '장시간 거래에는 다크 모드를 권장합니다.',
    'settings.saved': '설정은 이 기기에 자동 저장됩니다.',
  },
};

const LANG_KEY = 'mbg_language';

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && LANGUAGES.some(l => l.code === saved)) return saved;
    } catch { /* storage unavailable */ }
    // Default to Indonesian: the product's primary audience.
    return 'id';
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, language);
    } catch { /* storage unavailable */ }
    // The document language drives screen readers and browser translation
    // prompts, so it must track the choice.
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  /**
   * Translate a key, falling back to the caller-supplied source string.
   *
   * The fallback argument is what makes incremental translation safe: a screen
   * that has not been translated yet renders its Indonesian text unchanged
   * instead of showing a raw key like "nav.home".
   */
  const t = useCallback((key, fallback) => {
    if (language === 'id') return fallback ?? key;
    return TRANSLATIONS[language]?.[key] ?? fallback ?? key;
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: LANGUAGES }),
    [language, t],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

/**
 * Access preferences.
 *
 * Returns a safe Indonesian default when no provider is mounted, so a component
 * can adopt `t()` without the whole tree being wrapped first.
 */
export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (ctx) return ctx;
  return {
    language: 'id',
    setLanguage: () => {},
    t: (key, fallback) => fallback ?? key,
    languages: LANGUAGES,
  };
}
