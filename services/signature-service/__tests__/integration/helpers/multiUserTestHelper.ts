/**
 * @fileoverview multiUserTestHelper - Helper for multi-user security testing
 * @summary Provides utilities for testing security between different users
 * @description This module contains helper methods for testing security scenarios
 * where multiple users create envelopes and attempt to access each other's resources.
 */

import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { loadConfig } from '../../../src/config';
import { createApiGatewayEvent, generateTestPdf, generateTestJwtToken } from './testHelpers';
import { createEnvelopeHandler } from '../../../src/handlers/envelopes/CreateEnvelopeHandler';
import { updateEnvelopeHandler } from '../../../src/handlers/envelopes/UpdateEnvelopeHandler';
import { sendEnvelopeHandler } from '../../../src/handlers/envelopes/SendEnvelopeHandler';
import { getEnvelopeHandler } from '../../../src/handlers/envelopes/GetEnvelopeHandler';
import { getEnvelopesByUserHandler } from '../../../src/handlers/envelopes/GetEnvelopesByUserHandler';
import { TestUser, EnvelopeData } from './testTypes';
import { TestDataFactory } from './testDataFactory';

/**
 * Helper for multi-user security testing
 */
export class MultiUserTestHelper {
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

  private testUsers: Map<string, TestUser> = new Map();
  private testSourceKeys: Map<string, string> = new Map();

  /**
   * Initialize test environment with multiple users
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    // Get seeded test users from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const users = await prisma.user.findMany({
      where: { 
        email: { 
          in: ['test@example.com', 'test2@example.com'] 
        } 
      }
    });
    
    if (users.length < 2) {
      throw new Error('Test users not found in database. Make sure seed has run with both users.');
    }
    
    // Store test users
    for (const user of users) {
      const testUser: TestUser = {
        userId: user.id,
        email: user.email,
        name: user.name || 'Test User',
        role: user.role
      };
      this.testUsers.set(user.email, testUser);
    }
    
    await prisma.$disconnect();
    
    // Upload test PDFs to S3 for each user
    for (const [email, user] of this.testUsers) {
      const testPdf = generateTestPdf();
      const sourceKey = `test-documents/${user.userId}/${randomUUID()}.pdf`;
      
      await this.s3.send(new PutObjectCommand({
        Bucket: this.cfg.s3.bucketName,
        Key: sourceKey,
        Body: testPdf,
        ContentType: 'application/pdf'
      }));
      
      this.testSourceKeys.set(email, sourceKey);
    }
  }

  /**
   * Get test user by email
   * @param email - User email
   * @returns Test user data
   */
  getTestUser(email: string): TestUser {
    const user = this.testUsers.get(email);
    if (!user) {
      throw new Error(`Test user with email ${email} not found. Call initialize() first.`);
    }
    return user;
  }

  /**
   * Get test source key for user
   * @param email - User email
   * @returns Test source key
   */
  getTestSourceKey(email: string): string {
    const sourceKey = this.testSourceKeys.get(email);
    if (!sourceKey) {
      throw new Error(`Test source key for user ${email} not found. Call initialize() first.`);
    }
    return sourceKey;
  }

