import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useTranslation, I18nextProvider } from 'react-i18next';
import { Language, translations } from '@busnet/shared/constants/translations';
import i18n from '../i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  // Keep the old object for backward compatibility for now
  t: typeof translations.UA;
  // Also expose the new i18n translation function
  i18nT: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { t: i18nT, i18n: i18nInstance } = useTranslation();

  // Make sure to sync if language changes externally.
  // i18next-browser-languagedetector might init to 'en-US' or something else, 
  // we normalize it to 'UA', 'EN', 'IT'.
  const rawLang = i18nInstance.language?.toUpperCase().substring(0, 2);
  const normalizedLang = (['UA', 'EN', 'IT'].includes(rawLang) ? rawLang : 'UA') as Language;

  useEffect(() => {
    if (i18nInstance.language !== normalizedLang && !i18nInstance.language.startsWith(normalizedLang.toLowerCase())) {
      i18nInstance.changeLanguage(normalizedLang);
    }
  }, [i18nInstance, normalizedLang]);

  const setLanguage = (lang: Language) => {
    i18nInstance.changeLanguage(lang);
  };

  const value = {
    language: normalizedLang,
    setLanguage,
    t: translations[normalizedLang] || translations.UA, // old API
    i18nT // new API
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
