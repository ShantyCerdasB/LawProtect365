/**
 * @fileoverview Handler Mocks - Reusable mocks for all handlers
 * @summary Mock implementations for handlers to avoid configuration errors
 * @description Provides mock implementations for ServiceFactory, loadConfig, and other
 * dependencies that cause configuration errors in handler tests.
 */

import { jest } from '@jest/globals';
import { createSignatureOrchestratorMock } from '../services/SignatureOrchestrator.mock';

/**
 * Mock configuration object for handlers
 */
export const mockHandlerConfig = {
  database: {
    url: 'postgresql://test:test@localhost:5432/test',
    maxConnections: 10,
    connectionTimeout: 30000
  },
  s3: {
    bucketName: 'test-bucket',
    region: 'us-east-1',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key'
  },
  kms: {
    signerKeyId: 'test-key-id',
    signingAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
    region: 'us-east-1',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key'
  },
  eventbridge: {
    busName: 'test-bus',
    source: 'test-source'
  },
  outbox: {
    tableName: 'test-outbox'
  },
  aws: {
    region: 'us-east-1',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key'
  },
  documentDownload: {
    defaultExpirationSeconds: 3600,
    maxExpirationSeconds: 86400,
    minExpirationSeconds: 300
  },
  reminders: {
    maxRemindersPerSigner: 3,
    minHoursBetweenReminders: 24,
    firstReminderHours: 24,
    secondReminderHours: 48,
    thirdReminderHours: 72
  }
};

/**
 * Mock ServiceFactory for handlers
 */
export const mockServiceFactory = {
  createSignatureOrchestrator: jest.fn(() => createSignatureOrchestratorMock()),
  createSignatureEnvelopeService: jest.fn(),
  createEnvelopeSignerService: jest.fn(),
  createInvitationTokenService: jest.fn(),
  createAuditEventService: jest.fn(),
  createEnvelopeNotificationService: jest.fn(),
  createKmsService: jest.fn(),
  createS3Service: jest.fn(),
  createConsentService: jest.fn(),
  createSignerReminderTrackingService: jest.fn()
};

/**
 * Mock loadConfig function
 */
export const mockLoadConfig = jest.fn(() => mockHandlerConfig);

/**
 * Mock buildAppConfig from shared-ts
 */
export const mockBuildAppConfig = jest.fn(() => mockHandlerConfig);

/**
 * Mock getPrisma function
 */
export const mockGetPrisma = jest.fn(() => ({
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
  envelope: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  signer: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  auditEvent: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

/**
 * Mock AWS clients
 */
export const mockKmsClient = {
  sign: jest.fn(),
  getPublicKey: jest.fn(),
  describeKey: jest.fn()
};

export const mockS3Client = {
  getObject: jest.fn(),
  putObject: jest.fn(),
  deleteObject: jest.fn(),
  headObject: jest.fn(),
  copyObject: jest.fn()
};

export const mockEventBridgeClient = {
  putEvents: jest.fn(),
  listRules: jest.fn(),
  putRule: jest.fn()
};

export const mockDynamoDBClient = {
  getItem: jest.fn(),
  putItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
  query: jest.fn(),
  scan: jest.fn()
};

/**
 * Mock Zod schema
 */
export const mockZod = {
  object: jest.fn(() => ({
    parse: jest.fn(),
    safeParse: jest.fn(() => ({ success: true, data: {} })),
    optional: jest.fn(() => ({})),
    min: jest.fn(() => ({})),
    max: jest.fn(() => ({})),
    string: jest.fn(() => ({})),
    number: jest.fn(() => ({})),
    boolean: jest.fn(() => ({})),
    array: jest.fn(() => ({})),
    enum: jest.fn(() => ({}))
  })),
  string: jest.fn(() => ({
    min: jest.fn(() => ({})),
    max: jest.fn(() => ({})),
    email: jest.fn(() => ({})),
    url: jest.fn(() => ({})),
    uuid: jest.fn(() => ({}))
  })),
  number: jest.fn(() => ({
    min: jest.fn(() => ({})),
    max: jest.fn(() => ({})),
    int: jest.fn(() => ({}))
  })),
  boolean: jest.fn(() => ({})),
  array: jest.fn(() => ({
    min: jest.fn(() => ({})),
    max: jest.fn(() => ({}))
  })),
  enum: jest.fn(() => ({})),
  literal: jest.fn(() => ({})),
  union: jest.fn(() => ({})),
  optional: jest.fn(() => ({})),
  nullable: jest.fn(() => ({})),
  default: jest.fn(() => ({}))
};

/**
 * Mock shared-ts functions
 */
export const mockSharedTs = {
  buildAppConfig: mockBuildAppConfig,
  getPrisma: mockGetPrisma,
  S3Presigner: jest.fn(),
  S3EvidenceStorage: jest.fn(),
  EventServiceFactory: jest.fn(),
  OutboxRepository: jest.fn(),
  EventBridgeAdapter: jest.fn(),
  EventPublisherService: jest.fn(),
  DynamoDBClientAdapter: jest.fn(),
  EventBridgeClientAdapter: jest.fn(),
  OutboxEventPublisher: jest.fn(),
  ControllerFactory: {
    createQuery: jest.fn(),
    createCommand: jest.fn(),
    createMutation: jest.fn()
  },
  VALID_COGNITO_ROLES: ['user', 'admin', 'super-admin'],
  ResponseType: {
    OK: 'ok',
    CREATED: 'created',
    NO_CONTENT: 'noContent'
  }
};

/**
 * Setup mocks for handler tests
 * Call this function at the beginning of handler test files
 */
export const setupHandlerMocks = () => {
  // Mock Zod
  jest.mock('zod', () => mockZod);

  // Mock ServiceFactory
  jest.mock('../../../../src/infrastructure/factories/services/ServiceFactory', () => ({
    ServiceFactory: mockServiceFactory
  }));

  // Mock AppConfig
  jest.mock('../../../../src/config/AppConfig', () => ({
    loadConfig: mockLoadConfig
  }));

  // Mock shared-ts
  jest.mock('@lawprotect/shared-ts', () => mockSharedTs);

  // Mock AWS clients
  jest.mock('@aws-sdk/client-kms', () => ({
    KMSClient: jest.fn(() => mockKmsClient)
  }));

  jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn(() => mockS3Client)
  }));

  jest.mock('@aws-sdk/client-eventbridge', () => ({
    EventBridgeClient: jest.fn(() => mockEventBridgeClient)
  }));

  jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn(() => mockDynamoDBClient)
  }));

  // Mock Prisma
  jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockGetPrisma())
  }));
};

/**
 * Reset all mocks
 * Call this function in beforeEach
 */
export const resetHandlerMocks = () => {
  jest.clearAllMocks();
  mockServiceFactory.createSignatureOrchestrator.mockReturnValue(createSignatureOrchestratorMock());
  mockLoadConfig.mockReturnValue(mockHandlerConfig);
  mockBuildAppConfig.mockReturnValue(mockHandlerConfig);
  mockGetPrisma.mockReturnValue(mockGetPrisma());
};
