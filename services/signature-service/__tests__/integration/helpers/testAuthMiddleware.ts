/**
 * @file testAuthMiddleware.ts
 * @summary Test authentication middleware using shared secret
 * @description Custom auth middleware for tests that uses HS256 with shared secret
 */

import type { HandlerFn, ApiEvent } from '@lawprotect/shared-ts';
import { mapError, UnauthorizedError } from '@lawprotect/shared-ts';
import { verify } from 'jsonwebtoken';

/**
 * Test authentication middleware using shared secret
 * @param fn Business handler to execute after auth succeeds
 * @param secret Shared secret for JWT verification
 * @returns Handler that performs auth before calling the business function
 */
export const withTestAuth = (fn: HandlerFn, secret: string): HandlerFn => {
  return async (evt: ApiEvent) => {
    try {
      const authHeader = evt.headers?.authorization ?? evt.headers?.Authorization;
      
      if (!authHeader) {
        return mapError(new UnauthorizedError("Missing authorization header"));
      }

      const [scheme, token] = authHeader.trim().split(/\s+/, 2);
      if (!/^Bearer$/i.test(scheme)) {
        return mapError(new UnauthorizedError("Invalid authorization scheme"));
      }

      if (!token) {
        return mapError(new UnauthorizedError("Missing bearer token"));
      }

      // Verify JWT with shared secret
      const decoded = verify(token, secret) as any;
      
      // Attach auth context to event
      (evt as any).auth = {
        userId: decoded.sub,
        roles: decoded.roles ?? [],
        scopes: decoded.scopes ?? [],
        permissions: undefined,
        rawClaims: decoded,
        token,
        email: decoded.email
      };

      return fn(evt);
    } catch (err: any) {
      console.error('Auth error:', err);
      
      if (err.name === 'TokenExpiredError') {
        return mapError(new UnauthorizedError("Token expired"));
      }
      
      if (err.name === 'JsonWebTokenError') {
        return mapError(new UnauthorizedError("Invalid token"));
      }
      
      // For other unexpected errors, delegate to global mapper (usually 500)
      return mapError(err);
    }
  };
};


