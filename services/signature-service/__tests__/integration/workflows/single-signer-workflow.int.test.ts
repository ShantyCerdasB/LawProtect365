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

describe('Single-Signer Document Signing Workflow', () => {
  let workflowHelper: WorkflowTestHelper;

  beforeAll(async () => {
    workflowHelper = new WorkflowTestHelper();
    await workflowHelper.initialize();
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

      // TODO: Implement when handlers are available
      // Send envelope for signing
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
