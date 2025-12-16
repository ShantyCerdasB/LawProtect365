/**
 * @fileoverview useSignatureHttpClient Hook - React hook for signature service HTTP client
 * @summary Custom hook to create and memoize signature service HTTP client
 * @description
 * Provides a React hook to create an intercepted HTTP client configured for the signature service.
 * This hook handles authentication tokens and network context automatically.
 * It's platform-agnostic and works in both web and mobile apps.
 */

import { useMemo } from 'react';
import { createInterceptedHttpClient } from '../../../foundation/http';
import { env } from '../../../foundation/config/env';
import type { UseSignatureHttpClientConfig } from '../interfaces/SignatureHooksInterfaces';

/**
 * @description React hook to create a signature service HTTP client.
 * @param config Configuration with fetch implementation and storage
 * @returns Intercepted HTTP client configured for signature service
 *
 * @example
 * ```tsx
 * // In web app
 * import { useSignatureHttpClient } from '@lawprotect/frontend-core';
 * import { LocalStorageAdapter } from './adapters/LocalStorageAdapter';
 *
 * function MyComponent() {
 *   const httpClient = useSignatureHttpClient({
 *     fetchImpl: window.fetch,
 *     storage: new LocalStorageAdapter(),
 *     tokenKey: 'auth_token'
 *   });
 *
 *   // Use httpClient with signature hooks
 * }
 * ```
 *
 * @example
 * ```tsx
 * // In mobile app
 * import { useSignatureHttpClient } from '@lawprotect/frontend-core';
 * import { AsyncStorageAdapter } from './adapters/AsyncStorageAdapter';
 *
 * function MyComponent() {
 *   const httpClient = useSignatureHttpClient({
 *     fetchImpl: global.fetch,
 *     storage: new AsyncStorageAdapter(),
 *     tokenKey: 'auth_token'
 *   });
 *
 *   // Use httpClient with signature hooks
 * }
 * ```
 */
export function useSignatureHttpClient(config: UseSignatureHttpClientConfig) {
  const { fetchImpl, storage, tokenKey = 'auth_token', baseUrl } = config;

  return useMemo(() => {
    // Wrap fetch to ensure correct context (fixes "Illegal invocation" error)
    const wrappedFetch: typeof fetch = async (input, init) => {
      return fetchImpl(input, init);
    };
    
    return createInterceptedHttpClient({
      baseUrl: baseUrl || env.signatureApiBaseUrl,
      fetchImpl: wrappedFetch,
      getAuthToken: async () => {
        return storage.get<string>(tokenKey);
      },
      // Network context can be added here if needed
      // getNetworkContext: async () => { ... }
    });
  }, [fetchImpl, storage, tokenKey, baseUrl]);
}

