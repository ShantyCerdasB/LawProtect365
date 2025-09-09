/**
 * @file makeSigningCommandsPort.adapter.ts
 * @summary Factory for SigningCommandsPort
 * @description Creates and configures the SigningCommandsPort implementation,
 * adapting between the app service layer and use cases. Handles dependency injection
 * and type conversions for signing command operations.
 */

import type { Repository, ISODateString } from "@lawprotect/shared-ts";
import type { SigningCommandsPort, SigningConsentCommand, SigningConsentResult, PrepareSigningCommand, PrepareSigningResult, CompleteSigningCommand, CompleteSigningResult, DeclineSigningCommand, DeclineSigningResult, PresignUploadCommand, PresignUploadResult, DownloadSignedDocumentCommand, DownloadSignedDocumentResult } from "@/app/ports/signing/SigningCommandsPort";
import type { Envelope } from "@/domain/entities/Envelope";
import type { EnvelopeId } from "@/domain/value-objects/ids";
import { IdempotencyRunner, KmsSigner, EventBusPortAdapter, NotFoundError, ErrorCodes } from "@lawprotect/shared-ts";
import { badRequest, partyNotFound } from "@/shared/errors";
import { assertKmsAlgorithmAllowed, assertCompletionAllowed, assertPdfDigestMatches } from "../../../domain/rules/Signing.rules";
import { assertDownloadAllowed } from "../../../domain/rules/Download.rules";
import { assertCancelDeclineAllowed, assertReasonValid } from "../../../domain/rules/CancelDecline.rules";
import { assertPresignPolicy, buildEvidencePath } from "../../../domain/rules/Evidence.rules";
import { validateSigningOperation } from "./SigningValidationHelpers";
import type { SigningRateLimitService, SigningS3Service } from "@/domain/types/signing/ServiceInterfaces";

/**
 * Creates a SigningCommandsPort implementation
 * @param envelopesRepo - The envelope repository for data persistence
 * @param partiesRepo - The parties repository for data persistence
 * @param deps - Dependencies including ID generators, time, and events
 * @returns Configured SigningCommandsPort implementation
 */
