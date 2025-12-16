/**
 * @fileoverview Signature Hooks Interfaces - Types for signature hooks
 * @summary Type definitions for signature hook configurations
 * @description
 * Defines interfaces used by signature hooks, such as useSignatureHttpClient.
 * These interfaces are platform-agnostic and reusable across web and mobile.
 */

import type { StoragePort } from '../../../ports/storage/StoragePort';

/**
 * @description Configuration for useSignatureHttpClient hook.
 */
export interface UseSignatureHttpClientConfig {
  /**
   * @description Fetch implementation (window.fetch for web, global.fetch for mobile).
   */
  fetchImpl: typeof fetch;
  /**
   * @description Storage port for retrieving auth tokens.
   */
  storage: StoragePort;
  /**
   * @description Storage key for the authentication token.
   */
  tokenKey?: string;
  /**
   * @description Optional custom base URL (overrides env config).
   */
  baseUrl?: string;
}

