// @ts-nocheck
/**
 * @file awsMocks.ts
 * @summary AWS service mocks for integration tests
 * @description Mock repositories with in-memory database simulation
 * Uses real business logic with mocked data persistence
 */

import { jest } from '@jest/globals';

// In-memory database simulation - must be defined before any mocks
const inMemoryDb = {
  inputs: new Map<string, any>(),
  envelopes: new Map<string, any>(),
  documents: new Map<string, any>(),
  parties: new Map<string, any>(),
  consents: new Map<string, any>(),
  audit: new Map<string, any>(),
};

// Mock repositories directly with in-memory database
jest.mock('@/infrastructure/dynamodb/InputRepositoryDdb', () => ({
  InputRepositoryDdb: jest.fn().mockImplementation(() => ({
    listByEnvelope: jest.fn().mockImplementation(async ({ envelopeId }) => {
      const inputs = Array.from(inMemoryDb.inputs.values())
        .filter(input => input.envelopeId === envelopeId);
      console.log('InputRepositoryDdb.listByEnvelope for envelopeId:', envelopeId, 'found:', inputs.length, 'inputs');
      return {
        items: inputs,
        count: inputs.length,
      };
    }),
    create: jest.fn().mockImplementation(async (input) => {
      inMemoryDb.inputs.set(input.inputId, input);
      console.log('InputRepositoryDdb.create:', input.inputId);
      return input;
    }),
    update: jest.fn().mockImplementation(async (input) => {
      inMemoryDb.inputs.set(input.inputId, input);
      return input;
    }),
    delete: jest.fn().mockImplementation(async ({ inputId }) => {
      inMemoryDb.inputs.delete(inputId);
      return undefined;
    }),
    getById: jest.fn().mockImplementation(async ({ inputId }) => {
      return inMemoryDb.inputs.get(inputId) || null;
    }),
  })),
}));

jest.mock('@/infrastructure/dynamodb/EnvelopeRepositoryDdb', () => ({
  EnvelopeRepositoryDdb: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockImplementation(async (envelope) => {
      inMemoryDb.envelopes.set(envelope.envelopeId, envelope);
      console.log('EnvelopeRepositoryDdb.create:', envelope.envelopeId);
      return envelope;
    }),
    getById: jest.fn().mockImplementation(async (params) => {
      console.log('EnvelopeRepositoryDdb.getById called with params:', params);
      // Handle both cases: direct envelopeId or object with envelopeId property
      const envelopeId = typeof params === 'string' ? params : params.envelopeId;
      const envelope = inMemoryDb.envelopes.get(envelopeId);
      console.log('EnvelopeRepositoryDdb.getById for envelopeId:', envelopeId, 'found:', !!envelope);
      if (!envelope) {
        console.log('Available envelopes in DB:', Array.from(inMemoryDb.envelopes.keys()));
      }
      return envelope || null;
    }),
    update: jest.fn().mockImplementation(async (envelopeId, updates) => {
      const existing = inMemoryDb.envelopes.get(envelopeId);
      if (existing) {
        const updated = { ...existing, ...updates };
        inMemoryDb.envelopes.set(envelopeId, updated);
        console.log('EnvelopeRepositoryDdb.update:', envelopeId, 'with:', updates);
        return updated;
      }
      return null;
    }),
  })),
}));

jest.mock('@/infrastructure/dynamodb/DocumentRepositoryDdb', () => ({
  DocumentRepositoryDdb: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockImplementation(async (document) => {
      inMemoryDb.documents.set(document.documentId, document);
      console.log('DocumentRepositoryDdb.create:', document.documentId);
      return document;
    }),
    getById: jest.fn().mockImplementation(async ({ documentId }) => {
      return inMemoryDb.documents.get(documentId) || null;
    }),
    listByEnvelope: jest.fn().mockImplementation(async ({ envelopeId }) => {
      const documents = Array.from(inMemoryDb.documents.values())
        .filter(document => document.envelopeId === envelopeId);
      return {
        items: documents,
        count: documents.length,
      };
    }),
  })),
}));

