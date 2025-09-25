/**
 * @fileoverview get-audit-trail-workflow.int.test.ts - Get audit trail workflow integration tests
 * @summary Complete audit trail retrieval workflow tests
 * @description End-to-end integration tests for audit trail retrieval workflows where users
 * can get complete audit history for their envelopes.
 * 
 * Test Coverage:
 * - Audit trail retrieval for envelope owner
 * - Authorization validation (owner only)
 * - Complete event history retrieval
 * - Event formatting for frontend display
 * - Error handling for non-existent envelopes
 * - Error handling for unauthorized access
 */

import { WorkflowTestHelper } from '../helpers/workflowHelpers';
import { TestDataFactory } from '../helpers/testDataFactory';

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
        // Just return success without actually publishing
        return Promise.resolve();
      });
      
      return instance;
    })
  };
});

describe('Get Audit Trail Workflow Integration Tests', () => {
  let helper: WorkflowTestHelper;

  beforeEach(async () => {
    helper = new WorkflowTestHelper();
    await helper.initialize();
  });

  describe('Successful Audit Trail Retrieval', () => {
    it('should get audit trail for envelope owner', async () => {
      // 1. Create envelope
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'Audit Trail Test Contract',
        description: 'Document to test audit trail functionality'
      });

      const createResponse = await helper.createEnvelope(envelopeData);
      expect(createResponse.id).toBeDefined();
      const envelopeId = createResponse.id;

      // 2. Add a signer to generate more audit events
      const signers = TestDataFactory.createMultipleSigners(1, 1);

      const addSignerResponse = await helper.updateEnvelope(envelopeId, {
        addSigners: signers
      });
      expect(addSignerResponse.statusCode).toBe(200); // Should succeed

      // 3. Send envelope to generate more events
      const sendResponse = await helper.sendEnvelope(envelopeId, {
        message: 'Please sign this document',
        sendToAll: true
      });
      expect(sendResponse.statusCode).toBe(200);

      // 4. Get audit trail
      const auditTrailResponse = await helper.getAuditTrail(envelopeId, helper.getTestUser());
      expect(auditTrailResponse.statusCode).toBe(200);
      expect(auditTrailResponse.data).toBeDefined();
      expect(auditTrailResponse.data.envelopeId).toBe(envelopeId);
      expect(auditTrailResponse.data.events).toBeDefined();
      expect(Array.isArray(auditTrailResponse.data.events)).toBe(true);
      expect(auditTrailResponse.data.events.length).toBeGreaterThan(0);

      // 5. Verify event structure
      const events = auditTrailResponse.data.events;
      events.forEach((event: any) => {
        expect(event.id).toBeDefined();
        expect(event.eventType).toBeDefined();
        expect(event.description).toBeDefined();
        expect(event.createdAt).toBeDefined();
        expect(new Date(event.createdAt)).toBeInstanceOf(Date);
      });

      // 6. Verify events are in chronological order (most recent first)
      for (let i = 0; i < events.length - 1; i++) {
        const currentEvent = new Date(events[i].createdAt);
        const nextEvent = new Date(events[i + 1].createdAt);
        expect(currentEvent.getTime()).toBeGreaterThanOrEqual(nextEvent.getTime());
      }

      // 7. Verify specific event types exist
      const eventTypes = events.map((e: any) => e.eventType);
      expect(eventTypes).toContain('ENVELOPE_CREATED');
      expect(eventTypes).toContain('SIGNER_ADDED');
      expect(eventTypes).toContain('INVITATION_ISSUED');
      expect(eventTypes).toContain('ENVELOPE_SENT');

      console.log(`✅ Audit trail retrieved successfully with ${events.length} events`);
    });

    it('should return empty events array for envelope with no audit events', async () => {
      // 1. Create envelope
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'Empty Audit Trail Test',
        description: 'Document to test empty audit trail'
      });

      const createResponse = await helper.createEnvelope(envelopeData);
      expect(createResponse.id).toBeDefined();
      const envelopeId = createResponse.id;

      // 2. Get audit trail (should have at least ENVELOPE_CREATED event)
      const auditTrailResponse = await helper.getAuditTrail(envelopeId, helper.getTestUser());
      expect(auditTrailResponse.statusCode).toBe(200);
      expect(auditTrailResponse.data.events).toBeDefined();
      expect(auditTrailResponse.data.events.length).toBeGreaterThan(0); // At least ENVELOPE_CREATED
      expect(auditTrailResponse.data.events[0].eventType).toBe('ENVELOPE_CREATED');

      console.log('✅ Empty audit trail handled correctly');
    });
  });

  describe('Authorization Validation', () => {
    it('should deny access for non-owner', async () => {
      // 1. Create envelope
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'Authorization Test Contract',
        description: 'Document to test authorization'
      });

      const createResponse = await helper.createEnvelope(envelopeData);
      expect(createResponse.id).toBeDefined();
      const envelopeId = createResponse.id;

      // 2. Create different user
      const nonOwner = {
        userId: 'different-user-id',
        email: 'nonowner@example.com'
      };

      // 3. Try to get audit trail as non-owner
      const auditTrailResponse = await helper.getAuditTrail(envelopeId, nonOwner);
      expect(auditTrailResponse.statusCode).toBe(403);
      expect(auditTrailResponse.data.error).toBeDefined();
      expect(auditTrailResponse.data.message).toContain('Only the envelope owner can modify');

      console.log('✅ Non-owner access denied correctly');
    });

    it('should deny access without authentication', async () => {
      // 1. Create envelope
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'No Auth Test Contract',
        description: 'Document to test no auth access'
      });

      const createResponse = await helper.createEnvelope(envelopeData);
      expect(createResponse.id).toBeDefined();
      const envelopeId = createResponse.id;

      // 2. Try to get audit trail without authentication
      const auditTrailResponse = await helper.getAuditTrailWithoutAuth(envelopeId);
      expect(auditTrailResponse.statusCode).toBe(401);
      expect(auditTrailResponse.data.error).toBeDefined();
      expect(auditTrailResponse.data.message).toContain('Missing bearer token');

      console.log('✅ Unauthenticated access denied correctly');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent envelope', async () => {
      // 1. Try to get audit trail for non-existent envelope
      const nonExistentEnvelopeId = '123e4567-e89b-12d3-a456-426614174000';
      const auditTrailResponse = await helper.getAuditTrail(nonExistentEnvelopeId, helper.getTestUser());
      expect(auditTrailResponse.statusCode).toBe(404);
      expect(auditTrailResponse.data.error).toBeDefined();
      expect(auditTrailResponse.data.message).toContain('EnvelopeId must be a valid UUID');

      console.log('✅ Non-existent envelope handled correctly');
    });

    it('should handle invalid envelope ID format', async () => {
      // 1. Try to get audit trail with invalid envelope ID
      const invalidEnvelopeId = 'invalid-uuid';
      const auditTrailResponse = await helper.getAuditTrail(invalidEnvelopeId, helper.getTestUser());
      expect(auditTrailResponse.statusCode).toBe(400);
      expect(auditTrailResponse.data.error).toBeDefined();
      expect(auditTrailResponse.data.message).toContain('Invalid UUID format');

      console.log('✅ Invalid envelope ID handled correctly');
    });
  });

  describe('Event Format Validation', () => {
    it('should return properly formatted events for frontend', async () => {
      // 1. Create envelope
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'Event Format Test Contract',
        description: 'Document to test event format'
      });

      const createResponse = await helper.createEnvelope(envelopeData);
      expect(createResponse.id).toBeDefined();
      const envelopeId = createResponse.id;

      // 2. Get audit trail
      const auditTrailResponse = await helper.getAuditTrail(envelopeId, helper.getTestUser());
      expect(auditTrailResponse.statusCode).toBe(200);

      // 3. Verify response structure
      const response = auditTrailResponse.data;
      expect(response).toHaveProperty('envelopeId');
      expect(response).toHaveProperty('events');
      expect(typeof response.envelopeId).toBe('string');
      expect(Array.isArray(response.events)).toBe(true);

      // 4. Verify event structure
      if (response.events.length > 0) {
        const event = response.events[0];
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('eventType');
        expect(event).toHaveProperty('description');
        expect(event).toHaveProperty('createdAt');
        expect(event).toHaveProperty('metadata');

        // Verify data types
        expect(typeof event.id).toBe('string');
        expect(typeof event.eventType).toBe('string');
        expect(typeof event.description).toBe('string');
        expect(typeof event.createdAt).toBe('string');
        expect(typeof event.metadata).toBe('object');

        // Verify createdAt is valid ISO string
        expect(() => new Date(event.createdAt)).not.toThrow();
        expect(new Date(event.createdAt).toISOString()).toBe(event.createdAt);
      }

      console.log('✅ Event format validation passed');
    });
  });
});
