import { apiHandler, type ApiHandlerOptions } from '../../src/http/apiHandler.js';
import { mapError } from '../../src/errors/mapError.js';
import { buildCorsHeaders, isPreflight, preflightResponse } from '../../src/http/cors.js';

// Mock dependencies
jest.mock('../../src/errors/mapError.js');
jest.mock('../../src/http/cors.js');

const mockMapError = mapError as jest.MockedFunction<typeof mapError>;
const mockBuildCorsHeaders = buildCorsHeaders as jest.MockedFunction<typeof buildCorsHeaders>;
const mockIsPreflight = isPreflight as jest.MockedFunction<typeof isPreflight>;
const mockPreflightResponse = preflightResponse as jest.MockedFunction<typeof preflightResponse>;

describe('apiHandler', () => {
  let mockHandler: jest.Mock;
  let mockEvent: any;

  beforeEach(() => {
    mockHandler = jest.fn();
    mockEvent = {
      requestContext: {
        requestId: 'test-request-id',
      },
      headers: {
        'x-request-id': 'test-request-id',
      },
    };

    mockBuildCorsHeaders.mockReturnValue({ 'Access-Control-Allow-Origin': '*' });
    mockIsPreflight.mockReturnValue(false);
    mockPreflightResponse.mockReturnValue({ statusCode: 200, body: 'OK' });
    mockMapError.mockReturnValue({ statusCode: 500, body: 'Internal Server Error' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a wrapped handler function', () => {
    const wrappedHandler = apiHandler(mockHandler);

    expect(typeof wrappedHandler).toBe('function');
  });

  it('should call the original handler and return structured response', async () => {
    const mockResponse = { statusCode: 200, body: 'test response' };
    mockHandler.mockResolvedValue(mockResponse);

    const wrappedHandler = apiHandler(mockHandler);
    const result = await wrappedHandler(mockEvent);

    expect(mockHandler).toHaveBeenCalledWith(mockEvent);
    expect(result).toEqual({
      ...mockResponse,
      headers: {},
    });
  });

  it('should handle string response', async () => {
    const stringResponse = 'test string response';
    mockHandler.mockResolvedValue(stringResponse);

    const wrappedHandler = apiHandler(mockHandler);
    const result = await wrappedHandler(mockEvent);

    expect(result).toEqual({
      statusCode: 200,
      body: stringResponse,
      headers: {},
    });
  });

  it('should merge default headers', async () => {
    const mockResponse = { statusCode: 200, body: 'test' };
    mockHandler.mockResolvedValue(mockResponse);

    const options: ApiHandlerOptions = {
      defaultHeaders: { 'X-Custom-Header': 'custom-value' },
    };

    const wrappedHandler = apiHandler(mockHandler, options);
    const result = await wrappedHandler(mockEvent);

    expect((result as any).headers).toEqual({
      'X-Custom-Header': 'custom-value',
    });
  });

  it('should merge CORS headers', async () => {
    const mockResponse = { statusCode: 200, body: 'test' };
    mockHandler.mockResolvedValue(mockResponse);

    const options: ApiHandlerOptions = {
      cors: { allowOrigins: ['https://example.com'] },
    };

    const wrappedHandler = apiHandler(mockHandler, options);
    const result = await wrappedHandler(mockEvent);

    expect(mockBuildCorsHeaders).toHaveBeenCalledWith({
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['*'],
      allowOrigins: ['https://example.com'],
    });
    expect((result as any).headers).toEqual({
      'Access-Control-Allow-Origin': '*',
    });
  });

  it('should merge response headers with default and CORS headers', async () => {
    const mockResponse = {
      statusCode: 200,
      body: 'test',
      headers: { 'X-Response-Header': 'response-value' },
    };
    mockHandler.mockResolvedValue(mockResponse);

    const options: ApiHandlerOptions = {
      defaultHeaders: { 'X-Default-Header': 'default-value' },
      cors: { allowOrigins: ['https://example.com'] },
    };

    const wrappedHandler = apiHandler(mockHandler, options);
    const result = await wrappedHandler(mockEvent);

    expect((result as any).headers).toEqual({
      'X-Default-Header': 'default-value',
      'Access-Control-Allow-Origin': '*',
      'X-Response-Header': 'response-value',
    });
  });

  it('should handle preflight requests', async () => {
    mockIsPreflight.mockReturnValue(true);

    const options: ApiHandlerOptions = {
      cors: { allowOrigins: ['https://example.com'] },
    };

    const wrappedHandler = apiHandler(mockHandler, options);
    const result = await wrappedHandler(mockEvent);

    expect(mockIsPreflight).toHaveBeenCalledWith(mockEvent);
    expect(mockPreflightResponse).toHaveBeenCalledWith({ 'Access-Control-Allow-Origin': '*' });
    expect(result).toEqual({
      statusCode: 200,
      body: 'OK',
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should handle handler errors', async () => {
    const error = new Error('Handler error');
    mockHandler.mockRejectedValue(error);

    const wrappedHandler = apiHandler(mockHandler);
    const result = await wrappedHandler(mockEvent);

    expect(mockMapError).toHaveBeenCalledWith(error, { requestId: 'test-request-id' });
    expect(result).toEqual({
      statusCode: 500,
      body: 'Internal Server Error',
      headers: {},
    });
  });

  it('should extract request id from headers when requestContext is missing', async () => {
    const error = new Error('Handler error');
    mockHandler.mockRejectedValue(error);

    const eventWithoutRequestContext = {
      ...mockEvent,
      requestContext: {},
    };

    const wrappedHandler = apiHandler(mockHandler);
    await wrappedHandler(eventWithoutRequestContext);

    expect(mockMapError).toHaveBeenCalledWith(error, { requestId: 'test-request-id' });
  });

  it('should extract request id from X-Request-Id header (case insensitive)', async () => {
    const error = new Error('Handler error');
    mockHandler.mockRejectedValue(error);

    const eventWithUpperCaseHeader = {
      ...mockEvent,
      headers: { 'X-Request-Id': 'upper-case-request-id' },
      requestContext: {},
    };

    const wrappedHandler = apiHandler(mockHandler);
    await wrappedHandler(eventWithUpperCaseHeader);

    expect(mockMapError).toHaveBeenCalledWith(error, { requestId: 'upper-case-request-id' });
  });

  it('should handle missing request id', async () => {
    const error = new Error('Handler error');
    mockHandler.mockRejectedValue(error);

    const eventWithoutRequestId = {
      ...mockEvent,
      requestContext: {},
      headers: {},
    };

    const wrappedHandler = apiHandler(mockHandler);
    await wrappedHandler(eventWithoutRequestId);

    expect(mockMapError).toHaveBeenCalledWith(error, { requestId: undefined });
  });

  it('should handle response with undefined body', async () => {
    const mockResponse = { statusCode: 204, body: undefined };
    mockHandler.mockResolvedValue(mockResponse);

    const wrappedHandler = apiHandler(mockHandler);
    const result = await wrappedHandler(mockEvent);

    expect(result).toEqual({
      statusCode: 204,
      body: undefined,
      headers: {},
    });
  });

  it('should handle response without headers', async () => {
    const mockResponse = { statusCode: 200, body: 'test' };
    mockHandler.mockResolvedValue(mockResponse);

    const wrappedHandler = apiHandler(mockHandler);
    const result = await wrappedHandler(mockEvent);

    expect((result as any).headers).toEqual({});
  });

  it('should not handle preflight when CORS is not configured', async () => {
    mockIsPreflight.mockReturnValue(true);

    const wrappedHandler = apiHandler(mockHandler);
    const result = await wrappedHandler(mockEvent);

    expect(mockIsPreflight).not.toHaveBeenCalled();
    expect(mockPreflightResponse).not.toHaveBeenCalled();
    expect(mockHandler).toHaveBeenCalledWith(mockEvent);
  });
});