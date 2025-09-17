/**
 * @fileoverview SignatureService - Service for signature business logic orchestration
 * @summary Orchestrates signature operations and coordinates with other services
 * @description This service handles all signature-related business logic, including
 * creation, validation, storage, and coordination with cryptographic and storage services.
 */

import { Signature } from '../domain/entities/Signature';
import { SignatureId } from '../domain/value-objects/SignatureId';
import { SignerId } from '../domain/value-objects/SignerId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignatureStatus } from '../domain/enums/SignatureStatus';
import { SignatureRepository } from '../repositories/SignatureRepository';
import { ConsentService } from './ConsentService';
import { KmsService } from './KmsService';
import { SignatureEventService } from './events/SignatureEventService';
import { AuditService } from './AuditService';
import { CreateSignatureRequest } from '../domain/types/signature/CreateSignatureRequest';
import { KmsCreateSignatureRequest } from '../domain/types/signature/KmsCreateSignatureRequest';
import { ValidateSignatureRequest } from '../domain/types/signature/ValidateSignatureRequest';
import { SignatureValidationResult } from '../domain/types/signature/SignatureValidationResult';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { 
  validateSignatureCreation,
  validateSignatureStatusTransition,
  validateSignatureIntegrity
} from '../domain/rules/signature/SignatureBusinessRules';
import { 
  validateSignatureComplianceRules
} from '../domain/rules/signature/SignatureComplianceRules';
import { 
  validateSignatureSecurityRules
} from '../domain/rules/signature/SignatureSecurityRules';
import { mapAwsError, NotFoundError, ForbiddenError, ErrorCodes } from '@lawprotect/shared-ts';

/**
 * SignatureService implementation
 * 
 * Orchestrates signature operations and coordinates with other services.
 * Handles all signature-related business logic including creation, validation,
 * storage, and coordination with cryptographic and storage services.
 */
