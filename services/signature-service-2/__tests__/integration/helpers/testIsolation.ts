/**
 * @file testIsolation.ts
 * @summary Test isolation utilities for parallel test execution
 * @description Provides unique data generation for each test to avoid conflicts
 */

import { randomUUID } from 'crypto';

/**
 * Test isolation context - generates unique data for each test
 */
export class TestIsolation {
  private readonly testId: string;
  private readonly timestamp: number;

  constructor() {
    this.testId = randomUUID();
    this.timestamp = Date.now();
  }

  /**
   * Generate unique user ID for this test
   */
  generateUserId(): string {
    return `user-${this.testId}-${this.timestamp}`;
  }

  /**
   * Generate unique email for this test
   */
  generateEmail(prefix: string = 'test'): string {
    return `${prefix}-${this.testId}@test.com`;
  }

  /**
   * Generate unique envelope ID for this test
   */
  generateEnvelopeId(): string {
    return `envelope-${this.testId}`;
  }

  /**
   * Generate unique party ID for this test
   */
  generatePartyId(): string {
    return `party-${this.testId}`;
  }

  /**
   * Generate unique document ID for this test
   */
  generateDocumentId(): string {
    return `document-${this.testId}`;
  }

  /**
   * Generate unique consent ID for this test
   */
  generateConsentId(): string {
    return `consent-${this.testId}`;
  }

  /**
   * Generate unique invitation token for this test
   */
  generateInvitationToken(): string {
    return `token-${this.testId}`;
  }

  /**
   * Get test context info for debugging
   */
  getTestInfo(): { testId: string; timestamp: number } {
    return {
      testId: this.testId,
      timestamp: this.timestamp
    };
  }
}

/**
 * Create a new test isolation context
 */
export const createTestIsolation = (): TestIsolation => {
  return new TestIsolation();
};

/**
 * Generate unique test data for parallel execution
 */
export const generateUniqueTestData = async () => {
  const isolation = createTestIsolation();
  
  // Import generateTestJwtToken dynamically to avoid circular imports
  const { generateTestJwtToken } = await import('./testHelpers');
  
  return {
    owner: {
      userId: isolation.generateUserId(),
      email: isolation.generateEmail('owner'),
      token: await generateTestJwtToken({
        sub: isolation.generateUserId(),
        email: isolation.generateEmail('owner'),
        roles: ['customer'], // Cognito role
        scopes: []
      })
    },
    invitedUser: {
      userId: isolation.generateUserId(),
      email: isolation.generateEmail('invited'),
      token: await generateTestJwtToken({
        sub: isolation.generateUserId(),
        email: isolation.generateEmail('invited'),
        roles: ['customer'], // Cognito role
        scopes: []
      })
    },
    envelope: {
      id: isolation.generateEnvelopeId(),
      name: `Test Contract ${isolation.getTestInfo().testId}`,
      description: `Test description for ${isolation.getTestInfo().testId}`
    },
    party: {
      id: isolation.generatePartyId(),
      email: isolation.generateEmail('party')
    },
    document: {
      id: isolation.generateDocumentId()
    },
    consent: {
      id: isolation.generateConsentId()
    },
    invitation: {
      token: isolation.generateInvitationToken()
    }
  };
};
