import type { CorsConfig } from "../types/corsConfig.js";

/**
 * Builds a default CORS configuration.
 *
 * @param origins Array of allowed origins or "*" for wildcard (default "*").
 * @param allowCredentials Whether to allow credentials (default `false`).
 * @returns A `CorsConfig` object with sensible defaults.
 */
export const buildDefaultCors = (
  origins: string[] | "*" = "*",
  allowCredentials = false
): CorsConfig => ({
  allowOrigins: origins,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["content-type", "authorization", "x-request-id", "x-csrf-token", "x-amz-date"],
  exposeHeaders: ["x-request-id", "x-next-cursor"],
  allowCredentials,
  maxAgeSeconds: 600,
});