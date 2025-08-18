import type { CorsConfig } from "../types/corsConfig.js";

/**
 * Builds a default CORS policy from a list of allowed origins or wildcard.
 * Includes common methods and headers; credentials disabled by default.
 *
 * @param origins Array of allowed origins or "*" for wildcard.
 * @param allowCredentials Whether to allow credentials (default false).
 */
export const buildDefaultCors = (
  origins: string[] | "*" = "*",
  allowCredentials = false
): CorsConfig => ({
  allowOrigins: Array.isArray(origins) ? origins : origins,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["content-type", "authorization", "x-request-id", "x-csrf-token", "x-amz-date"],
  exposeHeaders: ["x-request-id", "x-next-cursor"],
  allowCredentials,
  maxAgeSeconds: 600
});
