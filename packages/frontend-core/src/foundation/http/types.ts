/**
 * @fileoverview HTTP Types - Shared types for HTTP client context and headers
 * @summary Type definitions for network context and header building
 * @description Defines NetworkContext and related types used by HttpClient and interceptors.
 */
export type NetworkContext = {
  /**
   * @description Client IP address if available.
   */
  ip?: string;
  /**
   * @description Client country code (e.g. ISO alpha-2) if available.
   */
  country?: string;
  /**
   * @description Client user agent string if available.
   */
  userAgent?: string;
  /**
   * @description Correlation or request identifier if available.
   */
  requestId?: string;
};

