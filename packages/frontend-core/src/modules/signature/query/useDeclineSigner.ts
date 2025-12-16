/**
 * @fileoverview useDeclineSigner Hook - React Query mutation for declining signing
 * @summary Custom hook for signers to decline signing documents
 * @description
 * Provides a React Query mutation hook for signers to decline signing with a reason.
 * This hook is platform-agnostic and can be used in both web and mobile apps.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { declineSigner } from '../api';
import { queryKeys } from '../../../foundation/query/queryKeys';
import type { UseSignatureConfig, DeclineSignerParams } from '../interfaces/SignatureQueryInterfaces';

/**
 * @description React Query mutation hook for declining a signer.
 * @param config Configuration object with httpClient
 * @returns React Query mutation result with decline function and state
 *
 * @example
 * ```tsx
 * const { mutate, isPending, error } = useDeclineSigner({ httpClient });
 *
 * const handleDecline = () => {
 *   mutate({
 *     envelopeId: 'envelope-123',
 *     signerId: 'signer-456',
 *     invitationToken: 'token-abc',
 *     reason: 'I do not agree with the terms'
 *   });
 * };
 * ```
 */
export function useDeclineSigner(config: UseSignatureConfig) {
  const { httpClient } = config;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DeclineSignerParams) => {
      const { envelopeId, signerId, ...body } = params;
      return declineSigner(httpClient, envelopeId, signerId, body);
    },
    onSuccess: (_data: unknown, variables: DeclineSignerParams) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.signature.envelopes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.signature.envelope(variables.envelopeId) });
    },
  });
}

