import { AppError } from "./AppError.js";
import { ErrorCodes, type ErrorCode } from "./codes.js";

/**
 * Base class for HTTP-mapped errors with a fixed status.
 * Prefer concrete subclasses below for common categories.
 */
export abstract class HttpError<C extends string = ErrorCode | string> extends AppError<C> {
  protected constructor(statusCode: number, code: C, message?: string, details?: unknown, cause?: unknown) {
    super(code, statusCode, message, details, cause);
  }
}

/** 400 Bad Request. */
export class BadRequestError extends HttpError<ErrorCode | string> {
  constructor(message = "Bad Request", code: ErrorCode | string = ErrorCodes.COMMON_BAD_REQUEST, details?: unknown) {
    super(400, code, message, details);
  }
}

/** 401 Unauthorized. */
export class UnauthorizedError extends HttpError<ErrorCode | string> {
  constructor(message = "Unauthorized", code: ErrorCode | string = ErrorCodes.AUTH_UNAUTHORIZED, details?: unknown) {
    super(401, code, message, details);
  }
}

/** 403 Forbidden. */
export class ForbiddenError extends HttpError<ErrorCode | string> {
  constructor(message = "Forbidden", code: ErrorCode | string = ErrorCodes.AUTH_FORBIDDEN, details?: unknown) {
    super(403, code, message, details);
  }
}

/** 404 Not Found. */
export class NotFoundError extends HttpError<ErrorCode | string> {
  constructor(message = "Not Found", code: ErrorCode | string = ErrorCodes.COMMON_NOT_FOUND, details?: unknown) {
    super(404, code, message, details);
  }
}

/** 409 Conflict. */
export class ConflictError extends HttpError<ErrorCode | string> {
  constructor(message = "Conflict", code: ErrorCode | string = ErrorCodes.COMMON_CONFLICT, details?: unknown) {
    super(409, code, message, details);
  }
}

/** 415 Unsupported Media Type. */
export class UnsupportedMediaTypeError extends HttpError<ErrorCode | string> {
  constructor(
    message = "Unsupported Media Type",
    code: ErrorCode | string = ErrorCodes.COMMON_UNSUPPORTED_MEDIA_TYPE,
    details?: unknown
  ) {
    super(415, code, message, details);
  }
}

/** 422 Unprocessable Entity (e.g., schema validation). */
export class UnprocessableEntityError extends HttpError<ErrorCode | string> {
  constructor(
    message = "Unprocessable Entity",
    code: ErrorCode | string = ErrorCodes.COMMON_UNPROCESSABLE_ENTITY,
    details?: unknown
  ) {
    super(422, code, message, details);
  }
}

/** 429 Too Many Requests (rate limit or throttling). */
export class TooManyRequestsError extends HttpError<ErrorCode | string> {
  constructor(
    message = "Too Many Requests",
    code: ErrorCode | string = ErrorCodes.COMMON_TOO_MANY_REQUESTS,
    details?: unknown
  ) {
    super(429, code, message, details);
  }
}

/** 500 Internal Server Error. */
export class InternalError extends HttpError<ErrorCode | string> {
  constructor(message = "Internal Error", code: ErrorCode | string = ErrorCodes.COMMON_INTERNAL_ERROR, details?: unknown) {
    super(500, code, message, details);
  }
}

/** 501 Not Implemented. */
export class NotImplementedError extends HttpError<ErrorCode | string> {
  constructor(
    message = "Not Implemented",
    code: ErrorCode | string = ErrorCodes.COMMON_NOT_IMPLEMENTED,
    details?: unknown
  ) {
    super(501, code, message, details);
  }
}
