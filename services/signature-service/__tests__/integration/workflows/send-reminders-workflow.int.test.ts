/**
 * @fileoverview send-reminders-workflow.int.test.ts - Send reminders workflow integration tests
 * @summary Complete send reminders workflow tests
 * @description End-to-end integration tests for send reminders workflows including
 * basic functionality, limits validation, and authorization checks.
 * 
 * Test Coverage:
 * - Send reminders to all pending signers
 * - Send reminders to specific signers
 * - Custom reminder messages
 * - Maximum reminders limit validation
 * - No pending signers handling
 * - Authorization validation
 * - Error handling
 * 
 * Note: Tests the complete reminder workflow using all handlers:
 * CreateEnvelope, UpdateEnvelope, SendEnvelope, and SendNotification.
 */

// ✅ REFACTORED: Single line instead of 80+ lines of duplicated mock code
// Mock must be applied before any imports
import { setupReminderMock } from '../helpers/mockSetupHelper';
setupReminderMock();

import { WorkflowTestHelper } from '../helpers/workflowHelpers';
import { setupEnvelopeWithSigners, setupBasicEnvelope } from '../helpers/testSetupHelpers';

describe('Send Reminders Workflow Integration Tests', () => {
  let helper: WorkflowTestHelper;

  beforeAll(async () => {
    helper = new WorkflowTestHelper();
    await helper.initialize();
  });

  afterEach(() => {
    // Clear mock data after each test
    const { clearSendEnvelopeMockData } = require('../helpers/sendEnvelopeHelpers');
    clearSendEnvelopeMockData();
  });

  describe('Basic Reminder Functionality', () => {
    it('should send reminders to all pending signers', async () => {
      // ✅ REFACTORED: Single function call instead of 15+ lines of setup
      const { envelopeId } = await setupEnvelopeWithSigners(helper, {
        title: 'Basic Reminder Test Contract',
        description: 'Document to test basic reminder functionality'
      });

      // 4. Send reminder
      const reminderResponse = await helper.sendNotification(envelopeId, {
        type: 'reminder',
        message: 'This is a reminder to sign the document'
      });

      // 5. Verify response
      expect(reminderResponse.statusCode).toBe(200);
      expect(reminderResponse.data.success).toBe(true);
      expect(reminderResponse.data.remindersSent).toBe(1);
      expect(reminderResponse.data.signersNotified).toHaveLength(1);
      expect(reminderResponse.data.skippedSigners).toHaveLength(0);
      console.log('✅ Basic reminder sent successfully');
    });

    it('should send reminders to specific signers', async () => {
      // ✅ REFACTORED: Single function call instead of 20+ lines of setup
      const { envelopeId, signerIds } = await setupEnvelopeWithSigners(helper, {
        title: 'Specific Signer Reminder Test Contract',
        description: 'Document to test specific signer reminders',
        signerCount: 3
      });

      // 4. Send reminder to specific signers only
      const reminderResponse = await helper.sendNotification(envelopeId, {
        type: 'reminder',
        signerIds: [signerIds[0], signerIds[1]], // Only first two signers
        message: 'This is a reminder for specific signers'
      });

      // 5. Verify response
      expect(reminderResponse.statusCode).toBe(200);
      expect(reminderResponse.data.success).toBe(true);
      expect(reminderResponse.data.remindersSent).toBe(2);
      expect(reminderResponse.data.signersNotified).toHaveLength(2);
      expect(reminderResponse.data.skippedSigners).toHaveLength(0);
      console.log('✅ Specific signer reminders sent successfully');
    });

    it('should send reminders with custom message', async () => {
      // ✅ REFACTORED: Single function call instead of 15+ lines of setup
      const { envelopeId } = await setupEnvelopeWithSigners(helper, {
        title: 'Custom Message Reminder Test Contract',
        description: 'Document to test custom reminder messages'
      });

      // 4. Send reminder with custom message
      const customMessage = 'URGENT: Please sign this document as soon as possible. This is a custom reminder message.';
      const reminderResponse = await helper.sendNotification(envelopeId, {
        type: 'reminder',
        message: customMessage
      });

      // 5. Verify response
      expect(reminderResponse.statusCode).toBe(200);
      expect(reminderResponse.data.success).toBe(true);
      expect(reminderResponse.data.remindersSent).toBe(1);
      expect(reminderResponse.data.signersNotified).toHaveLength(1);
      console.log('✅ Custom reminder message sent successfully');
    });
  });

  describe('Reminder Limits and Validation', () => {
    it('should respect maximum reminders limit', async () => {
      // ✅ REFACTORED: Single function call instead of 15+ lines of setup
      const { envelopeId } = await setupEnvelopeWithSigners(helper, {
        title: 'Max Reminders Test Contract',
        description: 'Document to test maximum reminders limit'
      });

      // 4. Send multiple reminders (should respect limits)
      for (let i = 1; i <= 5; i++) {
        const reminderResponse = await helper.sendNotification(envelopeId, {
          type: 'reminder',
          message: `Reminder ${i}`
        });
        if (i <= 3) {
          // First 3 reminders should succeed
          expect(reminderResponse.statusCode).toBe(200);
          expect(reminderResponse.data.success).toBe(true);
        } else {
          // Reminders 4+ should be skipped due to limit
          expect(reminderResponse.statusCode).toBe(200);
          expect(reminderResponse.data.success).toBe(true);
          expect(reminderResponse.data.remindersSent).toBe(0);
          expect(reminderResponse.data.skippedSigners.length).toBeGreaterThan(0);
        }
      }
      console.log('✅ Maximum reminders limit respected');
    });

    it('should handle no pending signers gracefully', async () => {
      // ✅ REFACTORED: Single function call instead of 10+ lines of setup
      const { envelopeId } = await setupBasicEnvelope(helper, {
        title: 'No Pending Signers Test Contract',
        description: 'Document to test no pending signers scenario'
      });

      // 3. Try to send reminder (no signers added)
      const reminderResponse = await helper.sendNotification(envelopeId, {
        type: 'reminder',
        message: 'This should not be sent'
      });

      // 4. Verify response
      expect(reminderResponse.statusCode).toBe(200);
      expect(reminderResponse.data.success).toBe(true);
      expect(reminderResponse.data.remindersSent).toBe(0);
      expect(reminderResponse.data.signersNotified).toHaveLength(0);
      expect(reminderResponse.data.message).toContain('No pending signers');
      console.log('✅ No pending signers handled gracefully');
    });
  });

  describe('Authorization and Error Handling', () => {
    it('should prevent non-owner from sending reminders', async () => {
      // ✅ REFACTORED: Single function call instead of 15+ lines of setup
      const { envelopeId } = await setupEnvelopeWithSigners(helper, {
        title: 'Authorization Test Contract',
        description: 'Document to test reminder authorization'
      });

      // 4. Try to send reminder as different user (user B)
      const nonAuthorizedUser = helper.getSecondTestUser();

      const reminderResponse = await helper.sendNotificationAsUser(envelopeId, {
        type: 'reminder',
        message: 'This should fail'
      }, nonAuthorizedUser);

      // 5. Verify authorization failure
      expect(reminderResponse.statusCode).toBe(403);
      expect(reminderResponse.data.message).toContain('Only the envelope owner can modify');
      console.log('✅ Non-owner reminder prevention working');
    });

    it('should handle invalid envelope ID gracefully', async () => {
      // 1. Try to send reminder to non-existent envelope (using valid UUID format)
      const nonExistentEnvelopeId = '550e8400-e29b-41d4-a716-446655440000';
      const reminderResponse = await helper.sendNotification(nonExistentEnvelopeId, {
        type: 'reminder',
        message: 'This should fail'
      });

      // 2. Verify error response
      expect(reminderResponse.statusCode).toBe(404);
      expect(reminderResponse.data.message).toContain('Envelope with ID');
      console.log('✅ Invalid envelope ID handled gracefully');
    });
  });
});
