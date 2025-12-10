/**
 * @fileoverview useAuth Hook - React Query hook for authentication
 * @summary Custom hook for managing authenticated user state
 * @description Provides a React Query hook to fetch and manage the authenticated user's profile,
 * with automatic token management via storage ports and HTTP client integration.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, patchMe } from '../api';
import { queryKeys } from '../../../foundation/query/queryKeys';
import type { UseAuthConfig } from '../interfaces';

/**
 * @description React Query hook for fetching the authenticated user's profile.
 * @param config Configuration object with httpClient and storage
 * @returns React Query result with user data, loading state, and error
 *
 * @example
 * ```tsx
 * // In web app (apps/web)
 * import { useAuth } from '@lawprotect/frontend-core';
 * import { createInterceptedHttpClient } from '@lawprotect/frontend-core';
 * import { LocalStorageAdapter } from './adapters/LocalStorageAdapter';
 *
 * function App() {
 *   const httpClient = createInterceptedHttpClient({
 *     baseUrl: 'https://api.example.com',
 *     fetchImpl: window.fetch,
 *     getAuthToken: async () => {
 *       const storage = new LocalStorageAdapter();
 *       return await storage.get('auth_token');
 *     }
 *   });
 *
 *   const { data: user, isLoading } = useAuth({
 *     httpClient,
 *     storage: new LocalStorageAdapter(),
 *     tokenKey: 'auth_token'
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   return <div>Welcome, {user?.name}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // In mobile app (apps/mobile)
 * import { useAuth } from '@lawprotect/frontend-core';
 * import { createInterceptedHttpClient } from '@lawprotect/frontend-core';
 * import { AsyncStorageAdapter } from './adapters/AsyncStorageAdapter';
 *
 * function App() {
 *   const httpClient = createInterceptedHttpClient({
 *     baseUrl: 'https://api.example.com',
 *     fetchImpl: global.fetch,
 *     getAuthToken: async () => {
 *       const storage = new AsyncStorageAdapter();
 *       return await storage.get('auth_token');
 *     }
 *   });
 *
 *   const { data: user, isLoading } = useAuth({
 *     httpClient,
 *     storage: new AsyncStorageAdapter(),
 *     tokenKey: 'auth_token'
 *   });
 *
 *   if (isLoading) return <Text>Loading...</Text>;
 *   return <Text>Welcome, {user?.name}</Text>;
 * }
 * ```
 */
export function useAuth<T = unknown>(config: UseAuthConfig) {
  const { httpClient, storage, tokenKey = 'auth_token' } = config;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const token = await storage.get<string>(tokenKey);
      if (!token) {
        throw new Error('No authentication token found');
      }
      return getMe<T>(httpClient);
    },
    enabled: false, // Manual trigger - call refetch() after login
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: unknown) => {
      return patchMe<T>(httpClient, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });

  return {
    ...query,
    user: query.data,
    updateUser: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}


