/**
 * @file testHelpers.ts
 * @summary Test helper functions for integration tests
 * @description Utility functions for generating test data, PDFs, JWT tokens, and API Gateway events.
 * This module provides comprehensive test utilities for integration testing including mock data
 * generation, authentication helpers, and request context creation.
 */

import { createHash, randomUUID, randomBytes } from 'node:crypto';
import { generateTestJwtToken as generateJwtFromMock } from '../mocks/cognito/jwksMock';

/**
 * Generate a cryptographically secure random string
 * 
 * @param length - Length of the random string to generate
 * @returns Cryptographically secure random string
 * @description Creates a random string using crypto.randomBytes for security.
 */
export const secureRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  
  return result;
};

/**
 * Generate a simple test PDF buffer
 * 
 * @returns Buffer containing a minimal PDF structure for testing purposes
 * @description Creates a basic PDF document with a single page containing "Test Document" text.
 * This PDF is suitable for testing document processing, signing, and storage operations.
 */
export const generateTestPdf = (): Buffer => {
  // Minimal PDF content - this is a very basic PDF structure
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF`;

  return Buffer.from(pdfContent, 'utf-8');
};

/**
 * Calculate digest for a PDF buffer
 * @param pdfBuffer - The PDF buffer to calculate digest for
 * @param algorithm - Hash algorithm to use (default: 'sha256')
 * @returns Object with algorithm and hex-encoded hash value
 */
export const calculatePdfDigest = (
  pdfBuffer: Buffer, 
  algorithm: string = 'sha256'
): { alg: string; value: string } => {
  const hash = createHash(algorithm);
  hash.update(pdfBuffer);
  const digest = hash.digest('hex');
  
  return {
    alg: algorithm,
    value: digest
  };
};

/**
 * Generate test tenant ID
 * 
 * @returns Unique tenant identifier for testing
 * @description Creates a unique tenant ID using timestamp and random string for test isolation.
 */
export const generateTestTenantId = (): string => {
  return `tenant-${Date.now()}-${secureRandomString(9)}`;
};

/**
 * Generate test envelope ID
 * 
 * @returns Unique envelope identifier for testing
 * @description Creates a UUID-based envelope ID for testing envelope operations.
 */
export const generateTestEnvelopeId = (): string => {
  return randomUUID();
};

/**
 * Generate test party ID
 * 
 * @returns Unique party identifier for testing
 * @description Creates a UUID-based party ID for testing signer and party operations.
 */
export const generateTestPartyId = (): string => {
  return randomUUID();
};

/**
 * Generate test document ID
 * 
 * @returns Unique document identifier for testing
 * @description Creates a UUID-based document ID for testing document operations.
 */
export const generateTestDocumentId = (): string => {
  return randomUUID();
};

/**
 * Generate a random test IP address
 * 
 * @returns Random IP address in the 192.168.x.x range for testing
 * @description Creates a random IP address in the private network range to avoid
 * conflicts with real IP addresses and ensure test isolation.
 */
export const generateTestIpAddress = (): string => {
  // Generate random IP in 192.168.x.x range (private network)
  const thirdOctet = randomBytes(1)[0];
  const fourthOctet = randomBytes(1)[0];
  return `192.168.${thirdOctet}.${fourthOctet}`;
};

/**
 * Create test request context with actor information
 * 
 * @param overrides - Optional overrides for default test values
 * @returns Test request context object with identity and authorizer information
 * @description Creates a complete request context object suitable for testing API Gateway
 * handlers with realistic user identity and authorization data.
 */
export const createTestRequestContext = (overrides: {
  userId?: string;
  email?: string;
  sourceIp?: string;
  userAgent?: string;
  tenantId?: string;
  role?: string;
} = {}) => {
  const userAgent = overrides.userAgent || 'test-agent/1.0';
  const sourceIp = overrides.sourceIp || generateTestIpAddress();
  const role = overrides.role || 'customer'; // Default role for tests
  
  return {
    identity: {
      sourceIp: sourceIp,
      userAgent: userAgent
    },
    authorizer: {
      userId: overrides.userId || 'test-user-123',
      email: overrides.email || 'test@example.com',
      actor: {
        userId: overrides.userId || 'test-user-123',
        email: overrides.email || 'test@example.com',
        ip: sourceIp,
        userAgent: userAgent, // ✅ Agregar userAgent al actor
        role: role, // ✅ Agregar role al actor para métricas
        roles: ['user'],
        scopes: []
      }
    }
  };
};

/**
 * Create test path parameters
 * 
 * @param params - Optional path parameters to include
 * @returns Object containing path parameters for API Gateway events
 * @description Creates path parameters object for testing API Gateway events with
 * optional envelope and document IDs.
 */
export const createTestPathParams = (params: {
  envelopeId?: string;
  id?: string;
} = {}) => {
  return {
    ...(params.envelopeId && { envelopeId: params.envelopeId }),
    ...(params.id && { id: params.id })
  };
};

/**
 * Creates a complete API Gateway event for testing
 * 
 * @param overrides - Optional overrides for default event properties
 * @returns Complete API Gateway v2 event object for testing
 * @description Creates a realistic API Gateway event with optional authentication,
 * path parameters, query parameters, and request body for comprehensive testing.
 */
export const createApiGatewayEvent = async (overrides: {
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  body?: any;
  requestContext?: any;
  headers?: Record<string, string>;
  includeAuth?: boolean;
  authToken?: string;
} = {}) => {
  // Generate JWT token if not provided and auth is requested
  let authToken = overrides.authToken;
  if (overrides.includeAuth !== false && !authToken) {
    const requestContext = overrides.requestContext || createTestRequestContext();
    const email = requestContext.authorizer?.email || 'test@example.com';
    const userId = requestContext.authorizer?.userId || 'test-user-123';
    authToken = await generateTestJwtToken({
      sub: userId,
      email: email,
      roles: ['customer'],
      scopes: []
    });
  }

  return {
    version: '2.0',
    routeKey: 'POST /test',
    rawPath: '/test',
    rawQueryString: '',
    httpMethod: 'POST',
    path: '/test',
    pathParameters: overrides.pathParameters || {},
    queryStringParameters: overrides.queryStringParameters || {},
    body: overrides.body ? JSON.stringify(overrides.body) : undefined,
    isBase64Encoded: false,
    headers: {
      'Content-Type': 'application/json',
      'user-agent': 'Test User Agent',
      'x-country': 'US',
      'x-forwarded-for': generateTestIpAddress(),
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...overrides.headers
    },
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      domainName: 'test.execute-api.us-east-1.amazonaws.com',
      http: {
        method: 'POST',
        path: '/test',
        protocol: 'HTTP/1.1',
        sourceIp: generateTestIpAddress(),
        userAgent: 'test-agent/1.0'
      },
      requestId: 'test-request-id',
      routeKey: 'POST /test',
      stage: 'test',
      time: '01/Jan/2024:00:00:00 +0000',
      timeEpoch: 1704067200000,
      ...(overrides.requestContext || createTestRequestContext())
    },
    multiValueQueryStringParameters: undefined,
    multiValueHeaders: {},
    stageVariables: undefined
  };
};

/**
 * Wait for a specified amount of time
 * 
 * @param ms - Number of milliseconds to wait
 * @returns Promise that resolves after the specified delay
 * @description Useful for testing async operations and introducing delays in test scenarios.
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate a random string of specified length
 * 
 * @param length - Length of the random string to generate
 * @returns Random alphanumeric string of specified length
 * @description Creates a random string using alphanumeric characters for test data generation.
 */
export const generateRandomString = (length: number): string => {
  return secureRandomString(length);
};

/**
 * Generate a random email address
 * 
 * @returns Random test email address
 * @description Creates a unique test email address using random string generation.
 */
export const generateTestEmail = (): string => {
  const randomString = generateRandomString(8);
  return `test-${randomString}@example.com`;
};

/**
 * Generate test OTP code
 * 
 * @returns 6-digit OTP code as string
 * @description Generates a random 6-digit numeric OTP code for testing authentication flows.
 */
export const generateTestOtpCode = (): string => {
  // Generate secure 6-digit OTP code
  const randomValue = randomBytes(4).readUInt32BE(0);
  const otp = 100000 + (randomValue % 900000);
  return otp.toString();
};

/**
 * Generate a test JWT token for authentication using RS256
 * 
 * @param payload - JWT payload with user information
 * @param expiresIn - Token expiration time (default: '1h')
 * @returns Promise resolving to RS256 JWT token string
 * @description Creates a test JWT token using the mock JWKS server for authentication testing.
 */
export const generateTestJwtToken = async (
  payload: {
    sub: string;
    email: string;
    roles?: string[];
    scopes?: string[];
    [key: string]: any;
  },
  expiresIn: string = '1h'
): Promise<string> => {
  return await generateJwtFromMock(payload.sub, payload);
};

/**
 * Generate a mock Cognito JWT token for testing
 * 
 * @param payload - JWT payload with user information
 * @param expiresIn - Token expiration time (default: '1h')
 * @returns Mock JWT token string (unsigned, for testing purposes)
 * @description Creates a mock JWT token that mimics Cognito's token structure without
 * actual cryptographic signing. Used for testing scenarios where token verification is mocked.
 */
export const generateMockCognitoToken = (
  payload: {
    sub: string;
    email: string;
    roles?: string[];
    scopes?: string[];
    [key: string]: any;
  },
  expiresIn: string = '1h'
): string => {
  // Create Cognito-like payload
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (expiresIn === '1h' ? 3600 : 86400); // 1 hour or 1 day

  const cognitoPayload = {
    sub: payload.sub,
    email: payload.email,
    email_verified: true,
    iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
    aud: 'test-client-id',
    exp: exp,
    iat: now,
    token_use: 'access',
    scope: 'aws.cognito.signin.user.admin',
    auth_time: now,
    'cognito:groups': payload.roles || ['user'],
    'cognito:username': payload.sub
  };

  // For testing, we'll create a simple JWT structure without actual signing
  // The mock verifyJwt function will handle the verification
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(cognitoPayload)).toString('base64url');
  const signature = 'mock-signature';
  
  return `${header}.${body}.${signature}`;
};

/**
 * Create test request context with JWT token
 * 
 * @param overrides - Optional overrides for default test values
 * @returns Test request context object with authentication information
 * @description Creates a request context object with user authentication data for testing
 * authenticated API endpoints and authorization flows.
 */
export const createTestRequestContextWithAuth = (overrides: {
  userId?: string;
  email?: string;
  sourceIp?: string;
  userAgent?: string;
  roles?: string[];
  scopes?: string[];
  tokenSecret?: string;
} = {}) => {
  const userId = overrides.userId || 'test-user-123';
  const email = overrides.email || 'test@example.com';
  const roles = overrides.roles || ['user'];
  const scopes = overrides.scopes || [];
  

  return {
    identity: {
      sourceIp: overrides.sourceIp || generateTestIpAddress(),
      userAgent: overrides.userAgent || 'test-agent/1.0'
    },
    authorizer: {
      userId: userId,
      email: email,
      actor: {
        userId: userId,
        email: email,
        ip: overrides.sourceIp || generateTestIpAddress(),
        roles: roles,
        scopes: scopes
      }
    }
  };
};
