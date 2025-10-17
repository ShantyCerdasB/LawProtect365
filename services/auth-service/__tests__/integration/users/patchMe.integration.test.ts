/**
 * @fileoverview patchMe.integration.test - Integration tests for PATCH /me endpoint
 * @summary Comprehensive integration tests for user profile updates
 * @description Tests the complete flow of PATCH /me endpoint including validation,
 * business rules, database updates, audit logging, and event publishing.
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { getTestCompositionRoot, getTestUtilities } from '../TestCompositionRoot';
import { createUserWithProfile, createDeletedUser, createInactiveUser, createSuspendedUser } from '../helpers/fixtures';
import { beginWithSavepoint, rollbackToSavepoint, TransactionContext } from '../helpers/prismaUtils';
import { requests } from '../helpers/requests';
import { 
  assertUserUpdated, 
  assertPersonalInfoUpdated, 
  assertAuditEventCreated,
  assertNoAuditEventCreated,
  assertOutboxEventPublished,
  assertNoOutboxEventPublished,
  assertSensitiveFieldsUnchanged,
  assertUpdatedAtChanged,
  assertUpdatedAtUnchanged,
} from '../helpers/assertions';

describe('PATCH /me Integration Tests', () => {
  let prisma: PrismaClient;
  let testUtils: ReturnType<typeof getTestUtilities>;
  let transactionContext: TransactionContext;

  beforeAll(async () => {
    testUtils = getTestUtilities();
    prisma = testUtils.prisma;
  });

  beforeEach(async () => {
    // Start transaction with savepoint for test isolation
    transactionContext = await beginWithSavepoint(prisma);
    
    // Clear test data
    await testUtils.clearTestData();
  });

  afterEach(async () => {
    // Rollback to savepoint to undo all changes
    await rollbackToSavepoint(transactionContext);
  });

  afterAll(async () => {
    // Close Prisma connection
    await prisma.$disconnect();
  });

  describe('Happy Path Tests', () => {
    it('should update user name and personal info successfully', async () => {
      // Arrange
      const { user, accessTokenLike } = await createUserWithProfile(prisma, {
        personalInfo: {
          phone: '+50688887777',
          locale: 'es-CR',
          timeZone: 'America/Costa_Rica'
        }
      });

      const beforeUpdate = new Date();
      const requestBody = {
        name: '  María  Pérez  ',
        givenName: 'María',
        lastName: 'Pérez',
        personalInfo: {
          phone: '+50688887777',
          locale: 'es-CR',
          timeZone: 'America/Costa_Rica'
        }
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.meta.changed).toBe(true);
      expect(responseBody.name).toBe('María Pérez'); // Normalized
      expect(responseBody.givenName).toBe('María');
      expect(responseBody.lastName).toBe('Pérez');
      expect(responseBody.personalInfo.phone).toBe('+50688887777');
      expect(responseBody.personalInfo.locale).toBe('es-CR');
      expect(responseBody.personalInfo.timeZone).toBe('America/Costa_Rica');

      // Verify database changes
      await assertUserUpdated(prisma, user.id, {
        name: 'María Pérez',
        givenName: 'María',
        lastName: 'Pérez'
      });

      await assertPersonalInfoUpdated(prisma, user.id, {
        phone: '+50688887777',
        locale: 'es-CR',
        timeZone: 'America/Costa_Rica'
      });

      // Verify sensitive fields unchanged
      await assertSensitiveFieldsUnchanged(prisma, user.id);

      // Verify updatedAt changed
      await assertUpdatedAtChanged(prisma, user.id, beforeUpdate);

      // Verify audit event
      await assertAuditEventCreated(prisma, user.id, 'PROFILE_UPDATED', {
        changedFields: ['name', 'givenName', 'lastName', 'phone', 'locale', 'timeZone']
      });

      // Verify outbox event
      assertOutboxEventPublished(testUtils.outboxRepository, 'UserUpdated');
    });

    it('should handle idempotent requests (no changes)', async () => {
      // Arrange
      const { user, accessTokenLike } = await createUserWithProfile(prisma, {
        name: 'Test User',
        givenName: 'Test',
        lastName: 'User'
      });

      const beforeUpdate = new Date();
      const requestBody = {
        name: 'Test User',
        givenName: 'Test',
        lastName: 'User'
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.meta.changed).toBe(false);

      // Verify updatedAt unchanged
      await assertUpdatedAtUnchanged(prisma, user.id, beforeUpdate);

      // Verify no audit event for no-op
      await assertNoAuditEventCreated(prisma, user.id, 'PROFILE_UPDATED');

      // Verify no outbox event for no-op
      assertNoOutboxEventPublished(testUtils.outboxRepository, 'UserUpdated');
    });

    it('should update only personal info fields', async () => {
      // Arrange
      const { user, accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        personalInfo: {
          phone: '+50670000000'
        }
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.meta.changed).toBe(true);
      expect(responseBody.personalInfo.phone).toBe('+50670000000');

      // Verify only personal info changed
      await assertPersonalInfoUpdated(prisma, user.id, {
        phone: '+50670000000'
      });

      // Verify user fields unchanged
      await assertSensitiveFieldsUnchanged(prisma, user.id);
    });
  });

  describe('Validation Tests', () => {
    it('should reject invalid phone number format', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        personalInfo: {
          phone: '8888-7777' // Invalid format
        }
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(400);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('INVALID_USER_DATA');
    });

    it('should reject invalid locale format', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        personalInfo: {
          locale: 'spanish' // Invalid BCP47 format
        }
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(400);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('INVALID_USER_DATA');
    });

    it('should reject invalid timezone format', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        personalInfo: {
          timeZone: 'CostaRica' // Invalid IANA format
        }
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(400);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('INVALID_USER_DATA');
    });

    it('should reject empty request body', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, {});

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(400);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('MISSING_REQUIRED_FIELDS');
    });
  });

  describe('Authorization Tests', () => {
    it('should reject request for deleted user', async () => {
      // Arrange
      const { accessTokenLike } = await createDeletedUser(prisma);

      const requestBody = {
        name: 'Updated Name'
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(404);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('USER_NOT_FOUND');
    });

    it('should reject request for inactive user', async () => {
      // Arrange
      const { accessTokenLike } = await createInactiveUser(prisma);

      const requestBody = {
        name: 'Updated Name'
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('ACCOUNT_LOCKED');
    });

    it('should reject request for suspended user', async () => {
      // Arrange
      const { accessTokenLike } = await createSuspendedUser(prisma);

      const requestBody = {
        name: 'Updated Name'
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(403);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('ACCOUNT_SUSPENDED');
    });
  });

  describe('String Normalization Tests', () => {
    it('should normalize strings with control characters and extra spaces', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        name: '   José\u200B  López  ', // ZWSP and extra spaces
        givenName: 'José\u200B',
        lastName: 'López  '
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.name).toBe('José López'); // Normalized
      expect(responseBody.givenName).toBe('José'); // Normalized
      expect(responseBody.lastName).toBe('López'); // Normalized
    });
  });

  describe('Performance Tests', () => {
    it('should complete within performance SLA', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        name: 'Performance Test',
        personalInfo: {
          phone: '+50688887777',
          locale: 'es-CR',
          timeZone: 'America/Costa_Rica'
        }
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act
      const startTime = Date.now();
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);
      const endTime = Date.now();

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(120); // P99 < 120ms SLA
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        name: 'Test Name'
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act - Close Prisma connection to simulate database error
      await prisma.$disconnect();
      
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(500);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('INTERNAL_SERVER_ERROR');
    });
  });
});
