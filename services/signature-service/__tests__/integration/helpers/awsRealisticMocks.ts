/* @ts-nocheck */
/**
 * @file awsRealisticMocks.ts
 * @summary Realistic AWS service mocks for integration tests
 * @description Provides realistic mocks that behave like real AWS services for testing.
 * This file contains comprehensive mocks for AWS services that are not fully supported
 * by LocalStack free tier or require specific test behavior. The mocks simulate real
 * AWS service responses while maintaining test determinism.
 */

import { jest } from '@jest/globals';

/**
 * Mock KMS service with realistic behavior unless explicitly using LocalStack KMS
 * 
 * @description Provides comprehensive KMS mocking that simulates real AWS KMS behavior
 * for signing, verification, key creation, and alias management operations.
 * The mock detects operation types based on input parameters and returns
 * appropriate responses that match AWS KMS API structure.
 */
if (!process.env.USE_LOCALSTACK_KMS) {
jest.mock('@aws-sdk/client-kms', () => ({
  KMSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation(async (command: any) => {
      const input = command?.input ?? {};
      // Detect Verify by presence of Signature + SigningAlgorithm
      if (input && (input.Signature && input.SigningAlgorithm)) {
        return { SignatureValid: true } as any;
      }
      // Detect Sign by presence of Message + SigningAlgorithm
      if (input && (input.Message || input.SigningAlgorithm)) {
        const message = input.Message ?? new Uint8Array();
        const bytes = typeof message === 'string' ? Buffer.from(message, 'utf8') : Buffer.from(message);
        const algorithm = input.SigningAlgorithm ?? 'RSASSA_PSS_SHA_256';
        const signature = Buffer.from(`mock-signature-${algorithm}-${bytes.toString('hex').substring(0, 8)}`);
        return {
          Signature: signature,
          SigningAlgorithm: algorithm,
          KeyId: input.KeyId || 'test-key-id'
        } as any;
      }

      // Simulate KMS key creation by presence of KeyUsage/CustomerMasterKeySpec
      if (input && (input.KeyUsage || input.CustomerMasterKeySpec)) {
        return {
          KeyMetadata: {
            KeyId: 'test-key-id',
            Arn: 'arn:aws:kms:us-east-1:000000000000:key/test-key-id',
            Description: input.Description || 'Test signing key',
            KeyUsage: input.KeyUsage || 'SIGN_VERIFY',
            KeySpec: input.CustomerMasterKeySpec || 'RSA_2048',
            CreationDate: new Date(),
            Enabled: true
          }
        } as any;
      }

      // Simulate KMS alias creation by presence of AliasName/TargetKeyId
      if (input && (input.AliasName || input.TargetKeyId)) {
        return {} as any;
      }

      return {} as any;
    }),
  })),
  SignCommand: jest.fn().mockImplementation((input: any) => ({ input })),
  CreateKeyCommand: jest.fn().mockImplementation((input: any) => ({ input })),
  CreateAliasCommand: jest.fn().mockImplementation((input: any) => ({ input })),
}));
} else {
  /**
   * LocalStack KMS configuration with operation interception
   * 
   * @description When using LocalStack KMS, this configuration points the KMSClient
   * to the LocalStack endpoint but intercepts specific operations (Sign/Verify)
   * that are not fully implemented in LocalStack free tier, providing mock responses
   * while allowing other operations to pass through to LocalStack.
   */
  const actual: any = (jest as any).requireActual('@aws-sdk/client-kms');
  class KMSClientLS extends actual.KMSClient {
    constructor(cfg: any = {}) {
      super({
        region: process.env.AWS_REGION || cfg.region || 'us-east-1',
        endpoint: process.env.AWS_ENDPOINT_URL || cfg.endpoint,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
        }
      });
    }
    async send(command: any): Promise<any> {
      const input = command?.input ?? {};
      // Intercept Verify first
      if (input && (input.Signature && input.SigningAlgorithm)) {
        return { SignatureValid: true } as any;
      }
      // Intercept Sign to return a deterministic mock signature
      if (input && (input.Message || input.SigningAlgorithm)) {
        const message = input.Message ?? new Uint8Array();
        const bytes = typeof message === 'string' ? Buffer.from(message, 'utf8') : Buffer.from(message);
        const algorithm = input.SigningAlgorithm ?? 'RSASSA_PSS_SHA_256';
        const signature = Buffer.from(`mock-signature-${algorithm}-${bytes.toString('hex').substring(0, 8)}`);
        return {
          Signature: signature,
          SigningAlgorithm: algorithm,
          KeyId: input.KeyId || 'test-key-id'
        } as any;
      }
      return super.send(command);
    }
  }
  // @ts-ignore
  jest.mock('@aws-sdk/client-kms', () => {
    return { ...actual, KMSClient: KMSClientLS };
  });
}

/**
 * Mock EventBridge service with realistic behavior unless using LocalStack
 * 
 * @description Provides comprehensive EventBridge mocking that simulates real AWS EventBridge
 * behavior for event publishing and event bus creation operations. The mock generates
 * realistic event IDs and handles batch event publishing with proper response structure.
 */
