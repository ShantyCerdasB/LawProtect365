/**
 * @file controllerFactory.test.ts
 * @summary Tests for controllerFactory (100% line & branch coverage).
 */

// Mock using the exact specifier the SUT uses
jest.mock('../../src/http/middleware.js', () => ({
  compose: jest.fn(),
}));

import { controllerFactory } from '../../src/http/controllerFactory.js';
import { compose } from '../../src/http/middleware.js';

const composeMock = compose as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('controllerFactory', () => {
  it('builds a pipeline with empty arrays when options are omitted and returns the composed handler', async () => {
    const handler = jest.fn();
    const composed = jest.fn(async () => ({ statusCode: 200, body: 'ok' }));
    composeMock.mockReturnValueOnce(composed);

    const wrapped = controllerFactory(handler);

    // compose is invoked with the handler and an empty pipeline
    expect(composeMock).toHaveBeenCalledTimes(1);
    const [passedHandler, pipe] = composeMock.mock.calls[0];
    expect(passedHandler).toBe(handler);
    expect(pipe).toEqual({ before: [], after: [], onError: [] });

    // factory returns what compose returns
    expect(wrapped).toBe(composed);
  });

  it('passes through provided before/after/onError arrays unchanged', async () => {
    const handler = jest.fn();
    const composed = jest.fn();
    composeMock.mockReturnValueOnce(composed);

    // Use identity-distinct arrays to assert they are forwarded as-is
    const before = [jest.fn()] as any;
    const after = [jest.fn()] as any;
    const onError = [jest.fn()] as any;

    const wrapped = controllerFactory(handler, { before, after, onError });

    expect(wrapped).toBe(composed);
    expect(composeMock).toHaveBeenCalledTimes(1);

    const [, pipe] = composeMock.mock.calls[0];
    expect(pipe.before).toBe(before);
    expect(pipe.after).toBe(after);
    expect(pipe.onError).toBe(onError);
  });
});
