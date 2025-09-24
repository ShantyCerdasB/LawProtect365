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
        
        if (!publishedEvents.has(envelopeIdStr)) {
          publishedEvents.set(envelopeIdStr, []);
        }
        
        // Register decline event
        publishedEvents.get(envelopeIdStr).push({
          type: 'SIGNER_DECLINED',
          payload: {
            envelopeId: envelopeIdStr,
            signerId: signerId?.getValue?.() || signerId,
            declineReason: reason,
            eventType: 'SIGNER_DECLINED'
          },
          detail: {
            envelopeId: envelopeIdStr,
            signerId: signerId?.getValue?.() || signerId,
            declineReason: reason,
            eventType: 'SIGNER_DECLINED'
          },
          id: `mock-decline-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString()
        });
        
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

  beforeAll(async () => {
    workflowHelper = new WorkflowTestHelper();
    await workflowHelper.initialize();
  });

  afterEach(() => {
    // Clear mock data after each test
    clearSendEnvelopeMockData();
    clearCancellationMockData();
  });

  describe('Basic Cancel Envelope Workflow', () => {
    it('should cancel envelope in DRAFT status', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Cancel Test Contract',
          description: 'Testing cancel workflow in DRAFT status',
          signingOrderType: 'OWNER_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      expect(envelope.id).toBeDefined();
      expect(envelope.status).toBe('DRAFT');
      expect(envelope.title).toBe('Cancel Test Contract');

      const envelopeId = envelope.id;

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
      await verifyCancellationAuditEvent(envelopeId, envelope.createdBy);

      // 5. Verify cancellation notification event
      await verifyCancellationNotificationEvent(envelopeId, envelope.createdBy);

      // 6. Get comprehensive verification summary
      const summary = await getCancellationVerificationSummary(envelopeId, envelope.createdBy);
      expect(summary.envelope.status).toBe('CANCELLED');
      expect(summary.auditEvent.eventType).toBe('ENVELOPE_CANCELLED');
      expect(summary.notificationEvent.type).toBe('ENVELOPE_CANCELLED');
    });

    it('should cancel envelope in READY_FOR_SIGNATURE status', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Cancel Test Contract Ready',
          description: 'Testing cancel workflow in READY_FOR_SIGNATURE status',
          signingOrderType: 'OWNER_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      expect(envelope.id).toBeDefined();
      expect(envelope.status).toBe('DRAFT');
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

      // 4. Cancel envelope
      const cancelResponse = await workflowHelper.cancelEnvelope(envelopeId);

      expect(cancelResponse.statusCode).toBe(200);
      expect(cancelResponse.data.success).toBe(true);
      expect(cancelResponse.data.envelope.status).toBe('CANCELLED');

      // 5. Verify envelope is cancelled in database
      await verifyEnvelopeCancelled(envelopeId);

      // 6. Verify cancellation audit event
      await verifyCancellationAuditEvent(envelopeId, envelope.createdBy);

      // 7. Verify cancellation notification event
      await verifyCancellationNotificationEvent(envelopeId, envelope.createdBy);
    });
  });

  describe('Authorization Validation', () => {
    it('should prevent cancellation by non-creator', async () => {
      // 1. Create envelope with user A
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Authorization Test Contract',
          description: 'Testing authorization for cancel workflow',
          signingOrderType: 'OWNER_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      expect(envelope.id).toBeDefined();
      const envelopeId = envelope.id;

      // 2. Try to cancel with different user (user B)
      const nonCreatorUser = workflowHelper.getSecondTestUser();
      const token = await workflowHelper.generateTestJwtToken(nonCreatorUser.userId, nonCreatorUser.email);

      const cancelResponse = await workflowHelper.cancelEnvelopeWithToken(envelopeId, token);
      expect(cancelResponse.statusCode).toBe(403);
      expect(cancelResponse.data.message).toContain(`User ${nonCreatorUser.userId} is not authorized to cancel envelope`);

      // 3. Verify envelope status remains DRAFT
      const currentEnvelope = await workflowHelper.getEnvelopeFromDatabase(envelopeId);
      expect(currentEnvelope?.status).toBe('DRAFT');
    });

    it('should prevent cancellation by external signer (no authentication)', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'External Signer Test Contract',
          description: 'Testing external signer cannot cancel envelope',
          signingOrderType: 'OWNER_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      expect(envelope.id).toBeDefined();
      const envelopeId = envelope.id;

      // 2. Add external signer
      const signers = TestDataFactory.createMultipleSigners(1, 1);
      const addSignersResponse = await workflowHelper.updateEnvelope(envelopeId, {
        addSigners: signers
      });

      expect(addSignersResponse.statusCode).toBe(200);
      const signerIds = addSignersResponse.data.signers.map((s: any) => s.id);

      // 3. Send envelope to get invitation tokens
      const sendResponse = await workflowHelper.sendEnvelope(envelopeId, {
        sendToAll: true
      });
      expect(sendResponse.statusCode).toBe(200);

      // 4. Try to cancel without authentication (simulating external signer)
      // This should fail because CancelEnvelopeHandler requires authentication
      const cancelResponse = await workflowHelper.cancelEnvelopeWithoutAuth(envelopeId);
      expect(cancelResponse.statusCode).toBe(401);
      expect(cancelResponse.data.message).toContain('Missing bearer token');

      // 5. Verify envelope status remains READY_FOR_SIGNATURE
      const currentEnvelope = await workflowHelper.getEnvelopeFromDatabase(envelopeId);
      expect(currentEnvelope?.status).toBe('READY_FOR_SIGNATURE');
    });
  });

  describe('Status Validation', () => {
    it('should prevent cancellation of completed envelope', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Completed Test Contract',
          description: 'Testing cancel workflow with completed envelope',
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

      // 4. Get invitation tokens from send response
      expect(sendResponse.data.tokens).toBeDefined();
      expect(sendResponse.data.tokens).toHaveLength(1);
      const invitationTokens = sendResponse.data.tokens.map((t: any) => t.token);

      // 5. Sign document (complete the envelope)
      const signResponse = await workflowHelper.signDocument(
        envelopeId,
        signerIds[0],
        invitationTokens[0],
        {
          given: true,
          timestamp: new Date().toISOString(),
          text: 'test-consent-text',
          ipAddress: 'test-ip-address',
          userAgent: 'test-user-agent',
          country: 'test-country'
        }
      );

      expect(signResponse.statusCode).toBe(200);
      expect(signResponse.data.envelope.status).toBe('COMPLETED');

      // 6. Try to cancel completed envelope
      const cancelResponse = await workflowHelper.cancelEnvelope(envelopeId);

      expect(cancelResponse.statusCode).toBe(409);
      expect(cancelResponse.data.message).toContain('completed');

      // 7. Verify envelope is still completed
      const envelopeResponse = await workflowHelper.getEnvelope(envelopeId);
      expect(envelopeResponse.data.status).toBe('COMPLETED');
    });

    it('should prevent cancellation of declined envelope', async () => {
      // 1. Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Declined Test Contract',
          description: 'Testing cancel workflow with declined envelope',
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
      expect(sendResponse.data.status).toBe('READY_FOR_SIGNATURE');

      // 4. Get invitation tokens from send response
      expect(sendResponse.data.tokens).toBeDefined();
      expect(sendResponse.data.tokens).toHaveLength(1);
      const invitationTokens = sendResponse.data.tokens.map((t: any) => t.token);

      // 5. Decline document
      const declineResponse = await workflowHelper.declineSigner(
        envelopeId,
        signerIds[0],
        invitationTokens[0],
        'Test decline reason'
      );

      expect(declineResponse.statusCode).toBe(200);
      expect(declineResponse.data.decline.envelopeStatus).toBe('DECLINED');

      // 6. Try to cancel declined envelope
      const cancelResponse = await workflowHelper.cancelEnvelope(envelopeId);

      expect(cancelResponse.statusCode).toBe(409);
      expect(cancelResponse.data.message).toContain('declined');

      // 7. Verify envelope is still declined
      const envelopeResponse = await workflowHelper.getEnvelope(envelopeId);
      expect(envelopeResponse.data.status).toBe('DECLINED');
    });
  });
});
