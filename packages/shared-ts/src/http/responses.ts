import { HttpStatus, type ApiResponse, type Headers } from "./httpTypes.js";

/**
 * Produces a JSON API response with a given status code.
 *
 * @param statusCode HTTP status code to send.
 * @param data Optional JSON-serializable payload. If omitted, body is empty.
 * @param headers Optional extra headers to merge with default JSON header.
 * @returns API Gateway proxy response.
 *
 * @example
 * return json(HttpStatus.OK, { ok: true });
 */
export const json = (
  statusCode: HttpStatus,
  data?: unknown,
  headers: Headers = {}
): ApiResponse => ({
  statusCode,
  headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  body: data === undefined ? "" : JSON.stringify(data)
});

/**
 * Builds a 200 OK JSON response.
 * @param data Optional JSON payload.
 * @param headers Optional extra headers.
 */
export const ok = (data?: unknown, headers?: Headers) =>
  json(HttpStatus.OK, data, headers);

/**
 * Builds a 201 Created JSON response.
 * @param data Optional JSON payload.
 * @param headers Optional extra headers.
 */
export const created = (data?: unknown, headers?: Headers) =>
  json(HttpStatus.CREATED, data, headers);

/**
 * Builds a 204 No Content response.
 * @param headers Optional extra headers.
 */
export const noContent = (headers?: Headers) =>
  json(HttpStatus.NO_CONTENT, undefined, headers);

/**
 * Builds a 400 Bad Request JSON error response.
 * @param message Human-readable message.
 * @param details Optional safe details (e.g., validation issues).
 */
export const badRequest = (message = "Bad Request", details?: unknown) =>
  json(HttpStatus.BAD_REQUEST, { error: "BadRequest", message, details });

/**
 * Builds a 401 Unauthorized JSON error response.
 * @param message Human-readable message.
 */
export const unauthorized = (message = "Unauthorized") =>
  json(HttpStatus.UNAUTHORIZED, { error: "Unauthorized", message });

/**
 * Builds a 202 Accepted JSON response.
 * @param data Optional JSON payload.
 * @param headers Optional extra headers.
 */
export const accepted = (data?: unknown, headers?: Headers) =>
  json(HttpStatus.ACCEPTED, data, headers);

/**
 * Builds a 403 Forbidden JSON error response.
 * @param message Human-readable message.
 */
export const forbidden = (message = "Forbidden") =>
  json(HttpStatus.FORBIDDEN, { error: "Forbidden", message });

/**
 * Builds a 404 Not Found JSON error response.
 * @param message Human-readable message.
 */
export const notFound = (message = "Not Found") =>
  json(HttpStatus.NOT_FOUND, { error: "NotFound", message });

/**
 * Builds a 409 Conflict JSON error response.
 * @param message Human-readable message.
 */
export const conflict = (message = "Conflict") =>
  json(HttpStatus.CONFLICT, { error: "Conflict", message });

/**
 * Builds a 415 Unsupported Media Type JSON error response.
 * @param message Human-readable message.
 */
export const unsupportedMedia = (message = "Unsupported Media Type") =>
  json(HttpStatus.UNSUPPORTED_MEDIA_TYPE, { error: "UnsupportedMediaType", message });

/**
 * Builds a 422 Unprocessable Entity JSON error response.
 * @param message Human-readable message.
 * @param details Optional validation details.
 */
export const unprocessable = (message = "Unprocessable Entity", details?: unknown) =>
  json(HttpStatus.UNPROCESSABLE_ENTITY, { error: "UnprocessableEntity", message, details });

/**
 * Builds a 429 Too Many Requests JSON error response.
 * @param message Human-readable message.
 */
export const tooManyRequests = (message = "Too Many Requests") =>
  json(HttpStatus.TOO_MANY_REQUESTS, { error: "TooManyRequests", message });

/**
 * Builds a 500 Internal Error JSON response.
 * @param message Human-readable message.
 */
export const internalError = (message = "Internal Error") =>
  json(HttpStatus.INTERNAL_ERROR, { error: "InternalError", message });

/**
 * Builds a 501 Not Implemented JSON response.
 * @param message Human-readable message.
 */
export const notImplemented = (message = "Not Implemented") =>
  json(HttpStatus.NOT_IMPLEMENTED, { error: "NotImplemented", message });
