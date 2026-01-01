import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import ptCommon from './locales/pt/common.json';

// Initialize i18next
i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        resources: {
            en: {
                common: enCommon,
            },
            pt: {
                common: ptCommon,
            },
        },
        lng: localStorage.getItem('app_language') || 'en', // default language
        fallbackLng: 'en',
        defaultNS: 'common',
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
        react: {
            useSuspense: false // avoid suspense for now to prevent loading issues
        }
    });

export default i18n;

