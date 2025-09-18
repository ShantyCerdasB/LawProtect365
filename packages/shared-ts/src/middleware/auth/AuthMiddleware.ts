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
  console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - body:', body);
  console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - body type:', typeof body);
  
  if (!body) {
    console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - no body');
    return null;
  }
  
  try {
    let parsed;
    if (typeof body === 'string') {
      console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - parsing string body');
      console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - body length:', body.length);
      console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - body first 100 chars:', body.substring(0, 100));
      
      // Try parsing once
      let firstParse = JSON.parse(body);
      console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - first parse type:', typeof firstParse);
      console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - first parse:', firstParse);
      
      // If the result is still a string, try parsing again
      if (typeof firstParse === 'string') {
        console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - first parse was string, trying second parse');
        parsed = JSON.parse(firstParse);
        console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - second parse type:', typeof parsed);
        console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - second parse:', parsed);
      } else {
        parsed = firstParse;
      }
    } else {
      console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - body is already object');
      parsed = body;
    }
    
    console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - final parsed:', parsed);
    console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - final parsed type:', typeof parsed);
    console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - final parsed keys:', Object.keys(parsed || {}));
    
    console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - checking conditions:', {
      hasInvitationToken: !!parsed?.invitationToken,
      invitationTokenType: typeof parsed?.invitationToken,
      invitationTokenValue: parsed?.invitationToken,
      directAccess: parsed['invitationToken']
    });
    
    if (parsed?.invitationToken && typeof parsed.invitationToken === 'string') {
      console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - found invitationToken:', parsed.invitationToken);
      // Any string in invitationToken field is considered valid (no prefix check needed)
      return parsed.invitationToken;
    }
  } catch (e) {
    console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - parsing error:', e);
  }
  
  console.log('🔍 [AUTH DEBUG] extractInvitationTokenFromBody - no invitation token found');
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
      console.log('🔍 [AUTH DEBUG] Starting JWT verification...');
      
      // Step 1: Extract JWT token from Authorization header
      const token = bearerFromAuthHeader(
        evt.headers?.authorization ?? evt.headers?.Authorization
      );

      console.log('🔍 [AUTH DEBUG] Extracted token:', token ? token.substring(0, 50) + '...' : 'null');

      // Step 1.5: Check for invitation token in request body if no JWT token
      if (!token) {
        const invitationToken = extractInvitationTokenFromBody(evt.body);
        if (invitationToken) {
          console.log('🔍 [AUTH DEBUG] Found invitation token in request body');
          
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
          console.log('✅ [AUTH DEBUG] Invitation token authentication successful');
          return;
        }
        
        console.log('❌ [AUTH DEBUG] No token found in headers or body');
        throw new UnauthorizedError(
          "Missing bearer token",
          ErrorCodes.AUTH_UNAUTHORIZED
        );
      }

      // Step 2: Verify JWT token
      console.log('🔍 [AUTH DEBUG] About to verify JWT with opts:', opts);
      const { claims } = await verifyJwt(token, opts);
      console.log('🔍 [AUTH DEBUG] JWT verification successful, claims:', claims);

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
      
      console.log('✅ [AUTH DEBUG] Authentication successful, auth context attached');
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
