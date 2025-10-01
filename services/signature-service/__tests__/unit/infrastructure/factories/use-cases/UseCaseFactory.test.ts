import { UseCaseFactory } from '../../../../../src/infrastructure/factories/use-cases/UseCaseFactory';

// Mock the dependencies to avoid configuration loading
jest.mock('../../../../../src/infrastructure/factories/services/ServiceFactory', () => ({
  ServiceFactory: {
    createAll: jest.fn(() => ({
      envelopeCrudService: jest.fn(),
      envelopeAccessService: jest.fn(),
      envelopeStateService: jest.fn(),
      envelopeDownloadService: jest.fn(),
      envelopeSignerService: jest.fn(),
      envelopeNotificationService: jest.fn(),
      invitationTokenService: jest.fn(),
      consentService: jest.fn(),
    }))
  }
}));

jest.mock('../../../../../src/infrastructure/factories/infrastructure/InfrastructureFactory', () => ({
  InfrastructureFactory: {
    createAll: jest.fn(() => ({
      auditEventService: jest.fn(),
      envelopeNotificationService: jest.fn(),
      invitationTokenService: jest.fn(),
    }))
  }
}));

describe('UseCaseFactory', () => {
  it('should be importable', () => {
    expect(UseCaseFactory).toBeDefined();
  });

  it('should have createCreateEnvelopeUseCase method', () => {
    expect(UseCaseFactory.createCreateEnvelopeUseCase).toBeDefined();
    expect(typeof UseCaseFactory.createCreateEnvelopeUseCase).toBe('function');
  });

  it('should have createGetEnvelopeUseCase method', () => {
    expect(UseCaseFactory.createGetEnvelopeUseCase).toBeDefined();
    expect(typeof UseCaseFactory.createGetEnvelopeUseCase).toBe('function');
  });

  it('should have createUpdateEnvelopeUseCase method', () => {
    expect(UseCaseFactory.createUpdateEnvelopeUseCase).toBeDefined();
    expect(typeof UseCaseFactory.createUpdateEnvelopeUseCase).toBe('function');
  });

  it('should have createSignDocumentUseCase method', () => {
    expect(UseCaseFactory.createSignDocumentUseCase).toBeDefined();
    expect(typeof UseCaseFactory.createSignDocumentUseCase).toBe('function');
  });

  it('should have createDownloadDocumentUseCase method', () => {
    expect(UseCaseFactory.createDownloadDocumentUseCase).toBeDefined();
    expect(typeof UseCaseFactory.createDownloadDocumentUseCase).toBe('function');
  });

  it('should have createDeclineSignerUseCase method', () => {
    expect(UseCaseFactory.createDeclineSignerUseCase).toBeDefined();
    expect(typeof UseCaseFactory.createDeclineSignerUseCase).toBe('function');
  });

  describe('use case creation methods', () => {
    it('should have createCreateEnvelopeUseCase method with correct signature', () => {
      expect(UseCaseFactory.createCreateEnvelopeUseCase).toBeDefined();
      expect(typeof UseCaseFactory.createCreateEnvelopeUseCase).toBe('function');
      expect(UseCaseFactory.createCreateEnvelopeUseCase.length).toBe(1);
    });

    it('should have createGetEnvelopeUseCase method with correct signature', () => {
      expect(UseCaseFactory.createGetEnvelopeUseCase).toBeDefined();
      expect(typeof UseCaseFactory.createGetEnvelopeUseCase).toBe('function');
      expect(UseCaseFactory.createGetEnvelopeUseCase.length).toBe(1);
    });

    it('should have createUpdateEnvelopeUseCase method with correct signature', () => {
      expect(UseCaseFactory.createUpdateEnvelopeUseCase).toBeDefined();
      expect(typeof UseCaseFactory.createUpdateEnvelopeUseCase).toBe('function');
      expect(UseCaseFactory.createUpdateEnvelopeUseCase.length).toBe(1);
    });

    it('should have createSignDocumentUseCase method with correct signature', () => {
      expect(UseCaseFactory.createSignDocumentUseCase).toBeDefined();
      expect(typeof UseCaseFactory.createSignDocumentUseCase).toBe('function');
      expect(UseCaseFactory.createSignDocumentUseCase.length).toBe(1);
    });

    it('should have createDownloadDocumentUseCase method with correct signature', () => {
      expect(UseCaseFactory.createDownloadDocumentUseCase).toBeDefined();
      expect(typeof UseCaseFactory.createDownloadDocumentUseCase).toBe('function');
      expect(UseCaseFactory.createDownloadDocumentUseCase.length).toBe(1);
    });

    it('should have createDeclineSignerUseCase method with correct signature', () => {
      expect(UseCaseFactory.createDeclineSignerUseCase).toBeDefined();
      expect(typeof UseCaseFactory.createDeclineSignerUseCase).toBe('function');
      expect(UseCaseFactory.createDeclineSignerUseCase.length).toBe(1);
    });
  });

  describe('UseCaseFactory method execution', () => {
    it('should execute createCreateEnvelopeUseCase with mock services', () => {
      const mockServices = {
        envelopeCrudService: jest.fn(),
        envelopeHashService: jest.fn(),
        s3Service: jest.fn(),
        auditEventService: jest.fn()
      };

      const result = UseCaseFactory.createCreateEnvelopeUseCase(mockServices as any);
      expect(result).toBeDefined();
    });

    it('should execute createCancelEnvelopeUseCase with mock services', () => {
      const mockServices = {
        envelopeCrudService: jest.fn(),
        envelopeNotificationService: jest.fn()
      };

      const result = UseCaseFactory.createCancelEnvelopeUseCase(mockServices as any);
      expect(result).toBeDefined();
    });

    it('should execute createUpdateEnvelopeUseCase with mock services', () => {
      const mockServices = {
        envelopeCrudService: jest.fn(),
        envelopeStateService: jest.fn(),
        auditEventService: jest.fn()
      };

      const result = UseCaseFactory.createUpdateEnvelopeUseCase(mockServices as any);
      expect(result).toBeDefined();
    });

    it('should execute createSignDocumentUseCase with mock services', () => {
      const mockServices = {
        envelopeSignerService: jest.fn(),
        envelopeStateService: jest.fn(),
        auditEventService: jest.fn()
      };

      const result = UseCaseFactory.createSignDocumentUseCase(mockServices as any);
      expect(result).toBeDefined();
    });

    it('should execute createDownloadDocumentUseCase with mock services', () => {
      const mockServices = {
        envelopeDownloadService: jest.fn(),
        envelopeAccessService: jest.fn(),
        auditEventService: jest.fn()
      };

      const result = UseCaseFactory.createDownloadDocumentUseCase(mockServices as any);
      expect(result).toBeDefined();
    });

    it('should execute createDeclineSignerUseCase with mock services', () => {
      const mockServices = {
        envelopeSignerService: jest.fn(),
        envelopeStateService: jest.fn(),
        auditEventService: jest.fn()
      };

      const result = UseCaseFactory.createDeclineSignerUseCase(mockServices as any);
      expect(result).toBeDefined();
    });
  });
});
