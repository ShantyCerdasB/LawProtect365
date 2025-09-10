import { outboxProcessor, handler } from '../../../src/aws/outbox/OutboxWorker.js';
import { logger } from '../../../src/index.js';

// Mock the logger
jest.mock('../../../src/index.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()}}));

describe('OutboxWorker', () => {
  const mockContext = {
    awsRequestId: 'test-request-id'};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('outboxProcessor', () => {
    it('should return error response indicating implementation needs customization', async () => {
      const result = await outboxProcessor({}, mockContext);
      
      expect(result.statusCode).toBe(500);
      expect(result.body.processed).toBe(0);
      expect(result.body.failed).toBe(1);
      expect(result.body.duration).toBeGreaterThanOrEqual(0);
      expect(result.body.timestamp).toBeDefined();
    });

    it('should log start and error messages', async () => {
      await outboxProcessor({}, mockContext);

      expect(logger.info).toHaveBeenCalledWith('Starting outbox processing', {
        requestId: 'test-request-id',
        timestamp: expect.any(String),
        config: {
          maxBatchSize: 100,
          continueOnError: true}});

      expect(logger.error).toHaveBeenCalledWith('Outbox processing failed', {
        requestId: 'test-request-id',
        error: 'OutboxWorker implementation needs to be customized per service',
        duration: expect.any(Number),
        timestamp: expect.any(String)});
    });

    it('should return error response when continueOnError is true', async () => {
      const result = await outboxProcessor({}, mockContext);

      expect(result.statusCode).toBe(500);
      expect(result.body.processed).toBe(0);
      expect(result.body.failed).toBe(1);
      expect(result.body.duration).toBeGreaterThanOrEqual(0);
      expect(result.body.timestamp).toBeDefined();
    });

    it('should handle empty event and context', async () => {
      const result = await outboxProcessor();
      
      expect(result.statusCode).toBe(500);
      expect(result.body.processed).toBe(0);
      expect(result.body.failed).toBe(1);
    });

    it('should handle custom event and context', async () => {
      const customEvent = { custom: 'data' };
      const customContext = { awsRequestId: 'custom-request-id' };

      const result = await outboxProcessor(customEvent, customContext);
      
      expect(result.statusCode).toBe(500);
      expect(result.body.processed).toBe(0);
      expect(result.body.failed).toBe(1);

      expect(logger.info).toHaveBeenCalledWith('Starting outbox processing', {
        requestId: 'custom-request-id',
        timestamp: expect.any(String),
        config: {
          maxBatchSize: 100,
          continueOnError: true}});
    });
  });

  describe('handler', () => {
    it('should be the same as outboxProcessor', () => {
      expect(handler).toBe(outboxProcessor);
    });
  });
});
