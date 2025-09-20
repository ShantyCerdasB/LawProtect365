/**
 * @fileoverview DocumentAccess types - Type definitions for document access operations
 * @summary Infrastructure types for document access and view link generation
 * @description Defines interfaces and types for document access operations including
 * view link generation, document information, and access parameters.
 */

import { EnvelopeSecurityContext } from '../envelope/EnvelopeSecurityContext';

/**
 * Parameters for generating view link for invitation
 */
export interface GenerateViewLinkParams {
  /** Invitation token for validation */
  invitationToken: string;
  /** Optional TTL in seconds for the generated URL */
  requestedTtlSeconds?: number;
  /** Security context for the request */
  securityContext: EnvelopeSecurityContext;
}

/**
 * Result of view link generation
 */
export interface ViewLinkResult {
  /** Document information with view URL */
  document: {
    viewUrl: string;
    filename?: string;
    contentType?: string;
    size?: number;
  };
  /** Signer information */
  signer: any;
  /** Envelope information */
  envelope: any;
}

/**
 * Document information from S3
 */
export interface DocumentInfo {
  filename?: string;
  contentType?: string;
  size?: number;
}
