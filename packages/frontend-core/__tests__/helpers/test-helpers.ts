/**
 * @fileoverview Test Helpers - Reusable test utilities and assertions
 * @summary Shared helper functions for common test patterns
 * @description Provides utility functions for testing HTTP clients, ports, and React hooks.
 */

import type { HttpClient } from '../../src/foundation/http/httpClient';

/**
 * @description Asserts that an HttpClient method was called with specific parameters.
 * @param mockClient Mock HttpClient instance
 * @param method HTTP method to check ('get', 'post', 'put')
 * @param expectedPath Expected path parameter
 * @param expectedBody Optional expected body parameter (for POST/PUT)
 */
export function assertHttpClientCall(
  mockClient: jest.Mocked<HttpClient>,
  method: 'get' | 'post' | 'put',
  expectedPath: string,
  expectedBody?: unknown
): void {
  const mockMethod = mockClient[method];
  expect(mockMethod).toHaveBeenCalled();

  if (method === 'get') {
    expect(mockMethod).toHaveBeenCalledWith(expectedPath, undefined);
  } else {
    expect(mockMethod).toHaveBeenCalledWith(expectedPath, expectedBody, undefined);
  }
}

/**
 * @description Creates a delay for testing async operations.
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @description Waits for a condition to be true, with timeout.
 * @param condition Function that returns true when condition is met
 * @param timeoutMs Maximum time to wait in milliseconds (default: 1000)
 * @param intervalMs Check interval in milliseconds (default: 50)
 * @returns Promise that resolves when condition is met or rejects on timeout
 */
export async function waitFor(
  condition: () => boolean,
  timeoutMs: number = 1000,
  intervalMs: number = 50
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`);
    }
    await delay(intervalMs);
  }
}

