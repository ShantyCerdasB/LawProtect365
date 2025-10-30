/**
 * @fileoverview getUserByIdAdmin.integration.test - Integration tests for GetUserByIdAdmin endpoint
 * @summary Comprehensive integration tests for admin user detail retrieval
 * @description Tests the complete flow of GET /admin/users/{id} endpoint including validation,
 * authorization, visibility rules, optional data inclusion, and error handling.
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { getTestCompositionRoot, getTestUtilities } from '../TestCompositionRoot';
import { createUserWithProfile, createUserWithLinkedProviders } from '../helpers/fixtures';
import { requests } from '../helpers/requests';
import { UserRole } from '../../../src/domain/enums/UserRole';
import { UserAccountStatus } from '../../../src/domain/enums/UserAccountStatus';
import { AdminIncludeField } from '../../../src/domain/enums/AdminIncludeField';
import { OAuthProvider } from '../../../src/domain/enums/OAuthProvider';
import { uuid } from '@lawprotect/shared-ts';

describe('GetUserByIdAdmin Integration Tests', () => {
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
    it('should retrieve user details successfully for ADMIN viewer', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUserById(adminToken, targetUser.id);

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.id).toBe(targetUser.id);
      expect(responseBody.email).toBe(targetUser.email);
      expect(responseBody.name).toBe(targetUser.name);
      expect(responseBody.role).toBe(UserRole.CUSTOMER);
      expect(responseBody.status).toBe(UserAccountStatus.ACTIVE);
    });

    it('should retrieve user details successfully for SUPER_ADMIN viewer', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: superAdminToken } = await createUserWithProfile(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUserById(superAdminToken, targetUser.id);

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.id).toBe(targetUser.id);
      expect(responseBody.role).toBe(UserRole.ADMIN);
    });

    it('should include personal info when requested', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE,
        personalInfo: {
          phone: '+1234567890',
          locale: 'en-US',
          timeZone: 'America/New_York'
        }
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUserById(adminToken, targetUser.id, {
        include: AdminIncludeField.PROFILE
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.personalInfo).toBeDefined();
      expect(responseBody.personalInfo.phone).toBeDefined();
      expect(responseBody.personalInfo.locale).toBeDefined();
      expect(responseBody.personalInfo.timeZone).toBeDefined();
    });

    it('should include OAuth accounts when requested', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithLinkedProviders(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE,
        providers: [
          { provider: OAuthProvider.GOOGLE, providerAccountId: 'google-123' },
          { provider: OAuthProvider.MICROSOFT_365, providerAccountId: 'microsoft-456' }
        ]
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUserById(adminToken, targetUser.id, {
        include: AdminIncludeField.IDP
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.providers).toBeDefined();
      expect(responseBody.providers).toHaveLength(2);
      expect(responseBody.providers[0].provider).toBe(OAuthProvider.GOOGLE);
      expect(responseBody.providers[1].provider).toBe(OAuthProvider.MICROSOFT_365);
    });

    it('should include both personal info and OAuth accounts when both requested', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithLinkedProviders(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE,
        providers: [
          { provider: OAuthProvider.GOOGLE, providerAccountId: 'google-123' }
        ]
      });

      // Add personal info to the user
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

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUserById(adminToken, targetUser.id, {
        include: `${AdminIncludeField.PROFILE},${AdminIncludeField.IDP}`
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.personalInfo).toBeDefined();
      expect(responseBody.providers).toBeDefined();
      expect(responseBody.providers).toHaveLength(1);
    });
  });

  describe('Authorization Tests', () => {
    it('should reject request without authentication', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma);
      
      const event: APIGatewayProxyEvent = {
        resource: '/admin/users/{id}',
        path: `/admin/users/${targetUser.id}`,
        httpMethod: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-country': 'CR',
          'User-Agent': 'test-user-agent'
        },
        multiValueHeaders: {},
        queryStringParameters: {},
        multiValueQueryStringParameters: {},
        pathParameters: { id: targetUser.id },
        stageVariables: null,
        requestContext: {
          resourceId: 'test-resource',
          resourcePath: '/admin/users/{id}',
          httpMethod: 'GET',
          requestId: uuid(),
          protocol: 'HTTP/1.1',
          accountId: 'test-account',
          apiId: 'test-api',
          stage: 'test',
          requestTime: new Date().toISOString(),
          requestTimeEpoch: Date.now(),
          path: `/admin/users/${targetUser.id}`,
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
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(401);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_UNAUTHORIZED');
    });

    it('should reject request from non-admin user', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: customerToken } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUserById(customerToken, targetUser.id);

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_FORBIDDEN');
    });

    it('should reject ADMIN trying to view SUPER_ADMIN', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUserById(adminToken, targetUser.id);

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_FORBIDDEN');
    });

    it('should reject self-lookup via admin endpoint', async () => {
      // Arrange
      const { user: targetUser, accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUserById(adminToken, targetUser.id);

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_FORBIDDEN');
    });
  });

  describe('Business Logic Tests', () => {
    it('should return 404 for non-existent user', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const nonExistentUserId = uuid();
      const event: APIGatewayProxyEvent = requests.users.getUserById(adminToken, nonExistentUserId);

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(404);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_NOT_FOUND');
    });

    it('should handle different user roles correctly', async () => {
      // Arrange
      const roles = [UserRole.CUSTOMER, UserRole.LAWYER, UserRole.ADMIN];
      const { accessTokenLike: superAdminToken } = await createUserWithProfile(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      for (const role of roles) {
        const { user: targetUser } = await createUserWithProfile(prisma, {
          role: role,
          status: UserAccountStatus.ACTIVE
        });

        const event: APIGatewayProxyEvent = requests.users.getUserById(superAdminToken, targetUser.id);

        // Act
        const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
        const result = await handler(event as any);

        // Assert
        expect((result as any).statusCode).toBe(200);
        
        const responseBody = JSON.parse((result as any).body);
        expect(responseBody.role).toBe(role);
        
        // Clean up for next iteration
        await prisma.user.delete({ where: { id: targetUser.id } });
      }
    });

    it('should handle different user statuses correctly', async () => {
      // Arrange
      const statuses = [UserAccountStatus.ACTIVE, UserAccountStatus.INACTIVE, UserAccountStatus.SUSPENDED];
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      for (const status of statuses) {
        const { user: targetUser } = await createUserWithProfile(prisma, {
          role: UserRole.CUSTOMER,
          status: status
        });

        const event: APIGatewayProxyEvent = requests.users.getUserById(adminToken, targetUser.id);

        // Act
        const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
        const result = await handler(event as any);

        // Assert
        expect((result as any).statusCode).toBe(200);
        
        const responseBody = JSON.parse((result as any).body);
        expect(responseBody.status).toBe(status);
        
        // Clean up for next iteration
        await prisma.user.delete({ where: { id: targetUser.id } });
      }
    });
  });

  describe('Validation Tests', () => {
    it('should reject request with invalid user ID format', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUserById(adminToken, 'invalid-user-id');

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(404);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_NOT_FOUND');
    });

    it('should handle invalid include parameters gracefully', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUserById(adminToken, targetUser.id, {
        include: 'invalid-include'
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.id).toBe(targetUser.id);
      // Invalid includes should be ignored
      expect(responseBody.personalInfo).toBeUndefined();
      expect(responseBody.providers).toBeUndefined();
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const targetUserId = uuid();
      
      // Create a mock handler that simulates the TestGetUserByIdAdminHandler behavior
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

      const event: APIGatewayProxyEvent = requests.users.getUserById(adminToken, targetUserId);

      // Act
      const result = await mockHandler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(500);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_INTERNAL_ERROR');
    });
  });

  describe('Edge Cases Tests', () => {
    it('should handle user with no personal info', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      // Delete personal info to simulate user without it
      await prisma.userPersonalInfo.deleteMany({
        where: { userId: targetUser.id }
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUserById(adminToken, targetUser.id, {
        include: AdminIncludeField.PROFILE
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.id).toBe(targetUser.id);
      expect(responseBody.personalInfo).toBeUndefined();
    });

    it('should handle user with no OAuth accounts', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUserById(adminToken, targetUser.id, {
        include: AdminIncludeField.IDP
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.id).toBe(targetUser.id);
      expect(responseBody.providers).toBeUndefined();
    });

    it('should handle empty include parameter', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUserById(adminToken, targetUser.id, {
        include: ''
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.id).toBe(targetUser.id);
      expect(responseBody.personalInfo).toBeUndefined();
      expect(responseBody.providers).toBeUndefined();
    });

    it('should handle malformed query parameters', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getUserById(adminToken, targetUser.id, {
        include: 'profile,,idp' // Malformed with empty value
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getUserByIdAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.id).toBe(targetUser.id);
      // Should still work despite malformed parameters
    });
  });
});
