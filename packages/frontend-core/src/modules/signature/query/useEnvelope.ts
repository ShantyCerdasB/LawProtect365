/**
 * @fileoverview useEnvelope Hook - React Query hook for fetching a single envelope
 * @summary Custom hook for fetching envelope details by ID
 * @description
 * Provides a React Query hook to fetch a single envelope with optional invitation token support.
 * This hook is platform-agnostic and can be used in both web and mobile apps.
 */

import { useQuery } from '@tanstack/react-query';
import { getEnvelope } from '../api';
import { queryKeys } from '../../../foundation/query/queryKeys';
import type { UseSignatureConfig, UseEnvelopeParams } from '../interfaces/SignatureQueryInterfaces';

/**
 * @description React Query hook for fetching a single envelope.
 * @param config Configuration object with httpClient
 * @param params Parameters with envelopeId and optional invitationToken
 * @returns React Query result with envelope data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useEnvelope({
 *   httpClient
 * }, {
 *   envelopeId: 'envelope-123',
 *   invitationToken: 'token-abc' // optional for external users
 * });
 * ```
 */
export function useEnvelope(
  config: UseSignatureConfig,
  params: UseEnvelopeParams
) {
  const { httpClient } = config;
  const { envelopeId, invitationToken, includeSigners = true } = params;

  return useQuery({
    queryKey: queryKeys.signature.envelope(envelopeId, { invitationToken }),
    queryFn: async () => {
      return getEnvelope(httpClient, envelopeId, {
        invitationToken,
        includeSigners
      });
    },
    enabled: !!envelopeId,
  });
}

