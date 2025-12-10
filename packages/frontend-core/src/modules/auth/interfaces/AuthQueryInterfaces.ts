/**
 * @fileoverview Auth Query Interfaces - Types for auth query hooks
 * @summary Type definitions for authentication query hooks
 * @description
 * Defines interfaces used by authentication query hooks, such as useAuth.
 * These interfaces are platform-agnostic and reusable across web and mobile.
 */

import type { HttpClient } from '../../../foundation/http/httpClient';
import type { StoragePort } from '../../../ports/storage/StoragePort';

/**
 * @description Configuration for the useAuth hook.
 */
export interface UseAuthConfig {
  /**
   * @description HTTP client instance for API calls.
   */
  httpClient: HttpClient;
  /**
   * @description Storage port for token management.
   */
  storage: StoragePort;
  /**
   * @description Storage key for the authentication token.
   */
  tokenKey?: string;
}

