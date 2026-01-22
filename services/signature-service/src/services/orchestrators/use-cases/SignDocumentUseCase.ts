/**
 * @fileoverview SignDocumentUseCase - Use case for signing documents within envelopes
 * @summary Handles document signing workflow with consent recording and KMS integration
 * @description This use case manages the complete document signing workflow, including
 * access validation, consent recording, document preparation (frontend-signed or flattened),
 * KMS signing, signer/envelope updates, audit tracking, and envelope finalization.
 * It ensures proper workflow orchestration and maintains compliance with signing policies.
 */

import {  createNetworkSecurityContext, rethrow, IntegrationEventPublisher } from '@lawprotect/shared-ts';
import { EnvelopeCrudService } from '@/services/envelopeCrud/EnvelopeCrudService';
import { EnvelopeSignerService } from '@/services/envelopeSignerService';
import { InvitationTokenService } from '@/services/invitationTokenService';
import { ConsentService } from '@/services/consentService';
import { S3Service } from '@/services/s3Service';
import { KmsService } from '@/services/kmsService';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { EnvelopeHashService } from '@/services/envelopeHashService/EnvelopeHashService';
import { EnvelopeAccessService } from '@/services/envelopeAccess/EnvelopeAccessService';
import { EnvelopeStateService } from '@/services/envelopeStates/EnvelopeStateService';
import { PdfDigitalSignatureEmbedder } from '@/services/pdfService';
import type { DocumentServicePort } from '@/app/ports/documents/DocumentServicePort';
import { IntegrationEventFactory } from '@/infrastructure/factories/events/IntegrationEventFactory';

import { EntityFactory } from '@/infrastructure/factories/EntityFactory';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignerId } from '@/domain/value-objects/SignerId';
import { ConsentId } from '@/domain/value-objects/ConsentId';
import { SigningFlowValidationRule } from '@/domain/rules/SigningFlowValidationRule';
import type { UserPersonalInfoRepository, NetworkSecurityContext } from '@lawprotect/shared-ts';
import { getDefaultSigningAlgorithm } from '@/domain/enums/SigningAlgorithmEnum';
import type { SignatureEnvelope } from '@/domain/entities/SignatureEnvelope';
import type { EnvelopeSigner } from '@/domain/entities/EnvelopeSigner';
import type { Consent } from '@/domain/entities/Consent';
import type { KmsSignResult } from '@/domain/types/kms';
import type { EmbedSignatureResult } from '@/domain/types/pdf';
import type { SignDocumentRequest, ConsentInfo } from '@/domain/types/orchestrator';
import type { DocumentResult } from '@/domain/types/s3';
import { 
  envelopeNotFound,
  ageValidationRequired,
  ageRequirementNotMet
} from '@/signature-errors';

import { 
  buildSigningResponse,
  handleSignedDocumentFromFrontend,
  handleFlattenedDocument
} from '@/services/orchestrators';
import { v4 as uuid } from 'uuid';
import { SignDocumentUseCaseInput, SignDocumentUseCaseResult } from '@/domain/types/usecase/orchestrator/SignDocumentUseCase';

export class SignDocumentUseCase {
  private readonly userPersonalInfoRepository: UserPersonalInfoRepository | undefined;
  private readonly minimumAge: number = 18;

  constructor(
    private readonly envelopeCrudService: EnvelopeCrudService,
    private readonly envelopeSignerService: EnvelopeSignerService,
    private readonly invitationTokenService: InvitationTokenService,
    private readonly consentService: ConsentService,
    private readonly s3Service: S3Service,
    private readonly kmsService: KmsService,
    private readonly auditEventService: AuditEventService,
    private readonly envelopeHashService: EnvelopeHashService,
    private readonly envelopeAccessService: EnvelopeAccessService,
    private readonly envelopeStateService: EnvelopeStateService,
    private readonly pdfEmbedder: PdfDigitalSignatureEmbedder,
    private readonly documentServicePort: DocumentServicePort,
    private readonly integrationEventFactory: IntegrationEventFactory,
    private readonly eventPublisher: IntegrationEventPublisher,
    userPersonalInfoRepository?: UserPersonalInfoRepository
  ) {
    this.userPersonalInfoRepository = userPersonalInfoRepository;
  }

