/**
 * @fileoverview Jest Setup - Global test configuration
 * @summary Configures testing environment for React components
 * @description Sets up global mocks, matchers, and test utilities
 */

/// <reference types="@testing-library/jest-dom" />
/// <reference path="./jest-dom.d.ts" />
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Suppress React Router v7 deprecation warnings in tests
process.env.REACT_ROUTER_V7_START_TRANSITION = 'true';
process.env.REACT_ROUTER_V7_RELATIVE_SPLAT_PATH = 'true';

// Mock window.matchMedia (used by some UI libraries)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: unknown) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver (used by some components)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver (used by some components)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock HTMLCanvasElement.getContext (jsdom doesn't implement it)
HTMLCanvasElement.prototype.getContext = jest.fn((contextType: string) => {
  if (contextType === '2d') {
    return {
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      fillText: jest.fn(),
      strokeRect: jest.fn(),
      strokeText: jest.fn(),
      measureText: jest.fn(() => ({ width: 100, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 })),
      drawImage: jest.fn(),
      setTransform: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      clip: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      translate: jest.fn(),
      font: '',
      fillStyle: '',
      strokeStyle: '',
      textAlign: '',
      textBaseline: '',
      lineWidth: 1,
      lineDashOffset: 0,
      setLineDash: jest.fn(),
    } as any;
  }
  return null;
}) as any;

HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,test');

// Mock PointerEvent (jsdom doesn't implement it)
interface ExtendedPointerEventInit extends PointerEventInit {
  altitudeAngle?: number;
  azimuthAngle?: number;
}

global.PointerEvent = class PointerEvent extends MouseEvent {
  pointerId: number;
  pressure: number;
  tangentialPressure: number;
  tiltX: number;
  tiltY: number;
  twist: number;
  altitudeAngle: number;
  azimuthAngle: number;
  pointerType: string;
  isPrimary: boolean;

  constructor(type: string, eventInitDict?: ExtendedPointerEventInit) {
    super(type, eventInitDict);
    this.pointerId = eventInitDict?.pointerId ?? 0;
    this.pressure = eventInitDict?.pressure ?? 0;
    this.tangentialPressure = eventInitDict?.tangentialPressure ?? 0;
    this.tiltX = eventInitDict?.tiltX ?? 0;
    this.tiltY = eventInitDict?.tiltY ?? 0;
    this.twist = eventInitDict?.twist ?? 0;
    this.altitudeAngle = eventInitDict?.altitudeAngle ?? 0;
    this.azimuthAngle = eventInitDict?.azimuthAngle ?? 0;
    this.pointerType = eventInitDict?.pointerType ?? 'mouse';
    this.isPrimary = eventInitDict?.isPrimary ?? false;
  }
} as any;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { i18nBaseConfig } from '@lawprotect/frontend-core';

const enCommon = require('../src/i18n/locales/shared/en/common.json');
const enErrors = require('../src/i18n/locales/shared/en/errors.json');
const enValidation = require('../src/i18n/locales/shared/en/validation.json');

const enLayout = require('../src/i18n/locales/en/layout.json');

const enAdminShared = require('../src/i18n/locales/shared/en/modules/admin.json');
const enAuth = require('../src/i18n/locales/shared/en/modules/auth.json');
const enCalendar = require('../src/i18n/locales/shared/en/modules/calendar.json');
const enCases = require('../src/i18n/locales/shared/en/modules/cases.json');
const enDocuments = require('../src/i18n/locales/shared/en/modules/documents.json');
const enKyc = require('../src/i18n/locales/shared/en/modules/kyc.json');
const enMemberships = require('../src/i18n/locales/shared/en/modules/memberships.json');
const enNotificationsShared = require('../src/i18n/locales/shared/en/modules/notifications.json');
const enPaymentsShared = require('../src/i18n/locales/shared/en/modules/payments.json');
const enUsers = require('../src/i18n/locales/shared/en/modules/users.json');

const enAdminWeb = require('../src/i18n/locales/en/modules/admin.json');
const enNotificationsWeb = require('../src/i18n/locales/en/modules/notifications.json');
const enPaymentsWeb = require('../src/i18n/locales/en/modules/payments.json');

const enAdmin = { ...enAdminShared, ...enAdminWeb };
const enNotifications = { ...enNotificationsShared, ...enNotificationsWeb };
const enPayments = { ...enPaymentsShared, ...enPaymentsWeb };

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      ...i18nBaseConfig,
      resources: {
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
      },
      lng: 'en',
      fallbackLng: 'en',
      initImmediate: false,
    });
}












