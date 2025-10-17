/**
 * @fileoverview EnumMappers - Type-safe enum conversion utilities
 * @summary Provides type-safe conversion between string values and Prisma enums
 * @description This module provides type-safe conversion utilities for Prisma enums,
 * ensuring runtime validation and compile-time type safety without using 'as any'.
 */

import { $Enums } from '@prisma/client';

/**
 * Type-safe enum conversion utilities
 * 
 * Provides runtime validation and conversion between string values and Prisma enums,
 * eliminating the need for 'as any' type assertions.
 */
export class EnumMappers {
  /**
   * Converts string to Prisma UserRole with validation
   * @param role - String role value
   * @returns Valid Prisma UserRole
   * @throws Error if role is invalid
   */
  static toPrismaUserRole(role: string): $Enums.UserRole {
    if (!Object.values($Enums.UserRole).includes(role as $Enums.UserRole)) {
      throw new Error(`Invalid UserRole: ${role}. Valid values: ${Object.values($Enums.UserRole).join(', ')}`);
    }
    return role as $Enums.UserRole;
  }

  /**
   * Converts string to Prisma UserAccountStatus with validation
   * @param status - String status value
   * @returns Valid Prisma UserAccountStatus
   * @throws Error if status is invalid
   */
  static toPrismaUserAccountStatus(status: string): $Enums.UserAccountStatus {
    if (!Object.values($Enums.UserAccountStatus).includes(status as $Enums.UserAccountStatus)) {
      throw new Error(`Invalid UserAccountStatus: ${status}. Valid values: ${Object.values($Enums.UserAccountStatus).join(', ')}`);
    }
    return status as $Enums.UserAccountStatus;
  }

  /**
   * Converts string to Prisma OAuthProvider with validation
   * @param provider - String provider value
   * @returns Valid Prisma OAuthProvider
   * @throws Error if provider is invalid
   */
  static toPrismaOAuthProvider(provider: string): $Enums.OAuthProvider {
    if (!Object.values($Enums.OAuthProvider).includes(provider as $Enums.OAuthProvider)) {
      throw new Error(`Invalid OAuthProvider: ${provider}. Valid values: ${Object.values($Enums.OAuthProvider).join(', ')}`);
    }
    return provider as $Enums.OAuthProvider;
  }

  /**
   * Converts array of strings to Prisma UserRole array with validation
   * @param roles - Array of string role values
   * @returns Array of valid Prisma UserRole values
   * @throws Error if any role is invalid
   */
  static toPrismaUserRoleArray(roles: string[]): $Enums.UserRole[] {
    return roles.map(role => this.toPrismaUserRole(role));
  }

  /**
   * Converts array of strings to Prisma UserAccountStatus array with validation
   * @param statuses - Array of string status values
   * @returns Array of valid Prisma UserAccountStatus values
   * @throws Error if any status is invalid
   */
  static toPrismaUserAccountStatusArray(statuses: string[]): $Enums.UserAccountStatus[] {
    return statuses.map(status => this.toPrismaUserAccountStatus(status));
  }

  /**
   * Converts array of strings to Prisma OAuthProvider array with validation
   * @param providers - Array of string provider values
   * @returns Array of valid Prisma OAuthProvider values
   * @throws Error if any provider is invalid
   */
  static toPrismaOAuthProviderArray(providers: string[]): $Enums.OAuthProvider[] {
    return providers.map(provider => this.toPrismaOAuthProvider(provider));
  }
}
