/**
 * @file pagination.ts
 * @summary Pagination types and utilities
 * @description Provides types and utilities for pagination operations
 */

import type { Brand } from "./brand.js";

/**
 * @description Opaque pagination token.
 */
export type Cursor = string;

/**
 * @description Opaque base64url pagination cursor branded type.
 * Provides compile-time type safety for pagination cursors.
 */
export type PaginationCursor = Brand<string, "PaginationCursor">;

/**
 * @description Inbound query params for pagination.
 */
export interface PaginationParams {
  /** Maximum number of items to return */
  limit: number;
  /** Optional cursor for pagination */
  cursor?: Cursor;
}

/**
 * @description Page metadata for pagination responses.
 */
export interface PageMeta {
  /** Whether there are more items available */
  hasNext: boolean;
  /** Cursor for the next page */
  nextCursor?: Cursor;
  /** Total count of items (if available) */
  totalCount?: number;
}

/**
 * @description Paginated response with cursor-based pagination.
 */
export interface CursorPage<T> {
  /** Array of items in the current page */
  items: T[];
  /** Pagination metadata */
  meta: PageMeta;
}


