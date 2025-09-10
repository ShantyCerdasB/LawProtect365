/**
 * @file testHelpers.ts
 * @summary Test helper functions for integration tests
 * @description Utility functions for generating test data and PDFs
 */

import { createHash } from 'crypto';
import { randomUUID } from 'crypto';

/**
 * Generate a simple test PDF buffer
 * This creates a minimal PDF structure for testing purposes
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
 */
export const generateTestTenantId = (): string => {
  return `tenant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate test envelope ID
 */
export const generateTestEnvelopeId = (): string => {
  return randomUUID();
};

/**
 * Generate test party ID
 */
export const generateTestPartyId = (): string => {
  return randomUUID();
};

/**
 * Generate test document ID
 */
export const generateTestDocumentId = (): string => {
  return randomUUID();
};

/**
 * Create test request context with actor information
 */
export const createTestRequestContext = (overrides: {
  userId?: string;
  email?: string;
  sourceIp?: string;
  userAgent?: string;
  tenantId?: string;
} = {}) => {
  return {
    identity: {
      sourceIp: overrides.sourceIp || '192.168.1.100',
      userAgent: overrides.userAgent || 'test-agent/1.0'
    },
    authorizer: {
      userId: overrides.userId || 'test-user-123',
      email: overrides.email || 'test@example.com',
      tenantId: overrides.tenantId || 'test-tenant-123',
      actor: {
        userId: overrides.userId || 'test-user-123',
        email: overrides.email || 'test@example.com',
        ip: overrides.sourceIp || '192.168.1.100'
      }
    }
  };
};

/**
 * Create test path parameters
 */
export const createTestPathParams = (params: {
  tenantId: string;
  envelopeId?: string;
  id?: string;
}) => {
  return {
    tenantId: params.tenantId,
    ...(params.envelopeId && { envelopeId: params.envelopeId }),
    ...(params.id && { id: params.id })
  };
};

/**
 * Creates a complete API Gateway event for testing
 */
export const createApiGatewayEvent = (overrides: {
  pathParameters?: Record<string, string>;
  body?: any;
  requestContext?: any;
  headers?: Record<string, string>;
} = {}) => {
  return {
    version: '2.0',
    routeKey: 'POST /test',
    rawPath: '/test',
    rawQueryString: '',
    httpMethod: 'POST',
    path: '/test',
    pathParameters: overrides.pathParameters || {},
    body: overrides.body ? JSON.stringify(overrides.body) : undefined,
    isBase64Encoded: false,
    headers: {
      'Content-Type': 'application/json',
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
        sourceIp: '192.168.1.100',
        userAgent: 'test-agent/1.0'
      },
      requestId: 'test-request-id',
      routeKey: 'POST /test',
      stage: 'test',
      time: '01/Jan/2024:00:00:00 +0000',
      timeEpoch: 1704067200000,
      ...(overrides.requestContext || createTestRequestContext())
    },
    queryStringParameters: undefined,
    multiValueQueryStringParameters: undefined,
    multiValueHeaders: {},
    stageVariables: undefined
  };
};

/**
 * Wait for a specified amount of time
 * Useful for testing async operations
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate a random string of specified length
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a random email address
 */
export const generateTestEmail = (): string => {
  const randomString = generateRandomString(8);
  return `test-${randomString}@example.com`;
};

/**
 * Generate test OTP code
 */
export const generateTestOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
