import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  ServiceUnavailableError,
  TooManyRequestsError} from "./errors.js";
import { ErrorCodes } from "./codes.js";
import {
  extractAwsError,
  isAwsAccessDenied,
  isAwsRetryable,
  isAwsServiceUnavailable,
  isAwsThrottling} from "../aws/errors.js";

/**
 * Maps raw AWS SDK errors into shared {@link HttpError} subclasses with stable error codes.
 *
 * Mapping strategy (in priority order):
 *  1. Coarse-grained classifiers — quick checks for throttling, access denial, and service unavailability.
 *  2. Name/code lookup table — compact map from common AWS identifiers to specific HTTP error factories.
 *  3. Fallback — anything not matched above maps to a generic {@link InternalError}.
 *
 * @example
 * ```ts
 * try {
 *   await client.send(cmd);
 * } catch (err) {
 *   throw mapAwsError(err, "EnvelopeRepository.put");
 * }
 * ```
 */

/** Factory type that produces a specific `HttpError` for a given context string. */
type ErrFactory = (ctx: string) => Error;

/** 429 Too Many Requests (throttling/backoff). */
const mkTooMany: ErrFactory = (ctx) =>
  new TooManyRequestsError(`${ctx}: throttled`, ErrorCodes.COMMON_TOO_MANY_REQUESTS);

/** 403 Forbidden (authorization failure). */
const mkForbidden: ErrFactory = (ctx) =>
  new ForbiddenError(`${ctx}: access denied`, ErrorCodes.AUTH_FORBIDDEN);

/** 500 Internal Error (generic server failure). */
const mkInternal: ErrFactory = (ctx) =>
  new InternalError(`${ctx}: internal error`, ErrorCodes.COMMON_INTERNAL_ERROR);

/** 503 Service Unavailable (dependency or AWS 5xx/unavailable). */
const mkUnavailable: ErrFactory = (ctx) =>
  new ServiceUnavailableError(`${ctx}: service unavailable`, ErrorCodes.COMMON_DEPENDENCY_UNAVAILABLE);

/** 409 Conflict (e.g., DynamoDB conditional check failures). */
const mkConflict: ErrFactory = (ctx) =>
  new ConflictError(`${ctx}: conflict`, ErrorCodes.COMMON_CONFLICT);

/** 404 Not Found (missing resources). */
const mkNotFound: ErrFactory = (ctx) =>
  new NotFoundError(`${ctx}: not found`, ErrorCodes.COMMON_NOT_FOUND);

/** 400 Bad Request (validation/parameter errors). */
const mkBadRequest: ErrFactory = (ctx) =>
  new BadRequestError(`${ctx}: bad request`, ErrorCodes.COMMON_BAD_REQUEST);

/**
 * Compact name/code → error mapping for common AWS failures.
 * Keys correspond to `err.name` or `err.code` values observed from AWS SDKs.
 */
const NAME_TO_ERROR: Record<string, ErrFactory> = {
  // Conflicts / conditional failures (e.g., DynamoDB Conditional Writes)
  ConditionalCheckFailedException: mkConflict,

  // Not found variants (S3 keys, generic resource lookups)
  ResourceNotFoundException: mkNotFound,
  NotFoundException: mkNotFound,
  NoSuchKey: mkNotFound,

  // Validation variants (DynamoDB, SSM, and other AWS services)
  ValidationException: mkBadRequest,
  InvalidParameterException: mkBadRequest};

/**
 * Maps an unknown AWS SDK error to a shared `HttpError` instance using
 * classifiers first and then a lookup table. Includes a context string in the
 * final error message to ease debugging (e.g., `Repository.method`).
 *
 * @param err Raw error thrown by an AWS SDK client/command.
 * @param context Short identifier of the caller (component.operation).
 * @returns An `Error` suitable for transport and client handling.
 */
export const mapAwsError = (err: unknown, context: string): Error => {
  // 1) Coarse classifiers (fast exit)
  // Only map to 429 for explicit throttling identifiers; avoid downgrading domain errors to 429
  if (isAwsThrottling(err)) return mkTooMany(context);
  if (isAwsAccessDenied(err)) return mkForbidden(context);
  if (isAwsServiceUnavailable(err)) return mkUnavailable(context);

  // 2) Name/code lookup
  const { name, code } = extractAwsError(err);
  const key = String(name ?? code ?? "");
  const named = NAME_TO_ERROR[key];
  if (named) return named(context);

  // 3) Fallback
  return mkInternal(context);
};
