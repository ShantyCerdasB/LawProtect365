/**
 * @fileoverview PreAuthenticationOrchestrator - Application service for PreAuthentication trigger
 * @summary Orchestrates PreAuthentication trigger business logic
 * @description This application service coordinates the PreAuthentication trigger flow,
 * including user validation, MFA policy evaluation, and access control decisions.
 */

import { User } from '../domain/entities/User';
import { UserService } from '../services/UserService';
import { CognitoService } from '../services/CognitoService';
import { PreAuthEvent, PreAuthResult } from '../types/cognito/PreAuthEvent';
import { MfaPolicyRules, CognitoMfaSettings } from '../domain/rules/MfaPolicyRules';
import { UserAccessRules } from '../domain/rules/UserAccessRules';
import { UserRole, UserAccountStatus } from '../domain/enums';
import { authenticationFailed } from '../auth-errors/factories';

/**
 * Application service that orchestrates the PreAuthentication flow
 * 
 * Coordinates user validation, MFA policy evaluation, and access control
 * following the Single Responsibility Principle by delegating to specific services.
 */
export class PreAuthenticationOrchestrator {
  constructor(
    private readonly userService: UserService,
    private readonly cognitoService: CognitoService
  ) {}

  /**
   * Process the complete PreAuthentication flow
   * @param event - The Cognito PreAuthentication event
   * @returns Promise that resolves to the processed event
   */
  async processPreAuthentication(event: PreAuthEvent): Promise<PreAuthResult> {
    const { cognitoSub, userAttributes } = this.extractUserData(event);
    
    // Get user data from Cognito
    const cognitoData = await this.getCognitoData(cognitoSub);
    
    // Get user from database (if exists)
    const user = await this.getUserFromDatabase(cognitoSub);
    
    // Evaluate MFA policy
    await this.evaluateMfaPolicy(user, cognitoData.mfaSettings, userAttributes);
    
    // Evaluate user access
    await this.evaluateUserAccess(user, userAttributes);
    
    // Log successful validation
    this.logValidationSuccess(cognitoSub, user, cognitoData.mfaSettings);
    
    return event;
  }

  /**
   * Extract user data from the Cognito event
   * @param event - The PreAuthentication event
   * @returns Extracted user data
   */
  private extractUserData(event: PreAuthEvent) {
    return {
      cognitoSub: event.userName,
      userAttributes: event.request.userAttributes
    };
  }

  /**
   * Get user data from Cognito using AdminGetUser
   * @param cognitoSub - Cognito user sub
   * @returns Cognito user data and MFA settings
   */
  private async getCognitoData(cognitoSub: string) {
    try {
      const adminUserResponse = await this.cognitoService.adminGetUser(cognitoSub);
      const mfaSettings = this.cognitoService.parseMfaSettings(adminUserResponse);
      
      return {
        adminUserResponse,
        mfaSettings
      };
    } catch (error) {
      throw authenticationFailed({
        cause: `Failed to get user data from Cognito: ${error instanceof Error ? error.message : String(error)}`,
        cognitoSub
      });
    }
  }

  /**
   * Get user from database (if exists)
   * @param cognitoSub - Cognito user sub
   * @returns User entity or null if not found
   */
  private async getUserFromDatabase(cognitoSub: string): Promise<User | null> {
    try {
      return await this.userService.findByCognitoSub(cognitoSub);
    } catch (error) {
      // Log warning but don't fail - user might not exist yet
      console.warn(`Failed to get user from database (non-blocking): ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Evaluate MFA policy for the user
   * @param user - User entity (if exists)
   * @param mfaSettings - MFA settings from Cognito
   * @param userAttributes - User attributes from event
   */
  private async evaluateMfaPolicy(
    user: User | null, 
    mfaSettings: CognitoMfaSettings, 
    userAttributes: Record<string, string | undefined>
  ) {
    // Get user role (from database or attributes)
    const userRole = this.getUserRole(user, userAttributes);
    
    // Get custom MFA requirement
    const customMfaRequired = this.getCustomMfaRequired(userAttributes);
    
    // Evaluate MFA policy
    MfaPolicyRules.validateMfaPolicy(userRole, mfaSettings, customMfaRequired);
  }

  /**
   * Evaluate user access based on account status
   * @param user - User entity (if exists)
   * @param _userAttributes - User attributes from event (unused for now)
   */
  private async evaluateUserAccess(
    user: User | null, 
    _userAttributes: Record<string, string | undefined>
  ) {
    // Get user status (from database or default)
    const userStatus = this.getUserStatus(user, _userAttributes);
    
    // Get access policy configuration
    const allowPendingVerification = this.getAllowPendingVerificationConfig();
    
    // Evaluate user access
    UserAccessRules.validateUserAccess(userStatus, allowPendingVerification);
  }

  /**
   * Get user role from database or attributes
   * @param user - User entity (if exists)
   * @param userAttributes - User attributes from event
   * @returns User role
   */
  private getUserRole(user: User | null, userAttributes: Record<string, string | undefined>): UserRole {
    if (user) {
      return user.getRole();
    }
    
    // Fallback to attributes
    const roleFromAttributes = userAttributes['custom:role'];
    if (roleFromAttributes && Object.values(UserRole).includes(roleFromAttributes as UserRole)) {
      return roleFromAttributes as UserRole;
    }
    
    return UserRole.UNASSIGNED;
  }

  /**
   * Get user status from database or default
   * @param user - User entity (if exists)
   * @param userAttributes - User attributes from event
   * @returns User account status
   */
  private getUserStatus(user: User | null, userAttributes: Record<string, string | undefined>): UserAccountStatus {
    if (user) {
      return user.getStatus();
    }
    
    // Default to ACTIVE for new users
    return UserAccountStatus.ACTIVE;
  }

  /**
   * Get custom MFA requirement from attributes
   * @param userAttributes - User attributes from event
   * @returns Custom MFA requirement or undefined
   */
  private getCustomMfaRequired(userAttributes: Record<string, string | undefined>): boolean | undefined {
    const customMfaRequired = userAttributes['custom:is_mfa_required'];
    if (customMfaRequired === 'true') return true;
    if (customMfaRequired === 'false') return false;
    return undefined;
  }

  /**
   * Get allow pending verification configuration
   * @returns Whether to allow PENDING_VERIFICATION status
   */
  private getAllowPendingVerificationConfig(): boolean {
    // TODO: Get from AppConfig when extended
    return true; // Default to allowing PENDING_VERIFICATION
  }

  /**
   * Log successful validation for telemetry
   * @param cognitoSub - Cognito user sub
   * @param user - User entity (if exists)
   * @param mfaSettings - MFA settings from Cognito
   */
  private logValidationSuccess(
    cognitoSub: string, 
    user: User | null, 
    mfaSettings: CognitoMfaSettings
  ) {
    console.log('PreAuthentication validation successful', {
      cognitoSub,
      userId: user?.getId().toString(),
      role: user?.getRole(),
      status: user?.getStatus(),
      mfaEnabled: mfaSettings.mfaEnabled,
      mfaRequired: mfaSettings.isMfaRequiredAttr
    });
  }
}
