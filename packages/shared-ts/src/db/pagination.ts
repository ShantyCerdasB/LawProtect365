import { decodeCursor, cursorFromRecord } from "./cursor.js";

// Re-export cursorFromRecord for use in other modules
export { cursorFromRecord };

/**
 * Result page shape for cursor pagination.
 */
export interface Page<T> {
  /** Page items. */
  items: T[];
  /** Opaque cursor for the next page when available. */
  nextCursor?: string;
}

/**
 * Applies forward-only cursor pagination to a sorted list.
 * Intended for repositories that fetch limit+1 items to detect more pages.
 *
 * @param rows Rows fetched from storage (up to limit + 1).
 * @param limit Page size requested.
 * @param toCursor Function building a cursor from the last included row.
 */
export const pageFromRows = <T>(
  rows: T[],
  limit: number,
  toCursor: (row: T) => string
): Page<T> => {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? toCursor(items[items.length - 1]) : undefined;
  return { items, nextCursor };
};

/**
 * Cursor payload with a single numeric or string id.
 */
export interface IdCursor {
  /** Last seen id value. */
  id: string | number;
}

/**
 * Helper that builds a cursor from a row by reading the "id" field.
 * @param row Source row containing an "id".
 */
export const idCursorFromRow = <T extends { id: string | number }>(row: T): string =>
  cursorFromRecord(row, ["id"]);

/**
 * Extracts the "id" from a cursor created by idCursorFromRow.
 * Returns undefined when cursor is missing or invalid.
 * @param cursor Opaque cursor.
 */
export const getIdFromCursor = (cursor?: string): string | number | undefined =>
  decodeCursor<IdCursor>(cursor)?.id;
