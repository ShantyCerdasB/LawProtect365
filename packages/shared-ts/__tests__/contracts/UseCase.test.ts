/**
 * @file useCase.test.ts
 * @summary Tests for asUseCase (100% line coverage).
 */

import { asUseCase } from '../../src/contracts/index.js';

describe('asUseCase', () => {
  /**
   * Wraps an async function and exposes it as { execute }.
   * Verifies function identity and successful resolution without context.
   */
  it('adapts an async function and resolves results (no context)', async () => {
    const impl = jest.fn(async (input: { n: number }) => input.n * 2);
    const uc = asUseCase<{ n: number }, number>(impl);

    // The adapter should expose the same function reference under "execute"
    expect(uc.execute).toBe(impl);

    const out = await uc.execute({ n: 3 });
    expect(out).toBe(6);
    // Called with a single argument; do not assert an explicit undefined second arg
    expect(impl).toHaveBeenCalledWith({ n: 3 });
  });

  /**
   * Forwards the optional context to the underlying implementation.
   */
  it('forwards context to the underlying function', async () => {
    type Ctx = { factor: number };
    const impl = jest.fn(async (input: { n: number }, ctx?: Ctx) => input.n * (ctx?.factor ?? 1));
    const uc = asUseCase<{ n: number }, number, Ctx>(impl);

    const out = await uc.execute({ n: 4 }, { factor: 5 });
    expect(out).toBe(20);
    expect(impl).toHaveBeenCalledWith({ n: 4 }, { factor: 5 });
  });

  /**
   * Propagates rejections from the underlying function.
   */
  it('propagates errors from the implementation', async () => {
    const err = new Error('boom');
    const impl = jest.fn(async () => {
      throw err;
    });
    const uc = asUseCase<void, void>(impl);

    await expect(uc.execute()).rejects.toBe(err);
    expect(impl).toHaveBeenCalledTimes(1);
  });
});
