/**
 * @fileoverview RepositoryFactory - Factory for repository instances
 * @summary Creates and configures repository instances
 * @description Manages repository creation and dependency injection for data access layer.
 * This factory follows the Single Responsibility Principle by focusing exclusively on
 * repository instantiation and Prisma client configuration.
 */

import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../../repositories/UserRepository';
import { OAuthAccountRepository } from '../../repositories/OAuthAccountRepository';
import { UserAuditEventRepository } from '../../repositories/UserAuditEventRepository';
import { UserPersonalInfoRepository } from '../../repositories/UserPersonalInfoRepository';

/**
 * Factory responsible for creating all repository instances.
 * Follows the Single Responsibility Principle by focusing exclusively on repository creation.
 */
export class RepositoryFactory {
  private static prismaClient: PrismaClient | undefined;

  /**
   * Creates Prisma client instance (singleton)
   * @returns Configured PrismaClient instance
   */
  static createPrismaClient(): PrismaClient {
    if (!this.prismaClient) {
      this.prismaClient = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      });
    }
    return this.prismaClient;
  }

  /**
   * Creates UserRepository instance
   * @returns Configured UserRepository instance
   */
  static createUserRepository(): UserRepository {
    return new UserRepository(this.createPrismaClient());
  }

  /**
   * Creates OAuthAccountRepository instance
   * @returns Configured OAuthAccountRepository instance
   */
  static createOAuthAccountRepository(): OAuthAccountRepository {
    return new OAuthAccountRepository(this.createPrismaClient());
  }

  /**
   * Creates UserAuditEventRepository instance
   * @returns Configured UserAuditEventRepository instance
   */
  static createUserAuditEventRepository(): UserAuditEventRepository {
    return new UserAuditEventRepository(this.createPrismaClient());
  }

  static createUserPersonalInfoRepository(): UserPersonalInfoRepository {
    return new UserPersonalInfoRepository(this.createPrismaClient());
  }

  /**
   * Creates all repositories in a single operation
   * @returns Object containing all repository instances
   */
  static createAll() {
    return {
      userRepository: this.createUserRepository(),
      oauthAccountRepository: this.createOAuthAccountRepository(),
      userAuditEventRepository: this.createUserAuditEventRepository(),
      userPersonalInfoRepository: this.createUserPersonalInfoRepository(),
    };
  }
}
