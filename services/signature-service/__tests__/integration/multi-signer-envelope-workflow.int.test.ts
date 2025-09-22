/**
 * @file multi-signer-envelope-workflow.int.test.ts
 * @summary Comprehensive multi-signer envelope workflow integration tests
 * @description Tests complete multi-signer envelope workflows including business rule validations,
 * signing order enforcement, non-responsive signer management, and document access controls.
 * 
 * Test Coverage:
 * - INVITEES_FIRST signing order validation
 * - OWNER_FIRST signing order validation  
 * - Non-responsive signer removal workflows
 * - Document access and download permissions
 * - Complete audit trail verification
 * - Business rule enforcement across all scenarios
 * 
 * @deprecated Most test content is temporarily commented out during refactoring.
 * Currently only tests CreateEnvelope functionality with seeded test user.
 */

import { randomUUID, createHash } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { loadConfig } from '../../src/config';
import { createApiGatewayEvent, generateTestPdf, generateTestJwtToken } from './helpers/testHelpers';
import { createEnvelopeHandler } from '../../src/handlers/envelopes/CreateEnvelopeHandler';

describe('Multi-Signer Envelope Workflow Integration Tests', () => {
  const cfg = loadConfig();
  const s3 = new S3Client({
    region: cfg.region,
    endpoint: process.env.AWS_ENDPOINT_URL,
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
    const token = await generateTestJwtToken({ 
      sub: testUser.userId, 
      email: testUser.email, 
      roles: ['admin'], 
      scopes: [] 
    });
    
    const base = await createApiGatewayEvent({ 
      includeAuth: false, 
      authToken: token,
      headers: {
        'x-country': 'US',
        'x-forwarded-for': '127.0.0.1'
      }
    });
    
    return { ...base, ...overrides };
  };


  describe('CreateEnvelope - Multi Signer Workflow', () => {
    it('should create envelope with OWNER_FIRST signing order', async () => {
      const event = await makeAuthEvent({
        body: JSON.stringify({
          title: 'Test Multi Signer Envelope - Owner First',
          description: 'Integration test for multi signer envelope with owner first',
          signingOrderType: 'OWNER_FIRST',
          originType: 'TEMPLATE',
          templateId: 'multi-signer-template-123',
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
        title: 'Test Multi Signer Envelope - Owner First',
        description: 'Integration test for multi signer envelope with owner first',
        status: 'DRAFT',
        signingOrderType: 'OWNER_FIRST',
        originType: 'TEMPLATE',
        createdBy: testUser.userId,
        templateId: 'multi-signer-template-123',
        templateVersion: '1.0.0'
      });

      // Store envelope ID for potential future tests
      (global as any).testEnvelopeIdOwnerFirst = response.data.id;
    });

    it('should create envelope with INVITEES_FIRST signing order', async () => {
      const event = await makeAuthEvent({
        body: JSON.stringify({
          title: 'Test Multi Signer Envelope - Invitees First',
          description: 'Integration test for multi signer envelope with invitees first',
          signingOrderType: 'INVITEES_FIRST',
          originType: 'TEMPLATE',
          templateId: 'multi-signer-template-456',
          templateVersion: '2.0.0',
          sourceKey: (global as any).testSourceKey,
          metaKey: `test-meta/${randomUUID()}.json`
        })
      });

      const result = await createEnvelopeHandler(event) as any;

      expect(result.statusCode).toBe(201);
      
      const response = JSON.parse(result.body);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        title: 'Test Multi Signer Envelope - Invitees First',
        description: 'Integration test for multi signer envelope with invitees first',
        status: 'DRAFT',
        signingOrderType: 'INVITEES_FIRST',
        originType: 'TEMPLATE',
        createdBy: testUser.userId,
        templateId: 'multi-signer-template-456',
        templateVersion: '2.0.0'
      });

      // Store envelope ID for potential future tests
      (global as any).testEnvelopeIdInviteesFirst = response.data.id;
    });

    it('should create envelope with template origin and multiple signers', async () => {
      const event = await makeAuthEvent({
        body: JSON.stringify({
          title: 'Test Multi Signer Template Envelope',
          description: 'Integration test for multi signer template envelope',
          // signingOrderType is optional, defaults to OWNER_FIRST
          originType: 'TEMPLATE',
          templateId: 'multi-signer-template-789',
          templateVersion: '3.0.0',
          sourceKey: (global as any).testSourceKey,
          metaKey: `test-meta/${randomUUID()}.json`
        })
      });

      const result = await createEnvelopeHandler(event) as any;

      expect(result.statusCode).toBe(201);
      
      const response = JSON.parse(result.body);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        title: 'Test Multi Signer Template Envelope',
        description: 'Integration test for multi signer template envelope',
        status: 'DRAFT',
        signingOrderType: 'OWNER_FIRST',
        originType: 'TEMPLATE',
        templateId: 'multi-signer-template-789',
        templateVersion: '3.0.0',
        createdBy: testUser.userId
      });
    });

    it('should validate template fields for template origin', async () => {
      const event = await makeAuthEvent({
        body: JSON.stringify({
          title: 'Test Invalid Multi Signer Template',
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

  /*
  // TODO: Re-implement these tests after refactoring other handlers
  describe('SendEnvelope - Multi Signer Workflow', () => {
    // Tests for SendEnvelopeHandler
  });

  describe('GetEnvelope - Multi Signer Workflow', () => {
    // Tests for GetEnvelopeHandler
  });

  describe('SignDocument - Multi Signer Workflow', () => {
    // Tests for SignDocumentHandler with multiple signers
  });

  describe('DeclineSigner - Multi Signer Workflow', () => {
    // Tests for DeclineSignerHandler
  });

  describe('UpdateEnvelope - Multi Signer Workflow', () => {
    // Tests for UpdateEnvelopeHandler
  });

  describe('DeleteEnvelope - Multi Signer Workflow', () => {
    // Tests for DeleteEnvelopeHandler
  });

  describe('SendNotification - Multi Signer Workflow', () => {
    // Tests for SendNotificationHandler
  });

  describe('ViewDocument - Multi Signer Workflow', () => {
    // Tests for ViewDocumentHandler
  });

  describe('DownloadSignedDocument - Multi Signer Workflow', () => {
    // Tests for DownloadSignedDocumentHandler
  });

  describe('GetDocumentHistory - Multi Signer Workflow', () => {
    // Tests for GetDocumentHistoryHandler
  });
  */
});
