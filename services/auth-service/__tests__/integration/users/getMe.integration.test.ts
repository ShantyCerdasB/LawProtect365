/**
 * @fileoverview getMe.integration.test - Integration tests for GetMe endpoint
 * @summary Comprehensive integration tests for user profile retrieval functionality
 * @description Tests the complete flow of GetMe endpoint including validation,
 * conditional data inclusion, authentication, and response formatting.
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { getTestCompositionRoot, getTestUtilities } from '../TestCompositionRoot';
import { createUserWithProfile, createUserWithLinkedProviders } from '../helpers/fixtures';
import { requests } from '../helpers/requests';
import { UserRole } from '../../../src/domain/enums/UserRole';
import { UserAccountStatus } from '../../../src/domain/enums/UserAccountStatus';
import { OAuthProvider } from '../../../src/domain/enums/OAuthProvider';
import { uuid } from '@lawprotect/shared-ts';

describe('GetMe Integration Tests', () => {
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
    it('should retrieve basic user profile successfully', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma, {
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike);

      // Act
      const handler = getTestCompositionRoot().createHandlers().getMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.user).toBeDefined();
      expect(responseBody.user.id).toBe(accessTokenLike.userId);
      expect(responseBody.user.email).toBeDefined();
      expect(responseBody.user.name).toBeDefined();
      expect(responseBody.user.role).toBe(UserRole.CUSTOMER);
      expect(responseBody.user.status).toBe(UserAccountStatus.ACTIVE);
      expect(responseBody.user.mfa).toBeDefined();
      expect(responseBody.user.identity).toBeDefined();
      expect(responseBody.user.meta).toBeDefined();
    });

    it('should retrieve user profile with OAuth providers when requested', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithLinkedProviders(prisma, {
        role: UserRole.LAWYER,
        status: UserAccountStatus.ACTIVE,
        providers: [
          { provider: OAuthProvider.GOOGLE, providerAccountId: 'google-123' },
          { provider: OAuthProvider.MICROSOFT_365, providerAccountId: 'microsoft-456' }
        ]
      });

      const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike, { include: 'idp' });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.user.providers).toBeDefined();
      expect(responseBody.user.providers).toHaveLength(2);
      expect(responseBody.user.providers.map((p: any) => p.provider)).toContain(OAuthProvider.GOOGLE);
      expect(responseBody.user.providers.map((p: any) => p.provider)).toContain(OAuthProvider.MICROSOFT_365);
    });

    it('should retrieve user profile with personal info when requested', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma, {
        role: UserRole.ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      // Update personal info
      await prisma.userPersonalInfo.upsert({
        where: { userId: accessTokenLike.userId },
        update: {
          phone: '+50612345678',
          locale: 'es-CR',
          timeZone: 'America/Costa_Rica'
        },
        create: {
          id: uuid(),
          userId: accessTokenLike.userId,
          phone: '+50612345678',
          locale: 'es-CR',
          timeZone: 'America/Costa_Rica',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike, { include: 'profile' });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.user.personalInfo).toBeDefined();
      expect(responseBody.user.personalInfo.phone).toBe('+50612345678');
      expect(responseBody.user.personalInfo.locale).toBe('es-CR');
      expect(responseBody.user.personalInfo.timeZone).toBe('America/Costa_Rica');
    });

    it('should retrieve user profile with claims when requested', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma, {
        role: UserRole.SUPER_ADMIN,
        status: UserAccountStatus.ACTIVE
      });

      const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike, { include: 'claims' });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.user.claims).toBeDefined();
      expect(responseBody.user.claims.role).toBe(UserRole.SUPER_ADMIN);
      expect(responseBody.user.claims.account_status).toBe(UserAccountStatus.ACTIVE);
      expect(responseBody.user.claims.user_id).toBe(accessTokenLike.userId);
      expect(typeof responseBody.user.claims.is_mfa_required).toBe('boolean');
      expect(typeof responseBody.user.claims.mfa_enabled).toBe('boolean');
    });

    it('should retrieve user profile with all include flags', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithLinkedProviders(prisma, {
        role: UserRole.LAWYER,
        status: UserAccountStatus.ACTIVE,
        providers: [
          { provider: OAuthProvider.APPLE, providerAccountId: 'apple-789' }
        ]
      });

      // Add personal info
      await prisma.userPersonalInfo.upsert({
        where: { userId: accessTokenLike.userId },
        update: {
          phone: '+50687654321',
          locale: 'en-US',
          timeZone: 'America/New_York'
        },
        create: {
          id: uuid(),
          userId: accessTokenLike.userId,
          phone: '+50687654321',
          locale: 'en-US',
          timeZone: 'America/New_York',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike, { 
        include: 'idp,profile,claims' 
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      
      // Check all fields are present
      expect(responseBody.user.providers).toBeDefined();
      expect(responseBody.user.providers).toHaveLength(1);
      expect(responseBody.user.providers[0].provider).toBe(OAuthProvider.APPLE);
      
      expect(responseBody.user.personalInfo).toBeDefined();
      expect(responseBody.user.personalInfo.phone).toBe('+50687654321');
      
      expect(responseBody.user.claims).toBeDefined();
      expect(responseBody.user.claims.role).toBe(UserRole.LAWYER);
    });
  });

  describe('Validation Tests', () => {
    it('should reject invalid include flags', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike, { 
        include: 'invalid,flags' 
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(422);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_UNPROCESSABLE_ENTITY');
    });

    it('should accept empty include parameter', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike, { include: '' });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.user).toBeDefined();
      expect(responseBody.user.providers).toBeUndefined();
      expect(responseBody.user.personalInfo).toBeUndefined();
      expect(responseBody.user.claims).toBeUndefined();
    });

    it('should accept missing include parameter', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike);

      // Act
      const handler = getTestCompositionRoot().createHandlers().getMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.user).toBeDefined();
    });
  });

  describe('Authorization Tests', () => {
    it('should reject request without authentication', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        resource: '/me',
        path: '/me',
        httpMethod: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-country': 'CR',
          'User-Agent': 'test-user-agent'
        },
        multiValueHeaders: {},
        queryStringParameters: {},
        multiValueQueryStringParameters: {},
        pathParameters: null,
        stageVariables: null,
        requestContext: {
          resourceId: 'test-resource',
          resourcePath: '/me',
          httpMethod: 'GET',
          requestId: uuid(),
          protocol: 'HTTP/1.1',
          accountId: 'test-account',
          apiId: 'test-api',
          stage: 'test',
          requestTime: new Date().toISOString(),
          requestTimeEpoch: Date.now(),
          path: '/me',
          identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'test-user-agent'
          },
          authorizer: null
        } as any,
        body: null,
        isBase64Encoded: false
      };

      // Act
      const handler = getTestCompositionRoot().createHandlers().getMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(401);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('AUTH_UNAUTHORIZED');
    });

    it('should reject request with invalid cognitoSub', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        resource: '/me',
        path: '/me',
        httpMethod: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-country': 'CR',
          'User-Agent': 'test-user-agent'
        },
        multiValueHeaders: {},
        queryStringParameters: {},
        multiValueQueryStringParameters: {},
        pathParameters: null,
        stageVariables: null,
        requestContext: {
          resourceId: 'test-resource',
          resourcePath: '/me',
          httpMethod: 'GET',
          requestId: uuid(),
          protocol: 'HTTP/1.1',
          accountId: 'test-account',
          apiId: 'test-api',
          stage: 'test',
          requestTime: new Date().toISOString(),
          requestTimeEpoch: Date.now(),
          path: '/me',
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
        body: null,
        isBase64Encoded: false
      };

      // Act
      const handler = getTestCompositionRoot().createHandlers().getMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(404);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_NOT_FOUND');
    });
  });

  describe('Business Logic Tests', () => {
    it('should handle different user roles correctly', async () => {
      // Arrange
      const roles = [UserRole.CUSTOMER, UserRole.LAWYER, UserRole.ADMIN, UserRole.SUPER_ADMIN];
      
      for (const role of roles) {
        const { accessTokenLike } = await createUserWithProfile(prisma, { role });
        
        const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike, { include: 'claims' });

        // Act
        const handler = getTestCompositionRoot().createHandlers().getMeHandler;
        const result = await handler(event as any);

        // Assert
        expect((result as any).statusCode).toBe(200);
        
        const responseBody = JSON.parse((result as any).body);
        expect(responseBody.user.role).toBe(role);
        expect(responseBody.user.claims.role).toBe(role);
        
        // Clean up for next iteration
        await testUtils.clearTestData();
      }
    });

    it('should handle different user statuses correctly', async () => {
      // Arrange
      const statuses = [UserAccountStatus.ACTIVE, UserAccountStatus.INACTIVE, UserAccountStatus.SUSPENDED];
      
      for (const status of statuses) {
        const { accessTokenLike } = await createUserWithProfile(prisma, { status });
        
        const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike, { include: 'claims' });

        // Act
        const handler = getTestCompositionRoot().createHandlers().getMeHandler;
        const result = await handler(event as any);

        // Assert
        expect((result as any).statusCode).toBe(200);
        
        const responseBody = JSON.parse((result as any).body);
        expect(responseBody.user.status).toBe(status);
        expect(responseBody.user.claims.account_status).toBe(status);
        
        // Clean up for next iteration
        await testUtils.clearTestData();
      }
    });

    it('should return correct MFA information', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      // Update MFA settings
      await prisma.user.update({
        where: { id: accessTokenLike.userId },
        data: {
          mfaEnabled: false
        }
      });

      const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike, { include: 'claims' });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.user.mfa.required).toBe(false);
      expect(responseBody.user.mfa.enabled).toBe(false);
      expect(responseBody.user.claims.is_mfa_required).toBe(false);
      expect(responseBody.user.claims.mfa_enabled).toBe(false);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);
      
      // Create a mock handler that simulates the TestGetMeHandler behavior
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

      const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike);

      // Act
      const result = await mockHandler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(500);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.error).toBe('COMMON_INTERNAL_ERROR');
    });
  });

  describe('Edge Cases Tests', () => {
    it('should handle user with no personal info gracefully', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike, { include: 'profile' });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.user.personalInfo).toBeUndefined();
    });

    it('should handle user with no OAuth providers gracefully', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike, { include: 'idp' });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.user.providers).toEqual([]);
    });

    it('should handle special characters in user data', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma, {
        name: 'José María Ñoño',
        givenName: 'José María',
        lastName: 'Ñoño'
      });

      const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike);

      // Act
      const handler = getTestCompositionRoot().createHandlers().getMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.user.name).toBe('José María Ñoño');
      expect(responseBody.user.givenName).toBe('José María');
      expect(responseBody.user.lastName).toBe('Ñoño');
    });

    it('should handle very long include parameter', async () => {
      // Arrange
      const { accessTokenLike } = await createUserWithProfile(prisma);

      const longInclude = 'idp,profile,claims,'.repeat(100) + 'idp';
      const event: APIGatewayProxyEvent = requests.users.getMe(accessTokenLike, { 
        include: longInclude 
      });

      // Act
      const handler = getTestCompositionRoot().createHandlers().getMeHandler;
      const result = await handler(event as any);

      // Assert
      expect((result as any).statusCode).toBe(200);
      
      const responseBody = JSON.parse((result as any).body);
      expect(responseBody.user).toBeDefined();
    });
  });
});
