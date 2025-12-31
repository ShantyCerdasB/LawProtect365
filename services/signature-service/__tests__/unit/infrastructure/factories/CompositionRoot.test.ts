/**
 * @fileoverview CompositionRoot Tests - Unit tests for CompositionRoot
 * @summary Tests for the main composition root that assembles the complete object graph
 * @description Comprehensive unit tests for CompositionRoot class that verifies proper
 * dependency injection and object graph assembly following the Composition Root pattern.
 */

import { CompositionRoot } from '../../../../src/infrastructure/factories/CompositionRoot';

// Mock all dependencies to avoid configuration loading
jest.mock('../../../../src/infrastructure/factories/repositories/RepositoryFactory', () => ({
  RepositoryFactory: {
    createAll: jest.fn(() => ({
      signatureEnvelopeRepository: jest.fn(),
      envelopeSignerRepository: jest.fn(),
      invitationTokenRepository: jest.fn(),
      consentRepository: jest.fn(),
      signerReminderTrackingRepository: jest.fn(),
    })),
    createAllAsync: jest.fn(() => Promise.resolve({
      signatureEnvelopeRepository: jest.fn(),
      envelopeSignerRepository: jest.fn(),
      invitationTokenRepository: jest.fn(),
      consentRepository: jest.fn(),
      signerReminderTrackingRepository: jest.fn(),
    }))
  }
}));

jest.mock('../../../../src/infrastructure/factories/infrastructure/InfrastructureFactory', () => ({
  InfrastructureFactory: {
    createAll: jest.fn(() => ({
      auditEventService: jest.fn(),
      s3Service: jest.fn(),
      kmsService: jest.fn(),
      envelopeNotificationService: jest.fn(),
      invitationTokenService: jest.fn(),
    }))
  }
}));

jest.mock('../../../../src/infrastructure/factories/services/ServiceFactory', () => ({
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
      pdfDigitalSignatureEmbedder: jest.fn(),
      documentServicePort: jest.fn(),
      userPersonalInfoRepository: jest.fn(),
    }))
  }
}));

jest.mock('../../../../src/infrastructure/factories/use-cases/UseCaseFactory', () => ({
  UseCaseFactory: {
    createAll: jest.fn(() => ({
      createEnvelopeUseCase: jest.fn(),
      getEnvelopeUseCase: jest.fn(),
      updateEnvelopeUseCase: jest.fn(),
      signDocumentUseCase: jest.fn(),
      downloadDocumentUseCase: jest.fn(),
      declineSignerUseCase: jest.fn(),
    }))
  }
}));

jest.mock('../../../../src/services/orchestrators/SignatureOrchestrator', () => ({
  SignatureOrchestrator: jest.fn().mockImplementation((deps) => ({
    deps,
    createEnvelope: jest.fn(),
    getEnvelope: jest.fn(),
    updateEnvelope: jest.fn(),
    signDocument: jest.fn(),
    downloadDocument: jest.fn(),
    declineSigner: jest.fn(),
  }))
}));

