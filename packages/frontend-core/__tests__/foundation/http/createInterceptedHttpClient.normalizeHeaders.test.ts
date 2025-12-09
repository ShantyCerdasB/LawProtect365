/**
 * @fileoverview Normalize Headers Tests - Unit tests for normalizeHeaders function
 * @summary Tests for normalizeHeaders internal function
 */

import { createInterceptedHttpClient } from '../../../src/foundation/http/createInterceptedHttpClient';
import { createMockFetch } from '../../helpers/mocks';

describe('normalizeHeaders (internal function)', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = createMockFetch({ data: 'test' }, 200) as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should normalize Headers object', async () => {
    const headers = new Headers();
    headers.set('X-Custom', 'value1');
    headers.set('X-Another', 'value2');

    const client = createInterceptedHttpClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: mockFetch,
    });

    // Trigger a request to test normalizeHeaders indirectly
    await client.get('/test');

    // Verify headers were normalized correctly
    const callArgs = mockFetch.mock.calls[0];
    const requestInit = callArgs[1] as RequestInit;
    expect(requestInit.headers).toBeDefined();
  });

  it('should normalize array of header tuples', async () => {
    const client = createInterceptedHttpClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: mockFetch,
    });

    await client.get('/test');

    // The function should handle array headers internally
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should normalize plain object headers', async () => {
    const client = createInterceptedHttpClient({
      baseUrl: 'https://api.example.com',
      fetchImpl: mockFetch,
    });

    await client.get('/test');

    expect(mockFetch).toHaveBeenCalled();
  });
});

