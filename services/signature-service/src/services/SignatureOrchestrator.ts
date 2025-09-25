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
import { OutboxRepository, makeEvent, paginationLimitRequired, sha256Hex } from '@lawprotect/shared-ts';
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
import { ConsentId } from '../domain/value-objects/ConsentId';
import { AccessType } from '../domain/enums/AccessType';
import { EnvelopeSpec } from '../domain/types/envelope';
import { documentS3NotFound, envelopeNotFound, signerNotFound } from '../signature-errors';
import { SigningFlowValidationRule } from '../domain/rules/SigningFlowValidationRule';
import { EnvelopeAccessValidationRule } from '../domain/rules/EnvelopeAccessValidationRule';
import { ConsentService } from './ConsentService';
import { KmsService } from './KmsService';
import { getDefaultSigningAlgorithm } from '../domain/enums/SigningAlgorithmEnum';
import { DeclineSignerRequest } from '../domain/schemas/SigningHandlersSchema';
import { SignerId } from '../domain/value-objects/SignerId';
import { v4 as uuid } from 'uuid';
import { SignerReminderTrackingService } from './SignerReminderTrackingService';
import { NotificationType } from '@lawprotect/shared-ts';
import { loadConfig } from '../config/AppConfig';

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
    private readonly _kmsService: KmsService, // Will be used for actual document signing in future implementation
    private readonly signerReminderTrackingService: SignerReminderTrackingService
  ) {
    this.signingFlowValidationRule = new SigningFlowValidationRule();
    // KMS service will be used for actual signing operations
    // Currently stored as private field for future implementation
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
   * Cancels an envelope with comprehensive validation and access control
   * @param envelopeId - The envelope ID
   * @param userId - The user cancelling the envelope
   * @param securityContext - Security context for audit tracking
   * @returns Cancelled envelope
   */
  async cancelEnvelope(
    envelopeId: EnvelopeId,
    userId: string,
    securityContext: { ipAddress?: string; userAgent?: string; country?: string }
  ): Promise<{ envelope: SignatureEnvelope }> {
    try {
      // 1. Cancel envelope using service (includes validation and authorization)
      const cancelledEnvelope = await this.signatureEnvelopeService.cancelEnvelope(envelopeId, userId);

      // 2. Publish cancellation notification event
      await this.publishCancellationNotificationEvent(envelopeId, userId, securityContext);

      return { envelope: cancelledEnvelope };
    } catch (error) {
      throw this.handleOrchestrationError(error as Error, 'cancel envelope');
    }
  }

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
    try {
      // 1. Validate and change envelope state (in service)
      const envelope = await this.signatureEnvelopeService.sendEnvelope(envelopeId, userId);
      
      // 2. Get external signers
      const externalSigners = envelope.getExternalSigners();
      
      // 3. Determine target signers
      const selected = options.signers ?? [];
      const targetSigners = options.sendToAll
        ? externalSigners
        : externalSigners.filter(signer =>
            selected.some(s => s.signerId === signer.getId().getValue())
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

  /**
   * Shares document view access with an external user (read-only)
   * @param envelopeId - The envelope ID
   * @param email - Email address of the viewer
   * @param fullName - Full name of the viewer
   * @param message - Optional custom message
   * @param expiresInDays - Optional expiration time in days (default: 7)
   * @param userId - The user sharing the document
   * @param securityContext - Security context for audit tracking
   * @returns Promise resolving to viewer invitation result
   */
  async shareDocumentView(
    envelopeId: EnvelopeId,
    email: string,
    fullName: string,
    message: string | undefined,
    expiresInDays: number | undefined,
    userId: string,
    securityContext: {
      ipAddress: string;
      userAgent: string;
      country?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    envelopeId: string;
    viewerEmail: string;
    viewerName: string;
    token: string;
    expiresAt: Date;
    expiresInDays: number;
  }> {
    try {
      // 1. Validate envelope exists and user has access
      const envelope = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      // 2. Validate authorization - only the owner can share document view
      EnvelopeAccessValidationRule.validateEnvelopeModificationAccess(envelope, userId);

      // 3. Create viewer participant
      const viewer = await this.envelopeSignerService.createViewerParticipant(
        envelopeId,
        email,
        fullName,
        userId
      );

      // 4. Generate viewer invitation token using the real signerId
      const tokenResult = await this.invitationTokenService.generateViewerInvitationToken(
        viewer.getId(), // Use the real signerId from the created viewer
        email,
        fullName,
        envelopeId,
        {
          userId,
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          country: securityContext.country
        },
        expiresInDays || 7
      );

      // 5. Publish notification event for viewer invitation
      await this.publishViewerNotificationEvent(
        envelopeId,
        email,
        fullName,
        message || "You have been granted view access to a document",
        tokenResult.token,
        tokenResult.expiresAt
      );

      // 6. Create audit event for document view sharing
      await this.signatureAuditEventService.createEvent({
        envelopeId: envelopeId.getValue(),
        signerId: viewer.getId().getValue(),
        eventType: 'DOCUMENT_VIEW_SHARED' as any,
        description: `Document view access shared with ${fullName} (${email})`,
        userId: userId,
        userEmail: undefined,
        ipAddress: securityContext.ipAddress,
        userAgent: securityContext.userAgent,
        country: securityContext.country,
        metadata: {
          envelopeId: envelopeId.getValue(),
          viewerEmail: email,
          viewerName: fullName,
          tokenId: tokenResult.entity.getId().getValue(),
          expiresAt: tokenResult.expiresAt.toISOString(),
          expiresInDays: expiresInDays || 7
        }
      });

      return {
        success: true,
        message: `Document view access successfully shared with ${fullName}`,
        envelopeId: envelopeId.getValue(),
        viewerEmail: email,
        viewerName: fullName,
        token: tokenResult.token,
        expiresAt: tokenResult.expiresAt,
        expiresInDays: expiresInDays || 7
      };
    } catch (error) {
      this.handleOrchestrationError(error as Error, 'share document view');
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
      const { envelopeId, signerId, envelope, signer } = await this.validateSigningAccess(request, userId, securityContext);
      const consent = await this.createConsentRecord(request, envelopeId, signerId, userId, securityContext);
      const { signedDocumentKey, documentHash } = await this.handleDocumentSigning(request, envelopeId, signerId, userId);
      const signature = await this.performKmsSigning(documentHash);
      
      await this.updateSignerAndConsent(signerId, signature, signedDocumentKey, documentHash, request.consent.text, securityContext, consent.getId());
      await this.updateEnvelopeWithSignature(envelopeId, signedDocumentKey, signature.sha256, documentHash, signerId.getValue(), userId);
      await this.createSigningAuditEvent({
        envelopeId,
        signerId,
        signer,
        signature,
        signedDocumentKey,
        consent,
        documentHash,
        userId,
        securityContext
      });
      
      const responseEnvelope = await this.finalizeEnvelopeIfComplete(envelopeId, userId);
      
      return this.buildSigningResponse(responseEnvelope, envelope, signature, signerId, envelopeId);
    } catch (error) {
      this.handleOrchestrationError(error as Error, 'signDocument');
    }
  }

  /**
   * Validates signing access and retrieves necessary entities
   * @param request - Sign document request
   * @param userId - User ID
   * @param securityContext - Security context
   * @returns Validated entities
   */
  private async validateSigningAccess(
    request: SignDocumentRequest,
    userId: string,
    securityContext: { ipAddress: string; userAgent: string; country?: string }
  ) {
    const envelopeId = EntityFactory.createValueObjects.envelopeId(request.envelopeId);
    const signerId = EntityFactory.createValueObjects.signerId(request.signerId);
    
    const envelope = await this.signatureEnvelopeService.validateUserAccess(
      envelopeId,
      userId,
      request.invitationToken
    );
    
    await this.markInvitationTokenAsSigned(request.invitationToken, signerId, securityContext);
    
    const envelopeWithSigners = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
    if (!envelopeWithSigners) {
      throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
    }
    
    const allSigners = envelopeWithSigners.getSigners();
    const signer = allSigners.find(s => s.getId().getValue() === request.signerId);
    if (!signer) {
      throw new Error(`Signer with ID ${request.signerId} not found in envelope`);
    }
    
    this.signingFlowValidationRule.validateSigningFlow(envelope, signer, userId, allSigners);
    
    return { envelopeId, signerId, envelope, signer };
  }

  /**
   * Marks invitation token as signed if provided
   * @param invitationToken - Invitation token
   * @param signerId - Signer ID
   * @param securityContext - Security context
   */
  private async markInvitationTokenAsSigned(
    invitationToken: string | undefined,
    signerId: SignerId,
    securityContext: { ipAddress: string; userAgent: string; country?: string }
  ): Promise<void> {
    if (!invitationToken) return;
    
    try {
      await this.invitationTokenService.markTokenAsSigned(
        invitationToken,
        signerId.getValue(),
        securityContext
      );
    } catch (error) {
      console.warn('Failed to mark invitation token as signed:', error);
    }
  }

  /**
   * Creates consent record
   * @param request - Sign document request
   * @param envelopeId - Envelope ID
   * @param signerId - Signer ID
   * @param userId - User ID
   * @param securityContext - Security context
   * @returns Consent record
   */
  private async createConsentRecord(
    request: SignDocumentRequest,
    envelopeId: EnvelopeId,
    signerId: SignerId,
    userId: string,
    securityContext: { ipAddress: string; userAgent: string; country?: string }
  ) {
    return await this.consentService.createConsent({
      id: EntityFactory.createValueObjects.consentId(uuid()),
      envelopeId,
      signerId,
      signatureId: undefined,
      consentGiven: request.consent.given,
      consentTimestamp: new Date(request.consent.timestamp),
      consentText: request.consent.text,
      ipAddress: request.consent.ipAddress || securityContext.ipAddress,
      userAgent: request.consent.userAgent || securityContext.userAgent,
      country: request.consent.country || securityContext.country
    }, userId);
  }

  /**
   * Handles document signing process
   * @param request - Sign document request
   * @param envelopeId - Envelope ID
   * @param signerId - Signer ID
   * @param userId - User ID
   * @returns Document signing result
   */
  private async handleDocumentSigning(
    request: SignDocumentRequest,
    envelopeId: EnvelopeId,
    signerId: SignerId,
    userId: string
  ): Promise<{ signedDocumentKey: string; documentContent: Buffer; documentHash: string }> {
    if (request.signedDocument) {
      return await this.handleSignedDocumentFromFrontend(request.signedDocument, envelopeId, signerId);
    } else {
      return await this.handleFlattenedDocument(request.flattenedKey, envelopeId, userId);
    }
  }

  /**
   * Handles signed document from frontend
   * @param signedDocument - Base64 encoded signed document
   * @param envelopeId - Envelope ID
   * @param signerId - Signer ID
   * @returns Document signing result
   */
  private async handleSignedDocumentFromFrontend(
    signedDocument: string,
    envelopeId: EnvelopeId,
    signerId: SignerId
  ): Promise<{ signedDocumentKey: string; documentContent: Buffer; documentHash: string }> {
    const signedDocumentBuffer = Buffer.from(signedDocument, 'base64');
    
    const signedDocumentResult = await this.s3Service.storeSignedDocument({
      envelopeId,
      signerId,
      signedDocumentContent: signedDocumentBuffer,
      contentType: 'application/pdf'
    });
    
    return {
      signedDocumentKey: signedDocumentResult.documentKey,
      documentContent: signedDocumentBuffer,
      documentHash: sha256Hex(signedDocumentBuffer)
    };
  }

  /**
   * Handles flattened document (legacy behavior)
   * @param flattenedKey - Flattened document key
   * @param envelopeId - Envelope ID
   * @param userId - User ID
   * @returns Document signing result
   */
  private async handleFlattenedDocument(
    flattenedKey: string | undefined,
    envelopeId: EnvelopeId,
    userId: string
  ): Promise<{ signedDocumentKey: string; documentContent: Buffer; documentHash: string }> {
    const envelope = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
    const s3Key = flattenedKey 
      ? EntityFactory.createValueObjects.s3Key(flattenedKey)
      : envelope?.getFlattenedKey();
    
    if (!s3Key) {
      throw new Error(`Envelope ${envelopeId.getValue()} does not have a flattened document ready for signing. Please provide either signedDocument or flattenedKey in the request.`);
    }
    
    if (flattenedKey && !envelope?.getFlattenedKey()) {
      await this.signatureEnvelopeService.updateFlattenedKey(envelopeId, flattenedKey, userId);
    }
    
    const documentContent = await this.s3Service.getDocumentContent(s3Key.getValue());
    
    return {
      signedDocumentKey: s3Key.getValue(),
      documentContent,
      documentHash: sha256Hex(documentContent)
    };
  }

  /**
   * Performs KMS signing
   * @param documentHash - Document hash
   * @returns Signature result
   */
  private async performKmsSigning(documentHash: string) {
    const kmsResult = await this._kmsService.sign({
      documentHash,
      kmsKeyId: process.env.KMS_SIGNER_KEY_ID!,
      algorithm: getDefaultSigningAlgorithm()
    });
    
    return {
      id: uuid(),
      signedContent: Buffer.from('signed-content'),
      sha256: sha256Hex(Buffer.from(kmsResult.signatureBytes)),
      timestamp: kmsResult.signedAt.toISOString()
    };
  }

  /**
   * Updates signer and consent records
   * @param signerId - Signer ID
   * @param signature - Signature object
   * @param signedDocumentKey - Signed document key
   * @param documentHash - Document hash
   * @param consentText - Consent text
   * @param securityContext - Security context
   */
  private async updateSignerAndConsent(
    signerId: SignerId,
    signature: { sha256: string },
    signedDocumentKey: string,
    documentHash: string,
    consentText: string,
    securityContext: { ipAddress: string; userAgent: string; country?: string },
    consentId: ConsentId
  ): Promise<void> {
    await this.envelopeSignerService.markSignerAsSigned(signerId, {
      documentHash,
      signatureHash: signature.sha256,
      signedS3Key: signedDocumentKey,
      kmsKeyId: process.env.KMS_SIGNER_KEY_ID!,
      algorithm: getDefaultSigningAlgorithm(),
      ipAddress: securityContext.ipAddress,
      userAgent: securityContext.userAgent,
      consentText
    });
    
    await this.consentService.linkConsentWithSignature(
      consentId, // Use the actual consent ID that was created
      signerId
    );
  }

  /**
   * Updates envelope with signature information
   * @param envelopeId - Envelope ID
   * @param signedDocumentKey - Signed document key
   * @param signatureHash - Signature hash
   * @param documentHash - Document hash
   * @param signerIdValue - Signer ID value
   * @param userId - User ID
   */
  private async updateEnvelopeWithSignature(
    envelopeId: EnvelopeId,
    signedDocumentKey: string,
    signatureHash: string,
    documentHash: string,
    signerIdValue: string,
    userId: string
  ): Promise<void> {
    await this.signatureEnvelopeService.updateSignedDocument(
      envelopeId,
      signedDocumentKey,
      signatureHash,
      signerIdValue,
      userId
    );
    
    await this.signatureEnvelopeService.updateHashes(
      envelopeId,
      {
        sourceSha256: undefined,
        flattenedSha256: undefined,
        signedSha256: documentHash
      },
      userId
    );
  }

  /**
   * Creates signing audit event
   * @param config - Configuration object containing all required parameters
   */
  private async createSigningAuditEvent(config: {
    envelopeId: EnvelopeId;
    signerId: SignerId;
    signer: any;
    signature: { id: string; sha256: string };
    signedDocumentKey: string;
    consent: any;
    documentHash: string;
    userId: string;
    securityContext: { ipAddress: string; userAgent: string; country?: string };
  }): Promise<void> {
    await this.signatureAuditEventService.createEvent({
      envelopeId: config.envelopeId.getValue(),
      signerId: config.signerId.getValue(),
      eventType: 'DOCUMENT_SIGNED' as any,
      description: `Document signed by ${config.signer.getFullName() || 'Unknown'}`,
      userId: config.userId,
      userEmail: config.signer.getEmail()?.getValue(),
      ipAddress: config.securityContext.ipAddress,
      userAgent: config.securityContext.userAgent,
      country: config.securityContext.country,
      metadata: {
        envelopeId: config.envelopeId.getValue(),
        signerId: config.signerId.getValue(),
        signatureId: config.signature.id,
        signedDocumentKey: config.signedDocumentKey,
        consentId: config.consent.getId().getValue(),
        documentHash: config.documentHash,
        signatureHash: config.signature.sha256,
        kmsKeyId: process.env.KMS_SIGNER_KEY_ID!
      }
    });
  }

  /**
   * Finalizes envelope if complete
   * @param envelopeId - Envelope ID
   * @param userId - User ID
   * @returns Final envelope
   */
  private async finalizeEnvelopeIfComplete(envelopeId: EnvelopeId, userId: string) {
    const finalEnvelope = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
    
    if (finalEnvelope?.isCompleted()) {
      await this.signatureEnvelopeService.completeEnvelope(envelopeId, userId);
      return await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
    }
    
    return finalEnvelope;
  }

  /**
   * Builds signing response
   * @param responseEnvelope - Response envelope
   * @param originalEnvelope - Original envelope
   * @param signature - Signature object
   * @param signerId - Signer ID
   * @param envelopeId - Envelope ID
   * @returns Signing response
   */
  private buildSigningResponse(
    responseEnvelope: any,
    originalEnvelope: any,
    signature: { id: string; sha256: string; timestamp: string },
    signerId: SignerId,
    envelopeId: EnvelopeId
  ): SignDocumentResult {
    return {
      message: 'Document signed successfully',
      envelope: {
        id: responseEnvelope?.getId().getValue() || originalEnvelope.getId().getValue(),
        status: responseEnvelope?.getStatus().getValue() || originalEnvelope.getStatus().getValue(),
        progress: responseEnvelope?.calculateProgress() || originalEnvelope.calculateProgress()
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
    const selected = options.signers ?? [];
    const targetSigners = options.sendToAll
      ? externalSigners
      : externalSigners.filter(signer =>
          selected.some(s => s.signerId === signer.getId().getValue())
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
   * Publishes notification event for viewer invitation
   * @param envelopeId - The envelope ID
   * @param email - Email address of the viewer
   * @param fullName - Full name of the viewer
   * @param message - Custom message for the viewer
   * @param token - Invitation token for the viewer
   * @param expiresAt - Token expiration date
   * @returns Promise that resolves when event is published
   */
  private async publishViewerNotificationEvent(
    envelopeId: EnvelopeId,
    email: string,
    fullName: string,
    message: string,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    const envelope = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
    
    const event = makeEvent('DOCUMENT_VIEW_INVITATION', {
      envelopeId: envelopeId.getValue(),
      viewerEmail: email,
      viewerName: fullName,
      message: message,
      invitationToken: token,
      expiresAt: expiresAt.toISOString(),
      metadata: {
        envelopeTitle: envelope!.getTitle(),
        envelopeId: envelopeId.getValue(),
        sentBy: envelope!.getCreatedBy(),
        sentAt: new Date().toISOString(),
        participantRole: 'VIEWER'
      }
    });
    
    // Save event to outbox for reliable delivery
    await this.outboxRepository.save(event, uuid());
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
          // Invitation token marked as viewed
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
   * Declines a signer with proper validation and notification
   * @param envelopeId - The envelope ID
   * @param signerId - The signer ID
   * @param request - The decline request data
   * @param securityContext - Security context for audit tracking
   * @returns Decline result with updated envelope
   */
  async declineSigner(
    envelopeId: EnvelopeId,
    signerId: SignerId,
    request: DeclineSignerRequest,
    securityContext: {
      ipAddress: string;
      userAgent: string;
      country: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    envelope: {
      id: string;
      status: string;
    };
    declineInfo: {
      signerId: string;
      reason: string;
      declinedAt: string;
    };
  }> {
    try {
      // 1. Validate user access (owner or external via invitation token)
      const envelope = await this.signatureEnvelopeService.validateUserAccess(
        envelopeId,
        undefined, // userId - will be determined by invitation token
        request.invitationToken
      );

      // 2. Get the specific signer from the envelope
      const signer = envelope.getSigners().find(s => s.getId().getValue() === signerId.getValue());
      
      if (!signer) {
        throw signerNotFound(`Signer with ID ${signerId.getValue()} not found in envelope`);
      }

      // 3. Decline the signer (la entidad ya valida que no esté firmado/declinado)
      await this.envelopeSignerService.declineSigner({
        signerId,
        reason: request.reason,
        userId: undefined, // Para usuarios externos, se maneja internamente
        invitationToken: request.invitationToken,
        // Pass security context for audit tracking
        ipAddress: securityContext.ipAddress,
        userAgent: securityContext.userAgent,
        country: securityContext.country
      });

      // Update envelope status to DECLINED when any signer declines
      await this.signatureEnvelopeService.updateEnvelopeStatusAfterDecline(
        envelopeId,
        signerId,
        request.reason
        // userId omitted for external users
      );

      // 4. Publish decline notification event
      await this.publishDeclineNotificationEvent(envelopeId, signerId, request.reason, signer, securityContext);

      // 5. Get updated envelope for response
      const updatedEnvelope = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
      if (!updatedEnvelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found after decline`);
      }

      return {
        success: true,
        message: 'Signer declined successfully',
        envelope: {
          id: updatedEnvelope.getId().getValue(),
          status: updatedEnvelope.getStatus().getValue()
        },
        declineInfo: {
          signerId: signerId.getValue(),
          reason: request.reason,
          declinedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      this.handleOrchestrationError(error as Error, 'decline signer');
    }
  }

  /**
   * Publishes decline notification event using the same pattern as sendEnvelope
   * @param envelopeId - The envelope ID
   * @param signerId - The signer ID
   * @param reason - The decline reason
   * @param signer - The signer entity
   * @param securityContext - Security context for audit tracking
   */
  private async publishDeclineNotificationEvent(
    envelopeId: EnvelopeId,
    signerId: SignerId,
    reason: string,
    signer: EnvelopeSigner,
    securityContext: {
      ipAddress: string;
      userAgent: string;
      country: string;
    }
  ): Promise<void> {
    const envelope = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
    if (!envelope) {
      throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
    }
    
    const event = makeEvent('SIGNER_DECLINED', {
      envelopeId: envelopeId.getValue(),
      signerId: signerId.getValue(),
      signerEmail: signer.getEmail()?.getValue(),
      signerName: signer.getFullName(),
      declineReason: reason,
      metadata: {
        envelopeTitle: envelope.getTitle(),
        envelopeId: envelopeId.getValue(),
        declinedAt: new Date().toISOString(),
        declinedBy: signer.getFullName() || signer.getEmail()?.getValue() || 'Unknown',
        ipAddress: securityContext.ipAddress,
        userAgent: securityContext.userAgent,
        country: securityContext.country
      }
    });
    
    // Save event to outbox for reliable delivery (same pattern as sendEnvelope)
    await this.outboxRepository.save(event, uuid());
  }

  /**
   * Publishes a cancellation notification event to the outbox
   * @param envelopeId - The envelope ID
   * @param userId - The user ID who cancelled the envelope
   * @param securityContext - Security context for audit tracking
   */
  private async publishCancellationNotificationEvent(
    envelopeId: EnvelopeId,
    userId: string,
    securityContext: { ipAddress?: string; userAgent?: string; country?: string }
  ): Promise<void> {
    try {
      const envelope = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      const event = makeEvent('ENVELOPE_CANCELLED', {
        envelopeId: envelopeId.getValue(),
        cancelledByUserId: userId,
        envelopeTitle: envelope.getTitle(),
        envelopeStatus: envelope.getStatus().getValue(),
        metadata: {
          envelopeId: envelopeId.getValue(),
          cancelledAt: new Date().toISOString(),
          cancelledBy: userId,
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          country: securityContext.country
        }
      });

      // Save event to outbox for reliable delivery (same pattern as sendEnvelope)
      await this.outboxRepository.save(event, uuid());
    } catch (error) {
      console.error('Failed to publish cancellation notification event', {
        error: error instanceof Error ? error.message : error,
        envelopeId: envelopeId.getValue(),
        userId
      });
      // Don't throw - this is a side effect, not critical for the main flow
    }
  }

  /**
   * Downloads the latest signed document for an envelope
   * @param envelopeId - The envelope ID
   * @param userId - The user ID (for authenticated users)
   * @param invitationToken - The invitation token (for external users)
   * @param securityContext - Security context for audit tracking
   * @returns Download URL and expiration information
   */
  async downloadDocument(
    envelopeId: EnvelopeId,
    userId?: string,
    invitationToken?: string,
    expiresIn?: number,
    securityContext?: {
      ipAddress?: string;
      userAgent?: string;
      country?: string;
    }
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    try {
      return await this.signatureEnvelopeService.downloadDocument(
        envelopeId,
        userId,
        invitationToken,
        expiresIn,
        securityContext
      );
    } catch (error) {
      this.handleOrchestrationError(error as Error, 'download document');
    }
  }

  /**
   * Gets complete audit trail for an envelope
   * @param envelopeId - The envelope ID
   * @param userId - The user requesting the audit trail
   * @returns Promise resolving to audit trail result
   */
  async getAuditTrail(
    envelopeId: EnvelopeId,
    userId: string
  ): Promise<{
    envelopeId: string;
    events: Array<{
      id: string;
      eventType: string;
      description: string;
      userEmail?: string;
      userName?: string;
      createdAt: Date;
      metadata?: Record<string, any>;
    }>;
  }> {
    try {
      // 1. Validate envelope exists and user has access
      const envelope = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      // 2. Validate authorization - only the owner can access audit trail
      EnvelopeAccessValidationRule.validateEnvelopeModificationAccess(envelope, userId);

      // 3. Get all audit events for the envelope
      const auditEvents = await this.signatureAuditEventService.getAllByEnvelope(envelopeId.getValue());

      // 4. Transform events to frontend-friendly format
      const transformedEvents = auditEvents.map((event: any) => ({
        id: event.getId().getValue(),
        eventType: event.getEventType(),
        description: event.getDescription(),
        userEmail: event.getUserEmail(),
        userName: event.getUserEmail(),
        createdAt: event.getCreatedAt(),
        metadata: event.getMetadata()
      }));

      return {
        envelopeId: envelopeId.getValue(),
        events: transformedEvents
      };
    } catch (error) {
      this.handleOrchestrationError(error as Error, 'get audit trail');
    }
  }

  // ===== REMINDER NOTIFICATIONS FLOW =====

  /**
   * Sends reminders to pending signers
   * @param envelopeId - The envelope ID
   * @param request - The reminder request
   * @param userId - The user ID sending the reminders
   * @param securityContext - Security context for audit tracking
   * @returns Reminder sending result
   */
  async sendReminders(
    envelopeId: EnvelopeId,
    request: {
      type: NotificationType.REMINDER;
      signerIds?: string[];
      message?: string;
    },
    userId: string,
    securityContext: { ipAddress?: string; userAgent?: string; country?: string }
  ): Promise<{
    success: boolean;
    message: string;
    envelopeId: string;
    remindersSent: number;
    signersNotified: Array<{
      id: string;
      email: string;
      name: string;
      reminderCount: number;
      lastReminderAt: Date;
    }>;
    skippedSigners: Array<{
      id: string;
      email: string;
      reason: string;
    }>;
  }> {
    try {
      // 1. Validate envelope exists and user has access
      const envelope = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
      if (!envelope) {
        throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
      }

      // 2. Validate authorization - only the owner can send reminders
      EnvelopeAccessValidationRule.validateEnvelopeModificationAccess(envelope, userId);

      // 3. Get pending signers
      const pendingSigners = await this.envelopeSignerService.getPendingSigners(envelopeId);
      
      if (pendingSigners.length === 0) {
        return {
          success: true,
          message: 'No pending signers to remind',
          envelopeId: envelopeId.getValue(),
          remindersSent: 0,
          signersNotified: [],
          skippedSigners: []
        };
      }

      // 4. Filter signers if specific IDs provided
      const signersToRemind = request.signerIds 
        ? pendingSigners.filter(signer => 
            request.signerIds!.includes(signer.getId().getValue())
          )
        : pendingSigners;

      if (signersToRemind.length === 0) {
        return {
          success: true,
          message: 'No matching pending signers found',
          envelopeId: envelopeId.getValue(),
          remindersSent: 0,
          signersNotified: [],
          skippedSigners: []
        };
      }

      // 5. Get reminder configuration from config
      const config = loadConfig();
      const maxReminders = config.reminders.maxRemindersPerSigner;
      const minHoursBetween = config.reminders.minHoursBetweenReminders;

      const signersNotified: Array<{
        id: string;
        email: string;
        name: string;
        reminderCount: number;
        lastReminderAt: Date;
      }> = [];

      const skippedSigners: Array<{
        id: string;
        email: string;
        reason: string;
      }> = [];

      // 6. Process each signer
      for (const signer of signersToRemind) {
        const signerId = signer.getId();
        const email = signer.getEmail()?.getValue() || 'Unknown';
        const name = signer.getFullName() || email;

        // Check if reminder can be sent
        const { canSend, reason } = await this.signerReminderTrackingService.canSendReminder(
          signerId,
          envelopeId,
          maxReminders,
          minHoursBetween
        );

        if (!canSend) {
          skippedSigners.push({
            id: signerId.getValue(),
            email,
            reason: reason || 'Unknown reason'
          });
          continue;
        }

        // Record reminder sent
        const updatedTracking = await this.signerReminderTrackingService.recordReminderSent(
          signerId,
          envelopeId,
          request.message
        );

        // Get existing invitation tokens for this signer
        const invitationTokens = await this.invitationTokenService.getTokensBySigner(signerId);
        const activeToken = invitationTokens.find(token => !token.isExpired());
        
        if (!activeToken) {
          skippedSigners.push({
            id: signerId.getValue(),
            email,
            reason: 'No active invitation token found'
          });
          continue;
        }

        // Update invitation token lastSentAt and resendCount
        await this.invitationTokenService.updateTokenSent(activeToken.getId());

        // Publish reminder notification event
        await this.publishReminderNotificationEvent(
          envelopeId,
          signerId,
          request.message || 'Please sign the document',
          updatedTracking.getReminderCount()
        );

        // Create audit event for reminder sent
        await this.signatureAuditEventService.createEvent({
          envelopeId: envelopeId.getValue(),
          signerId: signerId.getValue(),
          eventType: 'SIGNER_REMINDER_SENT' as any,
          description: `Reminder sent to signer ${name} (${email})`,
          userId,
          ipAddress: securityContext.ipAddress,
          userAgent: securityContext.userAgent,
          country: securityContext.country,
          metadata: {
            reminderCount: updatedTracking.getReminderCount(),
            message: request.message,
            lastReminderAt: updatedTracking.getLastReminderAt()?.toISOString()
          }
        });

        signersNotified.push({
          id: signerId.getValue(),
          email,
          name,
          reminderCount: updatedTracking.getReminderCount(),
          lastReminderAt: updatedTracking.getLastReminderAt() || new Date()
        });
      }

      return {
        success: true,
        message: `Reminders sent to ${signersNotified.length} signers`,
        envelopeId: envelopeId.getValue(),
        remindersSent: signersNotified.length,
        signersNotified,
        skippedSigners
      };
    } catch (error) {
      this.handleOrchestrationError(error as Error, 'send reminders');
    }
  }

  /**
   * Publishes reminder notification event
   * @param envelopeId - The envelope ID
   * @param signerId - The signer ID
   * @param message - The reminder message
   * @param reminderCount - The current reminder count
   * @param securityContext - Security context for audit tracking
   * @returns Promise that resolves when event is published
   */
  private async publishReminderNotificationEvent(
    envelopeId: EnvelopeId,
    signerId: SignerId,
    message: string,
    reminderCount: number
  ): Promise<void> {
    try {
      const event = makeEvent('REMINDER_NOTIFICATION', {
        envelopeId: envelopeId.getValue(),
        signerId: signerId.getValue(),
        message,
        reminderCount,
        timestamp: new Date().toISOString(),
        source: 'signature-service',
        version: '1.0'
      });

      await this.outboxRepository.save(event);
    } catch (error) {
      console.error('Failed to publish reminder notification event', {
        error: error instanceof Error ? error.message : error,
        envelopeId: envelopeId.getValue(),
        signerId: signerId.getValue()
      });
      throw error;
    }
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
