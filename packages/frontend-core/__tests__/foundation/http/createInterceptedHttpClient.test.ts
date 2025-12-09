/**
 * @fileoverview Intercepted HttpClient Tests - Unit tests for HTTP client with interception
 * @summary Tests for createInterceptedHttpClient function
 */

import { createInterceptedHttpClient } from '../../../src/foundation/http/createInterceptedHttpClient';
import { createMockFetch, createMockStoragePort, createMockNetworkContextPort } from '../../helpers/mocks';
import type { NetworkContext } from '../../../src/foundation/http/types';

describe('createInterceptedHttpClient', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = createMockFetch({ data: 'test' }, 200) as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an HttpClient instance', () => {
    const client = createInterceptedHttpClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: mockFetch,
    });

    expect(client).toHaveProperty('get');
    expect(client).toHaveProperty('post');
    expect(client).toHaveProperty('put');
  });

  it('should inject authorization header from token provider', async () => {
    const storage = createMockStoragePort();
    await storage.set('token', 'test-token-123');

    const client = createInterceptedHttpClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: mockFetch,
      getAuthToken: async () => {
        return await storage.get<string>('token');
      },
    });

    await client.get('/users');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer test-token-123',
        }),
      })
    );
  });

  it('should inject network context headers', async () => {
    const networkContext = createMockNetworkContextPort();

    const client = createInterceptedHttpClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: mockFetch,
      getNetworkContext: async () => {
        return await networkContext.getContext();
      },
    });

    await client.get('/users');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-forwarded-for': '192.168.1.1',
          'x-country': 'US',
          'x-user-agent': 'Mozilla/5.0 (Test)',
        }),
      })
    );
  });

  it('should inject both token and network context', async () => {
    const storage = createMockStoragePort();
    await storage.set('token', 'test-token');
    const networkContext = createMockNetworkContextPort();

    const client = createInterceptedHttpClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: mockFetch,
      getAuthToken: async () => {
        return await storage.get<string>('token');
      },
      getNetworkContext: async () => {
        return await networkContext.getContext();
      },
    });

    await client.get('/users');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer test-token',
          'x-forwarded-for': '192.168.1.1',
          'x-country': 'US',
        }),
      })
    );
  });

  it('should inject extra headers from buildExtraHeaders', async () => {
    const client = createInterceptedHttpClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: mockFetch,
      buildExtraHeaders: async () => ({
        'X-Custom-Header': 'custom-value',
        'X-Request-ID': 'req-123',
      }),
    });

    await client.get('/users');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-custom-header': 'custom-value',
          'x-request-id': 'req-123',
        }),
      })
    );
  });

  it('should handle null token gracefully', async () => {
    const client = createInterceptedHttpClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: mockFetch,
      getAuthToken: async () => null,
    });

    await client.get('/users');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        headers: expect.not.objectContaining({
          authorization: expect.anything(),
        }),
      })
    );
  });

  it('should handle undefined network context gracefully', async () => {
    const client = createInterceptedHttpClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: mockFetch,
      getNetworkContext: async () => undefined,
    });

    await client.get('/users');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        headers: expect.not.objectContaining({
          'x-forwarded-for': expect.anything(),
        }),
      })
    );
  });

  it('should merge custom headers with intercepted headers', async () => {
    const storage = createMockStoragePort();
    await storage.set('token', 'test-token');

    const client = createInterceptedHttpClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: mockFetch,
      getAuthToken: async () => {
        return await storage.get<string>('token');
      },
    });

    // Note: HttpClient doesn't expose a way to pass custom headers directly,
    // but the implementation should preserve any headers passed via fetch init
    await client.get('/users');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        headers: expect.objectContaining({
          'content-type': 'application/json',
          authorization: 'Bearer test-token',
        }),
      })
    );
  });
});

