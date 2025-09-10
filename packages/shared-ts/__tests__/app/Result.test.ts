// tests/Result.test.ts
/**
 * @file Result.test.ts
 * @summary Runtime unit tests for Result<T, E> utilities.
 */

import {
  resultOk,
  resultErr,
  resultMap,
  resultMapErr,
  resultAndThen,
  resultUnwrap,
  resultUnwrapOr,
  type Result} from '../../src/app/Result';

describe('Result', () => {
  it('creates Ok results', () => {
    const r = resultOk(42);
    expect(r.ok).toBe(true);
    // @ts-ignore runtime-only
    expect(r.value).toBe(42);
  });

  it('creates Err results', () => {
    const e = new Error('boom');
    const r = resultErr(e);
    expect(r.ok).toBe(false);
    // @ts-ignore runtime-only
    expect(r.error).toBe(e);
  });

  it('maps only Ok values', () => {
    const fn = jest.fn((n: number) => n * 2);

    const r1 = resultMap(resultOk(3), fn);
    expect(r1.ok).toBe(true);
    // @ts-ignore runtime-only
    expect(r1.value).toBe(6);
    expect(fn).toHaveBeenCalledTimes(1);

    const e = resultErr('nope' as const);
    const r2 = resultMap<number, number, 'nope'>(e, fn);
    expect(r2).toBe(e);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('maps only Err values', () => {
    const fn = jest.fn((s: string) => `E:s`);

    const e = resultErr('fail');
    const r1 = resultMapErr<number, string, string>(e, fn);
    expect(r1.ok).toBe(false);
    // @ts-ignore runtime-only
    expect(r1.error).toBe('E:fail');
    expect(fn).toHaveBeenCalledTimes(1);

    const o = resultOk(7);
    const r2 = resultMapErr(o, fn);
    expect(r2).toBe(o);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('chains with andThen', () => {
    const next = (n: number): Result<string, string> =>
      n % 2 === 0 ? resultOk(`even:n`) : resultErr('odd not allowed');

    const r1 = resultAndThen(resultOk(4), next);
    expect(r1.ok).toBe(true);
    // @ts-ignore runtime-only
    expect(r1.value).toBe('even:4');

    const r2 = resultAndThen(resultOk(3) as Result<number, string>, () => resultErr('odd not allowed'));
    expect(r2.ok).toBe(false);
    // @ts-ignore runtime-only
    expect(r2.error).toBe('odd not allowed');

    const prior = resultErr('prior failure' as const);
    const r3 = resultAndThen<number, string, 'prior failure'>(prior, (n) => resultOk(String(n)));
    expect(r3).toBe(prior);
  });

  it('unwrap returns value for Ok and throws for Err', () => {
    expect(resultUnwrap(resultOk('data'))).toBe('data');

    const boom = new Error('explode');
    expect(() => resultUnwrap(resultErr(boom))).toThrow(boom);

    const payload = { code: 123 };
    try {
      resultUnwrap(resultErr(payload));
      fail('expected throw');
    } catch (t) {
      expect(t).toBe(payload);
    }
  });

  it('unwrapOr returns fallback on Err', () => {
    expect(resultUnwrapOr(resultOk(10), 99)).toBe(10);
    expect(resultUnwrapOr(resultErr('x'), 99)).toBe(99);
  });
});
