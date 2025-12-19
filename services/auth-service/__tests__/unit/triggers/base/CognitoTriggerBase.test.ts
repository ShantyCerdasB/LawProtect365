/**
 * @fileoverview CognitoTriggerBase Tests - Tests for base trigger class
 * @summary Tests event mapping and type guards
 * @description Tests the base CognitoTriggerBase class including event type detection
 * and mapping functionality.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CognitoTriggerBase } from '../../../../src/triggers/base/CognitoTriggerBase';
import { PostAuthEventBuilder, PostConfirmationEventBuilder, PreAuthEventBuilder, PreTokenGenEventBuilder } from '../../../helpers/builders';
import { CompositionRoot } from '../../../../src/infrastructure/factories/CompositionRoot';
import { OrchestratorFactory } from '../../../../src/triggers/factories/OrchestratorFactory';
import { createMockCompositionRoot } from '../../../helpers/mocks';

class TestTrigger extends CognitoTriggerBase<any, any> {
  async processOrchestration(_event: any, _eventData: any): Promise<any> {
    return {};
  }

  getTriggerName(): string {
    return 'TestTrigger';
  }
}

jest.mock('../../../../src/infrastructure/factories/CompositionRoot');
jest.mock('../../../../src/triggers/factories/OrchestratorFactory');

describe('CognitoTriggerBase', () => {
  let trigger: TestTrigger;
  let mockCompositionRoot: ReturnType<typeof createMockCompositionRoot>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCompositionRoot = createMockCompositionRoot();
    (CompositionRoot.build as jest.MockedFunction<typeof CompositionRoot.build>).mockResolvedValue(mockCompositionRoot);
    (OrchestratorFactory as unknown as jest.Mock).mockImplementation(() => ({}));
    trigger = new TestTrigger();
  });

  describe('mapEvent', () => {
    it('maps PostAuthEvent correctly', () => {
      const event = new PostAuthEventBuilder()
        .withUserName('test-sub')
        .build();
      
      const result = (trigger as any).mapEvent(event);
      expect(result).toBeDefined();
      expect(result.cognitoSub).toBe('test-sub');
    });

    it('maps PostConfirmationEvent correctly', () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-sub')
        .build();
      
      const result = (trigger as any).mapEvent(event);
      expect(result).toBeDefined();
    });

    it('maps PreAuthEvent correctly', () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-sub')
        .build();
      
      const result = (trigger as any).mapEvent(event);
      expect(result).toBeDefined();
    });

    it('maps PreTokenGenEvent correctly', () => {
      const event = new PreTokenGenEventBuilder()
        .withUserName('test-sub')
        .build();
      
      const result = (trigger as any).mapEvent(event);
      expect(result).toBeDefined();
    });

    it('throws error for unknown event type', () => {
      const unknownEvent = { unknown: 'event' };
      expect(() => (trigger as any).mapEvent(unknownEvent)).toThrow('Unknown event type');
    });
  });

  describe('type guards', () => {
    it('detects PostAuthEvent correctly', () => {
      const event = new PostAuthEventBuilder().build();
      const isPostAuth = (trigger as any).isPostAuthEvent(event);
      expect(isPostAuth).toBe(true);
    });

    it('detects PostConfirmationEvent correctly', () => {
      const event = new PostConfirmationEventBuilder().build();
      const isPostConf = (trigger as any).isPostConfirmationEvent(event);
      expect(isPostConf).toBe(true);
    });

    it('detects PreTokenGenEvent correctly', () => {
      const event = new PreTokenGenEventBuilder().build();
      const isPreToken = (trigger as any).isPreTokenGenEvent(event);
      expect(isPreToken).toBe(true);
    });

    it('detects PreAuthEvent correctly', () => {
      const event = new PreAuthEventBuilder().build();
      const isPreAuth = (trigger as any).isPreAuthEvent(event);
      expect(isPreAuth).toBe(true);
    });

    it('returns false for non-PostAuthEvent', () => {
      const event = { unknown: 'event' };
      const isPostAuth = (trigger as any).isPostAuthEvent(event);
      expect(isPostAuth).toBe(false);
    });

    it('returns false for non-PostConfirmationEvent', () => {
      const event = { unknown: 'event' };
      const isPostConf = (trigger as any).isPostConfirmationEvent(event);
      expect(isPostConf).toBe(false);
    });

    it('returns false for non-PreTokenGenEvent', () => {
      const event = { unknown: 'event' };
      const isPreToken = (trigger as any).isPreTokenGenEvent(event);
      expect(isPreToken).toBe(false);
    });
  });

  describe('getRequestId', () => {
    it('extracts request ID from PostAuthEvent', () => {
      const event = new PostAuthEventBuilder()
        .withUserName('test-sub')
        .build();
      if (event.requestContext) {
        event.requestContext.awsRequestId = 'test-request-id';
      }
      
      const requestId = (trigger as any).getRequestId(event);
      expect(requestId).toBe('test-request-id');
    });
  });
});

