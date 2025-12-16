/**
 * @fileoverview useDownloadDocument Hook - React Query mutation for downloading documents
 * @summary Custom hook for downloading signed documents
 * @description
 * Provides a React Query mutation hook to download signed documents with presigned URLs.
 * This hook is platform-agnostic and can be used in both web and mobile apps.
 */

import { useMutation } from '@tanstack/react-query';
import { downloadDocument } from '../api';
import type { UseSignatureConfig, DownloadDocumentParams } from '../interfaces/SignatureQueryInterfaces';

/**
 * @description React Query mutation hook for downloading a document.
 * @param config Configuration object with httpClient
 * @returns React Query mutation result with download function and state
 *
 * @example
 * ```tsx
 * const { mutate, isPending, error } = useDownloadDocument({ httpClient });
 *
 * const handleDownload = () => {
 *   mutate({
 *     envelopeId: 'envelope-123',
 *     invitationToken: 'token-abc'
 *   }, {
 *     onSuccess: (data) => {
 *       window.open(data.downloadUrl, '_blank');
 *     }
 *   });
 * };
 * ```
 */
export function useDownloadDocument(config: UseSignatureConfig) {
  const { httpClient } = config;

  return useMutation({
    mutationFn: async (params: DownloadDocumentParams) => {
      const { envelopeId, ...queryParams } = params;
      return downloadDocument(httpClient, envelopeId, queryParams);
    },
  });
}

