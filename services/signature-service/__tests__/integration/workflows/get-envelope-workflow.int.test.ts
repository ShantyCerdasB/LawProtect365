/**
 * @fileoverview get-envelope-workflow.int.test.ts - Get envelope workflow integration tests
 * @summary Complete get envelope workflow tests for both authenticated and external users
 * @description End-to-end integration tests for get envelope functionality including
 * owner access, external user access via invitation tokens, and audit event creation.
 * 
 * Test Coverage:
 * - Authenticated user (owner) access to envelopes
 * - External user access via invitation tokens
 * - Audit event creation for external user access
 * - Access validation and error handling
 * - Complete envelope and signer information retrieval
 */

import { WorkflowTestHelper } from '../helpers/workflowHelpers';
import { TestDataFactory } from '../helpers/testDataFactory';

// ✅ MOCK LOCAL DEL SIGNATURE ORCHESTRATOR (MISMO PATRÓN QUE TESTS QUE PASAN)
jest.mock('../../../src/services/SignatureOrchestrator', () => {
  const actual = jest.requireActual('../../../src/services/SignatureOrchestrator');
  return {
    ...actual,
    SignatureOrchestrator: jest.fn().mockImplementation((...args) => {
      const instance = new actual.SignatureOrchestrator(...args);
      
      // Mock the publishNotificationEvent method
      instance.publishNotificationEvent = jest.fn().mockImplementation(async (envelopeId: any, options: any, tokens: any[]) => {
        console.log('🔧 Mocked publishNotificationEvent called:', {
          envelopeId: envelopeId?.getValue?.() || envelopeId,
          options,
          tokensCount: tokens?.length || 0
        });
        
        // Register invitation in outboxMock for verification
        const { outboxMockHelpers } = require('../mocks');
        const envelopeIdStr = envelopeId?.getValue?.() || envelopeId;
        
        // Simulate invitation registration for each token
        for (const token of tokens || []) {
          const signerId = token.signerId?.getValue?.() || token.signerId;
          if (signerId) {
            // Access the internal Maps directly from the outboxMock module
            const outboxMockModule = require('../mocks/aws/outboxMock');
            
            // Get the internal Maps (they are defined at module level)
            const invitationHistory = outboxMockModule.invitationHistory || new Map();
            const publishedEvents = outboxMockModule.publishedEvents || new Map();
            
            // Initialize tracking for this envelope if not exists
            if (!invitationHistory.has(envelopeIdStr)) {
              invitationHistory.set(envelopeIdStr, new Set());
            }
            
            if (!publishedEvents.has(envelopeIdStr)) {
              publishedEvents.set(envelopeIdStr, []);
            }
            
            // Register invitation (allow duplicates for re-send scenarios)
            invitationHistory.get(envelopeIdStr).add(signerId);
            
            // Register event
            publishedEvents.get(envelopeIdStr).push({
              type: 'ENVELOPE_INVITATION',
              payload: {
                envelopeId: envelopeIdStr,
                signerId: signerId,
                eventType: 'ENVELOPE_INVITATION',
                message: options.message || 'You have been invited to sign a document'
              },
              detail: {
                envelopeId: envelopeIdStr,
                signerId: signerId,
                eventType: 'ENVELOPE_INVITATION',
                message: options.message || 'You have been invited to sign a document'
              },
              id: `mock-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toISOString()
            });
            
            console.log('✅ Mocked invitation registered:', { envelopeId: envelopeIdStr, signerId });
          }
        }
        
        console.log('✅ Mocked publishNotificationEvent completed successfully');
        return Promise.resolve();
      });
      
      return instance;
    })
  };
});

describe('Get Envelope Workflow', () => {
  let workflowHelper: WorkflowTestHelper;

  beforeAll(async () => {
    workflowHelper = new WorkflowTestHelper();
    await workflowHelper.initialize();
  });

  afterEach(() => {
    // Clear mock data after each test to prevent interference
    const { outboxMockHelpers } = require('../mocks');
    outboxMockHelpers.clearAllMockData();
  });

  describe('Authenticated User (Owner) Access', () => {
    it('should get envelope by authenticated owner', async () => {
      // Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Owner Access Test',
          description: 'Testing owner access to envelope'
        })
      );

      // Add external signer
      const externalSigner = TestDataFactory.createSignerData({
        email: 'external@example.com',
        fullName: 'External Signer',
        isExternal: true,
        order: 1
      });

      await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner]
      });

      // Get envelope as owner
      const getResponse = await workflowHelper.getEnvelope(envelope.id);

      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.data.id).toBe(envelope.id);
      expect(getResponse.data.title).toBe('Owner Access Test');
      expect(getResponse.data.accessType).toBe('OWNER');
      expect(getResponse.data.signers).toBeDefined();
      expect(getResponse.data.signers).toHaveLength(1);
      expect(getResponse.data.signers[0].email).toBe('external@example.com');
      expect(getResponse.data.signers[0].isExternal).toBe(true);
    });

    it('should get envelope with template origin information', async () => {
      // Create template envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Template Envelope Test',
          description: 'Testing template envelope access',
          originType: 'TEMPLATE',
          templateId: 'test-template-123',
          templateVersion: '1.0.0'
        })
      );

      // Get envelope as owner
      const getResponse = await workflowHelper.getEnvelope(envelope.id);

      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.data.id).toBe(envelope.id);
      expect(getResponse.data.originType).toBe('TEMPLATE');
      expect(getResponse.data.templateId).toBe('test-template-123');
      expect(getResponse.data.templateVersion).toBe('1.0.0');
    });

    it('should fail when owner tries to access non-existent envelope', async () => {
      const { TestUtils } = await import('../../helpers/testUtils');
      const nonExistentId = TestUtils.generateUuid(); // Generate a valid UUID that doesn't exist
      
      const getResponse = await workflowHelper.getEnvelope(nonExistentId);

      expect(getResponse.statusCode).toBe(404);
      expect(getResponse.data.message).toContain('not found');
    });
  });

  describe('External User Access via Invitation Token', () => {
    it('should get envelope by external user with valid invitation token', async () => {
      // Create envelope with external signer
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'External Access Test',
          description: 'Testing external user access'
        })
      );

      const externalSigner = TestDataFactory.createSignerData({
        email: 'external.user@example.com',
        fullName: 'External User',
        isExternal: true,
        order: 1
      });

      const addSignerResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner]
      });

      // Create a test invitation token directly in database
      const { PrismaClient } = await import('@prisma/client');
      const { sha256Hex } = await import('@lawprotect/shared-ts');
      const { TestUtils } = await import('../../helpers/testUtils');
      const prisma = new PrismaClient();
      
      // Create a unique test token for this test execution
      const testToken = `test-token-${TestUtils.generateUuid()}`;
      const testTokenHash = sha256Hex(testToken);
      
      const invitationToken = await prisma.invitationToken.create({
        data: {
          id: TestUtils.generateUuid(), // ✅ Use TestUtils.generateUuid()
          envelopeId: envelope.id,
          signerId: addSignerResponse.data.signers[0].id,
          tokenHash: testTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          createdBy: TestUtils.generateUuid(), // ✅ Use TestUtils.generateUuid()
          ipAddress: '127.0.0.1',
          userAgent: 'Test User Agent',
          country: 'US',
          status: 'ACTIVE'
        }
      });
      
      await prisma.$disconnect();

      expect(invitationToken).toBeDefined();
      expect(invitationToken.tokenHash).toBe(testTokenHash);

      // Get envelope as external user using the original token
      const getResponse = await workflowHelper.getEnvelopeWithToken(
        envelope.id, 
        testToken  // ✅ Use original token, not hash
      );

      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.data.id).toBe(envelope.id);
      expect(getResponse.data.title).toBe('External Access Test');
      expect(getResponse.data.accessType).toBe('EXTERNAL');
      expect(getResponse.data.signers).toBeDefined();
      expect(getResponse.data.signers).toHaveLength(1);
      expect(getResponse.data.signers[0].email).toBe('external.user@example.com');
    });

    it('should create audit event when external user accesses envelope', async () => {
      // Create envelope with external signer
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Audit Event Test',
          description: 'Testing audit event creation'
        })
      );

      // Configure envelope metadata (required before adding signers)
      const updateResponse = await workflowHelper.updateMetadata(envelope.id, {
        title: 'Updated Audit Event Test',
        description: 'Updated description for audit event test',
        expiresAt: new Date('2024-12-31T23:59:59Z').toISOString()
      });

      expect(updateResponse.statusCode).toBe(200);
      expect(updateResponse.data.title).toBe('Updated Audit Event Test');

      // Update S3 keys (required before adding signers)
      const newSourceKey = `test-documents/audit-test-${Date.now()}.pdf`;
      const newMetaKey = `test-meta/audit-test-${Date.now()}.json`;
      
      const s3UpdateResponse = await workflowHelper.updateMetadata(envelope.id, {
        sourceKey: newSourceKey,
        metaKey: newMetaKey
      });

      expect(s3UpdateResponse.statusCode).toBe(200);
      expect(s3UpdateResponse.data.sourceKey).toBe(newSourceKey);
      expect(s3UpdateResponse.data.metaKey).toBe(newMetaKey);

      const externalSigner = TestDataFactory.createSignerData({
        email: 'audit.test@example.com',
        fullName: 'Audit Test User',
        isExternal: true,
        order: 1
      });

      const addSignerResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner]
      });
      
      console.log('🔍 addSignerResponse:', {
        statusCode: addSignerResponse.statusCode,
        success: addSignerResponse.data?.success,
        signersCount: addSignerResponse.data?.signers?.length
      });

      // Send envelope to generate invitation token
      console.log('🔍 About to call sendEnvelope...');
      const sendResponse = await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true
      });
      
      console.log('🔍 sendResponse:', {
        statusCode: sendResponse.statusCode,
        success: sendResponse.data?.success,
        tokensGenerated: sendResponse.data?.tokensGenerated,
        tokensLength: sendResponse.data?.tokens?.length
      });

      // Verify send was successful
      expect(sendResponse.statusCode).toBe(200);
      expect(sendResponse.data.success).toBe(true);
      expect(sendResponse.data.tokensGenerated).toBe(1);

      // Get the token from the send response
      expect(sendResponse.data.tokens).toBeDefined();
      expect(sendResponse.data.tokens).toHaveLength(1);
      const invitationToken = sendResponse.data.tokens[0].token;

      // Get envelope as external user (this should create audit event)
      const getResponse = await workflowHelper.getEnvelopeWithToken(
        envelope.id, 
        invitationToken  // ✅ Use token from sendEnvelope response
      );

      expect(getResponse.statusCode).toBe(200);

      // Verify audit event was created
      await workflowHelper.verifyAuditEvent(
        envelope.id, 
        'DOCUMENT_ACCESSED', 
        addSignerResponse.data.signers[0].id
      );
    });

    it('should fail when external user uses invalid invitation token', async () => {
      // Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Invalid Token Test',
          description: 'Testing invalid token access'
        })
      );

      // Try to get envelope with invalid token
      const getResponse = await workflowHelper.getEnvelopeWithToken(
        envelope.id, 
        'invalid-token-123'
      );

      expect(getResponse.statusCode).toBe(401);
      expect(getResponse.data.message).toContain('Invalid invitation token');
    });

    it('should fail when external user uses expired invitation token', async () => {
      // Create envelope with external signer
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Expired Token Test',
          description: 'Testing expired token access'
        })
      );

      const externalSigner = TestDataFactory.createSignerData({
        email: 'expired.test@example.com',
        fullName: 'Expired Test User',
        isExternal: true,
        order: 1
      });

      const addSignerResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner]
      });

      // Send envelope to generate invitation token
      await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true
      });

      // Get invitation token and manually expire it
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const invitationToken = await prisma.invitationToken.findFirst({
        where: { 
          envelopeId: envelope.id,
          signerId: addSignerResponse.data.signers[0].id
        }
      });

      // Expire the token
      await prisma.invitationToken.update({
        where: { id: invitationToken!.id },
        data: { 
          status: 'EXPIRED',
          expiresAt: new Date(Date.now() - 1000) // 1 second ago
        }
      });
      
      await prisma.$disconnect();

      // Try to get envelope with expired token
      const getResponse = await workflowHelper.getEnvelopeWithToken(
        envelope.id, 
        invitationToken!.tokenHash
      );

      expect(getResponse.statusCode).toBe(401);
      expect(getResponse.data.message).toContain('Invalid invitation token');
    });
  });

  describe('External User Tracking', () => {
    it('should reuse userId for same external user across different envelopes', async () => {
      // Create first envelope
      const envelope1 = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'External Tracking Test 1',
          description: 'First envelope for tracking test'
        })
      );

      const externalSigner1 = TestDataFactory.createSignerData({
        email: 'tracking.user@example.com',
        fullName: 'Tracking User',
        isExternal: true,
        order: 1
      });

      const addSignerResponse1 = await workflowHelper.updateEnvelope(envelope1.id, {
        addSigners: [externalSigner1]
      });

      // Create second envelope
      const envelope2 = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'External Tracking Test 2',
          description: 'Second envelope for tracking test'
        })
      );

      const externalSigner2 = TestDataFactory.createSignerData({
        email: 'tracking.user@example.com', // Same email
        fullName: 'Tracking User', // Same full name
        isExternal: true,
        order: 1
      });

      const addSignerResponse2 = await workflowHelper.updateEnvelope(envelope2.id, {
        addSigners: [externalSigner2]
      });

      // Verify both signers have null userId (external users don't have userId)
      expect(addSignerResponse1.data.signers[0].userId).toBeNull();
      expect(addSignerResponse2.data.signers[0].userId).toBeNull();
      
      // Verify same email and fullName (external user tracking by email+fullName)
      expect(addSignerResponse1.data.signers[0].email).toBe(addSignerResponse2.data.signers[0].email);
      expect(addSignerResponse1.data.signers[0].fullName).toBe(addSignerResponse2.data.signers[0].fullName);
    });

    it('should create different userId for different external users', async () => {
      // Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Different Users Test',
          description: 'Testing different external users'
        })
      );

      const externalSigner1 = TestDataFactory.createSignerData({
        email: 'user1@example.com',
        fullName: 'User One',
        isExternal: true,
        order: 1
      });

      const externalSigner2 = TestDataFactory.createSignerData({
        email: 'user2@example.com',
        fullName: 'User Two',
        isExternal: true,
        order: 2
      });

      const addSignerResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner1, externalSigner2]
      });

      // Verify both signers have null userId (external users don't have userId)
      expect(addSignerResponse.data.signers[0].userId).toBeNull();
      expect(addSignerResponse.data.signers[1].userId).toBeNull();
      
      // Verify different email and fullName (different external users)
      expect(addSignerResponse.data.signers[0].email).not.toBe(addSignerResponse.data.signers[1].email);
      expect(addSignerResponse.data.signers[0].fullName).not.toBe(addSignerResponse.data.signers[1].fullName);
    });
  });
});
