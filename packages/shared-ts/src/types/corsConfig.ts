
/**
 * CORS configuration contract.
 */
export interface CorsConfig {
  /**
   * Allowed origins. Use "*" for public endpoints, or a list for restricted.
   */
  allowOrigins: "*" | string[];
  /**
   * Allowed HTTP methods for cross-origin requests.
   * Defaults can be provided by the caller.
   */
  allowMethods?: string[];
  /**
   * Allowed HTTP headers for cross-origin requests.
   * Use ["*"] to allow any header.
   */
  allowHeaders?: string[];
  /**
   * Headers to expose to the browser.
   */
  exposeHeaders?: string[];
  /**
   * Whether to allow credentials (cookies, authorization headers).
   */
  allowCredentials?: boolean;
  /**
   * Max age (in seconds) for preflight caching.
   */
  maxAgeSeconds?: number;
}