export const makeSigningCommandsPort = (
  _envelopesRepo: Repository<Envelope, EnvelopeId>,
  _partiesRepo: any, // PartyRepositoryDdb with listByEnvelope method
  _documentsRepo: any, // DocumentRepositoryDdb for digest validation
  deps: {
    events: EventBusPortAdapter;
    ids: { ulid(): string };
    time: { now(): number };
    rateLimit?: SigningRateLimitService;
    signer: KmsSigner;
    idempotency: IdempotencyRunner;
    signingConfig?: {
      defaultKeyId: string;
      allowedAlgorithms?: readonly string[];
    };
    s3Service?: SigningS3Service;
    uploadConfig?: {
      uploadBucket: string;
      uploadTtlSeconds: number;
    };
    downloadConfig?: {
      signedBucket: string;
      downloadTtlSeconds: number;
    };
  }
): SigningCommandsPort => {
  return {
    /**
     * Records signing consent for a signer
     * @param command - The signing consent command
     * @returns Promise resolving to consent result
     */
    async recordSigningConsent(command: SigningConsentCommand): Promise<SigningConsentResult> {
      
      // Validate signing operation
      await validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo,
        command.signerId
      );

      const consentedAt = new Date().toISOString();

      return {
        consented: true,
        consentedAt: consentedAt,
        event: {
          name: "signing.consent.recorded",
          meta: { id: deps.ids.ulid(), ts: consentedAt as ISODateString, source: "signature-service" },
          data: {
            envelopeId: command.envelopeId,
            partyId: command.signerId,
            consentedAt: consentedAt,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              email: command.actor?.email,
              userId: command.actor?.userId,
            },
          },
        },
      };
    },

    /**
     * Prepares signing process for a signer
     * @param command - The signing preparation command
     * @returns Promise resolving to preparation result
     */
    async prepareSigning(command: PrepareSigningCommand): Promise<PrepareSigningResult> {
      
      // Validate signing operation
      await validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo,
        command.signerId
      );

      const preparedAt = new Date().toISOString();

      return {
        prepared: true,
        preparedAt: preparedAt,
        event: {
          name: "signing.prepared",
          meta: { id: deps.ids.ulid(), ts: preparedAt as ISODateString, source: "signature-service" },
          data: {
            envelopeId: command.envelopeId,
            partyId: command.signerId,
            preparedAt: preparedAt,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              email: command.actor?.email,
              userId: command.actor?.userId,
            },
          },
        },
      };
    },

    /**
     * Completes the signing process for a signer
     * @param command - The signing completion command
     * @returns Promise resolving to completion result
     */
    async completeSigning(command: CompleteSigningCommand): Promise<CompleteSigningResult> {
      
      // Validate signing operation
      const { envelope } = await validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo
      );
      
      // Apply domain-specific rules
      if (command.algorithm) {
        assertKmsAlgorithmAllowed(command.algorithm, deps.signingConfig?.allowedAlgorithms);
      }
      
      // Get envelope to get tenantId and documentId (already retrieved above)
      if (!envelope) {
        throw new NotFoundError("Envelope not found", ErrorCodes.COMMON_NOT_FOUND);
      }
      
      // Get actual digest from document for validation
      // Get documents from envelope to validate digest
      const documents = await _documentsRepo.listByEnvelope({ 
        envelopeId: command.envelopeId 
      });
      
      // Find the document that matches the digest being signed
      const targetDocument = documents.items.find((doc: any) => 
        doc.digest && doc.digest.alg === command.digest.alg && doc.digest.value === command.digest.value
      );
      
      if (targetDocument?.digest) {
        assertPdfDigestMatches(command.digest, targetDocument.digest);
      }
      
      // Get actual signing stats from envelope for validation
      const parties = await _partiesRepo.listByEnvelope({ 
        tenantId: envelope.tenantId, 
        envelopeId: command.envelopeId 
      });
      const requiredSigners = parties.items.filter((p: any) => p.role === "signer").length;
      const signedCount = parties.items.filter((p: any) => p.role === "signer" && p.status === "signed").length;
      
      const signingStats = {
        requiredSigners,
        signedCount
      };
      assertCompletionAllowed(signingStats);

      // Get and validate party
      const party = await _partiesRepo.getById({ 
        envelopeId: command.envelopeId, 
        partyId: command.signerId 
      });
      if (!party) {
        throw partyNotFound({ partyId: command.signerId, envelopeId: command.envelopeId });
      }

      // Use KMS to sign the digest
      const signResult = await deps.signer.sign({
        message: Buffer.from(command.digest.value, 'hex'),
        signingAlgorithm: command.algorithm,
        keyId: command.keyId || deps.signingConfig?.defaultKeyId || 'default-key',
      });

      const signature = Buffer.from(signResult.signature).toString('base64');
      const completedAt = new Date().toISOString();

      // Update envelope status to completed
      await _envelopesRepo.update(command.envelopeId, {
        status: "completed" as any,
        updatedAt: completedAt as ISODateString,
      });

      return {
        completed: true,
        completedAt: completedAt,
        signature: signature,
        keyId: command.keyId || deps.signingConfig?.defaultKeyId || 'default-key',
        algorithm: command.algorithm,
        event: {
          name: "signing.completed",
          meta: { id: deps.ids.ulid(), ts: completedAt as ISODateString, source: "signature-service" },
          data: {
            envelopeId: command.envelopeId,
            partyId: command.signerId,
            completedAt: completedAt,
            signature: signature,
            keyId: command.keyId || deps.signingConfig?.defaultKeyId || 'default-key',
            algorithm: command.algorithm,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              email: command.actor?.email,
              userId: command.actor?.userId,
            },
          },
        },
      };
    },

    /**
     * Declines the signing process for a signer
     * @param command - The signing decline command
     * @returns Promise resolving to decline result
     */
    async declineSigning(command: DeclineSigningCommand): Promise<DeclineSigningResult> {
      
      // Validate signing operation
      const { envelope } = await validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo
      );
      
      // Apply domain-specific rules
      assertCancelDeclineAllowed(envelope.status);
      assertReasonValid(command.reason);

      // Get and validate party
      const party = await _partiesRepo.getById({ 
        envelopeId: command.envelopeId, 
        partyId: command.signerId 
      });
      if (!party) {
        throw partyNotFound({ partyId: command.signerId, envelopeId: command.envelopeId });
      }

      const declinedAt = new Date().toISOString();

      // Update envelope status to declined
      await _envelopesRepo.update(command.envelopeId, {
        status: "declined" as any,
        updatedAt: declinedAt as ISODateString,
      });

      return {
        declined: true,
        declinedAt: declinedAt,
        reason: command.reason,
        event: {
          name: "signing.declined",
          meta: { id: deps.ids.ulid(), ts: declinedAt as ISODateString, source: "signature-service" },
          data: {
            envelopeId: command.envelopeId,
            partyId: command.signerId,
            declinedAt: declinedAt,
            reason: command.reason,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              email: command.actor?.email,
              userId: command.actor?.userId,
            },
          },
        },
      };
    },

    /**
     * Creates a presigned URL for file upload
     * @param command - The presign upload command
     * @returns Promise resolving to presign result
     */
    async presignUpload(command: PresignUploadCommand): Promise<PresignUploadResult> {
      
      // Validate signing operation
      const { envelope } = await validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo
      );
      
      // Apply domain-specific rules for evidence integrity
      const maxFileSize = 10 * 1024 * 1024; // 10MB default
      assertPresignPolicy(command.contentType, 0, maxFileSize); // fileSize not available in command
      
      // Build evidence path using domain rules (for future use)
      buildEvidencePath({
        tenantId: envelope.tenantId,
        envelopeId: command.envelopeId,
        file: command.filename
      });

      // Use SigningS3Service to create presigned upload URL
      if (!deps.s3Service) {
        throw badRequest("S3 service not available");
      }
      
      const s3Result = await deps.s3Service.createPresignedUploadUrl(
        command.envelopeId,
        command.filename,
        command.contentType
      );

      return {
        uploadUrl: s3Result.uploadUrl,
        objectKey: s3Result.objectKey,
        expiresAt: s3Result.expiresAt,
        event: {
          name: "signing.presign_upload",
          meta: { id: deps.ids.ulid(), ts: s3Result.expiresAt as ISODateString, source: "signature-service" },
          data: {
            envelopeId: command.envelopeId,
            filename: command.filename,
            contentType: command.contentType,
            objectKey: s3Result.objectKey,
            expiresAt: s3Result.expiresAt,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              email: command.actor?.email,
              userId: command.actor?.userId,
            },
          },
        },
      };
    },

    /**
     * Creates a presigned URL for downloading a signed document
     * @param command - The download signed document command
     * @returns Promise resolving to download result
     */
    async downloadSignedDocument(command: DownloadSignedDocumentCommand): Promise<DownloadSignedDocumentResult> {
      
      // Validate signing operation
      const { envelope } = await validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo
      );
      
      // Apply domain-specific rules
      assertDownloadAllowed(envelope.status);

      // Use SigningS3Service to create presigned download URL
      if (!deps.s3Service) {
        throw badRequest("S3 service not available");
      }
      
      const s3Result = await deps.s3Service.createPresignedDownloadUrl(
        command.envelopeId
      );

      return {
        downloadUrl: s3Result.downloadUrl,
        objectKey: s3Result.objectKey,
        expiresAt: s3Result.expiresAt,
        event: {
          name: "signing.download_signed_document",
          meta: { id: deps.ids.ulid(), ts: s3Result.expiresAt as ISODateString, source: "signature-service" },
          data: {
            envelopeId: command.envelopeId,
            filename: "signed-document.pdf",
            contentType: "application/pdf",
            expiresAt: s3Result.expiresAt,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              email: command.actor?.email,
              userId: command.actor?.userId,
            },
          },
        },
      };
    },
  };
};






