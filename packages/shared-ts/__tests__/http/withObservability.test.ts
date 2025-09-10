import { withObservability, type ObservabilityFactories } from '../../src/http/withObservability.js';

describe('withObservability', () => {
  let mockLogger: any;
  let mockMetrics: any;
  let mockTracer: any;
  let mockFactories: ObservabilityFactories;
  let mockEvent: any;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()};

    mockMetrics = {
      increment: jest.fn(),
      timing: jest.fn()};

    mockTracer = {
      startSpan: jest.fn(),
      endSpan: jest.fn()};

    mockFactories = {
      logger: jest.fn().mockReturnValue(mockLogger),
      metrics: jest.fn().mockReturnValue(mockMetrics),
      tracer: jest.fn().mockReturnValue(mockTracer)};

    mockEvent = {
      headers: {
        'x-request-id': 'test-request-id',
        'x-trace-id': 'test-trace-id'},
      requestContext: {
        http: {
          method: 'GET',
          path: '/test'}}};

    // Mock process.env.ENV
    process.env.ENV = 'test';
  });

  afterEach(() => {
    delete process.env.ENV;
    jest.clearAllMocks();
  });

  it('should create a before middleware function', () => {
    const middleware = withObservability(mockFactories);

    expect(typeof middleware).toBe('function');
  });

  it('should bind observability tools to event context', () => {
    const middleware = withObservability(mockFactories);

    middleware(mockEvent);

    expect(mockFactories.logger).toHaveBeenCalledWith({
      requestId: 'test-request-id',
      traceId: 'test-trace-id',
      route: '/test',
      method: 'GET'});
    expect(mockFactories.metrics).toHaveBeenCalled();
    expect(mockFactories.tracer).toHaveBeenCalled();

    expect((mockEvent as any).ctx).toEqual({
      env: 'test',
      requestId: 'test-request-id',
      logger: mockLogger,
      metrics: mockMetrics,
      tracer: mockTracer,
      bag: {}});
  });

  it('should handle missing request id header', () => {
    const middleware = withObservability(mockFactories);
    const eventWithoutRequestId = { ...mockEvent };
    delete eventWithoutRequestId.headers['x-request-id'];

    middleware(eventWithoutRequestId);

    expect(mockFactories.logger).toHaveBeenCalledWith({
      requestId: undefined,
      traceId: 'test-trace-id',
      route: '/test',
      method: 'GET'});
    expect((eventWithoutRequestId as any).ctx.requestId).toBeUndefined();
  });

  it('should handle missing trace id header', () => {
    const middleware = withObservability(mockFactories);
    const eventWithoutTraceId = { ...mockEvent };
    delete eventWithoutTraceId.headers['x-trace-id'];

    middleware(eventWithoutTraceId);

    expect(mockFactories.logger).toHaveBeenCalledWith({
      requestId: 'test-request-id',
      traceId: undefined,
      route: '/test',
      method: 'GET'});
  });

  it('should handle case-insensitive request id header', () => {
    const middleware = withObservability(mockFactories);
    const eventWithUpperCaseHeader = {
      ...mockEvent,
      headers: {
        'X-Request-Id': 'test-request-id-upper'}};

    middleware(eventWithUpperCaseHeader);

    expect(mockFactories.logger).toHaveBeenCalledWith({
      requestId: 'test-request-id-upper',
      traceId: undefined,
      route: '/test',
      method: 'GET'});
  });

  it('should handle case-insensitive trace id header', () => {
    const middleware = withObservability(mockFactories);
    const eventWithUpperCaseHeader = {
      ...mockEvent,
      headers: {
        'X-Trace-Id': 'test-trace-id-upper'}};

    middleware(eventWithUpperCaseHeader);

    expect(mockFactories.logger).toHaveBeenCalledWith({
      requestId: undefined,
      traceId: 'test-trace-id-upper',
      route: '/test',
      method: 'GET'});
  });

  it('should handle missing headers object', () => {
    const middleware = withObservability(mockFactories);
    const eventWithoutHeaders = {
      ...mockEvent,
      headers: undefined};

    middleware(eventWithoutHeaders);

    expect(mockFactories.logger).toHaveBeenCalledWith({
      requestId: undefined,
      traceId: undefined,
      route: '/test',
      method: 'GET'});
  });

  it('should handle missing request context', () => {
    const middleware = withObservability(mockFactories);
    const eventWithoutContext = {
      ...mockEvent,
      requestContext: undefined};

    middleware(eventWithoutContext);

    expect(mockFactories.logger).toHaveBeenCalledWith({
      requestId: 'test-request-id',
      traceId: 'test-trace-id',
      route: undefined,
      method: undefined});
  });

  it('should use default env when ENV is not set', () => {
    delete process.env.ENV;
    const middleware = withObservability(mockFactories);

    middleware(mockEvent);

    expect((mockEvent as any).ctx.env).toBe('dev');
  });

  it('should handle empty headers object', () => {
    const middleware = withObservability(mockFactories);
    const eventWithEmptyHeaders = {
      ...mockEvent,
      headers: {}};

    middleware(eventWithEmptyHeaders);

    expect(mockFactories.logger).toHaveBeenCalledWith({
      requestId: undefined,
      traceId: undefined,
      route: '/test',
      method: 'GET'});
  });

  it('should preserve existing ctx if present', () => {
    const middleware = withObservability(mockFactories);
    const eventWithExistingCtx = {
      ...mockEvent,
      ctx: { existing: 'value' }};

    middleware(eventWithExistingCtx);

    expect((eventWithExistingCtx as any).ctx).toEqual({
      env: 'test',
      requestId: 'test-request-id',
      logger: mockLogger,
      metrics: mockMetrics,
      tracer: mockTracer,
      bag: {}});
  });
});