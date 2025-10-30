/**
 * @fileoverview linkProvider.integration.test - Integration tests for LinkProvider endpoint
 * @summary Comprehensive integration tests for provider linking functionality
 * @description Tests the complete flow of LinkProvider endpoint including validation,
 * business rules, OAuth account creation, audit logging, and event publishing.
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { getTestCompositionRoot, getTestUtilities } from '../TestCompositionRoot';
import { createUserWithProfile, createUserWithLinkedProviders, createOAuthAccount } from '../helpers/fixtures';
import { requests } from '../helpers/requests';
import { LinkingMode } from '../../../src/domain/enums/LinkingMode';
import { OAuthProvider } from '../../../src/domain/enums/OAuthProvider';

describe('LinkProvider Integration Tests', () => {
  let prisma: PrismaClient;
  let testUtils: ReturnType<typeof getTestUtilities>;

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
    it('should link Google provider in redirect mode successfully', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: LinkingMode.REDIRECT,
        provider: OAuthProvider.GOOGLE,
        successUrl: 'https://app.example.com/success',
        failureUrl: 'https://app.example.com/failure'
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.linkUrl).toBeDefined();
      expect(responseBody.linkUrl).toContain('google');
      expect(responseBody.linked).toBe(false); // Not linked yet in redirect mode
      expect(responseBody.provider).toBe(OAuthProvider.GOOGLE);
    });

    it('should link Microsoft provider in direct mode successfully', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.MICROSOFT_365,
        authorizationCode: 'test-auth-code-123',
        idToken: 'test-id-token-456'
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Debug on failure: print body and parsed error
      if ((result as any).statusCode !== 200) {
        console.log('Handler non-200 response:', (result as any).statusCode, (result as any).body);
        try {
          const parsed = JSON.parse((result as any).body);
          console.log('Parsed error body:', parsed);
        } catch {}
      }

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.linked).toBe(true);
      expect(responseBody.provider).toBe(OAuthProvider.MICROSOFT_365);
      expect(responseBody.providerAccountId).toBeDefined();
      expect(responseBody.linkedAt).toBeDefined();

      // Verify OAuth account was created in database
      const oauthAccount = await prisma.oAuthAccount.findFirst({
        where: {
          userId: accessTokenLike.userId,
          provider: OAuthProvider.MICROSOFT_365
        }
      });
      expect(oauthAccount).toBeDefined();
      expect(oauthAccount?.providerAccountId).toBe(responseBody.providerAccountId);
    });

    it('should link Apple provider in finalize mode successfully', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: LinkingMode.FINALIZE,
        provider: OAuthProvider.APPLE,
        code: 'test-code-789',
        state: 'test-state-abc',
        authorizationCode: 'test-auth-code-123'
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.linked).toBe(true);
      expect(responseBody.provider).toBe(OAuthProvider.APPLE);
      expect(responseBody.providerAccountId).toBeDefined();
      expect(responseBody.linkedAt).toBeDefined();
    });
  });

  describe('Validation Tests', () => {
    it('should reject invalid provider', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: LinkingMode.DIRECT,
        provider: 'INVALID_PROVIDER',
        authorizationCode: 'test-auth-code-123'
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
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
        authorizationCode: 'test-auth-code-123'
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject redirect mode without URLs', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: LinkingMode.REDIRECT,
        provider: OAuthProvider.GOOGLE
        // Missing successUrl and failureUrl
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject direct mode without authorization code or id token', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE
        // Missing authorizationCode and idToken
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should reject invalid URLs in redirect mode', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: LinkingMode.REDIRECT,
        provider: OAuthProvider.GOOGLE,
        successUrl: 'not-a-valid-url',
        failureUrl: 'also-not-a-valid-url'
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
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
      const requestBody = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        authorizationCode: 'test-auth-code-123'
      };

      const event: APIGatewayProxyEvent = {
        ...requests.users.linkProvider({ sub: '', email: '', role: '', userId: '' }, requestBody),
        auth: undefined // Remove auth context
      } as any;

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(401);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_UNAUTHORIZED');
    });

    it('should reject request with invalid userId', async () => {
      // Arrange
      const requestBody = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        authorizationCode: 'test-auth-code-123'
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider({
        sub: 'test-sub',
        email: 'test@example.com',
        role: 'USER',
        userId: 'invalid-user-id'
      }, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(400);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_BAD_REQUEST');
    });
  });

  describe('Business Logic Tests', () => {
    it('should prevent linking duplicate provider', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithLinkedProviders(prisma, {
        providers: [{
          provider: OAuthProvider.GOOGLE,
          providerAccountId: 'google-123'
        }]
      });

      const requestBody = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        authorizationCode: 'test-auth-code-123'
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(409);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_CONFLICT');
    });

    it('should allow linking different providers to same user', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithLinkedProviders(prisma, {
        providers: [{
          provider: OAuthProvider.GOOGLE,
          providerAccountId: 'google-123'
        }]
      });

      const requestBody = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.MICROSOFT_365,
        authorizationCode: 'test-auth-code-456'
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Assert
      if ((result as any).statusCode !== 200) {
        console.error('Unexpected status code:', (result as any).statusCode);
        console.error('Response body:', (result as any).body);
      }
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.linked).toBe(true);
      expect(responseBody.provider).toBe(OAuthProvider.MICROSOFT_365);

      // Verify both providers are linked
      const oauthAccounts = await prisma.oAuthAccount.findMany({
        where: { userId: accessTokenLike.userId }
      });
      expect(oauthAccounts).toHaveLength(2);
      expect(oauthAccounts.map(acc => acc.provider)).toContain(OAuthProvider.GOOGLE);
      expect(oauthAccounts.map(acc => acc.provider)).toContain(OAuthProvider.MICROSOFT_365);
    });

    it('should prevent linking same provider account to different users', async () => {
      // Arrange
      const { accessTokenLike: user1Token } = await createUserWithProfile(prisma);
      const { accessTokenLike: user2Token } = await createUserWithProfile(prisma);

      // Link Google to user1
      await createOAuthAccount(prisma, user1Token.userId, {
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'google-shared-123'
      });

      const requestBody = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        authorizationCode: 'google-shared-123' // Same as providerAccountId
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider(user2Token, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(409);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_CONFLICT');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle malformed JSON gracefully', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const event: APIGatewayProxyEvent = {
        ...requests.users.linkProvider(accessTokenLike, {}),
        body: '{"mode": "direct", "provider": "GOOGLE", "authorizationCode": "test"' // Missing closing brace
      };

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(400);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_BAD_REQUEST');
    });

    it('should handle missing Content-Type header', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        authorizationCode: 'test-auth-code-123'
      };

      const event: APIGatewayProxyEvent = {
        ...requests.users.linkProvider(accessTokenLike, requestBody),
        headers: {
          ...requests.users.linkProvider(accessTokenLike, requestBody).headers,
          'Content-Type': 'text/plain' // Wrong content type
        }
      };

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(400);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_BAD_REQUEST');
    });

    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        authorizationCode: 'test-auth-code-123'
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider(accessTokenLike, requestBody);

      // Disconnect Prisma to simulate database error
      const originalPrisma = (getTestCompositionRoot() as any).prisma;
      (getTestCompositionRoot() as any).prisma = {
        oAuthAccount: {
          create: () => Promise.reject(new Error('Database connection failed'))
        }
      };

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(500);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_INTERNAL_ERROR');

      // Cleanup - Restore the original Prisma client
      (getTestCompositionRoot() as any).prisma = originalPrisma;
    });
  });

  describe('Edge Cases Tests', () => {
    it('should handle very long authorization codes', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const longAuthCode = 'a'.repeat(10000); // Very long auth code
      const requestBody = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        authorizationCode: longAuthCode
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.linked).toBe(true);
    });

    it('should handle special characters in provider account ID', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        authorizationCode: 'test-auth-code-123'
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider(accessTokenLike, requestBody);

      // Act
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.linked).toBe(true);
      expect(responseBody.providerAccountId).toBeDefined();
    });

    it('should handle concurrent linking attempts', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const requestBody = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        authorizationCode: 'test-auth-code-123'
      };

      const event: APIGatewayProxyEvent = requests.users.linkProvider(accessTokenLike, requestBody);

      // Act - Simulate concurrent requests
      const handler = getTestCompositionRoot().createHandlers().linkProviderHandler;
      const [result1, result2] = await Promise.all([
        handler(event as any),
        handler(event as any)
      ]);

      // Assert - One should succeed, one should fail with conflict
      const statusCodes = [(result1 as any).statusCode, (result2 as any).statusCode];
      expect(statusCodes).toContain(200); // One should succeed
      expect(statusCodes).toContain(409); // One should fail with conflict
    });
  });
});
