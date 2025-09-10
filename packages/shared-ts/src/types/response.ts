/**
 * @file response.ts
 * @summary Generic response types for controllers
 * @description Common response types used across microservices
 */

/**
 * Common response content types enum
 */
export const RESPONSE_CONTENT_TYPES = {
  JSON: "json",
  TEXT: "text", 
  BINARY: "binary",
  STREAM: "stream"} as const;

/**
 * Generic response content type for API controllers
 */
export type ResponseContentType = typeof RESPONSE_CONTENT_TYPES[keyof typeof RESPONSE_CONTENT_TYPES];
