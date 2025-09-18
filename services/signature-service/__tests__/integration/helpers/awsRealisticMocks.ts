/* @ts-nocheck */
/**
 * @file awsRealisticMocks.ts
 * @summary Realistic AWS service mocks for integration tests
 * @description Provides realistic mocks that behave like real AWS services for testing
 */

import { jest } from '@jest/globals';

// Mock KMS service with realistic behavior unless explicitly using LocalStack KMS
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
        const bytes = typeof message === 'string' ? Buffer.from(message) : Buffer.from(message);
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
  // Force KMSClient to point to LocalStack endpoint but intercept Sign to avoid unimplemented ops in LS free tier
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
        const bytes = typeof message === 'string' ? Buffer.from(message) : Buffer.from(message);
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
    return Object.assign({}, actual, { KMSClient: KMSClientLS });
  });
}

// Mock EventBridge service with realistic behavior unless using LocalStack
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

// Mock SSM service with realistic behavior
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

// Relax typing for Jest in this test-only mock file
const anyJest: any = jest as any;

// Replace direct jest.fn() generic inference to avoid 'never' issues
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

(anyJest as any).mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: anyJest.fn().mockResolvedValue('https://mock-presigned-url.com' as any),
}));

// Helper function to get mock parameter values
function getMockParameterValue(name: string): string {
  const mockParameters: Record<string, string> = {
    '/lawprotect365/test/cognito/user-pool-id': 'us-east-1_test',
    '/lawprotect365/test/cognito/client-id': 'test-client-id',
    '/lawprotect365/test/kms/signer-key-arn': 'arn:aws:kms:us-east-1:000000000000:key/test-key-id',
    '/lawprotect365/test/event-bus-arn': 'arn:aws:events:us-east-1:000000000000:event-bus/lawprotect365-event-bus-test',
  };
  
  return mockParameters[name] || 'test-value';
}

console.log('🔧 Realistic AWS mocks loaded - simulating real AWS service behavior');
console.log('📋 Mocked services:');
console.log('   - KMS: Realistic signing with algorithm-aware signatures');
console.log('   - EventBridge: Realistic event publishing with proper responses');
console.log('   - SSM: Realistic parameter retrieval with test values');
console.log('   - S3: Basic mock for storage operations');
console.log('   - DynamoDB: Using real DynamoDB Local');

// Targeted mock: override only KmsSigner from shared-ts, leave the rest intact
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
