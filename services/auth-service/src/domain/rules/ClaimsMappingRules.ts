/**
 * @fileoverview ClaimsMappingRules - Domain rules for JWT claims mapping
 * @summary Maps user data to JWT claims for token enrichment
 * @description This domain rule encapsulates the business logic for mapping user data
 * from the database and Cognito to JWT claims, ensuring consistent token structure.
 */

import { UserRole, UserAccountStatus } from '../enums';
import { UserId } from '../value-objects/UserId';

/**
 * Core user data for claims mapping
 */
export interface UserClaimsData {
  /** User ID from database */
  userId: UserId;
  /** User role from database */
  role: UserRole;
  /** User account status from database */
  status: UserAccountStatus;
}

/**
 * MFA-related data for claims mapping
 */
export interface MfaClaimsData {
  /** Whether MFA is required by policy */
  isMfaRequired: boolean;
  /** Whether MFA is enabled in Cognito */
  isMfaEnabled: boolean;
}

/**
 * Claims override details structure for Cognito
 */
export interface ClaimsOverrideDetails {
  /** Claims to add or override */
  claimsToAddOrOverride?: {
    [key: string]: string | number | boolean;
  };
  /** Claims to suppress */
  claimsToSuppress?: string[];
  /** Group override details (optional) */
  groupOverrideDetails?: {
    groupsToOverride?: string[];
    iamRolesToOverride?: string[];
    preferredRole?: string;
  };
}

/**
 * ClaimsMappingRules - Domain rule for JWT claims mapping
 * 
 * Encapsulates business logic for mapping user data to JWT claims including:
 * - Core user claims (role, status, user_id)
 * - MFA-related claims
 * - Claims structure validation
 */
export class ClaimsMappingRules {
  /**
   * Builds core user claims from user data
   * @param userData - User data from database
   * @returns Core user claims
   */
  static buildCoreClaims(userData: UserClaimsData): Record<string, string> {
    return {
      'custom:role': userData.role,
      'custom:account_status': userData.status,
      'custom:user_id': userData.userId.toString()
    };
  }

  /**
   * Builds MFA-related claims
   * @param mfaData - MFA data from Cognito and policy
   * @returns MFA claims
   */
  static buildMfaClaims(mfaData: MfaClaimsData): Record<string, boolean> {
    return {
      'custom:is_mfa_required': mfaData.isMfaRequired,
      'custom:mfa_enabled': mfaData.isMfaEnabled
    };
  }

  /**
   * Builds all claims for a user
   * @param userData - User data from database
   * @param mfaData - MFA data from Cognito and policy
   * @returns Complete claims object
   */
  static buildAllClaims(
    userData: UserClaimsData,
    mfaData: MfaClaimsData
  ): Record<string, string | boolean> {
    return {
      ...this.buildCoreClaims(userData),
      ...this.buildMfaClaims(mfaData)
    };
  }

  /**
   * Creates claims override details for Cognito
   * @param claims - Claims to add or override
   * @param claimsToSuppress - Claims to suppress (optional)
   * @returns Claims override details structure
   */
  static toClaimsOverrideDetails(
    claims: Record<string, string | boolean>,
    claimsToSuppress?: string[]
  ): ClaimsOverrideDetails {
    return {
      claimsToAddOrOverride: claims,
      claimsToSuppress: claimsToSuppress || []
    };
  }

  /**
   * Validates claims structure
   * @param claims - Claims to validate
   * @returns True if claims are valid
   */
  static validateClaims(claims: Record<string, unknown>): boolean {
    // Check for required custom claims
    const requiredClaims = ['custom:role', 'custom:account_status', 'custom:user_id'];
    
    for (const claim of requiredClaims) {
      if (!(claim in claims)) {
        return false;
      }
    }

    // Validate claim values
    const role = claims['custom:role'];
    const status = claims['custom:account_status'];
    const userId = claims['custom:user_id'];

    if (typeof role !== 'string' || typeof status !== 'string' || typeof userId !== 'string') {
      return false;
    }

    return true;
  }

  /**
   * Gets default claims for fallback scenarios
   * @returns Default claims structure
   */
  static getDefaultClaims(): Record<string, string | boolean> {
    return {
      'custom:role': UserRole.UNASSIGNED,
      'custom:account_status': UserAccountStatus.PENDING_VERIFICATION,
      'custom:user_id': '',
      'custom:is_mfa_required': false,
      'custom:mfa_enabled': false
    };
  }

  /**
   * Determines if a user requires MFA based on role and policy
   * @param role - User role
   * @param customMfaRequired - Custom MFA requirement from attributes
   * @returns True if MFA is required
   */
  static isMfaRequiredByPolicy(role: UserRole, customMfaRequired?: boolean): boolean {
    // Primary source: custom attribute
    if (customMfaRequired !== undefined) {
      return customMfaRequired;
    }
    
    // Fallback: role-based requirement
    return role === UserRole.SUPER_ADMIN;
  }

  /**
   * Gets claims size estimate for JWT size management
   * @param claims - Claims to estimate
   * @returns Estimated size in characters
   */
  static getClaimsSizeEstimate(claims: Record<string, string | boolean>): number {
    return JSON.stringify(claims).length;
  }

  /**
   * Filters claims to keep only essential ones for size optimization
   * @param claims - All claims
   * @returns Filtered essential claims
   */
  static filterEssentialClaims(claims: Record<string, string | boolean>): Record<string, string | boolean> {
    const essentialClaims = [
      'custom:role',
      'custom:account_status', 
      'custom:user_id',
      'custom:is_mfa_required',
      'custom:mfa_enabled'
    ];

    const filtered: Record<string, string | boolean> = {};
    
    for (const claim of essentialClaims) {
      if (claim in claims) {
        filtered[claim] = claims[claim];
      }
    }

    return filtered;
  }
}
