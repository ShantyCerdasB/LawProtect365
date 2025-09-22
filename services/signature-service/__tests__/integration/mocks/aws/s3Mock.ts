/**
 * @fileoverview S3Mock - Realistic S3 service mock for integration tests
 * @summary Provides comprehensive S3 mocking that simulates real AWS S3 behavior
 * @description Mock implementation of AWS S3 service that provides realistic behavior
 * for object storage operations. Uses temporary file system storage to simulate
 * real S3 behavior with actual file persistence during tests.
 */

import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Temporary storage for S3 mock objects
 * Uses system temp directory to avoid committing files to repository
 */
const tempStorageDir = join(tmpdir(), 'lawprotect365-s3-mock');
const bucketStorage: Map<string, Map<string, Buffer>> = new Map();

/**
 * Initialize temporary storage directory
 * 
 * @description Creates the temporary storage directory for S3 mock objects
 * if it doesn't exist. This simulates S3 bucket behavior.
 */
async function initializeTempStorage(): Promise<void> {
  try {
    await fs.mkdir(tempStorageDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }
}

/**
 * Get file path for S3 object
 * 
 * @param bucket - S3 bucket name
 * @param key - S3 object key
 * @returns Full file path for the object
 */
function getObjectPath(bucket: string, key: string): string {
  return join(tempStorageDir, bucket, key);
}

/**
 * Mock S3 service with realistic behavior
 * 
 * @description Provides comprehensive S3 mocking that simulates real AWS S3 behavior
 * for object storage operations. Uses temporary file system storage to simulate
 * real S3 behavior with actual file persistence during tests.
 */
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation(async (command: any) => {
      await initializeTempStorage();
      
      const input = command?.input ?? {};
      const commandName = command?.constructor?.name;
      
      // Handle PutObject operation
      if (commandName === 'PutObjectCommand') {
        const { Bucket, Key, Body } = input;
        
        if (!Bucket || !Key) {
          throw new Error('Bucket and Key are required for PutObject');
        }
        
        // Convert Body to Buffer
        let bodyBuffer: Buffer;
        if (Buffer.isBuffer(Body)) {
          bodyBuffer = Body;
        } else if (typeof Body === 'string') {
          bodyBuffer = Buffer.from(Body, 'utf8');
        } else if (Body instanceof Uint8Array) {
          bodyBuffer = Buffer.from(Body);
        } else {
          bodyBuffer = Buffer.from(String(Body));
        }
        
        // Store in memory for quick access
        if (!bucketStorage.has(Bucket)) {
          bucketStorage.set(Bucket, new Map());
        }
        bucketStorage.get(Bucket)!.set(Key, bodyBuffer);
        
        // Also store on disk for realism
        const filePath = getObjectPath(Bucket, Key);
        await fs.mkdir(join(tempStorageDir, Bucket), { recursive: true });
        await fs.writeFile(filePath, bodyBuffer);
        
        return {
          ETag: `"${Buffer.from(Key + Date.now()).toString('hex')}"`,
          VersionId: 'test-version-id',
          ServerSideEncryption: 'AES256'
        } as any;
      }
      
      // Handle GetObject operation
      if (commandName === 'GetObjectCommand') {
        const { Bucket, Key } = input;
        
        if (!Bucket || !Key) {
          throw new Error('Bucket and Key are required for GetObject');
        }
        
        // Try memory first, then disk
        let bodyBuffer: Buffer;
        if (bucketStorage.has(Bucket) && bucketStorage.get(Bucket)!.has(Key)) {
          bodyBuffer = bucketStorage.get(Bucket)!.get(Key)!;
        } else {
          try {
            const filePath = getObjectPath(Bucket, Key);
            bodyBuffer = await fs.readFile(filePath);
          } catch (readError) {
            // Object not found
            const notFoundError = new Error('NoSuchKey') as any;
            notFoundError.name = 'NoSuchKey';
            notFoundError.$metadata = { httpStatusCode: 404 };
            throw notFoundError;
          }
        }
        
        return {
          Body: bodyBuffer,
          ETag: `"${Buffer.from(Key + Date.now()).toString('hex')}"`,
          ContentLength: bodyBuffer.length,
          ContentType: 'application/pdf',
          LastModified: new Date(),
          Metadata: {}
        } as any;
      }
      
      // Handle DeleteObject operation
      if (commandName === 'DeleteObjectCommand') {
        const { Bucket, Key } = input;
        
        if (Bucket && Key) {
          // Remove from memory
          if (bucketStorage.has(Bucket)) {
            bucketStorage.get(Bucket)!.delete(Key);
          }
          
          // Remove from disk
          try {
            const filePath = getObjectPath(Bucket, Key);
            await fs.unlink(filePath);
          } catch (error) {
            // File might not exist, ignore error
          }
        }
        
        return {
          DeleteMarker: false,
          VersionId: 'test-version-id'
        } as any;
      }
      
      // Handle HeadObject operation
      if (commandName === 'HeadObjectCommand') {
        const { Bucket, Key } = input;
        
        if (!Bucket || !Key) {
          throw new Error('Bucket and Key are required for HeadObject');
        }
        
        // Check if object exists
        let exists = false;
        let contentLength = 0;
        
        if (bucketStorage.has(Bucket) && bucketStorage.get(Bucket)!.has(Key)) {
          exists = true;
          contentLength = bucketStorage.get(Bucket)!.get(Key)!.length;
        } else {
          try {
            const filePath = getObjectPath(Bucket, Key);
            const stats = await fs.stat(filePath);
            exists = true;
            contentLength = stats.size;
          } catch (statError) {
            // Object not found
            const notFoundError = new Error('NotFound') as any;
            notFoundError.name = 'NotFound';
            notFoundError.$metadata = { httpStatusCode: 404 };
            throw notFoundError;
          }
        }
        
        return {
          ContentLength: contentLength,
          ContentType: 'application/pdf',
          ETag: `"${Buffer.from(Key + Date.now()).toString('hex')}"`,
          LastModified: new Date(),
          Metadata: {}
        } as any;
      }
      
      // Default response for unknown operations
      return {} as any;
    }),
  })),
  
  PutObjectCommand: jest.fn().mockImplementation((input: any) => ({ input })),
  GetObjectCommand: jest.fn().mockImplementation((input: any) => ({ input })),
  DeleteObjectCommand: jest.fn().mockImplementation((input: any) => ({ input })),
  HeadObjectCommand: jest.fn().mockImplementation((input: any) => ({ input })),
}));

/**
 * Clean up temporary storage after tests
 * 
 * @description Removes all temporary files created by S3 mock
 * to prevent accumulation of test files.
 */
export async function cleanupS3MockStorage(): Promise<void> {
  try {
    await fs.rm(tempStorageDir, { recursive: true, force: true });
    bucketStorage.clear();
  } catch (error) {
    // Ignore cleanup errors
  }
}

console.log('🔧 S3 mock loaded - realistic object storage with temporary file system');
