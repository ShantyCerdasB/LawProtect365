/**
 * @fileoverview InterceptedHttpClient - Adds auth/network headers before delegating to HttpClient
 * @summary Header enrichment layer for fetch-based clients
 * @description Decorates fetch with auth token, network context and extra headers, then reuses HttpClient.
 */

import type { HttpClient } from './httpClient';
import { createHttpClient } from './httpClient';
import { buildContextHeaders } from './headers';
import type { NetworkContext } from './types';

/**
 * @description Provider that returns a bearer token when available.
 */
export type AuthTokenProvider = () => Promise<string | null>;

/**
 * @description Provider that returns network context (ip, country, ua) when available.
 */
export type NetworkContextProvider = () => Promise<NetworkContext | undefined>;

/**
 * @description Factory that decorates fetch with auth/network headers, then creates an HttpClient.
 * Single responsibility: header enrichment. Business endpoints live in module APIs.
 * @param params.baseUrl Base URL for all requests
 * @param params.fetchImpl Fetch-compatible implementation (web or native)
 * @param params.getAuthToken Optional provider to supply bearer token
 * @param params.getNetworkContext Optional provider to supply network context
 * @param params.buildExtraHeaders Optional provider to add custom headers (e.g., tracing)
 * @returns HttpClient with header enrichment
 */
export function createInterceptedHttpClient(params: {
  baseUrl: string;
  fetchImpl: typeof fetch;
  getAuthToken?: AuthTokenProvider;
  getNetworkContext?: NetworkContextProvider;
  buildExtraHeaders?: () => Promise<Record<string, string | undefined>>;
}): HttpClient {
  const enhancedFetch: typeof fetch = async (input, init) => {
    const [token, context, extra] = await Promise.all([
      params.getAuthToken?.() ?? null,
      params.getNetworkContext?.(),
      params.buildExtraHeaders?.() ?? {}
    ]);

    const mergedHeaders: Record<string, string> = {
      'content-type': 'application/json',
      ...buildContextHeaders({ token, context, extra }),
      ...(init?.headers ? normalizeHeaders(init.headers) : {})
    };

    return params.fetchImpl(input as string, {
      ...init,
      headers: mergedHeaders
    });
  };

  return createHttpClient(params.baseUrl, enhancedFetch);
}

function normalizeHeaders(headers: HeadersInit): Record<string, string> {
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers;
}

