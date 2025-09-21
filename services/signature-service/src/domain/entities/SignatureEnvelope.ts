/**
 * @fileoverview SignatureEnvelope entity - Core domain entity representing a document signing envelope
 * @summary Manages document signing workflow, signers, and envelope lifecycle
 * @description The SignatureEnvelope entity encapsulates all business logic related to document signing,
 * including signer management, status transitions, and signing order enforcement.
 * It serves as the aggregate root for the signing domain and manages S3 document keys directly.
 */

import { EnvelopeId } from '../value-objects/EnvelopeId';
import { SignerId } from '../value-objects/SignerId';
import { SigningOrder } from '../value-objects/SigningOrder';
import { DocumentOrigin } from '../value-objects/DocumentOrigin';
import { EnvelopeStatus } from '../value-objects/EnvelopeStatus';
import { S3Key } from '../value-objects/S3Key';
import { DocumentHash } from '../value-objects/DocumentHash';
import { SignerStatus } from '@prisma/client';
import { EnvelopeSigner } from './EnvelopeSigner';
import { CreateSignerData } from '../types/signer/CreateSignerData';
import { SigningOrderValidationRule } from '../rules/SigningOrderValidationRule';

import { 
  invalidEnvelopeState, 
  envelopeCompleted,
  signerEmailDuplicate,
  signerNotFound,
  signerCannotBeRemoved,
  invalidSignerState
} from '../../signature-errors';

/**
 * SignatureEnvelope entity representing a document signing workflow
 * 
 * An envelope manages the signing process for multiple signers and contains
 * S3 document keys directly. It enforces business rules around signing order, 
 * status transitions, and signer management.
 */
