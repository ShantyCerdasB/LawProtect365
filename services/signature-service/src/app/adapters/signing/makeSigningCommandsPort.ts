/**
 * @file makeSigningCommandsPort.adapter.ts
 * @summary Factory for SigningCommandsPort
 * @description Creates and configures the SigningCommandsPort implementation,
 * adapting between the app service layer and use cases. Handles dependency injection
 * and type conversions for signing command operations.
 */

import type { Repository, ISODateString } from "@lawprotect/shared-ts";
import type { SigningCommandsPort, VerifyOtpCommand, VerifyOtpResult, RequestOtpCommand, RequestOtpResult, CompleteSigningCommand, CompleteSigningResult, DeclineSigningCommand, DeclineSigningResult, PresignUploadCommand, PresignUploadResult, DownloadSignedDocumentCommand, DownloadSignedDocumentResult } from "@/app/ports/signing/SigningCommandsPort";
import type { Envelope } from "@/domain/entities/Envelope";
import type { Party } from "@/domain/entities/Party";
import type { EnvelopeId } from "@/domain/value-objects/Ids";
import type { EventBridgePublisher } from "@/adapters/eventbridge/EventBridgePublisher";
import type { IdempotencyRunner } from "@/adapters/idempotency/IdempotencyRunner";
import type { KmsSigner } from "@/adapters/kms/KmsSigner";
import { executeVerifyOtp } from "@/use-cases/signatures/VerifyOtp";
import { executeRequestOtp } from "@/use-cases/signatures/RequestOtp";
import { executeCompleteSigning } from "@/use-cases/signatures/CompleteSigning";
import { executeDeclineSigning } from "@/use-cases/signatures/DeclineSigning";
import { executePresignUpload } from "@/use-cases/signatures/PresignUpload";
import { executeDownloadSignedDocument } from "@/use-cases/signatures/DownloadSignedDocument";

/**
 * Creates a SigningCommandsPort implementation
 * @param envelopesRepo - The envelope repository for data persistence
 * @param partiesRepo - The parties repository for data persistence
 * @param deps - Dependencies including ID generators, time, and events
 * @returns Configured SigningCommandsPort implementation
 */
