/**
 * @file auth.ts
 * @summary Helpers to extract tenant and actor information from the request.
 *
 * @description
 * Thin utilities on top of the shared auth middleware (`withAuth` / `requireAuth`)
 * and the shared HTTP header helpers. They:
 * - Resolve the tenant id from the normalized auth context (with a safe fallback).
 * - Build an "actor" snapshot (userId, email, ip, userAgent).
 * - Optionally enforce an opaque header token (e.g., "x-request-token").
 *
 * Keep controllers thin by using these helpers instead of duplicating logic.
 */

import type { ApiEvent } from "@lawprotect/shared-ts";
import { requireAuth } from "@lawprotect/shared-ts";
import { getHeaders, requireHeaderToken } from "@lawprotect/shared-ts";

/** Default tenant fallback used when auth context doesn't carry a tenant id. */
const DEFAULT_TENANT = "default-tenant";

/**
 * @description Resolves the tenant identifier from the normalized auth context.
 * Provides a safe fallback to default tenant when auth context doesn't include tenant information.
 *
 * @param {ApiEvent} evt - API event (already passed through the shared `withAuth` middleware)
 * @returns {string} Tenant id string; falls back to {@link DEFAULT_TENANT}
 * @throws {Error} If there is no auth context attached to the event
 */
export const tenantFromCtx = (evt: ApiEvent): string =>
  requireAuth(evt).tenantId ?? DEFAULT_TENANT;

/**
 * @description Extracts client IP address from request headers and API Gateway context.
 * Uses best-effort approach: prefers X-Forwarded-For header, falls back to API Gateway source IP.
 *
 * @param {ApiEvent} evt - API event containing headers and request context
 * @returns {string | undefined} A client IP string or `undefined` when it cannot be determined
 */
export const clientIp = (evt: ApiEvent): string | undefined => {
  const xff = getHeaders(evt.headers, "x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  // API Gateway v2 HTTP
  return (evt as any).requestContext?.http?.sourceIp as string | undefined;
};

/**
 * @description Builds an "actor" snapshot from authentication and transport details.
 * Combines user information from auth context with client information from transport layer.
 *
 * @param {ApiEvent} evt - API event (already passed through the shared `withAuth` middleware)
 * @returns {Object} An object containing userId, email from auth and ip, userAgent from transport
 * @throws {Error} If there is no auth context attached to the event
 */
export const actorFromCtx = (evt: ApiEvent) => {
  const auth = requireAuth(evt);
  return {
    userId: auth.userId,
    email: auth.email,
    ip: clientIp(evt),
    userAgent: getHeaders(evt.headers, "user-agent"),
  };
};

/**
 * @description Requires an opaque request token from a specified header.
 * Validates token presence and minimum length, throwing typed 401 error when validation fails.
 *
 * @param {ApiEvent} evt - API event containing headers
 * @param {string} header - Header name to read (default: "x-request-token")
 * @param {number} minLength - Minimum allowed token length (default: 16)
 * @returns {string} The validated token string
 * @throws {AppError} 401 when the header is missing or shorter than `minLength`
 */
export const requireRequestToken = (
  evt: ApiEvent,
  header = "x-request-token",
  minLength = 16
): string => requireHeaderToken(evt.headers, header, minLength);
