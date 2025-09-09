/**
 * @file requestToken.ts
 * @summary Request token middleware utilities
 * @description Middleware functions for handling request tokens in API requests
 */

import type { ApiEvent } from "../http/httpTypes.js";
import { requireHeaderToken } from "../http/headers.js";

/**
 * @description Requires an opaque request token from a specified header
 * Validates token presence and minimum length, throwing typed 401 error when validation fails
 *
 * @param evt - API event containing headers
 * @param header - Header name to read (default: "x-request-token")
 * @param minLength - Minimum allowed token length (default: 16)
 * @returns The validated token string
 * @throws AppError 401 when the header is missing or shorter than minLength
 */
export const requireRequestToken = (
  evt: ApiEvent,
  header = "x-request-token",
  minLength = 16
): string => requireHeaderToken(evt.headers, header, minLength);





