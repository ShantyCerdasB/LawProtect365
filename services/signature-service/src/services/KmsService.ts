/**
 * @fileoverview KmsService - Service for cryptographic operations
 * @summary Manages KMS operations for digital signature creation and validation
 * @description This service handles all cryptographic operations including
 * signature creation, validation, and key management using AWS KMS.
 */


import { KmsSigner, mapAwsError, BadRequestError, NotFoundError, ErrorCodes } from '@lawprotect/shared-ts';
import { SignatureStatus } from '@/domain/enums/SignatureStatus';
import { Signature } from '../domain/entities/Signature';
import { SignatureId } from '../domain/value-objects/SignatureId';
import { SignerId } from '../domain/value-objects/SignerId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
// SigningAlgorithm is now imported via the type files
import { SignatureRepository } from '../repositories/SignatureRepository';
import { AuditService } from './AuditService';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { CreateSignatureRequest as DomainCreateSignatureRequest } from '../domain/types/signature/CreateSignatureRequest';
import { KmsCreateSignatureRequest } from '../domain/types/signature/KmsCreateSignatureRequest';
import { ValidateSignatureRequest } from '../domain/types/signature/ValidateSignatureRequest';
import { SignatureValidationResult } from '../domain/types/signature/SignatureValidationResult';
import { signatureDdbMapper } from '../domain/types/infrastructure/signature/signature-mappers';
import { S3Service } from './S3Service';
import { validateKmsCreateSignatureRequest, validateSignatureValidationRequest } from '../domain/rules/signature/SignatureValidationRules';

// Local interfaces moved to domain/types/signature/
// - KmsCreateSignatureRequest
// - ValidateSignatureRequest  
// - SignatureValidationResult

/**
 * KmsService
 * 
 * Service for managing cryptographic operations using AWS KMS.
 * Handles digital signature creation, validation, and key management.
 */
export class KmsService {
  constructor(
    private readonly kmsSigner: KmsSigner,
    private readonly signatureRepository: SignatureRepository,
    private readonly auditService: AuditService,
    // private readonly eventService: SignatureEventService,
    private readonly s3Service: S3Service,
    private readonly kmsKeyId: string
  ) {}

  /**
   * Creates a digital signature for a document
   */
  async createSignature(request: KmsCreateSignatureRequest): Promise<Signature> {
    try {
      // Validate input
      this.validateCreateSignatureRequest(request);

      // Validate that the input PDF exists in S3
      const inputExists = await this.s3Service.documentExists(request.inputKey);
      if (!inputExists) {
        throw new BadRequestError(
          `Input PDF not found in S3: ${request.inputKey}`,
          ErrorCodes.COMMON_NOT_FOUND
        );
      }

      // Validate that outputKey equals inputKey (for overwrite strategy)
      if (request.inputKey !== request.outputKey) {
        throw new BadRequestError(
          'Output key must equal input key for PDF overwrite strategy',
          ErrorCodes.COMMON_BAD_REQUEST
        );
      }

      // Create signature using KMS
      const signatureResult = await this.kmsSigner.sign({
        keyId: request.kmsKeyId,
        message: new TextEncoder().encode(request.documentHash)
      });

      // Create signature request for repository
      const createRequest: DomainCreateSignatureRequest = {
        id: request.signatureId,
        envelopeId: request.envelopeId,
        signerId: request.signerId,
        documentHash: request.documentHash,
        signatureHash: new TextDecoder().decode(signatureResult.signature),
        s3Key: request.outputKey, // Use the outputKey from Document Service
        kmsKeyId: request.kmsKeyId,
        algorithm: request.algorithm,
        timestamp: new Date(),
        status: SignatureStatus.SIGNED,
        ipAddress: request.metadata?.ipAddress,
        userAgent: request.metadata?.userAgent,
        reason: request.metadata?.reason,
        location: request.metadata?.location
      };

      // Store signature in repository
      const createdSignature = await this.signatureRepository.create(createRequest);

      // Audit handled at SignatureService level to avoid duplication

      // Do not publish here; publication policy handled at higher-level service if needed

      return createdSignature;
    } catch (error) {
      throw mapAwsError(error, 'KmsService.createSignature');
    }
  }

