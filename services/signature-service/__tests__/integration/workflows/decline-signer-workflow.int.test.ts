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

// ✅ REFACTORED: Using centralized mock setup
import { setupDeclineSignerMock } from '../helpers/mockSetupHelper';
setupDeclineSignerMock();

import { WorkflowTestHelper } from '../helpers/workflowHelpers';
import { TestDataFactory } from '../helpers/testDataFactory';
import { generateTestIpAddress } from '../helpers/testHelpers';
import { 
  verifyInvitationTokens,
  clearSendEnvelopeMockData 
} from '../helpers/sendEnvelopeHelpers';
import { 
  verifySignatureInDatabase,
  verifyConsentRecord,
  verifyEnvelopeProgress,
  createTestConsent
} from '../helpers/signDocumentHelpers';
import {
  verifySignerDeclined,
  verifyDeclineAuditEvent,
  verifyDeclineNotificationEvent,
  verifyEnvelopeStatusAfterDecline,
  getDeclineVerificationSummary,
  clearDeclineMockData
} from '../helpers/declineSignerHelpers';

describe('Decline Signer Workflow Integration Tests', () => {
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

      // 7. Get comprehensive verification summary
      const summary = await getDeclineVerificationSummary(envelope.id);
      expect(summary.envelope.status).toBe('DECLINED');
      expect(summary.signers.find(s => s.id === signerIds[1])?.status).toBe('DECLINED');
      expect(summary.auditEvents.find(e => e.eventType === 'SIGNER_DECLINED')).toBeDefined();

      console.log('✅ Complete decline signer workflow with multiple signers handled successfully');
    });

    it('should handle decline with different reasons', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Different Reasons Decline Test Contract',
          description: 'Testing decline workflow with different reasons',
          signingOrderType: 'INVITEES_FIRST',
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
      const signerIds = addSignersResponse.data.signers.map((s: any) => s.id);

      // 3. Send envelope
      const sendResponse = await workflowHelper.sendEnvelope(envelopeId, {
        sendToAll: true
      });

      expect(sendResponse.statusCode).toBe(200);
      expect(sendResponse.data.status).toBe('READY_FOR_SIGNATURE');

      // 4. Get invitation tokens
      const invitationTokens = sendResponse.data.tokens.map((t: any) => t.token);

      // 5. First signer declines with one reason
      const declineReason1 = 'I do not agree with the terms';
      const declineResponse1 = await workflowHelper.declineSigner(
        envelopeId,
        signerIds[0],
        invitationTokens[0],
        declineReason1
      );

      expect(declineResponse1.statusCode).toBe(200);
      expect(declineResponse1.data.decline.reason).toBe(declineReason1);

      // 6. Second signer declines with different reason
      const declineReason2 = 'I need more time to review';
      const declineResponse2 = await workflowHelper.declineSigner(
        envelopeId,
        signerIds[1],
        invitationTokens[1],
        declineReason2
      );

      expect(declineResponse2.statusCode).toBe(200);
      expect(declineResponse2.data.decline.reason).toBe(declineReason2);

      // 7. Verify both declined signers
      await verifySignerDeclined(envelopeId, signerIds[0], declineReason1);
      await verifySignerDeclined(envelopeId, signerIds[1], declineReason2);

      console.log('✅ Decline with different reasons handled successfully');
    });
  });

  describe('Decline Edge Cases', () => {
    it('should prevent double decline (signer cannot decline twice)', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Double Decline Test Contract',
          description: 'Testing double decline prevention',
          signingOrderType: 'INVITEES_FIRST',
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
      expect(addSignersResponse.data.signers).toHaveLength(1);
      const signerIds = addSignersResponse.data.signers.map((s: any) => s.id);

      // 3. Send envelope
      const sendResponse = await workflowHelper.sendEnvelope(envelopeId, {
        sendToAll: true
      });

      expect(sendResponse.statusCode).toBe(200);
      expect(sendResponse.data.status).toBe('READY_FOR_SIGNATURE');

      // 4. Get invitation tokens
      const invitationTokens = sendResponse.data.tokens.map((t: any) => t.token);

      // 5. First decline
      const declineReason1 = 'First decline reason';
      const declineResponse1 = await workflowHelper.declineSigner(
        envelopeId,
        signerIds[0],
        invitationTokens[0],
        declineReason1
      );

      expect(declineResponse1.statusCode).toBe(200);
      expect(declineResponse1.data.decline.reason).toBe(declineReason1);

      // 6. Try to decline again with same token
      const declineReason2 = 'Second decline reason';
      const declineResponse2 = await workflowHelper.declineSigner(
        envelopeId,
        signerIds[0],
        invitationTokens[0],
        declineReason2
      );

      // 7. Verify error response
      expect(declineResponse2.statusCode).toBe(409);
      expect(declineResponse2.data.message).toContain('already declined');

      console.log('✅ Double decline prevention working');
    });
  });
});
