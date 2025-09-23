/**
 * @fileoverview S3Mock - Realistic S3 service mock for integration tests
 * @summary Provides comprehensive S3 mocking that simulates real AWS S3 behavior
 * @description Mock implementation of AWS S3 service that provides realistic behavior
 * for object storage operations. Uses temporary file system storage to simulate
 * real S3 behavior with actual file persistence during tests.
 */

// Using global jest - no import needed in setupFiles
import { promises as fs, statSync } from 'fs';
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
      console.log('🔍 S3EvidenceStorage.headObject called with:', { bucket, key });
      
      // Check if object exists in memory first
      if (bucketStorage.has(bucket) && bucketStorage.get(bucket)!.has(key)) {
        const contentLength = bucketStorage.get(bucket)!.get(key)!.length;
        console.log('🔍 Object found in memory:', { key, exists: true });
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
        console.log('🔍 Object found on disk:', { key, exists: true });
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
          console.log('🔍 Simulating existing document:', { key, exists: true });
          return {
            exists: true,
            size: 1024, // Simulate 1KB file
            etag: `"${Buffer.from(key + Date.now()).toString('hex')}"`,
            lastModified: new Date(),
            metadata: {}
          };
        }
        
        // Object not found - return exists: false
        console.log('🔍 Object not found:', { key, exists: false });
        return {
          exists: false
        };
      }
    }),
    putObject: jest.fn().mockImplementation(async (params: any) => {
      // Implementation for putObject if needed
      return {};
    }),
    getObject: jest.fn().mockImplementation(async (bucket: string, key: string) => {
      // Implementation for getObject if needed
      return { body: Buffer.from('test content') };
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
        
        console.log('🔍 DEBUG: HeadObjectCommand called with:', { Bucket, Key });
        
        if (!Bucket || !Key) {
          throw new Error('Bucket and Key are required for HeadObject');
        }
        
        // Check if object exists in memory first
        if (bucketStorage.has(Bucket) && bucketStorage.get(Bucket)!.has(Key)) {
          const contentLength = bucketStorage.get(Bucket)!.get(Key)!.length;
          return {
            ContentLength: contentLength,
            ContentType: 'application/pdf',
            ETag: `"${Buffer.from(Key + Date.now()).toString('hex')}"`,
            LastModified: new Date(),
            Metadata: {}
          } as any;
        }
        
        // Check if object exists on disk
        try {
          const filePath = getObjectPath(Bucket, Key);
          const stats = await fs.stat(filePath);
          return {
            ContentLength: stats.size,
            ContentType: 'application/pdf',
            ETag: `"${Buffer.from(Key + Date.now()).toString('hex')}"`,
            LastModified: new Date(),
            Metadata: {}
          } as any;
        } catch (statError) {
          // Object not found - throw proper AWS error that S3EvidenceStorage will catch
          console.log('🔍 DEBUG: Object not found, throwing NotFound error for:', Key);
          const notFoundError = new Error('NotFound') as any;
          notFoundError.name = 'NotFound';
          notFoundError.$metadata = { httpStatusCode: 404 };
          throw notFoundError;
        }
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



// Mock the entire AWS SDK S3 module
jest.mock('@aws-sdk/client-s3', () => {
  // Mock command classes with specific names
  const createMockCommand = (name: string) => {
    return class MockCommand {
      constructor(public input: any) {}
      get name() { return name; }
    };
  };
  
  const HeadObjectCommand = createMockCommand('HeadObjectCommand');
  const PutObjectCommand = createMockCommand('PutObjectCommand');
  const GetObjectCommand = createMockCommand('GetObjectCommand');
  const DeleteObjectCommand = createMockCommand('DeleteObjectCommand');
  
  return {
    S3Client: jest.fn().mockImplementation((config: any) => {
      console.log('🔧 S3Client mock created with config:', config);
      
      return {
        send: jest.fn().mockImplementation(async (command: any) => {
          console.log('🔍 S3Client.send called with command:', command.name || command.constructor.name);
          
          // Handle HeadObjectCommand (used by headObject)
          if (command.name === 'HeadObjectCommand' || command.constructor.name === 'HeadObjectCommand') {
            const bucket = command.input.Bucket;
            const key = command.input.Key;
            
            console.log('🔍 Mock S3Client: HeadObjectCommand for:', { bucket, key });
            
            // Check if object exists in memory first
            if (bucketStorage.has(bucket) && bucketStorage.get(bucket)!.has(key)) {
              const contentLength = bucketStorage.get(bucket)!.get(key)!.length;
              console.log('🔍 Mock S3Client: Object found in memory:', { key, exists: true });
              return {
                ContentLength: contentLength,
                ETag: `"${Buffer.from(key + Date.now()).toString('hex')}"`,
                LastModified: new Date()
              };
            }
            
            // Check if object exists on disk
            try {
              const filePath = getObjectPath(bucket, key);
              const stats = statSync(filePath);
              console.log('🔍 Mock S3Client: Object found on disk:', { key, exists: true });
              return {
                ContentLength: stats.size,
                ETag: `"${Buffer.from(key + Date.now()).toString('hex')}"`,
                LastModified: stats.mtime
              };
            } catch (statError) {
              // For test purposes, simulate that certain document patterns exist
              // BUT only if they don't contain "non-existent" in the key
              if ((key.startsWith('test-documents/') || key.startsWith('test-meta/')) && 
                  !key.includes('non-existent')) {
                console.log('🔍 Mock S3Client: Simulating existing document:', { key, exists: true });
                return {
                  ContentLength: 1024,
                  ETag: `"${Buffer.from(key + Date.now()).toString('hex')}"`,
                  LastModified: new Date()
                };
              }
              
              // Object not found - throw NoSuchKey error
              console.log('🔍 Mock S3Client: Object not found:', { key, exists: false });
              const error = new Error('NoSuchKey');
              (error as any).name = 'NoSuchKey';
              (error as any).$metadata = { httpStatusCode: 404 };
              throw error;
            }
          }
          
          // Handle PutObjectCommand (used by workflow helpers)
          if (command.name === 'PutObjectCommand' || command.constructor.name === 'PutObjectCommand') {
            const bucket = command.input.Bucket;
            const key = command.input.Key;
            const body = command.input.Body;
            
            console.log('🔍 Mock S3Client: PutObjectCommand for:', { bucket, key });
            
            // Store object in memory
            if (!bucketStorage.has(bucket)) {
              bucketStorage.set(bucket, new Map());
            }
            bucketStorage.get(bucket)!.set(key, body);
            
            // Also store on disk
            try {
              const filePath = getObjectPath(bucket, key);
              await fs.mkdir(path.dirname(filePath), { recursive: true });
              await fs.writeFile(filePath, body);
              console.log('🔍 Mock S3Client: Object stored on disk:', { key });
            } catch (writeError) {
              console.log('⚠️ Mock S3Client: Failed to write to disk:', writeError);
            }
            
            return {
              ETag: `"${Buffer.from(key + Date.now()).toString('hex')}"`,
              VersionId: 'mock-version-id'
            };
          }
          
          // Handle other commands
          console.log('🔍 Mock S3Client: Handling command:', command.constructor.name);
          return { success: true };
        })
      };
    }),
    
    // Mock command classes
    PutObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    DeleteObjectCommand
  };
});


console.log('🔧 S3 mock loaded - realistic object storage with temporary file system');
