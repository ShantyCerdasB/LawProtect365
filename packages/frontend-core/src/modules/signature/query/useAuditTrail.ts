/**
 * @fileoverview useAuditTrail Hook - React Query hook for fetching audit trail
 * @summary Custom hook for fetching envelope audit trail
 * @description
 * Provides a React Query hook to fetch the complete audit trail for an envelope.
 * This hook is platform-agnostic and can be used in both web and mobile apps.
 */

import { useQuery } from '@tanstack/react-query';
import { getAuditTrail } from '../api';
import { queryKeys } from '../../../foundation/query/queryKeys';
import type { UseSignatureConfig } from '../interfaces/SignatureQueryInterfaces';

/**
 * @description React Query hook for fetching audit trail.
 * @param config Configuration object with httpClient
 * @param envelopeId Envelope ID to fetch audit trail for
 * @returns React Query result with audit trail data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useAuditTrail({
 *   httpClient
 * }, 'envelope-123');
 * ```
 */
export function useAuditTrail(
  config: UseSignatureConfig,
  envelopeId: string
) {
  const { httpClient } = config;

  return useQuery({
    queryKey: queryKeys.signature.auditTrail(envelopeId),
    queryFn: async () => {
      return getAuditTrail(httpClient, envelopeId);
    },
    enabled: !!envelopeId,
  });
}

