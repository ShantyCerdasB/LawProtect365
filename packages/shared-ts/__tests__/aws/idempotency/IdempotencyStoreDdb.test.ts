import { IdempotencyStoreDdb } from '../../../src/aws/idempotency/IdempotencyStoreDdb.js';
import { ConflictError, NotFoundError, ErrorCodes } from '../../../src/index.js';
import type { DdbClientLike } from '../../../src/aws/ddb.js';

describe('IdempotencyStoreDdb', () => {
  let store: IdempotencyStoreDdb;
  let mockDdb: jest.Mocked<DdbClientLike>;
  const tableName = 'test-table';

  beforeEach(() => {
    mockDdb = {
      get: jest.fn(),
      put: jest.fn(),
      update: jest.fn(),
    } as any;

    // Ensure update method is properly mocked
    (mockDdb.update as jest.Mock) = jest.fn();

    store = new IdempotencyStoreDdb(tableName, mockDdb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return null when item does not exist', async () => {
      mockDdb.get.mockResolvedValue({ Item: undefined });

      const result = await store.get('test-key');

      expect(result).toBeNull();
      expect(mockDdb.get).toHaveBeenCalledWith({
        TableName: tableName,
        Key: { pk: 'IDEMPOTENCY#test-key', sk: 'META' },
        ConsistentRead: true,
      });
    });

    it('should return null when item is not a valid idempotency item', async () => {
      mockDdb.get.mockResolvedValue({ Item: { pk: 'OTHER#key', sk: 'META' } });

      const result = await store.get('test-key');

      expect(result).toBeNull();
    });

    it('should return state when item exists and is valid', async () => {
      const mockItem = {
        pk: 'IDEMPOTENCY#test-key',
        sk: 'META',
        type: 'Idempotency',
        idempotencyKey: 'test-key',
        state: 'pending',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      };
      mockDdb.get.mockResolvedValue({ Item: mockItem });

      const result = await store.get('test-key');

      expect(result).toBe('pending');
    });

    it('should return completed state', async () => {
      const mockItem = {
        pk: 'IDEMPOTENCY#test-key',
        sk: 'META',
        type: 'Idempotency',
        idempotencyKey: 'test-key',
        state: 'completed',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        resultJson: '{"result": "success"}',
      };
      mockDdb.get.mockResolvedValue({ Item: mockItem });

      const result = await store.get('test-key');

      expect(result).toBe('completed');
    });

    it('should throw mapped error when ddb.get fails', async () => {
      const error = new Error('DynamoDB error');
      mockDdb.get.mockRejectedValue(error);

      await expect(store.get('test-key')).rejects.toThrow();
    });
  });

  describe('getRecord', () => {
    it('should return null when item does not exist', async () => {
      mockDdb.get.mockResolvedValue({ Item: undefined });

      const result = await store.getRecord('test-key');

      expect(result).toBeNull();
    });

    it('should return null when item is not a valid idempotency item', async () => {
      mockDdb.get.mockResolvedValue({ Item: { pk: 'OTHER#key', sk: 'META' } });

      const result = await store.getRecord('test-key');

      expect(result).toBeNull();
    });

    it('should return full record when item exists', async () => {
      const mockItem = {
        pk: 'IDEMPOTENCY#test-key',
        sk: 'META',
        type: 'Idempotency',
        idempotencyKey: 'test-key',
        state: 'completed',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        resultJson: '{"result": "success"}',
        ttl: 1672531200, // 2023-01-01T00:00:00Z
      };
      mockDdb.get.mockResolvedValue({ Item: mockItem });

      const result = await store.getRecord('test-key');

      expect(result).toEqual({
        key: 'test-key',
        state: 'completed',
        expiresAt: '2023-01-01T00:00:00.000Z',
        result: { result: 'success' },
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      });
    });

    it('should return record with default expiresAt when no TTL', async () => {
      const mockItem = {
        pk: 'IDEMPOTENCY#test-key',
        sk: 'META',
        type: 'Idempotency',
        idempotencyKey: 'test-key',
        state: 'pending',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      };
      mockDdb.get.mockResolvedValue({ Item: mockItem });

      const result = await store.getRecord('test-key');

      expect(result?.expiresAt).toBeDefined();
      expect(result?.result).toBeUndefined();
    });

    it('should throw mapped error when ddb.get fails', async () => {
      const error = new Error('DynamoDB error');
      mockDdb.get.mockRejectedValue(error);

      await expect(store.getRecord('test-key')).rejects.toThrow();
    });
  });

  describe('putPending', () => {
    it('should successfully create pending record', async () => {
      mockDdb.put.mockResolvedValue({});

      await store.putPending('test-key', 3600);

      expect(mockDdb.put).toHaveBeenCalledWith({
        TableName: tableName,
        Item: expect.objectContaining({
          pk: 'IDEMPOTENCY#test-key',
          sk: 'META',
          type: 'Idempotency',
          idempotencyKey: 'test-key',
          state: 'pending',
          ttl: expect.any(Number),
        }),
        ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
      });
    });

    it('should throw ConflictError when record already exists', async () => {
      const error = new Error('ConditionalCheckFailedException');
      (error as any).name = 'ConditionalCheckFailedException';
      mockDdb.put.mockRejectedValue(error);

      await expect(store.putPending('test-key', 3600)).rejects.toThrow(ConflictError);
    });

    it('should throw mapped error for other ddb.put failures', async () => {
      const error = new Error('DynamoDB error');
      mockDdb.put.mockRejectedValue(error);

      await expect(store.putPending('test-key', 3600)).rejects.toThrow();
    });
  });

  describe('putCompleted', () => {
    it('should successfully update record to completed', async () => {
      (mockDdb.update as jest.Mock).mockResolvedValue({});

      await store.putCompleted('test-key', { result: 'success' }, 3600);

      expect(mockDdb.update).toHaveBeenCalledWith({
        TableName: tableName,
        Key: { pk: 'IDEMPOTENCY#test-key', sk: 'META' },
        ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)',
        UpdateExpression: 'SET #state = :completed, #resultJson = :resultJson, #updatedAt = :updatedAt, #ttl = :ttl',
        ExpressionAttributeNames: {
          '#state': 'state',
          '#resultJson': 'resultJson',
          '#updatedAt': 'updatedAt',
          '#ttl': 'ttl',
        },
        ExpressionAttributeValues: {
          ':completed': 'completed',
          ':resultJson': '{"result":"success"}',
          ':updatedAt': expect.any(String),
          ':ttl': expect.any(Number),
        },
        ReturnValues: 'NONE',
      });
    });

    it('should update without TTL when ttlSeconds is 0', async () => {
      (mockDdb.update as jest.Mock).mockResolvedValue({});

      await store.putCompleted('test-key', { result: 'success' }, 0);

      expect(mockDdb.update).toHaveBeenCalledWith({
        TableName: tableName,
        Key: { pk: 'IDEMPOTENCY#test-key', sk: 'META' },
        ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)',
        UpdateExpression: 'SET #state = :completed, #resultJson = :resultJson, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#state': 'state',
          '#resultJson': 'resultJson',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':completed': 'completed',
          ':resultJson': '{"result":"success"}',
          ':updatedAt': expect.any(String),
        },
        ReturnValues: 'NONE',
      });
    });

    it('should throw NotFoundError when record does not exist', async () => {
      const error = new Error('ConditionalCheckFailedException');
      (error as any).name = 'ConditionalCheckFailedException';
      (mockDdb.update as jest.Mock).mockRejectedValue(error);

      await expect(store.putCompleted('test-key', { result: 'success' }, 3600)).rejects.toThrow(NotFoundError);
    });

    it('should throw mapped error for other ddb.update failures', async () => {
      const error = new Error('DynamoDB error');
      (mockDdb.update as jest.Mock).mockRejectedValue(error);

      await expect(store.putCompleted('test-key', { result: 'success' }, 3600)).rejects.toThrow();
    });
  });
});
