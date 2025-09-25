/**
 * @fileoverview download-document-workflow.int.test.ts - Download document workflow integration tests
 * @summary Complete download document workflow tests
 * @description End-to-end integration tests for download document workflows including
 * authenticated users, external users with invitation tokens, and complete document lifecycle.
 * 
 * Test Coverage:
 * - Authenticated user download workflow
 * - External user download workflow with invitation tokens
 * - Download in different envelope states (DRAFT, READY_FOR_SIGNATURE, COMPLETED)
 * - Access validation and authorization
 * - Audit trail verification for downloads
 * - Error handling for invalid access
 * 
 * Note: Tests the complete download workflow using DownloadDocumentHandler.
 */

import { WorkflowTestHelper } from '../helpers/workflowHelpers';
import { TestDataFactory } from '../helpers/testDataFactory';
import { 
  verifyInvitationHistory, 
  verifyNoDuplicateInvitations, 
  verifyInvitationTokens,
  verifySignerReceivedInvitation,
  clearSendEnvelopeMockData 
} from '../helpers/sendEnvelopeHelpers';
import { 
  verifySignatureInDatabase,
  verifyConsentRecord,
  verifyEnvelopeCompletion,
  verifyEnvelopeProgress,
  verifySigningAuditEvent,
  createTestConsent,
  getSigningVerificationSummary
} from '../helpers/signDocumentHelpers';
import {
  verifyDownloadAuditEvent,
  verifyDownloadUrl,
  verifyDownloadExpiration,
  verifyDownloadResponse,
  verifyDownloadWithCustomExpiration,
  verifyDownloadFailure,
  getDownloadVerificationSummary,
  clearDownloadMockData
} from '../helpers/downloadDocumentHelpers';

// Mock SignatureOrchestrator.publishNotificationEvent to avoid OutboxRepository issues
jest.mock('../../../src/services/SignatureOrchestrator', () => {
  const actual = jest.requireActual('../../../src/services/SignatureOrchestrator');
  return {
    ...actual,
    SignatureOrchestrator: jest.fn().mockImplementation((...args) => {
      const instance = new actual.SignatureOrchestrator(...args);
      
      // Mock the publishNotificationEvent method
      instance.publishNotificationEvent = jest.fn().mockImplementation(async (envelopeId: any, options: any, tokens: any[]) => {
        
        // Register invitation in outboxMock for verification
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
            
          }
        }
        
        return Promise.resolve();
      });

      return instance;
    })
  };
});

