import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files directly for better performance
import enCommon from '../locales/en/common.json';
import jaCommon from '../locales/ja/common.json';

// Resources object with all translations
const resources = {
  en: {
    common: enCommon
  },
  ja: {
    common: jaCommon
  }
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Use static resources instead of loading from backend for better performance
    resources,
    
    fallbackLng: 'ja', // Default to Japanese since this is a Japanese architecture database
    debug: process.env.NODE_ENV === 'development',
    
    // Default namespace
    defaultNS: 'common',
    ns: ['common'],
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Language detection configuration
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true
    },
    
    // Backend configuration (fallback for missing translations)
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // React-specific options
    react: {
      useSuspense: false, // Disable suspense to handle loading manually
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em'],
    },
    
    // Only allow Japanese and English
    supportedLngs: ['ja', 'en'],
    
    // Performance optimizations
    load: 'languageOnly', // Don't load region-specific variants
    preload: ['ja', 'en'], // Preload both languages
    
    // Keyseparator and nsseparator
    keySeparator: '.',
    nsSeparator: ':',
    
    // Return key if translation is missing in development
    returnEmptyString: false,
    returnNull: false,
    returnObjects: false,
  });

export default i18n;

// Export type-safe translation hook
export const supportedLanguages = [
  { code: 'ja', name: '日本語', nativeName: '日本語' },
  { code: 'en', name: 'English', nativeName: 'English' }
] as const;

export type SupportedLanguage = typeof supportedLanguages[number]['code'];

// Custom hook for type-safe translations
export const useTypedTranslation = () => {
  const { t: originalT, i18n: i18nInstance } = useTranslation('common');
  
  const t = (key: string, options?: any) => originalT(key, options);
  
  const changeLanguage = (lng: SupportedLanguage) => {
    return i18nInstance.changeLanguage(lng);
  };
  
  const currentLanguage = i18nInstance.language as SupportedLanguage;
  
  return {
    t,
    changeLanguage,
    currentLanguage,
    isReady: i18nInstance.isInitialized
  };
};