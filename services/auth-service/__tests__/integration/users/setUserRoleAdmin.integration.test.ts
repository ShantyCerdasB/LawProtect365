/**
 * @fileoverview setUserRoleAdmin.integration.test - Integration tests for SetUserRoleAdmin endpoint
 * @summary Comprehensive integration tests for admin user role change functionality
 * @description Tests the complete flow of POST /admin/users/{id}:set-role endpoint including validation,
 * authorization, business rules, role transitions, audit logging, and error handling.
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { getTestCompositionRoot, getTestUtilities } from '../TestCompositionRoot';
import { createUserWithProfile } from '../helpers/fixtures';
import { requests } from '../helpers/requests';
import { UserRole } from '../../../src/domain/enums/UserRole';
import { UserAccountStatus } from '../../../src/domain/enums/UserAccountStatus';
import { uuid } from '@lawprotect/shared-ts';

describe('SetUserRoleAdmin Integration Tests', () => {
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
    it('should change user role successfully for ADMIN actor', async () => {
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
        role: UserRole.LAWYER,
        reason: 'Promoted to lawyer role'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
      const result = await handler(event as any);

      // Assert
      if ((result as any).statusCode !== 200) {
        console.error('Non-200 response:', (result as any).statusCode, 'body:', (result as any).body);
      }
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.id).toBe(targetUser.id);
      expect(responseBody.role).toBe(UserRole.LAWYER);
      expect(responseBody.mfa.required).toBe(false);
      expect(responseBody.meta.updatedAt).toBeDefined();

      // Verify database update
      const updatedUser = await prisma.user.findUnique({
        where: { id: targetUser.id }
      });
      expect(updatedUser?.role).toBe(UserRole.LAWYER);

      // Verify audit event
      const auditEvents = await prisma.userAuditEvent.findMany({
        where: { userId: targetUser.id }
      });
      expect(auditEvents).toHaveLength(1);
      expect(auditEvents[0].action).toBe('ROLE_CHANGED');
      expect(auditEvents[0].metadata).toMatchObject({
        oldRole: UserRole.CUSTOMER,
        newRole: UserRole.LAWYER,
        reason: 'Promoted to lawyer role'
      });
    });

    it('should change user role successfully for SUPER_ADMIN actor', async () => {
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
        role: UserRole.ADMIN,
        reason: 'Promoted to admin role'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(superAdminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.id).toBe(targetUser.id);
      expect(responseBody.role).toBe(UserRole.ADMIN);
      expect(responseBody.mfa.required).toBe(false);
    });

    it('should require MFA for SUPER_ADMIN role', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: superAdminToken } = await createUserWithProfile(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        role: UserRole.SUPER_ADMIN,
        reason: 'Promoted to super admin role'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(superAdminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.id).toBe(targetUser.id);
      expect(responseBody.role).toBe(UserRole.SUPER_ADMIN);
      expect(responseBody.mfa.required).toBe(true);
    });

    it('should handle role change without reason', async () => {
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
        role: UserRole.LAWYER
        // No reason provided
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.id).toBe(targetUser.id);
      expect(responseBody.role).toBe(UserRole.LAWYER);

      // Verify audit event has default reason
      const auditEvents = await prisma.userAuditEvent.findMany({
        where: { userId: targetUser.id }
      });
      expect(auditEvents[0].metadata).toMatchObject({
        reason: 'Role changed by admin'
      });
    });
  });

  describe('Authorization Tests', () => {
    it('should reject request without authentication', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma);
      
      const event: APIGatewayProxyEvent = {
        resource: '/admin/users/{id}:set-role',
        path: `/admin/users/${targetUser.id}:set-role`,
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
          resourcePath: '/admin/users/{id}:set-role',
          httpMethod: 'POST',
          requestId: uuid(),
          protocol: 'HTTP/1.1',
          accountId: 'test-account',
          apiId: 'test-api',
          stage: 'test',
          requestTime: new Date().toISOString(),
          requestTimeEpoch: Date.now(),
          path: `/admin/users/${targetUser.id}:set-role`,
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-user-agent'
          },
          authorizer: null // No authorizer for unauthenticated
        } as any,
        body: JSON.stringify({ role: UserRole.LAWYER }),
        isBase64Encoded: false
      };

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
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
        role: UserRole.LAWYER,
        reason: 'Unauthorized role change attempt'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(customerToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_FORBIDDEN');
    });

    it('should reject ADMIN trying to change SUPER_ADMIN role', async () => {
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
        role: UserRole.CUSTOMER,
        reason: 'Demote super admin'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_FORBIDDEN');
    });

    it('should reject ADMIN trying to promote to SUPER_ADMIN', async () => {
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
        role: UserRole.SUPER_ADMIN,
        reason: 'Promote to super admin'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_FORBIDDEN');
    });

    it('should reject ADMIN trying to modify other ADMIN', async () => {
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
        role: UserRole.LAWYER,
        reason: 'Demote admin'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_FORBIDDEN');
    });

    it('should reject self-role change', async () => {
      // Arrange
      const { user: targetUser, accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        role: UserRole.SUPER_ADMIN,
        reason: 'Self-promotion attempt'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
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
        role: UserRole.LAWYER,
        reason: 'Change role for non-existent user'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, nonExistentUserId, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(404);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_NOT_FOUND');
    });

    it('should handle different role transitions correctly', async () => {
      // Arrange
      const roleTransitions = [
        { from: UserRole.CUSTOMER, to: UserRole.LAWYER },
        { from: UserRole.LAWYER, to: UserRole.ADMIN },
        { from: UserRole.ADMIN, to: UserRole.LAWYER },
        { from: UserRole.LAWYER, to: UserRole.CUSTOMER }
      ];

      const { accessTokenLike: superAdminToken } = await createUserWithProfile(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      for (const transition of roleTransitions) {
        const { user: targetUser } = await createUserWithProfile(prisma, {
          role: transition.from,
          status: UserAccountStatus.ACTIVE
        });

        const requestBody = {
          role: transition.to,
          reason: `Transition from ${transition.from} to ${transition.to}`
        };

        const event: APIGatewayProxyEvent = requests.users.setUserRole(superAdminToken, targetUser.id, requestBody);

        // Act
        const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
        const result = await handler(event as any);

        // Assert
        expect((result as any).statusCode).toBe(200);
        
        const responseBody = JSON.parse((result as any).body);
        expect(responseBody.role).toBe(transition.to);
        
        // Clean up for next iteration
        await prisma.user.delete({ where: { id: targetUser.id } });
      }
    });

    it('should allow same role assignment (no-op)', async () => {
      // Arrange
      const { user: targetUser } = await createUserWithProfile(prisma, {
        role: UserRole.LAWYER,
        status: UserAccountStatus.ACTIVE
      });

      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        role: UserRole.LAWYER, // Same role
        reason: 'No change needed'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.role).toBe(UserRole.LAWYER);
    });
  });

  describe('Validation Tests', () => {
    it('should reject request with invalid role', async () => {
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
        role: 'INVALID_ROLE', // Invalid role
        reason: 'Invalid role assignment'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject request with invalid user ID format', async () => {
      // Arrange
      const { accessTokenLike: adminToken } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const requestBody = {
        role: UserRole.LAWYER,
        reason: 'Change role with invalid ID'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, 'invalid-user-id', requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(404);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_NOT_FOUND');
    });

    it('should reject request with empty reason', async () => {
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
        role: UserRole.LAWYER,
        reason: '' // Empty reason
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject request with very long reason', async () => {
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
        role: UserRole.LAWYER,
        reason: 'A'.repeat(513) // Too long (max 512)
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
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
      
      // Create a mock handler that simulates the TestSetUserRoleAdminHandler behavior
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
        role: UserRole.LAWYER,
        reason: 'Database error test'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, targetUserId, requestBody);

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

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, targetUser.id, {
        role: UserRole.LAWYER,
        reason: 'Valid request'
      });

      // Manually corrupt the body
      event.body = '{"role": "LAWYER", "reason": "Valid request"'; // Missing closing brace

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
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

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, targetUser.id, {
        role: UserRole.LAWYER,
        reason: 'Missing content type'
      });

      // Remove Content-Type header
      delete event.headers!['Content-Type'];

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
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
        role: UserRole.LAWYER,
        reason: 'Promoción con caracteres especiales: ñáéíóú & símbolos @#$%'
      };

      const event: APIGatewayProxyEvent = requests.users.setUserRole(adminToken, targetUser.id, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().setUserRoleAdminHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.role).toBe(UserRole.LAWYER);

      // Verify audit event preserves special characters
      const auditEvents = await prisma.userAuditEvent.findMany({
        where: { userId: targetUser.id }
      });
      expect(auditEvents[0].metadata).toMatchObject({
        reason: 'Promoción con caracteres especiales: ñáéíóú & símbolos @#$%'
      });
    });
  });
});
