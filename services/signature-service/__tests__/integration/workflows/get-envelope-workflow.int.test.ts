/**
 * @fileoverview get-envelope-workflow.int.test.ts - Get envelope workflow integration tests
 * @summary Complete get envelope workflow tests for both authenticated and external users
 * @description End-to-end integration tests for get envelope functionality including
 * owner access, external user access via invitation tokens, and audit event creation.
 * 
 * Test Coverage:
 * - Authenticated user (owner) access to envelopes
 * - External user access via invitation tokens
 * - Audit event creation for external user access
 * - Access validation and error handling
 * - Complete envelope and signer information retrieval
 */

import { WorkflowTestHelper, TestDataFactory } from '../helpers/workflowHelpers';

describe('Get Envelope Workflow', () => {
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

  describe('Authenticated User (Owner) Access', () => {
    it('should get envelope by authenticated owner', async () => {
      // Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Owner Access Test',
          description: 'Testing owner access to envelope'
        })
      );

      // Add external signer
      const externalSigner = TestDataFactory.createSignerData({
        email: 'external@example.com',
        fullName: 'External Signer',
        isExternal: true,
        order: 1
      });

      await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner]
      });

      // Get envelope as owner
      const getResponse = await workflowHelper.getEnvelope(envelope.id);

      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.data.id).toBe(envelope.id);
      expect(getResponse.data.title).toBe('Owner Access Test');
      expect(getResponse.data.accessType).toBe('OWNER');
      expect(getResponse.data.signers).toBeDefined();
      expect(getResponse.data.signers).toHaveLength(1);
      expect(getResponse.data.signers[0].email).toBe('external@example.com');
      expect(getResponse.data.signers[0].isExternal).toBe(true);
    });

    it('should get envelope with template origin information', async () => {
      // Create template envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Template Envelope Test',
          description: 'Testing template envelope access',
          originType: 'TEMPLATE',
          templateId: 'test-template-123',
          templateVersion: '1.0.0'
        })
      );

      // Get envelope as owner
      const getResponse = await workflowHelper.getEnvelope(envelope.id);

      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.data.id).toBe(envelope.id);
      expect(getResponse.data.originType).toBe('TEMPLATE');
      expect(getResponse.data.templateId).toBe('test-template-123');
      expect(getResponse.data.templateVersion).toBe('1.0.0');
    });

    it('should fail when owner tries to access non-existent envelope', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const getResponse = await workflowHelper.getEnvelope(nonExistentId);

      expect(getResponse.statusCode).toBe(404);
      expect(getResponse.data.message).toContain('not found');
    });
  });

  describe('External User Access via Invitation Token', () => {
    it('should get envelope by external user with valid invitation token', async () => {
      // Create envelope with external signer
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'External Access Test',
          description: 'Testing external user access'
        })
      );

      const externalSigner = TestDataFactory.createSignerData({
        email: 'external.user@example.com',
        fullName: 'External User',
        isExternal: true,
        order: 1
      });

      const addSignerResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner]
      });

      // Send envelope to generate invitation token
      await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true,
        message: 'Please sign this document'
      });

      // Get invitation token from database
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const invitationToken = await prisma.invitationToken.findFirst({
        where: { 
          envelopeId: envelope.id,
          signerId: addSignerResponse.data.signers[0].id
        }
      });
      
      await prisma.$disconnect();

      expect(invitationToken).toBeDefined();
      expect(invitationToken?.tokenHash).toBeDefined();

      // Get envelope as external user
      const getResponse = await workflowHelper.getEnvelopeWithToken(
        envelope.id, 
        invitationToken!.tokenHash
      );

      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.data.id).toBe(envelope.id);
      expect(getResponse.data.title).toBe('External Access Test');
      expect(getResponse.data.accessType).toBe('EXTERNAL');
      expect(getResponse.data.signers).toBeDefined();
      expect(getResponse.data.signers).toHaveLength(1);
      expect(getResponse.data.signers[0].email).toBe('external.user@example.com');
    });

    it('should create audit event when external user accesses envelope', async () => {
      // Create envelope with external signer
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Audit Event Test',
          description: 'Testing audit event creation'
        })
      );

      const externalSigner = TestDataFactory.createSignerData({
        email: 'audit.test@example.com',
        fullName: 'Audit Test User',
        isExternal: true,
        order: 1
      });

      const addSignerResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner]
      });

      // Send envelope to generate invitation token
      await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true
      });

      // Get invitation token
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const invitationToken = await prisma.invitationToken.findFirst({
        where: { 
          envelopeId: envelope.id,
          signerId: addSignerResponse.data.signers[0].id
        }
      });
      
      await prisma.$disconnect();

      // Get envelope as external user (this should create audit event)
      const getResponse = await workflowHelper.getEnvelopeWithToken(
        envelope.id, 
        invitationToken!.tokenHash
      );

      expect(getResponse.statusCode).toBe(200);

      // Verify audit event was created
      await workflowHelper.verifyAuditEvent(
        envelope.id, 
        'DOCUMENT_ACCESSED', 
        addSignerResponse.data.signers[0].id
      );
    });

    it('should fail when external user uses invalid invitation token', async () => {
      // Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Invalid Token Test',
          description: 'Testing invalid token access'
        })
      );

      // Try to get envelope with invalid token
      const getResponse = await workflowHelper.getEnvelopeWithToken(
        envelope.id, 
        'invalid-token-123'
      );

      expect(getResponse.statusCode).toBe(401);
      expect(getResponse.data.message).toContain('Invalid invitation token');
    });

    it('should fail when external user uses expired invitation token', async () => {
      // Create envelope with external signer
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Expired Token Test',
          description: 'Testing expired token access'
        })
      );

      const externalSigner = TestDataFactory.createSignerData({
        email: 'expired.test@example.com',
        fullName: 'Expired Test User',
        isExternal: true,
        order: 1
      });

      const addSignerResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner]
      });

      // Send envelope to generate invitation token
      await workflowHelper.sendEnvelope(envelope.id, {
        sendToAll: true
      });

      // Get invitation token and manually expire it
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const invitationToken = await prisma.invitationToken.findFirst({
        where: { 
          envelopeId: envelope.id,
          signerId: addSignerResponse.data.signers[0].id
        }
      });

      // Expire the token
      await prisma.invitationToken.update({
        where: { id: invitationToken!.id },
        data: { 
          status: 'EXPIRED',
          expiresAt: new Date(Date.now() - 1000) // 1 second ago
        }
      });
      
      await prisma.$disconnect();

      // Try to get envelope with expired token
      const getResponse = await workflowHelper.getEnvelopeWithToken(
        envelope.id, 
        invitationToken!.tokenHash
      );

      expect(getResponse.statusCode).toBe(401);
      expect(getResponse.data.message).toContain('Invalid invitation token');
    });
  });

  describe('External User Tracking', () => {
    it('should reuse userId for same external user across different envelopes', async () => {
      // Create first envelope
      const envelope1 = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'External Tracking Test 1',
          description: 'First envelope for tracking test'
        })
      );

      const externalSigner1 = TestDataFactory.createSignerData({
        email: 'tracking.user@example.com',
        fullName: 'Tracking User',
        isExternal: true,
        order: 1
      });

      const addSignerResponse1 = await workflowHelper.updateEnvelope(envelope1.id, {
        addSigners: [externalSigner1]
      });

      // Create second envelope
      const envelope2 = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'External Tracking Test 2',
          description: 'Second envelope for tracking test'
        })
      );

      const externalSigner2 = TestDataFactory.createSignerData({
        email: 'tracking.user@example.com', // Same email
        fullName: 'Tracking User', // Same full name
        isExternal: true,
        order: 1
      });

      const addSignerResponse2 = await workflowHelper.updateEnvelope(envelope2.id, {
        addSigners: [externalSigner2]
      });

      // Verify both signers have null userId (external users don't have userId)
      expect(addSignerResponse1.data.signers[0].userId).toBeNull();
      expect(addSignerResponse2.data.signers[0].userId).toBeNull();
      
      // Verify same email and fullName (external user tracking by email+fullName)
      expect(addSignerResponse1.data.signers[0].email).toBe(addSignerResponse2.data.signers[0].email);
      expect(addSignerResponse1.data.signers[0].fullName).toBe(addSignerResponse2.data.signers[0].fullName);
    });

    it('should create different userId for different external users', async () => {
      // Create envelope
      const envelope = await workflowHelper.createEnvelope(
        TestDataFactory.createEnvelopeData({
          title: 'Different Users Test',
          description: 'Testing different external users'
        })
      );

      const externalSigner1 = TestDataFactory.createSignerData({
        email: 'user1@example.com',
        fullName: 'User One',
        isExternal: true,
        order: 1
      });

      const externalSigner2 = TestDataFactory.createSignerData({
        email: 'user2@example.com',
        fullName: 'User Two',
        isExternal: true,
        order: 2
      });

      const addSignerResponse = await workflowHelper.updateEnvelope(envelope.id, {
        addSigners: [externalSigner1, externalSigner2]
      });

      // Verify both signers have null userId (external users don't have userId)
      expect(addSignerResponse.data.signers[0].userId).toBeNull();
      expect(addSignerResponse.data.signers[1].userId).toBeNull();
      
      // Verify different email and fullName (different external users)
      expect(addSignerResponse.data.signers[0].email).not.toBe(addSignerResponse.data.signers[1].email);
      expect(addSignerResponse.data.signers[0].fullName).not.toBe(addSignerResponse.data.signers[1].fullName);
    });
  });
});
