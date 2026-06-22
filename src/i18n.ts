import i18n from 'i18next';

// Only bind the react-i18next plugin if we are in the browser
if (typeof window !== 'undefined') {
  const { initReactI18next } = require('react-i18next');
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources: { en: { translation: {} } },
      lng: 'en',
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
    });
  }
} else {
  // Server-side safe fallback initialization
  if (!i18n.isInitialized) {
    i18n.init({
      resources: { en: { translation: {} } },
      lng: 'en',
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
    });
  }
}

export default i18n;