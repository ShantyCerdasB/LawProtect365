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
import { CreateEnvelopeData } from '../domain/types/envelope/CreateEnvelopeData';
import { 
  CreateEnvelopeRequest, 
  CreateEnvelopeResult
} from '../domain/types/orchestrator';
import { EntityFactory } from '../domain/factories/EntityFactory';
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
    private readonly signatureEnvelopeService: SignatureEnvelopeService
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

  // ===== VALIDATIONS =====
  
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
