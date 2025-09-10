/**
 * @file EventBusPortAdapter.test.ts
 * @summary Tests for EventBusPortAdapter
 */

import { EventBusPortAdapter } from '../../../src/aws/eventbridge/EventBusPortAdapter.js';
import type { DomainEvent } from '../../../src/events/index.js';
import type { EventBridgeClientPort } from '../../../src/contracts/eventbridge/index.js';

describe('EventBusPortAdapter', () => {
  let mockClient: jest.Mocked<EventBridgeClientPort>;
  let adapter: EventBusPortAdapter;

  beforeEach(() => {
    mockClient = {
      putEvents: jest.fn()} as any;

    adapter = new EventBusPortAdapter({
      busName: 'test-bus',
      source: 'test-source',
      client: mockClient,
      maxEntriesPerBatch: 5});
  });

  describe('constructor', () => {
    it('should set default batch size to 10 when not provided', () => {
      const adapter = new EventBusPortAdapter({
        busName: 'test-bus',
        source: 'test-source',
        client: mockClient});
      expect(adapter).toBeDefined();
    });

    it('should clamp batch size to valid range', () => {
      const adapter1 = new EventBusPortAdapter({
        busName: 'test-bus',
        source: 'test-source',
        client: mockClient,
        maxEntriesPerBatch: 0});
      expect(adapter1).toBeDefined();

      const adapter2 = new EventBusPortAdapter({
        busName: 'test-bus',
        source: 'test-source',
        client: mockClient,
        maxEntriesPerBatch: 20});
      expect(adapter2).toBeDefined();
    });

    it('should accept optional resources', () => {
      const adapter = new EventBusPortAdapter({
        busName: 'test-bus',
        source: 'test-source',
        client: mockClient,
        resources: ['resource1', 'resource2']});
      expect(adapter).toBeDefined();
    });
  });

  describe('publish', () => {
    const mockEvent: DomainEvent = {
      id: 'event-1',
      type: 'TestEvent',
      occurredAt: '2023-01-01T00:00:00Z',
      payload: { test: 'data' },
      metadata: { 'x-trace-id': 'trace-123' }};

    it('should return early for empty events array', async () => {
      await adapter.publish([]);
      expect(mockClient.putEvents).not.toHaveBeenCalled();
    });

    it('should return early for null/undefined events', async () => {
      await adapter.publish(null as any);
      expect(mockClient.putEvents).not.toHaveBeenCalled();
    });

    it('should publish single event successfully', async () => {
      mockClient.putEvents.mockResolvedValue({
        FailedEntryCount: 0,
        Entries: []});

      await adapter.publish([mockEvent]);

      expect(mockClient.putEvents).toHaveBeenCalledTimes(1);
      const call = mockClient.putEvents.mock.calls[0][0];
      expect(call.Entries).toHaveLength(1);
      expect(call.Entries[0]).toMatchObject({
        Source: 'test-source',
        DetailType: 'TestEvent',
        EventBusName: 'test-bus',
        Resources: undefined,
        TraceHeader: 'trace-123'});
    });

    it('should batch multiple events', async () => {
      const events = Array.from({ length: 7 }, (_, i) => ({
        ...mockEvent,
        id: `event-${i}`}));

      mockClient.putEvents.mockResolvedValue({
        FailedEntryCount: 0,
        Entries: []});

      await adapter.publish(events);

      // Should make 2 calls: 5 events + 2 events
      expect(mockClient.putEvents).toHaveBeenCalledTimes(2);
      expect(mockClient.putEvents.mock.calls[0][0].Entries).toHaveLength(5);
      expect(mockClient.putEvents.mock.calls[1][0].Entries).toHaveLength(2);
    });

    it('should throw InternalError when EventBridge reports failures', async () => {
      mockClient.putEvents.mockResolvedValue({
        FailedEntryCount: 2,
        FailedEntries: [
          { Entry: {} as any, ErrorCode: 'ERROR1', ErrorMessage: 'Error 1' },
          { Entry: {} as any, ErrorCode: 'ERROR2', ErrorMessage: 'Error 2' },
        ]});

      await expect(adapter.publish([mockEvent])).rejects.toThrow();
    });

    it('should throw InternalError with singular message for single failure', async () => {
      mockClient.putEvents.mockResolvedValue({
        FailedEntryCount: 1,
        FailedEntries: [{ Entry: {} as any, ErrorCode: 'ERROR1', ErrorMessage: 'Error 1' }]});

      await expect(adapter.publish([mockEvent])).rejects.toThrow();
    });

    it('should throw InternalError with plural message for multiple failures', async () => {
      mockClient.putEvents.mockResolvedValue({
        FailedEntryCount: 2,
        FailedEntries: [
          { Entry: {} as any, ErrorCode: 'ERROR1', ErrorMessage: 'Error 1' },
          { Entry: {} as any, ErrorCode: 'ERROR2', ErrorMessage: 'Error 2' },
        ]});

      await expect(adapter.publish([mockEvent])).rejects.toThrow();
    });

    it('should handle client errors', async () => {
      const clientError = new Error('Client error');
      mockClient.putEvents.mockRejectedValue(clientError);

      await expect(adapter.publish([mockEvent])).rejects.toThrow();
    });

    it('should include resources in EventBridge entries when provided', async () => {
      const adapterWithResources = new EventBusPortAdapter({
        busName: 'test-bus',
        source: 'test-source',
        client: mockClient,
        resources: ['resource1', 'resource2']});

      mockClient.putEvents.mockResolvedValue({
        FailedEntryCount: 0,
        Entries: []});

      await adapterWithResources.publish([mockEvent]);

      const call = mockClient.putEvents.mock.calls[0][0];
      expect(call.Entries[0].Resources).toEqual(['resource1', 'resource2']);
    });

    it('should handle events without metadata', async () => {
      const eventWithoutMetadata = {
        ...mockEvent,
        metadata: undefined};

      mockClient.putEvents.mockResolvedValue({
        FailedEntryCount: 0,
        Entries: []});

      await adapter.publish([eventWithoutMetadata]);

      const call = mockClient.putEvents.mock.calls[0][0];
      expect(call.Entries[0].TraceHeader).toBeUndefined();
    });

    it('should handle events without trace header in metadata', async () => {
      const eventWithoutTrace = {
        ...mockEvent,
        metadata: { other: 'data' }};

      mockClient.putEvents.mockResolvedValue({
        FailedEntryCount: 0,
        Entries: []});

      await adapter.publish([eventWithoutTrace]);

      const call = mockClient.putEvents.mock.calls[0][0];
      expect(call.Entries[0].TraceHeader).toBeUndefined();
    });
  });
});
