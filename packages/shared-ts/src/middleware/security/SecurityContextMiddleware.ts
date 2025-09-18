/**
 * @fileoverview SecurityContextMiddleware - Unified security context middleware
 * @summary Security context creation and validation middleware for shared-ts
 * @description Creates unified security context from HTTP request and authentication data.
 * This middleware extracts IP, user agent, and other security-related information
 * from the request and creates a standardized security context.
 */

import type { BeforeMiddleware } from "../../http/middleware.js";
import { AccessType, PermissionLevel, RequestSecurityContext } from "../../security/index.js";

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
  return (evt) => {
    const auth = (evt as any).auth;
    
    // Extract IP address from various sources
    const ipAddress = extractIpAddress(evt);
    
    // Extract user agent
    const userAgent = evt.headers?.['user-agent'] || 
                     evt.headers?.['User-Agent'] || 
                     'Unknown';
    
    // Determine access type based on request characteristics
  const accessType = determineAccessType(evt);
    
    // Determine permission level based on auth context
    const permission = determinePermissionLevel(auth, evt);
    
    // Extract request and trace IDs
    const requestId = evt.headers?.['x-request-id'] || 
                     evt.headers?.['X-Request-Id'] ||
                     evt.requestContext?.requestId;
    
    const traceId = evt.headers?.['x-trace-id'] || 
                   evt.headers?.['X-Trace-Id'];

    // Create security context
    const securityContext: RequestSecurityContext = {
      userId: auth?.userId,
      ipAddress,
      userAgent,
      accessType,
      permission,
      timestamp: new Date(),
      deviceFingerprint: generateDeviceFingerprint(evt),
      country: extractCountry(evt)
    };

    // Attach security context to event
    (evt as any).securityContext = securityContext;
    
    console.log('✅ [SECURITY DEBUG] Security context created:', {
      userId: securityContext.userId,
      ipAddress: securityContext.ipAddress,
      accessType: securityContext.accessType,
      permission: securityContext.permission
    });
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
  if (evt.headers?.['x-shared-link'] || evt.queryStringParameters?.sharedLink) {
    return AccessType.SHARED_LINK;
  }
  
  // Check for invitation access
  if (evt.headers?.['x-invitation-token'] || evt.queryStringParameters?.invitationToken) {
    return AccessType.INVITATION;
  }
  // Also check path and body for invitation token shapes used by signing endpoints
  try {
    if (evt.pathParameters?.invitationToken) {
      return AccessType.INVITATION;
    }
    if (evt.body) {
      const parsed = typeof evt.body === 'string' ? JSON.parse(evt.body) : evt.body;
      if (parsed && typeof parsed === 'object' && parsed.invitationToken) {
        return AccessType.INVITATION;
      }
    }
  } catch {}
  
  // If authenticated user present, treat as DIRECT access
  if ((evt as any)?.auth) {
    return AccessType.DIRECT;
  }
  
  // Check for API access
  const authzHeader = evt.headers?.['authorization'] || evt.headers?.['Authorization'];
  if (evt.headers?.['x-api-key'] || (typeof authzHeader === 'string' && authzHeader.startsWith('Bearer'))) {
    return AccessType.API;
  }
  
  // Check for system access
  if (evt.headers?.['x-system-token'] || evt.requestContext?.identity?.userAgent?.includes('system')) {
    return AccessType.SYSTEM;
  }
  
  // Check for public access
  if (!authzHeader && !evt.headers?.['x-api-key']) {
    return AccessType.PUBLIC;
  }
  
  // Default to direct access
  return AccessType.DIRECT;
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
