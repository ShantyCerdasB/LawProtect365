/**
 * @fileoverview PostConfirmationTrigger.test.ts - Unit tests for PostConfirmationTrigger
 * @summary Tests for PostConfirmation trigger handler
 * @description Tests the PostConfirmation trigger handler functionality including
 * event processing, error handling, and orchestration delegation.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PostConfirmationTrigger, handler } from '../../../src/triggers/PostConfirmationTrigger';
import { PostConfirmationOrchestrator } from '../../../src/application/triggers/PostConfirmationOrchestrator';
import { PostConfirmationEventBuilder } from '../../helpers/builders';
import { createMockCompositionRoot } from '../../helpers/mocks';
import { CompositionRoot } from '../../../src/infrastructure/factories/CompositionRoot';
import { OrchestratorFactory } from '../../../src/triggers/factories/OrchestratorFactory';

jest.mock('../../../src/infrastructure/factories/CompositionRoot');
jest.mock('../../../src/triggers/factories/OrchestratorFactory');

describe('PostConfirmationTrigger', () => {
  let trigger: PostConfirmationTrigger;
  let mockCompositionRoot: ReturnType<typeof createMockCompositionRoot>;
  let mockOrchestratorFactory: jest.Mocked<OrchestratorFactory>;
  let mockOrchestrator: jest.Mocked<PostConfirmationOrchestrator>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCompositionRoot = createMockCompositionRoot();
    mockOrchestrator = {
      processPostConfirmationWithData: jest.fn()
    } as unknown as jest.Mocked<PostConfirmationOrchestrator>;

    mockOrchestratorFactory = {
      createPostConfirmationOrchestrator: jest.fn(() => mockOrchestrator)
    } as unknown as jest.Mocked<OrchestratorFactory>;

    (CompositionRoot.build as jest.MockedFunction<typeof CompositionRoot.build>).mockResolvedValue(mockCompositionRoot);
    (OrchestratorFactory as unknown as jest.Mock).mockImplementation(() => mockOrchestratorFactory);

    trigger = new PostConfirmationTrigger();
  });

  describe('processOrchestration', () => {
    it('should delegate to PostConfirmationOrchestrator', async () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const expectedResult = event;
      mockOrchestrator.processPostConfirmationWithData.mockResolvedValue(expectedResult);

      const result = await trigger.handler(event);

      expect(mockOrchestratorFactory.createPostConfirmationOrchestrator).toHaveBeenCalled();
      expect(mockOrchestrator.processPostConfirmationWithData).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          cognitoSub: 'test-cognito-sub'
        })
      );
      expect(result).toBe(expectedResult);
    });

    it('should handle orchestrator errors', async () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const error = new Error('Orchestrator error');
      mockOrchestrator.processPostConfirmationWithData.mockRejectedValue(error);

      await expect(trigger.handler(event)).rejects.toThrow('Orchestrator error');
      expect(mockCompositionRoot.logger.error).toHaveBeenCalled();
    });
  });

  describe('getTriggerName', () => {
    it('should return correct trigger name', () => {
      expect(trigger['getTriggerName']()).toBe('PostConfirmation');
    });
  });

  describe('handler function', () => {
    it('should create trigger instance and process event', async () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const expectedResult = event;
      mockOrchestrator.processPostConfirmationWithData.mockResolvedValue(expectedResult);

      const result = await handler(event);

      expect(result).toBe(expectedResult);
    });
  });
});

