/**
 * @file appError.test.ts
 * @summary Tests for AppError (100% line & branch coverage).
 */

import { AppError } from '../../src/errors/AppError';

describe('AppError', () => {
  it('sets code, status, message, details, cause, name, and isOperational', () => {
    const details = { foo: 'bar' };
    const cause = new Error('root-cause');

    const err = new AppError('AUTH_UNAUTHORIZED', 401, 'Nope', details, cause);

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);

    expect(err.name).toBe('AppError');
    expect(err.code).toBe('AUTH_UNAUTHORIZED');
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Nope');
    expect(err.details).toBe(details);
    expect(err.cause).toBe(cause);
    expect(err.isOperational).toBe(true);

    // JSON representation is safe for clients (no stack)
    expect(err.toJSON()).toEqual({
      error: 'AUTH_UNAUTHORIZED',
      message: 'Nope',
      details,
      statusCode: 401,
    });
  });

  it('defaults message to the code when message is not provided', () => {
    const err = new AppError('SOME_CODE', 400);

    expect(err.message).toBe('SOME_CODE');
    expect(err.toJSON()).toEqual({
      error: 'SOME_CODE',
      message: 'SOME_CODE',
      details: undefined,
      statusCode: 400,
    });
  });

  it('invokes Error.captureStackTrace when available with the subclass constructor', () => {
    const original = (Error as any).captureStackTrace;
    const spy = jest.fn();
    (Error as any).captureStackTrace = spy;

    class NotFoundError extends AppError<'NOT_FOUND'> {}

    const err = new NotFoundError('NOT_FOUND', 404, 'Missing');

    expect(spy).toHaveBeenCalledTimes(1);
    const [instance, ctor] = spy.mock.calls[0];
    expect(instance).toBe(err);
    expect(ctor).toBe(NotFoundError); // new.target passed through

    (Error as any).captureStackTrace = original;
  });

  it('does not throw when Error.captureStackTrace is not available', () => {
    const original = (Error as any).captureStackTrace;
    // Remove captureStackTrace to exercise the falsey branch
    delete (Error as any).captureStackTrace;

    expect(() => new AppError('X', 418, undefined, { a: 1 }, 'c')).not.toThrow();

    // Restore
    (Error as any).captureStackTrace = original;
  });
});
