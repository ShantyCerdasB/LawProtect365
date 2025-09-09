import { OutboxRepositoryDdb } from '../../../src/aws/outbox/OutboxRepositoryDdb.js';
import { ConflictError } from '../../../src/index.js';
import type { DdbClientLike } from '../../../src/aws/ddb.js';
import type { DomainEvent } from '../../../src/index.js';

describe('OutboxRepositoryDdb', () => {
  let repository: OutboxRepositoryDdb;
  let mockDdb: jest.Mocked<DdbClientLike>;
  const tableName = 'test-table';
  const indexName = 'test-index';

  beforeEach(() => {
    mockDdb = {
      get: jest.fn(),
      put: jest.fn(),
      update: jest.fn(),
      query: jest.fn(),
    } as any;

    // Ensure methods are properly mocked
    (mockDdb.update as jest.Mock) = jest.fn();
    (mockDdb.query as jest.Mock) = jest.fn();

    repository = new OutboxRepositoryDdb({
      tableName,
      client: mockDdb,
      indexes: {
        byStatus: indexName,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    const mockEvent: DomainEvent = {
      id: 'test-event-id',
      type: 'TestEvent',
      payload: { test: 'data' },
      occurredAt: '2023-01-01T00:00:00.000Z',
    };

    it('should successfully save a new event', async () => {
      mockDdb.put.mockResolvedValue({});

      await repository.save(mockEvent, 'test-trace-id');

      expect(mockDdb.put).toHaveBeenCalledWith({
        TableName: tableName,
        Item: expect.objectContaining({
          pk: 'OUTBOX',
          sk: 'ID#test-event-id',
          id: 'test-event-id',
          eventType: 'TestEvent',
          payload: { test: 'data' },
          occurredAt: '2023-01-01T00:00:00.000Z',
          traceId: 'test-trace-id',
          status: 'pending',
          gsi1pk: 'STATUS#pending',
          gsi1sk: expect.stringMatching(/^2023-01-01T00:00:00\.000Z#test-event-id$/),
        }),
        ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
      });
    });

    it('should save event without payload', async () => {
      const eventWithoutPayload = { ...mockEvent, payload: undefined };
      mockDdb.put.mockResolvedValue({});

      await repository.save(eventWithoutPayload);

      expect(mockDdb.put).toHaveBeenCalledWith({
        TableName: tableName,
        Item: expect.objectContaining({
          payload: undefined,
        }),
        ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
      });
    });

    it('should throw ConflictError when record already exists', async () => {
      const error = new Error('ConditionalCheckFailedException');
      (error as any).name = 'ConditionalCheckFailedException';
      mockDdb.put.mockRejectedValue(error);

      await expect(repository.save(mockEvent)).rejects.toThrow(ConflictError);
    });

    it('should throw mapped error for other put failures', async () => {
      const error = new Error('DynamoDB error');
      mockDdb.put.mockRejectedValue(error);

      await expect(repository.save(mockEvent)).rejects.toThrow();
    });
  });

  describe('markDispatched', () => {
    it('should successfully mark record as dispatched', async () => {
      (mockDdb.update as jest.Mock).mockResolvedValue({});

      await repository.markDispatched('test-event-id');

      expect(mockDdb.update).toHaveBeenCalledWith({
        TableName: tableName,
        Key: { pk: 'OUTBOX', sk: 'ID#test-event-id' },
        UpdateExpression: 'SET #status = :s, #gpk = :g, #updatedAt = :now, #attempts = if_not_exists(#attempts, :zero), REMOVE #lastError',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#gpk': 'gsi1pk',
          '#updatedAt': 'updatedAt',
          '#attempts': 'attempts',
          '#lastError': 'lastError',
        },
        ExpressionAttributeValues: {
          ':s': 'dispatched',
          ':g': 'STATUS#dispatched',
          ':now': expect.any(String),
          ':zero': 0,
        },
        ReturnValues: 'NONE',
      });
    });

    it('should throw mapped error when update fails', async () => {
      const error = new Error('DynamoDB error');
      (mockDdb.update as jest.Mock).mockRejectedValue(error);

      await expect(repository.markDispatched('test-event-id')).rejects.toThrow();
    });
  });

  describe('markFailed', () => {
    it('should successfully mark record as failed', async () => {
      (mockDdb.update as jest.Mock).mockResolvedValue({});

      await repository.markFailed('test-event-id', 'Test error message');

      expect(mockDdb.update).toHaveBeenCalledWith({
        TableName: tableName,
        Key: { pk: 'OUTBOX', sk: 'ID#test-event-id' },
        UpdateExpression: 'SET #status = :s, #gpk = :g, #updatedAt = :now, #attempts = if_not_exists(#attempts, :zero) + :one, #lastError = :err',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#gpk': 'gsi1pk',
          '#updatedAt': 'updatedAt',
          '#attempts': 'attempts',
          '#lastError': 'lastError',
        },
        ExpressionAttributeValues: {
          ':s': 'failed',
          ':g': 'STATUS#failed',
          ':now': expect.any(String),
          ':zero': 0,
          ':one': 1,
          ':err': 'Test error message',
        },
        ReturnValues: 'NONE',
      });
    });

    it('should throw mapped error when update fails', async () => {
      const error = new Error('DynamoDB error');
      (mockDdb.update as jest.Mock).mockRejectedValue(error);

      await expect(repository.markFailed('test-event-id', 'Test error')).rejects.toThrow();
    });
  });

  describe('pullPending', () => {
    it('should successfully pull pending records', async () => {
      const mockItems = [
        {
          pk: 'OUTBOX',
          sk: 'ID#event-1',
          id: 'event-1',
          eventType: 'TestEvent1',
          payload: { test: 'data1' },
          occurredAt: '2023-01-01T00:00:00.000Z',
          status: 'pending',
          gsi1pk: 'STATUS#pending',
          gsi1sk: '2023-01-01T00:00:00.000Z#event-1',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
        {
          pk: 'OUTBOX',
          sk: 'ID#event-2',
          id: 'event-2',
          eventType: 'TestEvent2',
          payload: { test: 'data2' },
          occurredAt: '2023-01-01T00:01:00.000Z',
          status: 'pending',
          gsi1pk: 'STATUS#pending',
          gsi1sk: '2023-01-01T00:01:00.000Z#event-2',
          createdAt: '2023-01-01T00:01:00.000Z',
          updatedAt: '2023-01-01T00:01:00.000Z',
        },
      ];

      (mockDdb.query as jest.Mock).mockResolvedValue({ Items: mockItems });

      const result = await repository.pullPending(10);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'event-1',
        type: 'TestEvent1',
        payload: { test: 'data1' },
        occurredAt: '2023-01-01T00:00:00.000Z',
        status: 'pending',
        attempts: undefined,
        lastError: undefined,
        traceId: undefined,
      });

      expect(mockDdb.query).toHaveBeenCalledWith({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: { '#pk': 'gsi1pk' },
        ExpressionAttributeValues: { ':pk': 'STATUS#pending' },
        Limit: 10,
        ScanIndexForward: true,
      });
    });

    it('should return empty array when no pending records', async () => {
      (mockDdb.query as jest.Mock).mockResolvedValue({ Items: [] });

      const result = await repository.pullPending(10);

      expect(result).toEqual([]);
    });

    it('should clamp limit to valid range', async () => {
      (mockDdb.query as jest.Mock).mockResolvedValue({ Items: [] });

      await repository.pullPending(0);
      expect(mockDdb.query).toHaveBeenCalledWith(expect.objectContaining({ Limit: 1 }));

      await repository.pullPending(150);
      expect(mockDdb.query).toHaveBeenCalledWith(expect.objectContaining({ Limit: 100 }));
    });

    it('should throw mapped error when query fails', async () => {
      const error = new Error('DynamoDB error');
      (mockDdb.query as jest.Mock).mockRejectedValue(error);

      await expect(repository.pullPending(10)).rejects.toThrow();
    });
  });

  describe('constructor', () => {
    it('should use default index name when not provided', () => {
      const repo = new OutboxRepositoryDdb({
        tableName: 'test-table',
        client: mockDdb,
      });

      expect(repo['idxByStatus']).toBe('GSI1');
    });

    it('should use provided index name', () => {
      const repo = new OutboxRepositoryDdb({
        tableName: 'test-table',
        client: mockDdb,
        indexes: {
          byStatus: 'custom-index',
        },
      });

      expect(repo['idxByStatus']).toBe('custom-index');
    });
  });
});
