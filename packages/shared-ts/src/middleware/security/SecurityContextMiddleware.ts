/**
 * @fileoverview SecurityContextMiddleware - Unified security context middleware
 * @summary Security context creation and validation middleware for shared-ts
 * @description Creates unified security context from HTTP request and authentication data.
 * This middleware extracts IP, user agent, and other security-related information
 * from the request and creates a standardized security context.
 */

import type { BeforeMiddleware } from "../../http/middleware.js";
import { AccessType, PermissionLevel, RequestSecurityContext } from "../../security/index.js";
import { BadRequestError } from "../../errors/index.js";
import { SecurityContextBuilder } from "./SecurityContextBuilder.js";

// RequestSecurityContext is imported from security/index.js

/**
 * Security context middleware
 * 
 * Creates unified security context from HTTP request and authentication data.
 * This middleware should be used after authentication middleware.
 * 
 * @returns BeforeMiddleware that creates security context
 */
export const withSecurityContext = (): BeforeMiddleware => {
  const contextBuilder = new SecurityContextBuilder();
  
  return (evt) => {
    const auth = (evt as any).auth;
    
    const requestData = {
      headers: evt.headers,
      requestContext: evt.requestContext,
      securityContext: auth,
      requestBody: evt.body
    };
    
    const baseContext = contextBuilder.build(requestData);
    
    // Determine permission level based on auth context
    const permission = determinePermissionLevel(auth, evt);
    

    // Create security context
    // Enforce required security telemetry (no defaults)
    if (!baseContext.ipAddress) {
      throw new BadRequestError('Missing ipAddress in request (x-forwarded-for/x-real-ip or sourceIp required)', 'SECURITY_MISSING_IP');
    }
    if (!baseContext.userAgent && !evt.requestContext?.http?.userAgent) {
      throw new BadRequestError('Missing userAgent in request (User-Agent header required)', 'SECURITY_MISSING_UA');
    }
    if (!baseContext.country) {
      throw new BadRequestError('Missing country in request (x-country/CF-IPCountry header required)', 'SECURITY_MISSING_COUNTRY');
    }

    const securityContext: RequestSecurityContext = {
      userId: baseContext.userId,
      ipAddress: baseContext.ipAddress!,
      userAgent: (baseContext.userAgent || evt.requestContext?.http?.userAgent)!,
      accessType: baseContext.accessType || AccessType.DIRECT,
      permission,
      timestamp: new Date(),
      deviceFingerprint: generateDeviceFingerprint(evt),
      country: baseContext.country!
    };

    // Attach security context to event
    (evt as any).securityContext = securityContext;
    
  };
};

/**
 * Extracts IP address from request
 */
function extractIpAddress(evt: any): string {
  // Try x-forwarded-for header first (for load balancers)
  const forwardedFor = evt.headers?.['x-forwarded-for'] || 
                      evt.headers?.['X-Forwarded-For'];
  
  if (forwardedFor) {
    // Take the first IP in the chain
    return forwardedFor.split(',')[0].trim();
  }
  
  // Try x-real-ip header
  const realIp = evt.headers?.['x-real-ip'] || 
                evt.headers?.['X-Real-IP'];
  
  if (realIp) {
    return realIp.trim();
  }
  
  // Fall back to request context
  const sourceIp = evt.requestContext?.identity?.sourceIp;
  if (sourceIp) {
    return sourceIp;
  }
  
  // Default for development
  return '127.0.0.1';
}

/**
 * Determines access type based on request characteristics
 */
function determineAccessType(evt: any): AccessType {
  // Check for shared link access
  if (hasSharedLinkAccess(evt)) {
    return AccessType.SHARED_LINK;
  }
  
  // Check for invitation access
  if (hasInvitationAccess(evt)) {
    return AccessType.INVITATION;
  }
  
  // If authenticated user present, treat as DIRECT access
  if (evt.auth) {
    return AccessType.DIRECT;
  }
  
  // Check for API access
  if (hasApiAccess(evt)) {
    return AccessType.API;
  }
  
  // Check for system access
  if (hasSystemAccess(evt)) {
    return AccessType.SYSTEM;
  }
  
  // Check for public access
  if (hasPublicAccess(evt)) {
    return AccessType.PUBLIC;
  }
  
  // Default to direct access
  return AccessType.DIRECT;
}

