import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation files
import enCommon from '@/locales/en/common.json';
import arCommon from '@/locales/ar/common.json';
import frCommon from '@/locales/fr/common.json';

const resources = {
  en: {
    common: enCommon,
  },
  ar: {
    common: arCommon,
  },
  fr: {
    common: frCommon,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language - English for all users
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],

    interpolation: {
      escapeValue: false, // React already handles escaping
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n; 