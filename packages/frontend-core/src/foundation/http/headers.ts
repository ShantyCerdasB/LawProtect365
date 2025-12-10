/**
 * @fileoverview Headers utils - compose auth/network headers for outbound requests
 * @summary Header builder for HttpClient interception
 * @description Builds HTTP headers from auth token, network context and optional extras.
 */

import type { NetworkContext } from './types';

/**
 * @description Builds HTTP headers from auth token and network context.
 * @param params.token Optional bearer token
 * @param params.context Optional network context (ip, country, userAgent, requestId)
 * @param params.extra Optional additional headers to merge
 * @returns A lowercased header map ready to send with fetch
 */
export function buildContextHeaders(params: {
  token?: string | null;
  context?: NetworkContext;
  extra?: Record<string, string | undefined>;
}): Record<string, string> {
  const headers: Record<string, string> = {};

  if (params.token) {
    headers['authorization'] = `Bearer ${params.token}`;
  }

  const ctx = params.context;
  if (ctx?.ip) headers['x-forwarded-for'] = ctx.ip;
  if (ctx?.country) headers['x-country'] = ctx.country;
  if (ctx?.userAgent) headers['x-user-agent'] = ctx.userAgent;
  if (ctx?.requestId) headers['x-request-id'] = ctx.requestId;

  for (const [key, value] of Object.entries(params.extra || {})) {
    if (value !== undefined) {
      headers[key.toLowerCase()] = value;
    }
  }

  return headers;
}

