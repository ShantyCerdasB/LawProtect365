import { AppError } from "./AppError.js";

/**
 * Returns true if the error is expected/operational (not a programmer bug).
 * @param err Error instance.
 */
export const isOperational = (err: unknown): boolean =>
  err instanceof AppError && err.isOperational === true;

/**
 * Returns true if the error likely benefits from a retry (e.g., throttling).
 * @param err Error instance.
 */
export const isRetryable = (err: unknown): boolean => {
  const name = (err as any)?.name ?? "";
  const code = (err as any)?.code ?? "";
  return [
    "ThrottlingException",
    "TooManyRequestsException",
    "ProvisionedThroughputExceededException",
    "RequestLimitExceeded",
    "LimitExceededException",
    "ServiceQuotaExceededException"
  ].some(v => v === name || v === code);
};

/**
 * Returns true if the status code represents a client error (4xx).
 * @param statusCode HTTP status code.
 */
export const isClientError = (statusCode: number): boolean =>
  statusCode >= 400 && statusCode < 500;

/**
 * Returns true if the status code represents a server error (5xx).
 * @param statusCode HTTP status code.
 */
export const isServerError = (statusCode: number): boolean =>
  statusCode >= 500 && statusCode < 600;
