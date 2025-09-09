// @ts-nocheck
/**
 * @file awsMocks.ts
 * @summary AWS service mocks for integration tests
 * @description Mock only AWS SDK clients, let all business logic run with real code
 */

import { jest } from '@jest/globals';

// Mock DynamoDB Document Client FIRST - before any other code
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockImplementation((client: any, options?: any) => ({
      send: jest.fn().mockImplementation(async (command: any) => {
        // Return mock responses based on command type
        if (command.constructor.name === 'GetCommand') {
          // Return a mock envelope for GetCommand
          return { 
            Item: { 
              id: command.input.Key?.id || 'test-envelope-id',
              tenantId: 'test-tenant-123',
              ownerId: 'test-owner-id',
              title: 'Test Envelope',
              status: 'draft',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } 
          };
        }
        if (command.constructor.name === 'PutCommand') {
          return { Attributes: { id: 'test-id' } };
        }
        if (command.constructor.name === 'UpdateCommand') {
          return { Attributes: { id: 'test-id', updated: true } };
        }
        if (command.constructor.name === 'DeleteCommand') {
          return {};
        }
        if (command.constructor.name === 'QueryCommand') {
          return { Items: [], LastEvaluatedKey: undefined };
        }
        return {};
      }),
    })),
  },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  DeleteCommand: jest.fn(),
  QueryCommand: jest.fn(),
}));

/**
 * Mock implementations for AWS services - only mock the clients, not the business logic
 */
export const mockAwsServices = () => {
  // Mock DynamoDB Client - return successful responses for all operations
  jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation(async (command: any) => {
        // Return appropriate mock responses based on command type
        if (command.constructor.name === 'PutItemCommand') {
          return { Attributes: {} };
        }
        if (command.constructor.name === 'GetItemCommand') {
          return { Item: {} };
        }
        if (command.constructor.name === 'UpdateItemCommand') {
          return { Attributes: {} };
        }
        if (command.constructor.name === 'DeleteItemCommand') {
          return {};
        }
        if (command.constructor.name === 'QueryCommand') {
          return { Items: [], Count: 0 };
        }
        if (command.constructor.name === 'ScanCommand') {
          return { Items: [], Count: 0 };
        }
        return {};
      }),
    })),
    PutItemCommand: jest.fn(),
    GetItemCommand: jest.fn(),
    UpdateItemCommand: jest.fn(),
    DeleteItemCommand: jest.fn(),
    QueryCommand: jest.fn(),
    ScanCommand: jest.fn(),
  }));

  // DynamoDB Document Client is already mocked at the top-level

  // Mock S3 Client - return successful responses
  jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation(async (command: any) => {
        if (command.constructor.name === 'PutObjectCommand') {
          return { ETag: '"test-etag"', VersionId: 'test-version' };
        }
        if (command.constructor.name === 'GetObjectCommand') {
          return {
            Body: {
              transformToByteArray: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]) as any),
            },
            ContentType: 'application/pdf',
            ContentLength: 1024,
          };
        }
        if (command.constructor.name === 'DeleteObjectCommand') {
          return {};
        }
        if (command.constructor.name === 'HeadObjectCommand') {
          return {
            ContentType: 'application/pdf',
            ContentLength: 1024,
            LastModified: new Date(),
          };
        }
        return {};
      }),
    })),
    PutObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    HeadObjectCommand: jest.fn(),
  }));

  // Mock KMS Client - return successful signing responses
  jest.mock('@aws-sdk/client-kms', () => ({
    KMSClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation(async (command: any) => {
        if (command.constructor.name === 'SignCommand') {
          return {
            Signature: new Uint8Array([1, 2, 3, 4, 5]),
            KeyId: 'test-key-id',
            SigningAlgorithm: 'RSA_SHA_256',
          };
        }
        if (command.constructor.name === 'VerifyCommand') {
          return {
            SignatureValid: true,
            KeyId: 'test-key-id',
            SigningAlgorithm: 'RSA_SHA_256',
          };
        }
        if (command.constructor.name === 'GetPublicKeyCommand') {
          return {
            PublicKey: new Uint8Array([1, 2, 3, 4, 5]),
            KeyId: 'test-key-id',
            KeyUsage: 'SIGN_VERIFY',
          };
        }
        return {};
      }),
    })),
    SignCommand: jest.fn(),
    VerifyCommand: jest.fn(),
    GetPublicKeyCommand: jest.fn(),
  }));

  // Mock EventBridge Client - return successful event publishing
  jest.mock('@aws-sdk/client-eventbridge', () => ({
    EventBridgeClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({
        FailedEntryCount: 0,
        Entries: [{ EventId: 'test-event-id' }],
      } as any),
    })),
    PutEventsCommand: jest.fn(),
  }));

  // Mock SSM Client - return configuration values
  jest.mock('@aws-sdk/client-ssm', () => ({
    SSMClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation(async (command: any) => {
        if (command.constructor.name === 'GetParameterCommand') {
          return {
            Parameter: {
              Name: command.input.Name,
              Value: 'test-value',
              Type: 'String',
            },
          };
        }
        if (command.constructor.name === 'GetParametersCommand') {
          return {
            Parameters: [
              { Name: 'test-param-1', Value: 'test-value-1', Type: 'String' },
              { Name: 'test-param-2', Value: 'test-value-2', Type: 'String' },
            ],
          };
        }
        return {};
      }),
    })),
    GetParameterCommand: jest.fn(),
    GetParametersCommand: jest.fn(),
  }));

  // Cognito is not used in signature-service, so no mock needed
};

