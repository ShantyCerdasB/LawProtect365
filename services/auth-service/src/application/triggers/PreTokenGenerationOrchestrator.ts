/**
 * @fileoverview PreTokenGenerationOrchestrator - Application service for PreTokenGeneration trigger
 * @summary Orchestrates PreTokenGeneration trigger business logic
 * @description This application service coordinates the PreTokenGeneration trigger flow,
 * including user data retrieval, claims mapping, and token enrichment.
 */

import { User } from '../../domain/entities/User';
import { UserService } from '../../services/UserService';
import { CognitoService } from '../../services/CognitoService';
import { PreTokenGenEvent, PreTokenGenResult } from '../../types/cognito/PreTokenGenEvent';
import { ClaimsMappingRules } from '../../domain/rules/ClaimsMappingRules';
import { UserClaimsData, MfaClaimsData, ClaimsOverrideDetails } from '../../domain/interfaces';
import { CognitoAttribute } from '../../domain/enums';
import { AuthServiceConfig } from '../../config/AppConfig';

/**
 * Application service that orchestrates the PreTokenGeneration flow
 * 
 * Coordinates user data retrieval, claims mapping, and token enrichment
 * following the Single Responsibility Principle by delegating to specific services.
 */
export class PreTokenGenerationOrchestrator {
  constructor(
    private readonly userService: UserService,
    private readonly cognitoService: CognitoService,
    private readonly config: AuthServiceConfig
  ) {}

  /**
   * Process the complete PreTokenGeneration flow
   * @param event - The Cognito PreTokenGeneration event
   * @returns Promise that resolves to the processed event with claims
   */
  async processPreTokenGeneration(event: PreTokenGenEvent): Promise<PreTokenGenResult> {
    const { cognitoSub, userAttributes } = this.extractUserData(event);
    
    try {
      // Get user data from database
      const user = await this.getUserFromDatabase(cognitoSub);
      
      // Get Cognito MFA data
      const cognitoMfaData = await this.getCognitoMfaData(cognitoSub);
      
      // Build claims based on user data and configuration
      const claims = await this.buildClaims(user, cognitoMfaData, userAttributes);
      
      // Create claims override details
      const claimsOverrideDetails = this.createClaimsOverrideDetails(claims);
      
      // Update event with claims
      const updatedEvent = this.updateEventWithClaims(event, claimsOverrideDetails);
      
      // Log successful token generation
      this.logTokenGenerationSuccess(cognitoSub, user, claims);
      
      return updatedEvent;
      
    } catch (error) {
      // Handle errors gracefully - don't block token generation
      this.logTokenGenerationError(cognitoSub, error);
      
      // Return event with default claims or empty claims
      const defaultClaims = this.getDefaultClaims();
      const claimsOverrideDetails = this.createClaimsOverrideDetails(defaultClaims);
      return this.updateEventWithClaims(event, claimsOverrideDetails);
    }
  }

  /**
   * Extract user data from the Cognito event
   * @param event - The PreTokenGeneration event
   * @returns Extracted user data
   */
  private extractUserData(event: PreTokenGenEvent) {
    return {
      cognitoSub: event.userName,
      userAttributes: event.request.userAttributes,
      clientMetadata: event.request.clientMetadata
    };
  }

