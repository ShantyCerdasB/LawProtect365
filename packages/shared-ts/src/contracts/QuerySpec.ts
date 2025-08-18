/**
 * Sort direction for query ordering.
 */
export type SortDirection = "asc" | "desc";

/**
 * Field-based ordering.
 */
export interface OrderBy<T> {
  /** Field name in the domain model. */
  field: keyof T & string;
  /** Sort direction. Defaults to "asc". */
  direction?: SortDirection;
}

/**
 * Cursor-based pagination parameters.
 */
export interface QueryPagination {
  /** Page size (server clamps to safe bounds). */
  limit?: number;
  /** Opaque cursor for the next page. */
  cursor?: string;
}

/**
 * Minimal predicate shape. Concrete adapters map this to provider filters.
 */
export type Where<T> = Partial<Record<keyof T & string, unknown>>;

/**
 * Query specification decoupled from any persistence engine.
 */
export interface QuerySpec<T> {
  /** Optional predicate. */
  where?: Where<T>;
  /** Optional ordering list. */
  orderBy?: OrderBy<T>[];
  /** Optional pagination. */
  pagination?: QueryPagination;
  /** Optional field selection. */
  select?: (keyof T & string)[];
}
