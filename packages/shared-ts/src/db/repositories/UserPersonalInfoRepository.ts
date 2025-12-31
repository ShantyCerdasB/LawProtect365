/**
 * @fileoverview UserPersonalInfoRepository - Shared repository for user personal information
 * @summary Provides access to user personal information data for cross-service use
 * @description This repository provides minimal, read-only access to user personal information
 * for services that need to query user data without depending on the auth-service.
 * It uses direct database access for better performance and reduced complexity.
 */

import type { PrismaClient } from '@prisma/client';
import type { PrismaClientLike } from '../repositoryBase';

/**
 * Shared repository for accessing user personal information
 * @description Provides read-only access to user personal information data.
 * This repository is designed for cross-service use where services need to
 * query user data without making HTTP calls to auth-service.
 */
export class UserPersonalInfoRepository {
  constructor(private readonly prisma: PrismaClientLike) {}

  /**
   * Gets the date of birth for a user
   * @param userId - The user ID
   * @param tx - Optional transactional context
   * @returns Promise resolving to date of birth or null if not found
   * @throws Error when database query fails
   */
  async getDateOfBirth(userId: string, tx?: PrismaClientLike): Promise<Date | null> {
    try {
      const client = (tx || this.prisma) as PrismaClient;
      const personalInfo = await client.userPersonalInfo.findUnique({
        where: { userId },
        select: { dateOfBirth: true },
      });

      return personalInfo?.dateOfBirth ?? null;
    } catch (error) {
      throw new Error(
        `Failed to get date of birth for user ${userId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Gets user personal information by user ID
   * @param userId - The user ID
   * @param tx - Optional transactional context
   * @returns Promise resolving to user personal information or null if not found
   * @throws Error when database query fails
   */
  async getPersonalInfo(userId: string, tx?: PrismaClientLike): Promise<{
    dateOfBirth: Date | null;
    phone: string | null;
    locale: string | null;
    timeZone: string | null;
  } | null> {
    try {
      const client = (tx || this.prisma) as PrismaClient;
      const personalInfo = await client.userPersonalInfo.findUnique({
        where: { userId },
        select: {
          dateOfBirth: true,
          phone: true,
          locale: true,
          timeZone: true,
        },
      });

      if (!personalInfo) {
        return null;
      }

      return {
        dateOfBirth: personalInfo.dateOfBirth,
        phone: personalInfo.phone,
        locale: personalInfo.locale,
        timeZone: personalInfo.timeZone,
      };
    } catch (error) {
      throw new Error(
        `Failed to get personal info for user ${userId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

