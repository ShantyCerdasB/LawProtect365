import type { HandlerFn, ApiEvent } from "@http/httpTypes.js";
import { mapError } from "@errors/mapError.js";
import { ErrorCodes } from "@errors/codes.js";
import type { JwtVerifyOptions } from "../types/auth.js";
import { bearerFromAuthHeader, verifyJwt } from "./jwtVerifier.js";

/**
 * Wraps a handler with JWT verification and attaches auth context to the event.
 * On failure returns 401 with a consistent error body.
 *
 * @param fn Business handler to execute after auth succeeds.
 * @param opts JWT verification options (issuer, audience, jwksUri, clockToleranceSec).
 * @returns Handler that performs auth before calling the business function.
 */
export const withAuth = (fn: HandlerFn, opts: JwtVerifyOptions = {}): HandlerFn => {
  return async (evt: ApiEvent) => {
    try {
      const token =
        bearerFromAuthHeader(evt.headers?.authorization ?? evt.headers?.Authorization);

      if (!token) {
        return mapError(makeUnauthorized("Missing bearer token"));
      }

      const { claims } = await verifyJwt(token, opts);

      (evt as any).auth = {
        userId: claims.sub,
        tenantId: claims.tenantId,
        roles: claims.roles ?? [],
        scopes: claims.scopes ?? [],
        permissions: undefined,
        rawClaims: claims.raw,
        token,
        email: claims.email
      };

      return fn(evt);
    } catch (err: any) {
      const name = String(err?.name ?? "");

      if (name === "JWTExpired") {
        return mapError(makeUnauthorized("Token expired"));
      }

      if (
        name === "JWTInvalid" ||
        name === "JWSInvalid" ||
        name === "JWSSignatureVerificationFailed" ||
        name === "JWTClaimValidationFailed"
      ) {
        return mapError(makeUnauthorized("Invalid token"));
      }

      // For other unexpected errors, delegate to global mapper (usually 500)
      return mapError(err);
    }
  };
};

const makeUnauthorized = (message: string) => {
  const e: any = new Error(message);
  e.name = "UnauthorizedError";
  e.statusCode = 401;
  e.code = ErrorCodes.AUTH_UNAUTHORIZED;
  return e;
};
