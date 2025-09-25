/**
 * @fileoverview testEnvironmentManager - Manages test environment initialization and configuration
 * @summary Provides test environment setup, user management, and S3 configuration
 * @description This module handles the initialization of test environments, including
 * test user setup, S3 document uploads, and environment configuration for integration tests.
 */

import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { loadConfig } from '../../../src/config';
import { generateTestPdf, generateTestJwtToken, createApiGatewayEvent, generateTestIpAddress } from './testHelpers';
import { TestUser } from './testTypes';

/**
 * Manages test environment initialization and configuration
 */
export class TestEnvironmentManager {
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
        'x-forwarded-for': generateTestIpAddress()
      }
    });
    
    return { ...base, ...overrides };
  }
}
