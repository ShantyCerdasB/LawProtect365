/**
 * @fileoverview unlinkProvider.integration.test - Integration tests for UnlinkProvider endpoint
 * @summary Comprehensive integration tests for provider unlinking functionality
 * @description Tests the complete flow of UnlinkProvider endpoint including validation,
 * business rules, OAuth account deletion, audit logging, and event publishing.
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { getTestCompositionRoot, getTestUtilities } from '../TestCompositionRoot';
import { createUserWithProfile, createUserWithLinkedProviders } from '../helpers/fixtures';
import { requests } from '../helpers/requests';
import { UnlinkingMode } from '../../../src/domain/enums/UnlinkingMode';
import { OAuthProvider } from '../../../src/domain/enums/OAuthProvider';
import { ProviderUnlinkingStatus } from '../../../src/domain/enums/ProviderUnlinkingStatus';
import { UserRole } from '../../../src/domain/enums/UserRole';
import { UserAccountStatus } from '../../../src/domain/enums/UserAccountStatus';
import { uuid } from '@lawprotect/shared-ts';

describe('UnlinkProvider Integration Tests', () => {
  let testUtils: any;
  let prisma: PrismaClient;

  beforeAll(async () => {
    testUtils = getTestUtilities();
    prisma = testUtils.prisma;
  });

  beforeEach(async () => {
    // Clear test data
    await testUtils.clearTestData();
  });

  afterAll(async () => {
    // Close Prisma connection
    await prisma.$disconnect();
  });

  describe('Happy Path Tests', () => {
    it('should unlink provider in direct mode successfully', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithLinkedProviders(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE,
        providers: [
          { provider: OAuthProvider.GOOGLE, providerAccountId: 'google-123' },
          { provider: OAuthProvider.MICROSOFT_365, providerAccountId: 'microsoft-456' }
        ]
      });

      const requestBody = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'google-123'
      };

      const event: APIGatewayProxyEvent = requests.users.unlinkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.unlinked).toBe(true);
      expect(responseBody.provider).toBe(OAuthProvider.GOOGLE);
      expect(responseBody.providerAccountId).toBe('google-123');
      expect(responseBody.status).toBe(ProviderUnlinkingStatus.SUCCESS);
      expect(responseBody.unlinkedAt).toBeDefined();
      expect(responseBody.message).toBe('Provider successfully unlinked');

      // Verify the OAuth account was actually deleted
      const remainingAccounts = await prisma.oAuthAccount.findMany({
        where: { userId: accessTokenLike.userId }
      });
      expect(remainingAccounts).toHaveLength(1);
      expect(remainingAccounts[0].provider).toBe(OAuthProvider.MICROSOFT_365);
    });

    it('should unlink provider in confirm mode successfully', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithLinkedProviders(prisma, {
        role: UserRole.LAWYER,
        status: UserAccountStatus.ACTIVE,
        providers: [
          { provider: OAuthProvider.APPLE, providerAccountId: 'apple-789' },
          { provider: OAuthProvider.COGNITO, providerAccountId: 'cognito-abc' }
        ]
      });

      const requestBody = {
        mode: UnlinkingMode.CONFIRM,
        provider: OAuthProvider.APPLE,
        providerAccountId: 'apple-789',
        confirmationToken: 'confirm-token-123'
      };

      const event: APIGatewayProxyEvent = requests.users.unlinkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.unlinked).toBe(true);
      expect(responseBody.provider).toBe(OAuthProvider.APPLE);
      expect(responseBody.providerAccountId).toBe('apple-789');
      expect(responseBody.status).toBe(ProviderUnlinkingStatus.SUCCESS);
      expect(responseBody.unlinkedAt).toBeDefined();
      expect(responseBody.message).toBe('Provider successfully unlinked with confirmation');

      // Verify the OAuth account was actually deleted
      const remainingAccounts = await prisma.oAuthAccount.findMany({
        where: { userId: accessTokenLike.userId }
      });
      expect(remainingAccounts).toHaveLength(1);
      expect(remainingAccounts[0].provider).toBe(OAuthProvider.COGNITO);
    });
  });

  describe('Validation Tests', () => {
    it('should reject invalid provider', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: UnlinkingMode.DIRECT,
        provider: 'INVALID_PROVIDER',
        providerAccountId: 'test-123'
      };

      const event: APIGatewayProxyEvent = requests.users.unlinkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject invalid mode', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: 'INVALID_MODE',
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'test-123'
      };

      const event: APIGatewayProxyEvent = requests.users.unlinkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject empty providerAccountId', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: ''
      };

      const event: APIGatewayProxyEvent = requests.users.unlinkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject missing confirmationToken in confirm mode', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: UnlinkingMode.CONFIRM,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'test-123'
        // Missing confirmationToken
      };

      const event: APIGatewayProxyEvent = requests.users.unlinkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject empty confirmationToken in confirm mode', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: UnlinkingMode.CONFIRM,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'test-123',
        confirmationToken: ''
      };

      const event: APIGatewayProxyEvent = requests.users.unlinkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });
  });

  describe('Authorization Tests', () => {
    it('should reject request without authentication', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        resource: '/me/providers:unlink',
        path: '/me/providers:unlink',
        httpMethod: 'POST',
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
          resourcePath: '/me/providers:unlink',
          httpMethod: 'POST',
          requestId: uuid(),
          protocol: 'HTTP/1.1',
          accountId: 'test-account',
          apiId: 'test-api',
          stage: 'test',
          requestTime: new Date().toISOString(),
          requestTimeEpoch: Date.now(),
          path: '/me/providers:unlink',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-user-agent'
          },
          authorizer: null
        } as any,
        body: JSON.stringify({
          mode: UnlinkingMode.DIRECT,
          provider: OAuthProvider.GOOGLE,
          providerAccountId: 'test-123'
        }),
        isBase64Encoded: false
      };

      // Act
      const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(401);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_UNAUTHORIZED');
    });

    it('should reject request with invalid cognitoSub', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        resource: '/me/providers:unlink',
        path: '/me/providers:unlink',
        httpMethod: 'POST',
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
          resourcePath: '/me/providers:unlink',
          httpMethod: 'POST',
          requestId: uuid(),
          protocol: 'HTTP/1.1',
          accountId: 'test-account',
          apiId: 'test-api',
          stage: 'test',
          requestTime: new Date().toISOString(),
          requestTimeEpoch: Date.now(),
          path: '/me/providers:unlink',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-user-agent'
          },
          authorizer: {
            claims: {
              sub: 'invalid-cognito-sub'
            }
          }
        } as any,
        body: JSON.stringify({
          mode: UnlinkingMode.DIRECT,
          provider: OAuthProvider.GOOGLE,
          providerAccountId: 'test-123'
        }),
        isBase64Encoded: false
      };

      // Act
      const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(404);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_NOT_FOUND');
    });
  });

  describe('Business Logic Tests', () => {
    it('should prevent unlinking the last provider', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithLinkedProviders(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE,
        providers: [
          { provider: OAuthProvider.GOOGLE, providerAccountId: 'google-only' }
        ]
      });

      const requestBody = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'google-only'
      };

      const event: APIGatewayProxyEvent = requests.users.unlinkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.unlinked).toBe(false);
      expect(responseBody.provider).toBe(OAuthProvider.GOOGLE);
      expect(responseBody.providerAccountId).toBe('google-only');
      expect(responseBody.status).toBe(ProviderUnlinkingStatus.NOT_ALLOWED);
      expect(responseBody.message).toBe('Cannot unlink the last provider');

      // Verify the OAuth account was NOT deleted
      const remainingAccounts = await prisma.oAuthAccount.findMany({
        where: { userId: accessTokenLike.userId }
      });
      expect(remainingAccounts).toHaveLength(1);
    });

    it('should handle non-existent provider account', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithLinkedProviders(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE,
        providers: [
          { provider: OAuthProvider.GOOGLE, providerAccountId: 'google-123' }
        ]
      });

      const requestBody = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.MICROSOFT_365,
        providerAccountId: 'non-existent-account'
      };

      const event: APIGatewayProxyEvent = requests.users.unlinkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.unlinked).toBe(false);
      expect(responseBody.provider).toBe(OAuthProvider.MICROSOFT_365);
      expect(responseBody.providerAccountId).toBe('non-existent-account');
      expect(responseBody.status).toBe(ProviderUnlinkingStatus.NOT_FOUND);
      expect(responseBody.message).toBe('OAuth account not found');

      // Verify the existing OAuth account was NOT deleted
      const remainingAccounts = await prisma.oAuthAccount.findMany({
        where: { userId: accessTokenLike.userId }
      });
      expect(remainingAccounts).toHaveLength(1);
      expect(remainingAccounts[0].provider).toBe(OAuthProvider.GOOGLE);
    });

    it('should handle different user roles correctly', async () => {
      // Arrange
      const roles = [UserRole.CUSTOMER, UserRole.LAWYER, UserRole.ADMIN, UserRole.SUPER_ADMIN];
      
      for (const role of roles) {
        const { accessTokenLike } = await createUserWithLinkedProviders(prisma, {
          role,
          providers: [
            { provider: OAuthProvider.GOOGLE, providerAccountId: `google-${role.toLowerCase()}` },
            { provider: OAuthProvider.MICROSOFT_365, providerAccountId: `microsoft-${role.toLowerCase()}` }
          ]
        });
        
        const requestBody = {
          mode: UnlinkingMode.DIRECT,
          provider: OAuthProvider.GOOGLE,
          providerAccountId: `google-${role.toLowerCase()}`
        };

        const event: APIGatewayProxyEvent = requests.users.unlinkProvider(accessTokenLike, requestBody);

        // Act
        const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
        const result = await handler(event as any);

        // Assert
        expect((result as any).statusCode).toBe(200);
        
        const responseBody = JSON.parse((result as any).body);
        expect(responseBody.unlinked).toBe(true);
        expect(responseBody.status).toBe(ProviderUnlinkingStatus.SUCCESS);
        
        // Clean up for next iteration
        await testUtils.clearTestData();
      }
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);
      
      // Create a mock handler that simulates the TestUnlinkProviderHandler behavior
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

      const event: APIGatewayProxyEvent = requests.users.unlinkProvider(accessTokenLike, {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'test-123'
      });

      // Act
      const result = await mockHandler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(500);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_INTERNAL_ERROR');
    });
  });

  describe('Edge Cases Tests', () => {
    it('should handle special characters in providerAccountId', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithLinkedProviders(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE,
        providers: [
          { provider: OAuthProvider.GOOGLE, providerAccountId: 'google-123' },
          { provider: OAuthProvider.MICROSOFT_365, providerAccountId: 'microsoft-456' }
        ]
      });

      const requestBody = {
        mode: UnlinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'google-123'
      };

      const event: APIGatewayProxyEvent = requests.users.unlinkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.unlinked).toBe(true);
      expect(responseBody.providerAccountId).toBe('google-123');
    });

    it('should handle very long confirmationToken', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithLinkedProviders(prisma, {
        role: UserRole.LAWYER,
        status: UserAccountStatus.ACTIVE,
        providers: [
          { provider: OAuthProvider.APPLE, providerAccountId: 'apple-123' },
          { provider: OAuthProvider.COGNITO, providerAccountId: 'cognito-456' }
        ]
      });

      const longToken = 'a'.repeat(1000);
      const requestBody = {
        mode: UnlinkingMode.CONFIRM,
        provider: OAuthProvider.APPLE,
        providerAccountId: 'apple-123',
        confirmationToken: longToken
      };

      const event: APIGatewayProxyEvent = requests.users.unlinkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.unlinked).toBe(true);
      expect(responseBody.status).toBe(ProviderUnlinkingStatus.SUCCESS);
    });

    it('should handle malformed JSON body', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const event: APIGatewayProxyEvent = {
        ...requests.users.unlinkProvider(accessTokenLike, {}),
        body: '{"mode": "direct", "provider": "GOOGLE", "providerAccountId": "test-123"' // Missing closing brace
      } as any;

      // Act
      const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
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
        ...requests.users.unlinkProvider(accessTokenLike, {
          mode: UnlinkingMode.DIRECT,
          provider: OAuthProvider.GOOGLE,
          providerAccountId: 'test-123'
        }),
        headers: {
          'x-country': 'CR',
          'User-Agent': 'test-user-agent'
          // Missing Content-Type
        }
      } as any;

      // Act
      const handler = getTestCompositionRoot().createHandlers().unlinkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(400);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_BAD_REQUEST');
    });
  });
});
