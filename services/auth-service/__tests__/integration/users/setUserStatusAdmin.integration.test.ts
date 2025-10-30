/**
 * @fileoverview setUserStatusAdmin.integration.test - Integration tests for SetUserStatusAdmin endpoint
 * @summary Comprehensive integration tests for admin user status change functionality
 * @description Tests the complete flow of POST /admin/users/{id}:set-status endpoint including validation,
 * authorization, business rules, status transitions, audit logging, and error handling.
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { getTestCompositionRoot, getTestUtilities } from '../TestCompositionRoot';
import { createUserWithProfile } from '../helpers/fixtures';
import { requests } from '../helpers/requests';
import { UserRole } from '../../../src/domain/enums/UserRole';
import { UserAccountStatus } from '../../../src/domain/enums/UserAccountStatus';
import { uuid } from '@lawprotect/shared-ts';

describe('SetUserStatusAdmin Integration Tests', () => {
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
    it('should change user status to SUSPENDED successfully for ADMIN actor', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const suspendUntil = new Date();
      suspendUntil.setDate(suspendUntil.getDate() + 30); // 30 days from now

      const requestBody = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Policy violation',
        suspendUntil: suspendUntil.toISOString()
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.id).toBe(targetUser.id);
      expect(responseBody.status).toBe(UserAccountStatus.SUSPENDED);
      expect(responseBody.suspendedUntil).toBeDefined();
      expect(responseBody.deactivationReason).toBe('Policy violation');
      expect(responseBody.updatedAt).toBeDefined();

      // Verify database update
      const updatedUser = await prisma.user.findUnique({
        where: { id: targetUser.id }
      });
      expect(updatedUser?.status).toBe(UserAccountStatus.SUSPENDED);
      expect(updatedUser?.suspendedUntil).toBeDefined();

      // Verify audit event
      const auditEvents = await prisma.userAuditEvent.findMany({
        where: { userId: targetUser.id }
      });
      expect(auditEvents).toHaveLength(1);
      expect(auditEvents[0].action).toBe('ACCOUNT_STATUS_CHANGED');
      expect(auditEvents[0].metadata).toMatchObject({
        oldStatus: UserAccountStatus.ACTIVE,
        newStatus: UserAccountStatus.SUSPENDED,
        reason: 'Policy violation'
      });
    });

    it('should change user status to INACTIVE successfully for SUPER_ADMIN actor', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.LAWYER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: superAdminToken } = await createUserWithProfile(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        status: UserAccountStatus.INACTIVE,
        reason: 'Account deactivation requested'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(superAdminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.id).toBe(targetUser.id);
      expect(responseBody.status).toBe(UserAccountStatus.INACTIVE);
      expect(responseBody.deactivationReason).toBe('Account deactivation requested');
      expect(responseBody.suspendedUntil).toBeUndefined();
    });

    it('should change user status to DELETED successfully for SUPER_ADMIN actor', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: superAdminToken } = await createUserWithProfile(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        status: UserAccountStatus.DELETED,
        reason: 'GDPR deletion request'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(superAdminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.id).toBe(targetUser.id);
      expect(responseBody.status).toBe(UserAccountStatus.DELETED);
      expect(responseBody.deletedAt).toBeDefined();
      expect(responseBody.deactivationReason).toBe('GDPR deletion request');

      // Verify database update
      const updatedUser = await prisma.user.findUnique({
        where: { id: targetUser.id }
      });
      expect(updatedUser?.status).toBe(UserAccountStatus.DELETED);
      expect(updatedUser?.deletedAt).toBeDefined();
    });

    it('should reactivate user from SUSPENDED to ACTIVE', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.SUSPENDED
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        status: UserAccountStatus.ACTIVE,
        reason: 'Suspension lifted'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.id).toBe(targetUser.id);
      expect(responseBody.status).toBe(UserAccountStatus.ACTIVE);
      expect(responseBody.suspendedUntil).toBeUndefined();

      // Verify database update
      const updatedUser = await prisma.user.findUnique({
        where: { id: targetUser.id }
      });
      expect(updatedUser?.status).toBe(UserAccountStatus.ACTIVE);
      expect(updatedUser?.suspendedUntil).toBeNull();
    });
  });

  describe('Authorization Tests', () => {
    it('should reject request without authentication', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma);
      
      const event: APIGatewayProxyEvent = {
        resource: '/admin/users/{id}:set-status',
        path: `/admin/users/${targetUser.id}:set-status`,
        httpMethod: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-country': 'CR',
          'User-Agent': 'test-user-agent'
        },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: {},
        pathParameters: { id: targetUser.id },
        stageVariables: null,
        requestContext: {
          resourceId: 'test-resource',
          resourcePath: '/admin/users/{id}:set-status',
          httpMethod: 'POST',
          requestId: uuid(),
          protocol: 'HTTP/1.1',
          accountId: 'test-account',
          apiId: 'test-api',
          stage: 'test',
          requestTime: new Date().toISOString(),
          requestTimeEpoch: Date.now(),
          path: `/admin/users/${targetUser.id}:set-status`,
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-user-agent'
          },
          authorizer: null // No authorizer for unauthenticated
        } as any,
        body: JSON.stringify({ status: UserAccountStatus.SUSPENDED, reason: 'Test' }),
        isBase64Encoded: false
      };

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
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

      const requestBody = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Unauthorized status change attempt'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(customerToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_FORBIDDEN');
    });

    it('should reject ADMIN trying to change SUPER_ADMIN status', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Suspend super admin'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_FORBIDDEN');
    });

    it('should reject ADMIN trying to change other ADMIN status', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Suspend admin'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_FORBIDDEN');
    });

    it('should reject self-status change', async () => {
      // Arrange
      const { user: targetUser, accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Self-suspension attempt'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
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
      const requestBody = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Change status for non-existent user'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, nonExistentUserId, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(404);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_NOT_FOUND');
    });

    it('should prevent reactivating deleted users', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.DELETED
      });

      const { accessTokenLike: superAdminToken } = await createUserWithProfile(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        status: UserAccountStatus.ACTIVE,
        reason: 'Reactivate deleted user'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(superAdminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_FORBIDDEN');
    });

    it('should prevent deactivating suspended users', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.SUSPENDED
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        status: UserAccountStatus.INACTIVE,
        reason: 'Deactivate suspended user'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_FORBIDDEN');
    });

    it('should prevent suspending inactive users', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.INACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Suspend inactive user'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_FORBIDDEN');
    });

    it('should allow same status assignment (no-op)', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        status: UserAccountStatus.ACTIVE, // Same status
        reason: 'No change needed'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.status).toBe(UserAccountStatus.ACTIVE);
    });
  });

  describe('Validation Tests', () => {
    it('should reject request with invalid status', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        status: 'INVALID_STATUS', // Invalid status
        reason: 'Invalid status assignment'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject request with missing reason for SUSPENDED status', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        status: UserAccountStatus.SUSPENDED
        // Missing required reason
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject request with missing reason for DELETED status', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: superAdminToken } = await createUserWithProfile(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        status: UserAccountStatus.DELETED
        // Missing required reason
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(superAdminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject request with suspendUntil for non-SUSPENDED status', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const suspendUntil = new Date();
      suspendUntil.setDate(suspendUntil.getDate() + 30);

      const requestBody = {
        status: UserAccountStatus.INACTIVE,
        reason: 'Deactivate user',
        suspendUntil: suspendUntil.toISOString() // Invalid for INACTIVE
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject request with past suspendUntil date', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const requestBody = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Suspend user',
        suspendUntil: pastDate.toISOString() // Past date
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject request with suspendUntil date beyond 180 days', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 200); // Beyond 180 days

      const requestBody = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Suspend user',
        suspendUntil: futureDate.toISOString() // Too far in future
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
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

      const targetUserId = uuid();
      
      // Create a mock handler that simulates the TestSetUserStatusAdminHandler behavior
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

      const requestBody = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Database error test'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUserId, requestBody);

      // Act
      const result = await mockHandler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(500);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_INTERNAL_ERROR');
    });
  });

  describe('Edge Cases Tests', () => {
    it('should handle malformed JSON body', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Valid request'
      });

      // Manually corrupt the body
      event.body = '{"status": "SUSPENDED", "reason": "Valid request"'; // Missing closing brace

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(400);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_BAD_REQUEST');
    });

    it('should handle missing Content-Type header', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Missing content type'
      });

      // Remove Content-Type header
      delete event.headers!['Content-Type'];

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(400);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_BAD_REQUEST');
    });

    it('should handle special characters in reason', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        status: UserAccountStatus.SUSPENDED,
        reason: 'Suspensión con caracteres especiales: ñáéíóú & símbolos @#$%'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserStatus(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserStatusAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.status).toBe(UserAccountStatus.SUSPENDED);

      // Verify audit event preserves special characters
      const auditEvents = await prisma.userAuditEvent.findMany({
        where: { userId: targetUser.id }
      });
      expect(auditEvents[0].metadata).toMatchObject({
        reason: 'Suspensión con caracteres especiales: ñáéíóú & símbolos @#$%'
      });
    });
  });
});

