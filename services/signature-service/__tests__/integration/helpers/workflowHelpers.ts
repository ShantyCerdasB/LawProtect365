/**
 * @fileoverview workflowHelpers - Shared utilities for integration workflow tests
 * @summary Provides common workflow operations and test data factories
 * @description This module contains shared utilities for integration tests, including
 * workflow operations, test data factories, and common assertions. These helpers
 * reduce code duplication and provide consistent test patterns across all workflow tests.
 */

import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { loadConfig } from '../../../src/config';
import { createApiGatewayEvent, generateTestPdf, generateTestJwtToken } from './testHelpers';
import { createEnvelopeHandler } from '../../../src/handlers/envelopes/CreateEnvelopeHandler';
import { updateEnvelopeHandler } from '../../../src/handlers/envelopes/UpdateEnvelopeHandler';
import { sendEnvelopeHandler } from '../../../src/handlers/envelopes/SendEnvelopeHandler';

/**
 * Test user data structure
 */
export interface TestUser {
  userId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Envelope data structure for tests
 */
export interface EnvelopeData {
  id: string;
  title: string;
  description: string;
  status: string;
  signingOrderType: string;
  originType: string;
  createdBy: string;
  sourceKey?: string;
  metaKey?: string;
  templateId?: string;
  templateVersion?: string;
}

/**
 * Signer data structure for tests
 */
export interface SignerData {
  email: string;
  fullName: string;
  isExternal: boolean;
  order: number;
  userId?: string;
}

/**
 * Workflow test helper class
 * Provides common operations for integration workflow tests
 */
export class WorkflowTestHelper {
  private cfg = loadConfig();
  private s3 = new S3Client({
    region: this.cfg.s3.region,
    endpoint: process.env.AWS_ENDPOINT_URL,
    forcePathStyle: true,
    credentials: { 
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test', 
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test' 
    }
  });

  private testUser: TestUser | null = null;
  private testSourceKey: string | null = null;

  /**
   * Initialize test environment with seeded user and test document
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    // Get seeded test user from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (!user) {
      throw new Error('Test user not found in database. Make sure seed has run.');
    }
    
    this.testUser = {
      userId: user.id,
      email: user.email,
      name: user.name || 'Test User',
      role: user.role
    };
    
    await prisma.$disconnect();
    
    // Upload test PDF to S3
    const testPdf = generateTestPdf();
    const sourceKey = `test-documents/${randomUUID()}.pdf`;
    
    await this.s3.send(new PutObjectCommand({
      Bucket: this.cfg.s3.bucketName,
      Key: sourceKey,
      Body: testPdf,
      ContentType: 'application/pdf'
    }));
    
    this.testSourceKey = sourceKey;
  }

  /**
   * Get the test user data
   * @returns Test user data
   * @throws Error if test user is not initialized
   */
  getTestUser(): TestUser {
    if (!this.testUser) {
      throw new Error('Test user not initialized. Call initialize() first.');
    }
    return this.testUser;
  }

  /**
   * Get the test source key for S3
   * @returns Test source key
   * @throws Error if test source key is not initialized
   */
  getTestSourceKey(): string {
    if (!this.testSourceKey) {
      throw new Error('Test source key not initialized. Call initialize() first.');
    }
    return this.testSourceKey;
  }

  /**
   * Create authenticated API Gateway event
   * @param overrides - Optional overrides for the event
   * @returns Promise that resolves to the authenticated event
   */
  async makeAuthEvent(overrides?: any): Promise<any> {
    const token = await generateTestJwtToken({ 
      sub: this.getTestUser().userId, 
      email: this.getTestUser().email, 
      roles: ['admin'], 
      scopes: [] 
    });
    
    const base = await createApiGatewayEvent({ 
      includeAuth: false, 
      authToken: token,
      headers: {
        'x-country': 'US',
        'x-forwarded-for': '127.0.0.1'
      }
    });
    
    return { ...base, ...overrides };
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
    const event = await this.makeAuthEvent({
      body: JSON.stringify({
        title: envelopeData.title,
        description: envelopeData.description,
        signingOrderType: envelopeData.signingOrderType || 'OWNER_FIRST',
        originType: envelopeData.originType,
        templateId: envelopeData.templateId,
        templateVersion: envelopeData.templateVersion,
        sourceKey: envelopeData.sourceKey || this.getTestSourceKey(),
        metaKey: envelopeData.metaKey || `test-meta/${randomUUID()}.json`
      })
    });

    const result = await createEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);

