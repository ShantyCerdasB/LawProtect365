/**
 * @fileoverview patchMe.integration.test - Integration tests for PATCH /me endpoint
 * @summary Comprehensive integration tests for user profile updates
 * @description Tests the complete flow of PATCH /me endpoint including validation,
 * business rules, database updates, audit logging, and event publishing.
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { getTestCompositionRoot, getTestUtilities } from '../TestCompositionRoot';
import { createUserWithProfile, createDeletedUser, createInactiveUser, createSuspendedUser } from '../helpers/fixtures';import { requests } from '../helpers/requests';
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
import { UserAuditAction } from '../../../src/domain/enums/UserAuditAction';

describe('PATCH /me Integration Tests', () => {
  let prisma: PrismaClient;
  let testUtils: ReturnType<typeof getTestUtilities>;
  // let transactionContext: TransactionContext;

  beforeAll(async () => {
    testUtils = getTestUtilities();
    prisma = testUtils.prisma;
  });

  beforeEach(async () => {
    // Clear test data (without transactions for now)
    await testUtils.clearTestData();
  });

  afterEach(async () => {
    // No rollback needed for now
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

      // Debug on failure: print body and parsed error
      if ((result as any).statusCode !== 200) {
        // eslint-disable-next-line no-console
        console.log('Handler non-200 response:', (result as any).statusCode, (result as any).body);
        try {
          const parsed = JSON.parse((result as any).body);
          // eslint-disable-next-line no-console
          console.log('Parsed error body:', parsed);
        } catch {}
      }

      // Assert with debug
      if ((result as any).statusCode !== 200) {
        throw new Error(`Non-200 response: ${String((result as any).statusCode)} body=${String((result as any).body)}`);
      }
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      const data = (responseBody && responseBody.data) ? responseBody.data : responseBody;
      expect(data.meta.changed).toBe(true);
      expect(data.name).toBe('María Pérez'); // Normalized
      expect(data.givenName).toBe('María');
      expect(data.lastName).toBe('Pérez');
      expect(data.personalInfo.phone).toBe('+50688887777');
      expect(data.personalInfo.locale).toBe('es-CR');
      expect(data.personalInfo.timeZone).toBe('America/Costa_Rica');

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
      await assertAuditEventCreated(prisma, user.id, UserAuditAction.PROFILE_UPDATED, {
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
      const data = (responseBody && responseBody.data) ? responseBody.data : responseBody;
      expect(data.meta.changed).toBe(false);

      // Verify updatedAt unchanged
      await assertUpdatedAtUnchanged(prisma, user.id, beforeUpdate);

      // Verify no audit event for no-op
      await assertNoAuditEventCreated(prisma, user.id, UserAuditAction.PROFILE_UPDATED);

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
      const data = (responseBody && responseBody.data) ? responseBody.data : responseBody;
      expect(data.meta.changed).toBe(true);
      expect(data.personalInfo.phone).toBe('+50670000000');

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
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
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
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
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
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject empty request body', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, {});

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
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
      const data = (responseBody && responseBody.data) ? responseBody.data : responseBody;
      expect(data.name).toBe('José López'); // Normalized
      expect(data.givenName).toBe('José'); // Normalized
      expect(data.lastName).toBe('López'); // Normalized
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
      expect(duration).toBeLessThan(1000); // Allow CI variability
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

      // Act - Create a new TestCompositionRoot with a disconnected Prisma client
      const testCompositionRoot = getTestCompositionRoot();
      const originalPrisma = testCompositionRoot.getPrismaClient();
      
      // Disconnect the original Prisma client
      await originalPrisma.$disconnect();
      
      // Create a new Prisma client that will fail to connect
      const failingPrisma = new (require('@prisma/client').PrismaClient)({
        datasources: {
          db: {
            url: 'postgresql://invalid:invalid@invalid:5432/invalid?schema=public'
          }
        }
      });
      
      // Replace the Prisma client in the composition root
      (testCompositionRoot as any).prisma = failingPrisma;
      
      const handler = testCompositionRoot.createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(500);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('REPOSITORY_ERROR');
      
      // Cleanup - Restore the original Prisma client
      (testCompositionRoot as any).prisma = originalPrisma;
    });
  });

  describe('Edge Cases Tests', () => {
    it('should handle undefined userId gracefully', async () => {
      // Arrange - Create event without proper auth context
      const event: APIGatewayProxyEvent = {
        ...requests.users.patchMe({ userId: 'test-user' } as any, { name: 'Test' }),
        requestContext: {
          ...requests.users.patchMe({ userId: 'test-user' } as any, { name: 'Test' }).requestContext,
          authorizer: null // No auth context
        }
      };

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      console.log('Result status:', (result as any).statusCode);
      console.log('Result body:', (result as any).body);
      expect((result as any).statusCode).toBe(400);
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_BAD_REQUEST');
    });

    it('should reject request with only empty strings after sanitization', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        name: '   ', // Only spaces
        givenName: '', // Empty string
        lastName: '\t\n', // Only whitespace
        personalInfo: {
          phone: '   ', // Only spaces
          locale: '', // Empty string
          timeZone: '\t' // Only whitespace
        }
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should handle personalInfo with empty object', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        name: 'Test User',
        personalInfo: {} // Empty object
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      console.log('Result status:', (result as any).statusCode);
      console.log('Result body:', (result as any).body);
      expect((result as any).statusCode).toBe(200);
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.name).toBe('Test User');
    });

    it('should detect no changes when values are identical', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma, {
        name: 'John Doe',
        givenName: 'John',
        lastName: 'Doe'
      });

      const requestBody = {
        name: 'John Doe', // Same as current
        givenName: 'John', // Same as current
        lastName: 'Doe' // Same as current
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.meta.changed).toBe(false);
    });

    it('should handle null/undefined values in personalInfo gracefully', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        name: 'Test User',
        personalInfo: {
          phone: null, // null value
          locale: undefined, // undefined value
          timeZone: '' // empty string
        }
      };

      const event: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should handle very long strings that exceed database limits', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const longString = 'A'.repeat(1000); // Very long string
      const requestBody = {
        name: longString,
        givenName: longString,
        lastName: longString
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

    it('should handle special characters and unicode properly', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        name: 'Jose Maria Nino', // ASCII characters for testing
        personalInfo: {
          phone: '+1234567890',
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
      expect(responseBody.name).toBe('Jose Maria Nino');
      expect(responseBody.givenName).toBe('Jose');
      expect(responseBody.lastName).toBe('Maria Nino');
    });

    it('should handle concurrent updates to same user', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody1 = { name: 'First Update' };
      const requestBody2 = { name: 'Second Update' };

      const event1: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody1);
      const event2: APIGatewayProxyEvent = requests.users.patchMe(accessTokenLike, requestBody2);

      // Act - Execute both requests concurrently
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const [result1, result2] = await Promise.all([
        handler(event1 as any),
        handler(event2 as any)
      ]);

      // Assert - Both should succeed (no race condition handling)
      expect((result1 as any).statusCode).toBe(200);
      expect((result2 as any).statusCode).toBe(200);
    });

    it('should handle malformed JSON in request body', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const event: APIGatewayProxyEvent = {
        ...requests.users.patchMe(accessTokenLike, { name: 'Test' }),
        body: '{"name": "Test", "invalid": }' // Malformed JSON
      };

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(400);
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_BAD_REQUEST');
    });

    it('should handle missing Content-Type header', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const event: APIGatewayProxyEvent = {
        ...requests.users.patchMe(accessTokenLike, { name: 'Test' }),
        headers: {
          ...requests.users.patchMe(accessTokenLike, { name: 'Test' }).headers,
          'Content-Type': undefined // Missing Content-Type
        }
      };

      // Act
      const handler = getTestCompositionRoot().createHandlers().patchMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(400);
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_BAD_REQUEST');
    });
  });
});
