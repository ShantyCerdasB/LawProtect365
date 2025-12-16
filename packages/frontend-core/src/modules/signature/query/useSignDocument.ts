/**
 * @fileoverview useSignDocument Hook - React Query mutation for signing documents
 * @summary Custom hook for signing documents within envelopes
 * @description
 * Provides a React Query mutation hook to sign documents with consent and signature data.
 * This hook is platform-agnostic and can be used in both web and mobile apps.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signDocument } from '../api';
import { queryKeys } from '../../../foundation/query/queryKeys';
import type { UseSignatureConfig, SignDocumentParams } from '../interfaces/SignatureQueryInterfaces';

/**
 * @description React Query mutation hook for signing a document.
 * @param config Configuration object with httpClient
 * @returns React Query mutation result with sign function and state
 *
 * @example
 * ```tsx
 * const { mutate, isPending, error } = useSignDocument({ httpClient });
 *
 * const handleSign = () => {
 *   mutate({
 *     envelopeId: 'envelope-123',
 *     invitationToken: 'token-abc',
 *     signedDocument: 'base64-pdf',
 *     consent: {
 *       given: true,
 *       timestamp: new Date().toISOString(),
 *       text: 'I consent to electronic signature'
 *     }
 *   });
 * };
 * ```
 */
export function useSignDocument(config: UseSignatureConfig) {
  const { httpClient } = config;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SignDocumentParams) => {
      const { envelopeId, ...body } = params;
      return signDocument(httpClient, envelopeId, body);
    },
    onSuccess: (_data: unknown, variables: SignDocumentParams) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.signature.envelopes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.signature.envelope(variables.envelopeId) });
    },
  });
}

