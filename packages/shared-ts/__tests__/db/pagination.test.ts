/**
 * @file pagination.test.ts
 * @summary Tests for pageFromRows, idCursorFromRow, and getIdFromCursor (100% line & branch coverage).
 */

// Mock the sibling dependency with the same resolved path the SUT uses
jest.mock('../../src/db/cursor.js', () => ({
  encodeCursor: jest.fn(),
  decodeCursor: jest.fn(),
  cursorFromRecord: jest.fn(() => 'CURSOR'),
}));

import { pageFromRows, idCursorFromRow, getIdFromCursor } from '../../src/db/pagination.js';
import * as CursorMod from '../../src/db/cursor.js';

const decodeMock = CursorMod.decodeCursor as unknown as jest.Mock;
const cursorFromRecordMock = CursorMod.cursorFromRecord as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('pageFromRows', () => {
  it('returns all rows and no nextCursor when rows.length <= limit', () => {
    const rows = [1, 2];
    const limit = 3;
    const toCursor = jest.fn();

    const page = pageFromRows(rows, limit, toCursor);

    expect(page).toEqual({ items: [1, 2], nextCursor: undefined });
    expect(toCursor).not.toHaveBeenCalled();
  });

  it('slices to limit and sets nextCursor using the last included item when rows.length > limit', () => {
    const rows = [1, 2, 3, 4];
    const limit = 3;
    const toCursor = jest.fn((x: number) => `C${x}`);

    const page = pageFromRows(rows, limit, toCursor);

    expect(page.items).toEqual([1, 2, 3]);
    expect(page.nextCursor).toBe('C3');
    expect(toCursor).toHaveBeenCalledTimes(1);
    expect(toCursor).toHaveBeenCalledWith(3);
  });
});

describe('idCursorFromRow', () => {
  it('delegates to cursorFromRecord with ["id"] and returns its output', () => {
    const row = { id: 42, name: 'alice' };
    cursorFromRecordMock.mockReturnValueOnce('CURSOR:42');

    const out = idCursorFromRow(row);

    expect(out).toBe('CURSOR:42');
    expect(cursorFromRecordMock).toHaveBeenCalledWith(row, ['id']);
  });
});

describe('getIdFromCursor', () => {
  it('returns undefined when cursor is missing and calls decodeCursor with undefined', () => {
    const out = getIdFromCursor(undefined);
    expect(out).toBeUndefined();
    expect(decodeMock).toHaveBeenCalledTimes(1);
    expect(decodeMock).toHaveBeenCalledWith(undefined);
  });

  it('returns the id when decodeCursor yields a valid payload', () => {
    decodeMock.mockReturnValueOnce({ id: 'abc' });

    const out = getIdFromCursor('opaque');
    expect(out).toBe('abc');
    expect(decodeMock).toHaveBeenCalledWith('opaque');
  });

  it('returns undefined when decodeCursor yields undefined or a payload without id', () => {
    decodeMock.mockReturnValueOnce(undefined);
    expect(getIdFromCursor('bad')).toBeUndefined();

    decodeMock.mockReturnValueOnce({ notId: 123 });
    expect(getIdFromCursor('no-id')).toBeUndefined();
  });
});
