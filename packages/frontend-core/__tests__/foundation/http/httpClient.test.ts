/**
 * @fileoverview HttpClient Tests - Unit tests for HTTP client implementation
 * @summary Tests for createHttpClient and HttpClient type
 */

import { createHttpClient, type HttpClient } from '../../../src/foundation/http/httpClient';
import { createMockFetch } from '../../helpers/mocks';
import { z } from 'zod';

describe('createHttpClient', () => {
  let mockFetch: typeof fetch;

  beforeEach(() => {
    mockFetch = createMockFetch({ data: 'test' }, 200);
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

  describe('error handling', () => {
    it('should throw HttpError with error code from response when response has error object', async () => {
      const errorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          field: 'email',
          params: { min: 5 },
        },
      };
      mockFetch = jest.fn(async () => {
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => errorResponse,
          text: async () => JSON.stringify(errorResponse),
          headers: new Headers(),
        } as unknown as Response;
      }) as typeof fetch;
      const client = createHttpClient('https://api.example.com', mockFetch);
      const { HttpError } = await import('../../../src/foundation/http/errors');

      await expect(client.get('/users')).rejects.toThrow(HttpError);
      await expect(client.get('/users')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        status: 400,
        data: errorResponse,
      });
    });

    it('should throw HttpError with UNAUTHORIZED code for 401 status', async () => {
      mockFetch = jest.fn(async () => {
        return {
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => {
            throw new Error('Invalid JSON');
          },
          text: async () => 'Unauthorized',
          headers: new Headers(),
        } as unknown as Response;
      });
      const client = createHttpClient('https://api.example.com', mockFetch);
      const { HttpError } = await import('../../../src/foundation/http/errors');

      await expect(client.get('/users')).rejects.toThrow(HttpError);
      await expect(client.get('/users')).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        status: 401,
      });
    });

    it('should throw HttpError with FORBIDDEN code for 403 status', async () => {
      mockFetch = jest.fn(async () => {
        return {
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          json: async () => {
            throw new Error('Invalid JSON');
          },
          text: async () => 'Forbidden',
          headers: new Headers(),
        } as unknown as Response;
      });
      const client = createHttpClient('https://api.example.com', mockFetch);
      const { HttpError } = await import('../../../src/foundation/http/errors');

      await expect(client.get('/users')).rejects.toThrow(HttpError);
      await expect(client.get('/users')).rejects.toMatchObject({
        code: 'FORBIDDEN',
        status: 403,
      });
    });

    it('should throw HttpError with NOT_FOUND code for 404 status', async () => {
      mockFetch = jest.fn(async () => {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => {
            throw new Error('Invalid JSON');
          },
          text: async () => 'Not Found',
          headers: new Headers(),
        } as unknown as Response;
      });
      const client = createHttpClient('https://api.example.com', mockFetch);
      const { HttpError } = await import('../../../src/foundation/http/errors');

      await expect(client.get('/users')).rejects.toThrow(HttpError);
      await expect(client.get('/users')).rejects.toMatchObject({
        code: 'NOT_FOUND',
        status: 404,
      });
    });

    it('should throw HttpError with UNKNOWN_ERROR code for other error statuses', async () => {
      mockFetch = jest.fn(async () => {
        return {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => {
            throw new Error('Invalid JSON');
          },
          text: async () => 'Internal Server Error',
          headers: new Headers(),
        } as unknown as Response;
      });
      const client = createHttpClient('https://api.example.com', mockFetch);
      const { HttpError } = await import('../../../src/foundation/http/errors');

      await expect(client.get('/users')).rejects.toThrow(HttpError);
      await expect(client.get('/users')).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
        status: 500,
      });
    });

    it('should throw HttpError when response has error object without code', async () => {
      const errorResponse = {
        error: {
          message: 'Something went wrong',
        },
      };
      mockFetch = jest.fn(async () => {
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => errorResponse,
          text: async () => JSON.stringify(errorResponse),
          headers: new Headers(),
        } as unknown as Response;
      }) as typeof fetch;
      const client = createHttpClient('https://api.example.com', mockFetch);
      const { HttpError } = await import('../../../src/foundation/http/errors');

      await expect(client.get('/users')).rejects.toThrow(HttpError);
      await expect(client.get('/users')).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
        status: 400,
        data: errorResponse,
      });
    });

    it('should throw HttpError for POST requests with error response', async () => {
      const errorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
        },
      };
      mockFetch = jest.fn(async () => {
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => errorResponse,
          text: async () => JSON.stringify(errorResponse),
          headers: new Headers(),
        } as unknown as Response;
      }) as typeof fetch;
      const client = createHttpClient('https://api.example.com', mockFetch);
      const { HttpError } = await import('../../../src/foundation/http/errors');

      await expect(client.post('/users', { name: 'Test' })).rejects.toThrow(HttpError);
      await expect(client.post('/users', { name: 'Test' })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    });

    it('should throw HttpError for PUT requests with error response', async () => {
      const errorResponse = {
        error: {
          code: 'NOT_FOUND',
        },
      };
      mockFetch = jest.fn(async () => {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => errorResponse,
          text: async () => JSON.stringify(errorResponse),
          headers: new Headers(),
        } as unknown as Response;
      });
      const client = createHttpClient('https://api.example.com', mockFetch);
      const { HttpError } = await import('../../../src/foundation/http/errors');

      await expect(client.put('/users/1', { name: 'Test' })).rejects.toThrow(HttpError);
      await expect(client.put('/users/1', { name: 'Test' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        status: 404,
      });
    });
  });
});

