/**
 * Canonical error codes shared across services.
 * These constants cover platform-level concerns; service-specific codes
 * should be declared within each microservice.
 */
export const ErrorCodes = {
  // AuthN/Z
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  AUTH_FORBIDDEN: "AUTH_FORBIDDEN",

  // 4xx
  COMMON_BAD_REQUEST: "COMMON_BAD_REQUEST",
  COMMON_NOT_FOUND: "COMMON_NOT_FOUND",
  COMMON_CONFLICT: "COMMON_CONFLICT",
  COMMON_UNSUPPORTED_MEDIA_TYPE: "COMMON_UNSUPPORTED_MEDIA_TYPE",
  COMMON_UNPROCESSABLE_ENTITY: "COMMON_UNPROCESSABLE_ENTITY",
  COMMON_TOO_MANY_REQUESTS: "COMMON_TOO_MANY_REQUESTS",
  COMMON_PRECONDITION_FAILED: "COMMON_PRECONDITION_FAILED",
  COMMON_PAYLOAD_TOO_LARGE: "COMMON_PAYLOAD_TOO_LARGE",

  // 5xx
  COMMON_INTERNAL_ERROR: "COMMON_INTERNAL_ERROR",
  COMMON_NOT_IMPLEMENTED: "COMMON_NOT_IMPLEMENTED",
  COMMON_DEPENDENCY_UNAVAILABLE: "COMMON_DEPENDENCY_UNAVAILABLE",
} as const;

/** Union of built-in shared error code strings. */
export type ErrorCode = keyof typeof ErrorCodes;

/**
 * Checks whether a code is one of the shared error codes.
 *
 * @param code Candidate error code.
 * @returns True if the code belongs to the shared catalog.
 */
export const isSharedErrorCode = (code: string): code is ErrorCode =>
  code in ErrorCodes;
