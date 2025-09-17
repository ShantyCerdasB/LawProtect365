/**
 * @fileoverview EnvelopeSecurityContext type - Defines security context for envelope operations
 * @summary Type definition for envelope security context
 * @description The EnvelopeSecurityContext interface defines the security context required for
 * envelope operations. This extends the base SecurityContext from shared-ts with
 * envelope-specific fields.
 */

import { AccessType, PermissionLevel } from '@lawprotect/shared-ts';

/**
 * Security context for envelope operations
 * 
 * This context is automatically populated by the SecurityContextMiddleware from shared-ts.
 * It includes all standard security information plus envelope-specific fields.
 */
export interface EnvelopeSecurityContext {
  /**
   * User ID making the request
   * Extracted from JWT token or session by SecurityContextMiddleware
   */
  userId: string;

  /**
   * IP address of the request
   * Extracted automatically by SecurityContextMiddleware from:
   * - x-forwarded-for header (for load balancers)
   * - x-real-ip header
   * - request.requestContext.identity.sourceIp
   */
  ipAddress: string;

  /**
   * User agent string from the request
   * Extracted automatically by SecurityContextMiddleware from user-agent header
   */
  userAgent: string;

  /**
   * Access type for the request
   * Determined automatically by SecurityContextMiddleware based on request characteristics:
   * - DIRECT: Direct API call from authenticated user
   * - SHARED_LINK: Access via shared link
   * - INVITATION: Access via invitation token
   * - SYSTEM: Internal system call
   * - API: Programmatic API access
   * - PUBLIC: Public access
   */
  accessType: AccessType;

  /**
   * Permission level of the user
   * Determined automatically by SecurityContextMiddleware based on user role:
   * - OWNER: User owns the envelope (super_admin, admin, or envelope owner)
   * - ADMIN: Administrative access (admin role)
   * - EDITOR: Can modify content (lawyer role)
   * - VIEWER: Read-only access (customer role)
   * - PARTICIPANT: Can interact (signer via invitation)
   */
  permission: PermissionLevel;

  /**
   * Timestamp of the request
   * Set automatically by SecurityContextMiddleware
   */
  timestamp: Date;

  /**
   * Device fingerprint for additional security
   * Generated automatically by SecurityContextMiddleware from user agent and language
   */
  deviceFingerprint?: string;

  /**
   * Geographic location
   * Extracted automatically by SecurityContextMiddleware from headers:
   * - x-country, X-Country
   * - cf-ipcountry, CF-IPCountry (Cloudflare)
   */
  country?: string;

  /**
   * Session ID for tracking
   * Extracted automatically by SecurityContextMiddleware from:
   * - x-session-id header
   * - sessionId or session_id cookies
   */
  sessionId?: string;

  /**
   * Request ID for correlation
   * Extracted automatically by SecurityContextMiddleware from x-request-id header
   */
  requestId?: string;

  /**
   * Trace ID for distributed tracing
   * Extracted automatically by SecurityContextMiddleware from x-trace-id header
   */
  traceId?: string;
}

/**
 * Helper function to create a security context from SecurityContextMiddleware
 * 
 * This function is used to convert the SecurityContext from shared-ts middleware
 * to the EnvelopeSecurityContext format used by envelope operations.
 * 
 * @param securityContext - Security context from SecurityContextMiddleware
 * @returns EnvelopeSecurityContext for envelope operations
 */
export function fromSecurityContext(securityContext: any): EnvelopeSecurityContext {
  return {
    userId: securityContext.userId,
    ipAddress: securityContext.ipAddress,
    userAgent: securityContext.userAgent,
    accessType: securityContext.accessType,
    permission: securityContext.permission,
    timestamp: securityContext.timestamp,
    deviceFingerprint: securityContext.deviceFingerprint,
    country: securityContext.country,
    sessionId: securityContext.sessionId,
    requestId: securityContext.requestId,
    traceId: securityContext.traceId
  };
}
