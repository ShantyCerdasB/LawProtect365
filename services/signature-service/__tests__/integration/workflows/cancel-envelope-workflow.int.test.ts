/**
 * @fileoverview cancel-envelope-workflow.int.test.ts - Cancel envelope workflow integration tests
 * @summary Complete cancel envelope workflow tests
 * @description End-to-end integration tests for cancel envelope workflows including
 * authorization validation, status transitions, and complete document lifecycle with cancellations.
 * 
 * Test Coverage:
 * - Envelope cancellation in DRAFT status
 * - Envelope cancellation in READY_FOR_SIGNATURE status
 * - Authorization validation (only creator can cancel)
 * - Status validation (cannot cancel completed/expired/declined envelopes)
 * - Audit event verification for cancellations
 * - Notification event verification for cancellations
 * - Complete audit trail verification for cancellations
 * 
 * Note: Tests the complete cancel workflow using all handlers:
 * CreateEnvelope, UpdateEnvelope, SendEnvelope, and CancelEnvelope.
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
  verifyEnvelopeCancelled,
  verifyCancellationAuditEvent,
  verifyCancellationNotificationEvent,
  getCancellationVerificationSummary,
  clearCancellationMockData
} from '../helpers/cancelEnvelopeHelpers';

// Mock SignatureOrchestrator.publishNotificationEvent and publishCancellationNotificationEvent to avoid OutboxRepository issues
jest.mock('../../../src/services/SignatureOrchestrator', () => {
  const actual = jest.requireActual('../../../src/services/SignatureOrchestrator');
  return {
    ...actual,
    SignatureOrchestrator: jest.fn().mockImplementation((...args) => {
      const instance = new actual.SignatureOrchestrator(...args);
      
      // Mock the publishNotificationEvent method
      instance.publishNotificationEvent = jest.fn().mockImplementation(async (envelopeId: any, options: any, tokens: any[]) => {
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
            
          }
        }
        
        return Promise.resolve();
      });

      // Mock the publishCancellationNotificationEvent method
      instance.publishCancellationNotificationEvent = jest.fn().mockImplementation(async (
        envelopeId: any, 
        userId: any, 
        securityContext: any
      ) => {
        // Register cancellation event in outboxMock for verification
        const outboxMockModule = require('../mocks/aws/outboxMock');
        const publishedEvents = outboxMockModule.publishedEvents || new Map();
        
        const envelopeIdStr = envelopeId?.getValue?.() || envelopeId;
        
        if (!publishedEvents.has(envelopeIdStr)) {
          publishedEvents.set(envelopeIdStr, []);
        }
        
        // Register cancellation event
        publishedEvents.get(envelopeIdStr).push({
          type: 'ENVELOPE_CANCELLED',
          payload: {
            envelopeId: envelopeIdStr,
            cancelledByUserId: userId,
            eventType: 'ENVELOPE_CANCELLED'
          },
          detail: {
            envelopeId: envelopeIdStr,
            cancelledByUserId: userId,
            eventType: 'ENVELOPE_CANCELLED'
          },
          id: `mock-cancel-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString()
        });
        
        return Promise.resolve();
      });

      return instance;
    })
  };
});

describe('Cancel Envelope Workflow', () => {
  let workflowHelper: WorkflowTestHelper;
  let testData: any;

  beforeAll(async () => {
    workflowHelper = new WorkflowTestHelper();
    await workflowHelper.initialize();
    testData = TestDataFactory.createTestData();
  });

  afterAll(async () => {
    await workflowHelper.cleanup();
  });

  beforeEach(async () => {
    // Clear mock data before each test
    await clearSendEnvelopeMockData();
    await clearCancellationMockData();
  });

  describe('Basic Cancel Envelope Workflow', () => {
    it('should cancel envelope in DRAFT status', async () => {
      // 1. Create envelope
      const createResponse = await workflowHelper.createEnvelope(
        testData.envelopeData.title,
        testData.envelopeData.description,
        testData.envelopeData.originType,
        testData.envelopeData.signingOrderType,
        testData.envelopeData.expiresAt,
        testData.envelopeData.sourceKey,
        testData.envelopeData.metaKey
      );

      expect(createResponse.statusCode).toBe(201);
      expect(createResponse.data.id).toBeDefined();
      expect(createResponse.data.status).toBe('DRAFT');

      const envelopeId = createResponse.data.id;

      // 2. Cancel envelope
      const cancelResponse = await workflowHelper.cancelEnvelope(envelopeId);

      expect(cancelResponse.statusCode).toBe(200);
      expect(cancelResponse.data.success).toBe(true);
      expect(cancelResponse.data.message).toBe('Envelope cancelled successfully');
      expect(cancelResponse.data.envelope.status).toBe('CANCELLED');
      expect(cancelResponse.data.envelope.id).toBe(envelopeId);

      // 3. Verify envelope is cancelled in database
      await verifyEnvelopeCancelled(envelopeId);

      // 4. Verify cancellation audit event
      await verifyCancellationAuditEvent(envelopeId, testData.userId);

      // 5. Verify cancellation notification event
      await verifyCancellationNotificationEvent(envelopeId, testData.userId);

      // 6. Get comprehensive verification summary
      const summary = await getCancellationVerificationSummary(envelopeId, testData.userId);
      expect(summary.envelope.status).toBe('CANCELLED');
      expect(summary.auditEvent.eventType).toBe('ENVELOPE_CANCELLED');
      expect(summary.notificationEvent.type).toBe('ENVELOPE_CANCELLED');
    });

    it('should cancel envelope in READY_FOR_SIGNATURE status', async () => {
      // 1. Create envelope
      const createResponse = await workflowHelper.createEnvelope(
        testData.envelopeData.title,
        testData.envelopeData.description,
        testData.envelopeData.originType,
        testData.envelopeData.signingOrderType,
        testData.envelopeData.expiresAt,
        testData.envelopeData.sourceKey,
        testData.envelopeData.metaKey
      );

      expect(createResponse.statusCode).toBe(201);
      const envelopeId = createResponse.data.id;

      // 2. Add signers
      const signerIds = await workflowHelper.addSignersToEnvelope(envelopeId, [
        { email: 'signer1@example.com', fullName: 'Signer One' },
        { email: 'signer2@example.com', fullName: 'Signer Two' }
      ]);

      expect(signerIds).toHaveLength(2);

      // 3. Send envelope
      const sendResponse = await workflowHelper.sendEnvelope(envelopeId);
      expect(sendResponse.statusCode).toBe(200);
      expect(sendResponse.data.envelope.status).toBe('READY_FOR_SIGNATURE');

      // 4. Cancel envelope
      const cancelResponse = await workflowHelper.cancelEnvelope(envelopeId);

      expect(cancelResponse.statusCode).toBe(200);
      expect(cancelResponse.data.success).toBe(true);
      expect(cancelResponse.data.envelope.status).toBe('CANCELLED');

      // 5. Verify envelope is cancelled in database
      await verifyEnvelopeCancelled(envelopeId);

      // 6. Verify cancellation audit event
      await verifyCancellationAuditEvent(envelopeId, testData.userId);

      // 7. Verify cancellation notification event
      await verifyCancellationNotificationEvent(envelopeId, testData.userId);
    });
  });

  describe('Authorization Validation', () => {
    it('should prevent cancellation by non-creator', async () => {
      // 1. Create envelope with user A
      const createResponse = await workflowHelper.createEnvelope(
        testData.envelopeData.title,
        testData.envelopeData.description,
        testData.envelopeData.originType,
        testData.envelopeData.signingOrderType,
        testData.envelopeData.expiresAt,
        testData.envelopeData.sourceKey,
        testData.envelopeData.metaKey
      );

      expect(createResponse.statusCode).toBe(201);
      const envelopeId = createResponse.data.id;

      // 2. Try to cancel with different user (simulate by changing userId in testData)
      const originalUserId = testData.userId;
      testData.userId = 'different-user-id';

      const cancelResponse = await workflowHelper.cancelEnvelope(envelopeId);

      expect(cancelResponse.statusCode).toBe(403);
      expect(cancelResponse.data.message).toContain('not authorized');

      // 3. Restore original userId
      testData.userId = originalUserId;

      // 4. Verify envelope is still in original status
      const envelope = await workflowHelper.getEnvelope(envelopeId);
      expect(envelope.data.status).toBe('DRAFT');
    });
  });

  describe('Status Validation', () => {
    it('should prevent cancellation of completed envelope', async () => {
      // 1. Create envelope
      const createResponse = await workflowHelper.createEnvelope(
        testData.envelopeData.title,
        testData.envelopeData.description,
        testData.envelopeData.originType,
        testData.envelopeData.signingOrderType,
        testData.envelopeData.expiresAt,
        testData.envelopeData.sourceKey,
        testData.envelopeData.metaKey
      );

      expect(createResponse.statusCode).toBe(201);
      const envelopeId = createResponse.data.id;

      // 2. Add signer
      const signerIds = await workflowHelper.addSignersToEnvelope(envelopeId, [
        { email: 'signer1@example.com', fullName: 'Signer One' }
      ]);

      // 3. Send envelope
      const sendResponse = await workflowHelper.sendEnvelope(envelopeId);
      expect(sendResponse.statusCode).toBe(200);

      // 4. Sign document (complete the envelope)
      const signResponse = await workflowHelper.signDocument(
        envelopeId,
        signerIds[0],
        'test-invitation-token',
        'test-consent-text',
        'test-ip-address',
        'test-user-agent',
        'test-country'
      );

      expect(signResponse.statusCode).toBe(200);
      expect(signResponse.data.envelope.status).toBe('COMPLETED');

      // 5. Try to cancel completed envelope
      const cancelResponse = await workflowHelper.cancelEnvelope(envelopeId);

      expect(cancelResponse.statusCode).toBe(409);
      expect(cancelResponse.data.message).toContain('completed');

      // 6. Verify envelope is still completed
      const envelope = await workflowHelper.getEnvelope(envelopeId);
      expect(envelope.data.status).toBe('COMPLETED');
    });

    it('should prevent cancellation of declined envelope', async () => {
      // 1. Create envelope
      const createResponse = await workflowHelper.createEnvelope(
        testData.envelopeData.title,
        testData.envelopeData.description,
        testData.envelopeData.originType,
        testData.envelopeData.signingOrderType,
        testData.envelopeData.expiresAt,
        testData.envelopeData.sourceKey,
        testData.envelopeData.metaKey
      );

      expect(createResponse.statusCode).toBe(201);
      const envelopeId = createResponse.data.id;

      // 2. Add signer
      const signerIds = await workflowHelper.addSignersToEnvelope(envelopeId, [
        { email: 'signer1@example.com', fullName: 'Signer One' }
      ]);

      // 3. Send envelope
      const sendResponse = await workflowHelper.sendEnvelope(envelopeId);
      expect(sendResponse.statusCode).toBe(200);

      // 4. Decline document
      const declineResponse = await workflowHelper.declineSigner(
        envelopeId,
        signerIds[0],
        'test-invitation-token',
        'Test decline reason'
      );

      expect(declineResponse.statusCode).toBe(200);
      expect(declineResponse.data.decline.envelopeStatus).toBe('DECLINED');

      // 5. Try to cancel declined envelope
      const cancelResponse = await workflowHelper.cancelEnvelope(envelopeId);

      expect(cancelResponse.statusCode).toBe(409);
      expect(cancelResponse.data.message).toContain('declined');

      // 6. Verify envelope is still declined
      const envelope = await workflowHelper.getEnvelope(envelopeId);
      expect(envelope.data.status).toBe('DECLINED');
    });
  });
});
