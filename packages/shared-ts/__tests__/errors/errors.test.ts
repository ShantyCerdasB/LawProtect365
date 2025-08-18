/**
 * @file errors.test.ts
 * @summary Tests for HttpError and its subclasses (100% line coverage).
 * @remarks
 * - Updated tests to align with constructors that now accept only `ErrorCode` (not arbitrary strings).
 * - Replaced custom string overrides with valid `ErrorCodes` constants.
 * - Typed the helper `expectDefault` to expect an `ErrorCode`.
 */

import {
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnsupportedMediaTypeError,
  UnprocessableEntityError,
  TooManyRequestsError,
  InternalError,
  NotImplementedError,
} from '../../src/errors/errors.js';
import { AppError } from '../../src/errors/AppError.js';
import { ErrorCodes, type ErrorCode } from '../../src/errors/codes.js';

const expectDefault = (
  err: AppError,
  {
    name,
    status,
    code,
    message,
  }: { name: string; status: number; code: ErrorCode; message: string }
) => {
  expect(err).toBeInstanceOf(Error);
  expect(err).toBeInstanceOf(AppError);
  expect(err).toBeInstanceOf(HttpError);
  expect(err.name).toBe(name);
  expect(err.statusCode).toBe(status);
  expect(err.code).toBe(code);
  expect(err.message).toBe(message);
  expect(err.isOperational).toBe(true);
  expect(err.details).toBeUndefined();
  expect(err.cause).toBeUndefined();
};

describe('HttpError subclasses (defaults)', () => {
  it('BadRequestError', () => {
    const err = new BadRequestError();
    expectDefault(err, {
      name: 'BadRequestError',
      status: 400,
      code: ErrorCodes.COMMON_BAD_REQUEST,
      message: 'Bad Request',
    });
  });

  it('UnauthorizedError', () => {
    const err = new UnauthorizedError();
    expectDefault(err, {
      name: 'UnauthorizedError',
      status: 401,
      code: ErrorCodes.AUTH_UNAUTHORIZED,
      message: 'Unauthorized',
    });
  });

  it('ForbiddenError', () => {
    const err = new ForbiddenError();
    expectDefault(err, {
      name: 'ForbiddenError',
      status: 403,
      code: ErrorCodes.AUTH_FORBIDDEN,
      message: 'Forbidden',
    });
  });

  it('NotFoundError', () => {
    const err = new NotFoundError();
    expectDefault(err, {
      name: 'NotFoundError',
      status: 404,
      code: ErrorCodes.COMMON_NOT_FOUND,
      message: 'Not Found',
    });
  });

  it('ConflictError', () => {
    const err = new ConflictError();
    expectDefault(err, {
      name: 'ConflictError',
      status: 409,
      code: ErrorCodes.COMMON_CONFLICT,
      message: 'Conflict',
    });
  });

  it('UnsupportedMediaTypeError', () => {
    const err = new UnsupportedMediaTypeError();
    expectDefault(err, {
      name: 'UnsupportedMediaTypeError',
      status: 415,
      code: ErrorCodes.COMMON_UNSUPPORTED_MEDIA_TYPE,
      message: 'Unsupported Media Type',
    });
  });

  it('UnprocessableEntityError', () => {
    const err = new UnprocessableEntityError();
    expectDefault(err, {
      name: 'UnprocessableEntityError',
      status: 422,
      code: ErrorCodes.COMMON_UNPROCESSABLE_ENTITY,
      message: 'Unprocessable Entity',
    });
  });

  it('TooManyRequestsError', () => {
    const err = new TooManyRequestsError();
    expectDefault(err, {
      name: 'TooManyRequestsError',
      status: 429,
      code: ErrorCodes.COMMON_TOO_MANY_REQUESTS,
      message: 'Too Many Requests',
    });
  });

  it('InternalError', () => {
    const err = new InternalError();
    expectDefault(err, {
      name: 'InternalError',
      status: 500,
      code: ErrorCodes.COMMON_INTERNAL_ERROR,
      message: 'Internal Error',
    });
  });

  it('NotImplementedError', () => {
    const err = new NotImplementedError();
    expectDefault(err, {
      name: 'NotImplementedError',
      status: 501,
      code: ErrorCodes.COMMON_NOT_IMPLEMENTED,
      message: 'Not Implemented',
    });
  });
});

describe('HttpError subclasses (overrides and JSON)', () => {
  it('allows overriding message, code and details; toJSON reflects values', () => {
    const details = { hint: 'use a different thing' };
    const err = new BadRequestError('Bad input', ErrorCodes.COMMON_CONFLICT, details);

    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Bad input');
    expect(err.code).toBe(ErrorCodes.COMMON_CONFLICT);
    expect(err.details).toBe(details);

    expect(err.toJSON()).toEqual({
      error: ErrorCodes.COMMON_CONFLICT,
      message: 'Bad input',
      details,
      statusCode: 400,
    });
  });

  it('other subclasses also accept overrides', () => {
    const e1 = new UnauthorizedError('No token', ErrorCodes.AUTH_FORBIDDEN, { field: 'Authorization' });
    expect(e1.statusCode).toBe(401);
    expect(e1.code).toBe(ErrorCodes.AUTH_FORBIDDEN);
    expect(e1.message).toBe('No token');

    const e2 = new NotFoundError('Missing thing', ErrorCodes.COMMON_CONFLICT, { id: '123' });
    expect(e2.statusCode).toBe(404);
    expect(e2.code).toBe(ErrorCodes.COMMON_CONFLICT);
    expect(e2.message).toBe('Missing thing');
  });
});
