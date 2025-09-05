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
import type { Party } from "@/domain/entities/Party";
import type { EnvelopeId } from "@/domain/value-objects/Ids";
import { IpAddressSchema } from "@/domain/value-objects/Ids";
import { IdempotencyRunner, KmsSigner } from "@/infrastructure";
import type { EventBusPortAdapter } from "@/infrastructure/eventbridge/EventBusPortAdapter";

/**
 * Creates a SigningCommandsPort implementation
 * @param envelopesRepo - The envelope repository for data persistence
 * @param partiesRepo - The parties repository for data persistence
 * @param deps - Dependencies including ID generators, time, and events
 * @returns Configured SigningCommandsPort implementation
 */
export const makeSigningCommandsPort = (
  _envelopesRepo: Repository<Envelope, EnvelopeId>,
  _partiesRepo: Repository<Party, { envelopeId: string; partyId: string }>,
  deps: {
    events: EventBusPortAdapter;
    ids: { ulid(): string };
    time: { now(): number };
    rateLimit?: any;
    signer: KmsSigner;
    idempotency: IdempotencyRunner;
    signingConfig?: {
      defaultKeyId: string;
      allowedAlgorithms?: readonly string[];
    };
    s3Service?: any;
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
      // Validate IP address if provided
      if (command.actor.ip) {
        IpAddressSchema.parse(command.actor.ip);
      }

      // Get and validate envelope
      const envelope = await _envelopesRepo.getById(command.envelopeId);
      if (!envelope) {
        throw new Error(`Envelope not found: ${command.envelopeId}`);
      }

      // Get and validate party
      const party = await _partiesRepo.getById({ 
        envelopeId: command.envelopeId, 
        partyId: command.signerId 
      });
      if (!party) {
        throw new Error(`Party not found: ${command.signerId}`);
      }

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
      // Validate IP address if provided
      if (command.actor.ip) {
        IpAddressSchema.parse(command.actor.ip);
      }

      // Get and validate envelope
      const envelope = await _envelopesRepo.getById(command.envelopeId);
      if (!envelope) {
        throw new Error(`Envelope not found: ${command.envelopeId}`);
      }

      // Get and validate party
      const party = await _partiesRepo.getById({ 
        envelopeId: command.envelopeId, 
        partyId: command.signerId 
      });
      if (!party) {
        throw new Error(`Party not found: ${command.signerId}`);
      }

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
      // Validate IP address if provided
      if (command.actor.ip) {
        IpAddressSchema.parse(command.actor.ip);
      }

      // Get and validate envelope
      const envelope = await _envelopesRepo.getById(command.envelopeId);
      if (!envelope) {
        throw new Error(`Envelope not found: ${command.envelopeId}`);
      }

      // Get and validate party
      const party = await _partiesRepo.getById({ 
        envelopeId: command.envelopeId, 
        partyId: command.signerId 
      });
      if (!party) {
        throw new Error(`Party not found: ${command.signerId}`);
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
      // Validate IP address if provided
      if (command.actor.ip) {
        IpAddressSchema.parse(command.actor.ip);
      }

      // Get and validate envelope
      const envelope = await _envelopesRepo.getById(command.envelopeId);
      if (!envelope) {
        throw new Error(`Envelope not found: ${command.envelopeId}`);
      }

      // Get and validate party
      const party = await _partiesRepo.getById({ 
        envelopeId: command.envelopeId, 
        partyId: command.signerId 
      });
      if (!party) {
        throw new Error(`Party not found: ${command.signerId}`);
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
      // Validate IP address if provided
      if (command.actor.ip) {
        IpAddressSchema.parse(command.actor.ip);
      }

      // Get and validate envelope
      const envelope = await _envelopesRepo.getById(command.envelopeId);
      if (!envelope) {
        throw new Error(`Envelope not found: ${command.envelopeId}`);
      }

      // Use SigningS3Service to create presigned upload URL
      const s3Result = await deps.s3Service?.presignUpload({
        envelopeId: command.envelopeId,
        filename: command.filename,
        contentType: command.contentType,
      });

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
      // Validate IP address if provided
      if (command.actor.ip) {
        IpAddressSchema.parse(command.actor.ip);
      }

      // Get and validate envelope
      const envelope = await _envelopesRepo.getById(command.envelopeId);
      if (!envelope) {
        throw new Error(`Envelope not found: ${command.envelopeId}`);
      }

      // Use SigningS3Service to create presigned download URL
      const s3Result = await deps.s3Service?.presignDownload({
        envelopeId: command.envelopeId,
        filename: "signed-document.pdf",
      });

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