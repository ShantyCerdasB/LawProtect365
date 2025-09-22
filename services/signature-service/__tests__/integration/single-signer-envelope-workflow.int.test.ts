/**
 * @file single-signer-envelope-workflow.int.test.ts
 * @summary Single-signer envelope workflow integration tests
 * @description End-to-end integration tests for single-signer envelope workflows where the owner
 * is the only signer. Tests complete document lifecycle from creation to completion.
 * 
 * Test Coverage:
 * - Envelope creation and configuration
 * - Document upload and processing
 * - Owner signing workflow
 * - Document completion and status updates
 * - Signed document download
 * - Complete audit trail verification
 * 
 * @deprecated Most test content is temporarily commented out during refactoring.
 * Currently only tests CreateEnvelope functionality with seeded test user.
 */

import { randomUUID, createHash } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { loadConfig } from '../../src/config';
import { createApiGatewayEvent, createTestRequestContext, generateTestPdf } from './helpers/testHelpers';
import { createEnvelopeHandler } from '../../src/handlers/envelopes/CreateEnvelopeHandler';
import { updateEnvelopeHandler } from '../../src/handlers/envelopes/UpdateEnvelopeHandler';

describe('Single-Signer Envelope Workflow Integration Tests', () => {
  const cfg = loadConfig();
  const s3 = new S3Client({
    region: cfg.s3.region,
    endpoint: process.env.AWS_ENDPOINT_URL,
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test', secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test' }
  });

  // Get seeded test user from database
  let testUser: { userId: string; email: string; name: string; role: string };
  
  beforeAll(async () => {
    // Query the seeded user from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (!user) {
      throw new Error('Test user not found in database. Make sure seed has run.');
    }
    
    testUser = {
      userId: user.id,
      email: user.email,
      name: user.name || 'Test User',
      role: user.role
    };
    
    await prisma.$disconnect();
    
    // Upload test PDF to S3
    const testPdf = generateTestPdf();
    const sourceKey = `test-documents/${randomUUID()}.pdf`;
    
    await s3.send(new PutObjectCommand({
      Bucket: cfg.s3.bucketName,
      Key: sourceKey,
      Body: testPdf,
      ContentType: 'application/pdf'
    }));
    
    // Store source key for tests
    (global as any).testSourceKey = sourceKey;
  });

  const makeAuthEvent = async (overrides?: any) => {
    const base = await createApiGatewayEvent({ 
      includeAuth: true, 
      requestContext: createTestRequestContext({ 
        userId: testUser.userId, 
        email: testUser.email, 
        userAgent: 'jest-test/1.0'
      }),
      headers: {
        'x-country': 'US',
        'x-forwarded-for': '127.0.0.1'
      }
    });
    
    // Override authorizer with test user identity
    (base.requestContext as any).authorizer.userId = testUser.userId;
    (base.requestContext as any).authorizer.email = testUser.email;
    (base.requestContext as any).authorizer.actor = {
      userId: testUser.userId,
      email: testUser.email,
      ip: '127.0.0.1',
      userAgent: 'jest-test/1.0',
      country: 'US'
    };
    
    return { ...base, ...overrides };
  };

  // Helper function for updating envelopes
  const updateEnvelope = async (envelopeId: string, updateData: any) => {
    const event = await makeAuthEvent({
      pathParameters: { id: envelopeId },
      body: JSON.stringify(updateData)
    });
    
    const result = await updateEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return { 
      statusCode: result.statusCode, 
      data: response // The handler returns the data directly, not wrapped in { data: ... }
    };
  };


  describe('CreateEnvelope - Single Signer Workflow', () => {
    it('should create envelope successfully with seeded test user', async () => {
      const event = await makeAuthEvent({
        body: JSON.stringify({
          title: 'Test Single Signer Envelope',
          description: 'Integration test for single signer envelope creation',
          // signingOrderType is optional, defaults to OWNER_FIRST
          originType: 'USER_UPLOAD',
          sourceKey: (global as any).testSourceKey,
          metaKey: `test-meta/${randomUUID()}.json`
        })
      });

      const result = await createEnvelopeHandler(event) as any;

      expect(result.statusCode).toBe(201);
      
      const response = JSON.parse(result.body);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        title: 'Test Single Signer Envelope',
        description: 'Integration test for single signer envelope creation',
        status: 'DRAFT',
        signingOrderType: 'OWNER_FIRST',
        originType: 'USER_UPLOAD',
        createdBy: testUser.userId,
        sourceKey: (global as any).testSourceKey,
        metaKey: expect.any(String)
      });

      // Store envelope ID for potential future tests
      (global as any).testEnvelopeId = response.data.id;
    });

    it('should create envelope with template origin', async () => {
      const event = await makeAuthEvent({
        body: JSON.stringify({
          title: 'Test Template Envelope',
          description: 'Integration test for template-based envelope creation',
          // signingOrderType is optional, defaults to OWNER_FIRST
          originType: 'TEMPLATE',
          templateId: 'test-template-123',
          templateVersion: '1.0.0',
          sourceKey: (global as any).testSourceKey,
          metaKey: `test-meta/${randomUUID()}.json`
        })
      });

      const result = await createEnvelopeHandler(event) as any;

      expect(result.statusCode).toBe(201);
      
      const response = JSON.parse(result.body);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        title: 'Test Template Envelope',
        description: 'Integration test for template-based envelope creation',
        status: 'DRAFT',
        signingOrderType: 'OWNER_FIRST',
        originType: 'TEMPLATE',
        templateId: 'test-template-123',
        templateVersion: '1.0.0',
        createdBy: testUser.userId
      });
    });

    it('should validate required fields for template origin', async () => {
      const event = await makeAuthEvent({
        body: JSON.stringify({
          title: 'Test Invalid Template Envelope',
          description: 'Should fail due to missing template fields',
          // signingOrderType is optional, defaults to OWNER_FIRST
          originType: 'TEMPLATE',
          // Missing templateId and templateVersion
          sourceKey: (global as any).testSourceKey,
          metaKey: `test-meta/${randomUUID()}.json`
        })
      });

      const result = await createEnvelopeHandler(event) as any;

      expect(result.statusCode).toBe(422);
      
      const response = JSON.parse(result.body);
      expect(response.message).toBe('templateId and templateVersion are required when originType is TEMPLATE');
    });
  });

  describe('UpdateEnvelope - Single Signer Workflow', () => {
    it('should update envelope title and description', async () => {
      // 1. Create envelope first
      const createEvent = await makeAuthEvent({
        body: JSON.stringify({
          title: 'Original Title',
          description: 'Original Description',
          originType: 'USER_UPLOAD',
          sourceKey: (global as any).testSourceKey,
          metaKey: `test-meta/${randomUUID()}.json`
        })
      });

      const createResult = await createEnvelopeHandler(createEvent) as any;
      const createResponse = JSON.parse(createResult.body);
      const envelopeId = createResponse.data.id;

      // 2. Update envelope metadata
      const updateResponse = await updateEnvelope(envelopeId, {
        title: 'Updated Title',
        description: 'Updated Description'
      });

      // 3. Verify response
      expect(updateResponse.statusCode).toBe(200);
      expect(updateResponse.data.title).toBe('Updated Title');
      expect(updateResponse.data.description).toBe('Updated Description');
      expect(updateResponse.data.id).toBe(envelopeId);

      // 4. Verify changes in database
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const envelope = await prisma.signatureEnvelope.findUnique({
        where: { id: envelopeId }
      });
      
      expect(envelope?.title).toBe('Updated Title');
      expect(envelope?.description).toBe('Updated Description');
      
      await prisma.$disconnect();
    });

    it('should update envelope S3 keys', async () => {
      // 1. Create envelope first
      const createEvent = await makeAuthEvent({
        body: JSON.stringify({
          title: 'Test Document',
          description: 'Test Description',
          originType: 'USER_UPLOAD',
          sourceKey: (global as any).testSourceKey,
          metaKey: `test-meta/${randomUUID()}.json`
        })
      });

      const createResult = await createEnvelopeHandler(createEvent) as any;
      const createResponse = JSON.parse(createResult.body);
      const envelopeId = createResponse.data.id;

      // 2. Upload new test document to S3
      const newTestPdf = generateTestPdf();
      const newSourceKey = `test-documents/${randomUUID()}.pdf`;
      const newMetaKey = `test-meta/${randomUUID()}.json`;
      
      await s3.send(new PutObjectCommand({
        Bucket: cfg.s3.bucketName,
        Key: newSourceKey,
        Body: newTestPdf,
        ContentType: 'application/pdf'
      }));

      // 3. Update envelope S3 keys
      const updateResponse = await updateEnvelope(envelopeId, {
        sourceKey: newSourceKey,
        metaKey: newMetaKey
      });

      // 4. Verify response
      expect(updateResponse.statusCode).toBe(200);
      expect(updateResponse.data.sourceKey).toBe(newSourceKey);
      expect(updateResponse.data.metaKey).toBe(newMetaKey);

      // 5. Verify changes in database
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const envelope = await prisma.signatureEnvelope.findUnique({
        where: { id: envelopeId }
      });
      
      expect(envelope?.sourceKey).toBe(newSourceKey);
      expect(envelope?.metaKey).toBe(newMetaKey);
      
      await prisma.$disconnect();
    });

    it('should fail when updating immutable fields', async () => {
      // 1. Create envelope first
      const createEvent = await makeAuthEvent({
        body: JSON.stringify({
          title: 'Test Document',
          description: 'Test Description',
          originType: 'USER_UPLOAD',
          sourceKey: (global as any).testSourceKey,
          metaKey: `test-meta/${randomUUID()}.json`
        })
      });

      const createResult = await createEnvelopeHandler(createEvent) as any;
      const createResponse = JSON.parse(createResult.body);
      const envelopeId = createResponse.data.id;

      // 2. Try to update immutable field - this should fail at schema level
      const updateResponse = await updateEnvelope(envelopeId, {
        createdBy: 'other-user-id'
      });

      // 3. Verify error response - should be 422 (schema validation error)
      expect(updateResponse.statusCode).toBe(422);
      expect(updateResponse.data.message).toContain("Unrecognized key(s) in object");
    });

    it('should fail when S3 keys do not exist', async () => {
      // 1. Create envelope first
      const createEvent = await makeAuthEvent({
        body: JSON.stringify({
          title: 'Test Document',
          description: 'Test Description',
          originType: 'USER_UPLOAD',
          sourceKey: (global as any).testSourceKey,
          metaKey: `test-meta/${randomUUID()}.json`
        })
      });

      const createResult = await createEnvelopeHandler(createEvent) as any;
      const createResponse = JSON.parse(createResult.body);
      const envelopeId = createResponse.data.id;

      // 2. Try to update with non-existent S3 key
      const updateResponse = await updateEnvelope(envelopeId, {
        sourceKey: 'non-existent-document.pdf'
      });

      // 3. Verify error response
      expect(updateResponse.statusCode).toBe(400);
      expect(updateResponse.data.message).toContain("Source document with key 'non-existent-document.pdf' does not exist in S3");
    });

    it('should update envelope expiration date', async () => {
      // 1. Create envelope first
      const createEvent = await makeAuthEvent({
        body: JSON.stringify({
          title: 'Test Document',
          description: 'Test Description',
          originType: 'USER_UPLOAD',
          sourceKey: (global as any).testSourceKey,
          metaKey: `test-meta/${randomUUID()}.json`
        })
      });

      const createResult = await createEnvelopeHandler(createEvent) as any;
      const createResponse = JSON.parse(createResult.body);
      const envelopeId = createResponse.data.id;

      // 2. Update expiration date
      const newExpirationDate = new Date('2024-12-31T23:59:59Z');
      const updateResponse = await updateEnvelope(envelopeId, {
        expiresAt: newExpirationDate.toISOString()
      });

      // 3. Verify response
      expect(updateResponse.statusCode).toBe(200);
      expect(new Date(updateResponse.data.expiresAt)).toEqual(newExpirationDate);

      // 4. Verify changes in database
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const envelope = await prisma.signatureEnvelope.findUnique({
        where: { id: envelopeId }
      });
      
      expect(envelope?.expiresAt).toEqual(newExpirationDate);
      
      await prisma.$disconnect();
    });
  });

  /*
  // TODO: Re-implement these tests after refactoring other handlers
  describe('GetEnvelope - Single Signer Workflow', () => {
    // Tests for GetEnvelopeHandler
  });

  describe('SignDocument - Single Signer Workflow', () => {
    // Tests for SignDocumentHandler
  });

  describe('DownloadSignedDocument - Single Signer Workflow', () => {
    // Tests for DownloadSignedDocumentHandler
  });

  describe('GetDocumentHistory - Single Signer Workflow', () => {
    // Tests for GetDocumentHistoryHandler
  });
  */
});