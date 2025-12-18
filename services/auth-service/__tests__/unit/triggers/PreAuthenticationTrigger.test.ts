/**
 * @fileoverview PreAuthenticationTrigger.test.ts - Unit tests for PreAuthenticationTrigger
 * @summary Tests for PreAuthentication trigger handler
 * @description Tests the PreAuthentication trigger handler functionality including
 * event processing, error handling, and orchestration delegation.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PreAuthenticationTrigger, handler } from '../../../src/triggers/PreAuthenticationTrigger';
import { PreAuthenticationOrchestrator } from '../../../src/application/triggers/PreAuthenticationOrchestrator';
import { PreAuthEventBuilder } from '../../helpers/builders';
import { createMockCompositionRoot } from '../../helpers/mocks';
import { CompositionRoot } from '../../../src/infrastructure/factories/CompositionRoot';
import { OrchestratorFactory } from '../../../src/triggers/factories/OrchestratorFactory';

jest.mock('../../../src/infrastructure/factories/CompositionRoot');
jest.mock('../../../src/triggers/factories/OrchestratorFactory');

describe('PreAuthenticationTrigger', () => {
  let trigger: PreAuthenticationTrigger;
  let mockCompositionRoot: ReturnType<typeof createMockCompositionRoot>;
  let mockOrchestratorFactory: jest.Mocked<OrchestratorFactory>;
  let mockOrchestrator: jest.Mocked<PreAuthenticationOrchestrator>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCompositionRoot = createMockCompositionRoot();
    mockOrchestrator = {
      processPreAuthenticationWithData: jest.fn()
    } as unknown as jest.Mocked<PreAuthenticationOrchestrator>;

    mockOrchestratorFactory = {
      createPreAuthenticationOrchestrator: jest.fn(() => mockOrchestrator)
    } as unknown as jest.Mocked<OrchestratorFactory>;

    (CompositionRoot.build as jest.MockedFunction<typeof CompositionRoot.build>).mockResolvedValue(mockCompositionRoot);
    (OrchestratorFactory as unknown as jest.Mock).mockImplementation(() => mockOrchestratorFactory);

    trigger = new PreAuthenticationTrigger();
  });

  describe('processOrchestration', () => {
    it('should delegate to PreAuthenticationOrchestrator', async () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const expectedResult = event;
      mockOrchestrator.processPreAuthenticationWithData.mockResolvedValue(expectedResult);

      const result = await trigger.handler(event);

      expect(mockOrchestratorFactory.createPreAuthenticationOrchestrator).toHaveBeenCalled();
      expect(mockOrchestrator.processPreAuthenticationWithData).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          cognitoSub: 'test-cognito-sub'
        })
      );
      expect(result).toBe(expectedResult);
    });

    it('should handle orchestrator errors', async () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const error = new Error('Orchestrator error');
      mockOrchestrator.processPreAuthenticationWithData.mockRejectedValue(error);

      await expect(trigger.handler(event)).rejects.toThrow('Orchestrator error');
      expect(mockCompositionRoot.logger.error).toHaveBeenCalled();
    });
  });

  describe('getTriggerName', () => {
    it('should return correct trigger name', () => {
      expect(trigger['getTriggerName']()).toBe('PreAuthentication');
    });
  });

  describe('handler function', () => {
    it('should create trigger instance and process event', async () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const expectedResult = event;
      mockOrchestrator.processPreAuthenticationWithData.mockResolvedValue(expectedResult);

      const result = await handler(event);

      expect(result).toBe(expectedResult);
    });
  });
});

