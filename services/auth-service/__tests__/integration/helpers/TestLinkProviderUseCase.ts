/**
 * @fileoverview TestLinkProviderUseCase - Simplified LinkProviderUseCase for integration tests
 * @summary Test-specific implementation of LinkProviderUseCase
 * @description Simplified implementation that bypasses complex Cognito operations for testing
 */

import { LinkProviderRequest, LinkProviderResponse } from '../../../src/domain/interfaces';
import { LinkingMode, OAuthProvider } from '../../../src/domain/enums';
import { PrismaClient } from '@prisma/client';
import { uuid, AppError, ErrorCodes, rethrowAppErrorOr } from '@lawprotect/shared-ts';

export class TestLinkProviderUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(input: LinkProviderRequest, userId: string): Promise<LinkProviderResponse> {
    try {
      const { mode, provider } = input;

      // Basic validation - convert string to enum for comparison
      const providerEnum = provider as OAuthProvider;
      if (!Object.values(OAuthProvider).includes(providerEnum)) {
        throw new AppError(ErrorCodes.COMMON_UNPROCESSABLE_ENTITY, 422, `Provider ${provider} is not supported`);
      }

      const modeEnum = mode as LinkingMode;
      if (!Object.values(LinkingMode).includes(modeEnum)) {
        throw new AppError(ErrorCodes.COMMON_UNPROCESSABLE_ENTITY, 422, `Mode ${mode} is not supported`);
      }

      // Route to appropriate handler based on mode
      switch (modeEnum) {
        case LinkingMode.REDIRECT:
          return await this.handleRedirectMode(input);
        case LinkingMode.DIRECT:
          return await this.handleDirectMode(input, userId);
        case LinkingMode.FINALIZE:
          return await this.handleFinalizeMode(input, userId);
        default:
          throw new AppError(ErrorCodes.COMMON_UNPROCESSABLE_ENTITY, 422, `Unsupported mode: ${mode}`);
      }
    } catch (error) {
      console.error('Error in TestLinkProviderUseCase.execute:', error);
      rethrowAppErrorOr(error, (details) => 
        new AppError(ErrorCodes.COMMON_INTERNAL_ERROR, 500, 'Provider linking failed', details)
      );
    }
  }

  private async handleRedirectMode(input: LinkProviderRequest): Promise<LinkProviderResponse> {
    const { provider, successUrl, failureUrl } = input;
    
    if (!successUrl || !failureUrl) {
      throw new AppError(ErrorCodes.COMMON_UNPROCESSABLE_ENTITY, 422, 'successUrl and failureUrl are required for redirect mode');
    }

    // Generate a mock hosted UI URL
    const linkUrl = `https://auth.example.com/oauth/${String(provider).toLowerCase()}?state=mock-state&success_url=${encodeURIComponent(successUrl)}&failure_url=${encodeURIComponent(failureUrl)}`;

    return {
      linkUrl,
      linked: false,
      provider
    };
  }

  private async handleDirectMode(input: LinkProviderRequest, userId: string): Promise<LinkProviderResponse> {
    try {
      const { provider, authorizationCode, idToken } = input;
      
      if (!authorizationCode && !idToken) {
        throw new AppError(ErrorCodes.COMMON_UNPROCESSABLE_ENTITY, 422, 'authorizationCode or idToken is required for direct mode');
      }

      // For testing, use authorizationCode as providerAccountId to enable conflict detection
      const providerAccountId = authorizationCode || idToken || this.generateDeterministicProviderAccountId(provider, 'default');

      // Get the user by the provided userId
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      if (!user) {
        throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, 'User not found');
      }

      // Check if user already has this provider linked
      const existingAccount = await this.prisma.oAuthAccount.findFirst({
        where: {
          userId: user.id,
          provider: provider
        }
      });

      if (existingAccount) {
        // Return conflict error - user already has this provider linked
        throw new AppError(ErrorCodes.COMMON_CONFLICT, 409, 'User already has this provider linked');
      }

      // Check if this provider account is already linked to another user
      const existingProviderAccount = await this.prisma.oAuthAccount.findFirst({
        where: {
          provider: provider,
          providerAccountId: providerAccountId
        }
      });

      if (existingProviderAccount) {
        // Return conflict error - provider account already linked to another user
        throw new AppError(ErrorCodes.COMMON_CONFLICT, 409, 'OAuth account already linked to another user');
      }

      // Create new OAuth account
      const oauthAccount = await this.prisma.oAuthAccount.create({
        data: {
          id: uuid(),
          userId: user.id,
          provider: provider,
          providerAccountId: providerAccountId,
          createdAt: new Date()
        }
      });

      return {
        linked: true,
        provider,
        providerAccountId,
        linkedAt: oauthAccount.createdAt.toISOString()
      };
    } catch (error) {
      console.error('Error in handleDirectMode:', error);
      throw error;
    }
  }

  private async handleFinalizeMode(input: LinkProviderRequest, userId: string): Promise<LinkProviderResponse> {
    const { provider, code, idToken, state } = input;
    
    if (!code && !idToken) {
      throw new AppError(ErrorCodes.COMMON_UNPROCESSABLE_ENTITY, 422, 'code or idToken is required for finalize mode');
    }

    if (!state) {
      throw new AppError(ErrorCodes.COMMON_UNPROCESSABLE_ENTITY, 422, 'state is required for finalize mode');
    }

    // Validate state parameter (basic validation for testing)
    // For testing purposes, accept any non-empty state
    if (state.trim().length === 0) {
      throw new AppError(ErrorCodes.COMMON_UNPROCESSABLE_ENTITY, 422, 'state cannot be empty');
    }

    // Mock provider account ID based on provider
    const providerAccountId = this.generateMockProviderAccountId(provider);

    // Check if account already exists
    const existingAccount = await this.prisma.oAuthAccount.findFirst({
      where: {
        provider: provider,
        providerAccountId: providerAccountId
      }
    });

    if (existingAccount) {
      // Return conflict error
      throw new AppError(ErrorCodes.COMMON_CONFLICT, 409, 'OAuth account already linked to another user');
    }

    // Get the user by the provided userId
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, 'User not found');
    }

    // Create new OAuth account
    const oauthAccount = await this.prisma.oAuthAccount.create({
      data: {
        id: uuid(),
        userId: user.id,
        provider: provider,
        providerAccountId: providerAccountId,
        createdAt: new Date()
      }
    });

    return {
      linked: true,
      provider,
      providerAccountId,
      linkedAt: oauthAccount.createdAt.toISOString()
    };
  }

  private generateDeterministicProviderAccountId(provider: OAuthProvider, authCode: string): string {
    // For testing purposes, generate a deterministic ID based on provider and auth code
    // Include high-precision timestamp to ensure uniqueness across tests
    const timestamp = process.hrtime.bigint().toString();
    const combinedString = `${provider}-${authCode}-${timestamp}`;
    const hash = this.simpleHash(combinedString);
    return `${String(provider).toLowerCase()}-${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private generateMockProviderAccountId(provider: OAuthProvider): string {
    const timestamp = Date.now();
    const { randomBytes } = require('node:crypto');
    const random = randomBytes(4).toString('hex');
    
    // Use a simple format that works for all providers
    return `${String(provider).toLowerCase()}-${timestamp}-${random}`;
  }
}
