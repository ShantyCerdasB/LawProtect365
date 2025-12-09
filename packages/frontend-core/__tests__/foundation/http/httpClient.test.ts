/**
 * @fileoverview HttpClient Tests - Unit tests for HTTP client implementation
 * @summary Tests for createHttpClient and HttpClient type
 */

import { createHttpClient, type HttpClient } from '../../../src/foundation/http/httpClient';
import { createMockFetch } from '../../helpers/mocks';
import { z } from 'zod';

describe('createHttpClient', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = createMockFetch({ data: 'test' }, 200) as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should make a GET request to the correct URL', async () => {
      const client = createHttpClient('https://api.example.com', mockFetch);

      await client.get('/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should return parsed JSON response', async () => {
      const responseData = { id: 1, name: 'Test' };
      mockFetch = createMockFetch(responseData, 200) as jest.MockedFunction<typeof fetch>;
      const client = createHttpClient('https://api.example.com', mockFetch);

      const result = await client.get('/users');

      expect(result).toEqual(responseData);
    });

    it('should validate response with Zod schema', async () => {
      const responseData = { id: 1, name: 'Test' };
      const schema = z.object({
        id: z.number(),
        name: z.string(),
      });
      mockFetch = createMockFetch(responseData, 200) as jest.MockedFunction<typeof fetch>;
      const client = createHttpClient('https://api.example.com', mockFetch);

      const result = await client.get('/users', schema);

      expect(result).toEqual(responseData);
      expect(schema.parse(result)).toEqual(responseData);
    });

    it('should throw error when Zod validation fails', async () => {
      const responseData = { id: 'invalid', name: 'Test' };
      const schema = z.object({
        id: z.number(),
        name: z.string(),
      });
      mockFetch = createMockFetch(responseData, 200) as jest.MockedFunction<typeof fetch>;
      const client = createHttpClient('https://api.example.com', mockFetch);

      await expect(client.get('/users', schema)).rejects.toThrow();
    });
  });

  describe('post', () => {
    it('should make a POST request with body', async () => {
      const client = createHttpClient('https://api.example.com', mockFetch);
      const body = { name: 'Test User' };

      await client.post('/users', body);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      );
    });

    it('should handle POST without body', async () => {
      const client = createHttpClient('https://api.example.com', mockFetch);

      await client.post('/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      );
    });

    it('should validate response with Zod schema', async () => {
      const responseData = { id: 1, name: 'Created User' };
      const schema = z.object({
        id: z.number(),
        name: z.string(),
      });
      mockFetch = createMockFetch(responseData, 200) as jest.MockedFunction<typeof fetch>;
      const client = createHttpClient('https://api.example.com', mockFetch);

      const result = await client.post('/users', { name: 'Test' }, schema);

      expect(result).toEqual(responseData);
    });
  });

  describe('put', () => {
    it('should make a PUT request with body', async () => {
      const client = createHttpClient('https://api.example.com', mockFetch);
      const body = { name: 'Updated User' };

      await client.put('/users/1', body);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      );
    });

    it('should validate response with Zod schema', async () => {
      const responseData = { id: 1, name: 'Updated User' };
      const schema = z.object({
        id: z.number(),
        name: z.string(),
      });
      mockFetch = createMockFetch(responseData, 200) as jest.MockedFunction<typeof fetch>;
      const client = createHttpClient('https://api.example.com', mockFetch);

      const result = await client.put('/users/1', { name: 'Updated' }, schema);

      expect(result).toEqual(responseData);
    });
  });
});

