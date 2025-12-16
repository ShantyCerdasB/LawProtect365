/**
 * @fileoverview useSendEnvelope Hook - React Query mutation for sending envelopes
 * @summary Custom hook for sending envelopes to signers
 * @description
 * Provides a React Query mutation hook to send envelopes to signers with invitation tokens.
 * This hook is platform-agnostic and can be used in both web and mobile apps.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendEnvelope } from '../api';
import { queryKeys } from '../../../foundation/query/queryKeys';
import type { UseSignatureConfig, SendEnvelopeParams } from '../interfaces/SignatureQueryInterfaces';

/**
 * @description React Query mutation hook for sending an envelope.
 * @param config Configuration object with httpClient
 * @returns React Query mutation result with send function and state
 *
 * @example
 * ```tsx
 * const { mutate, isPending, error } = useSendEnvelope({ httpClient });
 *
 * const handleSend = () => {
 *   mutate({
 *     envelopeId: 'envelope-123',
 *     sendToAll: true,
 *     message: 'Please sign this document'
 *   });
 * };
 * ```
 */
export function useSendEnvelope(config: UseSignatureConfig) {
  const { httpClient } = config;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SendEnvelopeParams) => {
      const { envelopeId, ...body } = params;
      return sendEnvelope(httpClient, envelopeId, body);
    },
    onSuccess: (_data: unknown, variables: SendEnvelopeParams) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.signature.envelopes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.signature.envelope(variables.envelopeId) });
    },
  });
}

