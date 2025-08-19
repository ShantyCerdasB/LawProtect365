import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  TooManyRequestsError,
} from "./errors.js";
import { ErrorCodes } from "./codes.js";
import {
  extractAwsError,
  isAwsAccessDenied,
  isAwsRetryable,
  isAwsServiceUnavailable,
  isAwsThrottling,
} from "../aws/errors.js";

/**
 * @file awsMap.ts
 * @description
 * Maps raw AWS SDK errors into shared `HttpError` subclasses with stable error
 * codes. This provides a single, reusable place to translate provider-specific
 * failures into the API/Domain error vocabulary used across services.
 *
 * Mapping strategy (in priority order):
 *  1. **Coarse-grained classifiers** — quick checks for throttling, access
 *     denial, and service unavailability. These short-circuit to the appropriate
 *     HTTP error without consulting the lookup table.
 *  2. **Name/code lookup table** — a compact map from common AWS error
 *     identifiers (e.g., `ConditionalCheckFailedException`) to specific
 *     `HttpError` factories. This avoids long `if/else` chains and makes
 *     extensions trivial.
 *  3. **Fallback** — anything not matched above maps to a generic `InternalError`.
 *
 * @example
 * ```ts
 * try {
 *   await client.send(cmd);
 * } catch (err) {
 *   throw mapAwsError(err, "EnvelopeRepositoryDb.put");
 * }
 * ```
 */

/** Factory type that produces a specific `HttpError` for a given context string. */
type ErrFactory = (ctx: string) => Error;

/**
 * Error factory: 429 Too Many Requests (throttling/backoff scenario).
 * @param ctx Human-readable context (e.g., "Repo.method").
 */
const mkTooMany: ErrFactory = (ctx) =>
  new TooManyRequestsError(`${ctx}: throttled`, ErrorCodes.COMMON_TOO_MANY_REQUESTS);

/**
 * Error factory: 403 Forbidden (authorization failure).
 * @param ctx Human-readable context (e.g., "Repo.method").
 */
const mkForbidden: ErrFactory = (ctx) =>
  new ForbiddenError(`${ctx}: access denied`, ErrorCodes.AUTH_FORBIDDEN);

/**
 * Error factory: 500 Internal Error (generic server failure).
 * @param ctx Human-readable context (e.g., "Repo.method").
 */
const mkInternal: ErrFactory = (ctx) =>
  new InternalError(`${ctx}: internal error`, ErrorCodes.COMMON_INTERNAL_ERROR);

/**
 * Error factory: temporary unavailability mapped as 500.
 * Use when AWS indicates 5xx/availability issues.
 * @param ctx Human-readable context (e.g., "Repo.method").
 */
const mkUnavailable: ErrFactory = (ctx) =>
  new InternalError(`${ctx}: service unavailable`, ErrorCodes.COMMON_INTERNAL_ERROR);

/**
 * Error factory: 409 Conflict (e.g., DynamoDB conditional check failures).
 * @param ctx Human-readable context (e.g., "Repo.method").
 */
const mkConflict: ErrFactory = (ctx) =>
  new ConflictError(`${ctx}: conflict`, ErrorCodes.COMMON_CONFLICT);

/**
 * Error factory: 404 Not Found (missing resource identifiers).
 * @param ctx Human-readable context (e.g., "Repo.method").
 */
const mkNotFound: ErrFactory = (ctx) =>
  new NotFoundError(`${ctx}: not found`, ErrorCodes.COMMON_NOT_FOUND);

/**
 * Error factory: 400 Bad Request (validation/parameter errors).
 * @param ctx Human-readable context (e.g., "Repo.method").
 */
const mkBadRequest: ErrFactory = (ctx) =>
  new BadRequestError(`${ctx}: bad request`, ErrorCodes.COMMON_BAD_REQUEST);

/**
 * Compact name/code → error mapping for common AWS failures.
 * Extend by adding new keys without changing control flow.
 *
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
  InvalidParameterException: mkBadRequest,
};

/**
 * Maps an unknown AWS SDK error to a shared `HttpError` instance using
 * classifiers first and then a lookup table. Includes a context string in the
 * final error message to ease debugging (e.g., `Repository.method`).
 *
 * @param err Raw error thrown by an AWS SDK client/command.
 * @param context Short identifier of the caller (component.operation).
 * @returns A `HttpError` (e.g., `TooManyRequestsError`, `ForbiddenError`, etc.)
 *          appropriate for transport and client handling.
 */
export const mapAwsError = (err: unknown, context: string): Error => {
  // 1) Coarse classifiers (fast exit; keeps complexity low)
  if (isAwsThrottling(err) || isAwsRetryable(err)) return mkTooMany(context);
  if (isAwsAccessDenied(err)) return mkForbidden(context);
  if (isAwsServiceUnavailable(err)) return mkUnavailable(context);

  // 2) Name/code lookup (single table, no if-chains)
  const { name, code } = extractAwsError(err);
  const key = String(name ?? code ?? "");
  const named = NAME_TO_ERROR[key];
  if (named) return named(context);

  // 3) Fallback
  return mkInternal(context);
};
