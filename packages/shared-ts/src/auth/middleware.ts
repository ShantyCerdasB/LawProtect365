/**
 * @file middleware.ts
 * @summary Authentication and authorization middleware
 * @description Unified middleware that handles JWT authentication and basic role validation
 */

import type { HandlerFn, ApiEvent } from "../http/httpTypes.js";
import { mapError } from "../errors/mapError.js";
import { ErrorCodes } from "../errors/codes.js";
import { UnauthorizedError, ForbiddenError } from "../errors/errors.js";
import type { JwtVerifyOptions } from "../types/auth.js";
import { bearerFromAuthHeader, verifyJwt } from "./jwtVerifier.js";
import { normalizeRoles, hasRole } from "./roles.js";
import { VALID_COGNITO_ROLES } from "./validRoles.js";
import type { UserRole } from "../types/auth.js";

/**
 * Unified authentication and authorization middleware
 * Handles JWT verification and basic role validation in one flow
 */
export const withAuth = (fn: HandlerFn, opts: JwtVerifyOptions = {}): HandlerFn => {
  return async (evt: ApiEvent) => {
    try {
      // Step 1: Extract and verify JWT token
      const token =
        bearerFromAuthHeader(evt.headers?.authorization ?? evt.headers?.Authorization);

      if (!token) {
        return mapError(makeUnauthorized("Missing bearer token"));
      }

      const { claims } = await verifyJwt(token, opts);

      // Step 2: Create auth object
      const auth = {
        userId: claims.sub,
        roles: claims.roles ?? [],
        scopes: claims.scopes ?? [],
        permissions: undefined,
        rawClaims: claims.raw,
        token,
        email: claims.email
      };

      // Step 3: Validate roles (basic authorization)
      if (!auth.roles || auth.roles.length === 0) {
        return mapError(new ForbiddenError(
          `Insufficient permissions. Valid roles required: ${VALID_COGNITO_ROLES.join(", ")}`,
          ErrorCodes.AUTH_FORBIDDEN
        ));
      }

      // Normalize roles to canonical UserRole format
      const normalizedRoles = normalizeRoles(auth.roles);
      
      // Check if user has at least one valid Cognito role
      const hasValidRole = VALID_COGNITO_ROLES.some(role => 
        hasRole(normalizedRoles, role as UserRole)
      );

      if (!hasValidRole) {
        return mapError(new ForbiddenError(
          `Insufficient permissions. Valid roles required: ${VALID_COGNITO_ROLES.join(", ")}`,
          ErrorCodes.AUTH_FORBIDDEN
        ));
      }

      // Step 4: Attach auth to event and continue
      (evt as any).auth = auth;

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

/**
 * Helper function to create UnauthorizedError
 */
const makeUnauthorized = (message: string): UnauthorizedError => {
  return new UnauthorizedError(message, ErrorCodes.AUTH_UNAUTHORIZED);
};