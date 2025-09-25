/**
 * @fileoverview S3Mock - Realistic S3 service mock for integration tests
 * @summary Provides comprehensive S3 mocking that simulates real AWS S3 behavior
 * @description Mock implementation of AWS S3 service that provides realistic behavior
 * for object storage operations. Uses temporary file system storage to simulate
 * real S3 behavior with actual file persistence during tests.
 */

// Using global jest - no import needed in setupFiles
import { promises as fs } from 'fs';
import * as path from 'path';
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
    console.debug('Directory creation ignored:', error);
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
 * Mock S3EvidenceStorage and S3Presigner directly to ensure they use our mock behavior
 * 
 * @description Mocks the S3EvidenceStorage and S3Presigner classes to return realistic behavior
 * for all S3 operations, ensuring that documentExists, putObject, and presigned URLs work correctly.
 */
jest.mock('@lawprotect/shared-ts', () => ({
  ...jest.requireActual('@lawprotect/shared-ts'),
  S3EvidenceStorage: jest.fn().mockImplementation(() => ({
    headObject: jest.fn().mockImplementation(async (bucket: string, key: string) => {
      // Check if object exists in memory first
      if (bucketStorage.has(bucket) && bucketStorage.get(bucket)!.has(key)) {
        const contentLength = bucketStorage.get(bucket)!.get(key)!.length;
        return {
          exists: true,
          size: contentLength,
          etag: `"${Buffer.from(key + Date.now()).toString('hex')}"`,
          lastModified: new Date(),
          metadata: {}
        };
      }
      
      // Check if object exists on disk
      try {
        const filePath = getObjectPath(bucket, key);
        const stats = await fs.stat(filePath);
        return {
          exists: true,
          size: stats.size,
          etag: `"${Buffer.from(key + Date.now()).toString('hex')}"`,
          lastModified: new Date(),
          metadata: {}
        };
      } catch (statError) {
        // For test purposes, simulate that certain document patterns exist
        // BUT only if they don't contain "non-existent" in the key
        if ((key.startsWith('test-documents/') || key.startsWith('test-meta/')) && 
            !key.includes('non-existent')) {
          return {
            exists: true,
            size: 1024, // Simulate 1KB file
            etag: `"${Buffer.from(key + Date.now()).toString('hex')}"`,
            lastModified: new Date(),
            metadata: {}
          };
        }
        
        // Object not found - return exists: false
        return {
          exists: false
        };
      }
    }),
    putObject: jest.fn().mockImplementation(async (params: any) => {
      // Store the object in mock storage
      const { bucket, key, body } = params;
      
      // Initialize bucket storage if it doesn't exist
      if (!bucketStorage.has(bucket)) {
        bucketStorage.set(bucket, new Map());
      }
      
      // Store the object
      bucketStorage.get(bucket)!.set(key, Buffer.from(body));
      
      return {};
    }),
    getObject: jest.fn().mockImplementation(async (bucket: string, key: string) => {
      // Get the object from mock storage
      const bucketMap = bucketStorage.get(bucket);
      if (bucketMap && bucketMap.has(key)) {
        return { body: bucketMap.get(key)! };
      }
      
      // For test purposes, simulate that certain document patterns exist
      // BUT only if they don't contain "non-existent" in the key
      if ((key.startsWith('test-documents/') || key.startsWith('test-meta/')) && 
          !key.includes('non-existent')) {
        // Return a mock document content
        const mockContent = Buffer.from('Mock PDF content for testing');
        return { body: mockContent };
      }
      
      // Object not found - throw error
      throw new Error(`Object not found: ${bucket}/${key}`);
    }),
    deleteObject: jest.fn().mockImplementation(async (bucket: string, key: string) => {
      // Implementation for deleteObject if needed
      return {};
    })
  })),
  S3Presigner: jest.fn().mockImplementation(() => ({
    getObjectUrl: jest.fn().mockImplementation(async (params: any) => {
      // Return a mock presigned URL for GET operations
      return `https://mock-s3.amazonaws.com/${params.bucket}/${params.key}?mock-get-url=true`;
    }),
    putObjectUrl: jest.fn().mockImplementation(async (params: any) => {
      // Return a mock presigned URL for PUT operations
      return `https://mock-s3.amazonaws.com/${params.bucket}/${params.key}?mock-put-url=true`;
    })
  }))
}));

