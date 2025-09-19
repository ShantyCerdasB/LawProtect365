/**
 * @fileoverview SignatureEventService - Event service for signature events
 * @summary Handles signature-specific domain events
 * @description This service handles signature-specific domain events and
 * provides event publishing functionality for signature operations.
 */

import { EventService, DomainEvent } from './EventService';
import { Signature } from '../../domain/entities/Signature';
import { SignatureStatus } from '@/domain/enums/SignatureStatus';

/**
 * SignatureEventService implementation
 * 
 * Handles signature-specific domain events and provides event publishing
 * functionality for signature operations.
 */
export class SignatureEventService extends EventService {
  /**
   * Publishes a module-specific event
   * @param event - Domain event to publish
   * @param traceId - Optional trace ID for observability
   */
  async publishModuleEvent(event: DomainEvent, traceId?: string): Promise<void> {
    await this.publishDomainEvent(event, traceId);
  }
  /**
   * Publishes signature created event
   * @param signature - The created signature
   * @param userId - The user who created the signature
   */
  async publishSignatureCreated(signature: Signature, userId: string): Promise<void> {
    await this.publishEvent('signature.created', {
      signatureId: signature.getId().getValue(),
      envelopeId: signature.getEnvelopeId(),
      signerId: signature.getSignerId(),
      documentHash: signature.getDocumentHash(),
      signatureHash: signature.getSignatureHash(),
      s3Key: signature.getS3Key(),
      kmsKeyId: signature.getKmsKeyId(),
      algorithm: signature.getAlgorithm(),
      status: signature.getStatus(),
      timestamp: signature.getTimestamp().toISOString(),
      createdAt: new Date().toISOString(),
      userId
    });
  }

  /**
   * Publishes signature updated event
   * @param signature - The updated signature
   * @param userId - The user who updated the signature
   * @param changes - The changes made to the signature
   */
  async publishSignatureUpdated(signature: Signature, userId: string, changes: Record<string, unknown>): Promise<void> {
    await this.publishEvent('signature.updated', {
      signatureId: signature.getId().getValue(),
      envelopeId: signature.getEnvelopeId(),
      signerId: signature.getSignerId(),
      status: signature.getStatus(),
      changes,
      updatedAt: new Date().toISOString(),
      userId
    });
  }

  /**
   * Publishes signature status changed event
   * @param signature - The signature
   * @param oldStatus - The previous status
   * @param newStatus - The new status
   * @param userId - The user who changed the status
   */
  async publishSignatureStatusChanged(
    signature: Signature,
    oldStatus: SignatureStatus,
    newStatus: SignatureStatus,
    userId: string
  ): Promise<void> {
    await this.publishEvent('signature.status_changed', {
      signatureId: signature.getId().getValue(),
      envelopeId: signature.getEnvelopeId(),
      signerId: signature.getSignerId(),
      oldStatus,
      newStatus,
      changedAt: new Date().toISOString(),
      userId
    });
  }

  /**
   * Publishes signature deleted event
   * @param signatureId - The deleted signature ID
   * @param envelopeId - The envelope ID
   * @param signerId - The signer ID
   * @param userId - The user who deleted the signature
   */
  async publishSignatureDeleted(
    signatureId: string,
    envelopeId: string,
    signerId: string,
    userId: string
  ): Promise<void> {
    await this.publishEvent('signature.deleted', {
      signatureId,
      envelopeId,
      signerId,
      deletedAt: new Date().toISOString(),
      userId
    });
  }

  /**
   * Publishes signature completed event
   * @param signature - The completed signature
   * @param completedAt - When the signature was completed
   */
  async publishSignatureCompleted(signature: Signature, completedAt: Date): Promise<void> {
    await this.publishEvent('signature.completed', {
      signatureId: signature.getId().getValue(),
      envelopeId: signature.getEnvelopeId(),
      signerId: signature.getSignerId(),
      documentHash: signature.getDocumentHash(),
      signatureHash: signature.getSignatureHash(),
      s3Key: signature.getS3Key(),
      algorithm: signature.getAlgorithm(),
      completedAt: completedAt.toISOString()
    });
  }

  /**
   * Publishes signature failed event
   * @param signature - The failed signature
   * @param failedAt - When the signature failed
   * @param errorMessage - The error message
   */
  async publishSignatureFailed(signature: Signature, failedAt: Date, errorMessage: string): Promise<void> {
    await this.publishEvent('signature.failed', {
      signatureId: signature.getId().getValue(),
      envelopeId: signature.getEnvelopeId(),
      signerId: signature.getSignerId(),
      documentHash: signature.getDocumentHash(),
      algorithm: signature.getAlgorithm(),
      failedAt: failedAt.toISOString(),
      errorMessage
    });
  }

  /**
   * Publishes signature validated event
   * @param signature - The validated signature
   * @param validatedAt - When the signature was validated
   * @param validationResult - The validation result
   */
  async publishSignatureValidated(
    signature: Signature,
    validatedAt: Date,
    validationResult: Record<string, unknown>
  ): Promise<void> {
    await this.publishEvent('signature.validated', {
      signatureId: signature.getId().getValue(),
      envelopeId: signature.getEnvelopeId(),
      signerId: signature.getSignerId(),
      documentHash: signature.getDocumentHash(),
      signatureHash: signature.getSignatureHash(),
      algorithm: signature.getAlgorithm(),
      validatedAt: validatedAt.toISOString(),
      validationResult
    });
  }

}

