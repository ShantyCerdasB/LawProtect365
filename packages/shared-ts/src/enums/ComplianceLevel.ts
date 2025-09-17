/**
 * @fileoverview ComplianceLevel enum - Defines compliance levels for validation
 * @summary Enumerates compliance levels used in algorithm and security validation
 * @description The ComplianceLevel enum defines compliance levels used in
 * algorithm validation, security compliance, and regulatory requirements.
 */

/**
 * Compliance level enumeration
 * 
 * Defines compliance levels used in algorithm validation and security compliance.
 * Used for regulatory requirements and security standards.
 */
export enum ComplianceLevel {
  /**
   * Basic compliance level
   * - Minimum regulatory requirements
   * - Basic security standards
   * - Suitable for standard operations
   */
  BASIC = 'BASIC',

  /**
   * Advanced compliance level
   * - Enhanced regulatory requirements
   * - Advanced security standards
   * - Suitable for sensitive operations
   */
  ADVANCED = 'ADVANCED',

  /**
   * High security compliance level
   * - Maximum regulatory requirements
   * - Highest security standards
   * - Suitable for critical operations
   */
  HIGH_SECURITY = 'HIGH_SECURITY'
}

/**
 * Compliance level order for comparison
 */
export const COMPLIANCE_LEVEL_ORDER: Record<ComplianceLevel, number> = {
  [ComplianceLevel.BASIC]: 1,
  [ComplianceLevel.ADVANCED]: 2,
  [ComplianceLevel.HIGH_SECURITY]: 3
};

/**
 * Checks if a compliance level meets minimum requirements
 * @param currentLevel - The current compliance level
 * @param minLevel - The minimum required compliance level
 * @returns True if current level meets minimum requirements
 */
export function meetsComplianceLevel(currentLevel: ComplianceLevel, minLevel: ComplianceLevel): boolean {
  return COMPLIANCE_LEVEL_ORDER[currentLevel] >= COMPLIANCE_LEVEL_ORDER[minLevel];
}
