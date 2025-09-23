/**
 * @fileoverview envelope-validation.int.test.ts - Envelope validation edge cases
 * @summary Integration tests for envelope validation and error handling
 * @description Tests edge cases and validation scenarios for envelope operations,
 * including S3 key validation, immutable field protection, and template validation.
 * 
 * Test Coverage:
 * - S3 key existence validation
 * - Immutable field protection
 * - Template field validation
 * - Expiration date handling
 * - Metadata update validation
 */

import { randomUUID } from 'crypto';
import { WorkflowTestHelper, TestDataFactory } from '../helpers/workflowHelpers';

describe('Envelope Validation Edge Cases', () => {
  let workflowHelper: WorkflowTestHelper;

  beforeAll(async () => {
    workflowHelper = new WorkflowTestHelper();
    await workflowHelper.initialize();
  });

  afterEach(() => {
    // Clear mock data after each test to prevent interference
    const { outboxMockHelpers } = require('../mocks');
    outboxMockHelpers.clearAllMockData();
  });

  describe('S3 Key Validation', () => {
    it('should fail when S3 keys do not exist', async () => {
      // Create envelope with valid S3 key
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'S3 Validation Test',
          description: 'Testing S3 key validation'
        })
      );

      // Attempt to update with non-existent S3 key
      const updateResponse = await workflowHelper.updateMetadata(envelope.id, {
        sourceKey: 'test-documents/non-existent-document.pdf'
      });

      // Should fail with 400 error
      expect(updateResponse.statusCode).toBe(400);
      expect(updateResponse.data.message).toContain("does not exist in S3");
    });

    it('should succeed when S3 keys exist', async () => {
      // Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'S3 Success Test',
          description: 'Testing S3 key success'
        })
      );

      // Update with S3 keys that exist (mock simulates existence)
      const newSourceKey = `test-documents/${randomUUID()}.pdf`;
      const newMetaKey = `test-meta/${randomUUID()}.json`;
      
      const updateResponse = await workflowHelper.updateMetadata(envelope.id, {
        sourceKey: newSourceKey,
        metaKey: newMetaKey
      });

      // Should succeed
      expect(updateResponse.statusCode).toBe(200);
      expect(updateResponse.data.sourceKey).toBe(newSourceKey);
      expect(updateResponse.data.metaKey).toBe(newMetaKey);

      // Verify in database
      const dbEnvelope = await workflowHelper.getEnvelopeFromDatabase(envelope.id);
      expect(dbEnvelope?.sourceKey).toBe(newSourceKey);
      expect(dbEnvelope?.metaKey).toBe(newMetaKey);
    });
  });

  describe('Immutable Field Protection', () => {
    it('should fail when updating immutable fields', async () => {
      // Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Immutable Field Test',
          description: 'Testing immutable field protection'
        })
      );

      // Attempt to update immutable field - this should fail at schema level
      const updateResponse = await workflowHelper.updateEnvelope(envelope.id, {
        createdBy: 'other-user-id' // Immutable field
      });

      // Should fail with 422 error (schema validation)
      expect(updateResponse.statusCode).toBe(422);
      expect(updateResponse.data.message).toContain("Unrecognized key(s) in object");
    });

    it('should allow updating mutable fields', async () => {
      // Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Mutable Field Test',
          description: 'Testing mutable field updates'
        })
      );

      // Update mutable fields
      const updateResponse = await workflowHelper.updateMetadata(envelope.id, {
        title: 'Updated Mutable Title',
        description: 'Updated mutable description'
      });

      // Should succeed
      expect(updateResponse.statusCode).toBe(200);
      expect(updateResponse.data.title).toBe('Updated Mutable Title');
      expect(updateResponse.data.description).toBe('Updated mutable description');

      // Verify in database
      const dbEnvelope = await workflowHelper.getEnvelopeFromDatabase(envelope.id);
      expect(dbEnvelope?.title).toBe('Updated Mutable Title');
      expect(dbEnvelope?.description).toBe('Updated mutable description');
      expect(dbEnvelope?.createdBy).toBe(workflowHelper.getTestUser().userId); // Did not change
    });
  });

  describe('Template Field Validation', () => {
    it('should validate template fields for template origin', async () => {
      // Attempt to create template envelope without required fields
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'Invalid Template Test',
        description: 'Should fail due to missing template fields',
        originType: 'TEMPLATE'
        // Missing templateId and templateVersion
      });

      // Should fail during creation - need to handle this differently
      // Since createEnvelope returns EnvelopeData on success, we need to catch the error
      try {
        await workflowHelper.createEnvelope(envelopeData);
        fail('Expected createEnvelope to throw an error');
      } catch (error: any) {
        // Should fail with 422 error
        expect(error.statusCode).toBe(422);
        expect(error.message).toBe('templateId and templateVersion are required when originType is TEMPLATE');
      }
    });

    it('should succeed with valid template fields', async () => {
      // Create template envelope with valid fields
      const envelopeData = TestDataFactory.createEnvelopeData({
        title: 'Valid Template Test',
        description: 'Testing valid template creation',
        originType: 'TEMPLATE',
        templateId: 'valid-template-123',
        templateVersion: '1.0.0'
      });

      const envelope = await workflowHelper.createEnvelope(envelopeData);

      // Should succeed
      expect(envelope.id).toBeDefined();
      expect(envelope.title).toBe('Valid Template Test');
      expect(envelope.originType).toBe('TEMPLATE');
      expect(envelope.templateId).toBe('valid-template-123');
      expect(envelope.templateVersion).toBe('1.0.0');

      // Verify in database
      const dbEnvelope = await workflowHelper.getEnvelopeFromDatabase(envelope.id);
      expect(dbEnvelope?.templateId).toBe('valid-template-123');
      expect(dbEnvelope?.templateVersion).toBe('1.0.0');
    });
  });

  describe('Expiration Date Handling', () => {
    it('should update envelope expiration date', async () => {
      // Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Expiration Date Test',
          description: 'Testing expiration date updates'
        })
      );

      // Update expiration date
      const newExpirationDate = new Date('2024-12-31T23:59:59Z');
      const updateResponse = await workflowHelper.updateMetadata(envelope.id, {
        expiresAt: newExpirationDate.toISOString()
      });

      // Should succeed
      expect(updateResponse.statusCode).toBe(200);
      expect(new Date(updateResponse.data.expiresAt)).toEqual(newExpirationDate);

      // Verify in database
      const dbEnvelope = await workflowHelper.getEnvelopeFromDatabase(envelope.id);
      expect(dbEnvelope?.expiresAt).toEqual(newExpirationDate);
    });

    it('should handle multiple expiration date updates', async () => {
      // Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Multiple Expiration Updates',
          description: 'Testing multiple expiration date updates'
        })
      );

      // First expiration date update
      const firstExpiration = new Date('2024-06-30T23:59:59Z');
      await workflowHelper.updateMetadata(envelope.id, {
        expiresAt: firstExpiration.toISOString()
      });

      // Second expiration date update
      const secondExpiration = new Date('2024-12-31T23:59:59Z');
      const updateResponse = await workflowHelper.updateMetadata(envelope.id, {
        expiresAt: secondExpiration.toISOString()
      });

      // Should succeed with final date
      expect(updateResponse.statusCode).toBe(200);
      expect(new Date(updateResponse.data.expiresAt)).toEqual(secondExpiration);

      // Verify in database
      const dbEnvelope = await workflowHelper.getEnvelopeFromDatabase(envelope.id);
      expect(dbEnvelope?.expiresAt).toEqual(secondExpiration);
    });
  });

  describe('Metadata Update Validation', () => {
    it('should handle multiple metadata updates in sequence', async () => {
      // Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Sequential Metadata Updates',
          description: 'Testing sequential metadata updates'
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

      // Should succeed with final update
      expect(finalUpdate.statusCode).toBe(200);
      expect(finalUpdate.data.title).toBe('Final Update');
      expect(finalUpdate.data.description).toBe('Final description update');

      // Verify final state in database
      const dbEnvelope = await workflowHelper.getEnvelopeFromDatabase(envelope.id);
      expect(dbEnvelope?.title).toBe('Final Update');
      expect(dbEnvelope?.description).toBe('Final description update');
    });

    it('should handle partial metadata updates', async () => {
      // Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Partial Update Test',
          description: 'Testing partial metadata updates'
        })
      );

      // Update only title
      const titleUpdate = await workflowHelper.updateMetadata(envelope.id, {
        title: 'Updated Title Only'
      });

      expect(titleUpdate.statusCode).toBe(200);
      expect(titleUpdate.data.title).toBe('Updated Title Only');
      expect(titleUpdate.data.description).toBe('Testing partial metadata updates'); // Did not change

      // Update only description
      const descriptionUpdate = await workflowHelper.updateMetadata(envelope.id, {
        description: 'Updated Description Only'
      });

      expect(descriptionUpdate.statusCode).toBe(200);
      expect(descriptionUpdate.data.title).toBe('Updated Title Only'); // Did not change
      expect(descriptionUpdate.data.description).toBe('Updated Description Only');

      // Verify final state in database
      const dbEnvelope = await workflowHelper.getEnvelopeFromDatabase(envelope.id);
      expect(dbEnvelope?.title).toBe('Updated Title Only');
      expect(dbEnvelope?.description).toBe('Updated Description Only');
    });
  });
});
