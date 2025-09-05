/**
 * AWS error classification helpers.
 * Works with generic Error-like objects (name/code/statusCode/message).
 */

export interface AwsErrorShape {
  name?: string;
  code?: string;
  message?: string;
  statusCode?: number;
}

/**
 * Extracts AWS-like error fields from an unknown error.
 * @param err Unknown error object.
 */
export const extractAwsError = (err: unknown): AwsErrorShape => {
  const any = err as any;
  
  let statusCode: number | undefined;
  if (typeof any?.$metadata?.httpStatusCode === "number") {
    statusCode = any.$metadata.httpStatusCode;
  } else if (typeof any?.statusCode === "number") {
    statusCode = any.statusCode;
  }
  
  return {
    name: typeof any?.name === "string" ? any.name : undefined,
    code: typeof any?.code === "string" ? any.code : undefined,
    message: typeof any?.message === "string" ? any.message : undefined,
    statusCode
  };
};

const THROTTLING = new Set([
  "Throttling",
  "ThrottlingException",
  "TooManyRequestsException",
  "ProvisionedThroughputExceededException",
  "RequestLimitExceeded",
  "LimitExceededException",
  "ServiceQuotaExceededException"
]);

/**
 * Returns true for throttling/rate-limit errors.
 * @param err Unknown error object.
 */
export const isAwsThrottling = (err: unknown): boolean => {
  const { name, code, statusCode } = extractAwsError(err);
  if (statusCode === 429) return true;
  return THROTTLING.has(String(name)) || THROTTLING.has(String(code));
};

/**
 * Returns true for access denied/forbidden errors.
 * @param err Unknown error object.
 */
export const isAwsAccessDenied = (err: unknown): boolean => {
  const { name, code, statusCode } = extractAwsError(err);
  if (statusCode === 403) return true;
  return ["AccessDenied", "AccessDeniedException"].includes(String(name ?? code));
};

/**
 * Returns true for service unavailable/5xx errors suitable for retries.
 * @param err Unknown error object.
 */
export const isAwsServiceUnavailable = (err: unknown): boolean => {
  const { statusCode, name, code } = extractAwsError(err);
  if (statusCode && statusCode >= 500) return true;
  return ["InternalFailure", "ServiceUnavailable"].includes(String(name ?? code));
};

/**
 * Returns true when the error is generally retryable (throttling or 5xx).
 * @param err Unknown error object.
 */
export const isAwsRetryable = (err: unknown): boolean =>
  isAwsThrottling(err) || isAwsServiceUnavailable(err);
