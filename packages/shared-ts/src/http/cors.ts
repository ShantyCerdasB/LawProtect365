import { CorsConfig } from "../types/corsConfig.js";
import type { ApiEvent, ApiResponse, Headers } from "./httpTypes.js";

/**
 * Builds CORS headers from configuration.
 *
 * @param cfg CORS settings.
 * @returns A headers object with proper Access-Control-* fields.
 */
export const buildCorsHeaders = (cfg: CorsConfig): Headers => {
  const origin = Array.isArray(cfg.allowOrigins) ? cfg.allowOrigins.join(",") : cfg.allowOrigins;
  const headers: Headers = {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin"
  };
  if (cfg.allowMethods?.length) headers["Access-Control-Allow-Methods"] = cfg.allowMethods.join(",");
  if (cfg.allowHeaders?.length) headers["Access-Control-Allow-Headers"] = cfg.allowHeaders.join(",");
  if (cfg.exposeHeaders?.length) headers["Access-Control-Expose-Headers"] = cfg.exposeHeaders.join(",");
  if (cfg.allowCredentials) headers["Access-Control-Allow-Credentials"] = "true";
  if (typeof cfg.maxAgeSeconds === "number") headers["Access-Control-Max-Age"] = String(cfg.maxAgeSeconds);
  return headers;
}

/**
 * Returns true if the request is an OPTIONS CORS preflight.
 *
 * @param evt API event.
 * @returns True when the method is OPTIONS.
 */
export const isPreflight = (evt: ApiEvent): boolean =>
  (evt.requestContext.http.method ?? "").toUpperCase() === "OPTIONS";

/**
 * Creates a 204 No Content response for preflight requests.
 *
 * @param headers Precomputed CORS headers to include.
 * @returns API Gateway proxy response suitable for preflight replies.
 */
export const preflightResponse = (headers: Headers): ApiResponse => ({
  statusCode: 204,
  headers,
  body: ""
});
