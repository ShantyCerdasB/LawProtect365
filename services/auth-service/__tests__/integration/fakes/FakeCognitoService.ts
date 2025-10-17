/**
 * @fileoverview FakeCognitoService - Mock Cognito service for integration tests
 * @summary In-memory mock of CognitoService for testing
 * @description Provides a mock implementation of CognitoService that simulates
 * Cognito operations without requiring actual AWS Cognito.
 */

import { CognitoService } from '../../../src/services/CognitoService';

/**
 * Fake Cognito service implementation for testing
 * 
 * This mock simulates Cognito operations in memory, allowing tests to:
 * - Test authentication flows without real Cognito
 * - Simulate different user states
 * - Test error scenarios
 */
export class FakeCognitoService implements Partial<CognitoService> {
  private users: Map<string, any> = new Map();
  private shouldFail = false;
  private failureReason = '';

  /**
   * Sets up a user in the fake Cognito
   * @param cognitoSub - Cognito sub
   * @param userData - User data
   */
  setupUser(cognitoSub: string, userData: {
    email?: string;
    givenName?: string;
    familyName?: string;
    mfaEnabled?: boolean;
    status?: string;
  }): void {
    this.users.set(cognitoSub, {
      cognitoSub,
      email: userData.email || 'test@example.com',
      givenName: userData.givenName || 'Test',
      familyName: userData.familyName || 'User',
      mfaEnabled: userData.mfaEnabled || false,
      status: userData.status || 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Simulates a Cognito operation failure
   * @param reason - Reason for failure
   */
  simulateFailure(reason: string): void {
    this.shouldFail = true;
    this.failureReason = reason;
  }

  /**
   * Clears the failure simulation
   */
  clearFailure(): void {
    this.shouldFail = false;
    this.failureReason = '';
  }

  /**
   * Gets a user by Cognito sub
   * @param cognitoSub - Cognito sub
   * @returns User data or null
   */
  async adminGetUser(cognitoSub: string): Promise<any> {
    if (this.shouldFail) {
      throw new Error(this.failureReason);
    }

    const user = this.users.get(cognitoSub);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      Username: cognitoSub,
      UserAttributes: [
        { Name: 'email', Value: user.email },
        { Name: 'given_name', Value: user.givenName },
        { Name: 'family_name', Value: user.familyName },
        { Name: 'custom:is_mfa_required', Value: user.mfaEnabled ? 'true' : 'false' }
      ],
      UserStatus: user.status,
      MFAOptions: user.mfaEnabled ? [{ DeliveryMedium: 'SMS', AttributeName: 'phone_number' }] : [],
      PreferredMfaSetting: user.mfaEnabled ? 'SMS' : 'NOMFA'
    };
  }

  /**
   * Enables a user in Cognito
   * @param cognitoSub - Cognito sub
   */
  async adminEnableUser(cognitoSub: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error(this.failureReason);
    }

    const user = this.users.get(cognitoSub);
    if (!user) {
      throw new Error('User not found');
    }

    user.status = 'CONFIRMED';
    user.updatedAt = new Date().toISOString();
  }

  /**
   * Disables a user in Cognito
   * @param cognitoSub - Cognito sub
   */
  async adminDisableUser(cognitoSub: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error(this.failureReason);
    }

    const user = this.users.get(cognitoSub);
    if (!user) {
      throw new Error('User not found');
    }

    user.status = 'UNCONFIRMED';
    user.updatedAt = new Date().toISOString();
  }

  /**
   * Performs global sign out for a user
   * @param cognitoSub - Cognito sub
   */
  async adminUserGlobalSignOut(cognitoSub: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error(this.failureReason);
    }

    const user = this.users.get(cognitoSub);
    if (!user) {
      throw new Error('User not found');
    }

    // In a real implementation, this would invalidate all sessions
    user.updatedAt = new Date().toISOString();
  }

  /**
   * Clears all fake users
   */
  clear(): void {
    this.users.clear();
    this.clearFailure();
  }

  /**
   * Gets all fake users
   * @returns Array of all users
   */
  getAllUsers(): any[] {
    return Array.from(this.users.values());
  }

  /**
   * Gets a user by Cognito sub
   * @param cognitoSub - Cognito sub
   * @returns User data or undefined
   */
  getUser(cognitoSub: string): any | undefined {
    return this.users.get(cognitoSub);
  }
}
