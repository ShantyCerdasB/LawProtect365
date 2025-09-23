/**
 * @fileoverview get-envelopes-by-user-workflow.int.test.ts - Get envelopes by user workflow integration tests
 * @summary Complete get envelopes by user workflow tests with pagination and filtering
 * @description End-to-end integration tests for get envelopes by user functionality including
 * pagination, status filtering, and complete envelope information retrieval.
 * 
 * Test Coverage:
 * - Pagination with limit and cursor
 * - Status filtering (DRAFT, READY_FOR_SIGNATURE, COMPLETED, etc.)
 * - Complete envelope and signer information retrieval
 * - Error handling for missing pagination limit
 * - Multiple envelope scenarios
 */

import { WorkflowTestHelper, TestDataFactory } from '../helpers/workflowHelpers';

describe('Get Envelopes By User Workflow', () => {
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

  describe('Basic Pagination', () => {
    it('should get envelopes with pagination limit', async () => {
      // Create multiple envelopes
      const envelope1 = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Pagination Test 1',
          description: 'First envelope for pagination test'
        })
      );

      const envelope2 = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Pagination Test 2',
          description: 'Second envelope for pagination test'
        })
      );

      const envelope3 = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Pagination Test 3',
          description: 'Third envelope for pagination test'
        })
      );

      // Get envelopes with limit
      const getResponse = await workflowHelper.getEnvelopesByUser({
        limit: 2
      });

      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.data.envelopes).toBeDefined();
      expect(getResponse.data.envelopes).toHaveLength(2);
      expect(getResponse.data.signers).toBeDefined();
      expect(getResponse.data.signers).toHaveLength(2);
      expect(getResponse.data.nextCursor).toBeDefined();

      // Verify envelope information
      expect(getResponse.data.envelopes[0].id).toBeDefined();
      expect(getResponse.data.envelopes[0].title).toBeDefined();
      expect(getResponse.data.envelopes[0].status).toBe('DRAFT');
      expect(getResponse.data.envelopes[0].createdBy).toBe(workflowHelper.getTestUser().userId);
    });

    it('should fail when limit is not provided', async () => {
      const getResponse = await workflowHelper.getEnvelopesByUser({
        // limit: 10 // Missing limit
      } as any);

      expect(getResponse.statusCode).toBe(400);
      expect(getResponse.data.message).toContain('Pagination limit is required');
    });

    it('should handle empty results', async () => {
      // Get envelopes for user with no envelopes (different user)
      const getResponse = await workflowHelper.getEnvelopesByUser({
        limit: 10
      });

      // Should return empty array, not error
      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.data.envelopes).toBeDefined();
      expect(getResponse.data.envelopes).toHaveLength(0);
      expect(getResponse.data.signers).toBeDefined();
      expect(getResponse.data.signers).toHaveLength(0);
      expect(getResponse.data.nextCursor).toBeUndefined();
    });
  });

  describe('Status Filtering', () => {
    it('should filter envelopes by DRAFT status', async () => {
      // Create DRAFT envelope
      const draftEnvelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Draft Envelope',
          description: 'Testing draft status filtering'
        })
      );

      // Create another envelope and send it (changes status to READY_FOR_SIGNATURE)
      const readyEnvelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Ready Envelope',
          description: 'Testing ready status'
        })
      );

      const externalSigner = TestDataFactory.createSignerData({
        email: 'status.test@example.com',
        fullName: 'Status Test User',
        isExternal: true,
        order: 1
      });

      await workflowHelper.updateEnvelope(readyEnvelope.id, {
        addSigners: [externalSigner]
      });

      await workflowHelper.sendEnvelope(readyEnvelope.id, {
        sendToAll: true
      });

      // Filter by DRAFT status
      const getResponse = await workflowHelper.getEnvelopesByUser({
        status: 'DRAFT',
        limit: 10
      });

      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.data.envelopes).toBeDefined();
      
      // Should only return DRAFT envelopes
      const draftEnvelopes = getResponse.data.envelopes.filter((env: any) => env.status === 'DRAFT');
      expect(draftEnvelopes.length).toBeGreaterThan(0);
      
      // All returned envelopes should be DRAFT
      getResponse.data.envelopes.forEach((env: any) => {
        expect(env.status).toBe('DRAFT');
      });
    });

    it('should filter envelopes by READY_FOR_SIGNATURE status', async () => {
      // Create and send envelope to make it READY_FOR_SIGNATURE
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Ready for Signature Test',
          description: 'Testing ready for signature status'
        })
      );

      const externalSigner = TestDataFactory.createSignerData({
        email: 'ready.test@example.com',
        fullName: 'Ready Test User',
        isExternal: true,
        order: 1
      });

      await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner]
      });

      await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true
      });

      // Filter by READY_FOR_SIGNATURE status
      const getResponse = await workflowHelper.getEnvelopesByUser({
        status: 'READY_FOR_SIGNATURE',
        limit: 10
      });

      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.data.envelopes).toBeDefined();
      
      // Should only return READY_FOR_SIGNATURE envelopes
      getResponse.data.envelopes.forEach((env: any) => {
        expect(env.status).toBe('READY_FOR_SIGNATURE');
      });
    });
  });

  describe('Complete Envelope Information', () => {
    it('should return complete envelope and signer information', async () => {
      // Create envelope with external signers
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Complete Info Test',
          description: 'Testing complete information retrieval',
          originType: 'TEMPLATE',
          templateId: 'complete-template-123',
          templateVersion: '2.0.0'
        })
      );

      const externalSigner1 = TestDataFactory.createSignerData({
        email: 'complete1@example.com',
        fullName: 'Complete User One',
        isExternal: true,
        order: 1
      });

      const externalSigner2 = TestDataFactory.createSignerData({
        email: 'complete2@example.com',
        fullName: 'Complete User Two',
        isExternal: true,
        order: 2
      });

      await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner1, externalSigner2]
      });

      // Get envelopes
      const getResponse = await workflowHelper.getEnvelopesByUser({
        limit: 10
      });

      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.data.envelopes).toBeDefined();
      expect(getResponse.data.signers).toBeDefined();

      // Find our test envelope
      const testEnvelope = getResponse.data.envelopes.find((env: any) => env.id === envelope.id);
      expect(testEnvelope).toBeDefined();

      // Verify complete envelope information
      expect(testEnvelope.id).toBe(envelope.id);
      expect(testEnvelope.title).toBe('Complete Info Test');
      expect(testEnvelope.description).toBe('Testing complete information retrieval');
      expect(testEnvelope.status).toBe('DRAFT');
      expect(testEnvelope.signingOrderType).toBe('OWNER_FIRST');
      expect(testEnvelope.originType).toBe('TEMPLATE');
      expect(testEnvelope.templateId).toBe('complete-template-123');
      expect(testEnvelope.templateVersion).toBe('2.0.0');
      expect(testEnvelope.createdBy).toBe(workflowHelper.getTestUser().userId);
      expect(testEnvelope.createdAt).toBeDefined();
      expect(testEnvelope.updatedAt).toBeDefined();

      // Verify complete signer information
      const envelopeSigners = getResponse.data.signers.find((signers: any[]) => 
        signers.some((signer: any) => signer.email === 'complete1@example.com')
      );
      expect(envelopeSigners).toBeDefined();
      expect(envelopeSigners).toHaveLength(2);

      const signer1 = envelopeSigners.find((s: any) => s.email === 'complete1@example.com');
      const signer2 = envelopeSigners.find((s: any) => s.email === 'complete2@example.com');

      expect(signer1).toBeDefined();
      expect(signer1.email).toBe('complete1@example.com');
      expect(signer1.fullName).toBe('Complete User One');
      expect(signer1.isExternal).toBe(true);
      expect(signer1.order).toBe(1);
      expect(signer1.status).toBe('PENDING');
      expect(signer1.userId).toBeDefined(); // Should have generated external user ID

      expect(signer2).toBeDefined();
      expect(signer2.email).toBe('complete2@example.com');
      expect(signer2.fullName).toBe('Complete User Two');
      expect(signer2.isExternal).toBe(true);
      expect(signer2.order).toBe(2);
      expect(signer2.status).toBe('PENDING');
      expect(signer2.userId).toBeDefined(); // Should have generated external user ID
    });
  });

  describe('Pagination with Cursor', () => {
    it('should handle pagination with cursor for large result sets', async () => {
      // Create multiple envelopes
      const envelopes = [];
      for (let i = 1; i <= 5; i++) {
        const envelope = await workflowHelper.createEnvelope(
          TestDataFactory.createEnvelopeData({
            title: `Pagination Cursor Test ${i}`,
            description: `Testing pagination with cursor - envelope ${i}`
          })
        );
        envelopes.push(envelope);
      }

      // Get first page
      const firstPageResponse = await workflowHelper.getEnvelopesByUser({
        limit: 2
      });

      expect(firstPageResponse.statusCode).toBe(200);
      expect(firstPageResponse.data.envelopes).toHaveLength(2);
      expect(firstPageResponse.data.nextCursor).toBeDefined();

      // Get second page using cursor
      const secondPageResponse = await workflowHelper.getEnvelopesByUser({
        limit: 2,
        cursor: firstPageResponse.data.nextCursor
      });

      expect(secondPageResponse.statusCode).toBe(200);
      expect(secondPageResponse.data.envelopes).toHaveLength(2);
      
      // Verify no overlap between pages
      const firstPageIds = firstPageResponse.data.envelopes.map((env: any) => env.id);
      const secondPageIds = secondPageResponse.data.envelopes.map((env: any) => env.id);
      
      const overlap = firstPageIds.filter((id: string) => secondPageIds.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it('should return undefined nextCursor when no more results', async () => {
      // Create only one envelope
      await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Single Envelope Test',
          description: 'Testing single envelope pagination'
        })
      );

      // Get with limit higher than available results
      const getResponse = await workflowHelper.getEnvelopesByUser({
        limit: 10
      });

      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.data.envelopes).toBeDefined();
      expect(getResponse.data.nextCursor).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid status filter gracefully', async () => {
      const getResponse = await workflowHelper.getEnvelopesByUser({
        status: 'INVALID_STATUS',
        limit: 10
      });

      // Should return empty results, not error
      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.data.envelopes).toBeDefined();
      expect(getResponse.data.envelopes).toHaveLength(0);
    });

    it('should handle limit validation', async () => {
      // Test with limit too high
      const getResponse = await workflowHelper.getEnvelopesByUser({
        limit: 1000 // Assuming max limit is less than 1000
      });

      // Should either return results or handle gracefully
      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.data.envelopes).toBeDefined();
    });
  });
});
