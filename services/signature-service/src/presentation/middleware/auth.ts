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
import { getHeaders } from "@lawprotect/shared-ts";

// tenantFromCtx moved to @lawprotect/shared-ts

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

// actorFromCtx moved to @lawprotect/shared-ts

// requireRequestToken moved to @lawprotect/shared-ts as requireHeaderToken






