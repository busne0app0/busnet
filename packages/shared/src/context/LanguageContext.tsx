import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useTranslation, I18nextProvider } from 'react-i18next';
import { Language, translations, TranslationSchema } from '@busnet/shared/constants/translations';
import i18n from '../i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language | 'UA') => void;
  t: TranslationSchema;
  i18nT: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { t: i18nT, i18n: i18nInstance } = useTranslation();

  // Normalize language: 'UK' (or legacy 'UA'), 'EN', 'IT'
  const rawLang = i18nInstance.language?.toUpperCase().substring(0, 2);
  let normalizedLang: Language = 'UK';
  if (rawLang === 'EN') {
    normalizedLang = 'EN';
  } else if (rawLang === 'IT') {
    normalizedLang = 'IT';
  } else {
    normalizedLang = 'UK';
  }

  useEffect(() => {
    if (i18nInstance.language !== normalizedLang && !i18nInstance.language.startsWith(normalizedLang.toLowerCase())) {
      i18nInstance.changeLanguage(normalizedLang);
    }
  }, [i18nInstance, normalizedLang]);

  const setLanguage = (lang: Language | 'UA') => {
    const targetLang: Language = lang === 'UA' ? 'UK' : lang;
    i18nInstance.changeLanguage(targetLang);
  };

  const value = {
    language: normalizedLang,
    setLanguage,
    t: translations[normalizedLang] || translations.UK,
    i18nT,
  };

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider value={value}>
        {children}
      </LanguageContext.Provider>
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
