/**
 * @fileoverview useShareDocumentView Hook - React Query mutation for sharing document view
 * @summary Custom hook for sharing document view access
 * @description
 * Provides a React Query mutation hook to share document view access with external users.
 * This hook is platform-agnostic and can be used in both web and mobile apps.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shareDocumentView } from '../api';
import { queryKeys } from '../../../foundation/query/queryKeys';
import type { UseSignatureConfig, ShareDocumentViewParams } from '../interfaces/SignatureQueryInterfaces';

/**
 * @description React Query mutation hook for sharing document view.
 * @param config Configuration object with httpClient
 * @returns React Query mutation result with share function and state
 *
 * @example
 * ```tsx
 * const { mutate, isPending, error } = useShareDocumentView({ httpClient });
 *
 * const handleShare = () => {
 *   mutate({
 *     envelopeId: 'envelope-123',
 *     email: 'viewer@example.com',
 *     fullName: 'John Doe',
 *     message: 'Please review this document',
 *     expiresIn: 7
 *   });
 * };
 * ```
 */
export function useShareDocumentView(config: UseSignatureConfig) {
  const { httpClient } = config;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ShareDocumentViewParams) => {
      const { envelopeId, ...body } = params;
      return shareDocumentView(httpClient, envelopeId, body);
    },
    onSuccess: (_data: unknown, variables: ShareDocumentViewParams) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.signature.envelope(variables.envelopeId) });
    },
  });
}

