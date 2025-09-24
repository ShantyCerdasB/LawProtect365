/**
 * @fileoverview SignatureOrchestrator - Orchestrates signature service workflows
 * @summary Coordinates multiple services for signature operations
 * @description This orchestrator coordinates signature service workflows by orchestrating
 * multiple domain services including envelope management, signer operations, consent handling,
 * cryptographic operations, and audit logging. It uses domain rules and entities for validation
 * and business logic enforcement.
 */

import { SignatureEnvelope } from '../domain/entities/SignatureEnvelope';
import { EnvelopeSigner } from '../domain/entities/EnvelopeSigner';
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
  CreateEnvelopeResult,
  SignDocumentRequest,
  SignDocumentResult
} from '../domain/types/orchestrator';
import { EntityFactory } from '../domain/factories/EntityFactory';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { EnvelopeStatus } from '../domain/value-objects/EnvelopeStatus';
import { AccessType } from '../domain/enums/AccessType';
import { EnvelopeSpec } from '../domain/types/envelope';
import { documentS3NotFound, envelopeNotFound } from '../signature-errors';
import { uuid, paginationLimitRequired } from '@lawprotect/shared-ts';
import { SigningFlowValidationRule } from '../domain/rules/SigningFlowValidationRule';
import { ConsentService } from './ConsentService';
import { KmsService } from './KmsService';
import { sha256Hex } from '@lawprotect/shared-ts';
import { getDefaultSigningAlgorithm } from '../domain/enums/SigningAlgorithmEnum';

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
  private readonly signingFlowValidationRule: SigningFlowValidationRule;

  constructor(
    private readonly signatureEnvelopeService: SignatureEnvelopeService,
    private readonly envelopeSignerService: EnvelopeSignerService,
    private readonly invitationTokenService: InvitationTokenService,
    private readonly signatureAuditEventService: SignatureAuditEventService,
    private readonly s3Service: S3Service,
    private readonly outboxRepository: OutboxRepository,
    private readonly consentService: ConsentService,
    private readonly _kmsService: KmsService // Will be used for actual document signing in future implementation
  ) {
    this.signingFlowValidationRule = new SigningFlowValidationRule();
    // Temporary reference to avoid unused variable error - will be used for actual signing
    void this._kmsService;
  }

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
        const signersData = updateData.addSigners.map(signer => ({
          ...signer,
          envelopeId,
          participantRole: 'SIGNER' as const,
          invitedByUserId: userId // Set the user who is inviting the signer
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
      
      // Solo obtener signers si se agregaron/removieron signers
      if ((updateData.addSigners && updateData.addSigners.length > 0) || 
          (updateData.removeSignerIds && updateData.removeSignerIds.length > 0)) {
        const envelopeWithSigners = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
        if (!envelopeWithSigners) {
          throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
        }
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
    tokens: Array<{
      signerId: string;
      email?: string;
      token: string;
      expiresAt: Date;
    }>;
  }> {
    // ✅ DEBUG: Log sendEnvelope start
    
    try {
      // 1. Validate and change envelope state (in service)
      const envelope = await this.signatureEnvelopeService.sendEnvelope(envelopeId, userId);
      
      // 2. Get external signers
      const externalSigners = envelope.getExternalSigners();
      
      // 3. Determine target signers
      const targetSigners = options.sendToAll 
        ? externalSigners
        : externalSigners.filter(signer => 
            options.signers!.some(s => s.signerId === signer.getId().getValue())
          );
      
      // 4. Generate invitation tokens for target signers
      const tokenResults = await this.invitationTokenService.generateInvitationTokensForSigners(
        targetSigners,
        envelopeId,
        {
          userId,
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          country: securityContext.country
        }
      );
      
      // ✅ DEBUG: Log token generation results
      
      // 5. Publish notification events for notification service
      await this.publishNotificationEvent(envelopeId, options, tokenResults);
      
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
          tokensGenerated: tokenResults.length,
          sendToAll: options.sendToAll || false
        }
      });
      
      return {
        success: true,
        message: "Envelope sent successfully",
        envelopeId: envelopeId.getValue(),
        status: envelope.getStatus().getValue(),
        tokensGenerated: tokenResults.length,
        signersNotified: targetSigners.length,
        tokens: tokenResults.map(t => ({
          signerId: t.signerId,
          email: t.email,
          token: t.token,  // ✅ Incluir token original para tests
          expiresAt: t.expiresAt
        }))
      };
    } catch (error) {
      this.handleOrchestrationError(error as Error, 'sendEnvelope');
    }
  }

  // ===== DOCUMENT SIGNING FLOW =====
  
  /**
   * Signs a document in an envelope with comprehensive validation and orchestration
   * @param request - The signing request with envelope, signer, and consent information
   * @param userId - The user ID (for authenticated users)
   * @param securityContext - Security context for audit tracking
   * @returns Promise resolving to signing result with updated envelope and signer
   */
  async signDocument(
    request: SignDocumentRequest,
    userId: string,
    securityContext: {
      ipAddress: string;
      userAgent: string;
      country?: string;
    }
  ): Promise<SignDocumentResult> {
    try {
      // 1. Validate access and get envelope with signers
      const envelopeId = EntityFactory.createValueObjects.envelopeId(request.envelopeId);
      const signerId = EntityFactory.createValueObjects.signerId(request.signerId);
      
      console.log('🔍 DEBUG signDocument - envelopeId:', envelopeId.getValue());
      console.log('🔍 DEBUG signDocument - signerId:', signerId.getValue());
      console.log('🔍 DEBUG signDocument - userId:', userId);
      console.log('🔍 DEBUG signDocument - invitationToken:', request.invitationToken ? 'present' : 'not present');
      
      const envelope = await this.signatureEnvelopeService.validateUserAccess(
        envelopeId,
        userId,
        request.invitationToken
      );
      
      console.log('🔍 DEBUG signDocument - envelope from validateUserAccess:');
      console.log('  - ID:', envelope.getId().getValue());
      console.log('  - Status:', envelope.getStatus().getValue());
      console.log('  - CreatedBy:', envelope.getCreatedBy());
      
      // Mark invitation token as signed if provided
      if (request.invitationToken) {
        try {
          await this.invitationTokenService.markTokenAsSigned(
            request.invitationToken,
            signerId.getValue(),
            {
              ipAddress: securityContext.ipAddress,
              userAgent: securityContext.userAgent,
              country: securityContext.country
            }
          );
          console.log('✅ Invitation token marked as signed');
        } catch (error) {
          console.warn('Failed to mark invitation token as signed:', error);
          // Don't fail the signing process if token marking fails
        }
      }
      
      const envelopeWithSigners = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
      if (!envelopeWithSigners) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }
      
      console.log('🔍 DEBUG signDocument - envelopeWithSigners:');
      console.log('  - ID:', envelopeWithSigners.getId().getValue());
      console.log('  - Status:', envelopeWithSigners.getStatus().getValue());
      console.log('  - CreatedBy:', envelopeWithSigners.getCreatedBy());
      console.log('  - Signers count:', envelopeWithSigners.getSigners().length);
      
      const allSigners = envelopeWithSigners.getSigners();
      const signer = allSigners.find(s => s.getId().getValue() === request.signerId);
      if (!signer) {
        throw new Error(`Signer with ID ${request.signerId} not found in envelope`);
      }
      
      // 2. Validate signing flow using domain rule
      this.signingFlowValidationRule.validateSigningFlow(
        envelope,
        signer,
        userId,
        allSigners
      );
      
      // 3. Create consent record
      console.log('🔍 DEBUG consent creation:');
      console.log('  - request.consent.country:', request.consent.country);
      console.log('  - securityContext.country:', securityContext.country);
      console.log('  - Final country value:', request.consent.country || securityContext.country);
      
      const consent = await this.consentService.createConsent({
        id: EntityFactory.createValueObjects.consentId(uuid()),
        envelopeId,
        signerId,
        signatureId: undefined, // Will be linked after signature creation
        consentGiven: request.consent.given,
        consentTimestamp: new Date(request.consent.timestamp),
        consentText: request.consent.text,
        ipAddress: request.consent.ipAddress || securityContext.ipAddress,
        userAgent: request.consent.userAgent || securityContext.userAgent,
        country: request.consent.country || securityContext.country
      }, userId);
      
      // 4. Get document from S3 and apply signature
      // Use flattenedKey from request if provided, otherwise use envelope's flattenedKey
      const flattenedKey = request.flattenedKey 
        ? EntityFactory.createValueObjects.s3Key(request.flattenedKey)
        : envelope.getFlattenedKey();
      
      if (!flattenedKey) {
        throw new Error(`Envelope ${envelopeId.getValue()} does not have a flattened document ready for signing. Please provide flattenedKey in the request or configure it in the envelope.`);
      }
      
      // 5. Store flattenedKey if it's from request (first time flattening)
      if (request.flattenedKey && !envelope.getFlattenedKey()) {
        await this.signatureEnvelopeService.updateFlattenedKey(
          envelopeId,
          request.flattenedKey,
          userId
        );
      }
      
      const documentContent = await this.s3Service.getDocumentContent(flattenedKey.getValue());
      const flattenedHash = sha256Hex(documentContent);
      const documentHash = flattenedHash; // Use flattened hash for KMS signing
      
      // 6. Sign document with KMS
      const kmsResult = await this._kmsService.sign({
        documentHash: documentHash,
        kmsKeyId: process.env.KMS_SIGNER_KEY_ID!,
        algorithm: getDefaultSigningAlgorithm()
      });
      
      // 7. Create signature object
      const signature = {
        id: uuid(),
        signedContent: Buffer.from('signed-content'), // Will be replaced with actual signed PDF
        sha256: sha256Hex(Buffer.from(kmsResult.signatureBytes)), // Generate SHA-256 hash of the signature bytes
        timestamp: kmsResult.signedAt.toISOString()
      };
      
      // 8. No need to store document again - it's already in S3 with visual signatures
      
      // 9. Update signer as signed
      await this.envelopeSignerService.markSignerAsSigned(
        signerId,
        {
          documentHash: documentHash,
          signatureHash: signature.sha256,
          signedS3Key: flattenedKey.getValue(), // Use the original flattened key
          kmsKeyId: process.env.KMS_SIGNER_KEY_ID!,
          algorithm: getDefaultSigningAlgorithm(),
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          consentText: request.consent.text // Add consent text for recordConsent
        }
      );
      
      // 10. Link consent with signature
      await this.consentService.linkConsentWithSignature(
        consent.getId(),
        signerId
      );
      
      // 11. Update envelope with signed document using service method
      await this.signatureEnvelopeService.updateSignedDocument(
        envelopeId,
        flattenedKey.getValue(),
        signature.sha256,
        signerId.getValue(),
        userId
      );
      
      // 12. Update envelope hashes (flattenedSha256 and signedSha256)
      await this.signatureEnvelopeService.updateHashes(
        envelopeId,
        {
          sourceSha256: undefined, // sourceSha256 (calculated during document upload)
          flattenedSha256: flattenedHash, // flattenedSha256
          signedSha256: signature.sha256 // signedSha256
        },
        userId
      );
      
      // 13. Create audit event
      await this.signatureAuditEventService.createEvent({
        envelopeId: envelopeId.getValue(),
        signerId: signerId.getValue(),
        eventType: 'DOCUMENT_SIGNED' as any,
        description: `Document signed by ${signer.getFullName() || 'Unknown'}`,
        userId: userId,
        userEmail: signer.getEmail()?.getValue(),
        ipAddress: securityContext.ipAddress,
        userAgent: securityContext.userAgent,
        country: securityContext.country,
        metadata: {
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          signatureId: signature.id,
          signedDocumentKey: flattenedKey.getValue(),
          consentId: consent.getId().getValue(),
          documentHash: documentHash,
          signatureHash: signature.sha256,
          kmsKeyId: process.env.KMS_SIGNER_KEY_ID!
        }
      });
      
      // 14. Check if envelope is complete and update status if needed
      const finalEnvelope = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
      console.log('🔍 DEBUG envelope completion check:');
      console.log('  - Final envelope exists:', !!finalEnvelope);
      console.log('  - Final envelope status:', finalEnvelope?.getStatus().getValue());
      console.log('  - Final envelope isCompleted():', finalEnvelope?.isCompleted());
      console.log('  - Final envelope signers count:', finalEnvelope?.getSigners().length);
      console.log('  - Final envelope signers statuses:', finalEnvelope?.getSigners().map(s => s.getStatus()));
      
      let responseEnvelope = finalEnvelope;
      
      if (finalEnvelope?.isCompleted()) {
        console.log('✅ Envelope is completed, calling completeEnvelope...');
        // Complete the envelope using the service method
        await this.signatureEnvelopeService.completeEnvelope(envelopeId, userId);
        console.log('✅ Envelope completed successfully');
        
        // Get the updated envelope after completion
        responseEnvelope = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
        console.log('🔍 DEBUG after completion:');
        console.log('  - Response envelope status:', responseEnvelope?.getStatus().getValue());
      } else {
        console.log('❌ Envelope is not completed yet');
      }
      
      return {
        message: 'Document signed successfully',
        envelope: {
          id: responseEnvelope?.getId().getValue() || envelope.getId().getValue(),
          status: responseEnvelope?.getStatus().getValue() || envelope.getStatus().getValue(),
          progress: responseEnvelope?.calculateProgress() || envelope.calculateProgress()
        },
        signature: {
          id: signature.id,
          signerId: signerId.getValue(),
          envelopeId: envelopeId.getValue(),
          signedAt: signature.timestamp,
          algorithm: getDefaultSigningAlgorithm(),
          hash: signature.sha256
        }
      };
    } catch (error) {
      this.handleOrchestrationError(error as Error, 'signDocument');
    }
  }

  // ===== UTILITIES =====
  
  /**
   * Publishes notification events for each signer
   * @param envelopeId - The envelope ID
   * @param options - Send options including message and signer selection
   * @param tokenResults - Generated invitation token results
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
    tokenResults: Array<{
      token: string;
      entity: any;
      signerId: string;
      email?: string;
      expiresAt: Date;
    }>
  ): Promise<void> {
    const envelope = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
    const externalSigners = envelope!.getExternalSigners();
    
    // Determine target signers
    const targetSigners = options.sendToAll 
      ? externalSigners
      : externalSigners.filter(signer => 
          options.signers!.some(s => s.signerId === signer.getId().getValue())
        );
    
    // Publish one event per signer using outbox pattern
    for (const signer of targetSigners) {
      const signerOption = options.signers?.find(s => s.signerId === signer.getId().getValue());
      const message = signerOption?.message || options.message || "You have been invited to sign a document";
      
      const event = makeEvent('ENVELOPE_INVITATION', {
        envelopeId: envelopeId.getValue(),
        signerId: signer.getId().getValue(),
        signerEmail: signer.getEmail()!,
        signerName: signer.getFullName()!,
        message: message,
        invitationToken: tokenResults.find(t => t.signerId === signer.getId().getValue())?.token,
        metadata: {
          envelopeTitle: envelope!.getTitle(),
          envelopeId: envelopeId.getValue(),
          sentBy: envelope!.getCreatedBy(),
          sentAt: new Date().toISOString()
        }
      });
      
      // Save event to outbox for reliable delivery
      await this.outboxRepository.save(event, uuid());
    }
  }
  
  /**
   * Gets a single envelope by ID with access validation and audit tracking
   * @param envelopeId - The envelope ID
   * @param userId - The user ID (for authenticated users)
   * @param invitationToken - The invitation token (for external users)
   * @param securityContext - Security context for audit tracking
   * @returns The envelope with complete signer information and access type
   */
  async getEnvelope(
    envelopeId: EnvelopeId,
    userId?: string,
    invitationToken?: string,
    securityContext?: {
      ipAddress: string;
      userAgent: string;
      country?: string;
    }
  ): Promise<{
    envelope: SignatureEnvelope;
    signers: EnvelopeSigner[];
    accessType: AccessType;
  }> {
    try {
      // Validate access using existing service method
      const envelope = await this.signatureEnvelopeService.validateUserAccess(
        envelopeId, 
        userId, 
        invitationToken
      );

      // Mark invitation token as viewed if provided (for external users)
      if (invitationToken && securityContext) {
        try {
          await this.invitationTokenService.markTokenAsViewed(
            invitationToken,
            {
              ipAddress: securityContext.ipAddress,
              userAgent: securityContext.userAgent,
              country: securityContext.country
            }
          );
          console.log('✅ Invitation token marked as viewed');
        } catch (error) {
          console.warn('Failed to mark invitation token as viewed:', error);
          // Don't fail the get envelope process if token marking fails
        }
      }

      // Determine access type
      const accessType = invitationToken ? AccessType.EXTERNAL : AccessType.OWNER;

      // ✅ SIEMPRE obtener signers con información completa (service maneja audit para external users)
      const envelopeWithSigners = await this.signatureEnvelopeService.getEnvelopeWithSigners(
        envelopeId,
        securityContext,
        invitationToken
      );
      const signers = envelopeWithSigners?.getSigners() || [];

      return {
        envelope,
        signers,
        accessType
      };
    } catch (error) {
      this.handleOrchestrationError(error as Error, 'get envelope');
    }
  }

  /**
   * Lists envelopes for authenticated users with filtering and pagination
   * @param userId - The user ID
   * @param filters - Filter options
   * @returns Page of envelopes with complete signer information
   */
  async listEnvelopesByUser(
    userId: string,
    filters: {
      status?: EnvelopeStatus;
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<{
    envelopes: SignatureEnvelope[];
    signers: EnvelopeSigner[][];
    nextCursor?: string;
    totalCount?: number;
  }> {
    try {
      const { status, limit, cursor } = filters;

      if (limit === undefined || limit === null) {
        throw paginationLimitRequired('Frontend must provide pagination limit');
      }

      // Build specification
      const spec: EnvelopeSpec = {
        createdBy: userId,
        status: status  // ✅ status ya es EnvelopeStatus value object desde el schema
      };

      // Get envelopes with pagination
      const result = await this.signatureEnvelopeService.listEnvelopes(spec, limit, cursor);

      // ✅ SIEMPRE obtener signers para cada envelope con información completa
      const signers = await Promise.all(
        result.items.map(envelope => 
          this.signatureEnvelopeService.getEnvelopeWithSigners(envelope.getId())
            .then(envelopeWithSigners => envelopeWithSigners?.getSigners() || [])
        )
      );

      return {
        envelopes: result.items,
        signers,
        nextCursor: result.nextCursor
      };
    } catch (error) {
      this.handleOrchestrationError(error as Error, 'list envelopes by user');
    }
  }

  // Audit for external access is handled in SignatureEnvelopeService.getEnvelopeWithSigners

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
