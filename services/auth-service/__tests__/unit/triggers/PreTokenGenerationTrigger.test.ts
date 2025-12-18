/**
 * @fileoverview PreTokenGenerationTrigger.test.ts - Unit tests for PreTokenGenerationTrigger
 * @summary Tests for PreTokenGeneration trigger handler
 * @description Tests the PreTokenGeneration trigger handler functionality including
 * event processing, error handling, and orchestration delegation.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PreTokenGenerationTrigger, handler } from '../../../src/triggers/PreTokenGenerationTrigger';
import { PreTokenGenerationOrchestrator } from '../../../src/application/triggers/PreTokenGenerationOrchestrator';
import { PreTokenGenEventBuilder } from '../../helpers/builders';
import { createMockCompositionRoot } from '../../helpers/mocks';
import { CompositionRoot } from '../../../src/infrastructure/factories/CompositionRoot';
import { OrchestratorFactory } from '../../../src/triggers/factories/OrchestratorFactory';

jest.mock('../../../src/infrastructure/factories/CompositionRoot');
jest.mock('../../../src/triggers/factories/OrchestratorFactory');

describe('PreTokenGenerationTrigger', () => {
  let trigger: PreTokenGenerationTrigger;
  let mockCompositionRoot: ReturnType<typeof createMockCompositionRoot>;
  let mockOrchestratorFactory: jest.Mocked<OrchestratorFactory>;
  let mockOrchestrator: jest.Mocked<PreTokenGenerationOrchestrator>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCompositionRoot = createMockCompositionRoot();
    mockOrchestrator = {
      processPreTokenGenerationWithData: jest.fn()
    } as unknown as jest.Mocked<PreTokenGenerationOrchestrator>;

    mockOrchestratorFactory = {
      createPreTokenGenerationOrchestrator: jest.fn(() => mockOrchestrator)
    } as unknown as jest.Mocked<OrchestratorFactory>;

    (CompositionRoot.build as jest.MockedFunction<typeof CompositionRoot.build>).mockResolvedValue(mockCompositionRoot);
    (OrchestratorFactory as unknown as jest.Mock).mockImplementation(() => mockOrchestratorFactory);

    trigger = new PreTokenGenerationTrigger();
  });

  describe('processOrchestration', () => {
    it('should delegate to PreTokenGenerationOrchestrator', async () => {
      const event = new PreTokenGenEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const expectedResult = event;
      mockOrchestrator.processPreTokenGenerationWithData.mockResolvedValue(expectedResult);

      const result = await trigger.handler(event);

      expect(mockOrchestratorFactory.createPreTokenGenerationOrchestrator).toHaveBeenCalled();
      expect(mockOrchestrator.processPreTokenGenerationWithData).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          cognitoSub: 'test-cognito-sub'
        })
      );
      expect(result).toBe(expectedResult);
    });

    it('should handle orchestrator errors', async () => {
      const event = new PreTokenGenEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const error = new Error('Orchestrator error');
      mockOrchestrator.processPreTokenGenerationWithData.mockRejectedValue(error);

      await expect(trigger.handler(event)).rejects.toThrow('Orchestrator error');
      expect(mockCompositionRoot.logger.error).toHaveBeenCalled();
    });
  });

  describe('getTriggerName', () => {
    it('should return correct trigger name', () => {
      expect(trigger['getTriggerName']()).toBe('PreTokenGeneration');
    });
  });

  describe('handler function', () => {
    it('should create trigger instance and process event', async () => {
      const event = new PreTokenGenEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const expectedResult = event;
      mockOrchestrator.processPreTokenGenerationWithData.mockResolvedValue(expectedResult);

      const result = await handler(event);

      expect(result).toBe(expectedResult);
    });
  });
});

