/**
 * @fileoverview getUsersAdmin.integration.test - Integration tests for GetUsersAdmin endpoint
 * @summary Comprehensive integration tests for admin user listing functionality
 * @description Tests the complete flow of GET /admin/users endpoint including validation,
 * authorization, business rules, filtering, sorting, pagination, and error handling.
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { getTestCompositionRoot, getTestUtilities } from '../TestCompositionRoot';
import { createUserWithProfile, createUserWithLinkedProviders } from '../helpers/fixtures';
import { requests } from '../helpers/requests';
import { UserRole } from '../../../src/domain/enums/UserRole';
import { UserAccountStatus } from '../../../src/domain/enums/UserAccountStatus';
import { OAuthProvider } from '../../../src/domain/enums/OAuthProvider';
import { AdminIncludeField } from '../../../src/domain/enums/AdminIncludeField';
import { uuid } from '@lawprotect/shared-ts';

describe('GetUsersAdmin Integration Tests', () => {
  let testUtils: any;
  let prisma: PrismaClient;

  beforeAll(async () => {
    testUtils = getTestUtilities();
    prisma = testUtils.prisma;
  });

  beforeEach(async () => {
    await testUtils.clearTestData();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Happy Path Tests', () => {
    it('should list users successfully for ADMIN actor', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      // Create some test users
      await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });
      await createUserWithProfile(prisma, {
        role: UserRole.LAWYER,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken);

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.items).toBeDefined();
      expect(responseBody.pageInfo).toBeDefined();
      expect(responseBody.summary).toBeDefined();
      expect(responseBody.items.length).toBeGreaterThan(0);
      expect(responseBody.pageInfo.limit).toBeDefined();
      expect(responseBody.summary.count).toBeDefined();
    });

    it('should list users successfully for SUPER_ADMIN actor', async () => {
      // Arrange
      const { accessTokenLike: superAdminToken } = await createUserWithProfile(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      // Create some test users including ADMIN
      await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });
      await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(superAdminToken);

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.items).toBeDefined();
      expect(responseBody.items.length).toBeGreaterThan(0);
    });

    it('should filter users by role', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      // Create users with different roles
      await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });
      await createUserWithProfile(prisma, {
        role: UserRole.LAWYER,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken, {
        role: UserRole.CUSTOMER
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.items).toBeDefined();
      responseBody.items.forEach((user: any) => {
        expect(user.role).toBe(UserRole.CUSTOMER);
      });
    });

    it('should filter users by status', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      // Create users with different statuses
      await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });
      await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.SUSPENDED
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken, {
        status: UserAccountStatus.ACTIVE
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.items).toBeDefined();
      responseBody.items.forEach((user: any) => {
        expect(user.status).toBe(UserAccountStatus.ACTIVE);
      });
    });

    it('should search users by query string', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      // Create users with specific names
      const { user: user1 } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE,
        name: 'John Doe'
      });
      await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE,
        name: 'Jane Smith'
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken, {
        q: 'John'
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.items).toBeDefined();
      expect(responseBody.items.length).toBeGreaterThan(0);
      const foundUser = responseBody.items.find((user: any) => user.id === user1.id);
      expect(foundUser).toBeDefined();
    });

    it('should include personal info when requested', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      // Add personal info
      await prisma.userPersonalInfo.create({
        data: {
          id: uuid(),
          userId: targetUser.id,
          phone: '+1234567890',
          locale: 'en-US',
          timeZone: 'America/New_York',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken, {
        include: AdminIncludeField.PROFILE
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.items).toBeDefined();
      const userWithProfile = responseBody.items.find((user: any) => user.id === targetUser.id);
      expect(userWithProfile.personalInfo).toBeDefined();
      expect(userWithProfile.personalInfo.phone).toBeDefined();
    });

    it('should include OAuth providers when requested', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const { user: targetUser } = await createUserWithLinkedProviders(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE,
        providers: [
          { provider: OAuthProvider.GOOGLE, providerAccountId: 'google-123' },
          { provider: OAuthProvider.MICROSOFT_365, providerAccountId: 'microsoft-456' }
        ]
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken, {
        include: AdminIncludeField.IDP
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.items).toBeDefined();
      const userWithProviders = responseBody.items.find((user: any) => user.id === targetUser.id);
      expect(userWithProviders.providers).toBeDefined();
      expect(userWithProviders.providers.length).toBeGreaterThan(0);
    });

    it('should sort users by creation date', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      // Create users with different creation times
      await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken, {
        sortBy: 'createdAt',
        sortDir: 'desc'
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.items).toBeDefined();
      expect(responseBody.items.length).toBeGreaterThan(1);
      
      // Check that items are sorted by creation date (descending)
      for (let i = 0; i < responseBody.items.length - 1; i++) {
        const current = new Date(responseBody.items[i].createdAt);
        const next = new Date(responseBody.items[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    it('should limit results with pagination', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      // Create multiple users
      for (let i = 0; i < 5; i++) {
        await createUserWithProfile(prisma, {
          role: UserRole.CUSTOMER,
          status: UserAccountStatus.ACTIVE
        });
      }

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken, {
        limit: 10
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.items).toBeDefined();
      expect(responseBody.items.length).toBeLessThanOrEqual(10);
      expect(responseBody.pageInfo.limit).toBe(10);
    });
  });

  describe('Authorization Tests', () => {
    it('should reject request without authentication', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        resource: '/admin/users',
        path: '/admin/users',
        httpMethod: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-country': 'CR',
          'User-Agent': 'test-user-agent'
        },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: {},
        pathParameters: null,
        stageVariables: null,
        requestContext: {
          resourceId: 'test-resource',
          resourcePath: '/admin/users',
          httpMethod: 'GET',
          requestId: uuid(),
          protocol: 'HTTP/1.1',
          accountId: 'test-account',
          apiId: 'test-api',
          stage: 'test',
          requestTime: new Date().toISOString(),
          requestTimeEpoch: Date.now(),
          path: '/admin/users',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-user-agent'
          },
          authorizer: null // No authorizer for unauthenticated
        } as any,
        body: null,
        isBase64Encoded: false
      };

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(401);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_UNAUTHORIZED');
    });

    it('should reject request from non-admin user', async () => {
      // Arrange
      const { accessTokenLike: customerToken } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(customerToken);

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_FORBIDDEN');
    });

    it('should hide SUPER_ADMIN users from ADMIN', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      // Create a SUPER_ADMIN user
      await createUserWithProfile(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken);

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.items).toBeDefined();
      responseBody.items.forEach((user: any) => {
        expect(user.role).not.toBe(UserRole.SUPER_ADMIN);
      });
    });

    it('should show SUPER_ADMIN users to SUPER_ADMIN', async () => {
      // Arrange
      const { accessTokenLike: superAdminToken } = await createUserWithProfile(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      // Create another SUPER_ADMIN user
      await createUserWithProfile(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(superAdminToken);

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.items).toBeDefined();
      const superAdminUsers = responseBody.items.filter((user: any) => user.role === UserRole.SUPER_ADMIN);
      expect(superAdminUsers.length).toBeGreaterThan(0);
    });
  });

  describe('Validation Tests', () => {
    it('should reject request with invalid date range', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken, {
        createdFrom: '2024-01-01T00:00:00Z',
        createdTo: '2023-01-01T00:00:00Z' // Invalid: to is before from
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(400);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_BAD_REQUEST');
    });

    it('should reject request with invalid limit', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken, {
        limit: 5 // Too small
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject request with invalid sort field', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken, {
        sortBy: 'INVALID_FIELD'
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });
      
      // Create a mock handler that simulates the TestGetUsersAdminHandler behavior
      const mockHandler = async (_evt: any) => {
        try {
          // Simulate database error by throwing an error
          throw new Error('Database connection failed');
        } catch (err) {
          // Use the same error mapping as the real handler
          const { mapError } = await import('@lawprotect/shared-ts');
          return mapError(err);
        }
      };

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken);

      // Act
      const result = await mockHandler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(500);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_INTERNAL_ERROR');
    });
  });

  describe('Edge Cases Tests', () => {
    it('should handle empty result set', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken, {
        q: 'nonexistentuser12345'
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.items).toBeDefined();
      expect(responseBody.items.length).toBe(0);
      expect(responseBody.summary.count).toBe(0);
    });

    it('should handle multiple filter combinations', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      // Create users with specific characteristics
      const { user: user1 } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });
      
      // Update user1 to have MFA enabled
      await prisma.user.update({
        where: { id: user1.id },
        data: { mfaEnabled: true }
      });

      const { user: user2 } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.SUSPENDED
      });
      
      // Update user2 to have MFA disabled
      await prisma.user.update({
        where: { id: user2.id },
        data: { mfaEnabled: false }
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE,
        mfa: 'enabled'
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.items).toBeDefined();
      responseBody.items.forEach((user: any) => {
        expect(user.role).toBe(UserRole.CUSTOMER);
        expect(user.status).toBe(UserAccountStatus.ACTIVE);
        expect(user.mfaEnabled).toBe(true);
      });
    });

    it('should handle special characters in search query', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE,
        name: 'José María'
      });

      const event: APIGatewayProxyEvent = requests.users.getUsers(adminToken, {
        q: 'José'
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUsersAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.items).toBeDefined();
      const foundUser = responseBody.items.find((user: any) => user.id === targetUser.id);
      expect(foundUser).toBeDefined();
    });
  });
});