describe('CompositionRoot', () => {
  it('should be importable', () => {
    expect(CompositionRoot).toBeDefined();
  });

  it('should have createSignatureOrchestrator method', () => {
    expect(CompositionRoot.createSignatureOrchestrator).toBeDefined();
    expect(typeof CompositionRoot.createSignatureOrchestrator).toBe('function');
  });

  describe('createSignatureOrchestrator', () => {
    it('should create SignatureOrchestrator with all dependencies', () => {
      const { RepositoryFactory } = require('../../../../src/infrastructure/factories/repositories/RepositoryFactory');
      const { InfrastructureFactory } = require('../../../../src/infrastructure/factories/infrastructure/InfrastructureFactory');
      const { ServiceFactory } = require('../../../../src/infrastructure/factories/services/ServiceFactory');
      const { UseCaseFactory } = require('../../../../src/infrastructure/factories/use-cases/UseCaseFactory');
      const { SignatureOrchestrator } = require('../../../../src/services/orchestrators/SignatureOrchestrator');

      const result = CompositionRoot.createSignatureOrchestrator();

      expect(result).toBeDefined();
      expect(SignatureOrchestrator).toHaveBeenCalledWith({
        services: expect.objectContaining({
          envelopeCrudService: expect.any(Function),
          envelopeAccessService: expect.any(Function),
          envelopeStateService: expect.any(Function),
          envelopeDownloadService: expect.any(Function),
          envelopeSignerService: expect.any(Function),
          envelopeNotificationService: expect.any(Function),
          invitationTokenService: expect.any(Function),
          consentService: expect.any(Function),
          auditEventService: expect.any(Function),
          s3Service: expect.any(Function),
          kmsService: expect.any(Function),
        }),
        useCases: expect.objectContaining({
          createEnvelopeUseCase: expect.any(Function),
          getEnvelopeUseCase: expect.any(Function),
          updateEnvelopeUseCase: expect.any(Function),
          signDocumentUseCase: expect.any(Function),
          downloadDocumentUseCase: expect.any(Function),
          declineSignerUseCase: expect.any(Function),
        }),
      });

      expect(RepositoryFactory.createAll).toHaveBeenCalled();
      expect(InfrastructureFactory.createAll).toHaveBeenCalled();
      expect(ServiceFactory.createAll).toHaveBeenCalled();
      expect(UseCaseFactory.createAll).toHaveBeenCalled();
    });

    it('should properly wire all dependencies in correct order', () => {
      const { RepositoryFactory } = require('../../../../src/infrastructure/factories/repositories/RepositoryFactory');
      const { InfrastructureFactory } = require('../../../../src/infrastructure/factories/infrastructure/InfrastructureFactory');
      const { ServiceFactory } = require('../../../../src/infrastructure/factories/services/ServiceFactory');
      const { UseCaseFactory } = require('../../../../src/infrastructure/factories/use-cases/UseCaseFactory');

      CompositionRoot.createSignatureOrchestrator();

      expect(RepositoryFactory.createAll).toHaveBeenCalledTimes(1);
      expect(InfrastructureFactory.createAll).toHaveBeenCalledTimes(1);
      expect(ServiceFactory.createAll).toHaveBeenCalledTimes(1);
      expect(UseCaseFactory.createAll).toHaveBeenCalledTimes(1);
    });

    it('should pass repositories and infrastructure to ServiceFactory', () => {
      const { RepositoryFactory } = require('../../../../src/infrastructure/factories/repositories/RepositoryFactory');
      const { InfrastructureFactory } = require('../../../../src/infrastructure/factories/infrastructure/InfrastructureFactory');
      const { ServiceFactory } = require('../../../../src/infrastructure/factories/services/ServiceFactory');

      const mockRepositories = { test: 'repository' };
      const mockInfrastructure = { test: 'infrastructure' };

      RepositoryFactory.createAll.mockReturnValue(mockRepositories);
      InfrastructureFactory.createAll.mockReturnValue(mockInfrastructure);

      CompositionRoot.createSignatureOrchestrator();

      expect(ServiceFactory.createAll).toHaveBeenCalledWith(mockRepositories, mockInfrastructure);
    });

    it('should pass combined services to UseCaseFactory', () => {
      const { ServiceFactory } = require('../../../../src/infrastructure/factories/services/ServiceFactory');
      const { InfrastructureFactory } = require('../../../../src/infrastructure/factories/infrastructure/InfrastructureFactory');
      const { UseCaseFactory } = require('../../../../src/infrastructure/factories/use-cases/UseCaseFactory');

      const mockDomainServices = { envelopeCrudService: jest.fn() };
      const mockInfrastructure = { 
        auditEventService: jest.fn(),
        s3Service: jest.fn(),
        kmsService: jest.fn()
      };

      ServiceFactory.createAll.mockReturnValue(mockDomainServices);
      InfrastructureFactory.createAll.mockReturnValue(mockInfrastructure);

      CompositionRoot.createSignatureOrchestrator();

      expect(UseCaseFactory.createAll).toHaveBeenCalledWith({
        ...mockDomainServices,
        auditEventService: mockInfrastructure.auditEventService,
        s3Service: mockInfrastructure.s3Service,
        kmsService: mockInfrastructure.kmsService,
      });
    });

    it('should create orchestrator with correct configuration structure', () => {
      const { SignatureOrchestrator } = require('../../../../src/services/orchestrators/SignatureOrchestrator');

      const result = CompositionRoot.createSignatureOrchestrator();

      expect(SignatureOrchestrator).toHaveBeenCalledWith({
        services: expect.objectContaining({
          auditEventService: expect.any(Function),
          envelopeCrudService: expect.any(Function),
          kmsService: expect.any(Function),
          s3Service: expect.any(Function),
        }),
        useCases: expect.objectContaining({
          createEnvelopeUseCase: expect.any(Function),
          getEnvelopeUseCase: expect.any(Function),
          updateEnvelopeUseCase: expect.any(Function),
          signDocumentUseCase: expect.any(Function),
          downloadDocumentUseCase: expect.any(Function),
          declineSignerUseCase: expect.any(Function),
        }),
      });

      expect(result).toBeDefined();
      expect(typeof result.createEnvelope).toBe('function');
      expect(typeof result.getEnvelope).toBe('function');
    });

    it('should return a valid SignatureOrchestrator instance', () => {
      const result = CompositionRoot.createSignatureOrchestrator();

      expect(result).toBeDefined();
      expect(typeof result.createEnvelope).toBe('function');
      expect(typeof result.getEnvelope).toBe('function');
    });
  });

  describe('createSignatureOrchestratorAsync', () => {
    it('should have createSignatureOrchestratorAsync method', () => {
      expect(CompositionRoot.createSignatureOrchestratorAsync).toBeDefined();
      expect(typeof CompositionRoot.createSignatureOrchestratorAsync).toBe('function');
    });

    it('should create SignatureOrchestrator with all dependencies asynchronously', async () => {
      const { RepositoryFactory } = require('../../../../src/infrastructure/factories/repositories/RepositoryFactory');
      const { InfrastructureFactory } = require('../../../../src/infrastructure/factories/infrastructure/InfrastructureFactory');
      const { ServiceFactory } = require('../../../../src/infrastructure/factories/services/ServiceFactory');
      const { UseCaseFactory } = require('../../../../src/infrastructure/factories/use-cases/UseCaseFactory');
      const { SignatureOrchestrator } = require('../../../../src/services/orchestrators/SignatureOrchestrator');

      const result = await CompositionRoot.createSignatureOrchestratorAsync();

      expect(result).toBeDefined();
      expect(SignatureOrchestrator).toHaveBeenCalledWith({
        services: expect.objectContaining({
          auditEventService: expect.anything(),
          s3Service: expect.anything(),
          kmsService: expect.anything(),
        }),
        useCases: expect.objectContaining({
          createEnvelopeUseCase: expect.anything(),
        }),
      });

      expect(RepositoryFactory.createAllAsync).toHaveBeenCalled();
      expect(InfrastructureFactory.createAll).toHaveBeenCalled();
      expect(ServiceFactory.createAll).toHaveBeenCalled();
      expect(UseCaseFactory.createAll).toHaveBeenCalled();
    });

    it('should use createAllAsync instead of createAll for repositories', async () => {
      const { RepositoryFactory } = require('../../../../src/infrastructure/factories/repositories/RepositoryFactory');

      await CompositionRoot.createSignatureOrchestratorAsync();

      expect(RepositoryFactory.createAllAsync).toHaveBeenCalledTimes(1);
      expect(RepositoryFactory.createAll).not.toHaveBeenCalled();
    });

    it('should return a valid SignatureOrchestrator instance', async () => {
      const result = await CompositionRoot.createSignatureOrchestratorAsync();

      expect(result).toBeDefined();
      expect(typeof result.createEnvelope).toBe('function');
      expect(typeof result.getEnvelope).toBe('function');
    });
  });
});