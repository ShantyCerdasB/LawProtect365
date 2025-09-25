/**
 * @fileoverview multi-user-security-workflow.int.test - Multi-user security integration tests
 * @summary Tests security between different users and their envelope access
 * @description This module contains integration tests that validate security boundaries
 * between different users, ensuring that users cannot access each other's envelopes
 * using invitation tokens from different envelopes.
 */

import { MultiUserTestHelper } from '../helpers/multiUserTestHelper';
import { TestDataFactory } from '../helpers/testDataFactory';
import { TestUtils } from '../../helpers/testUtils';
import { secureRandomString } from '../helpers/testHelpers';

// Mock SignatureOrchestrator to bypass OutboxRepository
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

        // Register invitation in outboxMock for verification
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
              id: `mock-${Date.now()}-${secureRandomString(8)}`,
              timestamp: new Date().toISOString()
            });

            console.log('✅ Mocked invitation registered:', { envelopeId: envelopeIdStr, signerId });
          }
        }

        console.log('✅ Mocked publishNotificationEvent completed successfully');
        return Promise.resolve();
      });

      return instance;
    })
  };
});

describe('Multi-User Security Workflow', () => {
  let multiUserHelper: MultiUserTestHelper;

  beforeAll(async () => {
    multiUserHelper = new MultiUserTestHelper();
    await multiUserHelper.initialize();
  });

  afterEach(() => {
    // Clear mock data after each test to prevent interference
    const { outboxMockHelpers } = require('../mocks');
    outboxMockHelpers.clearAllMockData();
  });

  describe('Cross-User Security Validation', () => {
    it('should prevent user from accessing another user\'s envelope with wrong invitation token', async () => {
      // User 1 creates envelope with external signer
      const user1Envelope = await multiUserHelper.createEnvelope('test@example.com', 
        TestDataFactory.createEnvelopeData({
          title: 'User 1 Security Test',
          description: 'Testing security between users'
        })
      );

      // User 2 creates envelope with external signer
      const user2Envelope = await multiUserHelper.createEnvelope('test2@example.com', 
        TestDataFactory.createEnvelopeData({
          title: 'User 2 Security Test',
          description: 'Testing security between users'
        })
      );

      // Add external signers to both envelopes
      const externalSigner1 = TestDataFactory.createSignerData({
        email: 'security.test1@example.com',
        fullName: 'Security Test User 1',
        isExternal: true,
        order: 1
      });

      const externalSigner2 = TestDataFactory.createSignerData({
        email: 'security.test2@example.com',
        fullName: 'Security Test User 2',
        isExternal: true,
        order: 1
      });

      // Update metadata for both envelopes
      await multiUserHelper.updateEnvelope('test@example.com', user1Envelope.id, {
        title: 'User 1 Security Test - Updated',
        description: 'Testing security between users - Updated',
        expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      await multiUserHelper.updateEnvelope('test2@example.com', user2Envelope.id, {
        title: 'User 2 Security Test - Updated',
        description: 'Testing security between users - Updated',
        expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      // Add signers to both envelopes
      const user1SignerResponse = await multiUserHelper.updateEnvelope('test@example.com', user1Envelope.id, {
        addSigners: [externalSigner1]
      });

      const user2SignerResponse = await multiUserHelper.updateEnvelope('test2@example.com', user2Envelope.id, {
        addSigners: [externalSigner2]
      });

      expect(user1SignerResponse.statusCode).toBe(200);
      expect(user2SignerResponse.statusCode).toBe(200);

      // Send both envelopes to generate invitation tokens
      const user1SendResponse = await multiUserHelper.sendEnvelope('test@example.com', user1Envelope.id, {
        sendToAll: true
      });

      const user2SendResponse = await multiUserHelper.sendEnvelope('test2@example.com', user2Envelope.id, {
        sendToAll: true
      });

      expect(user1SendResponse.statusCode).toBe(200);
      expect(user2SendResponse.statusCode).toBe(200);
      expect(user1SendResponse.data.tokens).toBeDefined();
      expect(user2SendResponse.data.tokens).toBeDefined();
      expect(user1SendResponse.data.tokens).toHaveLength(1);
      expect(user2SendResponse.data.tokens).toHaveLength(1);

      // Get invitation tokens
      const user1Token = user1SendResponse.data.tokens[0].token;
      const user2Token = user2SendResponse.data.tokens[0].token;

      // Test 1: User 1's signer tries to access User 1's envelope with correct token (should succeed)
      const user1CorrectAccess = await multiUserHelper.getEnvelopeWithToken(user1Envelope.id, user1Token);
      expect(user1CorrectAccess.statusCode).toBe(200);
      expect(user1CorrectAccess.data.id).toBe(user1Envelope.id);
      expect(user1CorrectAccess.data.accessType).toBe('EXTERNAL');

      // Test 2: User 2's signer tries to access User 2's envelope with correct token (should succeed)
      const user2CorrectAccess = await multiUserHelper.getEnvelopeWithToken(user2Envelope.id, user2Token);
      expect(user2CorrectAccess.statusCode).toBe(200);
      expect(user2CorrectAccess.data.id).toBe(user2Envelope.id);
      expect(user2CorrectAccess.data.accessType).toBe('EXTERNAL');

      // Test 3: User 1's signer tries to access User 2's envelope with User 1's token (should fail)     
      const crossAccessAttempt = await multiUserHelper.getEnvelopeWithToken(user2Envelope.id, user1Token);
      expect(crossAccessAttempt.statusCode).toBe(403);
      expect(crossAccessAttempt.data.message).toContain('Access denied to envelope');

      // Test 4: User 2's signer tries to access User 1's envelope with User 2's token (should fail)
      const crossAccessAttempt2 = await multiUserHelper.getEnvelopeWithToken(user1Envelope.id, user2Token);
      expect(crossAccessAttempt2.statusCode).toBe(403);
      expect(crossAccessAttempt2.data.message).toContain('Access denied to envelope');

      // Test 5: Try to access envelope with token from different envelope (should fail with 403)
      // Create a third envelope by User 1
      const user1Envelope3 = await multiUserHelper.createEnvelope('test@example.com', 
        TestDataFactory.createEnvelopeData({
          title: 'User 1 Envelope 3',
          description: 'Third envelope by User 1'
        })
      );
      await multiUserHelper.updateMetadata('test@example.com', user1Envelope3.id, {
        sourceKey: multiUserHelper.getTestSourceKey('test@example.com'),
        metaKey: `test-meta/${TestUtils.generateUuid()}.json`
      });
      const signer3 = TestDataFactory.createSignerData({ 
        email: 'signer3@user1.com', 
        fullName: 'Signer Three User One', 
        isExternal: true, 
        order: 1 
      });
      await multiUserHelper.updateEnvelope('test@example.com', user1Envelope3.id, { addSigners: [signer3] });
      const sendResponse3 = await multiUserHelper.sendEnvelope('test@example.com', user1Envelope3.id, { sendToAll: true });
      const user1Token3 = sendResponse3.data.tokens[0].token;

      // Try to access User 1's envelope 1 with token from User 1's envelope 3 (should fail with 403)
      const crossEnvelopeAccess = await multiUserHelper.getEnvelopeWithToken(user1Envelope.id, user1Token3);
      expect(crossEnvelopeAccess.statusCode).toBe(403);
      expect(crossEnvelopeAccess.data.message).toContain('Access denied to envelope');
    });

    it('should prevent access with invalid or expired tokens', async () => {
      // User 1 creates envelope
      const user1Envelope = await multiUserHelper.createEnvelope('test@example.com', 
        TestDataFactory.createEnvelopeData({
          title: 'Token Validation Test',
          description: 'Testing invalid token access'
        })
      );

      // Add external signer
      const externalSigner = TestDataFactory.createSignerData({
        email: 'token.validation@example.com',
        fullName: 'Token Validation User',
        isExternal: true,
        order: 1
      });

      // Update metadata and add signer
      await multiUserHelper.updateEnvelope('test@example.com', user1Envelope.id, {
        title: 'Token Validation Test - Updated',
        description: 'Testing invalid token access - Updated',
        expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      const signerResponse = await multiUserHelper.updateEnvelope('test@example.com', user1Envelope.id, {
        addSigners: [externalSigner]
      });

      expect(signerResponse.statusCode).toBe(200);

      // Send envelope to generate valid token
      const sendResponse = await multiUserHelper.sendEnvelope('test@example.com', user1Envelope.id, {
        sendToAll: true
      });

      expect(sendResponse.statusCode).toBe(200);
      const validToken = sendResponse.data.tokens[0].token;

      // Test with invalid tokens
      const invalidTokenTests = [
        { token: 'invalid-token-123', description: 'completely invalid token' },
        { token: 'expired-token-456', description: 'fake expired token' }
      ];

      for (const test of invalidTokenTests) {
        const response = await multiUserHelper.getEnvelopeWithToken(user1Envelope.id, test.token);
        expect(response.statusCode).toBe(401);
        expect(response.data.message).toContain('Invalid invitation token');
        console.log(`✅ Correctly rejected ${test.description}`);
      }

      // Verify valid token still works
      const validAccess = await multiUserHelper.getEnvelopeWithToken(user1Envelope.id, validToken);
      expect(validAccess.statusCode).toBe(200);
      expect(validAccess.data.id).toBe(user1Envelope.id);
    });

    it('should maintain user isolation in envelope listing', async () => {
      // Both users create multiple envelopes
      const user1Envelopes: any[] = [];
      const user2Envelopes: any[] = [];

      // User 1 creates 2 envelopes
      for (let i = 1; i <= 2; i++) {
        const envelope = await multiUserHelper.createEnvelope('test@example.com', 
          TestDataFactory.createEnvelopeData({
            title: `User 1 Envelope ${i}`,
            description: `User 1 envelope ${i} for isolation test`
          })
        );
        user1Envelopes.push(envelope);
      }

      // User 2 creates 2 envelopes
      for (let i = 1; i <= 2; i++) {
        const envelope = await multiUserHelper.createEnvelope('test2@example.com', 
          TestDataFactory.createEnvelopeData({
            title: `User 2 Envelope ${i}`,
            description: `User 2 envelope ${i} for isolation test`
          })
        );
        user2Envelopes.push(envelope);
      }

      // Verify each user can only see their own envelopes
      expect(user1Envelopes).toHaveLength(2);
      expect(user2Envelopes).toHaveLength(2);

      // Verify envelope ownership
      user1Envelopes.forEach(envelope => {
        expect(envelope.createdBy).toBe(multiUserHelper.getTestUser('test@example.com').userId);
      });

      user2Envelopes.forEach(envelope => {
        expect(envelope.createdBy).toBe(multiUserHelper.getTestUser('test2@example.com').userId);
      });

      // Test user isolation: User 1 should only see their own envelopes
      const user1EnvelopesResponse = await multiUserHelper.getEnvelopesByUser('test@example.com', {
        limit: 10
      });

      expect(user1EnvelopesResponse.statusCode).toBe(200);
      expect(user1EnvelopesResponse.data.envelopes).toBeDefined();
      
      // User 1 should only see envelopes they created
      user1EnvelopesResponse.data.envelopes.forEach((envelope: any) => {
        expect(envelope.createdBy).toBe(multiUserHelper.getTestUser('test@example.com').userId);
      });

      // Test user isolation: User 2 should only see their own envelopes
      const user2EnvelopesResponse = await multiUserHelper.getEnvelopesByUser('test2@example.com', {
        limit: 10
      });

      expect(user2EnvelopesResponse.statusCode).toBe(200);
      expect(user2EnvelopesResponse.data.envelopes).toBeDefined();
      
      // User 2 should only see envelopes they created
      user2EnvelopesResponse.data.envelopes.forEach((envelope: any) => {
        expect(envelope.createdBy).toBe(multiUserHelper.getTestUser('test2@example.com').userId);
      });

      console.log('✅ User isolation verified - each user can only see their own envelopes');
    });
  });
});
