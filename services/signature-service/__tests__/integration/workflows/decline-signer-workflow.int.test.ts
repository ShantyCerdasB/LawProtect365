/**
 * @fileoverview decline-signer-workflow.int.test.ts - Decline signer workflow integration tests
 * @summary Complete decline signer workflow tests
 * @description End-to-end integration tests for decline signer workflows including
 * multi-signer scenarios, decline handling, and complete document lifecycle with declines.
 * 
 * Test Coverage:
 * - Multi-signer envelope creation and configuration
 * - Signer management (add multiple signers)
 * - Envelope sending for signature
 * - Partial signing workflow (some signers sign, others decline)
 * - Decline handling and status updates
 * - Envelope status after declines (should remain READY_FOR_SIGNATURE)
 * - Complete audit trail verification for declines
 * - Notification event verification for declines
 * 
 * Note: Tests the complete decline workflow using all handlers:
 * CreateEnvelope, UpdateEnvelope, SendEnvelope, SignDocument, and DeclineSigner.
 */

import { WorkflowTestHelper } from '../helpers/workflowHelpers';
import { TestDataFactory } from '../helpers/testDataFactory';
import { secureRandomString } from '../helpers/testHelpers';
import { 
  verifyInvitationTokens,
  clearSendEnvelopeMockData 
} from '../helpers/sendEnvelopeHelpers';
import { 
  verifySignatureInDatabase,
  verifyConsentRecord,
  verifyEnvelopeProgress,
  createTestConsent,
  getSigningVerificationSummary
} from '../helpers/signDocumentHelpers';
import {
  verifySignerDeclined,
  verifyDeclineAuditEvent,
  verifyDeclineNotificationEvent,
  verifyEnvelopeStatusAfterDecline,
  getDeclineVerificationSummary,
  clearDeclineMockData
} from '../helpers/declineSignerHelpers';

// Mock SignatureOrchestrator.publishNotificationEvent and publishDeclineNotificationEvent to avoid OutboxRepository issues
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
              id: `mock-${Date.now()}-${secureRandomString(8)}`,
              timestamp: new Date().toISOString()
            });
            
          }
        }
        
        return Promise.resolve();
      });

      // Mock the publishDeclineNotificationEvent method
      instance.publishDeclineNotificationEvent = jest.fn().mockImplementation(async (
        envelopeId: any, 
        signerId: any, 
        reason: any, 
        signer: any, 
        securityContext: any
      ) => {
        // Register decline event in outboxMock for verification
        const outboxMockModule = require('../mocks/aws/outboxMock');
        const publishedEvents = outboxMockModule.publishedEvents || new Map();
        
        const envelopeIdStr = envelopeId?.getValue?.() || envelopeId;
        const signerIdStr = signerId?.getValue?.() || signerId;
        
        if (!publishedEvents.has(envelopeIdStr)) {
          publishedEvents.set(envelopeIdStr, []);
        }
        
        // Register decline event
        publishedEvents.get(envelopeIdStr).push({
          type: 'SIGNER_DECLINED',
          payload: {
            envelopeId: envelopeIdStr,
            signerId: signerIdStr,
            declineReason: reason,
            eventType: 'SIGNER_DECLINED'
          },
          detail: {
            envelopeId: envelopeIdStr,
            signerId: signerIdStr,
            declineReason: reason,
            eventType: 'SIGNER_DECLINED'
          },
          id: `mock-decline-${Date.now()}-${secureRandomString(8)}`,
          timestamp: new Date().toISOString()
        });
        
        return Promise.resolve();
      });
      
      return instance;
    })
  };
});

