/**
 * @file Result.test.ts
 * @summary Runtime unit tests for Result<T, E> utilities.
 * @remarks
 * Place next to `Result.ts` (e.g., `packages/shared-ts/src/app/Result.test.ts`).
 */

import { ok, err, map, mapErr, andThen, unwrap, unwrapOr, type Result } from '../../src/app/Result';

describe('Result', () => {
  it('creates Ok results', () => {
    const r = ok(42);
    expect(r.ok).toBe(true);
    // @ts-ignore - runtime check only
    expect(r.value).toBe(42);
  });

  it('creates Err results', () => {
    const e = new Error('boom');
    const r = err(e);
    expect(r.ok).toBe(false);
    // @ts-ignore - runtime check only
    expect(r.error).toBe(e);
  });

  it('maps only Ok values', () => {
    const fn = jest.fn((n: number) => n * 2);

    const r1 = map(ok(3), fn);
    expect(r1.ok).toBe(true);
    // @ts-ignore - runtime check only
    expect(r1.value).toBe(6);
    expect(fn).toHaveBeenCalledTimes(1);

    const e = err('nope' as const);
    const r2 = map<number, number, 'nope'>(e, fn);
    expect(r2).toBe(e);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('maps only Err values', () => {
    const fn = jest.fn((s: string) => `E:${s}`);

    const e = err('fail');
    const r1 = mapErr<number, string, string>(e, fn);
    expect(r1.ok).toBe(false);
    // @ts-ignore - runtime check only
    expect(r1.error).toBe('E:fail');
    expect(fn).toHaveBeenCalledTimes(1);

    const o = ok(7);
    const r2 = mapErr(o, fn);
    expect(r2).toBe(o);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('chains with andThen', () => {
    const next = (n: number): Result<string, never> =>
      n % 2 === 0 ? ok(`even:${n}`) : err('odd not allowed' as never);

    const r1 = andThen(ok(4), next);
    expect(r1.ok).toBe(true);
    // @ts-ignore - runtime check only
    expect(r1.value).toBe('even:4');

    const r2 = andThen(ok(3) as Result<number, string>, () => err('odd not allowed'));
    expect(r2.ok).toBe(false);
    // @ts-ignore - runtime check only
    expect(r2.error).toBe('odd not allowed');

    const prior = err('prior failure' as const);
    const r3 = andThen<number, string, 'prior failure'>(prior, (n) => ok(String(n)));
    expect(r3).toBe(prior);
  });

  it('unwrap returns value for Ok and throws for Err', () => {
    expect(unwrap(ok('data'))).toBe('data');

    const boom = new Error('explode');
    expect(() => unwrap(err(boom))).toThrow(boom);

    const payload = { code: 123 };
    try {
      unwrap(err(payload));
      fail('expected throw');
    } catch (t) {
      expect(t).toBe(payload);
    }
  });

  it('unwrapOr returns fallback on Err', () => {
    expect(unwrapOr(ok(10), 99)).toBe(10);
    expect(unwrapOr(err('x'), 99)).toBe(99);
  });
});
