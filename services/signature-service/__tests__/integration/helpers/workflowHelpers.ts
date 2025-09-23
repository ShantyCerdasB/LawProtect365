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
   * Verify audit event was created for external user access
   * @param envelopeId - The envelope ID
   * @param eventType - The expected event type
   * @param signerId - The signer ID
   * @returns Promise that resolves when verification is complete
   */
  async verifyAuditEvent(envelopeId: string, eventType: string, signerId?: string): Promise<void> {
    return this.auditHelper.verifyAuditEvent(envelopeId, eventType, signerId);
  }
}

