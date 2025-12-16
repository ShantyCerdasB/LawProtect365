/**
 * @fileoverview useEnvelopes Hook - React Query hook for listing user envelopes
 * @summary Custom hook for fetching and managing user's signature envelopes
 * @description
 * Provides a React Query hook to fetch paginated list of user's envelopes with filtering options.
 * This hook is platform-agnostic and can be used in both web and mobile apps.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getEnvelopesByUser } from '../api';
import { queryKeys } from '../../../foundation/query/queryKeys';
import type { UseSignatureConfig, UseEnvelopesParams } from '../interfaces/SignatureQueryInterfaces';

/**
 * @description React Query hook for fetching user's envelopes.
 * @param config Configuration object with httpClient
 * @param params Query parameters for filtering and pagination
 * @returns React Query result with envelopes data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useEnvelopes({
 *   httpClient
 * }, {
 *   status: 'SENT',
 *   limit: 20
 * });
 * ```
 */
export function useEnvelopes(
  config: UseSignatureConfig,
  params?: UseEnvelopesParams
) {
  const { httpClient } = config;
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.signature.envelopes(params),
    queryFn: async () => {
      return getEnvelopesByUser(httpClient, params);
    },
    enabled: true,
  });
}

