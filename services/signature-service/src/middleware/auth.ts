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
 * Resolves the tenant identifier from the normalized auth context.
 *
 * @param evt - API event (already passed through the shared `withAuth` middleware).
 * @returns Tenant id string; falls back to {@link DEFAULT_TENANT}.
 * @throws If there is no auth context attached to the event.
 */
export const tenantFromCtx = (evt: ApiEvent): string =>
  requireAuth(evt).tenantId ?? DEFAULT_TENANT;

/**
 * Best-effort client IP extraction:
 * - Prefer the first value in the X-Forwarded-For header (if present).
 * - Fallback to API Gateway's requestContext.http.sourceIp (when available).
 *
 * @param evt - API event
 * @returns A client IP string or `undefined` when it cannot be determined.
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
 * Builds an "actor" snapshot from auth & transport details.
 *
 * @param evt - API event (already passed through the shared `withAuth` middleware).
 * @returns An object with userId/email from auth and ip/userAgent from transport.
 * @throws If there is no auth context attached to the event.
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
 * Requires an opaque request token from a header (e.g., "x-request-token").
 * Throws a typed 401 error when missing/invalid.
 *
 * @param evt - API event
 * @param header - Header name to read (default: "x-request-token")
 * @param minLength - Minimum allowed token length (default: 16)
 * @returns The token string
 * @throws {AppError} 401 when the header is missing or shorter than `minLength`
 */
export const requireRequestToken = (
  evt: ApiEvent,
  header = "x-request-token",
  minLength = 16
): string => requireHeaderToken(evt.headers, header, minLength);