  /**
   * Get user from database by Cognito sub
   * @param cognitoSub - Cognito user sub
   * @returns User entity or null if not found
   */
  private async getUserFromDatabase(cognitoSub: string): Promise<User | null> {
    try {
      return await this.userService.findByCognitoSub(cognitoSub);
    } catch (error) {
      console.warn(`Failed to retrieve user from database: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Get Cognito MFA data for claims
   * @param cognitoSub - Cognito user sub
   * @returns MFA data from Cognito
   */
  private async getCognitoMfaData(cognitoSub: string): Promise<MfaClaimsData> {
    try {
      const cognitoUser = await this.cognitoService.adminGetUser(cognitoSub);
      const mfaSettings = this.cognitoService.parseMfaSettings(cognitoUser);
      
      return {
        isMfaRequired: mfaSettings.isMfaRequiredAttr,
        isMfaEnabled: mfaSettings.mfaEnabled
      };
    } catch (error) {
      console.warn(`Failed to retrieve Cognito MFA data: ${error instanceof Error ? error.message : String(error)}`);
      return {
        isMfaRequired: false,
        isMfaEnabled: false
      };
    }
  }

  /**
   * Build claims based on user data and configuration
   * @param user - User entity from database
   * @param mfaData - MFA data from Cognito
   * @param userAttributes - User attributes from event
   * @returns Claims object
   */
  private async buildClaims(
    user: User | null,
    mfaData: MfaClaimsData,
    userAttributes: Record<string, string | undefined>
  ): Promise<Record<string, string | boolean>> {
    if (!user) {
      return this.getDefaultClaims();
    }

    // Build core user claims
    const userClaimsData: UserClaimsData = {
      userId: user.getId(),
      role: user.getRole(),
      status: user.getStatus()
    };

    // Determine MFA requirement based on role and custom attributes
    const customMfaRequired = this.getCustomMfaRequired(userAttributes);
    const isMfaRequired = ClaimsMappingRules.isMfaRequiredByPolicy(user.getRole(), customMfaRequired);

    const mfaClaimsData: MfaClaimsData = {
      isMfaRequired,
      isMfaEnabled: mfaData.isMfaEnabled
    };

    // Build all claims
    const allClaims = ClaimsMappingRules.buildAllClaims(userClaimsData, mfaClaimsData);

    // Filter claims based on configuration
    return this.filterClaimsByConfig(allClaims);
  }

  /**
   * Get custom MFA requirement from user attributes
   * @param userAttributes - User attributes from event
   * @returns Custom MFA requirement or undefined
   */
  private getCustomMfaRequired(userAttributes: Record<string, string | undefined>): boolean | undefined {
    const customMfaRequired = userAttributes[CognitoAttribute.CUSTOM_MFA_REQUIRED];
    return customMfaRequired === 'true' ? true : customMfaRequired === 'false' ? false : undefined;
  }

  /**
   * Filter claims based on configuration
   * @param claims - All claims
   * @returns Filtered claims
   */
  private filterClaimsByConfig(claims: Record<string, string | boolean>): Record<string, string | boolean> {
    const filtered: Record<string, string | boolean> = {};

    // Always include role
    if (claims['custom:role']) {
      filtered['custom:role'] = claims['custom:role'];
    }

    // Include account status if configured
    if (this.config.features.tokenIncludeAccountStatus && claims['custom:account_status']) {
      filtered['custom:account_status'] = claims['custom:account_status'];
    }

    // Include user ID if configured
    if (this.config.features.tokenIncludeInternalUserId && claims['custom:user_id']) {
      filtered['custom:user_id'] = claims['custom:user_id'];
    }

    // Include MFA flags if configured
    if (this.config.features.tokenIncludeMfaFlags) {
      if (claims['custom:is_mfa_required'] !== undefined) {
        filtered['custom:is_mfa_required'] = claims['custom:is_mfa_required'];
      }
      if (claims['custom:mfa_enabled'] !== undefined) {
        filtered['custom:mfa_enabled'] = claims['custom:mfa_enabled'];
      }
    }

    return filtered;
  }

  /**
   * Get default claims for fallback scenarios
   * @returns Default claims
   */
  private getDefaultClaims(): Record<string, string | boolean> {
    return ClaimsMappingRules.getDefaultClaims();
  }

  /**
   * Create claims override details for Cognito
   * @param claims - Claims to include
   * @returns Claims override details
   */
  private createClaimsOverrideDetails(claims: Record<string, string | boolean>): ClaimsOverrideDetails {
    return ClaimsMappingRules.toClaimsOverrideDetails(claims);
  }

  /**
   * Update event with claims override details
   * @param event - Original event
   * @param claimsOverrideDetails - Claims to add
   * @returns Updated event
   */
  private updateEventWithClaims(
    event: PreTokenGenEvent,
    claimsOverrideDetails: ClaimsOverrideDetails
  ): PreTokenGenResult {
    return {
      ...event,
      response: {
        ...event.response,
        claimsOverrideDetails
      }
    };
  }

  /**
   * Log successful token generation
   * @param cognitoSub - Cognito user sub
   * @param user - User entity
   * @param claims - Generated claims
   */
  private logTokenGenerationSuccess(
    cognitoSub: string,
    user: User | null,
    claims: Record<string, string | boolean>
  ): void {
    console.log(`PreTokenGeneration successful for user: ${cognitoSub}`, {
      userId: user?.getId().toString(),
      role: user?.getRole(),
      status: user?.getStatus(),
      claimsCount: Object.keys(claims).length,
      claims: Object.keys(claims)
    });
  }

  /**
   * Log token generation error
   * @param cognitoSub - Cognito user sub
   * @param error - Error that occurred
   */
  private logTokenGenerationError(cognitoSub: string, error: unknown): void {
    console.error(`PreTokenGeneration error for user: ${cognitoSub}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
