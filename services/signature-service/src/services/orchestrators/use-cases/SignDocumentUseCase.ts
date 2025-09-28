/**
 * @fileoverview SignDocumentUseCase - Use case for signing documents within envelopes
 * @summary Handles document signing workflow with consent recording and KMS integration
 * @description This use case manages the complete document signing workflow, including
 * access validation, consent recording, document preparation (frontend-signed or flattened),
 * KMS signing, signer/envelope updates, audit tracking, and envelope finalization.
 * It ensures proper workflow orchestration and maintains compliance with signing policies.
 */

import {  createNetworkSecurityContext, rethrow } from '@lawprotect/shared-ts';
import { SignatureEnvelopeService } from '@/services/SignatureEnvelopeService';
import { EnvelopeSignerService } from '@/services/EnvelopeSignerService';
import { InvitationTokenService } from '@/services/InvitationTokenService';
import { ConsentService } from '@/services/ConsentService';
import { S3Service } from '@/services/S3Service';
import { KmsService } from '@/services/KmsService';
import { AuditEventService } from '@/services/audit/AuditEventService';
import { EnvelopeHashService } from '@/services/hash/EnvelopeHashService';
import { EnvelopeAccessService } from '@/services/access/EnvelopeAccessService';

import { EntityFactory } from '@/domain/factories/EntityFactory';
import { EnvelopeId } from '@/domain/value-objects/EnvelopeId';
import { SignerId } from '@/domain/value-objects/SignerId';
import { ConsentId } from '@/domain/value-objects/ConsentId';
import { SigningFlowValidationRule } from '@/domain/rules/SigningFlowValidationRule';
import { getDefaultSigningAlgorithm } from '@/domain/enums/SigningAlgorithmEnum';
import { envelopeNotFound } from '@/signature-errors';

import { buildSigningResponse } from '@/services/orchestrators';
import {
  handleSignedDocumentFromFrontend,
  handleFlattenedDocument,
} from '@/services/orchestrators';
import { v4 as uuid } from 'uuid';
import { SignDocumentUseCaseInput, SignDocumentUseCaseResult } from '@/domain/types/usecase/orchestrator/SignDocumentUseCase';

export class SignDocumentUseCase {
  private readonly signingFlowValidationRule = new SigningFlowValidationRule();

  constructor(
    private readonly signatureEnvelopeService: SignatureEnvelopeService,
    private readonly envelopeSignerService: EnvelopeSignerService,
    private readonly invitationTokenService: InvitationTokenService,
    private readonly consentService: ConsentService,
    private readonly s3Service: S3Service,
    private readonly kmsService: KmsService,
    private readonly auditEventService: AuditEventService,
    private readonly envelopeHashService: EnvelopeHashService,
    private readonly envelopeAccessService: EnvelopeAccessService
  ) {}

  /**
   * Signs a document within an envelope with complete workflow orchestration
   * @param input - The signing request containing document data, consent, and security context
   * @returns Promise that resolves to the signing operation result with signature details
   * @throws NotFoundError when envelope or signer is not found
   * @throws AccessDeniedError when user lacks permission to sign the document
   * @throws BadRequestError when signing flow validation fails
   * @example
   * const result = await useCase.execute({
   *   request: { envelopeId: 'env-123', signerId: 'signer-456', consent: {...} },
   *   userId: 'user-789',
   *   securityContext: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', country: 'US' }
   * });
   */
  async execute(input: SignDocumentUseCaseInput): Promise<SignDocumentUseCaseResult> {
    const { request, userId, securityContext } = input;

    try {
      // 1) Boundary -> Value Objects
      const envelopeId: EnvelopeId = EntityFactory.createValueObjects.envelopeId(request.envelopeId);
      const signerId: SignerId = EntityFactory.createValueObjects.signerId(request.signerId);

      // 2) Access validation (owner/external by token)
      const envelope = await this.envelopeAccessService.validateUserAccess(
        envelopeId,
        userId,
        request.invitationToken
      );

      // Best-effort: mark invitation token as "signed" for auditing
      if (request.invitationToken) {
        this.invitationTokenService
          .markTokenAsSigned(request.invitationToken, signerId.getValue(), securityContext)
          .catch(() => undefined);
      }

      // 3) Resolve signer and validate signing flow
      const envelopeWithSigners = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
      if (!envelopeWithSigners) throw envelopeNotFound(`Envelope with ID ${envelopeId.getValue()} not found`);

      const allSigners = envelopeWithSigners.getSigners();
      const signer = allSigners.find(s => s.getId().getValue() === signerId.getValue());
      if (!signer) throw new Error(`Signer with ID ${signerId.getValue()} not found in envelope`);

      this.signingFlowValidationRule.validateSigningFlow(envelope, signer, userId, allSigners);

      // 4) Record consent
      const consentId: ConsentId = EntityFactory.createValueObjects.consentId(uuid());
      const consent = await this.consentService.createConsent(
        {
          id: consentId,
          envelopeId,
          signerId,
          signatureId: undefined,
          consentGiven: request.consent.given,
          consentTimestamp: new Date(request.consent.timestamp),
          consentText: request.consent.text,
          ipAddress: request.consent.ipAddress || securityContext.ipAddress || '',
          userAgent: request.consent.userAgent || securityContext.userAgent || '',
          country: request.consent.country || securityContext.country,
        },
        userId
      );

      // 5) Prepare document (frontend-signed or flattened)
      const prepared = request.signedDocument
        ? await handleSignedDocumentFromFrontend(this.s3Service, {
            envelopeId,
            signerId,
            signedDocumentBase64: request.signedDocument,
          })
        : await handleFlattenedDocument(this.signatureEnvelopeService, this.envelopeHashService, this.s3Service, {
            envelopeId,
            flattenedKey: request.flattenedKey,
            userId,
          });

      const { signedDocumentKey, documentHash } = prepared;

      // 6) KMS signing
      const kmsResult = await this.kmsService.sign({
        documentHash,
        kmsKeyId: process.env.KMS_SIGNER_KEY_ID!,
        algorithm: getDefaultSigningAlgorithm(),
      });

      // 7) Update signer and link consent
      await this.envelopeSignerService.markSignerAsSigned(signerId, {
        documentHash,
        signatureHash: kmsResult.signatureHash,
        signedS3Key: signedDocumentKey,
        kmsKeyId: kmsResult.kmsKeyId,
        algorithm: kmsResult.algorithm,
        ipAddress: securityContext.ipAddress,
        userAgent: securityContext.userAgent,
        consentText: request.consent.text,
      });

      await this.consentService.linkConsentWithSignature(consent.getId(), signerId);

      // 8) Update envelope references and hashes
      await this.envelopeHashService.updateSignedDocument(
        envelopeId,
        signedDocumentKey,
        kmsResult.signatureHash,
        signerId.getValue(),
        userId
      );
      await this.envelopeHashService.updateHashes(
        envelopeId,
        { sourceSha256: undefined, flattenedSha256: undefined, signedSha256: documentHash },
        userId
      );

      // 9) Audit
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
          signedDocumentKey,
          consentId: consent.getId().getValue(),
          documentHash,
          signatureHash: kmsResult.signatureHash,
          kmsKeyId: kmsResult.kmsKeyId,
        },
      });

      // 10) Finalize envelope if completed
      const after = await this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
      const responseEnvelope =
        after?.isCompleted()
          ? await (async () => {
              await this.signatureEnvelopeService.completeEnvelope(envelopeId, userId);
              return this.signatureEnvelopeService.getEnvelopeWithSigners(envelopeId);
            })()
          : after;

      // 11) Build public response (keeps current API)
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
}
