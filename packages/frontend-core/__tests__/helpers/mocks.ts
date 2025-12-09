/**
 * @fileoverview Test Mocks - Reusable mock implementations for testing
 * @summary Shared mock objects and factories for frontend-core tests
 * @description Provides mock implementations of ports, HTTP clients, and other dependencies
 * to avoid code duplication across test files.
 */

import type { StoragePort } from '../../src/ports/storage/StoragePort';
import type { SecureStoragePort } from '../../src/ports/storage/SecureStoragePort';
import type { NetworkContextPort } from '../../src/ports/network/NetworkContextPort';
import type { HttpClient } from '../../src/foundation/http/httpClient';
import type { NetworkContext } from '../../src/foundation/http/types';

/**
 * @description Creates a mock StoragePort implementation.
 * @param overrides Optional partial implementation to override default behavior
 * @returns Mock StoragePort instance
 */
export function createMockStoragePort(overrides?: Partial<StoragePort>): StoragePort {
  const storage = new Map<string, string>();

  return {
    async get<T = unknown>(key: string): Promise<T | null> {
      const value = storage.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    },
    async set<T = unknown>(key: string, value: T): Promise<void> {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      storage.set(key, serialized);
    },
    async remove(key: string): Promise<void> {
      storage.delete(key);
    },
    async clear(): Promise<void> {
      storage.clear();
    },
    ...overrides,
  };
}

/**
 * @description Creates a mock SecureStoragePort implementation.
 * @param overrides Optional partial implementation to override default behavior
 * @returns Mock SecureStoragePort instance
 */
export function createMockSecureStoragePort(
  overrides?: Partial<SecureStoragePort>
): SecureStoragePort {
  const storage = new Map<string, string>();

  return {
    async getSecure(key: string): Promise<string | null> {
      return storage.get(key) ?? null;
    },
    async setSecure(key: string, value: string): Promise<void> {
      storage.set(key, value);
    },
    async removeSecure(key: string): Promise<void> {
      storage.delete(key);
    },
    ...overrides,
  };
}

/**
 * @description Creates a mock NetworkContextPort implementation.
 * @param overrides Optional partial implementation to override default behavior
 * @returns Mock NetworkContextPort instance
 */
export function createMockNetworkContextPort(
  overrides?: Partial<NetworkContextPort>
): NetworkContextPort {
  return {
    async getIp(): Promise<string | undefined> {
      return '192.168.1.1';
    },
    async getCountry(): Promise<string | undefined> {
      return 'US';
    },
    async getUserAgent(): Promise<string | undefined> {
      return 'Mozilla/5.0 (Test)';
    },
    async getContext(): Promise<NetworkContext | undefined> {
      return {
        ip: '192.168.1.1',
        country: 'US',
        userAgent: 'Mozilla/5.0 (Test)',
      };
    },
    ...overrides,
  };
}

/**
 * @description Creates a mock HttpClient implementation.
 * @param overrides Optional partial implementation to override default behavior
 * @returns Mock HttpClient instance (jest.Mocked for type safety)
 */
export function createMockHttpClient(overrides?: Partial<HttpClient>): jest.Mocked<HttpClient> {
  const mockClient = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    ...overrides,
  } as jest.Mocked<HttpClient>;

  // Set default implementations if not overridden
  if (!overrides?.get) {
    mockClient.get.mockResolvedValue({ path: '', method: 'GET' } as never);
  }
  if (!overrides?.post) {
    mockClient.post.mockResolvedValue({ path: '', method: 'POST' } as never);
  }
  if (!overrides?.put) {
    mockClient.put.mockResolvedValue({ path: '', method: 'PUT' } as never);
  }

  return mockClient;
}

/**
 * @description Creates a mock fetch implementation.
 * @param responseData Optional response data to return
 * @param status Optional HTTP status code (default: 200)
 * @returns Mock fetch function
 */
export function createMockFetch(
  responseData: unknown = { success: true },
  status: number = 200
): typeof fetch {
  return jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: async () => responseData,
      text: async () => JSON.stringify(responseData),
      headers: new Headers(),
    } as Response;
  });
}

