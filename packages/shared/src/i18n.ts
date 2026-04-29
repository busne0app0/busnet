import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import our existing translations as a fallback or base
import { translations } from './constants/translations';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      UA: { translation: translations.UA },
      EN: { translation: translations.EN },
      IT: { translation: translations.IT }
    },
    detection: {
      order: ['localStorage'], // Only rely on explicitly saved language
      caches: ['localStorage'],
    },
    fallbackLng: 'UA',
    debug: false,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
