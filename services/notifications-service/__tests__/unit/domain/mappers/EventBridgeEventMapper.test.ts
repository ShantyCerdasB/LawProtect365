/**
 * @fileoverview EventBridgeEventMapper Tests - Unit tests for EventBridgeEventMapper
 * @summary Tests for EventBridge event transformation
 * @description Comprehensive test suite for EventBridgeEventMapper covering
 * transformation of EventBridge events to ProcessNotificationRequest.
 */

import { describe, it, expect } from '@jest/globals';
import { EventBridgeEventMapper } from '../../../../src/domain/mappers/EventBridgeEventMapper';
import type { EventBridgeEvent } from '../../../../src/domain/types/events';

describe('EventBridgeEventMapper', () => {
  describe('toProcessNotificationRequest', () => {
    it('transforms EventBridge event to ProcessNotificationRequest', () => {
      const event: EventBridgeEvent = {
        version: '0',
        id: 'event-123',
        'detail-type': 'ENVELOPE_INVITATION',
        source: 'signature-service',
        account: '123456789012',
        region: 'us-east-1',
        time: '2024-01-01T00:00:00Z',
        resources: [],
        detail: {
          envelopeId: 'env-123',
          userId: 'user-123',
        }
      };

      const result = EventBridgeEventMapper.toProcessNotificationRequest(event);

      expect(result.eventId).toBe('event-123');
      expect(result.eventType).toBe('ENVELOPE_INVITATION');
      expect(result.source).toBe('signature-service');
      expect(result.payload).toEqual(event.detail);
      expect(result.occurredAt).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(result.metadata?.account).toBe('123456789012');
      expect(result.metadata?.region).toBe('us-east-1');
      expect(result.metadata?.userId).toBe('user-123');
      expect(result.metadata?.envelopeId).toBe('env-123');
    });

    it('extracts userId from cancelledByUserId when userId missing', () => {
      const event: EventBridgeEvent = {
        version: '0',
        id: 'event-123',
        'detail-type': 'ENVELOPE_CANCELLED',
        source: 'signature-service',
        account: '123456789012',
        region: 'us-east-1',
        time: '2024-01-01T00:00:00Z',
        resources: [],
        detail: {
          cancelledByUserId: 'user-456',
        }
      };

      const result = EventBridgeEventMapper.toProcessNotificationRequest(event);

      expect(result.metadata?.userId).toBe('user-456');
    });

    it('extracts recipientLanguage from detail or metadata', () => {
      const event: EventBridgeEvent = {
        version: '0',
        id: 'event-123',
        'detail-type': 'ENVELOPE_INVITATION',
        source: 'signature-service',
        account: '123456789012',
        region: 'us-east-1',
        time: '2024-01-01T00:00:00Z',
        resources: [],
        detail: {
          recipientLanguage: 'es',
        }
      };

      const result = EventBridgeEventMapper.toProcessNotificationRequest(event);

      expect(result.metadata?.recipientLanguage).toBe('es');
    });
  });
});