/**
 * Convert various body types to Buffer
 * @param body - Body to convert
 * @returns Buffer representation
 */
function convertBodyToBuffer(body: any): Buffer {
  if (Buffer.isBuffer(body)) {
    return body;
  } else if (typeof body === 'string') {
    return Buffer.from(body, 'utf8');
  } else if (body instanceof Uint8Array) {
    return Buffer.from(body);
  } else {
    return Buffer.from(String(body));
  }
}

/**
 * Generate ETag for S3 object
 * @param key - Object key
 * @returns ETag string
 */
function generateETag(key: string): string {
  return `"${Buffer.from(key + Date.now()).toString('hex')}"`;
}

/**
 * Create AWS NotFound error
 * @returns NotFound error
 */
function createNotFoundError(): any {
  const error = new Error('NotFound') as any;
  error.name = 'NotFound';
  error.$metadata = { httpStatusCode: 404 };
  return error;
}

/**
 * Handle PutObject command
 * @param input - Command input
 * @returns PutObject response
 */
async function handlePutObject(input: any): Promise<any> {
  const { Bucket, Key, Body } = input;
  
  if (!Bucket || !Key) {
    throw new Error('Bucket and Key are required for PutObject');
  }
  
  const bodyBuffer = convertBodyToBuffer(Body);
  
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
    ETag: generateETag(Key),
    VersionId: 'test-version-id',
    ServerSideEncryption: 'AES256'
  };
}

/**
 * Handle GetObject command
 * @param input - Command input
 * @returns GetObject response
 */
async function handleGetObject(input: any): Promise<any> {
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
      const notFoundError = createNotFoundError();
      notFoundError.name = 'NoSuchKey';
      throw notFoundError;
    }
  }
  
  return {
    Body: bodyBuffer,
    ETag: generateETag(Key),
    ContentLength: bodyBuffer.length,
    ContentType: 'application/pdf',
    LastModified: new Date(),
    Metadata: {}
  };
}

/**
 * Handle DeleteObject command
 * @param input - Command input
 * @returns DeleteObject response
 */
async function handleDeleteObject(input: any): Promise<any> {
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
      console.debug('File deletion ignored:', error);
    }
  }
  
  return {
    DeleteMarker: false,
    VersionId: 'test-version-id'
  };
}

/**
 * Handle HeadObject command
 * @param input - Command input
 * @returns HeadObject response
 */
async function handleHeadObject(input: any): Promise<any> {
  const { Bucket, Key } = input;
  
  if (!Bucket || !Key) {
    throw new Error('Bucket and Key are required for HeadObject');
  }
  
  // Check if object exists in memory first
  if (bucketStorage.has(Bucket) && bucketStorage.get(Bucket)!.has(Key)) {
    const contentLength = bucketStorage.get(Bucket)!.get(Key)!.length;
    return {
      ContentLength: contentLength,
      ContentType: 'application/pdf',
      ETag: generateETag(Key),
      LastModified: new Date(),
      Metadata: {}
    };
  }
  
  // Check if object exists on disk
  try {
    const filePath = getObjectPath(Bucket, Key);
    const stats = await fs.stat(filePath);
    return {
      ContentLength: stats.size,
      ContentType: 'application/pdf',
      ETag: generateETag(Key),
      LastModified: new Date(),
      Metadata: {}
    };
  } catch (statError) {
    throw createNotFoundError();
  }
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
      
      switch (commandName) {
        case 'PutObjectCommand':
          return await handlePutObject(input);
        case 'GetObjectCommand':
          return await handleGetObject(input);
        case 'DeleteObjectCommand':
          return await handleDeleteObject(input);
        case 'HeadObjectCommand':
          return await handleHeadObject(input);
        default:
          return {} as any;
      }
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
    console.debug('Cleanup error ignored:', error);
  }
}