    if (result.statusCode !== 201) {
      // Preserve the original error structure
      const error = new Error(response.message);
      (error as any).statusCode = result.statusCode;
      (error as any).message = response.message;
      throw error;
    }

    return response.data;
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
    const event = await this.makeAuthEvent({
      pathParameters: { id: envelopeId },
      body: JSON.stringify(updateData)
    });
    
    const result = await updateEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return { 
      statusCode: result.statusCode, 
      data: response.data || response // For errors, response doesn't have 'data' field
    };
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
    return this.updateEnvelope(envelopeId, metadata);
  }

  /**
   * Get signers from database for verification
   * @param envelopeId - ID of the envelope
   * @returns Promise that resolves to array of signers
   */
  async getSignersFromDatabase(envelopeId: string): Promise<any[]> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const signers = await prisma.envelopeSigner.findMany({
      where: { envelopeId },
      orderBy: { order: 'asc' }
    });
    
    await prisma.$disconnect();
    return signers;
  }

  /**
   * Get envelope from database for verification
   * @param envelopeId - ID of the envelope
   * @returns Promise that resolves to envelope data
   */
  async getEnvelopeFromDatabase(envelopeId: string): Promise<any> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const envelope = await prisma.signatureEnvelope.findUnique({
      where: { id: envelopeId }
    });
    
    await prisma.$disconnect();
    return envelope;
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
    if (!this.testUser) {
      throw new Error('Test user not initialized');
    }

    const authToken = await generateTestJwtToken({
      sub: this.testUser.userId,
      email: this.testUser.email,
      roles: [this.testUser.role]
    });

    const event = await createApiGatewayEvent({
      pathParameters: { envelopeId },
      body: options,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-country': 'US' // Required for SendEnvelope security context
      }
    });

    const result = await sendEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return {
      statusCode: result.statusCode,
      data: response.data // Access the actual data from ControllerFactory response
    };
  }
}

/**
 * Test data factory for creating test data
 */
export class TestDataFactory {
  /**
   * Create envelope data with defaults
   * @param overrides - Optional overrides for the envelope data
   * @returns Envelope data object
   */
  static createEnvelopeData(overrides?: Partial<{
    title: string;
    description: string;
    signingOrderType: string;
    originType: string;
    templateId: string;
    templateVersion: string;
  }>): {
    title: string;
    description: string;
    signingOrderType: string;
    originType: string;
    templateId?: string;
    templateVersion?: string;
  } {
    return {
      title: 'Test Envelope',
      description: 'Test Description',
      signingOrderType: 'OWNER_FIRST',
      originType: 'USER_UPLOAD',
      ...overrides
    };
  }

  /**
   * Create signer data with defaults
   * @param overrides - Optional overrides for the signer data
   * @returns Signer data object
   */
  static createSignerData(overrides?: Partial<SignerData>): SignerData {
    return {
      email: `signer${randomUUID().substring(0, 8)}@example.com`,
      fullName: 'Test Signer',
      isExternal: true,
      order: 1,
      ...overrides
    };
  }

  /**
   * Create multiple signers for testing
   * @param count - Number of signers to create
   * @param baseOrder - Starting order number
   * @returns Array of signer data objects
   */
  static createMultipleSigners(count: number, baseOrder: number = 1): SignerData[] {
    return Array.from({ length: count }, (_, index) => 
      this.createSignerData({
        email: `signer${index + 1}@example.com`,
        fullName: `Signer ${index + 1}`,
        order: baseOrder + index
      })
    );
  }
}
