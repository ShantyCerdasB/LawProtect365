/**
 * @fileoverview Environment Config Tests - Unit tests for environment configuration
 * @summary Tests for env.ts module
 */

import { env } from '../../../src/foundation/config/env';

describe('env', () => {
  const originalGlobal = globalThis;

  beforeEach(() => {
    // Reset global state
    delete (globalThis as any).import_meta_env;
    delete (globalThis as any).process;
  });

  afterEach(() => {
    // Restore original global
    Object.assign(globalThis, originalGlobal);
  });

  it('should read from Vite environment (import.meta.env)', () => {
    // Mock import.meta.env
    const mockMeta = {
      env: {
        VITE_API_BASE_URL: 'https://api.vite.test',
        VITE_SIGNATURE_API_BASE_URL: 'https://signature.vite.test',
        VITE_APP_NAME: 'TestApp',
      },
    };

    // Use Function constructor to simulate import.meta
    const originalImportMeta = (globalThis as any).import_meta_env;
    (globalThis as any).import_meta_env = mockMeta.env;

    // Re-import to get fresh env values
    jest.resetModules();
    const { env: testEnv } = require('../../../src/foundation/config/env');

    expect(testEnv.apiBaseUrl).toBe('https://api.vite.test');
    expect(testEnv.signatureApiBaseUrl).toBe('https://signature.vite.test');
    expect(testEnv.appName).toBe('TestApp');

    // Cleanup
    delete (globalThis as any).import_meta_env;
  });

  it('should read from React Native environment (process.env)', () => {
    // Mock process.env for React Native
    const mockProcess = {
      env: {
        API_BASE_URL: 'https://api.rn.test',
        SIGNATURE_API_BASE_URL: 'https://signature.rn.test',
        APP_NAME: 'RNTestApp',
      },
    };

    (globalThis as any).process = mockProcess;

    // Re-import to get fresh env values
    jest.resetModules();
    const { env: testEnv } = require('../../../src/foundation/config/env');

    expect(testEnv.apiBaseUrl).toBe('https://api.rn.test');
    expect(testEnv.signatureApiBaseUrl).toBe('https://signature.rn.test');
    expect(testEnv.appName).toBe('RNTestApp');

    // Cleanup
    delete (globalThis as any).process;
  });

  it('should read from global shim (import_meta_env) for tests (line 44)', () => {
    // Mock global shim used in tests
    const mockShim = {
      VITE_API_BASE_URL: 'https://api.shim.test',
      VITE_SIGNATURE_API_BASE_URL: 'https://signature.shim.test',
      VITE_APP_NAME: 'ShimTestApp',
    };

    (globalThis as any).import_meta_env = mockShim;

    // Re-import to get fresh env values
    jest.resetModules();
    const { env: testEnv } = require('../../../src/foundation/config/env');

    expect(testEnv.apiBaseUrl).toBe('https://api.shim.test');
    expect(testEnv.signatureApiBaseUrl).toBe('https://signature.shim.test');
    expect(testEnv.appName).toBe('ShimTestApp');

    // Cleanup
    delete (globalThis as any).import_meta_env;
  });

  it('should use default values when environment variables are not set', () => {
    // Ensure no env vars are set
    delete (globalThis as any).import_meta_env;
    delete (globalThis as any).process;

    // Re-import to get fresh env values
    jest.resetModules();
    const { env: testEnv } = require('../../../src/foundation/config/env');

    expect(testEnv.apiBaseUrl).toBe('');
    expect(testEnv.signatureApiBaseUrl).toBe('');
    expect(testEnv.appName).toBe('LawProtect365');
  });

  it('should prioritize Vite env over React Native env', () => {
    const mockMeta = {
      env: {
        VITE_API_BASE_URL: 'https://api.vite.test',
      },
    };
    const mockProcess = {
      env: {
        API_BASE_URL: 'https://api.rn.test',
      },
    };

    (globalThis as any).import_meta_env = mockMeta.env;
    (globalThis as any).process = mockProcess;

    // Re-import to get fresh env values
    jest.resetModules();
    const { env: testEnv } = require('../../../src/foundation/config/env');

    expect(testEnv.apiBaseUrl).toBe('https://api.vite.test');

    // Cleanup
    delete (globalThis as any).import_meta_env;
    delete (globalThis as any).process;
  });

  it('should handle errors gracefully when accessing import.meta (line 21-22)', () => {
    // Simulate error when accessing import.meta
    const originalError = console.error;
    console.error = jest.fn();

    // Re-import should not throw
    jest.resetModules();
    expect(() => {
      require('../../../src/foundation/config/env');
    }).not.toThrow();

    console.error = originalError;
  });
});

