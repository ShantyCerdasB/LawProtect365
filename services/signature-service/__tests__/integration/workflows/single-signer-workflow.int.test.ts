/**
 * @fileoverview single-signer-workflow.int.test.ts - Single-signer envelope workflow integration tests
 * @summary Complete single-signer document signing workflow tests
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
 * Note: Currently only tests CreateEnvelope and UpdateEnvelope functionality.
 * Other handlers (GetEnvelope, SignDocument, etc.) are commented out until implementation.
 */

import { WorkflowTestHelper, TestDataFactory } from '../helpers/workflowHelpers';
import { 
  verifyInvitationHistory, 
  verifyNoDuplicateInvitations, 
  verifyInvitationTokens,
  verifySignerReceivedInvitation,
  clearSendEnvelopeMockData 
} from '../helpers/sendEnvelopeHelpers';

// Mock SignatureOrchestrator.publishNotificationEvent to avoid OutboxRepository issues
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
            
            // Register invitation
            invitationHistory.get(envelopeIdStr).add(signerId);
            
            // Register event
            publishedEvents.get(envelopeIdStr).push({
              type: 'ENVELOPE_INVITATION',
              payload: {
                envelopeId: envelopeIdStr,
                signerId: signerId,
                eventType: 'ENVELOPE_INVITATION',
                message: options.message || 'Please sign this document'
              },
              detail: {
                envelopeId: envelopeIdStr,
                signerId: signerId,
                eventType: 'ENVELOPE_INVITATION',
                message: options.message || 'Please sign this document'
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

describe('Single-Signer Document Signing Workflow', () => {
  let workflowHelper: WorkflowTestHelper;

  beforeAll(async () => {
    workflowHelper = new WorkflowTestHelper();
    await workflowHelper.initialize();
  });

  afterEach(() => {
    // Clear mock data after each test
    clearSendEnvelopeMockData();
  });

  describe('Complete Single-Signer Workflow', () => {
    it('should complete full single-signer document signing workflow', async () => {
      // Create envelope
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'Single Signer Contract',
        description: 'Complete workflow test for single signer',
        signingOrderType: 'OWNER_FIRST',
        originType: 'USER_UPLOAD'
      });

      const envelope = await workflowHelper.createEnvelope(envelopeData);
      
      expect(envelope.id).toBeDefined();
      expect(envelope.title).toBe('Single Signer Contract');
      expect(envelope.status).toBe('DRAFT');
      expect(envelope.signingOrderType).toBe('OWNER_FIRST');
      expect(envelope.createdBy).toBe(workflowHelper.getTestUser().userId);

      // Configure envelope metadata
      const updateResponse = await workflowHelper.updateMetadata(envelope.id, {
        title: 'Updated Single Signer Contract',
        description: 'Updated description for single signer workflow',
        expiresAt: new Date('2024-12-31T23:59:59Z').toISOString()
      });

      expect(updateResponse.statusCode).toBe(200);
      expect(updateResponse.data.title).toBe('Updated Single Signer Contract');
      expect(updateResponse.data.description).toBe('Updated description for single signer workflow');

      // Update S3 keys
      const newSourceKey = `test-documents/${Date.now()}.pdf`;
      const newMetaKey = `test-meta/${Date.now()}.json`;
      
      const s3UpdateResponse = await workflowHelper.updateMetadata(envelope.id, {
        sourceKey: newSourceKey,
        metaKey: newMetaKey
      });

      expect(s3UpdateResponse.statusCode).toBe(200);
      expect(s3UpdateResponse.data.sourceKey).toBe(newSourceKey);
      expect(s3UpdateResponse.data.metaKey).toBe(newMetaKey);

      // Verify changes in database
      const dbEnvelope = await workflowHelper.getEnvelopeFromDatabase(envelope.id);
      expect(dbEnvelope?.title).toBe('Updated Single Signer Contract');
      expect(dbEnvelope?.description).toBe('Updated description for single signer workflow');
      expect(dbEnvelope?.sourceKey).toBe(newSourceKey);
      expect(dbEnvelope?.metaKey).toBe(newMetaKey);

      // Add external signer for single-signer workflow
      const externalSigner = TestDataFactory.createSignerData({
        email: 'external.signer@example.com',
        fullName: 'External Signer',
        isExternal: true,
        order: 1
      });

      const addSignerResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner]
      });

      expect(addSignerResponse.statusCode).toBe(200);
      expect(addSignerResponse.data.signers).toBeDefined();
      expect(addSignerResponse.data.signers).toHaveLength(1);
      expect(addSignerResponse.data.signers[0].email).toBe('external.signer@example.com');

      // Send envelope for signing
      const sendResponse = await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true,
        message: 'Please sign this single-signer contract'
      });

      expect(sendResponse.statusCode).toBe(200);
      expect(sendResponse.data.success).toBe(true);
      expect(sendResponse.data.status).toBe('READY_FOR_SIGNATURE');
      expect(sendResponse.data.tokensGenerated).toBe(1);
      expect(sendResponse.data.signersNotified).toBe(1);

      // Verify invitation was sent to external signer
      await verifySignerReceivedInvitation(
        envelope.id,
        addSignerResponse.data.signers[0].id,
        'Please sign this single-signer contract'
      );

      // Verify no duplicate invitations
      await verifyNoDuplicateInvitations(envelope.id);

      // Verify invitation tokens were generated
      await verifyInvitationTokens(envelope.id, 1);

      // TODO: Implement when handlers are available
      // Sign document
      // Complete envelope
      // Download signed document
    });

    it('should complete single-signer workflow with template origin', async () => {
      // Create envelope from template
      const templateEnvelopeData = TestDataFactory.createEnvelopeData({
        title: 'Template-Based Single Signer Contract',
        description: 'Single signer workflow using template',
        signingOrderType: 'OWNER_FIRST',
        originType: 'TEMPLATE',
        templateId: 'single-signer-template-123',
        templateVersion: '1.0.0'
      });

      const envelope = await workflowHelper.createEnvelope(templateEnvelopeData);
      
      expect(envelope.id).toBeDefined();
      expect(envelope.title).toBe('Template-Based Single Signer Contract');
      expect(envelope.originType).toBe('TEMPLATE');
      expect(envelope.templateId).toBe('single-signer-template-123');
      expect(envelope.templateVersion).toBe('1.0.0');

      // Customize template envelope
      const customizeResponse = await workflowHelper.updateMetadata(envelope.id, {
        title: 'Customized Template Contract',
        description: 'Personalized single signer contract from template'
      });

      expect(customizeResponse.statusCode).toBe(200);
      expect(customizeResponse.data.title).toBe('Customized Template Contract');

      // Verify template information is maintained
      const dbEnvelope = await workflowHelper.getEnvelopeFromDatabase(envelope.id);
      expect(dbEnvelope?.templateId).toBe('single-signer-template-123');
      expect(dbEnvelope?.templateVersion).toBe('1.0.0');

      // TODO: Implement when handlers are available
      // Send envelope for signing
      // Sign document
      // Complete envelope
      // Download signed document
    });
  });

  describe('Single-Signer Send Envelope Workflow', () => {
    it('should send envelope to external signer with custom message', async () => {
      // Create envelope with external signer only (owner not signing)
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Single Signer Send Test',
          description: 'Testing send envelope functionality'
        })
      );

      // Add external signer
      const externalSigner = TestDataFactory.createSignerData({
        email: 'single.signer@example.com',
        fullName: 'Single Signer',
        isExternal: true,
        order: 1
      });

      const addSignerResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner]
      });

      expect(addSignerResponse.data.signers).toBeDefined();
      const signerId = addSignerResponse.data.signers[0].id;

      // Send envelope with custom message
      const sendResponse = await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true,
        message: 'Custom message for single signer'
      });

      expect(sendResponse.statusCode).toBe(200);
      expect(sendResponse.data.success).toBe(true);
      expect(sendResponse.data.status).toBe('READY_FOR_SIGNATURE');
      expect(sendResponse.data.tokensGenerated).toBe(1);
      expect(sendResponse.data.signersNotified).toBe(1);

      // Verify invitation with custom message
      await verifySignerReceivedInvitation(
        envelope.id,
        signerId,
        'Custom message for single signer'
      );

      // Verify no duplicate invitations
      await verifyNoDuplicateInvitations(envelope.id);
    });

    it('should send envelope with default message when no message provided', async () => {
      // Create envelope with external signer
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Default Message Test',
          description: 'Testing default message functionality'
        })
      );

      // Add external signer
      const externalSigner = TestDataFactory.createSignerData({
        email: 'default.signer@example.com',
        fullName: 'Default Signer',
        isExternal: true,
        order: 1
      });

      const addSignerResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner]
      });

      expect(addSignerResponse.data.signers).toBeDefined();
      const signerId = addSignerResponse.data.signers[0].id;

      // Send with sendToAll: true (no custom message)
      const sendResponse = await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true
      });

      expect(sendResponse.statusCode).toBe(200);
      expect(sendResponse.data.success).toBe(true);

      // Verify default message
      await verifySignerReceivedInvitation(
        envelope.id,
        signerId,
        'You have been invited to sign a document'
      );
    });

    it('should handle envelope already in READY_FOR_SIGNATURE state', async () => {
      // Create envelope and send it (DRAFT → READY_FOR_SIGNATURE)
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Re-send Test',
          description: 'Testing re-send functionality'
        })
      );

      // Add external signer
      const externalSigner = TestDataFactory.createSignerData({
        email: 'resend.signer@example.com',
        fullName: 'Re-send Signer',
        isExternal: true,
        order: 1
      });

      const addSignerResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner]
      });

      expect(addSignerResponse.data.signers).toBeDefined();
      const signerId = addSignerResponse.data.signers[0].id;

      // First send
      const firstSendResponse = await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true,
        message: 'First invitation'
      });

      expect(firstSendResponse.statusCode).toBe(200);
      expect(firstSendResponse.data.status).toBe('READY_FOR_SIGNATURE');

      // Second send (should remain READY_FOR_SIGNATURE)
      const secondSendResponse = await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true,
        message: 'Second invitation'
      });

      expect(secondSendResponse.statusCode).toBe(200);
      expect(secondSendResponse.data.status).toBe('READY_FOR_SIGNATURE');

      // Verify both invitations were sent (no duplicate prevention in this case)
      // This tests that the system allows re-sending invitations
      const invitationEvents = await verifyInvitationHistory(envelope.id, [
        {
          signerId,
          message: 'First invitation',
          eventType: 'ENVELOPE_INVITATION'
        },
        {
          signerId,
          message: 'Second invitation',
          eventType: 'ENVELOPE_INVITATION'
        }
      ]);
    });
  });

  describe('Single-Signer Edge Cases', () => {
    it('should handle envelope creation with minimal data', async () => {
      const minimalEnvelopeData = TestDataFactory.createEnvelopeData({
        title: 'Minimal Single Signer',
        description: 'Minimal data test'
      });

      const envelope = await workflowHelper.createEnvelope(minimalEnvelopeData);
      
      expect(envelope.id).toBeDefined();
      expect(envelope.title).toBe('Minimal Single Signer');
      expect(envelope.signingOrderType).toBe('OWNER_FIRST'); // Default value
    });

    it('should handle multiple metadata updates in sequence', async () => {
      // Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Sequential Updates Test',
          description: 'Testing multiple updates'
        })
      );

      // First update
      await workflowHelper.updateMetadata(envelope.id, {
        title: 'First Update',
        description: 'First description update'
      });

      // Second update
      await workflowHelper.updateMetadata(envelope.id, {
        title: 'Second Update',
        description: 'Second description update'
      });

      // Third update
      const finalUpdate = await workflowHelper.updateMetadata(envelope.id, {
        title: 'Final Update',
        description: 'Final description update'
      });

      expect(finalUpdate.statusCode).toBe(200);
      expect(finalUpdate.data.title).toBe('Final Update');
      expect(finalUpdate.data.description).toBe('Final description update');

      // Verify final state in database
      const dbEnvelope = await workflowHelper.getEnvelopeFromDatabase(envelope.id);
      expect(dbEnvelope?.title).toBe('Final Update');
      expect(dbEnvelope?.description).toBe('Final description update');
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
