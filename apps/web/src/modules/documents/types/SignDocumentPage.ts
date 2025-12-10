/**
 * @fileoverview Sign Document Page Types - Types for sign document page component
 * @summary Type definitions for sign document page component props
 * @description Defines interfaces for the sign document page component
 * used for the complete document signing workflow.
 */

/**
 * @description Props for the SignDocumentPage component.
 */
export interface SignDocumentPageProps {
  /** Envelope ID for the document to sign */
  envelopeId: string;
  /** Signer ID for the current user */
  signerId: string;
  /** Optional invitation token for external signers */
  invitationToken?: string;
}