export class SignatureService {
  constructor(
    private readonly signatureRepository: SignatureRepository,
    private readonly consentService: ConsentService,
    private readonly kmsService: KmsService,
    private readonly eventService: SignatureEventService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Creates a new digital signature
   * 
   * This method orchestrates the complete signature creation process:
   * 1. Validates consent
   * 2. Validates business rules
   * 3. Validates compliance requirements
   * 4. Validates security requirements
   * 5. Creates cryptographic signature via KMS
   * 6. Stores signature in repository
   * 7. Logs audit event
   * 8. Publishes signature created event
   * 
   * @param request - The signature creation request
   * @returns Promise<Signature> - The created signature
   * @throws {BadRequestError} When validation fails
   * @throws {ForbiddenError} When consent is not given
   * @throws {NotFoundError} When required resources are not found
   */
  async createSignature(request: CreateSignatureRequest): Promise<Signature> {
    try {
      // 1. Validate consent before allowing signature creation
      const consent = await this.consentService.getConsentBySignerAndEnvelope(
        request.signerId.getValue(),
        request.envelopeId.getValue(),
        request.userEmail ?? request.signerId.getValue()
      );
      
      if (!consent || !consent.getConsentGiven()) {
        throw new ForbiddenError(
          'Consent is required before creating a signature',
          ErrorCodes.AUTH_FORBIDDEN
        );
      }

      // 2. Create signature entity for validation
      const signature = new Signature(
        request.id,
        request.envelopeId.getValue(),
        request.signerId.getValue(),
        request.documentHash,
        request.signatureHash,
        request.s3Key,
        request.kmsKeyId,
        request.algorithm,
        request.timestamp,
        request.status,
        {
          reason: request.reason,
          location: request.location,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent
        }
      );

      // 3. Validate business rules
      validateSignatureCreation(signature, {
        maxSignaturesPerEnvelope: 10,
        maxSignaturesPerSigner: 5
      });

      // 4. Validate compliance requirements
      validateSignatureComplianceRules(signature, 'VALIDATE' as any, {
        allowedAlgorithms: [],
        minSecurityLevel: 'HIGH' as any,
        complianceLevel: 'FULL' as any,
        retentionPeriod: 2555, // 7 years in days
        retentionUnit: 'DAYS' as any,
        archiveRequired: true,
        deleteAfterRetention: false
      });

      // 5. Validate security requirements
      validateSignatureSecurityRules(signature, 'CREATE' as any, {
        allowedKMSKeys: [request.kmsKeyId],
        kmsKeyFormat: /^arn:aws:kms:/,
        kmsAccessRequired: true,
        s3KeyFormat: /^envelopes\//,
        allowedS3Buckets: ['signature-documents'],
        encryptionRequired: true,
        allowedUsers: [request.signerId.getValue()],
        accessControlRequired: true,
        downloadControlRequired: true,
        auditControlRequired: true
      }, request.signerId.getValue());

      // 6. Create cryptographic signature via KMS
      const kmsRequest: KmsCreateSignatureRequest = {
        signatureId: request.id,
        signerId: request.signerId,
        envelopeId: request.envelopeId,
        inputKey: request.s3Key,
        outputKey: request.s3Key, // Overwrite strategy
        documentHash: request.documentHash,
        algorithm: request.algorithm as any,
        kmsKeyId: request.kmsKeyId,
        metadata: {
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          reason: request.reason,
          location: request.location
        }
      };

      const createdSignature = await this.kmsService.createSignature(kmsRequest);

      // 7. Log audit event
      await this.auditService.createEvent({
        envelopeId: request.envelopeId.getValue(),
        description: `Digital signature created for signer ${request.signerId.getValue()}`,
        type: AuditEventType.SIGNATURE_CREATED,
        userId: request.signerId.getValue(),
        metadata: {
          signatureId: request.id.getValue(),
          algorithm: request.algorithm,
          kmsKeyId: request.kmsKeyId,
          documentHash: request.documentHash
        }
      });

      // 8. Publish signature created event
      await this.eventService.publishSignatureCreated(createdSignature, request.signerId.getValue());

      return createdSignature;
    } catch (error) {
      throw mapAwsError(error, 'SignatureService.createSignature');
    }
  }

  /**
   * Validates an existing digital signature
   * 
   * This method validates the cryptographic integrity and legal compliance
   * of an existing signature.
   * 
   * @param signatureId - The signature ID to validate
   * @returns Promise<SignatureValidationResult> - The validation result
   * @throws {NotFoundError} When signature is not found
   * @throws {BadRequestError} When validation fails
   */
  async validateSignature(signatureId: SignatureId): Promise<SignatureValidationResult> {
    try {
      // 1. Get signature from repository
      const signature = await this.signatureRepository.getById(signatureId);
      if (!signature) {
        throw new NotFoundError('Signature not found', ErrorCodes.COMMON_NOT_FOUND);
      }

      // 2. Validate signature integrity
      validateSignatureIntegrity(signature);

      // 3. Validate legal requirements (handled by compliance rules)

      // 4. Validate signature via KMS
      const validationRequest: ValidateSignatureRequest = {
        signatureId: signatureId,
        documentHash: signature.getDocumentHash(),
        signature: signature.getSignatureHash(),
        algorithm: signature.getAlgorithm() as any
      };

      const validationResult = await this.kmsService.validateSignature(validationRequest);

      // 5. Log audit event
      await this.auditService.createEvent({
        envelopeId: signature.getEnvelopeId(),
        description: `Signature validation ${validationResult.isValid ? 'succeeded' : 'failed'} for signature ${signatureId.getValue()}`,
        type: AuditEventType.SIGNATURE_VALIDATED,
        userId: signature.getSignerId(),
        metadata: {
          signatureId: signatureId.getValue(),
          algorithm: signature.getAlgorithm(),
          isValid: validationResult.isValid,
          error: validationResult.error
        }
      });

      // 6. Publish validation event
      await this.eventService.publishSignatureValidated(signature, new Date(), {
        isValid: validationResult.isValid,
        signedAt: validationResult.signedAt,
        error: validationResult.error
      });

      return validationResult;
    } catch (error) {
      throw mapAwsError(error, 'SignatureService.validateSignature');
    }
  }

  /**
   * Gets a signature by ID
   * 
   * @param signatureId - The signature ID
   * @returns Promise<Signature | null> - The signature or null if not found
   */
  async getSignature(signatureId: SignatureId): Promise<Signature | null> {
    try {
      return await this.signatureRepository.getById(signatureId);
    } catch (error) {
      throw mapAwsError(error, 'SignatureService.getSignature');
    }
  }

  /**
   * Gets all signatures for a specific envelope
   * 
   * @param envelopeId - The envelope ID
   * @param limit - Maximum number of signatures to return (default: 20)
   * @param cursor - Pagination cursor
   * @returns Promise<{items: Signature[], nextCursor?: string}> - The signatures and pagination info
   */
  async getSignaturesByEnvelope(
    envelopeId: EnvelopeId, 
    limit: number = 20, 
    cursor?: string
  ): Promise<{items: Signature[], nextCursor?: string}> {
    try {
      return await this.kmsService.getSignaturesByEnvelope(envelopeId, limit, cursor);
    } catch (error) {
      throw mapAwsError(error, 'SignatureService.getSignaturesByEnvelope');
    }
  }

  /**
   * Gets all signatures for a specific signer
   * 
   * @param signerId - The signer ID
   * @param limit - Maximum number of signatures to return (default: 20)
   * @param cursor - Pagination cursor
   * @returns Promise<{items: Signature[], nextCursor?: string}> - The signatures and pagination info
   */
  async getSignaturesBySigner(
    signerId: SignerId, 
    limit: number = 20, 
    cursor?: string
  ): Promise<{items: Signature[], nextCursor?: string}> {
    try {
      return await this.kmsService.getSignaturesBySigner(signerId, limit, cursor);
    } catch (error) {
      throw mapAwsError(error, 'SignatureService.getSignaturesBySigner');
    }
  }

  /**
   * Updates the status of a signature
   * 
   * This method validates the status transition and updates the signature status.
   * Note: Signatures cannot be deleted due to legal requirements.
   * 
   * @param signatureId - The signature ID
   * @param newStatus - The new status
   * @returns Promise<Signature> - The updated signature
   * @throws {NotFoundError} When signature is not found
   * @throws {BadRequestError} When status transition is invalid
   */
  async updateSignatureStatus(signatureId: SignatureId, newStatus: SignatureStatus): Promise<Signature> {
    try {
      // 1. Get current signature
      const currentSignature = await this.signatureRepository.getById(signatureId);
      if (!currentSignature) {
        throw new NotFoundError('Signature not found', ErrorCodes.COMMON_NOT_FOUND);
      }

      // 2. Validate status transition
      validateSignatureStatusTransition(currentSignature.getStatus(), newStatus);

      // 3. Update signature status via KMS service
      const updatedSignature = await this.kmsService.updateSignatureStatus(signatureId, newStatus);

      // 4. Log audit event
      await this.auditService.createEvent({
        envelopeId: currentSignature.getEnvelopeId(),
        description: `Signature status updated from ${currentSignature.getStatus()} to ${newStatus} for signature ${signatureId.getValue()}`,
        type: AuditEventType.SIGNATURE_STATUS_UPDATED,
        userId: currentSignature.getSignerId(),
        metadata: {
          signatureId: signatureId.getValue(),
          oldStatus: currentSignature.getStatus(),
          newStatus: newStatus
        }
      });

      // 5. Publish status update event
      await this.eventService.publishSignatureUpdated(updatedSignature, currentSignature.getSignerId(), {
        oldStatus: currentSignature.getStatus(),
        newStatus: newStatus
      });

      return updatedSignature;
    } catch (error) {
      throw mapAwsError(error, 'SignatureService.updateSignatureStatus');
    }
  }

  /**
   * Checks if a signature exists for a specific signer and envelope
   * 
   * @param signerId - The signer ID
   * @param envelopeId - The envelope ID
   * @returns Promise<boolean> - True if signature exists, false otherwise
   */
  async signatureExists(signerId: SignerId, envelopeId: EnvelopeId): Promise<boolean> {
    try {
      const signatures = await this.getSignaturesByEnvelope(envelopeId);
      return signatures.items.some(signature => signature.getSignerId() === signerId.getValue());
    } catch (error) {
      throw mapAwsError(error, 'SignatureService.signatureExists');
    }
  }

  /**
   * Gets signature statistics for an envelope
   * 
   * @param envelopeId - The envelope ID
   * @returns Promise<{total: number, signed: number, pending: number, failed: number}> - Signature statistics
   */
  async getSignatureStatistics(envelopeId: EnvelopeId): Promise<{
    total: number;
    signed: number;
    pending: number;
    failed: number;
  }> {
    try {
      const signatures = await this.getSignaturesByEnvelope(envelopeId, 1000); // Get all signatures
      
      const stats = {
        total: signatures.items.length,
        signed: 0,
        pending: 0,
        failed: 0
      };

      signatures.items.forEach(signature => {
        switch (signature.getStatus()) {
          case SignatureStatus.SIGNED:
            stats.signed++;
            break;
          case SignatureStatus.PENDING:
            stats.pending++;
            break;
          case SignatureStatus.FAILED:
            stats.failed++;
            break;
        }
      });

      return stats;
    } catch (error) {
      throw mapAwsError(error, 'SignatureService.getSignatureStatistics');
    }
  }
}
