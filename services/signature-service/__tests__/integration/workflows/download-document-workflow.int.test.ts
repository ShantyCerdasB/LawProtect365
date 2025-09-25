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

// ✅ REFACTORED: Using centralized mock setup
import { setupReminderMock } from '../helpers/mockSetupHelper';
setupReminderMock();

import { WorkflowTestHelper } from '../helpers/workflowHelpers';
import { TestDataFactory } from '../helpers/testDataFactory';
import { generateTestIpAddress } from '../helpers/testHelpers';
import { 
  clearSendEnvelopeMockData 
} from '../helpers/sendEnvelopeHelpers';
import {
  verifyDownloadAuditEvent,
  verifyDownloadResponse,
  verifyDownloadWithCustomExpiration,
  verifyDownloadFailure,
  clearDownloadMockData
} from '../helpers/downloadDocumentHelpers';

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

      expect(downloadResponse.statusCode).toBe(200);
      expect(downloadResponse.data.success).toBe(true);
      expect(downloadResponse.data.downloadUrl).toBeDefined();
      expect(downloadResponse.data.expiresAt).toBeDefined();

      // 3. Verify download response
      verifyDownloadResponse(downloadResponse);
      
      // 4. Verify audit event was created for authenticated user
      await verifyDownloadAuditEvent(envelopeId, envelope.createdBy);
    });

    it('should download document for authenticated user in READY_FOR_SIGNATURE status', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Download Test Contract Ready',
          description: 'Testing download workflow in READY_FOR_SIGNATURE status',
          signingOrderType: 'OWNER_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      expect(envelope.id).toBeDefined();
      const envelopeId = envelope.id;

      // 2. Add signers
      const signers = TestDataFactory.createMultipleSigners(2, 1);
      const addSignersResponse = await workflowHelper.updateEnvelope(envelopeId, {
        addSigners: signers
      });

      expect(addSignersResponse.statusCode).toBe(200);
      expect(addSignersResponse.data.signers).toHaveLength(2);

      // 3. Send envelope
      const sendResponse = await workflowHelper.sendEnvelope(envelopeId, {
        sendToAll: true
      });
      expect(sendResponse.statusCode).toBe(200);
      expect(sendResponse.data.status).toBe('READY_FOR_SIGNATURE');

      // 4. Download document
      const downloadResponse = await workflowHelper.downloadDocument(envelopeId);

      expect(downloadResponse.statusCode).toBe(200);
      expect(downloadResponse.data.success).toBe(true);
      expect(downloadResponse.data.downloadUrl).toBeDefined();

      // 5. Verify download response
      verifyDownloadResponse(downloadResponse);
      
      // 6. Verify audit event was created for authenticated user
      await verifyDownloadAuditEvent(envelopeId, envelope.createdBy);
    });

    it('should download document for authenticated user in COMPLETED status', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Download Test Contract Completed',
          description: 'Testing download workflow in COMPLETED status',
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

      // 3. Send envelope
      const sendResponse = await workflowHelper.sendEnvelope(envelopeId, {
        sendToAll: true
      });
      expect(sendResponse.statusCode).toBe(200);

      // 4. Get invitation tokens
      expect(sendResponse.data.tokens).toBeDefined();
      expect(sendResponse.data.tokens).toHaveLength(1);
      const invitationTokens = sendResponse.data.tokens.map((t: any) => t.token);

      // 5. Sign the document to complete it
      const signResponse = await workflowHelper.signDocument(
        envelopeId,
        addSignersResponse.data.signers[0].id,
        invitationTokens[0],
        {
          given: true,
          timestamp: new Date().toISOString(),
          text: 'test-consent-text',
          ipAddress: generateTestIpAddress(),
          userAgent: 'test-user-agent',
          country: 'US'
        }
      );
      expect(signResponse.statusCode).toBe(200);
      expect(signResponse.data.envelope.status).toBe('COMPLETED');

      // 6. Download document
      const downloadResponse = await workflowHelper.downloadDocument(envelopeId);

      expect(downloadResponse.statusCode).toBe(200);
      expect(downloadResponse.data.success).toBe(true);
      expect(downloadResponse.data.downloadUrl).toBeDefined();

      // 7. Verify download response
      verifyDownloadResponse(downloadResponse);
      
      // 8. Verify audit event was created for authenticated user
      await verifyDownloadAuditEvent(envelopeId, envelope.createdBy);
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

      expect(downloadResponse.statusCode).toBe(200);
      expect(downloadResponse.data.success).toBe(true);
      expect(downloadResponse.data.downloadUrl).toBeDefined();

      // 6. Verify download response
      verifyDownloadResponse(downloadResponse);
      
      // 7. Verify audit event was created for external user
      const signer = addSignersResponse.data.signers[0];
      const externalUserId = `external-user:${signer.fullName || signer.email}`;
      await verifyDownloadAuditEvent(envelopeId, externalUserId, signer.email);
    });

    it('should download document with custom expiration time', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Custom Expiration Download Test Contract',
          description: 'Testing download workflow with custom expiration',
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

      // 3. Send envelope
      const sendResponse = await workflowHelper.sendEnvelope(envelopeId, {
        sendToAll: true
      });
      expect(sendResponse.statusCode).toBe(200);

      // 4. Verify tokens were generated
      expect(sendResponse.data.tokens).toBeDefined();
      expect(sendResponse.data.tokens).toHaveLength(1);

      // 5. Download document with custom expiration (30 minutes = 1800 seconds)
      const customExpiration = 1800;
      const downloadResponse = await workflowHelper.downloadDocumentWithCustomExpiration(envelopeId, customExpiration);

      expect(downloadResponse.statusCode).toBe(200);
      expect(downloadResponse.data.success).toBe(true);
      expect(downloadResponse.data.downloadUrl).toBeDefined();

      // 6. Verify download with custom expiration
      verifyDownloadWithCustomExpiration(downloadResponse, customExpiration);
      
      // 7. Verify audit event was created for authenticated user
      await verifyDownloadAuditEvent(envelopeId, workflowHelper.getTestUser().userId);
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
          description: 'Testing download with invalid invitation token',
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

      // 3. Send envelope
      const sendResponse = await workflowHelper.sendEnvelope(envelopeId, {
        sendToAll: true
      });
      expect(sendResponse.statusCode).toBe(200);

      // 4. Try to download with invalid token
      const invalidToken = 'invalid-token-12345';
      const downloadResponse = await workflowHelper.downloadDocumentWithToken(envelopeId, invalidToken);

      expect(downloadResponse.statusCode).toBe(401);
      expect(downloadResponse.data.message).toContain('Invalid invitation token');

      // 5. Verify download failure
      verifyDownloadFailure(downloadResponse, 401, 'Invalid invitation token');
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