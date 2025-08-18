/**
 * Canonical error codes shared across services.
 * Use these stable identifiers in logs, metrics, and client logic.
 */
export const ErrorCodes = {
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  AUTH_FORBIDDEN: "AUTH_FORBIDDEN",

  COMMON_BAD_REQUEST: "COMMON_BAD_REQUEST",
  COMMON_NOT_FOUND: "COMMON_NOT_FOUND",
  COMMON_CONFLICT: "COMMON_CONFLICT",
  COMMON_UNSUPPORTED_MEDIA_TYPE: "COMMON_UNSUPPORTED_MEDIA_TYPE",
  COMMON_UNPROCESSABLE_ENTITY: "COMMON_UNPROCESSABLE_ENTITY",
  COMMON_TOO_MANY_REQUESTS: "COMMON_TOO_MANY_REQUESTS",

  COMMON_INTERNAL_ERROR: "COMMON_INTERNAL_ERROR",
  COMMON_NOT_IMPLEMENTED: "COMMON_NOT_IMPLEMENTED"
} as const;

/** Union of built-in error code strings. */
export type ErrorCode = keyof typeof ErrorCodes;

/**
 * Checks whether a code is one of the shared error codes.
 * @param code Candidate error code.
 * @returns True if the code belongs to the shared catalog.
 */
export const isSharedErrorCode = (code: string): code is ErrorCode =>
  code in ErrorCodes;