export const makeSigningCommandsPort = (
  envelopesRepo: Repository<Envelope, EnvelopeId>,
  partiesRepo: Repository<Party, { envelopeId: string; partyId: string }>,
  deps: {
    events: EventBridgePublisher;
    ids: { ulid(): string };
    time: { now(): number };
    rateLimit?: any;
    signer: KmsSigner;
    idempotency: IdempotencyRunner;
    signingConfig?: {
      defaultKeyId: string;
      allowedAlgorithms?: readonly string[];
    };
    s3?: any;
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
     * Verifies an OTP code for a signer
     * @param command - The OTP verification command
     * @returns Promise resolving to verification result
     */
    async verifyOtp(command: VerifyOtpCommand): Promise<VerifyOtpResult> {
      const result = await executeVerifyOtp(
        {
          envelopeId: command.envelopeId,
          signerId: command.signerId,
          code: command.code,
          token: command.token,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: envelopesRepo,
            parties: partiesRepo,
          },
          events: deps.events,
          ids: deps.ids,
          time: deps.time,
        }
      );

      return {
        verified: true,
        verifiedAt: result.verifiedAt,
        event: {
          name: "otp.verified",
          meta: { id: deps.ids.ulid(), ts: result.verifiedAt, source: "signature-service" },
          data: {
            envelopeId: command.envelopeId,
            partyId: command.signerId,
            verifiedAt: result.verifiedAt,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              locale: "en-US",
            },
          },
        },
      };
    },

    /**
     * Requests an OTP code for a signer
     * @param command - The OTP request command
     * @returns Promise resolving to request result
     */
    async requestOtp(command: RequestOtpCommand): Promise<RequestOtpResult> {
      const result = await executeRequestOtp(
        {
          envelopeId: command.envelopeId,
          signerId: command.signerId,
          delivery: command.delivery,
          token: command.token,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: envelopesRepo,
            parties: partiesRepo,
          },
          events: deps.events,
          ids: deps.ids,
          time: deps.time,
          rateLimit: deps.rateLimit || null,
        }
      );

      return {
        channel: result.channel,
        expiresAt: result.expiresAt,
        cooldownSeconds: result.cooldownSeconds,
        event: {
          name: "otp.requested",
          meta: { id: deps.ids.ulid(), ts: result.expiresAt, source: "signature-service" },
          data: {
            envelopeId: command.envelopeId,
            partyId: command.signerId,
            channel: result.channel,
            expiresAt: result.expiresAt,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              locale: "en-US",
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
      const result = await executeCompleteSigning(
        {
          envelopeId: command.envelopeId,
          signerId: command.signerId,
          digest: command.digest,
          algorithm: command.algorithm,
          keyId: command.keyId,
          otpCode: command.otpCode,
          token: command.token,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: envelopesRepo,
            parties: partiesRepo,
          },
          signer: deps.signer,
          events: deps.events,
          idempotency: deps.idempotency,
          ids: deps.ids,
          time: deps.time,
          signing: {
            defaultKeyId: deps.signingConfig?.defaultKeyId || "",
            allowedAlgorithms: deps.signingConfig?.allowedAlgorithms || [],
          },
        }
      );

      return {
        completed: true,
        completedAt: result.completedAt,
        signature: result.signature,
        keyId: result.keyId,
        algorithm: result.algorithm,
        event: {
          name: "signing.completed",
          meta: { id: deps.ids.ulid(), ts: result.completedAt as ISODateString, source: "signature-service" },
          data: {
            envelopeId: command.envelopeId,
            partyId: command.signerId,
            completedAt: result.completedAt,
            signature: result.signature,
            keyId: result.keyId,
            algorithm: result.algorithm,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              locale: "en-US",
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
      const result = await executeDeclineSigning(
        {
          envelopeId: command.envelopeId,
          signerId: command.signerId,
          reason: command.reason,
          token: command.token,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: envelopesRepo,
            parties: partiesRepo,
          },
          events: deps.events,
          idempotency: deps.idempotency,
          ids: deps.ids,
          time: deps.time,
        }
      );

      return {
        declined: true,
        declinedAt: result.declinedAt,
        reason: result.reason,
        event: {
          name: "signing.declined",
          meta: { id: deps.ids.ulid(), ts: result.declinedAt as ISODateString, source: "signature-service" },
          data: {
            envelopeId: command.envelopeId,
            partyId: command.signerId,
            declinedAt: result.declinedAt,
            reason: result.reason,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              locale: "en-US",
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
      const result = await executePresignUpload(
        {
          envelopeId: command.envelopeId,
          filename: command.filename,
          contentType: command.contentType,
          token: command.token,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: envelopesRepo,
          },
          s3: deps.s3,
          idempotency: deps.idempotency,
          ids: deps.ids,
          time: deps.time,
          config: deps.uploadConfig || {
            uploadBucket: "lawprotect-uploads",
            uploadTtlSeconds: 900,
          },
        }
      );

      return {
        uploadUrl: result.uploadUrl,
        objectKey: result.objectKey,
        expiresAt: result.expiresAt,
        event: {
          name: "signing.presign_upload",
          meta: { id: deps.ids.ulid(), ts: result.expiresAt as ISODateString, source: "signature-service" },
          data: {
            envelopeId: command.envelopeId,
            filename: command.filename,
            contentType: command.contentType,
            objectKey: result.objectKey,
            expiresAt: result.expiresAt,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              locale: "en-US",
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
      const result = await executeDownloadSignedDocument(
        {
          envelopeId: command.envelopeId,
          token: command.token,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: envelopesRepo,
          },
          s3: deps.s3,
          idempotency: deps.idempotency,
          ids: deps.ids,
          time: deps.time,
          config: deps.downloadConfig || {
            signedBucket: "lawprotect-signed",
            downloadTtlSeconds: 900,
          },
        }
      );

      return {
        downloadUrl: result.downloadUrl,
        objectKey: "", // Not available from use case
        expiresAt: result.expiresAt,
        event: {
          name: "signing.download_signed_document",
          meta: { id: deps.ids.ulid(), ts: result.expiresAt as ISODateString, source: "signature-service" },
          data: {
            envelopeId: command.envelopeId,
            filename: result.filename,
            contentType: result.contentType,
            expiresAt: result.expiresAt,
            metadata: {
              ip: command.actor?.ip,
              userAgent: command.actor?.userAgent,
              locale: "en-US",
            },
          },
        },
      };
    },
  };
};
