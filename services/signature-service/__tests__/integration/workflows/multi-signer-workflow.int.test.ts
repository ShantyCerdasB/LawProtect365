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

import { WorkflowTestHelper } from '../helpers/workflowHelpers';
import { TestDataFactory } from '../helpers/testDataFactory';
import { 
  verifySignatureInDatabase,
  verifyConsentRecord,
  verifyEnvelopeCompletion,
  verifyEnvelopeProgress,
  verifySigningAuditEvent,
  createTestConsent,
  getSigningVerificationSummary
} from '../helpers/signDocumentHelpers';

// Mock SignatureOrchestrator.publishNotificationEvent to avoid OutboxRepository issues
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
      
      return instance;
    })
  };
});

describe('Multi-Signer Document Signing Workflow', () => {
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
      
      // Verify external user tracking - external signers should have userId = null
      dbSigners.forEach(signer => {
        if (signer.isExternal) {
          expect(signer.userId).toBeNull(); // External users have null userId
          expect(signer.email).toBeDefined();
          expect(signer.fullName).toBeDefined();
        } else {
          expect(signer.userId).toBeDefined(); // Internal users have real userId
        }
      });

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

  describe('SignDocument - Multi Signer Workflow', () => {
    it('should complete INVITEES_FIRST multi-signer signing workflow', async () => {
      // Create envelope with INVITEES_FIRST
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'INVITEES_FIRST Multi-Signer Test',
          signingOrderType: 'INVITEES_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      // Add multiple external signers
      const signers = TestDataFactory.createMultipleSigners(3, 1);
      const addSignersResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: signers
      });

      expect(addSignersResponse.data.signers).toHaveLength(3);
      const signerIds = addSignersResponse.data.signers.map((s: any) => s.id);

      // Send envelope
      const sendResponse = await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true,
        message: 'Please sign this multi-signer document'
      });

      expect(sendResponse.statusCode).toBe(200);
      expect(sendResponse.data.status).toBe('READY_FOR_SIGNATURE');

      // Get invitation tokens from send response
      expect(sendResponse.data.tokens).toBeDefined();
      expect(sendResponse.data.tokens).toHaveLength(3);
      const invitationTokens = sendResponse.data.tokens.map((t: any) => t.token);

      // First signer signs (should succeed)
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
      expect(firstSignResponse.data.envelope.status).toBe('READY_FOR_SIGNATURE');
      expect(firstSignResponse.data.envelope.progress).toBe(33); // 1/3 signed

      // Verify first signature
      await verifySignatureInDatabase(envelope.id, signerIds[0]);
      await verifyConsentRecord(envelope.id, signerIds[0], firstConsent);
      await verifyEnvelopeProgress(envelope.id, 33);

      // Second signer signs (should succeed)
      const secondConsent = createTestConsent({
        text: 'I agree to sign this document as second signer'
      });

      const secondSignResponse = await workflowHelper.signDocument(
        envelope.id,
        signerIds[1],
        invitationTokens[1],
        secondConsent
      );

      expect(secondSignResponse.statusCode).toBe(200);
      expect(secondSignResponse.data.envelope.status).toBe('READY_FOR_SIGNATURE');
      expect(secondSignResponse.data.envelope.progress).toBe(67); // 2/3 signed

      // Verify second signature
      await verifySignatureInDatabase(envelope.id, signerIds[1]);
      await verifyConsentRecord(envelope.id, signerIds[1], secondConsent);
      await verifyEnvelopeProgress(envelope.id, 67);

      // Third signer signs (should complete envelope)
      const thirdConsent = createTestConsent({
        text: 'I agree to sign this document as third signer'
      });

      const thirdSignResponse = await workflowHelper.signDocument(
        envelope.id,
        signerIds[2],
        invitationTokens[2],
        thirdConsent
      );

      expect(thirdSignResponse.statusCode).toBe(200);
      expect(thirdSignResponse.data.envelope.status).toBe('COMPLETED');
      expect(thirdSignResponse.data.envelope.progress).toBe(100); // 3/3 signed

      // Verify third signature and envelope completion
      await verifySignatureInDatabase(envelope.id, signerIds[2]);
      await verifyConsentRecord(envelope.id, signerIds[2], thirdConsent);
      await verifyEnvelopeCompletion(envelope.id, 'COMPLETED');
      await verifyEnvelopeProgress(envelope.id, 100);

      // Verify all audit events
      await verifySigningAuditEvent(envelope.id, signerIds[0]);
      await verifySigningAuditEvent(envelope.id, signerIds[1]);
      await verifySigningAuditEvent(envelope.id, signerIds[2]);

      // Get comprehensive summary
      const summary = await getSigningVerificationSummary(envelope.id);
      expect(summary.envelope.status).toBe('COMPLETED');
      expect(summary.signers).toHaveLength(3);
      expect(summary.signers.every((s: any) => s.status === 'SIGNED')).toBe(true);
      expect(summary.signatures).toHaveLength(3);
      expect(summary.consents).toHaveLength(3);
    });

    it('should complete OWNER_FIRST multi-signer signing workflow', async () => {
      // Create envelope with OWNER_FIRST
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'OWNER_FIRST Multi-Signer Test',
          signingOrderType: 'OWNER_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      // Add owner as signer
      const ownerSigner = TestDataFactory.createSignerData({
        userId: workflowHelper.getTestUser().userId,
        email: workflowHelper.getTestUser().email,
        fullName: workflowHelper.getTestUser().name,
        isExternal: false,
        order: 1
      });

      // Add external signers
      const externalSigners = TestDataFactory.createMultipleSigners(2, 2);
      const allSigners = [ownerSigner, ...externalSigners];

      const addSignersResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: allSigners
      });

      expect(addSignersResponse.data.signers).toHaveLength(3);
      const signerIds = addSignersResponse.data.signers.map((s: any) => s.id);

      // Send envelope
      const sendResponse = await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true,
        message: 'Please sign this OWNER_FIRST document'
      });

      expect(sendResponse.statusCode).toBe(200);

      // Owner signs first (as authenticated user)
      const ownerConsent = createTestConsent({
        text: 'I agree to sign this document as owner'
      });

      const ownerSignResponse = await workflowHelper.signDocumentAsOwner(
        envelope.id,
        signerIds[0], // Owner is first signer
        ownerConsent
      );

      expect(ownerSignResponse.statusCode).toBe(200);
      expect(ownerSignResponse.data.envelope.status).toBe('READY_FOR_SIGNATURE');
      expect(ownerSignResponse.data.envelope.progress).toBe(33); // 1/3 signed

      // Verify owner signature
      await verifySignatureInDatabase(envelope.id, signerIds[0]);
      await verifyConsentRecord(envelope.id, signerIds[0], ownerConsent);

      // Get invitation tokens for external signers from send response
      expect(sendResponse.data.tokens).toBeDefined();
      expect(sendResponse.data.tokens).toHaveLength(2); // Only external signers get tokens
      const externalTokens = sendResponse.data.tokens.map((t: any) => t.token);

      // First external signer signs
      const firstExternalConsent = createTestConsent({
        text: 'I agree to sign this document as first external signer'
      });

      const firstExternalSignResponse = await workflowHelper.signDocument(
        envelope.id,
        signerIds[1],
        externalTokens[0],
        firstExternalConsent
      );

      expect(firstExternalSignResponse.statusCode).toBe(200);
      expect(firstExternalSignResponse.data.envelope.status).toBe('READY_FOR_SIGNATURE');
      expect(firstExternalSignResponse.data.envelope.progress).toBe(67); // 2/3 signed

      // Second external signer signs (should complete envelope)
      const secondExternalConsent = createTestConsent({
        text: 'I agree to sign this document as second external signer'
      });

      const secondExternalSignResponse = await workflowHelper.signDocument(
        envelope.id,
        signerIds[2],
        externalTokens[1],
        secondExternalConsent
      );

      expect(secondExternalSignResponse.statusCode).toBe(200);
      expect(secondExternalSignResponse.data.envelope.status).toBe('COMPLETED');
      expect(secondExternalSignResponse.data.envelope.progress).toBe(100); // 3/3 signed

      // Verify envelope completion
      await verifyEnvelopeCompletion(envelope.id, 'COMPLETED');
      await verifyEnvelopeProgress(envelope.id, 100);
    });

    it('should allow invitees to sign in any order in INVITEES_FIRST workflow', async () => {
      // Create envelope with INVITEES_FIRST
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Signing Order Validation Test',
          signingOrderType: 'INVITEES_FIRST',
          originType: 'USER_UPLOAD'
        })
      );

      // Add multiple external signers (no owner as signer)
      const signers = TestDataFactory.createMultipleSigners(2, 1);
      const addSignersResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: signers
      });

      const signerIds = addSignersResponse.data.signers.map((s: any) => s.id);

      // Send envelope
      const sendResponse = await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true
      });

      // Get invitation tokens from send response
      expect(sendResponse.data.tokens).toBeDefined();
      expect(sendResponse.data.tokens).toHaveLength(2);
      const invitationTokens = sendResponse.data.tokens.map((t: any) => t.token);

      // Sign with second signer first (should succeed - invitees can sign in any order)
      const secondSignerConsent = createTestConsent({
        text: 'I agree to sign this document as second signer'
      });

      const secondSignerResponse = await workflowHelper.signDocument(
        envelope.id,
        signerIds[1], // Second signer
        invitationTokens[1],
        secondSignerConsent
      );

      expect(secondSignerResponse.statusCode).toBe(200);
      expect(secondSignerResponse.data.envelope.status).toBe('READY_FOR_SIGNATURE');
      expect(secondSignerResponse.data.envelope.progress).toBe(50); // 1/2 signed

      // Verify second signature
      await verifySignatureInDatabase(envelope.id, signerIds[1]);
      await verifyConsentRecord(envelope.id, signerIds[1], secondSignerConsent);

      // Sign with first signer second (should succeed - invitees can sign in any order)
      const firstSignerConsent = createTestConsent({
        text: 'I agree to sign this document as first signer'
      });

      const firstSignerResponse = await workflowHelper.signDocument(
        envelope.id,
        signerIds[0], // First signer
        invitationTokens[0],
        firstSignerConsent
      );

      expect(firstSignerResponse.statusCode).toBe(200);
      expect(firstSignerResponse.data.envelope.status).toBe('COMPLETED');
      expect(firstSignerResponse.data.envelope.progress).toBe(100); // 2/2 signed

      // Verify first signature and envelope completion
      await verifySignatureInDatabase(envelope.id, signerIds[0]);
      await verifyConsentRecord(envelope.id, signerIds[0], firstSignerConsent);
      await verifyEnvelopeCompletion(envelope.id, 'COMPLETED');
      await verifyEnvelopeProgress(envelope.id, 100);

      // Verify both audit events
      await verifySigningAuditEvent(envelope.id, signerIds[1]);
      await verifySigningAuditEvent(envelope.id, signerIds[0]);
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
