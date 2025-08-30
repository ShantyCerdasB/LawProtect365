/**
 * @file makeUploadsCommandsPort.ts
 * @summary Factory function that implements UploadsCommandsPort
 * @description Adapts calls to the respective use cases for upload operations
 */

import type { EnvelopeRepository } from "@/domain/ports/Envelope";
import type { S3EvidenceStorage } from "@/adapters/s3/S3EvidenceStorage";
import type { S3SignedPdfIngestor } from "@/adapters/s3/S3SignedPdfIngestor";
import type { UploadsCommandsPort, PresignEvidenceCommand, CompleteEvidenceCommand, UploadSignedPdfCommand } from "@/app/ports/uploads";
import { presignEvidence } from "@/use-cases/uploads/PresignEvidence";
import { completeEvidenceMultipart } from "@/use-cases/uploads/CompleteEvidenceMultipart";
import { uploadSignedPdf } from "@/use-cases/uploads/UploadSignedPdf";

/**
 * @description Dependencies for the uploads commands port
 */
export interface UploadsCommandsPortDependencies {
  /** Envelope repository for data access */
  envelopesRepo: EnvelopeRepository;
  /** S3 evidence storage for evidence uploads */
  evidenceStorage: S3EvidenceStorage;
  /** S3 PDF ingestor for signed PDF uploads */
  pdfIngestor: S3SignedPdfIngestor;
  /** ID generator */
  ids: {
    ulid(): string;
  };
}

/**
 * @description Creates an implementation of UploadsCommandsPort
 * @param deps - Dependencies required by the port
 * @returns UploadsCommandsPort implementation
 */
export const makeUploadsCommandsPort = (
  deps: UploadsCommandsPortDependencies
): UploadsCommandsPort => {
  return {
    /**
     * @description Presign evidence upload for an envelope
     */
    async presignEvidence(command: PresignEvidenceCommand) {
      const result = await presignEvidence(
        {
          tenantId: command.tenantId,
          envelopeId: command.envelopeId,
          contentType: command.contentType,
          sizeBytes: command.sizeBytes,
          parts: command.parts,
          sha256: command.sha256,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: deps.envelopesRepo,
          },
          storage: {
            evidence: deps.evidenceStorage,
          },
          ids: deps.ids,
        }
      );

      return {
        uploadId: result.uploadId,
        bucket: result.bucket,
        key: result.key,
        partSize: result.partSize,
        urls: result.urls,
        objectRef: result.objectRef,
      };
    },

    /**
     * @description Complete multipart evidence upload for an envelope
     */
    async completeEvidence(command: CompleteEvidenceCommand) {
      const result = await completeEvidenceMultipart(
        {
          tenantId: command.tenantId,
          envelopeId: command.envelopeId,
          uploadId: command.uploadId,
          bucket: command.bucket,
          key: command.key,
          parts: command.parts,
          objectRef: command.objectRef,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: deps.envelopesRepo,
          },
          storage: {
            evidence: deps.evidenceStorage,
          },
        }
      );

      return {
        objectRef: result.objectRef,
        versionId: result.versionId,
      };
    },

    /**
     * @description Upload signed PDF for an envelope
     */
    async uploadSignedPdf(command: UploadSignedPdfCommand) {
      const result = await uploadSignedPdf(
        {
          tenantId: command.tenantId,
          envelopeId: command.envelopeId,
          contentLength: command.contentLength,
          sha256: command.sha256,
          actor: command.actor,
        },
        {
          repos: {
            envelopes: deps.envelopesRepo,
          },
          storage: {
            pdfIngestor: deps.pdfIngestor,
          },
        }
      );

      return {
        objectRef: result.objectRef,
        versionId: result.versionId,
      };
    },
  };
};
