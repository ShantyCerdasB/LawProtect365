/**
 * @file middleware.test.ts
 * @summary Tests for compose (100% line & branch coverage).
 */

import { compose } from '../../src/http/middleware.js';
import type { ApiEvent } from '../../src/http/httpTypes.js';

const makeEvent = (over: Partial<ApiEvent> = {}): ApiEvent =>
  ({
    headers: {},
    requestContext: { http: { method: 'GET' } },
    ...over} as any);

describe('compose', () => {
  it('returns base result when no middlewares provided (defaults to empty arrays)', async () => {
    const base = jest.fn(async () => 'ok');
    const handler = compose(base);

    const res = await handler(makeEvent());

    expect(res).toBe('ok');
    expect(base).toHaveBeenCalledTimes(1);
  });

  it('executes before middlewares, short-circuiting when one returns a response', async () => {
    const base = jest.fn();
    const b1 = jest.fn(async () => undefined); // continue
    const b2 = jest.fn(async () => ({ statusCode: 204, body: '' })); // short-circuit
    const b3 = jest.fn(); // never called

    const handler = compose(base, { before: [b1, b2, b3] });

    const res = await handler(makeEvent());

    expect(res).toEqual({ statusCode: 204, body: '' });
    expect(b1).toHaveBeenCalledTimes(1);
    expect(b2).toHaveBeenCalledTimes(1);
    expect(b3).not.toHaveBeenCalled();
    expect(base).not.toHaveBeenCalled();
  });

  it('runs after middlewares in order, passing and transforming the response', async () => {
    const base = jest.fn(async () => ({ statusCode: 200, body: 'A', headers: { H: '1' } }));

    const a1 = jest.fn(async (_evt, res) => ({
      ...res,
      body: (res.body as string) + 'B',
      headers: { ...res.headers, A1: 'x' }}));
    const a2 = jest.fn(async (_evt, res) => ({
      ...res,
      statusCode: 201,
      body: (res.body as string) + 'C',
      headers: { ...res.headers, A2: 'y' }}));

    const handler = compose(base, { after: [a1, a2] });

    const res = await handler(makeEvent());
    expect(res).toEqual({
      statusCode: 201,
      body: 'ABC',
      headers: { H: '1', A1: 'x', A2: 'y' }});

    expect(a1).toHaveBeenCalledTimes(1);
    expect(a2).toHaveBeenCalledTimes(1);
  });

  it('invokes onError middlewares when base throws; continues if one throws and uses the next successful one', async () => {
    const err = new Error('boom');
    const base = jest.fn(async () => {
      throw err;
    });

    const h1 = jest.fn(async () => {
      throw new Error('handler-failed');
    });
    const h2 = jest.fn(async () => ({ statusCode: 500, body: 'handled' }));

    const handler = compose(base, { onError: [h1, h2] });

    const res = await handler(makeEvent());

    expect(res).toEqual({ statusCode: 500, body: 'handled' });
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('routes errors from before middlewares into onError handlers', async () => {
    const base = jest.fn();
    const beforeErr = new Error('pre');
    const b1 = jest.fn(async () => {
      throw beforeErr;
    });

    const h = jest.fn(async (_evt, e: unknown) => {
      expect(e).toBe(beforeErr);
      return { statusCode: 400, body: 'pre-error' };
    });

    const handler = compose(base, { before: [b1], onError: [h] });

    const res = await handler(makeEvent());
    expect(res).toEqual({ statusCode: 400, body: 'pre-error' });
    expect(base).not.toHaveBeenCalled();
  });

  it('rethrows the original error when all onError handlers fail or are absent', async () => {
    const original = new Error('no-handler');
    const base = jest.fn(async () => {
      throw original;
    });

    // No onError handlers -> should rethrow
    const handler1 = compose(base, {});
    await expect(handler1(makeEvent())).rejects.toBe(original);

    // onError handlers present but all throw -> should rethrow original
    const h1 = jest.fn(async () => {
      throw new Error('first-ohno');
    });
    const h2 = jest.fn(async () => {
      throw new Error('second-ohno');
    });

    const handler2 = compose(base, { onError: [h1, h2] });
    await expect(handler2(makeEvent())).rejects.toBe(original);

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });
});
