import { OutboxProcessor } from '../../../src/aws/outbox/OutboxProcessor.js';
import type { OutboxPort, EventBusPort } from '../../../src/index.js';
import type { OutboxRecord } from '../../../src/index.js';

describe('OutboxProcessor', () => {
  let processor: OutboxProcessor;
  let mockOutboxRepository: jest.Mocked<OutboxPort>;
  let mockEventBus: jest.Mocked<EventBusPort>;
  let mockMetrics: jest.Mocked<OutboxProcessor['metrics']>;
  let mockOptions: OutboxProcessor['options'];

  beforeEach(() => {
    mockOutboxRepository = {
      pullPending: jest.fn(),
      markDispatched: jest.fn(),
      markFailed: jest.fn(),
    } as any;

    mockEventBus = {
      publish: jest.fn(),
    } as any;

    mockMetrics = {
      incrementCounter: jest.fn(),
      recordDuration: jest.fn(),
      putMetrics: jest.fn(),
    } as any;

    mockOptions = {
      maxBatchSize: 10,
      maxWaitTimeMs: 1000,
      maxRetries: 3,
      retryDelayMs: 100,
      debug: false,
    };

    processor = new OutboxProcessor(
      mockOutboxRepository,
      mockEventBus,
      mockOptions,
      mockMetrics
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startProcessing', () => {
    it('should throw error if already running', async () => {
      // Start processing first time
      mockOutboxRepository.pullPending.mockResolvedValue([]);
      const startPromise = processor.startProcessing();
      
      // Try to start again while running
      await expect(processor.startProcessing()).rejects.toThrow('OutboxProcessor is already running');
      
      // Stop the first instance
      processor.stopProcessing();
      await startPromise;
    });

    it('should process batches continuously until stopped', async () => {
      mockOutboxRepository.pullPending
        .mockResolvedValueOnce([createMockEvent('1')])
        .mockResolvedValue([]); // Empty batch to exit loop

      mockEventBus.publish.mockResolvedValue(undefined);
      mockOutboxRepository.markDispatched.mockResolvedValue(undefined);

      const startPromise = processor.startProcessing();
      
      // Let it process a few batches
      await new Promise(resolve => setTimeout(resolve, 100));
      
      processor.stopProcessing();
      await startPromise;

      expect(mockOutboxRepository.pullPending).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in processing loop', async () => {
      const error = new Error('Processing error');
      mockOutboxRepository.pullPending.mockRejectedValue(error);

      await expect(processor.startProcessing()).rejects.toThrow('Processing error');
      expect(processor['isRunning']).toBe(false);
    });
  });

  describe('stopProcessing', () => {
    it('should stop the processor', () => {
      processor['isRunning'] = true;
      processor.stopProcessing();
      expect(processor['isRunning']).toBe(false);
    });
  });

  describe('processBatch', () => {
    it('should return empty result when no events', async () => {
      mockOutboxRepository.pullPending.mockResolvedValue([]);

      const result = await processor.processBatch();

      expect(result).toEqual({
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        results: [],
        totalDurationMs: expect.any(Number),
      });
    });

    it('should process single event successfully', async () => {
      const event = createMockEvent('1');
      mockOutboxRepository.pullPending.mockResolvedValue([event]);
      mockEventBus.publish.mockResolvedValue(undefined);
      mockOutboxRepository.markDispatched.mockResolvedValue(undefined);

      const result = await processor.processBatch();

      expect(result.totalEvents).toBe(1);
      expect(result.successfulEvents).toBe(1);
      expect(result.failedEvents).toBe(0);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].eventId).toBe('1');

      expect(mockEventBus.publish).toHaveBeenCalledWith([{
        type: event.type,
        payload: event.payload,
        id: event.id,
        occurredAt: event.occurredAt,
      }]);
      expect(mockOutboxRepository.markDispatched).toHaveBeenCalledWith('1');
    });

    it('should handle event processing failure', async () => {
      const event = createMockEvent('1');
      mockOutboxRepository.pullPending.mockResolvedValue([event]);
      mockEventBus.publish.mockRejectedValue(new Error('Publish failed'));
      mockOutboxRepository.markFailed.mockResolvedValue(undefined);

      // Set max retries to 1 to trigger markFailed
      processor['options'].maxRetries = 1;

      const result = await processor.processBatch();

      expect(result.totalEvents).toBe(1);
      expect(result.successfulEvents).toBe(0);
      expect(result.failedEvents).toBe(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBe('Publish failed');
      expect(result.results[0].attempts).toBe(1);

      expect(mockOutboxRepository.markFailed).toHaveBeenCalledWith('1', 'Publish failed');
    });

    it('should process multiple events with mixed results', async () => {
      const event1 = createMockEvent('1');
      const event2 = createMockEvent('2');
      const event3 = createMockEvent('3');

      mockOutboxRepository.pullPending.mockResolvedValue([event1, event2, event3]);
      
      mockEventBus.publish
        .mockResolvedValueOnce(undefined) // event1 succeeds
        .mockRejectedValueOnce(new Error('Publish failed')) // event2 fails
        .mockResolvedValueOnce(undefined); // event3 succeeds

      mockOutboxRepository.markDispatched.mockResolvedValue(undefined);
      mockOutboxRepository.markFailed.mockResolvedValue(undefined);

      const result = await processor.processBatch();

      expect(result.totalEvents).toBe(3);
      expect(result.successfulEvents).toBe(2);
      expect(result.failedEvents).toBe(1);
      expect(result.results).toHaveLength(3);
    });

    it('should send batch metrics', async () => {
      const event = createMockEvent('1');
      mockOutboxRepository.pullPending.mockResolvedValue([event]);
      mockEventBus.publish.mockResolvedValue(undefined);
      mockOutboxRepository.markDispatched.mockResolvedValue(undefined);

      await processor.processBatch();

      expect(mockMetrics.putMetrics).toHaveBeenCalledWith([
        { name: 'outbox.batch.size', value: 1, unit: 'Count' },
        { name: 'outbox.batch.successful', value: 1, unit: 'Count' },
        { name: 'outbox.batch.failed', value: 0, unit: 'Count' },
        { name: 'outbox.batch.duration', value: expect.any(Number), unit: 'Milliseconds' },
      ]);
    });

    it('should handle batch processing errors', async () => {
      const error = new Error('Batch error');
      mockOutboxRepository.pullPending.mockRejectedValue(error);

      await expect(processor.processBatch()).rejects.toThrow('Batch error');
      expect(mockMetrics.incrementCounter).toHaveBeenCalledWith('outbox.batch.errors');
    });
  });

  describe('processEvent', () => {
    it('should send success metrics for successful event', async () => {
      const event = createMockEvent('1');
      mockEventBus.publish.mockResolvedValue(undefined);
      mockOutboxRepository.markDispatched.mockResolvedValue(undefined);

      const result = await processor['processEvent'](event);

      expect(result.success).toBe(true);
      expect(mockMetrics.incrementCounter).toHaveBeenCalledWith('outbox.events.processed');
      expect(mockMetrics.recordDuration).toHaveBeenCalledWith('outbox.processing.duration', expect.any(Number));
    });

    it('should send retry metrics for failed event', async () => {
      const event = createMockEvent('1');
      mockEventBus.publish.mockRejectedValue(new Error('Publish failed'));
      mockOutboxRepository.markFailed.mockResolvedValue(undefined);

      const result = await processor['processEvent'](event);

      expect(result.success).toBe(false);
      expect(mockMetrics.incrementCounter).toHaveBeenCalledWith('outbox.events.retries');
      expect(mockMetrics.recordDuration).toHaveBeenCalledWith('outbox.retry.duration', expect.any(Number));
    });

    it('should send failure metrics when max retries exceeded', async () => {
      const event = createMockEvent('1');
      mockEventBus.publish.mockRejectedValue(new Error('Publish failed'));
      mockOutboxRepository.markFailed.mockResolvedValue(undefined);

      // Set max retries to 1
      processor['options'].maxRetries = 1;

      const result = await processor['processEvent'](event);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(mockMetrics.incrementCounter).toHaveBeenCalledWith('outbox.events.failed');
      expect(mockMetrics.incrementCounter).toHaveBeenCalledWith('outbox.events.max_retries_exceeded');
    });
  });

  describe('logging', () => {
    it('should log when debug is enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      processor['options'].debug = true;

      processor['log']('Test message', { key: 'value' });

      expect(consoleSpy).toHaveBeenCalledWith('[OutboxProcessor] Test message', { key: 'value' });
      consoleSpy.mockRestore();
    });

    it('should not log when debug is disabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      processor['options'].debug = false;

      processor['log']('Test message', { key: 'value' });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  function createMockEvent(id: string): OutboxRecord {
    return {
      id,
      type: 'TestEvent',
      payload: { test: 'data' },
      occurredAt: '2023-01-01T00:00:00.000Z',
      status: 'pending',
      attempts: 0,
    };
  }
});
