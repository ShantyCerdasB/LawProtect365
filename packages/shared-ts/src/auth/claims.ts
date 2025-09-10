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

  return {
    sub: String(payload.sub ?? ""),
    iss: String(payload.iss ?? ""),
    aud: typeof payload.aud === "string" || Array.isArray(payload.aud) ? payload.aud : undefined,
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
    raw: payload as Record<string, unknown>};
};
