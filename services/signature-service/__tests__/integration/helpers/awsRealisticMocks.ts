/* @ts-nocheck */
/**
 * @file awsRealisticMocks.ts
 * @summary Realistic AWS service mocks for integration tests
 * @description Provides realistic mocks that behave like real AWS services for testing
 */

import { jest } from '@jest/globals';

// Mock KMS service with realistic behavior
jest.mock('@aws-sdk/client-kms', () => ({
  KMSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation(async (command: any) => {
      // Simulate realistic KMS signing
      if (command && command.constructor && command.constructor.name === 'SignCommand') {
        const message = command.input?.Message ?? Buffer.from('');
        const algorithm = command.input?.SigningAlgorithm ?? 'RSASSA_PSS_SHA_256';
        const signature = Buffer.from(`mock-signature-${algorithm}-${message.toString('hex').substring(0, 8)}`).toString('base64');
        return {
          Signature: Buffer.from(signature),
          SigningAlgorithm: algorithm,
          KeyId: command.input?.KeyId || 'test-key-id'
        } as any;
      }

      // Simulate KMS key creation
      if (command && command.constructor && command.constructor.name === 'CreateKeyCommand') {
        return {
          KeyMetadata: {
            KeyId: 'test-key-id',
            Arn: 'arn:aws:kms:us-east-1:000000000000:key/test-key-id',
            Description: command.input?.Description || 'Test signing key',
            KeyUsage: command.input?.KeyUsage || 'SIGN_VERIFY',
            KeySpec: command.input?.CustomerMasterKeySpec || 'RSA_2048',
            CreationDate: new Date(),
            Enabled: true
          }
        } as any;
      }

      // Simulate KMS alias creation
      if (command && command.constructor && command.constructor.name === 'CreateAliasCommand') {
        return {} as any;
      }

      return {} as any;
    }),
  })),
  SignCommand: jest.fn().mockImplementation((input: any) => ({ input })),
  CreateKeyCommand: jest.fn().mockImplementation((input: any) => ({ input })),
  CreateAliasCommand: jest.fn().mockImplementation((input: any) => ({ input })),
}));

// Mock EventBridge service with realistic behavior
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
    send: anyJest.fn().mockResolvedValue({} as any),
  })),
  PutObjectCommand: anyJest.fn(),
  GetObjectCommand: anyJest.fn(),
  DeleteObjectCommand: anyJest.fn(),
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
