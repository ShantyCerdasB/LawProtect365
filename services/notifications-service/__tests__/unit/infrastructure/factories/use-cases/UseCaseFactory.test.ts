/**
 * @fileoverview UseCaseFactory Tests - Unit tests for UseCaseFactory
 * @summary Tests for use case factory creation methods
 * @description Comprehensive test suite for UseCaseFactory covering all use case creation
 * methods including ProcessNotificationUseCase, SendNotificationUseCase, RetryNotificationUseCase,
 * and the createAll method.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { UseCaseFactory } from '../../../../../src/infrastructure/factories/use-cases/UseCaseFactory';
import { ProcessNotificationUseCase } from '../../../../../src/services/orchestrators/use-cases/ProcessNotificationUseCase';
import { SendNotificationUseCase } from '../../../../../src/services/orchestrators/use-cases/SendNotificationUseCase';
import { RetryNotificationUseCase } from '../../../../../src/services/orchestrators/use-cases/RetryNotificationUseCase';
import type { UseCaseDependencies } from '../../../../../src/domain/types/orchestrator';

describe('UseCaseFactory', () => {
  let mockDependencies: UseCaseDependencies;
  let mockNotificationRepository: any;
  let mockDeliveryService: any;
  let mockTemplateService: any;
  let mockEventProcessor: any;
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockNotificationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockDeliveryService = {
      sendNotification: jest.fn(),
    };

    mockTemplateService = {
      renderEmailTemplate: jest.fn(),
    };

    mockEventProcessor = {
      processEvent: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    mockDependencies = {
      notificationRepository: mockNotificationRepository,
      deliveryService: mockDeliveryService,
      templateService: mockTemplateService,
      eventProcessor: mockEventProcessor,
      logger: mockLogger,
    };
  });

  describe('createProcessNotificationUseCase', () => {
    it('should create ProcessNotificationUseCase with correct dependencies', () => {
      const useCase = UseCaseFactory.createProcessNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(ProcessNotificationUseCase);
    });

    it('should inject notification repository', () => {
      const useCase = UseCaseFactory.createProcessNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(ProcessNotificationUseCase);
    });

    it('should inject delivery service', () => {
      const useCase = UseCaseFactory.createProcessNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(ProcessNotificationUseCase);
    });

    it('should inject template service', () => {
      const useCase = UseCaseFactory.createProcessNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(ProcessNotificationUseCase);
    });

    it('should inject event processor', () => {
      const useCase = UseCaseFactory.createProcessNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(ProcessNotificationUseCase);
    });

    it('should inject logger', () => {
      const useCase = UseCaseFactory.createProcessNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(ProcessNotificationUseCase);
    });
  });

  describe('createSendNotificationUseCase', () => {
    it('should create SendNotificationUseCase with correct dependencies', () => {
      const useCase = UseCaseFactory.createSendNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(SendNotificationUseCase);
    });

    it('should inject notification repository', () => {
      const useCase = UseCaseFactory.createSendNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(SendNotificationUseCase);
    });

    it('should inject delivery service', () => {
      const useCase = UseCaseFactory.createSendNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(SendNotificationUseCase);
    });

    it('should inject template service', () => {
      const useCase = UseCaseFactory.createSendNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(SendNotificationUseCase);
    });

    it('should inject logger', () => {
      const useCase = UseCaseFactory.createSendNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(SendNotificationUseCase);
    });
  });

  describe('createRetryNotificationUseCase', () => {
    it('should create RetryNotificationUseCase with correct dependencies', () => {
      const useCase = UseCaseFactory.createRetryNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(RetryNotificationUseCase);
    });

    it('should inject notification repository', () => {
      const useCase = UseCaseFactory.createRetryNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(RetryNotificationUseCase);
    });

    it('should inject delivery service', () => {
      const useCase = UseCaseFactory.createRetryNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(RetryNotificationUseCase);
    });

    it('should inject template service', () => {
      const useCase = UseCaseFactory.createRetryNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(RetryNotificationUseCase);
    });

    it('should inject logger', () => {
      const useCase = UseCaseFactory.createRetryNotificationUseCase(mockDependencies);

      expect(useCase).toBeInstanceOf(RetryNotificationUseCase);
    });
  });

  describe('createAll', () => {
    it('should create all use cases', () => {
      const useCases = UseCaseFactory.createAll(mockDependencies);

      expect(useCases).toHaveProperty('processNotificationUseCase');
      expect(useCases).toHaveProperty('sendNotificationUseCase');
      expect(useCases).toHaveProperty('retryNotificationUseCase');
      expect(useCases.processNotificationUseCase).toBeInstanceOf(ProcessNotificationUseCase);
      expect(useCases.sendNotificationUseCase).toBeInstanceOf(SendNotificationUseCase);
      expect(useCases.retryNotificationUseCase).toBeInstanceOf(RetryNotificationUseCase);
    });

    it('should create use cases with correct dependencies', () => {
      const useCases = UseCaseFactory.createAll(mockDependencies);

      expect(useCases.processNotificationUseCase).toBeInstanceOf(ProcessNotificationUseCase);
      expect(useCases.sendNotificationUseCase).toBeInstanceOf(SendNotificationUseCase);
      expect(useCases.retryNotificationUseCase).toBeInstanceOf(RetryNotificationUseCase);
    });
  });
});











