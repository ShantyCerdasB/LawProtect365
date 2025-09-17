/**
 * @fileoverview DocumentStatus enum - Defines all possible states for a document
 * @summary Enumerates the lifecycle states of a document in the system
 * @description The DocumentStatus enum defines all possible states a document can be in
 * during its lifecycle, from creation to completion or archival.
 */

/**
 * Document status enumeration
 * 
 * Defines all possible states for a document throughout its lifecycle.
 * States represent the document's processing and readiness status.
 */
export enum DocumentStatus {
  /**
   * Document is being edited or assembled
   * - Document is in draft state
   * - Can be modified
   * - Not ready for signing
   */
  DRAFT = 'DRAFT',

  /**
   * Document is being processed
   * - Document is being flattened or processed
   * - Cannot be modified
   * - Not ready for signing yet
   */
  FLATTENED = 'FLATTENED',

  /**
   * Document is ready for signing
   * - Document processing is complete
   * - Ready to be included in signing envelope
   * - Cannot be modified
   */
  READY = 'READY',

  /**
   * Document is currently being signed
   * - There is an active signing envelope
   * - Cannot be modified
   * - Signing process in progress
   */
  IN_SIGNING = 'IN_SIGNING',

  /**
   * Document signing is completed
   * - All signatures have been applied
   * - Certificate is available
   * - Cannot be modified
   * - Final state for successful signing
   */
  COMPLETED = 'COMPLETED',

  /**
   * Document has been voided or cancelled
   * - Signing process was cancelled
   * - Cannot be modified
   * - Final state for cancelled document
   */
  VOID = 'VOID',

  /**
   * Document has been archived
   * - Document is retained for compliance
   * - Read-only state
   * - Cannot be modified
   * - Final state for archived document
   */
  ARCHIVED = 'ARCHIVED'
}

/**
 * Valid status transitions for documents
 */
export const DOCUMENT_STATUS_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  [DocumentStatus.DRAFT]: [
    DocumentStatus.FLATTENED,
    DocumentStatus.VOID
  ],
  [DocumentStatus.FLATTENED]: [
    DocumentStatus.READY,
    DocumentStatus.VOID
  ],
  [DocumentStatus.READY]: [
    DocumentStatus.IN_SIGNING,
    DocumentStatus.VOID
  ],
  [DocumentStatus.IN_SIGNING]: [
    DocumentStatus.COMPLETED,
    DocumentStatus.VOID
  ],
  [DocumentStatus.COMPLETED]: [
    DocumentStatus.ARCHIVED
  ],
  [DocumentStatus.VOID]: [],
  [DocumentStatus.ARCHIVED]: []
};

/**
 * Checks if a document status transition is valid
 */
export function isValidDocumentStatusTransition(from: DocumentStatus, to: DocumentStatus): boolean {
  return DOCUMENT_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Gets all valid next statuses for a document
 */
export function getValidNextDocumentStatuses(currentStatus: DocumentStatus): DocumentStatus[] {
  return DOCUMENT_STATUS_TRANSITIONS[currentStatus];
}

/**
 * Checks if a document is ready for signing
 */
export function isDocumentReadyForSigning(status: DocumentStatus): boolean {
  return status === DocumentStatus.READY || status === DocumentStatus.FLATTENED;
}

/**
 * Checks if a document can be modified
 */
export function canDocumentBeModified(status: DocumentStatus): boolean {
  return status === DocumentStatus.DRAFT;
}

/**
 * Checks if a document is in a final state
 */
export function isDocumentInFinalState(status: DocumentStatus): boolean {
  return [
    DocumentStatus.COMPLETED,
    DocumentStatus.VOID,
    DocumentStatus.ARCHIVED
  ].includes(status);
}