if (!process.env.USE_LOCALSTACK_EVENTBRIDGE) {
  jest.mock('@aws-sdk/client-eventbridge', () => ({
    EventBridgeClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation(async (command: any) => {
        if (command && command.constructor && command.constructor.name === 'PutEventsCommand') {
          const entries: any[] = command.input?.Entries || [];
          return {
            Entries: entries.map((_entry: any, index: number) => ({
              EventId: `test-event-id-${index}-${Date.now()}`,
              ErrorCode: undefined,
              ErrorMessage: undefined
            })),
            FailedEntryCount: 0
          } as any;
        }
        if (command && command.constructor && command.constructor.name === 'CreateEventBusCommand') {
          return {
            EventBusArn: `arn:aws:events:us-east-1:000000000000:event-bus/${command.input?.Name}`
          } as any;
        }
        return {} as any;
      }),
    })),
    PutEventsCommand: jest.fn().mockImplementation((input: any) => ({ input })),
    CreateEventBusCommand: jest.fn().mockImplementation((input: any) => ({ input })),
  }));
}

/**
 * Mock SSM service with realistic behavior
 * 
 * @description Provides comprehensive SSM Parameter Store mocking that simulates real AWS SSM
 * behavior for parameter retrieval and storage operations. The mock returns realistic parameter
 * metadata and uses predefined test values for common configuration parameters.
 */
jest.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation(async (command: any) => {
      if (command && command.constructor && command.constructor.name === 'GetParameterCommand') {
        const name = command.input?.Name;
        return {
          Parameter: {
            Name: name,
            Value: getMockParameterValue(name),
            Type: 'String',
            LastModifiedDate: new Date(),
            Version: 1
          }
        } as any;
      }
      if (command && command.constructor && command.constructor.name === 'PutParameterCommand') {
        return {
          Version: 1,
          Tier: 'Standard'
        } as any;
      }
      return {} as any;
    }),
  })),
  GetParameterCommand: jest.fn().mockImplementation((input: any) => ({ input })),
  PutParameterCommand: jest.fn().mockImplementation((input: any) => ({ input })),
}));

/**
 * Relax typing for Jest in this test-only mock file
 * @description Workaround for Jest type inference issues with generic mocks
 */
const anyJest: any = jest as any;

/**
 * Mock S3 service with basic operations
 * 
 * @description Provides basic S3 mocking for storage operations. This mock handles
 * common S3 operations like put, get, head, and delete objects with minimal
 * implementation suitable for integration testing.
 */
(anyJest as any).mock('@aws-sdk/client-s3', () => ({
  S3Client: anyJest.fn().mockImplementation(() => ({
    send: anyJest.fn().mockImplementation(async (_command: any) => {
      return {} as any;
    }),
  })),
  PutObjectCommand: anyJest.fn().mockImplementation((input: any) => ({ input })),
  GetObjectCommand: anyJest.fn().mockImplementation((input: any) => ({ input })),
  HeadObjectCommand: anyJest.fn().mockImplementation((input: any) => ({ input })),
  DeleteObjectCommand: anyJest.fn().mockImplementation((input: any) => ({ input })),
}));

/**
 * Mock S3 request presigner for generating presigned URLs
 * 
 * @description S3 presigner is mocked to return consistent test URLs
 * while S3 operations use real LocalStack.
 */
(anyJest as any).mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: anyJest.fn().mockImplementation(() => Promise.resolve('https://mock-presigned-url.com')),
}));

/**
 * Helper function to get mock parameter values
 * 
 * @param name - SSM parameter name
 * @returns Mock parameter value for the given name
 * @description Returns predefined test values for common SSM parameters used in testing.
 * Falls back to a generic 'test-value' for unknown parameters.
 */
function getMockParameterValue(name: string): string {
  const mockParameters: Record<string, string> = {
    '/lawprotect365/test/cognito/user-pool-id': 'us-east-1_test',
    '/lawprotect365/test/cognito/client-id': 'test-client-id',
    '/lawprotect365/test/kms/signer-key-arn': 'arn:aws:kms:us-east-1:000000000000:key/test-key-id',
    '/lawprotect365/test/event-bus-arn': 'arn:aws:events:us-east-1:000000000000:event-bus/lawprotect365-event-bus-test',
  };
  
  return mockParameters[name] || 'test-value';
}

/**
 * Console logging for mock initialization
 * @description Logs information about which AWS services are mocked and which use LocalStack
 */
console.log('🔧 Realistic AWS mocks loaded - simulating real AWS service behavior');
console.log('📋 Mocked services:');
console.log('   - KMS: Realistic signing with algorithm-aware signatures');
console.log('   - EventBridge: Realistic event publishing with proper responses');
console.log('   - SSM: Realistic parameter retrieval with test values');
console.log('   - S3: Basic mock for storage operations');
console.log('   - DynamoDB: Using real DynamoDB Local');

/**
 * Targeted mock: override only KmsSigner from shared-ts, leave the rest intact
 * 
 * @description This mock specifically overrides the KmsSigner class from the shared-ts package
 * to provide deterministic signing behavior for testing while preserving all other
 * functionality from the shared package. The mock generates consistent signatures
 * based on the input message and algorithm.
 */
jest.mock('@lawprotect/shared-ts', () => {
  const actual = (jest as any).requireActual('@lawprotect/shared-ts');
  class KmsSignerMock {
    private readonly defaultAlgorithm: string;
    constructor(_client?: any, opts: any = {}) {
      this.defaultAlgorithm = opts?.defaultSigningAlgorithm || 'RSASSA_PSS_SHA_256';
    }
    async sign(input: any): Promise<{ signature: Uint8Array }> {
      const msg = input?.message ?? new Uint8Array();
      const bytes = Buffer.isBuffer(msg) ? msg : Buffer.from(msg);
      const sig = Buffer.from(`mock-signature-${this.defaultAlgorithm}-${bytes.toString('hex').substring(0,8)}`);
      return { signature: sig } as any;
    }
    async verify(_input: any): Promise<{ valid: boolean }> {
      return { valid: true } as any;
    }
  }
  return { ...actual, KmsSigner: KmsSignerMock };
});
