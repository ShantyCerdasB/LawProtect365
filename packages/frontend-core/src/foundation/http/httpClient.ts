/**
 * @fileoverview HttpClient - Minimal fetch-based client with optional Zod validation
 * @summary Shared HTTP client for web and native without platform dependencies
 * @description Provides GET/POST/PUT helpers bound to a baseUrl and fetch implementation, with optional Zod parsing.
 */

import type { ZodSchema } from 'zod';

/**
 * @description Minimal HTTP client abstraction for fetch-based platforms (web, React Native).
 * Supports optional Zod validation for typed responses.
 */
export type HttpClient = {
  /**
   * @description Executes a GET request and optionally validates the response with Zod.
   * @param path Path to request (relative to baseUrl)
   * @param schema Optional Zod schema to validate the response
   * @returns Parsed response of type T
   */
  get: <T>(path: string, schema?: ZodSchema<T>) => Promise<T>;
  /**
   * @description Executes a POST request with an optional JSON body and Zod validation.
   * @param path Path to request (relative to baseUrl)
   * @param body Optional JSON-serializable payload
   * @param schema Optional Zod schema to validate the response
   * @returns Parsed response of type T
   */
  post: <T, B = unknown>(path: string, body?: B, schema?: ZodSchema<T>) => Promise<T>;
  /**
   * @description Executes a PUT request with an optional JSON body and Zod validation.
   * @param path Path to request (relative to baseUrl)
   * @param body Optional JSON-serializable payload
   * @param schema Optional Zod schema to validate the response
   * @returns Parsed response of type T
   */
  put: <T, B = unknown>(path: string, body?: B, schema?: ZodSchema<T>) => Promise<T>;
};

/**
 * @description Factory to create an HttpClient bound to a base URL and a fetch implementation.
 * @param baseUrl Base URL for all requests (e.g. https://api.example.com)
 * @param fetchImpl Fetch-compatible function (window.fetch, global.fetch, or polyfill)
 * @returns An HttpClient with GET/POST helpers
 */
export function createHttpClient(baseUrl: string, fetchImpl: typeof fetch): HttpClient {
  const request = async <T, B = unknown>(
    method: string,
    path: string,
    body?: B,
    schema?: ZodSchema<T>
  ) => {
    const res = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });

    const json = (await res.json()) as unknown;
    const parsed = schema ? schema.parse(json) : (json as T);
    return parsed;
  };

  return {
    get: (path, schema) => request('GET', path, undefined, schema),
    post: (path, body, schema) => request('POST', path, body, schema),
    put: (path, body, schema) => request('PUT', path, body, schema)
  };
}

