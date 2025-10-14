/**
 * @fileoverview OAuthAccountRepository - Data access for OAuthAccount entity
 * @summary Handles OAuthAccount entity persistence operations
 * @description Provides data access methods for OAuthAccount entity using Prisma,
 * including CRUD operations and OAuth account linking.
 */

import { PrismaClient } from '@prisma/client';
import { OAuthAccount } from '../domain/entities/OAuthAccount';
import { OAuthProvider } from '../domain/enums/OAuthProvider';
import { repositoryError } from '../auth-errors/factories';

/**
 * Repository for OAuthAccount entity persistence
 * 
 * Handles all database operations for OAuthAccount entity.
 */
export class OAuthAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Upserts an OAuth account (create or update)
   * @param userId - User ID to link to
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   * @returns Created or updated OAuthAccount entity
   */
  async upsert(
    userId: string,
    provider: OAuthProvider,
    providerAccountId: string
  ): Promise<OAuthAccount> {
    try {
      const oauthAccount = await this.prisma.oAuthAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId
          }
        },
        update: {
          userId,
          updatedAt: new Date()
        },
        create: {
          userId,
          provider,
          providerAccountId
        }
      });

      return OAuthAccount.fromPersistence(oauthAccount);
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to upsert OAuth account: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  /**
   * Finds OAuth account by provider and provider account ID
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   * @returns OAuthAccount entity or undefined if not found
   */
  async findByProviderAndAccountId(
    provider: OAuthProvider,
    providerAccountId: string
  ): Promise<OAuthAccount | undefined> {
    try {
      const oauthAccount = await this.prisma.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId
          }
        }
      });

      return oauthAccount ? OAuthAccount.fromPersistence(oauthAccount) : undefined;
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to find OAuth account: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  /**
   * Finds OAuth accounts by user ID
   * @param userId - User ID
   * @returns Array of OAuthAccount entities
   */
  async findByUserId(userId: string): Promise<OAuthAccount[]> {
    try {
      const oauthAccounts = await this.prisma.oAuthAccount.findMany({
        where: { userId }
      });

      return oauthAccounts.map(account => OAuthAccount.fromPersistence(account));
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to find OAuth accounts by user ID: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  /**
   * Deletes an OAuth account
   * @param id - OAuth account ID
   * @returns Deleted OAuthAccount entity
   */
  async delete(id: string): Promise<OAuthAccount> {
    try {
      const oauthAccount = await this.prisma.oAuthAccount.delete({
        where: { id }
      });

      return OAuthAccount.fromPersistence(oauthAccount);
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to delete OAuth account: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  /**
   * Unlinks OAuth account from user
   * @param userId - User ID
   * @param provider - OAuth provider
   * @param providerAccountId - Provider account ID
   * @returns Deleted OAuthAccount entity
   */
  async unlink(
    userId: string,
    provider: OAuthProvider,
    providerAccountId: string
  ): Promise<OAuthAccount | undefined> {
    try {
      const oauthAccount = await this.prisma.oAuthAccount.findFirst({
        where: {
          userId,
          provider,
          providerAccountId
        }
      });

      if (!oauthAccount) {
        return undefined;
      }

      return await this.delete(oauthAccount.id);
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to unlink OAuth account: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }
}
