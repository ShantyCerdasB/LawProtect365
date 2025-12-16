/**
 * @fileoverview Browser Mocks - Mock implementations of browser APIs
 * @summary Reusable mocks for window, localStorage, sessionStorage, and other browser APIs
 * @description
 * Provides mock implementations of browser APIs that can be used across test files.
 * These mocks help test components that interact with browser APIs without relying
 * on the actual browser environment.
 */

import { jest } from '@jest/globals';

/**
 * @description Creates a mock window.location object.
 * @param url URL to set as the current location
 * @returns Mocked window.location
 */
export function mockWindowLocation(url: string): void {
  delete (window as any).location;
  (window as any).location = new URL(url);
}

/**
 * @description Restores the original window.location.
 */
export function restoreWindowLocation(): void {
  delete (window as any).location;
  (window as any).location = window.location;
}

/**
 * @description Creates a mock localStorage implementation.
 * @returns Mock localStorage object with getItem, setItem, removeItem, clear
 */
export function createMockLocalStorage() {
  const storage: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => {
      return key in storage ? storage[key] : null;
    }),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    }),
    storage,
  };
}

/**
 * @description Creates a mock sessionStorage implementation.
 * @returns Mock sessionStorage object with getItem, setItem, removeItem, clear
 */
export function createMockSessionStorage() {
  const storage: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    }),
    storage,
  };
}

/**
 * @description Mocks window.matchMedia for testing responsive components.
 * @param matches Whether media query should match
 * @returns Mock matchMedia implementation
 */
export function mockMatchMedia(matches: boolean = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: unknown) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

/**
 * @description Mocks IntersectionObserver for testing components that use it.
 * @returns Mock IntersectionObserver implementation
 */
export function mockIntersectionObserver() {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as any;
}

/**
 * @description Mocks ResizeObserver for testing components that use it.
 * @returns Mock ResizeObserver implementation
 */
export function mockResizeObserver() {
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as any;
}

/**
 * @description Mocks FileReader for testing file upload components.
 * @returns Mock FileReader implementation
 */
export function createMockFileReader() {
  const mockFileReader = {
    readAsDataURL: jest.fn(),
    readAsText: jest.fn(),
    readAsArrayBuffer: jest.fn(),
    result: null,
    error: null,
    readyState: 0,
    onload: null,
    onerror: null,
    onloadend: null,
    onloadstart: null,
    onprogress: null,
    abort: jest.fn(),
    dispatchEvent: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  (global as any).FileReader = jest.fn(() => mockFileReader);

  return mockFileReader;
}
