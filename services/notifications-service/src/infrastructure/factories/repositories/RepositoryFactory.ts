/**
 * @fileoverview RepositoryFactory - Factory for data access layer components
 * @summary Creates Prisma-backed repositories with proper database configuration
 * @description Centralizes repository creation and database connection management.
 * This factory follows the Single Responsibility Principle by focusing solely on
 * repository instantiation and database client configuration.
 */

import { PrismaClient } from '@prisma/client';
import { getPrisma, getPrismaAsync } from '@lawprotect/shared-ts';

import { PrismaNotificationRepository } from '../../../repositories/PrismaNotificationRepository';

/**
 * Factory responsible for creating all repository instances with proper database configuration.
 *
 * Design notes:
 * - Avoids reading `DATABASE_URL` at module import time (cold start).
 * - Creates the Prisma client lazily on first use (sync or async variants).
 * - The async path resolves the DB URL from Secrets Manager via shared-ts if needed.
 */
export class RepositoryFactory {
  /** Singleton Prisma client instance (lazy) */
  private static prismaClient: PrismaClient | undefined;

  /**
   * @description Lazily creates or returns the Prisma client (sync).
   * Note: Will throw if DATABASE_URL is not yet available.
   * @returns {PrismaClient} Prisma client instance
   */
  private static getPrismaClientInternal(): PrismaClient {
    if (!this.prismaClient) {
      this.prismaClient = getPrisma();
    }
    return this.prismaClient!;
  }

  /**
   * @description Lazily creates or returns the Prisma client (async).
   * Resolves DATABASE_URL from Secrets Manager if needed.
   * @returns {Promise<PrismaClient>} Prisma client instance
   */
  static async getPrismaClientAsync(): Promise<PrismaClient> {
    if (!this.prismaClient) {
      this.prismaClient = await getPrismaAsync();
    }
    return this.prismaClient!;
  }

  /**
   * @description Returns the shared Prisma client instance
   * @returns {PrismaClient} Configured PrismaClient instance
   */
  static getPrismaClient(): PrismaClient {
    return this.getPrismaClientInternal();
  }

  /**
   * @description Creates NotificationRepository with Prisma client
   * @returns {PrismaNotificationRepository} Configured NotificationRepository instance
   */
  static createNotificationRepository(): PrismaNotificationRepository {
    return new PrismaNotificationRepository(this.getPrismaClientInternal());
  }

  /**
   * @description Creates all repositories in a single operation (synchronous).
   * Use when you're certain `DATABASE_URL` is already set.
   * @returns {Object} Object containing all repository instances
   */
  static createAll() {
    return {
      notificationRepository: this.createNotificationRepository(),
    };
  }

  /**
   * @description Creates all repositories ensuring `DATABASE_URL` is resolved first.
   * Prefer this path inside Lambda handlers to avoid import-time failures.
   * @returns {Promise<Object>} Object containing all repository instances
   */
  static async createAllAsync() {
    const prisma = await this.getPrismaClientAsync();
    return {
      notificationRepository: new PrismaNotificationRepository(prisma),
    };
  }
}

