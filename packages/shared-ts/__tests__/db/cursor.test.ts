/**
 * @file cursor.test.ts
 * @summary Tests for encodeCursor, decodeCursor, and cursorFromRecord (100% line & branch coverage).
 *
 * Mocks:
 *  - @utils/json.js: stableStringify/parseJson delegate to JSON.stringify/JSON.parse
 *  - @utils/crypto.js: toBase64Url returns standard base64 for compatibility with Buffer('base64')
 */

// Must mock using the exact specifiers used by the SUT
jest.mock('@utils/json.js', () => ({
  stableStringify: jest.fn((v: unknown) => JSON.stringify(v)),
  parseJson: jest.fn((s: string) => JSON.parse(s)),
}));

jest.mock('@utils/crypto.js', () => ({
  toBase64Url: jest.fn((buf: Buffer) => buf.toString('base64')),
}));

import { encodeCursor, decodeCursor, cursorFromRecord } from '../../src/db/index.js';

const jsonMock = jest.requireMock('@utils/json.js') as {
  stableStringify: jest.Mock;
  parseJson: jest.Mock;
};
const cryptoMock = jest.requireMock('@utils/crypto.js') as {
  toBase64Url: jest.Mock;
};

describe('cursors: encode/decode helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('encodeCursor serializes with stableStringify and base64-encodes with toBase64Url', () => {
    const value = { a: 1, b: 'x' };

    const encoded = encodeCursor(value);

    // toBase64Url receives a Buffer
    expect(cryptoMock.toBase64Url).toHaveBeenCalledTimes(1);
    expect(cryptoMock.toBase64Url).toHaveBeenCalledWith(expect.any(Buffer));

    // Encoded value is the base64 of JSON.stringify(value)
    const expected = Buffer.from(JSON.stringify(value)).toString('base64');
    expect(encoded).toBe(expected);

    // stableStringify was used
    expect(jsonMock.stableStringify).toHaveBeenCalledWith(value);
  });

  it('decodeCursor returns undefined when cursor is falsy', () => {
    expect(decodeCursor(undefined)).toBeUndefined();
    expect(decodeCursor('')).toBeUndefined();
  });

  it('decodeCursor returns parsed payload for a valid cursor', () => {
    const payload = { n: 7, s: 'ok' };
    const cursor = Buffer.from(JSON.stringify(payload)).toString('base64');

    const out = decodeCursor<typeof payload>(cursor);
    expect(out).toEqual(payload);
    expect(jsonMock.parseJson).toHaveBeenCalledWith(JSON.stringify(payload));
  });

  it('decodeCursor returns undefined on parse failure (invalid JSON after base64 decode)', () => {
    const notJson = 'plain-text';
    const badCursor = Buffer.from(notJson).toString('base64');

    const out = decodeCursor(badCursor);
    expect(out).toBeUndefined();
    expect(jsonMock.parseJson).toHaveBeenCalledWith(notJson);
  });
});

describe('cursorFromRecord + coercions', () => {
  it('coerces non-JSON types and builds an opaque cursor from selected fields', () => {
    const date = new Date('2020-01-02T03:04:05.000Z');
    const buf = Buffer.from('hi');
    const innerBuf = Buffer.from('k');
    const arrBuf = Buffer.from('z');

    const rec = {
      s: 'str',
      b: true,
      n: 5,
      nan: Number.NaN,
      inf: Number.POSITIVE_INFINITY,
      big: 123n,
      buf,
      date,
      arr: [1, 'y', arrBuf, new Date('2021-01-01T00:00:00.000Z'), 10n, Number.NaN],
      obj: {
        inner: innerBuf,
        undef: undefined as unknown as string,
        fn: () => 1,
        sym: Symbol('sym'),
      },
      ignored: 999,
    };

    const cursor = cursorFromRecord(rec, [
      's',
      'b',
      'n',
      'nan',
      'inf',
      'big',
      'buf',
      'date',
      'arr',
      'obj',
    ]);

    // Round-trip via decodeCursor to inspect coerced payload
    const decoded = decodeCursor<Record<string, unknown>>(cursor)!;

    // Primitives
    expect(decoded.s).toBe('str');
    expect(decoded.b).toBe(true);
    expect(decoded.n).toBe(5);

    // number -> non-finite coerced to string
    expect(decoded.nan).toBe('NaN');
    expect(decoded.inf).toBe('Infinity');

    // bigint -> string
    expect(decoded.big).toBe('123');

    // Buffer -> base64 (via mocked toBase64Url)
    expect(decoded.buf).toBe(Buffer.from('hi').toString('base64'));

    // Date -> ISO string
    expect(decoded.date).toBe('2020-01-02T03:04:05.000Z');

    // Array coercions in order
    const arr = decoded.arr as unknown[];
    expect(Array.isArray(arr)).toBe(true);
    expect(arr[0]).toBe(1);
    expect(arr[1]).toBe('y');
    expect(arr[2]).toBe(Buffer.from('z').toString('base64')); // Buffer -> base64
    expect(arr[3]).toBe('2021-01-01T00:00:00.000Z'); // Date -> ISO
    expect(arr[4]).toBe('10'); // bigint -> string
    expect(arr[5]).toBe('NaN'); // non-finite -> string

    // Object coercions (recursive)
    const obj = decoded.obj as Record<string, unknown>;
    expect(obj.inner).toBe(Buffer.from('k').toString('base64')); // Buffer -> base64
    expect(obj.undef).toBe('undefined'); // undefined -> "undefined" (fallback)
    expect(typeof obj.fn).toBe('string'); // function -> string
    expect(obj.sym).toBe('Symbol(sym)'); // symbol -> "Symbol(sym)"

    // Ensure only selected fields are present
    expect(decoded).not.toHaveProperty('ignored');
  });
});
