/**
 * @fileoverview CognitoService Mock - Mock implementation for CognitoService
 * @summary Provides mock implementations for CognitoService methods
 * @description Reusable mock factory for CognitoService in unit tests
 */

import { jest } from '@jest/globals';
import type { CognitoService } from '../../../../src/services/CognitoService';
import type { CognitoMfaSettings, ProviderIdentity } from '../../../../src/domain/interfaces';
import { OAuthProvider } from '../../../../src/domain/enums/OAuthProvider';

/**
 * @description Creates a mock CognitoService with all methods mocked.
 * @returns {jest.Mocked<CognitoService>} Mocked CognitoService instance
 */
export function createMockCognitoService(): jest.Mocked<CognitoService> {
  return {
    adminGetUser: jest.fn(),
    parseMfaSettings: jest.fn(),
    parseAdminUser: jest.fn(),
    linkProviderForUser: jest.fn(),
    unlinkProviderFromUser: jest.fn(),
    enableUser: jest.fn(),
    disableUser: jest.fn(),
    globalSignOut: jest.fn(),
    updateUserAttributes: jest.fn()
  } as unknown as jest.Mocked<CognitoService>;
}

/**
 * @description Creates a mock CognitoMfaSettings.
 * @param {Partial<CognitoMfaSettings>} overrides - Properties to override
 * @returns {CognitoMfaSettings} Mock MFA settings
 */
export function createMockMfaSettings(overrides: Partial<CognitoMfaSettings> = {}): CognitoMfaSettings {
  return {
    mfaEnabled: false,
    isMfaRequiredAttr: false,
    ...overrides
  };
}

/**
 * @description Creates a mock ProviderIdentity.
 * @param {Partial<ProviderIdentity>} overrides - Properties to override
 * @returns {ProviderIdentity} Mock provider identity
 */
export function createMockProviderIdentity(overrides: Partial<ProviderIdentity> = {}): ProviderIdentity {
  return {
    provider: OAuthProvider.GOOGLE,
    providerAccountId: 'provider-user-id-123',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides
  };
}

