import type { JWTPayload } from "jose";
import type { JwtClaims } from "../types/auth.js";

/**
 * Normalizes a raw JWT payload into canonical JwtClaims.
 * Extracts standard OpenID fields and common provider-specific fields.
 * @remarks
 * - Extracted the nested ternary for `aud` into a separate variable for readability and maintainability.
 *
 * @param payload Raw JWT payload.
 * @returns Normalized JwtClaims.
 */
export const toJwtClaims = (payload: JWTPayload): JwtClaims => {
  const scopeStr =
    (typeof payload.scope === "string" && payload.scope) ||
    (typeof (payload as any)["scp"] === "string" && (payload as any)["scp"]) ||
    "";

  const roles =
    (Array.isArray((payload as any)["cognito:groups"]) && (payload as any)["cognito:groups"]) ||
    (Array.isArray((payload as any)["roles"]) && (payload as any)["roles"]) ||
    [];

  const tenantId =
    (payload as any)["tenant_id"] ??
    (payload as any)["custom:tenantId"] ??
    (payload as any)["https://claims.example.com/tenant_id"];

  let aud: string | string[] | undefined;
  if (typeof payload.aud === "string") {
    aud = payload.aud;
  } else if (Array.isArray(payload.aud)) {
    aud = payload.aud;
  }

  return {
    sub: String(payload.sub ?? ""),
    iss: String(payload.iss ?? ""),
    aud,
    exp: typeof payload.exp === "number" ? payload.exp : undefined,
    iat: typeof payload.iat === "number" ? payload.iat : undefined,
    jti: typeof payload.jti === "string" ? payload.jti : undefined,

    email: typeof (payload as any).email === "string" ? (payload as any).email : undefined,
    emailVerified:
      typeof (payload as any).email_verified === "boolean"
        ? (payload as any).email_verified
        : undefined,

    roles: roles.filter((r: unknown) => typeof r === "string"),
    scopes: scopeStr ? scopeStr.split(" ").filter(Boolean) : [],
    tenantId: typeof tenantId === "string" ? tenantId : undefined,
    raw: payload as Record<string, unknown>,
  };
};
