import type { JsonValue } from "./common.js";

/**
 * Canonical success envelope for API responses.
 * Prefer keeping transport minimal; use when a consistent envelope is desired.
 */
export interface ApiSuccess<T> {
  data: T;
  meta?: Record<string, JsonValue>;
}

/**
 * Canonical error body aligned with the error mapper output.
 */
export interface ApiErrorBody {
  /** Stable machine-readable code (e.g., AUTH_UNAUTHORIZED). */
  error: string;
  /** Human-readable message. */
  message: string;
  /** Optional request correlation id echoed by the server. */
  requestId?: string;
  /** Optional safe details (e.g., validation issues). */
  details?: unknown;
}

/**
 * Sorting directive for list endpoints.
 */
export interface Sort {
  field: string;
  order: "asc" | "desc";
}

/**
 * Basic filter expression for list endpoints.
 */
export interface Filter {
  field: string;
  op: "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "in" | "contains";
  value: JsonValue;
}