jest.mock('@/infrastructure/dynamodb/PartyRepositoryDdb', () => ({
  PartyRepositoryDdb: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockImplementation(async (party) => {
      inMemoryDb.parties.set(party.partyId, party);
      console.log('PartyRepositoryDdb.create:', party.partyId);
      return party;
    }),
    getById: jest.fn().mockImplementation(async ({ partyId }) => {
      return inMemoryDb.parties.get(partyId) || null;
    }),
    update: jest.fn().mockImplementation(async (partyId, updates) => {
      const existing = inMemoryDb.parties.get(partyId);
      if (existing) {
        const updated = { ...existing, ...updates };
        inMemoryDb.parties.set(partyId, updated);
        console.log('PartyRepositoryDdb.update:', partyId, 'with:', updates);
        return updated;
      }
      return null;
    }),
    listByEnvelope: jest.fn().mockImplementation(async ({ envelopeId }) => {
      const parties = Array.from(inMemoryDb.parties.values())
        .filter(party => party.envelopeId === envelopeId);
      return {
        items: parties,
        count: parties.length,
      };
    }),
  })),
}));

// Mock Rate Limit Store and Idempotency Store FIRST - before any other code
jest.mock('@lawprotect/shared-ts', () => {
  const originalModule = jest.requireActual('@lawprotect/shared-ts');
  return {
    ...originalModule,
    RateLimitStoreDdb: jest.fn().mockImplementation(() => ({
      incrementAndCheck: jest.fn().mockResolvedValue({
        currentUsage: 1,
        maxRequests: 100,
        resetInSeconds: 3600,
      }),
    })),
    IdempotencyStoreDdb: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockResolvedValue(null),
      getRecord: jest.fn().mockResolvedValue(null),
      putPending: jest.fn().mockResolvedValue(undefined),
      putCompleted: jest.fn().mockResolvedValue(undefined),
    })),
    KmsSigner: jest.fn().mockImplementation(() => ({
      sign: jest.fn().mockResolvedValue({
        signature: new Uint8Array([1, 2, 3, 4, 5]),
        keyId: 'test-key-id',
        signingAlgorithm: 'RSASSA_PSS_SHA_256',
      }),
      verify: jest.fn().mockResolvedValue({
        signatureValid: true,
        keyId: 'test-key-id',
        signingAlgorithm: 'RSASSA_PSS_SHA_256',
      }),
    })),
    S3Presigner: jest.fn().mockImplementation(() => ({
      getObjectUrl: jest.fn().mockResolvedValue('https://test-bucket.s3.amazonaws.com/test-key?presigned-url'),
      putObjectUrl: jest.fn().mockResolvedValue('https://test-bucket.s3.amazonaws.com/test-key?presigned-url'),
    })),
  };
});

// Mock AWS SDK clients - simplified since we're mocking repositories directly
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
    })),
  },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  DeleteCommand: jest.fn(),
  QueryCommand: jest.fn(),
}));

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
          SigningAlgorithm: 'RSASSA_PSS_SHA_256',
        };
      }
      if (command.constructor.name === 'VerifyCommand') {
        return {
          SignatureValid: true,
          KeyId: 'test-key-id',
          SigningAlgorithm: 'RSASSA_PSS_SHA_256',
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

/**
 * Setup function to initialize the in-memory database
 */
export const setupInMemoryDatabase = () => {
  // Clear all data
  inMemoryDb.inputs.clear();
  inMemoryDb.envelopes.clear();
  inMemoryDb.documents.clear();
  inMemoryDb.parties.clear();
  inMemoryDb.consents.clear();
  inMemoryDb.audit.clear();
};

/**
 * Get access to the in-memory database for test assertions
 */
export const getInMemoryDatabase = () => inMemoryDb;

/**
 * Mock implementations for AWS services - only mock the clients, not the business logic
 * Now uses real repositories with in-memory database
 */
export const mockAwsServices = () => {
  setupInMemoryDatabase();
  // All AWS clients are already mocked at the top level
  // The real repositories will use these mocked clients with in-memory data
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
