import { 
  toEventBridgeEntry, 
  createEventMetadata, 
  validateEventMetadata, 
  generateEventId, 
  formatEventForLogging,
  type EventMetadataSchema 
} from '../../src/utils/eventbridge.js';

describe('EventBridge Utils', () => {
  const mockTimestamp = '2023-01-01T00:00:00.000Z';
  const mockUuid = 'test-uuid-123';

  // Mock Date.now
  beforeEach(() => {
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockTimestamp);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('toEventBridgeEntry', () => {
    it('should convert EventMetadata to EventBridgeEntry format', () => {
      const metadata: EventMetadataSchema = {
        source: 'test.source',
        detailType: 'TestEvent',
        detail: { test: 'data' },
        eventBusName: 'test-bus',
        time: new Date(mockTimestamp),
        region: 'us-east-1',
        resources: ['arn:aws:test:resource'],
        traceHeader: 'test-trace',
      };

      const result = toEventBridgeEntry(metadata);

      expect(result).toEqual({
        Source: 'test.source',
        DetailType: 'TestEvent',
        Detail: '{"test":"data"}',
        EventBusName: 'test-bus',
        Time: new Date(mockTimestamp),
        Region: 'us-east-1',
        Resources: ['arn:aws:test:resource'],
        TraceHeader: 'test-trace',
      });
    });

    it('should use current time when time is not provided', () => {
      const metadata: EventMetadataSchema = {
        source: 'test.source',
        detailType: 'TestEvent',
        detail: { test: 'data' },
      };

      const result = toEventBridgeEntry(metadata);

      expect(result.Time).toBeInstanceOf(Date);
      expect(result.Time?.getTime()).toBeCloseTo(Date.now(), -2);
    });
  });

  describe('createEventMetadata', () => {
    it('should create event metadata with required fields', () => {
      const result = createEventMetadata('test.source', 'TestEvent', { test: 'data' });

      expect(result).toEqual({
        source: 'test.source',
        detailType: 'TestEvent',
        detail: { test: 'data' },
        time: expect.any(Date),
      });
    });

    it('should create event metadata with optional fields', () => {
      const options = {
        eventBusName: 'test-bus',
        region: 'us-east-1',
        resources: ['arn:aws:test:resource'],
        traceHeader: 'test-trace',
      };

      const result = createEventMetadata('test.source', 'TestEvent', { test: 'data' }, options);

      expect(result).toEqual({
        source: 'test.source',
        detailType: 'TestEvent',
        detail: { test: 'data' },
        time: expect.any(Date),
        ...options,
      });
    });

    it('should override default time when provided in options', () => {
      const customTime = new Date('2023-01-01T00:00:00.000Z');
      const result = createEventMetadata('test.source', 'TestEvent', { test: 'data' }, { time: customTime });

      expect(result.time).toBe(customTime);
    });
  });

  describe('validateEventMetadata', () => {
    it('should return empty array for valid metadata', () => {
      const metadata: EventMetadataSchema = {
        source: 'test.source',
        detailType: 'TestEvent',
        detail: { test: 'data' },
      };

      const errors = validateEventMetadata(metadata);

      expect(errors).toEqual([]);
    });

    it('should return error for missing source', () => {
      const metadata: EventMetadataSchema = {
        source: '',
        detailType: 'TestEvent',
        detail: { test: 'data' },
      };

      const errors = validateEventMetadata(metadata);

      expect(errors).toContain('Event source is required');
    });

    it('should return error for missing detailType', () => {
      const metadata: EventMetadataSchema = {
        source: 'test.source',
        detailType: '',
        detail: { test: 'data' },
      };

      const errors = validateEventMetadata(metadata);

      expect(errors).toContain('Event detail type is required');
    });

    it('should return error for invalid detail', () => {
      const metadata: EventMetadataSchema = {
        source: 'test.source',
        detailType: 'TestEvent',
        detail: null as any,
      };

      const errors = validateEventMetadata(metadata);

      expect(errors).toContain('Event detail must be a valid object');
    });

    it('should return multiple errors for multiple issues', () => {
      const metadata: EventMetadataSchema = {
        source: '',
        detailType: '',
        detail: null as any,
      };

      const errors = validateEventMetadata(metadata);

      expect(errors).toHaveLength(3);
      expect(errors).toContain('Event source is required');
      expect(errors).toContain('Event detail type is required');
      expect(errors).toContain('Event detail must be a valid object');
    });
  });

  describe('generateEventId', () => {
    it('should generate unique event ID', () => {
      const result = generateEventId();

      expect(result).toMatch(/^evt_\d+_[a-f0-9]{9}$/);
    });

    it('should generate different IDs for different calls', () => {
      const id1 = generateEventId();
      const id2 = generateEventId();

      expect(id1).not.toBe(id2);
    });
  });

  describe('formatEventForLogging', () => {
    it('should format event for logging with provided time', () => {
      const metadata: EventMetadataSchema = {
        source: 'test.source',
        detailType: 'TestEvent',
        detail: { test: 'data' },
        time: new Date(mockTimestamp),
      };

      const result = formatEventForLogging(metadata);

      expect(result).toBe(`[test.source] TestEvent at ${mockTimestamp}`);
    });

    it('should format event for logging with current time when time is not provided', () => {
      const metadata: EventMetadataSchema = {
        source: 'test.source',
        detailType: 'TestEvent',
        detail: { test: 'data' },
      };

      const result = formatEventForLogging(metadata);

      expect(result).toMatch(/^\[test\.source\] TestEvent at \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
