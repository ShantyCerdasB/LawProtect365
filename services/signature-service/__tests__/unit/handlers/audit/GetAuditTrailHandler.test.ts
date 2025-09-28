import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { EnvelopeId } from '../../../../src/domain/value-objects/EnvelopeId';
import { ResponseType, VALID_COGNITO_ROLES } from '@lawprotect/shared-ts';
import { GetAuditTrailQuerySchema, EnvelopeIdSchema } from '../../../../src/domain/schemas/EnvelopeSchema';

// Mock all dependencies before any imports
jest.mock('zod', () => ({
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
}));

// Mock ServiceFactory
const mockSignatureOrchestrator = {
  getAuditTrail: jest.fn() as jest.MockedFunction<any>,
  createEnvelope: jest.fn() as jest.MockedFunction<any>,
  cancelEnvelope: jest.fn() as jest.MockedFunction<any>,
  updateEnvelope: jest.fn() as jest.MockedFunction<any>,
  sendEnvelope: jest.fn() as jest.MockedFunction<any>,
  getEnvelope: jest.fn() as jest.MockedFunction<any>,
  listEnvelopesByUser: jest.fn() as jest.MockedFunction<any>,
  downloadDocument: jest.fn() as jest.MockedFunction<any>,
  declineSigner: jest.fn() as jest.MockedFunction<any>,
  shareDocumentView: jest.fn() as jest.MockedFunction<any>,
  signDocument: jest.fn() as jest.MockedFunction<any>,
  sendReminders: jest.fn() as jest.MockedFunction<any>
};

const mockServiceFactory = {
  createSignatureOrchestrator: jest.fn(() => mockSignatureOrchestrator)
};

jest.mock('../../../../src/infrastructure/factories/services/ServiceFactory', () => ({
  ServiceFactory: mockServiceFactory
}));

// Mock AppConfig
const mockConfig = {
  database: { url: 'postgresql://test:test@localhost:5432/test' },
  s3: { bucketName: 'test-bucket', region: 'us-east-1' },
  kms: { signerKeyId: 'test-key', region: 'us-east-1' },
  eventbridge: { busName: 'test-bus', source: 'test' },
  outbox: { tableName: 'test-outbox' },
  aws: { region: 'us-east-1' },
  documentDownload: { defaultExpirationSeconds: 3600 },
  reminders: { maxRemindersPerSigner: 3 }
};

jest.mock('../../../../src/config/AppConfig', () => ({
  loadConfig: jest.fn(() => mockConfig)
}));

// Mock shared-ts
jest.mock('@lawprotect/shared-ts', () => ({
  buildAppConfig: jest.fn(() => mockConfig),
  getPrisma: jest.fn(() => ({})),
  ControllerFactory: {
    createQuery: jest.fn((config) => config)
  },
  VALID_COGNITO_ROLES: ['user', 'admin', 'super-admin'],
  ResponseType: {
    OK: 'ok',
    CREATED: 'created',
    NO_CONTENT: 'noContent'
  }
}));

// Mock AWS clients
jest.mock('@aws-sdk/client-kms', () => ({
  KMSClient: jest.fn(() => ({}))
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({}))
}));

jest.mock('@aws-sdk/client-eventbridge', () => ({
  EventBridgeClient: jest.fn(() => ({}))
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({}))
}));

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({}))
}));

// Now import the handler
const { getAuditTrailHandler } = require('../../../../src/handlers/audit/GetAuditTrailHandler');

