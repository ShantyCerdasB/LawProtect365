/**
 * @fileoverview SignatureOrchestrator - Orchestrates signature service workflows
 * @summary Coordinates multiple services for signature operations
 * @description This orchestrator coordinates signature service workflows by orchestrating
 * multiple domain services including envelope management, signer operations, consent handling,
 * cryptographic operations, and audit logging. It uses domain rules and entities for validation
 * and business logic enforcement.
 */

import { SignatureEnvelope } from '../domain/entities/SignatureEnvelope';
import { SignatureEnvelopeService } from './SignatureEnvelopeService';
import { EnvelopeSignerService } from './EnvelopeSignerService';
import { S3Service } from './S3Service';
import { CreateEnvelopeData } from '../domain/types/envelope/CreateEnvelopeData';
import { UpdateEnvelopeData } from '../domain/rules/EnvelopeUpdateValidationRule';
import { 
  CreateEnvelopeRequest, 
  CreateEnvelopeResult
} from '../domain/types/orchestrator';
import { EntityFactory } from '../domain/factories/EntityFactory';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { invalidEnvelopeState } from '../signature-errors';
import { uuid } from '@lawprotect/shared-ts';

/**
 * SignatureOrchestrator - Orchestrates signature service workflows
 * 
 * This orchestrator coordinates multiple domain services for signature operations.
 * It uses domain rules and entities for validation and business logic enforcement, ensuring
 * proper separation of concerns and maintainable code.
 * 
 * Responsibilities:
 * - Coordinate signature service workflows
 * - Validate authentication and authorization
 * - Enforce business rules using domain rules
 * - Orchestrate multiple services
 * - Handle complex transaction flows
 * - Provide unified error handling
 */
export class SignatureOrchestrator {
  constructor(
    private readonly signatureEnvelopeService: SignatureEnvelopeService,
    private readonly envelopeSignerService: EnvelopeSignerService,
    private readonly s3Service: S3Service
  ) {}

  // ===== ENVELOPE CREATION FLOW =====
  
  /**
   * Creates an envelope with signers (without generating invitation tokens)
   * @param request - The envelope creation request
   * @returns Envelope creation result with envelope and signers
   */
  async createEnvelope(request: CreateEnvelopeRequest): Promise<CreateEnvelopeResult> {
    try {
      // 1. Create EnvelopeId automatically
      const envelopeId = EntityFactory.createValueObjects.envelopeId(uuid());
      
      // 2. Update envelopeData with generated ID
      const envelopeDataWithId = {
        ...request.envelopeData,
        id: envelopeId
      };
      
      // 3. Create base envelope (no signers validation needed)
      const envelope = await this.createEnvelopeBase(envelopeDataWithId, request.userId);
      
      return { envelope, signers: [] }; // Empty signers array
    } catch (error) {
      this.handleOrchestrationError(error as Error, 'createEnvelope');
    }
  }

  /**
   * Creates the base envelope entity
   * @param data - Envelope creation data
   * @param userId - User ID creating the envelope
   * @returns Created signature envelope
   */
  private async createEnvelopeBase(data: CreateEnvelopeData, userId: string): Promise<SignatureEnvelope> {
    return await this.signatureEnvelopeService.createEnvelope(data, userId);
  }

  // ===== ENVELOPE UPDATE FLOW =====
  
  /**
   * Updates an envelope with comprehensive validation and signer management
   * @param envelopeId - The envelope ID
   * @param updateData - The update data
   * @param userId - The user making the request
   * @returns Updated envelope
   */
  async updateEnvelope(
    envelopeId: EnvelopeId,
    updateData: UpdateEnvelopeData,
    userId: string
  ): Promise<SignatureEnvelope> {
    try {
      // 1. Validate S3 keys exist if provided
      if (updateData.sourceKey || updateData.metaKey) {
        await this.validateS3KeysExist(updateData.sourceKey, updateData.metaKey);
      }
      
      // 2. Update envelope metadata
      const updatedEnvelope = await this.signatureEnvelopeService.updateEnvelope(
        envelopeId,
        updateData,
        userId
      );
      
      // 3. Handle signer additions
      if (updateData.addSigners && updateData.addSigners.length > 0) {
        const signersData = updateData.addSigners.map(signer => ({
          ...signer,
          envelopeId,
          participantRole: 'SIGNER' as const
        }));
        await this.envelopeSignerService.createSignersForEnvelope(
          envelopeId,
          signersData
        );
      }
      
      // 4. Handle signer removals
      if (updateData.removeSignerIds && updateData.removeSignerIds.length > 0) {
        for (const signerId of updateData.removeSignerIds) {
          await this.envelopeSignerService.deleteSigner(
            EntityFactory.createValueObjects.signerId(signerId)
          );
        }
      }
      
      return updatedEnvelope;
    } catch (error) {
      this.handleOrchestrationError(error as Error, 'updateEnvelope');
    }
  }

  // ===== VALIDATIONS =====
  
  /**
   * Validates that S3 keys exist in S3 storage
   * @param sourceKey - Source document S3 key
   * @param metaKey - Metadata S3 key
   */
  private async validateS3KeysExist(sourceKey?: string, metaKey?: string): Promise<void> {
    if (sourceKey) {
      const sourceExists = await this.s3Service.documentExists(sourceKey);
      if (!sourceExists) {
        throw invalidEnvelopeState(`Source document with key '${sourceKey}' does not exist in S3`);
      }
    }
    
    if (metaKey) {
      const metaExists = await this.s3Service.documentExists(metaKey);
      if (!metaExists) {
        throw invalidEnvelopeState(`Metadata document with key '${metaKey}' does not exist in S3`);
      }
    }
  }
  
  // Note: Signing order validation is not needed for CreateEnvelope
  // It will be validated when signers are added via UpdateEnvelope

  // ===== UTILITIES =====
  
  /**
   * Handles orchestration errors
   * @param error - The error that occurred
   * @param operation - The operation that failed
   */
  private handleOrchestrationError(error: Error, operation: string): never {
    console.error(`Orchestration error in ${operation}:`, error);
    throw error;
  }
}
