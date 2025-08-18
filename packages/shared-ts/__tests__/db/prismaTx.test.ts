/**
 * @file prismaTx.test.ts
 * @summary Tests for withTransaction (100% line & branch coverage).
 */

import { withTransaction } from '../../src/db/prismaTx.js';

type AnyFn = (...args: any[]) => any;

describe('withTransaction', () => {
  /**
   * Uses default options and propagates the callback result.
   * Verifies the transactional client is forwarded to the user callback.
   */
  it('applies default options and returns the callback result', async () => {
    const tx = { tx: true };
    const $transaction = jest.fn(async (cb: AnyFn, opts: unknown) => {
      // Execute the interactive transaction callback with our fake tx
      const result = await cb(tx);
      return result;
    });
    const prisma = { $transaction } as unknown as { $transaction: AnyFn };

    const userFn = jest.fn(async (client: unknown) => {
      expect(client).toBe(tx);
      return 123;
    });

    const out = await withTransaction(prisma as any, userFn);

    expect(out).toBe(123);
    expect($transaction).toHaveBeenCalledTimes(1);

    const [cb, opts] = $transaction.mock.calls[0];
    expect(typeof cb).toBe('function');
    expect(opts).toEqual({
      maxWait: 5000,
      timeout: 15000,
      isolationLevel: undefined,
    });

    expect(userFn).toHaveBeenCalledTimes(1);
    expect(userFn).toHaveBeenCalledWith(tx);
  });

  /**
   * Applies custom options, mapping maxWaitMs/timeoutMs/isolationLevel to Prisma's shape.
   */
  it('maps custom options to Prisma interactive transaction options', async () => {
    const tx = {};
    const $transaction = jest.fn(async (cb: AnyFn, _opts: unknown) => cb(tx));
    const prisma = { $transaction } as unknown as { $transaction: AnyFn };

    const iso = 'Serializable' as any; // Prisma.TransactionIsolationLevel
    const userFn = jest.fn(async () => 'ok');

    const result = await withTransaction(prisma as any, userFn, {
      maxWaitMs: 100,
      timeoutMs: 200,
      isolationLevel: iso,
    });

    expect(result).toBe('ok');

    const [, opts] = $transaction.mock.calls[0];
    expect(opts).toEqual({
      maxWait: 100,
      timeout: 200,
      isolationLevel: iso,
    });
  });

  /**
   * Propagates rejection when the user callback throws inside the interactive transaction.
   */
  it('propagates errors thrown by the callback', async () => {
    const tx = {};
    const $transaction = jest.fn(async (cb: AnyFn, _opts: unknown) => cb(tx));
    const prisma = { $transaction } as unknown as { $transaction: AnyFn };

    const err = new Error('boom');
    const userFn = jest.fn(async () => {
      throw err;
    });

    await expect(withTransaction(prisma as any, userFn)).rejects.toBe(err);
    expect(userFn).toHaveBeenCalledTimes(1);
  });

  /**
   * Propagates rejection when Prisma's $transaction itself rejects.
   */
  it('propagates errors from $transaction', async () => {
    const fail = new Error('tx failed');
    const $transaction = jest.fn(async () => {
      throw fail;
    });
    const prisma = { $transaction } as unknown as { $transaction: AnyFn };

    const userFn = jest.fn(async () => 'unused');

    await expect(withTransaction(prisma as any, userFn)).rejects.toBe(fail);
    expect(userFn).not.toHaveBeenCalled();
  });
});
