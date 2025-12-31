/**
 * @fileoverview InfrastructureFactory Tests - Unit tests for InfrastructureFactory
 * @summary Tests for the factory that creates AWS and external infrastructure services
 * @description Comprehensive unit tests for InfrastructureFactory class that verifies
 * proper creation of AWS clients, services, and infrastructure components.
 */

import { InfrastructureFactory } from '../../../../../src/infrastructure/factories/infrastructure/InfrastructureFactory';

jest.mock('@aws-sdk/client-kms', () => ({
  KMSClient: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@aws-sdk/client-eventbridge', () => ({
  EventBridgeClient: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@lawprotect/shared-ts', () => ({
  S3Presigner: jest.fn().mockImplementation(() => ({})),
  S3EvidenceStorage: jest.fn().mockImplementation(() => ({})),
  EventServiceFactory: {
    createOutboxRepository: jest.fn(() => ({})),
    createEventBridgeAdapter: jest.fn(() => ({})),
  },
  OutboxRepository: jest.fn(),
  EventBridgeAdapter: jest.fn(),
  DynamoDBClientAdapter: jest.fn().mockImplementation(() => ({})),
  EventBridgeClientAdapter: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../../../src/services/kmsService/KmsService', () => ({
  KmsService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../../../src/services/s3Service/S3Service', () => ({
  S3Service: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../../../src/services/audit/AuditEventService', () => ({
  AuditEventService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../../../src/infrastructure/factories/repositories/RepositoryFactory', () => ({
  RepositoryFactory: {
    createSignatureAuditEventRepository: jest.fn(() => ({})),
  },
}));

jest.mock('../../../../../src/config/AppConfig', () => ({
  loadConfig: jest.fn(() => ({
    kms: { region: 'us-east-1' },
    s3: { region: 'us-east-1', bucketName: 'test-bucket' },
    aws: { region: 'us-east-1' },
    outbox: { tableName: 'test-outbox' },
    eventbridge: { busName: 'test-bus', source: 'test-source' },
    documentDownload: {
      maxExpirationSeconds: 3600,
      minExpirationSeconds: 60,
    },
  })),
}));

describe('InfrastructureFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be importable', () => {
    expect(InfrastructureFactory).toBeDefined();
  });

  it('should have createKmsService method', () => {
    expect(InfrastructureFactory.createKmsService).toBeDefined();
    expect(typeof InfrastructureFactory.createKmsService).toBe('function');
  });

  it('should have createS3Service method', () => {
    expect(InfrastructureFactory.createS3Service).toBeDefined();
    expect(typeof InfrastructureFactory.createS3Service).toBe('function');
  });

  it('should have createAuditEventService method', () => {
    expect(InfrastructureFactory.createAuditEventService).toBeDefined();
    expect(typeof InfrastructureFactory.createAuditEventService).toBe('function');
  });

  it('should have createOutboxRepository method', () => {
    expect(InfrastructureFactory.createOutboxRepository).toBeDefined();
    expect(typeof InfrastructureFactory.createOutboxRepository).toBe('function');
  });

  it('should have createEventBridgeAdapter method', () => {
    expect(InfrastructureFactory.createEventBridgeAdapter).toBeDefined();
    expect(typeof InfrastructureFactory.createEventBridgeAdapter).toBe('function');
  });

  it('should have createAll method', () => {
    expect(InfrastructureFactory.createAll).toBeDefined();
    expect(typeof InfrastructureFactory.createAll).toBe('function');
  });

  describe('createKmsService', () => {
    it('should create KmsService instance', () => {
      const { KmsService } = require('../../../../../src/services/kmsService/KmsService');
      const { KMSClient } = require('@aws-sdk/client-kms');

      const result = InfrastructureFactory.createKmsService();

      expect(result).toBeDefined();
      expect(KmsService).toHaveBeenCalled();
    });
  });

  describe('createS3Service', () => {
    it('should create S3Service instance', () => {
      const { S3Service } = require('../../../../../src/services/s3Service/S3Service');
      const { S3Presigner, S3EvidenceStorage } = require('@lawprotect/shared-ts');
      const { RepositoryFactory } = require('../../../../../src/infrastructure/factories/repositories/RepositoryFactory');

      const result = InfrastructureFactory.createS3Service();

      expect(result).toBeDefined();
      expect(S3Service).toHaveBeenCalled();
      expect(RepositoryFactory.createSignatureAuditEventRepository).toHaveBeenCalled();
    });
  });

  describe('createAuditEventService', () => {
    it('should create AuditEventService instance', () => {
      const { AuditEventService } = require('../../../../../src/services/audit/AuditEventService');
      const { RepositoryFactory } = require('../../../../../src/infrastructure/factories/repositories/RepositoryFactory');

      const result = InfrastructureFactory.createAuditEventService();

      expect(result).toBeDefined();
      expect(AuditEventService).toHaveBeenCalled();
      expect(RepositoryFactory.createSignatureAuditEventRepository).toHaveBeenCalled();
    });
  });

  describe('createOutboxRepository', () => {
    it('should create OutboxRepository instance', () => {
      const { EventServiceFactory } = require('@lawprotect/shared-ts');
      const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

      const result = InfrastructureFactory.createOutboxRepository();

      expect(result).toBeDefined();
      expect(DynamoDBClient).toHaveBeenCalled();
      expect(EventServiceFactory.createOutboxRepository).toHaveBeenCalled();
    });
  });

  describe('createEventBridgeAdapter', () => {
    it('should create EventBridgeAdapter instance', () => {
      const { EventServiceFactory } = require('@lawprotect/shared-ts');
      const { EventBridgeClient } = require('@aws-sdk/client-eventbridge');

      const result = InfrastructureFactory.createEventBridgeAdapter();

      expect(result).toBeDefined();
      expect(EventBridgeClient).toHaveBeenCalled();
      expect(EventServiceFactory.createEventBridgeAdapter).toHaveBeenCalled();
    });
  });

  describe('createAll', () => {
    it('should create all infrastructure services', () => {
      const result = InfrastructureFactory.createAll();

      expect(result).toBeDefined();
      expect(result.kmsService).toBeDefined();
      expect(result.s3Service).toBeDefined();
      expect(result.auditEventService).toBeDefined();
      expect(result.outboxRepository).toBeDefined();
      expect(result.eventBridgeAdapter).toBeDefined();
    });

    it('should return object with all required services', () => {
      const result = InfrastructureFactory.createAll();

      expect(result).toHaveProperty('kmsService');
      expect(result).toHaveProperty('s3Service');
      expect(result).toHaveProperty('auditEventService');
      expect(result).toHaveProperty('outboxRepository');
      expect(result).toHaveProperty('eventBridgeAdapter');
    });
  });
});