/**
 * Checks if request has shared link access
 */
function hasSharedLinkAccess(evt: any): boolean {
  return !!(evt.headers?.['x-shared-link'] || evt.queryStringParameters?.sharedLink);
}

/**
 * Checks if request has invitation access
 */
function hasInvitationAccess(evt: any): boolean {
  // Check headers and query parameters
  if (evt.headers?.['x-invitation-token'] || evt.queryStringParameters?.invitationToken) {
    return true;
  }
  
  // Check path parameters
  if (evt.pathParameters?.invitationToken) {
    return true;
  }
  
  // Check body for invitation token
  return hasInvitationTokenInBody(evt);
}

/**
 * Checks if invitation token exists in request body
 */
function hasInvitationTokenInBody(evt: any): boolean {
  if (!evt.body) {
    return false;
  }
  
  try {
    const parsed = typeof evt.body === 'string' ? JSON.parse(evt.body) : evt.body;
    return !!(parsed && typeof parsed === 'object' && parsed.invitationToken);
  } catch {
    return false;
  }
}

/**
 * Checks if request has API access
 */
function hasApiAccess(evt: any): boolean {
  const authzHeader = evt.headers?.['authorization'] || evt.headers?.['Authorization'];
  return !!(evt.headers?.['x-api-key'] || (typeof authzHeader === 'string' && authzHeader.startsWith('Bearer')));
}

/**
 * Checks if request has system access
 */
function hasSystemAccess(evt: any): boolean {
  return !!(evt.headers?.['x-system-token'] || evt.requestContext?.identity?.userAgent?.includes('system'));
}

/**
 * Checks if request has public access
 */
function hasPublicAccess(evt: any): boolean {
  const authzHeader = evt.headers?.['authorization'] || evt.headers?.['Authorization'];
  return !authzHeader && !evt.headers?.['x-api-key'];
}

/**
 * Determines permission level based on auth context
 */
function determinePermissionLevel(auth: any, evt: any): PermissionLevel {
  if (!auth) {
    return PermissionLevel.PARTICIPANT;
  }
  
  // Import role helpers
  const { normalizeRoles, maxRole } = require("../../auth/roles.js");
  
  if (!auth.roles || auth.roles.length === 0) {
    return PermissionLevel.PARTICIPANT;
  }
  
  const normalizedRoles = normalizeRoles(auth.roles);
  const highestRole = maxRole(normalizedRoles);
  
  // Map roles to permission levels
  switch (highestRole) {
    case 'super_admin':
    case 'admin':
      return PermissionLevel.ADMIN;
    case 'lawyer':
      return PermissionLevel.EDITOR;
    case 'customer':
      return PermissionLevel.VIEWER;
    default:
      return PermissionLevel.PARTICIPANT;
  }
}

/**
 * Generates device fingerprint from request
 */
function generateDeviceFingerprint(evt: any): string | undefined {
  const userAgent = evt.headers?.['user-agent'] || evt.headers?.['User-Agent'];
  const acceptLanguage = evt.headers?.['accept-language'] || evt.headers?.['Accept-Language'];
  
  if (!userAgent) {
    return undefined;
  }
  
  // Simple fingerprint based on user agent and language
  const fingerprint = `${userAgent}:${acceptLanguage || 'unknown'}`;
  return Buffer.from(fingerprint).toString('base64').substring(0, 32);
}

/**
 * Extracts country from request headers
 */
function extractCountry(evt: any): string | undefined {
  return evt.headers?.['x-country'] || 
         evt.headers?.['X-Country'] ||
         evt.headers?.['cf-ipcountry'] ||
         evt.headers?.['CF-IPCountry'];
}

/**
 * Extracts session ID from request
 */
function extractSessionId(evt: any): string | undefined {
  return evt.headers?.['x-session-id'] || 
         evt.headers?.['X-Session-Id'] ||
         evt.cookies?.['sessionId'] ||
         evt.cookies?.['session_id'];
}
