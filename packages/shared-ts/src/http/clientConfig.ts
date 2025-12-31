/**
 * @fileoverview HttpClientConfig - Shared configuration interface for HTTP clients
 * @summary Common configuration interface for service-to-service HTTP clients
 * @description Provides a standardized configuration interface for HTTP clients
 * used for inter-service communication, reducing code duplication across services.
 */

/**
 * Base configuration for HTTP clients
 * @description Standard configuration interface for HTTP clients that communicate
 * with other microservices. Extend this interface for service-specific configurations.
 */
export interface HttpClientConfig {
  /** Base URL of the target service API */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Optional function to get authentication token for requests */
  getAuthToken?: () => Promise<string>;
}

