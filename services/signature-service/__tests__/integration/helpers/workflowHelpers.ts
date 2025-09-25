/**
 * @fileoverview workflowHelpers - Shared utilities for integration workflow tests
 * @summary Provides common workflow operations and test utilities
 * @description This module contains shared utilities for integration tests, including
 * workflow operations, database helpers, and common assertions. These helpers
 * reduce code duplication and provide consistent test patterns across all workflow tests.
 * Type definitions are imported from testTypes.ts and test data factories from testDataFactory.ts.
 */

import { TestDataFactory, SignerData } from './testDataFactory';
import { TestUser, EnvelopeData } from './testTypes';
import { TestEnvironmentManager } from './testEnvironmentManager';
import { EnvelopeOperations } from './envelopeOperations';
import { DatabaseHelper } from './databaseHelper';
import { AuditHelper } from './auditHelper';



/**
 * Workflow test helper class
 * Provides common operations for integration workflow tests
 */
export class WorkflowTestHelper {
  private environmentManager: TestEnvironmentManager;
  private envelopeOperations: EnvelopeOperations | null = null;
  private databaseHelper: DatabaseHelper;
  private auditHelper: AuditHelper;

  constructor() {
    this.environmentManager = new TestEnvironmentManager();
    this.databaseHelper = new DatabaseHelper();
    this.auditHelper = new AuditHelper();
  }

  /**
   * Initialize test environment with seeded user and test document
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    await this.environmentManager.initialize();
    
    // Initialize envelope operations with test user and source key
    this.envelopeOperations = new EnvelopeOperations(
      this.environmentManager.getTestUser(),
      this.environmentManager.getTestSourceKey()
    );
  }

  /**
   * Get the test user data
   * @returns Test user data
   * @throws Error if test user is not initialized
   */
  getTestUser(): TestUser {
    return this.environmentManager.getTestUser();
  }

  /**
   * Get the test source key for S3
   * @returns Test source key
   * @throws Error if test source key is not initialized
   */
  getTestSourceKey(): string {
    return this.environmentManager.getTestSourceKey();
  }

  /**
   * Get the second test user data (for authorization testing)
   * @returns Second test user data
   */
  getSecondTestUser(): TestUser {
    return {
      userId: '660e8400-e29b-41d4-a716-446655440001',
      email: 'test2@example.com',
      name: 'Test User 2',
      role: 'ADMIN'
    };
  }

  /**
   * Generate JWT token for testing
   * @param userId - User ID for the token
   * @param email - Email for the token
   * @returns Promise that resolves to JWT token
   */
  async generateTestJwtToken(userId: string, email: string): Promise<string> {
    const { generateTestJwtToken } = await import('./testHelpers');
    return generateTestJwtToken({
      sub: userId,
      email: email,
      roles: ['admin'],
      scopes: []
    });
  }

  /**
   * Create authenticated API Gateway event
   * @param overrides - Optional overrides for the event
   * @returns Promise that resolves to the authenticated event
   */
  async makeAuthEvent(overrides?: any): Promise<any> {
    return this.environmentManager.makeAuthEvent(overrides);
  }

