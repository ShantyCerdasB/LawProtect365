/**
 * @fileoverview useCancelEnvelope Hook - React Query mutation for cancelling envelopes
 * @summary Custom hook for cancelling signature envelopes
 * @description
 * Provides a React Query mutation hook to cancel envelopes and revoke invitation tokens.
 * This hook is platform-agnostic and can be used in both web and mobile apps.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelEnvelope } from '../api';
import { queryKeys } from '../../../foundation/query/queryKeys';
import type { UseSignatureConfig } from '../interfaces/SignatureQueryInterfaces';

/**
 * @description React Query mutation hook for cancelling an envelope.
 * @param config Configuration object with httpClient
 * @returns React Query mutation result with cancel function and state
 *
 * @example
 * ```tsx
 * const { mutate, isPending, error } = useCancelEnvelope({ httpClient });
 *
 * const handleCancel = () => {
 *   mutate('envelope-123');
 * };
 * ```
 */
export function useCancelEnvelope(config: UseSignatureConfig) {
  const { httpClient } = config;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (envelopeId: string) => {
      return cancelEnvelope(httpClient, envelopeId);
    },
    onSuccess: (_data: unknown, envelopeId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.signature.envelopes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.signature.envelope(envelopeId) });
    },
  });
}

