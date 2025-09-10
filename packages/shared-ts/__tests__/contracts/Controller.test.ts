// tests/controller.test.ts
/**
 * @file controller.test.ts
 * @summary Tests for composeController using classic and phase-based middlewares.
 */

import {
  composeController} from '../../src/contracts/index.js';
import type {
  Controller,
  ControllerMiddleware,
  CtrBeforeMiddleware,
  CtrAfterMiddleware,
  CtrOnErrorMiddleware} from '../../src/contracts/index.js';

describe('composeController', () => {
  /**
   * Ensures the returned controller is a wrapper that invokes the core
   * when no classic middlewares are provided.
   */
  it('wraps the core and calls it as-is when no classic middlewares are provided', async () => {
    const core: Controller<number, number, { mul: number }> = jest.fn(async (n, ctx) => n * (ctx?.mul ?? 1));
    const composed = composeController(core);

    expect(composed).not.toBe(core);

    const out = await composed(3, { mul: 4 });
    expect(out).toBe(12);
    expect(core).toHaveBeenCalledWith(3, { mul: 4 });
  });

  /**
   * Verifies left-to-right composition for classic middlewares and the
   * execution order of phase-based middlewares (before → core → after).
   */
  it('composes classic middlewares left-to-right and respects phase order', async () => {
    const order: string[] = [];

    const core: Controller<string, string> = async (req) => {
      order.push('core');
      return req + 'C';
    };

    const m1: ControllerMiddleware<string, string> = (next) => async (req, ctx) => {
      order.push('m1:before');
      const r = await next(req + '1', ctx);
      order.push('m1:after');
      return r + '1';
    };

    const m2: ControllerMiddleware<string, string> = (next) => async (req, ctx) => {
      order.push('m2:before');
      const r = await next(req + '2', ctx);
      order.push('m2:after');
      return r + '2';
    };

    const m3: ControllerMiddleware<string, string> = (next) => async (req, ctx) => {
      order.push('m3:before');
      const r = await next(req + '3', ctx);
      order.push('m3:after');
      return r + '3';
    };

    const b1: CtrBeforeMiddleware<string> = async () => {
      order.push('before:1');
    };
    const b2: CtrBeforeMiddleware<string> = async () => {
      order.push('before:2');
    };

    // a1 preserves the result by returning undefined
    const a1: CtrAfterMiddleware<string, string> = async () => {
      order.push('after:1(undefined)');
      return undefined;
    };
    // a2 replaces the result
    const a2: CtrAfterMiddleware<string, string> = async (_req, res) => {
      order.push('after:2(set)');
      return res + 'A';
    };

    const composed = composeController(core, {
      middlewares: [m1, m2, m3],
      before: [b1, b2],
      after: [a1, a2]});

    const out = await composed('X');

    expect(order).toEqual([
      'm1:before',
      'm2:before',
      'm3:before',
      'before:1',
      'before:2',
      'core',
      'after:1(undefined)',
      'after:2(set)',
      'm3:after',
      'm2:after',
      'm1:after',
    ]);

    // Input:  X -> +1 -> +2 -> +3 -> core => X123C
    // After:  a1 (no change), a2 (+A) => X123CA
    // Output: +3 +2 +1 => X123CA321
    expect(out).toBe('X123CA321');
  });

  /**
   * Ensures context is passed and can be augmented; also validates that
   * a readonly array of classic middlewares is accepted.
   */
  it('passes context through and supports readonly middleware arrays', async () => {
    type Ctx = { add: number; tag?: string[] };

    const core: Controller<number, number, Ctx> = async (n, ctx) => {
      expect(ctx?.tag).toEqual(['start', 'mw']);
      return n + (ctx?.add ?? 0);
    };

    const mAdd: ControllerMiddleware<number, number, Ctx> =
      (next) => async (n, ctx) =>
        next(n + 1, {
          add: ctx?.add ?? 0,
          tag: [...(ctx?.tag ?? []), 'mw']});

    const middlewares = Object.freeze([mAdd] as const);

    const composed = composeController(core, { middlewares });
    const res = await composed(10, { add: 5, tag: ['start'] });

    expect(res).toBe(16);
  });

  /**
   * Ensures that when onError handlers return undefined (i.e., do not handle),
   * the original error is rethrown to the caller.
   */
  it('rethrows when onError handlers do not handle the error', async () => {
    const boom = new Error('boom');

    const core: Controller<void, void> = async () => {
      throw boom;
    };

    const oe1: CtrOnErrorMiddleware<void, void> = async (err) => {
      expect(err).toBe(boom);
      return undefined;
    };

    const composed = composeController(core, { onError: [oe1] });
    await expect(composed(undefined as any)).rejects.toBe(boom);
  });

  /**
   * Uses the first onError handler that returns a defined result to recover.
   */
  it('uses the first onError that returns a defined result', async () => {
    const boom = new Error('kaput');
    const order: string[] = [];

    const core: Controller<number, string> = async () => {
      throw boom;
    };

    const oe1: CtrOnErrorMiddleware<number, string> = async (err) => {
      order.push('oe1');
      expect(err).toBe(boom);
      return undefined;
    };

    const oe2: CtrOnErrorMiddleware<number, string> = async (err, req) => {
      order.push('oe2');
      expect(req).toBe(7);
      return `recovered:String((err as Error).message)`;
    };

    const oe3: CtrOnErrorMiddleware<number, string> = async () => {
      order.push('oe3'); // should not run
      return 'unreachable';
    };

    const composed = composeController(core, { onError: [oe1, oe2, oe3] });
    const out = await composed(7);

    expect(out).toBe('recovered:kaput');
    expect(order).toEqual(['oe1', 'oe2']);
  });

  /**
   * Ensures errors thrown inside a classic middleware propagate when unhandled.
   */
  it('propagates errors thrown inside a classic middleware when unhandled', async () => {
    const err = new Error('mw-explode');

    const core: Controller<void, void> = async () => {
      // core ok
    };

    const mw: ControllerMiddleware<void, void> = (_next) => async () => {
      throw err;
    };

    const composed = composeController(core, { middlewares: [mw] });
    await expect(composed(undefined as any)).rejects.toBe(err);
  });

  /**
   * Ensures after middlewares can preserve (return undefined) or replace the result.
   */
  it('after middlewares can preserve or replace the result', async () => {
    const core: Controller<string, string> = async (s) => s + 'C';

    const aNoop: CtrAfterMiddleware<string, string> = async () => undefined;
    const aSet: CtrAfterMiddleware<string, string> = async (_req, res) => res + 'A';

    const composed = composeController(core, { after: [aNoop, aSet] });

    const out = await composed('X');
    expect(out).toBe('XCA');
  });

  /**
   * Demonstrates that BEFORE middlewares can mutate object-shaped requests and context.
   */
  it('before middlewares run in order and can mutate object request and context', async () => {
    type Req = { n: number };
    type Ctx = { acc: number };

    const core: Controller<Req, number, Ctx> = async (req, ctx) => req.n + (ctx?.acc ?? 0);

    const b1: CtrBeforeMiddleware<Req, Ctx> = async (req, ctx) => {
      req.n += 2;            // mutate request object
      if (ctx) ctx.acc += 10; // mutate context
    };

    const mInc: ControllerMiddleware<Req, number, Ctx> =
      (next) => (req, ctx) => next({ n: req.n + 3 }, ctx);

    const composed = composeController(core, { before: [b1], middlewares: [mInc] });

    const out = await composed({ n: 5 }, { acc: 1 });
    // b1: n=7, acc=11; mInc: n=10; core: 10 + 11 = 21
    expect(out).toBe(21);
  });
});
