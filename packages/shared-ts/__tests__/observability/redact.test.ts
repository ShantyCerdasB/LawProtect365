/**
 * @file redact.test.ts
 * @summary Tests for deepRedact (100% line & branch coverage).
 */

import { deepRedact } from '../../src/observability/redact.js';

describe('deepRedact', () => {
  it('redacts default sensitive fields case-insensitively and preserves primitives', () => {
    const input = {
      Authorization: 'Bearer abc',
      password: 'p@ss',
      APIKEY: 'k123',
      nested: {
        ToKeN: 't-1',
        keep: 42},
      arr: [
        { cvv: '999' },
        'plain',
        123,
        true,
        null,
      ]};

    const out = deepRedact(input);

    // default replacement token
    const R = '[REDACTED]';

    expect(out.Authorization).toBe(R);
    expect(out.password).toBe(R);
    expect(out.APIKEY).toBe(R);
    expect((out as any).nested.ToKeN).toBe(R);
    expect((out as any).nested.keep).toBe(42);

    // arrays supported; primitives untouched
    expect(Array.isArray((out as any).arr)).toBe(true);
    expect((out as any).arr[0].cvv).toBe(R);
    expect((out as any).arr[1]).toBe('plain');
    expect((out as any).arr[2]).toBe(123);
    expect((out as any).arr[3]).toBe(true);
    expect((out as any).arr[4]).toBe(null);

    // primitives passed directly return as-is
    expect(deepRedact('hello' as any)).toBe('hello');
    expect(deepRedact(99 as any)).toBe(99);
    expect(deepRedact(null as any)).toBeNull();
  });

  it('honors custom fields and replacement; defaults are not merged when fields is provided', () => {
    const input = {
      authorization: 'should-not-redact-when-custom-fields-used',
      custom: 'hide-me'};

    const out = deepRedact(input, { fields: ['custom'], replacement: '***' });

    // Only "custom" is redacted; "authorization" remains because defaults are replaced
    expect(out.custom).toBe('***');
    expect(out.authorization).toBe('should-not-redact-when-custom-fields-used');
  });

  it('respects maxDepth and leaves deeper values as-is once the limit is exceeded', () => {
    const input = {
      level0: {
        level1: {
          token: 'deep-secret',
          keep: 'v'}}};

    // With maxDepth=0, depth 1 objects are not traversed; nested token remains
    const out = deepRedact(input, { maxDepth: 0 });
    expect((out as any).level0.level1.token).toBe('deep-secret');
    expect((out as any).level0.level1.keep).toBe('v');

    // With a higher depth, the nested token is redacted
    const out2 = deepRedact(input, { maxDepth: 4 });
    expect((out2 as any).level0.level1.token).toBe('[REDACTED]');
    expect((out2 as any).level0.level1.keep).toBe('v');
  });

  it('handles cyclic structures without infinite recursion and returns already-seen objects directly', () => {
    // Build a cyclic structure
    const node: any = { token: 't' };
    node.self = node;
    const root = { node };

    const redacted = deepRedact(root);

    // The main node.token is redacted
    expect(redacted.node.token).toBe('[REDACTED]');

    // For the cyclic reference, implementation returns the already seen object (original)
    // Verify it did not throw and returned an object reference for `self`
    expect(typeof redacted.node.self).toBe('object');
    // Ensure we didn't accidentally mutate the original node object
    expect(node.token).toBe('t');
  });

  it('redacts inside arrays of objects and preserves array shape', () => {
    const input = [{ secret: 's1' }, { access_token: 's2' }, {}];
    const out = deepRedact(input);

    expect(Array.isArray(out)).toBe(true);
    expect((out as any)[0].secret).toBe('[REDACTED]');
    expect((out as any)[1].access_token).toBe('[REDACTED]');
    expect((out as any)[2]).toEqual({});
  });
});