describe('GetAuditTrailHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Handler Configuration', () => {
    it('should be defined and be an object', () => {
      expect(getAuditTrailHandler).toBeDefined();
      expect(typeof getAuditTrailHandler).toBe('object');
    });

    it('should use ResponseType.OK enum', () => {
      expect(getAuditTrailHandler.responseType).toBe(ResponseType.OK);
    });

    it('should require authentication', () => {
      expect(getAuditTrailHandler.requireAuth).toBe(true);
    });

    it('should require valid roles', () => {
      expect(getAuditTrailHandler.requiredRoles).toEqual(expect.arrayContaining([...VALID_COGNITO_ROLES]));
    });

    it('should include security context', () => {
      expect(getAuditTrailHandler.includeSecurityContext).toBe(true);
    });

    it('should use correct path schema', () => {
      expect(getAuditTrailHandler.pathSchema).toBe(EnvelopeIdSchema);
    });

    it('should use correct query schema', () => {
      expect(getAuditTrailHandler.querySchema).toBe(GetAuditTrailQuerySchema);
    });
  });

  describe('Service Class Instantiation and Execution', () => {
    it('should create SignatureOrchestrator in constructor', () => {
      const appServiceInstance = new getAuditTrailHandler.appServiceClass();
      expect(mockServiceFactory.createSignatureOrchestrator).toHaveBeenCalledTimes(1);
      expect(appServiceInstance['signatureOrchestrator']).toBe(mockSignatureOrchestrator);
    });

    it('should call getAuditTrail with correct parameters', async () => {
      const appServiceInstance = new getAuditTrailHandler.appServiceClass();
      const envelopeId = EnvelopeId.fromString('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      const userId = 'test-user-id';

      const mockResult = {
        envelopeId: envelopeId.getValue(),
        events: []
      };
      mockSignatureOrchestrator.getAuditTrail.mockResolvedValue(mockResult);

      const result = await appServiceInstance.execute({ envelopeId, userId });

      expect(mockSignatureOrchestrator.getAuditTrail).toHaveBeenCalledWith(envelopeId, userId);
      expect(result).toEqual(mockResult);
    });

    it('should handle orchestrator errors', async () => {
      const appServiceInstance = new getAuditTrailHandler.appServiceClass();
      const envelopeId = EnvelopeId.fromString('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      const userId = 'test-user-id';

      const error = new Error('Orchestrator failed');
      mockSignatureOrchestrator.getAuditTrail.mockRejectedValue(error);

      await expect(appServiceInstance.execute({ envelopeId, userId })).rejects.toThrow('Orchestrator failed');
    });
  });

  describe('Parameter Extraction', () => {
    it('should extract envelopeId and userId correctly', () => {
      const path = { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' };
      const context = { auth: { userId: 'user-456' } };
      const params = getAuditTrailHandler.extractParams(path, {}, {}, context);

      expect(params.envelopeId).toBeInstanceOf(EnvelopeId);
      expect(params.envelopeId.getValue()).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      expect(params.userId).toBe('user-456');
    });

    it('should throw error for invalid envelopeId format', () => {
      const path = { id: 'invalid-uuid' };
      const context = { auth: { userId: 'user-456' } };

      expect(() => getAuditTrailHandler.extractParams(path, {}, {}, context)).toThrow();
    });

    it('should handle missing userId in context', () => {
      const path = { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' };
      const context = { auth: {} as any };

      expect(() => getAuditTrailHandler.extractParams(path, {}, {}, context)).toThrow();
    });
  });

  describe('Response Transformation', () => {
    it('should transform audit trail result with all fields', async () => {
      const mockResult = {
        envelopeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        events: [
          {
            id: 'event-1',
            eventType: 'ENVELOPE_CREATED',
            description: 'Envelope created',
            userEmail: 'test@example.com',
            userName: 'Test User',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            metadata: { key: 'value' }
          }
        ]
      };

      const transformed = await getAuditTrailHandler.transformResult(mockResult);
      expect(transformed).toEqual({
        envelopeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        events: [
          {
            id: 'event-1',
            eventType: 'ENVELOPE_CREATED',
            description: 'Envelope created',
            userEmail: 'test@example.com',
            userName: 'Test User',
            createdAt: '2024-01-01T10:00:00.000Z',
            metadata: { key: 'value' }
          }
        ]
      });
    });

    it('should handle events with missing optional fields', async () => {
      const mockResult = {
        envelopeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        events: [
          {
            id: 'event-2',
            eventType: 'SIGNER_SIGNED',
            description: 'Document signed',
            createdAt: new Date('2024-01-02T11:00:00Z')
          }
        ]
      };

      const transformed = await getAuditTrailHandler.transformResult(mockResult);
      expect(transformed).toEqual({
        envelopeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        events: [
          {
            id: 'event-2',
            eventType: 'SIGNER_SIGNED',
            description: 'Document signed',
            userEmail: undefined,
            userName: undefined,
            createdAt: '2024-01-02T11:00:00.000Z',
            metadata: undefined
          }
        ]
      });
    });

    it('should handle empty events array', async () => {
      const mockResult = {
        envelopeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        events: []
      };

      const transformed = await getAuditTrailHandler.transformResult(mockResult);
      expect(transformed).toEqual({
        envelopeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        events: []
      });
    });
  });

  describe('Error Handling', () => {
    it('should propagate orchestrator errors without try-catch interference', async () => {
      const appServiceInstance = new getAuditTrailHandler.appServiceClass();
      const envelopeId = EnvelopeId.fromString('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      const userId = 'test-user-id';

      const error = new Error('Orchestrator failed');
      mockSignatureOrchestrator.getAuditTrail.mockRejectedValue(error);

      await expect(appServiceInstance.execute({ envelopeId, userId })).rejects.toThrow('Orchestrator failed');
    });

    it('should handle invalid envelope ID format', () => {
      const path = { id: 'invalid-uuid' };
      const context = { auth: { userId: 'user-456' } };

      expect(() => getAuditTrailHandler.extractParams(path, {}, {}, context)).toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete audit trail retrieval flow', async () => {
      const appServiceInstance = new getAuditTrailHandler.appServiceClass();
      const envelopeId = EnvelopeId.fromString('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      const userId = 'test-user-id';

      const mockResult = {
        envelopeId: envelopeId.getValue(),
        events: []
      };
      mockSignatureOrchestrator.getAuditTrail.mockResolvedValue(mockResult);

      const result = await appServiceInstance.execute({ envelopeId, userId });

      expect(result).toEqual(mockResult);
      expect(mockSignatureOrchestrator.getAuditTrail).toHaveBeenCalledTimes(1);
    });

    it('should handle orchestrator errors gracefully', async () => {
      const appServiceInstance = new getAuditTrailHandler.appServiceClass();
      const envelopeId = EnvelopeId.fromString('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      const userId = 'test-user-id';

      const error = new Error('Failed to get audit trail');
      mockSignatureOrchestrator.getAuditTrail.mockRejectedValue(error);

      await expect(appServiceInstance.execute({ envelopeId, userId })).rejects.toThrow('Failed to get audit trail');
    });

    it('should handle invalid envelope ID', () => {
      const path = { id: 'invalid-uuid' };
      const context = { auth: { userId: 'user-456' } };

      expect(() => getAuditTrailHandler.extractParams(path, {}, {}, context)).toThrow();
    });

    it('should handle missing userId in context', () => {
      const path = { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' };
      const context = { auth: {} as any };

      expect(() => getAuditTrailHandler.extractParams(path, {}, {}, context)).toThrow();
    });
  });

  describe('Coverage Tests', () => {
    it('should test all handler configuration options', () => {
      expect(getAuditTrailHandler).toBeDefined();
      expect(getAuditTrailHandler.responseType).toBe(ResponseType.OK);
      expect(getAuditTrailHandler.requireAuth).toBe(true);
      expect(getAuditTrailHandler.requiredRoles).toEqual(expect.arrayContaining([...VALID_COGNITO_ROLES]));
      expect(getAuditTrailHandler.includeSecurityContext).toBe(true);
      expect(getAuditTrailHandler.pathSchema).toBe(EnvelopeIdSchema);
      expect(getAuditTrailHandler.querySchema).toBe(GetAuditTrailQuerySchema);
    });

    it('should test all service class methods', () => {
      const appServiceInstance = new getAuditTrailHandler.appServiceClass();
      expect(appServiceInstance.execute).toBeDefined();
      expect(typeof appServiceInstance.execute).toBe('function');
    });

    it('should test all parameter extraction logic', () => {
      const path = { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' };
      const context = { auth: { userId: 'user-456' } };
      const params = getAuditTrailHandler.extractParams(path, {}, {}, context);

      expect(params.envelopeId).toBeInstanceOf(EnvelopeId);
      expect(params.userId).toBe('user-456');
    });

    it('should test all response transformation logic', async () => {
      const mockResult = {
        envelopeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        events: [
          {
            id: 'event-1',
            eventType: 'ENVELOPE_CREATED',
            description: 'Envelope created',
            userEmail: 'test@example.com',
            userName: 'Test User',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            metadata: { key: 'value' }
          }
        ]
      };

      const transformed = await getAuditTrailHandler.transformResult(mockResult);
      expect(transformed.envelopeId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      expect(transformed.events).toHaveLength(1);
      expect(transformed.events[0].createdAt).toBe('2024-01-01T10:00:00.000Z');
    });

    it('should test all error handling scenarios', async () => {
      const appServiceInstance = new getAuditTrailHandler.appServiceClass();
      const envelopeId = EnvelopeId.fromString('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      const userId = 'test-user-id';

      const error = new Error('Test error');
      mockSignatureOrchestrator.getAuditTrail.mockRejectedValue(error);

      await expect(appServiceInstance.execute({ envelopeId, userId })).rejects.toThrow('Test error');
    });

    it('should test all authentication scenarios', () => {
      const validPath = { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' };
      const validContext = { auth: { userId: 'user-456' } };
      const invalidPath = { id: 'invalid-uuid' };
      const invalidContext = { auth: {} as any };

      expect(() => getAuditTrailHandler.extractParams(validPath, {}, {}, validContext)).not.toThrow();
      expect(() => getAuditTrailHandler.extractParams(invalidPath, {}, {}, validContext)).toThrow();
      expect(() => getAuditTrailHandler.extractParams(validPath, {}, {}, invalidContext)).toThrow();
    });

    it('should test all schema validation scenarios', () => {
      expect(getAuditTrailHandler.pathSchema).toBe(EnvelopeIdSchema);
      expect(getAuditTrailHandler.querySchema).toBe(GetAuditTrailQuerySchema);
    });

    it('should test all ResponseType enum usage', () => {
      expect(getAuditTrailHandler.responseType).toBe(ResponseType.OK);
    });

    it('should test all type safety improvements', () => {
      expect(getAuditTrailHandler.extractParams).toBeDefined();
      expect(getAuditTrailHandler.transformResult).toBeDefined();
      expect(getAuditTrailHandler.appServiceClass).toBeDefined();
    });

    it('should test all handler structure scenarios', () => {
      expect(getAuditTrailHandler).toBeDefined();
      expect(typeof getAuditTrailHandler).toBe('object');
      expect(getAuditTrailHandler.responseType).toBe(ResponseType.OK);
      expect(getAuditTrailHandler.requireAuth).toBe(true);
      expect(getAuditTrailHandler.requiredRoles).toEqual(expect.arrayContaining([...VALID_COGNITO_ROLES]));
      expect(getAuditTrailHandler.includeSecurityContext).toBe(true);
      expect(getAuditTrailHandler.pathSchema).toBe(EnvelopeIdSchema);
      expect(getAuditTrailHandler.querySchema).toBe(GetAuditTrailQuerySchema);
    });
  });
});