/**
 * @file pagination.ts
 * @summary Common pagination types shared across all ports
 * @description Defines pagination interfaces used by multiple port implementations
 */

/**
 * Common pagination input (forward-only)
 */
export type PageOpts = { 
  /** Maximum number of items to return */
  limit?: number; 
  /** Pagination cursor for getting the next page of results */
  cursor?: string; 
};

/**
 * Common pagination result
 */
export type Page<T> = { 
  /** Array of items for the current page */
  items: T[]; 
  /** Cursor for the next page of results (optional) */
  nextCursor?: string; 
};