/**
 * Mock data for DynamoDB operations
 */
export const mockDynamoDbData = {
  envelope: {
    PK: 'TENANT#tenant-123#ENVELOPE#envelope-123',
    SK: 'ENVELOPE#envelope-123',
    id: 'envelope-123',
    tenantId: 'tenant-123',
    status: 'draft',
    title: 'Test Contract',
    description: 'Test contract description',
    ownerId: 'owner-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  party: {
    PK: 'TENANT#tenant-123#ENVELOPE#envelope-123',
    SK: 'PARTY#party-123',
    id: 'party-123',
    envelopeId: 'envelope-123',
    tenantId: 'tenant-123',
    name: 'Test Signer',
    email: 'signer@test.com',
    role: 'signer',
    sequence: 1,
    status: 'pending',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  document: {
    PK: 'TENANT#tenant-123#ENVELOPE#envelope-123',
    SK: 'DOCUMENT#document-123',
    id: 'document-123',
    envelopeId: 'envelope-123',
    tenantId: 'tenant-123',
    name: 'contract.pdf',
    contentType: 'application/pdf',
    size: 1024,
    digest: { alg: 'sha256', value: 'test-hash' },
    s3Key: 'documents/tenant-123/envelope-123/document-123.pdf',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
};

/**
 * Mock responses for S3 operations
 */
export const mockS3Responses = {
  putObject: {
    ETag: '"test-etag"',
    VersionId: 'test-version-id',
  },
  getObject: {
    Body: {
      transformToByteArray: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]) as any),
    },
    ContentType: 'application/pdf',
    ContentLength: 1024,
    LastModified: new Date('2024-01-01T00:00:00Z'),
  },
  headObject: {
    ContentType: 'application/pdf',
    ContentLength: 1024,
    LastModified: new Date('2024-01-01T00:00:00Z'),
  },
};

/**
 * Mock responses for KMS operations
 */
export const mockKmsResponses = {
  sign: {
    Signature: new Uint8Array([1, 2, 3, 4, 5]),
    KeyId: 'test-key-id',
    SigningAlgorithm: 'RSA_SHA_256',
  },
  verify: {
    SignatureValid: true,
    KeyId: 'test-key-id',
    SigningAlgorithm: 'RSA_SHA_256',
  },
  getPublicKey: {
    PublicKey: new Uint8Array([1, 2, 3, 4, 5]),
    KeyId: 'test-key-id',
    KeyUsage: 'SIGN_VERIFY',
  },
};

/**
 * Mock responses for EventBridge operations
 */
export const mockEventBridgeResponses = {
  putEvents: {
    FailedEntryCount: 0,
    Entries: [
      {
        EventId: 'test-event-id',
      },
    ],
  },
};

/**
 * Mock responses for SSM operations
 */
export const mockSsmResponses = {
  getParameter: {
    Parameter: {
      Name: 'test-parameter',
      Value: 'test-value',
      Type: 'String',
    },
  },
  getParameters: {
    Parameters: [
      {
        Name: 'test-parameter-1',
        Value: 'test-value-1',
        Type: 'String',
      },
      {
        Name: 'test-parameter-2',
        Value: 'test-value-2',
        Type: 'String',
      },
    ],
  },
};

/**
 * Mock responses for Cognito operations
 */
export const mockCognitoResponses = {
  adminGetUser: {
    Username: 'test-user',
    UserStatus: 'CONFIRMED',
    UserAttributes: [
      {
        Name: 'email',
        Value: 'test@example.com',
      },
      {
        Name: 'sub',
        Value: 'test-user-id',
      },
    ],
  },
  adminListGroupsForUser: {
    Groups: [
      {
        GroupName: 'test-group',
        Description: 'Test group',
      },
    ],
  },
};
