/**
 * @file makeSigningCommandsPort.adapter.ts
 * @summary Factory for SigningCommandsPort
 * @description Creates and configures the SigningCommandsPort implementation,
 * adapting between the app service layer and use cases. Handles dependency injection
 * and type conversions for signing command operations.
 */

import type { Repository, ISODateString } from "@lawprotect/shared-ts";
import type { SigningCommandsPort, SigningConsentCommand, SigningConsentResult, PrepareSigningCommand, PrepareSigningResult, CompleteSigningCommand, CompleteSigningResult, DeclineSigningCommand, DeclineSigningResult, PresignUploadCommand, PresignUploadResult, DownloadSignedDocumentCommand, DownloadSignedDocumentResult } from "../../ports/signing/SigningCommandsPort";
import type { Envelope } from "../../../domain/entities/Envelope";
import type { EnvelopeId } from "../../../domain/value-objects/ids";
import { IdempotencyRunner, KmsSigner, EventBusPortAdapter, NotFoundError, ConflictError, ErrorCodes } from "@lawprotect/shared-ts";
import { badRequest, partyNotFound } from "../../../shared/errors";
import { assertKmsAlgorithmAllowed, assertPdfDigestMatches } from "../../../domain/rules/Signing.rules";
import { assertDownloadAllowed } from "../../../domain/rules/Download.rules";
import { assertCancelDeclineAllowed, assertReasonValid } from "../../../domain/rules/CancelDecline.rules";
import { assertPresignPolicy, buildEvidencePath } from "../../../domain/rules/Evidence.rules";
import { validateSigningOperation } from "./SigningValidationHelpers";
import type { SigningRateLimitService, SigningS3Service } from "../../../domain/types/signing/ServiceInterfaces";
import { PARTY_ROLES, ENVELOPE_STATUSES, SIGNING_DEFAULTS, SIGNING_FILE_LIMITS } from "../../../domain/values/enums";

/**
 * Creates a SigningCommandsPort implementation for document signing operations
 * @param _envelopesRepo - The envelope repository for data persistence
 * @param _partiesRepo - The parties repository for data persistence
 * @param _documentsRepo - The documents repository for digest validation
 * @param deps - Dependencies including ID generators, time, events, and services
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
     * @param command - The signing consent command containing envelope ID, signer ID, and actor context
     * @returns Promise resolving to consent result with event data
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
          meta: { id: deps.ids.ulid(), ts: consentedAt as ISODateString, source: SIGNING_DEFAULTS.EVENT_SOURCE },
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
     * @param command - The signing preparation command containing envelope ID, signer ID, and actor context
     * @returns Promise resolving to preparation result with event data
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
          meta: { id: deps.ids.ulid(), ts: preparedAt as ISODateString, source: SIGNING_DEFAULTS.EVENT_SOURCE },
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
     * @param command - The signing completion command containing digest, algorithm, and signing context
     * @returns Promise resolving to completion result with signature and event data
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
      
      // Get and validate party first
      const party = await _partiesRepo.getById({ 
        envelopeId: command.envelopeId, 
        partyId: command.signerId 
      });
      if (!party) {
        throw partyNotFound({ partyId: command.signerId, envelopeId: command.envelopeId });
      }

      // Check if party has already signed
      if (party.status === "signed") {
        throw new ConflictError("Party has already signed", ErrorCodes.COMMON_CONFLICT);
      }

      // Use KMS to sign the digest
      const signResult = await deps.signer.sign({
        message: Buffer.from(command.digest.value, 'hex'),
        signingAlgorithm: command.algorithm,
        keyId: command.keyId || deps.signingConfig?.defaultKeyId || SIGNING_DEFAULTS.DEFAULT_KEY_ID,
      });

      const signature = Buffer.from(signResult.signature).toString('base64');
      const completedAt = new Date().toISOString();

      // Update party status to signed
      await _partiesRepo.update(command.signerId, {
        status: "signed",
        signedAt: completedAt,
        updatedAt: completedAt as ISODateString,
      });

      // Check if all required signers have now signed
      const parties = await _partiesRepo.listByEnvelope({ 
        tenantId: envelope.tenantId, 
        envelopeId: command.envelopeId 
      });
      const requiredSigners = parties.items.filter((p: any) => p.role === PARTY_ROLES[0]).length;
      const signedCount = parties.items.filter((p: any) => p.role === PARTY_ROLES[0] && p.status === "signed").length;
      
      // Update envelope status based on signing progress
      if (signedCount >= requiredSigners) {
        // All signers have signed - mark as completed
        await _envelopesRepo.update(command.envelopeId, {
          status: ENVELOPE_STATUSES[3] as any, // completed
          updatedAt: completedAt as ISODateString,
        });
      } else if (signedCount > 0) {
        // Some signers have signed - mark as in_progress
        await _envelopesRepo.update(command.envelopeId, {
          status: ENVELOPE_STATUSES[2] as any, // in_progress
          updatedAt: completedAt as ISODateString,
        });
      }

      return {
        completed: true,
        completedAt: completedAt,
        signature: signature,
        keyId: command.keyId || deps.signingConfig?.defaultKeyId || SIGNING_DEFAULTS.DEFAULT_KEY_ID,
        algorithm: command.algorithm,
        event: {
          name: "signing.completed",
          meta: { id: deps.ids.ulid(), ts: completedAt as ISODateString, source: SIGNING_DEFAULTS.EVENT_SOURCE },
          data: {
            envelopeId: command.envelopeId,
            partyId: command.signerId,
            completedAt: completedAt,
            signature: signature,
            keyId: command.keyId || deps.signingConfig?.defaultKeyId || SIGNING_DEFAULTS.DEFAULT_KEY_ID,
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
     * @param command - The signing decline command containing envelope ID, signer ID, reason, and actor context
     * @returns Promise resolving to decline result with event data
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
        status: ENVELOPE_STATUSES[5] as any,
        updatedAt: declinedAt as ISODateString,
      });

      return {
        declined: true,
        declinedAt: declinedAt,
        reason: command.reason,
        event: {
          name: "signing.declined",
          meta: { id: deps.ids.ulid(), ts: declinedAt as ISODateString, source: SIGNING_DEFAULTS.EVENT_SOURCE },
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
     * @param command - The presign upload command containing envelope ID, filename, content type, and actor context
     * @returns Promise resolving to presign result with upload URL and event data
     */
    async presignUpload(command: PresignUploadCommand): Promise<PresignUploadResult> {
      
      // Validate signing operation
      const { envelope } = await validateSigningOperation(
        command,
        _envelopesRepo,
        _partiesRepo
      );
      
      // Apply domain-specific rules for evidence integrity
      assertPresignPolicy(command.contentType, 0, SIGNING_FILE_LIMITS.MAX_FILE_SIZE_BYTES);
      
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
          meta: { id: deps.ids.ulid(), ts: s3Result.expiresAt as ISODateString, source: SIGNING_DEFAULTS.EVENT_SOURCE },
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
     * @param command - The download signed document command containing envelope ID and actor context
     * @returns Promise resolving to download result with download URL and event data
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
          meta: { id: deps.ids.ulid(), ts: s3Result.expiresAt as ISODateString, source: SIGNING_DEFAULTS.EVENT_SOURCE },
          data: {
            envelopeId: command.envelopeId,
            filename: SIGNING_DEFAULTS.DEFAULT_FILENAME,
            contentType: SIGNING_DEFAULTS.DEFAULT_CONTENT_TYPE,
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
