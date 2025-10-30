/**
 * @fileoverview TestUnlinkProviderUseCase - Simplified UnlinkProvider use case for integration tests
 * @summary Test-specific implementation that bypasses complex Cognito operations
 * @description This use case is designed for integration tests, focusing on database
 * interactions and business logic validation while mocking external dependencies.
 */

import { UnlinkProviderRequest, UnlinkProviderResponse } from '../../../src/domain/interfaces';
import { UnlinkingMode, OAuthProvider, ProviderUnlinkingStatus } from '../../../src/domain/enums';
import { PrismaClient } from '@prisma/client';
import { AppError, ErrorCodes, rethrowAppErrorOr } from '@lawprotect/shared-ts';

export class TestUnlinkProviderUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(input: UnlinkProviderRequest & { cognitoSub: string }): Promise<UnlinkProviderResponse> {
    try {
      const { cognitoSub, mode, provider, providerAccountId, confirmationToken } = input;

      // Basic validation - convert string to enum for comparison
      const providerEnum = provider as OAuthProvider;
      if (!Object.values(OAuthProvider).includes(providerEnum)) {
        throw new AppError(ErrorCodes.COMMON_UNPROCESSABLE_ENTITY, 422, `Provider ${provider} is not supported`);
      }

      const modeEnum = mode as UnlinkingMode;
      if (!Object.values(UnlinkingMode).includes(modeEnum)) {
        throw new AppError(ErrorCodes.COMMON_UNPROCESSABLE_ENTITY, 422, `Mode ${mode} is not supported`);
      }

      // Find user by cognitoSub
      const user = await this.prisma.user.findFirst({
        where: { cognitoSub: cognitoSub }
      });

      if (!user) {
        throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, 'User not found');
      }

      // Route to appropriate handler based on mode
      switch (modeEnum) {
        case UnlinkingMode.DIRECT:
          return await this.handleDirectMode(user.id, providerEnum, providerAccountId);
        case UnlinkingMode.CONFIRM:
          return await this.handleConfirmMode(user.id, providerEnum, providerAccountId, confirmationToken);
        default:
          throw new AppError(ErrorCodes.COMMON_UNPROCESSABLE_ENTITY, 422, `Unsupported mode: ${mode}`);
      }
    } catch (error) {
      rethrowAppErrorOr(error, (details) => 
        new AppError(ErrorCodes.COMMON_INTERNAL_ERROR, 500, 'Provider unlinking failed', details)
      );
    }
  }

  private async handleDirectMode(userId: string, provider: OAuthProvider, providerAccountId: string): Promise<UnlinkProviderResponse> {
    try {
      // Find the OAuth account to unlink
      const oauthAccount = await this.prisma.oAuthAccount.findFirst({
        where: {
          userId: userId,
          provider: provider,
          providerAccountId: providerAccountId
        }
      });

      if (!oauthAccount) {
        return {
          unlinked: false,
          provider,
          providerAccountId,
          status: ProviderUnlinkingStatus.NOT_FOUND,
          message: 'OAuth account not found'
        };
      }

      // Check if this is the last provider for the user
      // Allow unlinking if user has Cognito as backup, otherwise prevent unlinking the last provider
      const hasCognitoProvider = await this.prisma.oAuthAccount.findFirst({
        where: { 
          userId: userId,
          provider: 'COGNITO'
        }
      });

      if (!hasCognitoProvider) {
        // User doesn't have Cognito, check if this is the last provider
        const totalProviders = await this.prisma.oAuthAccount.count({
          where: { userId: userId }
        });

        if (totalProviders <= 1) {
          return {
            unlinked: false,
            provider,
            providerAccountId,
            status: ProviderUnlinkingStatus.NOT_ALLOWED,
            message: 'Cannot unlink the last provider'
          };
        }
      }

      // Delete the OAuth account
      await this.prisma.oAuthAccount.delete({
        where: { id: oauthAccount.id }
      });

      return {
        unlinked: true,
        provider,
        providerAccountId,
        unlinkedAt: new Date().toISOString(),
        status: ProviderUnlinkingStatus.SUCCESS,
        message: 'Provider successfully unlinked'
      };
    } catch (error) {
      throw error;
    }
  }

  private async handleConfirmMode(userId: string, provider: OAuthProvider, providerAccountId: string, confirmationToken?: string): Promise<UnlinkProviderResponse> {
    try {
      if (!confirmationToken) {
        throw new AppError(ErrorCodes.COMMON_UNPROCESSABLE_ENTITY, 422, 'confirmationToken is required for confirm mode');
      }

      // For testing purposes, accept any non-empty confirmation token
      if (confirmationToken.trim().length === 0) {
        throw new AppError(ErrorCodes.COMMON_UNPROCESSABLE_ENTITY, 422, 'confirmationToken cannot be empty');
      }

      // Find the OAuth account to unlink
      const oauthAccount = await this.prisma.oAuthAccount.findFirst({
        where: {
          userId: userId,
          provider: provider,
          providerAccountId: providerAccountId
        }
      });

      if (!oauthAccount) {
        return {
          unlinked: false,
          provider,
          providerAccountId,
          status: ProviderUnlinkingStatus.NOT_FOUND,
          message: 'OAuth account not found'
        };
      }

      // Check if this is the last provider for the user
      // Allow unlinking if user has Cognito as backup, otherwise prevent unlinking the last provider
      const hasCognitoProvider = await this.prisma.oAuthAccount.findFirst({
        where: { 
          userId: userId,
          provider: 'COGNITO'
        }
      });

      if (!hasCognitoProvider) {
        // User doesn't have Cognito, check if this is the last provider
        const totalProviders = await this.prisma.oAuthAccount.count({
          where: { userId: userId }
        });

        if (totalProviders <= 1) {
          return {
            unlinked: false,
            provider,
            providerAccountId,
            status: ProviderUnlinkingStatus.NOT_ALLOWED,
            message: 'Cannot unlink the last provider'
          };
        }
      }

      // Delete the OAuth account
      await this.prisma.oAuthAccount.delete({
        where: { id: oauthAccount.id }
      });

      return {
        unlinked: true,
        provider,
        providerAccountId,
        unlinkedAt: new Date().toISOString(),
        status: ProviderUnlinkingStatus.SUCCESS,
        message: 'Provider successfully unlinked with confirmation'
      };
    } catch (error) {
      throw error;
    }
  }
}