  /**
   * Validates a digital signature
   */
  async validateSignature(request: ValidateSignatureRequest): Promise<SignatureValidationResult> {
    try {
      // Validate input
      this.validateValidateSignatureRequest(request);

      // Get signature from repository
      const signature = await this.signatureRepository.getById(request.signatureId);
      if (!signature) {
        return {
          isValid: false,
          error: 'Signature not found'
        };
      }

      // Validate signature using KMS
      const validationResult = await this.kmsSigner.verify({
        keyId: this.kmsKeyId,
        message: new TextEncoder().encode(request.documentHash),
        signature: new TextEncoder().encode(request.signature)
      });

      // Log audit event
      await this.auditService.createEvent({
        envelopeId: signature.getEnvelopeId(),
        description: `Signature validation ${validationResult.valid ? 'succeeded' : 'failed'} for signature ${request.signatureId.getValue()}`,
        type: AuditEventType.SIGNATURE_VALIDATED,
        userId: signature.getSignerId(),
        metadata: {
          signatureId: request.signatureId.getValue(),
          algorithm: request.algorithm,
          isValid: validationResult.valid
        }
      });

      return {
        isValid: validationResult.valid,
        signedAt: signature.getTimestamp(),
        error: validationResult.valid ? undefined : 'Signature validation failed'
      };
    } catch (error) {
      throw mapAwsError(error, 'KmsService.validateSignature');
    }
  }

  /**
   * Gets signature details by ID
   */
  async getSignature(signatureId: SignatureId): Promise<Signature | null> {
    try {
      return await this.signatureRepository.getById(signatureId);
    } catch (error) {
      throw mapAwsError(error, 'KmsService.getSignature');
    }
  }

  /**
   * Gets signatures by signer
   */
  async getSignaturesBySigner(signerId: SignerId, limit: number = 20, cursor?: string): Promise<{
    items: Signature[];
    nextCursor?: string;
  }> {
    try {
      const result = await this.signatureRepository.getBySigner(signerId.getValue(), limit, cursor);
      return {
        items: result.items.map(item => signatureDdbMapper.fromDTO(item)),
        nextCursor: result.nextCursor
      };
    } catch (error) {
      throw mapAwsError(error, 'KmsService.getSignaturesBySigner');
    }
  }

  /**
   * Gets signatures by envelope
   */
  async getSignaturesByEnvelope(envelopeId: EnvelopeId, limit: number = 20, cursor?: string): Promise<{
    items: Signature[];
    nextCursor?: string;
  }> {
    try {
      const result = await this.signatureRepository.getByEnvelope(envelopeId.getValue(), limit, cursor);
      return {
        items: result.items.map(item => signatureDdbMapper.fromDTO(item)),
        nextCursor: result.nextCursor
      };
    } catch (error) {
      throw mapAwsError(error, 'KmsService.getSignaturesByEnvelope');
    }
  }

  /**
   * Updates signature status
   */
  async updateSignatureStatus(signatureId: SignatureId, status: SignatureStatus): Promise<Signature> {
    try {
      const signature = await this.signatureRepository.getById(signatureId);
      if (!signature) {
        throw new NotFoundError('Signature not found', ErrorCodes.COMMON_NOT_FOUND);
      }

      const updatedSignature = await this.signatureRepository.update(signatureId, { status });

      // Log audit event
      await this.auditService.createEvent({
        envelopeId: signature.getEnvelopeId(),
        description: `Signature status updated to ${status} for signature ${signatureId.getValue()}`,
        type: AuditEventType.SIGNATURE_STATUS_UPDATED,
        userId: signature.getSignerId(),
        metadata: {
          signatureId: signatureId.getValue(),
          oldStatus: signature.getStatus(),
          newStatus: status
        }
      });

      return updatedSignature;
    } catch (error) {
      throw mapAwsError(error, 'KmsService.updateSignatureStatus');
    }
  }


  /**
   * Validates create signature request using domain rules
   */
  private validateCreateSignatureRequest(request: KmsCreateSignatureRequest): void {
    validateKmsCreateSignatureRequest(request);
  }

  /**
   * Validates validate signature request using domain rules
   */
  private validateValidateSignatureRequest(request: ValidateSignatureRequest): void {
    validateSignatureValidationRequest(request);
  }
}
