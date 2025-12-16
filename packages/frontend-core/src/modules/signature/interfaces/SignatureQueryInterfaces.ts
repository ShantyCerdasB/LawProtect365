/**
 * @fileoverview Signature Query Interfaces - Types for signature query hooks
 * @summary Type definitions for signature query hooks
 * @description
 * Defines interfaces used by signature query hooks, such as useEnvelopes, useCreateEnvelope, etc.
 * These interfaces are platform-agnostic and reusable across web and mobile.
 */

import type { HttpClient } from '../../../foundation/http/httpClient';

/**
 * @description Configuration for signature query hooks.
 */
export interface UseSignatureConfig {
  /**
   * @description HTTP client instance for API calls.
   */
  httpClient: HttpClient;
}

/**
 * @description Parameters for listing envelopes.
 */
export interface UseEnvelopesParams {
  /**
   * @description Filter by envelope status.
   */
  status?: string;
  /**
   * @description Number of envelopes per page.
   */
  limit?: number;
  /**
   * @description Cursor for pagination.
   */
  cursor?: string;
  /**
   * @description Whether to include signers in response.
   */
  includeSigners?: boolean;
}

/**
 * @description Parameters for getting a single envelope.
 */
export interface UseEnvelopeParams {
  /**
   * @description Envelope ID.
   */
  envelopeId: string;
  /**
   * @description Invitation token for external users.
   */
  invitationToken?: string;
  /**
   * @description Whether to include signers in response.
   */
  includeSigners?: boolean;
}

/**
 * @description Parameters for creating an envelope.
 */
export interface CreateEnvelopeParams {
  /**
   * @description Envelope title.
   */
  title: string;
  /**
   * @description Envelope description.
   */
  description?: string;
  /**
   * @description Signing order type.
   */
  signingOrderType?: 'OWNER_FIRST' | 'INVITEES_FIRST';
  /**
   * @description Document origin type.
   */
  originType: 'UPLOAD' | 'TEMPLATE' | 'GENERATED';
  /**
   * @description Template ID (required if originType is TEMPLATE).
   */
  templateId?: string;
  /**
   * @description Template version (required if originType is TEMPLATE).
   */
  templateVersion?: string;
  /**
   * @description Expiration date.
   */
  expiresAt?: string;
  /**
   * @description S3 key for source document.
   */
  sourceKey: string;
  /**
   * @description S3 key for metadata.
   */
  metaKey: string;
}

/**
 * @description Parameters for updating an envelope.
 */
export interface UpdateEnvelopeParams {
  /**
   * @description Envelope ID.
   */
  envelopeId: string;
  /**
   * @description Updated title.
   */
  title?: string;
  /**
   * @description Updated description.
   */
  description?: string;
  /**
   * @description Updated expiration date.
   */
  expiresAt?: string;
  /**
   * @description Updated signing order type.
   */
  signingOrderType?: 'OWNER_FIRST' | 'INVITEES_FIRST';
  /**
   * @description Updated source key.
   */
  sourceKey?: string;
  /**
   * @description Updated meta key.
   */
  metaKey?: string;
  /**
   * @description Signers to add.
   */
  addSigners?: Array<{
    email: string;
    fullName: string;
    order?: number;
    isExternal: boolean;
    userId?: string;
  }>;
  /**
   * @description Signer IDs to remove.
   */
  removeSignerIds?: string[];
}

/**
 * @description Parameters for sending an envelope.
 */
export interface SendEnvelopeParams {
  /**
   * @description Envelope ID.
   */
  envelopeId: string;
  /**
   * @description General message for all signers.
   */
  message?: string;
  /**
   * @description Send to all external signers.
   */
  sendToAll?: boolean;
  /**
   * @description Specific signers with custom messages.
   */
  signers?: Array<{
    signerId: string;
    message?: string;
  }>;
}

/**
 * @description Parameters for signing a document.
 */
export interface SignDocumentParams {
  /**
   * @description Envelope ID.
   */
  envelopeId: string;
  /**
   * @description Invitation token (for external users).
   */
  invitationToken?: string;
  /**
   * @description Signer ID (for authenticated users).
   */
  signerId?: string;
  /**
   * @description Flattened PDF key.
   */
  flattenedKey?: string;
  /**
   * @description Signed document as base64.
   */
  signedDocument?: string;
  /**
   * @description Consent information.
   */
  consent: {
    given: boolean;
    timestamp: string;
    text: string;
    ipAddress?: string;
    userAgent?: string;
    country?: string;
  };
}

/**
 * @description Parameters for declining a signer.
 */
export interface DeclineSignerParams {
  /**
   * @description Envelope ID.
   */
  envelopeId: string;
  /**
   * @description Signer ID.
   */
  signerId: string;
  /**
   * @description Invitation token (for external users).
   */
  invitationToken: string;
  /**
   * @description Decline reason.
   */
  reason: string;
  /**
   * @description Optional metadata.
   */
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    timestamp?: string;
  };
}

/**
 * @description Parameters for sharing document view.
 */
export interface ShareDocumentViewParams {
  /**
   * @description Envelope ID.
   */
  envelopeId: string;
  /**
   * @description Viewer email.
   */
  email: string;
  /**
   * @description Viewer full name.
   */
  fullName: string;
  /**
   * @description Optional message.
   */
  message?: string;
  /**
   * @description Expiration in days.
   */
  expiresIn?: number;
}

/**
 * @description Parameters for downloading a document.
 */
export interface DownloadDocumentParams {
  /**
   * @description Envelope ID.
   */
  envelopeId: string;
  /**
   * @description Invitation token (for external users).
   */
  invitationToken?: string;
  /**
   * @description Expiration time in seconds.
   */
  expiresIn?: number;
}

