/**
 * @fileoverview SignerSecurityRules - Security validation rules for signer operations
 * @summary Security validation rules for signer operations
 * @description The SignerSecurityRules provides security validation for signer operations
 * to ensure proper access controls, identity verification, and security compliance.
 */

import { Signer } from '@/domain/entities/Signer';
import { 
  accessDenied,
  signerEmailRequired
} from '@/signature-errors';
import type { SignatureServiceConfig } from '@/config';

/**
 * Signer security operation types
 */
export enum SignerSecurityOperation {
  SIGN = 'SIGN',
  DECLINE = 'DECLINE',
  VIEW = 'VIEW',
  DOWNLOAD = 'DOWNLOAD'
}

/**
 * Validates signer access to envelope
 * 
 * Ensures only authorized signers can access envelope data.
 * This is important for maintaining data privacy and security.
 * 
 * @param signer - The signer requesting access
 * @param envelopeId - The envelope ID being accessed
 * @param userId - The user ID requesting access
 * @throws {SignatureError} When signer does not have sufficient permissions
 * @returns void
 */
export function validateSignerAccess(signer: Signer, envelopeId: string, userId: string): void {
  if (signer.getEnvelopeId() !== envelopeId) {
    throw accessDenied('Signer does not belong to this envelope');
  }

  // Check if signer is the owner or has proper access
  if (signer.getEmail().getValue() !== userId && !signer.isExternal()) {
    throw accessDenied('Access denied: insufficient permissions for envelope access');
  }
}

/**
 * Validates signer identity verification
 * 
 * Ensures the signer's identity is properly verified.
 * This is critical for security and compliance.
 * 
 * @param signer - The signer to validate identity for
 * @param providedEmail - The email provided for verification
 * @throws {SignatureError} When signer identity cannot be verified
 * @returns void
 */
export function validateSignerIdentity(signer: Signer, providedEmail: string): void {
  if (!providedEmail || typeof providedEmail !== 'string') {
    throw signerEmailRequired('Email is required for identity verification');
  }

  const normalizedProvidedEmail = providedEmail.trim().toLowerCase();
  const normalizedSignerEmail = signer.getEmail().getValue().toLowerCase();

  if (normalizedProvidedEmail !== normalizedSignerEmail) {
    throw accessDenied('Signer identity verification failed: email mismatch');
  }
}

/**
 * Validates signer permissions for operation
 * 
 * Ensures the signer has proper permissions for the requested operation.
 * This is important for maintaining security boundaries.
 * 
 * @param signer - The signer requesting the operation
 * @param operation - The operation being requested
 * @throws {SignatureError} When signer does not have sufficient permissions
 * @returns void
 */
export function validateSignerPermissions(signer: Signer, operation: SignerSecurityOperation): void {
  switch (operation) {
    case SignerSecurityOperation.SIGN:
      if (!signer.canSign()) {
        throw accessDenied('Signer does not have permission to sign at this time');
      }
      break;

    case SignerSecurityOperation.DECLINE:
      if (signer.hasSigned() || signer.hasDeclined()) {
        throw accessDenied('Signer cannot decline after signing or declining');
      }
      break;

    case SignerSecurityOperation.VIEW:
      // All signers can view their envelope
      break;

    case SignerSecurityOperation.DOWNLOAD:
      if (!signer.hasSigned() && !signer.isOwner(signer.getEnvelopeId())) {
        throw accessDenied('Signer can only download after signing or if owner');
      }
      break;

    default:
      throw accessDenied(`Unknown operation: ${operation}`);
  }
}

/**
 * Validates signer invitation token
 * 
 * Ensures the invitation token is valid and not expired.
 * This is important for external signer security.
 * 
 * @param signer - The signer with invitation token
 * @param providedToken - The token provided for verification
 * @param maxTokenAgeHours - Maximum age of invitation token in hours
 * @throws {SignatureError} When invitation token is invalid or expired
 * @returns void
 */
export function validateInvitationToken(
  signer: Signer, 
  providedToken: string, 
  maxTokenAgeHours: number = 168 // 7 days default
): void {
  if (!signer.isExternal()) {
    return; // Internal signers don't need invitation tokens
  }

  if (!providedToken || typeof providedToken !== 'string') {
    throw accessDenied('Invitation token is required for external signers');
  }

  if (!signer.getInvitationToken()) {
    throw accessDenied('Signer does not have a valid invitation token');
  }

  if (signer.getInvitationToken() !== providedToken) {
    throw accessDenied('Invalid invitation token');
  }

  // Check token age (assuming token creation time is stored in metadata)
  const metadata = signer.getMetadata();
  if (metadata.consentTimestamp) {
    const now = new Date();
    const tokenAge = now.getTime() - metadata.consentTimestamp.getTime();
    const maxAgeMs = maxTokenAgeHours * 60 * 60 * 1000;

    if (tokenAge > maxAgeMs) {
      throw accessDenied('Invitation token has expired');
    }
  }
}

