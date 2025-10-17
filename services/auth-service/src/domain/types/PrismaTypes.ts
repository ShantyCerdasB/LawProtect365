/**
 * @fileoverview PrismaTypes - Type aliases for Prisma enums
 * @summary Provides convenient type aliases for Prisma enums
 * @description This module provides type aliases for Prisma enums to improve
 * code readability and maintainability while ensuring type safety.
 */

import { $Enums } from '@prisma/client';

/**
 * Type aliases for Prisma enums
 * 
 * These aliases provide convenient access to Prisma enum types
 * while maintaining full type safety and IntelliSense support.
 */

// User-related enums
export type UserRole = $Enums.UserRole;
export type UserAccountStatus = $Enums.UserAccountStatus;

// OAuth-related enums
export type OAuthProvider = $Enums.OAuthProvider;

// Re-export Prisma enums for convenience
export { 
  UserRole as PrismaUserRole,
  UserAccountStatus as PrismaUserAccountStatus,
  OAuthProvider as PrismaOAuthProvider
} from '@prisma/client';

/**
 * Utility type for Prisma enum values
 */
export type PrismaEnumValue<T> = T extends string ? T : never;

/**
 * Utility type for Prisma enum arrays
 */
export type PrismaEnumArray<T> = T[];

/**
 * Type-safe enum value extractor
 */
export class PrismaEnumExtractor {
  /**
   * Extracts all UserRole values
   */
  static getUserRoleValues(): UserRole[] {
    return Object.values($Enums.UserRole);
  }

  /**
   * Extracts all UserAccountStatus values
   */
  static getUserAccountStatusValues(): UserAccountStatus[] {
    return Object.values($Enums.UserAccountStatus);
  }

  /**
   * Extracts all OAuthProvider values
   */
  static getOAuthProviderValues(): OAuthProvider[] {
    return Object.values($Enums.OAuthProvider);
  }
}
