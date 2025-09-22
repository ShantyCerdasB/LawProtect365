/**
 * @fileoverview multi-signer-workflow.int.test.ts - Multi-signer envelope workflow integration tests
 * @summary Complete multi-signer document signing workflow tests
 * @description End-to-end integration tests for multi-signer envelope workflows including
 * business rule validations, signing order enforcement, and complete document lifecycle.
 * 
 * Test Coverage:
 * - INVITEES_FIRST signing order workflow
 * - OWNER_FIRST signing order workflow
 * - Signer management (add/remove signers)
 * - Signing order changes and validations
 * - Complete multi-signer document lifecycle
 * - Business rule enforcement across all scenarios
 * 
 * Note: Currently only tests CreateEnvelope and UpdateEnvelope functionality.
 * Other handlers (SendEnvelope, SignDocument, etc.) are commented out until implementation.
 */

import { WorkflowTestHelper, TestDataFactory } from '../helpers/workflowHelpers';

describe('Multi-Signer Document Signing Workflow', () => {
  let workflowHelper: WorkflowTestHelper;

  beforeAll(async () => {
    workflowHelper = new WorkflowTestHelper();
    await workflowHelper.initialize();
  });

  describe('INVITEES_FIRST Multi-Signer Workflow', () => {
    it('should complete full INVITEES_FIRST multi-signer workflow', async () => {
      // Create envelope with INVITEES_FIRST
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'INVITEES_FIRST Multi-Signer Contract',
        description: 'Complete workflow test for INVITEES_FIRST multi-signer',
        signingOrderType: 'INVITEES_FIRST',
        originType: 'TEMPLATE',
        templateId: 'multi-signer-template-123',
        templateVersion: '1.0.0'
      });

      const envelope = await workflowHelper.createEnvelope(envelopeData);
      
      expect(envelope.id).toBeDefined();
      expect(envelope.title).toBe('INVITEES_FIRST Multi-Signer Contract');
      expect(envelope.status).toBe('DRAFT');
      expect(envelope.signingOrderType).toBe('INVITEES_FIRST');
      expect(envelope.originType).toBe('TEMPLATE');

      // Add multiple external signers
      const signers = TestDataFactory.createMultipleSigners(3, 1);
      const addSignersResponse = await workflowHelper.updateEnvelope(envelope.id, { addSigners: signers });

      expect(addSignersResponse.statusCode).toBe(200);
      expect(addSignersResponse.data.id).toBe(envelope.id);

      // Verify signers in database
      const dbSigners = await workflowHelper.getSignersFromDatabase(envelope.id);
      expect(dbSigners).toHaveLength(3);
      expect(dbSigners[0].email).toBe('signer1@example.com');
      expect(dbSigners[1].email).toBe('signer2@example.com');
      expect(dbSigners[2].email).toBe('signer3@example.com');

      // Configure envelope metadata
      const updateResponse = await workflowHelper.updateMetadata(envelope.id, {
        title: 'Updated INVITEES_FIRST Contract',
        description: 'Updated description for INVITEES_FIRST workflow',
        expiresAt: new Date('2024-12-31T23:59:59Z').toISOString()
      });

      expect(updateResponse.statusCode).toBe(200);
      expect(updateResponse.data.title).toBe('Updated INVITEES_FIRST Contract');

      // TODO: Implement when handlers are available
      // Send envelope for signing
      // Signers sign in order (INVITEES_FIRST)
      // Complete envelope
      // Download signed document
    });

    it('should handle signer management in INVITEES_FIRST workflow', async () => {
      // Create INVITEES_FIRST envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Signer Management Test',
          signingOrderType: 'INVITEES_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      // Add initial signers
      const initialSigners = TestDataFactory.createMultipleSigners(2, 1);
      await workflowHelper.updateEnvelope(envelope.id, { addSigners: initialSigners });

      // Add more signers with different emails to avoid duplicates
      const additionalSigners = [
        TestDataFactory.createSignerData({
          email: 'signer3@example.com',
          fullName: 'Signer 3',
          order: 3
        }),
        TestDataFactory.createSignerData({
          email: 'signer4@example.com',
          fullName: 'Signer 4',
          order: 4
        })
      ];
      await workflowHelper.updateEnvelope(envelope.id, { addSigners: additionalSigners });

      // Verify all signers
      let dbSigners = await workflowHelper.getSignersFromDatabase(envelope.id);
      expect(dbSigners).toHaveLength(4);

      // Remove some signers
      const signersToRemove = dbSigners.slice(0, 2).map(s => s.id);
      await workflowHelper.updateEnvelope(envelope.id, { removeSignerIds: signersToRemove });

      // Verify remaining signers
      dbSigners = await workflowHelper.getSignersFromDatabase(envelope.id);
      expect(dbSigners).toHaveLength(2);

      // Combine add and remove operations
      const newSigner = TestDataFactory.createSignerData({
        email: 'newsigner@example.com',
        fullName: 'New Signer',
        order: 5
      });

      const remainingSignerId = dbSigners[0].id;
      const combineResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [newSigner],
        removeSignerIds: [remainingSignerId]
      });

      expect(combineResponse.statusCode).toBe(200);

      // Verify final state
      dbSigners = await workflowHelper.getSignersFromDatabase(envelope.id);
      expect(dbSigners).toHaveLength(2); // Removed 1, added 1
      
      const newSignerInDb = dbSigners.find(s => s.email === 'newsigner@example.com');
      expect(newSignerInDb).toBeDefined();
      expect(newSignerInDb?.fullName).toBe('New Signer');
    });
  });

  describe('OWNER_FIRST Multi-Signer Workflow', () => {
    it('should complete full OWNER_FIRST multi-signer workflow', async () => {
      // Create envelope with OWNER_FIRST
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'OWNER_FIRST Multi-Signer Contract',
        description: 'Complete workflow test for OWNER_FIRST multi-signer',
        signingOrderType: 'OWNER_FIRST',
        originType: 'TEMPLATE',
        templateId: 'owner-first-template-456',
        templateVersion: '2.0.0'
      });

      const envelope = await workflowHelper.createEnvelope(envelopeData);
      
      expect(envelope.id).toBeDefined();
      expect(envelope.title).toBe('OWNER_FIRST Multi-Signer Contract');
      expect(envelope.signingOrderType).toBe('OWNER_FIRST');

      // Add creator as signer
      const creatorSigner = TestDataFactory.createSignerData({
        userId: workflowHelper.getTestUser().userId,
        email: workflowHelper.getTestUser().email,
        fullName: workflowHelper.getTestUser().name,
        isExternal: false,
        order: 1
      });

      await workflowHelper.updateEnvelope(envelope.id, { addSigners: [creatorSigner] });

      // Add external signers
      const externalSigners = TestDataFactory.createMultipleSigners(2, 2);
      await workflowHelper.updateEnvelope(envelope.id, { addSigners: externalSigners });

      // Verify signers in database
      const dbSigners = await workflowHelper.getSignersFromDatabase(envelope.id);
      expect(dbSigners).toHaveLength(3);
      expect(dbSigners[0].isExternal).toBe(false); // Creator first
      expect(dbSigners[1].isExternal).toBe(true);  // External signers after

      // TODO: Implement when handlers are available
      // Send envelope for signing
      // User (creator) signs first
      // External signers sign after
      // Complete envelope
      // Download signed document
    });

    it('should handle signing order changes in OWNER_FIRST workflow', async () => {
      // Create INVITEES_FIRST envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Signing Order Change Test',
          signingOrderType: 'INVITEES_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      // Add external signers only (no creator as signer)
      const externalSigners = TestDataFactory.createMultipleSigners(2, 1);
      await workflowHelper.updateEnvelope(envelope.id, { addSigners: externalSigners });

      // Change to OWNER_FIRST (should succeed - creator doesn't need to be a signer)
      const changeToOwnerResponse = await workflowHelper.updateEnvelope(
        envelope.id,
        { signingOrderType: 'OWNER_FIRST' }
      );

      expect(changeToOwnerResponse.statusCode).toBe(200);
      expect(changeToOwnerResponse.data.signingOrderType).toBe('OWNER_FIRST');

      // Verify change in database
      const dbEnvelope = await workflowHelper.getEnvelopeFromDatabase(envelope.id);
      expect(dbEnvelope?.signingOrderType).toBe('OWNER_FIRST');

      // Now change back to INVITEES_FIRST (should succeed)
      const changeToInviteesResponse = await workflowHelper.updateEnvelope(
        envelope.id,
        { signingOrderType: 'INVITEES_FIRST' }
      );

      expect(changeToInviteesResponse.statusCode).toBe(200);
      expect(changeToInviteesResponse.data.signingOrderType).toBe('INVITEES_FIRST');

      // Verify final change in database
      const finalDbEnvelope = await workflowHelper.getEnvelopeFromDatabase(envelope.id);
      expect(finalDbEnvelope?.signingOrderType).toBe('INVITEES_FIRST');
    });
  });

  describe('Multi-Signer Edge Cases', () => {
    it('should handle complex signer management scenarios', async () => {
      // Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Complex Signer Management',
          signingOrderType: 'INVITEES_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      // Add multiple signers in batches
      const batch1 = TestDataFactory.createMultipleSigners(3, 1);
      await workflowHelper.updateEnvelope(envelope.id, { addSigners: batch1 });

      // Create batch2 with different emails to avoid duplicates
      const batch2 = [
        TestDataFactory.createSignerData({
          email: 'signer4@example.com',
          fullName: 'Signer 4',
          order: 4
        }),
        TestDataFactory.createSignerData({
          email: 'signer5@example.com',
          fullName: 'Signer 5',
          order: 5
        })
      ];
      await workflowHelper.updateEnvelope(envelope.id, { addSigners: batch2 });

      // Verify total signers
      let dbSigners = await workflowHelper.getSignersFromDatabase(envelope.id);
      expect(dbSigners).toHaveLength(5);

      // Remove signers in batches
      const signersToRemove = dbSigners.slice(0, 3).map(s => s.id);
      await workflowHelper.updateEnvelope(envelope.id, { removeSignerIds: signersToRemove });

      // Verify remaining signers
      dbSigners = await workflowHelper.getSignersFromDatabase(envelope.id);
      expect(dbSigners).toHaveLength(2);

      // Add signers with specific orders
      const specificOrderSigners = [
        TestDataFactory.createSignerData({
          email: 'priority1@example.com',
          fullName: 'Priority Signer 1',
          order: 1
        }),
        TestDataFactory.createSignerData({
          email: 'priority2@example.com',
          fullName: 'Priority Signer 2',
          order: 2
        })
      ];

      await workflowHelper.updateEnvelope(envelope.id, { addSigners: specificOrderSigners });

      // Verify final order
      dbSigners = await workflowHelper.getSignersFromDatabase(envelope.id);
      expect(dbSigners).toHaveLength(4);
      
      // Verify signers are ordered correctly
      const sortedSigners = dbSigners.sort((a, b) => a.order - b.order);
      expect(sortedSigners[0].order).toBe(1);
      expect(sortedSigners[1].order).toBe(2);
      expect(sortedSigners[2].order).toBe(4);
      expect(sortedSigners[3].order).toBe(5);
    });
  });

  /*
  // TODO: Re-implement these tests after refactoring other handlers
  describe('SendEnvelope - Multi Signer Workflow', () => {
    // Tests for SendEnvelopeHandler
  });

  describe('GetEnvelope - Multi Signer Workflow', () => {
    // Tests for GetEnvelopeHandler
  });

  describe('SignDocument - Multi Signer Workflow', () => {
    // Tests for SignDocumentHandler with multiple signers
  });

  describe('DeclineSigner - Multi Signer Workflow', () => {
    // Tests for DeclineSignerHandler
  });

  describe('DeleteEnvelope - Multi Signer Workflow', () => {
    // Tests for DeleteEnvelopeHandler
  });

  describe('SendNotification - Multi Signer Workflow', () => {
    // Tests for SendNotificationHandler
  });

  describe('ViewDocument - Multi Signer Workflow', () => {
    // Tests for ViewDocumentHandler
  });

  describe('DownloadSignedDocument - Multi Signer Workflow', () => {
    // Tests for DownloadSignedDocumentHandler
  });

  describe('GetDocumentHistory - Multi Signer Workflow', () => {
    // Tests for GetDocumentHistoryHandler
  });
  */
});