  /**
   * Create authenticated API Gateway event for specific user
   * @param userEmail - User email
   * @param overrides - Optional overrides for the event
   * @returns Promise that resolves to the authenticated event
   */
  async makeAuthEvent(userEmail: string, overrides?: any): Promise<any> {
    const user = this.getTestUser(userEmail);
    const token = await generateTestJwtToken({ 
      sub: user.userId, 
      email: user.email, 
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
   * Create envelope for specific user
   * @param userEmail - User email
   * @param envelopeData - Envelope creation data
   * @returns Promise that resolves to the created envelope data
   */
  async createEnvelope(userEmail: string, envelopeData: {
    title: string;
    description: string;
    signingOrderType?: string;
    originType: string;
    templateId?: string;
    templateVersion?: string;
    sourceKey?: string;
    metaKey?: string;
  }): Promise<EnvelopeData> {
    const user = this.getTestUser(userEmail);
    const event = await this.makeAuthEvent(userEmail, {
      body: JSON.stringify({
        title: envelopeData.title,
        description: envelopeData.description,
        signingOrderType: envelopeData.signingOrderType || 'OWNER_FIRST',
        originType: envelopeData.originType,
        templateId: envelopeData.templateId,
        templateVersion: envelopeData.templateVersion,
        sourceKey: envelopeData.sourceKey || this.getTestSourceKey(userEmail),
        metaKey: envelopeData.metaKey || `test-meta/${user.userId}/${randomUUID()}.json`
      })
    });

    const result = await createEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);

    if (result.statusCode !== 201) {
      const error = new Error(response.message);
      (error as any).statusCode = result.statusCode;
      (error as any).message = response.message;
      throw error;
    }

    return response.data;
  }

  /**
   * Update envelope for specific user
   * @param userEmail - User email
   * @param envelopeId - ID of the envelope to update
   * @param updateData - Update data
   * @returns Promise that resolves to the update response
   */
  async updateEnvelope(userEmail: string, envelopeId: string, updateData: Record<string, any>): Promise<{
    statusCode: number;
    data: any;
  }> {
    const event = await this.makeAuthEvent(userEmail, {
      pathParameters: { id: envelopeId },
      body: JSON.stringify(updateData)
    });
    
    const result = await updateEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return { 
      statusCode: result.statusCode, 
      data: response.data || response
    };
  }

  /**
   * Update envelope metadata for specific user
   * @param userEmail - User email
   * @param envelopeId - The envelope ID to update
   * @param metadata - Metadata to update
   * @returns Update envelope response
   */
  async updateMetadata(userEmail: string, envelopeId: string, metadata: {
    title?: string;
    description?: string;
    expiresAt?: string;
    sourceKey?: string;
    metaKey?: string;
  }): Promise<{ statusCode: number; data: any }> {
    const user = this.getTestUser(userEmail);
    const authToken = await generateTestJwtToken({
      sub: user.userId,
      email: user.email,
      roles: [user.role]
    });

    const event = await createApiGatewayEvent({
      pathParameters: { envelopeId },
      body: metadata,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-country': 'US'
      }
    });

    const result = await updateEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return { 
      statusCode: result.statusCode, 
      data: response.data || response
    };
  }

  /**
   * Send envelope for specific user
   * @param userEmail - User email
   * @param envelopeId - The envelope ID to send
   * @param options - Send options
   * @returns Send envelope response
   */
  async sendEnvelope(userEmail: string, envelopeId: string, options: {
    message?: string;
    sendToAll?: boolean;
    signers?: Array<{
      signerId: string;
      message?: string;
    }>;
  }): Promise<{ statusCode: number; data: any }> {
    const user = this.getTestUser(userEmail);
    const authToken = await generateTestJwtToken({
      sub: user.userId,
      email: user.email,
      roles: [user.role]
    });

    const event = await createApiGatewayEvent({
      pathParameters: { envelopeId },
      body: options,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-country': 'US'
      }
    });

    const result = await sendEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return {
      statusCode: result.statusCode,
      data: response.data
    };
  }

  /**
   * Get envelope by ID with invitation token (external user)
   * @param envelopeId - The envelope ID to get
   * @param invitationToken - The invitation token for external access
   * @returns Get envelope response
   */
  async getEnvelopeWithToken(envelopeId: string, invitationToken: string): Promise<{ statusCode: number; data: any }> {
    const event = await createApiGatewayEvent({
      includeAuth: false,
      pathParameters: { id: envelopeId },
      queryStringParameters: { invitationToken },
      headers: {
        'x-country': 'US',
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Test User Agent'
      }
    });

    const result = await getEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return {
      statusCode: result.statusCode,
      data: response.data || response
    };
  }

  /**
   * Get envelopes by user with pagination and filtering (INTERNAL USERS ONLY)
   * @param userEmail - User email (must be internal user)
   * @param filters - Query filters including status, limit, and cursor
   * @returns Get envelopes response
   */
  async getEnvelopesByUser(userEmail: string, filters: {
    status?: string;
    limit: number;
    cursor?: string;
  }): Promise<{ statusCode: number; data: any }> {
    const user = this.getTestUser(userEmail);
    const authToken = await generateTestJwtToken({
      sub: user.userId,
      email: user.email,
      roles: [user.role]
    });

    const event = await createApiGatewayEvent({
      includeAuth: false,
      authToken: authToken,
      queryStringParameters: Object.fromEntries(
        Object.entries(filters)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ),
      headers: {
        'x-country': 'US',
        'x-forwarded-for': '127.0.0.1'
      }
    });

    const result = await getEnvelopesByUserHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return {
      statusCode: result.statusCode,
      data: response.data || response
    };
  }

  /**
   * Get envelope by ID (INTERNAL USERS ONLY - authenticated access)
   * @param userEmail - User email (must be internal user)
   * @param envelopeId - The envelope ID to get
   * @returns Get envelope response
   */
  async getEnvelope(userEmail: string, envelopeId: string): Promise<{ statusCode: number; data: any }> {
    const user = this.getTestUser(userEmail);
    const authToken = await generateTestJwtToken({
      sub: user.userId,
      email: user.email,
      roles: [user.role]
    });

    const event = await createApiGatewayEvent({
      includeAuth: false,
      authToken: authToken,
      pathParameters: { id: envelopeId },
      headers: {
        'x-country': 'US',
        'x-forwarded-for': '127.0.0.1'
      }
    });

    const result = await getEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return {
      statusCode: result.statusCode,
      data: response.data || response
    };
  }
}
