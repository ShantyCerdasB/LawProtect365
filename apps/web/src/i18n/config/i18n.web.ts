/**
 * @fileoverview i18n Web Configuration - Web-specific i18next setup
 * @summary Initializes i18next for the web application
 * @description
 * Configures i18next with web-specific plugins (language detector, backend loader)
 * and merges with base configuration from frontend-core.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { i18nBaseConfig } from '@lawprotect/frontend-core';

import enCommon from '../locales/shared/en/common.json';
import enErrors from '../locales/shared/en/errors.json';
import enValidation from '../locales/shared/en/validation.json';
import esCommon from '../locales/shared/es/common.json';
import esErrors from '../locales/shared/es/errors.json';
import esValidation from '../locales/shared/es/validation.json';

import enAuth from '../locales/shared/en/modules/auth.json';
import enDocuments from '../locales/shared/en/modules/documents.json';
import enUsers from '../locales/shared/en/modules/users.json';
import enPayments from '../locales/shared/en/modules/payments.json';
import enMemberships from '../locales/shared/en/modules/memberships.json';
import enCases from '../locales/shared/en/modules/cases.json';
import enCalendar from '../locales/shared/en/modules/calendar.json';
import enNotifications from '../locales/shared/en/modules/notifications.json';
import enKyc from '../locales/shared/en/modules/kyc.json';
import enAdmin from '../locales/shared/en/modules/admin.json';

import esAuth from '../locales/shared/es/modules/auth.json';
import esDocuments from '../locales/shared/es/modules/documents.json';
import esUsers from '../locales/shared/es/modules/users.json';
import esPayments from '../locales/shared/es/modules/payments.json';
import esMemberships from '../locales/shared/es/modules/memberships.json';
import esCases from '../locales/shared/es/modules/cases.json';
import esCalendar from '../locales/shared/es/modules/calendar.json';
import esNotifications from '../locales/shared/es/modules/notifications.json';
import esKyc from '../locales/shared/es/modules/kyc.json';
import esAdmin from '../locales/shared/es/modules/admin.json';

import jaCommon from '../locales/shared/ja/common.json';
import jaErrors from '../locales/shared/ja/errors.json';
import jaValidation from '../locales/shared/ja/validation.json';
import itCommon from '../locales/shared/it/common.json';
import itErrors from '../locales/shared/it/errors.json';
import itValidation from '../locales/shared/it/validation.json';

import enLayout from '../locales/en/layout.json';
import esLayout from '../locales/es/layout.json';
import jaLayout from '../locales/ja/layout.json';
import itLayout from '../locales/it/layout.json';

const resources = {
  en: {
    common: enCommon,
    errors: enErrors,
    validation: enValidation,
    layout: enLayout,
    auth: enAuth,
    documents: enDocuments,
    users: enUsers,
    payments: enPayments,
    memberships: enMemberships,
    cases: enCases,
    calendar: enCalendar,
    notifications: enNotifications,
    kyc: enKyc,
    admin: enAdmin,
  },
  es: {
    common: esCommon,
    errors: esErrors,
    validation: esValidation,
    layout: esLayout,
    auth: esAuth,
    documents: esDocuments,
    users: esUsers,
    payments: esPayments,
    memberships: esMemberships,
    cases: esCases,
    calendar: esCalendar,
    notifications: esNotifications,
    kyc: esKyc,
    admin: esAdmin,
  },
  ja: {
    common: jaCommon,
    errors: jaErrors,
    validation: jaValidation,
    layout: jaLayout,
  },
  it: {
    common: itCommon,
    errors: itErrors,
    validation: itValidation,
    layout: itLayout,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    ...i18nBaseConfig,
    resources,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;

