/**
 * @fileoverview UserVisibilityRules - Domain rules for user data visibility
 * @summary Business rules for determining what user data to expose in GET /me
 * @description This domain rule class handles the logic for determining which user data
 * should be included in the GetMe response based on include flags and business rules.
 */

import { User } from '../entities/User';
import { UserRole } from '../enums';
import { 
  MfaStatus, 
  IdentityInfo, 
  PersonalInfo, 
  MetaInfo, 
  ClaimsInfo 
} from '../interfaces';

/**
 * Domain rules for user data visibility in GET /me endpoint
 * 
 * Handles business logic for determining what user data to expose
 * based on include flags and user state.
 */
export class UserVisibilityRules {
  /**
   * Get MFA status information for the user
   * @param user - The user entity
   * @returns MFA status with required and enabled flags
   */
  static getMfaStatus(user: User): MfaStatus {
    return {
      required: user.getRole() === UserRole.SUPER_ADMIN,
      enabled: user.isMfaEnabled()
    };
  }

  /**
   * Get identity information for the user
   * @param user - The user entity
   * @returns Identity information including Cognito sub
   */
  static getIdentityInfo(user: User): IdentityInfo {
    return {
      cognitoSub: user.getCognitoSub().toString()
    };
  }

  /**
   * Get personal information for the user
   * @param user - The user entity
   * @param personalInfo - UserPersonalInfo entity or null
   * @returns Personal information or null if not available
   */
  static getPersonalInfo(_user: User, personalInfo: any | null): PersonalInfo | null {
    if (!personalInfo) {
      return null;
    }

    return {
      phone: personalInfo.getPhone(),
      locale: personalInfo.getLocale(),
      timeZone: personalInfo.getTimeZone()
    };
  }

  /**
   * Get claims information for the user
   * @param user - The user entity
   * @returns Claims information matching PreTokenGeneration format
   */
  static getClaimsInfo(user: User): ClaimsInfo {
    return {
      role: user.getRole(),
      account_status: user.getStatus(),
      is_mfa_required: user.getRole() === UserRole.SUPER_ADMIN,
      mfa_enabled: user.isMfaEnabled(),
      user_id: user.getId().toString()
    };
  }

  /**
   * Get metadata information for the user
   * @param user - The user entity
   * @returns Metadata information including timestamps
   */
  static getMetaInfo(user: User): MetaInfo {
    return {
      lastLoginAt: user.getLastLoginAt()?.toISOString() || null,
      createdAt: user.getCreatedAt().toISOString(),
      updatedAt: user.getUpdatedAt().toISOString()
    };
  }

  /**
   * Check if user should have PENDING_VERIFICATION header
   * @param user - The user entity
   * @returns true if user is in PENDING_VERIFICATION status
   */
  static shouldIncludePendingVerificationHeader(user: User): boolean {
    return user.getStatus() === 'PENDING_VERIFICATION' && user.getRole() === UserRole.LAWYER;
  }

  /**
   * Get user's display name
   * @param user - The user entity
   * @returns Display name (firstName + lastName or email fallback)
   */
  static getDisplayName(user: User): string {
    const firstName = user.getFirstName();
    const lastName = user.getLastName();
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (firstName) {
      return firstName;
    }
    
    return user.getEmail()?.toString() || 'Unknown User';
  }
}
