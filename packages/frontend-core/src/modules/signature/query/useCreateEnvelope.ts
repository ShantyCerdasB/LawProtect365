/**
 * @fileoverview useCreateEnvelope Hook - React Query mutation for creating envelopes
 * @summary Custom hook for creating new signature envelopes
 * @description
 * Provides a React Query mutation hook to create new signature envelopes.
 * This hook is platform-agnostic and can be used in both web and mobile apps.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEnvelope } from '../api';
import { queryKeys } from '../../../foundation/query/queryKeys';
import type { UseSignatureConfig, CreateEnvelopeParams } from '../interfaces/SignatureQueryInterfaces';

/**
 * @description React Query mutation hook for creating a new envelope.
 * @param config Configuration object with httpClient
 * @returns React Query mutation result with create function and state
 *
 * @example
 * ```tsx
 * const { mutate, isPending, error } = useCreateEnvelope({ httpClient });
 *
 * const handleCreate = () => {
 *   mutate({
 *     title: 'Contract',
 *     originType: 'UPLOAD',
 *     sourceKey: 's3-key',
 *     metaKey: 'meta-key'
 *   });
 * };
 * ```
 */
export function useCreateEnvelope(config: UseSignatureConfig) {
  const { httpClient } = config;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateEnvelopeParams) => {
      return createEnvelope(httpClient, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.signature.envelopes() });
    },
  });
}