  /**
   * @description
   * Signs a document within an envelope with complete workflow orchestration. Orchestrates
   * access validation, consent recording, document preparation, KMS signing, PDF embedding,
   * state updates, audit tracking, and envelope finalization.
   * @param {SignDocumentUseCaseInput} input - Signing request with document data, consent, and security context
   * @returns {Promise<SignDocumentUseCaseResult>} Promise resolving to signing operation result
   * @throws {NotFoundError} when envelope or signer is not found
   * @throws {ForbiddenError} when user lacks permission or age requirement not met
   * @throws {BadRequestError} when signing flow validation fails
   */
  async execute(input: SignDocumentUseCaseInput): Promise<SignDocumentUseCaseResult> {
    const { request, userId, securityContext } = input;

    try {
      const { envelopeId, signerId } = this.createValueObjects(request);
      const { envelope, signer } = await this.validateAccessAndResolveSigner(
        envelopeId,
        signerId,
        userId,
        request.invitationToken,
        securityContext
      );

      await this.validateSigningFlow(envelope, signer, userId);

      const consent = await this.recordConsent(
        envelopeId,
        signerId,
        request.consent,
        securityContext,
        userId
      );

      const { documentContent, documentHash } = await this.prepareDocument(
        request,
        envelopeId,
        signerId,
        userId
      );

      const { kmsResult, embeddedPdf, embeddedPdfStored } = await this.signAndEmbedDocument(
        documentContent,
        documentHash,
        envelopeId,
        signerId,
        signer,
        securityContext,
        request.consent.text
      );

      await this.updateSignerAndEnvelope(
        signerId,
        envelopeId,
        documentHash,
        kmsResult,
        embeddedPdfStored.documentKey,
        securityContext,
        request.consent.text,
        consent.getId(),
        userId
      );

      await this.notifyDocumentService(
        envelope,
        envelopeId,
        embeddedPdf.signedPdfContent,
        kmsResult,
        embeddedPdfStored.documentKey
      );
      await this.recordAuditEvent(envelopeId, signerId, signer, userId, securityContext, {
        documentHash,
        signatureHash: kmsResult.signatureHash,
        kmsKeyId: kmsResult.kmsKeyId,
        signedDocumentKey: embeddedPdfStored.documentKey,
        consentId: consent.getId().getValue(),
      });

      const responseEnvelope = await this.finalizeEnvelopeIfCompleted(envelopeId, userId);

      return buildSigningResponse(
        responseEnvelope,
        envelope,
        { id: uuid(), sha256: kmsResult.signatureHash, timestamp: kmsResult.signedAt.toISOString() },
        signerId,
        envelopeId
      );
    } catch (error) {
      rethrow(error);
    }
  }

  /**
   * @description
   * Creates value objects from request primitives. Converts string IDs to domain value objects.
   * @param {SignDocumentRequest} request - Signing request with primitive IDs
   * @returns {{ envelopeId: EnvelopeId; signerId: SignerId }} Value objects for envelope and signer
   */
  private createValueObjects(request: SignDocumentRequest): { envelopeId: EnvelopeId; signerId: SignerId } {
    return {
      envelopeId: EntityFactory.createValueObjects.envelopeId(request.envelopeId),
      signerId: EntityFactory.createValueObjects.signerId(request.signerId),
    };
  }

