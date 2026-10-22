import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { I18nextProvider } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Language, translations, TranslationSchema } from '@busnet/shared/constants/translations';
import i18n from '../i18n';

export type LangKey = 'uk' | 'en' | 'it';

export function normalizeLanguage(raw?: string | null): Language {
  const code = raw?.slice(0, 2).toUpperCase();
  if (code === 'EN') return 'EN';
  if (code === 'IT') return 'IT';
  return 'UK'; // 'UK', легасі 'UA' та всі інші мови
}

const LOCALES: Record<Language, string> = { UK: 'uk-UA', EN: 'en-GB', IT: 'it-IT' };

interface LanguageContextType {
  language: Language;
  langKey: LangKey;
  locale: string;
  setLanguage: (lang: Language | 'UA') => void;
  t: TranslationSchema;
  i18nT: TFunction;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function LanguageContextProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>(() => normalizeLanguage(i18n.language));

  useEffect(() => {
    const onChange = (l: string) => setLang(normalizeLanguage(l));
    i18n.on('languageChanged', onChange);
    onChange(i18n.language);
    return () => i18n.off('languageChanged', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language.toLowerCase();
  }, [language]);

  const setLanguage = useCallback((lang: Language | 'UA') => {
    const target: Language = lang === 'UA' ? 'UK' : lang;
    i18n.changeLanguage(target.toLowerCase()).catch(console.error);
  }, []);

  const value = useMemo<LanguageContextType>(
    () => ({
      language,
      langKey: language.toLowerCase() as LangKey,
      locale: LOCALES[language],
      setLanguage,
      t: translations[language] ?? translations.UK,
      i18nT: i18n.t.bind(i18n),
    }),
    [language, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContextProvider>{children}</LanguageContextProvider>
    </I18nextProvider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
