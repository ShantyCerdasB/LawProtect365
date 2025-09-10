import { withRequestContext } from '../../src/http/withRequestContext.js';
import { ulid } from 'ulid';

// Mock ulid
jest.mock('ulid', () => ({
  ulid: jest.fn()}));

const mockUlid = ulid as jest.MockedFunction<typeof ulid>;

describe('withRequestContext', () => {
  let mockEvent: any;

  beforeEach(() => {
    mockEvent = {
      headers: {},
      requestContext: {}};

    mockUlid.mockReturnValue('mock-ulid-123');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a before middleware function', () => {
    const middleware = withRequestContext();

    expect(typeof middleware).toBe('function');
  });

  it('should use existing x-request-id header', () => {
    const middleware = withRequestContext();
    mockEvent.headers['x-request-id'] = 'existing-request-id';

    middleware(mockEvent);

    expect(mockEvent.headers['x-request-id']).toBe('existing-request-id');
    expect(mockUlid).toHaveBeenCalledTimes(1); // Called once for trace id
  });

  it('should use existing X-Request-Id header (case insensitive)', () => {
    const middleware = withRequestContext();
    mockEvent.headers['X-Request-Id'] = 'existing-request-id-upper';

    middleware(mockEvent);

    expect(mockEvent.headers['x-request-id']).toBe('existing-request-id-upper');
    expect(mockUlid).toHaveBeenCalledTimes(1); // Called once for trace id
  });

  it('should use requestContext.requestId if no header present', () => {
    const middleware = withRequestContext();
    mockEvent.requestContext.requestId = 'context-request-id';

    middleware(mockEvent);

    expect(mockEvent.headers['x-request-id']).toBe('context-request-id');
    expect(mockUlid).toHaveBeenCalledTimes(1); // Called once for trace id
  });

  it('should generate new request id if none present', () => {
    const middleware = withRequestContext();

    middleware(mockEvent);

    expect(mockEvent.headers['x-request-id']).toBe('mock-ulid-123');
    expect(mockUlid).toHaveBeenCalledTimes(2); // Once for request id, once for trace id
  });

  it('should use existing x-trace-id header', () => {
    const middleware = withRequestContext();
    mockEvent.headers['x-trace-id'] = 'existing-trace-id';

    middleware(mockEvent);

    expect(mockEvent.headers['x-trace-id']).toBe('existing-trace-id');
    expect(mockUlid).toHaveBeenCalledTimes(1); // Only for request id
  });

  it('should use existing X-Trace-Id header (case insensitive)', () => {
    const middleware = withRequestContext();
    mockEvent.headers['X-Trace-Id'] = 'existing-trace-id-upper';

    middleware(mockEvent);

    expect(mockEvent.headers['x-trace-id']).toBe('existing-trace-id-upper');
    expect(mockUlid).toHaveBeenCalledTimes(1); // Only for request id
  });

  it('should generate new trace id if none present', () => {
    const middleware = withRequestContext();

    middleware(mockEvent);

    expect(mockEvent.headers['x-trace-id']).toBe('mock-ulid-123');
    expect(mockUlid).toHaveBeenCalledTimes(2); // Once for request id, once for trace id
  });

  it('should handle missing headers object', () => {
    const middleware = withRequestContext();
    delete mockEvent.headers;

    middleware(mockEvent);

    expect(mockEvent.headers).toBeDefined();
    expect(mockEvent.headers['x-request-id']).toBe('mock-ulid-123');
    expect(mockEvent.headers['x-trace-id']).toBe('mock-ulid-123');
  });

  it('should handle missing requestContext', () => {
    const middleware = withRequestContext();
    const eventWithoutRequestContext = { 
      ...mockEvent,
      requestContext: undefined 
    };

    middleware(eventWithoutRequestContext);

    expect(eventWithoutRequestContext.headers['x-request-id']).toBe('mock-ulid-123');
    expect(eventWithoutRequestContext.headers['x-trace-id']).toBe('mock-ulid-123');
  });

  it('should convert request id to string', () => {
    const middleware = withRequestContext();
    mockEvent.requestContext.requestId = 12345;

    middleware(mockEvent);

    expect(mockEvent.headers['x-request-id']).toBe('12345');
    expect(typeof mockEvent.headers['x-request-id']).toBe('string');
  });

  it('should convert trace id to string', () => {
    const middleware = withRequestContext();
    mockEvent.headers['x-trace-id'] = 67890;

    middleware(mockEvent);

    expect(mockEvent.headers['x-trace-id']).toBe('67890');
    expect(typeof mockEvent.headers['x-trace-id']).toBe('string');
  });

  it('should prioritize x-request-id over X-Request-Id', () => {
    const middleware = withRequestContext();
    mockEvent.headers['x-request-id'] = 'lowercase-id';
    mockEvent.headers['X-Request-Id'] = 'uppercase-id';

    middleware(mockEvent);

    expect(mockEvent.headers['x-request-id']).toBe('lowercase-id');
  });

  it('should prioritize x-trace-id over X-Trace-Id', () => {
    const middleware = withRequestContext();
    mockEvent.headers['x-trace-id'] = 'lowercase-trace';
    mockEvent.headers['X-Trace-Id'] = 'uppercase-trace';

    middleware(mockEvent);

    expect(mockEvent.headers['x-trace-id']).toBe('lowercase-trace');
  });

  it('should prioritize headers over requestContext', () => {
    const middleware = withRequestContext();
    mockEvent.headers['x-request-id'] = 'header-id';
    mockEvent.requestContext.requestId = 'context-id';

    middleware(mockEvent);

    expect(mockEvent.headers['x-request-id']).toBe('header-id');
  });
});