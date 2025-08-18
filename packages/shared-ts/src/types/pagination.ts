/**
 * Opaque pagination cursor. Treat as an implementation detail of the API.
 */
export type Cursor = string;

/**
 * Standard pagination params extracted from requests.
 */
export interface PaginationParams {
  /** Page size (validated and clamped by the server). */
  limit: number;
  /** Opaque cursor indicating where to resume listing. */
  cursor?: Cursor;
}

/**
 * Common metadata returned with a page.
 */
export interface PageMeta {
  /** Echoed limit used for the query. */
  limit: number;
  /** Opaque cursor for the next page (absent if no more items). */
  nextCursor?: Cursor;
  /** Optional total count when available (avoid if expensive). */
  total?: number;
}

/**
 * Generic cursor-based page envelope.
 */
export interface CursorPage<T> {
  items: T[];
  meta: PageMeta;
}
