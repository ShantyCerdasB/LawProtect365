import { AppError } from "./AppError.js";
import { ErrorCodes } from "./codes.js";

/**
 * Base class for HTTP-mapped errors with a fixed status.
 *
 * @typeParam C - Machine-readable error code string. Defaults to `string` so
 * domain services can pass their own codes (e.g., `"SIG_ENVELOPE_INVALID_STATE"`).
 */
export abstract class HttpError<C extends string = string> extends AppError<C> {
  /**
   * @param statusCode HTTP status code associated with the error.
   * @param code Stable machine-readable code (platform or domain-specific).
   * @param message Human-readable message.
   * @param details Optional, safe-to-expose structured details.
   * @param cause Optional underlying cause for diagnostics.
   */
  protected constructor(
    statusCode: number,
    code: C,
    message?: string,
    details?: unknown,
    cause?: unknown
  ) {
    super(code, statusCode, message, details, cause);
  }
}

/** 400 Bad Request. */
export class BadRequestError extends HttpError<string> {
  /**
   * @param message Defaults to `"Bad Request"`.
   * @param code Defaults to {@link ErrorCodes.COMMON_BAD_REQUEST}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Bad Request",
    code: string = ErrorCodes.COMMON_BAD_REQUEST,
    details?: unknown
  ) {
    super(400, code, message, details);
  }
}

/** 401 Unauthorized. */
export class UnauthorizedError extends HttpError<string> {
  /**
   * @param message Defaults to `"Unauthorized"`.
   * @param code Defaults to {@link ErrorCodes.AUTH_UNAUTHORIZED}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Unauthorized",
    code: string = ErrorCodes.AUTH_UNAUTHORIZED,
    details?: unknown
  ) {
    super(401, code, message, details);
  }
}

/** 403 Forbidden. */
export class ForbiddenError extends HttpError<string> {
  /**
   * @param message Defaults to `"Forbidden"`.
   * @param code Defaults to {@link ErrorCodes.AUTH_FORBIDDEN}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Forbidden",
    code: string = ErrorCodes.AUTH_FORBIDDEN,
    details?: unknown
  ) {
    super(403, code, message, details);
  }
}

/** 404 Not Found. */
export class NotFoundError extends HttpError<string> {
  /**
   * @param message Defaults to `"Not Found"`.
   * @param code Defaults to {@link ErrorCodes.COMMON_NOT_FOUND}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Not Found",
    code: string = ErrorCodes.COMMON_NOT_FOUND,
    details?: unknown
  ) {
    super(404, code, message, details);
  }
}

/** 409 Conflict. */
export class ConflictError extends HttpError<string> {
  /**
   * @param message Defaults to `"Conflict"`.
   * @param code Defaults to {@link ErrorCodes.COMMON_CONFLICT}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Conflict",
    code: string = ErrorCodes.COMMON_CONFLICT,
    details?: unknown
  ) {
    super(409, code, message, details);
  }
}

/** 412 Precondition Failed. */
export class PreconditionFailedError extends HttpError<string> {
  /**
   * @param message Defaults to `"Precondition Failed"`.
   * @param code Defaults to {@link ErrorCodes.COMMON_PRECONDITION_FAILED}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Precondition Failed",
    code: string = ErrorCodes.COMMON_PRECONDITION_FAILED,
    details?: unknown
  ) {
    super(412, code, message, details);
  }
}

/** 413 Payload Too Large. */
export class PayloadTooLargeError extends HttpError<string> {
  /**
   * @param message Defaults to `"Payload Too Large"`.
   * @param code Defaults to {@link ErrorCodes.COMMON_PAYLOAD_TOO_LARGE}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Payload Too Large",
    code: string = ErrorCodes.COMMON_PAYLOAD_TOO_LARGE,
    details?: unknown
  ) {
    super(413, code, message, details);
  }
}

/** 415 Unsupported Media Type. */
export class UnsupportedMediaTypeError extends HttpError<string> {
  /**
   * @param message Defaults to `"Unsupported Media Type"`.
   * @param code Defaults to {@link ErrorCodes.COMMON_UNSUPPORTED_MEDIA_TYPE}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Unsupported Media Type",
    code: string = ErrorCodes.COMMON_UNSUPPORTED_MEDIA_TYPE,
    details?: unknown
  ) {
    super(415, code, message, details);
  }
}

/** 422 Unprocessable Entity (e.g., schema validation). */
export class UnprocessableEntityError extends HttpError<string> {
  /**
   * @param message Defaults to `"Unprocessable Entity"`.
   * @param code Defaults to {@link ErrorCodes.COMMON_UNPROCESSABLE_ENTITY}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Unprocessable Entity",
    code: string = ErrorCodes.COMMON_UNPROCESSABLE_ENTITY,
    details?: unknown
  ) {
    super(422, code, message, details);
  }
}

/** 429 Too Many Requests (rate limit or throttling). */
export class TooManyRequestsError extends HttpError<string> {
  /**
   * @param message Defaults to `"Too Many Requests"`.
   * @param code Defaults to {@link ErrorCodes.COMMON_TOO_MANY_REQUESTS}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Too Many Requests",
    code: string = ErrorCodes.COMMON_TOO_MANY_REQUESTS,
    details?: unknown
  ) {
    super(429, code, message, details);
  }
}

/** 500 Internal Server Error. */
export class InternalError extends HttpError<string> {
  /**
   * @param message Defaults to `"Internal Error"`.
   * @param code Defaults to {@link ErrorCodes.COMMON_INTERNAL_ERROR}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Internal Error",
    code: string = ErrorCodes.COMMON_INTERNAL_ERROR,
    details?: unknown
  ) {
    super(500, code, message, details);
  }
}

/** 501 Not Implemented. */
export class NotImplementedError extends HttpError<string> {
  /**
   * @param message Defaults to `"Not Implemented"`.
   * @param code Defaults to {@link ErrorCodes.COMMON_NOT_IMPLEMENTED}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Not Implemented",
    code: string = ErrorCodes.COMMON_NOT_IMPLEMENTED,
    details?: unknown
  ) {
    super(501, code, message, details);
  }
}

/** 503 Service Unavailable (dependency outage or temporary unavailability). */
export class ServiceUnavailableError extends HttpError<string> {
  /**
   * @param message Defaults to `"Service Unavailable"`.
   * @param code Defaults to {@link ErrorCodes.COMMON_DEPENDENCY_UNAVAILABLE}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Service Unavailable",
    code: string = ErrorCodes.COMMON_DEPENDENCY_UNAVAILABLE,
    details?: unknown
  ) {
    super(503, code, message, details);
  }
}

/** 403 Forbidden - Invitation token expired */
export class InvitationTokenExpiredError extends HttpError<string> {
  /**
   * @param message Defaults to `"Invitation token has expired"`.
   * @param code Defaults to {@link ErrorCodes.INVITATION_TOKEN_EXPIRED}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Invitation token has expired",
    code: string = ErrorCodes.INVITATION_TOKEN_EXPIRED,
    details?: unknown
  ) {
    super(403, code, message, details);
  }
}

/** 403 Forbidden - Invalid invitation token */
export class InvitationTokenInvalidError extends HttpError<string> {
  /**
   * @param message Defaults to `"Invalid invitation token"`.
   * @param code Defaults to {@link ErrorCodes.INVITATION_TOKEN_INVALID}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Invalid invitation token",
    code: string = ErrorCodes.INVITATION_TOKEN_INVALID,
    details?: unknown
  ) {
    super(403, code, message, details);
  }
}

/** 403 Forbidden - Invitation token already used */
export class InvitationTokenAlreadyUsedError extends HttpError<string> {
  /**
   * @param message Defaults to `"Invitation token has already been used"`.
   * @param code Defaults to {@link ErrorCodes.INVITATION_TOKEN_ALREADY_USED}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Invitation token has already been used",
    code: string = ErrorCodes.INVITATION_TOKEN_ALREADY_USED,
    details?: unknown
  ) {
    super(403, code, message, details);
  }
}

/** 404 Not Found - Invitation not found */
export class InvitationNotFoundError extends HttpError<string> {
  /**
   * @param message Defaults to `"Invitation not found"`.
   * @param code Defaults to {@link ErrorCodes.INVITATION_NOT_FOUND}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Invitation not found",
    code: string = ErrorCodes.INVITATION_NOT_FOUND,
    details?: unknown
  ) {
    super(404, code, message, details);
  }
}

/** 403 Forbidden - Consent not recorded */
export class ConsentNotRecordedError extends HttpError<string> {
  /**
   * @param message Defaults to `"Consent must be recorded before signing"`.
   * @param code Defaults to {@link ErrorCodes.CONSENT_NOT_RECORDED}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Consent must be recorded before signing",
    code: string = ErrorCodes.CONSENT_NOT_RECORDED,
    details?: unknown
  ) {
    super(403, code, message, details);
  }
}

/** 403 Forbidden - Document access denied */
export class DocumentAccessDeniedError extends HttpError<string> {
  /**
   * @param message Defaults to `"Access denied to this document"`.
   * @param code Defaults to {@link ErrorCodes.DOCUMENT_ACCESS_DENIED}.
   * @param details Optional structured details.
   */
  constructor(
    message = "Access denied to this document",
    code: string = ErrorCodes.DOCUMENT_ACCESS_DENIED,
    details?: unknown
  ) {
    super(403, code, message, details);
  }
}