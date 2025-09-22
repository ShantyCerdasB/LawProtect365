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

describe('Single-Signer Envelope Workflow Integration Tests', () => {
  const cfg = loadConfig();
  const s3 = new S3Client({
    region: cfg.region,
    endpoint: process.env.AWS_ENDPOINT_URL,
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test', secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test' }
  });

  // Use seeded test user from database
  const testUser = {
    userId: 'test-user-123', // This matches the seeded user ID
    email: 'test@example.com'
  };

  const makeAuthEvent = async (overrides?: any) => {
    const base = await createApiGatewayEvent({ 
      includeAuth: true, 
      requestContext: createTestRequestContext({ 
        userId: testUser.userId, 
        email: testUser.email, 
        userAgent: 'jest-test/1.0' 
      }) 
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

  beforeAll(async () => {
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
      expect(response).toMatchObject({
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
      (global as any).testEnvelopeId = response.id;
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
      expect(response).toMatchObject({
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

      expect(result.statusCode).toBe(400);
      
      const response = JSON.parse(result.body);
      expect(response.error).toContain('templateId and templateVersion are required when originType is TEMPLATE');
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