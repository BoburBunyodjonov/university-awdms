import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import uzCommon from '@/locales/uz/common.json';
import ruCommon from '@/locales/ru/common.json';
import enCommon from '@/locales/en/common.json';

export const SUPPORTED_LANGUAGES = ['uz', 'ru', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'uz',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    defaultNS: 'common',
    ns: ['common'],
    resources: {
      uz: { common: uzCommon },
      ru: { common: ruCommon },
      en: { common: enCommon },
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
