/**
 * @fileoverview SecurityErrorCode enum - Defines security validation error codes
 * @summary Enumerates security validation error codes for consistent error handling
 * @description The SecurityErrorCode enum defines all possible error codes that can be returned
 * from security validation operations for consistent error handling across microservices.
 */

/**
 * Security error code enumeration
 * 
 * Defines all possible error codes that can be returned from security validation operations.
 * These codes are used for consistent error handling and logging across microservices.
 */
export enum SecurityErrorCode {
  /**
   * IP address is required but not provided
   */
  IP_ADDRESS_REQUIRED = 'IP_ADDRESS_REQUIRED',

  /**
   * IP address is blocked or in a blocked range
   */
  IP_ADDRESS_BLOCKED = 'IP_ADDRESS_BLOCKED',

  /**
   * User agent is required but not provided
   */
  USER_AGENT_REQUIRED = 'USER_AGENT_REQUIRED',

  /**
   * User agent matches a blocked pattern
   */
  USER_AGENT_BLOCKED = 'USER_AGENT_BLOCKED',

  /**
   * Geolocation is blocked (country/region restrictions)
   */
  GEOLOCATION_BLOCKED = 'GEOLOCATION_BLOCKED',

  /**
   * Device is not trusted for sensitive operations
   */
  DEVICE_NOT_TRUSTED = 'DEVICE_NOT_TRUSTED',

  /**
   * Rate limit has been exceeded
   */
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  /**
   * Access token is required but not provided
   */
  ACCESS_TOKEN_REQUIRED = 'ACCESS_TOKEN_REQUIRED',

  /**
   * Access token is invalid or malformed
   */
  INVALID_ACCESS_TOKEN = 'INVALID_ACCESS_TOKEN',

  /**
   * Suspicious activity detected
   */
  SUSPICIOUS_ACTIVITY_DETECTED = 'SUSPICIOUS_ACTIVITY_DETECTED',

  /**
   * Business hours restriction violated
   */
  BUSINESS_HOURS_VIOLATION = 'BUSINESS_HOURS_VIOLATION',

  /**
   * Permission denied for the requested operation
   */
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  /**
   * Access type is not valid for the requested permission
   */
  INVALID_ACCESS_TYPE = 'INVALID_ACCESS_TYPE'
}

/**
 * Maps security error codes to human-readable descriptions
 */
export const SECURITY_ERROR_DESCRIPTIONS: Record<SecurityErrorCode, string> = {
  [SecurityErrorCode.IP_ADDRESS_REQUIRED]: 'IP address is required for this operation',
  [SecurityErrorCode.IP_ADDRESS_BLOCKED]: 'IP address is blocked or in a blocked range',
  [SecurityErrorCode.USER_AGENT_REQUIRED]: 'User agent is required for this operation',
  [SecurityErrorCode.USER_AGENT_BLOCKED]: 'User agent matches a blocked pattern',
  [SecurityErrorCode.GEOLOCATION_BLOCKED]: 'Access is blocked from this geographic location',
  [SecurityErrorCode.DEVICE_NOT_TRUSTED]: 'Device is not trusted for sensitive operations',
  [SecurityErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit has been exceeded for this operation',
  [SecurityErrorCode.ACCESS_TOKEN_REQUIRED]: 'Access token is required for this operation',
  [SecurityErrorCode.INVALID_ACCESS_TOKEN]: 'Access token is invalid or malformed',
  [SecurityErrorCode.SUSPICIOUS_ACTIVITY_DETECTED]: 'Suspicious activity pattern detected',
  [SecurityErrorCode.BUSINESS_HOURS_VIOLATION]: 'Operation is not allowed outside business hours',
  [SecurityErrorCode.PERMISSION_DENIED]: 'Permission denied for the requested operation',
  [SecurityErrorCode.INVALID_ACCESS_TYPE]: 'Access type is not valid for the requested permission'
};

/**
 * Gets a human-readable description for a security error code
 */
export function getSecurityErrorDescription(errorCode: SecurityErrorCode): string {
  return SECURITY_ERROR_DESCRIPTIONS[errorCode];
}

/**
 * Checks if an error code is a security-related error
 */
export function isSecurityError(errorCode: string): errorCode is SecurityErrorCode {
  return Object.values(SecurityErrorCode).includes(errorCode as SecurityErrorCode);
}
