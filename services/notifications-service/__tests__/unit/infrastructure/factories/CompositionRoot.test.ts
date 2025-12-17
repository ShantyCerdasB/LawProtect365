/**
 * @fileoverview CompositionRoot Tests - Unit tests for CompositionRoot
 * @summary Tests for dependency injection and object graph assembly
 * @description Comprehensive test suite for CompositionRoot covering
 * complete object graph assembly and dependency wiring.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CompositionRoot } from '../../../../src/infrastructure/factories/CompositionRoot';
import { RepositoryFactory } from '../../../../src/infrastructure/factories/repositories/RepositoryFactory';
import { InfrastructureFactory } from '../../../../src/infrastructure/factories/infrastructure/InfrastructureFactory';
import { ServiceFactory } from '../../../../src/infrastructure/factories/services/ServiceFactory';
import { UseCaseFactory } from '../../../../src/infrastructure/factories/use-cases/UseCaseFactory';
import { StrategyFactory } from '../../../../src/infrastructure/factories/strategies/StrategyFactory';
import { TranslationService } from '../../../../src/services/i18n/TranslationService';
import { EmailTemplateService } from '../../../../src/services/template/EmailTemplateService';
import { NotificationDeliveryService } from '../../../../src/services/domain/NotificationDeliveryService';
import { NotificationTemplateService } from '../../../../src/services/domain/NotificationTemplateService';
import { NotificationOrchestrator } from '../../../../src/services/orchestrators/NotificationOrchestrator';
import { NotificationEventProcessor } from '../../../../src/services/orchestrators/processors/NotificationEventProcessor';

jest.mock('../../../../src/infrastructure/factories/repositories/RepositoryFactory');
jest.mock('../../../../src/infrastructure/factories/infrastructure/InfrastructureFactory');
jest.mock('../../../../src/infrastructure/factories/services/ServiceFactory');
jest.mock('../../../../src/infrastructure/factories/use-cases/UseCaseFactory');
jest.mock('../../../../src/infrastructure/factories/strategies/StrategyFactory');
jest.mock('../../../../src/services/i18n/TranslationService');
jest.mock('../../../../src/services/template/EmailTemplateService');
jest.mock('../../../../src/services/domain/NotificationDeliveryService');
jest.mock('../../../../src/services/domain/NotificationTemplateService');
jest.mock('../../../../src/services/orchestrators/NotificationOrchestrator');
jest.mock('../../../../src/services/orchestrators/processors/NotificationEventProcessor');
jest.mock('../../../../src/config/AppConfig', () => ({
  loadConfig: jest.fn(() => ({
    email: { region: 'us-east-1' },
    sms: { region: 'us-east-1' },
    push: { fcm: {}, apns: {} },
  })),
}));
jest.mock('@lawprotect/shared-ts', () => {
  const actual = jest.requireActual('@lawprotect/shared-ts') as typeof import('@lawprotect/shared-ts');
  return {
    ...actual,
    createLogger: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      child: jest.fn(),
    })),
  };
});

describe('CompositionRoot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('build', () => {
    it('creates complete object graph', async () => {
      const mockRepository = { notificationRepository: {} as any };
      const mockInfrastructure = { sesClient: {}, pinpointClient: {}, fcmClient: undefined, apnsClient: undefined } as any;
      const mockServices = { emailService: {}, smsService: {}, pushNotificationService: {} } as any;
      const mockUseCases = {
        processNotificationUseCase: {},
        sendNotificationUseCase: {},
        retryNotificationUseCase: {},
      } as any;
      const mockStrategyRegistry = {} as any;

      (RepositoryFactory.createAllAsync as jest.MockedFunction<typeof RepositoryFactory.createAllAsync>).mockResolvedValue(mockRepository);
      (InfrastructureFactory.createAll as jest.MockedFunction<typeof InfrastructureFactory.createAll>).mockReturnValue(mockInfrastructure);
      (ServiceFactory.createAll as jest.MockedFunction<typeof ServiceFactory.createAll>).mockReturnValue(mockServices);
      (StrategyFactory.createRegistry as jest.MockedFunction<typeof StrategyFactory.createRegistry>).mockReturnValue(mockStrategyRegistry);
      (UseCaseFactory.createAll as jest.MockedFunction<typeof UseCaseFactory.createAll>).mockReturnValue(mockUseCases);

      const compositionRoot = await CompositionRoot.build();

      expect(compositionRoot).toBeInstanceOf(CompositionRoot);
      expect(compositionRoot.notificationOrchestrator).toBeInstanceOf(NotificationOrchestrator);
      expect(compositionRoot.config).toBeDefined();
      expect(compositionRoot.logger).toBeDefined();
      expect(RepositoryFactory.createAllAsync).toHaveBeenCalled();
      expect(InfrastructureFactory.createAll).toHaveBeenCalled();
      expect(ServiceFactory.createAll).toHaveBeenCalledWith(mockInfrastructure);
      expect(StrategyFactory.createRegistry).toHaveBeenCalled();
      expect(UseCaseFactory.createAll).toHaveBeenCalled();
    });

    it('wires all dependencies correctly', async () => {
      const mockRepository = { notificationRepository: {} as any };
      const mockInfrastructure = { sesClient: {}, pinpointClient: {}, fcmClient: undefined, apnsClient: undefined } as any;
      const mockServices = { emailService: {}, smsService: {}, pushNotificationService: {} } as any;
      const mockUseCases = {
        processNotificationUseCase: {},
        sendNotificationUseCase: {},
        retryNotificationUseCase: {},
      } as any;

      (RepositoryFactory.createAllAsync as jest.MockedFunction<typeof RepositoryFactory.createAllAsync>).mockResolvedValue(mockRepository);
      (InfrastructureFactory.createAll as jest.MockedFunction<typeof InfrastructureFactory.createAll>).mockReturnValue(mockInfrastructure);
      (ServiceFactory.createAll as jest.MockedFunction<typeof ServiceFactory.createAll>).mockReturnValue(mockServices);
      (StrategyFactory.createRegistry as jest.MockedFunction<typeof StrategyFactory.createRegistry>).mockReturnValue({} as any);
      (UseCaseFactory.createAll as jest.MockedFunction<typeof UseCaseFactory.createAll>).mockReturnValue(mockUseCases);

      await CompositionRoot.build();

      expect(UseCaseFactory.createAll).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationRepository: mockRepository.notificationRepository,
          deliveryService: expect.any(NotificationDeliveryService),
          templateService: expect.any(NotificationTemplateService),
          eventProcessor: expect.any(NotificationEventProcessor),
          logger: expect.anything(),
        })
      );
    });
  });
});

