/**
 * @fileoverview Envelope entity - Core domain entity representing a document signing envelope
 * @summary Manages document signing workflow, signers, and envelope lifecycle
 * @description The Envelope entity encapsulates all business logic related to document signing,
 * including signer management, status transitions, and signing order enforcement.
 * It serves as the aggregate root for the signing domain.
 */

import { EnvelopeId } from '../value-objects/EnvelopeId';
import { EnvelopeStatus } from '../enums/EnvelopeStatus';
import { SignerStatus } from '@lawprotect/shared-ts';
import { Signer } from './Signer';
import { SigningOrder } from '../value-objects/SigningOrder';
import { 
  envelopeNotFound, 
  invalidEnvelopeState, 
  envelopeCompleted,
  signerEmailDuplicate,
  signerCannotBeRemoved
} from '../../signature-errors';

/**
 * Envelope entity representing a document signing workflow
 * 
 * An envelope contains a document and manages the signing process for multiple signers.
 * It enforces business rules around signing order, status transitions, and signer management.
 */
export class Envelope {
  constructor(
    private readonly id: EnvelopeId,
    private readonly documentId: string,
    private readonly ownerId: string,
    private status: EnvelopeStatus,
    private signers: Signer[],
    private readonly signingOrder: SigningOrder,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private readonly metadata: {
      title: string;
      description?: string;
      expiresAt?: Date;
    },
    private completedAt?: Date
  ) {}

  /**
   * Gets the envelope unique identifier
   */
  getId(): EnvelopeId {
    return this.id;
  }

  /**
   * Gets the document ID from Document Service
   */
  getDocumentId(): string {
    return this.documentId;
  }

  /**
   * Gets the owner who created this envelope
   */
  getOwnerId(): string {
    return this.ownerId;
  }

  /**
   * Gets the current envelope status
   */
  getStatus(): EnvelopeStatus {
    return this.status;
  }

  /**
   * Gets all signers in this envelope
   */
  getSigners(): Signer[] {
    return [...this.signers];
  }

  /**
   * Gets the signing order configuration
   */
  getSigningOrder(): SigningOrder {
    return this.signingOrder;
  }

  /**
   * Gets the creation timestamp
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Gets the last update timestamp
   */
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Gets the completion timestamp if envelope is completed
   */
  getCompletedAt(): Date | undefined {
    return this.completedAt;
  }

  /**
   * Gets envelope metadata
   */
  getMetadata() {
    return { ...this.metadata };
  }

  /**
   * Adds a new signer to the envelope
   * Only allowed if envelope is in DRAFT status
   */
  addSigner(signer: Signer): void {
    if (this.status !== EnvelopeStatus.DRAFT) {
      throw invalidEnvelopeState('Cannot add signers to envelope that is not in DRAFT status');
    }

    // Check for duplicate email
    if (this.signers.some(s => s.getEmail().getValue() === signer.getEmail().getValue())) {
      throw signerEmailDuplicate('Signer with this email already exists in the envelope');
    }

    this.signers.push(signer);
    this.updatedAt = new Date();
  }

  /**
   * Removes a signer from the envelope
   * Only allowed if signer hasn't signed yet and envelope is in DRAFT status
   */
  removeSigner(signerId: string): void {
    if (this.status !== EnvelopeStatus.DRAFT) {
      throw invalidEnvelopeState('Cannot remove signers from envelope that is not in DRAFT status');
    }

    const signer = this.signers.find(s => s.getId().getValue() === signerId);
    if (!signer) {
      throw envelopeNotFound('Signer not found in envelope');
    }

    if (signer.getStatus() === SignerStatus.SIGNED) {
      throw signerCannotBeRemoved('Cannot remove signer who has already signed');
    }

    this.signers = this.signers.filter(s => s.getId().getValue() !== signerId);
    this.updatedAt = new Date();
  }

  /**
   * Sends the envelope for signing
   * Transitions status from DRAFT to SENT
   */
  send(): void {
    if (this.status !== EnvelopeStatus.DRAFT) {
      throw invalidEnvelopeState('Can only send envelope in DRAFT status');
    }

    if (this.signers.length === 0) {
      throw invalidEnvelopeState('Cannot send envelope without signers');
    }

    this.status = EnvelopeStatus.SENT;
    this.updatedAt = new Date();
  }

  /**
   * Checks if envelope has expired
   */
  isExpired(): boolean {
    if (!this.metadata.expiresAt) {
      return false;
    }
    return new Date() > this.metadata.expiresAt;
  }

  /**
   * Marks envelope as expired
   */
  markAsExpired(): void {
    if (this.status === EnvelopeStatus.COMPLETED) {
      throw envelopeCompleted('Cannot expire completed envelope');
    }
    
    this.status = EnvelopeStatus.EXPIRED;
    this.updatedAt = new Date();
  }

  /**
   * Checks if all signers have signed
   */
  isCompleted(): boolean {
    return this.signers.every(signer => signer.getStatus() === SignerStatus.SIGNED);
  }

  /**
   * Completes the envelope when all signers have signed
   */
  complete(): void {
    if (!this.isCompleted()) {
      throw invalidEnvelopeState('Cannot complete envelope with pending signers');
    }

    this.status = EnvelopeStatus.COMPLETED;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Gets the next signer who should sign based on signing order
   */
  getNextSigner(): Signer | null {
    if (this.signingOrder.getType() === 'OWNER_FIRST') {
      // Owner should sign first
      const ownerSigner = this.signers.find(s => s.getEmail().getValue() === this.ownerId);
      if (ownerSigner && ownerSigner.getStatus() === SignerStatus.PENDING) {
        return ownerSigner;
      }
    }

    // Return first pending signer
    return this.signers.find(s => s.getStatus() === SignerStatus.PENDING) || null;
  }

  /**
   * Updates signer status and transitions envelope status accordingly
   */
  updateSignerStatus(signerId: string, status: SignerStatus.SIGNED | SignerStatus.DECLINED): void {
    const signer = this.signers.find(s => s.getId().getValue() === signerId);
    if (!signer) {
      throw envelopeNotFound('Signer not found in envelope');
    }

    signer.updateStatus(status);

    // Update envelope status based on signer statuses
    this.updateEnvelopeStatus();
    this.updatedAt = new Date();
  }

  /**
   * Updates envelope status based on current signer statuses
   */
  private updateEnvelopeStatus(): void {
    const signedCount = this.signers.filter(s => s.getStatus() === SignerStatus.SIGNED).length;
    const declinedCount = this.signers.filter(s => s.getStatus() === SignerStatus.DECLINED).length;

    if (declinedCount > 0) {
      this.status = EnvelopeStatus.DECLINED;
    } else if (signedCount === this.signers.length) {
      this.status = EnvelopeStatus.COMPLETED;
      this.completedAt = new Date();
    } else if (signedCount > 0) {
      this.status = EnvelopeStatus.IN_PROGRESS;
    } else {
      this.status = EnvelopeStatus.SENT;
    }
  }
}
