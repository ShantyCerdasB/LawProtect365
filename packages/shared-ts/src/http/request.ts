import type { ApiEvent } from "./httpTypes.js";
import { BadRequestError } from "../errors/errors.js";

/**
 * Reads a header value case-insensitively.
 *
 * @param evt API event.
 * @param name Header name (case-insensitive).
 * @returns Header value or undefined when not present.
 */
export const getHeader = (evt: ApiEvent, name: string): string | undefined => {
  const headers = evt.headers ?? {};
  const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : undefined;
};

/**
 * Gets a path parameter value.
 *
 * @param evt API event.
 * @param name Path parameter name.
 * @returns Path parameter value or undefined.
 */
export const getPathParam = (evt: ApiEvent, name: string): string | undefined =>
  evt.pathParameters?.[name];

/**
 * Gets a query parameter value.
 *
 * @param evt API event.
 * @param name Query parameter name.
 * @returns Query value or undefined.
 */
export const getQueryParam = (evt: ApiEvent, name: string): string | undefined =>
  evt.queryStringParameters?.[name];

/**
 * Parses JSON request body into type T. If the body is base64-encoded,
 * it is decoded before parsing. Throws {@link BadRequestError} on invalid JSON.
 *
 * @typeParam T Expected shape of the parsed body.
 * @param evt API event.
 * @returns Parsed JSON body (defaults to empty object if no body).
 *
 * @example
 * const body = getJsonBody<CreateDraftInput>(evt);
 */
export const getJsonBody = <T = unknown>(evt: ApiEvent): T => {
  const body = evt.body;
  if (!body) return {} as T;
  try {
    const text = evt.isBase64Encoded ? Buffer.from(body, "base64").toString("utf8") : body;
    return JSON.parse(text) as T;
  } catch {
    throw new BadRequestError("Invalid JSON body");
  }
};
