/**
 * @fileoverview AuthMiddleware - JWT Authentication middleware
 * @summary JWT authentication middleware for shared-ts
 * @description Provides JWT token verification and authentication context creation
 * without authorization logic. This middleware only handles authentication,
 * authorization should be handled by separate middleware.
 */

import type { BeforeMiddleware } from "../../http/middleware.js";
import { bearerFromAuthHeader, verifyJwt } from "../../auth/jwtVerifier.js";
import { UnauthorizedError, ErrorCodes } from "../../errors/index.js";
import type { JwtVerifyOptions } from "../../types/auth.js";

/**
 * Extracts invitation token from request body
 */
function extractInvitationTokenFromBody(body: any): string | null {
  if (!body) {
    return null;
  }
  
  try {
    let parsed;
    if (typeof body === 'string') {
      
      // Try parsing once
      let firstParse = JSON.parse(body);
      
      // If the result is still a string, try parsing again
      if (typeof firstParse === 'string') {
        parsed = JSON.parse(firstParse);
      } else {
        parsed = firstParse;
      }
    } else {
      parsed = body;
    }
    
    
    if (parsed?.invitationToken && typeof parsed.invitationToken === 'string') {
      // Any string in invitationToken field is considered valid (no prefix check needed)
      return parsed.invitationToken;
    }
  } catch (e) {
    // Ignore JSON parsing errors for invitation token
    console.debug('Failed to parse invitation token from query:', e);
  }
  
  return null;
}

/**
 * Extracts invitation token from query parameters
 */
function extractInvitationTokenFromQuery(query: any): string | null {
  if (query?.invitationToken && typeof query.invitationToken === 'string') {
    return query.invitationToken;
  }
  return null;
}

/**
 * JWT Authentication middleware
 * 
 * This middleware only handles JWT token verification and creates authentication context.
 * It does NOT handle authorization (role/permission validation).
 * 
 * @param opts - JWT verification options
 * @returns BeforeMiddleware that verifies JWT and attaches auth context
 */
export const withJwtAuth = (opts: JwtVerifyOptions = {}): BeforeMiddleware => {
  return async (evt) => {
    try {
      
      // Step 1: Extract JWT token from Authorization header
      const token = bearerFromAuthHeader(
        evt.headers?.authorization ?? evt.headers?.Authorization
      );


      // Step 1.5: Check for invitation token in request body or query parameters if no JWT token
      if (!token) {
        const invitationToken = extractInvitationTokenFromBody(evt.body) || 
                               extractInvitationTokenFromQuery(evt.queryStringParameters);
        if (invitationToken) {
          
          // Create auth context for invitation token
          const auth = {
            userId: 'external-user',
            roles: [],
            scopes: [],
            permissions: undefined,
            rawClaims: null,
            token: invitationToken,
            email: null,
            tokenType: 'INVITATION'
          };

          (evt as any).auth = auth;
          return;
        }
        
        throw new UnauthorizedError(
          "Missing bearer token",
          ErrorCodes.AUTH_UNAUTHORIZED
        );
      }

      // Step 2: Verify JWT token
      const { claims } = await verifyJwt(token, opts);

      // Step 3: Create authentication context
      const auth = {
        userId: claims.sub,
        roles: claims.roles ?? [],
        scopes: claims.scopes ?? [],
        permissions: undefined, // Will be set by authorization middleware
        rawClaims: claims.raw,
        token,
        email: claims.email,
        tokenType: 'JWT'
      };

      // Step 4: Attach auth context to event
      (evt as any).auth = auth;
      
    } catch (err: any) {
      const name = String(err?.name ?? "");

      if (name === "JWTExpired") {
        throw new UnauthorizedError("Token expired", ErrorCodes.AUTH_UNAUTHORIZED);
      }

      if (
        name === "JWTInvalid" ||
        name === "JWSInvalid" ||
        name === "JWSSignatureVerificationFailed" ||
        name === "JWTClaimValidationFailed"
      ) {
        throw new UnauthorizedError("Invalid token", ErrorCodes.AUTH_UNAUTHORIZED);
      }

      // Re-throw other errors
      throw err;
    }
  };
};

/**
 * Optional JWT Authentication middleware
 * 
 * Similar to withJwtAuth but does not throw errors if token is missing.
 * Useful for endpoints that can work with or without authentication.
 * 
 * @param opts - JWT verification options
 * @returns BeforeMiddleware that verifies JWT if present
 */
export const withOptionalJwtAuth = (opts: JwtVerifyOptions = {}): BeforeMiddleware => {
  return async (evt) => {
    try {
      const token = bearerFromAuthHeader(
        evt.headers?.authorization ?? evt.headers?.Authorization
      );

      if (!token) {
        // No token provided, continue without auth context
        return;
      }

      // Verify token if present
      const { claims } = await verifyJwt(token, opts);
      
      const auth = {
        userId: claims.sub,
        roles: claims.roles ?? [],
        scopes: claims.scopes ?? [],
        permissions: undefined,
        rawClaims: claims.raw,
        token,
        email: claims.email
      };

      (evt as any).auth = auth;
    } catch (err: any) {
      // For optional auth, we ignore JWT errors and continue without auth context
      console.warn('Optional JWT auth failed:', err.message);
    }
  };
};
