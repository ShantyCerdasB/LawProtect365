/**
 * @file index.ts
 * @summary Error barrel for the signature service.
 *
 * Re-exports the shared errors module and augments it with:
 * - signature-service specific codes
 * - domain-friendly factory helpers
 */

export {
  // Base / subclasses
  AppError,
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnsupportedMediaTypeError,
  UnprocessableEntityError,
  TooManyRequestsError,
  InternalError,
  NotImplementedError,

  // Mappers & classifiers
  mapError,
  mapAwsError,
  isOperational,
  isRetryable,
  isClientError,
  isServerError,

  // Shared codes
  ErrorCodes,
  type ErrorCode,
} from "@lawprotect/shared-ts";

export {
  SignatureErrorCodes,
  type SignatureErrorCode,
  type AnyErrorCode,
} from "./codes";

export * from "./factories";


