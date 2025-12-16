/**
 * @fileoverview useUpdateEnvelope Hook - React Query mutation for updating envelopes
 * @summary Custom hook for updating existing signature envelopes
 * @description
 * Provides a React Query mutation hook to update envelope metadata and signers.
 * This hook is platform-agnostic and can be used in both web and mobile apps.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateEnvelope } from '../api';
import { queryKeys } from '../../../foundation/query/queryKeys';
import type { UseSignatureConfig, UpdateEnvelopeParams } from '../interfaces/SignatureQueryInterfaces';

/**
 * @description React Query mutation hook for updating an envelope.
 * @param config Configuration object with httpClient
 * @returns React Query mutation result with update function and state
 *
 * @example
 * ```tsx
 * const { mutate, isPending, error } = useUpdateEnvelope({ httpClient });
 *
 * const handleUpdate = () => {
 *   mutate({
 *     envelopeId: 'envelope-123',
 *     title: 'Updated Title'
 *   });
 * };
 * ```
 */
export function useUpdateEnvelope(config: UseSignatureConfig) {
  const { httpClient } = config;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateEnvelopeParams) => {
      const { envelopeId, ...body } = params;
      return updateEnvelope(httpClient, envelopeId, body);
    },
    onSuccess: (_data: unknown, variables: UpdateEnvelopeParams) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.signature.envelopes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.signature.envelope(variables.envelopeId) });
    },
  });
}

