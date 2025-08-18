import { ErrorCode } from "./codes.js";

/**
 * Base error for application and domain failures.
 * Carries a stable code, HTTP status, and optional details safe for clients.
 * Extend this class for common HTTP categories or domain-specific errors.
 */
export class AppError<C extends string = ErrorCode | string> extends Error {
  /** Stable machine-readable code (e.g., AUTH_UNAUTHORIZED, DOCS_TEMPLATE_NOT_FOUND). */
  public readonly code: C;

  /** HTTP status intended for transport. */
  public readonly statusCode: number;

  /** Optional structured details safe to return to clients. */
  public readonly details?: unknown;

  /** Marks the error as expected/operational for metrics and alerting. */
  public readonly isOperational = true;

  /** Optional underlying cause for debugging and tracing. */
  public override readonly cause?: unknown;

  /**
   * Creates an AppError.
   * @param code Stable error code.
   * @param statusCode HTTP status to return.
   * @param message Human-readable message.
   * @param details Optional safe details for clients.
   * @param cause Optional underlying cause.
   */
  constructor(
    code: C,
    statusCode: number,
    message?: string,
    details?: unknown,
    cause?: unknown
  ) {
    super(message ?? code);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.cause = cause;

    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) Error.captureStackTrace(this, new.target);
  }

  /**
   * JSON representation safe for client responses and logs.
   * Excludes stack traces by design.
   */
  public toJSON() {
    return {
      error: this.code,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode
    };
  }
}