export class SignatureEnvelope {
  constructor(
    private readonly id: EnvelopeId,
    private readonly createdBy: SignerId, // User ID who created the envelope
    private readonly title: string,
    private readonly description: string | undefined,
    private status: EnvelopeStatus,
    private signers: EnvelopeSigner[],
    private readonly signingOrder: SigningOrder,
    private readonly origin: DocumentOrigin,
    // S3 document keys
    private readonly sourceKey: S3Key | undefined,
    private readonly metaKey: S3Key | undefined,
    private readonly flattenedKey: S3Key | undefined,
    private readonly signedKey: S3Key | undefined,
    // Content integrity hashes
    private readonly sourceSha256: DocumentHash | undefined,
    private readonly flattenedSha256: DocumentHash | undefined,
    private readonly signedSha256: DocumentHash | undefined,
    // Lifecycle timestamps
    private readonly sentAt: Date | undefined,
    private completedAt: Date | undefined,
    private readonly cancelledAt: Date | undefined,
    private readonly declinedAt: Date | undefined,
    private readonly declinedBySignerId: SignerId | undefined,
    private readonly declinedReason: string | undefined,
    private readonly expiresAt: Date | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  /**
   * Creates a SignatureEnvelope from persistence data
   * @param data - Prisma SignatureEnvelope data
   * @returns SignatureEnvelope instance
   */
  static fromPersistence(data: any): SignatureEnvelope {
    return new SignatureEnvelope(
      EnvelopeId.fromString(data.id),
      SignerId.fromString(data.createdBy),
      data.title,
      data.description,
      EnvelopeStatus.fromString(data.status),
      data.signers?.map((signer: any) => EnvelopeSigner.fromPersistence(signer)) || [],
      SigningOrder.fromString(data.signingOrderType),
      DocumentOrigin.fromString(data.originType, data.templateId, data.templateVersion),
      S3Key.fromStringOrUndefined(data.sourceKey),
      S3Key.fromStringOrUndefined(data.metaKey),
      S3Key.fromStringOrUndefined(data.flattenedKey),
      S3Key.fromStringOrUndefined(data.signedKey),
      DocumentHash.fromStringOrUndefined(data.sourceSha256),
      DocumentHash.fromStringOrUndefined(data.flattenedSha256),
      DocumentHash.fromStringOrUndefined(data.signedSha256),
      data.sentAt,
      data.completedAt,
      data.cancelledAt,
      data.declinedAt,
      data.declinedBySignerId ? SignerId.fromString(data.declinedBySignerId) : undefined,
      data.declinedReason,
      data.expiresAt,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Gets the envelope unique identifier
   * @returns The envelope ID value object
   */
  getId(): EnvelopeId {
    return this.id;
  }

  /**
   * Gets the user ID who created this envelope
   * @returns The user ID value object who created the envelope
   */
  getCreatedBy(): SignerId {
    return this.createdBy;
  }

  /**
   * Gets the envelope title
   * @returns The envelope title string
   */
  getTitle(): string {
    return this.title;
  }

  /**
   * Gets the envelope description
   * @returns The envelope description string or undefined if not set
   */
  getDescription(): string | undefined {
    return this.description;
  }

  /**
   * Gets the document origin configuration
   * @returns The document origin value object
   */
  getOrigin(): DocumentOrigin {
    return this.origin;
  }

  /**
   * Gets the template ID if using a template
   * @returns The template ID string or undefined if not using a template
   */
  getTemplateId(): string | undefined {
    return this.origin.getTemplateId();
  }

  /**
   * Gets the template version if using a template
   * @returns The template version string or undefined if not using a template
   */
  getTemplateVersion(): string | undefined {
    return this.origin.getTemplateVersion();
  }

  /**
   * Gets the S3 source key
   * @returns The S3 source key value object or undefined if not set
   */
  getSourceKey(): S3Key | undefined {
    return this.sourceKey;
  }

  /**
   * Gets the S3 meta key
   * @returns The S3 meta key value object or undefined if not set
   */
  getMetaKey(): S3Key | undefined {
    return this.metaKey;
  }

  /**
   * Gets the S3 flattened key
   * @returns The S3 flattened key value object or undefined if not set
   */
  getFlattenedKey(): S3Key | undefined {
    return this.flattenedKey;
  }

  /**
   * Gets the S3 signed key
   * @returns The S3 signed key value object or undefined if not set
   */
  getSignedKey(): S3Key | undefined {
    return this.signedKey;
  }

  /**
   * Gets the source document SHA-256 hash
   * @returns The source document SHA-256 hash value object or undefined if not set
   */
  getSourceSha256(): DocumentHash | undefined {
    return this.sourceSha256;
  }

  /**
   * Gets the flattened document SHA-256 hash
   * @returns The flattened document SHA-256 hash value object or undefined if not set
   */
  getFlattenedSha256(): DocumentHash | undefined {
    return this.flattenedSha256;
  }

  /**
   * Gets the signed document SHA-256 hash
   * @returns The signed document SHA-256 hash value object or undefined if not set
   */
  getSignedSha256(): DocumentHash | undefined {
    return this.signedSha256;
  }

  /**
   * Gets the current envelope status
   * @returns The current envelope status value object
   */
  getStatus(): EnvelopeStatus {
    return this.status;
  }

  /**
   * Gets all signers in this envelope
   * @returns A copy of the signers array
   */
  getSigners(): EnvelopeSigner[] {
    return [...this.signers];
  }

  /**
   * Gets the signing order configuration
   * @returns The signing order value object
   */
  getSigningOrder(): SigningOrder {
    return this.signingOrder;
  }

  /**
   * Gets the sent timestamp
   * @returns The sent timestamp or undefined if not sent
   */
  getSentAt(): Date | undefined {
    return this.sentAt;
  }

  /**
   * Gets the cancelled timestamp
   * @returns The cancelled timestamp or undefined if not cancelled
   */
  getCancelledAt(): Date | undefined {
    return this.cancelledAt;
  }

  /**
   * Gets the declined timestamp
   * @returns The declined timestamp or undefined if not declined
   */
  getDeclinedAt(): Date | undefined {
    return this.declinedAt;
  }

  /**
   * Gets the signer ID who declined
   * @returns The signer ID value object who declined or undefined if not declined
   */
  getDeclinedBySignerId(): SignerId | undefined {
    return this.declinedBySignerId;
  }

  /**
   * Gets the decline reason
   * @returns The decline reason string or undefined if not declined
   */
  getDeclinedReason(): string | undefined {
    return this.declinedReason;
  }

  /**
   * Gets the expiration timestamp
   * @returns The expiration timestamp or undefined if no expiration set
   */
  getExpiresAt(): Date | undefined {
    return this.expiresAt;
  }

  /**
   * Gets the creation timestamp
   * @returns The creation timestamp
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Gets the last update timestamp
   * @returns The last update timestamp
   */
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Gets the completion timestamp if envelope is completed
   * @returns The completion timestamp or undefined if not completed
   */
  getCompletedAt(): Date | undefined {
    return this.completedAt;
  }

  /**
   * Checks if envelope is in a final state (cannot be modified)
   * @returns True if envelope is in a final state (COMPLETED, DECLINED, CANCELLED, or EXPIRED)
   */
  isInFinalState(): boolean {
    return this.status.isInFinalState();
  }

  /**
   * Checks if envelope can be modified (DRAFT or READY_FOR_SIGNATURE states)
   * @returns True if envelope can be modified (add/remove signers)
   */
  canBeModified(): boolean {
    return this.status.canBeModified();
  }

  /**
   * Checks if envelope is ready for signing
   * @returns True if envelope is in READY_FOR_SIGNATURE status
   */
  isReadyForSigning(): boolean {
    return this.status.isReadyForSignature();
  }

  /**
   * Gets the count of signers by status
   * @returns Object containing counts of total, pending, signed, and declined signers
   */
  getSignerCounts(): { total: number; pending: number; signed: number; declined: number } {
    const total = this.signers.length;
    const pending = this.signers.filter(s => s.getStatus() === SignerStatus.PENDING).length;
    const signed = this.signers.filter(s => s.getStatus() === SignerStatus.SIGNED).length;
    const declined = this.signers.filter(s => s.getStatus() === SignerStatus.DECLINED).length;
    
    return { total, pending, signed, declined };
  }


  /**
   * Adds a new signer to the envelope
   * Allowed if envelope is in DRAFT or READY_FOR_SIGNATURE status
   * @param signer - The signer to add to the envelope
   * @throws invalidEnvelopeState when envelope is not in DRAFT or READY_FOR_SIGNATURE status
   * @throws signerEmailDuplicate when a signer with the same email already exists
   */
  addSigner(signer: EnvelopeSigner): void {
    if (!this.status.canBeModified()) {
      throw invalidEnvelopeState('Cannot add signers to envelope that is not in DRAFT or READY_FOR_SIGNATURE status');
    }

    // Check for duplicate email
    if (this.signers.some(s => s.getEmail()?.getValue() === signer.getEmail()?.getValue())) {
      throw signerEmailDuplicate('Signer with this email already exists in the envelope');
    }

    this.signers.push(signer);
    this.updatedAt = new Date();
  }

  /**
   * Removes a signer from the envelope
   * Allowed if signer hasn't signed yet and envelope is in DRAFT or READY_FOR_SIGNATURE status
   * Cannot remove signers who have already signed
   * @param signerId - The ID of the signer to remove
   * @throws invalidEnvelopeState when envelope is not in DRAFT or READY_FOR_SIGNATURE status
   * @throws signerNotFound when signer is not found in the envelope
   * @throws signerCannotBeRemoved when signer has already signed
   */
  removeSigner(signerId: string): void {
    if (!this.status.canBeModified()) {
      throw invalidEnvelopeState('Cannot remove signers from envelope that is not in DRAFT or READY_FOR_SIGNATURE status');
    }

    const signer = this.signers.find(s => s.getId().getValue() === signerId);
    if (!signer) {
      throw signerNotFound('Signer not found in envelope');
    }

    if (signer.getStatus() === SignerStatus.SIGNED) {
      throw signerCannotBeRemoved('Cannot remove signer who has already signed');
    }

    this.signers = this.signers.filter(s => s.getId().getValue() !== signerId);
    this.updatedAt = new Date();
  }

  /**
   * Sends the envelope for signing
   * Transitions status from DRAFT to READY_FOR_SIGNATURE
   * @throws invalidEnvelopeState when envelope is not in DRAFT status or has no signers
   */
  send(): void {
    if (!this.status.canBeSent()) {
      throw invalidEnvelopeState('Can only send envelope in DRAFT status');
    }

    if (this.signers.length === 0) {
      throw invalidEnvelopeState('Cannot send envelope without signers');
    }

    this.status = EnvelopeStatus.readyForSignature();
    this.updatedAt = new Date();
  }

  /**
   * Checks if envelope has expired
   * @returns True if envelope has an expiration date and it has passed
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  /**
   * Marks envelope as expired
   * Only allowed if envelope is not already completed
   * @throws envelopeCompleted when trying to expire a completed envelope
   */
  markAsExpired(): void {
    if (this.status.isCompleted()) {
      throw envelopeCompleted('Cannot expire completed envelope');
    }
    
    this.status = EnvelopeStatus.expired();
    this.updatedAt = new Date();
  }

  /**
   * Cancels the envelope
   * Only allowed if envelope is not already completed
   * @throws envelopeCompleted when trying to cancel a completed envelope
   */
  cancel(): void {
    if (this.status.isCompleted()) {
      throw envelopeCompleted('Cannot cancel completed envelope');
    }
    
    this.status = EnvelopeStatus.cancelled();
    this.updatedAt = new Date();
  }

  /**
   * Checks if all signers have signed
   * @returns True if all signers have SIGNED status
   */
  isCompleted(): boolean {
    return this.signers.every(signer => signer.getStatus() === SignerStatus.SIGNED);
  }

  /**
   * Completes the envelope when all signers have signed
   * @throws invalidEnvelopeState when not all signers have signed
   */
  complete(): void {
    if (!this.isCompleted()) {
      throw invalidEnvelopeState('Cannot complete envelope with pending signers');
    }

    this.status = EnvelopeStatus.completed();
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Gets the next signer who should sign based on signing order
   * Returns null if no signers are pending or if envelope is not in READY_FOR_SIGNATURE status
   * @returns The next signer who should sign or null if none available
   */
  getNextSigner(): EnvelopeSigner | null {
    // Only return next signer if envelope is ready for signing
    if (!this.status.isReadyForSignature()) {
      return null;
    }

    if (this.signingOrder.isOwnerFirst()) {
      // Owner should sign first - find signer with matching ID
      const ownerSigner = this.signers.find(s => s.getId().getValue() === this.createdBy.getValue());
      if (ownerSigner && ownerSigner.getStatus() === SignerStatus.PENDING) {
        return ownerSigner;
      }
    }

    // Return first pending signer (for INVITEES_FIRST or if owner already signed)
    return this.signers.find(s => s.getStatus() === SignerStatus.PENDING) || null;
  }

  /**
   * Updates signer status and transitions envelope status accordingly
   * Only allowed if envelope is in READY_FOR_SIGNATURE status
   * @param signerId - The ID of the signer to update
   * @param status - The new status for the signer
   * @throws invalidEnvelopeState when envelope is not ready for signing
   * @throws signerNotFound when signer is not found in the envelope
   * @throws invalidSignerState when trying to make invalid status transitions
   */
  updateSignerStatus(signerId: string, status: SignerStatus): void {
    // Only allow status updates if envelope is ready for signing
    if (!this.status.isReadyForSignature()) {
      throw invalidEnvelopeState('Cannot update signer status when envelope is not ready for signing');
    }

    const signer = this.signers.find(s => s.getId().getValue() === signerId);
    if (!signer) {
      throw signerNotFound('Signer not found in envelope');
    }

    // Validate status transition
    if (signer.getStatus() === SignerStatus.SIGNED && status === SignerStatus.DECLINED) {
      throw invalidSignerState('Cannot decline after signing');
    }
    if (signer.getStatus() === SignerStatus.DECLINED && status === SignerStatus.SIGNED) {
      throw invalidSignerState('Cannot sign after declining');
    }

    signer.updateStatus(status);

    // Update envelope status based on signer statuses
    this.updateEnvelopeStatus();
    this.updatedAt = new Date();
  }

  /**
   * Updates envelope status based on current signer statuses
   * Business rules:
   * - If any signer declined: envelope becomes DECLINED
   * - If all signers signed: envelope becomes COMPLETED
   * - If envelope is DRAFT: keep as DRAFT (not yet sent)
   * - If envelope was sent and has pending signers: keep as READY_FOR_SIGNATURE
   */
  private updateEnvelopeStatus(): void {
    const signedCount = this.signers.filter(s => s.getStatus() === SignerStatus.SIGNED).length;
    const declinedCount = this.signers.filter(s => s.getStatus() === SignerStatus.DECLINED).length;
    const totalSigners = this.signers.length;

    // If any signer declined, envelope is declined
    if (declinedCount > 0) {
      this.status = EnvelopeStatus.declined();
      return;
    }

    // If all signers signed, envelope is completed
    if (signedCount === totalSigners && totalSigners > 0) {
      this.status = EnvelopeStatus.completed();
      this.completedAt = new Date();
      return;
    }

    // If envelope was sent and has pending signers, keep as READY_FOR_SIGNATURE
    this.status = EnvelopeStatus.readyForSignature();
  }

  /**
   * Updates S3 keys for the envelope
   * @param sourceKey - Source document S3 key
   * @param metaKey - Metadata S3 key
   * @param flattenedKey - Flattened document S3 key
   * @param signedKey - Signed document S3 key
   */
  updateS3Keys(
    sourceKey?: S3Key,
    metaKey?: S3Key,
    flattenedKey?: S3Key,
    signedKey?: S3Key
  ): void {
    if (sourceKey !== undefined) {
      (this as any).sourceKey = sourceKey;
    }
    if (metaKey !== undefined) {
      (this as any).metaKey = metaKey;
    }
    if (flattenedKey !== undefined) {
      (this as any).flattenedKey = flattenedKey;
    }
    if (signedKey !== undefined) {
      (this as any).signedKey = signedKey;
    }
    this.updatedAt = new Date();
  }

  /**
   * Updates document hashes for the envelope
   * @param sourceSha256 - Source document hash
   * @param flattenedSha256 - Flattened document hash
   * @param signedSha256 - Signed document hash
   */
  updateHashes(
    sourceSha256?: DocumentHash,
    flattenedSha256?: DocumentHash,
    signedSha256?: DocumentHash
  ): void {
    if (sourceSha256 !== undefined) {
      (this as any).sourceSha256 = sourceSha256;
    }
    if (flattenedSha256 !== undefined) {
      (this as any).flattenedSha256 = flattenedSha256;
    }
    if (signedSha256 !== undefined) {
      (this as any).signedSha256 = signedSha256;
    }
    this.updatedAt = new Date();
  }

  /**
   * Updates signed document information
   * @param signedKey - S3 key for signed document
   * @param signedSha256 - SHA-256 hash of signed document
   */
  updateSignedDocument(signedKey: S3Key, signedSha256: DocumentHash): void {
    (this as any).signedKey = signedKey;
    (this as any).signedSha256 = signedSha256;
    this.updatedAt = new Date();
  }

  /**
   * Validates signing order for a signer
   * @param signerId - The signer attempting to sign
   * @param userId - The user ID
   * @param allSigners - All signers in the envelope
   * @throws signerSigningOrderViolation when signing order is violated
   */
  validateSigningOrder(signerId: SignerId, userId: string, allSigners: EnvelopeSigner[]): void {
    SigningOrderValidationRule.validateSigningOrder(this, signerId, userId, allSigners);
  }


  /**
   * Validates that there are no duplicate emails in signer data
   * @param signersData - Array of signer data to validate
   * @throws signerEmailDuplicate when duplicate emails are found
   */
  validateNoDuplicateEmails(signersData: CreateSignerData[]): void {
    const emails = signersData
      .filter(signer => signer.email)
      .map(signer => signer.email!.toLowerCase());

    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      throw signerEmailDuplicate('Duplicate email addresses found in signer data');
    }
  }

}