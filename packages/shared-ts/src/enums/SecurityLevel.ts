/**
 * @fileoverview SecurityLevel enum - Defines security levels for validation
 * @summary Enumerates security levels used across validation operations
 * @description The SecurityLevel enum defines security levels used in
 * algorithm validation, access control, and compliance operations.
 */

/**
 * Security level enumeration
 * 
 * Defines security levels used across different validation operations.
 * Used for algorithm security, access control, and compliance validation.
 */
export enum SecurityLevel {
  /**
   * Low security level
   * - Basic security requirements
   * - Suitable for non-critical operations
   */
  LOW = 'LOW',

  /**
   * Medium security level
   * - Standard security requirements
   * - Suitable for most business operations
   */
  MEDIUM = 'MEDIUM',

  /**
   * High security level
   * - Enhanced security requirements
   * - Suitable for critical operations
   */
  HIGH = 'HIGH'
}

/**
 * Security level order for comparison
 */
export const SECURITY_LEVEL_ORDER: Record<SecurityLevel, number> = {
  [SecurityLevel.LOW]: 1,
  [SecurityLevel.MEDIUM]: 2,
  [SecurityLevel.HIGH]: 3
};

/**
 * Checks if a security level meets minimum requirements
 * @param currentLevel - The current security level
 * @param minLevel - The minimum required security level
 * @returns True if current level meets minimum requirements
 */
export function meetsSecurityLevel(currentLevel: SecurityLevel, minLevel: SecurityLevel): boolean {
  return SECURITY_LEVEL_ORDER[currentLevel] >= SECURITY_LEVEL_ORDER[minLevel];
}