  /**
   * @description
   * Validates user access to envelope and resolves signer entity. Handles both authenticated
   * users and external users via invitation tokens. Marks invitation token as signed for audit.
   * @param {EnvelopeId} envelopeId - Envelope identifier
   * @param {SignerId} signerId - Signer identifier
   * @param {string} userId - User ID (for authenticated users)
   * @param {string | undefined} invitationToken - Invitation token (for external users)
   * @param {NetworkSecurityContext} securityContext - Network security context
   * @returns {Promise<{ envelope: SignatureEnvelope; signer: EnvelopeSigner }>} Resolved envelope and signer
   * @throws {NotFoundError} when envelope or signer is not found
   */
  private async validateAccessAndResolveSigner(
    envelopeId: EnvelopeId,
    signerId: SignerId,
    userId: string,
    invitationToken: string | undefined,
    securityContext: NetworkSecurityContext
  ): Promise<{ envelope: SignatureEnvelope; signer: EnvelopeSigner }> {
    const envelope = await this.envelopeAccessService.validateUserAccess(
      envelopeId,
      userId,
      invitationToken
    );

    if (invitationToken) {
      this.invitationTokenService
        .markTokenAsSigned(invitationToken, signerId.getValue(), securityContext)
        .catch(() => undefined);
    }

    const envelopeWithSigners = await this.envelopeCrudService.getEnvelopeWithSigners(envelopeId);
    if (!envelopeWithSigners) {
      throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);
    }

    const allSigners = envelopeWithSigners.getSigners();
    const signer = allSigners.find(s => s.getId().getValue() === signerId.getValue());
    if (!signer) {
      throw new Error(`Signer with ID ${signerId.getValue()} not found in envelope`);
    }

