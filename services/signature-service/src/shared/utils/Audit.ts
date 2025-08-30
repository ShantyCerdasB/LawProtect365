
/**
 * @file Audit.ts
 * @description Helpers for building audit metadata from HTTP requests.
 * Provides utilities for creating normalized actor objects for audit events using
 * authentication context and request headers.
 */

import { ActorContext } from "@/app/ports/shared";
/**
 * @description Interface representing authentication-like data containing user identifiers.
 * Used as input for building audit actor information.
 */
export interface AuthLike {
  /** User identifier */
  userId?: string;
  /** User email address */
  email?: string;
  /** User role */
  role?: string;
}


/**
 * @description Builds a sanitized actor descriptor for audit events.
 * Extracts and normalizes user and request information from API Gateway events and authentication context.
 *
 * @param {any} evt - API Gateway (or similar) event carrying headers and request context
 * @param {AuthLike} auth - Authentication context with user identifiers (default: empty object)
 * @returns {AuditActor} A minimal, sanitized actor payload for audit logging
 */
export const buildAuditActor = (evt: any, auth: AuthLike = {}): ActorContext => {
  const hdr = (name: string): string | undefined => {
    const h = evt?.headers ?? {};
    const val = h[name] ?? h[name.toLowerCase()];
    return typeof val === "string" ? val : undefined;
  };

  const firstIp = (x?: string) => (x ? x.split(",")[0]?.trim() : undefined);
  const sanitize = (v?: string) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 1024) : undefined;

  const ip =
    evt?.requestContext?.http?.sourceIp ??
    firstIp(hdr("x-forwarded-for"));

  return {
    userId: sanitize(auth.userId),
    email: sanitize(auth.email),
    role: sanitize(auth.role),
    ip: sanitize(ip),
    userAgent: sanitize(hdr("user-agent")),
    locale: sanitize(hdr("accept-language")),
  };
};
