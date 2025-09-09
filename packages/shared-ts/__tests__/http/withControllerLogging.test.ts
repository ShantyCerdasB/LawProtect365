import { withControllerLogging } from '../../src/http/withControllerLogging.js';

describe('withControllerLogging', () => {
  let mockLogger: any;
  let mockEvent: any;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
    };

    mockEvent = {
      requestContext: {
        http: {
          method: 'GET',
          path: '/test',
        },
      },
      headers: {
        'x-request-id': 'test-request-id',
      },
      ctx: {
        logger: mockLogger,
      },
    };

    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(1000) // start time
      .mockReturnValueOnce(2000); // end time
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create before and after middleware functions', () => {
    const middleware = withControllerLogging();

    expect(middleware).toHaveProperty('before');
    expect(middleware).toHaveProperty('after');
    expect(typeof middleware.before).toBe('function');
    expect(typeof middleware.after).toBe('function');
  });

  it('should log start information in before middleware', () => {
    const middleware = withControllerLogging();

    middleware.before(mockEvent);

    expect(mockLogger.info).toHaveBeenCalledWith('http:start', {
      method: 'GET',
      path: '/test',
    });
  });

  it('should log finish information in after middleware', () => {
    const middleware = withControllerLogging();
    const mockResponse = { statusCode: 200, body: 'test' };

    middleware.before(mockEvent);
    const result = middleware.after(mockEvent, mockResponse);

    expect(mockLogger.info).toHaveBeenCalledWith('http:finish', {
      status: 200,
      ms: 1000,
    });
    expect(result).toBe(mockResponse);
  });

  it('should handle string response in after middleware', () => {
    const middleware = withControllerLogging();
    const stringResponse = 'test response';

    middleware.before(mockEvent);
    const result = middleware.after(mockEvent, stringResponse);

    expect(mockLogger.info).toHaveBeenCalledWith('http:finish', {
      status: 200,
      ms: 1000,
    });
    expect(result).toBe(stringResponse);
  });

  it('should handle response without statusCode', () => {
    const middleware = withControllerLogging();
    const mockResponse = { body: 'test' };

    middleware.before(mockEvent);
    const result = middleware.after(mockEvent, mockResponse);

    expect(mockLogger.info).toHaveBeenCalledWith('http:finish', {
      status: 200,
      ms: 1000,
    });
    expect(result).toBe(mockResponse);
  });

  it('should add x-request-id header to response', () => {
    const middleware = withControllerLogging();
    const mockResponse = { statusCode: 200, body: 'test' };

    middleware.before(mockEvent);
    const result = middleware.after(mockEvent, mockResponse);

    expect((result as any).headers).toEqual({
      'x-request-id': 'test-request-id',
    });
  });

  it('should preserve existing headers when adding x-request-id', () => {
    const middleware = withControllerLogging();
    const mockResponse = {
      statusCode: 200,
      body: 'test',
      headers: { 'content-type': 'application/json' },
    };

    middleware.before(mockEvent);
    const result = middleware.after(mockEvent, mockResponse);

    expect((result as any).headers).toEqual({
      'content-type': 'application/json',
      'x-request-id': 'test-request-id',
    });
  });

  it('should handle missing x-request-id header', () => {
    const middleware = withControllerLogging();
    const mockResponse = { statusCode: 200, body: 'test' };
    const eventWithoutRequestId = { ...mockEvent };
    delete eventWithoutRequestId.headers['x-request-id'];

    middleware.before(eventWithoutRequestId);
    const result = middleware.after(eventWithoutRequestId, mockResponse);

    expect((result as any).headers).toEqual({
      'x-request-id': '',
    });
  });

  it('should not add headers to string response', () => {
    const middleware = withControllerLogging();
    const stringResponse = 'test response';

    middleware.before(mockEvent);
    const result = middleware.after(mockEvent, stringResponse);

    expect(result).toBe(stringResponse);
    expect(typeof result).toBe('string');
  });

  it('should handle event without ctx', () => {
    const middleware = withControllerLogging();
    const eventWithoutCtx = { ...mockEvent };
    delete eventWithoutCtx.ctx;

    expect(() => middleware.before(eventWithoutCtx)).not.toThrow();
    expect(() => middleware.after(eventWithoutCtx, { statusCode: 200 })).not.toThrow();
  });

  it('should handle event without logger', () => {
    const middleware = withControllerLogging();
    const eventWithoutLogger = {
      ...mockEvent,
      ctx: {},
    };

    expect(() => middleware.before(eventWithoutLogger)).not.toThrow();
    expect(() => middleware.after(eventWithoutLogger, { statusCode: 200 })).not.toThrow();
  });
});