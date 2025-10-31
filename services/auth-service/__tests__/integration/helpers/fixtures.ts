/**
 * @fileoverview fixtures - Test data factories and builders
 * @summary Builders for creating test users and profile data
 * @description Provides factories for creating test users, personal info,
 * and authentication contexts for integration tests.
 */

import { PrismaClient } from '@prisma/client';
import { UserRole } from '../../../src/domain/enums/UserRole';
import { UserAccountStatus } from '../../../src/domain/enums/UserAccountStatus';
import { OAuthProvider } from '../../../src/domain/enums/OAuthProvider';
import { uuid } from '@lawprotect/shared-ts';

/**
 * User with profile data for testing
 */
export interface UserWithProfile {
  user: any;
  personalInfo?: any;
  accessTokenLike: {
    sub: string;
    email: string;
    role: string;
    userId: string;
  };
}

/**
 * Creates a user with profile data for testing
 * @param prisma - Prisma client instance
 * @param options - User creation options
 * @returns User with profile data and access token
 */
export async function createUserWithProfile(
  prisma: PrismaClient,
  options: {
    role?: UserRole;
    status?: UserAccountStatus;
    personalInfo?: {
      phone?: string;
      locale?: string;
      timeZone?: string;
    };
    cognitoSub?: string;
    email?: string;
    name?: string;
    givenName?: string;
    lastName?: string;
  } = {}
): Promise<UserWithProfile> {
  const userId = uuid();
  const cognitoSub = options.cognitoSub || `test-cognito-${userId}`;
  const email = options.email || `test-${Date.now()}@example.com`;
  
  // Create user
  const user = await prisma.user.create({
    data: {
      id: userId,
      cognitoSub,
      email,
      name: options.name || 'Test User',
      givenName: options.givenName || 'Test',
      lastName: options.lastName || 'User',
      role: (options.role ?? UserRole.CUSTOMER) as any,
      status: (options.status ?? UserAccountStatus.ACTIVE) as any,
      mfaEnabled: false,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    } as any
  });

  // Create personal info if provided
  let personalInfo;
  if (options.personalInfo) {
    personalInfo = await (prisma as any).userPersonalInfo.create({
      data: {
        id: uuid(),
        userId,
        phone: options.personalInfo.phone || null,
        locale: options.personalInfo.locale || null,
        timeZone: options.personalInfo.timeZone || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  return {
    user,
    personalInfo,
    accessTokenLike: {
      sub: cognitoSub,
      email,
      role: options.role || UserRole.CUSTOMER,
      userId
    }
  };
}

/**
 * Creates a user with personal info for testing
 * @param prisma - Prisma client instance
 * @param options - Personal info options
 * @returns User with personal info
 */
export async function createUserWithPersonalInfo(
  prisma: PrismaClient,
  options: {
    phone?: string;
    locale?: string;
    timeZone?: string;
    role?: UserRole;
    status?: UserAccountStatus;
  } = {}
): Promise<UserWithProfile> {
  return createUserWithProfile(prisma, {
    personalInfo: {
      phone: options.phone,
      locale: options.locale,
      timeZone: options.timeZone
    },
    role: options.role,
    status: options.status
  });
}

/**
 * Creates a user in DELETED status for testing
 * @param prisma - Prisma client instance
 * @returns User in DELETED status
 */
export async function createDeletedUser(prisma: PrismaClient): Promise<UserWithProfile> {
  return createUserWithProfile(prisma, {
    status: UserAccountStatus.DELETED
  });
}

/**
 * Creates a user in INACTIVE status for testing
 * @param prisma - Prisma client instance
 * @returns User in INACTIVE status
 */
export async function createInactiveUser(prisma: PrismaClient): Promise<UserWithProfile> {
  return createUserWithProfile(prisma, {
    status: UserAccountStatus.INACTIVE
  });
}

/**
 * Creates a user in SUSPENDED status for testing
 * @param prisma - Prisma client instance
 * @returns User in SUSPENDED status
 */
export async function createSuspendedUser(prisma: PrismaClient): Promise<UserWithProfile> {
  return createUserWithProfile(prisma, {
    status: UserAccountStatus.SUSPENDED
  });
}

/**
 * Creates a user with specific role for testing
 * @param prisma - Prisma client instance
 * @param role - User role
 * @returns User with specified role
 */
export async function createUserWithRole(
  prisma: PrismaClient,
  role: UserRole
): Promise<UserWithProfile> {
  return createUserWithProfile(prisma, { role });
}

/**
 * Creates multiple users for testing
 * @param prisma - Prisma client instance
 * @param count - Number of users to create
 * @param options - User creation options
 * @returns Array of users with profiles
 */
export async function createMultipleUsers(
  prisma: PrismaClient,
  count: number,
  options: {
    role?: UserRole;
    status?: UserAccountStatus;
  } = {}
): Promise<UserWithProfile[]> {
  const users: UserWithProfile[] = [];
  
  for (let i = 0; i < count; i++) {
    const user = await createUserWithProfile(prisma, {
      ...options,
      email: `test-${i}-${Date.now()}@example.com`,
      cognitoSub: `test-cognito-${i}-${Date.now()}`
    });
    users.push(user);
  }
  
  return users;
}

/**
 * Creates a user with specific personal info for testing
 * @param prisma - Prisma client instance
 * @param personalInfo - Personal info data
 * @returns User with specific personal info
 */
export async function createUserWithSpecificPersonalInfo(
  prisma: PrismaClient,
  personalInfo: {
    phone: string;
    locale: string;
    timeZone: string;
  }
): Promise<UserWithProfile> {
  return createUserWithProfile(prisma, { personalInfo });
}

/**
 * Creates a user with invalid data for testing validation
 * @param prisma - Prisma client instance
 * @param invalidData - Invalid data to test
 * @returns User with invalid data
 */
export async function createUserWithInvalidData(
  prisma: PrismaClient,
  invalidData: {
    phone?: string;
    locale?: string;
    timeZone?: string;
  }
): Promise<UserWithProfile> {
  return createUserWithProfile(prisma, {
    personalInfo: invalidData
  });
}

/**
 * Creates an OAuth account linked to a user
 * @param prisma - Prisma client instance
 * @param userId - User ID to link the account to
 * @param options - OAuth account options
 * @returns Created OAuth account
 */
export async function createOAuthAccount(
  prisma: PrismaClient,
  userId: string,
  options: {
    provider: OAuthProvider;
    providerAccountId?: string; // Make optional
  }
) {
  // Use the provided providerAccountId or generate a unique one
  const timestamp = process.hrtime.bigint().toString();
  const { randomBytes } = require('node:crypto');
  const finalProviderAccountId = options.providerAccountId || 
    `${options.provider.toLowerCase()}-account-${timestamp}-${randomBytes(3).toString('hex')}`;

  return await prisma.oAuthAccount.create({
    data: {
      id: uuid(),
      userId: userId,
      provider: options.provider,
      providerAccountId: finalProviderAccountId,
      createdAt: new Date()
    }
  });
}

/**
 * Creates a user with linked OAuth accounts
 * @param prisma - Prisma client instance
 * @param options - User and OAuth account options
 * @returns User with linked OAuth accounts
 */
export async function createUserWithLinkedProviders(
  prisma: PrismaClient,
  options: {
    role?: UserRole;
    status?: UserAccountStatus;
    providers?: Array<{
      provider: OAuthProvider;
      providerAccountId: string;
    }>;
  } = {}
): Promise<UserWithProfile & { oauthAccounts: any[] }> {
  const userWithProfile = await createUserWithProfile(prisma, {
    role: options.role,
    status: options.status
  });

  const oauthAccounts: any[] = [];
  if (options.providers) {
    for (const providerInfo of options.providers) {
      const oauthAccount = await createOAuthAccount(prisma, userWithProfile.user.id, {
        provider: providerInfo.provider,
        providerAccountId: providerInfo.providerAccountId
      });
      oauthAccounts.push(oauthAccount);
    }
  }

  return {
    ...userWithProfile,
    oauthAccounts
  };
}
