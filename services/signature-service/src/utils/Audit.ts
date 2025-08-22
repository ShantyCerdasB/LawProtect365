
/**
 * @file audit.ts
 * @summary Helpers for building audit metadata from HTTP requests.
 *
 * @description
 * Produces a normalized "actor" object for audit events using the
 * authentication context and selected request headers.
 */

export interface AuthLike {
  userId?: string;
  email?: string;
  role?: string;
}

export interface AuditActor {
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  locale?: string;
  role?: string;
}

/**
 * Builds a sanitized actor descriptor for audit events.
 *
 * @param evt API Gateway (or similar) event carrying headers and request context.
 * @param auth Authentication context with user identifiers.
 * @returns A minimal, sanitized actor payload.
 */
export const buildAuditActor = (evt: any, auth: AuthLike = {}): AuditActor => {
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
