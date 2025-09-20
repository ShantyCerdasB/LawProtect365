import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWSHeaderParameters } from "jose";
import { toJwtClaims } from "./claims.js";
import type { JwtVerifyOptions, JwtVerificationResult } from "../types/auth.js";
import { getEnv, getNumber } from "../utils/env.js";

/**
 * Extracts a bearer token from an Authorization header value.
 *
 * @param authHeader Authorization header value.
 * @returns Token string or undefined.
 */
export const bearerFromAuthHeader = (authHeader?: string | null): string | undefined => {
  if (!authHeader) return undefined;
  const [scheme, token] = authHeader.trim().split(/\s+/, 2);
  if (!/^Bearer$/i.test(scheme)) return undefined;
  return token;
};

/**
 * Creates a remote JWKS loader with caching and rate-limiting.
 * Falls back to issuer's `/.well-known/jwks.json` when `jwksUri` is not provided.
 * @remarks
 * - Replaced the trailing-slash regex with a loop-based trim to avoid any potential super-linear backtracking risks.
 *
 * @param issuer JWT issuer URL.
 * @param jwksUri Optional explicit JWKS endpoint.
 */
const makeJwks = (issuer: string, jwksUri?: string) => {
  let trimmed = issuer;
  while (trimmed.endsWith("/")) trimmed = trimmed.slice(0, -1);
  const url = new URL(jwksUri ?? `${trimmed}/.well-known/jwks.json`);
  return createRemoteJWKSet(url, {
    cacheMaxAge: getNumber("JWKS_CACHE_SECONDS", 600) * 1000,
    cooldownDuration: 1000});
};

/**
 * Verifies a JWT token using RS256 and returns normalized claims.
 * Validates issuer, audience, and expiration with a small clock tolerance.
 *
 * @param token JWT string.
 * @param opts Verification options (issuer, audience, jwksUri, clockToleranceSec).
 * @returns Verification result with header, payload, and normalized claims.
 */
export const verifyJwt = async (
  token: string,
  opts: JwtVerifyOptions
): Promise<JwtVerificationResult> => {
  
  const issuer = opts.issuer ?? getEnv("JWT_ISSUER")!;
  const audience = opts.audience ?? getEnv("JWT_AUDIENCE");
  
  const jwksUri = opts.jwksUri ?? process.env.JWKS_URI;
  
  const jwks = makeJwks(issuer, jwksUri);

  try {
    const { payload, protectedHeader } = await jwtVerify(token, jwks, {
      issuer,
      audience,
      algorithms: ["RS256"],
      clockTolerance: opts.clockToleranceSec ?? 5});
    

    return {
      header: protectedHeader as JWSHeaderParameters,
      payload: payload as Record<string, unknown>,
      claims: toJwtClaims(payload as JWTPayload)};
  } catch (error) {
    console.log('❌ [JWT VERIFIER DEBUG] JWT verification failed:', error);
    throw error;
  }
};
