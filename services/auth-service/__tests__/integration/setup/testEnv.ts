/**
 * @fileoverview testEnv - Test environment helpers
 * @summary Common utilities and factories for integration tests
 * @description Provides shared utilities, database helpers, and test data
 * factories for integration tests across all test suites.
 */

import { PrismaClient } from '@prisma/client';
import { UserRole, UserAccountStatus } from '../../../src/domain/enums';

/**
 * Test environment configuration
 */
export interface TestEnvConfig {
  databaseUrl: string;
  logLevel: string;
}

/**
 * Creates a PrismaClient instance for tests
 * @param config - Test environment configuration
 * @returns Configured PrismaClient instance
 */
export function createTestPrismaClient(config: TestEnvConfig): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: config.databaseUrl
      }
    },
    log: config.logLevel === 'debug' ? ['query', 'info', 'warn', 'error'] : ['error']
  });
}

/**
 * Creates a test logger instance
 * @param context - Logger context
 * @returns Configured Logger instance
 */
export function createTestLogger(_context: string): any {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn()
  };
}

/**
 * Test data factory for creating users
 */
export class TestUserFactory {
  /**
   * Creates a base user data object for tests
   * @param overrides - Optional overrides for default values
   * @returns User data object
   */
  static createUserData(overrides: Partial<{
    id: string;
    cognitoSub: string;
    email: string;
    name: string;
    givenName: string;
    lastName: string;
    role: UserRole;
    status: UserAccountStatus;
    mfaEnabled: boolean;
  }> = {}) {
    const timestamp = new Date();
    
    return {
      id: overrides.id || 'test-user-id',
      cognitoSub: overrides.cognitoSub || 'test-cognito-sub',
      email: overrides.email || 'test@example.com',
      name: overrides.name || 'Test User',
      givenName: overrides.givenName || 'Test',
      lastName: overrides.lastName || 'User',
      role: overrides.role || UserRole.CUSTOMER,
      status: overrides.status || UserAccountStatus.ACTIVE,
      mfaEnabled: overrides.mfaEnabled || false,
      lastLoginAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }

  /**
   * Creates personal info data for tests
   * @param overrides - Optional overrides for default values
   * @returns Personal info data object
   */
  static createPersonalInfoData(overrides: Partial<{
    phone: string;
    locale: string;
    timeZone: string;
  }> = {}) {
    const timestamp = new Date();
    
    return {
      id: 'test-personal-info-id',
      userId: 'test-user-id',
      phone: overrides.phone || '+50688887777',
      locale: overrides.locale || 'es-CR',
      timeZone: overrides.timeZone || 'America/Costa_Rica',
      createdAt: timestamp,
      updatedAt: timestamp
    };
  }
}

/**
 * Test authentication context factory
 */
export class TestAuthFactory {
  /**
   * Creates authentication context for tests
   * @param overrides - Optional overrides for default values
   * @returns Authentication context
   */
  static createAuthContext(overrides: Partial<{
    sub: string;
    email: string;
    role: string;
    userId: string;
  }> = {}) {
    return {
      sub: overrides.sub || 'test-cognito-sub',
      email: overrides.email || 'test@example.com',
      role: overrides.role || 'CUSTOMER',
      userId: overrides.userId || 'test-user-id'
    };
  }
}

/**
 * Test environment configuration loader
 * @returns Test environment configuration
 */
export function loadTestConfig(): TestEnvConfig {
  return {
    databaseUrl: process.env.DATABASE_URL || '',
    logLevel: process.env.LOG_LEVEL || 'silent'
  };
}
