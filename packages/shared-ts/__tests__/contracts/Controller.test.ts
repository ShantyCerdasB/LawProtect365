/**
 * @file controller.test.ts
 * @summary Tests for composeController (100% line & branch coverage).
 */

import { composeController } from '../../src/contracts/index.js';
import type { Controller, Middleware } from '../../src/contracts/index.js';

describe('composeController', () => {
  /**
   * Ensures that when no middlewares are provided, the returned controller
   * is the core handler itself and is invoked as-is.
   */
  it('returns the core when no middlewares are provided', async () => {
    const core: Controller<number, number, { mul: number }> = jest.fn(async (n, ctx) => n * (ctx?.mul ?? 1));
    const composed = composeController(core);

    // With an empty chain, reduceRight returns the initial value (the core)
    expect(composed).toBe(core);

    const out = await composed(3, { mul: 4 });
    expect(out).toBe(12);
    expect(core).toHaveBeenCalledWith(3, { mul: 4 });
  });

  /**
   * Verifies left-to-right composition semantics and wrapping order:
   * last middleware is closest to the core. Also validates request/result
   * transformations and before/after execution ordering.
   */
  it('composes middlewares left-to-right; last wraps closest to the core', async () => {
    const order: string[] = [];

    const core: Controller<string, string> = async (req) => {
      order.push('core');
      return req + 'C';
    };

    const m1: Middleware<string, string> = (next) => async (req, ctx) => {
      order.push('m1:before');
      const r = await next(req + '1', ctx);
      order.push('m1:after');
      return r + '1';
    };

    const m2: Middleware<string, string> = (next) => async (req, ctx) => {
      order.push('m2:before');
      const r = await next(req + '2', ctx);
      order.push('m2:after');
      return r + '2';
    };

    const m3: Middleware<string, string> = (next) => async (req, ctx) => {
      order.push('m3:before');
      const r = await next(req + '3', ctx);
      order.push('m3:after');
      return r + '3';
    };

    const composed = composeController(core, { middlewares: [m1, m2, m3] });

    const out = await composed('X');

    expect(order).toEqual([
      'm1:before',
      'm2:before',
      'm3:before',
      'core',
      'm3:after',
      'm2:after',
      'm1:after',
    ]);

    // Input flow: 'X' -> +1 -> +2 -> +3 -> core ('X123C')
    // Output flow: <- +3 <- +2 <- +1  => 'X123C321'
    expect(out).toBe('X123C321');
  });

  /**
   * Ensures context is passed through and can be augmented by middlewares.
   * Also validates that a readonly middleware array is accepted.
   * Fixes type by guaranteeing required "add" is present in the forwarded context.
   */
  it('passes context through the chain and supports readonly middleware arrays', async () => {
    type Ctx = { add: number; tag?: string[] };

    const core: Controller<number, number, Ctx> = async (n, ctx) => {
      expect(ctx?.tag).toEqual(['start', 'mw']);
      return n + (ctx?.add ?? 0);
    };

    const mAdd: Middleware<number, number, Ctx> =
      (next) => async (n, ctx) =>
        next(n + 1, {
          add: ctx?.add ?? 0, // ensure required property is present
          tag: [...(ctx?.tag ?? []), 'mw'],
        });

    const middlewares = Object.freeze([mAdd] as const);

    const composed = composeController(core, { middlewares });
    const res = await composed(10, { add: 5, tag: ['start'] });

    // (10 + 1) then core adds +5 from context => 16
    expect(res).toBe(16);
  });

  /**
   * Ensures errors thrown by the core (or a middleware) propagate to the caller.
   */
  it('propagates errors thrown by the core or middleware', async () => {
    const err = new Error('boom');
    const core: Controller<void, void> = async () => {
      throw err;
    };
    const passthrough: Middleware<void, void> = (next) => async () => {
      await next();
    };

    const composed = composeController(core, { middlewares: [passthrough] });
    await expect(composed(undefined as any)).rejects.toBe(err);
  });
});
