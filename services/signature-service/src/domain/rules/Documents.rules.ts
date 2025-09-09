import type { Document } from "../entities/Document";
import type { Envelope } from "../entities/Envelope";
import { DocumentStatusSchema, type DocumentStatus } from "@/domain/value-objects/index";
import { ALLOWED_CONTENT_TYPES } from "../values/enums";
import { invalidDocumentState, invalidDocumentContent } from "@/shared/errors";

/**
 * Validates that a document status transition is allowed.
 *
 * Allowed path:
 *   pending → uploaded → processing → ready
 *   pending → uploaded → error
 *   error → uploaded → processing → ready
 *
 * Rules:
 * - No backward transitions from ready/error to pending.
 * - Error state can be recovered by re-uploading.
 * - Processing is an intermediate state.
 *
 * @param from - Current document status
 * @param to - Target document status
 * @throws {ConflictError} When the transition is not allowed
 */
export const assertDocumentStatusTransition = (from: DocumentStatus, to: DocumentStatus): void => {
  const sFrom = DocumentStatusSchema.parse(from);
  const sTo = DocumentStatusSchema.parse(to);

  // Idempotent transitions are fine
  if (sFrom === sTo) return;

  // Forward-only transitions
  if (sFrom === "pending" && sTo === "uploaded") return;
  if (sFrom === "uploaded" && (sTo === "processing" || sTo === "error")) return;
  if (sFrom === "processing" && (sTo === "ready" || sTo === "error")) return;
  if (sFrom === "error" && sTo === "uploaded") return; // Recovery

  throw invalidDocumentState({ from: sFrom, to: sTo });
};

/**
 * Ensures a document is in a state that allows structural mutations
 * (e.g., renaming, updating metadata).
 *
 * @param doc - Document to check
 * @throws {ConflictError} When the document is not in a mutable state
 */
export const assertDocumentMutable = (doc: Pick<Document, "status" | "documentId">): void => {
  if (doc.status === "processing") {
    throw invalidDocumentState({
      documentId: doc.documentId,
      status: doc.status,
      reason: "Document is currently being processed and cannot be modified",
    });
  }
};

/**
 * Validates document content type is supported.
 *
 * @param contentType - MIME type to validate
 * @throws {BadRequestError} When content type is not supported
 */
export const assertSupportedContentType = (contentType: string): void => {
  if (!ALLOWED_CONTENT_TYPES.includes(contentType as any)) {
    throw invalidDocumentContent({
      contentType,
      reason: `Content type '${contentType}' is not supported. Allowed types: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
    });
  }
};

/**
 * Validates document size is within acceptable limits.
 *
 * @param size - Document size in bytes
 * @param maxSize - Maximum allowed size in bytes (default: 50MB)
 * @throws {BadRequestError} When document size exceeds limit
 */
export const assertDocumentSizeLimit = (size: number, maxSize: number = 50 * 1024 * 1024): void => {
  if (size > maxSize) {
    throw invalidDocumentContent({
      size,
      reason: `Document size ${size} bytes exceeds maximum limit of ${maxSize} bytes`,
    });
  }
};

/**
 * Ensures the document belongs to the specified envelope.
 *
 * @param doc - Document to check
 * @param envelopeId - Expected envelope ID
 * @throws {BadRequestError} When document does not belong to envelope
 */
export const assertDocumentBelongsToEnvelope = (
  doc: Pick<Document, "envelopeId" | "documentId">,
  envelopeId: string
): void => {
  if (doc.envelopeId !== envelopeId) {
    throw invalidDocumentState({
      documentId: doc.documentId,
      reason: `Document does not belong to envelope ${envelopeId}`,
    });
  }
};

/**
 * Ensures the envelope is in draft state for document modifications.
 *
 * @param envelope - Envelope to check
 * @throws {ConflictError} When envelope is not in draft state
 */
export const assertEnvelopeDraftForDocumentModification = (
  envelope: Pick<Envelope, "status" | "envelopeId">
): void => {
  if (envelope.status !== "draft") {
    throw invalidDocumentState({
      envelopeId: envelope.envelopeId,
      reason: "Document modifications are only allowed when envelope is in draft state",
    });
  }
};

/**
 * Validates that a document lock can be deleted by the specified user.
 *
 * @param lock - Document lock to validate
 * @param ownerId - User ID attempting to delete the lock
 * @throws {BadRequestError} When lock cannot be deleted by the user
 */
export const assertDocumentLockDeletable = (
  lock: { lockId: string; ownerId: string; expiresAt: string },
  ownerId: string
): void => {
  if (lock.ownerId !== ownerId) {
    throw invalidDocumentState({
      reason: `User ${ownerId} does not own lock ${lock.lockId}`,
    });
  }

  const lockExpiry = new Date(lock.expiresAt);
  const now = new Date();
  
  if (lockExpiry <= now) {
    throw invalidDocumentState({
      reason: `Lock ${lock.lockId} has already expired`,
    });
  }
};