/**
 * Validates signer IP address for security
 * 
 * Ensures the signer's IP address is within allowed ranges.
 * This is important for security and fraud prevention.
 * 
 * @param signer - The signer to validate IP for
 * @param currentIpAddress - The current IP address
 * @param allowedIpRanges - Array of allowed IP ranges
 * @throws {SignatureError} When IP address is not allowed
 * @returns void
 */
export function validateSignerIpAddress(
  _signer: Signer, 
  currentIpAddress: string, 
  allowedIpRanges: string[] = []
): void {
  if (!currentIpAddress || typeof currentIpAddress !== 'string') {
    throw accessDenied('IP address is required for security validation');
  }

  // If no IP ranges are specified, allow all IPs
  if (allowedIpRanges.length === 0) {
    return;
  }

  // Check if current IP is in allowed ranges
  const isAllowed = allowedIpRanges.some(range => {
    // Simple IP range validation (can be enhanced with proper CIDR validation)
    return currentIpAddress.startsWith(range) || currentIpAddress === range;
  });

  if (!isAllowed) {
    throw accessDenied('IP address is not in allowed ranges');
  }
}

/**
 * Validates signer user agent for security
 * 
 * Ensures the signer's user agent is valid and not suspicious.
 * This is important for security and fraud prevention.
 * 
 * @param signer - The signer to validate user agent for
 * @param currentUserAgent - The current user agent
 * @param blockedUserAgents - Array of blocked user agent patterns
 * @throws {SignatureError} When user agent is blocked
 * @returns void
 */
export function validateSignerUserAgent(
  _signer: Signer, 
  currentUserAgent: string, 
  blockedUserAgents: string[] = []
): void {
  if (!currentUserAgent || typeof currentUserAgent !== 'string') {
    throw accessDenied('User agent is required for security validation');
  }

  // Check if user agent is blocked
  const isBlocked = blockedUserAgents.some(pattern => {
    return currentUserAgent.toLowerCase().includes(pattern.toLowerCase());
  });

  if (isBlocked) {
    throw accessDenied('User agent is blocked for security reasons');
  }
}

/**
 * Validates signer session security
 * 
 * Ensures the signer's session is secure and valid.
 * This is important for maintaining security throughout the signing process.
 * 
 * @param signer - The signer to validate session for
 * @param sessionData - Session data for validation
 * @throws {SignatureError} When session is invalid or insecure
 * @returns void
 */
export function validateSignerSession(_signer: Signer, sessionData: {
  sessionId: string;
  lastActivity: Date;
  maxSessionAgeHours: number;
}): void {
  const { sessionId, lastActivity, maxSessionAgeHours } = sessionData;

  if (!sessionId || typeof sessionId !== 'string') {
    throw accessDenied('Valid session ID is required');
  }

  // Check session age
  const now = new Date();
  const sessionAge = now.getTime() - lastActivity.getTime();
  const maxAgeMs = maxSessionAgeHours * 60 * 60 * 1000;

  if (sessionAge > maxAgeMs) {
    throw accessDenied('Session has expired');
  }
}

/**
 * Comprehensive signer security validation
 * 
 * Validates all security requirements for a signer operation.
 * This function orchestrates all signer security validations.
 * 
 * @param signer - The signer to validate security for
 * @param securityData - Security data for validation
 * @param config - Service configuration
 * @throws {SignatureError} When any security validation fails
 * @returns void
 */
export function validateSignerSecurity(
  signer: Signer,
  securityData: {
    userId: string;
    envelopeId: string;
    operation: SignerSecurityOperation;
    providedEmail?: string;
    invitationToken?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionData?: {
      sessionId: string;
      lastActivity: Date;
      maxSessionAgeHours: number;
    };
  },
  _config: SignatureServiceConfig
): void {
  const { userId, envelopeId, operation, providedEmail, invitationToken, ipAddress, userAgent, sessionData } = securityData;

  // Validate access
  validateSignerAccess(signer, envelopeId, userId);

  // Validate permissions
  validateSignerPermissions(signer, operation);

  // Validate identity (if email provided)
  if (providedEmail) {
    validateSignerIdentity(signer, providedEmail);
  }

  // Validate invitation token (if provided)
  if (invitationToken) {
    validateInvitationToken(signer, invitationToken, 168); // 7 days default
  }

  // Validate IP address (if provided)
  if (ipAddress) {
    validateSignerIpAddress(signer, ipAddress, []); // Empty array allows all IPs
  }

  // Validate user agent (if provided)
  if (userAgent) {
    validateSignerUserAgent(signer, userAgent, []); // Empty array blocks none
  }

  // Validate session (if provided)
  if (sessionData) {
    validateSignerSession(signer, sessionData);
  }
}
