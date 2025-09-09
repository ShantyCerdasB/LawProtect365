import {
  json,
  ok,
  created,
  noContent,
  badRequest,
  unauthorized,
  accepted,
  forbidden,
  notFound,
  conflict,
  unsupportedMedia,
  unprocessable,
  tooManyRequests,
  internalError,
  notImplemented,
} from '../../src/http/responses.js';
import { HttpStatus } from '../../src/http/httpTypes.js';

describe('json', () => {
  it('should create JSON response with status code and data', () => {
    const data = { message: 'test' };
    const response = json(HttpStatus.OK, data);

    expect(response).toEqual({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(data),
    });
  });

  it('should create JSON response with status code and no data', () => {
    const response = json(HttpStatus.NO_CONTENT);

    expect(response).toEqual({
      statusCode: 204,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: '',
    });
  });

  it('should create JSON response with custom headers', () => {
    const data = { message: 'test' };
    const headers = { 'X-Custom-Header': 'custom-value' };
    const response = json(HttpStatus.OK, data, headers);

    expect(response).toEqual({
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Custom-Header': 'custom-value',
      },
      body: JSON.stringify(data),
    });
  });

  it('should handle undefined data', () => {
    const response = json(HttpStatus.OK, undefined);

    expect(response).toEqual({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: '',
    });
  });

  it('should handle null data', () => {
    const response = json(HttpStatus.OK, null);

    expect(response).toEqual({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: 'null',
    });
  });
});

describe('ok', () => {
  it('should create 200 OK response with data', () => {
    const data = { message: 'success' };
    const response = ok(data);

    expect(response).toEqual({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(data),
    });
  });

  it('should create 200 OK response without data', () => {
    const response = ok();

    expect(response).toEqual({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: '',
    });
  });

  it('should create 200 OK response with custom headers', () => {
    const data = { message: 'success' };
    const headers = { 'X-Custom-Header': 'custom-value' };
    const response = ok(data, headers);

    expect(response).toEqual({
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Custom-Header': 'custom-value',
      },
      body: JSON.stringify(data),
    });
  });
});

describe('created', () => {
  it('should create 201 Created response with data', () => {
    const data = { id: 123, message: 'created' };
    const response = created(data);

    expect(response).toEqual({
      statusCode: 201,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(data),
    });
  });

  it('should create 201 Created response without data', () => {
    const response = created();

    expect(response).toEqual({
      statusCode: 201,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: '',
    });
  });

  it('should create 201 Created response with custom headers', () => {
    const data = { id: 123 };
    const headers = { 'Location': '/api/users/123' };
    const response = created(data, headers);

    expect(response).toEqual({
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Location': '/api/users/123',
      },
      body: JSON.stringify(data),
    });
  });
});

describe('noContent', () => {
  it('should create 204 No Content response', () => {
    const response = noContent();

    expect(response).toEqual({
      statusCode: 204,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: '',
    });
  });

  it('should create 204 No Content response with custom headers', () => {
    const headers = { 'X-Custom-Header': 'custom-value' };
    const response = noContent(headers);

    expect(response).toEqual({
      statusCode: 204,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Custom-Header': 'custom-value',
      },
      body: '',
    });
  });
});

describe('accepted', () => {
  it('should create 202 Accepted response with data', () => {
    const data = { message: 'accepted' };
    const response = accepted(data);

    expect(response).toEqual({
      statusCode: 202,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(data),
    });
  });

  it('should create 202 Accepted response without data', () => {
    const response = accepted();

    expect(response).toEqual({
      statusCode: 202,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: '',
    });
  });

  it('should create 202 Accepted response with custom headers', () => {
    const data = { message: 'accepted' };
    const headers = { 'X-Custom-Header': 'custom-value' };
    const response = accepted(data, headers);

    expect(response).toEqual({
      statusCode: 202,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Custom-Header': 'custom-value',
      },
      body: JSON.stringify(data),
    });
  });
});

describe('badRequest', () => {
  it('should create 400 Bad Request response with default message', () => {
    const response = badRequest();

    expect(response).toEqual({
      statusCode: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'BadRequest', message: 'Bad Request' }),
    });
  });

  it('should create 400 Bad Request response with custom message', () => {
    const response = badRequest('Invalid input');

    expect(response).toEqual({
      statusCode: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'BadRequest', message: 'Invalid input' }),
    });
  });

  it('should create 400 Bad Request response with message and details', () => {
    const details = { field: 'email', issue: 'invalid format' };
    const response = badRequest('Invalid input', details);

    expect(response).toEqual({
      statusCode: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'BadRequest', message: 'Invalid input', details }),
    });
  });
});