    return { envelope, signer };
  }

  /**
   * @description
   * Validates signing flow using domain rules and age requirements. Age validation requires
   * external data access (UserPersonalInfoRepository), so it's handled here in the use case
   * rather than in a pure domain rule.
   * @param {SignatureEnvelope} envelope - Envelope entity
   * @param {EnvelopeSigner} signer - Signer entity
   * @param {string} userId - User ID
   * @throws {ConflictError} when signing flow validation fails
   * @throws {ForbiddenError} when age requirement is not met
   */
  private async validateSigningFlow(
    envelope: SignatureEnvelope,
    signer: EnvelopeSigner,
    userId: string
  ): Promise<void> {
    const envelopeWithSigners = await this.envelopeCrudService.getEnvelopeWithSigners(envelope.getId());
    if (!envelopeWithSigners) {
      throw envelopeNotFound(`Envelope with ID ${envelope.getId().getValue()} not found`);
    }

    const allSigners = envelopeWithSigners.getSigners();
    SigningFlowValidationRule.validateSigningFlow(envelope, signer, userId, allSigners);

    if (signer.getUserId() && userId && this.userPersonalInfoRepository) {
      await this.validateAgeRequirement(userId);
    }
  }

  /**
   * @description
   * Records consent given by the signer. Creates consent entity with network security context
   * for legal compliance (ESIGN Act/UETA).
   * @param {EnvelopeId} envelopeId - Envelope identifier
   * @param {SignerId} signerId - Signer identifier
   * @param {ConsentInfo} consentInfo - Consent information from request
   * @param {NetworkSecurityContext} securityContext - Network security context
   * @param {string} userId - User ID
   * @returns {Promise<Consent>} Created consent entity
   */
  private async recordConsent(
    envelopeId: EnvelopeId,
    signerId: SignerId,
    consentInfo: ConsentInfo,
    securityContext: NetworkSecurityContext,
    userId: string
  ): Promise<Consent> {
    const consentId: ConsentId = EntityFactory.createValueObjects.consentId(uuid());
    return this.consentService.createConsent(
      {
        id: consentId,
        envelopeId,
        signerId,
        signatureId: undefined,
        consentGiven: consentInfo.given,
        consentTimestamp: new Date(consentInfo.timestamp),
        consentText: consentInfo.text,
        ipAddress: consentInfo.ipAddress || securityContext.ipAddress || '',
        userAgent: consentInfo.userAgent || securityContext.userAgent || '',
        country: consentInfo.country || securityContext.country,
      },
      userId
    );
  }

  /**
   * @description
   * Prepares document for signing. Handles either frontend-signed documents (with visual signature)
   * or flattened documents from S3. Returns document content and hash.
   * @param {SignDocumentRequest} request - Signing request with document data
   * @param {EnvelopeId} envelopeId - Envelope identifier
   * @param {SignerId} signerId - Signer identifier
   * @param {string} userId - User ID
   * @returns {Promise<{ documentContent: Buffer; documentHash: string }>} Document content and hash
   */
  private async prepareDocument(
    request: SignDocumentRequest,
    envelopeId: EnvelopeId,
    signerId: SignerId,
    userId: string
  ): Promise<{ documentContent: Buffer; documentHash: string }> {
    const prepared = request.signedDocument
      ? await handleSignedDocumentFromFrontend(this.s3Service, {
          envelopeId,
          signerId,
          signedDocumentBase64: request.signedDocument,
        })
      : await handleFlattenedDocument(this.envelopeCrudService, this.envelopeHashService, this.s3Service, {
          envelopeId,
          flattenedKey: request.flattenedKey,
          userId,
        });

    return {
      documentContent: prepared.documentContent,
      documentHash: prepared.documentHash,
    };
  }

  /**
   * @description
   * Signs document hash with KMS, retrieves certificate chain, embeds signature in PDF,
   * and stores the signed PDF in S3. Orchestrates the complete cryptographic signing process.
   * @param {Buffer} documentContent - Document content to sign
   * @param {string} documentHash - SHA-256 hash of the document
   * @param {EnvelopeId} envelopeId - Envelope identifier
   * @param {SignerId} signerId - Signer identifier
   * @param {EnvelopeSigner} signer - Signer entity
   * @param {NetworkSecurityContext} securityContext - Network security context
   * @param {string} consentText - Consent text for signature metadata
   * @returns {Promise<{ kmsResult: KmsSignResult; embeddedPdf: EmbedSignatureResult; embeddedPdfStored: DocumentResult }>} Signing results
   */
  private async signAndEmbedDocument(
    documentContent: Buffer,
    documentHash: string,
    envelopeId: EnvelopeId,
    signerId: SignerId,
    signer: EnvelopeSigner,
    securityContext: NetworkSecurityContext,
    consentText: string
  ): Promise<{ kmsResult: KmsSignResult; embeddedPdf: EmbedSignatureResult; embeddedPdfStored: DocumentResult }> {
    const kmsResult = await this.kmsService.sign({
      documentHash,
      kmsKeyId: process.env.KMS_SIGNER_KEY_ID!,
      algorithm: getDefaultSigningAlgorithm(),
    });

    const certificateChain = await this.kmsService.getCertificateChain(
      kmsResult.kmsKeyId,
      {
        name: signer.getFullName() || undefined,
        email: signer.getEmail()?.getValue() || undefined,
      }
    );

    const embeddedPdf = await this.pdfEmbedder.embedSignature({
      pdfContent: documentContent,
      signatureBytes: kmsResult.signatureBytes,
      certificateChain,
      signerInfo: {
        name: signer.getFullName() || 'Unknown',
        email: signer.getEmail()?.getValue() || '',
        location: securityContext.country,
        reason: consentText,
      },
      timestamp: kmsResult.signedAt,
    });

    const embeddedPdfStored = await this.s3Service.storeSignedDocument({
      envelopeId,
      signerId,
      signedDocumentContent: embeddedPdf.signedPdfContent,
      contentType: 'application/pdf',
    });

    return { kmsResult, embeddedPdf, embeddedPdfStored };
  }

  /**
   * @description
   * Updates signer status, links consent with signature, and updates envelope hashes.
   * Persists all state changes after successful signing.
   * @param {SignerId} signerId - Signer identifier
   * @param {EnvelopeId} envelopeId - Envelope identifier
   * @param {string} documentHash - Document hash
   * @param {KmsSignResult} kmsResult - KMS signing result
   * @param {string} signedS3Key - S3 key where signed PDF is stored
   * @param {NetworkSecurityContext} securityContext - Network security context
   * @param {string} consentText - Consent text
   * @param {ConsentId} consentId - Consent identifier
   * @param {string} userId - User ID
   */
  private async updateSignerAndEnvelope(
    signerId: SignerId,
    envelopeId: EnvelopeId,
    documentHash: string,
    kmsResult: KmsSignResult,
    signedS3Key: string,
    securityContext: NetworkSecurityContext,
    consentText: string,
    consentId: ConsentId,
    userId: string
  ): Promise<void> {
    await this.envelopeSignerService.markSignerAsSigned(signerId, {
      documentHash,
      signatureHash: kmsResult.signatureHash,
      signedS3Key,
      kmsKeyId: kmsResult.kmsKeyId,
      algorithm: kmsResult.algorithm,
      ipAddress: securityContext.ipAddress,
      userAgent: securityContext.userAgent,
      consentText,
    });

    await this.consentService.linkConsentWithSignature(consentId, signerId);

    await this.envelopeHashService.updateSignedDocument(
      envelopeId,
      signedS3Key,
      kmsResult.signatureHash,
      signerId.getValue(),
      userId
    );

    await this.envelopeHashService.updateHashes(
      envelopeId,
      { sourceSha256: undefined, flattenedSha256: undefined, signedSha256: documentHash },
      userId
    );
  }

  /**
   * @description
   * Notifies Document Service about the final signed PDF using hybrid approach:
   * 1. Attempts synchronous HTTP call with exponential backoff retry (3 attempts)
   * 2. If HTTP fails, publishes async event to outbox for eventual consistency
   * 
   * This ensures the signing process never fails due to Document Service issues
   * while maintaining eventual consistency through event-driven fallback.
   * @param {SignatureEnvelope} envelope - Envelope entity
   * @param {EnvelopeId} envelopeId - Envelope identifier
   * @param {Buffer} signedPdfContent - Signed PDF content
   * @param {KmsSignResult} kmsResult - KMS signing result
   * @param {string} signedPdfS3Key - S3 key where signed PDF is stored
   */
  private async notifyDocumentService(
    envelope: SignatureEnvelope,
    envelopeId: EnvelopeId,
    signedPdfContent: Buffer,
    kmsResult: KmsSignResult,
    signedPdfS3Key: string
  ): Promise<void> {
    const sourceKey = envelope.getSourceKey()?.getValue();
    if (!sourceKey) {
      return;
    }

    const documentIdMatch = sourceKey.match(/\/documents\/[^/]+\/([^/]+)/);
    const documentId = documentIdMatch ? documentIdMatch[1] : null;
    
    if (!documentId) {
      return;
    }

    try {
      await this.retryWithBackoff(
        () => this.documentServicePort.storeFinalSignedPdf({
          documentId,
          envelopeId: envelopeId.getValue(),
          signedPdfContent,
          signatureHash: kmsResult.signatureHash,
          signedAt: kmsResult.signedAt,
        }),
        { maxRetries: 3, initialDelay: 1000 }
      );
    } catch (error) {
      const event = this.integrationEventFactory.documentSigned({
        documentId,
        envelopeId: envelopeId.getValue(),
        signedPdfS3Key,
        signatureHash: kmsResult.signatureHash,
        signedAt: kmsResult.signedAt.toISOString(),
      });

      await this.eventPublisher.publish(event, `${documentId}-${kmsResult.signatureHash}`);
      
      console.warn('Document Service sync failed, using async event fallback:', {
        documentId,
        envelopeId: envelopeId.getValue(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * @description
   * Retries a function with exponential backoff. Attempts the function up to
   * maxRetries + 1 times, with delays increasing exponentially (1s, 2s, 4s).
   * @param {() => Promise<T>} fn - Function to retry
   * @param {object} options - Retry options
   * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
   * @param {number} options.initialDelay - Initial delay in milliseconds (default: 1000)
   * @returns {Promise<T>} Promise resolving to function result
   * @throws {Error} Last error if all retries fail
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: { maxRetries: number; initialDelay: number }
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < options.maxRetries) {
          const delay = options.initialDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * @description
   * Records audit event for the signing operation. Captures all relevant metadata for
   * compliance and audit trail purposes.
   * @param {EnvelopeId} envelopeId - Envelope identifier
   * @param {SignerId} signerId - Signer identifier
   * @param {EnvelopeSigner} signer - Signer entity
   * @param {string} userId - User ID
   * @param {NetworkSecurityContext} securityContext - Network security context
   * @param {Object} metadata - Additional metadata for audit event
   */
  private async recordAuditEvent(
    envelopeId: EnvelopeId,
    signerId: SignerId,
    signer: EnvelopeSigner,
    userId: string,
    securityContext: NetworkSecurityContext,
    metadata: {
      documentHash: string;
      signatureHash: string;
      kmsKeyId: string;
      signedDocumentKey: string;
      consentId: string;
    }
  ): Promise<void> {
    await this.auditEventService.create({
      envelopeId: envelopeId.getValue(),
      signerId: signerId.getValue(),
      eventType: 'SIGNER_SIGNED' as any,
      description: `Document signed by ${signer.getFullName() || 'Unknown'}`,
      userId,
      userEmail: signer.getEmail()?.getValue(),
      networkContext: createNetworkSecurityContext(
        securityContext.ipAddress,
        securityContext.userAgent,
        securityContext.country
      ),
      metadata: {
        envelopeId: envelopeId.getValue(),
        signerId: signerId.getValue(),
        signatureId: uuid(),
        signedDocumentKey: metadata.signedDocumentKey,
        consentId: metadata.consentId,
        documentHash: metadata.documentHash,
        signatureHash: metadata.signatureHash,
        kmsKeyId: metadata.kmsKeyId,
      },
    });
  }

  /**
   * @description
   * Finalizes envelope if all signers have completed signing. Updates envelope status
   * to completed and returns the updated envelope for response.
   * @param {EnvelopeId} envelopeId - Envelope identifier
   * @param {string} userId - User ID
   * @returns {Promise<SignatureEnvelope | null>} Finalized envelope or null if not completed
   */
  private async finalizeEnvelopeIfCompleted(
    envelopeId: EnvelopeId,
    userId: string
  ): Promise<SignatureEnvelope | null> {
    const after = await this.envelopeCrudService.getEnvelopeWithSigners(envelopeId);
    if (!after?.isCompleted()) {
      return after;
    }

    await this.envelopeStateService.completeEnvelope(envelopeId, userId);
    return this.envelopeCrudService.getEnvelopeWithSigners(envelopeId);
  }

  /**
   * @description
   * Validates age requirement for internal users. Requires external data access (UserPersonalInfoRepository),
   * so it's handled in the use case rather than in a pure domain rule. This follows DDD principles where
   * use cases orchestrate domain rules and external data access.
   * @param {string} userId - User ID
   * @throws {BadRequestError} when date of birth is not available
   * @throws {ForbiddenError} when age requirement is not met
   */
  private async validateAgeRequirement(userId: string): Promise<void> {
    if (!this.userPersonalInfoRepository) {
      return;
    }

    const dateOfBirth = await this.userPersonalInfoRepository.getDateOfBirth(userId);
    
    if (!dateOfBirth) {
      throw ageValidationRequired(
        'Date of birth is required for electronic signing. Please complete your profile.'
      );
    }

    const age = this.calculateAge(dateOfBirth);
    
    if (age < this.minimumAge) {
      throw ageRequirementNotMet(
        `You must be at least ${this.minimumAge} years old to sign documents electronically.`
      );
    }
  }

  /**
   * @description
   * Calculates age from date of birth. Handles edge cases for birthdays that haven't occurred yet this year.
   * @param {Date} dateOfBirth - Date of birth
   * @returns {number} Age in years
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }
}