  /**
   * Create envelope with specified data
   * @param envelopeData - Envelope creation data
   * @returns Promise that resolves to the created envelope data
   */
  async createEnvelope(envelopeData: {
    title: string;
    description: string;
    signingOrderType?: string;
    originType: string;
    templateId?: string;
    templateVersion?: string;
    sourceKey?: string;
    metaKey?: string;
  }): Promise<EnvelopeData> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.createEnvelope(envelopeData);
  }

  /**
   * Update envelope with specified data
   * @param envelopeId - ID of the envelope to update
   * @param updateData - Update data
   * @returns Promise that resolves to the update response
   */
  async updateEnvelope(envelopeId: string, updateData: Record<string, any>): Promise<{
    statusCode: number;
    data: any;
  }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.updateEnvelope(envelopeId, updateData);
  }

  /**
   * Update envelope metadata
   * @param envelopeId - ID of the envelope
   * @param metadata - Metadata to update
   * @returns Promise that resolves to the update response
   */
  async updateMetadata(envelopeId: string, metadata: {
    title?: string;
    description?: string;
    expiresAt?: string;
    sourceKey?: string;
    metaKey?: string;
  }): Promise<{
    statusCode: number;
    data: any;
  }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.updateMetadata(envelopeId, metadata);
  }

  /**
   * Get signers from database for verification
   * @param envelopeId - ID of the envelope
   * @returns Promise that resolves to array of signers
   */
  async getSignersFromDatabase(envelopeId: string): Promise<any[]> {
    return this.databaseHelper.getSignersFromDatabase(envelopeId);
  }

  /**
   * Get envelope from database for verification
   * @param envelopeId - ID of the envelope
   * @returns Promise that resolves to envelope data
   */
  async getEnvelopeFromDatabase(envelopeId: string): Promise<any> {
    return this.databaseHelper.getEnvelopeFromDatabase(envelopeId);
  }

  /**
   * Send envelope to signers
   * @param envelopeId - The envelope ID to send
   * @param options - Send options including message and signer targeting
   * @returns Send envelope response
   */
  async sendEnvelope(
    envelopeId: string,
    options: {
      message?: string;
      sendToAll?: boolean;
      signers?: Array<{
        signerId: string;
        message?: string;
      }>;
    }
  ): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.sendEnvelope(envelopeId, options);
  }

  /**
   * Get envelope by ID (authenticated user)
   * @param envelopeId - The envelope ID to get
   * @returns Get envelope response
   */
  async getEnvelope(envelopeId: string): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.getEnvelope(envelopeId);
  }

  /**
   * Get envelope by ID with invitation token (external user)
   * @param envelopeId - The envelope ID to get
   * @param invitationToken - The invitation token for external access
   * @returns Get envelope response
   */
  async getEnvelopeWithToken(envelopeId: string, invitationToken: string): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.getEnvelopeWithToken(envelopeId, invitationToken);
  }

  /**
   * Get envelopes by user with pagination and filtering
   * @param filters - Query filters including status, limit, and cursor
   * @returns Get envelopes response
   */
  async getEnvelopesByUser(filters: {
    status?: string;
    limit: number;
    cursor?: string;
  }): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.getEnvelopesByUser(filters);
  }

  /**
   * Get audit events from database for verification
   * @param envelopeId - The envelope ID to get audit events for
   * @returns Array of audit events
   */
  async getAuditEventsFromDatabase(envelopeId: string): Promise<any[]> {
    return this.databaseHelper.getAuditEventsFromDatabase(envelopeId);
  }


  /**
   * Cancel envelope with custom token (for authorization testing)
   * @param envelopeId - ID of the envelope to cancel
   * @param customToken - Custom JWT token
   * @returns Promise that resolves to the cancellation response
   */
  async cancelEnvelopeWithToken(envelopeId: string, customToken: string): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.cancelEnvelope(envelopeId, customToken);
  }

  /**
   * Cancel envelope without authentication (for external signer testing)
   * @param envelopeId - ID of the envelope to cancel
   * @returns Promise that resolves to the cancellation response
   */
  async cancelEnvelopeWithoutAuth(envelopeId: string): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.cancelEnvelopeWithoutAuth(envelopeId);
  }

  /**
   * Verify audit event was created for external user access
   * @param envelopeId - The envelope ID
   * @param eventType - The expected event type
   * @param signerId - The signer ID
   * @returns Promise that resolves when verification is complete
   */
  async verifyAuditEvent(envelopeId: string, eventType: string, signerId?: string): Promise<void> {
    return this.auditHelper.verifyAuditEvent(envelopeId, eventType, signerId);
  }

  /**
   * Download document for authenticated user
   * @param envelopeId - The envelope ID to download
   * @returns Download response
   */
  async downloadDocument(envelopeId: string): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.downloadDocument(envelopeId);
  }

  /**
   * Download document with invitation token or custom JWT token
   * @param envelopeId - The envelope ID to download
   * @param invitationToken - The invitation token (for external users)
   * @param customToken - Custom JWT token (for testing different users)
   * @returns Download response
   */
  async downloadDocumentWithToken(
    envelopeId: string, 
    invitationToken?: string, 
    customToken?: string
  ): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.downloadDocumentWithToken(envelopeId, invitationToken, customToken);
  }

  /**
   * Download document with custom expiration time
   * @param envelopeId - The envelope ID to download
   * @param expiresIn - Custom expiration time in seconds
   * @returns Download response
   */
  async downloadDocumentWithCustomExpiration(
    envelopeId: string, 
    expiresIn: number
  ): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.downloadDocumentWithCustomExpiration(envelopeId, expiresIn);
  }

  /**
   * Sign document with invitation token (external user)
   * @param envelopeId - The envelope ID to sign
   * @param signerId - The signer ID
   * @param invitationToken - The invitation token for external access
   * @param consent - Consent information
   * @returns Sign document response
   */
  async signDocument(
    envelopeId: string,
    signerId: string,
    invitationToken: string,
    consent: {
      given: boolean;
      timestamp: string;
      text: string;
      ipAddress?: string;
      userAgent?: string;
      country?: string;
    }
  ): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.signDocument(envelopeId, signerId, invitationToken, consent);
  }

  /**
   * Sign document as authenticated user (owner)
   * @param envelopeId - The envelope ID to sign
   * @param signerId - The signer ID
   * @param consent - Consent information
   * @returns Sign document response
   */
  async signDocumentAsOwner(
    envelopeId: string,
    signerId: string,
    consent: {
      given: boolean;
      timestamp: string;
      text: string;
      ipAddress?: string;
      userAgent?: string;
      country?: string;
    }
  ): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.signDocumentAsOwner(envelopeId, signerId, consent);
  }

  /**
   * Decline signer with invitation token
   * @param envelopeId - ID of the envelope
   * @param signerId - ID of the signer declining
   * @param invitationToken - Invitation token for the signer
   * @param reason - Reason for declining
   * @returns Promise that resolves to the decline response
   */
  async declineSigner(
    envelopeId: string,
    signerId: string,
    invitationToken: string,
    reason: string
  ): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.declineSigner(envelopeId, signerId, invitationToken, reason);
  }

  /**
   * Cancel an envelope
   * @param envelopeId - ID of the envelope to cancel
   * @returns Promise that resolves to the cancellation response
   */
  async cancelEnvelope(envelopeId: string): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.cancelEnvelope(envelopeId);
  }

  /**
   * Share document view with external viewer
   * @param envelopeId - ID of the envelope to share
   * @param viewerData - Viewer data (email, fullName, message, expiresIn)
   * @returns Promise that resolves to the share response
   */
  async shareDocumentView(
    envelopeId: string, 
    viewerData: { email: string; fullName: string; message?: string; expiresIn?: number }
  ): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.shareDocumentView(envelopeId, viewerData);
  }

  /**
   * Share document view as a specific user
   * @param envelopeId - ID of the envelope to share
   * @param viewerData - Viewer data (email, fullName, message, expiresIn)
   * @param user - User to share as
   * @returns Promise that resolves to the share response
   */
  async shareDocumentViewAsUser(
    envelopeId: string, 
    viewerData: { email: string; fullName: string; message?: string; expiresIn?: number },
    user: any
  ): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.shareDocumentViewAsUser(envelopeId, viewerData, user);
  }

  /**
   * Share document view without authentication
   * @param envelopeId - ID of the envelope to share
   * @param viewerData - Viewer data (email, fullName, message, expiresIn)
   * @returns Promise that resolves to the share response
   */
  async shareDocumentViewWithoutAuth(
    envelopeId: string, 
    viewerData: { email: string; fullName: string; message?: string; expiresIn?: number }
  ): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.shareDocumentViewWithoutAuth(envelopeId, viewerData);
  }

  /**
   * Get viewer participant by envelope ID and email
   * @param envelopeId - ID of the envelope
   * @param email - Email of the viewer
   * @returns Promise that resolves to the viewer participant data
   */
  async getViewerParticipant(envelopeId: string, email: string): Promise<any> {
    return this.databaseHelper.getViewerParticipant(envelopeId, email);
  }

  /**
   * Get invitation token by token string
   * @param token - The invitation token
   * @returns Promise that resolves to the invitation token data
   */
  async getInvitationToken(token: string): Promise<any> {
    return this.databaseHelper.getInvitationToken(token);
  }

  /**
   * Get audit trail for an envelope
   * @param envelopeId - ID of the envelope
   * @param user - User to get audit trail as
   * @returns Promise that resolves to the audit trail response
   */
  async getAuditTrail(
    envelopeId: string, 
    user: any
  ): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.getAuditTrail(envelopeId, user);
  }

  /**
   * Get audit trail without authentication
   * @param envelopeId - ID of the envelope
   * @returns Promise that resolves to the audit trail response
   */
  async getAuditTrailWithoutAuth(
    envelopeId: string
  ): Promise<{ statusCode: number; data: any }> {
    if (!this.envelopeOperations) {
      throw new Error('WorkflowTestHelper not initialized. Call initialize() first.');
    }
    return this.envelopeOperations.getAuditTrailWithoutAuth(envelopeId);
  }

}

