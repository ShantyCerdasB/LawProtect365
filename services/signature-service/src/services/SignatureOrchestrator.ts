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
import { InvitationTokenService } from './InvitationTokenService';
import { SignatureAuditEventService } from './SignatureAuditEventService';
import { S3Service } from './S3Service';
import { OutboxRepository, makeEvent } from '@lawprotect/shared-ts';
import { CreateEnvelopeData } from '../domain/types/envelope/CreateEnvelopeData';
import { UpdateEnvelopeData } from '../domain/rules/EnvelopeUpdateValidationRule';
import { 
  CreateEnvelopeRequest, 
  CreateEnvelopeResult
} from '../domain/types/orchestrator';
import { EntityFactory } from '../domain/factories/EntityFactory';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { documentS3NotFound, envelopeNotFound } from '../signature-errors';
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
    private readonly invitationTokenService: InvitationTokenService,
    private readonly signatureAuditEventService: SignatureAuditEventService,
    private readonly s3Service: S3Service,
    private readonly outboxRepository: OutboxRepository
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
  ): Promise<{ envelope: SignatureEnvelope; signers?: any[] }> {
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
        console.log('🔍 Adding signers to envelope:', {
          envelopeId: envelopeId.getValue(),
          signersCount: updateData.addSigners.length,
          signers: updateData.addSigners
        });
        
        const signersData = updateData.addSigners.map(signer => ({
          ...signer,
          envelopeId,
          participantRole: 'SIGNER' as const,
          invitedByUserId: userId // Set the user who is inviting the signer
        }));
        
        console.log('🔍 Calling envelopeSignerService.createSignersForEnvelope...');
        await this.envelopeSignerService.createSignersForEnvelope(
          envelopeId,
          signersData
        );
        console.log('✅ envelopeSignerService.createSignersForEnvelope completed');
      }
      
      // 4. Handle signer removals
      if (updateData.removeSignerIds && updateData.removeSignerIds.length > 0) {
        for (const signerId of updateData.removeSignerIds) {
          await this.envelopeSignerService.deleteSigner(
            EntityFactory.createValueObjects.signerId(signerId)
          );
        }
      }
      
      // Solo obtener signers si se agregaron/removieron signers
      if ((updateData.addSigners && updateData.addSigners.length > 0) || 
          (updateData.removeSignerIds && updateData.removeSignerIds.length > 0)) {
        console.log('🔍 Getting envelope with signers...');
        const envelopeWithSigners = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
        if (!envelopeWithSigners) {
          throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
        }
        console.log('✅ Envelope with signers retrieved:', {
          envelopeId: envelopeWithSigners.getId().getValue(),
          signersCount: envelopeWithSigners.getSigners().length
        });
        return {
          envelope: updatedEnvelope,
          signers: envelopeWithSigners.getSigners()
        };
      }

      return {
        envelope: updatedEnvelope,
        signers: undefined
      };
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
        throw documentS3NotFound(`Source document with key '${sourceKey}' does not exist in S3`);
      }
    }
    
    if (metaKey) {
      const metaExists = await this.s3Service.documentExists(metaKey);
      if (!metaExists) {
        throw documentS3NotFound(`Metadata document with key '${metaKey}' does not exist in S3`);
      }
    }
  }
  
  // Note: Signing order validation is not needed for CreateEnvelope
  // It will be validated when signers are added via UpdateEnvelope

  // ===== ENVELOPE SENDING FLOW =====
  
  /**
   * Sends an envelope to external signers by generating invitation tokens
   * @param envelopeId - The envelope ID to send
   * @param userId - The user making the request
   * @param securityContext - Security context for token generation
   * @param options - Send options including message and signer selection
   * @returns Promise resolving to send envelope result with confirmation
   */
  async sendEnvelope(
    envelopeId: EnvelopeId,
    userId: string,
    securityContext: {
      ipAddress: string;
      userAgent: string;
      country?: string;
    },
    options: {
      message?: string;
      sendToAll?: boolean;
      signers?: Array<{
        signerId: string;
        message?: string;
      }>;
    } = {}
  ): Promise<{
    success: boolean;
    message: string;
    envelopeId: string;
    status: string;
    tokensGenerated: number;
    signersNotified: number;
  }> {
    try {
      console.log('🔍 SignatureOrchestrator.sendEnvelope START:', {
        envelopeId: envelopeId.getValue(),
        userId,
        options
      });

      // 1. Validate and change envelope state (in service)
      console.log('🔍 Calling signatureEnvelopeService.sendEnvelope...');
      const envelope = await this.signatureEnvelopeService.sendEnvelope(envelopeId, userId);
      console.log('✅ signatureEnvelopeService.sendEnvelope completed:', {
        envelopeId: envelope.getId().getValue(),
        status: envelope.getStatus().getValue()
      });
      
      // 2. Get external signers
      console.log('🔍 Getting external signers...');
      const externalSigners = envelope.getExternalSigners();
      console.log('✅ External signers retrieved:', {
        count: externalSigners.length,
        signers: externalSigners.map(s => ({
          id: s.getId().getValue(),
          email: s.getEmail()?.getValue(),
          fullName: s.getFullName()
        }))
      });
      
      // 3. Determine target signers
      console.log('🔍 Determining target signers...');
      const targetSigners = options.sendToAll 
        ? externalSigners
        : externalSigners.filter(signer => 
            options.signers!.some(s => s.signerId === signer.getId().getValue())
          );
      console.log('✅ Target signers determined:', {
        count: targetSigners.length,
        sendToAll: options.sendToAll
      });
      
      // 4. Generate invitation tokens for target signers
      console.log('🔍 Generating invitation tokens...');
      const tokens = await this.invitationTokenService.generateInvitationTokensForSigners(
        targetSigners,
        envelopeId,
        {
          userId,
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          country: securityContext.country
        }
      );
      console.log('✅ Invitation tokens generated:', {
        count: tokens.length
      });
      
      // 5. Publish notification events for notification service
      console.log('🔍 Publishing notification events...');
      await this.publishNotificationEvent(envelopeId, options, tokens);
      console.log('✅ Notification events published');
      
      // 6. Create audit event for envelope sent
      await this.signatureAuditEventService.createEvent({
        envelopeId: envelopeId.getValue(),
        signerId: undefined,
        eventType: 'ENVELOPE_SENT' as any,
        description: `Envelope sent to ${targetSigners.length} external signers`,
        userId: userId,
        userEmail: undefined,
        ipAddress: securityContext.ipAddress,
        userAgent: securityContext.userAgent,
        country: securityContext.country,
        metadata: {
          envelopeId: envelopeId.getValue(),
          externalSignersCount: targetSigners.length,
          tokensGenerated: tokens.length,
          sendToAll: options.sendToAll || false
        }
      });
      
      return {
        success: true,
        message: "Envelope sent successfully",
        envelopeId: envelopeId.getValue(),
        status: envelope.getStatus().getValue(),
        tokensGenerated: tokens.length,
        signersNotified: targetSigners.length
      };
    } catch (error) {
      this.handleOrchestrationError(error as Error, 'sendEnvelope');
    }
  }

  // ===== UTILITIES =====
  
  /**
   * Publishes notification events for each signer
   * @param envelopeId - The envelope ID
   * @param options - Send options including message and signer selection
   * @param tokens - Generated invitation tokens
   * @returns Promise that resolves when all events are published
   */
  private async publishNotificationEvent(
    envelopeId: EnvelopeId,
    options: {
      message?: string;
      sendToAll?: boolean;
      signers?: Array<{
        signerId: string;
        message?: string;
      }>;
    },
    tokens: any[]
  ): Promise<void> {
    console.log('🔍 publishNotificationEvent START:', {
      envelopeId: envelopeId.getValue(),
      options,
      tokensCount: tokens.length
    });

    const envelope = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
    const externalSigners = envelope!.getExternalSigners();
    
    console.log('🔍 External signers retrieved:', {
      count: externalSigners.length,
      signers: externalSigners.map(s => ({
        id: s.getId().getValue(),
        email: s.getEmail()?.getValue(),
        fullName: s.getFullName()
      }))
    });
    
    // Determine target signers
    const targetSigners = options.sendToAll 
      ? externalSigners
      : externalSigners.filter(signer => 
          options.signers!.some(s => s.signerId === signer.getId().getValue())
        );
    
    console.log('🔍 Target signers determined:', {
      count: targetSigners.length,
      sendToAll: options.sendToAll
    });
    
    // Publish one event per signer using outbox pattern
    for (const signer of targetSigners) {
      const signerOption = options.signers?.find(s => s.signerId === signer.getId().getValue());
      const message = signerOption?.message || options.message || "You have been invited to sign a document";
      
      console.log('🔍 Creating event for signer:', {
        signerId: signer.getId().getValue(),
        signerEmail: signer.getEmail()?.getValue(),
        message
      });
      
      const event = makeEvent('ENVELOPE_INVITATION', {
        envelopeId: envelopeId.getValue(),
        signerId: signer.getId().getValue(),
        signerEmail: signer.getEmail()!,
        signerName: signer.getFullName()!,
        message: message,
        invitationToken: tokens.find(t => t.signerId === signer.getId().getValue())?.token,
        metadata: {
          envelopeTitle: envelope!.getTitle(),
          envelopeId: envelopeId.getValue(),
          sentBy: envelope!.getCreatedBy(),
          sentAt: new Date().toISOString()
        }
      });
      
      console.log('🔍 Event created:', {
        eventType: event.type,
        eventKeys: Object.keys(event),
        hasPayload: !!event.payload,
        payloadKeys: event.payload ? Object.keys(event.payload) : 'none'
      });
      
      console.log('🔍 Calling outboxRepository.save...');
      // Save event to outbox for reliable delivery
      await this.outboxRepository.save(event, uuid());
      console.log('✅ outboxRepository.save completed for signer:', signer.getId().getValue());
    }
    
    console.log('✅ publishNotificationEvent completed');
  }
  
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
