// @ts-nocheck
/**
 * @file awsMocksMinimal.ts
 * @summary Minimal AWS service mocks for integration tests with DynamoDB Local
 * @description Only mocks external services (S3, KMS, EventBridge) while using real repositories against DynamoDB Local
 */

import { jest } from '@jest/globals';

// Mock S3 service
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

// Mock S3 presigner
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://mock-presigned-url.com'),
}));

// Mock KMS service
jest.mock('@aws-sdk/client-kms', () => ({
  KMSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Signature: Buffer.from('mock-signature'),
    }),
  })),
  SignCommand: jest.fn(),
}));

// Mock EventBridge service
jest.mock('@aws-sdk/client-eventbridge', () => ({
  EventBridgeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Entries: [
        {
          EventId: 'test-event-id',
        },
      ],
    }),
  })),
  PutEventsCommand: jest.fn(),
}));

// Mock SSM service
jest.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Parameter: {
        Name: 'test-parameter',
        Value: 'test-value',
        Type: 'String',
      },
    }),
  })),
  GetParameterCommand: jest.fn(),
  GetParametersCommand: jest.fn(),
}));


console.log('🔧 Minimal AWS mocks loaded - using real repositories with DynamoDB Local');