describe('unauthorized', () => {
  it('should create 401 Unauthorized response with default message', () => {
    const response = unauthorized();

    expect(response).toEqual({
      statusCode: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'Unauthorized', message: 'Unauthorized' }),
    });
  });

  it('should create 401 Unauthorized response with custom message', () => {
    const response = unauthorized('Invalid credentials');

    expect(response).toEqual({
      statusCode: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'Unauthorized', message: 'Invalid credentials' }),
    });
  });
});

describe('forbidden', () => {
  it('should create 403 Forbidden response with default message', () => {
    const response = forbidden();

    expect(response).toEqual({
      statusCode: 403,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'Forbidden', message: 'Forbidden' }),
    });
  });

  it('should create 403 Forbidden response with custom message', () => {
    const response = forbidden('Access denied');

    expect(response).toEqual({
      statusCode: 403,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'Forbidden', message: 'Access denied' }),
    });
  });
});

describe('notFound', () => {
  it('should create 404 Not Found response with default message', () => {
    const response = notFound();

    expect(response).toEqual({
      statusCode: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'NotFound', message: 'Not Found' }),
    });
  });

  it('should create 404 Not Found response with custom message', () => {
    const response = notFound('Resource not found');

    expect(response).toEqual({
      statusCode: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'NotFound', message: 'Resource not found' }),
    });
  });
});

describe('conflict', () => {
  it('should create 409 Conflict response with default message', () => {
    const response = conflict();

    expect(response).toEqual({
      statusCode: 409,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'Conflict', message: 'Conflict' }),
    });
  });

  it('should create 409 Conflict response with custom message', () => {
    const response = conflict('Resource already exists');

    expect(response).toEqual({
      statusCode: 409,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'Conflict', message: 'Resource already exists' }),
    });
  });
});

describe('unsupportedMedia', () => {
  it('should create 415 Unsupported Media Type response with default message', () => {
    const response = unsupportedMedia();

    expect(response).toEqual({
      statusCode: 415,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'UnsupportedMediaType', message: 'Unsupported Media Type' }),
    });
  });

  it('should create 415 Unsupported Media Type response with custom message', () => {
    const response = unsupportedMedia('Only JSON is supported');

    expect(response).toEqual({
      statusCode: 415,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'UnsupportedMediaType', message: 'Only JSON is supported' }),
    });
  });
});

describe('unprocessable', () => {
  it('should create 422 Unprocessable Entity response with default message', () => {
    const response = unprocessable();

    expect(response).toEqual({
      statusCode: 422,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'UnprocessableEntity', message: 'Unprocessable Entity' }),
    });
  });

  it('should create 422 Unprocessable Entity response with custom message', () => {
    const response = unprocessable('Validation failed');

    expect(response).toEqual({
      statusCode: 422,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'UnprocessableEntity', message: 'Validation failed' }),
    });
  });

  it('should create 422 Unprocessable Entity response with message and details', () => {
    const details = { field: 'email', issue: 'required' };
    const response = unprocessable('Validation failed', details);

    expect(response).toEqual({
      statusCode: 422,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'UnprocessableEntity', message: 'Validation failed', details }),
    });
  });
});

describe('tooManyRequests', () => {
  it('should create 429 Too Many Requests response with default message', () => {
    const response = tooManyRequests();

    expect(response).toEqual({
      statusCode: 429,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'TooManyRequests', message: 'Too Many Requests' }),
    });
  });

  it('should create 429 Too Many Requests response with custom message', () => {
    const response = tooManyRequests('Rate limit exceeded');

    expect(response).toEqual({
      statusCode: 429,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'TooManyRequests', message: 'Rate limit exceeded' }),
    });
  });
});

describe('internalError', () => {
  it('should create 500 Internal Error response with default message', () => {
    const response = internalError();

    expect(response).toEqual({
      statusCode: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'InternalError', message: 'Internal Error' }),
    });
  });

  it('should create 500 Internal Error response with custom message', () => {
    const response = internalError('Something went wrong');

    expect(response).toEqual({
      statusCode: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'InternalError', message: 'Something went wrong' }),
    });
  });
});

describe('notImplemented', () => {
  it('should create 501 Not Implemented response with default message', () => {
    const response = notImplemented();

    expect(response).toEqual({
      statusCode: 501,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'NotImplemented', message: 'Not Implemented' }),
    });
  });

  it('should create 501 Not Implemented response with custom message', () => {
    const response = notImplemented('Feature not available');

    expect(response).toEqual({
      statusCode: 501,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'NotImplemented', message: 'Feature not available' }),
    });
  });
});