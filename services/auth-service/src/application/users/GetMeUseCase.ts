/**
 * @fileoverview GetMeUseCase - Application service for GET /me endpoint
 * @summary Orchestrates user profile retrieval with conditional data inclusion
 * @description This application service handles the complete GetMe use case,
 * including user resolution, conditional data fetching, and response assembly.
 */

import { User } from '../../domain/entities/User';
import { UserService } from '../../services/UserService';
import { OAuthAccountRepository } from '../../repositories/OAuthAccountRepository';
import { UserVisibilityRules } from '../../domain/rules/UserVisibilityRules';
import { IncludeFlags } from '../../domain/value-objects/IncludeFlags';
import { UserProfileResponseDto, GetMeInput, GetMeResult } from '../../types/users/UserProfileResponseDto';
import { UserId } from '../../domain/value-objects/UserId';
import { Logger } from '@lawprotect/shared-ts';
import { userNotFound } from '../../auth-errors/factories';

/**
 * Application service for handling GET /me use case
 * 
 * Orchestrates user profile retrieval with conditional data inclusion
 * based on include flags. Follows Single Responsibility Principle by
 * delegating to specific services and domain rules.
 */
export class GetMeUseCase {
  constructor(
    private readonly userService: UserService,
    private readonly oauthAccountRepository: OAuthAccountRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Execute the GetMe use case
   * @param input - Input parameters including cognitoSub and include flags
   * @returns Promise that resolves to the complete user profile response
   * @throws userNotFound when user is not found in database
   */
  async execute(input: GetMeInput): Promise<GetMeResult> {
    const { cognitoSub, includeFlags } = input;
    const flags = new IncludeFlags(includeFlags);

    this.logger.info('Starting GetMe use case', {
      cognitoSub,
      includeFlags: flags.getActiveFlags()
    });

    try {
      // 1. Resolve user by Cognito sub
      const user = await this.resolveUser(cognitoSub);
      
      // 2. Get providers if requested
      const providers = flags.getProviders() 
        ? await this.getProviders(user.getId())
        : undefined;
      
      // 3. Get personal info if requested
      const userPersonalInfo = flags.getProfile()
        ? await this.userService.getPersonalInfo(user.getId())
        : null;
      const personalInfo = flags.getProfile()
        ? UserVisibilityRules.getPersonalInfo(user, userPersonalInfo)
        : undefined;
      
      // 4. Get claims if requested
      const claims = flags.getClaims()
        ? UserVisibilityRules.getClaimsInfo(user)
        : undefined;
      
      // 5. Build response
      const response = this.buildResponse(user, providers, personalInfo, claims);
      
      this.logger.info('GetMe use case completed successfully', {
        userId: user.getId().toString(),
        role: user.getRole(),
        status: user.getStatus(),
        includeFlags: flags.getActiveFlags()
      });

      return response;
      
    } catch (error) {
      this.logger.error('GetMe use case failed', {
        cognitoSub,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Resolve user by Cognito sub
   * @param cognitoSub - Cognito user sub
   * @returns User entity
   * @throws userNotFound when user is not found
   */
  private async resolveUser(cognitoSub: string): Promise<User> {
    const user = await this.userService.findByCognitoSub(cognitoSub);
    
    if (!user) {
      throw userNotFound({
        cause: `User not found for Cognito sub: ${cognitoSub}`
      });
    }
    
    return user;
  }

  /**
   * Get OAuth providers for the user
   * @param userId - User ID
   * @returns Array of provider information
   */
  private async getProviders(userId: UserId): Promise<any[]> {
    try {
      const accounts = await this.oauthAccountRepository.listByUserId(userId.toString());
      
      return accounts.map((account: any) => ({
        provider: account.getProvider(),
        linkedAt: account.getCreatedAt().toISOString()
      }));
    } catch (error) {
      this.logger.warn('Failed to retrieve OAuth providers', {
        userId: userId.toString(),
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Build the complete response
   * @param user - User entity
   * @param providers - OAuth providers (optional)
   * @param personalInfo - Personal information (optional)
   * @param claims - Claims information (optional)
   * @param flags - Include flags
   * @returns Complete GetMe response
   */
  private buildResponse(
    user: User,
    providers: any[] | undefined,
    personalInfo: any,
    claims: any
  ): GetMeResult {
    const userProfile: UserProfileResponseDto = {
      id: user.getId().toString(),
      email: user.getEmail()?.toString() || '',
      name: UserVisibilityRules.getDisplayName(user),
      givenName: user.getFirstName(),
      lastName: user.getLastName(),
      role: user.getRole(),
      status: user.getStatus(),
      mfa: UserVisibilityRules.getMfaStatus(user),
      identity: UserVisibilityRules.getIdentityInfo(user),
      meta: UserVisibilityRules.getMetaInfo(user)
    };

    // Add conditional fields
    if (providers) {
      userProfile.providers = providers;
    }

    if (personalInfo) {
      userProfile.personalInfo = personalInfo;
    }

    if (claims) {
      userProfile.claims = claims;
    }

    // Build headers
    const headers: Record<string, string> = {};
    
    if (UserVisibilityRules.shouldIncludePendingVerificationHeader(user)) {
      headers['X-User-Pending-Verification'] = 'true';
    }

    return {
      user: userProfile,
      headers: Object.keys(headers).length > 0 ? headers : undefined
    };
  }
}
