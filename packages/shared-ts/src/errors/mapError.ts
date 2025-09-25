import type { APIGatewayProxyResultV2 } from "aws-lambda";
import type { ZodIssue } from "zod";
import { AppError } from "./AppError.js";
import { ErrorCodes } from "./codes.js";
import { MapErrorOptions } from "../types/mapErrorOptions.js";

/**
 * Renders any thrown error into a consistent API Gateway response.
 * Applies safe defaults, maps common provider failures, and sets CORS elsewhere.
 *
 * @param err Thrown error (application, validation, provider, or unknown).
 * @param opts Rendering options (requestId, details exposure, extra headers).
 * @returns API Gateway proxy result with status, headers, and JSON body.
 */
export const mapError = (err: unknown, opts: MapErrorOptions = {}): APIGatewayProxyResultV2 => {
  const e = normalizeError(err);
  const shouldExpose =
    opts.exposeDetails ??
    ["dev", "staging"].includes(String(process.env.ENV ?? "").toLowerCase());

  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    ...(opts.requestId ? { "x-request-id": String(opts.requestId) } : {}),
    ...(opts.headers ?? {})
  };

  // Add Retry-After for throttling
  if (e.statusCode === 429 && headers["Retry-After"] === undefined) {
    headers["Retry-After"] = "1";
  }

  const body = {
    error: e.code,
    message: e.message,
    ...(e.details !== undefined && shouldExpose ? { details: e.details } : {}),
    ...(opts.requestId ? { requestId: opts.requestId } : {})
  };

  return {
    statusCode: e.statusCode,
    headers,
    body: JSON.stringify(body)
  };
};

/**
 * Normalizes an arbitrary error into an AppError-like shape with
 * statusCode, code, message, and details.
 * @param err Thrown error.
 */
const normalizeError = (err: unknown): {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
} => {
  if (err instanceof AppError) {
    // If there are details and the message is generic, use details as the primary message
    // This provides more specific error information to the client
    const shouldUseDetailsAsMessage = err.details && isGenericErrorMessage(err.message);
    
    return {
      statusCode: err.statusCode,
      code: err.code,
      message: shouldUseDetailsAsMessage ? JSON.stringify(err.details) : err.message,
      details: err.details
    };
  }

  // ZodError → 422
  if (isZodError(err)) {
    // Extract the first error message from Zod issues
    const firstIssue = err.issues[0] as ZodIssue | undefined;
    const specificMessage = firstIssue?.message || "Unprocessable Entity";
    
    return {
      statusCode: 422,
      code: ErrorCodes.COMMON_UNPROCESSABLE_ENTITY,
      message: specificMessage,
      details: { issues: err.issues }
    };
  }

  // JSON parse errors → 400
  if (err instanceof SyntaxError && /JSON/.test(String(err.message))) {
    return {
      statusCode: 400,
      code: ErrorCodes.COMMON_BAD_REQUEST,
      message: "Bad Request"
    };
  }

  // AWS/Dynamo/SDK mapping
  const name = (err as any)?.name ?? "";
  const code = (err as any)?.code ?? "";
  if (isThrottling(name, code)) {
    return {
      statusCode: 429,
      code: ErrorCodes.COMMON_TOO_MANY_REQUESTS,
      message: "Too Many Requests"
    };
  }
  if (name === "ConditionalCheckFailedException" || code === "ConditionalCheckFailedException") {
    return {
      statusCode: 409,
      code: ErrorCodes.COMMON_CONFLICT,
      message: "Conflict"
    };
  }
  if (name === "ValidationException" || code === "ValidationException") {
    return {
      statusCode: 400,
      code: ErrorCodes.COMMON_BAD_REQUEST,
      message: "Bad Request"
    };
  }
  if (name === "AccessDeniedException" || code === "AccessDeniedException") {
    return {
      statusCode: 403,
      code: ErrorCodes.AUTH_FORBIDDEN,
      message: "Forbidden"
    };
  }
  if (name === "ResourceNotFoundException" || code === "ResourceNotFoundException") {
    return {
      statusCode: 404,
      code: ErrorCodes.COMMON_NOT_FOUND,
      message: "Not Found"
    };
  }

  // Fallback 500
  return {
    statusCode: 500,
    code: ErrorCodes.COMMON_INTERNAL_ERROR,
    message: "Internal Error"
  };
};

/**
 * Checks throttling/rate-limit provider failures.
 * @param name Error name.
 * @param code Error code.
 */
const isThrottling = (name: string, code: string): boolean => {
  const list = [
    "ThrottlingException",
    "TooManyRequestsException",
    "ProvisionedThroughputExceededException",
    "RequestLimitExceeded",
    "LimitExceededException",
    "ServiceQuotaExceededException"
  ];
  return list.includes(name) || list.includes(code);
};

/**
 * Type guard for ZodError without importing zod as a hard dependency.
 * @param err Candidate error.
 */
const isZodError = (err: unknown): err is { issues: unknown[] } => {
  const any = err as any;
  return Boolean(any) && Array.isArray(any.issues) && typeof any.name === "string" && any.name === "ZodError";
};

/**
 * Checks if an error message is generic and should be replaced with details
 * @param message The error message to check
 * @returns True if the message is generic and should be replaced
 */
const isGenericErrorMessage = (message: string): boolean => {
  const genericMessages = [
    'Invalid envelope state',
    'Invalid request',
    'Bad request',
    'Internal error',
    'Operation failed',
    'Validation failed',
    'Access denied',
    'Not found',
    'Conflict',
    'Unauthorized'
  ];
  
  return genericMessages.some(generic => 
    message.toLowerCase().includes(generic.toLowerCase())
  );
};
