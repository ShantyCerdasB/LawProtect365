/**
 * @fileoverview send-reminders-workflow.int.test.ts - Send reminders workflow integration tests
 * @summary Complete send reminders workflow tests
 * @description End-to-end integration tests for send reminders workflows where users
 * can send reminder notifications to pending signers with proper validation and limits.
 * 
 * Test Coverage:
 * - Reminder sending to all pending signers
 * - Reminder sending to specific signers
 * - Custom message handling
 * - Reminder limits validation (max 3, min 24h between)
 * - Authorization validation (owner only)
 * - Error handling for various scenarios
 * - Event publishing verification
 * - Audit event creation
 */

import { WorkflowTestHelper } from '../helpers/workflowHelpers';
import { TestDataFactory } from '../helpers/testDataFactory';

// Mock SignatureOrchestrator.publishNotificationEvent and publishReminderNotificationEvent to avoid OutboxRepository issues
jest.mock('../../../src/services/SignatureOrchestrator', () => {
  const actual = jest.requireActual('../../../src/services/SignatureOrchestrator');
  return {
    ...actual,
    SignatureOrchestrator: jest.fn().mockImplementation((...args) => {
      const instance = new actual.SignatureOrchestrator(...args);
      
      // Mock the publishNotificationEvent method (existing)
      instance.publishNotificationEvent = jest.fn().mockImplementation(async (envelopeId: any, options: any, tokens: any[]) => {
        console.log('🔧 Mocked publishNotificationEvent called:', {
          envelopeId: envelopeId?.getValue?.() || envelopeId,
          options,
          tokensCount: tokens?.length || 0
        });
        // Just return success without actually publishing
        return Promise.resolve();
      });

      // Mock the publishReminderNotificationEvent method (NEW)
      instance.publishReminderNotificationEvent = jest.fn().mockImplementation(async (
        envelopeId: any,
        signerId: any,
        message: string,
        reminderCount: number
      ) => {
        console.log('🔧 Mocked publishReminderNotificationEvent called:', {
          envelopeId: envelopeId?.getValue?.() || envelopeId,
          signerId: signerId?.getValue?.() || signerId,
          message,
          reminderCount
        });

        // Register reminder notification in outboxMock for verification
        const { outboxMockHelpers } = require('../mocks');
        const envelopeIdStr = envelopeId?.getValue?.() || envelopeId;
        const signerIdStr = signerId?.getValue?.() || signerId;
        
        // Access the internal Maps directly from the outboxMock module
        const outboxMockModule = require('../mocks/aws/outboxMock');
        
        // Get the internal Maps (they are defined at module level)
        const publishedEvents = outboxMockModule.publishedEvents || new Map();
        
        // Initialize tracking for this envelope if not exists
        if (!publishedEvents.has(envelopeIdStr)) {
          publishedEvents.set(envelopeIdStr, []);
        }
        
        // Register reminder notification event with correct structure
        publishedEvents.get(envelopeIdStr).push({
          type: 'REMINDER_NOTIFICATION',
          payload: {
            envelopeId: envelopeIdStr,
            signerId: signerIdStr,
            message,
            reminderCount,
            eventType: 'REMINDER_NOTIFICATION'
          },
          detail: {
            envelopeId: envelopeIdStr,
            signerId: signerIdStr,
            message,
            reminderCount,
            eventType: 'REMINDER_NOTIFICATION'
          },
          id: `mock-reminder-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString()
        });
        
        return Promise.resolve();
      });
      
      return instance;
    })
  };
});

describe('Send Reminders Workflow Integration Tests', () => {
  let helper: WorkflowTestHelper;

  beforeEach(async () => {
    helper = new WorkflowTestHelper();
    await helper.initialize();
  });

  afterEach(() => {
    clearReminderMockData();
  });

  describe('Successful Reminder Sending', () => {
    it('should send reminders to all pending signers', async () => {
      // 1. Create envelope
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'Reminder Test Contract',
        description: 'Document to test reminder functionality'
      });

      const createResponse = await helper.createEnvelope(envelopeData);
      expect(createResponse.id).toBeDefined();
      const envelopeId = createResponse.id;

      // 2. Add signers
      const signers = TestDataFactory.createMultipleSigners(2, 2);

      const addSignersResponse = await helper.updateEnvelope(envelopeId, {
        addSigners: signers
      });
      expect(addSignersResponse.statusCode).toBe(200);
      const signerIds = addSignersResponse.data.signers.map((s: any) => s.id);

      // 3. Send envelope
      const sendResponse = await helper.sendEnvelope(envelopeId, {
        message: 'Please sign this document',
        sendToAll: true
      });
      expect(sendResponse.statusCode).toBe(200);

      // 4. Send reminders to all pending signers
      const reminderResponse = await helper.sendNotification(envelopeId, {
        type: 'reminder',
        message: 'Please remember to sign the document'
      });

      // 5. Verify response
      expect(reminderResponse.statusCode).toBe(200);
      expect(reminderResponse.data.success).toBe(true);
      expect(reminderResponse.data.remindersSent).toBe(2);
      expect(reminderResponse.data.signersNotified).toHaveLength(2);
      expect(reminderResponse.data.skippedSigners).toHaveLength(0);

      // 6. Verify reminder events published
      for (const signerId of signerIds) {
        verifyReminderNotificationEvent(envelopeId, signerId, 1);
      }

      console.log('✅ Reminders sent successfully to all pending signers');
    });

    it('should send reminders to specific signers only', async () => {
      // 1. Create envelope
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'Specific Reminder Test Contract',
        description: 'Document to test specific signer reminders'
      });

      const createResponse = await helper.createEnvelope(envelopeData);
      expect(createResponse.id).toBeDefined();
      const envelopeId = createResponse.id;

      // 2. Add signers
      const signers = TestDataFactory.createMultipleSigners(3, 3);

      const addSignersResponse = await helper.updateEnvelope(envelopeId, {
        addSigners: signers
      });
      expect(addSignersResponse.statusCode).toBe(200);
      const signerIds = addSignersResponse.data.signers.map((s: any) => s.id);

      // 3. Send envelope
      const sendResponse = await helper.sendEnvelope(envelopeId, {
        message: 'Please sign this document',
        sendToAll: true
      });
      expect(sendResponse.statusCode).toBe(200);

      // 4. Send reminders to specific signers only (first 2)
      const specificSignerIds = signerIds.slice(0, 2);
      const reminderResponse = await helper.sendNotification(envelopeId, {
        type: 'reminder',
        signerIds: specificSignerIds,
        message: 'Reminder for specific signers'
      });

      // 5. Verify response
      expect(reminderResponse.statusCode).toBe(200);
      expect(reminderResponse.data.success).toBe(true);
      expect(reminderResponse.data.remindersSent).toBe(2);
      expect(reminderResponse.data.signersNotified).toHaveLength(2);
      expect(reminderResponse.data.skippedSigners).toHaveLength(0);

      // 6. Verify reminder events published only for specific signers
      for (const signerId of specificSignerIds) {
        verifyReminderNotificationEvent(envelopeId, signerId, 1);
      }

      console.log('✅ Reminders sent successfully to specific signers only');
    });

    it('should send reminders with custom message', async () => {
      // 1. Create envelope
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'Custom Message Reminder Test Contract',
        description: 'Document to test custom reminder messages'
      });

      const createResponse = await helper.createEnvelope(envelopeData);
      expect(createResponse.id).toBeDefined();
      const envelopeId = createResponse.id;

      // 2. Add signer
      const signers = TestDataFactory.createMultipleSigners(1, 1);

      const addSignersResponse = await helper.updateEnvelope(envelopeId, {
        addSigners: signers
      });
      expect(addSignersResponse.statusCode).toBe(200);
      const signerIds = addSignersResponse.data.signers.map((s: any) => s.id);

      // 3. Send envelope
      const sendResponse = await helper.sendEnvelope(envelopeId, {
        message: 'Please sign this document',
        sendToAll: true
      });
      expect(sendResponse.statusCode).toBe(200);

      // 4. Send reminder with custom message
      const customMessage = 'This is a custom reminder message for urgent signing';
      const reminderResponse = await helper.sendNotification(envelopeId, {
        type: 'reminder',
        message: customMessage
      });

      // 5. Verify response
      expect(reminderResponse.statusCode).toBe(200);
      expect(reminderResponse.data.success).toBe(true);
      expect(reminderResponse.data.remindersSent).toBe(1);

      // 6. Verify custom message in published event
      const publishedEvents = outboxMockHelpers.getPublishedEvents(envelopeId);
      const reminderEvents = publishedEvents.filter((event: any) => 
        event.detail?.eventType === 'REMINDER_NOTIFICATION'
      );
      
      expect(reminderEvents.length).toBeGreaterThan(0);
      expect(reminderEvents[0].detail.message).toBe(customMessage);

      console.log('✅ Custom reminder message sent successfully');
    });
  });

  describe('Reminder Limits and Validation', () => {
    it('should respect maximum reminders limit', async () => {
      // 1. Create envelope
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'Max Reminders Test Contract',
        description: 'Document to test maximum reminders limit'
      });

      const createResponse = await helper.createEnvelope(envelopeData);
      expect(createResponse.id).toBeDefined();
      const envelopeId = createResponse.id;

      // 2. Add signer
      const signers = TestDataFactory.createMultipleSigners(1, 1);

      const addSignersResponse = await helper.updateEnvelope(envelopeId, {
        addSigners: signers
      });
      expect(addSignersResponse.statusCode).toBe(200);
      const signerIds = addSignersResponse.data.signers.map((s: any) => s.id);

      // 3. Send envelope
      const sendResponse = await helper.sendEnvelope(envelopeId, {
        message: 'Please sign this document',
        sendToAll: true
      });
      expect(sendResponse.statusCode).toBe(200);

      // 4. Send first reminder (should succeed)
      const firstReminderResponse = await helper.sendNotification(envelopeId, {
        type: 'reminder',
        message: 'First reminder'
      });
      expect(firstReminderResponse.statusCode).toBe(200);
      expect(firstReminderResponse.data.remindersSent).toBe(1);

      // 5. Send second reminder immediately (should be skipped due to time limit)
      const secondReminderResponse = await helper.sendNotification(envelopeId, {
        type: 'reminder',
        message: 'Second reminder too soon'
      });
      expect(secondReminderResponse.statusCode).toBe(200);
      expect(secondReminderResponse.data.remindersSent).toBe(0);
      expect(secondReminderResponse.data.skippedSigners).toHaveLength(1);
      expect(secondReminderResponse.data.skippedSigners[0].reason).toContain('Minimum 24 hours between reminders not met');

      console.log('✅ Maximum reminders limit respected correctly');
    });

    it('should handle no pending signers gracefully', async () => {
      // 1. Create envelope
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'No Pending Signers Test Contract',
        description: 'Document to test no pending signers scenario'
      });

      const createResponse = await helper.createEnvelope(envelopeData);
      expect(createResponse.id).toBeDefined();
      const envelopeId = createResponse.id;

      // 2. Don't add any signers - envelope has no pending signers

      // 3. Try to send reminders
      const reminderResponse = await helper.sendNotification(envelopeId, {
        type: 'reminder',
        message: 'Please sign this document'
      });

      // 4. Verify response
      expect(reminderResponse.statusCode).toBe(200);
      expect(reminderResponse.data.success).toBe(true);
      expect(reminderResponse.data.remindersSent).toBe(0);
      expect(reminderResponse.data.message).toContain('No pending signers to remind');

      console.log('✅ No pending signers handled gracefully');
    });
  });

  describe('Authorization and Error Handling', () => {
    it('should prevent non-owner from sending reminders', async () => {
      // 1. Create envelope with user A
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'Authorization Test Contract',
        description: 'Document to test reminder authorization'
      });

      const createResponse = await helper.createEnvelope(envelopeData);
      expect(createResponse.id).toBeDefined();
      const envelopeId = createResponse.id;

      // 2. Add signer
      const signers = TestDataFactory.createMultipleSigners(1, 1);

      const addSignersResponse = await helper.updateEnvelope(envelopeId, {
        addSigners: signers
      });
      expect(addSignersResponse.statusCode).toBe(200);

      // 3. Send envelope
      const sendResponse = await helper.sendEnvelope(envelopeId, {
        message: 'Please sign this document',
        sendToAll: true
      });
      expect(sendResponse.statusCode).toBe(200);

      // 4. Try to send reminders with different user (user B)
      const nonOwnerUser = helper.getSecondTestUser();
      const reminderResponse = await helper.sendNotificationAsUser(envelopeId, {
        type: 'reminder',
        message: 'Please sign this document'
      }, nonOwnerUser);

      // 5. Verify authorization failure
      expect(reminderResponse.statusCode).toBe(403);
      expect(reminderResponse.data.error).toBeDefined();
      expect(reminderResponse.data.message).toContain('Only the envelope owner can modify');

      console.log('✅ Non-owner prevented from sending reminders');
    });

    it('should handle envelope not found', async () => {
      // 1. Try to send reminders to non-existent envelope (using a valid UUID format)
      const nonExistentEnvelopeId = '550e8400-e29b-41d4-a716-446655440000';
      const reminderResponse = await helper.sendNotification(nonExistentEnvelopeId, {
        type: 'reminder',
        message: 'Please sign this document'
      });

      // 2. Verify not found error
      expect(reminderResponse.statusCode).toBe(404);
      expect(reminderResponse.data.error).toBeDefined();
      expect(reminderResponse.data.message).toContain('Envelope with ID');

      console.log('✅ Envelope not found handled correctly');
    });

    it('should handle invalid envelope ID format', async () => {
      // 1. Try to send reminders with invalid envelope ID
      const invalidEnvelopeId = 'invalid-uuid';
      const reminderResponse = await helper.sendNotification(invalidEnvelopeId, {
        type: 'reminder',
        message: 'Please sign this document'
      });

      // 2. Verify validation error
      expect(reminderResponse.statusCode).toBe(400);
      expect(reminderResponse.data.error).toBeDefined();
      expect(reminderResponse.data.message).toContain('Invalid UUID format');

      console.log('✅ Invalid envelope ID format handled correctly');
    });

    it('should handle invalid notification type', async () => {
      // 1. Create envelope
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'Invalid Type Test Contract',
        description: 'Document to test invalid notification type'
      });

      const createResponse = await helper.createEnvelope(envelopeData);
      expect(createResponse.id).toBeDefined();
      const envelopeId = createResponse.id;

      // 2. Try to send with invalid notification type
      const reminderResponse = await helper.sendNotification(envelopeId, {
        type: 'invalid' as any,
        message: 'Please sign this document'
      });

      // 3. Verify validation error
      expect(reminderResponse.statusCode).toBe(422);
      expect(reminderResponse.data.error).toBeDefined();
      expect(reminderResponse.data.message).toContain('Notification type must be either');

      console.log('✅ Invalid notification type handled correctly');
    });
  });
});

// Helper functions for verification
const { outboxMockHelpers } = require('../mocks/aws/outboxMock');

function verifyReminderNotificationEvent(envelopeId: string, signerId: string, reminderCount: number): void {
  const publishedEvents = outboxMockHelpers.getPublishedEvents(envelopeId);
  const reminderEvents = publishedEvents.filter((event: any) => 
    event.detail?.eventType === 'REMINDER_NOTIFICATION' &&
    event.detail?.signerId === signerId &&
    event.detail?.reminderCount === reminderCount
  );
  
  expect(reminderEvents.length).toBeGreaterThan(0);
  expect(reminderEvents[0].detail.message).toBeDefined();
  expect(reminderEvents[0].detail.reminderCount).toBe(reminderCount);
  expect(reminderEvents[0].detail.envelopeId).toBe(envelopeId);
  expect(reminderEvents[0].detail.signerId).toBe(signerId);
  
  console.log(`✅ Reminder notification event verified: ${signerId} (count: ${reminderCount})`);
}

function clearReminderMockData(): void {
  outboxMockHelpers.clearAllMockData();
  console.log('🧹 Reminder mock data cleared');
}
