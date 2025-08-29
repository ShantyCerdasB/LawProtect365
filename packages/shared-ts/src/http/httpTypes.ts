import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";

/**
 * Standard HTTP status codes used across services.
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  ACCEPTED = 202,  
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNSUPPORTED_MEDIA_TYPE = 415,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  INTERNAL_ERROR = 500,
  NOT_IMPLEMENTED = 501
}

/** Alias for simple string headers. */
export type Headers = Record<string, string>;

/** API Gateway v2 event. */
export type ApiEvent = APIGatewayProxyEventV2;

/** Union response (may be a string). */
export type ApiResponse = APIGatewayProxyResultV2;

/** Structured response shape (always object). */
export type ApiResponseStructured = APIGatewayProxyStructuredResultV2;

/**
 * Normalized async Lambda handler signature for HTTP APIs.
 * Handlers may return union; wrappers will normalize to structured.
 * @param evt Incoming API Gateway event.
 * @returns A promise resolving to a (possibly union) API response.
 */
export type HandlerFn = (evt: ApiEvent) => Promise<ApiResponse>;
