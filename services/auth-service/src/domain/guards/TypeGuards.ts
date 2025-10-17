/**
 * @fileoverview TypeGuards - Runtime type validation utilities
 * @summary Provides type guards for Prisma enums and other types
 * @description This module provides type guards for runtime validation of Prisma enums,
 * ensuring type safety without using 'as any' assertions.
 */

import { $Enums } from '@prisma/client';

/**
 * Type guards for runtime type validation
 * 
 * Provides type guards for validating Prisma enums and other types at runtime,
 * enabling type-safe operations without 'as any' assertions.
 */
export class TypeGuards {
  /**
   * Type guard for UserRole validation
   * @param role - String to validate
   * @returns True if role is a valid Prisma UserRole
   */
  static isValidUserRole(role: string): role is $Enums.UserRole {
    return Object.values($Enums.UserRole).includes(role as $Enums.UserRole);
  }

  /**
   * Type guard for UserAccountStatus validation
   * @param status - String to validate
   * @returns True if status is a valid Prisma UserAccountStatus
   */
  static isValidUserAccountStatus(status: string): status is $Enums.UserAccountStatus {
    return Object.values($Enums.UserAccountStatus).includes(status as $Enums.UserAccountStatus);
  }

  /**
   * Type guard for OAuthProvider validation
   * @param provider - String to validate
   * @returns True if provider is a valid Prisma OAuthProvider
   */
  static isValidOAuthProvider(provider: string): provider is $Enums.OAuthProvider {
    return Object.values($Enums.OAuthProvider).includes(provider as $Enums.OAuthProvider);
  }

  /**
   * Validates array of UserRole values
   * @param roles - Array of strings to validate
   * @returns True if all roles are valid Prisma UserRole values
   */
  static isValidUserRoleArray(roles: string[]): roles is $Enums.UserRole[] {
    return roles.every(role => this.isValidUserRole(role));
  }

  /**
   * Validates array of UserAccountStatus values
   * @param statuses - Array of strings to validate
   * @returns True if all statuses are valid Prisma UserAccountStatus values
   */
  static isValidUserAccountStatusArray(statuses: string[]): statuses is $Enums.UserAccountStatus[] {
    return statuses.every(status => this.isValidUserAccountStatus(status));
  }

  /**
   * Validates array of OAuthProvider values
   * @param providers - Array of strings to validate
   * @returns True if all providers are valid Prisma OAuthProvider values
   */
  static isValidOAuthProviderArray(providers: string[]): providers is $Enums.OAuthProvider[] {
    return providers.every(provider => this.isValidOAuthProvider(provider));
  }

  /**
   * Safe conversion with validation
   * @param role - String role value
   * @returns Valid Prisma UserRole or undefined if invalid
   */
  static safeToUserRole(role: string): $Enums.UserRole | undefined {
    return this.isValidUserRole(role) ? role as $Enums.UserRole : undefined;
  }

  /**
   * Safe conversion with validation
   * @param status - String status value
   * @returns Valid Prisma UserAccountStatus or undefined if invalid
   */
  static safeToUserAccountStatus(status: string): $Enums.UserAccountStatus | undefined {
    return this.isValidUserAccountStatus(status) ? status as $Enums.UserAccountStatus : undefined;
  }

  /**
   * Safe conversion with validation
   * @param provider - String provider value
   * @returns Valid Prisma OAuthProvider or undefined if invalid
   */
  static safeToOAuthProvider(provider: string): $Enums.OAuthProvider | undefined {
    return this.isValidOAuthProvider(provider) ? provider as $Enums.OAuthProvider : undefined;
  }
}
