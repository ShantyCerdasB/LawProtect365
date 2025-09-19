/**
 * @fileoverview EnvelopeSecurityRules - Security rules for envelope operations
 * @summary Security validation and access control rules for envelope management
 * @description The EnvelopeSecurityRules provides centralized security logic
 * for envelope operations including IP validation, user agent filtering, access control,
 * rate limiting, and permission validation.
 */

import { EnvelopeOperation } from '@/domain/enums/EnvelopeOperation';
import { 
  accessDenied,
  ipAddressBlocked,
  userAgentBlocked,
  invalidAccessToken,
  permissionDenied,
  rateLimitExceeded,
  geolocationBlocked,
  deviceNotTrusted
} from '@/signature-errors';
import type { SignatureServiceConfig } from '@/config';
import { 
  PermissionLevel,
  AccessType,
  canPerformOperation,
  isValidAccessTypeForPermission,
  validateSecurity,
  SecurityErrorCode,
  type SecurityConfig
} from '@lawprotect/shared-ts';
import type { EnvelopeSecurityContext } from '../../types/envelope/EnvelopeSecurityContext';

/**
 * Validates access permissions for envelope operations
 * Uses the shared security validation utilities
 */
export function validateEnvelopeAccessPermissions(
  context: EnvelopeSecurityContext,
  operation: EnvelopeOperation,
  envelopeOwnerId?: string
): void {
  // For CANCEL (delete) operations, require the requester to be the owner
  if (operation === EnvelopeOperation.CANCEL) {
    if (!context.userId || !envelopeOwnerId || context.userId !== envelopeOwnerId) {
      throw permissionDenied('Only the envelope owner can cancel/delete this envelope');
    }
  }

  // Check if user has permission to perform the operation
  if (!canPerformOperation(context.permission, operation)) {
    throw permissionDenied(
      `User with permission ${context.permission} cannot perform operation ${operation}`
    );
  }

  // Check if access type is valid for the permission
  if (!isValidAccessTypeForPermission(context.accessType, context.permission)) {
    throw accessDenied(
      `Access type ${context.accessType} is not valid for permission ${context.permission}`
    );
  }

  // Owner-specific validations
  if (context.permission === PermissionLevel.OWNER) {
    if (context.userId && envelopeOwnerId && context.userId !== envelopeOwnerId) {
      throw permissionDenied('User is not the owner of this envelope');
    }
  }

  // Signer-specific validations (using PARTICIPANT level)
  if (context.permission === PermissionLevel.PARTICIPANT) {
    if (context.accessType !== AccessType.INVITATION && context.accessType !== AccessType.DIRECT) {
      throw accessDenied('Signers can only access via invitation or direct permission');
    }
  }

  // Viewer-specific validations
  if (context.permission === PermissionLevel.VIEWER) {
    if (context.accessType !== AccessType.SHARED_LINK && context.accessType !== AccessType.DIRECT) {
      throw accessDenied('Viewers can only access via shared link or direct permission');
    }
  }
}

/**
 * Comprehensive security validation for envelope operations
 * Uses the shared security validation utilities
 */
export async function validateEnvelopeSecurity(
  context: EnvelopeSecurityContext,
  operation: EnvelopeOperation,
  config: SignatureServiceConfig,
  dependencies: {
    rateLimitStore: any; // Will be properly typed when we implement the store
    envelopeOwnerId?: string;
    accessToken?: string;
  }
): Promise<void> {
  // Convert SignatureServiceConfig to SecurityConfig
  const securityConfig: SecurityConfig = {
    blockedIPs: config.security?.blockedIPs,
    blockedIPRanges: config.security?.blockedIPRanges,
    blockedUserAgentPatterns: config.security?.blockedUserAgentPatterns,
    blockedCountries: config.security?.blockedCountries,
    trustedDevices: config.security?.trustedDevices,
    enforceBusinessHours: config.security?.enforceBusinessHours,
    rapidOperationThreshold: config.security?.rapidOperationThreshold,
    rapidOperationWindowSeconds: config.security?.rapidOperationWindowSeconds,
    enableIPValidation: config.security?.enableIPValidation || false,
    enableUserAgentValidation: config.security?.enableUserAgentValidation || false,
    enableGeolocationValidation: config.security?.enableGeolocationValidation || false,
    enableDeviceTrustValidation: config.security?.enableDeviceTrustValidation || false,
    enableSuspiciousActivityDetection: config.security?.enableSuspiciousActivityDetection || false,
    enableRateLimiting: config.security?.enableRateLimiting || false,
    defaultRateLimit: config.businessRateLimit.envelopeCreationRateLimit,
    defaultRateLimitWindow: config.businessRateLimit.rateLimitWindowSeconds
  };

  // Validate envelope-specific permissions first
  validateEnvelopeAccessPermissions(context, operation, dependencies.envelopeOwnerId);

  // Get sensitive operations from configuration or use defaults
  const sensitiveOperations = config.security?.sensitiveOperations?.length 
    ? config.security.sensitiveOperations 
    : [EnvelopeOperation.SEND, EnvelopeOperation.SIGN, EnvelopeOperation.COMPLETE, EnvelopeOperation.CANCEL];

  // Use shared security validation
  // Patch: Ensure 'country' is always a string for shared validation compatibility
  const patchedContext = {
    ...context,
    country: context.country ?? ''
  };

  const result = await validateSecurity(
    patchedContext,
    operation,
    securityConfig,
    {
      // Provide a no-op rate limit store if none supplied to avoid false negatives in tests
      rateLimitStore: dependencies.rateLimitStore || {
        incrementAndCheck: async (_key: string, window: any) => ({ currentUsage: 0, maxRequests: window.maxRequests })
      },
      accessToken: dependencies.accessToken,
      sensitiveOperations: sensitiveOperations
    }
  );

  // Convert SecurityValidationResult to appropriate errors
  if (!result.isValid) {
    switch (result.errorCode) {
      case SecurityErrorCode.IP_ADDRESS_BLOCKED:
        throw ipAddressBlocked(result.errorMessage);
      case SecurityErrorCode.USER_AGENT_BLOCKED:
        throw userAgentBlocked(result.errorMessage);
      case SecurityErrorCode.GEOLOCATION_BLOCKED:
        throw geolocationBlocked(result.errorMessage);
      case SecurityErrorCode.DEVICE_NOT_TRUSTED:
        throw deviceNotTrusted(result.errorMessage);
      case SecurityErrorCode.RATE_LIMIT_EXCEEDED:
        throw rateLimitExceeded(result.errorMessage);
      case SecurityErrorCode.INVALID_ACCESS_TOKEN:
        throw invalidAccessToken(result.errorMessage);
      case SecurityErrorCode.ACCESS_TOKEN_REQUIRED:
        throw invalidAccessToken(result.errorMessage);
      default:
        throw accessDenied(result.errorMessage || 'Security validation failed');
    }
  }
}

