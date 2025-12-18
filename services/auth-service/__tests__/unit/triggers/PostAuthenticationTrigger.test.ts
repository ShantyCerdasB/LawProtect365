/**
 * @fileoverview PostAuthenticationTrigger.test.ts - Unit tests for PostAuthenticationTrigger
 * @summary Tests for PostAuthentication trigger handler
 * @description Tests the PostAuthentication trigger handler functionality including
 * event processing, error handling, and orchestration delegation.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PostAuthenticationTrigger, handler } from '../../../src/triggers/PostAuthenticationTrigger';
import { PostAuthenticationOrchestrator } from '../../../src/application/triggers/PostAuthenticationOrchestrator';
import { PostAuthEventBuilder } from '../../helpers/builders';
import { createMockCompositionRoot } from '../../helpers/mocks';
import { CompositionRoot } from '../../../src/infrastructure/factories/CompositionRoot';
import { OrchestratorFactory } from '../../../src/triggers/factories/OrchestratorFactory';

jest.mock('../../../src/infrastructure/factories/CompositionRoot');
jest.mock('../../../src/triggers/factories/OrchestratorFactory');

describe('PostAuthenticationTrigger', () => {
  let trigger: PostAuthenticationTrigger;
  let mockCompositionRoot: ReturnType<typeof createMockCompositionRoot>;
  let mockOrchestratorFactory: jest.Mocked<OrchestratorFactory>;
  let mockOrchestrator: jest.Mocked<PostAuthenticationOrchestrator>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCompositionRoot = createMockCompositionRoot();
    mockOrchestrator = {
      processPostAuthenticationWithData: jest.fn()
    } as unknown as jest.Mocked<PostAuthenticationOrchestrator>;

    mockOrchestratorFactory = {
      createPostAuthenticationOrchestrator: jest.fn(() => mockOrchestrator)
    } as unknown as jest.Mocked<OrchestratorFactory>;

    (CompositionRoot.build as jest.MockedFunction<typeof CompositionRoot.build>).mockResolvedValue(mockCompositionRoot);
    (OrchestratorFactory as unknown as jest.Mock).mockImplementation(() => mockOrchestratorFactory);

    trigger = new PostAuthenticationTrigger();
  });

  describe('processOrchestration', () => {
    it('should delegate to PostAuthenticationOrchestrator', async () => {
      const event = new PostAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const expectedResult = event;
      mockOrchestrator.processPostAuthenticationWithData.mockResolvedValue(expectedResult);

      const result = await trigger.handler(event);

      expect(mockOrchestratorFactory.createPostAuthenticationOrchestrator).toHaveBeenCalled();
      expect(mockOrchestrator.processPostAuthenticationWithData).toHaveBeenCalledWith(
        event,
        expect.objectContaining({
          cognitoSub: 'test-cognito-sub'
        })
      );
      expect(result).toBe(expectedResult);
    });

    it('should handle orchestrator errors', async () => {
      const event = new PostAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const error = new Error('Orchestrator error');
      mockOrchestrator.processPostAuthenticationWithData.mockRejectedValue(error);

      await expect(trigger.handler(event)).rejects.toThrow('Orchestrator error');
      expect(mockCompositionRoot.logger.error).toHaveBeenCalled();
    });
  });

  describe('getTriggerName', () => {
    it('should return correct trigger name', () => {
      expect(trigger['getTriggerName']()).toBe('PostAuthentication');
    });
  });

  describe('handler function', () => {
    it('should create trigger instance and process event', async () => {
      const event = new PostAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const expectedResult = event;
      mockOrchestrator.processPostAuthenticationWithData.mockResolvedValue(expectedResult);

      const result = await handler(event);

      expect(result).toBe(expectedResult);
    });
  });
});

