import { ServiceFactory } from '../../../../../src/infrastructure/factories/services/ServiceFactory';

// Mock the dependencies to avoid configuration loading
jest.mock('../../../../../src/infrastructure/factories/repositories/RepositoryFactory', () => ({
  RepositoryFactory: {
    createAll: jest.fn(() => ({
      signatureEnvelopeRepository: jest.fn(),
      envelopeSignerRepository: jest.fn(),
      invitationTokenRepository: jest.fn(),
      consentRepository: jest.fn(),
      signerReminderTrackingRepository: jest.fn(),
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

describe('ServiceFactory', () => {
  it('should be importable', () => {
    expect(ServiceFactory).toBeDefined();
  });

  it('should have createEnvelopeCrudService method', () => {
    expect(ServiceFactory.createEnvelopeCrudService).toBeDefined();
    expect(typeof ServiceFactory.createEnvelopeCrudService).toBe('function');
  });

  it('should have createEnvelopeAccessService method', () => {
    expect(ServiceFactory.createEnvelopeAccessService).toBeDefined();
    expect(typeof ServiceFactory.createEnvelopeAccessService).toBe('function');
  });

  it('should have createEnvelopeStateService method', () => {
    expect(ServiceFactory.createEnvelopeStateService).toBeDefined();
    expect(typeof ServiceFactory.createEnvelopeStateService).toBe('function');
  });

  it('should have createEnvelopeDownloadService method', () => {
    expect(ServiceFactory.createEnvelopeDownloadService).toBeDefined();
    expect(typeof ServiceFactory.createEnvelopeDownloadService).toBe('function');
  });

  it('should have createEnvelopeSignerService method', () => {
    expect(ServiceFactory.createEnvelopeSignerService).toBeDefined();
    expect(typeof ServiceFactory.createEnvelopeSignerService).toBe('function');
  });

  it('should have createEnvelopeNotificationService method', () => {
    expect(ServiceFactory.createEnvelopeNotificationService).toBeDefined();
    expect(typeof ServiceFactory.createEnvelopeNotificationService).toBe('function');
  });

  it('should have createInvitationTokenService method', () => {
    expect(ServiceFactory.createInvitationTokenService).toBeDefined();
    expect(typeof ServiceFactory.createInvitationTokenService).toBe('function');
  });

  it('should have createConsentService method', () => {
    expect(ServiceFactory.createConsentService).toBeDefined();
    expect(typeof ServiceFactory.createConsentService).toBe('function');
  });

  describe('service creation methods', () => {
    it('should have createEnvelopeCrudService method with correct signature', () => {
      expect(ServiceFactory.createEnvelopeCrudService).toBeDefined();
      expect(typeof ServiceFactory.createEnvelopeCrudService).toBe('function');
      expect(ServiceFactory.createEnvelopeCrudService.length).toBe(2);
    });

    it('should have createEnvelopeAccessService method with correct signature', () => {
      expect(ServiceFactory.createEnvelopeAccessService).toBeDefined();
      expect(typeof ServiceFactory.createEnvelopeAccessService).toBe('function');
      expect(ServiceFactory.createEnvelopeAccessService.length).toBe(2);
    });

    it('should have createEnvelopeStateService method with correct signature', () => {
      expect(ServiceFactory.createEnvelopeStateService).toBeDefined();
      expect(typeof ServiceFactory.createEnvelopeStateService).toBe('function');
      expect(ServiceFactory.createEnvelopeStateService.length).toBe(2);
    });

    it('should have createEnvelopeDownloadService method with correct signature', () => {
      expect(ServiceFactory.createEnvelopeDownloadService).toBeDefined();
      expect(typeof ServiceFactory.createEnvelopeDownloadService).toBe('function');
      expect(ServiceFactory.createEnvelopeDownloadService.length).toBe(2);
    });

    it('should have createEnvelopeSignerService method with correct signature', () => {
      expect(ServiceFactory.createEnvelopeSignerService).toBeDefined();
      expect(typeof ServiceFactory.createEnvelopeSignerService).toBe('function');
      expect(ServiceFactory.createEnvelopeSignerService.length).toBe(2);
    });

    it('should have createEnvelopeNotificationService method with correct signature', () => {
      expect(ServiceFactory.createEnvelopeNotificationService).toBeDefined();
      expect(typeof ServiceFactory.createEnvelopeNotificationService).toBe('function');
      expect(ServiceFactory.createEnvelopeNotificationService.length).toBe(1);
    });

    it('should have createInvitationTokenService method with correct signature', () => {
      expect(ServiceFactory.createInvitationTokenService).toBeDefined();
      expect(typeof ServiceFactory.createInvitationTokenService).toBe('function');
      expect(ServiceFactory.createInvitationTokenService.length).toBe(2);
    });

    it('should have createConsentService method with correct signature', () => {
      expect(ServiceFactory.createConsentService).toBeDefined();
      expect(typeof ServiceFactory.createConsentService).toBe('function');
      expect(ServiceFactory.createConsentService.length).toBe(2);
    });
  });

  describe('ServiceFactory method execution', () => {
    it('should execute createEnvelopeCrudService with mock dependencies', () => {
      const mockRepositories = {
        signatureEnvelopeRepository: jest.fn(),
        envelopeSignerRepository: jest.fn(),
        invitationTokenRepository: jest.fn(),
        consentRepository: jest.fn(),
        signerReminderTrackingRepository: jest.fn()
      };

      const mockInfrastructure = {
        auditEventService: jest.fn(),
        envelopeNotificationService: jest.fn(),
        invitationTokenService: jest.fn(),
        consentService: jest.fn(),
        envelopeAccessService: jest.fn(),
        envelopeStateService: jest.fn(),
        envelopeDownloadService: jest.fn(),
        envelopeHashService: jest.fn(),
        s3Service: jest.fn(),
        kmsService: jest.fn()
      };

      const result = ServiceFactory.createEnvelopeCrudService(mockRepositories as any, mockInfrastructure as any);
      expect(result).toBeDefined();
    });

    it('should execute createEnvelopeSignerService with mock dependencies', () => {
      const mockRepositories = {
        envelopeSignerRepository: jest.fn(),
        signatureEnvelopeRepository: jest.fn()
      };

      const mockInfrastructure = {
        auditEventService: jest.fn()
      };

      const result = ServiceFactory.createEnvelopeSignerService(mockRepositories as any, mockInfrastructure as any);
      expect(result).toBeDefined();
    });

    it('should execute createInvitationTokenService with mock dependencies', () => {
      const mockRepositories = {
        invitationTokenRepository: jest.fn()
      };

      const mockInfrastructure = {
        auditEventService: jest.fn()
      };

      const result = ServiceFactory.createInvitationTokenService(mockRepositories as any, mockInfrastructure as any);
      expect(result).toBeDefined();
    });

    it('should execute createConsentService with mock dependencies', () => {
      const mockRepositories = {
        consentRepository: jest.fn(),
        envelopeSignerRepository: jest.fn()
      };

      const mockInfrastructure = {
        auditEventService: jest.fn()
      };

      const result = ServiceFactory.createConsentService(mockRepositories as any, mockInfrastructure as any);
      expect(result).toBeDefined();
    });
  });
});