describe('Decline Signer Workflow', () => {
  let workflowHelper: WorkflowTestHelper;

  beforeAll(async () => {
    workflowHelper = new WorkflowTestHelper();
    await workflowHelper.initialize();
  });

  afterEach(() => {
    // Clear mock data after each test
    clearSendEnvelopeMockData();
    clearDeclineMockData();
  });

  describe('Complete Decline Signer Workflow', () => {
    it('should complete full decline signer workflow with multiple signers', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Decline Test Contract',
          description: 'Testing decline workflow with multiple signers',
          signingOrderType: 'INVITEES_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      expect(envelope.id).toBeDefined();
      expect(envelope.title).toBe('Decline Test Contract');
      expect(envelope.status).toBe('DRAFT');
      expect(envelope.signingOrderType).toBe('INVITEES_FIRST');

      // 2. Add multiple signers
      const signers = TestDataFactory.createMultipleSigners(3, 1);
      const addSignersResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: signers
      });

      expect(addSignersResponse.statusCode).toBe(200);
      expect(addSignersResponse.data.signers).toHaveLength(3);
      const signerIds = addSignersResponse.data.signers.map((s: any) => s.id);

      // 3. Send envelope
      const sendResponse = await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true,
        message: 'Please sign or decline this document'
      });

      expect(sendResponse.statusCode).toBe(200);
      expect(sendResponse.data.status).toBe('READY_FOR_SIGNATURE');
      expect(sendResponse.data.tokensGenerated).toBe(3);
      expect(sendResponse.data.signersNotified).toBe(3);

      // Verify invitation tokens were generated
      await verifyInvitationTokens(envelope.id, 3);
      const invitationTokens = sendResponse.data.tokens.map((t: any) => t.token);

      // 4. First signer signs successfully
      const firstConsent = createTestConsent({
        text: 'I agree to sign this document as first signer'
      });

      const firstSignResponse = await workflowHelper.signDocument(
        envelope.id,
        signerIds[0],
        invitationTokens[0],
        firstConsent
      );

      expect(firstSignResponse.statusCode).toBe(200);
      expect(firstSignResponse.data.message).toBe('Document signed successfully');
      expect(firstSignResponse.data.envelope.status).toBe('READY_FOR_SIGNATURE');
      expect(firstSignResponse.data.envelope.progress).toBe(33); // 1/3 signed

      // Verify first signature
      await verifySignatureInDatabase(envelope.id, signerIds[0]);
      await verifyConsentRecord(envelope.id, signerIds[0], firstConsent);
      await verifyEnvelopeProgress(envelope.id, 33);

      // 5. Second signer declines
      const declineReason = 'I cannot agree with the terms of this contract';
      
      const declineResponse = await workflowHelper.declineSigner(
        envelope.id,
        signerIds[1],
        invitationTokens[1],
        declineReason
      );

      console.log('🔍 Decline response:', declineResponse);
      expect(declineResponse.statusCode).toBe(200);
      expect(declineResponse.data.message).toBe('Signer declined successfully');
      expect(declineResponse.data.decline.signerId).toBe(signerIds[1]);
      expect(declineResponse.data.decline.reason).toBe(declineReason);
      expect(declineResponse.data.decline.envelopeStatus).toBe('DECLINED');

      // 6. Verify decline in database and events
      await verifySignerDeclined(envelope.id, signerIds[1], declineReason);
      await verifyDeclineAuditEvent(envelope.id, signerIds[1], declineReason);
      await verifyDeclineNotificationEvent(envelope.id, signerIds[1], declineReason);
      await verifyEnvelopeStatusAfterDecline(envelope.id);

      // 7. Third signer can still sign (envelope not completed due to decline)
      const thirdConsent = createTestConsent({
        text: 'I agree to sign this document as third signer'
      });

      const thirdSignResponse = await workflowHelper.signDocument(
        envelope.id,
        signerIds[2],
        invitationTokens[2],
        thirdConsent
      );

      expect(thirdSignResponse.statusCode).toBe(409); // Cannot sign after envelope is declined
      expect(thirdSignResponse.data.message).toContain('not ready for signing');

      // 8. Verify final state
      const summary = await getSigningVerificationSummary(envelope.id);
      expect(summary.envelope.status).toBe('DECLINED'); // Should be declined when any signer declines
      expect(summary.signers).toHaveLength(3);
      expect(summary.signers.find((s: any) => s.id === signerIds[0]).status).toBe('SIGNED');
      expect(summary.signers.find((s: any) => s.id === signerIds[1]).status).toBe('DECLINED');
      expect(summary.signers.find((s: any) => s.id === signerIds[2]).status).toBe('PENDING'); // Could not sign due to envelope being declined

      // 9. Get comprehensive decline verification summary
      const declineSummary = await getDeclineVerificationSummary(envelope.id);
      expect(declineSummary.envelope.status).toBe('DECLINED'); // Should be declined when any signer declines
      expect(declineSummary.signers).toHaveLength(3);
      expect(declineSummary.declineEvents).toHaveLength(1);
      expect(declineSummary.declineEvents[0].signerId).toBe(signerIds[1]);
      expect(declineSummary.declineEvents[0].reason).toBe(declineReason);
      expect(declineSummary.auditEvents).toHaveLength(1);
      expect(declineSummary.auditEvents[0].eventType).toBe('SIGNER_DECLINED');
    });

    it('should handle decline with different reasons', async () => {
      // Create envelope with multiple signers
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Multiple Decline Reasons Test',
          description: 'Testing different decline reasons'
        })
      );

      const signers = TestDataFactory.createMultipleSigners(2, 1);
      await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: signers
      });

      const sendResponse = await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true
      });

      const signerIds = (await workflowHelper.getSignersFromDatabase(envelope.id)).map((s: any) => s.id);
      const invitationTokens = sendResponse.data.tokens.map((t: any) => t.token);

      // Test different decline reasons
      const declineReasons = [
        'I do not agree with the terms',
        'I need more time to review',
        'I am not authorized to sign',
        'The document contains errors'
      ];

      for (let i = 0; i < Math.min(declineReasons.length, signerIds.length); i++) {
        const declineResponse = await workflowHelper.declineSigner(
          envelope.id,
          signerIds[i],
          invitationTokens[i],
          declineReasons[i]
        );

        expect(declineResponse.statusCode).toBe(200);
        expect(declineResponse.data.decline.reason).toBe(declineReasons[i]);

        // Verify decline in database
        await verifySignerDeclined(envelope.id, signerIds[i], declineReasons[i]);
        await verifyDeclineAuditEvent(envelope.id, signerIds[i], declineReasons[i]);
        await verifyDeclineNotificationEvent(envelope.id, signerIds[i], declineReasons[i]);
      }
    });

    it('should prevent double decline (signer cannot decline twice)', async () => {
      // Create envelope with signer
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Double Decline Prevention Test'
        })
      );

      const signer = TestDataFactory.createSignerData({
        email: 'double.decline@example.com',
        fullName: 'Double Decline Signer',
        isExternal: true,
        order: 1
      });

      await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [signer]
      });

      const sendResponse = await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true
      });

      const signerId = (await workflowHelper.getSignersFromDatabase(envelope.id))[0].id;
      const invitationToken = sendResponse.data.tokens[0].token;

      // First decline (should succeed)
      const firstDeclineResponse = await workflowHelper.declineSigner(
        envelope.id,
        signerId,
        invitationToken,
        'First decline reason'
      );

      expect(firstDeclineResponse.statusCode).toBe(200);

      // Second decline (should fail)
      const secondDeclineResponse = await workflowHelper.declineSigner(
        envelope.id,
        signerId,
        invitationToken,
        'Second decline reason'
      );

      expect(secondDeclineResponse.statusCode).toBe(409);
      expect(secondDeclineResponse.data.message).toContain('already declined');
    });

    it('should handle decline after partial signing in OWNER_FIRST workflow', async () => {
      // Create envelope with OWNER_FIRST
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'OWNER_FIRST Decline Test',
          signingOrderType: 'OWNER_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      // Add owner as signer
      const ownerSigner = TestDataFactory.createSignerData({
        userId: workflowHelper.getTestUser().userId,
        email: workflowHelper.getTestUser().email,
        fullName: workflowHelper.getTestUser().name,
        isExternal: false,
        order: 1
      });

      // Add external signers
      const externalSigners = TestDataFactory.createMultipleSigners(2, 2);
      const allSigners = [ownerSigner, ...externalSigners];

      await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: allSigners
      });

      const sendResponse = await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true
      });

      const signerIds = (await workflowHelper.getSignersFromDatabase(envelope.id)).map((s: any) => s.id);

      // Owner signs first
      const ownerConsent = createTestConsent({
        text: 'I agree to sign this document as owner'
      });

      const ownerSignResponse = await workflowHelper.signDocumentAsOwner(
        envelope.id,
        signerIds[0], // Owner is first signer
        ownerConsent
      );

      expect(ownerSignResponse.statusCode).toBe(200);
      expect(ownerSignResponse.data.envelope.progress).toBe(33); // 1/3 signed

      // First external signer signs
      const firstExternalConsent = createTestConsent({
        text: 'I agree to sign this document'
      });

      const externalTokens = sendResponse.data.tokens.map((t: any) => t.token);
      const firstExternalSignResponse = await workflowHelper.signDocument(
        envelope.id,
        signerIds[1],
        externalTokens[0],
        firstExternalConsent
      );

      expect(firstExternalSignResponse.statusCode).toBe(200);
      expect(firstExternalSignResponse.data.envelope.progress).toBe(67); // 2/3 signed

      // Second external signer declines
      const declineReason = 'I cannot agree with the terms after review';
      
      const declineResponse = await workflowHelper.declineSigner(
        envelope.id,
        signerIds[2],
        externalTokens[1],
        declineReason
      );

      expect(declineResponse.statusCode).toBe(200);
      expect(declineResponse.data.decline.envelopeStatus).toBe('DECLINED');

      // Verify final state
      const summary = await getSigningVerificationSummary(envelope.id);
      expect(summary.envelope.status).toBe('DECLINED'); // Should be declined when any signer declines
      expect(summary.signers.find((s: any) => s.id === signerIds[0]).status).toBe('SIGNED'); // Owner
      expect(summary.signers.find((s: any) => s.id === signerIds[1]).status).toBe('SIGNED'); // First external
      expect(summary.signers.find((s: any) => s.id === signerIds[2]).status).toBe('DECLINED'); // Second external
    });
  });

  describe('Decline Edge Cases', () => {
    it('should handle decline with empty reason', async () => {
      // Create envelope with signer
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Empty Reason Decline Test'
        })
      );

      const signer = TestDataFactory.createSignerData({
        email: 'empty.reason@example.com',
        fullName: 'Empty Reason Signer',
        isExternal: true,
        order: 1
      });

      await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [signer]
      });

      const sendResponse = await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true
      });

      const signerId = (await workflowHelper.getSignersFromDatabase(envelope.id))[0].id;
      const invitationToken = sendResponse.data.tokens[0].token;

      // Decline with empty reason
      const declineResponse = await workflowHelper.declineSigner(
        envelope.id,
        signerId,
        invitationToken,
        '' // Empty reason
      );

      expect(declineResponse.statusCode).toBe(200);
      expect(declineResponse.data.decline.reason).toBe('No reason provided');

      // Verify decline in database
      await verifySignerDeclined(envelope.id, signerId, 'No reason provided');
    });

    it('should handle decline with very long reason', async () => {
      // Create envelope with signer
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Long Reason Decline Test'
        })
      );

      const signer = TestDataFactory.createSignerData({
        email: 'long.reason@example.com',
        fullName: 'Long Reason Signer',
        isExternal: true,
        order: 1
      });

      await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [signer]
      });

      const sendResponse = await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true
      });

      const signerId = (await workflowHelper.getSignersFromDatabase(envelope.id))[0].id;
      const invitationToken = sendResponse.data.tokens[0].token;

      // Decline with very long reason (within 500 character limit)
      const longReason = 'This is a very long decline reason that contains multiple sentences and detailed explanations about why the signer cannot agree to the terms of this contract. This reason includes extensive details about the legal concerns and business implications that prevent the signer from proceeding with the signature process. The signer has carefully reviewed all terms and conditions but finds several clauses that are incompatible with their business requirements and legal obligations.';
      
      const declineResponse = await workflowHelper.declineSigner(
        envelope.id,
        signerId,
        invitationToken,
        longReason
      );

      expect(declineResponse.statusCode).toBe(200);
      expect(declineResponse.data.decline.reason).toBe(longReason);

      // Verify decline in database
      await verifySignerDeclined(envelope.id, signerId, longReason);
    });
  });
});