describe('Download Document Workflow', () => {
  let workflowHelper: WorkflowTestHelper;

  beforeAll(async () => {
    workflowHelper = new WorkflowTestHelper();
    await workflowHelper.initialize();
  });

  afterEach(() => {
    clearSendEnvelopeMockData();
    clearDownloadMockData();
  });

  describe('Authenticated User Download', () => {
    it('should download document for authenticated user in DRAFT status', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Download Test Contract',
          description: 'Testing download workflow with authenticated user',
          signingOrderType: 'OWNER_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      expect(envelope.id).toBeDefined();
      const envelopeId = envelope.id;

      // 2. Download document
      const downloadResponse = await workflowHelper.downloadDocument(envelopeId);

      // 3. Verify download response
      verifyDownloadResponse(downloadResponse);
      
      // 4. Verify audit event was created
      await verifyDownloadAuditEvent(envelopeId, workflowHelper.getTestUser().userId);
    });

    it('should download document for authenticated user in COMPLETED status', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Completed Download Test Contract',
          description: 'Testing download workflow with completed envelope',
          signingOrderType: 'OWNER_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      expect(envelope.id).toBeDefined();
      const envelopeId = envelope.id;

      // 2. Add signer and complete envelope
      const signers = TestDataFactory.createMultipleSigners(1, 1);
      const addSignersResponse = await workflowHelper.updateEnvelope(envelopeId, {
        addSigners: signers
      });

      expect(addSignersResponse.statusCode).toBe(200);
      const signerIds = addSignersResponse.data.signers.map((s: any) => s.id);

      // 3. Send envelope
      const sendResponse = await workflowHelper.sendEnvelope(envelopeId, {
        sendToAll: true
      });
      expect(sendResponse.statusCode).toBe(200);

      // 4. Get invitation tokens and sign
      expect(sendResponse.data.tokens).toBeDefined();
      expect(sendResponse.data.tokens).toHaveLength(1);
      const invitationTokens = sendResponse.data.tokens.map((t: any) => t.token);

      const signResponse = await workflowHelper.signDocument(
        envelopeId,
        signerIds[0],
        invitationTokens[0],
        {
          given: true,
          timestamp: new Date().toISOString(),
          text: 'test-consent-text',
          ipAddress: '192.168.1.1',
          userAgent: 'test-user-agent',
          country: 'US'
        }
      );

      expect(signResponse.statusCode).toBe(200);
      expect(signResponse.data.envelope.status).toBe('COMPLETED');

      // 5. Download document
      const downloadResponse = await workflowHelper.downloadDocument(envelopeId);

      // 6. Verify download response
      verifyDownloadResponse(downloadResponse);
      
      // 7. Verify audit event was created
      await verifyDownloadAuditEvent(envelopeId, workflowHelper.getTestUser().userId);
    });
  });

  describe('External User Download', () => {
    it('should download document for external user with invitation token', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'External Download Test Contract',
          description: 'Testing download workflow with external user',
          signingOrderType: 'OWNER_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      expect(envelope.id).toBeDefined();
      const envelopeId = envelope.id;

      // 2. Add signer
      const signers = TestDataFactory.createMultipleSigners(1, 1);
      const addSignersResponse = await workflowHelper.updateEnvelope(envelopeId, {
        addSigners: signers
      });

      expect(addSignersResponse.statusCode).toBe(200);
      const signerIds = addSignersResponse.data.signers.map((s: any) => s.id);

      // 3. Send envelope
      const sendResponse = await workflowHelper.sendEnvelope(envelopeId, {
        sendToAll: true
      });
      expect(sendResponse.statusCode).toBe(200);

      // 4. Get invitation tokens
      expect(sendResponse.data.tokens).toBeDefined();
      expect(sendResponse.data.tokens).toHaveLength(1);
      const invitationTokens = sendResponse.data.tokens.map((t: any) => t.token);

      // 5. Download document with invitation token
      const downloadResponse = await workflowHelper.downloadDocumentWithToken(envelopeId, invitationTokens[0]);

      // 6. Verify download response
      verifyDownloadResponse(downloadResponse);
      
      // 7. Verify audit event was created for external user
      const signer = addSignersResponse.data.signers[0];
      const externalUserId = `external-user:${signer.fullName || signer.email}`;
      await verifyDownloadAuditEvent(envelopeId, externalUserId, signer.email);
    });
  });

  describe('Access Validation', () => {
    it('should prevent download by non-authorized user', async () => {
      // 1. Create envelope with user A
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Access Test Contract',
          description: 'Testing access validation for download',
          signingOrderType: 'OWNER_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      expect(envelope.id).toBeDefined();
      const envelopeId = envelope.id;

      // 2. Try to download with different user (user B)
      const nonAuthorizedUser = workflowHelper.getSecondTestUser();
      const token = await workflowHelper.generateTestJwtToken(nonAuthorizedUser.userId, nonAuthorizedUser.email);

      const downloadResponse = await workflowHelper.downloadDocumentWithToken(envelopeId, undefined, token);
      verifyDownloadFailure(downloadResponse, 403, 'Access denied to envelope');
    });

    it('should prevent download with invalid invitation token', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Invalid Token Test Contract',
          description: 'Testing invalid invitation token for download',
          signingOrderType: 'OWNER_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      expect(envelope.id).toBeDefined();
      const envelopeId = envelope.id;

      // 2. Try to download with invalid invitation token
      const downloadResponse = await workflowHelper.downloadDocumentWithToken(envelopeId, 'invalid-token');

      verifyDownloadFailure(downloadResponse, 401, 'Invalid invitation token');
    });
  });

  describe('Configuration and Expiration', () => {
    it('should download with custom expiration time', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Custom Expiration Test Contract',
          description: 'Testing custom expiration for download',
          signingOrderType: 'OWNER_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      expect(envelope.id).toBeDefined();
      const envelopeId = envelope.id;

      // 2. Download document with custom expiration (30 minutes = 1800 seconds)
      const customExpiration = 1800;
      const downloadResponse = await workflowHelper.downloadDocumentWithCustomExpiration(envelopeId, customExpiration);

      // 3. Verify download response with custom expiration
      verifyDownloadWithCustomExpiration(downloadResponse, customExpiration);
      
      // 4. Verify audit event was created
      await verifyDownloadAuditEvent(envelopeId, workflowHelper.getTestUser().userId);
    });

    it('should reject download with invalid expiration time (too short)', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Invalid Expiration Test Contract',
          description: 'Testing invalid expiration for download',
          signingOrderType: 'OWNER_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      expect(envelope.id).toBeDefined();
      const envelopeId = envelope.id;

      // 2. Try to download with invalid expiration (too short: 60 seconds, below minimum of 300)
      const invalidExpiration = 60;
      const downloadResponse = await workflowHelper.downloadDocumentWithCustomExpiration(envelopeId, invalidExpiration);

      // 3. Verify download failure
      verifyDownloadFailure(downloadResponse, 400, 'Expiration time must be within configured limits');
    });

    it('should reject download with invalid expiration time (too long)', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Invalid Expiration Test Contract 2',
          description: 'Testing invalid expiration for download (too long)',
          signingOrderType: 'OWNER_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      expect(envelope.id).toBeDefined();
      const envelopeId = envelope.id;

      // 2. Try to download with invalid expiration (too long: 2 days = 172800 seconds, above maximum of 86400)
      const invalidExpiration = 172800;
      const downloadResponse = await workflowHelper.downloadDocumentWithCustomExpiration(envelopeId, invalidExpiration);

      // 3. Verify download failure
      verifyDownloadFailure(downloadResponse, 400, 'Expiration time must be within configured limits');
    });
  });
});
